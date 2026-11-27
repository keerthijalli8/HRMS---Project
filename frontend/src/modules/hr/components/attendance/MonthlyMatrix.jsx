import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { Avatar } from '../Avatar.jsx';
import { Select } from '../Select.jsx';
import { getMonthlyMatrix } from '../../services/attendanceService.js';

export const MonthlyMatrix = ({ viewer, departmentFilter = null }) => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(11);

  const matrixData = getMonthlyMatrix({ year, month, viewer });
  const { daysInMonth, matrixRows: rawRows } = matrixData;

  const matrixRows = departmentFilter
    ? rawRows.filter(r => (r.dept || "").toLowerCase() === departmentFilter.toLowerCase())
    : rawRows;

  const handleExportCsv = () => {
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
    const headers = ["Employee ID", "Name", "Department", ...dayHeaders, "Present", "WFH", "Absent", "Attendance %"];

    const rows = matrixRows.map(r => [
      `"${r.employeeId}"`,
      `"${r.name}"`,
      `"${r.dept}"`,
      ...r.days.map(d => `"${d.code}"`),
      r.pCount,
      r.wfhCount,
      r.aCount,
      `"${r.attendancePct}%"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `monthly-attendance-matrix-${year}-${String(month).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Month picker and Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface2/40 p-3 rounded-2xl border border-line">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted font-semibold uppercase tracking-wider">
            Attendance Month:
          </label>
          <Select
            size="sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-44"
            ariaLabel="Attendance Month"
          >
            {[
              { m: 1, name: "January" }, { m: 2, name: "February" }, { m: 3, name: "March" },
              { m: 4, name: "April" }, { m: 5, name: "May" }, { m: 6, name: "June" },
              { m: 7, name: "July" }, { m: 8, name: "August" }, { m: 9, name: "September" },
              { m: 10, name: "October" }, { m: 11, name: "November" }, { m: 12, name: "December" }
            ].map(item => (
              <option key={item.m} value={item.m}>
                {item.name} {year}
              </option>
            ))}
          </Select>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="flex items-center gap-1"><strong className="text-good font-bold font-num">P</strong> Present</span>
          <span className="flex items-center gap-1"><strong className="text-accent font-bold font-num">WFH</strong> Remote</span>
          <span className="flex items-center gap-1"><strong className="text-bad font-bold font-num">A</strong> Absent</span>
          <span className="flex items-center gap-1"><strong className="text-purple-400 font-bold font-num">L</strong> Leave</span>
          <span className="flex items-center gap-1"><strong className="text-muted font-bold font-num">H</strong> Holiday</span>
          <span className="flex items-center gap-1"><strong className="text-muted/60 font-bold font-num">W</strong> Weekend</span>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer"
        >
          <Icon name="download" className="w-3.5 h-3.5 text-accent" />
          <span>Export Matrix</span>
        </button>
      </div>

      {/* Matrix Grid Container with Sticky Left Column */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/30 max-h-[550px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-[#061720] z-20 border-b border-line shadow-sm">
            <tr className="text-muted uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-2.5 px-3 pl-4 sticky left-0 bg-[#061720] z-30 min-w-[200px] border-r border-line shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                Employee
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i + 1} className="py-2.5 px-1.5 text-center min-w-[28px] font-num">
                  {i + 1}
                </th>
              ))}
              <th className="py-2.5 px-2 text-center text-good">P</th>
              <th className="py-2.5 px-2 text-center text-accent">WFH</th>
              <th className="py-2.5 px-2 text-center text-bad">A</th>
              <th className="py-2.5 px-3 text-right pr-4">Att %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/30 font-medium">
            {matrixRows.map(row => (
              <tr key={row.employeeId} className="hover:bg-surface2/30 transition">
                {/* Sticky Employee Name Column */}
                <td className="py-2.5 px-3 pl-4 sticky left-0 bg-[#061720] z-10 border-r border-line shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2">
                    <Avatar name={row.name} employeeId={row.employeeId} size="xs" photoUrl={row.avatarUrl} />
                    <div className="truncate max-w-[140px]">
                      <div className="font-semibold text-ink text-xs truncate">{row.name}</div>
                      <div className="text-[10px] text-muted truncate">{row.dept}</div>
                    </div>
                  </div>
                </td>

                {/* Day status codes */}
                {row.days.map(d => {
                  let badge = "text-muted/40";
                  if (d.code === "P") badge = "text-good font-bold bg-good/10 rounded";
                  else if (d.code === "WFH") badge = "text-accent font-bold bg-accent/10 rounded";
                  else if (d.code === "A") badge = "text-bad font-bold bg-bad/10 rounded";
                  else if (d.code === "L") badge = "text-purple-400 font-bold bg-purple-500/10 rounded";
                  else if (d.code === "H") badge = "text-muted bg-surface2/60 rounded";
                  else if (d.code === "W") badge = "text-muted/40";

                  return (
                    <td
                      key={d.day}
                      className="py-2 px-1 text-center font-num text-[11px]"
                      title={`${row.name} · ${d.dateKey}: ${d.label}`}
                    >
                      <span className={`inline-block w-6 py-0.5 ${badge}`}>
                        {d.code}
                      </span>
                    </td>
                  );
                })}

                {/* Summary numbers */}
                <td className="py-2 px-2 text-center text-good font-bold font-num">{row.pCount}</td>
                <td className="py-2 px-2 text-center text-accent font-bold font-num">{row.wfhCount}</td>
                <td className="py-2 px-2 text-center text-bad font-bold font-num">{row.aCount}</td>
                <td className="py-2 px-3 text-right pr-4 font-bold text-ink font-num">{row.attendancePct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
