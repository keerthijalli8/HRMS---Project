import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive, ArrowLeft, ArrowUpDown, CalendarClock, ChevronLeft, ChevronRight,
  CircleAlert, Eye, Pencil, RotateCcw, Search, Send, Trash2, Users, X,
} from "lucide-react";
import { readAdminProfile } from "../services/adminProfile";
import { readEmployeeRecords } from "../services/employeeRecords";
import {
  CATEGORIES, PRIORITIES, getAnnouncementStatus, getAudienceEmployees,
  getEngagement, publishAnnouncement, readAnnouncements, saveAnnouncements,
} from "../services/announcements";
import "../style/Announcements.css";

const PAGE_CONFIG = {
  total: {
    title: "Total Announcements",
    description: "All announcements created in the system.",
    dateField: "createdAt",
    columns: [
      ["Announcement ID", "id"], ["Announcement Title", "title"], ["Category", "category"],
      ["Priority", "priority"], ["Target Audience", "audience"], ["Created By", "createdBy"],
      ["Created Date", "createdAt"], ["Publish Date", "publishAt"], ["Expiry Date", "expiresAt"],
      ["Total Recipients", "total"], ["Read Count", "reads"], ["Acknowledgement Count", "acknowledgements"],
      ["Status", "status"],
    ],
  },
  published: {
    title: "Published Announcements",
    description: "Announcements that are currently published and have not expired.",
    status: "Published",
    dateField: "publishAt",
    columns: [
      ["Announcement ID", "id"], ["Title", "title"], ["Category", "category"], ["Priority", "priority"],
      ["Target Audience", "audience"], ["Published By", "publishedBy"], ["Published Date", "publishAt"],
      ["Expiry Date", "expiresAt"], ["Total Recipients", "total"], ["Read Count", "reads"],
      ["Unread Count", "unread"], ["Acknowledged Count", "acknowledgements"], ["Status", "status"],
    ],
  },
  scheduled: {
    title: "Scheduled Announcements",
    description: "Announcements set to publish at a future date and time.",
    status: "Scheduled",
    dateField: "publishAt",
    columns: [
      ["Announcement ID", "id"], ["Title", "title"], ["Category", "category"], ["Priority", "priority"],
      ["Target Audience", "audience"], ["Created By", "createdBy"], ["Scheduled Date", "publishAt"],
      ["Scheduled Time", "publishTime"], ["Expiry Date", "expiresAt"], ["Status", "status"],
    ],
  },
  drafts: {
    title: "Draft Announcements",
    description: "Unpublished announcements saved as drafts.",
    status: "Draft",
    dateField: "createdAt",
    columns: [
      ["Announcement ID", "id"], ["Title", "title"], ["Category", "category"], ["Priority", "priority"],
      ["Target Audience", "audience"], ["Created By", "createdBy"], ["Created Date", "createdAt"],
      ["Last Updated", "updatedAt"], ["Status", "status"],
    ],
  },
  expired: {
    title: "Expired Announcements",
    description: "Published announcements whose expiry date has passed.",
    status: "Expired",
    dateField: "expiresAt",
    columns: [
      ["Announcement ID", "id"], ["Title", "title"], ["Category", "category"], ["Priority", "priority"],
      ["Target Audience", "audience"], ["Published By", "publishedBy"], ["Published Date", "publishAt"],
      ["Expiry Date", "expiresAt"], ["Total Recipients", "total"], ["Read Count", "reads"], ["Status", "status"],
    ],
  },
  archived: {
    title: "Archived Announcements",
    description: "Announcements that have been moved to the archive.",
    status: "Archived",
    dateField: "archivedAt",
    columns: [
      ["Announcement ID", "id"], ["Title", "title"], ["Category", "category"], ["Priority", "priority"],
      ["Target Audience", "audience"], ["Created By", "createdBy"], ["Published Date", "publishAt"],
      ["Archived Date", "archivedAt"], ["Archived By", "archivedBy"], ["Status", "status"],
    ],
  },
};

