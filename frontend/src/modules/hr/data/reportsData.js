/**
 * Centralized Reports & Analytics Data Service
 * Comprehensive dataset and analytics engine for enterprise HRMS India - Nexora Technologies
 * Directly reads from and computes against the canonical mockDb.js
 */

import {
  CANONICAL_EMPLOYEES_12,
  CANONICAL_METRICS,
  CANONICAL_CANDIDATES_8,
  COMPANY_CONFIG
} from './mockDb.js';
import { formatCompactINR } from '../utils/format.js';

// Available Report Categories
export const REPORT_CATEGORIES = [
  { id: "employee", label: "Employee Reports", icon: "users", description: "Headcount, demographics, department distribution & attrition trends" },
  { id: "attendance", label: "Attendance Reports", icon: "clock", description: "Punctuality, late arrivals, overtime, Face ID logs & monthly shifts" },
  { id: "leave", label: "Leave Reports", icon: "calendar", description: "Leave requests, type utilization, approval velocity & employee balances" },
  { id: "payroll", label: "Payroll Reports", icon: "dollar-sign", description: "Gross/net salary disbursement, PF, ESI, TDS statutory deductions" },
  { id: "performance", label: "Performance Reports", icon: "trending-up", description: "Scorecards, rating distributions, KPI achievements & goal completion" },
  { id: "onboarding_exit", label: "Onboarding & Exit", icon: "user-check", description: "Digital verification pipelines, joining milestones & exit turnover" },
  { id: "tasks", label: "Task Reports", icon: "check", description: "Task progress, team workload, overdue milestones & sprint completion" },
  { id: "custom", label: "Custom Reports", icon: "file-text", description: "Build bespoke multi-dimension reports with customizable metrics & charts" }
];

// Canonical Departments in Nexora Technologies
export const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Design",
  "Sales",
  "Operations",
  "Marketing",
  "Finance",
  "Support"
];

// Employment Status Options
export const EMPLOYMENT_STATUSES = [
  "Active",
  "On Leave"
];

// Helper to check user elevated permissions
export const getUserRoleLevel = (user) => {
  if (!user) return "employee";
  const sys = (user.systemRole || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  if (sys === "hr" || sys === "hr manager" || role.includes("hr")) return "hr";
  if (sys === "manager" || role.includes("manager") || role.includes("lead") || role.includes("architect")) return "manager";
  return "employee";
};

// ================= 1. EMPLOYEE REPORTS DATA =================
export const getEmployeeReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  let list = CANONICAL_EMPLOYEES_12.map(e => ({
    id: e.id,
    name: e.name,
    dept: e.dept,
    role: e.designation,
    gender: e.gender,
    status: e.status,
    joined: e.joiningDate,
    type: e.employmentType,
    experience: `${e.totalExperienceYears} yrs`,
    location: e.location
  }));

  // Role scoping
  if (roleLevel === "employee") {
    list = list.filter(e => e.id.toUpperCase() === (user?.employeeId || "").toUpperCase());
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  // Filter application
  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);
  if (filters.status && filters.status !== "All") list = list.filter(e => e.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  }

  // Aggregations
  const total = list.length;
  const active = list.filter(e => e.status === "Active").length;
  const onLeave = list.filter(e => e.status === "On Leave").length;

  const deptCounts = {};
  list.forEach(e => { deptCounts[e.dept] = (deptCounts[e.dept] || 0) + 1; });
  const deptChart = Object.keys(deptCounts).map(d => ({ name: d, count: deptCounts[d] }));

  const genderCounts = {};
  list.forEach(e => { genderCounts[e.gender] = (genderCounts[e.gender] || 0) + 1; });
  const genderChart = Object.keys(genderCounts).map(g => ({ name: g, value: genderCounts[g] }));

  const attritionTrend = [
    { month: "Jun", exits: 0, joiners: 1, attritionRate: 8.3 },
    { month: "Jul", exits: 0, joiners: 2, attritionRate: 8.3 },
    { month: "Aug", exits: 1, joiners: 1, attritionRate: 8.3 },
    { month: "Sep", exits: 0, joiners: 0, attritionRate: 8.3 },
    { month: "Oct", exits: 0, joiners: 0, attritionRate: 8.3 },
    { month: "Nov", exits: 0, joiners: 0, attritionRate: 8.3 }
  ];

  return {
    kpis: [
      { label: "Total Workforce", value: total, trend: "12 Headcount", icon: "users" },
      { label: "Active Employees", value: active, trend: `${Math.round((active / (total || 1)) * 100)}% Rate`, icon: "user-check" },
      { label: "On Leave Today", value: onLeave, trend: onLeave === 1 ? "1 Employee" : `${onLeave} Employees`, icon: "clock" },
      { label: "Attrition (6M)", value: CANONICAL_METRICS.attritionRate, trend: "Standardized", icon: "trending-up" }
    ],
    charts: {
      department: deptChart,
      gender: genderChart,
      attrition: attritionTrend
    },
    table: list
  };
};

