// src/auth/roles.js
// Canonical role priority, normalization, and dashboard routing configuration.

export const ROLE_PRIORITY = [
  'SUPER_ADMIN',
  'ADMIN',
  'IT_ADMIN',
  'HR',
  'MANAGER',
  'TEAM_LEAD',
  'EMPLOYEE'
];

export const ROLE_META = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    shortLabel: 'Super Admin',
    path: '/super-admin/dashboard',
    description: 'Platform tenants, plans, billing & system governance'
  },
  ADMIN: {
    label: 'Organization Admin',
    shortLabel: 'Admin',
    path: '/admin/dashboard',
    description: 'Organization directory, workflows, HR config & branding'
  },
  IT_ADMIN: {
    label: 'IT Administration',
    shortLabel: 'IT Admin',
    path: '/it-admin/dashboard',
    description: 'User accounts, MFA access, assets, software & helpdesk'
  },
  HR: {
    label: 'HR Operations',
    shortLabel: 'HR',
    path: '/hr/dashboard',
    description: 'People operations, onboarding, payroll, leave & compliance'
  },
  MANAGER: {
    label: 'Manager Desk',
    shortLabel: 'Manager',
    path: '/manager/dashboard',
    description: 'Department approvals, OKRs, shifts, teams & reports'
  },
  TEAM_LEAD: {
    label: 'Team Lead Desk',
    shortLabel: 'Team Lead',
    path: '/team-lead/dashboard',
    description: 'Squad attendance, task tracking, approvals & reviews'
  },
  EMPLOYEE: {
    label: 'Employee Portal',
    shortLabel: 'Employee',
    path: '/employee/dashboard',
    description: 'Self-service attendance, leave, payslips & profile'
  }
};

const ROLE_ALIASES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPERADMIN: 'SUPER_ADMIN',
  SUPER_ADMINISTRATOR: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ADMINISTRATOR: 'ADMIN',
  ORG_ADMIN: 'ADMIN',
  IT_ADMIN: 'IT_ADMIN',
  ITADMIN: 'IT_ADMIN',
  IT_ADMINISTRATOR: 'IT_ADMIN',
  IT_ADMINISTRATION: 'IT_ADMIN',
  HR: 'HR',
  HR_ADMIN: 'HR',
  HR_MANAGER: 'HR',
  HRBP: 'HR',
  MANAGER: 'MANAGER',
  MGR: 'MANAGER',
  TEAM_LEAD: 'TEAM_LEAD',
  TEAMLEAD: 'TEAM_LEAD',
  TL: 'TEAM_LEAD',
  EMPLOYEE: 'EMPLOYEE',
  STAFF: 'EMPLOYEE',
  USER: 'EMPLOYEE'
};

export function normalizeRoleToken(role) {
  if (!role) return null;
  const cleaned = String(role)
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, '_');
  return ROLE_ALIASES[cleaned] || (ROLE_PRIORITY.includes(cleaned) ? cleaned : null);
}

/**
 * Normalizes user.roles (array) or user.role (string) into a deduplicated,
 * priority-ordered array of canonical roles.
 */
export function normalizeRoles(rawUserOrRoles) {
  let rawList = [];

  if (Array.isArray(rawUserOrRoles)) {
    rawList = rawUserOrRoles;
  } else if (rawUserOrRoles && typeof rawUserOrRoles === 'object') {
    if (Array.isArray(rawUserOrRoles.roles)) {
      rawList = rawUserOrRoles.roles;
    } else if (typeof rawUserOrRoles.roles === 'string') {
      rawList = rawUserOrRoles.roles.split(',');
    } else if (rawUserOrRoles.role) {
      rawList = Array.isArray(rawUserOrRoles.role)
        ? rawUserOrRoles.role
        : String(rawUserOrRoles.role).split(',');
    }
  } else if (typeof rawUserOrRoles === 'string') {
    rawList = rawUserOrRoles.split(',');
  }

  const normalizedSet = new Set();
  for (const item of rawList) {
    const canonical = normalizeRoleToken(item);
    if (canonical) normalizedSet.add(canonical);
  }

  if (normalizedSet.size === 0) {
    return ['EMPLOYEE'];
  }

  return ROLE_PRIORITY.filter(role => normalizedSet.has(role));
}

export function getHighestPriorityRole(roles) {
  const normalized = normalizeRoles(roles);
  return normalized[0] || 'EMPLOYEE';
}

export function getHomeRouteForRoles(roles) {
  const topRole = getHighestPriorityRole(roles);
  return ROLE_META[topRole]?.path || '/employee/dashboard';
}

export function getRouteForRole(role) {
  const canonical = normalizeRoleToken(role) || 'EMPLOYEE';
  return ROLE_META[canonical]?.path || '/employee/dashboard';
}

export function hasRequiredRole(userRoles, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const normalizedUser = normalizeRoles(userRoles);
  return allowedRoles.some(allowed => {
    const canonical = normalizeRoleToken(allowed);
    return canonical ? normalizedUser.includes(canonical) : false;
  });
}

export function getRoleFromPath(pathname) {
  const path = String(pathname || '').toLowerCase();
  for (const role of ROLE_PRIORITY) {
    const prefix = `/${role.toLowerCase().replace(/_/g, '-')}`;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}
