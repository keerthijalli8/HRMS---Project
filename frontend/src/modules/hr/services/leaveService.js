/**
 * Central Leave Management Service for HRMS India
 * 
 * Features:
 * - Single source of truth for Leave Requests & Employee Leave Balances
 * - Synchronized with approvalStore.js, attendanceLog.js, and notificationStore.js
 * - Enforces role-based permissions (HR/Admin or reporting Manager only; cannot approve own leave)
 * - Persisted in localStorage ("hrms_leave_requests_v1", "hrms_leave_balances_v1")
 * - Broadcasts "hrms_leave_updated" and "hrms_approvals_updated" events
 */

import { addNotification } from './notificationStore.js';
import { loadApprovals, saveApprovals } from './approvalStore.js';
import { loadAttendanceStore, saveAttendanceStore } from './attendanceLog.js';
import { employeeData } from '../data/mockData.js';
import { logEvent } from './auditService.js';

const LEAVE_STORAGE_KEY = "hrms_leave_requests_v1";
const BALANCE_STORAGE_KEY = "hrms_leave_balances_v1";
const LEAVE_EVENT_NAME = "hrms_leave_updated";

// Default Leave Balances (Annual Quotas in India: Casual, Sick/Medical, Earned/Privilege)
const INITIAL_BALANCES = {
  "EMP-1042": { cl: 6, sl: 8, el: 10, total: 24 }, // Aarav Sharma
  "EMP-1001": { cl: 8, sl: 10, el: 14, total: 32 }, // Meera Reddy
  "EMP-1102": { cl: 6, sl: 8, el: 12, total: 26 }, // Rohan Varma
  "EMP-1301": { cl: 5, sl: 7, el: 11, total: 23 }, // Vikram Malhotra
  "EMP-1234": { cl: 5, sl: 8, el: 8, total: 21 },  // Devansh Mehta
  "EMP-1145": { cl: 5, sl: 6, el: 8, total: 19 },  // Sneha Nair (On Leave)
  "EMP-2002": { cl: 4, sl: 12, el: 6, total: 22 }, // Anita Desai
  "EMP-1088": { cl: 6, sl: 8, el: 12, total: 26 }, // Pooja Patel
  "EMP-1501": { cl: 6, sl: 8, el: 9, total: 23 },  // Suresh Menon
  "EMP-1401": { cl: 5, sl: 7, el: 10, total: 22 }, // Ananya Roy
  "EMP-1201": { cl: 3, sl: 5, el: 18, total: 26 }, // Kavita Rao
  "EMP-1701": { cl: 4, sl: 6, el: 6, total: 16 }   // Rhea Sen
};

