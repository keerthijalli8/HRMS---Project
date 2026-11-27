import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { KPITile } from '../KPITile.jsx';
import { StatusPill } from '../StatusPill.jsx';
import { PrimaryButton } from '../Buttons.jsx';
import {
  getMyToday,
  formatTime,
  formatHoursWorked,
  formatDisplayDate,
  subscribeAttendanceStore
} from '../../services/attendanceLog.js';
import {
  getEmployeeMonthlyStats,
  subscribeQrUpdates
} from '../../services/qrAttendanceStore.js';

export const MyAttendanceHistory = ({ currentUser, onOpenScanner }) => {
  const [todayData, setTodayData] = useState(() => getMyToday(currentUser));
  const [monthlyStats, setMonthlyStats] = useState(() =>
    getEmployeeMonthlyStats(currentUser?.employeeId || "EMP-1088")
  );
  const [selectedMonth, setSelectedMonth] = useState("November 2026");

  const syncData = () => {
    setTodayData(getMyToday(currentUser));
    setMonthlyStats(getEmployeeMonthlyStats(currentUser?.employeeId || "EMP-1088"));
  };

  useEffect(() => {
    syncData();
    const unsubAtt = subscribeAttendanceStore(syncData);
    const unsubQr = subscribeQrUpdates(syncData);
    return () => {
      unsubAtt();
      unsubQr();
    };
  }, [currentUser]);

  // November 2026 calendar days (30 days, Nov 1 2026 was a Sunday)
  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = 30;
    const startDayOfWeek = 0; // Nov 1 2026 is Sunday

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true, day: 0 });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `2026-11-${String(d).padStart(2, '0')}`;
      const dayOfWeek = (startDayOfWeek + d - 1) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = d === 10; // Current day Nov 10 2026

      let status = "Not Marked";
      if (isWeekend) {
        status = "Weekend";
      } else if (d < 10) {
        if (d === 6) status = "Late";
        else if (d === 4) status = "Half Day";
        else status = "Present";
      } else if (isToday) {
        status = todayData?.summary?.firstLogin ? "Present" : "Today";
      }

      days.push({
        empty: false,
        day: d,
        dateKey,
        isWeekend,
        isToday,
        status
      });
    }
    return days;
  }, [todayData]);

  const summary = todayData?.summary || {};
  const isCheckedIn = !!summary.firstLogin;
  const isCheckedOut = !summary.hasOpenSession && !!summary.lastLogout;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header with Scan Shortcut */}
      <div className="glass-card !p-4 border border-line flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-display font-bold text-ink">
              My Attendance Records
            </h2>
            <span className="glass-pill px-2 py-0.5 text-xs text-accent font-semibold">
              {currentUser?.name || "Employee"} · {currentUser?.employeeId}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Personal attendance log, monthly calendar breakdown, and QR verification history.
          </p>
        </div>

        {onOpenScanner && (
          <PrimaryButton icon="camera" onClick={onOpenScanner}>
            Scan Attendance (Office QR)
          </PrimaryButton>
        )}
      </div>

      {/* 2. Today's Punch Summary + Monthly KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Today Check-in */}
        <div className="glass-card !p-3 border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">Today Check-in</span>
          <div className="text-xl md:text-2xl font-num font-extrabold text-ink tabular-nums">
            {summary.firstLogin ? formatTime(summary.firstLogin) : "--"}
          </div>
          <span className="text-[10px] text-muted truncate">
            {summary.firstLogin ? "Office QR Verified" : "Not punched in yet"}
          </span>
        </div>

        {/* Today Check-out */}
        <div className="glass-card !p-3 border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">Today Check-out</span>
          <div className="text-xl md:text-2xl font-num font-extrabold text-ink tabular-nums">
            {summary.lastLogout ? formatTime(summary.lastLogout) : "--"}
          </div>
          <span className="text-[10px] text-muted truncate">
            {summary.lastLogout ? "Punch Recorded" : isCheckedIn ? "Active Shift" : "--"}
          </span>
        </div>

        {/* Present Days */}
        <KPITile
          metric={String(monthlyStats.presentCount)}
          label="Present Days"
          icon="check-circle"
          trend="Nov '26"
          hideSuffix={true}
        />

        {/* Late Days */}
        <KPITile
          metric={String(monthlyStats.lateCount)}
          label="Late Arrivals"
          icon="clock"
          trend="Policy: >09:30"
          isWarn={monthlyStats.lateCount > 0}
          hideSuffix={true}
        />

        {/* Half Days */}
        <KPITile
          metric={String(monthlyStats.halfDayCount)}
          label="Half Days"
          icon="alert-triangle"
          trend="4.5h - 8h"
          hideSuffix={true}
        />

        {/* Absent */}
        <KPITile
          metric={String(monthlyStats.absentCount)}
          label="Absent / Unpaid"
          icon="x"
          trend="Unrecorded"
          isWarn={monthlyStats.absentCount > 0}
          hideSuffix={true}
        />
      </div>

      {/* 3. Monthly Attendance Calendar & Previous Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Calendar View */}
        <div className="glass-card !p-4 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-line/50 pb-2">
            <span className="font-bold text-ink text-sm">Monthly Attendance Calendar</span>
            <span className="glass-pill px-2 py-0.5 text-xs text-accent font-semibold">{selectedMonth}</span>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted uppercase">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarDays.map((d, idx) => {
              if (d.empty) {
                return <div key={`empty-${idx}`} className="h-9"></div>;
              }

              const statusColor = {
                Present: "bg-good/20 text-good border-good/40",
                Late: "bg-warn/20 text-warn border-warn/40",
                "Half Day": "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
                Absent: "bg-bad/20 text-bad border-bad/40",
                Weekend: "bg-surface2/30 text-muted/60 border-line/40",
                Today: "bg-accent/20 text-accent border-accent animate-pulse",
                "Not Marked": "bg-surface2/20 text-muted border-line/40"
              }[d.status] || "bg-surface2/40 text-muted";

              return (
                <div
                  key={`day-${d.day}`}
                  className={`h-9 rounded-lg border flex flex-col items-center justify-center font-data font-semibold text-[11px] transition ${statusColor}`}
                  title={`${d.dateKey}: ${d.status}`}
                >
                  <span>{d.day}</span>
                  {d.status === "Present" && <span className="w-1 h-1 rounded-full bg-good mt-0.5"></span>}
                  {d.status === "Late" && <span className="w-1 h-1 rounded-full bg-warn mt-0.5"></span>}
                  {d.status === "Half Day" && <span className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></span>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-line/40 text-[10px] text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-good"></span> Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-warn"></span> Late</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400"></span> Half Day</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-surface2 border border-line"></span> Off</span>
          </div>
        </div>

        {/* Previous Attendance Records Table */}
        <div className="glass-card !p-0 border border-line overflow-hidden shadow-sm lg:col-span-2">
          <div className="p-3 border-b border-line bg-surface2/40 flex items-center justify-between">
            <span className="font-bold text-ink text-xs">Previous Attendance Records</span>
            <span className="text-[11px] text-muted">Viewing last 30 days</span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line/60 bg-surface2/20 text-muted font-semibold text-[11px]">
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3">Check-in</th>
                  <th className="py-2.5 px-3">Check-out</th>
                  <th className="py-2.5 px-3">Working Hours</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3.5">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {monthlyStats.records.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-surface2/30 transition text-xs">
                    <td className="py-2.5 px-3.5 font-data text-ink whitespace-nowrap">
                      {formatDisplayDate(rec.dateKey)}
                    </td>
                    <td className="py-2.5 px-3 font-data text-ink whitespace-nowrap">
                      {rec.checkIn}
                    </td>
                    <td className="py-2.5 px-3 font-data text-ink whitespace-nowrap">
                      {rec.checkOut}
                    </td>
                    <td className="py-2.5 px-3 font-data text-accent font-bold whitespace-nowrap">
                      {rec.hoursFormatted}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusPill status={rec.status} />
                    </td>
                    <td className="py-2.5 px-3.5 text-muted text-[11px] truncate max-w-[180px]">
                      {rec.verificationMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
