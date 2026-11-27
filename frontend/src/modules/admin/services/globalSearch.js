import { initialDocuments } from "../data/documentData";
import { initialLeaveData } from "../data/leaveData";
import { getAnnouncementStatus, readAnnouncements } from "./announcements";
import { readEmployeeRecords } from "./employeeRecords";
import { applyAttendanceOverrides, readAttendanceOverrides } from "./attendanceOverrides";
import { attendanceRecords } from "../pages/Attendance";
import { readAuditLog } from "./auditLog";
import { readAdminProfile } from "./adminProfile";

const LEAVE_STORAGE_KEY = "hrms-leave-requests";
const DOCUMENT_STORAGE_KEY = "hrms-documents";

function readArray(key, fallback, description) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const records = JSON.parse(saved);
    if (!Array.isArray(records)) throw new TypeError(`${description} must be an array.`);
    return records;
  } catch (error) {
    console.error(`Unable to load ${description.toLowerCase()} for global search.`, error);
    return fallback;
  }
}

function text(value) {
  return String(value ?? "").trim();
}

function toSearchable(value) {
  return text(value).toLocaleLowerCase();
}

function buildResult(category, id, label, description, status, path, values) {
  return {
    id: `${category}:${id}`,
    category,
    label,
    description,
    status: text(status),
    path,
    values: [category, ...values].map(toSearchable).filter(Boolean),
  };
}

function leaveRecords() {
  return readArray(LEAVE_STORAGE_KEY, initialLeaveData, "Leave records");
}

function documentRecords() {
  return readArray(DOCUMENT_STORAGE_KEY, initialDocuments, "Document records");
}

function getAttendanceRecords() {
  return applyAttendanceOverrides(attendanceRecords, readAttendanceOverrides());
}

