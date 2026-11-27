import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';

export const AttendanceHistoryTable = ({
  historyData = [],
  onRequestRegularization,
  onExportCsv,
  title = "Attendance History"
}) => {
  const [dateRangeFilter, setDateRangeFilter] = useState("this_month");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" | "asc"
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter records
  const filteredData = useMemo(() => {
    return historyData.filter(row => {
      // 1. Status Filter
      if (statusFilter !== "all") {
        const sLower = (row.status || "").toLowerCase();
        if (statusFilter === "present" && !sLower.includes("present") && !sLower.includes("wfh")) return false;
        if (statusFilter === "early" && !sLower.includes("early") && !row.earlyOut) return false;
        if (statusFilter === "missed" && !sLower.includes("missed") && !row.isMissedCheckOut) return false;
        if (statusFilter === "leave" && !sLower.includes("leave")) return false;
        if (statusFilter === "holiday" && !sLower.includes("holiday")) return false;
      }

      // 2. Mode Filter
      if (modeFilter !== "all") {
        const rowMode = (row.mode || "").toLowerCase();
        if (modeFilter === "office" && !rowMode.includes("office") && rowMode !== "wfo") return false;
        if (modeFilter === "wfh" && !rowMode.includes("wfh")) return false;
      }

      // 3. Date Range Filter
      if (dateRangeFilter !== "all" && row.dateKey) {
        const rowDate = new Date(`${row.dateKey}T12:00:00+05:30`);
        const now = new Date();
        const diffDays = (now.getTime() - rowDate.getTime()) / (1000 * 3600 * 24);

        if (dateRangeFilter === "7days" && diffDays > 7) return false;
        if (dateRangeFilter === "30days" && diffDays > 30) return false;
        if (dateRangeFilter === "this_month") {
          const isSameMonth = rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear();
          if (!isSameMonth) return false;
        }
      }

      return true;
    });
  }, [historyData, dateRangeFilter, statusFilter, modeFilter]);

  // Sort records
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = a.dateKey || "";
      const dateB = b.dateKey || "";
      return sortOrder === "asc" ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });
  }, [filteredData, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  // Handle Export CSV
  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const headers = ["Date", "Day", "Check In", "Check Out", "Break", "Total Hours", "Mode", "Status", "Reason / Remarks"];
    const rows = sortedData.map(r => [
      `"${r.dateKey}"`,
      `"${r.weekday}"`,
      `"${r.checkIn}"`,
      `"${r.checkOut}"`,
      `"${r.breakDuration}"`,
      `"${r.totalHours}"`,
      `"${r.mode}"`,
      `"${r.status}"`,
      `"${r.earlyReason || (r.isMissedCheckOut ? "Missed check-out" : "")}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance-history-${dateRangeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface2/30 p-3 rounded-2xl border border-line">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-ink text-sm sm:text-base">{title}</span>
          <span className="glass-pill px-2 py-0.5 text-xs text-accent font-semibold font-num">
            {sortedData.length} records
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Date Range */}
          <Select
            size="sm"
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-32"
            ariaLabel="Filter by date range"
          >
            <option value="this_month">This Month</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="all">All Time</option>
          </Select>

          {/* Status Filter */}
          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-32"
            ariaLabel="Filter by attendance status"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="early">Early Out</option>
            <option value="missed">Missed Check Out</option>
            <option value="leave">Leave</option>
            <option value="holiday">Holiday</option>
          </Select>

          {/* Mode Filter */}
          <Select
            size="sm"
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-28"
            ariaLabel="Filter by work mode"
          >
            <option value="all">All Modes</option>
            <option value="office">Office</option>
            <option value="wfh">WFH</option>
          </Select>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink flex items-center gap-1 font-semibold transition cursor-pointer"
            title="Toggle sort direction by date"
          >
            <Icon name="arrow-up-down" className="w-3.5 h-3.5 text-accent" />
            <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-accent" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line text-muted uppercase text-[10.5px] tracking-wider font-semibold bg-surface2/50">
              <th className="py-3 px-3 pl-4">Date</th>
              <th className="py-3 px-3">Day</th>
              <th className="py-3 px-3">Check In</th>
              <th className="py-3 px-3">Check Out</th>
              <th className="py-3 px-3">Break</th>
              <th className="py-3 px-3">Total Hours</th>
              <th className="py-3 px-3">Mode</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 pr-4 text-right">Remarks & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 font-medium">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-muted">
                  No attendance records found matching filters
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isEarlyOut = row.earlyOut || (row.status && row.status.toLowerCase().includes("early"));
                const isMissed = row.isMissedCheckOut || row.status === "Missed Check Out";
                const isPresent = row.status === "Present";
                const isWfh = row.mode === "WFH" || row.status === "WFH";
                const isHalfDay = row.status === "Half Day";

                const rowBg = isEarlyOut
                  ? "bg-amber-500/5 hover:bg-amber-500/10"
                  : isMissed
                  ? "bg-amber-400/5 hover:bg-amber-400/10"
                  : "hover:bg-surface2/30";

                return (
                  <tr key={row.dateKey} className={`${rowBg} transition`}>
                    {/* Date */}
                    <td className="py-3 px-3 pl-4 font-semibold text-ink font-num">
                      {row.formattedDate || row.dateKey}
                    </td>

                    {/* Day */}
                    <td className="py-3 px-3 text-muted">
                      {row.weekdayShort || row.weekday}
                    </td>

                    {/* Check In */}
                    <td className="py-3 px-3">
                      <span className={row.checkIn !== "--" ? "text-good font-semibold font-num" : "text-muted"}>
                        {row.checkIn}
                      </span>
                      {row.isLate && (
                        <div className="text-[10px] text-warn font-semibold">
                          Late ({row.lateMinutes}m)
                        </div>
                      )}
                    </td>

                    {/* Check Out */}
                    <td className="py-3 px-3">
                      <span className={row.checkOut !== "--" ? (isEarlyOut ? "text-amber-400 font-semibold font-num" : "text-ink font-semibold font-num") : "text-muted"}>
                        {row.checkOut}
                      </span>
                    </td>

                    {/* Break */}
                    <td className="py-3 px-3 text-muted font-num">
                      {row.breakDuration}
                    </td>

                    {/* Total Hours */}
                    <td className="py-3 px-3 font-semibold text-ink font-num">
                      {row.totalHours}
                    </td>

                    {/* Mode */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                        row.mode === "WFH"
                          ? "bg-accent/15 text-accent border-accent/30"
                          : "bg-surface2 text-ink border-line"
                      }`}>
                        {row.mode}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {isEarlyOut ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 inline-block shadow-sm"
                          title={row.earlyReason || "Early Check Out (< 9 hours worked)"}
                        >
                          Early Out
                        </span>
                      ) : isMissed ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/40 inline-block animate-pulse shadow-sm"
                          title="No checkout punch recorded for this day"
                        >
                          Missed Out
                        </span>
                      ) : isHalfDay ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/40 inline-block">
                          Half Day
                        </span>
                      ) : isPresent || isWfh ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-good/15 text-good border border-good/40 inline-block">
                          Present
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-bad/15 text-bad border border-bad/40 inline-block">
                          {row.status}
                        </span>
                      )}
                    </td>

                    {/* Remarks & Regularize Action */}
                    <td className="py-3 px-3 pr-4 text-right">
                      {isMissed ? (
                        <button
                          type="button"
                          onClick={() => onRequestRegularization?.(row.dateKey)}
                          className="px-2.5 py-1 rounded-lg bg-warn text-bg font-bold text-[11px] hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
                        >
                          Regularize
                        </button>
                      ) : isEarlyOut && row.earlyReason ? (
                        <span className="text-[11px] text-muted italic truncate max-w-[150px] inline-block" title={row.earlyReason}>
                          {row.earlyReason}
                        </span>
                      ) : row.isEdited ? (
                        <span className="text-[10.5px] text-accent font-semibold" title={`Edited by ${row.auditInfo?.updatedBy || 'Admin'}`}>
                          Edited
                        </span>
                      ) : (
                        <span className="text-muted text-[11px]">--</span>
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
      {sortedData.length > pageSize && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted">
          <div>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
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
