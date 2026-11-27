// src/components/Progress.jsx
// Progress bar: 8px high, pill, surface2 track + line border, accent fill (warn when at risk, bad overdue).

import React from 'react';

export function Progress({
  value = 0,
  max = 100,
  variant = 'accent', // 'accent' | 'warn' | 'bad' | 'good'
  height = 8,
  className = '',
  label = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let fillClass = 'bg-accent';
  if (variant === 'warn') fillClass = 'bg-warn';
  if (variant === 'bad') fillClass = 'bg-bad';
  if (variant === 'good') fillClass = 'bg-good';

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${Math.round(percentage)}% completed`}
      style={{ height: `${height}px` }}
      className={`w-full rounded-full bg-surface2 border border-line overflow-hidden p-[1px] ${className}`}
    >
      <div
        style={{ width: `${percentage}%` }}
        className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
      />
    </div>
  );
}

export default Progress;

