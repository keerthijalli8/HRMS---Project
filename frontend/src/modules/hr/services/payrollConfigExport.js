/**
 * Payroll Configuration Export Service
 * Exports company-wise compensation, allowances, health insurance, and employee structures
 * for downstream ingestion by the Payroll Engine & Compliance team.
 */

import {
  getCompanyById,
  getComponents,
  getHealthInsurance,
  getEnrollments,
  getEmployeeStructures
} from '../data/companyStore.js';

/**
 * Builds the canonical Payroll Configuration JSON payload for a specific company
 * @param {string} companyId - e.g. "COMP-X", "COMP-Y", "COMP-Z"
 * @returns {Object} JSON payload conforming to docs/payroll-config-schema.md
 */
export const buildPayrollConfigExport = (companyId = "NEX-IND") => {
  const company = getCompanyById(companyId);
  const components = getComponents(companyId);
  const healthInsurance = getHealthInsurance(companyId);
  const enrollments = getEnrollments(companyId);
  const employeeStructures = getEmployeeStructures(companyId);

  return {
    company: {
      id: company.id,
      code: company.code,
      name: company.name,
      state: company.state,
      city: company.city
    },
    components,
    healthInsurance,
    enrollments,
    employeeStructures,
    exportedAt: new Date().toISOString()
  };
};

/**
 * Initiates a browser file download of the company's payroll configuration JSON file
 * @param {string} companyId - e.g. "COMP-X"
 */
export const downloadPayrollConfigJson = (companyId = "NEX-IND") => {
  const exportData = buildPayrollConfigExport(companyId);
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const filename = `payroll-config-${exportData.company.code || companyId}.json`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
