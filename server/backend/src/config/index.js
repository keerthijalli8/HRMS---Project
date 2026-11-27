// backend/src/config/index.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

export const config = {
  port: parseInt(process.env.PORT || '5005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serverTimezone: process.env.SERVER_TIMEZONE || 'Asia/Kolkata',

  // Security & Short-Lived JWT
  encryptionKey: process.env.ENCRYPTION_KEY || 'a7d2f8319e04bc581e2894b6138d9f10a8b417e290f6c24387d091e325a7b8e1',
  jwtSecret: process.env.JWT_SECRET || 'hrms_super_secure_jwt_secret_token_2026_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',

  // Face recognition & anti-spoofing thresholds
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.48'),
  antiSpoofThreshold: parseFloat(process.env.ANTISPOOF_THRESHOLD || '0.72'),
  faceMinBrightness: parseInt(process.env.FACE_MIN_BRIGHTNESS || '35', 10),
  faceMaxBrightness: parseInt(process.env.FACE_MAX_BRIGHTNESS || '235', 10),
  faceMinSharpness: parseInt(process.env.FACE_MIN_SHARPNESS || '22', 10),

  // Anti-Replay & Lockout Policies (unlimited face detection attempts - no lock)
  challengeTtlSeconds: parseInt(process.env.CHALLENGE_TTL_SECONDS || '45', 10),
  otpTtlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '180', 10),
  maxFaceLoginAttempts: parseInt(process.env.MAX_FACE_LOGIN_ATTEMPTS || '999999', 10),
  dpdpConsentVersion: process.env.DPDP_CONSENT_VERSION || '2026.1-DPDP-IN',
  photoRetentionDays: parseInt(process.env.PHOTO_RETENTION_DAYS || '90', 10),

  // Storage
  dbPath: path.resolve(rootDir, process.env.DB_PATH || './backend/data/hrms_face.sqlite'),
  photosDir: path.resolve(rootDir, './backend/secure_storage/photos'),
  tempDir: path.resolve(rootDir, './backend/secure_storage/temp')
};

if (!fs.existsSync(path.dirname(config.dbPath))) {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}
if (!fs.existsSync(config.photosDir)) {
  fs.mkdirSync(config.photosDir, { recursive: true });
}
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

export default config;
