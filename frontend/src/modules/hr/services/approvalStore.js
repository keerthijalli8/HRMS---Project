// Unified Approvals Service for HRMS India
// Manages Leave Requests, WFH Passes, Attendance Corrections, and Document Verifications.
// Storage Key: "hrms_unified_approvals_v1"
// Event: "hrms_approvals_updated"

const STORAGE_KEY = "hrms_unified_approvals_v1";
const EVENT_NAME = "hrms_approvals_updated";

export const APPROVAL_CATEGORIES = [
  "Leave Requests",
  "WFH Requests",
  "Attendance Corrections",
  "Document Verification"
];

// Initial 7 Pending Requests + Approved/Rejected history for comprehensive demonstration
export const INITIAL_APPROVALS = [
  {
    id: "APP-LEV-101",
    type: "Leave Requests",
    employeeId: "EMP-2002",
    employeeName: "Anita Desai",
    department: "Engineering",
    role: "Lead DevOps & Cloud Engineer",
    submittedDate: "2026-11-10",
    dates: "14 Nov – 15 Nov 2026 (2 Days)",
    title: "Medical Leave (2 Days)",
    reason: "Viral fever and doctor consultation in Hyderabad; advised 2 days bed rest",
    documentName: "Medical_Consult_Slip.pdf",
    status: "Pending", // "Pending" | "Approved" | "Rejected"
    priority: "High",
    approverRoleNeeded: "Manager",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-LEV-102",
    type: "Leave Requests",
    employeeId: "EMP-1088",
    employeeName: "Pooja Patel",
    department: "Human Resources",
    role: "Senior HRBP",
    submittedDate: "2026-11-10",
    dates: "16 Nov 2026 (1 Day)",
    title: "Casual Leave (1 Day)",
    reason: "Attending cousin wedding reception and family celebration in Hyderabad",
    documentName: null,
    status: "Pending",
    priority: "Normal",
    approverRoleNeeded: "HR Manager",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-LEV-103",
    type: "Leave Requests",
    employeeId: "EMP-1234",
    employeeName: "Devansh Mehta",
    department: "Engineering",
    role: "Senior Frontend Engineer",
    submittedDate: "2026-11-11",
    dates: "18 Nov 2026 (1 Day)",
    title: "Casual Leave (1 Day)",
    reason: "Personal relocation and apartment documentation verification",
    documentName: null,
    status: "Pending",
    priority: "Normal",
    approverRoleNeeded: "Manager",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-WFH-201",
    type: "WFH Requests",
    employeeId: "EMP-1102",
    employeeName: "Rohan Varma",
    department: "Design",
    role: "Lead Product Designer",
    submittedDate: "2026-11-10",
    dates: "13 Nov 2026 (Full Day)",
    title: "Full Day Remote Work",
    reason: "Fiber broadband maintenance and router installation scheduled at residence",
    documentName: "ISP_Receipt_Schedule.pdf",
    status: "Pending",
    priority: "Normal",
    approverRoleNeeded: "Manager",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-WFH-202",
    type: "WFH Requests",
    employeeId: "EMP-1401",
    employeeName: "Ananya Roy",
    department: "Marketing",
    role: "Staff Marketing Strategist",
    submittedDate: "2026-11-09",
    dates: "14 Nov – 15 Nov 2026 (2 Days)",
    title: "Extended Remote Pass (2 Days)",
    reason: "Digital marketing webinar presentation and quiet focus sprint",
    documentName: null,
    status: "Pending",
    priority: "High",
    approverRoleNeeded: "Manager",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-ATT-301",
    type: "Attendance Corrections",
    employeeId: "EMP-1301",
    employeeName: "Vikram Malhotra",
    department: "Sales",
    role: "Enterprise Sales Lead",
    submittedDate: "2026-11-10",
    dates: "10 Nov 2026",
    title: "WFO Geofence Discrepancy Override",
    reason: "Client meeting on-site at Gachibowli Financial District; check-in flagged outside office perimeter",
    documentName: "Client_Meeting_Itinerary.pdf",
    status: "Pending",
    priority: "High",
    approverRoleNeeded: "HR",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-ATT-302",
    type: "Attendance Corrections",
    employeeId: "EMP-1501",
    employeeName: "Suresh Menon",
    department: "Operations",
    role: "Principal Operations Specialist",
    submittedDate: "2026-11-09",
    dates: "09 Nov 2026",
    title: "Biometric Regularization (Missed Check-in)",
    reason: "Turnstile card reader malfunction at Main Gate; reported to IT desk at 09:18 AM",
    documentName: null,
    status: "Pending",
    priority: "Normal",
    approverRoleNeeded: "HR",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  {
    id: "APP-DOC-401",
    type: "Document Verification",
    employeeId: "CAN-105",
    employeeName: "Rahul Deshmukh",
    department: "Engineering",
    role: "DevOps Engineer (Candidate)",
    submittedDate: "2026-11-08",
    dates: "Round 1 Verification",
    title: "Identity & Degree Credentials Review",
    reason: "Uploaded Aadhaar card, PAN, and B.Tech degree transcripts for joining verification",
    documentName: "Degree_Aadhaar_Pack.pdf",
    status: "Pending",
    priority: "Urgent",
    approverRoleNeeded: "HR",
    reviewedBy: null,
    reviewedAt: null,
    reviewComments: null
  },
  // Sample already-approved & rejected historical records
  {
    id: "APP-WFH-200",
    type: "WFH Requests",
    employeeId: "EMP-1042",
    employeeName: "Aarav Sharma",
    department: "Engineering",
    role: "Staff Architect",
    submittedDate: "2026-11-08",
    dates: "09 Nov 2026 (1 Day)",
    title: "Full Day Remote Work",
    reason: "Pre-scheduled home renovation work",
    documentName: null,
    status: "Approved",
    priority: "Normal",
    approverRoleNeeded: "Manager",
    reviewedBy: "Meera Reddy (HR Manager)",
    reviewedAt: "2026-11-08T17:30:00+05:30",
    reviewComments: "Approved per hybrid team roster."
  },
  {
    id: "APP-LEV-099",
    type: "Leave Requests",
    employeeId: "EMP-1022",
    employeeName: "Sneha Swaminathan",
    department: "Finance",
    role: "Senior Financial Analyst",
    submittedDate: "2026-11-07",
    dates: "09 Nov 2026 (1 Day)",
    title: "Casual Leave (1 Day)",
    reason: "Personal banking and tax audit filing",
    documentName: null,
    status: "Rejected",
    priority: "Normal",
    approverRoleNeeded: "Manager",
    reviewedBy: "Meera Reddy (HR Manager)",
    reviewedAt: "2026-11-08T11:00:00+05:30",
    reviewComments: "Month-end finance reconciliations require on-premise dual key sign-off."
  }
];

// Broadcast updates across components & tabs
export function notifyApprovalsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

// Subscribe to approval store updates
export function subscribeApprovals(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

// Load all approvals from localStorage (or initialize with default 7 pending items)
export function loadApprovals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading approvals store:", e);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPROVALS));
  } catch (e) {}
  return INITIAL_APPROVALS;
}

