/**
 * Shifts & Roster Service
 * Manages enterprise shifts, weekly/monthly rosters, shift change proposals & requests,
 * confirmation workflow (employee acceptance + HR approval), versioned shift policies,
 * multi-tenant company isolation, rest gap audits, and roster-fed attendance integration.
 * Storage key: "hrms_shifts_v1"
 * Event: "hrms-shifts-updated"
 */

import { isHolidayDate, getHolidayByDate } from './holidayStore.js';
import { loadApprovals } from './approvalStore.js';
import { getEmployeeList } from './attendanceLog.js';

const STORAGE_KEY = "hrms_shifts_v1";
const EVENT_NAME = "hrms-shifts-updated";

// When true, HR-published roster changes require employee acceptance before taking effect
export const ROSTER_REQUIRES_ACCEPTANCE = true;

// Hours allowed for an employee to respond to proposed roster changes before automatic expiry
export const ACCEPT_WINDOW_HOURS = 48;

// Minimum notice in days: changes can only start from tomorrow (today and past dates are blocked)
export const MIN_NOTICE_DAYS = 1;

// Minimum rest gap hours required between consecutive shifts to avoid fatigue warnings
export const MIN_REST_HOURS = 11;

// Default color palette presets for shifts
export const PRESET_SHIFT_COLORS = [
  "#2dd4bf", // teal (default / general)
  "#60a5fa", // blue (morning)
  "#fbbf24", // amber (evening)
  "#a78bfa", // purple (night)
  "#34d399", // emerald
  "#f472b6"  // pink
];

// Seed shifts configured for every enterprise company
export const DEFAULT_SHIFTS = [
  {
    id: "SFT-GEN",
    code: "GEN",
    name: "General",
    start: "09:00",
    end: "18:00",
    breakMinutes: 60,
    graceMinutes: 15,
    color: "#2dd4bf",
    active: true,
    isDefault: true,
    versions: [
      { effectiveFrom: null, start: "09:00", end: "18:00", breakMinutes: 60, graceMinutes: 15 }
    ]
  },
  {
    id: "SFT-MOR",
    code: "MOR",
    name: "Morning",
    start: "06:00",
    end: "15:00",
    breakMinutes: 60,
    graceMinutes: 10,
    color: "#60a5fa",
    active: true,
    isDefault: false,
    versions: [
      { effectiveFrom: null, start: "06:00", end: "15:00", breakMinutes: 60, graceMinutes: 10 }
    ]
  },
  {
    id: "SFT-EVE",
    code: "EVE",
    name: "Evening",
    start: "14:00",
    end: "23:00",
    breakMinutes: 60,
    graceMinutes: 10,
    color: "#fbbf24",
    active: true,
    isDefault: false,
    versions: [
      { effectiveFrom: null, start: "14:00", end: "23:00", breakMinutes: 60, graceMinutes: 10 }
    ]
  },
  {
    id: "SFT-NGT",
    code: "NGT",
    name: "Night",
    start: "22:00",
    end: "07:00",
    breakMinutes: 60,
    graceMinutes: 10,
    color: "#a78bfa",
    active: true,
    isDefault: false,
    versions: [
      { effectiveFrom: null, start: "22:00", end: "07:00", breakMinutes: 60, graceMinutes: 10 }
    ]
  }
];

// Formats a 24h "HH:mm" time string into 12-hour "09:00 AM" format
export function formatTime12(time24) {
  if (!time24) return "--";
  try {
    const [hStr, mStr] = String(time24).split(":");
    let h = parseInt(hStr, 10);
    const m = mStr ? mStr.slice(0, 2) : "00";
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  } catch (e) {
    return time24;
  }
}

// Formats minutes duration into "9h" or "8h 30m"
export function formatDurationMinutes(minutes) {
  if (minutes == null || isNaN(minutes) || minutes < 0) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Formats YYYY-MM-DD into "11 Nov 2026" in Asia/Kolkata timezone
export function formatDateDisplay(dateKey) {
  if (!dateKey) return "--";
  try {
    const d = new Date(`${dateKey}T12:00:00+05:30`);
    if (isNaN(d.getTime())) return dateKey;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(d);
  } catch (e) {
    return dateKey;
  }
}

// Formats YYYY-MM-DD into "Mon, 16 Nov 2026" in Asia/Kolkata timezone
export function formatDateWithWeekday(dateKey) {
  if (!dateKey) return "--";
  try {
    const d = new Date(`${dateKey}T12:00:00+05:30`);
    if (isNaN(d.getTime())) return dateKey;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(d);
  } catch (e) {
    return dateKey;
  }
}

// Formats an ISO timestamp into "Mon, 16 Nov 2026, 06:00 PM" in Asia/Kolkata timezone
export function formatDateTime(isoString) {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "--";
    const datePart = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(d);
    const timePart = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(d);
    return `${datePart}, ${timePart}`;
  } catch (e) {
    return "--";
  }
}

// Formats remaining deadline into relative text e.g. "in 5 h" with urgency indicator
export function formatRelativeDeadline(deadlineISO) {
  if (!deadlineISO) return null;
  const ms = new Date(deadlineISO).getTime() - Date.now();
  if (ms <= 0) return { text: "Expired", isUrgent: true, expired: true };
  const hours = Math.floor(ms / (3600 * 1000));
  const mins = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
  if (hours < 1) {
    return { text: `in ${mins}m`, isUrgent: true, expired: false };
  }
  if (hours < 6) {
    return { text: `in ${hours}h ${mins}m`, isUrgent: true, expired: false };
  }
  if (hours < 24) {
    return { text: `in ${hours}h`, isUrgent: false, expired: false };
  }
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return { text: `in ${days}d ${remH}h`, isUrgent: false, expired: false };
}

// Resolves the specific version of a shift that is effective on a given dateKey
export function getShiftVersionForDate(shift, dateKey) {
  if (!shift) return null;
  const versions = Array.isArray(shift.versions) && shift.versions.length > 0
    ? shift.versions
    : [{ effectiveFrom: null, start: shift.start || "09:00", end: shift.end || "18:00", breakMinutes: shift.breakMinutes || 60, graceMinutes: shift.graceMinutes || 15 }];

  const applicable = versions.filter(v => !v.effectiveFrom || (dateKey && v.effectiveFrom <= dateKey));
  if (applicable.length === 0) return versions[0];

  applicable.sort((a, b) => {
    if (!a.effectiveFrom) return -1;
    if (!b.effectiveFrom) return 1;
    return a.effectiveFrom.localeCompare(b.effectiveFrom);
  });

  return applicable[applicable.length - 1];
}

// Calculates derived duration, net hours, cross-midnight flags, and future versions for a shift
export function enrichShift(shift, dateKey = null) {
  if (!shift) return null;
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const activeVer = getShiftVersionForDate(shift, dateKey || todayKey);

  const startStr = activeVer?.start || shift.start || "09:00";
  const endStr = activeVer?.end || shift.end || "18:00";
  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  const startMinutes = (sH || 0) * 60 + (sM || 0);
  const endMinutes = (eH || 0) * 60 + (eM || 0);

  const crossesMidnight = endMinutes <= startMinutes;
  const durationMinutes = crossesMidnight
    ? (endMinutes + 1440) - startMinutes
    : endMinutes - startMinutes;

  const breakMinutes = activeVer?.breakMinutes != null ? Number(activeVer.breakMinutes) : (Number(shift.breakMinutes) || 0);
  const graceMinutes = activeVer?.graceMinutes != null ? Number(activeVer.graceMinutes) : (Number(shift.graceMinutes) || 0);
  const netMinutes = Math.max(0, durationMinutes - breakMinutes);

  // Check if a future version is scheduled
  let nextVersion = null;
  if (Array.isArray(shift.versions)) {
    const futureVersions = shift.versions.filter(v => v.effectiveFrom && v.effectiveFrom > todayKey);
    if (futureVersions.length > 0) {
      futureVersions.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
      nextVersion = futureVersions[0];
    }
  }

  return {
    ...shift,
    start: startStr,
    end: endStr,
    startMinutes,
    endMinutes,
    durationMinutes,
    netMinutes,
    breakMinutes,
    graceMinutes,
    crossesMidnight,
    nextVersion,
    timingDisplay: `${formatTime12(startStr)} to ${formatTime12(endStr)}${crossesMidnight ? " (+1 day)" : ""}`
  };
}

// Helper to determine tenant companyId
export function getCompanyId(user) {
  if (!user) return "NEX-IND";
  if (user.companyId && user.companyId !== "COMP-X" && user.companyId !== "COMP-Y") return user.companyId;
  return "NEX-IND";
}

