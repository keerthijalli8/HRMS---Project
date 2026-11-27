import React from 'react';
import { Icon } from '../Icon.jsx';
import { ExperienceBadge } from './ExperienceBadge.jsx';
import { formatDate, formatNumber } from '../../utils/format.js';
import { renderValue } from '../../utils/renderValue.js';

export const EmployeeTable = ({
  employees = [],
  totalFiltered = 0,
  page = 1,
  pageSize = 12,
  totalPages = 1,
  onPageChange,
  selectedIds = [],
  onSelectEmployee,
  onViewActivity,
  onSelectAll,
  onViewProfile,
  onEditEmployee,
  onDeactivateEmployee,
  canEdit = false
}) => {
  const isAllSelected = employees.length > 0 && employees.every(e => selectedIds.includes(e.id));

  return (
    <div className="glass-card !p-0 border border-line rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[480px] overflow-y-auto relative no-scrollbar">
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
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Experience</th>
                <th className="py-3 px-3">Joining Date</th>
                <th className="py-3 px-3">Reporting TL</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Work Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 11 : 10} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="users" className="w-7 h-7 text-muted/60" />
                      <span className="text-xs font-semibold text-ink">No employees match the filters</span>
                      <span className="text-[11px] text-muted">Try resetting search or filter options.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map(emp => {
                  const isSelected = selectedIds.includes(emp.id);
                  const initials = emp.name
                    ? emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : "EM";

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => onViewProfile?.(emp.id)}
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
                            onSelectEmployee?.(emp.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectEmployee?.(emp.id)}
                            aria-label={`Select ${emp.name}`}
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
                              <span>{renderValue(emp.name)}</span>
                              {(emp.role === "MAIN_TL" || emp.role === "TL") && (
                                <span className="text-[9px] px-1.5 rounded-full bg-accent/20 text-accent font-bold uppercase">
                                  {emp.role === "MAIN_TL" ? "Main TL" : "TL"}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              {renderValue(emp.email)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 font-num font-bold text-ink">
                        {renderValue(emp.id)}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-3 text-muted">
                        {renderValue(emp.designation?.title || emp.designation?.name || emp.designation)}
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-3">
                        <ExperienceBadge
                          totalYears={emp.totalExperienceYears}
                          previousCompanies={emp.previousCompanies}
                        />
                      </td>

                      {/* Joining Date */}
                      <td className="py-3 px-3 font-num text-muted">
                        {formatDate(emp.joiningDate)}
                      </td>

                      {/* Reporting TL */}
                      <td className="py-3 px-3 text-accent font-medium">
                        {renderValue(emp.mgr?.name || emp.mgr || "Aarav Sharma")}
                      </td>

                      {/* Employment Type */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-muted bg-surface2/60 px-2 py-0.5 rounded-full border border-line">
                          {renderValue(emp.employmentType || "Full-Time")}
                        </span>
                      </td>

                      {/* Work Mode */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          emp.workMode === "WFH"
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                            : emp.workMode === "Hybrid"
                            ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                            : "bg-surface2/60 border-line text-muted"
                        }`}>
                          {renderValue(emp.workMode || "Office")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          emp.status === "Active"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : emp.status === "On Leave"
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === "Active" ? "bg-emerald-400" : emp.status === "On Leave" ? "bg-amber-400" : "bg-rose-400"
                          }`} />
                          {renderValue(emp.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => (onViewProfile || onSelectEmployee)?.(emp.id)}
                            title="View full profile"
                            className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                          >
                            <Icon name="arrow-right" className="w-3.5 h-3.5 text-inherit" />
                          </button>

                          <button
                            type="button"
                            onClick={() => (onViewActivity ? onViewActivity(emp.id) : (onSelectEmployee || onViewProfile)?.(emp.id, "activity"))}
                            title="View Activity Log"
                            className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                          >
                            <Icon name="clock" className="w-3.5 h-3.5 text-inherit" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditEmployee?.(emp)}
                                title="Edit employee details"
                                className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                              >
                                <Icon name="edit" className="w-3.5 h-3.5 text-inherit" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeactivateEmployee?.(emp.id)}
                                title="Deactivate employee"
                                className="p-1 rounded-lg hover:bg-surface2 text-muted hover:text-rose-400 transition cursor-pointer"
                              >
                                <Icon name="trash-2" className="w-3.5 h-3.5 text-inherit" />
                              </button>
                            </>
                          )}
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

      {/* Mobile Card Layout */}
      <div className="md:hidden flex flex-col divide-y divide-line/40 max-h-[480px] overflow-y-auto">
        {employees.length === 0 ? (
          <div className="py-8 text-center text-muted text-xs">
            No employees found.
          </div>
        ) : (
          employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => onViewProfile?.(emp.id)}
              className="p-3 flex flex-col gap-2 hover:bg-surface2/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-xs text-ink">{emp.name}</div>
                  <div className="text-[10px] text-muted font-num">{emp.id} &bull; {emp.designation}</div>
                </div>
                <ExperienceBadge
                  totalYears={emp.totalExperienceYears}
                  previousCompanies={emp.previousCompanies}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span>TL: {emp.mgr || "Aarav Sharma"}</span>
                <span className="text-accent font-semibold">View Profile &rarr;</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
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

export default EmployeeTable;
