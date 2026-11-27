// src/context/NotificationContext.jsx
// Central notification state keeping rail badges, bell count, and notifications page synchronized.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_NOTIFICATIONS, INITIAL_ANNOUNCEMENTS } from '../data/employee.js';

const NotificationContext = createContext(null);
const STORAGE_NOTIFS_KEY = 'hrms_emp_notifications';
const STORAGE_ANNS_KEY = 'hrms_emp_announcements';

function load(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => load(STORAGE_NOTIFS_KEY, INITIAL_NOTIFICATIONS));
  const [announcements, setAnnouncements] = useState(() => load(STORAGE_ANNS_KEY, INITIAL_ANNOUNCEMENTS));

  useEffect(() => {
    localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ANNS_KEY, JSON.stringify(announcements));
  }, [announcements]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const toggleReadStatus = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    return target; // For undo restore
  }, [notifications]);

  const restoreNotification = useCallback((item) => {
    if (!item) return;
    setNotifications(prev => [item, ...prev]);
  }, []);

  const acknowledgeAnnouncement = useCallback((id) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true, isRead: true } : n));
  }, []);

  const markAnnouncementRead = useCallback((id) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        announcements,
        unreadCount,
        markAsRead,
        toggleReadStatus,
        markAllAsRead,
        dismissNotification,
        restoreNotification,
        acknowledgeAnnouncement,
        markAnnouncementRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;

