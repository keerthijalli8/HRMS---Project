import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { reviewWfhRequest, reviewExceptionRequest } from '../../services/wfoWfhStore.js';
import { formatDate } from '../../utils/format.js';

export const WfhReviewModal = ({
  isOpen,
  onClose,
  requestItem,
  type = "wfh", // "wfh" | "exception"
  currentUser,
  onTriggerToast
}) => {
  if (!isOpen || !requestItem) return null;

  const [action, setAction] = useState(null); // "Approved" | "Rejected"
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewerName = currentUser?.name || "HR / Manager";

  const handleExecute = (targetStatus) => {
    setIsSubmitting(true);
    let res;
    if (type === "wfh") {
      res = reviewWfhRequest(requestItem.id, {
        status: targetStatus,
        reviewer: reviewerName,
        comments: comments.trim() || (targetStatus === "Approved" ? "Approved by Manager" : "Declined")
      });
    } else {
      res = reviewExceptionRequest(requestItem.id, {
        status: targetStatus,
        reviewer: reviewerName,
        comments: comments.trim() || (targetStatus === "Approved" ? "Exception Approved by HR" : "Exception Declined")
      });
    }
    setIsSubmitting(false);

    if (res.ok) {
      onTriggerToast?.(`${type === "wfh" ? "WFH Request" : "Exception"} ${requestItem.id} marked ${targetStatus}.`);
      onClose();
    } else {
      onTriggerToast?.(res.error || "Failed to update review status");
    }
  };

  const isWfh = type === "wfh";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isWfh ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn"
            }`}>
              <Icon name={isWfh ? "home" : "alert-triangle"} className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-base">
                Review {isWfh ? "WFH Application" : "Attendance Exception"}
              </div>
              <div className="text-xs text-muted font-mono">{requestItem.id}</div>
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

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Employee Card */}
          <div className="p-3 rounded-xl bg-surface2/60 border border-line/80 flex justify-between items-center">
            <div>
              <div className="font-bold text-ink text-sm">{requestItem.employeeName}</div>
              <div className="text-muted text-[11px]">{requestItem.employeeId} · {requestItem.department}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              requestItem.status === "Approved"
                ? "bg-good/20 text-good border-good/40"
                : requestItem.status === "Rejected"
                ? "bg-bad/20 text-bad border-bad/40"
                : "bg-warn/20 text-warn border-warn/40"
            }`}>
              {requestItem.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface2/30 border border-line/60">
            {isWfh ? (
              <>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Dates</span>
                  <span className="font-num font-semibold text-ink text-xs">
                    {formatDate(requestItem.fromDate)} {requestItem.toDate && requestItem.toDate !== requestItem.fromDate ? `to ${formatDate(requestItem.toDate)}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Duration</span>
                  <span className="font-num font-semibold text-ink text-xs">
                    {requestItem.durationDays} Day(s) · {requestItem.workMode}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Date</span>
                  <span className="font-num font-semibold text-ink text-xs">{formatDate(requestItem.date)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px] uppercase">Failure Reason</span>
                  <span className="font-semibold text-warn text-xs">{requestItem.verificationStatus}</span>
                </div>
              </>
            )}
          </div>

          {/* Reason Box */}
          <div>
            <span className="text-muted block text-[10.5px] uppercase font-semibold mb-1">Employee Explanation:</span>
            <div className="p-2.5 rounded-lg bg-surface2 border border-line text-ink text-xs leading-relaxed">
              "{requestItem.reason}"
            </div>
          </div>

          {/* Attached Document (if any) */}
          {requestItem.documentName && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2">
                <Icon name="file-text" className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-ink">{requestItem.documentName}</span>
              </div>
              <span className="text-[10px] text-accent font-semibold uppercase">Verified File</span>
            </div>
          )}

          {/* Reviewer Comments */}
          <div>
            <label className="font-semibold text-ink block mb-1">
              Reviewer Decision Comments <span className="text-muted font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Approved per project roadmap / rejected due to mandatory audit attendance..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg p-2.5 text-ink focus:border-accent outline-none resize-none"
            />
          </div>

          {/* Review Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
            <SecondaryButton onClick={onClose}>Close</SecondaryButton>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleExecute("Rejected")}
                className="px-3.5 py-1.5 rounded-lg bg-bad/15 border border-bad/40 text-bad hover:bg-bad hover:text-white transition font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleExecute("Approved")}
                className="px-3.5 py-1.5 rounded-lg bg-good/20 border border-good/50 text-good hover:bg-good hover:text-white transition font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
