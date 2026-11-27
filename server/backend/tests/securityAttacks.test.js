// backend/tests/securityAttacks.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_ENV = 'test';
const testDbRelative = './backend/data/test_security_attacks.sqlite';
process.env.DB_PATH = testDbRelative;

const { default: app } = await import('../src/server.js');
const { getDb, closeDb } = await import('../src/db/connection.js');
const { config } = await import('../src/config/index.js');

const DEV_A = 'device-hash-browser-alpha-001';
const DEV_B = 'device-hash-attacker-hijack-999';

function makeMockFrame(seedText) {
  return 'data:image/jpeg;base64,' + Buffer.from(seedText.repeat(30)).toString('base64');
}

function makeSparseOrthogonalFrame(activeFirstHalf, variant = 0) {
  // Smooth skin-like gradients in one half and near-zero textured jitter in the other half so opposite halves are orthogonal (cos=0)
  const buf = Buffer.alloc(1536);
  for (let i = 0; i < buf.length; i++) {
    const inFirst = i < buf.length / 2;
    const isActive = activeFirstHalf ? inFirst : !inFirst;
    buf[i] = isActive ? Math.round(140 + 75 * Math.sin((i + variant * 5) / 7)) : 2;
  }
  return 'data:image/jpeg;base64,' + buf.toString('base64');
}

const FRAME_0 = makeSparseOrthogonalFrame(true, 0);
const FRAME_1 = makeMockFrame('WEBCAM_FRAME_CHALLENGE_PEAK_B_');
const FRAME_2 = makeMockFrame('WEBCAM_FRAME_FINAL_STRAIGHT_A_');
const STRANGER_FRAME = makeSparseOrthogonalFrame(false, 1);
const FLAT_SPOOF_FRAME = 'data:image/jpeg;base64,' + Buffer.alloc(1600, 128).toString('base64');

function api(route, { method = 'GET', body, token, deviceHash = DEV_A } = {}) {
  return new Promise((resolve, reject) => {
    const rawBody = body ? JSON.stringify(body) : '';
    const socket = new PassThrough();
    socket.remoteAddress = '127.0.0.1';

    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = route;
    req.originalUrl = route;
    req.headers = {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(rawBody)),
      'x-device-hash': deviceHash,
      ...(token ? { authorization: `Bearer ${token}` } : {})
    };

    const res = new http.ServerResponse(req);
    const chunks = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.write = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      return origWrite(chunk, encoding, cb);
    };

    res.end = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      const bodyStart = raw.indexOf('\r\n\r\n');
      const bodyText = bodyStart >= 0 ? raw.slice(bodyStart + 4) : raw;
      let parsed = {};
      try {
        parsed = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        parsed = { raw: bodyText };
      }
      origEnd(chunk, encoding, cb);
      resolve({ status: res.statusCode, data: parsed });
    };

    res.assignSocket(socket);

    if (rawBody) {
      req.push(rawBody);
    }
    req.push(null);

    app(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: 404, data: { error: 'Not found' } });
    });
  });
}

test.after(() => {
  closeDb();
  const resolved = path.resolve(process.cwd(), testDbRelative);
  for (const suffix of ['', '-wal', '-shm']) {
    if (fs.existsSync(resolved + suffix)) {
      fs.unlinkSync(resolved + suffix);
    }
  }
});

test('Security Flow: Live Enrollment (No File Upload, No Raw Image Storage, OTP Verified)', async () => {
  const empLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'aarav.mehta@company.in', password: 'Employee@123' }
  });
  assert.equal(empLogin.status, 200);
  assert.equal(empLogin.data.status, 'AUTHENTICATED');
  const empToken = empLogin.data.token;

  // Reject stolen JWT on different device
  const hijackedRes = await api('/api/auth/me', { token: empToken, deviceHash: DEV_B });
  assert.equal(hijackedRes.status, 403);
  assert.equal(hijackedRes.data.code, 'DEVICE_MISMATCH');

  // Reject file-upload enrollment attempt
  const photos = {
    straight: FRAME_0,
    left: makeSparseOrthogonalFrame(true, 1),
    right: makeSparseOrthogonalFrame(true, 2),
    up: makeSparseOrthogonalFrame(true, 3),
    down: makeSparseOrthogonalFrame(true, 4)
  };
  const uploadAttempt = await api('/api/face/enroll', {
    method: 'POST',
    token: empToken,
    body: { photos, consent: { granted: true }, captureSource: 'FILE_UPLOAD', requestHrApproval: true }
  });
  assert.equal(uploadAttempt.status, 400);

  // Request Enrollment OTP & complete live enrollment
  const otpReq = await api('/api/face/enroll/request-otp', { method: 'POST', token: empToken });
  assert.equal(otpReq.status, 200);
  assert.ok(otpReq.data.demoOtp);

  const enrollRes = await api('/api/face/enroll', {
    method: 'POST',
    token: empToken,
    body: {
      photos,
      consent: { granted: true },
      otpSessionId: otpReq.data.otpSessionId,
      otpCode: otpReq.data.demoOtp
    }
  });
  assert.equal(enrollRes.status, 200);
  assert.equal(enrollRes.data.approvalStatus, 'APPROVED');

  // Verify zero raw image stored in DB
  const db = getDb();
  const empRow = db.prepare('SELECT face_enrolled, enrollment_status, profile_thumbnail_path FROM employees WHERE id = ?').get('EMP-1187');
  assert.equal(empRow.face_enrolled, 1);
  assert.equal(empRow.enrollment_status, 'APPROVED');
  assert.equal(empRow.profile_thumbnail_path, null);
});

