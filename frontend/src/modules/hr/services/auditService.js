/**
 * HR Desk Application Activity & Audit Logging Service (auditService.js)
 * 
 * SCOPE:
 * Strictly records actions performed INSIDE the HR Desk web application for SOC-2,
 * ISO 27001, and Indian Digital Personal Data Protection Act (DPDPA 2023) compliance.
 * Does NOT track external browser tabs, websites, keystrokes, screenshots, or webcam.
 * 
 * STORAGE:
 * Versioned localStorage key: "hrdesk_audit_v1" (capped at 5,000 events, oldest dropped).
 * Settings key: "hrdesk_audit_settings_v1" (retention period, category toggles).
 * Append-only from UI: No user or admin can edit or delete audit events.
 */

import { employeeData } from '../data/mockData.js';

const AUDIT_STORAGE_KEY = "hrdesk_audit_v1";
const AUDIT_SETTINGS_KEY = "hrdesk_audit_settings_v1";
const AUDIT_EVENT_NAME = "hrms_audit_updated";
const MAX_EVENTS_LIMIT = 5000;

// Default Audit Governance Settings
const DEFAULT_AUDIT_SETTINGS = {
  retentionDays: 180, // Default 180 days retention
  trackNavigation: true, // Navigation tracking toggle
  enabledCategories: {
    Sessions: true,
    Attendance: true,
    Navigation: true,
    "Data changes": true,
    Approvals: true,
    Files: true,
    Sensitive: true,
    Settings: true
  },
  lastUpdated: "2026-11-01T10:00:00.000Z",
  updatedBy: "System Governance Policy"
};

// ------------------- USER AGENT, DEVICE & IP DETECTION -------------------

export function parseDeviceAndBrowser(userAgent) {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : "");
  
  // Browser Detection
  let browser = "Chrome 122.0";
  if (ua.includes("Edg/")) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match ? match[1] : ''}`;
  } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match ? match[1].split('.')[0] : '122'}`;
  } else if (ua.includes("Firefox/")) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match ? match[1] : ''}`;
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${match ? match[1] : ''}`;
  }

  // OS & Device Detection
  let device = "Desktop (Windows 11)";
  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) {
    device = "Desktop (Windows 11)";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = "Desktop (macOS Sonoma)";
  } else if (/Android/i.test(ua)) {
    device = "Mobile (Android 14)";
  } else if (/iPhone|iPad/i.test(ua)) {
    device = "Mobile (iOS 17)";
  } else if (/Linux/i.test(ua)) {
    device = "Desktop (Linux x86_64)";
  }

  return { browser, device };
}

// Fixed or realistic office network IP allocation
const IP_POOLS = {
  "EMP-1042": "106.51.72.18",  // Aarav Sharma (Hyderabad Campus)
  "EMP-1001": "106.51.72.22",  // Meera Reddy (Hyderabad Campus)
  "EMP-1088": "106.51.72.45",  // Pooja Patel (Hyderabad HR Wing)
  "EMP-1015": "182.74.88.94",  // Deepa Nair (Secunderabad - Hybrid)
  "EMP-1028": "106.51.72.33",  // Arjun Reddy (Hyderabad Campus)
  "EMP-1022": "106.51.72.19",  // Sneha Swaminathan (Finance Office)
  "EMP-1102": "182.74.89.102", // Rohan Varma (WFH)
  "EMP-1301": "106.51.72.60"   // Vikram Malhotra (Sales)
};

const LOCATION_POOLS = {
  "EMP-1042": "Hyderabad, Telangana, IN",
  "EMP-1001": "Hyderabad, Telangana, IN",
  "EMP-1088": "Hyderabad, Telangana, IN",
  "EMP-1015": "Hyderabad, Telangana, IN",
  "EMP-1028": "Hyderabad, Telangana, IN",
  "EMP-1022": "Hyderabad, Telangana, IN",
  "EMP-1102": "Hyderabad, Telangana, IN",
  "EMP-1301": "Hyderabad, Telangana, IN"
};

export function getClientIP(employeeId) {
  if (employeeId && IP_POOLS[employeeId]) return IP_POOLS[employeeId];
  return "106.51.72.50";
}

export function getClientLocation(employeeId) {
  if (employeeId && LOCATION_POOLS[employeeId]) return LOCATION_POOLS[employeeId];
  return "Hyderabad, Telangana, IN";
}

