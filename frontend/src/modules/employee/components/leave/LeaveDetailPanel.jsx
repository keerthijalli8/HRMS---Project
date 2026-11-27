// src/components/leave/LeaveDetailPanel.jsx
// Right-side drawer (fullscreen on mobile) displaying 3-step TL / MANAGER (FINAL) / HR approval timeline,
// final authority remarks, red rejection highlight box, and Pending-only cancellation confirm dialog.

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  FileText,
  Ban
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { Tag } from '../Tag.jsx';
import {
  getFinalStatusDetails,
  getApprovalByRole,
  normalizeDecision
} from '../../utils/leaveStatus.js';
import { formatDate, formatTime12 } from '../../utils/format.js';

const STEP_ORDER = [
  { role: 'TL', title: 'Team Lead (TL)', subBadge: 'Recommendation' },
  { role: 'MANAGER', title: 'Reporting Manager', isManagerFinal: true },
  { role: 'HR', title: 'Human Resources (HR)', subBadge: 'Recommendation' }
];

function formatDecisionTimestamp(isoStr) {
  if (!isoStr) return 'Awaiting action';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return String(isoStr);
  return `${formatDate(d)} · ${formatTime12(d, { showSeconds: false })}`;
}

function getStepVisuals(decision, isEscalatedManagerStep = false) {
  const norm = normalizeDecision(decision);
  if (norm === 'Approved') {
    return {
      Icon: CheckCircle2,
      iconColor: 'text-emerald-300',
      ringBg: 'bg-emerald-500/20 border-emerald-400/50',
      labelColor: 'text-emerald-300',
      labelText: 'Approved'
    };
  }
  if (norm === 'Rejected') {
    return {
      Icon: XCircle,
      iconColor: 'text-rose-300',
      ringBg: 'bg-rose-500/20 border-rose-400/50',
      labelColor: 'text-rose-300',
      labelText: 'Rejected'
    };
  }
  if (isEscalatedManagerStep) {
    return {
      Icon: AlertTriangle,
      iconColor: 'text-orange-300',
      ringBg: 'bg-orange-500/20 border-orange-400/50',
      labelColor: 'text-orange-300',
      labelText: 'Escalated (>48h)'
    };
  }
  return {
    Icon: Clock,
    iconColor: 'text-yellow-300',
    ringBg: 'bg-yellow-500/20 border-yellow-400/50',
    labelColor: 'text-yellow-300',
    labelText: 'Pending'
  };
}

