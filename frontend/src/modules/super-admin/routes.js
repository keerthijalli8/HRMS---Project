// src/modules/super-admin/routes.js
// Canonical Super Admin routes under /super-admin/*

export const SUPERADMIN_BASE = '/super-admin';

export const SUPERADMIN_PAGE_NAMES = {
  '/super-admin': 'Dashboard',
  '/super-admin/dashboard': 'Dashboard',
  '/super-admin/tenants': 'Tenant Management',
  '/super-admin/organizations': 'Organization Details',
  '/super-admin/subscriptions': 'Subscription Details',
  '/super-admin/plans': 'Plan Management',
  '/super-admin/billing': 'Billing',
  '/super-admin/modules': 'Module Management',
  '/super-admin/platform-users': 'Platform Users',
  '/super-admin/analytics': 'Usage Analytics',
  '/super-admin/monitoring': 'Monitoring',
  '/super-admin/security': 'Security & Audit Logs',
  '/super-admin/security-audit-logs': 'Security & Audit Logs',
  '/super-admin/support': 'Support Management',
  '/super-admin/settings': 'Settings',
  '/super-admin/settings/general': 'Settings',
  '/super-admin/settings/profile': 'Settings',
  '/super-admin/settings/roles': 'Settings',
  '/super-admin/settings/security': 'Settings',
};

export function resolveSuperAdminPath(target) {
  if (!target || target === '/') return '/super-admin/dashboard';
  const raw = String(target).trim();
  const [rawPath, rawQuery] = raw.split('?');
  const cleaned = rawPath.replace(/\/+$/, '') || '/';
  const query = rawQuery ? `?${rawQuery}` : '';

  if (cleaned === '/super-admin' || cleaned === '/') {
    return `/super-admin/dashboard${query}`;
  }
  if (cleaned.startsWith('/super-admin/')) {
    return `${cleaned}${query}`;
  }
  if (cleaned === '/users') {
    return `/super-admin/platform-users${query}`;
  }
  if (cleaned === '/security') {
    return `/super-admin/security-audit-logs${query}`;
  }
  return `/super-admin${cleaned.startsWith('/') ? '' : '/'}${cleaned}${query}`;
}
