/**
 * Central Notifications Store for HRMS India
 * Supports real-time task alerts, due-date reminders, completions, and general HR alerts.
 * Persisted in localStorage (hrms_notifications_v1).
 */

const STORAGE_KEY = "hrms_notifications_v1";
const EVENT_NAME = "hrms_notifications_updated";

const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-101",
    icon: "alert-triangle",
    title: "Passport Expiring Soon: EMP-1102 (Rohan Varma)",
    desc: "Expires in 28 days. Prompt employee for renewal submission.",
    time: "1 hr ago",
    timestamp: Date.now() - 3600000,
    unread: true,
    targetEmployeeId: "all",
    type: "system"
  },
  {
    id: "NOTIF-102",
    icon: "dollar-sign",
    title: "October TDS Reconciliation Ready for Review",
    desc: "Finance has finalized tax deductions for 12 employees.",
    time: "3 hrs ago",
    timestamp: Date.now() - 3 * 3600000,
    unread: true,
    targetEmployeeId: "all",
    type: "payroll"
  },
  {
    id: "NOTIF-103",
    icon: "calendar",
    title: "Medical Leave Submitted by Anita Desai",
    desc: "Requires HR approval before biometric cycle closes.",
    time: "4 hrs ago",
    timestamp: Date.now() - 4 * 3600000,
    unread: true,
    targetEmployeeId: "all",
    type: "leave"
  },
  {
    id: "NOTIF-104",
    icon: "check-square",
    title: "New Task: Q3 Indian Payroll Compliance Audit",
    desc: "Assigned by Meera Reddy (HR Manager). Due on 12 Nov 2026.",
    time: "5 hrs ago",
    timestamp: Date.now() - 5 * 3600000,
    unread: true,
    targetEmployeeId: "EMP-1088",
    taskId: "TSK-1001",
    type: "task"
  },
  {
    id: "NOTIF-105",
    icon: "alert-triangle",
    title: "Overdue Task Alert: Gratuity Valuation Report",
    desc: "Task was due on 08 Nov 2026. Action required immediately.",
    time: "1 day ago",
    timestamp: Date.now() - 86400000,
    unread: true,
    targetEmployeeId: "EMP-1088",
    taskId: "TSK-1004",
    type: "task"
  },
  {
    id: "NOTIF-106",
    icon: "check-square",
    title: "New Task: Kubernetes Cluster Node Migration",
    desc: "Assigned by Aarav Sharma (Engineering Manager). Due on 14 Nov 2026.",
    time: "1 day ago",
    timestamp: Date.now() - 90000000,
    unread: true,
    targetEmployeeId: "EMP-1145",
    taskId: "TSK-1002",
    type: "task"
  }
];

export function loadAllNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_NOTIFICATIONS;
  } catch (e) {
    console.warn("Failed to load notifications from storage", e);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveAllNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: notifications }));
  } catch (e) {
    console.error("Failed to save notifications", e);
  }
}

export function loadNotificationsForUser(user) {
  const all = loadAllNotifications();
  if (!user) return all;
  const userEmpId = user.employeeId || "";
  const userRole = (user.systemRole || user.role || "").toLowerCase();
  const isSuper = userRole.includes("hr") || userRole.includes("admin") || userRole.includes("manager");

  return all.filter(n => {
    if (!n.targetEmployeeId || n.targetEmployeeId === "all") return true;
    if (n.targetEmployeeId === userEmpId) return true;
    if (isSuper && n.targetRole === "supervisor") return true;
    return false;
  }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export function addNotification({ title, desc, icon = "bell", type = "task", targetEmployeeId = "all", targetRole, taskId }) {
  const all = loadAllNotifications();
  const newNotif = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    desc,
    icon,
    time: "Just now",
    timestamp: Date.now(),
    unread: true,
    targetEmployeeId,
    targetRole,
    taskId,
    type
  };
  const updated = [newNotif, ...all];
  saveAllNotifications(updated);
  return newNotif;
}

export function markAsRead(notificationId) {
  const all = loadAllNotifications();
  const updated = all.map(n => n.id === notificationId ? { ...n, unread: false } : n);
  saveAllNotifications(updated);
}

export function markAllAsReadForUser(user) {
  const all = loadAllNotifications();
  const userEmpId = user?.employeeId || "";
  const updated = all.map(n => {
    if (!n.targetEmployeeId || n.targetEmployeeId === "all" || n.targetEmployeeId === userEmpId) {
      return { ...n, unread: false };
    }
    return n;
  });
  saveAllNotifications(updated);
}

export function getUnreadCountForUser(user) {
  const userNotifs = loadNotificationsForUser(user);
  return userNotifs.filter(n => n.unread).length;
}

export function subscribeNotifications(callback) {
  const handler = () => {
    callback();
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