// ================= 2. ATTENDANCE REPORTS DATA =================
export const getAttendanceReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  let list = CANONICAL_EMPLOYEES_12.map(e => {
    const isLeave = e.status === "On Leave";
    return {
      id: e.id,
      name: e.name,
      dept: e.dept,
      date: "2026-11-12",
      checkIn: isLeave ? "-" : (e.id === "EMP-1234" ? "09:28 AM" : "08:55 AM"),
      checkOut: isLeave ? "-" : "06:15 PM",
      hours: isLeave ? "0h 00m" : "9h 20m",
      mode: isLeave ? "Portal" : (e.workMode === "WFH" ? "Web / VPN" : "Face ID"),
      status: isLeave ? "On Leave" : "Present",
      overtime: isLeave ? "0h 00m" : "0h 20m",
      punctuality: isLeave ? "Leave" : (e.id === "EMP-1234" ? "Late (13m)" : "On-Time")
    };
  });

  if (roleLevel === "employee") {
    list = list.filter(e => e.id.toUpperCase() === (user?.employeeId || "").toUpperCase());
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);
  if (filters.status && filters.status !== "All") list = list.filter(e => e.status === filters.status);

  const presentCount = list.filter(e => e.status === "Present").length;
  const onLeaveCount = list.filter(e => e.status === "On Leave").length;
  const lateCount = list.filter(e => e.punctuality.startsWith("Late")).length;
  const attendancePct = list.length > 0 ? Math.round((presentCount / list.length) * 100) : 0;

  const monthlyTrend = [
    { month: "Jun", attendance: 91.7, lateRate: 8.3, overtimeHours: 24 },
    { month: "Jul", attendance: 91.7, lateRate: 8.3, overtimeHours: 28 },
    { month: "Aug", attendance: 91.7, lateRate: 8.3, overtimeHours: 26 },
    { month: "Sep", attendance: 91.7, lateRate: 8.3, overtimeHours: 30 },
    { month: "Oct", attendance: 91.7, lateRate: 8.3, overtimeHours: 25 },
    { month: "Nov", attendance: attendancePct, lateRate: 8.3, overtimeHours: 18 }
  ];

  const modeDistribution = [
    { name: "Face ID Camera", value: 8 },
    { name: "Web / VPN Log", value: 3 },
    { name: "On Leave", value: 1 }
  ];

  const deptAttendance = [
    { dept: "Engineering", attendanceRate: 75 }, // 3 present, 1 leave
    { dept: "Human Resources", attendanceRate: 100 },
    { dept: "Design", attendanceRate: 100 },
    { dept: "Sales", attendanceRate: 100 },
    { dept: "Operations", attendanceRate: 100 },
    { dept: "Marketing", attendanceRate: 100 },
    { dept: "Finance", attendanceRate: 100 },
    { dept: "Support", attendanceRate: 100 }
  ];

  return {
    kpis: [
      { label: "Attendance Rate", value: `${attendancePct}%`, trend: `${presentCount}/${list.length} Present`, icon: "check" },
      { label: "Present Today", value: presentCount, trend: "Checked In", icon: "user-check" },
      { label: "On Leave Today", value: onLeaveCount, trend: "Approved Leave", icon: "clock" },
      { label: "Late Arrivals", value: lateCount, trend: "Within Grace", icon: "clock" }
    ],
    charts: {
      monthly: monthlyTrend,
      verificationMode: modeDistribution,
      department: deptAttendance
    },
    table: list
  };
};

