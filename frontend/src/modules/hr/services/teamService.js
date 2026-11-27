/**
 * Team & Employee Management Service Layer
 * Hierarchy calculation, department rollups, experience metrics,
 * and role-based data filtering.
 */

import { employeeData as initialEmployees } from '../data/mockData.js';
import { SEEDED_DEPARTMENTS, formatExperience, getExperienceBand, formatTenureAtCompany } from '../config/teams.js';
import { getEffectiveDayRecords, getTodayDateKey } from './attendanceLog.js';
import { getMyAttendance } from './attendanceService.js';
import { formatAddress, formatEmergencyContact, renderValue } from '../utils/renderValue.js';
import { logEvent, diffObjects } from './auditService.js';

const CURRENT_EMPLOYEE_DATA_VERSION = "3.0";
const DATA_VERSION_KEY = "hrms_employees_data_version";
const EMPLOYEES_STORAGE_KEY = "hrms_employees_v1";
const DEPARTMENTS_STORAGE_KEY = "hrms_custom_departments_v1";
const EVENT_NAME = "hrms_team_service_updated";

// Helper: load stored employees or seed
export function loadAllEmployees() {
  try {
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw && storedVersion === CURRENT_EMPLOYEE_DATA_VERSION) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(e => e && (e.id || e.employeeId))) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[teamService] Error loading stored employees, resetting to seed data:", e);
  }

  // Also check if employeeStore has registered employees
  try {
    const storeRaw = localStorage.getItem("hrms_employee_directory_v1");
    if (storeRaw) {
      const parsed = JSON.parse(storeRaw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(e => e && (e.id || e.employeeId))) {
        return parsed;
      }
    }
  } catch (e) {}

  // Initialize with initialEmployees and stamp current version
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(initialEmployees));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_EMPLOYEE_DATA_VERSION);
  } catch (e) {}
  return initialEmployees;
}

export function saveAllEmployees(list) {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(list));
    notifyTeamStoreUpdated();
    return true;
  } catch (e) {
    return false;
  }
}

export function loadDepartmentsList() {
  let custom = [];
  try {
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (raw) custom = JSON.parse(raw);
  } catch (e) {}

  // Combine seeded + custom
  const combined = [...SEEDED_DEPARTMENTS];
  custom.forEach(c => {
    if (!combined.some(d => d.id === c.id || d.name.toLowerCase() === c.name.toLowerCase())) {
      combined.push(c);
    }
  });
  return combined;
}

export function saveDepartmentsList(list) {
  try {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(list));
    notifyTeamStoreUpdated();
    return true;
  } catch (e) {
    return false;
  }
}

export function notifyTeamStoreUpdated() {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch (e) {}
  }
}

