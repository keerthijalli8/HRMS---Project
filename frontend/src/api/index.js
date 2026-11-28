// src/api/index.js
import { apiClient, apiRequest } from './client.js';

export { apiClient, apiRequest, API_BASE, TOKEN_STORAGE_KEY, getStoredToken, setStoredToken } from './client.js';

// TEST ONLY: these local accounts exist so the existing auth/enrollment UI can
// be exercised when this frontend is run without the backend service.
const LOCAL_TEST_ENROLLMENT_KEY = 'hrms_test_only_face_enrollment_v1';
const LOCAL_TEST_OTP = '000000';
const LOCAL_TEST_ACCOUNTS = {
  'sa@company.in': { password: 'Super@123', role: 'SUPER_ADMIN', name: 'Super Admin Test User', employeeId: 'TEST-SA' },
  'admin@company.in': { password: 'Admin@123', role: 'ADMIN', name: 'Admin Test User', employeeId: 'TEST-ADMIN' },
  'itadmin@company.in': { password: 'ITAdmin@123', role: 'IT_ADMIN', name: 'IT Admin Test User', employeeId: 'TEST-IT-ADMIN' },
  'manager@company.in': { password: 'Manager@123', role: 'MANAGER', name: 'Manager Test User', employeeId: 'TEST-MANAGER' },
  'hr@company.in': { password: 'HR@123', role: 'HR', name: 'HR Test User', employeeId: 'TEST-HR' },
  'tl@company.in': { password: 'TL@123', role: 'TEAM_LEAD', name: 'Team Lead Test User', employeeId: 'TEST-TEAM-LEAD' },
  'employee@company.in': { password: 'Employee@123', role: 'EMPLOYEE', name: 'Employee Test User', employeeId: 'TEST-EMPLOYEE' }
};

function readLocalTestEnrollment() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TEST_ENROLLMENT_KEY) || '{}');
  } catch {
    return {};
  }
}

function isLocalTestToken(token) {
  return typeof token === 'string' && token.startsWith('hrms-test-only:');
}

function getLocalTestEmailFromToken(token) {
  return isLocalTestToken(token) ? token.slice('hrms-test-only:'.length) : null;
}

function getLocalTestAccount(identifier) {
  return LOCAL_TEST_ACCOUNTS[String(identifier || '').trim().toLowerCase()] || null;
}

function localTestUser(email) {
  const account = LOCAL_TEST_ACCOUNTS[email];
  const enrolled = Boolean(readLocalTestEnrollment()[email]?.enrolled);
  return {
    id: `local-test-${account.employeeId.toLowerCase()}`,
    employee_id: account.employeeId,
    employeeId: account.employeeId,
    email,
    name: account.name,
    role: account.role,
    roles: [account.role],
    face_enrolled: enrolled,
    faceEnrolled: enrolled,
    enrollment_status: enrolled ? 'APPROVED' : 'NOT_ENROLLED',
    face_login_policy: 'OFF',
    testOnly: true,
    testOnlyNotice: 'TEST ONLY: local frontend state; no backend biometric authentication.'
  };
}

function localTestSession(email) {
  return `hrms-test-only:${email}`;
}

function localTestAuthResponse(email, status = 'AUTHENTICATED') {
  const user = localTestUser(email);
  if (status === 'FACE_VERIFICATION_REQUIRED') {
    return {
      status,
      tempToken: localTestSession(email),
      challengeToken: `local-test-challenge:${email}`,
      challengeType: 'blink_twice',
      challengeExpiresAt: Date.now() + 45000,
      challengeTtlSeconds: 45,
      employee: {
        id: user.employee_id,
        name: user.name,
        email,
        role: user.role,
        facePolicy: 'OFF',
        failedAttemptsRemaining: null
      }
    };
  }
  return {
    status,
    token: localTestSession(email),
    needsFaceEnrollment: user.face_login_policy !== 'OFF' && !user.face_enrolled,
    user,
    testOnly: true,
    message: 'TEST ONLY: password login completed locally; no backend authentication occurred.'
  };
}

function localTestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.data = { testOnly: true };
  return error;
}

function isLocalTestRequest() {
  return Boolean(getLocalTestEmailFromToken(localStorage.getItem('hrms_face_jwt')));
}