// ================= 3. LEAVE REPORTS DATA =================
export const getLeaveReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  let list = [
    { id: "LR-401", empId: "EMP-1145", name: "Sneha Nair", dept: "Engineering", type: "Earned Leave", days: 2, dates: "12 Nov - 13 Nov 2026", balance: 8, approver: "Meera Reddy", status: "Approved" },
    { id: "LR-402", empId: "EMP-2002", name: "Anita Desai", dept: "Engineering", type: "Medical Leave", days: 2, dates: "14 Nov - 15 Nov 2026", balance: 12, approver: "Aarav Sharma", status: "Pending" },
    { id: "LR-403", empId: "EMP-1088", name: "Pooja Patel", dept: "Human Resources", type: "Casual Leave", days: 1, dates: "16 Nov 2026", balance: 6, approver: "Meera Reddy", status: "Pending" },
    { id: "LR-404", empId: "EMP-1234", name: "Devansh Mehta", dept: "Engineering", type: "Casual Leave", days: 1, dates: "18 Nov 2026", balance: 5, approver: "Aarav Sharma", status: "Pending" },
    { id: "LR-405", empId: "EMP-1201", name: "Kavita Rao", dept: "Finance", type: "Casual Leave", days: 1, dates: "09 Nov 2026", balance: 3, approver: "Meera Reddy", status: "Rejected" }
  ];

  if (roleLevel === "employee") {
    list = list.filter(e => e.empId.toUpperCase() === (user?.employeeId || "").toUpperCase());
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);
  if (filters.status && filters.status !== "All") list = list.filter(e => e.status === filters.status);

  const approved = list.filter(l => l.status === "Approved").length;
  const pending = list.filter(l => l.status === "Pending").length;
  const rejected = list.filter(l => l.status === "Rejected").length;

  const typeDistribution = [
    { name: "Earned Leave (EL)", value: 45 },
    { name: "Casual Leave (CL)", value: 35 },
    { name: "Sick Leave (SL)", value: 20 }
  ];

  const deptLeaveChart = [
    { dept: "Engineering", approvedDays: 2, pendingDays: 3 },
    { dept: "Human Resources", approvedDays: 0, pendingDays: 1 },
    { dept: "Finance", approvedDays: 0, pendingDays: 0 }
  ];

  const monthlyLeaveTrend = [
    { month: "Jun", days: 3 },
    { month: "Jul", days: 4 },
    { month: "Aug", days: 5 },
    { month: "Sep", days: 3 },
    { month: "Oct", days: 6 },
    { month: "Nov", days: 5 }
  ];

  return {
    kpis: [
      { label: "Total Leave Requests", value: list.length, trend: "Current Cycle", icon: "calendar" },
      { label: "Approved Requests", value: approved, trend: "Active Leaves", icon: "check" },
      { label: "Pending Sign-Off", value: pending, trend: "Action Req.", icon: "clock" },
      { label: "Rejected Requests", value: rejected, trend: "Reconciled", icon: "alert-triangle" }
    ],
    charts: {
      typeDistribution,
      deptBreakdown: deptLeaveChart,
      monthlyTrend: monthlyLeaveTrend
    },
    table: list
  };
};

