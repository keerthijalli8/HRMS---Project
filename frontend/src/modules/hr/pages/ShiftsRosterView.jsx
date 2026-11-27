import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon.jsx';
import { KPITile } from '../components/KPITile.jsx';
import { Avatar } from '../components/Avatar.jsx';
import {
  getShifts,
  saveShift,
  setShiftActive,
  deleteShift,
  getRosterGrid,
  setCell,
  applyToWeek,
  copyWeek,
  resetWeek,
  inspectPublishWeek,
  revertPastWeekCells,
  publishWeek,
  getCoverage,
  createRequest,
  decideRequest,
  cancelRequest,
  getChanges,
  respondToProposal,
  withdrawProposal,
  overrideProposal,
  remindEmployee,
  getPendingCount,
  getCellStates,
  getNotifications,
  markNotificationsRead,
  getShiftImpactCount,
  getMondayOfWeek,
  getWeekDates,
  getMonthDates,
  getCompanyId,
  isHrRole,
  isHrManagerRole,
  isManagerRole,
  formatTime12,
  formatDateDisplay,
  formatDateWithWeekday,
  formatDateTime,
  formatRelativeDeadline,
  formatDurationMinutes,
  PRESET_SHIFT_COLORS,
  ROSTER_REQUIRES_ACCEPTANCE
} from '../services/shiftService.js';
import { getTodayDateKey, formatDate } from '../services/attendanceLog.js';
import { loadHolidays } from '../services/holidayStore.js';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CAL_WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ShiftsRosterView = ({ currentUser, onTriggerToast }) => {
  const isHR = isHrRole(currentUser);
  const isHRMgr = isHrManagerRole(currentUser);
  const isMgr = isManagerRole(currentUser);
  const isStaff = !isHR && !isMgr;

  // Determine available tabs
  const tabs = useMemo(() => {
    if (isHR || isMgr) {
      return [
        { id: "roster", label: "Roster" },
        { id: "shifts", label: "Shifts" },
        { id: "changes", label: "Changes" }
      ];
    }
    return [
      { id: "my-roster", label: "My Roster" },
      { id: "my-changes", label: "My Changes" }
    ];
  }, [isHR, isMgr]);

  const [activeTab, setActiveTab] = useState(() => (isHR || isMgr ? "roster" : "my-roster"));
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to updates
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener("hrms-shifts-updated", handleUpdate);
    return () => window.removeEventListener("hrms-shifts-updated", handleUpdate);
  }, []);

  const todayKey = useMemo(() => getTodayDateKey(), []);

  // Roster view state
  const [viewMode, setViewMode] = useState("week"); // "week" | "month"
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMondayOfWeek(todayKey));
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [y, m] = todayKey.split("-").map(Number);
    return { year: y, month: m };
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  // Notifications collapsible card
  const [showRecentUpdates, setShowRecentUpdates] = useState(false);

  // Dialog & popover states
  const [cellPopover, setCellPopover] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [publishModal, setPublishModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [shiftModal, setShiftModal] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [viewReasonModal, setViewReasonModal] = useState(null);

  // Changes tab filters
  const [originFilter, setOriginFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch company shifts
  const companyShifts = useMemo(() => {
    return getShifts(currentUser);
  }, [currentUser, refreshKey]);

  const shiftsMap = useMemo(() => {
    const m = new Map();
    companyShifts.forEach(s => {
      m.set(s.id, s);
      m.set(s.code, s);
    });
    return m;
  }, [companyShifts]);

  // Compute date range for current view
  const currentRange = useMemo(() => {
    if (viewMode === "week") {
      const dates = getWeekDates(currentWeekMonday);
      return {
        startKey: dates[0],
        endKey: dates[6],
        dates
      };
    } else {
      const dates = getMonthDates(currentMonth.year, currentMonth.month);
      return {
        startKey: dates[0],
        endKey: dates[dates.length - 1],
        dates
      };
    }
  }, [viewMode, currentWeekMonday, currentMonth]);

  // Fetch Roster Grid
  const rosterData = useMemo(() => {
    if (activeTab !== "roster" && activeTab !== "my-roster") return null;
    return getRosterGrid(currentUser, currentRange.startKey, currentRange.endKey, {
      forEdit: isHR && viewMode === "week"
    });
  }, [currentUser, currentRange, isHR, viewMode, activeTab, refreshKey]);

  // Fetch Cell States
  const cellStatesMap = useMemo(() => {
    if (activeTab !== "roster") return {};
    return getCellStates(currentUser, currentRange.startKey, currentRange.endKey);
  }, [currentUser, currentRange, activeTab, refreshKey]);

  // Fetch Coverage
  const coverageData = useMemo(() => {
    if (activeTab !== "roster") return null;
    return getCoverage(currentUser, currentRange.startKey, currentRange.endKey);
  }, [currentUser, currentRange, activeTab, refreshKey]);

  // Fetch Shift Changes
  const allChanges = useMemo(() => {
    return getChanges(currentUser, { origin: originFilter, status: statusFilter });
  }, [currentUser, originFilter, statusFilter, refreshKey]);

  // Total raw changes for counts
  const rawChangesList = useMemo(() => {
    return getChanges(currentUser, { origin: "all", status: "all" });
  }, [currentUser, refreshKey]);

  // Fetch recent notifications
  const recentNotifications = useMemo(() => {
    return getNotifications(currentUser, 5);
  }, [currentUser, refreshKey]);

  const hasUnreadNotifs = useMemo(() => {
    return recentNotifications.some(n => !n.read);
  }, [recentNotifications]);

  // Mark notifications read on tab mount
  useEffect(() => {
    if (hasUnreadNotifs) {
      markNotificationsRead(currentUser);
    }
  }, [activeTab, currentUser, hasUnreadNotifs]);

  // Awaiting proposals count for the current week (for status pill)
  const weekAwaitingProposals = useMemo(() => {
    if (viewMode !== "week") return [];
    return rawChangesList.filter(c => {
      if (c.origin !== "hr" || c.status !== "Awaiting Employee") return false;
      const weekDates = currentRange.dates;
      return (c.items || []).some(i => weekDates.includes(i.dateKey));
    });
  }, [viewMode, rawChangesList, currentRange]);

  // Navigation handlers
  const handlePrevPeriod = () => {
    if (viewMode === "week") {
      const d = new Date(`${currentWeekMonday}T12:00:00+05:30`);
      d.setDate(d.getDate() - 7);
      setCurrentWeekMonday(getTodayDateKey(d));
    } else {
      setCurrentMonth(prev => {
        let m = prev.month - 1;
        let y = prev.year;
        if (m < 1) {
          m = 12;
          y -= 1;
        }
        return { year: y, month: m };
      });
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === "week") {
      const d = new Date(`${currentWeekMonday}T12:00:00+05:30`);
      d.setDate(d.getDate() + 7);
      setCurrentWeekMonday(getTodayDateKey(d));
    } else {
      setCurrentMonth(prev => {
        let m = prev.month + 1;
        let y = prev.year;
        if (m > 12) {
          m = 1;
          y += 1;
        }
        return { year: y, month: m };
      });
    }
  };

  const handleTodayPeriod = () => {
    if (viewMode === "week") {
      setCurrentWeekMonday(getMondayOfWeek(todayKey));
    } else {
      const [y, m] = todayKey.split("-").map(Number);
      setCurrentMonth({ year: y, month: m });
    }
  };

  // Period label
  const periodLabel = useMemo(() => {
    if (viewMode === "week") {
      const dStart = new Date(`${currentRange.startKey}T12:00:00+05:30`);
      const dEnd = new Date(`${currentRange.endKey}T12:00:00+05:30`);
      const startDay = dStart.getDate();
      const endDay = dEnd.getDate();
      const startMo = MONTH_NAMES[dStart.getMonth()].slice(0, 3);
      const endMo = MONTH_NAMES[dEnd.getMonth()].slice(0, 3);
      const year = dEnd.getFullYear();

      if (startMo === endMo) {
        return `${startDay} to ${endDay} ${endMo} ${year}`;
      }
      return `${startDay} ${startMo} - ${endDay} ${endMo} ${year}`;
    } else {
      return `${MONTH_NAMES[currentMonth.month - 1]} ${currentMonth.year}`;
    }
  }, [viewMode, currentRange, currentMonth]);

  // Unique departments for filter
  const departments = useMemo(() => {
    if (!rosterData?.rows) return [];
    const depts = new Set();
    rosterData.rows.forEach(r => {
      if (r.dept) depts.add(r.dept);
    });
    return Array.from(depts).sort();
  }, [rosterData]);

  // Filtered rows for Roster grid
  const filteredRows = useMemo(() => {
    if (!rosterData?.rows) return [];
    let list = rosterData.rows;

    if (selectedDept !== "all") {
      list = list.filter(r => r.dept === selectedDept);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        (r.dept && r.dept.toLowerCase().includes(q))
      );
    }

    return list;
  }, [rosterData, selectedDept, searchQuery]);

  // KPI Metrics for Roster tab
  const kpiMetrics = useMemo(() => {
    const totalWorkingToday = coverageData?.[todayKey]?.totalWorking || 0;
    const totalOffToday = coverageData?.[todayKey]?.totalOff || 0;
    const activeShiftsCount = companyShifts.filter(s => s.active).length;
    const pendingActionCount = getPendingCount(currentUser);

    return {
      workingToday: totalWorkingToday,
      offToday: totalOffToday,
      activeShifts: activeShiftsCount,
      pendingAction: pendingActionCount
    };
  }, [coverageData, todayKey, companyShifts, currentUser, refreshKey]);

  // Handle cell click (HR edit)
  const handleCellClick = (e, employee, dateKey, cellData) => {
    if (!isHR || viewMode !== "week") return;
    if (cellData.onLeave) {
      onTriggerToast?.("Employee is on approved leave for this date (read-only).");
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setCellPopover({
      employeeId: employee.employeeId,
      employeeName: employee.name,
      dateKey,
      rect,
      currentVal: cellData.shiftId || cellData.code
    });
  };

  // Apply cell value change
  const handleSelectShiftForCell = (shiftIdOrWO) => {
    if (!cellPopover) return;
    const { employeeId, dateKey } = cellPopover;
    const res = setCell(currentUser, employeeId, dateKey, shiftIdOrWO);
    if (res.ok) {
      onTriggerToast?.("Roster updated (marked as Draft)");
    } else {
      onTriggerToast?.(res.error || "Failed to update cell");
    }
    setCellPopover(null);
  };

  // Handle "Publish week" click: inspect pre-flight differences and open confirmation dialog
  const handlePublishClick = () => {
    if (!isHR) return;
    const inspection = inspectPublishWeek(currentUser, currentWeekMonday);
    setPublishModal({
      weekStartKey: currentWeekMonday,
      inspection,
      note: ""
    });
  };

  // Revert past blocked cells
  const handleRevertPastCells = () => {
    if (!publishModal) return;
    const res = revertPastWeekCells(currentUser, publishModal.weekStartKey, publishModal.inspection.blockedPastDates);
    if (res.ok) {
      onTriggerToast?.("Reverted past cells to baseline schedule.");
      const refreshedInspection = inspectPublishWeek(currentUser, publishModal.weekStartKey);
      setPublishModal(prev => ({
        ...prev,
        inspection: refreshedInspection
      }));
    } else {
      onTriggerToast?.(res.error || "Failed to revert cells");
    }
  };

  // Execute publish
  const executePublish = () => {
    if (!publishModal) return;
    const res = publishWeek(currentUser, publishModal.weekStartKey, {
      note: publishModal.note
    });

    if (res.ok) {
      if (res.requiresAcceptance) {
        onTriggerToast?.(`Proposals sent for acceptance to ${res.proposedChangesCount} employee(s)`);
      } else {
        onTriggerToast?.(`Roster published for ${periodLabel}`);
      }
      setPublishModal(null);
    } else {
      onTriggerToast?.(res.error || "Failed to publish roster");
    }
  };

  // Handle "Copy last week"
  const handleCopyLastWeek = () => {
    const d = new Date(`${currentWeekMonday}T12:00:00+05:30`);
    d.setDate(d.getDate() - 7);
    const lastWeekMon = getTodayDateKey(d);

    setConfirmModal({
      title: "Copy Last Week's Roster",
      message: `Are you sure you want to copy the roster assignments from the previous week (${formatDateDisplay(lastWeekMon)}) into this week? Any unsaved edits in this week will be overwritten.`,
      confirmText: "Copy Roster",
      isDanger: false,
      onConfirm: () => {
        const res = copyWeek(currentUser, lastWeekMon, currentWeekMonday);
        if (res.ok) {
          onTriggerToast?.("Roster copied from last week (Draft)");
        } else {
          onTriggerToast?.(res.error || "Failed to copy roster");
        }
      }
    });
  };

  // Handle "Reset to default"
  const handleResetToDefault = () => {
    setConfirmModal({
      title: "Reset Week to Default",
      message: "Are you sure you want to reset this week's roster to company defaults (Monday to Friday default shift, Saturday and Sunday Week Off)?",
      confirmText: "Reset Week",
      isDanger: true,
      onConfirm: () => {
        const res = resetWeek(currentUser, currentWeekMonday);
        if (res.ok) {
          onTriggerToast?.("Roster reset to default schedule");
        } else {
          onTriggerToast?.(res.error || "Failed to reset week");
        }
      }
    });
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!filteredRows || filteredRows.length === 0) {
      onTriggerToast?.("No roster records to export.");
      return;
    }

    const dateColumns = currentRange.dates;
    const headers = [
      "Employee ID",
      "Name",
      "Department",
      ...dateColumns.map(dKey => formatDateDisplay(dKey))
    ];

    const csvRows = [headers.join(",")];

    filteredRows.forEach(row => {
      const line = [
        `"${row.employeeId}"`,
        `"${row.name}"`,
        `"${row.dept || ''}"`,
        ...dateColumns.map(dKey => {
          const cell = row.cells[dKey];
          return `"${cell?.code || 'WO'}"`;
        })
      ];
      csvRows.push(line.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `roster-${currentRange.startKey}-${currentRange.endKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast?.(`Exported roster (${filteredRows.length} employees)`);
  };

  // Status counts for Changes tab
  const statusCounts = useMemo(() => {
    const counts = {
      all: rawChangesList.length,
      "pending hr": 0,
      "awaiting employee": 0,
      "accepted or approved": 0,
      "declined or rejected": 0,
      "expired": 0,
      "withdrawn or cancelled": 0
    };

    rawChangesList.forEach(c => {
      const s = c.status;
      if (s === "Pending HR") counts["pending hr"]++;
      else if (s === "Awaiting Employee") counts["awaiting employee"]++;
      else if (s === "Accepted" || s === "Approved" || s === "Applied (override)") counts["accepted or approved"]++;
      else if (s === "Declined" || s === "Rejected") counts["declined or rejected"]++;
      else if (s === "Expired") counts["expired"]++;
      else if (s === "Withdrawn" || s === "Cancelled") counts["withdrawn or cancelled"]++;
    });

    return counts;
  }, [rawChangesList]);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* ================= 1. TOP HEADER & SEGMENTED TABS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-display text-2xl font-bold text-ink">
            Shifts & Roster
          </div>
          <div className="text-xs text-muted mt-0.5">
            {isHR
              ? "Plan enterprise shift rosters, manage timing policies, and approve schedule requests"
              : isMgr
              ? "View workforce shift schedules and monitor shift coverage across departments"
              : "View your assigned shifts, upcoming schedules, and submit shift change requests"}
          </div>
        </div>

        {/* Segmented Tabs Bar */}
        <div
          role="tablist"
          className="inline-flex flex-row items-center gap-1 p-1 rounded-xl border border-line bg-surface2 self-start sm:self-auto"
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex flex-row items-center gap-1.5 ${
                  isActive
                    ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                    : "text-muted hover:text-ink hover:bg-surface2/60 border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === "changes" && statusCounts["pending hr"] > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-warn text-ink font-bold">
                    {statusCounts["pending hr"]}
                  </span>
                )}
                {tab.id === "my-changes" && statusCounts["awaiting employee"] > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-warn text-ink font-bold">
                    {statusCounts["awaiting employee"]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= RECENT UPDATES NOTIFICATION CARD ================= */}
      {recentNotifications.length > 0 && (
        <div className="glass-card !p-3 border border-line gap-2">
          <div
            className="flex flex-row items-center justify-between cursor-pointer"
            onClick={() => setShowRecentUpdates(prev => !prev)}
          >
            <div className="flex flex-row items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs font-bold text-ink">Recent Roster Updates & Notifications</span>
              {hasUnreadNotifs && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-accent text-on-accent">
                  New
                </span>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-muted hover:text-ink flex flex-row items-center gap-1"
            >
              <span>{showRecentUpdates ? "Hide" : "Show (5)"}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showRecentUpdates ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {showRecentUpdates && (
            <div className="divide-y divide-line/30 pt-1 text-xs">
              {recentNotifications.map(n => (
                <div key={n.id} className="py-1.5 flex flex-row items-start justify-between gap-2">
                  <div className={!n.read ? "font-bold text-ink" : "text-muted"}>
                    {n.text}
                  </div>
                  <span className="text-[10px] text-muted shrink-0 tabular-nums">
                    {formatDate(n.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 2. ROSTER TAB (HR & MANAGER) ================= */}
      {activeTab === "roster" && (
        <div className="flex flex-col gap-4">
          {/* 4 KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPITile
              metric={kpiMetrics.workingToday}
              label="Working Today"
              icon="users"
              hideSuffix={true}
            />
            <KPITile
              metric={kpiMetrics.offToday}
              label="On Week Off Today"
              icon="calendar"
              hideSuffix={true}
            />
            <KPITile
              metric={kpiMetrics.activeShifts}
              label="Active Shifts"
              icon="clock"
              hideSuffix={true}
            />
            <KPITile
              metric={kpiMetrics.pendingAction}
              label={isHR ? "Pending Approvals & Audit" : "Pending Actions"}
              icon="alert-triangle"
              isWarn={kpiMetrics.pendingAction > 0}
              hideSuffix={true}
              onClick={() => setActiveTab("changes")}
            />
          </div>

          {/* Toolbar */}
          <div className="glass-card !p-3 border border-line">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3">
              {/* Left Group */}
              <div className="flex flex-row flex-wrap items-center gap-2.5">
                {/* Week | Month Segmented Control */}
                <div className="inline-flex flex-row items-center p-0.5 rounded-lg border border-line bg-surface2/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 rounded-md transition ${
                      viewMode === "week"
                        ? "bg-accent text-on-accent shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 rounded-md transition ${
                      viewMode === "month"
                        ? "bg-accent text-on-accent shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Month
                  </button>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-row items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevPeriod}
                    className="p-1.5 rounded-lg border border-line bg-surface2 text-muted hover:text-ink hover:border-accent transition"
                    title="Previous"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleTodayPeriod}
                    className="px-2.5 py-1 rounded-lg border border-line bg-surface2 text-xs font-semibold text-muted hover:text-ink hover:border-accent transition"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPeriod}
                    className="p-1.5 rounded-lg border border-line bg-surface2 text-muted hover:text-ink hover:border-accent transition"
                    title="Next"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                {/* Period Label */}
                <div className="font-display text-sm font-bold text-ink px-1">
                  {typeof periodLabel === "string" ? (
                    periodLabel.split(/(\d+)/).map((p, i) =>
                      /^\d+$/.test(p) ? <span key={i} className="font-num">{p}</span> : p
                    )
                  ) : periodLabel}
                </div>

                {/* Status Pills (Week view only) */}
                {viewMode === "week" && (
                  <div className="flex flex-row items-center gap-1.5">
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex flex-row items-center gap-1.5 cursor-default ${
                        rosterData?.status === "published"
                          ? "bg-good/15 text-good border-good/30"
                          : "bg-warn/15 text-warn border-warn/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          rosterData?.status === "published" ? "bg-good" : "bg-warn"
                        }`}
                      />
                      <span>{rosterData?.status === "published" ? "Published" : "Draft"}</span>
                    </div>

                    {rosterData?.status === "published" && weekAwaitingProposals.length > 0 && (
                      <div className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warn/15 text-warn border border-warn/30 flex flex-row items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-warn" />
                        <span><span className="font-num font-bold">{weekAwaitingProposals.length}</span> awaiting acceptance</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("changes");
                            setStatusFilter("awaiting employee");
                          }}
                          className="ml-1 underline font-bold hover:text-ink text-[10.5px]"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Group */}
              <div className="flex flex-row flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employee..."
                    className="pl-7 pr-3 py-1.5 rounded-lg border border-line bg-surface2 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent w-36 sm:w-44 transition"
                  />
                  <svg className="w-3.5 h-3.5 text-muted absolute left-2 top-2.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                {/* Department Select */}
                {departments.length > 0 && (
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-line bg-surface2 text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {/* HR Action Buttons (Week view only) */}
                {isHR && viewMode === "week" && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyLastWeek}
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface2 hover:border-accent text-xs font-semibold text-ink transition shadow-sm"
                    >
                      Copy last week
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface2 hover:border-warn text-xs font-semibold text-muted hover:text-warn transition shadow-sm"
                    >
                      Reset to default
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishClick}
                      className="px-3 py-1.5 rounded-lg bg-accent text-on-accent font-semibold text-xs hover:opacity-90 transition shadow-sm flex flex-row items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Publish week</span>
                    </button>
                  </>
                )}

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 rounded-lg border border-line bg-surface2 hover:border-accent text-xs font-semibold text-ink transition shadow-sm flex flex-row items-center gap-1.5"
                >
                  <Icon name="download" className="w-3.5 h-3.5 text-accent" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= ROSTER GRID TABLE (సెల్స్ చుట్టూ బాక్సులు లేకుండా క్లీన్ లుక్) ================= */}
          <div className="glass-card !p-0 overflow-hidden border-0 bg-transparent">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border-spacing-0">
                <thead>
                  <tr className="text-muted uppercase text-[10.5px] tracking-wider font-semibold border-b border-line/40">
                    <th className="py-3 px-4 min-w-[220px]">Employee</th>
                    {currentRange.dates.map((dateKey, idx) => {
                      const d = new Date(`${dateKey}T12:00:00+05:30`);
                      const dayName = WEEKDAY_NAMES_SHORT[(d.getDay() + 6) % 7];
                      const dayNum = d.getDate();
                      return (
                        <th key={dateKey} className="py-3 px-2 text-center min-w-[90px]">
                          <div className="text-muted">{dayName}</div>
                          <div className="text-ink font-num font-bold text-xs">{dayNum}</div>
                        </th>
                      );
                    })}
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/20">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={currentRange.dates.length + 2} className="py-12 text-center text-muted">
                        No employees match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map(row => (
                      <tr key={row.employeeId} className="hover:bg-surface2/20 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.name} employeeId={row.employeeId} size="sm" photoUrl={row.avatarUrl} />
                            <div>
                              <div className="font-semibold text-ink text-xs">{row.name}</div>
                              <div className="text-[10.5px] text-muted">
                                <span className="font-mono">{row.employeeId}</span> · {row.dept}
                              </div>
                            </div>
                          </div>
                        </td>

                        {currentRange.dates.map(dateKey => {
                          const cell = row.cells[dateKey] || { code: "WO" };
                          const isWO = cell.code === "WO";
                          const isLV = cell.code === "LV";

                          return (
                            <td
                              key={dateKey}
                              onClick={(e) => handleCellClick(e, row, dateKey, cell)}
                              className={`py-3 px-2 text-center select-none ${isHR && viewMode === "week" ? "cursor-pointer hover:bg-accent/5 transition" : ""}`}
                            >
                              {/* GEN/WO కోడ్స్ చుట్టూ ఉన్న బాక్సెస్ పూర్తిగా తొలగించబడ్డాయి */}
                              <span className={`inline-block text-[11px] font-mono font-bold tracking-wide ${
                                isWO
                                  ? "text-muted/60"
                                  : isLV
                                  ? "text-warn"
                                  : "text-accent"
                              }`}>
                                {cell.code}
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setRowMenu({ employee: row })}
                            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
                            title="More options"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};