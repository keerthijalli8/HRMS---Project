import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import { updateAttendanceManual } from '../../services/attendanceService.js';

export const ManualCorrectionModal = ({
  isOpen,
  onClose,
  employeeRecord = null,
  dateKey,
  adminUser,
  onSuccessToast
}) => {
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("18:00");
  const [status, setStatus] = useState("Present");
  const [mode, setMode] = useState("office");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && employeeRecord) {
      const inVal = employeeRecord.checkIn !== "--" ? "09:00" : "09:00";
      const outVal = employeeRecord.checkOut !== "--" && employeeRecord.checkOut !== "Working" ? "18:00" : "18:00";
      setCheckInTime(inVal);
      setCheckOutTime(outVal);
      setStatus(employeeRecord.status || "Present");
      setMode(employeeRecord.mode === "WFH" ? "wfh" : "office");
      setReason("");
      setTouched(false);
    }
  }, [isOpen, employeeRecord]);

  // Focus trap & Escape key
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

  if (!isOpen || !employeeRecord) return null;

  const isReasonValid = reason.trim().length >= 10;
  const isValid = Boolean(status) && isReasonValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    const res = updateAttendanceManual({
      employeeId: employeeRecord.employeeId || employeeRecord.id,
      dateKey,
      checkInTime,
      checkOutTime,
      status,
      mode,
      reason,
      adminUser
    });
    setIsSubmitting(false);

    if (res.ok) {
      onSuccessToast?.(res.message);
      onClose();
    } else {
      onSuccessToast?.(res.error || "Failed to update attendance");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-corr-title"
        className="w-full max-w-md bg-[#061720] border border-line rounded-3xl shadow-2xl p-6 flex flex-col gap-4 text-ink animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="edit" className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 id="manual-corr-title" className="font-display font-bold text-base text-ink">
                Manual Attendance Correction
              </h2>
              <div className="text-[11px] text-muted">
                {employeeRecord.name} ({employeeRecord.employeeId}) · {dateKey}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* Status & Mode Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted block mb-1 font-semibold">
                Status <span className="text-bad">*</span>
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Present">Present</option>
                <option value="WFH">WFH</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
              </Select>
            </div>

            <div>
              <label className="text-muted block mb-1 font-semibold">
                Work Mode
              </label>
              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="office">Office (WFO)</option>
                <option value="wfh">WFH (Remote)</option>
              </Select>
            </div>
          </div>

          {/* Punch Times Row */}
          {status !== "Absent" && status !== "On Leave" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted block mb-1 font-semibold">
                  Check-in Time
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full bg-surface2/70 border border-line rounded-xl px-3 py-2 text-ink text-xs focus:border-accent outline-none font-num"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-semibold">
                  Check-out Time
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-surface2/70 border border-line rounded-xl px-3 py-2 text-ink text-xs focus:border-accent outline-none font-num"
                />
              </div>
            </div>
          )}

          {/* Mandatory Reason for Audit Log */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-muted font-semibold">
                Mandatory Correction Reason <span className="text-bad">*</span>
              </label>
              <span className="text-[10px] text-muted">
                {reason.trim().length} / 10 min chars
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved regularization ticket #REG-882. Biometric scanner malfunction confirmed."
              className={`w-full bg-surface2/70 border rounded-xl p-3 text-ink text-xs focus:border-accent outline-none resize-none ${
                touched && !isReasonValid ? "border-bad" : "border-line"
              }`}
            />
            {touched && !isReasonValid && (
              <span className="text-[11px] text-bad mt-1 block">
                Audit compliance requires a reason of at least 10 characters.
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-surface2/40 border border-line text-[11px] text-muted leading-relaxed">
            All manual edits are recorded into the immutable audit trail (who, what, when, old & new values) for SOC-2 compliance.
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line mt-2">
            <SecondaryButton onClick={onClose} disabled={isSubmitting}>
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-accent text-on-accent font-bold px-4 py-2 rounded-xl text-xs hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
            >
              {isSubmitting ? "Saving…" : "Save Correction"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
