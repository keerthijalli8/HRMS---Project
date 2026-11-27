import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "../../context/NavigationContext.jsx";

import {
  Building2,
  Building,
  Users,
  CreditCard,
  IndianRupee,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  Zap,
  UserPlus,
  Plus,
  FileText,
  LayoutDashboard,
  HeartPulse,
  ChartNoAxesCombined,
  List,
  Search,
  Filter,
  Eye,
  X,
  ShieldAlert,
} from "lucide-react";

import "./Dashboard.css";

const kpiData = [
  {
    title: "Total Tenants",
    value: "7",
    change: "+12.8%",
    trend: "up",
    description: "Compared to last month",
    icon: Building2,
    color: "mint",
    path: "/super-admin/tenants",
    filter: "all",
  },
  {
    title: "Active Organizations",
    value: "3",
    change: "+8.4%",
    trend: "up",
    description: "Compared to last month",
    icon: Building,
    color: "violet",
    path: "/super-admin/organizations",
    filter: "active",
  },
  {
    title: "Platform Users",
    value: "3",
    change: "+15.2%",
    trend: "up",
    description: "Compared to last month",
    icon: Users,
    color: "blue",
    path: "/super-admin/platform-users",
    filter: "all",
  },
  {
    title: "Active Subscriptions",
    value: "4",
    change: "+6.7%",
    trend: "up",
    description: "Compared to last month",
    icon: CreditCard,
    color: "mint",
    path: "/super-admin/subscriptions",
    filter: "active",
  },
  {
    title: "Monthly Revenue",
    value: "₹7,999",
    change: "+11.3%",
    trend: "up",
    description: "Compared to last month",
    icon: IndianRupee,
    color: "gold",
    path: "/super-admin/billing",
    filter: "paid",
  },
  {
    title: "Pending Payments",
    value: "1",
    change: "-3.2%",
    trend: "down",
    description: "Compared to last month",
    icon: Clock,
    color: "orange",
    path: "/super-admin/billing",
    filter: "pending",
  },
];

const dashboardSections = [
  { id: "overview", label: "Overview", count: "6 KPIs" },
  { id: "health", label: "Platform Health", count: "4" },
  { id: "subscriptions", label: "Subscriptions", count: "9" },
  { id: "analytics", label: "Usage Analytics", count: "3" },
  { id: "activities", label: "Recent Activities", count: "5" },
  { id: "security", label: "Security", count: "Logs" },
];

const subscriptionPlans = [
  {
    name: "Starter",
    organizations: 3,
    percentage: 33,
    amount: "₹999",
    color: "starter",
  },
  {
    name: "Professional",
    organizations: 3,
    percentage: 33,
    amount: "₹2,499",
    color: "professional",
  },
  {
    name: "Enterprise",
    organizations: 3,
    percentage: 34,
    amount: "₹4,999",
    color: "enterprise",
  },
];

const subscriptionStatuses = [
  {
    name: "Active",
    count: 4,
    color: "status-active",
    filter: "active",
  },
  {
    name: "Trial",
    count: 1,
    color: "status-trial",
    filter: "trial",
  },
  {
    name: "Expired",
    count: 1,
    color: "status-expired",
    filter: "expired",
  },
  {
    name: "Suspended",
    count: 1,
    color: "status-suspended",
    filter: "suspended",
  },
  {
    name: "Cancelled",
    count: 2,
    color: "status-expired",
    filter: "cancelled",
  },
];

const securitySummaryCards = [
  { label: "Total Security Events", value: 6, filter: "all", tab: "all", tone: "mint" },
  { label: "Failed Login Attempts", value: 1, filter: "failed", tab: "login", tone: "orange" },
  { label: "Suspicious Activities", value: 1, filter: "suspicious", tab: "alerts", tone: "violet" },
  { label: "Active Security Alerts", value: 3, filter: "active", tab: "alerts", tone: "red" },
];

