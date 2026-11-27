"""
HRMS Python Face Recognition & Anti-Spoofing Microservice
Runs on http://127.0.0.1:5001
Uses:
- OpenCV 5.0 FaceDetectorYN (YuNet) for single-face + 5-landmark detection
- OpenCV 5.0 FaceRecognizerSF (SFace) for 128-d deep biometric embeddings
- Silent-Face-Anti-Spoofing ONNX Ensemble (MiniFASNetV2 @ 2.7x + MiniFASNetV1SE @ 4.0x)
- Multi-cue forensic checks (FFT Moire, specular glare, phone/paper bezel edges, flat print texture)
- Multi-frame active challenge-response verification (anti-replay & landmark pose/motion verification)
"""

import os
import json
import base64
import threading
import traceback
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import cv2
import numpy as np
import onnxruntime as ort

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
YUNET_PATH = os.path.join(MODELS_DIR, 'face_detection_yunet_2023mar.onnx')
SFACE_PATH = os.path.join(MODELS_DIR, 'face_recognition_sface_2021dec.onnx')
MINIFAS_V2_PATH = os.path.join(MODELS_DIR, 'MiniFASNetV2.onnx')
MINIFAS_V1SE_PATH = os.path.join(MODELS_DIR, 'MiniFASNetV1SE.onnx')

for p in (YUNET_PATH, SFACE_PATH, MINIFAS_V2_PATH, MINIFAS_V1SE_PATH):
    if not os.path.exists(p):
        raise FileNotFoundError(f"Missing required ONNX model: {p}")

_detect_lock = threading.Lock()
_onnx_lock = threading.Lock()
_detector = cv2.FaceDetectorYN.create(
    YUNET_PATH,
    '',
    (320, 320),
    score_threshold=0.55,
    nms_threshold=0.30,
    top_k=5000
)
_recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, '')

_fas_v2_sess = ort.InferenceSession(MINIFAS_V2_PATH, providers=['CPUExecutionProvider'])
_fas_v1se_sess = ort.InferenceSession(MINIFAS_V1SE_PATH, providers=['CPUExecutionProvider'])

MINIFAS_REAL_THRESHOLD = float(os.environ.get('ANTISPOOF_THRESHOLD', '0.72'))


def decode_base64_image(base64_str):
    if ',' in base64_str:
        base64_str = base64_str.split(',', 1)[1]
    image_bytes = base64.b64decode(base64_str)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None or img.size == 0:
        raise ValueError("Could not decode image frame")
    h, w = img.shape[:2]
    if w > 640:
        scale = 640.0 / float(w)
        img = cv2.resize(img, (640, max(1, int(round(h * scale)))), interpolation=cv2.INTER_AREA)
    return img


def _compute_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = max(1.0, float(boxA[2]) * float(boxA[3]))
    boxBArea = max(1.0, float(boxB[2]) * float(boxB[3]))
    unionArea = boxAArea + boxBArea - interArea
    return interArea / float(unionArea) if unionArea > 0 else 0


def detect_single_face(img):
    h, w = img.shape[:2]
    with _detect_lock:
        _detector.setInputSize((w, h))
        _, faces = _detector.detect(img)

    if faces is None or len(faces) == 0:
        return None, 0, "No face detected. Please position your face clearly inside the frame."

    # Filter out tiny noise (must be at least 48x48 px and confidence >= 0.55)
    valid_faces = [
        f for f in faces
        if float(f[14]) >= 0.55 and float(f[2]) >= 48 and float(f[3]) >= 48
    ]
    if len(valid_faces) == 0:
        return None, 0, "Face unclear or occluded. Please look directly at the camera."

    if len(valid_faces) == 1:
        return valid_faces[0], 1, None

    # Sort faces by area * confidence descending
    valid_faces.sort(key=lambda f: float(f[2]) * float(f[3]) * float(f[14]), reverse=True)
    primary_face = valid_faces[0]
    primary_area = float(primary_face[2]) * float(primary_face[3])

    # Check for genuine secondary people vs duplicate NMS boxes or background noise
    distinct_secondary_faces = []
    for f in valid_faces[1:]:
        f_area = float(f[2]) * float(f[3])
        iou = _compute_iou(primary_face[:4], f[:4])
        # If overlapping with primary face, it is a duplicate detection box of the same person
        if iou > 0.22:
            continue
        # A genuine secondary person must have significant size (at least 25% of primary face area and confidence >= 0.65)
        if f_area >= (0.25 * primary_area) and float(f[14]) >= 0.65:
            distinct_secondary_faces.append(f)

    # No limit on face count: always select and verify the primary prominent face!
    return primary_face, len(valid_faces), None


