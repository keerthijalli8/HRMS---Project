import React from 'react';
import { formatNumber } from '../../utils/format.js';

export const DepartmentSummaryStrip = ({ overall = {} }) => {
  const {
    total = 0,
    present = 0,
    absent = 0,
    onLeave = 0,
    wfh = 0,
    late = 0
  } = overall;

  const items = [
    { label: "Total", value: total, dotColor: "bg-ink/40", textColor: "text-ink" },
    { label: "Present", value: present, dotColor: "bg-emerald-400", textColor: "text-emerald-400" },
    { label: "Absent", value: absent, dotColor: "bg-rose-400", textColor: "text-rose-400" },
    { label: "On Leave", value: onLeave, dotColor: "bg-amber-400", textColor: "text-amber-300" },
    { label: "WFH", value: wfh, dotColor: "bg-cyan-400", textColor: "text-cyan-400" },
    { label: "Late", value: late, dotColor: "bg-orange-400", textColor: "text-orange-400" }
  ];

  return (
    <div className="w-full bg-surface2/30 border border-line rounded-2xl p-2.5 sm:p-3 shadow-sm backdrop-blur-md">
      <div className="flex flex-row items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {items.map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && <div className="h-7 w-[1px] bg-line/60 shrink-0" aria-hidden="true" />}
            <div className="flex flex-1 flex-col items-center justify-center min-w-[70px] py-0.5 px-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} shrink-0`} />
                <span>{item.label}</span>
              </div>
              <div className={`font-num font-extrabold text-base sm:text-lg ${item.textColor} mt-0.5`}>
                {formatNumber(item.value)}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
