/**
 * Employee Management Store & Service
 * Handles persistence, unique auto-ID generation, validation, search, and retrieval.
 * Ready for future FastAPI + PostgreSQL REST integration.
 */

import { employeeData as initialMockEmployees } from '../data/mockData.js';

const STORAGE_KEY = "hrms_employees_v1";
const EVENT_NAME = "hrms_employees_updated";

// Standard Indian Departments
export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Human Resources",
  "Finance",
  "Quality Assurance",
  "Operations",
  "Marketing"
];

// Standard Indian Work Locations
export const WORK_LOCATIONS = [
  "Hyderabad",
  "Bengaluru",
  "Pune",
  "Mumbai",
  "Remote"
];

// Standard Indian Work Shifts
export const WORK_SHIFTS = [
  "General / Day Shift (09:00 - 18:00)",
  "Morning Shift (06:00 - 15:00)",
  "Evening Shift (14:00 - 23:00)",
  "Night Shift (22:00 - 07:00)",
  "Flexible / Hybrid Shift"
];

// Standard Employment Types
export const EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Intern"
];

// Standard Employment Statuses
export const EMPLOYMENT_STATUSES = [
  "Active",
  "Probation",
  "On Leave",
  "Inactive",
  "Resigned"
];

// Standard Indian Banks
export const INDIAN_BANKS = [
  "HDFC Bank",
  "State Bank of India (SBI)",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "IndusInd Bank",
  "Other"
];

// Helper to seed initial employee record if missing detailed attributes
function enrichSeedEmployee(emp) {
  const names = (emp.name || "").trim().split(" ");
  const firstName = names[0] || "Employee";
  const lastName = names.slice(1).join(" ") || "Staff";

  return {
    id: emp.id || "EMP-1000",
    name: emp.name || `${firstName} ${lastName}`,
    companyId: emp.companyId || "NEX-IND",
    firstName,
    middleName: "",
    lastName,
    gender: emp.gender || "Other",
    dob: emp.dob || "1994-06-15",
    bloodGroup: emp.bloodGroup || "O+",
    maritalStatus: emp.maritalStatus || "Single",
    personalEmail: emp.personalEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@personal.com`,
    mobile: emp.mobile || "9876543210",
    altMobile: emp.altMobile || "",
    aadhaar: emp.aadhaar || "XXXX-XXXX-8921",
    photoUrl: emp.photoUrl || null,

    // Employment
    joined: emp.joined || "15 Jan 2024",
    type: emp.type || "Full-Time",
    dept: emp.dept || "Engineering",
    role: emp.role || "Software Engineer",
    jobRole: emp.jobRole || emp.role || "Software Engineer",
    mgr: emp.mgr || "Executive Board",
    teamLead: emp.teamLead || emp.mgr || "Staff Lead",
    location: emp.location || "Hyderabad",
    shift: emp.shift || "General / Day Shift (09:00 - 18:00)",
    status: emp.status || "Active",
    email: emp.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nexora.in`,
    probation: emp.probation || "None",
    confirmationDate: emp.confirmationDate || emp.joined || "15 Jan 2024",

    // Address
    currentAddress: emp.currentAddress || {
      flat: "Flat 301, Tech Park Residency",
      street: "Hitec City Main Road, Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500081"
    },
    permanentAddress: emp.permanentAddress || {
      flat: "Flat 301, Tech Park Residency",
      street: "Hitec City Main Road, Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500081"
    },
    sameAddress: emp.sameAddress !== undefined ? emp.sameAddress : true,

    // Emergency Contact
    emergencyContact: emp.emergencyContact || {
      name: "Emergency Contact",
      relationship: "Parent",
      mobile: "9876543200",
      altPhone: ""
    },

    // Bank & Salary
    bank: emp.bank || {
      holderName: emp.name || `${firstName} ${lastName}`,
      bankName: "HDFC Bank",
      accountNumber: "50100234891234",
      ifsc: "HDFC0000542",
      branch: "Hitec City Branch, Hyderabad"
    },
    salary: emp.salary_breakdown || {
      basic: 65000,
      hra: 32500,
      da: 13000,
      conveyance: 5000,
      medical: 10000,
      special: 24500,
      pf: 7800,
      esi: 0,
      pt: 200,
      tds: 14000,
      gross: 150000,
      net: 128000
    },

    // Documents
    documents: emp.documents || [
      { id: "doc-1", type: "Resume", name: `${firstName}_Resume.pdf`, size: "284 KB", uploadedAt: "2024-01-10" },
      { id: "doc-2", type: "Aadhaar Document", name: "Aadhaar_Verified.pdf", size: "490 KB", uploadedAt: "2024-01-12" },
      { id: "doc-3", type: "Offer Letter", name: "Offer_Letter_Signed.pdf", size: "1.1 MB", uploadedAt: "2024-01-05" }
    ]
  };
}

