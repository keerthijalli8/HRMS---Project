import React from 'react';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import { formatCurrency } from '../../utils/format.js';
import { getLopSummary, getMonthlyLopStats, getDepartmentLopSummary, exportLopToCSV, loadLopRecords } from '../../services/lopService.js';

export const LopOverview = ({ 
  currentUser, 
  onNavigateTab, 
  onTriggerToast, 
  selectedMonth = "November 2026",
  onChangeMonth
}) => {
  const summary = getLopSummary(selectedMonth);
  const monthlyStats = getMonthlyLopStats();
  const departmentSummary = getDepartmentLopSummary(selectedMonth);
  const recentRecords = loadLopRecords().slice(0, 4);

  const handleExportAll = () => {
    const all = loadLopRecords();
    const csv = exportLopToCSV(all);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lop_records_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast?.("Exported LOP records to CSV");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface2/60 border border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <Icon name="alert-triangle" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              Loss of Pay (LOP) Overview
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                Manual Policy Active
              </span>
            </h2>
            <p className="text-xs text-muted font-data">
              Strictly HR/Admin managed. Auto-deductions from attendance logs are disabled.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <Select
            size="sm"
            value={selectedMonth}
            onChange={(e) => onChangeMonth?.(e.target.value)}
            className="w-48"
            ariaLabel="Select payroll month"
          >
            <option value="All">All Payroll Months</option>
            <option value="November 2026">November 2026 (Active)</option>
            <option value="October 2026">October 2026</option>
            <option value="September 2026">September 2026</option>
            <option value="December 2026">December 2026</option>
          </Select>

          <SecondaryButton icon="download" onClick={handleExportAll}>
            Export CSV
          </SecondaryButton>

          <PrimaryButton icon="user-plus" onClick={() => onNavigateTab?.("mark")}>
            Mark LOP
          </PrimaryButton>
        </div>
      </div>

      {/* 5 Summary KPI Cards (బాక్సులు తొలగించి క్లీన్ గ్లాస్ లుక్) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total LOP Records */}
        <div className="glass-card !p-4 border border-line flex flex-col justify-between relative overflow-hidden group hover:border-line/80 transition">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Total Records</span>
            <div className="p-1.5 rounded-lg bg-surface2 text-muted">
              <Icon name="file-text" className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-num font-bold text-ink">
              {summary.totalRecords}
            </div>
            <div className="text-[11px] text-muted">
              {selectedMonth === "All" ? "All time records" : `In ${selectedMonth}`}
            </div>
          </div>
          <div className="text-[11px] text-accent font-semibold pt-1 border-t border-line/30">
            {summary.totalRecordsAllTime} total in database
          </div>
        </div>

        {/* Total LOP Days */}
        <div className="glass-card !p-4 border border-line flex flex-col justify-between relative overflow-hidden group hover:border-line/80 transition">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Total LOP Days</span>
            <div className="p-1.5 rounded-lg bg-surface2 text-muted">
              <Icon name="calendar" className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-num font-bold text-ink flex items-baseline gap-1">
              <span>{summary.totalDays}</span>
              <span className="text-sm font-normal text-muted font-body">days</span>
            </div>
            <div className="text-[11px] text-muted">
              Approved working days
            </div>
          </div>
          <div className="text-[11px] text-muted pt-1 border-t border-line/30 font-data">
            Excludes weekly offs & gazetted offs
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => onNavigateTab?.("pending")}
          className="glass-card !p-4 border border-line flex flex-col justify-between relative overflow-hidden group hover:border-accent/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Pending Approvals</span>
            <div className={`p-1.5 rounded-lg ${summary.pendingApprovals > 0 ? "bg-accent2/20 text-accent2 animate-pulse" : "bg-surface2 text-muted"}`}>
              <Icon name="clock" className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className={`text-2xl font-num font-bold ${summary.pendingApprovals > 0 ? "text-accent2" : "text-ink"}`}>
              {summary.pendingApprovals}
            </div>
            <div className="text-[11px] text-muted">
              Awaiting HR Review
            </div>
          </div>
          <div className="text-[11px] text-accent2 font-semibold pt-1 border-t border-line/30 flex items-center gap-1">
            <span>Review pending</span>
            <Icon name="arrow-right" className="w-3 h-3 text-accent2" />
          </div>
        </div>

        {/* Approved Records */}
        <div className="glass-card !p-4 border border-line flex flex-col justify-between relative overflow-hidden group hover:border-line/80 transition">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Approved Records</span>
            <div className="p-1.5 rounded-lg bg-surface2 text-muted">
              <Icon name="check" className="w-4 h-4 text-good" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-num font-bold text-good">
              {summary.approvedRecords}
            </div>
            <div className="text-[11px] text-muted">
              Active for deduction
            </div>
          </div>
          <div className="text-[11px] text-muted pt-1 border-t border-line/30">
            Validated by HRBP / Manager
          </div>
        </div>

        {/* Total LOP Deductions */}
        <div className="glass-card !p-4 border border-line flex flex-col justify-between relative overflow-hidden group hover:border-bad/40 transition">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Total Deductions</span>
            <div className="p-1.5 rounded-lg bg-surface2 text-bad">
              <Icon name="dollar-sign" className="w-4 h-4 text-bad" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-num font-extrabold text-bad">
              {formatCurrency(summary.totalDeductions)}
            </div>
            <div className="text-[11px] text-muted">
              Payroll impact ({selectedMonth})
            </div>
          </div>
          <div className="text-[11px] text-bad/80 font-medium pt-1 border-t border-line/30">
            Reduces net payroll liability
          </div>
        </div>
      </div>

      {/* 2-Column Section: Monthly Statistics & Department Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly LOP Statistics (7 Cols) */}
        <div className="lg:col-span-7 glass-card !p-5 border border-line flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <Icon name="bar-chart-2" className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-ink">Monthly LOP Statistics & Trends</h3>
            </div>
            <span className="text-[11px] text-muted font-data">Q3 / Q4 FY 2026-27</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {monthlyStats.map((stat) => {
              const isCurrent = stat.month === "November 2026";
              return (
                <div 
                  key={stat.month}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isCurrent 
                      ? "bg-accent/10 border-accent/40 shadow-sm" 
                      : "bg-surface2/30 border-line/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{stat.month}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-line/30 text-center">
                    <div>
                      <div className="text-[10px] text-muted uppercase">Records</div>
                      <div className="text-sm font-num font-bold text-ink">{stat.totalRecords}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted uppercase">LOP Days</div>
                      <div className="text-sm font-num font-bold text-ink">{stat.totalDays}d</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted uppercase">Deduction</div>
                      <div className="text-sm font-num font-bold text-bad">{formatCurrency(stat.totalDeduction)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-surface2/40 border border-line text-xs text-muted flex items-center gap-2 mt-1">
            <Icon name="shield" className="w-4 h-4 text-accent shrink-0" />
            <span>
              All approved LOP adjustments are automatically synchronized with the Indian Payroll processing run.
            </span>
          </div>
        </div>

        {/* Department-wise Summary (5 Cols) */}
        <div className="lg:col-span-5 glass-card !p-5 border border-line flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <Icon name="users" className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-ink">Department Breakdown</h3>
            </div>
            <button 
              onClick={() => onNavigateTab?.("reports")}
              className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              Full Report <Icon name="arrow-right" className="w-3 h-3" />
            </button>
          </div>

          {departmentSummary.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              No LOP records recorded for this period.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {departmentSummary.map((dept) => (
                <div 
                  key={dept.department}
                  className="p-3 rounded-xl bg-surface2/40 border border-line/60 flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{dept.department}</span>
                    <span className="text-[11px] text-muted font-data">
                      {dept.employeeCount} {dept.employeeCount === 1 ? 'employee' : 'employees'} ({dept.totalDays} days)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-num font-bold text-bad">
                      {formatCurrency(dept.totalDeduction)}
                    </div>
                    <span className="text-[10px] text-muted">Deduction</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent LOP Submissions / Activity */}
      <div className="glass-card !p-5 border border-line flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-ink">Recent Manual LOP Submissions</h3>
          </div>
          <button 
            onClick={() => onNavigateTab?.("records")}
            className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
          >
            View All Records <Icon name="arrow-right" className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentRecords.map(item => {
            const isApproved = item.status === "Approved" || item.status === "Processed in Payroll";
            const isPending = item.status === "Pending Approval";
            return (
              <div 
                key={item.id}
                className="p-3 rounded-xl bg-surface2/30 border border-line/60 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={item.avatar} 
                      alt={item.employeeName} 
                      className="w-8 h-8 rounded-full border border-line object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-ink line-clamp-1">{item.employeeName}</div>
                      <div className="text-[10.5px] text-accent font-data">{item.employeeId}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    isApproved ? "bg-good/15 text-good border-good/30" :
                    isPending ? "bg-accent2/20 text-accent2 border-accent2/40" :
                    "bg-bad/15 text-bad border-bad/30"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="text-[11px] text-muted space-y-1 font-data">
                  <div className="flex justify-between">
                    <span>Days:</span>
                    <strong className="text-ink font-num">{item.lopDays} {item.lopType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Deduction:</span>
                    <strong className="text-bad font-num">{formatCurrency(item.totalDeduction)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Reason:</span>
                    <span className="text-ink truncate max-w-[120px]">{item.reason}</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted border-t border-line/30 pt-1.5 flex justify-between">
                  <span>{item.id}</span>
                  <span>{item.payrollMonth}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};