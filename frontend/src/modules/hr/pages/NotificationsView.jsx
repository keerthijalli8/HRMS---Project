import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { SecondaryButton } from '../components/Buttons.jsx';
import {
  loadNotificationsForUser,
  markAsRead,
  markAllAsReadForUser,
  subscribeNotifications
} from '../services/notificationStore.js';

export const NotificationsView = ({ currentUser, onTriggerToast, setCurrentRoute }) => {
  const [notifications, setNotifications] = useState(() => loadNotificationsForUser(currentUser));

  useEffect(() => {
    const unsub = subscribeNotifications(() => {
      setNotifications(loadNotificationsForUser(currentUser));
    });
    return unsub;
  }, [currentUser]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAll = () => {
    markAllAsReadForUser(currentUser);
    onTriggerToast("Marked all alerts as read");
  };

  const handleItemClick = (notif) => {
    if (notif.unread) {
      markAsRead(notif.id);
    }
    if (notif.taskId && setCurrentRoute) {
      setCurrentRoute("tasks");
    } else if (notif.type === "leave" && setCurrentRoute) {
      setCurrentRoute("leave");
    } else if (notif.type === "approval" && setCurrentRoute) {
      setCurrentRoute("approvals");
    } else if ((notif.type === "announcement" || notif.type === "meeting") && setCurrentRoute) {
      setCurrentRoute("announcements");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card !p-3 flex items-center justify-between border border-line">
        <div>
          <div className="font-display font-bold text-ink text-[16px]">Notifications & Action Alerts</div>
          <div className="text-[12px] text-muted">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""} require your attention`
              : "All caught up! No unread action alerts."}
          </div>
        </div>
        {unreadCount > 0 && (
          <SecondaryButton icon="check" onClick={handleMarkAll}>
            Mark All as Read
          </SecondaryButton>
        )}
      </div>

      <div className="glass-card !p-0 overflow-hidden divide-y divide-dashed divide-line text-xs shadow-sm">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Icon name="bell" className="w-6 h-6 text-muted/50" />
              <span className="text-[13px] font-semibold text-ink">No notifications</span>
              <span className="text-xs text-muted">You will see task assignments, updates and reminders here.</span>
            </div>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-3.5 flex items-start gap-3 hover:bg-surface2/40 transition cursor-pointer ${
                notif.unread ? "bg-surface2/25" : ""
              }`}
            >
              <span className="p-2 rounded-lg bg-surface2 border border-line text-accent shrink-0">
                <Icon name={notif.icon || "bell"} className="w-4 h-4 text-accent" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink flex items-center gap-2">
                  <span className="truncate">{notif.title}</span>
                  {notif.unread && <span className="w-2 h-2 rounded-full bg-accent2 shrink-0"></span>}
                </div>
                <div className="text-muted text-[11px] mt-0.5 whitespace-pre-wrap">{notif.desc}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-muted font-data">{notif.time}</span>
                {notif.taskId && (
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-accent/10 border border-accent/20 text-accent font-semibold">
                    View Task →
                  </span>
                )}
                {notif.type === "leave" && (
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/25 text-teal-300 font-semibold">
                    View Leave →
                  </span>
                )}
                {notif.type === "approval" && (
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold">
                    Review Approval →
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
