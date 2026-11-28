import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Menu,
  CalendarDays,
  Sun,
  Check,
  UserRound,
  Settings,
  LogOut,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../auth/AuthContext.jsx";
import { useTheme } from "../../../../context/ThemeContext.jsx";
import { DashboardSwitcher } from "../../../../components/DashboardSwitcher.jsx";
import { SUPERADMIN_PAGE_NAMES } from "../../routes";
import { getNotificationDestination } from "../../utils/notificationNavigation";
import { buildSearchRegistry, matchesSearch } from "../../utils/globalSearchRegistry";

const pageNames = SUPERADMIN_PAGE_NAMES;

const demoCompanies = [
  "Acme Technologies",
  "Bluewave Solutions",
  "Nova Systems",
  "Vertex Digital",
  "Cloudbridge Pvt Ltd",
  "Global Systems",
  "Bright Solutions",
];

const readSearchStorage = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const highlightSearchText = (text, query) => {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return text;
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "ig");
  return String(text).split(pattern).map((part, index) =>
    words.some((word) => part.toLowerCase() === word.toLowerCase())
      ? <mark className="topbar-search-match" key={`${part}-${index}`}>{part}</mark>
      : part
  );
};

const initialNotifications = [
  {
    id: "notification-1",
    type: "subscriptionRenewal",
    relatedModule: "Subscription Details",
    targetSubmodule: "Overview",
    filterType: "focus",
    filterValue: "expiring",
    title: "Subscription renewal approaching",
    detail: "Bluewave Solutions renews in 2 days.",
    time: "15 minutes ago",
    read: false,
    relatedRecordId: "SUB-002",
  },
  {
    id: "notification-2",
    type: "organizationReview",
    relatedModule: "Tenant Management",
    targetSubmodule: "Overview",
    filterType: "status",
    filterValue: "Pending",
    title: "New organization awaiting review",
    detail: "Cloudbridge Pvt Ltd submitted a registration request.",
    time: "1 hour ago",
    read: false,
    relatedRecordId: "Cloudbridge Pvt Ltd",
  },
  {
    id: "notification-3",
    type: "monitoringResolved",
    relatedModule: "Monitoring",
    targetSubmodule: "Incidents & Alerts",
    filterType: "status",
    filterValue: "Resolved",
    title: "Monitoring alert resolved",
    detail: "Payroll API response time is back within target.",
    time: "Yesterday",
    read: true,
    relatedRecordId: "INC-1003",
  },
  {
    id: "notification-4",
    type: "supportTicket",
    relatedModule: "Support Management",
    targetSubmodule: "Support Tickets",
    filterType: "status",
    filterValue: "Open",
    title: "New support ticket",
    detail: "ABC Technologies opened a priority support ticket.",
    time: "2 hours ago",
    read: true,
    relatedRecordId: "TKT-001",
  },
  {
    id: "notification-5",
    type: "invoiceOverdue",
    relatedModule: "Billing",
    targetSubmodule: "Invoices",
    filterType: "status",
    filterValue: "Overdue",
    title: "Invoice overdue",
    detail: "Global Systems invoice INV-003 is overdue.",
    time: "3 hours ago",
    read: true,
    relatedRecordId: "INV-003",
  },
  {
    id: "notification-6",
    type: "paymentReceived",
    relatedModule: "Billing",
    targetSubmodule: "Invoices",
    filterType: "status",
    filterValue: "Paid",
    title: "Payment received",
    detail: "ABC Technologies paid invoice INV-001.",
    time: "Yesterday",
    read: true,
    relatedRecordId: "INV-001",
  },
  {
    id: "notification-7",
    type: "securityAlert",
    relatedModule: "Security & Audit Logs",
    targetSubmodule: "Security Alerts",
    filterType: "tab",
    filterValue: "alerts",
    title: "Security alert detected",
    detail: "A high-severity security event requires review.",
    time: "Yesterday",
    read: true,
    relatedRecordId: "Unauthorized Access Attempt",
  },
  {
    id: "notification-8",
    type: "platformUserCreated",
    relatedModule: "Platform Users",
    targetSubmodule: "All Users",
    filterType: "status",
    filterValue: "Active",
    title: "Platform user created",
    detail: "A new platform user was added successfully.",
    time: "Yesterday",
    read: true,
    relatedRecordId: "Admin One",
  },
  {
    id: "notification-9",
    type: "licenseActivationPending",
    relatedModule: "Tenant Management",
    targetSubmodule: "Company Activation",
    filterType: "status",
    filterValue: "Awaiting Activation",
    title: "License activation pending",
    detail: "Cloudbridge Pvt Ltd is awaiting license activation.",
    time: "2 days ago",
    read: true,
    relatedRecordId: "Cloudbridge Pvt Ltd",
  },
  {
    id: "notification-10",
    type: "moduleAccessChanged",
    relatedModule: "Module Management",
    targetSubmodule: "Activity History",
    filterType: "activity",
    filterValue: "Tenant Access Enabled",
    title: "Module access changed",
    detail: "Employee Management access was updated.",
    time: "2 days ago",
    read: true,
    relatedRecordId: "Acme Technologies",
  },
  {
    id: "notification-11",
    type: "subscriptionRenewal",
    relatedModule: "Subscription Details",
    targetSubmodule: "Overview",
    filterType: "focus",
    filterValue: "expiring",
    title: "New renewal reminder",
    detail: "Bluewave Solutions subscription renewal needs attention.",
    time: "Just now",
    read: false,
    relatedRecordId: "SUB-002",
  },
];

