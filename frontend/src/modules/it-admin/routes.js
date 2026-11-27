// src/modules/it-admin/routes.js
// Canonical IT Administration routes under /it-admin/*

export const IT_ADMIN_ROUTE_PATHS = {
  dashboard: '/it-admin/dashboard',
  accounts: '/it-admin/accounts',
  access: '/it-admin/access',
  permissions: '/it-admin/access',
  inventory: '/it-admin/inventory',
  hardwareSoftware: '/it-admin/inventory',
  'hardware-software': '/it-admin/inventory',
  allocate: '/it-admin/allocate',
  desk: '/it-admin/desk',
  licences: '/it-admin/licences',
  licenses: '/it-admin/licences',
  events: '/it-admin/events',
  reports: '/it-admin/reports',
  help: '/it-admin/help',
  settings: '/it-admin/settings',
};

export function resolveItAdminPath(target) {
  if (!target) return '/it-admin/dashboard';
  const raw = String(target).trim();
  if (raw.startsWith('/it-admin/')) return raw;
  const key = raw.replace(/^\/+/, '');
  return IT_ADMIN_ROUTE_PATHS[key] || '/it-admin/dashboard';
}

export function getItAdminPageId(pathname) {
  const rel = String(pathname || '')
    .replace(/^\/it-admin\/?/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .split('/')[0];

  if (!rel || rel === 'dashboard') return 'dashboard';
  if (rel === 'permissions') return 'access';
  if (rel === 'hardwareSoftware' || rel === 'hardware-software') return 'inventory';
  if (rel === 'licenses') return 'licences';
  if (IT_ADMIN_ROUTE_PATHS[rel]) return rel;
  return 'dashboard';
}
