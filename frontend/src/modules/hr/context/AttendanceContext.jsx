import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useProfile } from './ProfileContext.jsx';
import {
  getMyToday,
  checkIn as serviceCheckIn,
  checkOut as serviceCheckOut,
  startBreak as serviceStartBreak,
  endBreak as serviceEndBreak,
  formatTime,
  formatDuration,
  formatHoursWorked,
  formatDisplayDate,
  getMyHistory
} from '../services/attendanceLog.js';
import {
  canAccessTeamAttendance,
  getPendingApprovalsCount,
  subscribeAttendanceService,
  formatKolkataTime,
  getKolkataDateKey,
  NINE_HOURS_MS
} from '../services/attendanceService.js';
import { logEvent } from '../services/auditService.js';

const AttendanceContext = createContext(null);

export { NINE_HOURS_MS, getKolkataDateKey, formatKolkataTime };

export const AttendanceProvider = ({ children }) => {
  const { profile: currentUser } = useProfile();

  const [todayData, setTodayData] = useState(() => getMyToday(currentUser));
  const [historyList, setHistoryList] = useState(() => getMyHistory(currentUser, 60));
  const [now, setNow] = useState(() => Date.now());
  const [pendingApprovals, setPendingApprovals] = useState(() => getPendingApprovalsCount(currentUser));

  // Determine role access
  const canAccessTeam = useMemo(() => {
    return canAccessTeamAttendance(currentUser);
  }, [currentUser]);

  // Tab State: Synchronized with URL query param ?tab=my|team and localStorage
  const [attendanceTab, setAttendanceTabState] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/attendance/team")) {
          return "team";
        }
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab");
        if (tabParam === "team" || tabParam === "my") {
          return tabParam;
        }
      }
      const stored = localStorage.getItem("hrms_attendance_tab");
      if (stored === "team" || stored === "my") return stored;
    } catch (e) {}
    return "my";
  });

  // Guard: if user role changes or is non-manager/HR, ensure team tab cannot be opened
  useEffect(() => {
    if (!canAccessTeam && attendanceTab === "team") {
      setAttendanceTabState("my");
      try {
        localStorage.setItem("hrms_attendance_tab", "my");
        const url = new URL(window.location.href);
        url.pathname = "/hr/attendance";
        url.searchParams.set("tab", "my");
        window.history.replaceState({}, "", url.toString());
      } catch (e) {}
    }
  }, [canAccessTeam, attendanceTab]);

  // Tab setter with URL & LocalStorage synchronization
  const setAttendanceTab = useCallback((tab) => {
    const target = tab === "team" && canAccessTeam ? "team" : "my";
    setAttendanceTabState(target);
    try {
      localStorage.setItem("hrms_attendance_tab", target);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (target === "my") {
          url.pathname = "/hr/attendance";
          url.searchParams.set("tab", "my");
        } else {
          url.searchParams.set("tab", "team");
        }
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {}
  }, [canAccessTeam]);

  // Refresh attendance data for currentUser
  const refreshAttendance = useCallback(() => {
    if (!currentUser) return;
    const freshToday = getMyToday(currentUser);
    setTodayData(freshToday);
    const freshHist = getMyHistory(currentUser, 60);
    setHistoryList(freshHist);
    setPendingApprovals(getPendingApprovalsCount(currentUser));
  }, [currentUser]);

  // Reactive subscription to attendance storage and cross-window events
  useEffect(() => {
    refreshAttendance();
    const unsub = subscribeAttendanceService(() => {
      refreshAttendance();
    });

    const handleStorage = (e) => {
      if (e.key === "hrms_attendance_log_v1" || e.key === "hrms_regularization_requests_v1") {
        refreshAttendance();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      unsub();
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshAttendance]);

  // Live second ticker when working or on break
  useEffect(() => {
    const isRunning = todayData?.state === "working" || todayData?.state === "on_break";
    if (!isRunning) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [todayData?.state]);

  // Derived check-in timestamp
  const firstSession = todayData?.sessions?.[0] || null;
  const checkInIso = firstSession?.in || null;
  const checkInTimestamp = checkInIso ? new Date(checkInIso).getTime() : null;

  // Expected check-out time = Check-in time + 9 hours
  const expectedCheckOutIso = useMemo(() => {
    if (!checkInTimestamp) return null;
    return new Date(checkInTimestamp + NINE_HOURS_MS).toISOString();
  }, [checkInTimestamp]);

  // Real-time worked milliseconds (survives refresh: calculated from check-in timestamp & breaks)
  const { grossMs, breakMs, netMs } = useMemo(() => {
    if (!todayData || !Array.isArray(todayData.sessions) || todayData.sessions.length === 0) {
      return { grossMs: 0, breakMs: 0, netMs: 0 };
    }

    let gMs = 0;
    for (const s of todayData.sessions) {
      const inMs = new Date(s.in).getTime();
      const outMs = s.out ? new Date(s.out).getTime() : now;
      gMs += Math.max(0, outMs - inMs);
    }

    let bMs = 0;
    for (const b of (todayData.breaks || [])) {
      const startMs = new Date(b.start).getTime();
      const endMs = b.end ? new Date(b.end).getTime() : now;
      bMs += Math.max(0, endMs - startMs);
    }

    const nMs = Math.max(0, gMs - bMs);
    return { grossMs: gMs, breakMs: bMs, netMs: nMs };
  }, [todayData, now]);

  // Progress toward 9 hours (0 to 100%)
  const progressPercent = useMemo(() => {
    if (!checkInTimestamp) return 0;
    const ratio = netMs / NINE_HOURS_MS;
    return Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }, [checkInTimestamp, netMs]);

  // Current open break (if on break) and its running duration
  const openBreak = useMemo(() => {
    return (todayData?.breaks || []).find(b => b.end === null) || null;
  }, [todayData?.breaks]);

  const currentBreakMs = useMemo(() => {
    if (!openBreak || !openBreak.start) return 0;
    const startMs = new Date(openBreak.start).getTime();
    return Math.max(0, now - startMs);
  }, [openBreak, now]);

  // Is worked time less than 9 hours?
  const isUnder9Hours = netMs < NINE_HOURS_MS;

  // Has checked out today: user had an open session that is now closed, or state === "checked_out"
  const hasCheckedOutToday = useMemo(() => {
    if (!todayData) return false;
    if (todayData.state === "checked_out") return true;
    const hasClosedSession = (todayData.sessions || []).some(s => s.out !== null);
    const hasNoOpenSession = !(todayData.sessions || []).some(s => s.out === null);
    return hasClosedSession && hasNoOpenSession;
  }, [todayData]);

  // Check In action (enforces One session per day)
  const checkIn = useCallback(async ({ mode = "office", location = null } = {}) => {
    if (!currentUser) return { ok: false, error: "User not authenticated" };

    if (hasCheckedOutToday) {
      return {
        ok: false,
        error: "You have already checked out today. You can check in again tomorrow."
      };
    }

    const res = serviceCheckIn(currentUser, { mode, location });
    if (res.ok) {
      refreshAttendance();
      logEvent({
        action: "check_in",
        category: "Attendance",
        module: "Attendance Desk",
        description: `Biometric attendance check-in recorded (${mode === "wfh" ? "WFH" : "Office"} mode)`,
        metadata: { mode, location },
        user: currentUser
      });
    }
    return res;
  }, [currentUser, hasCheckedOutToday, refreshAttendance]);

  // Check Out action (saves reason, earlyOut flag; automatically auto-ends break if currently on break)
  const checkOut = useCallback(async ({
    reason = null,
    category = null,
    location = null
  } = {}) => {
    if (!currentUser) return { ok: false, error: "User not authenticated" };

    // Auto-conclude open break before check out if currently on break
    if (todayData?.state === "on_break" || (todayData?.breaks || []).some(b => b.end === null)) {
      try {
        serviceEndBreak(currentUser);
      } catch (e) {
        console.warn("Auto-ending break prior to check out:", e);
      }
    }

    const early = isUnder9Hours;
    const res = serviceCheckOut(currentUser, {
      location,
      early,
      reason,
      category
    });

    if (res.ok) {
      refreshAttendance();
      logEvent({
        action: early ? "check_out_early" : "check_out",
        category: "Attendance",
        module: "Attendance Desk",
        description: early
          ? `Early check-out recorded before 9 hours (Reason: ${reason || 'Not specified'})`
          : `Standard check-out completed after working hours`,
        metadata: { early, reason, category, location },
        user: currentUser
      });
    }
    return res;
  }, [currentUser, isUnder9Hours, todayData, refreshAttendance]);

  // Break actions
  const startBreak = useCallback(async () => {
    if (!currentUser) return { ok: false, error: "User not authenticated" };
    const res = serviceStartBreak(currentUser);
    if (res.ok) {
      refreshAttendance();
      logEvent({
        action: "start_break",
        category: "Attendance",
        module: "Attendance Desk",
        description: "Started scheduled work break",
        user: currentUser
      });
    }
    return res;
  }, [currentUser, refreshAttendance]);

  const endBreak = useCallback(async () => {
    if (!currentUser) return { ok: false, error: "User not authenticated" };
    const res = serviceEndBreak(currentUser);
    if (res.ok) {
      refreshAttendance();
      logEvent({
        action: "end_break",
        category: "Attendance",
        module: "Attendance Desk",
        description: "Concluded work break and resumed active duty",
        user: currentUser
      });
    }
    return res;
  }, [currentUser, refreshAttendance]);

  // Formatted check-in and check-out strings in Asia/Kolkata
  const checkInFormatted = checkInIso ? formatKolkataTime(checkInIso) : "--";
  const lastClosedSession = [...(todayData?.sessions || [])].reverse().find(s => s.out !== null);
  const checkOutIso = lastClosedSession?.out || null;
  const checkOutFormatted = checkOutIso ? formatKolkataTime(checkOutIso) : "--";
  const expectedCheckOutFormatted = expectedCheckOutIso ? formatKolkataTime(expectedCheckOutIso) : "--";

  const value = {
    todayData,
    state: todayData?.state || "not_checked_in",
    checkInIso,
    checkInTimestamp,
    checkInFormatted,
    checkOutIso,
    checkOutFormatted,
    expectedCheckOutIso,
    expectedCheckOutFormatted,
    grossMs,
    breakMs,
    currentBreakMs,
    openBreak,
    openBreakStart: openBreak?.start || todayData?.openBreakStart || null,
    netMs,
    workedMs: netMs,
    targetMs: NINE_HOURS_MS,
    progressPercent,
    isUnder9Hours,
    hasCheckedOutToday,
    historyList,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    refreshAttendance,
    // Tab & Approvals state
    attendanceTab,
    setAttendanceTab,
    canAccessTeam,
    pendingApprovalsCount: pendingApprovals.totalPending,
    pendingRegularizationCount: pendingApprovals.regularizationCount,
    pendingWfhCount: pendingApprovals.wfhCount
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return ctx;
};
