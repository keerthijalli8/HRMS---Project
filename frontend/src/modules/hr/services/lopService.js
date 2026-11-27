/**
 * Loss of Pay (LOP) Management Service
 * Manual creation, approval workflows, daily rate & deduction calculations,
 * and seamless integration with Payroll and Attendance.
 * 
 * CORE REQUIREMENT:
 * LOP must ALWAYS be manually created by HR/Admin.
 * Never automatically marked from attendance logs or leave balance.
 */

import { calculateWorkingDays } from './holidayStore.js';
import { loadAllEmployees } from './teamService.js';

export const LOP_STORAGE_KEY = "hrms_lop_records_v1";
export const LOP_EVENT_NAME = "hrms_lop_updated";

export const LOP_REASONS = [
  "Unapproved Absence",
  "Extended Leave Without Pay",
  "Disciplinary Action",
  "Exhausted Leave Balance",
  "Personal Emergency (Unpaid)",
  "Uninformed Late Entry / Missing Punch",
  "Other Unpaid Leave"
];

export const LOP_TYPES = [
  "Full Day",
  "Half Day (First Half)",
  "Half Day (Second Half)"
];

export const LOP_STATUSES = [
  "Pending Approval",
  "Approved",
  "Processed in Payroll",
  "Rejected",
  "Cancelled"
];

// Seeded sample LOP records for realistic HR enterprise demonstration mapped to canonical 12 employees
const INITIAL_LOP_RECORDS = [
  {
    id: "LOP-2026-001",
    employeeId: "EMP-1102",
    employeeName: "Rohan Varma",
    department: "Design",
    designation: "Lead Product Designer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    fromDate: "2026-11-03",
    toDate: "2026-11-04",
    lopType: "Full Day",
    lopDays: 2,
    excludeHolidaysPolicy: true,
    dailyRate: 2400,
    totalDeduction: 4800,
    reason: "Unapproved Absence",
    remarks: "Absent during sprint planning without prior communication or approved leave request.",
    payrollMonth: "November 2026",
    attachment: "absence_notice_nov3.pdf",
    attachmentSize: "245 KB",
    status: "Approved",
    createdBy: "Meera Reddy (HR Manager)",
    createdAt: "2026-11-05T10:30:00+05:30",
    approvedBy: "Meera Reddy (HR Manager)",
    approvedAt: "2026-11-06T14:15:00+05:30"
  },
  {
    id: "LOP-2026-002",
    employeeId: "EMP-1401",
    employeeName: "Ananya Roy",
    department: "Marketing",
    designation: "Staff Marketing Strategist",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    fromDate: "2026-11-09",
    toDate: "2026-11-09",
    lopType: "Half Day (Second Half)",
    lopDays: 0.5,
    excludeHolidaysPolicy: true,
    dailyRate: 2600,
    totalDeduction: 1300,
    reason: "Exhausted Leave Balance",
    remarks: "Casual leave balance exhausted for Q4; employee opted for half-day unpaid absence.",
    payrollMonth: "November 2026",
    attachment: null,
    attachmentSize: null,
    status: "Pending Approval",
    createdBy: "Pooja Patel (Senior HRBP)",
    createdAt: "2026-11-10T11:00:00+05:30"
  },
  {
    id: "LOP-2026-003",
    employeeId: "EMP-1301",
    employeeName: "Vikram Malhotra",
    department: "Sales",
    designation: "Enterprise Sales Lead",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    fromDate: "2026-10-20",
    toDate: "2026-10-22",
    lopType: "Full Day",
    lopDays: 3,
    excludeHolidaysPolicy: true,
    dailyRate: 2500,
    totalDeduction: 7500,
    reason: "Extended Leave Without Pay",
    remarks: "Extended festival travel beyond approved return date without manager consent.",
    payrollMonth: "October 2026",
    attachment: "festival_extension_log.pdf",
    attachmentSize: "512 KB",
    status: "Processed in Payroll",
    createdBy: "Meera Reddy (HR Manager)",
    createdAt: "2026-10-23T09:30:00+05:30",
    approvedBy: "Meera Reddy (HR Manager)",
    approvedAt: "2026-10-24T16:00:00+05:30",
    processedAt: "2026-10-31T18:00:00+05:30"
  },
  {
    id: "LOP-2026-004",
    employeeId: "EMP-1234",
    employeeName: "Devansh Mehta",
    department: "Engineering",
    designation: "Senior Frontend Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    fromDate: "2026-11-02",
    toDate: "2026-11-02",
    lopType: "Full Day",
    lopDays: 1,
    excludeHolidaysPolicy: true,
    dailyRate: 2200,
    totalDeduction: 2200,
    reason: "Disciplinary Action",
    remarks: "Mandatory statutory compliance audit day unattended without prior intimation.",
    payrollMonth: "November 2026",
    attachment: "compliance_audit_absence.pdf",
    attachmentSize: "310 KB",
    status: "Pending Approval",
    createdBy: "Pooja Patel (Senior HRBP)",
    createdAt: "2026-11-03T16:45:00+05:30"
  },
  {
    id: "LOP-2026-005",
    employeeId: "EMP-1145",
    employeeName: "Sneha Nair",
    department: "Engineering",
    designation: "DevOps Specialist",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    fromDate: "2026-10-15",
    toDate: "2026-10-16",
    lopType: "Full Day",
    lopDays: 2,
    excludeHolidaysPolicy: true,
    dailyRate: 3100,
    totalDeduction: 6200,
    reason: "Personal Emergency (Unpaid)",
    remarks: "Emergency medical hospitalization after paid sick leave quota exhausted.",
    payrollMonth: "October 2026",
    attachment: "medical_records_summary.pdf",
    attachmentSize: "840 KB",
    status: "Rejected",
    createdBy: "Pooja Patel (Senior HRBP)",
    createdAt: "2026-10-17T11:00:00+05:30",
    rejectedBy: "Meera Reddy (HR Manager)",
    rejectionReason: "Management approved 2 days ex-gratia special compassionate leave.",
    rejectedAt: "2026-10-18T10:15:00+05:30"
  }
];

