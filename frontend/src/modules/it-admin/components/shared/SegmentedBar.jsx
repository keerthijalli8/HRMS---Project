import React from 'react';

/**
 * Stacked/segmented bars: 14-16px high, 2px gaps, pill ends (asset status split, ticket priority split).
 * items: Array<{ key, label, count, color }>
 */
export function SegmentedBar({ items = [], total, className = '' }) {
  const sum = total || items.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div
        style={{
          height: '14px',
          borderRadius: '9999px',
        }}
        className="flex w-full overflow-hidden gap-[2px] bg-surface2/50 p-[1px]"
      >
        {items.map((item, idx) => {
          const widthPct = Math.max(item.count > 0 ? 3 : 0, (item.count / sum) * 100);
          if (item.count <= 0) return null;
          return (
            <div
              key={item.key || idx}
              style={{
                width: `${widthPct}%`,
                backgroundColor: item.color || 'var(--accent)',
              }}
              title={`${item.label}: ${item.count} (${Math.round((item.count / sum) * 100)}%)`}
              className="h-full transition-all first:rounded-l-full last:rounded-r-full"
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
        {items.map((item, idx) => (
          <div key={item.key || idx} className="flex items-center gap-1.5">
            <span
              style={{ backgroundColor: item.color || 'var(--accent)' }}
              className="w-2.5 h-2.5 rounded-full shrink-0"
              aria-hidden="true"
            />
            <span className="text-ink font-medium">{item.count}</span>
            <span className="text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
