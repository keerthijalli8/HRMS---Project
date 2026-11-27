/**
 * Bonus & Incentive Management Service Layer
 * Supports selective employee bonus allocation, multi-mode calculations (fixed, percentage, custom),
 * Indian TDS impact estimates, two-step approvals, draft persistence, and payroll integration.
 */

import { loadAllEmployees } from './teamService.js';
import { isHRorAdmin } from './teamService.js';

export const BONUSES_STORAGE_KEY = "hrms_bonuses_v1";
export const BONUS_DRAFT_KEY = "hrms_bonus_draft_v1";
export const BONUS_EVENT_NAME = "hrms_bonus_updated";

// Configurable corporate approval limit (₹5,00,000 / 5 Lakhs INR)
export const BONUS_APPROVAL_LIMIT = 500000;

export const BONUS_TYPES = [
  { id: "Performance", label: "Performance Bonus", hint: "KPI and quarterly appraisal achievement" },
  { id: "Festival / Diwali", label: "Festival / Diwali Bonus", hint: "Festive celebration corporate bonus" },
  { id: "Annual", label: "Annual Variable Pay", hint: "Year-end performance & company profit share" },
  { id: "Referral", label: "Employee Referral Bonus", hint: "Candidate hiring and talent acquisition reward" },
  { id: "Spot Award", label: "Spot Award", hint: "Instant peer/leadership recognition award" },
  { id: "Retention", label: "Retention Bonus", hint: "Critical project milestone and loyalty payout" },
  { id: "Other", label: "Other Discretionary Bonus", hint: "Management discretionary reward" }
];

export const PAY_CYCLES = [
  "November 2026",
  "December 2026",
  "January 2027",
  "Q3 FY26-27",
  "Annual FY26-27"
];

// Seeded corporate bonus history
const SEEDED_BONUSES = [
  {
    id: "BONUS-OCT26-01",
    name: "Diwali Festive Bonus 2026",
    type: "Festival / Diwali",
    reason: "Annual festive celebration bonus for engineering and operations teams.",
    payCycle: "October 2026",
    amountMode: "fixed",
    fixedAmount: 30000,
    paymentTiming: "payroll",
    paymentDate: "2026-10-31",
    items: [
      { employeeId: "EMP-1042", employeeName: "Aarav Sharma", department: "Engineering", basic: 65000, amount: 30000, tds: 3000, net: 27000 },
      { employeeId: "EMP-1088", employeeName: "Pooja Patel", department: "Human Resources", basic: 58000, amount: 30000, tds: 3000, net: 27000 },
      { employeeId: "EMP-1001", employeeName: "Vikram Malhotra", department: "Product", basic: 55000, amount: 30000, tds: 3000, net: 27000 },
      { employeeId: "EMP-2001", employeeName: "Rohan Verma", department: "Engineering", basic: 45000, amount: 30000, tds: 3000, net: 27000 }
    ],
    totalAmount: 120000,
    totalTds: 12000,
    totalNet: 108000,
    status: "Paid",
    createdBy: { id: "EMP-1088", name: "Pooja Patel", role: "HR Manager" },
    createdAt: "2026-10-15T10:30:00.000Z",
    updatedAt: "2026-10-25T14:20:00.000Z"
  },
  {
    id: "BONUS-SEP26-02",
    name: "Q2 Core Architecture Spot Award",
    type: "Spot Award",
    reason: "Outstanding contribution during cloud infrastructure migration to multi-region Kubernetes.",
    payCycle: "September 2026",
    amountMode: "custom",
    paymentTiming: "separate",
    paymentDate: "2026-09-30",
    items: [
      { employeeId: "EMP-1042", employeeName: "Aarav Sharma", department: "Engineering", basic: 65000, amount: 50000, tds: 5000, net: 45000 },
      { employeeId: "EMP-2001", employeeName: "Rohan Verma", department: "Engineering", basic: 45000, amount: 25000, tds: 2500, net: 22500 }
    ],
    totalAmount: 75000,
    totalTds: 7500,
    totalNet: 67500,
    status: "Paid",
    createdBy: { id: "EMP-1088", name: "Pooja Patel", role: "HR Manager" },
    createdAt: "2026-09-20T11:00:00.000Z",
    updatedAt: "2026-09-25T16:00:00.000Z"
  }
];

