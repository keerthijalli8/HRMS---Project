import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { createExceptionRequest } from '../../services/wfoWfhStore.js';

export const WfoExceptionModal = ({
  isOpen,
  onClose,
  currentUser,
  verificationDetails,
  onTriggerToast,
  onExceptionSubmitted
}) => {
  if (!isOpen) return null;

  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const empId = currentUser?.employeeId || currentUser?.id || "EMP-1088";
  const empName = currentUser?.name || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || "Employee";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError("Please provide a specific explanation (min 5 characters)");
      return;
    }

    setIsSubmitting(true);
    const res = createExceptionRequest({
      employee: currentUser,
      date: todayIso,
      workMode: "WFO",
      reason: reason.trim(),
      verificationStatus: verificationDetails?.badge || "Outside Geofence / Wi-Fi Unverified",
      locInfo: verificationDetails?.loc || null,
      wifiInfo: verificationDetails?.wifi || null
    });
    setIsSubmitting(false);

    if (res.ok) {
      onTriggerToast?.(`Exception request ${res.exception.id} submitted for HR sign-off.`);
      onExceptionSubmitted?.(res.exception);
      onClose();
    } else {
      onTriggerToast?.(res.error || "Failed to submit exception request");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-warn/15 text-warn flex items-center justify-center font-bold">
              <Icon name="alert-triangle" className="w-4 h-4 text-warn" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-base">WFO Attendance Exception</div>
              <div className="text-xs text-muted">Request HR approval for unverified office punch</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
          >
            <Icon name="x" className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Verification Failure Diagnostic Box */}
          <div className="p-3 rounded-xl bg-warn/10 border border-warn/30 text-ink">
            <div className="flex items-center gap-1.5 font-semibold text-warn mb-1">
              <Icon name="alert-triangle" className="w-3.5 h-3.5 text-warn" />
              <span>Verification Status: {verificationDetails?.badge || "Verification Failed"}</span>
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              {verificationDetails?.summary || "Location or Corporate Wi-Fi verification could not be validated against office parameters."}
            </p>
            {verificationDetails?.loc?.label && (
              <div className="mt-2 text-[10.5px] font-mono text-muted bg-surface/50 p-1.5 rounded border border-line/60">
                GPS Position: {verificationDetails.loc.label} (±{verificationDetails.loc.accuracy || 15}m)
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-ink block mb-1">
              Reason for Exception / Location Discrepancy <span className="text-bad">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                "Client on-site visit",
                "Indoor GPS drift / weak lock",
                "Corporate Wi-Fi portal issue",
                "Secondary campus desk",
                "Travel / Field duty"
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="px-2 py-0.5 rounded-md bg-surface2 border border-line hover:border-accent text-[10.5px] text-muted hover:text-ink transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="Explain why you could not be verified on-premise (e.g. met client at Cyber Pearl, Wi-Fi cert renewal)..."
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              className="w-full bg-surface2 border border-line rounded-lg p-2.5 text-ink focus:border-accent outline-none resize-none"
            />
            {error && <p className="text-bad text-[11px] mt-0.5">{error}</p>}
          </div>

          <div className="p-2.5 rounded-lg bg-surface2/40 border border-line/60 text-[11px] text-muted flex items-start gap-2">
            <Icon name="shield" className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              Once submitted, your attendance will be recorded as <strong>Exception Pending</strong>. HR or your Reporting Manager will review and approve.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton icon="check" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit for HR Approval"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
