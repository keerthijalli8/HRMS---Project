import employeeData from "./data/employeeData.js";

const fallbackEmployee = {
  id: "EMP-0016",
  name: "Latha Reddy",
  role: "HR Executive",
  designation: "HR Executive",
  department: "Human Resources",
  joiningDate: "01 Jan 2021",
};

export const EMPLOYEES = [
  ...employeeData.map((employee) => ({
    ...employee,
    designation: employee.designation || employee.role,
    joiningDate: employee.joiningDate || "01 Jan 2021",
  })),
  fallbackEmployee,
];

export function getDepartmentOptions() {
  return [...new Set(EMPLOYEES.map((employee) => employee.department).filter(Boolean))].sort();
}

export function resolveEmployeeIdentity(employee) {
  const id = String(employee?.id || "");
  const match = EMPLOYEES.find((candidate) => candidate.id === id);
  return match ? { ...match, ...employee } : employee;
}

export function sameDepartment(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}
