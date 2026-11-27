
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  BriefcaseBusiness,
  UserCog,
  Building2,
  Laptop,
  Search,
  ArrowLeft,
  FolderKanban,
  IndianRupee,
  X,
  Download,
} from "lucide-react";

import "../style/Employee.css";
import { readAdminProfile } from "../services/adminProfile";
import { recordAuditEvent } from "../services/auditLog";
import { readEmployeeRecords, saveEmployeeRecords } from "../services/employeeRecords";
import { useKpiFilter, useKpiNavigation, useKpiScopedState } from "../hooks/useKpiNavigation";
import { downloadCsv } from "../utils/downloadCsv";
import { useSearchParams } from "react-router-dom";

// --------------------------------------------------
// ROLE CONFIGURATION
// --------------------------------------------------

const roleCards = [
  {
    title: "Administration",
    description: "View administration employees and company operations",
    icon: Building2,
    color: "manager",
  },
  {
    title: "Manager",
    description: "View manager details and salary information",
    icon: UserCog,
    color: "manager",
  },
  {
    title: "HR",
    description: "View Project HR, Administrative HR and other HR roles",
    icon: UserRound,
    color: "hr",
  },
  {
    title: "Team Leader",
    description: "View team leaders and their assigned projects",
    icon: BriefcaseBusiness,
    color: "leader",
  },
  {
    title: "Employee",
    description: "View employees, project assignments and work details",
    icon: Users,
    color: "employee",
  },
];

const hrCategories = [
  "All HR",
  "Project HR",
  "Administrative HR",
  "Recruitment HR",
];

const getEmployeeWorkMode = (employee) => {
  const workMode = String(
    employee.workMode ?? employee.work_mode ?? ""
  )
    .trim()
    .toLowerCase();

  if (workMode === "office") return "Office";
  if (workMode === "hybrid") return "Hybrid";
  return null;
};

const getEmployeeStatus = (employee) => {
  const status = employee.status || employee.employmentStatus;

  if (typeof status === "string") return status;
  return status?.label || status?.name || "Active";
};

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

