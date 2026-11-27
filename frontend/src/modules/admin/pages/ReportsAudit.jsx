/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Clock3, Download, Eye, FileCog, LockKeyhole, Search, ShieldAlert, Users, X } from "lucide-react";
import { getOrganizationEmployees } from "../data/organizationData";
import { readAuditLog } from "../services/auditLog";
import { readAdminProfile } from "../services/adminProfile";
import { downloadCsv } from "../utils/downloadCsv";
import "../style/Reports.css";

const PAGE_SIZE = 10;
const securityWords = ["login", "logout", "password", "session", "unauthorized", "permission", "account"];
const adminWords = ["employee", "department", "branch", "designation", "role", "user", "leave", "attendance", "payroll", "salary", "company", "document", "settings", "configuration"];
const value = (row, keys, fallback = "Not recorded") => keys.reduce((found, key) => found || row?.[key], "") || fallback;
const action = (row) => String(value(row, ["action", "activity", "type"], "Activity")).toLowerCase();
const isSecurity = (row) => securityWords.some((word) => action(row).includes(word)) || String(value(row, ["module"], "")).toLowerCase().includes("security");
const isAdmin = (row) => !isSecurity(row) && adminWords.some((word) => action(row).includes(word));
const isFailed = (row) => ["failed", "failure", "error", "denied", "rejected"].includes(String(value(row, ["status", "state"], "success")).toLowerCase());
const timestamp = (row) => row.timestamp || row.created_at || row.date || "";
const formatDate = (date) => { if (!date) return "Not recorded"; const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); };

function normalize(row) {
  const details = row.details && typeof row.details === "object" ? row.details : {};
  return { ...row, id: row.id || `${timestamp(row)}-${action(row)}`, timestamp: timestamp(row), actor: value(row, ["actor", "user", "userName", "performedBy"], "Unknown user"), role: value(row, ["role", "userRole", "user_role"]), module: value(row, ["module", "entityType", "entity_type"], "General"), action: value(row, ["action", "activity", "type"], "Activity"), description: value(row, ["summary", "description", "message"], "Activity recorded"), status: value(row, ["status", "state"], "Success"), branch: value(row, ["branch", "branchName", "branch_name"], "Not recorded"), department: value(row, ["department", "departmentName", "department_name"], "Not recorded"), ip: value(row, ["ipAddress", "ip_address", "ip"], "Not available"), previous: details.before ?? details.previous ?? row.previousValue ?? row.previous_value ?? "Not recorded", updated: details.after ?? details.updated ?? row.updatedValue ?? row.updated_value ?? "Not recorded" };
}

function BarList({ rows, empty = "No source data available." }) {
  if (!rows.length) return <p className="reports-empty">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <div className="productivity-bars">{rows.map((row) => <div className="productivity-bar-row" key={row.label}><span title={row.label}>{row.label}</span><div><i style={{ width: `${(row.value / max) * 100}%` }} /></div><strong>{row.value}</strong></div>)}</div>;
}

