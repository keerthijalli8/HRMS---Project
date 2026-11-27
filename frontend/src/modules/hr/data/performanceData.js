// DEMO SAMPLE DATA: replace with real appraisal data from the backend later

import { employeeData } from './mockData.js';

// Seeded pseudo-random generator (mulberry32) for deterministic numbers
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Safely parse joined date to check 90-day new joiner threshold
function isNewJoiner(joinedDateStr) {
  if (!joinedDateStr) return false;
  try {
    const joined = new Date(joinedDateStr);
    if (isNaN(joined.getTime())) return false;
    // Current application time: Nov 2026
    const now = new Date();
    const diffMs = now.getTime() - joined.getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs < ninetyDaysMs;
  } catch (e) {
    return false;
  }
}

// Standard rating bands
export function getRatingBand(score) {
  if (score === null || score === undefined) return { rating: null, label: "New joiner" };
  if (score >= 90) return { rating: 5, label: "Outstanding" };
  if (score >= 80) return { rating: 4, label: "Exceeds Expectations" };
  if (score >= 65) return { rating: 3, label: "Meets Expectations" };
  if (score >= 50) return { rating: 2, label: "Needs Improvement" };
  return { rating: 1, label: "Unsatisfactory" };
}

// Fixed demo employee target overall scores for stable tests across all 12 canonical employees
const FIXED_SCORES = {
  "EMP-1042": 91, // Aarav Sharma (Engineering)
  "EMP-1001": 88, // Meera Reddy (HR)
  "EMP-1088": 84, // Pooja Patel (HR)
  "EMP-1102": 72, // Rohan Varma (Design)
  "EMP-1301": 82, // Vikram Malhotra (Sales)
  "EMP-1145": 66, // Sneha Nair (Engineering)
  "EMP-2002": 79, // Anita Desai (Engineering)
  "EMP-1501": 75, // Suresh Menon (Operations)
  "EMP-1401": 80, // Ananya Roy (Marketing)
  "EMP-1201": 78, // Kavita Rao (Finance)
  "EMP-1234": 74, // Devansh Mehta (Engineering)
  "EMP-1701": 70  // Rhea Sen (Support)
};

