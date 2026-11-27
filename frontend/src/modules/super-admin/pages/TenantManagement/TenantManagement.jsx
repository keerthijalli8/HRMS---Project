
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Building2,
  Users,
  CheckCircle2,
  Ban,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  PauseCircle,
  PlayCircle,
  X,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  Layers3,
  LayoutGrid,
  Clock3,
  ShieldCheck,
  CircleX,
  Copy,
  RefreshCw,
  Download,
  KeyRound,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import "./TenantManagement.css";
import { notifySaveSuccess } from "../../utils/saveNavigation";
import {
  addMonthsISO,
  createLicenseKey,
  getLicenseStatus,
  readLicenseRecords,
  readTenantRecords,
  saveLicenseRecords,
  saveTenantRecords,
  todayISO,
  validateLicenseKey,
} from "../../utils/licenseKeys";
import {
  getModulesForPlan,
} from "../../utils/companyPortal";

const initialTenants = [
  {
    id: "TEN-001",
    name: "Acme Technologies",
    contact: "Rahul Sharma",
    email: "rahul@acme.com",
    phone: "+91 9876543210",
    location: "Hyderabad",
    plan: "Enterprise",
    users: 245,
    status: "Active",
    date: "2026-10-12",
  },
  {
    id: "TEN-002",
    name: "Bluewave Solutions",
    contact: "Priya Reddy",
    email: "priya@bluewave.com",
    phone: "+91 9876543211",
    location: "Bangalore",
    plan: "Professional",
    users: 120,
    status: "Active",
    date: "2026-10-18",
  },
  {
    id: "TEN-003",
    name: "Nova Systems",
    contact: "Arjun Kumar",
    email: "arjun@nova.com",
    phone: "+91 9876543212",
    location: "Chennai",
    plan: "Starter",
    users: 45,
    status: "Suspended",
    date: "2026-10-25",
  },
  {
    id: "TEN-004",
    name: "Vertex Digital",
    contact: "Sneha Rao",
    email: "sneha@vertex.com",
    phone: "+91 9876543213",
    location: "Mumbai",
    plan: "Enterprise",
    users: 310,
    status: "Active",
    date: "2026-11-02",
  },
  {
    id: "TEN-005",
    name: "Cloudbridge Pvt Ltd",
    contact: "Kiran Patel",
    email: "kiran@cloudbridge.com",
    phone: "+91 9876543214",
    location: "Pune",
    plan: "Professional",
    users: 85,
    status: "Pending",
    date: "2026-11-10",
  },
  {
    id: "TEN-006",
    name: "Greenfield Technologies",
    contact: "Meera Nair",
    email: "meera@greenfield.com",
    phone: "+91 9876543215",
    location: "Hyderabad",
    plan: "Starter",
    users: 60,
    status: "Pending",
    date: "2026-11-18",
  },
  {
    id: "TEN-007",
    name: "Orbit Business Systems",
    contact: "Vikram Singh",
    email: "vikram@orbit.com",
    phone: "+91 9876543216",
    location: "Delhi",
    plan: "Enterprise",
    users: 190,
    status: "Rejected",
    date: "2026-11-05",
  },
];

const ACTIVATION_HISTORY_KEY = "superAdminTenantActivationActivity";
const LEGACY_ACTIVATION_HISTORY_KEY = "hrms.superadmin.activation.history.v1";

const initialActivationHistory = [
  { id: "TEN-ACT-001", company: "Acme Technologies", action: "Company Activated", details: "Company activation approved after license review.", timestamp: "2026-11-24T10:30:00", performedBy: "Super Admin" },
  { id: "TEN-ACT-002", company: "Bluewave Solutions", action: "Company Updated", details: "Primary contact and plan details updated.", timestamp: "2026-11-24T09:45:00", performedBy: "Super Admin" },
  { id: "TEN-ACT-003", company: "Nova Systems", action: "Company Suspended", details: "Company access suspended pending compliance review.", timestamp: "2026-11-23T16:20:00", performedBy: "Super Admin" },
  { id: "TEN-ACT-004", company: "Vertex Digital", action: "License Extended", details: "License validity extended by twelve months.", timestamp: "2026-11-23T14:15:00", performedBy: "Super Admin" },
  { id: "TEN-ACT-005", company: "Cloudbridge Ltd", action: "Activation Pending", details: "Company registration is awaiting approval.", timestamp: "2026-11-22T11:30:00", performedBy: "Super Admin" },
  { id: "TEN-ACT-006", company: "Greenfield Corp", action: "Company Created", details: "New company registration submitted.", timestamp: "2026-11-22T10:15:00", performedBy: "Super Admin" },
  { id: "TEN-ACT-007", company: "Orbit Enterprises", action: "Needs Attention", details: "License requires Super Admin review before activation.", timestamp: "2026-11-21T15:40:00", performedBy: "Super Admin" },
];

function readActivationHistory() {
  try {
    const raw = localStorage.getItem(ACTIVATION_HISTORY_KEY) || localStorage.getItem(LEGACY_ACTIVATION_HISTORY_KEY);
    const records = raw ? JSON.parse(raw) : initialActivationHistory;
    if (!Array.isArray(records)) {
      throw new Error("Stored activation history is not a record list.");
    }
    return { records: records.length ? records.map((item) => ({ ...item, performedBy: item.performedBy || "Super Admin" })) : initialActivationHistory, error: "" };
  } catch (error) {
    console.error("Unable to read activation history from browser storage.", error);
    return {
      records: [],
      error: "Unable to read activation history from browser storage.",
    };
  }
}

function readTenants() {
  return readTenantRecords(initialTenants);
}

const emptyForm = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  location: "",
  address: "",
  plan: "Starter",
  users: "",
  licenseStartDate: todayISO(),
  validityMonths: "12",
  licenseExpiryDate: addMonthsISO(todayISO(), 12),
  enabledModules: getModulesForPlan("Starter"),
};

const pillOptions = [
  { label: "Overview", value: "Overview", icon: LayoutGrid },
  {
    label: "Recently Added",
    value: "Recent",
    icon: Clock3,
  },
  {
    label: "Pending Approval",
    value: "Pending",
    icon: ShieldCheck,
  },
  {
    label: "License Management",
    value: "License Management",
    icon: KeyRound,
  },
  {
    label: "Company Activation",
    value: "Company Activation",
    icon: CheckCircle2,
  },
];

function readManagedLicenses(tenants) {
  const saved = readLicenseRecords();
  return tenants.reduce((records, tenant) => {
    const existing = saved.find((license) => license.tenantId === tenant.id);
    const today = todayISO();
    const storedKey = existing?.key || "";
    const hasCurrentFormat = /^TMHR-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/.test(storedKey);
    const status = existing?.status === "Inactive"
      ? "Suspended"
      : existing?.status || (tenant.status === "Active" ? "Active" : "Pending Activation");
    const activatedAt = existing?.activatedAt ||
      (status === "Active" && tenant.status === "Active" ? today : "");

    records.push({
      tenantId: tenant.id,
      company: tenant.name,
      key: hasCurrentFormat
        ? storedKey
        : createLicenseKey([...saved, ...records]),
      plan: tenant.plan,
      modules: Array.isArray(existing?.modules)
        ? existing.modules
        : tenant.enabledModules || getModulesForPlan(tenant.plan),
      issueDate: existing?.issueDate || tenant.date || today,
      startsAt: existing?.startsAt || tenant.licenseStartDate || tenant.date || today,
      expiresAt: existing?.expiresAt || tenant.licenseExpiryDate || today,
      status,
      activatedAt,
      previousKeys: [
        ...(Array.isArray(existing?.previousKeys) ? existing.previousKeys : []),
        ...(storedKey && !hasCurrentFormat ? [storedKey] : []),
      ],
    });
    return records;
  }, []);
}

