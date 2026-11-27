import React from 'react';
import { Button } from './Button';

// Empty state: muted 12px text with a line icon, left-aligned, plus a primary button when an action exists.
export function EmptyState({
  icon: Icon,
  message = 'No records found',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-start gap-2.5 py-6 px-3 ${className}`}>
      {Icon && (
        <div className="text-muted/70">
          <Icon className="w-5 h-5 stroke-[1.8]" />
        </div>
      )}
      <p className="text-[12px] text-muted max-w-sm leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
