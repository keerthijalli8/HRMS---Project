import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Database,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { readEmployeeRecords } from "../services/employeeRecords";
import "../style/Modules.css";
import "../style/OrganizationAdmin.css";

const modules = [
  ["Dashboard", ["View Dashboard"]],
  ["Employees", ["View Employees", "Add Employee", "Edit Employee", "Delete Employee", "Export Employee Data"]],
  ["Departments", ["View Departments", "Create Department", "Edit Department", "Delete Department", "Add Employees", "Assign Department Manager"]],
  ["Attendance", ["View Attendance", "Edit Attendance", "Approve Attendance", "Export Attendance Reports"]],
  ["Leaves", ["View Leave Requests", "Apply for Leave", "Approve Leave", "Reject Leave", "Manage Leave Policies"]],
  ["Payroll", ["View Payroll", "Edit Salary Details", "Process Payroll", "Approve Payroll", "Generate Payslips", "Export Payroll Reports", "View Experience", "Edit Experience", "Configure Experience Slabs", "Edit Salary Components", "Manage Salary Structures", "Approve Salary Revisions"]],
  ["Performance", ["View Performance", "Create Review", "Edit Review", "Approve Review", "Export Performance Reports"]],
  ["Notifications", ["View Notifications", "Send Notifications", "Manage Preferences"]],
  ["Announcements", ["View Announcements", "Create Announcement", "Publish Announcement"]],
  ["Reports & Audits", ["View Reports", "Export Reports", "View Audit History"]],
  ["Settings", ["View Settings", "Edit Organization Settings"]],
  ["Company Branding", ["View Company Branding", "Apply Theme Across Company", "Edit Company Branding", "Change Theme Colours", "Upload Company Logo", "Manage Theme Presets", "Reset Theme to Default"]],
  ["Organization Profile", ["View Organization Profile", "Edit Organization Profile"]],
  ["HR Configuration", ["View HR Configuration", "Edit HR Configuration"]],
  ["Workflow Management", ["View Workflow Dashboard", "View Approval Workflows", "Create Approval Workflows", "Edit Approval Workflows", "Manage Approvers", "Manage Escalation Rules", "View Approval History", "Export Workflow Reports"]],
  ["Integrations", ["View Integrations", "Manage Integrations"]],
];

const scopes = [
  "All Organization Data",
  "Assigned Department Only",
  "Assigned Team Only",
  "Own Records Only",
  "Custom Scope",
  "All Organization Workflows",
  "Assigned Department Workflows",
  "Assigned Team Workflows",
  "Only Assigned Approval Requests",
  "Custom Department Scope",
];

const defaultRoleAccess = {
  "Organization Admin": "all",
  "HR Manager": ["Dashboard", "Employees", "Departments", "Attendance", "Leaves", "Performance", "Notifications", "Announcements", "Reports & Audits", "Organization Profile", "HR Configuration"],
  "Department Manager": ["Dashboard", "Employees", "Departments", "Attendance", "Leaves", "Notifications", "Reports & Audits"],
  "Team Leader": ["Dashboard", "Employees", "Attendance", "Leaves", "Notifications"],
  "Payroll Admin": ["Dashboard", "Employees", "Payroll", "Reports & Audits"],
  Manager: ["Dashboard", "Employees", "Departments", "Attendance", "Leaves", "Performance", "Notifications", "Reports & Audits"],
  Employee: ["Dashboard", "Attendance", "Leaves", "Notifications", "Announcements"],
};

const viewActions = [
  "View Dashboard",
  "View Employees",
  "View Departments",
  "View Attendance",
  "View Leave Requests",
  "Apply for Leave",
  "View Payroll",
  "View Performance",
  "View Notifications",
  "View Announcements",
  "View Reports",
  "View Organization Profile",
  "View HR Configuration",
  "View Workflow Dashboard",
  "View Approval Workflows",
  "View Approval History",
  "View Integrations",
];

const keyFor = (type, id) => "hrms-permissions-" + type + "-" + id;

const normalizeRole = (role) =>
  role === "HR"
    ? "HR Manager"
    : role === "Administration"
      ? "Organization Admin"
      : role;

