import React from 'react';
import { Icon } from '../Icon.jsx';
import { formatNumber } from '../../utils/format.js';

export const DepartmentCard = ({ department, onClick }) => {
  const {
    id,
    name,
    icon = "briefcase",
    head,
    totalEmployees = 0,
    avatarStack = [],
    extraCount = 0,
    breakdown = { fresher: 0, junior: 0, mid: 0, senior: 0 }
  } = department;

  const total = Math.max(1, totalEmployees);
  const fresherPct = Math.round((breakdown.fresher / total) * 100);
  const juniorPct = Math.round((breakdown.junior / total) * 100);
  const midPct = Math.round((breakdown.mid / total) * 100);
  const seniorPct = Math.round((breakdown.senior / total) * 100);

  const headInitials = head?.name
    ? head.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : "DH";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${name} department with ${totalEmployees} employees`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="glass-card !p-4 border border-line rounded-2xl hover:border-accent/40 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent select-none"
    >
      {/* Top Header: Icon + Name + Headcount */}
      <div className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-row items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 text-accent group-hover:bg-accent/25 transition-colors">
            <Icon name={icon} className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base text-ink truncate group-hover:text-accent transition-colors">
              {name}
            </h3>
            <span className="text-xs text-muted font-num font-medium">
              {formatNumber(totalEmployees)} {totalEmployees === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        {/* Avatar Stack */}
        <div className="flex items-center -space-x-1.5 shrink-0 pl-2">
          {avatarStack.map((av, idx) => {
            const inits = av.name
              ? av.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              : "EM";
            return (
              <div
                key={av.id || idx}
                title={av.name}
                className="w-7 h-7 rounded-full bg-surface border-2 border-surface2 text-accent flex items-center justify-center text-[10px] font-extrabold shadow-sm"
              >
                {inits}
              </div>
            );
          })}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-accent/20 border-2 border-surface2 text-accent flex items-center justify-center text-[10px] font-extrabold shadow-sm">
              +{extraCount}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Department Head Badge */}
      <div className="my-3 p-2.5 rounded-xl bg-surface2/30 border border-line/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-accent2/20 border border-accent2/30 text-accent2 flex items-center justify-center text-[10px] font-bold shrink-0">
            {headInitials}
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
              Department Head
            </div>
            <div className="text-xs font-bold text-ink truncate">
              {head?.name || "Unassigned"}
            </div>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface2/60 border border-line text-muted font-medium shrink-0">
          Head
        </span>
      </div>

      {/* Experience Breakdown Progress Bar */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Experience Breakdown</span>
          <span className="font-num font-semibold text-ink">
            {breakdown.fresher} Fresh &bull; {breakdown.junior + breakdown.mid + breakdown.senior} Exp
          </span>
        </div>

        {/* Multi-segment Bar */}
        <div className="h-2 w-full rounded-full bg-surface2/80 overflow-hidden flex" title={`Fresher: ${breakdown.fresher}, 1-3y: ${breakdown.junior}, 3-5y: ${breakdown.mid}, 5+y: ${breakdown.senior}`}>
          {fresherPct > 0 && (
            <div style={{ width: `${fresherPct}%` }} className="bg-emerald-400 h-full" title={`Fresher: ${breakdown.fresher}`} />
          )}
          {juniorPct > 0 && (
            <div style={{ width: `${juniorPct}%` }} className="bg-blue-400 h-full" title={`1-3 yrs: ${breakdown.junior}`} />
          )}
          {midPct > 0 && (
            <div style={{ width: `${midPct}%` }} className="bg-cyan-400 h-full" title={`3-5 yrs: ${breakdown.mid}`} />
          )}
          {seniorPct > 0 && (
            <div style={{ width: `${seniorPct}%` }} className="bg-amber-400 h-full" title={`5+ yrs: ${breakdown.senior}`} />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted pt-0.5 font-num">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            0-1y ({breakdown.fresher})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            1-3y ({breakdown.junior})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            3-5y ({breakdown.mid})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            5+y ({breakdown.senior})
          </span>
        </div>
      </div>

      {/* Footer: View Employees -> */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60 text-xs font-semibold text-muted group-hover:text-accent transition-colors">
        <span>View Employees</span>
        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          <Icon name="arrow-right" className="w-3.5 h-3.5 text-inherit" />
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;
