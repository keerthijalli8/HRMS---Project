import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { EarlyCheckoutModal } from './EarlyCheckoutModal.jsx';
import { formatDuration } from '../../utils/format.js';
import { getCurrentLocation } from '../../services/geoLocation.js';

export const CheckInOutButton = ({
  selectedMode = "office",
  onTriggerToast,
  className = ""
}) => {
  const {
    state,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    workedMs,
    targetMs,
    isUnder9Hours,
    hasCheckedOutToday,
    checkOutFormatted
  } = useAttendance();

  const [isLocating, setIsLocating] = useState(false);
  const [earlyModalOpen, setEarlyModalOpen] = useState(false);

  // Check In handler
  const handleCheckIn = async () => {
    setIsLocating(true);
    let location = null;
    try {
      const locRes = await getCurrentLocation({ timeoutMs: 6000 });
      if (locRes && locRes.ok) {
        location = locRes;
      }
    } catch (e) {}
    setIsLocating(false);

    const res = await checkIn({ mode: selectedMode, location });
    if (res.ok) {
      onTriggerToast?.(`Checked in at ${res.time}. Status set to Working.`);
    } else {
      onTriggerToast?.(res.error || "Failed to check in");
    }
  };

  // Check Out click handler: checks if worked time is < 9 hours
  const handleCheckOutClick = () => {
    if (isUnder9Hours) {
      // Worked less than 9 hours: prompt early checkout modal
      setEarlyModalOpen(true);
    } else {
      // 9 or more hours worked: direct checkout
      executeDirectCheckOut();
    }
  };

  // Direct checkout (>= 9 hours)
  const executeDirectCheckOut = async () => {
    setIsLocating(true);
    let location = null;
    try {
      const locRes = await getCurrentLocation({ timeoutMs: 6000 });
      if (locRes && locRes.ok) {
        location = locRes;
      }
    } catch (e) {}
    setIsLocating(false);

    const res = await checkOut({ location });
    if (res.ok) {
      onTriggerToast?.(`Checked out at ${res.time}. Shift completed! Great work today.`);
    } else {
      onTriggerToast?.(res.error || "Failed to check out");
    }
  };

  // Early checkout confirmation from modal
  const handleConfirmEarlyCheckOut = async ({ reason, category }) => {
    setEarlyModalOpen(false);

    setIsLocating(true);
    let location = null;
    try {
      const locRes = await getCurrentLocation({ timeoutMs: 6000 });
      if (locRes && locRes.ok) {
        location = locRes;
      }
    } catch (e) {}
    setIsLocating(false);

    const res = await checkOut({ reason, category, location });
    if (res.ok) {
      onTriggerToast?.(`Checked out early at ${res.time}. Reason recorded.`);
    } else {
      onTriggerToast?.(res.error || "Failed to check out");
    }
  };

  // Break handlers
  const handleStartBreak = async () => {
    const res = await startBreak();
    if (res.ok) {
      onTriggerToast?.(`Break started at ${res.time}`);
    } else {
      onTriggerToast?.(res.error || "Failed to start break");
    }
  };

  const handleEndBreak = async () => {
    const res = await endBreak();
    if (res.ok) {
      onTriggerToast?.(`Break ended at ${res.time}`);
    } else {
      onTriggerToast?.(res.error || "Failed to end break");
    }
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
        {/* CASE 1: Not checked in yet */}
        {state === "not_checked_in" && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isLocating}
            className="bg-accent text-on-accent font-bold px-5 py-2 rounded-xl text-xs hover:opacity-90 active:scale-95 transition shadow-md disabled:opacity-50 cursor-pointer"
            aria-label="Check In for work today"
          >
            {isLocating ? "Getting location…" : "Check In"}
          </button>
        )}

        {/* CASE 2: Working (Active session) */}
        {state === "working" && (
          <>
            <button
              type="button"
              onClick={handleStartBreak}
              disabled={isLocating}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-line hover:border-accent hover:bg-surface2 text-ink transition disabled:opacity-50 cursor-pointer"
            >
              Start Break
            </button>

            <button
              type="button"
              onClick={handleCheckOutClick}
              disabled={isLocating}
              className="bg-bad text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-bad/90 active:scale-95 transition shadow-md disabled:opacity-50 cursor-pointer"
              aria-label="Check Out from work today"
            >
              {isLocating ? "Getting location…" : "Check Out"}
            </button>
          </>
        )}

        {/* CASE 3: On Break */}
        {state === "on_break" && (
          <>
            <button
              type="button"
              onClick={handleEndBreak}
              disabled={isLocating}
              className="bg-accent text-on-accent font-bold px-5 py-2 rounded-xl text-xs hover:opacity-90 active:scale-95 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              End Break
            </button>

            <button
              type="button"
              onClick={handleCheckOutClick}
              disabled={isLocating}
              className="bg-bad text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-bad/90 active:scale-95 transition shadow-md disabled:opacity-50 cursor-pointer"
              aria-label="Check Out from work today"
            >
              {isLocating ? "Getting location…" : "Check Out"}
            </button>
          </>
        )}

        {/* CASE 4: Already checked out today (One session per day rule) */}
        {state === "checked_out" && (
          <button
            type="button"
            disabled={true}
            title="You have already checked out today. You can check in again tomorrow."
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2/60 border border-line/60 text-muted cursor-not-allowed select-none transition"
            aria-disabled="true"
          >
            Checked out at {checkOutFormatted}
          </button>
        )}
      </div>

      {/* Early Checkout Modal */}
      <EarlyCheckoutModal
        isOpen={earlyModalOpen}
        onClose={() => setEarlyModalOpen(false)}
        onConfirm={handleConfirmEarlyCheckOut}
        workedDurationFormatted={formatDuration(workedMs)}
        remainingDurationFormatted={formatDuration(Math.max(0, targetMs - workedMs))}
      />
    </>
  );
};
