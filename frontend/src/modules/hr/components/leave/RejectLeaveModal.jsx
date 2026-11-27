import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getSpecificLeaveTypeBalance } from '../../services/leaveService.js';

export const REJECTION_REASONS = [
  "Insufficient leave balance",
  "Critical project deadline",
  "Overlapping team leaves",
  "Insufficient notice",
  "Documents missing",
  "Other"
];

export const RejectLeaveModal = ({
  isOpen,
  onClose,
  request,
  onConfirm,
  isSubmitting = false
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const detailsRef = useRef(null);
  const modalRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRejectionReason("");
      setReasonDetails("");
      setTimeout(() => {
        detailsRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const currentBalance = request.balanceBefore != null
    ? request.balanceBefore
    : getSpecificLeaveTypeBalance(request.employeeId, request.leaveType);

  const daysCount = request.daysCount || 1;
  const isReasonValid = Boolean(rejectionReason.trim());
  const isDetailsValid = reasonDetails.trim().length >= 10;
  const canSubmit = isReasonValid && isDetailsValid && !isSubmitting;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      rejectionReason: rejectionReason.trim(),
      reasonDetails: reasonDetails.trim()
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-leave-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl border border-line bg-[#0d222e] text-ink shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div>
            <h2 id="reject-leave-title" className="font-display font-bold text-base sm:text-lg text-ink">
              Reject leave
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Select formal refusal reason and provide employee explanation details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted hover:text-ink text-sm px-2 py-1 rounded-lg hover:bg-surface2 transition cursor-pointer"
            aria-label="Close modal"
          >
            Cancel
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-3.5 rounded-xl bg-surface2/50 border border-line text-xs flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="font-bold text-ink text-sm block">{request.employeeName}</span>
              <span className="text-[11px] text-muted">{request.employeeId} · {request.department} ({request.designation || 'Staff'})</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/40 uppercase tracking-wider">
              {request.leaveType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/40 text-[11px]">
            <div>
              <span className="text-muted block">Duration & Dates</span>
              <strong className="text-ink font-semibold">{request.dates} ({daysCount} {daysCount === 1 ? 'Day' : 'Days'})</strong>
            </div>
            <div>
              <span className="text-muted block">Current Leave Balance</span>
              <span className="font-semibold text-accent font-num">{currentBalance} Days</span>
            </div>
          </div>

          {request.appliedReason && (
            <div className="pt-2 border-t border-line/40 text-[11px]">
              <span className="text-muted block">Applied Reason</span>
              <span className="text-ink italic">"{request.appliedReason}"</span>
            </div>
          )}

          <div className="pt-2 border-t border-line/40 text-[10.5px] text-muted">
            Note: On rejection, the leave balance will <strong>not</strong> be deducted.
          </div>
        </div>

        {/* Rejection Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Rejection Reason Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rejection-reason-select" className="text-xs font-semibold text-ink">
              Rejection reason <span className="text-bad">*</span>
            </label>
            <select
              id="rejection-reason-select"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#0f2330] border border-line text-xs text-ink focus:border-bad focus:outline-none transition cursor-pointer"
              disabled={isSubmitting}
            >
              <option value="" disabled>-- Select a rejection reason --</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Reason Details Text Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="rejection-details-input" className="text-xs font-semibold text-ink">
                Reason details <span className="text-bad">*</span>
              </label>
              <span className={`text-[10px] font-mono ${isDetailsValid ? 'text-good' : 'text-muted'}`}>
                {reasonDetails.trim().length} / 10 min characters
              </span>
            </div>

            <textarea
              id="rejection-details-input"
              ref={detailsRef}
              rows={3}
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Provide a clear explanation for this rejection (sent to employee)..."
              className="w-full p-2.5 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder-muted focus:border-bad focus:outline-none transition resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface2 border border-line hover:bg-surface2/80 text-xs font-semibold text-muted hover:text-ink transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2 rounded-xl bg-bad text-white hover:bg-bad/90 text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Confirm Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RejectLeaveModal;