// Loads all employees from localStorage, seeding from initial mock if empty
export function loadEmployees() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading employee store:", e);
  }

  // Seed with mock employees
  const seeded = initialMockEmployees.map(enrichSeedEmployee);
  saveEmployeesToStorage(seeded);
  return seeded;
}

// Saves array of employees to localStorage
export function saveEmployeesToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: list.length } }));
    }
  } catch (e) {
    console.error("Error writing employee store:", e);
  }
}

// Subscribes to employee store changes across windows/tabs
export function subscribeEmployeesStore(callback) {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = () => callback(loadEmployees());
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY) callback(loadEmployees());
  };

  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleUpdate);
    window.removeEventListener("storage", handleStorage);
  };
}

// Generates the next sequential unique Employee ID (e.g. EMP-1301)
export function generateNextEmployeeId() {
  const employees = loadEmployees();
  let maxNum = 1000;

  employees.forEach(emp => {
    const id = (emp.id || "").trim().toUpperCase();
    const match = id.match(/EMP-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  return `EMP-${maxNum + 1}`;
}

// Returns a single employee by Employee ID
export function getEmployeeById(id) {
  if (!id) return null;
  const list = loadEmployees();
  const cleanId = String(id).trim().toUpperCase();
  return list.find(e => (e.id || "").toUpperCase() === cleanId) || null;
}

// Calculates full salary breakdown
export function calculateSalaryBreakdown(input) {
  const basic = Math.max(0, Number(input.basic) || 0);
  const hra = Math.max(0, Number(input.hra) || 0);
  const da = Math.max(0, Number(input.da) || 0);
  const conveyance = Math.max(0, Number(input.conveyance) || 0);
  const medical = Math.max(0, Number(input.medical) || 0);
  const special = Math.max(0, Number(input.special) || 0);

  const gross = basic + hra + da + conveyance + medical + special;

  // PF: 12% of basic if provided or default 0
  const pf = input.pf !== undefined ? Math.max(0, Number(input.pf) || 0) : Math.round(basic * 0.12);
  // ESI: 0.75% of gross if gross <= 21,000 else 0
  const esi = input.esi !== undefined ? Math.max(0, Number(input.esi) || 0) : (gross <= 21000 && gross > 0 ? Math.round(gross * 0.0075) : 0);
  // Professional Tax: standard ₹200 for gross > 15,000
  const pt = input.pt !== undefined ? Math.max(0, Number(input.pt) || 0) : (gross > 15000 ? 200 : 0);
  const tds = Math.max(0, Number(input.tds) || 0);

  const deductions = pf + esi + pt + tds;
  const net = Math.max(0, gross - deductions);

  return {
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
    net
  };
}

// Validates employee form values
export function validateEmployeeForm(data, isEdit = false, originalId = null) {
  const errors = {};

  // 1. Mandatory Personal Info
  if (!data.firstName || !data.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  if (!data.lastName || !data.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  if (!data.gender) {
    errors.gender = "Gender selection is required";
  }
  if (!data.dob) {
    errors.dob = "Date of birth is required";
  }
  if (!data.mobile || !data.mobile.trim()) {
    errors.mobile = "Mobile number is required";
  } else if (!/^[6-9]\d{9}$/.test(data.mobile.replace(/\s+/g, ''))) {
    errors.mobile = "Enter a valid 10-digit Indian mobile number";
  }

  if (data.altMobile && data.altMobile.trim()) {
    if (!/^[6-9]\d{9}$/.test(data.altMobile.replace(/\s+/g, ''))) {
      errors.altMobile = "Enter a valid 10-digit alternate mobile number";
    }
  }

  if (data.personalEmail && data.personalEmail.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalEmail.trim())) {
      errors.personalEmail = "Enter a valid personal email address";
    }
  }

  // 2. Mandatory Employment Info
  if (!data.id || !data.id.trim()) {
    errors.id = "Employee ID is required";
  } else {
    const cleanId = data.id.trim().toUpperCase();
    const existingList = loadEmployees();
    const idTaken = existingList.some(e =>
      (e.id || "").toUpperCase() === cleanId && (!isEdit || (originalId && (e.id || "").toUpperCase() !== originalId.toUpperCase()))
    );
    if (idTaken) {
      errors.id = `Employee ID ${cleanId} already exists in directory`;
    }
  }

  if (!data.joined) {
    errors.joined = "Date of joining is required";
  }
  if (!data.dept) {
    errors.dept = "Department is required";
  }
  if (!data.role || !data.role.trim()) {
    errors.role = "Designation is required";
  }

  if (data.email && data.email.trim()) {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Enter a valid work email address";
    } else {
      const existingList = loadEmployees();
      const emailTaken = existingList.some(e =>
        (e.email || "").toLowerCase() === cleanEmail && (!isEdit || (originalId && (e.id || "").toUpperCase() !== originalId.toUpperCase()))
      );
      if (emailTaken) {
        errors.email = `Work email ${cleanEmail} is already registered to another employee`;
      }
    }
  }

  // 3. Address PIN Code Check
  if (data.currentAddress?.pincode && data.currentAddress.pincode.trim()) {
    if (!/^\d{6}$/.test(data.currentAddress.pincode.trim())) {
      errors.currentPincode = "Enter a valid 6-digit Indian PIN code";
    }
  }

  if (!data.sameAddress && data.permanentAddress?.pincode && data.permanentAddress.pincode.trim()) {
    if (!/^\d{6}$/.test(data.permanentAddress.pincode.trim())) {
      errors.permanentPincode = "Enter a valid 6-digit permanent PIN code";
    }
  }

  // 4. IFSC check if bank provided
  if (data.bank?.ifsc && data.bank.ifsc.trim()) {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bank.ifsc.trim().toUpperCase())) {
      errors.ifsc = "Enter a valid 11-character Indian IFSC code (e.g. HDFC0000542)";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Saves a new employee or updates an existing employee
export function saveEmployee(formData, isEdit = false, originalId = null) {
  const validation = validateEmployeeForm(formData, isEdit, originalId);
  if (!validation.isValid) {
    return { ok: false, errors: validation.errors };
  }

  const list = loadEmployees();
  const cleanId = formData.id.trim().toUpperCase();
  const fullName = `${formData.firstName.trim()}${formData.middleName ? ' ' + formData.middleName.trim() : ''} ${formData.lastName.trim()}`.trim();

  // Compute clean salary
  const salaryObj = calculateSalaryBreakdown(formData.salary || {});

  // Handle address sync
  const currentAddress = {
    flat: formData.currentAddress?.flat || "",
    street: formData.currentAddress?.street || "",
    city: formData.currentAddress?.city || "",
    state: formData.currentAddress?.state || "",
    country: formData.currentAddress?.country || "India",
    pincode: formData.currentAddress?.pincode || ""
  };

  const permanentAddress = formData.sameAddress
    ? { ...currentAddress }
    : {
        flat: formData.permanentAddress?.flat || "",
        street: formData.permanentAddress?.street || "",
        city: formData.permanentAddress?.city || "",
        state: formData.permanentAddress?.state || "",
        country: formData.permanentAddress?.country || "India",
        pincode: formData.permanentAddress?.pincode || ""
      };

  const employeeRecord = {
    ...formData,
    id: cleanId,
    name: fullName,
    companyId: formData.companyId || "NEX-IND",
    email: formData.email ? formData.email.trim().toLowerCase() : `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@nexora.in`,
    personalEmail: formData.personalEmail ? formData.personalEmail.trim().toLowerCase() : "",
    currentAddress,
    permanentAddress,
    sameAddress: !!formData.sameAddress,
    salary: salaryObj,
    salary_breakdown: salaryObj,
    documents: Array.isArray(formData.documents) ? formData.documents : []
  };

  let updatedList;
  if (isEdit) {
    const targetId = (originalId || cleanId).toUpperCase();
    updatedList = list.map(emp => (emp.id || "").toUpperCase() === targetId ? employeeRecord : emp);
  } else {
    updatedList = [employeeRecord, ...list];
  }

  saveEmployeesToStorage(updatedList);
  return { ok: true, employee: employeeRecord };
}

// Deletes an employee by ID
export function deleteEmployee(id) {
  if (!id) return false;
  const list = loadEmployees();
  const cleanId = String(id).trim().toUpperCase();
  const updatedList = list.filter(e => (e.id || "").toUpperCase() !== cleanId);
  saveEmployeesToStorage(updatedList);
  return true;
}
