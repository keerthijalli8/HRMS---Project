import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { formatCurrency } from '../../utils/format.js';
import { getLopRecords, approveLopRecord, rejectLopRecord } from '../../services/lopService.js';
import { RejectModal } from './RejectModal.jsx';
import { LopDetailModal } from './LopDetailModal.jsx';

export const PendingApprovalsList = ({ currentUser, onTriggerToast }) => {
  const [selectedRecordForReject, setSelectedRecordForReject] = useState(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);

  // Load pending records
  const pendingRecords = useMemo(() => {
    return getLopRecords({ status: "Pending Approval" });
  }, []);

  const handleApprove = (record) => {
    const res = approveLopRecord(record.id, currentUser);
    if (res.ok) {
      onTriggerToast?.(`Approved LOP request ${record.id} for ${record.employeeName}`);
    } else {
      onTriggerToast?.(res.error || "Failed to approve record");
    }
  };

  const handleConfirmReject = (rejectionReason) => {
    if (!selectedRecordForReject) return;
    const res = rejectLopRecord(selectedRecordForReject.id, rejectionReason, currentUser);
    if (res.ok) {
      onTriggerToast?.(`Rejected LOP request ${selectedRecordForReject.id}`);
      setSelectedRecordForReject(null);
    } else {
      onTriggerToast?.(res.error || "Failed to reject record");
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="p-4 rounded-xl bg-surface2/60 border border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent2/15 border border-accent2/30 text-accent2 flex items-center justify-center">
            <Icon name="clock" className="w-5 h-5 text-accent2" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Pending LOP Approvals
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent2/20 text-accent2 border border-accent2/40 font-num">
                {pendingRecords.length} Pending
              </span>
            </h3>
            <p className="text-xs text-muted font-data">
              Review and authorize manual loss of pay records before monthly payroll execution.
            </p>
          </div>
        </div>

        <div className="text-xs text-muted">
          Role: <strong className="text-accent">{currentUser?.role || currentUser?.systemRole || "HR Lead"}</strong>
        </div>
      </div>

      {pendingRecords.length === 0 ? (
        <div className="glass-card !p-12 text-center flex flex-col items-center justify-center border border-line">
          <div className="w-14 h-14 rounded-full bg-good/15 border border-good/30 text-good flex items-center justify-center mb-3">
            <Icon name="check" className="w-7 h-7 text-good" />
          </div>
          <h4 className="text-base font-bold text-ink">All Clear! No Pending LOP Requests</h4>
          <p className="text-xs text-muted mt-1 max-w-sm">
            All submitted loss of pay records have been reviewed. New submissions created by HR will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingRecords.map((r) => (
            <div
              key={r.id}
              className="glass-card !p-5 border border-line hover:border-line/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Employee and Request Info */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <img
                  src={r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={r.employeeName}
                  className="w-11 h-11 rounded-full border border-line object-cover shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink text-sm hover:underline cursor-pointer" onClick={() => setSelectedRecordForDetail(r)}>
                      {r.employeeName}
                    </span>
                    <span className="text-[10.5px] px-2 py-0.5 rounded bg-accent/20 text-accent font-data font-semibold">
                      {r.employeeId}
                    </span>
                    <span className="text-[10.5px] px-2 py-0.5 rounded bg-surface2 text-muted border border-line font-data">
                      {r.department}
                    </span>
                    <span className="text-[10.5px] px-2 py-0.5 rounded bg-accent2/20 text-accent2 border border-accent2/30 font-bold">
                      {r.id}
                    </span>
                  </div>

                  <div className="text-xs text-muted font-data flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Period: <strong className="text-ink">{r.fromDate} → {r.toDate}</strong></span>
                    <span>Type: <strong className="text-ink">{r.lopType}</strong></span>
                    <span>Days: <strong className="text-ink font-num">{r.lopDays} days</strong></span>
                    <span>Month: <strong className="text-accent">{r.payrollMonth}</strong></span>
                  </div>

                  <div className="mt-1 text-xs">
                    <span className="text-muted font-semibold">Reason:</span>{" "}
                    <span className="text-ink font-medium">{r.reason}</span>
                    {r.remarks && (
                      <span className="text-muted italic ml-1">"– {r.remarks}"</span>
                    )}
                  </div>

                  <div className="text-[10.5px] text-muted font-data mt-0.5 flex items-center gap-2">
                    <span>Created by: {r.createdBy}</span>
                    {r.attachment && (
                      <span className="text-accent flex items-center gap-1 font-semibold">
                        <Icon name="file-text" className="w-3 h-3" />
                        {r.attachment}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Deduction Summary & Actions */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-line">
                <div className="text-left md:text-right mb-2">
                  <span className="text-[11px] text-muted block">Payroll Deduction:</span>
                  <div className="text-xl font-num font-extrabold text-bad">
                    {formatCurrency(r.totalDeduction)}
                  </div>
                  <span className="text-[10px] text-muted">Rate: {formatCurrency(r.dailyRate)}/d</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecordForDetail(r)}
                    title="View Details"
                    className="p-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink transition cursor-pointer"
                  >
                    <Icon name="eye" className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedRecordForReject(r)}
                    className="px-3.5 py-2 rounded-xl bg-bad/15 border border-bad/30 text-bad hover:bg-bad/25 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="x" className="w-3.5 h-3.5 text-bad" />
                    <span>Reject</span>
                  </button>

                  <PrimaryButton
                    icon="check"
                    onClick={() => handleApprove(r)}
                  >
                    Approve LOP
                  </PrimaryButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Comments Modal */}
      {selectedRecordForReject && (
        <RejectModal
          record={selectedRecordForReject}
          onConfirm={handleConfirmReject}
          onClose={() => setSelectedRecordForReject(null)}
        />
      )}

      {/* Record Details Modal */}
      {selectedRecordForDetail && (
        <LopDetailModal
          record={selectedRecordForDetail}
          onClose={() => setSelectedRecordForDetail(null)}
        />
      )}
    </div>
  );
};
