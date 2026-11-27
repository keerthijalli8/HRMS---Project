import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';
import {
  approveRegularization,
  rejectRegularization
} from '../../services/attendanceService.js';
import {
  loadWfhRequests,
  saveWfhRequests
} from '../../services/wfoWfhStore.js';
import { formatDate } from '../../services/attendanceLog.js';

export const ApprovalsPanel = ({
  regularizationRequests = [],
  wfhRequests = [],
  reviewer,
  onTriggerToast,
  onRefresh
}) => {
  const [commentInputs, setCommentInputs] = useState({});
  const [activeSubTab, setActiveSubTab] = useState("all"); // "all" | "regularization" | "wfh"

  const pendingReg = regularizationRequests.filter(r => r.status === "Pending");
  const pendingWfh = wfhRequests.filter(w => w.status === "Pending");

  const handleApproveReg = (id) => {
    const comment = commentInputs[id] || "";
    const res = approveRegularization(id, reviewer, comment);
    if (res.ok) {
      onTriggerToast?.(res.message);
      onRefresh?.();
    } else {
      onTriggerToast?.(res.error || "Approval failed");
    }
  };

  const handleRejectReg = (id) => {
    const comment = commentInputs[id] || "";
    const res = rejectRegularization(id, reviewer, comment);
    if (res.ok) {
      onTriggerToast?.(res.message);
      onRefresh?.();
    } else {
      onTriggerToast?.(res.error || "Rejection failed");
    }
  };

  const handleApproveWfh = (id) => {
    const requests = loadWfhRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = "Approved";
      req.reviewedBy = reviewer?.name || "Manager";
      req.reviewedAt = new Date().toISOString();
      req.comments = commentInputs[id] || "Approved by Manager";
      saveWfhRequests(requests);
      onTriggerToast?.(`Approved WFH pass for ${req.employeeName}`);
      onRefresh?.();
    }
  };

  const handleRejectWfh = (id) => {
    const requests = loadWfhRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = "Rejected";
      req.reviewedBy = reviewer?.name || "Manager";
      req.reviewedAt = new Date().toISOString();
      req.comments = commentInputs[id] || "Rejected by Manager";
      saveWfhRequests(requests);
      onTriggerToast?.(`Rejected WFH request for ${req.employeeName}`);
      onRefresh?.();
    }
  };

  const totalPending = pendingReg.length + pendingWfh.length;

  return (
    <div className="glass-card !p-5 border border-line gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Icon name="check-circle" className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-sm sm:text-base text-ink">
            Pending Team Approvals
          </h3>
          {totalPending > 0 ? (
            <span className="glass-pill px-2.5 py-0.5 text-xs font-bold text-warn border-warn/40 bg-warn/10 font-num animate-pulse">
              {totalPending} action required
            </span>
          ) : (
            <span className="glass-pill px-2.5 py-0.5 text-xs font-semibold text-good border-good/40 bg-good/10">
              All caught up
            </span>
          )}
        </div>

        {/* Sub-tab pills */}
        <div className="inline-flex items-center gap-1 p-0.5 bg-surface2 rounded-xl border border-line text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab("all")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeSubTab === "all" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            All ({totalPending})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("regularization")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeSubTab === "regularization" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Regularization ({pendingReg.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("wfh")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeSubTab === "wfh" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            WFH Passes ({pendingWfh.length})
          </button>
        </div>
      </div>

      {totalPending === 0 ? (
        <div className="py-8 text-center text-muted text-xs">
          No pending regularization or WFH approval requests from your team.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 1. Pending Regularization Requests */}
          {(activeSubTab === "all" || activeSubTab === "regularization") &&
            pendingReg.map(req => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl bg-surface2/40 border border-line flex flex-col gap-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">
                      Regularization
                    </span>
                    <strong className="text-ink font-semibold">{req.employeeName}</strong>
                    <span className="text-muted">({req.employeeId} · {req.dept})</span>
                  </div>
                  <span className="text-muted font-num">{formatDate(req.dateKey)}</span>
                </div>

                <div className="text-muted">
                  Requested Punch: <strong className="text-ink font-num">{req.requestedIn} – {req.requestedOut}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2/60 border border-line text-ink italic">
                  "{req.reason}"
                </div>

                {/* Reviewer Comment & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/40">
                  <input
                    type="text"
                    placeholder="Optional reviewer note…"
                    value={commentInputs[req.id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="flex-1 min-w-[200px] bg-surface2/80 border border-line rounded-lg px-2.5 py-1 text-xs text-ink focus:border-accent outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectReg(req.id)}
                      className="px-3 py-1 rounded-lg border border-bad/40 text-bad hover:bg-bad/15 font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveReg(req.id)}
                      className="px-3 py-1 rounded-lg bg-good text-bg font-bold hover:brightness-105 transition shadow-sm cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* 2. Pending WFH Requests */}
          {(activeSubTab === "all" || activeSubTab === "wfh") &&
            pendingWfh.map(req => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl bg-surface2/40 border border-line flex flex-col gap-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      WFH Pass
                    </span>
                    <strong className="text-ink font-semibold">{req.employeeName}</strong>
                    <span className="text-muted">({req.employeeId} · {req.department})</span>
                  </div>
                  <span className="text-muted font-num">{req.dates}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2/60 border border-line text-ink italic">
                  "{req.reason}"
                </div>

                {/* Reviewer Comment & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/40">
                  <input
                    type="text"
                    placeholder="Optional reviewer note…"
                    value={commentInputs[req.id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="flex-1 min-w-[200px] bg-surface2/80 border border-line rounded-lg px-2.5 py-1 text-xs text-ink focus:border-accent outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectWfh(req.id)}
                      className="px-3 py-1 rounded-lg border border-bad/40 text-bad hover:bg-bad/15 font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveWfh(req.id)}
                      className="px-3 py-1 rounded-lg bg-good text-bg font-bold hover:brightness-105 transition shadow-sm cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
