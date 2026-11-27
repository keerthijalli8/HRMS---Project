/**
 * - Central Benefits & Allowances Service for HRMS India
 * - Provides a single shared source of truth for salary components, allowances, and statutory deductions.
 * - Supports localStorage persistence, migration from legacy payroll keys,
 * - role-based access control (HR/Admin only for mutations),
 * - and dynamic calculations for the Payroll module.
 */

import {
  getCompanyById,
  getComponents,
  saveBenefitSelection as saveCompanyStoreBenefitSelection,
  subscribeCompanyStore
} from '../data/companyStore.js';
import { getActiveBonusesForEmployee } from './bonusService.js';
import { getApprovedLopForEmployee } from './lopService.js';

export const PRIMARY_STORAGE_KEY = "hrms_benefits_config_v1";
export const BENEFITS_UPDATED_EVENT = "hrms_benefits_updated";

// Comprehensive catalog of benefit & allowance components matching standard MNC structure
export const BENEFIT_GROUPS = [
  {
    group: "ALLOWANCES & EARNINGS",
    items: [
      { key: "basic_salary", name: "Basic Salary", category: "Earning", calcType: "% of CTC (40-50%)", defaultValue: "₹1,45,000", frequency: "Monthly", taxable: true, locked: true },
      { key: "hra", name: "HRA (House Rent Allowance)", category: "Earning", calcType: "% of Basic (40-50%)", defaultValue: "₹72,500", frequency: "Monthly", taxable: true },
      { key: "conveyance_allowance", name: "Conveyance / Transport Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "₹1,600", frequency: "Monthly", taxable: false },
      { key: "medical_allowance", name: "Medical Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "₹1,250", frequency: "Monthly", taxable: true },
      { key: "special_allowance", name: "Special Allowance", category: "Earning", calcType: "Balancing figure", defaultValue: "₹24,500", frequency: "Monthly", taxable: true },
      { key: "meal_allowance", name: "Meal / Food Coupons", category: "Earning", calcType: "Fixed coupons", defaultValue: "₹2,200", frequency: "Monthly", taxable: false },
      { key: "internet_phone_reimbursement", name: "Internet & Phone Reimbursement", category: "Earning", calcType: "Fixed amount", defaultValue: "₹1,000", frequency: "Monthly", taxable: false },
      { key: "lta", name: "Leave Travel Allowance (LTA)", category: "Earning", calcType: "Fixed annual", defaultValue: "₹50,000 /yr", frequency: "Annual", taxable: false },
    ]
  },
  {
    group: "HEALTH & INSURANCE BENEFITS",
    items: [
      { key: "group_health_insurance", name: "Group Medical Insurance (GMC)", category: "Benefit", calcType: "Annual Floater", defaultValue: "₹5,00,000 Sum Insured", frequency: "Annual", taxable: false },
      { key: "term_life_insurance", name: "Term Life Insurance", category: "Benefit", calcType: "Company Policy", defaultValue: "₹25,00,000 Sum Insured", frequency: "Annual", taxable: false },
      { key: "accident_cover", name: "Accident Cover", category: "Benefit", calcType: "Disability Policy", defaultValue: "₹10,00,000 Sum Insured", frequency: "Annual", taxable: false },
    ]
  },
  {
    group: "BONUS & INCENTIVES",
    items: [
      { key: "performance_bonus", name: "Performance Bonus / Variable Pay", category: "Earning", calcType: "Variable performance pay", defaultValue: "₹11,600", frequency: "Annual", taxable: true },
      { key: "annual_bonus", name: "Annual Bonus", category: "Earning", calcType: "Festive / Annual", defaultValue: "₹10,000", frequency: "Annual", taxable: true },
    ]
  },
  {
    group: "PERKS & WELLNESS",
    items: [
      { key: "wellness_gym", name: "Wellness & Gym Membership", category: "Benefit", calcType: "Reimbursement", defaultValue: "₹1,500", frequency: "Monthly", taxable: false },
      { key: "learning_budget", name: "Learning & Up-skilling Budget", category: "Benefit", calcType: "Annual Budget", defaultValue: "₹25,000 /yr", frequency: "Annual", taxable: false },
    ]
  },
  {
    group: "STATUTORY & RETIREMENT BENEFITS",
    items: [
      { key: "pf", name: "Provident Fund (PF)", category: "Deduction", calcType: "Statutory (12%)", defaultValue: "₹17,400", frequency: "Monthly", taxable: false },
      { key: "gratuity", name: "Gratuity", category: "Benefit", calcType: "Statutory", defaultValue: "Company Policy", frequency: "Annual", taxable: false },
      { key: "professional_tax", name: "Professional Tax", category: "Deduction", calcType: "Statutory", defaultValue: "₹200", frequency: "Monthly", taxable: false },
      { key: "tds", name: "TDS (Tax Deducted at Source)", category: "Deduction", calcType: "Statutory (~10%)", defaultValue: "₹14,800", frequency: "Monthly", taxable: false },
    ]
  }
];

export const ALL_BENEFIT_ITEMS = BENEFIT_GROUPS.flatMap(g => g.items);

// Default active components
export const DEFAULT_ACTIVE_KEYS = [
  "basic_salary",
  "hra",
  "conveyance_allowance",
  "medical_allowance",
  "special_allowance",
  "meal_allowance",
  "internet_phone_reimbursement",
  "lta",
  "group_health_insurance",
  "term_life_insurance",
  "wellness_gym",
  "learning_budget",
  "pf",
  "gratuity",
  "professional_tax",
  "tds"
];

/**
 * Check if the current user has HR or Admin privileges
 */
export function isUserHrOrAdmin(user) {
  if (!user) return false;
  const sysRole = (user.systemRole || "").trim().toLowerCase();
  const role = (user.role || "").trim().toLowerCase();
  return (
    sysRole === "hr" ||
    sysRole === "hr manager" ||
    sysRole === "admin" ||
    role === "hr" ||
    role === "hr manager" ||
    role === "admin"
  );
}

/**
 * Read saved benefits selection with seamless migration from legacy keys.
 */
export function getSavedBenefitsSelection(companyId = "NEX-IND") {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(PRIMARY_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.includes("basic_salary")) {
          parsed.unshift("basic_salary");
        }
        return parsed;
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed[companyId])) {
        const compKeys = parsed[companyId];
        if (!compKeys.includes("basic_salary")) {
          compKeys.unshift("basic_salary");
        }
        return compKeys;
      }
    }
  } catch (err) {
    console.warn("getSavedBenefitsSelection primary read error:", err);
  }

  const legacyKeys = [
    "hrms_payroll_allowances",
    "hrms_payroll_benefits",
    "hrms_benefits_selection",
    "hrms_payroll_components"
  ];

  for (const legacyKey of legacyKeys) {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(legacyKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.includes("basic_salary")) {
            parsed.unshift("basic_salary");
          }
          saveBenefitsSelection(parsed, companyId, { role: "SYSTEM", name: "Migration" });
          return parsed;
        }
      }
    } catch (e) {}
  }

  return [...DEFAULT_ACTIVE_KEYS];
}

