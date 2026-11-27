import React from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';

export const TeamFilters = ({
  selectedDate,
  onDateChange,
  onPrevDay,
  onNextDay,
  onToday,
  isToday,
  search,
  onSearchChange,
  dept,
  onDeptChange,
  allDepartments = [],
  location,
  onLocationChange,
  allLocations = [],
  status,
  onStatusChange,
  mode,
  onModeChange,
  onResetFilters,
  isScopedToManager = false
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Manager Scoping Banner */}
      {isScopedToManager && (
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs flex items-center gap-2">
          <Icon name="users" className="w-4 h-4 text-accent shrink-0" />
          <span>
            <strong>Manager View:</strong> Scoped to your reporting team by default.
          </span>
        </div>
      )}

      {/* Date Navigation Bar & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface2/40 p-3 rounded-2xl border border-line">
        {/* Date Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevDay}
            className="p-1.5 rounded-lg border border-line bg-surface2 text-ink hover:border-accent text-xs transition cursor-pointer"
            title="Previous Day"
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-surface2/80 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:border-accent outline-none font-num cursor-pointer"
          />
          <button
            type="button"
            onClick={onNextDay}
            disabled={isToday}
            className="p-1.5 rounded-lg border border-line bg-surface2 text-ink hover:border-accent text-xs transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Day"
          >
            →
          </button>
          <button
            type="button"
            onClick={onToday}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              isToday
                ? "bg-accent text-on-accent border-accent"
                : "border-line bg-surface2 text-muted hover:text-ink hover:border-accent"
            }`}
          >
            Today
          </button>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name or ID…"
              className="bg-surface2/80 border border-line rounded-xl pl-8 pr-3 py-1.5 text-ink text-xs focus:border-accent outline-none w-36 sm:w-44"
            />
          </div>

          {/* Department Dropdown */}
          <Select
            size="sm"
            value={dept}
            onChange={(e) => onDeptChange(e.target.value)}
            className="w-32"
            ariaLabel="Filter by department"
          >
            {allDepartments.map(d => (
              <option key={d} value={d}>{d === "All" ? "All Depts" : d}</option>
            ))}
          </Select>

          {/* Location Dropdown */}
          <Select
            size="sm"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-32"
            ariaLabel="Filter by location"
          >
            {allLocations.map(l => (
              <option key={l} value={l}>{l === "All" ? "All Locations" : l}</option>
            ))}
          </Select>

          {/* Status Dropdown */}
          <Select
            size="sm"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-32"
            ariaLabel="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Working">Working Now</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late Arrivals</option>
            <option value="Early Out">Early Out</option>
            <option value="WFH">WFH</option>
            <option value="Not Checked In">Not Checked In</option>
          </Select>

          {/* Mode Dropdown */}
          <Select
            size="sm"
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            className="w-28"
            ariaLabel="Filter by mode"
          >
            <option value="All">All Modes</option>
            <option value="Office">Office (WFO)</option>
            <option value="WFH">WFH (Remote)</option>
          </Select>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2.5 py-1.5 rounded-xl border border-line hover:border-accent text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
            title="Reset all filters"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
