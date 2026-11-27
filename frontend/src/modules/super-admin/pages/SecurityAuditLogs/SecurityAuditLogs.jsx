
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileClock,
  FilterX,
  KeyRound,
  LockKeyhole,
  LogIn,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle
} from "lucide-react";
import "./SecurityAuditLogs.css";

const PAGE_SIZE = 6;

const initialLogs = [
  {
    id: 1,
    activity: "Admin Login",
    user: "Admin One",
    module: "Authentication",
    category: "Login History",
    action: "Login",
    date: "23 Nov 2026, 09:30 AM",
    timestamp: "2026-11-23T09:30:00",
    ip: "192.168.1.10",
    result: "Success",
    severity: "Low",
    details: "Administrator signed in successfully."
  },
  {
    id: 2,
    activity: "Subscription Plan Updated",
    user: "Super Admin",
    module: "Subscription Management",
    category: "Administrative Activities",
    action: "Update",
    date: "22 Nov 2026, 03:15 PM",
    timestamp: "2026-11-22T15:15:00",
    ip: "192.168.1.11",
    result: "Success",
    severity: "Low",
    details: "Subscription plan configuration was updated."
  },
  {
    id: 3,
    activity: "Failed Login Attempt",
    user: "Unknown User",
    module: "Authentication",
    category: "Login History",
    action: "Login",
    date: "22 Nov 2026, 11:10 AM",
    timestamp: "2026-11-22T11:10:00",
    ip: "192.168.1.50",
    result: "Failed",
    severity: "High",
    details: "A login attempt was rejected."
  },
  {
    id: 4,
    activity: "Organization Created",
    user: "Super Admin",
    module: "Organization Details",
    category: "Administrative Activities",
    action: "Create",
    date: "21 Nov 2026, 02:20 PM",
    timestamp: "2026-11-21T14:20:00",
    ip: "192.168.1.11",
    result: "Success",
    severity: "Low",
    details: "A new organization record was created."
  },
  {
    id: 5,
    activity: "User Role Updated",
    user: "Super Admin",
    module: "Platform Users",
    category: "Role & Permission Changes",
    action: "Update",
    date: "21 Nov 2026, 11:45 AM",
    timestamp: "2026-11-21T11:45:00",
    ip: "192.168.1.11",
    result: "Success",
    severity: "Medium",
    details: "A platform user's assigned role was changed."
  },
  {
    id: 6,
    activity: "Unauthorized Access Attempt",
    user: "Unknown User",
    module: "Platform Users",
    category: "Security Alerts",
    action: "Access Denied",
    date: "20 Nov 2026, 04:10 PM",
    timestamp: "2026-11-20T16:10:00",
    ip: "192.168.1.51",
    result: "Failed",
    severity: "High",
    details: "An attempt to access a restricted module was denied."
  },
  {
    id: 7,
    activity: "Tenant Suspended",
    user: "Super Admin",
    module: "Tenant Management",
    category: "Administrative Activities",
    action: "Suspend",
    date: "20 Nov 2026, 12:30 PM",
    timestamp: "2026-11-20T12:30:00",
    ip: "192.168.1.11",
    result: "Success",
    severity: "Medium",
    details: "A tenant was placed into suspended status."
  },
  {
    id: 8,
    activity: "Permission Configuration Changed",
    user: "Admin One",
    module: "Platform Users",
    category: "Role & Permission Changes",
    action: "Update",
    date: "19 Nov 2026, 10:20 AM",
    timestamp: "2026-11-19T10:20:00",
    ip: "192.168.1.10",
    result: "Success",
    severity: "Medium",
    details: "Role permissions were modified."
  },
  {
    id: 9,
    activity: "Admin Logout",
    user: "Admin One",
    module: "Authentication",
    category: "Login History",
    action: "Logout",
    date: "19 Nov 2026, 06:00 PM",
    timestamp: "2026-11-19T18:00:00",
    ip: "192.168.1.10",
    result: "Success",
    severity: "Low",
    details: "Administrator signed out."
  },
  {
    id: 10,
    activity: "Billing Record Updated",
    user: "Super Admin",
    module: "Billing",
    category: "Administrative Activities",
    action: "Update",
    date: "18 Nov 2026, 02:40 PM",
    timestamp: "2026-11-18T14:40:00",
    ip: "192.168.1.11",
    result: "Success",
    severity: "Low",
    details: "A billing record was updated."
  },
  {
    id: 11,
    activity: "Repeated Failed Login",
    user: "Unknown User",
    module: "Authentication",
    category: "Security Alerts",
    action: "Login",
    date: "18 Nov 2026, 09:15 AM",
    timestamp: "2026-11-18T09:15:00",
    ip: "192.168.1.52",
    result: "Failed",
    severity: "High",
    details: "Repeated failed login attempts were recorded."
  },
  {
    id: 12,
    activity: "Platform Module Updated",
    user: "Admin One",
    module: "Module Management",
    category: "Administrative Activities",
    action: "Update",
    date: "17 Nov 2026, 03:35 PM",
    timestamp: "2026-11-17T15:35:00",
    ip: "192.168.1.10",
    result: "Success",
    severity: "Low",
    details: "Platform module configuration was updated."
  }
];

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "all", label: "All Audit Logs", icon: FileClock },
  { id: "login", label: "Login History", icon: LogIn },
  { id: "admin", label: "Admin Activities", icon: Users },
  { id: "roles", label: "Role & Permissions", icon: KeyRound },
  { id: "alerts", label: "Security Alerts", icon: ShieldAlert }
];

