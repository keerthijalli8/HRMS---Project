/**
 * Unified Attendance Service Layer
 * Connects frontend views with mock store, localStorage persistence,
 * and structured API wrappers ready for REST API endpoints.
 */

import { ATTENDANCE_CONFIG, WORK_HOURS, GRACE_MINUTES, HALF_DAY_HOURS, TIMEZONE } from '../config/attendance.js';
import {
  getShiftMetrics,
  formatTime,
  formatDuration,
  formatHoursWorked,
  formatDisplayDate,
  formatDate,
  isWeekendDate,
  getDayRecords,
  getEffectiveDayRecords,
  loadAttendanceStore,
  saveAttendanceStore,
  subscribeAttendanceStore,
  checkIn as logCheckIn,
  checkOut as logCheckOut,
  startBreak as logStartBreak,
  endBreak as logEndBreak
} from './attendanceLog.js';
import { employeeData } from '../data/mockData.js';
import { isHolidayDate, getHolidayByDate } from './holidayStore.js';
import { loadWfhRequests, saveWfhRequests, subscribeWorkMode } from './wfoWfhStore.js';

const REGULARIZATION_KEY = "hrms_regularization_requests_v1";
const AUDIT_LOG_KEY = "hrms_attendance_audit_log_v1";
const ATTENDANCE_EVENT = "hrms_attendance_service_updated";

// 9 Hours target in ms
export const NINE_HOURS_MS = WORK_HOURS * 60 * 60 * 1000;
export const HALF_DAY_MS = HALF_DAY_HOURS * 60 * 60 * 1000;

// Asia/Kolkata date key helper
export function getKolkataDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

// Asia/Kolkata time formatter
export function formatKolkataTime(isoOrDate) {
  if (!isoOrDate) return "--";
  const dateObj = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(dateObj.getTime())) return "--";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(dateObj);
}

// Broadcasts an update across the app
export function notifyAttendanceServiceUpdated() {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(ATTENDANCE_EVENT));
    } catch (e) {}
  }
}

