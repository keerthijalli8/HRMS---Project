
import React from 'react';

import { useStore } from '../../context/StoreContext';

import { NAV_STRUCTURE } from './LeftRail';

import { IconPlus } from '../shared/Icons';

import { ProfileDropdown } from './ProfileDropdown';

import { GlobalSearch } from './GlobalSearch';

import { NotificationsMenu } from './NotificationsMenu';

import { AttendanceTracker } from './AttendanceTracker';
import { DashboardSwitcher } from '../../../../components/DashboardSwitcher.jsx';

// ============================================================
// IT ADMINISTRATION - PAGE TITLES
// ============================================================

const PAGE_TITLES = Object.fromEntries(
  NAV_STRUCTURE.map(item => [
    item.id,
    item.label
  ])
);

// ============================================================
// COMMON HEADER COMPONENT
// ============================================================

export function Header() {
  const {
    activePage,
    currentUser,
    isAuthenticated,
    setActiveDrawer,
    hasPermission,
    showToast,
  } = useStore();

  const pageTitle =
    PAGE_TITLES[activePage] ||
    PAGE_TITLES.dashboard ||
    'Dashboard';

  // ==========================================================
  // QUICK ACTIONS - ROLE BASED PERMISSIONS
  // ==========================================================

  const canOpenQuickActions = [
    hasPermission('User Profiles', 'write'),

    hasPermission('Assets', 'write') ||
      hasPermission('Assets', 'update'),

    hasPermission('Helpdesk', 'write'),

    hasPermission('Software', 'write'),

    hasPermission('Security', 'delete'),

    hasPermission('Reports', 'read') &&
      hasPermission('Security', 'read'),
  ].some(Boolean);

  const handleQuickActions = () => {
    if (!canOpenQuickActions) return;

    setActiveDrawer('quick_actions');
  };

  // ==========================================================
  // ATTENDANCE AVAILABILITY
  // ==========================================================

  const canShowAttendance = Boolean(
    isAuthenticated &&
    currentUser
  );

  // ==========================================================
  // COMMON COMPACT HEADER
  // ==========================================================

  return (
    <header
      className="relative z-30 flex w-full min-w-0 flex-col gap-2 pb-3 pt-1 border-b border-line"
    >

      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">

        {/* ================================================
            ACTIVE PAGE TITLE
        ================================================= */}

        <div className="flex min-w-0 shrink-0 items-center gap-2">

          <h1
            style={{
              fontSize: 'clamp(22px, 2.2vw, 30px)',
              lineHeight: 1.15,
              textWrap: 'balance',
            }}
            className="font-display font-bold text-ink tracking-tight"
          >

            {pageTitle}

          </h1>

        </div>

        {/* ================================================
            COMMON HEADER ACTIONS
        ================================================= */}

        <div className="ml-auto flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-2">

          {/* ==============================================
              GLOBAL SEARCH
          =============================================== */}

          <div className="flex min-w-[140px] max-w-[260px] flex-1 items-center">

            <GlobalSearch />

          </div>

          {/* ==============================================
              ATTENDANCE TRACKER

              Check In
              Browser Location Permission
              Live Working Timer
              Start Break / End Break
              Check Out
              Attendance History
          =============================================== */}

          {canShowAttendance && (

            <div
              className="flex shrink-0 items-center"
              aria-label="Employee attendance"
            >

              <AttendanceTracker
                currentUser={currentUser}
                showToast={showToast}
              />

            </div>

          )}

          {/* ==============================================
              QUICK ACTIONS

              Available in the common header.
              Removed from sidebar navigation.
          =============================================== */}

          {canOpenQuickActions && (

            <button
              type="button"
              id="header-quick-actions"
              onClick={handleQuickActions}
              aria-label="Open quick actions"
              title="Open available IT administration actions"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--on-accent)',
                borderRadius: 'var(--radius)',
              }}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 text-[11.5px] font-semibold shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
            >

              <IconPlus className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />

              <span className="hidden lg:inline">

                Quick Actions

              </span>

              <span className="lg:hidden">

                Actions

              </span>

            </button>

          )}

          {/* ==============================================
              ROLE DASHBOARD SWITCHER
          =============================================== */}

          <DashboardSwitcher />

          {/* ==============================================
              NOTIFICATIONS
          =============================================== */}

          <div className="flex shrink-0 items-center">

            <NotificationsMenu />

          </div>

          {/* ==============================================
              PROFILE MANAGEMENT
          =============================================== */}

          <div className="flex shrink-0 items-center">

            <ProfileDropdown />

          </div>

        </div>

      </div>

    </header>
  );
}
