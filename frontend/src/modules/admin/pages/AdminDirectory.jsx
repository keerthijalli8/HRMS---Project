import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, ShieldCheck, BriefcaseBusiness, GraduationCap } from "lucide-react";
import { MetricCard, PageHeader, SectionCard, StatusBadge } from "../components/ModulePrimitives";
import useLocalStorage from "../hooks/use_localstorage";
import "../style/Modules.css";
import { downloadCsv } from "../utils/downloadCsv";

const seed = {
  recruitment: [
    { id: "JOB-001", title: "Frontend Engineer", department: "Technology", status: "Open", candidates: 12, owner: "Priya Reddy" },
    { id: "JOB-002", title: "HR Business Partner", department: "Human Resources", status: "Interviewing", candidates: 7, owner: "Ananya Das" },
  ],
  training: [
    { id: "TRN-001", title: "Manager Essentials", department: "All departments", status: "In progress", enrolled: 14, owner: "Learning Team" },
    { id: "TRN-002", title: "Workplace Safety", department: "Operations", status: "Scheduled", enrolled: 22, owner: "HR Operations" },
  ],
  roles: [
    { id: "ROLE-001", title: "Super Admin", department: "Administration", status: "Active", permissions: "View · Create · Edit · Delete · Approve · Reject · Export" },
    { id: "ROLE-002", title: "HR", department: "Human Resources", status: "Active", permissions: "View · Create · Edit · Approve · Reject · Export" },
    { id: "ROLE-003", title: "Manager", department: "People Management", status: "Active", permissions: "View · Create · Edit · Approve · Export" },
    { id: "ROLE-004", title: "Employee", department: "Self-service", status: "Active", permissions: "View" },
  ],
};

const configs = {
  recruitment: { title: "Recruitment Management", subtitle: "Track openings, candidates, interviews and offer progress.", icon: BriefcaseBusiness, primary: "Add job opening", fields: ["Title", "Department", "Status"] },
  training: { title: "Training & Development", subtitle: "Manage programs, assignments, certifications and completion status.", icon: GraduationCap, primary: "Add training program", fields: ["Title", "Department", "Status"] },
  roles: { title: "Roles & Permissions", subtitle: "Configure frontend demonstration access for each HRMS role.", icon: ShieldCheck, primary: "Add role", fields: ["Title", "Department", "Permissions"] },
};

export default function AdminDirectory({ type }) {
  const config = configs[type];
  const Icon = config.icon;
  const [records, setRecords] = useLocalStorage(`hrms-${type}-directory`, seed[type]);
  const [query, setQuery] = useState("");
  const selectedStorageKey = `hrms-${type}-selected-kpi`;
  const [selectedKpi, setSelectedKpi] = useState(() => {
    try { return sessionStorage.getItem(selectedStorageKey) || ""; } catch { return ""; }
  });
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", department: "", status: type === "roles" ? "Active" : "Open" });
  const visible = useMemo(() => records.filter((item) => {
    const matchesSearch = Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesKpi = !selectedKpi || (selectedKpi === "active" ? ["Active", "Open", "In progress"].includes(item.status) : true);
    return matchesSearch && matchesKpi;
  }), [records, query, selectedKpi]);
  useEffect(() => {
    try {
      if (selectedKpi) sessionStorage.setItem(selectedStorageKey, selectedKpi);
      else sessionStorage.removeItem(selectedStorageKey);
    } catch { /* session storage may be unavailable */ }
  }, [selectedKpi, selectedStorageKey]);
  const exportRecords = () => downloadCsv(
    `${type}-records.csv`,
    ["ID", "Name", "Department", "Status", type === "roles" ? "Permissions" : type === "training" ? "Enrolled" : "Candidates", "Owner"],
    visible.map((item) => [item.id, item.title, item.department, item.status, item.permissions || item.enrolled || item.candidates || 0, item.owner || ""])
  );
  const save = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.department.trim()) return;
    setRecords((current) => [...current, { ...draft, id: `${type.slice(0, 3).toUpperCase()}-${String(current.length + 1).padStart(3, "0")}`, ...(type === "roles" ? { permissions: "View" } : { [type === "training" ? "enrolled" : "candidates"]: 0, owner: "Admin User" }) }]);
    setDraft({ title: "", department: "", status: type === "roles" ? "Active" : "Open" });
    setShowForm(false);
  };
  return <div className="module-page">
    <PageHeader eyebrow="HRMS / ADMINISTRATION" title={config.title} description={config.subtitle} action={<div className="module-header-actions"><button type="button" className="module-button secondary" onClick={exportRecords}><Download size={16} /> Export CSV</button><button type="button" className="module-button primary" onClick={() => setShowForm(true)}><Plus size={16} /> {config.primary}</button></div>} />
    <div className="module-kpi-grid">
      <MetricCard label="Total records" value={records.length} detail="Show all records" icon={Icon} onClick={() => setSelectedKpi("")} active={!selectedKpi} />
      <MetricCard label="Active / open" value={records.filter((item) => ["Active", "Open", "In progress"].includes(item.status)).length} detail="Show active records" icon={ShieldCheck} onClick={() => setSelectedKpi("active")} active={selectedKpi === "active"} />
    </div>
    {showForm && <SectionCard title={config.primary} description="Saved locally in this browser for demonstration." action={<button type="button" className="module-button secondary" onClick={() => setShowForm(false)}>Cancel</button>}>
      <form className="module-form-grid" onSubmit={save}><label>Title<input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Department<input required value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} /></label><label>Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>Active</option><option>Open</option><option>Scheduled</option><option>In progress</option></select></label><button className="module-button primary" type="submit">Save record</button></form>
    </SectionCard>}
    <SectionCard title={`${visible.length} records`} description="Use search to narrow the current frontend dataset." action={<div className="module-search"><Search size={16} /><input aria-label="Search records" placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>}>
      <div className="module-table-wrap table-responsive"><table className="module-table"><thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th><th>Details</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td>{item.id}</td><td><strong>{item.title}</strong></td><td>{item.department}</td><td><StatusBadge>{item.status}</StatusBadge></td><td>{item.permissions || `${item.candidates ?? item.enrolled ?? 0} ${type === "training" ? "enrolled" : "candidates"}`}</td></tr>)}{!visible.length && <tr><td colSpan="5">No matching records.</td></tr>}</tbody></table></div>
    </SectionCard>
  </div>;
}
