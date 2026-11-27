import React, { useEffect, useMemo, useState } from "react";
import { ModalPortal } from "../../components/common/ModalPortal.jsx";
import { Card, Icon, Kpis, Pill, Table, Who } from "../components/ui.jsx";
import { EMPLOYEES, resolveEmployeeIdentity } from "../data.js";
import { isDemoMode } from "../api.js";

// ============================================================
// EMPLOYEE MASTER
// ============================================================

const employees = EMPLOYEES
  .filter((employee) => employee.status === "Active")
  .map(resolveEmployeeIdentity);

const employeeMaster = EMPLOYEES
  .map(resolveEmployeeIdentity)
  .filter((employee) => employee.status !== "Inactive");

const findEmployee = (id) =>
  employeeMaster.find((employee) => employee.id === id);

// ============================================================
// DEMO PAYMENT DATA
// ============================================================

export const demoRows = [
  {
    id: "DEP-2601",
    employee: employees[1],
    bank: "HDFC Bank",
    account: "•••• 1289",
    amount: 94500,
    date: "2026-11-12",
    ref: "DEMO-NEFT-2601",
    status: "Successful",
  },
  {
    id: "DEP-2602",
    employee: employees[2],
    bank: "ICICI Bank",
    account: "•••• 6543",
    amount: 83840,
    date: "2026-11-12",
    ref: "DEMO-NEFT-2602",
    status: "Pending",
  },
  {
    id: "DEP-2603",
    employee: employees[3],
    bank: "State Bank of India",
    account: "•••• 9032",
    amount: 96933.55,
    date: "2026-11-12",
    ref: "DEMO-NEFT-2603",
    status: "Failed",
  },
];

// ============================================================
// EXAMPLE BANK ACCOUNTS
// Illustrative only, not real connected accounts
// ============================================================

const bankExampleAccounts = [
  {
    id: "DEMO-BANK-01",
    bank_name: "HDFC Bank Ltd.",
    account_holder_name: "Example Payroll Operations",
    account_last4: "1289",
    ifsc_code: "HDFC0001234",
    branch_name: "Example Branch",
    account_type: "Current",
    account_purpose: "Primary Payroll A/C",
    connection_status: "Demo Only",
    illustrative: true,
  },
  {
    id: "DEMO-BANK-02",
    bank_name: "ICICI Bank",
    account_holder_name: "Example HRMS Finance",
    account_last4: "6543",
    ifsc_code: "ICIC0000108",
    branch_name: "Example Branch",
    account_type: "Current",
    account_purpose: "Reimbursements & Bonus A/C",
    connection_status: "Demo Only",
    illustrative: true,
  },
  {
    id: "DEMO-BANK-03",
    bank_name: "State Bank of India (SBI)",
    account_holder_name: "Example Statutory Payments",
    account_last4: "9032",
    ifsc_code: "SBIN0004521",
    branch_name: "Example Branch",
    account_type: "Current",
    account_purpose: "EPF & Tax Clearing A/C",
    connection_status: "Demo Only",
    illustrative: true,
  },
];

// ============================================================
// LOAN DATA
// ============================================================

const previewLoans = [
  {
    id: "LN-2601",
    employee: findEmployee("EMP-0009"),
    type: "Personal Loan",
    requested: 100000,
    approved: 90000,
    rate: 10,
    tenure: 12,
    paid: 15800,
    status: "Active",
    applied: "2026-10-03",
    approvedOn: "2026-10-07",
    start: "2026-11-01",
    next: "2026-12-01",
    history: [
      {
        date: "2026-11-01",
        amount: 7900,
        ref: "PREVIEW-2601-01",
      },
      {
        date: "2026-11-15",
        amount: 7900,
        ref: "PREVIEW-2601-02",
      },
    ],
  },
  {
    id: "LN-2602",
    employee: findEmployee("EMP-0010"),
    type: "Salary Advance",
    requested: 30000,
    approved: 30000,
    rate: 0,
    tenure: 6,
    paid: 10000,
    status: "Active",
    applied: "2026-09-18",
    approvedOn: "2026-09-19",
    start: "2026-10-01",
    next: "2026-12-01",
    history: [
      {
        date: "2026-11-01",
        amount: 5000,
        ref: "PREVIEW-2602-01",
      },
      {
        date: "2026-11-15",
        amount: 5000,
        ref: "PREVIEW-2602-02",
      },
    ],
  },
  {
    id: "LN-2603",
    employee: findEmployee("EMP-0011"),
    type: "Medical Loan",
    requested: 150000,
    approved: 120000,
    rate: 8,
    tenure: 24,
    paid: 0,
    status: "Pending",
    applied: "2026-11-04",
    approvedOn: "—",
    start: "—",
    next: "—",
    history: [],
  },
  {
    id: "LN-2604",
    employee: findEmployee("EMP-0012"),
    type: "Education Loan",
    requested: 200000,
    approved: 180000,
    rate: 7,
    tenure: 36,
    paid: 15000,
    status: "Approved",
    applied: "2026-10-11",
    approvedOn: "2026-10-16",
    start: "2026-11-01",
    next: "2026-12-01",
    history: [
      {
        date: "2026-11-01",
        amount: 15000,
        ref: "PREVIEW-2604-01",
      },
    ],
  },
  {
    id: "LN-2605",
    employee: findEmployee("EMP-0013"),
    type: "Emergency Loan",
    requested: 50000,
    approved: 50000,
    rate: 0,
    tenure: 5,
    paid: 10000,
    status: "Active",
    applied: "2026-09-20",
    approvedOn: "2026-09-21",
    start: "2026-10-01",
    next: "2026-12-01",
    history: [
      {
        date: "2026-11-01",
        amount: 10000,
        ref: "PREVIEW-2605-01",
      },
    ],
  },
  {
    id: "LN-2606",
    employee: findEmployee("EMP-0005"),
    type: "Personal Loan",
    requested: 75000,
    approved: 0,
    rate: 10,
    tenure: 12,
    paid: 0,
    status: "Rejected",
    applied: "2026-10-20",
    approvedOn: "2026-10-23",
    start: "—",
    next: "—",
    history: [],
  },
  {
    id: "LN-2607",
    employee: findEmployee("EMP-0002"),
    type: "Medical Loan",
    requested: 90000,
    approved: 90000,
    rate: 6,
    tenure: 18,
    paid: 90000,
    status: "Completed",
    applied: "2025-04-12",
    approvedOn: "2025-04-14",
    start: "2025-05-01",
    next: "—",
    history: [
      {
        date: "2026-10-01",
        amount: 5000,
        ref: "PREVIEW-2607-18",
      },
    ],
  },
  {
    id: "LN-2608",
    employee: findEmployee("EMP-0014"),
    type: "Education Loan",
    requested: 125000,
    approved: 0,
    rate: 7,
    tenure: 24,
    paid: 0,
    status: "Pending",
    applied: "2026-11-08",
    approvedOn: "—",
    start: "—",
    next: "—",
    history: [],
  },
].filter((loan) => loan.employee);

