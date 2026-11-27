// src/modules/hr/routes.js
// Canonical HR module route mapping under /hr/*

export const HR_ROUTE_PATHS = {
  dashboard: '/hr/dashboard',
  overview: '/hr/dashboard',
  'my-tasks': '/hr/my-tasks',
  tasks: '/hr/my-tasks',
  'employee-management': '/hr/employee-management',
  employees: '/hr/employee-management',
  recruitment: '/hr/recruitment',
  hiring: '/hr/recruitment',
  offboarding: '/hr/offboarding',
  exit: '/hr/offboarding',
  teams: '/hr/teams',
  team: '/hr/teams',
  attendance: '/hr/attendance',
  'my-attendance': '/hr/attendance',
  'attendance-desk': '/hr/attendance',
  'shifts-roster': '/hr/shifts-roster',
  shifts: '/hr/shifts-roster',
  roster: '/hr/shifts-roster',
  leave: '/hr/leave',
  holidays: '/hr/leave?tab=holidays',
  lop: '/hr/lop',
  payroll: '/hr/payroll',
  'benefits-allowances': '/hr/benefits-allowances',
  benefits: '/hr/benefits-allowances',
  bonus: '/hr/benefits-allowances?tab=bonus',
  'payroll/bonus': '/hr/benefits-allowances?tab=bonus',
  onboarding: '/hr/onboarding',
  performance: '/hr/performance',
  documents: '/hr/documents',
  reports: '/hr/reports',
  'audit-logs': '/hr/audit-logs',
  audit: '/hr/audit-logs',
  announcements: '/hr/announcements',
  notifications: '/hr/notifications',
  'hr-settings': '/hr/hr-settings',
  settings: '/hr/hr-settings',
  hrsettings: '/hr/hr-settings',
  approvals: '/hr/approvals',
  'my-profile': '/hr/my-profile',
  'account-settings': '/hr/account-settings',
};

export const HR_ROUTE_LABELS = {
  dashboard: 'Overview',
  'my-tasks': 'My Tasks',
  'employee-management': 'Employee Management',
  recruitment: 'Recruitment',
  offboarding: 'Offboarding',
  teams: 'Teams',
  attendance: 'Attendance',
  'shifts-roster': 'Shifts & Roster',
  leave: 'Leave Management',
  lop: 'LOP Management',
  payroll: 'Payroll',
  'benefits-allowances': 'Benefits & Allowances',
  onboarding: 'Onboarding',
  performance: 'Performance',
  documents: 'Documents',
  reports: 'Reports & Analytics',
  'audit-logs': 'Audit Logs',
  announcements: 'Announcements',
  notifications: 'Notifications',
  'hr-settings': 'HR Settings',
  approvals: 'Approvals',
  'my-profile': 'My Profile',
  'account-settings': 'Account Settings',
};

export function resolveHrPath(target) {
  if (!target) return '/hr/dashboard';
  const raw = String(target).trim();
  const [rawPath, rawQuery] = raw.split('?');
  const cleanedPath = rawPath.replace(/\/+$/, '');
  const query = rawQuery ? `?${rawQuery}` : '';

  if (cleanedPath === '/hr' || cleanedPath === '') {
    return `/hr/dashboard${query}`;
  }
  if (cleanedPath.startsWith('/hr/')) {
    return `${cleanedPath}${query}`;
  }

  const key = cleanedPath.replace(/^\/+/, '');
  if (HR_ROUTE_PATHS[key]) {
    const mapped = HR_ROUTE_PATHS[key];
    if (query && !mapped.includes('?')) {
      return `${mapped}${query}`;
    }
    return mapped;
  }

  return `/hr/${key}${query}`;
}

export function getHrRouteKey(pathname) {
  const rel = String(pathname || '')
    .replace(/^\/hr\/?/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (!rel || rel === 'overview' || rel === 'dashboard') return 'dashboard';
  if (rel.startsWith('teams') || rel.startsWith('team')) return 'teams';
  if (rel.startsWith('attendance') || rel === 'my-attendance' || rel === 'attendance-desk') return 'attendance';
  if (rel === 'tasks') return 'my-tasks';
  if (rel === 'employees') return 'employee-management';
  if (rel === 'hiring') return 'recruitment';
  if (rel === 'exit') return 'offboarding';
  if (rel === 'shifts' || rel === 'roster') return 'shifts-roster';
  if (rel === 'holidays') return 'leave';
  if (rel === 'benefits' || rel === 'bonus' || rel === 'payroll/bonus') return 'benefits-allowances';
  if (rel === 'audit') return 'audit-logs';
  if (rel === 'settings' || rel === 'hrsettings') return 'hr-settings';
  return rel;
}