// Save all approvals to localStorage
export function saveApprovals(approvalsList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(approvalsList));
    notifyApprovalsUpdated();
    return true;
  } catch (e) {
    console.error("Error saving approvals store:", e);
    return false;
  }
}

// Get live summary statistics
export function getApprovalStats() {
  const list = loadApprovals();
  const pendingItems = list.filter(item => item.status === "Pending");

  const totalPending = pendingItems.length;
  const leavePending = pendingItems.filter(i => i.type === "Leave Requests").length;
  const wfhPending = pendingItems.filter(i => i.type === "WFH Requests").length;
  const attendancePending = pendingItems.filter(i => i.type === "Attendance Corrections").length;
  const docPending = pendingItems.filter(i => i.type === "Document Verification").length;

  return {
    totalPending,
    leavePending,
    wfhPending,
    attendancePending,
    docPending,
    totalApproved: list.filter(i => i.status === "Approved").length,
    totalRejected: list.filter(i => i.status === "Rejected").length
  };
}

// Check if user has permission to review a request
export function canUserApproveRequest(currentUser, request) {
  if (!currentUser) return false;
  const sysRole = (currentUser.systemRole || currentUser.role || "").trim().toLowerCase();

  // Super Admin / HR Manager / HR have broad approval authority
  if (sysRole === "admin" || sysRole === "hr manager" || sysRole === "super admin" || sysRole.includes("admin")) {
    return true;
  }
  if (sysRole === "hr" || sysRole.includes("hr")) {
    return true;
  }

  // Manager / Team Lead can approve requests in their department or team
  if (sysRole === "manager" || sysRole.includes("manager") || sysRole.includes("lead")) {
    if (request.type === "Leave Requests" || request.type === "WFH Requests") {
      // Check if employee is in the same department
      const userDept = (currentUser.dept || "").toLowerCase();
      const reqDept = (request.department || "").toLowerCase();
      return !userDept || userDept === reqDept || userDept.includes("eng");
    }
    return false;
  }

  // Regular employees cannot approve others' requests
  return false;
}

