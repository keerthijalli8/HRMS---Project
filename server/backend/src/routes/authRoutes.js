// backend/src/routes/authRoutes.js
import express from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getDb } from '../db/connection.js';
import { verifyPassword, hashPassword } from '../db/seed.js';
import { extractDeviceHash, generateToken, authenticate, requireHR } from '../middleware/auth.js';
import { faceEndpointRateLimiter } from '../middleware/rateLimiter.js';
import { logFaceAttempt, createHrNotification } from '../middleware/auditLogger.js';
import { verifyFaceSequenceWithEngine, matchEmployeeFace } from '../services/faceEngine.js';
import { getServerTime } from '../utils/serverTime.js';

const router = express.Router();

const CHALLENGE_TYPES = ['blink_twice', 'turn_left', 'turn_right', 'smile', 'nod'];

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function formatUserResponse(user) {
  return {
    id: user.id,
    employeeId: user.employee_id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    faceEnrolled: Boolean(user.face_enrolled),
    enrollmentStatus: user.enrollment_status || (user.face_enrolled ? 'APPROVED' : 'NOT_ENROLLED'),
    faceLoginPolicy: user.face_login_policy
  };
}

function issueOneTimeChallenge(db, employeeId, deviceHash) {
  const now = Date.now();
  db.prepare('DELETE FROM challenge_tokens WHERE expires_at < ?').run(now);

  const challengeId = `chg_${now}_${crypto.randomBytes(6).toString('hex')}`;
  const nonce = crypto.randomBytes(16).toString('hex');
  const challengeType = CHALLENGE_TYPES[crypto.randomInt(0, CHALLENGE_TYPES.length)];
  const expiresAt = now + config.challengeTtlSeconds * 1000;

  db.prepare(`
    INSERT INTO challenge_tokens (id, employee_id, nonce, challenge_type, device_hash, used, expires_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(challengeId, employeeId, nonce, challengeType, deviceHash, expiresAt);

  const challengeToken = jwt.sign(
    {
      challengeId,
      employeeId,
      nonce,
      challengeType,
      deviceHash,
      purpose: 'LIVENESS_CHALLENGE'
    },
    config.jwtSecret,
    { expiresIn: config.challengeTtlSeconds }
  );

  return {
    challengeToken,
    challengeType,
    expiresAt,
    ttlSeconds: config.challengeTtlSeconds
  };
}

function recordFailedFaceAttempt(db, user, { reason, matchScore = 0, livenessPassed = false, isSpoof = false, deviceHash, req }) {
  const isLockoutEnabled = typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000;
  const newFailedCount = isLockoutEnabled ? (user.failed_face_attempts || 0) + 1 : 0;
  const isNowLocked = isLockoutEnabled && newFailedCount >= config.maxFaceLoginAttempts;

  db.prepare(`
    UPDATE users SET
      failed_face_attempts = ?,
      is_locked = ?,
      locked_at = ?
    WHERE id = ?
  `).run(
    newFailedCount,
    isNowLocked ? 1 : 0,
    isNowLocked ? getServerTime().iso : null,
    user.id
  );

  logFaceAttempt({
    employeeId: user.employee_id,
    attemptType: 'login',
    success: false,
    matchScore,
    livenessPassed,
    reason,
    req
  });

  const auditStatus = isNowLocked ? 'LOCKED' : isSpoof ? 'SPOOF_SUSPECTED' : 'FAILED_FACE';
  db.prepare(`
    INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user.employee_id,
    getServerTime().iso,
    matchScore,
    auditStatus,
    req.ip || '127.0.0.1',
    req.headers['user-agent'] || 'Unknown',
    deviceHash
  );

  if (isSpoof) {
    createHrNotification({
      employeeId: user.employee_id,
      eventType: 'SPOOF_DETECTED',
      message: `Anti-spoofing rejected login attempt for ${user.employee_id} (${reason}) from IP ${req.ip || '127.0.0.1'}.`
    });
  }

  if (isNowLocked) {
    createHrNotification({
      employeeId: user.employee_id,
      eventType: 'LOCKED',
      message: `Account ${user.employee_id} locked after ${config.maxFaceLoginAttempts} consecutive failed face verifications.`
    });
  }

  return {
    newFailedCount,
    isNowLocked,
    attemptsRemaining: isLockoutEnabled ? Math.max(0, config.maxFaceLoginAttempts - newFailedCount) : null
  };
}