const formatDate = (value, includeTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(date);
};

function audienceLabel(announcement) {
  const { type, values = [] } = announcement.audience || {};
  const labels = {
    all: "All employees",
    departments: "Departments",
    roles: "Roles",
    designations: "Designations",
    projects: "Projects",
    employees: "Selected employees",
  };
  if (type === "all" || !type) return labels.all;
  return `${labels[type] || "Selected audience"}: ${values.join(", ") || "None"}`;
}

function announcementDate(announcement, field) {
  return announcement[field] || (field === "createdAt" ? announcement.publishAt : "");
}

function getColumnValue(announcement, key, status, engagement) {
  switch (key) {
    case "audience": return audienceLabel(announcement);
    case "createdBy": return announcement.createdBy || "Admin";
    case "publishedBy": return announcement.publishedBy || announcement.createdBy || "Admin";
    case "archivedBy": return announcement.archivedBy || "—";
    case "createdAt": return formatDate(announcement.createdAt);
    case "publishAt": return formatDate(announcement.publishAt);
    case "publishTime": return formatTime(announcement.publishAt);
    case "expiresAt": return formatDate(announcement.expiresAt);
    case "updatedAt": return formatDate(announcement.updatedAt || announcement.createdAt);
    case "archivedAt": return formatDate(announcement.archivedAt);
    case "total": return engagement.total;
    case "reads": return engagement.reads;
    case "unread": return engagement.unread;
    case "acknowledgements": return engagement.acknowledgements;
    case "status": return status;
    default: return announcement[key] || "—";
  }
}

function sortableValue(announcement, key, status, engagement) {
  if (key === "updatedAt") return announcement.updatedAt || announcement.createdAt || "";
  if (key === "publishTime") return announcement.publishAt || "";
  if (["createdAt", "publishAt", "expiresAt", "updatedAt", "archivedAt"].includes(key)) {
    return announcement[key] || "";
  }
  return getColumnValue(announcement, key, status, engagement);
}

