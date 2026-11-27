export const DOCUMENT_REPOSITORIES = [
  {
    id: 'user_records',
    label: 'User Records',
    icon: 'IconUsers',
    description: 'NDAs, employment verifications, security onboarding attestations, and privilege custody agreements',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  {
    id: 'hardware_manuals',
    label: 'Hardware Manuals',
    icon: 'IconLaptop',
    description: 'OEM spec sheets, BIOS hardening guides, wiring runbooks, and signed custody handover receipts',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'software_licenses',
    label: 'Software Licenses',
    icon: 'IconPackage',
    description: 'Master Services Agreements (MSAs), SaaS enterprise SLAs, entitlement grants, and audit contracts',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/40',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40'
  },
  {
    id: 'general_files',
    label: 'General Files',
    icon: 'IconFileText',
    description: 'ISO 27001 ISMS policies, campus disaster recovery plans, incident postmortems, and financial ledgers',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  }
];

export const INITIAL_DOCUMENTS = [
  // ==========================================
  // REPOSITORY 1: USER RECORDS
  // ==========================================
  {
    id: 'DOC-USR-101',
    title: 'Employee Intellectual Property & Proprietary NDA — Aman Verma',
    repository: 'user_records',
    repositoryLabel: 'User Records',
    category: 'user_records',
    categoryLabel: 'User Records',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v2.0',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Engineering',
    owner: 'Aman Verma',
    ownerRole: 'DevOps Lead',
    ownerId: 'usr-1',
    accessLevel: 'Confidential',
    uploadDate: '15 Jan 2026',
    reviewDate: '15 Jan 2027',
    retentionPolicy: '7-Year Statutory Statutory Retention (Active until 2033)',
    tags: ['NDA', 'Intellectual Property', 'Confidential', 'Onboarding', 'Legal Hold'],
    description: 'Fully executed proprietary information, patent assignment, and non-disclosure agreement for Senior DevOps personnel with privileged root credentials.',
    linkedEntities: {
      user: { id: 'usr-1', name: 'Aman Verma', department: 'Engineering', role: 'DevOps Lead' },
      securityEvent: { id: 'SEC-PAM-01', title: 'Privileged Root Credential Provisioning Event' },
      report: { id: 'RPT-HR-01', title: 'Annual Employee Legal & Compliance Audit' }
    },
    rbacRoles: {
      superAdmin: 'Full Control (Read, Write, Export, Delete, Grant)',
      itOpsLead: 'Read & Verify Only',
      securityOfficer: 'Audit & Revoke',
      helpdeskTech: 'No Access (Confidential)',
      complianceAuditor: 'Read & Export Audit Ledger'
    },
    versions: [
      { version: 'v2.0', date: '15 Jan 2026', author: 'Alex Mercer', notes: 'Countersigned by Legal with digital timestamp token' },
      { version: 'v1.0', date: '08 Jan 2026', author: 'Aman Verma', notes: 'Initial execution during employee onboarding' }
    ],
    auditTrail: [
      { id: 'aud-u101', action: 'Digital Signature Countersigned', user: 'Legal Counsel', time: '15 Jan 2026, 14:30 IST' },
      { id: 'aud-u102', action: 'Uploaded & AES-256 Encrypted', user: 'Alex Mercer', time: '08 Jan 2026, 10:15 IST' }
    ]
  },
  {
    id: 'DOC-USR-102',
    title: 'Remote Work Security Attestation & Zero-Trust MFA Compliance — Priya Nair',
    repository: 'user_records',
    repositoryLabel: 'User Records',
    category: 'user_records',
    categoryLabel: 'User Records',
    fileType: 'PDF',
    fileSize: '1.4 MB',
    sha256: '9f83b16543b591b9fa7291a8e94fae48950bbdf42e76faaeef8876c243881fc0',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v1.1',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Finance & Compliance',
    owner: 'Priya Nair',
    ownerRole: 'IT Asset Auditor',
    ownerId: 'usr-3',
    accessLevel: 'Internal Only',
    uploadDate: '10 Feb 2026',
    reviewDate: '10 Feb 2027',
    retentionPolicy: '3-Year Compliance Verification Cycle',
    tags: ['Zero-Trust', 'FIDO2 MFA', 'Remote Work', 'Finance Ops', 'Bengaluru'],
    description: 'Signed compliance attestation affirming physical device encryption, hardware YubiKey enforcement, and adherence to clean-desk protocols for home office operation.',
    linkedEntities: {
      user: { id: 'usr-3', name: 'Priya Nair', department: 'Finance & Compliance', role: 'IT Asset Auditor' },
      report: { id: 'RPT-SEC-02', title: 'Remote Workforce Endpoint Hardening Scorecard' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Write',
      securityOfficer: 'Audit & Revoke',
      helpdeskTech: 'Read Only',
      complianceAuditor: 'Read & Export'
    },
    versions: [
      { version: 'v1.1', date: '10 Feb 2026', author: 'Rahul Sharma', notes: 'Verified hardware YubiKey serial binding #YUBI-8842' },
      { version: 'v1.0', date: '01 Feb 2026', author: 'Priya Nair', notes: 'Initial submission' }
    ],
    auditTrail: [
      { id: 'aud-u201', action: 'YubiKey Token Validated', user: 'Rahul Sharma', time: '10 Feb 2026, 16:45 IST' },
      { id: 'aud-u202', action: 'Document Uploaded', user: 'Priya Nair', time: '01 Feb 2026, 11:20 IST' }
    ]
  },
  {
    id: 'DOC-USR-103',
    title: 'Privileged Access Management (PAM) Master Key Custody Undertaking',
    repository: 'user_records',
    repositoryLabel: 'User Records',
    category: 'user_records',
    categoryLabel: 'User Records',
    fileType: 'PDF',
    fileSize: '2.1 MB',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v3.0',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'IT Infrastructure',
    owner: 'Alex Mercer',
    ownerRole: 'Super Administrator',
    ownerId: 'usr-super',
    accessLevel: 'Restricted IT Ops',
    uploadDate: '01 Nov 2026',
    reviewDate: '01 Nov 2027',
    retentionPolicy: 'Indefinite Administrative Hold',
    tags: ['PAM', 'Root Key', 'Hardware Security Module', 'Break-Glass', 'Air-Gapped'],
    description: 'Split-knowledge M-of-N dual custodian agreement for organizational master encryption keys, root CA certificates, and emergency break-glass safe credentials.',
    linkedEntities: {
      user: { id: 'usr-super', name: 'Alex Mercer', role: 'Super Administrator' },
      securityEvent: { id: 'SEC-KEY-01', title: 'Bi-Annual HSM Master Key Rotation Ceremony' },
      report: { id: 'RPT-KEY-01', title: 'Cryptographic Key & Secret Governance Report' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read with Dual-Auth',
      securityOfficer: 'Audit Only',
      helpdeskTech: 'No Access',
      complianceAuditor: 'Audit Verification'
    },
    versions: [
      { version: 'v3.0', date: '01 Nov 2026', author: 'Alex Mercer', notes: 'Rotated secondary custodian to Kavita Rao (Network Lead)' },
      { version: 'v2.0', date: '01 Nov 2025', author: 'Alex Mercer', notes: 'Incorporated AWS KMS multi-region key quorum' }
    ],
    auditTrail: [
      { id: 'aud-u301', action: 'Dual Custodian Key Verification', user: 'Alex Mercer & Kavita Rao', time: '01 Nov 2026, 17:00 IST' }
    ]
  },

  // ==========================================
  // REPOSITORY 2: HARDWARE MANUALS
  // ==========================================
  {
    id: 'DOC-HW-201',
    title: 'Hardware Custody Handover Certificate — LAP-2024-001',
    repository: 'hardware_manuals',
    repositoryLabel: 'Hardware Manuals',
    category: 'hardware_manuals',
    categoryLabel: 'Hardware Manuals',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v1.0',
    status: 'Active',
    statusColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    department: 'IT Operations',
    owner: 'Rahul Sharma',
    ownerRole: 'IT Operations Lead',
    ownerId: 'usr-2',
    accessLevel: 'Restricted IT Ops',
    uploadDate: '24 Nov 2026',
    reviewDate: '24 Nov 2027',
    retentionPolicy: 'Asset Lifecycle Duration + 3 Years Post-Retirement',
    tags: ['Asset Handover', 'Hardware', 'MacBook Pro', 'Bengaluru HQ', 'Custody Certificate'],
    description: 'Digitally signed equipment issuance agreement for Apple MacBook Pro 16" M3 Max with serialised 140W MagSafe charger, privacy filter, and Kensington lock.',
    linkedEntities: {
      asset: { tag: 'LAP-2024-001', model: 'MacBook Pro 16" M3 Max', serial: 'C02G9014Q6LR' },
      user: { id: 'usr-1', name: 'Aman Verma', email: 'aman.verma@technomold.com', role: 'DevOps Lead' },
      ticket: { id: 'TKT-2041', title: 'VPN connection drops intermittently on macOS Sequoia' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Full Control',
      securityOfficer: 'Read Only',
      helpdeskTech: 'Read & Print',
      complianceAuditor: 'Read & Audit'
    },
    versions: [
      { version: 'v1.0', date: '24 Nov 2026', author: 'Rahul Sharma', notes: 'Initial handover sign-off with physical inspection checklist' }
    ],
    auditTrail: [
      { id: 'aud-h101', action: 'Digital Signature Verified', user: 'Aman Verma', time: '24 Nov 2026, 11:30 IST' },
      { id: 'aud-h102', action: 'Certificate Created', user: 'Rahul Sharma', time: '24 Nov 2026, 11:25 IST' }
    ]
  },
  {
    id: 'DOC-HW-202',
    title: 'Dell Latitude 7440 Enterprise Deployment & TPM 2.0 Hardening Guide',
    repository: 'hardware_manuals',
    repositoryLabel: 'Hardware Manuals',
    category: 'hardware_manuals',
    categoryLabel: 'Hardware Manuals',
    fileType: 'PDF',
    fileSize: '3.8 MB',
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v2.4',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'IT Operations',
    owner: 'Rahul Sharma',
    ownerRole: 'IT Operations Lead',
    ownerId: 'usr-2',
    accessLevel: 'Internal Only',
    uploadDate: '04 Oct 2026',
    reviewDate: '04 Oct 2027',
    retentionPolicy: 'Standard IT Fleet Support Cycle (5 Years)',
    tags: ['Dell Latitude', 'TPM 2.0', 'BitLocker', 'UEFI SecureBoot', 'Intune Autopilot'],
    description: 'Technical standard operating procedure for BIOS password lockdown, hardware TPM 2.0 key attestation, Windows 11 Enterprise Autopilot provisioning, and BitLocker recovery escrow.',
    linkedEntities: {
      asset: { tag: 'LAP-2024-004', model: 'Dell Latitude 7440', serial: '8X9K2M3' },
      report: { id: 'RPT-FLEET-01', title: 'Hardware Fleet OS & Firmware Health Compliance' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Write',
      securityOfficer: 'Read & Audit',
      helpdeskTech: 'Read & Download',
      complianceAuditor: 'Read Only'
    },
    versions: [
      { version: 'v2.4', date: '04 Oct 2026', author: 'Rahul Sharma', notes: 'Added BIOS v1.14.2 microcode CVE mitigation instructions' },
      { version: 'v2.0', date: '12 Jan 2026', author: 'Rahul Sharma', notes: 'Updated for Windows 11 24H2 Autopilot deployment' }
    ],
    auditTrail: [
      { id: 'aud-h201', action: 'Runbook Revision Approved', user: 'Alex Mercer', time: '04 Oct 2026, 14:00 IST' },
      { id: 'aud-h202', action: 'Firmware Specs Updated', user: 'Rahul Sharma', time: '04 Oct 2026, 11:30 IST' }
    ]
  },
  {
    id: 'DOC-HW-203',
    title: 'FortiGate NGFW-01 High-Availability Cluster Wiring & Failover Runbook',
    repository: 'hardware_manuals',
    repositoryLabel: 'Hardware Manuals',
    category: 'hardware_manuals',
    categoryLabel: 'Hardware Manuals',
    fileType: 'DOCX',
    fileSize: '4.2 MB',
    sha256: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v1.8',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Network Ops',
    owner: 'Kavita Rao',
    ownerRole: 'Senior Network Architect',
    ownerId: 'usr-4',
    accessLevel: 'Restricted IT Ops',
    uploadDate: '15 Sep 2026',
    reviewDate: '15 Sep 2027',
    retentionPolicy: 'Network Infrastructure Lifecycle (7 Years)',
    tags: ['Fortinet', 'NGFW', 'HA Cluster', 'BGP', 'Data Center', 'Schematics'],
    description: 'Physical rack mounting diagram, optical LC fiber wiring matrix, heartbeat sync link specifications, and manual failover procedures for core security gateways.',
    linkedEntities: {
      securityEvent: { id: 'WARN-04', title: 'Primary WAN Uplink Degraded (Automated Failover)' },
      ticket: { id: 'TKT-1988', title: 'Core Gateway BGP route flap on WAN Link A' },
      user: { id: 'usr-4', name: 'Kavita Rao', department: 'Network Ops' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Write',
      securityOfficer: 'Read Only',
      helpdeskTech: 'No Access',
      complianceAuditor: 'Read Only'
    },
    versions: [
      { version: 'v1.8', date: '15 Sep 2026', author: 'Kavita Rao', notes: 'Integrated redundant 10GbE SFP+ optical transceiver mapping' }
    ],
    auditTrail: [
      { id: 'aud-h301', action: 'Optical Wiring Verified', user: 'Kavita Rao', time: '15 Sep 2026, 16:30 IST' }
    ]
  },

  // ==========================================
  // REPOSITORY 3: SOFTWARE LICENSES
  // ==========================================
  {
    id: 'DOC-SW-301',
    title: 'CrowdStrike Falcon Complete — Enterprise Master Services Agreement',
    repository: 'software_licenses',
    repositoryLabel: 'Software Licenses',
    category: 'software_licenses',
    categoryLabel: 'Software Licenses',
    fileType: 'PDF',
    fileSize: '3.4 MB',
    sha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v2.1',
    status: 'Expiring Soon',
    statusColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    department: 'Information Security',
    owner: 'Alex Mercer',
    ownerRole: 'Super Admin',
    ownerId: 'usr-super',
    accessLevel: 'Confidential',
    uploadDate: '15 Dec 2025',
    reviewDate: '15 Dec 2026',
    retentionPolicy: 'Contract Duration + 7 Years Financial Audit Requirement',
    tags: ['EDR', 'Endpoint Security', 'SaaS Contract', 'Vendor SLA', '24/7 OverWatch'],
    description: 'Multi-year enterprise agreement for 250 endpoint sensors, 24/7 Managed Threat Hunting, Falcon OverWatch, automated isolation triggers, and ₹5 Cr breach warranty.',
    linkedEntities: {
      software: { id: 'SW-101', name: 'CrowdStrike Falcon', vendor: 'CrowdStrike Inc.', renewalDate: '15 Dec 2026' },
      securityEvent: { id: 'CRIT-01', title: 'Wazuh & CrowdStrike High-Risk Anomaly Alert' },
      report: { id: 'RPT-SW-01', title: 'Software License Consumption & Seat Optimization' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read Only',
      securityOfficer: 'Read & Audit',
      helpdeskTech: 'No Access',
      complianceAuditor: 'Read & Export'
    },
    versions: [
      { version: 'v2.1', date: '15 Dec 2025', author: 'Alex Mercer', notes: 'Expanded sensor tier from 150 to 250 seats' },
      { version: 'v2.0', date: '15 Dec 2024', author: 'Alex Mercer', notes: 'Original 2-year enterprise agreement signed' }
    ],
    auditTrail: [
      { id: 'aud-s101', action: 'Renewal Notice Triggered', user: 'System Bot', time: '20 Nov 2026, 09:00 IST' },
      { id: 'aud-s102', action: 'Contract Reviewed', user: 'Alex Mercer', time: '14 Nov 2026, 17:15 IST' }
    ]
  },
  {
    id: 'DOC-SW-302',
    title: 'Microsoft 365 E5 Enterprise Agreement & License Grant — 250 Seats',
    repository: 'software_licenses',
    repositoryLabel: 'Software Licenses',
    category: 'software_licenses',
    categoryLabel: 'Software Licenses',
    fileType: 'PDF',
    fileSize: '5.6 MB',
    sha256: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v3.0',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'IT Operations',
    owner: 'Rahul Sharma',
    ownerRole: 'IT Operations Lead',
    ownerId: 'usr-2',
    accessLevel: 'Internal Only',
    uploadDate: '01 Apr 2026',
    reviewDate: '31 Mar 2027',
    retentionPolicy: 'Active Subscription Term + 5 Years Statutory Archive',
    tags: ['Microsoft 365', 'E5 Tier', 'Entra ID P2', 'Defender for Cloud', 'Exchange Online'],
    description: 'Tier-1 enterprise agreement covering 250 Microsoft 365 E5 seats with Entra ID P2 conditional access, Microsoft Defender XDR, and Purview eDiscovery compliance.',
    linkedEntities: {
      software: { id: 'SW-102', name: 'Microsoft 365 E5', vendor: 'Microsoft Corp', renewalDate: '31 Mar 2027' },
      report: { id: 'RPT-SW-01', title: 'Software License Consumption & Seat Optimization' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Write',
      securityOfficer: 'Read & Audit',
      helpdeskTech: 'Read Only',
      complianceAuditor: 'Read & Export'
    },
    versions: [
      { version: 'v3.0', date: '01 Apr 2026', author: 'Alex Mercer', notes: 'Upgraded 50 seats from E3 to E5 for advanced DLP controls' }
    ],
    auditTrail: [
      { id: 'aud-s201', action: 'Quarterly True-Up Reconciled', user: 'Rahul Sharma', time: '01 Oct 2026, 15:30 IST' }
    ]
  },
  {
    id: 'DOC-SW-303',
    title: 'Atlassian Cloud Enterprise (Jira & Confluence) Master Subscription Grant',
    repository: 'software_licenses',
    repositoryLabel: 'Software Licenses',
    category: 'software_licenses',
    categoryLabel: 'Software Licenses',
    fileType: 'PDF',
    fileSize: '2.8 MB',
    sha256: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v1.4',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Engineering',
    owner: 'Aman Verma',
    ownerRole: 'DevOps Lead',
    ownerId: 'usr-1',
    accessLevel: 'Internal Only',
    uploadDate: '20 Jul 2026',
    reviewDate: '20 Jul 2027',
    retentionPolicy: 'Active Subscription Term (3 Years)',
    tags: ['Atlassian', 'Jira Service Management', 'Confluence', 'SAML SSO', 'Cloud Enterprise'],
    description: 'Enterprise agreement featuring 99.95% uptime SLA, Atlassian Guard SAML SSO integration, unlimited automation rules, and dedicated sandbox environments.',
    linkedEntities: {
      software: { id: 'SW-103', name: 'Jira Software & ServiceDesk', vendor: 'Atlassian Inc.', renewalDate: '20 Jul 2027' },
      ticket: { id: 'TKT-2045', title: 'Provision Jira Enterprise Sandbox for Mobile Team' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Write',
      securityOfficer: 'Read Only',
      helpdeskTech: 'Read Only',
      complianceAuditor: 'Read & Audit'
    },
    versions: [
      { version: 'v1.4', date: '20 Jul 2026', author: 'Aman Verma', notes: 'Annual renewal with Atlassian Guard security add-on' }
    ],
    auditTrail: [
      { id: 'aud-s301', action: 'SAML SSO Verified', user: 'Aman Verma', time: '20 Jul 2026, 18:00 IST' }
    ]
  },

  // ==========================================
  // REPOSITORY 4: GENERAL FILES
  // ==========================================
  {
    id: 'DOC-GEN-401',
    title: 'ISO/IEC 27001:2022 ISMS Global Security Policy Manual',
    repository: 'general_files',
    repositoryLabel: 'General Files',
    category: 'general_files',
    categoryLabel: 'General Files',
    fileType: 'PDF',
    fileSize: '4.8 MB',
    sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v3.2',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Information Security',
    owner: 'Alex Mercer',
    ownerRole: 'Super Admin / CISO',
    ownerId: 'usr-super',
    accessLevel: 'Internal Only',
    uploadDate: '18 Nov 2026',
    reviewDate: '15 Nov 2027',
    retentionPolicy: 'Statutory ISMS Policy Standard (Permanent Archive)',
    tags: ['ISO-27001', 'ISMS', 'Governance', 'Zero-Trust', 'Audit Compliance'],
    description: 'Comprehensive information security management system (ISMS) documentation covering zero-trust identity, hardware encryption, cryptographic key management, and incident protocols.',
    linkedEntities: {
      securityEvent: { id: 'SEC-ISO-27001', title: 'Annual ISO 27001 External Surveillance Audit' },
      report: { id: 'RPT-SEC-01', title: 'Security & Activity Compliance Scorecard' },
      user: { id: 'usr-1', name: 'Aman Verma', department: 'Engineering' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Distribute',
      securityOfficer: 'Audit & Maintain',
      helpdeskTech: 'Read Only',
      complianceAuditor: 'Full Audit Read'
    },
    versions: [
      { version: 'v3.2', date: '18 Nov 2026', author: 'Alex Mercer', notes: 'Updated clause 9.2 for MFA hardware token rotation' },
      { version: 'v3.1', date: '10 Aug 2026', author: 'Alex Mercer', notes: 'Revised remote-work WireGuard VPN security rules' },
      { version: 'v3.0', date: '15 Jan 2026', author: 'Alex Mercer', notes: 'Major overhaul to ISO 27001:2022 standard' }
    ],
    auditTrail: [
      { id: 'aud-g101', action: 'Document Downloaded', user: 'Rahul Sharma', time: '24 Nov 2026, 10:15 IST' },
      { id: 'aud-g102', action: 'Access Permissions Reviewed', user: 'Alex Mercer', time: '18 Nov 2026, 16:40 IST' },
      { id: 'aud-g103', action: 'Version v3.2 Published', user: 'Alex Mercer', time: '18 Nov 2026, 14:20 IST' }
    ]
  },
  {
    id: 'DOC-GEN-402',
    title: 'Campus Disaster Recovery Plan (DRP) & Mumbai Cold Site Playbook',
    repository: 'general_files',
    repositoryLabel: 'General Files',
    category: 'general_files',
    categoryLabel: 'General Files',
    fileType: 'PDF',
    fileSize: '6.2 MB',
    sha256: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v4.0',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'IT Infrastructure',
    owner: 'Alex Mercer',
    ownerRole: 'Super Admin',
    ownerId: 'usr-super',
    accessLevel: 'Restricted IT Ops',
    uploadDate: '01 Nov 2026',
    reviewDate: '01 Nov 2027',
    retentionPolicy: 'Business Continuity Regulation (Annual Mandatory Review)',
    tags: ['DRP', 'Business Continuity', 'RPO-1h', 'RTO-15m', 'Data Center', 'Cold Site'],
    description: 'Operational procedures for campus failover to Mumbai secondary site, Active Directory secondary promotion, AWS cloud disaster snapshot restores, and executive crisis communication chains.',
    linkedEntities: {
      securityEvent: { id: 'SEC-DR-01', title: 'Semi-Annual Cold Site Simulation Drill' },
      report: { id: 'RPT-DR-01', title: 'System Settings Disaster Recovery Verification' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Full Control',
      securityOfficer: 'Audit & Verify',
      helpdeskTech: 'Emergency Read Only',
      complianceAuditor: 'Read & Audit'
    },
    versions: [
      { version: 'v4.0', date: '01 Nov 2026', author: 'Alex Mercer', notes: 'Validated RPO 1h and RTO 15m drill benchmarks' }
    ],
    auditTrail: [
      { id: 'aud-g201', action: 'Simulation Drill Benchmark Verified', user: 'Alex Mercer', time: '02 Nov 2026, 10:00 IST' }
    ]
  },
  {
    id: 'DOC-GEN-403',
    title: 'Major Incident Postmortem & Root Cause Analysis — TKT-1988',
    repository: 'general_files',
    repositoryLabel: 'General Files',
    category: 'general_files',
    categoryLabel: 'General Files',
    fileType: 'DOCX',
    fileSize: '1.9 MB',
    sha256: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v1.2',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Network Ops',
    owner: 'Kavita Rao',
    ownerRole: 'Senior Network Architect',
    ownerId: 'usr-4',
    accessLevel: 'Internal Only',
    uploadDate: '12 Nov 2026',
    reviewDate: '12 Nov 2027',
    retentionPolicy: 'ITIL Incident Governance Standard (3 Years)',
    tags: ['Postmortem', 'P1 Incident', 'WAN Outage', 'Tata Comm', 'BGP Flap'],
    description: 'Detailed technical analysis of core fiber transponder degradation on Bangalore DC primary gateway (FortiGate NGFW-01) and subsequent BGP auto-failover remediation.',
    linkedEntities: {
      ticket: { id: 'TKT-1988', title: 'Core Gateway BGP route flap on WAN Link A' },
      securityEvent: { id: 'WARN-04', title: 'Primary WAN Uplink Degraded (Automated Failover)' },
      user: { id: 'usr-4', name: 'Kavita Rao', department: 'Network Ops' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Write',
      securityOfficer: 'Read Only',
      helpdeskTech: 'Read Only',
      complianceAuditor: 'Read & Export'
    },
    versions: [
      { version: 'v1.2', date: '14 Nov 2026', author: 'Kavita Rao', notes: 'Added ISP ticket reference and optical decibel power metrics' },
      { version: 'v1.0', date: '12 Nov 2026', author: 'Kavita Rao', notes: 'Draft postmortem compiled for review' }
    ],
    auditTrail: [
      { id: 'aud-g301', action: 'Postmortem Signed Off', user: 'Alex Mercer', time: '15 Nov 2026, 11:00 IST' },
      { id: 'aud-g302', action: 'Document Uploaded', user: 'Kavita Rao', time: '12 Nov 2026, 18:30 IST' }
    ]
  },
  {
    id: 'DOC-GEN-404',
    title: 'Executive IT Operations & Financial Assets Ledger FY 2026–27',
    repository: 'general_files',
    repositoryLabel: 'General Files',
    category: 'general_files',
    categoryLabel: 'General Files',
    fileType: 'XLSX',
    fileSize: '8.7 MB',
    sha256: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    encryption: 'AES-256-GCM (KMS-Vault)',
    version: 'v2.0',
    status: 'Approved',
    statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    department: 'Finance & Compliance',
    owner: 'Priya Nair',
    ownerRole: 'IT Asset Auditor',
    ownerId: 'usr-3',
    accessLevel: 'Confidential',
    uploadDate: '20 Nov 2026',
    reviewDate: '31 Mar 2027',
    retentionPolicy: 'Statutory Corporate Accounting Retention (8 Years)',
    tags: ['Financials', 'Capex/Opex', 'Hardware Valuation', 'Depreciation', 'Audited'],
    description: 'Comprehensive financial appraisal of 48 physical fleet devices (Total Book Value: ₹1.42 Cr), warranty expiries, vendor contracts, and software amortization tables.',
    linkedEntities: {
      report: { id: 'RPT-FIN-01', title: 'Executive IT Operations Depreciation & Asset Audit' },
      user: { id: 'usr-3', name: 'Priya Nair', department: 'Finance & Compliance' }
    },
    rbacRoles: {
      superAdmin: 'Full Control',
      itOpsLead: 'Read & Verify',
      securityOfficer: 'No Access (Financial)',
      helpdeskTech: 'No Access',
      complianceAuditor: 'Read & Full Export'
    },
    versions: [
      { version: 'v2.0', date: '20 Nov 2026', author: 'Priya Nair', notes: 'Incorporated Q3 hardware deliveries and Intune MDM enrollments' }
    ],
    auditTrail: [
      { id: 'aud-g401', action: 'Exported to CSV / Spreadsheet', user: 'Priya Nair', time: '22 Nov 2026, 14:10 IST' }
    ]
  }
];
