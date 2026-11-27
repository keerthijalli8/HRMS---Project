
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, Eye, Power,
  Layers3, CheckCircle2, GitCompareArrows,
  RotateCcw, X, Check, Users, Building2,
  HardDrive, ShieldCheck, LayoutDashboard,
  List, SlidersHorizontal, History, IndianRupee,
  ArrowRight, Clock3, Activity, CalendarDays
} from "lucide-react";
import "./PlanManagement.css";
import { PLAN_PRICING } from "../../utils/planPricing";
import { notifySaveSuccess } from "../../utils/saveNavigation";
import {
  PLAN_MODULES,
  PLAN_CATALOG_UPDATED_EVENT,
  PLAN_STORAGE_KEY,
  readPlanRecords,
} from "../../utils/planCatalog";

const HISTORY_KEY = "superAdminPlanActivity";
const LEGACY_HISTORY_KEY = "hrms.superadmin.plans.history.v1";

const EMPTY = {
  name: "",
  tier: "Starter",
  price: "",
  annualPrice: "",
  users: "",
  branches: "",
  storage: "",
  status: "Active",
  description: "",
  features: ["Dashboard"],
  customFeatures: []
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "plans", label: "All Plans", icon: List },
  { id: "features", label: "Features & Limits", icon: SlidersHorizontal },
  { id: "history", label: "Activity History", icon: History }
];

const currency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;

const formatted = (n) =>
  Number(n || 0).toLocaleString("en-IN");

function readHistory() {
  const demo = [
    {
      id: "DEMO-ACT-001",
      action: "Plan Created",
      planName: "Starter",
      details: "Starter plan created with core HRMS modules.",
      performedBy: "Super Admin",
      timestamp: "2026-11-24T10:30:00"
    },
    {
      id: "DEMO-ACT-002",
      action: "Plan Updated",
      planName: "Professional",
      details: "Professional plan limits and description updated.",
      performedBy: "Super Admin",
      timestamp: "2026-11-24T09:45:00"
    },
    {
      id: "DEMO-ACT-003",
      action: "Feature Added",
      planName: "Enterprise",
      details: "Advanced Analytics enabled for Enterprise.",
      performedBy: "Super Admin",
      timestamp: "2026-11-23T16:20:00"
    },
    {
      id: "DEMO-ACT-004",
      action: "Pricing Updated",
      planName: "Professional",
      details: "Professional monthly pricing updated.",
      performedBy: "Super Admin",
      timestamp: "2026-11-23T14:15:00"
    },
    {
      id: "DEMO-ACT-005",
      action: "Plan Activated",
      planName: "Starter",
      details: "Starter subscription plan enabled.",
      performedBy: "Super Admin",
      timestamp: "2026-11-22T11:30:00"
    },
    {
      id: "DEMO-ACT-006",
      action: "Feature Removed",
      planName: "Starter",
      details: "Custom reporting feature removed from Starter.",
      performedBy: "Super Admin",
      timestamp: "2026-11-22T10:15:00"
    },
    {
      id: "DEMO-ACT-007",
      action: "Plan Updated",
      planName: "Enterprise",
      details: "Enterprise user and storage limits updated.",
      performedBy: "Super Admin",
      timestamp: "2026-11-21T15:40:00"
    },
    {
      id: "DEMO-ACT-008",
      action: "Plan Created",
      planName: "Enterprise",
      details: "Enterprise plan created for large organizations.",
      performedBy: "Super Admin",
      timestamp: "2026-11-20T12:10:00"
    }
  ];

  try {
    const saved = localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!saved) return demo;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return demo;
    return parsed.map((item) => ({ ...item, performedBy: item.performedBy || "Super Admin" }));
  } catch {
    return demo;
  }
}

function StatusBadge({ status }) {
  return (
    <span
      className={`plan-v3-badge ${
        status === "Active" ? "is-active" : "is-inactive"
      }`}
    >
      <span className="plan-v3-dot" />
      {status}
    </span>
  );
}

function IconButton({ icon: Icon, title, onClick, danger }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`plan-v3-icon-btn ${danger ? "is-danger" : ""}`}
      onClick={onClick}
    >
      <Icon size={16} />
    </button>
  );
}

function Kpi({ title, value, icon: Icon, type, onClick, subtitle }) {
  return (
    <button
      type="button"
      className={`plan-v3-kpi sa-main-kpi-card ${type || ""}`}
      onClick={onClick}
    >
      <div className="plan-v3-kpi-copy">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle || "Click to view plans"}</small>
      </div>
      <div className="plan-v3-kpi-icon">
        <Icon size={22} strokeWidth={1.8} />
      </div>
    </button>
  );
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="plan-v3-detail">
      <Icon size={19} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div
      className="plan-v3-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`plan-v3-modal ${wide ? "is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="plan-v3-modal-head">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            className="plan-v3-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function formatActivityDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function featureNames(features = []) {
  return features.map((feature) =>
    typeof feature === "string" ? feature : feature.name
  );
}

function customFeatureLabel(feature) {
  return feature?.name || "Unnamed custom feature";
}

