// src/pages/Settings.jsx
// Employee Settings module: UI preferences, notification alerts, security & sessions, and GPS privacy controls.

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Shield,
  MapPin,
  Lock,
  Smartphone,
  Laptop,
  Monitor,
  Download,
  RefreshCw,
  Check,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Sparkles,
  Save,
  ShieldCheck,
  Radio,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { Tabs } from '../components/Tabs.jsx';
import { Switch } from '../components/Switch.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { settingsService, DEFAULT_SETTINGS } from '../services/settingsService.js';
import { INITIAL_EMPLOYEE } from '../data/employee.js';

export function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('preferences');
  const [settings, setSettings] = useState(() => settingsService.getSettings());
  const [sessions, setSessions] = useState(() => settingsService.getSessions());
  const [hasChanges, setHasChanges] = useState(false);

  // Security Drawers & Form States
  const [passwordDrawer, setPasswordDrawer] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  const [twoFactorDrawer, setTwoFactorDrawer] = useState(false);
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);

  // Apply density on initial mount if saved
  useEffect(() => {
    if (settings.density) {
      settingsService.applyDensity(settings.density);
    }
  }, [settings.density]);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'density') {
        settingsService.applyDensity(value);
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    settingsService.saveSettings(settings);
    setHasChanges(false);
    showToast({
      title: 'Settings saved',
      message: 'Your preferences have been updated successfully.',
      variant: 'good'
    });
  };

  const handleResetSettings = () => {
    const defaults = settingsService.resetSettings();
    setSettings(defaults);
    setHasChanges(false);
    showToast({
      title: 'Preferences reset',
      message: 'All settings returned to enterprise default values.',
      variant: 'info'
    });
  };

  // Password Update Handler
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Success
    setPasswordDrawer(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast({
      title: 'Password updated',
      message: 'Your login credentials have been safely renewed.',
      variant: 'good'
    });
  };

  // Session Revocation Handlers
  const handleRevokeSession = (sessionId) => {
    const updated = settingsService.revokeSession(sessionId);
    setSessions(updated);
    showToast({
      title: 'Session terminated',
      message: 'The selected device has been logged out.',
      variant: 'warn'
    });
  };

  const handleRevokeAllOtherSessions = () => {
    const updated = settingsService.revokeAllOtherSessions();
    setSessions(updated);
    showToast({
      title: 'Sessions revoked',
      message: 'All other devices have been disconnected immediately.',
      variant: 'bad'
    });
  };

  // Export Data Package Handler
  const handleExportData = () => {
    settingsService.exportDataPackage();
    showToast({
      title: 'Export initiated',
      message: 'Your personal HR audit data package has been downloaded.',
      variant: 'good'
    });
  };

  const tabs = [
    { id: 'preferences', label: 'Preferences & Display' },
    { id: 'notifications', label: 'Notifications & Alerts' },
    { id: 'security', label: 'Security & Sessions' },
    { id: 'privacy', label: 'GPS & Privacy' }
  ];

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Tab Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-line/30">
        <div>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-[11px] text-warn font-medium flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-warn" />
              Unsaved changes
            </span>
          )}
          <SecondaryButton onClick={handleResetSettings} className="text-[12px] py-1.5 px-3">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Defaults
          </SecondaryButton>
          <PrimaryButton onClick={handleSaveSettings} disabled={!hasChanges} className="text-[12px] py-1.5 px-4">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Changes
          </PrimaryButton>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PREFERENCES & DISPLAY */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Layout Density & Theme */}
          <Card
            title="Interface & Density"
            subtext="Configure workspace ergonomics and component padding."
          >
            <div className="flex flex-col gap-5 pt-1">
              <div>
                <label className="text-[12px] uppercase font-bold text-muted tracking-wider block mb-2">
                  Display Density Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting('density', 'normal')}
                    className={`p-3.5 rounded-tpl border text-left transition-all ${
                      settings.density === 'normal'
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-line bg-surface2/40 hover:bg-surface2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[13px] text-ink">Normal (Default)</span>
                      {settings.density === 'normal' && <Check className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Generous padding (20px), ideal for desktop monitors and standard touchpads.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSetting('density', 'compact')}
                    className={`p-3.5 rounded-tpl border text-left transition-all ${
                      settings.density === 'compact'
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-line bg-surface2/40 hover:bg-surface2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[13px] text-ink">Compact Mode</span>
                      {settings.density === 'compact' && <Check className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Tighter density (12px pad, 10px gap), maximizing viewable data rows on laptops.
                    </p>
                  </button>
                </div>
              </div>

              {/* Theme Policy Banner */}
              <div className="p-3.5 rounded-tpl bg-surface2/50 border border-line/60 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-[12px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-ink">Theme: Monsoon Glass Dark</span>
                    <Tag text="Dark Only" color="muted" />
                  </div>
                  <p className="text-muted leading-relaxed">
                    Color tokens (<code className="text-accent text-[11px]">#06141c</code>,{' '}
                    <code className="text-accent text-[11px]">#6ee7d0</code>) and glass surfaces are strictly
                    standardized across all HRMS desks. Light mode is intentionally excluded by design governance.
                  </p>
                </div>
              </div>

              {/* Default Landing Page */}
              <div>
                <label className="text-[12px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                  Default Landing Page
                </label>
                <select
                  value={settings.defaultLanding}
                  onChange={(e) => updateSetting('defaultLanding', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-[13px] text-ink focus:outline-none focus:border-accent"
                >
                  <option value="/">Overview (Dashboard Home)</option>
                  <option value="/attendance">My Attendance (Live Clock & History)</option>
                  <option value="/tasks">My Tasks & Deliverables</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Regional & Formatting */}
          <Card
            title="Regional & Formatting"
            subtext="Numbering standards, calendar preferences, and time displays."
          >
            <div className="flex flex-col gap-4 pt-1">
              {/* Date Format */}
              <div>
                <label className="text-[12px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSetting('dateFormat', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-[13px] text-ink focus:outline-none focus:border-accent"
                >
                  <option value="DD MMM YYYY">6 Nov 2026 (Monsoon Standard)</option>
                  <option value="YYYY-MM-DD">2026-11-06 (ISO 8601)</option>
                  <option value="DD/MM/YYYY">06/11/2026 (Indian Standard)</option>
                </select>
              </div>

              {/* Time Format */}
              <div>
                <label className="text-[12px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                  Time Display Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting('timeFormat', '12h')}
                    className={`p-2.5 rounded-tpl border text-center text-[12px] font-medium transition-colors ${
                      settings.timeFormat === '12h'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-line bg-surface2 text-muted hover:text-ink'
                    }`}
                  >
                    12-Hour (09:30:14 AM)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting('timeFormat', '24h')}
                    className={`p-2.5 rounded-tpl border text-center text-[12px] font-medium transition-colors ${
                      settings.timeFormat === '24h'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-line bg-surface2 text-muted hover:text-ink'
                    }`}
                  >
                    24-Hour (09:30:14)
                  </button>
                </div>
              </div>

              {/* Currency Display */}
              <div>
                <label className="text-[12px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                  Currency & Number System
                </label>
                <select
                  value={settings.currencyDisplay}
                  onChange={(e) => updateSetting('currencyDisplay', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-[13px] text-ink focus:outline-none focus:border-accent"
                >
                  <option value="lakhs">Indian Rupee (Lakhs & Crores · ₹15.90 L)</option>
                  <option value="standard">Indian Rupee (Standard Millions · ₹1,590,000)</option>
                </select>
              </div>

              {/* Timezone (Locked) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] uppercase font-bold text-muted tracking-wider">
                    Company Timezone
                  </label>
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-muted/70" /> Enterprise Policy
                  </span>
                </div>
                <div className="px-3.5 py-2.5 rounded-tpl bg-surface2/50 border border-line text-[13px] text-muted font-mono flex items-center justify-between">
                  <span>{settings.timezone}</span>
                  <Tag text="Fixed" color="info" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NOTIFICATIONS & ALERTS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email Notifications */}
          <Card
            title="Email Notifications"
            subtext={`Sent to work mailbox (${INITIAL_EMPLOYEE.workEmail})`}
          >
            <div className="flex flex-col divide-y divide-line/30 pt-1">
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Monthly Payslip Dispatch</p>
                  <p className="text-[11px] text-muted">Receive encrypted PDF copy upon month-end payroll locking.</p>
                </div>
                <Switch
                  checked={settings.emailPayslip}
                  onChange={(val) => updateSetting('emailPayslip', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Leave Status Approvals</p>
                  <p className="text-[11px] text-muted">Instant alert when manager (Priya Nair) approves or rejects leave.</p>
                </div>
                <Switch
                  checked={settings.emailLeaveStatus}
                  onChange={(val) => updateSetting('emailLeaveStatus', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Shift & Roster Changes</p>
                  <p className="text-[11px] text-muted">Notifies when weekly roster is published or swaps are approved.</p>
                </div>
                <Switch
                  checked={settings.emailShiftUpdates}
                  onChange={(val) => updateSetting('emailShiftUpdates', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Task Deadlines & Assignments</p>
                  <p className="text-[11px] text-muted">Reminders 24 hours prior to impending sprint milestones.</p>
                </div>
                <Switch
                  checked={settings.emailTaskReminders}
                  onChange={(val) => updateSetting('emailTaskReminders', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Company Broadcasts</p>
                  <p className="text-[11px] text-muted">Important policy, holiday, and HR announcements.</p>
                </div>
                <Switch
                  checked={settings.emailAnnouncements}
                  onChange={(val) => updateSetting('emailAnnouncements', val)}
                />
              </div>
            </div>
          </Card>

          {/* In-App & Desk Alerts */}
          <Card
            title="In-App & Punch Reminders"
            subtext="Timely alerts during your active work shift."
          >
            <div className="flex flex-col divide-y divide-line/30 pt-1">
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Morning Punch-in Prompt</p>
                  <p className="text-[11px] text-muted">Displays notification at 9:15 AM (15m before General shift starts).</p>
                </div>
                <Switch
                  checked={settings.inAppPunchReminders}
                  onChange={(val) => updateSetting('inAppPunchReminders', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Break Threshold Warning</p>
                  <p className="text-[11px] text-muted">Alerts when accumulated break duration exceeds 60 minutes.</p>
                </div>
                <Switch
                  checked={settings.inAppBreakAlerts}
                  onChange={(val) => updateSetting('inAppBreakAlerts', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Audio Chime on Punch</p>
                  <p className="text-[11px] text-muted">Play subtle confirmation chime upon check-in and check-out.</p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onChange={(val) => updateSetting('soundEffects', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Browser Push Notifications</p>
                  <p className="text-[11px] text-muted">Allow system alerts when dashboard is minimized in background tab.</p>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onChange={(val) => {
                    updateSetting('desktopNotifications', val);
                    if (val && typeof window !== 'undefined' && 'Notification' in window) {
                      Notification.requestPermission();
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SECURITY & SESSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Authentication & Password */}
          <Card
            title="Authentication & 2FA"
            subtext="Credentials and multi-factor security protections."
          >
            <div className="flex flex-col gap-4 pt-1">
              {/* Password Tile */}
              <div className="p-4 rounded-tpl bg-surface2/40 border border-line flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-[13px] text-ink">Account Password</span>
                  </div>
                  <p className="text-[11px] text-muted">Last modified 14 days ago · Strong security hash</p>
                </div>
                <SecondaryButton
                  onClick={() => setPasswordDrawer(true)}
                  className="text-[12px] py-1.5 px-3"
                >
                  Change Password
                </SecondaryButton>
              </div>

              {/* Two-Factor Authentication */}
              <div className="p-4 rounded-tpl bg-surface2/40 border border-line flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-good" />
                    <span className="font-semibold text-[13px] text-ink">Two-Factor Authentication (2FA)</span>
                  </div>
                  <p className="text-[11px] text-muted">TOTP Authenticator app (Google Auth / Microsoft Auth)</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status="good" text="Active" />
                  <SecondaryButton
                    onClick={() => setTwoFactorDrawer(true)}
                    className="text-[12px] py-1 px-2.5"
                  >
                    Manage
                  </SecondaryButton>
                </div>
              </div>

              {/* Security Policy Reminder */}
              <div className="p-3.5 rounded-tpl bg-info/10 border border-info/30 text-[12px] text-muted flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Enterprise SSO and password policies require mandatory password rotation every 90 days.
                  Your account is compliant.
                </p>
              </div>
            </div>
          </Card>

          {/* Active Logged-in Sessions */}
          <Card
            title="Active Sessions & Devices"
            subtext="Devices currently authenticated to your employee account."
            action={
              sessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAllOtherSessions}
                  className="text-[11px] text-bad hover:underline font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Revoke All Others
                </button>
              )
            }
          >
            <div className="flex flex-col divide-y divide-line/30 pt-1">
              {sessions.map((sess) => {
                const IconComponent =
                  sess.type === 'mobile' ? Smartphone : sess.type === 'laptop' ? Laptop : Monitor;

                return (
                  <div key={sess.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-tpl bg-surface2 border border-line flex items-center justify-center shrink-0 text-muted mt-0.5">
                        <IconComponent className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold text-ink">{sess.device}</span>
                          {sess.isCurrent ? (
                            <StatusPill status="good" text="This Device" />
                          ) : (
                            <span className="text-[10px] text-muted font-mono">{sess.lastActive}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          {sess.location} · <span className="font-mono">{sess.ip}</span>
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-[11px] text-muted hover:text-bad px-2.5 py-1 rounded border border-line hover:border-bad/60 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GPS & PRIVACY */}
      {/* ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Location Telemetry Settings */}
          <Card
            title="GPS Telemetry & Geofence"
            subtext="Manage location capture and campus perimeter verification."
          >
            <div className="flex flex-col divide-y divide-line/30 pt-1">
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">High Accuracy GPS Acquisition</p>
                  <p className="text-[11px] text-muted">
                    Uses device satellite & Wi-Fi triangulation for meter-precision attendance stamps.
                  </p>
                </div>
                <Switch
                  checked={settings.gpsHighAccuracy}
                  onChange={(val) => updateSetting('gpsHighAccuracy', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Campus Geofence Alerts</p>
                  <p className="text-[11px] text-muted">
                    Prompt check-in when entering Hyderabad Campus (Tower B, 300m radius).
                  </p>
                </div>
                <Switch
                  checked={settings.geofenceAlerts}
                  onChange={(val) => updateSetting('geofenceAlerts', val)}
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Record Location Telemetry</p>
                  <p className="text-[11px] text-muted">
                    Store latitude & longitude with punch timestamps for manager audit compliance.
                  </p>
                </div>
                <Switch
                  checked={settings.recordLocationTelemetry}
                  onChange={(val) => updateSetting('recordLocationTelemetry', val)}
                />
              </div>

              {/* Privacy Disclosure */}
              <div className="py-3">
                <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line/60 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div className="text-[11.5px] text-muted leading-relaxed">
                    <p className="text-ink font-semibold mb-1">Privacy Guarantee:</p>
                    GPS telemetry is captured <strong className="text-accent">only at the exact moment</strong> you tap
                    "Check In" or "Check Out". The HRMS never tracks background location or travels between punches.
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Data Portability / Export */}
          <Card
            title="Data Portability & Export"
            subtext="Download your complete personal HR employment record."
          >
            <div className="flex flex-col gap-4 pt-1">
              <p className="text-[12px] text-muted leading-relaxed">
                Under the Indian Digital Personal Data Protection (DPDP) Act 2023, you have full ownership and right to
                access your recorded HR data. This includes your attendance timestamps, leave accruals, salary history,
                and session logs.
              </p>

              <div className="p-4 rounded-tpl bg-surface2/40 border border-line flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-[13px] text-ink">Comprehensive HR Data Package</span>
                  </div>
                  <p className="text-[11px] text-muted">Formatted JSON audit export · Updated as of today</p>
                </div>
                <SecondaryButton onClick={handleExportData} className="text-[12px] py-1.5 px-3">
                  <Download className="w-3.5 h-3.5 mr-1.5 text-accent" />
                  Export JSON
                </SecondaryButton>
              </div>

              <div className="p-3.5 rounded-tpl bg-surface2/30 border border-line/50 text-[11px] text-muted">
                <span className="font-bold text-ink block mb-0.5">Statutory Retention Policy</span>
                Statutory salary slips, tax TDS statements, and PF contribution logs are preserved for a mandatory 7-year
                period as required by Indian Labor regulations.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: CHANGE PASSWORD */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={passwordDrawer}
        onClose={() => setPasswordDrawer(false)}
        title="Change Account Password"
        subtitle="Ensure a minimum of 8 characters with numbers and symbols."
      >
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 p-5">
          {passwordError && (
            <div className="p-3 rounded-tpl bg-bad/10 border border-bad/40 text-[12px] text-bad flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="text-[12px] uppercase font-bold text-muted block mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-[13px] text-ink pr-10 focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-[12px] uppercase font-bold text-muted block mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new strong password"
                className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-[13px] text-ink pr-10 focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength meter */}
            {passwordForm.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted">Password Strength:</span>
                  <span
                    className={
                      passStrength <= 25
                        ? 'text-bad'
                        : passStrength <= 50
                        ? 'text-warn'
                        : passStrength <= 75
                        ? 'text-info'
                        : 'text-good'
                    }
                  >
                    {passStrength <= 25 ? 'Weak' : passStrength <= 50 ? 'Fair' : passStrength <= 75 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passStrength <= 25
                        ? 'bg-bad w-1/4'
                        : passStrength <= 50
                        ? 'bg-warn w-2/4'
                        : passStrength <= 75
                        ? 'bg-info w-3/4'
                        : 'bg-good w-full'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[12px] uppercase font-bold text-muted block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Re-enter new password"
              className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/40">
            <SecondaryButton type="button" onClick={() => setPasswordDrawer(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Update Password
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER: 2FA BACKUP CODES & CONFIG */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={twoFactorDrawer}
        onClose={() => setTwoFactorDrawer(false)}
        title="Two-Factor Authentication (2FA)"
        subtitle="Protect your HR profile with time-based one-time passcodes."
      >
        <div className="flex flex-col gap-5 p-5">
          <div className="p-3.5 rounded-tpl bg-good/10 border border-good/30 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-good shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Two-Factor Auth is Enabled</p>
              <p className="text-[11px] text-muted">Configured using Authenticator app</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] uppercase font-bold text-muted">
                Emergency Backup Codes
              </label>
              <button
                type="button"
                onClick={() => setBackupCodesVisible(!backupCodesVisible)}
                className="text-[11px] text-accent hover:underline"
              >
                {backupCodesVisible ? 'Hide Codes' : 'Reveal (6 remaining)'}
              </button>
            </div>

            {backupCodesVisible ? (
              <div className="grid grid-cols-2 gap-2 p-3 rounded-tpl bg-surface2 border border-line font-mono text-[12px] text-ink">
                <div>8492-1049</div>
                <div>3941-8821</div>
                <div>5592-3310</div>
                <div>9102-4428</div>
                <div>1849-6294</div>
                <div>7721-0943</div>
              </div>
            ) : (
              <p className="text-[11px] text-muted italic">
                Click reveal to view your single-use offline recovery backup codes.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-line/40 flex justify-end">
            <SecondaryButton onClick={() => setTwoFactorDrawer(false)}>
              Close
            </SecondaryButton>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default Settings;

