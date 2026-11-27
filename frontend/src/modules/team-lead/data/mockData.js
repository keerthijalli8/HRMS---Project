export const currentTeamLead = {
  id: "TL-1042",
  name: "Mounika S. Rao",
  firstName: "Mounika",
  lastName: "Rao",
  role: "Team Lead Manager",
  systemRole: "TEAM_LEAD_MANAGER",
  email: "mounika.rao@technomold.corp",
  phone: "+91 98450 82194",
  dept: "Core Engineering & Platforms",
  reportingManager: "V. Krishnan (VP Engineering)",
  location: "Tata Elxsi Innovation Hub · Bengaluru Central",
  joined: "14 Feb 2020",
  experience: "8.5 Years",
  directReportsCount: 7,
  totalTeamCount: 10,
  avatarText: "MR",
  skills: ["React", "FastAPI", "System Architecture", "PostgreSQL", "AWS ECS", "Agile Leadership"],
  managerId: "MGR-1001",
  reportingManagerId: "MGR-1001",
  managerId: "MGR-1001",
  reportingManagerId: "MGR-1001"
};

export const currentManager = {
  id: "MGR-1001",
  employeeId: "MGR-1001",

  name: "V. Krishnan",
  firstName: "V.",
  lastName: "Krishnan",

  role: "Manager",
  systemRole: "MANAGER",

  designation: "VP Engineering",

  dept: "Core Engineering & Platforms",
  department: "Core Engineering & Platforms",

  assignedTeamLeadIds: ["TL-1042"],

  managedTeamLeadIds: ["TL-1042"],

  teamLeadIds: ["TL-1042"],

  avatarText: "VK",

  isDemoAccount: true
};


const PROJECT_1052_ROLES = {
  'EMP-2001': 'Frontend Dashboard Engineer',
  'EMP-2002': 'UI/UX & Design System Lead',
  'EMP-2003': 'QA Automation & Reconciliation Lead',
  'EMP-2004': 'Full-Stack & API Integration Engineer',
  'EMP-2005': 'Payroll Data & Performance Engineer',
  'EMP-2006': 'Business & Workflow Analyst',
  'EMP-2007': 'Payroll Calculation Test Engineer',
  'EMP-2008': 'Cloud Deployment & Reliability Engineer',
  'EMP-2009': 'Payroll Experience Engineer',
  'EMP-2010': 'Technical Documentation & Release Specialist'
};

