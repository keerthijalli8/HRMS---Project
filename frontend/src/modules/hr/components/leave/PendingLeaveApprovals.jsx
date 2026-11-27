import React, { useState, useEffect, useMemo } from 'react';
import {
  loadLeaveRequests,
  getPendingLeaveRequests,
  getDecidedLeaveRequests,
  subscribeLeave,
  approveLeaveRequest,
  rejectLeaveRequest,
  revokeLeaveRequest,
  canUserApproveLeave,
  getSpecificLeaveTypeBalance
} from '../../services/leaveService.js';
import { ApproveLeaveModal } from './ApproveLeaveModal.jsx';
import { RejectLeaveModal } from './RejectLeaveModal.jsx';
import { RevokeLeaveModal } from './RevokeLeaveModal.jsx';

export const PendingLeaveApprovals = ({
  currentUser,
  onTriggerToast,
  defaultTab = "pending", // "pending" | "decided"
  showTabs = true,
  className = ""
}) => {
  const [requests, setRequests] = useState(() => loadLeaveRequests());
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isProcessingId, setIsProcessingId] = useState(null);

  // Modal states
  const [approveModalItem, setApproveModalItem] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [revokeModalItem, setRevokeModalItem] = useState(null);

  // Filters for Decided view
  const [decidedStatusFilter, setDecidedStatusFilter] = useState("All");
  const [decidedTypeFilter, setDecidedTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Animation tracking
  const [animatingOutId, setAnimatingOutId] = useState(null);

  useEffect(() => {
    const unsub = subscribeLeave(() => {
      setRequests(loadLeaveRequests());
    });
    return unsub;
  }, []);

  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === "Pending");
  }, [requests]);

  const decidedRequests = useMemo(() => {
    return requests.filter(r => r.status !== "Pending");
  }, [requests]);

  // Filtered decided items
  const filteredDecided = useMemo(() => {
    return decidedRequests.filter(r => {
      if (decidedStatusFilter !== "All" && r.status !== decidedStatusFilter) {
        return false;
      }
      if (decidedTypeFilter !== "All" && r.leaveType !== decidedTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (r.employeeName || "").toLowerCase().includes(q);
        const matchesId = (r.employeeId || "").toLowerCase().includes(q);
        const matchesType = (r.leaveType || "").toLowerCase().includes(q);
        const matchesReason = (r.appliedReason || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesType && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [decidedRequests, decidedStatusFilter, decidedTypeFilter, searchQuery]);

  // ---------------- Handlers ----------------

  const handleApproveConfirm = async ({ note, isLop }) => {
    if (!approveModalItem) return;
    const target = approveModalItem;
    setIsProcessingId(target.id);

    try {
      const res = approveLeaveRequest(target.id, currentUser, { note, isLop });
      if (res.ok) {
        setAnimatingOutId(target.id);
        setApproveModalItem(null);
        setTimeout(() => {
          setAnimatingOutId(null);
          setRequests(loadLeaveRequests());
        }, 300);
        onTriggerToast?.(`Leave approved for ${target.employeeName}`);
      } else {
        onTriggerToast?.(res.error || "Failed to approve leave");
      }
    } catch (err) {
      console.error(err);
      onTriggerToast?.("Error approving leave request. Please retry.");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleRejectConfirm = async ({ rejectionReason, reasonDetails }) => {
    if (!rejectModalItem) return;
    const target = rejectModalItem;
    setIsProcessingId(target.id);

    try {
      const res = rejectLeaveRequest(target.id, currentUser, { rejectionReason, reasonDetails });
      if (res.ok) {
        setAnimatingOutId(target.id);
        setRejectModalItem(null);
        setTimeout(() => {
          setAnimatingOutId(null);
          setRequests(loadLeaveRequests());
        }, 300);
        onTriggerToast?.(`Leave rejected for ${target.employeeName}`);
      } else {
        onTriggerToast?.(res.error || "Failed to reject leave");
      }
    } catch (err) {
      console.error(err);
      onTriggerToast?.("Error rejecting leave request. Please retry.");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleRevokeConfirm = async ({ revokeReason }) => {
    if (!revokeModalItem) return;
    const target = revokeModalItem;
    setIsProcessingId(target.id);

    try {
      const res = revokeLeaveRequest(target.id, currentUser, { revokeReason });
      if (res.ok) {
        setRevokeModalItem(null);
        setRequests(loadLeaveRequests());
        onTriggerToast?.(`Leave revoked for ${target.employeeName}. Quota restored.`);
      } else {
        onTriggerToast?.(res.error || "Failed to revoke leave");
      }
    } catch (err) {
      console.error(err);
      onTriggerToast?.("Error revoking leave. Please retry.");
    } finally {
      setIsProcessingId(null);
    }
  };

  // CSV Export for Decided leaves
  const handleExportCSV = () => {
    try {
      const headers = [
        "Leave ID",
        "Employee Name",
        "Employee ID",
        "Department",
        "Leave Type",
        "Dates",
        "Days",
        "Status",
        "Decision Reason/Note",
        "Decided By",
        "Decided At",
        "Balance Before",
        "Balance After",
        "LOP Mode"
      ];

      const rows = filteredDecided.map(r => [
        `"${r.id}"`,
        `"${r.employeeName}"`,
        `"${r.employeeId}"`,
        `"${r.department}"`,
        `"${r.leaveType}"`,
        `"${r.dates}"`,
        r.daysCount,
        `"${r.status}"`,
        `"${(r.approvalNote || r.reviewComments || r.rejectionReason || "").replace(/"/g, '""')}"`,
        `"${r.decidedBy || ""}"`,
        `"${r.decidedAt || ""}"`,
        r.balanceBefore != null ? r.balanceBefore : "",
        r.balanceAfter != null ? r.balanceAfter : "",
        r.isLop ? "Yes" : "No"
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Leave_Approvals_History_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onTriggerToast?.("Leave history exported to CSV.");
    } catch (e) {
      console.error(e);
      onTriggerToast?.("Failed to export CSV.");
    }
  };

  const isHrOrAdmin = useMemo(() => {
    const role = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    return role.includes("hr") || role.includes("admin");
  }, [currentUser]);

  return (
    <div className={`glass-card flex flex-col gap-3.5 border border-line ${className}`}>
      {/* Top Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/50 pb-3">
        <div>
          <h3 className="font-display font-bold text-ink text-base">
            Leave Approvals &amp; Compliance
          </h3>
          <p className="text-[12px] text-muted -mt-0.5">
            Requires formal HR/Manager sign-off with mandatory notes and live quota reconciliation
          </p>
        </div>

        {/* Tab Switcher: Pending vs Decided */}
        {showTabs && (
          <div className="flex items-center gap-1 bg-surface2/60 p-1 rounded-xl border border-line self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer select-none ${
                activeTab === "pending"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2"
              }`}
            >
              Pending ({pendingRequests.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("decided")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer select-none ${
                activeTab === "decided"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2"
              }`}
            >
              Decided ({decidedRequests.length})
            </button>
          </div>
        )}
      </div>

      {/* ================= VIEW 1: PENDING LEAVE APPROVALS ================= */}
      {activeTab === "pending" && (
        <div className="flex flex-col divide-y divide-dashed divide-line text-xs">
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted text-xs">
              <span className="font-semibold text-ink block">No pending leave requests</span>
              <span className="text-[11px] text-muted">All submitted employee leave applications have been reviewed.</span>
            </div>
          ) : (
            pendingRequests.map((req) => {
              const isAnimating = animatingOutId === req.id;
              const isProcessing = isProcessingId === req.id;
              const canApprove = canUserApproveLeave(currentUser, req);
              const bal = getSpecificLeaveTypeBalance(req.employeeId, req.leaveType);

              return (
                <div
                  key={req.id}
                  className={`py-3 flex flex-col gap-2.5 transition-all duration-300 ${
                    isAnimating ? "opacity-0 -translate-x-4 max-h-0 py-0 overflow-hidden" : "opacity-100"
                  }`}
                >
                  {/* Top line: Employee name, department, leave type and balance */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent font-bold text-xs flex items-center justify-center shrink-0 border border-accent/30">
                        {req.employeeName.split(" ").map(p => p[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-ink text-sm">{req.employeeName}</span>
                          <span className="text-[10.5px] text-muted font-mono">({req.employeeId})</span>
                        </div>
                        <div className="text-muted text-[11px]">
                          <strong className="text-accent font-semibold">{req.leaveType}</strong> ({req.daysCount} {req.daysCount === 1 ? 'Day' : 'Days'}) · {req.dates}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-lg bg-surface2 border border-line text-accent font-bold text-[10.5px] font-num">
                        {bal} Days Bal
                      </span>
                      <span className="text-[10px] text-muted mt-0.5">{req.department}</span>
                    </div>
                  </div>

                  {/* Applied reason */}
                  {req.appliedReason && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-surface2/40 border border-line/50 text-[11px] text-muted italic">
                      "{req.appliedReason}"
                    </div>
                  )}

                  {/* Action Buttons: Approve / Reject (Text only, no circle or extra icons) */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!canApprove || isProcessing}
                      onClick={() => setApproveModalItem(req)}
                      title={canApprove ? "Approve leave request" : "You do not have permission to approve this request"}
                      aria-label={`Approve leave for ${req.employeeName}`}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-good/20 border border-good/50 text-good hover:bg-good hover:text-on-accent text-xs font-bold transition text-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none shadow-sm"
                    >
                      {isProcessing ? "Processing..." : "Approve"}
                    </button>

                    <button
                      type="button"
                      disabled={!canApprove || isProcessing}
                      onClick={() => setRejectModalItem(req)}
                      title={canApprove ? "Reject leave request" : "You do not have permission to reject this request"}
                      aria-label={`Reject leave for ${req.employeeName}`}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-bad/20 border border-bad/50 text-bad hover:bg-bad hover:text-ink text-xs font-bold transition text-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= VIEW 2: DECIDED LEAVE HISTORY ================= */}
      {activeTab === "decided" && (
        <div className="flex flex-col gap-3">
          {/* Decided Filters & Export Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface2/40 p-2.5 rounded-xl border border-line text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={decidedStatusFilter}
                onChange={(e) => setDecidedStatusFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-[#0f2330] border border-line text-xs text-ink focus:border-accent focus:outline-none cursor-pointer"
                aria-label="Filter decided status"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Revoked">Revoked</option>
              </select>

              {/* Leave Type Filter */}
              <select
                value={decidedTypeFilter}
                onChange={(e) => setDecidedTypeFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-[#0f2330] border border-line text-xs text-ink focus:border-accent focus:outline-none cursor-pointer"
                aria-label="Filter decided leave type"
              >
                <option value="All">All Types</option>
                <option value="Medical Leave">Medical Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Earned Leave">Earned Leave</option>
              </select>

              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee..."
                className="h-8 px-2.5 rounded-lg bg-[#0f2330] border border-line text-xs text-ink placeholder-muted focus:border-accent focus:outline-none w-36 sm:w-44"
              />
            </div>

            {/* Export CSV Button (Text only) */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-surface2 hover:bg-surface2/80 border border-line hover:border-accent text-xs font-semibold text-ink transition cursor-pointer select-none self-end sm:self-auto"
            >
              Export CSV
            </button>
          </div>

          {/* Decided Records List */}
          <div className="flex flex-col divide-y divide-line/40 text-xs">
            {filteredDecided.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs">
                <span>No decided leave records match your filter criteria.</span>
              </div>
            ) : (
              filteredDecided.map((req) => {
                const isApproved = req.status === "Approved";
                const isRejected = req.status === "Rejected";
                const isRevoked = req.status === "Revoked";

                return (
                  <div key={req.id} className="py-3 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">{req.employeeName}</span>
                        <span className="text-[11px] text-muted">({req.employeeId})</span>
                        <span className="text-[11px] text-accent font-semibold">{req.leaveType}</span>
                        <span className="text-[11px] text-muted">· {req.dates} ({req.daysCount} d)</span>
                      </div>

                      {/* Decision Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] uppercase tracking-wider border ${
                            isApproved
                              ? "bg-good/20 text-good border-good/40"
                              : isRejected
                              ? "bg-bad/20 text-bad border-bad/40"
                              : "bg-warn/20 text-warn border-warn/40"
                          }`}
                        >
                          {req.status}
                          {req.isLop && " (LOP)"}
                        </span>

                        {/* Revoke button (HR/Admin only, on Approved) */}
                        {isApproved && isHrOrAdmin && (
                          <button
                            type="button"
                            onClick={() => setRevokeModalItem(req)}
                            className="text-[11px] font-semibold text-warn hover:underline px-2 py-0.5 rounded bg-warn/10 border border-warn/30 cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Decision Reason or Note & Audit Details */}
                    <div className="p-2.5 rounded-xl bg-surface2/40 border border-line/50 text-[11.5px] flex flex-col gap-1">
                      {isApproved && req.approvalNote && (
                        <div>
                          <strong className="text-good font-semibold">Approval Note:</strong>{" "}
                          <span className="text-ink">"{req.approvalNote}"</span>
                        </div>
                      )}

                      {isRejected && (
                        <div>
                          <strong className="text-bad font-semibold">Rejection Reason:</strong>{" "}
                          <span className="text-ink">
                            {req.rejectionReason} {req.reasonDetails ? `— "${req.reasonDetails}"` : ""}
                          </span>
                        </div>
                      )}

                      {isRevoked && req.revokeReason && (
                        <div>
                          <strong className="text-warn font-semibold">Revocation Reason:</strong>{" "}
                          <span className="text-ink">"{req.revokeReason}"</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[10.5px] text-muted pt-1 border-t border-line/30 mt-1">
                        <span>
                          Decided by <strong>{req.decidedBy || req.revokedBy || "HR Desk"}</strong> on {req.decidedAt || req.revokedAt || "N/A"}
                        </span>
                        {req.balanceBefore != null && (
                          <span className="font-num">
                            Quota: {req.balanceBefore} → <strong className="text-ink">{req.balanceAfter} Days</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <ApproveLeaveModal
        isOpen={Boolean(approveModalItem)}
        onClose={() => setApproveModalItem(null)}
        request={approveModalItem}
        onConfirm={handleApproveConfirm}
        isSubmitting={Boolean(isProcessingId)}
      />

      {/* Reject Modal */}
      <RejectLeaveModal
        isOpen={Boolean(rejectModalItem)}
        onClose={() => setRejectModalItem(null)}
        request={rejectModalItem}
        onConfirm={handleRejectConfirm}
        isSubmitting={Boolean(isProcessingId)}
      />

      {/* Revoke Modal */}
      <RevokeLeaveModal
        isOpen={Boolean(revokeModalItem)}
        onClose={() => setRevokeModalItem(null)}
        request={revokeModalItem}
        onConfirm={handleRevokeConfirm}
        isSubmitting={Boolean(isProcessingId)}
      />
    </div>
  );
};

export default PendingLeaveApprovals;
