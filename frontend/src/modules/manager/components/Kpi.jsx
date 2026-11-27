import React from 'react';

export default function Kpi({
  label,
  value,
  delta,
  deltaType = 'neutral', // 'good', 'warn', 'bad', 'neutral'
  change,
  sublabel,
  trend,
  className = '',
  onClick,
}) {
  const displayDelta = delta || change;
  let effectiveType = deltaType;
  if (trend === 'up') effectiveType = 'good';
  else if (trend === 'down') effectiveType = 'bad';
  else if (trend === 'warn') effectiveType = 'warn';

  let deltaColor = 'text-muted';
  if (effectiveType === 'good') deltaColor = 'text-good';
  if (effectiveType === 'warn') deltaColor = 'text-warn';
  if (effectiveType === 'bad') deltaColor = 'text-bad';

  return (
    <div
      onClick={onClick}
      className={`glass-card justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-accent/40 active:scale-[0.99]' : ''
      } ${className}`}
      style={{
        padding: '10px 14px',
        gap: '4px',
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted truncate">
        {label}
      </div>

      <div
        className="font-display font-bold text-ink tabular-nums leading-none tracking-tight"
        style={{ fontSize: 'clamp(18px, 1.6vw, 22px)' }}
      >
        {value}
      </div>

      {(displayDelta || sublabel) && (
        <div className="flex items-center justify-between gap-1 text-[11px] font-body leading-tight truncate">
          {displayDelta && (
            <span className={`truncate font-medium ${deltaColor}`}>
              {displayDelta}
            </span>
          )}
          {sublabel && (
            <span className="text-muted/70 text-[10px] truncate ml-auto">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
