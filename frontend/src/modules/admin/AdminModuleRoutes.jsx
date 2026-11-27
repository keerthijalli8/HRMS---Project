import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { CompanyThemeProvider } from "./context/CompanyThemeContext";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import AddDepartment from "./pages/AddDepartment";
import Attendance, { AttendanceRecords } from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Settings from "./pages/Settings";
import Performance from "./pages/Performance";
import KpiRecordsRoute from "./components/KpiRecordsRoute";
import ReportsAudit from "./pages/ReportsAudit";
import DepartmentHierarchy from "./pages/DepartmentHierarchy";
import AnnouncementManagement from "./pages/AnnouncementManagement";
import AnnouncementKpiRecords from "./pages/AnnouncementKpiRecords";
import Notifications from "./pages/Notifications";
import AdminDirectory from "./pages/AdminDirectory";
import OrganizationAdmin from "./pages/OrganizationAdmin";
import HrConfiguration from "./pages/HrConfiguration";
import HrConfigurationKpiRecords from "./pages/HrConfigurationKpiRecords";
import Permissions from "./pages/Permissions";
import Integrations from "./pages/Integrations";
import CompanyBranding from "./pages/CompanyBranding";
import WorkflowManagement from "./pages/WorkflowManagement";

import "./style/bootstrap-scoped.css";
import "./index.css";
import "./style/AdminDashboardTheme.css";
import "./style/design-system.css";

export function AdminModuleRoutes() {
  return (
    <CompanyThemeProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route
            path="employees/records"
            element={
              <KpiRecordsRoute module="employees">
                <Employees />
              </KpiRecordsRoute>
            }
          />
          <Route path="departments" element={<Departments />} />
          <Route path="departments/add" element={<AddDepartment />} />
          <Route path="departments/records" element={<DepartmentHierarchy />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/records" element={<AttendanceRecords />} />
          <Route path="leave" element={<Leaves />} />
          <Route path="leaves" element={<Leaves />} />
          <Route
            path="leaves/records"
            element={
              <KpiRecordsRoute module="leaves">
                <Leaves />
              </KpiRecordsRoute>
            }
          />
          <Route path="payroll" element={<Payroll />} />
          <Route
            path="payroll/records"
            element={
              <KpiRecordsRoute module="payroll">
                <Payroll />
              </KpiRecordsRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/branding" element={<CompanyBranding />} />
          <Route path="performance" element={<Performance />} />
          <Route path="reports" element={<ReportsAudit />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="announcements" element={<AnnouncementManagement />} />
          <Route path="announcements/new" element={<AnnouncementManagement />} />
          <Route path="announcements/inbox" element={<AnnouncementManagement />} />
          <Route
            path="announcements/total"
            element={<AnnouncementKpiRecords type="total" />}
          />
          <Route
            path="announcements/published"
            element={<AnnouncementKpiRecords type="published" />}
          />
          <Route
            path="announcements/scheduled"
            element={<AnnouncementKpiRecords type="scheduled" />}
          />
          <Route
            path="announcements/drafts"
            element={<AnnouncementKpiRecords type="drafts" />}
          />
          <Route
            path="announcements/expired"
            element={<AnnouncementKpiRecords type="expired" />}
          />
          <Route
            path="announcements/archived"
            element={<AnnouncementKpiRecords type="archived" />}
          />
          <Route
            path="announcements/:announcementId/edit"
            element={<AnnouncementManagement />}
          />
          <Route
            path="announcements/:announcementId/report"
            element={<AnnouncementManagement />}
          />
          <Route
            path="announcements/:announcementId"
            element={<AnnouncementManagement />}
          />
          <Route
            path="performance/records"
            element={
              <KpiRecordsRoute module="performance">
                <Performance />
              </KpiRecordsRoute>
            }
          />
          <Route path="roles" element={<AdminDirectory type="roles" />} />
          <Route
            path="organization"
            element={<OrganizationAdmin section="profile" />}
          />
          <Route
            path="users"
            element={<OrganizationAdmin section="users" />}
          />
          <Route path="permissions" element={<Permissions />} />
          <Route path="workflows" element={<WorkflowManagement />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="hr-configuration" element={<HrConfiguration />} />
          <Route
            path="hr-configuration/records"
            element={<HrConfigurationKpiRecords />}
          />
          <Route path="profile" element={<Settings />} />
        </Route>
      </Routes>
    </CompanyThemeProvider>
  );
}

export default AdminModuleRoutes;
