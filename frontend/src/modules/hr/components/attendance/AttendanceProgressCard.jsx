import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { Icon } from '../Icon.jsx';
import { calculateMonthlyAttendanceProgress } from '../../services/dashboardAttendanceMetrics.js';
import { MAX_BREAK_MINUTES } from '../../config/attendance.js';

export const AttendanceProgressCard = ({ 
  currentUser, 
  onTriggerToast, 
  onNavigate,
  className = "" 
}) => {
  const {
    state,
    todayData,
    historyList,
    startBreak,
    endBreak,
    breakMs,
    currentBreakMs,
    hasCheckedOutToday
  } = useAttendance();

  const [isLoading, setIsLoading] = useState(false);

  // Calculate monthly stats from real attendance history & calendar
  const progress = useMemo(() => {
    return calculateMonthlyAttendanceProgress(currentUser, historyList, todayData);
  }, [currentUser, historyList, todayData]);

  // Format running break timer: MM:SS or HH:MM:SS
  const formatBreakTimer = (ms) => {
    if (!ms || ms <= 0) return "00:00";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${String(h).padStart(2, '0')}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartBreak = async (e) => {
    e?.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    const res = await startBreak();
    setIsLoading(false);
    if (res.ok) {
      onTriggerToast?.(`Break started at ${res.time}`);
    } else {
      onTriggerToast?.(res.error || "Failed to start break");
    }
  };

  const handleEndBreak = async (e) => {
    e?.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    const res = await endBreak();
    setIsLoading(false);
    if (res.ok) {
      const totalMinutes = Math.floor((breakMs || 0) / 60000);
      if (totalMinutes > MAX_BREAK_MINUTES) {
        onTriggerToast?.(`Break ended at ${res.time}. Note: Break time exceeded ${MAX_BREAK_MINUTES} minutes limit.`);
      } else {
        onTriggerToast?.(`Break ended at ${res.time}`);
      }
    } else {
      onTriggerToast?.(res.error || "Failed to end break");
    }
  };

  return (
    <div className={`glass-card !p-4 border border-line rounded-[20px] flex flex-col justify-between gap-3 h-full text-left shadow-sm ${className}`}>
      {/* 1. Header Row: Calendar Icon & Month Attendance Progress title */}
      <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
        <div 
          onClick={() => {
            try {
              localStorage.setItem("hrms_attendance_tab", "my");
              const url = new URL(window.location.href);
              url.pathname = "/hr/attendance";
              url.searchParams.set("tab", "my");
              window.history.replaceState({}, "", url.toString());
            } catch (e) {}
            onNavigate?.("attendance");
          }}
          className="flex items-center gap-2 cursor-pointer group"
          title="View detailed attendance history"
        >
          <div className="w-7 h-7 rounded-lg bg-surface2 text-accent border border-line flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition">
            <Icon name="calendar" className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-ink text-[15px] leading-tight group-hover:text-accent transition">
              {progress.monthName} Attendance Progress
            </h3>
            <p className="text-[11px] text-muted -mt-0.5">
              Monthly overview & real-time work stats
            </p>
          </div>
        </div>
      </div>

      {/* 2. Mini Summary Row: 4 Compact Stat Blocks in a Grid (Reduced padding & height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-surface2/40 border border-line/70 flex flex-col gap-0.5 text-left">
          <span className="text-[18px] font-bold font-data text-good leading-none">{progress.presentCount}</span>
          <span className="text-[10.5px] text-muted font-medium">Present Days</span>
        </div>
        <div className="p-2.5 rounded-xl bg-surface2/40 border border-line/70 flex flex-col gap-0.5 text-left">
          <span className="text-[18px] font-bold font-data text-accent leading-none">{progress.leaveCount}</span>
          <span className="text-[10.5px] text-muted font-medium">Leaves Taken</span>
        </div>
        <div className="p-2.5 rounded-xl bg-surface2/40 border border-line/70 flex flex-col gap-0.5 text-left">
          <span className="text-[18px] font-bold font-data text-bad leading-none">{progress.absentCount}</span>
          <span className="text-[10.5px] text-muted font-medium">Absent Days</span>
        </div>
        <div className="p-2.5 rounded-xl bg-surface2/40 border border-line/70 flex flex-col gap-0.5 text-left">
          <span className="text-[18px] font-bold font-data text-ink leading-none">{progress.holidaysOffCount}</span>
          <span className="text-[10.5px] text-muted font-medium whitespace-nowrap tracking-tight">Holidays / Off</span>
        </div>
      </div>

      {/* 3. Bottom Section: Two equal-width buttons in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-auto pt-2.5 border-t border-line/50">
        {/* State A: Not checked in -> Disabled Start Break */}
        {state === "not_checked_in" && (
          <button
            type="button"
            disabled
            title="Check in first to take a break"
            aria-label="Start Break (Disabled - Check in first to take a break)"
            className="h-9 w-full rounded-xl bg-surface2/60 text-muted border border-line text-xs font-semibold cursor-not-allowed select-none flex items-center justify-center gap-2 opacity-60 transition"
          >
            <Icon name="coffee" className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Start Break</span>
          </button>
        )}

        {/* State B: Working (not on break) -> Start Break */}
        {state === "working" && (
          <button
            type="button"
            onClick={handleStartBreak}
            disabled={isLoading}
            aria-label="Start Break"
            className="h-9 w-full rounded-xl bg-surface2 hover:bg-surface2/80 text-ink border border-line hover:border-accent active:scale-[0.98] transition text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer select-none focus:outline-none disabled:opacity-50"
          >
            <Icon name="coffee" className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>{isLoading ? "Starting…" : "Start Break"}</span>
          </button>
        )}

        {/* State C: On Break -> End Break - MM:SS */}
        {state === "on_break" && (
          <button
            type="button"
            onClick={handleEndBreak}
            disabled={isLoading}
            aria-label="End Break"
            className="h-9 w-full rounded-xl bg-warn/20 text-warn border border-warn/40 hover:bg-warn/30 active:scale-[0.98] transition text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer select-none focus:outline-none disabled:opacity-50 animate-pulse"
          >
            <Icon name="pause" className="w-3.5 h-3.5 text-warn shrink-0" />
            <span>End Break - <span className="font-mono tabular-nums font-bold text-ink">{formatBreakTimer(currentBreakMs)}</span></span>
          </button>
        )}

        {/* State D: Checked out -> Disabled */}
        {(state === "checked_out" || hasCheckedOutToday) && (
          <button
            type="button"
            disabled
            title="You have already checked out today"
            aria-label="Start Break (Disabled - You have already checked out today)"
            className="h-9 w-full rounded-xl bg-surface2/60 text-muted border border-line text-xs font-semibold cursor-not-allowed select-none flex items-center justify-center gap-2 opacity-60 transition"
          >
            <Icon name="coffee" className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Start Break</span>
          </button>
        )}

        {/* Apply Leave Button */}
        <button
          type="button"
          onClick={() => onNavigate?.("leave")}
          className="h-9 w-full rounded-xl bg-surface2 hover:bg-surface2/80 text-ink border border-line hover:border-accent text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98]"
        >
          <Icon name="calendar" className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Apply Leave</span>
        </button>
      </div>
    </div>
  );
};