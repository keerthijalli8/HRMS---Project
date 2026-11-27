import React from 'react';

/**
 * Progress bar: 8px high, pill, surface2 track + line border, accent fill (warn when at risk, bad when exhausted).
 * Used for licence seat usage and SLA time.
 */
export function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = false,
  warnThreshold = 85,
  dangerThreshold = 100,
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));

  let fillColor = 'var(--accent)';
  if (percentage >= dangerThreshold) {
    fillColor = 'var(--bad)';
  } else if (percentage >= warnThreshold) {
    fillColor = 'var(--warn)';
  }

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-[12px] text-muted">
          {label && <span>{label}</span>}
          {showPercentage && <span className="tabular-nums font-medium text-ink">{percentage}%</span>}
        </div>
      )}
      <div
        style={{
          height: '8px',
          background: 'var(--surface2)',
          border: '1px solid var(--line)',
          borderRadius: '9999px'
        }}
        className="w-full overflow-hidden p-[1px]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax={max}
      >
        <div
          style={{
            width: `${percentage}%`,
            backgroundColor: fillColor,
            borderRadius: '9999px',
            transition: 'width 0.3s ease'
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
