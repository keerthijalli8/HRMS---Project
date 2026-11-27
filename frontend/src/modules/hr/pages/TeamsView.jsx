import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Icon } from "../components/Icon.jsx";
import { QuickActionButton } from "../components/QuickActionButton.jsx";
import TeamsTabs from "../components/teams/TeamsTabs.jsx";
import DepartmentsOverview from "../components/teams/DepartmentsOverview.jsx";
import DepartmentEmployeesPage from "../components/teams/DepartmentEmployeesPage.jsx";
import EmployeeDetailPage from "../components/teams/EmployeeDetailPage.jsx";
import MyTeamPage from "../components/teams/MyTeamPage.jsx";
import TLEmployeesPage from "../components/teams/TLEmployeesPage.jsx";
import AddEditEmployeeModal from "../components/teams/AddEditEmployeeModal.jsx";
import AddDepartmentModal from "../components/teams/AddDepartmentModal.jsx";
import TeamsErrorBoundary from "../components/teams/TeamsErrorBoundary.jsx";
import {
  loadAllEmployees,
  loadDepartmentsList,
  getMainTLs,
  getDirectReports,
  getDepartmentEmployees,
  subscribeTeamStore,
} from "../services/teamService.js";

export function TeamsView({ currentUser, onTriggerToast }) {
  const [routeState, setRouteState] = useState(() => parseUrl());
  const [storeRevision, setStoreRevision] = useState(0);
  const directorySectionRef = useRef(null);

  // Always default to "departments" whenever Teams is opened
  const [activeDirectoryView, setActiveDirectoryView] = useState("departments");

  // Modals state
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [modalDefaultDept, setModalDefaultDept] = useState("");
  const [modalDefaultReportingTo, setModalDefaultReportingTo] = useState("");

  function parseUrl() {
    if (typeof window === "undefined") {
      return { view: "tab", tab: "employees", params: {} };
    }

    const path = window.location.pathname.replace(/^\/hr(?=\/|$)/, "") || "/";
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab") || "employees";

    // 1. /teams/departments/:departmentId
    const deptMatch = path.match(/^\/teams\/departments\/([^/]+)/);
    if (deptMatch) {
      return {
        view: "department",
        departmentId: decodeURIComponent(deptMatch[1]),
        tab: "employees",
        params: Object.fromEntries(searchParams.entries()),
      };
    }

    // 2. /teams/employees/:employeeId
    const empMatch = path.match(/^\/teams\/employees\/([^/]+)/);
    if (empMatch) {
      return {
        view: "employee-detail",
        employeeId: decodeURIComponent(empMatch[1]),
        tab: tabParam,
        params: Object.fromEntries(searchParams.entries()),
      };
    }

    // 3. /teams/my-team/tl/:tlId/employees
    const tlEmpsMatch = path.match(/^\/teams\/my-team\/tl\/([^/]+)\/employees/);
    if (tlEmpsMatch) {
      return {
        view: "tl-employees",
        tlId: decodeURIComponent(tlEmpsMatch[1]),
        tab: "my-team",
        params: Object.fromEntries(searchParams.entries()),
      };
    }

    // 4. /teams/my-team/tl/:mainTlId or /teams/my-team
    const myTeamMatch = path.match(/^\/teams\/my-team(?:\/tl\/([^/]+))?/);
    if (myTeamMatch) {
      return {
        view: "tab",
        tab: "my-team",
        mainTlId: myTeamMatch[1] ? decodeURIComponent(myTeamMatch[1]) : undefined,
        params: Object.fromEntries(searchParams.entries()),
      };
    }

    return {
      view: "tab",
      tab: tabParam === "my-team" ? "my-team" : "employees",
      params: Object.fromEntries(searchParams.entries()),
    };
  }

  // Ensure landing on /teams always opens Departments first
  useEffect(() => {
    setActiveDirectoryView("departments");
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("view")) {
        url.searchParams.delete("view");
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeTeamStore(() => {
      setStoreRevision((r) => r + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const next = parseUrl();
      setRouteState(next);
      if (next.view === "tab" && next.tab === "employees") {
        setActiveDirectoryView("departments");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = useCallback((url) => {
    const nextUrl = String(url || "/hr/teams").startsWith("/hr")
      ? url
      : `/hr${String(url || "").startsWith("/") ? "" : "/"}${url}`;
    window.history.pushState({}, "", nextUrl);
    const next = parseUrl();
    setRouteState(next);
    if (next.view === "tab" && next.tab === "employees") {
      setActiveDirectoryView("departments");
    }
  }, []);

  const handleTabChange = useCallback((newTab) => {
    const url = new URL(window.location.href);
    url.pathname = "/hr/teams";
    url.searchParams.set("tab", newTab);
    url.searchParams.delete("view");
    window.history.pushState({}, "", url.toString());
    if (newTab === "employees") {
      setActiveDirectoryView("departments");
    }
    setRouteState({
      view: "tab",
      tab: newTab,
      params: { tab: newTab },
    });
  }, []);

  const allEmployees = useMemo(() => loadAllEmployees(), [storeRevision]);
  const departmentsList = useMemo(() => loadDepartmentsList(), [storeRevision]);
  const mainTls = useMemo(() => getMainTLs(), [storeRevision]);
  const mainTl = mainTls[0] || null;

  const directTLs = useMemo(() => {
    if (!mainTl) return [];
    const res = getDirectReports(mainTl.id);
    const tls = Array.isArray(res) ? res : (res?.subTls || res?.directReports || []);
    return tls.map(tl => ({
      ...tl,
      subordinates: allEmployees.filter(e => e.reportingToId === tl.id)
    }));
  }, [mainTl, allEmployees]);

  const allTeamLeads = useMemo(() => {
    const map = new Map();
    mainTls.forEach(tl => {
      map.set(tl.id, {
        ...tl,
        subordinates: allEmployees.filter(e => e.reportingToId === tl.id)
      });
    });
    directTLs.forEach(tl => {
      if (!map.has(tl.id)) {
        map.set(tl.id, tl);
      }
    });
    return Array.from(map.values());
  }, [mainTls, directTLs, allEmployees]);

  const currentUserRole = currentUser?.systemRole || currentUser?.role || "Employee";
  const isAdminOrHR = useMemo(() => {
    const r = currentUserRole.toLowerCase();
    return r.includes("hr") || r.includes("admin");
  }, [currentUserRole]);

  const handleOpenAddEmployee = (deptName = "", reportingToId = "") => {
    setEditingEmployee(null);
    setModalDefaultDept(deptName);
    setModalDefaultReportingTo(reportingToId);
    setIsAddEmployeeOpen(true);
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsAddEmployeeOpen(true);
  };

  const handleEmployeeSaved = (savedEmp) => {
    setStoreRevision((r) => r + 1);
    if (onTriggerToast) {
      const actionLabel = editingEmployee ? "updated" : "added";
      onTriggerToast(`${savedEmp.name} (${savedEmp.id}) ${actionLabel} successfully.`);
    }
  };

  const handleDeptSaved = (savedDept) => {
    setStoreRevision((r) => r + 1);
    if (onTriggerToast) {
      onTriggerToast(`${savedDept.name} department added to directory.`);
    }
  };

  // Switch between Departments / Total Employees / Team Leads in-page
  const handleMetricClick = (viewKey) => {
    setActiveDirectoryView(viewKey);

    if (routeState.tab !== "employees") {
      setRouteState({
        view: "tab",
        tab: "employees",
        params: { tab: "employees" },
      });
    }

    requestAnimationFrame(() => {
      directorySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // 1. Department Employees Page: /teams/departments/:departmentId
  if (routeState.view === "department") {
    const deptInfo = getDepartmentEmployees(routeState.departmentId);

    return (
      <div className="flex flex-col gap-4">
        <TeamsErrorBoundary onBack={() => navigateTo("/teams")}>
          <DepartmentEmployeesPage
            departmentId={routeState.departmentId}
            currentUserRole={currentUserRole}
            onBack={() => navigateTo("/teams?tab=employees")}
            onNavigate={(url) => navigateTo(url)}
            onSelectEmployee={(empId, tab = "") =>
              navigateTo(`/teams/employees/${empId}${tab ? `?tab=${tab}` : ""}`)
            }
            onAddEmployee={() => {
              const deptName = deptInfo?.department?.name || routeState.departmentId;
              handleOpenAddEmployee(deptName);
            }}
            onEditEmployee={handleEditEmployee}
          />
        </TeamsErrorBoundary>

        <AddEditEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          onSaved={handleEmployeeSaved}
          employee={editingEmployee}
          defaultDepartment={modalDefaultDept}
          defaultReportingToId={modalDefaultReportingTo}
        />
      </div>
    );
  }

  // 2. Employee Detail Page: /teams/employees/:employeeId
  if (routeState.view === "employee-detail") {
    return (
      <div className="flex flex-col gap-4">
        <TeamsErrorBoundary onBack={() => navigateTo("/teams")}>
          <EmployeeDetailPage
            employeeId={routeState.employeeId}
            currentUser={currentUser}
            viewer={currentUser}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigateTo("/teams");
              }
            }}
            onNavigate={(url) => navigateTo(url)}
            onEditEmployee={handleEditEmployee}
            onTriggerToast={onTriggerToast}
          />
        </TeamsErrorBoundary>

        <AddEditEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          onSaved={handleEmployeeSaved}
          employee={editingEmployee}
        />
      </div>
    );
  }

  // 3. TL Employees Page: /teams/my-team/tl/:tlId/employees
  if (routeState.view === "tl-employees") {
    const tl = allEmployees.find((e) => e.id === routeState.tlId);
    const subordinates = allEmployees.filter((e) => e.reportingToId === routeState.tlId);

    return (
      <div className="flex flex-col gap-4">
        <TeamsErrorBoundary onBack={() => navigateTo("/teams")}>
          <TLEmployeesPage
            tl={tl}
            mainTl={mainTl}
            employees={subordinates}
            currentUserRole={currentUserRole}
            onBack={() => navigateTo("/teams?tab=my-team")}
            onNavigate={(url) => navigateTo(url)}
            onSelectEmployee={(empId, tab = "") =>
              navigateTo(`/teams/employees/${empId}${tab ? `?tab=${tab}` : ""}`)
            }
            onAddMember={(tlId) => {
              handleOpenAddEmployee(tl?.department || "", tlId);
            }}
            onEditEmployee={handleEditEmployee}
          />
        </TeamsErrorBoundary>

        <AddEditEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          onSaved={handleEmployeeSaved}
          employee={editingEmployee}
          defaultDepartment={modalDefaultDept}
          defaultReportingToId={modalDefaultReportingTo}
        />
      </div>
    );
  }

  // 4. Main Teams Hub (Tabs 1 & 2)
  const activeTab = routeState.tab || "employees";

  return (
    <TeamsErrorBoundary onBack={() => navigateTo("/teams")}>
      <div className="flex flex-col gap-4 w-full">
        {/* Compact Single-Row Header + Tabs + Interactive Metric Switcher */}
        <section className="glass-card !p-4 border border-line/80 rounded-2xl flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-surface2 border border-line/80 text-accent flex items-center justify-center shrink-0">
                <Icon name="users" className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-ink leading-tight">
                  Teams & Directory
                </h2>
                <p className="text-[11.5px] text-muted mt-0.5">
                  Departments, workforce directory, and reporting hierarchy
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <TeamsTabs activeTab={activeTab} onChangeTab={handleTabChange} />

              {isAdminOrHR && activeTab === "employees" && (
                <>
                  <QuickActionButton
                    icon="plus"
                    onClick={() => setIsAddDeptOpen(true)}
                  >
                    Add Department
                  </QuickActionButton>
                  <QuickActionButton
                    icon="user-plus"
                    onClick={() => handleOpenAddEmployee()}
                  >
                    Add Employee
                  </QuickActionButton>
                </>
              )}

              {isAdminOrHR && activeTab === "my-team" && (
                <QuickActionButton
                  icon="user-plus"
                  onClick={() => handleOpenAddEmployee("", mainTl?.id || "")}
                >
                  Add Team Member
                </QuickActionButton>
              )}
            </div>
          </div>

          {/* Clickable 3-Stat Switcher with Eye Icon Indicator */}
          <div
            style={{ borderTop: "none" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1"
          >
            <button
              type="button"
              onClick={() => handleMetricClick("employees")}
              className={`px-4 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border text-left ${
                activeTab === "employees" && activeDirectoryView === "employees"
                  ? "bg-accent/15 border-accent text-ink shadow-sm"
                  : "bg-surface2/40 border-line/50 hover:border-line hover:bg-surface2/70 text-muted hover:text-ink"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Employees
                </span>
                {activeTab === "employees" && activeDirectoryView === "employees" && (
                  <span className="w-5 h-5 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0">
                    <Icon name="eye" className="w-3 h-3 text-on-accent" />
                  </span>
                )}
              </div>
              <span className="font-num font-extrabold text-lg text-ink">
                {allEmployees.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMetricClick("departments")}
              className={`px-4 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border text-left ${
                activeTab === "employees" && activeDirectoryView === "departments"
                  ? "bg-accent/15 border-accent text-ink shadow-sm"
                  : "bg-surface2/40 border-line/50 hover:border-line hover:bg-surface2/70 text-muted hover:text-ink"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Departments
                </span>
                {activeTab === "employees" && activeDirectoryView === "departments" && (
                  <span className="w-5 h-5 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0">
                    <Icon name="eye" className="w-3 h-3 text-on-accent" />
                  </span>
                )}
              </div>
              <span className="font-num font-extrabold text-lg text-ink">
                {departmentsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMetricClick("tls")}
              className={`px-4 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border text-left ${
                activeTab === "employees" && activeDirectoryView === "tls"
                  ? "bg-accent/15 border-accent text-ink shadow-sm"
                  : "bg-surface2/40 border-line/50 hover:border-line hover:bg-surface2/70 text-muted hover:text-ink"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Team Leads
                </span>
                {activeTab === "employees" && activeDirectoryView === "tls" && (
                  <span className="w-5 h-5 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0">
                    <Icon name="eye" className="w-3 h-3 text-on-accent" />
                  </span>
                )}
              </div>
              <span className="font-num font-extrabold text-lg text-ink">
                {allTeamLeads.length}
              </span>
            </button>
          </div>
        </section>

        {/* Scroll Anchor + Tab 1: Interactive Directory View */}
        <div ref={directorySectionRef} className="scroll-mt-4">
          {activeTab === "employees" && (
            <DepartmentsOverview
              viewFilter={activeDirectoryView}
              onChangeViewFilter={setActiveDirectoryView}
              allEmployees={allEmployees}
              teamLeads={allTeamLeads}
              onSelectDepartment={(deptId) => navigateTo(`/teams/departments/${deptId}`)}
              onSelectEmployee={(empId) => navigateTo(`/teams/employees/${empId}`)}
              onSelectTL={(tlId) => navigateTo(`/teams/my-team/tl/${tlId}/employees`)}
              currentUser={currentUser}
              onTriggerToast={onTriggerToast}
            />
          )}

          {/* Tab 2: My Team (Hierarchy) */}
          {activeTab === "my-team" && (
            <MyTeamPage
              mainTl={mainTl}
              tls={directTLs}
              allEmployees={allEmployees}
              currentUserRole={currentUserRole}
              onSelectTL={(tlId) => navigateTo(`/teams/my-team/tl/${tlId}/employees`)}
              onSelectEmployee={(empId, tab = "") =>
                navigateTo(`/teams/employees/${empId}${tab ? `?tab=${tab}` : ""}`)
              }
              onAddEmployee={() => handleOpenAddEmployee("", mainTl?.id || "")}
              onEditEmployee={handleEditEmployee}
            />
          )}
        </div>

        {/* Global Modals */}
        <AddEditEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          onSaved={handleEmployeeSaved}
          employee={editingEmployee}
          defaultDepartment={modalDefaultDept}
          defaultReportingToId={modalDefaultReportingTo}
        />

        <AddDepartmentModal
          isOpen={isAddDeptOpen}
          onClose={() => setIsAddDeptOpen(false)}
          onSaved={handleDeptSaved}
        />
      </div>
    </TeamsErrorBoundary>
  );
}

export default TeamsView;