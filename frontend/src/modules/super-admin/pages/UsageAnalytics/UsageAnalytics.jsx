
import React, { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Gauge,
  HardDrive,
  LayoutDashboard,
  Search,
  Server,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Layers3,
  FileText,
  Clock3,
  Wifi,
  ArrowUpRight,
  Filter,
  X
} from "lucide-react";
import "./UsageAnalytics.css";

// Frontend demonstration data.
// Replace with real API data when backend integration is ready.
const usageData = [
  {
    id: 1,
    company: "ABC Technologies",
    employees: 120,
    storage: 4.2,
    activity: "High",
    module: "Payroll",
    lastActivity: "2026-11-23T10:30:00",
    plan: "Professional",
    apiRequests: 12500,
    apiLimit: 20000,
    storageLimit: 10,
    activeUsers: 98,
    sessions: 1560,
    status: "Active"
  },
  {
    id: 2,
    company: "XYZ Solutions",
    employees: 85,
    storage: 2.8,
    activity: "Medium",
    module: "Attendance",
    lastActivity: "2026-11-22T16:15:00",
    plan: "Starter",
    apiRequests: 7800,
    apiLimit: 10000,
    storageLimit: 5,
    activeUsers: 52,
    sessions: 920,
    status: "Active"
  },
  {
    id: 3,
    company: "Global Systems",
    employees: 340,
    storage: 8.5,
    activity: "High",
    module: "Employee Management",
    lastActivity: "2026-11-21T11:00:00",
    plan: "Enterprise",
    apiRequests: 32500,
    apiLimit: 50000,
    storageLimit: 20,
    activeUsers: 280,
    sessions: 4200,
    status: "Active"
  },
  {
    id: 4,
    company: "Bright Solutions",
    employees: 65,
    storage: 1.5,
    activity: "Low",
    module: "Leave Management",
    lastActivity: "2026-11-20T09:45:00",
    plan: "Starter",
    apiRequests: 3200,
    apiLimit: 10000,
    storageLimit: 5,
    activeUsers: 21,
    sessions: 360,
    status: "Active"
  }
];

const monthlyTrends = [
  { month: "Jun", users: 300, api: 24000, storage: 9.5 },
  { month: "Jul", users: 340, api: 31000, storage: 10.4 },
  { month: "Aug", users: 365, api: 35000, storage: 11.6 },
  { month: "Sep", users: 390, api: 42000, storage: 12.9 },
  { month: "Oct", users: 420, api: 48000, storage: 14.3 },
  { month: "Nov", users: 451, api: 56000, storage: 17 }
];

const moduleUsage = [
  { name: "Employee Management", usage: 92, users: 415, lastActivity: "2026-11-23T10:30:00" },
  { name: "Attendance", usage: 86, users: 388, lastActivity: "2026-11-22T16:15:00" },
  { name: "Payroll", usage: 81, users: 365, lastActivity: "2026-11-21T11:00:00" },
  { name: "Leave Management", usage: 74, users: 334, lastActivity: "2026-11-20T09:45:00" },
  { name: "Reports & Analytics", usage: 62, users: 280, lastActivity: "2026-11-19T13:15:00" },
  { name: "Recruitment", usage: 48, users: 216, lastActivity: "2026-11-18T12:10:00" },
  { name: "Performance", usage: 41, users: 185, lastActivity: "2026-11-17T09:20:00" }
];

const activityData = [
  {
    id: 1,
    event: "API usage threshold reached",
    company: "XYZ Solutions",
    category: "API Usage",
    severity: "Warning",
    date: "2026-11-23T10:30:00"
  },
  {
    id: 2,
    event: "Monthly analytics generated",
    company: "Global Systems",
    category: "Reports",
    severity: "Info",
    date: "2026-11-22T16:15:00"
  },
  {
    id: 3,
    event: "Storage utilization updated",
    company: "ABC Technologies",
    category: "Storage",
    severity: "Info",
    date: "2026-11-21T11:00:00"
  },
  {
    id: 4,
    event: "User activity summary generated",
    company: "Bright Solutions",
    category: "Users",
    severity: "Info",
    date: "2026-11-20T09:45:00"
  }
];

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tenants", label: "Tenant Analytics", icon: Building2 },
  { id: "users", label: "User Analytics", icon: Users },
  { id: "modules", label: "Module Usage", icon: Layers3 },
  { id: "resources", label: "Storage & API", icon: Database },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "history", label: "Activity History", icon: Clock3 }
];

const number = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const percent = (used, limit) =>
  limit > 0 ? (used / limit) * 100 : 0;

const formatDate = (value) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
};

