import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import { formatCurrency } from '../../utils/format.js';
import { loadLopRecords, exportLopToCSV } from '../../services/lopService.js';
import { LopDetailModal } from './LopDetailModal.jsx';

export const LopHistoryTable = ({ onTriggerToast }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const allRecords = useMemo(() => {
    return loadLopRecords();
  }, []);

  const historyRecords = useMemo(() => {
    return allRecords.filter(r => {
      // History includes resolved states or all records
      if (filterStatus !== "All" && r.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = (r.employeeName || "").toLowerCase().includes(q);
        const matchId = (r.employeeId || "").toLowerCase().includes(q);
        const matchLop = (r.id || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchLop) return false;
      }
      return true;
    });
  }, [allRecords, search, filterStatus]);

  const handleExportCSV = () => {
    const csv = exportLopToCSV(historyRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lop_history_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast?.("Exported LOP history log to CSV");
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Top Header & Search */}
      <div className="p-4 rounded-xl bg-surface2/60 border border-line flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface2 text-muted flex items-center justify-center border border-line">
            <Icon name="clock" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">LOP Audit Log & History</h3>
            <p className="text-xs text-muted font-data">
              Complete historical trail of manual LOP entries, approvals, rejections and payroll adjustments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <Select
            size="sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-48"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Processed in Payroll">Processed in Payroll</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Cancelled">Cancelled</option>
          </Select>

          <SecondaryButton icon="download" onClick={handleExportCSV}>
            Export Audit
          </SecondaryButton>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card !p-0 border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface2/60 text-muted font-bold tracking-wide">
                <th className="py-3 px-3.5">Record ID</th>
                <th className="py-3 px-3.5">Employee</th>
                <th className="py-3 px-3.5">Period & Month</th>
                <th className="py-3 px-3.5">Days / Deduction</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Audit Trail (Created / Reviewed)</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-data">
              {historyRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted">
                    No historical LOP records found.
                  </td>
                </tr>
              ) : (
                historyRecords.map(r => {
                  const isApproved = r.status === "Approved" || r.status === "Processed in Payroll";
                  const isPending = r.status === "Pending Approval";
                  const isRejected = r.status === "Rejected";

                  return (
                    <tr 
                      key={r.id}
                      className="hover:bg-surface2/40 transition cursor-pointer"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <td className="py-3 px-3.5 font-bold text-accent whitespace-nowrap">
                        {r.id}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={r.employeeName}
                            className="w-7 h-7 rounded-full border border-line object-cover"
                          />
                          <div>
                            <span className="font-bold text-ink block">{r.employeeName}</span>
                            <span className="text-[10px] text-muted">{r.employeeId} · {r.department}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-ink font-medium block">{r.fromDate} → {r.toDate}</span>
                        <span className="text-[10.5px] text-accent font-semibold">{r.payrollMonth}</span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-num font-bold text-ink block">{r.lopDays}d ({r.lopType})</span>
                        <span className="font-num font-bold text-bad text-[11px]">{formatCurrency(r.totalDeduction)}</span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                          isApproved ? "bg-good/15 text-good border-good/30" :
                          isPending ? "bg-accent2/20 text-accent2 border-accent2/40" :
                          isRejected ? "bg-bad/15 text-bad border-bad/30" :
                          "bg-surface2 text-muted border-line"
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 max-w-[280px]">
                        <div className="text-[11px] text-muted line-clamp-1">
                          Created by: <strong className="text-ink">{r.createdBy}</strong>
                        </div>
                        {r.approvedBy && (
                          <div className="text-[10.5px] text-good line-clamp-1">
                            Approved by: {r.approvedBy}
                          </div>
                        )}
                        {r.rejectedBy && (
                          <div className="text-[10.5px] text-bad line-clamp-1">
                            Rejected: "{r.rejectionReason}" ({r.rejectedBy})
                          </div>
                        )}
                        {r.processedAt && (
                          <div className="text-[10px] text-accent line-clamp-1">
                            Processed in Payroll Run
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="p-1 rounded-lg bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition cursor-pointer"
                        >
                          <Icon name="eye" className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <LopDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};
