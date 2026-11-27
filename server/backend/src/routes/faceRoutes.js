// backend/src/routes/faceRoutes.js
import express from 'express';
import crypto from 'node:crypto';
import config from '../config/index.js';
import { getDb } from '../db/connection.js';
import { authenticate, requireHR } from '../middleware/auth.js';
import { faceEndpointRateLimiter } from '../middleware/rateLimiter.js';
import { logFaceAttempt, createHrNotification } from '../middleware/auditLogger.js';
import { deletePhoto } from '../services/cryptoService.js';
import {
  analyzeFaceWithEngine,
  storeEnrolledEmbeddings,
  deleteEmployeeFaceData
} from '../services/faceEngine.js';
import { getServerTime } from '../utils/serverTime.js';

const router = express.Router();

const REQUIRED_POSES = ['straight', 'left', 'right', 'up', 'down'];
const OPTIONAL_LIVENESS_POSES = ['blink', 'smile'];
const ALLOWED_POSES = [...REQUIRED_POSES, ...OPTIONAL_LIVENESS_POSES];

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

/**
 * List all employees with biometric enrollment, approval & lock status (HR Only)
 * GET /api/face/employees
 */
router.get('/employees', authenticate, requireHR, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT e.id, e.name, e.work_email, e.department, e.designation, e.role,
           e.face_enrolled, e.enrollment_status,
           u.face_login_policy, u.failed_face_attempts, u.is_locked, u.locked_at
    FROM employees e
    JOIN users u ON u.employee_id = e.id
    ORDER BY e.name ASC
  `).all();

  res.json({ count: rows.length, data: rows });
});

/**
 * Check enrollment status for an employee
 * GET /api/face/status/:employeeId
 */
router.get('/status/:employeeId', authenticate, (req, res) => {
  const { employeeId } = req.params;

  if (req.user.employee_id !== employeeId && req.user.role !== 'HR_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Unauthorized to view face status of other employees.' });
  }

  const db = getDb();
  const emp = db.prepare('SELECT id, name, face_enrolled, enrollment_status FROM employees WHERE id = ?').get(employeeId);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const embeddings = db.prepare('SELECT pose_type, created_at FROM face_embeddings WHERE employee_id = ? AND is_active = 1').all(employeeId);
  const consent = db.prepare('SELECT consent_given, consent_version, consented_at FROM face_consent WHERE employee_id = ? ORDER BY consented_at DESC LIMIT 1').get(employeeId);

  res.json({
    employeeId: emp.id,
    name: emp.name,
    faceEnrolled: Boolean(emp.face_enrolled),
    enrollmentStatus: emp.enrollment_status || (emp.face_enrolled ? 'APPROVED' : 'NOT_ENROLLED'),
    posesCount: embeddings.length,
    poses: embeddings.map(e => e.pose_type),
    storagePolicy: 'ENCRYPTED_EMBEDDINGS_ONLY_NO_RAW_IMAGES',
    consent: consent || null
  });
});

/**
 * Request 6-digit OTP to authorize self-service live biometric enrollment
 * POST /api/face/enroll/request-otp
 */
router.post('/enroll/request-otp', authenticate, faceEndpointRateLimiter, (req, res) => {
  const targetEmployeeId = req.body?.employeeId || req.user.employee_id;
  const isHR = req.user.role === 'HR_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'MANAGER';

  if (req.user.employee_id !== targetEmployeeId && !isHR) {
    return res.status(403).json({ error: 'Unauthorized to request enrollment OTP for another employee.' });
  }

  const db = getDb();
  const employee = db.prepare('SELECT id, name, work_email FROM employees WHERE id = ?').get(targetEmployeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const now = Date.now();
  db.prepare("DELETE FROM otp_codes WHERE employee_id = ? AND purpose = 'enroll'").run(targetEmployeeId);

  const otpCode = String(crypto.randomInt(100000, 999999));
  const otpSessionId = `otp_enroll_${now}_${crypto.randomBytes(5).toString('hex')}`;
  const expiresAt = now + config.otpTtlSeconds * 1000;

  db.prepare(`
    INSERT INTO otp_codes (id, employee_id, purpose, code_hash, used, expires_at)
    VALUES (?, ?, 'enroll', ?, 0, ?)
  `).run(otpSessionId, targetEmployeeId, hashOtp(otpCode), expiresAt);

  console.log(`[ENROLL OTP] Employee=${targetEmployeeId} (${employee.work_email}) OTP=${otpCode} expiresIn=${config.otpTtlSeconds}s`);

  res.json({
    success: true,
    otpSessionId,
    expiresAt,
    ttlSeconds: config.otpTtlSeconds,
    demoOtp: config.nodeEnv !== 'production' ? otpCode : undefined,
    message: `Enrollment OTP dispatched for ${employee.work_email}. Valid for ${config.otpTtlSeconds}s.`
  });
});

/**
 * Secure Live Face Enrollment (5-7 live angles with per-frame liveness + OTP/HR approval, encrypted embeddings ONLY)
 * POST /api/face/enroll
 */
router.post('/enroll', authenticate, faceEndpointRateLimiter, async (req, res) => {
  const { employeeId, photos, consent, otpSessionId, otpCode, requestHrApproval, captureSource } = req.body;
  const targetEmployeeId = employeeId || req.user.employee_id;

  const isHR = req.user.role === 'HR_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
  if (req.user.employee_id !== targetEmployeeId && !isHR) {
    return res.status(403).json({ error: 'Permission denied. Only HR can enroll other employees.' });
  }

  // Reject any file-upload style enrollment attempt
  if (captureSource && captureSource !== 'LIVE_WEBCAM') {
    return res.status(400).json({
      error: 'File uploads are prohibited for biometric enrollment. Live webcam capture is mandatory.'
    });
  }

  const db = getDb();
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(targetEmployeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // 1. Validate Biometric Consent as per India DPDP Act 2023
  if (!consent || !consent.granted) {
    return res.status(400).json({
      error: 'Biometric consent is mandatory under the Digital Personal Data Protection (DPDP) Act, 2023 before biometric enrollment.'
    });
  }

  // 2. Determine enrollment authorization: HR Admin OR valid OTP OR explicit Pending HR queue
  let approvalStatus = null;
  let consumedOtpId = null;

  if (isHR && !requestHrApproval) {
    approvalStatus = 'APPROVED';
  } else if (otpSessionId && otpCode) {
    const otpRow = db.prepare("SELECT * FROM otp_codes WHERE id = ? AND employee_id = ? AND purpose = 'enroll'").get(otpSessionId, targetEmployeeId);
    if (!otpRow || otpRow.used || otpRow.expires_at <= Date.now()) {
      return res.status(401).json({ error: 'Enrollment OTP expired or invalid. Please request a fresh OTP.' });
    }
    if (hashOtp(String(otpCode).trim()) !== otpRow.code_hash) {
      return res.status(401).json({ error: 'Incorrect 6-digit enrollment OTP.' });
    }
    consumedOtpId = otpRow.id;
    approvalStatus = 'APPROVED';
  } else if (requestHrApproval) {
    approvalStatus = 'PENDING_HR';
  } else {
    return res.status(400).json({
      error: 'Enrollment authorization required: verify a 6-digit OTP or submit for HR Admin approval.'
    });
  }

  // 3. Validate 5-7 live pose frames
  if (!photos || typeof photos !== 'object') {
    return res.status(400).json({
      error: 'Missing live webcam captures. 5 to 7 pose frames are required (straight, left, right, up, down + optional blink/smile).'
    });
  }

  for (const pose of REQUIRED_POSES) {
    if (!photos[pose]) {
      return res.status(400).json({
        error: `Missing live frame for required pose '${pose}'. All 5 core poses must be captured from live camera.`
      });
    }
  }

  const submittedPoses = ALLOWED_POSES.filter(pose => Boolean(photos[pose]));
  if (submittedPoses.length < 5 || submittedPoses.length > 7) {
    return res.status(400).json({
      error: 'Between 5 and 7 distinct live pose captures are required for enrollment.'
    });
  }

  // Prevent submitting the same static frame across all poses
  const uniqueFrames = new Set(submittedPoses.map(p => photos[p]));
  if (uniqueFrames.size < submittedPoses.length) {
    return res.status(400).json({
      error: 'Duplicate frames detected across poses. Capture each live head angle individually from the webcam.'
    });
  }

  // 4. Server-Side Neural & Anti-Spoof Analysis on EVERY frame
  const validatedEmbeddings = [];
  for (const pose of submittedPoses) {
    try {
      const enginePose = pose === 'blink' || pose === 'smile' ? 'straight' : pose;
      const analyzed = await analyzeFaceWithEngine(photos[pose], enginePose);
      validatedEmbeddings.push({ pose, embedding: analyzed.embedding });
    } catch (err) {
      logFaceAttempt({
        employeeId: targetEmployeeId,
        attemptType: 'enroll',
        success: false,
        livenessPassed: err.code !== 'SPOOF_SUSPECTED',
        reason: `Enrollment pose '${pose}' rejected: ${err.message}`,
        req
      });

      return res.status(err.statusCode || 422).json({
        error: `Pose '${pose}' failed live security check: ${err.message}`,
        pose,
        reason: err.code || 'liveness_failed',
        metrics: err.metrics
      });
    }
  }

  // Consume OTP only after all live frames pass checks
  if (consumedOtpId) {
    const consumeRes = db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ? AND used = 0').run(consumedOtpId);
    if (consumeRes.changes !== 1) {
      return res.status(401).json({ error: 'Enrollment OTP was already consumed.' });
    }
  }

  // Remove any legacy encrypted thumbnail on disk — NEVER store raw images
  if (employee.profile_thumbnail_path) {
    deletePhoto(employee.profile_thumbnail_path);
  }

  // 5. Store ONLY AES-256-GCM encrypted 128-d face embeddings in SQLite
  storeEnrolledEmbeddings(targetEmployeeId, validatedEmbeddings, approvalStatus);

  // 6. Enforce Face 2FA once APPROVED
  if (approvalStatus === 'APPROVED') {
    db.prepare(`
      UPDATE users SET face_login_policy = 'REQUIRED'
      WHERE employee_id = ? AND face_login_policy != 'OFF'
    `).run(targetEmployeeId);
  } else {
    createHrNotification({
      employeeId: targetEmployeeId,
      eventType: 'ENROLLMENT_PENDING',
      message: `${employee.name} (${targetEmployeeId}) completed ${validatedEmbeddings.length}-frame live enrollment and awaits HR Admin approval.`
    });
  }

  // 7. Record DPDP Biometric Consent
  const consentId = `cst_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const serverTime = getServerTime();
  db.prepare(`
    INSERT INTO face_consent (id, employee_id, consent_given, consent_version, consented_at, ip_address, user_agent)
    VALUES (?, ?, 1, ?, ?, ?, ?)
  `).run(
    consentId,
    targetEmployeeId,
    config.dpdpConsentVersion,
    serverTime.iso,
    req.ip || '127.0.0.1',
    req.headers['user-agent'] || 'Unknown'
  );

  logFaceAttempt({
    employeeId: targetEmployeeId,
    attemptType: 'enroll',
    success: true,
    livenessPassed: true,
    reason: `Enrolled ${validatedEmbeddings.length} live angles (encrypted embeddings only; status=${approvalStatus})`,
    req
  });

  res.json({
    success: true,
    approvalStatus,
    message: approvalStatus === 'APPROVED'
      ? `Biometric profile enrolled (${validatedEmbeddings.length} encrypted angles, zero raw photos stored) for ${employee.name}. Face 2FA is now active.`
      : `Live biometric captures verified (${validatedEmbeddings.length} encrypted angles). Pending HR Admin approval before Face 2FA activates.`,
    employeeId: targetEmployeeId,
    posesCount: validatedEmbeddings.length,
    faceLoginPolicy: approvalStatus === 'APPROVED' ? 'REQUIRED' : 'OPTIONAL',
    consentRecorded: {
      version: config.dpdpConsentVersion,
      timestamp: serverTime.iso
    }
  });
});

