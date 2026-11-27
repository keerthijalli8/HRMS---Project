
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Headphones,
  History,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  ShieldAlert,
  Ticket,
  UserCheck,
  Users,
  X
} from "lucide-react";
import "./Support.css";
import { notifySaveSuccess } from "../../utils/saveNavigation";

const STORAGE_KEY = "hrms_super_admin_support_v2";

const ORGANIZATIONS = [
  "ABC Technologies",
  "XYZ Solutions",
  "Global Systems",
  "Bright Solutions"
];

const AGENTS = [
  "Unassigned",
  "Support Agent 1",
  "Support Agent 2",
  "Support Agent 3",
  "Support Lead"
];

const CATEGORIES = [
  "Login & Authentication",
  "Billing",
  "Payroll",
  "Attendance",
  "Module Access",
  "Subscription",
  "Technical",
  "Other"
];

const STATUSES = [
  "Open",
  "In Progress",
  "Pending",
  "Resolved",
  "Closed"
];

const PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical"
];

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tickets", label: "Support Tickets", icon: Ticket },
  { id: "create", label: "Create Ticket", icon: Plus },
  { id: "tenants", label: "Tenant Issues", icon: Building2 },
  { id: "assignment", label: "Ticket Assignment", icon: UserCheck },
  { id: "escalations", label: "Escalations", icon: ShieldAlert },
  { id: "sla", label: "SLA Tracking", icon: CalendarClock },
  { id: "history", label: "Support History", icon: History },
  { id: "reports", label: "Reports", icon: BarChart3 }
];

const initialTickets = [
  {
    id: "TKT-001",
    subject: "Login issue",
    company: "ABC Technologies",
    category: "Login & Authentication",
    description: "Users are unable to sign in to their accounts.",
    priority: "High",
    status: "Open",
    assignedTo: "Unassigned",
    createdAt: "2026-11-23T09:30:00",
    updatedAt: "2026-11-23T09:30:00",
    escalationLevel: "None",
    escalationReason: "",
    history: [
      {
        date: "2026-11-23T09:30:00",
        action: "Ticket created",
        details: "Login issue reported"
      }
    ]
  },
  {
    id: "TKT-002",
    subject: "Billing clarification",
    company: "XYZ Solutions",
    category: "Billing",
    description: "Customer requested clarification on the monthly invoice.",
    priority: "Medium",
    status: "Pending",
    assignedTo: "Support Agent 1",
    createdAt: "2026-11-22T11:15:00",
    updatedAt: "2026-11-22T13:20:00",
    escalationLevel: "None",
    escalationReason: "",
    history: [
      {
        date: "2026-11-22T11:15:00",
        action: "Ticket created",
        details: "Billing clarification requested"
      },
      {
        date: "2026-11-22T13:20:00",
        action: "Status updated",
        details: "Ticket moved to Pending"
      }
    ]
  },
  {
    id: "TKT-003",
    subject: "Module access",
    company: "Global Systems",
    category: "Module Access",
    description: "Employee management module permissions need review.",
    priority: "Low",
    status: "Resolved",
    assignedTo: "Support Agent 2",
    createdAt: "2026-11-21T10:00:00",
    updatedAt: "2026-11-21T15:30:00",
    escalationLevel: "None",
    escalationReason: "",
    history: [
      {
        date: "2026-11-21T10:00:00",
        action: "Ticket created",
        details: "Module access issue reported"
      },
      {
        date: "2026-11-21T15:30:00",
        action: "Status updated",
        details: "Ticket resolved"
      }
    ]
  },
  {
    id: "TKT-004",
    subject: "Payroll calculation mismatch",
    company: "Bright Solutions",
    category: "Payroll",
    description: "Salary calculation does not match expected deductions.",
    priority: "Critical",
    status: "In Progress",
    assignedTo: "Support Lead",
    createdAt: "2026-11-23T08:00:00",
    updatedAt: "2026-11-23T09:00:00",
    escalationLevel: "Level 2",
    escalationReason: "Payroll processing is affected",
    history: [
      {
        date: "2026-11-23T08:00:00",
        action: "Ticket created",
        details: "Payroll calculation issue"
      },
      {
        date: "2026-11-23T09:00:00",
        action: "Escalation updated",
        details: "Escalated to Level 2"
      }
    ]
  }
];

const emptyForm = {
  subject: "",
  company: "",
  category: "Technical",
  description: "",
  priority: "Medium",
  assignedTo: "Unassigned"
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
};

const isCompleted = (ticket) =>
  ["Resolved", "Closed"].includes(ticket.status);

const getSLAHours = (priority) => {
  const limits = {
    Critical: 4,
    High: 8,
    Medium: 24,
    Low: 48
  };
  return limits[priority] || 24;
};