function addDaysISO(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getActivationAttentionReason(license, tenant, licenses = []) {
  if (!license || !tenant || license.tenantId !== tenant.id || license.company !== tenant.name) {
    return "License key does not match a valid tenant record.";
  }

  const keyOwner = licenses.find(
    (record) => String(record.key || "").toUpperCase() === String(license.key || "").toUpperCase()
  );
  if (keyOwner && keyOwner.tenantId !== tenant.id) {
    return "License key is associated with a different tenant.";
  }
  if (!/^TMHR-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/.test(license.key || "")) {
    return "License key format is invalid.";
  }

  const missingFields = [
    ["name", "company name"],
    ["contact", "contact person"],
    ["email", "contact email"],
    ["phone", "phone number"],
    ["location", "company location"],
  ].filter(([field]) => !String(tenant[field] || "").trim());
  if (missingFields.length) {
    return `Required company information is missing: ${missingFields.map(([, label]) => label).join(", ")}.`;
  }

  const status = getLicenseStatus(license);
  if (status === "Expired") return "License has expired.";
  if (status === "Suspended" || tenant.status === "Suspended") {
    return "Company or license is suspended.";
  }
  if (status === "Revoked") return "License has been revoked.";
  if (tenant.status === "Rejected") return "Company application was rejected.";
  if (tenant.status === "Pending") return "Activation approval is pending.";
  return "";
}

function getCompanyActivationState(license, tenant, licenses = []) {
  const status = getLicenseStatus(license);
  const attentionReason = getActivationAttentionReason(license, tenant, licenses);
  if (
    attentionReason ||
    ["Expired", "Suspended", "Revoked"].includes(status) ||
    ["Suspended", "Rejected"].includes(tenant?.status)
  ) {
    return "Needs Attention";
  }
  return license.activatedAt && status === "Active"
    ? "Activated"
    : "Awaiting Activation";
}

function getActivationActionGroups(license, tenant, licenses) {
  const status = getLicenseStatus(license);
  const state = getCompanyActivationState(license, tenant, licenses);
  const reason = getActivationAttentionReason(license, tenant, licenses);
  const suspended = tenant?.status === "Suspended" || status === "Suspended";
  const pending = tenant?.status === "Pending";
  const expired = status === "Expired";
  const attention = state === "Needs Attention" &&
    reason !== "Activation approval is pending." &&
    reason !== "Company or license is suspended." &&
    reason !== "License has expired.";
  const action = (id, label, icon, danger = false) => ({
    id,
    label,
    icon,
    danger,
  });
  const groups = [[action("view", "View Details", Eye)]];

  if (state === "Activated") {
    groups.push([
      action("copy", "Copy License Key", Copy),
      action("review-activation", "Review Activation Details", ShieldCheck),
    ]);
  }
  if (suspended) {
    groups.push([
      action("review-suspension", "Review Suspension", Eye),
      action("reactivate", "Reactivate Company", PlayCircle),
      action("copy", "Copy License Key", Copy),
    ]);
  }
  if (pending) {
    groups.push([
      action("review-application", "Review Application", Eye),
      action("approve", "Approve & Activate", CheckCircle2),
      action("reject", "Reject with Reason", CircleX, true),
      action("copy", "Copy License Key", Copy),
    ]);
  }
  if (expired) {
    groups.push([
      action("review-expiry", "Review Expiry Details", CalendarDays),
      action("extend", "Extend License", CalendarDays),
      action("regenerate", "Regenerate License Key", RefreshCw),
    ]);
  }
  if (attention) {
    groups.push([
      action("review-attention", "Review Attention Reason", ShieldCheck),
      action("resolve", "Resolve Issue", KeyRound),
    ]);
  }
  if (!suspended && !pending && !expired && !attention && state !== "Activated") {
    groups.push([
      action("review-activation", "Review Activation Details", ShieldCheck),
      action("approve", "Approve & Activate", CheckCircle2),
    ]);
  }

  return groups;
}

export default function TenantManagement() {
  const [activationHistoryRead] = useState(readActivationHistory);
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const requestedView = searchParams.get("view");
  const requestedSearch = searchParams.get("search") || "";
  const [tenants, setTenants] = useState(readTenants);
  const [licenses, setLicenses] = useState(() => readManagedLicenses(readTenants()));
  const [search, setSearch] = useState(requestedSearch);
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = requestedStatus?.toLowerCase();
    return ["active", "pending", "suspended", "rejected"].includes(status)
      ? status[0].toUpperCase() + status.slice(1)
      : "All";
  });
  const [tenantView, setTenantView] = useState("Overview");
  const [kpiFilter, setKpiFilter] = useState("Total Tenants");
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [companyEditForm, setCompanyEditForm] = useState({});
  const [companyEditError, setCompanyEditError] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetailsSource, setTenantDetailsSource] = useState("Tenant Management");
  const [licenseMessage, setLicenseMessage] = useState(activationHistoryRead.error);
  const [form, setForm] = useState(emptyForm);
  const [openMenu, setOpenMenu] = useState(null);
  const [openLicenseMenu, setOpenLicenseMenu] = useState(null);
  const [activationReview, setActivationReview] = useState(null);
  const [extendLicenseTarget, setExtendLicenseTarget] = useState(null);
  const [newLicenseExpiry, setNewLicenseExpiry] = useState("");
  const [activationHistory, setActivationHistory] = useState(activationHistoryRead.records);
  const [activationHistoryLoadFailed] = useState(Boolean(activationHistoryRead.error));
  const [viewMode, setViewMode] = useState("tenants");
  const [licenseSearch, setLicenseSearch] = useState("");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState("All");
  const [activationSearch, setActivationSearch] = useState("");
  const [activationStatusFilter, setActivationStatusFilter] = useState("All");
  const [activationPlanFilter, setActivationPlanFilter] = useState("All");
  const [activationKpiFilter, setActivationKpiFilter] = useState("All");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    if (requestedView === "activation" || requestedView === "licenses") {
      setViewMode(requestedView);
      setActivationStatusFilter(searchParams.get("status") || "All");
      setTenantView("Overview");
    } else {
      setViewMode("tenants");
      setTenantView(
        requestedView === "recent"
          ? "Recent"
          : searchParams.get("status")?.toLowerCase() === "pending"
            ? "Pending"
            : "Overview"
      );
      setStatusFilter(
        ["active", "pending", "suspended", "rejected"].includes((searchParams.get("status") || "").toLowerCase())
          ? `${searchParams.get("status")[0].toUpperCase()}${searchParams.get("status").slice(1)}`
          : "All"
      );
    }
  }, [searchParams, requestedView]);
  const selectedLicense = selectedTenant
    ? licenses.find((license) => license.tenantId === selectedTenant.id)
    : null;
  const licenseDisplayStatus = getLicenseStatus(selectedLicense);
  const selectedActivationIssue = selectedLicense && selectedTenant
    ? getActivationAttentionReason(selectedLicense, selectedTenant, licenses)
    : "";
  const selectedIsSuspended = selectedTenant?.status === "Suspended" ||
    selectedLicense?.status === "Suspended";

  useEffect(() => {
    try {
      saveTenantRecords(tenants);
    } catch {
      setLicenseMessage("Unable to save tenant changes in browser storage.");
    }
  }, [tenants]);

  useEffect(() => {
    try {
      saveLicenseRecords(licenses);
    } catch {
      setLicenseMessage("Unable to save license changes in browser storage.");
    }
  }, [licenses]);

  useEffect(() => {
    if (selectedTenant?.id) setLicenseMessage("");
  }, [selectedTenant?.id]);

  useEffect(() => {
    if (activationHistoryLoadFailed && !activationHistory.length) return;
    try {
      localStorage.setItem(ACTIVATION_HISTORY_KEY, JSON.stringify(activationHistory));
    } catch {
      setLicenseMessage("Unable to save activation history in browser storage.");
    }
  }, [activationHistory, activationHistoryLoadFailed]);

  useEffect(() => {
    if (!openLicenseMenu) return undefined;
    const closeMenu = (event) => {
      if (!event.target.closest(".tenant-license-menu") &&
          !event.target.closest(".tenant-license-menu-trigger")) {
        setOpenLicenseMenu(null);
      }
    };
    const closeOnScroll = () => setOpenLicenseMenu(null);

    document.addEventListener("mousedown", closeMenu);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [openLicenseMenu]);

  const recordActivationEvent = (company, action, details) => {
    setActivationHistory((previous) => [
      {
        id: `ACT-${Date.now()}`,
        company,
        action,
        details,
        timestamp: new Date().toISOString(),
        performedBy: "Super Admin",
      },
      ...previous,
    ]);
  };

  const updateLicenseRecord = (license, update, message) => {
    const updatedLicense = update(license);
    const nextLicenses = licenses.map((item) =>
      item.tenantId === license.tenantId ? updatedLicense : item
    );
    try {
      saveLicenseRecords(nextLicenses);
      setLicenses(nextLicenses);
      setLicenseMessage(message);
      notifySaveSuccess(message);
      return true;
    } catch {
      setLicenseMessage("Unable to save the license change in browser storage.");
      return false;
    }
  };

  const stats = [
    {
      label: "Total Tenants",
      value: tenants.length,
      icon: Building2,
      color: "purple",
      filter: "Total Tenants",
    },
    {
      label: "Active Tenants",
      value: tenants.filter((tenant) => tenant.status === "Active").length,
      icon: CheckCircle2,
      color: "mint",
      filter: "Active Tenants",
    },
    {
      label: "Suspended Tenants",
      value: tenants.filter((tenant) => tenant.status === "Suspended").length,
      icon: Ban,
      color: "red",
      filter: "Suspended Tenants",
    },
    {
      label: "Total Users",
      value: tenants.reduce(
        (total, tenant) => total + Number(tenant.users || 0),
        0
      ),
      icon: Users,
      color: "blue",
      filter: "Total Users",
    },
  ];

  const pendingCount = tenants.filter(
    (tenant) => tenant.status === "Pending"
  ).length;

  const licenseStats = [
    {
      label: "Total Licenses",
      value: licenses.length,
      icon: KeyRound,
      color: "purple",
      filter: "All",
    },
    {
      label: "Active",
      value: licenses.filter((license) => getLicenseStatus(license) === "Active").length,
      icon: CheckCircle2,
      color: "mint",
      filter: "Active",
    },
    {
      label: "Awaiting Activation",
      value: licenses.filter((license) =>
        !license.activatedAt &&
        ["Pending Activation", "Active"].includes(getLicenseStatus(license))
      ).length,
      icon: Clock3,
      color: "blue",
      filter: "Awaiting Activation",
    },
    {
      label: "Expired",
      value: licenses.filter((license) => getLicenseStatus(license) === "Expired").length,
      icon: CalendarDays,
      color: "red",
      filter: "Expired",
    },
  ];

  const activationStats = [
    {
      label: "Total Companies",
      value: licenses.length,
      icon: Building2,
      color: "purple",
      filter: "All",
    },
    {
      label: "Activated",
      value: licenses.filter((license) =>
        getCompanyActivationState(
          license,
          tenants.find((tenant) => tenant.id === license.tenantId),
          licenses
        ) === "Activated"
      ).length,
      icon: CheckCircle2,
      color: "mint",
      filter: "Activated",
    },
    {
      label: "Awaiting Activation",
      value: licenses.filter((license) =>
        getCompanyActivationState(
          license,
          tenants.find((tenant) => tenant.id === license.tenantId),
          licenses
        ) === "Awaiting Activation"
      ).length,
      icon: Clock3,
      color: "blue",
      filter: "Awaiting Activation",
    },
    {
      label: "Needs Attention",
      value: licenses.filter((license) =>
        getCompanyActivationState(
          license,
          tenants.find((tenant) => tenant.id === license.tenantId),
          licenses
        ) === "Needs Attention"
      ).length,
      icon: Ban,
      color: "red",
      filter: "Needs Attention",
    },
  ];

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch = [
        tenant.name,
        tenant.id,
        tenant.contact,
        tenant.email,
        tenant.location,
        tenant.address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || tenant.status === statusFilter;

      const matchesTenantView =
        tenantView === "Overview" ||
        (tenantView === "Recent" &&
          new Date(tenant.date + "T00:00:00") >=
            new Date(new Date().setDate(new Date().getDate() - 30))) ||
        (tenantView === "Pending" && tenant.status === "Pending");

      let matchesKpi = true;

      if (kpiFilter === "Active Tenants") {
        matchesKpi = tenant.status === "Active";
      } else if (kpiFilter === "Suspended Tenants") {
        matchesKpi = tenant.status === "Suspended";
      } else if (kpiFilter === "Total Users") {
        matchesKpi = Number(tenant.users || 0) > 0;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTenantView &&
        matchesKpi
      );
    });
  }, [tenants, search, statusFilter, tenantView, kpiFilter]);

  const handlePillClick = (value) => {
    if (value === "License Management" || value === "Company Activation") {
      setViewMode(value === "License Management" ? "licenses" : "activation");
      setLicenseMessage("");
      return;
    }

    setViewMode("tenants");
    setTenantView(value);
    setStatusFilter(value === "Pending" ? "Pending" : "All");
    setKpiFilter("Total Tenants");
    setSearch("");
    notifySaveSuccess("Tenant created successfully.");
  };

  const handleKpiClick = (filter) => {
    setKpiFilter(filter);
    setStatusFilter("All");
    setTenantView("Overview");
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setKpiFilter("Total Tenants");
    setTenantView("Overview");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "plan") {
        next.enabledModules = getModulesForPlan(value);
      }
      if (name === "validityMonths" || name === "licenseStartDate") {
        next.licenseExpiryDate = addMonthsISO(
          next.licenseStartDate,
          next.validityMonths
        );
      }
      return next;
    });
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setCompanyEditForm({
      name: tenant.name || "",
      contact: tenant.contact || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      location: tenant.location || "",
      address: tenant.address || "",
    });
    setCompanyEditError("");
    setOpenLicenseMenu(null);
  };

  const handleCompanyEditChange = (event) => {
    const { name, value } = event.target;
    setCompanyEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const saveCompanyDetails = (event) => {
    event.preventDefault();
    if (!editingTenant) return;
    const requiredFields = [
      ["name", "company name"],
      ["contact", "contact person"],
      ["email", "contact email"],
      ["phone", "phone number"],
      ["location", "company location"],
    ];
    const missingFields = requiredFields
      .filter(([field]) => !String(companyEditForm[field] || "").trim());
    if (missingFields.length) {
      setCompanyEditError(
        `Enter the required information: ${missingFields.map(([, label]) => label).join(", ")}.`
      );
      return;
    }

    const updatedDetails = Object.fromEntries(
      Object.entries(companyEditForm).map(([field, value]) => [field, value.trim()])
    );
    const nextTenants = tenants.map((tenant) =>
      tenant.id === editingTenant.id
        ? { ...tenant, ...updatedDetails }
        : tenant
    );
    const nextLicenses = licenses.map((license) =>
      license.tenantId === editingTenant.id
        ? { ...license, company: updatedDetails.name }
        : license
    );
    try {
      saveTenantRecords(nextTenants);
      saveLicenseRecords(nextLicenses);
    } catch {
      try {
        saveTenantRecords(tenants);
        saveLicenseRecords(licenses);
      } catch {
        setCompanyEditError("Company details could not be saved or rolled back in browser storage.");
        return;
      }
      setCompanyEditError("Company details could not be saved in browser storage.");
      return;
    }

    setTenants(nextTenants);
    setLicenses(nextLicenses);
    recordActivationEvent(
      updatedDetails.name,
      "Company information updated",
      "Company profile details were corrected."
    );
    setEditingTenant(null);
    setCompanyEditError("");
    setLicenseMessage(`${updatedDetails.name} company information was updated.`);
    notifySaveSuccess("Company information updated successfully.");
  };

  const toggleFormModule = (module) => {
    setForm((previous) => ({
      ...previous,
      enabledModules: previous.enabledModules.includes(module)
        ? previous.enabledModules.filter((item) => item !== module)
        : [...previous.enabledModules, module],
    }));
  };

  const handleAddTenant = (event) => {
    event.preventDefault();

    const nextNumber =
      Math.max(
        0,
        ...tenants.map(
          (tenant) => Number(tenant.id.replace("TEN-", "")) || 0
        )
      ) + 1;

    const newTenant = {
      ...form,
      id: `TEN-${String(nextNumber).padStart(3, "0")}`,
      users: Number(form.users || 0),
      status: "Pending",
      date: todayISO(),
      enabledModules: [...form.enabledModules],
      permissions: [...form.enabledModules],
    };

    let newLicense;
    try {
      newLicense = {
        tenantId: newTenant.id,
        company: newTenant.name,
        key: createLicenseKey(licenses),
        plan: newTenant.plan,
        modules: [...newTenant.enabledModules],
        issueDate: todayISO(),
        startsAt: newTenant.licenseStartDate,
        expiresAt: newTenant.licenseExpiryDate,
        status: "Pending Activation",
        activatedAt: "",
        previousKeys: [],
      };
      saveTenantRecords([newTenant, ...tenants]);
      saveLicenseRecords([newLicense, ...licenses]);
    } catch {
      setLicenseMessage("Unable to generate and save a unique company license.");
      return;
    }

    setTenants((previous) => [newTenant, ...previous]);
    setLicenses((previous) => [newLicense, ...previous]);
    setForm(emptyForm);
    setShowModal(false);
    setSelectedTenant(newTenant);
    setTenantView("Pending");
    setStatusFilter("Pending");
    setKpiFilter("Total Tenants");
    setSearch("");
  };

  const approveTenant = (tenant) => {
    const license = licenses.find((item) => item.tenantId === tenant.id);
    if (!license) {
      setLicenseMessage(`No license record is available for ${tenant.name}.`);
      return;
    }
    setSelectedTenant(null);
    openActivationReview(license);
  };

  const rejectTenant = (tenant) => {
    const license = licenses.find((item) => item.tenantId === tenant.id);
    if (!license) {
      setLicenseMessage(`No license record is available for ${tenant.name}.`);
      return;
    }
    if (rejectActivationApplication(license)) setSelectedTenant(null);
    setOpenMenu(null);
  };

  const toggleTenantStatus = (tenant) => {
    if (tenant.status === "Pending") {
      return;
    }

    if (tenant.status === "Rejected") {
      return;
    }

    const nextStatus =
      tenant.status === "Suspended" ? "Active" : "Suspended";

    const confirmed = window.confirm(
      `${nextStatus === "Active" ? "Reactivate" : "Suspend"} ${tenant.name}?`
    );

    if (!confirmed) return;
    let suspensionReason = tenant.suspensionReason || "";
    if (nextStatus === "Suspended") {
      const enteredReason = window.prompt(`Enter a suspension reason for ${tenant.name}:`);
      if (enteredReason === null) return;
      suspensionReason = enteredReason;
      if (!suspensionReason.trim()) {
        setLicenseMessage("A suspension reason is required.");
        return;
      }
    }

    setTenants((previous) =>
      previous.map((item) =>
        item.id === tenant.id
          ? {
              ...item,
              status: nextStatus,
              ...(nextStatus === "Suspended"
                ? { suspensionReason: suspensionReason.trim() }
                : {}),
            }
          : item
      )
    );

    setOpenMenu(null);
  };

  const openTenantDetails = (tenant, sourceLabel = "Tenant Management") => {
    setTenantDetailsSource(sourceLabel);
    setSelectedTenant(tenant);
    setOpenMenu(null);
    setOpenLicenseMenu(null);
  };

  const closeAddModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTenantView("Overview");
    setKpiFilter("Total Tenants");
  };

  const copyLicenseKey = async (license) => {
    try {
      await navigator.clipboard.writeText(license.key);
      setLicenseMessage(`License key copied for ${license.company}.`);
    } catch {
      setLicenseMessage("Copy is unavailable here. Select and copy the license key manually.");
    }
  };

  const downloadLicenseDetails = (license) => {
    const tenant = tenants.find((item) => item.id === license.tenantId);
    const detail = {
      tenantId: license.tenantId,
      companyName: license.company,
      companyEmail: tenant?.email || "",
      key: license.key,
      plan: license.plan,
      enabledModules: license.modules,
      issueDate: license.issueDate,
      startDate: license.startsAt,
      expiryDate: license.expiresAt,
      activationDate: license.activatedAt || null,
      status: getLicenseStatus(license),
    };
    const blob = new Blob([JSON.stringify(detail, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${license.tenantId}-license-details.json`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setLicenseMessage(`License details downloaded for ${license.company}.`);
  };

  const regenerateLicense = (license) => {
    const tenant = tenants.find((item) => item.id === license.tenantId);
    const companyName = tenant?.name || license.company;
    const confirmed = window.confirm(
      `Regenerate the license for ${companyName}? The existing key will stop working immediately and the company must activate the new key.`
    );
    if (!confirmed) return;
    try {
      updateLicenseRecord(license, (current) => ({
        ...current,
        company: tenant?.name || current.company,
        key: createLicenseKey(licenses),
        status: "Pending Activation",
        activatedAt: "",
        issueDate: todayISO(),
        previousKeys: [...(current.previousKeys || []), current.key],
      }), `A new license key was generated for ${companyName}.`);
    } catch {
      setLicenseMessage("Unable to generate and save a new license key.");
    }
  };

  const extendLicense = (license) => {
    const currentExpiry = new Date(`${license.expiresAt}T00:00:00`);
    const baseline = currentExpiry > new Date() ? currentExpiry : new Date();
    baseline.setMonth(baseline.getMonth() + 12);
    const expiresAt = [
      baseline.getFullYear(),
      String(baseline.getMonth() + 1).padStart(2, "0"),
      String(baseline.getDate()).padStart(2, "0"),
    ].join("-");
    updateLicenseRecord(
      license,
      (current) => ({
        ...current,
        expiresAt,
        status: current.status === "Expired"
          ? current.activatedAt
            ? "Active"
            : "Pending Activation"
          : current.status,
      }),
      `License validity extended through ${expiresAt}.`
    );
  };

  const openLicenseExtension = (license) => {
    const baseDate = license.expiresAt > todayISO()
      ? license.expiresAt
      : todayISO();
    setNewLicenseExpiry(addMonthsISO(baseDate, 12));
    setExtendLicenseTarget(license);
    setLicenseMessage("");
  };

  const saveLicenseExtension = (event) => {
    event.preventDefault();
    if (!extendLicenseTarget) return;
    const minimumDate = addDaysISO(
      extendLicenseTarget.expiresAt > todayISO()
        ? extendLicenseTarget.expiresAt
        : todayISO(),
      1
    );
    if (!newLicenseExpiry || newLicenseExpiry < minimumDate) {
      setLicenseMessage(`Choose an expiry date on or after ${minimumDate}.`);
      return;
    }

    const nextStatus = getLicenseStatus(extendLicenseTarget) === "Expired"
      ? extendLicenseTarget.activatedAt
        ? "Active"
        : "Pending Activation"
      : extendLicenseTarget.status;
    const saved = updateLicenseRecord(
      extendLicenseTarget,
      (current) => ({
        ...current,
        expiresAt: newLicenseExpiry,
        status: nextStatus,
      }),
      `License validity extended through ${newLicenseExpiry}.`
    );
    if (saved) setExtendLicenseTarget(null);
  };

  const changeLicenseStatus = (license, status) => {
    const confirmed = window.confirm(
      `${status === "Suspended" ? "Suspend" : status === "Revoked" ? "Revoke" : "Reactivate"} the license for ${license.company}?`
    );
    if (!confirmed) return;
    let suspensionReason = "";
    if (status === "Suspended") {
      suspensionReason = window.prompt(`Enter a suspension reason for ${license.company}:`);
      if (suspensionReason === null) return;
      if (!suspensionReason.trim()) {
        setLicenseMessage("A suspension reason is required.");
        return;
      }
    }
    updateLicenseRecord(
      license,
      (current) => ({
        ...current,
        status: status === "Active" && !current.activatedAt
          ? "Pending Activation"
          : status,
        ...(status === "Suspended"
          ? { suspensionReason: suspensionReason.trim() }
          : {}),
      }),
      `License status updated to ${status === "Active" && !license.activatedAt ? "Pending Activation" : status}.`
    );
  };

  const runLicenseAction = (action, license) => {
    setOpenLicenseMenu(null);
    if (action === "view") {
      const tenant = tenants.find((item) => item.id === license.tenantId);
      if (tenant) openTenantDetails(tenant, "License Management");
    } else if (action === "copy") {
      copyLicenseKey(license);
    } else if (action === "download") {
      downloadLicenseDetails(license);
    } else if (action === "regenerate") {
      regenerateLicense(license);
    } else if (action === "extend") {
      extendLicense(license);
    } else if (action === "suspend") {
      changeLicenseStatus(license, "Suspended");
    } else if (action === "revoke") {
      changeLicenseStatus(license, "Revoked");
    }
  };

  const toggleLicenseMenu = (event, license, menuHeight = 278) => {
    if (openLicenseMenu?.licenseId === license.tenantId) {
      setOpenLicenseMenu(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const width = 240;
    const topBelow = bounds.bottom + 5;
    const top = topBelow + menuHeight <= window.innerHeight - 8
      ? topBelow
      : Math.max(8, bounds.top - menuHeight - 5);
    setOpenLicenseMenu({
      licenseId: license.tenantId,
      top,
      left: Math.max(8, Math.min(bounds.right - width, window.innerWidth - width - 8)),
    });
  };

  const validateCompanyActivation = (license) => {
    const tenant = tenants.find((item) => item.id === license.tenantId);
    if (!tenant || license.company !== tenant.name) {
      return { valid: false, message: "License key does not match a valid tenant record." };
    }

    const keyOwner = licenses.find(
      (item) => String(item.key || "").toUpperCase() === String(license.key || "").toUpperCase()
    );
    if (!keyOwner || keyOwner.tenantId !== tenant.id) {
      return { valid: false, message: "License key does not match this tenant." };
    }

    const validation = validateLicenseKey(license.key, licenses, tenants);
    if (!validation.valid) return validation;

    const missingFields = [
      ["name", "company name"],
      ["contact", "contact person"],
      ["email", "contact email"],
      ["phone", "phone number"],
      ["location", "company location"],
    ].filter(([field]) => !String(tenant[field] || "").trim());
    if (missingFields.length) {
      return {
        valid: false,
        message: `Required company information is missing: ${missingFields.map(([, label]) => label).join(", ")}.`,
      };
    }

    return { valid: true, license, tenant };
  };

  const openActivationReview = (license) => {
    setActivationReview(license);
    setLicenseMessage("");
  };

  const approveAndActivateCompany = () => {
    if (!activationReview) return;
    const result = validateCompanyActivation(activationReview);
    if (!result.valid) {
      setLicenseMessage(result.message);
      return;
    }

    const activatedAt = todayISO();
    const nextLicenses = licenses.map((item) =>
      item.tenantId === activationReview.tenantId
        ? { ...item, status: "Active", activatedAt }
        : item
    );
    const nextTenants = tenants.map((tenant) =>
      tenant.id === activationReview.tenantId
        ? {
            ...tenant,
            status: "Active",
            activatedAt,
            enabledModules: activationReview.modules || tenant.enabledModules || [],
            permissions: Array.isArray(tenant.permissions)
              ? tenant.permissions.filter((module) =>
                  (activationReview.modules || tenant.enabledModules || []).includes(module)
                )
              : activationReview.modules || tenant.enabledModules || [],
          }
        : tenant
    );

    try {
      saveTenantRecords(nextTenants);
      saveLicenseRecords(nextLicenses);
    } catch {
      try {
        saveTenantRecords(tenants);
        saveLicenseRecords(licenses);
      } catch {
        setLicenseMessage("Activation could not be saved or rolled back in browser storage.");
        return;
      }
      setLicenseMessage("Activation could not be saved in browser storage.");
      return;
    }

    setTenants(nextTenants);
    setLicenses(nextLicenses);
    recordActivationEvent(
      activationReview.company,
      "Company activated",
      "License was validated, approved and activated."
    );
    setActivationReview(null);
    setLicenseMessage(`${activationReview.company} was approved and activated.`);
  };

  const rejectActivationApplication = (license) => {
    const reason = window.prompt(`Enter a rejection reason for ${license.company}:`);
    if (reason === null) return;
    if (!reason.trim()) {
      setLicenseMessage("A rejection reason is required.");
      return;
    }
    const confirmed = window.confirm(
      `Reject ${license.company}'s application with this reason?\n\n${reason.trim()}`
    );
    if (!confirmed) return;

    const nextTenants = tenants.map((tenant) =>
      tenant.id === license.tenantId
        ? { ...tenant, status: "Rejected", rejectionReason: reason.trim() }
        : tenant
    );
    try {
      saveTenantRecords(nextTenants);
    } catch {
      setLicenseMessage("The rejection could not be saved in browser storage.");
      return false;
    }
    setTenants(nextTenants);
    recordActivationEvent(license.company, "Application rejected", reason.trim());
    setLicenseMessage(`${license.company} was rejected: ${reason.trim()}`);
    return true;
  };

  const reopenRejectedApplication = (license) => {
    const restoredTenants = tenants.map((tenant) =>
      tenant.id === license.tenantId && tenant.status === "Rejected"
        ? { ...tenant, status: "Pending" }
        : tenant
    );
    const validation = validateLicenseKey(license.key, licenses, restoredTenants);
    if (!validation.valid) {
      setLicenseMessage(validation.message);
      return;
    }
    const confirmed = window.confirm(
      `Reopen ${license.company}'s application for review?`
    );
    if (!confirmed) return;

    const nextTenants = restoredTenants.map((tenant) =>
      tenant.id === license.tenantId
        ? { ...tenant, rejectionReason: "" }
        : tenant
    );
    try {
      saveTenantRecords(nextTenants);
    } catch {
      setLicenseMessage("The application could not be reopened in browser storage.");
      return;
    }
    setTenants(nextTenants);
    recordActivationEvent(
      license.company,
      "Application reopened",
      "Application returned to Pending Approval for review."
    );
    setLicenseMessage(`${license.company} was returned to Pending Approval.`);
  };

  const reactivateCompany = (license) => {
    const tenant = tenants.find((item) => item.id === license.tenantId);
    const confirmed = window.confirm(
      `Reactivate ${license.company}? The license and company record must pass validation.`
    );
    if (!confirmed) return;
    const restoredLicense = { ...license, status: "Active" };
    const restoredTenants = tenants.map((item) =>
      item.id === license.tenantId ? { ...item, status: "Active" } : item
    );
    const validation = validateLicenseKey(
      license.key,
      licenses.map((item) =>
        item.tenantId === license.tenantId ? restoredLicense : item
      ),
      restoredTenants
    );
    const missingFields = [
      ["name", "company name"],
      ["contact", "contact person"],
      ["email", "contact email"],
      ["phone", "phone number"],
      ["location", "company location"],
    ].filter(([field]) => !String(tenant?.[field] || "").trim());
    if ((!validation.valid && !validation.alreadyActivated) || missingFields.length) {
      setLicenseMessage(
        validation.message ||
          `Complete required information first: ${missingFields.map(([, label]) => label).join(", ")}.`
      );
      return;
    }

    const nextTenants = restoredTenants;
    const nextLicenses = licenses.map((item) =>
      item.tenantId === license.tenantId
        ? { ...item, status: "Active" }
        : item
    );
    try {
      saveTenantRecords(nextTenants);
      saveLicenseRecords(nextLicenses);
    } catch {
      try {
        saveTenantRecords(tenants);
        saveLicenseRecords(licenses);
      } catch {
        setLicenseMessage("Company reactivation could not be saved or rolled back in browser storage.");
        return;
      }
      setLicenseMessage("Company reactivation could not be saved in browser storage.");
      return;
    }
    setTenants(nextTenants);
    setLicenses(nextLicenses);
    recordActivationEvent(license.company, "Company reactivated", "Suspension cleared by Super Admin.");
    setLicenseMessage(`${license.company} was reactivated.`);
  };

  const resolveActivationIssue = (license, tenant) => {
    if (!tenant) {
      setLicenseMessage("The company record for this license could not be found.");
      return;
    }

    const reason = getActivationAttentionReason(license, tenant, licenses);
    const status = getLicenseStatus(license);
    if (reason.startsWith("Required company information is missing:")) {
      handleEdit(tenant);
    } else if (tenant.status === "Rejected") {
      reopenRejectedApplication(license);
    } else if (status === "Revoked" || reason.toLowerCase().includes("license key")) {
      regenerateLicense(license);
    } else if (tenant.status === "Suspended" || status === "Suspended") {
      reactivateCompany(license);
    } else if (status === "Expired") {
      openLicenseExtension(license);
    } else {
      openActivationReview(license);
    }
  };

  const runActivationAction = (action, license, tenant) => {
    setOpenLicenseMenu(null);
    if (action === "view") {
      if (tenant) openTenantDetails(tenant, "Company Activation");
    } else if (action === "copy") {
      copyLicenseKey(license);
    } else if (action === "review-activation" || action === "review-suspension" ||
               action === "review-expiry" || action === "review-attention") {
      if (tenant) openTenantDetails(tenant, "Company Activation");
    } else if (action === "review-application" || action === "approve") {
      openActivationReview(license);
    } else if (action === "reject") {
      rejectActivationApplication(license);
    } else if (action === "reactivate") {
      reactivateCompany(license);
    } else if (action === "extend") {
      openLicenseExtension(license);
    } else if (action === "regenerate") {
      regenerateLicense(license);
    } else if (action === "resolve") {
      resolveActivationIssue(license, tenant);
    }
  };

  const filteredLicenses = useMemo(() => licenses.filter((license) => {
    const status = getLicenseStatus(license);
    const query = licenseSearch.trim().toLowerCase();
    const tenant = tenants.find((item) => item.id === license.tenantId);
    const matchesText = !query ||
      [license.tenantId, license.company, license.key, license.plan, tenant?.email]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = licenseStatusFilter === "All" ||
      (licenseStatusFilter === "Awaiting Activation"
        ? !license.activatedAt && ["Pending Activation", "Active"].includes(status)
        : status === licenseStatusFilter);
    return matchesText && matchesStatus;
  }), [licenses, tenants, licenseSearch, licenseStatusFilter]);

  const resetLicenseFilters = () => {
    setLicenseSearch("");
    setLicenseStatusFilter("All");
  };

  const filteredActivations = useMemo(() => licenses.filter((license) => {
    const status = getLicenseStatus(license);
    const tenant = tenants.find((item) => item.id === license.tenantId);
    const query = activationSearch.trim().toLowerCase();
    const matchesText = !query ||
      [license.tenantId, license.company, tenant?.email, license.plan]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const activationState = getCompanyActivationState(license, tenant, licenses);
    const matchesStatus = activationStatusFilter === "All" ||
      activationStatusFilter === status ||
      activationStatusFilter === activationState;
    const matchesPlan = activationPlanFilter === "All" ||
      license.plan === activationPlanFilter;
    const matchesKpi = activationKpiFilter === "All" ||
      activationKpiFilter === activationState;
    return matchesText && matchesStatus && matchesPlan && matchesKpi;
  }), [
    licenses,
    tenants,
    activationSearch,
    activationStatusFilter,
    activationPlanFilter,
    activationKpiFilter,
  ]);

  const handleActivationKpiClick = (filter) => {
    setActivationKpiFilter(filter);
    setActivationStatusFilter("All");
    setActivationPlanFilter("All");
    setActivationSearch("");
  };

  const resetActivationFilters = () => {
    setActivationSearch("");
    setActivationStatusFilter("All");
    setActivationPlanFilter("All");
    setActivationKpiFilter("All");
  };

  const getTableDescription = () => {
    if (tenantView === "Pending") {
      return "Organizations awaiting Super Admin approval";
    }

    if (tenantView === "Recent") {
      return "Recently registered organizations";
    }

    if (kpiFilter === "Active Tenants") {
      return "Currently active organizations";
    }

    if (kpiFilter === "Suspended Tenants") {
      return "Suspended organizations";
    }

    if (kpiFilter === "Total Users") {
      return "Organizations with registered users";
    }

    if (statusFilter !== "All") {
      return `${statusFilter} organizations`;
    }

    return "View and manage all platform tenants";
  };
  const activationReviewValidation = activationReview
    ? validateCompanyActivation(activationReview)
    : null;
  const extensionMinimumDate = extendLicenseTarget
    ? addDaysISO(
        extendLicenseTarget.expiresAt > todayISO()
          ? extendLicenseTarget.expiresAt
          : todayISO(),
        1
      )
    : "";

  return (
    <div className="tenant-page">
      <div className="tenant-heading">
        <div>
          <span className="tenant-eyebrow">
            SUPER ADMIN / MANAGEMENT
          </span>
          <h1>Tenant Management</h1>
          <p>
            Manage organizations registered on your HRMS platform.
          </p>
        </div>

        <button
          type="button"
          className="tenant-add-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Add New Tenant
        </button>
      </div>

      <nav className="tenant-pill-nav" role="tablist" aria-label="Tenant Management navigation">
        {pillOptions.map((pill) => {
          const Icon = pill.icon;
          const isSpecialView = pill.value === "License Management" ||
            pill.value === "Company Activation";
          const isActive = isSpecialView
            ? viewMode === (pill.value === "License Management" ? "licenses" : "activation")
            : viewMode === "tenants" && tenantView === pill.value;

          return (
            <button
              type="button"
              role="tab"
              key={pill.value}
              className={`tenant-pill sa-pill-kpi ${isActive ? "active" : ""}`}
              onClick={() => handlePillClick(pill.value)}
              aria-selected={isActive}
            >
              <Icon size={17} />
              <span>{pill.label}</span>

              {pill.value === "Pending" && (
                <span className="tenant-pill-count">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {viewMode === "tenants" && (
        <>
      <div className="tenant-stats-grid sa-main-kpi-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isSelected = kpiFilter === stat.filter;

          return (
            <button
              type="button"
              key={stat.label}
              className={`tenant-stat-card sa-main-kpi-card ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => handleKpiClick(stat.filter)}
              aria-pressed={isSelected}
            >
              <div className={`tenant-stat-icon ${stat.color}`}>
                <Icon size={21} />
              </div>

              <div className="tenant-stat-content">
                <span>{stat.label}</span>
                <h2>{stat.value.toLocaleString("en-IN")}</h2>
              </div>
            </button>
          );
        })}
      </div>

      <section className="tenant-table-section">
        <div className="tenant-table-header">
          <div>
            <h2>Registered Organizations</h2>
            <p>{getTableDescription()}</p>
          </div>

          <span className="tenant-count">
            {filteredTenants.length} Organizations
          </span>
        </div>

        <div className="tenant-toolbar">
          <div className="tenant-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, contact..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="tenant-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="tenant-filter">
            <Filter size={17} />
            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value)
              }
              aria-label="Filter by status"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button
            type="button"
            className="tenant-reset-btn"
            onClick={clearFilters}
          >
            Reset
          </button>
        </div>

        <div className="tenant-table-wrapper">
          <table className="tenant-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Contact Person</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Registration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className="tenant-org">
                      <div className="tenant-org-icon">
                        <Building2 size={19} />
                      </div>
                      <div>
                        <strong>{tenant.name}</strong>
                        <span>{tenant.id}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="tenant-contact">
                      <strong>{tenant.contact}</strong>
                      <span>{tenant.email}</span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`tenant-plan ${tenant.plan.toLowerCase()}`}
                    >
                      {tenant.plan}
                    </span>
                  </td>

                  <td>
                    {Number(tenant.users).toLocaleString("en-IN")}
                  </td>

                  <td>
                    {new Date(
                      tenant.date + "T00:00:00"
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td>
                    <span
                      className={`tenant-status ${tenant.status.toLowerCase()}`}
                    >
                      <span />
                      {tenant.status}
                    </span>
                  </td>

                  <td>
                    <div className="tenant-action-wrap">
                      {tenant.status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            className="tenant-approve-btn"
                            onClick={() => approveTenant(tenant)}
                            title="Approve tenant"
                          >
                            <CheckCircle2 size={15} />
                            Approve
                          </button>

                          <button
                            type="button"
                            className="tenant-reject-btn"
                            onClick={() => rejectTenant(tenant)}
                            title="Reject tenant"
                          >
                            <CircleX size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="tenant-action-btn"
                            onClick={() => openTenantDetails(tenant)}
                            title="View details"
                            aria-label={`View ${tenant.name}`}
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            className="tenant-action-btn"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === tenant.id ? null : tenant.id
                              )
                            }
                            title="More actions"
                            aria-label={`More actions for ${tenant.name}`}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenu === tenant.id && (
                            <div className="tenant-action-menu">
                              <button
                                type="button"
                                onClick={() => openTenantDetails(tenant)}
                              >
                                <Eye size={15} />
                                View Details
                              </button>

                              {tenant.status !== "Rejected" && (
                                <button
                                  type="button"
                                  onClick={() => toggleTenantStatus(tenant)}
                                >
                                  {tenant.status === "Suspended" ? (
                                    <>
                                      <PlayCircle size={15} />
                                      Reactivate Tenant
                                    </>
                                  ) : (
                                    <>
                                      <PauseCircle size={15} />
                                      Suspend Tenant
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan="7" className="tenant-empty">
                    <Building2 size={25} />
                    <strong>No organizations found</strong>
                    <span>
                      Try changing your search or filter selections.
                    </span>
                    <button type="button" onClick={clearFilters}>
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
        </>
      )}

      {viewMode === "licenses" && (
        <>
        <div className="tenant-stats-grid sa-main-kpi-grid">
          {licenseStats.map((stat) => {
            const Icon = stat.icon;
            const isSelected = licenseStatusFilter === stat.filter;
            return (
              <button
                type="button"
                key={stat.label}
                className={`tenant-stat-card sa-main-kpi-card ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  setLicenseStatusFilter(stat.filter);
                  setLicenseSearch("");
                }}
                aria-pressed={isSelected}
              >
                <div className={`tenant-stat-icon ${stat.color}`}>
                  <Icon size={21} />
                </div>
                <div className="tenant-stat-content">
                  <span>{stat.label}</span>
                  <h2>{stat.value.toLocaleString("en-IN")}</h2>
                </div>
              </button>
            );
          })}
        </div>
        <section className="tenant-table-section tenant-license-management">
          <div className="tenant-table-header">
            <div>
              <h2>Tenant Licenses</h2>
              <p>Issue, activate, extend, suspend, or revoke company licenses.</p>
            </div>
            <span className="tenant-count">{filteredLicenses.length} Licenses</span>
          </div>
          <div className="tenant-toolbar">
            <div className="tenant-search">
              <Search size={18} />
              <input
                type="search"
                value={licenseSearch}
                onChange={(event) => setLicenseSearch(event.target.value)}
                placeholder="Search tenant, company, or key..."
              />
            </div>
            <div className="tenant-filter">
              <Filter size={17} />
              <select
                value={licenseStatusFilter}
                onChange={(event) => setLicenseStatusFilter(event.target.value)}
                aria-label="Filter licenses by status"
              >
                <option>All</option>
                {["Awaiting Activation", "Active", "Expired", "Suspended", "Revoked"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <button type="button" className="tenant-reset-btn" onClick={resetLicenseFilters}>Reset</button>
          </div>
          {licenseMessage && <p className="tenant-license-message tenant-license-global-message" role="status">{licenseMessage}</p>}
          <div className="tenant-table-wrapper">
            <table className="tenant-table tenant-license-table">
              <thead>
                <tr>
                  <th>Tenant ID</th>
                  <th>Company</th>
                  <th>License Key</th>
                  <th>Plan</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Activation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((license) => {
                  const status = getLicenseStatus(license);
                  return (
                    <tr key={license.tenantId}>
                      <td><strong>{license.tenantId}</strong></td>
                      <td>{license.company}</td>
                      <td><code>{license.key}</code></td>
                      <td>{license.plan}</td>
                      <td>{license.issueDate}</td>
                      <td>{license.expiresAt}</td>
                      <td>{license.activatedAt ? "Activated" : "Not activated"}</td>
                      <td><span className={`tenant-license-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></td>
                      <td>
                        <div className="tenant-license-row-actions">
                          <button
                            type="button"
                            className="tenant-license-menu-trigger"
                            onClick={(event) => toggleLicenseMenu(event, license)}
                            aria-label={`License actions for ${license.company}`}
                            aria-expanded={openLicenseMenu?.licenseId === license.tenantId}
                            title="License actions"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                        {openLicenseMenu?.licenseId === license.tenantId &&
                          createPortal(
                            <div
                              className="mod-superadmin tenant-license-menu"
                              role="menu"
                              aria-label={`${license.company} license actions`}
                              style={{
                                position: "fixed",
                                top: openLicenseMenu.top,
                                left: openLicenseMenu.left,
                              }}
                            >
                              <button type="button" role="menuitem" onClick={() => runLicenseAction("view", license)}>
                                <Eye size={15} /> View License Details
                              </button>
                              <button type="button" role="menuitem" onClick={() => runLicenseAction("copy", license)}>
                                <Copy size={15} /> Copy License Key
                              </button>
                              <button type="button" role="menuitem" onClick={() => runLicenseAction("download", license)}>
                                <Download size={15} /> Download License Details
                              </button>
                              <div className="tenant-license-menu-separator" />
                              <button type="button" role="menuitem" onClick={() => runLicenseAction("regenerate", license)}>
                                <RefreshCw size={15} /> Regenerate License
                              </button>
                              <button type="button" role="menuitem" onClick={() => runLicenseAction("extend", license)}>
                                <CalendarDays size={15} /> Extend License
                              </button>
                              <div className="tenant-license-menu-separator" />
                              <button type="button" role="menuitem" className="danger" onClick={() => runLicenseAction("suspend", license)}>
                                <PauseCircle size={15} /> Suspend License
                              </button>
                              <button type="button" role="menuitem" className="danger" onClick={() => runLicenseAction("revoke", license)}>
                                <Ban size={15} /> Revoke License
                              </button>
                            </div>,
                            document.body
                          )}
                      </td>
                    </tr>
                  );
                })}
                {filteredLicenses.length === 0 && (
                  <tr><td colSpan="9" className="tenant-empty">No licenses match the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        </>
      )}

      {viewMode === "activation" && (
        <>
          <div className="tenant-stats-grid sa-main-kpi-grid">
            {activationStats.map((stat) => {
              const Icon = stat.icon;
              const isSelected = activationKpiFilter === stat.filter;
              return (
                <button
                  type="button"
                  key={stat.label}
                  className={`tenant-stat-card sa-main-kpi-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleActivationKpiClick(stat.filter)}
                  aria-pressed={isSelected}
                >
                  <div className={`tenant-stat-icon ${stat.color}`}>
                    <Icon size={21} />
                  </div>
                  <div className="tenant-stat-content">
                    <span>{stat.label}</span>
                    <h2>{stat.value.toLocaleString("en-IN")}</h2>
                  </div>
                </button>
              );
            })}
          </div>

          <section className="tenant-table-section tenant-license-management">
            <div className="tenant-table-header">
              <div>
                <h2>Company Activation Management</h2>
                <p>Review company activation status and manage tenant access keys.</p>
              </div>
              <span className="tenant-count">{filteredActivations.length} Companies</span>
            </div>
            <div className="tenant-toolbar">
              <div className="tenant-search">
                <Search size={18} />
                <input
                  type="search"
                  value={activationSearch}
                  onChange={(event) => setActivationSearch(event.target.value)}
                  placeholder="Search company, tenant, or email..."
                  aria-label="Search company activations"
                />
              </div>
              <div className="tenant-filter">
                <Filter size={17} />
                <select
                  value={activationStatusFilter}
                  onChange={(event) => {
                    setActivationStatusFilter(event.target.value);
                    setActivationKpiFilter("All");
                  }}
                  aria-label="Filter company activations by status"
                >
                  <option value="All">All Activation Statuses</option>
                  <option value="Activated">Activated</option>
                  <option value="Awaiting Activation">Awaiting Activation</option>
                  <option value="Needs Attention">Needs Attention</option>
                  {["Expired", "Suspended", "Revoked"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="tenant-filter">
                <Filter size={17} />
                <select
                  value={activationPlanFilter}
                  onChange={(event) => setActivationPlanFilter(event.target.value)}
                  aria-label="Filter company activations by plan"
                >
                  <option value="All">All Plans</option>
                  {["Starter", "Professional", "Enterprise"].map((plan) => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="tenant-reset-btn" onClick={resetActivationFilters}>Reset</button>
            </div>
            {licenseMessage && <p className="tenant-license-message tenant-license-global-message" role="status">{licenseMessage}</p>}
            <div className="tenant-table-wrapper">
              <table className="tenant-table tenant-license-table tenant-activation-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Tenant ID</th>
                    <th>Plan</th>
                    <th>License Key</th>
                    <th>Activation</th>
                    <th>Attention Reason</th>
                    <th>Issue Date</th>
                    <th>Company Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivations.map((license) => {
                    const tenant = tenants.find((item) => item.id === license.tenantId);
                    const activationState = getCompanyActivationState(license, tenant, licenses);
                    const issue = getActivationAttentionReason(license, tenant, licenses) ||
                      (!license.activatedAt ? "License is not yet activated." : "—");
                    const actionGroups = getActivationActionGroups(license, tenant, licenses);
                    const seenActions = new Set();
                    const menuEntries = [];
                    actionGroups.forEach((group) => {
                      const uniqueGroup = group.filter((entry) => {
                        if (seenActions.has(entry.id)) return false;
                        seenActions.add(entry.id);
                        return true;
                      });
                      if (uniqueGroup.length) {
                        if (menuEntries.length) {
                          menuEntries.push({
                            id: `separator-${menuEntries.length}`,
                            separator: true,
                          });
                        }
                        menuEntries.push(...uniqueGroup);
                      }
                    });
                    const menuHeight =
                      menuEntries.filter((entry) => !entry.separator).length * 34 +
                      menuEntries.filter((entry) => entry.separator).length * 11 +
                      12;
                    return (
                      <tr key={license.tenantId}>
                        <td>
                          <div className="tenant-org">
                            <div className="tenant-org-icon"><Building2 size={19} /></div>
                            <div>
                              <strong>{license.company}</strong>
                              <span>{tenant?.email || "No email on file"}</span>
                            </div>
                          </div>
                        </td>
                        <td><strong>{license.tenantId}</strong></td>
                        <td>{license.plan}</td>
                        <td><code>{license.key.replace(/.(?=.{4})/g, "•")}</code></td>
                        <td>{activationState}</td>
                        <td className="tenant-activation-reason">{issue}</td>
                        <td>{license.issueDate || "—"}</td>
                        <td>
                          <span className={`tenant-license-status ${(tenant?.status || "Unknown").toLowerCase().replaceAll(" ", "-")}`}>
                            {tenant?.status || "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div className="tenant-license-row-actions">
                            <button
                              type="button"
                              className="tenant-license-menu-trigger"
                              onClick={(event) => toggleLicenseMenu(
                                event,
                                license,
                                menuHeight
                              )}
                              aria-label={`Company actions for ${license.company}`}
                              aria-haspopup="menu"
                              aria-expanded={openLicenseMenu?.licenseId === license.tenantId}
                              title="Company actions"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                          {openLicenseMenu?.licenseId === license.tenantId &&
                            createPortal(
                              <div
                                className="mod-superadmin tenant-license-menu"
                                role="menu"
                                aria-label={`${license.company} activation actions`}
                                style={{
                                  position: "fixed",
                                  top: openLicenseMenu.top,
                                  left: openLicenseMenu.left,
                                }}
                              >
                                {menuEntries.map((entry) => entry.separator ? (
                                  <div
                                    key={entry.id}
                                    className="tenant-license-menu-separator"
                                  />
                                ) : (
                                  <button
                                    key={entry.id}
                                    type="button"
                                    role="menuitem"
                                    className={entry.danger ? "danger" : ""}
                                    onClick={() => runActivationAction(entry.id, license, tenant)}
                                  >
                                    <entry.icon size={15} />
                                    {entry.label}
                                  </button>
                                ))}
                              </div>,
                              document.body
                            )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredActivations.length === 0 && (
                    <tr><td colSpan="9" className="tenant-empty">No company activations match the selected filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="tenant-table-section tenant-activation-history">
            <div className="tenant-table-header">
              <div>
                <h2>Activation Activity</h2>
                <p>Recent approval and company activation decisions.</p>
              </div>
            </div>
            {activationHistory.length ? activationHistory.slice(0, 5).map((entry) => (
              <div className="tenant-activation-history-row" key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.company} — {entry.details}</span>
                <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString("en-IN")}</time>
              </div>
            )) : <p className="tenant-license-message">No activation activity recorded.</p>}
          </section>
        </>
      )}

      {showModal && (
        <div
          className="tenant-modal-overlay"
          onClick={closeAddModal}
        >
          <div
            className="tenant-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tenant-modal-header">
              <div>
                <span>ORGANIZATION REGISTRATION</span>
                <h2>Add New Tenant</h2>
                <p>
                  Create the company record and issue its unique license key.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                className="tenant-modal-close"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTenant}>
              <div className="tenant-form-grid">
                <label>
                  Company Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Enter company name"
                    required
                  />
                </label>

                <label>
                  Contact Person *
                  <input
                    name="contact"
                    value={form.contact}
                    onChange={handleFormChange}
                    placeholder="Enter contact person"
                    required
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="organization@example.com"
                    required
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                  />
                </label>

                <label>
                  Location
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="City / Location"
                  />
                </label>

                <label className="tenant-form-full">
                  Company Address *
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleFormChange}
                    placeholder="Street, city, state, postal code"
                    required
                  />
                </label>

                <label>
                  Subscription Plan *
                  <select
                    name="plan"
                    value={form.plan}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </label>

                <label className="tenant-form-full">
                  Employee Count
                  <input
                    type="number"
                    name="users"
                    min="1"
                    value={form.users}
                    onChange={handleFormChange}
                    placeholder="Number of employees"
                    required
                  />
                </label>

                <label>
                  License Validity (months) *
                  <input
                    type="number"
                    name="validityMonths"
                    min="1"
                    max="120"
                    value={form.validityMonths}
                    onChange={handleFormChange}
                    required
                  />
                </label>
                <label>
                  License Start Date *
                  <input
                    type="date"
                    name="licenseStartDate"
                    value={form.licenseStartDate}
                    onChange={handleFormChange}
                    required
                  />
                </label>
                <label>
                  License Expiry Date
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    value={form.licenseExpiryDate}
                    readOnly
                  />
                </label>

                <fieldset className="tenant-module-picker tenant-form-full">
                  <legend>Enabled HRMS Modules *</legend>
                  <div>
                    {getModulesForPlan(form.plan).map((module) => (
                      <label key={module}>
                        <input
                          type="checkbox"
                          checked={form.enabledModules.includes(module)}
                          onChange={() => toggleFormModule(module)}
                        />
                        {module}
                      </label>
                    ))}
                  </div>
                  <small>Available modules are limited by the selected subscription plan.</small>
                </fieldset>
              </div>

              <div className="tenant-modal-footer">
                <button
                  type="button"
                  className="tenant-cancel-btn"
                  onClick={closeAddModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tenant-submit-btn"
                  disabled={!form.enabledModules.length}
                >
                  <KeyRound size={17} />
                  Create Tenant &amp; Generate License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTenant && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setEditingTenant(null)}
        >
          <div
            className="tenant-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-company-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tenant-modal-header">
              <div>
                <span>COMPANY INFORMATION</span>
                <h2 id="edit-company-title">Edit Company Details</h2>
                <p>{editingTenant.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="tenant-modal-close"
                aria-label="Close company details form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveCompanyDetails}>
              <div className="tenant-form-grid">
                <label>
                  Company Name *
                  <input
                    name="name"
                    value={companyEditForm.name || ""}
                    onChange={handleCompanyEditChange}
                    required
                  />
                </label>
                <label>
                  Contact Person *
                  <input
                    name="contact"
                    value={companyEditForm.contact || ""}
                    onChange={handleCompanyEditChange}
                    required
                  />
                </label>
                <label>
                  Contact Email *
                  <input
                    type="email"
                    name="email"
                    value={companyEditForm.email || ""}
                    onChange={handleCompanyEditChange}
                    required
                  />
                </label>
                <label>
                  Phone Number *
                  <input
                    name="phone"
                    value={companyEditForm.phone || ""}
                    onChange={handleCompanyEditChange}
                    required
                  />
                </label>
                <label>
                  Company Location *
                  <input
                    name="location"
                    value={companyEditForm.location || ""}
                    onChange={handleCompanyEditChange}
                    required
                  />
                </label>
                <label className="tenant-form-full">
                  Company Address
                  <input
                    name="address"
                    value={companyEditForm.address || ""}
                    onChange={handleCompanyEditChange}
                  />
                </label>
              </div>
              {companyEditError && (
                <p className="tenant-form-error" role="alert">
                  {companyEditError}
                </p>
              )}
              <div className="tenant-modal-footer">
                <button
                  type="button"
                  className="tenant-cancel-btn"
                  onClick={() => setEditingTenant(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="tenant-submit-btn">
                  <CheckCircle2 size={15} /> Save Company Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTenant && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setSelectedTenant(null)}
        >
          <div
            className="tenant-modal tenant-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tenant-modal-header">
              <div>
                <span>TENANT INFORMATION</span>
                <h2>{selectedTenant.name}</h2>
                <p>{selectedTenant.id}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="tenant-modal-close"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="tenant-details-grid">
              <div>
                <Mail size={17} />
                <span>Email</span>
                <strong>{selectedTenant.email}</strong>
              </div>

              <div>
                <Phone size={17} />
                <span>Phone</span>
                <strong>{selectedTenant.phone || "Not provided"}</strong>
              </div>

              <div>
                <MapPin size={17} />
                <span>Location</span>
                <strong>{selectedTenant.location || "Not provided"}</strong>
              </div>

              <div>
                <MapPin size={17} />
                <span>Company Address</span>
                <strong>{selectedTenant.address || "Not provided"}</strong>
              </div>

              <div>
                <Users size={17} />
                <span>Users</span>
                <strong>
                  {Number(selectedTenant.users).toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <Layers3 size={17} />
                <span>Subscription</span>
                <strong>{selectedTenant.plan}</strong>
              </div>

              <div>
                <CalendarDays size={17} />
                <span>Registered</span>
                <strong>
                  {new Date(
                    selectedTenant.date + "T00:00:00"
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
              {selectedTenant.rejectionReason && (
                <div className="tenant-rejection-reason">
                  <CircleX size={17} />
                  <span>Rejection Reason</span>
                  <strong>{selectedTenant.rejectionReason}</strong>
                </div>
              )}
            </div>

            {selectedIsSuspended ? (
              <p className="tenant-activation-review-note attention" role="status">
                <strong>Suspension reason:</strong>{" "}
                {selectedTenant.suspensionReason ||
                  selectedLicense?.suspensionReason ||
                  "No suspension reason was recorded."}
              </p>
            ) : selectedActivationIssue ? (
              <p className="tenant-activation-review-note attention" role="status">
                <strong>Activation attention:</strong> {selectedActivationIssue}
              </p>
            ) : null}

            <section className="tenant-license-panel">
              <div className="tenant-license-heading">
                <div>
                  <span>COMPANY ACCESS</span>
                  <strong>License key</strong>
                </div>
                {selectedLicense && (
                  <span
                    className={`tenant-license-status ${licenseDisplayStatus?.toLowerCase()}`}
                  >
                    {licenseDisplayStatus}
                  </span>
                )}
              </div>

              {selectedLicense ? (
                <>
                  <code className="tenant-license-value">
                    {selectedLicense.key}
                  </code>
                  <span className="tenant-license-expiry">
                    Starts {selectedLicense.startsAt} · Expires {selectedLicense.expiresAt} · {selectedLicense.activatedAt ? `Activated ${selectedLicense.activatedAt}` : "Not activated"}
                  </span>
                  <span className="tenant-license-expiry">
                    Enabled modules: {(selectedLicense.modules || []).join(", ")}
                  </span>
                  <div className="tenant-license-actions">
                    <button type="button" onClick={() => copyLicenseKey(selectedLicense)}>
                      <Copy size={14} />
                      Copy key
                    </button>
                    <button type="button" onClick={() => downloadLicenseDetails(selectedLicense)}>
                      <Download size={14} />
                      Download details
                    </button>
                    <button type="button" onClick={() => regenerateLicense(selectedLicense)}>
                      <RefreshCw size={14} />
                      Regenerate
                    </button>
                    <button type="button" onClick={() => extendLicense(selectedLicense)}>
                      <CalendarDays size={14} />
                      Extend 12 months
                    </button>
                    {selectedLicense.status === "Suspended" ? (
                      <button type="button" onClick={() => changeLicenseStatus(selectedLicense, "Active")}>
                      <PlayCircle size={14} />
                      Reactivate
                      </button>
                    ) : selectedLicense.status !== "Revoked" && (
                      <button type="button" onClick={() => changeLicenseStatus(selectedLicense, "Suspended")}>
                      <PauseCircle size={14} />
                      Suspend
                      </button>
                    )}
                    {selectedLicense.status !== "Revoked" && (
                      <button type="button" onClick={() => changeLicenseStatus(selectedLicense, "Revoked")}>
                      <ShieldCheck size={14} />
                      Revoke
                      </button>
                    )}
                    <Link to="/super-admin/activate" className="tenant-license-link">
                      <ExternalLink size={14} />
                      Open company activation form
                    </Link>
                  </div>
                </>
              ) : (
                <p>No license has been generated for this tenant.</p>
              )}
              {licenseMessage && (
                <p className="tenant-license-message" role="status">
                  {licenseMessage}
                </p>
              )}
            </section>

            {selectedTenant.status === "Pending" && (
              <div className="tenant-details-approval">
                <button
                  type="button"
                  className="tenant-approve-btn"
                  onClick={() => approveTenant(selectedTenant)}
                >
                  <CheckCircle2 size={16} />
                  Approve Tenant
                </button>

                <button
                  type="button"
                  className="tenant-reject-btn"
                  onClick={() => rejectTenant(selectedTenant)}
                >
                  <CircleX size={16} />
                  Reject Tenant
                </button>
              </div>
            )}

            <div className="tenant-details-footer">
              <span
                className={`tenant-status ${selectedTenant.status.toLowerCase()}`}
              >
                <span />
                {selectedTenant.status}
              </span>

              <button
                type="button"
                className="tenant-cancel-btn"
                onClick={() => setSelectedTenant(null)}
              >
                <ArrowLeft size={14} />
                Back to {tenantDetailsSource}
              </button>
            </div>
          </div>
        </div>
      )}

      {extendLicenseTarget && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setExtendLicenseTarget(null)}
        >
          <div
            className="tenant-modal tenant-license-extension-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="license-extension-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tenant-modal-header">
              <div>
                <span>LICENSE MANAGEMENT</span>
                <h2 id="license-extension-title">Extend License</h2>
                <p>{extendLicenseTarget.company} · {extendLicenseTarget.tenantId}</p>
              </div>
              <button
                type="button"
                onClick={() => setExtendLicenseTarget(null)}
                className="tenant-modal-close"
                aria-label="Close license extension"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveLicenseExtension}>
              <div className="tenant-form-grid">
                <label>
                  Current Expiry Date
                  <input
                    type="date"
                    value={extendLicenseTarget.expiresAt || ""}
                    readOnly
                  />
                </label>
                <label>
                  New Expiry Date *
                  <input
                    type="date"
                    value={newLicenseExpiry}
                    min={extensionMinimumDate}
                    onChange={(event) => setNewLicenseExpiry(event.target.value)}
                    required
                  />
                </label>
              </div>
              {licenseMessage && (
                <p className="tenant-license-message" role="status">
                  {licenseMessage}
                </p>
              )}
              <div className="tenant-modal-footer">
                <button
                  type="button"
                  className="tenant-cancel-btn"
                  onClick={() => setExtendLicenseTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="tenant-submit-btn">
                  <CalendarDays size={15} /> Save New Expiry Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activationReview && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setActivationReview(null)}
        >
          <div
            className="tenant-modal tenant-activation-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activation-review-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tenant-modal-header">
              <div>
                <span>COMPANY ACTIVATION REVIEW</span>
                <h2 id="activation-review-title">{activationReview.company}</h2>
                <p>{activationReview.tenantId} · {activationReview.plan} plan</p>
              </div>
              <button
                type="button"
                onClick={() => setActivationReview(null)}
                className="tenant-modal-close"
                aria-label="Close activation review"
              >
                <X size={20} />
              </button>
            </div>

            <div className="tenant-details-grid">
              <div>
                <Mail size={17} />
                <span>Email</span>
                <strong>{tenants.find((tenant) => tenant.id === activationReview.tenantId)?.email || "Not provided"}</strong>
              </div>
              <div>
                <Phone size={17} />
                <span>Phone</span>
                <strong>{tenants.find((tenant) => tenant.id === activationReview.tenantId)?.phone || "Not provided"}</strong>
              </div>
              <div>
                <KeyRound size={17} />
                <span>License Key</span>
                <strong>{activationReview.key}</strong>
              </div>
              <div>
                <CalendarDays size={17} />
                <span>Validity</span>
                <strong>{activationReview.startsAt} – {activationReview.expiresAt}</strong>
              </div>
              <div>
                <ShieldCheck size={17} />
                <span>License Status</span>
                <strong>{getLicenseStatus(activationReview)}</strong>
              </div>
              <div>
                <Building2 size={17} />
                <span>Company Status</span>
                <strong>{tenants.find((tenant) => tenant.id === activationReview.tenantId)?.status || "Unknown"}</strong>
              </div>
            </div>

            <p
              className={`tenant-activation-validation ${activationReviewValidation?.valid ? "valid" : "invalid"}`}
              role="status"
            >
              {activationReviewValidation?.valid
                ? "License, tenant association, dates, status and required company information are valid."
                : activationReviewValidation?.message}
            </p>

            <div className="tenant-modal-footer">
              <button
                type="button"
                className="tenant-cancel-btn"
                onClick={() => setActivationReview(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tenant-reject-btn"
                onClick={() => {
                  if (rejectActivationApplication(activationReview)) {
                    setActivationReview(null);
                  }
                }}
              >
                <CircleX size={15} /> Reject with Reason
              </button>
              <button
                type="button"
                className="tenant-approve-btn"
                onClick={approveAndActivateCompany}
                disabled={!activationReviewValidation?.valid}
              >
                <CheckCircle2 size={15} /> Approve &amp; Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