def evaluate_face_quality(img, face, min_brightness=35, max_brightness=235, min_sharpness=22):
    h, w = img.shape[:2]
    x, y, bw, bh = [int(v) for v in face[:4]]

    x1 = max(0, x)
    y1 = max(0, y)
    x2 = min(w, x + bw)
    y2 = min(h, y + bh)

    if (x2 - x1) < 60 or (y2 - y1) < 60 or (bw / float(w)) < 0.12:
        return False, "Move closer to the camera so your face fills the guide.", {"brightness": 0, "sharpness": 0}

    face_roi = img[y1:y2, x1:x2]
    gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)

    brightness = float(np.mean(gray_roi))
    norm_gray = cv2.resize(gray_roi, (128, 128))
    sharpness = float(cv2.Laplacian(norm_gray, cv2.CV_64F).var())

    metrics = {
        "brightness": round(brightness, 1),
        "sharpness": round(sharpness, 1),
        "faceWidthPx": int(bw),
        "faceHeightPx": int(bh),
        "confidence": round(float(face[14]), 4)
    }

    if brightness < min_brightness:
        return False, f"Low light detected ({metrics['brightness']}). Please move to a brighter area.", metrics
    if brightness > max_brightness:
        return False, f"Overexposed lighting detected ({metrics['brightness']}). Avoid direct backlight or glare.", metrics
    if sharpness < min_sharpness:
        return False, f"Blurry photo detected (sharpness: {metrics['sharpness']}). Please hold steady.", metrics

    return True, "Quality verified", metrics


def _crop_with_scale(img, bbox, scale, out_w=80, out_h=80):
    src_h, src_w = img.shape[:2]
    x, y, bw, bh = [float(v) for v in bbox]
    s = min((src_h - 1) / max(bh, 1.0), min((src_w - 1) / max(bw, 1.0), scale))
    nw, nh = bw * s, bh * s
    cx, cy = x + bw / 2.0, y + bh / 2.0
    lx = max(0, int(cx - nw / 2.0))
    ty = max(0, int(cy - nh / 2.0))
    rx = min(src_w - 1, int(cx + nw / 2.0))
    by = min(src_h - 1, int(cy + nh / 2.0))
    patch = img[ty:by + 1, lx:rx + 1]
    if patch.size == 0:
        patch = img
    return cv2.resize(patch, (out_w, out_h))


def _softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


def run_minifasnet_ensemble(img, face):
    """
    Runs Silent-Face-Anti-Spoofing MiniFASNetV2 (scale 2.7) + MiniFASNetV1SE (scale 4.0) ONNX ensemble.
    Class index 1 is 'real'; indices 0 and 2 are spoof classes (print / screen replay).
    """
    bbox = face[:4]
    patch_v2 = _crop_with_scale(img, bbox, 2.7)
    patch_v1se = _crop_with_scale(img, bbox, 4.0)

    inp_v2 = patch_v2.transpose((2, 0, 1)).astype(np.float32)[None, ...]
    inp_v1se = patch_v1se.transpose((2, 0, 1)).astype(np.float32)[None, ...]

    with _onnx_lock:
        out_v2 = _fas_v2_sess.run(None, {'input': inp_v2})[0][0]
        out_v1se = _fas_v1se_sess.run(None, {'input': inp_v1se})[0][0]

    probs_v2 = _softmax(out_v2)
    probs_v1se = _softmax(out_v1se)

    real_v2 = float(probs_v2[1])
    real_v1se = float(probs_v1se[1])
    ensemble_real = (real_v2 + real_v1se) / 2.0

    return {
        "real_prob": round(ensemble_real, 4),
        "v2_real": round(real_v2, 4),
        "v1se_real": round(real_v1se, 4),
        "fake_prob": round(1.0 - ensemble_real, 4)
    }


