import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const RevokeLeaveModal = ({
  isOpen,
  onClose,
  request,
  onConfirm,
  isSubmitting = false
}) => {
  const [revokeReason, setRevokeReason] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRevokeReason("");
      setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen]);

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

  const isValid = revokeReason.trim().length >= 5;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isValid || isSubmitting) return;
    onConfirm({ revokeReason: revokeReason.trim() });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-leave-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-[#0d222e] text-ink shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div>
            <h2 id="revoke-leave-title" className="font-display font-bold text-base text-ink">
              Revoke approved leave
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Cancel previously approved leave and restore quota to employee balance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted hover:text-ink text-sm px-2 py-1 rounded-lg hover:bg-surface2 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="p-3 rounded-xl bg-surface2/50 border border-line text-xs flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-ink">{request.employeeName}</span>
            <span className="text-accent font-semibold">{request.leaveType}</span>
          </div>
          <div className="text-muted text-[11px]">{request.dates} ({request.daysCount} days)</div>
          <div className="text-[10.5px] text-good font-semibold">
            {request.isLop ? "LOP Leave (no quota change)" : `+${request.daysCount} days will be credited back to employee balance`}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="revoke-reason-input" className="text-xs font-semibold text-ink">
                Revocation reason <span className="text-bad">*</span>
              </label>
              <span className={`text-[10px] font-mono ${isValid ? 'text-good' : 'text-muted'}`}>
                {revokeReason.trim().length} / 5 min characters
              </span>
            </div>

            <textarea
              id="revoke-reason-input"
              ref={textareaRef}
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="State reason for cancelling approved leave..."
              className="w-full p-2.5 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder-muted focus:border-accent focus:outline-none transition resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface2 border border-line hover:bg-surface2/80 text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-4 py-2 rounded-xl bg-warn text-ink hover:opacity-95 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Confirm Revoke"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RevokeLeaveModal;
