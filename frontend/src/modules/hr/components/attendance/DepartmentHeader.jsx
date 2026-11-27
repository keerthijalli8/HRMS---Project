import React, { useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { formatDisplayDate } from '../../services/attendanceLog.js';
import { getKolkataDateKey } from '../../services/attendanceService.js';

export const DepartmentHeader = ({
  department,
  selectedDate,
  onDateChange,
  onBack,
  onNavigateAttendance
}) => {
  const todayKey = useMemo(() => getKolkataDateKey(), []);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1, 12, 0, 0);
    onDateChange(getKolkataDateKey(prev));
  };

  const handleNextDay = () => {
    if (selectedDate >= todayKey) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1, 12, 0, 0);
    onDateChange(getKolkataDateKey(next));
  };

  const headInitials = department?.head?.name
    ? department.head.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : "DH";

  return (
    <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
      {/* Breadcrumbs Row */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
        <button
          type="button"
          onClick={() => onNavigateAttendance?.("my")}
          className="hover:text-ink transition cursor-pointer flex items-center gap-1"
        >
          <Icon name="clock" className="w-3.5 h-3.5 text-inherit" />
          <span>Attendance</span>
        </button>
        <span className="text-muted/60" aria-hidden="true">&gt;</span>
        <button
          type="button"
          onClick={onBack}
          className="hover:text-ink transition cursor-pointer flex items-center gap-1 font-medium"
        >
          <span>Team Attendance</span>
        </button>
        <span className="text-muted/60" aria-hidden="true">&gt;</span>
        <span className="text-ink font-bold text-accent" aria-current="page">
          {department?.name}
        </span>
      </nav>

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-line/50">
        {/* Left: Back Button + Department Name & Head */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Departments"
            title="Back to Departments overview"
            className="w-9 h-9 rounded-xl bg-surface2/70 border border-line hover:border-accent/50 text-ink hover:text-accent flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
          >
            <Icon name="arrow-left" className="w-4 h-4 text-inherit" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <Icon name={department?.icon || "briefcase"} className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-lg sm:text-xl text-ink leading-tight">
                  {department?.name}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface2/60 border border-line text-muted">
                  Department
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                <div className="w-4 h-4 rounded-full bg-accent2/20 text-accent2 flex items-center justify-center text-[9px] font-bold">
                  {headInitials}
                </div>
                <span>
                  Head: <strong className="text-ink font-semibold">{department?.head?.name || "Unassigned"}</strong>
                  {department?.head?.role ? ` (${department.head.role})` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Date Stepper Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex items-center bg-surface2/60 border border-line rounded-xl p-0.5">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Previous day"
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition cursor-pointer"
            >
              <Icon name="chevron-left" className="w-4 h-4 text-inherit" />
            </button>
            <div className="px-3 py-1 text-xs font-bold text-ink flex items-center gap-1.5 min-w-[130px] justify-center">
              <Icon name="calendar" className="w-3.5 h-3.5 text-accent" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDate >= todayKey}
              aria-label="Next day"
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="chevron-right" className="w-4 h-4 text-inherit" />
            </button>
          </div>

          {selectedDate !== todayKey && (
            <button
              type="button"
              onClick={() => onDateChange(todayKey)}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition cursor-pointer"
            >
              Today
            </button>
          )}

          <input
            type="date"
            max={todayKey}
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="px-2 py-1 bg-surface2/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            aria-label="Select date"
          />
        </div>
      </div>
    </div>
  );
};
