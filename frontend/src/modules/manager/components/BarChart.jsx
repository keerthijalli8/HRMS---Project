import React from 'react';

export default function BarChart({
  data = [], // [{ label: 'Mon', value: 8 }] or [{ day: 'Mon', count: 8 }]
  height = 140,
  maxVal,
  barColor = 'var(--accent)',
  className = '',
  ariaLabel = 'Bar chart',
}) {
  // Normalize incoming data objects so both { label, value } and { day, count } work flawlessly
  const normalizedData = data.map((item) => {
    const val = Number(item.value ?? item.count ?? item.val ?? 0);
    const lbl = String(item.label ?? item.day ?? item.name ?? '');
    return {
      ...item,
      label: lbl,
      value: val,
    };
  });

  const values = normalizedData.map((d) => d.value);
  const computedMax = maxVal || Math.max(...values, 1);

  return (
    <div
      className={`w-full flex items-end justify-between gap-2.5 sm:gap-3 pt-2 pb-1 ${className}`}
      style={{ height: `${height}px` }}
      role="img"
      aria-label={ariaLabel}
    >
      {normalizedData.map((item, idx) => {
        const heightPct = Math.min(100, Math.max(item.value > 0 ? 8 : 2, (item.value / computedMax) * 100));
        return (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center h-full justify-between group select-none min-w-0"
            title={`${item.label}: ${item.value}`}
          >
            {/* Top Value Counter */}
            <span className="text-[11px] font-mono font-bold text-muted group-hover:text-accent transition-colors tabular-nums shrink-0 leading-tight">
              {item.value}
            </span>

            {/* Bar Slot with subtle track background */}
            <div className="w-full max-w-[28px] sm:max-w-[32px] flex-1 min-h-0 flex items-end justify-center py-1">
              <div className="w-full h-full bg-surface2/30 rounded-t-md flex items-end overflow-hidden">
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 shadow-sm"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: item.color || barColor,
                    borderTop: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                />
              </div>
            </div>

            {/* Bottom Day/Category Label - fully visible, crisp & never cut off */}
            <span className="text-[11.5px] font-semibold font-body text-ink/80 group-hover:text-ink transition-colors shrink-0 text-center truncate w-full leading-normal pt-0.5">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}


