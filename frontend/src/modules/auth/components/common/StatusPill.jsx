// src/components/common/StatusPill.jsx
import React from 'react';

const STATUS_COLOR_MAP = {
  good: 'text-good border-good/40 bg-good/10',
  warn: 'text-warn border-warn/40 bg-warn/10',
  bad: 'text-bad border-bad/40 bg-bad/10',
  info: 'text-info border-info/40 bg-info/10',
  accent2: 'text-accent2 border-accent2/40 bg-accent2/10',
  muted: 'text-muted border-line bg-surface2'
};

const DOT_COLOR_MAP = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  accent2: 'bg-accent2',
  muted: 'bg-muted'
};

export function StatusPill({ status = 'good', label, className = '' }) {
  let colorKey = 'muted';
  const s = (status || '').toLowerCase();

  if (s === 'present' || s === 'in office' || s === 'good' || s === 'approved' || s === 'verified' || s === 'active' || s === 'on track' || s === 'matched') {
    colorKey = 'good';
  } else if (s === 'late' || s === 'half_day' || s === 'half day' || s === 'warn' || s === 'pending') {
    colorKey = 'warn';
  } else if (s === 'absent' || s === 'bad' || s === 'rejected' || s === 'locked' || s === 'failed') {
    colorKey = 'bad';
  } else if (s === 'info' || s === 'in progress') {
    colorKey = 'info';
  } else if (s === 'overridden' || s === 'leave' || s === 'accent2') {
    colorKey = 'accent2';
  }

  const containerStyle = STATUS_COLOR_MAP[colorKey] || STATUS_COLOR_MAP.muted;
  const dotStyle = DOT_COLOR_MAP[colorKey] || DOT_COLOR_MAP.muted;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border leading-tight ${containerStyle} ${className}`}
    >
      <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${dotStyle}`} aria-hidden="true" />
      <span>{label || status}</span>
    </span>
  );
}

export default StatusPill;

