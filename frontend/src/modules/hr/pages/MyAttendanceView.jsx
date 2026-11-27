import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SecondaryButton } from '../components/Buttons.jsx';
import { AttendanceHistoryTable } from '../components/AttendanceHistoryTable.jsx';
import { AttendanceCalendar } from '../components/AttendanceCalendar.jsx';
import { EarlyCheckoutModal } from '../components/attendance/EarlyCheckoutModal.jsx';
import {
  getMyToday,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  formatDisplayDate,
  formatDate,
  formatTime,
  formatDuration,
  formatClock,
  formatHoursWorked,
  getTodayDateKey,
  subscribeAttendanceStore,
  getShiftMetrics,
  getMyHistory,
  getMyMonth
} from '../services/attendanceLog.js';
import { getCurrentLocation, REQUIRE_LOCATION } from '../services/geoLocation.js';

// Child component that manages live second-by-second updates for Today tab
const TodayTabContent = ({
  todayData,
  todayFormatted,
  selectedMode,
  setSelectedMode,
  isLocating,
  handleCheckInClick,
  handleStartBreak,
  handleEndBreak,
  handleInitiateCheckOut
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (todayData?.state !== "working" && todayData?.state !== "on_break") return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [todayData?.state]);

  const {
    state = "not_checked_in",
    firstIn,
    lastOut,
    inLoc,
    outLoc,
    missedYesterday,
    shiftConfig,
    sessions = [],
    breaks = [],
    lateMinutes = 0,
    openBreakStart
  } = todayData || {};

  let grossMs = 0;
  for (const s of sessions) {
    const inMs = new Date(s.in).getTime();
    grossMs += s.out ? Math.max(0, new Date(s.out).getTime() - inMs) : Math.max(0, now - inMs);
  }

  let breakMs = 0;
  for (const b of breaks) {
    const bStartMs = new Date(b.start).getTime();
    breakMs += b.end ? Math.max(0, new Date(b.end).getTime() - bStartMs) : Math.max(0, now - bStartMs);
  }

  const netMs = Math.max(0, grossMs - breakMs);
  const breakMinutes = Math.floor(breakMs / 60000);
  const breakAllowanceMinutes = shiftConfig?.breakAllowanceMinutes != null ? shiftConfig.breakAllowanceMinutes : 60;
  const breakAllowanceMs = breakAllowanceMinutes * 60 * 1000;
  const breakExceeded = breakMs > breakAllowanceMs;
  const breakExceededMins = breakExceeded ? Math.floor((breakMs - breakAllowanceMs) / 60000) : 0;

  const targetHours = shiftConfig?.requiredHours || 8;
  const targetMs = targetHours * 3600 * 1000;
  const pct = targetMs > 0 ? Math.round((netMs / targetMs) * 100) : 0;

  const shiftName = shiftConfig?.name || "General";
  const shiftStart = shiftConfig?.start12 || "09:00 AM";
  const shiftEnd = shiftConfig?.end12 || "06:00 PM";

  return (
    <div
      role="tabpanel"
      id="tabpanel-today"
      aria-labelledby="tab-today"
      className="att-panel"
    >
      <div className="flex flex-col gap-5">
        {/* Header: Eyebrow, Date, Status Pill, Office/WFH Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="att-eyebrow">
              ACTIVE SHIFT · <b>{shiftName}</b> ({shiftStart} – {shiftEnd} IST)
            </div>
            <div className="font-display font-bold text-ink att-date">
              Today — <span className="font-num">{todayFormatted}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pill */}
            <div
              className={`att-pill ${
                state === "working"
                  ? "good"
                  : state === "on_break"
                  ? "warn"
                  : state === "checked_out"
                  ? "info"
                  : "muted"
              }`}
            >
              <span className={`att-dot ${state === "working" ? "pulse" : ""}`} />
              <span>
                {state === "working"
                  ? "Working"
                  : state === "on_break"
                  ? "On Break"
                  : state === "checked_out"
                  ? "Checked Out"
                  : "Not Checked In"}
              </span>
            </div>

            {/* Office | WFH Segmented Control */}
            <div className="att-seg">
              <button
                type="button"
                onClick={() => setSelectedMode("office")}
                disabled={isLocating}
                className={selectedMode === "office" ? "is-on" : ""}
              >
                Office
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("wfh")}
                disabled={isLocating}
                className={selectedMode === "wfh" ? "is-on" : ""}
              >
                WFH
              </button>
            </div>
          </div>
        </div>

        {/* Missed Yesterday Warning Banner */}
        {missedYesterday && (
          <div className="p-3 rounded-xl bg-warn/15 border border-warn/30 text-warn text-xs flex flex-row items-center gap-2.5">
            <svg className="w-4 h-4 text-warn shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>You did not check out yesterday. Please contact HR to regularize.</span>
          </div>
        )}

        {/* ================= CLEAN TODAY'S ATTENDANCE SECTION (All Lines & Outer/Inner Borders Removed) ================= */}
        <div className="flex flex-col gap-3 p-4 bg-transparent rounded-2xl shadow-none border-0" style={{ border: "none", boxShadow: "none" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-bold text-ink text-sm">Today's Attendance</h3>
                <p className="text-[11px] text-muted">{todayFormatted} (Asia/Kolkata)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface2 text-muted border border-line">
              {state === "working" ? "Working" : state === "on_break" ? "On Break" : state === "checked_out" ? "Checked Out" : "Not Checked In"}
            </span>
          </div>

          {/* Session Timer - Slim Bar & Zero Lines */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted font-medium">Session Timer</span>
              <span className="font-mono font-bold text-ink">{formatClock(netMs)}</span>
            </div>
            
            <div className="w-full bg-surface2 h-1.5 rounded-full overflow-hidden border-0" style={{ border: "none" }}>
              <div className="bg-accent h-full rounded-full transition-all duration-300 border-0" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, border: "none" }}></div>
            </div>
          </div>
        </div>

        {/* Metrics Box (att-metrics): Net Working Time and Target Progress */}
        <div className="att-metrics flex flex-col md:flex-row md:items-center justify-between gap-6 !border-0" style={{ border: "none" }}>
          <div className="flex flex-col gap-1.5">
            <div className="att-label">NET WORKING TIME</div>
            <div
              className={`att-net ${
                state === "on_break"
                  ? "is-paused"
                  : state === "checked_out"
                  ? "is-done"
                  : state === "not_checked_in"
                  ? "is-idle"
                  : ""
              }`}
            >
              {formatClock(netMs)}
            </div>
            <div className="att-sub">
              Target: <span className="font-num font-semibold">08:00:00</span> (8h shift)
            </div>
          </div>

          <div className="flex-1 max-w-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="att-label">SHIFT PROGRESS</span>
              <span className={`att-pct ${pct >= 100 ? "is-done" : ""}`}>{pct}%</span>
            </div>
            <div className="att-bar !h-1.5 !border-0" style={{ height: "6px", border: "none" }}>
              <div
                className={`att-bar-fill !h-full !border-0 ${state === "working" ? "is-live" : ""} ${pct >= 100 ? "is-done" : ""}`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", border: "none" }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted font-num">
              <span>0h</span>
              <span>2h</span>
              <span>4h</span>
              <span>6h</span>
              <span>8h</span>
            </div>
          </div>
        </div>

        {/* Four Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Check-in */}
          <div className="att-card att-fade flex flex-col justify-between" style={{ animationDelay: "0ms" }}>
            <div className="flex items-center justify-between">
              <span className="att-label">CHECK-IN</span>
              <div className="att-icon">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
            </div>
            <div className="my-2">
              <div className="att-value text-ink">
                {firstIn ? formatTime(firstIn) : "--"}
              </div>
            </div>
            <div className="att-sub flex flex-col gap-0.5">
              {lateMinutes > 0 ? (
                <span className="text-warn font-semibold">Late by {lateMinutes}m</span>
              ) : inLoc?.shared && inLoc?.label ? (
                <span className="truncate" title={inLoc.label}>{inLoc.label}</span>
              ) : (
                <span>{firstIn ? "Punched in" : "Not recorded"}</span>
              )}
              {inLoc?.lat != null && inLoc?.lon != null && (
                <a
                  href={`https://www.google.com/maps?q=${inLoc.lat},${inLoc.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                >
                  <span>Open in Maps</span>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Card 2: Gross Hours */}
          <div className="att-card att-fade flex flex-col justify-between" style={{ animationDelay: "60ms" }}>
            <div className="flex items-center justify-between">
              <span className="att-label">GROSS HOURS</span>
              <div className="att-icon">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="my-2">
              <div className="att-value text-ink">
                {grossMs > 0 ? formatDuration(grossMs) : "--"}
              </div>
            </div>
            <div className="att-sub">
              Total shift elapsed time
            </div>
          </div>

          {/* Card 3: Break Duration */}
          <div
            className={`att-card att-fade flex flex-col justify-between ${state === "on_break" ? "is-break" : ""}`}
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="att-label">BREAK DURATION</span>
              <div className="att-icon">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
            </div>
            <div className="my-2">
              <div className="att-value text-ink">
                {breakMs > 0 ? `${breakMinutes}m` : "--"}
              </div>
            </div>
            <div className="att-sub">
              {state === "on_break" && openBreakStart ? (
                <span className="text-warn font-semibold">On break since {formatTime(openBreakStart)}</span>
              ) : breakExceeded ? (
                <span className="text-warn font-semibold">Exceeded by {breakExceededMins}m</span>
              ) : (
                <span>{breakAllowanceMinutes}m allowance (1h)</span>
              )}
            </div>
          </div>

          {/* Card 4: Net Working */}
          <div
            className={`att-card att-fade flex flex-col justify-between ${state === "working" ? "is-live" : ""}`}
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="att-label">NET WORKING</span>
              <div className="att-icon">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
            </div>
            <div className="my-2">
              <div className="att-value text-ink">
                {netMs > 0 ? formatDuration(netMs) : "--"}
              </div>
            </div>
            <div className="att-sub">
              {state === "working" ? (
                <span className="text-good font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
                  Live session counting
                </span>
              ) : (
                <span>Net productive hours</span>
              )}
            </div>
          </div>
        </div>

        {/* Check-out Location Information if present */}
        {outLoc && (
          <div className="text-[11.5px] flex flex-row items-center gap-1.5 text-muted px-1">
            <svg className={`w-3.5 h-3.5 shrink-0 ${outLoc.shared ? 'text-accent' : 'text-warn'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className={outLoc.shared ? "text-muted" : "text-warn"}>
              {outLoc.shared ? `Check-out location: ${outLoc.label}` : "Check-out location not shared"}
            </span>
          </div>
        )}

        {/* Action Buttons: Left and Right */}
        <div className="flex flex-row flex-wrap gap-3">
          {/* Left Action Button (Check In, Start Break, End Break, Checked Out) */}
          {state === "not_checked_in" ? (
            <button
              type="button"
              onClick={handleCheckInClick}
              disabled={isLocating}
              className="att-btn att-btn--solid"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>{isLocating ? "Getting location…" : "Check In"}</span>
            </button>
          ) : state === "working" ? (
            <button
              type="button"
              onClick={handleStartBreak}
              disabled={isLocating}
              className="att-btn att-btn--tint"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
              <span>Start Break</span>
            </button>
          ) : state === "on_break" ? (
            <button
              type="button"
              onClick={handleEndBreak}
              disabled={isLocating}
              className="att-btn att-btn--warn"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              <span>End Break</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              title="You have already checked out today. You can check in again tomorrow."
              className="att-btn att-btn--tint opacity-60 cursor-not-allowed"
            >
              <span>Checked out at {lastOut ? formatTime(lastOut) : "--"}</span>
            </button>
          )}

          {/* Right Action Button (Check Out) */}
          <button
            type="button"
            onClick={handleInitiateCheckOut}
            disabled={state !== "working" || isLocating}
            title={
              state === "not_checked_in"
                ? "Not Checked In"
                : state === "on_break"
                ? "End your break first"
                : state === "checked_out"
                ? "Already checked out today"
                : undefined
            }
            className="att-btn att-btn--solid"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{isLocating && state === "working" ? "Getting location…" : "Check Out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const MyAttendanceView = ({ currentUser, onTriggerToast }) => {
  // Read active tab from sessionStorage on mount, then clear the key
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const stored = sessionStorage.getItem("hrms_myattendance_tab");
      if (stored) {
        sessionStorage.removeItem("hrms_myattendance_tab");
        return stored;
      }
    } catch (e) {}
    return "today";
  });

  const [todayData, setTodayData] = useState(() => getMyToday(currentUser));
  const [selectedMode, setSelectedMode] = useState(() => todayData?.mode || "office");
  const [isLocating, setIsLocating] = useState(false);

  // Modals state
  const [confirmCheckOutOpen, setConfirmCheckOutOpen] = useState(false);
  const [earlyCheckoutModalOpen, setEarlyCheckoutModalOpen] = useState(false);
  const [locationDialog, setLocationDialog] = useState(null); // { reason, action: "checkIn" | "checkOut" }

  // Calendar tab state: default to current month and year
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(11); // 1-12 (November)
  const [selectedCalendarDetail, setSelectedCalendarDetail] = useState(null);

  // Sync data
  const refreshData = useCallback(() => {
    const fresh = getMyToday(currentUser);
    setTodayData(fresh);
    if (fresh?.mode) {
      setSelectedMode(fresh.mode);
    }
  }, [currentUser]);

  // Periodic refresh & cross-tab sync
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    const unsub = subscribeAttendanceStore(refreshData);

    const handleStorage = (e) => {
      if (e.key === "hrms_attendance_log_v1") {
        refreshData();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      unsub();
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshData]);

  // Today formatted string
  const todayFormatted = useMemo(() => {
    return formatDisplayDate(getTodayDateKey());
  }, []);

  // Shift metrics for checkout early warnings
  const shiftMetrics = useMemo(() => {
    return getShiftMetrics(todayData, Date.now());
  }, [todayData]);

  // History dataset (last 30 calendar days for logged-in user)
  const historyData = useMemo(() => {
    return getMyHistory(currentUser, 30);
  }, [currentUser, todayData]);

  // Calendar dataset for selected month
  const monthDays = useMemo(() => {
    return getMyMonth(currentUser, calendarYear, calendarMonth);
  }, [currentUser, calendarYear, calendarMonth, todayData]);

  // Actions
  const executeCheckIn = useCallback((modeToUse, locationObj) => {
    const res = checkIn(currentUser, {
      mode: modeToUse,
      location: locationObj
    });
    if (res.ok) {
      onTriggerToast?.(`Checked in at ${res.time}`);
      refreshData();
    } else {
      onTriggerToast?.(res.error || "Failed to check in");
    }
  }, [currentUser, onTriggerToast, refreshData]);

  const executeCheckOut = useCallback((locationObj) => {
    const isEarly = !shiftMetrics.shiftComplete;
    const res = checkOut(currentUser, {
      location: locationObj,
      early: isEarly
    });
    if (res.ok) {
      onTriggerToast?.(`Checked out at ${res.time}. Shift completed! Great work today.`);
      refreshData();
    } else {
      onTriggerToast?.(res.error || "Failed to check out");
    }
  }, [currentUser, shiftMetrics.shiftComplete, onTriggerToast, refreshData]);

  const handleCheckInClick = async () => {
    setIsLocating(true);
    const locRes = await getCurrentLocation({ timeoutMs: 10000 });
    setIsLocating(false);

    if (locRes.ok) {
      executeCheckIn(selectedMode, locRes);
    } else {
      setLocationDialog({
        reason: locRes.reason,
        action: "checkIn"
      });
    }
  };

  const handleInitiateCheckOut = () => {
    const netWorked = shiftMetrics.netWorkedMs || 0;
    if (netWorked < 9 * 3600 * 1000) {
      setEarlyCheckoutModalOpen(true);
    } else {
      handleConfirmCheckOut();
    }
  };

  const handleConfirmEarlyCheckOut = async ({ reason, category }) => {
    setEarlyCheckoutModalOpen(false);
    setIsLocating(true);
    const locRes = await getCurrentLocation({ timeoutMs: 10000 });
    setIsLocating(false);

    const loc = locRes?.ok ? locRes : { shared: false, label: "Location not shared" };
    const res = checkOut(currentUser, {
      location: loc,
      early: true,
      reason,
      category
    });

    if (res.ok) {
      onTriggerToast?.(`Checked out early at ${res.time}. Reason recorded.`);
      refreshData();
    } else {
      onTriggerToast?.(res.error || "Failed to check out");
    }
  };

  const handleConfirmCheckOut = async () => {
    setConfirmCheckOutOpen(false);
    setIsLocating(true);
    const locRes = await getCurrentLocation({ timeoutMs: 10000 });
    setIsLocating(false);

    if (locRes.ok) {
      executeCheckOut(locRes);
    } else {
      setLocationDialog({
        reason: locRes.reason,
        action: "checkOut"
      });
    }
  };

  const handleStartBreak = () => {
    const res = startBreak(currentUser);
    if (res.ok) {
      onTriggerToast?.("Break started");
      refreshData();
    } else {
      onTriggerToast?.(res.error || "Failed to start break");
    }
  };

  const handleEndBreak = () => {
    const res = endBreak(currentUser);
    if (res.ok) {
      onTriggerToast?.("Break ended");
      refreshData();
    } else {
      onTriggerToast?.(res.error || "Failed to end break");
    }
  };

  const handleRetryLocation = async (action) => {
    setLocationDialog(null);
    setIsLocating(true);
    const locRes = await getCurrentLocation({ timeoutMs: 10000 });
    setIsLocating(false);

    if (locRes.ok) {
      if (action === "checkIn") {
        executeCheckIn(selectedMode, locRes);
      } else {
        executeCheckOut(locRes);
      }
    } else {
      setLocationDialog({
        reason: locRes.reason,
        action
      });
    }
  };

  const handleProceedWithoutLocation = (action) => {
    setLocationDialog(null);
    const unsharedLoc = { shared: false, label: "Location not shared" };
    if (action === "checkIn") {
      executeCheckIn(selectedMode, unsharedLoc);
    } else {
      executeCheckOut(unsharedLoc);
    }
  };

  // Keyboard navigation for tabs
  const handleTabKeyDown = (e, currentId) => {
    const tabs = ["today", "history", "calendar"];
    const idx = tabs.indexOf(currentId);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % tabs.length;
      setActiveTab(tabs[next]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prev]);
    }
  };

  // Calendar navigation
  const isCurrentMonthOrLater = calendarYear > 2026 || (calendarYear === 2026 && calendarMonth >= 11);

  const handlePrevMonth = () => {
    setSelectedCalendarDetail(null);
    if (calendarMonth === 1) {
      setCalendarYear(y => y - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonthOrLater) return;
    setSelectedCalendarDetail(null);
    if (calendarMonth === 12) {
      setCalendarYear(y => y + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const monthTitle = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(new Date(calendarYear, calendarMonth - 1, 1));
  }, [calendarYear, calendarMonth]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ================= B1. TABS BAR ================= */}
      <div className="flex flex-row items-center justify-between">
        <div
          className="inline-flex flex-row gap-1 p-1 rounded-xl border border-line bg-surface2"
          role="tablist"
          aria-label="Attendance navigation tabs"
        >
          {[
            { id: "today", label: "Today" },
            { id: "history", label: "History" },
            { id: "calendar", label: "Calendar" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= B2. TODAY TAB ================= */}
      {activeTab === "today" && (
        <TodayTabContent
          todayData={todayData}
          todayFormatted={todayFormatted}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          isLocating={isLocating}
          handleCheckInClick={handleCheckInClick}
          handleStartBreak={handleStartBreak}
          handleEndBreak={handleEndBreak}
          handleInitiateCheckOut={handleInitiateCheckOut}
        />
      )}

      {/* ================= B3. HISTORY TAB ================= */}
      {activeTab === "history" && (
        <div
          role="tabpanel"
          id="tabpanel-history"
          aria-labelledby="tab-history"
          className="glass-card !p-5 border border-line gap-4"
        >
          <AttendanceHistoryTable
            historyData={historyData}
            title="Attendance History"
          />
        </div>
      )}

      {/* ================= B4. CALENDAR TAB ================= */}
      {activeTab === "calendar" && (
        <div
          role="tabpanel"
          id="tabpanel-calendar"
          aria-labelledby="tab-calendar"
          className="glass-card !p-5 border border-line gap-4"
        >
          <AttendanceCalendar
            monthDays={monthDays}
            monthTitle={monthTitle}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            isNextDisabled={isCurrentMonthOrLater}
            selectedDetail={selectedCalendarDetail}
            onSelectDetail={setSelectedCalendarDetail}
          />
        </div>
      )}

      {/* ================= MODAL: CONFIRM CHECK OUT ================= */}
      {confirmCheckOutOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-line rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs">
            <div className="flex flex-row items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-bad/15 text-bad flex items-center justify-center font-bold">
                <svg className="w-4 h-4 text-bad" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-ink text-sm">Check out now?</div>
                <div className="text-muted text-[11px]">Concluding your daily working session</div>
              </div>
            </div>

            <div className="text-ink text-xs flex flex-col gap-1.5">
              <div>
                Net worked: <strong className="font-num font-bold">{formatHoursWorked(todayData.netMs)}</strong> · Breaks: <strong className="font-num font-bold">{formatDuration(todayData.breakMs)}</strong>
              </div>
              {!shiftMetrics.shiftComplete && (
                <div className="mt-1 p-2.5 rounded-lg bg-warn/15 border border-warn/30 text-warn text-xs leading-relaxed">
                  Shift not complete: <span className="font-num font-semibold">{formatDuration(shiftMetrics.netRemainingMs)}</span> net work left. Checking out now is recorded as an early check-out.
                </div>
              )}
            </div>

            <div className="flex flex-row justify-end gap-2 pt-2 border-t border-line">
              <SecondaryButton onClick={() => setConfirmCheckOutOpen(false)}>
                Cancel
              </SecondaryButton>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                className="bg-bad text-white font-semibold px-4 py-2 rounded-xl text-xs hover:bg-bad/90 active:scale-95 transition shadow-md"
              >
                Yes, Check Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: LOCATION ACCESS NEEDED ================= */}
      {locationDialog && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-line rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs">
            <div className="flex flex-row items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-warn/15 text-warn flex items-center justify-center font-bold shrink-0">
                <svg className="w-4 h-4 text-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-ink text-sm">Location access needed</div>
                <div className="text-warn text-[11.5px] font-semibold mt-0.5">
                  {locationDialog.reason === "denied"
                    ? "Location permission was blocked"
                    : locationDialog.reason === "timeout"
                    ? "Location request timed out"
                    : locationDialog.reason === "unavailable"
                    ? "Location is not available on this device"
                    : "Location is not supported on this device"}
                </div>
              </div>
            </div>

            <p className="text-muted text-xs leading-relaxed">
              Click the lock icon in the address bar, open Site settings, set Location to Allow, then try again.
            </p>

            <div className="flex flex-row flex-wrap justify-end gap-2 pt-2 border-t border-line">
              <SecondaryButton onClick={() => setLocationDialog(null)}>
                Cancel
              </SecondaryButton>
              {!REQUIRE_LOCATION && (
                <button
                  type="button"
                  onClick={() => handleProceedWithoutLocation(locationDialog.action)}
                  className="border border-line hover:border-accent text-ink font-semibold px-3 py-1.5 rounded-xl text-xs transition"
                >
                  Continue without location
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRetryLocation(locationDialog.action)}
                className="bg-accent text-on-accent font-bold px-4 py-1.5 rounded-xl text-xs hover:opacity-90 active:scale-95 transition shadow-md"
              >
                Try again
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: EARLY CHECK OUT ================= */}
      <EarlyCheckoutModal
        isOpen={earlyCheckoutModalOpen}
        onClose={() => setEarlyCheckoutModalOpen(false)}
        onConfirm={handleConfirmEarlyCheckOut}
        workedDurationFormatted={formatHoursWorked(shiftMetrics.netWorkedMs || 0)}
        remainingDurationFormatted={formatDuration(Math.max(0, 9 * 3600 * 1000 - (shiftMetrics.netWorkedMs || 0)))}
      />
    </div>
  );
};