export function subscribeTeamStore(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

// ------------------- ROLE & ACCESS CONTROL -------------------

export function isHRorAdmin(user) {
  if (!user) return false;
  const sys = (user.systemRole || "").toLowerCase();
  const r = (user.role || "").toLowerCase();
  return sys === "hr" || sys === "hr manager" || sys === "admin" || r.includes("hr") || r.includes("admin");
}

export function isManagerOrTL(user) {
  if (!user) return false;
  const sys = (user.systemRole || "").toLowerCase();
  const r = (user.role || "").toLowerCase();
  const des = (user.designation || "").toLowerCase();
  return (
    isHRorAdmin(user) ||
    sys === "manager" ||
    sys === "lead" ||
    r.includes("tl") ||
    r.includes("lead") ||
    r.includes("manager") ||
    des.includes("tl") ||
    des.includes("lead") ||
    des.includes("manager")
  );
}

// ------------------- TAB 1: DEPARTMENTS & EMPLOYEES -------------------

export function getDepartments() {
  const allEmployees = loadAllEmployees();
  const depts = loadDepartmentsList();

  let totalFreshers = 0;
  let totalExperienced = 0;
  let totalExpYears = 0;
  let activeCount = 0;
  let onLeaveCount = 0;

  const departmentCards = depts.map(dept => {
    const deptEmps = allEmployees.filter(e =>
      (e.dept || e.department || "").toLowerCase() === dept.name.toLowerCase() ||
      (e.dept || e.department || "").toLowerCase() === dept.id.toLowerCase()
    );

    let dFreshers = 0;
    let dJunior = 0;
    let dMid = 0;
    let dSenior = 0;

    deptEmps.forEach(emp => {
      const exp = Number(emp.totalExperienceYears) || 0;
      const isFresher = exp < 1 && (!emp.previousCompanies || emp.previousCompanies.length === 0);

      if (isFresher) dFreshers++;
      else if (exp < 3) dJunior++;
      else if (exp < 5) dMid++;
      else dSenior++;

      if (isFresher) totalFreshers++;
      else totalExperienced++;

      totalExpYears += exp;

      if (emp.status === "Active") activeCount++;
      if (emp.status === "On Leave") onLeaveCount++;
    });

    // Department Head
    const headEmp = deptEmps.find(e => e.isDepartmentHead) || deptEmps[0] || null;

    // Avatar stack (first 4)
    const avatarStack = deptEmps.slice(0, 4).map(e => ({
      id: e.id,
      name: e.name,
      avatarUrl: e.profileImage || null
    }));
    const extraCount = Math.max(0, deptEmps.length - 4);

    return {
      id: dept.id,
      name: dept.name,
      icon: dept.icon || "briefcase",
      totalEmployees: deptEmps.length,
      head: headEmp ? {
        id: headEmp.id,
        name: headEmp.name,
        designation: headEmp.designation,
        email: headEmp.email,
        avatarUrl: headEmp.profileImage || null
      } : null,
      avatarStack,
      extraCount,
      breakdown: {
        fresher: dFreshers,
        junior: dJunior,
        mid: dMid,
        senior: dSenior
      },
      employees: deptEmps
    };
  });

  const totalEmployees = allEmployees.length;
  const avgExpYears = totalEmployees > 0 ? (totalExpYears / totalEmployees).toFixed(1) : "0.0";

  return {
    departments: departmentCards,
    overallSummary: {
      totalDepartments: departmentCards.length,
      totalEmployees,
      freshers: totalFreshers,
      experienced: totalExperienced,
      avgExperience: avgExpYears,
      active: activeCount,
      onLeave: onLeaveCount
    }
  };
}

export function getDepartmentEmployees(departmentId, filters = {}, page = 1, pageSize = 12) {
  const allEmployees = loadAllEmployees();
  const depts = loadDepartmentsList();

  const clean = (departmentId || "").toLowerCase();
  const dept = depts.find(d =>
    d.id.toLowerCase() === clean ||
    d.name.toLowerCase() === clean
  );

  if (!dept) {
    return { notFound: true, departmentId };
  }

  // Filter employees belonging to this department
  const deptEmps = allEmployees.filter(e =>
    (e.dept || e.department || "").toLowerCase() === dept.name.toLowerCase() ||
    (e.dept || e.department || "").toLowerCase() === dept.id.toLowerCase()
  );

  // Compute stat cards for this department
  const todayKey = getTodayDateKey();
  const effectiveAttendance = getEffectiveDayRecords(todayKey);

  let freshersCount = 0;
  let experiencedCount = 0;
  let expSum = 0;
  let presentTodayCount = 0;
  let onLeaveCount = 0;

  deptEmps.forEach(emp => {
    const exp = Number(emp.totalExperienceYears) || 0;
    expSum += exp;
    const isFresher = exp < 1 && (!emp.previousCompanies || emp.previousCompanies.length === 0);
    if (isFresher) freshersCount++;
    else experiencedCount++;

    if (emp.status === "On Leave") onLeaveCount++;

    const attRec = effectiveAttendance[emp.id];
    if (attRec && Array.isArray(attRec.sessions) && attRec.sessions.length > 0) {
      presentTodayCount++;
    }
  });

  const avgExperience = deptEmps.length > 0 ? (expSum / deptEmps.length).toFixed(1) : "0.0";

  // Apply filters
  const {
    search = "",
    designation = "All",
    experienceBand = "All",
    employmentType = "All",
    workMode = "All",
    status = "All",
    sort = "name-asc"
  } = filters;

  const filtered = deptEmps.filter(emp => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (emp.name || "").toLowerCase().includes(q);
      const matchId = (emp.id || "").toLowerCase().includes(q);
      const matchEmail = (emp.email || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail) return false;
    }

    if (designation !== "All" && emp.designation !== designation) {
      return false;
    }

    if (experienceBand !== "All") {
      const band = getExperienceBand(emp.totalExperienceYears, emp.previousCompanies);
      if (band.id !== experienceBand) return false;
    }

    if (employmentType !== "All" && emp.employmentType !== employmentType) {
      return false;
    }

    if (workMode !== "All" && emp.workMode !== workMode) {
      return false;
    }

    if (status !== "All" && emp.status !== status) {
      return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
    if (sort === "name-desc") return (b.name || "").localeCompare(a.name || "");
    if (sort === "exp-desc") return (b.totalExperienceYears || 0) - (a.totalExperienceYears || 0);
    if (sort === "exp-asc") return (a.totalExperienceYears || 0) - (b.totalExperienceYears || 0);
    if (sort === "joining-desc") return new Date(b.joiningDate || 0) - new Date(a.joiningDate || 0);
    if (sort === "joining-asc") return new Date(a.joiningDate || 0) - new Date(b.joiningDate || 0);
    return 0;
  });

  // Pagination
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 12);
  const totalPages = Math.ceil(filtered.length / size) || 1;
  const paginated = filtered.slice((p - 1) * size, p * size);

  // Department Head
  const headEmp = deptEmps.find(e => e.isDepartmentHead) || deptEmps[0] || null;

  return {
    notFound: false,
    department: {
      id: dept.id,
      name: dept.name,
      icon: dept.icon || "briefcase",
      head: headEmp ? {
        id: headEmp.id,
        name: headEmp.name,
        designation: headEmp.designation,
        email: headEmp.email,
        avatarUrl: headEmp.profileImage || null
      } : null,
      totalCount: deptEmps.length
    },
    stats: {
      total: deptEmps.length,
      freshers: freshersCount,
      experienced: experiencedCount,
      avgExperience,
      presentToday: presentTodayCount,
      onLeave: onLeaveCount
    },
    employees: paginated,
    totalFiltered: filtered.length,
    page: p,
    pageSize: size,
    totalPages
  };
}