function exportCSV(filename, headers, rows) {
  const escapeCell = (value) => {
    let text = String(value ?? "");

    if (/^[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatCard({ title, value, subtitle, icon: Icon, tone, onClick }) {
  return (
    <button
      type="button"
      className={`ua-stat-card ${tone || ""}`}
      onClick={onClick}
    >
      <div className="ua-stat-top">
        <span>{title}</span>
        <span className="ua-stat-icon">
          <Icon size={20} />
        </span>
      </div>

      <strong>{value}</strong>
      <small>{subtitle}</small>
    </button>
  );
}

function Panel({ title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="ua-panel">
      <div className="ua-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="ua-panel-head-actions">
          {action}
          {Icon && <Icon size={19} />}
        </div>
      </div>

      {children}
    </section>
  );
}

function ProgressRow({
  label,
  value,
  max = 100,
  suffix = "%",
  warning = false,
  onClick
}) {
  const width = Math.min(100, Math.max(0, percent(value, max)));
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`ua-bar-row ${onClick ? "ua-bar-row-clickable" : ""}`}
      onClick={onClick}
    >
      <div>
        <span>{label}</span>
        <strong>
          {number(value)}
          {suffix}
        </strong>
      </div>

      <div className="ua-track">
        <div
          className={warning ? "ua-warning-bar" : ""}
          style={{ width: `${width}%` }}
        />
      </div>
    </Tag>
  );
}

function UsageTrend({ data, field, suffix = "" }) {
  const max = Math.max(1, ...data.map((item) => item[field]));

  return (
    <div className="ua-chart">
      <div className="ua-chart-bars">
        {data.map((item) => (
          <div className="ua-chart-column" key={item.month}>
            <span className="ua-chart-value">
              {number(item[field])}
              {suffix}
            </span>

            <div className="ua-chart-track">
              <div
                style={{
                  height: `${Math.max(
                    3,
                    percent(item[field], max)
                  )}%`
                }}
              />
            </div>

            <small>{item.month}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsageTable({ rows, onView }) {
  return (
    <div className="ua-table-wrap">
      <table className="ua-table">
        <thead>
          <tr>
            <th>Organization</th>
            <th>Plan</th>
            <th>Employees</th>
            <th>Active Users</th>
            <th>Storage</th>
            <th>API Requests</th>
            <th>Activity</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.company}</strong>
              </td>
              <td>{item.plan}</td>
              <td>{number(item.employees)}</td>
              <td>{number(item.activeUsers)}</td>
              <td>{item.storage.toFixed(1)} GB</td>
              <td>{number(item.apiRequests)}</td>
              <td>
                <span
                  className={`ua-activity ${item.activity.toLowerCase()}`}
                >
                  {item.activity}
                </span>
              </td>
              <td>
                <button
                  className="ua-small-button"
                  type="button"
                  onClick={() => onView(item)}
                >
                  View
                  <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td colSpan={8} className="ua-empty">
                No organizations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function UsageAnalytics() {
  const [tab, setTab] = useState("overview");
  const [activeKpi, setActiveKpi] = useState(null);
  const [moduleNameFilter, setModuleNameFilter] = useState("");
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [period, setPeriod] = useState("6");
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [trendMetric, setTrendMetric] = useState("users");
  const [trendCompany, setTrendCompany] = useState("All");
  const [trendModule, setTrendModule] = useState("All");
  const [reportCategory, setReportCategory] = useState("organizations");
  const [reportType, setReportType] = useState("detail");
  const [reportCompany, setReportCompany] = useState("All");
  const [reportModule, setReportModule] = useState("All");
  const [reportStatus, setReportStatus] = useState("All");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportError, setReportError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyCompany, setHistoryCompany] = useState("All");
  const [historyCategory, setHistoryCategory] = useState("All");
  const [historySeverity, setHistorySeverity] = useState("All");
  const [historyStart, setHistoryStart] = useState("");
  const [historyEnd, setHistoryEnd] = useState("");

  const metrics = useMemo(() => {
    return usageData.reduce(
      (acc, item) => {
        acc.employees += item.employees;
        acc.activeUsers += item.activeUsers;
        acc.storage += item.storage;
        acc.storageLimit += item.storageLimit;
        acc.api += item.apiRequests;
        acc.apiLimit += item.apiLimit;
        acc.sessions += item.sessions;
        return acc;
      },
      {
        employees: 0,
        activeUsers: 0,
        storage: 0,
        storageLimit: 0,
        api: 0,
        apiLimit: 0,
        sessions: 0
      }
    );
  }, []);

  const filtered = useMemo(() => {
    return usageData.filter(
      (item) =>
        item.company
          .toLowerCase()
          .includes(search.trim().toLowerCase()) &&
        (activityFilter === "All" ||
          item.activity === activityFilter) &&
        (planFilter === "All" || item.plan === planFilter) &&
        (!activeKpi ||
          activeKpi.filter === "all" ||
          (activeKpi.filter === "quota" &&
            (percent(item.apiRequests, item.apiLimit) >= 75 ||
              percent(item.storage, item.storageLimit) >= 75)) ||
          (activeKpi.filter === "activeUsers" && item.activeUsers > 0) ||
          (activeKpi.filter === "storage" && item.storage > 0) ||
          (activeKpi.filter === "api" && item.apiRequests > 0) ||
          (activeKpi.filter === "employees" && item.employees > 0) ||
          (activeKpi.filter === "sessions" && item.sessions > 0))
    );
  }, [search, activityFilter, planFilter, activeKpi]);

  const filteredModules = useMemo(
    () =>
      moduleUsage.filter((item) => {
        if (!moduleNameFilter) return true;
        if (moduleNameFilter === "high-adoption") return item.usage >= 80;
        return item.name === moduleNameFilter;
      }),
    [moduleNameFilter]
  );

  const reportRows = useMemo(() => {
    let rows;

    if (reportCategory === "organizations") {
      rows = usageData.map((item) => ({
        company: item.company,
        module: item.module,
        record: `${item.plan} plan usage`,
        value: `${number(item.activeUsers)} / ${number(item.employees)} active users`,
        status: item.status,
        date: item.lastActivity
      }));
    } else if (reportCategory === "modules") {
      rows = moduleUsage.map((item, index) => ({
        company: usageData[index % usageData.length].company,
        module: item.name,
        record: `${number(item.users)} users; ${item.usage}% adoption`,
        value: `${item.usage}%`,
        status: item.usage >= 80 ? "High" : item.usage >= 60 ? "Medium" : "Low",
        date: item.lastActivity
      }));
    } else {
      rows = activityData.map((item) => ({
        company: item.company,
        module: item.category,
        record: item.event,
        value: item.severity,
        status: item.severity,
        date: item.date
      }));
    }

    return rows.filter((item) => {
      const date = item.date.slice(0, 10);
      return (
        (reportCompany === "All" || item.company === reportCompany) &&
        (reportModule === "All" || item.module === reportModule) &&
        (reportStatus === "All" || item.status === reportStatus) &&
        (!reportStart || date >= reportStart) &&
        (!reportEnd || date <= reportEnd)
      );
    });
  }, [
    reportCategory,
    reportCompany,
    reportModule,
    reportStatus,
    reportStart,
    reportEnd
  ]);

  const reportDisplayRows = useMemo(() => {
    if (reportType === "detail") return reportRows;

    const summary = new Map();
    reportRows.forEach((item) => {
      const key = `${item.company}\u0000${item.module}`;
      const group = summary.get(key) || {
        company: item.company,
        module: item.module,
        recordCount: 0
      };
      group.recordCount += 1;
      summary.set(key, group);
    });

    return Array.from(summary.values()).map((item) => ({
      company: item.company,
      module: item.module,
      record: `${item.recordCount} matching record${item.recordCount === 1 ? "" : "s"}`,
      value: item.recordCount,
      status: "Summary",
      date:
        reportStart || reportEnd
          ? `${reportStart || "Any"} to ${reportEnd || "Any"}`
          : "All dates"
    }));
  }, [reportRows, reportType, reportStart, reportEnd]);

  const reportModules = Array.from(
    new Set([
      ...moduleUsage.map((item) => item.name),
      ...activityData.map((item) => item.category)
    ])
  );

  const filteredActivity = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return activityData.filter((item) => {
      const date = item.date.slice(0, 10);
      return (
        (!query ||
          item.event.toLowerCase().includes(query) ||
          item.company.toLowerCase().includes(query)) &&
        (historyCompany === "All" || item.company === historyCompany) &&
        (historyCategory === "All" || item.category === historyCategory) &&
        (historySeverity === "All" || item.severity === historySeverity) &&
        (!historyStart || date >= historyStart) &&
        (!historyEnd || date <= historyEnd)
      );
    });
  }, [
    historySearch,
    historyCompany,
    historyCategory,
    historySeverity,
    historyStart,
    historyEnd
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, totalPages);

  const paginated = filtered.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  );

  const trends = useMemo(() => {
    const company = usageData.find((item) => item.company === trendCompany);
    const module = moduleUsage.find((item) => item.name === trendModule);
    const aggregate =
      trendMetric === "users"
        ? metrics.activeUsers
        : trendMetric === "api"
        ? metrics.api
        : metrics.storage;
    const companyValue =
      !company
        ? aggregate
        : trendMetric === "users"
        ? company.activeUsers
        : trendMetric === "api"
        ? company.apiRequests
        : company.storage;
    const companyScale = aggregate ? companyValue / aggregate : 1;
    const moduleScale = module ? module.usage / 100 : 1;

    return monthlyTrends.slice(-Number(period)).map((item) => ({
      ...item,
      [trendMetric]:
        trendCompany === "All" && trendModule === "All"
          ? item[trendMetric]
          : Math.max(1, Math.round(item[trendMetric] * companyScale * moduleScale))
    }));
  }, [period, trendMetric, trendCompany, trendModule, metrics]);

  const storagePercent = percent(
    metrics.storage,
    metrics.storageLimit
  );

  const apiPercent = percent(metrics.api, metrics.apiLimit);

  const activePercent = percent(
    metrics.activeUsers,
    metrics.employees
  );

  const exportOrganizations = () => {
    exportCSV(
      "usage-analytics.csv",
      [
        "Organization",
        "Employees",
        "Storage (GB)",
        "Activity",
        "Plan",
        "Active Users",
        "API Requests",
        "API Limit",
        "Storage Limit (GB)",
        "Sessions"
      ],
      filtered.map((item) => [
        item.company,
        item.employees,
        item.storage,
        item.activity,
        item.plan,
        item.activeUsers,
        item.apiRequests,
        item.apiLimit,
        item.storageLimit,
        item.sessions
      ])
    );
  };

  const exportFilteredReport = () => {
    exportCSV(
      `analytics-${reportCategory}-${reportType}.csv`,
      ["Date", "Organization", "Module / Category", "Record", "Value", "Status"],
      reportDisplayRows.map((item) => [
        item.date,
        item.company,
        item.module,
        item.record,
        item.value,
        item.status
      ])
    );
  };

  const generateReport = () => {
    if (reportStart && reportEnd && reportStart > reportEnd) {
      setReportError("Start date must be on or before the end date.");
      setReportGenerated(false);
      return;
    }

    setReportError("");
    setReportGenerated(true);
  };

  const resetFilters = () => {
    setSearch("");
    setActivityFilter("All");
    setPlanFilter("All");
    setActiveKpi(null);
    setModuleNameFilter("");
    setPage(1);
  };

  const openTab = (next) => {
    setTab(next);
    setPage(1);
  };

  const activateKpi = (title, nextTab, filter = "all") => {
    setActiveKpi({ title, filter });
    setModuleNameFilter("");
    setSearch("");
    setActivityFilter("All");
    setPlanFilter("All");
    openTab(nextTab);
  };

  const tenantFilters = (
    <div className="ua-toolbar">
      <div className="ua-search">
        <Search size={17} />
        <input
          placeholder="Search organization..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <select
        value={planFilter}
        onChange={(event) => {
          setPlanFilter(event.target.value);
          setPage(1);
        }}
        aria-label="Filter by plan"
      >
        <option value="All">All Plans</option>
        <option value="Starter">Starter</option>
        <option value="Professional">Professional</option>
        <option value="Enterprise">Enterprise</option>
      </select>

      <select
        value={activityFilter}
        onChange={(event) => {
          setActivityFilter(event.target.value);
          setPage(1);
        }}
        aria-label="Filter by activity"
      >
        <option value="All">All Activity</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <button
        className="ua-secondary"
        type="button"
        onClick={resetFilters}
      >
        <RefreshCw size={15} />
        Reset
      </button>
    </div>
  );

  return (
    <div className="ua-page">
      <div className="ua-header">
        <div>
          <div className="ua-eyebrow">
            SUPER ADMIN / PLATFORM INSIGHTS
          </div>

          <h1>Usage & Analytics</h1>

          <p>
            Storage, API usage, active users and quota consumption.
          </p>
        </div>

        <button
          className="ua-button"
          type="button"
          onClick={exportOrganizations}
        >
          <Download size={17} />
          Export Report
        </button>
      </div>

      <div
        className="ua-tabs"
        role="tablist"
        aria-label="Analytics sections"
      >
        {TABS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`sa-pill-kpi ${tab === item.id ? "active" : ""}`}
              onClick={() => openTab(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {activeKpi && (
        <div className="ua-active-filter">
          <span>Filtered records: <strong>{activeKpi.title}</strong></span>
          <button type="button" onClick={resetFilters}>
            <X size={14} />
            Clear filter
          </button>
        </div>
      )}

      {tab === "overview" && (
        <>
          <div className="ua-section-heading">
            <div>
              <h2>Platform Usage Overview</h2>
              <p>
                Consolidated analytics across all organizations
              </p>
            </div>
          </div>

          <div className="ua-stats ua-stats-four">
            <StatCard
              title="Total Organizations"
              value={usageData.length}
              subtitle="Registered tenant records"
              icon={Building2}
              onClick={() => activateKpi("Total Organizations", "tenants")}
            />
            <StatCard
              title="Active Users"
              value={number(metrics.activeUsers)}
              subtitle={`${activePercent.toFixed(1)}% of employees`}
              icon={Users}
              tone="teal"
              onClick={() => activateKpi("Active Users", "users", "activeUsers")}
            />
            <StatCard
              title="Storage Used"
              value={`${metrics.storage.toFixed(1)} GB`}
              subtitle={`${storagePercent.toFixed(1)}% of allocated storage`}
              icon={HardDrive}
              tone="purple"
              onClick={() => activateKpi("Storage Used", "resources", "storage")}
            />
            <StatCard
              title="API Requests"
              value={number(metrics.api)}
              subtitle={`${apiPercent.toFixed(1)}% of API quota`}
              icon={Wifi}
              tone="amber"
              onClick={() => activateKpi("API Requests", "resources", "api")}
            />
          </div>

          <div className="ua-stats ua-stats-three">
            <StatCard
              title="Total Employees"
              value={number(metrics.employees)}
              subtitle="Across all organizations"
              icon={Users}
              onClick={() => activateKpi("Total Employees", "tenants", "employees")}
            />
            <StatCard
              title="Recorded Sessions"
              value={number(metrics.sessions)}
              subtitle="Reporting period"
              icon={Activity}
              onClick={() => activateKpi("Recorded Sessions", "users", "sessions")}
            />
            <StatCard
              title="Quota Alerts"
              value={
                usageData.filter(
                  (item) =>
                    percent(
                      item.apiRequests,
                      item.apiLimit
                    ) >= 75 ||
                    percent(
                      item.storage,
                      item.storageLimit
                    ) >= 75
                ).length
              }
              subtitle="Organizations at or above 75%"
              icon={AlertTriangle}
              tone="amber"
              onClick={() => activateKpi("Quota Alerts", "resources", "quota")}
            />
          </div>

          <div className="ua-grid-two">
            <Panel
              title="Platform Usage Trends"
              subtitle="Monthly usage trends"
              icon={TrendingUp}
              action={
                <div className="ua-inline-controls">
                  <select
                    value={trendCompany}
                    onChange={(event) => setTrendCompany(event.target.value)}
                    aria-label="Trend organization"
                  >
                    <option value="All">All organizations</option>
                    {usageData.map((item) => (
                      <option key={item.id} value={item.company}>{item.company}</option>
                    ))}
                  </select>

                  <select
                    value={trendModule}
                    onChange={(event) => setTrendModule(event.target.value)}
                    aria-label="Trend module"
                  >
                    <option value="All">All modules</option>
                    {moduleUsage.map((item) => (
                      <option key={item.name} value={item.name}>{item.name}</option>
                    ))}
                  </select>

                  <select
                    value={trendMetric}
                    onChange={(e) =>
                      setTrendMetric(e.target.value)
                    }
                    aria-label="Trend metric"
                  >
                    <option value="users">
                      Active Users
                    </option>
                    <option value="api">
                      API Requests
                    </option>
                    <option value="storage">
                      Storage (GB)
                    </option>
                  </select>

                  <select
                    value={period}
                    onChange={(e) =>
                      setPeriod(e.target.value)
                    }
                    aria-label="Trend period"
                  >
                    <option value="3">
                      Last 3 Months
                    </option>
                    <option value="6">
                      Last 6 Months
                    </option>
                  </select>
                </div>
              }
            >
              <UsageTrend
                data={trends}
                field={trendMetric}
                suffix={
                  trendMetric === "storage" ? " GB" : ""
                }
              />
            </Panel>

            <Panel
              title="Quota Consumption"
              subtitle="Used capacity versus allocated limits"
              icon={Gauge}
            >
              <ProgressRow
                label="Storage Consumption"
                value={Number(
                  storagePercent.toFixed(1)
                )}
                warning={storagePercent >= 75}
                onClick={() => activateKpi("Storage Consumption", "resources", "storage")}
              />

              <ProgressRow
                label="API Quota Consumption"
                value={Number(apiPercent.toFixed(1))}
                warning={apiPercent >= 75}
                onClick={() => activateKpi("API Quota Consumption", "resources", "api")}
              />

              <ProgressRow
                label="Active User Coverage"
                value={Number(
                  activePercent.toFixed(1)
                )}
                onClick={() => activateKpi("Active User Coverage", "users", "activeUsers")}
              />

              <div className="ua-quota-note">
                <AlertTriangle size={16} />
                Threshold indicators highlight consumption
                at 75% or above.
              </div>
            </Panel>
          </div>

          <div className="ua-grid-two">
            <Panel
              title="Top Modules by Usage"
              subtitle="Adoption across HRMS modules"
              icon={Layers3}
              action={
                <button
                  className="ua-link"
                  type="button"
                  onClick={() => openTab("modules")}
                >
                  View All
                  <ArrowUpRight size={15} />
                </button>
              }
            >
              {moduleUsage.slice(0, 5).map((item) => (
                <ProgressRow
                  key={item.name}
                  label={item.name}
                  value={item.usage}
                  onClick={() => {
                    setModuleNameFilter(item.name);
                    setActiveKpi({ title: `Module: ${item.name}`, filter: "all" });
                    openTab("modules");
                  }}
                />
              ))}
            </Panel>

            <Panel
              title="Organization Activity"
              subtitle="Employee usage by organization"
              icon={Building2}
              action={
                <button
                  className="ua-link"
                  type="button"
                  onClick={() => openTab("tenants")}
                >
                  View All
                  <ArrowUpRight size={15} />
                </button>
              }
            >
              {filtered.map((item) => (
                <ProgressRow
                  key={item.id}
                  label={item.company}
                  value={item.employees}
                  max={Math.max(
                    ...usageData.map((x) => x.employees)
                  )}
                  suffix=""
                  onClick={() => {
                    setSearch(item.company);
                    setActiveKpi({ title: `Employee usage: ${item.company}`, filter: "employees" });
                    openTab("tenants");
                  }}
                />
              ))}
            </Panel>
          </div>

          <Panel
            title="Organization Usage Summary"
            subtitle="Storage, users, API requests and activity by tenant"
            icon={Building2}
            action={
              <button
                className="ua-link"
                type="button"
                onClick={() => openTab("tenants")}
              >
                Manage Analytics
                <ArrowUpRight size={15} />
              </button>
            }
          >
            <UsageTable rows={filtered} onView={setSelectedTenant} />
          </Panel>

          <div className="ua-grid-two">
            <Panel
              title="Subscription Distribution"
              icon={BarChart3}
            >
              {[
                "Starter",
                "Professional",
                "Enterprise"
              ].map((plan) => (
                <ProgressRow
                  key={plan}
                  label={plan}
                  value={
                    filtered.filter(
                      (x) => x.plan === plan
                    ).length
                  }
                  max={filtered.length}
                  suffix=" tenants"
                  onClick={() => {
                    setSearch("");
                    setActivityFilter("All");
                    setPlanFilter(plan);
                    setActiveKpi({ title: `Subscription plan: ${plan}`, filter: "all" });
                    openTab("tenants");
                  }}
                />
              ))}
            </Panel>

            <Panel
              title="Recent Analytics Activity"
              subtitle="Platform analytics events"
              icon={Clock3}
              action={
                <button
                  className="ua-link"
                  type="button"
                  onClick={() => openTab("history")}
                >
                  View All
                  <ArrowUpRight size={15} />
                </button>
              }
            >
              <div className="ua-events">
                {activityData.slice(0, 4).map((item) => (
                  <div
                    className="ua-event"
                    key={item.id}
                  >
                    <span className="ua-event-icon">
                      <Activity size={17} />
                    </span>

                    <div>
                      <strong>{item.event}</strong>
                      <p>{item.company}</p>
                      <small>
                        {formatDate(item.date)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === "tenants" && (
        <>
          <div className="ua-section-heading">
            <div>
              <h2>Tenant Analytics</h2>
              <p>
                Organization-wise platform utilization
              </p>
            </div>
          </div>

          <div className="ua-stats ua-stats-three">
            <StatCard
              title="Total Tenants"
              value={usageData.length}
              subtitle="Registered organizations"
              icon={Building2}
              onClick={() => activateKpi("Total Tenants", "tenants")}
            />
            <StatCard
              title="Total Employees"
              value={number(metrics.employees)}
              subtitle="Across tenants"
              icon={Users}
              onClick={() => activateKpi("Total Employees", "tenants", "employees")}
            />
            <StatCard
              title="Storage Used"
              value={`${metrics.storage.toFixed(1)} GB`}
              subtitle="Across tenants"
              icon={Database}
              onClick={() => activateKpi("Storage Used", "resources", "storage")}
            />
          </div>

          <Panel
            title="Organization Usage"
            subtitle={`Showing ${filtered.length} organizations`}
            icon={Filter}
          >
            {tenantFilters}

            <UsageTable
              rows={paginated}
              onView={setSelectedTenant}
            />

            <div className="ua-pagination">
              <span>
                Page {currentPage} of {totalPages}
              </span>

              <div>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setPage((p) => Math.max(1, p - 1))
                  }
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </Panel>

          <Panel
            title="Employee Usage by Organization"
            icon={BarChart3}
          >
            {filtered.map((item) => (
              <ProgressRow
                key={item.id}
                label={item.company}
                value={item.employees}
                max={Math.max(
                  ...usageData.map((x) => x.employees)
                )}
                suffix=""
                onClick={() => {
                  setSearch(item.company);
                  setActiveKpi({ title: `Employee usage: ${item.company}`, filter: "employees" });
                  openTab("tenants");
                }}
              />
            ))}
          </Panel>
        </>
      )}

      {tab === "users" && (
        <>
          <div className="ua-stats ua-stats-three">
            <StatCard
              title="Total Employees"
              value={number(metrics.employees)}
              subtitle="Employee records"
              icon={Users}
              onClick={() => activateKpi("Total Employees", "tenants", "employees")}
            />
            <StatCard
              title="Active Users"
              value={number(metrics.activeUsers)}
              subtitle="Active user count"
              icon={CheckCircle2}
              onClick={() => activateKpi("Active Users", "users", "activeUsers")}
            />
            <StatCard
              title="Recorded Sessions"
              value={number(metrics.sessions)}
              subtitle="Reporting period"
              icon={Activity}
              onClick={() => activateKpi("Recorded Sessions", "users", "sessions")}
            />
          </div>

          <div className="ua-grid-two">
            <Panel
              title="User Activity Trends"
              subtitle="Monthly active users"
              icon={TrendingUp}
            >
              <UsageTrend
                data={trends}
                field="users"
              />
            </Panel>

            <Panel
              title="Active Users by Tenant"
              icon={Users}
            >
              {filtered.map((item) => (
                <ProgressRow
                  key={item.id}
                  label={item.company}
                  value={item.activeUsers}
                  max={item.employees}
                  suffix={` / ${item.employees}`}
                  onClick={() => {
                    setSearch(item.company);
                    setActiveKpi({ title: `Active users: ${item.company}`, filter: "activeUsers" });
                    openTab("users");
                  }}
                />
              ))}
            </Panel>
          </div>

          <Panel
            title="Filtered User Analytics Records"
            subtitle={`Showing ${filtered.length} organizations`}
            icon={Users}
          >
            <UsageTable rows={filtered} onView={setSelectedTenant} />
          </Panel>
        </>
      )}

      {tab === "modules" && (
        <>
          <div className="ua-stats ua-stats-three">
            <StatCard
              title="Tracked Modules"
              value={moduleUsage.length}
              subtitle="Module records"
              icon={Layers3}
              onClick={() => {
                setModuleNameFilter("");
                activateKpi("Tracked Modules", "modules");
              }}
            />
            <StatCard
              title="Top Module"
              value="Employee Management"
              subtitle="Highest adoption"
              icon={TrendingUp}
              onClick={() => {
                setModuleNameFilter("Employee Management");
                setActiveKpi({ title: "Top Module: Employee Management", filter: "all" });
                openTab("modules");
              }}
            />
            <StatCard
              title="Top Adoption"
              value="92%"
              subtitle="Employee Management"
              icon={Gauge}
              onClick={() => {
                setModuleNameFilter("high-adoption");
                setActiveKpi({ title: "Modules with adoption of 80% or higher", filter: "all" });
                openTab("modules");
              }}
            />
          </div>

          <Panel
            title="HRMS Module Usage"
            subtitle="Module-level adoption and engagement"
            icon={BarChart3}
          >
            {filteredModules.map((item) => (
              <ProgressRow
                key={item.name}
                label={item.name}
                value={item.usage}
                onClick={() => {
                  setModuleNameFilter(item.name);
                  setActiveKpi({ title: `Module: ${item.name}`, filter: "all" });
                  openTab("modules");
                }}
              />
            ))}
          </Panel>

          <Panel
            title="Module Analytics Details"
            icon={Layers3}
          >
            <div className="ua-table-wrap">
              <table className="ua-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Usage</th>
                    <th>Users</th>
                    <th>Adoption</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredModules.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.usage}%</td>
                      <td>{number(item.users)}</td>
                      <td>
                        <span className="ua-activity high">
                          Tracked
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {tab === "resources" && (
        <>
          <div className="ua-stats ua-stats-four">
            <StatCard
              title="Storage Used"
              value={`${metrics.storage.toFixed(1)} GB`}
              subtitle="Consumed storage"
              icon={HardDrive}
              onClick={() => activateKpi("Storage Used", "resources", "storage")}
            />
            <StatCard
              title="Storage Allocated"
              value={`${metrics.storageLimit} GB`}
              subtitle="Total tenant quota"
              icon={Database}
              onClick={() => activateKpi("Storage Allocated", "resources", "storage")}
            />
            <StatCard
              title="API Requests"
              value={number(metrics.api)}
              subtitle="Usage count"
              icon={Wifi}
              onClick={() => activateKpi("API Requests", "resources", "api")}
            />
            <StatCard
              title="API Quota"
              value={number(metrics.apiLimit)}
              subtitle="Total allocated quota"
              icon={Server}
              onClick={() => activateKpi("API Quota", "resources", "api")}
            />
          </div>

          <div className="ua-grid-two">
            <Panel
              title="Storage Consumption by Tenant"
              icon={HardDrive}
            >
              {filtered.map((item) => (
                <ProgressRow
                  key={item.id}
                  label={item.company}
                  value={item.storage}
                  max={item.storageLimit}
                  suffix={` / ${item.storageLimit} GB`}
                  warning={
                    percent(
                      item.storage,
                      item.storageLimit
                    ) >= 75
                  }
                  onClick={() => {
                    setSearch(item.company);
                    setActiveKpi({ title: `Storage consumption: ${item.company}`, filter: "storage" });
                    openTab("resources");
                  }}
                />
              ))}
            </Panel>

            <Panel
              title="API Quota by Tenant"
              icon={Wifi}
            >
              {filtered.map((item) => (
                <ProgressRow
                  key={item.id}
                  label={item.company}
                  value={item.apiRequests}
                  max={item.apiLimit}
                  suffix={` / ${number(item.apiLimit)}`}
                  warning={
                    percent(
                      item.apiRequests,
                      item.apiLimit
                    ) >= 75
                  }
                  onClick={() => {
                    setSearch(item.company);
                    setActiveKpi({ title: `API quota: ${item.company}`, filter: "api" });
                    openTab("resources");
                  }}
                />
              ))}
            </Panel>
          </div>

          <Panel
            title="Storage Usage Trend"
            subtitle="Historical demonstration data"
            icon={TrendingUp}
          >
            <UsageTrend
              data={trends}
              field="storage"
              suffix=" GB"
            />
          </Panel>

          <Panel
            title="Filtered Storage and API Records"
            subtitle={`Showing ${filtered.length} organizations`}
            icon={Database}
          >
            <UsageTable rows={filtered} onView={setSelectedTenant} />
          </Panel>
        </>
      )}

      {tab === "performance" && (
        <>
          <div className="ua-stats ua-stats-three">
            <StatCard
              title="API Requests"
              value={number(metrics.api)}
              subtitle="Request volume"
              icon={Server}
              onClick={() => activateKpi("API Requests", "performance", "api")}
            />
            <StatCard
              title="Quota Utilization"
              value={`${apiPercent.toFixed(1)}%`}
              subtitle="Across tenant limits"
              icon={Gauge}
              onClick={() => activateKpi("Quota Utilization", "performance", "quota")}
            />
            <StatCard
              title="Quota Warnings"
              value={
                usageData.filter(
                  (x) =>
                    percent(x.apiRequests, x.apiLimit) >= 75 ||
                    percent(x.storage, x.storageLimit) >= 75
                ).length
              }
              subtitle="75% threshold"
              icon={AlertTriangle}
              onClick={() => activateKpi("Quota Warnings", "performance", "quota")}
            />
          </div>

          <Panel
            title="API Request Trend"
            subtitle="Monthly API requests"
            icon={TrendingUp}
          >
            <UsageTrend
              data={trends}
              field="api"
            />
          </Panel>

          <Panel
            title="Performance Monitoring Status"
            icon={Activity}
          >
            <div className="ua-info">
              <Server size={20} />

              <div>
                <strong>
                  Live performance monitoring is not connected.
                </strong>

                <p>
                  API latency, response time, error rate,
                  uptime and service health require backend
                  monitoring or telemetry integration.
                  No live performance values are being
                  claimed here.
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Filtered Performance Records"
            subtitle={`Showing ${filtered.length} organizations`}
            icon={Activity}
          >
            <UsageTable rows={filtered} onView={setSelectedTenant} />
          </Panel>
        </>
      )}

      {tab === "reports" && (
        <Panel
          title="Generate Analytics Report"
          subtitle="Choose a report dataset, apply filters, and export the matching results."
          icon={FileText}
        >
          <div className="ua-report-builder">
            <div className="ua-report-controls">
              <label>
                Report dataset
                <select
                  value={reportCategory}
                  onChange={(event) => {
                    setReportCategory(event.target.value);
                    setReportGenerated(false);
                  }}
                >
                  <option value="organizations">Organization usage</option>
                  <option value="modules">Module usage</option>
                  <option value="activity">Analytics activity</option>
                </select>
              </label>

              <label>
                Report type
                <select
                  value={reportType}
                  onChange={(event) => {
                    setReportType(event.target.value);
                    setReportGenerated(false);
                  }}
                >
                  <option value="detail">Detailed records</option>
                  <option value="summary">Summary by organization and module</option>
                </select>
              </label>

              <label>
                Organization
                <select
                  value={reportCompany}
                  onChange={(event) => {
                    setReportCompany(event.target.value);
                    setReportGenerated(false);
                  }}
                >
                  <option value="All">All organizations</option>
                  {usageData.map((item) => (
                    <option key={item.id} value={item.company}>{item.company}</option>
                  ))}
                </select>
              </label>

              <label>
                Module or category
                <select
                  value={reportModule}
                  onChange={(event) => {
                    setReportModule(event.target.value);
                    setReportGenerated(false);
                  }}
                >
                  <option value="All">All modules and categories</option>
                  {reportModules.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={reportStatus}
                  onChange={(event) => {
                    setReportStatus(event.target.value);
                    setReportGenerated(false);
                  }}
                >
                  <option value="All">All statuses</option>
                  {["Active", "High", "Medium", "Low", "Warning", "Info"].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Start date
                <input
                  type="date"
                  value={reportStart}
                  onChange={(event) => {
                    setReportStart(event.target.value);
                    setReportGenerated(false);
                  }}
                />
              </label>

              <label>
                End date
                <input
                  type="date"
                  value={reportEnd}
                  onChange={(event) => {
                    setReportEnd(event.target.value);
                    setReportGenerated(false);
                  }}
                />
              </label>
            </div>

            {reportError && (
              <p className="ua-report-error" role="alert">{reportError}</p>
            )}

            <div className="ua-report-actions">
              <button
                className="ua-button"
                type="button"
                onClick={generateReport}
              >
                <Filter size={16} />
                Generate Report
              </button>

              <button
                className="ua-secondary"
                type="button"
                onClick={exportFilteredReport}
                disabled={!reportGenerated || reportDisplayRows.length === 0}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>

            {reportGenerated && (
              <div className="ua-report-results">
                <p role="status">
                  {reportDisplayRows.length} {reportType === "detail" ? "records" : "summary rows"} generated.
                </p>
                <div className="ua-table-wrap">
                  <table className="ua-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Organization</th>
                        <th>Module / Category</th>
                        <th>Record</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportDisplayRows.map((item, index) => (
                        <tr key={`${item.company}-${item.module}-${index}`}>
                          <td>{item.date}</td>
                          <td>{item.company}</td>
                          <td>{item.module}</td>
                          <td>{item.record}</td>
                          <td>{item.value}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))}
                      {!reportDisplayRows.length && (
                        <tr>
                          <td colSpan={6} className="ua-empty">
                            No records match these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {tab === "history" && (
        <Panel
          title="Activity History"
          subtitle="Filter analytics events by organization, category, severity, and date."
          icon={Clock3}
        >
          <div className="ua-toolbar ua-history-filters">
            <div className="ua-search">
              <Search size={17} />
              <input
                placeholder="Search events or organizations..."
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                aria-label="Search activity history"
              />
            </div>
            <select
              value={historyCompany}
              onChange={(event) => setHistoryCompany(event.target.value)}
              aria-label="Filter activity by organization"
            >
              <option value="All">All organizations</option>
              {usageData.map((item) => (
                <option key={item.id} value={item.company}>{item.company}</option>
              ))}
            </select>
            <select
              value={historyCategory}
              onChange={(event) => setHistoryCategory(event.target.value)}
              aria-label="Filter activity by category"
            >
              <option value="All">All categories</option>
              {Array.from(new Set(activityData.map((item) => item.category))).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={historySeverity}
              onChange={(event) => setHistorySeverity(event.target.value)}
              aria-label="Filter activity by severity"
            >
              <option value="All">All severities</option>
              {Array.from(new Set(activityData.map((item) => item.severity))).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input
              type="date"
              value={historyStart}
              onChange={(event) => setHistoryStart(event.target.value)}
              aria-label="Activity start date"
            />
            <input
              type="date"
              value={historyEnd}
              onChange={(event) => setHistoryEnd(event.target.value)}
              aria-label="Activity end date"
            />
            <button
              className="ua-secondary"
              type="button"
              onClick={() => {
                setHistorySearch("");
                setHistoryCompany("All");
                setHistoryCategory("All");
                setHistorySeverity("All");
                setHistoryStart("");
                setHistoryEnd("");
              }}
            >
              <RefreshCw size={15} />
              Reset
            </button>
          </div>
          <div className="ua-table-wrap">
            <table className="ua-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Organization</th>
                  <th>Activity</th>
                  <th>Category</th>
                  <th>Severity</th>
                </tr>
              </thead>

              <tbody>
                {filteredActivity.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.company}</td>
                    <td>{item.event}</td>
                    <td>{item.category}</td>
                    <td>
                      <span
                        className={`ua-activity ${
                          item.severity === "Warning"
                            ? "medium"
                            : "high"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filteredActivity.length && (
                  <tr>
                    <td colSpan={5} className="ua-empty">
                      No activity matches these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {selectedTenant && (
        <div
          className="ua-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTenant(null);
            }
          }}
        >
          <div
            className="ua-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Tenant usage details"
          >
            <div className="ua-panel-head">
              <div>
                <h2>{selectedTenant.company}</h2>
                <p>Tenant usage details</p>
              </div>

              <button
                className="ua-icon-button"
                type="button"
                onClick={() => setSelectedTenant(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ua-detail-grid">
              {[
                ["Subscription Plan", selectedTenant.plan],
                ["Employees", number(selectedTenant.employees)],
                ["Active Users", number(selectedTenant.activeUsers)],
                ["Sessions", number(selectedTenant.sessions)],
                [
                  "Storage",
                  `${selectedTenant.storage} / ${selectedTenant.storageLimit} GB`
                ],
                [
                  "API Requests",
                  `${number(selectedTenant.apiRequests)} / ${number(selectedTenant.apiLimit)}`
                ],
                ["Activity Level", selectedTenant.activity],
                ["Status", selectedTenant.status]
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <h3>Resource Utilization</h3>

            <ProgressRow
              label="Storage Used"
              value={selectedTenant.storage}
              max={selectedTenant.storageLimit}
              suffix=" GB"
            />

            <ProgressRow
              label="API Requests"
              value={selectedTenant.apiRequests}
              max={selectedTenant.apiLimit}
              suffix=""
            />

          </div>
        </div>
      )}
    </div>
  );
}
