// src/components/SegBar.jsx
// Segmented bar: 14-16px high, 2px gaps, pill ends.

import React from 'react';

export function SegBar({ segments = [], height = 14, className = '', label = '' }) {
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1;

  return (
    <div
      role="meter"
      aria-label={label || 'Breakdown bar'}
      style={{ height: `${height}px` }}
      className={`w-full flex gap-[2px] rounded-full overflow-hidden p-[1px] bg-surface2 border border-line ${className}`}
    >
      {segments.map((seg, idx) => {
        const pct = Math.max(0, (seg.value / total) * 100);
        if (pct <= 0) return null;

        const isFirst = idx === 0;
        const isLast = idx === segments.length - 1;

        return (
          <div
            key={idx}
            title={`${seg.label || ''}: ${seg.value} (${Math.round(pct)}%)`}
            style={{
              width: `${pct}%`,
              backgroundColor: seg.color || 'var(--accent)'
            }}
            className={`h-full transition-all duration-300 relative group ${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`}
          />
        );
      })}
    </div>
  );
}

export default SegBar;