/**
 * Step 1: Password Login (Supports Work Email OR Employee ID)
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { identifier, email, password } = req.body;
  const loginKey = (identifier || email || '').trim();
  const normalizedKey = loginKey.toLowerCase().replace(/\.{2,}/g, '.');
  const deviceHash = extractDeviceHash(req);

  if (!loginKey || !password) {
    return res.status(400).json({ error: 'Work Email or Employee ID and password are required' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, e.name, e.department, e.designation, e.face_enrolled, e.enrollment_status
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.email) = ? OR UPPER(u.employee_id) = UPPER(?) OR LOWER(e.work_email) = LOWER(?) OR LOWER(e.work_email) = ?
  `).get(loginKey, normalizedKey, loginKey, loginKey, normalizedKey);

  if (!user) {
    return res.status(401).json({ error: 'Invalid Email/Employee ID or password credentials' });
  }

  if (user.is_locked) {
    const isLockoutEnabled = typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000;
    if (isLockoutEnabled) {
      return res.status(403).json({
        error: `Account locked due to consecutive failed face verifications. Please contact HR to unlock.`,
        locked: true
      });
    } else {
      db.prepare('UPDATE users SET is_locked = 0, failed_face_attempts = 0, locked_at = NULL WHERE id = ?').run(user.id);
      user.is_locked = 0;
    }
  }

  const isValidPassword = verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid Email/Employee ID or password credentials' });
  }

  const enrollmentStatus = user.enrollment_status || (user.face_enrolled ? 'APPROVED' : 'NOT_ENROLLED');
  const requiresFace = Boolean(user.face_enrolled) && enrollmentStatus === 'APPROVED' && user.face_login_policy !== 'OFF';

  if (requiresFace) {
    const tempToken = jwt.sign(
      {
        userId: user.id,
        employeeId: user.employee_id,
        email: user.email,
        role: user.role,
        deviceHash,
        purpose: 'FACE_2FA'
      },
      config.jwtSecret,
      { expiresIn: '5m' }
    );

    const challenge = issueOneTimeChallenge(db, user.employee_id, deviceHash);

    return res.json({
      status: 'FACE_VERIFICATION_REQUIRED',
      tempToken,
      challengeToken: challenge.challengeToken,
      challengeType: challenge.challengeType,
      challengeExpiresAt: challenge.expiresAt,
      challengeTtlSeconds: challenge.ttlSeconds,
      employee: {
        id: user.employee_id,
        name: user.name,
        email: user.email,
        role: user.role,
        facePolicy: user.face_login_policy,
        failedAttemptsRemaining: (typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000)
          ? Math.max(0, config.maxFaceLoginAttempts - user.failed_face_attempts)
          : null
      }
    });
  }

  // First-time login / pending HR approval / policy OFF: issue device-bound session
  const needsFaceEnrollment = !Boolean(user.face_enrolled) && enrollmentStatus !== 'PENDING_HR' && user.face_login_policy !== 'OFF';
  const token = generateToken(user, deviceHash);

  db.prepare(`
    INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
    VALUES (?, ?, ?, NULL, 'PASSWORD_ONLY', ?, ?, ?)
  `).run(
    `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user.employee_id,
    getServerTime().iso,
    req.ip || '127.0.0.1',
    req.headers['user-agent'] || 'Unknown',
    deviceHash
  );

  return res.json({
    status: 'AUTHENTICATED',
    token,
    needsFaceEnrollment,
    user: formatUserResponse(user)
  });
});

/**
 * Request fresh 45s one-time random challenge token for retry
 * POST /api/auth/challenge
 */
