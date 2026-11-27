import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, ChevronRight, Search, Users } from "lucide-react";
import { fetchDepartmentHierarchy, getFallbackDepartmentHierarchy } from "../services/departmentHierarchy";
import "../style/Department.css";

const routeLabels = {
  administration: "Administration Details",
  managers: "All Managers",
  manager: "Manager Details",
  managerHrs: "HR Employees",
  hr: "HR Details",
  hrLeaders: "Team Leaders",
  teamLeader: "Team Leader Details",
  leaderEmployees: "Reporting Employees",
  departmentEmployees: "Department Employees",
  employeeStatus: "Employee Status",
  departments: "All Departments",
  activeDepartments: "Active Departments",
  employees: "All Employees",
  totalEmployees: "All Company Employees",
  employee: "Employee Details",
};

const getStatus = (employee) => {
  const status = employee.status || employee.employmentStatus || "Active";
  return typeof status === "string" ? status : status.label || status.name || "Active";
};
const getPhoto = (employee) =>
  employee.photoUrl || employee.photo || employee.avatarUrl ||
  employee.avatar || employee.imageUrl || employee.profilePhoto ||
  employee.profilePicture || "";

function PersonAvatar({ person, large = false }) {
  const photo = getPhoto(person);
  const initials = person.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className={`org-person-avatar${large ? " large" : ""}`}>
      {photo ? <img src={photo} alt={`${person.name} profile`} /> : initials}
    </span>
  );
}

