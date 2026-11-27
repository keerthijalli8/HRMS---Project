import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { TeamBreadcrumbs } from './TeamBreadcrumbs.jsx';
import { EmployeeCard } from './EmployeeCard.jsx';
import { EmployeeTable } from './EmployeeTable.jsx';
import { EmployeeFilters } from './EmployeeFilters.jsx';
import { getDepartmentEmployees, isHRorAdmin, deleteEmployee } from '../../services/teamService.js';
import { formatNumber } from '../../utils/format.js';
import { ConfirmDeleteEmployeeModal } from './ConfirmDeleteEmployeeModal.jsx';

export const DepartmentEmployeesPage = ({
  departmentId,
  onBack,
  onNavigate,
  onViewEmployee,
  onSelectEmployee,
  onEditEmployee,
  currentUser,
  onTriggerToast
}) => {
  const handleProfileNav = onViewEmployee || onSelectEmployee || ((id) => onNavigate?.(`/teams/employees/${id}`));
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState("All");
  const [experienceBand, setExperienceBand] = useState("All");
  const [employmentType, setEmploymentType] = useState("All");
  const [workMode, setWorkMode] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    const res = deleteEmployee(employeeToDelete.id, currentUser);
    setIsDeleting(false);
    setEmployeeToDelete(null);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast(res.message);
    } else {
      if (onTriggerToast) onTriggerToast(res.error || "Failed to delete employee.");
    }
  };

  const data = useMemo(() => {
    return getDepartmentEmployees(
      departmentId,
      { search, designation, experienceBand, employmentType, workMode, status, sort },
      page,
      12
    );
  }, [departmentId, search, designation, experienceBand, employmentType, workMode, status, sort, page]);

  const canEdit = useMemo(() => isHRorAdmin(currentUser), [currentUser]);

  if (data.notFound) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Icon name="alert-triangle" className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink">
            Department Not Found
          </h2>
          <p className="text-xs text-muted mt-1.5 max-w-md">
            The department with identifier "{departmentId}" does not exist.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center gap-2 hover:opacity-95 transition cursor-pointer shadow-lg"
        >
          <Icon name="arrow-left" className="w-4 h-4 text-on-accent" />
          <span>Back to Departments</span>
        </button>
      </div>
    );
  }

  const { department, stats, employees, totalFiltered, page: curPage, totalPages } = data;

  const handleResetFilters = () => {
    setSearch("");
    setDesignation("All");
    setExperienceBand("All");
    setEmploymentType("All");
    setWorkMode("All");
    setStatus("All");
    setSort("name-asc");
    setPage(1);
  };

  const handleSelectEmployee = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(e => e.id));
    }
  };

  // Bulk Actions
  const handleBulkExport = () => {
    const selected = employees.filter(e => selectedIds.includes(e.id));
    const target = selected.length > 0 ? selected : employees;
    const headers = ["Employee ID", "Name", "Designation", "Department", "Experience", "Joining Date", "Mode", "Status"];
    const rows = target.map(e => [
      `"${e.id}"`, `"${e.name}"`, `"${e.designation}"`, `"${e.dept}"`,
      e.totalExperienceYears, `"${e.joiningDate}"`, `"${e.workMode}"`, `"${e.status}"`
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `${department.name}-employees.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onTriggerToast?.(`Exported ${target.length} employees.`);
  };

  const handleBulkChangeDept = () => {
    onTriggerToast?.(`Change Department modal opened for ${selectedIds.length} employees.`);
  };

  const handleBulkSendMessage = () => {
    onTriggerToast?.(`Message prompt dispatched to ${selectedIds.length} employees.`);
  };

  const statItems = [
    { label: "Total Members", value: stats.total, color: "text-ink", dot: "bg-ink/40" },
    { label: "Freshers (0-1y)", value: stats.freshers, color: "text-emerald-400", dot: "bg-emerald-400" },
    { label: "Experienced", value: stats.experienced, color: "text-purple-400", dot: "bg-purple-400" },
    { label: "Avg Experience", value: `${stats.avgExperience} yrs`, color: "text-amber-300", dot: "bg-amber-400", isRaw: true },
    { label: "Present Today", value: stats.presentToday, color: "text-emerald-400", dot: "bg-emerald-400" },
    { label: "On Leave", value: stats.onLeave, color: "text-rose-400", dot: "bg-rose-400" }
  ];

  return (
    <div className="flex flex-col gap-4 w-full animate-fadeIn">
      {/* Header & Breadcrumb */}
      <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
        <TeamBreadcrumbs
          items={[
            { label: department.name, route: null }
          ]}
          onNavigate={onNavigate}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-line/50">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Departments"
              className="w-9 h-9 rounded-xl bg-surface2/70 border border-line hover:border-accent/50 text-ink hover:text-accent flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
            >
              <Icon name="arrow-left" className="w-4 h-4 text-inherit" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                <Icon name={department.icon} className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-lg sm:text-xl text-ink leading-tight">
                    {department.name}
                  </h1>
                  <span className="text-xs text-muted font-num font-semibold">
                    ({department.totalCount} {department.totalCount === 1 ? 'employee' : 'employees'})
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Head of Department: <strong className="text-ink font-semibold">{department.head?.name || "Unassigned"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="inline-flex items-center p-0.5 bg-surface2/50 border border-line rounded-xl text-xs self-start md:self-auto">
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
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "table" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="list" className="w-3.5 h-3.5 text-inherit" />
            </button>
          </div>
        </div>
      </div>

      {/* Row of Stat Cards */}
      <div className="w-full bg-surface2/30 border border-line rounded-2xl p-2.5 sm:p-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-row items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {statItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              {idx > 0 && <div className="h-7 w-[1px] bg-line/60 shrink-0" aria-hidden="true" />}
              <div className="flex flex-1 flex-col items-center justify-center min-w-[80px] py-0.5 px-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0`} />
                  <span>{item.label}</span>
                </div>
                <div className={`font-num font-extrabold text-base sm:text-lg ${item.color} mt-0.5`}>
                  {item.isRaw ? item.value : formatNumber(item.value)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filters in One Row */}
      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        designation={designation}
        onDesignationChange={setDesignation}
        experienceBand={experienceBand}
        onExperienceBandChange={setExperienceBand}
        employmentType={employmentType}
        onEmploymentTypeChange={setEmploymentType}
        workMode={workMode}
        onWorkModeChange={setWorkMode}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        onReset={handleResetFilters}
      />

      {/* Bulk Actions for HR/Admin */}
      {canEdit && selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-[#061e29] to-[#071a24] border border-accent/40 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-bold text-ink">
              {selectedIds.length} employee{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-muted hover:text-ink text-[11px] underline ml-1 cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBulkExport}
              className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icon name="download" className="w-3.5 h-3.5 text-accent" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={handleBulkChangeDept}
              className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icon name="briefcase" className="w-3.5 h-3.5 text-accent" />
              <span>Change Dept</span>
            </button>

            <button
              type="button"
              onClick={handleBulkSendMessage}
              className="px-3 py-1.5 rounded-xl bg-accent text-on-accent font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Icon name="mail" className="w-3.5 h-3.5 text-on-accent" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      )}

      {/* Employees Grid or Table */}
      {employees.length === 0 ? (
        <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface2/60 border border-line flex items-center justify-center text-muted">
            <Icon name="users" className="w-6 h-6 text-muted" />
          </div>
          <div>
            <h4 className="font-display font-bold text-base text-ink">No employees found</h4>
            <p className="text-xs text-muted mt-1 max-w-sm">
              No employees matched your filter criteria in this department.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onClick={() => handleProfileNav(emp.id)}
              onViewProfile={() => handleProfileNav(emp.id)}
              onViewActivity={(id) => handleProfileNav(id, "activity")}
              onEdit={canEdit ? () => onEditEmployee?.(emp) : null}
              onDelete={canEdit ? (target) => setEmployeeToDelete(target) : null}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <EmployeeTable
          employees={employees}
          totalFiltered={totalFiltered}
          page={curPage}
          pageSize={12}
          totalPages={totalPages}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onSelectEmployee={handleProfileNav}
          onViewActivity={(id) => handleProfileNav(id, "activity")}
          onSelectAll={handleSelectAll}
          onViewProfile={handleProfileNav}
          onEditEmployee={onEditEmployee}
          onDeactivateEmployee={canEdit ? (id) => {
            const match = employees.find(e => e.id === id || e.employeeId === id);
            if (match) setEmployeeToDelete(match);
          } : null}
          canEdit={canEdit}
        />
      )}

      {/* Confirmation Modal for Employee Deletion */}
      <ConfirmDeleteEmployeeModal
        isOpen={Boolean(employeeToDelete)}
        employee={employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default DepartmentEmployeesPage;
