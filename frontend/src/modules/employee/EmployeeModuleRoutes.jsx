// src/modules/employee/EmployeeModuleRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { Layout } from './components/Layout.jsx';

import { Overview } from './pages/Overview.jsx';
import { Attendance } from './pages/Attendance.jsx';
import { Leave } from './pages/Leave.jsx';
import { Tasks } from './pages/Tasks.jsx';
import { Shifts } from './pages/Shifts.jsx';
import { Holidays } from './pages/Holidays.jsx';
import { Performance } from './pages/Performance.jsx';
import { Documents } from './pages/Documents.jsx';
import { Notifications } from './pages/Notifications.jsx';
import { Profile } from './pages/Profile.jsx';
import { Settings } from './pages/Settings.jsx';
import { Support } from './pages/Support.jsx';
import { PayrollPage } from './pages/PayrollPage.jsx';

export function EmployeeModuleRoutes() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <AttendanceProvider>
          <Routes>
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<Layout title="Overview"><Overview /></Layout>} />
            <Route path="notifications" element={<Layout title="Notifications"><Notifications /></Layout>} />
            <Route path="attendance" element={<Layout title="My attendance"><Attendance /></Layout>} />
            <Route path="leave" element={<Layout title="Leave"><Leave /></Layout>} />
            <Route path="tasks" element={<Layout title="My tasks"><Tasks /></Layout>} />
            <Route path="shifts" element={<Layout title="My shift"><Shifts /></Layout>} />
            <Route path="holidays" element={<Layout title="Holiday calendar"><Holidays /></Layout>} />
            <Route path="finance/payroll" element={<Layout title="Payroll"><PayrollPage /></Layout>} />
            <Route path="payroll" element={<Navigate to="/employee/finance/payroll" replace />} />
            <Route path="finance/automation" element={<Navigate to="/employee/finance/payroll" replace />} />
            <Route path="payments" element={<Navigate to="/employee/finance/payroll" replace />} />
            <Route path="automation-payroll" element={<Navigate to="/employee/finance/payroll" replace />} />
            <Route path="performance" element={<Layout title="Performance"><Performance /></Layout>} />
            <Route path="documents" element={<Layout title="Documents"><Documents /></Layout>} />
            <Route path="profile" element={<Layout title="My profile"><Profile /></Layout>} />
            <Route path="settings" element={<Layout title="Settings"><Settings /></Layout>} />
            <Route path="support" element={<Layout title="Help & Support"><Support /></Layout>} />
            <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
          </Routes>
        </AttendanceProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}

export default EmployeeModuleRoutes;
