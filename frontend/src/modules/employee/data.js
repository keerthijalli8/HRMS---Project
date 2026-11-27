// src/data.js
// Shared employees and utility functions for Finance & HRMS modules.

export const EMPLOYEES = [
  {
    id: "EMP-1187",
    name: "Lokesh Kumar",
    role: "Frontend Developer",
    designation: "Frontend Developer",
    department: "Engineering",
    location: "Hyderabad",
    status: "Active",
    joiningDate: "2023-01-03",
    email: "aarav.mehta@company.in",
    bankName: "HDFC Bank",
    accountNumber: "•••• 4892",
    pan: "ABCDE1234F",
    uan: "1009841289"
  },
  {
    id: "EMP-1021",
    name: "Aarav Nambiar",
    role: "Staff Software Engineer",
    designation: "Staff Software Engineer",
    department: "Engineering",
    location: "Hyderabad",
    status: "Active",
    joiningDate: "2024-01-01",
    email: "aarav.nambiar@company.in",
    bankName: "HDFC Bank",
    accountNumber: "•••• 1289",
    pan: "DEMO-PAN-0001",
    uan: "1009841290"
  },
  {
    id: "EMP-1022",
    name: "Sunaina Pillai",
    role: "Head of Product Design",
    designation: "Head of Product Design",
    department: "Product Design",
    location: "Bengaluru",
    status: "Active",
    joiningDate: "2023-03-15",
    email: "sunaina.pillai@company.in",
    bankName: "ICICI Bank",
    accountNumber: "•••• 6543",
    pan: "DEMO-PAN-0002",
    uan: "1009841291"
  },
  {
    id: "EMP-1023",
    name: "Devendra Rao",
    role: "Principal Architect",
    designation: "Principal Architect",
    department: "Engineering",
    location: "Hyderabad",
    status: "Active",
    joiningDate: "2022-07-01",
    email: "devendra.rao@company.in",
    bankName: "State Bank of India",
    accountNumber: "•••• 9876",
    pan: "DEMO-PAN-0003",
    uan: "1009841292"
  },
  {
    id: "EMP-1024",
    name: "Meera Sen",
    role: "Director of People Ops",
    designation: "Director of People Ops",
    department: "Human Resources",
    location: "Mumbai",
    status: "Active",
    joiningDate: "2022-11-10",
    email: "meera.sen@company.in",
    bankName: "Axis Bank",
    accountNumber: "•••• 4321",
    pan: "DEMO-PAN-0004",
    uan: "1009841293"
  },
  {
    id: "EMP-1025",
    name: "Vikramaditya Bose",
    role: "Security Lead",
    designation: "Security Lead",
    department: "Engineering",
    location: "Bengaluru",
    status: "Active",
    joiningDate: "2023-08-20",
    email: "vikram.bose@company.in",
    bankName: "Kotak Mahindra Bank",
    accountNumber: "•••• 7765",
    pan: "DEMO-PAN-0005",
    uan: "1009841294"
  },
  {
    id: "EMP-0016",
    name: "Latha Reddy",
    role: "HR Executive",
    designation: "HR Executive",
    department: "Human Resources",
    location: "Hyderabad",
    status: "Active",
    joiningDate: "2023-04-12",
    email: "latha.reddy@company.in",
    bankName: "HDFC Bank",
    accountNumber: "•••• 8821",
    pan: "DEMO-PAN-0016",
    uan: "1009841295"
  },
  {
    id: "EMP-1027",
    name: "Priya Nair",
    role: "Engineering Manager",
    designation: "Engineering Manager",
    department: "Engineering",
    location: "Hyderabad",
    status: "Active",
    joiningDate: "2021-06-15",
    email: "priya.nair@company.in",
    bankName: "HDFC Bank",
    accountNumber: "•••• 3341",
    pan: "DEMO-PAN-0027",
    uan: "1009841296"
  },
  {
    id: "EMP-1028",
    name: "Ananya Deshmukh",
    role: "Finance Lead",
    designation: "Finance Lead",
    department: "Finance",
    location: "Mumbai",
    status: "Active",
    joiningDate: "2022-02-18",
    email: "ananya.deshmukh@company.in",
    bankName: "ICICI Bank",
    accountNumber: "•••• 5529",
    pan: "DEMO-PAN-0028",
    uan: "1009841297"
  },
  {
    id: "EMP-1029",
    name: "Rahul Verma",
    role: "Operations Manager",
    designation: "Operations Manager",
    department: "Operations",
    location: "Pune",
    status: "Active",
    joiningDate: "2023-09-01",
    email: "rahul.verma@company.in",
    bankName: "State Bank of India",
    accountNumber: "•••• 9912",
    pan: "DEMO-PAN-0029",
    uan: "1009841298"
  }
];

export function resolveEmployeeIdentity(emp) {
  if (!emp) return null;
  const match = EMPLOYEES.find((e) => e.id === emp.id || e.id === emp.employeeId);
  return {
    ...emp,
    id: emp.id || emp.employeeId || match?.id || 'EMP-UNKNOWN',
    name: emp.name || match?.name || 'Unknown Employee',
    department: emp.department || match?.department || 'Engineering',
    designation: emp.designation || emp.role || match?.designation || 'Specialist',
    role: emp.role || emp.designation || match?.role || 'Specialist',
    location: emp.location || match?.location || 'Hyderabad',
    status: emp.status || match?.status || 'Active',
    bankName: emp.bankName || match?.bankName || 'HDFC Bank',
    accountNumber: emp.accountNumber || match?.accountNumber || '•••• 0000',
    pan: emp.pan || match?.pan || 'DEMO-PAN-0000',
    uan: emp.uan || match?.uan || '1009841200'
  };
}

export function getDepartmentOptions() {
  return [
    'Engineering',
    'Product Design',
    'Finance',
    'Human Resources',
    'Operations',
    'Legal & Compliance'
  ];
}

export function sameDepartment(d1, d2) {
  if (!d1 || !d2) return false;
  if (d1 === 'All' || d2 === 'All') return true;
  return d1.trim().toLowerCase() === d2.trim().toLowerCase();
}