// Execute approval of a request
export function approveRequest(requestId, reviewer, comments = "") {
  const list = loadApprovals();
  const idx = list.findIndex(item => item.id === requestId);
  if (idx === -1) return { ok: false, error: "Request not found" };

  const reviewerName = reviewer?.name || (typeof reviewer === "string" ? reviewer : "HR Desk");
  const reviewerRole = reviewer?.systemRole || reviewer?.role || "Approver";
  const nowIso = new Date().toISOString();

  list[idx].status = "Approved";
  list[idx].reviewedBy = `${reviewerName} (${reviewerRole})`;
  list[idx].reviewedAt = nowIso;
  list[idx].reviewComments = comments || "Approved in accordance with enterprise HR policy";

  saveApprovals(list);

  // Sync with WFH Store if this is a WFH request
  try {
    const rawWfh = localStorage.getItem("hrms_wfh_requests_v1");
    if (rawWfh) {
      const wfhList = JSON.parse(rawWfh);
      const wfhIdx = wfhList.findIndex(w => w.employeeId === list[idx].employeeId && w.status === "Pending");
      if (wfhIdx !== -1) {
        wfhList[wfhIdx].status = "Approved";
        wfhList[wfhIdx].reviewedBy = list[idx].reviewedBy;
        wfhList[wfhIdx].reviewedAt = nowIso;
        localStorage.setItem("hrms_wfh_requests_v1", JSON.stringify(wfhList));
      }
    }
  } catch (e) {}

  return { ok: true, request: list[idx] };
}

// Execute rejection of a request
export function rejectRequest(requestId, reviewer, rejectionReason = "") {
  if (!rejectionReason || rejectionReason.trim().length < 3) {
    return { ok: false, error: "A valid rejection reason is required" };
  }

  const list = loadApprovals();
  const idx = list.findIndex(item => item.id === requestId);
  if (idx === -1) return { ok: false, error: "Request not found" };

  const reviewerName = reviewer?.name || (typeof reviewer === "string" ? reviewer : "HR Desk");
  const reviewerRole = reviewer?.systemRole || reviewer?.role || "Approver";
  const nowIso = new Date().toISOString();

  list[idx].status = "Rejected";
  list[idx].reviewedBy = `${reviewerName} (${reviewerRole})`;
  list[idx].reviewedAt = nowIso;
  list[idx].reviewComments = rejectionReason.trim();

  saveApprovals(list);

  // Sync with WFH Store if this is a WFH request
  try {
    const rawWfh = localStorage.getItem("hrms_wfh_requests_v1");
    if (rawWfh) {
      const wfhList = JSON.parse(rawWfh);
      const wfhIdx = wfhList.findIndex(w => w.employeeId === list[idx].employeeId && w.status === "Pending");
      if (wfhIdx !== -1) {
        wfhList[wfhIdx].status = "Rejected";
        wfhList[wfhIdx].reviewedBy = list[idx].reviewedBy;
        wfhList[wfhIdx].reviewedAt = nowIso;
        wfhList[wfhIdx].reviewerComments = rejectionReason.trim();
        localStorage.setItem("hrms_wfh_requests_v1", JSON.stringify(wfhList));
      }
    }
  } catch (e) {}

  return { ok: true, request: list[idx] };
}
