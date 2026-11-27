import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { Avatar } from '../Avatar.jsx';

export const TeamAttendanceTable = ({
  employees = [],
  selectedIds = [],
  onSelectEmployee,
  onSelectAll,
  onRowClick,
  onEditRow,
  onExportCsv
}) => {
  const [sortField, setSortField] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Column visibility toggle state
  const [columnVisibility, setColumnVisibility] = useState({
    department: true,
    shift: true,
    checkIn: true,
    checkOut: true,
    totalHours: true,
    break: true,
    mode: true,
    status: true,
    actions: true
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (colKey) => {
    setColumnVisibility(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  // Sorting
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [employees, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const isAllSelected = employees.length > 0 && selectedIds.length === employees.length;

  // Built-in robust CSV Export handler if parent handler is not provided
  const handleDefaultExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    if (!employees.length) return;

    const headers = ["Employee ID", "Name", "Department", "Role", "Check In", "Check Out", "Total Hours", "Break", "Mode", "Status"];
    const rows = employees.map(emp => [
      emp.employeeId || "",
      `"${emp.name || ""}"`,
      `"${emp.dept || ""}"`,
      `"${emp.role || ""}"`,
      emp.checkIn || "--",
      emp.checkOut || "--",
      emp.totalHours || "--",
      emp.breakDuration || "--",
      emp.mode || "Office",
      emp.status || "Present"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Team_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-muted font-medium">
          Showing <span className="font-bold text-ink font-num">{employees.length}</span> team member{employees.length !== 1 ? "s" : ""}
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Column Visibility Toggle */}
          <button
            type="button"
            onClick={() => setShowColumnMenu(prev => !prev)}
            className="px-2.5 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-semibold text-muted hover:text-ink hover:border-accent flex items-center gap-1.5 transition cursor-pointer"
            aria-label="Toggle column visibility"
          >
            <Icon name="sliders" className="w-3.5 h-3.5 text-accent" />
            <span>Columns</span>
          </button>

          {showColumnMenu && (
            <div className="absolute right-0 top-10 w-44 bg-[#061720] border border-line rounded-2xl shadow-2xl p-2.5 z-30 flex flex-col gap-1.5 text-xs animate-in fade-in duration-100">
              <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider px-1 pb-1 border-b border-line">
                Show/Hide Columns
              </span>
              {[
                { key: "department", label: "Department" },
                { key: "shift", label: "Shift" },
                { key: "checkIn", label: "Check In" },
                { key: "checkOut", label: "Check Out" },
                { key: "totalHours", label: "Total Hours" },
                { key: "break", label: "Break" },
                { key: "mode", label: "Mode" },
                { key: "status", label: "Status" }
              ].map(col => (
                <label key={col.key} className="flex items-center gap-2 px-1 py-0.5 hover:bg-surface2 rounded cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={columnVisibility[col.key]}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-line text-accent focus:ring-accent"
                  />
                  <span className="text-ink">{col.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Export CSV button with full download capability */}
          <button
            type="button"
            onClick={handleDefaultExport}
            className="px-3.5 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-semibold text-ink hover:border-accent hover:text-accent flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Download team attendance report as CSV"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-accent" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line text-muted uppercase text-[10.5px] tracking-wider font-semibold bg-surface2/50">
              {/* Select All Checkbox */}
              <th className="py-3 px-3 pl-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  aria-label="Select all employees"
                  className="rounded border-line text-accent focus:ring-accent cursor-pointer"
                />
              </th>

              {/* Employee */}
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-3 cursor-pointer hover:text-ink select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Employee</span>
                  {sortField === "name" && (
                    <Icon name={sortAsc ? "chevron-up" : "chevron-down"} className="w-3 h-3 text-accent" />
                  )}
                </div>
              </th>

              {/* Department */}
              {columnVisibility.department && (
                <th
                  onClick={() => handleSort("dept")}
                  className="py-3 px-3 cursor-pointer hover:text-ink select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Department</span>
                    {sortField === "dept" && (
                      <Icon name={sortAsc ? "chevron-up" : "chevron-down"} className="w-3 h-3 text-accent" />
                    )}
                  </div>
                </th>
              )}

              {/* Shift */}
              {columnVisibility.shift && (
                <th className="py-3 px-3">Shift</th>
              )}

              {/* Check In */}
              {columnVisibility.checkIn && (
                <th
                  onClick={() => handleSort("checkIn")}
                  className="py-3 px-3 cursor-pointer hover:text-ink select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Check In</span>
                    {sortField === "checkIn" && (
                      <Icon name={sortAsc ? "chevron-up" : "chevron-down"} className="w-3 h-3 text-accent" />
                    )}
                  </div>
                </th>
              )}

              {/* Check Out */}
              {columnVisibility.checkOut && (
                <th className="py-3 px-3">Check Out</th>
              )}

              {/* Total Hours */}
              {columnVisibility.totalHours && (
                <th
                  onClick={() => handleSort("netMs")}
                  className="py-3 px-3 cursor-pointer hover:text-ink select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Total Hours</span>
                    {sortField === "netMs" && (
                      <Icon name={sortAsc ? "chevron-up" : "chevron-down"} className="w-3 h-3 text-accent" />
                    )}
                  </div>
                </th>
              )}

              {/* Break */}
              {columnVisibility.break && (
                <th className="py-3 px-3">Break</th>
              )}

              {/* Mode */}
              {columnVisibility.mode && (
                <th className="py-3 px-3">Mode</th>
              )}

              {/* Status */}
              {columnVisibility.status && (
                <th
                  onClick={() => handleSort("status")}
                  className="py-3 px-3 cursor-pointer hover:text-ink select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {sortField === "status" && (
                      <Icon name={sortAsc ? "chevron-up" : "chevron-down"} className="w-3 h-3 text-accent" />
                    )}
                  </div>
                </th>
              )}

              {/* Actions */}
              <th className="py-3 px-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 font-medium">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted">
                  No team attendance records match the selected criteria.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map(emp => {
                const isSelected = selectedIds.includes(emp.employeeId);
                const isPresent = emp.status === "Present";
                const isWfh = emp.mode === "WFH" || emp.status === "WFH";
                const isAbsent = emp.status === "Absent";
                const isLate = emp.isLate;
                const isEarlyOut = emp.isEarlyOut;

                return (
                  <tr
                    key={emp.employeeId}
                    onClick={() => onRowClick(emp)}
                    className={`hover:bg-surface2/30 transition cursor-pointer ${
                      isSelected ? "bg-accent/10" : ""
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <td
                      className="py-3 px-3 pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectEmployee(emp.employeeId)}
                        aria-label={`Select ${emp.name}`}
                        className="rounded border-line text-accent focus:ring-accent cursor-pointer"
                      />
                    </td>

                    {/* Employee avatar + name + designation */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} employeeId={emp.employeeId} size="sm" photoUrl={emp.avatarUrl} />
                        <div>
                          <div className="font-semibold text-ink text-xs flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            {emp.isEdited && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-accent/20 text-accent border border-accent/40"
                                title={`Manually edited: ${emp.auditInfo?.reason || 'HR update'}`}
                              >
                                Edited
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-muted">
                            <span className="font-mono">{emp.employeeId}</span> · {emp.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    {columnVisibility.department && (
                      <td className="py-3 px-3 text-muted">
                        {emp.dept}
                      </td>
                    )}

                    {/* Shift */}
                    {columnVisibility.shift && (
                      <td className="py-3 px-3 text-muted text-[11px]">
                        09:00 – 18:00
                      </td>
                    )}

                    {/* Check In */}
                    {columnVisibility.checkIn && (
                      <td className="py-3 px-3">
                        <span className={emp.checkIn !== "--" ? "text-good font-semibold font-num" : "text-muted"}>
                          {emp.checkIn}
                        </span>
                        {isLate && (
                          <div className="text-[10px] text-warn font-semibold">
                            Late ({emp.lateMinutes}m)
                          </div>
                        )}
                      </td>
                    )}

                    {/* Check Out */}
                    {columnVisibility.checkOut && (
                      <td className="py-3 px-3">
                        <span className={emp.checkOut !== "--" ? (isEarlyOut ? "text-amber-400 font-semibold font-num" : "text-ink font-semibold font-num") : "text-muted"}>
                          {emp.checkOut}
                        </span>
                      </td>
                    )}

                    {/* Total Hours */}
                    {columnVisibility.totalHours && (
                      <td className="py-3 px-3">
                        <span className="font-semibold text-ink font-num">
                          {emp.totalHours}
                        </span>
                        {emp.isWorking && (
                          <span className="text-[10px] text-good block font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
                            Live
                          </span>
                        )}
                      </td>
                    )}

                    {/* Break */}
                    {columnVisibility.break && (
                      <td className="py-3 px-3 text-muted font-num">
                        {emp.breakDuration}
                      </td>
                    )}

                    {/* Mode */}
                    {columnVisibility.mode && (
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                          emp.mode === "WFH"
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-surface2 text-ink border-line"
                        }`}>
                          {emp.mode}
                        </span>
                      </td>
                    )}

                    {/* Status badge */}
                    {columnVisibility.status && (
                      <td className="py-3 px-3">
                        {isEarlyOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 inline-block shadow-sm">
                            Early Out
                          </span>
                        ) : isPresent || isWfh ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-good/15 text-good border border-good/40 inline-block">
                            {emp.status}
                          </span>
                        ) : isAbsent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-bad/15 text-bad border border-bad/40 inline-block">
                            Absent
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warn/15 text-warn border border-warn/40 inline-block">
                            {emp.status}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Actions */}
                    <td
                      className="py-3 px-3 pr-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onEditRow(emp)}
                        className="px-2.5 py-1 rounded-lg border border-line bg-surface2 hover:border-accent text-xs font-semibold text-ink transition cursor-pointer"
                        title="Edit attendance"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedEmployees.length > pageSize && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted">
          <div>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedEmployees.length)} of {sortedEmployees.length} team members
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded-lg border border-line bg-surface2 text-xs font-semibold text-ink hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-2 font-data font-semibold text-ink">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded-lg border border-line bg-surface2 text-xs font-semibold text-ink hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};