// ------------------- TAB 2: MY TEAM (HIERARCHY) -------------------

export function getMainTLs() {
  const allEmployees = loadAllEmployees();

  // Find Main TLs: role === "MAIN_TL" or reportingToId === null
  const mainTls = allEmployees.filter(e =>
    e.role === "MAIN_TL" || e.reportingToId === null || e.reportingToId === ""
  );

  return mainTls.map(tl => {
    const directReports = allEmployees.filter(e => e.reportingToId === tl.id);
    const directTls = directReports.filter(e => e.role === "TL");
    const allSubordinates = getRecursiveSubordinates(tl.id, allEmployees);

    return {
      ...tl,
      directTlsCount: directTls.length,
      totalEmployeesCount: allSubordinates.length,
      experienceFormatted: formatExperience(tl.totalExperienceYears, tl.previousCompanies),
      tenureFormatted: formatTenureAtCompany(tl.joiningDate),
      directTls
    };
  });
}

// Recursive subordinates collector
export function getRecursiveSubordinates(parentId, allEmps = loadAllEmployees()) {
  let result = [];
  const direct = allEmps.filter(e => e.reportingToId === parentId);
  result = result.concat(direct);
  direct.forEach(d => {
    result = result.concat(getRecursiveSubordinates(d.id, allEmps));
  });
  return result;
}

