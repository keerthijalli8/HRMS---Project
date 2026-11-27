import React from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import { EXPERIENCE_BANDS } from '../../config/teams.js';

export const EmployeeFilters = ({
  filters,
  onChange,
  search = "",
  onSearchChange,
  designation = "All",
  onDesignationChange,
  experienceBand = "All",
  onExperienceBandChange,
  employmentType = "All",
  onEmploymentTypeChange,
  workMode = "All",
  onWorkModeChange,
  status = "All",
  onStatusChange,
  sort = "name_asc",
  onSortChange,
  onReset,
  designationList = []
}) => {
  // Support both unified filters object and individual props
  const curSearch = filters ? (filters.search || "") : (search || "");
  const curDesignation = filters ? (filters.designation || "All") : (designation || "All");
  const curExpBand = filters ? (filters.experienceBand || filters.band || "All") : (experienceBand || "All");
  const curEmpType = filters ? (filters.employmentType || "All") : (employmentType || "All");
  const curWorkMode = filters ? (filters.workMode || "All") : (workMode || "All");
  const curStatus = filters ? (filters.status || "All") : (status || "All");
  const curSort = filters ? (filters.sort || "name_asc") : (sort || "name_asc");

  const handleSearch = (val) => {
    if (onChange && filters) onChange({ ...filters, search: val });
    else onSearchChange?.(val);
  };

  const handleDesignation = (val) => {
    if (onChange && filters) onChange({ ...filters, designation: val });
    else onDesignationChange?.(val);
  };

  const handleExpBand = (val) => {
    if (onChange && filters) onChange({ ...filters, experienceBand: val, band: val });
    else onExperienceBandChange?.(val);
  };

  const handleEmpType = (val) => {
    if (onChange && filters) onChange({ ...filters, employmentType: val });
    else onEmploymentTypeChange?.(val);
  };

  const handleWorkMode = (val) => {
    if (onChange && filters) onChange({ ...filters, workMode: val });
    else onWorkModeChange?.(val);
  };

  const handleStatus = (val) => {
    if (onChange && filters) onChange({ ...filters, status: val });
    else onStatusChange?.(val);
  };

  const handleSort = (val) => {
    if (onChange && filters) onChange({ ...filters, sort: val });
    else onSortChange?.(val);
  };

  const handleReset = () => {
    if (onChange && filters) {
      onChange({
        search: "",
        designation: "All",
        experienceBand: "All",
        band: "all",
        employmentType: "All",
        workMode: "All",
        status: "All",
        sort: "name_asc"
      });
    } else {
      onReset?.();
    }
  };

  const isFiltered =
    (curSearch || "").trim() !== "" ||
    curDesignation !== "All" ||
    curExpBand !== "All" && curExpBand !== "all" ||
    curEmpType !== "All" ||
    curWorkMode !== "All" && curWorkMode !== "all" ||
    curStatus !== "All" && curStatus !== "all";

  const bandsList = Array.isArray(EXPERIENCE_BANDS) ? EXPERIENCE_BANDS : Object.values(EXPERIENCE_BANDS || {});

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search Input Row */}
      <div className="relative w-full">
        <input
          type="text"
          value={curSearch}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search employees by name, EMP ID, email, skills..."
          className="w-full pl-9 pr-9 py-2 rounded-xl bg-surface2/60 border border-line focus:border-accent text-ink placeholder:text-muted/60 text-xs sm:text-sm transition outline-none"
        />
        <Icon
          name="search"
          className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        {curSearch && (
          <button
            type="button"
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            title="Clear search"
          >
            <Icon name="x" className="w-3.5 h-3.5 text-inherit" />
          </button>
        )}
      </div>

      {/* Filters Pills Row */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          {/* Designation */}
          {designationList.length > 0 && (
            <Select
              size="sm"
              value={curDesignation}
              onChange={(e) => handleDesignation(e.target.value)}
              className="w-36"
              ariaLabel="Filter by designation"
            >
              <option value="All">All Designations</option>
              {designationList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          )}

          {/* Experience Band */}
          <Select
            size="sm"
            value={curExpBand}
            onChange={(e) => handleExpBand(e.target.value)}
            className="w-36"
            ariaLabel="Filter by experience band"
          >
            <option value="All">All Experience</option>
            {bandsList.map((b) => (
              <option key={b.tag} value={b.tag}>
                {b.tag} ({b.minYears}{b.maxYears ? `-${b.maxYears}` : "+"} yrs)
              </option>
            ))}
          </Select>

          {/* Work Mode */}
          <Select
            size="sm"
            value={curWorkMode}
            onChange={(e) => handleWorkMode(e.target.value)}
            className="w-28"
            ariaLabel="Filter by work mode"
          >
            <option value="All">All Modes</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
          </Select>

          {/* Status */}
          <Select
            size="sm"
            value={curStatus}
            onChange={(e) => handleStatus(e.target.value)}
            className="w-32"
            ariaLabel="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </Select>

          {/* Sort */}
          <Select
            size="sm"
            value={curSort}
            onChange={(e) => handleSort(e.target.value)}
            className="w-40"
            ariaLabel="Sort employees"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="experience_desc">Experience (High to Low)</option>
            <option value="experience_asc">Experience (Low to High)</option>
            <option value="joined_desc">Newest Joined</option>
          </Select>

          {/* Reset button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
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

export default EmployeeFilters;
