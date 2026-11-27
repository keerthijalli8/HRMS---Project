import { employeeData } from '../data/mockData.js';
import { isHolidayDate, getHolidayByDate } from './holidayStore.js';
import { loadWfhRequests, loadAttendanceExceptions } from './wfoWfhStore.js';
import { loadApprovals } from './approvalStore.js';
import { getShiftForDay, formatTime12 } from './shiftService.js';

const STORAGE_KEY = "hrms_attendance_log_v1";
const EVENT_NAME = "hrms_attendance_updated";
const MIGRATION_FLAG_V2 = "hrms_attendance_migrated_v2";

// 9-hour shift = 8 hours work + 1 hour break; fallback default
export const SHIFT = { shiftMinutes: 540, breakAllowanceMinutes: 60, netMinutes: 480 };

// Returns the shift configuration assigned for that employee and day from the published roster
export function getShiftConfigFor(employeeId, dateKey = getTodayDateKey()) {
  if (!employeeId) {
    return {
      shiftMinutes: SHIFT.shiftMinutes,
      breakAllowanceMinutes: SHIFT.breakAllowanceMinutes,
      netMinutes: SHIFT.netMinutes,
      start: "09:00",
      end: "18:00",
      graceMinutes: 15,
      code: "GEN",
      name: "General",
      isWeekOff: false,
      start12: "09:00 AM",
      end12: "06:00 PM"
    };
  }

  try {
    const dayAssignment = getShiftForDay(employeeId, dateKey);
    if (!dayAssignment || dayAssignment.isWeekOff || !dayAssignment.shift) {
      return {
        shiftMinutes: SHIFT.shiftMinutes,
        breakAllowanceMinutes: SHIFT.breakAllowanceMinutes,
        netMinutes: SHIFT.netMinutes,
        start: "09:00",
        end: "18:00",
        graceMinutes: 15,
        code: dayAssignment?.code || "WO",
        name: dayAssignment?.isWeekOff ? "Week Off" : "General",
        isWeekOff: Boolean(dayAssignment?.isWeekOff),
        start12: "09:00 AM",
        end12: "06:00 PM"
      };
    }

    const s = dayAssignment.shift;
    return {
      shiftMinutes: s.durationMinutes || SHIFT.shiftMinutes,
      breakAllowanceMinutes: s.breakMinutes != null ? Number(s.breakMinutes) : SHIFT.breakAllowanceMinutes,
      netMinutes: s.netMinutes || SHIFT.netMinutes,
      start: s.start || "09:00",
      end: s.end || "18:00",
      graceMinutes: s.graceMinutes != null ? Number(s.graceMinutes) : 15,
      code: s.code || "GEN",
      name: s.name || "General",
      isWeekOff: false,
      start12: formatTime12(s.start || "09:00"),
      end12: formatTime12(s.end || "18:00")
    };
  } catch (e) {
    return {
      shiftMinutes: SHIFT.shiftMinutes,
      breakAllowanceMinutes: SHIFT.breakAllowanceMinutes,
      netMinutes: SHIFT.netMinutes,
      start: "09:00",
      end: "18:00",
      graceMinutes: 15,
      code: "GEN",
      name: "General",
      isWeekOff: false,
      start12: "09:00 AM",
      end12: "06:00 PM"
    };
  }
}

// Late login calculation: compares login against shift start + graceMinutes
export function getLateInfo(employeeId, dateKey, loginISO) {
  if (!employeeId || !dateKey || !loginISO) {
    return { late: false, minutes: 0, expectedStart: null };
  }

  try {
    const dayAssignment = getShiftForDay(employeeId, dateKey);
    if (!dayAssignment || dayAssignment.isWeekOff || !dayAssignment.shift) {
      return { late: false, minutes: 0, expectedStart: null };
    }

    // Return late false for week offs and for sample data of employees without a roster
    const interactiveAccounts = getInteractiveLoginAccountIds();
    const isInteractive = interactiveAccounts.has(employeeId);
    if (!isInteractive && dayAssignment.source === "default") {
      return { late: false, minutes: 0, expectedStart: null };
    }

    const s = dayAssignment.shift;
    const startStr = s.start || "09:00";
    const [sH, sM] = startStr.split(":").map(Number);
    const expectedStartMs = new Date(`${dateKey}T${String(sH).padStart(2, "0")}:${String(sM).padStart(2, "0")}:00+05:30`).getTime();
    const graceMinutes = Number(s.graceMinutes) || 0;
    const graceMs = graceMinutes * 60 * 1000;

    const loginMs = new Date(loginISO).getTime();
    if (isNaN(loginMs) || isNaN(expectedStartMs)) {
      return { late: false, minutes: 0, expectedStart: null };
    }

    // Late if login time is strictly after expectedStart + grace
    if (loginMs > (expectedStartMs + graceMs)) {
      const diffMs = loginMs - expectedStartMs;
      const minutes = Math.floor(diffMs / (60 * 1000));
      if (minutes > 0) {
        return {
          late: true,
          minutes,
          expectedStart: new Date(expectedStartMs).toISOString()
        };
      }
    }

    return {
      late: false,
      minutes: 0,
      expectedStart: new Date(expectedStartMs).toISOString()
    };
  } catch (e) {
    return { late: false, minutes: 0, expectedStart: null };
  }
}

// Returns the date key in YYYY-MM-DD for the Asia/Kolkata timezone
export function getTodayDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

import {
  formatTime,
  formatDuration,
  formatClock,
  formatDate,
  formatDisplayDate,
  formatHoursWorked,
  formatTimerHHMMSS
} from "../utils/format.js";

export {
  formatTime,
  formatDuration,
  formatClock,
  formatDate,
  formatDisplayDate,
  formatHoursWorked,
  formatTimerHHMMSS
};

// Computes derived shift and break metrics for a given day record and timestamp
export function getShiftMetrics(today, now = Date.now()) {
  let config = today?.shiftConfig;
  if (!config && today?.employeeId && today?.dateKey) {
    config = getShiftConfigFor(today.employeeId, today.dateKey);
  }
  const shiftMinutes = config?.shiftMinutes || SHIFT.shiftMinutes;
  const netMinutes = config?.netMinutes || SHIFT.netMinutes;
  const breakAllowanceMinutes = config?.breakAllowanceMinutes != null ? config.breakAllowanceMinutes : SHIFT.breakAllowanceMinutes;

  const shiftMs = shiftMinutes * 60 * 1000;
  const netTargetMs = netMinutes * 60 * 1000;
  const breakAllowanceMs = breakAllowanceMinutes * 60 * 1000;

  const firstInMs = today?.firstIn ? new Date(today.firstIn).getTime() : null;
  const expectedEnd = firstInMs ? new Date(firstInMs + shiftMs) : null;
  const grossMs = today?.grossMs || 0;
  const netMs = today?.netMs || 0;
  const breakMs = today?.breakMs || 0;

  const shiftProgress = Math.min(1, Math.max(0, grossMs / shiftMs));
  const netRemainingMs = Math.max(0, netTargetMs - netMs);
  const breakUsedMs = breakMs;
  const breakRemainingMs = Math.max(0, breakAllowanceMs - breakUsedMs);
  const breakExceededMs = Math.max(0, breakUsedMs - breakAllowanceMs);
  const shiftComplete = grossMs >= shiftMs && netMs >= netTargetMs;

  return {
    expectedEnd,
    shiftProgress,
    netRemainingMs,
    breakUsedMs,
    breakRemainingMs,
    breakExceededMs,
    shiftComplete,
    shiftMinutes,
    netMinutes,
    breakAllowanceMinutes
  };
}

