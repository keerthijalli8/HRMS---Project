
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import {
  IconBell,
  IconShield,
  IconPackage,
  IconUsers,
  IconCheck,
  IconX,
  IconLaptop,
  IconHeadphones,
  IconKey,
  IconChart,
} from '../shared/Icons';

// ============================================================
// REQUIRED IT ADMINISTRATION MODULES
// ============================================================

const PAGE_PERMISSIONS = {
  dashboard: null,
  accounts: 'User Profiles',
  access: 'Security',
  inventory: 'Assets',
  allocate: 'Assets',
  desk: 'Helpdesk',
  licences: 'Software',
  events: 'Security',
  reports: 'Reports',
};

const REMOVED_PAGES = [
  'network',
  'documents',
  'databaseStatus',
  'settings',
];

const TYPE_TARGETS = {
  security: 'events',
  license: 'licences',
  licence: 'licences',
  software: 'licences',
  request: 'accounts',
  account: 'accounts',
  user: 'accounts',
  asset: 'inventory',
  hardware: 'inventory',
  allocation: 'allocate',
  ticket: 'desk',
  helpdesk: 'desk',
  access: 'access',
  report: 'reports',
};

// ============================================================
// NOTIFICATION TARGET RESOLUTION
// ============================================================

function resolveNotificationTarget(notification) {
  const type = String(
    notification.type || ''
  ).toLowerCase();

  const target = notification.targetPage;

  const title = String(
    notification.title || ''
  ).toLowerCase();

  if (
    type === 'network' ||
    REMOVED_PAGES.includes(target)
  ) {
    return null;
  }

  // Role permissions merged into Access Management.

  if (target === 'permissions') {
    return 'access';
  }

  // Hardware / Software Management merged into
  // their respective modules.

  if (target === 'hardwareSoftware') {
    return type === 'software' ||
      type === 'license' ||
      type === 'licence'
      ? 'licences'
      : 'inventory';
  }

  // Hardware allocation requests.

  if (
    type === 'allocation' ||
    (
      type === 'request' &&
      /hardware allocation|asset allocation|device allocation/.test(title)
    )
  ) {
    return 'allocate';
  }

  if (
    type === 'request' &&
    /access request|permission request/.test(title)
  ) {
    return 'access';
  }

  if (
    Object.prototype.hasOwnProperty.call(
      PAGE_PERMISSIONS,
      target
    )
  ) {
    return target;
  }

  return TYPE_TARGETS[type] || null;
}

// ============================================================
// NOTIFICATION ICONS
// ============================================================

function getNotificationIcon(type) {
  switch (String(type || '').toLowerCase()) {
    case 'security':
      return <IconShield className="w-4 h-4 text-bad" />;

    case 'license':
    case 'licence':
    case 'software':
      return <IconPackage className="w-4 h-4 text-warn" />;

    case 'request':
    case 'user':
    case 'account':
      return <IconUsers className="w-4 h-4 text-accent" />;

    case 'asset':
    case 'hardware':
    case 'allocation':
      return <IconLaptop className="w-4 h-4 text-good" />;

    case 'ticket':
    case 'helpdesk':
      return <IconHeadphones className="w-4 h-4 text-warn" />;

    case 'access':
      return <IconKey className="w-4 h-4 text-accent" />;

    case 'report':
      return <IconChart className="w-4 h-4 text-accent" />;

    default:
      return <IconBell className="w-4 h-4 text-muted" />;
  }
}

// ============================================================
// NOTIFICATIONS MENU COMPONENT
// ============================================================