// Department specific goals generator
function getGoalsForDept(dept, score, rand) {
  const isHigh = score >= 80;
  const isMid = score >= 65 && score < 80;

  const catalog = {
    Engineering: [
      { title: "Deliver Microservices Migration & API Gateway Phase 2", progress: isHigh ? 95 : isMid ? 80 : 55, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Achieve 85%+ Test Coverage across Service Repositories", progress: isHigh ? 90 : isMid ? 75 : 60, status: isHigh ? "On track" : isMid ? "On track" : "On track" },
      { title: "Reduce Production P1/P2 Incident Resolution Time by 25%", progress: isHigh ? 88 : isMid ? 70 : 45, status: isHigh ? "On track" : isMid ? "On track" : "At risk" },
      { title: "Mentor Junior Developers and Conduct 15+ Code Reviews", progress: isHigh ? 100 : isMid ? 85 : 50, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
    ],
    Product: [
      { title: "Launch Q3 Enterprise Self-Service Workflow Portal", progress: isHigh ? 92 : isMid ? 78 : 55, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Conduct 20+ Customer Discovery Interviews & Research Studies", progress: isHigh ? 85 : isMid ? 70 : 50, status: isHigh ? "On track" : isMid ? "On track" : "At risk" },
      { title: "Deliver Feature Roadmap & PRD Specs with Design Sign-off", progress: isHigh ? 90 : isMid ? 80 : 60, status: isHigh ? "On track" : isMid ? "On track" : "On track" },
      { title: "Improve User Retention Rate by 12% in Core Dashboard", progress: isHigh ? 88 : isMid ? 72 : 40, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
    ],
    "Quality Assurance": [
      { title: "Automate 90% of Regression Test Suites via Playwright", progress: isHigh ? 96 : isMid ? 82 : 55, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Zero Sev-1 Escape Bugs in Production Releases", progress: isHigh ? 100 : isMid ? 75 : 50, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Implement Performance Load Testing for 10k Concurrent Users", progress: isHigh ? 85 : isMid ? 70 : 45, status: isHigh ? "On track" : isMid ? "On track" : "At risk" },
      { title: "Maintain CI/CD Pipeline Automation Stability > 98%", progress: isHigh ? 90 : isMid ? 80 : 60, status: isHigh ? "On track" : isMid ? "On track" : "On track" },
    ],
    QA: [
      { title: "Automate 90% of Regression Test Suites via Playwright", progress: isHigh ? 96 : isMid ? 82 : 55, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Zero Sev-1 Escape Bugs in Production Releases", progress: isHigh ? 100 : isMid ? 75 : 50, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Implement Performance Load Testing for 10k Concurrent Users", progress: isHigh ? 85 : isMid ? 70 : 45, status: isHigh ? "On track" : isMid ? "On track" : "At risk" },
      { title: "Maintain CI/CD Pipeline Automation Stability > 98%", progress: isHigh ? 90 : isMid ? 80 : 60, status: isHigh ? "On track" : isMid ? "On track" : "On track" },
    ],
    "Human Resources": [
      { title: "Complete Annual Appraisal Cycle on Schedule with 95%+ Turnaround", progress: isHigh ? 98 : isMid ? 85 : 60, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Streamline 2-Round Digital Onboarding & Compliance Verification", progress: isHigh ? 92 : isMid ? 78 : 50, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Reduce Time-to-Hire to under 25 Days for Key Roles", progress: isHigh ? 85 : isMid ? 70 : 45, status: isHigh ? "On track" : isMid ? "On track" : "At risk" },
      { title: "Drive Employee Engagement Pulse Score above 85%", progress: isHigh ? 90 : isMid ? 75 : 55, status: isHigh ? "On track" : isMid ? "On track" : "On track" },
    ],
    Finance: [
      { title: "Ensure 100% On-Time Payroll Processing & Statutory Filings", progress: isHigh ? 100 : isMid ? 85 : 65, status: isHigh ? "Completed" : isMid ? "On track" : "On track" },
      { title: "Reconcile Form 16 and TDS Discrepancies with Zero Penalty", progress: isHigh ? 95 : isMid ? 78 : 50, status: isHigh ? "Completed" : isMid ? "On track" : "At risk" },
      { title: "Automate Monthly Expense & Vendor Reimbursement Workflows", progress: isHigh ? 88 : isMid ? 70 : 45, status: isHigh ? "On track" : isMid ? "On track" : "At risk" },
      { title: "Implement Department Budget Audits & Variance Controls", progress: isHigh ? 90 : isMid ? 75 : 55, status: isHigh ? "On track" : isMid ? "On track" : "On track" },
    ]
  };

  const deptKey = Object.keys(catalog).find(k => k.toLowerCase() === (dept || "").toLowerCase()) || "Engineering";
  return catalog[deptKey] || catalog.Engineering;
}

// Feedback text by rating band
function getFeedbackText(band, managerName) {
  const mgr = managerName || "Reporting Manager";
  switch (band.rating) {
    case 5:
      return {
        by: mgr,
        date: "05 Nov 2026",
        text: "Demonstrates exceptional technical and organizational leadership across squads. Consistently delivers ahead of deadlines with exemplary quality and architectural rigor."
      };
    case 4:
      return {
        by: mgr,
        date: "05 Nov 2026",
        text: "Strong performer who proactively resolves cross-team bottlenecks. Consistently produces high-quality deliverables and supports junior engineers effectively."
      };
    case 3:
      return {
        by: mgr,
        date: "05 Nov 2026",
        text: "Meets core expectations and delivers sprint commitments reliably. Encouraged to take broader ownership of strategic initiatives in upcoming quarters."
      };
    case 2:
      return {
        by: mgr,
        date: "05 Nov 2026",
        text: "Deliverables frequently require supervision and rework to meet quality standards. Needs to improve punctuality and proactive communication during sprint execution."
      };
    case 1:
    default:
      return {
        by: mgr,
        date: "05 Nov 2026",
        text: "Significant shortfall against core KPIs and project milestones. An intensive performance improvement plan (PIP) is recommended to align with team benchmarks."
      };
  }
}

// Generate single performance record deterministically
function buildPerformanceRecord(emp) {
  const employeeId = (emp.id || emp.employeeId || "").toUpperCase();
  const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || employeeId;
  const dept = emp.dept || emp.department || "Engineering";
  const role = emp.role || emp.designation || "Software Engineer";
  const manager = emp.mgr || emp.manager || "Executive Board";
  const joined = emp.joined || emp.joiningDate || "15 Jan 2023";

  // Check if New Joiner (< 90 days of service)
  if (isNewJoiner(joined)) {
    return {
      employeeId,
      name,
      dept,
      role,
      manager,
      joined,
      cycle: "Q3 FY27",
      status: "New joiner",
      overall: null,
      rating: null,
      ratingLabel: "New joiner",
      metrics: [],
      trend: [],
      goals: [],
      feedback: null
    };
  }

  // Deterministic seed
  const seed = hashString(employeeId);
  const rand = mulberry32(seed);

  // Target overall score
  let targetOverall;
  if (FIXED_SCORES[employeeId] !== undefined) {
    targetOverall = FIXED_SCORES[employeeId];
  } else {
    // Generate between 55 and 95
    targetOverall = Math.floor(55 + rand() * 41);
  }

  // Generate metric scores around targetOverall
  // Weights: goals 35, quality 20, attendance 15, teamwork 15, ownership 15
  const delta1 = Math.floor((rand() - 0.5) * 6);
  const delta2 = Math.floor((rand() - 0.5) * 6);
  const delta3 = Math.floor((rand() - 0.5) * 6);
  const delta4 = Math.floor((rand() - 0.5) * 6);

  const goalsScore = Math.min(100, Math.max(30, targetOverall + delta1));
  const qualityScore = Math.min(100, Math.max(30, targetOverall + delta2));
  const attendanceScore = Math.min(100, Math.max(30, targetOverall + delta3));
  const teamworkScore = Math.min(100, Math.max(30, targetOverall + delta4));

  // Compute 5th score so weighted average matches targetOverall exactly
  // targetOverall = (goals*35 + quality*20 + attendance*15 + teamwork*15 + ownership*15) / 100
  const subSum = (goalsScore * 35) + (qualityScore * 20) + (attendanceScore * 15) + (teamworkScore * 15);
  const neededOwnership = Math.round(((targetOverall * 100) - subSum) / 15);
  const ownershipScore = Math.min(100, Math.max(25, neededOwnership));

  // Final rounded weighted overall score
  const finalOverall = Math.round(
    (goalsScore * 35 + qualityScore * 20 + attendanceScore * 15 + teamworkScore * 15 + ownershipScore * 15) / 100
  );

  const band = getRatingBand(finalOverall);

  // Trend for last 6 months ending in current overall score
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const trend = [];
  for (let i = 0; i < 5; i++) {
    const monthVar = Math.floor((rand() - 0.48) * 6);
    const scoreVal = Math.min(100, Math.max(30, finalOverall - (5 - i) + monthVar));
    trend.push({ month: months[i], score: scoreVal });
  }
  // 6th month is exactly the current overall score
  trend.push({ month: months[5], score: finalOverall });

  const metrics = [
    { key: "goals", label: "Goals & KPIs", weight: 35, score: goalsScore },
    { key: "quality", label: "Quality of Work", weight: 20, score: qualityScore },
    { key: "attendance", label: "Attendance & Punctuality", weight: 15, score: attendanceScore },
    { key: "teamwork", label: "Teamwork & Collaboration", weight: 15, score: teamworkScore },
    { key: "ownership", label: "Initiative & Ownership", weight: 15, score: ownershipScore },
  ];

  const goals = getGoalsForDept(dept, finalOverall, rand);
  const feedback = getFeedbackText(band, manager);

  return {
    employeeId,
    name,
    dept,
    role,
    manager,
    joined,
    cycle: "Q3 FY27",
    status: "Reviewed",
    overall: finalOverall,
    rating: band.rating,
    ratingLabel: band.label,
    metrics,
    trend,
    goals,
    feedback
  };
}

// Fetch all registered users from localStorage
function getAllActiveEmployees(userCompanyId) {
  const targetCompany = userCompanyId || "NEX-IND";

  // 1. Employees from mockData.js
  const baseList = employeeData.filter(emp => (emp.companyId || "NEX-IND") === targetCompany);

  // 2. Active users from localStorage ("hrms_registered_users")
  let registered = [];
  try {
    const raw = localStorage.getItem("hrms_registered_users");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        registered = parsed.filter(u => {
          const comp = u.companyId || "NEX-IND";
          const status = (u.accessStatus || "active").toLowerCase();
          return comp === targetCompany && status === "active";
        });
      }
    }
  } catch (e) {
    console.warn("performanceData: Error reading hrms_registered_users:", e);
  }

  // Combine and deduplicate by employeeId
  const map = new Map();
  baseList.forEach(e => map.set((e.id || e.employeeId).toUpperCase(), e));
  registered.forEach(r => {
    const empId = (r.employeeId || r.id || "").toUpperCase();
    if (empId) map.set(empId, r);
  });

  return Array.from(map.values());
}

// Determine if the current user has elevated role permissions (HR, HR Manager, Manager)
function isElevatedRole(user) {
  if (!user) return false;
  const sys = (user.systemRole || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  return (
    sys === "hr" ||
    sys === "hr manager" ||
    sys === "manager" ||
    role.includes("hr") ||
    role.includes("manager") ||
    role.includes("lead") ||
    role.includes("architect")
  );
}

// 1. getPerformanceList(user)
export function getPerformanceList(user) {
  if (!user) return [];

  const empId = (user.employeeId || user.id || "").toUpperCase();
  const userCompany = user.companyId || "NEX-IND";

  // Permission rule check
  if (!isElevatedRole(user)) {
    // Normal Employee gets ONLY their own record
    const record = getEmployeePerformance(empId, user);
    return record ? [record] : [];
  }

  // Elevated users get all company employees
  const allEmployees = getAllActiveEmployees(userCompany);
  return allEmployees.map(emp => buildPerformanceRecord(emp));
}

// 2. getEmployeePerformance(employeeId, user)
export function getEmployeePerformance(employeeId, user) {
  if (!employeeId) return null;
  const cleanEmpId = employeeId.trim().toUpperCase();

  // Permission rule check: employee asking for someone else's record gets null
  if (user && !isElevatedRole(user)) {
    const userEmpId = (user.employeeId || user.id || "").toUpperCase();
    if (userEmpId !== cleanEmpId) {
      return null;
    }
  }

  const userCompany = user?.companyId || "NEX-IND";
  const allEmployees = getAllActiveEmployees(userCompany);

  let match = allEmployees.find(e => (e.id || e.employeeId || "").toUpperCase() === cleanEmpId);

  // If not found in company list, check current user if matches
  if (!match && user && (user.employeeId || user.id || "").toUpperCase() === cleanEmpId) {
    match = user;
  }

  // If still not found, check mockData regardless of company if it's the requested employee
  if (!match) {
    match = employeeData.find(e => (e.id || e.employeeId || "").toUpperCase() === cleanEmpId);
  }

  if (!match) return null;
  return buildPerformanceRecord(match);
}

// 3. getOrgSummary(list) - computed ONLY from reviewed employees
export function getOrgSummary(list = []) {
  const reviewed = list.filter(r => r.status === "Reviewed" && r.overall !== null);
  const eligible = list.filter(r => r.status !== "New joiner");

  const count = reviewed.length;
  const sum = reviewed.reduce((acc, r) => acc + (r.overall || 0), 0);
  const avgScore = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  const topPerformers = reviewed.filter(r => r.overall >= 85).length;
  const needsAttention = reviewed.filter(r => r.overall < 60).length;
  const reviewedPercent = eligible.length > 0 ? Math.round((count / eligible.length) * 100) : 100;

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewed.forEach(r => {
    if (r.rating && ratingCounts[r.rating] !== undefined) {
      ratingCounts[r.rating]++;
    }
  });

  // Department averages computed from reviewed
  const deptMap = new Map();
  reviewed.forEach(r => {
    const d = r.dept || "Other";
    if (!deptMap.has(d)) {
      deptMap.set(d, { sum: 0, count: 0 });
    }
    const current = deptMap.get(d);
    current.sum += r.overall;
    current.count += 1;
  });

  const deptAverages = Array.from(deptMap.entries())
    .map(([dept, data]) => ({
      dept,
      avg: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count
    }))
    .sort((a, b) => b.avg - a.avg);

  return {
    avgScore,
    topPerformers,
    needsAttention,
    reviewedPercent,
    ratingCounts,
    deptAverages
  };
}
