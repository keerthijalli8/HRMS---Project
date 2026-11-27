/**
 * Central Mock Data Export Layer
 * Re-exports canonical single-source-of-truth from mockDb.js
 */

import {
  CANONICAL_EMPLOYEES_12,
  COMPANY_CONFIG,
  DEMO_ACCOUNTS,
  TELANGANA_HOLIDAYS_2026,
  CANONICAL_METRICS,
  CANONICAL_CANDIDATES_8
} from './mockDb.js';

// Navigation Items list for sidebar with dedicated clean routes
export const navItems = [
  { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "my-tasks", path: "/my-tasks", label: "My Tasks", icon: "check-square" },
  { id: "teams", path: "/teams", label: "Teams", icon: "users" },
  { id: "attendance", path: "/attendance", label: "Attendance", icon: "clock" },
  { id: "shifts-roster", path: "/shifts-roster", label: "Shifts & Roster", icon: "clock" },
  { id: "leave", path: "/leave", label: "Leave Management", icon: "calendar", badge: 3 },
  { id: "lop", path: "/lop", label: "LOP Management", icon: "alert-triangle" },
  { id: "payroll", path: "/payroll", label: "Payroll", icon: "dollar-sign" },
  { id: "benefits-allowances", path: "/benefits-allowances", label: "Benefits & Allowances", icon: "shield" },
  { id: "onboarding", path: "/onboarding", label: "Onboarding", icon: "user-check" },
  { id: "performance", path: "/performance", label: "Performance", icon: "trending-up" },
  { id: "documents", path: "/documents", label: "Documents", icon: "file-text" },
  { id: "reports", path: "/reports", label: "Reports & Analytics", icon: "bar-chart-2" },
  { id: "audit-logs", path: "/audit-logs", label: "Audit Logs", icon: "shield", hrOnly: true },
  { id: "announcements", path: "/announcements", label: "Announcements", icon: "megaphone" },
  { id: "notifications", path: "/notifications", label: "Notifications", icon: "bell", badge: 6 },
  { id: "hr-settings", path: "/hr-settings", label: "HR Settings", icon: "settings" }
];

// Re-export canonical 12 enterprise employees
export const employeeData = CANONICAL_EMPLOYEES_12;

export {
  CANONICAL_EMPLOYEES_12,
  COMPANY_CONFIG,
  DEMO_ACCOUNTS,
  TELANGANA_HOLIDAYS_2026,
  CANONICAL_METRICS,
  CANONICAL_CANDIDATES_8
};

export default {
  navItems,
  employeeData: CANONICAL_EMPLOYEES_12,
  COMPANY_CONFIG,
  DEMO_ACCOUNTS,
  TELANGANA_HOLIDAYS_2026,
  CANONICAL_METRICS,
  CANONICAL_CANDIDATES_8
};
