import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../../components/BrandLogo.jsx';
import {
  Home,
  Bell,
  Clock,
  Calendar,
  Users,
  CalendarDays,
  FileText,
  Target,
  CheckSquare,
  Video,
  Megaphone,
  BarChart3,
  User,
  Settings,
  LogOut,
  FolderKanban,
  Receipt,
} from 'lucide-react';
import Avatar from './Avatar';

const NAV_GROUPS = [
  {
    group: 'MAIN',
    items: [
      { id: 'overview', label: 'Overview', route: '/manager/dashboard', icon: Home },
      { id: 'notifications', label: 'Notifications', route: '/manager/notifications', icon: Bell, badgeType: 'violet', badgeKey: 'unreadNotifs' },
    ],
  },
  {
    group: 'PEOPLE',
    items: [
      { id: 'attendance', label: 'Attendance', route: '/manager/attendance', icon: Clock },
      { id: 'leave', label: 'Leave Requests', route: '/manager/leave', icon: Calendar, badgeType: 'violet', badgeKey: 'leavePending' },
      { id: 'team', label: 'Teams', route: '/manager/team', icon: Users },
      { id: 'shifts', label: 'Shifts', route: '/manager/shifts', icon: CalendarDays },
    ],
  },
  {
    group: 'WORK',
    items: [
      { id: 'projects', label: 'Projects', route: '/manager/projects', icon: FolderKanban },
      { id: 'tasks', label: 'Tasks & Workload', route: '/manager/tasks', icon: CheckSquare },
      { id: 'performance', label: 'Performance', route: '/manager/performance', icon: Target },
      { id: 'meetings', label: 'Meetings', route: '/manager/meetings', icon: Video },
      { id: 'announcements', label: 'Announcements', route: '/manager/announcements', icon: Megaphone },
    ],
  },
  {
    group: 'PERSONAL (AS EMPLOYEE)',
    items: [
      { id: 'mytasks', label: 'My Tasks', route: '/manager/mytasks', icon: CheckSquare },
      { id: 'mypayslips', label: 'My Payslips', route: '/manager/payslips', icon: Receipt },
      { id: 'myleave', label: 'My Leave & Attendance', route: '/manager/myleave', icon: Calendar },
    ],
  },
  {
    group: 'REPORTS',
    items: [
      { id: 'reports', label: 'Reports', route: '/manager/reports', icon: BarChart3 },
    ],
  },
  {
    group: 'ACCOUNT',
    items: [
      { id: 'profile', label: 'Profile', route: '/manager/profile', icon: User },
      { id: 'settings', label: 'Settings', route: '/manager/settings', icon: Settings },
    ],
  },
];

export default function Rail({
  onNavigate,
  onOpenUserDetail,
  pendingCounts = { leavePending: 3, unreadNotifs: 7 },
  managerProfile,
  onSignOut,
}) {
  const navigate = useNavigate();
  return (
    <aside
      className="w-full md:w-[236px] md:sticky md:top-0 md:h-screen flex flex-col justify-between py-2 md:py-4 px-3 md:px-0 z-30 shrink-0"
      aria-label="Sidebar Navigation"
    >
      {/* Top Section: Brand + Scrollable Nav */}
      <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
        {/* Brand Header: Technomold Corporate Logo (Top Left Corner) */}
        <div className="flex items-center px-3 py-2 shrink-0 select-none">
          <BrandLogo
            className="h-8 md:h-9 w-auto max-w-[200px] object-contain block drop-shadow-sm"
          />
        </div>

        {/* Scrollable Navigation List */}
        <nav
          className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto px-1 pb-2 md:pb-3 flex-1 pr-1 custom-scrollbar"
          aria-label="Main Menu"
        >
          {NAV_GROUPS.map((grp) => (
            <div key={grp.group} className="flex flex-col gap-1 shrink-0 md:shrink">
              <span className="px-3 text-[11px] font-bold tracking-wider uppercase text-muted/70 select-none">
                {grp.group}
              </span>

              <div className="flex md:flex-col gap-1">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey] : null;

                  return (
                    <NavLink
                      key={item.id}
                      to={item.route}
                      end={item.route === '/manager/dashboard'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 select-none text-left shrink-0 ${
                          isActive
                            ? 'text-ink bg-surface2 border border-line shadow-sm'
                            : 'text-muted hover:text-ink hover:bg-surface2/60 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            className={`shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`}
                          />
                          <span className="truncate flex-1">{item.label}</span>

                          {/* Violet Count Badge */}
                          {badgeCount !== null && badgeCount > 0 && (
                            <span
                              className="ml-auto px-2 py-0.5 text-[10.5px] font-bold rounded-full text-white shrink-0 tabular-nums shadow-sm"
                              style={{ backgroundColor: 'var(--accent2)' }}
                              title={`${badgeCount} unread / pending`}
                            >
                              {badgeCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Pinned Bottom User Pill & Sign Out Pill */}
      <div className="pt-3 pb-1 px-2 border-t border-line/40 flex flex-col gap-2 shrink-0">
        {/* Profile Pill Button */}
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate('/manager/profile');
            else if (onOpenUserDetail) onOpenUserDetail();
            else navigate('/manager/profile');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-full border border-line/80 hover:border-accent/60 bg-surface/30 hover:bg-surface2/60 transition-all select-none text-left group cursor-pointer shadow-sm"
          title="Open Profile"
        >
          {managerProfile?.photoUrl ? (
            <img
              src={managerProfile.photoUrl}
              alt={managerProfile.name || 'Lokesh Kumar'}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-accent shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white text-[13px] shrink-0 select-none shadow-sm"
              style={{ backgroundColor: '#548a28' }}
              aria-label={managerProfile?.name || 'Lokesh Kumar'}
            >
              LK
            </div>
          )}
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-display font-bold text-[13.5px] text-ink truncate group-hover:text-accent transition-colors">
              {managerProfile?.name || 'Lokesh Kumar'}
            </span>
            <span className="text-[11.5px] text-muted truncate mt-0.5 font-normal">
              {managerProfile?.designation || 'Frontend Developer'}
            </span>
          </div>
        </button>

        {/* Sign Out Pill Button */}
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full border border-line/80 hover:border-bad/60 hover:text-bad bg-surface/30 hover:bg-bad/10 text-muted transition-all select-none text-[13px] font-medium cursor-pointer shadow-sm"
          title="Sign out"
        >
          <LogOut size={14} strokeWidth={1.8} className="shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
