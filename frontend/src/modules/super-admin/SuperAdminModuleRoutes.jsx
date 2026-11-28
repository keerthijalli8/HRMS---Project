import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

import { NavigationProvider } from './context/NavigationContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import TenantManagement from './pages/TenantManagement/TenantManagement';
import OrganizationDetails from './pages/OrganizationDetails/OrganizationDetails';
import SubscriptionDetails from './pages/SubscriptionDetails/SubscriptionDetails';
import SubscriptionRequest from './pages/SubscriptionDetails/SubscriptionRequest';
import PlanManagement from './pages/PlanManagement/PlanManagement';
import Billing from './pages/Billing/Billing';
import ModuleManagement from './pages/ModuleManagement/ModuleManagement';
import PlatformUsers from './pages/PlatformUsers/PlatformUsers';
import UsageAnalytics from './pages/UsageAnalytics/UsageAnalytics';
import Monitoring from './pages/Monitoring/Monitoring';
import SecurityAuditLogs from './pages/SecurityAuditLogs/SecurityAuditLogs';
import Support from './pages/Support/Support';
import Settings from './pages/Settings/Settings';
import {
  CompanyActivation,
  CompanyDashboard,
} from './pages/CompanyPortal/CompanyPortal';
import CompanyThemeBuilder from './pages/CompanyPortal/CompanyThemeBuilder';
import './styles/global.css';

function ScopedPortal({ children }) {
  const { theme } = useTheme();
  const resolvedTheme = theme === 'light' ? 'light' : (() => {
    try {
      const saved = localStorage.getItem('superAdminTheme');
      return saved === 'dark' || saved === 'monsoon' ? saved : 'monsoon';
    } catch {
      return 'monsoon';
    }
  })();

  return (
    <div className="mod-superadmin" data-theme={resolvedTheme}>
      {children}
    </div>
  );
}

export function SuperAdminModuleRoutes() {
  return (
    <NavigationProvider>
      <Routes>
        <Route
          path="subscribe"
          element={
            <ScopedPortal>
              <SubscriptionRequest />
            </ScopedPortal>
          }
        />
        <Route
          path="activate"
          element={
            <ScopedPortal>
              <CompanyActivation />
            </ScopedPortal>
          }
        />
        <Route
          path="company"
          element={
            <ScopedPortal>
              <CompanyDashboard />
            </ScopedPortal>
          }
        />
        <Route
          path="company/modules/:module"
          element={
            <ScopedPortal>
              <CompanyDashboard />
            </ScopedPortal>
          }
        />
        <Route
          path="company/settings/theme"
          element={
            <ScopedPortal>
              <CompanyThemeBuilder />
            </ScopedPortal>
          }
        />

        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tenants" element={<TenantManagement />} />
          <Route path="organizations" element={<OrganizationDetails />} />
          <Route path="subscriptions" element={<SubscriptionDetails />} />
          <Route path="plans" element={<PlanManagement />} />
          <Route path="billing" element={<Billing />} />
          <Route path="modules" element={<ModuleManagement />} />
          <Route path="platform-users" element={<PlatformUsers />} />
          <Route path="analytics" element={<UsageAnalytics />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="security-audit-logs" element={<SecurityAuditLogs />} />
          <Route path="security" element={<Navigate to="/super-admin/security-audit-logs" replace />} />
          <Route path="support" element={<Support />} />

          <Route path="settings" element={<Settings />} />
          <Route path="settings/general" element={<Navigate to="/super-admin/settings?tab=general" replace />} />
          <Route path="settings/profile" element={<Navigate to="/super-admin/settings?tab=profile" replace />} />
          <Route path="settings/roles" element={<Navigate to="/super-admin/settings?tab=roles" replace />} />
          <Route path="settings/security" element={<Navigate to="/super-admin/settings?tab=security" replace />} />
        </Route>
      </Routes>
    </NavigationProvider>
  );
}

export default SuperAdminModuleRoutes;
