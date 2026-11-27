import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './index.css';

import { Icon } from './components/Icon.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PayslipModal } from './components/PayslipModal.jsx';
import { FloatingAIChat } from './components/FloatingAIChat.jsx';
import { Toast } from './components/Toast.jsx';
import { ProfileProvider, useProfile } from './context/ProfileContext.jsx';
import { AttendanceProvider } from './context/AttendanceContext.jsx';
import { logEvent } from './services/auditService.js';
import { resolveHrPath, getHrRouteKey, HR_ROUTE_LABELS } from './routes.js';

// Pages & Module Views
import { OverviewView } from './pages/OverviewView.jsx';
import { TasksView } from './pages/TasksView.jsx';
import { TeamsView } from './pages/TeamsView.jsx';
import { AttendanceView } from './pages/AttendanceView.jsx';
import { ShiftsRosterView } from './pages/ShiftsRosterView.jsx';
import { LeaveView } from './pages/LeaveView.jsx';
import { LopView } from './pages/LopView.jsx';
import { PayrollView } from './pages/PayrollView.jsx';
import { BenefitsView } from './pages/BenefitsView.jsx';
import { OnboardingView } from './pages/OnboardingView.jsx';
import { PerformanceView } from './pages/PerformanceView.jsx';
import { DocumentsView } from './pages/DocumentsView.jsx';
import { ReportsView } from './pages/ReportsView.jsx';
import { ApprovalsView } from './pages/ApprovalsView.jsx';
import { AnnouncementsView } from './pages/AnnouncementsView.jsx';
import { NotificationsView } from './pages/NotificationsView.jsx';
import { SettingsView } from './pages/SettingsView.jsx';
import { AuditLogsView } from './pages/AuditLogsView.jsx';
import { MyProfileView } from './pages/MyProfileView.jsx';
import { AccountSettingsView } from './pages/AccountSettingsView.jsx';
import { EmployeeManagement } from './components/EmployeeManagement.jsx';
import { Recruitment } from './components/Recruitment.jsx';
import { Offboarding } from './components/Offboarding.jsx';

function HrNotFound({ onBack }) {
  return (
    <div className="glass-card p-12 text-center flex flex-col items-center justify-center my-8 max-w-lg mx-auto border border-line">
      <div className="w-16 h-16 rounded-2xl bg-accent2/20 border border-accent2/40 text-accent2 flex items-center justify-center mb-4">
        <Icon name="alert-triangle" className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold font-display text-ink mb-2">Page Not Found</h2>
      <p className="text-sm text-muted mb-6">
        The requested URL does not exist in Nexora HRMS. Please check the URL or return to the main dashboard.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-2.5 rounded-[var(--radius)] bg-accent text-on-accent font-semibold text-sm hover:brightness-105 transition shadow-md cursor-pointer"
      >
        Return to Dashboard
      </button>
    </div>
  );
}