// ------------------- EVENT SUBSCRIPTION -------------------

export function notifyBonusStoreUpdated() {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(BONUS_EVENT_NAME));
    } catch (e) {}
  }
}

export function subscribeBonuses(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(BONUS_EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(BONUS_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

// ------------------- READ BONUSES -------------------

export function getBonuses() {
  try {
    // Check primary key first, with fallback to legacy keys if present
    const raw = localStorage.getItem(BONUSES_STORAGE_KEY) || localStorage.getItem("hrms_bonuses") || localStorage.getItem("bonuses");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[bonusService] Error loading bonuses from storage:", e);
  }

  // Seed default if empty
  try {
    localStorage.setItem(BONUSES_STORAGE_KEY, JSON.stringify(SEEDED_BONUSES));
  } catch (e) {}
  return [...SEEDED_BONUSES];
}

export function getBonusDetail(id) {
  if (!id) return null;
  const list = getBonuses();
  return list.find(b => b.id === id) || null;
}

// ------------------- ELIGIBILITY & EMPLOYEE ROSTER -------------------

export function getEligibleEmployees(filters = {}) {
  const allEmployees = loadAllEmployees();
  const {
    search = "",
    department = "All",
    designation = "All",
    experienceLevel = "All",
    employmentType = "All",
    status = "All",
    includeIneligible = false
  } = filters;

  const enriched = allEmployees.map(emp => {
    const s = (emp.status || "Active").toLowerCase();
    const type = (emp.employmentType || "Full-Time").toLowerCase();
    const exp = Number(emp.totalExperienceYears) || 0;

    let isEligible = true;
    let ineligibilityReason = "";

    if (s === "inactive" || s === "resigned" || s === "terminated") {
      isEligible = false;
      ineligibilityReason = "Inactive employee account";
    } else if (s === "notice period" || s === "on notice") {
      isEligible = false;
      ineligibilityReason = "Serving active notice period";
    } else if (type === "intern" && exp === 0) {
      isEligible = false;
      ineligibilityReason = "Intern status requires HR override";
    }

    // Determine experience tier
    let expTier = "Mid (3-5 yrs)";
    if (exp < 2) expTier = "Junior (0-2 yrs)";
    else if (exp >= 6 && exp < 10) expTier = "Senior (6-9 yrs)";
    else if (exp >= 10) expTier = "Lead / Architect (10+ yrs)";

    // Determine basic salary approximation
    let basicSalary = 60000;
    if (emp.salaryBreakdown?.basic) {
      basicSalary = emp.salaryBreakdown.basic;
    } else if (emp.salary && typeof emp.salary === "string") {
      const match = emp.salary.match(/₹?([\d.]+)\s*L/);
      if (match) {
        const annual = parseFloat(match[1]) * 100000;
        basicSalary = Math.round((annual / 12) * 0.40);
      }
    }

    return {
      ...emp,
      id: String(emp.id || emp.employeeId),
      employeeId: String(emp.id || emp.employeeId),
      name: String(emp.name || "Employee"),
      department: typeof emp.dept === "object" ? (emp.dept?.name || "Engineering") : String(emp.dept || emp.department || "Engineering"),
      designation: typeof emp.designation === "object" ? (emp.designation?.title || "Staff Member") : String(emp.designation || "Staff Member"),
      status: emp.status || "Active",
      experienceLevel: expTier,
      basicSalary,
      isEligible,
      ineligibilityReason,
      selectable: isEligible || includeIneligible
    };
  });

  // Filter application
  return enriched.filter(emp => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchId = emp.id.toLowerCase().includes(q);
      const matchEmail = (emp.email || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail) return false;
    }

    if (department !== "All" && emp.department.toLowerCase() !== department.toLowerCase()) {
      return false;
    }

    if (designation !== "All" && emp.designation.toLowerCase() !== designation.toLowerCase()) {
      return false;
    }

    if (experienceLevel !== "All" && emp.experienceLevel !== experienceLevel) {
      return false;
    }

    if (employmentType !== "All" && (emp.employmentType || "Full-Time") !== employmentType) {
      return false;
    }

    if (status !== "All" && emp.status !== status) {
      return false;
    }

    return true;
  });
}

// ------------------- DRAFT PERSISTENCE -------------------

export function saveDraft(draftData) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      ...draftData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(BONUS_DRAFT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("[bonusService] Failed to save draft:", e);
  }
}

