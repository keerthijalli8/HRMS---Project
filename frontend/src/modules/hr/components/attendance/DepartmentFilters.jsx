import React from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';

export const DepartmentFilters = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  mode,
  onModeChange,
  shift,
  onShiftChange,
  onReset
}) => {
  const isFiltered =
    search.trim() !== "" ||
    status !== "All" ||
    mode !== "All" ||
    shift !== "All";

  return (
    <div className="glass-card !p-3 border border-line rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search employee by name or ID..."
            className="w-full pl-8 pr-7 py-1.5 bg-surface2/50 border border-line rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded cursor-pointer"
              aria-label="Clear employee search"
            >
              <Icon name="x" className="w-3 h-3 text-inherit" />
            </button>
          )}
        </div>

        {/* Right: Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted hidden sm:inline">Status:</span>
            <Select
              size="sm"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-32"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
              <option value="WFH">WFH</option>
              <option value="Late">Late</option>
              <option value="Early Out">Early Out</option>
              <option value="Not Checked In">Not Checked In</option>
            </Select>
          </div>

          {/* Mode filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted hidden sm:inline">Mode:</span>
            <Select
              size="sm"
              value={mode}
              onChange={(e) => onModeChange(e.target.value)}
              className="w-28"
            >
              <option value="All">All Modes</option>
              <option value="Office">Office</option>
              <option value="WFH">WFH</option>
            </Select>
          </div>

          {/* Shift filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted hidden sm:inline">Shift:</span>
            <Select
              size="sm"
              value={shift}
              onChange={(e) => onShiftChange(e.target.value)}
              className="w-36"
            >
              <option value="All">All Shifts</option>
              <option value="General">General (09:00 - 18:00)</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </Select>
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface2/60 border border-line hover:border-accent/40 text-xs font-semibold text-muted hover:text-accent transition cursor-pointer"
            >
              <Icon name="rotate-cw" className="w-3 h-3 text-inherit" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
