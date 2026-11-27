
import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { TECHNOMOLD_LOGO_BASE64 } from "../assets/logoBase64.js";

import {
  EMPLOYEES,
  getDepartmentOptions,
  resolveEmployeeIdentity,
  sameDepartment,
} from "../data.js";

import {
  Card,
  Table,
  Who,
  Pill,
  Icon,
  Pagination,
} from "../components/ui.jsx";

// ============================================================
// CONFIGURATION
// ============================================================

const MONTH = "November 2026";
const PAYROLL_DAYS = 30;
const PAGE_SIZE = 5;

const COLORS = {
  bg: "#10242e",
  panel: "#142c37",
  surface: "#193440",
  border: "#34515b",
  text: "#e5eff0",
  muted: "#9fb2ba",
  accent: "#61d8c4",
  good: "#4fdb91",
  warn: "#e7c45d",
};

const num = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  return Number(String(value ?? 0).replace(/[₹,\s]/g, "")) || 0;
};

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const money = (value, decimals = 2) =>
  `₹${num(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const compactMoney = (value) => {
  const amount = num(value);
  const abs = Math.abs(amount);

  if (abs >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`;
  }
  return money(amount, 0);
};

const pdfMoney = (value) =>
  `Rs. ${num(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const clean = (value, fallback = "Demo - Not Provided") =>
  value === null ||
  value === undefined ||
  String(value).trim() === ""
    ? fallback
    : String(value);

// ============================================================
// COMPANY DETAILS
// ============================================================

const COMPANY = {
  id: "COMP-001",
  name: "TECHNOMOLD IT SOLUTIONS PRIVATE LIMITED",
  addressLine1: "Plot No. 24, Hitech City Road,",
  addressLine2: "Madhapur, Hyderabad,",
  addressLine3: "Telangana - 500081",
  phone: "+91 90000 00000",
  email: "hr@technomold.com",
  logoText: "T",
};

const BRANCHES = {
  Hyderabad: {
    city: "Hyderabad",
    address:
      "Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081",
  },
  Bengaluru: {
    city: "Bengaluru",
    address:
      "Building 12, Outer Ring Road, Bengaluru, Karnataka - 560103",
  },
  Pune: {
    city: "Pune",
    address:
      "Office 301, Hinjawadi Phase 1, Pune, Maharashtra - 411057",
  },
  Mumbai: {
    city: "Mumbai",
    address:
      "Office 502, Andheri East, Mumbai, Maharashtra - 400093",
  },
  Chennai: {
    city: "Chennai",
    address:
      "Office 204, OMR Road, Chennai, Tamil Nadu - 600096",
  },
};

// ============================================================
// EMPLOYEE PAYROLL DATA
// ============================================================

const INITIAL_EMPLOYEE_PAYROLL = [
  {
    id: "EMP-1187",
    name: "Lokesh Kumar",
    role: "Frontend Developer",
    designation: "Frontend Developer",
    department: "Engineering",
    gross: 85000,
    basic: 34000,
    hra: 17000,
    csa: 28900,
    other: 5100,
    bonus: 0,
    epf: 4080,
    pt: 200,
    tds: 5300,
    leavesTaken: 0,
    leaveDeduction: 0,
    status: "Disbursed",
    location: "Hyderabad",
    doj: "03/01/2023",
    dob: "15/08/1998",
    gender: "Male",
    grade: "L3",
    bankName: "HDFC Bank",
    bankAccount: "501004892011",
    pan: "ABCDE4421K",
    pfNumber: "AP/HYD/0048920/000/1187",
    uan: "101248920118",
    annualCTC: 1020000,
  },
];

const INITIAL_STRUCTURES = [
  {
    id: "L3",
    designation: "Frontend Developer (Grade L3)",
    ctc: 1020000,
    gross: 85000,
    basicRate: 40,
    hraRate: 50,
    csaRate: 34,
    bonus: 0,
    epfRate: 12,
    pt: 200,
    tds: 5300,
  },
];

const INITIAL_PAYROLL_HISTORY = [
  { id: 'PAY-2026-10', month: 'October 2026', period: '01 Oct 2026 – 31 Oct 2026', paidDate: '31 Oct 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-98112' },
  { id: 'PAY-2026-09', month: 'September 2026', period: '01 Sep 2026 – 30 Sep 2026', paidDate: '30 Sep 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-97451' },
  { id: 'PAY-2026-08', month: 'August 2026', period: '01 Aug 2026 – 31 Aug 2026', paidDate: '31 Aug 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-96890' },
  { id: 'PAY-2026-07', month: 'July 2026', period: '01 Jul 2026 – 31 Jul 2026', paidDate: '31 Jul 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-96120' },
  { id: 'PAY-2026-06', month: 'June 2026', period: '01 Jun 2026 – 30 Jun 2026', paidDate: '30 Jun 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-95431' },
  { id: 'PAY-2026-05', month: 'May 2026', period: '01 May 2026 – 31 May 2026', paidDate: '31 May 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-94881' },
  { id: 'PAY-2026-04', month: 'April 2026', period: '01 Apr 2026 – 30 Apr 2026', paidDate: '30 Apr 2026', gross: 85000, deductions: 9580, net: 75420, status: 'Paid', ref: 'DEMO-HDFC-94110' },
  { id: 'PAY-2026-03', month: 'March 2026', period: '01 Mar 2026 – 31 Mar 2026', paidDate: '31 Mar 2026', gross: 80000, deductions: 8800, net: 71200, status: 'Paid', ref: 'DEMO-HDFC-93502' },
  { id: 'PAY-2026-02', month: 'February 2026', period: '01 Feb 2026 – 28 Feb 2026', paidDate: '28 Feb 2026', gross: 80000, deductions: 8800, net: 71200, status: 'Paid', ref: 'DEMO-HDFC-92890' },
  { id: 'PAY-2026-01', month: 'January 2026', period: '01 Jan 2026 – 31 Jan 2026', paidDate: '31 Jan 2026', gross: 80000, deductions: 8800, net: 71200, status: 'Paid', ref: 'DEMO-HDFC-92140' }
];

// ============================================================
// SALARY CALCULATIONS
// ============================================================

function calculateStructure(structure) {
  const gross = num(structure.gross);
  const basicRate = num(structure.basicRate ?? 50);
  const hraRate = num(structure.hraRate ?? 35);
  const csaRate = num(structure.csaRate ?? 25);
  const epfRate = num(structure.epfRate ?? 12);

  const basic = round2((gross * basicRate) / 100);
  const hra = round2((basic * hraRate) / 100);
  const csa = round2((gross * csaRate) / 100);
  const bonus = num(structure.bonus);
  const other = round2(gross - basic - hra - csa - bonus);
  const epf = round2((basic * epfRate) / 100);
  const pt = num(structure.pt ?? 200);
  const tds = num(structure.tds);
  const leaveDeduction = num(structure.leaveDeduction);

  const totalDeductions = round2(
    epf + pt + tds + leaveDeduction
  );

  return {
    gross,
    basic,
    hra,
    csa,
    bonus,
    other,
    epf,
    pt,
    tds,
    leaveDeduction,
    totalDeductions,
    net: round2(gross - totalDeductions),
  };
}

function normalizePayroll(employee) {
  const gross = num(employee.gross);
  const basic = num(employee.basic) || round2(gross * 0.5);
  const hra = num(employee.hra) || round2(basic * 0.35);
  const csa = round2(gross * 0.25);
  const bonus = num(employee.bonus);

  const other = round2(
    Math.max(0, gross - basic - hra - csa)
  );

  const regularEarnings = round2(
    basic + hra + csa + other
  );

  const totalEarnings = round2(regularEarnings + bonus);

  const epf = num(employee.epf);
  const pt = num(employee.pt);
  const tds = num(employee.tds);
  const leaveDeduction = num(employee.leaveDeduction);

  const totalDeductions = round2(
    epf + pt + tds + leaveDeduction
  );

  const suffix = String(employee.id)
    .replace(/\D/g, "")
    .slice(-4)
    .padStart(4, "0");

  return {
    ...employee,
    company: COMPANY,
    branch: BRANCHES[employee.location] || BRANCHES.Hyderabad,
    gross,
    basic,
    hra,
    csa,
    bonus,
    other,
    regularEarnings,
    totalEarnings,
    epf,
    pt,
    tds,
    leaveDeduction,
    totalDeductions,
    net: round2(totalEarnings - totalDeductions),
    gender: employee.gender || "Male",
    bankAccount: employee.bankAccount || "501004892011",
    pan: employee.pan || "ABCDE4421K",
    pfNumber: employee.pfNumber || "AP/HYD/0048920/000/1187",
    uan: employee.uan || "101248920118",
    esiNumber: employee.esiNumber || "Not Applicable",
    paymentMode: employee.paymentMode || "Bank Transfer",
    standardDays: employee.standardDays || PAYROLL_DAYS,
    lopDays: num(employee.leavesTaken || 0),
    payableDays:
      employee.payableDays ??
      Math.max(0, PAYROLL_DAYS - num(employee.leavesTaken || 0)),
    arrearDays: employee.arrearDays || 0,
    lopReversalDays: employee.lopReversalDays || 0,
  };
}

function gradePayslip(structure) {
  const result = calculateStructure(structure);

  return {
    id: `GRADE-${structure.id}`,
    name: `Sample Employee - Grade ${structure.id}`,
    role: structure.designation,
    department: "Salary Structure",
    grade: structure.id,
    location: "Hyderabad",
    doj: "01/01/2024",
    dob: "01/01/1998",
    gender: "M",
    bankName: "HDFC Bank",
    gross: result.gross,
    basic: result.basic,
    hra: result.hra,
    csa: result.csa,
    bonus: result.bonus,
    epf: result.epf,
    pt: result.pt,
    tds: result.tds,
    leaveDeduction: 0,
    leavesTaken: 0,
    status: "Sample",
    sample: true,
  };
}

// ============================================================
// AMOUNT IN WORDS
// ============================================================

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

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

  if (n === 0) return "Zero";

  const units = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];

  const result = [];

  for (const [divisor, label] of units) {
    if (n >= divisor) {
      const count = Math.floor(n / divisor);
      result.push(`${wordsBelowThousand(count)} ${label}`);
      n %= divisor;
    }
  }

  if (n > 0) {
    result.push(wordsBelowThousand(n));
  }

  return result.join(" ");
}

function amountInWords(value) {
  const amount = round2(Math.max(0, num(value)));
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = `Rupees ${numberToIndianWords(rupees)}`;

  if (paise > 0) {
    result += ` and ${numberToIndianWords(paise)} Paise`;
  }

  return `${result} Only`;
}

function getPayslipRows(employee) {
  return [
    {
      earning: "BASIC SALARY",
      amount: employee.basic,
      deduction: "EMPLOYEE EPF",
      deductionAmount: employee.epf,
    },
    {
      earning: "HOUSE RENT ALLOWANCE",
      amount: employee.hra,
      deduction: "PROFESSIONAL TAX",
      deductionAmount: employee.pt,
    },
    {
      earning: "CONVEYANCE & SPECIAL",
      amount: employee.csa,
      deduction: "TDS / INCOME TAX",
      deductionAmount: employee.tds,
    },
    {
      earning: "BONUS",
      amount: employee.bonus,
      deduction: "LEAVE DEDUCTION (LOP)",
      deductionAmount: employee.leaveDeduction,
    },
    {
      earning: "OTHER ALLOWANCE",
      amount: employee.other,
      deduction: "",
      deductionAmount: null,
    },
  ];
}

// ============================================================
// REUSABLE STYLES
// ============================================================

const panelStyle = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  padding: 20,
  minWidth: 0,
};

const responsiveGrid = (minimum = 290) => ({
  display: "grid",
  gridTemplateColumns:
    `repeat(auto-fit, minmax(min(100%, ${minimum}px), 1fr))`,
  gap: 16,
  width: "100%",
  minWidth: 0,
});

function SingleRowGrid({ children, minCardWidth = 145 }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        width: "100%",
        minWidth: 0,
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: 5,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            `repeat(6, minmax(${minCardWidth}px, 1fr))`,
          gap: 10,
          minWidth: `calc(${minCardWidth * 6}px + 50px)`,
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  fullValue,
  description,
  accent = COLORS.accent,
  onClick,
  active = false,
}) {
  return (
    <button
      type="button"
      className={`payroll-metric-card${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      title={`${label}: ${fullValue || value}`}
      style={{
        minWidth: 0,
        height: 108,
        padding: "11px 11px",
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        background:
          "linear-gradient(145deg, #193440 0%, #10242e 100%)",
        boxShadow: active ? `0 0 0 1px ${accent}40, 0 8px 20px rgba(0,0,0,0.18)` : "0 5px 15px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 4,
        overflow: "hidden",
        textAlign: "left",
        color: COLORS.text,
        cursor: "pointer",
        transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
        borderColor: active ? accent : COLORS.border,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: COLORS.muted,
          fontWeight: 700,
          lineHeight: 1.3,
          minHeight: 22,
          textTransform: "uppercase",
          letterSpacing: 0.25,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "clamp(15px, 1.35vw, 19px)",
          fontWeight: 800,
          color: accent,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 10,
          color: COLORS.muted,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {description}
      </div>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  fullValue,
  accent = COLORS.text,
  onClick,
  isActive = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`payroll-summary-card${isActive ? " is-active" : ""}`}
      title={`${label}: ${fullValue || value}`}
      style={{
        background: COLORS.surface,
        border: isActive ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "14px 12px",
        minWidth: 0,
        height: 98,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        textAlign: "left",
        font: "inherit",
        color: COLORS.text,
        cursor: "pointer",
        transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: COLORS.muted,
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: "clamp(15px, 1.3vw, 20px)",
          fontWeight: 800,
          color: accent,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </strong>
    </button>
  );
}

function SectionHeading({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 22,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: COLORS.text,
            margin: 0,
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: COLORS.muted,
              marginTop: 7,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================

function Dialog({ title, children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: COLORS.panel,
          color: COLORS.text,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          width: "100%",
          maxWidth: 1120,
          maxHeight: "94vh",
          overflowY: "auto",
          padding: 20,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold">{title}</h2>

          <button
            type="button"
            className="btn2"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon k="close" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function CompanyLogo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 8px",
      }}
    >
      <img
        src="/technomold-logo.png"
        alt="Technomold IT Solutions"
        style={{
          height: 48,
          width: "auto",
          maxWidth: 170,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

// ============================================================
// PDF PAYSLIP
// ============================================================

function downloadPayslip(rawEmployee) {
  const employee = normalizePayroll(rawEmployee);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const left = 12;
  const right = 198;
  const width = right - left; // 186mm

  const drawText = (
    text,
    x,
    y,
    size = 8,
    bold = false,
    align = "left",
    color = [25, 35, 45]
  ) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(String(text), x, y, { align });
  };

  const line = (x1, y1, x2, y2, color = [160, 175, 185], lineWidth = 0.25) => {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(lineWidth);
    pdf.line(x1, y1, x2, y2);
  };

  // Outer border
  pdf.setDrawColor(140, 160, 175);
  pdf.setLineWidth(0.4);
  pdf.rect(left, 10, width, 275);

  // Logo on Left
  try {
    // 3.45 aspect ratio (width 46, height ~13.3)
    pdf.addImage(TECHNOMOLD_LOGO_BASE64, "PNG", 16, 14, 46, 13.3);
  } catch (err) {
    console.warn("Logo draw error:", err);
  }

  // Centered Company Information
  const headerCenterX = 120;
  drawText("TECHNOMOLD IT SOLUTIONS PRIVATE LIMITED", headerCenterX, 16, 10.5, true, "center", [18, 40, 56]);
  drawText("Plot No. 24, Hitech City Road,", headerCenterX, 21.5, 8, false, "center", [55, 71, 79]);
  drawText("Madhapur, Hyderabad,", headerCenterX, 26, 8, false, "center", [55, 71, 79]);
  drawText("Telangana - 500081", headerCenterX, 30.5, 8, false, "center", [55, 71, 79]);

  // Divider below header
  line(left, 35, right, 35, [140, 160, 175], 0.35);

  // Title: Payslip for the month of NOVEMBER 2026
  drawText(`Payslip for the month of ${MONTH.toUpperCase()}`, 105, 41.5, 10.5, true, "center", [16, 37, 50]);

  // Divider below title
  line(left, 45, right, 45, [140, 160, 175], 0.35);

  // Employee Details (4 columns)
  const employeeRows = [
    ["Employee ID", employee.id, "Date of Joining", employee.doj],
    ["Employee Name", employee.name, "Date of Birth", employee.dob],
    ["Designation", employee.role, "Gender", employee.gender],
    ["Department", employee.department, "Grade", employee.grade],
    ["Bank Name", employee.bankName, "Location", employee.location],
    ["Bank Account", employee.bankAccount, "PAN", employee.pan],
    ["PF Number", employee.pfNumber, "UAN", employee.uan],
    ["ESI Number", employee.esiNumber, "Payment Mode", employee.paymentMode],
  ];

  // Col widths: 36, 57, 36, 57 = 186
  const colX = [12, 48, 105, 141, 198];
  const rowHeight = 7.2;
  let y = 45;

  employeeRows.forEach((row) => {
    // Fill label backgrounds
    pdf.setFillColor(243, 246, 248);
    pdf.rect(colX[0], y, colX[1] - colX[0], rowHeight, "F");
    pdf.rect(colX[2], y, colX[3] - colX[2], rowHeight, "F");

    line(left, y + rowHeight, right, y + rowHeight, [176, 190, 197], 0.2);

    for (let i = 1; i < colX.length - 1; i++) {
      line(colX[i], y, colX[i], y + rowHeight, [176, 190, 197], 0.2);
    }

    drawText(row[0], colX[0] + 2.5, y + 4.9, 6.8, true, "left", [44, 62, 80]);

    const value1 = pdf.splitTextToSize(
      clean(row[1]),
      colX[2] - colX[1] - 4
    )[0];
    drawText(value1, colX[1] + 2.5, y + 4.9, 6.8, false, "left", [28, 40, 51]);

    drawText(row[2], colX[2] + 2.5, y + 4.9, 6.8, true, "left", [44, 62, 80]);

    const value2 = pdf.splitTextToSize(
      clean(row[3]),
      colX[4] - colX[3] - 4
    )[0];
    drawText(value2, colX[3] + 2.5, y + 4.9, 6.8, false, "left", [28, 40, 51]);

    y += rowHeight;
  });

  // Attendance Summary Strip (single bar, 4 items)
  const attHeight = 8;
  pdf.setFillColor(235, 243, 245);
  pdf.rect(left, y, width, attHeight, "F");
  line(left, y + attHeight, right, y + attHeight, [176, 190, 197], 0.25);

  const attW = width / 4;
  drawText(`Standard Days: ${employee.standardDays}`, left + attW * 0.5, y + 5.2, 7.2, true, "center", [30, 58, 71]);
  drawText(`Payable Days: ${employee.payableDays}`, left + attW * 1.5, y + 5.2, 7.2, true, "center", [30, 58, 71]);
  drawText(`LOP Days: ${employee.lopDays}`, left + attW * 2.5, y + 5.2, 7.2, true, "center", [30, 58, 71]);
  drawText(`Arrear Days: ${employee.arrearDays}`, left + attW * 3.5, y + 5.2, 7.2, true, "center", [30, 58, 71]);

  y += attHeight;

  // Earnings & Deductions Table (7 columns)
  // [EARNINGS, MONTHLY, CURRENT, ARREAR, TOTAL, DEDUCTIONS, TOTAL]
  const x = [12, 56, 78, 100, 120, 142, 176, 198];
  const tableHeaderHeight = 8.5;

  pdf.setFillColor(226, 237, 240);
  pdf.rect(left, y, width, tableHeaderHeight, "F");

  const headers = [
    "EARNINGS",
    "MONTHLY",
    "CURRENT",
    "ARREAR",
    "TOTAL",
    "DEDUCTIONS",
    "TOTAL",
  ];

  for (let i = 1; i < x.length - 1; i++) {
    line(x[i], y, x[i], y + tableHeaderHeight, [176, 190, 197], 0.2);
  }

  headers.forEach((header, i) => {
    drawText(
      header,
      (x[i] + x[i + 1]) / 2,
      y + 5.5,
      6.5,
      true,
      "center",
      [26, 54, 68]
    );
  });

  y += tableHeaderHeight;
  line(left, y, right, y, [176, 190, 197], 0.25);

  const rows = getPayslipRows(employee);
  const dataRowHeight = 7.8;

  rows.forEach((row) => {
    const values = [
      row.earning,
      pdfMoney(row.amount),
      pdfMoney(row.amount),
      pdfMoney(0),
      pdfMoney(row.amount),
      row.deduction || "—",
      row.deductionAmount === null
        ? "—"
        : pdfMoney(row.deductionAmount),
    ];

    values.forEach((value, i) => {
      if (i === 0 || i === 5) {
        const text = pdf.splitTextToSize(
          value,
          x[i + 1] - x[i] - 3
        )[0];
        drawText(text, x[i] + 2, y + 5.2, 6.4, false, "left", [28, 40, 51]);
      } else {
        drawText(
          value,
          x[i + 1] - 2,
          y + 5.2,
          6.4,
          false,
          "right",
          [28, 40, 51]
        );
      }
    });

    for (let i = 1; i < x.length - 1; i++) {
      line(x[i], y, x[i], y + dataRowHeight, [176, 190, 197], 0.2);
    }

    y += dataRowHeight;
    line(left, y, right, y, [176, 190, 197], 0.2);
  });

  // Totals Row
  const totalsHeight = 8.5;
  pdf.setFillColor(235, 243, 245);
  pdf.rect(left, y, width, totalsHeight, "F");

  const totals = [
    "GROSS EARNINGS",
    pdfMoney(employee.totalEarnings),
    pdfMoney(employee.totalEarnings),
    pdfMoney(0),
    pdfMoney(employee.totalEarnings),
    "TOTAL DEDUCTIONS",
    pdfMoney(employee.totalDeductions),
  ];

  totals.forEach((value, i) => {
    const text = pdf.splitTextToSize(
      value,
      x[i + 1] - x[i] - 3
    )[0];

    drawText(
      text,
      i === 0 || i === 5 ? x[i] + 2 : x[i + 1] - 2,
      y + 5.5,
      6.3,
      true,
      i === 0 || i === 5 ? "left" : "right",
      [20, 42, 54]
    );
  });

  for (let i = 1; i < x.length - 1; i++) {
    line(x[i], y, x[i], y + totalsHeight, [176, 190, 197], 0.2);
  }

  y += totalsHeight;
  line(left, y, right, y, [140, 160, 175], 0.35);

  // Net Pay Strip
  const netHeight = 11;
  pdf.setFillColor(235, 243, 245);
  pdf.rect(left, y, width, netHeight, "F");

  drawText("NET PAY", 16, y + 7.2, 10, true, "left", [19, 41, 56]);
  drawText(`Rs. ${pdfMoney(employee.net)}`, 194, y + 7.2, 11, true, "right", [15, 81, 50]);

  y += netHeight;
  line(left, y, right, y, [176, 190, 197], 0.25);

  // Amount in Words Box
  drawText("AMOUNT IN WORDS:", 16, y + 6.2, 7.5, true, "left", [44, 62, 80]);

  const wrappedWords = pdf.splitTextToSize(
    amountInWords(employee.net),
    170
  );
  drawText(wrappedWords, 16, y + 11.2, 7.8, false, "left", [28, 40, 51]);

  // Authorized Signatory Block (Right side)
  drawText("Authorized Signatory", 192, 252, 8.5, true, "right", [26, 37, 47]);
  drawText("Technomold IT Solutions Private Limited", 192, 257, 7.5, false, "right", [84, 110, 122]);

  // Bottom Disclaimer
  line(left, 268, right, 268, [207, 216, 220], 0.25);
  drawText(
    "Sample Payroll Record - Not Valid as Proof of Salary",
    105,
    274,
    7.5,
    false,
    "center",
    [120, 144, 156]
  );

  pdf.save(
    `Payslip_${employee.id}_${MONTH.replace(" ", "_")}.pdf`
  );
}

// ============================================================
// PAYSLIP PREVIEW
// ============================================================

function PayslipPreview({ employee: rawEmployee, onClose, show }) {
  const employee = normalizePayroll(rawEmployee);
  const rows = getPayslipRows(employee);

  const cell = {
    border: "1px solid #b0bec5",
    padding: "8px 10px",
    fontSize: 11,
    color: "#1c2833",
    verticalAlign: "middle",
    overflowWrap: "anywhere",
  };

  const labelCell = {
    ...cell,
    fontWeight: 700,
    background: "#f3f6f8",
    color: "#2c3e50",
  };

  const headerCell = {
    ...cell,
    background: "#e2edf0",
    fontWeight: 800,
    textAlign: "center",
    fontSize: 10,
    color: "#1a3644",
  };

  const amountCell = {
    ...cell,
    textAlign: "right",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  };

  const details = [
    ["Employee ID", employee.id, "Date of Joining", employee.doj],
    ["Employee Name", employee.name, "Date of Birth", employee.dob],
    ["Designation", employee.role, "Gender", employee.gender],
    ["Department", employee.department, "Grade", employee.grade],
    ["Bank Name", employee.bankName, "Location", employee.location],
    ["Bank Account", employee.bankAccount, "PAN", employee.pan],
    ["PF Number", employee.pfNumber, "UAN", employee.uan],
    [
      "ESI Number",
      employee.esiNumber,
      "Payment Mode",
      employee.paymentMode,
    ],
  ];

  return (
    <Dialog
      title={`Payslip Preview - ${employee.name}`}
      onClose={onClose}
    >
      <div
        style={{
          background: "#fff",
          color: "#172b35",
          border: "1.5px solid #90a4ae",
          borderRadius: 4,
          overflow: "hidden",
          maxWidth: 880,
          margin: "0 auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header with Logo and Company Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "18px 24px 14px",
            borderBottom: "1.5px solid #90a4ae",
          }}
        >
          <CompanyLogo />

          <div
            style={{
              flex: 1,
              textAlign: "center",
              minWidth: 0,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                margin: "0 0 4px",
                color: "#132938",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {COMPANY.name}
            </h2>

            <p style={{ fontSize: 11, margin: "2px 0", color: "#37474f" }}>
              {COMPANY.addressLine1}
            </p>

            <p style={{ fontSize: 11, margin: "2px 0", color: "#37474f" }}>
              {COMPANY.addressLine2}
            </p>

            <p style={{ fontSize: 11, margin: "2px 0", color: "#37474f" }}>
              {COMPANY.addressLine3}
            </p>
          </div>
        </div>

        {/* Payslip Month Title */}
        <div
          style={{
            textAlign: "center",
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 800,
            borderBottom: "1px solid #b0bec5",
            background: "#ffffff",
            color: "#102a36",
            letterSpacing: "0.03em",
          }}
        >
          Payslip for the month of {MONTH.toUpperCase()}
        </div>

        {/* Employee Details 4-Column Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 640,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>

            <tbody>
              {details.map((row, index) => (
                <tr key={index}>
                  <td style={labelCell}>{row[0]}</td>
                  <td style={cell}>{clean(row[1])}</td>
                  <td style={labelCell}>{row[2]}</td>
                  <td style={cell}>{clean(row[3])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Attendance Summary Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            background: "#ebf3f5",
            borderTop: "1px solid #b0bec5",
            borderBottom: "1px solid #b0bec5",
            padding: "9px 16px",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#1e3a47",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontWeight: 600, color: "#455a64" }}>Standard Days: </span>
            {employee.standardDays}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "#455a64" }}>Payable Days: </span>
            {employee.payableDays}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "#455a64" }}>LOP Days: </span>
            {employee.lopDays}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "#455a64" }}>Arrear Days: </span>
            {employee.arrearDays}
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 720,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                {[
                  "EARNINGS",
                  "MONTHLY",
                  "CURRENT",
                  "ARREAR",
                  "TOTAL",
                  "DEDUCTIONS",
                  "TOTAL",
                ].map((heading) => (
                  <th key={heading} style={headerCell}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.earning}>
                  <td style={cell}>{row.earning}</td>
                  <td style={amountCell}>{money(row.amount)}</td>
                  <td style={amountCell}>{money(row.amount)}</td>
                  <td style={amountCell}>{money(0)}</td>
                  <td style={amountCell}>{money(row.amount)}</td>
                  <td style={cell}>{row.deduction || "—"}</td>
                  <td style={amountCell}>
                    {row.deductionAmount === null
                      ? "—"
                      : money(row.deductionAmount)}
                  </td>
                </tr>
              ))}

              <tr style={{ background: "#ebf3f5" }}>
                <td style={labelCell}>GROSS EARNINGS</td>
                <td style={amountCell}>
                  <b>{money(employee.totalEarnings)}</b>
                </td>
                <td style={amountCell}>
                  <b>{money(employee.totalEarnings)}</b>
                </td>
                <td style={amountCell}>
                  <b>{money(0)}</b>
                </td>
                <td style={amountCell}>
                  <b>{money(employee.totalEarnings)}</b>
                </td>
                <td style={labelCell}>TOTAL DEDUCTIONS</td>
                <td style={amountCell}>
                  <b>{money(employee.totalDeductions)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Pay Strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "#ebf3f5",
            borderTop: "1.5px solid #90a4ae",
            borderBottom: "1px solid #b0bec5",
          }}
        >
          <strong
            style={{
              fontSize: 14,
              letterSpacing: "0.05em",
              color: "#132938",
            }}
          >
            NET PAY
          </strong>

          <strong
            style={{
              fontSize: 18,
              color: "#0f5132",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Rs. {money(employee.net)}
          </strong>
        </div>

        {/* Amount in Words */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid #b0bec5",
            background: "#fafcfc",
          }}
        >
          <strong style={{ fontSize: 11, color: "#2c3e50" }}>
            AMOUNT IN WORDS:
          </strong>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              fontWeight: 600,
              color: "#1c2833",
            }}
          >
            {amountInWords(employee.net)}
          </p>
        </div>

        {/* Authorized Signatory Block */}
        <div
          style={{
            padding: "24px 24px 16px",
            display: "flex",
            justifyContent: "flex-end",
            textAlign: "right",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#1a252f",
                marginBottom: 4,
              }}
            >
              Authorized Signatory
            </div>
            <div style={{ fontSize: 11, color: "#546e7a" }}>
              Technomold IT Solutions Private Limited
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div
          style={{
            padding: "10px 16px",
            textAlign: "center",
            fontSize: 10,
            color: "#78909c",
            borderTop: "1px solid #cfd8dc",
            background: "#f8fafd",
          }}
        >
          Sample Payroll Record - Not Valid as Proof of Salary
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-5">
        <button
          type="button"
          className="btn"
          onClick={() => {
            try {
              downloadPayslip(employee);
              show?.("Payslip PDF generated successfully.");
            } catch (error) {
              console.error("Payslip PDF error:", error);
              show?.("Unable to generate payslip PDF.");
            }
          }}
        >
          Download PDF
        </button>
      </div>
    </Dialog>
  );
}

// ============================================================
// SALARY STRUCTURE TABLE - UPDATED LAYOUT
// ============================================================

function SalaryStructureGrid({ structures, onPreview }) {
  const headings = [
    "DESIGNATION",
    "ANNUAL CTC",
    "MONTHLY GROSS",
    "BASIC (50%)",
    "HRA (35%)",
    "CSA (25%)",
    "EPF (12%)",
    "PT",
    "LEAVE POLICY (LOP)",
    "PAYSLIP",
  ];

  const tdStyle = {
    padding: "17px 13px",
    borderBottom: `1px dashed ${COLORS.border}`,
    fontSize: 12,
    whiteSpace: "nowrap",
    color: COLORS.text,
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 1250,
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            {headings.map((heading) => (
              <th
                key={heading}
                style={{
                  padding: "16px 13px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 800,
                  color: COLORS.muted,
                  whiteSpace: "nowrap",
                  borderBottom: `1px dashed ${COLORS.border}`,
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {structures.map((structure) => {
            const result = calculateStructure(structure);

            return (
              <tr key={structure.id}>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 800,
                    whiteSpace: "normal",
                    minWidth: 190,
                  }}
                >
                  {structure.designation}
                </td>

                <td style={tdStyle}>
                  {money(structure.ctc, 0)}
                </td>

                <td style={tdStyle}>
                  {money(result.gross, 0)}
                </td>

                <td style={tdStyle}>
                  {money(result.basic)}
                </td>

                <td style={tdStyle}>
                  {money(result.hra)}
                </td>

                <td style={tdStyle}>
                  {money(result.csa)}
                </td>

                <td style={tdStyle}>
                  {money(result.epf)}
                </td>

                <td style={tdStyle}>
                  {money(result.pt, 0)}
                </td>

                <td
                  style={{
                    ...tdStyle,
                    color: COLORS.warn,
                    fontWeight: 700,
                  }}
                >
                  Per Day Basic / 30 Days
                </td>

                <td style={tdStyle}>
                  <button
                    type="button"
                    className="btn2"
                    title="Preview Payslip"
                    onClick={() =>
                      onPreview(gradePayslip(structure))
                    }
                  >
                    <Icon k="eye" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// PAYROLL PROCESSING
// ============================================================

const workflowStages = [
  {
    title: "Attendance & Shift Lock",
    short: "Attendance",
    description: "Biometric Attendance & Shift Lock",
  },
  {
    title: "Leave & LOP Sync",
    short: "Leave & LOP",
    description: "Leave & Loss-of-Pay Sync",
  },
  {
    title: "Salary Computation",
    short: "Earnings",
    description: "Basic, HRA, CSA, Bonus & Allowances",
  },
  {
    title: "Statutory Deductions",
    short: "Deductions",
    description: "EPF, PT, TDS & Leave Deductions",
  },
  {
    title: "Payroll Authorization",
    short: "Authorization",
    description: "Super Admin Authorization",
  },
  {
    title: "Salary Disbursement",
    short: "Disbursement",
    description: "Bank Transfer & Payslip Dispatch",
  },
];

function PayrollProcessingPanel({
  runStage,
  payrollList,
  onAdvance,
  onSelectKpi,
  activePayrollKpi = "All",
  focusSignoff = false,
}) {
  const progress = Math.round((runStage / 6) * 100);
  const totalEmployees = payrollList.length;

  const disbursedEmployees = payrollList.filter(
    (employee) => employee.status === "Disbursed"
  ).length;

  const pendingEmployees = totalEmployees - disbursedEmployees;

  const processedPercentage = totalEmployees
    ? Math.round((disbursedEmployees / totalEmployees) * 100)
    : 0;

  const totalGross = payrollList.reduce(
    (sum, employee) => sum + employee.totalEarnings,
    0
  );

  const totalDeductions = payrollList.reduce(
    (sum, employee) => sum + employee.totalDeductions,
    0
  );

  const totalNet = payrollList.reduce(
    (sum, employee) => sum + employee.net,
    0
  );

  return (
    <section
      id="pay-proc"
      className={focusSignoff ? 'notification-focus' : ''}
      style={{
        gridColumn: "1 / -1",
        width: "100%",
        minWidth: 0,
        padding: "24px 22px",
        borderRadius: 18,
        background:
          "radial-gradient(ellipse at top right, rgba(80,60,150,0.13), transparent 45%), #10242e",
        border: "1px solid #294550",
        color: COLORS.text,
      }}
    >
      <SectionHeading
        title="Monthly Payroll Processing"
        subtitle={`${MONTH} Payroll Run`}
        action={
          <span
            style={{
              padding: "9px 17px",
              borderRadius: 25,
              background: "rgba(92,211,190,0.12)",
              color: COLORS.accent,
              border: "1px solid #347a75",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {runStage >= 6
              ? "Workflow Completed (Demo)"
              : "Payroll In Progress"}
          </span>
        }
      />

      <div style={{ marginBottom: 25 }}>
        <div className="flex justify-between items-center mb-3">
          <b className="text-sm">Payroll Processing Progress</b>
          <b style={{ color: COLORS.accent }}>{progress}%</b>
        </div>

        <div
          style={{
            height: 8,
            background: "#2b414c",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #39b8a8, #65d9c7)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div style={responsiveGrid(420)}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              overflowX: "auto",
              padding: "7px 0 16px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(6, minmax(90px, 1fr))",
                minWidth: 570,
              }}
            >
              {workflowStages.map((stage, index) => {
                const number = index + 1;
                const completed = number < runStage;
                const active = number === runStage;

                return (
                  <div
                    key={stage.title}
                    style={{ textAlign: "center" }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        margin: "0 auto 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: completed
                          ? COLORS.good
                          : active
                          ? "#38d3df"
                          : "#30434d",
                        color:
                          completed || active
                            ? "#08262b"
                            : "#c4d0d5",
                        fontWeight: 800,
                      }}
                    >
                      {completed ? "✓" : number}
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        color: active
                          ? COLORS.accent
                          : "#b7c7cc",
                      }}
                    >
                      {stage.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={panelStyle}>
            <h3 className="font-bold mb-4">
              Processing Checklist
            </h3>

            {workflowStages.map((stage, index) => {
              const number = index + 1;
              const completed = number < runStage;
              const active = number === runStage;

              return (
                <div
                  key={stage.title}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    padding: "13px 0",
                    borderBottom: "1px solid #294550",
                  }}
                >
                  <span style={{ fontSize: 12 }}>
                    {number}. {stage.description}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      color: completed
                        ? COLORS.good
                        : active
                        ? "#38d3df"
                        : COLORS.warn,
                    }}
                  >
                    {completed
                      ? "✓ Completed"
                      : active
                      ? "● Active"
                      : "● Pending"}
                  </span>
                </div>
              );
            })}

            <button
              type="button"
              className="btn mt-4"
              onClick={onAdvance}
              disabled={runStage >= 6}
            >
              {runStage >= 6
                ? "Workflow Complete"
                : "Advance Demo Workflow"}
            </button>

            <p className="text-xs text-muted mt-3">
              Demo workflow only. No actual salary transfer occurs.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
            minWidth: 0,
            alignContent: "start",
          }}
        >
          <div style={panelStyle}>
            <h3 className="font-bold mb-4">Payroll Summary</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
                gap: 12,
              }}
            >
              <SummaryCard
                label="Employees"
                value={totalEmployees}
                isActive={activePayrollKpi === "All"}
                onClick={() => onSelectKpi?.("Employees")}
              />

              <SummaryCard
                label="Gross Earnings"
                value={compactMoney(totalGross)}
                fullValue={money(totalGross)}
                accent={COLORS.accent}
                isActive={activePayrollKpi === "Gross Earnings"}
                onClick={() => onSelectKpi?.("Gross Earnings")}
              />

              <SummaryCard
                label="Deductions"
                value={compactMoney(totalDeductions)}
                fullValue={money(totalDeductions)}
                accent={COLORS.warn}
                isActive={activePayrollKpi === "Deductions"}
                onClick={() => onSelectKpi?.("Deductions")}
              />

              <SummaryCard
                label="Net Payable"
                value={compactMoney(totalNet)}
                fullValue={money(totalNet)}
                accent={COLORS.good}
                isActive={activePayrollKpi === "Net Payable"}
                onClick={() => onSelectKpi?.("Net Payable")}
              />
            </div>
          </div>

          <div style={panelStyle}>
            <h3 className="font-bold mb-4">
              Payroll Run Insights
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <div
                style={{
                  width: 145,
                  height: 145,
                  borderRadius: "50%",
                  background: `conic-gradient(
                    #4fdb91 0% ${processedPercentage}%,
                    #9258df ${processedPercentage}% 100%
                  )`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 108,
                    height: 108,
                    borderRadius: "50%",
                    background: COLORS.panel,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <b style={{ fontSize: 25 }}>
                    {processedPercentage}%
                  </b>

                  <span
                    style={{
                      fontSize: 11,
                      color: COLORS.muted,
                    }}
                  >
                    Disbursed
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 12, lineHeight: 2.4 }}>
                <div>
                  <span style={{ color: COLORS.good }}>●</span>{" "}
                  Disbursed: {disbursedEmployees}
                </div>

                <div>
                  <span style={{ color: "#9258df" }}>●</span>{" "}
                  Pending: {pendingEmployees}
                </div>

                <div>Total Employees: {totalEmployees}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MAIN PAYROLL PAGE
// ============================================================

export default function PayrollPage({
  logAction,
  show,
  activeTab,
  notificationTarget,
  clearNotificationTarget,
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(
    activeTab || "overview"
  );
  const [activePayrollKpi, setActivePayrollKpi] = useState("All");

  const [structures, setStructures] = useState(
    INITIAL_STRUCTURES
  );

  const [payrollList] = useState(() =>
    INITIAL_EMPLOYEE_PAYROLL.map((employee) => {
      const resolved = resolveEmployeeIdentity(employee);

      return normalizePayroll({
        ...resolved,
        ...employee,
      });
    })
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [payslipTarget, setPayslipTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [settlementSearch, setSettlementSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [runStage, setRunStage] = useState(3);
  const [focusSignoff, setFocusSignoff] = useState(false);

  const emptyStructure = {
    id: "",
    designation: "",
    ctc: "",
    basicRate: 50,
    hraRate: 35,
    csaRate: 25,
    bonus: 0,
    epfRate: 12,
    pt: 200,
    tds: 0,
  };

  const [newStructure, setNewStructure] = useState(
    emptyStructure
  );

  useEffect(() => {
    if (activeTab) setActiveSubmenu(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (notificationTarget?.page !== 'payroll' || notificationTarget?.type !== 'payroll-signoff') return
    setActiveSubmenu('processing')
    setRunStage(5)
    setFocusSignoff(true)
    requestAnimationFrame(() => document.getElementById('pay-proc')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    clearNotificationTarget?.()
  }, [notificationTarget]);

  useEffect(() => {
    if (!focusSignoff) return undefined
    const timeout = window.setTimeout(() => setFocusSignoff(false), 3200)
    return () => window.clearTimeout(timeout)
  }, [focusSignoff])

  const submenus = [
    ["overview", "Payroll Overview"],
    ["components", "Salary Components"],
    ["processing", "Payroll Processing"],
    ["monthly", "Monthly Payroll"],
    ["history", "Payroll History"],
    ["settlement", "Full & Final Settlement"],
  ];

  const totals = useMemo(() => {
    return payrollList.reduce(
      (acc, employee) => {
        acc.gross += employee.totalEarnings;
        acc.deductions += employee.totalDeductions;
        acc.net += employee.net;
        acc.epf += employee.epf;
        acc.pt += employee.pt;
        acc.tds += employee.tds;
        acc.lop += employee.leaveDeduction;
        acc.bonus += employee.bonus;
        return acc;
      },
      {
        gross: 0,
        deductions: 0,
        net: 0,
        epf: 0,
        pt: 0,
        tds: 0,
        lop: 0,
        bonus: 0,
      }
    );
  }, [payrollList]);

  const processedCount = payrollList.filter(
    (employee) => employee.status === "Disbursed"
  ).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesKpi = (employee) => {
      switch (activePayrollKpi) {
        case "Monthly Payroll":
        case "Total Net Salary":
          return employee.net > 0;
        case "Total Gross Earnings":
          return employee.totalEarnings > 0;
        case "Total Deductions":
        case "Deductions":
          return employee.totalDeductions > 0;
        case "Gross Earnings":
          return employee.totalEarnings > 0;
        case "Income Tax (TDS)":
          return employee.tds > 0;
        case "Employee EPF":
          return employee.epf > 0;
        case "Professional Tax":
          return employee.pt > 0;
        case "Leave Deductions":
          return employee.leaveDeduction > 0 || employee.leavesTaken > 0;
        case "Net Salary":
        case "Net Payable":
          return employee.net > 0;
        case "Employees Processed":
          return employee.status === "Disbursed";
        case "Total Bonus":
          return employee.bonus > 0;
        default:
          return true;
      }
    };

    return payrollList.filter((employee) =>
      matchesKpi(employee) &&
      (deptFilter === "All" ||
        sameDepartment(employee.department, deptFilter)) &&
      (employee.name.toLowerCase().includes(query) ||
        employee.id.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query))
    );
  }, [payrollList, search, deptFilter, activePayrollKpi]);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const settlementQuery = settlementSearch
    .trim()
    .toLowerCase();

  const settlementEmployee = payrollList[0];
  const settlementName = settlementEmployee?.name || "Lokesh Kumar";
  const settlementDepartment = settlementEmployee?.department || "Engineering";
  const settlementDesignation = settlementEmployee?.designation || "Frontend Developer";
  const settlementJoiningDate = settlementEmployee?.doj || "03 Jan 2023";

  // ==========================================================
  // CREATE SALARY STRUCTURE
  // ==========================================================

  const handleCreateStructure = (event) => {
    event.preventDefault();

    const id = newStructure.id.trim().toUpperCase();
    const ctc = num(newStructure.ctc);
    const gross = round2(ctc / 12);

    if (!id || !newStructure.designation.trim() || ctc <= 0) {
      show?.("Enter valid grade, designation and CTC.");
      return;
    }

    if (
      structures.some(
        (structure) => structure.id === id
      )
    ) {
      show?.("Grade already exists.");
      return;
    }

    const item = {
      ...newStructure,
      id,
      ctc,
      gross,
    };

    const result = calculateStructure(item);

    if (result.other < 0) {
      show?.(
        "Salary components exceed gross salary. Reduce bonus or component percentages."
      );
      return;
    }

    setStructures((previous) => [...previous, item]);
    setCreateOpen(false);

    logAction?.(
      `Created Salary Structure ${id}`,
      "Payroll Management"
    );

    show?.(`Grade ${id} created successfully.`);
    setNewStructure({ ...emptyStructure });
  };

  // ==========================================================
  // ADVANCE WORKFLOW
  // ==========================================================

  const handleAdvanceRun = () => {
    if (runStage >= 6) {
      show?.("Demo payroll workflow completed.");
      return;
    }

    const next = runStage + 1;
    setRunStage(next);

    logAction?.(
      `Advanced demo payroll to Stage ${next}`,
      "Payroll Management"
    );

    show?.(`Demo payroll advanced to Stage ${next}.`);
  };

  // ==========================================================
  // SETTLEMENT CSV
  // ==========================================================

  const downloadSettlementStatement = () => {
    if (!settlementEmployee) return;

    const rows = [
      ["Employee Name", settlementName],
      ["Employee ID", settlementEmployee.id],
      ["Department", settlementDepartment],
      ["Designation", settlementDesignation],
      ["Date of Joining", settlementJoiningDate],
      ["Last Working Date", "15 Nov 2026"],
      ["Gratuity (Demo)", "145000"],
      ["Leave Encashment (Demo)", "34000"],
      ["Notice Period Recovery", "0"],
      ["Total Settlement Amount", "179000"],
      ["Settlement Status", "Pending Approval"],
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Settlement_${settlementEmployee.id}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ==========================================================
  // DASHBOARD KPI ITEMS
  // ==========================================================
  // DASHBOARD KPIS (THE 6 CORE PAYROLL MODULES)
  // ==========================================================

  const runProgress = Math.round((runStage / 6) * 100);

  const dashboardMetrics = [
    {
      id: "overview",
      label: "Payroll Overview",
      value: compactMoney(totals.net),
      fullValue: `${money(totals.net, 0)} Net In-Hand Salary`,
      description: `${MONTH} • Your Salary`,
      accent: COLORS.accent,
    },
    {
      id: "components",
      label: "Salary Components",
      value: "Grade L3",
      fullValue: "Frontend Developer (Grade L3)",
      description: "Basic, HRA, CSA & EPF",
      accent: "#8cb8ff",
    },
    {
      id: "processing",
      label: "Payroll Processing",
      value: "Disbursed",
      fullValue: `${MONTH} Salary Disbursed`,
      description: "Attendance Verified • 0 LOP",
      accent: COLORS.warn,
    },
    {
      id: "monthly",
      label: "Monthly Payroll",
      value: compactMoney(totals.gross),
      fullValue: `${money(totals.gross, 0)} Monthly Gross`,
      description: "1 Record • Lokesh Kumar",
      accent: COLORS.good,
    },
    {
      id: "history",
      label: "Payroll History",
      value: "10 Payslips",
      fullValue: "10 Recorded Monthly Slips",
      description: "Jan 2026 – Oct 2026",
      accent: "#b8a0ff",
    },
    {
      id: "settlement",
      label: "Full & Final Settlement",
      value: "Active",
      fullValue: "EMP-1187 Active in Service",
      description: "Confirmed Permanent",
      accent: "#f4a6d7",
    },
  ];

  const selectPayrollKpi = (target) => {
    if (typeof target === "string") {
      setActivePayrollKpi((current) => current === target ? "All" : target);
      setActiveSubmenu("monthly");
    } else if (target && typeof target === "object") {
      if (target.id) setActiveSubmenu(target.id);
      if (target.label) setActivePayrollKpi(target.label);
    }
    setCurrentPage(1);
  };

  const selectProcessingKpi = (label) => {
    setActivePayrollKpi(label === "Employees" ? "All" : label);
    setActiveSubmenu("monthly");
    setCurrentPage(1);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* NAVIGATION TABS */}

      <div
        className="tabs sub w flex items-center gap-2 overflow-x-auto p-1.5 rounded-full bg-surface2/60 border border-line"
        style={{ gridColumn: "1 / -1" }}
      >
        {submenus.map(([id, label]) => {
          const isSelected = activeSubmenu === id;
          return (
            <button
              key={id}
              type="button"
              className={`tab px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? "bg-accent text-[#06141c] shadow-sm font-bold"
                  : "text-muted hover:text-white hover:bg-surface2"
              }`}
              aria-pressed={isSelected}
              onClick={() => {
                setActiveSubmenu(id);
                setActivePayrollKpi(label);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SIX KPI CARDS - ONE ROW */}

      <SingleRowGrid minCardWidth={120}>
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            active={activeSubmenu === metric.id}
            onClick={() => selectPayrollKpi(metric)}
          />
        ))}
      </SingleRowGrid>

      {/* ====================================================
          SALARY STRUCTURE MANAGEMENT
          CREATE BUTTON REMOVED FROM BOTH TABS
      ==================================================== */}

      {["overview", "components"].includes(activeSubmenu) && (
        <section
          style={{
            gridColumn: "1 / -1",
            width: "100%",
            minWidth: 0,
            borderRadius: 16,
            border: `1px solid ${COLORS.border}`,
            background:
              "radial-gradient(ellipse at top right, rgba(90,65,170,0.20), transparent 34%), #122630",
            padding: "22px 18px",
            color: COLORS.text,
          }}
        >
          <SectionHeading
            title="My Assigned Salary Structure"
            subtitle="Frontend Developer (Grade L3) • CTC ₹10,20,000 / annum • Confirmed Permanent"
          />

          <SalaryStructureGrid
            structures={structures}
            onPreview={setPayslipTarget}
          />

          <p className="text-xs text-muted mt-5">
            Salary rates are configurable demo examples.
            Actual statutory deductions require verification.
          </p>
        </section>
      )}

      {/* PAYROLL PROCESSING */}

      {["overview", "processing"].includes(activeSubmenu) && (
        <PayrollProcessingPanel
          runStage={runStage}
          payrollList={payrollList}
          onAdvance={handleAdvanceRun}
          onSelectKpi={selectProcessingKpi}
          activePayrollKpi={activePayrollKpi}
          focusSignoff={focusSignoff}
        />
      )}

      {/* EMPLOYEE SALARY MASTER */}

      {["overview", "monthly"].includes(activeSubmenu) && (
        <div
          id="emp-sal"
          style={{
            gridColumn: "1 / -1",
            minWidth: 0,
          }}
        >
          <Card
            id="emp-sal"
            title="Employee Salary Master & Leave Deductions"
            sub="Your confidential monthly payroll record"
          >
            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
              <div className="flex flex-wrap gap-2">
                <input
                  className="inp text-xs"
                  placeholder="Search employee, ID or role"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />

                <select
                  className="inp text-xs"
                  value={deptFilter}
                  onChange={(event) => {
                    setDeptFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">
                    All Departments
                  </option>

                  {getDepartmentOptions().map((department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SIX SUMMARY CARDS - ONE ROW */}

            <div style={{ marginBottom: 20 }}>
              <SingleRowGrid minCardWidth={145}>
                <SummaryCard
                  label="Gross Earnings"
                  value={compactMoney(totals.gross)}
                  fullValue={money(totals.gross)}
                  accent={COLORS.text}
                  isActive={activePayrollKpi === "Gross Earnings"}
                  onClick={() => selectPayrollKpi("Gross Earnings")}
                />

                <SummaryCard
                  label="Income Tax (TDS)"
                  value={compactMoney(totals.tds)}
                  fullValue={money(totals.tds)}
                  accent={COLORS.warn}
                  isActive={activePayrollKpi === "Income Tax (TDS)"}
                  onClick={() => selectPayrollKpi("Income Tax (TDS)")}
                />

                <SummaryCard
                  label="Employee EPF"
                  value={compactMoney(totals.epf)}
                  fullValue={money(totals.epf)}
                  accent={COLORS.warn}
                  isActive={activePayrollKpi === "Employee EPF"}
                  onClick={() => selectPayrollKpi("Employee EPF")}
                />

                <SummaryCard
                  label="Professional Tax"
                  value={compactMoney(totals.pt)}
                  fullValue={money(totals.pt)}
                  accent={COLORS.warn}
                  isActive={activePayrollKpi === "Professional Tax"}
                  onClick={() => selectPayrollKpi("Professional Tax")}
                />

                <SummaryCard
                  label="Leave Deductions"
                  value={compactMoney(totals.lop)}
                  fullValue={money(totals.lop)}
                  accent={COLORS.warn}
                  isActive={activePayrollKpi === "Leave Deductions"}
                  onClick={() => selectPayrollKpi("Leave Deductions")}
                />

                <SummaryCard
                  label="Net Salary"
                  value={compactMoney(totals.net)}
                  fullValue={money(totals.net)}
                  accent={COLORS.good}
                  isActive={activePayrollKpi === "Net Salary"}
                  onClick={() => selectPayrollKpi("Net Salary")}
                />
              </SingleRowGrid>
            </div>

            {/* EMPLOYEE TABLE */}

            <div
              style={{
                overflowX: "auto",
                width: "100%",
              }}
            >
              <Table
                cols={[
                  "Employee",
                  "Department",
                  "Gross Earnings",
                  "Bonus",
                  "Leaves Taken",
                  "Leave Deduction",
                  "TDS",
                  "Net Salary",
                  "Status",
                  "Payslip",
                ]}
                rows={paginated.map((employee) => [
                  <Who
                    key="employee"
                    n={employee.name}
                    s={employee.id}
                  />,
                  employee.department,
                  money(employee.totalEarnings),
                  money(employee.bonus),
                  `${employee.leavesTaken} Days`,
                  money(employee.leaveDeduction),
                  money(employee.tds),
                  <b key="net" className="text-good">
                    {money(employee.net)}
                  </b>,
                  <Pill
                    key="status"
                    k={
                      employee.status === "Disbursed"
                        ? "good"
                        : "warn"
                    }
                  >
                    {employee.status}
                  </Pill>,
                  <div
                    key="payslip"
                    className="flex w-full justify-center"
                  >
                    <button
                      type="button"
                      className="btn2 text-xs p-2 inline-flex items-center justify-center"
                      title={`Preview payslip for ${employee.name}`}
                      aria-label={`Preview payslip for ${employee.name}`}
                      onClick={() =>
                        setPayslipTarget(employee)
                      }
                    >
                      <Icon k="eye" />
                    </button>
                  </div>,
                ])}
              />
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </Card>
        </div>
      )}

      {/* PAYROLL HISTORY */}

      {activeSubmenu === "history" && (
        <div
          style={{
            gridColumn: "1 / -1",
            minWidth: 0,
          }}
        >
          <Card id="pay-hist" title="Payroll History" sub="Your 10 monthly salary payslips and disbursals">
            <div style={{ overflowX: "auto" }}>
              <Table
                cols={[
                  "Payroll Month",
                  "Pay Period",
                  "Payment Date",
                  "Gross Salary",
                  "Deductions",
                  "Net Salary",
                  "Status",
                  "Payslip",
                ]}
                rows={INITIAL_PAYROLL_HISTORY.map((slip) => [
                  slip.month,
                  slip.period,
                  slip.paidDate,
                  money(slip.gross),
                  money(slip.deductions),
                  <b key="net" className="text-good">
                    {money(slip.net)}
                  </b>,
                  <Pill key="status" k="good">
                    {slip.status}
                  </Pill>,
                  <div key="action" className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="btn2 text-xs px-2.5 py-1 inline-flex items-center gap-1 text-accent"
                      title={`Preview ${slip.month} payslip`}
                      onClick={() =>
                        setPayslipTarget({
                          ...payrollList[0],
                          month: slip.month,
                          period: slip.period,
                          paidDate: slip.paidDate,
                          gross: slip.gross,
                          net: slip.net,
                        })
                      }
                    >
                      <Icon k="eye" size={13} />
                      <span>View</span>
                    </button>
                  </div>,
                ])}
              />
            </div>

            <p className="text-xs text-muted mt-4">
              Monthly payslips for Lokesh Kumar (EMP-1187). Verified by Finance Desk.
            </p>
          </Card>
        </div>
      )}

      {/* ====================================================
          FULL & FINAL SETTLEMENT - UPDATED
      ==================================================== */}

      {activeSubmenu === "settlement" && (
        <div
          style={{
            gridColumn: "1 / -1",
            minWidth: 0,
          }}
        >
          <Card
            id="fnf-sec"
            title="Full & Final Settlement"
          >
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <input
                className="inp"
                placeholder="Search by Employee ID or name"
                value={settlementSearch}
                onChange={(event) =>
                  setSettlementSearch(event.target.value)
                }
              />

              {settlementSearch && (
                <button
                  type="button"
                  className="btn2 text-xs"
                  onClick={() => setSettlementSearch("")}
                >
                  Clear
                </button>
              )}

              {settlementEmployee && settlementQuery && (
                <button
                  type="button"
                  className="btn text-xs"
                  onClick={downloadSettlementStatement}
                >
                  Download Settlement Statement
                </button>
              )}
            </div>

            {!settlementMatchedEmployee ? (
              <p className="text-sm text-muted py-4">
                No employee matches that ID or name.
              </p>
            ) : settlementQuery && !settlementEmployee ? (
              <p className="text-sm text-muted py-4">
                No settlement record is available for this employee.
              </p>
            ) : (
              <>
                {/* EMPLOYEE + THREE SUMMARY CARDS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(320px, 1.8fr) repeat(3, minmax(170px, 1fr))",
                    gap: 15,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                >
                  <section
                    style={{
                      ...panelStyle,
                      background: "#2b404a",
                      minHeight: 205,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        marginBottom: 17,
                        color: COLORS.text,
                      }}
                    >
                      Employee Settlement
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: 16,
                      }}
                    >
                      {[
                        ["Employee", settlementName],
                        [
                          "Employee ID",
                          settlementEmployee?.id || "EMP-0016",
                        ],
                        ["Department", settlementDepartment],
                        ["Designation", settlementDesignation],
                        ["Date of Joining", settlementJoiningDate],
                        ["Last Working Day", "15 Nov 2026"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{ minWidth: 0 }}
                        >
                          <span
                            style={{
                              display: "block",
                              color: COLORS.muted,
                              fontSize: 11,
                              marginBottom: 5,
                            }}
                          >
                            {label}
                          </span>

                          <strong
                            style={{
                              color: COLORS.text,
                              fontSize: 12,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  {[
                    {
                      label: "Total Earnings",
                      value: "₹1,79,000",
                      accent: COLORS.good,
                    },
                    {
                      label: "Total Deductions",
                      value: "₹0",
                      accent: COLORS.warn,
                    },
                    {
                      label: "Net Final Settlement",
                      value: "₹1,79,000",
                      accent: COLORS.accent,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        ...panelStyle,
                        background: "#2b404a",
                        minHeight: 205,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          color: COLORS.muted,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {item.label}
                      </span>

                      <strong
                        style={{
                          color: item.accent,
                          fontSize: 23,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.value}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* SETTLEMENT COMPONENTS */}

                <div
                  style={{
                    ...panelStyle,
                    background: "#2b404a",
                    marginTop: 16,
                    marginBottom: 18,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      marginBottom: 20,
                      color: COLORS.text,
                    }}
                  >
                    Settlement Components
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {[
                      ["Gratuity", "₹1,45,000"],
                      [
                        "Unused Eligible Leave Encashment",
                        "₹34,000",
                      ],
                      ["Notice Period Recovery", "₹0"],
                      [
                        "Pending Salary / Other Deductions",
                        "₹0",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{ minWidth: 0 }}
                      >
                        <span
                          style={{
                            display: "block",
                            color: COLORS.muted,
                            fontSize: 12,
                            marginBottom: 8,
                          }}
                        >
                          {label}
                        </span>

                        <strong
                          style={{
                            color: COLORS.text,
                            fontSize: 14,
                          }}
                        >
                          {value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SETTLEMENT TABLE */}

                <div style={{ overflowX: "auto" }}>
                  <Table
                    cols={[
                      "Employee",
                      "Last Working Day",
                      "Gratuity",
                      "Notice Pay",
                      "Leave Encashment",
                      "Final Amount",
                      "Status",
                      "Settlement Date",
                    ]}
                    rows={[
                      [
                        <Who
                          key="employee"
                          n={settlementName}
                          s={
                            settlementEmployee?.id ||
                            "EMP-0016"
                          }
                        />,
                        "15 Nov 2026",
                        "₹1,45,000",
                        "₹0",
                        "₹34,000",
                        "₹1,79,000",
                        <Pill key="status" k="warn">
                          Pending Approval
                        </Pill>,
                        "Not Scheduled",
                      ],
                    ]}
                  />
                </div>

                <p className="text-xs text-muted mt-4">
                  Settlement amounts are illustrative examples.
                </p>
              </>
            )}
          </Card>
        </div>
      )}

      {/* CREATE STRUCTURE MODAL */}

      {createOpen && (
        <Dialog
          title="Create Salary Structure"
          onClose={() => setCreateOpen(false)}
        >
          <form
            onSubmit={handleCreateStructure}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              ["id", "Grade (Example: L5)", "text"],
              ["designation", "Designation", "text"],
              ["ctc", "Annual CTC (₹)", "number"],
              ["basicRate", "Basic (% of Gross)", "number"],
              ["hraRate", "HRA (% of Basic)", "number"],
              ["csaRate", "CSA (% of Gross)", "number"],
              ["bonus", "Monthly Bonus (₹)", "number"],
              ["epfRate", "EPF (% of Basic)", "number"],
              ["pt", "Professional Tax (₹)", "number"],
              ["tds", "Monthly TDS (₹)", "number"],
            ].map(([key, label, type]) => (
              <label
                key={key}
                className="field text-xs"
              >
                {label}

                <input
                  type={type}
                  className="inp"
                  min={type === "number" ? 0 : undefined}
                  step={
                    type === "number" ? "any" : undefined
                  }
                  value={newStructure[key]}
                  onChange={(event) =>
                    setNewStructure({
                      ...newStructure,
                      [key]: event.target.value,
                    })
                  }
                  required
                />
              </label>
            ))}

            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                className="btn2"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn"
              >
                Save Structure
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* PAYSLIP MODAL */}

      {payslipTarget && (
        <PayslipPreview
          employee={payslipTarget}
          onClose={() => setPayslipTarget(null)}
          show={show}
        />
      )}
    </>
  );
}

export { PayrollPage };

