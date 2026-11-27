import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import { SelectAllCheckbox } from './SelectAllCheckbox.jsx';
import { SelectedChips } from './SelectedChips.jsx';
import { getEligibleEmployees } from '../../services/bonusService.js';
import { getMainTLs } from '../../services/teamService.js';

export const EmployeePicker = ({
  selectedEmployeeIds = [],
  onSelectionChange,
  onContinue,
  currentUser
}) => {
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [designation, setDesignation] = useState("All");
  const [experienceLevel, setExperienceLevel] = useState("All");
  const [employmentType, setEmploymentType] = useState("All");
  const [status, setStatus] = useState("All");
  const [includeIneligible, setIncludeIneligible] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Last clicked row index for Shift+Click range selection
  const lastClickedIndexRef = useRef(null);

  // Load all eligible employees matching filters
  const filteredEmployees = useMemo(() => {
    return getEligibleEmployees({
      search,
      department,
      designation,
      experienceLevel,
      employmentType,
      status,
      includeIneligible
    });
  }, [search, department, designation, experienceLevel, employmentType, status, includeIneligible]);

  // Total eligible roster for global counts
  const allRoster = useMemo(() => {
    return getEligibleEmployees({ includeIneligible: true });
  }, []);

  // Department list for dropdown
  const departmentsList = useMemo(() => {
    const set = new Set(allRoster.map(e => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [allRoster]);

  // Main TLs for Team quick selection
  const teamLeads = useMemo(() => {
    try {
      return getMainTLs();
    } catch (e) {
      return [];
    }
  }, []);

  // Pagination slice
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, page, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, department, designation, experienceLevel, employmentType, status, includeIneligible]);

  // Set-based selected IDs
  const selectedSet = useMemo(() => new Set(selectedEmployeeIds), [selectedEmployeeIds]);

  // Determine selectable employees in the current filtered set
  const selectableFiltered = useMemo(() => {
    return filteredEmployees.filter(e => e.selectable);
  }, [filteredEmployees]);

  // Checkbox states for Header
  const visibleSelectable = useMemo(() => {
    return paginatedEmployees.filter(e => e.selectable);
  }, [paginatedEmployees]);

  const numVisibleSelected = visibleSelectable.filter(e => selectedSet.has(e.id)).length;
  const isAllVisibleSelected = visibleSelectable.length > 0 && numVisibleSelected === visibleSelectable.length;
  const isIndeterminate = numVisibleSelected > 0 && !isAllVisibleSelected;

  // Selected employee objects for chips bar
  const selectedEmployeeObjects = useMemo(() => {
    return allRoster.filter(e => selectedSet.has(e.id));
  }, [allRoster, selectedSet]);

  // ---------------- Handlers ----------------

  const toggleEmployee = (empId, isSelectable = true) => {
    if (!isSelectable) return;
    const next = new Set(selectedEmployeeIds);
    if (next.has(empId)) {
      next.delete(empId);
    } else {
      next.add(empId);
    }
    onSelectionChange(Array.from(next));
  };

  const handleHeaderSelectAll = () => {
    const next = new Set(selectedEmployeeIds);
    if (isAllVisibleSelected) {
      // Unselect visible
      visibleSelectable.forEach(e => next.delete(e.id));
    } else {
      // Select all visible
      visibleSelectable.forEach(e => next.add(e.id));
    }
    onSelectionChange(Array.from(next));
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedEmployeeIds);
    selectableFiltered.forEach(e => next.add(e.id));
    onSelectionChange(Array.from(next));
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const handleInvertSelection = () => {
    const next = new Set(selectedEmployeeIds);
    selectableFiltered.forEach(e => {
      if (next.has(e.id)) {
        next.delete(e.id);
      } else {
        next.add(e.id);
      }
    });
    onSelectionChange(Array.from(next));
  };

  // Quick select by Department
  const handleSelectDepartment = (deptName) => {
    if (!deptName) return;
    const next = new Set(selectedEmployeeIds);
    allRoster
      .filter(e => e.department.toLowerCase() === deptName.toLowerCase() && (e.isEligible || includeIneligible))
      .forEach(e => next.add(e.id));
    onSelectionChange(Array.from(next));
  };

  // Quick select by Team (TL)
  const handleSelectTeam = (tlId) => {
    if (!tlId) return;
    const next = new Set(selectedEmployeeIds);
    allRoster
      .filter(e => (e.reportingToId === tlId || e.id === tlId) && (e.isEligible || includeIneligible))
      .forEach(e => next.add(e.id));
    onSelectionChange(Array.from(next));
  };

  // Shift + Click range selection
  const handleRowClick = (e, emp, index) => {
    if (!emp.selectable) return;

    if (e.shiftKey && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);
      const next = new Set(selectedEmployeeIds);

      for (let i = start; i <= end; i++) {
        const target = paginatedEmployees[i];
        if (target && target.selectable) {
          next.add(target.id);
        }
      }
      onSelectionChange(Array.from(next));
    } else {
      toggleEmployee(emp.id, emp.selectable);
      lastClickedIndexRef.current = index;
    }
  };

  // Keyboard navigation inside table
  const handleKeyDown = (e, emp) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleEmployee(emp.id, emp.selectable);
    }
  };

  // Global Ctrl+A handler when table is focused
  const handleTableKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      // Don't override if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      handleSelectAllFiltered();
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setDepartment("All");
    setDesignation("All");
    setExperienceLevel("All");
    setEmploymentType("All");
    setStatus("All");
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in min-h-[550px]" onKeyDown={handleTableKeyDown}>
      {/* Search and Filters Bar */}
      <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, employee ID, or email..."
              aria-label="Search employees"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Select Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Select Department */}
            <Select
              size="sm"
              value=""
              onChange={(e) => {
                if (e.target.value) handleSelectDepartment(e.target.value);
              }}
              placeholder="+ Select Department"
              className="w-44"
              ariaLabel="Quick select by department"
            >
              <option value="" disabled>+ Select Department</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>

            {/* Quick Select Team (TL) */}
            {teamLeads.length > 0 && (
              <Select
                size="sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) handleSelectTeam(e.target.value);
                }}
                placeholder="+ Select Team (TL)"
                className="w-48"
                ariaLabel="Quick select by Team Lead"
              >
                <option value="" disabled>+ Select Team (TL)</option>
                {teamLeads.map(tl => (
                  <option key={tl.id} value={tl.id}>
                    Team: {tl.name} ({tl.dept || "General"})
                  </option>
                ))}
              </Select>
            )}

            <button
              type="button"
              onClick={handleInvertSelection}
              className="px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icon name="refresh-cw" className="w-3.5 h-3.5 text-accent" />
              <span>Invert</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              disabled={selectedEmployeeIds.length === 0}
              className="px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-rose-400 text-xs font-semibold text-muted hover:text-bad disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Multi-facet Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-line/50 text-xs">
          <div>
            <span className="text-[10px] text-muted block mb-1 uppercase font-semibold">Department</span>
            <Select
              size="sm"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              ariaLabel="Filter by department"
            >
              <option value="All">All Departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>

          <div>
            <span className="text-[10px] text-muted block mb-1 uppercase font-semibold">Experience Level</span>
            <Select
              size="sm"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              ariaLabel="Filter by experience level"
            >
              <option value="All">All Tiers</option>
              <option value="Junior (0-2 yrs)">Junior (0-2 yrs)</option>
              <option value="Mid (3-5 yrs)">Mid (3-5 yrs)</option>
              <option value="Senior (6-9 yrs)">Senior (6-9 yrs)</option>
              <option value="Lead / Architect (10+ yrs)">Lead / Architect (10+ yrs)</option>
            </Select>
          </div>

          <div>
            <span className="text-[10px] text-muted block mb-1 uppercase font-semibold">Employment Type</span>
            <Select
              size="sm"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              ariaLabel="Filter by employment type"
            >
              <option value="All">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </Select>
          </div>

          <div>
            <span className="text-[10px] text-muted block mb-1 uppercase font-semibold">Status</span>
            <Select
              size="sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              ariaLabel="Filter by status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Notice Period">Notice Period</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>

          {/* Toggle Include Ineligible */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface2/60 border border-line hover:border-accent/40 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={includeIneligible}
                onChange={(e) => setIncludeIneligible(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-accent bg-surface border-line cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-ink">
                Include Ineligible
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Selected Employee Chips Bar */}
      <SelectedChips
        selectedEmployees={selectedEmployeeObjects}
        onRemove={(id) => toggleEmployee(id, true)}
        onClearAll={handleClearSelection}
      />

      {/* Cross-page Select All Notification Banner */}
      {isAllVisibleSelected && selectableFiltered.length > visibleSelectable.length && (
        <div className="p-3 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-between text-xs text-ink animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="w-4 h-4 text-accent" />
            <span>
              All <strong>{visibleSelectable.length}</strong> employees on this page are selected.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="px-3 py-1 rounded-lg bg-accent text-on-accent font-bold text-xs hover:opacity-95 transition cursor-pointer"
          >
            Select all {selectableFiltered.length} matching employees
          </button>
        </div>
      )}

      {/* Employee Picker Table */}
      <div className="glass-card !p-0 border border-line rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-[380px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur-md z-10 border-b border-line text-muted uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <SelectAllCheckbox
                    checked={isAllVisibleSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleHeaderSelectAll}
                    disabled={visibleSelectable.length === 0}
                    ariaLabel="Select all visible employees"
                  />
                </th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Experience</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="users" className="w-8 h-8 text-muted/50" />
                      <span className="text-sm font-semibold text-ink">No employees match the filters</span>
                      <span className="text-xs text-muted">Try adjusting your search query or reset the filters.</span>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:opacity-95 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, index) => {
                  const isSelected = selectedSet.has(emp.id);
                  const isSelectable = emp.selectable;
                  const initials = emp.name
                    ? emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : "EM";

                  return (
                    <tr
                      key={emp.id}
                      tabIndex={isSelectable ? 0 : -1}
                      onClick={(e) => handleRowClick(e, emp, index)}
                      onKeyDown={(e) => handleKeyDown(e, emp)}
                      aria-label={`${emp.name}, ${emp.designation}`}
                      className={`transition-colors select-none ${
                        !isSelectable
                          ? "opacity-50 bg-surface/20 cursor-not-allowed"
                          : isSelected
                          ? "bg-accent/10 hover:bg-accent/15 cursor-pointer"
                          : "hover:bg-surface2/40 cursor-pointer"
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isSelectable}
                          onChange={() => toggleEmployee(emp.id, isSelectable)}
                          aria-label={`Select ${emp.name}`}
                          className="w-4 h-4 rounded border-line bg-surface2 text-accent focus:ring-accent cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Employee Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-bold text-ink truncate flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              {emp.role === "MAIN_TL" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-bold uppercase">
                                  Main TL
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 font-num font-bold text-accent">
                        {emp.id}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-ink font-medium">
                        {emp.department}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-3 text-muted">
                        {emp.designation}
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-3 text-muted font-num">
                        {emp.totalExperienceYears} yrs
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          emp.status === "Active"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : emp.status === "On Leave"
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === "Active" ? "bg-emerald-400" : emp.status === "On Leave" ? "bg-amber-400" : "bg-rose-400"
                          }`} />
                          {emp.status}
                        </span>
                      </td>

                      {/* Eligibility */}
                      <td className="py-3 px-4 text-right">
                        {emp.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <Icon name="check-circle" className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Eligible</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 cursor-help"
                            title={emp.ineligibilityReason}
                          >
                            <Icon name="alert-circle" className="w-3.5 h-3.5 text-amber-400" />
                            <span>{emp.ineligibilityReason || "Ineligible"}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-surface2/40 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="text-muted">
            Showing <span className="font-num font-bold text-ink">{filteredEmployees.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{" "}
            <span className="font-num font-bold text-ink">{Math.min(page * pageSize, filteredEmployees.length)}</span> of{" "}
            <span className="font-num font-bold text-ink">{filteredEmployees.length}</span> matching employees
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-xl bg-surface2/60 border border-line text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-num font-bold text-ink">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-xl bg-surface2/60 border border-line text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Summary & Navigation Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#06141c]/95 border border-line/80 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-num font-extrabold text-sm">
              {selectedEmployeeIds.length}
            </div>
            <div>
              <div className="text-xs font-bold text-ink">
                {selectedEmployeeIds.length} of {allRoster.length} Employees Selected
              </div>
              <div className="text-[11px] text-muted">
                {selectedEmployeeIds.length === 0 ? "Pick at least 1 employee to proceed" : "Ready for Step 2: Bonus Details"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={selectedEmployeeIds.length === 0}
          className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-display font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span>Continue to Bonus Details</span>
          <Icon name="arrow-right" className="w-4 h-4 text-on-accent" />
        </button>
      </div>
    </div>
  );
};

export default EmployeePicker;