// Session Management
export function getCurrentSessionId() {
  if (typeof window === 'undefined') return "sess-local";
  try {
    let sessId = sessionStorage.getItem("hrdesk_session_id");
    if (!sessId) {
      sessId = "sess-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now().toString(36);
      sessionStorage.setItem("hrdesk_session_id", sessId);
    }
    return sessId;
  } catch (e) {
    return "sess-" + Date.now().toString(36);
  }
}

// Format IST Timestamp: e.g. "12 Nov 2026, 01:15:30 PM IST"
export function formatKolkataTimestamp(dateObj = new Date()) {
  try {
    const d = typeof dateObj === 'string' || typeof dateObj === 'number' ? new Date(dateObj) : dateObj;
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d) + " IST";
  } catch (e) {
    return new Date().toLocaleString() + " IST";
  }
}

// Format Time Only in Monospace: "01:15:30 PM"
export function formatKolkataTimeOnly(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d);
  } catch (e) {
    return "12:00:00 PM";
  }
}

// ------------------- SENSITIVE DATA MASKING & FIELD DIFF -------------------

const SENSITIVE_FIELD_NAMES = [
  "password", "pwd", "salary", "ctc", "basic", "bankAccount",
  "accountNumber", "pan", "panNumber", "aadhaar", "aadhaarNumber", "pfNumber"
];

export function maskSensitiveValue(key, val) {
  if (val === null || val === undefined) return "—";
  const str = String(val);
  const lowerKey = String(key || "").toLowerCase();

  // Password masking
  if (lowerKey.includes("password") || lowerKey.includes("pwd")) {
    return "••••••••";
  }
  // Salary / Financial masking
  if (lowerKey.includes("salary") || lowerKey.includes("ctc") || lowerKey.includes("basic") || lowerKey.includes("allowance")) {
    if (str.startsWith("₹")) return "₹ ••,••,•••";
    return "₹ ••,••,•••";
  }
  // Bank Account masking (keep last 4)
  if (lowerKey.includes("bank") || lowerKey.includes("account")) {
    if (str.length > 4) return "••••••••" + str.slice(-4);
    return "••••••••";
  }
  // PAN masking
  if (lowerKey.includes("pan")) {
    if (str.length >= 10) return str.slice(0, 2) + "••••••" + str.slice(-2);
    return "••••••••••";
  }
  // Aadhaar masking
  if (lowerKey.includes("aadhaar")) {
    if (str.length >= 4) return "•••• •••• " + str.slice(-4);
    return "•••• •••• ••••";
  }

  return str;
}

/**
 * Computes field-level difference between old and new object states.
 * Masking sensitive fields so credentials or confidential figures are never exposed.
 */
export function diffObjects(oldObj, newObj, ignoredFields = ["updatedAt", "lastModified", "revision"]) {
  if (!oldObj || !newObj) return [];
  const diffs = [];
  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  for (const key of allKeys) {
    if (ignoredFields.includes(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Simple comparison
    const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal ?? "");
    const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? "");

    if (oldStr !== newStr) {
      diffs.push({
        field: key,
        old: maskSensitiveValue(key, oldVal),
        new: maskSensitiveValue(key, newVal),
        isSensitive: SENSITIVE_FIELD_NAMES.some(f => key.toLowerCase().includes(f))
      });
    }
  }

  return diffs;
}

// ------------------- AUDIT SETTINGS STORAGE -------------------

export function loadAuditSettings() {
  try {
    const raw = localStorage.getItem(AUDIT_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_AUDIT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load audit settings:", e);
  }
  return DEFAULT_AUDIT_SETTINGS;
}

export function saveAuditSettings(settings, adminUser) {
  try {
    const current = loadAuditSettings();
    const updated = {
      ...current,
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminUser?.name ? `${adminUser.name} (${adminUser.systemRole || adminUser.role || 'Admin'})` : "HR Administrator"
    };
    localStorage.setItem(AUDIT_SETTINGS_KEY, JSON.stringify(updated));

    // Log the change to audit log itself
    logEvent({
      action: "settings_update",
      category: "Settings",
      module: "HR Settings",
      description: `Updated Audit Governance Policy (Retention: ${updated.retentionDays} days, Navigation Tracking: ${updated.trackNavigation ? 'Enabled' : 'Disabled'})`,
      metadata: {
        diff: diffObjects(current, updated),
        retentionDays: updated.retentionDays,
        trackNavigation: updated.trackNavigation
      },
      user: adminUser,
      status: "Success",
      isSensitive: true
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("hrms_audit_settings_updated", { detail: updated }));
    }
    return { ok: true, settings: updated };
  } catch (e) {
    console.error("Failed to save audit settings:", e);
    return { ok: false, error: e.message };
  }
}

// ------------------- AUDIT LOG STORE & ACCESS -------------------

export function loadAuditEvents() {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read audit events:", e);
  }

  // Pre-seed realistic sample audit history if empty
  const seeded = generateRealisticSeedEvents();
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(seeded));
  } catch (e) {}
  return seeded;
}