export const initialTeamMembers = [
  {
    id: "EMP-2001",
    name: "Ravi Kumar",
    designation: "Senior Frontend Engineer",
    dept: "Core Engineering",
    type: "Full-Time",
    relation: "Direct",
    joined: "12 Mar 2021",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "ravi.kumar@technomold.corp",
    phone: "+91 98841 23091",
    emergencyContact: "+91 94432 10872 (Spouse)",
    bloodGroup: "O+",
    dob: "1994-08-16",
    city: "Bengaluru, Karnataka",
    statusToday: "office",
    punchIn: "09:05 AM",
    punchOut: "06:15 PM",
    workingHoursToday: "9h 10m",
    attendanceSummary: {
      rate: "96.5%",
      presentDays: 21,
      lateDays: 1,
      wfhDays: 4,
      absentDays: 0,
      totalHours: "188h"
    },
    leaveBalance: {
      casual: { used: 4, total: 12, remaining: 8 },
      sick: { used: 2, total: 10, remaining: 8 },
      earned: { used: 3, total: 15, remaining: 12 },
      optional: { used: 1, total: 2, remaining: 1 },
      unpaid: 0
    },
    performanceScore: 94,
    rating: 4.7,
    kpiScore: "95%",
    goalsProgress: 88,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 4,
    skills: ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Jest", "Micro-frontends"],
    certifications: ["AWS Certified Developer Associate", "Meta Frontend Professional"],
    payrollSummary: {
      grade: "L4 - Senior Engineer",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100984712019",
      bankName: "HDFC Bank (A/C ending 4402)"
    }
  },
  {
    id: "EMP-2002",
    name: "Priya Sharma",
    designation: "Lead UI/UX Product Designer",
    dept: "Design & Product",
    type: "Full-Time",
    relation: "Direct",
    joined: "05 Jul 2021",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "priya.sharma@technomold.corp",
    phone: "+91 97412 88410",
    emergencyContact: "+91 98210 55431 (Father)",
    bloodGroup: "B+",
    dob: "1995-11-12",
    city: "Bengaluru, Karnataka",
    statusToday: "remote",
    punchIn: "09:30 AM",
    punchOut: "06:30 PM",
    workingHoursToday: "9h 00m",
    attendanceSummary: {
      rate: "95.0%",
      presentDays: 20,
      lateDays: 0,
      wfhDays: 8,
      absentDays: 0,
      totalHours: "180h"
    },
    leaveBalance: {
      casual: { used: 5, total: 12, remaining: 7 },
      sick: { used: 3, total: 10, remaining: 7 },
      earned: { used: 4, total: 15, remaining: 11 },
      optional: { used: 0, total: 2, remaining: 2 },
      unpaid: 0
    },
    performanceScore: 96,
    rating: 4.8,
    kpiScore: "97%",
    goalsProgress: 92,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 3,
    skills: ["Figma Design Systems", "Prototyping", "Design Tokens", "Monsoon Glass UI", "User Research"],
    certifications: ["Nielsen Norman UX Master Certified", "Interaction Design Foundation"],
    payrollSummary: {
      grade: "L4 - Lead Specialist",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100783419821",
      bankName: "ICICI Bank (A/C ending 9110)"
    }
  },
  {
    id: "EMP-2003",
    name: "Anil Reddy",
    designation: "Senior QA Automation Engineer",
    dept: "Quality Assurance",
    type: "Full-Time",
    relation: "Direct",
    joined: "18 Oct 2022",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "anil.reddy@technomold.corp",
    phone: "+91 94480 32190",
    emergencyContact: "+91 99881 22340 (Brother)",
    bloodGroup: "A+",
    dob: "1993-04-22",
    city: "Hyderabad / Bengaluru",
    statusToday: "none",
    punchIn: "",
    punchOut: "",
    workingHoursToday: "0h",
    attendanceSummary: {
      rate: "89.0%",
      presentDays: 18,
      lateDays: 3,
      wfhDays: 5,
      absentDays: 1,
      totalHours: "162h"
    },
    leaveBalance: {
      casual: { used: 6, total: 12, remaining: 6 },
      sick: { used: 4, total: 10, remaining: 6 },
      earned: { used: 2, total: 15, remaining: 13 },
      optional: { used: 1, total: 2, remaining: 1 },
      unpaid: 0
    },
    performanceScore: 88,
    rating: 4.2,
    kpiScore: "89%",
    goalsProgress: 75,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 3,
    skills: ["Playwright", "Cypress", "Python Test Automation", "Postman", "CI/CD Pipelines", "Jira"],
    certifications: ["ISTQB Advanced Level Test Automation", "Postman API Expert"],
    payrollSummary: {
      grade: "L3 - Senior QA",
      payPeriod: "November 2026",
      status: "Attendance Review Required",
      payslipStatus: "Pending Regularization",
      epfUan: "100654321900",
      bankName: "State Bank of India (A/C ending 3109)"
    }
  },
  {
    id: "EMP-2004",
    name: "Sneha Rao",
    designation: "Backend Engineer II (Python/FastAPI)",
    dept: "Core Engineering",
    type: "Full-Time",
    relation: "Direct",
    joined: "01 Feb 2023",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "sneha.rao@technomold.corp",
    phone: "+91 96112 45781",
    emergencyContact: "+91 98451 90812 (Mother)",
    bloodGroup: "O+",
    dob: "1996-03-14",
    city: "Bengaluru, Karnataka",
    statusToday: "leave",
    punchIn: "",
    punchOut: "",
    workingHoursToday: "0h (On Earned Leave)",
    attendanceSummary: {
      rate: "94.0%",
      presentDays: 19,
      lateDays: 0,
      wfhDays: 6,
      absentDays: 0,
      totalHours: "172h"
    },
    leaveBalance: {
      casual: { used: 3, total: 12, remaining: 9 },
      sick: { used: 1, total: 10, remaining: 9 },
      earned: { used: 5, total: 15, remaining: 10 },
      optional: { used: 0, total: 2, remaining: 2 },
      unpaid: 0
    },
    performanceScore: 92,
    rating: 4.6,
    kpiScore: "93%",
    goalsProgress: 85,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 2,
    skills: ["Python 3.11", "FastAPI", "PostgreSQL", "SQLAlchemy", "Redis", "Docker", "RESTful APIs"],
    certifications: ["AWS Certified Solutions Architect", "Python Institute PCAP"],
    payrollSummary: {
      grade: "L3 - Software Engineer II",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100876123450",
      bankName: "Axis Bank (A/C ending 5519)"
    }
  },
  {
    id: "EMP-2005",
    name: "Kiran Babu",
    designation: "Full Stack Developer",
    dept: "Core Engineering",
    type: "Full-Time",
    relation: "Direct",
    joined: "18 Nov 2022",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "kiran.babu@technomold.corp",
    phone: "+91 98450 11983",
    emergencyContact: "+91 94481 00293 (Spouse)",
    bloodGroup: "AB+",
    dob: "1992-06-30",
    city: "Bengaluru, Karnataka",
    statusToday: "office",
    punchIn: "08:55 AM",
    punchOut: "05:55 PM",
    workingHoursToday: "9h 00m",
    attendanceSummary: {
      rate: "98.0%",
      presentDays: 22,
      lateDays: 0,
      wfhDays: 3,
      absentDays: 0,
      totalHours: "194h"
    },
    leaveBalance: {
      casual: { used: 2, total: 12, remaining: 10 },
      sick: { used: 0, total: 10, remaining: 10 },
      earned: { used: 2, total: 15, remaining: 13 },
      optional: { used: 1, total: 2, remaining: 1 },
      unpaid: 0
    },
    performanceScore: 95,
    rating: 4.8,
    kpiScore: "96%",
    goalsProgress: 94,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 3,
    skills: ["React", "FastAPI", "PostgreSQL", "Redis", "Tailwind CSS", "Docker"],
    certifications: ["CKA - Certified Kubernetes Administrator", "MongoDB Certified Developer"],
    payrollSummary: {
      grade: "L4 - Senior Full Stack",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100911223344",
      bankName: "HDFC Bank (A/C ending 7821)"
    }
  },
  {
    id: "EMP-2006",
    name: "Divya Teja",
    designation: "Senior Systems & Business Analyst",
    dept: "Product Operations",
    type: "Full-Time",
    relation: "Direct",
    joined: "10 Aug 2023",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "divya.teja@technomold.corp",
    phone: "+91 99160 88219",
    emergencyContact: "+91 98450 77123 (Mother)",
    bloodGroup: "B+",
    dob: "1995-11-24",
    city: "Bengaluru, Karnataka",
    statusToday: "late",
    punchIn: "10:20 AM",
    punchOut: "07:20 PM",
    workingHoursToday: "9h 00m (Late by 50m)",
    attendanceSummary: {
      rate: "92.0%",
      presentDays: 19,
      lateDays: 2,
      wfhDays: 6,
      absentDays: 0,
      totalHours: "174h"
    },
    leaveBalance: {
      casual: { used: 4, total: 12, remaining: 8 },
      sick: { used: 2, total: 10, remaining: 8 },
      earned: { used: 3, total: 15, remaining: 12 },
      optional: { used: 0, total: 2, remaining: 2 },
      unpaid: 0
    },
    performanceScore: 91,
    rating: 4.5,
    kpiScore: "92%",
    goalsProgress: 86,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 2,
    skills: ["Business Requirements (BRD)", "SQL Reporting", "UML Modeling", "Postman", "Tableau", "Jira"],
    certifications: ["CBAP Certified Business Analysis Professional", "Scrum Master PSM I"],
    payrollSummary: {
      grade: "L3 - Senior Analyst",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100778899011",
      bankName: "Kotak Mahindra Bank (A/C ending 1092)"
    }
  },
  {
    id: "EMP-2007",
    name: "Harsha Vardhan",
    designation: "Software Engineering Intern",
    dept: "Core Engineering",
    type: "Internship",
    relation: "Indirect",
    joined: "01 Sep 2026",
    reportingManager: "Ravi Kumar",
    workLocation: "Bengaluru Central Hub",
    email: "harsha.v@technomold.corp",
    phone: "+91 90081 77210",
    emergencyContact: "+91 98440 12890 (Father)",
    bloodGroup: "O+",
    dob: "2003-05-18",
    city: "Bengaluru, Karnataka",
    statusToday: "office",
    punchIn: "09:40 AM",
    punchOut: "06:40 PM",
    workingHoursToday: "9h 00m",
    attendanceSummary: {
      rate: "97.0%",
      presentDays: 21,
      lateDays: 1,
      wfhDays: 2,
      absentDays: 0,
      totalHours: "185h"
    },
    leaveBalance: {
      casual: { used: 1, total: 6, remaining: 5 },
      sick: { used: 0, total: 5, remaining: 5 },
      earned: { used: 0, total: 0, remaining: 0 },
      optional: { used: 0, total: 1, remaining: 1 },
      unpaid: 0
    },
    performanceScore: 89,
    rating: 4.4,
    kpiScore: "90%",
    goalsProgress: 82,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 2,
    skills: ["JavaScript", "React", "CSS3", "Git Workflow", "Python Basics"],
    certifications: ["HackerRank React Verified"],
    payrollSummary: {
      grade: "Intern Stipend",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "N/A (Stipend)",
      bankName: "Canara Bank (A/C ending 6620)"
    }
  },
  {
    id: "EMP-2008",
    name: "Meghana R",
    designation: "Cloud & DevOps Engineer",
    dept: "Infrastructure & Cloud",
    type: "Full-Time",
    relation: "Indirect",
    joined: "14 Apr 2024",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "meghana.r@technomold.corp",
    phone: "+91 97310 44921",
    emergencyContact: "+91 99010 33219 (Mother)",
    bloodGroup: "A+",
    dob: "1997-09-08",
    city: "Bengaluru, Karnataka",
    statusToday: "remote",
    punchIn: "09:15 AM",
    punchOut: "06:15 PM",
    workingHoursToday: "9h 00m",
    attendanceSummary: {
      rate: "96.0%",
      presentDays: 20,
      lateDays: 0,
      wfhDays: 7,
      absentDays: 0,
      totalHours: "182h"
    },
    leaveBalance: {
      casual: { used: 3, total: 12, remaining: 9 },
      sick: { used: 1, total: 10, remaining: 9 },
      earned: { used: 2, total: 15, remaining: 13 },
      optional: { used: 1, total: 2, remaining: 1 },
      unpaid: 0
    },
    performanceScore: 93,
    rating: 4.7,
    kpiScore: "94%",
    goalsProgress: 90,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 3,
    skills: ["AWS Cloud", "Terraform", "Kubernetes", "Docker", "GitHub Actions", "Prometheus/Grafana"],
    certifications: ["AWS Solutions Architect Associate", "HashiCorp Certified Terraform Associate"],
    payrollSummary: {
      grade: "L3 - DevOps Engineer",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100554433221",
      bankName: "HDFC Bank (A/C ending 9014)"
    }
  },
  {
    id: "EMP-2009",
    name: "Devansh Mehta",
    designation: "Frontend Engineer II",
    dept: "Core Engineering",
    type: "Full-Time",
    relation: "Direct",
    joined: "01 Jul 2024",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "devansh.mehta@technomold.corp",
    phone: "+91 98201 99451",
    emergencyContact: "+91 98200 11223 (Father)",
    bloodGroup: "B-",
    dob: "1998-01-19",
    city: "Mumbai / Bengaluru",
    statusToday: "office",
    punchIn: "09:10 AM",
    punchOut: "06:10 PM",
    workingHoursToday: "9h 00m",
    attendanceSummary: {
      rate: "95.5%",
      presentDays: 20,
      lateDays: 1,
      wfhDays: 4,
      absentDays: 0,
      totalHours: "181h"
    },
    leaveBalance: {
      casual: { used: 2, total: 12, remaining: 10 },
      sick: { used: 1, total: 10, remaining: 9 },
      earned: { used: 1, total: 15, remaining: 14 },
      optional: { used: 0, total: 2, remaining: 2 },
      unpaid: 0
    },
    performanceScore: 90,
    rating: 4.5,
    kpiScore: "91%",
    goalsProgress: 84,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 2,
    skills: ["React", "JavaScript ES6+", "Redux Toolkit", "Tailwind CSS", "REST APIs"],
    certifications: ["React Developer Nanodegree"],
    payrollSummary: {
      grade: "L2 - Frontend Engineer",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100443322110",
      bankName: "Axis Bank (A/C ending 3381)"
    }
  },
  {
    id: "EMP-2010",
    name: "Ananya Roy",
    designation: "Technical Documentation Lead",
    dept: "Product Operations",
    type: "Full-Time",
    relation: "Direct",
    joined: "12 Dec 2022",
    reportingManager: "Mounika S. Rao",
    workLocation: "Bengaluru Central Hub",
    email: "ananya.roy@technomold.corp",
    phone: "+91 97110 33819",
    emergencyContact: "+91 98100 99412 (Mother)",
    bloodGroup: "O+",
    dob: "1993-10-04",
    city: "Bengaluru, Karnataka",
    statusToday: "remote",
    punchIn: "09:25 AM",
    punchOut: "06:25 PM",
    workingHoursToday: "9h 00m",
    attendanceSummary: {
      rate: "97.5%",
      presentDays: 21,
      lateDays: 0,
      wfhDays: 8,
      absentDays: 0,
      totalHours: "186h"
    },
    leaveBalance: {
      casual: { used: 3, total: 12, remaining: 9 },
      sick: { used: 2, total: 10, remaining: 8 },
      earned: { used: 4, total: 15, remaining: 11 },
      optional: { used: 1, total: 2, remaining: 1 },
      unpaid: 0
    },
    performanceScore: 94,
    rating: 4.7,
    kpiScore: "95%",
    goalsProgress: 91,
    reviewCycle: "Q3 FY 2026-27",
    assignedTasksCount: 2,
    skills: ["Technical Writing", "API Documentation (Swagger/OpenAPI)", "Markdown", "GitBook", "Confluence"],
    certifications: ["Society for Technical Communication (STC) Certified"],
    payrollSummary: {
      grade: "L4 - Documentation Lead",
      payPeriod: "November 2026",
      status: "Approved for Release",
      payslipStatus: "Available",
      epfUan: "100332211445",
      bankName: "HDFC Bank (A/C ending 2910)"
    }
  }
].map((member) => {
  // These sample punch locations are demo data; real values come from GPS or the API.
  const sampleLocations = {
    'EMP-2001': 'Bengaluru, KA',
    'EMP-2002': 'Hyderabad, TS',
    'EMP-2005': 'Bengaluru, KA',
    'EMP-2006': 'Guntur, AP',
    'EMP-2007': 'Bengaluru, KA',
    'EMP-2008': 'Hyderabad, TS',
    'EMP-2009': 'Mumbai, MH',
    'EMP-2010': 'Bengaluru, KA'
  };
  const location = sampleLocations[member.id] || null;
  return {
    ...member,
    projectId: 'PRJ-1052',
    projectRole: PROJECT_1052_ROLES[member.id],
    checkInLocation: member.punchIn ? location : null,
    checkOutLocation: member.punchOut ? location : null
  };
});

