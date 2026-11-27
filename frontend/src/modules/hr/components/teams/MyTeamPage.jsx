import React, { useState, useMemo } from "react";
import Icon from "../Icon";
import Select from "../Select";
import MainTLCard from "./MainTLCard";
import TLCard from "./TLCard";
import TeamOrgChart from "./TeamOrgChart";
import { getTeamTree } from "../../services/teamService";

export default function MyTeamPage({
  mainTl,
  tls = [],
  allEmployees = [],
  currentUserRole = "HR",
  onSelectTL,
  onSelectEmployee,
  onAddEmployee,
  onEditEmployee,
}) {
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'org-chart'
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Get departments represented by the TLs
  const tlDepartments = useMemo(() => {
    const set = new Set();
    tls.forEach((tl) => {
      if (tl.department) set.add(tl.department);
    });
    return Array.from(set).sort();
  }, [tls]);

  // Filter TLs
  const filteredTLs = useMemo(() => {
    return tls.filter((tl) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          tl.name.toLowerCase().includes(q) ||
          tl.id.toLowerCase().includes(q) ||
          (tl.designation || "").toLowerCase().includes(q) ||
          (tl.department || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (departmentFilter !== "all" && tl.department !== departmentFilter) {
        return false;
      }
      return true;
    });
  }, [tls, searchTerm, departmentFilter]);

  // Construct tree for org-chart view
  const treeData = useMemo(() => {
    if (!mainTl) return null;
    return getTeamTree(mainTl.id);
  }, [mainTl, allEmployees]);

  // Overall statistics
  const totalTLCount = tls.length;
  const totalEmployeesCount = useMemo(() => {
    // Count all distinct employees under Main TL
    const ids = new Set();
    tls.forEach((tl) => {
      if (Array.isArray(tl.subordinates)) {
        tl.subordinates.forEach((sub) => ids.add(sub.id));
      }
    });
    return ids.size;
  }, [tls]);

  if (!mainTl) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <Icon name="users" className="mb-3 h-10 w-10 text-white/30" />
        <h3 className="text-base font-semibold text-white">No Main Team Lead Configured</h3>
        <p className="mt-1 max-w-sm text-xs text-white/50">
          A Main Team Lead must be assigned in Employee Management to anchor the hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level 1: Main TL Hero Profile Card */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Hierarchy Level 1 &bull; Main Team Lead
          </span>
          <span className="text-xs text-white/40">Root of Reporting Structure</span>
        </div>
        <MainTLCard
          mainTl={mainTl}
          directTLsCount={totalTLCount}
          totalSubordinatesCount={totalEmployeesCount}
          onViewDetail={() => onSelectEmployee(mainTl.id)}
          onViewAllSubordinates={() => {
            // Scroll to TLs or keep focus
          }}
        />
      </div>

      {/* Level 2: Team Leads Header & Controls */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                Hierarchy Level 2 &bull; Reporting Team Leads
              </span>
              <span className="rounded-full bg-teal-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-300">
                {totalTLCount} TLs
              </span>
            </div>
            <p className="text-xs text-white/50">
              Team Leads directly reporting to {mainTl.name}
            </p>
          </div>

          {/* Controls: Search, Filter, View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search TLs..."
                className="w-40 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 focus:border-teal-500/50 focus:outline-none sm:w-48"
              />
              <Icon
                name="search"
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40"
              />
            </div>

            {/* Department filter */}
            {tlDepartments.length > 1 && (
              <Select
                size="sm"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All Departments</option>
                {tlDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
            )}

            {/* View Mode Toggle: Cards | Org Chart */}
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === "cards"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Icon name="grid" className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode("org-chart")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === "org-chart"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Icon name="network" className="h-3.5 w-3.5" />
                <span>Org Chart</span>
              </button>
            </div>

            {/* Add Team Member (HR/Admin) */}
            {onAddEmployee && (currentUserRole === "HR" || currentUserRole === "Admin") && (
              <button
                onClick={onAddEmployee}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-teal-500/20 hover:brightness-110"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* View Content */}
        {viewMode === "cards" ? (
          filteredTLs.length === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <Icon name="users" className="mb-2 h-7 w-7 text-white/30" />
              <p className="text-sm font-semibold text-white">No Team Leads match the criteria</p>
              <p className="text-xs text-white/40">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTLs.map((tl) => (
                <TLCard
                  key={tl.id}
                  tl={tl}
                  onViewEmployees={() => onSelectTL(tl.id)}
                  onViewDetail={() => onSelectEmployee(tl.id)}
                  onEdit={onEditEmployee ? () => onEditEmployee(tl) : undefined}
                />
              ))}
            </div>
          )
        ) : (
          <TeamOrgChart
            tree={treeData}
            onSelectEmployee={onSelectEmployee}
            onSelectTL={onSelectTL}
          />
        )}
      </div>
    </div>
  );
}