// ================= 4. PAYROLL REPORTS DATA =================
export const getPayrollReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  let list = CANONICAL_EMPLOYEES_12.map(e => ({
    id: e.id,
    name: e.name,
    dept: e.dept,
    designation: e.designation,
    gross: e.grossMonthly,
    pf: e.pfMonthly,
    esi: 0,
    tds: e.tdsMonthly,
    pt: e.ptMonthly,
    deductions: e.pfMonthly + e.tdsMonthly + e.ptMonthly,
    net: e.netMonthly,
    status: "Paid"
  }));

  if (roleLevel === "employee") {
    list = list.filter(e => e.id.toUpperCase() === (user?.employeeId || "").toUpperCase());
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);

  const totalGross = list.reduce((sum, e) => sum + e.gross, 0);
  const totalNet = list.reduce((sum, e) => sum + e.net, 0);
  const totalDeductions = list.reduce((sum, e) => sum + e.deductions, 0);
  const totalTds = list.reduce((sum, e) => sum + e.tds, 0);
  const totalPf = list.reduce((sum, e) => sum + e.pf, 0);
  const totalPt = list.reduce((sum, e) => sum + e.pt, 0);

  const deptPayroll = [
    { dept: "Engineering", amount: 770000 },
    { dept: "Human Resources", amount: 385000 },
    { dept: "Sales", amount: 220833 },
    { dept: "Marketing", amount: 208333 },
    { dept: "Design", amount: 200000 },
    { dept: "Operations", amount: 183333 },
    { dept: "Finance", amount: 165000 },
    { dept: "Support", amount: 87500 }
  ];

  const deductionsBreakdown = [
    { name: "TDS / Income Tax", value: totalTds },
    { name: "Provident Fund (EPF)", value: totalPf },
    { name: "Professional Tax (Telangana)", value: totalPt }
  ];

  const monthlyPayrollTrend = [
    { month: "Jun", gross: totalGross, net: totalNet, deductions: totalDeductions },
    { month: "Jul", gross: totalGross, net: totalNet, deductions: totalDeductions },
    { month: "Aug", gross: totalGross, net: totalNet, deductions: totalDeductions },
    { month: "Sep", gross: totalGross, net: totalNet, deductions: totalDeductions },
    { month: "Oct", gross: totalGross, net: totalNet, deductions: totalDeductions },
    { month: "Nov", gross: totalGross, net: totalNet, deductions: totalDeductions }
  ];

  return {
    kpis: [
      { label: "Total Monthly Gross", value: formatCompactINR(totalGross), trend: `${list.length} Employees`, icon: "dollar-sign" },
      { label: "Net Payout", value: formatCompactINR(totalNet), trend: "Direct Bank NEFT", icon: "check" },
      { label: "Statutory Deductions", value: formatCompactINR(totalDeductions), trend: "PF / TDS / PT", icon: "file-text" },
      { label: "TDS Remittance", value: formatCompactINR(totalTds), trend: "Challan 281", icon: "clock" }
    ],
    charts: {
      department: deptPayroll,
      deductions: deductionsBreakdown,
      monthly: monthlyPayrollTrend
    },
    table: list
  };
};

// ================= 5. PERFORMANCE REPORTS DATA =================
export const getPerformanceReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  const scoreMap = {
    "EMP-1042": 91,
    "EMP-1001": 88,
    "EMP-1088": 84,
    "EMP-1102": 72,
    "EMP-1301": 82,
    "EMP-1145": 66,
    "EMP-2002": 79,
    "EMP-1501": 75,
    "EMP-1401": 80,
    "EMP-1201": 78,
    "EMP-1234": 74,
    "EMP-1701": 70
  };

  let list = CANONICAL_EMPLOYEES_12.map(e => {
    const score = scoreMap[e.id] || 75;
    let band = "Meets Expectations";
    let rating = 3;
    if (score >= 90) { band = "Outstanding"; rating = 5; }
    else if (score >= 80) { band = "Exceeds Expectations"; rating = 4; }
    else if (score < 60) { band = "Needs Improvement"; rating = 2; }

    return {
      id: e.id,
      name: e.name,
      dept: e.dept,
      score,
      rating,
      band,
      goalsCompleted: rating >= 4 ? 4 : 3,
      kpiRate: `${score}%`,
      status: "Reviewed"
    };
  });

  if (roleLevel === "employee") {
    list = list.filter(e => e.id.toUpperCase() === (user?.employeeId || "").toUpperCase());
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);

  const avgScore = (list.reduce((sum, e) => sum + e.score, 0) / (list.length || 1)).toFixed(1);
  const highPerformers = list.filter(e => e.score >= 80).length;
  const needsImprovement = list.filter(e => e.score < 60).length;

  const ratingDistribution = [
    { name: "5 - Outstanding", count: list.filter(e => e.rating === 5).length, color: "#10b981" },
    { name: "4 - Exceeds", count: list.filter(e => e.rating === 4).length, color: "#10b981" },
    { name: "3 - Meets", count: list.filter(e => e.rating === 3).length, color: "#0077b6" },
    { name: "2 - Needs Improvement", count: list.filter(e => e.rating === 2).length, color: "#f59e0b" },
    { name: "1 - Unsatisfactory", count: list.filter(e => e.rating === 1).length, color: "#ef4444" }
  ];

  const deptScores = DEPARTMENTS.map(d => {
    const emps = list.filter(e => e.dept === d);
    const score = emps.length > 0 ? (emps.reduce((s, e) => s + e.score, 0) / emps.length).toFixed(1) : 75.0;
    return { dept: d, avgScore: Number(score) };
  });

  return {
    kpis: [
      { label: "Org Performance Avg", value: `${avgScore} / 100`, trend: "Q3 Cycle", icon: "bar-chart-2" },
      { label: "High Performers (≥80)", value: highPerformers, trend: "Exceeds Expectations", icon: "trending-up" },
      { label: "Needs Improvement (<60)", value: needsImprovement, trend: "Zero Critical", icon: "alert-triangle" },
      { label: "Appraisals Finalized", value: "100%", trend: `${list.length}/${list.length} Complete`, icon: "check" }
    ],
    charts: {
      ratingDistribution,
      deptScores,
      quarterlyTrend: [
        { quarter: "Q4 FY26", score: 74.2 },
        { quarter: "Q1 FY27", score: 76.5 },
        { quarter: "Q2 FY27", score: 77.0 },
        { quarter: "Q3 FY27", score: Number(avgScore) }
      ]
    },
    table: list
  };
};

