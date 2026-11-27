import React from 'react';

// SVG Sparkline Area Chart Component
export const SVGSparkChart = ({
  points = [35, 42, 45, 58, 62, 70, 84],
  labels = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
  height = 140,
  title = "Workforce trend"
}) => {
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const width = 460;
  const stepX = width / (points.length - 1);
  
  const polyPoints = points.map((p, i) => {
    const x = i * stepX;
    const y = height - 20 - ((p - min) / (max - min)) * (height - 40);
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height - 15} ${polyPoints} ${width},${height - 15}`;
  const lastX = (points.length - 1) * stepX;
  const lastY = height - 20 - ((points[points.length - 1] - min) / (max - min)) * (height - 40);

  return (
    <div className="w-full" role="img" aria-label={`Chart: ${title}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[140px] overflow-visible">
        {/* Grid dashed lines */}
        <line x1="0" y1="20" x2={width} y2="20" stroke="var(--line)" strokeDasharray="3 3" strokeWidth="1" />
        <line x1="0" y1="65" x2={width} y2="65" stroke="var(--line)" strokeDasharray="3 3" strokeWidth="1" />
        <line x1="0" y1="110" x2={width} y2="110" stroke="var(--line)" strokeDasharray="3 3" strokeWidth="1" />

        {/* Area Fill */}
        <polygon points={areaPoints} fill="var(--accent)" fillOpacity="0.14" />

        {/* Stroke Line */}
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polyPoints} />

        {/* Final Point */}
        <circle cx={lastX} cy={lastY} r="4" fill="var(--accent)" stroke="#06141c" strokeWidth="2" />
        <text x={lastX - 28} y={lastY - 8} fill="var(--ink)" fontSize="11" fontWeight="700" fontFamily="Manrope">
          {points[points.length - 1]}
        </text>

        {/* X Labels */}
        {labels.map((l, idx) => (
          <text
            key={idx}
            x={idx * stepX}
            y={height - 2}
            fill="var(--muted)"
            fontSize="10"
            textAnchor={idx === 0 ? "start" : idx === labels.length - 1 ? "end" : "middle"}
            fontFamily="Manrope"
          >
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
};
