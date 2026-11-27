import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { Icon } from '../Icon.jsx';
import { EarlyCheckoutModal } from './EarlyCheckoutModal.jsx';
import { formatHMS } from '../../services/dashboardAttendanceMetrics.js';
import { formatDuration } from '../../utils/format.js';
import { getCurrentLocation } from '../../services/geoLocation.js';

export const HeaderCheckInButton = ({ onTriggerToast, className = "" }) => {
  const {
    state,
    checkIn,
    checkOut,
    workedMs,
    targetMs,
    isUnder9Hours,
    hasCheckedOutToday,
    checkOutFormatted
  } = useAttendance();

  const [isLoading, setIsLoading] = useState(false);
  const [earlyModalOpen, setEarlyModalOpen] = useState(false);

  // Check In handler (never asks for confirmation)
  const handleCheckIn = async (e) => {
    e?.preventDefault();
    if (isLoading || hasCheckedOutToday) return;

    setIsLoading(true);
    let location = null;
    try {
      const locRes = await getCurrentLocation({ timeoutMs: 3000 });
      if (locRes && locRes.ok) location = locRes;
    } catch (err) {}

    const res = await checkIn({ mode: "office", location });
    setIsLoading(false);

    if (res.ok) {
      onTriggerToast?.(`Checked in at ${res.time}`);
    } else {
      onTriggerToast?.(res.error || "Failed to check in");
    }
  };

  // Check Out click handler: < 9 hours prompts modal, >= 9 hours checks out directly
  const handleCheckOutClick = (e) => {
    e?.preventDefault();
    if (isLoading) return;

    if (isUnder9Hours) {
      setEarlyModalOpen(true);
    } else {
      executeDirectCheckOut();
    }
  };

  // Direct check-out handler
  const executeDirectCheckOut = async () => {
    setIsLoading(true);
    let location = null;
    try {
      const locRes = await getCurrentLocation({ timeoutMs: 3000 });
      if (locRes && locRes.ok) location = locRes;
    } catch (err) {}

    const res = await checkOut({ location });
    setIsLoading(false);

    if (res.ok) {
      onTriggerToast?.(`Checked out at ${res.time}. Shift completed!`);
    } else {
      onTriggerToast?.(res.error || "Failed to check out");
    }
  };

  // Early checkout confirmed from modal
  const handleConfirmEarlyCheckOut = async ({ reason, category }) => {
    setEarlyModalOpen(false);
    setIsLoading(true);

    let location = null;
    try {
      const locRes = await getCurrentLocation({ timeoutMs: 3000 });
      if (locRes && locRes.ok) location = locRes;
    } catch (err) {}

    const res = await checkOut({ reason, category, location });
    setIsLoading(false);

    if (res.ok) {
      onTriggerToast?.(`Checked out early at ${res.time}. Reason recorded.`);
    } else {
      onTriggerToast?.(res.error || "Failed to check out");
    }
  };

  const workedFormatted = formatHMS(workedMs);
  const checkOutShortTime = (checkOutFormatted || "").replace(/^0/, "");

  return (
    <>
      <div className={`inline-flex items-center ${className}`}>
        {/* CASE 1: Not Checked In -> Green button, 44px height, 14px radius */}
        {state === "not_checked_in" && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isLoading}
            aria-label="Check in to work"
            className="h-[44px] w-auto max-w-[220px] px-4 rounded-[14px] bg-good/20 text-good border border-good/40 hover:bg-good/30 active:scale-95 transition text-[13px] font-bold shadow-sm cursor-pointer select-none whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-good/50 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Icon name="clock" className="w-4 h-4 text-good shrink-0" />
            <span className="font-semibold">Check In</span>
          </button>
        )}

        {/* CASE 2: Working / Active session -> Amber/Red button with live worked timer, 44px height, 14px radius */}
        {(state === "working" || state === "on_break") && (
          <button
            type="button"
            onClick={handleCheckOutClick}
            disabled={isLoading}
            aria-label="Check out from work"
            className="h-[44px] w-auto max-w-[220px] px-4 rounded-[14px] bg-accent2/20 text-accent2 border border-accent2/40 hover:bg-accent2/30 active:scale-95 transition text-[13px] font-bold shadow-sm cursor-pointer select-none whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-accent2/50 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Icon name="log-out" className="w-4 h-4 text-accent2 shrink-0" />
            <span className="hidden lg:inline font-semibold">Check Out -</span>
            <span className="lg:hidden font-semibold">Check Out</span>
            <span className="hidden lg:inline font-mono tabular-nums font-bold tracking-tight text-ink">{workedFormatted}</span>
          </button>
        )}

        {/* CASE 3: Already Checked Out -> Disabled compact chip, 44px height, 14px radius */}
        {(state === "checked_out" || hasCheckedOutToday) && (
          <button
            type="button"
            disabled={true}
            aria-label="Already checked out today"
            title="You have already checked out today. You can check in again tomorrow."
            className="h-[44px] w-auto max-w-[220px] px-4 rounded-[14px] bg-surface2/60 text-muted border border-line/60 text-[13px] font-semibold cursor-not-allowed select-none opacity-80 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Icon name="check" className="w-4 h-4 text-muted shrink-0" />
            <span className="hidden lg:inline whitespace-nowrap">
              Checked out {checkOutShortTime}
            </span>
            <span className="lg:hidden whitespace-nowrap">
              Checked out
            </span>
          </button>
        )}
      </div>

      {/* Early Checkout Reason Modal */}
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
