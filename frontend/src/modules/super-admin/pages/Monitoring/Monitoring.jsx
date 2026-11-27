
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Globe,
  LayoutDashboard,
  Wifi,
  Workflow,
  AlertTriangle,
  BarChart3,
  History,
  FileText,
  CheckCircle2,
  Clock3,
  Search,
  Download,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Cpu,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./Monitoring.css";

const INITIAL_SERVICES = [
  {
    id: 1,
    name: "Frontend Application",
    detail: "Web application availability",
    status: "Operational",
    uptime: 99.9,
    latency: 84,
    icon: Globe,
  },
  {
    id: 2,
    name: "Backend API",
    detail: "Application API services",
    status: "Operational",
    uptime: 99.8,
    latency: 126,
    icon: Server,
  },
  {
    id: 3,
    name: "Database",
    detail: "Database connectivity",
    status: "Operational",
    uptime: 99.9,
    latency: 42,
    icon: Database,
  },
  {
    id: 4,
    name: "File Storage",
    detail: "Document storage service",
    status: "Operational",
    uptime: 99.7,
    latency: 68,
    icon: HardDrive,
  },
];

const INITIAL_APIS = [
  {
    id: 1,
    endpoint: "/api/auth/login",
    method: "POST",
    requests: 12840,
    latency: 112,
    errors: 12,
    status: "Healthy",
  },
  {
    id: 2,
    endpoint: "/api/employees",
    method: "GET",
    requests: 18420,
    latency: 86,
    errors: 8,
    status: "Healthy",
  },
  {
    id: 3,
    endpoint: "/api/payroll/process",
    method: "POST",
    requests: 3420,
    latency: 245,
    errors: 16,
    status: "Warning",
  },
  {
    id: 4,
    endpoint: "/api/attendance",
    method: "GET",
    requests: 15670,
    latency: 95,
    errors: 5,
    status: "Healthy",
  },
  {
    id: 5,
    endpoint: "/api/reports",
    method: "GET",
    requests: 6840,
    latency: 175,
    errors: 9,
    status: "Healthy",
  },
];

const INITIAL_DATABASES = [
  {
    id: 1,
    name: "Primary PostgreSQL",
    type: "Primary Database",
    status: "Connected",
    connections: 42,
    maxConnections: 100,
    queryTime: 18,
    storage: 68,
  },
  {
    id: 2,
    name: "Reporting Database",
    type: "Analytics Database",
    status: "Connected",
    connections: 18,
    maxConnections: 80,
    queryTime: 32,
    storage: 46,
  },
  {
    id: 3,
    name: "Audit Database",
    type: "Audit Log Storage",
    status: "Connected",
    connections: 12,
    maxConnections: 50,
    queryTime: 24,
    storage: 39,
  },
];

const INITIAL_JOBS = [
  {
    id: 1,
    name: "Daily Attendance Sync",
    category: "Attendance",
    schedule: "Every day, 11:30 PM",
    lastRun: "2026-11-22T23:30:00",
    duration: "42 sec",
    status: "Completed",
  },
  {
    id: 2,
    name: "Payroll Calculation",
    category: "Payroll",
    schedule: "Monthly",
    lastRun: "2026-11-22T18:00:00",
    duration: "2 min 14 sec",
    status: "Completed",
  },
  {
    id: 3,
    name: "Database Backup",
    category: "System",
    schedule: "Every day, 2:00 AM",
    lastRun: "2026-11-23T02:00:00",
    duration: "1 min 08 sec",
    status: "Completed",
  },
  {
    id: 4,
    name: "Notification Dispatch",
    category: "Notifications",
    schedule: "Every 15 minutes",
    lastRun: "2026-11-23T09:45:00",
    duration: "18 sec",
    status: "Running",
  },
  {
    id: 5,
    name: "Monthly Report Generation",
    category: "Reports",
    schedule: "Monthly",
    lastRun: "2026-11-22T16:00:00",
    duration: "—",
    status: "Failed",
  },
];

const INITIAL_INCIDENTS = [
  {
    id: "INC-1001",
    title: "Payroll API response time increased",
    service: "Backend API",
    severity: "Medium",
    status: "Investigating",
    createdAt: "2026-11-23T09:20:00",
    description: "Payroll processing endpoint exceeded the warning threshold.",
  },
  {
    id: "INC-1002",
    title: "Scheduled report job failed",
    service: "Background Jobs",
    severity: "High",
    status: "Open",
    createdAt: "2026-11-22T16:10:00",
    description: "Monthly report generation did not complete successfully.",
  },
  {
    id: "INC-1003",
    title: "Storage latency warning",
    service: "File Storage",
    severity: "Low",
    status: "Resolved",
    createdAt: "2026-11-21T11:30:00",
    description: "Temporary increase in document storage response time.",
  },
];

