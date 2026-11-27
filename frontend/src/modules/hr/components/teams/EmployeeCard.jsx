import React from 'react';
import { Icon } from '../Icon.jsx';
import { ExperienceBadge } from './ExperienceBadge.jsx';
import { renderValue } from '../../utils/renderValue.js';

export const EmployeeCard = ({
  employee,
  onViewProfile,
  onViewActivity,
  onEdit = null,
  onDelete = null,
  canEdit = false
}) => {
  const {
    id,
    name,
    designation,
    dept,
    status = "Active",
    email,
    phone,
    totalExperienceYears = 0,
    previousCompanies = [],
    mgr = "Main TL",
    role = "EMPLOYEE"
  } = employee;

  const displayName = renderValue(name, "Employee");
  const displayDesignation = renderValue(designation?.title || designation?.name || designation, "Staff Member");
  const displayDept = renderValue(dept?.name || dept, "Department");
  const displayMgr = renderValue(mgr?.name || mgr, "Main TL");
  const displayStatus = renderValue(status, "Active");

  const initials = typeof name === "string" && name.trim()
    ? name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : "EM";

  const isLeader = role === "MAIN_TL" || role === "TL";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View profile of ${displayName}, ${displayDesignation}`}
      onClick={onViewProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewProfile?.();
        }
      }}
      className="glass-card !p-4 border border-line rounded-2xl hover:border-accent/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent select-none flex flex-col justify-between"
    >
      <div>
        {/* Top: Avatar + Status + Experience Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {initials}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                  displayStatus === "Active"
                    ? "bg-emerald-400"
                    : displayStatus === "On Leave"
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}
                title={`Status: ${displayStatus}`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-sm text-ink truncate group-hover:text-accent transition-colors">
                  {displayName}
                </h4>
                {isLeader && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-extrabold uppercase shrink-0">
                    {role === "MAIN_TL" ? "Main TL" : "TL"}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted truncate">
                {displayDesignation}
              </div>
            </div>
          </div>

          <ExperienceBadge
            totalYears={totalExperienceYears}
            previousCompanies={previousCompanies}
            className="shrink-0"
          />
        </div>

        {/* Metadata Details */}
        <div className="my-3 p-2.5 rounded-xl bg-surface2/30 border border-line/60 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px]">Employee ID</span>
            <span className="font-num font-bold text-ink">{renderValue(id)}</span>
          </div>

          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px]">Department</span>
            <span className="font-semibold text-ink">{displayDept}</span>
          </div>

          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px]">Reporting TL</span>
            <span className="font-medium text-accent truncate max-w-[130px]">{displayMgr}</span>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="flex flex-col gap-1 text-[11px] text-muted mb-2">
          {email && (
            <div className="flex items-center gap-1.5 truncate">
              <Icon name="mail" className="w-3 h-3 text-muted shrink-0" />
              <span className="truncate">{renderValue(email)}</span>
            </div>
          )}
          {phone && phone !== "Confidential (Private)" && (
            <div className="flex items-center gap-1.5 truncate font-num">
              <Icon name="phone" className="w-3 h-3 text-muted shrink-0" />
              <span>{renderValue(phone)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: View Profile + View Activity + Optional Edit Button */}
      <div className="flex items-center justify-between pt-2 border-t border-line/60 mt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.();
            }}
            className="text-xs font-bold text-accent group-hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Profile</span>
            <Icon name="arrow-right" className="w-3 h-3 text-accent group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewActivity) {
                onViewActivity(employee.id);
              } else if (onViewProfile) {
                onViewProfile("activity");
              }
            }}
            className="text-[11px] font-semibold text-muted hover:text-accent transition cursor-pointer"
            title="View in-app activity timeline"
          >
            View Activity
          </button>
        </div>

        <div className="flex items-center gap-1">
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(employee);
              }}
              title="Edit employee details"
              className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
            >
              <Icon name="edit" className="w-3.5 h-3.5 text-inherit" />
            </button>
          )}

          {canEdit && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(employee);
              }}
              title="Delete employee record"
              className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-rose-400 transition cursor-pointer"
            >
              <Icon name="trash-2" className="w-3.5 h-3.5 text-inherit" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
