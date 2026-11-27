import React from 'react';
import { formatNumber } from '../../utils/format.js';

export const DepartmentSummaryCards = ({
  summary = {},
  selectedStatus = "All",
  onSelectStatus
}) => {
  const {
    total = 0,
    present = 0,
    absent = 0,
    onLeave = 0,
    wfh = 0,
    late = 0,
    earlyOut = 0,
    notCheckedIn = 0
  } = summary;

  const cards = [
    { key: "All", label: "Total", count: total, color: "text-ink", border: "border-line" },
    { key: "Present", label: "Present", count: present, color: "text-emerald-400", border: "border-emerald-500/30" },
    { key: "Absent", label: "Absent", count: absent, color: "text-rose-400", border: "border-rose-500/30" },
    { key: "On Leave", label: "On Leave", count: onLeave, color: "text-amber-300", border: "border-amber-500/30" },
    { key: "WFH", label: "WFH", count: wfh, color: "text-cyan-400", border: "border-cyan-500/30" },
    { key: "Late", label: "Late", count: late, color: "text-orange-400", border: "border-orange-500/30" },
    { key: "Early Out", label: "Early Out", count: earlyOut, color: "text-yellow-400", border: "border-yellow-500/30" },
    { key: "Not Checked In", label: "Not Checked In", count: notCheckedIn, color: "text-muted", border: "border-line" }
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
      <div className="flex flex-row items-stretch gap-2 min-w-max">
        {cards.map(card => {
          const isSelected = selectedStatus.toLowerCase() === card.key.toLowerCase();
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelectStatus(isSelected && card.key !== "All" ? "All" : card.key)}
              className={`flex-1 min-w-[105px] p-2.5 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-accent/20 border-accent shadow-md scale-[1.02]"
                  : "bg-surface2/30 border-line hover:border-accent/40 hover:bg-surface2/50"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
                  {card.label}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </div>
              <div className={`font-num font-extrabold text-base sm:text-lg ${card.color} mt-1`}>
                {formatNumber(card.count)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
