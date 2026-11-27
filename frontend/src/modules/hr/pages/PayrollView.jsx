import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { Icon } from '../components/Icon.jsx';
import { KPITile } from '../components/KPITile.jsx';
import { RevealedBenefitsPanel } from '../components/RevealedBenefitsPanel.jsx';
import { employeeData } from '../data/mockData.js';
import { formatCurrency } from '../utils/format.js';
import {
  getSavedBenefitsSelection,
  subscribeBenefits,
  calculatePayrollForEmployee
} from '../services/benefitsService.js';
import {
  getActiveBonusEmployeesCountForCycle,
  subscribeBonuses
} from '../services/bonusService.js';
import {
  POLICY,
  computeStructure,
  computeMonthlyPayroll,
  lpaToCTC
} from '../utils/payrollCalc.js';

const STORAGE_KEY = 'nexora_matrix_salary_structures_v3';
const ONBOARDING_SALARY_KEY = 'nexora_onboarding_salaries_v2';
const SNAPSHOT_KEY = 'nexora_payroll_run_snapshots_v1';
const BONUS_STORAGE_KEY = 'nexora_custom_employee_bonuses_v1';

const COMPANY = {
  id: "COMP-001",
  name: "Technomold IT Solutions Pvt Ltd",
  singleLineAddress: "Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081",
  phone: "+91 90000 00000",
  email: "hr@technomold.com",
  signatory: "R. Vinay",
};

const OTHER_EMPLOYEES_DUMMY_CTC = {
  "aarav sharma": { annualCTC: 650000, grade: "L2" },
  "meera reddy": { annualCTC: 850000, grade: "L2" },
  "rohan varma": { annualCTC: 780000, grade: "L2" },
  "vikram malhotra": { annualCTC: 720000, grade: "L2" },
  "devansh mehta": { annualCTC: 520000, grade: "L1" },
  "sneha nair": { annualCTC: 550000, grade: "L1" },
  "anita desai": { annualCTC: 480000, grade: "L1" }
};

const num = (value) =>
  typeof value === "number"
    ? Number.isFinite(value) ? value : 0
    : Number(String(value ?? 0).replace(/[₹,\s]/g, "")) || 0;