export const authApi = {
  async login(identifier, password) {
    const email = String(identifier || '').trim().toLowerCase();
    const account = getLocalTestAccount(email);
    if (account) {
      if (account.password !== password) {
        throw localTestError('Invalid test account credentials.', 401);
      }
      const testUser = localTestUser(email);
      return localTestAuthResponse(
        email,
        testUser.face_enrolled && testUser.face_login_policy !== 'OFF'
          ? 'FACE_VERIFICATION_REQUIRED'
          : 'AUTHENTICATED'
      );
    }
    return apiClient.post(
      '/auth/login',
      { identifier, email: identifier, password },
      { includeAuth: false }
    );
  },

  async requestChallenge(tempToken) {
    const email = getLocalTestEmailFromToken(tempToken);
    if (email) {
      return {
        challengeToken: `local-test-challenge:${email}:${Date.now()}`,
        challengeType: 'blink_twice',
        expiresAt: Date.now() + 45000,
        ttlSeconds: 45,
        testOnly: true,
        message: 'TEST ONLY: liveness UI challenge; no server challenge was issued.'
      };
    }
    return apiClient.post('/auth/challenge', { tempToken }, { includeAuth: false });
  },

  async faceVerify({ tempToken, challengeToken, frames, skipFace = false }) {
    const email = getLocalTestEmailFromToken(tempToken);
    if (email) {
      if (skipFace) {
        throw localTestError('TEST ONLY: face verification cannot be skipped for local test accounts.', 400);
      }
      if (!challengeToken || !Array.isArray(frames) || frames.length < 1) {
        throw localTestError('TEST ONLY: complete the existing liveness capture before continuing.', 400);
      }
      if (!localTestUser(email).face_enrolled) {
        throw localTestError('TEST ONLY: enroll this account before face verification.', 400);
      }
      return {
        status: 'AUTHENTICATED',
        token: localTestSession(email),
        user: localTestUser(email),
        matchScore: 1,
        testOnly: true,
        message: 'TEST ONLY: local face-verification completion; no server matching or anti-spoof check occurred.'
      };
    }
    return apiClient.post(
      '/auth/face-verify',
      { tempToken, challengeToken, frames, skipFace },
      { includeAuth: false }
    );
  },

  requestFallbackOtp({ tempToken, identifier, password }) {
    return apiClient.post(
      '/auth/request-fallback-otp',
      { tempToken, identifier, password },
      { includeAuth: false }
    );
  },

  verifyFallbackOtp({ tempToken, otpSessionId, otpCode }) {
    return apiClient.post(
      '/auth/verify-fallback-otp',
      { tempToken, otpSessionId, otpCode },
      { includeAuth: false }
    );
  },

  async getMe() {
    const email = getLocalTestEmailFromToken(localStorage.getItem('hrms_face_jwt'));
    if (email) {
      return {
        status: 'AUTHENTICATED',
        token: localTestSession(email),
        user: localTestUser(email),
        testOnly: true,
        message: 'TEST ONLY: local frontend session restored; no backend session was restored.'
      };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      return await apiRequest('/auth/me', { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  },

  unlockAccount(employeeId) {
    return apiClient.post(`/auth/unlock/${employeeId}`);
  },

  unlockSelf(identifier, password) {
    return apiClient.post('/auth/unlock-self', { identifier, password }, { includeAuth: false });
  },

  updateFacePolicy(employeeId, policy) {
    return apiClient.patch(`/auth/face-policy/${employeeId}`, { policy });
  },

  forgotPasswordRequestCode(email) {
    return apiClient.post('/auth/forgot-password/request-code', { email }, { includeAuth: false });
  },

  forgotPasswordVerifyCode(otpSessionId, otpCode) {
    return apiClient.post('/auth/forgot-password/verify-code', { otpSessionId, otpCode }, { includeAuth: false });
  },

  forgotPasswordReset(resetToken, newPassword, confirmPassword) {
    return apiClient.post(
      '/auth/forgot-password/reset-password',
      { resetToken, newPassword, confirmPassword },
      { includeAuth: false }
    );
  }
};

export const faceApi = {
  async getEmployees() {
    if (isLocalTestRequest()) {
      return {
        count: Object.keys(LOCAL_TEST_ACCOUNTS).length,
        employees: Object.entries(LOCAL_TEST_ACCOUNTS).map(([email, account]) => ({
          id: account.employeeId,
          name: account.name,
          work_email: email,
          role: account.role,
          face_enrolled: localTestUser(email).face_enrolled,
          enrollment_status: localTestUser(email).enrollment_status,
          testOnly: true
        }))
      };
    }
    return apiClient.get('/face/employees');
  },

  async getStatus(employeeId) {
    if (isLocalTestRequest()) {
      const email = getLocalTestEmailFromToken(localStorage.getItem('hrms_face_jwt'));
      const user = localTestUser(email);
      if (employeeId !== user.employee_id) {
        throw localTestError('TEST ONLY: local users may view only their own enrollment state.', 403);
      }
      return {
        employeeId,
        name: user.name,
        faceEnrolled: user.face_enrolled,
        enrollmentStatus: user.enrollment_status,
        posesCount: user.face_enrolled ? 5 : 0,
        poses: user.face_enrolled ? ['straight', 'left', 'right', 'up', 'down'] : [],
        consent: user.face_enrolled ? { testOnly: true, granted: true } : null,
        testOnly: true,
        message: 'TEST ONLY: enrollment state is stored in this browser only.'
      };
    }
    return apiClient.get(`/face/status/${employeeId}`);
  },

  async requestEnrollOtp(employeeId) {
    if (isLocalTestRequest()) {
      const email = getLocalTestEmailFromToken(localStorage.getItem('hrms_face_jwt'));
      const user = localTestUser(email);
      if (employeeId !== user.employee_id) {
        throw localTestError('TEST ONLY: local users may enroll only themselves.', 403);
      }
      return {
        success: true,
        otpSessionId: `local-test-otp:${email}`,
        demoOtp: LOCAL_TEST_OTP,
        testOnly: true,
        message: 'TEST ONLY: no backend OTP was sent. Enter 000000 to continue local UI testing.'
      };
    }
    return apiClient.post('/face/enroll/request-otp', { employeeId });
  },

  async enroll({ employeeId, photos, consent, otpSessionId, otpCode, requestHrApproval }) {
    if (isLocalTestRequest()) {
      const email = getLocalTestEmailFromToken(localStorage.getItem('hrms_face_jwt'));
      const user = localTestUser(email);
      const requiredPoses = ['straight', 'left', 'right', 'up', 'down'];
      if (employeeId !== user.employee_id) {
        throw localTestError('TEST ONLY: local users may enroll only themselves.', 403);
      }
      if (!consent?.granted) {
        throw localTestError('TEST ONLY: confirm the existing consent step before enrolling.');
      }
      const missingPose = requiredPoses.find(pose => !photos?.[pose]);
      if (missingPose) {
        throw localTestError(`TEST ONLY: capture the required ${missingPose} pose first.`);
      }
      const localRequiresOtp = !['ADMIN', 'HR', 'MANAGER'].includes(user.role) && !requestHrApproval;
      if (localRequiresOtp && (!otpSessionId || otpCode !== LOCAL_TEST_OTP)) {
        throw localTestError('TEST ONLY: use the displayed local test OTP 000000, or choose HR Approval.');
      }
      const enrollment = readLocalTestEnrollment();
      enrollment[email] = {
        enrolled: true,
        enrolledAt: new Date().toISOString(),
        testOnly: true,
        requiredPosesCaptured: requiredPoses,
        consentRecorded: true,
        approvalMethod: requestHrApproval ? 'LOCAL_TEST_APPROVAL' : 'LOCAL_TEST_OTP'
      };
      localStorage.setItem(LOCAL_TEST_ENROLLMENT_KEY, JSON.stringify(enrollment));
      return {
        success: true,
        approvalStatus: 'APPROVED',
        employeeId,
        posesCount: requiredPoses.length,
        testOnly: true,
        message: 'TEST ONLY: enrollment state saved locally. No biometric vectors, OTP, backend approval, or anti-spoof verification occurred.'
      };
    }
    return apiClient.post('/face/enroll', {
      employeeId,
      photos,
      consent,
      otpSessionId,
      otpCode,
      requestHrApproval,
      captureSource: 'LIVE_WEBCAM'
    });
  },

  approveEnrollment(employeeId) {
    return apiClient.post(`/face/approve/${employeeId}`);
  },

  async deleteFace(employeeId) {
    if (isLocalTestRequest()) {
      const email = getLocalTestEmailFromToken(localStorage.getItem('hrms_face_jwt'));
      const user = localTestUser(email);
      if (employeeId !== user.employee_id) {
        throw localTestError('TEST ONLY: local users may reset only themselves.', 403);
      }
      const enrollment = readLocalTestEnrollment();
      delete enrollment[email];
      localStorage.setItem(LOCAL_TEST_ENROLLMENT_KEY, JSON.stringify(enrollment));
      return {
        success: true,
        testOnly: true,
        message: 'TEST ONLY: local enrollment state was reset. No server biometric data was deleted.'
      };
    }
    return apiClient.delete(`/face/${employeeId}`);
  }
};

export const auditApi = {
  getLogins(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    return apiClient.get(`/audit/logins?${params.toString()}`);
  },

  getAttempts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) params.append(k, v);
    });
    return apiClient.get(`/audit/attempts?${params.toString()}`);
  },

  getNotifications() {
    return apiClient.get('/audit/notifications');
  },

  resolveNotification(id) {
    return apiClient.post(`/audit/notifications/${id}/resolve`);
  }
};