function searchSources() {
  const employees = readEmployeeRecords();
  const leaves = leaveRecords();
  const documents = documentRecords();
  const announcements = readAnnouncements();
  const records = getAttendanceRecords();
  const results = [];

  const modules = [
    ["Dashboard Overview", "Organization KPIs, attendance summary and recent activity.", "/admin/dashboard", "dashboard overview kpi"],
    ["Employees", "Employee records, roles, designations and employee details.", "/admin/employees", "hr people management"],
    ["Departments", "Department records and reporting hierarchy.", "/admin/departments", "organization people"],
    ["Attendance Management", "Attendance records, corrections and company attendance settings.", "/admin/attendance", "attendance hr"],
    ["Leave Management", "Leave requests, approvals and leave records.", "/admin/leaves", "leave hr"],
    ["Payroll Management", "Payroll processing, employee salary records and payroll history.", "/admin/payroll", "payroll salary finance"],
    ["Recruitment Management", "Openings, candidates and recruitment workflows.", "/admin/roles", "recruitment hiring"],
    ["Reports & Audit Logs", "Usage reports, administrative changes and security events.", "/admin/reports", "reports audit security logs analytics"],
    ["User Management", "Company users and access management.", "/admin/users", "users access administration"],
    ["Roles & Permissions", "Roles, permissions and access configuration.", "/admin/roles", "roles permissions security"],
    ["Company Settings", "Company profile, branding and security configuration.", "/admin/settings", "settings configuration company"],
    ["HR Configuration", "HR policies and configuration records.", "/admin/hr-configuration", "hr configuration policy"],
  ];
  modules.forEach(([label, description, path, ...terms]) => results.push(buildResult("Modules & Settings", label, label, description, "", path, [label, description, ...terms])));

  const profile = readAdminProfile();
  if (profile.name || profile.email) {
    results.push(buildResult("Users & Admins", profile.name || profile.email, profile.name || profile.email, `${profile.designation || "Administrator"} · ${profile.email || "Email not provided"}`, "", "/admin/settings?tab=Profile", [profile.name, profile.email, profile.designation, profile.department, "admin user"]));
  }

  employees.forEach((employee) => {
    const name = text(employee.name) || employee.id;
    const department = text(employee.department) || "Department not set";
    const designation = text(employee.designation || employee.role) || "Designation not set";
    const statusValue = employee.status || employee.employmentStatus || "Active";
    const status = typeof statusValue === "string" ? statusValue : statusValue.label || statusValue.name || "Active";
    results.push(buildResult(
      "Employees",
      employee.id,
      name,
      `${employee.id} · ${department} · ${designation}`,
      status,
      `/admin/employees?filter=all&q=${encodeURIComponent(employee.id)}`,
      [employee.id, name, department, designation, employee.email, employee.project, employee.workMode, employee.work, status],
    ));
  });

  const uniqueDepartments = [...new Set(employees.map((employee) => text(employee.department)).filter(Boolean))];
  uniqueDepartments.forEach((department) => {
    const members = employees.filter((employee) => text(employee.department) === department);
    results.push(buildResult(
      "Departments",
      department,
      department,
      `${members.length} employee${members.length === 1 ? "" : "s"}`,
      "",
      `/admin/employees?filter=all&department=${encodeURIComponent(department)}`,
      [department, ...members.map((employee) => employee.name)],
    ));
  });

  const uniqueBranches = [...new Set(employees.map((employee) => text(employee.branch || employee.branchName || employee.location)).filter(Boolean))];
  uniqueBranches.forEach((branch) => {
    const members = employees.filter((employee) => text(employee.branch || employee.branchName || employee.location) === branch);
    results.push(buildResult("Branches", branch, branch, `${members.length} employee${members.length === 1 ? "" : "s"}`, "", "/admin/organization", [branch, ...members.map((employee) => employee.name), "branch organization"]));
  });

  readAuditLog().forEach((entry) => {
    const actor = text(entry.actor || entry.user || "Unknown user");
    const activity = text(entry.action || entry.activity || "Audit activity");
    const description = text(entry.summary || entry.description || activity);
    results.push(buildResult("Reports & Audit Logs", `${entry.id || entry.timestamp}-${activity}`, activity, `${actor} · ${description}`, entry.status || "Recorded", "/admin/reports", [actor, activity, description, entry.entityType, entry.module, entry.status, "audit security administrative change"]));
  });

  const projects = [...new Set(employees.map((employee) => text(employee.project)).filter(Boolean))];
  projects.forEach((project) => {
    const members = employees.filter((employee) => text(employee.project) === project);
    results.push(buildResult(
      "Projects",
      project,
      project,
      `${members.length} assigned employee${members.length === 1 ? "" : "s"}`,
      "",
      `/admin/employees?filter=all&project=${encodeURIComponent(project)}`,
      [project, ...members.map((employee) => employee.name)],
    ));
  });

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  records.forEach((record) => {
    const employee = employeeById.get(record.employeeId);
    if (!employee) return;
    const id = `${record.date}:${record.employeeId}`;
    const status = text(record.status);
    const workingMinutes = durationMinutes(record.checkIn, record.checkOut);
    const description = `${employee.id} · ${record.date} · In ${record.checkIn || "—"} · Out ${record.checkOut || "—"}`;
    const path = `/admin/attendance/records?filter=${encodeURIComponent(status === "Late" ? "Late" : "All")}&date=${encodeURIComponent(record.date)}`;
    const allValues = [employee.name, employee.id, employee.department, record.date, record.checkIn, record.checkOut, status];
    results.push(buildResult("Attendance", id, employee.name, description, status, path, allValues));
    if (workingMinutes > 0) {
      results.push(buildResult(
        "Working Hours",
        id,
        employee.name,
        `${record.date} · ${record.checkIn}–${record.checkOut} · ${formatDuration(workingMinutes)}`,
        status,
        `/admin/attendance/records?filter=Working%20Hours&date=${encodeURIComponent(record.date)}`,
        [...allValues, "working hours", formatDuration(workingMinutes)],
      ));
    }
    if (status === "Late") {
      results.push(buildResult(
        "Late Login Records",
        id,
        employee.name,
        `${record.date} · Checked in ${record.checkIn}`,
        "Late",
        `/admin/attendance/records?filter=Late&date=${encodeURIComponent(record.date)}`,
        [...allValues, "late login", "late arrival"],
      ));
    }
  });

  leaves.forEach((leave) => {
    results.push(buildResult(
      "Leave Management",
      leave.id,
      text(leave.name) || text(leave.employeeId),
      `${text(leave.leaveType)} · ${text(leave.from)}–${text(leave.to)} · ${text(leave.employeeId)}`,
      leave.status,
      `/admin/leaves?filter=${encodeURIComponent(leave.status || "All")}`,
      [leave.name, leave.employeeId, leave.leaveType, leave.from, leave.to, leave.status, leave.department, leave.project, leave.role],
    ));
  });

  documents.forEach((document) => {
    results.push(buildResult(
      "Employee Documents",
      document.documentId || document.id,
      `${text(document.document) || "Employee document"} · ${text(document.employee)}`,
      `${text(document.employeeId)} · ${text(document.category)} · ${text(document.date)}`,
      document.status,
      `/admin/documents`,
      [document.document, document.employee, document.employeeId, document.category, document.status, document.fileName],
    ));
  });

  announcements.forEach((announcement) => {
    const status = getAnnouncementStatus(announcement);
    results.push(buildResult(
      "Announcements",
      announcement.id,
      text(announcement.title) || announcement.id,
      `${text(announcement.category)} · ${text(announcement.priority)} priority`,
      status,
      `/admin/announcements/${encodeURIComponent(announcement.id)}`,
      [announcement.id, announcement.title, announcement.shortDescription, announcement.content, announcement.category, announcement.priority, status],
    ));
  });

  return results;
}

function durationMinutes(start, end) {
  const parse = (value) => {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text(value));
    if (!match) return null;
    const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
    return hour * 60 + Number(match[2]);
  };
  const startMinutes = parse(start);
  const endMinutes = parse(end);
  return startMinutes === null || endMinutes === null || endMinutes < startMinutes ? 0 : endMinutes - startMinutes;
}

function formatDuration(minutes) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function matchScore(result, query) {
  if (result.values.some((value) => value === query)) return 0;
  if (result.values.some((value) => value.startsWith(query))) return 1;
  return 2;
}

export function searchAdminData(rawQuery) {
  const query = toSearchable(rawQuery);
  if (!query) return [];

  const matched = searchSources().filter((result) => result.values.some((value) => value.includes(query)));
  const unique = [...new Map(matched.map((result) => [result.id, result])).values()];
  unique.sort((left, right) => matchScore(left, query) - matchScore(right, query)
    || left.label.localeCompare(right.label));

  const groups = new Map();
  unique.forEach((result) => {
    if (!groups.has(result.category)) groups.set(result.category, []);
    if (groups.get(result.category).length < 5) groups.get(result.category).push(result);
  });
  return [...groups].map(([category, items]) => ({ category, items }));
}