// Initial Seeded Leave Requests (Pending & Decided for the 12 Canonical Employees)
const INITIAL_LEAVE_REQUESTS = [
  {
    id: "LEV-REQ-101",
    approvalStoreId: "APP-LEV-101",
    employeeId: "EMP-2002",
    employeeName: "Anita Desai",
    department: "Engineering",
    designation: "Lead DevOps & Cloud Engineer",
    leaveType: "Medical Leave",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    dates: "14 Nov – 15 Nov 2026",
    daysCount: 2,
    appliedReason: "Viral fever and doctor consultation in Hyderabad; advised 2 days bed rest",
    documentName: "Medical_Consult_Slip.pdf",
    submittedDate: "2026-11-10",
    status: "Pending", // "Pending" | "Approved" | "Rejected" | "Revoked"
    priority: "High",
    decision: null,
    approvalNote: null,
    rejectionReason: null,
    reasonDetails: null,
    decidedBy: null,
    decidedById: null,
    decidedAt: null,
    balanceBefore: 12,
    balanceAfter: null,
    isLop: false
  },
  {
    id: "LEV-REQ-102",
    approvalStoreId: "APP-LEV-102",
    employeeId: "EMP-1088",
    employeeName: "Pooja Patel",
    department: "Human Resources",
    designation: "Senior HRBP",
    leaveType: "Casual Leave",
    startDate: "2026-11-16",
    endDate: "2026-11-16",
    dates: "16 Nov 2026",
    daysCount: 1,
    appliedReason: "Attending cousin wedding reception and family celebration in Hyderabad",
    documentName: null,
    submittedDate: "2026-11-10",
    status: "Pending",
    priority: "Normal",
    decision: null,
    approvalNote: null,
    rejectionReason: null,
    reasonDetails: null,
    decidedBy: null,
    decidedById: null,
    decidedAt: null,
    balanceBefore: 6,
    balanceAfter: null,
    isLop: false
  },
  {
    id: "LEV-REQ-103",
    approvalStoreId: "APP-LEV-103",
    employeeId: "EMP-1234",
    employeeName: "Devansh Mehta",
    department: "Engineering",
    designation: "Senior Frontend Engineer",
    leaveType: "Casual Leave",
    startDate: "2026-11-18",
    endDate: "2026-11-18",
    dates: "18 Nov 2026",
    daysCount: 1,
    appliedReason: "Personal relocation and apartment documentation verification",
    documentName: null,
    submittedDate: "2026-11-11",
    status: "Pending",
    priority: "Normal",
    decision: null,
    approvalNote: null,
    rejectionReason: null,
    reasonDetails: null,
    decidedBy: null,
    decidedById: null,
    decidedAt: null,
    balanceBefore: 5,
    balanceAfter: null,
    isLop: false
  },
  {
    id: "LEV-REQ-100",
    approvalStoreId: "APP-LEV-100",
    employeeId: "EMP-1145",
    employeeName: "Sneha Nair",
    department: "Engineering",
    designation: "DevOps Specialist",
    leaveType: "Earned Leave",
    startDate: "2026-11-12",
    endDate: "2026-11-13",
    dates: "12 Nov – 13 Nov 2026",
    daysCount: 2,
    appliedReason: "Family wellness retreat and travel to hometown",
    documentName: null,
    submittedDate: "2026-11-08",
    status: "Approved",
    priority: "Normal",
    decision: "Approved",
    approvalNote: "Approved as requested. Cloud monitoring tasks handed over to Anita Desai.",
    rejectionReason: null,
    reasonDetails: null,
    decidedBy: "Meera Reddy (HR Manager)",
    decidedById: "EMP-1001",
    decidedAt: "09 Nov 2026, 03:30 PM (Asia/Kolkata)",
    balanceBefore: 10,
    balanceAfter: 8,
    isLop: false
  },
  {
    id: "LEV-REQ-099",
    approvalStoreId: "APP-LEV-099",
    employeeId: "EMP-1201",
    employeeName: "Kavita Rao",
    department: "Finance",
    designation: "Lead Payroll Accountant",
    leaveType: "Casual Leave",
    startDate: "2026-11-09",
    endDate: "2026-11-09",
    dates: "09 Nov 2026",
    daysCount: 1,
    appliedReason: "Personal banking and tax audit filing",
    documentName: null,
    submittedDate: "2026-11-07",
    status: "Rejected",
    priority: "Normal",
    decision: "Rejected",
    approvalNote: null,
    rejectionReason: "Overlapping team leaves",
    reasonDetails: "Month-end finance reconciliations require on-premise dual key sign-off.",
    decidedBy: "Meera Reddy (HR Manager)",
    decidedById: "EMP-1001",
    decidedAt: "08 Nov 2026, 11:00 AM (Asia/Kolkata)",
    balanceBefore: 3,
    balanceAfter: 3,
    isLop: false
  }
];

// Helper to format Asia/Kolkata timestamp
export function formatKolkataTimestamp(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date) + " (Asia/Kolkata)";
  } catch (e) {
    return date.toLocaleString();
  }
}

// ------------------- BALANCES STORE -------------------

