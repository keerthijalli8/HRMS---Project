import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';

export const DayDetailDrawer = ({
  isOpen,
  onClose,
  dayData,
  onRequestRegularization
}) => {
  const drawerRef = useRef(null);

  // Focus management & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dayData) return null;

  const {
    dateKey,
    formattedDate,
    weekday,
    status,
    type,
    checkIn,
    checkOut,
    breakDuration,
    totalHours,
    mode,
    earlyOut,
    earlyReason,
    isLate,
    lateMinutes,
    isMissedCheckOut,
    isEdited,
    auditInfo,
    locationLabel,
    holidayName,
    isWeekend,
    isHoliday,
    isFuture
  } = dayData;

  const isPresent = type === "present" || status === "Present";
  const isWfh = type === "wfh" || status === "WFH";
  const isHalfDay = type === "half_day" || status === "Half Day";
  const isAbsent = type === "absent" || status === "Absent";
  const isMissed = isMissedCheckOut || status === "Missed Check Out";

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-drawer-title"
        className="relative w-full max-w-md bg-[#061720]/95 backdrop-blur-2xl border-l border-line h-full flex flex-col justify-between p-6 shadow-2xl text-ink z-10 overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Daily Attendance Record
              </div>
              <h2 id="day-drawer-title" className="font-display font-bold text-lg text-ink">
                {formattedDate || dateKey}
              </h2>
              <div className="text-xs text-muted mt-0.5">{weekday}</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
              aria-label="Close day details"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge Banner */}
          <div className="p-3 rounded-2xl bg-surface2/60 border border-line flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isPresent
                  ? "bg-good/15 text-good border-good/40"
                  : isWfh
                  ? "bg-accent/15 text-accent border-accent/40"
                  : isHalfDay
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/40"
                  : isMissed
                  ? "bg-amber-400/15 text-amber-300 border-amber-400/40"
                  : isHoliday
                  ? "bg-purple-500/15 text-purple-400 border-purple-500/40"
                  : isWeekend
                  ? "bg-surface2 text-muted border-line"
                  : "bg-bad/15 text-bad border-bad/40"
              }`}
            >
              {isHoliday ? `Holiday: ${holidayName || "Public Holiday"}` : status}
            </span>
          </div>

          {/* Punch Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Check-in */}
            <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[11px] text-muted font-medium flex items-center gap-1.5">
                <Icon name="log-in" className="w-3.5 h-3.5 text-good" />
                <span>Check-in Time</span>
              </span>
              <span className="text-sm font-bold font-num text-ink">
                {checkIn}
              </span>
              {isLate && (
                <span className="text-[10.5px] text-warn font-semibold">
                  Late by {lateMinutes}m
                </span>
              )}
            </div>

            {/* Check-out */}
            <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[11px] text-muted font-medium flex items-center gap-1.5">
                <Icon name="log-out" className="w-3.5 h-3.5 text-bad" />
                <span>Check-out Time</span>
              </span>
              <span className="text-sm font-bold font-num text-ink">
                {checkOut}
              </span>
              {earlyOut && (
                <span className="text-[10.5px] text-amber-400 font-semibold truncate" title={earlyReason}>
                  Early Out
                </span>
              )}
            </div>

            {/* Total Hours */}
            <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[11px] text-muted font-medium flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5 text-accent" />
                <span>Net Work Time</span>
              </span>
              <span className="text-sm font-bold font-num text-ink">
                {totalHours}
              </span>
              <span className="text-[10px] text-muted">Target: 9h</span>
            </div>

            {/* Break Duration */}
            <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[11px] text-muted font-medium flex items-center gap-1.5">
                <Icon name="coffee" className="w-3.5 h-3.5 text-warn" />
                <span>Total Breaks</span>
              </span>
              <span className="text-sm font-bold font-num text-ink">
                {breakDuration}
              </span>
              <span className="text-[10px] text-muted">Allowance: 60m</span>
            </div>
          </div>

          {/* Mode & Location Details */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Work Mode</span>
              <span className="font-semibold text-ink">{mode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Location</span>
              <span className="font-semibold text-ink">{locationLabel || "--"}</span>
            </div>
          </div>

          {/* Early Out Reason Note */}
          {earlyOut && earlyReason && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5">
                <Icon name="alert-triangle" className="w-3.5 h-3.5 text-amber-400" />
                <span>Early Check-out Reason</span>
              </span>
              <p className="text-[11.5px] leading-relaxed text-ink/90 mt-0.5">{earlyReason}</p>
            </div>
          )}

          {/* Manual Correction Audit Tag */}
          {isEdited && auditInfo && (
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-ink text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent text-[11px] flex items-center gap-1">
                  <Icon name="edit" className="w-3 h-3 text-accent" />
                  <span>Manually Regularized / Edited</span>
                </span>
                <span className="text-[10px] text-muted font-num">{formatKolkataTime(auditInfo.updatedAt)}</span>
              </div>
              <div className="text-[11px] text-muted mt-0.5">By: <strong className="text-ink">{auditInfo.updatedBy}</strong></div>
              <div className="text-[11px] text-muted">Reason: <span className="text-ink italic">"{auditInfo.reason}"</span></div>
            </div>
          )}

          {/* Missed Check Out Regularization Suggestion */}
          {isMissed && (
            <div className="p-3 rounded-xl bg-warn/15 border border-warn/30 text-warn text-xs flex flex-col gap-1.5">
              <span className="font-bold">Missed Check Out Warning</span>
              <p className="text-[11.5px] text-muted leading-relaxed">
                You did not record an exit punch for this working day. Please submit a regularization request below so HR can verify your working hours.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-line flex flex-col gap-2 mt-4">
          {!isFuture && !isWeekend && !isHoliday && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestRegularization(dateKey);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition shadow-md cursor-pointer"
            >
              <Icon name="calendar" className="w-4 h-4 text-on-accent" />
              <span>Request Regularization</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-surface2 border border-line text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
