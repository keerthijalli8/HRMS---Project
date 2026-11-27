import initialEmployeeData from "./employeeData";
import { readEmployeeRecords } from "../services/employeeRecords";

const getStatus = (employee) => {
  const status = employee.status || employee.employmentStatus || "Active";
  return typeof status === "string" ? status : status.label || status.name || "Active";
};

export function getOrganizationEmployees(records = readEmployeeRecords()) {
  const defaultsById = new Map(initialEmployeeData.map((employee) => [employee.id, employee]));
  const mergedRecords = records.map((record) => ({
    ...(defaultsById.get(record.id) || {}),
    ...record,
  }));
  const managerId = mergedRecords.find((employee) => employee.role === "Manager")?.id || "";
  const administrationId = mergedRecords.find((employee) => employee.role === "Administration")?.id || "";
  const hrIds = mergedRecords.filter((employee) => employee.role === "HR").map((employee) => employee.id);
  const teamLeaderIds = mergedRecords
    .filter((employee) => employee.role === "Team Leader")
    .map((employee) => employee.id);

  return mergedRecords.map((employee) => {
    const role = employee.role || employee.designation || "";
    const index = mergedRecords.findIndex((record) => record.id === employee.id);
    const hrId = employee.hrId ||
      (role === "Team Leader" ? hrIds[index % Math.max(hrIds.length, 1)] : "");
    const teamLeaderId = employee.teamLeaderId ||
      (role === "Employee" ? teamLeaderIds[index % Math.max(teamLeaderIds.length, 1)] : "");

    return {
      ...employee,
      role,
      managerId: role === "Manager" || role === "Administration" ? "" : employee.managerId || managerId,
      administrationId: role === "Manager" ? employee.administrationId || administrationId : employee.administrationId || "",
      hrId: role === "HR" ? "" : hrId,
      teamLeaderId: role === "Team Leader" ? employee.id : teamLeaderId,
      phone: employee.phone || employee.phoneNumber || employee.mobile || "Not provided",
      email: employee.email || "Not provided",
      status: getStatus(employee),
    };
  });
}