export function loadLeaveBalances() {
  try {
    const raw = localStorage.getItem(BALANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { ...INITIAL_BALANCES, ...parsed };
      }
    }
  } catch (e) {
    console.error("Error reading leave balances:", e);
  }

  try {
    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(INITIAL_BALANCES));
  } catch (e) {}
  return INITIAL_BALANCES;
}

export function saveLeaveBalances(balances) {
  try {
    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(balances));
  } catch (e) {
    console.error("Error saving leave balances:", e);
  }
}

export function getEmployeeLeaveBalance(employeeId) {
  const allBalances = loadLeaveBalances();
  if (employeeId && allBalances[employeeId]) {
    return allBalances[employeeId];
  }
  // Default fallback
  return { cl: 6, sl: 8, el: 10, total: 24 };
}

export function getSpecificLeaveTypeBalance(employeeId, leaveType = "Casual Leave") {
  const bal = getEmployeeLeaveBalance(employeeId);
  const lt = (leaveType || "").toLowerCase();
  if (lt.includes("sick") || lt.includes("medical")) return bal.sl;
  if (lt.includes("casual")) return bal.cl;
  if (lt.includes("earned") || lt.includes("privilege") || lt.includes("annual")) return bal.el;
  return bal.total;
}

// ------------------- LEAVE REQUESTS STORE -------------------

export function loadLeaveRequests() {
  try {
    const raw = localStorage.getItem(LEAVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading leave requests:", e);
  }

  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(INITIAL_LEAVE_REQUESTS));
  } catch (e) {}
  return INITIAL_LEAVE_REQUESTS;
}

export function saveLeaveRequests(requests) {
  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(requests));
    notifyLeaveUpdated();
    return true;
  } catch (e) {
    console.error("Error saving leave requests:", e);
    return false;
  }
}

export function notifyLeaveUpdated() {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(LEAVE_EVENT_NAME));
      window.dispatchEvent(new CustomEvent("hrms_approvals_updated"));
    } catch (e) {}
  }
}

export function subscribeLeave(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LEAVE_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LEAVE_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getPendingLeaveRequests() {
  const all = loadLeaveRequests();
  return all.filter(r => r.status === "Pending");
}

export function getDecidedLeaveRequests() {
  const all = loadLeaveRequests();
  return all.filter(r => r.status !== "Pending");
}

export function getPendingLeaveCount() {
  return getPendingLeaveRequests().length;
}

// ------------------- PERMISSIONS & RULES -------------------

/**
 * Checks if currentUser has authorization to approve/reject this leave request.
 * Rules:
 * 1. A user CANNOT approve or reject their own leave.
 * 2. HR / HR Manager / Admin / Super Admin can approve all leaves.
 * 3. Reporting Manager / Team Lead can approve leaves for direct reports or team.
 * 4. Regular employees cannot approve.
 */
export function canUserApproveLeave(currentUser, leaveRequest) {
  if (!currentUser || !leaveRequest) return false;

  const currentEmpId = (currentUser.employeeId || currentUser.id || "").trim().toLowerCase();
  const targetEmpId = (leaveRequest.employeeId || "").trim().toLowerCase();

  // Rule 1: A person cannot approve their own leave
  if (currentEmpId && targetEmpId && currentEmpId === targetEmpId) {
    return false;
  }

  const role = (currentUser.systemRole || currentUser.role || "").trim().toLowerCase();

  // Rule 2: HR / Admin authority
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

  // Rule 3: Manager / Lead authority
  if (role.includes("manager") || role.includes("lead")) {
    // Check if target employee reports to this manager
    const empMatch = employeeData.find(e => (e.id || e.employeeId) === leaveRequest.employeeId);
    if (empMatch && empMatch.reportingToId && empMatch.reportingToId.toLowerCase() === currentEmpId) {
      return true;
    }
    // Or same department
    const userDept = (currentUser.dept || currentUser.department || "").toLowerCase();
    const reqDept = (leaveRequest.department || "").toLowerCase();
    return Boolean(userDept && reqDept && userDept === reqDept);
  }

  return false;
}

// ------------------- ATTENDANCE CALENDAR MARKING -------------------

function markAttendanceCalendarForLeave(employeeId, startDate, endDate) {
  if (!employeeId || !startDate) return;
  try {
    const store = loadAttendanceStore();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);

    // Loop through all dates inclusive
    const cur = new Date(start);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      if (!store[dateKey]) store[dateKey] = {};
      store[dateKey][employeeId] = {
        sessions: [],
        breaks: [],
        status: "On Leave",
        mode: "leave",
        autoCreated: true,
        note: "Approved Enterprise Leave",
        updatedAt: new Date().toISOString()
      };

      cur.setDate(cur.getDate() + 1);
    }

    saveAttendanceStore(store);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hrms_attendance_updated"));
    }
  } catch (e) {
    console.error("Error marking attendance for leave:", e);
  }
}