export const automationLoanExamples = [
  { id: "LOAN-1001", employee: findEmployee("EMP-0009"), type: "Personal", requested: 120000, approved: 120000, rate: 0, tenure: 24, paid: 30000, status: "Active", applied: "2026-06-01", approvedOn: "2026-06-03", start: "2026-06-15", next: "2026-12-01", history: [] },
  { id: "LOAN-1002", employee: findEmployee("EMP-0011"), type: "Housing Advance", requested: 800000, approved: 700000, rate: 0, tenure: 60, paid: 70000, status: "Active", applied: "2026-05-01", approvedOn: "2026-05-04", start: "2026-06-01", next: "2026-12-01", history: [] },
  { id: "LOAN-1003", employee: findEmployee("EMP-0012"), type: "Education", requested: 250000, approved: 220000, rate: 0, tenure: 36, paid: 22000, status: "Active", applied: "2026-04-10", approvedOn: "2026-04-12", start: "2026-05-01", next: "2026-12-01", history: [] },
  { id: "LOAN-1004", employee: findEmployee("EMP-0010"), type: "Vehicle", requested: 450000, approved: 400000, rate: 0, tenure: 48, paid: 50000, status: "Active", applied: "2026-03-11", approvedOn: "2026-03-14", start: "2026-04-01", next: "2026-12-01", history: [] },
  { id: "LOAN-1005", employee: findEmployee("EMP-0005"), type: "Emergency Medical", requested: 90000, approved: 0, rate: 0, tenure: 18, paid: 0, status: "Pending", applied: "2026-11-10", approvedOn: "—", start: "—", next: "—", history: [] },
  { id: "LOAN-1006", employee: findEmployee("EMP-0002"), type: "Housing Advance", requested: 600000, approved: 0, rate: 0, tenure: 72, paid: 0, status: "Pending", applied: "2026-11-08", approvedOn: "—", start: "—", next: "—", history: [] },
  { id: "LOAN-1007", employee: findEmployee("EMP-0014"), type: "Equipment", requested: 65000, approved: 0, rate: 0, tenure: 12, paid: 0, status: "Pending", applied: "2026-11-06", approvedOn: "—", start: "—", next: "—", history: [] },
  { id: "LOAN-1008", employee: findEmployee("EMP-0013"), type: "Education", requested: 180000, approved: 180000, rate: 0, tenure: 24, paid: 0, status: "Approved", applied: "2026-10-20", approvedOn: "2026-10-25", start: "2026-12-01", next: "2027-01-01", history: [] },
  { id: "LOAN-1009", employee: findEmployee("EMP-0004"), type: "Vehicle", requested: 350000, approved: 350000, rate: 0, tenure: 36, paid: 0, status: "Approved", applied: "2026-10-17", approvedOn: "2026-10-22", start: "2026-12-01", next: "2027-01-01", history: [] },
  { id: "LOAN-1010", employee: findEmployee("EMP-0007"), type: "Personal", requested: 75000, approved: 0, rate: 0, tenure: 12, paid: 0, status: "Rejected", applied: "2026-10-15", approvedOn: "2026-10-19", start: "—", next: "—", history: [] },
].filter((loan) => loan.employee);

// ============================================================
// HELPERS
// ============================================================

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const statusKind = (status) =>
  ["Successful", "Success", "Completed"].includes(status)
    ? "good"
    : ["Failed", "Rejected"].includes(status)
    ? "bad"
    : "warn";

const loanStatusTone = {
  Pending: "warn",
  Approved: "good",
  Active: "info",
  Rejected: "bad",
  Completed: "good",
  Closed: "good",
};

const calculateEMI = (principal, annualRate, months) => {
  if (!principal || !months) return 0;

  const monthlyRate = annualRate / 1200;

  if (monthlyRate === 0) {
    return principal / months;
  }

  return (
    (principal *
      monthlyRate *
      (1 + monthlyRate) ** months) /
    ((1 + monthlyRate) ** months - 1)
  );
};

const calculateBalance = (
  principal,
  annualRate,
  months,
  totalPaid
) => {
  if (!principal || !months) return 0;

  const installment = calculateEMI(
    principal,
    annualRate,
    months
  );

  let remaining = principal;
  let applied = 0;

  while (
    remaining > 0.005 &&
    applied + 0.005 < totalPaid
  ) {
    const payment = Math.min(
      installment,
      totalPaid - applied
    );

    remaining = Math.max(
      0,
      remaining +
        (remaining * annualRate) / 1200 -
        payment
    );

    applied += payment;
  }

  return Math.round(remaining * 100) / 100;
};

const calculateRemainingInstallments = (
  principal,
  annualRate,
  months,
  totalPaid
) => {
  if (!principal || !months) return 0;

  const installment = calculateEMI(
    principal,
    annualRate,
    months
  );

  let remaining = principal;
  let paid = 0;
  let completed = 0;

  for (
    let month = 0;
    month < months && remaining > 0.005;
    month += 1
  ) {
    const due = Math.min(
      installment,
      remaining +
        (remaining * annualRate) / 1200
    );

    if (paid + due > totalPaid + 0.005) break;

    remaining = Math.max(
      0,
      remaining +
        (remaining * annualRate) / 1200 -
        due
    );

    paid += due;
    completed += 1;
  }

  return Math.max(0, months - completed);
};

// ============================================================
// STYLES
// ============================================================

