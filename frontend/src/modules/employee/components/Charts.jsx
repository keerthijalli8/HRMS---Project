// src/components/Charts.jsx
// Lightweight SVG charts matching Monsoon Glass design tokens:
// dashed grid, accent line 2.5px, 14% accent area, last point labelled, role="img" + aria-label.

import React from 'react';

export function LineChart({
  data = [], // [{ label: 'Q1', value: 3.9 }, ...]
  height = 140,
  ariaLabel = 'Performance Rating Trend Chart',
  minY = 3.0,
  maxY = 5.0,
  unit = '',
  className = ''
}) {
  if (!data || data.length === 0) return null;

  const width = 450;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const normalizedY = (d.value - minY) / (maxY - minY);
    const y = height - paddingY - normalizedY * chartH;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Horizontal dashed grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = height - paddingY - ratio * chartH;
          const val = (minY + ratio * (maxY - minY)).toFixed(1);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--line)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                fill="var(--muted)"
                fontSize="10"
                textAnchor="end"
                fontFamily="var(--font-data)"
              >
                {val}{unit}
              </text>
            </g>
          );
        })}

        {/* 14% accent area fill */}
        <path d={areaD} fill="var(--accent)" fillOpacity="0.14" />

        {/* Accent line 2.5px */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, idx) => {
          const isLast = idx === points.length - 1;
          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isLast ? 4.5 : 3}
                fill={isLast ? "var(--accent)" : "var(--bg)"}
                stroke="var(--accent)"
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={height - 8}
                fill="var(--muted)"
                fontSize="10"
                textAnchor="middle"
                fontFamily="var(--font-data)"
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Last point label pill */}
        {lastPoint && (
          <g>
            <rect
              x={lastPoint.x - 20}
              y={lastPoint.y - 24}
              width="40"
              height="18"
              rx="9"
              fill="var(--surface2)"
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={lastPoint.x}
              y={lastPoint.y - 12}
              fill="var(--ink)"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="var(--font-data)"
            >
              {lastPoint.value}{unit}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function BarChart({
  data = [], // [{ label: '01 Nov', hours: 8.5 }, ...]
  height = 160,
  targetLine = 8,
  ariaLabel = 'Daily Working Hours Chart',
  className = ''
}) {
  if (!data || data.length === 0) return null;

  const width = 500;
  const paddingX = 35;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;
  const maxVal = 10; // Max 10 hours

  const targetY = height - paddingY - (targetLine / maxVal) * chartH;
  const barWidth = Math.min(22, (chartW / data.length) * 0.65);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Horizontal grid */}
        {[0, 4, 8].map((val) => {
          const y = height - paddingY - (val / maxVal) * chartH;
          return (
            <g key={val}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--line)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                fill="var(--muted)"
                fontSize="10"
                textAnchor="end"
                fontFamily="var(--font-data)"
              >
                {val}h
              </text>
            </g>
          );
        })}

        {/* 8h Target Threshold Line */}
        <line
          x1={paddingX}
          y1={targetY}
          x2={width - paddingX}
          y2={targetY}
          stroke="var(--accent)"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <text
          x={width - paddingX + 4}
          y={targetY + 3}
          fill="var(--accent)"
          fontSize="9"
          fontWeight="bold"
        >
          8h Goal
        </text>

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingX + (i / data.length) * chartW + (chartW / data.length - barWidth) / 2;
          const barH = (Math.min(maxVal, d.hours) / maxVal) * chartH;
          const y = height - paddingY - barH;
          const isAtOrAboveGoal = d.hours >= targetLine;
          const isShort = d.hours > 0 && d.hours < 4.5;

          const fillColor = isShort ? 'var(--bad)' : isAtOrAboveGoal ? 'var(--accent)' : 'var(--warn)';

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="3"
                fill={fillColor}
                opacity={d.hours === 0 ? 0.2 : 0.85}
              />
              <text
                x={x + barWidth / 2}
                y={height - 8}
                fill="var(--muted)"
                fontSize="9"
                textAnchor="middle"
                fontFamily="var(--font-data)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default LineChart;

