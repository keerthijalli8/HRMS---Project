// src/pages/Notifications.jsx
// Full notification feed grouped by Today, Yesterday, and Earlier this week with actions and filters.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Banknote,
  FileCheck2,
  CheckSquare,
  Award,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { Tag } from '../components/Tag.jsx';
import { Switch } from '../components/Switch.jsx';

const NOTIF_ICONS = {
  'HR announcement': Sparkles,
  'Payroll': Banknote,
  'Approval update': CheckCheck,
  'Reminders': Clock,
  'Documents': FileCheck2,
  'Help & Support': HelpCircle
};

export function Notifications() {
  const {
    notifications,
    markAsRead,
    toggleReadStatus,
    markAllAsRead,
    dismissNotification,
    restoreNotification,
    acknowledgeAnnouncement
  } = useNotifications();

  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const categories = ['All', 'HR announcement', 'Approval update', 'Reminders'];

  const filteredNotifs = notifications.filter(n => {
    if (activeCategory !== 'All' && n.category !== activeCategory) return false;
    if (unreadOnly && n.isRead) return false;
    return true;
  });

  // Group notifications
  const grouped = {
    'Today': filteredNotifs.filter(n => n.group === 'Today'),
    'Yesterday': filteredNotifs.filter(n => n.group === 'Yesterday'),
    'Earlier this week': filteredNotifs.filter(n => n.group === 'Earlier this week')
  };

  const handleDismiss = (id) => {
    const item = dismissNotification(id);
    showToast('Notification dismissed', {
      undoLabel: 'Undo',
      onUndo: () => restoreNotification(item)
    });
  };

  const handleAcknowledge = (id) => {
    acknowledgeAnnouncement(id);
    showToast('Announcement policy acknowledged');
  };

  return (
    <div className="space-y-6">
      {/* 1. CONTROLS BAR */}
      <div className="flex items-center justify-between p-4 rounded-tpl bg-surface2/50 border border-line flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === cat
                  ? 'bg-accent text-on-accent border-accent font-semibold'
                  : 'border-line text-muted hover:text-ink bg-surface2/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Switch
            label="Unread only"
            checked={unreadOnly}
            onChange={setUnreadOnly}
          />

          <SecondaryButton size="sm" onClick={() => {
            markAllAsRead();
            showToast('All notifications marked as read');
          }}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </SecondaryButton>
        </div>
      </div>

      {/* 2. GROUPED NOTIFICATION CARDS (Section 16) */}
      {Object.entries(grouped).map(([groupTitle, items]) => {
        if (items.length === 0) return null;

        return (
          <div key={groupTitle} className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted font-mono px-1">
              {groupTitle}
            </h3>

            <div className="space-y-2.5">
              {items.map(notif => {
                const Icon = NOTIF_ICONS[notif.category] || Bell;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.link) navigate(notif.link);
                    }}
                    className={`p-4 rounded-tpl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      notif.isRead
                        ? 'bg-surface2/30 border-line/50 hover:bg-surface2/50 text-muted'
                        : 'bg-surface2/80 border-accent2/60 hover:border-accent text-ink shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-tpl flex items-center justify-center shrink-0 border border-line/60 ${
                        notif.isRead ? 'bg-surface2 text-muted' : 'bg-accent2/15 text-accent2'
                      }`}>
                        <Icon className="w-4 h-4" strokeWidth={1.8} />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[13px] font-semibold leading-snug ${notif.isRead ? 'text-muted' : 'text-ink'}`}>
                            {notif.title}
                          </span>
                          <Tag color="accent">{notif.category}</Tag>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-accent2 shrink-0" title="Unread" />
                          )}
                        </div>

                        <p className="text-xs text-muted leading-relaxed line-clamp-2">
                          {notif.detail}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted font-mono">
                          <span>{notif.time}</span>
                          {notif.requiresAck && (
                            <span className="text-warn font-semibold">
                              {notif.acknowledged ? '✓ Acknowledged' : 'Action required: Acknowledge notice'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on hover/focus */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 shrink-0 pt-0.5"
                    >
                      {notif.requiresAck && !notif.acknowledged && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(notif.id)}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-on-accent hover:opacity-90"
                        >
                          Acknowledge
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleReadStatus(notif.id)}
                        className="text-xs text-muted hover:text-ink px-2 py-1 rounded hover:bg-surface2"
                        title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {notif.isRead ? 'Mark unread' : 'Mark read'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDismiss(notif.id)}
                        className="text-muted hover:text-bad p-1 rounded hover:bg-bad/10"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredNotifs.length === 0 && (
        <Card>
          <div className="py-12 text-center text-muted text-sm space-y-1">
            <p className="font-semibold text-ink">You are all caught up!</p>
            <p className="text-xs">No notifications match your current filter selection.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Notifications;

