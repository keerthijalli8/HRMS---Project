
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Plus, Power, Trash2, Pencil, Eye,
  Layers, CheckCircle2, PowerOff, Building2,
  ShieldCheck, History, RotateCcw, X, Save,
  AlertCircle, Package, LayoutDashboard,
  ArrowRight, Activity, Users, BarChart3
} from "lucide-react";
import "./ModuleManagement.css";
import { notifySaveSuccess } from "../../utils/saveNavigation";

const MODULE_KEY = "hrms.superadmin.modules.v2";
const TENANT_KEY = "hrms.superadmin.module.tenants.v2";
const PLAN_KEY = "hrms.superadmin.module.plans.v2";
const HISTORY_KEY = "superAdminModuleActivity";
const LEGACY_HISTORY_KEY = "hrms.superadmin.module.history.v2";

const initialModules = [
  { id: 1, name: "Employee Management", description: "Employee records and profiles", category: "Core HR", status: true },
  { id: 2, name: "Payroll", description: "Salary and payroll processing", category: "Finance", status: true },
  { id: 3, name: "Attendance", description: "Attendance and shift tracking", category: "Workforce", status: true },
  { id: 4, name: "Leave Management", description: "Leave requests and approvals", category: "Workforce", status: true },
  { id: 5, name: "Recruitment", description: "Hiring and applicant tracking", category: "Talent", status: false },
  { id: 6, name: "Performance", description: "Employee performance reviews", category: "Talent", status: true },
  { id: 7, name: "Reports & Analytics", description: "HR reports and business insights", category: "Analytics", status: true },
  { id: 8, name: "Employee Self Service", description: "Employee self-service portal", category: "Core HR", status: true },
  { id: 9, name: "Organization Management", description: "Departments, branches and organizational structure", category: "Core HR", status: true },
  { id: 10, name: "Document Management", description: "Employee documents and records", category: "Core HR", status: true },
  { id: 11, name: "Audit Logs", description: "System activities and security audit trail", category: "Security", status: true }
];

const defaultTenants = [
  { id: "tenant-1", name: "ABC Technologies", plan: "Professional" },
  { id: "tenant-2", name: "XYZ Solutions", plan: "Enterprise" },
  { id: "tenant-3", name: "Global Systems", plan: "Starter" }
];

const defaultPlans = [
  { id: "starter", name: "Starter", moduleIds: [1, 3, 4, 8] },
  { id: "professional", name: "Professional", moduleIds: [1, 2, 3, 4, 6, 7, 8, 9, 10] },
  { id: "enterprise", name: "Enterprise", moduleIds: initialModules.map(m => m.id) }
];

const categories = [
  "Core HR", "Finance", "Workforce", "Talent",
  "Analytics", "Security", "Other"
];

