// src/components/leave/SummaryCards.jsx
// Summary cards displaying leave balances per type plus live Pending / Approved / Rejected counts.

import React from 'react';
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '../Progress.jsx';
import { Tag } from '../Tag.jsx';

export function SummaryCards({
  balances = {},
  counts = { pending: 0, approved: 0, rejected: 0, escalated: 0 },
  loading = false,
  onSelectFilter
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap)]">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="glass-card p-5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 rounded bg-surface2" />
                <div className="h-4 w-8 rounded bg-surface2" />
              </div>
              <div className="h-7 w-20 rounded bg-surface2" />
              <div className="h-1.5 w-full rounded-full bg-surface2" />
              <div className="h-3 w-32 rounded bg-surface2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap)]">
          {[1, 2, 3].map((n) => (
            <div key={n} className="kpi-tile animate-pulse space-y-2">
              <div className="h-3.5 w-24 rounded bg-surface2" />
              <div className="h-7 w-12 rounded bg-surface2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const balanceList = [
    {
      key: 'casual',
      title: balances?.casual?.leaveType || 'Casual Leave',
      code: balances?.casual?.code || 'CL',
      tagColor: 'accent',
      data: balances?.casual || { available: 0, total: 12, used: 0, pending: 0 }
    },
    {
      key: 'sick',
      title: balances?.sick?.leaveType || 'Sick Leave',
      code: balances?.sick?.code || 'SL',
      tagColor: 'info',
      data: balances?.sick || { available: 0, total: 10, used: 0, pending: 0 }
    },
    {
      key: 'earned',
      title: balances?.earned?.leaveType || 'Earned Leave',
      code: balances?.earned?.code || 'EL',
      tagColor: 'accent2',
      data: balances?.earned || { available: 0, total: 18, used: 0, pending: 0 }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Row 1: Leave Balance per Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap)]">
        {balanceList.map((item) => (
          <div
            key={item.key}
            className="glass-card p-5 space-y-2.5 transition-colors hover:border-accent/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-[13px] flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-accent" strokeWidth={1.8} />
                {item.title}
              </span>
              <Tag color={item.tagColor}>{item.code}</Tag>
            </div>

            <div className="font-display font-bold text-[clamp(24px,2.4vw,30px)] text-ink tabular-nums leading-tight">
              {item.data.available}
              <span className="text-[12px] font-normal text-muted ml-1.5">
                / {item.data.total} days left
              </span>
            </div>

            <Progress
              value={item.data.available}
              max={item.data.total || 1}
              height={7}
              variant={item.data.available <= 2 ? 'warn' : 'accent'}
            />

            <div className="flex justify-between text-[11px] text-muted font-mono pt-0.5">
              <span>Used: {item.data.used}</span>
              <span>Pending: {item.data.pending}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Status Counts (Pending / Approved / Rejected) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap)]">
        <button
          type="button"
          onClick={() => onSelectFilter?.('Pending')}
          className="kpi-tile text-left hover:border-yellow-400/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted text-[12px] font-medium">
            <span>Pending Requests</span>
            <Clock className="w-4 h-4 text-yellow-300" strokeWidth={1.8} />
          </div>
          <div className="font-display font-bold text-[clamp(24px,2.5vw,30px)] text-ink tabular-nums">
            {counts.pending}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>Awaiting Manager decision</span>
            {counts.escalated > 0 && (
              <span className="inline-flex items-center gap-1 text-orange-300 font-medium">
                <AlertTriangle className="w-3 h-3" /> {counts.escalated} Escalated
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.('Approved')}
          className="kpi-tile text-left hover:border-emerald-400/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted text-[12px] font-medium">
            <span>Approved Requests</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" strokeWidth={1.8} />
          </div>
          <div className="font-display font-bold text-[clamp(24px,2.5vw,30px)] text-ink tabular-nums">
            {counts.approved}
          </div>
          <div className="text-[11px] text-emerald-300/90 font-medium">
            Granted by final authority
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.('Rejected')}
          className="kpi-tile text-left hover:border-rose-400/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted text-[12px] font-medium">
            <span>Rejected Requests</span>
            <XCircle className="w-4 h-4 text-rose-300" strokeWidth={1.8} />
          </div>
          <div className="font-display font-bold text-[clamp(24px,2.5vw,30px)] text-ink tabular-nums">
            {counts.rejected}
          </div>
          <div className="text-[11px] text-rose-300/90 font-medium">
            Click to review remarks
          </div>
        </button>
      </div>
    </div>
  );
}

export default SummaryCards;

