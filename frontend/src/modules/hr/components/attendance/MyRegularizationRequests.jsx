import React from 'react';
import { Icon } from '../Icon.jsx';
import { formatDate } from '../../services/attendanceLog.js';
import { formatKolkataTime } from '../../services/attendanceService.js';

export const MyRegularizationRequests = ({
  requests = [],
  onNewRequest
}) => {
  return (
    <div className="glass-card !p-5 border border-line gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Icon name="check-square" className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-sm sm:text-base text-ink">
            My Regularization Requests
          </h3>
          <span className="glass-pill px-2 py-0.5 text-[10.5px] font-bold text-accent font-num">
            {requests.length} submitted
          </span>
        </div>

        <button
          type="button"
          onClick={onNewRequest}
          className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Icon name="plus" className="w-3.5 h-3.5 text-on-accent" />
          <span>New Request</span>
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="py-8 text-center text-muted text-xs">
          No punch regularization requests submitted.
        </div>
      ) : (
        <div className="divide-y divide-line/40">
          {requests.map((req) => {
            const isPending = req.status === "Pending";
            const isApproved = req.status === "Approved";
            const isRejected = req.status === "Rejected";

            return (
              <div
                key={req.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface2/20 px-2 rounded-xl transition text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink text-xs">{req.id}</span>
                    <span className="text-muted">·</span>
                    <span className="font-semibold text-ink font-num">{formatDate(req.dateKey)}</span>
                    <span className="text-[11px] text-muted">({req.requestedIn} – {req.requestedOut})</span>
                  </div>
                  <p className="text-muted text-[11.5px] italic">"{req.reason}"</p>
                  {req.comment && (
                    <div className="text-[11px] text-accent mt-0.5">
                      Reviewer Note: {req.comment}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isPending
                        ? "bg-warn/15 text-warn border-warn/40"
                        : isApproved
                        ? "bg-good/15 text-good border-good/40"
                        : "bg-bad/15 text-bad border-bad/40"
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="text-[10px] text-muted font-num">
                    {req.reviewedAt ? `Reviewed ${formatKolkataTime(req.reviewedAt)}` : `Submitted ${formatKolkataTime(req.createdAt)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