// ------------------- ACTIONS: APPROVE, REJECT, REVOKE -------------------

/**
 * Approve a leave request with mandatory approval note and balance deduction.
 */
export function approveLeaveRequest(requestId, approver, { note = "", isLop = false } = {}) {
  const trimmedNote = (note || "").trim();
  if (!trimmedNote || trimmedNote.length < 5) {
    return { ok: false, error: "Approval note is required (minimum 5 characters)." };
  }

  const requests = loadLeaveRequests();
  const idx = requests.findIndex(r => r.id === requestId || r.approvalStoreId === requestId);
  if (idx === -1) {
    return { ok: false, error: "Leave request not found." };
  }

  const req = requests[idx];

  // Conflict check: already decided?
  if (req.status !== "Pending") {
    return {
      ok: false,
      conflict: true,
      error: `This request was already processed (${req.status} by ${req.decidedBy || 'another approver'}).`
    };
  }

  // Permission check
  if (!canUserApproveLeave(approver, req)) {
    return { ok: false, error: "You do not have permission to approve this leave request." };
  }

  // Balance calculation
  const balances = loadLeaveBalances();
  const empBal = balances[req.employeeId] || { cl: 6, sl: 8, el: 10, total: 24 };
  const specificBal = getSpecificLeaveTypeBalance(req.employeeId, req.leaveType);

  // Insufficient balance warning check
  if (specificBal < req.daysCount && !isLop) {
    return {
      ok: false,
      insufficientBalance: true,
      error: `Insufficient leave balance (${specificBal} days available, ${req.daysCount} days requested). Please select 'Approve as Loss of Pay' or reject.`
    };
  }

  const approverName = approver?.name || (typeof approver === 'string' ? approver : "HR Administrator");
  const approverRole = approver?.systemRole || approver?.role || "HR";
  const approverId = approver?.employeeId || approver?.id || "EMP-HR";
  const nowFormatted = formatKolkataTimestamp();
  const nowIso = new Date().toISOString();

  // Deduct balance if not LOP
  let newSpecificBal = specificBal;
  if (!isLop) {
    const lt = (req.leaveType || "").toLowerCase();
    if (lt.includes("sick") || lt.includes("medical")) {
      empBal.sl = Math.max(0, empBal.sl - req.daysCount);
      newSpecificBal = empBal.sl;
    } else if (lt.includes("casual")) {
      empBal.cl = Math.max(0, empBal.cl - req.daysCount);
      newSpecificBal = empBal.cl;
    } else {
      empBal.el = Math.max(0, empBal.el - req.daysCount);
      newSpecificBal = empBal.el;
    }
    empBal.total = empBal.cl + empBal.sl + empBal.el;
    balances[req.employeeId] = empBal;
    saveLeaveBalances(balances);
  }

  // Update request record
  req.status = "Approved";
  req.decision = "Approved";
  req.approvalNote = trimmedNote;
  req.decidedBy = `${approverName} (${approverRole})`;
  req.decidedById = approverId;
  req.decidedAt = nowFormatted;
  req.decidedIso = nowIso;
  req.balanceBefore = specificBal;
  req.balanceAfter = newSpecificBal;
  req.isLop = Boolean(isLop);

  requests[idx] = req;
  saveLeaveRequests(requests);

  // Mark employee attendance calendar
  markAttendanceCalendarForLeave(req.employeeId, req.startDate, req.endDate);

  // Sync with approvalStore.js
  try {
    const approvals = loadApprovals();
    const appIdx = approvals.findIndex(a => a.id === req.approvalStoreId || (a.employeeId === req.employeeId && a.type === "Leave Requests" && a.status === "Pending"));
    if (appIdx !== -1) {
      approvals[appIdx].status = "Approved";
      approvals[appIdx].reviewedBy = req.decidedBy;
      approvals[appIdx].reviewedAt = nowIso;
      approvals[appIdx].reviewComments = req.approvalNote;
      saveApprovals(approvals);
    }
  } catch (e) {}

  // Send Notification to Employee
  try {
    addNotification({
      title: `Leave Approved: ${req.leaveType} (${req.daysCount} ${req.daysCount === 1 ? 'Day' : 'Days'})`,
      desc: `Approved by ${approverName}. Note: "${trimmedNote}"${isLop ? ' (Recorded as Loss of Pay)' : ''}`,
      icon: "check",
      type: "leave",
      targetEmployeeId: req.employeeId
    });
  } catch (e) {}

  // Record In-App Audit Event
  try {
    logEvent({
      action: "approve_leave",
      category: "Approvals",
      module: "Leave Desk",
      description: `Approved leave ${req.id} for ${req.employeeName} (${req.daysCount} ${req.daysCount === 1 ? 'Day' : 'Days'} ${req.leaveType})`,
      target: { type: "Leave", id: req.id, name: req.employeeName },
      metadata: {
        note: trimmedNote,
        isLop: Boolean(isLop),
        daysCount: req.daysCount,
        leaveType: req.leaveType,
        balanceBefore: specificBal,
        balanceAfter: newSpecificBal
      },
      user: approver,
      status: "Success"
    });
  } catch (e) {}

  return {
    ok: true,
    request: req,
    balanceAfter: newSpecificBal
  };
}

