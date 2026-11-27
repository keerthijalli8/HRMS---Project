import React from 'react';
import { formatScore, formatPercent } from '../utils/format.js';

// Labelled horizontal progress bar for performance metrics
export const MetricBar = ({ label, weight, score, className = "" }) => {
  const validScore = score !== null && !isNaN(score) ? Math.min(100, Math.max(0, score)) : 0;

  // Determine bar fill color by score band
  let barColorClass = "bg-bad";
  let textColorClass = "text-bad";

  if (validScore >= 80) {
    barColorClass = "bg-good";
    textColorClass = "text-good";
  } else if (validScore >= 65) {
    barColorClass = "bg-accent";
    textColorClass = "text-accent";
  } else if (validScore >= 50) {
    barColorClass = "bg-warn";
    textColorClass = "text-warn";
  }

  return (
    <div className={`flex flex-col gap-1 w-full text-xs ${className}`}>
      <div className="flex items-center justify-between text-[11.5px]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-ink truncate">{label}</span>
          {weight !== undefined && (
            <span className="text-[10px] text-muted font-num font-semibold shrink-0">
              ({formatPercent(weight)})
            </span>
          )}
        </div>
        <div className="font-num font-bold shrink-0 ml-2">
          <span className={textColorClass}>{formatScore(validScore)}</span>
          <span className="text-muted text-[10.5px]"> / 100</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-surface2 border border-line overflow-hidden">
        <div
          className={`h-full ${barColorClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${validScore}%` }}
        />
      </div>
    </div>
  );
};