// Checks if a given YYYY-MM-DD dateKey falls on a weekend (Saturday or Sunday)
export function isWeekendDate(dateKey) {
  if (!dateKey) return false;
  try {
    const d = new Date(`${dateKey}T12:00:00+05:30`);
    const dow = d.getDay();
    return dow === 0 || dow === 6; // Sunday or Saturday
  } catch (e) {
    return false;
  }
}

// Fast string hash helper for deterministic sample assignment per employee and date
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Returns all employees from employeeData plus active users from hrms_registered_users with employeeId, name, dept
export function getEmployeeList() {
  const employeesMap = new Map();

  // 1. Mock Data employees
  if (Array.isArray(employeeData)) {
    for (const emp of employeeData) {
      const id = emp.id || emp.employeeId;
      if (id) {
        employeesMap.set(id, {
          id,
          employeeId: id,
          name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || id,
          dept: emp.dept || emp.department || "General",
          role: emp.role || emp.designation || "Employee",
          companyId: emp.companyId || "NEX-IND",
          avatarUrl: emp.avatarUrl || emp.photoUrl || null
        });
      }
    }
  }

  // 2. Custom & Added employees from employee store
  try {
    const raw = localStorage.getItem("hrms_employees_v1");
    if (raw) {
      const storedEmployees = JSON.parse(raw);
      if (Array.isArray(storedEmployees)) {
        for (const emp of storedEmployees) {
          const id = emp.id || emp.employeeId;
          if (id) {
            employeesMap.set(id, {
              id,
              employeeId: id,
              name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || id,
              dept: emp.dept || emp.department || "General",
              role: emp.role || emp.designation || "Employee",
              companyId: emp.companyId || "NEX-IND",
              avatarUrl: emp.avatarUrl || emp.photoUrl || null
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error reading hrms_employees_v1:", err);
  }

  // 3. Registered users
  try {
    const raw = localStorage.getItem("hrms_registered_users");
    if (raw) {
      const registered = JSON.parse(raw);
      if (Array.isArray(registered)) {
        for (const user of registered) {
          const status = (user.accessStatus || "active").toLowerCase();
          if (status === "active") {
            const id = user.employeeId || user.id;
            if (id && !employeesMap.has(id)) {
              employeesMap.set(id, {
                id,
                employeeId: id,
                name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || id,
                dept: user.dept || user.department || "General",
                role: user.role || user.designation || "Employee",
                companyId: user.companyId || "NEX-IND",
                avatarUrl: user.avatarUrl || user.photoUrl || null
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error reading hrms_registered_users:", err);
  }

  return Array.from(employeesMap.values());
}

export const getAllEmployees = getEmployeeList;

// Returns set of employee IDs that represent actual interactive login accounts
function getInteractiveLoginAccountIds() {
  const ids = new Set(["EMP-1088", "EMP-1042", "EMP-1001", "EMP-2001"]);
  try {
    const raw = localStorage.getItem("hrms_registered_users");
    if (raw) {
      const registered = JSON.parse(raw);
      if (Array.isArray(registered)) {
        for (const u of registered) {
          const id = u.employeeId || u.id;
          if (id) ids.add(id);
        }
      }
    }
  } catch (e) {}
  return ids;
}

// DEMO SAMPLE DATA: Generates deterministic sample attendance records on the fly (NOT stored)
function generateSampleRecords(unrecordedEmployees, dateKey, nowTimestamp) {
  if (!Array.isArray(unrecordedEmployees) || unrecordedEmployees.length === 0) {
    return {};
  }

  const nowDate = nowTimestamp instanceof Date ? nowTimestamp : new Date(nowTimestamp || Date.now());
  const todayKey = getTodayDateKey(nowDate);

  // Strictly no future attendance or punches
  if (dateKey > todayKey) {
    return {};
  }

  // Weekends and official company holidays do not have scheduled punches
  if (isWeekendDate(dateKey) || isHolidayDate(dateKey)) {
    return {};
  }
  const isToday = dateKey === todayKey;

  // Filter out employees with login accounts for TODAY so they must punch explicitly
  const loginAccountIds = getInteractiveLoginAccountIds();
  const candidates = isToday
    ? unrecordedEmployees.filter(emp => !loginAccountIds.has(emp.employeeId))
    : unrecordedEmployees;

  // Rank unrecorded employees deterministically by employeeId + dateKey hash
  const scored = candidates.map(emp => ({
    emp,
    score: hashString(`${emp.employeeId}:${dateKey}`)
  })).sort((a, b) => a.score - b.score);

  const n = scored.length;
  const absentCount = n >= 6 ? Math.max(1, Math.round(n * 0.15)) : 0;
  const wfhCount = n >= 6 ? Math.max(1, Math.round(n * 0.15)) : (n >= 3 ? 1 : 0);

  const sampleStore = {};

  scored.forEach((item, idx) => {
    // Absent employees get no record on this date
    if (idx < absentCount) {
      return;
    }

    const isWfh = idx < (absentCount + wfhCount);
    const mode = isWfh ? "wfh" : "office";
    const h = item.score;

    // Login time between 08:50 AM and 09:50 AM
    const minOffset = h % 61;
    let inHour = 8;
    let inMin = 50 + minOffset;
    if (inMin >= 60) {
      inHour = 9;
      inMin -= 60;
    }
    const inIso = new Date(`${dateKey}T${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:00+05:30`).toISOString();

    let outIso = null;
    let lastSeenIso = inIso;

    if (isToday) {
      const today6pmMs = new Date(`${dateKey}T18:00:00+05:30`).getTime();
      if (nowDate.getTime() >= today6pmMs) {
        const outMinOffset = h % 76;
        const scheduledOutMs = today6pmMs + (outMinOffset * 60 * 1000);
        if (nowDate.getTime() >= scheduledOutMs) {
          outIso = new Date(scheduledOutMs).toISOString();
          lastSeenIso = outIso;
        } else {
          lastSeenIso = nowDate.toISOString();
        }
      } else {
        outIso = null;
        lastSeenIso = nowDate.toISOString();
      }
    } else {
      const pastStartMs = new Date(`${dateKey}T17:45:00+05:30`).getTime();
      const outMinOffset = h % 76;
      const scheduledOutMs = pastStartMs + (outMinOffset * 60 * 1000);
      outIso = new Date(scheduledOutMs).toISOString();
      lastSeenIso = outIso;
    }

    // Lunch break: 30 to 60 minutes
    const lunchStartOffset = h % 46;
    const lunchStartMs = new Date(`${dateKey}T12:45:00+05:30`).getTime() + (lunchStartOffset * 60 * 1000);
    const lunchDurationMin = 30 + ((h >> 3) % 31);
    const lunchEndMs = lunchStartMs + (lunchDurationMin * 60 * 1000);

    const breaks = [];
    if (!isToday || nowDate.getTime() >= lunchEndMs) {
      breaks.push({
        start: new Date(lunchStartMs).toISOString(),
        end: new Date(lunchEndMs).toISOString()
      });
    }

    // Tea break for even hashes
    if (h % 2 === 0) {
      const teaStartOffset = (h >> 5) % 46;
      const teaStartMs = new Date(`${dateKey}T16:00:00+05:30`).getTime() + (teaStartOffset * 60 * 1000);
      const teaDurationMin = 10 + ((h >> 7) % 11);
      const teaEndMs = teaStartMs + (teaDurationMin * 60 * 1000);

      if (!isToday || nowDate.getTime() >= teaEndMs) {
        breaks.push({
          start: new Date(teaStartMs).toISOString(),
          end: new Date(teaEndMs).toISOString()
        });
      }
    }

    const locLabel = mode === "wfh" ? "Remote (WFH)" : "Office, Hyderabad";
    const sampleInLoc = {
      shared: true,
      label: locLabel,
      lat: 17.4483,
      lon: 78.3742,
      accuracy: 15
    };
    const sampleOutLoc = outIso ? {
      shared: true,
      label: locLabel,
      lat: 17.4483,
      lon: 78.3742,
      accuracy: 15
    } : null;

    const isOffice = mode === "office";
    const workMode = isOffice ? "WFO" : "WFH";
    const verificationStatus = isOffice ? "Verified (GPS + Corporate Wi-Fi)" : "Remote (Approved)";
    const approvalStatus = "Approved";
    const source = "Web Portal";

    sampleStore[item.emp.employeeId] = {
      name: item.emp.name,
      dept: item.emp.dept,
      mode,
      workMode,
      verificationStatus,
      approvalStatus,
      source,
      inLoc: sampleInLoc,
      outLoc: sampleOutLoc,
      sessions: [
        {
          in: inIso,
          out: outIso,
          lastSeen: lastSeenIso,
          src: "punch",
          workMode,
          verificationStatus,
          approvalStatus,
          inLoc: sampleInLoc,
          outLoc: sampleOutLoc
        }
      ],
      breaks
    };
  });

  return sampleStore;
}

// Loads real attendance log data stored in localStorage
export function loadAttendanceStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        autoClosePastSessions(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading attendance log store:", e);
  }
  return {};
}

// Auto-closes any past days' unclosed sessions at midnight Asia/Kolkata
function autoClosePastSessions(store) {
  if (!store || typeof store !== "object") return;
  const todayKey = getTodayDateKey();
  let changed = false;

  Object.keys(store).forEach(dateKey => {
    if (dateKey < todayKey) {
      const dayRec = store[dateKey];
      if (dayRec && typeof dayRec === "object") {
        Object.keys(dayRec).forEach(empId => {
          const rec = dayRec[empId];
          if (rec && Array.isArray(rec.sessions)) {
            rec.sessions.forEach(s => {
              if (s.out === null) {
                s.out = `${dateKey}T23:59:59+05:30`;
                s.status = "Missed Check Out";
                s.earlyOut = false;
                rec.status = "Missed Check Out";
                changed = true;
              }
            });
            if (Array.isArray(rec.breaks)) {
              rec.breaks.forEach(b => {
                if (b.end === null) {
                  b.end = `${dateKey}T23:59:59+05:30`;
                  changed = true;
                }
              });
            }
          }
        });
      }
    }
  });

  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {}
  }
}

// Saves real attendance store data to localStorage
export function saveAttendanceStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("Error writing attendance log store:", e);
  }
}

// Broadcasts an update event so active views re-render smoothly
function notifyAttendanceUpdated(dateKey) {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { dateKey } }));
    } catch (e) {}
  }
}

// Subscribes to attendance log updates across tabs and within the window
export function subscribeAttendanceStore(callback) {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = (e) => {
    callback(e?.detail?.dateKey || getTodayDateKey());
  };

  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getTodayDateKey());
    }
  };

  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleUpdate);
    window.removeEventListener("storage", handleStorage);
  };
}

