export const SYSTEM_APPS = [
  'Email',
  'VPN',
  'GitHub',
  'Jira',
  'ERP',
  'AWS Console',
  'File Server'
];

export const INITIAL_ACCESS_MATRIX = {
  // usr-1: Aman Verma (Staff Frontend)
  'usr-1': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'none', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-2: Priya Nair (Lead DevOps)
  'usr-2': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'granted', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-3: Rohan Deshmukh (Senior Finance)
  'usr-3': { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'none', ERP: 'granted', 'AWS Console': 'none', 'File Server': 'granted' },
  // usr-4: Ananya Iyer (Head of HR)
  'usr-4': { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'granted', ERP: 'granted', 'AWS Console': 'none', 'File Server': 'granted' },
  // usr-5: Vikram Malhotra (VP Sales)
  'usr-5': { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'granted', ERP: 'granted', 'AWS Console': 'none', 'File Server': 'none' },
  // usr-6: Neha Kulkarni (Backend - Suspended)
  'usr-6': { Email: 'none', VPN: 'none', GitHub: 'none', Jira: 'none', ERP: 'none', 'AWS Console': 'none', 'File Server': 'none' },
  // usr-7: Karthik Raja (IT Ops)
  'usr-7': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'granted', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-8: Meera Sen (Design Lead)
  'usr-8': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'none', 'AWS Console': 'none', 'File Server': 'granted' },
  // usr-9: Suresh Reddy (Provisioning)
  'usr-9': { Email: 'requested', VPN: 'requested', GitHub: 'none', Jira: 'none', ERP: 'none', 'AWS Console': 'none', 'File Server': 'none' },
  // usr-10: Deepa Krishnan (Deactivated)
  'usr-10': { Email: 'none', VPN: 'none', GitHub: 'none', Jira: 'none', ERP: 'none', 'AWS Console': 'none', 'File Server': 'none' },
  // usr-11: Arjun Singhal (Security Eng)
  'usr-11': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'granted', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-12: Pooja Chawla (HR)
  'usr-12': { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'granted', ERP: 'none', 'AWS Console': 'none', 'File Server': 'granted' },
  // usr-13: Sameer Joshi (Data Platform)
  'usr-13': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'none', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-14: Aditi Mukhopadhyay (QA Lead)
  'usr-14': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'none', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-15: Gautam Banerjee (Solutions Arch)
  'usr-15': { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'granted', 'AWS Console': 'granted', 'File Server': 'granted' },
  // usr-16: Shreya Bhat (Mobile Eng - Provisioning)
  'usr-16': { Email: 'requested', VPN: 'requested', GitHub: 'requested', Jira: 'requested', ERP: 'none', 'AWS Console': 'none', 'File Server': 'none' }
};

export const ROLE_PRESETS = {
  Developer: { Email: 'granted', VPN: 'granted', GitHub: 'granted', Jira: 'granted', ERP: 'none', 'AWS Console': 'granted', 'File Server': 'granted' },
  Finance: { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'none', ERP: 'granted', 'AWS Console': 'none', 'File Server': 'granted' },
  Support: { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'granted', ERP: 'none', 'AWS Console': 'none', 'File Server': 'granted' },
  'HR / People': { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'granted', ERP: 'granted', 'AWS Console': 'none', 'File Server': 'granted' },
  'Sales & Presales': { Email: 'granted', VPN: 'granted', GitHub: 'none', Jira: 'granted', ERP: 'granted', 'AWS Console': 'none', 'File Server': 'none' },
  RevokeAll: { Email: 'none', VPN: 'none', GitHub: 'none', Jira: 'none', ERP: 'none', 'AWS Console': 'none', 'File Server': 'none' }
};

