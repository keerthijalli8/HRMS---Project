// backend/src/db/connection.js
import { DatabaseSync } from 'node:sqlite';
import config from '../config/index.js';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(config.dbPath);
    // Enable WAL mode for high concurrency
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export default { getDb, closeDb };