// Migration v2: removes legacy auto-tracked sessions dated TODAY on initial load
export function runMigrationV2() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_V2)) return;
    const todayKey = getTodayDateKey();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const store = JSON.parse(raw);
      if (store && store[todayKey]) {
        for (const empId of Object.keys(store[todayKey])) {
          const empRec = store[todayKey][empId];
          if (empRec && Array.isArray(empRec.sessions)) {
            empRec.sessions = empRec.sessions.filter(s => s.src === "punch");
            if (empRec.sessions.length === 0) {
              delete store[todayKey][empId];
            }
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      }
    }
    localStorage.setItem(MIGRATION_FLAG_V2, "true");
  } catch (err) {
    console.error("Attendance migration v2 error:", err);
  }
}
runMigrationV2();

// Returns real stored attendance records mapped by employeeId for the given day key
export function getDayRecords(dateKey) {
  try {
    const store = loadAttendanceStore();
    return store[dateKey] || {};
  } catch (err) {
    console.error("getDayRecords error:", err);
    return {};
  }
}

// Merges real records from localStorage with deterministic sample records for unrecorded employees (real data always wins)
export function getEffectiveDayRecords(dateKey, nowTimestamp = Date.now()) {
  const todayKey = getTodayDateKey();
  // Strictly no future attendance records
  if (dateKey > todayKey) {
    return {};
  }

  const realRecords = getDayRecords(dateKey);
  const isWeekend = isWeekendDate(dateKey);
  const isHoliday = isHolidayDate(dateKey);

  // Weekends and official holidays are never counted as working absence
  if (isWeekend || isHoliday) {
    return { ...realRecords };
  }

  const allEmployees = getEmployeeList();
  const unrecordedEmployees = allEmployees.filter(emp => !realRecords[emp.employeeId]);
  const sampleRecords = generateSampleRecords(unrecordedEmployees, dateKey, nowTimestamp);

  return {
    ...sampleRecords,
    ...realRecords
  };
}