// Return direct reports for a given TL (both sub-TLs and employees)
export function getDirectReports(tlId) {
  const allEmployees = loadAllEmployees();
  const tl = allEmployees.find(e => e.id === tlId);

  if (!tl) return { notFound: true, tlId };

  const direct = allEmployees.filter(e => e.reportingToId === tlId);
  const subTls = direct.filter(e => e.role === "TL");
  const employees = direct.filter(e => e.role !== "TL");

  return {
    notFound: false,
    tl,
    directReports: direct,
    subTls,
    employees,
    totalCount: direct.length
  };
}

// Full Team Tree structure for Org Chart
export function getTeamTree(mainTlId) {
  const allEmployees = loadAllEmployees();
  const root = allEmployees.find(e => e.id === mainTlId) || allEmployees.find(e => e.role === "MAIN_TL") || allEmployees[0];

  function buildNode(emp) {
    const children = allEmployees.filter(e => e.reportingToId === emp.id);
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      designation: emp.designation,
      dept: emp.dept,
      avatarUrl: emp.profileImage || null,
      status: emp.status,
      experience: formatExperience(emp.totalExperienceYears, emp.previousCompanies),
      children: children.map(buildNode)
    };
  }

  return root ? buildNode(root) : null;
}

// ------------------- EMPLOYEE DETAIL PAGE & PRIVACY GUARD -------------------

