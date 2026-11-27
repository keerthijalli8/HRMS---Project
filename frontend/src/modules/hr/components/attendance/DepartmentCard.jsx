import React from 'react';
import { Icon } from '../Icon.jsx';
import { formatNumber } from '../../utils/format.js';

export const DepartmentCard = ({
  department,
  onClick
}) => {
  const {
    name,
    icon = "briefcase",
    head,
    totalEmployees = 0,
    attendanceRate = 100,
    status = "Good"
  } = department;

  const hasEmployees = totalEmployees > 0;
  const roundedRate = Math.round(Math.min(100, Math.max(0, attendanceRate)));

  const headInitials = head?.name
    ? head.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : "—";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name} department attendance. Attendance rate: ${roundedRate}%, Status: ${status}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="glass-card !p-4 border border-line/80 rounded-2xl bg-surface/60 hover:bg-surface2/50 hover:border-accent/40 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent select-none flex flex-col justify-between gap-4"
    >
      {/* Top Row: Icon + Department Name + Rate */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface2 border border-line/80 flex items-center justify-center shrink-0 text-muted group-hover:text-accent group-hover:border-accent/30 transition-colors">
            <Icon name={icon} className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <h3 className="font-display font-bold text-sm sm:text-[15px] text-ink truncate group-hover:text-accent transition-colors">
              {name}
            </h3>
            <div className="text-[11px] text-muted font-medium mt-0.5">
              {formatNumber(totalEmployees)} {totalEmployees === 1 ? 'Member' : 'Members'}
            </div>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-num font-bold shrink-0 ${
            !hasEmployees
              ? "bg-surface2/50 border-line/60 text-muted"
              : roundedRate >= 85
              ? "bg-surface2 border-line text-ink"
              : "bg-surface2 border-line text-muted"
          }`}
        >
          {hasEmployees ? `${roundedRate}%` : "N/A"}
        </span>
      </div>

      {/* Department Lead */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-surface2 border border-line text-ink flex items-center justify-center text-[11px] font-bold shrink-0">
            {headInitials}
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[10px] text-muted font-medium leading-none">
              Department Lead
            </div>
            <div className="text-xs font-semibold text-ink truncate mt-0.5">
              {head?.name || "Unassigned"}
            </div>
          </div>
        </div>
        {hasEmployees && (
          <span className="text-[10.5px] font-medium text-muted shrink-0">
            {status}
          </span>
        )}
      </div>

      {/* Footer Link */}
      <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[11.5px] font-semibold text-muted group-hover:text-ink transition-colors">
        <span>View Attendance Log</span>
        <Icon name="arrow-right" className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};