// Summarizes an employee's sessions and breaks into mode, grossMs, breakMs, netMs, onBreak, and status
export function summarize(record, now = Date.now()) {
  if (!record || !Array.isArray(record.sessions) || record.sessions.length === 0) {
    return {
      firstLogin: null,
      lastLogout: null,
      totalMs: 0,
      grossMs: 0,
      netMs: 0,
      status: "Not logged in",
      mode: "office",
      breaks: [],
      breakCount: 0,
      breakMs: 0,
      onBreak: false,
      inLoc: null,
      outLoc: null,
      isMissedCheckout: false
    };
  }

  const nowDate = now instanceof Date ? now : new Date(now);
  const todayKey = getTodayDateKey(nowDate);

  const firstLogin = record.sessions[0].in;
  const inLoc = record.sessions[0].inLoc || record.inLoc || null;
  const lastClosedSession = [...record.sessions].reverse().find(s => s.out !== null);
  const outLoc = lastClosedSession?.outLoc || record.outLoc || null;

  // Check if session is from a past day
  const recordDay = new Date(firstLogin).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const isPastDay = recordDay < todayKey;
  const hasOpenSession = record.sessions.some(s => s.out === null);

  // For a PAST day with an open session and no check-out, return status "Missed check-out" and hours "--"
  if (isPastDay && hasOpenSession) {
    return {
      firstLogin,
      lastLogout: null,
      totalMs: 0,
      grossMs: 0,
      netMs: 0,
      hoursFormatted: "--",
      status: "Missed check-out",
      mode: record.mode === "wfh" ? "wfh" : "office",
      breaks: record.breaks || [],
      breakCount: (record.breaks || []).length,
      breakMs: 0,
      onBreak: false,
      inLoc,
      outLoc: null,
      isMissedCheckout: true
    };
  }

  let totalMs = 0;
  let hasOpenSessionToday = false;

  for (const session of record.sessions) {
    const inTime = new Date(session.in).getTime();
    if (session.out) {
      const outTime = new Date(session.out).getTime();
      totalMs += Math.max(0, outTime - inTime);
    } else {
      hasOpenSessionToday = true;
      totalMs += Math.max(0, nowDate.getTime() - inTime);
    }
  }

  // Calculate breaks
  const rawBreaks = Array.isArray(record.breaks) ? record.breaks : [];
  let breakMs = 0;
  let onBreak = false;
  const processedBreaks = [];

  for (const brk of rawBreaks) {
    const startMs = new Date(brk.start).getTime();
    let endMs;
    let isOngoing = false;

    if (brk.end) {
      endMs = new Date(brk.end).getTime();
    } else {
      endMs = nowDate.getTime();
      onBreak = true;
      isOngoing = true;
    }

    const durationMs = Math.max(0, endMs - startMs);
    breakMs += durationMs;
    processedBreaks.push({
      start: brk.start,
      end: brk.end,
      ongoing: isOngoing,
      ms: durationMs
    });
  }

  const grossMs = totalMs;
  const netMs = Math.max(0, grossMs - breakMs);

  let lastLogout = null;
  let status = "Completed";

  if (hasOpenSessionToday) {
    status = "Active";
    lastLogout = null;
  } else {
    status = "Completed";
    lastLogout = lastClosedSession?.out || null;
  }

  return {
    firstLogin,
    lastLogout,
    totalMs: grossMs,
    grossMs,
    netMs,
    status,
    mode: record.mode === "wfh" ? "wfh" : "office",
    breaks: processedBreaks,
    breakCount: rawBreaks.length,
    breakMs,
    onBreak,
    inLoc,
    outLoc,
    earlyOut: Boolean(lastClosedSession?.earlyOut),
    isMissedCheckout: false
  };
}

// Checks if the user has an HR, HR Manager or Manager role to view all employee records
export function canViewAllAttendance(user) {
  if (!user) return false;
  const sysRole = (user.systemRole || user.role || "").trim().toLowerCase();
  return (
    sysRole === "hr" ||
    sysRole === "hr manager" ||
    sysRole === "manager" ||
    sysRole.includes("hr") ||
    sysRole.includes("manager") ||
    sysRole.includes("admin")
  );
}

// Returns categorized attendance and break report datasets using merged effective day records
export function getAttendanceReportData(dateKey, currentUser, now = Date.now()) {
  const allEmployees = getEmployeeList();
  const effectiveRecords = getEffectiveDayRecords(dateKey, now);
  const isWeekend = isWeekendDate(dateKey);
  const isHoliday = isHolidayDate(dateKey);
  const holidayInfo = isHoliday ? getHolidayByDate(dateKey) : null;

  // Attendance Desk displays the enterprise workforce roster
  const visibleEmployees = allEmployees;

  const presentRows = [];
  const wfhRows = [];
  const absentRows = [];
  const breakRows = [];

  visibleEmployees.forEach(emp => {
    const record = effectiveRecords[emp.employeeId];
    const summary = summarize(record, now);
    const hasRecord = !!record && Array.isArray(record.sessions) && record.sessions.length > 0;

    if (hasRecord) {
      const isMissed = summary.status === "Missed check-out";
      const isWfh = summary.mode === "wfh";
      const rowItem = {
        id: emp.employeeId,
        employeeId: emp.employeeId,
        name: record?.name || emp.name,
        dept: emp.dept,
        role: emp.role || record?.role || "Employee",
        avatarUrl: emp.avatarUrl || null,
        firstLogin: summary.firstLogin,
        lastLogout: summary.lastLogout,
        loginTimeFormatted: formatTime(summary.firstLogin),
        logoutTimeFormatted: isMissed ? "--" : formatTime(summary.lastLogout),
        grossMs: summary.grossMs,
        totalMs: summary.grossMs,
        netMs: summary.netMs,
        hoursWorkedFormatted: isMissed ? "--" : (summary.firstLogin ? formatHoursWorked(summary.grossMs) : "--"),
        netHoursFormatted: isMissed ? "--" : (summary.firstLogin ? formatHoursWorked(summary.netMs) : "--"),
        status: summary.status,
        mode: summary.mode,
        workMode: record?.workMode || (isWfh ? "WFH" : "WFO"),
        verificationStatus: record?.verificationStatus || (isWfh ? "Remote (Approved)" : "Verified (Office Geofence & Wi-Fi)"),
        approvalStatus: record?.approvalStatus || (isWfh ? "Approved" : "Approved"),
        source: record?.source || "Web Portal",
        onBreak: summary.onBreak,
        breakCount: summary.breakCount,
        breakMs: summary.breakMs,
        totalBreakFormatted: formatDuration(summary.breakMs),
        breaks: summary.breaks,
        inLoc: summary.inLoc,
        outLoc: summary.outLoc,
        inWifi: record?.inWifi || null
      };

      if (summary.mode === "wfh") {
        wfhRows.push(rowItem);
      } else {
        presentRows.push(rowItem);
      }

      if (summary.breakCount > 0) {
        breakRows.push(rowItem);
      }
    } else {
      if (!isWeekend && !isHoliday) {
        absentRows.push({
          id: emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.name,
          dept: emp.dept,
          role: emp.role || "Employee",
          avatarUrl: emp.avatarUrl || null,
          workMode: "--",
          verificationStatus: "Unverified",
          approvalStatus: "Not Checked In",
          source: "--",
          remark: "No login recorded"
        });
      }
    }
  });

  const sortByLogin = (a, b) => {
    const aTime = a.firstLogin ? new Date(a.firstLogin).getTime() : 0;
    const bTime = b.firstLogin ? new Date(b.firstLogin).getTime() : 0;
    return aTime - bTime;
  };
  presentRows.sort(sortByLogin);
  wfhRows.sort(sortByLogin);
  absentRows.sort((a, b) => a.id.localeCompare(b.id));

  breakRows.sort((a, b) => b.breakMs - a.breakMs);

  let presentOfficeCount = 0;
  let presentWfhCount = 0;
  let totalAbsentCount = 0;

  allEmployees.forEach(emp => {
    const rec = effectiveRecords[emp.employeeId];
    if (rec && rec.mode === "wfh") {
      presentWfhCount++;
    } else if (rec) {
      presentOfficeCount++;
    } else if (!isWeekend && !isHoliday) {
      totalAbsentCount++;
    }
  });

  const allWfhRequests = loadWfhRequests();
  const allExceptions = loadAttendanceExceptions();
  const pendingWfhCount = allWfhRequests.filter(r => r.status === "Pending").length;
  const exceptionCount = allExceptions.filter(e => e.status === "Pending").length;
  const notCheckedInCount = isWeekend || isHoliday ? 0 : Math.max(0, allEmployees.length - presentOfficeCount - presentWfhCount);

  return {
    presentRows,
    wfhRows,
    absentRows,
    breakRows,
    totalEmployeesCount: allEmployees.length,
    presentOfficeCount,
    presentWfhCount,
    wfoCount: presentOfficeCount,
    wfhCount: presentWfhCount,
    pendingWfhCount,
    notCheckedInCount,
    exceptionCount,
    totalAbsentCount,
    isWeekend,
    isHoliday,
    holidayInfo
  };
}

