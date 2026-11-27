import React, { useId } from 'react';

// PERFORMANCE_CHART_ALIGNMENT_V1

export const SparkLineChart = ({
  data = [91, 88, 93, 90, 94, 92, 95],
  labels = [
    '28 Sep',
    '05 Oct',
    '12 Oct',
    '19 Oct',
    '26 Oct',
    '02 Nov',
    '09 Nov'
  ],
  height = 160,
  minVal = 80,
  maxVal = 100,
  title = 'Attendance Trend',
  unit = '%',
  showYAxis = true
}) => {

  const gradientId = useId();

  if (!Array.isArray(data) || !data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ minHeight: height }}
      >
        No chart data available
      </div>
    );
  }

  const w = 460;
  const h = height;

  const l = showYAxis ? 36 : 24;
  const r = showYAxis ? 20 : 28;
  const t = showYAxis ? 16 : 30;
  const b = 28;

  const range = maxVal - minVal || 1;

  const getX = index =>
    data.length === 1
      ? l + (w - l - r) / 2
      : l + (
          index * (w - l - r)
        ) / (data.length - 1);

  const getY = value =>
    t + (
      (maxVal - value) * (h - t - b)
    ) / range;

  const pts = data.map(
    (value, index) => [
      getX(index),
      getY(value)
    ]
  );

  const lineD = pts.map(
    (point, index) =>
      `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`
  ).join(' ');

  const areaD = lineD +
    ` L${pts[pts.length - 1][0].toFixed(1)} ${h - b}` +
    ` L${pts[0][0].toFixed(1)} ${h - b} Z`;

  const gridSteps = showYAxis
    ? [80, 85, 90, 95, 100]
    : Array.from(
        { length: 5 },
        (_, index) =>
          minVal + range * index / 4
      );

  const lastPt = pts[pts.length - 1];
  const lastVal = data[data.length - 1];

  const labelStep = showYAxis
    ? 1
    : Math.max(
        1,
        Math.ceil(data.length / 7)
      );

  return (
    <div className="w-full min-w-0">

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block w-full h-auto overflow-visible select-none"
        role="img"
        aria-label={`${title} over ${data.length} periods ending at ${lastVal}${unit}`}
      >

        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--accent)"
              stopOpacity="0.28"
            />

            <stop
              offset="100%"
              stopColor="var(--accent)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* GRID LINES */}

        {gridSteps.map(value => {

          const y = getY(value);

          return (
            <g key={value}>

              <line
                x1={l}
                x2={w - r}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeDasharray="3 4"
                strokeWidth="1"
                opacity={showYAxis ? 1 : 0.65}
              />

              {showYAxis && (
                <text
                  x={l - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--muted)] text-[10px] font-data"
                >
                  {value}
                </text>
              )}

            </g>
          );
        })}

        {/* CHART AREA */}

        <path
          d={areaD}
          fill={`url(#${gradientId})`}
        />

        {/* PERFORMANCE LINE */}

        <path
          d={lineD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* PERFORMANCE DATA POINTS */}

        {!showYAxis && pts.map((point, index) => (
          <circle
            key={index}
            cx={point[0]}
            cy={point[1]}
            r="2.5"
            fill="var(--accent)"
          >
            <title>
              {`${labels[index] || `Period ${index + 1}`}: ${data[index]}${unit}`}
            </title>
          </circle>
        ))}

        {/* DATE LABELS */}

        {labels.slice(0, data.length).map((label, index) => {

          if (
            index % labelStep !== 0 &&
            index !== data.length - 1
          ) {
            return null;
          }

          return (
            <text
              key={`${label}-${index}`}
              x={getX(index)}
              y={h - 8}
              textAnchor="middle"
              className="fill-[var(--muted)] text-[10px] font-data"
            >
              {label}
            </text>
          );
        })}

        {/* LATEST VALUE */}

        <circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r="4.5"
          fill="var(--accent)"
        />

        <circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r="7"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          opacity="0.6"
        />

        <text
          x={lastPt[0]}
          y={lastPt[1] - 12}
          textAnchor="middle"
          className="fill-[var(--ink)] text-[11px] font-bold font-data"
        >
          {lastVal}{unit}
        </text>

      </svg>

    </div>
  );
};