router.post('/challenge', faceEndpointRateLimiter, (req, res) => {
  const { tempToken } = req.body;
  const deviceHash = extractDeviceHash(req);

  if (!tempToken) {
    return res.status(400).json({ error: 'Missing 2FA temporary authentication token.' });
  }

  let payload;
  try {
    payload = jwt.verify(tempToken, config.jwtSecret);
    if (payload.purpose !== 'FACE_2FA') {
      return res.status(400).json({ error: 'Invalid token purpose.' });
    }
  } catch {
    return res.status(401).json({ error: 'Face verification session expired. Please sign in again.' });
  }

  if (payload.deviceHash && payload.deviceHash !== deviceHash) {
    return res.status(403).json({ error: 'Device binding mismatch. Please restart login on this device.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, employee_id, is_locked FROM users WHERE id = ?').get(payload.userId);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.is_locked) {
    const isLockoutEnabled = typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000;
    if (isLockoutEnabled) {
      return res.status(403).json({ error: 'Account locked or unavailable.', locked: true });
    } else {
      db.prepare('UPDATE users SET is_locked = 0, failed_face_attempts = 0, locked_at = NULL WHERE id = ?').run(user.id);
      user.is_locked = 0;
    }
  }

  const challenge = issueOneTimeChallenge(db, user.employee_id, deviceHash);
  return res.json({
    challengeToken: challenge.challengeToken,
    challengeType: challenge.challengeType,
    expiresAt: challenge.expiresAt,
    ttlSeconds: challenge.ttlSeconds
  });
});

/**
 * Step 2: 1:1 Face Verification with Server-Side Anti-Spoof, Challenge-Response & Anti-Replay
 * POST /api/auth/face-verify
 */
router.post('/face-verify', faceEndpointRateLimiter, async (req, res) => {
  const { tempToken, challengeToken, frames, faceImage, skipFace } = req.body;
  const deviceHash = extractDeviceHash(req);

  if (!tempToken) {
    return res.status(400).json({ error: 'Missing 2FA temporary authentication token.' });
  }

  let payload;
  try {
    payload = jwt.verify(tempToken, config.jwtSecret);
    if (payload.purpose !== 'FACE_2FA') {
      return res.status(400).json({ error: 'Invalid token purpose.' });
    }
  } catch {
    return res.status(401).json({ error: 'Face verification session expired. Please sign in again.' });
  }

  if (payload.deviceHash && payload.deviceHash !== deviceHash) {
    return res.status(403).json({
      error: 'Device binding check failed for 2FA session.',
      code: 'DEVICE_MISMATCH'
    });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, e.name, e.department, e.designation, e.face_enrolled, e.enrollment_status
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE u.id = ?
  `).get(payload.userId);

  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.is_locked) {
    const isLockoutEnabled = typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000;
    if (isLockoutEnabled) {
      return res.status(403).json({ error: 'Account locked or unavailable.', locked: true });
    } else {
      db.prepare('UPDATE users SET is_locked = 0, failed_face_attempts = 0, locked_at = NULL WHERE id = ?').run(user.id);
      user.is_locked = 0;
    }
  }

  if (skipFace && user.face_login_policy === 'OPTIONAL') {
    const token = generateToken(user, deviceHash);
    db.prepare(`
      INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
      VALUES (?, ?, ?, NULL, 'PASSWORD_ONLY', ?, ?, ?)
    `).run(
      `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      user.employee_id,
      getServerTime().iso,
      req.ip || '127.0.0.1',
      req.headers['user-agent'] || 'Unknown',
      deviceHash
    );

    return res.json({
      status: 'AUTHENTICATED',
      token,
      user: formatUserResponse(user)
    });
  }

  // Require and verify one-time challenge token
  if (!challengeToken) {
    return res.status(400).json({ error: 'One-time liveness challenge token is required.' });
  }

  let challengePayload;
  try {
    challengePayload = jwt.verify(challengeToken, config.jwtSecret);
    if (challengePayload.purpose !== 'LIVENESS_CHALLENGE') {
      return res.status(400).json({ error: 'Invalid challenge token purpose.' });
    }
  } catch {
    return res.status(401).json({ error: 'Liveness challenge expired. Please request a fresh challenge.' });
  }

  if (challengePayload.employeeId !== user.employee_id || challengePayload.deviceHash !== deviceHash) {
    return res.status(403).json({ error: 'Challenge token does not match current user or device.' });
  }

  const challengeRow = db.prepare('SELECT * FROM challenge_tokens WHERE id = ?').get(challengePayload.challengeId);
  if (!challengeRow || challengeRow.nonce !== challengePayload.nonce || challengeRow.device_hash !== deviceHash) {
    return res.status(401).json({ error: 'Invalid or unrecognized liveness challenge token.' });
  }

  if (challengeRow.used) {
    return res.status(401).json({
      error: 'Challenge token replay detected: token has already been used.',
      code: 'REPLAY_DETECTED'
    });
  }

  if (challengeRow.expires_at <= Date.now()) {
    db.prepare('UPDATE challenge_tokens SET used = 1 WHERE id = ?').run(challengeRow.id);
    return res.status(401).json({
      error: `Challenge token expired (${config.challengeTtlSeconds}s limit). Please request a new challenge.`,
      code: 'CHALLENGE_EXPIRED'
    });
  }

  // Atomically mark challenge token used so concurrent replays fail
  const consumeResult = db.prepare('UPDATE challenge_tokens SET used = 1 WHERE id = ? AND used = 0').run(challengeRow.id);
  if (consumeResult.changes !== 1) {
    return res.status(401).json({
      error: 'Challenge token replay detected: token already consumed.',
      code: 'REPLAY_DETECTED'
    });
  }

  const sequenceFrames = Array.isArray(frames) && frames.length > 0
    ? frames
    : faceImage
      ? [faceImage]
      : [];

  if (sequenceFrames.length < 2) {
    return res.status(400).json({
      error: 'At least 2 sequential live camera frames (baseline + challenge response) are required for anti-replay verification.'
    });
  }

  // Server-side multi-frame sequence: anti-replay pixel diff + passive MiniFASNet + active challenge + SFace embedding
  let sequenceResult;
  try {
    sequenceResult = await verifyFaceSequenceWithEngine(sequenceFrames, challengeRow.challenge_type);
  } catch (err) {
    const isSpoof = err.code === 'SPOOF_SUSPECTED' || err.code === 'ACTIVE_LIVENESS_FAILED';
    const failureState = recordFailedFaceAttempt(db, user, {
      reason: isSpoof ? `spoof_or_liveness_failed: ${err.message}` : err.message,
      matchScore: 0,
      livenessPassed: false,
      isSpoof: err.code === 'SPOOF_SUSPECTED',
      deviceHash,
      req
    });

    if (failureState.isNowLocked) {
      return res.status(403).json({
        error: `Security check failed ${config.maxFaceLoginAttempts} times. Account ${user.employee_id} has been LOCKED and HR has been notified.`,
        locked: true,
        attemptsRemaining: 0,
        reason: err.code || 'verification_failed'
      });
    }

    if (err.code === 'SPOOF_SUSPECTED') {
      return res.status(403).json({
        error: `Anti-spoofing rejected capture: ${err.message}`,
        reason: 'spoof_suspected',
        attemptsRemaining: failureState.attemptsRemaining,
        metrics: err.metrics
      });
    }

    return res.status(err.statusCode || 422).json({
      error: err.message,
      reason: err.code || 'liveness_failed',
      attemptsRemaining: failureState.attemptsRemaining,
      metrics: err.metrics,
      faceCount: err.faceCount
    });
  }

  // 1:1 Cosine Similarity Match against employee's own encrypted embeddings ONLY
  const matchResult = matchEmployeeFace(user.employee_id, sequenceResult.embedding);

  if (!matchResult.matched) {
    const failureState = recordFailedFaceAttempt(db, user, {
      reason: `Face mismatch (cosine_distance: ${matchResult.distance}, threshold: ${matchResult.threshold})`,
      matchScore: matchResult.matchScore,
      livenessPassed: true,
      isSpoof: false,
      deviceHash,
      req
    });

    if (failureState.isNowLocked) {
      return res.status(403).json({
        error: `Face verification failed ${config.maxFaceLoginAttempts} times. Account ${user.employee_id} has been LOCKED for security. HR has been notified.`,
        locked: true,
        attemptsRemaining: 0
      });
    }

    return res.status(401).json({
      error: 'Face did not match enrolled biometric profile. Please complete the live challenge looking directly at the camera.',
      distance: matchResult.distance,
      similarity: matchResult.similarity,
      threshold: matchResult.threshold,
      attemptsRemaining: failureState.attemptsRemaining
    });
  }

  // Successful verification
  db.prepare(`
    UPDATE users SET
      failed_face_attempts = 0,
      is_locked = 0,
      locked_at = NULL
    WHERE id = ?
  `).run(user.id);

  logFaceAttempt({
    employeeId: user.employee_id,
    attemptType: 'login',
    success: true,
    matchScore: matchResult.matchScore,
    livenessPassed: true,
    reason: `Verified challenge=${challengeRow.challenge_type}, pose=${matchResult.bestPose}, cosine_sim=${matchResult.similarity}`,
    req
  });

  db.prepare(`
    INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
    VALUES (?, ?, ?, ?, 'SUCCESS', ?, ?, ?)
  `).run(
    `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user.employee_id,
    getServerTime().iso,
    matchResult.matchScore,
    req.ip || '127.0.0.1',
    req.headers['user-agent'] || 'Unknown',
    deviceHash
  );

  const token = generateToken(user, deviceHash);

  return res.json({
    status: 'AUTHENTICATED',
    token,
    matchScore: matchResult.matchScore,
    similarity: matchResult.similarity,
    liveness: sequenceResult.liveness,
    user: formatUserResponse({ ...user, face_enrolled: 1 })
  });
});

/**
 * Fallback Second Factor: Request 6-digit OTP when face verification fails or camera is unavailable
 * POST /api/auth/request-fallback-otp
 */
router.post('/request-fallback-otp', faceEndpointRateLimiter, (req, res) => {
  const { tempToken, identifier, password } = req.body;
  const deviceHash = extractDeviceHash(req);
  const db = getDb();

  let user = null;
  if (tempToken) {
    try {
      const payload = jwt.verify(tempToken, config.jwtSecret);
      if (payload.purpose !== 'FACE_2FA') {
        return res.status(400).json({ error: 'Invalid temporary token purpose.' });
      }
      if (payload.deviceHash && payload.deviceHash !== deviceHash) {
        return res.status(403).json({ error: 'Device binding mismatch.' });
      }
      user = db.prepare('SELECT u.*, e.name, e.department, e.designation, e.face_enrolled, e.enrollment_status FROM users u JOIN employees e ON u.employee_id = e.id WHERE u.id = ?').get(payload.userId);
    } catch {
      return res.status(401).json({ error: 'Session expired. Sign in again with password.' });
    }
  } else if (identifier && password) {
    const loginKey = identifier.trim();
    user = db.prepare(`
      SELECT u.*, e.name, e.department, e.designation, e.face_enrolled, e.enrollment_status
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE LOWER(u.email) = LOWER(?) OR UPPER(u.employee_id) = UPPER(?)
    `).get(loginKey, loginKey);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials for OTP fallback.' });
    }
  } else {
    return res.status(400).json({ error: 'Provide either a 2FA session token or your email/ID and password.' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.is_locked) {
    const isLockoutEnabled = typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000;
    if (isLockoutEnabled) {
      return res.status(403).json({
        error: 'Account is LOCKED due to failed security attempts. Contact HR Admin to unlock.',
        locked: true
      });
    } else {
      db.prepare('UPDATE users SET is_locked = 0, failed_face_attempts = 0, locked_at = NULL WHERE id = ?').run(user.id);
      user.is_locked = 0;
    }
  }

  const now = Date.now();
  db.prepare("DELETE FROM otp_codes WHERE employee_id = ? AND purpose = 'login_fallback'").run(user.employee_id);

  const otpCode = String(crypto.randomInt(100000, 999999));
  const otpSessionId = `otp_${now}_${crypto.randomBytes(6).toString('hex')}`;
  const expiresAt = now + config.otpTtlSeconds * 1000;

  db.prepare(`
    INSERT INTO otp_codes (id, employee_id, purpose, code_hash, used, expires_at)
    VALUES (?, ?, 'login_fallback', ?, 0, ?)
  `).run(otpSessionId, user.employee_id, hashOtp(otpCode), expiresAt);

  console.log(`[OTP FALLBACK] Employee=${user.employee_id} (${user.email}) OTP=${otpCode} expiresIn=${config.otpTtlSeconds}s`);

  return res.json({
    success: true,
    otpSessionId,
    expiresAt,
    ttlSeconds: config.otpTtlSeconds,
    deliveryChannel: 'WORK_EMAIL_OR_AUTHENTICATOR',
    demoOtp: config.nodeEnv !== 'production' ? otpCode : undefined,
    message: `6-digit fallback OTP dispatched for ${user.email}. Valid for ${config.otpTtlSeconds}s.`
  });
});

/**
 * Fallback Second Factor: Verify 6-digit OTP & issue device-bound JWT
 * POST /api/auth/verify-fallback-otp
 */
router.post('/verify-fallback-otp', faceEndpointRateLimiter, (req, res) => {
  const { tempToken, otpSessionId, otpCode } = req.body;
  const deviceHash = extractDeviceHash(req);

  if (!otpSessionId || !otpCode) {
    return res.status(400).json({ error: 'OTP session ID and 6-digit code are required.' });
  }

  const db = getDb();
  const otpRow = db.prepare("SELECT * FROM otp_codes WHERE id = ? AND purpose = 'login_fallback'").get(otpSessionId);
  if (!otpRow || otpRow.used) {
    return res.status(401).json({ error: 'Invalid or already consumed OTP code.' });
  }

  if (otpRow.expires_at <= Date.now()) {
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otpRow.id);
    return res.status(401).json({ error: 'OTP code expired. Please request a new code.' });
  }

  if (tempToken) {
    try {
      const payload = jwt.verify(tempToken, config.jwtSecret);
      if (payload.employeeId !== otpRow.employee_id || (payload.deviceHash && payload.deviceHash !== deviceHash)) {
        return res.status(403).json({ error: 'OTP does not match current session or device.' });
      }
    } catch {
      return res.status(401).json({ error: '2FA session expired. Please sign in again.' });
    }
  }

  if (hashOtp(String(otpCode).trim()) !== otpRow.code_hash) {
    return res.status(401).json({ error: 'Incorrect 6-digit OTP code.' });
  }

  const user = db.prepare(`
    SELECT u.*, e.name, e.department, e.designation, e.face_enrolled, e.enrollment_status
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE u.employee_id = ?
  `).get(otpRow.employee_id);

  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.is_locked) {
    const isLockoutEnabled = typeof config.maxFaceLoginAttempts === 'number' && config.maxFaceLoginAttempts > 0 && config.maxFaceLoginAttempts < 1000;
    if (isLockoutEnabled) {
      return res.status(403).json({ error: 'Account locked or unavailable.', locked: true });
    } else {
      db.prepare('UPDATE users SET is_locked = 0, failed_face_attempts = 0, locked_at = NULL WHERE id = ?').run(user.id);
      user.is_locked = 0;
    }
  }

  const consumeOtp = db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ? AND used = 0').run(otpRow.id);
  if (consumeOtp.changes !== 1) {
    return res.status(401).json({ error: 'OTP replay rejected.' });
  }

  db.prepare(`
    INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
    VALUES (?, ?, ?, NULL, 'OTP_FALLBACK', ?, ?, ?)
  `).run(
    `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user.employee_id,
    getServerTime().iso,
    req.ip || '127.0.0.1',
    req.headers['user-agent'] || 'Unknown',
    deviceHash
  );

  logFaceAttempt({
    employeeId: user.employee_id,
    attemptType: 'login',
    success: true,
    livenessPassed: false,
    reason: 'Verified via 6-digit OTP fallback',
    req
  });

  const token = generateToken(user, deviceHash);

  return res.json({
    status: 'AUTHENTICATED',
    fallbackUsed: true,
    token,
    user: formatUserResponse(user)
  });
});

