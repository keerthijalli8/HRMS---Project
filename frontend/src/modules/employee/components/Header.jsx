// src/components/Header.jsx
// Main column header row with page h1, context chips, global search, punch control, notification bell, and account dropdown.

import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, Sliders, HelpCircle, LogOut, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { DashboardSwitcher } from '../../../components/DashboardSwitcher.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Avatar } from './Avatar.jsx';
import { PunchControl } from './PunchControl.jsx';
import { Drawer } from './Drawer.jsx';
import { INITIAL_EMPLOYEE } from '../data/employee.js';
import { filterDashboardModules } from '../config/navigation.js';

function ModuleSearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  const inputId = useId();
  const listboxId = useId();

  const trimmedQuery = searchQuery.trim();
  const hasQuery = trimmedQuery.length > 0;
  const results = useMemo(
    () => (hasQuery ? filterDashboardModules(trimmedQuery) : []),
    [hasQuery, trimmedQuery]
  );
  const showDropdown = isOpen && hasQuery;

  // Keep highlight index within current result bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Scroll keyboard-highlighted option into view smoothly
  useEffect(() => {
    if (!showDropdown) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, showDropdown]);

  // Close dropdown automatically after navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Keyboard shortcut (Ctrl+K / Cmd+K or "/" outside editable fields) focuses search bar
  useEffect(() => {
    const handleGlobalKey = (e) => {
      const isModK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      const tag = document.activeElement?.tagName;
      const isEditing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.activeElement?.isContentEditable;
      const isSlash = e.key === '/' && !isEditing;

      if (isModK || isSlash) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Debounce live-region result announcements so rapid typing doesn't spam screen readers
  useEffect(() => {
    if (!showDropdown) {
      setAnnouncement('');
      return undefined;
    }
    const timer = setTimeout(() => {
      setAnnouncement(
        results.length === 0
          ? `No modules matching ${trimmedQuery}`
          : `${results.length} dashboard ${results.length === 1 ? 'module' : 'modules'} available`
      );
    }, 180);
    return () => clearTimeout(timer);
  }, [showDropdown, results.length, trimmedQuery]);

  const selectModule = (mod) => {
    if (!mod) return;
    setSearchQuery('');
    setIsOpen(false);
    navigate(mod.to);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!hasQuery) return;
      e.preventDefault();
      if (!showDropdown) {
        setIsOpen(true);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (!hasQuery) return;
      e.preventDefault();
      if (!showDropdown) {
        setIsOpen(true);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      if (hasQuery && results.length > 0) {
        e.preventDefault();
        selectModule(results[activeIndex] || results[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showDropdown) {
        setIsOpen(false);
      } else if (searchQuery) {
        setSearchQuery('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const activeOptionId =
    showDropdown && results[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:w-48 lg:w-64 order-last sm:order-none"
    >
      <label htmlFor={inputId} className="sr-only">
        Search dashboard modules
      </label>

      <Search
        aria-hidden="true"
        className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        strokeWidth={1.8}
      />

      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        placeholder="Search modules..."
        autoComplete="off"
        value={searchQuery}
        onFocus={() => {
          if (searchQuery.trim()) setIsOpen(true);
        }}
        onClick={() => {
          if (searchQuery.trim()) setIsOpen(true);
        }}
        onChange={(e) => {
          const val = e.target.value;
          setSearchQuery(val);
          setIsOpen(val.trim().length > 0);
        }}
        onKeyDown={handleKeyDown}
        className="w-full pl-8 pr-12 py-1.5 rounded-full bg-surface2/60 border border-line text-[12px] text-ink placeholder:text-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus:border-accent transition-all"
      />

      {searchQuery ? (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setIsOpen(false);
            inputRef.current?.focus();
          }}
          aria-label="Clear search query"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[24px] min-w-[24px] flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X aria-hidden="true" className="w-3.5 h-3.5" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-surface2 border border-line/70 text-[10px] font-mono text-muted/80 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          Ctrl K
        </kbd>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {showDropdown && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-80 rounded-tpl bg-[#0a222b] border border-line shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-line/50 flex items-center justify-between text-[10.5px] font-mono text-muted">
            <span>Matching "{trimmedQuery}"</span>
            <span>{results.length} found</span>
          </div>

          {results.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Dashboard modules"
              className="max-h-[min(340px,62vh)] overflow-y-auto p-1.5 space-y-0.5"
            >
              {results.map((mod, idx) => {
                const Icon = mod.icon;
                const isSelected = idx === activeIndex;
                const isCurrentRoute = mod.to === '/employee/dashboard' ? pathname === '/employee/dashboard' : pathname.startsWith(mod.to);

                return (
                  <li
                    key={mod.to}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    id={`${listboxId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectModule(mod)}
                    className={`min-h-[42px] px-2.5 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-surface2 border border-accent/50 text-ink'
                        : 'border border-transparent text-ink hover:bg-surface2/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-accent/15 border-accent/50 text-accent'
                            : 'bg-surface2 border-line/60 text-muted'
                        }`}
                      >
                        <Icon aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12.5px] font-semibold truncate">{mod.label}</span>
                          {isCurrentRoute && (
                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full bg-accent/15 text-accent border border-accent/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted truncate">{mod.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9.5px] font-mono uppercase tracking-wider text-muted/80 px-1.5 py-0.5 rounded bg-surface2/80 border border-line/50">
                        {mod.group}
                      </span>
                      <ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-muted">
                No module matches <span className="text-ink font-semibold">"{trimmedQuery}"</span>
              </p>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQuery('');
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="text-[11px] text-accent hover:underline font-medium min-h-[28px] px-2"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Header({ title = 'Overview', className = '' }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const latestNotifications = notifications.slice(0, 8);

  return (
    <header className={`flex flex-col gap-3 py-3 border-b border-line/30 mb-4 ${className}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Page h1 */}
        <h1 className="font-display font-bold text-[clamp(24px,3.4vw,34px)] text-ink leading-[1.05] tracking-tight">
          {title}
        </h1>

        {/* Right Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <DashboardSwitcher />

          {/* Global Dashboard Module Search */}
          <ModuleSearchBar />

          {/* Punch Control (Section 8) */}
          <PunchControl compact />

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setNotifDrawerOpen(true)}
            aria-label={`Open notifications (${unreadCount} unread)`}
            className="relative w-9 h-9 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:border-accent/60 transition-colors"
          >
            <Bell className="w-4 h-4" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent2 text-white font-bold text-[9px] flex items-center justify-center shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Account Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User Account Menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-surface2 transition-colors border border-transparent hover:border-line"
            >
              <Avatar name={user?.name || INITIAL_EMPLOYEE.name} src={user?.avatarUrl} size={32} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-tpl bg-[#0a222b] border border-line shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-line/50">
                  <p className="text-[13px] font-bold text-ink truncate">{user?.name || INITIAL_EMPLOYEE.name}</p>
                  <p className="text-[11px] text-muted truncate">{user?.email || INITIAL_EMPLOYEE.workEmail}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => navigate('/employee/profile')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-muted hover:text-ink hover:bg-surface2 rounded-lg transition-colors text-left"
                  >
                    <User className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => navigate('/employee/settings')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-muted hover:text-ink hover:bg-surface2 rounded-lg transition-colors text-left"
                  >
                    <Sliders className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => navigate('/employee/support')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-muted hover:text-ink hover:bg-surface2 rounded-lg transition-colors text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>Help & Support</span>
                  </button>
                </div>
                <div className="border-t border-line/50 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-bad hover:bg-bad/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Drawer (Section 16: 8 latest items) */}
      <Drawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        title={`Notifications (${unreadCount} unread)`}
        footer={
          <div className="w-full flex justify-between items-center text-[12px]">
            <button
              onClick={() => {
                setNotifDrawerOpen(false);
                navigate('/employee/notifications');
              }}
              className="text-accent hover:underline font-semibold"
            >
              View all notifications →
            </button>
            <button
              onClick={() => setNotifDrawerOpen(false)}
              className="text-muted hover:text-ink"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {latestNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.link) {
                  setNotifDrawerOpen(false);
                  navigate(n.link);
                }
              }}
              className={`p-3 rounded-tpl border transition-all cursor-pointer ${
                n.isRead
                  ? 'bg-surface2/30 border-line/40 text-muted'
                  : 'bg-surface2/70 border-accent2/50 text-ink shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[13px] leading-tight">
                  {n.title}
                </span>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-accent2 shrink-0 mt-1" />
                )}
              </div>
              <p className="text-[12px] text-muted mt-1 leading-snug line-clamp-2">
                {n.detail}
              </p>
              <div className="flex items-center justify-between mt-2 text-[10.5px] text-muted/80">
                <span className="uppercase tracking-wider font-mono">{n.category}</span>
                <span>{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </header>
  );
}

export default Header;

