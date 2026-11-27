import { ArrowLeft, CalendarDays, Clock3, History, Settings2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { readAttendanceSettings } from "../services/attendanceSettings";
import { SectionCard } from "../components/ModulePrimitives";
import "../style/HrConfiguration.css";

const labels = { attendance: ["Attendance Rules Configured", Settings2], shifts: ["Active Shifts", Clock3], leave: ["Active Leave Types", CalendarDays], holidays: ["Holiday Calendar", CalendarDays] };
const keys = { shifts: "hrms-employee-shifts", leave: "hrms-leave-policies", holidays: "hrms-company-holidays" };
const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value || fallback; } catch { return fallback; } };

export default function HrConfigurationKpiRecords() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const filter = params.get("filter") || "attendance";
  const [title, Icon] = labels[filter] || labels.attendance;
  const attendance = readAttendanceSettings();
  const shifts = read(keys.shifts, []).filter((item) => item.status === "Active");
  const leaves = read(keys.leave, []).filter((item) => item.status === "Active");
  const holidays = read(keys.holidays, []).filter((item) => item.status !== "Inactive");
  const rules = Object.entries(attendance).filter(([, value]) => value !== "" && value !== null && value !== undefined);
  return <div className="hr-config-records-page"><header className="module-page-header"><div><span className="module-eyebrow">HRMS / ADMINISTRATION / HR CONFIGURATION</span><h1>{title}</h1><p>Dedicated records for the selected HR Configuration KPI.</p></div><div className="module-stat-icon"><Icon size={22} /></div></header><button type="button" className="module-button secondary hr-records-back" onClick={() => navigate("/admin/hr-configuration")}><ArrowLeft size={16} />Back to HR Configuration</button>
    {filter === "attendance" && <SectionCard title="Configured attendance rules" description={`${rules.length} active attendance settings are currently configured.`}><div className="hr-record-detail-grid">{rules.map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{String(value)}</strong></div>)}</div></SectionCard>}
    {filter === "shifts" && <RecordTable title="Active shifts" count={shifts.length} headers={["Shift", "Code", "Schedule", "Type", "Departments"]} rows={shifts.map((item) => [item.name, item.code, `${item.start} – ${item.end}${item.end < item.start ? " (+1 day)" : ""}`, item.type, item.assignedDepartments])} />}
    {filter === "leave" && <RecordTable title="Active leave policies" count={leaves.length} headers={["Leave Type", "Code", "Annual Allocation", "Monthly Accrual", "Paid", "Effective Date"]} rows={leaves.map((item) => [item.name, item.code, item.annual, item.accrual, item.paid ? "Yes" : "No", item.effectiveDate])} />}
    {filter === "holidays" && <RecordTable title="Configured holidays" count={holidays.length} headers={["Holiday", "Date", "Type", "Location", "Status"]} rows={holidays.map((item) => [item.name, item.date, item.type, item.location, item.status])} />}
    <SectionCard title="Configuration history" description="Historical changes remain unchanged when new configuration is saved."><div className="hr-history-row"><History size={16} /><div><strong>View full history</strong><span>Return to HR Configuration to review all recorded changes.</span></div><button type="button" className="module-button secondary" onClick={() => navigate("/admin/hr-configuration")}>Open history</button></div></SectionCard>
  </div>;
}

function RecordTable({ title, count, headers, rows }) { return <SectionCard title={title} description={`${count} records match this KPI.`}><div className="hr-table-wrap"><table className="module-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((value, cellIndex) => <td key={`${cellIndex}-${value}`}>{value}</td>)}</tr>)}{!rows.length && <tr><td colSpan={headers.length} className="module-empty">No records are configured yet.</td></tr>}</tbody></table></div></SectionCard>; }
