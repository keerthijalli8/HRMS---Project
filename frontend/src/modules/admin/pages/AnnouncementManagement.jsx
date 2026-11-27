import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Archive, ArrowLeft, ArrowUpDown, Bell, CalendarClock, Check, CheckCheck,
  ChevronLeft, ChevronRight, CircleAlert, ClipboardList, Download, Eye, FilePlus2,
  FileText, Inbox, Megaphone, Pencil, Plus, Search, Send, Trash2, Users, X,
} from "lucide-react";
import { readAdminProfile } from "../services/adminProfile";
import { readEmployeeRecords } from "../services/employeeRecords";
import {
  CATEGORIES, PRIORITIES, createAnnouncementId, getAnnouncementStatus,
  getAudienceEmployees, getDistinctEmployeeValues, getEngagement, publishAnnouncement,
  publishDueAnnouncements, readAnnouncements, saveAnnouncements,
} from "../services/announcements";
import "../style/Announcements.css";

const EMPTY_FORM = {
  title: "",
  shortDescription: "",
  content: "",
  category: CATEGORIES[0],
  priority: "Normal",
  audienceType: "all",
  audienceValues: [],
  requireAcknowledgement: false,
  enableComments: false,
  publishAt: "",
  expiresAt: "",
};

const fmtDate = (value, includeTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(date);
};

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const audienceLabel = (announcement) => {
  const { type, values = [] } = announcement.audience || {};
  const labels = {
    all: "All employees",
    departments: "Departments",
    roles: "Roles",
    designations: "Designations",
    projects: "Projects",
    employees: "Selected employees",
  };
  if (type === "all") return labels.all;
  return `${labels[type] || "Selected audience"}: ${values.join(", ") || "None"}`;
};

const valuesForAudience = (type) => {
  const employees = readEmployeeRecords();
  const property = {
    departments: "department",
    roles: "role",
    designations: "designation",
    projects: "project",
    employees: "id",
  }[type];
  return property ? [...new Set(employees.map((employee) => employee[property]).filter(Boolean))].sort() : [];
};

const loadInitialAnnouncements = () => {
  try {
    return { announcements: publishDueAnnouncements(readAnnouncements()), error: "" };
  } catch (error) {
    return { announcements: [], error: error.message };
  }
};