// ================= 6. ONBOARDING & EXIT REPORTS DATA =================
export const getOnboardingExitReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  let list = CANONICAL_CANDIDATES_8.map(c => ({
    id: c.id,
    name: c.name,
    type: "Onboarding",
    dept: c.dept,
    stage: c.accessStatus.replace(/_/g, ' ').toUpperCase(),
    docsVerified: `${c.documents.filter(d => d.status === "verified").length}/${c.documents.length}`,
    targetDate: c.joiningDate,
    status: c.tasks,
    hrOwner: "Meera Reddy"
  }));

  if (roleLevel === "employee") {
    list = list.filter(e => e.name === user?.name);
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);

  const onboardingCount = list.length;
  const verifiedCount = list.filter(e => e.docsVerified.startsWith("5/5")).length;

  const pipelineStages = [
    { stage: "Docs Submitted", candidates: 3 },
    { stage: "Docs Approved", candidates: 1 },
    { stage: "Offer Issued", candidates: 1 },
    { stage: "Offer Accepted", candidates: 1 },
    { stage: "Round 2 Re-verify", candidates: 2 }
  ];

  return {
    kpis: [
      { label: "Active Onboardings", value: onboardingCount, trend: "8 Candidates", icon: "user-check" },
      { label: "Fully Cleared", value: verifiedCount, trend: "All 5 Docs Verified", icon: "check" },
      { label: "Clearance Rate", value: `${Math.round((verifiedCount / (onboardingCount || 1)) * 100)}%`, trend: "High Velocity", icon: "check" },
      { label: "Avg Onboarding Time", value: "12 Days", trend: "Optimized", icon: "trending-up" }
    ],
    charts: {
      pipeline: pipelineStages,
      exitReasons: [
        { name: "Better Opportunity / Tech Stack", value: 50 },
        { name: "Higher Education / Relocation", value: 50 }
      ]
    },
    table: list
  };
};

