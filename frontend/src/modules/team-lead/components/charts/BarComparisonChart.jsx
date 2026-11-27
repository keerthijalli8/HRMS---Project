import React from 'react';
import { Avatar } from '../common/Avatar.jsx';

export const BarComparisonChart = ({
  items = [],
  metricLabel = "Score",
  maxVal = 100,
  unit = "%"
}) => {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => {
        const pct = Math.min(100, Math.max(0, (item.value / maxVal) * 100));
        const isHigh = item.value >= 90;
        const isMed = item.value >= 75 && item.value < 90;

        return (
          <div key={item.name || idx} className="flex items-center gap-3">
            <Avatar name={item.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-ink truncate">{item.name}</span>
                <span className="font-data font-bold text-ink">
                  {item.value}{unit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface2 border border-line overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh ? 'bg-accent' : isMed ? 'bg-good' : 'bg-warn'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
