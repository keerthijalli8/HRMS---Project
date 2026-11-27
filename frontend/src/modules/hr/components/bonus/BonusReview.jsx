import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { formatINR } from '../../utils/renderValue.js';
import { BONUS_APPROVAL_LIMIT, createBonus, saveDraft, clearDraft } from '../../services/bonusService.js';
import { loadAllEmployees } from '../../services/teamService.js';

export const BonusReview = ({
  bonusConfig,
  currentUser,
  onBack,
  onComplete,
  onTriggerToast
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authPasscode, setAuthPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const allEmployees = loadAllEmployees();
  const totalOrgCount = allEmployees.length;

  const {
    name = "Performance Bonus",
    type = "Performance",
    payCycle = "November 2026",
    reason = "",
    paymentTiming = "payroll",
    paymentDate = "",
    items = [],
    totalAmount = 0,
    totalTds = 0,
    totalNet = 0
  } = bonusConfig;

  const recipientCount = items.length;
  const unselectedCount = Math.max(0, totalOrgCount - recipientCount);
  const requiresSecondApproval = totalAmount > BONUS_APPROVAL_LIMIT;

  // Handle Save As Draft
  const handleSaveDraft = () => {
    saveDraft({
      ...bonusConfig,
      step: 3
    });
    onTriggerToast?.("Bonus configuration saved as draft.");
  };

  // Handle final submission
  const handleFinalConfirm = () => {
    setPasscodeError("");

    // If second approval is required, check passcode
    if (requiresSecondApproval) {
      if (!authPasscode || authPasscode.trim().toUpperCase() !== "HRADMIN") {
        setPasscodeError("Invalid authorization code. Enter 'HRADMIN' to authorize high-value bonus disbursal.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const created = createBonus(
        {
          ...bonusConfig,
          status: "Approved"
        },
        currentUser
      );

      clearDraft();
      onTriggerToast?.(`Successfully allocated ${name} to ${recipientCount} employees! Total: ${formatINR(totalAmount)}`);
      setIsConfirmModalOpen(false);
      onComplete?.(created);
    } catch (err) {
      console.error("[BonusReview] Submission error:", err);
      setPasscodeError(err.message || "Failed to finalize bonus allocation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Recipients</span>
            <Icon name="users" className="w-4 h-4 text-accent" />
          </div>
          <div className="font-num font-extrabold text-xl text-ink mt-2">
            {recipientCount}
            <span className="text-xs text-muted font-normal ml-1">employees</span>
          </div>
          <span className="text-[10.5px] text-emerald-400 font-semibold mt-1">
            {unselectedCount} excluded (receive ₹0)
          </span>
        </div>

        <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Gross Outflow</span>
            <Icon name="dollar-sign" className="w-4 h-4 text-accent" />
          </div>
          <div className="font-num font-extrabold text-xl text-ink mt-2">
            {formatINR(totalAmount)}
          </div>
          <span className="text-[10.5px] text-muted font-normal mt-1">
            Pre-tax company commitment
          </span>
        </div>

        <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Est. TDS Deduction</span>
            <Icon name="file-text" className="w-4 h-4 text-bad" />
          </div>
          <div className="font-num font-extrabold text-xl text-bad mt-2">
            {formatINR(totalTds)}
          </div>
          <span className="text-[10.5px] text-muted font-normal mt-1">
            Standard 10% statutory tax
          </span>
        </div>

        <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Net Disbursal</span>
            <Icon name="check-circle" className="w-4 h-4 text-good" />
          </div>
          <div className="font-num font-extrabold text-xl text-good mt-2">
            {formatINR(totalNet)}
          </div>
          <span className="text-[10.5px] text-good font-semibold mt-1">
            Direct net to bank accounts
          </span>
        </div>
      </div>

      {/* Bonus Details Summary Card */}
      <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold text-[10px] uppercase">
                {type}
              </span>
              <h3 className="font-display font-bold text-base text-ink">{name}</h3>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              <strong>Remarks:</strong> {reason}
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-muted block text-[11px]">Pay Cycle</span>
            <span className="font-bold text-ink">{payCycle}</span>
            <span className="text-[11px] text-accent block mt-0.5">
              {paymentTiming === "payroll" ? "Added to Payroll" : `Separate Payout: ${paymentDate}`}
            </span>
          </div>
        </div>

        {/* High Value Limit Warning Notice if > 5 Lakhs */}
        {requiresSecondApproval && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-3 text-xs text-amber-200">
            <Icon name="alert-triangle" className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block font-bold">
                High-Value Disbursal Notice (Threshold Exceeded)
              </strong>
              <span>
                Total bonus outflow ({formatINR(totalAmount)}) exceeds the corporate approval limit of {formatINR(BONUS_APPROVAL_LIMIT)}. A secondary HR Admin verification will be required upon confirmation.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recipient Employees Table */}
      <div className="glass-card !p-0 border border-line rounded-2xl overflow-hidden shadow-lg flex flex-col">
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/30">
          <div>
            <h4 className="font-display font-bold text-sm text-ink">
              Selected Recipient Breakdown ({items.length})
            </h4>
            <span className="text-[11px] text-muted">
              Individual amounts, estimated TDS withholding, and net bank payable
            </span>
          </div>
          <span className="text-xs font-semibold text-accent font-num">
            {unselectedCount} other employees excluded (₹0)
          </span>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface2/80 border-b border-line text-muted uppercase text-[10px] font-semibold sticky top-0 backdrop-blur-md">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-right">Basic Pay</th>
                <th className="py-3 px-3 text-right">Gross Bonus</th>
                <th className="py-3 px-3 text-right">Est. TDS</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {items.map(item => {
                const initials = item.employeeName
                  ? item.employeeName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : "EM";

                return (
                  <tr key={item.employeeId} className="hover:bg-surface2/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-ink">{item.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-num font-bold text-accent">
                      {item.employeeId}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {item.department}
                    </td>
                    <td className="py-3 px-3 text-right font-num text-muted">
                      {formatINR(item.basic)}
                    </td>
                    <td className="py-3 px-3 text-right font-num font-bold text-ink">
                      {formatINR(item.amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-num text-bad">
                      -{formatINR(item.tds)}
                    </td>
                    <td className="py-3 px-4 text-right font-num font-extrabold text-good">
                      {formatINR(item.net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-surface2/90 border-t border-line font-bold text-xs sticky bottom-0">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-ink uppercase text-[11px]">
                  Total Across {items.length} Selected Employees
                </td>
                <td className="py-3 px-3 text-right font-num text-ink">
                  {formatINR(totalAmount)}
                </td>
                <td className="py-3 px-3 text-right font-num text-bad">
                  -{formatINR(totalTds)}
                </td>
                <td className="py-3 px-4 text-right font-num text-good text-sm font-extrabold">
                  {formatINR(totalNet)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-2 transition cursor-pointer"
          >
            <Icon name="arrow-left" className="w-4 h-4 text-accent" />
            <span>Back to Details</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2.5 rounded-xl bg-surface2 border border-line hover:border-line/90 text-xs font-semibold text-muted hover:text-ink flex items-center gap-2 transition cursor-pointer"
          >
            <Icon name="save" className="w-4 h-4 text-muted" />
            <span>Save as Draft</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmModalOpen(true)}
          className="px-6 py-2.5 rounded-xl bg-accent text-on-accent font-display font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-accent/20 hover:opacity-95 transition cursor-pointer"
        >
          <Icon name="check" className="w-4 h-4 text-on-accent" />
          <span>Confirm &amp; Disburse Bonus</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full !p-6 border border-line rounded-2xl flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center mx-auto">
              <Icon name="gift" className="w-6 h-6 text-accent" />
            </div>

            <div className="text-center">
              <h3 className="font-display font-extrabold text-base text-ink">
                Confirm Bonus Allocation
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                You are giving a bonus to <strong className="text-ink">{recipientCount} employees</strong> for a total commitment of <strong className="text-accent font-num font-bold">{formatINR(totalAmount)}</strong>.
              </p>
              <div className="mt-2 p-2 rounded-xl bg-surface2/40 border border-line/60 text-[11px] text-muted">
                {unselectedCount} unselected employees will receive ₹0 bonus.
              </div>
            </div>

            {/* Second Approval Passcode Input if > 5 Lakhs */}
            {requiresSecondApproval && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs flex flex-col gap-2">
                <span className="font-bold text-amber-300">
                  Second Level Authorization Required
                </span>
                <span className="text-[11px] text-muted">
                  Total exceeds standard limit ({formatINR(BONUS_APPROVAL_LIMIT)}). Enter HR Admin Passcode to approve:
                </span>
                <input
                  type="password"
                  value={authPasscode}
                  onChange={(e) => setAuthPasscode(e.target.value)}
                  placeholder="Enter HRADMIN"
                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-mono text-ink focus:border-accent focus:outline-none"
                />
              </div>
            )}

            {passcodeError && (
              <div className="text-xs text-bad bg-bad/10 border border-bad/30 p-2.5 rounded-xl">
                {passcodeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-surface2 text-muted hover:text-ink text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-accent text-on-accent font-display font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:opacity-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Icon name="check" className="w-3.5 h-3.5 text-on-accent" />
                    <span>Authorize &amp; Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusReview;
