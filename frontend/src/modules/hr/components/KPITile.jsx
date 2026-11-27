import React from 'react';
import { Icon } from './Icon.jsx';
import { Num } from './Num.jsx';
import { formatDelta, deltaClass } from '../utils/format.js';

// KPI Tile component
export const KPITile = ({ metric, label, icon, trend, unit, isWarn = false, hideSuffix = false, onClick }) => {
  let trendElement = null;
  if (trend) {
    // Check if trend starts with a +/- delta (e.g. "+4.2%", "-1.2%", "+8.4%")
    const deltaMatch = String(trend).match(/^([+-−]\d+(?:\.\d+)?%?)(.*)$/);
    if (deltaMatch) {
      const deltaVal = deltaMatch[1];
      const rest = deltaMatch[2];
      const color = isWarn ? "text-warn" : deltaClass(deltaVal);
      trendElement = (
        <span className={`font-num font-semibold ${color}`}>
          {formatDelta(deltaVal)}
          {rest && <span className="font-body font-normal text-muted/90 ml-1">{rest.trim()}</span>}
        </span>
      );
    } else {
      trendElement = (
        <span className={`font-medium ${String(trend).startsWith("+") ? "text-good font-num" : isWarn ? "text-warn" : "text-muted"}`}>
          {trend}
        </span>
      );
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`glass-card !p-4 rounded-2xl !gap-1.5 border border-line ${onClick ? 'cursor-pointer hover:border-accent transition-colors' : ''}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex items-center justify-between text-muted">
        <span className="text-[12px] uppercase tracking-wider font-semibold">{label}</span>
        <Icon name={icon} className="w-4 h-4 text-accent" />
      </div>
      <div className="text-[26px] md:text-[32px] text-ink leading-tight flex items-baseline">
        <Num value={metric} unit={unit} weight="font-extrabold" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-[11px]">
          {trendElement}
          {!hideSuffix && <span className="text-muted/80">vs last month</span>}
        </div>
      )}
    </div>
  );
};
