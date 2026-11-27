import { initialTeamMembers, currentTeamLead } from '../data/mockData.js';

// Compatibility adapter for the supplied payroll screens. Records remain demo data
// and are never loaded from a server.
export const EMPLOYEES = [currentTeamLead, ...initialTeamMembers].map((person) => ({
  ...person,
  department: person.department || person.dept || 'Unassigned',
  designation: person.designation || person.role || 'Team Lead',
  status: 'Active',
  grossSalary: person.grossSalary || '₹0',
  joiningDate: person.joiningDate || person.joined || '—',
}));

export const resolveEmployeeIdentity = (employee) => {
  if (!employee) return employee;
  const master = EMPLOYEES.find((candidate) => String(candidate.id || candidate.employeeId) === String(employee.id || employee.employeeId));
  return {
    ...master,
    ...employee,
    id: employee.id || employee.employeeId || master?.id || master?.employeeId,
    name: employee.name || master?.name || 'Unknown employee',
    department: employee.department || employee.dept || master?.department || master?.dept || 'Unassigned',
    designation: employee.designation || employee.role || master?.designation || 'Team Lead',
  };
};

export const sameDepartment = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

export const getDepartmentOptions = () => [...new Set(EMPLOYEES.map((employee) => employee.department).filter(Boolean))].sort();