export const initialApprovals = [
  {
    id: "APP-101",
    employeeId: "EMP-2001",
    employeeName: "Ravi Kumar",
    category: "Leave Approval",
    requestType: "Casual Leave",
    fromDate: "2026-11-12",
    toDate: "2026-11-13",
    totalDays: 2,
    requestDate: "2026-11-08",
    reason: "Attending cousin's wedding ceremony in Mysore with family.",
    teamLeadApproval: "pending",
    hrApproval: "pending",
    status: "pending",
    comments: [],
    priority: "normal"
  },
  {
    id: "APP-102",
    employeeId: "EMP-2002",
    employeeName: "Priya Sharma",
    category: "Leave Approval",
    requestType: "Sick Leave",
    fromDate: "2026-11-14",
    toDate: "2026-11-14",
    totalDays: 1,
    requestDate: "2026-11-08",
    reason: "Medical consultation & dental check-up at Apollo Clinic.",
    teamLeadApproval: "pending",
    hrApproval: "approved",
    status: "pending",
    comments: [],
    priority: "normal"
  },
  {
    id: "APP-103",
    employeeId: "EMP-2003",
    employeeName: "Anil Reddy",
    category: "Attendance Regularization",
    requestType: "Missed Punch-out Regularization",
    fromDate: "2026-11-07",
    toDate: "2026-11-07",
    totalDays: 1,
    requestDate: "2026-11-08",
    reason: "Biometric biometric terminal timeout during evening exit at 06:45 PM. Requesting 9 hours attendance credit.",
    status: "pending",
    comments: [],
    priority: "high"
  },
  {
    id: "APP-104",
    employeeId: "EMP-2006",
    employeeName: "Divya Teja",
    category: "Work From Home Requests",
    requestType: "WFH Request (Broadband Maintenance)",
    fromDate: "2026-11-17",
    toDate: "2026-11-18",
    totalDays: 2,
    requestDate: "2026-11-07",
    reason: "Apartment electrical maintenance scheduled; requesting 2 days remote work.",
    status: "pending",
    comments: [],
    priority: "normal"
  },
  {
    id: "APP-105",
    employeeId: "EMP-2008",
    employeeName: "Meghana R",
    category: "Task Approval",
    requestType: "Infrastructure Migration Sign-off",
    fromDate: "2026-11-06",
    toDate: "2026-11-06",
    totalDays: 1,
    requestDate: "2026-11-06",
    reason: "Completed migration of Postgres test clusters to AWS RDS Multi-AZ. All integration smoke tests passed.",
    status: "pending",
    comments: [],
    priority: "high"
  },
  {
    id: "APP-106",
    employeeId: "EMP-2005",
    employeeName: "Kiran Babu",
    category: "Timesheet Approval",
    requestType: "Weekly Timesheet (Sprint 44)",
    fromDate: "2026-11-01",
    toDate: "2026-11-07",
    totalDays: 5,
    submittedHours: 44.5,
    requestDate: "2026-11-08",
    reason: "Logged 44.5 hours on Technomold backend APIs and fast query index optimizations.",
    status: "pending",
    comments: [],
    priority: "normal"
  },
  {
    id: "APP-107",
    employeeId: "EMP-2004",
    employeeName: "Sneha Rao",
    category: "Leave Approval",
    requestType: "Earned Leave",
    fromDate: "2026-11-09",
    toDate: "2026-11-11",
    totalDays: 3,
    requestDate: "2026-11-04",
    reason: "Pre-planned personal travel to native place.",
    teamLeadApproval: "approved",
    hrApproval: "approved",
    status: "approved",
    comments: ["Approved by Mounika on 04 Nov: Enjoy your time off."],
    priority: "normal"
  },
  {
    id: "APP-108",
    employeeId: "EMP-2007",
    employeeName: "Harsha Vardhan",
    category: "Work From Home Requests",
    requestType: "WFH Request",
    fromDate: "2026-11-05",
    toDate: "2026-11-05",
    totalDays: 1,
    requestDate: "2026-11-04",
    reason: "College semester hall ticket collection in morning.",
    status: "approved",
    comments: ["Approved by Mounika: Ensure tasks for Sprint 44 are updated."],
    priority: "normal"
  },
  {
    id: "APP-109",
    employeeId: "EMP-2009",
    employeeName: "Devansh Mehta",
    category: "Attendance Regularization",
    requestType: "Late Arrival Regularization",
    fromDate: "2026-11-03",
    toDate: "2026-11-03",
    totalDays: 1,
    requestDate: "2026-11-03",
    reason: "Outer Ring Road metro construction water logging caused 45m traffic delay.",
    status: "approved",
    comments: ["Regularized per city traffic advisory guidelines."],
    priority: "normal"
  },
  {
    id: "APP-110",
    employeeId: "EMP-2003",
    employeeName: "Anil Reddy",
    category: "Leave Approval",
    requestType: "Unpaid Leave",
    fromDate: "2026-10-28",
    toDate: "2026-10-28",
    totalDays: 1,
    requestDate: "2026-10-25",
    reason: "Extra day off without prior casual leave balance.",
    teamLeadApproval: "rejected",
    hrApproval: "pending",
    status: "rejected",
    comments: ["Rejected: Critical release regression testing scheduled on this date. Please reschedule."],
    priority: "high"
  }
];

