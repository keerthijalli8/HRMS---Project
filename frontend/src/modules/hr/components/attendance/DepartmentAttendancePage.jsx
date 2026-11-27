import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '../Icon.jsx';
import { DepartmentHeader } from './DepartmentHeader.jsx';
import { DepartmentTabs } from './DepartmentTabs.jsx';
import { DepartmentSummaryCards } from './DepartmentSummaryCards.jsx';
import { DepartmentFilters } from './DepartmentFilters.jsx';
import { DepartmentEmployeeTable } from './DepartmentEmployeeTable.jsx';
import { BulkActionsBar } from './BulkActionsBar.jsx';
import { EmployeeAttendanceDrawer } from './EmployeeAttendanceDrawer.jsx';
import { ManualCorrectionModal } from './ManualCorrectionModal.jsx';
import { ApprovalsPanel } from './ApprovalsPanel.jsx';
import { MonthlyMatrix } from './MonthlyMatrix.jsx';
import { AttendanceInsights } from './AttendanceInsights.jsx';
import {
  getDepartmentAttendance,
  getDepartmentRequests,
  getAttendanceInsights,
  bulkMarkAttendance,
  sendAttendanceReminder,
  subscribeAttendanceService,
  isHRorAdmin,
  getKolkataDateKey
} from '../../services/attendanceService.js';

