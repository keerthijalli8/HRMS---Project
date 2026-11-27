const mainModules = [
  ["Dashboard", "/super-admin/dashboard", "Page"],
  ["Tenant Management", "/super-admin/tenants", "Page"],
  ["Organization Details", "/super-admin/organizations", "Page"],
  ["Subscription Details", "/super-admin/subscriptions", "Page"],
  ["Plan Management", "/super-admin/plans", "Page"],
  ["Billing", "/super-admin/billing", "Page"],
  ["Module Management", "/super-admin/modules", "Page"],
  ["Platform Users", "/super-admin/platform-users", "Page"],
  ["Usage Analytics", "/super-admin/analytics", "Page"],
  ["Monitoring", "/super-admin/monitoring", "Page"],
  ["Security & Audit Logs", "/super-admin/security-audit-logs", "Page"],
  ["Support Management", "/super-admin/support", "Page"],
  ["Settings", "/super-admin/settings?tab=general", "Page"],
];

const nestedPages = [
  ["General Settings", "Settings", "/super-admin/settings?tab=general"],
  ["Profile Settings", "Settings", "/super-admin/settings?tab=profile"],
  ["Roles & Permissions", "Settings", "/super-admin/settings?tab=roles"],
  ["Security Preferences", "Settings", "/super-admin/settings?tab=security"],
  ["Recently Added", "Tenant Management", "/super-admin/tenants?view=recent"],
  ["Pending Approval", "Tenant Management", "/super-admin/tenants?status=pending"],
  ["License Management", "Tenant Management", "/super-admin/tenants?view=licenses"],
  ["Company Activation", "Tenant Management", "/super-admin/tenants?view=activation"],
  ["All Plans", "Plan Management", "/super-admin/plans?tab=plans"],
  ["Features & Limits", "Plan Management", "/super-admin/plans?tab=features"],
  ["Activity History", "Plan Management", "/super-admin/plans?tab=history"],
  ["Invoices", "Billing", "/super-admin/billing?tab=invoices"],
  ["Credits", "Billing", "/super-admin/billing?tab=credits"],
  ["Billing History", "Billing", "/super-admin/billing?tab=history"],
  ["Tenant Access", "Module Management", "/super-admin/modules?tab=tenants"],
  ["Plan Entitlements", "Module Management", "/super-admin/modules?tab=plans"],
  ["Module Activity History", "Module Management", "/super-admin/modules?tab=history"],
  ["Tenant Analytics", "Usage Analytics", "/super-admin/analytics?tab=tenants"],
  ["User Analytics", "Usage Analytics", "/super-admin/analytics?tab=users"],
  ["Module Usage", "Usage Analytics", "/super-admin/analytics?tab=modules"],
  ["Storage & API", "Usage Analytics", "/super-admin/analytics?tab=resources"],
  ["Performance Analytics", "Usage Analytics", "/super-admin/analytics?tab=performance"],
  ["Analytics Reports", "Usage Analytics", "/super-admin/analytics?tab=reports"],
  ["Analytics Activity History", "Usage Analytics", "/super-admin/analytics?tab=history"],
  ["API Monitoring", "Monitoring", "/super-admin/monitoring?tab=api"],
  ["Database Monitoring", "Monitoring", "/super-admin/monitoring?tab=database"],
  ["Background Jobs", "Monitoring", "/super-admin/monitoring?tab=jobs"],
  ["Service Health", "Monitoring", "/super-admin/monitoring?tab=services"],
  ["Incidents & Alerts", "Monitoring", "/super-admin/monitoring?tab=incidents"],
  ["Monitoring Performance", "Monitoring", "/super-admin/monitoring?tab=performance"],
  ["Monitoring History", "Monitoring", "/super-admin/monitoring?tab=history"],
  ["Monitoring Reports", "Monitoring", "/super-admin/monitoring?tab=reports"],
  ["All Audit Logs", "Security & Audit Logs", "/super-admin/security-audit-logs?tab=all"],
  ["Login History", "Security & Audit Logs", "/super-admin/security-audit-logs?tab=login"],
  ["Admin Activities", "Security & Audit Logs", "/super-admin/security-audit-logs?tab=admin"],
  ["Role & Permission Changes", "Security & Audit Logs", "/super-admin/security-audit-logs?tab=roles"],
  ["Security Alerts", "Security & Audit Logs", "/super-admin/security-audit-logs?tab=alerts"],
  ["Support Tickets", "Support Management", "/super-admin/support?tab=tickets"],
  ["Create Ticket", "Support Management", "/super-admin/support?tab=create"],
  ["Tenant Issues", "Support Management", "/super-admin/support?tab=tenants"],
  ["Ticket Assignment", "Support Management", "/super-admin/support?tab=assignment"],
  ["Escalations", "Support Management", "/super-admin/support?tab=escalations"],
  ["SLA Tracking", "Support Management", "/super-admin/support?tab=sla"],
  ["Support History", "Support Management", "/super-admin/support?tab=history"],
  ["Support Reports", "Support Management", "/super-admin/support?tab=reports"],
  ["Platform User Activity History", "Platform Users", "/super-admin/platform-users?tab=history"],
  ["Platform User Roles & Permissions", "Platform Users", "/super-admin/platform-users?tab=roles"],
];

const normalize = (value) => String(value || "")
  .toLowerCase()
  .replace(/[&/]+/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const distance = (left, right) => {
  const matrix = Array.from({ length: left.length + 1 }, (_, row) =>
    Array.from({ length: right.length + 1 }, (_, column) =>
      row === 0 ? column : column === 0 ? row : 0
    )
  );
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
  }
  return matrix[left.length][right.length];
};

export const buildSearchRegistry = (records = []) => [
  ...mainModules.map(([label, path, kind]) => ({
    id: `page-${path}`,
    label,
    path,
    kind,
    searchText: label,
  })),
  ...nestedPages.map(([label, parent, path]) => ({
    id: `submodule-${parent}-${label}`,
    label,
    path,
    kind: "Submodule",
    parent,
    searchText: `${label} ${parent}`,
  })),
  ...records,
];

export const matchesSearch = (item, query) => {
  const term = normalize(query);
  if (!term) return false;
  const haystack = normalize(item.searchText || `${item.label} ${item.parent || ""}`);
  if (haystack.includes(term)) return true;
  const queryWords = term.split(" ").filter(Boolean);
  const haystackWords = haystack.split(" ");
  return queryWords.every((word) => haystackWords.some((candidate) =>
    candidate.startsWith(word) || (word.length > 3 && distance(word, candidate) <= 1)
  ));
};