function AnnouncementForm({ announcement, onSave, onCancel }) {
  const [draftId] = useState(() => announcement?.id || createAnnouncementId());
  const [form, setForm] = useState(() => announcement ? {
    ...EMPTY_FORM,
    title: announcement.title,
    shortDescription: announcement.shortDescription,
    content: announcement.content,
    category: announcement.category,
    priority: announcement.priority,
    audienceType: announcement.audience?.type || "all",
    audienceValues: announcement.audience?.values || [],
    requireAcknowledgement: Boolean(announcement.requireAcknowledgement),
    enableComments: Boolean(announcement.enableComments),
    publishAt: toLocalInput(announcement.publishAt),
    expiresAt: toLocalInput(announcement.expiresAt),
    attachments: announcement.attachments || [],
  } : { ...EMPTY_FORM, attachments: [] });
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const admin = readAdminProfile();
  const audienceOptions = useMemo(() => valuesForAudience(form.audienceType), [form.audienceType]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleAudienceValue = (value) => update(
    "audienceValues",
    form.audienceValues.includes(value)
      ? form.audienceValues.filter((item) => item !== value)
      : [...form.audienceValues, value],
  );

  const addAttachments = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const approvedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt", ".xlsx", ".csv"];
    const invalidFile = files.find((file) => !approvedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension)));
    if (invalidFile) {
      setError(`${invalidFile.name} is not an approved attachment type.`);
      return;
    }
    const totalSize = [...form.attachments, ...files].reduce((sum, file) => sum + (file.size || file.sizeBytes || 0), 0);
    if (totalSize > 2 * 1024 * 1024) {
      setError("Attachments are limited to 2 MB total in this browser-only version.");
      return;
    }
    try {
      const additions = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          name: file.name,
          sizeBytes: file.size,
          type: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
          dataUrl: reader.result,
        });
        reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
        reader.readAsDataURL(file);
      })));
      update("attachments", [...form.attachments, ...additions]);
      setError("");
    } catch (fileError) {
      setError(fileError.message);
    }
  };

  const submit = (action) => {
    if (!form.title.trim() || !form.shortDescription.trim() || !form.content.trim() || !form.category) {
      setError("Title, short description, full content and category are required.");
      return;
    }
    if (form.audienceType !== "all" && !form.audienceValues.length) {
      setError("Select at least one target audience item.");
      return;
    }
    if (action === "schedule") {
      const publishTime = new Date(form.publishAt).getTime();
      if (!form.publishAt || !Number.isFinite(publishTime) || publishTime <= Date.now()) {
        setError("Choose a valid future date and time to schedule this announcement.");
        return;
      }
    }
    if (form.expiresAt && new Date(form.expiresAt).getTime() <= new Date(form.publishAt || Date.now()).getTime()) {
      setError("The expiry date must be later than the publication date.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      onSave({
        ...form,
        id: announcement?.id || draftId,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        content: form.content.trim(),
        audience: { type: form.audienceType, values: form.audienceType === "all" ? [] : form.audienceValues },
        createdBy: announcement?.createdBy || admin.name,
        createdByEmail: announcement?.createdByEmail || admin.email,
        createdAt: announcement?.createdAt || new Date().toISOString(),
        publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : "",
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : "",
        attachments: form.attachments,
      }, action);
    } catch (saveError) {
      setError(saveError.message || "Unable to save the announcement.");
    } finally {
      setBusy(false);
    }
  };

  if (preview) {
    return (
      <div className="announcement-page">
        <div className="announcement-topline">
          <button className="ann-button ann-button-secondary" onClick={() => setPreview(false)}><ArrowLeft size={16} /> Back to editor</button>
        </div>
        <div className="ann-preview">
          <div className="ann-preview-label">EMPLOYEE PREVIEW</div>
          <span className={`ann-priority ann-priority-${form.priority.toLowerCase()}`}>{form.priority}</span>
          <span className="ann-category">{form.category}</span>
          <h1>{form.title || "Announcement title"}</h1>
          <p className="ann-preview-short">{form.shortDescription || "Short description preview"}</p>
          <div className="ann-preview-content">{form.content || "Full announcement content appears here."}</div>
          <div className="ann-preview-footer">
            <span>Audience: {form.audienceType === "all" ? "All Employees" : form.audienceValues.join(", ") || "Not selected"}</span>
            <span>By {announcement?.createdBy || admin.name}</span>
          </div>
          {form.attachments.length > 0 && <AttachmentList attachments={form.attachments} />}
          <button className="ann-button ann-button-primary" disabled><Check size={16} /> Acknowledge preview</button>
        </div>
      </div>
    );
  }

  return (
    <div className="announcement-page">
      <div className="announcement-topline">
        <button className="ann-button ann-button-secondary" onClick={onCancel}><ArrowLeft size={16} /> Back to announcements</button>
        <span className="ann-autofill-note">{announcement?.id || draftId} · Created by {announcement?.createdBy || admin.name} · {fmtDate(announcement?.createdAt || new Date())}</span>
      </div>
      <div className="ann-form-layout">
        <section className="ann-panel">
          <div className="ann-section-heading"><span className="ann-section-icon"><FileText size={17} /></span><div><h2>Basic information</h2><p>Write clear, useful updates for your audience.</p></div></div>
          <label className="ann-field">Announcement title <b>*</b><input value={form.title} maxLength={120} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Office will be closed on Friday" /></label>
          <label className="ann-field">Short description <b>*</b><textarea rows="2" maxLength={240} value={form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} placeholder="A brief summary shown in the announcement feed" /></label>
          <label className="ann-field">Full announcement content <b>*</b><textarea rows="7" value={form.content} onChange={(event) => update("content", event.target.value)} placeholder="Add the complete announcement details..." /></label>
          <div className="ann-form-grid">
            <label className="ann-field">Category <b>*</b><select value={form.category} onChange={(event) => update("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="ann-field">Priority<select value={form.priority} onChange={(event) => update("priority", event.target.value)}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          </div>
          <p className="ann-help">Priority indicator: <span className={`ann-priority ann-priority-${form.priority.toLowerCase()}`}>{form.priority}</span></p>
        </section>

        <section className="ann-panel">
          <div className="ann-section-heading"><span className="ann-section-icon"><Users size={17} /></span><div><h2>Target audience</h2><p>Choose exactly who should receive this announcement.</p></div></div>
          <label className="ann-field">Audience type<select value={form.audienceType} onChange={(event) => update("audienceType", event.target.value)}>
            <option value="all">All Employees</option><option value="departments">Selected Departments</option><option value="roles">Selected Roles</option><option value="designations">Selected Designations</option><option value="projects">Selected Projects</option><option value="employees">Selected Employees</option>
          </select></label>
          {form.audienceType !== "all" && <div className="ann-option-list" role="group" aria-label="Select audience members">
            {audienceOptions.map((option) => <label key={option} className="ann-check-option"><input type="checkbox" checked={form.audienceValues.includes(option)} onChange={() => toggleAudienceValue(option)} /><span>{form.audienceType === "employees" ? `${option} · ${readEmployeeRecords().find((item) => item.id === option)?.name || ""}` : option}</span></label>)}
            {!audienceOptions.length && <span className="ann-muted">No options available.</span>}
          </div>}
          <div className="ann-audience-count"><Users size={16} /> Estimated recipients: <strong>{getAudienceEmployees({ type: form.audienceType, values: form.audienceValues }).length}</strong></div>
          <div className="ann-toggles">
            <label className="ann-toggle"><input type="checkbox" checked={form.requireAcknowledgement} onChange={(event) => update("requireAcknowledgement", event.target.checked)} /><span><strong>Require employee acknowledgement</strong><small>Reading and acknowledgement are tracked separately.</small></span></label>
            <label className="ann-toggle"><input type="checkbox" checked={form.enableComments} onChange={(event) => update("enableComments", event.target.checked)} /><span><strong>Enable employee comments</strong><small>Subject to your company communication policy.</small></span></label>
          </div>
        </section>

        <section className="ann-panel">
          <div className="ann-section-heading"><span className="ann-section-icon"><FilePlus2 size={17} /></span><div><h2>Attachments</h2><p>PDF, DOC/DOCX, JPG/PNG and other files, up to 2 MB total.</p></div></div>
          <label className="ann-upload"><input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.csv" onChange={addAttachments} /><Plus size={17} /> Add attachment</label>
          {form.attachments.length > 0 && <AttachmentList attachments={form.attachments} onRemove={(index) => update("attachments", form.attachments.filter((_, itemIndex) => itemIndex !== index))} />}
        </section>

        <section className="ann-panel">
          <div className="ann-section-heading"><span className="ann-section-icon"><CalendarClock size={17} /></span><div><h2>Publishing information</h2><p>Publish immediately or set a future date and optional expiry.</p></div></div>
          <div className="ann-form-grid">
            <label className="ann-field">Publish date and time<input type="datetime-local" value={form.publishAt} onChange={(event) => update("publishAt", event.target.value)} /><small>Leave blank to publish now.</small></label>
            <label className="ann-field">Expiry date and time<input type="datetime-local" value={form.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} /><small>Optional. Expired announcements stay in history.</small></label>
          </div>
        </section>
      </div>
      {error && <div className="ann-error" role="alert"><CircleAlert size={17} /> {error}</div>}
      <div className="ann-form-actions">
        <button className="ann-button ann-button-secondary" onClick={() => setPreview(true)}><Eye size={16} /> Preview</button>
        <span className="ann-action-spacer" />
        <button className="ann-button ann-button-secondary" disabled={busy} onClick={() => submit("draft")}>Save as Draft</button>
        <button className="ann-button ann-button-secondary" disabled={busy} onClick={() => submit("schedule")}><CalendarClock size={16} /> Schedule</button>
        <button className="ann-button ann-button-primary" disabled={busy} onClick={() => submit("publish")}><Send size={16} /> Publish now</button>
      </div>
    </div>
  );
}

function AttachmentList({ attachments, onRemove }) {
  return <div className="ann-attachments">{attachments.map((attachment, index) => (
    <div className="ann-attachment" key={`${attachment.name}-${index}`}>
      <FileText size={17} /><div><strong>{attachment.name}</strong><small>{(attachment.sizeBytes / 1024).toFixed(0)} KB · added {fmtDate(attachment.uploadedAt)}</small></div>
      {attachment.dataUrl && <a href={attachment.dataUrl} target="_blank" rel="noreferrer" aria-label={`Preview ${attachment.name}`}><Eye size={16} /></a>}
      {attachment.dataUrl && <a href={attachment.dataUrl} download={attachment.name} aria-label={`Download ${attachment.name}`}><Download size={16} /></a>}
      {onRemove && <button type="button" className="ann-icon-button" onClick={() => onRemove(index)} aria-label={`Remove ${attachment.name}`}><X size={15} /></button>}
    </div>
  ))}</div>;
}

function AnnouncementManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const { announcementId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialData] = useState(loadInitialAnnouncements);
  const [announcements, setAnnouncements] = useState(initialData.announcements);
  const [employeeRecords, setEmployeeRecords] = useState(readEmployeeRecords);
  const [error, setError] = useState(initialData.error);
  const search = searchParams.get("q") || "";
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [reportFilter, setReportFilter] = useState("all");
  const pageSize = 8;
  const path = location.pathname;
  const isNew = path.endsWith("/new");
  const isInbox = path.endsWith("/inbox");
  const isReport = path.endsWith("/report");
  const isEdit = path.endsWith("/edit");
  const employeeId = searchParams.get("employeeId") || "";

  useEffect(() => {
    const refreshFromStorage = () => {
      try {
        setAnnouncements(publishDueAnnouncements(readAnnouncements()));
        setEmployeeRecords(readEmployeeRecords());
        setError("");
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    const listener = () => refreshFromStorage();
    const interval = window.setInterval(refreshFromStorage, 30000);
    window.addEventListener("hrms-announcements-updated", listener);
    window.addEventListener("hrms-employees-updated", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("hrms-announcements-updated", listener);
      window.removeEventListener("hrms-employees-updated", listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  const replaceAll = (records) => {
    try {
      saveAnnouncements(records);
      setAnnouncements(records);
      setError("");
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    }
  };
  const current = announcements.find((item) => item.id === announcementId);
  const visibleStatus = searchParams.get("status") || "all";

  const saveForm = (form, action) => {
    const existing = isEdit ? current : null;
    const base = {
      ...existing,
      ...form,
      id: existing?.id || form.id,
      status: existing?.status || "Draft",
      updatedAt: new Date().toISOString(),
      archived: false,
      archivedAt: "",
      archivedBy: "",
      recipients: existing?.recipients || [],
    };
    const result = action === "publish" ? publishAnnouncement({ ...base, publishedBy: readAdminProfile().name, publishAt: new Date().toISOString() }, false)
      : action === "schedule" ? publishAnnouncement(base, true)
        : { ...base, status: "Draft", publishAt: "", archived: false };
    const updated = existing
      ? announcements.map((item) => item.id === existing.id ? result : item)
      : [result, ...announcements];
    try {
      saveAnnouncements(updated);
      setAnnouncements(updated);
      setError("");
      navigate("/admin/announcements");
    } catch (saveError) {
      setError(saveError.message);
      throw saveError;
    }
  };

  const updateAnnouncement = (id, updater) => replaceAll(announcements.map((item) => item.id === id ? updater(item) : item));

  const allStatuses = useMemo(() => announcements.map((item) => getAnnouncementStatus(item)), [announcements]);
  const counts = useMemo(() => ({
    all: announcements.length,
    Published: allStatuses.filter((status) => status === "Published").length,
    Scheduled: allStatuses.filter((status) => status === "Scheduled").length,
    Draft: allStatuses.filter((status) => status === "Draft").length,
    Expired: allStatuses.filter((status) => status === "Expired").length,
    Archived: allStatuses.filter((status) => status === "Archived").length,
  }), [announcements, allStatuses]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";
    const department = searchParams.get("department") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    return announcements.filter((item) => {
      const status = getAnnouncementStatus(item);
      const matchesStatus = visibleStatus === "all" || status.toLowerCase() === visibleStatus.toLowerCase();
      const matchesSearch = !q || [item.id, item.title, item.shortDescription, item.category].join(" ").toLowerCase().includes(q);
      const matchesDept = !department || item.recipients?.some((recipient) => recipient.department === department)
        || getAudienceEmployees(item.audience, employeeRecords).some((employee) => employee.department === department);
      const created = new Date(item.createdAt).toISOString().slice(0, 10);
      return matchesStatus && matchesSearch && (!category || item.category === category)
        && (!priority || item.priority === priority) && matchesDept && (!from || created >= from) && (!to || created <= to);
    }).sort((a, b) => {
      const left = a[sort.key] || "";
      const right = b[sort.key] || "";
      const compare = String(left).localeCompare(String(right), undefined, { numeric: true });
      return sort.direction === "asc" ? compare : -compare;
    });
  }, [announcements, employeeRecords, search, searchParams, sort, visibleStatus]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shown = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    if (key !== "status") next.delete("page");
    setSearchParams(next);
    if (key !== "status") setPage(1);
  };
  const handleSearchChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const editRoute = (item) => navigate(`/admin/announcements/${item.id}/edit`);
  const handleDelete = (item) => {
    if (!window.confirm(`Delete draft "${item.title}"? This cannot be undone.`)) return;
    replaceAll(announcements.filter((record) => record.id !== item.id));
  };
  const duplicate = (item) => {
    const copy = {
      ...item, id: createAnnouncementId(), title: `${item.title} (Copy)`, status: "Draft", archived: false,
      createdBy: readAdminProfile().name, createdAt: new Date().toISOString(), publishAt: "", recipients: [],
    };
    if (replaceAll([copy, ...announcements])) navigate(`/admin/announcements/${copy.id}/edit`);
  };
  const archive = (item) => updateAnnouncement(item.id, (record) => ({
    ...record,
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: readAdminProfile().name,
  }));
  const publish = (item) => {
    const updated = publishAnnouncement({ ...item, publishedBy: readAdminProfile().name, publishAt: new Date().toISOString() }, false);
    updateAnnouncement(item.id, () => updated);
  };
  const unpublish = (item) => updateAnnouncement(item.id, (record) => ({ ...record, status: "Draft", publishAt: "", archived: false }));

  if (isNew || isEdit) {
    if (isEdit && !current) return <PageMessage title="Announcement not found" back={() => navigate("/admin/announcements")} />;
    return <><PageHeader title={isEdit ? "Edit Announcement" : "Create Announcement"} subtitle="Prepare, preview and publish a company announcement." /><AnnouncementForm announcement={current} onSave={saveForm} onCancel={() => navigate("/admin/announcements")} /></>;
  }

  if (isInbox) return <EmployeeInbox announcements={announcements} employees={employeeRecords} navigate={navigate} />;
  if (isReport) return current ? <AnnouncementReport announcement={current} navigate={navigate} filter={reportFilter} setFilter={setReportFilter} /> : <PageMessage title="Announcement not found" back={() => navigate("/admin/announcements")} />;
  if (announcementId && current) return <AnnouncementDetails announcement={current} navigate={navigate} employeeId={employeeId} employees={employeeRecords} updateAnnouncement={updateAnnouncement} />;
  if (announcementId && !current) return <PageMessage title="Announcement not found" back={() => navigate("/admin/announcements")} />;

  const statusLabel = visibleStatus === "all" ? "All announcements" : `${visibleStatus} announcements`;
  return (
    <div className="announcement-page">
      <PageHeader title="Announcement Management" subtitle="Create, publish and manage company announcements.">
        <Link className="ann-button ann-button-primary" to="/admin/announcements/new"><Plus size={17} /> Create Announcement</Link>
      </PageHeader>
      {error && <div className="ann-error" role="alert"><CircleAlert size={17} />{error}</div>}
      <section className="ann-kpi-grid" aria-label="Announcement overview">
        <KpiCard label="Total Announcements" value={counts.all} icon={Megaphone} color="blue" onClick={() => navigate("/admin/announcements/total")} />
        <KpiCard label="Published" value={counts.Published} icon={Send} color="green" onClick={() => navigate("/admin/announcements/published")} />
        <KpiCard label="Scheduled" value={counts.Scheduled} icon={CalendarClock} color="purple" onClick={() => navigate("/admin/announcements/scheduled")} />
        <KpiCard label="Drafts" value={counts.Draft} icon={FileText} color="amber" onClick={() => navigate("/admin/announcements/drafts")} />
        <KpiCard label="Expired" value={counts.Expired} icon={CircleAlert} color="rose" onClick={() => navigate("/admin/announcements/expired")} />
        <KpiCard label="Archived" value={counts.Archived} icon={Archive} color="slate" onClick={() => navigate("/admin/announcements/archived")} />
      </section>
      <section className="ann-panel ann-list-panel">
        <div className="ann-list-heading"><div><h2>{statusLabel}</h2><p>{filtered.length} matching announcement{filtered.length === 1 ? "" : "s"}</p></div><Link className="ann-button ann-button-secondary" to="/admin/announcements/inbox"><Inbox size={16} /> Employee inbox preview</Link></div>
        <div className="ann-filter-grid">
          <label className="ann-search"><Search size={16} /><input value={search} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search title, ID or description..." aria-label="Search announcements" /></label>
          <select aria-label="Filter by category" value={searchParams.get("category") || ""} onChange={(event) => setFilter("category", event.target.value)}><option value="">All categories</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>
          <select aria-label="Filter by priority" value={searchParams.get("priority") || ""} onChange={(event) => setFilter("priority", event.target.value)}><option value="">All priorities</option>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select>
          <select aria-label="Filter by status" value={visibleStatus} onChange={(event) => setFilter("status", event.target.value)}><option value="all">All statuses</option>{["Published", "Scheduled", "Draft", "Expired", "Archived"].map((status) => <option key={status} value={status.toLowerCase()}>{status}</option>)}</select>
          <select aria-label="Filter by department" value={searchParams.get("department") || ""} onChange={(event) => setFilter("department", event.target.value)}><option value="">All departments</option>{getDistinctEmployeeValues("department").map((department) => <option key={department}>{department}</option>)}</select>
          <input type="date" aria-label="Created from date" value={searchParams.get("from") || ""} onChange={(event) => setFilter("from", event.target.value)} />
          <input type="date" aria-label="Created to date" value={searchParams.get("to") || ""} onChange={(event) => setFilter("to", event.target.value)} />
          {(searchParams.has("q") || searchParams.has("category") || searchParams.has("priority") || searchParams.has("department") || searchParams.has("from") || searchParams.has("to") || visibleStatus !== "all") && <button className="ann-clear-filter" onClick={() => setSearchParams({})}>Clear filters</button>}
        </div>
        <div className="ann-table-wrap">
          <table className="ann-table">
            <thead><tr>
              <SortableHeader label="Announcement ID" sortKey="id" setSort={setSort} />
              <SortableHeader label="Title" sortKey="title" setSort={setSort} />
              <th>Category</th><th>Priority</th><th>Target Audience</th><th>Created By</th>
              <SortableHeader label="Created Date" sortKey="createdAt" setSort={setSort} />
              <th>Publish Date</th><th>Expiry Date</th><th>Recipients</th><th>Read</th><th>Acknowledged</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>{shown.map((item) => {
              const status = getAnnouncementStatus(item);
              const engagement = getEngagement(item);
              return <tr key={item.id}>
                <td className="ann-id">{item.id}</td>
                <td><button className="ann-title-link" onClick={() => navigate(`/admin/announcements/${item.id}`)}>{item.title}</button><small>{item.shortDescription}</small></td>
                <td>{item.category}</td><td><span className={`ann-priority ann-priority-${item.priority.toLowerCase()}`}>{item.priority}</span></td>
                <td className="ann-audience-cell">{audienceLabel(item)}</td><td>{item.createdBy || "Admin"}</td>
                <td>{fmtDate(item.createdAt)}</td><td>{fmtDate(item.publishAt, true)}</td><td>{fmtDate(item.expiresAt, true)}</td>
                <td>{engagement.total}</td><td>{engagement.reads}</td><td>{engagement.acknowledgements}</td>
                <td><StatusBadge status={status} /></td>
                <td><div className="ann-row-actions">
                  <button title="View" aria-label={`View ${item.title}`} onClick={() => navigate(`/admin/announcements/${item.id}`)}><Eye size={15} /></button>
                  <button title="Edit" aria-label={`Edit ${item.title}`} onClick={() => editRoute(item)}><Pencil size={15} /></button>
                  {status === "Draft" || status === "Scheduled" ? <button title="Publish now" aria-label={`Publish ${item.title}`} onClick={() => publish(item)}><Send size={15} /></button> : <button title="Unpublish" aria-label={`Unpublish ${item.title}`} onClick={() => unpublish(item)}><X size={15} /></button>}
                  <button title="Duplicate" aria-label={`Duplicate ${item.title}`} onClick={() => duplicate(item)}><ClipboardList size={15} /></button>
                  <button title="View reports" aria-label={`View reports for ${item.title}`} onClick={() => navigate(`/admin/announcements/${item.id}/report`)}><Users size={15} /></button>
                  <button title="Archive" aria-label={`Archive ${item.title}`} onClick={() => archive(item)}><Archive size={15} /></button>
                  {status === "Draft" && <button className="ann-danger-icon" title="Delete draft" aria-label={`Delete ${item.title}`} onClick={() => handleDelete(item)}><Trash2 size={15} /></button>}
                </div></td>
              </tr>;
            })}</tbody>
          </table>
          {!shown.length && <div className="ann-empty"><Megaphone size={25} /><strong>No announcements match these filters</strong><span>Try changing the search or filters, or create an announcement.</span></div>}
        </div>
        <div className="ann-pagination"><span>Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><span>Page {currentPage} of {totalPages}</span><button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
      </section>
      <div className="ann-storage-note"><CircleAlert size={14} /> Browser-only prototype: data is stored in this browser and is not backed by PostgreSQL or protected by server-side role permissions.</div>
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return <div className="ann-page-header"><div><div className="ann-eyebrow">HRMS / COMMUNICATIONS</div><h1>{title}</h1><p>{subtitle}</p></div><div className="ann-header-actions">{children}</div></div>;
}

function KpiCard({ label, value, icon: Icon, color, onClick }) {
  return <button type="button" className={`ann-kpi-card ann-kpi-${color}`} onClick={onClick} aria-label={`View ${label}`}><span className="ann-kpi-icon"><Icon size={19} /></span><span className="ann-kpi-label">{label}</span><strong>{value}</strong><small>View announcements</small></button>;
}

function SortableHeader({ label, sortKey, setSort }) {
  return <th><button className="ann-sort-button" onClick={() => setSort((old) => ({ key: sortKey, direction: old.key === sortKey && old.direction === "asc" ? "desc" : "asc" }))}>{label}<ArrowUpDown size={12} /></button></th>;
}

function StatusBadge({ status }) {
  return <span className={`ann-status ann-status-${status.toLowerCase()}`}><i />{status}</span>;
}

function AnnouncementDetails({ announcement, navigate, employeeId, employees, updateAnnouncement }) {
  const status = getAnnouncementStatus(announcement);
  const engagement = getEngagement(announcement);
  const employee = employees.find((item) => item.id === employeeId);
  const recipient = announcement.recipients?.find((item) => item.employeeId === employeeId);
  useEffect(() => {
    if (!employeeId || !recipient || recipient.readAt) return;
    updateAnnouncement(announcement.id, (current) => ({
      ...current,
      recipients: current.recipients.map((item) => item.employeeId === employeeId ? { ...item, readAt: new Date().toISOString() } : item),
    }));
  }, [announcement.id, employeeId, recipient, updateAnnouncement]);
  const acknowledge = () => updateAnnouncement(announcement.id, (current) => ({
    ...current,
    recipients: current.recipients.map((item) => item.employeeId === employeeId ? { ...item, acknowledgedAt: new Date().toISOString() } : item),
  }));
  return <div className="announcement-page">
    <PageHeader title={employeeId ? "Employee announcement" : "Announcement details"} subtitle={employeeId ? `Viewing as ${employee?.name || employeeId}` : "Full announcement information and engagement summary."}>
      <button className="ann-button ann-button-secondary" onClick={() => navigate(employeeId ? `/admin/announcements/inbox?employeeId=${encodeURIComponent(employeeId)}` : "/admin/announcements")}><ArrowLeft size={16} /> Back</button>
    </PageHeader>
    <div className="ann-detail-grid">
      <article className="ann-panel ann-detail-main">
        <div className="ann-detail-meta"><span className={`ann-priority ann-priority-${announcement.priority.toLowerCase()}`}>{announcement.priority}</span><span className="ann-category">{announcement.category}</span><StatusBadge status={status} /></div>
        <h2>{announcement.title}</h2><p className="ann-detail-short">{announcement.shortDescription}</p>
        <div className="ann-detail-content">{announcement.content}</div>
        <AttachmentList attachments={announcement.attachments || []} />
        {employeeId && announcement.requireAcknowledgement && recipient && <div className="ann-ack-panel">{recipient.acknowledgedAt ? <><CheckCheck size={18} /> Acknowledged on {fmtDate(recipient.acknowledgedAt, true)}</> : <><span>Please confirm that you have read this announcement.</span><button className="ann-button ann-button-primary" onClick={acknowledge}><Check size={16} /> Acknowledge</button></>}</div>}
      </article>
      <aside className="ann-panel ann-detail-side">
        <h3>Announcement information</h3>
        <InfoLine label="Announcement ID" value={announcement.id} /><InfoLine label="Created by" value={announcement.createdBy || "Admin"} />
        <InfoLine label="Created date" value={fmtDate(announcement.createdAt, true)} /><InfoLine label="Published date" value={fmtDate(announcement.publishAt, true)} />
        <InfoLine label="Expiry date" value={fmtDate(announcement.expiresAt, true)} /><InfoLine label="Target audience" value={audienceLabel(announcement)} />
        <InfoLine label="Acknowledgement required" value={announcement.requireAcknowledgement ? "Yes" : "No"} /><InfoLine label="Comments enabled" value={announcement.enableComments ? "Yes" : "No"} />
        <h3 className="ann-detail-stats-heading">Engagement</h3>
        <div className="ann-mini-stats"><span>Total recipients<strong>{engagement.total}</strong></span><span>Read<strong>{engagement.reads}</strong></span><span>Unread<strong>{engagement.unread}</strong></span><span>Acknowledged<strong>{engagement.acknowledgements}</strong></span><span>Pending acknowledgement<strong>{engagement.pendingAcknowledgements}</strong></span></div>
        {employeeId && recipient && <div className="ann-read-note">{recipient.readAt ? `Read ${fmtDate(recipient.readAt, true)}` : "Unread"}{recipient.acknowledgedAt ? ` · Acknowledged ${fmtDate(recipient.acknowledgedAt, true)}` : ""}</div>}
        <button className="ann-button ann-button-secondary ann-full-button" onClick={() => navigate(`/admin/announcements/${announcement.id}/report`)}><Users size={16} /> View recipient report</button>
      </aside>
    </div>
  </div>;
}

function InfoLine({ label, value }) {
  return <div className="ann-info-line"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function AnnouncementReport({ announcement, navigate, filter, setFilter }) {
  const recipients = announcement.recipients || [];
  const engagement = getEngagement(announcement);
  const filtered = recipients.filter((recipient) => {
    if (filter === "delivered") return Boolean(recipient.deliveredAt);
    if (filter === "read") return Boolean(recipient.readAt);
    if (filter === "unread") return !recipient.readAt;
    if (filter === "acknowledged") return Boolean(recipient.acknowledgedAt);
    if (filter === "pending") return announcement.requireAcknowledgement && !recipient.acknowledgedAt;
    return true;
  });
  const byDepartment = Object.entries(recipients.reduce((result, recipient) => {
    const key = recipient.department || "Other";
    result[key] ||= { total: 0, read: 0, acknowledged: 0 };
    result[key].total += 1;
    if (recipient.readAt) result[key].read += 1;
    if (recipient.acknowledgedAt) result[key].acknowledged += 1;
    return result;
  }, {}));
  const exportCsv = () => {
    const rows = [
      ["Employee ID", "Employee Name", "Department", "Designation", "Project", "Delivery Status", "Read Status", "Read Date and Time", "Acknowledgement Status", "Acknowledgement Date and Time"],
      ...filtered.map((recipient) => [recipient.employeeId, recipient.employeeName, recipient.department, recipient.designation, recipient.project, recipient.deliveredAt ? "Delivered" : "Not delivered", recipient.readAt ? "Read" : "Unread", recipient.readAt ? fmtDate(recipient.readAt, true) : "", recipient.acknowledgedAt ? "Acknowledged" : "Pending", recipient.acknowledgedAt ? fmtDate(recipient.acknowledgedAt, true) : ""]),
    ];
    const csv = rows.map((row) => row.map((field) => `"${String(field ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${announcement.id}-recipients.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="announcement-page">
    <PageHeader title="Announcement Report" subtitle={`${announcement.id} · ${announcement.title}`}>
      <button className="ann-button ann-button-secondary" onClick={() => navigate(`/admin/announcements/${announcement.id}`)}><ArrowLeft size={16} /> Announcement details</button>
    </PageHeader>
    <div className="ann-report-kpis">
      <ReportCard label="Total Recipients" value={engagement.total} color="blue" /><ReportCard label="Successfully Delivered" value={engagement.delivered} color="green" />
      <ReportCard label="Read Announcements" value={engagement.reads} color="teal" /><ReportCard label="Unread Announcements" value={engagement.unread} color="amber" />
      <ReportCard label="Acknowledged" value={engagement.acknowledgements} color="purple" /><ReportCard label="Pending Acknowledgement" value={engagement.pendingAcknowledgements} color="rose" />
    </div>
    <section className="ann-report-charts">
      <div className="ann-panel"><h3>Read vs unread</h3><ProgressLine label="Read" value={engagement.reads} total={engagement.total} color="teal" /><ProgressLine label="Unread" value={engagement.unread} total={engagement.total} color="amber" /></div>
      <div className="ann-panel"><h3>Acknowledged vs pending</h3><ProgressLine label="Acknowledged" value={engagement.acknowledgements} total={engagement.total} color="purple" /><ProgressLine label="Pending" value={engagement.pendingAcknowledgements} total={engagement.total} color="rose" /></div>
      <div className="ann-panel ann-department-chart"><h3>Department-wise engagement</h3>{byDepartment.length ? byDepartment.map(([department, values]) => <ProgressLine key={department} label={`${department} · ${values.read}/${values.total} read`} value={values.read} total={values.total} color="blue" />) : <p className="ann-muted">No recipient records yet.</p>}</div>
    </section>
    <section className="ann-panel">
      <div className="ann-list-heading"><div><h2>Employee recipient status</h2><p>{filtered.length} recipients shown</p></div><button className="ann-button ann-button-secondary" onClick={exportCsv}><Download size={16} /> Export Excel (CSV)</button><button className="ann-button ann-button-secondary" onClick={() => window.print()}><FileText size={16} /> Export PDF</button></div>
      <div className="ann-report-filters"><label>Recipient status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All Recipients</option><option value="delivered">Delivered</option><option value="read">Read</option><option value="unread">Unread</option><option value="acknowledged">Acknowledged</option><option value="pending">Pending Acknowledgement</option></select></label></div>
      <div className="ann-table-wrap"><table className="ann-table ann-recipient-table"><thead><tr><th>Employee ID</th><th>Employee Name</th><th>Department</th><th>Designation</th><th>Project</th><th>Delivery Status</th><th>Read Status</th><th>Read Date and Time</th><th>Acknowledgement Status</th><th>Acknowledgement Date and Time</th></tr></thead>
        <tbody>{filtered.map((recipient) => <tr key={recipient.employeeId}><td>{recipient.employeeId}</td><td>{recipient.employeeName}</td><td>{recipient.department}</td><td>{recipient.designation}</td><td>{recipient.project}</td><td><StatusBadge status={recipient.deliveredAt ? "Delivered" : "Unread"} /></td><td><StatusBadge status={recipient.readAt ? "Read" : "Unread"} /></td><td>{fmtDate(recipient.readAt, true)}</td><td><StatusBadge status={recipient.acknowledgedAt ? "Acknowledged" : "Pending"} /></td><td>{fmtDate(recipient.acknowledgedAt, true)}</td></tr>)}</tbody>
      </table>{!filtered.length && <div className="ann-empty">No recipient records for this filter.</div>}</div>
    </section>
  </div>;
}

function ReportCard({ label, value, color }) {
  return <div className={`ann-report-card ann-report-${color}`}><span>{label}</span><strong>{value}</strong></div>;
}

function ProgressLine({ label, value, total, color }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return <div className="ann-progress-row"><div><span>{label}</span><strong>{value} <small>({percent}%)</small></strong></div><div className="ann-progress-track"><i className={`ann-progress-${color}`} style={{ width: `${percent}%` }} /></div></div>;
}

function EmployeeInbox({ announcements, employees, navigate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId") || employees[0]?.id || "";
  const items = announcements.filter((announcement) => getAnnouncementStatus(announcement) === "Published" && announcement.recipients?.some((recipient) => recipient.employeeId === employeeId));
  const unread = items.filter((announcement) => !announcement.recipients.find((recipient) => recipient.employeeId === employeeId)?.readAt).length;
  return <div className="announcement-page">
    <PageHeader title="Employee Announcement Inbox" subtitle="Preview the announcement feed for a specific employee.">
      <Link className="ann-button ann-button-secondary" to="/admin/announcements"><ArrowLeft size={16} /> Management</Link>
    </PageHeader>
    <section className="ann-panel ann-inbox-toolbar"><label className="ann-field">Preview employee<select value={employeeId} onChange={(event) => setSearchParams({ employeeId: event.target.value })}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.id} · {employee.department}</option>)}</select></label><div className="ann-inbox-unread"><Bell size={17} /> Unread announcements <strong>{unread}</strong></div></section>
    <div className="ann-inbox-feed">{items.map((announcement) => {
      const recipient = announcement.recipients.find((item) => item.employeeId === employeeId);
      return <button className={`ann-inbox-card${recipient?.readAt ? "" : " is-unread"}`} key={announcement.id} onClick={() => navigate(`/admin/announcements/${announcement.id}?employeeId=${encodeURIComponent(employeeId)}`)}>
        <span className="ann-inbox-card-top"><StatusBadge status={recipient?.readAt ? "Read" : "Unread"} /><span className={`ann-priority ann-priority-${announcement.priority.toLowerCase()}`}>{announcement.priority}</span><span>{fmtDate(announcement.publishAt, true)}</span></span>
        <h2>{announcement.title}</h2><p>{announcement.shortDescription}</p><span className="ann-category">{announcement.category}</span>
        {announcement.attachments?.length > 0 && <span className="ann-inbox-attachment"><FileText size={14} /> {announcement.attachments.length} attachment(s)</span>}
        {announcement.requireAcknowledgement && !recipient?.acknowledgedAt && <span className="ann-inbox-ack">Acknowledgement required</span>}
      </button>;
    })}{!items.length && <div className="ann-empty"><Inbox size={26} /><strong>No published announcements for this employee</strong><span>Scheduled items appear here after their publication time.</span></div>}</div>
    <div className="ann-storage-note"><CircleAlert size={14} /> This inbox is a React preview, not an authenticated employee dashboard. Changes are saved in this browser only.</div>
  </div>;
}

function PageMessage({ title, back }) {
  return <div className="announcement-page"><div className="ann-empty ann-message"><CircleAlert size={25} /><strong>{title}</strong><button className="ann-button ann-button-secondary" onClick={back}><ArrowLeft size={16} /> Back to announcements</button></div></div>;
}

export default AnnouncementManagement;
