import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronRight, Download, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchDepartmentHierarchy, getFallbackDepartmentHierarchy } from "../services/departmentHierarchy";
import { downloadCsv } from "../utils/downloadCsv";
import "../style/Department.css";

const PAGE_SIZE = 8;

export default function Departments() {
  const navigate = useNavigate();
  // Render the local department snapshot immediately while the latest data loads in the background.
  const [dataset, setDataset] = useState(() => getFallbackDepartmentHierarchy());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    fetchDepartmentHierarchy()
      .then((data) => active && setDataset(data))
      .catch((requestError) => {
        if (!active) return;
        console.error("Unable to load departments from Supabase.", requestError);
      });
    return () => { active = false; };
  }, []);

  const filteredDepartments = useMemo(() => dataset.departments.filter((department) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${department.name} ${department.manager?.name || ""}`.toLowerCase().includes(query);
    const matchesStatus = status === "All" || String(department.status).toLowerCase() === status.toLowerCase();
    return matchesSearch && matchesStatus;
  }), [dataset.departments, search, status]);

  const pages = Math.max(1, Math.ceil(filteredDepartments.length / PAGE_SIZE));
  const visibleDepartments = filteredDepartments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeDepartments = dataset.departments.filter((department) => String(department.status).toLowerCase() === "active").length;

  const exportDepartments = () => downloadCsv(
    "department-records.csv",
    ["Department ID", "Department", "Manager", "Status", "Employees", "HR Members", "Team Leaders"],
    filteredDepartments.map((department) => [
      department.id || "",
      department.name,
      department.manager?.name || "Not assigned",
      department.status,
      department.employeeCount,
      department.hrCount,
      department.teamLeaderCount,
    ])
  );

  return (
    <div className="departments-page">
      <header className="departments-header">
        <div>
          <span className="org-breadcrumb">HRMS / ADMIN / DEPARTMENTS</span>
          <h1>Departments</h1>
        </div>
        <div className="departments-header-actions">
          <button type="button" className="department-add-btn secondary" onClick={exportDepartments}>
            <Download size={17} /> Export CSV
          </button>
          <button type="button" className="department-add-btn" onClick={() => navigate("/admin/departments/add")}>
            <Building2 size={18} /> Add Department
          </button>
        </div>
      </header>

      <div className="department-stats">
        <Summary label="Total Departments" value={dataset.departments.length} icon={<Building2 size={22} />} onClick={() => navigate("/admin/departments/records?filter=totalDepartments")} />
        <Summary label="Active Departments" value={activeDepartments} icon={<Building2 size={22} />} onClick={() => navigate("/admin/departments/records?filter=activeDepartments")} />
        <Summary label="Total Employees" value={dataset.employees.length} icon={<Users size={22} />} onClick={() => navigate("/admin/departments/records?filter=totalEmployees")} />
      </div>

      <section className="department-content">
        <div className="department-toolbar">
          <div><h3>Company departments</h3></div>
          <label className="department-search"><Search size={17} aria-hidden="true" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search departments or managers" aria-label="Search departments" /></label>
          <select className="department-filter-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter department status">
            <option value="All">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
          </select>
        </div>

        {visibleDepartments.length ? (
          <div className="org-department-grid">
            {visibleDepartments.map((department) => (
              <button type="button" className="org-department-list-card" key={department.id || department.name} onClick={() => navigate(`/admin/departments/records?filter=department&departmentId=${encodeURIComponent(department.id || department.name)}`)}>
                <div className="org-department-heading"><span className="department-stat-icon"><Building2 size={21} /></span><span><strong>{department.name}</strong><small>{department.manager?.name || "Manager not assigned"}</small></span><ChevronRight size={18} /></div>
                <div className="org-department-metrics"><span><strong>{department.employeeCount}</strong><small>Employees</small></span><span><strong>{department.hrCount}</strong><small>HR members</small></span><span><strong>{department.teamLeaderCount}</strong><small>Team Leaders</small></span></div>
                <div className="org-department-card-footer"><span className={`department-status ${String(department.status).toLowerCase() === "active" ? "status-active" : "status-inactive"}`}>{department.status}</span><span>View hierarchy</span></div>
              </button>
            ))}
          </div>
        ) : <div className="department-empty">No departments match the current filters.</div>}

        {pages > 1 && <div className="department-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>}
      </section>
    </div>
  );
}

function Summary({ label, value, icon, onClick }) {
  return <button type="button" className="department-stat-card department-stat-clickable" onClick={onClick}><div className="department-stat-icon">{icon}</div><div><p>{label}</p><h2>{value}</h2><span>View records</span></div></button>;
}
