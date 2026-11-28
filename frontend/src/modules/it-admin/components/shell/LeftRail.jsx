
import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { resolveItAdminPath } from '../../routes';
import { BrandLogo } from '../../../../components/BrandLogo.jsx';

import {
  IconDashboard,
  IconUsers,
  IconKey,
  IconLaptop,
  IconShare,
  IconHeadphones,
  IconPackage,
  IconShield,
  IconChart,
  IconChevronRight,
  IconFileText,
  IconSettings,
} from '../shared/Icons';

// ============================================================
// IT ADMINISTRATION NAVIGATION
// ============================================================

export const NAV_STRUCTURE = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: IconDashboard,
  },
  {
    id: 'accounts',
    label: 'User Accounts',
    icon: IconUsers,
  },
  {
    id: 'access',
    label: 'Access Management',
    icon: IconKey,
  },
  {
    id: 'inventory',
    label: 'Asset Management',
    icon: IconLaptop,
  },
  {
    id: 'allocate',
    label: 'Asset Allocation',
    icon: IconShare,
  },
  {
    id: 'desk',
    label: 'Helpdesk',
    icon: IconHeadphones,
    badgeKey: 'openTicketCount',
    badgeColor:
      'bg-accent2 text-white border-accent2 shadow-sm',
  },
  {
    id: 'licences',
    label: 'Software Management',
    icon: IconPackage,
  },
  {
    id: 'events',
    label: 'Security & Activity',
    icon: IconShield,
    badgeKey: 'unacknowledgedAlertCount',
    badgeColor:
      'bg-accent2 text-white border-accent2 shadow-sm',
  },
  {
    id: 'reports',
    label: 'IT Reports',
    icon: IconChart,
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: IconFileText,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: IconSettings,
  },
];

export const NAV_ITEMS = NAV_STRUCTURE.map(item => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
}));

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

