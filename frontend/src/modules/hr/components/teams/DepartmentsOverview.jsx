import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { getDepartments, isHRorAdmin } from '../../services/teamService.js';
import { formatNumber } from '../../utils/format.js';

const CleanDepartmentCard = ({ department, onClick }) => {
  const {
    name,
    icon = "briefcase",
    head,
    totalEmployees = 0
  } = department;

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
      aria-label={`View ${name} department employees`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="glass-card !p-5 border border-line/70 rounded-2xl bg-surface/50 hover:bg-surface2/40 hover:border-accent/40 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent select-none flex flex-col justify-between gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface2/80 flex items-center justify-center shrink-0 text-muted group-hover:text-accent transition-colors">
            <Icon name={icon} className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <h3 className="font-display font-bold text-[15px] text-ink truncate group-hover:text-accent transition-colors">
              {name}
            </h3>
            <p className="text-[11.5px] text-muted font-medium mt-0.5">
              {formatNumber(totalEmployees)} {totalEmployees === 1 ? 'Member' : 'Members'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <div className="w-7 h-7 rounded-full bg-surface2 text-ink/90 flex items-center justify-center text-[11px] font-bold shrink-0">
          {headInitials}
        </div>
        <div className="min-w-0 text-left flex items-baseline gap-1.5 truncate">
          <span className="text-[11px] text-muted shrink-0">Head:</span>
          <span className="text-xs font-semibold text-ink truncate">
            {head?.name || "Unassigned"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 !border-t-0 text-xs font-semibold text-muted group-hover:text-ink transition-colors">
        <span>View Employees</span>
        <Icon
          name="arrow-right"
          className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
        />
      </div>
    </div>
  );
};

export const DepartmentsOverview = ({
  viewFilter = "departments", // "departments" | "employees" | "tls"
  onChangeViewFilter,
  allEmployees = [],
  teamLeads = [],
  onSelectDepartment,
  onSelectEmployee,
  onSelectTL,
  onAddEmployee,
  onAddDepartment,
  currentUser,
  onTriggerToast
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  const { departments = [] } = useMemo(() => {
    return getDepartments();
  }, []);

  const canManage = useMemo(() => isHRorAdmin(currentUser), [currentUser]);

  // 1. Filtered Departments
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const q = searchTerm.trim().toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.head?.name || "").toLowerCase().includes(q) ||
      (d.employees || []).some(e =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.id || "").toLowerCase().includes(q)
      )
    );
  }, [departments, searchTerm]);

  // 2. Filtered All Employees
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return allEmployees;
    const q = searchTerm.trim().toLowerCase();
    return allEmployees.filter(e =>
      (e.name || "").toLowerCase().includes(q) ||
      (e.id || "").toLowerCase().includes(q) ||
      (e.department || e.dept || "").toLowerCase().includes(q) ||
      (e.role || e.designation || "").toLowerCase().includes(q)
    );
  }, [allEmployees, searchTerm]);

  // 3. Filtered Team Leads
  const filteredTLs = useMemo(() => {
    if (!searchTerm.trim()) return teamLeads;
    const q = searchTerm.trim().toLowerCase();
    return teamLeads.filter(tl =>
      (tl.name || "").toLowerCase().includes(q) ||
      (tl.id || "").toLowerCase().includes(q) ||
      (tl.department || tl.dept || "").toLowerCase().includes(q)
    );
  }, [teamLeads, searchTerm]);

  // Export CSV based on active view
  const handleExport = () => {
    let headers = [];
    let rows = [];
    let filename = "directory.csv";

    if (viewFilter === "employees") {
      headers = ["Employee ID", "Name", "Department", "Role", "Experience (Yrs)", "Status"];
      rows = filteredEmployees.map(e => [
        `"${e.id}"`,
        `"${e.name}"`,
        `"${e.department || e.dept || ''}"`,
        `"${e.role || e.designation || ''}"`,
        e.experienceYears ?? e.experience ?? 0,
        `"${e.status || 'Active'}"`
      ]);
      filename = `all-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (viewFilter === "tls") {
      headers = ["TL ID", "Name", "Department", "Role", "Direct Reports"];
      rows = filteredTLs.map(tl => [
        `"${tl.id}"`,
        `"${tl.name}"`,
        `"${tl.department || tl.dept || ''}"`,
        `"${tl.role || tl.designation || 'Team Lead'}"`,
        (tl.subordinates || []).length
      ]);
      filename = `team-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = ["Department", "Head of Department", "Total Employees"];
      rows = filteredDepartments.map(d => [
        `"${d.name}"`,
        `"${d.head?.name || 'Unassigned'}"`,
        d.totalEmployees
      ]);
      filename = `departments-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onTriggerToast?.(`Exported ${rows.length} records successfully.`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ================= TOP SEARCH & ACTION BAR ================= */}
      <div className="glass-card !p-3.5 border border-line/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative min-w-[220px] sm:min-w-[280px] flex-1">
          <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              viewFilter === "employees"
                ? "Search employee by name, ID, role, or department..."
                : viewFilter === "tls"
                ? "Search team lead by name or department..."
                : "Search department, lead, or employee..."
            }
            className="w-full pl-8 pr-7 py-1.5 bg-surface2/50 border border-line rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <Icon name="x" className="w-3 h-3 text-inherit" />
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Section Label + Quick Back to Departments */}
          {viewFilter !== "departments" && onChangeViewFilter && (
            <button
              type="button"
              onClick={() => onChangeViewFilter("departments")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface2/60 border border-line hover:border-accent/40 text-[11px] font-semibold text-muted hover:text-ink transition cursor-pointer"
            >
              <Icon name="arrow-left" className="w-3 h-3" />
              <span>All Departments</span>
            </button>
          )}

          <span className="text-[11px] font-semibold text-muted px-2">
            {viewFilter === "employees"
              ? `${filteredEmployees.length} Total Employees`
              : viewFilter === "tls"
              ? `${filteredTLs.length} Team Leads`
              : `${filteredDepartments.length} Departments`}
          </span>

          {/* Grid / List Toggle (only for Departments view) */}
          {viewFilter === "departments" && (
            <div className="inline-flex items-center p-0.5 bg-surface2/50 border border-line rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "grid" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name="grid" className="w-3.5 h-3.5 text-inherit" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "list" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name="list" className="w-3.5 h-3.5 text-inherit" />
              </button>
            </div>
          )}

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2/60 border border-line hover:border-accent/40 text-xs font-semibold text-ink transition cursor-pointer"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-muted" />
            <span>Export</span>
          </button>

          {canManage && onAddDepartment && (
            <button
              type="button"
              onClick={onAddDepartment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2/80 border border-line hover:border-accent text-xs font-semibold text-ink transition cursor-pointer"
            >
              <Icon name="plus" className="w-3.5 h-3.5 text-accent" />
              <span>Add Department</span>
            </button>
          )}

          {canManage && onAddEmployee && (
            <button
              type="button"
              onClick={onAddEmployee}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-sm"
            >
              <Icon name="user-plus" className="w-3.5 h-3.5 text-on-accent" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= VIEW A: TOTAL EMPLOYEES DIRECTORY ================= */}
      {viewFilter === "employees" && (
        <div className="glass-card !p-0 border border-line/80 rounded-2xl overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted">
              No employees found matching "{searchTerm}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface2/50 text-muted uppercase tracking-wider text-[10.5px] border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role / Designation</th>
                    <th className="py-3 px-4 text-center">Experience</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {filteredEmployees.map(emp => {
                    const initials = (emp.name || "EM")
                      .split(" ")
                      .map(n => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const exp = emp.experienceYears ?? emp.experience ?? 0;
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => onSelectEmployee?.(emp.id)}
                        className="hover:bg-surface2/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface2 text-ink flex items-center justify-center text-[11px] font-bold shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-display font-bold text-ink group-hover:text-accent transition-colors">
                                {emp.name}
                              </div>
                              <div className="text-[10.5px] text-muted font-num">{emp.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-ink font-medium">
                          {emp.department || emp.dept || "—"}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {emp.role || emp.designation || "Employee"}
                        </td>
                        <td className="py-3 px-4 text-center font-num font-semibold text-ink">
                          {exp} {Number(exp) === 1 ? "yr" : "yrs"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-surface2 border border-line/70 text-[10.5px] font-medium text-ink">
                            {emp.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-muted group-hover:text-accent font-semibold text-xs transition-colors">
                            <span>View</span>
                            <Icon name="arrow-right" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW B: TEAM LEADS DIRECTORY ================= */}
      {viewFilter === "tls" && (
        <div className="glass-card !p-0 border border-line/80 rounded-2xl overflow-hidden">
          {filteredTLs.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted">
              No team leads found matching "{searchTerm}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface2/50 text-muted uppercase tracking-wider text-[10.5px] border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Team Lead</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4 text-center">Direct Reports</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {filteredTLs.map(tl => {
                    const initials = (tl.name || "TL")
                      .split(" ")
                      .map(n => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const teamCount = (tl.subordinates || []).length;
                    return (
                      <tr
                        key={tl.id}
                        onClick={() => onSelectTL ? onSelectTL(tl.id) : onSelectEmployee?.(tl.id)}
                        className="hover:bg-surface2/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface2 text-ink flex items-center justify-center text-[11px] font-bold shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-display font-bold text-ink group-hover:text-accent transition-colors">
                                {tl.name}
                              </div>
                              <div className="text-[10.5px] text-muted font-num">{tl.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-ink font-medium">
                          {tl.department || tl.dept || "—"}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {tl.role || tl.designation || "Team Lead"}
                        </td>
                        <td className="py-3 px-4 text-center font-num font-bold text-ink">
                          {teamCount} {teamCount === 1 ? "Member" : "Members"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-muted group-hover:text-accent font-semibold text-xs transition-colors">
                            <span>View Team</span>
                            <Icon name="arrow-right" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW C: DEPARTMENTS GRID / LIST ================= */}
      {viewFilter === "departments" && (
        filteredDepartments.length === 0 ? (
          <div className="glass-card !p-12 border border-line/80 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface2/60 border border-line flex items-center justify-center text-muted">
              <Icon name="search" className="w-5 h-5 text-muted" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-ink">No departments found</h4>
              <p className="text-xs text-muted mt-1 max-w-sm">
                No department matching "{searchTerm}" was found.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="px-3.5 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map(dept => (
              <CleanDepartmentCard
                key={dept.id}
                department={dept}
                onClick={() => onSelectDepartment(dept.id)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card !p-0 border border-line/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface2/50 text-muted uppercase tracking-wider text-[10.5px] border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Department Head</th>
                    <th className="py-3 px-4 text-center">Members</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {filteredDepartments.map(dept => (
                    <tr
                      key={dept.id}
                      onClick={() => onSelectDepartment(dept.id)}
                      className="hover:bg-surface2/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-display font-bold text-ink flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface2/80 flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                          <Icon name={dept.icon || "briefcase"} className="w-3.5 h-3.5" />
                        </div>
                        <span className="group-hover:text-accent transition-colors">{dept.name}</span>
                      </td>
                      <td className="py-3 px-4 text-ink font-medium">{dept.head?.name || "Unassigned"}</td>
                      <td className="py-3 px-4 text-center font-num font-bold text-ink">
                        {formatNumber(dept.totalEmployees)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-muted group-hover:text-accent font-semibold text-xs transition-colors">
                          <span>View Employees</span>
                          <Icon name="arrow-right" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default DepartmentsOverview;