export function saveAuditEvents(events) {
  try {
    // Keep capped at MAX_EVENTS_LIMIT (drop oldest)
    const capped = events.length > MAX_EVENTS_LIMIT ? events.slice(0, MAX_EVENTS_LIMIT) : events;
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(capped));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUDIT_EVENT_NAME));
    }
    return true;
  } catch (e) {
    console.error("Failed to persist audit events:", e);
    return false;
  }
}

export function subscribeAudit(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUDIT_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUDIT_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

// ------------------- ACCESS CONTROL RULES -------------------

/**
 * Enforces role-based visibility to employee audit logs:
 * 1. Regular employees can ONLY see their own audit log ("My Activity").
 * 2. Team Leads / Managers can only see logs of employees in their reporting hierarchy.
 * 3. HR / Admin can inspect any employee's audit logs.
 */
export function canUserViewAudit(viewer, targetEmployeeId) {
  if (!viewer || !targetEmployeeId) return false;

  const viewerId = (viewer.employeeId || viewer.id || "").trim().toLowerCase();
  const targetId = String(targetEmployeeId || "").trim().toLowerCase();

  // Rule 1: Viewing own activity is always allowed
  if (viewerId && targetId && viewerId === targetId) {
    return true;
  }

  const role = (viewer.systemRole || viewer.role || "").trim().toLowerCase();

  // Rule 3: HR / Admin authority
  if (
    role === "admin" ||
    role === "hr manager" ||
    role === "super admin" ||
    role.includes("admin") ||
    role === "hr" ||
    role.includes("hr")
  ) {
    return true;
  }

  // Rule 2: Manager / TL authority (only direct & indirect reports)
  if (role.includes("manager") || role.includes("lead") || role === "main_tl" || role === "tl") {
    // Traverse reporting hierarchy
    const isSubordinate = checkReportingLine(viewerId, targetId);
    if (isSubordinate) return true;
  }

  return false;
}

function checkReportingLine(managerId, employeeId) {
  if (!managerId || !employeeId) return false;
  const target = employeeData.find(e => (e.id || e.employeeId || "").toLowerCase() === employeeId);
  if (!target) return false;

  // Direct reporting match
  if (target.reportingToId && target.reportingToId.toLowerCase() === managerId) {
    return true;
  }

  // If manager is department head of same department
  const mgr = employeeData.find(e => (e.id || e.employeeId || "").toLowerCase() === managerId);
  if (mgr && mgr.isDepartmentHead && (mgr.dept || mgr.department) === (target.dept || target.department)) {
    return true;
  }

  return false;
}

// ------------------- LOG EVENT (CENTRAL INGESTION) -------------------

/**
 * Ingests an in-app audit event.
 * Automatically enriches with timestamp, user session, device, IP, and location.
 */
export function logEvent({
  action,
  category = "Data changes",
  module = "General",
  description = "",
  target = null,
  metadata = {},
  status = "Success",
  isSensitive = false,
  user = null
}) {
  try {
    const settings = loadAuditSettings();

    // Honor Category Toggles (e.g. Navigation tracking disabled)
    if (category === "Navigation" && !settings.trackNavigation) {
      return null;
    }
    if (settings.enabledCategories && settings.enabledCategories[category] === false) {
      return null;
    }

    // Determine current user
    let currentUser = user;
    if (!currentUser && typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem("hrms_user");
        if (rawUser) currentUser = JSON.parse(rawUser);
      } catch (e) {}
    }

    const empId = currentUser?.employeeId || currentUser?.id || "EMP-1088";
    const empName = currentUser?.name || "Pooja Patel";
    const now = new Date();
    const { device, browser } = parseDeviceAndBrowser();
    const ip = getClientIP(empId);
    const location = getClientLocation(empId);
    const sessionId = getCurrentSessionId();

    const newEvent = {
      id: "AUD-" + now.getTime().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
      employeeId: empId,
      employeeName: empName,
      action: action || "action_performed",
      category: category,
      module: module,
      description: description || `${action} in ${module}`,
      target: target ? {
        type: target.type || "Record",
        id: target.id || null,
        name: target.name || null
      } : null,
      metadata: metadata || {},
      timestamp: formatKolkataTimestamp(now),
      iso: now.toISOString(),
      ip: ip,
      device: device,
      browser: browser,
      location: location,
      sessionId: sessionId,
      status: status === "Failed" ? "Failed" : "Success",
      isSensitive: Boolean(isSensitive)
    };

    const events = loadAuditEvents();
    // Prepend to newest first
    events.unshift(newEvent);
    saveAuditEvents(events);

    return newEvent;
  } catch (e) {
    console.error("Error logging audit event:", e);
    return null;
  }
}

