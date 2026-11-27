
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { notifySaveSuccess } from "../../utils/saveNavigation";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Power,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  LayoutDashboard,
  List,
  History,
  Settings2,
  ArrowRight,
  Activity,
  Clock3,
  CalendarDays,
  X,
  Check,
  RotateCcw,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
  Ban,
  Shield,
  Download,
  Save
} from "lucide-react";

import "./PlatformUsers.css";

// ============================================================
// CONFIGURATION
// ============================================================

const USERS_KEY = "hrms.superadmin.platformusers.v2";
const HISTORY_KEY = "superAdminPlatformUserActivity";
const LEGACY_HISTORY_KEY = "hrms.superadmin.platformusers.history.v1";
const ROLES_KEY = "hrms.superadmin.platformusers.roles.v1";

const PAGE_SIZE = 5;

const MODULES = [
  "Dashboard",
  "Platform Users",
  "Tenant Management",
  "Plan Management",
  "Billing Management",
  "Module Management",
  "Employee Management",
  "Payroll",
  "Attendance",
  "Leave Management",
  "Recruitment",
  "Performance",
  "Reports & Analytics",
  "Audit Logs",
  "Settings"
];

const DEFAULT_ROLES = [
  {
    name: "Platform Admin",
    description: "Full platform administration access.",
    permissions: [...MODULES]
  },
  {
    name: "Support",
    description: "Support and operational assistance.",
    permissions: [
      "Dashboard",
      "Platform Users",
      "Tenant Management",
      "Settings"
    ]
  },
  {
    name: "Manager",
    description: "Manage HRMS operations and reports.",
    permissions: [
      "Dashboard",
      "Employee Management",
      "Payroll",
      "Attendance",
      "Leave Management",
      "Recruitment",
      "Performance",
      "Reports & Analytics"
    ]
  },
  {
    name: "Auditor",
    description: "Review reports and audit activities.",
    permissions: [
      "Dashboard",
      "Reports & Analytics",
      "Audit Logs"
    ]
  }
];

const INITIAL_USERS = [
  {
    id: 1,
    name: "Admin One",
    email: "admin1@example.com",
    mobile: "",
    role: "Platform Admin",
    status: "Active",
    organization: "Platform",
    department: "Administration",
    tenant: "All Tenants",
    createdAt: "2026-11-01T09:00:00",
    lastLogin: null,
    permissions: null
  },
  {
    id: 2,
    name: "Support User",
    email: "support@example.com",
    mobile: "",
    role: "Support",
    status: "Active",
    organization: "Platform",
    department: "Support",
    tenant: "All Tenants",
    createdAt: "2026-11-02T09:00:00",
    lastLogin: null,
    permissions: null
  },
  {
    id: 3,
    name: "Manager One",
    email: "manager@example.com",
    mobile: "",
    role: "Manager",
    status: "Inactive",
    organization: "Platform",
    department: "Management",
    tenant: "All Tenants",
    createdAt: "2026-11-03T09:00:00",
    lastLogin: null,
    permissions: null
  }
];

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  role: "Platform Admin",
  status: "Active",
  organization: "Platform",
  department: "",
  tenant: "All Tenants",
  permissions: null
};

const INITIAL_HISTORY = [
  { id: "PU-DEMO-001", action: "User Created", userName: "Admin One", details: "Created a Platform Admin account", timestamp: "2026-11-24T10:30:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-002", action: "Role Updated", userName: "Support User", details: "Updated Support role permissions", timestamp: "2026-11-24T09:45:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-003", action: "User Activated", userName: "Manager One", details: "Activated platform user account", timestamp: "2026-11-23T16:20:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-004", action: "User Deactivated", userName: "Manager Two", details: "Deactivated user account", timestamp: "2026-11-23T14:15:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-005", action: "Permissions Updated", userName: "Admin One", details: "Updated module access permissions", timestamp: "2026-11-22T11:30:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-006", action: "Password Reset", userName: "Support User", details: "Password reset initiated", timestamp: "2026-11-22T10:15:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-007", action: "Role Assigned", userName: "Manager One", details: "Assigned Manager role", timestamp: "2026-11-21T15:40:00", performedBy: "Super Admin" },
  { id: "PU-DEMO-008", action: "User Updated", userName: "Admin One", details: "Updated user profile information", timestamp: "2026-11-20T12:10:00", performedBy: "Super Admin" }
];

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard
  },
  {
    id: "users",
    label: "All Users",
    icon: List
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    icon: ShieldCheck
  },
  {
    id: "history",
    label: "Activity History",
    icon: History
  }
];

const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Suspended"
];

// ============================================================
// STORAGE HELPERS
// ============================================================

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeUser(user) {
  const safeUser =
    user && typeof user === "object" ? user : {};

  return {
    ...EMPTY_FORM,
    ...safeUser,
    id: safeUser.id ?? Date.now(),
    name: String(safeUser.name || "Unnamed User"),
    email: String(safeUser.email || ""),
    mobile: String(safeUser.mobile || ""),
    role: String(safeUser.role || "Support"),
    organization: String(
      safeUser.organization || "Platform"
    ),
    department: String(safeUser.department || ""),
    tenant: String(safeUser.tenant || "All Tenants"),
    status: STATUS_OPTIONS.includes(safeUser.status)
      ? safeUser.status
      : "Inactive",
    createdAt: safeUser.createdAt || null,
    lastLogin: safeUser.lastLogin || null,
    permissions: Array.isArray(safeUser.permissions)
      ? safeUser.permissions
      : null
  };
}