export function normalizeEmployeeDetail(emp, isHr = false, hasFullAccess = false) {
  if (!emp) return null;

  const id = String(emp.id || emp.employeeId || "").trim();
  const name = typeof emp.name === "object" ? "Employee" : String(emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee");
  const dept = typeof emp.dept === "object" ? (emp.dept?.name || "Engineering") : String(emp.dept || emp.department || "Engineering");
  const designation = typeof emp.designation === "object" ? (emp.designation?.title || emp.designation?.name || "Staff Member") : String(emp.designation || "Staff Member");
  const role = typeof emp.role === "object" ? "EMPLOYEE" : String(emp.role || "EMPLOYEE");
  const status = typeof emp.status === "object" ? "Active" : String(emp.status || "Active");
  const mgr = typeof emp.mgr === "object" ? (emp.mgr?.name || "Executive Board") : String(emp.mgr || "Executive Board");

  // Address normalization - guaranteed to be formatted string
  const formattedAddress = hasFullAccess ? formatAddress(emp.address, "Confidential (Private)") : "Confidential (Private)";

  // Emergency contact normalization - guaranteed to be formatted string
  const formattedEmergency = hasFullAccess ? formatEmergencyContact(emp.emergencyContact, "Confidential") : "Confidential";

  // Phone and personal details
  const phone = hasFullAccess ? String(emp.phone || "+91 98765 43210") : "+91 ••••• •••••";
  const dob = hasFullAccess ? String(emp.dob || "--") : "--";

  // Salary normalization: calculate breakdown and guarantee salary is ALWAYS a string
  // Salary is confidential: show it ONLY to HR/Admin, behind the existing "Unlock Confidential Salaries" flow.
  // For other roles show "Restricted" and never put the salary object in the rendered output.
  let salaryString = "Restricted";
  let salaryBreakdown = null;

  if (isHr) {
    if (emp.salary && typeof emp.salary === "object") {
      // emp.salary is an object with component keys { basic, hra, da, ... }
      const s = emp.salary;
      const basic = Number(s.basic) || 65000;
      const hra = Number(s.hra) || Math.round(basic * 0.50);
      const da = Number(s.da) || Math.round(basic * 0.10);
      const conveyance = Number(s.conveyance) || 1600;
      const medical = Number(s.medical) || 1250;
      const special = Number(s.special) || 24500;
      const pf = Number(s.pf) || Math.round(basic * 0.12);
      const esi = Number(s.esi) || 0;
      const pt = Number(s.pt) || 200;
      const gross = Number(s.gross) || (basic + hra + da + conveyance + medical + special);
      const tds = Number(s.tds) || Math.round(gross * 0.065);
      const deductions = pf + esi + pt + tds;
      const net = Number(s.net) || (gross - deductions);
      const annualCtc = gross * 12;
      const ctcLakhs = (annualCtc / 100000).toFixed(2);
      salaryString = `₹${ctcLakhs} L`;

      salaryBreakdown = {
        basic,
        hra,
        da,
        conveyance,
        medical,
        special,
        pf,
        esi,
        pt,
        tds,
        gross,
        deductions,
        net,
        annualCtc,
        annualCtcFormatted: salaryString
      };
    } else if (typeof emp.salary === "string" && emp.salary !== "Confidential" && emp.salary !== "Restricted") {
      salaryString = emp.salary;
      // Derive standard Indian compensation components from annual CTC string e.g. "₹38.50 L"
      const match = emp.salary.match(/₹?([\d.]+)\s*L/);
      let annualCtc = 1800000;
      if (match) {
        annualCtc = Math.round(parseFloat(match[1]) * 100000);
      }
      const monthlyGross = Math.round(annualCtc / 12);
      const basic = Math.round(monthlyGross * 0.40);
      const hra = Math.round(basic * 0.50);
      const da = Math.round(basic * 0.10);
      const conveyance = 1600;
      const medical = 1250;
      const special = Math.max(0, monthlyGross - (basic + hra + da + conveyance + medical));
      const pf = Math.round(basic * 0.12);
      const esi = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0;
      const pt = 200;
      const tds = Math.round(monthlyGross * 0.065);
      const deductions = pf + esi + pt + tds;
      const net = monthlyGross - deductions;

      salaryBreakdown = {
        basic,
        hra,
        da,
        conveyance,
        medical,
        special,
        pf,
        esi,
        pt,
        tds,
        gross: monthlyGross,
        deductions,
        net,
        annualCtc,
        annualCtcFormatted: salaryString
      };
    } else {
      salaryString = "₹18.00 L";
      salaryBreakdown = {
        basic: 60000,
        hra: 30000,
        da: 6000,
        conveyance: 1600,
        medical: 1250,
        special: 51150,
        pf: 7200,
        esi: 0,
        pt: 200,
        tds: 9750,
        gross: 150000,
        deductions: 17150,
        net: 132850,
        annualCtc: 1800000,
        annualCtcFormatted: "₹18.00 L"
      };
    }
  }

  // Skills
  const skills = Array.isArray(emp.skills)
    ? emp.skills.map(s => typeof s === "object" ? (s.name || s.title || String(s)) : String(s))
    : [];

  // Certifications list with explicit fields
  let certificationsList = [];
  if (Array.isArray(emp.certifications)) {
    certificationsList = emp.certifications.map(c => {
      if (typeof c === "object" && c !== null) {
        return {
          name: String(c.name || c.title || c.certificate || "Certification"),
          issuer: String(c.issuer || c.organization || c.by || "")
        };
      }
      return { name: String(c), issuer: "" };
    });
  } else if (emp.certifications && typeof emp.certifications === "object") {
    certificationsList = [{
      name: String(emp.certifications.name || emp.certifications.title || "Certification"),
      issuer: String(emp.certifications.issuer || emp.certifications.organization || "")
    }];
  } else if (typeof emp.certifications === "string" && emp.certifications.trim()) {
    certificationsList = [{ name: emp.certifications.trim(), issuer: "" }];
  }

  // Previous companies timeline list with explicit fields
  const previousCompanies = Array.isArray(emp.previousCompanies)
    ? emp.previousCompanies.map(c => ({
        company: typeof c === "object" ? (c.company || c.name || "-") : String(c),
        role: typeof c === "object" ? (c.role || c.designation || "-") : "-",
        duration: typeof c === "object" ? (c.duration || "-") : "-"
      }))
    : [];

  // Education list with explicit fields
  let educationList = [];
  if (Array.isArray(emp.education)) {
    educationList = emp.education.map(ed => {
      if (typeof ed === "object" && ed !== null) {
        return {
          degree: String(ed.degree || ed.qualification || ed.title || "Degree"),
          institution: String(ed.institution || ed.university || ed.college || "-"),
          year: String(ed.year || ed.passYear || "-")
        };
      }
      const parts = String(ed).split(" - ");
      return { degree: parts[0] || String(ed), institution: parts[1] || "-", year: "-" };
    });
  } else if (emp.education && typeof emp.education === "object") {
    educationList = [{
      degree: String(emp.education.degree || emp.education.qualification || emp.education.title || "Degree"),
      institution: String(emp.education.institution || emp.education.university || emp.education.college || "-"),
      year: String(emp.education.year || emp.education.passYear || "-")
    }];
  } else if (typeof emp.education === "string" && emp.education.trim()) {
    const parts = emp.education.trim().split(" - ");
    educationList = [{
      degree: parts[0] || emp.education.trim(),
      institution: parts[1] || "-",
      year: "-"
    }];
  } else {
    educationList = [{ degree: "Bachelor's Degree", institution: "Recognized University", year: "-" }];
  }

  const primaryEducation = educationList[0]?.degree ? `${educationList[0].degree}${educationList[0].institution !== "-" ? ` - ${educationList[0].institution}` : ""}` : "Bachelor's Degree";

  return {
    ...emp,
    id,
    employeeId: id,
    name,
    email: String(emp.email || ""),
    phone,
    dob,
    dept,
    department: dept,
    designation,
    role,
    status,
    mgr,
    employmentType: String(emp.employmentType || "Full-Time"),
    workMode: String(emp.workMode || "Office"),
    probationStatus: String(emp.probationStatus || "Confirmed"),
    joiningDate: String(emp.joiningDate || emp.joined || "2021-03-12"),
    location: String(emp.location || "Hyderabad HQ"),
    gender: String(emp.gender || "Not specified"),
    bloodGroup: String(emp.bloodGroup || "O+"),
    totalExperienceYears: Number(emp.totalExperienceYears) || 3,
    address: formattedAddress,
    emergencyContact: formattedEmergency,
    salary: salaryString, // ALWAYS a safe primitive string
    salaryBreakdown,      // Detailed component object for confidential table (HR only)
    skills,
    certifications: certificationsList.map(c => c.name),
    certificationsList,
    previousCompanies,
    education: primaryEducation,
    educationList,
    canViewDocuments: hasFullAccess
  };
}

export function getEmployeeDetail(employeeId, viewer) {
  const allEmployees = loadAllEmployees();
  const emp = allEmployees.find(e => {
    const eid = String(e.id || e.employeeId || "").trim().toLowerCase();
    const target = String(employeeId || "").trim().toLowerCase();
    return eid === target;
  });

  if (!emp) {
    return { notFound: true, employeeId };
  }

  // Access & Privacy Check
  const isHr = isHRorAdmin(viewer);
  const isSelf = String(viewer?.employeeId || viewer?.id || "").trim().toLowerCase() === String(emp.id || emp.employeeId || "").trim().toLowerCase();
  const isDirectManager = String(emp.reportingToId || "").trim().toLowerCase() === String(viewer?.employeeId || viewer?.id || "").trim().toLowerCase();
  const hasFullAccess = isHr || isSelf || isDirectManager;

  // Normalized safe data (strictly restricting salary to HR/Admin)
  const safeData = normalizeEmployeeDetail(emp, isHr, hasFullAccess);

  // Hierarchy chain up to Main TL
  const hierarchyChain = [];
  let currentParentId = emp.reportingToId;
  const visited = new Set([emp.id]);

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);
    const parent = allEmployees.find(e => e.id === currentParentId);
    if (parent) {
      hierarchyChain.unshift({
        id: String(parent.id),
        name: typeof parent.name === "object" ? "Lead" : String(parent.name || "Lead"),
        role: typeof parent.role === "object" ? "TL" : String(parent.role || "TL"),
        designation: typeof parent.designation === "object" ? (parent.designation?.title || parent.designation?.name || "Lead") : String(parent.designation || "Lead")
      });
      currentParentId = parent.reportingToId;
    } else {
      break;
    }
  }

  // Reporting TL info
  const reportingRaw = allEmployees.find(e => e.id === emp.reportingToId) || null;
  const reportingTL = reportingRaw ? {
    id: String(reportingRaw.id),
    name: typeof reportingRaw.name === "object" ? "Lead" : String(reportingRaw.name || "Lead"),
    designation: typeof reportingRaw.designation === "object" ? (reportingRaw.designation?.title || "Lead") : String(reportingRaw.designation || "Lead")
  } : null;

  // Monthly Attendance summary
  let attendanceSummary = null;
  try {
    const today = new Date();
    attendanceSummary = getMyAttendance({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      user: safeData
    });
  } catch (e) {}

  return {
    notFound: false,
    employee: safeData,
    hierarchyChain,
    reportingTL,
    attendanceSummary,
    hasFullAccess,
    isHr
  };
}

