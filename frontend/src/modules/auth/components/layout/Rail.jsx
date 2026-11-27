// src/components/layout/Rail.jsx
// Left rail navigation (sticky 100vh on desktop, horizontal bar on mobile) matching Monsoon Glass HRMS shell.

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Sliders,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../../auth/AuthContext.jsx';
import { getHomeRouteForRoles } from '../../../../auth/roles.js';
import { Avatar } from '../common/Avatar.jsx';

export function Rail({ className = '' }) {
  const { logout, user, isHR } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const homeRoute = getHomeRouteForRoles(user?.roles);

  const navGroups = [
    {
      label: 'SECURITY',
      items: [
        { to: homeRoute, label: 'Dashboard', icon: LayoutDashboard },
        {
          to: '/enroll',
          label: 'Enroll Face',
          icon: UserCheck,
          badge: user?.face_enrolled ? null : 'Setup'
        }
      ]
    },
    ...(isHR
      ? [
          {
            label: 'ADMIN & AUDIT',
            items: [
              { to: '/hr/face-audit', label: 'HR Login Audit', icon: Sliders }
            ]
          }
        ]
      : [])
  ];

  return (
    <aside
      className={`w-full md:w-[var(--rail)] md:sticky md:top-0 md:h-screen flex flex-col justify-between py-4 select-none shrink-0 border-b md:border-b-0 md:border-r border-line/30 overflow-y-auto ${className}`}
    >
      {/* Top Brand Section */}
      <div className="px-3 pb-4 flex items-center justify-between md:block">
        <div className="flex items-center select-none" aria-label="Technomold IT Solutions Pvt Ltd">
          <img
            src="/technomold-logo-dark.png"
            alt="Technomold IT Solutions Pvt Ltd"
            className="hidden dark:block h-8 sm:h-9 w-auto max-w-[190px] object-contain drop-shadow-sm"
          />
          <img
            src="/technomold-logo-light.png"
            alt="Technomold IT Solutions Pvt Ltd"
            className="block dark:hidden h-8 sm:h-9 w-auto max-w-[190px] object-contain drop-shadow-sm"
          />
        </div>

        {/* Mobile Sign Out Pill */}
        <button
          type="button"
          onClick={handleSignOut}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-tpl text-[12px] font-medium text-muted hover:text-bad hover:bg-bad/10 border border-line/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </div>

      {/* Nav List Grouped */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto space-y-0 md:space-y-4 px-2 py-1 flex md:block gap-2 scrollbar-none"
      >
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1 shrink-0">
            <div className="px-3 text-[10px] uppercase font-bold tracking-[0.08em] text-muted/70 mb-1 hidden md:block">
              {group.label}
            </div>

            <div className="flex md:flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-[14px] py-[11px] rounded-tpl text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'bg-surface2 text-ink border border-line shadow-sm'
                          : 'text-muted hover:text-ink hover:bg-surface2/60 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-warn/20 text-warn border border-warn/40 font-bold text-[10px] leading-none shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pinned Bottom User Card & Sign Out (Desktop) */}
      <div className="hidden md:block pt-3 px-2 border-t border-line/40 space-y-2 shrink-0">
        <div className="w-full flex items-center gap-3 p-2.5 rounded-tpl bg-surface2/50 border border-line/60 text-left">
          <Avatar name={user?.name || 'Employee'} size={34} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-ink truncate leading-tight">
              {user?.name || 'Employee'}
            </div>
            <div className="text-[11px] font-mono text-accent truncate mt-0.5">
              {user?.employee_id} · {user?.designation || user?.role || 'Staff'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-tpl text-[12px] font-medium text-muted hover:text-bad hover:bg-bad/10 border border-line/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default Rail;