// ================= 7. TASK REPORTS DATA =================
export const getTaskReportData = (user, filters = {}) => {
  const roleLevel = getUserRoleLevel(user);
  let list = [
    { id: "TSK-1001", title: "Q3 Indian Payroll Compliance Audit", assignee: "Pooja Patel", dept: "Human Resources", priority: "High", dueDate: "2026-11-12", progress: 65, status: "In Progress" },
    { id: "TSK-1002", title: "Quarterly Form 16 Part A/B Verification", assignee: "Kavita Rao", dept: "Finance", priority: "High", dueDate: "2026-11-15", progress: 85, status: "In Progress" },
    { id: "TSK-1003", title: "Microservices API Gateway Rate Limiting", assignee: "Aarav Sharma", dept: "Engineering", priority: "High", dueDate: "2026-11-12", progress: 100, status: "Completed" },
    { id: "TSK-1004", title: "Gratuity Valuation Actuarial Report Sign-off", assignee: "Pooja Patel", dept: "Human Resources", priority: "High", dueDate: "2026-11-08", progress: 30, status: "Overdue" },
    { id: "TSK-1005", title: "Biometric Integration with Facial Recognition", assignee: "Devansh Mehta", dept: "Engineering", priority: "Medium", dueDate: "2026-11-18", progress: 60, status: "In Progress" },
    { id: "TSK-1006", title: "Design System Contrast Audit (WCAG AA)", assignee: "Devansh Mehta", dept: "Engineering", priority: "Medium", dueDate: "2026-11-11", progress: 50, status: "In Progress" },
    { id: "TSK-1007", title: "EPF ECR Filing Validation for October", assignee: "Kavita Rao", dept: "Finance", priority: "High", dueDate: "2026-11-13", progress: 75, status: "In Progress" },
    { id: "TSK-1008", title: "Candidate Background Verification (Tech Team Hires)", assignee: "Pooja Patel", dept: "Human Resources", priority: "Low", dueDate: "2026-11-02", progress: 100, status: "Completed" }
  ];

  if (roleLevel === "employee") {
    list = list.filter(e => e.assignee === user?.name);
  } else if (roleLevel === "manager") {
    const userDept = user?.dept || "Engineering";
    list = list.filter(e => e.dept === userDept);
  }

  if (filters.dept && filters.dept !== "All") list = list.filter(e => e.dept === filters.dept);
  if (filters.status && filters.status !== "All") list = list.filter(e => e.status === filters.status);

  const completed = list.filter(t => t.status === "Completed").length;
  const inProgress = list.filter(t => t.status === "In Progress").length;
  const overdue = list.filter(t => t.status === "Overdue").length;

  const priorityBreakdown = [
    { name: "High", value: list.filter(t => t.priority === "High").length, color: "#f59e0b" },
    { name: "Medium", value: list.filter(t => t.priority === "Medium").length, color: "#0077b6" },
    { name: "Low", value: list.filter(t => t.priority === "Low").length, color: "#10b981" }
  ];

  const deptTasks = [
    { dept: "Engineering", completed: 1, inProgress: 2, overdue: 0 },
    { dept: "Human Resources", completed: 1, inProgress: 1, overdue: 1 },
    { dept: "Finance", completed: 0, inProgress: 2, overdue: 0 }
  ];

  return {
    kpis: [
      { label: "Total Tasks Logged", value: list.length, trend: "Current Sprint", icon: "check" },
      { label: "Completed Tasks", value: completed, trend: `${Math.round((completed / (list.length || 1)) * 100)}% Velocity`, icon: "check" },
      { label: "In Progress", value: inProgress, trend: "Active Execution", icon: "clock" },
      { label: "Overdue Items", value: overdue, trend: overdue > 0 ? "Action Req." : "Zero Overdue", icon: "alert-triangle" }
    ],
    charts: {
      weeklyTrend: [
        { week: "Week 1", completed: 2, created: 2 },
        { week: "Week 2", completed: 2, created: 3 },
        { week: "Week 3", completed: 2, created: 3 }
      ],
      priority: priorityBreakdown,
      department: deptTasks
    },
    table: list
  };
};

// ================= 8. MASTER REPORT FETCH FUNCTION =================
export const fetchReportData = (category, user, filters = {}) => {
  switch (category) {
    case "attendance":
      return getAttendanceReportData(user, filters);
    case "leave":
      return getLeaveReportData(user, filters);
    case "payroll":
      return getPayrollReportData(user, filters);
    case "performance":
      return getPerformanceReportData(user, filters);
    case "onboarding_exit":
      return getOnboardingExitReportData(user, filters);
    case "tasks":
      return getTaskReportData(user, filters);
    case "employee":
    default:
      return getEmployeeReportData(user, filters);
  }
};
