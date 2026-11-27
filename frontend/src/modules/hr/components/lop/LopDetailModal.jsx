import React from 'react';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { formatCurrency } from '../../utils/format.js';

export const LopDetailModal = ({ record, onClose }) => {
  if (!record) return null;

  const isApproved = record.status === "Approved" || record.status === "Processed in Payroll";
  const isPending = record.status === "Pending Approval";
  const isRejected = record.status === "Rejected";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full !p-6 border border-line relative animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Icon name="alert-triangle" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-base">{record.id}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isApproved ? "bg-good/15 text-good border-good/30" :
                  isPending ? "bg-accent2/20 text-accent2 border-accent2/40" :
                  isRejected ? "bg-bad/15 text-bad border-bad/30" :
                  "bg-surface2 text-muted border-line"
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-xs text-muted font-data">
                Payroll Cycle: <strong className="text-ink">{record.payrollMonth}</strong>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface2/60 border border-line text-muted hover:text-ink cursor-pointer transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 py-4 text-xs font-data">
          {/* Employee Card (ప్రొఫెషనల్ లుక్ కోసం పిక్చర్ పూర్తిగా తొలగించబడింది) */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line/60 flex items-center justify-between">
            <div>
              <div className="font-bold text-ink text-sm">{record.employeeName}</div>
              <div className="text-muted text-[11px] mt-0.5">
                <span className="font-mono text-accent">{record.employeeId}</span> · {record.department} · {record.designation}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10.5px] text-muted block">Daily Salary Rate:</span>
              <strong className="text-ink text-sm font-num">{formatCurrency(record.dailyRate)}</strong>
            </div>
          </div>

          {/* LOP Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface/40 border border-line/60">
              <span className="text-muted text-[10.5px] block">From Date</span>
              <strong className="text-ink font-semibold">{record.fromDate}</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface/40 border border-line/60">
              <span className="text-muted text-[10.5px] block">To Date</span>
              <strong className="text-ink font-semibold">{record.toDate}</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface/40 border border-line/60">
              <span className="text-muted text-[10.5px] block">LOP Type</span>
              <strong className="text-ink font-semibold">{record.lopType}</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface/40 border border-line/60">
              <span className="text-muted text-[10.5px] block">Working Days</span>
              <strong className="text-ink font-num font-bold text-sm">{record.lopDays} Days</strong>
            </div>
          </div>

          {/* Financial Deduction Banner */}
          <div className="p-3.5 rounded-xl bg-bad/10 border border-bad/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-bad font-semibold block">Total Loss of Pay Deduction:</span>
              <div className="text-xl font-num font-extrabold text-bad">
                {formatCurrency(record.totalDeduction)}
              </div>
            </div>
            <div className="text-right text-[11px] text-muted">
              Formula: {record.lopDays} days × {formatCurrency(record.dailyRate)} / day
            </div>
          </div>

          {/* Reason & Remarks */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface/40 border border-line/60">
            <div>
              <span className="text-muted text-[11px] font-semibold block">Reason for LOP:</span>
              <div className="text-ink font-bold mt-0.5">{record.reason}</div>
            </div>
            {record.remarks && (
              <div className="pt-2 border-t border-line/40">
                <span className="text-muted text-[11px] font-semibold block">HR Remarks / Notes:</span>
                <p className="text-ink/90 mt-0.5 font-body leading-relaxed">{record.remarks}</p>
              </div>
            )}
          </div>

          {/* Supporting Attachment */}
          {record.attachment && (
            <div className="p-3 rounded-xl bg-surface2/30 border border-line/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="file-text" className="w-4 h-4 text-accent" />
                <span className="font-semibold text-ink">{record.attachment}</span>
                {record.attachmentSize && (
                  <span className="text-muted text-[10px]">({record.attachmentSize})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => alert(`Opening ${record.attachment}`)}
                className="text-accent hover:underline text-xs font-semibold cursor-pointer"
              >
                View File
              </button>
            </div>
          )}

          {/* Audit Trail */}
          <div className="p-3 rounded-xl bg-surface2/30 border border-line/60 space-y-1.5 text-[11px] text-muted">
            <div className="flex justify-between">
              <span>Created By:</span>
              <strong className="text-ink">{record.createdBy || "HR Admin"}</strong>
            </div>
            {record.createdAt && (
              <div className="flex justify-between">
                <span>Created On:</span>
                <span className="text-ink">{new Date(record.createdAt).toLocaleString()}</span>
              </div>
            )}
            {record.approvedBy && (
              <div className="flex justify-between">
                <span>Approved By:</span>
                <strong className="text-good">{record.approvedBy}</strong>
              </div>
            )}
            {record.approvedAt && (
              <div className="flex justify-between">
                <span>Approved On:</span>
                <span className="text-good">{new Date(record.approvedAt).toLocaleString()}</span>
              </div>
            )}
            {record.rejectedBy && (
              <div className="flex justify-between">
                <span>Rejected By:</span>
                <strong className="text-bad">{record.rejectedBy}</strong>
              </div>
            )}
            {record.rejectionReason && (
              <div className="flex justify-between text-bad">
                <span>Rejection Reason:</span>
                <span className="font-semibold">{record.rejectionReason}</span>
              </div>
            )}
            {record.processedAt && (
              <div className="flex justify-between text-accent">
                <span>Processed in Payroll:</span>
                <span>{new Date(record.processedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-line/60">
          <SecondaryButton onClick={onClose}>
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};