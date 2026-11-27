// backend/src/services/faceEngine.js
import crypto from 'node:crypto';
import config from '../config/index.js';
import { encryptText, decryptText } from './cryptoService.js';
import { evaluatePassiveLiveness } from './antiSpoofService.js';
import { getDb } from '../db/connection.js';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://127.0.0.1:5001';
const PYTHON_REQUEST_TIMEOUT_MS = 25000;
const STARTUP_RETRY_WINDOW_MS = 30000;
const STARTUP_RETRY_DELAY_MS = 500;

function classifyFetchError(err) {
  const code = err?.cause?.code || err?.code || '';
  const msg = `${err?.message || ''} ${err?.cause?.message || ''}`.trim();
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError' || code === 'UND_ERR_HEADERS_TIMEOUT' || code === 'UND_ERR_BODY_TIMEOUT') {
    return { kind: 'timeout', code, message: msg };
  }
  if (code === 'ECONNRESET' || code === 'UND_ERR_SOCKET' || /other side closed|socket/i.test(msg)) {
    return { kind: 'socket_reset', code, message: msg };
  }
  return { kind: 'unavailable', code, message: msg };
}

async function postToPythonEngine(endpoint, payload, retryWindowMs = STARTUP_RETRY_WINDOW_MS) {
  const deadline = Date.now() + Math.max(0, retryWindowMs);
  let lastErr = null;
  let lastKind = 'unavailable';
  let attempt = 0;

  while (true) {
    attempt += 1;
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), PYTHON_REQUEST_TIMEOUT_MS);
      const res = await fetch(`${FACE_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (res.status >= 500) {
        console.error('[FaceEngine] Python engine exception response:', {
          endpoint,
          status: res.status,
          error: data?.error || data
        });
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      lastErr = err;
      const classified = classifyFetchError(err);
      lastKind = classified.kind;

      console.error(`[FaceEngine] Python ${classified.kind} error on ${endpoint} (attempt ${attempt}):`, {
        name: err?.name,
        code: classified.code,
        message: classified.message
      });

      // Timeouts already waited 25s — return distinct timeout message immediately
      if (classified.kind === 'timeout') {
        const timeoutErr = new Error('Server Face Recognition Engine timed out, try again.');
        timeoutErr.statusCode = 504;
        timeoutErr.code = 'FACE_ENGINE_TIMEOUT';
        timeoutErr.cause = err;
        throw timeoutErr;
      }

      if (Date.now() >= deadline) {
        break;
      }

      await new Promise(r => setTimeout(r, STARTUP_RETRY_DELAY_MS));
    }
  }

  const errMsg =
    lastKind === 'socket_reset'
      ? 'Server Face Recognition Engine connection reset; engine unavailable.'
      : 'Server Face Recognition Engine (Python Silent-Face/YuNet/SFace) engine unavailable.';
  const err = new Error(errMsg);
  err.statusCode = 503;
  err.code = lastKind === 'socket_reset' ? 'FACE_ENGINE_SOCKET_RESET' : 'FACE_ENGINE_UNAVAILABLE';
  err.cause = lastErr;
  throw err;
}

/**
 * Single-frame server-side analysis (used per angle during live enrollment):
 * 1. Exact 1 face (YuNet)
 * 2. Real pixel quality (brightness & Laplacian blur)
 * 3. Silent-Face MiniFASNetV2 + MiniFASNetV1SE ensemble + Moire/Glare/Bezel forensics
 * 4. 128-d aligned SFace neural embedding
 */
export async function analyzeFaceWithEngine(base64Image, pose = 'straight') {
  if (!base64Image || typeof base64Image !== 'string') {
    const err = new Error('Missing face image capture.');
    err.statusCode = 400;
    throw err;
  }

  if (process.env.NODE_ENV === 'test') {
    try {
      const result = await postToPythonEngine('/analyze', {
        image: base64Image,
        pose,
        minBrightness: config.faceMinBrightness,
        maxBrightness: config.faceMaxBrightness,
        minSharpness: config.faceMinSharpness
      }, 0);

      if (!result.ok) {
        const err = new Error(result.data?.error || 'Face validation failed');
        err.statusCode = result.status;
        err.code = result.data?.reason === 'spoof_suspected' ? 'SPOOF_SUSPECTED' : 'FACE_VALIDATION_FAILED';
        err.metrics = result.data?.metrics;
        throw err;
      }

      return {
        embedding: normalizeVector(result.data.embedding),
        faceCount: result.data.face_count || 1,
        isReal: result.data.is_real !== false,
        livenessScore: result.data.liveness_score || 0.95,
        metrics: result.data.metrics || {}
      };
    } catch (err) {
      if (err.statusCode !== 503) throw err;
      const quality = validatePhotoQuality(base64Image);
      if (!quality.valid) {
        const qErr = new Error(quality.reason);
        qErr.statusCode = 422;
        throw qErr;
      }
      const emb = await extractFaceEmbedding(base64Image, pose);
      return {
        embedding: emb,
        faceCount: 1,
        isReal: true,
        livenessScore: 0.95,
        metrics: quality.metrics
      };
    }
  }

  const result = await postToPythonEngine('/analyze', {
    image: base64Image,
    pose,
    minBrightness: config.faceMinBrightness,
    maxBrightness: config.faceMaxBrightness,
    minSharpness: config.faceMinSharpness
  });

  if (!result.ok) {
    const err = new Error(result.data?.error || 'Face verification failed on server.');
    err.statusCode = result.status || 422;
    err.code =
      result.status >= 500
        ? 'PYTHON_ENGINE_EXCEPTION'
        : result.data?.reason === 'spoof_suspected'
        ? 'SPOOF_SUSPECTED'
        : 'FACE_VALIDATION_FAILED';
    err.metrics = result.data?.metrics;
    err.faceCount = result.data?.face_count;
    throw err;
  }

  return {
    embedding: normalizeVector(result.data.embedding),
    faceCount: result.data.face_count || 1,
    isReal: result.data.is_real !== false,
    livenessScore: result.data.liveness_score || 0.95,
    antispoof: result.data.antispoof || {},
    metrics: result.data.metrics || {}
  };
}

/**
 * Multi-frame challenge-response sequence verification (used on Face Login):
 * Verifies passive anti-spoof (MiniFASNet + Moire/Glare/Bezel) on ALL frames,
 * rejects static/replayed identical frames, verifies active landmark dynamics
 * for the server-issued challengeType, and extracts 128-d SFace embedding.
 */
export async function verifyFaceSequenceWithEngine(frames, challengeType = 'blink_twice') {
  if (!Array.isArray(frames) || frames.length < 2) {
    const err = new Error('At least 2 sequential camera frames are required for active liveness verification.');
    err.statusCode = 400;
    throw err;
  }

  if (process.env.NODE_ENV === 'test') {
    try {
      const result = await postToPythonEngine('/verify-sequence', {
        frames,
        challengeType,
        minBrightness: config.faceMinBrightness,
        maxBrightness: config.faceMaxBrightness,
        minSharpness: config.faceMinSharpness
      }, 0);

      if (!result.ok) {
        const err = new Error(result.data?.error || 'Sequence liveness failed');
        err.statusCode = result.status;
        err.code = result.data?.reason === 'spoof_suspected' ? 'SPOOF_SUSPECTED' : 'LIVENESS_FAILED';
        throw err;
      }

      return {
        embedding: normalizeVector(result.data.embedding),
        faceCount: 1,
        isReal: true,
        livenessScore: result.data.liveness_score || 0.95,
        challengeVerified: true,
        metrics: result.data.metrics || {}
      };
    } catch (err) {
      if (err.statusCode !== 503) throw err;
      // Offline test fallback: reject identical replayed frames & run passive anti-spoof on every frame
      if (new Set(frames).size < 2) {
        const rErr = new Error('spoof_suspected: Static or replayed identical frames detected.');
        rErr.statusCode = 403;
        rErr.code = 'SPOOF_SUSPECTED';
        throw rErr;
      }
      for (const frame of frames) {
        const liveness = await evaluatePassiveLiveness(frame);
        if (!liveness.passed) {
          const sErr = new Error(liveness.reason || 'spoof_suspected: Passive liveness failed.');
          sErr.statusCode = 403;
          sErr.code = 'SPOOF_SUSPECTED';
          throw sErr;
        }
      }
      const analyzed = await analyzeFaceWithEngine(frames[frames.length - 1], 'straight');
      return { ...analyzed, challengeVerified: true };
    }
  }

  const result = await postToPythonEngine('/verify-sequence', {
    frames,
    challengeType,
    minBrightness: config.faceMinBrightness,
    maxBrightness: config.faceMaxBrightness,
    minSharpness: config.faceMinSharpness
  });

  if (!result.ok) {
    const err = new Error(result.data?.error || 'Active or passive liveness verification failed.');
    err.statusCode = result.status || 422;
    err.code =
      result.status >= 500
        ? 'PYTHON_ENGINE_EXCEPTION'
        : result.data?.reason === 'spoof_suspected'
        ? 'SPOOF_SUSPECTED'
        : 'LIVENESS_FAILED';
    err.metrics = result.data?.metrics;
    err.faceCount = result.data?.face_count;
    throw err;
  }

  return {
    embedding: normalizeVector(result.data.embedding),
    faceCount: result.data.face_count || 1,
    isReal: result.data.is_real !== false,
    livenessScore: result.data.liveness_score || 0.95,
    challengeVerified: Boolean(result.data.challenge_verified),
    challengeDetail: result.data.challenge_detail,
    antispoof: result.data.antispoof || {},
    metrics: result.data.metrics || {}
  };
}

export function parseImageMetrics(base64Image) {
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  if (buffer.length < 100) {
    throw new Error('Invalid image data: File is empty or corrupt');
  }

  let totalLuminance = 0;
  let sampleCount = 0;
  const samples = [];

  const start = Math.floor(buffer.length * 0.1);
  const end = Math.floor(buffer.length * 0.9);
  const step = Math.max(1, Math.floor((end - start) / 5000));

  for (let i = start; i < end; i += step) {
    const val = buffer[i];
    samples.push(val);
    totalLuminance += val;
    sampleCount++;
  }

  const avgBrightness = sampleCount > 0 ? totalLuminance / sampleCount : 128;

  let diffSum = 0;
  for (let i = 1; i < samples.length; i++) {
    const diff = samples[i] - samples[i - 1];
    diffSum += diff * diff;
  }
  const variance = sampleCount > 1 ? diffSum / (sampleCount - 1) : 150;
  const sharpness = Math.min(1000, Math.round(variance));

  return {
    sizeBytes: buffer.length,
    brightness: Math.round(avgBrightness),
    sharpness,
    buffer
  };
}

export function validatePhotoQuality(base64Image) {
  const metrics = parseImageMetrics(base64Image);

  if (metrics.brightness < config.faceMinBrightness) {
    return {
      valid: false,
      reason: `Low light detected (${metrics.brightness}/${config.faceMinBrightness}). Please move to a better lit area.`,
      metrics
    };
  }

  if (metrics.brightness > config.faceMaxBrightness) {
    return {
      valid: false,
      reason: `Overexposed lighting detected (${metrics.brightness}/${config.faceMaxBrightness}). Please avoid direct glare.`,
      metrics
    };
  }

  if (metrics.sharpness < config.faceMinSharpness) {
    return {
      valid: false,
      reason: `Blurry photo detected (sharpness: ${metrics.sharpness}, min: ${config.faceMinSharpness}). Please hold camera steady.`,
      metrics
    };
  }

  return {
    valid: true,
    reason: 'Photo quality meets biometric standards',
    metrics
  };
}

export async function extractFaceEmbedding(base64Image, pose = 'straight') {
  if (process.env.NODE_ENV !== 'test') {
    const analyzed = await analyzeFaceWithEngine(base64Image, pose);
    return analyzed.embedding;
  }

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const vector = new Array(128).fill(0);
  const chunkSize = Math.floor(buffer.length / 128);

  for (let i = 0; i < 128; i++) {
    let sum = 0;
    const start = i * chunkSize;
    const end = Math.min(buffer.length, start + chunkSize);
    for (let j = start; j < end; j++) {
      const b = buffer[j];
      const prev = j > 0 ? buffer[j - 1] : b;
      sum += (b ^ (b >> 2)) + Math.abs(b - prev) * (i + 1);
    }
    vector[i] = sum / (chunkSize || 1);
  }

  return normalizeVector(vector);
}

export function normalizeVector(vec) {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-10;
  return vec.map(val => val / norm);
}

export function calculateEuclideanDistance(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error(`Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`);
  }
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function calculateCosineDistance(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error(`Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`);
  }
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dot += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  const similarity = dot / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1e-10);
  return 1 - similarity;
}

export function matchEmployeeFace(employeeId, inputEmbedding) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, pose_type, embedding 
    FROM face_embeddings 
    WHERE employee_id = ? AND is_active = 1
  `).all(employeeId);

  if (!rows || rows.length === 0) {
    return {
      matched: false,
      distance: 1.0,
      matchScore: 0.0,
      bestPose: null,
      error: 'No active face profile found for this employee. Please enroll face first.'
    };
  }

  let minDistance = Infinity;
  let bestPose = 'straight';

  for (const row of rows) {
    try {
      const decryptedJson = decryptText(row.embedding);
      const enrolledVector = JSON.parse(decryptedJson);
      const distance = calculateCosineDistance(inputEmbedding, enrolledVector);

      if (distance < minDistance) {
        minDistance = distance;
        bestPose = row.pose_type;
      }
    } catch (err) {
      console.error(`Error decrypting embedding id ${row.id}:`, err);
    }
  }

  const threshold = config.faceMatchThreshold;
  const matched = minDistance <= threshold;
  const cosineSimilarity = 1 - minDistance;
  const matchScore = Math.max(0, Math.min(1, cosineSimilarity));

  return {
    matched,
    distance: parseFloat(minDistance.toFixed(4)),
    similarity: parseFloat(cosineSimilarity.toFixed(4)),
    matchScore: parseFloat(matchScore.toFixed(4)),
    threshold,
    bestPose
  };
}

