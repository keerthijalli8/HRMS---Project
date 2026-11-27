import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PLAN_CATALOG_UPDATED_EVENT,
  PLAN_STORAGE_KEY,
  readPlanRecords,
} from "../../utils/planCatalog";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Eye,
  Pencil,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  X,
  History,
  Ban,
  Check,
  CalendarDays,
  Download,
  Users,
  Layers3,
  Building2,
} from "lucide-react";
import { notifySaveSuccess } from "../../utils/saveNavigation";
import "./SubscriptionDetails.css";

const EXPIRING_DAYS = 7;

const getAmount = (planName, billing, employeeCount, availablePlans) => {
  const plan = availablePlans.find((item) => item.name === planName);
  if (!plan) return 0;

  const rate = billing === "Annual" ? plan.annualPrice : plan.price;

  return rate * Math.max(0, Number(employeeCount) || 0);
};

const initialSubscriptions = [
  {
    id: "SUB-001",
    organization: "Acme Technologies",
    orgId: "ORG-001",
    plan: "Enterprise",
    billing: "Annual",
    employeeCount: 245,
    startDate: "2026-01-01",
    renewalDate: "2026-12-01",
    status: "Active",
    payment: "Paid",
    history: [
      {
        date: "2026-01-01",
        action: "Subscription created",
        details: "Enterprise Annual plan activated",
      },
      {
        date: "2026-06-01",
        action: "Payment received",
        details: "Annual subscription payment completed",
      },
    ],
  },
  {
    id: "SUB-002",
    organization: "Bluewave Solutions",
    orgId: "ORG-002",
    plan: "Professional",
    billing: "Annual",
    employeeCount: 120,
    startDate: "2026-02-15",
    renewalDate: "2026-11-25",
    status: "Active",
    payment: "Paid",
    history: [
      {
        date: "2026-02-15",
        action: "Subscription created",
        details: "Professional Annual plan activated",
      },
      {
        date: "2026-08-15",
        action: "Payment received",
        details: "Subscription payment completed",
      },
    ],
  },
  {
    id: "SUB-003",
    organization: "Nova Systems",
    orgId: "ORG-003",
    plan: "Starter",
    billing: "Monthly",
    employeeCount: 45,
    startDate: "2026-10-01",
    renewalDate: "2026-11-28",
    status: "Active",
    payment: "Paid",
    history: [
      {
        date: "2026-10-01",
        action: "Subscription created",
        details: "Starter Monthly plan activated",
      },
      {
        date: "2026-10-28",
        action: "Payment received",
        details: "Monthly subscription payment completed",
      },
    ],
  },
  {
    id: "SUB-004",
    organization: "Vertex Digital",
    orgId: "ORG-004",
    plan: "Enterprise",
    billing: "Annual",
    employeeCount: 310,
    startDate: "2026-01-10",
    renewalDate: "2026-11-30",
    status: "Active",
    payment: "Pending",
    history: [
      {
        date: "2026-01-10",
        action: "Subscription created",
        details: "Enterprise Annual plan activated",
      },
      {
        date: "2026-11-20",
        action: "Payment reminder sent",
        details: "Renewal payment is pending",
      },
    ],
  },
  {
    id: "SUB-005",
    organization: "Cloudbridge Pvt Ltd",
    orgId: "ORG-005",
    plan: "Professional",
    billing: "Monthly",
    employeeCount: 85,
    startDate: "2026-11-01",
    renewalDate: "2026-12-05",
    status: "Trial",
    payment: "Pending",
    history: [
      {
        date: "2026-11-01",
        action: "Trial started",
        details: "Professional plan trial activated",
      },
    ],
  },
  {
    id: "SUB-006",
    organization: "Summit Enterprises",
    orgId: "ORG-006",
    plan: "Starter",
    billing: "Monthly",
    employeeCount: 60,
    startDate: "2026-09-01",
    renewalDate: "2026-11-19",
    status: "Expired",
    payment: "Overdue",
    history: [
      {
        date: "2026-09-01",
        action: "Subscription created",
        details: "Starter Monthly plan activated",
      },
      {
        date: "2026-11-19",
        action: "Subscription expired",
        details: "Subscription expired due to non-renewal",
      },
    ],
  },
  {
    id: "SUB-007",
    organization: "Pioneer Retail",
    orgId: "ORG-007",
    plan: "Professional",
    billing: "Annual",
    employeeCount: 90,
    startDate: "2025-10-20",
    renewalDate: "2026-10-20",
    status: "Cancelled",
    payment: "Paid",
    cancellationDate: "2026-10-20",
    cancellationReason: "Organization requested cancellation",
    history: [
      {
        date: "2025-10-20",
        action: "Subscription created",
        details: "Professional Annual plan activated",
      },
      {
        date: "2026-10-20",
        action: "Subscription cancelled",
        details: "Organization requested cancellation",
      },
    ],
  },
  {
    id: "SUB-008",
    organization: "Aster Healthcare",
    orgId: "ORG-008",
    plan: "Starter",
    billing: "Annual",
    employeeCount: 40,
    startDate: "2025-11-10",
    renewalDate: "2026-11-10",
    status: "Cancelled",
    payment: "Paid",
    cancellationDate: "2026-11-10",
    cancellationReason: "Plan no longer required",
    history: [
      {
        date: "2025-11-10",
        action: "Subscription created",
        details: "Starter Annual plan activated",
      },
      {
        date: "2026-11-10",
        action: "Subscription cancelled",
        details: "Plan no longer required",
      },
    ],
  },
  {
    id: "SUB-009",
    organization: "Harbor Industries",
    orgId: "ORG-009",
    plan: "Enterprise",
    billing: "Annual",
    employeeCount: 175,
    startDate: "2026-03-01",
    renewalDate: "2027-03-01",
    status: "Suspended",
    payment: "Overdue",
    history: [
      {
        date: "2026-03-01",
        action: "Subscription created",
        details: "Enterprise Annual plan activated",
      },
      {
        date: "2026-11-18",
        action: "Subscription suspended",
        details: "Subscription suspended pending payment resolution",
      },
    ],
  },
];

const getToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const addOneMonth = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + 1);

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  date.setDate(Math.min(originalDay, lastDay));

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const addOneYear = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setFullYear(date.getFullYear() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

export default function SubscriptionDetails() {
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const requestedPlan = searchParams.get("plan");
  const requestedBilling = searchParams.get("billing");
  const requestedSearch = searchParams.get("search") || "";
  const requestedFocus = searchParams.get("focus");
  const [plans, setPlans] = useState(readPlanRecords);
  const initialStatus = ["active", "trial", "expired", "cancelled", "suspended"].includes(
    requestedStatus?.toLowerCase()
  )
    ? requestedStatus[0].toUpperCase() + requestedStatus.slice(1)
    : "All";
  const initialPlan = plans.some((plan) => plan.name === requestedPlan)
    ? requestedPlan
    : "All";
  const initialBilling = ["Monthly", "Annual"].find(
    (billing) => billing.toLowerCase() === requestedBilling?.toLowerCase()
  ) || "All";
  const [subscriptions, setSubscriptions] = useState(() =>
    initialSubscriptions.map((item) => ({
      ...item,
      amount: getAmount(item.plan, item.billing, item.employeeCount, plans),
    }))
  );

  const [search, setSearch] = useState(requestedSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [planFilter, setPlanFilter] = useState(initialPlan);
  const [billingFilter, setBillingFilter] = useState(initialBilling);
  const [activeTab, setActiveTab] = useState(requestedFocus === "expiring" ? "Expiring" : "Overview");

  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState("");
  const [form, setForm] = useState({});
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const refreshPlans = () => setPlans(readPlanRecords());
    const refreshStoredPlans = (event) => {
      if (event.key === PLAN_STORAGE_KEY) refreshPlans();
    };

    window.addEventListener(PLAN_CATALOG_UPDATED_EVENT, refreshPlans);
    window.addEventListener("storage", refreshStoredPlans);
    return () => {
      window.removeEventListener(PLAN_CATALOG_UPDATED_EVENT, refreshPlans);
      window.removeEventListener("storage", refreshStoredPlans);
    };
  }, []);

  useEffect(() => {
    setSubscriptions((previous) =>
      previous.map((item) => ({
        ...item,
        amount: getAmount(item.plan, item.billing, item.employeeCount, plans),
      }))
    );
  }, [plans]);

  useEffect(() => {
    const status = searchParams.get("status")?.toLowerCase();
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing");

    setStatusFilter(
      ["active", "trial", "expired", "cancelled", "suspended"].includes(status)
        ? status[0].toUpperCase() + status.slice(1)
        : "All"
    );
    setPlanFilter(plans.some((item) => item.name === plan) ? plan : "All");
    setBillingFilter(
      ["Monthly", "Annual"].find(
        (item) => item.toLowerCase() === billing?.toLowerCase()
      ) || "All"
    );
    setActiveTab(requestedFocus === "expiring" ? "Expiring" : "Overview");
    setSearch(searchParams.get("search") || "");
  }, [searchParams, requestedFocus, plans]);

  const today = getToday();
  const expiringLimit = addDays(today, EXPIRING_DAYS);

  const expiring = subscriptions.filter(
    (item) =>
      item.status === "Active" &&
      item.renewalDate >= today &&
      item.renewalDate <= expiringLimit
  );

  const activeSubscriptions = subscriptions.filter(
    (item) => item.status === "Active"
  );

  const pendingPayments = subscriptions.filter(
    (item) => item.payment === "Pending" || item.payment === "Overdue"
  );

  const cancelledSubscriptions = subscriptions.filter(
    (item) => item.status === "Cancelled"
  );

  const stats = [
    {
      label: "Total Subscriptions",
      value: subscriptions.length,
      icon: CreditCard,
      color: "purple",
      filter: "All",
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions.length,
      icon: CheckCircle2,
      color: "mint",
      filter: "Active",
    },
    {
      label: "Expiring Soon",
      value: expiring.length,
      icon: Clock,
      color: "orange",
      filter: "Expiring",
    },
    {
      label: "Pending Payments",
      value: pendingPayments.length,
      icon: AlertTriangle,
      color: "red",
      filter: "Pending",
    },
    {
      label: "Cancelled",
      value: cancelledSubscriptions.length,
      icon: XCircle,
      color: "red",
      filter: "Cancelled",
    },
  ];

  const pillItems = [
    {
      label: "Overview",
      value: "Overview",
      count: subscriptions.length,
      icon: Building2,
    },
    {
      label: "Monthly Billing",
      value: "Monthly Billing",
      count: subscriptions.filter((item) => item.billing === "Monthly").length,
      icon: CalendarDays,
    },
    {
      label: "Annual Billing",
      value: "Annual Billing",
      count: subscriptions.filter((item) => item.billing === "Annual").length,
      icon: CalendarDays,
    },
    {
      label: "Starter Plan",
      value: "Starter",
      count: subscriptions.filter((item) => item.plan === "Starter").length,
      icon: Layers3,
    },
    {
      label: "Professional Plan",
      value: "Professional",
      count: subscriptions.filter((item) => item.plan === "Professional").length,
      icon: Layers3,
    },
    {
      label: "Enterprise Plan",
      value: "Enterprise",
      count: subscriptions.filter((item) => item.plan === "Enterprise").length,
      icon: Layers3,
    },
    {
      label: "Subscription Plans",
      value: "Subscription Plans",
      count: plans.length,
      icon: CreditCard,
    },
  ];

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const query = search.toLowerCase().trim();

      const matchesSearch = [
        subscription.id,
        subscription.organization,
        subscription.orgId,
        subscription.plan,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === "All" || subscription.status === statusFilter;

      const matchesPlan =
        planFilter === "All" || subscription.plan === planFilter;
      const matchesBilling =
        billingFilter === "All" || subscription.billing === billingFilter;

      let matchesPill = true;

      switch (activeTab) {
        case "Monthly Billing":
          matchesPill = subscription.billing === "Monthly";
          break;
        case "Annual Billing":
          matchesPill = subscription.billing === "Annual";
          break;
        case "Starter":
        case "Professional":
        case "Enterprise":
          matchesPill = subscription.plan === activeTab;
          break;
        case "Overview":
        case "Subscription Plans":
        default:
          matchesPill = true;
      }

      let matchesKpi = true;

      switch (activeTab) {
        case "Active":
          matchesKpi = subscription.status === "Active";
          break;
        case "Expiring":
          matchesKpi =
            subscription.status === "Active" &&
            subscription.renewalDate >= today &&
            subscription.renewalDate <= expiringLimit;
          break;
        case "Pending":
          matchesKpi =
            subscription.payment === "Pending" ||
            subscription.payment === "Overdue";
          break;
        case "Cancelled":
          matchesKpi = subscription.status === "Cancelled";
          break;
        default:
          matchesKpi = true;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan &&
        matchesBilling &&
        matchesPill &&
        matchesKpi
      );
    });
  }, [
    subscriptions,
    search,
    statusFilter,
    planFilter,
    billingFilter,
    activeTab,
    today,
    expiringLimit,
  ]);

  const showPlanCatalogue =
    activeTab === "Overview" || activeTab === "Subscription Plans";
  const availablePlans = ["Starter", "Professional", "Enterprise"]
    .map((tier) => plans.find((plan) => plan.tier === tier))
    .filter(Boolean);

  const openSubscriptionForm = (plan) => {
    const url = new URL("/super-admin/subscribe", window.location.origin);
    url.searchParams.set("plan", plan.name);

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const selectPill = (value) => {
    setActiveTab(value);
    setStatusFilter("All");
    setPlanFilter("All");
    setBillingFilter("All");
    setSearch("");
  };

  const selectKpi = (filter) => {
    setActiveTab(filter);
    setStatusFilter("All");
    setPlanFilter("All");
    setBillingFilter("All");
    setSearch("");
  };

  const resetFilters = () => {
    setActiveTab("Overview");
    setStatusFilter("All");
    setPlanFilter("All");
    setBillingFilter("All");
    setSearch("");
  };

  const openEdit = (subscription) => {
    setSelected(subscription);
    setForm({
      plan: subscription.plan,
      billing: subscription.billing,
      employeeCount: subscription.employeeCount,
      renewalDate: subscription.renewalDate,
      payment: subscription.payment,
    });
    setModal("edit");
  };

  const openPlanChange = (subscription) => {
    setSelected(subscription);
    setForm({
      plan: subscription.plan,
      billing: subscription.billing,
      employeeCount: subscription.employeeCount,
    });
    setModal("change");
  };

  const updateForm = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const formAmount = getAmount(
    form.plan,
    form.billing,
    form.employeeCount,
    plans
  );

  const saveEdit = (event) => {
    event.preventDefault();

    const updated = {
      ...selected,
      ...form,
      employeeCount: Number(form.employeeCount),
      amount: getAmount(form.plan, form.billing, form.employeeCount, plans),
      history: [
        ...(selected.history || []),
        {
          date: today,
          action: "Subscription details updated",
          details: `Plan: ${form.plan}, Billing: ${form.billing}, Employees: ${form.employeeCount}`,
        },
      ],
    };

    setSubscriptions((previous) =>
      previous.map((item) => (item.id === selected.id ? updated : item))
    );
    setSelected(updated);
    setModal("details");
    notifySaveSuccess("Subscription details updated successfully.");
  };

  const savePlanChange = (event) => {
    event.preventDefault();

    const oldPlanIndex = plans.findIndex(
      (plan) => plan.name === selected.plan
    );
    const newPlanIndex = plans.findIndex(
      (plan) => plan.name === form.plan
    );

    let action = "Plan updated";
    if (newPlanIndex > oldPlanIndex) action = "Plan upgraded";
    if (newPlanIndex < oldPlanIndex) action = "Plan downgraded";

    const updated = {
      ...selected,
      plan: form.plan,
      billing: form.billing,
      employeeCount: Number(form.employeeCount),
      amount: getAmount(form.plan, form.billing, form.employeeCount, plans),
      history: [
        ...(selected.history || []),
        {
          date: today,
          action,
          details: `${selected.plan} → ${form.plan}; employee count: ${form.employeeCount}`,
        },
      ],
    };

    setSubscriptions((previous) =>
      previous.map((item) => (item.id === selected.id ? updated : item))
    );
    setSelected(updated);
    setModal("details");
    notifySaveSuccess(`Subscription ${action.toLowerCase()} successfully.`);
  };

  const renewSubscription = (subscription) => {
    const baseDate =
      subscription.renewalDate < today
        ? today
        : subscription.renewalDate;

    const nextRenewal =
      subscription.billing === "Annual"
        ? addOneYear(baseDate)
        : addOneMonth(baseDate);

    const updated = {
      ...subscription,
      renewalDate: nextRenewal,
      status: "Active",
      payment: "Paid",
      amount: getAmount(
        subscription.plan,
        subscription.billing,
        subscription.employeeCount,
        plans
      ),
      history: [
        ...(subscription.history || []),
        {
          date: today,
          action: "Subscription renewed",
          details: `Renewed until ${formatDate(nextRenewal)}`,
        },
      ],
    };

    setSubscriptions((previous) =>
      previous.map((item) => (item.id === subscription.id ? updated : item))
    );
    setSelected(updated);
    setModal("details");
  };

  const cancelSubscription = (event) => {
    event.preventDefault();
    if (!cancelReason.trim()) return;

    const updated = {
      ...selected,
      status: "Cancelled",
      cancellationDate: today,
      cancellationReason: cancelReason.trim(),
      history: [
        ...(selected.history || []),
        {
          date: today,
          action: "Subscription cancelled",
          details: cancelReason.trim(),
        },
      ],
    };

    setSubscriptions((previous) =>
      previous.map((item) => (item.id === selected.id ? updated : item))
    );
    setSelected(updated);
    setCancelReason("");
    setModal("details");
  };

  const closeModal = () => {
    setModal("");
    setSelected(null);
    setForm({});
    setCancelReason("");
  };

  const getStatusClass = (status) =>
    status.toLowerCase().replace(/\s+/g, "-");

  const downloadCsv = () => {
    const headers = [
      "Subscription ID",
      "Organization",
      "Plan",
      "Billing Cycle",
      "Amount",
      "Start Date",
      "Renewal Date",
      "Payment Status",
      "Subscription Status",
    ];

    const rows = filteredSubscriptions.map((item) => [
      item.id,
      item.organization,
      item.plan,
      item.billing,
      item.amount,
      item.startDate,
      item.renewalDate,
      item.payment,
      item.status,
    ]);

    const csvContent = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscription-register.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="subscription-page">
      <div className="subscription-page-heading">
        <div>
          <span className="subscription-eyebrow">
            SUPER ADMIN / SUBSCRIPTIONS
          </span>
          <h1>Subscription Management</h1>
          <p>
            Manage plans, renewals, upgrades, downgrades and cancellations.
          </p>
        </div>
      </div>

      {/* Small pill KPI navigation */}
      <div className="subscription-pill-nav">
        {pillItems.map((pill) => {
          const Icon = pill.icon;

          return (
            <button
              type="button"
              key={pill.value}
              className={`subscription-pill sa-pill-kpi ${
                activeTab === pill.value ? "active" : ""
              }`}
              onClick={() => selectPill(pill.value)}
            >
              <Icon size={15} />
              {pill.label}
              <small>{pill.count}</small>
            </button>
          );
        })}
      </div>

      {/* Main KPI cards */}
      <div className="subscription-stats-grid sa-main-kpi-grid">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.label}
              className={`subscription-stat-card sa-main-kpi-card ${
                activeTab === item.filter ? "selected" : ""
              }`}
              onClick={() => selectKpi(item.filter)}
            >
              <div className={`subscription-stat-icon ${item.color}`}>
                <Icon size={21} />
              </div>
              <div>
                <span>{item.label}</span>
                <h2>{item.value}</h2>
              </div>
            </button>
          );
        })}
      </div>

      {/* Subscription register */}
      {activeTab !== "Subscription Plans" && (
      <section className="subscription-section">
        <div className="subscription-section-heading">
          <div>
            <h2>Subscription Register</h2>
            <p>View and manage organization subscription records.</p>
          </div>

          <span className="subscription-record-count">
            {filteredSubscriptions.length} Records
          </span>
        </div>

        <div className="subscription-toolbar">
          <div className="subscription-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search organization, subscription ID or plan..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="subscription-select">
            <Filter size={16} />
            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
            >
              <option value="All">All Plans</option>
              {plans.map((plan) => (
                <option key={plan.name} value={plan.name}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="subscription-select">
            <select
              aria-label="Filter by billing type"
              value={billingFilter}
              onChange={(event) => setBillingFilter(event.target.value)}
            >
              <option value="All">All Billing</option>
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>

          <div className="subscription-select">
            <select
              aria-label="Filter by subscription status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <button
            type="button"
            className="subscription-csv-btn"
            onClick={resetFilters}
          >
            <X size={15} />
            Reset
          </button>

          <button
            type="button"
            className="subscription-csv-btn"
            onClick={downloadCsv}
            disabled={filteredSubscriptions.length === 0}
          >
            <Download size={16} />
            Download CSV
          </button>
        </div>

        {(search || statusFilter !== "All" || planFilter !== "All" ||
          billingFilter !== "All" || activeTab !== "Overview") && (
          <p className="subscription-active-filters" aria-live="polite">
            Active filters: {[
              search && `Search: ${search}`,
              statusFilter !== "All" && `Status: ${statusFilter}`,
              planFilter !== "All" && `Plan: ${planFilter}`,
              billingFilter !== "All" && `Billing: ${billingFilter}`,
              activeTab !== "Overview" && activeTab,
            ].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="subscription-table-wrap">
          <table className="subscription-table">
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Organization</th>
                <th>Employees</th>
                <th>Current Plan</th>
                <th>Billing</th>
                <th>Amount</th>
                <th>Renewal Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <strong>{subscription.id}</strong>
                    <small>{subscription.orgId}</small>
                  </td>

                  <td className="subscription-org-name">
                    {subscription.organization}
                  </td>

                  <td>{subscription.employeeCount.toLocaleString("en-IN")}</td>

                  <td>
                    <span
                      className={`subscription-plan-tag ${subscription.plan.toLowerCase()}`}
                    >
                      {subscription.plan}
                    </span>
                  </td>

                  <td>{subscription.billing}</td>
                  <td>{formatCurrency(subscription.amount)}</td>
                  <td>{formatDate(subscription.renewalDate)}</td>

                  <td>
                    <span
                      className={`subscription-status ${getStatusClass(
                        subscription.payment
                      )}`}
                    >
                      <span className="subscription-status-dot" />
                      {subscription.payment}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`subscription-status ${getStatusClass(
                        subscription.status
                      )}`}
                    >
                      <span className="subscription-status-dot" />
                      {subscription.status}
                    </span>
                  </td>

                  <td>
                    <div className="subscription-actions">
                      <button
                        type="button"
                        title="View details"
                        onClick={() => {
                          setSelected(subscription);
                          setModal("details");
                        }}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        title="Edit subscription"
                        onClick={() => openEdit(subscription)}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan="10" className="subscription-empty">
                    No subscriptions match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* Available plan summary */}
      {showPlanCatalogue && (
        <section className="subscription-section subscription-plan-section">
          <div className="subscription-section-heading">
            <div>
              <h2>Available Subscription Plans</h2>
              <p>
                Per-employee pricing. Total cost depends on the organization's
                employee count.
              </p>
            </div>
          </div>

          <div className="subscription-plan-grid">
            {availablePlans.map((plan) => (
              <article
                className="subscription-plan-card"
                key={plan.name}
                onClick={() => openSubscriptionForm(plan)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSubscriptionForm(plan);
                  }
                }}
              >
                <div className="subscription-plan-card-heading">
                  <span>{plan.name}</span>
                  <span>Per employee</span>
                </div>

                <h3>
                  {formatCurrency(plan.price)}
                  <small> / employee / month</small>
                </h3>

                <p className="subscription-annual-price">
                  {formatCurrency(plan.annualPrice)} / employee / year
                </p>

                <div className="subscription-features">
                  {plan.features.map((feature) => (
                    <div key={feature}>
                      <Check size={15} />
                      {feature}
                    </div>
                  ))}
                  {(plan.customFeatures || []).filter((feature) => feature.enabled !== false).map((feature) => (
                    <div key={feature.id} className="subscription-custom-feature">
                      <Check size={15} />
                      <span>{feature.name}<small>{feature.description}</small></span>
                    </div>
                  ))}
                </div>

                <span className="subscription-plan-assigned">
                  {
                    subscriptions.filter(
                      (item) => item.plan === plan.name
                    ).length
                  }{" "}
                  organizations assigned
                </span>

                <span className="subscription-plan-cta">
                  Select plan <ArrowUpRight size={14} />
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Subscription details modal */}
      {selected && modal === "details" && (
        <div className="subscription-overlay" onClick={closeModal}>
          <div
            className="subscription-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="subscription-modal-header">
              <div>
                <span>SUBSCRIPTION PROFILE</span>
                <h2>{selected.organization}</h2>
                <p>{selected.id} · {selected.orgId}</p>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="subscription-detail-grid">
              <div><span>Current Plan</span><strong>{selected.plan}</strong></div>
              <div><span>Billing Cycle</span><strong>{selected.billing}</strong></div>
              <div><span>Number of Employees</span><strong>{selected.employeeCount}</strong></div>
              <div><span>Per Employee Rate</span><strong>{formatCurrency(plans.find((plan) => plan.name === selected.plan)?.[selected.billing === "Annual" ? "annualPrice" : "price"] || 0)}</strong></div>
              <div><span>Subscription Amount</span><strong>{formatCurrency(selected.amount)}</strong></div>
              <div><span>Subscription Status</span><strong>{selected.status}</strong></div>
              <div><span>Start Date</span><strong>{formatDate(selected.startDate)}</strong></div>
              <div><span>Renewal Date</span><strong>{formatDate(selected.renewalDate)}</strong></div>
              <div><span>Payment Status</span><strong>{selected.payment}</strong></div>
              {selected.cancellationDate && (
                <div><span>Cancellation Date</span><strong>{formatDate(selected.cancellationDate)}</strong></div>
              )}
              {selected.cancellationReason && (
                <div className="subscription-detail-full">
                  <span>Cancellation Reason</span>
                  <strong>{selected.cancellationReason}</strong>
                </div>
              )}
            </div>

            <div className="subscription-history">
              <h3><History size={16} /> Subscription History</h3>
              {selected.history?.length ? (
                selected.history.map((item, index) => (
                  <div
                    className="subscription-history-item"
                    key={`${item.date}-${index}`}
                  >
                    <span>{formatDate(item.date)}</span>
                    <strong>{item.action}</strong>
                    <small>{item.details}</small>
                  </div>
                ))
              ) : (
                <p>No history available.</p>
              )}
            </div>

            <div className="subscription-modal-actions">
              {selected.status !== "Cancelled" && (
                <>
                  <button
                    type="button"
                    className="subscription-btn secondary"
                    onClick={() => openEdit(selected)}
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    className="subscription-btn secondary"
                    onClick={() => openPlanChange(selected)}
                  >
                    <ArrowUpRight size={15} /> Change Plan
                  </button>
                  <button
                    type="button"
                    className="subscription-btn secondary"
                    onClick={() => renewSubscription(selected)}
                  >
                    <RefreshCw size={15} /> Renew
                  </button>
                  <button
                    type="button"
                    className="subscription-btn danger"
                    onClick={() => setModal("cancel")}
                  >
                    <Ban size={15} /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit subscription modal */}
      {selected && modal === "edit" && (
        <div className="subscription-overlay" onClick={closeModal}>
          <div
            className="subscription-modal compact"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="subscription-modal-header">
              <div>
                <span>EDIT SUBSCRIPTION</span>
                <h2>{selected.organization}</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="subscription-form">
              <label>
                Subscription Plan
                <select
                  value={form.plan}
                  onChange={(event) => updateForm("plan", event.target.value)}
                >
                  {plans.map((plan) => (
                    <option key={plan.name} value={plan.name}>{plan.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Number of Employees
                <input
                  type="number"
                  min="1"
                  required
                  value={form.employeeCount}
                  onChange={(event) => updateForm("employeeCount", event.target.value)}
                />
              </label>

              <label>
                Billing Cycle
                <select
                  value={form.billing}
                  onChange={(event) => updateForm("billing", event.target.value)}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
              </label>

              <label>
                Renewal Date
                <input
                  type="date"
                  value={form.renewalDate}
                  onChange={(event) => updateForm("renewalDate", event.target.value)}
                />
              </label>

              <label>
                Payment Status
                <select
                  value={form.payment}
                  onChange={(event) => updateForm("payment", event.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </label>

              <div className="subscription-live-total">
                <span>Updated subscription amount</span>
                <strong>{formatCurrency(formAmount)}</strong>
              </div>

              <div className="subscription-modal-actions">
                <button type="button" className="subscription-btn secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="subscription-btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change plan modal */}
      {selected && modal === "change" && (
        <div className="subscription-overlay" onClick={closeModal}>
          <div
            className="subscription-modal compact"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="subscription-modal-header">
              <div>
                <span>PLAN CHANGE</span>
                <h2>{selected.organization}</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="subscription-comparison">
              <div>
                <span>Current Plan</span>
                <strong>{selected.plan}</strong>
              </div>
              {plans.findIndex((p) => p.name === form.plan) >=
              plans.findIndex((p) => p.name === selected.plan) ? (
                <ArrowUpRight size={20} />
              ) : (
                <ArrowDownRight size={20} />
              )}
              <div>
                <span>New Plan</span>
                <strong>{form.plan}</strong>
              </div>
            </div>

            <form onSubmit={savePlanChange} className="subscription-form">
              <label>
                Select New Plan
                <select
                  value={form.plan}
                  onChange={(event) => updateForm("plan", event.target.value)}
                >
                  {plans.map((plan) => (
                    <option key={plan.name} value={plan.name}>{plan.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Number of Employees
                <input
                  type="number"
                  min="1"
                  required
                  value={form.employeeCount}
                  onChange={(event) => updateForm("employeeCount", event.target.value)}
                />
              </label>

              <label>
                Billing Cycle
                <select
                  value={form.billing}
                  onChange={(event) => updateForm("billing", event.target.value)}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
              </label>

              <div className="subscription-live-total">
                <span>New subscription amount</span>
                <strong>{formatCurrency(formAmount)}</strong>
              </div>

              <p className="subscription-change-note">
                The selected plan, employee count and billing cycle determine
                the new subscription amount.
              </p>

              <div className="subscription-modal-actions">
                <button type="button" className="subscription-btn secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="subscription-btn primary">
                  Confirm Plan Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel subscription modal */}
      {selected && modal === "cancel" && (
        <div className="subscription-overlay" onClick={closeModal}>
          <div
            className="subscription-modal compact"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="subscription-modal-header">
              <div>
                <span>CANCEL SUBSCRIPTION</span>
                <h2>{selected.organization}</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={cancelSubscription} className="subscription-form">
              <p className="subscription-cancel-warning">
                Are you sure you want to cancel this subscription? The record
                will be marked as Cancelled.
              </p>

              <label>
                Cancellation Reason *
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Enter the reason for cancellation..."
                  required
                />
              </label>

              <div className="subscription-modal-actions">
                <button type="button" className="subscription-btn secondary" onClick={closeModal}>
                  Keep Subscription
                </button>
                <button type="submit" className="subscription-btn danger">
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