function HrShell() {
  const { profile: currentUser, updateProfile, logout } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRoute = getHrRouteKey(location.pathname);

  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [selectedCalDay, setSelectedCalDay] = useState(5);
  const [salaryUnlocked, setSalaryUnlocked] = useState(false);
  const [payslipModal, setPayslipModal] = useState(null);

  const triggerToast = useCallback((msg) => {
    setToast({ message: msg, time: Date.now() });
  }, []);

  const handleUndo = () => {
    if (toast) {
      triggerToast(`Undone: ${toast.message}`);
    }
  };

  const navigateTo = useCallback(
    (targetRoute) => {
      navigate(resolveHrPath(targetRoute));
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    if (currentUser) {
      logEvent({
        action: "logout",
        category: "Sessions",
        module: "Auth",
        description: `Terminated active user session for ${currentUser.name} (${currentUser.employeeId || 'Staff'})`,
        target: { type: "User", id: currentUser.employeeId, name: currentUser.name },
        user: currentUser,
      });
    }
    setSalaryUnlocked(false);
    logout();
    navigate('/login', { replace: true });
  }, [currentUser, logout, navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail && typeof e.detail === "string") {
        navigateTo(e.detail);
      }
    };
    window.addEventListener("hrms_navigate", handleNav);
    return () => window.removeEventListener("hrms_navigate", handleNav);
  }, [navigateTo]);

  const formatRouteName = (route) => {
    return HR_ROUTE_LABELS[route] || (route ? route.charAt(0).toUpperCase() + route.slice(1) : "Dashboard");
  };

  const prevRouteRef = useRef(currentRoute);
  const routeEnterTimeRef = useRef(Date.now());

  useEffect(() => {
    const prevRoute = prevRouteRef.current;
    const now = Date.now();
    const durationSeconds = Math.max(Math.round((now - routeEnterTimeRef.current) / 1000), 1);

    if (prevRoute && prevRoute !== currentRoute) {
      logEvent({
        action: "page_visit",
        category: "Navigation",
        module: formatRouteName(prevRoute),
        description: `Navigated to ${formatRouteName(currentRoute)} (Spent ${durationSeconds}s on ${formatRouteName(prevRoute)})`,
        target: { type: "Page", id: currentRoute, name: formatRouteName(currentRoute) },
        metadata: { fromRoute: prevRoute, toRoute: currentRoute, durationSeconds },
        user: currentUser,
      });
    }

    prevRouteRef.current = currentRoute;
    routeEnterTimeRef.current = now;
  }, [currentRoute, currentUser]);

  return (
    <div className="mod-hr min-h-screen text-ink flex flex-col items-center">
      <div className="w-full max-w-[1440px] px-4 md:px-6 py-4 flex flex-col md:flex-row gap-6">
        <Sidebar
          currentRoute={currentRoute}
          setCurrentRoute={navigateTo}
          currentUser={currentUser}
          onNavigate={navigateTo}
          onTriggerToast={triggerToast}
        />

        <main className="flex-1 flex flex-col gap-6 min-w-0">
          <Header
            currentRoute={currentRoute}
            currentUser={currentUser}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            onTriggerToast={triggerToast}
          />

          <ErrorBoundary>
            <Routes>
              <Route index element={<Navigate to="/hr/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <OverviewView
                    currentUser={currentUser}
                    currentRoute={currentRoute}
                    setCurrentRoute={navigateTo}
                    onTriggerToast={triggerToast}
                    onNavigateToTasks={(filter) => {
                      setTaskStatusFilter(filter);
                      navigateTo("my-tasks");
                    }}
                  />
                }
              />
              <Route path="overview" element={<Navigate to="/hr/dashboard" replace />} />

              <Route
                path="my-tasks"
                element={
                  <TasksView
                    currentUser={currentUser}
                    initialFilter={taskStatusFilter}
                    setCurrentRoute={navigateTo}
                    onTriggerToast={triggerToast}
                  />
                }
              />
              <Route path="tasks" element={<Navigate to="/hr/my-tasks" replace />} />

              <Route
                path="employee-management"
                element={<EmployeeManagement currentUser={currentUser} onTriggerToast={triggerToast} />}
              />
              <Route path="employees" element={<Navigate to="/hr/employee-management" replace />} />

              <Route path="recruitment" element={<Recruitment currentUser={currentUser} onTriggerToast={triggerToast} />} />
              <Route path="hiring" element={<Navigate to="/hr/recruitment" replace />} />

              <Route path="offboarding" element={<Offboarding onTriggerToast={triggerToast} />} />
              <Route path="exit" element={<Navigate to="/hr/offboarding" replace />} />

              <Route
                path="teams/*"
                element={<TeamsView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />
              <Route path="team/*" element={<Navigate to="/hr/teams" replace />} />

              <Route
                path="attendance/*"
                element={<AttendanceView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />
              <Route path="my-attendance" element={<Navigate to="/hr/attendance" replace />} />
              <Route path="attendance-desk" element={<Navigate to="/hr/attendance" replace />} />

              <Route
                path="shifts-roster"
                element={<ShiftsRosterView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />
              <Route path="shifts" element={<Navigate to="/hr/shifts-roster" replace />} />
              <Route path="roster" element={<Navigate to="/hr/shifts-roster" replace />} />

              <Route
                path="leave"
                element={
                  <LeaveView
                    currentUser={currentUser}
                    selectedCalDay={selectedCalDay}
                    setSelectedCalDay={setSelectedCalDay}
                    onTriggerToast={triggerToast}
                  />
                }
              />
              <Route path="holidays" element={<Navigate to="/hr/leave?tab=holidays" replace />} />

              <Route
                path="lop"
                element={
                  <LopView
                    currentUser={currentUser}
                    onTriggerToast={triggerToast}
                    setCurrentRoute={navigateTo}
                  />
                }
              />

              <Route
                path="payroll"
                element={
                  <PayrollView
                    currentUser={currentUser}
                    salaryUnlocked={salaryUnlocked}
                    setSalaryUnlocked={setSalaryUnlocked}
                    setPayslipModal={setPayslipModal}
                    onTriggerToast={triggerToast}
                    setCurrentRoute={navigateTo}
                  />
                }
              />
              <Route path="payroll/bonus" element={<Navigate to="/hr/benefits-allowances?tab=bonus" replace />} />

              <Route
                path="benefits-allowances"
                element={
                  <BenefitsView
                    currentUser={currentUser}
                    onTriggerToast={triggerToast}
                    setCurrentRoute={navigateTo}
                    onNavigate={navigateTo}
                  />
                }
              />
              <Route path="benefits" element={<Navigate to="/hr/benefits-allowances" replace />} />
              <Route path="bonus" element={<Navigate to="/hr/benefits-allowances?tab=bonus" replace />} />

              <Route path="onboarding" element={<OnboardingView onTriggerToast={triggerToast} />} />

              <Route
                path="performance"
                element={<PerformanceView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />

              <Route
                path="documents"
                element={<DocumentsView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />

              <Route
                path="reports"
                element={<ReportsView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />

              <Route
                path="approvals"
                element={
                  <ApprovalsView
                    currentUser={currentUser}
                    setCurrentRoute={navigateTo}
                    onTriggerToast={triggerToast}
                  />
                }
              />

              <Route
                path="announcements"
                element={
                  <AnnouncementsView
                    currentUser={currentUser}
                    onTriggerToast={triggerToast}
                    setCurrentRoute={navigateTo}
                  />
                }
              />

              <Route
                path="notifications"
                element={
                  <NotificationsView
                    currentUser={currentUser}
                    onTriggerToast={triggerToast}
                    setCurrentRoute={navigateTo}
                  />
                }
              />

              <Route
                path="hr-settings"
                element={<SettingsView currentUser={currentUser} onTriggerToast={triggerToast} />}
              />
              <Route path="settings" element={<Navigate to="/hr/hr-settings" replace />} />
              <Route path="hrsettings" element={<Navigate to="/hr/hr-settings" replace />} />

              <Route
                path="audit-logs"
                element={
                  <AuditLogsView
                    currentUser={currentUser}
                    setCurrentRoute={navigateTo}
                    onTriggerToast={triggerToast}
                  />
                }
              />
              <Route path="audit" element={<Navigate to="/hr/audit-logs" replace />} />

              <Route
                path="my-profile"
                element={
                  <MyProfileView
                    currentUser={currentUser}
                    onUpdateUser={updateProfile}
                    onTriggerToast={triggerToast}
                    onNavigate={navigateTo}
                    onSignOut={handleLogout}
                  />
                }
              />

              <Route
                path="account-settings"
                element={
                  <AccountSettingsView
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onTriggerToast={triggerToast}
                  />
                }
              />

              <Route path="*" element={<HrNotFound onBack={() => navigateTo("dashboard")} />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      <PayslipModal
        payslipData={payslipModal}
        onClose={() => setPayslipModal(null)}
        onTriggerToast={triggerToast}
      />

      <FloatingAIChat currentUser={currentUser} />

      <Toast toast={toast} onUndo={handleUndo} />
    </div>
  );
}

export function HrModuleRoutes() {
  return (
    <ProfileProvider>
      <AttendanceProvider>
        <HrShell />
      </AttendanceProvider>
    </ProfileProvider>
  );
}

export default HrModuleRoutes;
