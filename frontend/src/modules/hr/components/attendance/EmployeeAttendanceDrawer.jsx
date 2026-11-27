import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { Avatar } from '../Avatar.jsx';
import { formatDate } from '../../utils/format.js';

export const EmployeeAttendanceDrawer = ({
  employee,
  isOpen,
  onClose,
  attendanceHistoryMap = {} // Employee ID mapping to historical records or monthly data
}) => {
  const [selectedMonth, setSelectedMonth] = useState("2026-11"); // Default current month

  if (!isOpen || !employee) return null;

  // గత రెండు నెలలతో సహా అందుబాటులో ఉన్న నెలల జాబితా (HR కోసం హిస్టారికల్ వ్యూ)
  const availableMonths = [
    { label: "November 2026 (Current)", value: "2026-11" },
    { label: "October 2026", value: "2026-10" },
    { label: "September 2026 (2 Months Ago)", value: "2026-09" }
  ];

  // Simulated historical logs for demonstration based on selected month
  // Real implementation can query attendanceHistoryMap[employee.id][selectedMonth]
  const monthlyLogs = useMemo(() => {
    // Generates sample or actual logs for the chosen month
    const baseDays = selectedMonth === "2026-09" ? 21 : selectedMonth === "2026-10" ? 22 : 20;
    return {
      present: baseDays,
      absent: selectedMonth === "2026-09" ? 1 : 0,
      late: selectedMonth === "2026-10" ? 3 : 2,
      wfh: 4,
      logs: [
        { date: `${selectedMonth}-17`, checkIn: "09:05 AM", checkOut: "06:12 PM", status: "Present", totalHours: "9h 07m" },
        { date: `${selectedMonth}-16`, checkIn: "09:30 AM", checkOut: "06:00 PM", status: "Late", totalHours: "8h 30m" },
        { date: `${selectedMonth}-15`, checkIn: "09:00 AM", checkOut: "06:15 PM", status: "Present", totalHours: "9h 15m" },
        { date: `${selectedMonth}-12`, checkIn: "-", checkOut: "-", status: "Approved Leave", totalHours: "-" },
        { date: `${selectedMonth}-11`, checkIn: "08:55 AM", checkOut: "06:05 PM", status: "Present", totalHours: "9h 10m" }
      ]
    };
  }, [selectedMonth, employee]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl h-full bg-surface/95 glass-card border-l border-line shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="p-4 md:p-5 border-b border-line bg-surface2/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} employeeId={employee.id} size="md" />
            <div>
              <h2 className="font-display font-bold text-ink text-base flex items-center gap-2">
                {employee.name}
              </h2>
              <p className="text-[11.5px] text-muted">
                {employee.id} · {employee.dept} · {employee.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
            title="Close drawer"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs">
          
          {/* Month & Year Selector for HR */}
          <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold text-ink">Select Attendance Period:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-line text-ink text-xs font-semibold focus:outline-none focus:border-accent cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Summary Stat Cards for Selected Month */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-surface2/30 border border-line flex flex-col gap-1 text-left">
              <span className="text-[18px] font-bold font-data text-good leading-none">{monthlyLogs.present}</span>
              <span className="text-[10.5px] text-muted font-medium">Present</span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/30 border border-line flex flex-col gap-1 text-left">
              <span className="text-[18px] font-bold font-data text-warn leading-none">{monthlyLogs.late}</span>
              <span className="text-[10.5px] text-muted font-medium">Late Comings</span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/30 border border-line flex flex-col gap-1 text-left">
              <span className="text-[18px] font-bold font-data text-accent leading-none">{monthlyLogs.wfh}</span>
              <span className="text-[10.5px] text-muted font-medium">Remote/WFH</span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/30 border border-line flex flex-col gap-1 text-left">
              <span className="text-[18px] font-bold font-data text-bad leading-none">{monthlyLogs.absent}</span>
              <span className="text-[10.5px] text-muted font-medium">Absents</span>
            </div>
          </div>

          {/* Detailed Attendance Logs Table */}
          <div className="flex flex-col gap-2 pt-2">
            <h3 className="font-display font-bold text-ink text-sm uppercase tracking-wider">
              Daily Attendance Logs ({selectedMonth})
            </h3>
            
            <div className="rounded-xl border border-line overflow-hidden bg-surface2/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface2/60 text-[10.5px] text-muted uppercase font-semibold">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Check-In</th>
                    <th className="p-2.5">Check-Out</th>
                    <th className="p-2.5 text-right">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 text-xs">
                  {monthlyLogs.logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-surface2/40 transition">
                      <td className="p-2.5 font-num font-semibold text-ink">{log.date}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          log.status === "Present" ? "text-good border-good/30 bg-good/10" :
                          log.status === "Late" ? "text-warn border-warn/30 bg-warn/10" :
                          log.status === "Approved Leave" ? "text-accent border-accent/30 bg-accent/10" :
                          "text-bad border-bad/30 bg-bad/10"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-num text-muted">{log.checkIn}</td>
                      <td className="p-2.5 font-num text-muted">{log.checkOut}</td>
                      <td className="p-2.5 font-num font-bold text-ink text-right">{log.totalHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-line bg-surface2/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface2 hover:bg-surface2/80 text-ink border border-line text-xs font-semibold transition cursor-pointer"
          >
            Close Drawer
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};