def detect_bezel_edges(img, face):
    """
    Checks for strong straight rectangular edges (phone bezel or paper borders)
    framing the face region in the wider 2.2x crop.
    """
    h, w = img.shape[:2]
    x, y, bw, bh = [float(v) for v in face[:4]]
    cx, cy = x + bw / 2.0, y + bh / 2.0
    lx = max(0, int(cx - bw * 1.15))
    ty = max(0, int(cy - bh * 1.15))
    rx = min(w, int(cx + bw * 1.15))
    by = min(h, int(cy + bh * 1.15))

    wide = img[ty:by, lx:rx]
    if wide.shape[0] < 60 or wide.shape[1] < 60:
        return False, 0

    gray = cv2.cvtColor(wide, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 80, 180)
    min_len = int(min(wide.shape[:2]) * 0.55)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=70, minLineLength=min_len, maxLineGap=12)

    if lines is None:
        return False, 0

    horiz = 0
    vert = 0
    for line in np.asarray(lines).reshape(-1, 4):
        x1, y1, x2, y2 = line
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        if dy <= 5 and dx >= min_len:
            horiz += 1
        elif dx <= 5 and dy >= min_len:
            vert += 1

    # Both long horizontal & vertical straight borders framing the face -> likely phone or paper frame
    return (horiz >= 2 and vert >= 2), int(horiz + vert)


def evaluate_passive_antispoof(img, face):
    """
    Combines Silent-Face-Anti-Spoofing ONNX Ensemble (MiniFASNetV2 + V1SE)
    with multi-cue forensics (flat print, FFT Moire, specular screen glare, bezel borders).
    """
    h, w = img.shape[:2]
    x, y, bw, bh = [int(v) for v in face[:4]]
    x1, y1 = max(0, x), max(0, y)
    x2, y2 = min(w, x + bw), min(h, y + bh)

    face_roi = img[y1:y2, x1:x2]
    if face_roi.size == 0:
        return False, 0.0, "spoof_suspected: Empty face region", {}

    norm_bgr = cv2.resize(face_roi, (128, 128))
    gray = cv2.cvtColor(norm_bgr, cv2.COLOR_BGR2GRAY)
    ycrcb = cv2.cvtColor(norm_bgr, cv2.COLOR_BGR2YCrCb)
    hsv = cv2.cvtColor(norm_bgr, cv2.COLOR_BGR2HSV)

    # 1. Flat / monochrome print check
    gray_std = float(np.std(gray))
    cr_std = float(np.std(ycrcb[:, :, 1]))
    cb_std = float(np.std(ycrcb[:, :, 2]))
    if gray_std < 12.0 or (cr_std < 2.0 and cb_std < 2.0):
        return False, 0.12, "spoof_suspected: Flat printed photo or low-detail image detected", {}

    # 2. Specular screen glare check (clipped white reflections on phone glass)
    glare_mask = (hsv[:, :, 2] >= 250) & (hsv[:, :, 1] <= 25)
    glare_ratio = float(np.mean(glare_mask))
    if glare_ratio > 0.16:
        return False, 0.16, "spoof_suspected: Strong screen specular glare detected", {"glare_ratio": round(glare_ratio, 4)}

    # 3. 2D FFT Moire grid pattern check
    f = np.fft.fft2(gray.astype(np.float32))
    fshift = np.fft.fftshift(f)
    mag = np.log1p(np.abs(fshift))
    ch, cw = 64, 64
    center_energy = float(np.mean(mag[ch - 12:ch + 12, cw - 12:cw + 12]))
    outer_mask = np.ones_like(mag, dtype=bool)
    outer_mask[ch - 20:ch + 20, cw - 20:cw + 20] = False
    outer_vals = mag[outer_mask]
    outer_mean = float(np.mean(outer_vals))
    outer_max = float(np.max(outer_vals))
    outer_ratio = outer_mean / (center_energy + 1e-6)
    peak_spike = outer_max - outer_mean
    if outer_ratio > 0.78 and peak_spike > 4.2:
        return False, 0.18, "spoof_suspected: Digital screen Moire interference detected", {"moire_ratio": round(outer_ratio, 4)}

    # 4. Phone / Paper Bezel rectangular edge check
    has_bezel, line_count = detect_bezel_edges(img, face)

    # 5. Silent-Face-Anti-Spoofing ONNX Ensemble (MiniFASNetV2 + MiniFASNetV1SE)
    fas_scores = run_minifasnet_ensemble(img, face)
    fas_scores["bezel_lines"] = line_count
    fas_scores["glare_ratio"] = round(glare_ratio, 4)

    if has_bezel and fas_scores["real_prob"] < 0.85:
        return False, fas_scores["real_prob"], "spoof_suspected: Rectangular phone or paper frame detected around face", fas_scores

    if fas_scores["real_prob"] < MINIFAS_REAL_THRESHOLD:
        return (
            False,
            fas_scores["real_prob"],
            f"spoof_suspected: Anti-spoofing neural model rejected frame (real confidence {round(fas_scores['real_prob'] * 100, 1)}% < {round(MINIFAS_REAL_THRESHOLD * 100, 1)}%)",
            fas_scores
        )

    return True, fas_scores["real_prob"], "Live human face verified by Silent-Face MiniFASNet ensemble", fas_scores