/**
 * Save benefits selection (HR/Admin only).
 */
export function saveBenefitsSelection(selectedKeys, companyId = "NEX-IND", user = { name: "HR", role: "HR" }) {
  if (user?.role !== "SYSTEM" && !isUserHrOrAdmin(user)) {
    console.warn("Unauthorized attempt to modify benefits configuration:", user);
    throw new Error("Access denied: Only HR or Admin can change benefits and allowances configuration.");
  }

  const finalKeys = Array.from(new Set(["basic_salary", ...(selectedKeys || [])]));

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(finalKeys));
    }

    saveCompanyStoreBenefitSelection(companyId, finalKeys, user);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(BENEFITS_UPDATED_EVENT, {
          detail: { selectedKeys: finalKeys, companyId, updatedBy: user?.name || "HR" }
        })
      );
    }
  } catch (err) {
    console.error("Failed to save benefits selection:", err);
    throw err;
  }

  return finalKeys;
}

/**
 * Subscribe to benefits configuration changes
 */
export function subscribeBenefits(callback) {
  if (typeof window === "undefined") return () => {};

  const handler = (event) => {
    callback(event?.detail?.selectedKeys || getSavedBenefitsSelection());
  };

  window.addEventListener(BENEFITS_UPDATED_EVENT, handler);

  const unsubCompanyStore = subscribeCompanyStore(() => {
    callback(getSavedBenefitsSelection());
  });

  return () => {
    window.removeEventListener(BENEFITS_UPDATED_EVENT, handler);
    unsubCompanyStore();
  };
}

