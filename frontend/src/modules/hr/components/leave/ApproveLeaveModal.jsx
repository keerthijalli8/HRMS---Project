import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getSpecificLeaveTypeBalance } from '../../services/leaveService.js';

export const ApproveLeaveModal = ({
  isOpen,
  onClose,
  request,
  onConfirm,
  isSubmitting = false
}) => {
  const [note, setNote] = useState("");
  const [isLop, setIsLop] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  // Quick pick chips as requested
  const quickPickChips = [
    "Approved as requested",
    "Approved, please hand over your work",
    "Approved, balance adjusted"
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNote("");
      setIsLop(false);
      setErrorMsg("");
      setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
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
  const isBalanceInsufficient = currentBalance < daysCount;
  const projectedBalance = isLop ? currentBalance : Math.max(0, currentBalance - daysCount);

  const isNoteValid = note.trim().length >= 5;
  const canSubmit = isNoteValid && (!isBalanceInsufficient || isLop) && !isSubmitting;

  const handleChipClick = (chipText) => {
    setNote(chipText);
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onConfirm({ note: note.trim(), isLop });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-leave-title"
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
            <h2 id="approve-leave-title" className="font-display font-bold text-base sm:text-lg text-ink">
              Approve leave
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Review leave quota allocation and record mandatory sign-off note
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

          {/* Balance projection */}
          <div className="pt-2 border-t border-line/40 flex items-center justify-between text-[11px] bg-surface2/80 p-2 rounded-lg">
            <span className="text-muted">Balance after approval:</span>
            <span className="font-num font-bold text-ink">
              {currentBalance} Days → <strong className={isLop ? "text-warn" : "text-good"}>{projectedBalance} Days</strong>
              {isLop && <span className="text-warn text-[10px] ml-1">(LOP Mode)</span>}
            </span>
          </div>
        </div>

        {/* Insufficient balance warning + LOP checkbox */}
        {isBalanceInsufficient && (
          <div className="p-3 rounded-xl bg-warn/15 border border-warn/40 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2 text-warn font-semibold">
              <span>Warning: Balance is {currentBalance} {currentBalance === 1 ? 'day' : 'days'}, but request is {daysCount} days.</span>
            </div>
            <label className="flex items-center gap-2 text-ink text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLop}
                onChange={(e) => setIsLop(e.target.checked)}
                className="w-4 h-4 rounded text-accent bg-surface border-line cursor-pointer"
              />
              <span>Approve as Loss of Pay (LOP) without deducting balance</span>
            </label>
          </div>
        )}

        {/* Approval Note Text Area */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="approval-note-input" className="text-xs font-semibold text-ink">
              Approval note <span className="text-bad">*</span>
            </label>
            <span className={`text-[10px] font-mono ${isNoteValid ? 'text-good' : 'text-muted'}`}>
              {note.trim().length} / 5 min characters
            </span>
          </div>

          <textarea
            id="approval-note-input"
            ref={textareaRef}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter reason for approval or hand-over instructions..."
            className="w-full p-2.5 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder-muted focus:border-accent focus:outline-none transition resize-none"
            disabled={isSubmitting}
          />

          {/* Quick-pick Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] text-muted font-medium">Quick chips:</span>
            {quickPickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-2.5 py-1 rounded-lg bg-surface2/80 hover:bg-surface2 border border-line hover:border-accent text-[11px] text-ink transition cursor-pointer select-none"
              >
                {chip}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-bad font-semibold">{errorMsg}</p>
          )}

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
              className="px-5 py-2 rounded-xl bg-accent text-on-accent hover:opacity-95 text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Confirm Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ApproveLeaveModal;
