import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import { formatCurrency } from '../../utils/format.js';
import { getDepartmentLopSummary, loadLopRecords } from '../../services/lopService.js';

export const LopReports = ({ onTriggerToast }) => {
  const [selectedMonth, setSelectedMonth] = useState("November 2026");

  const deptSummaries = useMemo(() => {
    return getDepartmentLopSummary(selectedMonth);
  }, [selectedMonth]);

  const allRecords = useMemo(() => {
    return loadLopRecords();
  }, []);

  // Filter records by month
  const activeRecords = useMemo(() => {
    return selectedMonth === "All"
      ? allRecords
      : allRecords.filter(r => r.payrollMonth === selectedMonth);
  }, [allRecords, selectedMonth]);

  // Employee-wise rollup
  const employeeSummaries = useMemo(() => {
    const map = new Map();
    activeRecords.forEach(r => {
      const id = r.employeeId;
      if (!map.has(id)) {
        map.set(id, {
          employeeId: id,
          employeeName: r.employeeName,
          department: r.department,
          designation: r.designation,
          avatar: r.avatar,
          totalDays: 0,
          totalDeduction: 0,
          recordCount: 0
        });
      }
      const item = map.get(id);
      item.recordCount++;
      if (r.status === "Approved" || r.status === "Processed in Payroll") {
        item.totalDays += Number(r.lopDays) || 0;
        item.totalDeduction += Number(r.totalDeduction) || 0;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalDeduction - a.totalDeduction);
  }, [activeRecords]);

  // Export report as CSV
  const handleExportReportCSV = () => {
    const headers = ["Department", "Affected Employees", "Total Records", "Total LOP Days", "Total Deductions (INR)"];
    const rows = deptSummaries.map(d => [
      `"${d.department}"`,
      d.employeeCount,
      d.recordCount,
      d.totalDays,
      d.totalDeduction
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lop_department_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast?.("Exported LOP Department Report to CSV");
  };

  const totalDeductionsAll = deptSummaries.reduce((a, b) => a + b.totalDeduction, 0);
  const totalDaysAll = deptSummaries.reduce((a, b) => a + b.totalDays, 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Report Controls Bar */}
      <div className="p-4 rounded-xl bg-surface2/60 border border-line flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <Icon name="bar-chart-2" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Loss of Pay Analytics & Financial Impact</h3>
            <p className="text-xs text-muted font-data">
              Department-wise and employee-wise salary deduction summaries for audit and accounting reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Select
            size="sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          >
            <option value="All">All Pay Cycles</option>
            <option value="November 2026">November 2026</option>
            <option value="October 2026">October 2026</option>
            <option value="September 2026">September 2026</option>
            <option value="December 2026">December 2026</option>
          </Select>

          <SecondaryButton icon="download" onClick={handleExportReportCSV}>
            Export Report CSV
          </SecondaryButton>
        </div>
      </div>

      {/* Report High-Level Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card !p-4 border border-line">
          <span className="text-xs text-muted font-medium">Departments Impacted</span>
          <div className="text-2xl font-num font-bold text-ink mt-1">
            {deptSummaries.length}
          </div>
          <span className="text-[11px] text-muted font-data">With recorded LOP requests</span>
        </div>

        <div className="glass-card !p-4 border border-line">
          <span className="text-xs text-muted font-medium">Total LOP Working Days</span>
          <div className="text-2xl font-num font-bold text-ink mt-1">
            {Number(totalDaysAll.toFixed(1))} Days
          </div>
          <span className="text-[11px] text-muted font-data">Approved unpaid absences</span>
        </div>

        <div className="glass-card !p-4 border border-line">
          <span className="text-xs text-muted font-medium">Total Net Payroll Deductions</span>
          <div className="text-2xl font-num font-extrabold text-bad mt-1">
            {formatCurrency(totalDeductionsAll)}
          </div>
          <span className="text-[11px] text-bad/80 font-data">Financial savings on payroll cost</span>
        </div>
      </div>

      {/* Department-wise Table */}
      <div className="glass-card !p-5 border border-line flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <Icon name="users" className="w-4 h-4 text-accent" />
            Department-Wise LOP Summary
          </h4>
          <span className="text-[11px] text-muted font-data">Period: {selectedMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface2/60 text-muted font-bold tracking-wide">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Affected Employees</th>
                <th className="py-2.5 px-3 text-center">Total Records</th>
                <th className="py-2.5 px-3 text-center">Total LOP Days</th>
                <th className="py-2.5 px-3 text-right">Total Financial Deduction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-data">
              {deptSummaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No department LOP records found for this period.
                  </td>
                </tr>
              ) : (
                deptSummaries.map(d => (
                  <tr key={d.department} className="hover:bg-surface2/40 transition">
                    <td className="py-3 px-3 font-bold text-ink">
                      {d.department}
                    </td>
                    <td className="py-3 px-3 text-center font-num text-ink">
                      {d.employeeCount}
                    </td>
                    <td className="py-3 px-3 text-center font-num text-muted">
                      {d.recordCount}
                    </td>
                    <td className="py-3 px-3 text-center font-num font-bold text-ink">
                      {d.totalDays}d
                    </td>
                    <td className="py-3 px-3 text-right font-num font-bold text-bad">
                      {formatCurrency(d.totalDeduction)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee-wise Top Impact Table */}
      <div className="glass-card !p-5 border border-line flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <Icon name="user-check" className="w-4 h-4 text-accent" />
            Employee-Wise LOP Breakdown
          </h4>
          <span className="text-[11px] text-muted font-data">{employeeSummaries.length} Employees affected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface2/60 text-muted font-bold tracking-wide">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Department & Designation</th>
                <th className="py-2.5 px-3 text-center">Approved Days</th>
                <th className="py-2.5 px-3 text-right">Deduction (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-data">
              {employeeSummaries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    No employee LOP records found for this period.
                  </td>
                </tr>
              ) : (
                employeeSummaries.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-surface2/40 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={emp.employeeName}
                          className="w-7 h-7 rounded-full border border-line object-cover"
                        />
                        <div>
                          <span className="font-bold text-ink block">{emp.employeeName}</span>
                          <span className="text-[10px] text-accent font-data">{emp.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-ink block">{emp.department}</span>
                      <span className="text-[10.5px] text-muted">{emp.designation}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-num font-bold text-ink">
                      {emp.totalDays}d
                    </td>
                    <td className="py-3 px-3 text-right font-num font-bold text-bad">
                      {formatCurrency(emp.totalDeduction)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