// ---------------- EXPLICIT PUNCH ATTENDANCE FUNCTIONS ----------------

// Punch in for work today: only allowed when there is no open session today
export function checkIn(user, {
  mode = "office",
  location = null,
  wifiInfo = null,
  verificationStatus = null,
  approvalStatus = null,
  source = "Web Check-in"
} = {}) {
  const empId = user?.employeeId || user?.id;
  if (!empId) return { ok: false, error: "Employee ID missing" };

  const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Employee";
  const dept = user.dept || user.department || "General";
  const todayKey = getTodayDateKey();

  try {
    const store = loadAttendanceStore();
    if (!store[todayKey]) {
      store[todayKey] = {};
    }
    if (!store[todayKey][empId]) {
      store[todayKey][empId] = {
        name,
        dept,
        mode: mode === "wfh" ? "wfh" : "office",
        workMode: mode === "wfh" ? "WFH" : "WFO",
        sessions: [],
        breaks: []
      };
    }

    const record = store[todayKey][empId];
    if (!Array.isArray(record.sessions)) record.sessions = [];
    if (!Array.isArray(record.breaks)) record.breaks = [];

    // Guard 1: One session per day - cannot check in again if already checked out today
    const hasCheckedOutToday = record.sessions.some(s => s.out !== null);
    if (hasCheckedOutToday) {
      return { ok: false, error: "You have already checked out today. You can check in again tomorrow." };
    }

    // Guard 2: only when there is no open session today
    const openSession = record.sessions.find(s => s.out === null);
    if (openSession) {
      return { ok: false, error: "Already checked in today. Active session in progress." };
    }

    const nowIso = new Date().toISOString();
    const nowDate = new Date(nowIso);

    // Office timing threshold: 09:30 AM in Asia/Kolkata
    let isLate = false;
    try {
      const kolkataHours = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(nowDate), 10);
      const kolkataMinutes = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", minute: "numeric" }).format(nowDate), 10);
      isLate = (kolkataHours > 9) || (kolkataHours === 9 && kolkataMinutes > 30);
    } catch (e) {
      isLate = false;
    }
    const computedStatus = isLate ? "Late" : "Present";

    record.mode = mode === "wfh" ? "wfh" : "office";
    record.workMode = mode === "wfh" ? "WFH" : "WFO";
    record.verificationStatus = location?.shared
      ? "GPS location captured"
      : (mode === "wfh" ? "Remote Location" : "Location not shared");
    record.status = computedStatus;
    record.approvalStatus = approvalStatus || (isLate ? "Late" : "Approved");
    record.source = "Web Check-in";

    const loc = location || { shared: false, label: "Location not shared" };
    const newSession = {
      in: nowIso,
      out: null,
      src: "punch",
      inLoc: loc,
      outLoc: null,
      earlyOut: false,
      mode: record.mode,
      workMode: record.workMode,
      verificationStatus: record.verificationStatus,
      status: computedStatus,
      approvalStatus: record.approvalStatus,
      inWifi: wifiInfo || null,
      lastSeen: nowIso
    };

    record.sessions.push(newSession);
    record.inLoc = loc;
    record.inWifi = wifiInfo || null;

    saveAttendanceStore(store);
    notifyAttendanceUpdated(todayKey);

    return {
      ok: true,
      session: newSession,
      time: formatTime(nowIso),
      status: computedStatus,
      isLate
    };
  } catch (err) {
    console.error("checkIn error:", err);
    return { ok: false, error: "Failed to record check in" };
  }
}

// Punch out from work today: only allowed when there is an open session and no open break; stores earlyOut & earlyReason
export function checkOut(user, {
  location = null,
  early = false,
  reason = null,
  category = null,
  source = "Web Check-in"
} = {}) {
  const empId = user?.employeeId || user?.id;
  if (!empId) return { ok: false, error: "Employee ID missing" };

  const todayKey = getTodayDateKey();

  try {
    const store = loadAttendanceStore();
    const record = store[todayKey]?.[empId];
    if (!record || !Array.isArray(record.sessions) || record.sessions.length === 0) {
      return { ok: false, error: "No active check-in session found today" };
    }

    // If user is currently on break, automatically conclude the break before check out
    const openBreak = (record.breaks || []).find(b => b.end === null);
    if (openBreak) {
      openBreak.end = new Date().toISOString();
    }

    // Guard: only allowed when there is an open session
    const openSession = record.sessions.find(s => s.out === null);
    if (!openSession) {
      return { ok: false, error: "No active check-in session found" };
    }

    const nowIso = new Date().toISOString();
    const loc = location || { shared: false, label: "Location not shared" };
    openSession.out = nowIso;
    openSession.outLoc = loc;
    openSession.earlyOut = Boolean(early);
    openSession.earlyReason = reason || null;
    openSession.earlyCategory = category || null;
    openSession.reason = reason || null;
    openSession.outSrc = "punch";
    openSession.lastSeen = nowIso;
    record.outLoc = loc;
    record.status = early ? "Early Out" : "Checked Out";
    record.earlyReason = reason || null;
    record.earlyCategory = category || null;
    record.reason = reason || null;

    // Recompute total gross, breaks, and net working duration
    const summary = summarize(record, Date.now());
    record.grossMs = summary.grossMs;
    record.netMs = summary.netMs;
    record.breakMs = summary.breakMs;
    record.hoursWorkedFormatted = formatHoursWorked(summary.netMs);

    saveAttendanceStore(store);
    notifyAttendanceUpdated(todayKey);

    return {
      ok: true,
      time: formatTime(nowIso),
      hoursWorkedFormatted: formatHoursWorked(summary.netMs),
      netMs: summary.netMs,
      grossHoursFormatted: formatHoursWorked(summary.grossMs),
      breakHoursFormatted: formatDuration(summary.breakMs),
      earlyOut: Boolean(early)
    };
  } catch (err) {
    console.error("checkOut error:", err);
    return { ok: false, error: "Failed to record check out" };
  }
}