function readNotifications() {
  const normalize = (item) => ({
    ...item,
    notificationId: item.notificationId || item.id,
    description: item.description || item.detail,
    timestamp: item.timestamp || item.time,
    relatedRecordId: item.relatedRecordId || null,
    read: Boolean(item.read),
  });

  try {
    const saved = localStorage.getItem("superAdminNotifications");
    const parsed = saved ? JSON.parse(saved) : null;
    if (!Array.isArray(parsed)) return initialNotifications.map(normalize);
    const savedById = new Map(parsed.map((item) => [item.id, item]));
    return initialNotifications.map((item) => normalize({ ...item, ...savedById.get(item.id) }));
  } catch {
    return initialNotifications.map(normalize);
  }
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const pageName = pageNames[location.pathname] || "Super Admin";
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const [firstName, setFirstName] = useState(() => {
    const authFirst = authUser?.name ? authUser.name.trim().split(/\s+/)[0] : "";
    if (authFirst) return authFirst;
    try {
      return localStorage.getItem("superAdminFirstName") || "Admin";
    } catch {
      return "Admin";
    }
  });
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [popover, setPopover] = useState("");
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [theme, setTheme] = useState(() => {
    if (globalTheme === "light") return "light";
    try {
      return localStorage.getItem("superAdminTheme") || "monsoon";
    } catch {
      return "monsoon";
    }
  });
  const [notifications, setNotifications] = useState(readNotifications);
  const searchRef = useRef(null);
  const topbarRef = useRef(null);
  const companyNames = useMemo(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("hrms.superadmin.tenants.v1") || "[]"
      );
      const names = Array.isArray(saved)
        ? saved.map((tenant) => tenant.name).filter(Boolean)
        : [];
      return [...new Set([...demoCompanies, ...names])];
    } catch {
      return demoCompanies;
    }
  }, []);

  useEffect(() => {
    if (globalTheme === "light" && theme !== "light") {
      setTheme("light");
    } else if (globalTheme === "dark" && theme === "light") {
      setTheme("monsoon");
    }
  }, [globalTheme]);

  useEffect(() => {
    const rootEl = topbarRef.current?.closest('.mod-superadmin');
    if (rootEl) {
      rootEl.setAttribute('data-theme', theme);
    }
    try {
      localStorage.setItem("superAdminTheme", theme);
    } catch {
      // The selected theme remains active for the current page.
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "superAdminNotifications",
        JSON.stringify(notifications)
      );
    } catch {
      // Notification state remains available for the current page.
    }
  }, [notifications]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const closePopovers = (event) => {
      if (!topbarRef.current?.contains(event.target)) {
        setPopover("");
        setSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", closePopovers);
    return () => document.removeEventListener("pointerdown", closePopovers);
  }, []);

  useEffect(() => {
    const updateName = () => {
      try {
        setFirstName(localStorage.getItem("superAdminFirstName") || "Admin");
      } catch {
        setFirstName("Admin");
      }
    };

    window.addEventListener("superAdminProfileUpdated", updateName);
    return () => window.removeEventListener("superAdminProfileUpdated", updateName);
  }, []);

  const searchResults = useMemo(() => {
    const term = search.trim();
    if (!term) return [];

    const pages = buildSearchRegistry().filter((item) =>
      matchesSearch(item, term)
    );
    const companies = companyNames
      .map((name) => ({
        id: `company-${name}`,
        label: name,
        path: `/super-admin/organizations?search=${encodeURIComponent(name)}`,
        kind: "Company",
        searchText: name,
      }));
    const tenants = readSearchStorage("hrms.superadmin.tenants.v1").map((tenant) => ({
      id: `tenant-${tenant.id || tenant.name}`,
      label: tenant.name || tenant.id || "Tenant",
      path: `/super-admin/tenants?search=${encodeURIComponent(tenant.name || tenant.id || "")}`,
      kind: "Tenant",
      searchText: `${tenant.name || ""} ${tenant.id || ""} ${tenant.licenseKey || tenant.license?.key || ""}`,
    }));

    let users = [];
    let tickets = [];
    try {
      const savedUsers = JSON.parse(
        localStorage.getItem("hrms.superadmin.platformusers.v2") || "[]"
      );
      users = Array.isArray(savedUsers)
        ? savedUsers
            .map((user) => ({
              id: `user-${user.id}`,
              label: `${user.name || user.email} · ${user.role || "Platform user"}`,
              path: `/super-admin/platform-users?search=${encodeURIComponent(user.name || user.email || "")}`,
              kind: "Platform User",
              searchText: `${user.name || ""} ${user.email || ""} ${user.role || ""}`,
            }))
        : [];
      const savedTickets = JSON.parse(
        localStorage.getItem("hrms_super_admin_support_v2") || "[]"
      );
      tickets = Array.isArray(savedTickets)
        ? savedTickets
            .map((ticket) => ({
              id: `ticket-${ticket.id}`,
              label: `${ticket.id}: ${ticket.subject}`,
              path: `/super-admin/support?search=${encodeURIComponent(ticket.subject || ticket.id)}`,
              kind: "Support Ticket",
              searchText: `${ticket.subject || ""} ${ticket.company || ""} ${ticket.id || ""}`,
            }))
        : [];
    } catch {
      users = [];
      tickets = [];
    }

    const invoices = readSearchStorage("hrms.superadmin.billing.invoices.v1").map((invoice) => ({
      id: `invoice-${invoice.id}`,
      label: invoice.id,
      path: `/super-admin/billing?tab=invoices&search=${encodeURIComponent(invoice.id || "")}`,
      kind: "Invoice",
      searchText: `${invoice.id || ""} ${invoice.company || ""} ${invoice.status || ""}`,
    }));
    const plans = readSearchStorage("hrms.superadmin.plans.v2").map((plan) => ({
      id: `plan-${plan.id}`,
      label: plan.name,
      path: `/super-admin/plans?tab=plans&search=${encodeURIComponent(plan.name || "")}`,
      kind: "Subscription Plan",
      searchText: `${plan.name || ""} ${plan.tier || ""}`,
    }));
    const dynamicRecords = [...companies, ...tenants, ...users, ...tickets, ...invoices, ...plans]
      .filter((item) => matchesSearch(item, term));
    return [...pages, ...dynamicRecords].slice(0, 10);
  }, [companyNames, search]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const newNotifications = notifications.filter((item) => !item.read);

  const toggleNotification = (notification) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
    setPopover("");
    navigate(getNotificationDestination(notification));
  };

  return (
    <header className="topbar" ref={topbarRef}>
      <div className="topbar-left">
        <button className="mobile-menu-button" onClick={onMenuClick}>
          <Menu size={21} />
        </button>

        <div className="breadcrumb">
          <span>Super Admin</span>
          <span className="breadcrumb-separator">/</span>
          <strong>{pageName}</strong>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search-wrap">
          <button
            type="button"
            className="topbar-icon-button topbar-search-trigger"
            title="Search pages and companies"
            aria-label="Search pages and companies"
            aria-expanded={searchOpen}
            onClick={() => {
              setPopover("");
              setSearchOpen((open) => !open);
            }}
          >
            <Search size={19} />
          </button>

          {searchOpen && (
            <div className="topbar-popover topbar-search-popover">
              <div className="topbar-search">
                <Search size={17} />
                <input
                  ref={searchRef}
                  autoFocus
                  type="search"
                  placeholder="Search pages, companies..."
                  aria-label="Search pages and companies"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchOpen(false);
                    if (event.key === "Enter" && searchResults[0]) {
                      navigate(searchResults[0].path);
                      setSearch("");
                      setSearchOpen(false);
                    }
                  }}
                />
              </div>
              {search.trim() ? (
                <div className="topbar-search-results" role="listbox">
                  {searchResults.length ? searchResults.map((item) => (
                    <button
                      type="button"
                      role="option"
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setSearch("");
                        setSearchOpen(false);
                      }}
                    >
                      <span>{highlightSearchText(item.label, search)}</span>
                      <small>{item.parent ? `${item.kind} · ${item.parent}` : item.kind}</small>
                    </button>
                  )) : (
                    <p className="topbar-empty">No matching pages or companies.</p>
                  )}
                </div>
              ) : (
                <p className="topbar-empty">Search pages, companies and records.</p>
              )}
            </div>
          )}
        </div>

        <div className="topbar-action-wrap topbar-theme-wrap">
          <button
            type="button"
            className="topbar-icon-button"
            title="Choose theme"
            aria-label="Choose theme"
            aria-expanded={popover === "theme"}
            onClick={() => {
              setSearchOpen(false);
              setPopover(popover === "theme" ? "" : "theme");
            }}
          >
            <Sun size={19} />
          </button>
          {popover === "theme" && (
            <div className="topbar-popover topbar-menu">
              <span className="topbar-menu-heading">Appearance</span>
              {[
                ["monsoon", "Monsoon Glass"],
                ["dark", "Dark"],
                ["light", "Light"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setGlobalTheme(value === "light" ? "light" : "dark");
                    setPopover("");
                  }}
                >
                  <span>{label}</span>
                  {theme === value && <Check size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="topbar-date" aria-label={`Today is ${dateLabel}`}>
          <CalendarDays size={15} />
          <span>{dateLabel}</span>
        </div>

        <div className="topbar-action-wrap topbar-notification-wrap">
          <button
            type="button"
            className="topbar-icon-button notification-button"
            title="Notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={popover === "notifications"}
            onClick={() => {
              setSearchOpen(false);
              setPopover(popover === "notifications" ? "" : "notifications");
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="notification-count" aria-label={`${unreadCount} new notifications`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {popover === "notifications" && (
            <div className="topbar-popover topbar-notifications">
              <div className="topbar-notifications-heading">
                <strong>Notifications</strong>
              </div>
              {newNotifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`topbar-notification ${item.read ? "is-read" : ""}`}
                  onClick={() => toggleNotification(item)}
                >
                  <span className="topbar-notification-title">
                    {!item.read && <i />}
                    {item.title}
                  </span>
                  <span>{item.detail}</span>
                  <small>{item.time}</small>
                </button>
              ))}
              {!newNotifications.length && (
                <p className="topbar-empty">You’re all caught up.</p>
              )}
            </div>
          )}
        </div>

        <div className="topbar-switcher-wrap">
          <DashboardSwitcher />
        </div>

        <div className="topbar-divider" />

        <button
          type="button"
          className="profile-menu"
          aria-expanded={popover === "profile"}
          onClick={() => {
            setSearchOpen(false);
            setPopover(popover === "profile" ? "" : "profile");
          }}
        >
          <div className="profile-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-text">
            <strong>{firstName}</strong>
            <span>{authUser?.designation || "Super Administrator"}</span>
          </div>

          <ChevronDown size={16} />
        </button>
        {popover === "profile" && (
          <div className="topbar-popover topbar-menu topbar-profile-menu">
            <button type="button" onClick={() => { navigate("/super-admin/settings/profile"); setPopover(""); }}>
              <UserRound size={15} />
              Profile settings
            </button>
            <button type="button" onClick={() => { navigate("/super-admin/settings"); setPopover(""); }}>
              <Settings size={15} />
              General settings
            </button>
            <button
              type="button"
              onClick={() => {
                setPopover("");
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
