import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';

const REASON_OPTIONS = [
  "Personal work",
  "Medical",
  "Official visit",
  "Emergency",
  "Other"
];

export const EarlyCheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  workedDurationFormatted = "0h 00m",
  remainingDurationFormatted = "0h 00m"
}) => {
  const [category, setCategory] = useState("Personal work");
  const [details, setDetails] = useState("");
  const [touched, setTouched] = useState(false);

  const modalRef = useRef(null);
  const selectRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCategory("Personal work");
      setDetails("");
      setTouched(false);
      setTimeout(() => selectRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleTab = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleTab);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validation: if "Other" is chosen, text area is strictly required with min 10 chars.
  // For other categories, details is optional, but if entered must be valid.
  const isOther = category === "Other";
  const trimmedDetails = details.trim();
  const isDetailsValid = isOther ? trimmedDetails.length >= 10 : true;
  const isValid = Boolean(category) && isDetailsValid;

  const handleConfirm = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    const fullReason = isOther
      ? `Other: ${trimmedDetails}`
      : trimmedDetails
      ? `${category} - ${trimmedDetails}`
      : category;

    onConfirm({
      category,
      details: trimmedDetails,
      reason: fullReason
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-checkout-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#071a24] border border-line rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs text-ink animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-line/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-warn/15 border border-warn/30 text-warn flex items-center justify-center shrink-0">
              <Icon name="alert-triangle" className="w-4 h-4 text-warn" />
            </div>
            <div>
              <h3 id="early-checkout-title" className="font-display font-bold text-sm text-ink leading-tight">
                Early Check Out
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                Standard shift requirement: 9 working hours
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-warn/10 border border-warn/25 text-ink leading-relaxed">
          <div className="font-semibold text-warn flex items-center gap-1.5 mb-1">
            <span>Shift incomplete</span>
          </div>
          <p className="text-[11.5px] text-muted">
            You have worked only <strong className="text-ink font-num">{workedDurationFormatted}</strong> today. Please give a reason for checking out early.
          </p>
        </div>

        {/* Form Controls */}
        <div className="flex flex-col gap-3">
          {/* Reason Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Reason for Early Departure <span className="text-bad">*</span>
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              ariaLabel="Reason for Early Departure"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>

          {/* Details / Remarks Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                {isOther ? "Specify Reason Details" : "Additional Remarks"} {isOther && <span className="text-bad">*</span>}
              </label>
              {isOther && (
                <span className={`text-[10.5px] font-num ${trimmedDetails.length >= 10 ? "text-good" : "text-muted"}`}>
                  {trimmedDetails.length}/10 chars min
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={isOther ? "Please describe your reason (min 10 characters)..." : "Optional notes for HR..."}
              className={`w-full px-3 py-2 rounded-xl bg-surface2/60 border text-xs text-ink placeholder:text-muted/60 focus:outline-none transition resize-none ${
                touched && !isDetailsValid
                  ? "border-bad focus:ring-1 focus:ring-bad"
                  : "border-line focus:border-accent focus:ring-1 focus:ring-accent"
              }`}
              aria-invalid={touched && !isDetailsValid}
              aria-describedby={touched && !isDetailsValid ? "reason-error" : undefined}
            />

            {touched && !isDetailsValid && (
              <p id="reason-error" className="text-[10.5px] text-bad mt-1 font-medium">
                Please enter at least 10 characters explaining your reason.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/60">
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            className="px-4 py-2 rounded-xl bg-bad text-white text-xs font-bold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bad/90 cursor-pointer active:scale-95"
          >
            Confirm Check Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
