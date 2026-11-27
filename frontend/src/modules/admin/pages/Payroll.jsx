import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Pencil, Play, Printer, RefreshCw, Search } from "lucide-react";
import { jsPDF } from "jspdf";
import { supabase } from "../supabaseClint";
import { readEmployeeRecords } from "../services/employeeRecords";
import { calculateSalary, SALARY_COMPONENT_KEYS, serializeSalaryStructure, validateSalaryStructure } from "../services/payrollCalculations";
import { downloadCsv } from "../utils/downloadCsv";
import "../style/Payroll.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const today = new Date();
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
const initials = (name = "Employee") => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const PAYROLL_STORAGE_KEY = "hrms-payroll-data-v1";
const experienceSlabDefaults = [
  { id: "slab-0-1", label: "0–1 Year", minMonths: 0, maxMonths: 12, basic_salary: 18000, da: 1000, hra: 3000, pf: 0, active: true },
  { id: "slab-1-2", label: "1–2 Years", minMonths: 12, maxMonths: 24, basic_salary: 22000, da: 1500, hra: 4000, pf: 0, active: true },
  { id: "slab-2-3", label: "2–3 Years", minMonths: 24, maxMonths: 36, basic_salary: 28000, da: 2000, hra: 5000, pf: 0, active: true },
  { id: "slab-3-5", label: "3–5 Years", minMonths: 36, maxMonths: 60, basic_salary: 35000, da: 3000, hra: 7000, pf: 0, active: true },
  { id: "slab-5-plus", label: "5+ Years", minMonths: 60, maxMonths: null, basic_salary: 45000, da: 4000, hra: 9000, pf: 0, active: true },
];
const readPayroll = () => {
  const empty = { structures: {}, roleStructures: {}, experienceSlabs: experienceSlabDefaults, revisionHistory: [], runs: [], details: [], payments: {}, payslips: [] };
  try { return { ...empty, ...JSON.parse(localStorage.getItem(PAYROLL_STORAGE_KEY) || "{}")} ; }
  catch { return empty; }
};
const savePayroll = (data) => localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(data));

const calculate = calculateSalary;
function experienceMonths(structure, employee) { return Number(structure.experience_years ?? employee?.experience_years ?? employee?.experienceYears ?? 0) * 12 + Number(structure.experience_months ?? employee?.experience_months ?? employee?.experienceMonths ?? 0); }
function experienceLabel(structure, employee) { const months = experienceMonths(structure, employee); if (!months) return "0 Months"; const years = Math.floor(months / 12); const remainder = months % 12; return `${years ? `${years} Year${years === 1 ? "" : "s"}` : ""}${years && remainder ? " " : ""}${remainder ? `${remainder} Month${remainder === 1 ? "" : "s"}` : ""}`; }
function applicableSlab(structure, employee, slabs) { const months = experienceMonths(structure, employee); return (slabs || []).filter((slab) => slab.active !== false).find((slab) => months >= Number(slab.minMonths || 0) && (slab.maxMonths === null || slab.maxMonths === "" || months < Number(slab.maxMonths))) || null; }

const salaryStructureDemoRecords = [
  ["Software Developer", 35000, 14000, 5000, 3000, 54000, 51000],
  ["Senior Software Engineer", 55000, 22000, 8000, 5000, 85000, 80000],
  ["Frontend Developer", 30000, 12000, 4000, 2500, 46000, 43500],
  ["Backend Developer", 40000, 16000, 6000, 3500, 62000, 58500],
  ["QA Engineer", 28000, 11200, 3800, 2000, 43000, 41000],
  ["HR Manager", 45000, 18000, 6000, 4000, 69000, 65000],
  ["Finance Manager", 50000, 20000, 7000, 4500, 77000, 72500],
  ["Project Manager", 60000, 24000, 10000, 6000, 94000, 88000],
];
const jobRoleOptions = ["Software Developer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", "QA Engineer", "HR Executive", "HR Manager", "Finance Manager", "Project Manager"];
const salaryComponentKeys = SALARY_COMPONENT_KEYS;

const payrollDemoRuns = [
  { id: "DEMO-RUN-CURRENT", pay_period: thisMonth, status: "processing", employee_count: 12, working_days: 22, total_gross: 300000, total_deductions: 30000, total_net: 270000, payment_date: "Pending", created_at: `${thisMonth.slice(0, 7)}-02T10:00:00.000Z`, demo: true },
  { id: "DEMO-RUN-01", pay_period: "2025-12-01", status: "approved", employee_count: 12, working_days: 23, total_gross: 890000, total_deductions: 89000, total_net: 801000, payment_date: "2025-12-31", created_at: "2025-12-02T10:00:00.000Z", demo: true },
  { id: "DEMO-RUN-02", pay_period: "2025-11-01", status: "draft", employee_count: 11, working_days: 20, total_gross: 825000, total_deductions: 82500, total_net: 742500, payment_date: "Pending", created_at: "2025-11-03T10:00:00.000Z", demo: true },
  { id: "DEMO-RUN-03", pay_period: "2025-10-01", status: "failed", employee_count: 11, working_days: 23, total_gross: 810000, total_deductions: 81000, total_net: 729000, payment_date: "Failed", created_at: "2025-10-04T10:00:00.000Z", demo: true },
];
const payrollDemoDetails = [
  { id: "DEMO-DETAIL-1", payroll_run_id: "DEMO-RUN-CURRENT", employee_name: "Aditi Mehta", employee_code: "EMP011", department: "Administration", working_days: 22, paid_days: 22, gross_salary: 90000, total_deductions: 9000, net_salary: 81000, payment_status: "Pending" },
  { id: "DEMO-DETAIL-2", payroll_run_id: "DEMO-RUN-CURRENT", employee_name: "Rahul Sharma", employee_code: "EMP001", department: "Management", working_days: 22, paid_days: 22, gross_salary: 85000, total_deductions: 8500, net_salary: 76500, payment_status: "Processing" },
  { id: "DEMO-DETAIL-3", payroll_run_id: "DEMO-RUN-CURRENT", employee_name: "Priya Reddy", employee_code: "EMP002", department: "Human Resources", working_days: 22, paid_days: 22, gross_salary: 55000, total_deductions: 5500, net_salary: 49500, payment_status: "Pending" },
  { id: "DEMO-DETAIL-4", payroll_run_id: "DEMO-RUN-CURRENT", employee_name: "Sneha Patel", employee_code: "EMP005", department: "Technology", working_days: 22, paid_days: 21, gross_salary: 70000, total_deductions: 7000, net_salary: 63000, payment_status: "Failed" },
];