function Employees() {
  const [searchParams] = useSearchParams();
  const navigateToKpi = useKpiNavigation();
  const [employeeData, setEmployeeData] = useState(readEmployeeRecords);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [employeeDraft, setEmployeeDraft] = useState(null);
  const [kpiFilter] = useKpiFilter();
  const [selectedRole] = useKpiScopedState(
    kpiFilter,
    kpiFilter === "all" || kpiFilter.startsWith("status:")
      ? "All Employees"
      : kpiFilter.startsWith("role:")
        ? kpiFilter.slice("role:".length)
        : null
  );
  const [selectedHRCategory, setSelectedHRCategory] = useKpiScopedState(kpiFilter, "All HR");
  const [selectedWorkMode, setSelectedWorkMode] = useKpiScopedState(kpiFilter, "All");
  const [departmentFilter, setDepartmentFilter] = useKpiScopedState(kpiFilter, searchParams.get("department") || "All");
  const [projectFilter, setProjectFilter] = useKpiScopedState(kpiFilter, searchParams.get("project") || "All");
  const [designationFilter, setDesignationFilter] = useKpiScopedState(kpiFilter, "All");
  const [statusFilter, setStatusFilter] = useKpiScopedState(
    kpiFilter,
    kpiFilter.startsWith("status:") ? kpiFilter.slice("status:".length) : "All"
  );
  const [selectedWorkModeView, setSelectedWorkModeView] = useKpiScopedState(
    kpiFilter,
    kpiFilter.startsWith("workmode:") ? kpiFilter.slice("workmode:".length) : null
  );
  const [workModeSearch, setWorkModeSearch] = useKpiScopedState(kpiFilter, "");
  const [workModeDepartment, setWorkModeDepartment] = useKpiScopedState(kpiFilter, "All");
  const [workModeDesignation, setWorkModeDesignation] = useKpiScopedState(kpiFilter, "All");
  const [searchTerm, setSearchTerm] = useKpiScopedState(kpiFilter, searchParams.get("q") || "");
  const [selectedEmployee, setSelectedEmployee] = useKpiScopedState(kpiFilter, null);

  useEffect(() => {
    saveEmployeeRecords(employeeData);
  }, [employeeData]);

  const workModeCounts = useMemo(
    () =>
      employeeData.reduce(
        (counts, employee) => {
          const workMode = getEmployeeWorkMode(employee);
          if (workMode) counts[workMode] += 1;
          return counts;
        },
        { Office: 0, Hybrid: 0 }
      ),
    [employeeData]
  );

  // --------------------------------------------------
  // FILTER EMPLOYEES
  // --------------------------------------------------

  const roleEmployees = useMemo(() => {
    if (!selectedRole) return [];

    // All Employees displays the complete company employee list.
    let filtered =
      selectedRole === "All Employees"
        ? [...employeeData]
        : employeeData.filter(
            (employee) => employee.role === selectedRole
          );

    // HR category filtering
    if (
      selectedRole === "HR" &&
      selectedHRCategory !== "All HR"
    ) {
      filtered = filtered.filter(
        (employee) => employee.category === selectedHRCategory
      );
    }

    if (selectedWorkMode !== "All") {
      filtered = filtered.filter((employee) => {
        return getEmployeeWorkMode(employee) === selectedWorkMode;
      });
    }

    if (departmentFilter !== "All") {
      filtered = filtered.filter((employee) => employee.department === departmentFilter);
    }

    if (projectFilter !== "All") {
      filtered = filtered.filter((employee) => employee.project === projectFilter);
    }

    if (designationFilter !== "All") {
      filtered = filtered.filter((employee) => employee.designation === designationFilter);
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((employee) => getEmployeeStatus(employee) === statusFilter);
    }

    // Search filtering
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      filtered = filtered.filter((employee) =>
        [
          employee.id,
          employee.name,
          employee.role,
          employee.designation,
          employee.department,
          employee.project,
          employee.work,
          employee.category,
          employee.email,
          employee.phone,
          getEmployeeStatus(employee),
          employee.workMode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return filtered;
  }, [
    selectedRole,
    employeeData,
    selectedHRCategory,
    selectedWorkMode,
    departmentFilter,
    projectFilter,
    designationFilter,
    statusFilter,
    searchTerm,
  ]);

  const workModeEmployees = useMemo(() => {
    const search = workModeSearch.trim().toLowerCase();
    if (!selectedWorkModeView) return [];

    return employeeData.filter((employee) => {
      const matchesMode =
        getEmployeeWorkMode(employee) === selectedWorkModeView;
      const matchesSearch =
        !search ||
        employee.name.toLowerCase().includes(search) ||
        employee.id.toLowerCase().includes(search);
      const matchesDepartment =
        workModeDepartment === "All" ||
        employee.department === workModeDepartment;
      const matchesDesignation =
        workModeDesignation === "All" ||
        employee.designation === workModeDesignation;

      return (
        matchesMode &&
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation
      );
    });
  }, [
    selectedWorkModeView,
    employeeData,
    workModeSearch,
    workModeDepartment,
    workModeDesignation,
  ]);

  const workModeDepartments = useMemo(
    () =>
      [
        ...new Set(
          employeeData
            .filter(
              (employee) =>
                getEmployeeWorkMode(employee) === selectedWorkModeView
            )
            .map((employee) => employee.department)
            .filter(Boolean)
        ),
      ].sort(),
    [employeeData, selectedWorkModeView]
  );

  const workModeDesignations = useMemo(
    () =>
      [
        ...new Set(
          employeeData
            .filter(
              (employee) =>
                getEmployeeWorkMode(employee) === selectedWorkModeView
            )
            .map((employee) => employee.designation)
            .filter(Boolean)
        ),
      ].sort(),
    [employeeData, selectedWorkModeView]
  );

  // --------------------------------------------------
  // ROLE COUNTS
  // --------------------------------------------------

  const getRoleCount = (role) =>
    employeeData.filter(
      (employee) => employee.role === role
    ).length;

  // --------------------------------------------------
  // FORMAT SALARY
  // --------------------------------------------------

  const formatSalary = (salary) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(salary);

  // --------------------------------------------------
  // CLICK ROLE CATEGORY
  // --------------------------------------------------

  const handleRoleClick = (role) => {
    navigateToKpi("/admin/employees", `role:${role}`);
  };

  const handleWorkModeCardClick = (workMode) => {
    navigateToKpi("/admin/employees", `workmode:${workMode}`);
  };

  const getEmployeePhoto = (employee) => {
    const photo =
      employee.photoUrl ||
      employee.photo ||
      employee.avatarUrl ||
      employee.avatar ||
      employee.imageUrl ||
      employee.profilePhoto ||
      employee.profilePicture ||
      null;

    return typeof photo === "string" ? photo : photo?.url || null;
  };

  const getEmployeeManager = (employee) => {
    const parentId = employee.role === "Manager"
      ? employee.administrationId
      : employee.role === "HR"
        ? employee.managerId
        : employee.role === "Team Leader"
          ? employee.hrId
          : employee.role === "Employee"
            ? employee.teamLeaderId
            : "";
    const parent = employeeData.find((record) => record.id === parentId);
    const manager = employee.reportingManager || employee.managerName || employee.manager;
    if (parent) return parent.name;
    if (typeof manager === "string") return manager;
    return manager?.name || "Not provided";
  };

  const departmentOptions = [...new Set(employeeData.map((employee) => employee.department).filter(Boolean))].sort();
  const projectOptions = [...new Set(employeeData.map((employee) => employee.project).filter(Boolean))].sort();
  const designationOptions = [...new Set(employeeData.map((employee) => employee.designation).filter(Boolean))].sort();

  const exportEmployees = () => {
    downloadCsv(
      "employee-records.csv",
      ["Employee ID", "Name", "Role", "Designation", "Department", "Project", "Status", "Work Mode", "Email", "Joining Date"],
      roleEmployees.map((employee) => [
        employee.id,
        employee.name,
        employee.role,
        employee.designation,
        employee.department,
        employee.project,
        getEmployeeStatus(employee),
        getEmployeeWorkMode(employee) || "",
        employee.email,
        employee.joiningDate,
      ])
    );
  };

  const startEditingEmployee = () => {
    setIsCreatingEmployee(false);
    setEmployeeDraft({
      ...selectedEmployee,
      status: getEmployeeStatus(selectedEmployee),
    });
    setIsEditingEmployee(true);
  };

  const saveEmployeeChanges = (event) => {
    event.preventDefault();
    const requiredFields = ["name", "role", "designation", "department", "project"];
    if (isCreatingEmployee) requiredFields.push("email", "phone", "joiningDate");
    if (requiredFields.some((field) => !employeeDraft[field]?.trim())) {
      alert("Complete all required employee details before saving.");
      return;
    }

    if (isCreatingEmployee) {
      if (employeeData.some((employee) => employee.id === employeeDraft.id)) {
        alert("An employee with this ID already exists.");
        return;
      }

      const actor = readAdminProfile().name || "Admin User";
      try {
        recordAuditEvent({
          actor,
          action: "employee.created",
          entityType: "Employee",
          entityId: employeeDraft.id,
          summary: `${actor} created ${employeeDraft.name}'s employee record.`,
          details: { role: employeeDraft.role, department: employeeDraft.department },
        });
      } catch (error) {
        console.error("Unable to record the employee creation in audit history.", error);
        alert("The employee record was not created because its audit entry could not be saved.");
        return;
      }

      setEmployeeData((current) => [...current, employeeDraft]);
      setSelectedEmployee(employeeDraft);
      setIsCreatingEmployee(false);
      return;
    }

    const previous = employeeData.find((employee) => employee.id === selectedEmployee.id);
    const editableFields = ["name", "role", "designation", "department", "project", "email", "phone", "joiningDate", "status"];
    const changedFields = editableFields
      .filter((field) => (field === "status" ? getEmployeeStatus(previous) : previous[field] || "") !== employeeDraft[field])
      .reduce((changes, field) => ({
        ...changes,
        [field]: { before: field === "status" ? getEmployeeStatus(previous) : previous[field] || "", after: employeeDraft[field] },
      }), {});
    if (!Object.keys(changedFields).length) {
      setIsEditingEmployee(false);
      return;
    }

    const updatedEmployee = { ...previous, ...employeeDraft };
    const actor = readAdminProfile().name || "Admin User";
    try {
      recordAuditEvent({
        actor,
        action: changedFields.role ? "employee.role-updated" : "employee.details-updated",
        entityType: "Employee",
        entityId: previous.id,
        summary: `${actor} updated ${previous.name}'s employee record${changedFields.role ? " and role" : ""}.`,
        details: changedFields,
      });
    } catch (error) {
      console.error("Unable to record the employee change in audit history.", error);
      alert("Employee changes were not applied because the audit entry could not be saved.");
      return;
    }

    setEmployeeData((current) => current.map((employee) =>
      employee.id === updatedEmployee.id ? updatedEmployee : employee
    ));
    setSelectedEmployee(updatedEmployee);
    setIsEditingEmployee(false);
  };

  const closeEmployeeProfile = () => {
    setSelectedEmployee(null);
    setIsCreatingEmployee(false);
    setIsEditingEmployee(false);
  };

  // --------------------------------------------------
  // CLICK TOTAL EMPLOYEES
  // --------------------------------------------------

  const handleTotalEmployeesClick = () => {
    navigateToKpi("/admin/employees", "all");
  };

  // --------------------------------------------------
  // BACK TO CATEGORIES
  // --------------------------------------------------

  const handleBack = () => {
    navigateToKpi("/admin/employees", "");
    setSearchTerm("");
    setSelectedHRCategory("All HR");
    setSelectedWorkMode("All");
    setSelectedEmployee(null);
  };

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <div className="employees-page">

      {/* PAGE HEADER */}

      <div className="employees-header">
        <div>
          <span className="employees-eyebrow">
            HRMS / ADMINISTRATION
          </span>

          <h1>Employee Management</h1>

          <p>
            Manage administration, managers, HR teams, team leaders and employees.
          </p>
        </div>

        <div className="employees-header-actions">
          <button
            type="button"
            className="employee-export-button"
            onClick={exportEmployees}
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            type="button"
            className="employees-total-badge"
            onClick={handleTotalEmployeesClick}
          >
            <Users size={18} />
            <span>{employeeData.length} Total Employees</span>
          </button>
        </div>
      </div>

      {/* WORK MODE SUMMARY */}

      <div className="employee-workmode-summary">
        <button
          type="button"
          className="employee-workmode-card"
          onClick={() => handleWorkModeCardClick("Office")}
          aria-label={`View ${workModeCounts.Office} Office employees`}
        >
          <div className="employee-workmode-icon office">
            <Building2 size={22} />
          </div>
          <div>
            <span>Office Employees</span>
            <strong>{workModeCounts.Office}</strong>
          </div>
          <span className="employee-workmode-card-action">
            View employees
          </span>
        </button>

        <button
          type="button"
          className="employee-workmode-card"
          onClick={() => handleWorkModeCardClick("Hybrid")}
          aria-label={`View ${workModeCounts.Hybrid} Hybrid employees`}
        >
          <div className="employee-workmode-icon hybrid">
            <Laptop size={22} />
          </div>
          <div>
            <span>Hybrid Employees</span>
            <strong>{workModeCounts.Hybrid}</strong>
          </div>
          <span className="employee-workmode-card-action">
            View employees
          </span>
        </button>
      </div>

      {/* WORK MODE EMPLOYEE DETAILS */}

      {selectedWorkModeView && (
        <section className="employee-details-section employee-workmode-details">
          <div className="employee-details-top">
            <button
              type="button"
              className="employee-back-button"
              onClick={() => setSelectedWorkModeView(null)}
            >
              <ArrowLeft size={17} />
              Back to Employees
            </button>

            <div>
              <h2>{selectedWorkModeView} Employees</h2>
              <p>
                {workModeCounts[selectedWorkModeView]} employees work in{" "}
                {selectedWorkModeView.toLowerCase()} mode.
              </p>
            </div>
          </div>

          <div className="employee-list-toolbar employee-workmode-toolbar">
            <div className="employee-count-label">
              <Users size={19} />
              <span>
                {workModeEmployees.length} of{" "}
                {workModeCounts[selectedWorkModeView]}{" "}
                {selectedWorkModeView} Employees
              </span>
            </div>

            <div className="employee-search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={workModeSearch}
                onChange={(event) => setWorkModeSearch(event.target.value)}
                aria-label="Search employees by name or ID"
              />
            </div>

            <select
              className="employee-workmode-filter"
              value={workModeDepartment}
              onChange={(event) =>
                setWorkModeDepartment(event.target.value)
              }
              aria-label="Filter by department"
            >
              <option value="All">All Departments</option>
              {workModeDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <select
              className="employee-workmode-filter"
              value={workModeDesignation}
              onChange={(event) =>
                setWorkModeDesignation(event.target.value)
              }
              aria-label="Filter by designation"
            >
              <option value="All">All Designations</option>
              {workModeDesignations.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
          </div>

          <div className="employee-table-card">
            <div className="employee-table-wrapper">
              <table className="employee-table employee-workmode-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Photo</th>
                    <th>Email Address</th>
                    <th>Designation / Job Role</th>
                    <th>Department</th>
                    <th>Assigned Project</th>
                    <th>Reporting Manager</th>
                    <th>Work Mode</th>
                    <th>Employee Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workModeEmployees.length > 0 ? (
                    workModeEmployees.map((employee) => {
                      const photo = getEmployeePhoto(employee);
                      const workMode = getEmployeeWorkMode(employee);
                      const status = getEmployeeStatus(employee);

                      return (
                        <tr key={employee.id}>
                          <td>
                            <span className="employee-id">
                              {employee.id}
                            </span>
                          </td>
                          <td className="employee-name">{employee.name}</td>
                          <td>
                            {photo ? (
                              <img
                                className="employee-workmode-photo"
                                src={photo}
                                alt={`${employee.name}`}
                                loading="lazy"
                              />
                            ) : (
                              <span
                                className="employee-workmode-photo-fallback"
                                aria-label="No employee photo available"
                              >
                                {employee.name
                                  .split(/\s+/)
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td>{employee.email || "Not provided"}</td>
                          <td>
                            {employee.designation || employee.role || "Not provided"}
                          </td>
                          <td>{employee.department || "Not provided"}</td>
                          <td>{employee.project || "Not provided"}</td>
                          <td>{getEmployeeManager(employee)}</td>
                          <td>
                            <span
                              className={`employee-workmode-badge ${
                                workMode === "Hybrid" ? "hybrid" : "office"
                              }`}
                            >
                              {workMode}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`employee-workmode-status ${
                                status === "Not provided"
                                  ? "unavailable"
                                  : ""
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="employee-empty-state">
                        No {selectedWorkModeView.toLowerCase()} employees match
                        the selected search and filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ROLE OVERVIEW */}

      {!selectedRole && !selectedWorkModeView && (
        <>
          <div className="employee-overview-heading">
            <div>
              <h2>Employee Categories</h2>
              <p>
                Select a category to view employee information.
              </p>
            </div>
          </div>

          <div className="employee-role-grid">

            {roleCards.map((role) => {
              const Icon = role.icon;
              const count = getRoleCount(role.title);

              return (
                <button
                  type="button"
                  className="employee-role-card"
                  key={role.title}
                  onClick={() => handleRoleClick(role.title)}
                >
                  <div
                    className={`employee-role-icon ${role.color}`}
                  >
                    <Icon size={25} />
                  </div>

                  <div className="employee-role-card-content">
                    <h3>{role.title}</h3>
                    <p>{role.description}</p>
                  </div>

                  <div className="employee-role-card-footer">
                    <strong>{count}</strong>
                    <span>
                      {count === 1 ? "Person" : "People"}
                    </span>
                  </div>

                  <span className="employee-role-arrow">
                    View Details →
                  </span>
                </button>
              );
            })}

          </div>

          {/* CLICKABLE TOTAL EMPLOYEES SUMMARY */}

          <button
            type="button"
            className="employee-summary-card"
            onClick={handleTotalEmployeesClick}
          >
            <div className="employee-summary-icon">
              <Users size={23} />
            </div>

            <div>
              <span>Total Company Employees</span>
              <h2>{employeeData.length}</h2>
              <p>
                Includes Administration, managers, HR, team leaders and employees.
                Click to view all employee details.
              </p>
            </div>
          </button>
        </>
      )}

      {/* SELECTED ROLE DETAILS */}

      {selectedRole && !selectedWorkModeView && (
        <section className="employee-details-section">

          <div className="employee-details-top">

            <button
              type="button"
              className="employee-back-button"
              onClick={handleBack}
            >
              <ArrowLeft size={17} />
              Back to Categories
            </button>

            <div>
              <h2>
                {selectedRole === "All Employees"
                  ? "All Company Employees"
                  : `${selectedRole} Details`}
              </h2>

              <p>
                {selectedRole === "All Employees"
                  ? "View the complete list of all company employees and their details."
                  : selectedRole === "HR"
                  ? "View HR team members by their responsibilities."
                  : selectedRole === "Team Leader"
                  ? "View team leaders and their assigned projects."
                  : selectedRole === "Manager"
                  ? "View manager information and salary details."
                  : "View employee information and project assignments."}
              </p>
            </div>

          </div>

          {/* HR SUBCATEGORIES */}

          {selectedRole === "HR" && (
            <div className="hr-category-section">
              <h3>HR Categories</h3>

              <div className="hr-category-buttons">
                {hrCategories.map((category) => {
                  const count =
                    category === "All HR"
                      ? getRoleCount("HR")
                      : employeeData.filter(
                          (employee) =>
                            employee.role === "HR" &&
                            employee.category === category
                        ).length;

                  return (
                    <button
                      type="button"
                      key={category}
                      className={`hr-category-button ${
                        selectedHRCategory === category
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedHRCategory(category)
                      }
                    >
                      {category}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EMPLOYEE COUNT AND SEARCH */}

          <div className="employee-list-toolbar">

            <div className="employee-count-label">
              <FolderKanban size={19} />

              <span>
                {roleEmployees.length}{" "}
                {selectedRole === "All Employees"
                  ? "Total Employees"
                  : selectedRole === "HR"
                  ? "HR Members"
                  : selectedRole === "Team Leader"
                  ? "Team Leaders"
                  : selectedRole === "Manager"
                  ? "Managers"
                  : "Employees"}
              </span>
            </div>

            <div className="employee-search-box">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search by name, ID, project..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <select
              className="employee-workmode-filter"
              value={selectedWorkMode}
              onChange={(event) =>
                setSelectedWorkMode(event.target.value)
              }
              aria-label="Filter by work mode"
            >
              <option value="All">All Work Modes</option>
              <option value="Office">Office</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              className="employee-workmode-filter"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              aria-label="Filter by department"
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>

            <select
              className="employee-workmode-filter"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              aria-label="Filter by project"
            >
              <option value="All">All Projects</option>
              {projectOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>

            <select
              className="employee-workmode-filter"
              value={designationFilter}
              onChange={(event) => setDesignationFilter(event.target.value)}
              aria-label="Filter by designation"
            >
              <option value="All">All Designations</option>
              {designationOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>

            <select
              className="employee-workmode-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by employee status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>

            <button type="button" className="employee-export-button" onClick={exportEmployees}>
              <Download size={15} />
              Export CSV
            </button>

          </div>

          {/* EMPLOYEE TABLE */}

          <div className="employee-table-card">

            <div className="employee-table-wrapper">

              <table className="employee-table">

                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>

                    {selectedRole === "All Employees" && (
                      <th>Role</th>
                    )}

                    <th>Designation</th>

                    {selectedRole === "HR" && (
                      <th>HR Category</th>
                    )}

                    {(selectedRole === "Manager" ||
                      selectedRole === "All Employees") && (
                      <th>Salary</th>
                    )}

                    <th>Project</th>
                    <th>Work / Responsibility</th>
                    <th>Work Mode</th>
                    <th>Department</th>
                    <th>Email Address</th>
                    <th>Contact Number</th>
                    <th>Reporting Manager</th>
                    <th>Joining Date</th>
                    <th>Employment Status</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>

                  {roleEmployees.map((employee) => (
                    <tr key={employee.id}>

                      <td>
                        <span className="employee-id">
                          {employee.id}
                        </span>
                      </td>

                      <td className="employee-name">
                        {employee.name}
                      </td>

                      {selectedRole === "All Employees" && (
                        <td>
                          <span className="employee-category-tag">
                            {employee.role}
                          </span>
                        </td>
                      )}

                      <td>{employee.designation}</td>

                      {selectedRole === "HR" && (
                        <td>
                          <span className="employee-category-tag">
                            {employee.category}
                          </span>
                        </td>
                      )}

                      {(selectedRole === "Manager" ||
                        selectedRole === "All Employees") && (
                        <td className="employee-salary">
                          <IndianRupee size={13} />
                          {formatSalary(employee.salary)}
                        </td>
                      )}

                      <td>{employee.project}</td>

                      <td className="employee-work-cell">
                        {employee.work}
                      </td>

                      <td>
                        <span
                          className={`employee-workmode-badge ${
                            employee.workMode === "Hybrid"
                              ? "hybrid"
                              : "office"
                          }`}
                        >
                          {employee.workMode === "Hybrid"
                            ? "Hybrid"
                            : "Office"}
                        </span>
                      </td>

                      <td>{employee.department}</td>
                      <td>{employee.email || "Not provided"}</td>
                      <td>{employee.phone || employee.phoneNumber || employee.mobile || "Not provided"}</td>
                      <td>{getEmployeeManager(employee)}</td>
                      <td>{employee.joiningDate || "Not provided"}</td>
                      <td>{getEmployeeStatus(employee)}</td>

                      <td>
                        <button
                          type="button"
                          className="employee-view-button"
                          onClick={() =>
                            setSelectedEmployee(employee)
                          }
                        >
                          View
                        </button>
                      </td>

                    </tr>
                  ))}

                  {roleEmployees.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          13 +
                            (selectedRole === "All Employees" ? 2 : 0) +
                            (selectedRole === "HR" ? 1 : 0) +
                            (selectedRole === "Manager" ? 1 : 0)
                        }
                        className="employee-empty-state"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>
      )}

      {/* EMPLOYEE PROFILE POPUP */}

      {(selectedEmployee || isCreatingEmployee) && (
        <div
          className="employee-modal-overlay"
          onClick={closeEmployeeProfile}
        >
          <div
            className="employee-profile-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="employee-modal-header">
              <div>
                <span>{isCreatingEmployee ? "NEW EMPLOYEE" : "EMPLOYEE PROFILE"}</span>
                <h2>{isCreatingEmployee ? "Add Employee" : selectedEmployee.name}</h2>
              </div>

              <button
                type="button"
                onClick={closeEmployeeProfile}
                className="employee-modal-close"
                aria-label="Close profile"
              >
                <X size={20} />
              </button>
            </div>

            {isEditingEmployee ? (
              <form className="employee-edit-form" onSubmit={saveEmployeeChanges}>
                <div className="employee-profile-grid">
                  <label>
                    <span>Employee ID</span>
                    <input value={employeeDraft.id} readOnly />
                  </label>
                  {[
                    ["Name", "name"],
                    ["Designation", "designation"],
                    ["Department", "department"],
                    ["Project", "project"],
                    ["Email Address", "email"],
                    ["Contact Number", "phone"],
                    ["Joining Date", "joiningDate"],
                  ].map(([label, field]) => (
                    <label key={field}>
                      <span>{label}</span>
                      <input
                        type={field === "joiningDate" ? "date" : "text"}
                        value={employeeDraft[field] || ""}
                        onChange={(event) => setEmployeeDraft((draft) => ({
                          ...draft,
                          [field]: event.target.value,
                        }))}
                      />
                    </label>
                  ))}
                  <label>
                    <span>Role</span>
                    <select
                      value={employeeDraft.role}
                      onChange={(event) => setEmployeeDraft((draft) => ({
                        ...draft,
                        role: event.target.value,
                      }))}
                    >
                      {roleCards.map((role) => <option value={role.title} key={role.title}>{role.title}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select
                      value={employeeDraft.status}
                      onChange={(event) => setEmployeeDraft((draft) => ({
                        ...draft,
                        status: event.target.value,
                      }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </label>
                </div>
                <div className="employee-profile-actions">
                  <button type="button" className="employee-profile-cancel" onClick={() => setIsEditingEmployee(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="employee-profile-done">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
            <div className="employee-profile-grid">

              <div>
                <span>Employee ID</span>
                <strong>{selectedEmployee.id}</strong>
              </div>

              <div>
                <span>Name</span>
                <strong>{selectedEmployee.name}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{selectedEmployee.role}</strong>
              </div>

              <div>
                <span>Designation</span>
                <strong>{selectedEmployee.designation}</strong>
              </div>

              <div>
                <span>Department</span>
                <strong>{selectedEmployee.department}</strong>
              </div>

              <div>
                <span>Work Mode</span>
                <strong>
                  {selectedEmployee.workMode === "Hybrid"
                    ? "Hybrid"
                    : "Office"}
                </strong>
              </div>

              <div>
                <span>Project</span>
                <strong>{selectedEmployee.project}</strong>
              </div>

              <div>
                <span>Salary</span>
                <strong>
                  {formatSalary(selectedEmployee.salary)}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{selectedEmployee.email}</strong>
              </div>

              <div>
                <span>Contact Number</span>
                <strong>{selectedEmployee.phone || "Not provided"}</strong>
              </div>

              <div>
                <span>Reporting Manager</span>
                <strong>{getEmployeeManager(selectedEmployee)}</strong>
              </div>

              <div>
                <span>Employment Status</span>
                <strong>{getEmployeeStatus(selectedEmployee)}</strong>
              </div>

              <div>
                <span>Joining Date</span>
                <strong>{selectedEmployee.joiningDate}</strong>
              </div>

              <div className="employee-profile-full">
                <span>Current Work / Responsibility</span>
                <strong>{selectedEmployee.work}</strong>
              </div>

            </div>

            <div className="employee-profile-actions">
              <button
                type="button"
                className="employee-profile-edit"
                onClick={startEditingEmployee}
              >
                Edit Details
              </button>
              <button
                type="button"
                className="employee-profile-done"
                onClick={closeEmployeeProfile}
              >
                Close Profile
              </button>
            </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default Employees;
