// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getStoredToken, setStoredToken } from '../api/index.js';
import { normalizeRoles, getHighestPriorityRole } from './roles.js';

const AuthContext = createContext(null);

const PENDING_2FA_KEY = 'hrms_pending_2fa';

function getInitialPending2FA() {
  try {
    if (typeof window !== 'undefined' && window.location.hash.includes('p2fa=')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const raw = hashParams.get('p2fa');
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw));
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        if (parsed && (!parsed.challengeExpiresAt || Date.now() < parsed.challengeExpiresAt)) {
          sessionStorage.setItem(PENDING_2FA_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(PENDING_2FA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (!parsed.challengeExpiresAt || Date.now() < parsed.challengeExpiresAt)) {
          return parsed;
        }
        sessionStorage.removeItem(PENDING_2FA_KEY);
      }
    }
  } catch (err) {
    console.warn('Failed to parse pending 2FA state:', err);
  }
  return null;
}

export function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const employeeId = rawUser.employee_id || rawUser.employeeId || rawUser.id;
  const faceEnrolled = Boolean(
    rawUser.face_enrolled !== undefined ? rawUser.face_enrolled : rawUser.faceEnrolled
  );
  const faceLoginPolicy = rawUser.face_login_policy || rawUser.faceLoginPolicy || 'OPTIONAL';
  const roles = normalizeRoles(rawUser);
  const primaryRole = getHighestPriorityRole(roles);

  return {
    ...rawUser,
    id: rawUser.id || employeeId,
    name: rawUser.name || 'Employee',
    roles,
    role: rawUser.role || primaryRole,
    primaryRole,
    employee_id: employeeId,
    employeeId,
    face_enrolled: faceEnrolled,
    faceEnrolled,
    face_login_policy: faceLoginPolicy,
    faceLoginPolicy,
    enrollment_status:
      rawUser.enrollment_status ||
      rawUser.enrollmentStatus ||
      (faceEnrolled ? 'APPROVED' : 'NOT_ENROLLED')
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FAState] = useState(getInitialPending2FA);

  const setPending2FA = useCallback((valOrUpdater) => {
    setPending2FAState((prev) => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      try {
        if (next) {
          sessionStorage.setItem(PENDING_2FA_KEY, JSON.stringify(next));
        } else {
          sessionStorage.removeItem(PENDING_2FA_KEY);
        }
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 2500);

    async function loadUser() {
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      if (user) {
        if (active) setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        if (active) setUser(normalizeUser(res.user));
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        setStoredToken(null);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUser();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, [token, user]);

  const applyAuthenticatedSession = (res) => {
    const normalized = normalizeUser(res.user);
    if (res.token) {
      setStoredToken(res.token);
      setToken(res.token);
    }
    setUser(normalized);
    setPending2FA(null);
    return normalized;
  };

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);

    if (res.status === 'FACE_VERIFICATION_REQUIRED') {
      setPending2FA({
        tempToken: res.tempToken,
        challengeToken: res.challengeToken,
        challengeType: res.challengeType,
        challengeExpiresAt: res.challengeExpiresAt,
        challengeTtlSeconds: res.challengeTtlSeconds,
        employee: res.employee
      });
      return {
        requiresFace: true,
        employee: res.employee,
        challengeType: res.challengeType
      };
    }

    if (res.status === 'AUTHENTICATED' || (res.token && res.user)) {
      const normalized = applyAuthenticatedSession(res);
      return {
        requiresFace: false,
        needsFaceEnrollment: Boolean(res.needsFaceEnrollment),
        user: normalized
      };
    }

    throw new Error('Unexpected authentication response status');
  };

  const refreshChallenge = async () => {
    if (!pending2FA?.tempToken) {
      throw new Error('No active 2FA session.');
    }
    const res = await authApi.requestChallenge(pending2FA.tempToken);
    setPending2FA(prev => (prev ? {
      ...prev,
      challengeToken: res.challengeToken,
      challengeType: res.challengeType,
      challengeExpiresAt: res.expiresAt,
      challengeTtlSeconds: res.ttlSeconds
    } : null));
    return res;
  };

  const completeFaceLogin = async (frames, skip = false) => {
    if (!pending2FA?.tempToken) {
      throw new Error('No pending face verification session found.');
    }
    const res = await authApi.faceVerify({
      tempToken: pending2FA.tempToken,
      challengeToken: pending2FA.challengeToken,
      frames,
      skipFace: skip
    });
    if (res.status === 'AUTHENTICATED' || (res.token && res.user)) {
      const normalized = applyAuthenticatedSession(res);
      return { ...res, user: normalized };
    }
    return res;
  };

  const requestFallbackOtp = async () => {
    if (!pending2FA?.tempToken) {
      throw new Error('No pending 2FA session found.');
    }
    return authApi.requestFallbackOtp({ tempToken: pending2FA.tempToken });
  };

  const completeOtpFallback = async ({ otpSessionId, otpCode }) => {
    const res = await authApi.verifyFallbackOtp({
      tempToken: pending2FA?.tempToken,
      otpSessionId,
      otpCode
    });
    if (res.status === 'AUTHENTICATED' || (res.token && res.user)) {
      const normalized = applyAuthenticatedSession(res);
      return { ...res, user: normalized };
    }
    return res;
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setPending2FA(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await authApi.getMe();
      const normalized = normalizeUser(res.user);
      setUser(normalized);
      return normalized;
    }
    return null;
  };

  const updateProfile = async (updates = {}) => {
    try {
      const raw = localStorage.getItem('hrms_employee_profile_overrides');
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem('hrms_employee_profile_overrides', JSON.stringify({ ...prev, ...updates }));
    } catch {
      // ignore storage errors
    }
    let nextUser = null;
    setUser(prev => {
      nextUser = prev ? { ...prev, ...updates } : prev;
      return nextUser;
    });
    return { user: nextUser };
  };

  const updateAvatar = async (avatarUrl) => {
    try {
      if (avatarUrl) {
        localStorage.setItem('hrms_employee_avatar_url', avatarUrl);
      } else {
        localStorage.removeItem('hrms_employee_avatar_url');
      }
    } catch {
      // ignore storage errors
    }
    let nextUser = null;
    setUser(prev => {
      nextUser = prev ? { ...prev, avatarUrl: avatarUrl || null } : prev;
      return nextUser;
    });
    return { user: nextUser };
  };

  const roles = user?.roles || [];
  const isHR = roles.some(r => ['ADMIN', 'HR', 'MANAGER'].includes(r));

  const needsFaceEnrollment = Boolean(
    user &&
    !user.face_enrolled &&
    user.enrollment_status !== 'PENDING_HR' &&
    user.face_login_policy !== 'OFF'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pending2FA,
        setPending2FA,
        login,
        refreshChallenge,
        completeFaceLogin,
        requestFallbackOtp,
        completeOtpFallback,
        logout,
        refreshUser,
        updateProfile,
        updateAvatar,
        isAuthenticated: !!user,
        isHR,
        needsFaceEnrollment
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
