import React from 'react';

/**
 * Charts: SVG, dashed var(--line) grid, accent line 2.5px, accent area fill at 14% opacity, last point filled and labelled, 10px muted labels.
 * Bar/segment charts use accent, accent2 and the four status colours only.
 * role="img" + aria-label.
 */
export function LineChart({
  data = [], // [{ label: '1 Nov', opened: 4, resolved: 3 }]
  xKey = 'label',
  yKey1 = 'opened',
  yKey2 = 'resolved',
  y1Label = 'Opened',
  y2Label = 'Resolved',
  ariaLabel = 'Tickets opened vs resolved over time',
  height = 200,
  className = ''
}) {
  const padding = { top: 20, right: 35, bottom: 30, left: 25 };
  const width = 500;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...data.map(d => Math.max(d[yKey1] || 0, d[yKey2] || 0)),
    6
  );

  const getX = (idx) => padding.left + (idx / Math.max(data.length - 1, 1)) * innerW;
  const getY = (val) => padding.top + innerH - (val / maxVal) * innerH;

  // Build path strings
  let path1 = '';
  let area1 = '';
  let path2 = '';

  data.forEach((d, idx) => {
    const x = getX(idx);
    const y1 = getY(d[yKey1] || 0);
    const y2 = getY(d[yKey2] || 0);

    if (idx === 0) {
      path1 += `M ${x} ${y1}`;
      area1 += `M ${x} ${padding.top + innerH} L ${x} ${y1}`;
      path2 += `M ${x} ${y2}`;
    } else {
      path1 += ` L ${x} ${y1}`;
      area1 += ` L ${x} ${y1}`;
      path2 += ` L ${x} ${y2}`;
    }
  });

  if (data.length > 0) {
    const lastX = getX(data.length - 1);
    area1 += ` L ${lastX} ${padding.top + innerH} Z`;
  }

  const lastD = data[data.length - 1] || {};
  const lastX = getX(data.length - 1);
  const lastY1 = getY(lastD[yKey1] || 0);
  const lastY2 = getY(lastD[yKey2] || 0);

  return (
    <div className={`w-full min-w-0 max-w-full flex flex-col gap-2 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full max-w-full h-auto overflow-hidden select-none"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Horizontal dashed grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = padding.top + innerH * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--line)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                fill="var(--muted)"
                fontSize="10"
                textAnchor="end"
                className="tabular-nums"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Shaded Area for Key1 */}
        {area1 && (
          <path
            d={area1}
            fill="var(--accent)"
            fillOpacity="0.14"
          />
        )}

        {/* Line 1 (Accent - Mint) */}
        {path1 && (
          <path
            d={path1}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Line 2 (Accent 2 - Violet) */}
        {path2 && (
          <path
            d={path2}
            fill="none"
            stroke="var(--accent2)"
            strokeWidth="2.0"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Last points with filled dot and label */}
        {data.length > 0 && (
          <>
            <circle cx={lastX} cy={lastY1} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />
            <text
              x={lastX + 6}
              y={lastY1 + 3}
              fill="var(--accent)"
              fontSize="10"
              fontWeight="bold"
            >
              {lastD[yKey1]}
            </text>

            <circle cx={lastX} cy={lastY2} r="3.5" fill="var(--accent2)" stroke="var(--bg)" strokeWidth="1.5" />
            <text
              x={lastX + 6}
              y={lastY2 + 3}
              fill="var(--accent2)"
              fontSize="10"
              fontWeight="bold"
            >
              {lastD[yKey2]}
            </text>
          </>
        )}

        {/* X-axis labels (first, mid, last) */}
        {data.length > 0 && (
          <>
            <text x={getX(0)} y={height - 8} fill="var(--muted)" fontSize="10" textAnchor="start">
              {data[0][xKey]}
            </text>
            <text x={getX(Math.floor(data.length / 2))} y={height - 8} fill="var(--muted)" fontSize="10" textAnchor="middle">
              {data[Math.floor(data.length / 2)][xKey]}
            </text>
            <text x={getX(data.length - 1)} y={height - 8} fill="var(--muted)" fontSize="10" textAnchor="end">
              {data[data.length - 1][xKey]}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-accent rounded" />
          <span className="text-ink font-medium">{y1Label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-accent2 rounded border-b border-dashed border-accent2" />
          <span className="text-ink font-medium">{y2Label}</span>
        </div>
      </div>
    </div>
  );
}

export function BarChart({
  data = [], // [{ label: 'Eng', value: 18, color: 'var(--accent)' }]
  ariaLabel = 'Bar chart visualization',
  height = 180,
  className = ''
}) {
  const maxVal = Math.max(...data.map(d => d.value || 0), 1) * 1.2;
  const width = 450;
  const padding = { top: 20, right: 15, bottom: 25, left: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barWidth = Math.min(36, (innerW / data.length) * 0.6);

  return (
    <div className={`w-full min-w-0 max-w-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full max-w-full h-auto select-none"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = padding.top + innerH * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--line)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                fill="var(--muted)"
                fontSize="10"
                textAnchor="end"
                className="tabular-nums"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const colX = padding.left + (idx + 0.5) * (innerW / data.length);
          const x = colX - barWidth / 2;
          const barH = (d.value / maxVal) * innerH;
          const y = padding.top + innerH - barH;
          const color = d.color || 'var(--accent)';

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={color}
                fillOpacity="0.78"
                rx="4"
                className="transition-all hover:opacity-85"
              />
              <text
                x={colX}
                y={y - 4}
                fill="var(--ink)"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                className="tabular-nums"
              >
                {d.value}
              </text>
              <text
                x={colX}
                y={height - 8}
                fill="var(--muted)"
                fontSize="10"
                textAnchor="middle"
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

export function DonutChart({
  data = [], // [{ label: 'Laptops', value: 24, color: '#0ea5e9' }]
  size = 170,
  strokeWidth = 22,
  ariaLabel = 'Asset Distribution Donut Chart',
  className = ''
}) {
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className={`flex w-full min-w-0 max-w-full flex-col items-center gap-4 sm:flex-row ${className}`}>
      <div className="relative max-w-full shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] select-none"
          role="img"
          aria-label={ariaLabel}
        >
          {data.map((item, idx) => {
            const pct = item.value / total;
            const dashArray = `${pct * circumference} ${circumference}`;
            const dashOffset = -accumulatedPercent * circumference;
            accumulatedPercent += pct;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all hover:opacity-90"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display font-extrabold text-[20px] text-ink">{total}</span>
          <span className="text-[9.5px] text-muted uppercase tracking-wider font-semibold">Total Fleet</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex min-w-0 flex-col gap-1.5 w-full text-[12px]">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted font-medium truncate">{item.label}</span>
            </div>
            <span className="font-data font-bold text-ink shrink-0">
              {item.value} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