export const initialTasks = [
  {
    id: "TSK-301",
    title: "Define Payroll API Request and Response Schemas",
    description: "Build validated payroll and tax request/response schemas with PostgreSQL-compatible types and consistent employee identifiers.",
    assigneeId: "EMP-2004",
    assigneeName: "Sneha Rao",
    category: "Backend",
    priority: "High",
    status: "In Progress",
    startDate: "2026-11-04",
    dueDate: "2026-11-12",
    progress: 65,
    attachments: 2,
    comments: [
      { author: "Mounika S. Rao", time: "05 Nov 2026, 11:30 AM", text: "Keep payroll run IDs and ISO timestamps consistent across calculation and payslip endpoints." }
    ]
  },
  {
    id: "TSK-302",
    title: "Design Payroll Summary and Deduction Review",
    description: "Create responsive payroll summary and deduction review flows that make salary, TDS, and provident fund calculations clear.",
    assigneeId: "EMP-2002",
    assigneeName: "Priya Sharma",
    category: "Design",
    priority: "Critical",
    status: "In Review",
    startDate: "2026-11-02",
    dueDate: "2026-11-10",
    progress: 90,
    attachments: 4,
    comments: [
      { author: "Priya Sharma", time: "08 Nov 2026, 04:15 PM", text: "Payroll summary components now use the shared design tokens and are ready for review." }
    ]
  },
  {
    id: "TSK-303",
    title: "Automate Payroll and Tax Reconciliation Regression Suite",
    description: "Add API assertions for TDS slabs, PF contributions, net pay totals, and payroll run permissions.",
    assigneeId: "EMP-2003",
    assigneeName: "Anil Reddy",
    category: "Testing",
    priority: "High",
    status: "In Progress",
    startDate: "2026-11-01",
    dueDate: "2026-11-14",
    progress: 35,
    attachments: 1,
    comments: [
      { author: "Anil Reddy", time: "06 Nov 2026, 02:00 PM", text: "Completed the TDS and PF assertions; adding boundary cases for rounding and payroll permissions." }
    ]
  },
  {
    id: "TSK-304",
    title: "Optimize Payroll Run and Payslip Queries",
    description: "Tune PostgreSQL indexes for payroll runs and employee payslip retrieval to keep monthly batch processing responsive.",
    assigneeId: "EMP-2005",
    assigneeName: "Kiran Babu",
    category: "Backend",
    priority: "Medium",
    status: "Completed",
    startDate: "2026-10-28",
    dueDate: "2026-11-05",
    progress: 100,
    attachments: 1,
    comments: [
      { author: "Kiran Babu", time: "04 Nov 2026, 06:10 PM", text: "Payslip lookup now completes below the target on the payroll sample dataset." }
    ]
  },
  {
    id: "TSK-305",
    title: "Build Payroll Reconciliation Dashboard",
    description: "Deliver an accessible payroll reconciliation table with sorting, pagination, and clear variance and completion states.",
    assigneeId: "EMP-2001",
    assigneeName: "Ravi Kumar",
    category: "Frontend",
    priority: "High",
    status: "Completed",
    startDate: "2026-10-30",
    dueDate: "2026-11-06",
    progress: 100,
    attachments: 2,
    comments: [
      { author: "Ravi Kumar", time: "06 Nov 2026, 05:00 PM", text: "The reconciliation table is in the shared UI folder and ready for payroll data integration." }
    ]
  },
  {
    id: "TSK-306",
    title: "Prepare Payroll Batch Deployment and Health Checks",
    description: "Configure the payroll batch service deployment, production health checks, and alerts for failed or delayed salary runs.",
    assigneeId: "EMP-2008",
    assigneeName: "Meghana R",
    category: "DevOps",
    priority: "High",
    status: "In Progress",
    startDate: "2026-11-03",
    dueDate: "2026-11-16",
    progress: 55,
    attachments: 3,
    comments: [
      { author: "Meghana R", time: "07 Nov 2026, 12:45 PM", text: "Staging cluster fully tested. Creating Terraform module for production." }
    ]
  },
  {
    id: "TSK-307",
    title: "Document Payroll and Tax API Contracts",
    description: "Document payroll run, TDS, PF, and payslip endpoints, including payload contracts, response codes, and access requirements.",
    assigneeId: "EMP-2010",
    assigneeName: "Ananya Roy",
    category: "Architecture",
    priority: "Medium",
    status: "To Do",
    startDate: "2026-11-09",
    dueDate: "2026-11-20",
    progress: 15,
    attachments: 1,
    comments: []
  },
  {
    id: "TSK-308",
    title: "Validate Payroll Business Rules and Approval Workflow",
    description: "Review payroll inputs, exception handling, and approval handoffs against the agreed Finance and Operations workflow.",
    assigneeId: "EMP-2006",
    assigneeName: "Divya Teja",
    category: "Architecture",
    priority: "Low",
    status: "In Progress",
    startDate: "2026-11-05",
    dueDate: "2026-11-18",
    progress: 40,
    attachments: 2,
    comments: []
  },
  {
    id: "TSK-309",
    title: "Add Unit Tests for Tax and Net Pay Calculations",
    description: "Cover TDS slab boundaries, PF contribution limits, rounding, and net pay totals with representative payroll fixtures.",
    assigneeId: "EMP-2007",
    assigneeName: "Harsha Vardhan",
    category: "Testing",
    priority: "Medium",
    status: "In Progress",
    startDate: "2026-11-06",
    dueDate: "2026-11-15",
    progress: 50,
    attachments: 0,
    comments: []
  },
  {
    id: "TSK-310",
    title: "Build Payroll Run Status and Exception Notices",
    description: "Show clear progress and actionable notices for payroll processing, reconciliation exceptions, and payslip readiness.",
    assigneeId: "EMP-2009",
    assigneeName: "Devansh Mehta",
    category: "Frontend",
    priority: "Medium",
    status: "Completed",
    startDate: "2026-11-01",
    dueDate: "2026-11-07",
    progress: 100,
    attachments: 1,
    comments: []
  }
].map(task => ({ ...task, projectId: 'PRJ-1052' }));