/**
 * Reject a leave request with mandatory rejection reason and detailed justification.
 */
export function rejectLeaveRequest(requestId, approver, { rejectionReason, reasonDetails } = {}) {
  if (!rejectionReason || !rejectionReason.trim()) {
    return { ok: false, error: "Please select a rejection reason." };
  }
  const trimmedDetails = (reasonDetails || "").trim();
  if (!trimmedDetails || trimmedDetails.length < 10) {
    return { ok: false, error: "Rejection details are required (minimum 10 characters)." };
  }

  const requests = loadLeaveRequests();
  const idx = requests.findIndex(r => r.id === requestId || r.approvalStoreId === requestId);
  if (idx === -1) {
    return { ok: false, error: "Leave request not found." };
  }

  const req = requests[idx];

  // Conflict check: already decided?
  if (req.status !== "Pending") {
    return {
      ok: false,
      conflict: true,
      error: `This request was already processed (${req.status} by ${req.decidedBy || 'another approver'}).`
    };
  }

  // Permission check
  if (!canUserApproveLeave(approver, req)) {
    return { ok: false, error: "You do not have permission to reject this leave request." };
  }

  const approverName = approver?.name || (typeof approver === 'string' ? approver : "HR Administrator");
  const approverRole = approver?.systemRole || approver?.role || "HR";
  const approverId = approver?.employeeId || approver?.id || "EMP-HR";
  const nowFormatted = formatKolkataTimestamp();
  const nowIso = new Date().toISOString();
  const specificBal = getSpecificLeaveTypeBalance(req.employeeId, req.leaveType);

  // Update request record (Balance is NOT deducted)
  req.status = "Rejected";
  req.decision = "Rejected";
  req.rejectionReason = rejectionReason.trim();
  req.reasonDetails = trimmedDetails;
  req.reviewComments = `${rejectionReason.trim()}: ${trimmedDetails}`;
  req.decidedBy = `${approverName} (${approverRole})`;
  req.decidedById = approverId;
  req.decidedAt = nowFormatted;
  req.decidedIso = nowIso;
  req.balanceBefore = specificBal;
  req.balanceAfter = specificBal;

  requests[idx] = req;
  saveLeaveRequests(requests);

  // Sync with approvalStore.js
  try {
    const approvals = loadApprovals();
    const appIdx = approvals.findIndex(a => a.id === req.approvalStoreId || (a.employeeId === req.employeeId && a.type === "Leave Requests" && a.status === "Pending"));
    if (appIdx !== -1) {
      approvals[appIdx].status = "Rejected";
      approvals[appIdx].reviewedBy = req.decidedBy;
      approvals[appIdx].reviewedAt = nowIso;
      approvals[appIdx].reviewComments = req.reviewComments;
      saveApprovals(approvals);
    }
  } catch (e) {}

  // Send Notification to Employee
  try {
    addNotification({
      title: `Leave Rejected: ${req.leaveType} (${req.daysCount} ${req.daysCount === 1 ? 'Day' : 'Days'})`,
      desc: `Rejected by ${approverName}. Reason: "${rejectionReason.trim()} — ${trimmedDetails}"`,
      icon: "alert-triangle",
      type: "leave",
      targetEmployeeId: req.employeeId
    });
  } catch (e) {}

  // Record In-App Audit Event
  try {
    logEvent({
      action: "reject_leave",
      category: "Approvals",
      module: "Leave Desk",
      description: `Rejected leave ${req.id} for ${req.employeeName} (Reason: ${rejectionReason.trim()})`,
      target: { type: "Leave", id: req.id, name: req.employeeName },
      metadata: {
        rejectionReason: rejectionReason.trim(),
        reasonDetails: trimmedDetails,
        daysCount: req.daysCount,
        leaveType: req.leaveType
      },
      user: approver,
      status: "Success"
    });
  } catch (e) {}

  return {
    ok: true,
    request: req
  };
}

