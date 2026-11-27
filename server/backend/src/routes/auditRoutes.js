// backend/src/routes/auditRoutes.js
import express from 'express';
import { authenticate, requireHR } from '../middleware/auth.js';
import { getDb } from '../db/connection.js';
import { getServerTime } from '../utils/serverTime.js';

const router = express.Router();

/**
 * Get Login Audit records (Employee sees own logins; HR sees all with filters)
 * GET /api/audit/logins
 */
router.get('/logins', authenticate, (req, res) => {
  const isHR = req.user.role === 'HR_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
  const filterEmployeeId = isHR ? req.query.employeeId : req.user.employee_id;

  const { startDate, endDate, department, status, limit = 100, offset = 0 } = req.query;
  const db = getDb();

  let query = `
    SELECT l.id, l.employee_id, e.name as employee_name, e.department, e.designation,
           l.login_time, l.match_score, l.status, l.ip_address, l.user_agent, l.device_hash
    FROM login_audit l
    JOIN employees e ON l.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (filterEmployeeId) {
    query += ' AND l.employee_id = ?';
    params.push(filterEmployeeId);
  }
  if (startDate) {
    query += ' AND substr(l.login_time, 1, 10) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND substr(l.login_time, 1, 10) <= ?';
    params.push(endDate);
  }
  if (department) {
    query += ' AND e.department = ?';
    params.push(department);
  }
  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  query += ' ORDER BY l.login_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const rows = db.prepare(query).all(...params);
  res.json({
    count: rows.length,
    data: rows,
    serverTime: getServerTime()
  });
});

/**
 * Get Face Attempt Logs (Employee sees own attempts; HR sees all)
 * GET /api/audit/attempts
 */
router.get('/attempts', authenticate, (req, res) => {
  const isHR = req.user.role === 'HR_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
  const filterEmployeeId = isHR ? req.query.employeeId : req.user.employee_id;
  const { attemptType, success, limit = 100 } = req.query;

  const db = getDb();
  let query = `
    SELECT f.id, f.employee_id, e.name as employee_name, e.department,
           f.attempt_type, f.success, f.match_score, f.liveness_passed,
           f.reason, f.ip_address, f.device_info, f.device_hash, f.created_at
    FROM face_attempt_log f
    LEFT JOIN employees e ON f.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (filterEmployeeId) {
    query += ' AND f.employee_id = ?';
    params.push(filterEmployeeId);
  }
  if (attemptType) {
    query += ' AND f.attempt_type = ?';
    params.push(attemptType);
  }
  if (success !== undefined && success !== '') {
    query += ' AND f.success = ?';
    params.push(success === 'true' || success === '1' ? 1 : 0);
  }

  query += ' ORDER BY f.created_at DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const rows = db.prepare(query).all(...params);
  res.json({ count: rows.length, data: rows });
});

/**
 * Get HR Security Notifications (Lockouts, Spoof Alerts, Pending Enrollments)
 * GET /api/audit/notifications
 */
router.get('/notifications', authenticate, requireHR, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT n.id, n.employee_id, e.name as employee_name, e.department,
           n.event_type, n.message, n.is_resolved, n.resolved_by, n.created_at
    FROM hr_notifications n
    LEFT JOIN employees e ON n.employee_id = e.id
    ORDER BY n.is_resolved ASC, n.created_at DESC
    LIMIT 100
  `).all();

  res.json({ count: rows.length, data: rows });
});

/**
 * Resolve an HR Security Notification (HR Only)
 * POST /api/audit/notifications/:id/resolve
 */
router.post('/notifications/:id/resolve', authenticate, requireHR, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const result = db.prepare(`
    UPDATE hr_notifications SET
      is_resolved = 1,
      resolved_by = ?
    WHERE id = ?
  `).run(req.user.employee_id, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  res.json({ success: true, id });
});

/**
 * Export Login Audit Report to CSV (HR Only)
 * GET /api/audit/export
 */
router.get('/export', authenticate, requireHR, (req, res) => {
  const { startDate, endDate, employeeId, department, status } = req.query;
  const db = getDb();

  let query = `
    SELECT l.id, l.employee_id, e.name as employee_name, e.department, e.designation,
           l.login_time, l.match_score, l.status, l.ip_address, l.device_hash, l.user_agent
    FROM login_audit l
    JOIN employees e ON l.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (employeeId) {
    query += ' AND l.employee_id = ?';
    params.push(employeeId);
  }
  if (startDate) {
    query += ' AND substr(l.login_time, 1, 10) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND substr(l.login_time, 1, 10) <= ?';
    params.push(endDate);
  }
  if (department) {
    query += ' AND e.department = ?';
    params.push(department);
  }
  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  query += ' ORDER BY l.login_time DESC LIMIT 5000';
  const rows = db.prepare(query).all(...params);

  const headers = [
    'Login Time (Server ISO)',
    'Employee ID',
    'Employee Name',
    'Department',
    'Designation',
    'Status',
    'Match Score',
    'IP Address',
    'Device Hash',
    'Device / User Agent'
  ];

  const csvRows = rows.map(r => [
    `"${r.login_time}"`,
    `"${r.employee_id}"`,
    `"${r.employee_name}"`,
    `"${r.department}"`,
    `"${r.designation}"`,
    `"${r.status}"`,
    `"${r.match_score !== null ? (r.match_score * 100).toFixed(1) + '%' : ''}"`,
    `"${r.ip_address || ''}"`,
    `"${r.device_hash || ''}"`,
    `"${(r.user_agent || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="face_login_audit_${Date.now()}.csv"`);
  res.send(csv);
});

export default router;