const PERFORMANCE = [
  { label: "06:00", cpu: 32, memory: 48, requests: 28 },
  { label: "08:00", cpu: 46, memory: 52, requests: 42 },
  { label: "10:00", cpu: 58, memory: 56, requests: 68 },
  { label: "12:00", cpu: 72, memory: 61, requests: 85 },
  { label: "14:00", cpu: 64, memory: 59, requests: 76 },
  { label: "16:00", cpu: 55, memory: 57, requests: 62 },
  { label: "18:00", cpu: 43, memory: 54, requests: 48 },
];

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "api", label: "API Monitoring", icon: Wifi },
  { id: "database", label: "Database Monitoring", icon: Database },
  { id: "jobs", label: "Background Jobs", icon: Workflow },
  { id: "services", label: "Service Health", icon: Server },
  { id: "incidents", label: "Incidents & Alerts", icon: AlertTriangle },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
  { id: "reports", label: "Reports", icon: FileText },
];

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const value = String(status || "Unknown");
  const positive = ["Operational", "Healthy", "Connected", "Completed", "Resolved"];
  const negative = ["Failed", "Critical", "High", "Open"];
  const tone = positive.includes(value)
    ? "good"
    : negative.includes(value)
    ? "bad"
    : "warn";

  return (
    <span className={`mon-badge ${tone}`}>
      <span className="mon-badge-dot" />
      {value}
    </span>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, tone = "", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`mon-metric ${tone}`}
      onClick={onClick}
    >
      <div className="mon-metric-top">
        <span>{title}</span>
        <span className="mon-metric-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </Tag>
  );
}

function PanelHeading({ title, subtitle, action }) {
  return (
    <div className="mon-panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="mon-empty">
      <Search size={25} />
      <p>{message}</p>
    </div>
  );
}

