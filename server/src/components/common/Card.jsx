// src/components/common/Card.jsx
import React from 'react';

export function Card({
  title,
  subtext,
  action,
  children,
  className = '',
  ...props
}) {
  return (
    <section
      className={`glass-card ${className}`}
      {...props}
    >
      {(title || subtext || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line/40 pb-3 flex-wrap">
          <div>
            {title && (
              <h2 className="font-display font-bold text-[17px] text-ink leading-snug">
                {title}
              </h2>
            )}
            {subtext && (
              <p className="text-[12px] text-muted mt-0.5 leading-normal">
                {subtext}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Card;

