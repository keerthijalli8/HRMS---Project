import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { readAdminProfile } from "../services/adminProfile";
import useLocalStorage from "../hooks/use_localstorage";
import "../style/CompanyHolidayCalendar.css";

const sampleHolidays = [
  { id: "sample-company-1", name: "Annual Foundation Day", date: "2026-11-14", type: "Company Holiday", description: "Sample company holiday for frontend demonstration.", location: "All India offices", department: "All departments", createdBy: "Admin User", sample: true },
  { id: "sample-government-1", name: "Sample Regional Holiday", date: "2026-11-22", type: "Government Holiday", description: "Sample government holiday record. This date is not officially verified.", location: "Karnataka (demo)", department: "All departments", createdBy: "Admin User", sample: true },
];

const emptyHoliday = { name: "", date: "", type: "Company Holiday", description: "", location: "", department: "All departments" };
const colors = { "Company Holiday": "company", "Government Holiday": "government" };
const toKey = (date) => date.toISOString().slice(0, 10);

export default function CompanyHolidayCalendar({ openHolidayRequest = 0 }) {
  const [holidays, setHolidays] = useLocalStorage("hrms-company-holidays", sampleHolidays);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [draft, setDraft] = useState(emptyHoliday);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const canManage = /admin|hr|manager/i.test(`${readAdminProfile().designation} ${readAdminProfile().department}`);
  useEffect(() => {
    if (!openHolidayRequest) return;
    setDraft(emptyHoliday);
    setError("");
    setShowForm(true);
  }, [openHolidayRequest]);
  useEffect(() => {
    if (!showForm && !selectedHoliday) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showForm, selectedHoliday]);
  const visible = useMemo(() => holidays.filter((holiday) => (filter === "All" || holiday.type === filter) && Object.values(holiday).join(" ").toLowerCase().includes(query.toLowerCase())), [holidays, filter, query]);
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({ length: count }, (_, index) => toKey(new Date(month.getFullYear(), month.getMonth(), index + 1)))];
  }, [month]);
  const openNew = () => { setDraft(emptyHoliday); setError(""); setShowForm(true); };
  const openEdit = (holiday) => { setDraft({ ...holiday }); setError(""); setSelectedHoliday(null); setShowForm(true); };
  const saveHoliday = (event) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.date || !draft.location.trim()) { setError("Holiday name, date, and applicable location are required."); return; }
    const next = { ...draft, id: draft.id || `holiday-${Date.now()}`, name: draft.name.trim(), createdBy: draft.createdBy || readAdminProfile().name || "Admin User", sample: false };
    setHolidays((current) => draft.id ? current.map((holiday) => holiday.id === draft.id ? next : holiday) : [...current, next]);
    setShowForm(false); setDraft(emptyHoliday);
  };
  const deleteHoliday = (holiday) => {
    if (!canManage || !window.confirm(`Delete ${holiday.name}?`)) return;
    setHolidays((current) => current.filter((item) => item.id !== holiday.id)); setSelectedHoliday(null);
  };
  const goToday = () => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const changeMonth = (amount) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return <section className="company-holiday-calendar" aria-labelledby="company-holiday-calendar-title">
    <div className="company-holiday-header"><div><span className="attendance-calendar-label">ATTENDANCE / HOLIDAY SCHEDULE</span><h2 id="company-holiday-calendar-title">Company Holiday Calendar</h2><p>Company and government holiday records only. Sample dates are for frontend demonstration and are not officially verified.</p></div>{canManage && <button type="button" className="company-holiday-primary" onClick={openNew}><Plus size={16} /> Add Holiday</button>}</div>
    <div className="company-holiday-toolbar"><div className="company-holiday-navigation"><button type="button" onClick={goToday}>Today</button><button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button><strong>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button></div><div className="company-holiday-search"><Search size={16} /><input aria-label="Search holidays" placeholder="Search holidays..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label="Filter holiday type" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Company Holiday</option><option>Government Holiday</option></select></div>
    <div className="company-holiday-legend"><span><i className="holiday-company" />Company Holidays</span><span><i className="holiday-government" />Government Holidays</span><button type="button" onClick={() => { setFilter("All"); setQuery(""); }}>Reset Filters</button></div>
    <div className="company-holiday-grid"><div className="company-holiday-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="company-holiday-days">{days.map((day, index) => day ? <div className={`company-holiday-day ${day === toKey(new Date()) ? "today" : ""}`} key={day}><strong>{day.slice(-2)}</strong>{visible.filter((holiday) => holiday.date === day).map((holiday) => <button type="button" className={`holiday-chip ${colors[holiday.type]}`} key={holiday.id} onClick={() => setSelectedHoliday(holiday)} title={holiday.name}>{holiday.name}</button>)}</div> : <span className="company-holiday-empty" key={`empty-${index}`} />)}</div></div>
    <div className="company-holiday-list"><div><h3>Holiday records</h3><span>{visible.length} matching records</span></div>{visible.map((holiday) => <button type="button" key={holiday.id} onClick={() => setSelectedHoliday(holiday)}><i className={`holiday-${colors[holiday.type]}`} /><span><strong>{holiday.name}</strong><small>{holiday.date} · {holiday.type} · {holiday.location}</small></span></button>)}{!visible.length && <p>No holiday records match the current filters.</p>}</div>
    {showForm && <div className="company-holiday-overlay"><form className="company-holiday-modal" onSubmit={saveHoliday}><div className="company-holiday-modal-heading"><div><span className="attendance-calendar-label">HOLIDAY MANAGEMENT</span><h3>{draft.id ? "Edit Holiday" : "Add Holiday"}</h3></div><button type="button" aria-label="Close holiday form" onClick={() => setShowForm(false)}><X size={18} /></button></div>{error && <p className="company-holiday-error">{error}</p>}<div className="company-holiday-form-grid"><label>Holiday Name<input required value={draft.name} onChange={(event) => update("name", event.target.value)} /></label><label>Holiday Date<input required type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} /></label><label>Holiday Type<select value={draft.type} onChange={(event) => update("type", event.target.value)}><option>Company Holiday</option><option>Government Holiday</option></select></label><label>Applicable Location or Region<input required value={draft.location} onChange={(event) => update("location", event.target.value)} placeholder="e.g. All India or Maharashtra" /></label><label>Optional Department<input value={draft.department} onChange={(event) => update("department", event.target.value)} /></label><label className="company-holiday-wide">Description<textarea value={draft.description} onChange={(event) => update("description", event.target.value)} /></label></div><div className="company-holiday-actions"><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="company-holiday-primary">Save Holiday</button></div></form></div>}
    {selectedHoliday && <div className="company-holiday-overlay" onClick={() => setSelectedHoliday(null)}><div className="company-holiday-modal" onClick={(event) => event.stopPropagation()}><div className="company-holiday-modal-heading"><div><span className={`holiday-type-label ${colors[selectedHoliday.type]}`}>{selectedHoliday.type}</span><h3>{selectedHoliday.name}</h3></div><button type="button" aria-label="Close holiday details" onClick={() => setSelectedHoliday(null)}><X size={18} /></button></div><dl className="company-holiday-details"><dt>Holiday date</dt><dd>{selectedHoliday.date}</dd><dt>Description</dt><dd>{selectedHoliday.description || "No description provided."}</dd><dt>Location / region</dt><dd>{selectedHoliday.location}</dd><dt>Department</dt><dd>{selectedHoliday.department || "All departments"}</dd><dt>Created by</dt><dd>{selectedHoliday.createdBy}</dd></dl>{selectedHoliday.sample && <p className="company-holiday-note">Demonstration record — not an officially verified holiday listing.</p>}{canManage && <div className="company-holiday-actions"><button type="button" onClick={() => openEdit(selectedHoliday)}>Edit</button><button type="button" className="company-holiday-delete" onClick={() => deleteHoliday(selectedHoliday)}>Delete</button></div>}</div></div>}
  </section>;
}
