import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../backend/data/hrms_face.sqlite');

const db = new DatabaseSync(dbPath);
db.prepare('UPDATE users SET is_locked = 0, failed_face_attempts = 0, locked_at = NULL').run();
db.prepare("UPDATE hr_notifications SET is_resolved = 1 WHERE event_type LIKE '%LOCK%'").run();

console.log('✅ All users unlocked successfully:');
const users = db.prepare('SELECT id, email, employee_id, is_locked, failed_face_attempts FROM users').all();
console.table(users);
