# HRMS Hardened Face Authentication & Anti-Spoofing Module

A production-hardened biometric Face Authentication **2FA** module for HRMS built with **React 19 + Vite**, **Node.js / Express + SQLite**, and a **Python ONNX Biometric Engine** (**OpenCV YuNet** + **SFace 128-d** + **Silent-Face-Anti-Spoofing MiniFASNetV2 & MiniFASNetV1SE**).

---

## Architecture Overview

1. **Frontend Capture & Active Liveness (`src/components/WebcamCapture.jsx`, `src/components/LivenessChallenge.jsx`)**:
   - Browser `face-api.js` (TinyFaceDetector + 68-point Landmarks + Expressions) enforces a single centered face (`faceCount === 1`) and guides the user through a **server-assigned randomized challenge** (`blink_twice`, `turn_left`, `turn_right`, `smile`, `nod`) while counting down a **45s one-time token**.
   - Captures a 3-frame temporal sequence `[baselineFrame, peakChallengeFrame, finalStraightFrame]` for server verification — no client liveness flag is ever trusted.
   - Binds every API call with a deterministic `X-Device-Hash` device fingerprint (`src/utils/deviceFingerprint.js`).

2. **Node.js / Express Security & API Layer (`backend/src/routes/authRoutes.js`, `faceRoutes.js`, `auditRoutes.js`)**:
   - Issues short-lived **one-time challenge tokens** (`challenge_tokens`, `CHALLENGE_TTL_SECONDS=45`, atomically consumed via `UPDATE ... WHERE used = 0`).
   - Issues short-lived **device-bound JWTs** (`15m` expiry) validating `X-Device-Hash` on every authenticated request.
   - Stores **ONLY AES-256-GCM encrypted 128-d face embeddings** in SQLite (`face_embeddings`) — **never raw photos**.
   - Requires **6-digit OTP** verification or **HR Admin approval** (`PENDING_HR` -> `/api/face/approve/:employeeId`) during live enrollment.
   - Locks accounts after **5** failed face/spoof attempts (`MAX_FACE_LOGIN_ATTEMPTS=5`), dispatches **HR Security Alerts** (`hr_notifications`), and supports a **6-digit OTP fallback** when not locked.

3. **Python Anti-Spoofing & Embedding Engine (`python_service/face_service.py`)**:
   - `POST /analyze`: Runs per-frame checks during live enrollment (YuNet single-face check, specular glare, 2D-FFT Moiré interference, Hough screen/paper bezel edge detection, **MiniFASNetV2 + MiniFASNetV1SE** ONNX ensemble, and SFace 128-d embedding).
   - `POST /verify-sequence`: Verifies active temporal motion across `[frame0, frame1, frame2]`, rejects identical/static replayed frames, runs passive Silent-Face anti-spoofing ensemble across frames, and extracts the 128-d embedding from the final frame.

---

## Threshold Recommendations

| Parameter | Value | Description |
|---|---|---|
| `ANTISPOOF_THRESHOLD` | `0.72` | Combined MiniFASNetV2 (2.7x crop) + MiniFASNetV1SE (4.0x crop) real-face probability threshold |
| `FACE_MATCH_THRESHOLD` | `0.48` | Maximum SFace **cosine distance** (`cosine_similarity >= 0.52` required to authenticate) |
| `CHALLENGE_TTL_SECONDS` | `45` | One-time challenge token expiry window (`30–60s` recommended) |
| `JWT_EXPIRES_IN` | `15m` | Short-lived session JWT bound to `X-Device-Hash` |
| `OTP_TTL_SECONDS` | `180` | 6-digit fallback & enrollment OTP validity (3 minutes) |
| `MAX_FACE_LOGIN_ATTEMPTS` | `5` | Consecutive failures before account lock & HR alert |

---

## Quickstart & Automated Tests

```bash
# 1. Install Python dependencies (OpenCV + ONNX Runtime)
pip install -r python_service/requirements.txt

# 2. Install Node dependencies & run attack/integration suite
npm install
npm test

# 3. Run Development Servers (Express :5000 + Python ONNX :5001 + Vite :5174)
npm run dev
```

### HTTPS Configuration
Set `SSL_CERT_PATH` and `SSL_KEY_PATH` in `.env` to boot the Express API directly over TLS (`https://localhost:5000`).