/**
 * Revoke an approved leave request (HR/Admin only), restoring the deducted balance.
 */
export function revokeLeaveRequest(requestId, approver, { revokeReason = "" } = {}) {
  const trimmedReason = (revokeReason || "").trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    return { ok: false, error: "A valid revocation reason is required (minimum 5 characters)." };
  }

  const requests = loadLeaveRequests();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return { ok: false, error: "Leave request not found." };
  }

  const req = requests[idx];
  if (req.status !== "Approved") {
    return { ok: false, error: "Only approved leave requests can be revoked." };
  }

  // Restore balance if not LOP
  if (!req.isLop) {
    const balances = loadLeaveBalances();
    const empBal = balances[req.employeeId] || { cl: 6, sl: 8, el: 10, total: 24 };
    const lt = (req.leaveType || "").toLowerCase();
    if (lt.includes("sick") || lt.includes("medical")) {
      empBal.sl += req.daysCount;
    } else if (lt.includes("casual")) {
      empBal.cl += req.daysCount;
    } else {
      empBal.el += req.daysCount;
    }
    empBal.total = empBal.cl + empBal.sl + empBal.el;
    balances[req.employeeId] = empBal;
    saveLeaveBalances(balances);
  }

  const approverName = approver?.name || "HR Administrator";
  const nowFormatted = formatKolkataTimestamp();

  req.status = "Revoked";
  req.decision = "Revoked";
  req.revokeReason = trimmedReason;
  req.revokedBy = approverName;
  req.revokedAt = nowFormatted;

  requests[idx] = req;
  saveLeaveRequests(requests);

  // Send Notification to Employee
  try {
    addNotification({
      title: `Leave Revoked: ${req.leaveType} (${req.daysCount} Days)`,
      desc: `Your approved leave was revoked by ${approverName}. Reason: "${trimmedReason}". Balance restored.`,
      icon: "alert-triangle",
      type: "leave",
      targetEmployeeId: req.employeeId
    });
  } catch (e) {}

  // Record In-App Audit Event
  try {
    logEvent({
      action: "revoke_leave",
      category: "Approvals",
      module: "Leave Desk",
      description: `Revoked previously approved leave ${req.id} for ${req.employeeName}`,
      target: { type: "Leave", id: req.id, name: req.employeeName },
      metadata: { revokeReason: trimmedReason, daysCount: req.daysCount },
      user: approver,
      status: "Success",
      isSensitive: true
    });
  } catch (e) {}

  return { ok: true, request: req };
}