const money = (value, decimals = 2) =>
  `₹${num(value).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

const pdfMoney = (value) =>
  `Rs. ${num(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const clean = (value, fallback = "Not Provided") =>
  value == null || String(value).trim() === "" ? fallback : String(value);

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function wordsBelowThousand(value) {
  let n = Math.floor(value);
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    const tens = TENS[Math.floor(n / 10)];
    const ones = ONES[n % 10];
    parts.push(ones ? `${tens} ${ones}` : tens);
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function numberToIndianWords(value) {
  let n = Math.floor(Math.abs(value));
  if (!n) return "Zero";
  const result = [];
  for (const [divisor, label] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]]) {
    if (n >= divisor) {
      const count = Math.floor(n / divisor);
      result.push(`${wordsBelowThousand(count)} ${label}`);
      n %= divisor;
    }
  }
  if (n > 0) result.push(wordsBelowThousand(n));
  return result.join(" ");
}

function amountInWords(value) {
  const totalPaise = Math.round(Math.max(0, num(value)) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  return `Rupees ${numberToIndianWords(rupees)}` + (paise ? ` and ${numberToIndianWords(paise)} Paise` : "") + " Only";
}

function getPayslipRows(calc) {
  return [
    { earning: "BASIC SALARY", amount: calc.basic, deduction: "EMPLOYEE EPF", deductionAmount: calc.pfDeduction },
    { earning: "HOUSE RENT ALLOWANCE", amount: calc.hra, deduction: "PROFESSIONAL TAX", deductionAmount: calc.ptDeduction },
    { earning: "CONVEYANCE & SPECIAL", amount: (calc.conveyance || 0) + (calc.specialAllowance || 0), deduction: "TDS", deductionAmount: calc.tdsDeduction },
    { earning: "BONUS", amount: calc.bonusAmount || 0, deduction: "LEAVE DEDUCTION (LOP)", deductionAmount: calc.lopDeduction },
    { earning: "OTHER ALLOWANCE", amount: 0, deduction: "", deductionAmount: null },
  ];
}

function getDetailRows(c) {
  return [
    ["Employee ID", c.id, "Date of Joining", c.joiningDate || c.doj],
    ["Employee Name", c.name, "Date of Birth", c.dob],
    ["Designation", c.role, "Gender", c.gender],
    ["Department", c.department, "Grade", c.grade],
    ["Bank Name", c.bankName, "Location", c.location],
    ["Bank Account", c.bankAccount ? `XXXX${String(c.bankAccount).slice(-4)}` : null, "PAN", c.pan],
    ["PF Number", c.pfNumber, "UAN", c.uan],
    ["ESI Number", c.esiNumber || "Not Applicable", "Payment Mode", "Bank Transfer"],
  ];
}

function downloadPayslipPDF(calc, cycle = "November 2026") {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = 12, right = 198, width = right - left;

  const drawText = (text, x, y, size = 8, bold = false, align = "left") => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(25, 35, 45);
    pdf.text(String(text), x, y, { align });
  };

  const line = (x1, y1, x2, y2) => {
    pdf.setDrawColor(70, 80, 90);
    pdf.setLineWidth(0.25);
    pdf.line(x1, y1, x2, y2);
  };

  pdf.setDrawColor(65, 75, 85);
  pdf.setLineWidth(0.45);
  pdf.rect(left, 10, width, 269);

  pdf.setFillColor(225, 29, 72);
  pdf.roundedRect(16, 15, 14, 14, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("TM", 23, 23.5, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(225, 29, 72);
  pdf.text("Technomold", 34, 20);
  pdf.setTextColor(15, 23, 42);
  pdf.text("IT SOLUTIONS PVT LTD", 66, 20);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(COMPANY.name, 105, 18, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(70, 80, 90);
  pdf.text(COMPANY.singleLineAddress, 105, 23, { align: "center" });

  line(left, 28, right, 28);
  drawText(`EMPLOYEE PAYSLIP - ${cycle.toUpperCase()}`, 105, 35, 11, true, "center");
  line(left, 39, right, 39);

  const employeeRows = getDetailRows(calc);
  const colX = [12, 44, 105, 137, 198];
  let y = 39;
  const rowHeight = 8;

  employeeRows.forEach((row) => {
    line(left, y + rowHeight, right, y + rowHeight);
    for (let i = 1; i < colX.length - 1; i++) line(colX[i], y, colX[i], y + rowHeight);
    drawText(row[0], colX[0] + 2, y + 5.2, 7, true);
    drawText(clean(row[1]), colX[1] + 2, y + 5.2, 7);
    drawText(row[2], colX[2] + 2, y + 5.2, 7, true);
    drawText(clean(row[3]), colX[3] + 2, y + 5.2, 7);
    y += rowHeight;
  });

  const std = POLICY.lopDivisor;
  const lop = calc.lopDays || 0;
  pdf.setFillColor(231, 241, 243);
  pdf.rect(left, y, width, 9, "F");
  drawText(`Standard Days: ${std}     Payable Days: ${std - lop}     LOP Days: ${lop}     Arrear Days: 0`, 105, y + 5.8, 8, true, "center");
  y += 9;
  line(left, y, right, y);

  const x = [12, 61, 85, 109, 126, 150, 178, 198];
  const tableHeaderHeight = 11;
  pdf.setFillColor(220, 236, 238);
  pdf.rect(left, y, width, tableHeaderHeight, "F");

  const headers = ["EARNINGS", "MONTHLY", "CURRENT", "ARREAR", "TOTAL", "DEDUCTIONS", "TOTAL"];
  headers.forEach((header, i) => {
    drawText(header, (x[i] + x[i + 1]) / 2, y + 6.8, 6.5, true, "center");
  });
  for (let i = 1; i < x.length - 1; i++) line(x[i], y, x[i], y + tableHeaderHeight);
  y += tableHeaderHeight;
  line(left, y, right, y);

  const rows = getPayslipRows(calc);
  const dataRowHeight = 10;

  rows.forEach((row) => {
    const values = [
      row.earning,
      pdfMoney(row.amount),
      pdfMoney(row.amount),
      pdfMoney(0),
      pdfMoney(row.amount),
      row.deduction || "-",
      row.deductionAmount === null ? "-" : pdfMoney(row.deductionAmount),
    ];

    values.forEach((value, i) => {
      if (i === 0 || i === 5) {
        drawText(value, x[i] + 1.5, y + 6.2, 6.3);
      } else {
        drawText(value, x[i + 1] - 1.5, y + 6.2, 6.2, false, "right");
      }
    });

    for (let i = 1; i < x.length - 1; i++) line(x[i], y, x[i], y + dataRowHeight);
    y += dataRowHeight;
    line(left, y, right, y);
  });

  pdf.setFillColor(232, 242, 241);
  pdf.rect(left, y, width, 11, "F");

  const totals = [
    "GROSS EARNINGS",
    pdfMoney(calc.grossSalary),
    pdfMoney(calc.grossSalary),
    pdfMoney(0),
    pdfMoney(calc.grossSalary),
    "TOTAL DEDUCTIONS",
    pdfMoney(calc.deductions),
  ];

  totals.forEach((value, i) => {
    drawText(value, i === 0 || i === 5 ? x[i] + 1.5 : x[i + 1] - 1.5, y + 6.8, 6.1, true, i === 0 || i === 5 ? "left" : "right");
  });

  for (let i = 1; i < x.length - 1; i++) line(x[i], y, x[i], y + 11);
  y += 11;
  line(left, y, right, y);

  pdf.setFillColor(218, 239, 232);
  pdf.rect(left, y, width, 12, "F");
  drawText("NET PAY", 18, y + 7.8, 10, true);
  drawText(pdfMoney(calc.netPayable), 192, y + 7.8, 10, true, "right");

  y += 12;
  line(left, y, right, y);
  drawText("AMOUNT IN WORDS:", 17, y + 6, 8, true);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(amountInWords(calc.netPayable), 17, y + 11);

  y += 16;
  pdf.setFont("courier", "italic");
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text(COMPANY.signatory, 165, y + 2, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  line(140, y + 7, 190, y + 7);
  drawText(`Authorized Signatory (${COMPANY.signatory})`, 165, y + 11, 7, false, "center");
  drawText(COMPANY.name, 165, y + 15, 6.5, false, "center");

  pdf.save(`Payslip_${calc.id}_${cycle.replace(" ", "_")}.pdf`);
}

function locationParams(location = "") {
  const l = location.toLowerCase();
  if (l.includes("bengaluru") || l.includes("bangalore") || l.includes("mumbai")) {
    return { multiplier: 1.12, hraPercent: 0.5 };
  }
  if (l.includes("hyderabad") || l.includes("pune") || l.includes("chennai") || l.includes("delhi")) {
    return { multiplier: 1.0, hraPercent: 0.5 };
  }
  return { multiplier: 0.92, hraPercent: 0.4 };
}

function calculateMatrixStructure({
  role = "Software Engineer",
  department = "Engineering",
  location = "Hyderabad",
  experience = 0
}) {
  const exp = Math.max(0, Number(experience) || 0);
  let grade = "L1";
  let baseAnnual = 450000;
  const roleLower = role.toLowerCase();
  const deptLower = department.toLowerCase();

  if (roleLower.includes("bda") || roleLower.includes("bde")) {
    if (exp === 0) { grade = "L1"; baseAnnual = 380000; }
    else if (exp <= 2) { grade = "L2"; baseAnnual = 550000; }
    else if (exp <= 5) { grade = "L3"; baseAnnual = 820000; }
    else { grade = "L4"; baseAnnual = 1200000; }
  } else if (roleLower.includes("telecaller")) {
    if (exp === 0) { grade = "L1"; baseAnnual = 280000; }
    else if (exp <= 2) { grade = "L2"; baseAnnual = 380000; }
    else if (exp <= 5) { grade = "L3"; baseAnnual = 500000; }
    else { grade = "L4"; baseAnnual = 700000; }
  } else if (deptLower.includes("engineering") || roleLower.includes("developer") || roleLower.includes("engineer")) {
    if (exp === 0) { grade = "L1"; baseAnnual = 450000; }
    else if (exp <= 2) { grade = "L2"; baseAnnual = 650000; }
    else if (exp <= 5) { grade = "L3"; baseAnnual = 1050000; }
    else { grade = "L4"; baseAnnual = 1600000; }
  } else if (deptLower.includes("product") || deptLower.includes("design")) {
    if (exp === 0) { grade = "L1"; baseAnnual = 420000; }
    else if (exp <= 2) { grade = "L2"; baseAnnual = 600000; }
    else if (exp <= 5) { grade = "L3"; baseAnnual = 950000; }
    else { grade = "L4"; baseAnnual = 1450000; }
  } else {
    if (exp === 0) { grade = "L1"; baseAnnual = 360000; }
    else if (exp <= 2) { grade = "L2"; baseAnnual = 500000; }
    else if (exp <= 5) { grade = "L3"; baseAnnual = 780000; }
    else { grade = "L4"; baseAnnual = 1150000; }
  }

  const { multiplier, hraPercent } = locationParams(location);
  const annualCTC = Math.round((baseAnnual * multiplier) / 1000) * 1000;
  return { grade, ...computeStructure(annualCTC, { hraPercentOfBasic: hraPercent }) };
}

function buildStructure(f) {
  const matrix = calculateMatrixStructure(f);
  if (f.manualLpa) {
    const { hraPercent } = locationParams(f.location);
    return {
      grade: matrix.grade,
      ...computeStructure(lpaToCTC(f.lpa), { hraPercentOfBasic: hraPercent })
    };
  }
  return { ...matrix, lpa: String(matrix.annualCTC / 100000) };
}

const newForm = () => {
  const base = {
    name: "",
    email: "",
    role: "Software Engineer",
    department: "Engineering",
    location: "Hyderabad",
    experience: 0,
    pfApplicable: true,
    ptApplicable: true,
    isConfirmed: false,
    manualLpa: false,
    lpa: ""
  };
  return { ...base, ...buildStructure(base) };
};

const LOCATIONS = ["Hyderabad", "Bengaluru", "Mumbai", "Pune", "Chennai", "Delhi", "Other"];

export const PayrollView = ({
  currentUser,
  salaryUnlocked,
  setSalaryUnlocked,
  onTriggerToast
}) => {
  const companyId = currentUser?.companyId || "NEX-IND";

  const [activePayrollTab, setActivePayrollTab] = useState("structures");
  const [selectedCycle, setSelectedCycle] = useState("November 2026");
  const [payslipSubTab, setPayslipSubTab] = useState("employee");
  const [payslipSearch, setPayslipSearch] = useState("");
  const [previewPayslipData, setPreviewPayslipData] = useState(null);

  const [activeSelection, setActiveSelection] = useState(() => getSavedBenefitsSelection(companyId));
  const [activeBonusEmployeeCount, setActiveBonusEmployeeCount] = useState(() => getActiveBonusEmployeesCountForCycle("November 2026"));

  const [runSnapshots, setRunSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOT_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [employeeMatrices, setEmployeeMatrices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [onboardingStructures, setOnboardingStructures] = useState(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_SALARY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customBonuses, setCustomBonuses] = useState(() => {
    try {
      const saved = localStorage.getItem(BONUS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bonusModalEmp, setBonusModalEmp] = useState(null);
  const [bonusForm, setBonusForm] = useState({ amount: "", reason: "" });

  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState(null);
  const [structureForm, setStructureForm] = useState(newForm);

  const pastSixMonths = useMemo(() => {
    return [
      { cycle: "November 2026", id: "PS-HR-1126" },
      { cycle: "October 2026", id: "PS-HR-1026" },
      { cycle: "September 2026", id: "PS-HR-0926" },
      { cycle: "August 2026", id: "PS-HR-0826" },
      { cycle: "July 2026", id: "PS-HR-0726" },
      { cycle: "June 2026", id: "PS-HR-0626" },
    ];
  }, []);

  const myProfileData = useMemo(() => {
    const baseEmp = employeeData[0] || {};
    return {
      ...baseEmp,
      id: "EMP-HR01",
      name: "Pooja Patel",
      role: "HR Manager",
      department: "Human Resources",
      grade: "L3"
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(employeeMatrices)); } catch {}
  }, [employeeMatrices]);

  useEffect(() => {
    try { localStorage.setItem(ONBOARDING_SALARY_KEY, JSON.stringify(onboardingStructures)); } catch {}
  }, [onboardingStructures]);

  useEffect(() => {
    try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(runSnapshots)); } catch {}
  }, [runSnapshots]);

  useEffect(() => {
    try { localStorage.setItem(BONUS_STORAGE_KEY, JSON.stringify(customBonuses)); } catch {}
  }, [customBonuses]);

  useEffect(() => {
    const unsub = subscribeBenefits((newSelection) => setActiveSelection([...newSelection]));
    return unsub;
  }, [companyId]);

  useEffect(() => {
    const unsub = subscribeBonuses(() => setActiveBonusEmployeeCount(getActiveBonusEmployeesCountForCycle(selectedCycle)));
    return unsub;
  }, [selectedCycle]);

  const isDisbursed = Boolean(runSnapshots[selectedCycle]);
  const mask = (v) => (salaryUnlocked ? formatCurrency(v) : "₹ ••••••");

  const allEmployeesList = useMemo(() => {
    const existingEmails = new Set(employeeData.map((e) => (e.email || "").toLowerCase()));
    const newOnes = onboardingStructures
      .filter((item) => !existingEmails.has((item.email || "").toLowerCase()))
      .map((item) => ({
        id: item.empId || `ONB-${item.id}`,
        name: item.name,
        email: item.email,
        dept: item.department,
        role: item.role,
        location: item.location,
        experience: item.experience,
        isOnboarding: true,
        isConfirmed: item.isConfirmed
      }));
    return [...newOnes, ...employeeData];
  }, [onboardingStructures]);

  const getComputedPayroll = useCallback((emp) => {
    const baseCalc = calculatePayrollForEmployee(emp, activeSelection);
    const emailKey = (emp.email || "").toLowerCase();
    const nameKey = (emp.name || "").trim().toLowerCase();

    const saved =
      employeeMatrices[emp.id] ||
      (emailKey && onboardingStructures.find((o) => (o.email || "").toLowerCase() === emailKey));

    const isExcluded = nameKey === "lokesh" || nameKey.includes("vinay");
    const dummyPreset = !isExcluded
      ? (OTHER_EMPLOYEES_DUMMY_CTC[nameKey] || { annualCTC: 500000, grade: "L1" })
      : null;

    const dummyComputed = dummyPreset
      ? {
          grade: dummyPreset.grade,
          ...computeStructure(dummyPreset.annualCTC, { hraPercentOfBasic: 0.5 }),
          isConfirmed: false
        }
      : null;

    const profile = saved || {
      name: emp.name,
      email: emp.email || `${String(emp.id).toLowerCase()}@technomold.com`,
      role: emp.role || "Software Engineer",
      department: emp.dept || "Engineering",
      location: emp.location || "Hyderabad",
      experience: emp.experience ?? 0,
      pfApplicable: true,
      ptApplicable: true,
      isConfirmed: false,
      ...(dummyComputed || calculateMatrixStructure({
        role: emp.role || "Software Engineer",
        department: emp.dept || "Engineering",
        location: emp.location || "Hyderabad",
        experience: emp.experience ?? 0
      }))
    };

    const derived = computeStructure(Number(profile.annualCTC) || 0);
    const structure = {
      ...derived,
      basic: Number(profile.basic) || 0,
      hra: Number(profile.hra) || 0,
      conveyance: Number(profile.conveyance) || 0,
      specialAllowance: Number(profile.specialAllowance) || 0
    };
    structure.grossMonthly = structure.basic + structure.hra + structure.conveyance + structure.specialAllowance;

    const extraBonusObj = customBonuses[selectedCycle]?.[emp.id];
    const extraBonus = extraBonusObj ? Number(extraBonusObj.amount) || 0 : 0;
    const bonusAmount = (Number(baseCalc.bonusAmount) || 0) + extraBonus;
    const bonusReason = extraBonusObj?.reason || baseCalc.bonusReason || "";

    const lopDays = Number(baseCalc.lopDays) || 0;

    const pay = computeMonthlyPayroll(structure, {
      lopDays,
      bonus: bonusAmount,
      pfApplicable: profile.pfApplicable ?? true,
      ptApplicable: profile.ptApplicable ?? true,
      pfOnActual: profile.pfOnActual ?? false
    });

    return {
      ...emp,
      ...baseCalc,
      ...profile,
      ...structure,
      ...pay,
      bonusAmount,
      bonusReason,
      lopDays,
      allowances: pay.grossSalary - structure.basic,
      isOnboarding: Boolean(emp.isOnboarding || (emailKey && onboardingStructures.find((o) => (o.email || "").toLowerCase() === emailKey)))
    };
  }, [activeSelection, employeeMatrices, onboardingStructures, activeBonusEmployeeCount, customBonuses, selectedCycle]);

  const getPayrollFor = useCallback(
    (emp) => runSnapshots[selectedCycle]?.[emp.id] || getComputedPayroll(emp),
    [runSnapshots, selectedCycle, getComputedPayroll]
  );

  const summary = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalTds = 0;

    allEmployeesList.forEach((emp) => {
      const calc = getPayrollFor(emp);
      totalGross += calc.grossSalary;
      totalNet += calc.netPayable;
      totalTds += calc.tdsDeduction || 0;
    });

    return {
      monthlyCost: mask(totalGross),
      netPayableTotal: mask(totalNet),
      totalEmployees: allEmployeesList.length,
      tdsDeduction: mask(totalTds),
      paymentAuth: isDisbursed ? "Disbursed" : "Ready"
    };
  }, [allEmployeesList, getPayrollFor, isDisbursed, salaryUnlocked]);

  const openBonusModal = (emp) => {
    const existing = customBonuses[selectedCycle]?.[emp.id];
    setBonusModalEmp(emp);
    setBonusForm({
      amount: existing ? String(existing.amount) : "",
      reason: existing ? existing.reason : ""
    });
  };

  const handleSaveBonus = (e) => {
    e.preventDefault();
    if (!bonusModalEmp) return;
    const amt = Number(bonusForm.amount);
    if (!(amt > 0)) {
      onTriggerToast?.("Please enter a valid bonus amount.");
      return;
    }

    setCustomBonuses((prev) => ({
      ...prev,
      [selectedCycle]: {
        ...(prev[selectedCycle] || {}),
        [bonusModalEmp.id]: {
          amount: amt,
          reason: bonusForm.reason.trim() || "Performance / Special Bonus"
        }
      }
    }));

    onTriggerToast?.(`Bonus of ${formatCurrency(amt)} added for ${bonusModalEmp.name}!`);
    setBonusModalEmp(null);
    setBonusForm({ amount: "", reason: "" });
  };

  const openCreateStructureModal = () => {
    setEditingTargetId(null);
    setStructureForm(newForm());
    setIsStructureModalOpen(true);
  };

  const openEditStructureModal = (emp) => {
    const current = getComputedPayroll(emp);
    setEditingTargetId(emp.id);
    setStructureForm({
      name: emp.name,
      email: current.email || emp.email || "",
      role: current.role,
      department: current.department,
      location: current.location,
      experience: current.experience,
      grade: current.grade,
      annualCTC: current.annualCTC,
      monthlyCTC: current.monthlyCTC,
      basic: current.basic,
      hra: current.hra,
      conveyance: current.conveyance,
      specialAllowance: current.specialAllowance,
      grossMonthly: current.grossMonthly,
      employerPF: current.employerPF,
      gratuity: current.gratuity,
      insurance: current.insurance,
      lpa: String(current.annualCTC / 100000),
      manualLpa: true,
      pfApplicable: current.pfApplicable ?? true,
      ptApplicable: current.ptApplicable ?? true,
      isConfirmed: current.isConfirmed ?? false
    });
    setIsStructureModalOpen(true);
  };

  const handleFormFieldChange = (field, value) => {
    setStructureForm((prev) => {
      if (prev.isConfirmed) return prev;
      const updated = { ...prev, [field]: value };
      if (["role", "department", "location", "experience"].includes(field)) {
        return { ...updated, ...buildStructure(updated) };
      }
      return updated;
    });
  };

  const handleLpaChange = (value) => {
    setStructureForm((prev) => {
      if (prev.isConfirmed) return prev;
      const updated = { ...prev, lpa: value, manualLpa: true };
      return { ...updated, ...buildStructure(updated) };
    });
  };

  const handleSaveStructure = (e) => {
    e.preventDefault();
    if (!(structureForm.annualCTC > 0)) {
      onTriggerToast?.("Enter a valid package (LPA) before confirming.");
      return;
    }
    const recordId = editingTargetId || `ONB-${Math.floor(100 + Math.random() * 900)}`;
    const payload = {
      id: recordId,
      empId: recordId,
      ...structureForm,
      isConfirmed: true,
      assignedAt: new Date().toISOString(),
      onboardingStatus: "Salary Structure Confirmed & Locked"
    };

    setEmployeeMatrices((prev) => ({ ...prev, [recordId]: payload }));
    setOnboardingStructures((prev) => {
      const filtered = prev.filter((item) => item.empId !== recordId && (item.email || "").toLowerCase() !== (structureForm.email || "").toLowerCase());
      return [payload, ...filtered];
    });

    onTriggerToast?.(`Salary structure confirmed and locked for ${structureForm.name}!`);
    setIsStructureModalOpen(false);
  };

  const handleDisburseSalaries = () => {
    if (isDisbursed) return;
    const snapshot = {};
    allEmployeesList.forEach((emp) => {
      snapshot[emp.id] = getComputedPayroll(emp);
    });
    setRunSnapshots((prev) => ({ ...prev, [selectedCycle]: snapshot }));
    onTriggerToast?.(`✅ Salaries for ${selectedCycle} approved and disbursed! Payslips are now locked.`);
  };

  const handleViewPayslip = (calc, cycleTitle = selectedCycle) => {
    if (!salaryUnlocked) {
      onTriggerToast?.("Unlock salaries to view payslips.");
      return;
    }
    setPreviewPayslipData({ calc, cycle: cycleTitle });
  };

  const filteredPayslipEmployees = useMemo(() => {
    if (!payslipSearch.trim()) return allEmployeesList;
    const q = payslipSearch.toLowerCase();
    return allEmployeesList.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || (e.dept || "").toLowerCase().includes(q));
  }, [allEmployeesList, payslipSearch]);

  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
      activePayrollTab === tab ? "bg-emerald-400 text-slate-950 shadow font-bold" : "text-slate-300 hover:text-white"
    }`;

  const inputClass = "w-full bg-white/5 border border-[#203a45] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 disabled:opacity-60";

  const f = structureForm;
  const breakupRows = [
    ["Basic", f.basic],
    ["HRA", f.hra],
    ["Conveyance", f.conveyance],
    ["Special allowance", f.specialAllowance],
    ["Gross (monthly)", f.grossMonthly, true],
    ["Employer PF", f.employerPF],
    ["Gratuity provision", f.gratuity],
    ["Insurance", f.insurance],
    ["CTC (monthly)", f.monthlyCTC, true],
  ];

  return (
    <div className="flex flex-col gap-4 font-sans select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex bg-[#10242e] p-1 rounded-xl border border-[#203a45] w-fit">
          <button type="button" onClick={() => setActivePayrollTab("structures")} className={tabClass("structures")}>
            <Icon name="layers" className="w-3.5 h-3.5" />
            <span>Salary Structures</span>
          </button>
          <button type="button" onClick={() => setActivePayrollTab("runs")} className={tabClass("runs")}>
            <Icon name="play-circle" className="w-3.5 h-3.5" />
            <span>Payroll Runs</span>
          </button>
          <button type="button" onClick={() => setActivePayrollTab("payslips")} className={tabClass("payslips")}>
            <Icon name="file-text" className="w-3.5 h-3.5" />
            <span>Payslips</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateStructureModal}
            className="h-[38px] px-4 rounded-xl bg-emerald-400 text-slate-950 text-xs font-bold shadow-md hover:brightness-105 transition flex items-center gap-1.5 cursor-pointer border-0"
          >
            <Icon name="plus" className="w-4 h-4 text-slate-950" />
            <span>Create Salary Structure</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !salaryUnlocked;
              setSalaryUnlocked(next);
              onTriggerToast?.(next ? "Authorized salary view unlocked." : "Confidential salary fields hidden.");
            }}
            className={`h-[38px] text-xs px-3.5 rounded-xl border-0 transition font-semibold flex items-center gap-1.5 cursor-pointer ${
              salaryUnlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-300 hover:text-white"
            }`}
          >
            <Icon name={salaryUnlocked ? "check" : "eye"} className="w-3.5 h-3.5" />
            <span>{salaryUnlocked ? "Salary Revealed" : "Unlock Salaries"}</span>
          </button>
        </div>
      </div>

      {salaryUnlocked && (
        <div className="transition-all duration-200 ease-out animate-fade-in">
          <RevealedBenefitsPanel currentUser={currentUser} />
        </div>
      )}

      {/* TAB 1: SALARY STRUCTURES */}
      {activePayrollTab === "structures" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="bg-[#10242e] border-0 rounded-2xl p-4 overflow-hidden shadow-sm" style={{ border: "none" }}>
            <div className="pb-3 border-b border-[#203a45]">
              <div className="font-display font-bold text-white text-[16px]">Onboarding & Employee Salary Structures</div>
              <div className="text-[12px] text-slate-400">Once confirmed during Onboarding / Offer Release, salary structures are locked.</div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[10.5px] font-semibold border-b border-[#203a45]">
                  <tr>
                    <th className="py-3 px-4">Employee & Email</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Role & Department</th>
                    <th className="py-3 px-4">Exp & Location</th>
                    <th className="py-3 px-4 text-right">Annual CTC</th>
                    <th className="py-3 px-4 text-right">Status / Lock</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#203a45]">
                  {allEmployeesList.map((emp) => {
                    const calc = getComputedPayroll(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-white/5">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{emp.name}</span>
                          <span className="text-[11px] text-slate-400">{calc.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">{calc.grade}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-medium block">{calc.role}</span>
                          <span className="text-[11px] text-slate-400">{calc.department}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-white block">{calc.experience} yrs exp</span>
                          <span className="text-[11px] text-slate-400">📍 {calc.location}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-num font-bold text-emerald-400">{mask(calc.annualCTC)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/35">
                            <Icon name="lock" className="w-3 h-3" />
                            <span>{calc.isConfirmed ? "Confirmed & Locked" : "Pending Confirmation"}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {calc.isConfirmed && (
                              <button
                                type="button"
                                onClick={() => openBonusModal(emp)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold cursor-pointer transition border-0"
                              >
                                + Add Bonus
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditStructureModal(emp)}
                              className="px-3 py-1 rounded-lg bg-white/5 text-emerald-400 hover:text-white font-semibold cursor-pointer transition border-0"
                            >
                              {calc.isConfirmed ? "View Details" : "Confirm & Lock"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYROLL RUNS */}
      {activePayrollTab === "runs" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPITile metric={summary.monthlyCost} label="Monthly Gross Payroll" icon="dollar-sign" trend={selectedCycle} />
            <KPITile metric={summary.netPayableTotal} label="Net Bank Transfer" icon="credit-card" trend="After LOP, PF, PT & TDS" />
            <KPITile metric={summary.tdsDeduction} label="Statutory TDS" icon="file-text" trend="New regime estimate" />
            <KPITile metric={summary.paymentAuth} label="Run Status" icon="check" trend={isDisbursed ? "Disbursed & Locked" : "Ready for Approval"} />
          </div>

          <div className="bg-[#10242e] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="font-display font-bold text-white text-[16px]">Payroll Run — {selectedCycle}</div>
                <div className="text-[12px] text-slate-400">
                  {isDisbursed ? "Snapshot saved. Later salary changes will not affect this month." : "Synced with Confirmed Salary Structures"}
                </div>
              </div>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="bg-white/5 border border-[#203a45] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="November 2026" className="bg-[#10242e]">November 2026 (Current)</option>
                <option value="October 2026" className="bg-[#10242e]">October 2026</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleDisburseSalaries}
              disabled={isDisbursed}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 border-0 ${
                isDisbursed ? "bg-emerald-500/20 text-emerald-300 cursor-default" : "bg-emerald-400 text-slate-950 hover:brightness-105 cursor-pointer"
              }`}
            >
              <Icon name={isDisbursed ? "check-circle" : "send"} className="w-4 h-4 text-slate-950" />
              <span>{isDisbursed ? "Salaries Disbursed ✅" : "Approve & Disburse Salaries 🚀"}</span>
            </button>
          </div>

          <div className="bg-[#10242e] rounded-2xl p-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[10.5px] font-semibold border-b border-[#203a45]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Grade / Dept</th>
                    <th className="py-3 px-4 text-right">Basic</th>
                    <th className="py-3 px-4 text-right">Bonus</th>
                    <th className="py-3 px-4 text-right">Gross</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#203a45]">
                  {allEmployeesList.map((e) => {
                    const calc = getPayrollFor(e);
                    return (
                      <tr key={e.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-semibold text-emerald-400 font-mono">{e.id}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>{e.name}</div>
                          {calc.bonusReason && (
                            <span className="text-[10px] text-emerald-400">Bonus: {calc.bonusReason}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400"><span className="text-white font-semibold">{calc.grade}</span> • {calc.department}</td>
                        <td className="py-3 px-4 text-right font-num">{mask(calc.basic)}</td>
                        <td className="py-3 px-4 text-right font-num text-emerald-400 font-semibold">{mask(calc.bonusAmount || 0)}</td>
                        <td className="py-3 px-4 text-right font-num text-white font-semibold">{mask(calc.grossSalary)}</td>
                        <td className="py-3 px-4 text-right font-num text-red-400">{mask(calc.deductions)}</td>
                        <td className="py-3 px-4 text-right font-num text-emerald-400 font-bold">{mask(calc.netPayable)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${isDisbursed ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35" : "bg-amber-500/15 text-amber-300 border-amber-500/35"}`}>
                            {isDisbursed ? "Paid" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYSLIPS */}
      {activePayrollTab === "payslips" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-[#10242e] p-2 rounded-2xl">
            <div className="flex bg-[#142c37] p-1 rounded-xl border border-[#203a45]">
              <button
                type="button"
                onClick={() => setPayslipSubTab("employee")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  payslipSubTab === "employee" ? "bg-emerald-400 text-slate-950 shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                <Icon name="users" className="w-3.5 h-3.5" />
                <span>Employee's Payslips</span>
              </button>

              <button
                type="button"
                onClick={() => setPayslipSubTab("my")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  payslipSubTab === "my" ? "bg-emerald-400 text-slate-950 shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                <Icon name="file-text" className="w-3.5 h-3.5" />
                <span>My Payslips</span>
              </button>
            </div>

            {payslipSubTab === "employee" && (
              <input
                type="text"
                value={payslipSearch}
                onChange={(e) => setPayslipSearch(e.target.value)}
                placeholder="Search employee..."
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-[#203a45] text-xs text-white focus:outline-none focus:border-emerald-400 w-60"
              />
            )}
          </div>

          {payslipSubTab === "employee" && (
            <div className="bg-[#10242e] rounded-2xl p-4 overflow-hidden">
              <div className="pb-3 border-b border-[#203a45] flex justify-between items-center">
                <div>
                  <div className="font-display font-bold text-white text-[16px]">Employee Payslips — {selectedCycle}</div>
                  <div className="text-[12px] text-slate-400">Preview and download official salary slips for team members</div>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase text-[10.5px] font-semibold border-b border-[#203a45]">
                    <tr>
                      <th className="py-3 px-4">Payslip ID</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Role & Dept</th>
                      <th className="py-3 px-4 text-right">Net Salary</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#203a45]">
                    {filteredPayslipEmployees.map((e) => {
                      const calc = getPayrollFor(e);
                      return (
                        <tr key={e.id} className="hover:bg-white/5">
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-400">PS-{e.id}-1126</td>
                          <td className="py-3 px-4"><span className="font-semibold text-white block">{e.name}</span><span className="text-[11px] text-slate-400">Grade {calc.grade}</span></td>
                          <td className="py-3 px-4"><span className="text-white block">{e.role}</span><span className="text-[11px] text-slate-400">{e.department}</span></td>
                          <td className="py-3 px-4 text-right font-num font-bold text-emerald-400">{mask(calc.netPayable)}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleViewPayslip(calc, selectedCycle)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-emerald-400 hover:text-white font-semibold cursor-pointer transition border-0"
                            >
                              View Payslip
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {payslipSubTab === "my" && (
            <div className="bg-[#10242e] rounded-2xl p-4 overflow-hidden">
              <div className="pb-3 border-b border-[#203a45] flex justify-between items-center">
                <div>
                  <div className="font-display font-bold text-white text-[16px]">My Past Payslips (Last 6 Months)</div>
                  <div className="text-[12px] text-slate-400">Pooja Patel • HR Manager • Human Resources</div>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase text-[10.5px] font-semibold border-b border-[#203a45]">
                    <tr>
                      <th className="py-3 px-4">Payslip ID</th>
                      <th className="py-3 px-4">Salary Cycle / Month</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Net Payable</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#203a45]">
                    {pastSixMonths.map((item) => {
                      const calc = getComputedPayroll(myProfileData);
                      return (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{item.id}</td>
                          <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                            <Icon name="calendar" className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.cycle}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">Direct Bank Transfer (NEFT)</td>
                          <td className="py-3 px-4 text-right font-num font-bold text-emerald-400">
                            {formatCurrency(calc.netPayable)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleViewPayslip(calc, item.cycle)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-emerald-400 hover:text-white font-semibold cursor-pointer transition border-0"
                            >
                              View & Download
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD BONUS MODAL */}
      {bonusModalEmp && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#10242e] border border-[#203a45] rounded-2xl shadow-2xl w-full max-w-md font-sans overflow-hidden text-white">
            <div className="bg-[#142c37] border-b border-[#203a45] p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm text-white font-display">Add Employee Bonus</h3>
                <p className="text-[11px] text-slate-400">{bonusModalEmp.name} • {selectedCycle}</p>
              </div>
              <button type="button" onClick={() => setBonusModalEmp(null)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveBonus} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Bonus Amount (₹) *</label>
                <input type="number" min="1" step="1" required placeholder="e.g. 5000" value={bonusForm.amount}
                  onChange={(e) => setBonusForm((prev) => ({ ...prev, amount: e.target.value }))} className={inputClass} />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Reason for Bonus *</label>
                <textarea rows="3" required placeholder="e.g. Quarterly Performance Bonus..." value={bonusForm.reason}
                  onChange={(e) => setBonusForm((prev) => ({ ...prev, reason: e.target.value }))} className={inputClass} />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#203a45]">
                <button type="button" onClick={() => setBonusModalEmp(null)} className="bg-white/5 text-white px-4 py-2 rounded-xl font-semibold border-0 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold cursor-pointer shadow border-0">Save Bonus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYSLIP PREVIEW MODAL */}
      {previewPayslipData && (
        <div className="fixed inset-0 bg-black/78 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#142c37] text-white border border-[#34515b] rounded-2xl w-full max-w-[1120px] max-h-[94vh] overflow-y-auto p-5 shadow-2xl font-sans">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold">Payslip Preview - {previewPayslipData.calc.name}</h2>
              <button type="button" onClick={() => setPreviewPayslipData(null)} className="px-3 py-1.5 rounded-lg bg-[#193440] border border-[#34515b] text-white font-bold cursor-pointer hover:bg-[#34515b]">✕</button>
            </div>

            <div className="bg-white text-[#172b35] border-2 border-[#52616b] rounded-md overflow-hidden p-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-4 border-b-2 border-[#52616b] gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 bg-rose-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">TM</div>
                  <div>
                    <span className="text-rose-600 font-bold text-lg tracking-tight block leading-none">Technomold</span>
                    <span className="text-slate-900 font-extrabold text-[10px] tracking-wider uppercase">IT SOLUTIONS PVT LTD</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-900 font-bold text-sm">Technomold IT Solutions Pvt Ltd</div>
                  <div className="text-slate-600 text-[11px] leading-relaxed mt-0.5">{COMPANY.singleLineAddress}</div>
                </div>
                <div></div>
              </div>

              <div className="text-center p-3 text-[15px] font-black border-b border-[#52616b] bg-[#edf5f5] my-2">
                EMPLOYEE PAYSLIP - {previewPayslipData.cycle.toUpperCase()}
              </div>

              <table className="w-full border-collapse mb-3" style={{ tableLayout: "fixed" }}>
                <tbody>
                  {getDetailRows(previewPayslipData.calc).map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] font-bold bg-[#f4f7f8]" style={{ width: "19%" }}>{row[0]}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px]" style={{ width: "31%" }}>{clean(row[1])}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] font-bold bg-[#f4f7f8]" style={{ width: "19%" }}>{row[2]}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px]" style={{ width: "31%" }}>{clean(row[3])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-center text-[11px] font-bold bg-[#e7f1f3] border border-[#52616b] p-2 mb-3">
                Standard Days: {POLICY.lopDivisor}    Payable Days: {POLICY.lopDivisor - (previewPayslipData.calc.lopDays || 0)}    LOP Days: {previewPayslipData.calc.lopDays || 0}
              </div>

              <table className="w-full border-collapse mb-3">
                <thead>
                  <tr className="bg-[#e0eff0]">
                    {["EARNINGS", "MONTHLY RATE", "CURRENT MONTH", "ARREAR", "TOTAL", "DEDUCTIONS", "TOTAL"].map((h, i) => (
                      <th key={i} className="border border-[#52616b] p-[10px_6px] text-[10px] font-extrabold text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getPayslipRows(previewPayslipData.calc).map((row, i) => (
                    <tr key={i}>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px]">{row.earning}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(row.amount)}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(row.amount)}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(0)}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(row.amount)}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px]">{row.deduction || "—"}</td>
                      <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{row.deductionAmount !== null ? money(row.deductionAmount) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#e0efea] font-bold">
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] bg-[#f4f7f8]">GROSS EARNINGS</td>
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(previewPayslipData.calc.grossSalary)}</td>
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(previewPayslipData.calc.grossSalary)}</td>
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(0)}</td>
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(previewPayslipData.calc.grossSalary)}</td>
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] bg-[#f4f7f8]">TOTAL DEDUCTIONS</td>
                    <td className="border border-[#52616b] p-[9px_8px] text-[11px] text-right font-mono">{money(previewPayslipData.calc.deductions)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-center p-[14px_20px] bg-[#dff1e9] border border-[#52616b] rounded mb-3">
                <strong className="text-[16px]">NET PAY</strong>
                <strong className="text-[22px] text-[#126b49] font-mono">{money(previewPayslipData.calc.netPayable)}</strong>
              </div>

              <div className="p-[10px_12px] border border-[#52616b] rounded mb-5">
                <strong className="text-[11px] block mb-1">AMOUNT IN WORDS</strong>
                <p className="text-[12px] font-semibold m-0">{amountInWords(previewPayslipData.calc.netPayable)}</p>
              </div>

              <div className="flex justify-end items-end pt-4 border-t border-dashed border-[#52616b]">
                <div className="text-right flex flex-col items-center">
                  <span className="font-['Brush_Script_MT',cursive,serif] italic text-2xl font-bold text-slate-900 tracking-wider mb-1 transform -rotate-3">
                    {COMPANY.signatory}
                  </span>
                  <div className="w-44 border-b border-[#52616b] my-1"></div>
                  <span className="text-[11px] font-semibold text-[#172b35]">Authorized Signatory ({COMPANY.signatory})</span>
                  <span className="text-[10px] text-slate-500">{COMPANY.name}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setPreviewPayslipData(null)} className="px-4 py-2 rounded-xl bg-[#193440] border border-[#34515b] text-white font-semibold cursor-pointer">Close</button>
              <button type="button" onClick={() => downloadPayslipPDF(previewPayslipData.calc, previewPayslipData.cycle)} className="px-5 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold cursor-pointer hover:brightness-105 border-0">Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / CONFIRM SALARY STRUCTURE MODAL */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#10242e] border border-[#203a45] rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto font-sans text-white">
            <div className="bg-[#142c37] border-b border-[#203a45] p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white font-display">
                  {f.isConfirmed ? "View Confirmed Salary Structure" : "Confirm & Lock Salary Structure"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400 text-slate-950">Grade {f.grade}</span>
              </div>
              <button type="button" onClick={() => setIsStructureModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveStructure} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Full Name *</label>
                  <input type="text" required disabled={f.isConfirmed} value={f.name}
                    onChange={(e) => handleFormFieldChange("name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Email *</label>
                  <input type="email" required disabled={f.isConfirmed} value={f.email}
                    onChange={(e) => handleFormFieldChange("email", e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Role *</label>
                  <select disabled={f.isConfirmed} value={f.role}
                    onChange={(e) => handleFormFieldChange("role", e.target.value)} className={inputClass}>
                    <option value="Software Engineer" className="bg-[#10242e]">Software Engineer</option>
                    <option value="Senior Software Engineer" className="bg-[#10242e]">Senior Software Engineer</option>
                    <option value="Frontend Developer" className="bg-[#10242e]">Frontend Developer</option>
                    <option value="UI/UX Designer" className="bg-[#10242e]">UI/UX Designer</option>
                    <option value="BDA" className="bg-[#10242e]">BDA</option>
                    <option value="BDE" className="bg-[#10242e]">BDE</option>
                    <option value="Telecaller" className="bg-[#10242e]">Telecaller</option>
                    {!["Software Engineer", "Senior Software Engineer", "Frontend Developer", "UI/UX Designer", "BDA", "BDE", "Telecaller"].includes(f.role) && (
                      <option value={f.role} className="bg-[#10242e]">{f.role}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Department *</label>
                  <select disabled={f.isConfirmed} value={f.department}
                    onChange={(e) => handleFormFieldChange("department", e.target.value)} className={inputClass}>
                    <option value="Engineering" className="bg-[#10242e]">Engineering</option>
                    <option value="Product & Design" className="bg-[#10242e]">Product & Design</option>
                    <option value="HR & Operations" className="bg-[#10242e]">HR & Operations</option>
                    {!["Engineering", "Product & Design", "HR & Operations"].includes(f.department) && (
                      <option value={f.department} className="bg-[#10242e]">{f.department}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Location</label>
                  <select disabled={f.isConfirmed} value={LOCATIONS.includes(f.location) ? f.location : "Other"}
                    onChange={(e) => handleFormFieldChange("location", e.target.value)} className={inputClass}>
                    {LOCATIONS.map((l) => <option key={l} value={l} className="bg-[#10242e]">{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Experience (yrs)</label>
                  <input type="number" min="0" step="1" disabled={f.isConfirmed} value={f.experience}
                    onChange={(e) => handleFormFieldChange("experience", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Package (LPA) *</label>
                  <input type="number" min="0" step="0.1" required disabled={f.isConfirmed} value={f.lpa}
                    onChange={(e) => handleLpaChange(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input type="checkbox" disabled={f.isConfirmed} checked={f.pfApplicable}
                    onChange={(e) => handleFormFieldChange("pfApplicable", e.target.checked)} />
                  PF applicable
                </label>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input type="checkbox" disabled={f.isConfirmed} checked={f.ptApplicable}
                    onChange={(e) => handleFormFieldChange("ptApplicable", e.target.checked)} />
                  Professional tax applicable
                </label>
              </div>

              <div className="rounded-xl border-0 overflow-hidden bg-white/5">
                <div className="px-3 py-2 bg-white/10 flex justify-between text-[11px] font-semibold text-slate-400 uppercase">
                  <span>Breakup</span>
                  <span>Monthly / Annual</span>
                </div>
                <table className="w-full text-[11.5px]">
                  <tbody className="divide-y divide-white/5">
                    {breakupRows.map(([label, value, strong]) => (
                      <tr key={label} className={strong ? "bg-white/10 font-bold text-white" : "text-white"}>
                        <td className="py-1.5 px-3">{label}</td>
                        <td className="py-1.5 px-3 text-right font-num">
                          {formatCurrency(value || 0)} <span className="text-slate-400">/ {formatCurrency((value || 0) * 12)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10.5px] text-slate-400">
                CTC = Gross + Employer PF + Gratuity + Insurance. Special allowance is the balancing amount. Rates are policy settings; confirm with your CA.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#203a45]">
                <button type="button" onClick={() => setIsStructureModalOpen(false)} className="bg-white/5 text-white px-4 py-2 rounded-xl font-semibold border-0 cursor-pointer">Close</button>
                {!f.isConfirmed && (
                  <button type="submit" className="bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold cursor-pointer shadow border-0">Confirm & Lock</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollView;