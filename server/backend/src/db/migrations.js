// backend/src/db/migrations.js
import { getDb } from './connection.js';

function ensureColumn(db, tableName, columnName, columnDef) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!cols.some(c => c.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`);
  }
}

export function runMigrations() {
  const db = getDb();

  db.exec(`
    -- 1. Employees Table
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      work_email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'EMPLOYEE',
      is_active INTEGER NOT NULL DEFAULT 1,
      face_enrolled INTEGER NOT NULL DEFAULT 0,
      enrollment_status TEXT NOT NULL DEFAULT 'NONE', -- 'NONE' | 'PENDING_HR' | 'APPROVED'
      profile_thumbnail_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 2. User Authentication Accounts
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'EMPLOYEE',
      face_login_policy TEXT NOT NULL DEFAULT 'OPTIONAL', -- 'REQUIRED' | 'OPTIONAL' | 'OFF'
      failed_face_attempts INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      locked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- 3. Face Embeddings (Encrypted float vectors ONLY; no raw images stored)
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      embedding TEXT NOT NULL, -- AES-256-GCM encrypted vector
      pose_type TEXT NOT NULL DEFAULT 'straight',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- 4. Biometric Consent (India DPDP Act 2023 Compliance)
    CREATE TABLE IF NOT EXISTS face_consent (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      consent_given INTEGER NOT NULL,
      consent_version TEXT NOT NULL,
      consented_at TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- 5. One-Time Challenge Tokens (Anti-Replay, 30-60s Expiry)
    CREATE TABLE IF NOT EXISTS challenge_tokens (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      challenge_type TEXT NOT NULL, -- 'blink_twice' | 'turn_left' | 'turn_right' | 'smile' | 'nod'
      device_hash TEXT,
      used INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- 6. OTP Codes (Enrollment Verification & Password+OTP Fallback)
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      purpose TEXT NOT NULL, -- 'enroll' | 'fallback_login'
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- 7. HR Notifications & Security Alerts
    CREATE TABLE IF NOT EXISTS hr_notifications (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      event_type TEXT NOT NULL, -- 'ACCOUNT_LOCKED' | 'SPOOF_DETECTED' | 'ENROLLMENT_PENDING'
      message TEXT NOT NULL,
      is_resolved INTEGER NOT NULL DEFAULT 0,
      resolved_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- 8. Face Attempt Log (Every attempt logged with IP, Device & Spoof status)
    CREATE TABLE IF NOT EXISTS face_attempt_log (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      attempt_type TEXT NOT NULL, -- 'login' | 'enroll'
      success INTEGER NOT NULL,
      match_score REAL,
      liveness_passed INTEGER NOT NULL DEFAULT 1,
      reason TEXT,
      ip_address TEXT,
      device_info TEXT,
      device_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 9. Login Audit
    CREATE TABLE IF NOT EXISTS login_audit (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      login_time TEXT NOT NULL DEFAULT (datetime('now')),
      match_score REAL,
      status TEXT NOT NULL, -- 'SUCCESS' | 'FAILED_FACE' | 'SPOOF_SUSPECTED' | 'LOCKED' | 'PASSWORD_ONLY' | 'OTP_FALLBACK' | 'UNLOCKED'
      ip_address TEXT,
      user_agent TEXT,
      device_hash TEXT,
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_face_emb_emp ON face_embeddings(employee_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_attempt_log_emp ON face_attempt_log(employee_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_login_audit_emp ON login_audit(employee_id, login_time);
    CREATE INDEX IF NOT EXISTS idx_challenge_emp ON challenge_tokens(employee_id, used);
  `);

  // Safe upgrades for existing DBs
  ensureColumn(db, 'employees', 'enrollment_status', "TEXT NOT NULL DEFAULT 'NONE'");
  ensureColumn(db, 'face_attempt_log', 'device_hash', 'TEXT');
  ensureColumn(db, 'login_audit', 'device_hash', 'TEXT');

  // Backfill enrollment_status for already-enrolled employees
  db.exec(`UPDATE employees SET enrollment_status = 'APPROVED' WHERE face_enrolled = 1 AND enrollment_status = 'NONE';`);

  console.log('✅ Database migrations executed successfully.');
}