function ProgressBar({ value, tone = "teal" }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="mon-progress">
      <div className={`mon-progress-fill ${tone}`} style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function BarChart({ data, field, suffix = "%" }) {
  return (
    <div className="mon-chart">
      {data.map((item) => (
        <div className="mon-chart-column" key={item.label}>
          <span>{item[field]}{suffix}</span>
          <div className="mon-chart-track">
            <div
              className="mon-chart-fill"
              style={{ height: `${Math.min(100, item[field])}%` }}
            />
          </div>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

export default function Monitoring() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedFilter = searchParams.get("filter");
  const requestedSearch = searchParams.get("search") || "";
  const validTabs = TABS.map((item) => item.id);
  const [tab, setTab] = useState(validTabs.includes(requestedTab) ? requestedTab : "overview");
  const [services] = useState(INITIAL_SERVICES);
  const [apis] = useState(INITIAL_APIS);
  const [databases] = useState(INITIAL_DATABASES);
  const [jobs] = useState(INITIAL_JOBS);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [search, setSearch] = useState(requestedSearch);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [history, setHistory] = useState([
    {
      id: 1,
      action: "Monitoring dashboard opened",
      category: "System",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [reportType, setReportType] = useState("All Services");
  const [reportStatusFilter, setReportStatusFilter] = useState("All");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [page, setPage] = useState(1);
  const [apiStatusFilter, setApiStatusFilter] = useState("All");
  const [apiMethodFilter, setApiMethodFilter] = useState("All");
  const [jobCategoryFilter, setJobCategoryFilter] = useState("All");
  const [jobStatusFilter, setJobStatusFilter] = useState("All");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("All");
  const [incidentServiceFilter, setIncidentServiceFilter] = useState("All");
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState("All");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("All");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("All");
  const [historyStart, setHistoryStart] = useState("");
  const [historyEnd, setHistoryEnd] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    const filter = searchParams.get("filter");
    if (validTabs.includes(nextTab)) setTab(nextTab);
    setSearch(searchParams.get("search") || "");
    setIncidentStatusFilter(filter === "resolved" ? "Resolved" : "All");
    if (nextTab === "services" && filter === "Operational") {
      setServiceStatusFilter("Operational");
      setActiveFilter("System Status");
    } else if (nextTab === "api" && filter === "response") {
      setActiveFilter("Response Time");
    } else if (nextTab === "database" && filter === "usage") {
      setActiveFilter("Database Usage");
    } else if (nextTab === "performance" && filter === "uptime") {
      setActiveFilter("Uptime");
    }
  }, [searchParams]);

  const operational = services.filter((item) => item.status === "Operational").length;
  const totalRequests = apis.reduce((sum, item) => sum + item.requests, 0);
  const totalErrors = apis.reduce((sum, item) => sum + item.errors, 0);
  const avgLatency = Math.round(
    apis.reduce((sum, item) => sum + item.latency, 0) / Math.max(apis.length, 1)
  );
  const errorRate = totalRequests ? ((totalErrors / totalRequests) * 100).toFixed(2) : "0.00";
  const activeIncidents = incidents.filter((item) => item.status !== "Resolved").length;
  const completedJobs = jobs.filter((item) => item.status === "Completed").length;
  const failedJobs = jobs.filter((item) => item.status === "Failed").length;
  const averageUptime = (
    services.reduce((sum, item) => sum + item.uptime, 0) / Math.max(services.length, 1)
  ).toFixed(2);

  const addHistory = (action, category = "System") => {
    setHistory((previous) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        category,
        timestamp: new Date().toISOString(),
      },
      ...previous,
    ]);
  };

  const refresh = () => {
    setLastRefreshed(new Date());
    addHistory("Monitoring view refreshed", "System");
  };

  const changeTab = (nextTab, preserveFilters = false) => {
    setTab(nextTab);
    setSearch("");
    setPage(1);
    if (!preserveFilters) {
      setActiveFilter("");
      setApiStatusFilter("All");
      setApiMethodFilter("All");
      setJobCategoryFilter("All");
      setJobStatusFilter("All");
      setServiceStatusFilter("All");
      setIncidentServiceFilter("All");
      setIncidentSeverityFilter("All");
      setIncidentStatusFilter("All");
      setHistoryCategoryFilter("All");
      setHistoryStart("");
      setHistoryEnd("");
    }
  };

  const filterMonitoring = (title, nextTab, filter = {}) => {
    setSearch("");
    setApiStatusFilter(filter.apiStatus || "All");
    setApiMethodFilter(filter.apiMethod || "All");
    setJobCategoryFilter(filter.jobCategory || "All");
    setJobStatusFilter(filter.jobStatus || "All");
    setServiceStatusFilter(filter.serviceStatus || "All");
    setIncidentServiceFilter(filter.incidentService || "All");
    setIncidentSeverityFilter(filter.incidentSeverity || "All");
    setIncidentStatusFilter(filter.incidentStatus || "All");
    changeTab(nextTab, true);
    setActiveFilter(title);
  };

  const clearMonitoringFilter = () => {
    setActiveFilter("");
    setSearch("");
    setApiStatusFilter("All");
    setApiMethodFilter("All");
    setJobCategoryFilter("All");
    setJobStatusFilter("All");
    setServiceStatusFilter("All");
    setIncidentServiceFilter("All");
    setIncidentSeverityFilter("All");
    setIncidentStatusFilter("All");
    setHistoryCategoryFilter("All");
    setHistoryStart("");
    setHistoryEnd("");
    setPage(1);
  };

  const resolveIncident = (incident) => {
    if (incident.status === "Resolved") return;
    setIncidents((previous) =>
      previous.map((item) =>
        item.id === incident.id ? { ...item, status: "Resolved" } : item
      )
    );
    addHistory(`Incident ${incident.id} marked as resolved`, "Incident");
  };

  const filteredApis = useMemo(
    () => apis.filter((item) =>
      item.endpoint.toLowerCase().includes(search.toLowerCase()) &&
      (apiStatusFilter === "All" || item.status === apiStatusFilter) &&
      (apiMethodFilter === "All" || item.method === apiMethodFilter)
    ),
    [apis, search, apiStatusFilter, apiMethodFilter]
  );

  const filteredJobs = useMemo(
    () =>
      jobs.filter((item) =>
        `${item.name} ${item.category} ${item.status}`.toLowerCase().includes(search.toLowerCase())
        && (jobCategoryFilter === "All" || item.category === jobCategoryFilter)
        && (jobStatusFilter === "All" || item.status === jobStatusFilter)
      ),
    [jobs, search, jobCategoryFilter, jobStatusFilter]
  );

  const filteredIncidents = useMemo(
    () =>
      incidents.filter((item) =>
        `${item.title} ${item.id} ${item.severity} ${item.status}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (incidentServiceFilter === "All" || item.service === incidentServiceFilter) &&
        (incidentSeverityFilter === "All" || item.severity === incidentSeverityFilter) &&
        (incidentStatusFilter === "All" ||
          (incidentStatusFilter === "Active" ? item.status !== "Resolved" : item.status === incidentStatusFilter))
      ),
    [incidents, search, incidentServiceFilter, incidentSeverityFilter, incidentStatusFilter]
  );

  const filteredHistory = useMemo(
    () =>
      history.filter((item) =>
        `${item.action} ${item.category}`.toLowerCase().includes(search.toLowerCase()) &&
        (historyCategoryFilter === "All" || item.category === historyCategoryFilter) &&
        (!historyStart || item.timestamp.slice(0, 10) >= historyStart) &&
        (!historyEnd || item.timestamp.slice(0, 10) <= historyEnd)
      ),
    [history, search, historyCategoryFilter, historyStart, historyEnd]
  );

  const filteredServices = services.filter(
    (item) => serviceStatusFilter === "All" || item.status === serviceStatusFilter
  );

  const reportRows = useMemo(() => {
    const observedAt = lastRefreshed.toISOString();
    const records = {
      "All Services": services.map((item) => ({
        record: item.name,
        type: "Service Health",
        status: item.status,
        date: observedAt,
        details: `${item.detail}; uptime ${item.uptime}%; latency ${item.latency} ms`,
      })),
      "API Monitoring": apis.map((item) => ({
        record: `${item.method} ${item.endpoint}`,
        type: "API Monitoring",
        status: item.status,
        date: observedAt,
        details: `${item.requests} requests; ${item.errors} errors; ${item.latency} ms latency`,
      })),
      "Database Monitoring": databases.map((item) => ({
        record: item.name,
        type: "Database Monitoring",
        status: item.status,
        date: observedAt,
        details: `${item.connections}/${item.maxConnections} connections; ${item.storage}% storage`,
      })),
      "Background Jobs": jobs.map((item) => ({
        record: item.name,
        type: "Background Jobs",
        status: item.status,
        date: item.lastRun,
        details: `${item.category}; ${item.schedule}; ${item.duration}`,
      })),
      Incidents: incidents.map((item) => ({
        record: item.id,
        type: "Incidents",
        status: item.status,
        date: item.createdAt,
        details: `${item.title}; ${item.service}; ${item.severity}`,
      })),
    }[reportType] || [];

    return records.filter((item) => {
      const date = item.date.slice(0, 10);
      return (
        (reportStatusFilter === "All" || item.status === reportStatusFilter) &&
        (!reportStart || date >= reportStart) &&
        (!reportEnd || date <= reportEnd)
      );
    });
  }, [reportType, reportStatusFilter, reportStart, reportEnd, services, apis, databases, jobs, incidents, lastRefreshed]);

  const reportStatusOptions = useMemo(() => {
    const source = {
      "All Services": services,
      "API Monitoring": apis,
      "Database Monitoring": databases,
      "Background Jobs": jobs,
      Incidents: incidents,
    }[reportType] || [];
    return [...new Set(source.map((item) => item.status))];
  }, [reportType, services, apis, databases, jobs, incidents]);

  const exportCSV = (filename, headers, rows) => {
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addHistory(`Exported ${filename}`, "Report");
  };

  const exportReport = () => {
    exportCSV(
      `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.csv`,
      ["Record", "Category", "Status", "Date", "Details"],
      reportRows.map((item) => [
        item.record, item.type, item.status, formatDate(item.date), item.details,
      ])
    );
  };

  const searchBox = (placeholder) => (
    <div className="mon-search">
      <Search size={17} />
      <input
        value={search}
        aria-label={placeholder}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder={placeholder}
      />
    </div>
  );

  const pageSize = 8;
  const historyPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const visibleHistory = filteredHistory.slice(
    (Math.min(page, historyPages) - 1) * pageSize,
    Math.min(page, historyPages) * pageSize
  );

  return (
    <div className="mon-page">
      <div className="mon-header">
        <div>
          <div className="mon-eyebrow">SUPER ADMIN / PLATFORM OPERATIONS</div>
          <h1>Monitoring</h1>
          <p>API/database health, background jobs and incident status.</p>
        </div>
        <div className="mon-header-actions">
          <button type="button" className="mon-refresh" onClick={refresh}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mon-tabs" role="tablist" aria-label="Monitoring sections">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              key={item.id}
              className={`sa-pill-kpi ${tab === item.id ? "active" : ""}`}
              onClick={() => changeTab(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {activeFilter && (
        <div className="mon-active-filter">
          <span>Showing: <strong>{activeFilter}</strong></span>
          <button type="button" onClick={clearMonitoringFilter}>Clear filter</button>
        </div>
      )}

      {tab === "overview" && (
        <>
          <div className="mon-section-intro">
            <div>
              <h2>Monitoring Overview</h2>
              <p>Platform services, API activity, jobs and incidents at a glance.</p>
            </div>
            <span className="mon-muted-small">
              <Clock3 size={14} /> Refreshed {lastRefreshed.toLocaleTimeString("en-IN")}
            </span>
          </div>

          <div className="mon-stats mon-stats-four">
            <MetricCard title="Total Services" value={services.length} subtitle="Tracked platform services" icon={Server} onClick={() => filterMonitoring("All services", "services")} />
            <MetricCard title="Operational" value={operational} subtitle="Services reporting healthy" icon={CheckCircle2} tone="success" onClick={() => filterMonitoring("Operational services", "services", { serviceStatus: "Operational" })} />
            <MetricCard title="Active Incidents" value={activeIncidents} subtitle="Open or investigating" icon={AlertTriangle} tone="warning" onClick={() => filterMonitoring("Active incidents", "incidents", { incidentStatus: "Active" })} />
            <MetricCard title="Average Uptime" value={`${averageUptime}%`} subtitle="Sample availability metric" icon={Activity} onClick={() => filterMonitoring("Service uptime", "services")} />
          </div>

          <div className="mon-two-columns">
            <section className="mon-panel">
              <PanelHeading
                title="API Health Summary"
                subtitle="Request volume and endpoint performance"
                action={<button className="mon-link" onClick={() => filterMonitoring("API health", "api")}>View APIs →</button>}
              />
              <div className="mon-mini-stats">
                <div><span>Total Requests</span><strong>{formatNumber(totalRequests)}</strong></div>
                <div><span>Average Latency</span><strong>{avgLatency} ms</strong></div>
                <div><span>Error Rate</span><strong>{errorRate}%</strong></div>
              </div>
              <div className="mon-summary-lines">
                {apis.slice(0, 4).map((api) => (
                  <div key={api.id}>
                    <span>{api.endpoint}</span>
                    <StatusBadge status={api.status} />
                  </div>
                ))}
              </div>
            </section>

            <section className="mon-panel">
              <PanelHeading
                title="Background Job Summary"
                subtitle="Scheduled task execution"
                action={<button className="mon-link" onClick={() => filterMonitoring("Background jobs", "jobs")}>View Jobs →</button>}
              />
              <div className="mon-mini-stats">
                <div><span>Total Jobs</span><strong>{jobs.length}</strong></div>
                <div><span>Completed</span><strong>{completedJobs}</strong></div>
                <div><span>Failed</span><strong>{failedJobs}</strong></div>
              </div>
              <div className="mon-summary-lines">
                {jobs.slice(0, 4).map((job) => (
                  <div key={job.id}>
                    <span>{job.name}</span>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mon-panel">
            <PanelHeading
              title="Service Health"
              subtitle="Availability and response time by service"
              action={<button className="mon-link" onClick={() => filterMonitoring("Service health", "services")}>View All →</button>}
            />
            <div className="mon-service-grid">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <article className="mon-service-card" key={service.id}>
                    <div className="mon-service-top">
                      <div className="mon-service-icon"><Icon size={21} /></div>
                      <StatusBadge status={service.status} />
                    </div>
                    <h3>{service.name}</h3>
                    <p>{service.detail}</p>
                    <div className="mon-service-bottom">
                      <span>Uptime <strong>{service.uptime}%</strong></span>
                      <span>Latency <strong>{service.latency} ms</strong></span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="mon-two-columns">
            <section className="mon-panel">
              <PanelHeading title="Database Overview" subtitle="Connections and storage utilization" />
              {databases.map((db) => (
                <div className="mon-utilization" key={db.id}>
                  <div><span>{db.name}</span><strong>{db.storage}% storage</strong></div>
                  <ProgressBar value={db.storage} />
                </div>
              ))}
              <button className="mon-link mon-bottom-link" onClick={() => filterMonitoring("Database monitoring", "database")}>
                Database Monitoring →
              </button>
            </section>

            <section className="mon-panel">
              <PanelHeading
                title="Recent Incidents"
                subtitle="Latest service alerts"
                action={<button className="mon-link" onClick={() => filterMonitoring("Incident alerts", "incidents")}>View All →</button>}
              />
              {incidents.slice(0, 3).map((incident) => (
                <div className="mon-incident-mini" key={incident.id}>
                  <AlertTriangle size={17} />
                  <div>
                    <strong>{incident.title}</strong>
                    <small>{incident.service}</small>
                  </div>
                  <StatusBadge status={incident.status} />
                </div>
              ))}
            </section>
          </div>

        </>
      )}

      {tab === "api" && (
        <>
          <div className="mon-section-intro">
            <div><h2>API Monitoring</h2><p>Endpoint traffic, latency, error rates and availability.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="Total API Requests" value={formatNumber(totalRequests)} subtitle="Across monitored endpoints" icon={Wifi} onClick={() => filterMonitoring("All API endpoints", "api")} />
            <MetricCard title="Average Response Time" value={`${avgLatency} ms`} subtitle="Mean endpoint latency" icon={Clock3} onClick={() => filterMonitoring("API response time", "api")} />
            <MetricCard title="API Error Rate" value={`${errorRate}%`} subtitle={`${totalErrors} total errors`} icon={AlertCircle} tone="warning" onClick={() => filterMonitoring("API warnings", "api", { apiStatus: "Warning" })} />
          </div>
          <section className="mon-panel">
            <PanelHeading title="API Endpoint Health" subtitle="Request and response metrics" />
            <div className="mon-filter-toolbar">
              {searchBox("Search API endpoint...")}
              <select aria-label="Filter APIs by status" value={apiStatusFilter} onChange={(event) => setApiStatusFilter(event.target.value)}>
                <option value="All">All API statuses</option>
                <option value="Healthy">Healthy</option>
                <option value="Warning">Warning</option>
              </select>
              <select aria-label="Filter APIs by method" value={apiMethodFilter} onChange={(event) => setApiMethodFilter(event.target.value)}>
                <option value="All">All methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div className="mon-table-wrap">
              <table className="mon-table">
                <thead><tr><th>Endpoint</th><th>Method</th><th>Requests</th><th>Latency</th><th>Errors</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredApis.map((api) => (
                    <tr key={api.id}>
                      <td className="mon-strong-cell">{api.endpoint}</td>
                      <td><span className="mon-method">{api.method}</span></td>
                      <td>{formatNumber(api.requests)}</td>
                      <td>{api.latency} ms</td>
                      <td>{api.errors}</td>
                      <td><StatusBadge status={api.status} /></td>
                    </tr>
                  ))}
                  {!filteredApis.length && <tr><td colSpan={6}><EmptyState message="No API endpoints found." /></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <section className="mon-panel">
            <PanelHeading title="Endpoint Request Distribution" subtitle="Relative request volume" />
            {apis.map((api) => (
              <div className="mon-utilization" key={api.id}>
                <div><span>{api.endpoint}</span><strong>{formatNumber(api.requests)}</strong></div>
                <ProgressBar value={(api.requests / Math.max(...apis.map((x) => x.requests))) * 100} />
              </div>
            ))}
          </section>
        </>
      )}

      {tab === "database" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Database Monitoring</h2><p>Database connectivity, active connections and storage usage.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="Databases" value={databases.length} subtitle="Configured databases" icon={Database} />
            <MetricCard title="Connected" value={databases.filter((db) => db.status === "Connected").length} subtitle="Available connections" icon={CheckCircle2} tone="success" />
            <MetricCard title="Active Connections" value={databases.reduce((sum, db) => sum + db.connections, 0)} subtitle="Across databases" icon={Activity} />
          </div>
          <div className="mon-database-grid">
            {databases.map((db) => (
              <section className="mon-panel" key={db.id}>
                <div className="mon-db-top">
                  <div className="mon-service-icon"><Database size={21} /></div>
                  <StatusBadge status={db.status} />
                </div>
                <h3>{db.name}</h3>
                <p className="mon-muted">{db.type}</p>
                <div className="mon-db-metrics">
                  <div><span>Active Connections</span><strong>{db.connections}/{db.maxConnections}</strong></div>
                  <div><span>Average Query Time</span><strong>{db.queryTime} ms</strong></div>
                </div>
                <div className="mon-utilization">
                  <div><span>Connection Utilization</span><strong>{Math.round((db.connections / db.maxConnections) * 100)}%</strong></div>
                  <ProgressBar value={(db.connections / db.maxConnections) * 100} />
                </div>
                <div className="mon-utilization">
                  <div><span>Storage Used</span><strong>{db.storage}%</strong></div>
                  <ProgressBar value={db.storage} tone="purple" />
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {tab === "jobs" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Background Jobs</h2><p>Track scheduled jobs, execution status and failures.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="Total Jobs" value={jobs.length} subtitle="Scheduled background tasks" icon={Workflow} onClick={() => filterMonitoring("All background jobs", "jobs")} />
            <MetricCard title="Completed Jobs" value={completedJobs} subtitle="Successful executions" icon={CheckCircle2} tone="success" onClick={() => filterMonitoring("Completed jobs", "jobs", { jobStatus: "Completed" })} />
            <MetricCard title="Failed Jobs" value={failedJobs} subtitle="Require investigation" icon={XCircle} tone="warning" onClick={() => filterMonitoring("Failed jobs", "jobs", { jobStatus: "Failed" })} />
          </div>
          <section className="mon-panel">
            <PanelHeading title="Job Execution Status" subtitle="Scheduled HRMS system operations" />
            <div className="mon-filter-toolbar">
              {searchBox("Search background jobs...")}
              <select aria-label="Filter jobs by category" value={jobCategoryFilter} onChange={(event) => setJobCategoryFilter(event.target.value)}>
                <option value="All">All job categories</option>
                {[...new Set(jobs.map((job) => job.category))].map((category) => <option key={category}>{category}</option>)}
              </select>
              <select aria-label="Filter jobs by status" value={jobStatusFilter} onChange={(event) => setJobStatusFilter(event.target.value)}>
                <option value="All">All job statuses</option>
                {[...new Set(jobs.map((job) => job.status))].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="mon-table-wrap">
              <table className="mon-table">
                <thead><tr><th>Job Name</th><th>Category</th><th>Schedule</th><th>Last Run</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="mon-strong-cell">{job.name}</td>
                      <td>{job.category}</td>
                      <td>{job.schedule}</td>
                      <td>{formatDate(job.lastRun)}</td>
                      <td>{job.duration}</td>
                      <td><StatusBadge status={job.status} /></td>
                    </tr>
                  ))}
                  {!filteredJobs.length && <tr><td colSpan={6}><EmptyState message="No matching jobs found." /></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "services" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Service Health</h2><p>Availability, uptime and response time of platform components.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="Total Services" value={services.length} subtitle="Monitored components" icon={Server} onClick={() => filterMonitoring("All services", "services")} />
            <MetricCard title="Operational" value={operational} subtitle="Healthy services" icon={ShieldCheck} tone="success" onClick={() => filterMonitoring("Operational services", "services", { serviceStatus: "Operational" })} />
            <MetricCard title="Average Uptime" value={`${averageUptime}%`} subtitle="Across all services" icon={Activity} onClick={() => filterMonitoring("Service uptime", "services")} />
          </div>
          <div className="mon-service-grid">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <article className="mon-service-card" key={service.id}>
                  <div className="mon-service-top">
                    <div className="mon-service-icon"><Icon size={22} /></div>
                    <StatusBadge status={service.status} />
                  </div>
                  <h3>{service.name}</h3>
                  <p>{service.detail}</p>
                  <div className="mon-service-bottom">
                    <span>Uptime <strong>{service.uptime}%</strong></span>
                    <span>Latency <strong>{service.latency} ms</strong></span>
                  </div>
                  <div className="mon-utilization">
                    <div><span>Availability</span><strong>{service.uptime}%</strong></div>
                    <ProgressBar value={service.uptime} />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {tab === "incidents" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Incidents & Alerts</h2><p>Track, investigate and resolve platform issues.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="Total Incidents" value={incidents.length} subtitle="Recorded incidents" icon={AlertTriangle} onClick={() => filterMonitoring("All incidents", "incidents")} />
            <MetricCard title="Active Incidents" value={activeIncidents} subtitle="Open or investigating" icon={AlertCircle} tone="warning" onClick={() => filterMonitoring("Active incidents", "incidents", { incidentStatus: "Active" })} />
            <MetricCard title="Resolved" value={incidents.filter((item) => item.status === "Resolved").length} subtitle="Closed incidents" icon={CheckCircle2} tone="success" onClick={() => filterMonitoring("Resolved incidents", "incidents", { incidentStatus: "Resolved" })} />
          </div>
          <section className="mon-panel">
            <PanelHeading title="Incident Management" subtitle="Review incidents and update their status" />
            <div className="mon-filter-toolbar">
              {searchBox("Search incidents...")}
              <select aria-label="Filter incidents by service" value={incidentServiceFilter} onChange={(event) => setIncidentServiceFilter(event.target.value)}>
                <option value="All">All services</option>
                {[...new Set(incidents.map((incident) => incident.service))].map((service) => <option key={service}>{service}</option>)}
              </select>
              <select aria-label="Filter incidents by severity" value={incidentSeverityFilter} onChange={(event) => setIncidentSeverityFilter(event.target.value)}>
                <option value="All">All severities</option>
                {[...new Set(incidents.map((incident) => incident.severity))].map((severity) => <option key={severity}>{severity}</option>)}
              </select>
              <select aria-label="Filter incidents by status" value={incidentStatusFilter} onChange={(event) => setIncidentStatusFilter(event.target.value)}>
                <option value="All">All incident statuses</option>
                <option value="Active">All active</option>
                {[...new Set(incidents.map((incident) => incident.status))].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="mon-table-wrap">
              <table className="mon-table">
                <thead><tr><th>Incident ID</th><th>Incident</th><th>Service</th><th>Severity</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredIncidents.map((incident) => (
                    <tr key={incident.id}>
                      <td className="mon-strong-cell">{incident.id}</td>
                      <td>
                        <strong className="mon-incident-title">{incident.title}</strong>
                        <small className="mon-incident-desc">{incident.description}</small>
                      </td>
                      <td>{incident.service}</td>
                      <td><StatusBadge status={incident.severity} /></td>
                      <td><StatusBadge status={incident.status} /></td>
                      <td>{formatDate(incident.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="mon-small-button"
                          disabled={incident.status === "Resolved"}
                          onClick={() => resolveIncident(incident)}
                        >
                          {incident.status === "Resolved" ? "Resolved" : "Resolve"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredIncidents.length && <tr><td colSpan={7}><EmptyState message="No matching incidents found." /></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "performance" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Performance</h2><p>System utilization, memory consumption and request load.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="CPU Utilization" value="58%" subtitle="Sample system load" icon={Cpu} />
            <MetricCard title="Memory Usage" value="56%" subtitle="Sample memory utilization" icon={HardDrive} />
            <MetricCard title="Average API Latency" value={`${avgLatency} ms`} subtitle="Across monitored APIs" icon={Zap} />
          </div>
          <div className="mon-two-columns">
            <section className="mon-panel">
              <PanelHeading title="CPU Utilization" subtitle="Sample usage trend throughout the day" />
              <BarChart data={PERFORMANCE} field="cpu" />
            </section>
            <section className="mon-panel">
              <PanelHeading title="Memory Utilization" subtitle="Sample memory usage trend" />
              <BarChart data={PERFORMANCE} field="memory" />
            </section>
          </div>
          <section className="mon-panel">
            <PanelHeading title="Request Load" subtitle="Relative request traffic over time" />
            <BarChart data={PERFORMANCE} field="requests" suffix="%" />
          </section>
        </>
      )}

      {tab === "history" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Monitoring History</h2><p>Review actions performed in the monitoring dashboard.</p></div>
          </div>
          <section className="mon-panel">
            <PanelHeading title="Activity History" subtitle={`${history.length} locally recorded actions`} />
            <div className="mon-filter-toolbar">
              {searchBox("Search history...")}
              <select aria-label="Filter history by category" value={historyCategoryFilter} onChange={(event) => setHistoryCategoryFilter(event.target.value)}>
                <option value="All">All history categories</option>
                {[...new Set(history.map((item) => item.category))].map((category) => <option key={category}>{category}</option>)}
              </select>
              <input aria-label="History start date" type="date" value={historyStart} onChange={(event) => setHistoryStart(event.target.value)} />
              <input aria-label="History end date" type="date" value={historyEnd} onChange={(event) => setHistoryEnd(event.target.value)} />
              <button type="button" className="mon-refresh" onClick={() => {
                setSearch("");
                setHistoryCategoryFilter("All");
                setHistoryStart("");
                setHistoryEnd("");
              }}>Reset</button>
            </div>
            <div className="mon-table-wrap">
              <table className="mon-table">
                <thead><tr><th>Date & Time</th><th>Category</th><th>Activity</th></tr></thead>
                <tbody>
                  {visibleHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.timestamp)}</td>
                      <td><span className="mon-method">{item.category}</span></td>
                      <td>{item.action}</td>
                    </tr>
                  ))}
                  {!visibleHistory.length && <tr><td colSpan={3}><EmptyState message="No monitoring history found." /></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mon-pagination">
              <span>Page {Math.min(page, historyPages)} of {historyPages}</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={17} /></button>
                <button disabled={page >= historyPages} onClick={() => setPage((p) => Math.min(historyPages, p + 1))}><ChevronRight size={17} /></button>
              </div>
            </div>
          </section>
        </>
      )}

      {tab === "reports" && (
        <>
          <div className="mon-section-intro">
            <div><h2>Monitoring Reports</h2><p>Export service, API, job and incident monitoring records.</p></div>
          </div>
          <div className="mon-stats">
            <MetricCard title="Monitored Services" value={services.length} subtitle="Available for reporting" icon={Server} />
            <MetricCard title="API Endpoints" value={apis.length} subtitle="Tracked API endpoints" icon={Wifi} />
            <MetricCard title="Recorded Incidents" value={incidents.length} subtitle="Current incident records" icon={FileText} />
          </div>
          <section className="mon-panel">
            <PanelHeading title="Generate Monitoring Report" subtitle="Filter the preview, then export the same records to CSV" />
            <div className="mon-report-form">
              <label>
                Report Type
                <select aria-label="Monitoring report type" value={reportType} onChange={(event) => {
                  setReportType(event.target.value);
                  setReportStatusFilter("All");
                }}>
                  <option>All Services</option>
                  <option>API Monitoring</option>
                  <option>Database Monitoring</option>
                  <option>Background Jobs</option>
                  <option>Incidents</option>
                </select>
              </label>
              <label>
                Status
                <select aria-label="Monitoring report status" value={reportStatusFilter} onChange={(event) => setReportStatusFilter(event.target.value)}>
                  <option value="All">All Statuses</option>
                  {reportStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                From
                <input aria-label="Monitoring report start date" type="date" value={reportStart} max={reportEnd || undefined} onChange={(event) => setReportStart(event.target.value)} />
              </label>
              <label>
                To
                <input aria-label="Monitoring report end date" type="date" value={reportEnd} min={reportStart || undefined} onChange={(event) => setReportEnd(event.target.value)} />
              </label>
              <button className="mon-secondary" type="button" onClick={() => {
                setReportStatusFilter("All");
                setReportStart("");
                setReportEnd("");
              }}>
                Reset Filters
              </button>
              <button className="mon-primary" type="button" onClick={exportReport} disabled={!reportRows.length}>
                <Download size={17} /> Export CSV Report
              </button>
            </div>
            <p className="mon-report-count" aria-live="polite">
              Previewing {reportRows.length} filtered {reportRows.length === 1 ? "record" : "records"}.
            </p>
            <div className="mon-table-wrap">
              <table className="mon-table">
                <thead>
                  <tr><th>Record</th><th>Category</th><th>Status</th><th>Date</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {reportRows.map((item) => (
                    <tr key={`${item.type}-${item.record}`}>
                      <td>{item.record}</td>
                      <td>{item.type}</td>
                      <td>{item.status}</td>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.details}</td>
                    </tr>
                  ))}
                  {!reportRows.length && <tr><td className="mon-empty" colSpan={5}>No monitoring records match the selected filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mon-report-note">
              <FileText size={18} />
              <span>CSV exports use the records currently shown in this preview.</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
