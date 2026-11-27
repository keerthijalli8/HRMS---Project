import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon.jsx';
import { KPITile } from '../components/KPITile.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { Select } from '../components/Select.jsx';
import { formatDate } from '../utils/format.js';
import {
  loadApprovals,
  saveApprovals,
  subscribeApprovals,
  getApprovalStats,
  canUserApproveRequest,
  approveRequest,
  rejectRequest,
  APPROVAL_CATEGORIES
} from '../services/approvalStore.js';
import {
  loadLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
} from '../services/leaveService.js';
import { ApproveLeaveModal } from '../components/leave/ApproveLeaveModal.jsx';
import { RejectLeaveModal } from '../components/leave/RejectLeaveModal.jsx';

export const ApprovalsView = ({ currentUser, setCurrentRoute, onTriggerToast }) => {
  const [approvalsList, setApprovalsList] = useState(() => loadApprovals());
  const [activeCategory, setActiveCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Pending"); // "Pending" | "All" | "Approved" | "Rejected"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [detailsModalItem, setDetailsModalItem] = useState(null);
  const [approveConfirmItem, setApproveConfirmItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [leaveApproveModalItem, setLeaveApproveModalItem] = useState(null);
  const [leaveRejectModalItem, setLeaveRejectModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscribe to live approval updates
  useEffect(() => {
    const unsub = subscribeApprovals(() => {
      setApprovalsList(loadApprovals());
    });
    return unsub;
  }, []);

  // Compute live stats
  const stats = useMemo(() => {
    const pendingItems = approvalsList.filter(i => i.status === "Pending");
    return {
      totalPending: pendingItems.length,
      leavePending: pendingItems.filter(i => i.type === "Leave Requests").length,
      wfhPending: pendingItems.filter(i => i.type === "WFH Requests").length,
      attendancePending: pendingItems.filter(i => i.type === "Attendance Corrections").length,
      docPending: pendingItems.filter(i => i.type === "Document Verification").length
    };
  }, [approvalsList]);

  // Role permissions
  const isEmployeeRole = (currentUser?.systemRole || currentUser?.role || "").toLowerCase() === "employee";
  const userEmpId = currentUser?.employeeId || currentUser?.id;

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return approvalsList.filter(item => {
      // If regular employee, only show their own submitted requests
      if (isEmployeeRole && userEmpId) {
        if (item.employeeId !== userEmpId) return false;
      }

      // Category filter
      if (activeCategory !== "All" && item.type !== activeCategory) {
        return false;
      }

      // Status filter
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.employeeName || "").toLowerCase().includes(q);
        const matchesId = (item.employeeId || "").toLowerCase().includes(q);
        const matchesDept = (item.department || "").toLowerCase().includes(q);
        const matchesTitle = (item.title || "").toLowerCase().includes(q);
        const matchesReqId = (item.id || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept && !matchesTitle && !matchesReqId) {
          return false;
        }
      }

      return true;
    });
  }, [approvalsList, activeCategory, statusFilter, searchQuery, isEmployeeRole, userEmpId]);

  // Leave Approval Routing Helpers
  const handleInitiateApprove = (req) => {
    if (req.type === "Leave Requests") {
      const leaveRequests = loadLeaveRequests();
      const match = leaveRequests.find(r => r.id === req.id || r.approvalStoreId === req.id || (r.employeeId === req.employeeId && r.status === "Pending"));
      if (match) {
        setLeaveApproveModalItem(match);
      } else {
        setLeaveApproveModalItem({
          id: req.id,
          approvalStoreId: req.id,
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          department: req.department,
          designation: req.role,
          leaveType: req.title?.includes("(") ? req.title.split("(")[0].trim() : (req.title || "Casual Leave"),
          dates: req.dates,
          daysCount: 1,
          appliedReason: req.reason,
          status: "Pending"
        });
      }
    } else {
      setApproveConfirmItem(req);
    }
  };

  const handleInitiateReject = (req) => {
    if (req.type === "Leave Requests") {
      const leaveRequests = loadLeaveRequests();
      const match = leaveRequests.find(r => r.id === req.id || r.approvalStoreId === req.id || (r.employeeId === req.employeeId && r.status === "Pending"));
      if (match) {
        setLeaveRejectModalItem(match);
      } else {
        setLeaveRejectModalItem({
          id: req.id,
          approvalStoreId: req.id,
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          department: req.department,
          designation: req.role,
          leaveType: req.title?.includes("(") ? req.title.split("(")[0].trim() : (req.title || "Casual Leave"),
          dates: req.dates,
          daysCount: 1,
          appliedReason: req.reason,
          status: "Pending"
        });
      }
    } else {
      setRejectItem(req);
      setRejectionReason("");
    }
  };

  const handleConfirmLeaveApprove = ({ note, isLop }) => {
    if (!leaveApproveModalItem) return;
    const res = approveLeaveRequest(leaveApproveModalItem.id, currentUser, { note, isLop });
    if (res.ok) {
      onTriggerToast?.(`Leave approved for ${leaveApproveModalItem.employeeName}`);
      setLeaveApproveModalItem(null);
    } else {
      onTriggerToast?.(res.error || "Failed to approve leave request");
    }
  };

  const handleConfirmLeaveReject = ({ rejectionReason: rReason, reasonDetails: rDetails }) => {
    if (!leaveRejectModalItem) return;
    const res = rejectLeaveRequest(leaveRejectModalItem.id, currentUser, { rejectionReason: rReason, reasonDetails: rDetails });
    if (res.ok) {
      onTriggerToast?.(`Leave rejected for ${leaveRejectModalItem.employeeName}`);
      setLeaveRejectModalItem(null);
    } else {
      onTriggerToast?.(res.error || "Failed to reject leave request");
    }
  };

  // Execute Approve (Non-leave)
  const handleExecuteApprove = () => {
    if (!approveConfirmItem) return;
    setIsProcessing(true);

    const res = approveRequest(approveConfirmItem.id, currentUser, approveComment);
    setIsProcessing(false);

    if (res.ok) {
      onTriggerToast?.(`Approved request ${approveConfirmItem.id} successfully!`);
      setApproveConfirmItem(null);
      setApproveComment("");
    } else {
      onTriggerToast?.(res.error || "Failed to approve request");
    }
  };

  // Execute Reject
  const handleExecuteReject = () => {
    if (!rejectItem) return;
    if (!rejectionReason.trim()) {
      onTriggerToast?.("Please enter a specific rejection reason.");
      return;
    }

    setIsProcessing(true);
    const res = rejectRequest(rejectItem.id, currentUser, rejectionReason);
    setIsProcessing(false);

    if (res.ok) {
      onTriggerToast?.(`Request ${rejectItem.id} rejected.`);
      setRejectItem(null);
      setRejectionReason("");
    } else {
      onTriggerToast?.(res.error || "Failed to reject request");
    }
  };

  // Category Color Badge
  const getCategoryBadge = (type) => {
    switch (type) {
      case "Leave Requests":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "WFH Requests":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "Attendance Corrections":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "Document Verification":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-surface2 text-ink border-line";
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in">
      {/* ================= 1. HEADER & ACTIONS ================= */}
      <div className="glass-card !p-4 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="check" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-ink text-base sm:text-lg">
                  Approvals & Compliance Management
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warn/15 text-warn border border-warn/30">
                  {stats.totalPending} Pending Sign-offs
                </span>
              </div>
              <p className="text-[12px] text-muted">
                Centralized authorization queue for Leave, WFH passes, Attendance regularizations, and Candidate credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SecondaryButton icon="arrow-right" onClick={() => setCurrentRoute("overview")}>
              Back to Dashboard
            </SecondaryButton>
          </div>
        </div>
      </div>

      {/* ================= 2. APPROVALS DASHBOARD (5 KPI SUMMARY TILES) ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPITile
          metric={stats.totalPending}
          label="Total Pending Approvals"
          icon="alert-triangle"
          trend="Action Required"
          isWarn={stats.totalPending > 0}
        />
        <KPITile
          metric={stats.leavePending}
          label="Leave Requests"
          icon="calendar"
          trend="Medical / Casual"
        />
        <KPITile
          metric={stats.wfhPending}
          label="WFH Requests"
          icon="home"
          trend="Remote Work"
        />
        <KPITile
          metric={stats.attendancePending}
          label="Attendance Corrections"
          icon="clock"
          trend="Geofence / Punch"
        />
        <KPITile
          metric={stats.docPending}
          label="Document Verification"
          icon="file-text"
          trend="Candidate Onboarding"
        />
      </div>

      {/* ================= 3. FILTER & SEARCH CONTROLS ================= */}
      <div className="glass-card !p-3.5 border border-line flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "All", label: `All Requests (${approvalsList.length})` },
            { id: "Leave Requests", label: `Leave (${stats.leavePending})` },
            { id: "WFH Requests", label: `WFH (${stats.wfhPending})` },
            { id: "Attendance Corrections", label: `Attendance (${stats.attendancePending})` },
            { id: "Document Verification", label: `Documents (${stats.docPending})` }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap text-xs ${
                activeCategory === cat.id
                  ? "bg-accent text-on-accent shadow-sm"
                  : "bg-surface2/60 text-muted hover:text-ink hover:bg-surface2 border border-line/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative min-w-[180px] max-w-xs">
            <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, ID, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg text-xs text-ink pl-8 pr-3 py-1.5 outline-none focus:border-accent"
            />
          </div>

          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
            ariaLabel="Filter approvals by status"
          >
            <option value="Pending">Pending Only</option>
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </Select>
        </div>
      </div>

      {/* ================= 4. PENDING APPROVALS TABLE ================= */}
      <div className="glass-card !p-0 overflow-hidden border border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="p-3 pl-4">Request ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Department</th>
                <th className="p-3">Request Type</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Request Details</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-medium">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-good/15 text-good flex items-center justify-center">
                        <Icon name="check" className="w-6 h-6 text-good" />
                      </div>
                      <div className="font-bold text-ink text-sm">All clear! No pending approvals found</div>
                      <p className="text-xs text-muted max-w-sm">
                        All compliance requests have been signed and authorized. New submissions will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const isPending = req.status === "Pending";
                  const canApprove = canUserApproveRequest(currentUser, req);

                  return (
                    <tr key={req.id} className="hover:bg-surface2/30 transition">
                      {/* Request ID */}
                      <td className="p-3 pl-4 font-mono font-bold text-accent whitespace-nowrap">
                        {req.id}
                      </td>

                      {/* Employee */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={req.employeeName} employeeId={req.employeeId} size="sm" />
                          <div>
                            <div className="font-semibold text-ink text-xs">{req.employeeName}</div>
                            <div className="text-[11px] text-muted font-mono">{req.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-3 text-muted whitespace-nowrap">
                        {req.department}
                      </td>

                      {/* Request Type */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadge(req.type)}`}>
                          {req.type}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="p-3 font-num text-muted whitespace-nowrap">
                        {formatDate(req.submittedDate)}
                      </td>

                      {/* Request Details */}
                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-ink truncate">{req.title}</div>
                        <div className="text-[11px] text-muted truncate mt-0.5" title={req.reason}>
                          {req.reason}
                        </div>
                        {req.documentName && (
                          <span className="text-[10.5px] text-accent font-semibold flex items-center gap-1 mt-0.5">
                            <Icon name="file-text" className="w-3 h-3 text-accent" />
                            <span className="truncate">{req.documentName}</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          req.status === "Approved"
                            ? "bg-good/20 text-good border-good/40"
                            : req.status === "Rejected"
                            ? "bg-bad/20 text-bad border-bad/40"
                            : "bg-warn/20 text-warn border-warn/40"
                        }`}>
                          {req.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() => setDetailsModalItem(req)}
                            className="px-2.5 py-1 rounded bg-surface2 border border-line text-ink hover:border-accent text-xs font-semibold transition"
                            title="View Complete Information"
                          >
                            Details
                          </button>

                          {/* Quick Approve / Reject buttons if pending and authorized */}
                          {isPending && canApprove && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleInitiateApprove(req)}
                                className="px-2.5 py-1 rounded bg-good/20 text-good border border-good/40 hover:bg-good hover:text-white text-xs font-semibold transition shadow-sm"
                                title="Approve Request"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInitiateReject(req)}
                                className="px-2.5 py-1 rounded bg-bad/20 text-bad border border-bad/40 hover:bg-bad hover:text-white text-xs font-semibold transition shadow-sm"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: COMPLETE REQUEST DETAILS ================= */}
      {detailsModalItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden my-6 text-xs">
            {/* Header */}
            <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
                  <Icon name="file-text" className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="font-display font-bold text-ink text-base">Request Information</div>
                  <div className="text-xs text-muted font-mono">{detailsModalItem.id} · {detailsModalItem.type}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalItem(null)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
              >
                <Icon name="x" className="w-4 h-4 text-muted" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col gap-4">
              {/* Employee Header */}
              <div className="p-3 rounded-xl bg-surface2/60 border border-line/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={detailsModalItem.employeeName} employeeId={detailsModalItem.employeeId} size="md" />
                  <div>
                    <div className="font-bold text-ink text-sm">{detailsModalItem.employeeName}</div>
                    <div className="text-muted text-[11px] font-mono">{detailsModalItem.employeeId} · {detailsModalItem.department}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  detailsModalItem.status === "Approved"
                    ? "bg-good/20 text-good border-good/40"
                    : detailsModalItem.status === "Rejected"
                    ? "bg-bad/20 text-bad border-bad/40"
                    : "bg-warn/20 text-warn border-warn/40"
                }`}>
                  {detailsModalItem.status}
                </span>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface2/30 border border-line/60">
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Title</span>
                  <span className="font-bold text-ink">{detailsModalItem.title}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Submitted Date</span>
                  <span className="font-data font-semibold text-ink">{detailsModalItem.submittedDate}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Duration / Scope</span>
                  <span className="font-data font-semibold text-ink">{detailsModalItem.dates}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Review Level</span>
                  <span className="font-semibold text-accent">{detailsModalItem.approverRoleNeeded}</span>
                </div>
              </div>

              {/* Reason Explanation */}
              <div>
                <span className="text-muted block text-[10.5px] uppercase font-semibold mb-1">Employee Explanation:</span>
                <div className="p-3 rounded-lg bg-surface2 border border-line text-ink leading-relaxed">
                  "{detailsModalItem.reason}"
                </div>
              </div>

              {/* Supporting Document */}
              {detailsModalItem.documentName && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="file-text" className="w-4 h-4 text-accent" />
                    <div>
                      <div className="font-semibold text-ink text-xs">{detailsModalItem.documentName}</div>
                      <div className="text-muted text-[10px]">Verified Supporting Attachment</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTriggerToast?.(`Opening preview for ${detailsModalItem.documentName}...`)}
                    className="text-accent underline text-xs font-semibold hover:text-white"
                  >
                    Preview
                  </button>
                </div>
              )}

              {/* Review History (if reviewed) */}
              {detailsModalItem.reviewedBy && (
                <div className="p-3 rounded-xl bg-surface2/50 border border-line/80 flex flex-col gap-1">
                  <span className="text-muted block text-[10.5px] uppercase font-semibold">Review Decision:</span>
                  <div className="font-semibold text-ink">
                    Authorized by {detailsModalItem.reviewedBy}
                  </div>
                  <div className="text-muted text-[11px]">
                    "{detailsModalItem.reviewComments}"
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                <SecondaryButton onClick={() => setDetailsModalItem(null)}>
                  Close
                </SecondaryButton>

                {detailsModalItem.status === "Pending" && canUserApproveRequest(currentUser, detailsModalItem) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = detailsModalItem;
                        setDetailsModalItem(null);
                        handleInitiateReject(target);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-bad/20 text-bad border border-bad/40 font-semibold text-xs hover:bg-bad hover:text-white transition"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = detailsModalItem;
                        setDetailsModalItem(null);
                        handleInitiateApprove(target);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-good/20 text-good border border-good/40 font-semibold text-xs hover:bg-good hover:text-white transition"
                    >
                      Approve Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL 2: APPROVE CONFIRMATION ================= */}
      {approveConfirmItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-good/20 text-good flex items-center justify-center font-bold">
                <Icon name="check" className="w-4 h-4 text-good" />
              </div>
              <div>
                <div className="font-display font-bold text-ink text-sm">Approve Request Confirmation</div>
                <div className="text-muted text-[11px] font-mono">{approveConfirmItem.id} · {approveConfirmItem.employeeName}</div>
              </div>
            </div>

            <p className="text-muted text-xs leading-relaxed">
              Are you sure you want to approve this <strong>{approveConfirmItem.type}</strong> for <strong>{approveConfirmItem.employeeName}</strong>? This decision will be logged for SOC-2 audit compliance and will immediately update the pending queue.
            </p>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Approval Notes / Comments <span className="text-muted font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Approved per project roadmap & team allocation..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink text-xs focus:border-accent outline-none"
              />
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-end gap-2">
              <SecondaryButton onClick={() => setApproveConfirmItem(null)}>
                Cancel
              </SecondaryButton>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteApprove}
                className="px-4 py-2 rounded-lg bg-good text-white font-semibold text-xs hover:brightness-105 transition shadow-sm disabled:opacity-50"
              >
                {isProcessing ? "Approving..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL 3: REJECT WITH REASON ================= */}
      {rejectItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-bad/20 text-bad flex items-center justify-center font-bold">
                <Icon name="x" className="w-4 h-4 text-bad" />
              </div>
              <div>
                <div className="font-display font-bold text-ink text-sm">Reject Request with Reason</div>
                <div className="text-muted text-[11px] font-mono">{rejectItem.id} · {rejectItem.employeeName}</div>
              </div>
            </div>

            <p className="text-muted text-xs leading-relaxed">
              Please provide the official reason for declining this <strong>{rejectItem.type}</strong>. The employee will be notified of this reason.
            </p>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Rejection Reason <span className="text-bad">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Mandatory on-site audit presence required; team staffing shortage on requested date..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-lg p-2.5 text-ink text-xs focus:border-accent outline-none resize-none"
              />
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-end gap-2">
              <SecondaryButton onClick={() => setRejectItem(null)}>
                Cancel
              </SecondaryButton>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteReject}
                className="px-4 py-2 rounded-lg bg-bad text-white font-semibold text-xs hover:brightness-105 transition shadow-sm disabled:opacity-50"
              >
                {isProcessing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL 4: SPECIALIZED LEAVE APPROVE MODAL ================= */}
      {leaveApproveModalItem && (
        <ApproveLeaveModal
          item={leaveApproveModalItem}
          onClose={() => setLeaveApproveModalItem(null)}
          onConfirm={handleConfirmLeaveApprove}
        />
      )}

      {/* ================= MODAL 5: SPECIALIZED LEAVE REJECT MODAL ================= */}
      {leaveRejectModalItem && (
        <RejectLeaveModal
          item={leaveRejectModalItem}
          onClose={() => setLeaveRejectModalItem(null)}
          onConfirm={handleConfirmLeaveReject}
        />
      )}
    </div>
  );
};