const initialModuleHistory = [
  { id: "MOD-ACT-001", action: "Module Created", target: "Recruitment", details: "Added Recruitment module", date: "2026-11-24T10:20:00", user: "Super Admin" },
  { id: "MOD-ACT-002", action: "Module Updated", target: "Payroll", details: "Updated module configuration", date: "2026-11-24T09:30:00", user: "Super Admin" },
  { id: "MOD-ACT-003", action: "Tenant Access Enabled", target: "Acme Technologies", details: "Enabled Payroll access", date: "2026-11-23T16:15:00", user: "Super Admin" },
  { id: "MOD-ACT-004", action: "Tenant Access Disabled", target: "Nova Systems", details: "Disabled Recruitment access", date: "2026-11-23T14:40:00", user: "Super Admin" },
  { id: "MOD-ACT-005", action: "Entitlement Updated", target: "Enterprise Plan", details: "Updated available modules", date: "2026-11-22T11:20:00", user: "Super Admin" },
  { id: "MOD-ACT-006", action: "Module Activated", target: "Attendance", details: "Activated Attendance module", date: "2026-11-22T10:10:00", user: "Super Admin" },
  { id: "MOD-ACT-007", action: "Module Updated", target: "Reports & Analytics", details: "Updated module settings", date: "2026-11-21T15:30:00", user: "Super Admin" },
  { id: "MOD-ACT-008", action: "Tenant Access Enabled", target: "Vertex Digital", details: "Enabled Document Management", date: "2026-11-20T12:00:00", user: "Super Admin" }
];

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : fallback;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `module-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const blankForm = {
  name: "",
  description: "",
  category: "Core HR",
  status: true
};

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-IN");
}

export default function ModuleManagement() {
  const [searchParams] = useSearchParams();
  const [modules, setModules] = useState(() => {
    const data = load(MODULE_KEY, initialModules);
    return Array.isArray(data) ? data : initialModules;
  });

  const [plans, setPlans] = useState(() => {
    const data = load(PLAN_KEY, defaultPlans);
    return Array.isArray(data) ? data : defaultPlans;
  });

  const [tenantAccess, setTenantAccess] = useState(() => {
    const data = load(TENANT_KEY, {});
    return data && !Array.isArray(data) ? data : {};
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!saved) return initialModuleHistory;
    try {
      const data = JSON.parse(saved);
      return Array.isArray(data) && data.length ? data : initialModuleHistory;
    } catch {
      return initialModuleHistory;
    }
  });

  const tenants = defaultTenants;

  // Overview is the default page.
  const [tab, setTab] = useState("overview");
  const [kpi, setKpi] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [selected, setSelected] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(defaultTenants[0].id);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [notice, setNotice] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyAction, setHistoryAction] = useState("All");
  const [historyTenant, setHistoryTenant] = useState("All");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    const requestedSearch = searchParams.get("search") || "";
    const requestedAction = searchParams.get("action") || "All";
    if (["overview", "modules", "tenants", "plans", "history"].includes(requestedTab)) {
      setTab(requestedTab);
    }
    if (requestedTab === "history") {
      setHistorySearch(requestedSearch);
      setHistoryAction(requestedAction);
    } else if (requestedTab === "modules") {
      setSearch(requestedSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem(MODULE_KEY, JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(TENANT_KEY, JSON.stringify(tenantAccess));
  }, [tenantAccess]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addHistory = (action, target, details = "") => {
    setHistory(prev => [
      {
        id: makeId(),
        action,
        target,
        details,
        date: new Date().toISOString(),
        user: "Super Admin"
      },
      ...prev
    ].slice(0, 200));
    notifySaveSuccess(`${action} completed successfully.`);
  };

  const total = modules.length;
  const enabled = modules.filter(m => m.status).length;
  const disabled = total - enabled;

  const getTenantModules = tenant => {
    if (!tenant) return [];

    if (Object.prototype.hasOwnProperty.call(tenantAccess, tenant.id)) {
      return Array.isArray(tenantAccess[tenant.id])
        ? tenantAccess[tenant.id]
        : [];
    }

    return plans.find(p => p.name === tenant.plan)?.moduleIds || [];
  };

  const getEffectiveTenantModules = tenant =>
    modules.filter(m =>
      m.status && getTenantModules(tenant).includes(m.id)
    );

  const currentTenant = tenants.find(t => t.id === selectedTenant);
  const activePlan = plans.find(p => p.id === selectedPlan);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return modules.filter(module => {
      const matchesSearch =
        `${module.name} ${module.description} ${module.category || ""}`
          .toLowerCase()
          .includes(query);

      const matchesKpi =
        kpi === "all" ||
        (kpi === "enabled" && module.status) ||
        (kpi === "disabled" && !module.status);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Enabled" && module.status) ||
        (statusFilter === "Disabled" && !module.status);

      const matchesCategory =
        categoryFilter === "All" ||
        module.category === categoryFilter;

      return matchesSearch && matchesKpi &&
        matchesStatus && matchesCategory;
    });
  }, [modules, search, kpi, statusFilter, categoryFilter]);

  const categorySummary = useMemo(() => {
    return categories
      .map(category => ({
        name: category,
        count: modules.filter(m => (m.category || "Other") === category).length
      }))
      .filter(item => item.count > 0);
  }, [modules]);

  const resetFilters = () => {
    setSearch("");
    setKpi("all");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  const openModuleList = filter => {
    setKpi(filter);
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setTab("modules");
  };

  const openCategoryList = category => {
    setKpi("all");
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter(category);
    setTab("modules");
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...blankForm });
    setShowForm(true);
    setNotice("");
  };

  const openEdit = module => {
    setEditing(module.id);
    setForm({
      name: module.name,
      description: module.description,
      category: module.category || "Other",
      status: Boolean(module.status)
    });
    setShowForm(true);
    setNotice("");
  };

  const saveModule = e => {
    e.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name || !description) {
      setNotice("Module name and description are required.");
      return;
    }

    const duplicate = modules.some(m =>
      m.name.toLowerCase() === name.toLowerCase() &&
      m.id !== editing
    );

    if (duplicate) {
      setNotice("A module with this name already exists.");
      return;
    }

    if (editing !== null) {
      setModules(prev => prev.map(m =>
        m.id === editing
          ? { ...m, ...form, name, description }
          : m
      ));
      addHistory("Updated", name, "Module configuration updated");
      setNotice("Module updated successfully.");
    } else {
      setModules(prev => [
        ...prev,
        { id: makeId(), ...form, name, description }
      ]);
      addHistory("Created", name, "New platform module added");
      setNotice("Module created successfully.");
    }

    setShowForm(false);
    setEditing(null);
    setForm({ ...blankForm });
  };

  const toggleModule = module => {
    const nextStatus = !module.status;

    if (!window.confirm(
      `${nextStatus ? "Enable" : "Disable"} ${module.name}?`
    )) return;

    setModules(prev => prev.map(m =>
      m.id === module.id
        ? { ...m, status: nextStatus }
        : m
    ));

    addHistory(
      nextStatus ? "Enabled" : "Disabled",
      module.name,
      "Platform-wide module status changed"
    );

    setNotice(`Module ${nextStatus ? "enabled" : "disabled"} successfully.`);
  };

  const deleteModule = module => {
    if (!window.confirm(
      `Delete "${module.name}"? This will also remove its plan and tenant assignments.`
    )) return;

    setModules(prev => prev.filter(m => m.id !== module.id));

    setPlans(prev => prev.map(p => ({
      ...p,
      moduleIds: p.moduleIds.filter(id => id !== module.id)
    })));

    setTenantAccess(prev => {
      const updated = {};
      Object.entries(prev).forEach(([tenantId, ids]) => {
        updated[tenantId] = Array.isArray(ids)
          ? ids.filter(id => id !== module.id)
          : [];
      });
      return updated;
    });

    addHistory("Deleted", module.name, "Module removed from platform");
    setSelected(null);
    setNotice("Module deleted successfully.");
  };

  const toggleTenantModule = module => {
    if (!currentTenant) return;

    const current = getTenantModules(currentTenant);
    const next = current.includes(module.id)
      ? current.filter(id => id !== module.id)
      : [...current, module.id];

    setTenantAccess(prev => ({
      ...prev,
      [selectedTenant]: next
    }));

    addHistory(
      "Tenant Access",
      currentTenant.name,
      `${module.name}: ${next.includes(module.id) ? "Granted" : "Revoked"}`
    );

    setNotice("Tenant module access updated.");
  };

  const resetTenantAccess = () => {
    if (!currentTenant) return;

    if (!window.confirm(
      "Restore tenant access from its subscription plan?"
    )) return;

    setTenantAccess(prev => {
      const updated = { ...prev };
      delete updated[selectedTenant];
      return updated;
    });

    addHistory(
      "Tenant Access Reset",
      currentTenant.name,
      "Restored subscription plan defaults"
    );

    setNotice("Tenant access restored to plan defaults.");
  };

  const togglePlanModule = module => {
    if (!activePlan) return;

    const included = activePlan.moduleIds.includes(module.id);

    setPlans(prev => prev.map(p =>
      p.id === selectedPlan
        ? {
            ...p,
            moduleIds: included
              ? p.moduleIds.filter(id => id !== module.id)
              : [...p.moduleIds, module.id]
          }
        : p
    ));

    addHistory(
      "Plan Entitlement",
      activePlan.name,
      `${module.name}: ${included ? "Removed" : "Included"}`
    );

    setNotice("Plan entitlement updated.");
  };

  const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)), [history]);
  const recentActivity = sortedHistory.slice(0, 5);
  const historyActions = [...new Set(history.map((item) => item.action))];
  const historyTargets = [...new Set(history.map((item) => item.target))];
  const filteredHistory = useMemo(() => sortedHistory.filter((item) => {
    const term = historySearch.trim().toLowerCase();
    const date = new Date(item.date || item.timestamp);
    return [item.action, item.target, item.details].join(" ").toLowerCase().includes(term) &&
      (historyAction === "All" || item.action === historyAction) &&
      (historyTenant === "All" || item.target === historyTenant) &&
      (!historyFrom || date >= new Date(`${historyFrom}T00:00:00`)) &&
      (!historyTo || date <= new Date(`${historyTo}T23:59:59`));
  }), [sortedHistory, historySearch, historyAction, historyTenant, historyFrom, historyTo]);

  return (
    <div className="mm-page">
      <div className="mm-header">
        <div>
          <div className="mm-eyebrow">
            SUPER ADMIN / PLATFORM CONTROL
          </div>
          <h1>Module Management</h1>
          <p>
            Manage platform modules, tenant access and subscription entitlements.
          </p>
        </div>

        <button className="mm-primary" onClick={openAdd}>
          <Plus size={17} />
          Add Module
        </button>
      </div>

      {notice && (
        <div className="mm-notice" role="status">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mm-tabs">
        {[
          { id: "overview", name: "Overview", icon: LayoutDashboard },
          { id: "modules", name: "All Modules", icon: Layers },
          { id: "tenants", name: "Tenant Access", icon: Building2 },
          { id: "plans", name: "Plan Entitlements", icon: ShieldCheck },
          { id: "history", name: "Activity History", icon: History }
        ].map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              className={`sa-pill-kpi ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <Icon size={16} />
              {item.name}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="mm-overview">
          <div className="mm-overview-heading">
            <div>
              <h2>Module Overview</h2>
              <p>
                Real-time summary of modules and access settings
                configured in this dashboard.
              </p>
            </div>
            <button
              className="mm-secondary"
              onClick={() => openModuleList("all")}
            >
              View All Modules <ArrowRight size={16} />
            </button>
          </div>

          <div className="mm-overview-stats">
            {[
              {
                label: "Total Modules",
                value: total,
                icon: Layers,
                action: () => openModuleList("all"),
                hint: "View all platform modules"
              },
              {
                label: "Enabled Modules",
                value: enabled,
                icon: CheckCircle2,
                action: () => openModuleList("enabled"),
                hint: "View active modules"
              },
              {
                label: "Disabled Modules",
                value: disabled,
                icon: PowerOff,
                action: () => openModuleList("disabled"),
                hint: "View inactive modules"
              },
              {
                label: "Total Tenants",
                value: tenants.length,
                icon: Building2,
                action: () => setTab("tenants"),
                hint: "Manage tenant access"
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className="mm-overview-stat"
                  onClick={item.action}
                >
                  <div className="mm-stat-top">
                    <span>{item.label}</span>
                    <Icon size={21} />
                  </div>
                  <strong>{item.value}</strong>
                  <small>{item.hint}</small>
                </button>
              );
            })}
          </div>

          <div className="mm-overview-grid">
            <section className="mm-panel mm-overview-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Module Status Distribution</h3>
                  <p>Enabled versus disabled platform modules</p>
                </div>
                <Activity size={19} />
              </div>

              <div className="mm-status-summary">
                <div className="mm-status-number">
                  <strong>{total}</strong>
                  <span>Total Modules</span>
                </div>

                <div className="mm-status-chart">
                  <div
                    className="mm-status-enabled-bar"
                    style={{
                      width: `${total ? (enabled / total) * 100 : 0}%`
                    }}
                  />
                  <div
                    className="mm-status-disabled-bar"
                    style={{
                      width: `${total ? (disabled / total) * 100 : 0}%`
                    }}
                  />
                </div>

                <div className="mm-status-legend">
                  <button
                    type="button"
                    className="mm-legend-filter"
                    onClick={() => openModuleList("enabled")}
                  >
                    <i className="mm-dot-enabled" />
                    Enabled: {enabled}
                  </button>
                  <button
                    type="button"
                    className="mm-legend-filter"
                    onClick={() => openModuleList("disabled")}
                  >
                    <i className="mm-dot-disabled" />
                    Disabled: {disabled}
                  </button>
                </div>
              </div>
            </section>

            <section className="mm-panel mm-overview-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Modules by Category</h3>
                  <p>Distribution across HRMS categories</p>
                </div>
                <BarChart3 size={19} />
              </div>

              <div className="mm-category-list">
                {categorySummary.map(item => (
                  <button
                    type="button"
                    className="mm-category-row"
                    key={item.name}
                    onClick={() => openCategoryList(item.name)}
                  >
                    <div className="mm-category-label">
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="mm-category-track">
                      <div
                        style={{
                          width: `${total ? (item.count / total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </button>
                ))}

                {categorySummary.length === 0 && (
                  <p className="mm-muted">No modules configured.</p>
                )}
              </div>
            </section>
          </div>

          <div className="mm-overview-grid">
            <section className="mm-panel mm-overview-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Tenant Access Summary</h3>
                  <p>Modules available to each organization</p>
                </div>
                <Building2 size={19} />
              </div>

              <div className="mm-overview-tenant-list">
                {tenants.map(tenant => (
                  <button
                    key={tenant.id}
                    className="mm-overview-tenant"
                    onClick={() => {
                      setSelectedTenant(tenant.id);
                      setTab("tenants");
                    }}
                  >
                    <div className="mm-tenant-avatar">
                      <Building2 size={18} />
                    </div>
                    <div className="mm-overview-tenant-info">
                      <strong>{tenant.name}</strong>
                      <span>{tenant.plan} Plan</span>
                    </div>
                    <div className="mm-overview-tenant-count">
                      <strong>{getEffectiveTenantModules(tenant).length}</strong>
                      <span>Available</span>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </section>

            <section className="mm-panel mm-overview-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Frequently used module controls</p>
                </div>
                <Layers size={19} />
              </div>

              <div className="mm-quick-grid">
                {[
                  {
                    title: "Add Module",
                    desc: "Create a new platform module",
                    icon: Plus,
                    action: openAdd
                  },
                  {
                    title: "Manage Modules",
                    desc: "View and update module settings",
                    icon: Layers,
                    action: () => openModuleList("all")
                  },
                  {
                    title: "Tenant Access",
                    desc: "Manage organization permissions",
                    icon: Building2,
                    action: () => setTab("tenants")
                  },
                  {
                    title: "Plan Entitlements",
                    desc: "Configure subscription access",
                    icon: Package,
                    action: () => setTab("plans")
                  }
                ].map(item => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.title}
                      className="mm-quick-action"
                      onClick={item.action}
                    >
                      <div className="mm-quick-icon">
                        <Icon size={18} />
                      </div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                      <ArrowRight size={15} className="mm-quick-arrow" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="mm-panel mm-overview-panel">
            <div className="mm-panel-title">
              <div>
                <h3>Recent Module Activity</h3>
                <p>Latest changes made in Module Management</p>
              </div>
              <button
                className="mm-text-button"
                onClick={() => setTab("history")}
              >
                View History <ArrowRight size={15} />
              </button>
            </div>

            {recentActivity.length ? (
              <div className="mm-recent-list">
                {recentActivity.map(item => (
                  <div className="mm-recent-item" key={item.id}>
                    <div className="mm-recent-icon">
                      <History size={17} />
                    </div>
                    <div>
                      <strong>{item.action} — {item.target}</strong>
                      <p>{item.details}</p>
                    </div>
                    <span>{formatDate(item.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mm-overview-empty">
                <History size={25} />
                <p>No recent activity yet. Changes will appear here.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "modules" && (
        <>
          <div className="mm-stats">
            {[
              { label: "Total Modules", value: total, key: "all", icon: Layers },
              { label: "Enabled Modules", value: enabled, key: "enabled", icon: CheckCircle2 },
              { label: "Disabled Modules", value: disabled, key: "disabled", icon: PowerOff }
            ].map(stat => {
              const Icon = stat.icon;

              return (
                <button
                  key={stat.key}
                  type="button"
                  className={`mm-stat-card ${kpi === stat.key ? "selected" : ""}`}
                  onClick={() => openModuleList(stat.key)}
                >
                  <div className="mm-stat-top">
                    <span>{stat.label}</span>
                    <Icon size={21} />
                  </div>
                  <strong>{stat.value}</strong>
                  <small>Click to filter modules</small>
                </button>
              );
            })}
          </div>

          <section className="mm-panel">
            <div className="mm-panel-heading">
              <div>
                <h2>All Platform Modules</h2>
                <p>Create, edit and control HRMS module availability.</p>
              </div>
            </div>

            <div className="mm-toolbar">
              <div className="mm-search">
                <Search size={17} />
                <input
                  placeholder="Search modules..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                className="mm-select"
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setKpi("all");
                }}
              >
                <option value="All">All Status</option>
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </select>

              <select
                className="mm-select"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <button className="mm-secondary" onClick={resetFilters}>
                <RotateCcw size={15} /> Reset
              </button>
            </div>

            <div className="mm-results">
              Showing {filtered.length} of {modules.length} modules
            </div>

            <div className="mm-grid">
              {filtered.map(module => (
                <article className="mm-card" key={module.id}>
                  <div className="mm-card-top">
                    <div className="mm-module-icon">
                      <Layers size={20} />
                    </div>
                    <span className={module.status ? "mm-enabled" : "mm-disabled"}>
                      {module.status ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <div className="mm-card-body">
                    <span className="mm-category">
                      {module.category || "Other"}
                    </span>
                    <h3>{module.name}</h3>
                    <p>{module.description}</p>
                  </div>

                  <div className="mm-card-footer">
                    <button
                      className="mm-icon-button"
                      title="View Details"
                      aria-label={`View ${module.name}`}
                      onClick={() => setSelected(module)}
                    >
                      <Eye size={17} />
                    </button>

                    <button
                      className="mm-icon-button"
                      title="Edit Module"
                      aria-label={`Edit ${module.name}`}
                      onClick={() => openEdit(module)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className={`mm-icon-button ${module.status ? "mm-power-off" : ""}`}
                      title={module.status ? "Disable" : "Enable"}
                      aria-label={`${module.status ? "Disable" : "Enable"} ${module.name}`}
                      onClick={() => toggleModule(module)}
                    >
                      <Power size={17} />
                    </button>

                    <button
                      className="mm-icon-button mm-delete"
                      title="Delete Module"
                      aria-label={`Delete ${module.name}`}
                      onClick={() => deleteModule(module)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="mm-empty">
                <Layers size={30} />
                <h3>No modules found</h3>
                <p>Try changing your search or filters.</p>
                <button className="mm-secondary" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "tenants" && (
        <section className="mm-panel mm-section">
          <div className="mm-section-heading">
            <div>
              <h3>Tenant Module Access</h3>
              <p>Control which modules each organization can access.</p>
            </div>
            <button className="mm-secondary" onClick={resetTenantAccess}>
              <RotateCcw size={15} /> Restore Plan Defaults
            </button>
          </div>

          <div className="mm-tenant-selector">
            <label>
              Select Organization
              <select
                className="mm-select"
                value={selectedTenant}
                onChange={e => setSelectedTenant(e.target.value)}
              >
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mm-tenant-summary">
              <span>Subscription Plan</span>
              <strong>{currentTenant?.plan || "Not Assigned"}</strong>
            </div>

            <div className="mm-tenant-summary">
              <span>Available Modules</span>
              <strong>{getEffectiveTenantModules(currentTenant).length}</strong>
            </div>
          </div>

          <div className="mm-info">
            <AlertCircle size={17} />
            <span>
              Access starts from the tenant's plan. Manual changes create
              tenant-specific overrides. Platform-disabled modules remain unavailable.
            </span>
          </div>

          <div className="mm-access-list">
            {modules.map(module => {
              const granted = getTenantModules(currentTenant).includes(module.id);
              const effective = granted && module.status;

              return (
                <div className="mm-access-row" key={module.id}>
                  <div className="mm-access-info">
                    <div className="mm-module-icon">
                      <Layers size={17} />
                    </div>
                    <div>
                      <strong>{module.name}</strong>
                      <p>{module.description}</p>
                    </div>
                  </div>

                  <div className="mm-access-actions">
                    <span className={effective ? "mm-enabled" : "mm-disabled"}>
                      {effective
                        ? "Accessible"
                        : granted
                          ? "Platform Disabled"
                          : "No Access"}
                    </span>

                    <label className="mm-switch">
                      <input
                        type="checkbox"
                        checked={granted}
                        onChange={() => toggleTenantModule(module)}
                        aria-label={`Access to ${module.name}`}
                      />
                      <span />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "plans" && (
        <section className="mm-panel mm-section">
          <div className="mm-section-heading">
            <div>
              <h3>Subscription Plan Entitlements</h3>
              <p>Configure modules included in each subscription tier.</p>
            </div>
          </div>

          <div className="mm-plan-tabs">
            {plans.map(plan => (
              <button
                key={plan.id}
                className={selectedPlan === plan.id ? "active" : ""}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <Package size={17} />
                <span>{plan.name}</span>
                <small>{plan.moduleIds.length} modules</small>
              </button>
            ))}
          </div>

          <div className="mm-info">
            <ShieldCheck size={17} />
            <span>
              Configure plan-level module entitlements.
              Tenant-specific overrides remain separate.
            </span>
          </div>

          <div className="mm-access-list">
            {modules.map(module => {
              const included = activePlan?.moduleIds.includes(module.id);

              return (
                <div className="mm-access-row" key={module.id}>
                  <div className="mm-access-info">
                    <div className="mm-module-icon">
                      <Layers size={17} />
                    </div>
                    <div>
                      <strong>{module.name}</strong>
                      <p>
                        {module.category || "Other"} · {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="mm-access-actions">
                    <span className={included ? "mm-enabled" : "mm-disabled"}>
                      {included ? "Included" : "Excluded"}
                    </span>

                    <label className="mm-switch">
                      <input
                        type="checkbox"
                        checked={Boolean(included)}
                        onChange={() => togglePlanModule(module)}
                        aria-label={`Include ${module.name}`}
                      />
                      <span />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="mm-panel mm-section">
          <div className="mm-section-heading">
            <div>
              <h3>Module Activity History</h3>
              <p>Recent configuration and entitlement changes.</p>
            </div>
            <span className="mm-history-count">
              {filteredHistory.length} of {history.length} records
            </span>
          </div>

          <div className="mm-history-filters">
            <div className="mm-search"><Search size={16} /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search module, company or action..." /></div>
            <select value={historyAction} onChange={(event) => setHistoryAction(event.target.value)} aria-label="Filter module activity type"><option value="All">All Activity Types</option>{historyActions.map((action) => <option key={action}>{action}</option>)}</select>
            <select value={historyTenant} onChange={(event) => setHistoryTenant(event.target.value)} aria-label="Filter module activity target"><option value="All">All Targets</option>{historyTargets.map((target) => <option key={target}>{target}</option>)}</select>
            <label>From <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} /></label>
            <label>To <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} /></label>
            <button type="button" className="mm-secondary" onClick={() => { setHistorySearch(""); setHistoryAction("All"); setHistoryTenant("All"); setHistoryFrom(""); setHistoryTo(""); }}><RotateCcw size={15} /> Reset</button>
          </div>

          <div className="mm-table-wrap">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <span className="mm-history-action">
                        {item.action}
                      </span>
                    </td>
                    <td>{item.target}</td>
                    <td>{item.details}</td>
                    <td>{item.user}</td>
                  </tr>
                ))}

                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="mm-table-empty">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showForm && (
        <div
          className="mm-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <form className="mm-modal" onSubmit={saveModule}>
            <div className="mm-modal-heading">
              <div>
                <h2>{editing !== null ? "Edit Module" : "Add New Module"}</h2>
                <p>Configure platform module information.</p>
              </div>
              <button
                type="button"
                className="mm-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Module Name
              <input
                required
                maxLength={80}
                value={form.name}
                onChange={e => setForm({
                  ...form,
                  name: e.target.value
                })}
                placeholder="Enter module name"
              />
            </label>

            <label>
              Description
              <textarea
                required
                maxLength={300}
                value={form.description}
                onChange={e => setForm({
                  ...form,
                  description: e.target.value
                })}
                placeholder="Describe module functionality"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={e => setForm({
                  ...form,
                  category: e.target.value
                })}
              >
                {categories.map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Module Status
              <select
                value={form.status ? "enabled" : "disabled"}
                onChange={e => setForm({
                  ...form,
                  status: e.target.value === "enabled"
                })}
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            <div className="mm-actions">
              <button
                type="button"
                className="mm-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="mm-primary">
                <Save size={16} />
                {editing !== null ? "Update Module" : "Save Module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div
          className="mm-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="mm-modal mm-details-modal">
            <div className="mm-modal-heading">
              <div>
                <h2>Module Details</h2>
                <p>Platform module configuration and access.</p>
              </div>
              <button
                className="mm-close"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mm-detail-title">
              <div className="mm-module-icon">
                <Layers size={22} />
              </div>
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.description}</p>
              </div>
            </div>

            <div className="mm-detail-grid">
              <div>
                <span>Category</span>
                <strong>{selected.category || "Other"}</strong>
              </div>
              <div>
                <span>Platform Status</span>
                <strong>
                  {modules.find(m => m.id === selected.id)?.status
                    ? "Enabled"
                    : "Disabled"}
                </strong>
              </div>
              <div>
                <span>Included Plans</span>
                <strong>
                  {plans.filter(p =>
                    p.moduleIds.includes(selected.id)
                  ).length}
                </strong>
              </div>
              <div>
                <span>Tenant Assignments</span>
                <strong>
                  {tenants.filter(t =>
                    getTenantModules(t).includes(selected.id)
                  ).length}
                </strong>
              </div>
            </div>

            <h4 className="mm-detail-subtitle">Included in Plans</h4>
            <div className="mm-detail-tags">
              {plans
                .filter(p => p.moduleIds.includes(selected.id))
                .map(p => (
                  <span key={p.id} className="mm-enabled">
                    {p.name}
                  </span>
                ))}

              {plans.every(p => !p.moduleIds.includes(selected.id)) && (
                <span className="mm-disabled">
                  No plan assignments
                </span>
              )}
            </div>

            <div className="mm-actions">
              <button
                className="mm-primary"
                onClick={() => {
                  const latest = modules.find(m => m.id === selected.id);
                  setSelected(null);
                  if (latest) openEdit(latest);
                }}
              >
                <Pencil size={16} />
                Edit Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