// Helper: Read records from localStorage or seed
export function loadLopRecords() {
  try {
    const raw = localStorage.getItem(LOP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[lopService] Error loading records, fallback to initial seed:", e);
  }

  // Seed storage
  try {
    localStorage.setItem(LOP_STORAGE_KEY, JSON.stringify(INITIAL_LOP_RECORDS));
  } catch (e) {}
  return [...INITIAL_LOP_RECORDS];
}

// Helper: Save records and notify subscribers
export function saveLopRecords(records) {
  try {
    localStorage.setItem(LOP_STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LOP_EVENT_NAME, { detail: { records } }));
    }
  } catch (e) {
    console.error("[lopService] Failed to save LOP records:", e);
  }
}

// Subscribe to LOP changes
export function subscribeLop(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    callback(loadLopRecords());
  };
  window.addEventListener(LOP_EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LOP_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Calculate standard employee daily rate for LOP calculations
 * Indian IT Standard: Monthly Basic / 30
 */
export function calculateEmployeeDailyRate(employee) {
  if (!employee) return 2000;
  
  let basic = 145000;
  if (employee?.salary) {
    const match = String(employee.salary).match(/₹?([\d.]+)\s*L/);
    if (match) {
      const annualLakh = parseFloat(match[1]);
      const monthlyCTC = (annualLakh * 100000) / 12;
      basic = Math.round(monthlyCTC * 0.40);
    }
  } else if (typeof employee?.basicSalary === "number") {
    basic = employee.basicSalary;
  }
  
  return Math.round(basic / 30);
}

/**
 * Calculate working LOP days between two dates
 * Optionally accounts for weekly offs and company holidays via holidayStore
 */
export function calculateLopDays(fromDate, toDate, lopType = "Full Day", excludeHolidaysPolicy = true, location = "All India") {
  if (!fromDate || !toDate) return 0;
  if (fromDate > toDate) return 0;

  let days = 0;
  if (excludeHolidaysPolicy) {
    // Exclude weekends & active official company holidays
    days = calculateWorkingDays(fromDate, toDate, location);
  } else {
    // Pure calendar days
    const start = new Date(`${fromDate}T00:00:00+05:30`);
    const end = new Date(`${toDate}T00:00:00+05:30`);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  if (lopType.includes("Half Day")) {
    return days * 0.5;
  }

  return days;
}

/**
 * Filter LOP records
 */
export function getLopRecords(filters = {}) {
  const records = loadLopRecords();
  return records.filter(item => {
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchName = (item.employeeName || "").toLowerCase().includes(q);
      const matchId = (item.employeeId || "").toLowerCase().includes(q);
      const matchLopId = (item.id || "").toLowerCase().includes(q);
      const matchReason = (item.reason || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchLopId && !matchReason) return false;
    }

    if (filters.department && filters.department !== "All") {
      if (item.department !== filters.department) return false;
    }

    if (filters.status && filters.status !== "All") {
      if (item.status !== filters.status) return false;
    }

    if (filters.payrollMonth && filters.payrollMonth !== "All") {
      if (item.payrollMonth !== filters.payrollMonth) return false;
    }

    if (filters.lopType && filters.lopType !== "All") {
      if (!item.lopType.startsWith(filters.lopType)) return false;
    }

    return true;
  });
}

/**
 * Get LOP summary metrics for Dashboard cards
 */
export function getLopSummary(payrollMonth = "November 2026") {
  const records = loadLopRecords();
  
  // All-time and month-specific metrics
  const monthRecords = payrollMonth === "All" 
    ? records 
    : records.filter(r => r.payrollMonth === payrollMonth);

  const approvedOrProcessed = monthRecords.filter(
    r => r.status === "Approved" || r.status === "Processed in Payroll"
  );

  const totalRecords = monthRecords.length;
  const totalDays = approvedOrProcessed.reduce((acc, r) => acc + (Number(r.lopDays) || 0), 0);
  const totalDeductions = approvedOrProcessed.reduce((acc, r) => acc + (Number(r.totalDeduction) || 0), 0);
  const pendingApprovals = records.filter(r => r.status === "Pending Approval").length;
  const approvedRecords = monthRecords.filter(r => r.status === "Approved").length;

  return {
    totalRecords,
    totalDays: Number(totalDays.toFixed(1)),
    pendingApprovals,
    approvedRecords,
    totalDeductions,
    totalRecordsAllTime: records.length,
    allPendingApprovals: pendingApprovals
  };
}

/**
 * Get Monthly statistics for charts and trend cards
 */
export function getMonthlyLopStats() {
  const records = loadLopRecords();
  const monthsMap = new Map();

  // Known recent months
  const defaultMonths = ["September 2026", "October 2026", "November 2026", "December 2026"];
  defaultMonths.forEach(m => {
    monthsMap.set(m, { month: m, totalRecords: 0, totalDays: 0, totalDeduction: 0, approvedCount: 0 });
  });

  records.forEach(r => {
    const m = r.payrollMonth || "November 2026";
    if (!monthsMap.has(m)) {
      monthsMap.set(m, { month: m, totalRecords: 0, totalDays: 0, totalDeduction: 0, approvedCount: 0 });
    }
    const stat = monthsMap.get(m);
    stat.totalRecords++;
    if (r.status === "Approved" || r.status === "Processed in Payroll") {
      stat.totalDays += Number(r.lopDays) || 0;
      stat.totalDeduction += Number(r.totalDeduction) || 0;
      stat.approvedCount++;
    }
  });

  return Array.from(monthsMap.values());
}

/**
 * Get Department-wise breakdown for overview & reports
 */
export function getDepartmentLopSummary(payrollMonth = "November 2026") {
  const records = loadLopRecords();
  const filtered = payrollMonth === "All"
    ? records
    : records.filter(r => r.payrollMonth === payrollMonth);

  const deptMap = new Map();
  filtered.forEach(r => {
    const dept = r.department || "Other";
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        department: dept,
        affectedEmployees: new Set(),
        totalDays: 0,
        totalDeduction: 0,
        recordCount: 0
      });
    }
    const d = deptMap.get(dept);
    d.recordCount++;
    d.affectedEmployees.add(r.employeeId);
    if (r.status === "Approved" || r.status === "Processed in Payroll") {
      d.totalDays += Number(r.lopDays) || 0;
      d.totalDeduction += Number(r.totalDeduction) || 0;
    }
  });

  return Array.from(deptMap.values()).map(d => ({
    department: d.department,
    employeeCount: d.affectedEmployees.size,
    totalDays: Number(d.totalDays.toFixed(1)),
    totalDeduction: d.totalDeduction,
    recordCount: d.recordCount
  })).sort((a, b) => b.totalDeduction - a.totalDeduction);
}

