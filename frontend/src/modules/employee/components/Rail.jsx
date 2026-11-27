// src/components/Rail.jsx
// Left rail navigation (sticky 100vh, grouped nav, count badges, pinned user card).

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar } from './Avatar.jsx';
import { INITIAL_EMPLOYEE } from '../data/employee.js';
import { NAV_GROUPS } from '../config/navigation.js';

export function Rail({ className = '' }) {
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    if (showToast) {
      showToast('Signed out of session.');
    }
    navigate('/login', { replace: true });
  };

  const getBadgeValue = (key) => {
    if (key === 'notifs') return unreadCount > 0 ? unreadCount : null;
    if (key === 'tasks') return 5; // 5 pending tasks
    return null;
  };

  return (
    <aside
      className={`w-full md:w-[var(--rail)] md:sticky md:top-0 md:h-screen flex flex-col justify-between py-4 select-none shrink-0 border-b md:border-b-0 md:border-r border-line/30 overflow-y-auto ${className}`}
    >
      {/* Top Brand Section */}
      <div className="px-3 pb-4">
        <img
          src="/technomold-logo.png"
          alt="Technomold IT Solutions Pvt Ltd"
          className="block w-full max-w-[210px] h-auto"
        />
      </div>

      {/* Nav List Grouped */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto space-y-4 px-2 py-1 flex md:block gap-2 scrollbar-none"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1 shrink-0">
            <div className="px-3 text-[10px] uppercase font-bold tracking-[0.08em] text-muted/70 mb-1 hidden md:block">
              {group.label}
            </div>

            <div className="flex md:flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const badge = getBadgeValue(item.badgeKey);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/employee/dashboard'}
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

                    {badge !== null && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-accent2 text-white font-bold text-[10px] leading-none shrink-0 shadow-sm">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pinned Bottom User Card & Sign Out */}
      <div className="pt-3 px-2 border-t border-line/40 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/employee/profile')}
          className="w-full flex items-center gap-2.5 p-2 rounded-tpl bg-surface2/40 hover:bg-surface2 border border-line/50 transition-colors text-left"
          title="Open My Profile"
        >
          <Avatar name={user?.name || INITIAL_EMPLOYEE.name} src={user?.avatarUrl} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink truncate leading-tight">
              {user?.name || INITIAL_EMPLOYEE.name}
            </div>
            <div className="text-[11px] text-muted truncate">
              {user?.designation || INITIAL_EMPLOYEE.designation}
            </div>
          </div>
        </button>

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

