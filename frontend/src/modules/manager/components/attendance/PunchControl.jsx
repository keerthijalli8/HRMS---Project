import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { formatMsToHoursMins, formatLiveTimer } from '../../utils/attendanceEngine.js';
import { Clock, Coffee, Check, LogOut, LogIn } from 'lucide-react';

export default function PunchControl({ onNavigateToMine, onTriggerCheckIn, onTriggerCheckOut, onTriggerBreak }) {
  const {
    today,
    isCheckedIn,
    isCheckedOut,
    onBreak,
    liveNetMs,
    activeBreakDurationMs,
    checkIn,
    undoCheckOut,
    requestCheckOut,
    startBreak,
    endBreak,
  } = useAttendance();

  const handleCheckInAction = () => {
    if (onTriggerCheckIn) {
      onTriggerCheckIn();
    } else {
      checkIn({});
    }
  };

  const handleBreakAction = () => {
    if (onTriggerBreak) {
      onTriggerBreak();
    } else if (onBreak) {
      endBreak();
    } else {
      startBreak('Short Break');
    }
  };

  const handleCheckOutAction = () => {
    if (onTriggerCheckOut) {
      onTriggerCheckOut();
    } else {
      requestCheckOut();
    }
  };

  // Already checked out today -> show checked out status (1 check-in per day limit reached)
  if (isCheckedOut) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface2/80 border border-line text-[11.5px] font-semibold text-muted select-none shrink-0"
        title="Shift completed for today. Only 1 check-in per day is permitted."
      >
        <span className="w-2 h-2 rounded-full bg-good shrink-0" />
        <span>Checked out ({today?.checkOut})</span>
      </div>
    );
  }

  // Not checked in yet -> show Check in button
  if (!isCheckedIn) {
    return (
      <button
        type="button"
        onClick={handleCheckInAction}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-display font-bold text-[12px] shadow-sm hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer shrink-0"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--on-accent)',
        }}
      >
        <LogIn size={13} strokeWidth={2.4} />
        <span>Check in</span>
      </button>
    );
  }

  // Checked in: on break vs actively working
  const breakMinutes = Math.floor(activeBreakDurationMs / 60000);
  const breakSeconds = Math.floor((activeBreakDurationMs % 60000) / 1000);
  const breakTimeStr = `${String(breakMinutes).padStart(2, '0')}:${String(breakSeconds).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* 1. Live Timer Pill */}
      <button
        type="button"
        onClick={onNavigateToMine}
        title="Click to view My Attendance details"
        aria-live="polite"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-mono tabular-nums font-semibold transition-all select-none cursor-pointer border ${
          onBreak
            ? 'bg-warn/15 text-warn border-warn/40 hover:bg-warn/25'
            : 'bg-surface2/60 hover:bg-surface2 text-ink border-line'
        }`}
      >
        {onBreak ? (
          <>
            <Coffee size={13} className="animate-pulse text-warn shrink-0" />
            <span>On break {breakTimeStr}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-good shrink-0 animate-pulse" />
            <span className="tabular-nums font-mono font-bold text-ink">{formatLiveTimer(liveNetMs, false)}</span>
          </>
        )}
      </button>

      {/* 2. Break Action Button */}
      <button
        type="button"
        onClick={handleBreakAction}
        title={onBreak ? 'Click to resume work' : 'Take a break'}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-[12px] transition-all select-none cursor-pointer active:scale-95 ${
          onBreak
            ? 'bg-warn text-black hover:brightness-110 border border-warn font-bold shadow-sm'
            : 'bg-surface2/80 hover:bg-surface border border-line text-ink'
        }`}
      >
        <Coffee size={12} className={onBreak ? 'animate-pulse text-black shrink-0' : 'text-muted shrink-0'} />
        <span>{onBreak ? 'End break' : 'Break'}</span>
      </button>

      {/* 3. Check out Button (Mint Stadium Pill) */}
      <button
        type="button"
        onClick={handleCheckOutAction}
        title="Check out and end shift for today"
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-[12px] shadow-sm hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer shrink-0"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--on-accent)',
        }}
      >
        <span>Check out</span>
      </button>
    </div>
  );
}
