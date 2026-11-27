// src/api/index.js
import { apiClient, apiRequest } from './client.js';

export { apiClient, apiRequest, API_BASE, TOKEN_STORAGE_KEY, getStoredToken, setStoredToken } from './client.js';

export const authApi = {
  login(identifier, password) {
    return apiClient.post(
      '/auth/login',
      { identifier, email: identifier, password },
      { includeAuth: false }
    );
  },

  requestChallenge(tempToken) {
    return apiClient.post('/auth/challenge', { tempToken }, { includeAuth: false });
  },

  faceVerify({ tempToken, challengeToken, frames, skipFace = false }) {
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
  getEmployees() {
    return apiClient.get('/face/employees');
  },

  getStatus(employeeId) {
    return apiClient.get(`/face/status/${employeeId}`);
  },

  requestEnrollOtp(employeeId) {
    return apiClient.post('/face/enroll/request-otp', { employeeId });
  },

  enroll({ employeeId, photos, consent, otpSessionId, otpCode, requestHrApproval }) {
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

  deleteFace(employeeId) {
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
