// src/services/attendanceService.js
// Mock only. Replace with real API; enforce scope and rules on the server.

import {
  INITIAL_ATTENDANCE_TODAY,
  INITIAL_ATTENDANCE_HISTORY,
  INITIAL_REGULARISATIONS
} from '../data/employee.js';
import { evaluateDay } from '../utils/attendanceEngine.js';
import { ATTENDANCE_RULES } from '../config/attendanceRules.js';
import { getDeviceGPSLocation } from '../utils/geo.js';

const STORAGE_TODAY_KEY = 'hrms_emp_attendance_today';
const STORAGE_HISTORY_KEY = 'hrms_emp_attendance_history';
const STORAGE_REG_KEY = 'hrms_emp_regularisations';

function load(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function formatNowHMS(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export function getTodayDateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createFreshToday(dateKey = getTodayDateKey()) {
  return {
    ...INITIAL_ATTENDANCE_TODAY,
    date: dateKey,
    checkIn: null,
    checkOut: null,
    inProgress: false,
    checkInLocation: null,
    checkOutLocation: null,
    earlyCheckOutReason: null,
    breaks: []
  };
}

function loadToday() {
  const todayKey = getTodayDateKey();
  const stored = load(STORAGE_TODAY_KEY, null);
  if (!stored || stored.date !== todayKey) {
    const fresh = createFreshToday(todayKey);
    save(STORAGE_TODAY_KEY, fresh);
    return fresh;
  }
  return stored;
}

function isValidCoordinateLoc(loc) {
  return Boolean(
    loc &&
    typeof loc.latitude === 'number' &&
    !isNaN(loc.latitude) &&
    typeof loc.longitude === 'number' &&
    !isNaN(loc.longitude)
  );
}

/**
 * Stamps the GPS location snapshot with the exact punch timestamp.
 */
function attachPunchTimestamp(loc, timeStr, now) {
  return {
    ...loc,
    punchTime: timeStr,
    capturedAt: loc?.capturedAt || now.toISOString()
  };
}

/**
 * Keeps today's live attendance + Check-In/Check-Out GPS coordinates synchronized in history.
 */
function upsertHistoryFromToday(record) {
  if (!record?.date || !record?.checkIn) return;
  const history = load(STORAGE_HISTORY_KEY, INITIAL_ATTENDANCE_HISTORY);
  const filtered = history.filter(h => h.date !== record.date);
  filtered.unshift({
    date: record.date,
    checkIn: record.checkIn,
    checkOut: record.checkOut || null,
    breaks: record.breaks || [],
    workMode: record.workMode || 'Office',
    checkInLocation: record.checkInLocation || null,
    checkOutLocation: record.checkOutLocation || null,
    earlyCheckOutReason: record.earlyCheckOutReason || null,
    inProgress: Boolean(record.inProgress && !record.checkOut),
    type: 'work'
  });
  save(STORAGE_HISTORY_KEY, filtered);
}

function closeOpenBreaksAt(breaks = [], now = new Date()) {
  const timeStr = formatNowHMS(now);
  const endSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  return (breaks || []).map((b) => {
    if (b.end) return b;
    const parts = String(b.start || '').split(':').map(Number);
    const startSec = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    const durationSeconds = Math.max(1, endSec - startSec);
    return {
      ...b,
      end: timeStr,
      duration: Math.floor(durationSeconds / 60),
      durationSeconds
    };
  });
}

export const attendanceService = {
  async getToday() {
    await new Promise(r => setTimeout(r, 200));
    return loadToday();
  },

  async punchIn(workMode = 'Office', note = '', customLocation = null) {
    await new Promise(r => setTimeout(r, 350));
    const todayKey = getTodayDateKey();
    const current = loadToday();

    // Enforce single daily check-in policy: once checked in (or checked out) for today, no second check-in is allowed.
    if (current && current.date === todayKey && current.checkIn) {
      if (current.checkOut) {
        throw new Error('Daily check-in policy: Only one check-in is allowed per day. You cannot check in again after checking out today — submit Attendance Regularisation if needed.');
      }
      throw new Error('You are already checked in for today.');
    }

    // Acquire GPS location FIRST so check-in timestamp and GPS coordinate snapshot align
    const rawLocation = isValidCoordinateLoc(customLocation)
      ? customLocation
      : await getDeviceGPSLocation({ workMode });

    const now = new Date();
    const timeStr = formatNowHMS(now);
    const location = attachPunchTimestamp(rawLocation, timeStr, now);

    const updated = {
      date: todayKey,
      checkIn: timeStr,
      checkOut: null,
      workMode,
      workModeNote: note,
      checkInLocation: location,
      checkOutLocation: null,
      earlyCheckOutReason: null,
      inProgress: true,
      breaks: []
    };
    
    save(STORAGE_TODAY_KEY, updated);
    upsertHistoryFromToday(updated);
    return updated;
  },

  async punchOut(customLocationOrOpts = null, reasonArg = '') {
    await new Promise(r => setTimeout(r, 350));
    const current = loadToday();

    const hasOptionsObj =
      customLocationOrOpts &&
      typeof customLocationOrOpts === 'object' &&
      ('location' in customLocationOrOpts || 'earlyReason' in customLocationOrOpts);

    const customLocCandidate = hasOptionsObj ? customLocationOrOpts.location : customLocationOrOpts;
    const rawReason = hasOptionsObj ? customLocationOrOpts.earlyReason : reasonArg;
    const earlyCheckOutReason = typeof rawReason === 'string' ? rawReason.trim() : '';

    // Acquire GPS location for check-out (ignore non-coordinate DOM events if accidentally passed)
    const rawLocation = isValidCoordinateLoc(customLocCandidate)
      ? customLocCandidate
      : await getDeviceGPSLocation({ workMode: current.workMode || 'Office' });

    const now = new Date();
    const timeStr = formatNowHMS(now);
    const location = attachPunchTimestamp(rawLocation, timeStr, now);

    // Close any ongoing break automatically on checkout
    const finalizedBreaks = closeOpenBreaksAt(current.breaks, now);

    const updated = {
      ...current,
      breaks: finalizedBreaks,
      checkOut: timeStr,
      checkOutLocation: location,
      earlyCheckOutReason: earlyCheckOutReason || null,
      inProgress: false
    };
    save(STORAGE_TODAY_KEY, updated);
    upsertHistoryFromToday(updated);

    return updated;
  },

  async startBreak(type = 'Lunch') {
    const startNow = new Date();
    const timeStr = formatNowHMS(startNow);
    await new Promise(r => setTimeout(r, 200));
    const current = loadToday();
    // Avoid creating a second open break if one is already active
    if (Array.isArray(current.breaks) && current.breaks.some(b => !b.end)) {
      return current;
    }

    const newBreak = {
      id: 'brk-' + Date.now(),
      type,
      start: timeStr,
      end: null,
      duration: null,
      durationSeconds: null
    };

    const updated = {
      ...current,
      inProgress: current.checkIn && !current.checkOut ? true : current.inProgress,
      breaks: [...(current.breaks || []), newBreak]
    };
    save(STORAGE_TODAY_KEY, updated);
    upsertHistoryFromToday(updated);
    return updated;
  },

  async endBreak() {
    const endNow = new Date();
    await new Promise(r => setTimeout(r, 200));
    const current = loadToday();
    const breaks = closeOpenBreaksAt(current.breaks, endNow);

    const updated = {
      ...current,
      breaks
    };
    save(STORAGE_TODAY_KEY, updated);
    upsertHistoryFromToday(updated);
    return updated;
  },

  async setWorkMode(mode, note = '') {
    await new Promise(r => setTimeout(r, 200));
    const current = loadToday();
    const updated = {
      ...current,
      workMode: mode,
      workModeNote: note
    };
    save(STORAGE_TODAY_KEY, updated);
    upsertHistoryFromToday(updated);
    return updated;
  },

  async updateTodayLocation(location) {
    await new Promise(r => setTimeout(r, 150));
    if (!isValidCoordinateLoc(location)) {
      return loadToday();
    }
    const current = loadToday();
    const updated = {
      ...current,
      checkInLocation: current.checkOut ? current.checkInLocation : location,
      checkOutLocation: current.checkOut ? location : current.checkOutLocation
    };
    save(STORAGE_TODAY_KEY, updated);
    upsertHistoryFromToday(updated);
    return updated;
  },

  async getHistory() {
    await new Promise(r => setTimeout(r, 300));
    const history = load(STORAGE_HISTORY_KEY, INITIAL_ATTENDANCE_HISTORY);
    return history.map(h => {
      const evaluation = evaluateDay(h, ATTENDANCE_RULES);
      return {
        ...h,
        evaluation
      };
    });
  },

  async getRegularisations() {
    await new Promise(r => setTimeout(r, 200));
    return load(STORAGE_REG_KEY, INITIAL_REGULARISATIONS);
  },

  async submitRegularisation(req) {
    await new Promise(r => setTimeout(r, 400));
    const current = load(STORAGE_REG_KEY, INITIAL_REGULARISATIONS);
    const newReq = {
      id: `REG-2026-${String(current.length + 42).padStart(3, '0')}`,
      date: req.date,
      issueType: req.issueType,
      correctedCheckIn: req.correctedCheckIn,
      correctedCheckOut: req.correctedCheckOut,
      reason: req.reason,
      status: 'Pending',
      appliedOn: getTodayDateKey(),
      approver: 'Priya Nair',
      approverComment: 'Awaiting manager review'
    };
    const updated = [newReq, ...current];
    save(STORAGE_REG_KEY, updated);
    return newReq;
  },

  async withdrawRegularisation(id) {
    await new Promise(r => setTimeout(r, 300));
    const current = load(STORAGE_REG_KEY, INITIAL_REGULARISATIONS);
    const updated = current.filter(r => r.id !== id);
    save(STORAGE_REG_KEY, updated);
    return true;
  }
};

export default attendanceService;