export function LeftRail({
  collapsed = false,
  onToggleCollapsed = () => {},
}) {
  const {
    appLogo,
    uploadLogo,
    resetLogo,
    hasPermission,
    isAuthenticated,
    setActiveDrawer,
    setDrawerPayload,
    setSelectedTicketId,
    openTicketCount = 0,
    unacknowledgedAlertCount = 0,
  } = useStore();

  const fileInputRef = useRef(null);

  // ==========================================================
  // BRAND PERMISSIONS
  // ==========================================================

  const canUpdateBrand = hasPermission(
    'System Settings',
    'update'
  );

  // ==========================================================
  // DYNAMIC BADGES
  // ==========================================================

  const badgeCounts = {
    openTicketCount,
    unacknowledgedAlertCount,
  };

  // ==========================================================
  // ROLE-BASED NAVIGATION
  // ==========================================================

  const permissionForPage = {
    accounts: ['User Profiles'],
    access: ['Security'],
    inventory: ['Assets'],
    allocate: ['Assets'],
    desk: ['Helpdesk'],
    licences: ['Software'],
    events: ['Security'],
    reports: ['Reports'],
    settings: ['System Settings'],
  };

  const visibleNavItems = NAV_STRUCTURE.filter(item => {
    if (item.id === 'dashboard') {
      return true;
    }

    if (item.id === 'help') {
      return isAuthenticated;
    }

    return (permissionForPage[item.id] || []).some(
      module => hasPermission(module, 'read')
    );
  });

  // ==========================================================
  // SIDEBAR RENDER
  // ==========================================================

  return (
    <aside
      aria-label="IT Administration Navigation Sidebar"
      style={{
        backgroundColor: 'var(--glass-sidebar, var(--surface))',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter:
          'blur(20px) saturate(140%)',
        borderRight: '1px solid var(--line)',
        padding: '6px 10px 20px',
      }}
      className={`shrink-0 flex flex-col w-full md:w-[var(--rail,280px)] sticky top-0 z-40 h-auto md:h-screen md:max-h-screen min-w-0 max-w-full overflow-hidden md:overflow-y-auto scrollbar-none shadow-2xl ${
        collapsed
          ? 'md:min-w-[76px]'
          : 'md:min-w-[280px]'
      }`}
    >
      <div className="flex flex-col gap-4 min-w-0 max-w-full w-full">

        {/* COMPANY LOGO */}

        <div
          className={`px-2 pt-1 pb-2 border-b border-line/40 ${
            collapsed ? 'md:px-1' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={!canUpdateBrand}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={event => {
              const file = event.target.files?.[0];

              if (file) {
                uploadLogo(file);
                event.target.value = '';
              }
            }}
          />

          <div
            role={canUpdateBrand ? 'button' : undefined}
            tabIndex={canUpdateBrand ? 0 : undefined}
            onClick={
              canUpdateBrand
                ? () => fileInputRef.current?.click()
                : undefined
            }
            onKeyDown={event => {
              if (!canUpdateBrand) return;

              if (
                event.key === 'Enter' ||
                event.key === ' '
              ) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`brand-logo-header flex w-full items-center justify-center ${
              canUpdateBrand ? 'cursor-pointer' : ''
            } group relative py-1 ${
              collapsed
                ? 'md:min-h-[52px]'
                : 'min-h-[82px]'
            }`}
            title={
              canUpdateBrand
                ? 'Click to upload custom logo (PNG, JPG, SVG, WebP)'
                : undefined
            }
            aria-label={
              canUpdateBrand
                ? 'Upload custom company logo'
                : undefined
            }
          >
            <div className="flex items-center min-w-0 w-full flex-1 justify-center">
              <BrandLogo
                customSrc={appLogo}
                alt="Technomold IT Solutions Pvt Ltd"
                className={`select-none object-contain dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] dark:brightness-125 transition-all ${
                  collapsed
                    ? 'w-full h-[76px] md:w-12 md:h-10 md:max-w-[48px]'
                    : 'w-full max-w-full h-[76px]'
                }`}
              />
            </div>

            {canUpdateBrand && (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
                aria-label="Upload brand logo"
                className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 focus-visible:opacity-100 transition-all text-[9.5px] font-bold text-accent bg-card-bg border border-accent/40 rounded-md px-1.5 py-0.5 uppercase select-none cursor-pointer shadow"
              >
                UPLOAD
              </button>
            )}
          </div>

          {/* RESET LOGO */}

          {canUpdateBrand &&
            appLogo &&
            appLogo !==
              '/technomold-logo-transparent.png' && (
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-muted">
                  Custom logo
                </span>

                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    resetLogo();
                  }}
                  className="text-accent hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>
            )}

          {/* COLLAPSE AND EXPAND */}

          <div
            className={`flex mt-1 ${
              collapsed
                ? 'justify-center'
                : 'justify-end'
            }`}
          >
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={
                collapsed
                  ? 'Expand navigation'
                  : 'Collapse navigation'
              }
              aria-expanded={!collapsed}
              title={
                collapsed
                  ? 'Expand navigation'
                  : 'Collapse navigation'
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted hover:text-ink hover:bg-surface2 transition-colors"
            >
              <IconChevronRight
                className={`w-4 h-4 transition-transform ${
                  collapsed ? '' : 'rotate-180'
                }`}
              />

              <span
                className={
                  collapsed
                    ? 'hidden'
                    : 'hidden md:inline'
                }
              >
                {collapsed ? 'Expand' : 'Collapse'}
              </span>
            </button>
          </div>
        </div>

        {/* MAIN NAVIGATION */}

        <nav
          aria-label="Main menu"
          className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible py-1 w-full max-w-full min-w-0 scrollbar-none"
        >
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const targetPath = resolveItAdminPath(item.id);

            const badgeValue = item.badgeKey
              ? Number(
                  badgeCounts[item.badgeKey] ?? 0
                )
              : 0;

            const showBadge =
              Number.isFinite(badgeValue) &&
              badgeValue > 0;

            const badgeLabel =
              item.id === 'desk'
                ? 'Open tickets'
                : 'Unacknowledged security alerts';

            return (
              <React.Fragment key={item.id}>

                {item.id === 'help' && (
                  <div
                    aria-hidden="true"
                    className="hidden md:block border-t border-line/40 my-2"
                  />
                )}

                <NavLink
                  to={targetPath}
                  end={item.id === 'dashboard'}
                  onClick={() => {
                    setActiveDrawer(null);
                    setDrawerPayload(null);
                    setSelectedTicketId(null);
                  }}
                  aria-label={
                    showBadge
                      ? `${item.label}, ${badgeValue} ${badgeLabel}`
                      : item.label
                  }
                  title={
                    collapsed
                      ? `${item.label}${
                          showBadge
                            ? ` (${badgeValue})`
                            : ''
                        }`
                      : undefined
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive
                      ? 'rgba(14, 165, 233, 0.18)'
                      : 'transparent',

                    backdropFilter: isActive
                      ? 'blur(12px)'
                      : undefined,

                    WebkitBackdropFilter: isActive
                      ? 'blur(12px)'
                      : undefined,

                    border: isActive
                      ? '1px solid rgba(56, 189, 248, 0.45)'
                      : '1px solid transparent',

                    boxShadow: isActive
                      ? '0 4px 18px rgba(14, 165, 233, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
                      : undefined,

                    borderRadius: 'var(--radius)',
                  })}
                  className={({ isActive }) =>
                    `group w-full flex items-center px-3 py-2.5 text-[14px] font-semibold transition-all text-left select-none cursor-pointer min-h-[44px] no-underline ${
                      collapsed
                        ? 'md:justify-center md:px-2'
                        : 'justify-between'
                    } ${
                      isActive
                        ? 'text-ink font-bold'
                        : 'text-muted hover:text-ink hover:bg-surface2'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex items-center gap-3 min-w-0 flex-1 ${
                          collapsed
                            ? 'md:justify-center md:flex-none'
                            : ''
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-accent'
                              : 'text-muted group-hover:text-ink'
                          }`}
                        />

                        <span
                          className={
                            collapsed
                              ? 'md:hidden'
                              : 'break-words leading-tight'
                          }
                        >
                          {item.label}
                        </span>
                      </div>

                      {showBadge && (
                        <span
                          title={`${badgeValue} ${badgeLabel}`}
                          className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                            collapsed
                              ? 'md:hidden'
                              : ''
                          } ${
                            item.badgeColor ||
                            'bg-surface2 text-muted border-line'
                          }`}
                        >
                          {badgeValue > 99
                            ? '99+'
                            : badgeValue}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>

              </React.Fragment>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}
