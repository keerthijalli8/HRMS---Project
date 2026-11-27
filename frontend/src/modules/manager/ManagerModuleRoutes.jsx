import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Mail, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import './styles/base.css';

import Rail from './components/Rail';
import Header from './components/Header';
import Drawer from './components/Drawer';
import Toast from './components/Toast';
import Avatar from './components/Avatar';
import StatusPill from './components/StatusPill';
import Tag from './components/Tag';
import Progress from './components/Progress';

// Modals & Drawers
import Schedule1on1Modal from './components/Schedule1on1Modal';
import UanModal from './components/UanModal';
import OkrCheckinModal from './components/OkrCheckinModal';
import NotificationsModal from './components/NotificationsModal';
import ErrorBoundary from './components/ErrorBoundary';
import ExportModal from './components/ExportModal';
import PtSlabsModal from './components/PtSlabsModal';
import KeyboardShortcutsDrawer from './components/KeyboardShortcutsDrawer';

// Context
import { NotificationProvider, useNotifications } from './store/NotificationContext';
import { ManagerProfileProvider, useManagerProfile } from './context/ManagerProfileContext';
import { AttendanceProvider } from './context/AttendanceContext.jsx';

// Utilities
import { exportAttendanceCSV } from './utils/exportUtils';

// Pages
import Overview from './pages/Overview';
import Attendance from './pages/Attendance';
import LeaveRequests from './pages/LeaveRequests';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Projects from './pages/Projects';
import Performance from './pages/Performance';
import Shifts from './pages/Shifts';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MyTasks from './pages/MyTasks';
import MyPayslips from './pages/MyPayslips';
import MyLeaveAttendance from './pages/MyLeaveAttendance';

// Sample data
import {
  managerProfile,
  initialKpis,
  initialEmployees,
  initialPendingRequests,
  initialApprovedRequests,
  initialRejectedRequests,
  initialOkrs,
  initialPayrollCycle,
  calendarDaysNov2026,
  initialTeamLife,
  attendanceTrendData,
  reportAnalyticsData,
} from './data/manager';

const ROUTE_TO_META = {
  '/manager/dashboard': { id: 'overview', title: 'Overview' },
  '/manager/notifications': { id: 'notifications', title: 'Notifications' },
  '/manager/attendance': { id: 'attendance', title: 'Team attendance' },
  '/manager/leave': { id: 'leave', title: 'Leave requests' },
  '/manager/team': { id: 'team', title: 'Teams' },
  '/manager/shifts': { id: 'shifts', title: 'Shifts & Rota' },
  '/manager/projects': { id: 'projects', title: 'Projects & Initiatives' },
  '/manager/performance': { id: 'performance', title: 'Performance' },
  '/manager/tasks': { id: 'tasks', title: 'Tasks & Workload' },
  '/manager/meetings': { id: 'meetings', title: 'Meetings & Calendar' },
  '/manager/announcements': { id: 'announcements', title: 'Announcements' },
  '/manager/reports': { id: 'reports', title: 'Reports and analytics' },
  '/manager/profile': { id: 'profile', title: 'My profile' },
  '/manager/settings': { id: 'settings', title: 'Settings' },
  '/manager/mytasks': { id: 'mytasks', title: 'My Tasks (Personal)' },
  '/manager/payslips': { id: 'mypayslips', title: 'My Payslips & Compensation' },
  '/manager/myleave': { id: 'myleave', title: 'My Leave & Attendance' },
};

const PAGE_ID_TO_ROUTE = Object.fromEntries(
  Object.entries(ROUTE_TO_META).map(([route, meta]) => [meta.id, route])
);

function resolveManagerTarget(pageIdOrRoute) {
  if (!pageIdOrRoute) return '/manager/dashboard';
  const [rawPath, rawQuery] = String(pageIdOrRoute).split('?');
  const clean = rawPath.replace(/\/$/, '');
  const query = rawQuery ? `?${rawQuery}` : '';

  if (clean.startsWith('/manager')) {
    return `${clean === '/manager' ? '/manager/dashboard' : clean}${query}`;
  }
  if (clean === '/dashboard' || clean === '/') {
    return `/manager/dashboard${query}`;
  }
  if (clean.startsWith('/dashboard/')) {
    const suffix = clean.slice('/dashboard'.length);
    return `/manager${suffix}${query}`;
  }
  if (PAGE_ID_TO_ROUTE[clean]) {
    return `${PAGE_ID_TO_ROUTE[clean]}${query}`;
  }
  return `/manager/dashboard${query}`;
}

