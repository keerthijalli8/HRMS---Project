import React, { useState } from 'react';

export const SegmentedProgressBar = ({ segments = [], className = "" }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const total = segments.reduce((sum, s) => sum + (s.count || 0), 0) || 1;

  return (
    <div className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {/* Progress Bar Track */}
      <div 
        className="w-full h-3 rounded-full bg-surface2/60 border border-line/60 overflow-hidden flex relative select-none"
        role="progressbar"
        aria-label="Monthly Attendance Progress Bar"
      >
        {segments.map((segment, index) => {
          if (!segment.count || segment.count <= 0) return null;
          const pct = Math.max(2, (segment.count / total) * 100);

          return (
            <div
              key={segment.key || index}
              onMouseEnter={() => setHoveredSegment(segment)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{ width: `${pct}%` }}
              className={`h-full ${segment.color} transition-all duration-300 relative group cursor-pointer hover:brightness-110`}
              title={`${segment.count} ${segment.label} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Floating Hover Tooltip if hovering a segment */}
      {hoveredSegment && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-lg bg-surface text-ink text-[11px] font-semibold border border-line shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-150 z-20 font-data">
          <span className={hoveredSegment.textColor || "text-accent"}>
            ● {hoveredSegment.count} {hoveredSegment.label}
          </span>
          <span className="text-muted ml-1.5 font-num">
            ({Math.round((hoveredSegment.count / total) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
};
