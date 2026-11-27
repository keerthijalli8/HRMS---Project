/**
 * Official India Statutory Compliance Configuration (statutory.js)
 * Applicable for a Hyderabad, Telangana employer.
 * 
 * Central rules configuration defining recurring monthly and periodic compliance items,
 * statutory authorities, portal endpoints, and payroll coverage periods.
 */

export const STATUTORY_CONFIG = [
  // 1. Monthly EPF Contribution & ECR Return (15th of every month)
  {
    id: "epf_ecr",
    name: "EPF Contribution & ECR Return",
    shortName: "EPF & ECR Return",
    frequency: "monthly",
    dayOfMonth: 15,
    authority: "Employees' Provident Fund Organisation (EPFO)",
    authorityShort: "EPFO Unified Portal",
    portalUrl: "https://unifiedportal-emp.epfindia.gov.in",
    description: "Monthly electronic challan-cum-return (ECR) filing & statutory provident fund remittance under EPF & MP Act 1952.",
    coverageType: "previous_month_payroll",
    act: "EPF & MP Act, 1952"
  },
  // 2. Monthly ESIC Contribution (15th of every month)
  {
    id: "esic_monthly",
    name: "ESIC Monthly Contribution",
    shortName: "ESIC Contribution",
    frequency: "monthly",
    dayOfMonth: 15,
    authority: "Employees' State Insurance Corporation (ESIC)",
    authorityShort: "ESIC Employer Portal",
    portalUrl: "https://www.esic.gov.in",
    description: "Monthly social security health insurance contribution for eligible employees (gross <= ?21,000/mo).",
    coverageType: "previous_month_payroll",
    act: "ESI Act, 1948"
  },
  // 3. Monthly TDS on Salary (Section 192) - 7th of every month
  {
    id: "tds_salary",
    name: "TDS on Salary (Section 192)",
    shortName: "TDS on Salary",
    frequency: "monthly",
    dayOfMonth: 7,
    authority: "Income Tax Department",
    authorityShort: "ITD / TIN-NSDL (Challan ITNS 281)",
    portalUrl: "https://www.incometax.gov.in",
    description: "Deposit of tax deducted at source from employee salaries under Section 192 via Challan ITNS 281.",
    coverageType: "previous_month_payroll",
    act: "Income Tax Act, 1961"
  },
  // 4. Monthly Professional Tax (Telangana) - 10th of every month
  {
    id: "pt_telangana",
    name: "Professional Tax (Telangana)",
    shortName: "Telangana PT",
    frequency: "monthly",
    dayOfMonth: 10,
    authority: "Telangana Commercial Taxes Department (CTD)",
    authorityShort: "Telangana CTD Portal",
    portalUrl: "https://www.tgct.gov.in",
    description: "Monthly state professional tax remittance and Form V return filing under Telangana Professions Tax Act 1987.",
    coverageType: "previous_month_payroll",
    act: "Telangana PT Act, 1987"
  },
  // 5. Quarterly TDS Return Form 24Q
  {
    id: "tds_24q",
    name: "TDS Return (Form 24Q)",
    shortName: "Form 24Q Quarterly Return",
    frequency: "quarterly",
    quarters: [
      { quarter: "Q1", period: "Apr - Jun", dueMonth: 7, dueDay: 31, label: "31 Jul" },
      { quarter: "Q2", period: "Jul - Sep", dueMonth: 10, dueDay: 31, label: "31 Oct" },
      { quarter: "Q3", period: "Oct - Dec", dueMonth: 1, dueDay: 31, label: "31 Jan" },
      { quarter: "Q4", period: "Jan - Mar", dueMonth: 5, dueDay: 31, label: "31 May" }
    ],
    authority: "Income Tax Department (TRACES / TIN-NSDL)",
    authorityShort: "Income Tax TRACES",
    portalUrl: "https://www.incometax.gov.in",
    description: "Quarterly e-TDS statement of tax deducted from salary payments submitted via TRACES utility.",
    coverageType: "quarterly_salary_tds",
    act: "Income Tax Rules, 1962"
  },
  // 6. Annual Form 16 Issue to Employees (15th June)
  {
    id: "form_16",
    name: "Form 16 Issue to Employees",
    shortName: "Form 16 Certificate",
    frequency: "annual",
    dueMonth: 6,
    dueDay: 15,
    authority: "Income Tax Department (TRACES)",
    authorityShort: "TRACES Portal",
    portalUrl: "https://www.incometax.gov.in",
    description: "Annual certificate of tax deducted on salary under Section 203 issued to all TDS-deducted staff.",
    coverageType: "previous_financial_year",
    act: "Income Tax Act, 1961"
  },
  // 7. Telangana Labour Welfare Fund (Annual)
  {
    id: "tlwf",
    name: "Telangana Labour Welfare Fund",
    shortName: "Telangana LWF",
    frequency: "annual_variable",
    note: "Annual, verify the due date on the Telangana Labour Department portal",
    authority: "Telangana Labour Department",
    authorityShort: "Telangana Labour Portal",
    portalUrl: "https://labour.telangana.gov.in",
    description: "Statutory contribution towards employee welfare board under the Telangana Labour Welfare Fund Act.",
    coverageType: "annual_contribution",
    act: "Telangana Labour Welfare Fund Act, 1987"
  }
];

export const STATUTORY_STORAGE_KEY = "hrms_statutory_filed_v1";
export const STATUTORY_EVENT_NAME = "hrms_statutory_updated";
export const STATUTORY_DISCLAIMER = "Due dates are standard statutory dates for a Telangana employer. Verify with the latest government notifications and your compliance consultant.";
