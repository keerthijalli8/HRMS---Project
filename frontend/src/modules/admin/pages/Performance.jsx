import { useState } from "react";
import {
  Award,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Star,
  Target,
  Users,
} from "lucide-react";
import { MetricCard, PageHeader, SectionCard, StatusBadge } from "../components/ModulePrimitives";
import { useKpiFilter, useKpiNavigation, useKpiScopedState } from "../hooks/useKpiNavigation";
import "../style/Modules.css";

const initialEmployees = [
  { id: "EMP001", name: "Rahul Sharma", department: "Technology", designation: "Project Manager", manager: "Anita Rao", rating: 4.8, status: "Completed", lastReview: "Oct 18, 2026" },
  { id: "EMP002", name: "Priya Reddy", department: "Human Resources", designation: "HR Executive", manager: "Meera Nair", rating: 4.5, status: "Completed", lastReview: "Oct 16, 2026" },
  { id: "EMP003", name: "Kiran Kumar", department: "Finance", designation: "Software Developer", manager: "Rahul Sharma", rating: 3.1, status: "Pending", lastReview: "Apr 12, 2026" },
  { id: "EMP004", name: "Sneha Patel", department: "Technology", designation: "Team Lead", manager: "Rahul Sharma", rating: 4.7, status: "Completed", lastReview: "Oct 14, 2026" },
  { id: "EMP005", name: "Arjun Rao", department: "Marketing", designation: "Marketing Specialist", manager: "Priya Reddy", rating: 3.8, status: "Pending", lastReview: "Apr 10, 2026" },
  { id: "EMP006", name: "Ananya Das", department: "Operations", designation: "Operations Associate", manager: "Vikram Singh", rating: 2.7, status: "Pending", lastReview: "Mar 29, 2026" },
];

const initialGoals = [
  { id: 1, employee: "Rahul Sharma", title: "Complete leadership development program", due: "2026-12-15", progress: 75, status: "In Progress" },
  { id: 2, employee: "Sneha Patel", title: "Ship employee self-service improvements", due: "2026-11-30", progress: 100, status: "Completed", completionDate: "Nov 05, 2026" },
  { id: 3, employee: "Kiran Kumar", title: "Earn cloud architecture certification", due: "2027-01-20", progress: 30, status: "In Progress" },
  { id: 4, employee: "Priya Reddy", title: "Publish updated onboarding playbook", due: "2026-12-01", progress: 0, status: "Pending" },
];

const reviewPeriods = ["Quarterly", "Half-yearly", "Annual"];
const skillNames = ["Technical skills", "Communication", "Teamwork", "Productivity", "Leadership"];
const initialReviewHistory = initialEmployees.filter((employee) => employee.status === "Completed").map((employee, index) => ({
  id: `REVIEW-${index + 1}`,
  employeeId: employee.id,
  employee: employee.name,
  department: employee.department,
  manager: employee.manager,
  period: "Quarterly",
  rating: employee.rating,
  completedDate: employee.lastReview,
  ratings: null,
  managerFeedback: "",
  adminComments: "",
}));
const reportMonths = [
  { label: "Jun", score: 3.6 }, { label: "Jul", score: 3.8 }, { label: "Aug", score: 3.7 },
  { label: "Sep", score: 4.0 }, { label: "Oct", score: 4.2 }, { label: "Nov", score: 4.3 },
];

function saveCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function PerformanceOverview({ employees, onSelectEmployee }) {
  const [kpiFilter, setKpiFilter] = useKpiFilter();
  const navigateToKpi = useKpiNavigation();
  const activeCard = ["total", "completed", "pending", "average"].includes(kpiFilter) ? kpiFilter : "";
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [ratingFilter, setRatingFilter] = useState("All ratings");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useKpiScopedState(kpiFilter, 1);
  const [selectedEmployee, setSelectedEmployee] = useKpiScopedState(kpiFilter, null);
  const pageSize = 5;
  const completed = employees.filter((employee) => employee.status === "Completed").length;
  const pending = employees.length - completed;
  const average = employees.length ? (employees.reduce((sum, employee) => sum + Number(employee.rating), 0) / employees.length).toFixed(1) : "0.0";
  const top = [...employees].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const needsSupport = employees.filter((employee) => employee.rating < 3.5);
  const departments = ["All departments", ...new Set(employees.map((employee) => employee.department))];
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = `${employee.id} ${employee.name} ${employee.designation} ${employee.manager}`.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = department === "All departments" || employee.department === department;
    const matchesStatus = activeCard === "completed" ? employee.status === "Completed" : activeCard === "pending" ? employee.status === "Pending" : true;
    const matchesRating = ratingFilter === "All ratings"
      || (ratingFilter === "Below 3" && employee.rating < 3)
      || (ratingFilter === "3 to 4" && employee.rating >= 3 && employee.rating < 4)
      || (ratingFilter === "4 and above" && employee.rating >= 4);
    const reviewDate = employee.lastReview ? new Date(employee.lastReview) : null;
    const matchesFrom = !dateFrom || (reviewDate && reviewDate >= new Date(`${dateFrom}T00:00:00`));
    const matchesTo = !dateTo || (reviewDate && reviewDate <= new Date(`${dateTo}T23:59:59`));
    return matchesSearch && matchesDepartment && matchesRating && matchesFrom && matchesTo && matchesStatus;
  });
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const visibleEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  const departmentScores = departments.slice(1).map((name) => {
    const employeesInDepartment = employees.filter((employee) => employee.department === name);
    return {
      name,
      count: employeesInDepartment.length,
      average: employeesInDepartment.reduce((sum, employee) => sum + employee.rating, 0) / (employeesInDepartment.length || 1),
    };
  });
  const cardDetails = {
    total: "All employee performance records. Search or filter by department, score and review date.",
    completed: "Reviews completed with their latest review date, assigned manager and final rating.",
    pending: "Reviews waiting for evaluation. Select Complete review to open the evaluation form for that employee.",
    average: "Performance breakdown by department and employee, with monthly score comparisons.",
  };

  return (
    <>
      <div className="module-metrics">
        <MetricCard label="Total employees" value={employees.length} detail="In current review cycle" icon={Users} onClick={() => navigateToKpi("/admin/performance", "total")} active={activeCard === "total"} />
        <MetricCard label="Reviews completed" value={completed} detail={`${Math.round((completed / (employees.length || 1)) * 100)}% completion rate`} icon={CheckCircle2} tone="violet" onClick={() => navigateToKpi("/admin/performance", "completed")} active={activeCard === "completed"} />
        <MetricCard label="Reviews pending" value={pending} detail="Follow-up required" icon={CalendarDays} tone="amber" onClick={() => navigateToKpi("/admin/performance", "pending")} active={activeCard === "pending"} />
        <MetricCard label="Average score" value={`${average} / 5`} detail="Across latest employee ratings" icon={Star} onClick={() => navigateToKpi("/admin/performance", "average")} active={activeCard === "average"} />
      </div>
      {activeCard && (
        <SectionCard
          title={{ total: "Total employee performance", completed: "Completed performance reviews", pending: "Pending performance reviews", average: "Detailed performance scores" }[activeCard]}
          description={cardDetails[activeCard]}
          action={<button type="button" className="module-button secondary" onClick={() => { setKpiFilter(""); setSelectedEmployee(null); }}>Close details</button>}
          className="performance-card-detail"
        >
          {activeCard === "average" ? (
            <div className="module-grid-2">
              <div>
                <h3 className="performance-detail-title">Department-wise average score</h3>
                <div className="module-list">
                  {departmentScores.map((item) => <div key={item.name}>
                    <div className="module-list-item" style={{ marginBottom: 6 }}><div><strong>{item.name}</strong><small>{item.count} employees</small></div><strong>{item.average.toFixed(1)} / 5</strong></div>
                    <div className="module-progress"><span style={{ width: `${item.average / 5 * 100}%` }} /></div>
                  </div>)}
                </div>
              </div>
              <div>
                <h3 className="performance-detail-title">Monthly score comparison</h3>
                <div className="module-chart" role="img" aria-label="Monthly average performance score comparison">
                  {reportMonths.map((month) => <div className="module-chart-column" key={month.label}><strong>{month.score.toFixed(1)}</strong><span style={{ height: `${month.score / 5 * 100}%` }} /><small>{month.label}</small></div>)}
                </div>
                <div className="module-list" style={{ marginTop: 14 }}>
                  {[...employees].sort((a, b) => b.rating - a.rating).map((employee) => <div className="module-list-item" key={employee.id}><div><strong>{employee.name}</strong><small>{employee.department}</small></div><StatusBadge tone={employee.rating < 3 ? "needs-improvement" : "completed"}>{employee.rating.toFixed(1)} / 5</StatusBadge></div>)}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="performance-filter-bar">
                <label className="performance-search"><Search size={15} aria-hidden="true" /><input className="module-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search employee, ID or designation" aria-label="Search performance employees" /></label>
                <select className="module-select" aria-label="Filter performance employees by department" value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }}>
                  {departments.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select className="module-select" aria-label="Filter employees by performance rating" value={ratingFilter} onChange={(event) => { setRatingFilter(event.target.value); setPage(1); }}>
                  {["All ratings", "Below 3", "3 to 4", "4 and above"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <label className="performance-date-filter">From<input className="module-input" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="Review date from" /></label>
                <label className="performance-date-filter">To<input className="module-input" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="Review date to" /></label>
              </div>
              {selectedEmployee && <div className="module-notice performance-selected-detail">
                <div><strong>{selectedEmployee.name} · {selectedEmployee.id}</strong><span>{selectedEmployee.department} · {selectedEmployee.designation} · Manager: {selectedEmployee.manager}</span><span>Current rating: {selectedEmployee.rating.toFixed(1)} / 5 · Review status: {selectedEmployee.status} · Last review: {selectedEmployee.lastReview}</span></div>
                <button type="button" className="module-button secondary" onClick={() => setSelectedEmployee(null)}>Close</button>
              </div>}
              <div className="module-table-wrap"><table className="module-table">
                <thead><tr><th>Employee ID</th><th>Employee name</th><th>Department</th><th>Designation</th><th>Performance score</th><th>Review status</th>{activeCard !== "total" && <th>{activeCard === "completed" ? "Review date" : "Assigned manager"}</th>}<th>Details</th></tr></thead>
                <tbody>{visibleEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td><td><strong>{employee.name}</strong></td><td>{employee.department}</td><td>{employee.designation}</td>
                    <td>{employee.rating.toFixed(1)} / 5</td><td><StatusBadge>{employee.status}</StatusBadge></td>
                    {activeCard !== "total" && <td>{activeCard === "completed" ? employee.lastReview : employee.manager}</td>}
                    <td><div className="performance-row-actions">
                      <button type="button" className="module-button secondary" onClick={() => setSelectedEmployee(employee)}><Eye size={13} /> View</button>
                      {(activeCard === "pending" || activeCard === "completed") && <button type="button" className="module-button" onClick={() => onSelectEmployee(employee.id)}>{activeCard === "pending" ? "Complete review" : "Edit review"}</button>}
                    </div></td>
                  </tr>
                ))}</tbody>
              </table></div>
              {visibleEmployees.length === 0 && <div className="module-empty">No employee records match these filters.</div>}
              <div className="performance-pagination">
                <span>Showing {filteredEmployees.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredEmployees.length)} of {filteredEmployees.length}</span>
                <div>
                  <button type="button" className="module-button secondary" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /> Previous</button>
                  <span>Page {page} of {pageCount}</span>
                  <button type="button" className="module-button secondary" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next <ChevronRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      )}
      {pending > 0 && <div className="module-notice"><CalendarDays size={15} /> {pending} employee reviews are awaiting evaluation. Complete them before the current cycle closes.</div>}
      <div className="module-grid-2">
        <SectionCard title="Top-performing employees" description="Highest current performance ratings">
          <div className="module-list">
            {top.map((employee, index) => (
              <div className="module-list-item" key={employee.id}>
                <div><strong>{index + 1}. {employee.name}</strong><small>{employee.department} · {employee.designation}</small></div>
                <StatusBadge tone="completed"><Star size={11} /> {employee.rating.toFixed(1)}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Employees requiring improvement" description="Consider a development plan and manager check-in">
          <div className="module-list">
            {needsSupport.length ? needsSupport.map((employee) => (
              <div className="module-list-item" key={employee.id}>
                <div><strong>{employee.name}</strong><small>{employee.department} · Manager: {employee.manager}</small></div>
                <StatusBadge tone="needs-improvement">{employee.rating.toFixed(1)} / 5</StatusBadge>
              </div>
            )) : <div className="module-empty">No employees currently require additional support.</div>}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Employee performance tracking" description="Latest review status and reporting relationships">
        <div className="module-table-wrap">
          <table className="module-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Reporting manager</th><th>Rating</th><th>Review status</th><th>Last review</th></tr></thead>
            <tbody>{employees.map((employee) => (
              <tr key={employee.id}>
                <td><strong>{employee.name}</strong><small>{employee.id}</small></td>
                <td>{employee.department}</td><td>{employee.designation}</td><td>{employee.manager}</td>
                <td><strong>{employee.rating.toFixed(1)}</strong> / 5</td><td><StatusBadge>{employee.status}</StatusBadge></td><td>{employee.lastReview}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </SectionCard>
      <div className="module-grid-2" style={{ marginTop: 14 }}>
        <SectionCard title="Review schedule" description="Quarterly, half-yearly and annual cycles">
          <div className="module-list">
            {reviewPeriods.map((period, index) => (
              <div className="module-list-item" key={period}>
                <div><strong>{period} review</strong><small>{["Q4 · Oct–Dec", "H2 · Jul–Dec", "FY 2026"][index]}</small></div>
                <StatusBadge tone={index === 0 ? "in-progress" : "pending"}>{index === 0 ? "In Progress" : "Upcoming"}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Review history" description="Most recently completed evaluations">
          <div className="module-list">
            {employees.filter((employee) => employee.status === "Completed").slice(0, 3).map((employee) => (
              <div className="module-list-item" key={employee.id}>
                <div><strong>{employee.name}</strong><small>{employee.lastReview} · Quarterly review</small></div>
                <StatusBadge tone="completed">Completed</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function EvaluationPage({ employees, reviews, selectedEmployeeId, onSave }) {
  const [selectedId, setSelectedId] = useState(selectedEmployeeId || employees[0]?.id || "");
  const initialReview = reviews.find((review) => review.employeeId === (selectedEmployeeId || employees[0]?.id));
  const initialEmployee = employees.find((employee) => employee.id === (selectedEmployeeId || employees[0]?.id));
  const [period, setPeriod] = useState(initialReview?.period || "Quarterly");
  const [ratings, setRatings] = useState(initialReview?.ratings || Object.fromEntries(skillNames.map((skill) => [skill, String(Math.round(initialEmployee?.rating || 3))])));
  const [managerFeedback, setManagerFeedback] = useState(initialReview?.managerFeedback || "");
  const [adminComments, setAdminComments] = useState(initialReview?.adminComments || "");
  const [message, setMessage] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const overall = Object.values(ratings).reduce((sum, score) => sum + Number(score), 0) / skillNames.length;
    onSave(selectedId, overall, {
      period,
      managerFeedback,
      adminComments,
      ratings,
    });
    setMessage(`The ${period.toLowerCase()} performance review was saved.`);
  };

  return (
    <>
      <div className="module-grid-2">
        <SectionCard title="Performance evaluation" description="Complete and save a structured employee review">
          {message && <div className="module-notice">{message}</div>}
          <form onSubmit={submit}>
            <div className="module-form-grid">
              <div className="module-form-field">
                <label htmlFor="review-employee">Employee</label>
                <select id="review-employee" className="module-select" value={selectedId} onChange={(event) => {
                  const employeeId = event.target.value;
                  const employee = employees.find((item) => item.id === employeeId);
                  const existingReview = reviews.find((review) => review.employeeId === employeeId);
                  setSelectedId(employeeId);
                  setPeriod(existingReview?.period || "Quarterly");
                  setRatings(existingReview?.ratings || Object.fromEntries(skillNames.map((skill) => [skill, String(Math.round(employee?.rating || 3))])));
                  setManagerFeedback(existingReview?.managerFeedback || "");
                  setAdminComments(existingReview?.adminComments || "");
                }} required>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.id}</option>)}
                </select>
              </div>
              <div className="module-form-field">
                <label htmlFor="review-period">Review cycle</label>
                <select id="review-period" className="module-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
                  {reviewPeriods.map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>
            </div>
            <div className="module-review-scores">
              {skillNames.map((skill) => (
                <div className="module-form-field" key={skill}>
                  <label htmlFor={`rating-${skill}`}>{skill}</label>
                  <select id={`rating-${skill}`} className="module-select" value={ratings[skill]} onChange={(event) => setRatings((current) => ({ ...current, [skill]: event.target.value }))}>
                    {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="module-form-grid">
              <div className="module-form-field">
                <label htmlFor="manager-feedback">Manager feedback</label>
                <textarea id="manager-feedback" className="module-textarea" value={managerFeedback} onChange={(event) => setManagerFeedback(event.target.value)} placeholder="Share strengths, examples and development areas." />
              </div>
              <div className="module-form-field">
                <label htmlFor="admin-comments">Administrator comments</label>
                <textarea id="admin-comments" className="module-textarea" value={adminComments} onChange={(event) => setAdminComments(event.target.value)} placeholder="Add internal review notes." />
              </div>
            </div>
            <button type="submit" className="module-button" style={{ marginTop: 14 }}><CheckCircle2 size={15} /> Save performance review</button>
          </form>
        </SectionCard>
        <SectionCard title="Review guidance" description="Consistent, actionable feedback supports growth">
          <div className="module-list">
            {[
              ["1", "Rate each skill", "Use the same 1–5 scale and provide evidence for ratings."],
              ["2", "Add useful feedback", "Include clear strengths, opportunities and next steps."],
              ["3", "Track the outcome", "Saved reviews update the employee rating and completion status."],
            ].map(([number, title, copy]) => (
              <div className="module-list-item" key={number}><div><strong>{number}. {title}</strong><small>{copy}</small></div></div>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Completed review history" description="Recent evaluations in the current cycle">
        <div className="module-table-wrap"><table className="module-table">
          <thead><tr><th>Employee</th><th>Review cycle</th><th>Overall rating</th><th>Manager</th><th>Status</th><th>Last review</th></tr></thead>
          <tbody>{reviews.map((review) => <tr key={review.id}><td><strong>{review.employee}</strong><small>{review.employeeId}</small></td><td>{review.period}</td><td>{review.rating.toFixed(1)} / 5</td><td>{review.manager}</td><td><StatusBadge tone="completed">Completed</StatusBadge></td><td>{review.completedDate}</td></tr>)}</tbody>
        </table></div>
      </SectionCard>
    </>
  );
}

function GoalsPage({ goals, setGoals, employees }) {
  const [employee, setEmployee] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [message, setMessage] = useState("");
  const updateGoal = (id, updates) => setGoals((current) => current.map((goal) => goal.id === id ? { ...goal, ...updates } : goal));
  const createGoal = (event) => {
    event.preventDefault();
    setGoals((current) => [{ id: Date.now(), employee, title, due, progress: 0, status: "Pending" }, ...current]);
    setEmployee("");
    setTitle("");
    setDue("");
    setMessage("Goal created and assigned.");
  };

  return (
    <>
      <div className="module-grid-2">
        <SectionCard title="Create employee goal" description="Assign a measurable objective and target date">
          {message && <div className="module-notice">{message}</div>}
          <form className="module-form-grid" onSubmit={createGoal}>
            <div className="module-form-field">
              <label htmlFor="goal-employee">Employee name</label>
              <select id="goal-employee" className="module-select" value={employee} onChange={(event) => setEmployee(event.target.value)} required>
                <option value="">Select employee</option>{employees.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="module-form-field">
              <label htmlFor="goal-due">Target completion date</label>
              <input id="goal-due" className="module-input" type="date" value={due} onChange={(event) => setDue(event.target.value)} required />
            </div>
            <div className="module-form-field full-width">
              <label htmlFor="goal-title">Objective</label>
              <input id="goal-title" className="module-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Complete a role-specific certification" required />
            </div>
            <div className="module-form-field full-width"><button type="submit" className="module-button"><Plus size={15} /> Create goal</button></div>
          </form>
        </SectionCard>
        <SectionCard title="Goal status" description="Current completion across all assigned objectives">
          <div className="module-list">
            {["Completed", "In Progress", "Pending"].map((status) => {
              const count = goals.filter((goal) => goal.status === status).length;
              return <div className="module-list-item" key={status}><div><strong>{status}</strong><small>{count} {count === 1 ? "goal" : "goals"}</small></div><StatusBadge>{count}</StatusBadge></div>;
            })}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Goals & objectives" description="Monitor progress and update each goal's completion status">
        <div className="module-table-wrap"><table className="module-table">
          <thead><tr><th>Employee</th><th>Objective</th><th>Target date</th><th>Progress</th><th>Status</th><th>Update status</th></tr></thead>
          <tbody>{goals.map((goal) => <tr key={goal.id}>
            <td>{goal.employee}</td><td>{goal.title}</td><td>{goal.due || "—"}</td>
            <td style={{ minWidth: 125 }}>
              <div>{goal.progress}%</div>
              <div className="module-progress"><span style={{ width: `${goal.progress}%` }} /></div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={goal.progress}
                aria-label={`Update goal progress for ${goal.title}`}
                onChange={(event) => {
                  const progress = Number(event.target.value);
                  const status = progress === 100 ? "Completed" : progress === 0 ? "Pending" : "In Progress";
                  updateGoal(goal.id, {
                    progress,
                    status,
                    completionDate: status === "Completed" ? goal.completionDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "",
                  });
                }}
              />
            </td>
            <td><StatusBadge>{goal.status}</StatusBadge></td>
            <td><select className="module-select" aria-label={`Update status for ${goal.title}`} value={goal.status} onChange={(event) => {
              const status = event.target.value;
              updateGoal(goal.id, {
                status,
                progress: status === "Completed" ? 100 : status === "Pending" ? 0 : Math.max(20, goal.progress),
                completionDate: status === "Completed" ? goal.completionDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "",
              });
            }}>
              {["Pending", "In Progress", "Completed"].map((status) => <option key={status}>{status}</option>)}
            </select></td>
          </tr>)}</tbody>
        </table></div>
      </SectionCard>
    </>
  );
}

function PerformanceReports({ employees, goals, reviews }) {
  const [kpiFilter, setKpiFilter] = useKpiFilter();
  const navigateToKpi = useKpiNavigation();
  const activeReport = kpiFilter.startsWith("report:") ? kpiFilter.slice("report:".length) : "";
  const [department, setDepartment] = useState("All departments");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const departments = ["All departments", ...new Set(employees.map((employee) => employee.department))];
  const employeeDepartments = Object.fromEntries(employees.map((employee) => [employee.name, employee.department]));
  const matchesDepartment = (employeeDepartment) => department === "All departments" || employeeDepartment === department;
  const matchesSearch = (text) => text.toLowerCase().includes(search.toLowerCase());
  const matchesDate = (date) => {
    if (!date) return !dateFrom && !dateTo;
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return false;
    return (!dateFrom || value >= new Date(`${dateFrom}T00:00:00`))
      && (!dateTo || value <= new Date(`${dateTo}T23:59:59`));
  };
  const filteredEmployees = employees.filter((employee) => matchesDepartment(employee.department) && matchesSearch(`${employee.id} ${employee.name} ${employee.designation} ${employee.manager}`));
  const filteredReviews = reviews.filter((review) => matchesDepartment(review.department) && matchesSearch(`${review.employeeId} ${review.employee} ${review.manager}`) && matchesDate(review.completedDate));
  const filteredPendingEmployees = employees.filter((employee) => employee.status === "Pending"
    && matchesDepartment(employee.department)
    && matchesSearch(`${employee.id} ${employee.name} ${employee.manager}`)
    && matchesDate(employee.lastReview));
  const completedGoals = goals.filter((goal) => goal.status === "Completed"
    && matchesDepartment(employeeDepartments[goal.employee])
    && matchesSearch(`${goal.employee} ${goal.title}`)
    && matchesDate(goal.completionDate));
  const departmentsReport = departments.slice(1).map((name) => {
    const subset = employees.filter((employee) => employee.department === name);
    return { name, count: subset.length, score: subset.reduce((sum, employee) => sum + employee.rating, 0) / (subset.length || 1) };
  }).filter((row) => department === "All departments" || row.name === department);
  const completedReviewCount = filteredReviews.length;
  const pendingReviewCount = filteredPendingEmployees.length;
  const currentAverage = filteredEmployees.reduce((sum, employee) => sum + employee.rating, 0) / (filteredEmployees.length || 1);
  const quarterlyComparisons = [
    { period: "Q2 2026", average: 3.7, change: "—", completion: "68%" },
    { period: "Q3 2026", average: 4.0, change: "+0.3", completion: "83%" },
    {
      period: "Q4 2026",
      average: currentAverage,
      change: `${currentAverage - 4.0 >= 0 ? "+" : ""}${(currentAverage - 4.0).toFixed(1)}`,
      completion: `${Math.round((filteredEmployees.filter((employee) => employee.status === "Completed").length / (filteredEmployees.length || 1)) * 100)}%`,
    },
  ];

  const exportReport = () => {
    const employeeRows = [
      ["Employee ID", "Employee", "Department", "Designation", "Reporting Manager", "Rating", "Review Status", "Last Review"],
      ...filteredEmployees.map((employee) => [employee.id, employee.name, employee.department, employee.designation, employee.manager, employee.rating, employee.status, employee.lastReview]),
    ];
    const goalRows = [
      ["Employee", "Department", "Goal", "Completion Date", "Progress"],
      ...completedGoals.map((goal) => [goal.employee, employeeDepartments[goal.employee] || "", goal.title, goal.completionDate || "", goal.progress]),
    ];
    const reviewRows = [
      ["Employee ID", "Employee", "Department", "Review Period", "Reviewer", "Completion Date", "Rating", "Status"],
      ...filteredReviews.map((review) => [review.employeeId, review.employee, review.department, review.period, review.manager, review.completedDate, review.rating, "Completed"]),
      ...filteredPendingEmployees.map((employee) => [employee.id, employee.name, employee.department, "—", employee.manager, "—", employee.rating, "Pending"]),
    ];
    const averageRows = [
      ["Report type", "Department or period", "Employee count", "Average rating", "Change", "Review completion"],
      ...departmentsReport.map((row) => ["Department", row.name, row.count, row.score.toFixed(2), "", ""]),
      ...reportMonths.map((month) => ["Monthly", month.label, "", month.score.toFixed(2), "", ""]),
      ...quarterlyComparisons.map((quarter) => ["Quarterly", quarter.period, "", quarter.average.toFixed(2), quarter.change, quarter.completion]),
    ];
    const reports = {
      employees: ["performance-employee-reports.csv", employeeRows],
      average: ["performance-average-score-report.csv", averageRows],
      goals: ["performance-goals-completed.csv", goalRows],
      reviews: ["performance-review-completions.csv", reviewRows],
    };
    const [filename, rows] = reports[activeReport] || reports.employees;
    saveCsv(filename, rows);
  };
  const reportCards = [
    { id: "employees", label: "Employee Reports", value: filteredEmployees.length, detail: "Employee history and evaluation details", icon: Users, tone: "mint" },
    { id: "average", label: "Average Score", value: `${currentAverage.toFixed(1)} / 5`, detail: "Department, monthly and quarterly comparisons", icon: Award, tone: "violet" },
    { id: "goals", label: "Goals Completed", value: completedGoals.length, detail: "Completed objectives and department statistics", icon: Target, tone: "amber" },
    { id: "reviews", label: "Review Completions", value: `${completedReviewCount} / ${pendingReviewCount}`, detail: "Completed and pending reviews", icon: FileText, tone: "rose" },
  ];

  return (
    <>
      <div className="module-metrics performance-report-cards">
        {reportCards.map((card) => <MetricCard key={card.id} {...card} onClick={() => navigateToKpi("/admin/performance", `report:${card.id}`)} active={activeReport === card.id} />)}
      </div>
      <SectionCard
        title={activeReport ? reportCards.find((card) => card.id === activeReport)?.label : "Select a performance report"}
        description={activeReport ? "Use the filters to refine results. Choose another card to switch reports." : "Choose one of the report cards above to view its detailed report."}
        action={activeReport && <div className="performance-report-tools">
          <label className="performance-report-filter">Department
            <select className="module-select" aria-label="Filter reports by department" value={department} onChange={(event) => setDepartment(event.target.value)}>{departments.map((name) => <option key={name}>{name}</option>)}</select>
          </label>
          {(activeReport === "employees" || activeReport === "goals" || activeReport === "reviews") && <label className="performance-report-filter">Search
            <input className="module-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports" />
          </label>}
          {(activeReport === "goals" || activeReport === "reviews") && <>
            <label className="performance-report-filter">From<input className="module-input" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
            <label className="performance-report-filter">To<input className="module-input" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          </>}
          <button type="button" className="module-button" onClick={exportReport}><Download size={14} /> Export Excel</button>
          <button type="button" className="module-button secondary" onClick={() => window.print()}><FileText size={14} /> Export PDF</button>
          <button type="button" className="module-button secondary" onClick={() => setKpiFilter("")}>Close</button>
        </div>}
      >
        {activeReport === "employees" && (
          filteredEmployees.length ? <div className="module-table-wrap"><table className="module-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Manager</th><th>Current rating</th><th>Review history</th><th>Employee report</th></tr></thead>
            <tbody>{filteredEmployees.map((employee) => {
              const employeeReviews = reviews.filter((review) => review.employeeId === employee.id);
              return <tr key={employee.id}>
                <td><strong>{employee.name}</strong><small>{employee.id}</small></td><td>{employee.department}</td><td>{employee.designation}</td><td>{employee.manager}</td>
                <td>{employee.rating.toFixed(1)} / 5</td><td>{employeeReviews.length} evaluation{employeeReviews.length === 1 ? "" : "s"}</td>
                <td>{employeeReviews.map((review) => <div key={review.id}><StatusBadge tone="completed">{review.period} · {review.rating.toFixed(1)}</StatusBadge><small>{review.completedDate} · {review.manager}</small></div>)}</td>
              </tr>;
            })}</tbody>
          </table></div> : <div className="module-empty">No employee reports match these filters.</div>
        )}
        {activeReport === "average" && (
          <>
            <div className="module-notice">Overall average performance score: <strong>{currentAverage.toFixed(1)} / 5</strong> across {filteredEmployees.length} employees.</div>
            <div className="module-grid-2">
              <SectionCard title="Department averages" description="Current average rating by department">
                <div className="module-list">{departmentsReport.map((row) => <div key={row.name}>
                  <div className="module-list-item" style={{ marginBottom: 6 }}><div><strong>{row.name}</strong><small>{row.count} employees</small></div><strong>{row.score.toFixed(1)} / 5</strong></div>
                  <div className="module-progress"><span style={{ width: `${row.score / 5 * 100}%` }} /></div>
                </div>)}</div>
              </SectionCard>
              <SectionCard title="Monthly comparison" description="Average score trend · 1 to 5">
                <div className="module-chart" role="img" aria-label="Monthly average performance score comparison">
                  {reportMonths.map((month) => <div className="module-chart-column" key={month.label}><strong>{month.score.toFixed(1)}</strong><span style={{ height: `${month.score / 5 * 100}%` }} /><small>{month.label}</small></div>)}
                </div>
              </SectionCard>
            </div>
            <SectionCard title="Quarterly comparison" description="Average rating and review completion across quarters">
              <div className="module-table-wrap"><table className="module-table">
                <thead><tr><th>Quarter</th><th>Average rating</th><th>Change</th><th>Review completion</th></tr></thead>
                <tbody>{quarterlyComparisons.map((quarter) => <tr key={quarter.period}><td>{quarter.period}</td><td>{quarter.average.toFixed(1)} / 5</td><td>{quarter.change}</td><td>{quarter.completion}</td></tr>)}</tbody>
              </table></div>
            </SectionCard>
            <SectionCard title="Employee-wise score comparison" description="Compare current employee ratings">
              <div className="module-list">{filteredEmployees.map((employee) => <div key={employee.id}>
                <div className="module-list-item" style={{ marginBottom: 6 }}><div><strong>{employee.name}</strong><small>{employee.department}</small></div><strong>{employee.rating.toFixed(1)} / 5</strong></div>
                <div className="module-progress"><span style={{ width: `${employee.rating / 5 * 100}%` }} /></div>
              </div>)}</div>
            </SectionCard>
          </>
        )}
        {activeReport === "goals" && (
          <>
            <div className="module-grid-3">{departments.slice(1).filter((name) => department === "All departments" || name === department).map((name) => {
              const departmentGoals = goals.filter((goal) => goal.status === "Completed" && employeeDepartments[goal.employee] === name);
              return <article className="module-kb-item" key={name}><div className="module-list-item"><div><strong>{name}</strong><small>Completed goals</small></div><strong>{departmentGoals.length}</strong></div><div className="module-progress" style={{ marginTop: 10 }}><span style={{ width: `${departmentGoals.length / (goals.filter((goal) => employeeDepartments[goal.employee] === name).length || 1) * 100}%` }} /></div></article>;
            })}</div>
            {completedGoals.length ? <div className="module-table-wrap"><table className="module-table">
              <thead><tr><th>Employee</th><th>Department</th><th>Goal title</th><th>Completion date</th><th>Progress</th></tr></thead>
              <tbody>{completedGoals.map((goal) => <tr key={goal.id}><td>{goal.employee}</td><td>{employeeDepartments[goal.employee] || "—"}</td><td>{goal.title}</td><td>{goal.completionDate || "Completion date not recorded"}</td><td>{goal.progress}%</td></tr>)}</tbody>
            </table></div> : <div className="module-empty">No completed goals match these filters.</div>}
          </>
        )}
        {activeReport === "reviews" && (
          <>
            <div className="module-metrics">
              <MetricCard label="Completed reviews" value={completedReviewCount} detail="Saved review evaluations" icon={CheckCircle2} onClick={() => navigateToKpi("/admin/performance", "completed")} />
              <MetricCard label="Pending reviews" value={pendingReviewCount} detail="Awaiting evaluation" icon={CalendarDays} tone="amber" onClick={() => navigateToKpi("/admin/performance", "pending")} />
            </div>
            {filteredReviews.length ? <div className="module-table-wrap"><table className="module-table">
              <thead><tr><th>Employee</th><th>Department</th><th>Review period</th><th>Reviewer</th><th>Completion date</th><th>Rating</th></tr></thead>
              <tbody>{filteredReviews.map((review) => <tr key={review.id}><td><strong>{review.employee}</strong><small>{review.employeeId}</small></td><td>{review.department}</td><td>{review.period}</td><td>{review.manager}</td><td>{review.completedDate}</td><td>{review.rating.toFixed(1)} / 5</td></tr>)}</tbody>
            </table></div> : <div className="module-empty">No completed reviews match these filters.</div>}
            <SectionCard title="Pending review assignments" description="Employees who still need a review">
              {filteredPendingEmployees.length
                ? <div className="module-table-wrap"><table className="module-table">
                  <thead><tr><th>Employee</th><th>Department</th><th>Assigned manager</th><th>Status</th></tr></thead>
                  <tbody>{filteredPendingEmployees.map((employee) => <tr key={employee.id}><td><strong>{employee.name}</strong><small>{employee.id}</small></td><td>{employee.department}</td><td>{employee.manager}</td><td><StatusBadge>Pending</StatusBadge></td></tr>)}</tbody>
                </table></div> : <div className="module-empty">No pending reviews match these filters.</div>}
            </SectionCard>
          </>
        )}
        {!activeReport && <div className="module-empty">Select Employee Reports, Average Score, Goals Completed or Review Completions to open a detailed report.</div>}
      </SectionCard>
    </>
  );
}

export default function Performance() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [goals, setGoals] = useState(initialGoals);
  const [reviews, setReviews] = useState(initialReviewHistory);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [evaluationRequest, setEvaluationRequest] = useState(0);
  const saveReview = (id, rating, review) => {
    const employee = employees.find((item) => item.id === id);
    if (!employee) return;
    const completedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const savedReview = {
      id: `REVIEW-${Date.now()}`,
      employeeId: employee.id,
      employee: employee.name,
      department: employee.department,
      manager: employee.manager,
      period: review.period,
      rating,
      completedDate,
      ratings: review.ratings,
      managerFeedback: review.managerFeedback,
      adminComments: review.adminComments,
    };
    setEmployees((current) => current.map((item) => item.id === id ? {
      ...item,
      rating,
      ...review,
      reviewPeriod: review.period,
      status: "Completed",
      lastReview: completedDate,
    } : item));
    setReviews((current) => [savedReview, ...current]);
  };
  const selectEmployeeForReview = (id) => {
    setSelectedEmployeeId(id);
    setEvaluationRequest((current) => current + 1);
    document.getElementById("employee-evaluation")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="People · Growth · Results"
        title="Performance Management"
        description="Track employee reviews, support professional growth and align goals with organizational outcomes."
        action={<a className="module-button" href="#employee-evaluation"><Plus size={15} /> New evaluation</a>}
      />
      <div id="performance-overview"><PerformanceOverview employees={employees} onSelectEmployee={selectEmployeeForReview} /></div>
      <div id="employee-evaluation" style={{ marginTop: 18 }}>
        <EvaluationPage key={`${evaluationRequest}-${selectedEmployeeId}`} employees={employees} reviews={reviews} selectedEmployeeId={selectedEmployeeId} onSave={saveReview} />
      </div>
      <div id="goals-objectives" style={{ marginTop: 18 }}>
        <GoalsPage goals={goals} setGoals={setGoals} employees={employees} />
      </div>
      <div id="performance-reports" style={{ marginTop: 18 }}>
        <PerformanceReports employees={employees} goals={goals} reviews={reviews} />
      </div>
    </div>
  );
}