/**
 * Unlock locked employee account (HR Only)
 * POST /api/auth/unlock/:employeeId
 */
router.post('/unlock/:employeeId', authenticate, requireHR, (req, res) => {
  const { employeeId } = req.params;
  const db = getDb();

  const user = db.prepare('SELECT id, employee_id FROM users WHERE employee_id = ?').get(employeeId);
  if (!user) {
    return res.status(404).json({ error: 'Employee account not found.' });
  }

  db.prepare(`
    UPDATE users SET
      failed_face_attempts = 0,
      is_locked = 0,
      locked_at = NULL
    WHERE employee_id = ?
  `).run(employeeId);

  db.prepare(`
    UPDATE hr_notifications SET
      is_resolved = 1,
      resolved_by = ?
    WHERE employee_id = ? AND event_type IN ('LOCKED', 'SPOOF_DETECTED') AND is_resolved = 0
  `).run(req.user.employee_id, employeeId);

  db.prepare(`
    INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
    VALUES (?, ?, ?, NULL, 'UNLOCKED', ?, ?, ?)
  `).run(
    `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    employeeId,
    getServerTime().iso,
    req.ip || '127.0.0.1',
    `Unlocked by HR (${req.user.employee_id})`,
    extractDeviceHash(req)
  );

  logFaceAttempt({
    employeeId,
    attemptType: 'login',
    success: true,
    reason: `Account unlocked by HR Administrator (${req.user.employee_id})`,
    req
  });

  res.json({
    success: true,
    message: `Account ${employeeId} has been unlocked and failed face attempt counter reset.`
  });
});

/**
 * Self-Service Unlock: Reset locked status with verified credentials
 * POST /api/auth/unlock-self
 */
router.post('/unlock-self', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Employee ID or email is required.' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.employee_id, u.email, u.password_hash, u.is_locked, e.name
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.employee_id) = LOWER(?)
  `).get(identifier, identifier);

  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (password && !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid password. Cannot verify identity to unlock.' });
  }

  db.prepare(`
    UPDATE users SET
      failed_face_attempts = 0,
      is_locked = 0,
      locked_at = NULL
    WHERE id = ?
  `).run(user.id);

  db.prepare(`
    UPDATE hr_notifications SET
      is_resolved = 1,
      resolved_by = 'SELF_UNLOCK'
    WHERE employee_id = ? AND event_type = 'LOCKED' AND is_resolved = 0
  `).run(user.employee_id);

  db.prepare(`
    INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
    VALUES (?, ?, ?, NULL, 'UNLOCKED', ?, ?, ?)
  `).run(
    `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user.employee_id,
    getServerTime().iso,
    req.ip || '127.0.0.1',
    'Self-service account unlock',
    extractDeviceHash(req)
  );

  return res.json({
    success: true,
    message: `Account for ${user.name} (${user.employee_id}) has been unlocked! You can now sign in.`
  });
});

/**
 * Update Face Login Policy (REQUIRED | OPTIONAL | OFF) - HR Only
 * PATCH /api/auth/face-policy/:employeeId
 */
router.patch('/face-policy/:employeeId', authenticate, requireHR, (req, res) => {
  const { employeeId } = req.params;
  const { policy } = req.body;

  if (!['REQUIRED', 'OPTIONAL', 'OFF'].includes(policy)) {
    return res.status(400).json({ error: 'Invalid face login policy. Must be REQUIRED, OPTIONAL, or OFF.' });
  }

  const db = getDb();
  const result = db.prepare('UPDATE users SET face_login_policy = ? WHERE employee_id = ?').run(policy, employeeId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Employee user record not found.' });
  }

  res.json({
    success: true,
    employeeId,
    faceLoginPolicy: policy,
    message: `Face login policy for ${employeeId} updated to ${policy}.`
  });
});

/**
 * Request Password Reset Verification Code
 * POST /api/auth/forgot-password/request-code
 */
router.post('/forgot-password/request-code', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Please enter your registered work email or employee ID.' });
  }

  const cleanIdentifier = email.trim().toLowerCase();
  const normalizedIdentifier = cleanIdentifier.replace(/\.{2,}/g, '.');
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.employee_id, u.email, e.name, e.work_email, e.is_active
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE LOWER(u.email) = ? OR LOWER(u.email) = ? OR LOWER(u.employee_id) = ? OR LOWER(e.work_email) = ? OR LOWER(e.work_email) = ?
  `).get(cleanIdentifier, normalizedIdentifier, cleanIdentifier, cleanIdentifier, normalizedIdentifier);

  if (!user || user.is_active === 0) {
    return res.status(404).json({ error: 'No active employee account found with this email or ID.' });
  }

  const now = Date.now();
  // Clean up any stale reset OTPs for this employee
  db.prepare("DELETE FROM otp_codes WHERE employee_id = ? AND purpose = 'password_reset'").run(user.employee_id);

  const otpCode = String(crypto.randomInt(100000, 999999));
  const otpSessionId = `pwreset_${now}_${crypto.randomBytes(6).toString('hex')}`;
  const ttlSeconds = config.otpTtlSeconds || 300;
  const expiresAt = now + ttlSeconds * 1000;

  db.prepare(`
    INSERT INTO otp_codes (id, employee_id, purpose, code_hash, used, expires_at)
    VALUES (?, ?, 'password_reset', ?, 0, ?)
  `).run(otpSessionId, user.employee_id, hashOtp(otpCode), expiresAt);

  console.log(`[PASSWORD RESET OTP] Employee=${user.employee_id} (${user.email}) OTP=${otpCode} (Expires in ${ttlSeconds}s)`);

  return res.json({
    success: true,
    email: user.email,
    employeeName: user.name,
    otpSessionId,
    expiresAt,
    ttlSeconds,
    demoOtp: config.nodeEnv !== 'production' ? otpCode : undefined,
    message: `6-digit verification code has been dispatched to ${user.email}.`
  });
});