export function getDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BONUS_DRAFT_KEY) || localStorage.getItem("hrms_bonus_draft");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[bonusService] Failed to parse draft:", e);
  }
  return null;
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BONUS_DRAFT_KEY);
    localStorage.removeItem("hrms_bonus_draft");
  } catch (e) {}
}

// ------------------- BONUS SUMMARY STATS & CYCLES -------------------

/**
 * Computes high-level statistics for the Bonus summary row:
 * - total bonuses given this year
 * - total amount disbursed/approved this year
 * - pending approvals count & amount
 * - last bonus date (formatted in Asia/Kolkata)
 */
export function getBonusSummaryStats() {
  const list = getBonuses();
  const currentYear = new Date().getFullYear();

  // Approved or Paid bonuses this year
  const bonusesThisYear = list.filter(b => {
    if (b.status !== "Paid" && b.status !== "Approved") return false;
    const year = b.createdAt ? new Date(b.createdAt).getFullYear() : currentYear;
    return year === currentYear;
  });

  const totalBonusesGivenThisYear = bonusesThisYear.length;
  const totalAmountThisYear = bonusesThisYear.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const pendingApprovalsCount = list.filter(b => b.status === "Pending Approval").length;
  const pendingApprovalsAmount = list
    .filter(b => b.status === "Pending Approval")
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  // Latest approved/paid bonus date
  const sortedApprovedOrPaid = list
    .filter(b => (b.status === "Paid" || b.status === "Approved") && (b.createdAt || b.paymentDate))
    .sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate));

  let lastBonusDate = "No bonuses yet";
  if (sortedApprovedOrPaid.length > 0) {
    const rawDate = sortedApprovedOrPaid[0].createdAt || sortedApprovedOrPaid[0].paymentDate;
    try {
      lastBonusDate = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(new Date(rawDate));
    } catch (e) {
      lastBonusDate = String(rawDate).split("T")[0];
    }
  }

  return {
    totalBonusesGivenThisYear,
    totalAmountThisYear,
    pendingApprovalsCount,
    pendingApprovalsAmount,
    lastBonusDate
  };
}

/**
 * Returns the count of distinct employees who have an approved/paid bonus in the given pay cycle.
 */
export function getActiveBonusEmployeesCountForCycle(payCycle = "November 2026") {
  const allBonuses = getBonuses();
  const activeBonuses = allBonuses.filter(b => {
    if (b.status !== "Approved" && b.status !== "Paid") return false;
    if (payCycle && b.payCycle && b.payCycle.trim().toLowerCase() !== payCycle.trim().toLowerCase()) {
      return false;
    }
    return true;
  });

  const uniqueEmployeeIds = new Set();
  for (const bonus of activeBonuses) {
    for (const item of (bonus.items || [])) {
      if (item.employeeId && (Number(item.amount) || 0) > 0) {
        uniqueEmployeeIds.add(String(item.employeeId).trim().toLowerCase());
      }
    }
  }
  return uniqueEmployeeIds.size;
}