export const DepartmentAttendancePage = ({
  departmentId,
  selectedDate,
  onDateChange,
  onBack,
  onNavigateAttendance,
  currentUser,
  onTriggerToast
}) => {
  const [dataVersion, setDataVersion] = useState(0);

  // Sub-tab: "daily" | "monthly" | "requests" | "insights"
  const [activeSubTab, setActiveSubTab] = useState("daily");

  // Filters state initialized from URL or defaults
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("status") || "All";
    } catch (e) {
      return "All";
    }
  });
  const [mode, setMode] = useState("All");
  const [shift, setShift] = useState("All");
  const [page, setPage] = useState(1);

  // Selection & Modals
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedEmployeeForDrawer, setSelectedEmployeeForDrawer] = useState(null);
  const [editingEmployeeRecord, setEditingEmployeeRecord] = useState(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, mode, shift]);

  // Sync date & status to URL search params
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (selectedDate) url.searchParams.set("date", selectedDate);
        if (status && status !== "All") {
          url.searchParams.set("status", status.toLowerCase());
        } else {
          url.searchParams.delete("status");
        }
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {}
  }, [selectedDate, status]);

  // Subscribe to reactive service changes
  useEffect(() => {
    const unsub = subscribeAttendanceService(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  // Fetch Department Attendance Data
  const deptData = useMemo(() => {
    try {
      return getDepartmentAttendance(
        departmentId,
        selectedDate,
        { search, status, mode, shift },
        page,
        10,
        currentUser
      );
    } catch (err) {
      console.error("Failed to load department attendance:", err);
      setHasError(true);
      return null;
    }
  }, [departmentId, selectedDate, search, status, mode, shift, page, currentUser, dataVersion]);

  // Fetch Department Requests
  const deptRequests = useMemo(() => {
    try {
      return getDepartmentRequests(departmentId);
    } catch (e) {
      return { regularization: [], wfh: [], totalPending: 0 };
    }
  }, [departmentId, dataVersion]);

  // Fetch Department Insights
  const insightsData = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return getAttendanceInsights({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        viewer: currentUser
      });
    } catch (e) {
      return {};
    }
  }, [selectedDate, currentUser, dataVersion]);

  const canEdit = useMemo(() => isHRorAdmin(currentUser), [currentUser]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatus("All");
    setMode("All");
    setShift("All");
    setPage(1);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
    } catch (e) {}
  }, []);

  // Bulk actions
  const handleSelectEmployee = (id) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const list = deptData?.employees || [];
    if (selectedEmployeeIds.length === list.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(list.map(e => e.employeeId));
    }
  };

  const handleBulkMarkPresent = () => {
    const res = bulkMarkAttendance({
      employeeIds: selectedEmployeeIds,
      dateKey: selectedDate,
      status: "Present",
      mode: "office",
      adminUser: currentUser
    });
    if (res.ok) {
      onTriggerToast?.(res.message);
      setSelectedEmployeeIds([]);
      setDataVersion(v => v + 1);
    }
  };

  const handleBulkMarkAbsent = () => {
    const res = bulkMarkAttendance({
      employeeIds: selectedEmployeeIds,
      dateKey: selectedDate,
      status: "Absent",
      adminUser: currentUser
    });
    if (res.ok) {
      onTriggerToast?.(res.message);
      setSelectedEmployeeIds([]);
      setDataVersion(v => v + 1);
    }
  };

  const handleBulkSendReminder = () => {
    const res = sendAttendanceReminder({ employeeIds: selectedEmployeeIds });
    if (res.ok) {
      onTriggerToast?.(res.message);
      setSelectedEmployeeIds([]);
    }
  };

  const handleExportSelected = () => {
    const emps = (deptData?.allFilteredEmployees || deptData?.employees || []).filter(e =>
      selectedEmployeeIds.length > 0 ? selectedEmployeeIds.includes(e.employeeId) : true
    );
    const headers = ["Employee ID", "Name", "Department", "Role", "Check In", "Check Out", "Total Hours", "Break", "Mode", "Status"];
    const csvRows = emps.map(e => [
      `"${e.employeeId}"`,
      `"${e.name}"`,
      `"${e.dept}"`,
      `"${e.role}"`,
      `"${e.checkIn}"`,
      `"${e.checkOut}"`,
      `"${e.totalHours}"`,
      `"${e.breakDuration}"`,
      `"${e.mode}"`,
      `"${e.status}"`
    ]);

    const csv = [headers.join(","), ...csvRows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `${deptData?.department?.name || 'department'}-attendance-${selectedDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onTriggerToast?.(`Exported attendance for ${emps.length} employees.`);
  };

  // 1. INVALID DEPARTMENT NOT FOUND STATE
  if (deptData?.notFound) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Icon name="alert-triangle" className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink">
            Department Not Found
          </h2>
          <p className="text-xs text-muted mt-1.5 max-w-md">
            The department with identifier <code className="px-1.5 py-0.5 rounded bg-surface2 font-num font-bold text-ink">"{departmentId}"</code> does not exist or has been removed.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center gap-2 hover:opacity-95 transition cursor-pointer shadow-lg"
        >
          <Icon name="arrow-left" className="w-4 h-4 text-on-accent" />
          <span>Back to Departments</span>
        </button>
      </div>
    );
  }

  // 2. ACCESS DENIED (ROLE GUARD)
  if (deptData?.accessDenied) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
          <Icon name="shield" className="w-8 h-8 text-amber-300" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink">
            Access Restricted
          </h2>
          <p className="text-xs text-muted mt-1.5 max-w-md">
            As a Department Manager, you can only view attendance for your own department. You do not have access to {deptData.departmentName || "this department"}.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center gap-2 hover:opacity-95 transition cursor-pointer shadow-lg"
        >
          <Icon name="arrow-left" className="w-4 h-4 text-on-accent" />
          <span>Back to Departments</span>
        </button>
      </div>
    );
  }

  // 3. ERROR STATE
  if (hasError || !deptData) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Icon name="alert-triangle" className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-ink">
            Unable to Load Attendance
          </h2>
          <p className="text-xs text-muted mt-1">
            An unexpected error occurred while loading department records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setHasError(false); setDataVersion(v => v + 1); }}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent font-semibold text-xs transition cursor-pointer"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-surface2 border border-line text-ink font-semibold text-xs transition cursor-pointer"
          >
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  const { department, summaryCards, employees, totalFiltered, page: curPage, totalPages } = deptData;

  return (
    <div className="flex flex-col gap-4 w-full animate-fadeIn">
      {/* ================= 1. HEADER ================= */}
      <DepartmentHeader
        department={department}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onBack={onBack}
        onNavigateAttendance={onNavigateAttendance}
      />

      {/* ================= 2. SECONDARY SUBTABS ================= */}
      <DepartmentTabs
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        pendingRequestsCount={deptRequests.totalPending}
      />

      {/* ================= 3. ACTIVE SUBTAB CONTENT ================= */}

      {/* TAB A: DAILY VIEW */}
      {activeSubTab === "daily" && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Summary Cards */}
          <DepartmentSummaryCards
            summary={summaryCards}
            selectedStatus={status}
            onSelectStatus={setStatus}
          />

          {/* Filters Bar */}
          <DepartmentFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            mode={mode}
            onModeChange={setMode}
            shift={shift}
            onShiftChange={setShift}
            onReset={handleResetFilters}
          />

          {/* Bulk Actions Bar */}
          {canEdit && (
            <BulkActionsBar
              selectedCount={selectedEmployeeIds.length}
              onClearSelection={() => setSelectedEmployeeIds([])}
              onMarkPresent={handleBulkMarkPresent}
              onMarkAbsent={handleBulkMarkAbsent}
              onSendReminder={handleBulkSendReminder}
              onExportSelected={handleExportSelected}
            />
          )}

          {/* Employees Table */}
          <DepartmentEmployeeTable
            employees={employees}
            totalFiltered={totalFiltered}
            page={curPage}
            pageSize={10}
            totalPages={totalPages}
            onPageChange={setPage}
            selectedEmployeeIds={selectedEmployeeIds}
            onSelectEmployee={handleSelectEmployee}
            onSelectAll={handleSelectAll}
            onRowClick={(emp) => setSelectedEmployeeForDrawer(emp)}
            onEditRecord={(emp) => setEditingEmployeeRecord(emp)}
            canEdit={canEdit}
          />
        </div>
      )}

      {/* TAB B: MONTHLY MATRIX */}
      {activeSubTab === "monthly" && (
        <div className="animate-fadeIn">
          <MonthlyMatrix
            viewer={currentUser}
            departmentFilter={department.name}
          />
        </div>
      )}

      {/* TAB C: REQUESTS */}
      {activeSubTab === "requests" && (
        <div className="animate-fadeIn">
          <ApprovalsPanel
            regularizationRequests={deptRequests.regularization}
            wfhRequests={deptRequests.wfh}
            reviewer={currentUser}
            onTriggerToast={onTriggerToast}
            onRefresh={() => setDataVersion(v => v + 1)}
          />
        </div>
      )}

      {/* TAB D: INSIGHTS */}
      {activeSubTab === "insights" && (
        <div className="animate-fadeIn">
          <AttendanceInsights insights={insightsData} />
        </div>
      )}

      {/* ================= MODALS & DRAWERS ================= */}

      {/* Employee Attendance Drawer */}
      <EmployeeAttendanceDrawer
        isOpen={Boolean(selectedEmployeeForDrawer)}
        onClose={() => setSelectedEmployeeForDrawer(null)}
        employeeRecord={selectedEmployeeForDrawer}
        selectedDate={selectedDate}
        onEditEmployeeAttendance={(emp) => {
          setSelectedEmployeeForDrawer(null);
          setEditingEmployeeRecord(emp);
        }}
      />

      {/* Manual Attendance Correction Modal */}
      <ManualCorrectionModal
        isOpen={Boolean(editingEmployeeRecord)}
        onClose={() => setEditingEmployeeRecord(null)}
        employeeRecord={editingEmployeeRecord}
        dateKey={selectedDate}
        adminUser={currentUser}
        onSuccessToast={(msg) => {
          onTriggerToast?.(msg);
          setDataVersion(v => v + 1);
        }}
      />
    </div>
  );
};

export default DepartmentAttendancePage;