// ------------------- STATS & AGGREGATIONS -------------------

export function getAuditStats(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      total: 0,
      lastActiveRelative: "Never",
      lastActiveExact: "—",
      lastLogin: { time: "—", device: "—", ip: "—" },
      sessionsToday: 0,
      sensitiveCount: 0,
      failedAttempts: 0
    };
  }

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  // Latest event
  const latest = events[0];
  const lastActiveExact = latest ? latest.timestamp : "—";
  const lastActiveRelative = latest ? getRelativeTime(latest.iso) : "Never";

  // Last login
  const loginEvents = events.filter(e => e.action === "login" || e.action === "session_start");
  const lastLoginEvent = loginEvents[0] || null;
  const lastLogin = lastLoginEvent ? {
    time: formatKolkataTimestamp(lastLoginEvent.iso),
    device: lastLoginEvent.device,
    ip: lastLoginEvent.ip
  } : {
    time: "Today, 09:15 AM IST",
    device: latest?.device || "Desktop (Windows 11)",
    ip: latest?.ip || "106.51.72.18"
  };

  // Sessions today
  const sessionIdsToday = new Set();
  events.forEach(e => {
    if (e.iso && e.iso.startsWith(todayKey)) {
      sessionIdsToday.add(e.sessionId || "default");
    }
  });

  const sensitiveCount = events.filter(e => e.isSensitive || e.category === "Sensitive").length;
  const failedAttempts = events.filter(e => e.status === "Failed").length;

  return {
    total: events.length,
    lastActiveRelative,
    lastActiveExact,
    lastLogin,
    sessionsToday: Math.max(sessionIdsToday.size, 1),
    sensitiveCount,
    failedAttempts
  };
}