const CATEGORY_BY_TAB = {
  login: "Login History",
  admin: "Administrative Activities",
  roles: "Role & Permission Changes",
  alerts: "Security Alerts"
};

const getLogId = (id) => `LOG-${String(id).padStart(4, "0")}`;

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function SecurityAuditLogs() {
  const [searchParams] = useSearchParams();
  const [logs] = useState(initialLogs);
  const requestedTab = searchParams.get("tab");
  const validTabs = TABS.map((tab) => tab.id);
  const initialTab = validTabs.includes(requestedTab) ? requestedTab : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filter, setFilter] = useState(["Success", "Failed"].includes(searchParams.get("status")) ? searchParams.get("status") : "All");
  const [severityFilter, setSeverityFilter] = useState(["Low", "Medium", "High"].includes(searchParams.get("severity")) ? searchParams.get("severity") : "All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    setActiveTab(validTabs.includes(nextTab) ? nextTab : "overview");
    setSearch(searchParams.get("search") || "");
    setFilter(["Success", "Failed"].includes(searchParams.get("status")) ? searchParams.get("status") : "All");
    setSeverityFilter(["Low", "Medium", "High"].includes(searchParams.get("severity")) ? searchParams.get("severity") : "All");
    setModuleFilter("All");
    setDateFilter("");
    setPage(1);
  }, [searchParams]);

  const modules = useMemo(
    () => [...new Set(logs.map((log) => log.module))].sort(),
    [logs]
  );

  const sortedLogs = useMemo(
    () =>
      [...logs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [logs]
  );

  const stats = useMemo(
    () => ({
      total: logs.length,
      success: logs.filter((log) => log.result === "Success").length,
      failed: logs.filter((log) => log.result === "Failed").length,
      alerts: logs.filter((log) => log.severity === "High").length,
      logins: logs.filter((log) => log.category === "Login History").length,
      changes: logs.filter(
        (log) => log.category === "Role & Permission Changes"
      ).length
    }),
    [logs]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const category = CATEGORY_BY_TAB[activeTab];

    return sortedLogs.filter((log) => {
      const matchesTab = !category || log.category === category;

      const searchable = [
        getLogId(log.id),
        log.activity,
        log.user,
        log.module,
        log.category,
        log.action,
        log.ip,
        log.result,
        log.severity
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesTab &&
        (!term || searchable.includes(term)) &&
        (filter === "All" || log.result === filter) &&
        (severityFilter === "All" || log.severity === severityFilter) &&
        (moduleFilter === "All" || log.module === moduleFilter) &&
        (!dateFilter || log.timestamp.slice(0, 10) === dateFilter)
      );
    });
  }, [sortedLogs, activeTab, search, filter, severityFilter, moduleFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleLogs = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const changeTab = (id) => {
    setActiveTab(id);
    setSearch("");
    setFilter("All");
    setSeverityFilter("All");
    setModuleFilter("All");
    setDateFilter("");
    setPage(1);
  };

  const openFilteredRecords = (tab, { search: query = "", severity = "All" } = {}) => {
    setActiveTab(tab);
    setSearch(query);
    setFilter("All");
    setSeverityFilter(severity);
    setModuleFilter("All");
    setDateFilter("");
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("All");
    setSeverityFilter("All");
    setModuleFilter("All");
    setDateFilter("");
    setPage(1);
  };

  const applyStatFilter = (kind) => {
    setActiveTab("all");
    setSearch("");
    setFilter(kind === "success" ? "Success" : kind === "failed" ? "Failed" : "All");
    setSeverityFilter(kind === "high" ? "High" : "All");
    setModuleFilter("All");
    setDateFilter("");
    setPage(1);
  };

  const exportLogs = () => {
    const headers = [
      "Log ID",
      "Activity",
      "User",
      "Module",
      "Category",
      "Action",
      "Date & Time",
      "IP Address",
      "Result",
      "Severity",
      "Details"
    ];

    const rows = filtered.map((log) => [
      getLogId(log.id),
      log.activity,
      log.user,
      log.module,
      log.category,
      log.action,
      log.date,
      log.ip,
      log.result,
      log.severity,
      log.details
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "security-audit-logs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const renderTable = () => (
    <section className="sal-panel">
      <div className="sal-panel-heading">
        <div>
          <h2>
            {TABS.find((tab) => tab.id === activeTab)?.label || "Audit Logs"}
          </h2>
          <p>Read-only platform activity records</p>
        </div>
        <span className="sal-count">{filtered.length} records</span>
      </div>

      <div className="sal-toolbar">
        <div className="sal-search">
          <Search size={17} />
          <input
            aria-label="Search audit logs"
            placeholder="Search logs, users, activities, IP..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          aria-label="Filter by result"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Results</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          aria-label="Filter by severity"
          value={severityFilter}
          onChange={(event) => {
            setSeverityFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Severities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select
          aria-label="Filter by module"
          value={moduleFilter}
          onChange={(event) => {
            setModuleFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>

        <input
          className="sal-date"
          aria-label="Filter by date"
          type="date"
          value={dateFilter}
          onChange={(event) => {
            setDateFilter(event.target.value);
            setPage(1);
          }}
        />

        <button
          type="button"
          className="sal-clear"
          onClick={clearFilters}
        >
          <FilterX size={16} />
          Clear
        </button>
      </div>

      <div className="sal-table-wrap">
        <table className="sal-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Activity</th>
              <th>Performed By</th>
              <th>Module</th>
              <th>Date & Time</th>
              <th>IP Address</th>
              <th>Result</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log) => (
              <tr key={log.id}>
                <td className="sal-id">{getLogId(log.id)}</td>
                <td>
                  <div className="sal-activity">
                    <strong>{log.activity}</strong>
                    <small>{log.action}</small>
                  </div>
                </td>
                <td>{log.user}</td>
                <td>{log.module}</td>
                <td>{log.date}</td>
                <td>{log.ip}</td>
                <td>
                  <span className={`sal-result ${log.result.toLowerCase()}`}>
                    {log.result}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="sal-view"
                    onClick={() => setSelectedLog(log)}
                    title="View event details"
                  >
                    <Eye size={17} />
                  </button>
                </td>
              </tr>
            ))}

            {visibleLogs.length === 0 && (
              <tr>
                <td colSpan={8} className="sal-empty">
                  No audit events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sal-pagination">
        <span>
          Showing {filtered.length ? startIndex + 1 : 0}–
          {Math.min(startIndex + PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length} records
        </span>

        <div className="sal-pagination-actions">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="sal-page">
      <div className="sal-header">
        <div>
          <div className="sal-breadcrumb">
            Super Admin / Security & Audit Logs
          </div>
          <h1>Security & Audit Logs</h1>
          <p>
            Review platform-level administrative activities and security events.
          </p>
        </div>

        <button
          type="button"
          className="sal-export"
          onClick={exportLogs}
        >
          <Download size={17} />
          Export Logs
        </button>
      </div>

      {/* Navigation tabs placed above KPI cards */}
      <div className="sal-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`sal-tab sa-pill-kpi ${activeTab === id ? "active" : ""}`}
            onClick={() => changeTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="sal-stats">
        <button type="button" className="sal-stat" onClick={() => applyStatFilter("all")}>
          <div className="sal-stat-top">
            <span>Total Events</span>
            <Activity size={19} />
          </div>
          <strong>{stats.total}</strong>
          <small>Recorded activities</small>
        </button>

        <button type="button" className="sal-stat" onClick={() => applyStatFilter("success")}>
          <div className="sal-stat-top">
            <span>Successful Events</span>
            <CheckCircle2 size={19} />
          </div>
          <strong>{stats.success}</strong>
          <small>Completed activities</small>
        </button>

        <button type="button" className="sal-stat" onClick={() => applyStatFilter("failed")}>
          <div className="sal-stat-top">
            <span>Failed Events</span>
            <XCircle size={19} />
          </div>
          <strong>{stats.failed}</strong>
          <small>Unsuccessful activities</small>
        </button>

        <button type="button" className="sal-stat" onClick={() => applyStatFilter("high")}>
          <div className="sal-stat-top">
            <span>High Severity</span>
            <AlertTriangle size={19} />
          </div>
          <strong>{stats.alerts}</strong>
          <small>High-priority events</small>
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="sal-overview-grid">
            <section className="sal-panel">
              <div className="sal-panel-heading">
                <div>
                  <h2>Security Overview</h2>
                  <p>Summary of platform security events</p>
                </div>
                <ShieldCheck size={20} className="sal-accent-icon" />
              </div>

              <div className="sal-summary-list">
                <button
                  type="button"
                  className="sal-summary-filter"
                  onClick={() => openFilteredRecords("login")}
                >
                  <span>
                    <LogIn size={17} /> Login / Logout Events
                  </span>
                  <strong>{stats.logins}</strong>
                </button>
                <button
                  type="button"
                  className="sal-summary-filter"
                  onClick={() => openFilteredRecords("roles")}
                >
                  <span>
                    <KeyRound size={17} /> Role & Permission Changes
                  </span>
                  <strong>{stats.changes}</strong>
                </button>
                <button
                  type="button"
                  className="sal-summary-filter"
                  onClick={() => openFilteredRecords("all", { severity: "High" })}
                >
                  <span>
                    <ShieldAlert size={17} /> High-Severity Events
                  </span>
                  <strong>{stats.alerts}</strong>
                </button>
              </div>
            </section>

            <section className="sal-panel">
              <div className="sal-panel-heading">
                <div>
                  <h2>Recent Security Alerts</h2>
                  <p>High-severity events requiring review</p>
                </div>
                <AlertTriangle size={20} className="sal-warning-icon" />
              </div>

              <div className="sal-alert-list">
                {sortedLogs
                  .filter((log) => log.severity === "High")
                  .slice(0, 3)
                  .map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      className="sal-alert-item"
                      onClick={() => openFilteredRecords("all", { search: log.activity, severity: "High" })}
                    >
                      <ShieldAlert size={18} />
                      <span>
                        <strong>{log.activity}</strong>
                        <small>{log.date}</small>
                      </span>
                      <Eye size={16} />
                    </button>
                  ))}
              </div>
            </section>
          </div>

          <section className="sal-panel sal-recent-panel">
            <div className="sal-panel-heading">
              <div>
                <h2>Recent Platform Activities</h2>
                <p>Latest administrative and security events</p>
              </div>
              <button
                type="button"
                className="sal-text-button"
                onClick={() => changeTab("all")}
              >
                View All Logs
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="sal-recent-list">
              {sortedLogs.slice(0, 5).map((log) => (
                <button
                  type="button"
                  className="sal-recent-item"
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="sal-recent-icon">
                    {log.result === "Success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>

                  <div className="sal-recent-info">
                    <strong>{log.activity}</strong>
                    <small>
                      {log.user} • {log.module}
                    </small>
                  </div>

                  <div className="sal-recent-end">
                    <span className={`sal-result ${log.result.toLowerCase()}`}>
                      {log.result}
                    </span>
                    <small>
                      <Clock3 size={12} /> {log.date}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab !== "overview" && renderTable()}

      {selectedLog && (
        <div
          className="sal-modal-backdrop"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="sal-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sal-modal-header">
              <div>
                <h2>Audit Event Details</h2>
                <p>{getLogId(selectedLog.id)}</p>
              </div>

              <button
                type="button"
                className="sal-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="sal-detail-grid">
              {[
                ["Activity", selectedLog.activity],
                ["Performed By", selectedLog.user],
                ["Module", selectedLog.module],
                ["Category", selectedLog.category],
                ["Action", selectedLog.action],
                ["Date & Time", selectedLog.date],
                ["IP Address", selectedLog.ip],
                ["Result", selectedLog.result],
                ["Severity", selectedLog.severity]
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="sal-detail-description">
              <span>Description</span>
              <p>{selectedLog.details}</p>
            </div>

            <div className="sal-modal-footer">
              <LockKeyhole size={15} />
              Read-only audit event
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
