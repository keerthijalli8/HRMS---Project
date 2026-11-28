// src/components/layout/Header.jsx
// Main column header row with page h1, context chips, live server clock, and account dropdown.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserCheck, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../../../auth/AuthContext.jsx';
import { useTheme } from '../../../../context/ThemeContext.jsx';
import { getHomeRouteForRoles } from '../../../../auth/roles.js';
import { DashboardSwitcher } from '../../../../components/DashboardSwitcher.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { StatusPill } from '../common/StatusPill.jsx';

export function Header({ title = 'Security Overview', className = '' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`flex flex-col gap-3 py-3 border-b border-line/30 mb-4 ${className}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Page h1 */}
        <h1 className="font-display font-bold text-[clamp(24px,3.4vw,34px)] text-ink leading-[1.05] tracking-tight">
          {title}
        </h1>

        {/* Right Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <DashboardSwitcher />

          {/* Live Server Clock Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line text-[12px] font-mono text-muted select-none">
            <span className="w-2 h-2 rounded-full bg-good animate-pulse" />
            <span className="text-ink font-semibold tabular-nums">{timeStr || '09:30:00 AM'}</span>
            <span className="text-[10px] text-muted uppercase">IST</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-line text-[12px] font-semibold text-ink hover:border-accent hover:bg-surface2 transition-all cursor-pointer select-none"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-warn" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>

          {/* Enrollment Status Pill */}
          <div className="hidden sm:block">
            <StatusPill
              status={user?.face_enrolled ? 'verified' : 'warn'}
              label={user?.face_enrolled ? 'Face Enrolled' : 'Not Enrolled'}
            />
          </div>

          {/* User Account Menu with Full Name Display */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User Account Menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface2/60 hover:bg-surface2 transition-all border border-line/60 hover:border-accent"
            >
              <Avatar name={user?.name || 'Employee'} size={28} />
              <div className="text-left hidden sm:block min-w-0 max-w-[170px]">
                <div className="text-xs font-bold text-ink truncate leading-tight">
                  {user?.name || 'Employee'}
                </div>
                <div className="text-[10px] font-mono text-accent truncate leading-tight">
                  {user?.employee_id || 'ID'}
                </div>
              </div>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-tpl bg-card-bg backdrop-blur-xl border border-line shadow-2xl p-2 z-50"
                onClick={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-line/50">
                  <div className="text-xs font-bold text-ink truncate">{user?.name}</div>
                  <div className="text-[11px] text-muted truncate">{user?.email}</div>
                  <div className="text-[10px] font-mono text-accent mt-0.5">
                    {user?.employee_id} · {(user?.roles || []).join(', ')}
                  </div>
                </div>
                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => navigate(getHomeRouteForRoles(user?.roles))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-surface2 rounded-lg transition-colors text-left"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-muted" />
                    My Role Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/enroll')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-surface2 rounded-lg transition-colors text-left"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-muted" />
                    Face Enrollment
                  </button>
                </div>
                <div className="pt-1 border-t border-line/50">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-bad hover:bg-bad/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
