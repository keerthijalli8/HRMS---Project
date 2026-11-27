// src/utils/faceDetector.js
// High-performance real-time browser face detection, 68-point facial landmarks, and liveness telemetry via @vladmandic/face-api.
import * as faceapi from '@vladmandic/face-api';

let modelsPromise = null;

// Pre-configured singleton detector options (eliminates GC churn & heap allocations on each video frame)
const FAST_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 256,
  scoreThreshold: 0.15
});

const BACKUP_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.12
});

export async function ensureFaceModelsLoaded() {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      // 1. Initialize GPU WebGL acceleration if available in browser
      if (faceapi.tf) {
        try {
          const current = faceapi.tf.getBackend ? faceapi.tf.getBackend() : null;
          if (current !== 'webgl' && faceapi.tf.setBackend) {
            await faceapi.tf.setBackend('webgl');
          }
          if (typeof faceapi.tf.enableProdMode === 'function') {
            faceapi.tf.enableProdMode();
          }
          if (faceapi.tf.env && typeof faceapi.tf.env().set === 'function') {
            faceapi.tf.env().set('WEBGL_PACK', true);
            faceapi.tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
          }
        } catch (tfErr) {
          console.warn('WebGL initialization note:', tfErr);
        }
      }

      // 2. Load essential models (TinyFaceDetector + 68 landmarks)
      const modelUrl = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUrl)
      ]);

      // Pre-warm expression model in background without blocking video pipeline
      faceapi.nets.faceExpressionNet.loadFromUri(modelUrl).catch(() => {});
      return true;
    })().catch((err) => {
      modelsPromise = null;
      throw err;
    });
  }
  return modelsPromise;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function computeEyeAspectRatio(eyePoints) {
  if (!eyePoints || eyePoints.length < 6) return 0.3;
  const v1 = dist(eyePoints[1], eyePoints[5]);
  const v2 = dist(eyePoints[2], eyePoints[4]);
  const h = dist(eyePoints[0], eyePoints[3]) || 1;
  return (v1 + v2) / (2.0 * h);
}

// Ultra-fast geometric smile computation directly from 68 facial landmarks (<0.02ms)
// Eliminates the heavy 7-class faceExpressionNet CNN from the real-time frame loop
function computeGeometricSmile(mouth, leftEye, rightEye, box) {
  if (!mouth || mouth.length < 7 || !leftEye || !rightEye) return 0;
  const eyeSpan = dist(leftEye[0], rightEye[3]) || 1;
  const mouthWidth = dist(mouth[0], mouth[6]);
  const widthRatio = mouthWidth / eyeSpan;

  // Baseline relaxed mouth width ratio is typically 0.68 - 0.72. Smiling expands to 0.84 - 1.10+
  const widthScore = Math.min(1, Math.max(0, (widthRatio - 0.70) / 0.19));

  // Corner lift relative to lip center
  const cornerY = (mouth[0].y + mouth[6].y) / 2;
  const lipCenterY = (mouth[2].y + (mouth[9] ? mouth[9].y : mouth[2].y)) / 2;
  const liftRatio = Math.max(0, (lipCenterY - cornerY) / (box?.height || 100));
  const liftScore = Math.min(1, liftRatio * 16);

  return Math.min(1, Math.max(0, widthScore * 0.7 + liftScore * 0.3));
}

let consecutiveMisses = 0;

export async function detectLiveFaces(videoElement) {
  if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
    return { faceCount: 0, ready: false };
  }

  await ensureFaceModelsLoaded();

  // Fast single pass at inputSize 256 (~12-18ms with WebGL GPU shaders)
  let detections = await faceapi
    .detectAllFaces(videoElement, FAST_DETECTOR_OPTIONS)
    .withFaceLandmarks(true);

  // If face was not found and we had consecutive misses, try backup pass at inputSize 320
  if (detections.length === 0) {
    consecutiveMisses++;
    if (consecutiveMisses > 2) {
      detections = await faceapi
        .detectAllFaces(videoElement, BACKUP_DETECTOR_OPTIONS)
        .withFaceLandmarks(true);
    }
  } else {
    consecutiveMisses = 0;
  }

  const faceCount = detections.length;
  if (faceCount === 0) {
    return {
      ready: false,
      faceCount: 0,
      box: null,
      allBoxes: []
    };
  }

  // Sort detections by area descending: primary user face is always index 0
  detections.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height));

  const det = detections[0];
  const box = det.detection.box;
  const landmarks = det.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const mouth = landmarks.getMouth();
  const jaw = landmarks.getJawOutline();

  const leftEAR = computeEyeAspectRatio(leftEye);
  const rightEAR = computeEyeAspectRatio(rightEye);
  const ear = (leftEAR + rightEAR) / 2.0;

  // Yaw estimation from nose tip relative to outer eye corners
  const leftOuter = leftEye[0];
  const rightOuter = rightEye[3];
  const noseTip = nose[3];
  const eyeSpan = Math.abs(rightOuter.x - leftOuter.x) || 1;
  const rawYaw = (noseTip.x - leftOuter.x) / eyeSpan;
  const mirroredYaw = 1.0 - rawYaw;

  // Pitch estimation from nose tip relative to eye midpoint and chin (jaw[8])
  const eyeMidY = (leftOuter.y + rightOuter.y) / 2.0;
  const chinY = jaw?.[8]?.y || (mouth[3]?.y ? mouth[3].y + 30 : eyeMidY + 60);
  const pitchRatio = (noseTip.y - eyeMidY) / Math.max(12, chinY - eyeMidY);

  // Mouth aperture/width ratio
  const mouthWidthRatio = mouth[0] && mouth[6] ? dist(mouth[0], mouth[6]) / (box.width || 1) : 0.3;

  // Normalized landmark vector for subtle live micro-motion verification
  const motionSignature = [
    (noseTip.x - box.x) / (box.width || 1),
    (noseTip.y - box.y) / (box.height || 1),
    ear,
    pitchRatio,
    mouthWidthRatio
  ];

  // Geometric landmark-derived smile score (0.00 to 1.00)
  const geometricSmile = computeGeometricSmile(mouth, leftEye, rightEye, box);
  const happyScore = det.expressions?.happy ? Math.max(det.expressions.happy, geometricSmile) : geometricSmile;

  return {
    ready: true,
    faceCount: detections.length,
    allBoxes: detections.map(d => d.detection.box),
    score: det.detection.score,
    box: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    },
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight,
    ear,
    yawRatio: mirroredYaw,
    pitchRatio,
    mouthWidthRatio,
    happyScore,
    motionSignature
  };
}
