import React, { useState, useEffect } from 'react';
import { navItems, COMPANY_CONFIG } from '../data/mockData.js';
import { Icon } from './Icon.jsx';
import { HeaderSearch } from './HeaderSearch.jsx';
import { ProfileAvatar } from './ProfileAvatar.jsx';
import { ProfilePanel } from './ProfilePanel.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { getUnreadCountForUser, subscribeNotifications } from '../services/notificationStore.js';
import { DashboardSwitcher } from '../../../components/DashboardSwitcher.jsx';

// Helper to format milliseconds into HH:MM:SS (worked time)
function formatDuration(ms) {
  const totalSecs = Math.floor((ms || 0) / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

// Helper to format live break milliseconds into 00:00 or 00:00:00
function formatLiveBreak(ms) {
  const totalSecs = Math.floor((ms || 0) / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export const Header = ({
  currentRoute,
  currentUser: propUser,
  onNavigate,
  onLogout,
  onTriggerToast
}) => {
  const profileCtx = useProfile();
  const activeUser = profileCtx?.profile || propUser;

  const {
    state,
    breakMs,
    workedMs,
    checkInFormatted,
    checkOutFormatted,
    hasCheckedOutToday,
    checkIn,
    startBreak,
    endBreak,
    checkOut
  } = useAttendance();

  const formattedBreak = formatLiveBreak(breakMs);
  const formattedWorked = formatDuration(workedMs);

  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCountForUser(activeUser));

  useEffect(() => {
    const unsub = subscribeNotifications(() => {
      setUnreadCount(getUnreadCountForUser(activeUser));
    });
    return unsub;
  }, [activeUser]);

  const activeItem = navItems.find(n =>
    n.id === currentRoute ||
    (n.id === "dashboard" && currentRoute === "overview") ||
    (n.id === "my-tasks" && currentRoute === "tasks") ||
    (n.id === "shifts-roster" && currentRoute === "shifts") ||
    (n.id === "hr-settings" && currentRoute === "settings") ||
    (n.id === "audit-logs" && currentRoute === "audit") ||
    (n.id === "benefits-allowances" && (currentRoute === "benefits" || currentRoute === "bonus"))
  );

  const pageTitle =
    currentRoute === "my-profile" ? "My Profile" :
    currentRoute === "account-settings" ? "Account Settings" :
    (currentRoute === "benefits" || currentRoute === "benefits-allowances" || currentRoute === "bonus") ? "Benefits & Allowances" :
    activeItem?.label || "Dashboard";

  // Attendance Handlers with Toasts
  const handleCheckInClick = async () => {
    const res = await checkIn({ mode: 'office' });
    if (res?.ok) {
      onTriggerToast?.('✅ Checked in successfully!');
    } else if (res?.error) {
      onTriggerToast?.(res.error);
    }
  };

  const handleBreakToggleClick = async () => {
    if (state === 'working') {
      const res = await startBreak();
      if (res?.ok) onTriggerToast?.('☕ Break started. Timer running...');
    } else if (state === 'on_break') {
      const res = await endBreak();
      if (res?.ok) onTriggerToast?.('💼 Break ended. Back to work!');
    }
  };

  const handleCheckOutClick = async () => {
    const res = await checkOut();
    if (res?.ok) {
      onTriggerToast?.(`👋 Checked out for today! Total Break: ${formattedBreak}`);
    } else if (res?.error) {
      onTriggerToast?.(res.error);
    }
  };

  // Render Attendance Controls: [Check-In Live Time] -> [Break] -> [Check Out / Checked Out] (Without Reset button)
  const renderAttendanceControls = () => (
    <div className="flex items-center gap-2">
      {hasCheckedOutToday ? (
        <div
          title={`Checked out at ${checkOutFormatted} • Total Break: ${formattedBreak}`}
          className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 select-none cursor-not-allowed"
        >
          <Icon name="check" className="w-3.5 h-3.5" />
          <span>Checked Out ({checkOutFormatted})</span>
        </div>
      ) : state === 'not_checked_in' ? (
        <button
          type="button"
          onClick={handleCheckInClick}
          className="px-3.5 py-1.5 rounded-full bg-surface2/80 border border-accent/60 text-accent hover:bg-accent hover:text-on-accent text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Icon name="clock" className="w-3.5 h-3.5" />
          <span>Check In</span>
        </button>
      ) : (
        <>
          {/* 1. Check-In Live Time & Worked Duration */}
          <div
            title={`Checked in at ${checkInFormatted}`}
            className="px-3 py-1.5 rounded-full bg-surface2/80 border border-line text-xs font-semibold flex items-center gap-1.5 text-ink select-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-muted text-[11px]">In: {checkInFormatted}</span>
            <span className="font-mono font-bold text-accent">{formattedWorked}</span>
          </div>

          {/* 2. Break Button */}
          <button
            type="button"
            onClick={handleBreakToggleClick}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              state === 'on_break'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-surface2/80 border-line text-ink hover:border-line'
            }`}
          >
            <Icon name="coffee" className="w-3.5 h-3.5 text-amber-400" />
            <span>{state === 'on_break' ? 'End Break' : 'Break'}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-amber-300">
              {formattedBreak}
            </span>
          </button>

          {/* 3. Check Out Button (Medium Red / Rose Theme) */}
          <button
            type="button"
            disabled={state === 'on_break'}
            onClick={handleCheckOutClick}
            title={state === 'on_break' ? 'End your break before checking out' : 'Complete shift & Check Out'}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
              state === 'on_break'
                ? 'bg-surface2/40 border border-line text-muted opacity-50 cursor-not-allowed'
                : 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500 hover:text-white cursor-pointer'
            }`}
          >
            <Icon name="log-out" className="w-3.5 h-3.5" />
            <span>Check Out</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <header className="glass-card !px-4 !py-2.5 border border-line/80 rounded-2xl z-30 relative w-full box-border min-w-0 overflow-visible">

      {/* ================= DESKTOP LAYOUT (>= 640px) ================= */}
      <div className="hidden sm:flex items-center justify-between gap-3 w-full min-w-0">
        
        {/* LEFT: Breadcrumb + Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="text-muted hover:text-accent font-semibold tracking-wide uppercase transition cursor-pointer"
            >
              {COMPANY_CONFIG?.branch || "HRMS HYDERABAD"}
            </button>
            <span className="text-muted/50">/</span>
            <span className="font-display font-bold text-ink text-sm truncate max-w-[160px]">
              {pageTitle}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-line/70 shrink-0 hidden lg:block" />

          <div className="flex-1 max-w-[380px] min-w-[180px]">
            <HeaderSearch onNavigate={onNavigate} />
          </div>
        </div>

        {/* RIGHT: Live Time -> Break -> Check-Out + Switcher + Notifications + Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {renderAttendanceControls()}

          <DashboardSwitcher />

          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            className="w-10 h-10 rounded-xl bg-surface2/80 border border-line text-muted hover:text-ink hover:border-accent/60 relative transition flex items-center justify-center cursor-pointer shrink-0"
            title={`Notifications (${unreadCount} unread)`}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Icon name="bell" className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-accent text-on-accent text-[10px] font-bold font-data rounded-full flex items-center justify-center border-2 border-surface shadow-sm select-none pointer-events-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <ProfileAvatar
            profile={activeUser}
            onClick={() => setProfilePanelOpen(prev => !prev)}
            isOpen={profilePanelOpen}
          />
        </div>
      </div>

      {/* ================= MOBILE LAYOUT (< 640px) ================= */}
      <div className="flex sm:hidden flex-col gap-2.5 w-full min-w-0">
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <div className="text-left min-w-0 truncate">
            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block leading-none">
              HRMS HYDERABAD
            </span>
            <h1 className="font-display font-bold text-ink text-base leading-tight truncate mt-0.5">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <HeaderSearch onNavigate={onNavigate} isMobile={true} />

            <button
              type="button"
              onClick={() => onNavigate("notifications")}
              className="w-10 h-10 rounded-xl bg-surface2 border border-line text-muted hover:text-ink relative transition flex items-center justify-center cursor-pointer shrink-0"
              title={`Notifications (${unreadCount} unread)`}
            >
              <Icon name="bell" className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-accent text-on-accent text-[10px] font-bold font-data rounded-full flex items-center justify-center border-2 border-surface">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <ProfileAvatar
              profile={activeUser}
              onClick={() => setProfilePanelOpen(prev => !prev)}
              isOpen={profilePanelOpen}
            />
          </div>
        </div>

        <div className="flex items-center justify-end w-full min-w-0 gap-2 pt-2 border-t border-line/40">
          {renderAttendanceControls()}
        </div>
      </div>

      {/* Profile Panel Drawer */}
      <ProfilePanel
        isOpen={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        onLogout={onLogout}
        onTriggerToast={triggerToastWrapper(onTriggerToast)}
        onNavigate={onNavigate}
      />

    </header>
  );
};

function triggerToastWrapper(fn) {
  return typeof fn === 'function' ? fn : () => {};
}