import React, { useState, useMemo } from "react";
import Icon from "../Icon";
import TeamBreadcrumbs from "./TeamBreadcrumbs";
import ExperienceBadge from "./ExperienceBadge";
import EmployeeCard from "./EmployeeCard";
import EmployeeTable from "./EmployeeTable";
import EmployeeFilters from "./EmployeeFilters";
import { formatExperience } from "../../config/teams";
import { deleteEmployee } from "../../services/teamService";
import { ConfirmDeleteEmployeeModal } from "./ConfirmDeleteEmployeeModal";

export default function TLEmployeesPage({
  tl,
  mainTl,
  employees = [],
  currentUserRole = "HR",
  onBack,
  onNavigate,
  onSelectEmployee,
  onAddMember,
  onEditEmployee,
}) {
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    band: "all",
    workMode: "all",
  });
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    deleteEmployee(employeeToDelete.id);
    setIsDeleting(false);
    setEmployeeToDelete(null);
  };

  const breadcrumbs = useMemo(() => {
    return [
      { label: "Teams", href: "/teams" },
      { label: "My Team", href: "/teams?tab=my-team" },
      ...(mainTl ? [{ label: mainTl.name, href: `/teams/my-team/tl/${mainTl.id}` }] : []),
      { label: tl ? tl.name : "Team Lead", current: true },
    ];
  }, [mainTl, tl]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          emp.name.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q) ||
          (emp.designation || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters.status !== "all" && emp.status !== filters.status) return false;
      if (filters.workMode !== "all" && emp.workMode !== filters.workMode) return false;
      return true;
    });
  }, [employees, filters]);

  if (!tl) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <Icon name="alert-circle" className="mb-3 h-10 w-10 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Team Lead Not Found</h3>
        <p className="mt-1 text-sm text-white/50">
          The requested Team Lead profile or team could not be located.
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          <Icon name="arrow-left" className="h-4 w-4" />
          <span>Back to My Team</span>
        </button>
      </div>
    );
  }

  const tlInitials = (tl.name || "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalMembers = employees.length;
  const activeMembers = employees.filter((e) => e.status === "Active").length;
  const avgExpYears =
    totalMembers > 0
      ? (
          employees.reduce((acc, curr) => acc + (curr.totalExperienceYears || 0), 0) /
          totalMembers
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TeamBreadcrumbs items={breadcrumbs} onNavigate={onNavigate} />

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          <span>Back to Team Leads</span>
        </button>
      </div>

      {/* TL Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-emerald-950/20 to-black/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {tl.avatar ? (
                <img
                  src={tl.avatar}
                  alt={tl.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-teal-400/50"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-xl font-bold text-teal-300 ring-2 ring-teal-400/50">
                  {tlInitials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0a1017] bg-emerald-400" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">{tl.name}</h1>
                <span className="font-mono text-xs font-semibold text-teal-300/80">{tl.id}</span>
                <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/30">
                  Team Lead
                </span>
                <ExperienceBadge experienceYears={tl.totalExperienceYears} previousCompanies={tl.previousCompanies} />
              </div>
              <p className="mt-1 text-sm text-white/70">
                {tl.designation} &bull; <span className="text-white/90">{tl.department}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/50">
                {tl.email && (
                  <span className="inline-flex items-center gap-1.5 hover:text-white">
                    <Icon name="mail" className="h-3.5 w-3.5" />
                    <span>{tl.email}</span>
                  </span>
                )}
                {tl.phone && (
                  <span className="inline-flex items-center gap-1.5 hover:text-white">
                    <Icon name="phone" className="h-3.5 w-3.5" />
                    <span className="font-mono">{tl.phone}</span>
                  </span>
                )}
                {mainTl && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300/80">
                    <Icon name="users" className="h-3.5 w-3.5" />
                    <span>Reports to: {mainTl.name} (Main TL)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectEmployee && onSelectEmployee(tl.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10"
            >
              <Icon name="info" className="h-4 w-4" />
              <span>Full Profile</span>
            </button>
            {onAddMember && (currentUserRole === "HR" || currentUserRole === "Admin") && (
              <button
                onClick={() => onAddMember(tl.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:brightness-110"
              >
                <Icon name="plus" className="h-4 w-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Team Size</span>
            <Icon name="users" className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white">{totalMembers}</span>
            <span className="text-xs text-white/40">direct members</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Active Status</span>
            <Icon name="check-circle" className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-400">{activeMembers}</span>
            <span className="text-xs text-white/40">of {totalMembers} active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Avg Experience</span>
            <Icon name="award" className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white">{avgExpYears}</span>
            <span className="text-xs text-white/40">years</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Department</span>
            <Icon name="briefcase" className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="truncate text-base font-bold text-white">{tl.department}</span>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <EmployeeFilters filters={filters} onChange={setFilters} />

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
              title="Grid View"
            >
              <Icon name="grid" className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
              title="Table View"
            >
              <Icon name="layout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Employees Content (Grid or Table) */}
      {filteredEmployees.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <Icon name="users" className="mb-2 h-8 w-8 text-white/20" />
          <h4 className="text-sm font-semibold text-white">No Team Members Found</h4>
          <p className="mt-1 text-xs text-white/50">
            No employees reporting to {tl.name} match the current filter criteria.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onClick={() => onSelectEmployee && onSelectEmployee(employee.id)}
              onEdit={onEditEmployee ? () => onEditEmployee(employee) : undefined}
              onDelete={(target) => setEmployeeToDelete(target)}
              canEdit={true}
            />
          ))}
        </div>
      ) : (
        <EmployeeTable
          employees={filteredEmployees}
          onSelectEmployee={onSelectEmployee}
          onEditEmployee={onEditEmployee}
          onDeactivateEmployee={(id) => {
            const match = filteredEmployees.find(e => e.id === id || e.employeeId === id);
            if (match) setEmployeeToDelete(match);
          }}
          canEdit={true}
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
}
