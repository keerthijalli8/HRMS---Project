import React, { useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { formatClock, formatDuration } from '../../utils/format.js';
import { Icon } from '../Icon.jsx';

export const WorkTimer = ({ className = "" }) => {
  const {
    state,
    checkInIso,
    checkInFormatted,
    expectedCheckOutFormatted,
    workedMs,
    breakMs,
    targetMs,
    progressPercent,
    isUnder9Hours
  } = useAttendance();

  // Format live timer HH:MM:SS
  const timerDisplay = useMemo(() => {
    return formatClock(workedMs);
  }, [workedMs]);

  // If not checked in, show placeholder
  if (state === "not_checked_in" || !checkInIso) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Session Timer</span>
          <span className="font-num font-semibold text-muted">00:00:00</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden border border-line/40">
          <div className="h-full bg-accent/30 w-0" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface2/40 border border-line/60 ${className}`}>
      {/* Top Row: Running Timer & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${state === "on_break" ? "bg-warn" : "bg-good animate-pulse"}`} />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {state === "on_break" ? "On Break" : "Live Working Time"}
          </span>
        </div>

        <div className="font-num font-extrabold text-lg md:text-xl text-ink tracking-tight tabular-nums">
          {timerDisplay}
        </div>
      </div>

      {/* Progress Bar toward 9-hour goal */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-2 rounded-full bg-surface2/80 overflow-hidden border border-line/50 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100
                ? "bg-good"
                : "bg-gradient-to-r from-accent via-accent2 to-accent"
            }`}
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Daily shift working hours progress"
          />
        </div>

        {/* Progress & Target Milestone labels */}
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>
            Goal: <strong className="text-ink font-num">9h 00m</strong> ({progressPercent}%)
          </span>
          <span>
            Target Out: <strong className="text-accent font-num">{expectedCheckOutFormatted}</strong>
          </span>
        </div>
      </div>

      {/* Additional status summary footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/40 text-[11px]">
        <span className="text-muted">
          Checked in at: <strong className="text-ink font-num">{checkInFormatted}</strong>
        </span>
        {breakMs > 0 && (
          <span className="text-muted inline-flex items-center gap-1">
            <Icon name="coffee" className="w-3.5 h-3.5 text-warn" />
            <span>Break: <strong className="text-ink font-num">{formatDuration(breakMs)}</strong></span>
          </span>
        )}
        <span className={`font-semibold ${isUnder9Hours ? "text-warn" : "text-good"}`}>
          {isUnder9Hours
            ? `${formatDuration(Math.max(0, targetMs - workedMs))} remaining`
            : "Shift Goal Reached ✓"}
        </span>
      </div>
    </div>
  );
};
