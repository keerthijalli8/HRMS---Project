export const ROLE_MODULES = [
  'User Profiles',
  'Role Administration',
  'Assets',
  'Helpdesk',
  'Security',
  'Network',
  'Software',
  'Reports',
  'Documents',
  'System Settings'
];

const permissionsFor = (allowedModules) =>
  Object.fromEntries(
    ROLE_MODULES.map((module) => [
      module,
      {
        read: allowedModules.includes(module),
        write: allowedModules.includes(module),
        update: allowedModules.includes(module),
        delete: allowedModules.includes(module)
      }
    ])
  );

export const INITIAL_ROLE_PROFILES = [
  {
    id: 'ROLE-001',
    name: 'Admin',
    tier: 'Admin',
    permissions: permissionsFor(ROLE_MODULES)
  },
  {
    id: 'ROLE-002',
    name: 'IT Admin',
    tier: 'IT Admin',
    permissions: permissionsFor([
      'User Profiles',
      'Assets',
      'Helpdesk',
      'Security',
      'Network',
      'Software',
      'Reports',
      'Documents',
      'System Settings'
    ])
  },
  {
    id: 'ROLE-003',
    name: 'HR Admin',
    tier: 'HR Admin',
    permissions: permissionsFor(['User Profiles', 'Reports', 'Documents'])
  },
  {
    id: 'ROLE-004',
    name: 'Manager',
    tier: 'Manager',
    permissions: permissionsFor(['User Profiles', 'Assets', 'Helpdesk', 'Reports', 'Documents'])
  },
  {
    id: 'ROLE-005',
    name: 'Team Leader',
    tier: 'Team Leader',
    permissions: permissionsFor(['Assets', 'Helpdesk', 'Reports', 'Documents'])
  },
  {
    id: 'ROLE-006',
    name: 'Employee',
    tier: 'Employee',
    permissions: permissionsFor(['Assets', 'Helpdesk', 'Documents'])
  }
];