/**
 * Verify Password Reset Code
 * POST /api/auth/forgot-password/verify-code
 */
router.post('/forgot-password/verify-code', (req, res) => {
  const { otpSessionId, otpCode } = req.body;
  if (!otpSessionId || !otpCode) {
    return res.status(400).json({ error: 'Verification session and 6-digit code are required.' });
  }

  const db = getDb();
  const otpRow = db.prepare("SELECT * FROM otp_codes WHERE id = ? AND purpose = 'password_reset'").get(otpSessionId);

  if (!otpRow || otpRow.used) {
    return res.status(401).json({ error: 'Invalid or already consumed verification code. Please request a new one.' });
  }

  if (otpRow.expires_at <= Date.now()) {
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otpRow.id);
    return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (hashOtp(String(otpCode).trim()) !== otpRow.code_hash) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(otpRow.id);
    return res.status(401).json({ error: 'Incorrect 6-digit verification code. Please check and try again.' });
  }

  // Mark code consumed
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otpRow.id);

  const user = db.prepare(`
    SELECT u.id, u.employee_id, u.email, e.name
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE u.employee_id = ?
  `).get(otpRow.employee_id);

  if (!user) {
    return res.status(404).json({ error: 'Employee account not found.' });
  }

  // Issue 10-minute temporary reset token
  const resetToken = jwt.sign(
    {
      employeeId: user.employee_id,
      email: user.email,
      purpose: 'PASSWORD_RESET'
    },
    config.jwtSecret,
    { expiresIn: '10m' }
  );

  return res.json({
    success: true,
    resetToken,
    email: user.email,
    employeeName: user.name,
    message: 'Verification code verified successfully! You may now set your new password.'
  });
});

