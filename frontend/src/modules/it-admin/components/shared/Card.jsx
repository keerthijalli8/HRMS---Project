import React from 'react';

export function Card({
  title,
  subText,
  action,
  children,
  className = '',
  id,
  'data-w': dataW,
  style = {},
  onClick,
  ariaLabel
}) {
  return (
    <section
      id={id}
      data-w={dataW}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? ariaLabel : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      style={{
        background: 'var(--surface)',
        border: 'var(--card-border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--card-shadow)',
        backdropFilter: 'var(--blur)',
        WebkitBackdropFilter: 'var(--blur)',
        padding: 'var(--pad)',
        gap: '14px',
        ...style
      }}
      className={`flex flex-col min-w-0 max-w-full ${className} ${onClick ? 'cursor-pointer transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent' : ''}`}
    >
      {(title || subText || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-col min-w-0">
            {title && (
              <h2 className="font-display font-bold text-[17px] text-ink leading-tight truncate">
                {title}
              </h2>
            )}
            {subText && (
              <p className="dashboard-section-subtitle text-muted leading-normal">
                {subText}
              </p>
            )}
          </div>
          {action && (
            <div className="flex items-center gap-2 shrink-0">
              {action}
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

export function KpiTile({ label, value, delta, subtext, deltaType = 'good', onClick, ariaLabel, compact = false, wrapDetails = false }) {
  const content = (
    <div
      className={`dashboard-metric-card ${compact ? 'dashboard-metric-card--compact' : ''} ${wrapDetails ? 'dashboard-metric-card--wrapped' : ''} flex flex-col justify-between overflow-hidden min-w-0 ${compact ? 'gap-1' : 'gap-1.5'} ${onClick ? 'cursor-pointer hover:bg-surface2 transition-colors' : ''}`}
    >
      <span className="dashboard-metric-label truncate uppercase tracking-[0.08em] font-semibold" title={label}>
        {label}
      </span>
      <div className="dashboard-metric-value truncate font-display font-bold leading-tight tabular-nums" title={String(value)}>
        {value}
      </div>
      {(delta || subtext) && (
        <div className={`dashboard-metric-detail ${wrapDetails ? 'dashboard-metric-detail--wrapped' : ''} flex min-w-0 flex-col items-start text-muted leading-snug ${compact ? 'gap-0' : 'gap-0.5'}`}>
          {delta && (
            <span
              className={`overflow-hidden ${wrapDetails ? 'w-full min-w-0 whitespace-normal break-words' : compact ? 'w-full truncate' : ''} ${deltaType === 'good' ? 'text-good' : deltaType === 'bad' ? 'text-bad' : deltaType === 'warn' ? 'text-warn' : 'text-muted'}`}
              style={compact && !wrapDetails ? undefined : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              title={delta}
            >
              {delta}
            </span>
          )}
          {subtext && (
            <span
              className={`w-full overflow-hidden opacity-80 text-muted ${wrapDetails ? 'min-w-0 whitespace-normal break-words' : 'truncate'}`}
              style={wrapDetails ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } : undefined}
              title={subtext}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel || label}
        className="text-left w-full focus-visible:outline-accent"
      >
        {content}
      </button>
    );
  }

  return content;
}