export const teamPerformanceScore = {
  overallScore: 92.8,
  kpiAchievement: "94.2%",
  sprintVelocity: "96%",
  codeQuality: "92%",
  onTimeDelivery: "95%",
  trendData: [
    { period: "28 Sep", score: 91, label: "Sprint 40" },
    { period: "05 Oct", score: 88, label: "Sprint 41" },
    { period: "12 Oct", score: 93, label: "Sprint 42" },
    { period: "19 Oct", score: 90, label: "Sprint 43" },
    { period: "26 Oct", score: 94, label: "Sprint 44" },
    { period: "02 Nov", score: 92, label: "Sprint 45" },
    { period: "09 Nov", score: 95, label: "Current" }
  ],
  goals: [
    { id: "G-1", title: "API Response P95 Under 120ms across all HRMS endpoints", progress: 92, status: "On Track", owner: "Sneha Rao & Kiran Babu" },
    { id: "G-2", title: "Zero High-Severity Security or Role-Access Vulnerabilities", progress: 100, status: "Achieved", owner: "Team Lead & Meghana R" },
    { id: "G-3", title: "Automated Test Coverage > 85% on React & FastAPI layers", progress: 84, status: "In Progress", owner: "Anil Reddy & Ravi Kumar" },
    { id: "G-4", title: "Monsoon Glass UI Component Standard Compliance (100%)", progress: 96, status: "On Track", owner: "Priya Sharma & Devansh Mehta" }
  ],
  recentFeedback: [
    {
      id: "FB-01",
      employeeId: "EMP-2001",
      employeeName: "Ravi Kumar",
      date: "04 Nov 2026",
      type: "Sprint Commendation",
      giver: "Mounika S. Rao",
      rating: 5,
      content: "Exceptional speed and attention to detail while refactoring the client-side state caches. Great mentorship to Harsha."
    },
    {
      id: "FB-02",
      employeeId: "EMP-2003",
      employeeName: "Anil Reddy",
      date: "28 Oct 2026",
      type: "Coaching Note",
      giver: "Mounika S. Rao",
      rating: 4,
      content: "Ensure test cases are executed prior to sprint freeze cut-off. Missed punches need prompt regularization."
    },
    {
      id: "FB-03",
      employeeId: "EMP-2002",
      employeeName: "Priya Sharma",
      date: "24 Oct 2026",
      type: "Design Excellence Award",
      giver: "V. Krishnan (VP Eng)",
      rating: 5,
      content: "The Monsoon Glass UI is receiving tremendous praise from enterprise pilot customers. High standard of execution."
    }
  ]
};

