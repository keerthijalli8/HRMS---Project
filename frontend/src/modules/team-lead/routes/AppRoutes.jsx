import React, {
  lazy,
  Suspense
} from 'react';

import {
  Routes,
  Route,
  Navigate,
  useOutletContext,
  useNavigate
} from 'react-router-dom';

import { useAuth } from '../../../auth/AuthContext.jsx';
import { MainLayout } from '../components/layout/MainLayout.jsx';

import TeamReports from '../pages/teamlead/TeamReports.jsx';
import TeamCalendar from '../pages/teamlead/TeamCalendar.jsx';

// ============================================================
// TEAM LEAD ONLY ROUTES
// ============================================================

const Dashboard = lazy(() =>
  import('../pages/teamlead/Dashboard.jsx')
    .then(module => ({
      default: module.Dashboard
    }))
);

const Approvals = lazy(() =>
  import('../pages/teamlead/Approvals.jsx')
    .then(module => ({
      default: module.Approvals
    }))
);

const Attendance = lazy(() =>
  import('../pages/teamlead/Attendance.jsx')
    .then(module => ({
      default: module.Attendance
    }))
);

const MyAttendance = lazy(() =>
  import('../pages/teamlead/PersonalAttendance.jsx')
    .then(module => ({
      default: module.MyAttendance
    }))
);

const LeaveManagement = lazy(() =>
  import('../pages/teamlead/LeaveManagement.jsx')
    .then(module => ({
      default: module.LeaveManagement
    }))
);

const MyTeam = lazy(() =>
  import('../pages/teamlead/MyTeam.jsx')
    .then(module => ({
      default: module.MyTeam
    }))
);

const Performance = lazy(() =>
  import('../pages/teamlead/Performance.jsx')
    .then(module => ({
      default: module.Performance
    }))
);

const Tasks = lazy(() =>
  import('../pages/teamlead/Tasks.jsx')
    .then(module => ({
      default: module.Tasks
    }))
);

const Settings = lazy(() =>
  import('../pages/teamlead/Settings.jsx')
    .then(module => ({
      default: module.Settings
    }))
);

const Projects = lazy(() =>
  import('../pages/teamlead/Projects.jsx')
    .then(module => ({
      default: module.Projects
    }))
);

const MyPayslip = lazy(() =>
  import('../pages/teamlead/MyPayslip.jsx')
    .then(module => ({
      default: module.EmployeePayslip
    }))
);

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

const TEAM_LEAD_HOME = '/team-lead/dashboard';

const MANAGEMENT_ROLES = [
  'team-lead',
  'manager',
  'super-admin'
];

const normalizeRole = role =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

// ============================================================
// ACCESS DENIED
// ============================================================

const AccessDenied = () => (
  <div className="flex min-h-[50vh] items-center justify-center p-5">
    <div className="glass-card w-full max-w-md space-y-3 p-6 text-center">
      <h2 className="font-display text-xl font-bold text-bad">
        Access Denied
      </h2>
      <p className="text-sm leading-relaxed text-muted">
        You do not have permission to access the Team Lead workspace.
      </p>
      <p className="text-xs text-muted">
        Please contact your system administrator.
      </p>
    </div>
  </div>
);

// ============================================================
// TEAM LEAD ROUTE GUARD
// ============================================================

const TeamLeadOnly = ({ children }) => {
  const context = useOutletContext() || {};
  const role = normalizeRole(context.activeRole);
  const allowedRoles = Array.isArray(context.allowedRoles)
    ? context.allowedRoles
    : [];

  const authorized =
    Boolean(context.currentUser) &&
    MANAGEMENT_ROLES.includes(role) &&
    allowedRoles.includes('team-lead');

  if (!authorized) {
    return <AccessDenied />;
  }

  return children;
};

// ============================================================
// TEAM LEAD HOME REDIRECTION
// ============================================================

const HomeRedirect = () => (
  <TeamLeadOnly>
    <Navigate to={TEAM_LEAD_HOME} replace />
  </TeamLeadOnly>
);

// ============================================================
// PAGE LOADER
// ============================================================

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent"
        aria-hidden="true"
      />
      <span className="text-sm text-muted">Loading page...</span>
    </div>
  </div>
);

// ============================================================
// APPLICATION ROUTES (MOUNTED AT /team-lead/*)
// ============================================================

export const AppRoutes = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
    return { success: true };
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout onSignOut={handleSignOut} />}>
          <Route index element={<HomeRedirect />} />

          <Route
            path="dashboard"
            element={
              <TeamLeadOnly>
                <Dashboard />
              </TeamLeadOnly>
            }
          />

          <Route
            path="team"
            element={
              <TeamLeadOnly>
                <MyTeam />
              </TeamLeadOnly>
            }
          />

          <Route
            path="attendance"
            element={
              <TeamLeadOnly>
                <Navigate to="/team-lead/my-attendance" replace />
              </TeamLeadOnly>
            }
          />

          <Route
            path="my-attendance"
            element={
              <TeamLeadOnly>
                <MyAttendance />
              </TeamLeadOnly>
            }
          />

          <Route
            path="team-attendance"
            element={
              <TeamLeadOnly>
                <Attendance />
              </TeamLeadOnly>
            }
          />

          <Route
            path="leave"
            element={
              <TeamLeadOnly>
                <LeaveManagement />
              </TeamLeadOnly>
            }
          />

          <Route
            path="attendance-regularization"
            element={
              <TeamLeadOnly>
                <Navigate to="/team-lead/approvals" replace />
              </TeamLeadOnly>
            }
          />

          <Route
            path="tasks"
            element={
              <TeamLeadOnly>
                <Tasks />
              </TeamLeadOnly>
            }
          />

          <Route
            path="timesheet-approval"
            element={
              <TeamLeadOnly>
                <Approvals fixedCategory="Timesheet Approval" />
              </TeamLeadOnly>
            }
          />

          <Route
            path="performance"
            element={
              <TeamLeadOnly>
                <Performance />
              </TeamLeadOnly>
            }
          />

          <Route
            path="my-calendar"
            element={
              <TeamLeadOnly>
                <TeamCalendar key="personal-calendar" personal />
              </TeamLeadOnly>
            }
          />

          <Route
            path="team-calendar"
            element={
              <TeamLeadOnly>
                <TeamCalendar key="team-calendar" />
              </TeamLeadOnly>
            }
          />

          <Route
            path="team-reports"
            element={
              <TeamLeadOnly>
                <TeamReports />
              </TeamLeadOnly>
            }
          />

          <Route
            path="projects"
            element={
              <TeamLeadOnly>
                <Projects />
              </TeamLeadOnly>
            }
          />

          <Route
            path="approvals"
            element={
              <TeamLeadOnly>
                <Approvals />
              </TeamLeadOnly>
            }
          />

          <Route
            path="my-payslip"
            element={
              <TeamLeadOnly>
                <MyPayslip />
              </TeamLeadOnly>
            }
          />

          <Route
            path="settings"
            element={
              <TeamLeadOnly>
                <Settings />
              </TeamLeadOnly>
            }
          />

          <Route path="team-leads/:employeeId" element={<HomeRedirect />} />
          <Route path="employee" element={<HomeRedirect />} />
          <Route path="employee/*" element={<HomeRedirect />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