const automationStyles = `
.automation-payroll-page .loan-enhanced-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(160px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 18px;
}

.automation-payroll-page .loan-filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.automation-payroll-page .loan-filter-field label {
  font-size: 12px;
  font-weight: 600;
  color: #a9c2c9;
}

.automation-payroll-page .loan-filter-field .inp {
  width: 100%;
  min-height: 42px;
  border: 1px solid #3c5962;
  border-radius: 9px;
  background: #20343e;
  color: #ffffff;
  padding: 9px 12px;
  outline: none;
}

.automation-payroll-page .loan-filter-field .inp option {
  background: #20343e;
  color: #ffffff;
}

.automation-payroll-page .loan-clear-button {
  min-height: 42px;
  padding: 9px 16px;
  border: 1px solid #67e3ce;
  border-radius: 9px;
  background: #67e3ce;
  color: #08232b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.automation-payroll-page .loan-filter-summary {
  margin-bottom: 12px;
  font-size: 12px;
  color: #a9c2c9;
}

.automation-payroll-page .loan-enhanced-table {
  width: 100%;
  overflow-x: auto;
}

.automation-payroll-page .loan-enhanced-table table {
  min-width: 1500px;
}

.automation-payroll-page .loan-enhanced-action {
  display: flex;
  align-items: center;
  gap: 6px;
}

.automation-modal-box {
  position: relative !important;
  box-sizing: border-box !important;
  width: min(900px, 100%) !important;
  max-width: 900px !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
  margin: auto !important;
  transform: none !important;
  left: auto !important;
  right: auto !important;
  top: auto !important;
  bottom: auto !important;
}

.automation-modal-box.small {
  max-width: 520px !important;
}

.automation-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.automation-modal-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid #55727a;
  border-radius: 9px;
  background: transparent;
  color: inherit;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.automation-modal-x:hover {
  background: rgba(255, 255, 255, 0.1);
}

.automation-modal-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 18px 0;
}

.automation-modal-detail-grid > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* BANK EXAMPLE CARDS */

.automation-bank-example-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.automation-bank-example-card {
  border: 1px solid #3c5962;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(32, 52, 62, 0.55);
  min-width: 0;
}

.automation-bank-example-heading {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.automation-bank-example-note {
  font-size: 11px;
  color: #a9c2c9;
}

@media (max-width: 1200px) {
  .automation-payroll-page .loan-enhanced-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .automation-payroll-page .loan-enhanced-filters,
  .automation-bank-example-grid {
    grid-template-columns: 1fr;
  }

  .automation-modal-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;

// ============================================================
// CENTER MODAL WITH X BUTTON
// ============================================================

function CenterModal({
  title,
  onClose,
  children,
  small = false,
  alert = false,
}) {
  return (
    <ModalPortal onClose={onClose} ariaLabel={title} closeOnBackdrop role={alert ? "alertdialog" : "dialog"}>
      <div
        className={`card automation-modal-box !border-[#34515b] !bg-[#142c37] !text-white ${
          small ? "small" : ""
        }`}
        style={{ padding: 20 }}
      >
        <div className="automation-modal-head">
          <h3>{title}</h3>

          <button
            type="button"
            className="automation-modal-x"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </ModalPortal>
  );
}

// ============================================================
// AUTOMATION PAYROLL LOANS
// ============================================================

function AutomationPayrollLoans({
  show,
  logAction,
  readOnly = false,
  automationExamples = true,
  sharedLoans,
  setSharedLoans,
  activeLoanFilter = 'All', setActiveLoanFilter,
  loanSearchQuery = '', setLoanSearchQuery,
  loanDeptFilter = 'All', setLoanDeptFilter,
  loanTypeFilter = 'All', setLoanTypeFilter,
  loanStatusFilter = 'All', setLoanStatusFilter,
}) {
  const [localActiveLoanFilter, setLocalActiveLoanFilter] = useState('All');
  const currentLoanFilter = setActiveLoanFilter
    ? activeLoanFilter
    : localActiveLoanFilter;
  const updateLoanFilter = setActiveLoanFilter || setLocalActiveLoanFilter;
  const [localLoanStatusFilter, setLocalLoanStatusFilter] = useState('All');
  const currentStatusFilter = setLoanStatusFilter
    ? loanStatusFilter
    : localLoanStatusFilter;
  const updateStatusFilter = setLoanStatusFilter || setLocalLoanStatusFilter;

  const loans = Array.isArray(sharedLoans) && sharedLoans.length
    ? sharedLoans
    : automationLoanExamples
  const setLoans = setSharedLoans || (() => {})

  const query = loanSearchQuery; const setQuery = setLoanSearchQuery || (() => {});
  const departmentFilter = loanDeptFilter; const setDepartmentFilter = setLoanDeptFilter || (() => {});
  const typeFilter = loanTypeFilter; const setTypeFilter = setLoanTypeFilter || (() => {});
  const statusFilter = currentStatusFilter;

  const [selected, setSelected] = useState(null);
  const [confirmation, setConfirmation] =
    useState(null);
  const [showRepayments, setShowRepayments] =
    useState(false);
  const [previewMode, setPreviewMode] =
    useState(false);
  const [decisionBusy, setDecisionBusy] =
    useState(false);
  const [decisionComment, setDecisionComment] =
    useState("");
  const [decisionError, setDecisionError] =
    useState("");

  useEffect(() => {
    setDecisionComment("");
    setDecisionError("");
  }, [confirmation?.loan?.id, confirmation?.nextStatus]);

  const departments = useMemo(
    () =>
      [
        ...new Set(
          employeeMaster
            .map((employee) => employee.department)
            .filter(Boolean)
        ),
      ].sort(),
    []
  );

  const types = useMemo(
    () =>
      [
        ...new Set([
          "Personal Loan",
          "Salary Advance",
          "Emergency Loan",
          "Medical Loan",
          "Education Loan",
          "Festival Advance",
          "Home Relocation Loan",
          "Medical Emergency Advance",
          "Salary Advance (Festive)",
          "Other",
          ...loans.map((loan) => loan.type),
        ]),
      ]
        .filter(Boolean)
        .sort(),
    [loans]
  );

  const statuses = useMemo(
    () =>
      [
        ...new Set([
          "Active",
          "Pending",
          "Approved",
          "Rejected",
          "Completed",
          "Closed",
          ...loans.map((loan) => loan.status),
        ]),
      ].filter(Boolean),
    [loans]
  );

  const visibleLoans = useMemo(() => {
    const kpiFilter = String(currentLoanFilter || "All").trim();
    const kpiStatuses = {
      "Active Loans": "Active",
      "Pending Loan Requests": "Pending",
      "Approved Loans": "Approved",
      "Rejected Loans": "Rejected",
    };
    const requiredStatus = kpiStatuses[kpiFilter];
    const showAllKpiStatuses = [
      "All",
      "Total Loans",
      "Total Outstanding Amount",
    ].includes(kpiFilter);
    return loans.filter((loan) => {
      const text = [
        loan.employee?.name,
        loan.employee?.id,
        loan.id,
        loan.employee?.department,
        loan.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // A selected status KPI is authoritative; stale dropdown state must not
      // hide records that belong to that KPI. The dropdown remains active for
      // the unfiltered/total KPI views.
      const matchesStatus = requiredStatus
        ? loan.status === requiredStatus
        : showAllKpiStatuses &&
          (statusFilter === "All" || loan.status === statusFilter);
      const matchesOutstanding = kpiFilter !== "Total Outstanding Amount" ||
        (["Active", "Approved"].includes(loan.status) &&
          calculateBalance(loan.approved, loan.rate, loan.tenure, loan.paid) > 0);

      return (
        matchesStatus &&
        matchesOutstanding &&
        text.includes(query.trim().toLowerCase()) &&
        (departmentFilter === "All" ||
          loan.employee?.department ===
            departmentFilter) &&
        (typeFilter === "All" ||
          loan.type === typeFilter)
      );
    });
  }, [
    loans,
    currentLoanFilter,
    query,
    departmentFilter,
    typeFilter,
    statusFilter,
  ]);

  const counts = {
    total: loans.length,
    active: loans.filter(
      (loan) => loan.status === "Active"
    ).length,
    pending: loans.filter(
      (loan) => loan.status === "Pending"
    ).length,
    approved: loans.filter(
      (loan) => loan.status === "Approved"
    ).length,
    rejected: loans.filter(
      (loan) => loan.status === "Rejected"
    ).length,
    outstanding: loans
      .filter((loan) =>
        ["Active", "Approved"].includes(loan.status)
      )
      .reduce(
        (sum, loan) =>
          sum +
          calculateBalance(
            loan.approved,
            loan.rate,
            loan.tenure,
            loan.paid
          ),
        0
      ),
  };

  const confirmDecision = async () => {
    if (readOnly || !confirmation || decisionBusy) return;

    const comment = decisionComment.trim();
    if (!comment) {
      setDecisionError("A comment is required to continue.");
      return;
    }

    const { loan, nextStatus } = confirmation;
    const decisionDate = getLocalDate();

    setDecisionBusy(true);

    try {
      const updates = {
        status: nextStatus,
        approvedOn: decisionDate,
        ...(nextStatus === "Approved"
          ? {
              approved:
                loan.approved || loan.requested,
              rate: loan.rate ?? 0,
              tenure: loan.tenure || 12,
              start: decisionDate,
            }
          : {}),
      };

      setLoans((previous) =>
        previous.map((item) =>
          item.id === loan.id
            ? { ...item, ...updates }
            : item
        )
      );

      setSelected((current) =>
        current?.id === loan.id
          ? { ...current, ...updates }
          : current
      );

      logAction?.(
        `${nextStatus} employee loan ${loan.id}: ${comment}`,
        "Loans"
      );

      show?.(`${loan.id} marked ${nextStatus}.`);
      setConfirmation(null);
    } catch (error) {
      show?.(error.message);
    } finally {
      setDecisionBusy(false);
    }
  };

  const details = selected
    ? [
        [
          "Employee Name",
          selected.employee?.name || "—",
        ],
        [
          "Employee ID",
          selected.employee?.id || "—",
        ],
        [
          "Department",
          selected.employee?.department || "—",
        ],
        [
          "Designation",
          selected.employee?.designation || "—",
        ],
        [
          "Reporting Manager",
          selected.employee?.reportingManager || "—",
        ],
        ["Loan ID", selected.id],
        ["Loan Type", selected.type],
        [
          "Requested Amount",
          money(selected.requested),
        ],
        [
          "Approved Amount",
          selected.approved
            ? money(selected.approved)
            : "—",
        ],
        [
          "Interest Rate",
          `${selected.rate}% p.a.`,
        ],
        [
          "Loan Tenure",
          `${selected.tenure} months`,
        ],
        [
          "Monthly EMI",
          selected.approved
            ? money(
                selected.emiOverride ||
                  calculateEMI(
                    selected.approved,
                    selected.rate,
                    selected.tenure
                  )
              )
            : "Not applicable",
        ],
        ["Application Date", selected.applied],
        ["Approval Date", selected.approvedOn],
        ["Loan Start Date", selected.start],
        [
          "Outstanding Balance",
          money(
            calculateBalance(
              selected.approved,
              selected.rate,
              selected.tenure,
              selected.paid
            )
          ),
        ],
        ["Next EMI Date", selected.next],
        ["Loan Status", selected.status],
        [
          "Total Amount Repaid",
          money(selected.paid),
        ],
        [
          "Remaining Installments",
          selected.approved
            ? calculateRemainingInstallments(
                selected.approved,
                selected.rate,
                selected.tenure,
                selected.paid
              )
            : "—",
        ],
        ["Next Payment Date", selected.next],
      ]
    : [];

  const rows = visibleLoans.map((loan) => [
    <span className="font-mono text-accent">
      {loan.id}
    </span>,

    loan.employee?.id || "—",

    <Who n={loan.employee?.name || "—"} />,

    loan.employee?.department || "—",

    loan.employee?.designation || "—",

    loan.type,

    money(loan.requested),

    loan.approved
      ? money(loan.approved)
      : "—",

    `${loan.rate}%`,

    loan.progressLabel || `${loan.tenure} mo`,

    loan.approved
      ? money(
          loan.emiOverride ||
            calculateEMI(
              loan.approved,
              loan.rate,
              loan.tenure
            )
        )
      : "—",

    money(
      calculateBalance(
        loan.approved,
        loan.rate,
        loan.tenure,
        loan.paid
      )
    ),

    <Pill
      k={
        automationExamples &&
        loan.status === "Active"
          ? "good"
          : loanStatusTone[loan.status] || "warn"
      }
    >
      {loan.status}
    </Pill>,

    <div className="loan-enhanced-action">
      <button
        type="button"
        className="btn2"
        aria-label="View Details"
        title="View Details"
        onClick={() => {
          setSelected(loan);
          setShowRepayments(false);
        }}
      >
        <Icon k="eye" />
      </button>

      {!readOnly && !automationExamples &&
        loan.status === "Pending" && (
          <>
            <button
              type="button"
              className="btn2 text-xs"
              onClick={() =>
                setConfirmation({
                  loan,
                  nextStatus: "Approved",
                })
              }
            >
              Approve
            </button>

            <button
              type="button"
              className="btn2 text-xs text-bad"
              onClick={() =>
                setConfirmation({
                  loan,
                  nextStatus: "Rejected",
                })
              }
            >
              Reject
            </button>
          </>
        )}
    </div>,
  ]);

  return (
    <div className="loan-page flex flex-col gap-4 w-full min-w-0">
      <Kpis
        onItemClick={(item) => {
          const clickedTitle = typeof item === 'string'
            ? item
            : Array.isArray(item)
              ? item[0]
              : item?.title;
          const statusByKpi = {
            "Active Loans": "Active",
            "Pending Loan Requests": "Pending",
            "Approved Loans": "Approved",
            "Rejected Loans": "Rejected",
          };
          const isAllRecordsKpi = [
            "Total Loans",
            "Total Outstanding Amount",
          ].includes(clickedTitle);
          const nextFilter =
            isAllRecordsKpi || currentLoanFilter === clickedTitle
              ? "All"
              : Object.prototype.hasOwnProperty.call(statusByKpi, clickedTitle)
                ? clickedTitle
                : "All";

          updateLoanFilter(nextFilter);
          updateStatusFilter(nextFilter === "All" ? "All" : statusByKpi[nextFilter]);
        }}
        items={[
          [
            "Total Loans",
            counts.total,
            "Applications",
            currentLoanFilter === 'Total Loans',
          ],
          [
            "Active Loans",
            counts.active,
            "In repayment",
            currentLoanFilter === 'Active Loans',
          ],
          [
            "Pending Loan Requests",
            counts.pending,
            "Awaiting decision",
            currentLoanFilter === 'Pending Loan Requests',
          ],
          [
            "Approved Loans",
            counts.approved,
            "Approved, not yet active",
            currentLoanFilter === 'Approved Loans',
          ],
          [
            "Rejected Loans",
            counts.rejected,
            "Not approved",
            currentLoanFilter === 'Rejected Loans',
          ],
          [
            "Total Outstanding Amount",
            money(counts.outstanding),
            "Reducing-balance estimate",
            currentLoanFilter === 'Total Outstanding Amount',
          ],
        ]}
      />

      <Card
        title="Employee Loan Details"
        sub={`${visibleLoans.length} ${
          previewMode ? "preview" : "live"
        } records`}
      >
        <div className="loan-enhanced-filters">
          <div className="loan-filter-field">
            <label htmlFor="loan-employee-search">
              Search Employee
            </label>

            <input
              id="loan-employee-search"
              className="inp"
              type="search"
              placeholder="Search employee name or ID"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />
          </div>

          <div className="loan-filter-field">
            <label htmlFor="loan-department-filter">
              Department
            </label>

            <select
              id="loan-department-filter"
              className="inp"
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(event.target.value)
              }
            >
              <option value="All">
                All Departments
              </option>

              {departments.map((department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="loan-filter-field">
            <label htmlFor="loan-type-filter">
              Loan Type
            </label>

            <select
              id="loan-type-filter"
              className="inp"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
            >
              <option value="All">
                All Loan Types
              </option>

              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="loan-filter-field">
            <label htmlFor="loan-status-filter">
              Loan Status
            </label>

            <select
              id="loan-status-filter"
              className="inp"
              value={statusFilter}
              onChange={(event) => updateStatusFilter(event.target.value)}
            >
              <option value="All">
                All Statuses
              </option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="loan-clear-button"
            onClick={() => {
              setQuery("");
              setDepartmentFilter("All");
              setTypeFilter("All");
              updateStatusFilter("All");
              updateLoanFilter("All");
            }}
          >
            Clear Filters
          </button>
        </div>

        <div className="loan-filter-summary">
          Showing {visibleLoans.length} of{" "}
          {loans.length} loan records
        </div>

        <div className="loan-enhanced-table">
          <Table
            cols={[
              "Loan ID",
              "Employee ID",
              "Employee Name",
              "Department",
              "Designation",
              "Loan Type",
              "Requested Amount",
              "Approved Amount",
              "Interest Rate",
              "Loan Tenure",
              "Monthly EMI",
              "Outstanding Balance",
              "Status",
              "Action",
            ]}
            rows={rows}
          />
        </div>
      </Card>

      {/* CENTERED LOAN DETAILS POPUP */}

      {selected && (
        <CenterModal
          title={`Loan Details · ${selected.id}`}
          onClose={() => setSelected(null)}
        >
          <div className="automation-modal-detail-grid">
            {details.map(([label, value]) => (
              <div key={label}>
                <span className="sec block">
                  {label}
                </span>

                <b>{value}</b>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn2"
              aria-pressed={showRepayments}
              onClick={() =>
                setShowRepayments(
                  (value) => !value
                )
              }
            >
              View Repayment Details
            </button>

            {!readOnly && !automationExamples &&
              selected.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      setConfirmation({
                        loan: selected,
                        nextStatus: "Approved",
                      })
                    }
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="btn2 text-bad"
                    onClick={() =>
                      setConfirmation({
                        loan: selected,
                        nextStatus: "Rejected",
                      })
                    }
                  >
                    Reject
                  </button>
                </>
              )}
          </div>

          {showRepayments && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">
                Repayment History ·{" "}
                {money(selected.paid)} repaid
              </h4>

              <Table
                cols={[
                  "Payment Date",
                  "Amount",
                  "Reference",
                  "Status",
                ]}
                rows={
                  selected.history?.length
                    ? selected.history.map(
                        (entry) => [
                          entry.date,
                          money(entry.amount),
                          entry.ref,
                          <Pill k="good">
                            Paid
                          </Pill>,
                        ]
                      )
                    : [
                        [
                          "—",
                          "—",
                          "No repayments recorded",
                          "—",
                        ],
                      ]
                }
              />
            </div>
          )}
        </CenterModal>
      )}

      {/* LOAN APPROVAL CONFIRMATION */}

      {!readOnly && confirmation && (
        <CenterModal
          small
          alert
          title={`Confirm ${confirmation.nextStatus.toLowerCase()}`}
          onClose={() => {
            if (!decisionBusy) {
              setConfirmation(null);
            }
          }}
        >
          <p className="text-sm text-muted my-3">
            Change loan {confirmation.loan.id} from
            Pending to {confirmation.nextStatus}?
          </p>

          <label className="mb-3 block text-xs font-semibold text-slate-300">
            Comment <span className="text-rose-300">*</span>
            <textarea
              rows={2}
              maxLength={300}
              value={decisionComment}
              onChange={(event) => {
                setDecisionComment(event.target.value);
                setDecisionError("");
              }}
              aria-required="true"
              aria-invalid={Boolean(decisionError)}
              className="mt-1.5 w-full resize-none rounded-xl border border-[#34515b] bg-[#10242e] p-3 text-sm text-white placeholder:text-slate-500"
              placeholder={`Add a comment for this ${confirmation.nextStatus.toLowerCase()} decision.`}
            />
          </label>
          {decisionError && <p role="alert" className="mb-3 text-xs text-rose-300">{decisionError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn2"
              disabled={decisionBusy}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn"
              disabled={decisionBusy || !decisionComment.trim()}
              onClick={confirmDecision}
            >
              {decisionBusy
                ? "Processing..."
                : "Confirm"}
            </button>
          </div>
        </CenterModal>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAYMENTS PAGE
// ============================================================

const emptyBank = {
  bank_name: "",
  account_holder_name: "",
  account_last4: "",
  ifsc_code: "",
  branch_name: "",
  account_type: "Current",
};

export default function PaymentsPage({
  show,
  logAction,
  readOnly = false,
  automationPayroll = false,
  sharedPayments,
  setSharedPayments,
  sharedLoans,
  setSharedLoans,
  moduleFilterTarget,
  activeLoanFilter = 'All', setActiveLoanFilter,
  loanSearchQuery = '', setLoanSearchQuery,
  loanDeptFilter = 'All', setLoanDeptFilter,
  loanTypeFilter = 'All', setLoanTypeFilter,
  loanStatusFilter = 'All', setLoanStatusFilter,
}) {
  const [localSection, setLocalSection] = useState(
    "Payment Overview"
  );
  const requestedSection = moduleFilterTarget?.section
  const section = automationPayroll && ['Payment Overview', 'Bank Integration', 'Bank Deposits', 'Direct Deposits', 'Loan'].includes(requestedSection)
    ? requestedSection
    : localSection
  const setSection = (value) => { setLocalSection(value); moduleFilterTarget?.clear?.() }

  const [localDeposits, setLocalDeposits] =
    useState(demoRows);
  const deposits = sharedPayments || localDeposits
  const setDeposits = setSharedPayments || setLocalDeposits

  const [bank, setBank] = useState(emptyBank);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [date, setDate] = useState("");
  const [localAutomationKpiFilter, setLocalAutomationKpiFilter] = useState("All");
  const automationKpiFilter = moduleFilterTarget?.section === 'Payment Overview' && automationPayroll ? moduleFilterTarget.filter : localAutomationKpiFilter
  const setAutomationKpiFilter = (filter) => { setLocalAutomationKpiFilter(filter); moduleFilterTarget?.clear?.() }

  useEffect(() => {
    if (!automationPayroll || !['Payment Overview', 'Bank Integration', 'Bank Deposits', 'Direct Deposits', 'Loan'].includes(moduleFilterTarget?.section)) return
    setLocalSection(moduleFilterTarget.section)
    if (moduleFilterTarget.section === 'Payment Overview') {
      setLocalAutomationKpiFilter(moduleFilterTarget.filter || 'All')
    }
    moduleFilterTarget.clear?.()
  }, [automationPayroll, moduleFilterTarget?.section, moduleFilterTarget?.filter])

  const [employeeId, setEmployeeId] = useState(
    employees[0]?.id || ""
  );

  const [scheduledDate, setScheduledDate] =
    useState(getLocalDate());

  const [detail, setDetail] = useState(null);
  const [approval, setApproval] = useState(false);

  const [bankAccounts, setBankAccounts] =
    useState([]);

  // ==========================================================
  // LOAD BANK ACCOUNTS
  // ==========================================================

  useEffect(() => {
    return undefined
  }, [automationPayroll]);

  const displayedBankAccounts = [
    ...(automationPayroll
      ? bankExampleAccounts
      : []),

    ...bankAccounts.map((account) => ({
      ...account,
      bank_name:
        account.bank_name ||
        account.bank ||
        "—",
      account_purpose:
        account.account_purpose ||
        account.account_holder_name ||
        "Purpose not provided",
      ifsc_code:
        account.ifsc_code ||
        account.ifsc ||
        "—",
      connection_status:
        account.connection_status ||
        account.status ||
        "Not connected",
      illustrative: false,
    })),
  ];

  // ==========================================================
  // FILTER DEPOSITS
  // ==========================================================

  const filtered = useMemo(() => {
    return deposits.filter((deposit) => {
      const text = [
        deposit.id,
        deposit.employee?.name,
        deposit.employee?.id,
        deposit.ref,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKpi = !automationPayroll || automationKpiFilter === "All" ||
        (automationKpiFilter === "Total Payroll Amount" && true) ||
        (automationKpiFilter === "Total Payments" && true) ||
        (automationKpiFilter === "Successful Payments" && deposit.status === "Successful") ||
        (automationKpiFilter === "Pending Payments" && deposit.status === "Pending") ||
        (automationKpiFilter === "Failed Payments" && deposit.status === "Failed");
      return (
        text.includes(search.toLowerCase()) &&
        (status === "All" ||
          deposit.status === status) && matchesKpi &&
        (!date || deposit.date === date)
      );
    });
  }, [deposits, search, status, date, automationPayroll, automationKpiFilter]);

  const selectedEmployee = employees.find(
    (employee) => employee.id === employeeId
  );

  const netAmount = (employee) =>
    Number(
      String(
        employee?.grossSalary || "0"
      ).replace(/[₹,/\s]|mo/g, "")
    ) || 0;

  const counts = {
    total: deposits.length,
    success: deposits.filter(
      (deposit) =>
        deposit.status === "Successful"
    ).length,
    pending: deposits.filter(
      (deposit) =>
        deposit.status === "Pending"
    ).length,
    failed: deposits.filter(
      (deposit) =>
        deposit.status === "Failed"
    ).length,
  };

  // ==========================================================
  // ADD BANK ACCOUNT
  // ==========================================================

  const createBank = async (event) => {
    event.preventDefault();
    if (readOnly) return;

    if (!/^\d{4}$/.test(bank.account_last4)) {
      show?.(
        "Enter only the last four digits of the account number."
      );
      return;
    }

    setBankAccounts((previous) => [...previous, { ...bank, id: `BANK-${Date.now()}`, connection_status: "Local profile" }]);
    setBank(emptyBank)
    show?.("Bank account profile saved locally.")
  };

  // ==========================================================
  // DIRECT DEPOSIT DEMO
  // ==========================================================

  const confirmDemoPayment = () => {
    if (readOnly) return;
    setApproval(false);

    if (!selectedEmployee) return;

    const now = Date.now();

    const row = {
      id: `PAY-${String(now).slice(-6)}`,
      employee: selectedEmployee,
      bank: "Bank details not configured",
      account: "Not available",
      amount: netAmount(selectedEmployee),
      date: scheduledDate,
      ref: `SANDBOX-${now}`,
      status:
        scheduledDate > getLocalDate()
          ? "Pending"
          : "Successful",
    };

    setDeposits((previous) => [
      row,
      ...previous,
    ]);

    logAction?.(
      `Created sandbox salary payment for ${selectedEmployee.id}`,
      "Payments"
    );

    show?.(
      "Sandbox payment recorded. No bank transfer was initiated."
    );
  };

  // ==========================================================
  // DOWNLOAD REPORT
  // ==========================================================

  const downloadReport = () => {
    const csv = [
      [
        "Payment ID",
        "Employee ID",
        "Employee Name",
        "Amount",
        "Date",
        "Reference",
        "Status",
      ],

      ...deposits.map((deposit) => [
        deposit.id,
        deposit.employee?.id,
        deposit.employee?.name,
        deposit.amount,
        deposit.date,
        deposit.ref,
        deposit.status,
      ]),
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv",
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = "sandbox-payment-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  // ==========================================================
  // PAYMENT TABLE ROWS
  // ==========================================================

  const tableRows = filtered.map((deposit) => [
    <span className="font-mono text-accent">
      {deposit.id}
    </span>,

    automationPayroll
      ? <span className="block min-w-0"><b className="block truncate">{deposit.employee?.name || "—"}</b><small className="block font-mono text-muted">{deposit.employee?.id || "—"}</small></span>
      : <Who n={deposit.employee?.name || "—"} s={deposit.employee?.id} />,

    deposit.bank,

    deposit.account,

    <b>{money(deposit.amount)}</b>,

    deposit.date,

    <span className="font-mono">
      {deposit.ref}
    </span>,

    <Pill k={statusKind(deposit.status)}>
      {deposit.status}
    </Pill>,

    <button
      type="button"
      className="btn2"
      aria-label="View Details"
      title="View Details"
      onClick={() => setDetail(deposit)}
    >
      {automationPayroll
        ? <Icon k="eye" />
        : "View Details"}
    </button>,
  ]);

  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <div
      className={`automation-payroll-page flex flex-col gap-4 w-full min-w-0 ${
        automationPayroll
          ? "automation-payroll-primary"
          : ""
      }`}
    >
      <style>{automationStyles}</style>

      {!automationPayroll && (
        <div className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">
          <b className="text-warn">
            DEMO / SANDBOX MODE
          </b>

          <p className="text-muted mt-1">
            No bank API credentials or provider are
            configured. Sample transactions are
            simulated; no real funds move.
          </p>
        </div>
      )}

      {/* MAIN TABS */}

      <div className="tabs sub w flex-wrap">
        {[
          "Payment Overview",
          "Bank Integration",
          "Bank Deposits",
          "Direct Deposits",
          "Loan",
        ].map((tab) => (
          <button
            key={tab}
            type="button"
            className="tab"
            aria-pressed={section === tab}
            onClick={() => setSection(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PAYMENT OVERVIEW */}

      {section === "Payment Overview" && (
        <>
          <div
            className={
              automationPayroll
                ? "automation-payroll-kpis"
                : ""
            }
          >
            <Kpis
              onItemClick={automationPayroll ? (item) => setAutomationKpiFilter((current) => current === item.title ? "All" : item.title) : undefined}
              items={[
                [
                  "Total Payroll Amount",
                  money(
                    deposits.reduce(
                      (sum, deposit) =>
                        sum + deposit.amount,
                      0
                    )
                  ),
                  "Sandbox preview",
                  automationKpiFilter === "Total Payroll Amount",
                ],
                [
                  "Total Payments",
                  counts.total,
                  "Recorded payments",
                  automationKpiFilter === "Total Payments",
                ],
                [
                  "Successful Payments",
                  counts.success,
                  "Demo outcomes",
                  automationKpiFilter === "Successful Payments",
                ],
                [
                  "Pending Payments",
                  counts.pending,
                  "Awaiting scheduled date",
                  automationKpiFilter === "Pending Payments",
                ],
                [
                  "Failed Payments",
                  counts.failed,
                  "Require review",
                  automationKpiFilter === "Failed Payments",
                ],
              ]}
            />
          </div>

          <Card
            title="Payment activity"
            sub="Illustrative payment records"
          >
            {automationPayroll && ["Successful Payments", "Pending Payments", "Failed Payments"].includes(automationKpiFilter) && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface2 px-3 py-2 text-xs">
                <span className="text-muted">Showing <b className="text-ink">{automationKpiFilter}</b> · {filtered.length} matching payment records</span>
                <button type="button" className="btn2 py-1 px-2" onClick={() => setAutomationKpiFilter("All")}>Show All</button>
              </div>
            )}
            <Table
              cols={[
                "Payment ID",
                "Employee",
                "Bank",
                "Account",
                "Amount",
                "Date",
                "Reference",
                "Status",
                "Action",
              ]}
              rows={tableRows}
            />
          </Card>
        </>
      )}

      {/* BANK INTEGRATION */}

      {section === "Bank Integration" && (
        <>
          {automationPayroll && (
            <Card
              title="Corporate bank accounts"
              sub="Saved profiles plus illustrative examples"
            >
              <div className="automation-bank-example-grid">
                {displayedBankAccounts.map(
                  (account, index) => (
                    <div
                      className="automation-bank-example-card"
                      key={`${
                        account.id ||
                        account.ifsc_code ||
                        account.bank_name
                      }-${index}`}
                    >
                      <div className="automation-bank-example-heading">
                        <b>{account.bank_name}</b>

                        <Pill
                          k={
                            account.illustrative
                              ? "warn"
                              : "info"
                          }
                        >
                          {account.illustrative
                            ? "Sample"
                            : account.connection_status}
                        </Pill>
                      </div>

                      <div>
                        <span className="sec block">
                          Account Holder
                        </span>

                        <b>
                          {account.account_holder_name ||
                            "—"}
                        </b>
                      </div>

                      <div>
                        <span className="sec block">
                          Account Number
                        </span>

                        <b>
                          ••••{" "}
                          {account.account_last4 ||
                            "—"}
                        </b>
                      </div>

                      <div>
                        <span className="sec block">
                          Account Purpose
                        </span>

                        <b>
                          {account.account_purpose ||
                            "—"}
                        </b>
                      </div>

                      <div>
                        <span className="sec block">
                          IFSC Code
                        </span>

                        <b className="font-mono">
                          {account.ifsc_code || "—"}
                        </b>
                      </div>

                      <span className="automation-bank-example-note">
                        {account.illustrative
                          ? "Illustrative only · not a verified live connection"
                          : "Saved account profile · connection status not independently verified"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}

          {!readOnly && <Card
            title="Bank Integration"
            sub="Provider connection is disabled until credentials and a supported adapter are configured."
          >
            <form
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
              onSubmit={createBank}
            >
              {[
                ["bank_name", "Bank Name"],
                [
                  "account_holder_name",
                  "Account Holder Name",
                ],
                [
                  "account_last4",
                  "Last 4 account digits",
                ],
                ["ifsc_code", "IFSC Code"],
                ["branch_name", "Branch Name"],
              ].map(([key, label]) => (
                <label
                  className="field text-xs"
                  key={key}
                >
                  {label}

                  <input
                    className="inp"
                    value={bank[key]}
                    maxLength={
                      key === "account_last4"
                        ? 4
                        : 80
                    }
                    onChange={(event) =>
                      setBank((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              ))}

              <label className="field text-xs">
                Account Type

                <select
                  className="inp"
                  value={bank.account_type}
                  onChange={(event) =>
                    setBank((previous) => ({
                      ...previous,
                      account_type:
                        event.target.value,
                    }))
                  }
                >
                  <option>Current</option>
                  <option>Savings</option>
                </select>
              </label>

              <div className="sm:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
                <button
                  className="btn"
                  type="submit"
                >
                  Add Bank Account
                </button>

                <button
                  className="btn2"
                  type="button"
                  onClick={() =>
                    show?.(
                      "Verification unavailable: no bank API provider configured."
                    )
                  }
                >
                  Verify Bank Account
                </button>

                <button
                  className="btn2"
                  type="button"
                  onClick={() =>
                    show?.(
                      "Connect Bank is unavailable in sandbox mode."
                    )
                  }
                >
                  Connect Bank
                </button>
              </div>
            </form>
          </Card>}

          {/* BANK ACCOUNTS WITH EXAMPLES */}

          <Card
            title="Bank accounts"
            sub="Example accounts are labeled Demo Only"
          >
            <Table
              cols={[
                "Bank",
                "Account Holder",
                "Account Number",
                "IFSC",
                "Branch",
                "Type",
                "Connection Status",
                "Last Sync",
                "Action",
              ]}
              rows={displayedBankAccounts.map(
                (account) => [
                  account.bank_name,

                  account.account_holder_name ||
                    "—",

                  `•••• ${
                    account.account_last4 || "—"
                  }`,

                  account.ifsc_code || "—",

                  account.branch_name || "—",

                  account.account_type || "—",

                  <Pill
                    k={
                      account.illustrative
                        ? "warn"
                        : "info"
                    }
                  >
                    {account.illustrative
                      ? "Sample"
                      : account.connection_status ||
                        "Not connected"}
                  </Pill>,

                  "—",

                  account.illustrative ? (
                    <span className="text-xs text-muted">
                      Example
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn2 text-xs"
                      onClick={() =>
                        show?.(
                          "No active bank connection to disconnect."
                        )
                      }
                    >
                      Disconnect
                    </button>
                  ),
                ]
              )}
            />
          </Card>
        </>
      )}

      {/* BANK DEPOSITS */}

      {section === "Bank Deposits" && (
        <Card
          title="Bank Deposits"
          sub="Search and review salary payment records"
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              className="inp"
              placeholder="Search ID, employee or reference"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <input
              className="inp"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />

            <select
              className="inp"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              {[
                "All",
                "Successful",
                "Pending",
                "Failed",
              ].map((item) => (
                <option key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <Table
            cols={[
              "Deposit ID",
              "Employee",
              "Bank Name",
              "Account Number",
              "Deposit Amount",
              "Deposit Date",
              "Transaction Reference",
              "Deposit Status",
              "Action",
            ]}
            rows={tableRows}
          />
        </Card>
      )}

      {/* DIRECT DEPOSITS */}

      {section === "Direct Deposits" && (
        <>
          <Card
            title="Direct Deposits"
            sub="Prepare a sandbox payroll transfer"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <label className="field text-xs">
                Employee

                <select
                  className="inp"
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(
                      event.target.value
                    )
                  }
                >
                  {employees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name} ·{" "}
                      {employee.id}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <small className="sec">
                  Employee ID
                </small>

                <b className="block">
                  {selectedEmployee?.id || "—"}
                </b>
              </div>

              <div>
                <small className="sec">
                  Bank account
                </small>

                <b className="block">
                  Not configured
                </b>
              </div>

              <div>
                <small className="sec">
                  Salary amount
                </small>

                <b className="block">
                  {money(
                    netAmount(selectedEmployee)
                  )}
                </b>
              </div>

              <label className="field text-xs">
                Payment Date

                <input
                  type="date"
                  className="inp"
                  value={scheduledDate}
                  onChange={(event) =>
                    setScheduledDate(
                      event.target.value
                    )
                  }
                />
              </label>

              {!readOnly && <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setApproval(true)
                  }
                >
                  Initiate Direct Deposit
                </button>

                <button
                  type="button"
                  className="btn2"
                  onClick={() => {
                    const tomorrow = new Date();

                    tomorrow.setDate(
                      tomorrow.getDate() + 1
                    );

                    const year =
                      tomorrow.getFullYear();

                    const month = String(
                      tomorrow.getMonth() + 1
                    ).padStart(2, "0");

                    const day = String(
                      tomorrow.getDate()
                    ).padStart(2, "0");

                    setScheduledDate(
                      `${year}-${month}-${day}`
                    );

                    show?.(
                      "Payment date scheduled in sandbox."
                    );
                  }}
                >
                  Schedule Payment
                </button>
              </div>}
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="btn2"
                onClick={downloadReport}
              >
                Download Payment Report
              </button>
            </div>
          </Card>

          <Card
            title="Direct deposit records"
            sub="Sandbox records"
          >
            <Table
              cols={[
                "Payment ID",
                "Employee",
                "Bank",
                "Account",
                "Salary Amount",
                "Payment Date",
                "Transaction Reference",
                "Payment Status",
                "Action",
              ]}
              rows={tableRows}
            />
          </Card>
        </>
      )}

      {/* LOAN TAB */}

      {section === "Loan" && (
        <AutomationPayrollLoans
          show={show}
          logAction={logAction}
          automationExamples={automationPayroll}
          readOnly={readOnly}
          sharedLoans={sharedLoans}
          setSharedLoans={setSharedLoans}
          activeLoanFilter={activeLoanFilter}
          setActiveLoanFilter={setActiveLoanFilter}
          loanSearchQuery={loanSearchQuery} setLoanSearchQuery={setLoanSearchQuery}
          loanDeptFilter={loanDeptFilter} setLoanDeptFilter={setLoanDeptFilter}
          loanTypeFilter={loanTypeFilter} setLoanTypeFilter={setLoanTypeFilter}
          loanStatusFilter={loanStatusFilter} setLoanStatusFilter={setLoanStatusFilter}
        />
      )}

      {/* CENTERED PAYMENT DETAILS POPUP */}

      {detail && (
        <CenterModal
          small
          title={`Payment Details · ${detail.id}`}
          onClose={() => setDetail(null)}
        >
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries({
              "Payment ID": detail.id,
              Employee: detail.employee?.name,
              "Employee ID":
                detail.employee?.id,
              Bank: detail.bank,
              Account: detail.account,
              Amount: money(detail.amount),
              Date: detail.date,
              Reference: detail.ref,
              Status: detail.status,
            }).map(([key, value]) => (
              <div key={key}>
                <dt className="text-muted">
                  {key}
                </dt>

                <dd
                  className="font-semibold"
                  style={{
                    overflowWrap: "anywhere",
                  }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </CenterModal>
      )}

      {/* DIRECT DEPOSIT CONFIRMATION */}

      {!readOnly && approval && (
        <CenterModal
          small
          alert
          title="Confirm sandbox payment"
          onClose={() => setApproval(false)}
        >
          <p className="text-sm text-muted my-3">
            Record a simulated payment for{" "}
            {selectedEmployee?.name}.
            No transfer will be sent to a bank.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn"
              onClick={confirmDemoPayment}
            >
              Confirm sandbox action
            </button>
          </div>
        </CenterModal>
      )}
    </div>
  );
}