// Role permission checks
export function isHrRole(user) {
  if (!user) return false;
  const sys = (user.systemRole || user.role || "").trim().toLowerCase();
  return sys === "hr" || sys === "hr manager" || sys.includes("hr") || sys.includes("admin");
}
export const isHRorAdmin = isHrRole;

export function isHrManagerRole(user) {
  if (!user) return false;
  const sys = (user.systemRole || user.role || "").trim().toLowerCase();
  return sys === "hr manager" || (sys.includes("hr") && sys.includes("manager")) || sys === "admin";
}

export function isManagerRole(user) {
  if (!user) return false;
  const sys = (user.systemRole || user.role || "").trim().toLowerCase();
  return sys === "manager" || sys.includes("manager") || sys.includes("lead");
}
export const isManager = isManagerRole;

// Returns the Monday (weekStartKey) of any YYYY-MM-DD date in Asia/Kolkata
export function getMondayOfWeek(dateInput) {
  try {
    const d = typeof dateInput === 'string'
      ? new Date(`${dateInput}T12:00:00+05:30`)
      : new Date(dateInput);
    const day = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch (e) {
    return "2026-11-09";
  }
}

// Returns 7 consecutive date keys starting from Monday
export function getDaysOfWeek(mondayKey) {
  const base = new Date(`${mondayKey}T12:00:00+05:30`);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(base);
    cur.setDate(base.getDate() + i);
    days.push(cur.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  }
  return days;
}
export const getWeekDates = getDaysOfWeek;

// Returns all YYYY-MM-DD date keys in Asia/Kolkata for a year and month
export function getMonthDates(year, month) {
  const y = Number(year);
  const m = Number(month);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

// Broadcasts store updates to all listeners and tabs
function notifyShiftsUpdated() {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch (e) {}
  }
}

// Subscribes to shift and roster store updates
export function subscribeShifts(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

// Internal notification writer
function addNotificationInternal(store, { userId, companyId, text, changeId = null }) {
  if (!Array.isArray(store.notifications)) store.notifications = [];
  const notif = {
    id: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: userId || "ALL",
    companyId: companyId || "NEX-IND",
    at: new Date().toISOString(),
    text,
    read: false,
    changeId
  };
  store.notifications.unshift(notif);
  if (store.notifications.length > 100) {
    store.notifications = store.notifications.slice(0, 100);
  }
}

// Reads the raw shifts & roster store from localStorage with schema v3 migration
function loadStore() {
  const emptyStore = {
    version: 3,
    shifts: {
      "NEX-IND": DEFAULT_SHIFTS.map(s => ({ ...s }))
    },
    roster: {},
    weeks: {},
    changes: [],
    notifications: []
  };

  try {
    if (typeof localStorage === "undefined") return emptyStore;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStore));
      return emptyStore;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyStore;

    let needsSave = false;

    // Migrate version 1 -> 2
    if (!parsed.version || parsed.version < 2) {
      parsed.version = 2;
      needsSave = true;

      // Migrate requests -> changes
      if (Array.isArray(parsed.requests) && !parsed.changes) {
        parsed.changes = parsed.requests.map(req => {
          let status = "Pending HR";
          if (req.status === "Approved") status = "Approved";
          else if (req.status === "Rejected") status = "Rejected";
          else if (req.status === "Cancelled") status = "Cancelled";

          return {
            id: req.id || `CHG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            origin: "employee",
            employeeId: req.employeeId,
            name: req.name || req.employeeId,
            items: [{
              dateKey: req.dateKey,
              fromCode: req.fromCode,
              toCode: req.toCode
            }],
            reason: req.reason || "",
            status,
            deadline: null,
            requestedBy: req.name || req.employeeId,
            createdAt: req.requestedAt || new Date().toISOString(),
            decidedBy: req.decidedBy || null,
            decidedAt: req.decidedAt || null,
            remark: req.remark || null,
            history: [{
              at: req.requestedAt || new Date().toISOString(),
              by: req.name || req.employeeId,
              role: "Employee",
              action: "Created Request",
              detail: `Requested change to ${req.toCode}`
            }]
          };
        });
        delete parsed.requests;
      }

      // Ensure shifts have versions
      if (parsed.shifts && typeof parsed.shifts === "object") {
        Object.keys(parsed.shifts).forEach(cId => {
          if (Array.isArray(parsed.shifts[cId])) {
            parsed.shifts[cId].forEach(s => {
              if (!Array.isArray(s.versions) || s.versions.length === 0) {
                s.versions = [{
                  effectiveFrom: null,
                  start: s.start || "09:00",
                  end: s.end || "18:00",
                  breakMinutes: s.breakMinutes != null ? s.breakMinutes : 60,
                  graceMinutes: s.graceMinutes != null ? s.graceMinutes : 15
                }];
              }
            });
          }
        });
      }
    }

    if (parsed.shifts && parsed.shifts["COMP-X"] && !parsed.shifts["NEX-IND"]) {
      parsed.shifts["NEX-IND"] = parsed.shifts["COMP-X"];
      needsSave = true;
    }
    if (!parsed.shifts || !parsed.shifts["NEX-IND"]) {
      parsed.shifts = emptyStore.shifts;
      needsSave = true;
    }
    if (!parsed.roster) parsed.roster = {};
    if (!parsed.weeks) parsed.weeks = {};
    if (!Array.isArray(parsed.changes)) parsed.changes = [];
    if (!Array.isArray(parsed.notifications)) parsed.notifications = [];

    if (needsSave) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error("Error reading shifts store:", err);
    return emptyStore;
  }
}

// Writes the raw shifts & roster store to localStorage
function saveStore(store) {
  try {
    if (typeof localStorage === "undefined") return false;
    store.version = 2;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    notifyShiftsUpdated();
    return true;
  } catch (err) {
    console.error("Error writing shifts store:", err);
    return false;
  }
}

// Automatically transitions any unaccepted HR proposals whose deadline has passed to "Expired"
export function refreshExpiry(store = null) {
  const needsSave = !store;
  const s = store || loadStore();
  let changed = false;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  for (const chg of (s.changes || [])) {
    if (chg.origin === "hr" && chg.status === "Awaiting Employee" && chg.deadline) {
      const deadlineMs = new Date(chg.deadline).getTime();
      if (!isNaN(deadlineMs) && nowMs > deadlineMs) {
        chg.status = "Expired";
        if (!Array.isArray(chg.history)) chg.history = [];
        chg.history.push({
          at: nowIso,
          by: "System",
          role: "System",
          action: "Expired",
          detail: "No response by the deadline"
        });
        addNotificationInternal(s, {
          userId: "HR",
          companyId: chg.companyId || "NEX-IND",
          text: `Roster proposal for ${chg.name} expired without response.`,
          changeId: chg.id
        });
        changed = true;
      }
    }
  }

  if (changed && needsSave) {
    saveStore(s);
  }
  return s;
}

// Confirms a shift change and writes every item to published snapshot and working copy
export function applyChange(change, store = null) {
  const needsSave = !store;
  const s = store || loadStore();
  const employeeId = change.employeeId;
  const employees = getEmployeeList();
  const targetEmp = employees.find(e => e.employeeId === employeeId);
  const companyId = change.companyId || targetEmp?.companyId || "NEX-IND";

  if (!s.roster[companyId]) s.roster[companyId] = {};
  if (!s.weeks[companyId]) s.weeks[companyId] = {};

  for (const item of (change.items || [])) {
    const { dateKey, toCode } = item;
    const weekStartKey = getMondayOfWeek(dateKey);

    // Update working copy
    if (!s.roster[companyId][dateKey]) s.roster[companyId][dateKey] = {};
    s.roster[companyId][dateKey][employeeId] = toCode;

    // Update published snapshot
    if (!s.weeks[companyId][weekStartKey]) {
      s.weeks[companyId][weekStartKey] = {
        status: "published",
        published: {},
        publishedBy: change.decidedBy || "System",
        publishedAt: new Date().toISOString()
      };
    }
    if (!s.weeks[companyId][weekStartKey].published) {
      s.weeks[companyId][weekStartKey].published = {};
    }
    if (!s.weeks[companyId][weekStartKey].published[dateKey]) {
      s.weeks[companyId][weekStartKey].published[dateKey] = {};
    }
    s.weeks[companyId][weekStartKey].published[dateKey][employeeId] = toCode;
  }

  if (needsSave) {
    saveStore(s);
  }
  return true;
}

// Returns recent notifications for a user
export function getNotifications(viewer, limit = 5) {
  if (!viewer) return [];
  const store = loadStore();
  const viewerId = viewer.employeeId || viewer.id;
  const companyId = getCompanyId(viewer);
  const isHR = isHrRole(viewer);

  const list = (store.notifications || []).filter(n => {
    if (n.companyId && n.companyId !== companyId) return false;
    if (isHR) {
      return n.userId === "HR" || n.userId === "ALL" || n.userId === viewerId;
    }
    return n.userId === viewerId || n.userId === "ALL";
  });

  return list.slice(0, limit);
}

// Marks recent notifications as read for the user
export function markNotificationsRead(viewer) {
  if (!viewer) return;
  const store = loadStore();
  const viewerId = viewer.employeeId || viewer.id;
  const companyId = getCompanyId(viewer);
  const isHR = isHrRole(viewer);
  let changed = false;

  for (const n of (store.notifications || [])) {
    if (n.companyId && n.companyId !== companyId) continue;
    const isTarget = isHR ? (n.userId === "HR" || n.userId === "ALL" || n.userId === viewerId) : (n.userId === viewerId || n.userId === "ALL");
    if (isTarget && !n.read) {
      n.read = true;
      changed = true;
    }
  }

  if (changed) {
    saveStore(store);
  }
}

// Returns the count of pending items requiring action for this role (for the sidebar badge)
export function getPendingCount(viewer) {
  if (!viewer) return 0;
  const store = refreshExpiry();
  const viewerId = viewer.employeeId || viewer.id;
  const companyId = getCompanyId(viewer);
  const isHR = isHrRole(viewer);
  const isMgr = isManagerRole(viewer);

  if (isMgr && !isHR) {
    return 0;
  }

  if (isHR) {
    // Count Pending HR requests + unhandled Expired proposals
    return (store.changes || []).filter(c => {
      const cCompany = c.companyId || (getEmployeeList().find(e => e.employeeId === c.employeeId)?.companyId) || "NEX-IND";
      if (cCompany !== companyId) return false;
      if (c.origin === "employee" && c.status === "Pending HR") return true;
      if (c.origin === "hr" && c.status === "Expired" && !c.handled) return true;
      return false;
    }).length;
  }

  // Employee: count of awaiting proposals
  return (store.changes || []).filter(c => {
    return c.origin === "hr" && c.employeeId === viewerId && c.status === "Awaiting Employee";
  }).length;
}

// Calculates cell state mapping for the HR roster grid
export function getCellStates(viewer, startKey, endKey) {
  const store = refreshExpiry();
  const companyId = getCompanyId(viewer);
  const weekStart = getMondayOfWeek(startKey);
  const weekMeta = store.weeks?.[companyId]?.[weekStart];
  const baseline = weekMeta?.published || {};
  const workingRoster = store.roster?.[companyId] || {};
  const defShift = getDefaultShift(companyId);

  const states = {};

  const activeChanges = (store.changes || []).filter(c => {
    return c.status === "Awaiting Employee" || c.status === "Declined" || c.status === "Expired";
  });

  const employees = getEmployeeList().filter(e => (e.companyId || "NEX-IND") === companyId);
  const dateKeys = getDaysOfWeek(weekStart);

  for (const emp of employees) {
    states[emp.employeeId] = {};
    for (const dKey of dateKeys) {
      const d = new Date(`${dKey}T12:00:00+05:30`);
      const isWeekendDefault = d.getDay() === 0 || d.getDay() === 6;

      const workingCode = workingRoster[dKey]?.[emp.employeeId] !== undefined
        ? workingRoster[dKey][emp.employeeId]
        : (isWeekendDefault ? "WO" : defShift.id);

      const publishedCode = baseline[dKey]?.[emp.employeeId] !== undefined
        ? baseline[dKey][emp.employeeId]
        : (isWeekendDefault ? "WO" : defShift.id);

      if (workingCode === publishedCode) {
        states[emp.employeeId][dKey] = {
          state: "confirmed",
          workingCode,
          publishedCode
        };
        continue;
      }

      // Check if an active proposal covers this cell
      const matchingChange = activeChanges.find(c =>
        c.employeeId === emp.employeeId &&
        Array.isArray(c.items) &&
        c.items.some(i => i.dateKey === dKey)
      );

      if (matchingChange) {
        if (matchingChange.status === "Awaiting Employee") {
          states[emp.employeeId][dKey] = {
            state: "awaiting",
            changeId: matchingChange.id,
            deadline: matchingChange.deadline,
            reason: matchingChange.reason,
            workingCode,
            publishedCode
          };
        } else {
          states[emp.employeeId][dKey] = {
            state: "declined",
            changeId: matchingChange.id,
            reason: matchingChange.remark || (matchingChange.status === "Expired" ? "No response by the deadline" : matchingChange.reason),
            workingCode,
            publishedCode
          };
        }
      } else {
        states[emp.employeeId][dKey] = {
          state: "draft",
          workingCode,
          publishedCode
        };
      }
    }
  }

  return states;
}

// Checks if an employee has an approved leave request covering a given date
function isEmployeeOnApprovedLeave(empId, dateKey) {
  try {
    const approvals = loadApprovals();
    if (!Array.isArray(approvals)) return false;
    for (const req of approvals) {
      if (req.status === "Approved" && req.type === "Leave Requests" && req.employeeId === empId) {
        if (req.dateKey === dateKey || req.date === dateKey) return true;
        if (req.dates && typeof req.dates === "string") {
          const [yr, mo, da] = dateKey.split("-").map(Number);
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthName = monthNames[mo - 1];
          if (req.dates.includes(monthName) && req.dates.includes(String(da))) {
            return true;
          }
        }
      }
    }
  } catch (e) {}
  return false;
}

// Computes the resting interval in hours between two consecutive shifts
export function calculateRestGapHours(shiftA, shiftB) {
  if (!shiftA || !shiftB) return 24;
  const [sAH, sAM] = (shiftA.start || "09:00").split(':').map(Number);
  const [eAH, eAM] = (shiftA.end || "18:00").split(':').map(Number);
  const [sBH, sBM] = (shiftB.start || "09:00").split(':').map(Number);

  const startAMin = (sAH || 0) * 60 + (sAM || 0);
  const endAMin = (eAH || 0) * 60 + (eAM || 0);
  const startBMin = (sBH || 0) * 60 + (sBM || 0);

  const crossA = endAMin <= startAMin;
  const day2StartBMin = startBMin + 1440;
  const actualEndAMin = crossA ? endAMin + 1440 : endAMin;

  const gapMinutes = day2StartBMin - actualEndAMin;
  return gapMinutes / 60;
}

// Returns the company default shift
function getDefaultShift(companyId) {
  const store = loadStore();
  const shifts = store.shifts[companyId] || DEFAULT_SHIFTS;
  const found = shifts.find(s => s.isDefault && s.active);
  return enrichShift(found || shifts[0] || DEFAULT_SHIFTS[0]);
}

// Returns all configured shifts for the tenant company
export function getShifts(viewer) {
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const list = store.shifts[companyId] || DEFAULT_SHIFTS;
  return list.map(s => enrichShift(s));
}

// Counts unique employees scheduled on a shift in the upcoming 30 days
export function getShiftImpactCount(companyId, shiftId, effectiveFromDate) {
  const store = loadStore();
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const startD = new Date(`${effectiveFromDate || todayKey}T12:00:00+05:30`);
  const impactedEmps = new Set();

  for (let i = 0; i < 30; i++) {
    const cur = new Date(startD);
    cur.setDate(cur.getDate() + i);
    const dKey = cur.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const weekStart = getMondayOfWeek(dKey);

    const published = store.weeks?.[companyId]?.[weekStart]?.published?.[dKey];
    if (published) {
      Object.entries(published).forEach(([empId, code]) => {
        if (code === shiftId) impactedEmps.add(empId);
      });
    } else {
      const working = store.roster?.[companyId]?.[dKey];
      if (working) {
        Object.entries(working).forEach(([empId, code]) => {
          if (code === shiftId) impactedEmps.add(empId);
        });
      }
    }
  }

  return impactedEmps.size;
}

// Adds or modifies a shift template (with versioning when timing changes)
export function saveShift(viewer, shiftData) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can configure shifts." };
  }

  const name = (shiftData.name || "").trim();
  const code = (shiftData.code || "").trim().toUpperCase();

  if (!name) return { ok: false, error: "Shift name is required." };
  if (!code || code.length < 2 || code.length > 4 || !/^[A-Z]{2,4}$/.test(code)) {
    return { ok: false, error: "Shift code must be 2 to 4 uppercase letters (e.g. MOR, NGT)." };
  }

  const [sH, sM] = (shiftData.start || "09:00").split(':').map(Number);
  const [eH, eM] = (shiftData.end || "18:00").split(':').map(Number);
  const startMin = (sH || 0) * 60 + (sM || 0);
  const endMin = (eH || 0) * 60 + (eM || 0);
  const crosses = endMin <= startMin;
  const durationMin = crosses ? (endMin + 1440) - startMin : endMin - startMin;

  if (durationMin < 240 || durationMin > 840) {
    return { ok: false, error: "Shift duration must be between 4 hours and 14 hours." };
  }

  const breakMin = Number(shiftData.breakMinutes) || 0;
  if (breakMin >= durationMin) {
    return { ok: false, error: "Break duration must be strictly less than the total shift duration." };
  }

  const graceMin = Number(shiftData.graceMinutes) || 0;
  if (graceMin < 0 || graceMin > 60) {
    return { ok: false, error: "Grace period must be between 0 and 60 minutes." };
  }

  const store = loadStore();
  const companyId = getCompanyId(viewer);
  if (!store.shifts[companyId]) {
    store.shifts[companyId] = DEFAULT_SHIFTS.map(s => ({ ...s }));
  }

  const list = store.shifts[companyId];

  if (!shiftData.id) {
    // Add new shift
    if (list.some(s => s.code === code)) {
      return { ok: false, error: `A shift with code "${code}" already exists in your company.` };
    }
    const newId = `SFT-${code}`;
    const newShift = {
      id: newId,
      code,
      name,
      start: shiftData.start || "09:00",
      end: shiftData.end || "18:00",
      breakMinutes: breakMin,
      graceMinutes: graceMin,
      color: shiftData.color || PRESET_SHIFT_COLORS[0],
      active: true,
      isDefault: false,
      versions: [
        {
          effectiveFrom: null,
          start: shiftData.start || "09:00",
          end: shiftData.end || "18:00",
          breakMinutes: breakMin,
          graceMinutes: graceMin
        }
      ]
    };
    list.push(newShift);
    saveStore(store);
    return { ok: true, shift: enrichShift(newShift) };
  }

  // Edit existing shift
  const idx = list.findIndex(s => s.id === shiftData.id);
  if (idx === -1) return { ok: false, error: "Shift not found." };

  if (list.some((s, i) => i !== idx && s.code === code)) {
    return { ok: false, error: `Shift code "${code}" is already in use by another shift.` };
  }

  const existing = list[idx];
  if (!Array.isArray(existing.versions) || existing.versions.length === 0) {
    existing.versions = [{
      effectiveFrom: null,
      start: existing.start || "09:00",
      end: existing.end || "18:00",
      breakMinutes: existing.breakMinutes || 60,
      graceMinutes: existing.graceMinutes || 15
    }];
  }

  const currentVer = getShiftVersionForDate(existing, null);
  const timingChanged = (
    currentVer.start !== shiftData.start ||
    currentVer.end !== shiftData.end ||
    Number(currentVer.breakMinutes) !== breakMin ||
    Number(currentVer.graceMinutes) !== graceMin
  );

  if (timingChanged && shiftData.effectiveFrom) {
    // Push new version
    existing.versions.push({
      effectiveFrom: shiftData.effectiveFrom,
      start: shiftData.start,
      end: shiftData.end,
      breakMinutes: breakMin,
      graceMinutes: graceMin
    });

    // Notify employees who have this shift in the next 30 days
    addNotificationInternal(store, {
      userId: "ALL",
      companyId,
      text: `Timing of ${name} changes to ${formatTime12(shiftData.start)} to ${formatTime12(shiftData.end)} from ${formatDateDisplay(shiftData.effectiveFrom)}.`
    });
  } else if (!timingChanged) {
    // Basic edits only
    existing.name = name;
    existing.code = code;
    existing.color = shiftData.color || existing.color;
    if (shiftData.active !== undefined) existing.active = shiftData.active;
  }

  saveStore(store);
  return { ok: true, shift: enrichShift(existing) };
}

// Activates or deactivates a shift template
export function setShiftActive(viewer, id, active) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can activate or deactivate shifts." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const list = store.shifts[companyId] || [];
  const shift = list.find(s => s.id === id);
  if (!shift) return { ok: false, error: "Shift not found." };
  if (shift.isDefault && !active) {
    return { ok: false, error: "The default company shift cannot be deactivated." };
  }
  shift.active = Boolean(active);
  saveStore(store);
  return { ok: true, shift: enrichShift(shift) };
}

// Deletes a shift template if not in use
export function deleteShift(viewer, id) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can delete shifts." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const list = store.shifts[companyId] || [];
  const shift = list.find(s => s.id === id);
  if (!shift) return { ok: false, error: "Shift not found." };
  if (shift.isDefault) {
    return { ok: false, error: "The default company shift cannot be deleted." };
  }

  // Check if assigned in working roster
  const compRoster = store.roster[companyId] || {};
  let usageCount = 0;
  for (const dateKey of Object.keys(compRoster)) {
    for (const empId of Object.keys(compRoster[dateKey])) {
      if (compRoster[dateKey][empId] === id || compRoster[dateKey][empId] === shift.code) {
        usageCount++;
      }
    }
  }

  if (usageCount > 0) {
    return {
      ok: false,
      error: `Cannot delete shift "${shift.name}" because it is currently assigned in ${usageCount} roster slot(s). Please deactivate it instead.`
    };
  }

  store.shifts[companyId] = list.filter(s => s.id !== id);
  saveStore(store);
  return { ok: true };
}

// Resolves the assignment for an employee on a single date
function resolveDayAssignment(store, companyId, employeeId, dateKey, { forEdit = false }) {
  const weekStart = getMondayOfWeek(dateKey);
  const weekMeta = store.weeks?.[companyId]?.[weekStart];
  const shiftsList = (store.shifts[companyId] || DEFAULT_SHIFTS).map(s => enrichShift(s, dateKey));
  const defaultShift = shiftsList.find(s => s.isDefault && s.active) || shiftsList[0] || DEFAULT_SHIFTS[0];

  const d = new Date(`${dateKey}T12:00:00+05:30`);
  const isWeekendDefault = d.getDay() === 0 || d.getDay() === 6;

  if (forEdit) {
    const workingVal = store.roster?.[companyId]?.[dateKey]?.[employeeId];
    if (workingVal !== undefined) return { code: workingVal, shiftId: workingVal, source: "working" };
    return {
      code: isWeekendDefault ? "WO" : defaultShift.id,
      shiftId: isWeekendDefault ? "WO" : defaultShift.id,
      source: "default"
    };
  }

  if (weekMeta?.published?.[dateKey]?.[employeeId] !== undefined) {
    const pubVal = weekMeta.published[dateKey][employeeId];
    return { code: pubVal, shiftId: pubVal, source: "published" };
  }

  if (!weekMeta || (weekMeta.status === "draft" && !weekMeta.published)) {
    return {
      code: isWeekendDefault ? "WO" : defaultShift.id,
      shiftId: isWeekendDefault ? "WO" : defaultShift.id,
      source: "default"
    };
  }

  return {
    code: isWeekendDefault ? "WO" : defaultShift.id,
    shiftId: isWeekendDefault ? "WO" : defaultShift.id,
    source: "default"
  };
}

// Returns the full matrix of employees x dates with rest gap & coverage audits
export function getRosterGrid(viewer, startKey, endKey, { forEdit = false } = {}) {
  const store = refreshExpiry();
  const companyId = getCompanyId(viewer);
  const isHR = isHrRole(viewer);
  const isMgr = isManagerRole(viewer);

  const shiftsList = (store.shifts[companyId] || DEFAULT_SHIFTS).map(s => enrichShift(s));
  const shiftsMap = new Map();
  shiftsList.forEach(s => {
    shiftsMap.set(s.id, s);
    shiftsMap.set(s.code, s);
  });

  let employees = getEmployeeList().filter(e => (e.companyId || "NEX-IND") === companyId);
  if (!isHR && !isMgr) {
    const myId = viewer?.employeeId || viewer?.id;
    employees = employees.filter(e => e.employeeId === myId);
  }

  const dateKeys = [];
  const startD = new Date(`${startKey}T12:00:00+05:30`);
  const endD = new Date(`${endKey}T12:00:00+05:30`);
  const cur = new Date(startD);

  while (cur <= endD) {
    dateKeys.push(cur.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
    cur.setDate(cur.getDate() + 1);
  }

  const warnings = [];
  const rows = [];
  const holidaysMap = {};

  for (const dKey of dateKeys) {
    if (isHolidayDate(dKey)) {
      holidaysMap[dKey] = getHolidayByDate(dKey);
    }
  }

  for (const emp of employees) {
    const rowCells = {};
    const assignedShifts = [];

    for (let i = 0; i < dateKeys.length; i++) {
      const dKey = dateKeys[i];
      const res = resolveDayAssignment(store, companyId, emp.employeeId, dKey, { forEdit: isHR && forEdit });
      const rawCode = res.code;
      const isWeekOff = rawCode === "WO";
      const shiftObj = isWeekOff ? null : (shiftsMap.get(res.shiftId) || shiftsMap.get(rawCode) || null);
      const code = isWeekOff ? "WO" : (shiftObj?.code || rawCode);

      const cellWarnings = [];
      if (!isWeekOff && shiftObj && !shiftObj.active) {
        cellWarnings.push(`Shift ${shiftObj.name} is inactive`);
      }

      const holiday = holidaysMap[dKey] || null;
      const onLeave = isEmployeeOnApprovedLeave(emp.employeeId, dKey);

      rowCells[dKey] = {
        code,
        shiftId: shiftObj?.id || rawCode,
        isWeekOff,
        source: res.source,
        warnings: cellWarnings,
        holidayName: holiday?.name || null,
        onLeave
      };

      assignedShifts.push({ dateKey: dKey, shiftObj, isWeekOff, onLeave });
    }

    // Audit: Rest Gap Warnings between consecutive days
    for (let i = 0; i < assignedShifts.length - 1; i++) {
      const day1 = assignedShifts[i];
      const day2 = assignedShifts[i + 1];

      if (!day1.isWeekOff && !day2.isWeekOff && day1.shiftObj && day2.shiftObj) {
        const gap = calculateRestGapHours(day1.shiftObj, day2.shiftObj);
        if (gap < MIN_REST_HOURS) {
          const warnMsg = `Rest gap under 11 hours (${Math.round(gap)}h gap between ${day1.shiftObj.name} and ${day2.shiftObj.name})`;
          rowCells[day2.dateKey].warnings.push(warnMsg);
          warnings.push(`${emp.name}: ${warnMsg} on ${formatDateDisplay(day2.dateKey)}`);
        }
      }
    }

    // Audit: 7-day working schedule without a week off
    if (dateKeys.length === 7) {
      const workingDaysCount = assignedShifts.filter(s => !s.isWeekOff && !s.onLeave).length;
      if (workingDaysCount === 7) {
        const noWoMsg = "No week off this week (scheduled 7 consecutive work days)";
        dateKeys.forEach(k => rowCells[k].warnings.push(noWoMsg));
        warnings.push(`${emp.name}: ${noWoMsg}`);
      }
    }

    rows.push({
      employeeId: emp.employeeId,
      name: emp.name,
      dept: emp.dept || "General",
      role: emp.role || "Employee",
      avatarUrl: emp.avatarUrl || null,
      cells: rowCells
    });
  }

  const weekStart = getMondayOfWeek(startKey);
  const weekMeta = store.weeks?.[companyId]?.[weekStart];
  const status = weekMeta?.status || "draft";

  return {
    rows,
    dateKeys,
    warnings,
    status,
    publishedAt: weekMeta?.publishedAt || null,
    publishedBy: weekMeta?.publishedBy || null,
    holidays: holidaysMap
  };
}

// Modifies a single cell in the HR working roster
export function setCell(viewer, employeeId, dateKey, value) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can edit the roster." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);

  if (!store.roster[companyId]) store.roster[companyId] = {};
  if (!store.roster[companyId][dateKey]) store.roster[companyId][dateKey] = {};

  store.roster[companyId][dateKey][employeeId] = value;

  const weekStartKey = getMondayOfWeek(dateKey);
  if (!store.weeks[companyId]) store.weeks[companyId] = {};
  if (!store.weeks[companyId][weekStartKey]) {
    store.weeks[companyId][weekStartKey] = { status: "draft", published: null };
  } else {
    store.weeks[companyId][weekStartKey].status = "draft";
  }

  saveStore(store);
  return { ok: true };
}

// Applies a shift to a range of dates for an employee
export function setRange(viewer, employeeId, startKey, endKey, value, { weekdaysOnly = false } = {}) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can edit the roster." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  if (!store.roster[companyId]) store.roster[companyId] = {};

  const cur = new Date(`${startKey}T12:00:00+05:30`);
  const end = new Date(`${endKey}T12:00:00+05:30`);

  while (cur <= end) {
    const dow = cur.getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (!weekdaysOnly || !isWeekend) {
      const dKey = cur.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      if (!store.roster[companyId][dKey]) store.roster[companyId][dKey] = {};
      store.roster[companyId][dKey][employeeId] = value;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const weekStartKey = getMondayOfWeek(startKey);
  if (!store.weeks[companyId]) store.weeks[companyId] = {};
  if (!store.weeks[companyId][weekStartKey]) {
    store.weeks[companyId][weekStartKey] = { status: "draft", published: null };
  } else {
    store.weeks[companyId][weekStartKey].status = "draft";
  }

  saveStore(store);
  return { ok: true };
}

// Sets Mon-Fri to a specified shift and Sat-Sun to Week Off for an employee
export function applyToWeek(viewer, employeeId, weekStartKey, { weekdayShiftId = null } = {}) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can edit the roster." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const weekDays = getDaysOfWeek(weekStartKey);
  const defShift = getDefaultShift(companyId);
  const shiftToApply = weekdayShiftId || defShift.id;

  if (!store.roster[companyId]) store.roster[companyId] = {};

  for (let i = 0; i < 7; i++) {
    const dKey = weekDays[i];
    const isWeekend = i === 5 || i === 6;
    if (!store.roster[companyId][dKey]) store.roster[companyId][dKey] = {};
    store.roster[companyId][dKey][employeeId] = isWeekend ? "WO" : shiftToApply;
  }

  if (!store.weeks[companyId]) store.weeks[companyId] = {};
  if (!store.weeks[companyId][weekStartKey]) {
    store.weeks[companyId][weekStartKey] = { status: "draft", published: null };
  } else {
    store.weeks[companyId][weekStartKey].status = "draft";
  }

  saveStore(store);
  return { ok: true };
}

// Copies all employee assignments from one week into another
export function copyWeek(viewer, fromWeekStartKey, toWeekStartKey) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can copy schedules." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const fromDays = getDaysOfWeek(fromWeekStartKey);
  const toDays = getDaysOfWeek(toWeekStartKey);
  const employees = getEmployeeList().filter(e => (e.companyId || "NEX-IND") === companyId);
  const defShift = getDefaultShift(companyId);

  if (!store.roster[companyId]) store.roster[companyId] = {};

  for (let i = 0; i < 7; i++) {
    const srcKey = fromDays[i];
    const destKey = toDays[i];
    const isWeekend = i === 5 || i === 6;

    if (!store.roster[companyId][destKey]) store.roster[companyId][destKey] = {};

    for (const emp of employees) {
      const val = store.roster[companyId]?.[srcKey]?.[emp.employeeId] !== undefined
        ? store.roster[companyId][srcKey][emp.employeeId]
        : (isWeekend ? "WO" : defShift.id);
      store.roster[companyId][destKey][emp.employeeId] = val;
    }
  }

  if (!store.weeks[companyId]) store.weeks[companyId] = {};
  store.weeks[companyId][toWeekStartKey] = { status: "draft", published: null };

  saveStore(store);
  return { ok: true };
}

// Resets an entire week's assignments to company defaults
export function resetWeek(viewer, weekStartKey) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can reset schedules." };
  }
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const weekDays = getDaysOfWeek(weekStartKey);

  if (store.roster[companyId]) {
    for (const dKey of weekDays) {
      delete store.roster[companyId][dKey];
    }
  }

  if (!store.weeks[companyId]) store.weeks[companyId] = {};
  store.weeks[companyId][weekStartKey] = { status: "draft", published: null };

  saveStore(store);
  return { ok: true };
}

// Pre-flight check to inspect differences, blocked past cells, and warnings before publishing
export function inspectPublishWeek(viewer, weekStartKey) {
  const store = refreshExpiry();
  const companyId = getCompanyId(viewer);
  const weekDays = getDaysOfWeek(weekStartKey);
  const defShift = getDefaultShift(companyId);
  const employees = getEmployeeList().filter(e => (e.companyId || "NEX-IND") === companyId);
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const baseline = store.weeks?.[companyId]?.[weekStartKey]?.published || {};
  const workingRoster = store.roster?.[companyId] || {};

  const diffsByEmp = {};
  const pastBlockedDates = new Set();
  let totalChanges = 0;

  for (const emp of employees) {
    const empDiffs = [];
    for (let i = 0; i < 7; i++) {
      const dKey = weekDays[i];
      const isWeekendDefault = i === 5 || i === 6;

      const baseVal = baseline[dKey]?.[emp.employeeId] !== undefined
        ? baseline[dKey][emp.employeeId]
        : (isWeekendDefault ? "WO" : defShift.id);

      const workVal = workingRoster[dKey]?.[emp.employeeId] !== undefined
        ? workingRoster[dKey][emp.employeeId]
        : baseVal;

      if (workVal !== baseVal) {
        if (dKey <= todayKey) {
          pastBlockedDates.add(dKey);
        }
        empDiffs.push({
          dateKey: dKey,
          fromCode: baseVal,
          toCode: workVal
        });
        totalChanges++;
      }
    }
    if (empDiffs.length > 0) {
      diffsByEmp[emp.employeeId] = {
        employeeId: emp.employeeId,
        name: emp.name,
        diffs: empDiffs
      };
    }
  }

  const grid = getRosterGrid(viewer, weekDays[0], weekDays[6], { forEdit: true });
  const sortedBlockedDates = Array.from(pastBlockedDates).sort();

  return {
    employeeCount: Object.keys(diffsByEmp).length,
    totalChangesCount: totalChanges,
    diffsByEmp,
    blockedPastDates: sortedBlockedDates,
    warnings: grid.warnings,
    requiresAcceptance: ROSTER_REQUIRES_ACCEPTANCE
  };
}

// Reverts specified past date cells in the working copy back to baseline values
export function revertPastWeekCells(viewer, weekStartKey, pastDates) {
  if (!isHrRole(viewer)) return { ok: false, error: "Unauthorized" };
  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const defShift = getDefaultShift(companyId);
  const employees = getEmployeeList().filter(e => (e.companyId || "NEX-IND") === companyId);
  const baseline = store.weeks?.[companyId]?.[weekStartKey]?.published || {};

  for (const dKey of pastDates) {
    const d = new Date(`${dKey}T12:00:00+05:30`);
    const isWeekendDefault = d.getDay() === 0 || d.getDay() === 6;

    for (const emp of employees) {
      const baseVal = baseline[dKey]?.[emp.employeeId] !== undefined
        ? baseline[dKey][emp.employeeId]
        : (isWeekendDefault ? "WO" : defShift.id);

      if (store.roster[companyId]?.[dKey]) {
        store.roster[companyId][dKey][emp.employeeId] = baseVal;
      }
    }
  }

  saveStore(store);
  return { ok: true };
}

// Publishes the week roster: creates proposals for acceptance if required, or applies directly
export function publishWeek(viewer, weekStartKey, { note = "", revertPastCells = false } = {}) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can publish schedules." };
  }

  const inspect = inspectPublishWeek(viewer, weekStartKey);

  // Validate: blocked today and past dates
  if (inspect.blockedPastDates.length > 0) {
    if (revertPastCells) {
      revertPastWeekCells(viewer, weekStartKey, inspect.blockedPastDates);
    } else {
      const formattedDates = inspect.blockedPastDates.map(d => formatDateWithWeekday(d)).join(", ");
      return {
        ok: false,
        blockedPastDates: inspect.blockedPastDates,
        error: `Cannot change today or past dates: ${formattedDates}. Revert those cells.`
      };
    }
  }

  const store = loadStore();
  const companyId = getCompanyId(viewer);
  const weekDays = getDaysOfWeek(weekStartKey);
  const defShift = getDefaultShift(companyId);
  const employees = getEmployeeList().filter(e => (e.companyId || "NEX-IND") === companyId);
  const shiftsList = (store.shifts[companyId] || DEFAULT_SHIFTS).map(s => enrichShift(s));
  const shiftsMap = new Map();
  shiftsList.forEach(s => shiftsMap.set(s.id, s));

  const weekLabel = `${formatDateDisplay(weekDays[0])} to ${formatDateDisplay(weekDays[6])}`;

  if (!store.weeks[companyId]) store.weeks[companyId] = {};
  if (!store.roster[companyId]) store.roster[companyId] = {};

  const baseline = store.weeks[companyId]?.[weekStartKey]?.published || {};
  const publishedSnapshot = {};

  if (!ROSTER_REQUIRES_ACCEPTANCE) {
    // Mode: direct publish without confirmation workflow
    for (const dKey of weekDays) {
      publishedSnapshot[dKey] = {};
      const d = new Date(`${dKey}T12:00:00+05:30`);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      for (const emp of employees) {
        const val = store.roster[companyId]?.[dKey]?.[emp.employeeId] !== undefined
          ? store.roster[companyId][dKey][emp.employeeId]
          : (isWeekend ? "WO" : defShift.id);
        publishedSnapshot[dKey][emp.employeeId] = val;
      }
    }

    store.weeks[companyId][weekStartKey] = {
      status: "published",
      published: publishedSnapshot,
      publishedBy: viewer.name || viewer.employeeId || "HR Administrator",
      publishedAt: new Date().toISOString()
    };

    saveStore(store);
    return { ok: true, requiresAcceptance: false, warnings: inspect.warnings };
  }

  // Mode: Confirmation Workflow enabled (ROSTER_REQUIRES_ACCEPTANCE = true)
  const employeesWithDiffs = [];

  for (const emp of employees) {
    const empDiffs = [];
    for (let i = 0; i < 7; i++) {
      const dKey = weekDays[i];
      const isWeekendDefault = i === 5 || i === 6;

      const baseVal = baseline[dKey]?.[emp.employeeId] !== undefined
        ? baseline[dKey][emp.employeeId]
        : (isWeekendDefault ? "WO" : defShift.id);

      const workVal = store.roster[companyId]?.[dKey]?.[emp.employeeId] !== undefined
        ? store.roster[companyId][dKey][emp.employeeId]
        : baseVal;

      if (!publishedSnapshot[dKey]) publishedSnapshot[dKey] = {};

      if (workVal !== baseVal) {
        empDiffs.push({ dateKey: dKey, fromCode: baseVal, toCode: workVal });
        // In published snapshot, keep baseline until accepted
        publishedSnapshot[dKey][emp.employeeId] = baseVal;
      } else {
        publishedSnapshot[dKey][emp.employeeId] = workVal;
      }
    }

    if (empDiffs.length > 0) {
      employeesWithDiffs.push({
        emp,
        items: empDiffs
      });
    }
  }

  // Create ShiftChange proposals for each employee with differences
  const nowMs = Date.now();
  const windowMs = ACCEPT_WINDOW_HOURS * 3600 * 1000;

  for (const itemGroup of employeesWithDiffs) {
    const { emp, items } = itemGroup;
    items.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const firstDateKey = items[0].dateKey;

    const firstShiftObj = shiftsMap.get(items[0].toCode) || defShift;
    const firstStartStr = firstShiftObj.start || "09:00";
    const firstStartMs = new Date(`${firstDateKey}T${firstStartStr}:00+05:30`).getTime();
    const deadlineMs = Math.min(nowMs + windowMs, isNaN(firstStartMs) ? nowMs + windowMs : firstStartMs);
    const deadline = new Date(deadlineMs).toISOString();

    // Withdraw any older pending proposal overlapping the dates
    for (const chg of (store.changes || [])) {
      if (chg.origin === "hr" && chg.employeeId === emp.employeeId && chg.status === "Awaiting Employee") {
        const hasOverlap = chg.items.some(ci => items.some(ni => ni.dateKey === ci.dateKey));
        if (hasOverlap) {
          chg.status = "Withdrawn";
          if (!Array.isArray(chg.history)) chg.history = [];
          chg.history.push({
            at: new Date().toISOString(),
            by: viewer.name || "HR",
            role: "HR",
            action: "Withdrawn",
            detail: "Superseded by a new publish"
          });
        }
      }
    }

    const changeId = `CHG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newProposal = {
      id: changeId,
      origin: "hr",
      employeeId: emp.employeeId,
      name: emp.name,
      items,
      reason: (note || "").trim(),
      status: "Awaiting Employee",
      deadline,
      requestedBy: viewer.name || viewer.employeeId || "HR",
      createdAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
      remark: null,
      companyId,
      history: [
        {
          at: new Date().toISOString(),
          by: viewer.name || viewer.employeeId || "HR",
          role: "HR",
          action: "Proposed by HR",
          detail: (note || "").trim() || "Proposed roster update during week publish"
        }
      ]
    };

    if (!Array.isArray(store.changes)) store.changes = [];
    store.changes.unshift(newProposal);

    addNotificationInternal(store, {
      userId: emp.employeeId,
      companyId,
      text: `HR proposed ${items.length} change(s) to your roster for ${weekLabel}. Respond by ${formatDateTime(deadline)}.`,
      changeId
    });
  }

  store.weeks[companyId][weekStartKey] = {
    status: "published",
    published: publishedSnapshot,
    publishedBy: viewer.name || viewer.employeeId || "HR Administrator",
    publishedAt: new Date().toISOString()
  };

  saveStore(store);

  return {
    ok: true,
    requiresAcceptance: true,
    proposedChangesCount: employeesWithDiffs.length,
    totalItemsCount: employeesWithDiffs.reduce((acc, curr) => acc + curr.items.length, 0),
    warnings: inspect.warnings,
    publishedAt: store.weeks[companyId][weekStartKey].publishedAt
  };
}

// Responds to an HR roster proposal (Accept / Decline by employee)
export function respondToProposal(viewer, changeId, decision, remark = "") {
  if (!viewer) return { ok: false, error: "Please log in to respond." };

  const store = refreshExpiry();
  const chg = (store.changes || []).find(c => c.id === changeId);
  if (!chg) return { ok: false, error: "Proposal not found." };

  const viewerId = viewer.employeeId || viewer.id;
  if (chg.employeeId !== viewerId) {
    return { ok: false, error: "Unauthorized: you can only respond to your own roster proposals." };
  }

  if (chg.status !== "Awaiting Employee") {
    return { ok: false, error: `Proposal is already ${chg.status}.` };
  }

  // Validate deadline
  if (chg.deadline && Date.now() > new Date(chg.deadline).getTime()) {
    chg.status = "Expired";
    saveStore(store);
    return { ok: false, error: "Proposal has expired." };
  }

  // Validate notice days (first date must be >= tomorrow)
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const firstDate = (chg.items || [])[0]?.dateKey;
  if (firstDate && firstDate <= todayKey) {
    chg.status = "Expired";
    saveStore(store);
    return { ok: false, error: "Cannot respond: the scheduled start date has already arrived." };
  }

  if (decision === "accept") {
    chg.status = "Accepted";
    chg.decidedBy = viewer.name || viewerId;
    chg.decidedAt = new Date().toISOString();
    chg.history.push({
      at: new Date().toISOString(),
      by: viewer.name || viewerId,
      role: "Employee",
      action: "Accepted",
      detail: "Employee accepted proposed schedule"
    });

    applyChange(chg, store);

    addNotificationInternal(store, {
      userId: "HR",
      companyId: chg.companyId || "NEX-IND",
      text: `${viewer.name || viewerId} accepted the roster change.`,
      changeId: chg.id
    });

    saveStore(store);
    return { ok: true, change: chg };
  }

  if (decision === "decline") {
    const trimmed = (remark || "").trim();
    if (trimmed.length < 10 || trimmed.length > 200) {
      return { ok: false, error: "Please provide a reason between 10 and 200 characters." };
    }

    chg.status = "Declined";
    chg.remark = trimmed;
    chg.decidedBy = viewer.name || viewerId;
    chg.decidedAt = new Date().toISOString();
    chg.history.push({
      at: new Date().toISOString(),
      by: viewer.name || viewerId,
      role: "Employee",
      action: "Declined",
      detail: trimmed
    });

    addNotificationInternal(store, {
      userId: "HR",
      companyId: chg.companyId || "NEX-IND",
      text: `${viewer.name || viewerId} declined the roster change: "${trimmed}"`,
      changeId: chg.id
    });

    saveStore(store);
    return { ok: true, change: chg };
  }

  return { ok: false, error: "Invalid response decision." };
}

// Withdraws an HR proposal while in Awaiting Employee status
export function withdrawProposal(viewer, changeId) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR can withdraw proposals." };
  }
  const store = loadStore();
  const chg = (store.changes || []).find(c => c.id === changeId);
  if (!chg) return { ok: false, error: "Proposal not found." };

  if (chg.status !== "Awaiting Employee") {
    return { ok: false, error: `Cannot withdraw proposal in ${chg.status} status.` };
  }

  chg.status = "Withdrawn";
  chg.decidedBy = viewer.name || viewer.employeeId || "HR";
  chg.decidedAt = new Date().toISOString();
  chg.history.push({
    at: new Date().toISOString(),
    by: viewer.name || "HR",
    role: "HR",
    action: "Withdrawn",
    detail: "Proposal withdrawn by HR"
  });

  addNotificationInternal(store, {
    userId: chg.employeeId,
    companyId: chg.companyId || "NEX-IND",
    text: "HR withdrew the proposed roster changes.",
    changeId: chg.id
  });

  saveStore(store);
  return { ok: true, change: chg };
}

// HR Manager override: applies a Declined or Expired proposal with mandatory remark
export function overrideProposal(viewer, changeId, remark) {
  if (!isHrManagerRole(viewer)) {
    return { ok: false, error: "HR Manager approval required to override proposals." };
  }

  const trimmed = (remark || "").trim();
  if (trimmed.length < 10 || trimmed.length > 200) {
    return { ok: false, error: "Please provide an override remark between 10 and 200 characters." };
  }

  const store = loadStore();
  const chg = (store.changes || []).find(c => c.id === changeId);
  if (!chg) return { ok: false, error: "Proposal not found." };

  if (chg.status !== "Declined" && chg.status !== "Expired") {
    return { ok: false, error: `Only Declined or Expired proposals can be overridden (current: ${chg.status}).` };
  }

  chg.status = "Applied (override)";
  chg.decidedBy = viewer.name || viewer.employeeId || "HR Manager";
  chg.decidedAt = new Date().toISOString();
  chg.remark = trimmed;
  chg.handled = true;

  chg.history.push({
    at: new Date().toISOString(),
    by: viewer.name || "HR Manager",
    role: "HR Manager",
    action: "Applied (override)",
    detail: trimmed
  });

  applyChange(chg, store);

  addNotificationInternal(store, {
    userId: chg.employeeId,
    companyId: chg.companyId || "NEX-IND",
    text: `HR Manager applied the roster change: ${trimmed}`,
    changeId: chg.id
  });

  saveStore(store);
  return { ok: true, change: chg };
}

// Sends a reminder to the employee to respond to their awaiting proposal
export function remindEmployee(viewer, changeId) {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR can send reminders." };
  }
  const store = refreshExpiry();
  const chg = (store.changes || []).find(c => c.id === changeId);
  if (!chg) return { ok: false, error: "Proposal not found." };

  if (chg.status !== "Awaiting Employee") {
    return { ok: false, error: `Proposal is in ${chg.status} status.` };
  }

  if (chg.lastRemindedAt) {
    const elapsed = Date.now() - new Date(chg.lastRemindedAt).getTime();
    if (elapsed < 6 * 3600 * 1000) {
      return { ok: false, error: "A reminder was already sent within the last 6 hours." };
    }
  }

  chg.lastRemindedAt = new Date().toISOString();
  chg.history.push({
    at: new Date().toISOString(),
    by: viewer.name || "HR",
    role: "HR",
    action: "Reminded",
    detail: "Sent reminder to employee"
  });

  addNotificationInternal(store, {
    userId: chg.employeeId,
    companyId: chg.companyId || "NEX-IND",
    text: `Reminder: please respond to the roster change by ${formatDateTime(chg.deadline)}.`,
    changeId: chg.id
  });

  saveStore(store);
  return { ok: true };
}

// Creates an employee shift change request
export function createRequest(viewer, { dateKey, toCode, reason }) {
  if (!viewer) return { ok: false, error: "Please log in to submit a shift change request." };

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (!dateKey || dateKey <= todayKey) {
    return { ok: false, error: "Shift change request date must be tomorrow or later." };
  }

  const curMs = new Date(`${todayKey}T12:00:00+05:30`).getTime();
  const targetMs = new Date(`${dateKey}T12:00:00+05:30`).getTime();
  const diffDays = Math.round((targetMs - curMs) / (1000 * 60 * 60 * 24));
  if (diffDays > 60) {
    return { ok: false, error: "Shift change request cannot exceed 60 days in advance." };
  }

  const trimmedReason = (reason || "").trim();
  if (trimmedReason.length < 10 || trimmedReason.length > 200) {
    return { ok: false, error: "Please provide a reason between 10 and 200 characters." };
  }

  const employeeId = viewer.employeeId || viewer.id;
  const currentAssigned = getShiftForDay(employeeId, dateKey);
  const fromCode = currentAssigned.isWeekOff ? "WO" : (currentAssigned.shift?.id || currentAssigned.code);

  if (fromCode === toCode) {
    return { ok: false, error: "Requested shift is identical to your currently scheduled shift." };
  }

  const store = refreshExpiry();
  const companyId = getCompanyId(viewer);

  // Check existing Pending HR requests for this date
  const existingPending = (store.changes || []).find(r =>
    r.employeeId === employeeId &&
    r.origin === "employee" &&
    r.status === "Pending HR" &&
    Array.isArray(r.items) &&
    r.items.some(i => i.dateKey === dateKey)
  );

  if (existingPending) {
    return { ok: false, error: `You already have a pending shift change request for ${formatDateDisplay(dateKey)}.` };
  }

  const changeId = `CHG-${Date.now().toString(36).toUpperCase()}`;
  const newRequest = {
    id: changeId,
    origin: "employee",
    employeeId,
    name: viewer.name || employeeId,
    department: viewer.dept || "Engineering",
    items: [{
      dateKey,
      fromCode,
      toCode
    }],
    reason: trimmedReason,
    status: "Pending HR",
    deadline: null,
    requestedBy: viewer.name || employeeId,
    createdAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    remark: null,
    companyId,
    history: [{
      at: new Date().toISOString(),
      by: viewer.name || employeeId,
      role: "Employee",
      action: "Submitted Request",
      detail: trimmedReason
    }]
  };

  if (!Array.isArray(store.changes)) store.changes = [];
  store.changes.unshift(newRequest);

  addNotificationInternal(store, {
    userId: "HR",
    companyId,
    text: `${viewer.name || employeeId} requested a shift change for ${formatDateDisplay(dateKey)}.`,
    changeId
  });

  saveStore(store);
  return { ok: true, change: newRequest };
}

// Decides an employee shift change request (Approve / Reject) (HR / HR Manager only)
export function decideRequest(viewer, id, decision, remark = "") {
  if (!isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: only HR administrators can approve or reject requests." };
  }

  if (decision !== "approve" && decision !== "reject") {
    return { ok: false, error: "Decision must be 'approve' or 'reject'." };
  }

  const trimmedRemark = (remark || "").trim();
  if (decision === "reject" && (trimmedRemark.length < 10 || trimmedRemark.length > 200)) {
    return { ok: false, error: "A remark between 10 and 200 characters is required when rejecting a shift change request." };
  }

  const store = refreshExpiry();
  const chg = (store.changes || []).find(r => r.id === id);
  if (!chg) return { ok: false, error: "Request not found." };
  if (chg.status !== "Pending HR") return { ok: false, error: `Request is already ${chg.status}.` };

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const item = (chg.items || [])[0];
  if (item && item.dateKey <= todayKey) {
    return { ok: false, error: "Cannot decide: the request date has arrived or passed." };
  }

  if (decision === "approve") {
    chg.status = "Approved";
    chg.remark = trimmedRemark || "Approved by HR";
    chg.decidedBy = viewer.name || viewer.employeeId || "HR Administrator";
    chg.decidedAt = new Date().toISOString();

    chg.history.push({
      at: new Date().toISOString(),
      by: viewer.name || viewer.employeeId || "HR",
      role: "HR",
      action: "Approved",
      detail: trimmedRemark || "Approved by HR"
    });

    applyChange(chg, store);

    addNotificationInternal(store, {
      userId: chg.employeeId,
      companyId: chg.companyId || "NEX-IND",
      text: `Your shift change for ${formatDateDisplay(item.dateKey)} was approved and is now confirmed: ${item.fromCode} to ${item.toCode}.`,
      changeId: chg.id
    });
  } else {
    chg.status = "Rejected";
    chg.remark = trimmedRemark;
    chg.decidedBy = viewer.name || viewer.employeeId || "HR Administrator";
    chg.decidedAt = new Date().toISOString();

    chg.history.push({
      at: new Date().toISOString(),
      by: viewer.name || viewer.employeeId || "HR",
      role: "HR",
      action: "Rejected",
      detail: trimmedRemark
    });

    addNotificationInternal(store, {
      userId: chg.employeeId,
      companyId: chg.companyId || "NEX-IND",
      text: `Your shift change for ${formatDateDisplay(item.dateKey)} was rejected: "${trimmedRemark}".`,
      changeId: chg.id
    });
  }

  saveStore(store);
  return { ok: true, change: chg };
}

// Cancels a pending request by the employee
export function cancelRequest(viewer, id) {
  const store = refreshExpiry();
  const chg = (store.changes || []).find(r => r.id === id);
  if (!chg) return { ok: false, error: "Request not found." };

  const viewerId = viewer?.employeeId || viewer?.id;
  if (chg.employeeId !== viewerId && !isHrRole(viewer)) {
    return { ok: false, error: "Unauthorized: you can only cancel your own requests." };
  }
  if (chg.status !== "Pending HR") {
    return { ok: false, error: `Cannot cancel a request that is already ${chg.status}.` };
  }

  chg.status = "Cancelled";
  chg.history.push({
    at: new Date().toISOString(),
    by: viewer.name || viewerId,
    role: "Employee",
    action: "Cancelled",
    detail: "Cancelled by employee"
  });

  saveStore(store);
  return { ok: true, change: chg };
}

// Returns unified ShiftChanges filtered by role visibility and filters
export function getChanges(viewer, filters = {}) {
  const store = refreshExpiry();
  const isHR = isHrRole(viewer);
  const isMgr = isManagerRole(viewer);
  const companyId = getCompanyId(viewer);

  let list = (store.changes || []).filter(c => {
    const cCompany = c.companyId || (getEmployeeList().find(e => e.employeeId === c.employeeId)?.companyId) || "NEX-IND";
    return cCompany === companyId;
  });

  if (!isHR && !isMgr) {
    const myId = viewer?.employeeId || viewer?.id;
    list = list.filter(r => r.employeeId === myId);
  }

  if (filters.origin && filters.origin !== "all") {
    list = list.filter(c => c.origin === filters.origin);
  }

  if (filters.status && filters.status !== "all") {
    const s = filters.status.toLowerCase();
    if (s === "pending hr") {
      list = list.filter(c => c.status === "Pending HR");
    } else if (s === "awaiting employee") {
      list = list.filter(c => c.status === "Awaiting Employee");
    } else if (s === "accepted or approved") {
      list = list.filter(c => c.status === "Accepted" || c.status === "Approved" || c.status === "Applied (override)");
    } else if (s === "declined or rejected") {
      list = list.filter(c => c.status === "Declined" || c.status === "Rejected");
    } else if (s === "expired") {
      list = list.filter(c => c.status === "Expired");
    } else if (s === "withdrawn or cancelled") {
      list = list.filter(c => c.status === "Withdrawn" || c.status === "Cancelled");
    } else {
      list = list.filter(c => c.status.toLowerCase() === s);
    }
  }

  return list;
}

// Backward compatibility for getRequests
export const getRequests = getChanges;

// Returns the published shift configuration for an employee on a specific date (used by attendance)
export function getShiftForDay(employeeId, dateKey) {
  const store = loadStore();
  const employees = getEmployeeList();
  const targetEmp = employees.find(e => e.employeeId === employeeId);
  const companyId = targetEmp?.companyId || "NEX-IND";

  const shiftsList = (store.shifts[companyId] || DEFAULT_SHIFTS).map(s => enrichShift(s, dateKey));
  const shiftsMap = new Map();
  shiftsList.forEach(s => {
    shiftsMap.set(s.id, s);
    shiftsMap.set(s.code, s);
  });
  const defaultShift = shiftsList.find(s => s.isDefault && s.active) || shiftsList[0] || DEFAULT_SHIFTS[0];

  const weekStart = getMondayOfWeek(dateKey);
  const weekMeta = store.weeks?.[companyId]?.[weekStart];

  const d = new Date(`${dateKey}T12:00:00+05:30`);
  const isWeekendDefault = d.getDay() === 0 || d.getDay() === 6;

  let assignedVal = null;
  let source = "default";

  if (weekMeta?.published?.[dateKey]?.[employeeId] !== undefined) {
    assignedVal = weekMeta.published[dateKey][employeeId];
    source = "roster";
  } else if (!weekMeta) {
    // Week was never touched: default pattern as if published
    assignedVal = isWeekendDefault ? "WO" : defaultShift.id;
    source = "default";
  } else if (weekMeta.status === "draft" && !weekMeta.published) {
    // Draft with no previous publish: fallback to default pattern for attendance continuity
    assignedVal = isWeekendDefault ? "WO" : defaultShift.id;
    source = "default";
  }

  if (assignedVal === "WO") {
    return {
      shift: null,
      code: "WO",
      isWeekOff: true,
      source
    };
  }

  const shift = shiftsMap.get(assignedVal) || defaultShift;
  return {
    shift,
    code: shift.code,
    isWeekOff: false,
    source
  };
}

// Calculates coverage statistics (headcount per shift code and total working) across dates
export function getCoverage(viewer, startKey, endKey) {
  const grid = getRosterGrid(viewer, startKey, endKey, { forEdit: isHrRole(viewer) });
  const coverage = {};

  for (const dKey of grid.dateKeys) {
    coverage[dKey] = {
      counts: {},
      totalWorking: 0,
      totalOff: 0
    };
  }

  for (const row of grid.rows) {
    for (const dKey of grid.dateKeys) {
      const cell = row.cells[dKey];
      if (cell.isWeekOff || cell.code === "WO") {
        coverage[dKey].totalOff++;
      } else if (cell.onLeave) {
        coverage[dKey].counts["LV"] = (coverage[dKey].counts["LV"] || 0) + 1;
        coverage[dKey].totalOff++;
      } else {
        coverage[dKey].counts[cell.code] = (coverage[dKey].counts[cell.code] || 0) + 1;
        coverage[dKey].totalWorking++;
      }
    }
  }

  return coverage;
}