/**
 * Get pending approvals count for sidebar badge
 */
export function getPendingLopCount() {
  const records = loadLopRecords();
  return records.filter(r => r.status === "Pending Approval").length;
}

/**
 * Manually Create a new LOP record (HR/Admin only)
 */
export function createLopRecord(payload, currentUser) {
  // Validate caller permissions
  const role = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
  const isHRorAdmin = role.includes("hr") || role.includes("admin") || role.includes("director");
  if (!isHRorAdmin) {
    return { ok: false, error: "Unauthorized: Only HR or Admin can manually create LOP records." };
  }

  // Validate mandatory fields
  if (!payload.employeeId) {
    return { ok: false, error: "Please select an employee." };
  }
  if (!payload.fromDate || !payload.toDate) {
    return { ok: false, error: "From Date and To Date are required." };
  }
  if (payload.fromDate > payload.toDate) {
    return { ok: false, error: "From Date cannot be later than To Date." };
  }

  const lopDays = Number(payload.lopDays);
  if (!lopDays || lopDays <= 0) {
    return { ok: false, error: "Calculated LOP Days must be greater than 0." };
  }

  const employees = loadAllEmployees();
  const emp = employees.find(e => (e.id || e.employeeId) === payload.employeeId);
  const employeeName = emp ? (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()) : payload.employeeName || "Employee";
  const department = emp?.department || emp?.dept || payload.department || "General";
  const designation = emp?.designation || emp?.role || "Team Member";
  const avatar = emp?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

  const dailyRate = Number(payload.dailyRate) || calculateEmployeeDailyRate(emp);
  const totalDeduction = Number(payload.totalDeduction) || Math.round(lopDays * dailyRate);

  const records = loadLopRecords();
  const newId = `LOP-2026-${String(records.length + 1).padStart(3, '0')}`;

  const creatorName = currentUser?.name 
    ? `${currentUser.name} (${currentUser.role || currentUser.systemRole || 'HR'})`
    : "HR Administrator";

  const isDirectApproval = Boolean(payload.directApprove && (role.includes("manager") || role.includes("admin")));

  const newRecord = {
    id: newId,
    employeeId: payload.employeeId,
    employeeName,
    department,
    designation,
    avatar,
    fromDate: payload.fromDate,
    toDate: payload.toDate,
    lopType: payload.lopType || "Full Day",
    lopDays,
    excludeHolidaysPolicy: payload.excludeHolidaysPolicy !== false,
    dailyRate,
    totalDeduction,
    reason: payload.reason || "Unapproved Absence",
    remarks: payload.remarks || "",
    payrollMonth: payload.payrollMonth || "November 2026",
    attachment: payload.attachment || null,
    attachmentSize: payload.attachmentSize || null,
    status: isDirectApproval ? "Approved" : "Pending Approval",
    createdBy: creatorName,
    createdAt: new Date().toISOString(),
    approvedBy: isDirectApproval ? creatorName : null,
    approvedAt: isDirectApproval ? new Date().toISOString() : null
  };

  const updated = [newRecord, ...records];
  saveLopRecords(updated);

  return { ok: true, record: newRecord };
}

