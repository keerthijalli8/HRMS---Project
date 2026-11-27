export const INITIAL_BUSINESS_UNITS = [
  {
    id: 'bu-eng',
    name: 'Cloud Infrastructure & Engineering',
    code: 'ENG',
    head: 'Rajesh Varma',
    membersCount: 18,
    activeDevices: 24,
    allocatedLicenses: 480,
    budget: '$420,000 / yr',
    status: 'active'
  },
  {
    id: 'bu-sec',
    name: 'Enterprise Security & Compliance',
    code: 'SEC',
    head: 'Sunita Rao',
    membersCount: 6,
    activeDevices: 9,
    allocatedLicenses: 120,
    budget: '$180,000 / yr',
    status: 'active'
  },
  {
    id: 'bu-prod',
    name: 'Product & Design Systems',
    code: 'PROD',
    head: 'Arjun Das',
    membersCount: 8,
    activeDevices: 12,
    allocatedLicenses: 210,
    budget: '$210,000 / yr',
    status: 'active'
  },
  {
    id: 'bu-ops',
    name: 'Corporate Operations & IT Support Desk',
    code: 'OPS',
    head: 'Alex Mercer',
    membersCount: 5,
    activeDevices: 8,
    allocatedLicenses: 95,
    budget: '$140,000 / yr',
    status: 'active'
  },
  {
    id: 'bu-hr',
    name: 'People Operations & Talent Acquisition',
    code: 'PEOPLE',
    head: 'Pooja Iyer',
    membersCount: 3,
    activeDevices: 4,
    allocatedLicenses: 45,
    budget: '$75,000 / yr',
    status: 'active'
  }
];

export const INITIAL_LOCATIONS = [
  {
    id: 'loc-blr',
    name: 'Bengaluru Global Headquarters',
    code: 'BLR-HQ',
    address: 'Bagmane Tech Park, CV Raman Nagar, Bengaluru, Karnataka 560093',
    timezone: 'Asia/Kolkata (IST UTC+5:30)',
    totalPersonnel: 31,
    activeFleetUnits: 38,
    networkSubnet: '10.0.0.0/16',
    primaryContact: 'Alex Mercer (IT Admin)',
    status: 'operational'
  },
  {
    id: 'loc-bom',
    name: 'Mumbai Technology Hub',
    code: 'BOM-01',
    address: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
    timezone: 'Asia/Kolkata (IST UTC+5:30)',
    totalPersonnel: 9,
    activeFleetUnits: 12,
    networkSubnet: '10.2.0.0/16',
    primaryContact: 'Kavita Menon (Local Site Lead)',
    status: 'operational'
  },
  {
    id: 'loc-hyd',
    name: 'Hyderabad Cloud Operations Center',
    code: 'HYD-02',
    address: 'HITEC City, Madhapur, Hyderabad, Telangana 500081',
    timezone: 'Asia/Kolkata (IST UTC+5:30)',
    totalPersonnel: 12,
    activeFleetUnits: 15,
    networkSubnet: '10.4.0.0/16',
    primaryContact: 'Sanjay Reddy (Cloud Architect)',
    status: 'operational'
  },
  {
    id: 'loc-sin',
    name: 'Singapore APAC Regional Hub',
    code: 'SIN-01',
    address: 'Marina Bay Financial Centre Tower 1, Singapore 018981',
    timezone: 'Asia/Singapore (SGT UTC+8:00)',
    totalPersonnel: 6,
    activeFleetUnits: 8,
    networkSubnet: '10.8.0.0/16',
    primaryContact: 'Mei Ling (APAC Operations)',
    status: 'operational'
  }
];