function makeDefault(role) {
  const roleName = normalizeRole(role);
  const access = defaultRoleAccess[roleName] || [];

  const modulesState = Object.fromEntries(
    modules.map(([name]) => [
      name,
      access === "all" || access.includes(name),
    ]),
  );

  const actionsState = Object.fromEntries(
    modules.map(([name, actions]) => [
      name,
      Object.fromEntries(
        actions.map((action) => [
          action,
          modulesState[name] &&
            (access === "all" || viewActions.includes(action)),
        ]),
      ),
    ]),
  );

  return {
    modules: modulesState,
    actions: actionsState,
    scope:
      roleName === "Employee"
        ? "Only Assigned Approval Requests"
        : roleName === "Department Manager" || roleName === "Manager"
          ? "Assigned Department Workflows"
          : "All Organization Workflows",
    customDepartments: [],
  };
}

function normalizePermissionState(raw, role) {
  const fallback = makeDefault(role);
  const source = raw && typeof raw === "object" ? raw : {};

  return {
    modules: Object.fromEntries(
      modules.map(([name]) => [
        name,
        typeof source.modules?.[name] === "boolean"
          ? source.modules[name]
          : fallback.modules[name],
      ]),
    ),
    actions: Object.fromEntries(
      modules.map(([name, actions]) => [
        name,
        Object.fromEntries(
          actions.map((action) => [
            action,
            typeof source.actions?.[name]?.[action] === "boolean"
              ? source.actions[name][action]
              : fallback.actions[name][action],
          ]),
        ),
      ]),
    ),
    scope: scopes.includes(source.scope) ? source.scope : fallback.scope,
    customDepartments: Array.isArray(source.customDepartments)
      ? source.customDepartments
      : [],
  };
}

function loadLocalPermission(targetType, targetId, role) {
  try {
    const saved = localStorage.getItem(keyFor(targetType, targetId));
    return saved ? JSON.parse(saved) : makeDefault(role);
  } catch {
    return makeDefault(role);
  }
}

function Heading({ title, description }) {
  return (
    <div className="module-card-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function PermissionActions({
  moduleName,
  actions,
  permissionState,
  toggleAction,
}) {
  return (
    <div className="permission-actions">
      {actions.map((action) => (
        <label key={action}>
          <input
            type="checkbox"
            checked={Boolean(permissionState.actions[moduleName]?.[action])}
            onChange={() => toggleAction(moduleName, action)}
          />
          <span>{action}</span>
          <small>
            {permissionState.actions[moduleName]?.[action]
              ? "Allowed"
              : "Denied"}
          </small>
        </label>
      ))}
    </div>
  );
}

