import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import { formatCurrency } from '../../utils/format.js';
import { getLopRecords, exportLopToCSV, cancelLopRecord } from '../../services/lopService.js';
import { LopDetailModal } from './LopDetailModal.jsx';

export const LopRecordsTable = ({ currentUser, onTriggerToast }) => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [payrollMonth, setPayrollMonth] = useState("All");
  const [lopType, setLopType] = useState("All");

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Query records
  const records = useMemo(() => {
    return getLopRecords({
      search,
      department,
      status,
      payrollMonth,
      lopType
    });
  }, [search, department, status, payrollMonth, lopType]);

  // Pagination calculation
  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return records.slice(start, start + itemsPerPage);
  }, [records, currentPage]);

  const handleExportCSV = () => {
    const csv = exportLopToCSV(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lop_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast?.(`Exported ${records.length} LOP records to CSV`);
  };

  const handleCancel = (record) => {
    if (confirm(`Are you sure you want to cancel LOP request ${record.id} for ${record.employeeName}?`)) {
      const res = cancelLopRecord(record.id, currentUser);
      if (res.ok) {
        onTriggerToast?.(`Cancelled LOP ${record.id}`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Employee, ID, Reason, or LOP ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface/60 border border-line/80 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <Select
            size="sm"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="w-36"
            ariaLabel="Filter by department"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
          </Select>

          {/* Status Filter */}
          <Select
            size="sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-36"
            ariaLabel="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Processed in Payroll">Processed in Payroll</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </Select>

          {/* Payroll Month Filter */}
          <Select
            size="sm"
            value={payrollMonth}
            onChange={(e) => {
              setPayrollMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="w-36"
            ariaLabel="Filter by payroll month"
          >
            <option value="All">All Months</option>
            <option value="November 2026">November 2026</option>
            <option value="October 2026">October 2026</option>
            <option value="December 2026">December 2026</option>
          </Select>

          {/* Export CSV Button */}
          <SecondaryButton icon="download" onClick={handleExportCSV}>
            Export CSV
          </SecondaryButton>
        </div>
      </div>

      {/* Records Table (బాక్సులు తొలగించి క్లీన్ లుక్) */}
      <div className="glass-card !p-0 border border-line overflow-hidden bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line/60 bg-surface2/40 text-muted font-bold tracking-wider uppercase text-[10.5px]">
                <th className="py-3 px-3.5">LOP ID</th>
                <th className="py-3 px-3.5">Employee</th>
                <th className="py-3 px-3.5">Department</th>
                <th className="py-3 px-3.5">Dates & Type</th>
                <th className="py-3 px-3.5 text-center">Days</th>
                <th className="py-3 px-3.5 text-right">Deduction (INR)</th>
                <th className="py-3 px-3.5">Reason</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/30 font-data">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    <Icon name="alert-triangle" className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                    No Loss of Pay records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isApproved = r.status === "Approved" || r.status === "Processed in Payroll";
                  const isPending = r.status === "Pending Approval";
                  const isRejected = r.status === "Rejected";

                  return (
                    <tr 
                      key={r.id} 
                      className="hover:bg-surface2/30 transition cursor-pointer"
                      onClick={() => setSelectedRecordForDetail(r)}
                    >
                      {/* LOP ID */}
                      <td className="py-3 px-3.5 font-bold text-accent whitespace-nowrap">
                        {r.id}
                      </td>

                      {/* Employee (ప్రొఫెషనల్ లుక్ కోసం పిక్చర్స్ తొలగించబడ్డాయి) */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-bold text-ink block line-clamp-1">{r.employeeName}</span>
                          <span className="text-[10px] text-muted font-mono">{r.employeeId}</span>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-ink block">{r.department}</span>
                        <span className="text-[10.5px] text-muted">{r.designation}</span>
                      </td>

                      {/* Dates & Type */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-medium text-ink block">
                          {r.fromDate} {r.fromDate !== r.toDate ? `→ ${r.toDate}` : ''}
                        </span>
                        <span className="text-[10.5px] text-muted">{r.lopType}</span>
                      </td>

                      {/* Days */}
                      <td className="py-3 px-3.5 text-center font-num font-bold text-ink whitespace-nowrap">
                        {r.lopDays}d
                      </td>

                      {/* Deduction */}
                      <td className="py-3 px-3.5 text-right font-num font-bold text-bad whitespace-nowrap">
                        {formatCurrency(r.totalDeduction)}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-3.5 max-w-[150px] truncate" title={r.reason}>
                        <span className="text-ink">{r.reason}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                          isApproved ? "bg-good/15 text-good border-good/30" :
                          isPending ? "bg-accent2/20 text-accent2 border-accent2/40 animate-pulse" :
                          isRejected ? "bg-bad/15 text-bad border-bad/30" :
                          "bg-surface2 text-muted border-line"
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForDetail(r)}
                            title="View Full Details"
                            className="p-1 rounded-lg bg-surface2/60 border border-line text-muted hover:text-ink hover:border-accent transition cursor-pointer"
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                          </button>
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleCancel(r)}
                              title="Cancel Request"
                              className="p-1 rounded-lg bg-bad/15 border border-bad/30 text-bad hover:bg-bad/20 transition cursor-pointer"
                            >
                              <Icon name="x" className="w-3.5 h-3.5" />
                            </button>
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

        {/* Pagination Footer */}
        <div className="p-3 border-t border-line/60 bg-surface2/30 flex items-center justify-between text-xs text-muted">
          <span>
            Showing <strong className="text-ink">{records.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to <strong className="text-ink">{Math.min(currentPage * itemsPerPage, records.length)}</strong> of <strong className="text-ink">{records.length}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-surface border border-line text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:border-accent transition"
            >
              <Icon name="arrow-left" className="w-3.5 h-3.5" />
            </button>
            <span className="font-num font-semibold text-ink px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-surface border border-line text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:border-accent transition"
            >
              <Icon name="arrow-right" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Record Details */}
      {selectedRecordForDetail && (
        <LopDetailModal
          record={selectedRecordForDetail}
          onClose={() => setSelectedRecordForDetail(null)}
        />
      )}
    </div>
  );
};