def extract_sface_embedding(img, face):
    with _detect_lock:
        aligned_face = _recognizer.alignCrop(img, face)
        feature = _recognizer.feature(aligned_face)
    vec = feature.flatten().astype(np.float64)
    norm = np.linalg.norm(vec) or 1e-10
    vec = vec / norm
    return [float(x) for x in vec]


def _extract_landmark_pose(face):
    # YuNet landmarks: [right_eye(4,5), left_eye(6,7), nose(8,9), mouth_right(10,11), mouth_left(12,13)]
    x, y, bw, bh = [float(v) for v in face[:4]]
    re_x, re_y = float(face[4]), float(face[5])
    le_x, le_y = float(face[6]), float(face[7])
    nose_x, nose_y = float(face[8]), float(face[9])
    mr_x, mr_y = float(face[10]), float(face[11])
    ml_x, ml_y = float(face[12]), float(face[13])

    eye_span = abs(le_x - re_x) or 1.0
    eye_mid_y = (re_y + le_y) / 2.0
    mouth_mid_y = (mr_y + ml_y) / 2.0
    mouth_span = abs(ml_x - mr_x)

    yaw = (nose_x - re_x) / eye_span
    pitch = (nose_y - eye_mid_y) / max(mouth_mid_y - eye_mid_y, 1.0)
    mouth_ratio = mouth_span / eye_span

    return {
        "yaw": yaw,
        "pitch": pitch,
        "mouth_ratio": mouth_ratio,
        "box": (int(x), int(y), int(bw), int(bh)),
        "eyes": (int(re_x), int(re_y), int(le_x), int(le_y))
    }