export default function Permissions() {
  const [employees] = useState(() => readEmployeeRecords());

  const roles = useMemo(
    () => [
      ...new Set([
        "Organization Admin",
        "HR Manager",
        "Department Manager",
        "Team Leader",
        "Payroll Admin",
        "Manager",
        "Employee",
        ...employees.map((employee) => employee.role).filter(Boolean),
      ]),
    ],
    [employees],
  );

  const people = employees.filter(
    (employee) => employee.status !== "Inactive",
  );

  const [targetType, setTargetType] = useState("role");
  const [targetId, setTargetId] = useState("Organization Admin");
  const [permissionState, setPermissionState] = useState(() =>
    makeDefault("Organization Admin"),
  );
  const [expanded, setExpanded] = useState(
    () => new Set(["Employees", "Workflow Management"]),
  );
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPerson = people.find(
    (employee) => String(employee.id) === String(targetId),
  );

  const selectedRole =
    targetType === "role"
      ? targetId
      : selectedPerson?.role || "Employee";

  const selectTarget = async (type, id) => {
    setTargetType(type);
    setTargetId(id);
    setLoading(true);

    const role =
      type === "role"
        ? id
        : people.find((employee) => String(employee.id) === String(id))
            ?.role || "Employee";

    setPermissionState(
      normalizePermissionState(loadLocalPermission(type, id, role), role),
    );

    setLoading(false);
  };

  const toggleModule = (name) =>
    setPermissionState((current) => ({
      ...current,
      modules: {
        ...current.modules,
        [name]: !current.modules[name],
      },
      actions: {
        ...current.actions,
        [name]: Object.fromEntries(
          (modules.find(([module]) => module === name)?.[1] || []).map(
            (action) => [action, !current.modules[name]],
          ),
        ),
      },
    }));

  const toggleAction = (module, action) =>
    setPermissionState((current) => ({
      ...current,
      modules: {
        ...current.modules,
        [module]: true,
      },
      actions: {
        ...current.actions,
        [module]: {
          ...current.actions[module],
          [action]: !current.actions[module]?.[action],
        },
      },
    }));

  const visibleModules = modules.filter(([name, actions]) =>
    (name + " " + actions.join(" "))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const allowedModules = Object.values(permissionState.modules).filter(
    Boolean,
  ).length;

  const allowedActions = Object.values(permissionState.actions)
    .flatMap((actions) => Object.values(actions))
    .filter(Boolean).length;

  const selectAll = () =>
    setPermissionState((current) => ({
      ...current,
      modules: Object.fromEntries(
        modules.map(([name]) => [name, true]),
      ),
      actions: Object.fromEntries(
        modules.map(([name, actions]) => [
          name,
          Object.fromEntries(actions.map((action) => [action, true])),
        ]),
      ),
    }));

  const clearAll = () =>
    setPermissionState((current) => ({
      ...current,
      modules: Object.fromEntries(
        modules.map(([name]) => [name, false]),
      ),
      actions: Object.fromEntries(
        modules.map(([name, actions]) => [
          name,
          Object.fromEntries(actions.map((action) => [action, false])),
        ]),
      ),
    }));

  const reset = () =>
    setPermissionState(normalizePermissionState(null, selectedRole));

  const save = async () => {
    const targetDescription =
      targetType === "role"
        ? "role " + targetId
        : selectedPerson?.name || "selected user";

    if (
      !window.confirm(
        "Save permissions for " + targetDescription + "?",
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem(
        keyFor(targetType, targetId),
        JSON.stringify(permissionState),
      );
      setNotice("Permissions saved locally.");
    } catch {
      setNotice("Unable to save permissions in this browser.");
    }

    setLoading(false);
    window.setTimeout(() => setNotice(""), 4000);
  };

  return (
    <div className="module-page permissions-page">
      <header className="module-page-header">
        <div>
          <span className="module-eyebrow">Organization management</span>
          <h1>Permissions</h1>
          <p>
            Configure module access, action permissions and organizational
            data scope.
          </p>
        </div>
        <div className="module-stat-icon">
          <ShieldCheck size={22} />
        </div>
      </header>

      {notice && (
        <div className="module-notice">
          <Check size={16} />
          {notice}
        </div>
      )}

      <section className="permissions-target module-card">
        <div className="permissions-target-type">
          <button
            className={targetType === "role" ? "active" : ""}
            onClick={() => selectTarget("role", "Organization Admin")}
          >
            <Users size={16} />
            Role
          </button>
          <button
            className={targetType === "user" ? "active" : ""}
            onClick={() => selectTarget("user", people[0]?.id || "")}
          >
            <UserRound size={16} />
            Individual User
          </button>
        </div>

        <select
          value={targetId}
          onChange={(event) =>
            selectTarget(targetType, event.target.value)
          }
        >
          {(targetType === "role"
            ? roles
            : people.map((employee) => employee.id)
          ).map((id) => (
            <option value={id} key={id}>
              {targetType === "role"
                ? id
                : people.find(
                    (employee) => String(employee.id) === String(id),
                  )?.name +
                  " (" +
                  id +
                  ")"}
            </option>
          ))}
        </select>

        {targetType === "user" && (
          <span className="permissions-inherited">
            Inherited role: {selectedRole}
          </span>
        )}
      </section>

      <div className="permissions-toolbar">
        <label className="permissions-search">
          <Search size={16} />
          <input
            placeholder="Search permissions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button className="module-button secondary" onClick={selectAll}>
          Select all
        </button>
        <button className="module-button secondary" onClick={clearAll}>
          Clear all
        </button>
        <button className="module-button secondary" onClick={reset}>
          <RotateCcw size={15} />
          Reset to Role Defaults
        </button>
      </div>

      <div className="permissions-layout">
        <main>
          <section className="module-card permissions-section">
            <Heading
              title="Module and action permissions"
              description="Deny by default. Expand Workflow Management to configure grouped actions."
            />

            {loading && (
              <p className="permissions-empty">Loading permission data...</p>
            )}

            {!loading &&
              visibleModules.map(([name, actions]) => (
                <div className="permission-module" key={name}>
                  <div className="permission-module-header">
                    <button
                      className="permission-expand"
                      onClick={() =>
                        setExpanded((current) => {
                          const next = new Set(current);
                          next.has(name)
                            ? next.delete(name)
                            : next.add(name);
                          return next;
                        })
                      }
                    >
                      <ChevronDown
                        className={expanded.has(name) ? "expanded" : ""}
                        size={17}
                      />
                      <strong>{name}</strong>
                      <span>
                        {
                          actions.filter(
                            (action) =>
                              permissionState.actions[name]?.[action],
                          ).length
                        }
                        /{actions.length} actions allowed
                      </span>
                    </button>

                    <button
                      className={
                        "permission-toggle " +
                        (permissionState.modules[name]
                          ? "allowed"
                          : "denied")
                      }
                      onClick={() => toggleModule(name)}
                    >
                      {permissionState.modules[name]
                        ? name === "Workflow Management"
                          ? "View Workflow Management"
                          : "Allow Access"
                        : name === "Workflow Management"
                          ? "No Access"
                          : "Deny Access"}
                    </button>
                  </div>

                  {expanded.has(name) && (
                    <PermissionActions
                      moduleName={name}
                      actions={actions}
                      permissionState={permissionState}
                      toggleAction={toggleAction}
                    />
                  )}
                </div>
              ))}

            {!visibleModules.length && (
              <p className="permissions-empty">
                No permissions match your search.
              </p>
            )}
          </section>

          <section className="module-card permissions-section">
            <Heading
              title="Data scope permissions"
              description="Limit records to the selected organization, department, team, or assigned approval requests."
            />

            <div className="scope-grid">
              {scopes.map((scope) => (
                <label
                  className={
                    permissionState.scope === scope ? "selected" : ""
                  }
                  key={scope}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={permissionState.scope === scope}
                    onChange={() =>
                      setPermissionState({
                        ...permissionState,
                        scope,
                      })
                    }
                  />
                  <Database size={16} />
                  <span>{scope}</span>
                </label>
              ))}
            </div>

            {(permissionState.scope === "Custom Scope" ||
              permissionState.scope === "Custom Department Scope") && (
              <input
                className="module-input"
                placeholder="Specific departments, teams, or workflow boundaries"
                value={permissionState.customDepartments.join(", ")}
                onChange={(event) =>
                  setPermissionState({
                    ...permissionState,
                    customDepartments: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            )}
          </section>
        </main>

        <aside className="permissions-summary module-card">
          <Heading
            title="Permission summary"
            description={
              targetType === "role"
                ? "Role: " + targetId
                : "User: " + (selectedPerson?.name || targetId)
            }
          />

          <div className="permission-summary-stat">
            <strong>{allowedModules}</strong>
            <span>Modules enabled</span>
          </div>

          <div className="permission-summary-stat">
            <strong>{allowedActions}</strong>
            <span>Actions allowed</span>
          </div>

          <div className="permission-summary-scope">
            <span>Data scope</span>
            <strong>{permissionState.scope}</strong>
          </div>

          <button
            className="module-button permissions-save"
            disabled={loading}
            onClick={save}
          >
            <Save size={16} />
            Save Changes
          </button>

          <button
            className="module-button secondary permissions-cancel"
            onClick={reset}
          >
            Cancel Changes
          </button>
        </aside>
      </div>
    </div>
  );
}