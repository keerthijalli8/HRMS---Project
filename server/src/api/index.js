// src/api/index.js
import { getDeviceHash } from '../utils/deviceFingerprint.js';

const API_BASE = '/api';

async function buildHeaders(extra = {}, includeAuth = true) {
  const deviceHash = await getDeviceHash();
  const token = includeAuth ? localStorage.getItem('hrms_face_jwt') : null;
  return {
    'X-Device-Hash': deviceHash,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallbackMessage =
      res.status === 502 || res.status === 504
        ? 'Backend API server is unreachable. Start both servers with "npm run dev" or "npm start".'
        : `HTTP error ${res.status}`;
    const error = new Error(data.error || fallbackMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const authApi = {
  async login(identifier, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ identifier, email: identifier, password })
    });
    return handleResponse(res);
  },

  async requestChallenge(tempToken) {
    const res = await fetch(`${API_BASE}/auth/challenge`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ tempToken })
    });
    return handleResponse(res);
  },

  async faceVerify({ tempToken, challengeToken, frames, skipFace = false }) {
    const res = await fetch(`${API_BASE}/auth/face-verify`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ tempToken, challengeToken, frames, skipFace })
    });
    return handleResponse(res);
  },

  async requestFallbackOtp({ tempToken, identifier, password }) {
    const res = await fetch(`${API_BASE}/auth/request-fallback-otp`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ tempToken, identifier, password })
    });
    return handleResponse(res);
  },

  async verifyFallbackOtp({ tempToken, otpSessionId, otpCode }) {
    const res = await fetch(`${API_BASE}/auth/verify-fallback-otp`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ tempToken, otpSessionId, otpCode })
    });
    return handleResponse(res);
  },

  async getMe() {
    const headers = await buildHeaders();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers,
        signal: controller.signal
      });
      return await handleResponse(res);
    } finally {
      clearTimeout(timeout);
    }
  },

  async unlockAccount(employeeId) {
    const res = await fetch(`${API_BASE}/auth/unlock/${employeeId}`, {
      method: 'POST',
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async unlockSelf(identifier, password) {
    const res = await fetch(`${API_BASE}/auth/unlock-self`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ identifier, password })
    });
    return handleResponse(res);
  },

  async updateFacePolicy(employeeId, policy) {
    const res = await fetch(`${API_BASE}/auth/face-policy/${employeeId}`, {
      method: 'PATCH',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ policy })
    });
    return handleResponse(res);
  },

  async forgotPasswordRequestCode(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password/request-code`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async forgotPasswordVerifyCode(otpSessionId, otpCode) {
    const res = await fetch(`${API_BASE}/auth/forgot-password/verify-code`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ otpSessionId, otpCode })
    });
    return handleResponse(res);
  },

  async forgotPasswordReset(resetToken, newPassword, confirmPassword) {
    const res = await fetch(`${API_BASE}/auth/forgot-password/reset-password`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, false),
      body: JSON.stringify({ resetToken, newPassword, confirmPassword })
    });
    return handleResponse(res);
  }
};

export const faceApi = {
  async getEmployees() {
    const res = await fetch(`${API_BASE}/face/employees`, {
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async getStatus(employeeId) {
    const res = await fetch(`${API_BASE}/face/status/${employeeId}`, {
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async requestEnrollOtp(employeeId) {
    const res = await fetch(`${API_BASE}/face/enroll/request-otp`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ employeeId })
    });
    return handleResponse(res);
  },

  async enroll({ employeeId, photos, consent, otpSessionId, otpCode, requestHrApproval }) {
    const res = await fetch(`${API_BASE}/face/enroll`, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        employeeId,
        photos,
        consent,
        otpSessionId,
        otpCode,
        requestHrApproval,
        captureSource: 'LIVE_WEBCAM'
      })
    });
    return handleResponse(res);
  },

  async approveEnrollment(employeeId) {
    const res = await fetch(`${API_BASE}/face/approve/${employeeId}`, {
      method: 'POST',
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async deleteFace(employeeId) {
    const res = await fetch(`${API_BASE}/face/${employeeId}`, {
      method: 'DELETE',
      headers: await buildHeaders()
    });
    return handleResponse(res);
  }
};

export const auditApi = {
  async getLogins(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    const res = await fetch(`${API_BASE}/audit/logins?${params.toString()}`, {
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async getAttempts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) params.append(k, v);
    });
    const res = await fetch(`${API_BASE}/audit/attempts?${params.toString()}`, {
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE}/audit/notifications`, {
      headers: await buildHeaders()
    });
    return handleResponse(res);
  },

  async resolveNotification(id) {
    const res = await fetch(`${API_BASE}/audit/notifications/${id}/resolve`, {
      method: 'POST',
      headers: await buildHeaders()
    });
    return handleResponse(res);
  }
};
