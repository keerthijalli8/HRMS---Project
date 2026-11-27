import { initialDocuments } from "../data/documentData";
import { initialLeaveData } from "../data/leaveData";
import { attendanceRecords } from "../pages/Attendance";
import { getAnnouncementStatus, readAnnouncements } from "./announcements";
import { readAuditLog } from "./auditLog";
import { readEmployeeRecords } from "./employeeRecords";
import { applyAttendanceOverrides, readAttendanceOverrides } from "./attendanceOverrides";

const STATE_KEY = "hrms-admin-notification-state";
const CHANGE_EVENT = "hrms-admin-notifications-updated";

function readStoredArray(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new TypeError(`${key} must contain an array.`);
    return parsed;
  } catch (error) {
    console.error(`Unable to load records for admin notifications (${key}).`, error);
    return fallback;
  }
}

function readNotificationState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new TypeError("Saved notification state must be an object.");
    }
    return parsed;
  } catch (error) {
    console.error("Unable to load admin notification state.", error);
    return {};
  }
}

export function updateAdminNotificationState(updates) {
  try {
    const current = readNotificationState();
    localStorage.setItem(STATE_KEY, JSON.stringify({ ...current, ...updates }));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch (error) {
    console.error("Unable to save admin notification state.", error);
    return false;
  }
}

export function getAdminNotifications() {
  const employees = readEmployeeRecords();
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const leaves = readStoredArray("hrms-leave-requests", initialLeaveData);
  const documents = readStoredArray("hrms-documents", initialDocuments);
  const attendance = applyAttendanceOverrides(attendanceRecords, readAttendanceOverrides());
  const announcements = readAnnouncements();
  const auditEntries = readAuditLog();
  const notifications = [];

  documents.filter((document) => ["Pending", "Pending Verification", "Submitted"].includes(document.status))
    .slice(0, 3)
    .forEach((document) => notifications.push({
      id: `document:${document.documentId || document.id}`,
      category: "Employee",
      title: "Employee document submitted",
      description: `${document.employee || "An employee"} · ${document.document || "Document"} is awaiting review.`,
      timestamp: toTimestamp(document.submittedAt || document.uploadedAt || document.date),
      path: "/admin/documents",
      sample: true,
    }));

  leaves.filter((leave) => leave.status === "Pending")
    .slice(0, 4)
    .forEach((leave) => notifications.push({
      id: `leave:${leave.id}`,
      category: "Leave",
      title: "Pending leave approval",
      description: `${leave.name || leave.employeeId} · ${leave.leaveType} · ${leave.from}–${leave.to} (${leave.pendingStage || "approval"} stage).`,
      timestamp: toTimestamp(leave.createdAt || leave.from),
      path: `/admin/leaves?filter=Pending`,
      sample: true,
    }));

  attendance.filter((record) => record.status === "Late")
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4)
    .forEach((record) => {
      const employee = employeesById.get(record.employeeId);
      if (!employee) return;
      notifications.push({
        id: `attendance-late:${record.date}:${record.employeeId}`,
        category: "Attendance",
        title: "Late login alert",
        description: `${employee.name} · ${record.date} · Checked in ${record.checkIn}.`,
        timestamp: toTimestamp(record.date),
        path: `/admin/attendance/records?filter=Late&date=${encodeURIComponent(record.date)}`,
        sample: true,
      });
    });

  announcements.filter((announcement) => {
    const status = getAnnouncementStatus(announcement);
    return status === "Published" || status === "Scheduled";
  })
    .sort((left, right) => String(right.publishAt || right.createdAt).localeCompare(String(left.publishAt || left.createdAt)))
    .slice(0, 4)
    .forEach((announcement) => {
      const status = getAnnouncementStatus(announcement);
      notifications.push({
        id: `announcement:${announcement.id}`,
        category: "Announcement",
        title: announcement.priority === "Urgent" || announcement.priority === "Critical"
          ? "Important company announcement"
          : status === "Scheduled" ? "Scheduled announcement reminder" : "New announcement",
        description: `${announcement.title} · ${announcement.category} · ${announcement.priority}.`,
        timestamp: toTimestamp(announcement.publishAt || announcement.createdAt),
        path: `/admin/announcements/${encodeURIComponent(announcement.id)}`,
        sample: false,
      });
    });

  auditEntries.filter((entry) => entry.entityType === "Employee" || String(entry.action).startsWith("employee."))
    .slice(0, 4)
    .forEach((entry) => notifications.push({
      id: `employee-audit:${entry.id}`,
      category: "Employee",
      title: String(entry.action).includes("created") ? "New employee added" : "Employee profile updated",
      description: entry.summary || `${entry.entityType} ${entry.entityId || ""} was updated.`,
      timestamp: toTimestamp(entry.timestamp),
      path: "/admin/employees",
      sample: false,
    }));

  const state = readNotificationState();
  return notifications
    .filter((notification, index, list) => list.findIndex((entry) => entry.id === notification.id) === index)
    .filter((notification) => !state[notification.id]?.dismissedAt)
    .map((notification) => ({
      ...notification,
      readAt: state[notification.id]?.readAt || "",
      isRead: Boolean(state[notification.id]?.readAt),
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function notificationChangeEvent() {
  return CHANGE_EVENT;
}

export function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toTimestamp(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