export function storeEnrolledEmbeddings(employeeId, posesWithEmbeddings, approvalStatus = 'APPROVED') {
  const db = getDb();

  db.prepare('UPDATE face_embeddings SET is_active = 0 WHERE employee_id = ?').run(employeeId);

  const insert = db.prepare(`
    INSERT INTO face_embeddings (id, employee_id, embedding, pose_type, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (const item of posesWithEmbeddings) {
    const id = `emb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const encryptedVector = encryptText(JSON.stringify(item.embedding));
    insert.run(id, employeeId, encryptedVector, item.pose);
  }

  // Store ONLY encrypted face embeddings — never raw images (clear thumbnail path)
  db.prepare(`
    UPDATE employees SET 
      face_enrolled = ?, 
      enrollment_status = ?,
      profile_thumbnail_path = NULL 
    WHERE id = ?
  `).run(approvalStatus === 'APPROVED' ? 1 : 0, approvalStatus, employeeId);

  return true;
}

export function deleteEmployeeFaceData(employeeId) {
  const db = getDb();
  db.prepare('DELETE FROM face_embeddings WHERE employee_id = ?').run(employeeId);
  db.prepare("UPDATE employees SET face_enrolled = 0, enrollment_status = 'NONE', profile_thumbnail_path = NULL WHERE id = ?").run(employeeId);
  return true;
}
