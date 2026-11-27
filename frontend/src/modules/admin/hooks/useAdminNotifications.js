import { useCallback, useEffect, useState } from "react";
import {
  getAdminNotifications, notificationChangeEvent, updateAdminNotificationState,
} from "../services/adminNotifications";

const DATA_EVENTS = [
  "storage",
  "hrms-announcements-updated",
  "hrms-employees-updated",
  "hrms-attendance-updated",
  "hrms-documents-updated",
  "hrms-leave-requests-updated",
  "hrms-audit-log-updated",
];

function getSnapshot() {
  try {
    return { notifications: getAdminNotifications(), error: "" };
  } catch (error) {
    console.error("Unable to load admin notifications.", error);
    return { notifications: [], error: "Notifications could not be loaded from browser storage." };
  }
}

export default function useAdminNotifications() {
  const [snapshot, setSnapshot] = useState(getSnapshot);

  const refresh = useCallback(() => setSnapshot(getSnapshot()), []);
  const saveState = (updates) => {
    if (!updateAdminNotificationState(updates)) {
      setSnapshot((current) => ({
        ...current,
        error: "Notification changes could not be saved to browser storage.",
      }));
      return false;
    }
    return true;
  };

  useEffect(() => {
    const changeEvent = notificationChangeEvent();
    window.addEventListener(changeEvent, refresh);
    DATA_EVENTS.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => {
      window.removeEventListener(changeEvent, refresh);
      DATA_EVENTS.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, [refresh]);

  const setRead = (notification, isRead) => {
    saveState({
      [notification.id]: { readAt: isRead ? new Date().toISOString() : "", dismissedAt: "" },
    });
  };
  const markAllRead = () => saveState(Object.fromEntries(
    snapshot.notifications.map((notification) => [
      notification.id,
      { readAt: new Date().toISOString(), dismissedAt: "" },
    ]),
  ));
  const dismiss = (notification) => saveState({
    [notification.id]: { readAt: notification.readAt, dismissedAt: new Date().toISOString() },
  });

  return {
    ...snapshot,
    unreadCount: snapshot.notifications.filter((notification) => !notification.isRead).length,
    setRead,
    markAllRead,
    dismiss,
  };
}