/**
 * Approve a pending employee biometric enrollment (HR Only)
 * POST /api/face/approve/:employeeId
 */
router.post('/approve/:employeeId', authenticate, requireHR, (req, res) => {
  const { employeeId } = req.params;
  const db = getDb();

  const employee = db.prepare('SELECT id, name, enrollment_status FROM employees WHERE id = ?').get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM face_embeddings WHERE employee_id = ? AND is_active = 1').get(employeeId);
  if (!countRow || countRow.cnt === 0) {
    return res.status(400).json({ error: 'No active biometric embeddings found to approve for this employee.' });
  }

  db.prepare("UPDATE employees SET face_enrolled = 1, enrollment_status = 'APPROVED' WHERE id = ?").run(employeeId);
  db.prepare("UPDATE users SET face_login_policy = 'REQUIRED' WHERE employee_id = ? AND face_login_policy != 'OFF'").run(employeeId);
  db.prepare(`
    UPDATE hr_notifications SET
      is_resolved = 1,
      resolved_by = ?
    WHERE employee_id = ? AND event_type = 'ENROLLMENT_PENDING' AND is_resolved = 0
  `).run(req.user.employee_id, employeeId);

  logFaceAttempt({
    employeeId,
    attemptType: 'enroll',
    success: true,
    livenessPassed: true,
    reason: `Biometric enrollment approved by HR Administrator (${req.user.employee_id})`,
    req
  });

  res.json({
    success: true,
    employeeId,
    enrollmentStatus: 'APPROVED',
    message: `Biometric enrollment approved for ${employee.name} (${employeeId}). Face 2FA is now enforced.`
  });
});

/**
 * Delete Face Data (HR Only)
 * DELETE /api/face/:employeeId
 */
router.delete('/:employeeId', authenticate, requireHR, (req, res) => {
  const { employeeId } = req.params;
  const db = getDb();

  const employee = db.prepare('SELECT name, profile_thumbnail_path FROM employees WHERE id = ?').get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  if (employee.profile_thumbnail_path) {
    deletePhoto(employee.profile_thumbnail_path);
  }

  deleteEmployeeFaceData(employeeId);
  db.prepare("UPDATE users SET face_login_policy = 'OPTIONAL', failed_face_attempts = 0, is_locked = 0 WHERE employee_id = ?").run(employeeId);

  logFaceAttempt({
    employeeId,
    attemptType: 'enroll',
    success: true,
    reason: `Face biometric data deleted by HR Administrator (${req.user.employee_id})`,
    req
  });

  res.json({
    success: true,
    message: `Biometric face data for ${employee.name} (${employeeId}) has been permanently deleted.`
  });
});

export default router;