export const INITIAL_INTEGRATIONS = [
  {
    id: 'int-gsuite',
    name: 'Google Workspace Enterprise',
    category: 'Identity & SSO',
    description: 'Central directory synchronization, Google OAuth 2.0 authentication, and SAML app provisioning.',
    status: 'connected',
    syncInterval: 'Realtime Webhook',
    lastSync: '2 mins ago',
    icon: 'google',
    managedUsers: 40,
    health: '100% Operational'
  },
  {
    id: 'int-okta',
    name: 'Okta Identity Cloud',
    category: 'MFA & Access Governance',
    description: 'FIDO2 / WebAuthn policy enforcement and adaptive step-up authentication.',
    status: 'connected',
    syncInterval: 'Every 5 mins',
    lastSync: '4 mins ago',
    icon: 'key',
    managedUsers: 40,
    health: '100% Operational'
  },
  {
    id: 'int-intune',
    name: 'Microsoft Intune & Entra ID',
    category: 'Endpoint MDM & Fleet',
    description: 'Hardware encryption compliance (FileVault / BitLocker) and zero-touch MDM enrollment.',
    status: 'connected',
    syncInterval: 'Every 15 mins',
    lastSync: '11 mins ago',
    icon: 'laptop',
    managedUsers: 48,
    health: '100% Operational'
  },
  {
    id: 'int-slack',
    name: 'Slack Enterprise Grid',
    category: 'ChatOps & Notifications',
    description: 'Automated IT ticket dispatch, critical security alerts, and self-service password reset bots.',
    status: 'connected',
    syncInterval: 'Realtime Webhook',
    lastSync: 'Live Stream',
    icon: 'share',
    managedUsers: 40,
    health: '100% Operational'
  },
  {
    id: 'int-aws',
    name: 'Amazon Web Services (AWS Organizations)',
    category: 'Cloud Infrastructure & SIEM',
    description: 'CloudTrail log ingestion, VPC peering telemetry, and IAM Identity Center federation.',
    status: 'connected',
    syncInterval: 'Every 1 min',
    lastSync: '30 secs ago',
    icon: 'shield',
    managedUsers: 14,
    health: '100% Operational'
  },
  {
    id: 'int-jira',
    name: 'Jira Service Management & Atlassian',
    category: 'Helpdesk & ITSM',
    description: 'Two-way incident synchronization, ITIL change management, and SLA escalation policies.',
    status: 'connected',
    syncInterval: 'Realtime Webhook',
    lastSync: '1 min ago',
    icon: 'headphones',
    managedUsers: 17,
    health: '100% Operational'
  }
];

export const INITIAL_NOTIFICATION_RULES = [
  {
    id: 'notif-rule-1',
    event: 'Critical Security Alert (Brute Force / Geo Anomaly)',
    channels: ['Slack #sec-alerts', 'PagerDuty On-Call', 'Emergency SMS'],
    severity: 'critical',
    status: 'enabled'
  },
  {
    id: 'notif-rule-2',
    event: 'Emergency Account Suspension / Privilege Escalation',
    channels: ['Slack #sec-audit', 'Email to Super Admins'],
    severity: 'high',
    status: 'enabled'
  },
  {
    id: 'notif-rule-3',
    event: 'SaaS License Expiration (< 30 Days)',
    channels: ['Email to IT Procurement', 'Dashboard Badge'],
    severity: 'medium',
    status: 'enabled'
  },
  {
    id: 'notif-rule-4',
    event: 'Hardware Return Overdue / Quarantine Required',
    channels: ['Slack to Employee', 'Helpdesk Ticket Auto-Generation'],
    severity: 'medium',
    status: 'enabled'
  }
];

export const BACKUP_POLICIES = {
  strategy: 'Continuous AWS S3 Glacier Cross-Region Immutable Snapshots',
  rpo: '1 Hour (Recovery Point Objective)',
  rto: '15 Minutes (Recovery Time Objective)',
  encryption: 'AES-256 Customer-Managed KMS Key (AWS Key ID: arn:aws:kms:ap-south-1:tech-admin)',
  lastVerifiedBackup: '24 Nov 2026, 04:00 IST',
  backupHealth: '100% Success (0 checksum failures across 40 snapshots)',
  retentionPeriod: '365 Days (Compliance WORM Archive)'
};
