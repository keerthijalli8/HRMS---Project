import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';

export const RejectModal = ({ record, onConfirm, onClose }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState(null);

  if (!record) return null;

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason or managerial explanation for rejecting this LOP request.");
      return;
    }
    onConfirm(rejectionReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full !p-6 border border-line relative animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bad/20 text-bad flex items-center justify-center">
              <Icon name="x" className="w-4 h-4 text-bad" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm">Reject LOP Request</h3>
              <p className="text-[11px] text-muted font-data">{record.id} · {record.employeeName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-surface2 border border-line text-muted hover:text-ink cursor-pointer"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-bad/15 border border-bad/30 text-bad text-xs">
            {error}
          </div>
        )}

        <div className="py-4 space-y-3">
          <p className="text-xs text-muted">
            Are you sure you want to reject this manual LOP for <strong className="text-ink">{record.employeeName}</strong> ({record.lopDays} days, {record.payrollMonth})? This will cancel the planned salary deduction.
          </p>

          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              Rejection Reason / Comments <span className="text-bad">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Employee provided medical proof; granting 2 days ex-gratia paid sick leave..."
              className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-bad resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 rounded-xl bg-bad text-white text-xs font-bold hover:bg-bad/90 transition shadow-sm cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};
