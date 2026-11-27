// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/index.js';

const AuthContext = createContext(null);

const PENDING_2FA_KEY = 'hrms_pending_2fa';

function getInitialPending2FA() {
  try {
    // 1. Check if passed via URL hash during auto-redirect from non-secure LAN IP to localhost
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
    // 2. Check sessionStorage
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

function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const employeeId = rawUser.employee_id || rawUser.employeeId;
  const faceEnrolled = Boolean(
    rawUser.face_enrolled !== undefined ? rawUser.face_enrolled : rawUser.faceEnrolled
  );
  return {
    ...rawUser,
    employee_id: employeeId,
    employeeId,
    face_enrolled: faceEnrolled,
    faceEnrolled,
    enrollment_status: rawUser.enrollment_status || rawUser.enrollmentStatus || (faceEnrolled ? 'APPROVED' : 'NOT_ENROLLED')
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hrms_face_jwt') || null);
  const [loading, setLoading] = useState(true);

  // Pending 2FA face scan + one-time challenge state (persisted across origin redirect)
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
        // ignore
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
      // If user is already in memory from immediate authentication, avoid redundant refetch
      if (user) {
        if (active) setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        if (active) setUser(normalizeUser(res.user));
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        localStorage.removeItem('hrms_face_jwt');
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
    localStorage.setItem('hrms_face_jwt', res.token);
    setToken(res.token);
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

    if (res.status === 'AUTHENTICATED') {
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
    if (res.status === 'AUTHENTICATED') {
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
    if (res.status === 'AUTHENTICATED') {
      const normalized = applyAuthenticatedSession(res);
      return { ...res, user: normalized };
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('hrms_face_jwt');
    setToken(null);
    setUser(null);
    setPending2FA(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await authApi.getMe();
      setUser(normalizeUser(res.user));
    }
  };

  const isHR = user?.role === 'HR_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const needsFaceEnrollment = Boolean(
    user &&
    !user.face_enrolled &&
    user.enrollment_status !== 'PENDING_HR' &&
    user.face_login_policy !== 'OFF' &&
    user.role !== 'HR_ADMIN'
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
