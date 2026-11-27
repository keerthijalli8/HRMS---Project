// src/components/Kpi.jsx
// KPI Tile component with Syne 700 typography, compact glass styling, and interactive navigation support.

import React from 'react';
import { useNavigate } from 'react-router-dom';

export function KpiTile({
  label,
  value,
  delta,
  isPositive,
  subtext,
  icon: Icon,
  className = '',
  valueClassName = '',
  onClick,
  to,
  title,
  ariaLabel
}) {
  const navigate = useNavigate();
  const isInteractive = Boolean(onClick || to);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e);
    }
  };

  const defaultTitle = isInteractive
    ? (title || (to ? `Navigate to ${label}` : `View ${label}`))
    : title;

  return (
    <div
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      title={defaultTitle}
      aria-label={ariaLabel || (isInteractive ? `${label}: ${typeof value === 'string' ? value : ''}` : undefined)}
      data-clickable={isInteractive ? 'true' : undefined}
      className={`kpi-tile overflow-hidden ${
        isInteractive
          ? 'cursor-pointer select-none transition-all duration-200 hover:border-accent/60 hover:bg-surface2/70 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-accent group'
          : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-1.5 text-muted text-[11.5px] font-medium min-w-0">
        <span className="leading-tight min-w-0 group-hover:text-ink transition-colors">{label}</span>
        {Icon && (
          <Icon
            className="w-3.5 h-3.5 text-muted/70 group-hover:text-accent transition-colors shrink-0 mt-0.5"
            strokeWidth={1.8}
          />
        )}
      </div>
      <div
        className={`font-display font-bold text-ink leading-tight tracking-tight tabular-nums min-w-0 max-w-full break-words ${
          valueClassName || 'text-[clamp(19px,1.6vw,24px)]'
        }`}
      >
        {value}
      </div>
      {(delta || subtext) && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] leading-tight min-w-0">
          {delta && (
            <span className={`font-semibold ${isPositive ? 'text-good' : isPositive === false ? 'text-bad' : 'text-muted'}`}>
              {delta}
            </span>
          )}
          {subtext && <span className="text-muted">{subtext}</span>}
        </div>
      )}
    </div>
  );
}

export function KpiGrid({ children, className = '', 'data-w': dataW }) {
  return (
    <div
      data-w={dataW}
      className={`grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[var(--gap)] ${className}`}
    >
      {children}
    </div>
  );
}

export default KpiTile;

