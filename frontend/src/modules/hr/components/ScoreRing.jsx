import React from 'react';

// Circular Score Ring component with animated stroke and color by score band
export const ScoreRing = ({ score = null, size = 120, className = "" }) => {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const validScore = score !== null && !isNaN(score) ? Math.min(100, Math.max(0, score)) : null;
  const strokeDash = validScore !== null ? (validScore / 100) * circumference : 0;

  // Determine stroke color class and CSS variable
  let strokeColor = "var(--line)";
  let textColorClass = "text-muted";

  if (validScore !== null) {
    if (validScore >= 80) {
      strokeColor = "var(--good)";
      textColorClass = "text-good";
    } else if (validScore >= 65) {
      strokeColor = "var(--accent)";
      textColorClass = "text-accent";
    } else if (validScore >= 50) {
      strokeColor = "var(--warn)";
      textColorClass = "text-warn";
    } else {
      strokeColor = "var(--bad)";
      textColorClass = "text-bad";
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score: ${validScore !== null ? validScore : 'Not available'} out of 100`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Track circle */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth="7"
          opacity="0.4"
        />

        {/* Progress fill circle */}
        {validScore !== null && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="7"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <div className="font-num font-extrabold text-ink leading-none text-xl sm:text-2xl tabular-nums">
          {validScore !== null ? validScore : "--"}
        </div>
        <div className="text-[10px] text-muted font-num font-semibold mt-0.5">
          /100
        </div>
      </div>
    </div>
  );
};
