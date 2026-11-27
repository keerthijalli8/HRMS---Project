// backend/tests/integration.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Isolate test environment and database from live development database
process.env.NODE_ENV = 'test';
const testDbRelative = './backend/data/test_integration.sqlite';
process.env.DB_PATH = testDbRelative;

const { runMigrations } = await import('../src/db/migrations.js');
const { seedDatabase } = await import('../src/db/seed.js');
const { getDb, closeDb } = await import('../src/db/connection.js');
const {
  extractFaceEmbedding,
  storeEnrolledEmbeddings,
  matchEmployeeFace,
  deleteEmployeeFaceData
} = await import('../src/services/faceEngine.js');
const { evaluatePassiveLiveness } = await import('../src/services/antiSpoofService.js');

runMigrations();
seedDatabase();

const mockBase64 = 'data:image/jpeg;base64,' + Buffer.from('TEST_WEBCAM_JPEG_MOCK_IMAGE_DATA_PADDING_FOR_QUALITY_CHECK_'.repeat(25)).toString('base64');

test.after(() => {
  closeDb();
  const resolved = path.resolve(process.cwd(), testDbRelative);
  for (const suffix of ['', '-wal', '-shm']) {
    if (fs.existsSync(resolved + suffix)) {
      fs.unlinkSync(resolved + suffix);
    }
  }
});

test('Integration: Enroll 5 Poses and 1:1 Face Login Match', async () => {
  const employeeId = 'EMP-1187';
  const poses = ['straight', 'left', 'right', 'up', 'down'];
  const posesWithEmbeddings = [];

  for (const pose of poses) {
    const emb = await extractFaceEmbedding(mockBase64, pose);
    posesWithEmbeddings.push({ pose, embedding: emb });
  }

  storeEnrolledEmbeddings(employeeId, posesWithEmbeddings);

  // Verify 1:1 match succeeds for the enrolled employee
  const queryEmbedding = await extractFaceEmbedding(mockBase64, 'straight');
  const match = matchEmployeeFace(employeeId, queryEmbedding);

  assert.equal(match.matched, true);
  assert.ok(match.distance <= 0.50);
  assert.ok(match.matchScore >= 0.75);

  // Verify employee with NO enrollment returns unmatched
  const unmatched = matchEmployeeFace('MGR-1042', queryEmbedding);
  assert.equal(unmatched.matched, false);
  assert.ok(unmatched.error.includes('No active face profile'));
});

test('Integration: Passive Anti-Spoof & Delete Face Biometrics', async () => {
  const employeeId = 'EMP-1187';

  // Flat solid image should trigger spoof rejection
  const flatPayload = 'data:image/jpeg;base64,' + Buffer.alloc(1500, 128).toString('base64');
  const spoofCheck = await evaluatePassiveLiveness(flatPayload);
  assert.equal(spoofCheck.passed, false);
  assert.ok(spoofCheck.reason.includes('spoof_suspected'));

  // Delete biometric data resets enrollment flag
  deleteEmployeeFaceData(employeeId);
  const db = getDb();
  const emp = db.prepare('SELECT face_enrolled FROM employees WHERE id = ?').get(employeeId);
  assert.equal(emp.face_enrolled, 0);
});
