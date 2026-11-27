// backend/tests/crypto.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptText,
  decryptText,
  saveEncryptedPhoto,
  readDecryptedPhoto,
  deletePhoto
} from '../src/services/cryptoService.js';

test('AES-256-GCM: encryptText and decryptText roundtrip', () => {
  const original = JSON.stringify({ userId: 'EMP-1187', vector: [0.12, 0.45, 0.88] });
  const encrypted = encryptText(original);

  assert.notEqual(encrypted, original);
  assert.ok(encrypted.includes(':'));

  const decrypted = decryptText(encrypted);
  assert.equal(decrypted, original);
});

test('AES-256-GCM: detects tampering in encrypted payload', () => {
  const original = 'secret-biometric-token';
  const encrypted = encryptText(original);
  const parts = encrypted.split(':');

  // Corrupt ciphertext
  parts[2] = parts[2].substring(0, parts[2].length - 2) + 'ff';
  const tampered = parts.join(':');

  assert.throws(() => {
    decryptText(tampered);
  }, /unsupported state or unable to authenticate data|bad decrypt/i);
});

test('saveEncryptedPhoto and readDecryptedPhoto: binary roundtrip', () => {
  const mockImageBuffer = Buffer.from('FAKE_JPEG_IMAGE_HEADER_AND_PIXELS_FOR_TESTING');
  const filename = `test_photo_${Date.now()}`;

  const savedName = saveEncryptedPhoto(mockImageBuffer, filename);
  assert.ok(savedName.endsWith('.enc'));

  const decryptedBuffer = readDecryptedPhoto(savedName);
  assert.deepEqual(decryptedBuffer, mockImageBuffer);

  // Clean up
  const deleted = deletePhoto(savedName);
  assert.equal(deleted, true);
});