const getSLA = (ticket, now) => {
  const created = new Date(ticket.createdAt).getTime();

  if (!Number.isFinite(created)) {
    return { label: "Unknown", breached: false, hours: 0 };
  }

  const deadline = created + getSLAHours(ticket.priority) * 3600000;
  const updated = new Date(ticket.updatedAt).getTime();
  const end = isCompleted(ticket) && Number.isFinite(updated)
    ? updated
    : now;

  const breached = end > deadline;
  const hours = Math.max(0, (deadline - now) / 3600000);

  return {
    label: breached
      ? "Breached"
      : isCompleted(ticket)
      ? "Met"
      : hours <= 2
      ? "At Risk"
      : "Within SLA",
    breached,
    hours,
    deadline
  };
};

function downloadCSV(filename, headers, rows) {
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
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`sup-stat-card ${tone}`}
      onClick={onClick}
    >
      <div className="sup-stat-top">
        <span>{title}</span>
        <span className="sup-stat-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </Tag>
  );
}

function Panel({ title, subtitle, icon: Icon, action, children }) {
  return (
    <section className="sup-panel">
      <div className="sup-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="sup-panel-actions">
          {action}
          {Icon && <Icon size={19} />}
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`sup-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`sup-priority ${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
}

function TicketTable({
  rows,
  onView,
  onEdit,
  onStatus,
  onAssign,
  showAssignment = false,
  showSLA = false,
  now
}) {
  return (
    <div className="sup-table-wrap">
      <table className="sup-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Subject</th>
            <th>Organization</th>
            <th>Priority</th>
            <th>Status</th>
            {showAssignment && <th>Assigned To</th>}
            {showSLA && <th>SLA Status</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ticket) => (
            <tr key={ticket.id}>
              <td><strong>{ticket.id}</strong></td>
              <td>{ticket.subject}</td>
              <td>{ticket.company}</td>
              <td><PriorityBadge priority={ticket.priority} /></td>
              <td>
                <select
                  value={ticket.status}
                  onChange={(e) => onStatus(ticket.id, e.target.value)}
                  aria-label={`Status for ${ticket.id}`}
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </td>
              {showAssignment && (
                <td>
                  <select
                    value={ticket.assignedTo}
                    onChange={(e) => onAssign(ticket.id, e.target.value)}
                    aria-label={`Assign ${ticket.id}`}
                  >
                    {AGENTS.map((agent) => (
                      <option key={agent}>{agent}</option>
                    ))}
                  </select>
                </td>
              )}
              {showSLA && (
                <td>
                  <StatusBadge status={getSLA(ticket, now).label} />
                </td>
              )}
              <td>
                <div className="sup-row-actions">
                  <button
                    className="sup-view"
                    type="button"
                    onClick={() => onView(ticket)}
                  >
                    <Eye size={15} /> View
                  </button>
                  <button
                    className="sup-view"
                    type="button"
                    onClick={() => onEdit(ticket)}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                className="sup-empty"
                colSpan={6 + Number(showAssignment) + Number(showSLA)}
              >
                No tickets found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Support() {
  const [searchParams] = useSearchParams();
  const requestedSearch = searchParams.get("search") || "";
  const requestedTab = searchParams.get("tab");
  const requestedStatus = searchParams.get("status");
  const [tickets, setTickets] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return initialTickets;

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : initialTickets;
    } catch {
      return initialTickets;
    }
  });

  const [tab, setTab] = useState(requestedTab || (requestedSearch ? "tickets" : "overview"));
  const [search, setSearch] = useState(requestedSearch);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [tenantFilter, setTenantFilter] = useState("All");
  const [specialFilter, setSpecialFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEscalation, setShowEscalation] = useState(null);
  const [escalationForm, setEscalationForm] = useState({
    level: "Level 1",
    reason: ""
  });
  const [now, setNow] = useState(() => Date.now());
  const [historySearch, setHistorySearch] = useState("");
  const [historyCompany, setHistoryCompany] = useState("All");
  const [historyAction, setHistoryAction] = useState("All");
  const [historyStart, setHistoryStart] = useState("");
  const [historyEnd, setHistoryEnd] = useState("");
  const [reportCategory, setReportCategory] = useState("Support Tickets");
  const [reportCompany, setReportCompany] = useState("All");
  const [reportStatus, setReportStatus] = useState("All");
  const [reportPriority, setReportPriority] = useState("All");
  const [reportTicketCategory, setReportTicketCategory] = useState("All");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setTab(searchParams.get("tab") || (query ? "tickets" : "overview"));
    setSearch(query);
    setStatusFilter(["Open", "In Progress", "Pending", "Resolved", "Closed"].includes(requestedStatus) ? requestedStatus : "All");
    setPage(1);
  }, [searchParams, requestedStatus]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {
      // Browser storage may be unavailable.
    }
  }, [tickets]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  const metrics = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    progress: tickets.filter((t) => t.status === "In Progress").length,
    pending: tickets.filter((t) => t.status === "Pending").length,
    resolved: tickets.filter(isCompleted).length,
    critical: tickets.filter((t) => t.priority === "Critical" && !isCompleted(t)).length,
    escalated: tickets.filter((t) => t.escalationLevel !== "None" && !isCompleted(t)).length,
    breached: tickets.filter((t) => getSLA(t, now).breached).length
  }), [tickets, now]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) =>
      `${ticket.id} ${ticket.subject} ${ticket.company} ${ticket.category}`
        .toLowerCase()
        .includes(query) &&
      (statusFilter === "All" ||
        (statusFilter === "Completed" ? isCompleted(ticket) : ticket.status === statusFilter)) &&
      (priorityFilter === "All" || ticket.priority === priorityFilter) &&
      (tenantFilter === "All" || ticket.company === tenantFilter) &&
      (specialFilter === "All" ||
        (specialFilter === "SLA Breaches" && getSLA(ticket, now).breached) ||
        (specialFilter === "Escalated" && ticket.escalationLevel !== "None" && !isCompleted(ticket)))
    );
  }, [tickets, search, statusFilter, priorityFilter, tenantFilter, specialFilter, now]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const historyEvents = useMemo(() => {
    return tickets.flatMap((ticket) =>
      (ticket.history || []).map((event) => ({
        ...event,
        ticketId: ticket.id,
        company: ticket.company
      }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tickets]);

  const filteredHistoryEvents = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return historyEvents.filter((event) => {
      const date = event.date.slice(0, 10);
      return (
        (!query ||
          `${event.ticketId} ${event.company} ${event.action} ${event.details}`.toLowerCase().includes(query)) &&
        (historyCompany === "All" || event.company === historyCompany) &&
        (historyAction === "All" || event.action === historyAction) &&
        (!historyStart || date >= historyStart) &&
        (!historyEnd || date <= historyEnd)
      );
    });
  }, [historyEvents, historySearch, historyCompany, historyAction, historyStart, historyEnd]);

  const reportTickets = useMemo(() => tickets.filter((ticket) => {
    const date = String(ticket.createdAt || "").slice(0, 10);
    return (
      (reportCompany === "All" || ticket.company === reportCompany) &&
      (reportStatus === "All" ||
        (reportStatus === "Completed" ? isCompleted(ticket) : ticket.status === reportStatus)) &&
      (reportPriority === "All" || ticket.priority === reportPriority) &&
      (reportTicketCategory === "All" || ticket.category === reportTicketCategory) &&
      (!reportStart || date >= reportStart) &&
      (!reportEnd || date <= reportEnd)
    );
  }), [tickets, reportCompany, reportStatus, reportPriority, reportTicketCategory, reportStart, reportEnd]);

  const reportHistory = useMemo(() => {
    const ids = new Set(reportTickets.map((ticket) => ticket.id));
    return historyEvents.filter((event) => {
      const date = String(event.date || "").slice(0, 10);
      return ids.has(event.ticketId) &&
        (!reportStart || date >= reportStart) &&
        (!reportEnd || date <= reportEnd);
    });
  }, [historyEvents, reportTickets, reportStart, reportEnd]);

  const openTab = (next) => {
    setTab(next);
    setPage(1);
  };

  const applyTicketFilter = ({
    status = "All",
    priority = "All",
    tenant = "All",
    special = "All"
  } = {}) => {
    setSearch("");
    setStatusFilter(status);
    setPriorityFilter(priority);
    setTenantFilter(tenant);
    setSpecialFilter(special);
    openTab("tickets");
    notifySaveSuccess("Support ticket saved successfully.");
  };

  const addHistory = (ticket, action, details) => {
    const date = new Date().toISOString();

    return {
      ...ticket,
      updatedAt: date,
      history: [
        ...(ticket.history || []),
        { date, action, details }
      ]
    };
  };

  const updateTicket = (id, changes, action, details) => {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === id
          ? addHistory({ ...ticket, ...changes }, action, details)
          : ticket
      )
    );
  };

  const updateStatus = (id, status) => {
    updateTicket(id, { status }, "Status updated", `Status changed to ${status}`);
  };

  const updateAssignment = (id, assignedTo) => {
    updateTicket(
      id,
      { assignedTo },
      "Ticket assigned",
      `Assigned to ${assignedTo}`
    );
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (ticket) => {
    setEditingId(ticket.id);
    setForm({
      subject: ticket.subject,
      company: ticket.company,
      category: ticket.category,
      description: ticket.description,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo
    });
    setShowForm(true);
  };

  const saveTicket = (event) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.company.trim()) return;

    if (editingId) {
      updateTicket(
        editingId,
        {
          ...form,
          subject: form.subject.trim(),
          company: form.company.trim()
        },
        "Ticket edited",
        "Ticket information updated"
      );
    } else {
      const nextId = Math.max(
        0,
        ...tickets.map((ticket) =>
          Number(ticket.id.replace(/\D/g, "")) || 0
        )
      ) + 1;

      const date = new Date().toISOString();

      const ticket = {
        id: `TKT-${String(nextId).padStart(3, "0")}`,
        ...form,
        subject: form.subject.trim(),
        company: form.company.trim(),
        status: "Open",
        escalationLevel: "None",
        escalationReason: "",
        createdAt: date,
        updatedAt: date,
        history: [
          {
            date,
            action: "Ticket created",
            details: "New support request submitted"
          }
        ]
      };

      setTickets((previous) => [ticket, ...previous]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    openTab("tickets");
  };

  const saveEscalation = (event) => {
    event.preventDefault();

    if (!showEscalation) return;

    updateTicket(
      showEscalation,
      {
        escalationLevel: escalationForm.level,
        escalationReason: escalationForm.reason
      },
      "Escalation updated",
      `${escalationForm.level}: ${escalationForm.reason || "No reason specified"}`
    );

    setShowEscalation(null);
    notifySaveSuccess("Ticket escalation updated successfully.");
  };

  const exportTickets = (rows = filtered, filename = "support-tickets.csv") => {
    downloadCSV(
      filename,
      [
        "Ticket ID",
        "Subject",
        "Organization",
        "Category",
        "Priority",
        "Status",
        "Assigned To",
        "Escalation",
        "Created At",
        "Updated At"
      ],
      rows.map((ticket) => [
        ticket.id,
        ticket.subject,
        ticket.company,
        ticket.category,
        ticket.priority,
        ticket.status,
        ticket.assignedTo,
        ticket.escalationLevel,
        formatDate(ticket.createdAt),
        formatDate(ticket.updatedAt)
      ])
    );
  };

  const exportHistory = () => {
    downloadCSV(
      "support-history.csv",
      ["Date", "Ticket ID", "Organization", "Action", "Details"],
      filteredHistoryEvents.map((event) => [
        formatDate(event.date),
        event.ticketId,
        event.company,
        event.action,
        event.details
      ])
    );
  };

  const exportReport = () => {
    if (reportCategory === "Support History") {
      downloadCSV(
        "support-history-report.csv",
        ["Date", "Ticket ID", "Organization", "Action", "Details"],
        reportHistory.map((event) => [
          formatDate(event.date), event.ticketId, event.company, event.action, event.details
        ])
      );
      return;
    }

    const filename = reportCategory === "Tenant Issues"
      ? "tenant-issues-report.csv"
      : "support-tickets-report.csv";
    exportTickets(reportTickets, filename);
  };

  const filters = (
    <div className="sup-toolbar">
      <div className="sup-search">
        <Search size={17} />
        <input
          placeholder="Search tickets or tenants..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
      >
        <option value="All">All Statuses</option>
        {STATUSES.map((status) => (
          <option key={status}>{status}</option>
        ))}
        <option value="Completed">Resolved / Closed</option>
      </select>

      <select
        value={priorityFilter}
        onChange={(e) => {
          setPriorityFilter(e.target.value);
          setPage(1);
        }}
      >
        <option value="All">All Priorities</option>
        {PRIORITIES.map((priority) => (
          <option key={priority}>{priority}</option>
        ))}
      </select>

      <select
        value={tenantFilter}
        onChange={(e) => {
          setTenantFilter(e.target.value);
          setPage(1);
        }}
      >
        <option value="All">All Tenants</option>
        {[...new Set(tickets.map((t) => t.company))].map((company) => (
          <option key={company}>{company}</option>
        ))}
      </select>

      <select
        value={specialFilter}
        onChange={(e) => {
          setSpecialFilter(e.target.value);
          setPage(1);
        }}
        aria-label="Filter by special status"
      >
        <option value="All">All Ticket Types</option>
        <option value="SLA Breaches">SLA Breaches</option>
        <option value="Escalated">Escalated</option>
      </select>

      <button
        className="sup-secondary"
        type="button"
        onClick={() => {
          setSearch("");
          setStatusFilter("All");
          setPriorityFilter("All");
          setTenantFilter("All");
          setSpecialFilter("All");
          setPage(1);
        }}
      >
        Reset
      </button>
    </div>
  );

  const pagination = (
    <div className="sup-pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <div>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );

  const ticketList = (rows, options = {}) => (
    <TicketTable
      rows={rows}
      onView={(ticket) => setSelectedId(ticket.id)}
      onEdit={startEdit}
      onStatus={updateStatus}
      onAssign={updateAssignment}
      showAssignment={options.assignment}
      showSLA={options.sla}
      now={now}
    />
  );

  return (
    <div className="sup-page">
      <div className="sup-header">
        <div>
          <div className="sup-eyebrow">
            SUPER ADMIN / CUSTOMER OPERATIONS
          </div>
          <h1>Support Management</h1>
          <p>Customer support cases and tenant issue tracking.</p>
        </div>

        <button className="sup-primary" type="button" onClick={startCreate}>
          <Plus size={17} /> Create Ticket
        </button>
      </div>

      <div className="sup-tabs" role="tablist" aria-label="Support sections">
        {TABS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`sa-pill-kpi ${tab === item.id ? "active" : ""}`}
              onClick={() => {
                if (item.id === "create") {
                  startCreate();
                } else {
                  openTab(item.id);
                }
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Support Overview</h2>
              <p>Platform-wide support activity and issue resolution</p>
            </div>
          </div>

          <div className="sup-stats">
            <StatCard title="Total Tickets" value={metrics.total} subtitle="All support cases" icon={Ticket} onClick={() => applyTicketFilter()} />
            <StatCard title="Open Tickets" value={metrics.open} subtitle="Awaiting action" icon={AlertCircle} tone="amber" onClick={() => applyTicketFilter({ status: "Open" })} />
            <StatCard title="In Progress" value={metrics.progress} subtitle="Currently being handled" icon={Clock3} onClick={() => applyTicketFilter({ status: "In Progress" })} />
            <StatCard title="Resolved / Closed" value={metrics.resolved} subtitle="Completed support cases" icon={CheckCircle2} tone="green" onClick={() => applyTicketFilter({ status: "Completed" })} />
            <StatCard title="Critical Tickets" value={metrics.critical} subtitle="Unresolved critical issues" icon={ShieldAlert} tone="red" onClick={() => applyTicketFilter({ priority: "Critical" })} />
            <StatCard title="SLA Breaches" value={metrics.breached} subtitle="Based on configured demo deadlines" icon={AlertTriangle} tone="amber" onClick={() => applyTicketFilter({ special: "SLA Breaches" })} />
          </div>

          <div className="sup-grid-two">
            <Panel title="Ticket Status Distribution" subtitle="Cases by current status" icon={BarChart3}>
              {STATUSES.map((status) => {
                const count = tickets.filter((t) => t.status === status).length;

                return (
                  <button
                    className="sup-progress-row"
                    type="button"
                    key={status}
                    onClick={() => applyTicketFilter({ status })}
                  >
                    <div>
                      <span>{status}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="sup-progress-track">
                      <div style={{ width: `${metrics.total ? (count / metrics.total) * 100 : 0}%` }} />
                    </div>
                  </button>
                );
              })}
            </Panel>

            <Panel title="Priority Distribution" subtitle="Support workload by priority" icon={Activity}>
              {PRIORITIES.map((priority) => {
                const count = tickets.filter((t) => t.priority === priority).length;

                return (
                  <button
                    className="sup-progress-row"
                    type="button"
                    key={priority}
                    onClick={() => applyTicketFilter({ priority })}
                  >
                    <div>
                      <span>{priority}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="sup-progress-track">
                      <div style={{ width: `${metrics.total ? (count / metrics.total) * 100 : 0}%` }} />
                    </div>
                  </button>
                );
              })}
            </Panel>
          </div>

          <Panel
            title="Recent Support Tickets"
            subtitle="Latest customer support requests"
            icon={Ticket}
            action={
              <button className="sup-link" onClick={() => openTab("tickets")}>
                View All <ArrowUpRight size={15} />
              </button>
            }
          >
            {ticketList(
              [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
            )}
          </Panel>

          <div className="sup-grid-two">
            <Panel title="Tenant Issue Summary" subtitle="Cases reported by organization" icon={Building2}>
              {[...new Set(tickets.map((t) => t.company))].map((company) => {
                const count = tickets.filter((t) => t.company === company).length;

                return (
                  <button
                    className="sup-summary-row"
                    type="button"
                    key={company}
                    onClick={() => applyTicketFilter({ tenant: company })}
                  >
                    <span>{company}</span>
                    <strong>{count} tickets</strong>
                  </button>
                );
              })}
            </Panel>

            <Panel title="Recent Support Activity" subtitle="Latest ticket updates" icon={History}>
              <div className="sup-events">
                {historyEvents.slice(0, 5).map((event, index) => (
                  <div className="sup-event" key={`${event.ticketId}-${index}`}>
                    <span className="sup-event-icon"><Activity size={16} /></span>
                    <div>
                      <strong>{event.action}</strong>
                      <p>{event.ticketId} · {event.company}</p>
                      <small>{formatDate(event.date)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === "tickets" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Support Tickets</h2>
              <p>Search, update and manage customer support cases</p>
            </div>
            <button className="sup-secondary" onClick={() => exportTickets()}>
              <Download size={16} /> Export CSV
            </button>
          </div>

          <Panel title="All Support Tickets" subtitle={`${filtered.length} matching tickets`} icon={Filter}>
            {filters}
            {ticketList(paginated, { assignment: true })}
            {pagination}
          </Panel>
        </>
      )}

      {tab === "tenants" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Tenant Issues</h2>
              <p>Organization-wise support cases and affected modules</p>
            </div>
          </div>

          <div className="sup-stats sup-stats-three">
            <StatCard title="Organizations" value={new Set(tickets.map((t) => t.company)).size} subtitle="Tenants with support cases" icon={Building2} />
            <StatCard title="Unresolved Issues" value={tickets.filter((t) => !isCompleted(t)).length} subtitle="Open, pending and in progress" icon={AlertCircle} />
            <StatCard title="Resolved Issues" value={metrics.resolved} subtitle="Completed cases" icon={CheckCircle2} tone="green" />
          </div>

          <Panel title="Tenant Issue Tracking" subtitle="Filter issues by organization" icon={Building2}>
            {filters}
            {ticketList(paginated, { assignment: true })}
            {pagination}
          </Panel>
        </>
      )}

      {tab === "assignment" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Ticket Assignment</h2>
              <p>Assign and reassign cases to support agents</p>
            </div>
          </div>

          <div className="sup-stats sup-stats-three">
            <StatCard title="Assigned Tickets" value={tickets.filter((t) => t.assignedTo !== "Unassigned").length} subtitle="Cases with assigned agents" icon={UserCheck} />
            <StatCard title="Unassigned Tickets" value={tickets.filter((t) => t.assignedTo === "Unassigned").length} subtitle="Require assignment" icon={Users} tone="amber" />
            <StatCard title="Support Agents" value={AGENTS.length - 1} subtitle="Available agent options" icon={Headphones} />
          </div>

          <Panel title="Manage Assignments" subtitle="Select an agent to update ownership" icon={UserCheck}>
            {filters}
            {ticketList(paginated, { assignment: true })}
            {pagination}
          </Panel>
        </>
      )}

      {tab === "escalations" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Escalations</h2>
              <p>Track critical issues and escalated support cases</p>
            </div>
          </div>

          <div className="sup-stats sup-stats-three">
            <StatCard title="Escalated Tickets" value={metrics.escalated} subtitle="Active escalations" icon={ShieldAlert} tone="red" />
            <StatCard title="Critical Issues" value={metrics.critical} subtitle="Unresolved critical tickets" icon={AlertTriangle} tone="amber" />
            <StatCard title="SLA Breaches" value={metrics.breached} subtitle="Cases outside configured deadlines" icon={Clock3} />
          </div>

          <Panel title="Escalation Queue" subtitle="Critical, high-priority and escalated cases" icon={ShieldAlert}>
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Organization</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Escalation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.filter((t) =>
                    !isCompleted(t) &&
                    (["Critical", "High"].includes(t.priority) || t.escalationLevel !== "None")
                  ).map((ticket) => (
                    <tr key={ticket.id}>
                      <td><strong>{ticket.id}</strong><div className="sup-cell-sub">{ticket.subject}</div></td>
                      <td>{ticket.company}</td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td>{ticket.escalationLevel}</td>
                      <td>
                        <button
                          className="sup-small-button"
                          onClick={() => {
                            setShowEscalation(ticket.id);
                            setEscalationForm({
                              level: ticket.escalationLevel === "None" ? "Level 1" : ticket.escalationLevel,
                              reason: ticket.escalationReason || ""
                            });
                          }}
                        >
                          Escalate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {tab === "sla" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>SLA Tracking</h2>
              <p>Monitor resolution deadlines and overdue tickets</p>
            </div>
          </div>

          <div className="sup-stats sup-stats-three">
            <StatCard title="Total Tickets" value={metrics.total} subtitle="Tracked support cases" icon={Ticket} />
            <StatCard title="SLA Breaches" value={metrics.breached} subtitle="Exceeded resolution target" icon={AlertTriangle} tone="red" />
            <StatCard title="Within SLA" value={tickets.filter((t) => !getSLA(t, now).breached).length} subtitle="Met or within target" icon={CheckCircle2} tone="green" />
          </div>

          <Panel title="Resolution SLA Targets" subtitle="Illustrative targets based on priority" icon={CalendarClock}>
            <div className="sup-sla-grid">
              {PRIORITIES.map((priority) => (
                <div key={priority}>
                  <PriorityBadge priority={priority} />
                  <strong>{getSLAHours(priority)} hours</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ticket SLA Status" subtitle="Calculated from creation time and priority" icon={Clock3}>
            {ticketList(tickets, { sla: true })}
          </Panel>
        </>
      )}

      {tab === "history" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Support History</h2>
              <p>Ticket creation, status changes and assignment activity</p>
            </div>
            <button className="sup-secondary" onClick={exportHistory}>
              <Download size={16} /> Export History
            </button>
          </div>

          <Panel title="Ticket Activity History" subtitle={`${filteredHistoryEvents.length} matching events`} icon={History}>
            <div className="sup-toolbar sup-history-filters">
              <div className="sup-search">
                <Search size={17} />
                <input
                  aria-label="Search support history"
                  placeholder="Search events, tickets, or organizations..."
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                />
              </div>
              <select
                value={historyCompany}
                aria-label="Filter support history by organization"
                onChange={(event) => setHistoryCompany(event.target.value)}
              >
                <option value="All">All Organizations</option>
                {[...new Set(tickets.map((ticket) => ticket.company))].map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
              <select
                value={historyAction}
                aria-label="Filter support history by action"
                onChange={(event) => setHistoryAction(event.target.value)}
              >
                <option value="All">All Activities</option>
                {[...new Set(historyEvents.map((event) => event.action))].map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Support history start date"
                value={historyStart}
                onChange={(event) => setHistoryStart(event.target.value)}
              />
              <input
                type="date"
                aria-label="Support history end date"
                value={historyEnd}
                onChange={(event) => setHistoryEnd(event.target.value)}
              />
              <button
                className="sup-secondary"
                type="button"
                onClick={() => {
                  setHistorySearch("");
                  setHistoryCompany("All");
                  setHistoryAction("All");
                  setHistoryStart("");
                  setHistoryEnd("");
                }}
              >
                Reset
              </button>
            </div>
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Ticket ID</th>
                    <th>Organization</th>
                    <th>Activity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryEvents.map((event, index) => (
                    <tr key={`${event.ticketId}-${index}`}>
                      <td>{formatDate(event.date)}</td>
                      <td>{event.ticketId}</td>
                      <td>{event.company}</td>
                      <td>{event.action}</td>
                      <td>{event.details}</td>
                    </tr>
                  ))}
                  {!filteredHistoryEvents.length && (
                    <tr>
                      <td className="sup-empty" colSpan={5}>No support history matches these filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {tab === "reports" && (
        <>
          <div className="sup-section-heading">
            <div>
              <h2>Support Reports</h2>
              <p>Support case summaries and downloadable records</p>
            </div>
          </div>

          <div className="sup-stats sup-stats-three">
            <StatCard title="Total Cases" value={metrics.total} subtitle="All support requests" icon={Ticket} />
            <StatCard title="Resolved Cases" value={metrics.resolved} subtitle="Resolved and closed" icon={CheckCircle2} tone="green" />
            <StatCard title="Resolution Rate" value={`${metrics.total ? ((metrics.resolved / metrics.total) * 100).toFixed(1) : 0}%`} subtitle="Completed ticket percentage" icon={BarChart3} />
          </div>

          <Panel title="Support Report Builder" subtitle="Choose the report, configure filters, preview the matching records, then export them." icon={FileText}>
            <div className="sup-report-filters">
              <label>
                Report
                <select aria-label="Support report category" value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}>
                  <option>Support Tickets</option>
                  <option>Tenant Issues</option>
                  <option>Support History</option>
                </select>
              </label>
              <label>
                Organization
                <select aria-label="Support report organization" value={reportCompany} onChange={(event) => setReportCompany(event.target.value)}>
                  <option value="All">All Organizations</option>
                  {[...new Set(tickets.map((ticket) => ticket.company))].sort().map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </label>
              <label>
                Ticket Category
                <select aria-label="Support report ticket category" value={reportTicketCategory} onChange={(event) => setReportTicketCategory(event.target.value)}>
                  <option value="All">All Categories</option>
                  {[...new Set(tickets.map((ticket) => ticket.category))].sort().map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select aria-label="Support report status" value={reportStatus} onChange={(event) => setReportStatus(event.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  {STATUSES.filter((status) => !["Resolved", "Closed"].includes(status)).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select aria-label="Support report priority" value={reportPriority} onChange={(event) => setReportPriority(event.target.value)}>
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label>
                From
                <input aria-label="Support report start date" type="date" value={reportStart} max={reportEnd || undefined} onChange={(event) => setReportStart(event.target.value)} />
              </label>
              <label>
                To
                <input aria-label="Support report end date" type="date" value={reportEnd} min={reportStart || undefined} onChange={(event) => setReportEnd(event.target.value)} />
              </label>
              <button
                type="button"
                className="sup-secondary"
                onClick={() => {
                  setReportCompany("All");
                  setReportStatus("All");
                  setReportPriority("All");
                  setReportTicketCategory("All");
                  setReportStart("");
                  setReportEnd("");
                }}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="sup-secondary"
                disabled={reportCategory === "Support History" ? !reportHistory.length : !reportTickets.length}
                onClick={exportReport}
              >
                <Download size={16} /> Export Filtered CSV
              </button>
            </div>

            <p className="sup-report-count" aria-live="polite">
              Previewing {reportCategory === "Support History" ? reportHistory.length : reportTickets.length} records
            </p>
            <div className="sup-table-wrap">
              {reportCategory === "Support History" ? (
                <table className="sup-table">
                  <thead><tr><th>Date</th><th>Ticket</th><th>Organization</th><th>Action</th><th>Details</th></tr></thead>
                  <tbody>
                    {reportHistory.map((event) => (
                      <tr key={`${event.ticketId}-${event.date}-${event.action}`}>
                        <td>{formatDate(event.date)}</td><td>{event.ticketId}</td><td>{event.company}</td><td>{event.action}</td><td>{event.details}</td>
                      </tr>
                    ))}
                    {!reportHistory.length && <tr><td className="sup-empty" colSpan={5}>No support history matches these filters.</td></tr>}
                  </tbody>
                </table>
              ) : (
                <table className="sup-table">
                  <thead><tr><th>Ticket</th><th>Subject</th><th>Organization</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Created</th></tr></thead>
                  <tbody>
                    {reportTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.id}</td><td>{ticket.subject}</td><td>{ticket.company}</td><td>{ticket.category}</td><td>{ticket.priority}</td><td>{ticket.status}</td><td>{ticket.assignedTo}</td><td>{formatDate(ticket.createdAt)}</td>
                      </tr>
                    ))}
                    {!reportTickets.length && <tr><td className="sup-empty" colSpan={8}>No support tickets match these filters.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </Panel>
        </>
      )}

      {showForm && (
        <div className="sup-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowForm(false);
        }}>
          <form className="sup-modal sup-modal-wide" onSubmit={saveTicket}>
            <button className="sup-close" type="button" onClick={() => setShowForm(false)} aria-label="Close">
              <X size={20} />
            </button>
            <h2>{editingId ? "Edit Support Ticket" : "Create Support Ticket"}</h2>
            <p className="sup-modal-subtitle">Enter support case information and tenant details.</p>

            <div className="sup-form-grid">
              <label>
                Subject
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Enter ticket subject"
                />
              </label>

              <label>
                Organization
                <input
                  required
                  list="sup-organizations"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Select or enter organization"
                />
                <datalist id="sup-organizations">
                  {ORGANIZATIONS.map((company) => (
                    <option value={company} key={company} />
                  ))}
                </datalist>
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label>
                Assigned To
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                >
                  {AGENTS.map((agent) => (
                    <option key={agent}>{agent}</option>
                  ))}
                </select>
              </label>

              <label className="sup-full-field">
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the support issue..."
                />
              </label>
            </div>

            <div className="sup-actions">
              <button type="button" className="sup-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="sup-primary">
                {editingId ? "Save Changes" : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="sup-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}>
          <div className="sup-modal sup-modal-wide" role="dialog" aria-modal="true" aria-label="Ticket details">
            <button className="sup-close" onClick={() => setSelectedId(null)} aria-label="Close">
              <X size={20} />
            </button>

            <h2>Ticket Details</h2>
            <p className="sup-modal-subtitle">{selected.id} · {selected.company}</p>

            <div className="sup-detail-grid">
              {[
                ["Ticket ID", selected.id],
                ["Subject", selected.subject],
                ["Organization", selected.company],
                ["Category", selected.category],
                ["Priority", selected.priority],
                ["Status", selected.status],
                ["Assigned To", selected.assignedTo],
                ["Escalation", selected.escalationLevel],
                ["Created", formatDate(selected.createdAt)],
                ["Updated", formatDate(selected.updatedAt)]
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="sup-description">
              <strong>Issue Description</strong>
              <p>{selected.description || "No description provided."}</p>
            </div>

            <h3>Ticket Activity</h3>
            <div className="sup-events">
              {[...(selected.history || [])].reverse().map((event, index) => (
                <div className="sup-event" key={index}>
                  <span className="sup-event-icon"><Activity size={16} /></span>
                  <div>
                    <strong>{event.action}</strong>
                    <p>{event.details}</p>
                    <small>{formatDate(event.date)}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="sup-actions">
              <button className="sup-primary" onClick={() => {
                setSelectedId(null);
                startEdit(selected);
              }}>
                <Edit3 size={16} /> Edit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {showEscalation && (
        <div className="sup-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowEscalation(null);
        }}>
          <form className="sup-modal" onSubmit={saveEscalation}>
            <button className="sup-close" type="button" onClick={() => setShowEscalation(null)}>
              <X size={20} />
            </button>
            <h2>Escalate Ticket</h2>
            <p className="sup-modal-subtitle">{showEscalation}</p>

            <label>
              Escalation Level
              <select
                value={escalationForm.level}
                onChange={(e) => setEscalationForm({ ...escalationForm, level: e.target.value })}
              >
                <option>None</option>
                <option>Level 1</option>
                <option>Level 2</option>
                <option>Level 3</option>
              </select>
            </label>

            <label>
              Escalation Reason
              <textarea
                rows={4}
                value={escalationForm.reason}
                onChange={(e) => setEscalationForm({ ...escalationForm, reason: e.target.value })}
                placeholder="Enter escalation reason..."
              />
            </label>

            <div className="sup-actions">
              <button className="sup-secondary" type="button" onClick={() => setShowEscalation(null)}>
                Cancel
              </button>
              <button className="sup-primary" type="submit">
                Save Escalation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
