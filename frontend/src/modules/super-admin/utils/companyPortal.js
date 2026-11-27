import {
  isCompanyLicenseActive,
  readLicenseRecords,
  readTenantRecords,
} from "./licenseKeys";

export const CURRENT_COMPANY_KEY = "hrms.company.currentTenant.v1";

export const MODULES_BY_PLAN = {
  Starter: [
    "Dashboard",
    "Employee Management",
    "Attendance",
    "Leave Management",
  ],
  Professional: [
    "Dashboard",
    "Employee Management",
    "Payroll",
    "Attendance",
    "Leave Management",
    "Recruitment",
    "Performance",
    "Reports & Analytics",
    "Document Management",
  ],
  Enterprise: [
    "Dashboard",
    "Employee Management",
    "Payroll",
    "Attendance",
    "Leave Management",
    "Recruitment",
    "Performance",
    "Reports & Analytics",
    "Document Management",
    "API Access",
    "Audit Logs",
  ],
};

export function getModulesForPlan(planName) {
  try {
    const savedPlans = JSON.parse(localStorage.getItem("hrms.superadmin.plans.v2") || "null");
    if (Array.isArray(savedPlans)) {
      const plan = savedPlans.find((item) => (item.tier || item.name) === planName);
      if (Array.isArray(plan?.features)) return plan.features;
    }
  } catch {
    return MODULES_BY_PLAN[planName] || MODULES_BY_PLAN.Starter;
  }
  return MODULES_BY_PLAN[planName] || MODULES_BY_PLAN.Starter;
}

export const COMPANY_WIDGETS = [
  { name: "Employee overview", module: "Employee Management" },
  { name: "Attendance", module: "Attendance" },
  { name: "Payroll", module: "Payroll" },
  { name: "Leave requests", module: "Leave Management" },
  { name: "Recruitment", module: "Recruitment" },
  { name: "Performance", module: "Performance" },
];

export const DEFAULT_EMAIL_TEMPLATES = {
  "Welcome Email": {
    subject: "Welcome to {{company_name}}",
    body: "Hello {{employee_name}},\n\nWelcome to {{company_name}}. Get started here: {{action_link}}\n\nDate: {{date}}",
  },
  "Employee Invitation": {
    subject: "You are invited to {{company_name}}",
    body: "Hello {{employee_name}},\n\nJoin {{company_name}} using this link: {{action_link}}\n\nDate: {{date}}",
  },
  "Password Reset": {
    subject: "Reset your {{company_name}} password",
    body: "Hello {{employee_name}},\n\nReset your password here: {{action_link}}\n\nDate: {{date}}",
  },
  "Leave Approval": {
    subject: "Your leave request was approved",
    body: "Hello {{employee_name}},\n\nYour leave request has been approved by {{company_name}} on {{date}}.",
  },
  "Leave Rejection": {
    subject: "Your leave request update",
    body: "Hello {{employee_name}},\n\nYour leave request was not approved by {{company_name}} on {{date}}.",
  },
  "Payroll Notification": {
    subject: "Payroll update from {{company_name}}",
    body: "Hello {{employee_name}},\n\nYour payroll information is ready. View details: {{action_link}}\n\nDate: {{date}}",
  },
  "Attendance Notification": {
    subject: "Attendance update from {{company_name}}",
    body: "Hello {{employee_name}},\n\nThere is an attendance update for {{date}}. View it here: {{action_link}}",
  },
  "General Company Notification": {
    subject: "A message from {{company_name}}",
    body: "Hello {{employee_name}},\n\nPlease review this company update: {{action_link}}\n\nDate: {{date}}",
  },
};