function getRelativeTime(isoString) {
  if (!isoString) return "Recently";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// ------------------- SESSIONS AGGREGATION -------------------

export function aggregateSessions(events) {
  const sessionMap = new Map();

  events.forEach(event => {
    const sId = event.sessionId || "session-fallback";
    if (!sessionMap.has(sId)) {
      sessionMap.set(sId, {
        sessionId: sId,
        employeeId: event.employeeId,
        employeeName: event.employeeName,
        startTime: event.iso,
        endTime: event.iso,
        device: event.device,
        browser: event.browser,
        ip: event.ip,
        location: event.location,
        actions: []
      });
    }

    const sess = sessionMap.get(sId);
    sess.actions.push(event);
    if (new Date(event.iso) < new Date(sess.startTime)) sess.startTime = event.iso;
    if (new Date(event.iso) > new Date(sess.endTime)) sess.endTime = event.iso;
  });

  return Array.from(sessionMap.values()).map(s => {
    const startMs = new Date(s.startTime).getTime();
    const endMs = new Date(s.endTime).getTime();
    const durationMinutes = Math.max(Math.round((endMs - startMs) / 60000), 1);
    const durationStr = durationMinutes >= 60 
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      : `${durationMinutes}m`;

    return {
      ...s,
      durationStr,
      actionCount: s.actions.length,
      hasSensitive: s.actions.some(a => a.isSensitive)
    };
  }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

// ------------------- PAGE VISITS AGGREGATION -------------------

export function aggregatePageVisits(events) {
  const visitEvents = events.filter(e => e.action === "page_visit" || e.category === "Navigation");
  const moduleCounts = {};
  const pageMap = new Map();

  visitEvents.forEach(e => {
    const page = e.metadata?.route || e.module || "Overview";
    const durationSec = e.metadata?.durationSeconds || 45;

    if (!pageMap.has(page)) {
      pageMap.set(page, { page, visits: 0, totalSeconds: 0 });
    }
    const item = pageMap.get(page);
    item.visits += 1;
    item.totalSeconds += durationSec;

    moduleCounts[e.module] = (moduleCounts[e.module] || 0) + 1;
  });

  const pages = Array.from(pageMap.values()).map(p => {
    const mins = Math.round(p.totalSeconds / 60);
    return {
      ...p,
      timeFormatted: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins || 1} min`
    };
  }).sort((a, b) => b.visits - a.visits);

  return {
    pages,
    topModules: Object.entries(moduleCounts).map(([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count)
  };
}

// ------------------- CSV EXPORT -------------------

export function exportAuditLogsToCsv(events, filename = "hrdesk-audit-logs.csv", user = null) {
  if (!events || events.length === 0) return false;

  const headers = [
    "Event ID",
    "Timestamp (IST)",
    "Employee ID",
    "Employee Name",
    "Action",
    "Category",
    "Module",
    "Description",
    "Target Type",
    "Target ID",
    "Status",
    "Sensitive",
    "Device",
    "Browser",
    "IP Address",
    "Location",
    "Session ID"
  ];

  const rows = events.map(e => [
    `"${e.id}"`,
    `"${e.timestamp}"`,
    `"${e.employeeId}"`,
    `"${e.employeeName.replace(/"/g, '""')}"`,
    `"${e.action}"`,
    `"${e.category}"`,
    `"${e.module}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    `"${e.target?.type || '—'}"`,
    `"${e.target?.id || '—'}"`,
    `"${e.status}"`,
    `"${e.isSensitive ? 'Yes' : 'No'}"`,
    `"${e.device}"`,
    `"${e.browser}"`,
    `"${e.ip}"`,
    `"${e.location}"`,
    `"${e.sessionId}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Record that the audit export itself occurred
  logEvent({
    action: "audit_export_csv",
    category: "Files",
    module: "Audit Governance",
    description: `Exported ${events.length} audit trail records to CSV (${filename})`,
    target: { type: "Report", id: filename, name: filename },
    metadata: { exportedCount: events.length, filename },
    user: user,
    status: "Success",
    isSensitive: true
  });

  return true;
}

// ------------------- REALISTIC SEED AUDIT TRAIL -------------------

function generateRealisticSeedEvents() {
  const seedEvents = [];
  const baseDate = new Date("2026-11-12T12:00:00.000Z"); // Today 12 Nov 2026

  // Helper to generate ISO relative to baseDate
  const offsetTime = (daysAgo, hour, minute, second) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, second, 0);
    return d;
  };

  const rawSeedTemplates = [
    // --- TODAY (12 Nov 2026) ---
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 11, m: 45, s: 12,
      action: "approve_leave", category: "Approvals", module: "Leave Desk",
      desc: "Approved leave LEV-REQ-101 for Deepa Nair (2 Days Medical Leave)",
      target: { type: "Leave", id: "LEV-REQ-101", name: "Deepa Nair" },
      meta: { note: "Approved per medical consult certificate. Feel better soon!", days: 2 },
      isSensitive: false
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 11, m: 30, s: 0,
      action: "page_visit", category: "Navigation", module: "Leave Desk",
      desc: "Visited Leave Management approvals queue",
      target: { type: "Page", id: "leave", name: "Leave Desk" },
      meta: { route: "leave", durationSeconds: 190 },
      isSensitive: false
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 11, m: 15, s: 44,
      action: "salary_unlock", category: "Sensitive", module: "Payroll",
      desc: "Used 'Unlock Confidential Salaries' privilege for November 2026 cycle",
      target: { type: "PayrollCycle", id: "PAY-NOV-2026", name: "November 2026 Payroll" },
      meta: { reason: "Routine statutory compliance review and TDS verification" },
      isSensitive: true
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 10, m: 50, s: 20,
      action: "search_query", category: "Navigation", module: "Global Search",
      desc: 'Executed global search for "Deepa Nair"',
      meta: { searchQuery: "Deepa Nair", resultsCount: 4 },
      isSensitive: false
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 10, m: 15, s: 30,
      action: "end_break", category: "Attendance", module: "Attendance Desk",
      desc: "Ended tea break (Duration: 15 mins)",
      meta: { breakMinutes: 15 },
      isSensitive: false
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 10, m: 0, s: 10,
      action: "start_break", category: "Attendance", module: "Attendance Desk",
      desc: "Started morning tea break",
      meta: { type: "Tea Break" },
      isSensitive: false
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 9, m: 28, s: 15,
      action: "check_in", category: "Attendance", module: "Attendance Desk",
      desc: "Punched biometric attendance check-in (On-premise Geofence verified)",
      meta: { mode: "Office", geofenceVerified: true },
      isSensitive: false
    },
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 0, h: 9, m: 25, s: 2,
      action: "login", category: "Sessions", module: "Auth",
      desc: "Authenticated enterprise session from Hyderabad Corporate Campus",
      meta: { method: "Password + Corporate SSO" },
      isSensitive: false
    },

    // --- AARAV SHARMA (EMP-1042) TODAY ---
    {
      empId: "EMP-1042", empName: "Aarav Sharma", days: 0, h: 11, m: 20, s: 10,
      action: "task_completed", category: "Approvals", module: "Tasks",
      desc: "Marked task 'Q4 Infrastructure Cost Review' as Completed",
      target: { type: "Task", id: "TSK-201", name: "Q4 Infra Review" },
      meta: { status: "Completed" },
      isSensitive: false
    },
    {
      empId: "EMP-1042", empName: "Aarav Sharma", days: 0, h: 10, m: 40, s: 0,
      action: "view_profile", category: "Sensitive", module: "Teams",
      desc: "Opened confidential employee profile of Deepa Nair (EMP-1015)",
      target: { type: "Employee", id: "EMP-1015", name: "Deepa Nair" },
      meta: { tab: "overview" },
      isSensitive: true
    },
    {
      empId: "EMP-1042", empName: "Aarav Sharma", days: 0, h: 9, m: 32, s: 5,
      action: "check_in", category: "Attendance", module: "Attendance Desk",
      desc: "Punched attendance check-in via mobile app",
      meta: { mode: "Office" },
      isSensitive: false
    },
    {
      empId: "EMP-1042", empName: "Aarav Sharma", days: 0, h: 9, m: 30, s: 0,
      action: "login", category: "Sessions", module: "Auth",
      desc: "Authenticated manager session from corporate network",
      meta: { method: "SSO" },
      isSensitive: false
    },

    // --- DEEPA NAIR (EMP-1015) TODAY & YESTERDAY ---
    {
      empId: "EMP-1015", empName: "Deepa Nair", days: 0, h: 8, m: 30, s: 0,
      action: "login", category: "Sessions", module: "Auth",
      desc: "User logged in to submit medical certificate",
      meta: { method: "Password" },
      isSensitive: false
    },
    {
      empId: "EMP-1015", empName: "Deepa Nair", days: 1, h: 17, m: 10, s: 15,
      action: "file_upload", category: "Files", module: "Documents",
      desc: "Uploaded medical document 'Medical_Consult_Slip.pdf' for leave regularization",
      target: { type: "Document", id: "DOC-MED-101", name: "Medical_Consult_Slip.pdf" },
      meta: { fileSize: "1.4 MB", type: "application/pdf" },
      isSensitive: false
    },
    {
      empId: "EMP-1015", empName: "Deepa Nair", days: 1, h: 17, m: 0, s: 0,
      action: "leave_request", category: "Attendance", module: "Leave Desk",
      desc: "Submitted Medical Leave application for 11 Nov – 12 Nov (2 Days)",
      target: { type: "Leave", id: "LEV-REQ-101", name: "Medical Leave" },
      meta: { days: 2, reason: "Severe viral fever and doctor consultation in Hyderabad" },
      isSensitive: false
    },

    // --- ARJUN REDDY (EMP-1028) ---
    {
      empId: "EMP-1028", empName: "Arjun Reddy", days: 0, h: 9, m: 45, s: 10,
      action: "check_in", category: "Attendance", module: "Attendance Desk",
      desc: "Punched attendance check-in (Grace period active)",
      meta: { mode: "Office", graceActive: true },
      isSensitive: false
    },
    {
      empId: "EMP-1028", empName: "Arjun Reddy", days: 1, h: 16, m: 30, s: 0,
      action: "profile_edit", category: "Data changes", module: "Profile",
      desc: "Updated emergency contact details in personal profile",
      target: { type: "Profile", id: "EMP-1028", name: "Arjun Reddy" },
      meta: {
        diff: [
          { field: "emergencyContact", old: "+91 98765 11029 (Old Contact)", new: "+91 98765 11099 (Updated Contact)" }
        ]
      },
      isSensitive: false
    },

    // --- MEERA REDDY (EMP-1001) ---
    {
      empId: "EMP-1001", empName: "Meera Reddy", days: 1, h: 15, m: 20, s: 0,
      action: "approve_leave", category: "Approvals", module: "Leave Desk",
      desc: "Approved leave request LEV-REQ-099 for Pooja Patel",
      target: { type: "Leave", id: "LEV-REQ-099", name: "Pooja Patel" },
      meta: { note: "Approved for family function in Surat" },
      isSensitive: false
    },
    {
      empId: "EMP-1001", empName: "Meera Reddy", days: 1, h: 14, m: 10, s: 0,
      action: "salary_unlock", category: "Sensitive", module: "Payroll",
      desc: "Unlocked confidential salary compensation structure for executive audit",
      meta: { reason: "Executive quarterly audit review" },
      isSensitive: true
    },
    {
      empId: "EMP-1001", empName: "Meera Reddy", days: 2, h: 18, m: 35, s: 0,
      action: "check_out", category: "Attendance", module: "Attendance Desk",
      desc: "Standard check-out completed after 9.1 hours working",
      meta: { totalHours: "9.1h", overtime: "0.1h" },
      isSensitive: false
    },

    // --- SNEHA SWAMINATHAN (EMP-1022) ---
    {
      empId: "EMP-1022", empName: "Sneha Swaminathan", days: 0, h: 9, m: 30, s: 0,
      action: "login", category: "Sessions", module: "Auth",
      desc: "Authenticated session from Finance department terminal",
      meta: { method: "Corporate Kerberos" },
      isSensitive: false
    },
    {
      empId: "EMP-1022", empName: "Sneha Swaminathan", days: 1, h: 16, m: 45, s: 0,
      action: "file_download", category: "Files", module: "Documents",
      desc: "Downloaded quarterly TDS reconciliation worksheet",
      target: { type: "Document", id: "DOC-FIN-402", name: "Q3_TDS_Reconciliation.xlsx" },
      meta: { size: "480 KB" },
      isSensitive: false
    },

    // --- FAILED ATTEMPTS & SENSITIVE ALERTS ---
    {
      empId: "EMP-1088", empName: "Pooja Patel", days: 3, h: 8, m: 50, s: 12,
      action: "failed_login", category: "Sessions", module: "Auth",
      desc: "Failed authentication attempt (Password mismatch)",
      meta: { reason: "Invalid credential token", attemptsCount: 1 },
      status: "Failed",
      isSensitive: true
    },
    {
      empId: "EMP-1042", empName: "Aarav Sharma", days: 2, h: 17, m: 15, s: 0,
      action: "check_out_early", category: "Attendance", module: "Attendance Desk",
      desc: "Early check-out recorded before 9 hours (Reason: Client on-site workshop at Hitec City)",
      meta: { reason: "Client on-site workshop at Hitec City", hoursWorked: "7.75h" },
      isSensitive: false
    }
  ];

  // Expand with additional simulated background activity across the 12 employees
  rawSeedTemplates.forEach((item, index) => {
    const timestampDate = offsetTime(item.days, item.h, item.m, item.s);
    const { device, browser } = parseDeviceAndBrowser();
    
    seedEvents.push({
      id: "AUD-SEED-" + (1000 + index),
      employeeId: item.empId,
      employeeName: item.empName,
      action: item.action,
      category: item.category,
      module: item.module,
      description: item.desc,
      target: item.target || null,
      metadata: item.meta || {},
      timestamp: formatKolkataTimestamp(timestampDate),
      iso: timestampDate.toISOString(),
      ip: getClientIP(item.empId),
      device: device,
      browser: browser,
      location: getClientLocation(item.empId),
      sessionId: `sess-${item.empId.toLowerCase()}-${item.days}`,
      status: item.status || "Success",
      isSensitive: Boolean(item.isSensitive)
    });
  });

  // Sort descending by ISO timestamp
  return seedEvents.sort((a, b) => new Date(b.iso) - new Date(a.iso));
}
