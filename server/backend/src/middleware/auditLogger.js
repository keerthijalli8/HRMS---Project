// backend/src/middleware/auditLogger.js
import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export function logFaceAttempt({
  employeeId,
  attemptType, // 'login' | 'enroll'
  success,
  matchScore = null,
  livenessPassed = true,
  reason = null,
  deviceHash = null,
  req = null
}) {
  try {
    const db = getDb();
    const id = `attlog_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const ip = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const deviceInfo = req ? (req.headers['user-agent'] || 'Unknown Device') : 'Direct API';
    const resolvedDeviceHash = deviceHash || (req ? req.headers['x-device-hash'] : null) || null;

    db.prepare(`
      INSERT INTO face_attempt_log (
        id, employee_id, attempt_type, success, match_score, 
        liveness_passed, reason, ip_address, device_info, device_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      employeeId || null,
      attemptType,
      success ? 1 : 0,
      matchScore !== null ? Number(matchScore) : null,
      livenessPassed ? 1 : 0,
      reason,
      String(ip).slice(0, 45),
      String(deviceInfo).slice(0, 255),
      resolvedDeviceHash ? String(resolvedDeviceHash).slice(0, 128) : null
    );
  } catch (err) {
    console.error('Failed to write to face_attempt_log:', err);
  }
}

export function createHrNotification({ employeeId, eventType, message }) {
  try {
    const db = getDb();
    const id = `hrn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
      INSERT INTO hr_notifications (id, employee_id, event_type, message)
      VALUES (?, ?, ?, ?)
    `).run(id, employeeId, eventType, message);
    console.warn(`[HR ALERT][${eventType}] ${employeeId}: ${message}`);
  } catch (err) {
    console.error('Failed to record HR notification:', err);
  }
}