export default function PlanManagement() {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState(readPlanRecords);
  const [history, setHistory] = useState(readHistory);

  const [tab, setTab] = useState("overview");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");

  const [historySearch, setHistorySearch] = useState("");
  const [historyPlanFilter, setHistoryPlanFilter] = useState("All");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("All");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    ...EMPTY,
    features: [...EMPTY.features]
  });
  const [error, setError] = useState("");
  const [customFeatureDraft, setCustomFeatureDraft] = useState({
    name: "",
    description: ""
  });
  const [editingCustomFeatureId, setEditingCustomFeatureId] = useState(null);

  const [viewId, setViewId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (["overview", "plans", "features", "history"].includes(requestedTab)) {
      setTab(requestedTab);
    }
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // History remains available in this session.
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
      window.dispatchEvent(new Event(PLAN_CATALOG_UPDATED_EVENT));
    } catch {
      window.alert("Could not save plans to browser storage.");
    }
  }, [plans]);

  const saveAll = (next) => {
    setPlans(next);
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      window.alert("Could not save plans to browser storage.");
    }
  };

  const addHistory = (action, planName, details) => {
    const entry = {
      id: `ACT-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      action,
      planName,
      details,
      performedBy: "Super Admin",
      timestamp: new Date().toISOString()
    };

    setHistory((previous) => [entry, ...previous]);
    notifySaveSuccess(`${action} completed successfully.`);
  };

  const addHistoryEntries = (entries) => {
    if (!entries.length) return;
    const timestamp = new Date().toISOString();
    const prepared = entries.map((entry, index) => ({
      ...entry,
      id: `ACT-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      performedBy: "Super Admin",
      timestamp
    }));
    setHistory((previous) => [...prepared, ...previous]);
  };

  const total = plans.length;
  const active = plans.filter(
    (p) => p.status === "Active"
  ).length;
  const inactive = total - active;

  const startingPrice = plans.length
    ? Math.min(...plans.map((p) => Number(p.price) || 0))
    : 0;

  const totalModules = PLAN_MODULES.length;

  const tierCounts = useMemo(() => {
    const counts = {
      Starter: 0,
      Professional: 0,
      Enterprise: 0,
      Custom: 0
    };

    plans.forEach((p) => {
      const tier = counts[p.tier] !== undefined
        ? p.tier
        : "Custom";
      counts[tier] += 1;
    });

    return counts;
  }, [plans]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return plans.filter((p) => {
      const text = [
        p.name,
        p.tier,
        p.description,
        ...(p.features || []),
        ...(p.customFeatures || []).flatMap((feature) => [feature.name, feature.description])
      ].join(" ").toLowerCase();

      return (
        text.includes(term) &&
        (statusFilter === "All" || p.status === statusFilter) &&
        (tierFilter === "All" || p.tier === tierFilter)
      );
    });
  }, [plans, search, statusFilter, tierFilter]);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [history]
  );

  const historyActivityTypes = useMemo(
    () => [...new Set(sortedHistory.map((item) => item.action))],
    [sortedHistory]
  );

  const filteredHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    return sortedHistory.filter((item) => {
      const matchesSearch = [item.planName, item.action, item.details]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const date = new Date(item.timestamp);
      const matchesPlan = historyPlanFilter === "All" || item.planName === historyPlanFilter;
      const matchesType = historyTypeFilter === "All" || item.action === historyTypeFilter;
      const matchesFrom = !historyFrom || date >= new Date(`${historyFrom}T00:00:00`);
      const matchesTo = !historyTo || date <= new Date(`${historyTo}T23:59:59`);
      return matchesSearch && matchesPlan && matchesType && matchesFrom && matchesTo;
    });
  }, [sortedHistory, historySearch, historyPlanFilter, historyTypeFilter, historyFrom, historyTo]);

  const selectedPlan = plans.find((p) => p.id === viewId);
  const compared = plans.filter(
    (p) => compareIds.includes(p.id)
  );

  const reset = () => {
    setSearch("");
    setStatusFilter("All");
    setTierFilter("All");
  };

  const navigate = (nextTab) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => {
      document.getElementById("plan-main-section")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    });
  };

  const filterKpi = (value) => {
    setSearch("");
    setTierFilter("All");
    setStatusFilter(value);
    navigate("plans");
  };

  const filterTier = (value) => {
    setSearch("");
    setStatusFilter("All");
    setTierFilter(value);
    navigate("plans");
  };

  const addPlan = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      features: [...EMPTY.features],
      customFeatures: []
    });
    setCustomFeatureDraft({ name: "", description: "" });
    setEditingCustomFeatureId(null);
    setError("");
    setShowForm(true);
  };

  const editPlan = (plan) => {
    setEditing(plan.id);
    setForm({
      ...plan,
      price: String(plan.price),
      annualPrice: String(plan.annualPrice),
      users: String(plan.users),
      branches: String(plan.branches),
      storage: String(plan.storage),
      features: [...(plan.features || [])],
      customFeatures: (plan.customFeatures || []).map((feature) => ({ ...feature })),
    });
    setCustomFeatureDraft({ name: "", description: "" });
    setEditingCustomFeatureId(null);
    setError("");
    setViewId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError("");
    setCustomFeatureDraft({ name: "", description: "" });
    setEditingCustomFeatureId(null);
  };

  const change = (field, value) => {
    setForm((previous) => {
      if (field === "tier" && PLAN_PRICING[value]) {
        return {
          ...previous,
          tier: value,
          price: String(PLAN_PRICING[value].monthly),
          annualPrice: String(PLAN_PRICING[value].annual),
        };
      }

      return { ...previous, [field]: value };
    });
  };

  const toggleFeature = (feature) => {
    setForm((previous) => ({
      ...previous,
      features: previous.features.includes(feature)
        ? previous.features.filter((m) => m !== feature)
        : [...previous.features, feature]
    }));
  };

  const toggleCustomFeature = (id) => {
    setForm((previous) => ({
      ...previous,
      customFeatures: (previous.customFeatures || []).map((feature) =>
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature
      )
    }));
  };

  const saveCustomFeatureDraft = () => {
    const name = customFeatureDraft.name.trim();
    const description = customFeatureDraft.description.trim();
    if (!name) {
      setError("Enter a custom feature name before adding it.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      customFeatures: editingCustomFeatureId
        ? (previous.customFeatures || []).map((feature) =>
            feature.id === editingCustomFeatureId
              ? { ...feature, name, description }
              : feature
          )
        : [
            ...(previous.customFeatures || []),
            {
              id: `CF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name,
              description,
              enabled: true
            }
          ]
    }));
    setCustomFeatureDraft({ name: "", description: "" });
    setEditingCustomFeatureId(null);
    setError("");
  };

  const editCustomFeature = (feature) => {
    setCustomFeatureDraft({ name: feature.name, description: feature.description || "" });
    setEditingCustomFeatureId(feature.id);
    setError("");
  };

  const removeCustomFeature = (id) => {
    setForm((previous) => ({
      ...previous,
      customFeatures: (previous.customFeatures || []).filter((feature) => feature.id !== id)
    }));
    if (editingCustomFeatureId === id) {
      setEditingCustomFeatureId(null);
      setCustomFeatureDraft({ name: "", description: "" });
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();

    if (name.length < 2) {
      setError("Enter a valid plan name.");
      return;
    }

    if (
      plans.some(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() &&
          p.id !== editing
      )
    ) {
      setError("This plan name already exists.");
      return;
    }

    for (const key of [
      "price",
      "annualPrice",
      "users",
      "branches",
      "storage"
    ]) {
      const value = Number(form[key]);

      if (
        form[key] === "" ||
        !Number.isFinite(value) ||
        value < (key === "price" || key === "annualPrice" ? 0 : 1) ||
        (key !== "price" && !Number.isInteger(value))
      ) {
        setError(`Enter a valid ${key} value.`);
        return;
      }
    }

    const hasSelectedEntitlement = form.features.length > 0 || (form.customFeatures || []).some((feature) => feature.enabled !== false);
    if (!hasSelectedEntitlement) {
      setError("Select at least one predefined module or custom feature.");
      return;
    }

    const payload = {
      ...form,
      name,
      price: Number(form.price),
      annualPrice: Number(form.annualPrice),
      users: Number(form.users),
      branches: Number(form.branches),
      storage: Number(form.storage),
      description: form.description.trim(),
      features: [...form.features],
      customFeatures: (form.customFeatures || []).map((feature) => ({ ...feature }))
    };

    if (editing !== null) {
      const oldPlan = plans.find((p) => p.id === editing);

      const oldFeatures = new Set(featureNames(oldPlan?.features));
      const nextFeatures = new Set(featureNames(payload.features));
      const oldCustom = new Map((oldPlan?.customFeatures || []).map((feature) => [feature.id, feature]));
      const nextCustom = new Map((payload.customFeatures || []).map((feature) => [feature.id, feature]));
      const activityEntries = [{
        action: "Plan Updated",
        planName: name,
        details: `Updated configuration for ${oldPlan?.name || name}`
      }];

      if (Number(oldPlan?.price) !== payload.price || Number(oldPlan?.annualPrice) !== payload.annualPrice) {
        activityEntries.push({ action: "Pricing Changed", planName: name, details: "Updated monthly or annual per-employee pricing." });
      }
      nextFeatures.forEach((feature) => {
        if (!oldFeatures.has(feature)) activityEntries.push({ action: "Predefined Feature Added", planName: name, details: `${feature} was added to the plan.` });
      });
      oldFeatures.forEach((feature) => {
        if (!nextFeatures.has(feature)) activityEntries.push({ action: "Predefined Feature Removed", planName: name, details: `${feature} was removed from the plan.` });
      });
      nextCustom.forEach((feature, id) => {
        const previous = oldCustom.get(id);
        if (!previous) activityEntries.push({ action: "Custom Feature Added", planName: name, details: `${customFeatureLabel(feature)} was added to the plan.` });
        else if (previous.name !== feature.name || previous.description !== feature.description) activityEntries.push({ action: "Custom Feature Edited", planName: name, details: `${customFeatureLabel(previous)} was updated.` });
      });
      oldCustom.forEach((feature, id) => {
        if (!nextCustom.has(id)) activityEntries.push({ action: "Custom Feature Removed", planName: name, details: `${customFeatureLabel(feature)} was removed from the plan.` });
      });

      saveAll(
        plans.map((p) =>
          p.id === editing
            ? { ...p, ...payload }
            : p
        )
      );

      addHistoryEntries(activityEntries);
    } else {
      const nextId = Math.max(
        0,
        ...plans.map((p) => Number(p.id) || 0)
      ) + 1;

      saveAll([
        ...plans,
        { ...payload, id: nextId }
      ]);

      const activityEntries = [{
        action: "Plan Created",
        planName: name,
        details: `Created ${payload.tier} subscription plan.`
      }];
      featureNames(payload.features).forEach((feature) => activityEntries.push({ action: "Predefined Feature Added", planName: name, details: `${feature} was included in the new plan.` }));
      (payload.customFeatures || []).forEach((feature) => activityEntries.push({ action: "Custom Feature Added", planName: name, details: `${customFeatureLabel(feature)} was included in the new plan.` }));
      addHistoryEntries(activityEntries);
    }

    closeForm();
    notifySaveSuccess(editing !== null ? "Plan updated successfully." : "Plan created successfully.");
  };

  const removePlan = (plan) => {
    if (!window.confirm(`Delete "${plan.name}" plan?`)) {
      return;
    }

    saveAll(plans.filter((p) => p.id !== plan.id));

    setCompareIds((ids) =>
      ids.filter((id) => id !== plan.id)
    );

    if (viewId === plan.id) {
      setViewId(null);
    }

    addHistory(
      "Plan Deleted",
      plan.name,
      `Deleted ${plan.tier} subscription plan`
    );
  };

  const toggleStatus = (plan) => {
    const status = plan.status === "Active"
      ? "Inactive"
      : "Active";

    if (
      !window.confirm(
        `${status === "Active" ? "Activate" : "Deactivate"} "${plan.name}"?`
      )
    ) {
      return;
    }

    saveAll(
      plans.map((p) =>
        p.id === plan.id ? { ...p, status } : p
      )
    );

    addHistory(
      status === "Active"
        ? "Plan Activated"
        : "Plan Deactivated",
      plan.name,
      `Changed status from ${plan.status} to ${status}`
    );
  };

  const toggleCompare = (id) => {
    setCompareIds((ids) => {
      if (ids.includes(id)) {
        return ids.filter((x) => x !== id);
      }
      if (ids.length >= 3) return ids;
      return [...ids, id];
    });
  };

  const openFeatureEditor = (plan) => {
    editPlan(plan);
  };

  const recentHistory = sortedHistory.slice(0, 5);

  return (
    <div className="plan-v3-root">
      <div className="plan-v3-header">
        <div>
          <div className="plan-v3-eyebrow">
            SUPER ADMIN / SUBSCRIPTION OPERATIONS
          </div>
          <h1>Plan Management</h1>
          <p>
            Define subscription tiers, pricing, limits,
            features and entitlements.
          </p>
        </div>

        <button
          type="button"
          className="plan-v3-primary"
          onClick={addPlan}
        >
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      <div className="plan-v3-tabs" role="tablist">
        {TABS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`sa-pill-kpi ${tab === item.id ? "is-active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <section id="plan-main-section">
        {tab === "overview" && (
          <>
            <div className="plan-v3-overview-intro">
              <div>
                <h2>Subscription Overview</h2>
                <p>
                  Monitor plan availability, pricing and
                  feature coverage in one place.
                </p>
              </div>

              <span className="plan-v3-overview-label">
                <Activity size={15} />
                Live Plan Summary
              </span>
            </div>

            <div className="plan-v3-kpi-grid plan-v3-kpi-four sa-main-kpi-grid">
              <Kpi
                title="Total Plans"
                value={total}
                icon={Layers3}
                type="total"
                onClick={() => filterKpi("All")}
                subtitle="View all subscription plans"
              />

              <Kpi
                title="Active Plans"
                value={active}
                icon={CheckCircle2}
                type="active"
                onClick={() => filterKpi("Active")}
                subtitle="View active plans"
              />

              <Kpi
                title="Inactive Plans"
                value={inactive}
                icon={Power}
                type="inactive"
                onClick={() => filterKpi("Inactive")}
                subtitle="View inactive plans"
              />

              <Kpi
                title="Starting Price"
                value={currency(startingPrice)}
                icon={IndianRupee}
                type="price"
                onClick={() => filterKpi("All")}
                subtitle="Lowest configured plan price"
              />
            </div>

            <div className="plan-v3-overview-grid">
              <div className="plan-v3-overview-card">
                <div className="plan-v3-card-heading">
                  <div>
                    <h3>Plan Status Distribution</h3>
                    <p>Active versus inactive plans</p>
                  </div>
                  <Layers3 size={19} />
                </div>

                <div className="plan-v3-distribution">
                  <div
                    className="plan-v3-donut"
                    style={{
                      background: total
                        ? `conic-gradient(
                            #62ddc8 0% ${(active / total) * 100}%,
                            #9c8cff ${(active / total) * 100}% 100%
                          )`
                        : "conic-gradient(#39535c 0% 100%)"
                    }}
                  >
                    <div className="plan-v3-donut-inner">
                      <strong>{total}</strong>
                      <span>Total Plans</span>
                    </div>
                  </div>

                  <div className="plan-v3-legend">
                    <button
                      type="button"
                      className="plan-v3-distribution-filter"
                      onClick={() => filterKpi("Active")}
                    >
                      <span>
                        <i className="plan-v3-legend-dot active" />
                        Active
                      </span>
                      <strong>{active}</strong>
                    </button>
                    <button
                      type="button"
                      className="plan-v3-distribution-filter"
                      onClick={() => filterKpi("Inactive")}
                    >
                      <span>
                        <i className="plan-v3-legend-dot inactive" />
                        Inactive
                      </span>
                      <strong>{inactive}</strong>
                    </button>
                  </div>
                </div>
              </div>

              <div className="plan-v3-overview-card">
                <div className="plan-v3-card-heading">
                  <div>
                    <h3>Plan Tier Distribution</h3>
                    <p>Plans grouped by subscription tier</p>
                  </div>
                  <GitCompareArrows size={19} />
                </div>

                <div className="plan-v3-tier-bars">
                  {Object.entries(tierCounts).map(
                    ([tier, count]) => (
                      <button
                        type="button"
                        className="plan-v3-tier-row"
                        key={tier}
                        onClick={() => filterTier(tier)}
                      >
                        <div className="plan-v3-tier-label">
                          <span>{tier}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="plan-v3-tier-track">
                          <div
                            className="plan-v3-tier-fill"
                            style={{
                              width: `${
                                total ? (count / total) * 100 : 0
                              }%`
                            }}
                          />
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="plan-v3-overview-card plan-v3-summary-card">
              <div className="plan-v3-card-heading">
                <div>
                  <h3>Subscription Plan Summary</h3>
                  <p>
                    Monthly and annual per-employee pricing by plan
                  </p>
                </div>

                <button
                  type="button"
                  className="plan-v3-text-action"
                  onClick={() => navigate("plans")}
                >
                  View All Plans
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="plan-v3-summary-list">
                {plans.map((plan) => (
                  <div
                    className="plan-v3-summary-item"
                    key={plan.id}
                  >
                    <div className="plan-v3-summary-identity">
                      <span className="plan-v3-plan-avatar">
                        <Layers3 size={18} />
                      </span>
                      <div>
                        <strong>{plan.name}</strong>
                        <small>{plan.tier} Tier</small>
                      </div>
                    </div>

                    <div className="plan-v3-summary-metric">
                      <span>Monthly / employee</span>
                      <strong>
                        {currency(plan.price)}
                        <small>/ month</small>
                      </strong>
                    </div>

                    <div className="plan-v3-summary-metric">
                      <span>Annual / employee</span>
                      <strong>
                        {currency(plan.annualPrice)}
                        <small>/ year</small>
                      </strong>
                    </div>

                    <div className="plan-v3-summary-metric">
                      <span>Entitlements</span>
                      <strong>
                        {(plan.features || []).length + (plan.customFeatures || []).filter((feature) => feature.enabled !== false).length}
                      </strong>
                    </div>

                    <StatusBadge status={plan.status} />

                    <button
                      type="button"
                      className="plan-v3-icon-btn"
                      title={`View ${plan.name}`}
                      aria-label={`View ${plan.name}`}
                      onClick={() => setViewId(plan.id)}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                ))}

                {plans.length === 0 && (
                  <div className="plan-v3-overview-empty">
                    No plans configured. Create a plan to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="plan-v3-overview-grid">
              <div className="plan-v3-overview-card">
                <div className="plan-v3-card-heading">
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Frequently used plan operations</p>
                  </div>
                  <SlidersHorizontal size={19} />
                </div>

                <div className="plan-v3-quick-actions">
                  <button type="button" onClick={addPlan}>
                    <span><Plus size={19} /></span>
                    <div>
                      <strong>Create New Plan</strong>
                      <small>Add a subscription plan</small>
                    </div>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("plans")}
                  >
                    <span><List size={19} /></span>
                    <div>
                      <strong>Manage Plans</strong>
                      <small>Edit pricing and plan status</small>
                    </div>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("features")}
                  >
                    <span><ShieldCheck size={19} /></span>
                    <div>
                      <strong>Configure Features</strong>
                      <small>Review limits and entitlements</small>
                    </div>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCompareOpen(true);
                    }}
                  >
                    <span><GitCompareArrows size={19} /></span>
                    <div>
                      <strong>Compare Plans</strong>
                      <small>Compare up to three plans</small>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="plan-v3-overview-card">
                <div className="plan-v3-card-heading">
                  <div>
                    <h3>Recent Activity</h3>
                    <p>Latest plan configuration changes</p>
                  </div>

                  <button
                    type="button"
                    className="plan-v3-text-action"
                    onClick={() => navigate("history")}
                  >
                    View All
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="plan-v3-activity-list">
                  {recentHistory.map((item) => (
                    <div
                      className="plan-v3-activity-item"
                      key={item.id}
                    >
                      <span className="plan-v3-activity-icon">
                        <Activity size={16} />
                      </span>
                      <div>
                        <strong>{item.action}</strong>
                        <p>{item.planName} — {item.details}</p>
                        <small>
                          <Clock3 size={12} />
                          {formatActivityDate(item.timestamp)}
                          <span className="plan-v3-activity-performer">· {item.performedBy || "Super Admin"}</span>
                        </small>
                      </div>
                    </div>
                  ))}

                  {recentHistory.length === 0 && (
                    <div className="plan-v3-overview-empty">
                      <History size={27} />
                      <strong>No activity recorded yet</strong>
                      <p>
                        Creating, editing or changing a plan
                        will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </>
        )}

        {tab === "plans" && (
          <>
            <div className="plan-v3-kpi-grid sa-main-kpi-grid">
              <Kpi
                title="Total Plans"
                value={total}
                icon={Layers3}
                type="total"
                onClick={() => filterKpi("All")}
              />
              <Kpi
                title="Active Plans"
                value={active}
                icon={CheckCircle2}
                type="active"
                onClick={() => filterKpi("Active")}
              />
              <Kpi
                title="Inactive Plans"
                value={inactive}
                icon={Power}
                type="inactive"
                onClick={() => filterKpi("Inactive")}
              />
            </div>

            <section className="plan-v3-panel" id="plan-list-section">
              <div className="plan-v3-panel-head">
                <div>
                  <h2>Subscription Plans</h2>
                  <p>
                    Manage plan configurations and included modules.
                  </p>
                </div>

                <button
                  type="button"
                  className="plan-v3-secondary"
                  onClick={() => setCompareOpen(true)}
                >
                  <GitCompareArrows size={17} />
                  Compare Plans
                  {compareIds.length > 0
                    ? ` (${compareIds.length})`
                    : ""}
                </button>
              </div>

              <div className="plan-v3-toolbar">
                <div className="plan-v3-search">
                  <Search size={18} />
                  <input
                    placeholder="Search plans..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter status"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  aria-label="Filter tier"
                >
                  <option value="All">All Tiers</option>
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Custom">Custom</option>
                </select>

                <button
                  type="button"
                  className="plan-v3-secondary"
                  onClick={reset}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>

              <p className="plan-v3-count">
                Showing {filtered.length} of {plans.length} plans
              </p>

              <div className="plan-v3-table-scroll">
                <table className="plan-v3-table">
                  <thead>
                    <tr>
                      <th>Compare</th>
                      <th>Plan Name</th>
                      <th>Tier</th>
                      <th>Monthly / Employee</th>
                      <th>Annual / Employee</th>
                      <th>Features</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="plan-v3-check"
                            checked={compareIds.includes(plan.id)}
                            disabled={
                              compareIds.length >= 3 &&
                              !compareIds.includes(plan.id)
                            }
                            onChange={() => toggleCompare(plan.id)}
                            aria-label={`Compare ${plan.name}`}
                          />
                        </td>

                        <td className="plan-v3-name">
                          {plan.name}
                        </td>
                        <td>{plan.tier}</td>
                        <td className="plan-v3-price">
                          {currency(plan.price)}
                        </td>
                        <td className="plan-v3-price">
                          {currency(plan.annualPrice)}
                        </td>
                        <td>
                          <span className="plan-v3-feature-pill">
                            <Layers3 size={13} />
                            {(plan.features || []).length} modules · {(plan.customFeatures || []).filter((feature) => feature.enabled !== false).length} custom
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={plan.status} />
                        </td>
                        <td>
                          <div className="plan-v3-actions">
                            <IconButton
                              icon={Eye}
                              title={`View ${plan.name}`}
                              onClick={() => setViewId(plan.id)}
                            />
                            <IconButton
                              icon={Pencil}
                              title={`Edit ${plan.name}`}
                              onClick={() => editPlan(plan)}
                            />
                            <IconButton
                              icon={Power}
                              title={`${
                                plan.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"
                              } ${plan.name}`}
                              onClick={() => toggleStatus(plan)}
                            />
                            <IconButton
                              icon={Trash2}
                              title={`Delete ${plan.name}`}
                              onClick={() => removePlan(plan)}
                              danger
                            />
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="plan-v3-empty"
                        >
                          No matching plans found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === "features" && (
          <section className="plan-v3-panel">
            <div className="plan-v3-panel-head">
              <div>
                <h2>Features & Limits</h2>
                <p>
                  Review module entitlements and usage limits
                  for each subscription plan.
                </p>
              </div>
              <button
                type="button"
                className="plan-v3-secondary"
                onClick={() => setCompareOpen(true)}
              >
                <GitCompareArrows size={17} />
                Compare Plans
              </button>
            </div>

            <div className="plan-v3-feature-plan-grid">
              {plans.map((plan) => (
                <div
                  className="plan-v3-feature-plan-card"
                  key={plan.id}
                >
                  <div className="plan-v3-feature-plan-head">
                    <div>
                      <span>{plan.tier} Tier</span>
                      <h3>{plan.name}</h3>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>

                  <div className="plan-v3-feature-plan-price">
                    <span>{currency(plan.price)}<small> per employee / month</small></span>
                    <span>{currency(plan.annualPrice)}<small> per employee / year</small></span>
                  </div>

                  <div className="plan-v3-feature-limits">
                    <div>
                      <ShieldCheck size={15} />
                      Users
                      <strong>{formatted(plan.users)}</strong>
                    </div>
                    <div>
                      <Building2 size={15} />
                      Branches
                      <strong>{formatted(plan.branches)}</strong>
                    </div>
                    <div>
                      <HardDrive size={15} />
                      Storage
                      <strong>{formatted(plan.storage)} GB</strong>
                    </div>
                  </div>

                  <div className="plan-v3-feature-plan-title">
                    Included Modules
                    <span>
                      {(plan.features || []).length}/{totalModules}
                    </span>
                  </div>

                  <div className="plan-v3-feature-module-list">
                    {PLAN_MODULES.map((module) => {
                      const enabled = (plan.features || [])
                        .includes(module);

                      return (
                        <div
                          key={module}
                          className={enabled ? "enabled" : "disabled"}
                        >
                          {enabled
                            ? <Check size={14} />
                            : <X size={14} />}
                          <span>{module}</span>
                        </div>
                      );
                    })}
                  </div>

                  {(plan.customFeatures || []).length > 0 && (
                    <>
                      <div className="plan-v3-feature-plan-title">
                        Custom Features
                        <span>{(plan.customFeatures || []).filter((feature) => feature.enabled !== false).length}</span>
                      </div>
                      <div className="plan-v3-custom-feature-list">
                        {(plan.customFeatures || []).map((feature) => (
                          <div key={feature.id} className={feature.enabled !== false ? "enabled" : "disabled"}>
                            {feature.enabled !== false ? <Check size={14} /> : <X size={14} />}
                            <span><strong>{feature.name}</strong><small>{feature.description}</small></span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    className="plan-v3-secondary plan-v3-feature-edit"
                    onClick={() => openFeatureEditor(plan)}
                  >
                    <Pencil size={15} />
                    Edit Features & Limits
                  </button>
                </div>
              ))}

              {plans.length === 0 && (
                <p className="plan-v3-help">
                  No plans available. Create a plan first.
                </p>
              )}
            </div>
          </section>
        )}

        {tab === "history" && (
          <section className="plan-v3-panel">
            <div className="plan-v3-panel-head">
              <div>
                <h2>Activity History</h2>
                <p>
                  Review locally recorded subscription
                  plan changes.
                </p>
              </div>

              <span className="plan-v3-history-count">
                <History size={15} />
                {filteredHistory.length} of {history.length} activities
              </span>
            </div>

            <div className="plan-v3-history-filters">
              <div className="plan-v3-search">
                <Search size={18} />
                <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search plan or activity..." aria-label="Search activity history" />
              </div>
              <select value={historyPlanFilter} onChange={(e) => setHistoryPlanFilter(e.target.value)} aria-label="Filter activity by plan">
                <option value="All">All Plans</option>
                {[...new Set([...plans.map((plan) => plan.name), ...history.map((item) => item.planName)])].map((name) => <option key={name}>{name}</option>)}
              </select>
              <select value={historyTypeFilter} onChange={(e) => setHistoryTypeFilter(e.target.value)} aria-label="Filter activity type">
                <option value="All">All Activity Types</option>
                {historyActivityTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <label className="plan-v3-date-filter">From <input type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} /></label>
              <label className="plan-v3-date-filter">To <input type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} /></label>
              <button type="button" className="plan-v3-secondary" onClick={() => { setHistorySearch(""); setHistoryPlanFilter("All"); setHistoryTypeFilter("All"); setHistoryFrom(""); setHistoryTo(""); }}><RotateCcw size={15} /> Clear Filters</button>
            </div>

            <div className="plan-v3-table-scroll">
              <table className="plan-v3-table plan-v3-history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Activity</th>
                    <th>Plan</th>
                    <th>Description</th>
                    <th>Performed By</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="plan-v3-history-date">
                          <CalendarDays size={15} />
                          {formatActivityDate(item.timestamp)}
                        </span>
                      </td>
                      <td>
                        <span className="plan-v3-history-action">
                          {item.action}
                        </span>
                      </td>
                      <td className="plan-v3-name">
                        {item.planName}
                      </td>
                      <td>{item.details}</td>
                      <td>{item.performedBy || "Super Admin"}</td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="plan-v3-empty"
                      >
                        No plan activities recorded yet.
                        Changes made from this page will
                        appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      {showForm && (
        <Modal
          title={
            editing !== null
              ? "Edit Plan"
              : "Create New Plan"
          }
          subtitle="Configure subscription pricing, limits and entitlements."
          onClose={closeForm}
        >
          <form onSubmit={submit} className="plan-v3-form">
            <h3>Basic Plan Details</h3>

            <div className="plan-v3-form-grid">
              <label>
                Plan Name *
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(e) =>
                    change("name", e.target.value)
                  }
                  placeholder="Enter plan name"
                />
              </label>

              <label>
                Plan Tier *
                <select
                  value={form.tier}
                  onChange={(e) =>
                    change("tier", e.target.value)
                  }
                >
                  <option>Starter</option>
                  <option>Professional</option>
                  <option>Enterprise</option>
                  <option>Custom</option>
                </select>
              </label>

              <label>
                Monthly price per employee (₹) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    change("price", e.target.value)
                  }
                />
              </label>

              <label>
                Annual price per employee (₹) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.annualPrice}
                  onChange={(e) =>
                    change("annualPrice", e.target.value)
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    change("status", e.target.value)
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>

              <label className="plan-v3-full">
                Description
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) =>
                    change("description", e.target.value)
                  }
                  placeholder="Describe this plan"
                />
              </label>
            </div>

            <h3>Usage Limits</h3>

            <div className="plan-v3-form-grid">
              {[
                ["users", "User Account Limit"],
                ["branches", "Branch Limit"],
                ["storage", "Storage Limit (GB)"]
              ].map(([key, label]) => (
                <label key={key}>
                  {label} *
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form[key]}
                    onChange={(e) =>
                      change(key, e.target.value)
                    }
                  />
                </label>
              ))}
            </div>

            <h3>Features & Entitlements</h3>

            <p className="plan-v3-help">
              Select the modules available with this
              subscription plan.
            </p>

            <div className="plan-v3-feature-grid">
              {PLAN_MODULES.map((module) => (
                <label
                  key={module}
                  className="plan-v3-feature-choice"
                >
                  <input
                    type="checkbox"
                    checked={form.features.includes(module)}
                    onChange={() => toggleFeature(module)}
                  />
                  <span>{module}</span>
                </label>
              ))}
            </div>

            <div className="plan-v3-custom-feature-section">
              <div className="plan-v3-custom-feature-heading">
                <div>
                  <h4>Custom Features</h4>
                  <p>Add plan-specific entitlements that are not part of the standard HRMS modules.</p>
                </div>
                <span>{(form.customFeatures || []).length} saved in this draft</span>
              </div>

              <div className="plan-v3-custom-feature-editor">
                <input
                  value={customFeatureDraft.name}
                  onChange={(e) => setCustomFeatureDraft((previous) => ({ ...previous, name: e.target.value }))}
                  placeholder="Custom feature name"
                  aria-label="Custom feature name"
                />
                <input
                  value={customFeatureDraft.description}
                  onChange={(e) => setCustomFeatureDraft((previous) => ({ ...previous, description: e.target.value }))}
                  placeholder="Short description"
                  aria-label="Custom feature description"
                />
                <button type="button" className="plan-v3-secondary" onClick={saveCustomFeatureDraft}>
                  {editingCustomFeatureId ? "Save Feature" : <><Plus size={15} /> Add Custom Feature</>}
                </button>
              </div>

              {(form.customFeatures || []).length > 0 && (
                <div className="plan-v3-custom-feature-draft-list">
                  {(form.customFeatures || []).map((feature) => (
                    <div className="plan-v3-custom-feature-draft" key={feature.id}>
                      <label>
                        <input type="checkbox" checked={feature.enabled !== false} onChange={() => toggleCustomFeature(feature.id)} />
                        <span><strong>{feature.name}</strong><small>{feature.description || "No description provided."}</small></span>
                      </label>
                      <div>
                        <button type="button" className="plan-v3-inline-action" onClick={() => editCustomFeature(feature)}>Edit</button>
                        <button type="button" className="plan-v3-inline-action is-danger" onClick={() => removeCustomFeature(feature.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="plan-v3-error">{error}</p>
            )}

            <div className="plan-v3-modal-actions">
              <button
                type="button"
                className="plan-v3-secondary"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="plan-v3-primary"
              >
                <Check size={17} />
                {editing !== null
                  ? "Update Plan"
                  : "Save Plan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedPlan && (
        <Modal
          title={selectedPlan.name}
          subtitle={
            selectedPlan.description ||
            "Subscription plan details"
          }
          onClose={() => setViewId(null)}
        >
          <div className="plan-v3-summary">
            <div>
              <span>Tier</span>
              <strong>{selectedPlan.tier}</strong>
            </div>
            <div>
              <span>Monthly / employee</span>
              <strong>{currency(selectedPlan.price)}</strong>
            </div>
            <div>
              <span>Annual / employee</span>
              <strong>{currency(selectedPlan.annualPrice)}</strong>
            </div>
            <div>
              <span>Status</span>
              <StatusBadge status={selectedPlan.status} />
            </div>
          </div>

          <h3 className="plan-v3-section-title">
            Plan Limits
          </h3>

          <div className="plan-v3-detail-grid">
            <Detail
              icon={ShieldCheck}
              label="Users"
              value={formatted(selectedPlan.users)}
            />
            <Detail
              icon={Building2}
              label="Branches"
              value={formatted(selectedPlan.branches)}
            />
            <Detail
              icon={HardDrive}
              label="Storage"
              value={`${formatted(selectedPlan.storage)} GB`}
            />
          </div>

          <h3 className="plan-v3-section-title">
            Features & Entitlements
          </h3>

          <div className="plan-v3-feature-grid">
            {PLAN_MODULES.map((module) => {
              const enabled = (
                selectedPlan.features || []
              ).includes(module);

              return (
                <div
                  key={module}
                  className={`plan-v3-entitlement ${
                    enabled ? "enabled" : "disabled"
                  }`}
                >
                  {enabled
                    ? <Check size={16} />
                    : <X size={16} />}
                  {module}
                </div>
              );
            })}
          </div>

          {(selectedPlan.customFeatures || []).length > 0 && (
            <>
              <h3 className="plan-v3-section-title">Custom Features</h3>
              <div className="plan-v3-custom-feature-detail-list">
                {(selectedPlan.customFeatures || []).map((feature) => (
                  <div key={feature.id} className={`plan-v3-entitlement ${feature.enabled !== false ? "enabled" : "disabled"}`}>
                    {feature.enabled !== false ? <Check size={16} /> : <X size={16} />}
                    <span><strong>{feature.name}</strong><small>{feature.description || "No description provided."}</small></span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="plan-v3-modal-actions">
            <button
              type="button"
              className="plan-v3-secondary"
              onClick={() => setViewId(null)}
            >
              Close
            </button>

            <button
              type="button"
              className="plan-v3-primary"
              onClick={() => editPlan(selectedPlan)}
            >
              <Pencil size={16} />
              Edit Plan
            </button>
          </div>
        </Modal>
      )}

      {compareOpen && (
        <Modal
          title="Compare Subscription Plans"
          subtitle="Select up to three plans to compare."
          onClose={() => setCompareOpen(false)}
          wide
        >
          <div className="plan-v3-compare-picker">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className="plan-v3-feature-choice"
              >
                <input
                  type="checkbox"
                  checked={compareIds.includes(plan.id)}
                  disabled={
                    compareIds.length >= 3 &&
                    !compareIds.includes(plan.id)
                  }
                  onChange={() => toggleCompare(plan.id)}
                />
                {plan.name}
              </label>
            ))}
          </div>

          {compared.length === 0 ? (
            <p className="plan-v3-help">
              Select plans to display their comparison.
            </p>
          ) : (
            <div className="plan-v3-table-scroll">
              <table className="plan-v3-table plan-v3-compare-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    {compared.map((p) => (
                      <th key={p.id}>{p.name}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {[
                    ["Tier", (p) => p.tier],
                    ["Monthly / employee", (p) => currency(p.price)],
                    ["Annual / employee", (p) => currency(p.annualPrice)],
                    ["Users", (p) => formatted(p.users)],
                    ["Branches", (p) => formatted(p.branches)],
                    [
                      "Storage",
                      (p) => `${formatted(p.storage)} GB`
                    ],
                    ["Status", (p) => p.status],
                    ...PLAN_MODULES.map((m) => [
                      m,
                      (p) =>
                        (p.features || []).includes(m)
                          ? "Included"
                          : "Not Included"
                    ]),
                    ["Custom Features", (p) => (p.customFeatures || []).filter((feature) => feature.enabled !== false).map((feature) => feature.name).join(", ") || "None"]
                  ].map(([label, getValue]) => (
                    <tr key={label}>
                      <td className="plan-v3-name">
                        {label}
                      </td>
                      {compared.map((p) => (
                        <td key={p.id}>
                          {getValue(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="plan-v3-modal-actions">
            <button
              type="button"
              className="plan-v3-secondary"
              onClick={() => setCompareIds([])}
            >
              Clear Selection
            </button>

            <button
              type="button"
              className="plan-v3-primary"
              onClick={() => setCompareOpen(false)}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