export default function AnnouncementKpiRecords({ type }) {
  const navigate = useNavigate();
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.total;
  const [announcements, setAnnouncements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [department, setDepartment] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const refresh = () => {
      setLoading(true);
      try {
        setAnnouncements(readAnnouncements());
        setEmployees(readEmployeeRecords());
        setError("");
      } catch (loadError) {
        setError(loadError.message || "Announcements could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    refresh();
    window.addEventListener("hrms-announcements-updated", refresh);
    window.addEventListener("hrms-employees-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("hrms-announcements-updated", refresh);
      window.removeEventListener("hrms-employees-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements
      .filter((announcement) => {
        const status = getAnnouncementStatus(announcement);
        if (config.status && status !== config.status) return false;
        const searchable = [
          announcement.id, announcement.title, announcement.shortDescription, announcement.category,
          announcement.createdBy, announcement.publishedBy, announcement.archivedBy,
          audienceLabel(announcement),
        ].join(" ").toLowerCase();
        if (query && !searchable.includes(query)) return false;
        if (category && announcement.category !== category) return false;
        if (priority && announcement.priority !== priority) return false;
        if (department && !(
          announcement.recipients?.some((recipient) => recipient.department === department)
          || getAudienceEmployees(announcement.audience, employees).some((employee) => employee.department === department)
        )) return false;
        const date = announcementDate(announcement, config.dateField)?.slice(0, 10) || "";
        return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
      })
      .sort((left, right) => {
        const leftStatus = getAnnouncementStatus(left);
        const rightStatus = getAnnouncementStatus(right);
        const leftValue = sortableValue(left, sort.key, leftStatus, getEngagement(left));
        const rightValue = sortableValue(right, sort.key, rightStatus, getEngagement(right));
        const comparison = String(leftValue ?? "").localeCompare(String(rightValue ?? ""), undefined, { numeric: true });
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [announcements, category, config.dateField, config.status, department, employees, fromDate, priority, search, sort, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const persist = (nextAnnouncements) => {
    try {
      saveAnnouncements(nextAnnouncements);
      setAnnouncements(nextAnnouncements);
      setError("");
      return true;
    } catch (saveError) {
      setError(saveError.message || "The announcement could not be saved.");
      return false;
    }
  };

  const update = (announcement, updater) => persist(announcements.map((record) => (
    record.id === announcement.id ? updater(record) : record
  )));
  const openDetails = (announcement) => navigate(`/admin/announcements/${announcement.id}`);
  const edit = (announcement) => navigate(`/admin/announcements/${announcement.id}/edit`);
  const openReport = (announcement) => navigate(`/admin/announcements/${announcement.id}/report`);
  const publish = (announcement) => {
    const published = publishAnnouncement({
      ...announcement,
      publishedBy: readAdminProfile().name,
      publishAt: new Date().toISOString(),
    });
    update(announcement, () => published);
  };
  const archive = (announcement) => update(announcement, (record) => ({
    ...record,
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: readAdminProfile().name,
  }));
  const restore = (announcement) => update(announcement, (record) => ({
    ...record,
    archived: false,
    archivedAt: "",
    archivedBy: "",
  }));
  const cancelSchedule = (announcement) => update(announcement, (record) => ({
    ...record,
    status: "Draft",
    publishAt: "",
    updatedAt: new Date().toISOString(),
  }));
  const deleteDraft = (announcement) => {
    if (!window.confirm(`Delete draft "${announcement.title}"? This cannot be undone.`)) return;
    persist(announcements.filter((record) => record.id !== announcement.id));
  };
  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const actionsFor = (announcement) => {
    const actions = [
      { label: "View Details", icon: Eye, run: () => openDetails(announcement) },
    ];
    if (type === "scheduled") {
      actions.push(
        { label: "Edit", icon: Pencil, run: () => edit(announcement) },
        { label: "Reschedule", icon: CalendarClock, run: () => edit(announcement) },
        { label: "Cancel Schedule", icon: X, run: () => cancelSchedule(announcement) },
      );
    } else if (type === "drafts") {
      actions.push(
        { label: "Edit", icon: Pencil, run: () => edit(announcement) },
        { label: "Preview", icon: Eye, run: () => openDetails(announcement) },
        { label: "Publish", icon: Send, run: () => publish(announcement) },
        { label: "Delete Draft", icon: Trash2, run: () => deleteDraft(announcement), danger: true },
      );
    } else if (type === "expired") {
      actions.push(
        { label: "View Reports", icon: Users, run: () => openReport(announcement) },
        { label: "Archive", icon: Archive, run: () => archive(announcement) },
      );
    } else if (type === "archived") {
      actions.push(
        { label: "Restore", icon: RotateCcw, run: () => restore(announcement) },
        { label: "View Reports", icon: Users, run: () => openReport(announcement) },
      );
    } else {
      actions.push(
        { label: "Edit", icon: Pencil, run: () => edit(announcement) },
        { label: "View Reports", icon: Users, run: () => openReport(announcement) },
        getAnnouncementStatus(announcement) === "Archived"
          ? { label: "Restore", icon: RotateCcw, run: () => restore(announcement) }
          : { label: "Archive", icon: Archive, run: () => archive(announcement) },
      );
    }
    return actions;
  };

  return (
    <div className="announcement-page ann-records-page">
      <PageHeader title={config.title} subtitle={config.description}>
        <button type="button" className="ann-button ann-button-secondary" onClick={() => navigate("/admin/announcements")}>
          <ArrowLeft size={16} /> Back to Announcements
        </button>
      </PageHeader>
      {error && <div className="ann-error" role="alert"><CircleAlert size={17} />{error}</div>}
      <section className="ann-panel ann-list-panel">
        <div className="ann-list-heading">
          <div><h2>{config.title}</h2><p>{filtered.length} record{filtered.length === 1 ? "" : "s"}</p></div>
          <span className="ann-record-count" aria-live="polite">Total records: {filtered.length}</span>
        </div>
        <div className="ann-filter-grid ann-record-filters">
          <label className="ann-search"><Search size={16} /><input value={search} onChange={handleFilterChange(setSearch)} placeholder="Search title, ID or description..." aria-label="Search announcements" /></label>
          <select aria-label="Filter by category" value={category} onChange={handleFilterChange(setCategory)}><option value="">All categories</option>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select aria-label="Filter by priority" value={priority} onChange={handleFilterChange(setPriority)}><option value="">All priorities</option>{PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select aria-label="Filter by department" value={department} onChange={handleFilterChange(setDepartment)}><option value="">All departments</option>{[...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort().map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label className="ann-date-filter"><span>Date from</span><input type="date" aria-label="Date from" value={fromDate} onChange={handleFilterChange(setFromDate)} /></label>
          <label className="ann-date-filter"><span>Date to</span><input type="date" aria-label="Date to" value={toDate} onChange={handleFilterChange(setToDate)} /></label>
        </div>
        <div className="ann-table-wrap">
          {loading ? (
            <div className="ann-record-loading" role="status">Loading announcements…</div>
          ) : !error && !visible.length ? (
            <div className="ann-empty"><CircleAlert size={25} /><strong>No announcements found</strong><span>Try changing the search or filters.</span></div>
          ) : !error ? (
            <table className="ann-table ann-record-table">
              <thead><tr>
                {config.columns.map(([label, key]) => (
                  <th key={`${label}-${key}`}>
                    <button type="button" className="ann-sort-button" onClick={() => setSort((old) => ({
                      key,
                      direction: old.key === key && old.direction === "asc" ? "desc" : "asc",
                    }))}>{label}<ArrowUpDown size={12} /></button>
                  </th>
                ))}
                <th>Actions</th>
              </tr></thead>
              <tbody>{visible.map((announcement) => {
                const status = getAnnouncementStatus(announcement);
                const engagement = getEngagement(announcement);
                return <tr key={announcement.id}>
                  {config.columns.map(([label, key]) => (
                    <td key={`${announcement.id}-${key}-${label}`}>
                      {key === "title" ? (
                        <><button type="button" className="ann-title-link" onClick={() => openDetails(announcement)}>{announcement.title}</button><small>{announcement.shortDescription}</small></>
                      ) : key === "priority" ? (
                        <span className={`ann-priority ann-priority-${(announcement.priority || "normal").toLowerCase()}`}>{announcement.priority || "Normal"}</span>
                      ) : key === "status" ? (
                        <StatusBadge status={status} />
                      ) : getColumnValue(announcement, key, status, engagement)}
                    </td>
                  ))}
                  <td><div className="ann-record-actions">{actionsFor(announcement).map(({ label, icon: Icon, run, danger }) => (
                    <button type="button" key={label} className={danger ? "is-danger" : ""} onClick={run} aria-label={`${label}: ${announcement.title}`} title={label}>
                      <Icon size={14} /><span>{label}</span>
                    </button>
                  ))}</div></td>
                </tr>;
              })}</tbody>
            </table>
          ) : null}
        </div>
        {!loading && !error && <div className="ann-pagination">
          <span>Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span>
          <div><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
            <span>Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
          </div>
        </div>}
      </section>
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return <div className="ann-page-header"><div><div className="ann-eyebrow">HRMS / COMMUNICATIONS</div><h1>{title}</h1><p>{subtitle}</p></div><div className="ann-header-actions">{children}</div></div>;
}

function StatusBadge({ status }) {
  return <span className={`ann-status ann-status-${status.toLowerCase()}`}><i />{status}</span>;
}
