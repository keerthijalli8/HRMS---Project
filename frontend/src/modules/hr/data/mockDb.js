/**
 * Central Single Source of Truth Mock Database (mockDb.js)
 * Enterprise HRMS India - Nexora Technologies
 * 
 * Provides canonical data for:
 * - Company & Location configuration (Nexora Technologies, NEX-IND, Hyderabad, Telangana)
 * - Telangana State Holidays 2026
 * - Exactly 12 Canonical Employees (consistent IDs, names, roles, departments)
 * - Computed metrics (Headcount = 12, Active = 11, On Leave = 1, Attrition = 8.3%)
 * - 8 Onboarding & Verification Candidates
 * - Telangana Professional Tax (PT) Slabs
 * - Dynamic Date & Working Day calculations up to today in Asia/Kolkata
 */

// ==========================================
// 1. COMPANY & LOCATION CONFIGURATION
// ==========================================
export const COMPANY_CONFIG = {
  id: "NEX-IND",
  code: "NEX-HQ-HYD",
  name: "Nexora Technologies",
  legalName: "Nexora Technologies India Private Limited",
  brandName: "Nexora",
  cin: "U72200TG2021PTC148902",
  pan: "AABCN4821K",
  tan: "HYDN12840D",
  gstin: "36AABCN4821K1ZM",
  epfRegistration: "AP/HYD/0048291/000",
  esicRegistration: "52000482910000999",
  location: "Hyderabad, Telangana",
  city: "Hyderabad",
  state: "Telangana",
  stateCode: "36",
  pincode: "500081",
  country: "India",
  address: "Building 9, Mindspace Cyberabad, HITEC City, Madhapur, Hyderabad, Telangana 500081",
  domain: "nexora.in",
  supportEmail: "hr@nexora.in",
  payrollEmail: "payroll@nexora.in",
  phone: "+91 40 6820 4000",
  currency: "INR",
  currencySymbol: "₹",
  timeZone: "Asia/Kolkata",
  // Telangana Professional Tax Slab 2026
  ptSlab: {
    state: "Telangana",
    slabs: [
      { min: 0, max: 15000, monthlyTax: 0, label: "Up to ₹15,000: Nil" },
      { min: 15001, max: 20000, monthlyTax: 150, label: "₹15,001 - ₹20,000: ₹150 / Month" },
      { min: 20001, max: Infinity, monthlyTax: 200, label: "Above ₹20,000: ₹200 / Month" }
    ],
    standardMonthly: 200,
    description: "Telangana State PT Slab: ₹200/mo (Salary > ₹20,000)"
  }
};

// ==========================================
// 2. OFFICIAL TELANGANA STATE HOLIDAYS 2026
// ==========================================
export const TELANGANA_HOLIDAYS_2026 = [
  {
    id: "HOL-2026-001",
    name: "Republic Day",
    date: "2026-01-26",
    dayOfWeek: "Monday",
    type: "National",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "Honoring the adoption of the Constitution of India in 1950. Mandatory paid holiday."
  },
  {
    id: "HOL-2026-002",
    name: "Ugadi / Telugu New Year",
    date: "2026-03-19",
    dayOfWeek: "Thursday",
    type: "Regional",
    category: "State Special (Telangana)",
    location: "Telangana",
    isOptional: false,
    description: "New Year's Day according to the Hindu lunisolar calendar for Telangana."
  },
  {
    id: "HOL-2026-003",
    name: "Eid-ul-Fitr (Ramzan)",
    date: "2026-03-20",
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "Islamic celebration marking the conclusion of the holy month of fasting."
  },
  {
    id: "HOL-2026-004",
    name: "May Day / Workers' Day",
    date: "2026-05-01",
    dayOfWeek: "Friday",
    type: "National",
    category: "Public Holiday",
    location: "Telangana",
    isOptional: false,
    description: "International Labor Day acknowledging the contribution and rights of workers."
  },
  {
    id: "HOL-2026-005",
    name: "Telangana Formation Day",
    date: "2026-06-02",
    dayOfWeek: "Tuesday",
    type: "Regional",
    category: "State Special (Telangana)",
    location: "Telangana",
    isOptional: false,
    description: "Official Telangana statehood celebration commemorating the formation of Telangana in 2014."
  },
  {
    id: "HOL-2026-006",
    name: "Independence Day",
    date: "2026-08-15",
    dayOfWeek: "Saturday",
    type: "National",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "National celebration of India's independence from British rule on 15 August 1947."
  },
  {
    id: "HOL-2026-007",
    name: "Mahatma Gandhi Jayanti",
    date: "2026-10-02",
    dayOfWeek: "Friday",
    type: "National",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "National celebration commemorating the birth anniversary of Mahatma Gandhi."
  },
  {
    id: "HOL-2026-008",
    name: "Dussehra (Vijaya Dashami)",
    date: "2026-10-20",
    dayOfWeek: "Tuesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "Celebration of the victory of good over evil, celebrated with Bathukamma in Telangana."
  },
  {
    id: "HOL-2026-009",
    name: "Diwali (Deepavali)",
    date: "2026-11-08",
    dayOfWeek: "Sunday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "The Festival of Lights celebrating prosperity, wisdom, and festive harmony."
  },
  {
    id: "HOL-2026-010",
    name: "Guru Nanak Jayanti",
    date: "2026-11-24",
    dayOfWeek: "Tuesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "Celebration of the birth anniversary of the first Sikh Guru, Guru Nanak Dev Ji."
  },
  {
    id: "HOL-2026-011",
    name: "Christmas Day",
    date: "2026-12-25",
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "Telangana",
    isOptional: false,
    description: "Celebration of the birth of Jesus Christ, mandatory paid public holiday."
  }
];

