// backend/src/services/cryptoService.js
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

function getKey() {
  // Ensure exactly 32 bytes (256 bits)
  const hex = config.encryptionKey;
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, 'hex');
  }
  return crypto.createHash('sha256').update(hex).digest();
}

/**
 * Encrypt a text or JSON payload using AES-256-GCM
 */
export function encryptText(plaintext) {
  if (!plaintext) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a text encrypted with AES-256-GCM
 */
export function decryptText(encryptedPayload) {
  if (!encryptedPayload) return null;
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypts a binary buffer or base64 image and saves to a secure encrypted file
 * Returns the relative file path
 */
export function saveEncryptedPhoto(bufferOrBase64, filename) {
  let buffer;
  if (typeof bufferOrBase64 === 'string') {
    // Strip data URI header if present
    const cleanBase64 = bufferOrBase64.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(cleanBase64, 'base64');
  } else {
    buffer = bufferOrBase64;
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + ciphertext into binary file
  const fullPayload = Buffer.concat([iv, authTag, encrypted]);

  const destPath = path.join(config.photosDir, `${filename}.enc`);
  fs.writeFileSync(destPath, fullPayload);
  return `${filename}.enc`;
}

/**
 * Reads and decrypts an encrypted photo file, returning a binary Buffer (or null if not found)
 */
export function readDecryptedPhoto(filenameWithExt) {
  const fullPath = path.join(config.photosDir, filenameWithExt);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileBuffer = fs.readFileSync(fullPath);
  if (fileBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted photo file is corrupt or truncated');
  }

  const iv = fileBuffer.subarray(0, IV_LENGTH);
  const authTag = fileBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = fileBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

/**
 * Deletes an encrypted photo file from secure storage
 */
export function deletePhoto(filenameWithExt) {
  const fullPath = path.join(config.photosDir, filenameWithExt);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}