test('Anti-Spoof & Anti-Replay: Reject Static Replayed Frames, Flat Spoofs, Reused & Expired Tokens', async () => {
  const loginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'EMP-1187', password: 'Employee@123' }
  });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.data.status, 'FACE_VERIFICATION_REQUIRED');
  assert.ok(loginRes.data.challengeToken);
  assert.ok(['blink_twice', 'turn_left', 'turn_right', 'smile', 'nod'].includes(loginRes.data.challengeType));

  const { tempToken, challengeToken } = loginRes.data;

  // Attack 1: Replay identical static frame across [frame0, frame1, frame2]
  const staticReplayRes = await api('/api/auth/face-verify', {
    method: 'POST',
    body: { tempToken, challengeToken, frames: [FRAME_0, FRAME_0, FRAME_0] }
  });
  assert.equal(staticReplayRes.status, 403);
  assert.equal(staticReplayRes.data.reason, 'spoof_suspected');

  // Attack 2: Reuse the same challengeToken -> must be rejected as REPLAY_DETECTED
  const tokenReuseRes = await api('/api/auth/face-verify', {
    method: 'POST',
    body: { tempToken, challengeToken, frames: [FRAME_0, FRAME_1, FRAME_2] }
  });
  assert.equal(tokenReuseRes.status, 401);
  assert.equal(tokenReuseRes.data.code, 'REPLAY_DETECTED');

  // Attack 3: Flat solid photo spoof on a fresh challenge
  const chg2 = await api('/api/auth/challenge', { method: 'POST', body: { tempToken } });
  assert.equal(chg2.status, 200);
  const flatRes = await api('/api/auth/face-verify', {
    method: 'POST',
    body: { tempToken, challengeToken: chg2.data.challengeToken, frames: [FLAT_SPOOF_FRAME, makeMockFrame('OTHER_FLAT_')] }
  });
  assert.equal(flatRes.status, 403);
  assert.equal(flatRes.data.reason, 'spoof_suspected');

  // Attack 4: Expired challenge token must be rejected
  const chgExpired = await api('/api/auth/challenge', { method: 'POST', body: { tempToken } });
  const db = getDb();
  db.prepare('UPDATE challenge_tokens SET expires_at = ? WHERE employee_id = ? AND used = 0').run(Date.now() - 5000, 'EMP-1187');
  const expiredRes = await api('/api/auth/face-verify', {
    method: 'POST',
    body: { tempToken, challengeToken: chgExpired.data.challengeToken, frames: [FRAME_0, FRAME_1, FRAME_0] }
  });
  assert.equal(expiredRes.status, 401);
  assert.equal(expiredRes.data.code, 'CHALLENGE_EXPIRED');

  // Re-issue a fresh valid challenge for genuine match
  const chgValid = await api('/api/auth/challenge', { method: 'POST', body: { tempToken } });
  const successRes = await api('/api/auth/face-verify', {
    method: 'POST',
    body: { tempToken, challengeToken: chgValid.data.challengeToken, frames: [FRAME_0, FRAME_1, FRAME_0] }
  });
  assert.equal(successRes.status, 200);
  assert.equal(successRes.data.status, 'AUTHENTICATED');
  assert.ok(successRes.data.token);
});

test('Fallback OTP + 5-Attempt Lockout & HR Unlock Flow', async () => {
  const origMaxAttempts = config.maxFaceLoginAttempts;
  config.maxFaceLoginAttempts = 5;

  try {
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'EMP-1187', password: 'Employee@123' }
    });
    const { tempToken } = loginRes.data;

    const otpReq = await api('/api/auth/request-fallback-otp', { method: 'POST', body: { tempToken } });
    assert.equal(otpReq.status, 200);
    const otpVerify = await api('/api/auth/verify-fallback-otp', {
      method: 'POST',
      body: { tempToken, otpSessionId: otpReq.data.otpSessionId, otpCode: otpReq.data.demoOtp }
    });
    assert.equal(otpVerify.status, 200);
    assert.equal(otpVerify.data.fallbackUsed, true);

    // Trigger 5 consecutive mismatched face attempts -> Account Locked & HR notified
    const stepLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'EMP-1187', password: 'Employee@123' }
    });
    const t2 = stepLogin.data.tempToken;

    let lastRes;
    for (let i = 0; i < 5; i++) {
      const chg = await api('/api/auth/challenge', { method: 'POST', body: { tempToken: t2 } });
      lastRes = await api('/api/auth/face-verify', {
        method: 'POST',
        body: { tempToken: t2, challengeToken: chg.data.challengeToken, frames: [FRAME_0, FRAME_1, STRANGER_FRAME] }
      });
    }
    assert.equal(lastRes.status, 403);
    assert.equal(lastRes.data.locked, true);

    // HR logs in, inspects HR notifications, and unlocks EMP-1187
    const hrLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'hr.admin@company.in', password: 'Admin@123' }
    });
    assert.equal(hrLogin.status, 200);
    const hrToken = hrLogin.data.token;

    const alerts = await api('/api/audit/notifications', { token: hrToken });
    assert.equal(alerts.status, 200);
    assert.ok(alerts.data.data.some(n => n.employee_id === 'EMP-1187' && n.event_type === 'LOCKED'));

    const unlock = await api('/api/auth/unlock/EMP-1187', { method: 'POST', token: hrToken });
    assert.equal(unlock.status, 200);
  } finally {
    config.maxFaceLoginAttempts = origMaxAttempts;
  }
});
