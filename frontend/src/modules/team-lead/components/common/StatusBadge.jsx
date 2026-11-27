import React from 'react';
import { STATUS_META } from '../../utils/helpers.js';

export const StatusBadge = ({ status = '', customLabel = null, className = '' }) => {
  const meta = STATUS_META[status.toLowerCase()] || {
    label: customLabel || status,
    color: 'text-muted',
    bg: 'bg-surface2',
    border: 'border-line'
  };

  const displayLabel = customLabel || meta.label || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color} ${meta.border} tabular-nums whitespace-nowrap transition ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-currentColor shrink-0" style={{ backgroundColor: 'currentColor' }} />
      <span>{displayLabel}</span>
    </span>
  );
};