// Subscribes to attendance updates
export function subscribeAttendanceService(callback) {
  if (typeof window === "undefined") return () => {};
  const unsubLog = subscribeAttendanceStore(callback);
  const unsubWfh = subscribeWorkMode(callback);

  const handler = () => callback();
  window.addEventListener(ATTENDANCE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    unsubLog();
    unsubWfh();
    window.removeEventListener(ATTENDANCE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// ------------------- INITIAL REGULARIZATION SEED -------------------

const INITIAL_REGULARIZATION_REQUESTS = [
  {
    id: "REG-2026-001",
    employeeId: "EMP-1102",
    employeeName: "Rohan Varma",
    dept: "Product",
    dateKey: "2026-11-10",
    requestedIn: "09:05 AM",
    requestedOut: "06:15 PM",
    reason: "Office biometric reader timed out during morning scan.",
    status: "Pending",
    createdAt: "2026-11-10T18:45:00+05:30",
    reviewedBy: null,
    reviewedAt: null,
    comment: null
  },
  {
    id: "REG-2026-002",
    employeeId: "EMP-1145",
    employeeName: "Sneha Nair",
    dept: "Engineering",
    dateKey: "2026-11-09",
    requestedIn: "09:12 AM",
    requestedOut: "06:30 PM",
    reason: "Forgot to punch out due to production deployment outage.",
    status: "Pending",
    createdAt: "2026-11-10T09:30:00+05:30",
    reviewedBy: null,
    reviewedAt: null,
    comment: null
  },
  {
    id: "REG-2026-003",
    employeeId: "EMP-1234",
    employeeName: "Devansh Mehta",
    dept: "Engineering",
    dateKey: "2026-11-06",
    requestedIn: "09:20 AM",
    requestedOut: "06:40 PM",
    reason: "Client site meeting in HITEC City before heading to office.",
    status: "Approved",
    createdAt: "2026-11-06T19:00:00+05:30",
    reviewedBy: "Aarav Sharma",
    reviewedAt: "2026-11-07T10:15:00+05:30",
    comment: "Verified with client meeting calendar."
  }
];

// ------------------- REGULARIZATION REQUESTS STORE -------------------

export function loadRegularizationRequests() {
  try {
    const raw = localStorage.getItem(REGULARIZATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  try {
    localStorage.setItem(REGULARIZATION_KEY, JSON.stringify(INITIAL_REGULARIZATION_REQUESTS));
  } catch (e) {}
  return INITIAL_REGULARIZATION_REQUESTS;
}

export function saveRegularizationRequests(list) {
  try {
    localStorage.setItem(REGULARIZATION_KEY, JSON.stringify(list));
    notifyAttendanceServiceUpdated();
    return true;
  } catch (e) {
    return false;
  }
}

// ------------------- AUDIT LOG STORE -------------------

export function loadAttendanceAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveAttendanceAuditLog(list) {
  try {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

// ------------------- USER AUTHORIZATION & SCOPING -------------------

export function isManagerRole(user) {
  if (!user) return false;
  const sys = (user.systemRole || "").toLowerCase();
  const r = (user.role || "").toLowerCase();
  return sys === "manager" || sys === "lead" || r.includes("manager") || r.includes("lead") || r.includes("director");
}

export function isHRorAdmin(user) {
  if (!user) return false;
  const sys = (user.systemRole || "").toLowerCase();
  const r = (user.role || "").toLowerCase();
  return sys === "hr" || sys === "hr manager" || sys === "admin" || r.includes("hr") || r.includes("admin");
}

export function canAccessTeamAttendance(user) {
  return isHRorAdmin(user) || isManagerRole(user);
}

// ------------------- MY ATTENDANCE APIS -------------------

/**
 * Returns comprehensive data for Tab 1 (My Attendance):
 * - monthDays: calendar day objects
 * - summaryCards: 8 KPI metrics for the selected month
 * - historyTable: formatted history rows
 * - myRequests: user's regularization requests
 */
export function getMyAttendance({ year, month, user }) {
  const empId = user?.employeeId || user?.id || "EMP-1088";
  const y = Number(year || new Date().getFullYear());
  const m = Number(month || (new Date().getMonth() + 1));
  const todayKey = getKolkataDateKey();
  const daysInMonth = new Date(y, m, 0).getDate();

  const auditLog = loadAttendanceAuditLog();
  const regRequests = loadRegularizationRequests();
  const userRegRequests = regRequests.filter(r => r.employeeId === empId);

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let earlyOutCount = 0;
  let wfhCount = 0;
  let leaveCount = 0;
  let halfDayCount = 0;
  let totalNetMs = 0;
  let workingDaysCount = 0;

  const monthDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const curDate = new Date(`${dateKey}T12:00:00+05:30`);
    const dayOfWeek = curDate.getDay();
    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;
    const isWeekend = isWeekendDate(dateKey);
    const isHoliday = isHolidayDate(dateKey);
    const holidayInfo = isHoliday ? getHolidayByDate(dateKey) : null;

    // Check if employee has records for this day
    const effective = getEffectiveDayRecords(dateKey);
    const rec = effective[empId] || null;
    const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

    let status = "Absent";
    let type = "absent";
    let checkIn = "--";
    let checkOut = "--";
    let breakDuration = "--";
    let totalHours = "--";
    let netMs = 0;
    let breakMs = 0;
    let mode = "Office";
    let earlyOut = false;
    let earlyReason = null;
    let isLate = false;
    let lateMinutes = 0;
    let isMissedCheckOut = false;

    // Check manual edit tag
    const dayAudit = auditLog.find(a => a.employeeId === empId && a.dateKey === dateKey);

    if (hasRecord) {
      const summary = rec.sessions;
      const firstSess = summary[0];
      const lastSess = summary[summary.length - 1];

      checkIn = firstSess?.in ? formatKolkataTime(firstSess.in) : "--";
      checkOut = lastSess?.out ? formatKolkataTime(lastSess.out) : (isToday ? "In progress" : "--");

      // Gross and Break computation
      let gross = 0;
      summary.forEach(s => {
        const inT = new Date(s.in).getTime();
        const outT = s.out ? new Date(s.out).getTime() : (isToday ? Date.now() : inT);
        gross += Math.max(0, outT - inT);
      });

      (rec.breaks || []).forEach(b => {
        const bStart = new Date(b.start).getTime();
        const bEnd = b.end ? new Date(b.end).getTime() : (isToday ? Date.now() : bStart);
        breakMs += Math.max(0, bEnd - bStart);
      });

      netMs = Math.max(0, gross - breakMs);
      totalHours = formatHoursWorked(netMs);
      breakDuration = formatDuration(breakMs);

      const isWfh = rec.mode === "wfh" || rec.workMode === "WFH";
      mode = isWfh ? "WFH" : "Office";

      // Late check (after 09:15 AM = 09:00 + 15 min grace)
      if (firstSess?.in) {
        const inDate = new Date(firstSess.in);
        const inMinutes = (inDate.getHours() * 60) + inDate.getMinutes();
        const graceThreshold = (9 * 60) + GRACE_MINUTES; // 09:15
        if (inMinutes > graceThreshold) {
          isLate = true;
          lateMinutes = inMinutes - (9 * 60);
        }
      }

      // Early out check
      const earlySess = summary.find(s => s.earlyOut);
      if (earlySess || rec.earlyOut) {
        earlyOut = true;
        earlyReason = rec.reason || rec.earlyReason || earlySess?.reason || "Personal early check-out";
      }

      // Half day check (less than 4.5 hours and completed)
      const isHalfDay = !isToday && checkOut !== "--" && netMs < HALF_DAY_MS && netMs > 0;

      // Missed check out check
      if (!isToday && checkIn !== "--" && (checkOut === "--" || rec.status === "Missed Check Out")) {
        isMissedCheckOut = true;
      }

      if (isMissedCheckOut) {
        status = "Missed Check Out";
        type = "missed";
      } else if (isHalfDay) {
        status = "Half Day";
        type = "half_day";
        halfDayCount++;
      } else if (earlyOut) {
        status = "Early Out";
        type = isWfh ? "wfh" : "present";
      } else if (isWfh) {
        status = "WFH";
        type = "wfh";
      } else {
        status = "Present";
        type = "present";
      }

      if (isWfh) wfhCount++;
      else presentCount++;

      if (isLate) lateCount++;
      if (earlyOut) earlyOutCount++;

      totalNetMs += netMs;
      workingDaysCount++;
    } else {
      if (isFuture) {
        type = "future";
        status = isWeekend ? "Weekend" : (isHoliday ? `Holiday: ${holidayInfo?.name || "Holiday"}` : "Upcoming");
      } else if (isHoliday) {
        type = "holiday";
        status = `Holiday: ${holidayInfo?.name || "Holiday"}`;
      } else if (isWeekend) {
        type = "weekend";
        status = "Weekend";
      } else if (isToday) {
        type = "not_checked_in";
        status = "Not Checked In";
      } else {
        type = "absent";
        status = "Absent";
        absentCount++;
        workingDaysCount++;
      }
    }

    const weekdayShort = curDate.toLocaleDateString("en-GB", { timeZone: TIMEZONE, weekday: "short" });
    const weekdayLong = curDate.toLocaleDateString("en-GB", { timeZone: TIMEZONE, weekday: "long" });

    monthDays.push({
      day: d,
      dateKey,
      dayOfWeek,
      weekday: weekdayLong,
      weekdayShort,
      formattedDate: formatDate(dateKey),
      isToday,
      isFuture,
      isWeekend,
      isHoliday,
      holidayName: holidayInfo?.name || null,
      hasRecord,
      status,
      type,
      checkIn,
      checkOut,
      breakDuration,
      totalHours,
      netMs,
      breakMs,
      mode,
      earlyOut,
      earlyReason,
      isLate,
      lateMinutes,
      isMissedCheckOut,
      isEdited: Boolean(dayAudit),
      auditInfo: dayAudit || null,
      locationLabel: mode === "WFH" ? "Remote (Home/Virtual)" : "Office (HITEC City HQ)"
    });
  }

  // Summary Metrics calculations
  const daysWorked = presentCount + wfhCount;
  const avgMsPerDay = daysWorked > 0 ? Math.round(totalNetMs / daysWorked) : 0;
  const avgHoursFormatted = formatHoursWorked(avgMsPerDay);
  const totalHoursFormatted = formatHoursWorked(totalNetMs);

  const summaryCards = {
    presentDays: presentCount,
    absentDays: absentCount,
    lateArrivals: lateCount,
    earlyCheckOuts: earlyOutCount,
    wfhDays: wfhCount,
    leavesTaken: leaveCount,
    avgHoursPerDay: avgHoursFormatted,
    totalHoursThisMonth: totalHoursFormatted,
    totalWorkingDays: workingDaysCount,
    halfDays: halfDayCount
  };

  // Build history table rows (newest to oldest, past/today working days only)
  const historyTable = [...monthDays]
    .filter(d => (d.hasRecord || (!d.isFuture && !d.isWeekend && !d.isHoliday)))
    .reverse();

  return {
    year: y,
    month: m,
    employeeId: empId,
    monthDays,
    summaryCards,
    historyTable,
    myRequests: userRegRequests
  };
}

// ------------------- TEAM ATTENDANCE APIS (HR / MANAGER) -------------------

/**
 * Returns comprehensive data for Tab 2 (Team Attendance):
 * - summaryCards: 8 clickable metrics
 * - employees: list of live records with running hours
 * - allDepartments: unique department list
 * - allLocations: unique location list
 */
export function getTeamAttendance({ date, filters = {}, viewer }) {
  const dateKey = date || getKolkataDateKey();
  const todayKey = getKolkataDateKey();
  const isToday = dateKey === todayKey;
  const isWeekend = isWeekendDate(dateKey);
  const isHoliday = isHolidayDate(dateKey);
  const holidayInfo = isHoliday ? getHolidayByDate(dateKey) : null;

  const now = Date.now();
  const effective = getEffectiveDayRecords(dateKey);
  const auditLog = loadAttendanceAuditLog();

  // Get full employee list
  const allEmps = employeeData.map(e => ({
    id: e.id,
    employeeId: e.id,
    name: e.name,
    email: e.email,
    dept: e.dept || "General",
    role: e.role || "Employee",
    companyId: e.companyId || "NEX-IND",
    mgr: e.mgr || "",
    avatarUrl: e.avatarUrl || null,
    location: "Hyderabad"
  }));

  // Scoping: Manager sees only reporting team by default, HR/Admin see everyone
  const isManager = isManagerRole(viewer) && !isHRorAdmin(viewer);
  let scopedEmployees = allEmps;

  if (isManager) {
    const viewerName = viewer?.name || "";
    const viewerId = viewer?.employeeId || viewer?.id || "";
    scopedEmployees = allEmps.filter(e =>
      e.mgr === viewerName ||
      e.mgr === viewerId ||
      e.employeeId === viewerId
    );
    // If no direct reports matched by name, include departmental peers
    if (scopedEmployees.length <= 1 && viewer?.dept) {
      scopedEmployees = allEmps.filter(e => e.dept === viewer.dept);
    }
  }

  // Aggregate metrics
  let totalCount = scopedEmployees.length;
  let presentCount = 0;
  let absentCount = 0;
  let onLeaveCount = 0;
  let wfhCount = 0;
  let lateCount = 0;
  let earlyOutCount = 0;
  let notCheckedInCount = 0;

  const employeeRows = [];

  scopedEmployees.forEach(emp => {
    const rec = effective[emp.employeeId] || null;
    const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

    let status = "Not Checked In";
    let checkIn = "--";
    let checkOut = "--";
    let breakDuration = "--";
    let totalHours = "--";
    let netMs = 0;
    let breakMs = 0;
    let isWorking = false;
    let isLate = false;
    let lateMinutes = 0;
    let isEarlyOut = false;
    let earlyReason = null;
    let mode = rec?.mode === "wfh" || rec?.workMode === "WFH" ? "WFH" : "Office";
    const shiftName = "09:00 AM – 06:00 PM (General)";

    const dayAudit = auditLog.find(a => a.employeeId === emp.employeeId && a.dateKey === dateKey);

    if (hasRecord) {
      const sess = rec.sessions;
      const firstSess = sess[0];
      const lastSess = sess[sess.length - 1];

      checkIn = firstSess?.in ? formatKolkataTime(firstSess.in) : "--";
      checkOut = lastSess?.out ? formatKolkataTime(lastSess.out) : (isToday ? "Working" : "--");
      isWorking = isToday && !lastSess?.out;

      // Calculate gross & breaks
      let gross = 0;
      sess.forEach(s => {
        const inT = new Date(s.in).getTime();
        const outT = s.out ? new Date(s.out).getTime() : (isToday ? now : inT);
        gross += Math.max(0, outT - inT);
      });

      (rec.breaks || []).forEach(b => {
        const bStart = new Date(b.start).getTime();
        const bEnd = b.end ? new Date(b.end).getTime() : (isToday ? now : bStart);
        breakMs += Math.max(0, bEnd - bStart);
      });

      netMs = Math.max(0, gross - breakMs);
      totalHours = formatHoursWorked(netMs);
      breakDuration = formatDuration(breakMs);

      // Late rule
      if (firstSess?.in) {
        const inDate = new Date(firstSess.in);
        const inMinutes = (inDate.getHours() * 60) + inDate.getMinutes();
        if (inMinutes > (9 * 60) + GRACE_MINUTES) {
          isLate = true;
          lateMinutes = inMinutes - (9 * 60);
          lateCount++;
        }
      }

      // Early out
      if (rec.earlyOut || sess.some(s => s.earlyOut)) {
        isEarlyOut = true;
        earlyReason = rec.reason || rec.earlyReason || "Early check-out";
        earlyOutCount++;
      }

      // Check Half Day vs Present
      if (!isToday && checkOut !== "--" && netMs < HALF_DAY_MS && netMs > 0) {
        status = "Half Day";
      } else if (isEarlyOut) {
        status = "Early Out";
      } else if (mode === "WFH") {
        status = "WFH";
      } else {
        status = "Present";
      }

      if (mode === "WFH") wfhCount++;
      else presentCount++;
    } else {
      if (isWeekend) {
        status = "Weekend";
      } else if (isHoliday) {
        status = "Holiday";
      } else if (isToday) {
        status = "Not Checked In";
        notCheckedInCount++;
      } else {
        status = "Absent";
        absentCount++;
      }
    }

    employeeRows.push({
      id: emp.employeeId,
      employeeId: emp.employeeId,
      name: emp.name,
      dept: emp.dept,
      role: emp.role,
      avatarUrl: emp.avatarUrl,
      location: emp.location,
      shift: shiftName,
      checkIn,
      checkOut,
      breakDuration,
      totalHours,
      netMs,
      breakMs,
      mode,
      status,
      isWorking,
      isLate,
      lateMinutes,
      isEarlyOut,
      earlyReason,
      isEdited: Boolean(dayAudit),
      auditInfo: dayAudit || null,
      rawRecord: rec
    });
  });

  // Apply filters
  const {
    search = "",
    dept = "All",
    location = "All",
    status: statusFilter = "All",
    mode: modeFilter = "All"
  } = filters;

  const filteredRows = employeeRows.filter(row => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = row.name.toLowerCase().includes(q);
      const matchId = row.employeeId.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    if (dept !== "All" && row.dept !== dept) {
      return false;
    }

    if (location !== "All" && row.location !== location) {
      return false;
    }

    if (modeFilter !== "All" && row.mode !== modeFilter) {
      return false;
    }

    if (statusFilter !== "All") {
      const sLower = statusFilter.toLowerCase();
      const rowStatusLower = row.status.toLowerCase();

      if (sLower === "present" && (rowStatusLower === "present" || rowStatusLower === "wfh")) return true;
      if (sLower === "absent" && rowStatusLower === "absent") return true;
      if (sLower === "late" && row.isLate) return true;
      if (sLower === "early out" && row.isEarlyOut) return true;
      if (sLower === "wfh" && row.mode === "WFH") return true;
      if (sLower === "not checked in" && (rowStatusLower === "not checked in" || (!row.hasRecord && !isWeekend && !isHoliday))) return true;
      if (sLower === "working" && row.isWorking) return true;

      return rowStatusLower.includes(sLower);
    }

    return true;
  });

  const summaryCards = {
    totalEmployees: totalCount,
    present: presentCount,
    absent: absentCount,
    onLeave: onLeaveCount,
    wfh: wfhCount,
    late: lateCount,
    earlyOut: earlyOutCount,
    notCheckedIn: notCheckedInCount
  };

  const allDepartments = ["All", ...new Set(allEmps.map(e => e.dept))];
  const allLocations = ["All", ...new Set(allEmps.map(e => e.location))];

  return {
    dateKey,
    isToday,
    isWeekend,
    isHoliday,
    holidayInfo,
    isScopedToManager: isManager,
    summaryCards,
    employees: filteredRows,
    totalFiltered: filteredRows.length,
    allDepartments,
    allLocations
  };
}

// ------------------- ATTENDANCE ACTIONS (CHECK IN / OUT / BREAK) -------------------

export function checkIn(user, options = {}) {
  return logCheckIn(user, options);
}

export function checkOut(user, options = {}) {
  return logCheckOut(user, options);
}

export function startBreak(user) {
  return logStartBreak(user);
}

export function endBreak(user) {
  return logEndBreak(user);
}

// ------------------- REGULARIZATION WORKFLOW -------------------

export function requestRegularization({ user, date, checkInTime, checkOutTime, reason }) {
  if (!user || !date || !reason || reason.trim().length < 10) {
    return { ok: false, error: "Reason is required and must be at least 10 characters." };
  }

  const empId = user.employeeId || user.id;
  const name = user.name || "Employee";
  const dept = user.dept || user.department || "General";

  const list = loadRegularizationRequests();
  const id = `REG-2026-${String(list.length + 101).padStart(3, '0')}`;

  const newReq = {
    id,
    employeeId: empId,
    employeeName: name,
    dept,
    dateKey: date,
    requestedIn: checkInTime || "09:00 AM",
    requestedOut: checkOutTime || "06:00 PM",
    reason: reason.trim(),
    status: "Pending",
    createdAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    comment: null
  };

  list.unshift(newReq);
  saveRegularizationRequests(list);

  return { ok: true, id, message: "Regularization request submitted for manager approval." };
}

export function approveRegularization(requestId, reviewer, comment = "") {
  const list = loadRegularizationRequests();
  const req = list.find(r => r.id === requestId);
  if (!req) return { ok: false, error: "Request not found" };

  req.status = "Approved";
  req.reviewedBy = reviewer?.name || "Manager";
  req.reviewedAt = new Date().toISOString();
  req.comment = comment;

  saveRegularizationRequests(list);

  // Apply corrected check-in & check-out times to the attendance store
  try {
    const store = loadAttendanceStore();
    const dateKey = req.dateKey;
    if (!store[dateKey]) store[dateKey] = {};

    const inIso = `${dateKey}T09:00:00+05:30`;
    const outIso = `${dateKey}T18:00:00+05:30`;

    store[dateKey][req.employeeId] = {
      name: req.employeeName,
      dept: req.dept,
      mode: "office",
      workMode: "WFO",
      verificationStatus: "Regularized by Manager",
      approvalStatus: "Approved",
      status: "Present",
      source: "Regularization",
      isRegularized: true,
      sessions: [
        {
          in: inIso,
          out: outIso,
          workMode: "WFO",
          verificationStatus: "Regularized",
          src: "regularization"
        }
      ],
      breaks: []
    };

    saveAttendanceStore(store);
  } catch (e) {}

  notifyAttendanceServiceUpdated();
  return { ok: true, message: `Approved regularization for ${req.employeeName}` };
}

export function rejectRegularization(requestId, reviewer, comment = "") {
  const list = loadRegularizationRequests();
  const req = list.find(r => r.id === requestId);
  if (!req) return { ok: false, error: "Request not found" };

  req.status = "Rejected";
  req.reviewedBy = reviewer?.name || "Manager";
  req.reviewedAt = new Date().toISOString();
  req.comment = comment;

  saveRegularizationRequests(list);
  notifyAttendanceServiceUpdated();
  return { ok: true, message: `Rejected regularization request ${requestId}` };
}

// ------------------- MANUAL CORRECTION & AUDIT LOG -------------------

export function updateAttendanceManual({ employeeId, dateKey, checkInTime, checkOutTime, status, mode, reason, adminUser }) {
  if (!employeeId || !dateKey || !reason || reason.trim().length < 10) {
    return { ok: false, error: "A mandatory reason (minimum 10 characters) is required for audit compliance." };
  }

  const store = loadAttendanceStore();
  if (!store[dateKey]) store[dateKey] = {};

  const oldRec = store[dateKey][employeeId] || null;
  const oldVal = oldRec ? `${oldRec.status || 'Active'} (${oldRec.sessions?.[0]?.in ? formatKolkataTime(oldRec.sessions[0].in) : '--'} - ${oldRec.sessions?.[0]?.out ? formatKolkataTime(oldRec.sessions[0].out) : '--'})` : "No Record / Absent";

  const targetEmp = employeeData.find(e => e.id === employeeId);
  const name = targetEmp?.name || "Employee";
  const dept = targetEmp?.dept || "General";

  const inIso = checkInTime ? `${dateKey}T${checkInTime}:00+05:30` : `${dateKey}T09:00:00+05:30`;
  const outIso = checkOutTime ? `${dateKey}T${checkOutTime}:00+05:30` : `${dateKey}T18:00:00+05:30`;

  const newRec = {
    name,
    dept,
    mode: mode || "office",
    workMode: mode === "wfh" ? "WFH" : "WFO",
    status: status || "Present",
    verificationStatus: "Manual HR Correction",
    approvalStatus: "Approved",
    source: "HR Admin Portal",
    isEdited: true,
    lastEditedBy: adminUser?.name || "HR Administrator",
    sessions: [
      {
        in: inIso,
        out: outIso,
        workMode: mode === "wfh" ? "WFH" : "WFO",
        verificationStatus: "Manual Correction"
      }
    ],
    breaks: []
  };

  store[dateKey][employeeId] = newRec;
  saveAttendanceStore(store);

  // Write audit log
  const auditList = loadAttendanceAuditLog();
  const auditEntry = {
    id: `AUD-${Date.now()}`,
    employeeId,
    employeeName: name,
    dateKey,
    field: "Attendance Record",
    oldValue: oldVal,
    newValue: `${status} (${formatKolkataTime(inIso)} - ${formatKolkataTime(outIso)})`,
    reason: reason.trim(),
    updatedBy: adminUser?.name || "HR Admin",
    updatedAt: new Date().toISOString()
  };

  auditList.unshift(auditEntry);
  saveAttendanceAuditLog(auditList);

  notifyAttendanceServiceUpdated();
  return { ok: true, message: `Attendance corrected for ${name} on ${dateKey}.` };
}

// ------------------- BULK ACTIONS (HR / ADMIN) -------------------

export function bulkMarkAttendance({ employeeIds = [], dateKey, status = "Present", mode = "office", adminUser }) {
  if (employeeIds.length === 0) return { ok: false, error: "No employees selected" };

  const store = loadAttendanceStore();
  if (!store[dateKey]) store[dateKey] = {};

  const inIso = `${dateKey}T09:00:00+05:30`;
  const outIso = `${dateKey}T18:00:00+05:30`;
  const auditList = loadAttendanceAuditLog();

  employeeIds.forEach(id => {
    const targetEmp = employeeData.find(e => e.id === id);
    const name = targetEmp?.name || id;
    const dept = targetEmp?.dept || "General";

    if (status === "Absent") {
      delete store[dateKey][id];
    } else {
      store[dateKey][id] = {
        name,
        dept,
        mode,
        workMode: mode === "wfh" ? "WFH" : "WFO",
        status: status || "Present",
        verificationStatus: "Bulk HR Mark",
        approvalStatus: "Approved",
        source: "Bulk Action",
        sessions: [
          {
            in: inIso,
            out: outIso,
            workMode: mode === "wfh" ? "WFH" : "WFO"
          }
        ],
        breaks: []
      };
    }

    auditList.unshift({
      id: `AUD-${Date.now()}-${id}`,
      employeeId: id,
      employeeName: name,
      dateKey,
      field: "Bulk Attendance",
      oldValue: "Previous",
      newValue: status,
      reason: "Bulk HR Action",
      updatedBy: adminUser?.name || "HR Admin",
      updatedAt: new Date().toISOString()
    });
  });

  saveAttendanceStore(store);
  saveAttendanceAuditLog(auditList);
  notifyAttendanceServiceUpdated();

  return { ok: true, count: employeeIds.length, message: `Updated attendance for ${employeeIds.length} employees.` };
}

export function sendAttendanceReminder({ employeeIds = [] }) {
  return {
    ok: true,
    count: employeeIds.length,
    message: `Attendance reminders dispatched via Email & SMS to ${employeeIds.length} employees.`
  };
}

// ------------------- MONTHLY MATRIX GRID -------------------

export function getMonthlyMatrix({ year, month, viewer }) {
  const y = Number(year || new Date().getFullYear());
  const m = Number(month || (new Date().getMonth() + 1));
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayKey = getKolkataDateKey();

  const isManager = isManagerRole(viewer) && !isHRorAdmin(viewer);
  let emps = employeeData;
  if (isManager) {
    const viewerName = viewer?.name || "";
    const viewerId = viewer?.employeeId || viewer?.id || "";
    emps = employeeData.filter(e => e.mgr === viewerName || e.mgr === viewerId || e.id === viewerId);
    if (emps.length <= 1 && viewer?.dept) {
      emps = employeeData.filter(e => e.dept === viewer.dept);
    }
  }

  const matrixRows = [];

  emps.forEach(emp => {
    let pCount = 0;
    let aCount = 0;
    let wfhCount = 0;
    let lCount = 0;
    let workingDays = 0;
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isWeekend = isWeekendDate(dateKey);
      const isHoliday = isHolidayDate(dateKey);
      const isFuture = dateKey > todayKey;

      const effective = getEffectiveDayRecords(dateKey);
      const rec = effective[emp.id] || null;
      const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

      let code = "A";
      let label = "Absent";

      if (isWeekend) {
        code = "W";
        label = "Weekend";
      } else if (isHoliday) {
        code = "H";
        label = "Holiday";
      } else if (isFuture) {
        code = "-";
        label = "Upcoming";
      } else if (hasRecord) {
        workingDays++;
        if (rec.mode === "wfh" || rec.workMode === "WFH") {
          code = "WFH";
          label = "Work From Home";
          wfhCount++;
        } else {
          code = "P";
          label = "Present (Office)";
          pCount++;
        }
      } else {
        workingDays++;
        code = "A";
        label = "Absent";
        aCount++;
      }

      days.push({ day: d, dateKey, code, label });
    }

    const totalWorked = pCount + wfhCount;
    const attendancePct = workingDays > 0 ? Math.min(100, Math.round((totalWorked / workingDays) * 100)) : 0;

    matrixRows.push({
      employeeId: emp.id,
      name: emp.name,
      dept: emp.dept,
      role: emp.role,
      avatarUrl: emp.avatarUrl,
      days,
      pCount,
      wfhCount,
      aCount,
      lCount,
      attendancePct
    });
  });

  return {
    year: y,
    month: m,
    daysInMonth,
    matrixRows
  };
}

// ------------------- ATTENDANCE INSIGHTS -------------------

export function getAttendanceInsights({ month, year, viewer }) {
  const y = Number(year || new Date().getFullYear());
  const m = Number(month || (new Date().getMonth() + 1));

  // Weekly Trend points (Monday to Friday average %)
  const weeklyTrend = [
    { day: "Mon", rate: 94, present: 11, total: 12 },
    { day: "Tue", rate: 96, present: 11, total: 12 },
    { day: "Wed", rate: 98, present: 12, total: 12 },
    { day: "Thu", rate: 92, present: 11, total: 12 },
    { day: "Fri", rate: 88, present: 10, total: 12 }
  ];

  // Department-wise attendance breakdown
  const deptBreakdown = [
    { dept: "Engineering", rate: 94.2, present: 4, total: 4 },
    { dept: "Human Resources", rate: 96.8, present: 3, total: 3 },
    { dept: "Product", rate: 91.5, present: 1, total: 1 },
    { dept: "Finance", rate: 95.0, present: 1, total: 1 }
  ];

  // Frequent Late Comers list
  const frequentLateComers = [
    { employeeId: "EMP-1234", name: "Devansh Mehta", dept: "Engineering", lateCount: 4, avgDelay: "22 mins" },
    { employeeId: "EMP-1102", name: "Rohan Varma", dept: "Product", lateCount: 3, avgDelay: "18 mins" },
    { employeeId: "EMP-2003", name: "Rahul Menon", dept: "Engineering", lateCount: 2, avgDelay: "16 mins" }
  ];

  // Low Attendance list (< 75%)
  const lowAttendanceList = [
    { employeeId: "EMP-1145", name: "Sneha Nair", dept: "Engineering", rate: 71.4, absentDays: 6, status: "On Leave" }
  ];

  return {
    weeklyTrend,
    deptBreakdown,
    frequentLateComers,
    lowAttendanceList
  };
}

// ------------------- PENDING APPROVALS COUNT -------------------

export function getPendingApprovalsCount(viewer) {
  const regList = loadRegularizationRequests();
  const wfhList = loadWfhRequests();

  const isManager = isManagerRole(viewer) && !isHRorAdmin(viewer);

  let pendingReg = regList.filter(r => r.status === "Pending");
  let pendingWfh = wfhList.filter(w => w.status === "Pending");

  if (isManager) {
    const viewerName = viewer?.name || "";
    const viewerId = viewer?.employeeId || viewer?.id || "";
    const reportingIds = new Set(
      employeeData.filter(e => e.mgr === viewerName || e.mgr === viewerId).map(e => e.id)
    );
    if (reportingIds.size > 0) {
      pendingReg = pendingReg.filter(r => reportingIds.has(r.employeeId));
      pendingWfh = pendingWfh.filter(w => reportingIds.has(w.employeeId));
    }
  }

  return {
    regularizationCount: pendingReg.length,
    wfhCount: pendingWfh.length,
    totalPending: pendingReg.length + pendingWfh.length
  };
}

// ------------------- DEPARTMENTS DEFINITION & 2-LEVEL DRILL-DOWN APIS -------------------

export const DEPARTMENTS = [
  {
    id: "engineering",
    name: "Engineering",
    icon: "code",
    headId: "EMP-1042",
    headName: "Aarav Sharma",
    headRole: "Staff Architect & Eng Manager",
    aliases: ["eng", "tech", "development"]
  },
  {
    id: "human-resources",
    name: "Human Resources",
    icon: "users",
    headId: "EMP-1001",
    headName: "Meera Reddy",
    headRole: "HR Manager",
    aliases: ["hr", "people", "human resources", "talent"]
  },
  {
    id: "product",
    name: "Product",
    icon: "layout",
    headId: "EMP-1102",
    headName: "Rohan Varma",
    headRole: "Lead Product Designer",
    aliases: ["design", "ux"]
  },
  {
    id: "finance",
    name: "Finance",
    icon: "dollar-sign",
    headId: "EMP-1201",
    headName: "Kavita Rao",
    headRole: "Lead Payroll Accountant",
    aliases: ["accounts", "payroll"]
  },
  {
    id: "sales",
    name: "Sales",
    icon: "trending-up",
    headId: "EMP-1301",
    headName: "Vikram Malhotra",
    headRole: "Head of Enterprise Sales",
    aliases: ["revenue", "bd", "business development"]
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "megaphone",
    headId: "EMP-1401",
    headName: "Ananya Roy",
    headRole: "Marketing Director",
    aliases: ["growth", "brand"]
  },
  {
    id: "operations",
    name: "Operations",
    icon: "briefcase",
    headId: "EMP-1501",
    headName: "Suresh Menon",
    headRole: "Operations Lead",
    aliases: ["ops", "admin"]
  }
];

export function resolveDepartment(departmentId) {
  if (!departmentId) return null;
  const clean = departmentId.toString().trim().toLowerCase();
  return DEPARTMENTS.find(d =>
    d.id.toLowerCase() === clean ||
    d.name.toLowerCase() === clean ||
    (d.aliases && d.aliases.some(a => a.toLowerCase() === clean))
  ) || null;
}

/**
 * Level 1: Get overview summary for all departments (or scoped to manager)
 */
export function getDepartmentsSummary(date, viewer) {
  const dateKey = date || getKolkataDateKey();
  const todayKey = getKolkataDateKey();
  const isToday = dateKey === todayKey;
  const isWeekend = isWeekendDate(dateKey);
  const isHoliday = isHolidayDate(dateKey);

  const effective = getEffectiveDayRecords(dateKey);
  const isManager = isManagerRole(viewer) && !isHRorAdmin(viewer);

  // Scoped departments
  let visibleDepts = DEPARTMENTS;
  if (isManager && viewer?.dept) {
    const viewerDeptResolved = resolveDepartment(viewer.dept);
    if (viewerDeptResolved) {
      visibleDepts = DEPARTMENTS.filter(d => d.id === viewerDeptResolved.id);
    } else {
      visibleDepts = DEPARTMENTS.filter(d => d.name.toLowerCase() === viewer.dept.toLowerCase());
    }
  }

  let totalOverall = 0;
  let presentOverall = 0;
  let absentOverall = 0;
  let onLeaveOverall = 0;
  let wfhOverall = 0;
  let lateOverall = 0;

  const departmentCards = visibleDepts.map(dept => {
    // All employees in this department
    const deptEmps = employeeData.filter(e =>
      (e.dept || e.department || "").toLowerCase() === dept.name.toLowerCase() ||
      (e.dept || e.department || "").toLowerCase() === dept.id.toLowerCase()
    );

    const totalCount = deptEmps.length;
    let presentCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;
    let wfhCount = 0;
    let lateCount = 0;

    deptEmps.forEach(emp => {
      const rec = effective[emp.id] || null;
      const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

      if (emp.status === "On Leave") {
        onLeaveCount++;
      } else if (hasRecord) {
        const isWfh = rec.mode === "wfh" || rec.workMode === "WFH";
        if (isWfh) {
          wfhCount++;
        } else {
          presentCount++;
        }

        // Late check
        const firstSess = rec.sessions[0];
        if (firstSess?.in) {
          const inDate = new Date(firstSess.in);
          const inMinutes = (inDate.getHours() * 60) + inDate.getMinutes();
          if (inMinutes > (9 * 60) + GRACE_MINUTES) {
            lateCount++;
          }
        }
      } else {
        if (!isWeekend && !isHoliday && !isToday) {
          absentCount++;
        }
      }
    });

    totalOverall += totalCount;
    presentOverall += presentCount;
    absentOverall += absentCount;
    onLeaveOverall += onLeaveCount;
    wfhOverall += wfhCount;
    lateOverall += lateCount;

    // Present rate %: (Present + WFH) / Total
    const effectiveAttended = presentCount + wfhCount;
    const rate = totalCount > 0 ? Math.min(100, Math.round((effectiveAttended / totalCount) * 100)) : 0;

    // Status chip: Good (>=90%), Average (75-89%), Low (<75%), or No employees
    let status = "Good";
    if (totalCount === 0) {
      status = "No employees";
    } else if (rate < 75) {
      status = "Low";
    } else if (rate < 90) {
      status = "Average";
    }

    return {
      id: dept.id,
      name: dept.name,
      icon: dept.icon,
      head: {
        id: dept.headId,
        name: dept.headName,
        role: dept.headRole,
        avatarUrl: null
      },
      totalEmployees: totalCount,
      present: presentCount,
      absent: absentCount,
      onLeave: onLeaveCount,
      wfh: wfhCount,
      late: lateCount,
      attendanceRate: rate,
      status
    };
  });

  return {
    dateKey,
    isToday,
    isWeekend,
    isHoliday,
    overall: {
      total: totalOverall,
      present: presentOverall,
      absent: absentOverall,
      onLeave: onLeaveOverall,
      wfh: wfhOverall,
      late: lateOverall
    },
    departments: departmentCards,
    isScopedToManager: isManager
  };
}

/**
 * Level 2: Get detailed attendance for a specific department
 */
export function getDepartmentAttendance(departmentId, date, filters = {}, page = 1, pageSize = 10, viewer) {
  const dept = resolveDepartment(departmentId);
  if (!dept) {
    return { notFound: true, departmentId };
  }

  // Manager role guard: Manager can only access their own department
  const isManager = isManagerRole(viewer) && !isHRorAdmin(viewer);
  if (isManager && viewer?.dept) {
    const viewerDeptResolved = resolveDepartment(viewer.dept);
    if (viewerDeptResolved && viewerDeptResolved.id !== dept.id) {
      return { accessDenied: true, departmentId, departmentName: dept.name };
    }
  }

  const dateKey = date || getKolkataDateKey();
  const todayKey = getKolkataDateKey();
  const isToday = dateKey === todayKey;
  const isWeekend = isWeekendDate(dateKey);
  const isHoliday = isHolidayDate(dateKey);
  const holidayInfo = isHoliday ? getHolidayByDate(dateKey) : null;
  const now = Date.now();

  const effective = getEffectiveDayRecords(dateKey);
  const auditLog = loadAttendanceAuditLog();

  // Department employees
  const deptEmps = employeeData.filter(e =>
    (e.dept || e.department || "").toLowerCase() === dept.name.toLowerCase() ||
    (e.dept || e.department || "").toLowerCase() === dept.id.toLowerCase()
  );

  let totalCount = deptEmps.length;
  let presentCount = 0;
  let absentCount = 0;
  let onLeaveCount = 0;
  let wfhCount = 0;
  let lateCount = 0;
  let earlyOutCount = 0;
  let notCheckedInCount = 0;

  const rows = deptEmps.map(emp => {
    const rec = effective[emp.id] || null;
    const hasRecord = !!(rec && Array.isArray(rec.sessions) && rec.sessions.length > 0);

    let status = "Not Checked In";
    let checkIn = "--";
    let checkOut = "--";
    let breakDuration = "--";
    let totalHours = "--";
    let netMs = 0;
    let breakMs = 0;
    let isWorking = false;
    let isLate = false;
    let lateMinutes = 0;
    let isEarlyOut = false;
    let earlyReason = null;
    let mode = rec?.mode === "wfh" || rec?.workMode === "WFH" ? "WFH" : "Office";
    const shiftName = "09:00 AM - 06:00 PM (General)";

    const dayAudit = auditLog.find(a => a.employeeId === emp.id && a.dateKey === dateKey);

    if (emp.status === "On Leave") {
      status = "On Leave";
      onLeaveCount++;
    } else if (hasRecord) {
      const sess = rec.sessions;
      const firstSess = sess[0];
      const lastSess = sess[sess.length - 1];

      checkIn = firstSess?.in ? formatKolkataTime(firstSess.in) : "--";
      checkOut = lastSess?.out ? formatKolkataTime(lastSess.out) : (isToday ? "Working" : "--");
      isWorking = isToday && !lastSess?.out;

      let gross = 0;
      sess.forEach(s => {
        const inT = new Date(s.in).getTime();
        const outT = s.out ? new Date(s.out).getTime() : (isToday ? now : inT);
        gross += Math.max(0, outT - inT);
      });

      (rec.breaks || []).forEach(b => {
        const bStart = new Date(b.start).getTime();
        const bEnd = b.end ? new Date(b.end).getTime() : (isToday ? now : bStart);
        breakMs += Math.max(0, bEnd - bStart);
      });

      netMs = Math.max(0, gross - breakMs);
      totalHours = formatHoursWorked(netMs);
      breakDuration = formatDuration(breakMs);

      // Late rule (> 09:15 AM)
      if (firstSess?.in) {
        const inDate = new Date(firstSess.in);
        const inMinutes = (inDate.getHours() * 60) + inDate.getMinutes();
        if (inMinutes > (9 * 60) + GRACE_MINUTES) {
          isLate = true;
          lateMinutes = inMinutes - (9 * 60);
          lateCount++;
        }
      }

      // Early out rule
      if (rec.earlyOut || sess.some(s => s.earlyOut)) {
        isEarlyOut = true;
        earlyReason = rec.reason || rec.earlyReason || "Early check-out";
        earlyOutCount++;
      }

      if (!isToday && checkOut !== "--" && netMs < HALF_DAY_MS && netMs > 0) {
        status = "Half Day";
      } else if (isEarlyOut) {
        status = "Early Out";
      } else if (mode === "WFH") {
        status = "WFH";
      } else {
        status = "Present";
      }

      if (mode === "WFH") wfhCount++;
      else presentCount++;
    } else {
      if (isWeekend) {
        status = "Weekend";
      } else if (isHoliday) {
        status = "Holiday";
      } else if (isToday) {
        status = "Not Checked In";
        notCheckedInCount++;
      } else {
        status = "Absent";
        absentCount++;
      }
    }

    return {
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      dept: dept.name,
      role: emp.role,
      avatarUrl: emp.avatarUrl || null,
      location: "Hyderabad",
      shift: shiftName,
      checkIn,
      checkOut,
      breakDuration,
      totalHours,
      netMs,
      breakMs,
      mode,
      status,
      isWorking,
      isLate,
      lateMinutes,
      isEarlyOut,
      earlyReason,
      isEdited: Boolean(dayAudit),
      auditInfo: dayAudit || null,
      rawRecord: rec
    };
  });

  // Apply filters
  const {
    search = "",
    status: statusFilter = "All",
    mode: modeFilter = "All",
    shift: shiftFilter = "All"
  } = filters;

  const filtered = rows.filter(row => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = row.name.toLowerCase().includes(q);
      const matchId = row.employeeId.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    if (modeFilter !== "All" && row.mode !== modeFilter) {
      return false;
    }

    if (statusFilter !== "All") {
      const sLower = statusFilter.toLowerCase();
      const rowStatusLower = row.status.toLowerCase();

      if (sLower === "present" && (rowStatusLower === "present" || rowStatusLower === "wfh")) return true;
      if (sLower === "absent" && rowStatusLower === "absent") return true;
      if (sLower === "late" && row.isLate) return true;
      if (sLower === "early out" && row.isEarlyOut) return true;
      if (sLower === "wfh" && row.mode === "WFH") return true;
      if (sLower === "on leave" && rowStatusLower === "on leave") return true;
      if (sLower === "not checked in" && (rowStatusLower === "not checked in" || (!row.hasRecord && !isWeekend && !isHoliday))) return true;
      if (sLower === "working" && row.isWorking) return true;

      return rowStatusLower.includes(sLower);
    }

    if (shiftFilter !== "All" && !row.shift.includes(shiftFilter)) {
      return false;
    }

    return true;
  });

  // Pagination (10 per page default)
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.ceil(filtered.length / size) || 1;
  const paginatedEmployees = filtered.slice((p - 1) * size, p * size);

  const summaryCards = {
    total: totalCount,
    present: presentCount,
    absent: absentCount,
    onLeave: onLeaveCount,
    wfh: wfhCount,
    late: lateCount,
    earlyOut: earlyOutCount,
    notCheckedIn: notCheckedInCount
  };

  return {
    notFound: false,
    accessDenied: false,
    department: {
      id: dept.id,
      name: dept.name,
      icon: dept.icon,
      head: {
        id: dept.headId,
        name: dept.headName,
        role: dept.headRole,
        avatarUrl: null
      }
    },
    dateKey,
    isToday,
    isWeekend,
    isHoliday,
    holidayInfo,
    summaryCards,
    employees: paginatedEmployees,
    allFilteredEmployees: filtered,
    totalEmployees: totalCount,
    totalFiltered: filtered.length,
    page: p,
    pageSize: size,
    totalPages
  };
}

/**
 * Get pending regularization and WFH requests scoped to a department
 */
export function getDepartmentRequests(departmentId) {
  const dept = resolveDepartment(departmentId);
  if (!dept) {
    return { regularization: [], wfh: [], totalPending: 0 };
  }

  const allReg = loadRegularizationRequests();
  const allWfh = loadWfhRequests();

  const deptReg = allReg.filter(r =>
    (r.dept || "").toLowerCase() === dept.name.toLowerCase() &&
    r.status === "Pending"
  );

  const deptEmpIds = new Set(
    employeeData
      .filter(e => (e.dept || e.department || "").toLowerCase() === dept.name.toLowerCase())
      .map(e => e.id)
  );

  const deptWfh = allWfh.filter(w =>
    (deptEmpIds.has(w.employeeId) || (w.dept || "").toLowerCase() === dept.name.toLowerCase()) &&
    w.status === "Pending"
  );

  return {
    department: dept,
    regularization: deptReg,
    wfh: deptWfh,
    totalPending: deptReg.length + deptWfh.length
  };
}
