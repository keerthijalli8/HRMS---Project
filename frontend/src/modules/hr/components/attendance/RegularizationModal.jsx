import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { requestRegularization } from '../../services/attendanceService.js';

export const RegularizationModal = ({
  isOpen,
  onClose,
  initialDateKey = "",
  currentUser,
  onSuccessToast
}) => {
  const [date, setDate] = useState(initialDateKey || "");
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDateKey || new Date().toISOString().slice(0, 10));
      setCheckInTime("09:00");
      setCheckOutTime("18:00");
      setReason("");
      setTouched(false);
    }
  }, [isOpen, initialDateKey]);

  // Focus trap & Escape key handling
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

  if (!isOpen) return null;

  const isReasonValid = reason.trim().length >= 10;
  const isValid = Boolean(date) && Boolean(checkInTime) && Boolean(checkOutTime) && isReasonValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    const res = requestRegularization({
      user: currentUser,
      date,
      checkInTime,
      checkOutTime,
      reason
    });
    setIsSubmitting(false);

    if (res.ok) {
      onSuccessToast?.(res.message || "Regularization request submitted successfully.");
      onClose();
    } else {
      onSuccessToast?.(res.error || "Failed to submit request");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reg-modal-title"
        className="w-full max-w-md bg-[#061720] border border-line rounded-3xl shadow-2xl p-6 flex flex-col gap-4 text-ink animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="calendar" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 id="reg-modal-title" className="font-display font-bold text-base text-ink">
                Request Punch Regularization
              </h2>
              <div className="text-[11px] text-muted">
                Submit punch correction for manager review & approval
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
          {/* Date Picker */}
          <div>
            <label className="text-muted block mb-1 font-semibold">
              Attendance Date <span className="text-bad">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface2/70 border border-line rounded-xl px-3 py-2 text-ink text-xs focus:border-accent outline-none font-num"
              required
            />
          </div>

          {/* Time pickers row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted block mb-1 font-semibold">
                Correct Check-In <span className="text-bad">*</span>
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full bg-surface2/70 border border-line rounded-xl px-3 py-2 text-ink text-xs focus:border-accent outline-none font-num"
                required
              />
            </div>

            <div>
              <label className="text-muted block mb-1 font-semibold">
                Correct Check-Out <span className="text-bad">*</span>
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full bg-surface2/70 border border-line rounded-xl px-3 py-2 text-ink text-xs focus:border-accent outline-none font-num"
                required
              />
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-muted font-semibold">
                Reason for Regularization <span className="text-bad">*</span>
              </label>
              <span className="text-[10px] text-muted">
                {reason.trim().length} / 10 min chars
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Biometric scanner issue at Hyderabad Cyber Gateway campus gate 2."
              className={`w-full bg-surface2/70 border rounded-xl p-3 text-ink text-xs focus:border-accent outline-none resize-none ${
                touched && !isReasonValid ? "border-bad" : "border-line"
              }`}
            />
            {touched && !isReasonValid && (
              <span className="text-[11px] text-bad mt-1 block">
                Please provide a detailed reason with at least 10 characters.
              </span>
            )}
          </div>

          {/* Policy Compliance Notice */}
          <div className="p-3 rounded-xl bg-surface2/40 border border-line/60 text-[11px] text-muted leading-relaxed">
            Requests are subject to SOC-2 audit verification and manager approval. Once approved, the record will be updated automatically in your monthly attendance sheet.
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
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