export default function ReportsAudit() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setActiveTab] = useState("overview");
  useEffect(() => {
    const section = new URLSearchParams(location.search).get("section");
    // The URL is the source of truth when a KPI navigates to a report section.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (["overview", "usage", "configuration", "audit", "security"].includes(section)) setActiveTab(section);
  }, [location.search]);
  const setTab = (next) => {
    if (next === "overview" && document.activeElement?.classList.contains("reports-metric-button")) {
      const label = document.activeElement.textContent || "";
      const routes = {
        "Total Employees": "/admin/employees/records?filter=all",
        "Active Employees": "/admin/employees/records?filter=active",
        "Total Branches": "/admin/organization",
        "Total Departments": "/admin/departments",
        "Active Users": "/admin/users",
        "Module Usage": "/admin/reports?section=usage",
        "Recent Administrative Changes": "/admin/reports?section=audit",
        "Security Events": "/admin/reports?section=security",
      };
      const route = Object.entries(routes).find(([name]) => label.includes(name))?.[1];
      if (route) {
        navigate(route);
        return;
      }
    }
    setActiveTab(next);
  };
  const [employees, setEmployees] = useState(() => getOrganizationEmployees());
  const [rawLogs, setRawLogs] = useState(() => readAuditLog());
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: "", module: "All", branch: "All", department: "All", activity: "All", status: "All", from: "", to: "" });
  const [page, setPage] = useState(1);
  useEffect(() => {
    const activity = new URLSearchParams(location.search).get("activity");
    if (!activity) return;
    // Dashboard activity links provide the exact recorded action to filter here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((current) => ({ ...current, activity }));
    setPage(1);
  }, [location.search]);
  const [recentCutoff] = useState(() => Date.now() - 7 * 86400000);
  const profile = useMemo(() => readAdminProfile(), []);
  useEffect(() => { const refresh = () => { setRawLogs(readAuditLog()); setEmployees(getOrganizationEmployees()); }; window.addEventListener("hrms-audit-log-updated", refresh); window.addEventListener("storage", refresh); return () => { window.removeEventListener("hrms-audit-log-updated", refresh); window.removeEventListener("storage", refresh); }; }, []);
  const logs = useMemo(() => rawLogs.map(normalize).filter((row) => { const eventCompany = row.companyId || row.company_id || row.company; const currentCompany = profile.companyId || profile.company_id || profile.company; return !eventCompany || !currentCompany || String(eventCompany) === String(currentCompany); }), [rawLogs, profile]);
  const departments = useMemo(() => [...new Set(employees.map((item) => item.department).filter(Boolean))].sort(), [employees]);
  const branches = useMemo(() => [...new Set(employees.map((item) => item.branch || item.branchName || item.location).filter(Boolean))].sort(), [employees]);
  const modules = useMemo(() => [...new Set(logs.map((item) => item.module))].sort(), [logs]);
  const activities = useMemo(() => [...new Set(logs.map((item) => item.action))].sort(), [logs]);
  const activeEmployees = employees.filter((item) => !["inactive", "terminated", "exited", "deactivated"].includes(String(item.status).toLowerCase()));
  const usageRows = useMemo(() => [...new Set(logs.map((item) => item.module))].map((name) => ({ label: name, value: logs.filter((item) => item.module === name).length })), [logs]);
  const departmentRows = departments.map((name) => ({ label: name, value: employees.filter((item) => item.department === name).length }));
  const branchRows = branches.map((name) => ({ label: name, value: employees.filter((item) => (item.branch || item.branchName || item.location) === name).length }));
  const kpis = { employees: employees.length, active: activeEmployees.length, branches: branches.length, departments: departments.length, users: employees.filter((item) => item.email && item.status !== "Inactive").length, usage: usageRows.length, recent: logs.filter((item) => new Date(item.timestamp).getTime() >= recentCutoff && isAdmin(item)).length, security: logs.filter(isSecurity).length };
  const filtered = useMemo(() => logs.filter((row) => { const search = filters.search.toLowerCase(); const date = row.timestamp ? new Date(row.timestamp) : null; return (!search || `${row.actor} ${row.description} ${row.action}`.toLowerCase().includes(search)) && (filters.module === "All" || row.module === filters.module) && (filters.branch === "All" || row.branch === filters.branch) && (filters.department === "All" || row.department === filters.department) && (filters.activity === "All" || row.action === filters.activity) && (filters.status === "All" || row.status.toLowerCase() === filters.status.toLowerCase()) && (!filters.from || (date && date >= new Date(`${filters.from}T00:00:00`))) && (!filters.to || (date && date <= new Date(`${filters.to}T23:59:59`))); }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [logs, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const update = (key, next) => { setPage(1); setFilters((current) => ({ ...current, [key]: next })); };
  const clear = () => { setPage(1); setFilters({ search: "", module: "All", branch: "All", department: "All", activity: "All", status: "All", from: "", to: "" }); };
  const exportLogs = () => downloadCsv("reports-audit-logs.csv", ["Date & Time", "User", "Role", "Module", "Description", "Status"], filtered.map((row) => [formatDate(row.timestamp), row.actor, row.role, row.module, row.description, row.status]));
  const tabs = [["overview", "Reports Overview"], ["usage", "Usage Reports"], ["configuration", "Configuration Reports"], ["audit", "Audit Logs"], ["security", "Security Events"]];
  return <div className="reports-page audit-page"><header className="reports-header"><div><span className="reports-eyebrow">HRMS / ADMIN / REPORTS &amp; AUDITS</span><h1>Reports &amp; Audit Logs</h1><p>Organization-wide usage, configuration, administrative changes and security events.</p></div><div className="reports-actions"><button type="button" className="reports-button" onClick={exportLogs} disabled={!filtered.length}><Download size={16} /> Export CSV</button></div></header><nav className="reports-tabs" aria-label="Reports and audit sections">{tabs.map(([key, label]) => <button type="button" className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)}>{label}</button>)}</nav><div className="audit-scope-note"><ShieldAlert size={16} /><span>Company-scoped view for the logged-in admin. Showing recorded data only; no mock reports or audit history are generated.</span></div>{tab === "overview" && <Overview kpis={kpis} employees={employees} logs={logs} departmentRows={departmentRows} usageRows={usageRows} onTab={setTab} />}{tab === "usage" && <Usage employees={employees} activeEmployees={activeEmployees} departmentRows={departmentRows} branchRows={branchRows} usageRows={usageRows} logs={logs} />}{tab === "configuration" && <Configuration employees={employees} departments={departments} branches={branches} logs={logs} />}{(tab === "audit" || tab === "security") && <LogTable tab={tab} logs={tab === "security" ? logs.filter(isSecurity) : logs.filter(isAdmin)} filters={filters} modules={modules} branches={branches} departments={departments} activities={activities} update={update} clear={clear} page={page} setPage={setPage} pageCount={pageCount} visible={visible.filter(tab === "security" ? isSecurity : isAdmin)} exportLogs={exportLogs} onSelect={setSelected} />}{selected && <Details event={selected} onClose={() => setSelected(null)} />}</div>;
}

