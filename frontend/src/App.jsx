// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { RoleGuard } from './auth/RoleGuard.jsx';
import { getHomeRouteForRoles } from './auth/roles.js';
import { Layout } from './modules/auth/components/layout/Layout.jsx';

import { Login } from './modules/auth/pages/Login.jsx';
import { FaceEnrollment } from './modules/auth/pages/FaceEnrollment.jsx';
import { AdminDashboard } from './modules/auth/pages/AdminDashboard.jsx';
import { ManagerModuleRoutes } from './modules/manager/ManagerModuleRoutes.jsx';
import { TeamLeadModuleRoutes } from './modules/team-lead/TeamLeadModuleRoutes.jsx';
import { EmployeeModuleRoutes } from './modules/employee/EmployeeModuleRoutes.jsx';
import { HrModuleRoutes } from './modules/hr/HrModuleRoutes.jsx';
import { ItAdminModuleRoutes } from './modules/it-admin/ItAdminModuleRoutes.jsx';
import { SuperAdminModuleRoutes } from './modules/super-admin/SuperAdminModuleRoutes.jsx';
import { AdminModuleRoutes } from './modules/admin/AdminModuleRoutes.jsx';

function RootRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRouteForRoles(user.roles)} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Sole Public Entry Route: Face Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Face Enrollment Onboarding */}
            <Route
              path="/enroll"
              element={
                <RoleGuard skipEnrollmentCheck>
                  <Layout title="Face Enrollment">
                    <FaceEnrollment />
                  </Layout>
                </RoleGuard>
              }
            />

            {/* HR / Admin Face Audit Console */}
            <Route
              path="/hr/face-audit"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
                  <Layout title="HR Face Login Audit">
                    <AdminDashboard />
                  </Layout>
                </RoleGuard>
              }
            />

            {/* Role-Specific Dashboard Routes (Phase 1 placeholders ready for Phases 2-8) */}
            <Route
              path="/super-admin/*"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminModuleRoutes />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminModuleRoutes />
                </RoleGuard>
              }
            />
            <Route
              path="/it-admin/*"
              element={
                <RoleGuard allowedRoles={['IT_ADMIN', 'SUPER_ADMIN']}>
                  <ItAdminModuleRoutes />
                </RoleGuard>
              }
            />
            <Route
              path="/hr/*"
              element={
                <RoleGuard allowedRoles={['HR', 'ADMIN', 'SUPER_ADMIN']}>
                  <HrModuleRoutes />
                </RoleGuard>
              }
            />
            <Route
              path="/manager/*"
              element={
                <RoleGuard allowedRoles={['MANAGER']}>
                  <ManagerModuleRoutes />
                </RoleGuard>
              }
            />
            <Route
              path="/team-lead/*"
              element={
                <RoleGuard allowedRoles={['TEAM_LEAD']}>
                  <TeamLeadModuleRoutes />
                </RoleGuard>
              }
            />
            <Route
              path="/employee/*"
              element={
                <RoleGuard allowedRoles={['EMPLOYEE']}>
                  <EmployeeModuleRoutes />
                </RoleGuard>
              }
            />

            {/* Root & Fallback Redirect */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