/**
 * Calculate dynamic payroll values for a single employee based on active benefits
 */
export function calculatePayrollForEmployee(employee, activeKeys = DEFAULT_ACTIVE_KEYS, payCycle = "November 2026") {
  const keys = new Set(activeKeys || DEFAULT_ACTIVE_KEYS);

  let basic = 145000;
  if (employee?.salary) {
    const match = String(employee.salary).match(/₹?([\d.]+)\s*L/);
    if (match) {
      const annualLakh = parseFloat(match[1]);
      const monthlyCTC = (annualLakh * 100000) / 12;
      basic = Math.round(monthlyCTC * 0.40);
    }
  }

  let allowances = 0;
  let deductions = 0;

  if (keys.has("hra")) allowances += Math.round(basic * 0.50);
  if (keys.has("conveyance_allowance")) allowances += 1600;
  if (keys.has("medical_allowance")) allowances += 1250;
  if (keys.has("special_allowance")) allowances += 24500;
  if (keys.has("meal_allowance")) allowances += 2200;
  if (keys.has("internet_phone_reimbursement")) allowances += 1000;
  if (keys.has("lta")) allowances += 4166;
  
  const empId = employee.id || employee.employeeId;
  const bonusData = getActiveBonusesForEmployee(empId, payCycle);
  const employeeBonusAmount = bonusData?.totalBonus || 0;
  const employeeBonusTds = bonusData?.totalTds || 0;

  if (employeeBonusAmount > 0) {
    allowances += employeeBonusAmount;
  }
  if (keys.has("performance_bonus")) allowances += 5000;
  if (keys.has("annual_bonus")) allowances += 1000;

  const grossSalary = basic + allowances;

  const lopData = getApprovedLopForEmployee(empId, payCycle);
  const employeeLopDeduction = lopData?.totalLopDeduction || 0;
  const employeeLopDays = lopData?.totalLopDays || 0;

  if (keys.has("pf")) deductions += Math.round(basic * 0.12);
  if (keys.has("professional_tax")) deductions += 200;
  if (keys.has("tds")) deductions += Math.round(grossSalary * 0.065) + employeeBonusTds;
  if (employeeLopDeduction > 0) {
    deductions += employeeLopDeduction;
  }

  const netPayable = grossSalary - deductions;

  return {
    basic,
    allowances,
    grossSalary,
    deductions,
    netPayable,
    bonusAmount: employeeBonusAmount,
    bonusTds: employeeBonusTds,
    bonusItems: bonusData?.bonusItems || [],
    lopDeduction: employeeLopDeduction,
    lopDays: employeeLopDays,
    lopItems: lopData?.records || []
  };
}

/**
 * Aggregate summary metrics for Payroll KPIs
 */
export function calculatePayrollSummary(employees = [], activeKeys = DEFAULT_ACTIVE_KEYS) {
  const keys = new Set(activeKeys || DEFAULT_ACTIVE_KEYS);
  const benchmark = calculatePayrollForEmployee({ salary: "₹36.00 L" }, activeKeys);

  const baseBenchmarkGross = 227500;
  const ratio = benchmark.grossSalary / (baseBenchmarkGross || 1);
  const totalCostLakhs = Math.round(142 * ratio);
  const formattedMonthlyCost = totalCostLakhs >= 100 
    ? `₹${(totalCostLakhs / 100).toFixed(2)} Cr` 
    : `₹${totalCostLakhs.toFixed(2)} L`;

  const hasTds = keys.has("tds");
  const tdsRatio = hasTds ? (benchmark.grossSalary / baseBenchmarkGross) : 0;
  const tdsLakhs = (12.80 * tdsRatio).toFixed(2);
  const formattedTds = hasTds ? `₹${tdsLakhs} L` : "₹0.00 L";

  return {
    monthlyCost: formattedMonthlyCost,
    totalEmployees: "1,248",
    tdsDeduction: formattedTds,
    paymentAuth: "Ready",
    benchmark
  };
}