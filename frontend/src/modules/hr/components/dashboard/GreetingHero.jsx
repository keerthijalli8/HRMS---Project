import React, { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../../context/ProfileContext.jsx';
import { Icon } from '../Icon.jsx';
import { WfhRequestModal } from '../wfo/WfhRequestModal.jsx';
import { ReportingLineDrawer } from './ReportingLineDrawer.jsx';
import { getDashboardSummaryStats } from '../../services/dashboardAttendanceMetrics.js';
import { CANONICAL_EMPLOYEES_12 } from '../../data/mockDb.js';

export const GreetingHero = ({ 
  currentUser: propUser, 
  tasks = [], 
  historyList = [],
  todayData = null,
  currentRoute = "overview",
  onNavigate,
  onNavigateToTasks,
  onTriggerToast
}) => {
  let ctxUser = null;
  try {
    const ctx = useProfile();
    ctxUser = ctx?.profile;
  } catch (e) {}
  const currentUser = ctxUser || propUser;

  const [wfhModalOpen, setWfhModalOpen] = useState(false);
  const [reportingDrawerOpen, setReportingDrawerOpen] = useState(false);

  // Live running time and date state
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTimeString = useMemo(() => {
    try {
      const timeStr = currentDateTime.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const dateStr = currentDateTime.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${timeStr} · ${dateStr} · Hyderabad, Telangana`;
    } catch (e) {
      return "02:23:32 PM · 17 Nov 2026 · Hyderabad, Telangana";
    }
  }, [currentDateTime]);

  // Time of day greeting
  const greeting = useMemo(() => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
      }).format(currentDateTime);
      const hour = parseInt(hourStr, 10);

      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Good night";
    } catch (e) {
      return "Good afternoon";
    }
  }, [currentDateTime]);

  // First name extraction
  const firstName = useMemo(() => {
    let raw = (currentUser?.firstName || currentUser?.name?.split(/\s+/)[0] || "").trim();
    raw = raw.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!raw) return "VINAY";
    return raw.toUpperCase();
  }, [currentUser]);

  // Dynamic tags and summary line
  const metrics = useMemo(() => {
    return getDashboardSummaryStats(currentUser, historyList, tasks, todayData);
  }, [currentUser, historyList, tasks, todayData]);

  const handleNavigateHistory = () => {
    try {
      localStorage.setItem("hrms_attendance_tab", "my");
      sessionStorage.setItem("hrms_my_attendance_subview", "history");
      const url = new URL(window.location.href);
      url.pathname = "/hr/attendance";
      url.searchParams.set("tab", "my");
      window.history.replaceState({}, "", url.toString());
    } catch (e) {}
    onNavigate?.("attendance");
    setTimeout(() => {
      const el = document.getElementById("my-attendance-history-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="glass-card !p-6 border border-line rounded-[20px] flex flex-col justify-between gap-4 h-full text-left">
      {/* Top Stack: Greeting & Live Time + Date underneath */}
      <div className="flex flex-col gap-2.5">
        {/* Top small badge row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-wider uppercase">
          <span className="px-2.5 py-0.5 rounded-md bg-surface2 border border-line text-ink">
            {currentUser?.systemRole || "Employee"}
          </span>
          <span className="text-muted tracking-widest">
            MYWORKSPACE
          </span>
        </div>

        {/* Main Greeting Block */}
        <h2 className="font-display font-bold text-ink leading-[1.15] text-[clamp(28px,3vw,40px)] tracking-tight">
          {greeting}, {firstName} <span className="inline-block select-none text-[clamp(28px,3vw,40px)] leading-none">👋</span>
        </h2>

        {/* Live Running Time and Date right below greeting in one line */}
        <div className="flex items-center gap-2 font-mono font-medium text-xs text-muted mt-0.5">
          <span className="w-2 h-2 rounded-full bg-good animate-pulse shrink-0" />
          <span className="text-ink font-bold">{formattedDateTimeString.split(' · ')[0]}</span>
          <span className="text-line">·</span>
          <span>{formattedDateTimeString.split(' · ').slice(1).join(' · ')}</span>
        </div>
      </div>

      {/* Thin Divider */}
      <div className="border-t border-line/40 my-0" />

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.("teams")}
          className={`h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition active:scale-[0.98] cursor-pointer ${
            currentRoute === "teams"
              ? "bg-accent/15 border border-accent text-accent shadow-sm"
              : "bg-surface2/70 hover:bg-surface2 border border-line hover:border-accent text-ink hover:text-accent"
          }`}
        >
          Teams
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.("payroll")}
          className={`h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition active:scale-[0.98] cursor-pointer ${
            currentRoute === "payroll"
              ? "bg-accent/15 border border-accent text-accent shadow-sm"
              : "bg-surface2/70 hover:bg-surface2 border border-line hover:border-accent text-ink hover:text-accent"
          }`}
        >
          Payroll
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.("approvals")}
          className={`h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition active:scale-[0.98] cursor-pointer ${
            currentRoute === "approvals"
              ? "bg-accent/15 border border-accent text-accent shadow-sm"
              : "bg-surface2/70 hover:bg-surface2 border border-line hover:border-accent text-ink hover:text-accent"
          }`}
        >
          Approvals
        </button>

        <button
          type="button"
          onClick={() => {
            if (onNavigateToTasks) onNavigateToTasks("All");
            else onNavigate?.("tasks");
          }}
          className={`h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition active:scale-[0.98] cursor-pointer ${
            currentRoute === "tasks"
              ? "bg-accent/15 border border-accent text-accent shadow-sm"
              : "bg-surface2/70 hover:bg-surface2 border border-line hover:border-accent text-ink hover:text-accent"
          }`}
        >
          <span>My Tasks</span>
          {metrics?.pendingTasks?.count != null && metrics.pendingTasks.count > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-accent/20 text-accent font-mono font-bold leading-none">
              {metrics.pendingTasks.count}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setWfhModalOpen(true)}
          className="h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition active:scale-[0.98] cursor-pointer bg-surface2/70 hover:bg-surface2 border border-line hover:border-accent text-ink hover:text-accent"
        >
          Request WFH
        </button>

        <button
          type="button"
          onClick={handleNavigateHistory}
          className="h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition active:scale-[0.98] cursor-pointer bg-surface2/70 hover:bg-surface2 border border-line hover:border-accent text-ink hover:text-accent"
        >
          Attendance History
        </button>
      </div>

      {/* WFH Request Modal */}
      <WfhRequestModal
        isOpen={wfhModalOpen}
        onClose={() => setWfhModalOpen(false)}
        currentUser={currentUser}
        onTriggerToast={onTriggerToast}
      />

      {/* Reporting Line Side Drawer */}
      <ReportingLineDrawer
        isOpen={reportingDrawerOpen}
        onClose={() => setReportingDrawerOpen(false)}
        currentUser={currentUser}
        onNavigate={onNavigate}
      />
    </div>
  );
};