// Pause working session and initiate a timed break: only allowed with an open session; blocked while break is open
export function startBreak(user) {
  const empId = user?.employeeId || user?.id;
  if (!empId) return { ok: false, error: "Employee ID missing" };

  const todayKey = getTodayDateKey();

  try {
    const store = loadAttendanceStore();
    const record = store[todayKey]?.[empId];
    if (!record || !Array.isArray(record.sessions)) {
      return { ok: false, error: "Must be checked in to start a break" };
    }

    // Guard: only allowed with an open session
    const openSession = record.sessions.find(s => s.out === null);
    if (!openSession) {
      return { ok: false, error: "Must be checked in to start a break" };
    }

    if (!Array.isArray(record.breaks)) record.breaks = [];
    // Guard: blocked while a break is open
    const openBreak = record.breaks.find(b => b.end === null);
    if (openBreak) {
      return { ok: false, error: "Break already in progress" };
    }

    const nowIso = new Date().toISOString();
    record.breaks.push({
      start: nowIso,
      end: null
    });

    saveAttendanceStore(store);
    notifyAttendanceUpdated(todayKey);

    return { ok: true, time: formatTime(nowIso) };
  } catch (err) {
    console.error("startBreak error:", err);
    return { ok: false, error: "Failed to start break" };
  }
}

// Conclude the currently ongoing break: only allowed with an open session and an open break
export function endBreak(user) {
  const empId = user?.employeeId || user?.id;
  if (!empId) return { ok: false, error: "Employee ID missing" };

  const todayKey = getTodayDateKey();

  try {
    const store = loadAttendanceStore();
    const record = store[todayKey]?.[empId];
    if (!record || !Array.isArray(record.breaks)) {
      return { ok: false, error: "No open break found" };
    }

    // Guard: only allowed with an open session
    const openSession = (record.sessions || []).find(s => s.out === null);
    if (!openSession) {
      return { ok: false, error: "No active working session found" };
    }

    // Guard: must have an open break
    const openBreak = record.breaks.find(b => b.end === null);
    if (!openBreak) {
      return { ok: false, error: "No open break found" };
    }

    const nowIso = new Date().toISOString();
    openBreak.end = nowIso;

    saveAttendanceStore(store);
    notifyAttendanceUpdated(todayKey);

    return { ok: true, time: formatTime(nowIso) };
  } catch (err) {
    console.error("endBreak error:", err);
    return { ok: false, error: "Failed to end break" };
  }
}

// Returns comprehensive today attendance state, timestamps, locations, and durations computed from Date.now()
export function getMyToday(user, now = Date.now()) {
  const empId = user?.employeeId || user?.id;
  const todayKey = getTodayDateKey();
  const shiftConfig = getShiftConfigFor(empId, todayKey);

  if (!empId) {
    return {
      employeeId: null,
      dateKey: todayKey,
      shiftConfig,
      lateInfo: { late: false, minutes: 0, expectedStart: null },
      lateMinutes: 0,
      state: "not_checked_in",
      firstIn: null,
      firstInFormatted: "--",
      lastOut: null,
      lastOutFormatted: "--",
      mode: "office",
      workMode: "WFO",
      verificationStatus: "Not Verified",
      approvalStatus: "None",
      source: "Web Check-in",
      sessions: [],
      breaks: [],
      breakCount: 0,
      breakMs: 0,
      grossMs: 0,
      netMs: 0,
      inLoc: null,
      outLoc: null,
      openBreakStart: null,
      missedYesterday: false,
      earlyOut: false
    };
  }

  const store = loadAttendanceStore();
  const record = store[todayKey]?.[empId];

  // Check if yesterday had an unclosed session
  const d = new Date(`${todayKey}T12:00:00+05:30`);
  d.setDate(d.getDate() - 1);
  const yesterdayKey = getTodayDateKey(d);
  const yestRecord = store[yesterdayKey]?.[empId];
  const missedYesterday = !!(
    yestRecord &&
    Array.isArray(yestRecord.sessions) &&
    yestRecord.sessions.some(s => s.out === null)
  );

  if (!record || !Array.isArray(record.sessions) || record.sessions.length === 0) {
    return {
      employeeId: empId,
      dateKey: todayKey,
      shiftConfig,
      lateInfo: { late: false, minutes: 0, expectedStart: null },
      lateMinutes: 0,
      state: "not_checked_in",
      firstIn: null,
      firstInFormatted: "--",
      lastOut: null,
      lastOutFormatted: "--",
      mode: record?.mode || "office",
      workMode: record?.workMode || (record?.mode === "wfh" ? "WFH" : "WFO"),
      verificationStatus: "Not Verified",
      approvalStatus: "None",
      source: "Web Check-in",
      sessions: [],
      breaks: [],
      breakCount: 0,
      breakMs: 0,
      grossMs: 0,
      netMs: 0,
      inLoc: null,
      outLoc: null,
      openBreakStart: null,
      missedYesterday,
      earlyOut: false
    };
  }

  const sessions = record.sessions;
  const breaks = Array.isArray(record.breaks) ? record.breaks : [];
  const mode = record.mode === "wfh" ? "wfh" : "office";
  const workMode = record.workMode || (mode === "wfh" ? "WFH" : "WFO");
  const approvalStatus = record.approvalStatus || "Approved";
  const source = record.source || "Web Check-in";

  const firstIn = sessions[0]?.in || null;
  const firstInFormatted = firstIn ? formatTime(firstIn) : "--";
  const inLoc = sessions[0]?.inLoc || record.inLoc || null;
  const lateInfo = firstIn ? getLateInfo(empId, todayKey, firstIn) : { late: false, minutes: 0, expectedStart: null };
  const lateMinutes = lateInfo.late ? lateInfo.minutes : 0;

  const openSession = sessions.find(s => s.out === null);
  const openBreak = breaks.find(b => b.end === null);

  const closedSessions = sessions.filter(s => s.out !== null);
  const lastClosed = closedSessions.length > 0 ? closedSessions[closedSessions.length - 1] : null;
  const lastOut = lastClosed ? lastClosed.out : null;
  const lastOutFormatted = lastOut ? formatTime(lastOut) : "--";
  const outLoc = lastClosed ? lastClosed.outLoc : (record.outLoc || null);
  const earlyOut = Boolean(lastClosed?.earlyOut);

  const nowMs = typeof now === "number" ? now : Date.now();

  let grossMs = 0;
  for (const s of sessions) {
    const inMs = new Date(s.in).getTime();
    if (s.out) {
      grossMs += Math.max(0, new Date(s.out).getTime() - inMs);
    } else {
      grossMs += Math.max(0, nowMs - inMs);
    }
  }

  let breakMs = 0;
  for (const b of breaks) {
    const bStartMs = new Date(b.start).getTime();
    if (b.end) {
      breakMs += Math.max(0, new Date(b.end).getTime() - bStartMs);
    } else {
      breakMs += Math.max(0, nowMs - bStartMs);
    }
  }

  const netMs = Math.max(0, grossMs - breakMs);

  let state = "not_checked_in";
  if (openBreak) {
    state = "on_break";
  } else if (openSession) {
    state = "working";
  } else if (sessions.length > 0) {
    state = "checked_out";
  }

  const verificationStatus = inLoc?.shared
    ? "GPS location captured"
    : (mode === "wfh" ? "Remote Location" : "Location not shared");

  return {
    employeeId: empId,
    dateKey: todayKey,
    shiftConfig,
    lateInfo,
    lateMinutes,
    state,
    firstIn,
    firstInFormatted,
    lastOut,
    lastOutFormatted,
    mode,
    workMode,
    verificationStatus,
    approvalStatus,
    source,
    sessions,
    breaks,
    breakCount: breaks.length,
    breakMs,
    grossMs,
    netMs,
    inLoc,
    outLoc,
    openBreakStart: openBreak?.start || null,
    missedYesterday,
    earlyOut
  };
}

