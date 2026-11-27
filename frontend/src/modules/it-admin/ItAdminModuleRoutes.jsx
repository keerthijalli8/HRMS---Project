import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { StoreProvider } from './context/StoreContext';
import { LeftRail } from './components/shell/LeftRail';
import { Header } from './components/shell/Header';
import { DrawersManager } from './components/shell/DrawersManager';
import { Toast } from './components/shared/Toast';
import { useUniversalScrollLock } from './utils/scrollLock';

import { DashboardPage } from './components/pages/DashboardPage';
import { UserAccountsPage } from './components/pages/UserAccountsPage';
import { AccessManagementPage } from './components/pages/AccessManagementPage';
import { AssetManagementPage } from './components/pages/AssetManagementPage';
import { AssetAllocationPage } from './components/pages/AssetAllocationPage';
import { HelpdeskPage } from './components/pages/HelpdeskPage';
import { SoftwareManagementPage } from './components/pages/SoftwareManagementPage';
import { SecurityActivityPage } from './components/pages/SecurityActivityPage';
import { ITReportsPage } from './components/pages/ITReportsPage';
import { HelpSupportPage } from './components/pages/HelpSupportPage';
import { SystemSettingsPage } from './components/pages/SystemSettingsPage';

function ItAdminShell() {
  useUniversalScrollLock();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      style={{
        maxWidth: '1760px',
        paddingLeft: 'max(24px, env(safe-area-inset-left))',
        paddingRight: 'max(24px, env(safe-area-inset-right))',
        '--rail': sidebarCollapsed ? '76px' : '280px',
      }}
      className="mod-it mx-auto min-h-screen grid grid-cols-1 md:grid-cols-[var(--rail,280px)_minmax(0,1fr)] md:gap-8 w-full max-w-full items-start overflow-hidden md:overflow-visible"
    >
      <LeftRail
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() =>
          setSidebarCollapsed(value => !value)
        }
      />

      <main
        id="main-content"
        className="flex flex-col gap-6 min-w-0 pb-12 pt-4"
        tabIndex={-1}
      >
        <Header />

        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<Navigate to="/it-admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="accounts" element={<UserAccountsPage />} />
            <Route path="access" element={<AccessManagementPage />} />
            <Route path="permissions" element={<Navigate to="/it-admin/access" replace />} />
            <Route path="inventory" element={<AssetManagementPage />} />
            <Route path="hardwareSoftware" element={<Navigate to="/it-admin/inventory" replace />} />
            <Route path="hardware-software" element={<Navigate to="/it-admin/inventory" replace />} />
            <Route path="allocate" element={<AssetAllocationPage />} />
            <Route path="desk" element={<HelpdeskPage />} />
            <Route path="licences" element={<SoftwareManagementPage />} />
            <Route path="licenses" element={<Navigate to="/it-admin/licences" replace />} />
            <Route path="events" element={<SecurityActivityPage />} />
            <Route path="reports" element={<ITReportsPage />} />
            <Route path="help" element={<HelpSupportPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="*" element={<Navigate to="/it-admin/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      <DrawersManager />

      <Toast />
    </div>
  );
}

export function ItAdminModuleRoutes() {
  return (
    <StoreProvider>
      <ItAdminShell />
    </StoreProvider>
  );
}

export default ItAdminModuleRoutes;