const securityDemoRecords = [
  { id: "SEC-001", date: "24 Nov 2026, 09:30 AM", user: "Admin One", company: "Technomold IT Solutions", activity: "Successful admin login", ip: "192.168.1.10", severity: "Low", status: "Resolved", type: "Login" },
  { id: "SEC-002", date: "24 Nov 2026, 09:18 AM", user: "Unknown User", company: "TechnoMold IT SOLUTIONS PVT LTD", activity: "Failed login attempt", ip: "192.168.1.50", severity: "High", status: "Open", type: "Login" },
  { id: "SEC-003", date: "23 Nov 2026, 04:12 PM", user: "Super Admin", company: "All Companies", activity: "Password change", ip: "192.168.1.11", severity: "Medium", status: "Resolved", type: "Account" },
  { id: "SEC-004", date: "23 Nov 2026, 02:35 PM", user: "Super Admin", company: "Bluewave Solutions", activity: "Role permission updated", ip: "192.168.1.11", severity: "Medium", status: "Resolved", type: "Admin" },
  { id: "SEC-005", date: "22 Nov 2026, 11:10 AM", user: "Unknown User", company: "Multiple Companies", activity: "Suspicious login detected", ip: "192.168.1.52", severity: "High", status: "Open", type: "Suspicious" },
  { id: "SEC-006", date: "22 Nov 2026, 10:05 AM", user: "Super Admin", company: "Nova Systems", activity: "User account suspended", ip: "192.168.1.11", severity: "High", status: "Open", type: "Admin" },
];

const activities = [
  {
    title: "New organization registered",
    description: "Apex Technologies joined the platform",
    time: "10 minutes ago",
    icon: Building2,
    color: "mint",
    path: "/super-admin/organizations",
  },
  {
    title: "Subscription upgraded",
    description: "Bluewave Solutions upgraded to Enterprise",
    time: "35 minutes ago",
    icon: TrendingUp,
    color: "violet",
    path: "/super-admin/subscriptions",
  },
  {
    title: "Payment received",
    description: "₹24,990 received from Nova Systems",
    time: "1 hour ago",
    icon: IndianRupee,
    color: "green",
    path: "/super-admin/billing",
  },
  {
    title: "New platform user added",
    description: "A new administrator account was created",
    time: "2 hours ago",
    icon: UserPlus,
    color: "blue",
    path: "/super-admin/platform-users",
  },
  {
    title: "Plan updated",
    description: "Professional plan pricing was updated",
    time: "3 hours ago",
    icon: FileText,
    color: "orange",
    path: "/super-admin/plans",
  },
];

const usageData = [
  { month: "Jan", value: 35 },
  { month: "Feb", value: 48 },
  { month: "Mar", value: 42 },
  { month: "Apr", value: 61 },
  { month: "May", value: 55 },
  { month: "Jun", value: 72 },
  { month: "Jul", value: 65 },
  { month: "Aug", value: 82 },
  { month: "Sep", value: 74 },
  { month: "Oct", value: 90 },
  { month: "Nov", value: 86 },
  { month: "Dec", value: 100 },
];

