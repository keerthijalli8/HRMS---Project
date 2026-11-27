// backend/src/db/seed.js
import crypto from 'node:crypto';
import { getDb } from './connection.js';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

export function seedDatabase() {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as cnt FROM employees').get().cnt;
  if (count > 0) {
    return;
  }

  const insertEmp = db.prepare(`
    INSERT INTO employees (id, name, work_email, department, designation, role, is_active, face_enrolled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (id, employee_id, email, password_hash, role, face_login_policy)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const defaultPassword = hashPassword('Employee@123');
  const hrPassword = hashPassword('Admin@123');

  // 1. Lokesh Kumar Duba (Employee)
  insertEmp.run(
    'EMP-1187',
    'Lokesh Kumar Duba',
    'lokeshkumarduba123@gmail.com',
    'Engineering',
    'Frontend Developer',
    'EMPLOYEE',
    1,
    0
  );
  insertUser.run('usr-1', 'EMP-1187', 'lokeshkumarduba123@gmail.com', hashPassword('Duba@2003'), 'EMPLOYEE', 'OPTIONAL');

  // 2. Priya Nair (Manager)
  insertEmp.run(
    'MGR-1042',
    'Priya Nair',
    'priya.nair@company.in',
    'Engineering',
    'Engineering Manager',
    'MANAGER',
    1,
    0
  );
  insertUser.run('usr-2', 'MGR-1042', 'priya.nair@company.in', defaultPassword, 'MANAGER', 'OPTIONAL');

  // 3. Rohit Verma (HR Admin)
  insertEmp.run(
    'HR-1001',
    'Rohit Verma',
    'hr.admin@company.in',
    'Human Resources',
    'HR Operations Lead',
    'HR_ADMIN',
    1,
    0
  );
  insertUser.run('usr-3', 'HR-1001', 'hr.admin@company.in', hrPassword, 'HR_ADMIN', 'OPTIONAL');

  console.log('✅ Seed data initialized successfully.');
}