// ------------------- HIERARCHY VALIDATION & MUTATIONS -------------------

export function validateHierarchyNoCycles(employeeId, targetReportingToId, allEmps = loadAllEmployees()) {
  if (!targetReportingToId) return true;
  if (employeeId === targetReportingToId) return false;

  let curr = targetReportingToId;
  const visited = new Set([employeeId]);

  while (curr) {
    if (visited.has(curr)) return false; // Cycle detected!
    visited.add(curr);
    const parent = allEmps.find(e => e.id === curr);
    curr = parent?.reportingToId || null;
  }
  return true;
}

export function addEmployee(data) {
  const list = loadAllEmployees();
  const nextIdNum = 1000 + list.length + 1;
  const newId = `EMP-${nextIdNum}`;

  const reportingToId = data.reportingToId || null;
  if (!validateHierarchyNoCycles(newId, reportingToId, list)) {
    return { ok: false, error: "Invalid reporting hierarchy: cycle detected." };
  }

  const newEmp = {
    id: newId,
    employeeId: newId,
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || "New Employee",
    firstName: data.firstName || "New",
    lastName: data.lastName || "Employee",
    email: data.email || `${newId.toLowerCase()}@nexora.in`,
    phone: data.phone || "+91 98765 00000",
    companyId: data.companyId || "NEX-IND",
    dept: data.department || "Engineering",
    department: data.department || "Engineering",
    designation: data.designation || "Software Engineer",
    role: data.role || "EMPLOYEE",
    systemRole: data.role === "MAIN_TL" || data.role === "TL" ? "Manager" : "Employee",
    reportingToId,
    mgr: data.mgr || "Aarav Sharma",
    isDepartmentHead: Boolean(data.isDepartmentHead),
    joined: data.joiningDate || "01 Nov 2026",
    joiningDate: data.joiningDate || "2026-11-01",
    totalExperienceYears: Number(data.totalExperienceYears) || 0,
    previousCompanies: Array.isArray(data.previousCompanies) ? data.previousCompanies : [],
    employmentType: data.employmentType || "Full-Time",
    workMode: data.workMode || "Office",
    status: data.status || "Active",
    salary: data.salary || "₹15.00 L",
    skills: Array.isArray(data.skills) ? data.skills : ["General"],
    education: data.education || "Bachelor's Degree",
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    dob: data.dob || "1998-01-01",
    gender: data.gender || "Other",
    bloodGroup: data.bloodGroup || "O+",
    address: data.address || "Hyderabad, Telangana",
    emergencyContact: data.emergencyContact || "--",
    probationStatus: "In Probation",
    confirmationDate: "--",
    location: data.location || "Hyderabad",
    profileImage: data.profileImage || null
  };

  list.push(newEmp);
  saveAllEmployees(list);

  return { ok: true, employee: newEmp, message: `Added ${newEmp.name} (${newId}) successfully.` };
}

