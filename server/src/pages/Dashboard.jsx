// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  Building2,
  Clock,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { auditApi, faceApi } from '../api/index.js';
import { Card } from '../components/common/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';

export function Dashboard() {
  const { user, isHR } = useAuth();
  const navigate = useNavigate();

  const [loginHistory, setLoginHistory] = useState([]);
  const [faceStatus, setFaceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      if (!user?.employee_id) return;
      setLoading(true);
      try {
        const [auditRes, statusRes] = await Promise.all([
          auditApi.getLogins({ employeeId: user.employee_id, limit: 10 }),
          faceApi.getStatus(user.employee_id)
        ]);

        if (!mounted) return;
        setLoginHistory(auditRes.data || []);
        setFaceStatus(statusRes);
      } catch (err) {
        console.warn('Could not load dashboard overview:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOverview();

    return () => {
      mounted = false;
    };
  }, [user]);

  const latestLogin = useMemo(() => {
    if (!loginHistory || loginHistory.length === 0) return null;
    const latest = loginHistory[0];
    try {
      return new Date(latest.login_time).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return null;
    }
  }, [loginHistory]);

  const initials = useMemo(() => {
    if (!user?.name) return 'HR';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.name]);

  return (
    <div className="space-y-6">
      {/* Clean Welcome Profile Banner */}
      <div className="glass-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border border-line/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/30 flex items-center justify-center text-accent font-display font-extrabold text-xl sm:text-2xl shadow-inner shrink-0">
            {initials}
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
              <span>Verified Employee</span>
              <span>·</span>
              <span className="font-mono text-muted">{user?.employee_id}</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
              {user?.name || 'Employee Full Name'}
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              <span className="text-ink font-medium">{user?.designation || 'Staff'}</span>
              <span className="mx-2 text-muted/60">·</span>
              <span>{user?.department || 'Engineering'}</span>
              <span className="mx-2 text-muted/60">·</span>
              <span className="text-accent font-semibold">Technomold IT Solutions</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <PrimaryButton
            onClick={() => navigate('/enroll')}
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <UserCheck className="w-4 h-4" />
            {faceStatus?.faceEnrolled ? 'Update Face Profile' : 'Enroll Face Now'}
          </PrimaryButton>

          {isHR && (
            <SecondaryButton
              onClick={() => navigate('/admin')}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-accent" />
              HR Audit
            </SecondaryButton>
          )}
        </div>
      </div>

      {/* 3 Essential Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance Card */}
        <div className="glass-card p-4 sm:p-5 flex items-start gap-3.5 border border-line/40">
          <div className="w-10 h-10 rounded-xl bg-good/15 border border-good/30 flex items-center justify-center text-good shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Today's Attendance
            </div>
            <div className="font-display font-bold text-base sm:text-lg text-ink">
              Checked In
            </div>
            <div className="text-xs text-muted truncate">
              {latestLogin ? `Last sign-in: ${latestLogin}` : 'Session verified'}
            </div>
          </div>
        </div>

        {/* Face Status Card */}
        <div className="glass-card p-4 sm:p-5 flex items-start gap-3.5 border border-line/40">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Face Authentication
            </div>
            <div className="font-display font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <span>{faceStatus?.faceEnrolled ? 'Active' : 'Pending'}</span>
              <StatusPill
                status={faceStatus?.faceEnrolled ? 'verified' : 'warn'}
                label={faceStatus?.faceEnrolled ? 'Enabled' : 'Setup Needed'}
              />
            </div>
            <div className="text-xs text-muted truncate">
              {faceStatus?.faceEnrolled
                ? 'Camera login active'
                : 'Enroll your face to sign in'}
            </div>
          </div>
        </div>

        {/* Department Card */}
        <div className="glass-card p-4 sm:p-5 flex items-start gap-3.5 border border-line/40">
          <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center text-ink shrink-0 mt-0.5">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Company & Department
            </div>
            <div className="font-display font-bold text-base sm:text-lg text-ink truncate">
              Technomold · {user?.department || 'IT'}
            </div>
            <div className="text-xs text-muted truncate">
              {user?.email || 'Official Account'}
            </div>
          </div>
        </div>
      </div>

      {/* Clean Recent Activity Table */}
      <Card
        title="Recent Sign-in Activity"
        subtext="Your recent attendance logins and authentication history"
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-[13px] border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Network IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-muted text-[13px]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                    Loading activity...
                  </td>
                </tr>
              ) : loginHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-muted text-[13px]">
                    No sign-in records found.
                  </td>
                </tr>
              ) : (
                loginHistory.map((row) => {
                  const isSuccess = ['SUCCESS', 'PASSWORD_ONLY', 'OTP_FALLBACK', 'UNLOCKED'].includes(row.status);
                  const methodLabel =
                    row.status === 'OTP_FALLBACK'
                      ? '6-Digit OTP'
                      : row.status === 'PASSWORD_ONLY'
                        ? 'Password'
                        : 'Face Authentication';

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-dashed border-line/60 hover:bg-surface2/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-ink tabular-nums text-xs sm:text-[13px]">
                        {new Date(row.login_time).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="py-3 px-3 font-medium text-ink">
                        {methodLabel}
                      </td>
                      <td className="py-3 px-3">
                        <StatusPill
                          status={isSuccess ? 'verified' : 'bad'}
                          label={isSuccess ? 'Successful' : 'Failed'}
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-muted">
                        {row.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
