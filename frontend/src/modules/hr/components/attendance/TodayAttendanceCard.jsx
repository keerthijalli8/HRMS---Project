import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { WorkTimer } from './WorkTimer.jsx';
import { CheckInOutButton } from './CheckInOutButton.jsx';
import { formatDisplayDate, getTodayDateKey } from '../../services/attendanceLog.js';
import { WfhRequestModal } from '../wfo/WfhRequestModal.jsx';
import { Icon } from '../Icon.jsx';

export const TodayAttendanceCard = ({ currentUser, onTriggerToast }) => {
  const {
    state,
    checkInFormatted,
    expectedCheckOutFormatted,
    checkOutFormatted
  } = useAttendance();

  const [selectedMode, setSelectedMode] = useState("office");
  const [wfhModalOpen, setWfhModalOpen] = useState(false);

  // Today formatted banner (Asia/Kolkata)
  const todayFormatted = useMemo(() => {
    return formatDisplayDate(getTodayDateKey());
  }, []);

  return (
    <div className="bg-transparent p-2 sm:p-4 flex flex-col gap-4 relative overflow-hidden">
      {/* 1. Header Row (No border) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4 text-accent" />
            <h2 className="font-display text-base sm:text-lg font-bold text-ink leading-tight">
              Today's Attendance
            </h2>
            <span className="text-[11px] font-semibold text-muted bg-white/5 px-2.5 py-0.5 rounded-full">
              Shift: 09:00 AM – 06:00 PM
            </span>
          </div>
          <div className="text-xs text-muted font-medium">
            {todayFormatted} (Asia/Kolkata)
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {state === "not_checked_in" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-muted bg-white/5">
              <span className="w-2 h-2 rounded-full bg-muted" />
              <span>Not Checked In</span>
            </span>
          )}
          {state === "working" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-good bg-good/15">
              <span className="w-2 h-2 rounded-full bg-good animate-pulse" />
              <span>Working</span>
            </span>
          )}
          {state === "on_break" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-warn bg-warn/15">
              <span className="w-2 h-2 rounded-full bg-warn" />
              <span>On Break</span>
            </span>
          )}
          {state === "checked_out" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-info bg-info/15">
              <span className="w-2 h-2 rounded-full bg-info" />
              <span>Checked Out</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Live Second-by-Second Timer & Target Progress Bar (Borderless) */}
      <WorkTimer />

      {/* 3. Action Controls & WFH Request */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          {state === "not_checked_in" && (
            <div className="inline-flex items-center bg-white/5 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedMode("office")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedMode === "office"
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                Office
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("wfh")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedMode === "wfh"
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                WFH
              </button>
            </div>
          )}

          {/* Core Check In / Check Out / Break Button Controller */}
          <CheckInOutButton
            selectedMode={selectedMode}
            onTriggerToast={onTriggerToast}
          />
        </div>

        {/* Right Action: Request WFH Pass */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWfhModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer"
          >
            <Icon name="calendar" className="w-3.5 h-3.5 text-accent" />
            <span>Request WFH Pass</span>
          </button>
        </div>
      </div>

      {/* WFH Request Modal */}
      <WfhRequestModal
        isOpen={wfhModalOpen}
        onClose={() => setWfhModalOpen(false)}
        currentUser={currentUser}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
};