/**
 * Approve a pending LOP record
 */
export function approveLopRecord(id, currentUser) {
  const records = loadLopRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) {
    return { ok: false, error: "LOP record not found." };
  }

  const approverName = currentUser?.name 
    ? `${currentUser.name} (${currentUser.role || currentUser.systemRole || 'HR'})`
    : "HR Manager";

  const updatedRecord = {
    ...records[index],
    status: "Approved",
    approvedBy: approverName,
    approvedAt: new Date().toISOString()
  };

  records[index] = updatedRecord;
  saveLopRecords(records);
  return { ok: true, record: updatedRecord };
}

/**
 * Reject a pending LOP record with comments
 */
export function rejectLopRecord(id, rejectionReason, currentUser) {
  if (!rejectionReason || !rejectionReason.trim()) {
    return { ok: false, error: "Rejection reason / comments are mandatory." };
  }

  const records = loadLopRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) {
    return { ok: false, error: "LOP record not found." };
  }

  const rejecterName = currentUser?.name 
    ? `${currentUser.name} (${currentUser.role || currentUser.systemRole || 'HR'})`
    : "HR Administrator";

  const updatedRecord = {
    ...records[index],
    status: "Rejected",
    rejectionReason: rejectionReason.trim(),
    rejectedBy: rejecterName,
    rejectedAt: new Date().toISOString()
  };

  records[index] = updatedRecord;
  saveLopRecords(records);
  return { ok: true, record: updatedRecord };
}

