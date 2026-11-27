import React from 'react';

// Status Pill component with 1px border, 7px dot
export const StatusPill = ({ type = "good", text }) => {
  const typeClasses = {
    good: "border-good/50 text-good",
    warn: "border-warn/50 text-warn",
    bad: "border-bad/50 text-bad",
    info: "border-info/50 text-info",
    accent2: "border-accent2/50 text-accent2",
  }[type] || "border-good/50 text-good";

  const dotBg = {
    good: "bg-good",
    warn: "bg-warn",
    bad: "bg-bad",
    info: "bg-info",
    accent2: "bg-accent2",
  }[type] || "bg-good";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[12px] font-medium ${typeClasses}`}>
      <span className={`w-[7px] h-[7px] rounded-full ${dotBg}`}></span>
      {text}
    </span>
  );
};
