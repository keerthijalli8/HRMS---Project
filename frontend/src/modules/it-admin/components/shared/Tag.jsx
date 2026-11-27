import React from 'react';

// Tag: 10.5px uppercase, surface2 bg, 1px line border, 4px radius (used for roles, asset type, licence type).
export function Tag({ children, className = '' }) {
  return (
    <span
      style={{
        background: 'var(--surface2)',
        borderColor: 'var(--line)',
        borderRadius: '4px',
        fontSize: '10.5px'
      }}
      className={`inline-flex items-center px-1.5 py-0.5 border font-semibold tracking-wider text-muted uppercase shrink-0 ${className}`}
    >
      {children}
    </span>
  );
}