export const IT_ADMIN_ROLE_PERMISSIONS = [
  // 8 ALLOW PERMISSIONS
  {
    id: 'perm-1',
    action: 'Create IT accounts',
    permission: 'Allow',
    category: 'User Account Management',
    description: 'Provision new employee platform accounts, directories, and credentials',
    riskLevel: 'Privileged',
    enforcement: 'Automated audit log'
  },
  {
    id: 'perm-2',
    action: 'Update IT accounts',
    permission: 'Allow',
    category: 'User Account Management',
    description: 'Modify employee profiles, departmental tags, and identity attributes',
    riskLevel: 'Standard',
    enforcement: 'Change tracking active'
  },
  {
    id: 'perm-3',
    action: 'Suspend IT accounts',
    permission: 'Allow',
    category: 'User Account Management',
    description: 'Immediate emergency lockout of compromised, offboarding, or paused accounts',
    riskLevel: 'Critical',
    enforcement: 'Requires admin MFA'
  },
  {
    id: 'perm-4',
    action: 'Assign application access',
    permission: 'Allow',
    category: 'Access Governance',
    description: 'Grant or modify technical access to enterprise systems, SaaS, and cloud consoles',
    riskLevel: 'Privileged',
    enforcement: 'Dual-approval workflow'
  },
  {
    id: 'perm-5',
    action: 'Allocate and return devices',
    permission: 'Allow',
    category: 'Asset Management',
    description: 'Check-out/return hardware assets, track serials, scan QR codes, and log custody',
    riskLevel: 'Standard',
    enforcement: 'Custody signature logged'
  },
  {
    id: 'perm-6',
    action: 'Manage software licences',
    permission: 'Allow',
    category: 'Software Management',
    description: 'Renew SaaS subscriptions, adjust seat counts, and reclaim idle inactive licenses',
    riskLevel: 'Financial',
    enforcement: 'Budget threshold check'
  },
  {
    id: 'perm-7',
    action: 'Resolve IT tickets',
    permission: 'Allow',
    category: 'Helpdesk & Support',
    description: 'Triage, assign, escalate (L1-L3), and document resolution for support incidents',
    riskLevel: 'Operational',
    enforcement: 'SLA timer tracked'
  },
  {
    id: 'perm-8',
    action: 'View IT security logs',
    permission: 'Allow',
    category: 'Security & Activity',
    description: 'Audit IP geo-tracking, terminate live sessions, and review failed login attempts',
    riskLevel: 'Privileged',
    enforcement: 'Read-only immutable log'
  },

  // 5 DENY PERMISSIONS (Zero-Trust Security Boundaries)
  {
    id: 'perm-9',
    action: 'View employee payroll',
    permission: 'Deny',
    category: 'Human Resources & Finance',
    description: 'Zero-Trust boundary: salary, bonus, compensation, and bank ledger data restricted',
    riskLevel: 'Restricted Boundary',
    enforcement: 'Hardware HSM blocked'
  },
  {
    id: 'perm-10',
    action: 'Approve employee leave',
    permission: 'Deny',
    category: 'Human Resources & People Ops',
    description: 'Separation of duties: PTO, sick leave, and vacation authorizations reserved for HR/Managers',
    riskLevel: 'Restricted Boundary',
    enforcement: 'HR Portal restricted'
  },
  {
    id: 'perm-11',
    action: 'Modify salary details',
    permission: 'Deny',
    category: 'Finance & Payroll Operations',
    description: 'Financial compliance boundary: compensation bands and payroll ledger edits strictly forbidden',
    riskLevel: 'Restricted Boundary',
    enforcement: 'Ledger lock active'
  },
  {
    id: 'perm-12',
    action: 'Change HR policies',
    permission: 'Deny',
    category: 'Corporate Governance',
    description: 'Organizational boundary: corporate employee handbooks, policies, and NDA revisions denied',
    riskLevel: 'Restricted Boundary',
    enforcement: 'Legal sign-off required'
  },
  {
    id: 'perm-13',
    action: 'Change Super Admin roles',
    permission: 'Deny',
    category: 'Root Identity Governance',
    description: 'Privilege elevation prevention: modifying or elevating Root / Super Admin tier is blocked',
    riskLevel: 'Critical Boundary',
    enforcement: 'Cryptographic policy block'
  }
];

export const INITIAL_PENDING_REQUESTS = [
  {
    id: 'req-1',
    userId: 'usr-16',
    userName: 'Shreya Bhat',
    userRole: 'Mobile Engineer (iOS)',
    app: 'GitHub',
    justification: 'New joiner codebase access for iOS repository checkout and CI workflows',
    requestedDate: '23 Nov 2026, 09:15 IST',
    status: 'pending'
  },
  {
    id: 'req-2',
    userId: 'usr-2',
    userName: 'Priya Nair',
    userRole: 'Lead DevOps Architect',
    app: 'ERP',
    justification: 'Quarterly compliance audit telemetry integration for SAP S/4HANA',
    requestedDate: '23 Nov 2026, 11:40 IST',
    status: 'pending'
  },
  {
    id: 'req-3',
    userId: 'usr-9',
    userName: 'Suresh Reddy',
    userRole: 'Logistics Coordinator',
    app: 'VPN',
    justification: 'Warehouse supply chain remote portal connectivity in Hyderabad',
    requestedDate: '22 Nov 2026, 17:00 IST',
    status: 'pending'
  },
  {
    id: 'req-4',
    userId: 'usr-24',
    userName: 'Aishwarya Pillai',
    userRole: 'Product Manager',
    app: 'AWS Console',
    justification: 'Read-only view for telemetry analytics dashboards',
    requestedDate: '22 Nov 2026, 14:20 IST',
    status: 'approved',
    approvedBy: 'Rahul Sharma',
    approvedDate: '22 Nov 2026, 16:30 IST'
  }
];