function ManagerAppContent() {
  const { logout } = useAuth();
  const { user, settings } = useManagerProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    setIsDrawerOpen,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    dismissNotification,
    approveNotification,
    rejectNotification,
    addNotification,
  } = useNotifications();

  const normalizedPath = location.pathname.replace(/\/$/, '') || '/manager/dashboard';
  const pageTitle = ROUTE_TO_META[normalizedPath]?.title || 'Manager Desk';

  const [searchQuery, setSearchQuery] = useState('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Live state for dashboard
  const [employees, setEmployees] = useState(initialEmployees);
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests);
  const [approvedRequests, setApprovedRequests] = useState(initialApprovedRequests);
  const [rejectedRequests, setRejectedRequests] = useState(initialRejectedRequests);
  const [, setPayrollCycle] = useState(initialPayrollCycle);
  const [kpis] = useState(initialKpis);
  const [, setOkrs] = useState(initialOkrs);

  // Drawers & Modals State
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [scheduled1on1Target, setScheduled1on1Target] = useState(null);
  const [uanModalTarget, setUanModalTarget] = useState(null);
  const [okrCheckinTarget, setOkrCheckinTarget] = useState(null);
  const [isPtSlabsOpen, setIsPtSlabsOpen] = useState(false);

  // Toast with Undo state
  const [toast, setToast] = useState(null);

  const handleNavigate = (pageIdOrRoute) => {
    const target = resolveManagerTarget(pageIdOrRoute);
    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const triggerToast = (message, undoAction = null) => {
    setToast({ message, undoAction });
  };

  const handleApproveRequest = (req) => {
    const prevPending = [...pendingRequests];
    const prevEmployees = [...employees];

    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setApprovedRequests((prev) => [
      { ...req, approvedOn: '6 Nov 2026' },
      ...prev,
    ]);

    if (req.badgeType === 'regular') {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.name === req.name
            ? {
                ...emp,
                status: 'in-office',
                punchOut: req.dates?.includes('Punch-out') ? '18:30' : emp.punchOut,
                flags: emp.flags.filter((f) => !f.includes('pending')),
              }
            : emp
        )
      );
    }

    setToast({
      message: `Approved ${req.type?.toLowerCase() || 'request'} for ${req.name}`,
      undoAction: () => {
        setPendingRequests(prevPending);
        setEmployees(prevEmployees);
        setApprovedRequests((prev) => prev.filter((r) => r.id !== req.id));
        setToast(null);
      },
    });
  };

  const handleRejectRequest = (req) => {
    const prevPending = [...pendingRequests];
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setRejectedRequests((prev) => [
      { ...req, rejectedOn: '6 Nov 2026', reason: req.customReason || req.reason },
      ...prev,
    ]);

    setToast({
      message: `Rejected ${req.type?.toLowerCase() || 'request'} for ${req.name}`,
      undoAction: () => {
        setPendingRequests(prevPending);
        setRejectedRequests((prev) => prev.filter((r) => r.id !== req.id));
        setToast(null);
      },
    });
  };

  const regularisationRequests = pendingRequests.filter((r) => r.badgeType === 'regular');
  const pendingLeaves = pendingRequests.filter((r) => r.badgeType === 'leave');

  const handlePingEmployee = (emp) => {
    setToast({
      message: `Punch-in reminder notification dispatched to ${emp.name} via Slack & SMS`,
      undoAction: null,
    });
  };

  const handleConfirmSchedule1on1 = (details) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === details.employeeId
          ? { ...emp, last1on1: `${details.date} (${details.time})` }
          : emp
      )
    );
    setToast({
      message: `Scheduled 1:1 with ${details.employeeName} on ${details.date} at ${details.time}`,
      undoAction: null,
    });
  };

  const handleSaveUan = (employeeId, uanNumber) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? {
              ...emp,
              uan: uanNumber,
              complianceIssues: emp.complianceIssues?.filter((c) => !c.includes('UAN')),
            }
          : emp
      )
    );
    setToast({
      message: `UAN verified & linked successfully: ${uanNumber}`,
      undoAction: null,
    });
  };

  const handleSaveOkrCheckin = (okrId, newProgress) => {
    setOkrs((prev) =>
      prev.map((okr) =>
        okr.id === okrId
          ? { ...okr, progress: newProgress, lastCheckin: 'Today' }
          : okr
      )
    );
    setToast({
      message: `OKR check-in saved! Progress updated to ${newProgress}%`,
      undoAction: null,
    });
  };

  const handleExportAttendanceCsv = () => {
    exportAttendanceCSV(employees, '6 Nov 2026');
    setToast({
      message: 'Attendance register CSV exported successfully',
      undoAction: null,
    });
  };

  const displayedEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  });

  // Preserve unused state setter reference if later needed
  void setPayrollCycle;

  return (
    <div
      className="mod-manager flex flex-col md:flex-row min-h-screen text-ink antialiased selection:bg-accent selection:text-on-accent"
      data-density={settings?.preferences?.displayDensity === 'Compact' ? 'compact' : undefined}
    >
      {/* 1. Left Navigation Rail */}
      <Rail
        onNavigate={handleNavigate}
        onOpenUserDetail={() => handleNavigate('/manager/profile')}
        pendingCounts={{
          leavePending: pendingLeaves.length,
          unreadNotifs: unreadCount,
        }}
        managerProfile={user || managerProfile}
        onSignOut={handleSignOut}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 min-w-0 flex flex-col px-3 sm:px-6 md:px-8 py-4 md:py-6 gap-[var(--gap)]">
        <Header
          pageTitle={pageTitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pendingCount={unreadCount}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleNotifications={() => setIsDrawerOpen(!isDrawerOpen)}
          isNotificationsOpen={isDrawerOpen}
          user={user}
          onNavigate={handleNavigate}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onSignOut={handleSignOut}
          employees={employees}
          onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          pendingRequests={pendingRequests}
        />

        {/* Header Bell Drawer */}
        <NotificationsModal
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markAsRead}
          onMarkUnread={markAsUnread}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismissNotification}
          onApprove={approveNotification}
          onReject={rejectNotification}
          onNavigate={handleNavigate}
        />

        {/* 3. Nested Page Routing View */}
        <main className="w-full min-w-0 flex-1">
          <ErrorBoundary>
            <Routes>
              <Route index element={<Navigate to="/manager/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <Overview
                    kpis={kpis}
                    pendingRequests={pendingRequests}
                    approvedRequests={approvedRequests}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                    onNavigate={handleNavigate}
                    onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                    employees={employees}
                    attendanceTrend={attendanceTrendData}
                    onPingEmployee={handlePingEmployee}
                  />
                }
              />
              <Route
                path="notifications"
                element={<Notifications onNavigate={handleNavigate} />}
              />
              <Route
                path="attendance"
                element={
                  <Attendance
                    employees={employees}
                    onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                    regularisationRequests={regularisationRequests}
                    onApproveRegularisation={handleApproveRequest}
                    onRejectRegularisation={handleRejectRequest}
                    onExportCsv={handleExportAttendanceCsv}
                    onTriggerToast={triggerToast}
                    searchQuery={searchQuery}
                  />
                }
              />
              <Route
                path="leave"
                element={
                  <LeaveRequests
                    pendingLeaves={pendingLeaves}
                    approvedLeaves={approvedRequests.filter((r) => r.type === 'Leave')}
                    rejectedLeaves={rejectedRequests.filter((r) => r.type === 'Leave')}
                    onApproveLeave={handleApproveRequest}
                    onRejectLeave={handleRejectRequest}
                    calendarDays={calendarDaysNov2026}
                    onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                    employees={employees}
                    onTriggerToast={triggerToast}
                  />
                }
              />
              <Route
                path="team"
                element={
                  <Team
                    employees={displayedEmployees}
                    onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                    teamLife={initialTeamLife}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onTriggerToast={triggerToast}
                    pendingRequests={pendingRequests}
                    approvedRequests={approvedRequests}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                    onNavigate={handleNavigate}
                  />
                }
              />
              <Route
                path="shifts"
                element={<Shifts employees={employees} onTriggerToast={triggerToast} />}
              />
              <Route
                path="projects"
                element={<Projects employees={employees} onTriggerToast={triggerToast} />}
              />
              <Route
                path="performance"
                element={<Performance employees={employees} onTriggerToast={triggerToast} />}
              />
              <Route
                path="tasks"
                element={<Tasks employees={employees} onTriggerToast={triggerToast} />}
              />
              <Route
                path="meetings"
                element={
                  <Meetings
                    employees={employees}
                    onTriggerToast={triggerToast}
                    onNavigate={handleNavigate}
                  />
                }
              />
              <Route
                path="announcements"
                element={<Announcements employees={employees} onTriggerToast={triggerToast} />}
              />
              <Route
                path="reports"
                element={
                  <Reports
                    reportData={reportAnalyticsData}
                    employees={employees}
                    onExportCsv={handleExportAttendanceCsv}
                    onExportPdf={() => window.print()}
                    onTriggerToast={triggerToast}
                  />
                }
              />
              <Route
                path="profile"
                element={<Profile onTriggerToast={triggerToast} onNavigate={handleNavigate} />}
              />
              <Route path="mytasks" element={<MyTasks onTriggerToast={triggerToast} />} />
              <Route path="payslips" element={<MyPayslips onTriggerToast={triggerToast} />} />
              <Route path="myleave" element={<MyLeaveAttendance onTriggerToast={triggerToast} />} />
              <Route
                path="settings"
                element={
                  <Settings
                    onTriggerToast={triggerToast}
                    onSendTestNotification={() => {
                      addNotification({
                        title: 'System Test Notification',
                        detail: 'Notification channels and bell drawer delivery verified.',
                        category: 'System',
                        time: 'Just now',
                        unread: true,
                      });
                    }}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      {/* Employee Profile Drawer */}
      <Drawer
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.name || 'Employee Profile'}
        subtitle={`${selectedEmployee?.id} · ${selectedEmployee?.role}`}
      >
        {selectedEmployee && (
          <div className="flex flex-col gap-4 text-[13px]">
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <Avatar name={selectedEmployee.name} size={48} />
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-[16px] text-ink">
                  {selectedEmployee.name}
                </h3>
                <span className="text-[12px] text-muted">
                  {selectedEmployee.department} · {selectedEmployee.location}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusPill status={selectedEmployee.status} />
                  <Tag>{selectedEmployee.reporting} Report</Tag>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                Contact & Records
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                <div className="flex items-center gap-2 text-muted">
                  <Mail size={13} />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Phone size={13} />
                  <span className="font-mono">{selectedEmployee.phone}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface2/40 border border-line">
              <div>
                <span className="text-[11px] text-muted uppercase font-mono">Join Date</span>
                <span className="font-bold text-ink mt-0.5 block">{selectedEmployee.joinDate}</span>
                <span className="text-[11px] text-muted font-mono">{selectedEmployee.tenure} tenure</span>
              </div>
              <div>
                <span className="text-[11px] text-muted uppercase font-mono">Last 1:1</span>
                <span className="font-bold text-ink mt-0.5 block">{selectedEmployee.last1on1}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2/40 border border-line">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted font-medium">
                  In: {selectedEmployee.punchIn} | Out: {selectedEmployee.punchOut}
                </span>
                <span className="font-mono font-bold text-ink">{selectedEmployee.hoursWorked}</span>
              </div>
              <Progress value={selectedEmployee.hoursDecimal} max={9} height={6} />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                Leave Balances (Days)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-surface2 border border-line">
                  <span className="text-[10px] text-muted block">Casual</span>
                  <span className="font-mono font-bold text-ink">{selectedEmployee.leaveBalance?.casual || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface2 border border-line">
                  <span className="text-[10px] text-muted block">Sick</span>
                  <span className="font-mono font-bold text-ink">{selectedEmployee.leaveBalance?.sick || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface2 border border-line">
                  <span className="text-[10px] text-muted block">Earned</span>
                  <span className="font-mono font-bold text-ink">{selectedEmployee.leaveBalance?.earned || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface2 border border-line">
                  <span className="text-[10px] text-muted block">Comp-off</span>
                  <span className="font-mono font-bold text-ink">{selectedEmployee.leaveBalance?.compOff || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted font-medium">Q3 Goals Progress</span>
                <span className="font-mono font-bold text-ink">{selectedEmployee.goalsProgress}%</span>
              </div>
              <Progress value={selectedEmployee.goalsProgress} max={100} height={7} />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-line/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                Manager Actions
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/manager/performance?tab=goals');
                    setSelectedEmployee(null);
                  }}
                  className="py-2 px-2 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-[12px] font-semibold text-center transition-colors shadow-sm"
                >
                  Set goal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/manager/performance?tab=feedback');
                    setSelectedEmployee(null);
                  }}
                  className="py-2 px-2 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-[12px] font-semibold text-center transition-colors shadow-sm"
                >
                  Give feedback
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('/manager/shifts');
                    setSelectedEmployee(null);
                  }}
                  className="py-2 px-2 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-[12px] font-semibold text-center transition-colors shadow-sm"
                >
                  Assign shift
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScheduled1on1Target(selectedEmployee);
                  setSelectedEmployee(null);
                }}
                className="w-full py-2 px-3 rounded-xl text-[12.5px] font-bold shadow-md hover:brightness-110 active:scale-95 transition-all text-center mt-1"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--on-accent)',
                }}
              >
                Schedule 1:1 check-in
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Manager Profile Drawer */}
      <Drawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Manager Profile"
        subtitle="Role & Team Scope"
      >
        <div className="flex flex-col gap-5 text-[13px]">
          <div className="flex items-center gap-3 pb-3 border-b border-line">
            <Avatar name={user?.name || managerProfile?.name || 'Lokesh Kumar'} size={52} />
            <div className="flex flex-col">
              <h3 className="font-display font-bold text-[17px] text-ink">
                {user?.name || managerProfile?.name || 'Lokesh Kumar'}
              </h3>
              <span className="text-[12.5px] text-muted">
                {user?.designation || managerProfile?.title || 'Engineering Manager'} · {user?.department || managerProfile?.department || 'Platform Engineering'}
              </span>
              <span className="text-[11px] font-mono text-accent mt-0.5">
                Employee ID: {user?.employeeId || managerProfile?.id || 'EMP-MGR-01'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="p-3 rounded-xl bg-surface2/40 border border-line">
              <span className="text-[10.5px] text-muted uppercase font-mono">Team Headcount</span>
              <span className="font-display font-extrabold text-[20px] text-ink block mt-0.5">
                {employees.length} Engineers
              </span>
              <span className="text-[11px] text-muted font-mono">18 Direct · 6 Indirect</span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/40 border border-line">
              <span className="text-[10.5px] text-muted uppercase font-mono">Location</span>
              <span className="font-display font-extrabold text-[15px] text-ink block mt-1">
                Bengaluru HQ
              </span>
              <span className="text-[11px] text-muted font-mono">South Tower, Floor 4</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-line/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
              Role & Compliance Permissions
            </span>
            <div className="p-3 rounded-xl bg-surface2/20 border border-line flex flex-col gap-1.5 text-[12px] text-ink/90">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-good" />
                <span>Full access to team attendance, leave, and shift roster</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-good" />
                <span>Performance evaluation and OKR goal management</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-good" />
                <span>Encrypted compliance documents view (view logged)</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <ShieldAlert size={14} className="text-warn" />
                <span>Individual salary, bank details, and personal tax data restricted</span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        employees={employees}
        onTriggerToast={triggerToast}
      />

      <Schedule1on1Modal
        isOpen={Boolean(scheduled1on1Target)}
        onClose={() => setScheduled1on1Target(null)}
        employee={scheduled1on1Target}
        onConfirm={handleConfirmSchedule1on1}
      />

      <UanModal
        isOpen={Boolean(uanModalTarget)}
        onClose={() => setUanModalTarget(null)}
        employee={uanModalTarget}
        onSave={handleSaveUan}
      />

      <OkrCheckinModal
        isOpen={Boolean(okrCheckinTarget)}
        onClose={() => setOkrCheckinTarget(null)}
        okr={okrCheckinTarget}
        onSave={handleSaveOkrCheckin}
      />

      <PtSlabsModal
        isOpen={isPtSlabsOpen}
        onClose={() => setIsPtSlabsOpen(false)}
      />

      <KeyboardShortcutsDrawer
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export function ManagerModuleRoutes() {
  const [toast, setToast] = useState(null);

  const handleToast = (msg, undo) => setToast({ message: msg, undoAction: undo });

  return (
    <ManagerProfileProvider>
      <NotificationProvider onTriggerToast={handleToast}>
        <AttendanceProvider onTriggerToast={handleToast}>
          <ManagerAppContent />
          <Toast toast={toast} onClose={() => setToast(null)} />
        </AttendanceProvider>
      </NotificationProvider>
    </ManagerProfileProvider>
  );
}

export default ManagerModuleRoutes;
