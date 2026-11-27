import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { DepartmentSummaryStrip } from './DepartmentSummaryStrip.jsx';
import { DepartmentCard } from './DepartmentCard.jsx';
import { getDepartmentsSummary, getKolkataDateKey } from '../../services/attendanceService.js';
import { formatDisplayDate } from '../../services/attendanceLog.js';
import { formatNumber } from '../../utils/format.js';

export const TeamDepartmentsPage = ({
  selectedDate,
  onDateChange,
  onSelectDepartment,
  currentUser,
  onTriggerToast
}) => {
  const todayKey = useMemo(() => getKolkataDateKey(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Fetch summary data for selected date
  const summaryData = useMemo(() => {
    return getDepartmentsSummary(selectedDate, currentUser);
  }, [selectedDate, currentUser]);

  const { overall = {}, departments = [] } = summaryData;

  // Filter departments by search
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const q = searchTerm.trim().toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.head?.name || "").toLowerCase().includes(q)
    );
  }, [departments, searchTerm]);

  // Date steppers
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

  const handleToday = () => {
    onDateChange(todayKey);
  };

  // Export summary CSV
  const handleExportSummary = () => {
    const headers = [
      "Department",
      "Head of Department",
      "Total Employees",
      "Present",
      "Absent",
      "On Leave",
      "WFH",
      "Late Arrivals",
      "Attendance Rate (%)",
      "Status"
    ];

    const rows = filteredDepartments.map(d => [
      `"${d.name}"`,
      `"${d.head?.name || 'Unassigned'}"`,
      d.totalEmployees,
      d.present,
      d.absent,
      d.onLeave,
      d.wfh,
      d.late,
      `${d.attendanceRate}%`,
      `"${d.status}"`
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `departments-attendance-summary-${selectedDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onTriggerToast?.(`Exported summary for ${filteredDepartments.length} departments.`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ================= 1. TOP BAR ================= */}
      <div className="glass-card !p-3.5 border border-line rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
        {/* Left: Date Picker with Prev/Next Day Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-surface2/60 border border-line rounded-xl p-0.5">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Previous Day"
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition cursor-pointer"
            >
              <Icon name="chevron-left" className="w-4 h-4 text-inherit" />
            </button>
            <div className="px-3 py-1 text-xs font-bold text-ink flex items-center gap-1.5 min-w-[140px] justify-center">
              <Icon name="calendar" className="w-3.5 h-3.5 text-accent" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDate >= todayKey}
              aria-label="Next Day"
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="chevron-right" className="w-4 h-4 text-inherit" />
            </button>
          </div>

          {selectedDate !== todayKey && (
            <button
              type="button"
              onClick={handleToday}
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
            className="px-2.5 py-1 bg-surface2/40 border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            aria-label="Select specific date"
          />
        </div>

        {/* Right: Search + View Mode + Export Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px] sm:min-w-[240px] flex-1 sm:flex-initial">
            <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search department..."
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

          {/* View Mode Toggle */}
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

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2/60 border border-line hover:border-accent/40 text-xs font-semibold text-ink hover:text-accent transition cursor-pointer shadow-sm"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-inherit" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ================= 2. OVERALL SUMMARY STRIP ================= */}
      <DepartmentSummaryStrip overall={overall} />

      {/* ================= 3. DEPARTMENTS GRID / LIST ================= */}
      {filteredDepartments.length === 0 ? (
        <div className="glass-card !p-10 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface2/60 border border-line flex items-center justify-center text-muted">
            <Icon name="search" className="w-6 h-6 text-muted" />
          </div>
          <div>
            <h4 className="font-display font-bold text-base text-ink">No departments found</h4>
            <p className="text-xs text-muted mt-1 max-w-sm">
              No department matching "{searchTerm}" was found. Try clearing your search term.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDepartments.map(dept => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onClick={() => onSelectDepartment(dept.id)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="glass-card !p-2 border border-line rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface2/40 text-muted uppercase tracking-wider text-[10px] border-b border-line">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Head of Dept</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Present</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-center">On Leave</th>
                  <th className="py-2.5 px-3 text-center">WFH</th>
                  <th className="py-2.5 px-3 text-center">Rate</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {filteredDepartments.map(dept => (
                  <tr
                    key={dept.id}
                    onClick={() => onSelectDepartment(dept.id)}
                    className="hover:bg-accent/5 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-display font-bold text-ink flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
                        <Icon name={dept.icon} className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <span className="group-hover:text-accent transition-colors">{dept.name}</span>
                    </td>
                    <td className="py-3 px-3 text-muted">{dept.head?.name || "Unassigned"}</td>
                    <td className="py-3 px-3 text-center font-num font-bold text-ink">{formatNumber(dept.totalEmployees)}</td>
                    <td className="py-3 px-3 text-center font-num font-semibold text-emerald-400">{formatNumber(dept.present)}</td>
                    <td className="py-3 px-3 text-center font-num font-semibold text-rose-400">{formatNumber(dept.absent)}</td>
                    <td className="py-3 px-3 text-center font-num font-semibold text-amber-300">{formatNumber(dept.onLeave)}</td>
                    <td className="py-3 px-3 text-center font-num font-semibold text-cyan-400">{formatNumber(dept.wfh)}</td>
                    <td className="py-3 px-3 text-center font-num font-extrabold text-ink">{dept.attendanceRate}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        dept.status === "Good"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : dept.status === "Average"
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                          : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-accent font-semibold text-xs group-hover:translate-x-1 transition-transform">
                        <span>View</span>
                        <Icon name="arrow-right" className="w-3.5 h-3.5 text-accent" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
