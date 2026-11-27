// src/services/settingsService.js
// Settings service managing employee UI preferences, notification alerts, security policies, and GPS privacy.

import { INITIAL_EMPLOYEE } from '../data/employee.js';
import { authService } from './authService.js';

const SETTINGS_STORAGE_KEY = 'hrms_employee_settings';
const SESSIONS_STORAGE_KEY = 'hrms_employee_sessions';

export const DEFAULT_SETTINGS = {
  // Preferences & Display
  density: 'normal', // 'normal' | 'compact'
  defaultLanding: '/', // '/', '/attendance', '/tasks', '/payroll'
  dateFormat: 'DD MMM YYYY', // 'DD MMM YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY'
  timeFormat: '12h', // '12h' | '24h'
  currencyDisplay: 'lakhs', // 'lakhs' | 'standard'
  startOfWeek: 'monday', // 'monday' | 'sunday'
  timezone: 'Asia/Kolkata (IST UTC+5:30)',

  // Notifications
  emailPayslip: true,
  emailLeaveStatus: true,
  emailShiftUpdates: true,
  emailTaskReminders: true,
  emailAnnouncements: true,

  inAppPunchReminders: true,
  inAppBreakAlerts: true,
  soundEffects: false,
  desktopNotifications: false,

  // GPS & Privacy
  gpsHighAccuracy: true,
  geofenceAlerts: true,
  recordLocationTelemetry: true,

  // Security
  twoFactorEnabled: true,
  sessionTimeoutMins: 60
};

export const INITIAL_SESSIONS = [
  {
    id: 'sess-curr',
    device: 'Windows 11 PC · Chrome 131',
    location: 'Hyderabad, Telangana, India',
    ip: '49.205.112.44',
    lastActive: 'Active now',
    isCurrent: true,
    type: 'desktop'
  },
  {
    id: 'sess-mob',
    device: 'iPhone 15 Pro · Safari iOS 18',
    location: 'Hyderabad, Telangana, India',
    ip: '103.24.188.12',
    lastActive: '42 mins ago',
    isCurrent: false,
    type: 'mobile'
  },
  {
    id: 'sess-mac',
    device: 'MacBook Pro · Brave 1.70',
    location: 'Bengaluru, Karnataka, India',
    ip: '182.74.88.201',
    lastActive: '3 days ago',
    isCurrent: false,
    type: 'laptop'
  }
];

export const settingsService = {
  /**
   * Retrieves saved settings from localStorage, merging with defaults.
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
    return { ...DEFAULT_SETTINGS };
  },

  /**
   * Saves updated settings to localStorage.
   */
  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // Apply density attribute to document root
    if (updated.density) {
      this.applyDensity(updated.density);
    }

    return updated;
  },

  /**
   * Resets settings back to factory default.
   */
  resetSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    this.applyDensity(DEFAULT_SETTINGS.density);
    return { ...DEFAULT_SETTINGS };
  },

  /**
   * Applies density CSS variables via data-density attribute on :root
   */
  applyDensity(density) {
    if (typeof document !== 'undefined') {
      if (density === 'compact') {
        document.documentElement.setAttribute('data-density', 'compact');
      } else {
        document.documentElement.removeAttribute('data-density');
      }
    }
  },

  /**
   * Retrieves active login sessions.
   */
  getSessions() {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read sessions', e);
    }
    return INITIAL_SESSIONS;
  },

  /**
   * Revokes a specific session.
   */
  revokeSession(sessionId) {
    const sessions = this.getSessions().filter(s => s.id !== sessionId);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    return sessions;
  },

  /**
   * Revokes all sessions except the current active session.
   */
  revokeAllOtherSessions() {
    const sessions = this.getSessions().filter(s => s.isCurrent);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    return sessions;
  },

  /**
   * Exports employee data package (GDPR / Indian DPDP Act compliance).
   */
  exportDataPackage() {
    const settings = this.getSettings();
    const profile = authService.getStoredProfile();
    const dataPackage = {
      exportedAt: new Date().toISOString(),
      complianceNote: 'Self-Service Personal Data Export · India DPDP Act 2023 Compliant',
      employee: {
        id: profile.id,
        name: profile.name,
        email: profile.workEmail,
        designation: profile.designation,
        department: profile.department,
        reportingTo: profile.managerName,
        joinedDate: profile.joinedDate,
        shift: profile.shift
      },
      preferences: settings,
      activeSessions: this.getSessions()
    };

    const blob = new Blob([JSON.stringify(dataPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrms_data_export_${INITIAL_EMPLOYEE.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }
};

