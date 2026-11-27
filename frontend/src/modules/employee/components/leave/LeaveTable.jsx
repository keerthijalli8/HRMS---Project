// src/components/leave/LeaveTable.jsx
// Responsive LeaveTable: table on desktop, stacked clickable cards on mobile, plus skeleton, empty, and error/retry states.

import React from 'react';
import { Calendar, AlertCircle, RefreshCw, Inbox, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../StatusBadge.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { getFinalStatus } from '../../utils/leaveStatus.js';
import { formatDate } from '../../utils/format.js';

export function LeaveTable({
  requests = [],
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  selectedId = null,
  onClearFilter
}) {
  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading leave requests">
        {/* Desktop table skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
                <th className="py-2.5 px-3">Leave Type</th>
                <th className="py-2.5 px-3">From</th>
                <th className="py-2.5 px-3">To</th>
                <th className="py-2.5 px-3">Days</th>
                <th className="py-2.5 px-3">Final Status</th>
                <th className="py-2.5 px-3">Applied On</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-dashed border-line/50 animate-pulse">
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-28 rounded bg-surface2" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-24 rounded bg-surface2" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-24 rounded bg-surface2" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-10 rounded bg-surface2" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-5 w-20 rounded-full bg-surface2" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-24 rounded bg-surface2" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards skeleton */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2.5 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded bg-surface2" />
                <div className="h-5 w-20 rounded-full bg-surface2" />
              </div>
              <div className="h-3.5 w-44 rounded bg-surface2" />
              <div className="h-3 w-32 rounded bg-surface2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error) {
    return (
      <div className="p-8 rounded-tpl bg-bad/10 border border-bad/40 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-11 h-11 rounded-full bg-bad/20 border border-bad/40 flex items-center justify-center text-bad">
          <AlertCircle className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="font-display font-bold text-[15px] text-ink">
            Unable to load leave records
          </h3>
          <p className="text-[12px] text-muted leading-relaxed">
            {error}
          </p>
        </div>
        {onRetry && (
          <PrimaryButton size="sm" onClick={onRetry} className="mt-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </PrimaryButton>
        )}
      </div>
    );
  }

  // 3. Empty State ("No leaves found")
  if (!requests || requests.length === 0) {
    return (
      <div className="p-10 rounded-tpl bg-surface2/25 border border-dashed border-line flex flex-col items-center justify-center text-center gap-3">
        <div className="w-11 h-11 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted">
          <Inbox className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div className="space-y-1">
          <p className="font-display font-bold text-[15px] text-ink">No leaves found</p>
          <p className="text-[12px] text-muted">
            No leave requests match the selected filter criteria.
          </p>
        </div>
        {onClearFilter && (
          <SecondaryButton size="sm" onClick={onClearFilter}>
            Show all requests
          </SecondaryButton>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* DESKTOP VIEW: Responsive Table */}
      <div className="hidden md:block overflow-x-auto -mx-1 px-1">
        <table className="w-full text-left text-[13px] border-collapse min-w-[660px]">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
              <th scope="col" className="py-2.5 px-3 sticky left-0 bg-surface/90 backdrop-blur-sm z-10">
                Leave Type
              </th>
              <th scope="col" className="py-2.5 px-3">From</th>
              <th scope="col" className="py-2.5 px-3">To</th>
              <th scope="col" className="py-2.5 px-3">Days</th>
              <th scope="col" className="py-2.5 px-3">Final Status</th>
              <th scope="col" className="py-2.5 px-3">Applied On</th>
              <th scope="col" className="py-2.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const finalStatus = getFinalStatus(req);
              const isSelected = selectedId === req.id;

              return (
                <tr
                  key={req.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`View leave request ${req.id} (${req.leaveType}, ${finalStatus})`}
                  onClick={() => onRowClick?.(req)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick?.(req);
                    }
                  }}
                  className={`border-b border-dashed border-line/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-accent/10 ${
                    isSelected
                      ? 'bg-accent/10 hover:bg-accent/15'
                      : 'hover:bg-surface2/50'
                  }`}
                >
                  <td className="py-3.5 px-3 sticky left-0 bg-surface/90 backdrop-blur-sm">
                    <div className="font-semibold text-ink">{req.leaveType}</div>
                    <div className="text-[11px] font-mono text-muted">{req.id}</div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-ink whitespace-nowrap">
                    {formatDate(req.fromDate)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-ink whitespace-nowrap">
                    {formatDate(req.toDate)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-ink whitespace-nowrap">
                    {req.days} {req.days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={finalStatus} showIcon />
                  </td>
                  <td className="py-3.5 px-3 font-mono text-muted whitespace-nowrap">
                    {formatDate(req.appliedOn)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW: Stacked Clickable Cards */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {requests.map((req) => {
          const finalStatus = getFinalStatus(req);
          const isSelected = selectedId === req.id;

          return (
            <button
              key={req.id}
              type="button"
              onClick={() => onRowClick?.(req)}
              className={`w-full text-left p-4 rounded-tpl border transition-all flex flex-col gap-2.5 ${
                isSelected
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-surface2/35 hover:bg-surface2/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-[14px] text-ink block">{req.leaveType}</span>
                  <span className="text-[11px] font-mono text-muted">{req.id}</span>
                </div>
                <StatusBadge status={finalStatus} showIcon />
              </div>

              <div className="flex items-center justify-between text-[12px] font-mono text-ink pt-1 border-t border-line/40">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  {formatDate(req.fromDate)} → {formatDate(req.toDate)}
                </span>
                <span className="font-bold text-accent">
                  {req.days} {req.days === 1 ? 'day' : 'days'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Applied: {formatDate(req.appliedOn)}</span>
                <span className="text-accent font-semibold flex items-center gap-0.5">
                  Tap for timeline <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LeaveTable;

