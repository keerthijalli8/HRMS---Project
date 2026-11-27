// src/api/client.js
import { getDeviceHash } from '../utils/deviceFingerprint.js';

export const API_BASE = '/api';
export const TOKEN_STORAGE_KEY = 'hrms_face_jwt';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function buildHeaders(extra = {}, includeAuth = true) {
  const deviceHash = await getDeviceHash();
  const token = includeAuth ? getStoredToken() : null;
  return {
    'X-Device-Hash': deviceHash,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

export async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const isProxyUnreachable =
      res.status === 502 ||
      res.status === 503 ||
      res.status === 504 ||
      (res.status === 500 && !data.error);
    const fallbackMessage = isProxyUnreachable
      ? 'Backend API server is unreachable on port 5005. Start the backend server (Emp Face Login) and try again.'
      : `HTTP error ${res.status}`;
    const error = new Error(data.error || fallbackMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, includeAuth = true, signal } = {}) {
  const isJsonBody = body !== undefined && !(body instanceof FormData);
  const finalHeaders = await buildHeaders(
    {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    includeAuth
  );

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: isJsonBody ? JSON.stringify(body) : body,
    signal
  });

  return handleResponse(res);
}

export const apiClient = {
  get: (path, opts = {}) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts = {}) => apiRequest(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts = {}) => apiRequest(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts = {}) => apiRequest(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts = {}) => apiRequest(path, { ...opts, method: 'DELETE' })
};