export const DEFAULT_COMPANY_THEME = {
  logos: { sidebar: "", login: "" },
  logoWidth: 156,
  logoPosition: "left",
  colors: {
    primary: "#6ee7d0",
    secondary: "#9b8cff",
    accent: "#48bfa9",
    background: "#071820",
    sidebar: "#0b222a",
    header: "#0d252d",
    button: "#6ee7d0",
    text: "#ecfbf8",
  },
  font: { family: "Manrope", size: 14, weight: 500 },
  layout: {
    sidebarPosition: "Left",
    sidebarWidth: 236,
    headerLayout: "Standard",
    contentLayout: "Fluid",
    cardLayout: "Grid",
    spacing: "Comfortable",
    density: "Comfortable",
  },
  menu: {
    style: "Vertical Sidebar",
    background: "#0b222a",
    active: "#6ee7d0",
    text: "#c5d8d6",
    iconStyle: "Standard",
  },
  widgets: COMPANY_WIDGETS.map((widget) => widget.name),
  loginPage: {
    background: "",
    logoWidth: 156,
    logoPosition: "center",
    welcomeMessage: "Welcome to your workspace",
    heading: "People first. Work better.",
    description: "Sign in to access your company HR workspace.",
    buttonStyle: "Rounded",
    footerText: "© {{year}} {{company_name}}",
  },
  domain: { subdomain: "", status: "Not Configured" },
  emailTemplates: DEFAULT_EMAIL_TEMPLATES,
};

function themeStorageKey(tenantId) {
  return `hrms.company.${tenantId}.theme.v1`;
}

function mergeTheme(saved) {
  return {
    ...DEFAULT_COMPANY_THEME,
    ...saved,
    logos: { ...DEFAULT_COMPANY_THEME.logos, ...(saved?.logos || {}) },
    colors: { ...DEFAULT_COMPANY_THEME.colors, ...(saved?.colors || {}) },
    font: { ...DEFAULT_COMPANY_THEME.font, ...(saved?.font || {}) },
    layout: { ...DEFAULT_COMPANY_THEME.layout, ...(saved?.layout || {}) },
    menu: { ...DEFAULT_COMPANY_THEME.menu, ...(saved?.menu || {}) },
    loginPage: { ...DEFAULT_COMPANY_THEME.loginPage, ...(saved?.loginPage || {}) },
    domain: { ...DEFAULT_COMPANY_THEME.domain, ...(saved?.domain || {}) },
    emailTemplates: {
      ...DEFAULT_EMAIL_TEMPLATES,
      ...(saved?.emailTemplates || {}),
    },
  };
}

export function readCompanyTheme(tenantId) {
  try {
    const saved = JSON.parse(localStorage.getItem(themeStorageKey(tenantId)) || "null");
    return mergeTheme(saved && typeof saved === "object" ? saved : {});
  } catch {
    return mergeTheme({});
  }
}

export function saveCompanyTheme(tenantId, theme) {
  localStorage.setItem(themeStorageKey(tenantId), JSON.stringify(mergeTheme(theme)));
  window.dispatchEvent(new Event("hrms:company-theme-updated"));
}

export function getCompanyById(tenantId) {
  return readTenantRecords().find((tenant) => tenant.id === tenantId) || null;
}

export function getCurrentCompany() {
  try {
    const tenantId = sessionStorage.getItem(CURRENT_COMPANY_KEY);
    if (!tenantId) return null;
    const tenant = getCompanyById(tenantId);
    const licenses = readLicenseRecords();
    return tenant &&
      tenant.status === "Active" &&
      isCompanyLicenseActive(tenantId, licenses)
      ? { tenant, licenses }
      : null;
  } catch {
    return null;
  }
}

export function getEnabledModules(tenant) {
  const planModules = getModulesForPlan(tenant?.plan);
  const selectedModules = Array.isArray(tenant?.enabledModules)
    ? tenant.enabledModules
    : planModules;
  const permissions = Array.isArray(tenant?.permissions)
    ? tenant.permissions
    : selectedModules;
  return planModules.filter(
    (module) => selectedModules.includes(module) && permissions.includes(module)
  );
}

export function readCompanyActivation(tenantId) {
  const license = readLicenseRecords().find((item) => item.tenantId === tenantId);
  return Boolean(license?.activatedAt);
}
