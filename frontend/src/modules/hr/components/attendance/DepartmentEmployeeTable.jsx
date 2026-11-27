import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon.jsx';
import { formatNumber } from '../../utils/format.js';
import { formatHoursWorked } from '../../services/attendanceLog.js';

export const DepartmentEmployeeTable = ({
  employees = [],
  totalFiltered = 0,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  selectedEmployeeIds = [],
  onSelectEmployee,
  onSelectAll,
  onRowClick,
  onEditRecord,
  canEdit = false
}) => {
  // Live ticker for currently working employees
  const [liveNow, setLiveNow] = useState(() => Date.now());

  useEffect(() => {
    const hasWorking = employees.some(e => e.isWorking);
    if (!hasWorking) return;

    const timer = setInterval(() => {
      setLiveNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [employees]);

  // Status badge styling helper
  const getStatusBadge = (status, isLate, isEarlyOut) => {
    const s = (status || "").toLowerCase();
    if (s === "present") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Present
        </span>
      );
    }
    if (s === "wfh") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          WFH
        </span>
      );
    }
    if (s === "absent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Absent
        </span>
      );
    }
    if (s === "on leave") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          On Leave
        </span>
      );
    }
    if (s === "early out" || isEarlyOut) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          Early Out
        </span>
      );
    }
    if (s === "not checked in") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface2/60 text-muted border border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-muted/60" />
          Not Checked In
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface2/60 text-muted border border-line">
        {status}
      </span>
    );
  };

  const isAllSelected = employees.length > 0 && employees.every(e => selectedEmployeeIds.includes(e.employeeId));

  return (
    <div className="glass-card !p-0 border border-line rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[460px] overflow-y-auto relative no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur-md z-20 border-b border-line text-muted uppercase tracking-wider text-[10px] font-semibold shadow-sm">
              <tr>
                {canEdit && (
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={onSelectAll}
                      aria-label="Select all employees"
                      className="rounded border-line bg-surface2 text-accent focus:ring-accent cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Check In</th>
                <th className="py-3 px-3">Check Out</th>
                <th className="py-3 px-3">Total Hours</th>
                <th className="py-3 px-3">Break</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="users" className="w-7 h-7 text-muted/60" />
                      <span className="text-xs font-semibold text-ink">No employees found in this department</span>
                      <span className="text-[11px] text-muted">Try adjusting your filters or search terms.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map(row => {
                  const isSelected = selectedEmployeeIds.includes(row.employeeId);

                  // Calculate live working hours if currently working
                  let displayTotalHours = row.totalHours;
                  if (row.isWorking && row.rawRecord?.sessions) {
                    const firstSess = row.rawRecord.sessions[0];
                    if (firstSess?.in) {
                      const inT = new Date(firstSess.in).getTime();
                      const gross = Math.max(0, liveNow - inT);
                      const net = Math.max(0, gross - (row.breakMs || 0));
                      displayTotalHours = formatHoursWorked(net);
                    }
                  }

                  const initials = row.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={row.employeeId}
                      tabIndex={0}
                      role="row"
                      aria-label={`Attendance row for ${row.name}`}
                      onClick={() => onRowClick?.(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick?.(row);
                        }
                      }}
                      className={`hover:bg-accent/5 transition-colors cursor-pointer group select-none ${
                        isSelected ? "bg-accent/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      {canEdit && (
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee?.(row.employeeId);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectEmployee?.(row.employeeId)}
                            aria-label={`Select ${row.name}`}
                            className="rounded border-line bg-surface2 text-accent focus:ring-accent cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-bold text-ink truncate group-hover:text-accent transition-colors flex items-center gap-1.5">
                              <span>{row.name}</span>
                              {row.isEdited && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-semibold" title="Manually edited">
                                  Edited
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              <span className="font-num font-medium">{row.employeeId}</span> &bull; {row.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-num font-semibold text-ink">
                          <span>{row.checkIn}</span>
                          {row.isLate && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold" title={`Late by ${row.lateMinutes} mins`}>
                              Late
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check Out */}
                      <td className="py-3 px-3">
                        {row.isWorking ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Working
                          </span>
                        ) : (
                          <span className="font-num font-semibold text-ink">{row.checkOut}</span>
                        )}
                      </td>

                      {/* Total Hours */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-num font-bold text-ink">
                          <span>{displayTotalHours}</span>
                          {row.isWorking && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Running timer" />
                          )}
                        </div>
                      </td>

                      {/* Break */}
                      <td className="py-3 px-3 font-num text-muted">
                        {row.breakDuration}
                      </td>

                      {/* Mode */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          row.mode === "WFH"
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                            : "bg-surface2/60 border-line text-muted"
                        }`}>
                          {row.mode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(row.status, row.isLate, row.isEarlyOut)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEditRecord?.(row)}
                              title="Edit attendance with audit log"
                              className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                            >
                              <Icon name="edit" className="w-3.5 h-3.5 text-inherit" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRowClick?.(row)}
                            title="View punch logs and calendar"
                            className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                          >
                            <Icon name="arrow-right" className="w-3.5 h-3.5 text-inherit" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MOBILE CARDS VIEW ================= */}
      <div className="md:hidden flex flex-col divide-y divide-line/40 max-h-[460px] overflow-y-auto">
        {employees.length === 0 ? (
          <div className="py-8 text-center text-muted text-xs">
            No employees found in this department.
          </div>
        ) : (
          employees.map(row => {
            const isSelected = selectedEmployeeIds.includes(row.employeeId);
            return (
              <div
                key={row.employeeId}
                onClick={() => onRowClick?.(row)}
                className={`p-3 flex flex-col gap-2.5 transition-colors cursor-pointer ${
                  isSelected ? "bg-accent/10" : "hover:bg-surface2/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectEmployee?.(row.employeeId)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-line bg-surface2 text-accent focus:ring-accent cursor-pointer"
                      />
                    )}
                    <div>
                      <div className="font-display font-bold text-xs text-ink">{row.name}</div>
                      <div className="text-[10px] text-muted font-num">{row.employeeId} &bull; {row.role}</div>
                    </div>
                  </div>
                  {getStatusBadge(row.status, row.isLate, row.isEarlyOut)}
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-surface2/30 text-[11px] font-num">
                  <div>
                    <span className="text-[10px] text-muted block">Check In</span>
                    <span className="font-bold text-ink">{row.checkIn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Check Out</span>
                    <span className="font-bold text-ink">{row.isWorking ? "Working" : row.checkOut}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Hours</span>
                    <span className="font-bold text-emerald-400">{row.totalHours}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] text-muted">{row.mode} Mode &bull; Break: {row.breakDuration}</span>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onEditRecord?.(row)}
                        className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRowClick?.(row)}
                      className="text-xs font-semibold text-muted hover:text-ink cursor-pointer"
                    >
                      Punches &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= PAGINATION BAR ================= */}
      <div className="p-3 bg-surface2/40 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="text-muted">
          Showing <span className="font-num font-bold text-ink">{employees.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{" "}
          <span className="font-num font-bold text-ink">{Math.min(page * pageSize, totalFiltered)}</span> of{" "}
          <span className="font-num font-bold text-ink">{formatNumber(totalFiltered)}</span> employees
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded-xl bg-surface2/60 border border-line text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
