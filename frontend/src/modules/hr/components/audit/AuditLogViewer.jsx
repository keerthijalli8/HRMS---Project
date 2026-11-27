import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from '../Icon.jsx';
import { SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import {
  loadAuditEvents,
  subscribeAudit,
  getAuditStats,
  aggregateSessions,
  aggregatePageVisits,
  exportAuditLogsToCsv,
  formatKolkataTimeOnly,
  canUserViewAudit
} from '../../services/auditService.js';
import { employeeData } from '../../data/mockData.js';

export const AuditLogViewer = ({
  employeeId = null, // If provided, filters to this employee. If null, global mode.
  employeeName = null,
  currentUser,
  isGlobal = false,
  onNavigateEmployee
}) => {
  // Permission Check
  const hasAccess = useMemo(() => {
    if (isGlobal) {
      const role = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
      return role.includes("admin") || role.includes("hr");
    }
    return canUserViewAudit(currentUser, employeeId);
  }, [currentUser, employeeId, isGlobal]);

  // Master events list from storage
  const [allEvents, setAllEvents] = useState(() => loadAuditEvents());
  const [dismissedNotice, setDismissedNotice] = useState(() => {
    try {
      return localStorage.getItem("hrdesk_audit_notice_dismissed") === "true";
    } catch (e) {
      return false;
    }
  });

  // Active View / Sub-tab: "timeline" | "table" | "sessions" | "pages"
  const [activeView, setActiveView] = useState("timeline");

  // Filters State (Synced with URL if available)
  const [dateRange, setDateRange] = useState("last7"); // "today" | "yesterday" | "last7" | "last30" | "custom"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState("All"); // In global mode

  // Expanded items in timeline & sessions
  const [expandedEventIds, setExpandedEventIds] = useState(new Set());
  const [expandedSessionIds, setExpandedSessionIds] = useState(new Set());

  // Table sorting & column visibility
  const [tableSortField, setTableSortField] = useState("time");
  const [tableSortAsc, setTableSortAsc] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    time: true,
    action: true,
    module: true,
    description: true,
    target: true,
    ip: true,
    device: true,
    status: true
  });
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);

  // Pagination / Chunking
  const [visibleCount, setVisibleCount] = useState(50);
  const scrollContainerRef = useRef(null);

  // Subscribe to live audit updates
  useEffect(() => {
    const unsub = subscribeAudit(() => {
      setAllEvents(loadAuditEvents());
    });
    return unsub;
  }, []);

  // Filter events by employee scope
  const scopedEvents = useMemo(() => {
    if (employeeId) {
      return allEvents.filter(e => e.employeeId === employeeId);
    }
    if (isGlobal && selectedEmployeeFilter !== "All") {
      return allEvents.filter(e => e.employeeId === selectedEmployeeFilter);
    }
    return allEvents;
  }, [allEvents, employeeId, isGlobal, selectedEmployeeFilter]);

  // Apply Date Range, Category, Action, Status & Search Filters
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return scopedEvents.filter(event => {
      // 1. Date Range
      if (dateRange === "today") {
        if (!event.iso?.startsWith(todayStr)) return false;
      } else if (dateRange === "yesterday") {
        if (!event.iso?.startsWith(yesterdayStr)) return false;
      } else if (dateRange === "last7") {
        if (new Date(event.iso) < sevenDaysAgo) return false;
      } else if (dateRange === "last30") {
        if (new Date(event.iso) < thirtyDaysAgo) return false;
      } else if (dateRange === "custom") {
        if (customStartDate && new Date(event.iso) < new Date(customStartDate)) return false;
        if (customEndDate && new Date(event.iso) > new Date(customEndDate + "T23:59:59")) return false;
      }

      // 2. Category
      if (selectedCategory !== "All" && event.category !== selectedCategory) {
        return false;
      }

      // 3. Action
      if (selectedAction !== "All" && event.action !== selectedAction) {
        return false;
      }

      // 4. Status
      if (selectedStatus !== "All" && event.status !== selectedStatus) {
        return false;
      }

      // 5. Search Text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = (event.description || "").toLowerCase().includes(q);
        const matchesMod = (event.module || "").toLowerCase().includes(q);
        const matchesAct = (event.action || "").toLowerCase().includes(q);
        const matchesEmp = (event.employeeName || "").toLowerCase().includes(q) || (event.employeeId || "").toLowerCase().includes(q);
        const matchesTarget = (event.target?.name || event.target?.id || "").toLowerCase().includes(q);
        const matchesIp = (event.ip || "").toLowerCase().includes(q);
        if (!matchesDesc && !matchesMod && !matchesAct && !matchesEmp && !matchesTarget && !matchesIp) {
          return false;
        }
      }

      return true;
    });
  }, [
    scopedEvents,
    dateRange,
    customStartDate,
    customEndDate,
    selectedCategory,
    selectedAction,
    selectedStatus,
    searchQuery
  ]);

  // Summary Metrics computed over the filtered result
  const stats = useMemo(() => getAuditStats(filteredEvents), [filteredEvents]);

  // Aggregated Sessions
  const sessions = useMemo(() => aggregateSessions(filteredEvents), [filteredEvents]);

  // Aggregated Page Visits
  const pageVisits = useMemo(() => aggregatePageVisits(filteredEvents), [filteredEvents]);

  // Unique Action Types for Filter Dropdown
  const uniqueActionOptions = useMemo(() => {
    const set = new Set(scopedEvents.map(e => e.action));
    return ["All", ...Array.from(set).sort()];
  }, [scopedEvents]);

  // Grouped Timeline: Day Header -> Events
  const groupedTimeline = useMemo(() => {
    const groups = [];
    const map = new Map();

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    filteredEvents.slice(0, visibleCount).forEach(event => {
      const dayKey = (event.iso || "").slice(0, 10);
      let dayTitle = dayKey;
      if (dayKey === todayStr) {
        dayTitle = "Today";
      } else if (dayKey === yesterdayStr) {
        dayTitle = "Yesterday";
      } else if (dayKey) {
        try {
          dayTitle = new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).format(new Date(dayKey));
        } catch (e) {
          dayTitle = dayKey;
        }
      }

      if (!map.has(dayKey)) {
        map.set(dayKey, { title: dayTitle, dateKey: dayKey, events: [] });
        groups.push(map.get(dayKey));
      }
      map.get(dayKey).events.push(event);
    });

    return groups;
  }, [filteredEvents, visibleCount]);

  // Sorted Table Events
  const sortedTableEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let valA = a[tableSortField] || "";
      let valB = b[tableSortField] || "";
      if (tableSortField === "time") {
        valA = new Date(a.iso).getTime();
        valB = new Date(b.iso).getTime();
      }
      if (valA < valB) return tableSortAsc ? -1 : 1;
      if (valA > valB) return tableSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredEvents, tableSortField, tableSortAsc]);

  // Reset Filters
  const handleResetFilters = () => {
    setDateRange("last7");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedCategory("All");
    setSelectedAction("All");
    setSelectedStatus("All");
    setSearchQuery("");
    setSelectedEmployeeFilter("All");
    setVisibleCount(50);
  };

  // Toggle Timeline Event Expansion
  const toggleEventExpand = (id) => {
    setExpandedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Session Expansion
  const toggleSessionExpand = (id) => {
    setExpandedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Dismiss Notice
  const handleDismissNotice = () => {
    setDismissedNotice(true);
    try {
      localStorage.setItem("hrdesk_audit_notice_dismissed", "true");
    } catch (e) {}
  };

  // Category Color Badges
  const getCategoryBadgeClass = (category, isSensitive) => {
    if (isSensitive) return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    switch (category) {
      case "Sessions":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "Attendance":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "Navigation":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "Data changes":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Approvals":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "Files":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Sensitive":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "Settings":
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
      default:
        return "bg-surface2 text-muted border-line";
    }
  };

  // Access Denied State
  if (!hasAccess) {
    return (
      <div className="glass-card !p-10 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Icon name="shield-alert" className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="font-display font-bold text-ink text-base">
          Access Restricted: Activity Log
        </h3>
        <p className="text-xs text-muted max-w-md">
          In compliance with enterprise data governance policies, you can only inspect your own in-app activity timeline or members in your direct reporting line.
        </p>
      </div>
    );
  }

  const isHrOrAdmin = (() => {
    const r = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    return r.includes("admin") || r.includes("hr");
  })();

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* ================= 1. TRANSPARENCY NOTICE BANNER ================= */}
      {!dismissedNotice && (
        <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-between gap-3 text-ink">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-accent/20 text-accent shrink-0">
              <Icon name="shield" className="w-4 h-4 text-accent" />
            </span>
            <div className="text-[12px] leading-relaxed">
              <span className="font-semibold text-ink">In-App Compliance Logging Active: </span>
              <span className="text-muted">
                HR Desk records actions inside this application for security and regulatory compliance. External websites, personal browsing, and keystrokes are never monitored.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismissNotice}
            className="text-muted hover:text-ink text-xs font-semibold px-2 py-1 rounded hover:bg-surface2 transition shrink-0"
            title="Dismiss notice"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================= 2. SUMMARY KPI STATS CARDS (ONE ROW) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Events */}
        <div className="glass-card !p-3 border border-line rounded-xl flex flex-col justify-between">
          <span className="text-[10.5px] uppercase font-semibold text-muted">Total Events</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-display font-extrabold text-xl text-ink font-num">{stats.total}</span>
            <span className="text-[10px] text-muted">in view</span>
          </div>
        </div>

        {/* Last Active */}
        <div className="glass-card !p-3 border border-line rounded-xl flex flex-col justify-between">
          <span className="text-[10.5px] uppercase font-semibold text-muted">Last Active</span>
          <div className="flex flex-col mt-1">
            <span className="font-semibold text-accent truncate text-xs">{stats.lastActiveRelative}</span>
            <span className="text-[10px] text-muted font-mono truncate">{stats.lastActiveExact.split(',')[1] || stats.lastActiveExact}</span>
          </div>
        </div>

        {/* Last Login */}
        <div className="glass-card !p-3 border border-line rounded-xl flex flex-col justify-between">
          <span className="text-[10.5px] uppercase font-semibold text-muted">Last Login</span>
          <div className="flex flex-col mt-1">
            <span className="font-semibold text-ink text-xs truncate">{stats.lastLogin.time.split(',')[0]}</span>
            <span className="text-[10px] text-muted font-mono truncate">{stats.lastLogin.ip}</span>
          </div>
        </div>

        {/* Sessions Today */}
        <div className="glass-card !p-3 border border-line rounded-xl flex flex-col justify-between">
          <span className="text-[10.5px] uppercase font-semibold text-muted">Sessions Today</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-display font-extrabold text-xl text-emerald-400 font-num">{stats.sessionsToday}</span>
            <span className="text-[10px] text-muted">active</span>
          </div>
        </div>

        {/* Sensitive Actions */}
        <div className="glass-card !p-3 border border-line rounded-xl flex flex-col justify-between">
          <span className="text-[10.5px] uppercase font-semibold text-muted">Sensitive Actions</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`font-display font-extrabold text-xl font-num ${stats.sensitiveCount > 0 ? 'text-amber-400' : 'text-ink'}`}>
              {stats.sensitiveCount}
            </span>
            <span className="text-[10px] text-muted">flagged</span>
          </div>
        </div>

        {/* Failed Attempts */}
        <div className="glass-card !p-3 border border-line rounded-xl flex flex-col justify-between">
          <span className="text-[10.5px] uppercase font-semibold text-muted">Failed Attempts</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`font-display font-extrabold text-xl font-num ${stats.failedAttempts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.failedAttempts}
            </span>
            <span className="text-[10px] text-muted">{stats.failedAttempts > 0 ? 'alerts' : 'clean'}</span>
          </div>
        </div>
      </div>

      {/* ================= 3. CONTROLS & FILTER BAR ================= */}
      <div className="glass-card !p-3 border border-line rounded-xl flex flex-col gap-3">
        {/* Top Row: Sub-tab view toggle & Export */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-line/60">
          <div className="flex items-center gap-1 bg-surface2/60 p-1 rounded-xl border border-line">
            {[
              { id: "timeline", label: "Timeline" },
              { id: "table", label: "Table" },
              { id: "sessions", label: `Sessions (${sessions.length})` },
              { id: "pages", label: "Page Visits" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  activeView === tab.id
                    ? "bg-accent text-on-accent shadow-sm"
                    : "text-muted hover:text-ink hover:bg-surface2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Column visibility toggle (table only) */}
            {activeView === "table" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColMenuOpen(!isColMenuOpen)}
                  className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-line text-ink hover:border-accent text-xs font-semibold transition"
                >
                  Columns
                </button>
                {isColMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-surface border border-line rounded-xl shadow-2xl p-2 z-30 flex flex-col gap-1">
                    {Object.keys(visibleColumns).map(col => (
                      <label key={col} className="flex items-center gap-2 px-2 py-1 text-xs text-ink cursor-pointer hover:bg-surface2 rounded">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col]}
                          onChange={(e) => setVisibleColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                          className="accent-accent"
                        />
                        <span className="capitalize">{col}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Export CSV (HR/Admin only) */}
            {isHrOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  const fname = employeeId 
                    ? `audit-${employeeId}-${new Date().toISOString().slice(0, 10)}.csv`
                    : `audit-org-${new Date().toISOString().slice(0, 10)}.csv`;
                  exportAuditLogsToCsv(filteredEvents, fname, currentUser);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Export CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 text-xs font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Bottom Row: Detailed Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Global Mode: Employee Filter ("Who did what") */}
          {isGlobal && (
            <div className="sm:col-span-2">
              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-accent font-semibold text-xs focus:border-accent outline-none"
                title="Filter by employee (Who did what)"
              >
                <option value="All">All Staff Members (Who did what)</option>
                {employeeData.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className={isGlobal ? "sm:col-span-2" : "sm:col-span-2"}>
            <input
              type="text"
              placeholder="Search description, target, IP, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:border-accent outline-none placeholder:text-muted/60"
            />
          </div>

          {/* Date Range Selector */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:border-accent outline-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Module / Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:border-accent outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Sessions">Sessions</option>
              <option value="Attendance">Attendance</option>
              <option value="Navigation">Navigation</option>
              <option value="Data changes">Data Changes</option>
              <option value="Approvals">Approvals</option>
              <option value="Files">Files</option>
              <option value="Sensitive">Sensitive Access</option>
              <option value="Settings">Settings</option>
            </select>
          </div>

          {/* Action Type Selector */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:border-accent outline-none"
            >
              {uniqueActionOptions.map(act => (
                <option key={act} value={act}>
                  {act === "All" ? "All Action Types" : act}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:border-accent outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success Only</option>
              <option value="Failed">Failed / Alerts Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (if Custom selected) */}
        {dateRange === "custom" && (
          <div className="flex items-center gap-2 pt-2 border-t border-line/40">
            <span className="text-muted text-xs">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-surface2 border border-line rounded-lg px-2.5 py-1 text-ink text-xs focus:border-accent outline-none"
            />
            <span className="text-muted text-xs">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-surface2 border border-line rounded-lg px-2.5 py-1 text-ink text-xs focus:border-accent outline-none"
            />
          </div>
        )}
      </div>

      {/* ================= 4. MAIN CONTENT AREA (VIRTUALIZED / CHUNKED SCROLLER) ================= */}
      <div 
        ref={scrollContainerRef}
        className="glass-card !p-0 border border-line rounded-2xl overflow-hidden shadow-xl max-h-[620px] overflow-y-auto relative"
      >
        {/* VIEW A: TIMELINE (DEFAULT) */}
        {activeView === "timeline" && (
          <div className="divide-y divide-line/60">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
                <Icon name="clock" className="w-8 h-8 text-muted/50" />
                <span className="font-semibold text-ink text-sm">No activity recorded for this period</span>
                <span className="text-xs text-muted max-w-sm">
                  Try adjusting the date range or clearing the search filters.
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 text-accent font-semibold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              groupedTimeline.map(group => (
                <div key={group.dateKey} className="flex flex-col">
                  {/* Sticky Day Header */}
                  <div className="sticky top-0 z-10 px-4 py-2 bg-surface2/90 backdrop-blur-md border-b border-line/70 flex items-center justify-between text-xs font-semibold text-ink">
                    <span className="font-display tracking-wide">{group.title}</span>
                    <span className="text-[11px] text-muted font-normal font-num">
                      {group.events.length} event{group.events.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Day Events */}
                  <div className="divide-y divide-line/30">
                    {group.events.map(event => {
                      const isExpanded = expandedEventIds.has(event.id);
                      const badgeClass = getCategoryBadgeClass(event.category, event.isSensitive);

                      return (
                        <div
                          key={event.id}
                          className={`p-3.5 hover:bg-surface2/30 transition flex flex-col gap-2 cursor-pointer ${
                            event.isSensitive ? "bg-rose-500/5" : ""
                          }`}
                          onClick={() => toggleEventExpand(event.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Time + Category Pill + Description */}
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="font-mono text-[11px] text-muted shrink-0 mt-0.5 select-all">
                                {formatKolkataTimeOnly(event.iso)}
                              </span>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${badgeClass}`}>
                                {event.isSensitive ? "Sensitive" : event.category}
                              </span>

                              <div className="flex flex-col min-w-0">
                                <div className="text-xs font-semibold text-ink flex items-center gap-1.5 flex-wrap">
                                  <span>{event.description}</span>
                                  {event.status === "Failed" && (
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      FAILED
                                    </span>
                                  )}
                                  {isGlobal && (
                                    <span className="text-[10.5px] text-muted font-normal">
                                      by <strong className="text-ink">{event.employeeName}</strong> ({event.employeeId})
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                                  <span>{event.module}</span>
                                  <span>&bull;</span>
                                  <span>{event.device}</span>
                                  <span>&bull;</span>
                                  <span className="font-mono">{event.ip}</span>
                                </div>
                              </div>
                            </div>

                            {/* Expand Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEventExpand(event.id);
                              }}
                              className="text-muted hover:text-ink p-1 rounded hover:bg-surface2 transition shrink-0"
                              title={isExpanded ? "Collapse details" : "Expand details"}
                            >
                              <Icon name={isExpanded ? "chevron-up" : "chevron-down"} className="w-4 h-4 text-inherit" />
                            </button>
                          </div>

                          {/* Expanded Full Audit Metadata & Field Diff */}
                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-xl bg-surface2/60 border border-line text-xs flex flex-col gap-2.5 animate-fadeIn">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                <div>
                                  <span className="text-muted block text-[10px] uppercase font-semibold">Event ID</span>
                                  <span className="font-mono text-ink select-all">{event.id}</span>
                                </div>
                                <div>
                                  <span className="text-muted block text-[10px] uppercase font-semibold">Session ID</span>
                                  <span className="font-mono text-ink select-all">{event.sessionId}</span>
                                </div>
                                <div>
                                  <span className="text-muted block text-[10px] uppercase font-semibold">Browser & Engine</span>
                                  <span className="text-ink">{event.browser}</span>
                                </div>
                                <div>
                                  <span className="text-muted block text-[10px] uppercase font-semibold">Location (GeoIP)</span>
                                  <span className="text-ink">{event.location}</span>
                                </div>
                              </div>

                              {/* Target Details */}
                              {event.target && (
                                <div className="p-2 rounded-lg bg-surface border border-line/60 flex items-center gap-2 text-[11px]">
                                  <span className="text-muted font-semibold">Target Entity:</span>
                                  <span className="px-1.5 py-0.2 rounded bg-surface2 text-accent font-semibold">{event.target.type}</span>
                                  {event.target.id && <span className="font-mono text-ink">{event.target.id}</span>}
                                  {event.target.name && <span className="text-muted">({event.target.name})</span>}
                                </div>
                              )}

                              {/* Field-Level Diff Viewer (Old vs New) */}
                              {event.metadata?.diff && event.metadata.diff.length > 0 && (
                                <div className="flex flex-col gap-1.5 mt-1">
                                  <span className="text-[10.5px] uppercase font-semibold text-muted">Field-Level Changes:</span>
                                  <div className="divide-y divide-line/40 rounded-lg border border-line bg-surface overflow-hidden">
                                    {event.metadata.diff.map((d, i) => (
                                      <div key={i} className="p-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <span className="font-semibold text-ink font-mono text-[11px] sm:w-1/4 truncate">
                                          {d.field}
                                        </span>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <span className="line-through text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={String(d.old)}>
                                            {String(d.old)}
                                          </span>
                                          <span className="text-muted">→</span>
                                          <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold truncate max-w-[200px]" title={String(d.new)}>
                                            {String(d.new)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Additional Metadata / Reasons */}
                              {event.metadata?.note && (
                                <div className="text-[11.5px] text-muted italic">
                                  Note: "{event.metadata.note}"
                                </div>
                              )}
                              {event.metadata?.reason && (
                                <div className="text-[11.5px] text-muted">
                                  <strong className="text-ink">Justification: </strong>{event.metadata.reason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Load More Button for Chunked List */}
            {filteredEvents.length > visibleCount && (
              <div className="p-3 text-center bg-surface2/30">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 50)}
                  className="px-4 py-1.5 rounded-lg bg-surface2 border border-line text-ink hover:border-accent text-xs font-semibold transition"
                >
                  Load next 50 events ({filteredEvents.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW B: SORTABLE TABLE */}
        {activeView === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-surface2/90 backdrop-blur-md border-b border-line text-muted uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  {visibleColumns.time && (
                    <th 
                      className="p-3 cursor-pointer hover:text-ink whitespace-nowrap"
                      onClick={() => {
                        setTableSortField("time");
                        setTableSortAsc(!tableSortAsc);
                      }}
                    >
                      Time {tableSortField === "time" ? (tableSortAsc ? "▲" : "▼") : ""}
                    </th>
                  )}
                  {visibleColumns.action && (
                    <th 
                      className="p-3 cursor-pointer hover:text-ink whitespace-nowrap"
                      onClick={() => {
                        setTableSortField("action");
                        setTableSortAsc(!tableSortAsc);
                      }}
                    >
                      Action {tableSortField === "action" ? (tableSortAsc ? "▲" : "▼") : ""}
                    </th>
                  )}
                  {visibleColumns.module && (
                    <th 
                      className="p-3 cursor-pointer hover:text-ink whitespace-nowrap"
                      onClick={() => {
                        setTableSortField("module");
                        setTableSortAsc(!tableSortAsc);
                      }}
                    >
                      Module {tableSortField === "module" ? (tableSortAsc ? "▲" : "▼") : ""}
                    </th>
                  )}
                  {visibleColumns.description && <th className="p-3">Description</th>}
                  {visibleColumns.target && <th className="p-3">Target</th>}
                  {visibleColumns.ip && <th className="p-3 font-mono">IP Address</th>}
                  {visibleColumns.device && <th className="p-3">Device</th>}
                  {visibleColumns.status && (
                    <th 
                      className="p-3 cursor-pointer hover:text-ink"
                      onClick={() => {
                        setTableSortField("status");
                        setTableSortAsc(!tableSortAsc);
                      }}
                    >
                      Status {tableSortField === "status" ? (tableSortAsc ? "▲" : "▼") : ""}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-normal">
                {sortedTableEvents.slice(0, visibleCount).map(ev => (
                  <tr key={ev.id} className="hover:bg-surface2/40 transition">
                    {visibleColumns.time && (
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-muted">
                        {ev.timestamp.split(',')[1] || ev.timestamp}
                      </td>
                    )}
                    {visibleColumns.action && (
                      <td className="p-3 whitespace-nowrap font-semibold text-ink">
                        {ev.action}
                      </td>
                    )}
                    {visibleColumns.module && (
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(ev.category, ev.isSensitive)}`}>
                          {ev.module}
                        </span>
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className="p-3 text-ink max-w-xs truncate" title={ev.description}>
                        {ev.description}
                      </td>
                    )}
                    {visibleColumns.target && (
                      <td className="p-3 whitespace-nowrap text-muted text-[11px]">
                        {ev.target?.id || "—"}
                      </td>
                    )}
                    {visibleColumns.ip && (
                      <td className="p-3 whitespace-nowrap font-mono text-muted text-[11px]">
                        {ev.ip}
                      </td>
                    )}
                    {visibleColumns.device && (
                      <td className="p-3 whitespace-nowrap text-muted text-[11px]">
                        {ev.device}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          ev.status === "Success" 
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW C: SESSIONS SUB-TAB */}
        {activeView === "sessions" && (
          <div className="p-4 flex flex-col gap-3">
            <div className="text-xs text-muted">
              Login sessions recorded inside HR Desk. Each session aggregates user actions from login to logout or inactivity.
            </div>

            <div className="flex flex-col gap-2.5">
              {sessions.map(sess => {
                const isExpanded = expandedSessionIds.has(sess.sessionId);

                return (
                  <div key={sess.sessionId} className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold font-mono text-xs">
                          SES
                        </div>
                        <div>
                          <div className="font-semibold text-ink text-xs flex items-center gap-2">
                            <span>{new Date(sess.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                            <span className="text-[11px] text-muted">({sess.durationStr})</span>
                            {sess.hasSensitive && (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                SENSITIVE ACCESS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted font-mono flex items-center gap-2 mt-0.5">
                            <span>{sess.device}</span>
                            <span>&bull;</span>
                            <span>{sess.ip}</span>
                            <span>&bull;</span>
                            <span>{sess.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">
                          {sess.actionCount} action{sess.actionCount > 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSessionExpand(sess.sessionId)}
                          className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-ink hover:border-accent text-xs font-semibold transition"
                        >
                          {isExpanded ? "Hide Actions" : "View Actions"}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Session Action List */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-line/50 divide-y divide-line/30 text-xs">
                        {sess.actions.map(a => (
                          <div key={a.id} className="py-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10.5px] text-muted">{formatKolkataTimeOnly(a.iso)}</span>
                              <span className="font-semibold text-ink">{a.description}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface2 text-muted border border-line">
                              {a.module}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW D: PAGE VISITS SUB-TAB */}
        {activeView === "pages" && (
          <div className="p-4 flex flex-col gap-4">
            <div className="text-xs text-muted">
              Summary of in-app page visits and estimated time engagement per module.
            </div>

            {/* Top Modules Bar Chart */}
            <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-3">
              <span className="font-display font-bold text-ink text-xs uppercase tracking-wide">
                Most Visited Modules
              </span>
              <div className="flex flex-col gap-2">
                {pageVisits.topModules.map(m => {
                  const maxCount = pageVisits.topModules[0]?.count || 1;
                  const pct = Math.round((m.count / maxCount) * 100);

                  return (
                    <div key={m.module} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{m.module}</span>
                        <span className="text-muted font-num">{m.count} visits</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table of Pages & Time Spent */}
            <div className="rounded-xl border border-line overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface2/90 border-b border-line text-muted uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Page / Route</th>
                    <th className="p-3">Total Visits</th>
                    <th className="p-3">Estimated Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {pageVisits.pages.map(p => (
                    <tr key={p.page} className="hover:bg-surface2/30">
                      <td className="p-3 font-semibold text-ink capitalize">{p.page}</td>
                      <td className="p-3 font-num text-muted">{p.visits}</td>
                      <td className="p-3 font-num text-accent font-semibold">{p.timeFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= 5. PERMANENT COMPLIANCE FOOTER ================= */}
      <div className="flex items-center justify-between text-[11px] text-muted pt-1">
        <span>Audit logs are read-only and cannot be modified.</span>
        <span>ISO 27001 & SOC-2 Type II Compliant</span>
      </div>
    </div>
  );
};