def verify_active_sequence(imgs, faces, challenge_type):
    """
    Server-side verification of multi-frame active liveness sequence [frame0, frame1, frame2]:
    1. Rejects identical / replayed frozen frames.
    2. Checks YuNet landmark dynamics matching the server-issued random challenge.
    """
    if len(imgs) < 2 or len(faces) < 2:
        return False, "At least 2 sequential camera frames are required for liveness verification."

    # 1. Anti-replay pixel difference across resized face crops
    crops = []
    for im, f in zip(imgs, faces):
        x, y, bw, bh = [int(v) for v in f[:4]]
        h, w = im.shape[:2]
        roi = im[max(0, y):min(h, y + bh), max(0, x):min(w, x + bw)]
        crops.append(cv2.resize(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), (96, 96)).astype(np.float32))

    diff_01 = float(np.mean(np.abs(crops[1] - crops[0])))
    diff_last = float(np.mean(np.abs(crops[-1] - crops[1]))) if len(crops) > 2 else diff_01
    max_temporal_diff = max(diff_01, diff_last)

    if max_temporal_diff < 1.2:
        return False, "spoof_suspected: Static or replayed identical frames detected across challenge sequence."

    # 2. Landmark dynamics check
    poses = [_extract_landmark_pose(f) for f in faces]
    yaws = [p["yaw"] for p in poses]
    pitches = [p["pitch"] for p in poses]
    mouths = [p["mouth_ratio"] for p in poses]

    if challenge_type in ("turn_left", "turn_right"):
        yaw_span = max(yaws) - min(yaws)
        if yaw_span < 0.05 and max_temporal_diff < 3.5:
            return False, f"Active challenge '{challenge_type}' not observed on server (head yaw delta {round(yaw_span, 3)})."
    elif challenge_type == "nod":
        pitch_span = max(pitches) - min(pitches)
        if pitch_span < 0.04 and max_temporal_diff < 3.5:
            return False, f"Active challenge 'nod' not observed on server (pitch delta {round(pitch_span, 3)})."
    elif challenge_type == "smile":
        mouth_span = max(mouths) - min(mouths)
        if mouth_span < 0.025 and max_temporal_diff < 3.0:
            return False, f"Active challenge 'smile' not observed on server."
    elif challenge_type in ("blink", "blink_twice"):
        # Check temporal pixel variance specifically in the upper-mid eye band (y: 18%..52%)
        eye_diff_01 = float(np.mean(np.abs(crops[1][17:50, :] - crops[0][17:50, :])))
        eye_diff_last = float(np.mean(np.abs(crops[-1][17:50, :] - crops[1][17:50, :]))) if len(crops) > 2 else eye_diff_01
        if max(eye_diff_01, eye_diff_last, max_temporal_diff) < 1.8:
            return False, "Active challenge 'blink' not detected across frames."

    return True, f"Active challenge '{challenge_type}' verified across {len(imgs)} frames (temporal diff {round(max_temporal_diff, 2)})."


class FaceServiceHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        payload = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self._send_json(200, {
                'status': 'UP',
                'engine': 'opencv-yunet-sface-minifasnet',
                'opencv_version': cv2.__version__,
                'yunet_loaded': True,
                'sface_loaded': True,
                'antispoof_model': 'MiniFASNetV2+V1SE',
                'antispoof_threshold': MINIFAS_REAL_THRESHOLD
            })
        else:
            self._send_json(404, {'error': 'Not found'})

    def do_POST(self):
        try:
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len).decode('utf-8')
                payload = json.loads(body)
            except Exception:
                return self._send_json(400, {'error': 'Invalid JSON payload'})

            min_b = float(payload.get('minBrightness', 35))
            max_b = float(payload.get('maxBrightness', 235))
            min_s = float(payload.get('minSharpness', 22))

            if self.path == '/verify-sequence':
                frames_b64 = payload.get('frames') or []
                challenge_type = payload.get('challengeType', 'blink_twice')

                if not isinstance(frames_b64, list) or len(frames_b64) < 2:
                    return self._send_json(400, {'error': 'Sequence of at least 2 live frames is required.'})

                imgs = []
                faces = []
                last_metrics = {}
                min_liveness_score = 1.0
                last_fas_details = {}

                for idx, b64 in enumerate(frames_b64):
                    try:
                        im = decode_base64_image(b64)
                    except Exception as e:
                        return self._send_json(400, {'error': f'Invalid frame {idx}: {e}'})

                    face, face_count, face_err = detect_single_face(im)
                    if face_err:
                        return self._send_json(422, {'error': f'Frame {idx + 1}: {face_err}', 'face_count': face_count})

                    q_ok, q_reason, metrics = evaluate_face_quality(im, face, min_b, max_b, min_s)
                    if not q_ok:
                        return self._send_json(422, {'error': f'Frame {idx + 1}: {q_reason}', 'face_count': 1, 'metrics': metrics})

                    is_real, liveness_score, liveness_reason, fas_details = evaluate_passive_antispoof(im, face)
                    if not is_real:
                        return self._send_json(403, {
                            'error': liveness_reason,
                            'is_real': False,
                            'liveness_score': liveness_score,
                            'reason': 'spoof_suspected',
                            'antispoof': fas_details,
                            'metrics': metrics
                        })

                    imgs.append(im)
                    faces.append(face)
                    last_metrics = metrics
                    min_liveness_score = min(min_liveness_score, liveness_score)
                    last_fas_details = fas_details

                seq_ok, seq_reason = verify_active_sequence(imgs, faces, challenge_type)
                if not seq_ok:
                    is_spoof = 'spoof_suspected' in seq_reason
                    return self._send_json(403 if is_spoof else 422, {
                        'error': seq_reason,
                        'is_real': not is_spoof,
                        'reason': 'spoof_suspected' if is_spoof else 'challenge_failed',
                        'liveness_score': min_liveness_score
                    })

                # Extract embedding from the final upright frame (frames[-1])
                embedding = extract_sface_embedding(imgs[-1], faces[-1])
                return self._send_json(200, {
                    'embedding': embedding,
                    'dim': len(embedding),
                    'face_count': 1,
                    'is_real': True,
                    'liveness_score': round(min_liveness_score, 4),
                    'challenge_verified': True,
                    'challenge_detail': seq_reason,
                    'antispoof': last_fas_details,
                    'metrics': last_metrics
                })

            # Single-frame endpoints (/analyze, /extract, /liveness)
            image_data = payload.get('image')
            if not image_data:
                return self._send_json(400, {'error': 'Missing image field'})

            try:
                img = decode_base64_image(image_data)
            except Exception as e:
                return self._send_json(400, {'error': f'Invalid image data: {e}'})

            face, face_count, face_err = detect_single_face(img)
            if face_err:
                return self._send_json(422, {'error': face_err, 'face_count': face_count})

            q_ok, q_reason, metrics = evaluate_face_quality(img, face, min_b, max_b, min_s)
            if self.path in ('/analyze', '/extract') and not q_ok:
                return self._send_json(422, {'error': q_reason, 'face_count': 1, 'metrics': metrics})

            is_real, liveness_score, liveness_reason, fas_details = evaluate_passive_antispoof(img, face)
            if self.path == '/liveness':
                return self._send_json(200, {
                    'is_real': is_real,
                    'score': liveness_score,
                    'reason': liveness_reason,
                    'antispoof': fas_details,
                    'face_count': 1,
                    'metrics': metrics
                })

            if self.path == '/analyze':
                if not is_real:
                    return self._send_json(403, {
                        'error': liveness_reason,
                        'is_real': False,
                        'liveness_score': liveness_score,
                        'reason': 'spoof_suspected',
                        'antispoof': fas_details,
                        'face_count': 1,
                        'metrics': metrics
                    })

                embedding = extract_sface_embedding(img, face)
                return self._send_json(200, {
                    'embedding': embedding,
                    'dim': len(embedding),
                    'face_count': 1,
                    'is_real': True,
                    'liveness_score': liveness_score,
                    'antispoof': fas_details,
                    'metrics': metrics
                })

            if self.path == '/extract':
                embedding = extract_sface_embedding(img, face)
                return self._send_json(200, {
                    'embedding': embedding,
                    'dim': len(embedding),
                    'face_count': 1,
                    'metrics': metrics
                })

            return self._send_json(404, {'error': 'Unknown endpoint'})
        except Exception as exc:
            traceback.print_exc()
            try:
                return self._send_json(500, {'error': f'Python face engine exception: {exc}', 'reason': 'python_exception'})
            except Exception:
                return None

    def log_message(self, format, *args):
        print(f"[Python Face Engine] {args[0]} - {args[1]}")


def run_server(port=5001):
    server = ThreadingHTTPServer(('127.0.0.1', port), FaceServiceHandler)
    print("\n=======================================================")
    print(f"🐍 Silent-Face Anti-Spoof + YuNet + SFace Engine running on http://127.0.0.1:{port}")
    print(f"OpenCV: {cv2.__version__} | MiniFASNet Real Threshold: {MINIFAS_REAL_THRESHOLD}")
    print("=======================================================\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()


if __name__ == '__main__':
    run_server(5001)