function workingDaysInMonth(year, month) {
  let days = 0;
  for (let day = 1; day <= new Date(year, month, 0).getDate(); day += 1) {
    const weekday = new Date(year, month - 1, day).getDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return days;
}

export default function Payroll() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState({});
  const [roleStructures, setRoleStructures] = useState({});
  const [experienceSlabs, setExperienceSlabs] = useState(experienceSlabDefaults);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [runs, setRuns] = useState([]);
  const [details, setDetails] = useState([]);
  const [period, setPeriod] = useState(thisMonth);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All departments");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [editMenuEmployee, setEditMenuEmployee] = useState(null);
  const [experienceOnly, setExperienceOnly] = useState(false);
  const [roleEditing, setRoleEditing] = useState(null);
  const [slabEditing, setSlabEditing] = useState(false);
  const [slabDraft, setSlabDraft] = useState(experienceSlabDefaults);
  const [roleDraft, setRoleDraft] = useState({ role: "", ...Object.fromEntries(salaryComponentKeys.map((key) => [key, 0])) });
  const [payslip, setPayslip] = useState(null);
  const [draft, setDraft] = useState({});
  const [sort, setSort] = useState({ key: "employee_name", direction: "asc" });

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    const saved = readPayroll();
    setEmployees(readEmployeeRecords().filter((employee) => String(employee.status || "active").toLowerCase() === "active"));
    setStructures(saved.structures || {});
    setRoleStructures(saved.roleStructures || {});
    setExperienceSlabs(saved.experienceSlabs || experienceSlabDefaults);
    setRevisionHistory(saved.revisionHistory || []);
    setRuns(saved.runs || []);
    setLoading(false);
  }, []);

  const loadDetails = useCallback(async () => {
    const run = runs.find((row) => row.pay_period === period);
    if (!run) { setDetails([]); return; }
    setDetails(readPayroll().details.filter((row) => row.payroll_run_id === run.id));
  }, [period, runs]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadDetails(); }, [loadDetails]);

  const actualRun = runs.find((row) => row.pay_period === period);
  const demoMode = runs.length === 0;
  const displayRuns = demoMode ? payrollDemoRuns : runs;
  const run = displayRuns.find((row) => row.pay_period === period) || displayRuns[0];
  const displayDetails = demoMode ? payrollDemoDetails.filter((row) => row.payroll_run_id === run?.id) : details;
  const departments = useMemo(() => [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(), [employees]);
  const filtered = useMemo(() => {
    const source = displayDetails.map((row) => ({ ...row, employee: row.employee || employees.find((item) => String(item.id) === String(row.employee_id)) }));
    const needle = search.trim().toLowerCase();
    return source.filter((row) => {
      const employee = row.employee || {};
      return (!needle || `${row.employee_name} ${row.employee_code || row.employee_id} ${employee.department || ""}`.toLowerCase().includes(needle)) && (dept === "All departments" || employee.department === dept) && (status === "All statuses" || row.payment_status === status);
    }).sort((a, b) => {
      const av = a[sort.key] ?? a.employee?.[sort.key] ?? ""; const bv = b[sort.key] ?? b.employee?.[sort.key] ?? "";
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
    });
  }, [displayDetails, employees, search, dept, status, sort]);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totals = displayDetails.reduce((acc, row) => ({ gross: acc.gross + Number(row.gross_salary || 0), deductions: acc.deductions + Number(row.total_deductions || 0), net: acc.net + Number(row.net_salary || 0), paid: acc.paid + (row.payment_status === "Paid" ? Number(row.net_salary || 0) : 0), pending: acc.pending + (["Pending", "Processing", "Failed"].includes(row.payment_status) ? Number(row.net_salary || 0) : 0) }), { gross: 0, deductions: 0, net: 0, paid: 0, pending: 0 });
  const monthlyEstimate = employees.reduce((sum, employee) => {
    const structure = structures[String(employee.id)] || { basic_salary: employee.salary || 0 };
    return sum + calculate(structure, 1, 1).gross;
  }, 0);

  const beginRun = async () => {
    if (actualRun) { setNotice("A payroll run already exists for this pay period."); return; }
    if (!employees.length) { setError("No active employees were found to process."); return; }
    setBusy(true); setError(""); setNotice("");
    const [year, month] = period.slice(0, 7).split("-").map(Number);
    const workDays = workingDaysInMonth(year, month);
    const saved = readPayroll();
    const created = { id: crypto.randomUUID(), pay_period: period, status: "draft", employee_count: employees.length, working_days: workDays, created_at: new Date().toISOString() };
    const rows = employees.map((employee) => {
      const structure = structures[String(employee.id)] || { basic_salary: Number(employee.salary || 0) };
      const sums = calculate(structure, workDays, workDays);
      return { payroll_run_id: created.id, employee_id: employee.id, employee_name: employee.name || "Employee", employee_code: employee.employee_id || employee.id, working_days: workDays, paid_days: workDays, lop_days: 0, gross_salary: sums.gross, total_deductions: sums.deductions, net_salary: sums.net, payment_status: "Pending", earnings_breakdown: sums.earnings, deductions_breakdown: sums.deductionsBreakdown, salary_component_config: sums.configurations };
    });
    const insertedDetails = rows.map((row) => ({ ...row, id: crypto.randomUUID() }));
    const componentRows = [];
    insertedDetails?.forEach((detail) => {
      const structure = structures[String(detail.employee_id)] || { basic_salary: employees.find((employee) => String(employee.id) === String(detail.employee_id))?.salary || 0 };
      const sums = calculate(structure, detail.paid_days, detail.working_days);
      Object.entries(sums.earnings).filter(([, amount]) => amount > 0).forEach(([component_name, amount]) => componentRows.push({ payroll_detail_id: detail.id, component_name, amount }));
      Object.entries(sums.deductionsBreakdown).filter(([, amount]) => amount > 0).forEach(([component_name, amount]) => componentRows.push({ payroll_detail_id: detail.id, component_name, amount, type: "deduction" }));
    });
    const earningsRows = componentRows.filter((item) => !item.type).map((item) => { const next = { ...item }; delete next.type; return next; });
    const deductionRows = componentRows.filter((item) => item.type).map((item) => { const next = { ...item }; delete next.type; return next; });
    insertedDetails.forEach((row) => { row.earnings = earningsRows.filter((item) => item.payroll_detail_id === row.id); row.deductions = deductionRows.filter((item) => item.payroll_detail_id === row.id); });
    savePayroll({ ...saved, runs: [...saved.runs, created], details: [...saved.details, ...insertedDetails] });
    setNotice("Payroll preview created. Review the employee amounts, then approve the run."); await refresh(); setBusy(false); setTab("Processing");
  };

  const finalizeRun = async () => {
    if (!actualRun || actualRun.status === "approved" || actualRun.status === "finalized") return;
    if (!window.confirm(`Approve and finalize payroll for ${period.slice(0, 7)}? This locks the payroll run for editing.`)) return;
    setBusy(true); setError("");
    const saved = readPayroll();
    savePayroll({ ...saved, runs: saved.runs.map((item) => item.id === run.id ? { ...item, status: "approved", approved_at: new Date().toISOString() } : item) });
    setNotice("Payroll run approved. Payments remain pending until payment is verified."); await refresh();
    setBusy(false);
  };

  const recordRevision = (saved, previous, updated, reason = "Salary structure updated") => ({ ...saved, revisionHistory: [{ id: crypto.randomUUID(), previousExperience: experienceLabel(previous || {}, editing), updatedExperience: experienceLabel(updated || {}, editing), previousStructure: previous || {}, updatedStructure: updated || {}, changedBy: "Current administrator", changedAt: new Date().toISOString(), effectiveDate: updated?.effective_date || new Date().toISOString().slice(0, 10), reason }, ...(saved.revisionHistory || [])] });

  const updateComponent = (setter, key, value) => {
    setter((current) => {
      const next = { ...current, [key]: value };
      const validation = validateSalaryStructure(next);
      setError(validation.valid ? "" : Object.values(validation.errors)[0]);
      return next;
    });
  };

  const saveExperience = async (event) => {
    event.preventDefault();
    const employeeId = String(editing.id);
    const previous = structures[employeeId] || {};
    const updated = { ...previous, experience_years: Number(draft.experience_years) || 0, experience_months: Math.min(11, Number(draft.experience_months) || 0), salary_structure_name: draft.salary_structure_name || previous.salary_structure_name || "", effective_date: draft.effective_date || new Date().toISOString().slice(0, 10), status: draft.status || "Active" };
    const saved = readPayroll();
    savePayroll(recordRevision({ ...saved, structures: { ...saved.structures, [employeeId]: updated } }, previous, updated, "Experience updated"));
    try { await supabase.from("salary_structures").update({ experience_years: updated.experience_years, experience_months: updated.experience_months, salary_structure_name: updated.salary_structure_name, effective_date: updated.effective_date, status: updated.status }).eq("employee_id", employeeId); } catch { /* local payroll state remains available when the optional migration is not applied */ }
    setStructures((current) => ({ ...current, [employeeId]: updated })); setNotice("Experience updated and revision history recorded."); setEditing(null); setExperienceOnly(false); await refresh();
  };

  const saveStructure = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const { employee_id, ...values } = draft;
    delete values.role;
    const previous = structures[String(employee_id)] || {};
    const validation = validateSalaryStructure(values);
    if (!validation.valid) { setError(Object.values(validation.errors)[0]); setBusy(false); return; }
    const serialized = serializeSalaryStructure(values);
    const payload = { employee_id, ...serialized };
    const saved = readPayroll();
    savePayroll(recordRevision({ ...saved, structures: { ...saved.structures, [String(employee_id)]: payload } }, previous, payload));
    try { await supabase.from("salary_structures").upsert({ employee_id, ...serialized.numericValues, ...Object.fromEntries(Object.entries(payload).filter(([key]) => ![...salaryComponentKeys, "numericValues", "component_config"].includes(key))), component_config: serialized.component_config }); } catch { /* local payroll state remains available when Supabase is unavailable */ }
    setNotice(experienceOnly ? "Experience updated and revision history recorded." : "Salary structure saved."); setEditing(null); setExperienceOnly(false); await refresh();
    setBusy(false);
  };

  const openRoleEditor = (kind, roleId, role, structure) => {
    setRoleEditing({ kind, roleId, role, structure });
    setRoleDraft({ role, ...Object.fromEntries(salaryComponentKeys.map((key) => [key, structure[key] || 0])) });
  };

  const saveRoleStructure = async (event) => {
    event.preventDefault();
    if (!roleDraft.role.trim()) { setError("Enter a role before saving the salary structure."); return; }
    const roleId = roleEditing?.roleId || `role-${crypto.randomUUID()}`;
    const existing = roleEditing?.kind === "employee" ? structures[roleId] || {} : roleStructures[roleId] || {};
    const roleValues = Object.fromEntries(salaryComponentKeys.map((key) => [key, roleDraft[key]]));
    const validation = validateSalaryStructure(roleValues);
    if (!validation.valid) { setError(Object.values(validation.errors)[0]); return; }
    const nextStructure = { ...existing, ...serializeSalaryStructure(roleValues), ...(roleEditing?.kind === "employee" ? { job_role: roleDraft.role.trim() } : { role: roleDraft.role.trim() }) };
    const saved = readPayroll();
    if (roleEditing?.kind === "employee") {
      savePayroll({ ...saved, structures: { ...saved.structures, [roleId]: nextStructure } });
      setStructures((current) => ({ ...current, [roleId]: nextStructure }));
    } else {
      savePayroll({ ...saved, roleStructures: { ...(saved.roleStructures || {}), [roleId]: nextStructure } });
      setRoleStructures((current) => ({ ...current, [roleId]: nextStructure }));
    }
    setNotice(roleEditing ? "Role salary structure updated." : "Role salary structure added.");
    setRoleEditing(null);
  };

  const updatePayment = async (row, nextStatus) => {
    if (nextStatus === "Paid") {
      if (!window.confirm("Confirm that you verified this payment against a completed bank or payment transaction?")) return;
      const reference = window.prompt("Enter the verified transaction reference to confirm this payment:");
      if (!reference?.trim()) return;
      const method = window.prompt("Payment method (for example, bank transfer):", "Bank transfer");
      const saved = readPayroll();
      saved.payments[row.id] = { status: "Paid", transaction_reference: reference.trim(), payment_method: method || "Bank transfer", payment_date: new Date().toISOString().slice(0, 10) };
      savePayroll(saved);
    }
    const saved = readPayroll();
    savePayroll({ ...saved, details: saved.details.map((item) => item.id === row.id ? { ...item, payment_status: nextStatus } : item) });
    await loadDetails();
  };

  const openPayslip = async (row) => {
    const saved = readPayroll();
    const payslips = [...(saved.payslips || []).filter((item) => item.payroll_detail_id !== row.id), { payroll_detail_id: row.id, issued_at: new Date().toISOString() }];
    savePayroll({ ...saved, payslips });
    setPayslip({ ...row, payment: saved.payments[row.id], earnings: row.earnings || [], deductions: row.deductions || [] });
  };

  const downloadPayslip = () => {
    if (!payslip) return;
    const pdf = new jsPDF();
    pdf.setFontSize(19); pdf.text("PAYSLIP", 18, 20);
    pdf.setFontSize(11); pdf.text("Company payroll statement", 18, 29);
    pdf.text(`Employee: ${payslip.employee_name}`, 18, 45);
    pdf.text(`Employee ID: ${payslip.employee_code || payslip.employee_id}`, 18, 53);
    pdf.text(`Pay period: ${period.slice(0, 7)}`, 18, 61);
    pdf.text(`Working days: ${payslip.working_days}   Paid days: ${payslip.paid_days}`, 18, 69);
    pdf.text(`Gross salary: ${money(payslip.gross_salary)}`, 18, 83);
    pdf.text(`Total deductions: ${money(payslip.total_deductions)}`, 18, 91);
    pdf.setFontSize(14); pdf.text(`Net pay: ${money(payslip.net_salary)}`, 18, 105);
    pdf.setFontSize(10); pdf.text(`Payment status: ${payslip.payment_status}`, 18, 116);
    if (payslip.payment) pdf.text(`Payment: ${payslip.payment.payment_date || ""} | ${payslip.payment.payment_method || ""} | ${payslip.payment.transaction_reference || ""}`, 18, 124);
    pdf.save(`payslip-${payslip.employee_code || payslip.employee_id}-${period.slice(0, 7)}.pdf`);
  };

  const exportCsv = () => {
    downloadCsv(
      `payroll-${period.slice(0, 7)}.csv`,
      ["Employee", "Employee ID", "Department", "Pay period", "Working days", "Paid days", "Gross salary", "Deductions", "Net salary", "Payment status"],
      filtered.map((row) => [row.employee_name, row.employee_code || row.employee_id, row.employee?.department || "", period.slice(0, 7), row.working_days, row.paid_days, row.gross_salary, row.total_deductions, row.net_salary, row.payment_status])
    );
  };

  return <main className="payroll-page payroll-module">
    <header className="payroll-header"><div><span className="payroll-eyebrow">PEOPLE OPERATIONS</span><h1>Payroll Management</h1><p>Manage salary structures, payroll runs, payslips, and payments.</p></div><div className="payroll-header-tools"><label className="payroll-period">Pay period <input type="month" value={period.slice(0, 7)} onChange={(event) => { setPeriod(`${event.target.value}-01`); setPage(1); }} /></label><button className="payroll-action secondary" onClick={exportCsv}><Download size={15} /> Export CSV</button><button className="payroll-action secondary" onClick={refresh} disabled={loading}><RefreshCw size={15} /> Refresh</button></div></header>
    <nav className="payroll-tabs">{["Overview", "Processing", "Salary structures", "History"].map((item) => <button key={item} className={`tab ${tab === item ? "active" : ""}`} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}</nav>
    {error && <div className="payroll-alert error" role="alert">{error}</div>}{notice && <div className="payroll-alert success" role="status">{notice}</div>}
    {loading ? <div className="payroll-state"><span className="payroll-spinner" /> Loading payroll records…</div> : <>
      {tab === "Overview" && <>
        <section className="payroll-overview-cards">
          {[{ label: "Active employees", value: employees.length, tone: "mint", filter: "Employees" }, { label: "Monthly payroll", value: money(run ? totals.gross : monthlyEstimate), tone: "blue", filter: "Monthly Payroll" }, { label: "Salary paid", value: money(totals.paid), tone: "green", filter: "Paid" }, { label: "Pending payments", value: money(totals.pending), tone: "orange", filter: "Pending" }, { label: "Total deductions", value: money(totals.deductions), tone: "purple", filter: "Deductions" }, { label: "Payroll status", value: run?.status ? run.status.replace(/^./, (letter) => letter.toUpperCase()) : "Not processed", tone: run?.status === "approved" ? "green" : "orange", filter: "Payroll Status" }].map((metric) => <button type="button" key={metric.label} className={`payroll-stat-card ${metric.tone}`} onClick={() => navigate(`/admin/payroll/records?filter=${encodeURIComponent(metric.filter)}`)} aria-label={`Open ${metric.label} details`}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.label === "Payroll status" ? period.slice(0, 7) : "View details"}</small></button>)}
        </section>
        <section className="payroll-panel"><div className="payroll-section-heading"><div><h2>Employee salary details</h2><p>Current structures and calculated payroll for {period.slice(0, 7)}.</p></div><button className="payroll-action" onClick={() => setTab("Salary structures")}>Manage structures</button></div>
          <div className="payroll-table-scroll"><table className="payroll-table"><thead><tr>{["Employee", "ID", "Department", "Designation", "Basic", "Gross", "Deductions", "Net", "Actions"].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{employees.map((employee) => { const salary = structures[String(employee.id)] || { basic_salary: employee.salary || 0 }; const amounts = calculate(salary, 1, 1); return <tr key={employee.id}><td><span className="payroll-employee"><i>{initials(employee.name)}</i><b>{employee.name}</b></span></td><td>{employee.employee_id || employee.id}</td><td>{employee.department || "—"}</td><td>{employee.designation || employee.role || "—"}</td><td>{money(salary.basic_salary)}</td><td>{money(amounts.gross)}</td><td className="payroll-deduction">{money(amounts.deductions)}</td><td className="payroll-net-salary">{money(amounts.net)}</td><td><button className="payroll-icon-action" title="Edit salary structure" onClick={() => { setDraft({ employee_id: employee.id, ...Object.fromEntries(["basic_salary", "hra", "da", "conveyance", "medical", "special_allowance", "bonus", "incentives", "pf", "esi", "professional_tax", "tds", "loan_advance", "other_deductions"].map((key) => [key, salary[key] || 0])) }); setEditing(employee); }}><Pencil size={15} /></button></td></tr>; })}{!employees.length && <tr><td colSpan="9" className="payroll-empty">No active employee records found.</td></tr>}</tbody></table></div>
        </section>
      </>}
      {tab === "Processing" && <section className="payroll-panel"><div className="payroll-section-heading"><div><h2>Monthly payroll processing</h2><p>Build a preview for the selected pay period and approve it after review.</p>{demoMode && <span className="payroll-demo-note">DEMO DATA · Sample records are isolated and not saved to payroll storage.</span>}</div><button className="payroll-action" onClick={beginRun} disabled={busy || Boolean(actualRun)}><Play size={15} />{busy ? "Preparing…" : actualRun ? "Run already exists" : "Generate preview"}</button></div><div className="payroll-process-summary"><div><span>Pay period</span><strong>{period.slice(0, 7)}</strong></div><div><span>Eligible active employees</span><strong>{run?.employee_count || employees.length}</strong></div><div><span>Working days (Mon–Fri)</span><strong>{run?.working_days || workingDaysInMonth(Number(period.slice(0, 4)), Number(period.slice(5, 7)))}</strong></div><div><span>Run status</span><strong>{run?.status || "Not generated"}</strong></div></div><p className="payroll-note">Attendance and approved leave integration requires the corresponding Supabase tables. This preview uses the full standard working day count until those records are connected; no leave or LOP is inferred.</p>{actualRun && <div className="payroll-approval"><span>Review the preview table below before approving this run.</span><button className="payroll-action" onClick={finalizeRun} disabled={busy || ["approved", "finalized"].includes(actualRun.status)}>{["approved", "finalized"].includes(actualRun.status) ? "Approved" : "Approve and finalize"}</button></div>}</section>}
      {(tab === "Processing" || tab === "History") && <section className="payroll-panel"><div className="payroll-section-heading"><div><h2>{tab === "History" ? "Payroll history and reports" : "Payroll employee table"}</h2><p>{tab === "History" ? `${displayRuns.length} payroll run${displayRuns.length === 1 ? "" : "s"} recorded.` : `${displayDetails.length} payroll details for this run.`}</p></div><button className="payroll-action secondary" onClick={exportCsv}><Download size={15} /> Export CSV</button></div>
        {tab === "History" && <div className="payroll-history-list">{displayRuns.length ? <>{demoMode && <div className="payroll-demo-note">DEMO DATA · Historical examples are shown separately because no saved payroll runs exist yet.</div>}{displayRuns.map((item) => <button key={item.id} className={`payroll-history-item ${item.pay_period === period ? "selected" : ""}`} onClick={() => setPeriod(item.pay_period)}><span><b>{item.pay_period?.slice(0, 7)}</b><small>{item.employee_count || 0} employees</small></span><span className={`payroll-status ${item.status}`}>{item.status}</span></button>)}</> : <div className="payroll-empty">No payroll history yet. Generate a payroll preview to start a pay period.</div>}</div>}
        <div className="payroll-toolbar"><label className="payroll-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search employees…" /></label><select value={dept} onChange={(event) => { setDept(event.target.value); setPage(1); }}><option>All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option>All statuses</option>{["Paid", "Pending", "Processing", "Failed"].map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="payroll-table-scroll"><table className="payroll-table"><thead><tr>{[["employee_name", "Employee"], ["employee_code", "Employee ID"], ["department", "Department"], ["pay_period", "Pay period"], ["working_days", "Working days"], ["paid_days", "Paid days"], ["gross_salary", "Gross"], ["total_deductions", "Deductions"], ["net_salary", "Net salary"], ["payment_status", "Status"]].map(([key, label]) => <th key={key}><button className="payroll-sort" onClick={() => setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }))}>{label} ↕</button></th>)}<th>Actions</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td><span className="payroll-employee"><i>{initials(row.employee_name)}</i><b>{row.employee_name}</b></span></td><td>{row.employee_code || row.employee_id}</td><td>{row.employee?.department || "—"}</td><td>{period.slice(0, 7)}</td><td>{row.working_days}</td><td>{row.paid_days}</td><td>{money(row.gross_salary)}</td><td className="payroll-deduction">{money(row.total_deductions)}</td><td className="payroll-net-salary">{money(row.net_salary)}</td><td><span className={`payroll-status ${String(row.payment_status).toLowerCase()}`}>{row.payment_status}</span></td><td><div className="payroll-row-actions"><button className="payroll-icon-action" title="View payslip" onClick={() => openPayslip(row)}><FileText size={15} /></button>{row.payment_status !== "Paid" && <select aria-label="Update payment status" value={row.payment_status} onChange={(event) => updatePayment(row, event.target.value)}><option>Pending</option><option>Processing</option><option>Failed</option><option>Paid</option></select>}</div></td></tr>)}{!visible.length && <tr><td colSpan="11" className="payroll-empty">{run ? "No employees match these filters." : "No payroll run for this pay period. Generate a preview to begin."}</td></tr>}</tbody></table></div><footer className="payroll-table-footer"><span>{filtered.length} employees</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></footer>
      </section>}
      {tab === "Salary structures" && <section className="payroll-panel"><div className="payroll-section-heading"><div><h2>Salary structures</h2><p>Role, experience, configured components, and calculated totals. Employee names and IDs remain hidden in this view.</p><span className="payroll-demo-note">Experience slabs are policy configuration. Statutory deductions remain separately configurable.</span></div></div><div className="payroll-table-scroll"><table className="payroll-table payroll-experience-table"><thead><tr><th>Role / Designation</th><th>Experience</th><th>Basic</th><th>DA</th><th>HRA</th><th>Other allowances</th><th>PF</th><th>Other deductions</th><th>Gross</th><th>Net</th><th>Effective date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{employees.map((employee) => { const s = structures[String(employee.id)] || { basic_salary: employee.salary || 0 }; const sums = calculate(s, 1, 1); const jobRole = s.job_role || employee.designation || employee.jobRole || employee.role || "—"; const slab = applicableSlab(s, employee, experienceSlabs); const otherAllowances = ["conveyance", "medical", "special_allowance", "bonus", "incentives"].reduce((sum, key) => sum + (sums.componentAmounts[key] || 0), 0); const otherDeductions = ["professional_tax", "tds", "loan_advance", "other_deductions"].reduce((sum, key) => sum + (sums.componentAmounts[key] || 0), 0); const openStructureEditor = () => { setEditMenuEmployee(null); setExperienceOnly(false); setDraft({ employee_id: employee.id, role: jobRole, experience_years: s.experience_years ?? employee.experience_years ?? 0, experience_months: s.experience_months ?? employee.experience_months ?? 0, salary_structure_name: s.salary_structure_name || "", effective_date: s.effective_date || new Date().toISOString().slice(0, 10), status: s.status || "Active", ...Object.fromEntries(salaryComponentKeys.map((key) => [key, s[key] ?? 0])) }); setEditing(employee); }; const openExperienceEditor = () => { setEditMenuEmployee(null); setExperienceOnly(true); setDraft({ employee_id: employee.id, role: jobRole, experience_years: s.experience_years ?? employee.experience_years ?? 0, experience_months: s.experience_months ?? employee.experience_months ?? 0, salary_structure_name: s.salary_structure_name || "", effective_date: s.effective_date || new Date().toISOString().slice(0, 10), status: s.status || "Active", ...Object.fromEntries(salaryComponentKeys.map((key) => [key, s[key] ?? 0])) }); setEditing(employee); }; return <tr key={employee.id}><td><strong>{jobRole}</strong><small>{s.salary_structure_name || "Employee salary structure"}</small></td><td>{experienceLabel(s, employee)}{slab && <small>{slab.label} slab</small>}</td><td>{money(sums.componentAmounts.basic_salary)}</td><td>{money(sums.componentAmounts.da)}</td><td>{money(sums.componentAmounts.hra)}</td><td>{money(otherAllowances)}</td><td>{money(sums.componentAmounts.pf)}</td><td>{money(otherDeductions)}</td><td>{money(sums.gross)}</td><td>{money(sums.net)}</td><td>{s.effective_date || "—"}</td><td><span className={`payroll-status ${s.status === "Inactive" ? "failed" : "approved"}`}>{s.status || "Active"}</span></td><td><div className="payroll-role-actions payroll-edit-menu-wrap"><button type="button" className="payroll-icon-action" title="Edit employee salary details" aria-label="Edit employee salary details" aria-expanded={editMenuEmployee === String(employee.id)} onClick={() => setEditMenuEmployee((current) => current === String(employee.id) ? null : String(employee.id))}><Pencil size={15} /></button>{editMenuEmployee === String(employee.id) && <div className="payroll-edit-menu"><button type="button" onClick={openStructureEditor}>Edit salary</button><button type="button" onClick={openExperienceEditor}>Edit experience</button><button type="button" onClick={() => { setEditMenuEmployee(null); openRoleEditor("employee", String(employee.id), jobRole, s); }}>Edit role</button></div>}</div></td></tr>; })}{!employees.length && !Object.keys(roleStructures).length && <tr><td colSpan="13" className="payroll-empty">No salary structures found.</td></tr>}</tbody></table></div></section>}
      {tab === "Salary structures" && <section className="payroll-panel payroll-demo-structures"><div className="payroll-section-heading"><div><h2>Demonstration salary structures</h2><p>Sample values for UI demonstration only. These records are not saved and cannot overwrite actual payroll data.</p></div><span className="payroll-demo-badge">DEMO DATA</span></div><div className="payroll-table-scroll"><table className="payroll-table"><thead><tr><th>Role</th><th>Basic salary</th><th>HRA</th><th>Allowances</th><th>Deductions</th><th>Gross salary</th><th>Net salary</th></tr></thead><tbody>{salaryStructureDemoRecords.map(([role, basic, hra, allowances, deductions, gross, net]) => <tr key={role}><td><strong>{role}</strong></td><td>{money(basic)}</td><td>{money(hra)}</td><td>{money(allowances)}</td><td className="payroll-deduction">{money(deductions)}</td><td>{money(gross)}</td><td className="payroll-net-salary">{money(net)}</td></tr>)}</tbody></table></div></section>}
      {tab === "Salary structures" && <section className="payroll-panel payroll-add-role-kpi"><button type="button" onClick={() => { setRoleEditing({ roleId: null, role: "", structure: {} }); setRoleDraft({ role: "", ...Object.fromEntries(salaryComponentKeys.map((key) => [key, 0])) }); }}><span>Add Role</span><strong>{Object.keys(roleStructures).length}</strong><small>{Object.keys(roleStructures).length === 1 ? "role structure" : "role structures"} configured · Click to add</small></button></section>}
      {tab === "History" && demoMode && <section className="payroll-panel"><div className="payroll-section-heading"><div><h2>Demo payroll history summaries</h2><p>Gross, deductions, net salary and payment status for sample months.</p></div><span className="payroll-demo-badge">DEMO DATA</span></div><div className="payroll-table-scroll"><table className="payroll-table"><thead><tr><th>Payroll month</th><th>Employees paid</th><th>Gross salary</th><th>Deductions</th><th>Net salary</th><th>Payment date</th><th>Status</th></tr></thead><tbody>{displayRuns.map((item) => <tr key={`summary-${item.id}`}><td>{item.pay_period.slice(0, 7)}</td><td>{item.employee_count}</td><td>{money(item.total_gross)}</td><td className="payroll-deduction">{money(item.total_deductions)}</td><td className="payroll-net-salary">{money(item.total_net)}</td><td>{item.payment_date}</td><td><span className={`payroll-status ${item.status}`}>{item.status}</span></td></tr>)}</tbody></table></div></section>}
    </>}
    {editing && <div className="payroll-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><form className="payroll-modal" onSubmit={saveStructure}><div className="payroll-section-heading"><div><h2>Salary structure</h2><p>{editing.name} · {editing.employee_id || editing.id}</p></div><button type="button" className="payroll-close" onClick={() => setEditing(null)}>×</button></div><div className="payroll-fields"><label>Role<input value={draft.role || editing.role || editing.designation || ""} readOnly /></label>{[["basic_salary", "Basic salary"], ["hra", "HRA"], ["da", "DA"], ["conveyance", "Conveyance"], ["medical", "Medical allowance"], ["special_allowance", "Special allowance"], ["bonus", "Bonus"], ["incentives", "Incentives"], ["pf", "PF"], ["esi", "ESI"], ["professional_tax", "Professional tax"], ["tds", "TDS"], ["loan_advance", "Loan / advance"], ["other_deductions", "Other deductions"]].map(([key, label]) => <label key={key}>{label}<input type="text" inputMode="decimal" value={draft[key] ?? 0} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div><div className="payroll-live-total">{(() => { const amounts = calculate(draft, 1, 1); return <><span>Gross <b>{money(amounts.gross)}</b></span><span>Deductions <b>{money(amounts.deductions)}</b></span><span>Net salary <b>{money(amounts.net)}</b></span></>; })()}</div><div className="payroll-modal-actions"><button type="button" className="payroll-action secondary" onClick={() => setEditing(null)}>Cancel</button><button className="payroll-action" disabled={busy}>Save structure</button></div></form></div>}
    {payslip && <div className="payroll-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPayslip(null); }}><section className="payroll-modal payslip-modal"><div className="payslip-head"><span className="payslip-logo">HR</span><div><h2>HRMS India · Employee payslip</h2><p>Pay period {period.slice(0, 7)}</p></div><button className="payroll-close" onClick={() => setPayslip(null)}>×</button></div><div className="payslip-employee"><b>{payslip.employee_name}</b><span>{payslip.employee_code || payslip.employee_id}</span><span>{payslip.employee?.department || "Department not recorded"} · {payslip.employee?.designation || payslip.employee?.role || "—"}</span><span>Working days {payslip.working_days} · Paid days {payslip.paid_days}</span></div><div className="payslip-breakdown"><div><h3>Earnings</h3>{payslip.earnings.map((item) => <p key={item.id}><span>{item.component_name.replaceAll("_", " ")}</span><b>{money(item.amount)}</b></p>)}</div><div><h3>Deductions</h3>{payslip.deductions.map((item) => <p key={item.id}><span>{item.component_name.replaceAll("_", " ")}</span><b>{money(item.amount)}</b></p>)}</div></div><div className="payslip-amounts"><div><span>Gross salary</span><b>{money(payslip.gross_salary)}</b></div><div><span>Total deductions</span><b>{money(payslip.total_deductions)}</b></div><div className="payslip-net"><span>Net payable</span><b>{money(payslip.net_salary)}</b></div></div><p className="payslip-payment">Payment status: <strong>{payslip.payment_status}</strong>{payslip.payment && <> · {payslip.payment.payment_date} · {payslip.payment.payment_method} · Ref {payslip.payment.transaction_reference}</>}</p><div className="payroll-modal-actions"><button className="payroll-action secondary" onClick={() => window.print()}><Printer size={14} /> Print</button><button className="payroll-action" onClick={downloadPayslip}><Download size={14} /> Download PDF</button></div></section></div>}
    {roleEditing && <div className="payroll-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRoleEditing(null); }}><form className="payroll-modal role-structure-modal" onSubmit={saveRoleStructure}><div className="payroll-section-heading"><div><h2>{roleEditing.roleId ? "Edit Role Salary Structure" : "Add Role Salary Structure"}</h2><p>Configure salary components by job designation.</p></div><button type="button" className="payroll-close" onClick={() => setRoleEditing(null)}>×</button></div><div className="payroll-fields role-structure-fields"><label>Role<select required value={roleDraft.role} onChange={(event) => setRoleDraft((current) => ({ ...current, role: event.target.value }))}><option value="">Select role</option>{jobRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>{salaryComponentKeys.map((key) => <label key={key}>{key.replaceAll("_", " ")}<input type="text" inputMode="decimal" value={roleDraft[key] ?? 0} onChange={(event) => setRoleDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div><div className="payroll-modal-actions"><button type="button" className="payroll-action secondary" onClick={() => setRoleEditing(null)}>Cancel</button><button type="submit" className="payroll-action">Save Role</button></div></form></div>}
    {experienceOnly && editing && <div className="payroll-modal-backdrop" role="presentation"><form className="payroll-modal experience-modal" onSubmit={saveExperience}><div className="payroll-section-heading"><div><h2>Edit Experience</h2><p>{editing.name} · {editing.employee_id || editing.id}</p></div><button type="button" className="payroll-close" onClick={() => { setEditing(null); setExperienceOnly(false); }}>×</button></div><div className="payroll-fields"><label>Experience years<input type="number" min="0" value={draft.experience_years ?? 0} onChange={(event) => setDraft((current) => ({ ...current, experience_years: event.target.value }))} /></label><label>Experience months<input type="number" min="0" max="11" value={draft.experience_months ?? 0} onChange={(event) => setDraft((current) => ({ ...current, experience_months: event.target.value }))} /></label><label>Total experience<input readOnly value={experienceLabel(draft, editing)} /></label><label>Effective date<input type="date" required value={draft.effective_date || ""} onChange={(event) => setDraft((current) => ({ ...current, effective_date: event.target.value }))} /></label><label>Salary structure name<input value={draft.salary_structure_name || ""} onChange={(event) => setDraft((current) => ({ ...current, salary_structure_name: event.target.value }))} /></label></div><div className="payroll-slab-preview"><span>Applicable experience slab</span><strong>{applicableSlab(draft, editing, experienceSlabs)?.label || "No configured slab"}</strong><small>Slabs select policy components; statutory deductions remain independently configured.</small></div><div className="payroll-modal-actions"><button type="button" className="payroll-action secondary" onClick={() => { setEditing(null); setExperienceOnly(false); }}>Cancel</button><button className="payroll-action">Save experience</button></div></form></div>}
    {tab === "Salary structures" && <section className="payroll-panel payroll-slab-panel"><div className="payroll-section-heading"><div><h2>Experience-based salary slabs</h2><p>Configurable company policy examples. PF, ESI, PT, and TDS remain separately eligible statutory deductions.</p></div><button className="payroll-action secondary" onClick={() => { setSlabDraft(experienceSlabs.map((slab) => ({ ...slab }))); setSlabEditing(true); }}>Configure slabs</button></div><div className="payroll-table-scroll"><table className="payroll-table"><thead><tr><th>Experience range</th><th>Basic</th><th>DA</th><th>HRA</th><th>PF policy</th><th>Status</th></tr></thead><tbody>{experienceSlabs.map((slab) => <tr key={slab.id}><td>{slab.label}</td><td>{money(slab.basic_salary)}</td><td>{money(slab.da)}</td><td>{money(slab.hra)}</td><td>{slab.pf ? money(slab.pf) : "As configured"}</td><td>{slab.active === false ? "Inactive" : "Active"}</td></tr>)}</tbody></table></div></section>}
    {slabEditing && <div className="payroll-modal-backdrop" role="presentation"><form className="payroll-modal experience-modal" onSubmit={(event) => { event.preventDefault(); const saved = readPayroll(); savePayroll({ ...saved, experienceSlabs: slabDraft }); setExperienceSlabs(slabDraft); setSlabEditing(false); setNotice("Experience slabs saved. Existing payroll runs were not changed."); }}><div className="payroll-section-heading"><div><h2>Configure experience slabs</h2><p>Change company policy values without rewriting historical payroll.</p></div><button type="button" className="payroll-close" onClick={() => setSlabEditing(false)}>×</button></div><div className="payroll-slab-editor">{slabDraft.map((slab, index) => <div className="payroll-slab-row" key={slab.id}><strong>{slab.label}</strong><label>Basic<input type="number" min="0" value={slab.basic_salary} onChange={(event) => setSlabDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, basic_salary: event.target.value } : item))} /></label><label>DA<input type="number" min="0" value={slab.da} onChange={(event) => setSlabDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, da: event.target.value } : item))} /></label><label>HRA<input type="number" min="0" value={slab.hra} onChange={(event) => setSlabDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, hra: event.target.value } : item))} /></label><label>Active<select value={slab.active === false ? "false" : "true"} onChange={(event) => setSlabDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, active: event.target.value === "true" } : item))}><option value="true">Active</option><option value="false">Inactive</option></select></label></div>)}</div><div className="payroll-modal-actions"><button type="button" className="payroll-action secondary" onClick={() => setSlabEditing(false)}>Cancel</button><button className="payroll-action">Save slabs</button></div></form></div>}
    {tab === "Salary structures" && <section className="payroll-panel payroll-revision-panel"><div className="payroll-section-heading"><div><h2>Salary revision history</h2><p>Experience and component changes are recorded without rewriting processed payroll or payslips.</p></div></div>{revisionHistory.length ? <div className="payroll-revision-list">{revisionHistory.slice(0, 8).map((item) => <div className="payroll-revision-item" key={item.id}><strong>{item.reason}</strong><span>{item.previousExperience || "0 Months"} → {item.updatedExperience || "0 Months"}</span><small>{item.changedBy} · {new Date(item.changedAt).toLocaleString("en-IN")} · Effective {item.effectiveDate}</small></div>)}</div> : <div className="payroll-empty">No salary revisions recorded yet.</div>}</section>}
    {tab === "Salary structures" && Object.keys(roleStructures).length > 0 && <section className="payroll-panel"><div className="payroll-section-heading"><div><h2>Role salary templates</h2><p>Additional designation-based structures remain available for future employee assignment.</p></div></div><div className="payroll-table-scroll"><table className="payroll-table"><thead><tr><th>Role</th><th>Experience</th><th>Basic</th><th>Gross</th><th>Net</th><th>Actions</th></tr></thead><tbody>{Object.entries(roleStructures).map(([roleId, structure]) => { const sums = calculate(structure, 1, 1); return <tr key={roleId}><td><strong>{structure.role}</strong></td><td>{experienceLabel(structure)}</td><td>{money(structure.basic_salary)}</td><td>{money(sums.gross)}</td><td>{money(sums.net)}</td><td><button className="payroll-action secondary payroll-role-edit" onClick={() => openRoleEditor("role", roleId, structure.role, structure)}>Edit Role</button></td></tr>; })}</tbody></table></div></section>}
  </main>;
}