export function LeaveDetailPanel({
  leave,
  isOpen,
  onClose,
  onCancelLeave,
  isCancelling = false
}) {
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // Reset confirm modal whenever a different request opens/closes
  useEffect(() => {
    setConfirmCancelOpen(false);
  }, [leave?.id, isOpen]);

  // Keyboard Escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmCancelOpen) {
          setConfirmCancelOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmCancelOpen, onClose]);

  if (!isOpen || !leave) return null;

  const details = getFinalStatusDetails(leave);
  const managerStep = getApprovalByRole(leave, 'MANAGER');
  const isRejected = details.status === 'Rejected';
  const isPending = details.status === 'Pending';
  const isEscalated = details.isEscalated;

  const handleConfirmCancel = async () => {
    await onCancelLeave?.(leave.id);
    setConfirmCancelOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-detail-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={() => !confirmCancelOpen && onClose?.()}
        aria-hidden="true"
      />

      {/* Panel Container: fullscreen on mobile (<768px), 460px right drawer on md+ */}
      <aside className="relative z-10 w-full md:w-[460px] md:max-w-full h-full bg-[#0a222b] border-l border-line shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                {leave.id}
              </span>
              <StatusBadge status={details.status} showIcon />
            </div>
            <h2
              id="leave-detail-title"
              className="font-display font-bold text-[19px] text-ink leading-snug"
            >
              {leave.leaveType}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close leave details drawer"
            className="w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:border-accent/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Request Dates & Summary Box */}
          <div className="p-4 rounded-tpl bg-surface2/40 border border-line space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Duration
              </span>
              <span className="font-mono font-semibold text-ink">
                {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">Working Days</span>
              <span className="font-mono font-bold text-accent">
                {leave.days} {leave.days === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">Applied On</span>
              <span className="font-mono text-ink text-[12px]">
                {formatDecisionTimestamp(leave.appliedOn)}
              </span>
            </div>
          </div>

          {/* Employee Reason */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted" /> Employee Reason
            </span>
            <p className="p-3.5 rounded-tpl bg-surface2/30 border border-line text-[13px] text-ink leading-relaxed">
              {leave.reason}
            </p>
          </div>

          {/* Red Highlighted Rejection Box (Requirement 5) */}
          {isRejected && (
            <div
              role="alert"
              className="p-4 rounded-tpl bg-rose-500/15 border border-rose-400/50 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-rose-300 font-bold text-[12px] uppercase tracking-wider">
                <XCircle className="w-4 h-4 shrink-0" />
                Rejection Reason
              </div>
              <p className="text-[13px] text-rose-100 leading-relaxed">
                {details.finalRemark}
              </p>
              <p className="text-[11px] text-rose-300/80 font-mono">
                Declined by {details.decidedByName} · {formatDecisionTimestamp(details.decidedAt)}
              </p>
            </div>
          )}

          {/* Escalation Notice Banner (>48h SLA triggered) */}
          {isEscalated && (
            <div className="p-3.5 rounded-tpl bg-orange-500/15 border border-orange-400/50 flex items-start gap-2.5 text-[12px]">
              <AlertTriangle className="w-4 h-4 text-orange-300 shrink-0 mt-0.5" />
              <div className="text-orange-100 leading-relaxed">
                <strong className="text-orange-300 block">48-Hour SLA Escalation Triggered</strong>
                Manager did not act within 48 hours of submission ({Math.floor(details.hoursElapsed)}h elapsed).
                HR&apos;s decision now serves as the final authority.
              </div>
            </div>
          )}

          {/* 3-Step Approval Timeline: TL -> MANAGER (FINAL) -> HR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted font-bold font-mono">
                Approval Workflow (3 Steps)
              </span>
              <span className="text-[11px] text-muted">
                TL &amp; HR are recommendations
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-line/60">
              {STEP_ORDER.map((stepMeta) => {
                const step = getApprovalByRole(leave, stepMeta.role) || {
                  role: stepMeta.role,
                  name: 'Unassigned',
                  decision: 'Pending',
                  remark: 'No action recorded yet.',
                  decidedAt: null
                };

                const isMgrUndecidedAfter48h =
                  stepMeta.role === 'MANAGER' &&
                  isEscalated &&
                  normalizeDecision(step.decision) === 'Pending';

                const isHrFinalDueToEscalation =
                  stepMeta.role === 'HR' && isEscalated;

                const visuals = getStepVisuals(step.decision, isMgrUndecidedAfter48h);
                const StepIcon = visuals.Icon;

                return (
                  <div key={stepMeta.role} className="relative">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-1 w-6 h-6 rounded-full border flex items-center justify-center bg-[#0a222b] ${visuals.ringBg}`}
                    >
                      <StepIcon className={`w-3.5 h-3.5 ${visuals.iconColor}`} strokeWidth={2} />
                    </div>

                    {/* Step Card */}
                    <div
                      className={`p-3.5 rounded-tpl border space-y-1.5 ${
                        stepMeta.isManagerFinal && !isEscalated
                          ? 'bg-accent/5 border-accent/40'
                          : isHrFinalDueToEscalation
                          ? 'bg-orange-500/10 border-orange-400/45'
                          : 'bg-surface2/35 border-line/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-[13px] text-ink">
                            {stepMeta.title}
                          </span>

                          {stepMeta.isManagerFinal && (
                            <span className="px-2 py-0.5 rounded bg-accent text-on-accent font-mono font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> FINAL
                            </span>
                          )}

                          {isHrFinalDueToEscalation ? (
                            <span className="px-2 py-0.5 rounded bg-orange-400 text-[#06141c] font-mono font-extrabold text-[10px] tracking-wider uppercase">
                              FINAL (ESCALATED)
                            </span>
                          ) : (
                            stepMeta.subBadge && (
                              <Tag color="muted">{stepMeta.subBadge}</Tag>
                            )
                          )}
                        </div>

                        <span className={`text-[11px] font-semibold ${visuals.labelColor}`}>
                          {visuals.labelText}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[12px] text-muted">
                        <span className="font-medium text-ink/90">{step.name}</span>
                        <span className="font-mono text-[11px]">
                          {formatDecisionTimestamp(step.decidedAt)}
                        </span>
                      </div>

                      <p className="text-[12px] text-muted leading-relaxed pt-1 border-t border-line/30">
                        &ldquo;{step.remark}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Final Decision Box (Requirement 5) */}
          <div className="p-4 rounded-tpl bg-surface2/60 border border-accent/35 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[12px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {isEscalated
                  ? details.authorityLabel
                  : 'Final decision by Manager'}
              </span>
              <StatusBadge status={details.status} />
            </div>

            <p className="text-[13px] text-ink leading-relaxed">
              {isEscalated
                ? details.finalRemark
                : managerStep?.remark || details.finalRemark}
            </p>

            <p className="text-[11px] text-muted font-mono">
              Authority: {details.decidedByName || managerStep?.name || 'Priya Nair'}
              {details.decidedAt ? ` · ${formatDecisionTimestamp(details.decidedAt)}` : ''}
            </p>
          </div>
        </div>

        {/* Drawer Footer: Cancel Button ONLY for Pending Requests (Requirement 7) */}
        <div className="px-5 py-4 border-t border-line bg-[#081b22] flex items-center justify-between gap-3 shrink-0">
          {isPending ? (
            <button
              type="button"
              onClick={() => setConfirmCancelOpen(true)}
              disabled={isCancelling}
              className="px-4 py-2 rounded-tpl border border-rose-400/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-[13px] font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              Cancel Leave Request
            </button>
          ) : (
            <span className="text-[11px] text-muted">
              Only Pending requests can be cancelled.
            </span>
          )}

          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>

        {/* Confirm Cancellation Dialog */}
        {confirmCancelOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-cancel-title"
          >
            <div className="w-full max-w-sm rounded-tpl bg-[#0a222b] border border-line shadow-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 id="confirm-cancel-title" className="font-display font-bold text-[16px] text-ink">
                    Cancel Pending Leave?
                  </h3>
                  <p className="text-[12px] text-muted leading-relaxed">
                    Are you sure you want to cancel <strong className="text-ink">{leave.id}</strong> ({leave.leaveType}, {leave.days} {leave.days === 1 ? 'day' : 'days'})? Your leave balance will be restored immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/50">
                <SecondaryButton
                  size="sm"
                  onClick={() => setConfirmCancelOpen(false)}
                  disabled={isCancelling}
                >
                  Keep Request
                </SecondaryButton>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-1.5 rounded-tpl bg-rose-500 hover:bg-rose-400 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Leave'}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default LeaveDetailPanel;