// ------------------- CREATE & MUTATE BONUSES -------------------

/**
 * Creates a new Bonus record with role verification, input validations,
 * and calculations for TDS and Net payable.
 */
export function createBonus(payload, currentUser) {
  // Role Guard
  if (!isHRorAdmin(currentUser)) {
    throw new Error("Access Denied: Only HR Managers or Admins can allocate bonuses.");
  }

  const {
    name,
    type = "Performance",
    reason,
    payCycle = "November 2026",
    amountMode = "fixed",
    fixedAmount = 0,
    percentageBasis = "basic",
    percentageValue = 0,
    paymentTiming = "payroll",
    paymentDate = null,
    items = [],
    status = "Approved"
  } = payload;

  if (!name || !name.trim()) {
    throw new Error("Validation Error: Bonus name is required.");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Validation Error: Remarks and justification are required.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Validation Error: At least one recipient employee must be selected.");
  }

  // Validate item integrity and no duplicates
  const seenIds = new Set();
  const validatedItems = [];
  let totalGross = 0;
  let totalTds = 0;
  let totalNet = 0;

  for (const item of items) {
    const empId = String(item.employeeId || "").trim();
    if (!empId) {
      throw new Error("Validation Error: Item missing valid Employee ID.");
    }
    if (seenIds.has(empId)) {
      throw new Error(`Validation Error: Duplicate employee ID detected: ${empId}`);
    }
    seenIds.add(empId);

    const amount = Math.round(Number(item.amount) || 0);
    if (amount <= 0) {
      throw new Error(`Validation Error: Bonus amount for employee ${empId} must be greater than ₹0.`);
    }

    // Standard Indian TDS estimate: 10% standard withholding on bonus earnings
    const tds = Math.round(Number(item.tds) || (amount * 0.10));
    const net = amount - tds;

    totalGross += amount;
    totalTds += tds;
    totalNet += net;

    validatedItems.push({
      employeeId: empId,
      employeeName: item.employeeName || "Employee",
      department: item.department || "General",
      basic: Number(item.basic) || 0,
      amount,
      tds,
      net
    });
  }

  const newBonus = {
    id: `BONUS-${Date.now().toString(36).toUpperCase()}`,
    name: name.trim(),
    type,
    reason: reason.trim(),
    payCycle,
    amountMode,
    fixedAmount: Number(fixedAmount) || 0,
    percentageBasis,
    percentageValue: Number(percentageValue) || 0,
    paymentTiming,
    paymentDate: paymentDate || (paymentTiming === "payroll" ? null : new Date().toISOString().split("T")[0]),
    items: validatedItems,
    totalAmount: totalGross,
    totalTds,
    totalNet,
    status: status || (totalGross > BONUS_APPROVAL_LIMIT ? "Pending Approval" : "Approved"),
    createdBy: {
      id: currentUser?.employeeId || currentUser?.id || "EMP-1088",
      name: currentUser?.name || "HR Manager",
      role: currentUser?.role || "HR"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const currentList = getBonuses();
  const updatedList = [newBonus, ...currentList];

  try {
    localStorage.setItem(BONUSES_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.error("[bonusService] Failed to save bonus:", e);
    throw new Error("Storage Error: Failed to save bonus allocation.");
  }

  // Clear any existing draft upon successful creation
  clearDraft();
  notifyBonusStoreUpdated();

  return newBonus;
}

export function updateBonus(id, payload, currentUser) {
  if (!isHRorAdmin(currentUser)) {
    throw new Error("Access Denied: Only HR Managers or Admins can update bonuses.");
  }

  const currentList = getBonuses();
  const index = currentList.findIndex(b => b.id === id);
  if (index === -1) {
    throw new Error(`Bonus not found: ${id}`);
  }

  if (currentList[index].status === "Paid") {
    throw new Error("Invalid Action: Cannot modify a bonus that has already been paid out.");
  }

  const updatedRecord = {
    ...currentList[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  currentList[index] = updatedRecord;
  try {
    localStorage.setItem(BONUSES_STORAGE_KEY, JSON.stringify(currentList));
  } catch (e) {}

  notifyBonusStoreUpdated();
  return updatedRecord;
}

export function cancelBonus(id, currentUser) {
  if (!isHRorAdmin(currentUser)) {
    throw new Error("Access Denied: Only HR Managers or Admins can cancel bonuses.");
  }

  const currentList = getBonuses();
  const target = currentList.find(b => b.id === id);
  if (!target) {
    throw new Error(`Bonus not found: ${id}`);
  }

  if (target.status === "Paid") {
    throw new Error("Invalid Action: Cannot cancel a bonus that has already been paid out.");
  }

  target.status = "Cancelled";
  target.updatedAt = new Date().toISOString();

  try {
    localStorage.setItem(BONUSES_STORAGE_KEY, JSON.stringify(currentList));
  } catch (e) {}

  notifyBonusStoreUpdated();
  return target;
}

// ------------------- PAYROLL & PAYSLIP LOOKUP -------------------

/**
 * Returns active bonuses allocated specifically to a given employee.
 * Unselected employees return totalBonus = 0 and an empty array.
 */
export function getActiveBonusesForEmployee(employeeId, payCycle = "November 2026") {
  if (!employeeId) return { totalBonus: 0, bonusItems: [], totalTds: 0, totalNet: 0 };

  const targetId = String(employeeId).trim().toLowerCase();
  const allBonuses = getBonuses();

  // Active bonuses are Approved or Paid (not Draft or Cancelled) matching the pay cycle
  const activeBonuses = allBonuses.filter(b => {
    if (b.status !== "Approved" && b.status !== "Paid") return false;
    if (payCycle && b.payCycle && b.payCycle.trim().toLowerCase() !== payCycle.trim().toLowerCase()) {
      return false;
    }
    return true;
  });

  let totalBonus = 0;
  let totalTds = 0;
  let totalNet = 0;
  const bonusItems = [];

  for (const bonus of activeBonuses) {
    const matchedItem = bonus.items?.find(it => String(it.employeeId).trim().toLowerCase() === targetId);
    if (matchedItem) {
      totalBonus += matchedItem.amount;
      totalTds += matchedItem.tds;
      totalNet += matchedItem.net;
      bonusItems.push({
        bonusId: bonus.id,
        bonusName: bonus.name,
        type: bonus.type,
        payCycle: bonus.payCycle,
        amount: matchedItem.amount,
        tds: matchedItem.tds,
        net: matchedItem.net,
        paymentTiming: bonus.paymentTiming
      });
    }
  }

  return {
    totalBonus,
    totalTds,
    totalNet,
    bonusItems
  };
}

// ------------------- CSV EXPORT -------------------

export function exportBonusToCSV(bonus) {
  if (!bonus || !Array.isArray(bonus.items)) return;

  const headers = [
    "Bonus ID",
    "Bonus Name",
    "Type",
    "Pay Cycle",
    "Payment Timing",
    "Employee ID",
    "Employee Name",
    "Department",
    "Gross Bonus (INR)",
    "TDS Deduction (INR)",
    "Net Payable (INR)",
    "Status"
  ];

  const rows = bonus.items.map(item => [
    `"${bonus.id}"`,
    `"${bonus.name.replace(/"/g, '""')}"`,
    `"${bonus.type}"`,
    `"${bonus.payCycle}"`,
    `"${bonus.paymentTiming}"`,
    `"${item.employeeId}"`,
    `"${(item.employeeName || '').replace(/"/g, '""')}"`,
    `"${(item.department || '').replace(/"/g, '""')}"`,
    item.amount,
    item.tds,
    item.net,
    `"${bonus.status}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${bonus.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_recipients.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
