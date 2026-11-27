import React, { useState, useEffect, useMemo } from 'react';
import { KPITile } from '../components/KPITile.jsx';
import { LeaveCalendar } from '../components/LeaveCalendar.jsx';
import { HolidayCalendarPanel } from '../components/HolidayCalendarPanel.jsx';
import { loadHolidays } from '../services/holidayStore.js';
import { PendingLeaveApprovals } from '../components/leave/PendingLeaveApprovals.jsx';
import { getPendingLeaveCount, subscribeLeave } from '../services/leaveService.js';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal.jsx';
import { Icon } from '../components/Icon.jsx';
import { CANONICAL_METRICS } from '../data/mockDb.js';

export const LeaveView = ({ currentUser, selectedCalDay, setSelectedCalDay, onTriggerToast }) => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "holidays") return "holidays";
      }
      const saved = sessionStorage.getItem("hrms_leave_tab");
      if (saved === "holidays") {
        sessionStorage.removeItem("hrms_leave_tab");
        return "holidays";
      }
    } catch (e) {}
    return "leave";
  });

  const [holidays, setHolidays] = useState(() => loadHolidays());
  const [pendingCount, setPendingCount] = useState(() => getPendingLeaveCount());
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const isPrivileged = useMemo(() => {
    const r = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    return r.includes("hr") || r.includes("admin") || r.includes("manager");
  }, [currentUser]);

  useEffect(() => {
    const handleSync = () => setHolidays(loadHolidays());
    window.addEventListener("hrms_holidays_updated", handleSync);
    window.addEventListener("storage", handleSync);

    const unsubLeave = subscribeLeave(() => {
      setPendingCount(getPendingLeaveCount());
    });

    return () => {
      window.removeEventListener("hrms_holidays_updated", handleSync);
      window.removeEventListener("storage", handleSync);
      unsubLeave();
    };
  }, []);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.pathname = "/hr/leave";
      if (tab === "holidays") {
        url.searchParams.set("tab", "holidays");
      } else {
        url.searchParams.delete("tab");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {}
  };

  const novHolidays = useMemo(
    () => holidays.filter(h => h.date && h.date.startsWith("2026-11")),
    [holidays]
  );
  const officialNovCount = novHolidays.filter(h => !h.isOptional).length;
  const novHolidaySummary =
    novHolidays
      .filter(h => !h.isOptional)
      .map(h => `${h.name.split(" ")[0]} (${parseInt(h.date.split("-")[2], 10)} Nov)`)
      .slice(0, 2)
      .join(" & ") || "No official holidays";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ================= UNIFIED SLIM PAGE HEADER ================= */}
      <div className="glass-card !p-4 border border-line/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Icon name="briefcase" className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-ink leading-tight">
              Leave & Holiday Management
            </h2>
            <p className="text-[11.5px] text-muted mt-0.5">
              {isPrivileged
                ? "Apply for leave, review team requests, and manage official company holidays."
                : "Apply for time off, track approval status, and view upcoming holidays."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Tab Switcher */}
          <div
            role="tablist"
            aria-label="Leave Management Navigation"
            className="inline-flex gap-1 p-1 rounded-xl border border-line/80 bg-surface2/70"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                handleTabSwitch(activeTab === "leave" ? "holidays" : "leave");
              }
            }}
          >
            <button
              type="button"
              role="tab"
              id="tab-leave-overview"
              aria-selected={activeTab === "leave"}
              aria-controls="tabpanel-leave-overview"
              tabIndex={activeTab === "leave" ? 0 : -1}
              onClick={() => handleTabSwitch("leave")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "leave"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="calendar" className="w-3.5 h-3.5" />
              <span>Leave Overview</span>
              {pendingCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-data ${
                    activeTab === "leave" ? "bg-black/20 text-on-accent" : "bg-surface border border-line text-muted"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              id="tab-leave-holidays"
              aria-selected={activeTab === "holidays"}
              aria-controls="tabpanel-leave-holidays"
              tabIndex={activeTab === "holidays" ? 0 : -1}
              onClick={() => handleTabSwitch("holidays")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "holidays"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="sun" className="w-3.5 h-3.5" />
              <span>Holiday Calendar</span>
              {officialNovCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-data ${
                    activeTab === "holidays" ? "bg-black/20 text-on-accent" : "bg-surface border border-line text-muted"
                  }`}
                >
                  {officialNovCount}
                </span>
              )}
            </button>
          </div>

          {/* Apply Leave Button: Available to ALL users (Employees, Managers & HR) */}
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center gap-1.5 hover:brightness-105 active:scale-[0.98] transition cursor-pointer shadow-sm"
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: LEAVE OVERVIEW ================= */}
      {activeTab === "leave" && (
        <div
          role="tabpanel"
          id="tabpanel-leave-overview"
          aria-labelledby="tab-leave-overview"
          className="flex flex-col gap-4 animate-fade-in"
        >
          {/* Role-Aware KPI Row */}
          {isPrivileged ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPITile
                metric={String(CANONICAL_METRICS.onLeaveEmployees || 1)}
                label="On Leave Today"
                icon="users"
                trend="Active Absences"
              />
              <KPITile
                metric={String(pendingCount)}
                label="Pending Approvals"
                icon="alert-triangle"
                trend={pendingCount > 0 ? "Requires Sign-off" : "All Clear"}
                isWarn={pendingCount > 0}
              />
              <KPITile
                metric="6"
                label="Approved (Nov)"
                icon="check-circle"
                trend="Within Policy"
              />
              <KPITile
                metric={String(officialNovCount || 2)}
                label="Public Holidays (Nov)"
                icon="calendar"
                trend={novHolidaySummary}
                onClick={() => handleTabSwitch("holidays")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPITile
                metric="14"
                label="Leave Balance"
                icon="briefcase"
                trend="CL + SL + PL Available"
              />
              <KPITile
                metric={String(pendingCount)}
                label="Pending Requests"
                icon="clock"
                trend={pendingCount > 0 ? "Awaiting Approval" : "No Pending"}
                isWarn={pendingCount > 0}
              />
              <KPITile
                metric="4"
                label="Leaves Taken (YTD)"
                icon="check-circle"
                trend="Approved Days"
              />
              <KPITile
                metric={String(officialNovCount || 2)}
                label="Public Holidays (Nov)"
                icon="calendar"
                trend={novHolidaySummary}
                onClick={() => handleTabSwitch("holidays")}
              />
            </div>
          )}

          {/* Balanced 2/3 Calendar + 1/3 Requests Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="glass-card !p-4 sm:!p-5 border border-line/80 rounded-2xl lg:col-span-2">
              <LeaveCalendar
                selectedDate={selectedCalDay}
                onSelectDate={(d) => setSelectedCalDay(d)}
              />
            </div>

            <div className="lg:col-span-1">
              <PendingLeaveApprovals
                currentUser={currentUser}
                onTriggerToast={onTriggerToast}
                showTabs={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: HOLIDAY CALENDAR PANEL ================= */}
      {activeTab === "holidays" && (
        <div
          role="tabpanel"
          id="tabpanel-leave-holidays"
          aria-labelledby="tab-leave-holidays"
          className="animate-fade-in"
        >
          <HolidayCalendarPanel
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
          />
        </div>
      )}

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        currentUser={currentUser}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
};