export function updateEmployee(employeeId, updates) {
  const list = loadAllEmployees();
  const idx = list.findIndex(e => e.id === employeeId || e.employeeId === employeeId);
  if (idx === -1) return { ok: false, error: "Employee not found." };

  const targetReportingToId = updates.reportingToId !== undefined ? updates.reportingToId : list[idx].reportingToId;
  if (!validateHierarchyNoCycles(employeeId, targetReportingToId, list)) {
    return { ok: false, error: "Cannot set reporting line: cycle detected in hierarchy." };
  }

  const updated = {
    ...list[idx],
    ...updates,
    name: updates.firstName || updates.lastName
      ? `${updates.firstName || list[idx].firstName || ''} ${updates.lastName || list[idx].lastName || ''}`.trim()
      : list[idx].name
  };

  const diffs = diffObjects(list[idx], updated);
  list[idx] = updated;
  saveAllEmployees(list);

  try {
    logEvent({
      action: "edit_employee",
      category: "Data changes",
      module: "Teams",
      description: `Updated profile & records for ${updated.name} (${updated.id})`,
      target: { type: "Employee", id: updated.id, name: updated.name },
      metadata: { diff: diffs },
      status: "Success"
    });
  } catch (e) {}

  return { ok: true, employee: updated, message: `Updated details for ${updated.name}.` };
}