/**
 * Cancel an LOP record
 */
export function cancelLopRecord(id, currentUser) {
  const records = loadLopRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) {
    return { ok: false, error: "LOP record not found." };
  }

  const cancellerName = currentUser?.name || "HR Admin";
  const updatedRecord = {
    ...records[index],
    status: "Cancelled",
    cancelledBy: cancellerName,
    cancelledAt: new Date().toISOString()
  };

  records[index] = updatedRecord;
  saveLopRecords(records);
  return { ok: true, record: updatedRecord };
}

/**
 * Mark LOP records as processed when payroll is executed
 */
export function markLopAsProcessed(ids = []) {
  if (!ids || ids.length === 0) return;
  const records = loadLopRecords();
  const idSet = new Set(ids);
  const now = new Date().toISOString();

  const updated = records.map(r => {
    if (idSet.has(r.id) && r.status === "Approved") {
      return { ...r, status: "Processed in Payroll", processedAt: now };
    }
    return r;
  });

  saveLopRecords(updated);
}

/**
 * Query approved LOP deduction for a given employee in a specific payCycle
 * Reused by Payroll & Payslip generation
 */
export function getApprovedLopForEmployee(employeeId, payCycle = "November 2026") {
  if (!employeeId) return { totalLopDays: 0, totalLopDeduction: 0, records: [] };

  const records = loadLopRecords();
  const empRecords = records.filter(r => 
    (r.employeeId === employeeId || r.employeeId?.toLowerCase() === employeeId?.toLowerCase()) &&
    (r.payrollMonth === payCycle || payCycle === "All") &&
    (r.status === "Approved" || r.status === "Processed in Payroll")
  );

  const totalLopDays = empRecords.reduce((acc, r) => acc + (Number(r.lopDays) || 0), 0);
  const totalLopDeduction = empRecords.reduce((acc, r) => acc + (Number(r.totalDeduction) || 0), 0);

  return {
    totalLopDays: Number(totalLopDays.toFixed(1)),
    totalLopDeduction,
    records: empRecords
  };
}

/**
 * Export LOP records to standard CSV string
 */
export function exportLopToCSV(records) {
  const headers = [
    "LOP ID",
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "From Date",
    "To Date",
    "LOP Type",
    "LOP Days",
    "Daily Rate (INR)",
    "Total Deduction (INR)",
    "Reason",
    "Payroll Month",
    "Status",
    "Created By",
    "Created At",
    "Approved/Rejected By",
    "Remarks / Notes"
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map(r => [
    escapeCsv(r.id),
    escapeCsv(r.employeeId),
    escapeCsv(r.employeeName),
    escapeCsv(r.department),
    escapeCsv(r.designation),
    escapeCsv(r.fromDate),
    escapeCsv(r.toDate),
    escapeCsv(r.lopType),
    escapeCsv(r.lopDays),
    escapeCsv(r.dailyRate),
    escapeCsv(r.totalDeduction),
    escapeCsv(r.reason),
    escapeCsv(r.payrollMonth),
    escapeCsv(r.status),
    escapeCsv(r.createdBy),
    escapeCsv(r.createdAt ? r.createdAt.substring(0, 10) : ""),
    escapeCsv(r.approvedBy || r.rejectedBy || ""),
    escapeCsv(r.remarks || r.rejectionReason || "")
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}