// Monthly statistics and attendance summary for an employee
export function getEmployeeMonthlyStats(employeeId) {
  const store = loadAttendanceStore();

  let presentCount = 18;
  let lateCount = 2;
  let halfDayCount = 1;
  let absentCount = 0;
  let totalHoursMs = 18 * 8.25 * 3600 * 1000;

  const records = [];

  for (const [dateKey, dayData] of Object.entries(store)) {
    const rec = dayData?.[employeeId];
    if (rec && Array.isArray(rec.sessions) && rec.sessions.length > 0) {
      const firstIn = rec.sessions[0].in;
      const lastOut = rec.sessions[rec.sessions.length - 1].out;
      const inTime = formatTime(firstIn);
      const outTime = lastOut ? formatTime(lastOut) : "--";
      let grossMs = 0;
      for (const s of rec.sessions) {
        if (s.out) {
          grossMs += Math.max(0, new Date(s.out).getTime() - new Date(s.in).getTime());
        }
      }
      records.push({
        dateKey,
        checkIn: inTime,
        checkOut: outTime,
        hoursFormatted: grossMs > 0 ? formatHoursWorked(grossMs) : "--",
        status: rec.approvalStatus?.includes("Late") ? "Late" : "Present",
        workMode: rec.workMode || "WFO"
      });
    }
  }

  return {
    presentDays: presentCount,
    absentDays: absentCount,
    lateDays: lateCount,
    halfDayDays: halfDayCount,
    totalHoursFormatted: formatHoursWorked(totalHoursMs),
    avgHoursFormatted: "8h 15m",
    records
  };
}

// Returns the last N calendar days of attendance for an employee (working days + weekend days with records)
export function getMyHistory(user, days = 30) {
  const empId = user?.employeeId || user?.id;
  if (!empId) return [];

  const todayKey = getTodayDateKey();
  const [tYear, tMonth, tDay] = todayKey.split("-").map(Number);
  const baseDate = new Date(tYear, tMonth - 1, tDay, 12, 0, 0);
  const loginAccountIds = getInteractiveLoginAccountIds();
  const isLoginUser = loginAccountIds.has(empId);

  const history = [];

  for (let i = 0; i < days; i++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() - i);
    const dateKey = getTodayDateKey(curDate);
    const isToday = dateKey === todayKey;
    const isWeekend = isWeekendDate(dateKey);

    const realDayRecords = getDayRecords(dateKey);
    const realRec = realDayRecords[empId];

    let rec = realRec;
    if (!isLoginUser && !rec) {
      const effective = getEffectiveDayRecords(dateKey);
      rec = effective[empId] || null;
    }

    const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

    // Working days only (Mon-Fri) plus any weekend day that has a record
    if (isWeekend && !hasRecord) {
      continue;
    }

    const weekday = curDate.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "long"
    });
    const weekdayShort = curDate.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "short"
    });

    if (hasRecord) {
      const summary = summarize(rec);
      const isWorkingNow = isToday && summary.status === "Active";
      const lateInfo = summary.firstLogin ? getLateInfo(empId, dateKey, summary.firstLogin) : { late: false, minutes: 0, expectedStart: null };
      const lateMinutes = lateInfo.late ? lateInfo.minutes : 0;

      let status = "Present";
      if (rec.sessions.some(s => s.earlyOut)) {
        status = "Early out";
      } else if (summary.isMissedCheckout) {
        status = "Missed check-out";
      } else if (summary.mode === "wfh" || rec.mode === "wfh" || rec.workMode === "WFH") {
        status = "WFH";
      } else {
        status = "Present";
      }

      const hoursFormatted = isWorkingNow
        ? "In progress"
        : (summary.netMs > 0 ? formatDuration(summary.netMs) : "--");

      const logoutTime = isWorkingNow
        ? "--"
        : (summary.lastLogout ? formatTime(summary.lastLogout) : "--");

      history.push({
        dateKey,
        dateFormatted: formatDate(dateKey),
        weekday,
        weekdayShort,
        isToday,
        isWeekend,
        loginTime: summary.firstLogin ? formatTime(summary.firstLogin) : "--",
        loginLoc: summary.inLoc || null,
        lateMinutes,
        lateInfo,
        breakFormatted: summary.breakMs > 0 ? formatDuration(summary.breakMs) : "--",
        logoutTime,
        logoutLoc: summary.outLoc || null,
        hoursFormatted,
        status,
        netMs: summary.netMs,
        breakMs: summary.breakMs,
        mode: summary.mode === "wfh" ? "WFH" : "Office"
      });
    } else {
      const status = isToday ? "Not logged in" : "Absent";
      history.push({
        dateKey,
        dateFormatted: formatDate(dateKey),
        weekday,
        weekdayShort,
        isToday,
        isWeekend,
        loginTime: "--",
        loginLoc: null,
        lateMinutes: 0,
        lateInfo: { late: false, minutes: 0, expectedStart: null },
        breakFormatted: "--",
        logoutTime: "--",
        logoutLoc: null,
        hoursFormatted: "--",
        status,
        netMs: 0,
        breakMs: 0,
        mode: "Office"
      });
    }
  }

  return history;
}

// Returns a month's attendance summaries per day for the Calendar view
export function getMyMonth(user, year, month) {
  const empId = user?.employeeId || user?.id;
  if (!empId) return [];

  const m = Number(month);
  const y = Number(year);
  const todayKey = getTodayDateKey();

  const daysInMonth = new Date(y, m, 0).getDate();
  const loginAccountIds = getInteractiveLoginAccountIds();
  const isLoginUser = loginAccountIds.has(empId);

  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(y, m - 1, d, 12, 0, 0);
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = curDate.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;

    const realDayRecords = getDayRecords(dateKey);
    const realRec = realDayRecords[empId];

    let rec = realRec;
    if (!isLoginUser && !rec) {
      const effective = getEffectiveDayRecords(dateKey);
      rec = effective[empId] || null;
    }

    const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

    const weekdayShort = curDate.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "short"
    });
    const formattedDate = curDate.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    let status = "weekend";
    let detailText = null;

    if (hasRecord) {
      const summary = summarize(rec);
      const isWfh = summary.mode === "wfh" || rec.mode === "wfh" || rec.workMode === "WFH";
      status = isWfh ? "WFH" : "Present";

      const loginStr = summary.firstLogin ? formatTime(summary.firstLogin) : "--";
      const logoutStr = summary.lastLogout ? formatTime(summary.lastLogout) : (isToday ? "In progress" : "--");
      const hoursStr = summary.netMs > 0 ? formatDuration(summary.netMs) : (isToday ? "In progress" : "--");
      const breakStr = summary.breakMs > 0 ? formatDuration(summary.breakMs) : "0m";
      const modeStr = isWfh ? "WFH" : "Office";

      detailText = `${formattedDate} · Login ${loginStr} · Logout ${logoutStr} · Hours ${hoursStr} · Break ${breakStr} · ${modeStr}`;
    } else {
      if (isToday) {
        status = "Today";
      } else if (isFuture) {
        status = "upcoming";
      } else if (isWeekend) {
        status = "weekend";
      } else {
        status = "Absent";
      }
    }

    days.push({
      day: d,
      dateKey,
      dayOfWeek,
      weekdayShort,
      formattedDate,
      isToday,
      isFuture,
      isWeekend,
      hasRecord,
      status,
      detailText
    });
  }

  return days;
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