function SectionHeading({ title, subtitle, action, onAction }) {
  return (
    <div className="dash-section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {action && (
        <button className="dash-text-action" onClick={onAction}>
          {action}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function KpiCard({ item }) {
  const navigate = useNavigate();
  const Icon = item.icon;
  const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown;
  const getDestination = () => {
    const params = new URLSearchParams();
    if (item.filter === "all") {
      if (item.path === "/super-admin/subscriptions") params.set("status", "all");
      return `${item.path}${params.toString() ? `?${params}` : ""}`;
    }
    if (item.path === "/super-admin/billing") {
      params.set("status", item.filter);
      if (item.filter === "paid") params.set("kpi", "paid");
    } else if (item.path === "/super-admin/subscriptions") {
      params.set("status", item.filter);
    } else if (item.path === "/super-admin/organizations") {
      params.set("status", item.filter);
    } else if (item.path === "/super-admin/platform-users") {
      params.set("status", "all");
    } else {
      params.set("status", item.filter);
    }
    return `${item.path}?${params}`;
  };

  return (
    <button
      type="button"
      className="dash-kpi-card sa-main-kpi-card"
      onClick={() =>
        navigate(
          getDestination(),
          {
            state: {
              returnTo: "/super-admin/dashboard",
              returnLabel: `Dashboard – ${item.title}`,
              source: "Super Admin Dashboard",
              destination: item.path,
              filter: item.filter,
            },
          }
        )
      }
    >
      <div className="kpi-card-top">
        <div className={`kpi-icon ${item.color}`}>
          <Icon size={21} />
        </div>

        <ArrowUpRight className="kpi-open-icon" size={17} />
      </div>

      <div className="kpi-title">{item.title}</div>

      <div className="kpi-value">{item.value}</div>

      <div className="kpi-bottom">
        <span className={`kpi-change ${item.trend}`}>
          <TrendIcon size={13} />
          {item.change}
        </span>

        <span className="kpi-description">
          {item.description}
        </span>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useNavigation();

  const [activeSection, setActiveSection] = useState(() => {
    try {
      return sessionStorage.getItem("superAdminDashboardSection") || "overview";
    } catch {
      return "overview";
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("superAdminDashboardSection", activeSection);
    } catch {
      // Session state remains available for the current dashboard page.
    }
  }, [activeSection]);

  const [securitySearch, setSecuritySearch] = useState("");
  const [securitySeverity, setSecuritySeverity] = useState("All");
  const [securityType, setSecurityType] = useState("All");
  const [securityStatus, setSecurityStatus] = useState("All");
  const [selectedSecurityRecord, setSelectedSecurityRecord] = useState(null);

  const securityFilteredRecords = useMemo(() => {
    const term = securitySearch.trim().toLowerCase();
    return securityDemoRecords.filter((record) =>
      (!term || [record.id, record.date, record.user, record.company, record.activity, record.ip, record.severity, record.status]
        .join(" ").toLowerCase().includes(term)) &&
      (securitySeverity === "All" || record.severity === securitySeverity) &&
      (securityType === "All" || record.type === securityType) &&
      (securityStatus === "All" || record.status === securityStatus)
    );
  }, [securitySearch, securitySeverity, securityType, securityStatus]);

  const authFirstName = authUser?.name
    ? authUser.name.trim().split(/\s+/)[0]
    : "";
  const firstName =
    authFirstName || localStorage.getItem("superAdminFirstName") || "Admin";

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  const showSection = (section) =>
    activeSection === "overview" || activeSection === section;

  return (
    <div className="dashboard-page">

      {/* DASHBOARD HEADER */}

      <div className="dash-welcome">
        <div>
          <div className="dash-eyebrow">
            SUPER ADMIN / OVERVIEW
          </div>

          <h1>
            {greeting}, {firstName}!
          </h1>

          <p>
            Here's what's happening across your HRMS platform today.
          </p>
        </div>

      </div>

      {/* QUICK ACTIONS */}

      <div className="dash-quick-actions">
        <button onClick={() => navigate("/super-admin/tenants")}>
          <Plus size={16} />
          Create Tenant
        </button>

        <button onClick={() => navigate("/super-admin/plans")}>
          <FileText size={16} />
          Manage Plans
        </button>
      </div>

      {/* DASHBOARD SECTION PILLS */}

      <div className="dash-section-nav" role="tablist" aria-label="Dashboard sections">
        {dashboardSections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={activeSection === section.id}
            aria-pressed={activeSection === section.id}
            className={`dash-section-pill sa-pill-kpi ${
              activeSection === section.id ? "active" : ""
            }`}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.label}</span>
            <small>{section.count}</small>
          </button>
        ))}
      </div>

      {/* OVERVIEW KPI CARDS */}

      {showSection("overview") && (
        <div className="dash-kpi-grid sa-main-kpi-grid">
          {kpiData.map((item) => (
            <KpiCard key={item.title} item={item} />
          ))}
        </div>
      )}

      {/* PLATFORM HEALTH */}

      {showSection("health") && (
        <section className="dash-section">
          <SectionHeading
            title="Platform Health"
            subtitle="Real-time overview of your platform infrastructure"
            action="View Monitoring"
            onAction={() => navigate("/super-admin/monitoring")}
          />

          <div className="health-panel">
            <div className="health-panel-status">
              <div className="health-panel-status-copy">
                <span className="health-dot" />
                <strong>All Systems Operational</strong>
              </div>

              <span>
                All monitored services are responding normally
              </span>
            </div>

            <div className="health-grid">
              <div
                className="health-card"
                onClick={() => navigate("/super-admin/monitoring?tab=services&filter=Operational", { state: { returnTo: "/super-admin/dashboard", returnLabel: "Dashboard – System Status", source: "Super Admin Dashboard", destination: "/super-admin/monitoring", submodule: "Service Health", filter: "Operational" } })}
                role="button"
                tabIndex={0}
                onKeyDown={(event) =>
                  event.key === "Enter" && navigate("/super-admin/monitoring?tab=services&filter=Operational")
                }
              >
                <div className="health-icon mint">
                  <Activity size={20} />
                </div>

                <span className="health-label">System Status</span>
                <h3>Healthy</h3>

                <span className="health-small positive">
                  <CircleCheck size={13} />
                  All systems operational
                </span>
              </div>

              <div
                className="health-card"
                onClick={() => navigate("/super-admin/monitoring?tab=performance&filter=uptime", { state: { returnTo: "/super-admin/dashboard", returnLabel: "Dashboard – Server Uptime", source: "Super Admin Dashboard", destination: "/super-admin/monitoring", submodule: "Performance", filter: "Uptime" } })}
                role="button"
                tabIndex={0}
                onKeyDown={(event) =>
                  event.key === "Enter" && navigate("/super-admin/monitoring?tab=performance&filter=uptime")
                }
              >
                <div className="health-icon violet">
                  <Server size={20} />
                </div>

                <span className="health-label">Server Uptime</span>
                <h3>99.98%</h3>

                <span className="health-small positive">
                  <CircleCheck size={13} />
                  Within target
                </span>
              </div>

              <div
                className="health-card"
                onClick={() => navigate("/super-admin/monitoring?tab=api&filter=response", { state: { returnTo: "/super-admin/dashboard", returnLabel: "Dashboard – API Response", source: "Super Admin Dashboard", destination: "/super-admin/monitoring", submodule: "API Monitoring", filter: "Response Time" } })}
                role="button"
                tabIndex={0}
                onKeyDown={(event) =>
                  event.key === "Enter" && navigate("/super-admin/monitoring?tab=api&filter=response")
                }
              >
                <div className="health-icon blue">
                  <Zap size={20} />
                </div>

                <span className="health-label">API Response</span>
                <h3>142 ms</h3>

                <span className="health-small positive">
                  <TrendingDown size={13} />
                  Response time
                </span>
              </div>

              <div
                className="health-card"
                onClick={() => navigate("/super-admin/monitoring?tab=database&filter=usage", { state: { returnTo: "/super-admin/dashboard", returnLabel: "Dashboard – Database Usage", source: "Super Admin Dashboard", destination: "/super-admin/monitoring", submodule: "Database Monitoring", filter: "Database Usage" } })}
                role="button"
                tabIndex={0}
                onKeyDown={(event) =>
                  event.key === "Enter" && navigate("/super-admin/monitoring?tab=database&filter=usage")
                }
              >
                <div className="health-icon orange">
                  <Database size={20} />
                </div>

                <span className="health-label">Database Usage</span>
                <h3>68%</h3>

                <div className="health-progress">
                  <span style={{ width: "68%" }} />
                </div>

                <span className="health-small">
                  Storage utilization
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUBSCRIPTION OVERVIEW */}

      {showSection("subscriptions") && (
        <section className="dash-section">
          <SectionHeading
            title="Subscription Overview"
            subtitle="Track subscription distribution and organization status"
            action="View All Subscriptions"
            onAction={() => navigate("/super-admin/subscriptions")}
          />

          <div className="subscription-panel">
            <div className="subscription-top">
              <div>
                <span className="subscription-total-label">
                  TOTAL SUBSCRIPTIONS
                </span>

                <h3>9</h3>

                <span className="subscription-growth">
                  <TrendingUp size={14} />
                  6.7% from last month
                </span>
              </div>

              <div className="subscription-total-icon">
                <CreditCard size={24} />
              </div>
            </div>

            <div className="subscription-status-grid">
              {subscriptionStatuses.map((status) => (
                <button
                  key={status.name}
                  className="subscription-status"
                  onClick={() =>
                    navigate(
                      `/super-admin/subscriptions?status=${encodeURIComponent(status.filter)}`,
                      {
                        state: {
                          returnTo: "/super-admin/dashboard",
                          returnLabel: `Dashboard – ${status.name} Subscriptions`,
                          source: "Super Admin Dashboard",
                          destination: "/super-admin/subscriptions",
                          submodule: "Subscription Status",
                          filter: status.filter,
                        },
                      }
                    )
                  }
                >
                  <span className={`status-indicator ${status.color}`} />

                  <span className="status-name">{status.name}</span>

                  <strong>{status.count}</strong>

                  <ArrowUpRight
                    size={14}
                    className="status-arrow"
                  />
                </button>
              ))}
            </div>

            <div className="subscription-divider" />

            <div className="plan-overview-heading">
              <h3>Plan Distribution</h3>
              <span>Organizations by plan</span>
            </div>

            <div className="plan-distribution">
              {subscriptionPlans.map((plan) => (
                <button
                  key={plan.name}
                  className="plan-card"
                  onClick={() =>
                    navigate(
                      `/subscriptions?plan=${encodeURIComponent(plan.name)}`
                    )
                  }
                >
                  <div className="plan-card-top">
                    <span className={`plan-dot ${plan.color}`} />
                    <span>{plan.name}</span>
                    <ArrowUpRight size={14} />
                  </div>

                  <strong>{plan.organizations}</strong>

                  <span className="plan-count-label">
                    Organizations
                  </span>

                  <div className="plan-progress">
                    <span
                      className={plan.color}
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>

                  <span className="plan-percentage">
                    {plan.percentage}% of subscriptions
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* USAGE ANALYTICS */}

      {showSection("analytics") && (
        <section className="dash-section">
          <SectionHeading
            title="Usage Analytics"
            subtitle="Platform user growth and activity overview"
            action="View Analytics"
            onAction={() => navigate("/super-admin/analytics")}
          />

          <div className="analytics-panel">
            <div className="analytics-top">
              <div>
                <span className="analytics-label">
                  TOTAL PLATFORM USERS
                </span>

                <h3>3</h3>

                <span className="analytics-growth">
                  <TrendingUp size={14} />
                  15.2% growth this year
                </span>
              </div>

              <button
                className="analytics-period"
                onClick={() => navigate("/super-admin/analytics")}
              >
                This year
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="analytics-chart">
              {usageData.map((item) => (
                <div className="chart-column" key={item.month}>
                  <div className="chart-bar-area">
                    <div
                      className="chart-bar"
                      style={{ height: `${item.value}%` }}
                      title={`${item.value}% activity`}
                    />
                  </div>

                  <span>{item.month}</span>
                </div>
              ))}
            </div>

            <div className="chart-footer">
              <span>
                <span className="chart-legend-dot" />
                User growth trend
              </span>
            </div>
          </div>
        </section>
      )}

      {/* RECENT ACTIVITIES */}

      {showSection("activities") && (
        <section className="dash-section">
          <SectionHeading
            title="Recent Activities"
            subtitle="Latest actions and updates across your platform"
            action="View Audit Logs"
            onAction={() => navigate("/super-admin/security-audit-logs")}
          />

          <div className="activity-panel">
            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <button
                  className="activity-row"
                  key={index}
                  onClick={() => navigate(activity.path)}
                >
                  <div className={`activity-icon ${activity.color}`}>
                    <Icon size={18} />
                  </div>

                  <div className="activity-details">
                    <strong>{activity.title}</strong>
                    <span>{activity.description}</span>
                  </div>

                  <span className="activity-time">
                    {activity.time}
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="activity-arrow"
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SECURITY */}

      {showSection("security") && (
        <section className="dash-section">
          <SectionHeading
            title="Security & Compliance"
            action="View Security Logs"
            onAction={() => navigate("/super-admin/security-audit-logs?tab=all", { state: { returnTo: "/super-admin/dashboard", returnLabel: "Dashboard – Security", source: "Super Admin Dashboard", destination: "/super-admin/security-audit-logs", submodule: "All Audit Logs", filter: "All" } })}
          />

          <div className="dash-security-summary">
            {securitySummaryCards.map((card) => {
              const params = new URLSearchParams({ tab: card.tab });
              if (card.filter === "failed") params.set("status", "Failed");
              if (card.filter === "suspicious") params.set("search", "Suspicious");
              if (card.filter === "active") params.set("severity", "High");
              return (
                <button
                  type="button"
                  key={card.label}
                  className={`dash-security-summary-card ${card.tone}`}
                  onClick={() => navigate(`/super-admin/security-audit-logs?${params}`, {
                    state: {
                      returnTo: "/super-admin/dashboard",
                      returnLabel: `Dashboard – ${card.label}`,
                      source: "Super Admin Dashboard",
                      destination: "/super-admin/security-audit-logs",
                      submodule: card.tab === "alerts" ? "Security Alerts" : card.tab === "login" ? "Login History" : "All Audit Logs",
                      filter: card.label,
                    },
                  })}
                >
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <ArrowUpRight size={15} />
                </button>
              );
            })}
          </div>

          <div className="dash-security-table-panel">
            <div className="dash-security-toolbar">
              <div className="dash-security-search">
                <Search size={16} />
                <input
                  value={securitySearch}
                  onChange={(event) => setSecuritySearch(event.target.value)}
                  placeholder="Search security records..."
                  aria-label="Search security records"
                />
              </div>
              <select value={securitySeverity} onChange={(event) => setSecuritySeverity(event.target.value)} aria-label="Filter security severity">
                <option value="All">All Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <select value={securityType} onChange={(event) => setSecurityType(event.target.value)} aria-label="Filter activity type">
                <option value="All">All Activity Types</option>
                <option value="Login">Login</option>
                <option value="Account">Account</option>
                <option value="Admin">Admin</option>
                <option value="Suspicious">Suspicious</option>
              </select>
              <select value={securityStatus} onChange={(event) => setSecurityStatus(event.target.value)} aria-label="Filter security status">
                <option value="All">All Status</option>
                <option value="Resolved">Resolved</option>
                <option value="Open">Open</option>
              </select>
              {(securitySearch || securitySeverity !== "All" || securityType !== "All" || securityStatus !== "All") && (
                <button
                  type="button"
                  className="dash-security-clear"
                  onClick={() => {
                    setSecuritySearch("");
                    setSecuritySeverity("All");
                    setSecurityType("All");
                    setSecurityStatus("All");
                  }}
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            <div className="dash-security-table-wrap">
              <table className="dash-security-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>User</th>
                    <th>Company</th>
                    <th>Activity</th>
                    <th>IP Address</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {securityFilteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.user}</td>
                      <td>{record.company}</td>
                      <td>{record.activity}</td>
                      <td>{record.ip}</td>
                      <td><span className={`dash-severity ${record.severity.toLowerCase()}`}>{record.severity}</span></td>
                      <td><span className={`dash-security-status ${record.status.toLowerCase()}`}>{record.status}</span></td>
                      <td>
                        <button type="button" className="dash-security-view" onClick={() => setSelectedSecurityRecord(record)} aria-label={`View details for ${record.activity}`}>
                          <Eye size={15} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!securityFilteredRecords.length && (
                    <tr><td colSpan="8" className="dash-security-empty">No matching demo security records.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="dash-security-count">{securityFilteredRecords.length} matching example records</p>
          </div>

          {selectedSecurityRecord && (
            <div className="dash-security-modal-backdrop" role="presentation" onMouseDown={() => setSelectedSecurityRecord(null)}>
              <div className="dash-security-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
                <div className="dash-security-modal-heading">
                  <div>
                    <span>DEMO SECURITY RECORD</span>
                    <h3>{selectedSecurityRecord.activity}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedSecurityRecord(null)} aria-label="Close details"><X size={18} /></button>
                </div>
                <dl>
                  <dt>Record</dt><dd>{selectedSecurityRecord.id}</dd>
                  <dt>Date &amp; Time</dt><dd>{selectedSecurityRecord.date}</dd>
                  <dt>User</dt><dd>{selectedSecurityRecord.user}</dd>
                  <dt>Company</dt><dd>{selectedSecurityRecord.company}</dd>
                  <dt>IP Address</dt><dd>{selectedSecurityRecord.ip}</dd>
                  <dt>Severity</dt><dd>{selectedSecurityRecord.severity}</dd>
                  <dt>Status</dt><dd>{selectedSecurityRecord.status}</dd>
                </dl>
              </div>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
