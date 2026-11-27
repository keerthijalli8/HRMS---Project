import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import { formatINR } from '../../utils/renderValue.js';
import { exportBonusToCSV, cancelBonus } from '../../services/bonusService.js';

export const BonusHistoryTable = ({
  bonuses = [],
  currentUser,
  onTriggerToast,
  onEditDraft
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBonusForDetails, setSelectedBonusForDetails] = useState(null);

  // Filtered bonuses
  const filteredBonuses = useMemo(() => {
    return bonuses.filter(b => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = (b.name || "").toLowerCase().includes(q);
        const matchType = (b.type || "").toLowerCase().includes(q);
        const matchCycle = (b.payCycle || "").toLowerCase().includes(q);
        if (!matchName && !matchType && !matchCycle) return false;
      }

      if (statusFilter !== "All" && b.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [bonuses, search, statusFilter]);

  // Handle Cancel
  const handleCancel = (bonusId) => {
    if (!window.confirm("Are you sure you want to cancel this bonus allocation?")) return;
    try {
      cancelBonus(bonusId, currentUser);
      onTriggerToast?.("Bonus allocation cancelled successfully.");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in">
      {/* Top Filter & Search Controls */}
      <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-72">
          <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bonus name, type, pay cycle..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-muted">Status:</span>
          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
            ariaLabel="Filter bonuses by status"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card !p-0 border border-line rounded-2xl overflow-hidden shadow-lg flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface2/80 border-b border-line text-muted uppercase text-[10px] font-semibold sticky top-0 backdrop-blur-md">
              <tr>
                <th className="py-3 px-4">Bonus Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Pay Cycle</th>
                <th className="py-3 px-3">Recipients</th>
                <th className="py-3 px-3 text-right">Total Outflow</th>
                <th className="py-3 px-3">Timing</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredBonuses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="gift" className="w-7 h-7 text-muted/50" />
                      <span className="text-sm font-semibold text-ink">No bonus allocations recorded</span>
                      <span className="text-xs text-muted">Create your first employee bonus using the "Bonus" allocation.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBonuses.map(b => {
                  const isPaid = b.status === "Paid";
                  const isApproved = b.status === "Approved";
                  const isDraft = b.status === "Draft";
                  const isCancelled = b.status === "Cancelled";

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBonusForDetails(b)}
                      className="hover:bg-surface2/30 transition-colors cursor-pointer select-none group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-display font-bold text-ink group-hover:text-accent transition-colors">
                          {b.name}
                        </div>
                        <div className="text-[10.5px] text-muted truncate max-w-xs mt-0.5">
                          {b.reason}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface2 border border-line text-ink">
                          {b.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-muted font-num">
                        {b.payCycle}
                      </td>

                      <td className="py-3 px-3 font-num font-bold text-ink">
                        {b.items?.length || 0} staff
                      </td>

                      <td className="py-3 px-3 text-right font-num font-extrabold text-accent">
                        {formatINR(b.totalAmount)}
                      </td>

                      <td className="py-3 px-3 text-muted text-[11px]">
                        {b.paymentTiming === "payroll" ? "Payroll Run" : b.paymentDate || "Separate"}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                          isPaid
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : isApproved
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                            : isCancelled
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPaid ? "bg-emerald-400" : isApproved ? "bg-cyan-400" : isCancelled ? "bg-rose-400" : "bg-amber-400"
                          }`} />
                          {b.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-muted text-[11px]">
                        {b.createdBy?.name || "HR Manager"}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Export CSV */}
                          <button
                            type="button"
                            onClick={() => exportBonusToCSV(b)}
                            title="Export recipient list as CSV"
                            className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                          >
                            <Icon name="download" className="w-3.5 h-3.5 text-inherit" />
                          </button>

                          {/* Edit (if Draft) */}
                          {isDraft && onEditDraft && (
                            <button
                              type="button"
                              onClick={() => onEditDraft(b)}
                              title="Edit draft allocation"
                              className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-accent transition cursor-pointer"
                            >
                              <Icon name="edit" className="w-3.5 h-3.5 text-inherit" />
                            </button>
                          )}

                          {/* Cancel (if Draft or Approved) */}
                          {(isDraft || isApproved) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id)}
                              title="Cancel bonus"
                              className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-bad transition cursor-pointer"
                            >
                              <Icon name="x-circle" className="w-3.5 h-3.5 text-inherit" />
                            </button>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setSelectedBonusForDetails(b)}
                            title="View recipients"
                            className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-ink transition cursor-pointer"
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

      {/* Recipient Slide-over / Modal Detail View */}
      {selectedBonusForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full max-h-[90vh] !p-6 border border-line rounded-2xl flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold text-[10px] uppercase">
                    {selectedBonusForDetails.type}
                  </span>
                  <h3 className="font-display font-extrabold text-base text-ink">
                    {selectedBonusForDetails.name}
                  </h3>
                </div>
                <p className="text-xs text-muted mt-1">
                  {selectedBonusForDetails.reason} &bull; Cycle: <strong className="text-ink">{selectedBonusForDetails.payCycle}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBonusForDetails(null)}
                className="p-1.5 rounded-xl bg-surface2 hover:bg-surface2/80 text-muted hover:text-ink cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[10.5px]">Total Outflow</span>
                <span className="font-num font-extrabold text-base text-accent">
                  {formatINR(selectedBonusForDetails.totalAmount)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[10.5px]">Total Deducted TDS</span>
                <span className="font-num font-extrabold text-base text-bad">
                  {formatINR(selectedBonusForDetails.totalTds)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[10.5px]">Net Disbursed</span>
                <span className="font-num font-extrabold text-base text-good">
                  {formatINR(selectedBonusForDetails.totalNet)}
                </span>
              </div>
            </div>

            {/* Recipient Table */}
            <div className="overflow-y-auto flex-1 rounded-xl border border-line bg-surface2/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface2/80 border-b border-line text-muted uppercase text-[10px] sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Gross Bonus</th>
                    <th className="py-2.5 px-3 text-right">TDS (10%)</th>
                    <th className="py-2.5 px-3 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {(selectedBonusForDetails.items || []).map(item => (
                    <tr key={item.employeeId} className="hover:bg-surface2/30">
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        {item.employeeName}
                      </td>
                      <td className="py-2.5 px-3 font-num font-bold text-accent">
                        {item.employeeId}
                      </td>
                      <td className="py-2.5 px-3 text-muted">
                        {item.department}
                      </td>
                      <td className="py-2.5 px-3 text-right font-num font-bold text-ink">
                        {formatINR(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-num text-bad">
                        -{formatINR(item.tds)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-num font-extrabold text-good">
                        {formatINR(item.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => exportBonusToCSV(selectedBonusForDetails)}
                className="px-3.5 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer"
              >
                <Icon name="download" className="w-3.5 h-3.5 text-accent" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBonusForDetails(null)}
                className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold cursor-pointer hover:opacity-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusHistoryTable;