function Overview({ employees, logs, departmentRows, usageRows, onTab }) { const cards = [["Module Usage", usageRows.length, BarChart3], ["Recent Administrative Changes", logs.filter(isAdmin).length, Clock3], ["Security Events", logs.filter(isSecurity).length, LockKeyhole]]; return <><section className="reports-metrics audit-kpis">{cards.map(([label, number, Icon]) => <button type="button" className="reports-card reports-metric-button" key={label} onClick={() => onTab(label === "Security Events" ? "security" : label.includes("Administrative") ? "audit" : "usage")}><Icon size={18} /><span>{label}</span><strong>{number}</strong><small>View report</small></button>)}</section><div className="productivity-chart-grid"><section className="reports-card"><div className="reports-section-heading"><h2>Department distribution</h2></div><BarList rows={departmentRows} /></section><section className="reports-card"><div className="reports-section-heading"><h2>Module usage</h2></div><BarList rows={usageRows} empty={logs.length ? "No module activity recorded." : "No audit activity recorded."} /></section></div><section className="reports-card"><div className="reports-section-heading"><h2>Organization summary</h2><span>{employees.length} employee records</span></div><p className="reports-data-note">Usage and activity charts are based on actual records available in this dashboard. Backend login analytics are not configured, so unavailable metrics are not inferred.</p></section></>; }
function Usage({ employees, activeEmployees, departmentRows, branchRows, usageRows, logs }) { return <><section className="reports-metrics audit-kpis"><Metric label="Employees" number={employees.length} /><Metric label="Active employees" number={activeEmployees.length} /><Metric label="Recorded modules" number={usageRows.length} /><Metric label="Recorded activities" number={logs.length} /></section><div className="productivity-chart-grid"><section className="reports-card"><div className="reports-section-heading"><h2>Branch-wise employee distribution</h2></div><BarList rows={branchRows} empty="Branch data is not available in employee records." /></section><section className="reports-card"><div className="reports-section-heading"><h2>Department-wise employee distribution</h2></div><BarList rows={departmentRows} /></section><section className="reports-card"><div className="reports-section-heading"><h2>Module usage statistics</h2></div><BarList rows={usageRows} empty="No module activity has been recorded." /></section><section className="reports-card"><div className="reports-section-heading"><h2>User activity summary</h2></div><BarList rows={[...new Set(logs.map((item) => item.actor))].map((label) => ({ label, value: logs.filter((item) => item.actor === label).length }))} empty="No user activity has been recorded." /></section></div></>; }
function Configuration({ employees, departments, branches, logs }) { const roles = [...new Set(employees.map((item) => item.role).filter(Boolean))]; const designations = [...new Set(employees.map((item) => item.designation).filter(Boolean))]; const configuredModules = [...new Set(logs.map((item) => item.module))]; return <section className="reports-card"><div className="reports-section-heading"><div><h2>Company configuration</h2><p>Current configuration derived from available organization records.</p></div></div><div className="configuration-grid">{[["Branches", branches], ["Departments", departments], ["Designations", designations], ["Roles", roles], ["Enabled modules", configuredModules]].map(([label, items]) => <div className="configuration-item" key={label}><span>{label}</span><strong>{items.length}</strong><small>{items.length ? items.join(" · ") : "No records available"}</small></div>)}<div className="configuration-item"><span>Leave, attendance and payroll policies</span><strong>Not available</strong><small>Connect the corresponding configuration APIs to report these values.</small></div></div></section>; }
function Metric({ label, number }) { return <button type="button" className="reports-card reports-metric-button productivity-clickable" onClick={() => document.querySelector(".productivity-chart-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{label}</span><strong>{number}</strong><small>View details</small></button>; }
function LogTable({ tab, logs, filters, modules, branches, departments, activities, update, clear, page, setPage, pageCount, visible, exportLogs, onSelect }) { const searchSource = logs; const filtered = searchSource.filter((row) => { const q = filters.search.toLowerCase(); const date = row.timestamp ? new Date(row.timestamp) : null; return (!q || `${row.actor} ${row.description} ${row.action}`.toLowerCase().includes(q)) && (filters.module === "All" || row.module === filters.module) && (filters.branch === "All" || row.branch === filters.branch) && (filters.department === "All" || row.department === filters.department) && (filters.activity === "All" || row.action === filters.activity) && (filters.status === "All" || row.status.toLowerCase() === filters.status.toLowerCase()) && (!filters.from || (date && date >= new Date(`${filters.from}T00:00:00`))) && (!filters.to || (date && date <= new Date(`${filters.to}T23:59:59`))); }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); const count = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); return <><section className="reports-card reports-filters audit-filters"><label className="audit-search"><span>Search user or activity</span><div><Search size={15} /><input value={filters.search} onChange={(e) => update("search", e.target.value)} placeholder="Search..." /></div></label>{[["module", "Module", modules], ["branch", "Branch", branches], ["department", "Department", departments], ["activity", "Activity type", activities]].map(([key, label, options]) => <label key={key}><span>{label}</span><select value={filters[key]} onChange={(e) => update(key, e.target.value)}><option>All</option>{options.map((item) => <option key={item}>{item}</option>)}</select></label>)}<label><span>Status</span><select value={filters.status} onChange={(e) => update("status", e.target.value)}><option>All</option><option>Success</option><option>Failed</option></select></label><label><span>From</span><input type="date" value={filters.from} onChange={(e) => update("from", e.target.value)} /></label><label><span>To</span><input type="date" value={filters.to} onChange={(e) => update("to", e.target.value)} /></label><button type="button" className="reports-button secondary audit-clear" onClick={clear}><X size={15} /> Clear Filters</button></section><section className="reports-card"><div className="reports-section-heading"><div><h2>{tab === "security" ? "Security events" : "Administrative changes"}</h2><p>{filtered.length} recorded event{filtered.length === 1 ? "" : "s"} match the filters.</p></div><button type="button" className="reports-button secondary" onClick={exportLogs} disabled={!filtered.length}><Download size={15} /> Export</button></div><div className="reports-table-wrap"><table className="reports-table audit-table"><thead><tr><th>Date &amp; Time</th><th>User</th><th>Role</th><th>Module / Event</th><th>Description</th><th>Previous</th><th>Updated / IP</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.timestamp)}</td><td><strong>{row.actor}</strong></td><td>{row.role}</td><td>{row.module}<small>{row.action}</small></td><td>{row.description}</td><td>{tab === "security" ? row.ip : String(row.previous)}</td><td>{tab === "security" ? row.ip : String(row.updated)}</td><td><span className={`audit-status ${isFailed(row) ? "failed" : "success"}`}>{isFailed(row) ? "Failed" : row.status}</span></td><td><button type="button" className="audit-view-button" onClick={() => onSelect(row)}><Eye size={14} /> View</button></td></tr>)}{!rows.length && <tr><td className="reports-empty" colSpan="9"><AlertTriangle size={18} />No recorded events available.</td></tr>}</tbody></table></div><div className="audit-pagination"><span>Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button><button type="button" disabled={page === count} onClick={() => setPage(page + 1)}>›</button></div></div></section></>; }
function Details({ event, onClose }) { return <div className="audit-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="audit-modal" role="dialog" aria-modal="true"><div className="audit-modal-header"><div><span className="reports-eyebrow">AUDIT RECORD</span><h2>Activity details</h2></div><button type="button" onClick={onClose}><X size={18} /></button></div><dl className="audit-detail-grid">{[["Performed by", event.actor], ["Role", event.role], ["Activity type", event.action], ["Module", event.module], ["Date and time", formatDate(event.timestamp)], ["Description", event.description], ["Previous value", event.previous], ["Updated value", event.updated], ["IP address", event.ip], ["Status", event.status]].map(([label, item]) => <div key={label}><dt>{label}</dt><dd>{typeof item === "object" ? JSON.stringify(item) : item}</dd></div>)}</dl><div className="audit-modal-footer"><CheckCircle2 size={16} /> Audit records are read-only.</div></section></div>; }
