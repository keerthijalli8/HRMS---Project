// src/components/Tag.jsx
// Tag: 10.5px uppercase, surface2 bg, 1px line border, 4px radius.

import React from 'react';

export function Tag({ children, className = '', color = 'default' }) {
  let colorClasses = 'bg-surface2 text-muted border-line';
  if (color === 'accent') colorClasses = 'bg-accent/15 text-accent border-accent/30';
  if (color === 'accent2') colorClasses = 'bg-accent2/15 text-accent2 border-accent2/30';
  if (color === 'warn') colorClasses = 'bg-warn/15 text-warn border-warn/30';
  if (color === 'bad') colorClasses = 'bg-bad/15 text-bad border-bad/30';
  if (color === 'good') colorClasses = 'bg-good/15 text-good border-good/30';

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border text-[10.5px] font-semibold uppercase tracking-wider ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
}

export default Tag;