/**
 * Submit a new leave application
 */
export function applyLeave(formData, currentUser) {
  if (!formData.startDate) {
    return { ok: false, error: "Start date is required." };
  }
  if (!formData.reason || formData.reason.trim().length < 5) {
    return { ok: false, error: "Please provide a valid reason (minimum 5 characters)." };
  }

  const requests = loadLeaveRequests();
  const nextNum = 1000 + requests.length + 1;
  const newId = `LEV-2026-${nextNum}`;

  const empId = formData.employeeId || currentUser?.employeeId || "EMP-1234";
  const empName = formData.employeeName || currentUser?.name || "Employee";
  const dept = formData.department || currentUser?.dept || "Engineering";
  const leaveType = formData.leaveType || "Casual Leave";
  const daysCount = Number(formData.daysCount) || 1;

  const currentBal = getSpecificLeaveTypeBalance(empId, leaveType);

  const newRequest = {
    id: newId,
    approvalStoreId: `appr-${newId.toLowerCase()}`,
    employeeId: empId,
    employeeName: empName,
    department: dept,
    leaveType,
    startDate: formData.startDate,
    endDate: formData.endDate || formData.startDate,
    daysCount,
    reason: formData.reason.trim(),
    appliedReason: formData.reason.trim(),
    submittedDate: formData.startDate,
    submittedAt: formatKolkataTimestamp(),
    status: "Pending",
    priority: formData.priority || "Normal",
    decision: null,
    approvalNote: null,
    rejectionReason: null,
    handoverTo: formData.handoverTo || null,
    balanceBefore: currentBal
  };

  requests.unshift(newRequest);
  saveLeaveRequests(requests);

  // Sync to approvalStore
  try {
    const approvals = loadApprovals();
    approvals.unshift({
      id: newRequest.approvalStoreId,
      type: "Leave Requests",
      employeeId: empId,
      employeeName: empName,
      department: dept,
      designation: currentUser?.role || "Staff",
      requestDate: newRequest.submittedDate,
      status: "Pending",
      details: `${leaveType} (${daysCount} ${daysCount === 1 ? 'Day' : 'Days'}): ${newRequest.startDate} to ${newRequest.endDate}. Reason: ${newRequest.reason}`,
      submittedAt: new Date().toISOString()
    });
    saveApprovals(approvals);
  } catch (e) {}

  // Add Notification to Managers/HR
  try {
    addNotification({
      title: `New Leave Request: ${empName}`,
      desc: `Applied for ${daysCount} ${daysCount === 1 ? 'Day' : 'Days'} ${leaveType} starting ${newRequest.startDate}`,
      icon: "calendar",
      type: "leave",
      targetEmployeeId: "EMP-1001" // Notify HR
    });
  } catch (e) {}

  // In-App Audit Event
  try {
    logEvent({
      action: "apply_leave",
      category: "Data changes",
      module: "Leave Desk",
      description: `Applied for ${daysCount} days of ${leaveType} (${newRequest.startDate} to ${newRequest.endDate})`,
      target: { type: "Leave", id: newId, name: empName },
      metadata: { leaveType, daysCount, startDate: newRequest.startDate, endDate: newRequest.endDate, reason: newRequest.reason },
      user: currentUser,
      status: "Success"
    });
  } catch (e) {}

  return { ok: true, request: newRequest, message: `Leave request ${newId} submitted for approval.` };
}