function DepartmentHierarchy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedFilter = searchParams.get("filter") || "managers";
  const isLegacyDepartmentFilter = requestedFilter.startsWith("departmentEmployees:");
  const filter = isLegacyDepartmentFilter ? "departmentEmployees" : requestedFilter;
  const id = searchParams.get("id") || "";
  const administrationId = searchParams.get("administrationId") || "";
  const managerId = searchParams.get("managerId") || "";
  const hrId = searchParams.get("hrId") || "";
  const teamLeaderId = searchParams.get("teamLeaderId") || "";
  const department = searchParams.get("department") ||
    (isLegacyDepartmentFilter ? requestedFilter.slice("departmentEmployees:".length) : "");
  const departmentId = searchParams.get("departmentId") || "";
  const status = searchParams.get("status") || "";
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeProjectFilter, setEmployeeProjectFilter] = useState("All");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("All");

  // Show the KPI records immediately, then replace the snapshot with fresh server data.
  const [hierarchy, setHierarchy] = useState(() => getFallbackDepartmentHierarchy());

  useEffect(() => {
    let active = true;
    fetchDepartmentHierarchy()
      .then((data) => active && setHierarchy(data))
      .catch((requestError) => {
        if (!active) return;
        console.error("Unable to load organization hierarchy from Supabase.", requestError);
      });
    return () => { active = false; };
  }, []);

  const employees = hierarchy.employees;

  const administrations = employees.filter((employee) => employee.role === "Administration");
  const selectedEmployee = employees.find((employee) => employee.id === id);
  const selectedAdministration = employees.find((employee) => employee.id === (administrationId || (filter === "administration" ? id : "")));
  const managers = employees.filter((employee) =>
    employee.role === "Manager" && (!administrationId || employee.administrationId === administrationId)
  );
  const selectedManager = employees.find((employee) => employee.id === (managerId || (filter === "manager" ? id : "")));
  const selectedHr = employees.find((employee) => employee.id === (hrId || (filter === "hr" ? id : "")));
  const selectedLeader = employees.find((employee) => employee.id === (teamLeaderId || (filter === "teamLeader" ? id : "")));

  const hrForManager = (parentId) => employees.filter(
    (employee) => employee.role === "HR" && employee.managerId === parentId
  );
  const leadersForHr = (parentId) => employees.filter(
    (employee) => employee.role === "Team Leader" && employee.hrId === parentId
  );
  const managersForAdministration = (parentId) => employees.filter(
    (employee) => employee.role === "Manager" && employee.administrationId === parentId
  );
  const employeesForLeader = (parentId) => employees.filter(
    (employee) => employee.role === "Employee" && employee.teamLeaderId === parentId
  );
  const counts = (person) => ({
    hrs: hrForManager(person.id).length,
    leaders: leadersForHr(person.id).length,
    employees: employeesForLeader(person.id).length,
  });
  const managerForHr = (person) => employees.find((item) => item.id === person.managerId);
  const hrForLeader = (person) => employees.find((item) => item.id === person.hrId);
  const departments = hierarchy.departments;
  const selectedDepartment = departments.find((item) => String(item.id) === departmentId || item.name === departmentId);

  const activeFilteredDepartments = departments.filter((item) => item.status === "Active");
  const departmentPeople = (() => {
    const directMatches = employees.filter((employee) => employee.department === department);
    if (directMatches.length) return directMatches;
    const roleFilter = department === "Employees" ? "Employee" : department;
    return employees.filter((employee) => employee.role === roleFilter);
  })();

  const listRecords = (() => {
    switch (filter) {
      case "managers":
        return managers;
      case "administration":
        return administrations;
      case "managerHrs":
        return hrForManager(managerId);
      case "employee":
        return selectedEmployee ? [selectedEmployee] : [];
      case "hrLeaders":
        return leadersForHr(hrId);
      case "leaderEmployees":
        return employeesForLeader(teamLeaderId);
      case "departmentEmployees":
        return departmentPeople;
      case "employeeStatus":
        return employees.filter((employee) => {
          const withinManager = !managerId || employee.managerId === managerId;
          const withinHr = !hrId || employee.hrId === hrId;
          const withinLeader = !teamLeaderId || employee.teamLeaderId === teamLeaderId;
          return employee.role === "Employee" &&
            employee.status.toLowerCase() === status.toLowerCase() &&
            withinManager && withinHr && withinLeader;
        });
      case "employees":
        return employees;
      case "totalEmployees":
        return employees;
      default:
        return [];
    }
  })();
  const visibleEmployeeRecords = filter === "leaderEmployees"
    ? listRecords.filter((person) => {
      const query = employeeSearch.trim().toLowerCase();
      const matchesSearch = !query || [
        person.id,
        person.name,
        person.email,
        person.phone,
        person.designation,
        person.department,
        person.project,
      ].join(" ").toLowerCase().includes(query);
      return matchesSearch &&
        (employeeProjectFilter === "All" || person.project === employeeProjectFilter) &&
        (employeeStatusFilter === "All" || person.status === employeeStatusFilter);
    })
    : listRecords;
  const employeeProjects = [...new Set(listRecords.map((person) => person.project).filter(Boolean))].sort();

  const listDepartments = filter === "departments" || filter === "totalDepartments"
    ? departments
    : filter === "activeDepartments"
      ? activeFilteredDepartments
      : [];
  const listLabel = routeLabels[filter] || "Organization";
  const goTo = (nextFilter, params = {}) => {
    const next = new URLSearchParams({ filter: nextFilter });
    Object.entries(params).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    navigate(`/admin/departments/records?${next.toString()}`);
  };

  const goBack = () => {
    if (filter === "manager") {
      const parent = selectedManager?.administrationId;
      return navigate(parent
        ? `/admin/departments/records?filter=administration&id=${encodeURIComponent(parent)}`
        : "/admin/departments/records?filter=managers");
    }
    if (filter === "hr") return navigate(`/admin/departments/records?filter=manager&id=${encodeURIComponent(id)}`);
    if (filter === "teamLeader") {
      const parent = selectedHr;
      return navigate(`/admin/departments/records?filter=hr&id=${encodeURIComponent(parent?.id || "")}`);
    }
    if (filter === "managerHrs") return navigate(`/admin/departments/records?filter=manager&id=${encodeURIComponent(managerId)}`);
    if (filter === "managers" && administrationId) {
      return navigate(`/admin/departments/records?filter=administration&id=${encodeURIComponent(administrationId)}`);
    }
    if (filter === "employee") {
      if (selectedEmployee?.role === "Administration") {
        return navigate(`/admin/departments/records?filter=administration&id=${encodeURIComponent(selectedEmployee.id)}`);
      }
      if (selectedEmployee?.role === "Manager") {
        return navigate(selectedEmployee.administrationId
          ? `/admin/departments/records?filter=administration&id=${encodeURIComponent(selectedEmployee.administrationId)}`
          : "/admin/departments/records?filter=managers");
      }
      if (selectedEmployee?.role === "HR") {
        return navigate(`/admin/departments/records?filter=manager&id=${encodeURIComponent(selectedEmployee.managerId || "")}`);
      }
      if (selectedEmployee?.role === "Team Leader") {
        return navigate(`/admin/departments/records?filter=hr&id=${encodeURIComponent(selectedEmployee.hrId || "")}`);
      }
      return navigate(`/admin/departments/records?filter=teamLeader&id=${encodeURIComponent(teamLeaderId || selectedEmployee?.teamLeaderId || "")}&hrId=${encodeURIComponent(hrId || selectedEmployee?.hrId || "")}&managerId=${encodeURIComponent(managerId || selectedEmployee?.managerId || "")}`);
    }
    if (filter === "hrLeaders") return navigate(`/admin/departments/records?filter=hr&id=${encodeURIComponent(hrId)}&managerId=${encodeURIComponent(managerId)}`);
    if (filter === "leaderEmployees") return navigate(`/admin/departments/records?filter=teamLeader&id=${encodeURIComponent(teamLeaderId)}&hrId=${encodeURIComponent(hrId)}&managerId=${encodeURIComponent(managerId)}`);
    if (filter === "employeeStatus") {
      if (teamLeaderId) return navigate(`/admin/departments/records?filter=teamLeader&id=${encodeURIComponent(teamLeaderId)}&hrId=${encodeURIComponent(hrId)}&managerId=${encodeURIComponent(managerId)}`);
      if (hrId) return navigate(`/admin/departments/records?filter=hr&id=${encodeURIComponent(hrId)}&managerId=${encodeURIComponent(managerId)}`);
      if (managerId) return navigate(`/admin/departments/records?filter=manager&id=${encodeURIComponent(managerId)}`);
    }
    return navigate("/admin/departments");
  };

  const renderPersonCard = (person, subtitle, countLabel, count, onSelect, onCountSelect) => (
    <article className="org-person-card" key={person.id}>
      <button type="button" className="org-person-main" onClick={onSelect}>
        <PersonAvatar person={person} />
        <span className="org-person-main-copy">
          <strong>{person.name}</strong>
          <small>{person.id} · {subtitle}</small>
          <small>{person.department || "Department not provided"}</small>
          <small>{person.email || "Not provided"} · {person.phone || "Not provided"}</small>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
      <div className="org-person-card-footer">
        <span>{countLabel}</span>
        <button type="button" onClick={onCountSelect} aria-label={`View ${count} ${countLabel} for ${person.name}`}>
          {count}
        </button>
      </div>
    </article>
  );

  const renderPersonList = (records, role, getCount, countLabel, navigateToPerson, navigateToCount) => (
    <div className="org-person-grid">
      {records.map((person) => renderPersonCard(
        person,
        person.designation || role,
        countLabel,
        getCount(person),
        () => navigateToPerson(person),
        () => navigateToCount(person)
      ))}
      {!records.length && <p className="department-empty">No {role.toLowerCase()} records match this reporting hierarchy.</p>}
    </div>
  );

  const renderEmployeeTable = (records) => (
      <div className="department-table-wrapper">
        <table className="department-table org-table">
          <thead><tr>
            <th>Employee</th><th>Employee ID</th><th>Email</th><th>Contact</th>
            <th>Designation</th><th>Department</th><th>Project</th><th>Reporting TL</th>
            <th>Joining Date</th><th>Employment Status</th><th>Details</th>
          </tr></thead>
          <tbody>
            {records.map((person) => (
              <tr key={person.id}>
                <td><span className="org-table-person"><PersonAvatar person={person} />{person.name}</span></td>
                <td>{person.id}</td><td>{person.email}</td><td>{person.phone}</td>
                <td>{person.designation || "Not provided"}</td><td>{person.department || "Not provided"}</td>
                <td>{person.project || "Not provided"}</td>
                <td>{employees.find((item) => item.id === person.teamLeaderId)?.name || "Not provided"}</td>
                <td>{person.joiningDate || "Not provided"}</td>
                <td><span className={`department-status ${person.status === "Active" ? "status-active" : "status-inactive"}`}>{person.status}</span></td>
                <td><button type="button" className="department-view-btn" onClick={() => goTo("employee", {
                  id: person.id,
                  managerId: person.managerId,
                  hrId: person.hrId,
                  teamLeaderId: person.teamLeaderId,
                })}>View</button></td>
              </tr>
            ))}
            {!records.length && <tr><td colSpan="11" className="department-empty">No employees found.</td></tr>}
          </tbody>
        </table>
      </div>
  );

  const renderDepartmentList = () => (
    <section className="department-detail-section">
      <div className="department-detail-header">
        <button type="button" className="department-back-btn" onClick={goBack}>
          <ArrowLeft size={17} /> Back to Departments
        </button>
        <div><h2>{listLabel}</h2><p>Select a department to view its Manager, HR members, Team Leaders, and employees.</p></div>
      </div>
      <div className="org-person-grid">
        {listDepartments.map((item) => (
          <article className="org-person-card org-department-card" key={item.id}>
            <button type="button" className="org-department-heading org-department-heading-button" onClick={() => goTo("department", { departmentId: item.id })}><Building2 size={22} /><strong>{item.name}</strong><ChevronRight size={17} /></button>
            <span className={`department-status ${item.status === "Active" ? "status-active" : "status-inactive"}`}>{item.status}</span>
            <button type="button" className="org-department-count" onClick={() => goTo("department", { departmentId: item.id })}>
              <strong>{item.employeeCount}</strong><span>Employees · View hierarchy</span>
            </button>
          </article>
        ))}
        {!listDepartments.length && <p className="department-empty">No departments available.</p>}
      </div>
    </section>
  );

  const renderDepartmentDetails = () => {
    if (!selectedDepartment) return renderInvalid();
    const members = selectedDepartment.members || employees.filter((person) => person.departmentId === selectedDepartment.id || person.department === selectedDepartment.name);
    const manager = selectedDepartment.manager || members.find((person) => person.role === "Manager") || employees.find((person) => members.some((member) => member.managerId === person.id));
    const hrs = members.filter((person) => person.role === "HR");
    const leaders = members.filter((person) => person.role === "Team Leader");
    return <section className="department-detail-section">
      <div className="department-detail-header"><button type="button" className="department-back-btn" onClick={() => navigate("/admin/departments")}><ArrowLeft size={17} /> Back to Departments</button><div><h2>{selectedDepartment.name}</h2><p>{selectedDepartment.description || "Department reporting hierarchy"}</p></div></div>
      <div className="org-department-overview"><div><strong>{members.length}</strong><span>Total employees</span></div><div><strong>{hrs.length}</strong><span>HR members</span></div><div><strong>{leaders.length}</strong><span>Team Leaders</span></div></div>
      <h3 className="org-subheading">Department Manager</h3>
      {manager ? renderPersonList([manager], "Manager", (person) => hrForManager(person.id).length, "HR members", (person) => goTo("manager", { id: person.id }), (person) => goTo("managerHrs", { managerId: person.id })) : <p className="department-empty">No manager assigned.</p>}
      <h3 className="org-subheading">HR Members</h3>
      {renderPersonList(hrs, "HR members", (person) => leadersForHr(person.id).length, "Team Leaders", (person) => goTo("hr", { id: person.id, managerId: manager?.id }), (person) => goTo("hrLeaders", { hrId: person.id, managerId: manager?.id }))}
      <h3 className="org-subheading">Team Leaders</h3>
      {renderPersonList(leaders, "Team Leaders", (person) => employeesForLeader(person.id).length, "Employees", (person) => goTo("teamLeader", { id: person.id, hrId: person.hrId, managerId: manager?.id }), (person) => goTo("leaderEmployees", { teamLeaderId: person.id, hrId: person.hrId, managerId: manager?.id }))}
    </section>;
  };

  const renderFilteredList = () => (
    <section className="department-detail-section">
      <div className="department-detail-header">
        <button type="button" className="department-back-btn" onClick={goBack}>
          <ArrowLeft size={17} /> Back
        </button>
        <div>
          <h2>{listLabel}</h2>
          <p>
            {filter === "departmentEmployees" ? `Department: ${department}` :
              filter === "employeeStatus" ? `Employment status: ${status}` :
                filter === "administration" ? "Administration employees and their associated managers." :
                  filter === "managers" ? "Select a Manager or click their HR count to view reporting employees." :
                filter === "managerHrs" ? `Reporting to ${selectedManager?.name || "selected Manager"}` :
                  filter === "hrLeaders" ? `Reporting to ${selectedHr?.name || "selected HR"}` :
                    filter === "leaderEmployees" ? `Reporting to ${selectedLeader?.name || "selected Team Leader"}` :
                      `${listRecords.length} matching records`}
          </p>
        </div>
      </div>
      {filter === "managers" && renderPersonList(
        listRecords, "Managers", (person) => counts(person).hrs, "HR employees",
        (person) => goTo("manager", { id: person.id }),
        (person) => goTo("managerHrs", { managerId: person.id })
      )}
      {filter === "administration" && renderAdministrationDetails()}
      {filter === "managers" && listRecords.length === 0 && (
        <p className="department-empty">No managers are associated with this Administration record.</p>
      )}
      {filter === "managerHrs" && renderPersonList(
        listRecords, "HR employees", (person) => counts(person).leaders, "Team Leaders",
        (person) => goTo("hr", { id: person.id, managerId }),
        (person) => goTo("hrLeaders", { hrId: person.id, managerId })
      )}
      {filter === "hrLeaders" && renderPersonList(
        listRecords, "Team Leaders", (person) => counts(person).employees, "Employees",
        (person) => goTo("teamLeader", { id: person.id, hrId }),
        (person) => goTo("leaderEmployees", { teamLeaderId: person.id, hrId })
      )}
      {filter === "leaderEmployees" && (
        <div className="department-detail-toolbar org-employee-list-toolbar">
          <div className="department-detail-count"><Users size={19} /><span>{visibleEmployeeRecords.length} of {listRecords.length} employees</span></div>
          <label className="department-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name, ID, email, project..."
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              aria-label="Search reporting employees"
            />
          </label>
          <select
            className="org-employee-filter"
            value={employeeProjectFilter}
            onChange={(event) => setEmployeeProjectFilter(event.target.value)}
            aria-label="Filter employees by project"
          >
            <option value="All">All Projects</option>
            {employeeProjects.map((project) => <option value={project} key={project}>{project}</option>)}
          </select>
          <select
            className="org-employee-filter"
            value={employeeStatusFilter}
            onChange={(event) => setEmployeeStatusFilter(event.target.value)}
            aria-label="Filter employees by status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      )}
      {(filter === "leaderEmployees" || filter === "departmentEmployees" || filter === "employeeStatus" || filter === "employees" || filter === "totalEmployees") &&
        renderEmployeeTable(visibleEmployeeRecords)}
    </section>
  );

  const renderAdministrationDetails = () => {
    const associatedManagers = selectedAdministration
      ? managersForAdministration(selectedAdministration.id)
      : employees.filter((person) => person.role === "Manager");
    return (
      <>
        {selectedAdministration && (
          <>
            <PersonSummary person={selectedAdministration} />
            <h3 className="org-subheading">Administration employee details</h3>
          </>
        )}
        {!selectedAdministration && (
          <div className="department-detail-header">
            <div>
              <h2>Administration employees</h2>
              <p>{administrations.length} employees in Administration.</p>
            </div>
          </div>
        )}
        {renderPersonList(
          selectedAdministration ? [selectedAdministration] : administrations,
          "Administration employees",
          (person) => managersForAdministration(person.id).length,
          "Managers",
          (person) => goTo("administration", { id: person.id }),
          (person) => goTo("managers", { administrationId: person.id })
        )}
        {renderEmployeeTable(selectedAdministration ? [selectedAdministration] : administrations)}
        <button
          type="button"
          className="department-stat-card department-stat-clickable org-administration-managers-kpi"
          onClick={() => goTo("managers", { administrationId: selectedAdministration?.id })}
        >
          <div className="department-stat-icon"><Users size={22} /></div>
          <div><p>Managers</p><h2>{associatedManagers.length}</h2><span>View managers reporting under Administration</span></div>
        </button>
        <h3 className="org-subheading">Managers associated with Administration</h3>
        {renderPersonList(
          associatedManagers,
          "Managers",
          (person) => counts(person).hrs,
          "HR employees",
          (person) => goTo("manager", { id: person.id }),
          (person) => goTo("managerHrs", { managerId: person.id })
        )}
      </>
    );
  };

  const renderManagerDetails = () => {
    if (!selectedManager) return renderInvalid();
    const reports = hrForManager(selectedManager.id);
    const administration = employees.find((person) => person.id === selectedManager.administrationId);
    const statusScope = { managerId: selectedManager.id };
    return (
      <>
        <section className="department-detail-section">
          <div className="department-detail-header">
            <button type="button" className="department-back-btn" onClick={goBack}><ArrowLeft size={17} /> Back to Managers</button>
            <div><h2>{selectedManager.name}</h2><p>Manager · {selectedManager.designation}</p></div>
          </div>
          <PersonSummary person={selectedManager} reportingManager={administration?.name} />
          <div className="org-kpi-grid">
            <button type="button" className="department-stat-card department-stat-clickable" onClick={() => goTo("managerHrs", { managerId: selectedManager.id })}>
              <div className="department-stat-icon"><Users size={22} /></div><div><p>HR Employees</p><h2>{reports.length}</h2><span>View HR reporting to {selectedManager.name}</span></div>
            </button>
            <StatusKpis records={employees.filter((person) => person.role === "Employee" && person.managerId === selectedManager.id)} onSelect={(nextStatus) => goTo("employeeStatus", { ...statusScope, status: nextStatus })} />
          </div>
          <h3 className="org-subheading">Reporting HR employees</h3>
          {renderPersonList(reports, "HR employees", (person) => counts(person).leaders, "Team Leaders",
            (person) => goTo("hr", { id: person.id, managerId: selectedManager.id }),
            (person) => goTo("hrLeaders", { hrId: person.id, managerId: selectedManager.id }))}
        </section>
      </>
    );
  };

  const renderHrDetails = () => {
    if (!selectedHr) return renderInvalid();
    const reports = leadersForHr(selectedHr.id);
    const parent = managerForHr(selectedHr);
    return (
      <section className="department-detail-section">
        <div className="department-detail-header">
          <button type="button" className="department-back-btn" onClick={() => navigate(parent ? `/admin/departments/records?filter=manager&id=${encodeURIComponent(parent.id)}` : "/admin/departments")}><ArrowLeft size={17} /> Back to Manager</button>
          <div><h2>{selectedHr.name}</h2><p>HR · {selectedHr.designation}</p></div>
        </div>
        <PersonSummary person={selectedHr} reportingManager={parent?.name} />
        <div className="org-kpi-grid">
          <button type="button" className="department-stat-card department-stat-clickable" onClick={() => goTo("hrLeaders", { hrId: selectedHr.id, managerId: parent?.id })}>
            <div className="department-stat-icon active-icon"><Users size={22} /></div><div><p>Team Leaders</p><h2>{reports.length}</h2><span>View Team Leaders reporting to {selectedHr.name}</span></div>
          </button>
          <StatusKpis records={employees.filter((person) => person.role === "Employee" && person.hrId === selectedHr.id)} onSelect={(nextStatus) => goTo("employeeStatus", { managerId: parent?.id, hrId: selectedHr.id, status: nextStatus })} />
        </div>
        <h3 className="org-subheading">Reporting Team Leaders</h3>
        {renderPersonList(reports, "Team Leaders", (person) => counts(person).employees, "Employees",
          (person) => goTo("teamLeader", { id: person.id, managerId: parent?.id, hrId: selectedHr.id }),
          (person) => goTo("leaderEmployees", { teamLeaderId: person.id, managerId: parent?.id, hrId: selectedHr.id }))}
      </section>
    );
  };

  const renderLeaderDetails = () => {
    if (!selectedLeader) return renderInvalid();
    const reports = employeesForLeader(selectedLeader.id);
    const parentHr = hrForLeader(selectedLeader);
    const parentManager = parentHr && managerForHr(parentHr);
    return (
      <section className="department-detail-section">
        <div className="department-detail-header">
          <button type="button" className="department-back-btn" onClick={() => navigate(parentHr ? `/admin/departments/records?filter=hr&id=${encodeURIComponent(parentHr.id)}` : "/admin/departments")}><ArrowLeft size={17} /> Back to HR</button>
          <div><h2>{selectedLeader.name}</h2><p>Team Leader · {selectedLeader.designation}</p></div>
        </div>
        <PersonSummary person={selectedLeader} reportingManager={parentHr?.name} />
        <div className="org-kpi-grid">
          <button type="button" className="department-stat-card department-stat-clickable" onClick={() => goTo("leaderEmployees", { teamLeaderId: selectedLeader.id, managerId: parentManager?.id, hrId: parentHr?.id })}>
            <div className="department-stat-icon employee-icon"><Users size={22} /></div><div><p>Employees</p><h2>{reports.length}</h2><span>View employees reporting to {selectedLeader.name}</span></div>
          </button>
          <StatusKpis records={reports} onSelect={(nextStatus) => goTo("employeeStatus", { managerId: parentManager?.id, hrId: parentHr?.id, teamLeaderId: selectedLeader.id, status: nextStatus })} />
        </div>
        <h3 className="org-subheading">Reporting Employees</h3>
        {renderEmployeeTable(reports)}
      </section>
    );
  };

  const renderEmployeeDetails = () => {
    if (!selectedEmployee) return renderInvalid();
    const teamLeader = employees.find((person) => person.id === selectedEmployee.teamLeaderId);
    const hr = employees.find((person) => person.id === (selectedEmployee.hrId || teamLeader?.hrId));
    const manager = employees.find((person) => person.id === (selectedEmployee.managerId || hr?.managerId));
    return (
      <section className="department-detail-section">
        <div className="department-detail-header">
          <button type="button" className="department-back-btn" onClick={goBack}>
            <ArrowLeft size={17} /> Back to Team Leader
          </button>
          <div><h2>{selectedEmployee.name}</h2><p>{selectedEmployee.role} · {selectedEmployee.designation}</p></div>
        </div>
        <PersonSummary person={selectedEmployee} reportingManager={teamLeader?.name} />
        <div className="org-person-summary org-employee-hierarchy-summary">
          <dl>
            <div><dt>Reporting HR</dt><dd>{hr?.name || "Not provided"}</dd></div>
            <div><dt>Reporting Manager</dt><dd>{manager?.name || "Not provided"}</dd></div>
          </dl>
        </div>
      </section>
    );
  };

  function renderInvalid() {
    return (
      <section className="department-detail-section">
        <div className="department-detail-header">
          <button type="button" className="department-back-btn" onClick={() => navigate("/admin/departments")}><ArrowLeft size={17} /> Back to Departments</button>
          <div><h2>Record not found</h2><p>The selected organization record is unavailable.</p></div>
        </div>
      </section>
    );
  }

  return (
    <div className="departments-page org-hierarchy-page">
      <header className="departments-header">
        <div>
          <span className="org-breadcrumb">HRMS / ADMIN / DEPARTMENTS / ORGANIZATION</span>
          <h1>Organizational Reporting</h1>
          <p>Explore the company reporting hierarchy and employee records.</p>
        </div>
        <button type="button" className="department-add-btn" onClick={() => navigate("/admin/departments")}>
          <ArrowLeft size={17} /> Back to Departments
        </button>
      </header>

      {filter === "department" ? renderDepartmentDetails()
      : filter === "manager" ? renderManagerDetails()
        : filter === "hr" ? renderHrDetails()
          : filter === "teamLeader" ? renderLeaderDetails()
            : filter === "employee" ? renderEmployeeDetails()
            : filter === "departments" || filter === "totalDepartments" || filter === "activeDepartments" ? renderDepartmentList()
              : renderFilteredList()}
    </div>
  );
}

function PersonSummary({ person, reportingManager = "" }) {
  return (
    <div className="org-person-summary">
      <PersonAvatar person={person} large />
      <div className="org-person-summary-copy">
        <strong>{person.name}</strong>
        <span>{person.id} · {person.designation || person.role}</span>
      </div>
      <dl>
        <div><dt>Email</dt><dd>{person.email || "Not provided"}</dd></div>
        <div><dt>Contact number</dt><dd>{person.phone || person.phoneNumber || person.mobile || "Not provided"}</dd></div>
        <div><dt>Department</dt><dd>{person.department || "Not provided"}</dd></div>
        <div><dt>Project</dt><dd>{person.project || "Not provided"}</dd></div>
        <div><dt>Reporting manager</dt><dd>{reportingManager || person.reportingManager || person.managerName || "Not provided"}</dd></div>
        <div><dt>Joining date</dt><dd>{person.joiningDate || "Not provided"}</dd></div>
        <div><dt>Employment status</dt><dd>{getStatus(person)}</dd></div>
      </dl>
    </div>
  );
}

function StatusKpis({ records, onSelect }) {
  return (
    <>
      {["Active", "Inactive"].map((status) => {
        const count = records.filter((person) => getStatus(person) === status).length;
        return (
          <button
            type="button"
            className="department-stat-card department-stat-clickable org-status-kpi"
            onClick={() => onSelect(status)}
            key={status}
          >
            <div className={`department-stat-icon ${status === "Active" ? "active-icon" : ""}`}><Users size={22} /></div>
            <div><p>{status} Employees</p><h2>{count}</h2><span>View {status.toLowerCase()} employees</span></div>
          </button>
        );
      })}
    </>
  );
}

export default DepartmentHierarchy;