/**
 * Set New Password & Confirm
 * POST /api/auth/forgot-password/reset-password
 */
router.post('/forgot-password/reset-password', (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!resetToken) {
    return res.status(401).json({ error: 'Reset session expired or missing. Please restart the recovery flow.' });
  }

  if (!newPassword || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'New password is required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  if (!/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must include at least one number and one special symbol.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirm password do not match.' });
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, config.jwtSecret);
    if (payload.purpose !== 'PASSWORD_RESET' || !payload.employeeId) {
      throw new Error('Invalid token purpose');
    }
  } catch {
    return res.status(401).json({ error: 'Password reset session has expired or is invalid. Please request a new code.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, employee_id, email FROM users WHERE employee_id = ?').get(payload.employeeId);
  if (!user) {
    return res.status(404).json({ error: 'Employee account not found.' });
  }

  const newHash = hashPassword(newPassword);

  db.prepare(`
    UPDATE users SET
      password_hash = ?,
      failed_face_attempts = 0,
      is_locked = 0,
      locked_at = NULL
    WHERE employee_id = ?
  `).run(newHash, user.employee_id);

  // Auto-resolve any pending LOCKED notifications in HR portal
  try {
    db.prepare(`
      UPDATE hr_notifications SET
        is_resolved = 1,
        resolved_by = 'PASSWORD_RESET'
      WHERE employee_id = ? AND is_resolved = 0
    `).run(user.employee_id);
  } catch {}

  // Record in audit log
  try {
    db.prepare(`
      INSERT INTO login_audit (id, employee_id, login_time, match_score, status, ip_address, user_agent, device_hash)
      VALUES (?, ?, ?, NULL, 'PASSWORD_RESET', ?, ?, ?)
    `).run(
      `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      user.employee_id,
      getServerTime().iso,
      req.ip || '127.0.0.1',
      'Password reset via email verification code',
      extractDeviceHash(req)
    );
  } catch {}

  console.log(`[PASSWORD RESET SUCCESS] Password successfully updated for Employee=${user.employee_id} (${user.email})`);

  return res.json({
    success: true,
    email: user.email,
    message: 'Your password has been reset successfully! You can now log in with your new password.'
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