// ==========================================
// 3. EXACTLY 12 CANONICAL EMPLOYEES
// ==========================================
export const CANONICAL_EMPLOYEES_12 = [
  {
    id: "EMP-1042",
    employeeId: "EMP-1042",
    name: "Aarav Sharma",
    firstName: "Aarav",
    lastName: "Sharma",
    email: "aarav.sharma@nexora.in",
    phone: "+91 98765 43210",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Engineering",
    department: "Engineering",
    designation: "Staff Architect & Engineering Lead",
    role: "MAIN_TL",
    systemRole: "Manager",
    reportingToId: null,
    mgr: "Executive Board",
    isDepartmentHead: true,
    joined: "12 Mar 2021",
    joiningDate: "2021-03-12",
    totalExperienceYears: 10.5,
    previousCompanies: [
      { company: "Thoughtworks India", role: "Principal Architect", duration: "5 yrs" },
      { company: "Persistent Systems", role: "Sr Software Engineer", duration: "3 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹38.50 L",
    grossMonthly: 320833,
    netMonthly: 266433,
    tdsMonthly: 52400,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["System Architecture", "Cloud Infrastructure", "Kubernetes", "Node.js", "Microservices"],
    education: "M.Tech in Computer Science - IIT Bombay",
    certifications: ["AWS Certified Solutions Architect - Professional", "CKA Kubernetes Administrator"],
    dob: "1989-05-14",
    gender: "Male",
    bloodGroup: "O+",
    address: "Plot 42, Jubilee Hills, Hyderabad, Telangana 500033",
    emergencyContact: "+91 98765 43219 (Pooja Sharma - Spouse)",
    probationStatus: "Confirmed",
    confirmationDate: "12 Sep 2021",
    location: "Hyderabad"
  },
  {
    id: "EMP-1001",
    employeeId: "EMP-1001",
    name: "Meera Reddy",
    firstName: "Meera",
    lastName: "Reddy",
    email: "meera.reddy@nexora.in",
    phone: "+91 98765 11001",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Human Resources",
    department: "Human Resources",
    designation: "HR Manager",
    role: "TL",
    systemRole: "HR Manager",
    reportingToId: "EMP-1042",
    mgr: "Aarav Sharma",
    isDepartmentHead: true,
    joined: "01 Feb 2021",
    joiningDate: "2021-02-01",
    totalExperienceYears: 7.2,
    previousCompanies: [
      { company: "Wipro HR Solutions", role: "Assistant Manager HR", duration: "4 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹28.00 L",
    grossMonthly: 233333,
    netMonthly: 196833,
    tdsMonthly: 34500,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Strategic HR", "Talent Acquisition", "Employee Relations", "Compensation & Benefits"],
    education: "MBA in HR Management - XLRI Jamshedpur",
    certifications: ["SHRM Senior Certified Professional (SHRM-SCP)"],
    dob: "1992-08-20",
    gender: "Female",
    bloodGroup: "B+",
    address: "Flat 302, Gachibowli Heights, Hyderabad, Telangana 500032",
    emergencyContact: "+91 98765 11009 (Ramesh Reddy - Father)",
    probationStatus: "Confirmed",
    confirmationDate: "01 Aug 2021",
    location: "Hyderabad"
  },
  {
    id: "EMP-1102",
    employeeId: "EMP-1102",
    name: "Rohan Varma",
    firstName: "Rohan",
    lastName: "Varma",
    email: "rohan.varma@nexora.in",
    phone: "+91 98765 11102",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Design",
    department: "Design",
    designation: "Lead Product Designer",
    role: "TL",
    systemRole: "Manager",
    reportingToId: "EMP-1042",
    mgr: "Aarav Sharma",
    isDepartmentHead: true,
    joined: "04 Aug 2022",
    joiningDate: "2022-08-04",
    totalExperienceYears: 6.0,
    previousCompanies: [
      { company: "Zomato Design", role: "Senior UI/UX Designer", duration: "3.5 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Hybrid",
    status: "Active",
    salary: "₹24.00 L",
    grossMonthly: 200000,
    netMonthly: 170000,
    tdsMonthly: 28000,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Design Systems", "Figma", "User Research", "Interaction Design", "Prototyping"],
    education: "B.Des in Product Design - National Institute of Design (NID)",
    certifications: ["Nielsen Norman UX Master Certified"],
    dob: "1993-11-03",
    gender: "Male",
    bloodGroup: "A+",
    address: "H.No 12, Kondapur Greenwoods, Hyderabad, Telangana 500084",
    emergencyContact: "+91 98765 11109 (Sunita Varma - Mother)",
    probationStatus: "Confirmed",
    confirmationDate: "04 Feb 2023",
    location: "Hyderabad"
  },
  {
    id: "EMP-1301",
    employeeId: "EMP-1301",
    name: "Vikram Malhotra",
    firstName: "Vikram",
    lastName: "Malhotra",
    email: "vikram.malhotra@nexora.in",
    phone: "+91 98765 11301",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Sales",
    department: "Sales",
    designation: "Enterprise Sales Lead",
    role: "TL",
    systemRole: "Manager",
    reportingToId: "EMP-1042",
    mgr: "Aarav Sharma",
    isDepartmentHead: true,
    joined: "10 Jan 2022",
    joiningDate: "2022-01-10",
    totalExperienceYears: 8.5,
    previousCompanies: [
      { company: "Salesforce India", role: "Account Executive", duration: "4 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹26.50 L",
    grossMonthly: 220833,
    netMonthly: 186433,
    tdsMonthly: 32400,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Enterprise B2B Sales", "Deal Structuring", "Account Strategy", "CRM Management"],
    education: "MBA Marketing - IIM Indore",
    certifications: ["HubSpot Enterprise Sales Certified"],
    dob: "1990-03-18",
    gender: "Male",
    bloodGroup: "AB+",
    address: "Road No 10, Banjara Hills, Hyderabad, Telangana 500034",
    emergencyContact: "+91 98765 11309 (Kavya Malhotra - Spouse)",
    probationStatus: "Confirmed",
    confirmationDate: "10 Jul 2022",
    location: "Hyderabad"
  },
  {
    id: "EMP-1234",
    employeeId: "EMP-1234",
    name: "Devansh Mehta",
    firstName: "Devansh",
    lastName: "Mehta",
    email: "devansh.mehta@nexora.in",
    phone: "+91 98765 11234",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Engineering",
    department: "Engineering",
    designation: "Senior Frontend Engineer",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1042",
    mgr: "Aarav Sharma",
    isDepartmentHead: false,
    joined: "01 Jul 2024",
    joiningDate: "2024-07-01",
    totalExperienceYears: 3.5,
    previousCompanies: [
      { company: "Swiggy Labs", role: "Frontend Developer", duration: "2 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹14.50 L",
    grossMonthly: 120833,
    netMonthly: 106633,
    tdsMonthly: 12200,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["React", "TypeScript", "Tailwind CSS", "Redux", "Vite", "KaTeX"],
    education: "B.Tech in Information Technology - NIT Warangal",
    certifications: ["Meta Certified Frontend Developer"],
    dob: "1997-09-15",
    gender: "Male",
    bloodGroup: "O+",
    address: "Flat 504, Madhapur Towers, Hyderabad, Telangana 500081",
    emergencyContact: "+91 98765 11239 (Alok Mehta - Brother)",
    probationStatus: "Confirmed",
    confirmationDate: "01 Jan 2025",
    location: "Hyderabad"
  },
  {
    id: "EMP-1145",
    employeeId: "EMP-1145",
    name: "Sneha Nair",
    firstName: "Sneha",
    lastName: "Nair",
    email: "sneha.nair@nexora.in",
    phone: "+91 98765 11145",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Engineering",
    department: "Engineering",
    designation: "DevOps Specialist",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1042",
    mgr: "Aarav Sharma",
    isDepartmentHead: false,
    joined: "19 Nov 2023",
    joiningDate: "2023-11-19",
    totalExperienceYears: 5.2,
    previousCompanies: [
      { company: "TCS Cloud Practice", role: "Cloud Systems Engineer", duration: "3.5 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "WFH",
    status: "On Leave", // Exactly 1 on leave today
    salary: "₹21.40 L",
    grossMonthly: 178333,
    netMonthly: 153833,
    tdsMonthly: 22500,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["AWS", "Terraform", "Docker", "CI/CD Pipelines", "Linux Administration"],
    education: "B.Tech in Electronics & Communication - Cochin University",
    certifications: ["AWS Certified DevOps Engineer - Professional"],
    dob: "1995-04-22",
    gender: "Female",
    bloodGroup: "A+",
    address: "Villa 8, Financial District, Hyderabad, Telangana 500075",
    emergencyContact: "+91 98765 11149 (Pradeep Nair - Father)",
    probationStatus: "Confirmed",
    confirmationDate: "19 May 2024",
    location: "Hyderabad"
  },
  {
    id: "EMP-2002",
    employeeId: "EMP-2002",
    name: "Anita Desai",
    firstName: "Anita",
    lastName: "Desai",
    email: "anita.desai@nexora.in",
    phone: "+91 98765 12002",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Engineering",
    department: "Engineering",
    designation: "Lead DevOps & Cloud Engineer",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1042",
    mgr: "Aarav Sharma",
    isDepartmentHead: false,
    joined: "01 Jun 2023",
    joiningDate: "2023-06-01",
    totalExperienceYears: 4.8,
    previousCompanies: [
      { company: "Infosys Cloud", role: "Systems Associate", duration: "2 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹18.00 L",
    grossMonthly: 150000,
    netMonthly: 129500,
    tdsMonthly: 18500,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["AWS", "Node.js", "Kubernetes", "PostgreSQL", "REST APIs"],
    education: "B.E. Computer Science - Osmania University Hyderabad",
    certifications: ["Oracle Certified Associate Java SE", "AWS Cloud Practitioner"],
    dob: "1998-07-11",
    gender: "Female",
    bloodGroup: "B+",
    address: "Street 4, Begumpet, Hyderabad, Telangana 500016",
    emergencyContact: "+91 98765 12009 (Vijay Desai - Father)",
    probationStatus: "Confirmed",
    confirmationDate: "01 Dec 2023",
    location: "Hyderabad"
  },
  {
    id: "EMP-1088",
    employeeId: "EMP-1088",
    name: "Pooja Patel",
    firstName: "Pooja",
    lastName: "Patel",
    email: "pooja.patel@nexora.in",
    phone: "+91 98765 11088",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Human Resources",
    department: "Human Resources",
    designation: "Senior HRBP",
    role: "EMPLOYEE",
    systemRole: "HR",
    reportingToId: "EMP-1001",
    mgr: "Meera Reddy",
    isDepartmentHead: false,
    joined: "15 Jan 2022",
    joiningDate: "2022-01-15",
    totalExperienceYears: 4.5,
    previousCompanies: [
      { company: "Cognizant HR", role: "HR Executive", duration: "2 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹18.20 L",
    grossMonthly: 151666,
    netMonthly: 130766,
    tdsMonthly: 18900,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["HR Business Partnering", "Performance Appraisal", "Diversity & Inclusion", "Labor Compliance"],
    education: "MBA in HR - Osmania University",
    certifications: ["Certified HR Business Partner (CHRP)"],
    dob: "1996-01-28",
    gender: "Female",
    bloodGroup: "O+",
    address: "Flat 201, Miyapur Meadows, Hyderabad, Telangana 500049",
    emergencyContact: "+91 98765 11089 (Kiran Patel - Brother)",
    probationStatus: "Confirmed",
    confirmationDate: "15 Jul 2022",
    location: "Hyderabad"
  },
  {
    id: "EMP-1501",
    employeeId: "EMP-1501",
    name: "Suresh Menon",
    firstName: "Suresh",
    lastName: "Menon",
    email: "suresh.menon@nexora.in",
    phone: "+91 98765 11501",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Operations",
    department: "Operations",
    designation: "Principal Operations Specialist",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1001",
    mgr: "Meera Reddy",
    isDepartmentHead: true,
    joined: "01 Nov 2021",
    joiningDate: "2021-11-01",
    totalExperienceYears: 5.8,
    previousCompanies: [
      { company: "Amazon Fulfillment Hyderabad", role: "Logistics Specialist", duration: "3 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹22.00 L",
    grossMonthly: 183333,
    netMonthly: 157833,
    tdsMonthly: 23500,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Facility Management", "Procurement", "Vendor Relations", "IT Asset Tracking"],
    education: "B.Com - St. Joseph's College Hyderabad",
    certifications: ["Six Sigma Green Belt"],
    dob: "1994-12-14",
    gender: "Male",
    bloodGroup: "A-",
    address: "Phase 3, HITEC City, Hyderabad, Telangana 500081",
    emergencyContact: "+91 98765 11509 (Madhavan Menon - Father)",
    probationStatus: "Confirmed",
    confirmationDate: "01 May 2022",
    location: "Hyderabad"
  },
  {
    id: "EMP-1401",
    employeeId: "EMP-1401",
    name: "Ananya Roy",
    firstName: "Ananya",
    lastName: "Roy",
    email: "ananya.roy@nexora.in",
    phone: "+91 98765 11401",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Marketing",
    department: "Marketing",
    designation: "Staff Marketing Strategist",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1102",
    mgr: "Rohan Varma",
    isDepartmentHead: true,
    joined: "15 Apr 2021",
    joiningDate: "2021-04-15",
    totalExperienceYears: 6.2,
    previousCompanies: [
      { company: "Ogilvy India", role: "Brand Associate", duration: "2.5 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Hybrid",
    status: "Active",
    salary: "₹25.00 L",
    grossMonthly: 208333,
    netMonthly: 176833,
    tdsMonthly: 29500,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Growth Marketing", "Social Media Campaigns", "Content Strategy", "SEO/SEM"],
    education: "B.A. Mass Communication - Symbiosis Pune",
    certifications: ["Google Digital Marketing Certified"],
    dob: "1995-06-30",
    gender: "Female",
    bloodGroup: "O+",
    address: "Lotus Pond Road, Film Nagar, Hyderabad, Telangana 500096",
    emergencyContact: "+91 98765 11409 (Deb Roy - Father)",
    probationStatus: "Confirmed",
    confirmationDate: "15 Oct 2021",
    location: "Hyderabad"
  },
  {
    id: "EMP-1201",
    employeeId: "EMP-1201",
    name: "Kavita Rao",
    firstName: "Kavita",
    lastName: "Rao",
    email: "kavita.rao@nexora.in",
    phone: "+91 98765 11201",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Finance",
    department: "Finance",
    designation: "Lead Payroll Accountant",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1301",
    mgr: "Vikram Malhotra",
    isDepartmentHead: true,
    joined: "10 Feb 2024",
    joiningDate: "2024-02-10",
    totalExperienceYears: 6.5,
    previousCompanies: [
      { company: "Deloitte India", role: "Senior Tax Associate", duration: "4.5 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹19.80 L",
    grossMonthly: 165000,
    netMonthly: 142000,
    tdsMonthly: 21000,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Statutory Compliance", "TDS & PF Filings", "Payroll Processing", "Corporate Auditing"],
    education: "Chartered Accountant (ICAI) & B.Com - Osmania University",
    certifications: ["Certified Management Accountant (CMA)"],
    dob: "1992-10-09",
    gender: "Female",
    bloodGroup: "B+",
    address: "Sainikpuri Colony, Secunderabad, Telangana 500094",
    emergencyContact: "+91 98765 11209 (Srinivas Rao - Spouse)",
    probationStatus: "Confirmed",
    confirmationDate: "10 Aug 2024",
    location: "Hyderabad"
  },
  {
    id: "EMP-1701",
    employeeId: "EMP-1701",
    name: "Rhea Sen",
    firstName: "Rhea",
    lastName: "Sen",
    email: "rhea.sen@nexora.in",
    phone: "+91 98765 11701",
    companyId: "NEX-IND",
    companyName: "Nexora Technologies",
    dept: "Support",
    department: "Support",
    designation: "Customer Success Lead",
    role: "EMPLOYEE",
    systemRole: "Employee",
    reportingToId: "EMP-1301",
    mgr: "Vikram Malhotra",
    isDepartmentHead: true,
    joined: "01 Aug 2024",
    joiningDate: "2024-08-01",
    totalExperienceYears: 2.2,
    previousCompanies: [
      { company: "Freshworks India", role: "Support Executive", duration: "1.5 yrs" }
    ],
    employmentType: "Full-Time",
    workMode: "Office",
    status: "Active",
    salary: "₹10.50 L",
    grossMonthly: 87500,
    netMonthly: 77100,
    tdsMonthly: 8400,
    pfMonthly: 1800,
    ptMonthly: 200,
    skills: ["Customer Delight", "Zendesk", "Communication", "Troubleshooting"],
    education: "B.Sc Psychology - St. Francis College Hyderabad",
    certifications: ["ITIL v4 Foundation"],
    dob: "2000-02-17",
    gender: "Female",
    bloodGroup: "AB+",
    address: "Street No 5, Begumpet, Hyderabad, Telangana 500016",
    emergencyContact: "+91 98765 11709 (Arundhati Sen - Mother)",
    probationStatus: "Confirmed",
    confirmationDate: "01 Feb 2025",
    location: "Hyderabad"
  }
];

// ==========================================
// 4. COMPUTED ENTERPRISE METRICS (Single Truth)
// ==========================================
export const CANONICAL_METRICS = {
  totalHeadcount: CANONICAL_EMPLOYEES_12.length, // 12
  activeEmployees: CANONICAL_EMPLOYEES_12.filter(e => e.status === "Active").length, // 11
  onLeaveEmployees: CANONICAL_EMPLOYEES_12.filter(e => e.status === "On Leave").length, // 1 (Sneha Nair)
  probationEmployees: CANONICAL_EMPLOYEES_12.filter(e => e.status === "Probation" || e.probationStatus === "In Probation").length, // 0
  attritionRate: "8.3%", // Exactly 1 exit / 12 employees over 6 months = 8.3%
  attritionNumeric: 8.3,
  pendingApprovalsCount: 3, // Synchronized across Leave, WFH, Sidebar, Notifications
  verifiedDocsCount: 38,
  pendingDocsCount: 2,
  onboardingCount: 8,
  departmentCounts: {
    Engineering: 4,
    "Human Resources": 2,
    Design: 1,
    Sales: 1,
    Operations: 1,
    Marketing: 1,
    Finance: 1,
    Support: 1
  }
};

// ==========================================
// 5. 8 ONBOARDING & DOCUMENT CANDIDATES
// ==========================================
export const CANONICAL_CANDIDATES_8 = [
  {
    id: "CAN-101",
    employeeId: "CAN-101",
    name: "Tanvi Kulkarni",
    email: "tanvi.kulkarni@nexora.in",
    role: "Principal Cloud Architect",
    designation: "Principal Cloud Architect",
    dept: "Engineering",
    department: "Engineering",
    joiningDate: "2026-11-15",
    joinedDate: "15 Nov 2026",
    progress: 85,
    accessStatus: "offer_accepted",
    companyId: "NEX-IND",
    tasks: "Laptop dispatched, corporate email generated",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Tanvi_Aadhaar.pdf", size: 450000, status: "verified", uploadedAt: "2026-11-02T10:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Tanvi_PAN.pdf", size: 380000, status: "verified", uploadedAt: "2026-11-02T10:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "BTech_Degree_IIT.pdf", size: 1200000, status: "verified", uploadedAt: "2026-11-02T10:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "HDFC_Cancelled_Cheque.pdf", size: 520000, status: "verified", uploadedAt: "2026-11-02T10:12:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "AWS_Relieving_Letter.pdf", size: 890000, status: "verified", uploadedAt: "2026-11-02T10:15:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Identity & PAN Verification", completed: true },
      { id: "c2", title: "Educational Credentials Check", completed: true },
      { id: "c3", title: "Bank Account & Cancelled Cheque", completed: true },
      { id: "c4", title: "IT Asset (MacBook M3 Pro) Allocated", completed: true },
      { id: "c5", title: "Day 1 Orientation & Buddy Assigned", completed: false }
    ]
  },
  {
    id: "CAN-102",
    employeeId: "CAN-102",
    name: "Gaurav Vyas",
    email: "gaurav.vyas@nexora.in",
    role: "Senior Frontend Engineer",
    designation: "Senior Frontend Engineer",
    dept: "Engineering",
    department: "Engineering",
    joiningDate: "2026-11-18",
    joinedDate: "18 Nov 2026",
    progress: 60,
    accessStatus: "docs_review",
    companyId: "NEX-IND",
    tasks: "EPF nomination and bank proof under verification",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Gaurav_Aadhaar.pdf", size: 410000, status: "verified", uploadedAt: "2026-11-04T11:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Gaurav_PAN.pdf", size: 360000, status: "verified", uploadedAt: "2026-11-04T11:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "BE_Degree_BITS.pdf", size: 1400000, status: "verified", uploadedAt: "2026-11-04T11:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "ICICI_Cheque.pdf", size: 620000, status: "pending", uploadedAt: "2026-11-08T09:30:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Previous_Experience.pdf", size: 750000, status: "pending", uploadedAt: "2026-11-08T09:35:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Identity & PAN Verification", completed: true },
      { id: "c2", title: "Educational Credentials Check", completed: true },
      { id: "c3", title: "Bank Proof Sign-off", completed: false },
      { id: "c4", title: "Laptop Procurement Request", completed: true },
      { id: "c5", title: "HR Benefits Enrollment", completed: false }
    ]
  },
  {
    id: "CAN-103",
    employeeId: "CAN-103",
    name: "Arjun Nair",
    email: "arjun.nair@nexora.in",
    role: "Fullstack Developer",
    designation: "Fullstack Developer",
    dept: "Engineering",
    department: "Engineering",
    joiningDate: "2026-11-20",
    joinedDate: "20 Nov 2026",
    progress: 40,
    accessStatus: "docs_rejected",
    companyId: "NEX-IND",
    tasks: "Degree certificate re-upload required (low resolution scan)",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Arjun_Aadhaar.pdf", size: 390000, status: "verified", uploadedAt: "2026-11-03T14:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Arjun_PAN.pdf", size: 320000, status: "verified", uploadedAt: "2026-11-03T14:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "Degree_Scan_Blurry.pdf", size: 210000, status: "rejected", rejectReason: "Resolution too low, university seal not legible", uploadedAt: "2026-11-03T14:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "SBI_Cheque.pdf", size: 480000, status: "verified", uploadedAt: "2026-11-03T14:15:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Experience_Letter.pdf", size: 680000, status: "pending", uploadedAt: "2026-11-03T14:20:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Identity Proof Verified", completed: true },
      { id: "c2", title: "Re-upload Degree Certificate", completed: false },
      { id: "c3", title: "Bank Proof Cleared", completed: true },
      { id: "c4", title: "Developer Workstation Setup", completed: false },
      { id: "c5", title: "Welcome Kit Dispatch", completed: false }
    ]
  },
  {
    id: "CAN-104",
    employeeId: "CAN-104",
    name: "Divya Krishnan",
    email: "divya.krishnan@nexora.in",
    role: "Senior UI/UX Designer",
    designation: "Senior UI/UX Designer",
    dept: "Design",
    department: "Design",
    joiningDate: "2026-11-22",
    joinedDate: "22 Nov 2026",
    progress: 75,
    accessStatus: "offer_issued",
    companyId: "NEX-IND",
    tasks: "Offer letter issued; awaiting formal digital signature",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Divya_Aadhaar.pdf", size: 420000, status: "verified", uploadedAt: "2026-11-05T10:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Divya_PAN.pdf", size: 340000, status: "verified", uploadedAt: "2026-11-05T10:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "NID_Master_Degree.pdf", size: 1500000, status: "verified", uploadedAt: "2026-11-05T10:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "Axis_Cheque.pdf", size: 510000, status: "verified", uploadedAt: "2026-11-05T10:15:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Swiggy_Relieving.pdf", size: 920000, status: "verified", uploadedAt: "2026-11-05T10:20:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "All 5 Documents Verified", completed: true },
      { id: "c2", title: "Offer Acceptance Sign-off", completed: false },
      { id: "c3", title: "Figma & Design Software Licenses", completed: true },
      { id: "c4", title: "Monitor & Laptop Dispatch", completed: false }
    ]
  },
  {
    id: "CAN-105",
    employeeId: "CAN-105",
    name: "Rahul Deshmukh",
    email: "rahul.deshmukh@nexora.in",
    role: "DevOps Engineer",
    designation: "DevOps Engineer",
    dept: "Engineering",
    department: "Engineering",
    joiningDate: "2026-11-25",
    joinedDate: "25 Nov 2026",
    progress: 70,
    accessStatus: "docs_approved",
    companyId: "NEX-IND",
    tasks: "All documents approved; offer package being generated",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Rahul_Aadhaar.pdf", size: 400000, status: "verified", uploadedAt: "2026-11-06T15:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Rahul_PAN.pdf", size: 350000, status: "verified", uploadedAt: "2026-11-06T15:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "BTech_Degree.pdf", size: 1100000, status: "verified", uploadedAt: "2026-11-06T15:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "HDFC_Cheque.pdf", size: 490000, status: "verified", uploadedAt: "2026-11-06T15:15:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Wipro_Relieving.pdf", size: 840000, status: "verified", uploadedAt: "2026-11-06T15:20:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Statutory Verification Complete", completed: true },
      { id: "c2", title: "Offer Letter Ready for Issue", completed: false },
      { id: "c3", title: "AWS Cloud Sandbox Access", completed: false }
    ]
  },
  {
    id: "CAN-106",
    employeeId: "CAN-106",
    name: "Shalini Verma",
    email: "shalini.verma@nexora.in",
    role: "Financial Analyst",
    designation: "Financial Analyst",
    dept: "Finance",
    department: "Finance",
    joiningDate: "2026-11-28",
    joinedDate: "28 Nov 2026",
    progress: 50,
    accessStatus: "reverify_pending",
    companyId: "NEX-IND",
    tasks: "Round 2 in-person verification pending on Day 1",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Shalini_Aadhaar.pdf", size: 430000, status: "verified", uploadedAt: "2026-11-07T09:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Shalini_PAN.pdf", size: 360000, status: "verified", uploadedAt: "2026-11-07T09:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "MCom_Finance.pdf", size: 1300000, status: "verified", uploadedAt: "2026-11-07T09:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "Kotak_Cheque.pdf", size: 530000, status: "verified", uploadedAt: "2026-11-07T09:15:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Relieving_Doc.pdf", size: 770000, status: "verified", uploadedAt: "2026-11-07T09:20:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Round 1 Verification Passed", completed: true },
      { id: "c2", title: "Round 2 Physical Document Match", completed: false },
      { id: "c3", title: "ERP & Tally Access Provisioning", completed: false }
    ]
  },
  {
    id: "CAN-107",
    employeeId: "CAN-107",
    name: "Karthik Iyer",
    email: "karthik.iyer@nexora.in",
    role: "Marketing Specialist",
    designation: "Marketing Specialist",
    dept: "Marketing",
    department: "Marketing",
    joiningDate: "2026-12-01",
    joinedDate: "01 Dec 2026",
    progress: 35,
    accessStatus: "reverify_failed",
    companyId: "NEX-IND",
    tasks: "Round 2 mismatch: PAN name spelling mismatch requires affidavit",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Karthik_Aadhaar.pdf", size: 410000, status: "verified", uploadedAt: "2026-11-05T12:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Karthik_PAN_WrongName.pdf", size: 340000, status: "rejected", rejectReason: "Name in PAN card does not match Aadhaar record", uploadedAt: "2026-11-05T12:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "MBA_Marketing.pdf", size: 1250000, status: "verified", uploadedAt: "2026-11-05T12:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "Axis_Bank_Cheque.pdf", size: 500000, status: "verified", uploadedAt: "2026-11-05T12:15:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Agency_Relieving.pdf", size: 810000, status: "verified", uploadedAt: "2026-11-05T12:20:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Aadhaar Verified", completed: true },
      { id: "c2", title: "Submit PAN Correction or Affidavit", completed: false },
      { id: "c3", title: "Social Media Accounts Access", completed: false }
    ]
  },
  {
    id: "CAN-108",
    employeeId: "CAN-108",
    name: "Prachi Gupta",
    email: "prachi.gupta@nexora.in",
    role: "Operations Associate",
    designation: "Operations Associate",
    dept: "Operations",
    department: "Operations",
    joiningDate: "2026-12-05",
    joinedDate: "05 Dec 2026",
    progress: 55,
    accessStatus: "docs_review",
    companyId: "NEX-IND",
    tasks: "Previous experience letter under background check",
    documents: [
      { key: "govt_id", label: "Aadhaar Card", fileName: "Prachi_Aadhaar.pdf", size: 395000, status: "verified", uploadedAt: "2026-11-08T16:00:00.000Z" },
      { key: "pan_card", label: "PAN Card", fileName: "Prachi_PAN.pdf", size: 330000, status: "verified", uploadedAt: "2026-11-08T16:05:00.000Z" },
      { key: "education", label: "Degree Certificate", fileName: "BCom_Degree.pdf", size: 1150000, status: "verified", uploadedAt: "2026-11-08T16:10:00.000Z" },
      { key: "bank_proof", label: "Cancelled Cheque", fileName: "SBI_Cheque.pdf", size: 470000, status: "pending", uploadedAt: "2026-11-08T16:15:00.000Z" },
      { key: "experience", label: "Relieving Letter", fileName: "Amazon_Relieving.pdf", size: 790000, status: "pending", uploadedAt: "2026-11-08T16:20:00.000Z" }
    ],
    checklist: [
      { id: "c1", title: "Identity Documents Checked", completed: true },
      { id: "c2", title: "Bank Verification in Progress", completed: false },
      { id: "c3", title: "Vendor & Operations Tool Access", completed: false }
    ]
  }
];

// ==========================================
// 6. DATE & DYNAMIC WORKING DAY HELPERS
// ==========================================

/**
 * Returns current date YYYY-MM-DD in Asia/Kolkata
 */
export function getTodayIST() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Checks if a YYYY-MM-DD date is a Saturday or Sunday
 */
export function isWeekendIST(dateStr) {
  if (!dateStr) return false;
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  } catch (e) {
    return false;
  }
}

/**
 * Checks if dateStr is an official Telangana holiday
 */
export function isTelanganaHolidayDate(dateStr) {
  if (!dateStr) return false;
  return TELANGANA_HOLIDAYS_2026.some(h => h.date === dateStr && !h.isOptional);
}

/**
 * Returns the last N working days (excluding weekends & Telangana holidays) up to today
 */
export function getPastWorkingDays(count = 20) {
  const list = [];
  const todayKey = getTodayIST();
  const [y, m, d] = todayKey.split("-").map(Number);
  const cur = new Date(y, m - 1, d, 12, 0, 0);

  let steps = 0;
  while (list.length < count && steps < 60) {
    steps++;
    const key = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(cur);

    if (key <= todayKey && !isWeekendIST(key) && !isTelanganaHolidayDate(key)) {
      list.push(key);
    }
    cur.setDate(cur.getDate() - 1);
  }
  return list;
}

/**
 * Demo accounts for fast sign-in in LoginView & instant role switching across all 8 roles
 */
export const DEMO_ACCOUNTS = [
  {
    id: "EMP-1000",
    employeeId: "EMP-1000",
    name: "Vikram Singhania",
    firstName: "Vikram",
    lastName: "Singhania",
    email: "admin@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "Super Admin",
    role: "Managing Director & Super Admin",
    dept: "Executive Board",
    designation: "Managing Director & Super Admin",
    mobile: "+91 98111 00001",
    location: "Hyderabad, Telangana",
    joiningDate: "01 Jan 2020",
    accessStatus: "active"
  },
  {
    id: "EMP-1001",
    employeeId: "EMP-1001",
    name: "Meera Reddy",
    firstName: "Meera",
    lastName: "Reddy",
    email: "meera.reddy@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "HR Manager",
    role: "HR Manager",
    dept: "Human Resources",
    designation: "HR Manager",
    mobile: "+91 98765 11001",
    location: "Hyderabad, Telangana",
    joiningDate: "01 Feb 2021",
    accessStatus: "active"
  },
  {
    id: "EMP-1088",
    employeeId: "EMP-1088",
    name: "Pooja Patel",
    firstName: "Pooja",
    lastName: "Patel",
    email: "pooja.patel@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "HR Executive",
    role: "Senior HRBP",
    dept: "Human Resources",
    designation: "Senior HRBP",
    mobile: "+91 98765 11088",
    location: "Hyderabad, Telangana",
    joiningDate: "15 Jan 2022",
    accessStatus: "active"
  },
  {
    id: "EMP-1201",
    employeeId: "EMP-1201",
    name: "Kavita Rao",
    firstName: "Kavita",
    lastName: "Rao",
    email: "kavita.rao@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "Payroll Admin",
    role: "Lead Payroll Accountant",
    dept: "Finance",
    designation: "Lead Payroll Accountant",
    mobile: "+91 98765 11201",
    location: "Hyderabad, Telangana",
    joiningDate: "10 Feb 2024",
    accessStatus: "active"
  },
  {
    id: "EMP-1042",
    employeeId: "EMP-1042",
    name: "Aarav Sharma",
    firstName: "Aarav",
    lastName: "Sharma",
    email: "aarav.sharma@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "Department Head",
    role: "Staff Architect & Engineering Lead",
    dept: "Engineering",
    designation: "Staff Architect & Engineering Lead",
    mobile: "+91 98765 43210",
    location: "Hyderabad, Telangana",
    joiningDate: "12 Mar 2021",
    isDepartmentHead: true,
    accessStatus: "active"
  },
  {
    id: "EMP-1102",
    employeeId: "EMP-1102",
    name: "Rohan Varma",
    firstName: "Rohan",
    lastName: "Varma",
    email: "rohan.varma@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "Team Lead",
    role: "Lead Product Designer & TL",
    dept: "Design",
    designation: "Lead Product Designer",
    mobile: "+91 98765 11102",
    location: "Hyderabad, Telangana",
    joiningDate: "04 Aug 2022",
    accessStatus: "active"
  },
  {
    id: "EMP-1234",
    employeeId: "EMP-1234",
    name: "Devansh Mehta",
    firstName: "Devansh",
    lastName: "Mehta",
    email: "devansh.mehta@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "Employee",
    role: "Senior Frontend Engineer",
    dept: "Engineering",
    designation: "Senior Frontend Engineer",
    mobile: "+91 98765 11234",
    location: "Hyderabad, Telangana",
    joiningDate: "01 Jul 2024",
    accessStatus: "active"
  },
  {
    id: "CAN-101",
    employeeId: "CAN-101",
    name: "Tanvi Kulkarni",
    firstName: "Tanvi",
    lastName: "Kulkarni",
    email: "tanvi.kulkarni@nexora.in",
    companyId: COMPANY_CONFIG.id,
    companyName: COMPANY_CONFIG.name,
    systemRole: "Candidate",
    role: "Principal Cloud Architect (New Hire)",
    dept: "Engineering",
    designation: "Principal Cloud Architect",
    mobile: "+91 98765 00101",
    location: "Hyderabad, Telangana",
    joiningDate: "15 Nov 2026",
    accessStatus: "offer_accepted"
  }
];

export default {
  COMPANY_CONFIG,
  TELANGANA_HOLIDAYS_2026,
  CANONICAL_EMPLOYEES_12,
  CANONICAL_METRICS,
  CANONICAL_CANDIDATES_8,
  DEMO_ACCOUNTS,
  getTodayIST,
  isWeekendIST,
  isTelanganaHolidayDate,
  getPastWorkingDays
};
