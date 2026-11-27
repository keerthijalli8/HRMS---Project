// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getDb } from '../db/connection.js';

export function extractDeviceHash(req) {
  return (req.headers['x-device-hash'] || req.body?.deviceHash || '').toString().trim() || null;
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Device binding enforcement: reject stolen JWT replayed from another device/browser
    if (decoded.deviceHash) {
      const reqDeviceHash = extractDeviceHash(req);
      if (reqDeviceHash && reqDeviceHash !== decoded.deviceHash) {
        return res.status(403).json({
          error: 'Device binding mismatch. Please sign in again on this device.',
          code: 'DEVICE_MISMATCH'
        });
      }
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT u.id, u.employee_id, u.email, u.role, u.face_login_policy, u.is_locked,
             e.name, e.department, e.designation, e.face_enrolled, e.enrollment_status
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    if (user.is_locked) {
      return res.status(403).json({ error: 'Account is locked due to security policy. Please contact HR.' });
    }

    req.user = user;
    req.deviceHash = decoded.deviceHash || null;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireHR(req, res, next) {
  if (!req.user || (req.user.role !== 'HR_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER')) {
    return res.status(403).json({ error: 'Access denied. HR Administrator permissions required.' });
  }
  next();
}

export function generateToken(user, deviceHash = null) {
  return jwt.sign(
    {
      userId: user.id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role,
      deviceHash: deviceHash || null
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