export const authorizedPayrollOverview = {
  payPeriod: "November 2026",
  payrollCycleStatus: "Pre-Disbursement Review",
  cycleDates: "01 Nov 2026 – 30 Nov 2026",
  cutOffDate: "25 Nov 2026",
  disbursementDate: "30 Nov 2026",
  totalEmployeesInBatch: 10,
  attendanceLocked: "Pending Regularizations (1)",
  payslipsGenerated: 8,
  payslipsPending: 2,
  statutoryCompliance: {
    epf: "100% Compliant",
    esic: "Applicable Employees Covered",
    professionalTax: "Karnataka PT Deducted",
    tdsCompliance: "Form 16 Regime Synced"
  },
  teamList: [
    { id: "EMP-2001", name: "Ravi Kumar", designation: "Senior Frontend Engineer", grade: "L4", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2002", name: "Priya Sharma", designation: "Lead UI/UX Product Designer", grade: "L4", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2003", name: "Anil Reddy", designation: "Senior QA Automation Engineer", grade: "L3", status: "Hold (Pending Regularization)", payslip: "On Hold", attendanceVerified: false },
    { id: "EMP-2004", name: "Sneha Rao", designation: "Backend Engineer II", grade: "L3", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2005", name: "Kiran Babu", designation: "Full Stack Developer", grade: "L4", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2006", name: "Divya Teja", designation: "Senior Systems Analyst", grade: "L3", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2007", name: "Harsha Vardhan", designation: "Engineering Intern", grade: "Intern", status: "Stipend Verified", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2008", name: "Meghana R", designation: "Cloud & DevOps Engineer", grade: "L3", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2009", name: "Devansh Mehta", designation: "Frontend Engineer II", grade: "L2", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
    { id: "EMP-2010", name: "Ananya Roy", designation: "Technical Documentation Lead", grade: "L4", status: "Verified & Approved", payslip: "Ready", attendanceVerified: true },
  ]
};

export const upcomingBirthdaysAndHolidays = {
  birthdays: [
    { name: "Priya Sharma", date: "12 Nov 2026", designation: "Lead UI/UX Designer", daysLeft: 3 },
    { name: "Kiran Babu", date: "18 Nov 2026", designation: "Work Anniversary (4 Years)", daysLeft: 9 },
    { name: "Divya Teja", date: "24 Nov 2026", designation: "Senior Analyst", daysLeft: 15 },
  ],
  holidays: [
    { name: "Diwali (Deepavali Festival)", date: "2026-11-08", day: "Sunday", type: "Mandatory Public Holiday" },
    { name: "Guru Nanak Jayanti", date: "2026-11-24", day: "Tuesday", type: "Gazetted Holiday" },
    { name: "Christmas Day", date: "2026-12-25", day: "Friday", type: "Mandatory Public Holiday" },
    { name: "New Year's Day", date: "2027-01-01", day: "Friday", type: "Optional Holiday" },
    { name: "Republic Day", date: "2027-01-26", day: "Tuesday", type: "National Holiday" }
  ]
};

export const recentTeamActivities = [
  { id: "ACT-1", user: "Ravi Kumar", action: "submitted casual leave request for 12-13 Nov", time: "10 mins ago", type: "leave", postedAt: "2026-11-12T10:50:00+05:30" },
  { id: "ACT-2", user: "Priya Sharma", action: "marked task 'Design Regularization Workflow' as In Review", time: "25 mins ago", type: "task", postedAt: "2026-11-12T10:35:00+05:30" },
  { id: "ACT-3", user: "Meghana R", action: "deployed AWS CloudWatch alerts for cluster memory", time: "1 hour ago", type: "devops", postedAt: "2026-11-12T10:00:00+05:30" },
  { id: "ACT-4", user: "Anil Reddy", action: "submitted attendance regularization for 07 Nov punch-out", time: "2 hours ago", type: "attendance", postedAt: "2026-11-12T09:00:00+05:30" },
  { id: "ACT-5", user: "Mounika S. Rao", action: "approved Sneha Rao's earned leave application", time: "Yesterday", type: "approval", postedAt: "2026-11-11T16:30:00+05:30" }
];

export const initialAnnouncements = [
  {
    id: 'ANN-2026-021',
    type: 'announcement',
    title: 'Scheduled HRMS Portal Maintenance',
    body: 'The HRMS portal will be unavailable during a planned maintenance window while infrastructure updates are applied. Please save any work before the maintenance begins.',
    guidelines: ['Save work before the maintenance window.', 'Attendance check-in and check-out remain available from the mobile app.'],
    attachments: [{ name: 'Maintenance window details.pdf', url: '#' }],
    priority: 'High',
    postedAt: '2026-11-13T08:00:00+05:30',
    author: 'IT Operations',
    department: 'Technology',
    audience: 'company'
  },
  {
    id: 'ANN-2026-020',
    type: 'announcement',
    title: 'Benefits Enrollment Closes November 28',
    body: 'Please review your health and wellness benefit selections before the annual enrollment window closes. Contact HR if you need help with dependent information or plan options.',
    guidelines: ['Review dependent details before submission.', 'Changes take effect from December 1, 2026.'],
    attachments: [],
    priority: 'Normal',
    postedAt: '2026-11-12T10:30:00+05:30',
    author: 'HR Department',
    department: 'People & Culture',
    audience: 'company'
  },
  {
    id: 'ANN-TL1042-006',
    type: 'announcement',
    title: 'Core Engineering Sprint Planning',
    body: 'Sprint 47 planning is scheduled for Monday morning. Please update estimates and flag dependencies in your assigned project boards before the meeting.',
    guidelines: ['Update task estimates by 9:00 AM Monday.', 'Bring any cross-team dependencies to the planning session.'],
    attachments: [],
    priority: 'Normal',
    postedAt: '2026-11-12T15:00:00+05:30',
    author: 'Engineering Management',
    department: 'Core Engineering',
    audience: 'team',
    teamLeadId: 'TL-1042'
  }
];