export function NotificationsMenu() {
  const {
    notifications = [],
    markAllNotificationsRead,
    markNotificationRead,
    dismissNotification,
    navigate,
    hasPermission,
    isAuthenticated,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // ==========================================================
  // FILTER NOTIFICATIONS BY ACTIVE MODULES AND PERMISSIONS
  // ==========================================================

  const visibleNotifications = (
    Array.isArray(notifications)
      ? notifications
      : []
  )
    .filter(notification => notification)
    .map(notification => ({
      ...notification,
      resolvedTarget: resolveNotificationTarget(notification),
    }))
    .filter(notification => {
      if (!isAuthenticated) return false;

      if (!notification.resolvedTarget) {
        return false;
      }

      const requiredPermission =
        PAGE_PERMISSIONS[notification.resolvedTarget];

      if (!requiredPermission) {
        return true;
      }

      return hasPermission(
        requiredPermission,
        'read'
      );
    });

  // ==========================================================
  // DYNAMIC NOTIFICATION COUNTS
  // ==========================================================

  const unreadCount = visibleNotifications.filter(
    notification => notification.unread
  ).length;

  const totalCount = visibleNotifications.length;

  // ==========================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK OR ESCAPE
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = event => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen]);

  // ==========================================================
  // CLOSE NOTIFICATIONS AFTER SIGN OUT
  // ==========================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
    }
  }, [isAuthenticated]);

  // ==========================================================
  // NOTIFICATION ACTIONS
  // ==========================================================

  const handleOpenNotification = notification => {
    const target = notification.resolvedTarget;

    if (!target || !isAuthenticated) return;

    const requiredPermission =
      PAGE_PERMISSIONS[target];

    if (
      requiredPermission &&
      !hasPermission(requiredPermission, 'read')
    ) {
      return;
    }

    // Individual read support will be connected
    // through StoreContext.

    if (
      notification.unread &&
      typeof markNotificationRead === 'function'
    ) {
      markNotificationRead(notification.id);
    }

    // Open specific helpdesk ticket when available.

    if (
      target === 'desk' &&
      notification.ticketId
    ) {
      navigate('desk', {
        ticketId: notification.ticketId,
      });
    } else {
      navigate(target);
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    if (!isAuthenticated || unreadCount === 0) {
      return;
    }

    markAllNotificationsRead();
  };

  const handleDismiss = notificationId => {
    if (!isAuthenticated) return;

    dismissNotification(notificationId);
  };

  // ==========================================================
  // COMPONENT RENDER
  // ==========================================================

  return (
    <div
      ref={menuRef}
      className="relative inline-block text-left"
    >

      {/* NOTIFICATION TRIGGER */}

      <button
        ref={triggerRef}
        type="button"
        id="notifications-button"
        data-testid="notifications-button"
        onClick={() =>
          setIsOpen(previous => !previous)
        }
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-controls={
          isOpen
            ? 'notifications-dropdown'
            : undefined
        }
        title={`Notifications (${unreadCount} unread)`}
        className="relative p-2 rounded-xl bg-surface2/50 hover:bg-surface2 border border-line/60 hover:border-accent/40 text-muted hover:text-ink transition-colors focus-visible:outline-accent cursor-pointer"
      >
        <IconBell className="w-4 h-4" />

        {/* DYNAMIC UNREAD COUNT */}

        {unreadCount > 0 && (
          <span
            data-testid="notification-unread-count"
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent2 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
          >
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}

      </button>

      {/* =====================================================
          NOTIFICATIONS DROPDOWN - MONSOON GLASS
      ====================================================== */}

      {isOpen && (
        <div
          id="notifications-dropdown"
          data-testid="notifications-dropdown"
          aria-label="IT Administration Notifications"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          }}
          className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-line p-3.5 z-50 backdrop-blur-2xl flex flex-col gap-3 shadow-2xl text-left animate-in zoom-in-95 duration-150"
        >

          {/* NOTIFICATION HEADER */}

          <div className="flex items-center justify-between gap-2 pb-2 border-b border-line/60">

            <div className="flex items-center gap-2 min-w-0">

              <span className="font-display font-bold text-[14px] text-ink">
                Notifications
              </span>

              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-accent2/20 text-accent2 border border-accent2/40 whitespace-nowrap">
                  {unreadCount} New
                </span>
              )}

            </div>

            <div className="flex items-center gap-2">

              {unreadCount > 0 && (
                <button
                  type="button"
                  data-testid="mark-all-notifications-read"
                  onClick={handleMarkAllRead}
                  title="Mark all notifications as read"
                  className="text-[11px] font-semibold text-accent hover:underline cursor-pointer whitespace-nowrap"
                >
                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close notifications"
                title="Close notifications"
                className="p-1 rounded-md text-muted hover:text-ink hover:bg-surface2 transition-colors cursor-pointer"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

          {/* NOTIFICATION SUMMARY */}

          {totalCount > 0 && (
            <div className="flex items-center justify-between text-[10.5px] text-muted">

              <span>
                {totalCount}{' '}
                {totalCount === 1
                  ? 'notification'
                  : 'notifications'}
              </span>

              {unreadCount === 0 && (
                <span className="flex items-center gap-1 text-good">

                  <IconCheck className="w-3 h-3" />

                  All caught up

                </span>
              )}

            </div>
          )}

          {/* =================================================
              NOTIFICATIONS LIST
          ================================================== */}

          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto">

            {totalCount === 0 ? (

              /* EMPTY STATE */

              <div className="flex flex-col items-center justify-center gap-2 py-7 px-3 text-center">

                <div className="w-12 h-12 rounded-full bg-surface2 border border-line/40 flex items-center justify-center">

                  <IconBell className="w-5 h-5 text-muted" />

                </div>

                <span className="text-[13px] font-semibold text-ink">

                  {isAuthenticated
                    ? 'No notifications'
                    : 'Sign in to view notifications'}

                </span>

                <p className="text-[11.5px] text-muted leading-relaxed">

                  {isAuthenticated
                    ? 'New IT administration updates will appear here.'
                    : 'An active administrator session is required.'}

                </p>

              </div>

            ) : (

              visibleNotifications.map(notification => (

                <div
                  key={notification.id}
                  className={`relative flex items-start gap-1 p-2.5 rounded-xl border transition-all ${
                    notification.unread
                      ? 'bg-surface2/80 border-accent/40 hover:bg-surface2'
                      : 'bg-surface2/20 border-line/30 hover:bg-surface2/50'
                  }`}
                >

                  {/* OPEN NOTIFICATION */}

                  <button
                    type="button"
                    onClick={() =>
                      handleOpenNotification(notification)
                    }
                    title={`Open ${notification.title}`}
                    className="flex flex-1 min-w-0 items-start gap-2.5 text-left cursor-pointer group"
                  >

                    {/* NOTIFICATION ICON */}

                    <div className="p-1.5 rounded-lg bg-surface border border-line/40 shrink-0 mt-0.5">

                      {getNotificationIcon(
                        notification.type
                      )}

                    </div>

                    {/* NOTIFICATION DETAILS */}

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center justify-between gap-1">

                        <div className="flex items-center gap-1.5 min-w-0">

                          {notification.unread && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-accent2 shrink-0"
                              aria-label="Unread notification"
                            />
                          )}

                          <span className="text-[12.5px] font-bold text-ink group-hover:text-accent transition-colors truncate">

                            {notification.title}

                          </span>

                        </div>

                        <span className="text-[10px] text-muted shrink-0">

                          {notification.time}

                        </span>

                      </div>

                      <p className="text-[11.5px] text-muted leading-snug line-clamp-2 mt-1">

                        {notification.message}

                      </p>

                      <span className="inline-block mt-1 text-[10.5px] font-semibold text-accent">

                        View Details →

                      </span>

                    </div>

                  </button>

                  {/* DISMISS INDIVIDUAL NOTIFICATION */}

                  <button
                    type="button"
                    onClick={() =>
                      handleDismiss(notification.id)
                    }
                    aria-label={`Dismiss ${notification.title}`}
                    title="Dismiss notification"
                    className="p-1 rounded-md text-muted hover:text-bad hover:bg-bad/10 transition-colors cursor-pointer shrink-0"
                  >

                    <IconX className="w-3.5 h-3.5" />

                  </button>

                </div>

              ))

            )}

          </div>

          {/* NOTIFICATION FOOTER */}

          {totalCount > 0 && (
            <div className="pt-2 border-t border-line/40 flex items-center justify-center">

              <span className="text-[10.5px] text-muted">

                IT Administration Activity Center

              </span>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