function readUsers() {
  return readStorage(USERS_KEY, INITIAL_USERS).map(
    normalizeUser
  );
}

function readRoles() {
  const saved = readStorage(ROLES_KEY, DEFAULT_ROLES);

  const validRoles = saved
    .filter(
      (role) =>
        role &&
        typeof role === "object" &&
        typeof role.name === "string"
    )
    .map((role) => ({
      ...role,
      description: String(role.description || ""),
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : []
    }));

  return validRoles.length ? validRoles : DEFAULT_ROLES;
}

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function StatusBadge({ status }) {
  const safeStatus = STATUS_OPTIONS.includes(status)
    ? status
    : "Inactive";

  return (
    <span
      className={`pu-status ${safeStatus.toLowerCase()}`}
    >
      <span className="pu-status-dot" />
      {safeStatus}
    </span>
  );
}

function IconButton({
  icon: Icon,
  title,
  onClick,
  danger = false
}) {
  return (
    <button
      type="button"
      className={`pu-icon ${danger ? "danger" : ""}`}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Icon size={16} />
    </button>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  type,
  subtitle,
  onClick
}) {
  return (
    <button
      type="button"
      className={`pu-stat-card ${type || ""}`}
      onClick={onClick}
    >
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>

      <div className="pu-stat-icon">
        <Icon size={22} />
      </div>
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false
}) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [onClose]);

  return (
    <div
      className="pu-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`pu-modal ${
          wide ? "pu-modal-wide" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="pu-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="pu-icon"
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

function EmptyState({
  icon: Icon,
  title,
  description
}) {
  return (
    <div className="pu-empty-state">
      <Icon size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

// ============================================================
// MAIN PLATFORM USERS COMPONENT
// ============================================================

export default function PlatformUsers() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedStatus = searchParams.get("status")?.toLowerCase();
  const requestedSearch = searchParams.get("search") || "";
  const [users, setUsers] = useState(readUsers);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!saved) return INITIAL_HISTORY;
    try { const data = JSON.parse(saved); return Array.isArray(data) && data.length ? data.map((item) => ({ ...item, performedBy: item.performedBy || "Super Admin" })) : INITIAL_HISTORY; } catch { return INITIAL_HISTORY; }
  });

  const [roles, setRoles] = useState(readRoles);

  const [tab, setTab] = useState(
    ["overview", "users", "roles", "history"].includes(requestedTab)
      ? requestedTab
      : searchParams.has("status") || requestedSearch ? "users" : "overview"
  );

  const [search, setSearch] = useState(requestedSearch);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = requestedStatus;
    return ["active", "inactive", "pending", "suspended"].includes(status)
      ? status[0].toUpperCase() + status.slice(1)
      : "All";
  });

  const [
    organizationFilter,
    setOrganizationFilter
  ] = useState("All");

  const [page, setPage] = useState(1);

  useEffect(() => {
    const query = searchParams.get("search") || "";
    const requested = searchParams.get("status")?.toLowerCase();
    const nextTab = searchParams.get("tab");
    const nextStatus = ["active", "inactive", "pending", "suspended"].includes(requested)
      ? requested[0].toUpperCase() + requested.slice(1)
      : "All";

    const hasFilter = searchParams.has("search") || searchParams.has("status");
    setTab(
      ["overview", "users", "roles", "history"].includes(nextTab)
        ? nextTab
        : hasFilter ? "users" : "overview"
    );
    setSearch(query);
    setStatusFilter(nextStatus);
    setRoleFilter("All");
    setOrganizationFilter("All");
    setPage(1);
  }, [searchParams]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    ...EMPTY_FORM
  });

  const [formError, setFormError] = useState("");

  const [viewId, setViewId] = useState(null);

  const [
    permissionUserId,
    setPermissionUserId
  ] = useState(null);

  const [editingRole, setEditingRole] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyRoleFilter, setHistoryRoleFilter] = useState("All");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("All");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const [
    rolePermissions,
    setRolePermissions
  ] = useState([]);

  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
      );
    } catch (error) {
      console.warn(
        "Could not save platform users.",
        error
      );
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.warn(
        "Could not save platform user history.",
        error
      );
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ROLES_KEY,
        JSON.stringify(roles)
      );
    } catch (error) {
      console.warn(
        "Could not save platform roles.",
        error
      );
    }
  }, [roles]);

  // ==========================================================
  // ACTIVITY LOGGING
  // ==========================================================

  const logActivity = (
    action,
    userName,
    details
  ) => {
    const entry = {
      id: `PU-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      action,
      userName,
      details,
      timestamp: new Date().toISOString(),
      performedBy: "Super Admin"
    };

    setHistory((previous) => [
      entry,
      ...previous
    ]);
    notifySaveSuccess(`${action} completed successfully.`);
  };

  // ==========================================================
  // DASHBOARD STATISTICS
  // ==========================================================

  const total = users.length;

  const active = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactive = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  const suspended = users.filter(
    (user) => user.status === "Suspended"
  ).length;

  const roleCounts = useMemo(() => {
    return roles.map((role) => ({
      name: role.name,
      count: users.filter(
        (user) => user.role === role.name
      ).length
    }));
  }, [users, roles]);

  const organizations = useMemo(() => {
    return [
      ...new Set(
        users
          .map((user) => user.organization)
          .filter(Boolean)
      )
    ];
  }, [users]);

  // ==========================================================
  // SEARCH AND FILTERS
  // ==========================================================

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const text = [
        user.name,
        user.email,
        user.mobile,
        user.role,
        user.organization,
        user.department,
        user.tenant
      ]
        .join(" ")
        .toLowerCase();

      return (
        text.includes(term) &&
        (
          roleFilter === "All" ||
          user.role === roleFilter
        ) &&
        (
          statusFilter === "All" ||
          user.status === statusFilter ||
          (statusFilter === "Inactive or Suspended" &&
            ["Inactive", "Suspended"].includes(user.status))
        ) &&
        (
          organizationFilter === "All" ||
          user.organization === organizationFilter
        )
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
    organizationFilter
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const selectedUser = users.find(
    (user) => user.id === viewId
  );

  const permissionUser = users.find(
    (user) => user.id === permissionUserId
  );

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const getRolePermissions = (roleName) => {
    return (
      roles.find(
        (role) => role.name === roleName
      )?.permissions || []
    );
  };

  const getEffectivePermissions = (user) => {
    if (!user) {
      return [];
    }

    return Array.isArray(user.permissions)
      ? user.permissions
      : getRolePermissions(user.role);
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = (nextTab) => {
    setTab(nextTab);

    window.requestAnimationFrame(() => {
      document
        .getElementById("pu-main-content")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    });
  };

  const filterStat = (status) => {
    setSearch("");
    setRoleFilter("All");
    setOrganizationFilter("All");
    setStatusFilter(status);
    setPage(1);
    navigate("users");
  };

  const filterDistribution = ({ status = "All", role = "All" } = {}) => {
    setSearch("");
    setRoleFilter(role);
    setOrganizationFilter("All");
    setStatusFilter(status);
    setPage(1);
    navigate("users");
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
    setOrganizationFilter("All");
    setPage(1);
  };

  // ==========================================================
  // ADD AND EDIT USERS
  // ==========================================================

  const addUser = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowForm(true);
  };

  const editUser = (user) => {
    setEditing(user.id);

    setForm({
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      role: user.role,
      status: user.status,
      organization:
        user.organization || "Platform",
      department: user.department || "",
      tenant: user.tenant || "All Tenants",
      permissions: user.permissions
    });

    setFormError("");
    setViewId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError("");
  };

  const saveUser = (event) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 2) {
      setFormError(
        "Enter a valid full name."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setFormError(
        "Enter a valid email address."
      );
      return;
    }

    const duplicateEmail = users.some(
      (user) =>
        user.email.toLowerCase() === email &&
        user.id !== editing
    );

    if (duplicateEmail) {
      setFormError(
        "A user with this email already exists."
      );
      return;
    }

    const payload = {
      ...form,
      name,
      email,
      mobile: form.mobile.trim(),
      organization:
        form.organization.trim() || "Platform",
      department: form.department.trim(),
      tenant:
        form.tenant.trim() || "All Tenants"
    };

    if (editing !== null) {
      setUsers((previous) =>
        previous.map((user) =>
          user.id === editing
            ? {
                ...user,
                ...payload
              }
            : user
        )
      );

      logActivity(
        "User Updated",
        name,
        "Updated user account details"
      );
    } else {
      const newUser = {
        ...payload,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      setUsers((previous) => [
        ...previous,
        newUser
      ]);

      logActivity(
        "User Created",
        name,
        `Assigned ${payload.role} role`
      );
    }

    closeForm();
  };

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const deleteUser = (user) => {
    const confirmed = window.confirm(
      `Delete "${user.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setUsers((previous) =>
      previous.filter(
        (item) => item.id !== user.id
      )
    );

    setViewId(null);
    setPermissionUserId(null);

    logActivity(
      "User Deleted",
      user.name,
      "Removed platform user"
    );
  };

  // ==========================================================
  // ACTIVATE / DEACTIVATE / SUSPEND
  // ==========================================================

  const changeStatus = (
    user,
    nextStatus
  ) => {
    if (user.status === nextStatus) {
      return;
    }

    const confirmed = window.confirm(
      `Change "${user.name}" status to ${nextStatus}?`
    );

    if (!confirmed) {
      return;
    }

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status: nextStatus
            }
          : item
      )
    );

    logActivity(
      "Account Status Changed",
      user.name,
      `${user.status} → ${nextStatus}`
    );
  };

  // ==========================================================
  // USER PERMISSIONS
  // ==========================================================

  const openPermissions = (user) => {
    setPermissionUserId(user.id);
  };

  const toggleUserPermission = (module) => {
    if (!permissionUser) {
      return;
    }

    const current =
      getEffectivePermissions(permissionUser);

    const next = current.includes(module)
      ? current.filter(
          (item) => item !== module
        )
      : [...current, module];

    setUsers((previous) =>
      previous.map((user) =>
        user.id === permissionUser.id
          ? {
              ...user,
              permissions: next
            }
          : user
      )
    );

    logActivity(
      "Permission Updated",
      permissionUser.name,
      `Changed access to ${module}`
    );
  };

  const resetUserPermissions = () => {
    if (!permissionUser) {
      return;
    }

    setUsers((previous) =>
      previous.map((user) =>
        user.id === permissionUser.id
          ? {
              ...user,
              permissions: null
            }
          : user
      )
    );

    logActivity(
      "Permissions Reset",
      permissionUser.name,
      "Restored role-based permissions"
    );
  };

  // ==========================================================
  // ROLE PERMISSIONS
  // ==========================================================

  const editRolePermissions = (role) => {
    setEditingRole(role.name);

    setRolePermissions([
      ...role.permissions
    ]);
  };

  const toggleRolePermission = (module) => {
    setRolePermissions((previous) =>
      previous.includes(module)
        ? previous.filter(
            (item) => item !== module
          )
        : [...previous, module]
    );
  };

  const saveRolePermissions = () => {
    if (!editingRole) {
      return;
    }

    setRoles((previous) =>
      previous.map((role) =>
        role.name === editingRole
          ? {
              ...role,
              permissions: [
                ...rolePermissions
              ]
            }
          : role
      )
    );

    logActivity(
      "Role Permissions Updated",
      editingRole,
      "Updated default module access for role"
    );

    setEditingRole(null);
  };

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportUsers = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Mobile",
      "Role",
      "Organization",
      "Department",
      "Tenant",
      "Status",
      "Created At"
    ];

    const rows = filtered.map((user) => [
      user.id,
      user.name,
      user.email,
      user.mobile,
      user.role,
      user.organization,
      user.department,
      user.tenant,
      user.status,
      user.createdAt || ""
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(
              value ?? ""
            ).replace(/"/g, '""');

            return `"${safeValue}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type: "text/csv;charset=utf-8"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "platform-users.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [history]);
  const recentHistory = sortedHistory.slice(0, 5);
  const historyTypes = [...new Set(history.map((item) => item.action))];
  const historyRoles = [...new Set(history.map((item) => item.role || item.userName))];
  const filteredHistory = useMemo(() => sortedHistory.filter((item) => { const term = historySearch.toLowerCase().trim(); const date = new Date(item.timestamp); return [item.action, item.userName, item.email, item.details].join(" ").toLowerCase().includes(term) && (historyRoleFilter === "All" || item.role === historyRoleFilter || item.userName === historyRoleFilter) && (historyTypeFilter === "All" || item.action === historyTypeFilter) && (!historyFrom || date >= new Date(`${historyFrom}T00:00:00`)) && (!historyTo || date <= new Date(`${historyTo}T23:59:59`)); }), [sortedHistory, historySearch, historyRoleFilter, historyTypeFilter, historyFrom, historyTo]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="pu-page">
      {/* PAGE HEADER */}

      <div className="pu-header">
        <div>
          <div className="pu-eyebrow">
            SUPER ADMIN / PLATFORM OPERATIONS
          </div>

          <h1>
            Platform Users Management
          </h1>

          <p>
            Manage platform accounts, access
            permissions, roles and account
            activities.
          </p>
        </div>

        <button
          type="button"
          className="pu-primary"
          onClick={addUser}
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* TABS */}

      <div
        className="pu-tabs"
        role="tablist"
      >
        {TABS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={
                tab === item.id
              }
              className={
                tab === item.id
                  ? "sa-pill-kpi active"
                  : "sa-pill-kpi"
              }
              onClick={() =>
                setTab(item.id)
              }
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div id="pu-main-content">
        {/* ====================================================
            OVERVIEW TAB
        ==================================================== */}

        {tab === "overview" && (
          <>
            <div className="pu-overview-heading">
              <div>
                <h2>
                  Platform Users Overview
                </h2>

                <p>
                  Monitor user accounts, roles,
                  access and platform activity
                  in one place.
                </p>
              </div>

              <span className="pu-live-label">
                <Activity size={15} />
                Live User Summary
              </span>
            </div>

            {/* KPI CARDS */}

            <div className="pu-stats pu-stats-four">
              <StatCard
                title="Total Users"
                value={total}
                icon={Users}
                type="total"
                subtitle="View all users"
                onClick={() =>
                  filterStat("All")
                }
              />

              <StatCard
                title="Active Users"
                value={active}
                icon={UserCheck}
                type="active"
                subtitle="Currently active accounts"
                onClick={() =>
                  filterStat("Active")
                }
              />

              <StatCard
                title="Inactive Users"
                value={inactive}
                icon={UserX}
                type="inactive"
                subtitle="Inactive platform accounts"
                onClick={() =>
                  filterStat("Inactive")
                }
              />

              <StatCard
                title="Suspended Users"
                value={suspended}
                icon={Ban}
                type="suspended"
                subtitle="Suspended accounts"
                onClick={() =>
                  filterStat("Suspended")
                }
              />
            </div>

            {/* CHARTS */}

            <div className="pu-overview-grid">
              <section className="pu-panel">
                <div className="pu-panel-head">
                  <div>
                    <h3>
                      User Status Distribution
                    </h3>

                    <p>
                      Active, inactive and
                      suspended users
                    </p>
                  </div>

                  <Users size={19} />
                </div>

                <div className="pu-distribution">
                  <div
                    className="pu-donut"
                    style={{
                      background: total
                        ? `conic-gradient(
                            #62ddc8 0% ${
                              (active / total) * 100
                            }%,
                            #9c8cff ${
                              (active / total) * 100
                            }% ${
                              ((active + inactive) /
                                total) *
                              100
                            }%,
                            #ff9e80 ${
                              ((active + inactive) /
                                total) *
                              100
                            }% 100%
                          )`
                        : "conic-gradient(#39535c 0% 100%)"
                    }}
                  >
                    <div className="pu-donut-inner">
                      <strong>
                        {total}
                      </strong>

                      <span>
                        Total Users
                      </span>
                    </div>
                  </div>

                  <div className="pu-legend">
                    {[
                      ["Active", active],
                      ["Inactive", inactive],
                      ["Suspended", suspended]
                    ].map(
                      ([label, count]) => (
                        <button
                          type="button"
                          className="pu-legend-filter"
                          key={label}
                          onClick={() => filterDistribution({ status: label })}
                        >
                          <span>
                            <i
                              className={`pu-legend-dot ${label.toLowerCase()}`}
                            />

                            {label}
                          </span>

                          <strong>
                            {count}
                          </strong>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </section>

              {/* ROLE DISTRIBUTION */}

              <section className="pu-panel">
                <div className="pu-panel-head">
                  <div>
                    <h3>
                      Role Distribution
                    </h3>

                    <p>
                      Users grouped by
                      assigned roles
                    </p>
                  </div>

                  <ShieldCheck size={19} />
                </div>

                <div className="pu-role-bars">
                  {roleCounts.map((role) => (
                    <button
                      type="button"
                      className="pu-role-row"
                      key={role.name}
                      onClick={() => filterDistribution({ role: role.name })}
                    >
                      <div>
                        <span>
                          {role.name}
                        </span>

                        <strong>
                          {role.count}
                        </strong>
                      </div>

                      <div className="pu-progress">
                        <div
                          style={{
                            width: `${
                              total
                                ? (role.count /
                                    total) *
                                  100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* USER SUMMARY */}

            <section className="pu-panel pu-overview-summary">
              <div className="pu-panel-head">
                <div>
                  <h3>
                    Platform User Summary
                  </h3>

                  <p>
                    Account status and
                    assigned access roles
                  </p>
                </div>

                <button
                  type="button"
                  className="pu-text-button"
                  onClick={() =>
                    navigate("users")
                  }
                >
                  View All Users
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="pu-summary-list">
                {users.slice(0, 6).map(
                  (user) => (
                    <div
                      className="pu-summary-row"
                      key={user.id}
                    >
                      <div className="pu-user-identity">
                        <div className="pu-avatar">
                          {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.name}
                          </strong>

                          <small>
                            {user.email}
                          </small>
                        </div>
                      </div>

                      <span className="pu-summary-role">
                        {user.role}
                      </span>

                      <span className="pu-summary-org">
                        {user.organization}
                      </span>

                      <StatusBadge
                        status={user.status}
                      />

                      <IconButton
                        icon={Eye}
                        title={`View ${user.name}`}
                        onClick={() =>
                          setViewId(user.id)
                        }
                      />
                    </div>
                  )
                )}

                {users.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title="No platform users"
                    description="Add your first platform user."
                  />
                )}
              </div>
            </section>

            {/* QUICK ACTIONS AND ACTIVITY */}

            <div className="pu-overview-grid">
              <section className="pu-panel">
                <div className="pu-panel-head">
                  <div>
                    <h3>
                      Quick Actions
                    </h3>

                    <p>
                      Frequently used
                      platform operations
                    </p>
                  </div>

                  <Settings2 size={19} />
                </div>

                <div className="pu-quick-grid">
                  {[
                    {
                      label: "Add New User",
                      desc: "Create platform account",
                      icon: Plus,
                      action: addUser
                    },
                    {
                      label: "Manage Users",
                      desc: "Search and update accounts",
                      icon: Users,
                      action: () =>
                        navigate("users")
                    },
                    {
                      label: "Roles & Permissions",
                      desc: "Configure module access",
                      icon: ShieldCheck,
                      action: () =>
                        navigate("roles")
                    },
                    {
                      label: "Activity History",
                      desc: "Review account changes",
                      icon: History,
                      action: () =>
                        navigate("history")
                    }
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                      >
                        <span>
                          <Icon size={18} />
                        </span>

                        <div>
                          <strong>
                            {item.label}
                          </strong>

                          <small>
                            {item.desc}
                          </small>
                        </div>

                        <ArrowRight size={15} />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* RECENT ACTIVITY */}

              <section className="pu-panel">
                <div className="pu-panel-head">
                  <div>
                    <h3>
                      Recent Activity
                    </h3>

                    <p>
                      Latest platform
                      user changes
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pu-text-button"
                    onClick={() =>
                      navigate("history")
                    }
                  >
                    View All
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="pu-activity-list">
                  {recentHistory.map(
                    (item) => (
                      <div
                        className="pu-activity-item"
                        key={item.id}
                      >
                        <span className="pu-activity-icon">
                          <Activity size={16} />
                        </span>

                        <div>
                          <strong>
                            {item.action}
                          </strong>

                          <p>
                            {item.userName}
                            {" — "}
                            {item.details}
                          </p>

                          <small>
                            <Clock3 size={12} />
                            {formatDate(
                              item.timestamp
                            )}
                          </small>
                        </div>
                      </div>
                    )
                  )}

                  {recentHistory.length === 0 && (
                    <EmptyState
                      icon={History}
                      title="No activity recorded"
                      description="User changes will appear here."
                    />
                  )}
                </div>
              </section>
            </div>

          </>
        )}

        {/* ====================================================
            ALL USERS TAB
        ==================================================== */}

        {tab === "users" && (
          <>
            <div className="pu-stats">
              <StatCard
                title="Total Users"
                value={total}
                icon={Users}
                type="total"
                subtitle="All platform users"
                onClick={() =>
                  filterStat("All")
                }
              />

              <StatCard
                title="Active Users"
                value={active}
                icon={UserCheck}
                type="active"
                subtitle="Active accounts"
                onClick={() =>
                  filterStat("Active")
                }
              />

              <StatCard
                title="Inactive Users"
                value={inactive + suspended}
                icon={UserX}
                type="inactive"
                subtitle="Inactive and suspended"
                onClick={() =>
                  filterStat("Inactive or Suspended")
                }
              />
            </div>

            <section className="pu-panel">
              <div className="pu-panel-head">
                <div>
                  <h2>
                    All Platform Users
                  </h2>

                  <p>
                    Manage platform
                    accounts and access.
                  </p>
                </div>

                <button
                  type="button"
                  className="pu-secondary"
                  onClick={exportUsers}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>

              {/* FILTER TOOLBAR */}

              <div className="pu-toolbar">
                <div className="pu-search">
                  <Search size={17} />

                  <input
                    placeholder="Search users..."
                    value={search}
                    onChange={(event) => {
                      setSearch(
                        event.target.value
                      );

                      setPage(1);
                    }}
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  aria-label="Filter by role"
                >
                  <option value="All">
                    All Roles
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.name}
                      value={role.name}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="All">
                    All Status
                  </option>

                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}

                  <option value="Inactive or Suspended">
                    Inactive or Suspended
                  </option>
                </select>

                <select
                  value={organizationFilter}
                  onChange={(event) => {
                    setOrganizationFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  aria-label="Filter by organization"
                >
                  <option value="All">
                    All Organizations
                  </option>

                  {organizations.map(
                    (organization) => (
                      <option
                        key={organization}
                        value={organization}
                      >
                        {organization}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="pu-secondary"
                  onClick={resetFilters}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>

              <p className="pu-count">
                Showing {filtered.length} of{" "}
                {users.length} users
              </p>

              {/* USERS TABLE */}

              <div className="pu-table-wrap">
                <table className="pu-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Organization</th>
                      <th>Tenant Access</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.map(
                      (user) => (
                        <tr key={user.id}>
                          <td>
                            PU-{user.id}
                          </td>

                          <td>
                            <div className="pu-table-user">
                              <span className="pu-avatar">
                                {user.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <strong>
                                {user.name}
                              </strong>
                            </div>
                          </td>

                          <td>
                            {user.email}
                          </td>

                          <td>
                            {user.role}
                          </td>

                          <td>
                            {user.organization}
                          </td>

                          <td>
                            {user.tenant}
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                user.status
                              }
                            />
                          </td>

                          <td>
                            <div className="pu-table-actions">
                              <IconButton
                                icon={Eye}
                                title={`View ${user.name}`}
                                onClick={() =>
                                  setViewId(
                                    user.id
                                  )
                                }
                              />

                              <IconButton
                                icon={Pencil}
                                title={`Edit ${user.name}`}
                                onClick={() =>
                                  editUser(
                                    user
                                  )
                                }
                              />

                              <IconButton
                                icon={
                                  LockKeyhole
                                }
                                title={`Permissions for ${user.name}`}
                                onClick={() =>
                                  openPermissions(
                                    user
                                  )
                                }
                              />

                              <IconButton
                                icon={Power}
                                title={
                                  user.status ===
                                  "Active"
                                    ? "Deactivate"
                                    : "Activate"
                                }
                                onClick={() =>
                                  changeStatus(
                                    user,
                                    user.status ===
                                      "Active"
                                      ? "Inactive"
                                      : "Active"
                                  )
                                }
                              />

                              <IconButton
                                icon={Ban}
                                title={`Suspend ${user.name}`}
                                onClick={() =>
                                  changeStatus(
                                    user,
                                    "Suspended"
                                  )
                                }
                              />

                              <IconButton
                                icon={Trash2}
                                title={`Delete ${user.name}`}
                                onClick={() =>
                                  deleteUser(
                                    user
                                  )
                                }
                                danger
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    )}

                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="pu-empty-cell"
                        >
                          No matching users
                          found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div className="pu-pagination">
                <span>
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={
                      currentPage <= 1
                    }
                    onClick={() =>
                      setPage((previous) =>
                        Math.max(
                          1,
                          previous - 1
                        )
                      )
                    }
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <button
                    type="button"
                    disabled={
                      currentPage >= totalPages
                    }
                    onClick={() =>
                      setPage((previous) =>
                        Math.min(
                          totalPages,
                          previous + 1
                        )
                      )
                    }
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ====================================================
            ROLES AND PERMISSIONS TAB
        ==================================================== */}

        {tab === "roles" && (
          <section className="pu-panel">
            <div className="pu-panel-head">
              <div>
                <h2>
                  Roles & Permissions
                </h2>

                <p>
                  Configure default module
                  permissions for platform roles.
                </p>
              </div>

              <ShieldCheck size={21} />
            </div>

            <div className="pu-role-cards">
              {roles.map((role) => (
                <div
                  className="pu-role-card"
                  key={role.name}
                >
                  <div className="pu-role-card-top">
                    <span className="pu-role-icon">
                      <Shield size={20} />
                    </span>

                    <span className="pu-role-users">
                      {
                        users.filter(
                          (user) =>
                            user.role ===
                            role.name
                        ).length
                      }{" "}
                      users
                    </span>
                  </div>

                  <h3>
                    {role.name}
                  </h3>

                  <p>
                    {role.description}
                  </p>

                  <div className="pu-role-info">
                    <span>
                      Module Permissions
                    </span>

                    <strong>
                      {
                        role.permissions
                          .length
                      }
                      /{MODULES.length}
                    </strong>
                  </div>

                  <div className="pu-role-module-list">
                    {MODULES.map(
                      (module) => {
                        const allowed =
                          role.permissions.includes(
                            module
                          );

                        return (
                          <div
                            key={module}
                            className={
                              allowed
                                ? "allowed"
                                : "denied"
                            }
                          >
                            {allowed ? (
                              <Check
                                size={14}
                              />
                            ) : (
                              <X
                                size={14}
                              />
                            )}

                            {module}
                          </div>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    className="pu-secondary pu-full-width"
                    onClick={() =>
                      editRolePermissions(
                        role
                      )
                    }
                  >
                    <Pencil size={15} />
                    Edit Role Permissions
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====================================================
            ACTIVITY HISTORY TAB
        ==================================================== */}

        {tab === "history" && (
          <section className="pu-panel">
            <div className="pu-panel-head">
              <div>
                <h2>
                  Activity History
                </h2>

                <p>
                  Locally recorded user
                  management activities.
                </p>
              </div>

              <span className="pu-history-count">
                <History size={15} />
                {filteredHistory.length} of {history.length} activities
              </span>
            </div>

            <div className="pu-history-filters">
              <div className="pu-search"><Search size={16} /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search user, email or activity..." /></div>
              <select value={historyRoleFilter} onChange={(event) => setHistoryRoleFilter(event.target.value)} aria-label="Filter user activity by role"><option value="All">All Roles</option>{historyRoles.map((role) => <option key={role}>{role}</option>)}</select>
              <select value={historyTypeFilter} onChange={(event) => setHistoryTypeFilter(event.target.value)} aria-label="Filter user activity type"><option value="All">All Activity Types</option>{historyTypes.map((type) => <option key={type}>{type}</option>)}</select>
              <label>From <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} /></label><label>To <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} /></label>
              <button type="button" className="pu-secondary" onClick={() => { setHistorySearch(""); setHistoryRoleFilter("All"); setHistoryTypeFilter("All"); setHistoryFrom(""); setHistoryTo(""); }}><RotateCcw size={15} /> Reset</button>
            </div>

            <div className="pu-table-wrap">
              <table className="pu-table">
                <thead>
                  <tr>
                    <th>
                      Date & Time
                    </th>
                    <th>
                      Activity
                    </th>
                    <th>
                      User / Role
                    </th>
                    <th>
                      Description
                    </th>
                    <th>
                      Performed By
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map(
                    (item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="pu-date">
                            <CalendarDays
                              size={15}
                            />

                            {formatDate(
                              item.timestamp
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="pu-history-action">
                            {item.action}
                          </span>
                        </td>

                        <td>
                          {item.userName}
                        </td>

                        <td>
                          {item.details}
                        </td>
                        <td>{item.performedBy || "Super Admin"}</td>
                      </tr>
                    )
                  )}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="pu-empty-cell"
                      >
                        No activities
                        recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* ======================================================
          ADD / EDIT USER MODAL
      ====================================================== */}

      {showForm && (
        <Modal
          title={
            editing !== null
              ? "Edit Platform User"
              : "Add Platform User"
          }
          subtitle="Configure account details and platform access."
          onClose={closeForm}
          wide
        >
          <form onSubmit={saveUser}>
            <h3 className="pu-section-title">
              Personal Information
            </h3>

            <div className="pu-form-grid">
              <label>
                Full Name *
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name:
                        event.target.value
                    })
                  }
                />
              </label>

              <label>
                Email Address *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email:
                        event.target.value
                    })
                  }
                />
              </label>

              <label>
                Mobile Number
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mobile:
                        event.target.value
                    })
                  }
                />
              </label>

              <label>
                Department
                <input
                  value={form.department}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      department:
                        event.target.value
                    })
                  }
                  placeholder="Administration"
                />
              </label>
            </div>

            <h3 className="pu-section-title">
              Account & Access
            </h3>

            <div className="pu-form-grid">
              <label>
                Role *
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role:
                        event.target.value,
                      permissions: null
                    })
                  }
                >
                  {roles.map((role) => (
                    <option
                      key={role.name}
                      value={role.name}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Account Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target.value
                    })
                  }
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Organization
                <input
                  value={
                    form.organization
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      organization:
                        event.target.value
                    })
                  }
                />
              </label>

              <label>
                Tenant Access
                <input
                  value={form.tenant}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      tenant:
                        event.target.value
                    })
                  }
                  placeholder="All Tenants"
                />
              </label>
            </div>

            {formError && (
              <p className="pu-error">
                {formError}
              </p>
            )}

            <div className="pu-actions">
              <button
                type="button"
                className="pu-secondary"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="pu-primary"
              >
                <Save size={16} />

                {editing !== null
                  ? "Update User"
                  : "Save User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================
          VIEW USER MODAL
      ====================================================== */}

      {selectedUser && (
        <Modal
          title="Platform User Profile"
          subtitle="User account and access information."
          onClose={() =>
            setViewId(null)
          }
          wide
        >
          <div className="pu-profile-top">
            <div className="pu-avatar pu-avatar-large">
              {selectedUser.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h3>
                {selectedUser.name}
              </h3>

              <p>
                {selectedUser.email}
              </p>

              <StatusBadge
                status={
                  selectedUser.status
                }
              />
            </div>
          </div>

          <div className="pu-detail-grid">
            {[
              [
                "User ID",
                `PU-${selectedUser.id}`
              ],
              [
                "Role",
                selectedUser.role
              ],
              [
                "Mobile",
                selectedUser.mobile ||
                  "Not provided"
              ],
              [
                "Department",
                selectedUser.department ||
                  "Not assigned"
              ],
              [
                "Organization",
                selectedUser.organization
              ],
              [
                "Tenant Access",
                selectedUser.tenant
              ],
              [
                "Created At",
                formatDate(
                  selectedUser.createdAt
                )
              ],
              [
                "Last Login",
                formatDate(
                  selectedUser.lastLogin
                )
              ]
            ].map(
              ([label, value]) => (
                <div
                  className="pu-detail"
                  key={label}
                >
                  <span>
                    {label}
                  </span>

                  <strong>
                    {value}
                  </strong>
                </div>
              )
            )}
          </div>

          <h3 className="pu-section-title">
            Effective Module Permissions
          </h3>

          <div className="pu-permission-grid">
            {MODULES.map((module) => {
              const allowed =
                getEffectivePermissions(
                  selectedUser
                ).includes(module);

              return (
                <div
                  key={module}
                  className={`pu-permission-item ${
                    allowed
                      ? "allowed"
                      : "denied"
                  }`}
                >
                  {allowed ? (
                    <Check size={15} />
                  ) : (
                    <X size={15} />
                  )}

                  {module}
                </div>
              );
            })}
          </div>

          <div className="pu-actions">
            <button
              type="button"
              className="pu-secondary"
              onClick={() =>
                setViewId(null)
              }
            >
              Close
            </button>

            <button
              type="button"
              className="pu-primary"
              onClick={() =>
                editUser(selectedUser)
              }
            >
              <Pencil size={16} />
              Edit User
            </button>
          </div>
        </Modal>
      )}

      {/* ======================================================
          USER PERMISSIONS MODAL
      ====================================================== */}

      {permissionUser && (
        <Modal
          title={`Manage Permissions — ${permissionUser.name}`}
          subtitle="Override or restore role-based module permissions."
          onClose={() =>
            setPermissionUserId(null)
          }
          wide
        >
          <div className="pu-permission-info">
            <ShieldCheck size={18} />

            <div>
              <strong>
                {permissionUser.role}
              </strong>

              <p>
                {Array.isArray(
                  permissionUser.permissions
                )
                  ? "Custom user permissions are enabled."
                  : "Permissions inherited from assigned role."}
              </p>
            </div>
          </div>

          <div className="pu-permission-grid">
            {MODULES.map((module) => (
              <label
                key={module}
                className="pu-permission-choice"
              >
                <input
                  type="checkbox"
                  checked={getEffectivePermissions(
                    permissionUser
                  ).includes(module)}
                  onChange={() =>
                    toggleUserPermission(
                      module
                    )
                  }
                />

                {module}
              </label>
            ))}
          </div>

          <div className="pu-actions">
            <button
              type="button"
              className="pu-secondary"
              onClick={
                resetUserPermissions
              }
            >
              <RotateCcw size={16} />
              Reset to Role
            </button>

            <button
              type="button"
              className="pu-primary"
              onClick={() =>
                setPermissionUserId(null)
              }
            >
              <Check size={16} />
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* ======================================================
          ROLE PERMISSIONS MODAL
      ====================================================== */}

      {editingRole && (
        <Modal
          title={`Edit ${editingRole} Permissions`}
          subtitle="Changes apply to users inheriting this role."
          onClose={() =>
            setEditingRole(null)
          }
          wide
        >
          <div className="pu-permission-grid">
            {MODULES.map((module) => (
              <label
                key={module}
                className="pu-permission-choice"
              >
                <input
                  type="checkbox"
                  checked={rolePermissions.includes(
                    module
                  )}
                  onChange={() =>
                    toggleRolePermission(
                      module
                    )
                  }
                />

                {module}
              </label>
            ))}
          </div>

          <div className="pu-actions">
            <button
              type="button"
              className="pu-secondary"
              onClick={() =>
                setEditingRole(null)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="pu-primary"
              onClick={
                saveRolePermissions
              }
            >
              <Save size={16} />
              Save Permissions
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
