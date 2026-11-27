import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import {
  submitExemptionRequest,
  getEmployeeExemption,
  approveExemptionRequest
} from '../../services/faceBiometricsStore.js';

export const NonBiometricExemptionModal = ({
  isOpen,
  onClose,
  currentUser,
  onTriggerToast
}) => {
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("Supervisor PIN Override");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeExemption, setActiveExemption] = useState(() =>
    getEmployeeExemption(currentUser?.employeeId)
  );

  if (!isOpen) return null;

  const isHr = (currentUser?.systemRole || currentUser?.role || "").toLowerCase().includes("hr");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      onTriggerToast?.("Please provide a reason for the non-biometric exemption request.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = submitExemptionRequest(currentUser, reason.trim(), method);
      setIsSubmitting(false);
      if (res.ok) {
        onTriggerToast?.("Exemption request submitted for HR approval.");
        setActiveExemption(res.exemption);
        onClose();
      }
    }, 500);
  };

  // Immediate HR self-approval for testing/demo
  const handleInstantApproval = () => {
    if (activeExemption) {
      approveExemptionRequest(activeExemption.id, currentUser, supervisorPin || "1234");
      onTriggerToast?.("Non-biometric exemption approved with Supervisor PIN: 1234");
      setActiveExemption(getEmployeeExemption(currentUser?.employeeId));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
              <Icon name="shield" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Non-Biometric Attendance Exemption
              </h3>
              <p className="text-[11px] text-muted">
                DPDP Act 2023 Statutory Alternative Workflow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs text-ink">
          {activeExemption && activeExemption.status === "Approved" ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-good/10 border border-good/30 text-good flex items-start gap-2.5">
                <Icon name="check-circle" className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-xs">Exemption Approved & Active</span>
                  <p className="text-[11.5px] text-ink-muted leading-relaxed">
                    You have an active authorization to mark attendance without face recognition using your Supervisor PIN Override.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line text-xs font-mono space-y-1">
                <div>Exemption ID: <strong className="text-ink">{activeExemption.id}</strong></div>
                <div>Authorized Method: <strong className="text-accent">{activeExemption.preferredMethod}</strong></div>
                <div>Supervisor PIN: <strong className="text-good">{activeExemption.supervisorPin || "1234"}</strong></div>
              </div>
              <div className="pt-2 flex justify-end">
                <PrimaryButton onClick={onClose}>Close</PrimaryButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-muted text-[11.5px] leading-relaxed">
                In compliance with the Digital Personal Data Protection (DPDP) Act 2023, employees who opt out of biometric data processing or face hardware accessibility constraints may apply for an alternative verification workflow.
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Reason for Exemption *
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Privacy opt-out / camera hardware defect / temporary facial injury..."
                  className="w-full p-2.5 rounded-xl bg-surface2 border border-line text-ink text-xs focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Preferred Verification Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface2 border border-line text-ink text-xs focus:outline-none focus:border-accent"
                >
                  <option value="Supervisor PIN Override">Supervisor PIN Override</option>
                  <option value="Office QR + Security Desk Verification">Office QR + Security Desk Verification</option>
                  <option value="Manual HR Attendance Pass">Manual HR Attendance Pass</option>
                </select>
              </div>

              {isHr && (
                <div className="p-3 rounded-xl bg-surface2/80 border border-line flex items-center justify-between">
                  <span className="text-[11px] text-muted font-medium">HR Quick Approval:</span>
                  <button
                    type="button"
                    onClick={handleInstantApproval}
                    className="px-2.5 py-1 rounded-lg bg-good/20 text-good border border-good/30 text-[11px] font-semibold hover:bg-good/30 transition"
                  >
                    Approve Exemption Instantly
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Exemption Request"}
                </PrimaryButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
