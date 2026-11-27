// src/components/leave/ApplyLeaveModal.jsx
// Responsive modal dialog for applying leave with auto-calculated days, balance caps, and date validations.

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { calculateWorkingDays, leaveService } from '../../services/leaveService.js';

const LEAVE_TYPES = [
  { key: 'casual', label: 'Casual Leave' },
  { key: 'sick', label: 'Sick Leave' },
  { key: 'earned', label: 'Earned Leave' }
];

export function ApplyLeaveModal({
  isOpen,
  onClose,
  onSuccess,
  balances = {}
}) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form each time modal opens
  useEffect(() => {
    if (isOpen) {
      setLeaveType('Casual Leave');
      setFromDate('');
      setToDate('');
      setReason('');
      setTouched({});
      setSubmitError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  const currentTypeKey = useMemo(() => {
    const lower = leaveType.toLowerCase();
    if (lower.includes('casual')) return 'casual';
    if (lower.includes('sick')) return 'sick';
    return 'earned';
  }, [leaveType]);

  const availableBalance = balances?.[currentTypeKey]?.available ?? 0;

  // Auto-calculated working days
  const calculatedDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    return calculateWorkingDays(fromDate, toDate);
  }, [fromDate, toDate]);

  // Synchronous client-side field validation
  const fieldErrors = useMemo(() => {
    const errs = {};
    if (!leaveType) errs.leaveType = 'Leave type is required.';
    if (!fromDate) errs.fromDate = 'From date is required.';
    if (!toDate) errs.toDate = 'To date is required.';

    if (fromDate && toDate) {
      const s = new Date(`${fromDate}T00:00:00`);
      const e = new Date(`${toDate}T00:00:00`);
      if (e < s) {
        errs.toDate = 'To date cannot be before From date.';
      } else if (calculatedDays <= 0) {
        errs.days = 'Selected range contains only weekends/holidays (0 working days).';
      } else if (calculatedDays > availableBalance) {
        errs.days = `Requested ${calculatedDays} day(s) exceeds your available ${leaveType} balance (${availableBalance} left).`;
      }
    }

    if (!reason.trim()) {
      errs.reason = 'Reason for absence is required.';
    } else if (reason.trim().length < 5) {
      errs.reason = 'Please provide at least 5 characters explaining the reason.';
    }

    return errs;
  }, [leaveType, fromDate, toDate, calculatedDays, availableBalance, reason]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ leaveType: true, fromDate: true, toDate: true, reason: true });
    setSubmitError('');

    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Also verify overlap & service-level policy checks
      const validation = await leaveService.validateRequest({
        leaveType,
        fromDate,
        toDate,
        reason
      });

      if (!validation.isValid) {
        setSubmitError(validation.errors[0] || 'Invalid leave request.');
        setIsSubmitting(false);
        return;
      }

      const result = await leaveService.applyLeave({
        leaveType,
        fromDate,
        toDate,
        days: calculatedDays,
        reason
      });

      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      setSubmitError(err.message || 'Could not submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-leave-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose?.()}
        aria-hidden="true"
      />

      {/* Modal Card: full screen on mobile, centered card on sm+ */}
      <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-[#0a222b] border-0 sm:border border-line rounded-none sm:rounded-tpl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-mono text-accent font-semibold block">
              NEW REQUEST
            </span>
            <h2 id="apply-leave-modal-title" className="font-display font-bold text-[19px] text-ink">
              Apply for Leave
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close Apply Leave modal"
            className="w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:border-accent/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-5 space-y-4 text-[13px]">
          {submitError && (
            <div
              role="alert"
              className="p-3 rounded-tpl bg-rose-500/15 border border-rose-400/50 text-rose-200 text-[12px] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label htmlFor="modal-leave-type" className="block text-[12px] uppercase tracking-wider font-bold text-muted mb-1.5">
              Leave Type *
            </label>
            <select
              id="modal-leave-type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3.5 py-2.5 text-ink text-[13px] focus:outline-none focus:border-accent"
            >
              {LEAVE_TYPES.map((t) => {
                const avail = balances?.[t.key]?.available ?? 0;
                return (
                  <option key={t.key} value={t.label}>
                    {t.label} ({avail} days available)
                  </option>
                );
              })}
            </select>
            {touched.leaveType && fieldErrors.leaveType && (
              <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.leaveType}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-from-date" className="block text-[12px] uppercase tracking-wider font-bold text-muted mb-1.5">
                From Date *
              </label>
              <input
                id="modal-from-date"
                type="date"
                required
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setTouched((prev) => ({ ...prev, fromDate: true }));
                }}
                aria-invalid={!!(touched.fromDate && fieldErrors.fromDate)}
                className={`w-full bg-surface2 border rounded-tpl px-3.5 py-2.5 text-ink text-[13px] focus:outline-none focus:border-accent font-mono ${
                  touched.fromDate && fieldErrors.fromDate ? 'border-rose-400' : 'border-line'
                }`}
              />
              {touched.fromDate && fieldErrors.fromDate && (
                <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.fromDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="modal-to-date" className="block text-[12px] uppercase tracking-wider font-bold text-muted mb-1.5">
                To Date *
              </label>
              <input
                id="modal-to-date"
                type="date"
                required
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setTouched((prev) => ({ ...prev, toDate: true }));
                }}
                aria-invalid={!!(touched.toDate && fieldErrors.toDate)}
                className={`w-full bg-surface2 border rounded-tpl px-3.5 py-2.5 text-ink text-[13px] focus:outline-none focus:border-accent font-mono ${
                  touched.toDate && fieldErrors.toDate ? 'border-rose-400' : 'border-line'
                }`}
              />
              {touched.toDate && fieldErrors.toDate && (
                <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.toDate}</p>
              )}
            </div>
          </div>

          {/* Auto-Calculated Days & Balance Preview */}
          <div className={`p-3.5 rounded-tpl border space-y-1.5 ${
            fieldErrors.days && (touched.fromDate || touched.toDate)
              ? 'bg-rose-500/15 border-rose-400/50'
              : 'bg-surface2/45 border-line'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                Auto-calculated Working Days
              </span>
              <span className={`font-display font-bold text-[17px] tabular-nums ${
                calculatedDays > availableBalance ? 'text-rose-300' : 'text-accent'
              }`}>
                {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted font-mono">
              <span>Available {leaveType}: {availableBalance} days</span>
              {calculatedDays > 0 && calculatedDays <= availableBalance && (
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Remaining after: {availableBalance - calculatedDays} days
                </span>
              )}
            </div>

            {fieldErrors.days && (touched.fromDate || touched.toDate) && (
              <p className="text-[11px] text-rose-300 font-medium pt-0.5">
                {fieldErrors.days}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="modal-leave-reason" className="block text-[12px] uppercase tracking-wider font-bold text-muted mb-1.5">
              Reason for Leave *
            </label>
            <textarea
              id="modal-leave-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setTouched((prev) => ({ ...prev, reason: true }));
              }}
              placeholder="Explain why you are requesting leave (required)..."
              aria-invalid={!!(touched.reason && fieldErrors.reason)}
              className={`w-full bg-surface2 border rounded-tpl px-3.5 py-2.5 text-ink text-[13px] focus:outline-none focus:border-accent ${
                touched.reason && fieldErrors.reason ? 'border-rose-400' : 'border-line'
              }`}
            />
            {touched.reason && fieldErrors.reason && (
              <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.reason}</p>
            )}
          </div>

          {/* Authority Rule Note */}
          <div className="p-3 rounded-tpl bg-surface2/30 border border-line/70 flex items-start gap-2 text-[11px] text-muted leading-relaxed">
            <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              Your request goes to <strong>TL (Vikram Rao)</strong>, <strong>Manager (Priya Nair · Final Authority)</strong>, and <strong>HR (Ananya Deshmukh)</strong>. If the Manager does not act within 48 hours, it escalates to HR as final authority.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-line/50 flex items-center justify-end gap-2.5">
            <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeaveModal;

