import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';
import Avatar from './Avatar';
import AccountMenu from './AccountMenu';
import PunchControl from './attendance/PunchControl.jsx';
import GlobalSearchDropdown from './GlobalSearchDropdown';
import { DashboardSwitcher } from '../../../components/DashboardSwitcher.jsx';

export default function Header({
  pageTitle,
  searchQuery,
  onSearchChange,
  pendingCount = 7,
  onOpenExportModal,
  onToggleNotifications,
  isNotificationsOpen,
  user,
  onNavigate,
  onOpenShortcuts,
  onSignOut,
  employees = [],
  onSelectEmployee,
  pendingRequests = [],
}) {
  // Account menu state
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const avatarBtnRef = useRef(null);

  // Global search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut to focus search input
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setIsSearchOpen(Boolean(searchQuery?.trim()));
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  return (
    <header className="flex flex-col gap-2.5 pb-3 border-b border-line/40 pt-1">
      {/* Main Title & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 shrink">
          {/* Page H1 */}
          <h1
            className="font-display font-bold text-ink tracking-tight leading-tight truncate sm:overflow-visible sm:whitespace-normal"
            style={{ fontSize: 'clamp(20px, 2.6vw, 32px)' }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Search, Punch Control, Notifications & Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap justify-between sm:justify-end">
          {/* Global Search Input with Live Dropdown & Keyboard Shortcut */}
          <div className="relative flex-1 sm:flex-initial w-auto sm:w-56 md:w-64 lg:w-72 xl:w-80 min-w-[120px]" ref={searchContainerRef}>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery?.trim()) setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search modules..."
              aria-label="Global search input"
              className="w-full bg-surface2 border border-line rounded-full py-1.5 pl-8 pr-12 text-[12px] text-ink placeholder-muted/70 focus:outline-none focus:border-accent transition-colors"
            />

            {/* Right inside input: Clear (X) or Ctrl K hint */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 rounded-full hover:bg-surface text-muted hover:text-ink transition-colors cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search query"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9.5px] font-mono text-muted/60 bg-surface/60 border border-line rounded select-none">
                  Ctrl K
                </kbd>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            <GlobalSearchDropdown
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              employees={employees}
              onSelectEmployee={onSelectEmployee}
              onNavigate={onNavigate}
              pendingRequests={pendingRequests}
            />
          </div>

          {/* Right Action Cluster: Switcher, Punch Control, Notifications & Avatar - locked together */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap">
            <DashboardSwitcher />

            {/* Header Punch Control (All pages, left of the bell) */}
            <PunchControl
              onNavigateToMine={() => onNavigate?.('/manager/attendance?view=mine')}
            />

            {/* Notification Button with Violet Dot */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={onToggleNotifications}
                aria-label={`Notifications, ${pendingCount} pending`}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors relative active:scale-95 ${
                  isNotificationsOpen
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-surface2 border-line text-muted hover:text-ink hover:border-accent'
                }`}
              >
                <Bell size={15} />
                {pendingCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9.5px] font-bold text-white flex items-center justify-center shadow-sm select-none"
                    style={{ backgroundColor: 'var(--accent2)' }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Manager 34px Avatar Button triggering AccountMenu */}
            <div className="relative shrink-0">
              <button
                ref={avatarBtnRef}
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent shrink-0"
              >
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name || 'Lokesh Kumar'}
                    className="w-[34px] h-[34px] rounded-full object-cover ring-1 ring-accent shrink-0"
                  />
                ) : (
                  <div
                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-display font-bold text-white text-[12px] shadow-sm select-none shrink-0"
                    style={{ backgroundColor: '#548a28' }}
                    aria-label={user?.name || 'Lokesh Kumar'}
                  >
                    LK
                  </div>
                )}
              </button>

              <AccountMenu
                isOpen={isAccountMenuOpen}
                onClose={() => setIsAccountMenuOpen(false)}
                triggerRef={avatarBtnRef}
                user={user}
                onNavigate={onNavigate}
                onOpenShortcuts={onOpenShortcuts}
                onOpenExportModal={onOpenExportModal}
                onSignOut={onSignOut}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