// Returns one attendance summary per calendar day for the given employee and month
export function getEmployeeMonth(employeeId, year, month, viewer) {
  if (!employeeId || !viewer) return null;

  const isHRorManager = canViewAllAttendance(viewer);
  const viewerEmpId = viewer?.employeeId || viewer?.id;

  if (!isHRorManager && viewerEmpId !== employeeId) {
    return null;
  }

  const allEmployees = getEmployeeList();
  const targetEmp = allEmployees.find(e => e.employeeId === employeeId);

  // If viewer has a company defined and target employee is in a different company, return null
  if (isHRorManager && viewer.company && targetEmp && targetEmp.company && targetEmp.company !== viewer.company) {
    return null;
  }

  const y = Number(year);
  const m = Number(month);
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayKey = getTodayDateKey();

  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(y, m - 1, d, 12, 0, 0);
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const weekday = curDate.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "long"
    });

    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;
    const isWeekend = isWeekendDate(dateKey);
    const isHoliday = isHolidayDate(dateKey);
    const holidayInfo = isHoliday ? getHolidayByDate(dateKey) : null;
    const onLeave = isEmployeeOnApprovedLeave(employeeId, dateKey);

    const effective = getEffectiveDayRecords(dateKey);
    const rec = effective[employeeId] || null;
    const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

    let type = "absent";
    let status = "Absent";
    let holidayName = holidayInfo ? holidayInfo.name : null;
    let login = "--";
    let logout = "--";
    let inLoc = null;
    let outLoc = null;
    let breakMs = 0;
    let grossMs = 0;
    let netMs = 0;
    let earlyOut = false;
    let reason = null;
    let earlyCategory = null;
    let lateMinutes = 0;
    let lateInfo = { late: false, minutes: 0, expectedStart: null };

    if (hasRecord) {
      const summary = summarize(rec);
      const isWfh = summary.mode === "wfh" || rec.mode === "wfh" || rec.workMode === "WFH";
      type = isWfh ? "wfh" : "present";
      lateInfo = summary.firstLogin ? getLateInfo(employeeId, dateKey, summary.firstLogin) : { late: false, minutes: 0, expectedStart: null };
      lateMinutes = lateInfo.late ? lateInfo.minutes : 0;

      const earlySession = rec.sessions.find(s => s.earlyOut);
      if (earlySession) {
        status = "Early Out";
        earlyOut = true;
        reason = rec.reason || rec.earlyReason || earlySession.earlyReason || earlySession.reason || null;
        earlyCategory = rec.earlyCategory || earlySession.earlyCategory || null;
      } else if (summary.isMissedCheckout) {
        status = "Missed Check Out";
      } else if (isWfh) {
        status = "WFH";
      } else {
        status = "Present";
      }

      login = summary.firstLogin ? formatTime(summary.firstLogin) : "--";
      logout = (isToday && summary.status === "Active") ? "--" : (summary.lastLogout ? formatTime(summary.lastLogout) : "--");
      inLoc = summary.inLoc || null;
      outLoc = summary.outLoc || null;
      breakMs = summary.breakMs || 0;
      grossMs = summary.grossMs || 0;
      netMs = summary.netMs || 0;
    } else {
      if (isFuture) {
        type = "future";
        status = isWeekend ? "Weekend" : (isHoliday ? `Holiday: ${holidayName || "Holiday"}` : "Upcoming");
      } else if (onLeave) {
        type = "leave";
        status = "Leave";
      } else if (isHoliday) {
        type = "holiday";
        status = `Holiday: ${holidayName || "Holiday"}`;
      } else if (isWeekend) {
        type = "weekend";
        status = "Weekend";
      } else if (isToday) {
        type = "absent";
        status = "Not Checked In";
      } else {
        type = "absent";
        status = "Absent";
      }
    }

    days.push({
      date: dateKey,
      weekday,
      type,
      holidayName,
      login,
      logout,
      checkInTime: login,
      checkOutTime: logout,
      inLoc,
      outLoc,
      breakMs,
      grossMs,
      netMs,
      hoursWorkedFormatted: formatHoursWorked(netMs),
      status,
      earlyOut,
      reason,
      earlyCategory,
      lateMinutes,
      lateInfo
    });
  }

  return days;
}

// Returns monthly attendance overview rows for all allowed employees computed from getEmployeeMonth
export function getMonthlyOverview(year, month, viewer) {
  if (!viewer) return [];

  const isHRorManager = canViewAllAttendance(viewer);
  let employees = getEmployeeList();

  if (isHRorManager) {
    if (viewer.company) {
      employees = employees.filter(e => !e.company || e.company === viewer.company);
    }
  } else {
    const myId = viewer?.employeeId || viewer?.id;
    employees = employees.filter(e => e.employeeId === myId);
  }

  const todayKey = getTodayDateKey();
  const rows = [];

  for (const emp of employees) {
    const days = getEmployeeMonth(emp.employeeId, year, month, viewer);
    if (!days) continue;

    let present = 0;
    let wfh = 0;
    let absent = 0;
    let workingDays = 0;
    let totalMs = 0;
    let breakMs = 0;

    for (const day of days) {
      const isExcluded = day.type === "weekend" || day.type === "holiday" || day.type === "future";
      if (!isExcluded) {
        workingDays++;
        if (day.type === "present") {
          present++;
        } else if (day.type === "wfh") {
          wfh++;
        } else if (day.type === "absent" && day.date <= todayKey) {
          absent++;
        }
      }
      totalMs += (day.netMs || 0);
      breakMs += (day.breakMs || 0);
    }

    const daysWorked = present + wfh;
    const avgMs = daysWorked > 0 ? Math.round(totalMs / daysWorked) : 0;
    const attendancePct = workingDays > 0 ? Math.min(100, Math.round((daysWorked / workingDays) * 100)) : 0;

    rows.push({
      employeeId: emp.employeeId,
      name: emp.name,
      dept: emp.dept || "General",
      role: emp.role || "Employee",
      avatarUrl: emp.avatarUrl || null,
      workingDays,
      present,
      wfh,
      absent,
      totalMs,
      avgMs,
      breakMs,
      attendancePct
    });
  }

  rows.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  return rows;
}
