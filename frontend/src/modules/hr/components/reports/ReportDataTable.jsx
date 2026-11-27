import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../Avatar.jsx';
import { StatusPill } from '../StatusPill.jsx';
import { Icon } from '../Icon.jsx';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export const ReportDataTable = ({ category, tableData = [], onTriggerToast }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);
  const PAGE_SIZE = 10;

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    const q = searchTerm.toLowerCase();
    return tableData.filter(row => {
      return Object.values(row).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }, [tableData, searchTerm]);

  // Sort
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, totalItems);
  const paginatedData = sortedData.slice(startIdx, endIdx);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const renderStatusPill = (status) => {
    if (!status) return "-";
    const stLower = String(status).toLowerCase();
    let type = "info";
    if (stLower.includes("active") || stLower.includes("paid") || stLower.includes("approved") || stLower.includes("completed") || stLower.includes("present") || stLower.includes("joined")) {
      type = "good";
    } else if (stLower.includes("leave") || stLower.includes("pending") || stLower.includes("progress") || stLower.includes("probation") || stLower.includes("notice")) {
      type = "warn";
    } else if (stLower.includes("absent") || stLower.includes("rejected") || stLower.includes("overdue") || stLower.includes("inactive") || stLower.includes("resigned")) {
      type = "bad";
    }
    return <StatusPill type={type} text={status} />;
  };

  return (
    <div className="glass-card !p-0 overflow-hidden border border-line shadow-xl text-xs">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-line flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="file-text" className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-ink text-sm">Detailed Record Ledger</span>
          <span className="text-[11px] font-data text-muted">
            ({totalItems} Records)
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in table records..."
              className="w-full bg-surface2/60 border border-line rounded px-8 py-1.5 text-xs text-ink outline-none focus:border-accent"
            />
            <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 text-muted hover:text-ink text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10px] font-semibold tracking-wider">
            {/* EMPLOYEE TABLE HEADER */}
            {category === "employee" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  EMP ID {getSortIndicator("id")}
                </th>
                <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  Employee {getSortIndicator("name")}
                </th>
                <th onClick={() => handleSort("dept")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  Department {getSortIndicator("dept")}
                </th>
                <th onClick={() => handleSort("role")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  Role {getSortIndicator("role")}
                </th>
                <th onClick={() => handleSort("gender")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  Gender {getSortIndicator("gender")}
                </th>
                <th onClick={() => handleSort("joined")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  Joined {getSortIndicator("joined")}
                </th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">
                  Status {getSortIndicator("status")}
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}

            {/* ATTENDANCE TABLE HEADER */}
            {category === "attendance" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">EMP ID {getSortIndicator("id")}</th>
                <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-ink">Employee {getSortIndicator("name")}</th>
                <th onClick={() => handleSort("dept")} className="py-3 px-4 cursor-pointer hover:text-ink">Department {getSortIndicator("dept")}</th>
                <th onClick={() => handleSort("checkIn")} className="py-3 px-4 cursor-pointer hover:text-ink">Check-In {getSortIndicator("checkIn")}</th>
                <th onClick={() => handleSort("checkOut")} className="py-3 px-4 cursor-pointer hover:text-ink">Check-Out {getSortIndicator("checkOut")}</th>
                <th onClick={() => handleSort("hours")} className="py-3 px-4 cursor-pointer hover:text-ink">Total Hours {getSortIndicator("hours")}</th>
                <th onClick={() => handleSort("mode")} className="py-3 px-4 cursor-pointer hover:text-ink">Mode {getSortIndicator("mode")}</th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">Status {getSortIndicator("status")}</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}

            {/* LEAVE TABLE HEADER */}
            {category === "leave" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">Request ID {getSortIndicator("id")}</th>
                <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-ink">Employee {getSortIndicator("name")}</th>
                <th onClick={() => handleSort("type")} className="py-3 px-4 cursor-pointer hover:text-ink">Leave Type {getSortIndicator("type")}</th>
                <th onClick={() => handleSort("days")} className="py-3 px-4 cursor-pointer hover:text-ink">Duration {getSortIndicator("days")}</th>
                <th className="py-3 px-4">Dates</th>
                <th onClick={() => handleSort("balance")} className="py-3 px-4 cursor-pointer hover:text-ink">Balance {getSortIndicator("balance")}</th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">Status {getSortIndicator("status")}</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}

            {/* PAYROLL TABLE HEADER */}
            {category === "payroll" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">EMP ID {getSortIndicator("id")}</th>
                <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-ink">Employee {getSortIndicator("name")}</th>
                <th onClick={() => handleSort("gross")} className="py-3 px-4 cursor-pointer hover:text-ink text-right">Gross (₹) {getSortIndicator("gross")}</th>
                <th onClick={() => handleSort("pf")} className="py-3 px-4 cursor-pointer hover:text-ink text-right">PF {getSortIndicator("pf")}</th>
                <th onClick={() => handleSort("tds")} className="py-3 px-4 cursor-pointer hover:text-ink text-right">TDS {getSortIndicator("tds")}</th>
                <th onClick={() => handleSort("deductions")} className="py-3 px-4 cursor-pointer hover:text-ink text-right">Total Deductions {getSortIndicator("deductions")}</th>
                <th onClick={() => handleSort("net")} className="py-3 px-4 cursor-pointer hover:text-ink text-right">Net Pay (₹) {getSortIndicator("net")}</th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">Status {getSortIndicator("status")}</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}

            {/* PERFORMANCE TABLE HEADER */}
            {category === "performance" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">EMP ID {getSortIndicator("id")}</th>
                <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-ink">Employee {getSortIndicator("name")}</th>
                <th onClick={() => handleSort("dept")} className="py-3 px-4 cursor-pointer hover:text-ink">Department {getSortIndicator("dept")}</th>
                <th onClick={() => handleSort("score")} className="py-3 px-4 cursor-pointer hover:text-ink">Score {getSortIndicator("score")}</th>
                <th onClick={() => handleSort("rating")} className="py-3 px-4 cursor-pointer hover:text-ink">Rating Band {getSortIndicator("rating")}</th>
                <th onClick={() => handleSort("kpiRate")} className="py-3 px-4 cursor-pointer hover:text-ink">KPI % {getSortIndicator("kpiRate")}</th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">Status {getSortIndicator("status")}</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}

            {/* ONBOARDING & EXIT TABLE HEADER */}
            {category === "onboarding_exit" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">Record ID {getSortIndicator("id")}</th>
                <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-ink">Candidate / Employee {getSortIndicator("name")}</th>
                <th onClick={() => handleSort("type")} className="py-3 px-4 cursor-pointer hover:text-ink">Workflow Type {getSortIndicator("type")}</th>
                <th onClick={() => handleSort("stage")} className="py-3 px-4 cursor-pointer hover:text-ink">Stage {getSortIndicator("stage")}</th>
                <th onClick={() => handleSort("docsVerified")} className="py-3 px-4 cursor-pointer hover:text-ink">Verification {getSortIndicator("docsVerified")}</th>
                <th onClick={() => handleSort("targetDate")} className="py-3 px-4 cursor-pointer hover:text-ink">Target Date {getSortIndicator("targetDate")}</th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">Status {getSortIndicator("status")}</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}

            {/* TASKS TABLE HEADER */}
            {category === "tasks" && (
              <tr>
                <th onClick={() => handleSort("id")} className="py-3 px-4 cursor-pointer hover:text-ink">Task ID {getSortIndicator("id")}</th>
                <th onClick={() => handleSort("title")} className="py-3 px-4 cursor-pointer hover:text-ink">Task Title {getSortIndicator("title")}</th>
                <th onClick={() => handleSort("assignee")} className="py-3 px-4 cursor-pointer hover:text-ink">Assignee {getSortIndicator("assignee")}</th>
                <th onClick={() => handleSort("dept")} className="py-3 px-4 cursor-pointer hover:text-ink">Department {getSortIndicator("dept")}</th>
                <th onClick={() => handleSort("priority")} className="py-3 px-4 cursor-pointer hover:text-ink">Priority {getSortIndicator("priority")}</th>
                <th onClick={() => handleSort("dueDate")} className="py-3 px-4 cursor-pointer hover:text-ink">Due Date {getSortIndicator("dueDate")}</th>
                <th onClick={() => handleSort("progress")} className="py-3 px-4 cursor-pointer hover:text-ink">Progress {getSortIndicator("progress")}</th>
                <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:text-ink">Status {getSortIndicator("status")}</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-dashed divide-line">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Icon name="search" className="w-6 h-6 text-muted/60" />
                    <span className="font-semibold text-ink">No report records found</span>
                    <span className="text-[11px] text-muted">Try adjusting search filters or choose another category</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface2/40 transition">
                  {/* EMPLOYEE ROW */}
                  {category === "employee" && (
                    <>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={row.name} size="sm" />
                          <span className="font-semibold text-ink">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">{row.dept}</td>
                      <td className="py-3 px-4 text-ink">{row.role}</td>
                      <td className="py-3 px-4 text-muted">{row.gender}</td>
                      <td className="py-3 px-4 font-data text-muted">{row.joined}</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* ATTENDANCE ROW */}
                  {category === "attendance" && (
                    <>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={row.name} size="sm" />
                          <span className="font-semibold text-ink">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">{row.dept}</td>
                      <td className="py-3 px-4 font-data text-ink">{row.checkIn}</td>
                      <td className="py-3 px-4 font-data text-ink">{row.checkOut}</td>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.hours}</td>
                      <td className="py-3 px-4 text-muted">{row.mode}</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* LEAVE ROW */}
                  {category === "leave" && (
                    <>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={row.name} size="sm" />
                          <div>
                            <div className="font-semibold text-ink">{row.name}</div>
                            <div className="text-[10px] text-muted font-data">{row.empId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-ink font-medium">{row.type}</td>
                      <td className="py-3 px-4 font-data font-semibold">{row.days} Days</td>
                      <td className="py-3 px-4 text-muted text-[11px]">{row.dates}</td>
                      <td className="py-3 px-4 font-data text-accent">{row.balance} Days Left</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* PAYROLL ROW */}
                  {category === "payroll" && (
                    <>
                      <td className="py-3 px-4 font-mono font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{row.name}</td>
                      <td className="py-3 px-4 font-num text-right">{formatCurrency(row.gross)}</td>
                      <td className="py-3 px-4 font-num text-right text-muted">{formatCurrency(row.pf)}</td>
                      <td className="py-3 px-4 font-num text-right text-muted">{formatCurrency(row.tds)}</td>
                      <td className="py-3 px-4 font-num text-right text-bad font-semibold">{formatCurrency(-row.deductions)}</td>
                      <td className="py-3 px-4 font-num text-right text-good font-bold">{formatCurrency(row.net)}</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* PERFORMANCE ROW */}
                  {category === "performance" && (
                    <>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{row.name}</td>
                      <td className="py-3 px-4 text-muted">{row.dept}</td>
                      <td className="py-3 px-4 font-num font-bold text-accent">{row.score !== null ? `${row.score} / 100` : "--"}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{row.band}</td>
                      <td className="py-3 px-4 font-data">{row.kpiRate}</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* ONBOARDING & EXIT ROW */}
                  {category === "onboarding_exit" && (
                    <>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{row.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${row.type === 'Onboarding' ? 'bg-accent/15 text-accent' : 'bg-bad/15 text-bad'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink font-medium">{row.stage}</td>
                      <td className="py-3 px-4 font-data text-accent font-semibold">{row.docsVerified}</td>
                      <td className="py-3 px-4 font-data text-muted">{row.targetDate}</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* TASKS ROW */}
                  {category === "tasks" && (
                    <>
                      <td className="py-3 px-4 font-data font-semibold text-accent">{row.id}</td>
                      <td className="py-3 px-4 font-semibold text-ink max-w-[200px] truncate" title={row.title}>{row.title}</td>
                      <td className="py-3 px-4 text-ink">{row.assignee}</td>
                      <td className="py-3 px-4 text-muted">{row.dept}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${row.priority === 'Critical' ? 'bg-bad/15 text-bad' : row.priority === 'High' ? 'bg-warn/15 text-warn' : 'bg-surface2 text-muted'}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-num text-muted">{row.dueDate}</td>
                      <td className="py-3 px-4 font-num font-semibold text-accent">{formatPercent(row.progress, { decimals: 0 })}</td>
                      <td className="py-3 px-4">{renderStatusPill(row.status)}</td>
                    </>
                  )}

                  {/* Action Column */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedRow(row)}
                      className="px-2.5 py-1 rounded bg-surface2 border border-line text-accent text-[11px] font-semibold hover:border-accent hover:bg-accent/10 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="p-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div>
            Showing <span className="font-semibold text-ink">{startIdx + 1}</span> to <span className="font-semibold text-ink">{endIdx}</span> of <span className="font-semibold text-ink">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1 rounded bg-surface2 border border-line text-ink text-xs font-semibold hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-2 text-ink font-data text-xs">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1 rounded bg-surface2 border border-line text-ink text-xs font-semibold hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal via Portal */}
      {selectedRow && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg p-6 rounded-2xl bg-surface border border-line shadow-2xl flex flex-col gap-4 text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold">
                  <Icon name="file-text" className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink text-base">Record Details Audit</h3>
                  <p className="text-[11px] text-muted font-data">Identifier: {selectedRow.id || selectedRow.empId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="w-7 h-7 rounded-lg bg-surface2 border border-line text-muted hover:text-ink flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface2/30 p-4 rounded-xl border border-line">
              {Object.entries(selectedRow).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-muted uppercase text-[10px] font-semibold tracking-wider">{key}</span>
                  <span className="font-semibold text-ink font-data break-words">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  onTriggerToast && onTriggerToast(`Printed record ${selectedRow.id}`);
                  setSelectedRow(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent flex items-center gap-1.5"
              >
                <Icon name="printer" className="w-3.5 h-3.5 text-muted" />
                <span>Print Record</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="px-4 py-1.5 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:brightness-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
