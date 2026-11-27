// src/components/StatusBadge.jsx
// Reusable leave status badge component matching Monsoon Glass and prompt color rules.

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Ban } from 'lucide-react';

const STATUS_VARIANTS = {
  Approved: {
    container: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/45',
    dot: 'bg-emerald-400',
    Icon: CheckCircle2
  },
  Pending: {
    container: 'text-yellow-300 bg-yellow-500/15 border-yellow-400/45',
    dot: 'bg-yellow-400',
    Icon: Clock
  },
  Rejected: {
    container: 'text-rose-300 bg-rose-500/15 border-rose-400/45',
    dot: 'bg-rose-400',
    Icon: XCircle
  },
  Escalated: {
    container: 'text-orange-300 bg-orange-500/15 border-orange-400/50',
    dot: 'bg-orange-400',
    Icon: AlertTriangle
  },
  Cancelled: {
    container: 'text-slate-300 bg-slate-500/15 border-slate-400/35',
    dot: 'bg-slate-400',
    Icon: Ban
  }
};

export function StatusBadge({ status = 'Pending', showIcon = false, className = '' }) {
  const normalized = Object.keys(STATUS_VARIANTS).find(
    (k) => k.toLowerCase() === String(status).toLowerCase()
  ) || 'Pending';

  const variant = STATUS_VARIANTS[normalized];
  const Icon = variant.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border whitespace-nowrap select-none ${variant.container} ${className}`}
    >
      {showIcon ? (
        <Icon className="w-3 h-3 shrink-0" strokeWidth={2} />
      ) : (
        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${variant.dot}`} />
      )}
      <span>{normalized}</span>
    </span>
  );
}

export default StatusBadge;