export function deactivateEmployee(employeeId) {
  const list = loadAllEmployees();
  const emp = list.find(e => e.id === employeeId || e.employeeId === employeeId);
  if (!emp) return { ok: false, error: "Employee not found." };

  emp.status = "Inactive";
  saveAllEmployees(list);

  try {
    logEvent({
      action: "deactivate_employee",
      category: "Data changes",
      module: "Teams",
      description: `Deactivated employee record for ${emp.name} (${emp.id})`,
      target: { type: "Employee", id: emp.id, name: emp.name },
      status: "Success",
      isSensitive: true
    });
  } catch (e) {}

  return { ok: true, message: `Deactivated ${emp.name}.` };
}

export function deleteEmployee(employeeId, currentUser) {
  const list = loadAllEmployees();
  const idx = list.findIndex(e => e.id === employeeId || e.employeeId === employeeId);
  if (idx === -1) return { ok: false, error: "Employee not found." };

  const emp = list[idx];
  const nextList = list.filter((_, i) => i !== idx);

  // Re-parent any direct reports to prevent orphans in hierarchy
  const fallbackManagerId = "EMP-1042"; // Aarav Sharma
  nextList.forEach(e => {
    if (e.reportingToId === emp.id || e.reportingToId === emp.employeeId) {
      e.reportingToId = fallbackManagerId;
      e.mgr = "Aarav Sharma";
    }
  });

  saveAllEmployees(nextList);

  try {
    logEvent({
      action: "delete_employee",
      category: "Data changes",
      module: "Teams",
      description: `Deleted employee record for ${emp.name} (${emp.id})`,
      target: { type: "Employee", id: emp.id, name: emp.name },
      user: currentUser,
      status: "Success",
      isSensitive: true
    });
  } catch (e) {}

  return { ok: true, employee: emp, message: `Permanently removed employee record for ${emp.name}.` };
}

export function addDepartment(name, icon = "briefcase") {
  if (!name || !name.trim()) return { ok: false, error: "Department name is required." };
  const list = loadDepartmentsList();
  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (list.some(d => d.id === slug || d.name.toLowerCase() === cleanName.toLowerCase())) {
    return { ok: false, error: "A department with this name already exists." };
  }

  const newDept = { id: slug, name: cleanName, icon };
  list.push(newDept);
  saveDepartmentsList(list);

  return { ok: true, department: newDept, message: `Department "${cleanName}" created.` };
}
