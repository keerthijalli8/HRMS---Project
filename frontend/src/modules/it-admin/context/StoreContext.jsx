
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { getItAdminPageId, resolveItAdminPath } from '../routes.js';

import { INITIAL_USERS } from '../data/users';

import {
  INITIAL_ASSETS,
  INITIAL_CUSTODY_HISTORY,
} from '../data/assets';

import { INITIAL_TICKETS } from '../data/tickets';
import { INITIAL_SOFTWARE } from '../data/software';
import { INITIAL_EVENTS } from '../data/events';

import {
  INITIAL_ACCESS_MATRIX,
  INITIAL_PENDING_REQUESTS,
  ROLE_PRESETS,
  SYSTEM_APPS,
} from '../data/accessMatrix';

import { INITIAL_ROLE_PROFILES } from '../data/roleProfiles';

import {
  INITIAL_NETWORK_DEVICES,
  NETWORK_METRICS,
} from '../data/network';

import { INITIAL_DOCUMENTS } from '../data/documents';
import { getDocumentStoragePoolId } from '../data/storagePools';

import {
  INITIAL_BUSINESS_UNITS,
  INITIAL_LOCATIONS,
  INITIAL_INTEGRATIONS,
  INITIAL_NOTIFICATION_RULES,
  BACKUP_POLICIES,
} from '../data/settings';

// ============================================================
// STORE CONFIGURATION
// ============================================================

const StoreContext = createContext(null);

const STORAGE_PREFIX = 'technomold_it_admin_v2_';

const DEFAULT_LOGO = '/technomold-logo-transparent.png';

const DEFAULT_ADMIN = {
  id: 'usr-admin-01',
  name: 'Alex Mercer',
  email: 'alex.mercer@technomold.com',
  role: 'Super Administrator',
  adminRoleId: 'ROLE-001',
  department: 'IT Infrastructure & Security',
  location: 'Bengaluru, IN',
  avatarUrl: null,
};

const PAGE_PERMISSIONS = {
  dashboard: null,
  accounts: 'User Profiles',
  access: 'Security',
  inventory: 'Assets',
  allocate: 'Assets',
  desk: 'Helpdesk',
  licences: 'Software',
  events: 'Security',
  reports: 'Reports',
  help: null,
  settings: 'System Settings',
};

const PAGE_ALIASES = {
  permissions: 'access',
  hardwareSoftware: 'inventory',
};

const VALID_USER_STATUSES = [
  'active',
  'suspended',
  'deactivated',
  'provisioning',
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Critical Security Alert',
    message: 'Suspicious authentication activity detected.',
    time: '8 mins ago',
    type: 'security',
    unread: true,
    targetPage: 'events',
  },
  {
    id: 'notif-2',
    title: 'SaaS License Approaching Limit',
    message: 'Adobe Creative Cloud license utilization requires review.',
    time: '24 mins ago',
    type: 'license',
    unread: true,
    targetPage: 'licences',
  },
  {
    id: 'notif-3',
    title: 'New Hardware Allocation Request',
    message: 'Sarah Jenkins requested a MacBook Pro.',
    time: '1 hr ago',
    type: 'request',
    unread: true,
    targetPage: 'allocate',
  },
];

// ============================================================
// GENERAL UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueId(prefix = 'id') {
  const random =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return `${prefix}-${random}`;
}

function todayLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function timestampLabel(date = new Date()) {
  return `${new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(date)} IST`;
}

function parseDate(value) {
  if (!value) return null;

  const text = String(value)
    .replace(/,?\s*IST$/i, '')
    .trim();

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function daysUntil(value) {
  const date = parseDate(value);

  if (!date) return null;

  const target = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const now = new Date();

  const today = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.round(
    (target - today) / 86400000
  );
}

function nonNegativeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : fallback;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || '').trim()
  );
}

function nextNumericId(records, field, prefix, minimum = 0) {
  const highest = safeArray(records).reduce(
    (max, record) => {
      const value = String(record[field] || '');

      if (!value.startsWith(prefix)) return max;

      const number = Number(
        value.slice(prefix.length)
      );

      return Number.isFinite(number)
        ? Math.max(max, number)
        : max;
    },
    minimum
  );

  return highest + 1;
}

function findUser(users, identifier) {
  if (identifier === null || identifier === undefined) {
    return null;
  }

  return safeArray(users).find(user =>
    [
      user.id,
      user.employeeId,
      user.name,
      user.email,
    ].some(value =>
      normalize(value) === normalize(identifier)
    )
  ) || null;
}

function initials(name) {
  return String(name || 'Administrator')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ============================================================
// LOCAL STORAGE UTILITIES
// ============================================================

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);

    return stored === null
      ? fallback
      : stored;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('Local storage write failed:', key, error);
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Local storage removal failed:', error);
  }
}

function readJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);

    if (stored === null) return fallback;

    const parsed = JSON.parse(stored);

    if (
      Array.isArray(fallback) &&
      !Array.isArray(parsed)
    ) {
      return fallback;
    }

    if (
      fallback &&
      typeof fallback === 'object' &&
      !Array.isArray(fallback) &&
      (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      )
    ) {
      return fallback;
    }

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/*
 * Maintains immediate access to updated records.
 * Supports consecutive actions such as:
 * addAsset() followed by assignAsset().
 */

function useStoredState(key, initialValue) {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [value, setValue] = useState(() => {
    const fallback =
      typeof initialValue === 'function'
        ? initialValue()
        : initialValue;

    return readJSON(storageKey, fallback);
  });

  const valueRef = useRef(value);

  const setStoredValue = useCallback(updater => {
    const previous = valueRef.current;

    const next =
      typeof updater === 'function'
        ? updater(previous)
        : updater;

    valueRef.current = next;

    setValue(next);

    try {
      writeStorage(
        storageKey,
        JSON.stringify(next)
      );
    } catch (error) {
      console.warn('Unable to persist data:', key, error);
    }

    return next;
  }, [storageKey, key]);

  const getCurrentValue = useCallback(
    () => valueRef.current,
    []
  );

  return [
    value,
    setStoredValue,
    getCurrentValue,
  ];
}

// ============================================================
// ASSET DATA NORMALIZATION
// ============================================================

function synchronizeAssetFields(
  asset,
  updates = {},
  users = INITIAL_USERS
) {
  const merged = {
    ...asset,
    ...updates,
  };

  const assetId =
    updates.assetId ??
    merged.assetId ??
    merged.assetTag ??
    merged.id;

  const assetTag =
    updates.assetTag ??
    merged.assetTag ??
    assetId;

  const model =
    updates.model ??
    updates.name ??
    merged.model ??
    merged.name ??
    '';

  const type =
    updates.type ??
    updates.category ??
    merged.type ??
    merged.category ??
    '';

  const cost = nonNegativeNumber(
    updates.purchaseCost ??
    updates.cost ??
    merged.purchaseCost ??
    merged.cost
  );

  const assignmentFields = [
    'assignedEmployeeId',
    'assignedTo',
    'assignedToId',
    'assignedEmployee',
    'assignedName',
    'employeeId',
  ];

  const assignmentChanged =
    assignmentFields.some(field =>
      Object.prototype.hasOwnProperty.call(
        updates,
        field
      )
    );

  let assignedTo = assignmentChanged
    ? (
        updates.assignedEmployeeId ??
        updates.assignedTo ??
        updates.assignedToId ??
        updates.employeeId ??
        updates.assignedEmployee ??
        updates.assignedName ??
        null
      )
    : (
        merged.assignedTo ??
        merged.assignedEmployeeId ??
        null
      );

  let assignedName = assignmentChanged
    ? (
        updates.assignedName ??
        updates.assignedEmployee ??
        null
      )
    : (
        merged.assignedName ??
        merged.assignedEmployee ??
        null
      );

  const assignedUser =
    findUser(users, assignedTo) ||
    findUser(users, assignedName);

  if (assignedUser) {
    assignedTo = assignedUser.id;
    assignedName = assignedUser.name;
  }

  if (!assignedTo && !assignedName) {
    assignedTo = null;
    assignedName = null;
  }

  const serial =
    updates.serialNumber ??
    updates.serial ??
    merged.serialNumber ??
    merged.serial ??
    '';

  return {
    ...merged,

    assetId,
    assetTag,

    model,
    name: model,

    type,
    category: type,

    serial,
    serialNumber: serial,

    cost,
    purchaseCost: cost,
    costFormatted: `₹${(cost / 100000).toFixed(2)} L`,

    assignedTo,
    assignedToId: assignedTo,
    assignedEmployeeId: assignedTo,

    employeeId: assignedUser?.employeeId || null,

    assignedName,
    assignedEmployee: assignedName,
  };
}

// ============================================================
// SOFTWARE DATA NORMALIZATION
// ============================================================

function synchronizeSoftwareFields(item, updates = {}) {
  const merged = {
    ...item,
    ...updates,
  };

  const annualCost = nonNegativeNumber(
    updates.annualCost ??
    updates.costPerYear ??
    merged.annualCost ??
    merged.costPerYear
  );

  const expiryDate =
    updates.expiryDate ??
    updates.renewalDate ??
    merged.expiryDate ??
    merged.renewalDate ??
    '';

  const subscriptionModel =
    updates.subscriptionModel ??
    updates.licenceType ??
    merged.subscriptionModel ??
    merged.licenceType ??
    'Subscription';

  const totalSeats = Math.floor(
    nonNegativeNumber(merged.totalSeats)
  );

  const seatsUsed = Math.min(
    totalSeats,
    Math.floor(nonNegativeNumber(merged.seatsUsed))
  );

  const remainingDays = daysUntil(expiryDate);

  let renewalStatus =
    updates.renewalStatus ??
    updates.status ??
    merged.renewalStatus ??
    merged.status ??
    'active';

  if (remainingDays !== null) {
    if (remainingDays < 0) {
      renewalStatus = 'expired';
    } else if (remainingDays <= 30) {
      renewalStatus = 'expiring soon';
    } else if (
      renewalStatus === 'expired' ||
      renewalStatus === 'expiring soon'
    ) {
      renewalStatus = 'active';
    }
  }

  return {
    ...merged,

    version: merged.version || 'Cloud',
    licenseKey: merged.licenseKey || '',

    expiryDate,
    renewalDate: expiryDate,

    subscriptionModel,
    licenceType: subscriptionModel,

    totalSeats,
    seatsUsed,
    availableSeats: totalSeats - seatsUsed,

    installationHistory: safeArray(
      merged.installationHistory
    ),

    annualCost,
    costPerYear: annualCost,
    costFormatted: `₹${(annualCost / 100000).toFixed(2)} L`,

    daysToRenewal:
      remainingDays ??
      merged.daysToRenewal ??
      999,

    renewalStatus,
    status: renewalStatus,
  };
}

// ============================================================
// DOCUMENT COMPATIBILITY
// ============================================================

function linkDocumentToEmployee(doc) {
  const linkedUser = doc.linkedEntities?.user;

  const employee =
    findUser(INITIAL_USERS, linkedUser?.id) ||
    findUser(INITIAL_USERS, linkedUser?.employeeId) ||
    findUser(INITIAL_USERS, doc.employeeId) ||
    findUser(INITIAL_USERS, doc.ownerId) ||
    findUser(INITIAL_USERS, doc.owner);

  const documentWithPool = {
    ...doc,
    storagePoolId:
      doc.storagePoolId ||
      getDocumentStoragePoolId(
        doc.repository || doc.category
      ),
  };

  if (!employee) return documentWithPool;

  return {
    ...documentWithPool,
    employeeId: employee.employeeId,

    ...(linkedUser && {
      linkedEntities: {
        ...doc.linkedEntities,
        user: {
          ...linkedUser,
          employeeId: employee.employeeId,
        },
      },
    }),
  };
}

// ============================================================
// MAIN STORE PROVIDER
// ============================================================

export function StoreProvider({ children }) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const {
    user: authUser,
    isAuthenticated: authIsAuthenticated,
    logout: authLogout,
    updateProfile: authUpdateProfile,
  } = useAuth();

  // ==========================================================
  // NAVIGATION (React Router under /it-admin/*)
  // ==========================================================

  const activePage = getItAdminPageId(location.pathname);

  const [
    activeSubDashboard,
    setActiveSubDashboard,
  ] = useState('overview');

  const [
    activeSubTab,
    setActiveSubTab,
  ] = useState('all');

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  // ==========================================================
  // BRAND & SHARED AUTHENTICATION
  // ==========================================================

  const [appLogo, setAppLogo] = useState(() =>
    readStorage(
      'it_admin_custom_logo',
      DEFAULT_LOGO
    )
  );

  const isAuthenticated = Boolean(authIsAuthenticated && authUser);

  const [userOverrides, setUserOverrides] = useState(() => ({
    avatarUrl: readStorage('it_admin_profile_avatar', null) || null,
  }));

  const currentUser = useMemo(() => {
    const roles = Array.isArray(authUser?.roles) ? authUser.roles : ['IT_ADMIN'];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    return {
      ...DEFAULT_ADMIN,
      ...(authUser || {}),
      ...userOverrides,
      id: authUser?.id || authUser?.employeeId || DEFAULT_ADMIN.id,
      employeeId: authUser?.employeeId || authUser?.employee_id || DEFAULT_ADMIN.id,
      name: authUser?.name || DEFAULT_ADMIN.name,
      email: authUser?.email || DEFAULT_ADMIN.email,
      role: authUser?.designation || authUser?.role || (isSuperAdmin ? 'Super Administrator' : 'IT Administrator'),
      adminRoleId: userOverrides.adminRoleId || DEFAULT_ADMIN.adminRoleId,
      department: authUser?.department || DEFAULT_ADMIN.department,
      location: authUser?.location || DEFAULT_ADMIN.location,
      roles,
      avatarUrl:
        userOverrides.avatarUrl ??
        authUser?.avatarUrl ??
        null,
    };
  }, [authUser, userOverrides]);

  const setCurrentUser = useCallback(updater => {
    setUserOverrides(prev => {
      const next = typeof updater === 'function' ? updater({ ...DEFAULT_ADMIN, ...prev }) : updater;
      return next && typeof next === 'object' ? { ...prev, ...next } : prev;
    });
  }, []);

  const authProvider = 'hrms';

  // ==========================================================
  // PERSISTENT CORE MODULE DATA
  // ==========================================================

  const [
    userRecords,
    setUsers,
    getUsers,
  ] = useStoredState(
    'users',
    INITIAL_USERS
  );

  const [
    roleProfiles,
    setRoleProfilesState,
    getRoleProfiles,
  ] = useStoredState(
    'role_profiles',
    INITIAL_ROLE_PROFILES
  );

  const [
    assets,
    setAssets,
    getAssets,
  ] = useStoredState(
    'assets',
    () => INITIAL_ASSETS.map(
      (asset, index) =>
        synchronizeAssetFields(asset, {
          assetId: `USR-${String(index + 1).padStart(3, '0')}`,
        })
    )
  );

  const [
    custodyHistory,
    setCustodyHistory,
    getCustodyHistory,
  ] = useStoredState(
    'custody_history',
    INITIAL_CUSTODY_HISTORY
  );

  const [
    tickets,
    setTickets,
    getTickets,
  ] = useStoredState(
    'tickets',
    INITIAL_TICKETS
  );

  const [
    softwareRecords,
    setSoftware,
    getSoftware,
  ] = useStoredState(
    'software',
    () => INITIAL_SOFTWARE.map(item =>
      synchronizeSoftwareFields(item)
    )
  );

  const [
    events,
    setEvents,
    getEvents,
  ] = useStoredState(
    'events',
    INITIAL_EVENTS
  );

  const [
    accessMatrix,
    setAccessMatrix,
    getAccessMatrix,
  ] = useStoredState(
    'access_matrix',
    INITIAL_ACCESS_MATRIX
  );

  const [
    pendingRequests,
    setPendingRequests,
    getPendingRequests,
  ] = useStoredState(
    'access_requests',
    INITIAL_PENDING_REQUESTS
  );

  const [
    notifications,
    setNotifications,
    getNotifications,
  ] = useStoredState(
    'notifications',
    INITIAL_NOTIFICATIONS
  );

  // ==========================================================
  // DERIVED USER & SOFTWARE DATA
  // ==========================================================

  const users = userRecords.map(user => ({
    ...user,
    deviceCount: assets.filter(asset =>
      asset.assignedTo === user.id &&
      [
        'assigned',
        'overdue return',
      ].includes(asset.status)
    ).length,
  }));

  const software = softwareRecords.map(item =>
    synchronizeSoftwareFields(item)
  );

  // ==========================================================
  // MFA POLICIES
  // ==========================================================

  const [
    mfaPolicies,
    setMfaPolicies,
    getMfaPolicies,
  ] = useStoredState(
    'mfa_policies',
    {
      enforceWebAuthn: true,
      requireFido2ForAdmin: true,
      blockLegacyAuth: true,
      sessionTimeoutHours: 8,
    }
  );

  // ==========================================================
  // DEVICE MAINTENANCE
  // ==========================================================

  const [
    maintenanceSchedules,
    setMaintenanceSchedules,
    getMaintenanceSchedules,
  ] = useStoredState(
    'maintenance_schedules',
    [
      {
        id: 'mnt-1',
        title: 'macOS Critical Security Patch Deployment',
        target: 'Fleet (28 MacBooks)',
        scheduledDate: '26 Nov 2026, 02:00 IST',
        status: 'scheduled',
        type: 'OS Patch',
        compliancePercent: 94,
      },
      {
        id: 'mnt-2',
        title: 'Dell Latitude Firmware & BIOS Security Update',
        target: '18 Laptops & Desktops',
        scheduledDate: '28 Nov 2026, 23:00 IST',
        status: 'scheduled',
        type: 'Firmware',
        compliancePercent: 88,
      },
      {
        id: 'mnt-3',
        title: 'Battery Health Servicing & Recalibration',
        target: 'LT-0106 & LT-0110',
        scheduledDate: '01 Dec 2026, 14:00 IST',
        status: 'pending',
        type: 'Hardware',
        compliancePercent: 100,
      },
    ]
  );

  const [
    lostStolenList,
    setLostStolenList,
    getLostStolenList,
  ] = useStoredState(
    'lost_stolen_assets',
    [
      {
        assetTag: 'LT-0123',
        model: 'Dell Latitude 5420',
        lastSeenLocation: 'Bengaluru Airport Terminal 1',
        flaggedDate: '20 Nov 2026, 16:20 IST',
        status: 'Remote Locked',
        notes: 'Sample lost-device tracking record.',
      },
    ]
  );

  const [
    qrModalAsset,
    setQrModalAsset,
  ] = useState(null);

  // ==========================================================
  // HELPDESK FEEDBACK
  // ==========================================================

  const [
    ticketFeedbacks,
    setTicketFeedbacks,
  ] = useStoredState(
    'ticket_feedback',
    [
      {
        ticketId: 'TKT-2049',
        requester: 'Gautam Banerjee',
        rating: 5,
        comment: 'Resolved permissions within 30 minutes.',
      },
      {
        ticketId: 'TKT-2051',
        requester: 'Harish Choudhury',
        rating: 4,
        comment: 'Printer issue resolved successfully.',
      },
      {
        ticketId: 'TKT-2056',
        requester: 'Bhavna Menon',
        rating: 5,
        comment: 'Connectivity restored successfully.',
      },
    ]
  );

  // ==========================================================
  // SECURITY SESSION DATA
  // ==========================================================

  const [
    activeSessions,
    setActiveSessions,
    getActiveSessions,
  ] = useStoredState(
    'active_sessions',
    [
      {
        id: 'ses-1',
        userName: 'Aman Verma',
        ip: '106.51.24.18',
        location: 'Bengaluru, IN',
        device: 'macOS 15.1 · Chrome 131',
        startedAt: '23 Nov 2026, 09:30 IST',
        isVpn: true,
      },
      {
        id: 'ses-2',
        userName: 'Priya Nair',
        ip: '106.51.24.18',
        location: 'Bengaluru, IN',
        device: 'macOS 15.1 · Terminal AWS CLI',
        startedAt: '23 Nov 2026, 10:15 IST',
        isVpn: false,
      },
      {
        id: 'ses-3',
        userName: 'Rohan Deshmukh',
        ip: '115.114.82.6',
        location: 'Pune, IN',
        device: 'Windows 11 · WireGuard Client',
        startedAt: '23 Nov 2026, 11:20 IST',
        isVpn: true,
      },
      {
        id: 'ses-4',
        userName: 'Vikram Malhotra',
        ip: '49.207.214.88',
        location: 'Gurugram, IN',
        device: 'macOS 14.5 · Chrome 130',
        startedAt: '23 Nov 2026, 08:45 IST',
        isVpn: false,
      },
      {
        id: 'ses-5',
        userName: 'Karthik Raja',
        ip: '122.178.44.10',
        location: 'Chennai, IN',
        device: 'Windows 11 · Edge 130',
        startedAt: '23 Nov 2026, 12:00 IST',
        isVpn: false,
      },
    ]
  );

  // ==========================================================
  // SCHEDULED REPORTS
  // ==========================================================

  const [
    scheduledReports,
    setScheduledReports,
    getScheduledReports,
  ] = useStoredState(
    'scheduled_reports',
    [
      {
        id: 'sch-1',
        name: 'Weekly Executive Operations Digest',
        format: 'Excel (XLSX) + PDF',
        cadence: 'Every Monday 09:00 IST',
        recipient: 'it-leadership@company.in',
        active: true,
        lastRun: '17 Nov 2026',
      },
      {
        id: 'sch-2',
        name: 'Monthly Hardware Warranty Report',
        format: 'Excel (XLSX)',
        cadence: '1st of Every Month',
        recipient: 'procurement@company.in',
        active: true,
        lastRun: '01 Nov 2026',
      },
      {
        id: 'sch-3',
        name: 'Access Governance & RBAC Audit',
        format: 'PDF',
        cadence: 'Bi-weekly Friday 18:00 IST',
        recipient: 'compliance@company.in',
        active: true,
        lastRun: '14 Nov 2026',
      },
    ]
  );

  // ==========================================================
  // LEGACY DATA COMPATIBILITY
  // Retained temporarily for existing dependent components.
  // Removed modules are not available in sidebar navigation.
  // ==========================================================

  const [
    networkDevices,
    setNetworkDevices,
  ] = useState(INITIAL_NETWORK_DEVICES);

  const networkMetrics = NETWORK_METRICS;

  const businessUnits = INITIAL_BUSINESS_UNITS;

  const locations = INITIAL_LOCATIONS;

  const [
    integrations,
    setIntegrations,
  ] = useStoredState(
    'integrations',
    INITIAL_INTEGRATIONS
  );

  const notificationRules =
    INITIAL_NOTIFICATION_RULES;

  const backupPolicies =
    BACKUP_POLICIES;

  const [
    documents,
    setDocuments,
  ] = useState(() =>
    INITIAL_DOCUMENTS.map(
      linkDocumentToEmployee
    )
  );

  // ==========================================================
  // DRAWERS, MODALS & TOASTS
  // ==========================================================

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState(null);

  const [
    activeDrawer,
    setActiveDrawer,
  ] = useState(null);

  const [
    drawerPayload,
    setDrawerPayload,
  ] = useState(null);

  const [
    confirmDialog,
    setConfirmDialog,
  ] = useState(null);

  const [toast, setToast] = useState(null);

  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message, undoFn = null) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      const toastId = uniqueId('toast');

      setToast({
        id: toastId,
        message,
        undoAction: undoFn,
      });

      toastTimerRef.current = setTimeout(() => {
        setToast(previous =>
          previous?.id === toastId
            ? null
            : previous
        );
      }, 6000);
    },
    []
  );

  const triggerUndo = useCallback(() => {
    if (!toast?.undoAction) return;

    const undo = toast.undoAction;

    setToast(null);

    undo();
  }, [toast]);

  function fail(message) {
    showToast(message);
    return false;
  }

  // ==========================================================
  // ROLE-BASED ACCESS CONTROL
  // ==========================================================

  const activeRoleProfile =
    roleProfiles.find(
      profile =>
        profile.id === currentUser?.adminRoleId
    ) ||
    roleProfiles.find(
      profile =>
        profile.name === currentUser?.role ||
        profile.tier === currentUser?.role
    ) ||
    (
      currentUser?.role === 'Super Administrator'
        ? roleProfiles.find(
            profile => profile.id === 'ROLE-001'
          )
        : null
    );

  const hasPermission = useCallback(
    (module, action) =>
      Boolean(
        isAuthenticated &&
        activeRoleProfile
          ?.permissions
          ?.[module]
          ?.[action] === true
      ),
    [isAuthenticated, activeRoleProfile]
  );

  function authorizeAction(
    action,
    module,
    permission,
    label
  ) {
    return (...args) => {
      if (!hasPermission(module, permission)) {
        return fail(
          `${label} requires ${module}: ${permission} permission.`
        );
      }

      return action(...args);
    };
  }

  // ==========================================================
  // ADMINISTRATIVE ACTIVITY LOGS
  // ==========================================================

  function addActivityLog(
    description,
    options = {}
  ) {
    const actor = options.actor || currentUser;

    const event = {
      id: uniqueId('evt'),

      time: timestampLabel(),

      userId: actor?.id || 'administrator',
      userName: actor?.name || 'Administrator',
      userEmail: actor?.email || '',
      userAvatar: initials(actor?.name),

      event: description,

      category: options.category || 'Admin actions',

      ipAddress: options.ipAddress || 'Local session',

      location:
        actor?.location ||
        'IT Administration',

      device: 'Browser administration console',

      result: options.result || 'success',

      severity: options.severity || 'info',

      acknowledged:
        options.acknowledged ?? true,

      ...options.details,
    };

    setEvents(previous => [
      event,
      ...previous,
    ]);

    return event.id;
  }

  // ==========================================================
  // AUTOMATIC NOTIFICATIONS
  // ==========================================================

  function addNotification({
    title,
    message,
    type = 'account',
    targetPage = 'dashboard',
    ...details
  }) {
    const resolvedPage =
      PAGE_ALIASES[targetPage] ||
      targetPage;

    if (
      !Object.prototype.hasOwnProperty.call(
        PAGE_PERMISSIONS,
        resolvedPage
      )
    ) {
      return null;
    }

    const notification = {
      id: uniqueId('notif'),
      title,
      message,
      type,
      targetPage: resolvedPage,
      time: 'Just now',
      createdAt: new Date().toISOString(),
      unread: true,
      ...details,
    };

    setNotifications(previous => [
      notification,
      ...previous,
    ]);

    return notification.id;
  }

  function removeGeneratedNotification(id) {
    if (!id) return;

    setNotifications(previous =>
      previous.filter(item => item.id !== id)
    );
  }

  function notifyAction(
    title,
    message,
    targetPage,
    type,
    undoAction = null,
    details = {}
  ) {
    const eventId = addActivityLog(message);

    const notificationId = addNotification({
      title,
      message,
      targetPage,
      type,
      ...details,
    });

    showToast(
      message,

      typeof undoAction === 'function'
        ? () => {
            undoAction();

            removeGeneratedNotification(
              notificationId
            );

            addActivityLog(
              `Reversed action: ${message}`,
              {
                details: {
                  reversedEventId: eventId,
                },
              }
            );

            showToast('Previous change restored.');
          }
        : null
    );
  }

  function canReadNotification(notification) {
    if (!isAuthenticated || !notification) {
      return false;
    }

    if (notification.type === 'network') {
      return false;
    }

    let page =
      PAGE_ALIASES[notification.targetPage] ||
      notification.targetPage;

    if (
      notification.type === 'request' &&
      /hardware allocation|asset allocation|device allocation/i.test(
        notification.title || ''
      )
    ) {
      page = 'allocate';
    }

    if (
      notification.type === 'request' &&
      /access request|permission request/i.test(
        notification.title || ''
      )
    ) {
      page = 'access';
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        PAGE_PERMISSIONS,
        page
      )
    ) {
      return false;
    }

    const permission = PAGE_PERMISSIONS[page];

    return !permission ||
      hasPermission(permission, 'read');
  }

  function markNotificationRead(id) {
    const notification =
      getNotifications().find(
        item => item.id === id
      );

    if (!canReadNotification(notification)) {
      return false;
    }

    setNotifications(previous =>
      previous.map(item =>
        item.id === id
          ? {
              ...item,
              unread: false,
              readAt: timestampLabel(),
            }
          : item
      )
    );

    return true;
  }

  function markAllNotificationsRead() {
    if (!isAuthenticated) return false;

    setNotifications(previous =>
      previous.map(item =>
        canReadNotification(item)
          ? {
              ...item,
              unread: false,
            }
          : item
      )
    );

    showToast('All visible notifications marked as read.');

    return true;
  }

  function dismissNotification(id) {
    const notification =
      getNotifications().find(
        item => item.id === id
      );

    if (!canReadNotification(notification)) {
      return false;
    }

    setNotifications(previous =>
      previous.filter(item => item.id !== id)
    );

    return true;
  }

  // ==========================================================
  // SAFE PAGE NAVIGATION
  // ==========================================================

  function navigate(pageId, optionalPayload = null) {
    const targetPage =
      PAGE_ALIASES[pageId] || pageId;

    if (
      !Object.prototype.hasOwnProperty.call(
        PAGE_PERMISSIONS,
        targetPage
      )
    ) {
      showToast(
        'This module is not available in IT Administration.'
      );

      return false;
    }

    const requiredPermission =
      PAGE_PERMISSIONS[targetPage];

    if (
      requiredPermission &&
      !hasPermission(requiredPermission, 'read')
    ) {
      return fail(
        'You do not have permission to access this module.'
      );
    }

    setActiveDrawer(null);
    setDrawerPayload(null);
    setSelectedTicketId(null);

    routerNavigate(resolveItAdminPath(targetPage));

    setActiveSubTab(
      optionalPayload?.subTab || 'all'
    );

    if (targetPage === 'dashboard') {
      setActiveSubDashboard(
        optionalPayload?.subDashboard ||
        'overview'
      );
    }

    if (
      targetPage === 'desk' &&
      optionalPayload?.ticketId
    ) {
      const ticket = getTickets().find(
        item =>
          item.id === optionalPayload.ticketId
      );

      if (ticket) {
        setSelectedTicketId(ticket.id);

        setDrawerPayload({
          ticketId: ticket.id,
        });

        setActiveDrawer('ticket_detail');
      }
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }

    return true;
  }

  function openSubDashboard(subId) {
    const permissions = {
      accounts: 'User Profiles',
      access: 'Security',
      devices: 'Assets',
      allocation: 'Assets',
      helpdesk: 'Helpdesk',
      software: 'Software',
      security: 'Security',
      reports: 'Reports',
      permissions: 'Role Administration',
    };

    const permission = permissions[subId];

    if (permission && !hasPermission(permission, 'read')) {
      return fail('Access to this dashboard is restricted.');
    }

    if (activePage !== 'dashboard') {
      routerNavigate('/it-admin/dashboard');
    }

    setActiveSubDashboard(
      subId === 'permissions'
        ? 'access'
        : subId
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    return true;
  }

  function closeSubDashboard() {
    setActiveSubDashboard('overview');
  }

  // ==========================================================
  // BRAND LOGO MANAGEMENT
  // ==========================================================

  function uploadLogo(file) {
    if (!file?.type?.startsWith('image/')) {
      return fail('Please select a valid image file.');
    }

    if (file.size > 2 * 1024 * 1024) {
      return fail('Please select an image smaller than 2 MB.');
    }

    const reader = new FileReader();

    reader.onload = event => {
      const dataUrl = event.target.result;

      setAppLogo(dataUrl);

      const persisted = writeStorage(
        'it_admin_custom_logo',
        dataUrl
      );

      addActivityLog('Company brand logo updated.');

      showToast(
        persisted
          ? 'Brand logo updated successfully.'
          : 'Logo updated for this session only. Storage is full.'
      );
    };

    reader.onerror = () =>
      showToast('Unable to read the selected image.');

    reader.readAsDataURL(file);

    return true;
  }

  function resetLogo() {
    setAppLogo(DEFAULT_LOGO);

    removeStorage('it_admin_custom_logo');

    addActivityLog('Company brand logo reset.');

    showToast('Brand logo restored to default.');

    return true;
  }

  // ==========================================================
  // PROFILE MANAGEMENT
  // ==========================================================

  function saveProfileAvatar(dataUrl) {
    setUserOverrides(prev => ({
      ...prev,
      avatarUrl: dataUrl,
    }));

    if (dataUrl) {
      writeStorage(
        'it_admin_profile_avatar',
        dataUrl
      );
    } else {
      removeStorage('it_admin_profile_avatar');
    }

    if (typeof authUpdateProfile === 'function') {
      authUpdateProfile({ avatarUrl: dataUrl });
    }
  }

  function updateProfilePicture(fileOrDataUrl) {
    if (typeof fileOrDataUrl === 'string') {
      if (!fileOrDataUrl.startsWith('data:image/')) {
        return fail('Invalid profile image.');
      }

      saveProfileAvatar(fileOrDataUrl);

      showToast('Profile picture updated successfully.');

      return true;
    }

    const file = fileOrDataUrl;

    if (!file?.type?.startsWith('image/')) {
      return fail('Please select a valid image.');
    }

    if (file.size > 2 * 1024 * 1024) {
      return fail('Profile picture must be smaller than 2 MB.');
    }

    const reader = new FileReader();

    reader.onload = event => {
      saveProfileAvatar(event.target.result);

      showToast('Profile picture updated successfully.');
    };

    reader.onerror = () =>
      showToast('Unable to read profile picture.');

    reader.readAsDataURL(file);

    return true;
  }

  function removeProfilePicture() {
    saveProfileAvatar(null);

    showToast('Profile picture removed.');

    return true;
  }

  // ==========================================================
  // SHARED AUTHENTICATION INTEGRATION
  // ==========================================================

  function signIn() {
    routerNavigate('/it-admin/dashboard');
    return true;
  }

  function signInWithGoogle() {
    routerNavigate('/it-admin/dashboard');
    return true;
  }

  function signOut() {
    addActivityLog(
      'Administrator signed out.',
      {
        category: 'Logins',
      }
    );

    setActiveDrawer(null);
    setDrawerPayload(null);
    setConfirmDialog(null);

    setSelectedTicketId(null);
    setQrModalAsset(null);

    setActiveSubDashboard('overview');
    setActiveSubTab('all');
    setSearchQuery('');

    authLogout();
    routerNavigate('/login', { replace: true });

    return true;
  }

  // ==========================================================
  // USER ACCOUNTS
  // ==========================================================

  function provisionUser(userData = {}) {
    const name = String(
      userData.name || ''
    ).trim();

    const email = normalize(
      userData.email
    );

    if (!name || !isValidEmail(email)) {
      return fail(
        'Enter a valid employee name and email address.'
      );
    }

    const currentUsers = getUsers();

    if (
      currentUsers.some(
        user => normalize(user.email) === email
      )
    ) {
      return fail(
        'An account with this email already exists.'
      );
    }

    const employeeNumber = nextNumericId(
      currentUsers,
      'employeeId',
      'EMP-',
      1000
    );

    const newUser = {
      id: uniqueId('usr'),
      employeeId: `EMP-${employeeNumber}`,

      name,
      email,

      department:
        userData.department || 'Unassigned',

      role:
        userData.role || 'Employee',

      location:
        userData.location || 'Bengaluru',

      contactNumber:
        userData.contactNumber || '',

      adminRoleId:
        userData.adminRoleId || 'ROLE-006',

      status: VALID_USER_STATUSES.includes(userData.status)
        ? userData.status
        : 'active',

      lastLogin: 'Never',
      deviceCount: 0,

      createdDate: todayLabel(),
    };

    setUsers(previous => [
      newUser,
      ...previous,
    ]);

    setAccessMatrix(previous => ({
      ...previous,
      [newUser.id]: {
        ...ROLE_PRESETS.RevokeAll,
      },
    }));

    notifyAction(
      'User Account Created',
      `Provisioned account for ${newUser.name}.`,
      'accounts',
      'account',
      () => {
        setUsers(previous =>
          previous.filter(
            user => user.id !== newUser.id
          )
        );

        setAccessMatrix(previous => {
          const next = { ...previous };

          delete next[newUser.id];

          return next;
        });
      },
      {
        userId: newUser.id,
      }
    );

    return newUser.id;
  }

  function updateUser(userId, updatedFields = {}) {
    const original = getUsers().find(
      user => user.id === userId
    );

    if (!original) {
      return fail('User account not found.');
    }

    const updated = {
      ...original,
      ...updatedFields,
      id: original.id,
      employeeId: original.employeeId,
    };

    updated.name = String(
      updated.name || ''
    ).trim();

    updated.email = normalize(updated.email);

    if (!updated.name || !isValidEmail(updated.email)) {
      return fail(
        'Employee name and valid email are required.'
      );
    }

    if (
      getUsers().some(user =>
        user.id !== userId &&
        normalize(user.email) === updated.email
      )
    ) {
      return fail('This email is already in use.');
    }

    if (!VALID_USER_STATUSES.includes(updated.status)) {
      return fail('Invalid account status.');
    }

    const originalAssets = getAssets();

    const originalAccess =
      getAccessMatrix()[userId];

    const originalRequests =
      getPendingRequests();

    const originalSessions =
      getActiveSessions();

    const originalHistory =
      getCustodyHistory();

    setUsers(previous =>
      previous.map(user =>
        user.id === userId
          ? updated
          : user
      )
    );

    if (updated.name !== original.name) {
      setAssets(previous =>
        previous.map(asset =>
          asset.assignedTo === userId
            ? {
                ...asset,
                assignedName: updated.name,
                assignedEmployee: updated.name,
              }
            : asset
        )
      );

      setCustodyHistory(previous =>
        previous.map(entry =>
          entry.userId === userId &&
          !entry.returnDate
            ? {
                ...entry,
                userName: updated.name,
              }
            : entry
        )
      );

      setPendingRequests(previous =>
        previous.map(request =>
          request.userId === userId &&
          request.status === 'pending'
            ? {
                ...request,
                userName: updated.name,
                userRole: updated.role,
              }
            : request
        )
      );
    }

    const statusChanged =
      updated.status !== original.status;

    if (
      statusChanged &&
      [
        'suspended',
        'deactivated',
      ].includes(updated.status)
    ) {
      setAccessMatrix(previous => ({
        ...previous,
        [userId]: {
          ...ROLE_PRESETS.RevokeAll,
        },
      }));

      setAssets(previous =>
        previous.map(asset =>
          asset.assignedTo === userId &&
          asset.status === 'assigned'
            ? {
                ...asset,
                status: 'overdue return',
              }
            : asset
        )
      );

      setPendingRequests(previous =>
        previous.map(request =>
          request.userId === userId &&
          request.status === 'pending'
            ? {
                ...request,
                status: 'rejected',
                approvedBy: currentUser.name,
                approvedDate: timestampLabel(),
                rejectionReason: 'Account disabled',
              }
            : request
        )
      );

      setActiveSessions(previous =>
        previous.filter(session =>
          session.userId !== userId &&
          session.userName !== original.name
        )
      );
    }

    notifyAction(
      'User Account Updated',

      statusChanged
        ? `${updated.name} account status changed to ${updated.status}.`
        : `Updated account details for ${updated.name}.`,

      'accounts',
      'account',

      () => {
        setUsers(previous =>
          previous.map(user =>
            user.id === userId
              ? original
              : user
          )
        );

        setAssets(originalAssets);
        setPendingRequests(originalRequests);
        setActiveSessions(originalSessions);
        setCustodyHistory(originalHistory);

        setAccessMatrix(previous => {
          const next = { ...previous };

          if (originalAccess) {
            next[userId] = originalAccess;
          } else {
            delete next[userId];
          }

          return next;
        });
      },

      { userId }
    );

    return true;
  }

  function setUserStatus(userId, newStatus) {
    if (!VALID_USER_STATUSES.includes(newStatus)) {
      return fail('Invalid account status.');
    }

    const user = getUsers().find(
      item => item.id === userId
    );

    if (!user) {
      return fail('User account not found.');
    }

    if (user.status === newStatus) {
      return fail(
        `Account is already ${newStatus}.`
      );
    }

    return updateUser(userId, {
      status: newStatus,
    });
  }

  function deleteUser(userId) {
    const original = getUsers().find(
      user => user.id === userId
    );

    if (!original) {
      return fail('User account not found.');
    }

    if (
      original.id === currentUser?.id ||
      normalize(original.email) === normalize(currentUser?.email)
    ) {
      return fail(
        'You cannot delete your active administrator account.'
      );
    }

    const assignedAssets = getAssets().filter(
      asset =>
        asset.assignedTo === userId ||
        asset.assignedEmployeeId === userId
    );

    if (assignedAssets.length > 0) {
      return fail(
        'Return all assigned assets before deleting this account.'
      );
    }

    const originalAccess =
      getAccessMatrix()[userId];

    const originalRequests =
      getPendingRequests();

    setUsers(previous =>
      previous.filter(
        user => user.id !== userId
      )
    );

    setAccessMatrix(previous => {
      const next = { ...previous };

      delete next[userId];

      return next;
    });

    setPendingRequests(previous =>
      previous.filter(
        request => request.userId !== userId
      )
    );

    notifyAction(
      'User Account Deleted',
      `Deleted profile for ${original.name}.`,
      'accounts',
      'account',
      () => {
        setUsers(previous => [
          original,
          ...previous,
        ]);

        setPendingRequests(originalRequests);

        if (originalAccess) {
          setAccessMatrix(previous => ({
            ...previous,
            [userId]: originalAccess,
          }));
        }
      }
    );

    return true;
  }

  function bulkCreateUsers(userList = []) {
    const existingUsers = getUsers();

    const emails = new Set(
      existingUsers.map(
        user => normalize(user.email)
      )
    );

    let nextNumber = nextNumericId(
      existingUsers,
      'employeeId',
      'EMP-',
      1000
    );

    const created = [];

    safeArray(userList).forEach(item => {
      const name = String(
        item.name || ''
      ).trim();

      if (!name) return;

      const email = normalize(
        item.email ||
        `${name.toLowerCase().replace(/\s+/g, '.')}@company.in`
      );

      if (
        !isValidEmail(email) ||
        emails.has(email)
      ) {
        return;
      }

      emails.add(email);

      created.push({
        id: uniqueId('usr-bulk'),

        employeeId: `EMP-${nextNumber++}`,

        name,
        email,

        department:
          item.department || 'Engineering',

        role:
          item.role || 'Employee',

        location:
          item.location || 'Bengaluru',

        contactNumber:
          item.contactNumber || '',

        adminRoleId: 'ROLE-006',

        status: 'active',
        lastLogin: 'Never',
        deviceCount: 0,

        createdDate: todayLabel(),
      });
    });

    if (!created.length) {
      return fail(
        'No valid unique employee accounts were found.'
      );
    }

    setUsers(previous => [
      ...created,
      ...previous,
    ]);

    setAccessMatrix(previous => {
      const next = { ...previous };

      created.forEach(user => {
        next[user.id] = {
          ...ROLE_PRESETS.RevokeAll,
        };
      });

      return next;
    });

    notifyAction(
      'Bulk User Provisioning',

      `Created ${created.length} accounts. Skipped ${
        userList.length - created.length
      } invalid or duplicate records.`,

      'accounts',
      'account',

      () => {
        const ids = new Set(
          created.map(user => user.id)
        );

        setUsers(previous =>
          previous.filter(
            user => !ids.has(user.id)
          )
        );

        setAccessMatrix(previous => {
          const next = { ...previous };

          ids.forEach(id => {
            delete next[id];
          });

          return next;
        });
      }
    );

    return created.length;
  }

  function automateOffboarding(userId) {
    return setUserStatus(
      userId,
      'deactivated'
    );
  }

  // ==========================================================
  // ASSET MANAGEMENT
  // ==========================================================

  function addAsset(assetData = {}) {
    const currentAssets = getAssets();

    const model = String(
      assetData.model ||
      assetData.name ||
      ''
    ).trim();

    const serial = String(
      assetData.serial ||
      assetData.serialNumber ||
      ''
    ).trim();

    if (!model || !serial) {
      return fail(
        'Asset name and serial number are required.'
      );
    }

    if (
      currentAssets.some(asset =>
        normalize(
          asset.serial || asset.serialNumber
        ) === normalize(serial)
      )
    ) {
      return fail(
        'An asset with this serial number already exists.'
      );
    }

    const sequence = nextNumericId(
      currentAssets,
      'assetId',
      'USR-'
    );

    const assetId =
      `USR-${String(sequence).padStart(3, '0')}`;

    const assetTag = String(
      assetData.assetTag ||
      assetId
    ).trim();

    if (
      currentAssets.some(asset =>
        normalize(asset.assetTag) === normalize(assetTag)
      )
    ) {
      return fail('Asset tag already exists.');
    }

    const cost = Number(
      assetData.cost ??
      assetData.purchaseCost ??
      0
    );

    if (!Number.isFinite(cost) || cost < 0) {
      return fail(
        'Enter a valid non-negative purchase cost.'
      );
    }

    const newAsset = synchronizeAssetFields(
      {
        ...assetData,

        id: uniqueId('ast'),

        assetId,
        assetTag,
        model,

        type:
          assetData.type ||
          assetData.category ||
          'Laptops',

        serial,

        purchaseDate:
          assetData.purchaseDate ||
          todayLabel(),

        warrantyEnd:
          assetData.warrantyEnd || '',

        status:
          assetData.status === 'assigned'
            ? 'in stock'
            : assetData.status || 'in stock',

        location:
          assetData.location || 'Bengaluru',

        cost,

        assignedTo: null,
        assignedName: null,
        assignedEmployeeId: null,
        assignedEmployee: null,

        condition:
          assetData.condition || 'good',
      },
      {},
      getUsers()
    );

    setAssets(previous => [
      newAsset,
      ...previous,
    ]);

    notifyAction(
      'New Asset Registered',
      `Added ${newAsset.assetTag} (${newAsset.model}).`,
      'inventory',
      'asset',
      () => {
        setAssets(previous =>
          previous.filter(
            item => item.id !== newAsset.id
          )
        );
      },
      {
        assetId: newAsset.id,
      }
    );

    if (assetData.assignedTo || assetData.assignedEmployeeId) {
      assignAsset(
        newAsset.id,
        assetData.assignedTo ||
          assetData.assignedEmployeeId,
        newAsset.condition
      );
    }

    return newAsset.id;
  }

  function updateAsset(assetId, updatedFields = {}) {
    const original = getAssets().find(
      asset => asset.id === assetId
    );

    if (!original) {
      return fail('Asset record not found.');
    }

    const updated = synchronizeAssetFields(
      original,
      {
        ...updatedFields,
        id: original.id,
        assetId: original.assetId,
      },
      getUsers()
    );

    if (!updated.model || !updated.serial) {
      return fail(
        'Asset model and serial number are required.'
      );
    }

    if (
      getAssets().some(asset =>
        asset.id !== assetId &&
        (
          normalize(asset.assetTag) === normalize(updated.assetTag) ||
          normalize(asset.serial || asset.serialNumber) === normalize(updated.serial)
        )
      )
    ) {
      return fail(
        'Asset tag or serial number already exists.'
      );
    }

    if (
      updated.assignedTo !== original.assignedTo
    ) {
      return fail(
        'Use Asset Allocation to change employee assignment.'
      );
    }

    if (
      original.assignedTo &&
      updated.status === 'in stock'
    ) {
      return fail(
        'Return this asset through Asset Allocation first.'
      );
    }

    if (
      updated.status === 'assigned' &&
      !updated.assignedTo
    ) {
      return fail(
        'Select an employee through Asset Allocation.'
      );
    }

    const oldHistory = getCustodyHistory();

    setAssets(previous =>
      previous.map(asset =>
        asset.id === assetId
          ? updated
          : asset
      )
    );

    if (
      original.assetTag !== updated.assetTag ||
      original.model !== updated.model
    ) {
      setCustodyHistory(previous =>
        previous.map(entry =>
          entry.assetTag === original.assetTag &&
          !entry.returnDate
            ? {
                ...entry,
                assetTag: updated.assetTag,
                model: updated.model,
              }
            : entry
        )
      );
    }

    notifyAction(
      'Asset Details Updated',
      `Updated asset ${updated.assetTag}.`,
      'inventory',
      'asset',
      () => {
        setAssets(previous =>
          previous.map(asset =>
            asset.id === assetId
              ? original
              : asset
          )
        );

        setCustodyHistory(oldHistory);
      }
    );

    return true;
  }

  function setAssetStatus(assetId, newStatus) {
    const asset = getAssets().find(
      item => item.id === assetId
    );

    if (!asset) {
      return fail('Asset record not found.');
    }

    if (asset.status === newStatus) {
      return fail(
        `Asset is already ${newStatus}.`
      );
    }

    if (
      asset.assignedTo &&
      newStatus === 'retired'
    ) {
      return fail(
        'Return the assigned asset before retirement.'
      );
    }

    return updateAsset(
      assetId,
      { status: newStatus }
    );
  }

  // ==========================================================
  // ASSET ALLOCATION
  // ==========================================================

  function assignAsset(
    assetId,
    userId,
    condition = 'good',
    notes = '',
    handoverDate = ''
  ) {
    const asset = getAssets().find(
      item => item.id === assetId
    );

    const user = findUser(
      getUsers(),
      userId
    );

    if (!asset) {
      return fail('Selected asset was not found.');
    }

    if (!user) {
      return fail('Select a valid employee.');
    }

    if (
      !['active', 'provisioning'].includes(
        user.status
      )
    ) {
      return fail(
        'Assets cannot be assigned to inactive accounts.'
      );
    }

    if (
      asset.status !== 'in stock' ||
      asset.assignedTo
    ) {
      return fail(
        'This asset is not available for allocation.'
      );
    }

    const originalHistory =
      getCustodyHistory();

    if (
      originalHistory.some(entry =>
        entry.assetTag === asset.assetTag &&
        !entry.returnDate
      )
    ) {
      return fail(
        'An open custody record already exists for this asset.'
      );
    }

    const effectiveDate =
      String(handoverDate || '').trim() ||
      todayLabel();

    const updatedAsset =
      synchronizeAssetFields(
        asset,
        {
          status: 'assigned',

          assignedTo: user.id,
          assignedName: user.name,

          assignedDate: effectiveDate,

          condition,
        },
        getUsers()
      );

    const historyEntry = {
      id: uniqueId('cst'),

      assetId: asset.id,
      assetTag: asset.assetTag,
      model: asset.model,

      userId: user.id,
      userName: user.name,
      employeeId: user.employeeId,

      assignedDate: effectiveDate,

      returnDate: null,

      conditionAtIssue: condition,
      conditionAtReturn: null,

      notes:
        notes || 'Assigned to employee',
    };

    setAssets(previous =>
      previous.map(item =>
        item.id === assetId
          ? updatedAsset
          : item
      )
    );

    setCustodyHistory(previous => [
      historyEntry,
      ...previous,
    ]);

    notifyAction(
      'Asset Allocated',

      `Assigned ${asset.assetTag} to ${user.name}.`,

      'allocate',
      'allocation',

      () => {
        setAssets(previous =>
          previous.map(item =>
            item.id === assetId
              ? asset
              : item
          )
        );

        setCustodyHistory(originalHistory);
      },

      {
        assetId,
        userId: user.id,
      }
    );

    return true;
  }

  function returnAsset(
    assetId,
    conditionAtReturn = 'good',
    returnNotes = ''
  ) {
    const asset = getAssets().find(
      item => item.id === assetId
    );

    if (!asset) {
      return fail('Asset record not found.');
    }

    if (!asset.assignedTo) {
      return fail(
        'This asset is not currently assigned.'
      );
    }

    const originalHistory =
      getCustodyHistory();

    const returnDate = todayLabel();

    const returnedAsset =
      synchronizeAssetFields(
        asset,
        {
          status: 'in stock',

          assignedTo: null,
          assignedEmployeeId: null,

          assignedToId: null,
          employeeId: null,

          assignedName: null,
          assignedEmployee: null,

          assignedDate: null,

          condition: conditionAtReturn,
        },
        getUsers()
      );

    setAssets(previous =>
      previous.map(item =>
        item.id === assetId
          ? returnedAsset
          : item
      )
    );

    const hasOpenRecord = originalHistory.some(
      entry =>
        entry.assetTag === asset.assetTag &&
        !entry.returnDate
    );

    setCustodyHistory(previous => {
      const next = previous.map(entry =>
        entry.assetTag === asset.assetTag &&
        !entry.returnDate
          ? {
              ...entry,

              returnDate,
              conditionAtReturn,

              notes: [
                entry.notes,
                returnNotes
                  ? `Return note: ${returnNotes}`
                  : '',
              ].filter(Boolean).join(' | '),
            }
          : entry
      );

      if (!hasOpenRecord) {
        next.unshift({
          id: uniqueId('cst'),

          assetId: asset.id,
          assetTag: asset.assetTag,
          model: asset.model,

          userId: asset.assignedTo,
          userName: asset.assignedName,

          assignedDate:
            asset.assignedDate ||
            asset.purchaseDate,

          returnDate,

          conditionAtIssue: asset.condition,
          conditionAtReturn,

          notes:
            returnNotes ||
            'Asset returned to inventory',
        });
      }

      return next;
    });

    notifyAction(
      'Asset Returned',

      `Returned ${asset.assetTag} to inventory.`,

      'allocate',
      'allocation',

      () => {
        setAssets(previous =>
          previous.map(item =>
            item.id === assetId
              ? asset
              : item
          )
        );

        setCustodyHistory(originalHistory);
      },

      { assetId }
    );

    return true;
  }

  function transferAsset(
    assetId,
    targetUserId,
    notes = '',
    condition = 'good'
  ) {
    const asset = getAssets().find(
      item => item.id === assetId
    );

    const targetUser = findUser(
      getUsers(),
      targetUserId
    );

    if (!asset || !asset.assignedTo) {
      return fail(
        'Select an allocated asset to transfer.'
      );
    }

    if (
      !targetUser ||
      !['active', 'provisioning'].includes(
        targetUser.status
      )
    ) {
      return fail(
        'Select an eligible employee.'
      );
    }

    if (targetUser.id === asset.assignedTo) {
      return fail(
        'Asset is already assigned to this employee.'
      );
    }

    const originalHistory =
      getCustodyHistory();

    const transferDate = todayLabel();

    const updatedAsset =
      synchronizeAssetFields(
        asset,
        {
          assignedTo: targetUser.id,
          assignedName: targetUser.name,

          status: 'assigned',

          assignedDate: transferDate,
          condition,
        },
        getUsers()
      );

    setAssets(previous =>
      previous.map(item =>
        item.id === assetId
          ? updatedAsset
          : item
      )
    );

    setCustodyHistory(previous => {
      const closed = previous.map(entry =>
        entry.assetTag === asset.assetTag &&
        !entry.returnDate
          ? {
              ...entry,

              returnDate: transferDate,
              conditionAtReturn: condition,

              notes: [
                entry.notes,
                `Transferred to ${targetUser.name}`,
              ].filter(Boolean).join(' | '),
            }
          : entry
      );

      return [
        {
          id: uniqueId('cst'),

          assetId,
          assetTag: asset.assetTag,
          model: asset.model,

          userId: targetUser.id,
          userName: targetUser.name,

          assignedDate: transferDate,

          returnDate: null,

          conditionAtIssue: condition,
          conditionAtReturn: null,

          notes:
            notes ||
            `Transferred from ${asset.assignedName}`,
        },
        ...closed,
      ];
    });

    notifyAction(
      'Asset Transferred',

      `Transferred ${asset.assetTag} to ${targetUser.name}.`,

      'allocate',
      'allocation',

      () => {
        setAssets(previous =>
          previous.map(item =>
            item.id === assetId
              ? asset
              : item
          )
        );

        setCustodyHistory(originalHistory);
      }
    );

    return true;
  }

  // ==========================================================
  // HELPDESK TICKET MANAGEMENT
  // ==========================================================

  function createTicket(ticketData = {}) {
    const title = String(
      ticketData.title || ''
    ).trim();

    if (!title) {
      return fail('Ticket title is required.');
    }

    const user = findUser(
      getUsers(),
      ticketData.requesterId ||
      ticketData.requesterName
    );

    if (!user) {
      return fail('Select a valid ticket requester.');
    }

    const ticketNumber = nextNumericId(
      getTickets(),
      'id',
      'TKT-',
      2000
    );

    const priority =
      ticketData.priority || 'medium';

    const createdAt = timestampLabel();

    const newTicket = {
      ...ticketData,

      id: `TKT-${ticketNumber}`,

      title,

      category:
        ticketData.category || 'Hardware',

      requesterId: user.id,
      requesterName: user.name,
      requesterAvatar: initials(user.name),

      priority,

      status: 'open',

      assignedTo:
        ticketData.assignedTo ||
        'Unassigned',

      createdAt,
      updatedAt: createdAt,

      createdAtISO:
        new Date().toISOString(),

      age: 'Just now',

      slaHours:
        priority === 'critical'
          ? 4
          : priority === 'high'
            ? 8
            : 24,

      slaElapsedHours: 0,

      description:
        ticketData.description || '',

      notes: [],

      resolutionNote: '',
    };

    setTickets(previous => [
      newTicket,
      ...previous,
    ]);

    notifyAction(
      'New Helpdesk Ticket',

      `Created ticket ${newTicket.id}: ${title}`,

      'desk',
      'ticket',

      () => {
        setTickets(previous =>
          previous.filter(
            ticket => ticket.id !== newTicket.id
          )
        );
      },

      {
        ticketId: newTicket.id,
      }
    );

    return newTicket.id;
  }

  function updateTicket(ticketId, updates = {}) {
    const original = getTickets().find(
      ticket => ticket.id === ticketId
    );

    if (!original) {
      return fail('Ticket record not found.');
    }

    const updated = {
      ...original,
      ...updates,

      id: original.id,

      updatedAt: timestampLabel(),
      updatedAtISO: new Date().toISOString(),
    };

    if (!String(updated.title || '').trim()) {
      return fail('Ticket title cannot be empty.');
    }

    if (
      updates.priority &&
      updates.priority !== original.priority
    ) {
      updated.slaHours =
        updates.priority === 'critical'
          ? 4
          : updates.priority === 'high'
            ? 8
            : 24;
    }

    if (
      ['resolved', 'closed'].includes(updated.status) &&
      !['resolved', 'closed'].includes(original.status)
    ) {
      updated.resolvedAt = timestampLabel();
      updated.resolvedAtISO = new Date().toISOString();
    }

    if (
      updated.status === 'open' &&
      ['resolved', 'closed'].includes(original.status)
    ) {
      updated.resolvedAt = null;
      updated.resolvedAtISO = null;
    }

    setTickets(previous =>
      previous.map(ticket =>
        ticket.id === ticketId
          ? updated
          : ticket
      )
    );

    notifyAction(
      'Helpdesk Ticket Updated',
      `Updated ticket ${ticketId}.`,
      'desk',
      'ticket',
      () => {
        setTickets(previous =>
          previous.map(ticket =>
            ticket.id === ticketId
              ? original
              : ticket
          )
        );
      },
      { ticketId }
    );

    return true;
  }

  function addTicketNote(
    ticketId,
    text,
    author = currentUser?.name || 'IT Administrator'
  ) {
    const content = String(text || '').trim();

    const ticket = getTickets().find(
      item => item.id === ticketId
    );

    if (!ticket) {
      return fail('Ticket record not found.');
    }

    if (!content) {
      return fail('Enter a note before submitting.');
    }

    const note = {
      id: uniqueId('note'),

      author,
      time: timestampLabel(),
      text: content,
    };

    setTickets(previous =>
      previous.map(item =>
        item.id === ticketId
          ? {
              ...item,

              notes: [
                ...safeArray(item.notes),
                note,
              ],

              updatedAt: timestampLabel(),
            }
          : item
      )
    );

    addActivityLog(
      `Added a support note to ${ticketId}.`
    );

    showToast('Ticket note added.');

    return true;
  }

  function resolveTicket(
    ticketId,
    resolutionNote = 'Resolved by technician'
  ) {
    const ticket = getTickets().find(
      item => item.id === ticketId
    );

    if (!ticket) {
      return fail('Ticket record not found.');
    }

    if (ticket.status === 'resolved') {
      return fail('Ticket is already resolved.');
    }

    const resolution =
      String(resolutionNote || '').trim();

    if (!resolution) {
      return fail('Enter resolution details.');
    }

    return updateTicket(ticketId, {
      status: 'resolved',

      resolutionNote: resolution,

      resolvedBy: currentUser.name,

      resolvedAt: timestampLabel(),
      resolvedAtISO: new Date().toISOString(),
    });
  }

  function reopenTicket(ticketId) {
    const ticket = getTickets().find(
      item => item.id === ticketId
    );

    if (!ticket) {
      return fail('Ticket record not found.');
    }

    if (
      !['resolved', 'closed'].includes(
        ticket.status
      )
    ) {
      return fail(
        'Only resolved or closed tickets can be reopened.'
      );
    }

    return updateTicket(ticketId, {
      status: 'open',
      resolvedAt: null,
      resolvedAtISO: null,

      notes: [
        ...safeArray(ticket.notes),
        {
          id: uniqueId('note'),
          author: currentUser.name,
          time: timestampLabel(),
          text: 'Ticket reopened by IT Administrator.',
        },
      ],
    });
  }

  function escalateTicket(ticketId, targetLevel) {
    const ticket = getTickets().find(
      item => item.id === ticketId
    );

    if (!ticket) {
      return fail('Ticket record not found.');
    }

    return updateTicket(ticketId, {
      priority: 'critical',

      escalationLevel:
        targetLevel || 'Level 2',

      notes: [
        ...safeArray(ticket.notes),
        {
          id: uniqueId('note'),
          author: currentUser.name,
          time: timestampLabel(),

          text: `Escalated to ${
            targetLevel || 'Level 2'
          }.`,
        },
      ],
    });
  }

  function submitTicketFeedback(
    ticketId,
    rating,
    comment
  ) {
    const ticket = getTickets().find(
      item => item.id === ticketId
    );

    const score = Number(rating);

    if (!ticket) {
      return fail('Ticket record not found.');
    }

    if (
      !Number.isInteger(score) ||
      score < 1 ||
      score > 5
    ) {
      return fail(
        'Select a rating between 1 and 5.'
      );
    }

    setTicketFeedbacks(previous => [
      {
        ticketId,
        requester: ticket.requesterName,
        rating: score,
        comment: String(comment || '').trim(),
        submittedAt: timestampLabel(),
      },

      ...previous.filter(
        item => item.ticketId !== ticketId
      ),
    ]);

    showToast(
      `Feedback recorded for ${ticketId}.`
    );

    return true;
  }

  // ==========================================================
  // SOFTWARE LICENSE MANAGEMENT
  // ==========================================================

  function addSoftwareLicence(licenceData = {}) {
    const name = String(
      licenceData.name || ''
    ).trim();

    if (!name) {
      return fail('Software name is required.');
    }

    const totalSeats = Number(
      licenceData.totalSeats ?? 1
    );

    const seatsUsed = Number(
      licenceData.seatsUsed ?? 0
    );

    const annualCost = Number(
      licenceData.annualCost ??
      licenceData.costPerYear ??
      0
    );

    if (
      !Number.isInteger(totalSeats) ||
      totalSeats < 1 ||
      !Number.isInteger(seatsUsed) ||
      seatsUsed < 0 ||
      seatsUsed > totalSeats
    ) {
      return fail(
        'Enter valid license seat quantities.'
      );
    }

    if (!Number.isFinite(annualCost) || annualCost < 0) {
      return fail('Enter a valid annual license cost.');
    }

    if (
      getSoftware().some(item =>
        normalize(item.name) === normalize(name) &&
        normalize(item.vendor) === normalize(licenceData.vendor)
      )
    ) {
      return fail(
        'This software license already exists.'
      );
    }

    const newLicence =
      synchronizeSoftwareFields({
        ...licenceData,

        id: uniqueId('sft'),

        name,

        vendor:
          licenceData.vendor ||
          'Independent Vendor',

        version:
          licenceData.version || 'Cloud',

        licenseKey:
          licenceData.licenseKey || '',

        subscriptionModel:
          licenceData.subscriptionModel ||
          licenceData.licenceType ||
          'Subscription',

        totalSeats,
        seatsUsed,

        annualCost,

        expiryDate:
          licenceData.expiryDate ||
          licenceData.renewalDate ||
          '',

        status:
          licenceData.renewalStatus ||
          'active',

        category:
          licenceData.category ||
          'Productivity',

        installationHistory: [],
      });

    setSoftware(previous => [
      newLicence,
      ...previous,
    ]);

    notifyAction(
      'Software License Added',

      `Added software license ${newLicence.name}.`,

      'licences',
      'license',

      () => {
        setSoftware(previous =>
          previous.filter(
            item => item.id !== newLicence.id
          )
        );
      }
    );

    return newLicence.id;
  }

  function updateSoftwareLicence(
    softwareId,
    updates = {}
  ) {
    const original = getSoftware().find(
      item => item.id === softwareId
    );

    if (!original) {
      return fail('Software license not found.');
    }

    const total = Number(
      updates.totalSeats ??
      original.totalSeats
    );

    const used = Number(
      updates.seatsUsed ??
      original.seatsUsed
    );

    if (
      !Number.isInteger(total) ||
      total < 1 ||
      !Number.isInteger(used) ||
      used < 0 ||
      used > total
    ) {
      return fail(
        'Used seats cannot exceed total license seats.'
      );
    }

    const allocatedCount =
      safeArray(original.installationHistory)
        .filter(record =>
          record.status === 'Allocated'
        ).length;

    if (used < allocatedCount) {
      return fail(
        'Release employee allocations before reducing used seats.'
      );
    }

    const updated =
      synchronizeSoftwareFields(
        original,
        updates
      );

    setSoftware(previous =>
      previous.map(item =>
        item.id === softwareId
          ? updated
          : item
      )
    );

    notifyAction(
      'Software License Updated',

      `Updated license ${updated.name}.`,

      'licences',
      'license',

      () => {
        setSoftware(previous =>
          previous.map(item =>
            item.id === softwareId
              ? original
              : item
          )
        );
      }
    );

    return true;
  }

  // ==========================================================
  // SOFTWARE INSTALLATION HISTORY
  // Existing UI calls this and adjustSoftwareSeats separately.
  // ==========================================================

  function recordSoftwareInstallation(
    softwareId,
    installation = {}
  ) {
    const licence = getSoftware().find(
      item => item.id === softwareId
    );

    if (!licence) {
      return fail('Software license not found.');
    }

    const history =
      safeArray(licence.installationHistory);

    if (
      installation.userId &&
      history.some(item =>
        item.userId === installation.userId &&
        item.status === 'Allocated'
      )
    ) {
      return fail(
        'This employee already has an active allocation.'
      );
    }

    if (
      installation.status === 'Allocated' &&
      (
        licence.seatsUsed >= licence.totalSeats ||
        synchronizeSoftwareFields(licence).status === 'expired'
      )
    ) {
      return fail(
        'No valid license seat is available.'
      );
    }

    const entry = {
      id: uniqueId('ins'),

      ...installation,

      installedAt: timestampLabel(),
    };

    setSoftware(previous =>
      previous.map(item =>
        item.id === softwareId
          ? {
              ...item,

              installationHistory: [
                entry,
                ...history,
              ],
            }
          : item
      )
    );

    addActivityLog(
      `Recorded ${licence.name} allocation or installation.`
    );

    showToast(
      `Local software record updated for ${licence.name}.`
    );

    return true;
  }

  function adjustSoftwareSeats(
    softwareId,
    delta
  ) {
    const licence = getSoftware().find(
      item => item.id === softwareId
    );

    if (!licence) {
      return fail('Software license not found.');
    }

    const change = Number(delta);

    if (!Number.isInteger(change) || change === 0) {
      return fail('Invalid license seat adjustment.');
    }

    const newUsed =
      Number(licence.seatsUsed) + change;

    if (
      newUsed < 0 ||
      newUsed > licence.totalSeats
    ) {
      return fail(
        'License seat adjustment exceeds available limits.'
      );
    }

    if (
      change > 0 &&
      synchronizeSoftwareFields(licence).status === 'expired'
    ) {
      return fail(
        'Renew this license before allocating additional seats.'
      );
    }

    const trackedAllocations =
      safeArray(licence.installationHistory)
        .filter(item =>
          item.status === 'Allocated'
        ).length;

    if (newUsed < trackedAllocations) {
      return fail(
        'Release a specific employee license allocation first.'
      );
    }

    setSoftware(previous =>
      previous.map(item =>
        item.id === softwareId
          ? synchronizeSoftwareFields(item, {
              seatsUsed: newUsed,
            })
          : item
      )
    );

    notifyAction(
      'License Seats Updated',

      `${licence.name}: ${Math.abs(change)} seat(s) ${
        change > 0
          ? 'allocated'
          : 'released'
      }.`,

      'licences',
      'license',

      () => {
        setSoftware(previous =>
          previous.map(item =>
            item.id === softwareId
              ? licence
              : item
          )
        );
      }
    );

    return true;
  }

  // Atomic employee-wise license allocation.

  function allocateSoftwareSeat(
    softwareId,
    userId,
    method = 'Manual allocation'
  ) {
    const licence = getSoftware().find(
      item => item.id === softwareId
    );

    const user = findUser(
      getUsers(),
      userId
    );

    if (!licence || !user) {
      return fail(
        'Select a valid software license and employee.'
      );
    }

    if (user.status !== 'active') {
      return fail(
        'Software can only be allocated to active employees.'
      );
    }

    if (
      synchronizeSoftwareFields(licence).status === 'expired'
    ) {
      return fail('Software license has expired.');
    }

    if (licence.seatsUsed >= licence.totalSeats) {
      return fail('No free license seats are available.');
    }

    const history =
      safeArray(licence.installationHistory);

    if (
      history.some(item =>
        item.userId === user.id &&
        item.status === 'Allocated'
      )
    ) {
      return fail(
        'This employee already has this license.'
      );
    }

    setSoftware(previous =>
      previous.map(item =>
        item.id === softwareId
          ? synchronizeSoftwareFields(item, {
              seatsUsed: item.seatsUsed + 1,

              installationHistory: [
                {
                  id: uniqueId('ins'),
                  userId: user.id,
                  userName: user.name,
                  employeeId: user.employeeId,
                  method,
                  status: 'Allocated',
                  installedAt: timestampLabel(),
                },

                ...history,
              ],
            })
          : item
      )
    );

    notifyAction(
      'Software License Allocated',

      `Allocated ${licence.name} to ${user.name}.`,

      'licences',
      'license',

      () => {
        setSoftware(previous =>
          previous.map(item =>
            item.id === softwareId
              ? licence
              : item
          )
        );
      }
    );

    return true;
  }

  function releaseSoftwareSeat(
    softwareId,
    allocationId
  ) {
    const licence = getSoftware().find(
      item => item.id === softwareId
    );

    if (!licence) {
      return fail('Software license not found.');
    }

    const allocation =
      safeArray(licence.installationHistory)
        .find(item =>
          (
            item.id === allocationId ||
            item.userId === allocationId
          ) &&
          item.status === 'Allocated'
        );

    if (!allocation) {
      return fail('Active license allocation not found.');
    }

    setSoftware(previous =>
      previous.map(item =>
        item.id === softwareId
          ? synchronizeSoftwareFields(item, {
              seatsUsed: Math.max(
                0,
                item.seatsUsed - 1
              ),

              installationHistory:
                safeArray(item.installationHistory)
                  .map(record =>
                    record.id === allocation.id
                      ? {
                          ...record,
                          status: 'Released',
                          releasedAt: timestampLabel(),
                        }
                      : record
                  ),
            })
          : item
      )
    );

    notifyAction(
      'Software License Released',

      `Released ${licence.name} from ${allocation.userName}.`,

      'licences',
      'license',

      () => {
        setSoftware(previous =>
          previous.map(item =>
            item.id === softwareId
              ? licence
              : item
          )
        );
      }
    );

    return true;
  }

  function markLicenceRenewed(softwareId) {
    const original = getSoftware().find(
      item => item.id === softwareId
    );

    if (!original) {
      return fail('Software license not found.');
    }

    const currentExpiry = parseDate(
      original.expiryDate ||
      original.renewalDate
    );

    const now = new Date();

    const renewalDate =
      currentExpiry && currentExpiry > now
        ? new Date(currentExpiry)
        : new Date(now);

    renewalDate.setFullYear(
      renewalDate.getFullYear() + 1
    );

    return updateSoftwareLicence(
      softwareId,
      {
        expiryDate: todayLabel(renewalDate),

        renewalStatus: 'renewed',
        status: 'renewed',

        renewedAt: timestampLabel(),
      }
    );
  }

  function reclaimUnusedSeats(
    softwareId,
    count = 2
  ) {
    const licence = getSoftware().find(
      item => item.id === softwareId
    );

    if (!licence) {
      return fail('Software license not found.');
    }

    const trackedCount =
      safeArray(licence.installationHistory)
        .filter(item =>
          item.status === 'Allocated'
        ).length;

    const untrackedSeats = Math.max(
      0,
      licence.seatsUsed - trackedCount
    );

    const reclaimCount = Math.min(
      untrackedSeats,
      Math.floor(nonNegativeNumber(count))
    );

    if (reclaimCount <= 0) {
      return fail(
        'No untracked seats are available for manual reconciliation.'
      );
    }

    return adjustSoftwareSeats(
      softwareId,
      -reclaimCount
    );
  }

  // ==========================================================
  // ACCESS MANAGEMENT
  // ==========================================================

  function toggleAppAccess(userId, app) {
    const user = findUser(
      getUsers(),
      userId
    );

    if (!user) {
      return fail('Employee account not found.');
    }

    const originalAccess = {
      ...(getAccessMatrix()[user.id] || {}),
    };

    const currentAccess =
      originalAccess[app] || 'none';

    const nextAccess =
      currentAccess === 'granted'
        ? 'none'
        : 'granted';

    if (
      nextAccess === 'granted' &&
      !['active', 'provisioning'].includes(user.status)
    ) {
      return fail(
        'Cannot grant access to an inactive account.'
      );
    }

    if (
      nextAccess === 'none' &&
      !hasPermission('Security', 'delete')
    ) {
      return fail(
        'Revoking access requires Security: delete permission.'
      );
    }

    setAccessMatrix(previous => ({
      ...previous,

      [user.id]: {
        ...originalAccess,
        [app]: nextAccess,
      },
    }));

    notifyAction(
      'Application Access Updated',

      `${app} access ${
        nextAccess === 'granted'
          ? 'granted to'
          : 'revoked from'
      } ${user.name}.`,

      'access',
      'access',

      () => {
        setAccessMatrix(previous => ({
          ...previous,
          [user.id]: originalAccess,
        }));
      }
    );

    return true;
  }

  function applyRolePreset(
    userId,
    presetName
  ) {
    const preset = ROLE_PRESETS[presetName];

    const user = findUser(
      getUsers(),
      userId
    );

    if (!preset || !user) {
      return fail(
        'Select a valid employee and access preset.'
      );
    }

    if (
      presetName !== 'RevokeAll' &&
      !['active', 'provisioning'].includes(
        user.status
      )
    ) {
      return fail(
        'Cannot grant access to an inactive employee.'
      );
    }

    const original =
      getAccessMatrix()[user.id];

    setAccessMatrix(previous => ({
      ...previous,

      [user.id]: {
        ...preset,
      },
    }));

    notifyAction(
      'Access Preset Updated',

      `Applied ${presetName} access preset to ${user.name}.`,

      'access',
      'access',

      () => {
        setAccessMatrix(previous => {
          const next = { ...previous };

          if (original) {
            next[user.id] = original;
          } else {
            delete next[user.id];
          }

          return next;
        });
      }
    );

    return true;
  }

  function createAccessRequest(
    userId,
    app,
    justification = ''
  ) {
    const user = findUser(
      getUsers(),
      userId
    );

    if (!user) {
      return fail('Employee account not found.');
    }

    if (
      !['active', 'provisioning'].includes(
        user.status
      )
    ) {
      return fail(
        'Inactive employee accounts cannot request access.'
      );
    }

    if (!SYSTEM_APPS.includes(app)) {
      return fail('Select a valid application.');
    }

    if (
      getAccessMatrix()[user.id]?.[app] === 'granted'
    ) {
      return fail(
        'Employee already has access to this application.'
      );
    }

    if (
      getPendingRequests().some(request =>
        request.userId === user.id &&
        request.app === app &&
        request.status === 'pending'
      )
    ) {
      return fail(
        'An access request is already pending.'
      );
    }

    const originalAccess =
      getAccessMatrix()[user.id];

    const request = {
      id: uniqueId('req'),

      userId: user.id,
      userName: user.name,
      userRole: user.role,

      app,

      justification:
        String(justification || '').trim(),

      requestedDate: timestampLabel(),

      status: 'pending',
    };

    setPendingRequests(previous => [
      request,
      ...previous,
    ]);

    setAccessMatrix(previous => ({
      ...previous,

      [user.id]: {
        ...(previous[user.id] || {}),
        [app]: 'requested',
      },
    }));

    notifyAction(
      'New Access Request',

      `${user.name} requested access to ${app}.`,

      'access',
      'access',

      () => {
        setPendingRequests(previous =>
          previous.filter(
            item => item.id !== request.id
          )
        );

        setAccessMatrix(previous => {
          const next = { ...previous };

          if (originalAccess) {
            next[user.id] = originalAccess;
          } else {
            delete next[user.id];
          }

          return next;
        });
      }
    );

    return request.id;
  }

  function approveAccessRequest(requestId) {
    const original = getPendingRequests().find(
      item => item.id === requestId
    );

    if (!original) {
      return fail('Access request not found.');
    }

    if (original.status !== 'pending') {
      return fail(
        'This request has already been processed.'
      );
    }

    const user = findUser(
      getUsers(),
      original.userId
    );

    if (
      !user ||
      !['active', 'provisioning'].includes(user.status)
    ) {
      return fail(
        'Cannot approve access for an inactive account.'
      );
    }

    const previousAccess =
      getAccessMatrix()[original.userId];

    setPendingRequests(previous =>
      previous.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: 'approved',

              approvedBy: currentUser.name,
              approvedDate: timestampLabel(),
            }
          : request
      )
    );

    setAccessMatrix(previous => ({
      ...previous,

      [original.userId]: {
        ...(previous[original.userId] || {}),
        [original.app]: 'granted',
      },
    }));

    notifyAction(
      'Access Request Approved',

      `Approved ${original.app} access for ${original.userName}.`,

      'access',
      'access',

      () => {
        setPendingRequests(previous =>
          previous.map(request =>
            request.id === requestId
              ? original
              : request
          )
        );

        setAccessMatrix(previous => {
          const next = { ...previous };

          if (previousAccess) {
            next[original.userId] = previousAccess;
          } else {
            delete next[original.userId];
          }

          return next;
        });
      }
    );

    return true;
  }

  function rejectAccessRequest(
    requestId,
    reason = ''
  ) {
    const original = getPendingRequests().find(
      item => item.id === requestId
    );

    if (!original) {
      return fail('Access request not found.');
    }

    if (original.status !== 'pending') {
      return fail(
        'This request has already been processed.'
      );
    }

    const previousAccess =
      getAccessMatrix()[original.userId];

    setPendingRequests(previous =>
      previous.map(request =>
        request.id === requestId
          ? {
              ...request,

              status: 'rejected',

              approvedBy: currentUser.name,
              approvedDate: timestampLabel(),

              rejectionReason: reason,
            }
          : request
      )
    );

    setAccessMatrix(previous => ({
      ...previous,

      [original.userId]: {
        ...(previous[original.userId] || {}),

        [original.app]:
          previous[original.userId]?.[original.app] === 'granted'
            ? 'granted'
            : 'none',
      },
    }));

    notifyAction(
      'Access Request Rejected',

      `Rejected ${original.app} access request for ${original.userName}.`,

      'access',
      'access',

      () => {
        setPendingRequests(previous =>
          previous.map(request =>
            request.id === requestId
              ? original
              : request
          )
        );

        setAccessMatrix(previous => {
          const next = { ...previous };

          if (previousAccess) {
            next[original.userId] = previousAccess;
          } else {
            delete next[original.userId];
          }

          return next;
        });
      }
    );

    return true;
  }

  // ==========================================================
  // ROLE PROFILES
  // ==========================================================

  function createRoleProfile(profile = {}) {
    if (!hasPermission('Role Administration', 'write')) {
      return fail(
        'Creating roles requires Role Administration permission.'
      );
    }

    if (!String(profile.name || '').trim()) {
      return fail('Role name is required.');
    }

    if (
      getRoleProfiles().some(item =>
        normalize(item.name) === normalize(profile.name) ||
        (
          profile.id &&
          item.id === profile.id
        )
      )
    ) {
      return fail('This role profile already exists.');
    }

    const newProfile = {
      ...profile,

      id:
        profile.id ||
        uniqueId('ROLE'),

      createdAt: timestampLabel(),
    };

    setRoleProfilesState(previous => [
      ...previous,
      newProfile,
    ]);

    notifyAction(
      'Role Profile Created',

      `Created role ${newProfile.name}.`,

      'access',
      'access'
    );

    return true;
  }

  function updateRoleProfiles(updater) {
    if (!hasPermission('Role Administration', 'update')) {
      return fail(
        'Updating roles requires Role Administration permission.'
      );
    }

    const previous = getRoleProfiles();

    const next =
      typeof updater === 'function'
        ? updater(previous)
        : updater;

    if (!Array.isArray(next)) {
      return fail('Invalid role configuration.');
    }

    const superAdmin = next.find(
      role => role.id === 'ROLE-001'
    );

    if (!superAdmin) {
      return fail(
        'The primary Super Administrator role cannot be removed.'
      );
    }

    setRoleProfilesState(next);

    addActivityLog('Role profiles updated.');

    showToast('Role configuration updated.');

    return true;
  }

  // ==========================================================
  // SECURITY & ACTIVITY
  // ==========================================================

  function acknowledgeAlert(eventId) {
    const original = getEvents().find(
      event => event.id === eventId
    );

    if (!original) {
      return fail('Security alert not found.');
    }

    if (original.acknowledged) {
      return fail(
        'This alert has already been acknowledged.'
      );
    }

    setEvents(previous =>
      previous.map(event =>
        event.id === eventId
          ? {
              ...event,

              acknowledged: true,

              acknowledgedBy: currentUser.name,
              acknowledgedAt: timestampLabel(),
            }
          : event
      )
    );

    notifyAction(
      'Security Alert Acknowledged',

      `Acknowledged security alert ${eventId}.`,

      'events',
      'security',

      () => {
        setEvents(previous =>
          previous.map(event =>
            event.id === eventId
              ? original
              : event
          )
        );
      }
    );

    return true;
  }

  function updateMfaPolicy(key, value) {
    if (
      !Object.prototype.hasOwnProperty.call(
        getMfaPolicies(),
        key
      )
    ) {
      return fail('Invalid security policy.');
    }

    if (
      key === 'sessionTimeoutHours' &&
      (
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0
      )
    ) {
      return fail('Invalid session timeout.');
    }

    setMfaPolicies(previous => ({
      ...previous,
      [key]: value,
    }));

    notifyAction(
      'Security Policy Updated',

      `Local MFA policy ${key} updated.`,

      'events',
      'security'
    );

    return true;
  }

  function terminateSession(sessionId) {
    const original = getActiveSessions().find(
      item => item.id === sessionId
    );

    if (!original) {
      return fail('Session record not found.');
    }

    setActiveSessions(previous =>
      previous.filter(
        item => item.id !== sessionId
      )
    );

    notifyAction(
      'Session Terminated',

      `Removed local session record for ${original.userName}.`,

      'events',
      'security',

      () => {
        setActiveSessions(previous => [
          original,
          ...previous,
        ]);
      }
    );

    return true;
  }

  // ==========================================================
  // DEVICE MAINTENANCE
  // ==========================================================

  function scheduleMaintenanceTask(task = {}) {
    if (!String(task.title || '').trim()) {
      return fail('Maintenance task title is required.');
    }

    const newTask = {
      ...task,

      id: uniqueId('mnt'),

      title: task.title,

      target:
        task.target || 'Fleet Wide',

      scheduledDate:
        task.scheduledDate ||
        timestampLabel(),

      status: 'scheduled',

      type:
        task.type || 'OS Patch',

      compliancePercent: 0,
    };

    setMaintenanceSchedules(previous => [
      newTask,
      ...previous,
    ]);

    notifyAction(
      'Maintenance Scheduled',

      `Scheduled maintenance: ${newTask.title}.`,

      'inventory',
      'asset'
    );

    return newTask.id;
  }

  function completeMaintenanceTask(id) {
    const task =
      getMaintenanceSchedules().find(
        item => item.id === id
      );

    if (!task) {
      return fail('Maintenance task not found.');
    }

    setMaintenanceSchedules(previous =>
      previous.map(item =>
        item.id === id
          ? {
              ...item,

              status: 'completed',
              compliancePercent: 100,
              completedAt: timestampLabel(),
            }
          : item
      )
    );

    notifyAction(
      'Maintenance Completed',

      `Completed maintenance task ${task.title}.`,

      'inventory',
      'asset'
    );

    return true;
  }

  function flagDeviceLost(
    assetTag,
    notes = ''
  ) {
    const asset = getAssets().find(
      item => item.assetTag === assetTag
    );

    if (!asset) {
      return fail('Asset record not found.');
    }

    if (
      getLostStolenList().some(
        item => item.assetTag === assetTag
      )
    ) {
      return fail(
        'This device is already flagged as lost or stolen.'
      );
    }

    const entry = {
      assetTag,

      model: asset.model,

      lastSeenLocation:
        asset.location || 'Unknown',

      flaggedDate: timestampLabel(),

      status: 'Remote Locked',

      simulated: true,

      notes:
        notes ||
        'Device flagged as lost in local records.',
    };

    setLostStolenList(previous => [
      entry,
      ...previous,
    ]);

    setAssets(previous =>
      previous.map(item =>
        item.assetTag === assetTag
          ? {
              ...item,
              status: 'retired',
              lostStolen: true,
            }
          : item
      )
    );

    notifyAction(
      'Device Flagged',

      `${assetTag} flagged as lost. Remote lock simulated locally.`,

      'inventory',
      'asset'
    );

    return true;
  }

  function remoteWipeDevice(assetTag) {
    const device = getLostStolenList().find(
      item => item.assetTag === assetTag
    );

    if (!device) {
      return fail('Flagged device record not found.');
    }

    setLostStolenList(previous =>
      previous.map(item =>
        item.assetTag === assetTag
          ? {
              ...item,

              status: 'Cryptographically Wiped',

              simulated: true,
              wipedAt: timestampLabel(),
            }
          : item
      )
    );

    notifyAction(
      'Device Wipe Simulation',

      `Recorded local wipe simulation for ${assetTag}. No real device was modified.`,

      'events',
      'security'
    );

    return true;
  }

  // ==========================================================
  // REPORT MANAGEMENT
  // ==========================================================

  function toggleScheduledReport(id) {
    const report = getScheduledReports().find(
      item => item.id === id
    );

    if (!report) {
      return fail('Report schedule not found.');
    }

    setScheduledReports(previous =>
      previous.map(item =>
        item.id === id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );

    notifyAction(
      'Report Schedule Updated',

      `${report.name} ${
        report.active
          ? 'disabled'
          : 'enabled'
      }.`,

      'reports',
      'report'
    );

    return true;
  }

  function triggerScheduledReportRun(id) {
    const report = getScheduledReports().find(
      item => item.id === id
    );

    if (!report) {
      return fail('Report schedule not found.');
    }

    setScheduledReports(previous =>
      previous.map(item =>
        item.id === id
          ? {
              ...item,

              lastRun: todayLabel(),

              lastRunStatus:
                'Local simulation completed',
            }
          : item
      )
    );

    notifyAction(
      'Report Run Recorded',

      `Local report run recorded for ${report.name}. No email was sent.`,

      'reports',
      'report'
    );

    return true;
  }

  // ==========================================================
  // DOCUMENT COMPATIBILITY ACTIONS
  // Retained for existing employee details components.
  // ==========================================================

  function addDocument(newDoc = {}) {
    const doc = linkDocumentToEmployee({
      ...newDoc,

      id: uniqueId('DOC'),

      uploadDate:
        newDoc.uploadDate ||
        todayLabel(),

      version:
        newDoc.version || 'v1.0',

      status:
        newDoc.status || 'Active',

      statusColor:
        newDoc.statusColor ||
        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',

      versions: [
        {
          version: newDoc.version || 'v1.0',
          date: todayLabel(),
          author: currentUser.name,
          notes: 'Initial local registration',
        },
      ],

      auditTrail: [
        {
          id: uniqueId('aud'),
          action: 'Document registered locally',
          user: currentUser.name,
          time: timestampLabel(),
        },
      ],
    });

    setDocuments(previous => [
      doc,
      ...previous,
    ]);

    showToast(
      `Document ${doc.title || doc.id} registered.`
    );

    return doc;
  }

  function updateDocumentCategory(
    docId,
    category,
    categoryLabel
  ) {
    const doc = documents.find(
      item => item.id === docId
    );

    if (!doc) {
      return fail('Document not found.');
    }

    setDocuments(previous =>
      previous.map(item =>
        item.id === docId
          ? {
              ...item,

              employeeDocumentCategory: category,
              employeeDocumentCategoryLabel: categoryLabel,

              auditTrail: [
                {
                  id: uniqueId('aud'),

                  action: `Category updated to ${categoryLabel}`,

                  user: currentUser.name,
                  time: timestampLabel(),
                },

                ...safeArray(item.auditTrail),
              ],
            }
          : item
      )
    );

    showToast('Document category updated.');

    return true;
  }

  function recordDocumentView(docId) {
    if (
      !documents.some(item => item.id === docId)
    ) {
      return fail('Document not found.');
    }

    setDocuments(previous =>
      previous.map(item =>
        item.id === docId
          ? {
              ...item,

              auditTrail: [
                {
                  id: uniqueId('aud'),
                  action: 'Document viewed',
                  user: currentUser.name,
                  time: timestampLabel(),
                },

                ...safeArray(item.auditTrail),
              ],
            }
          : item
      )
    );

    return true;
  }

  function updateDocumentVersion(
    docId,
    newVersionStr,
    revisionNotes
  ) {
    const original = documents.find(
      item => item.id === docId
    );

    if (!original) {
      return fail('Document not found.');
    }

    const currentVersion =
      parseFloat(
        String(original.version || 'v1.0')
          .replace('v', '')
      ) || 1;

    const targetVersion =
      newVersionStr ||
      `v${(currentVersion + 0.1).toFixed(1)}`;

    setDocuments(previous =>
      previous.map(doc =>
        doc.id === docId
          ? {
              ...doc,

              version: targetVersion,

              versions: [
                {
                  version: targetVersion,
                  date: todayLabel(),
                  author: currentUser.name,

                  notes:
                    revisionNotes ||
                    'Revision updated',
                },

                ...safeArray(doc.versions),
              ],

              auditTrail: [
                {
                  id: uniqueId('aud'),

                  action: `Revision ${targetVersion} committed`,

                  user: currentUser.name,
                  time: timestampLabel(),
                },

                ...safeArray(doc.auditTrail),
              ],
            }
          : doc
      )
    );

    showToast('Document revision updated.');

    return true;
  }

  function deleteDocument(docId) {
    const original = documents.find(
      item => item.id === docId
    );

    if (!original) {
      return fail('Document not found.');
    }

    setDocuments(previous =>
      previous.filter(
        item => item.id !== docId
      )
    );

    showToast(
      'Document archived.',
      () => {
        setDocuments(previous => [
          original,
          ...previous,
        ]);
      }
    );

    return true;
  }

  function updateDocumentRbac(
    docId,
    newAccessLevel,
    rbacSettings
  ) {
    if (
      !documents.some(
        item => item.id === docId
      )
    ) {
      return fail('Document not found.');
    }

    setDocuments(previous =>
      previous.map(doc =>
        doc.id === docId
          ? {
              ...doc,

              accessLevel: newAccessLevel,

              rbacRoles: {
                ...doc.rbacRoles,
                ...(rbacSettings || {}),
              },

              auditTrail: [
                {
                  id: uniqueId('aud'),
                  action: 'Document access policy updated',
                  user: currentUser.name,
                  time: timestampLabel(),
                },

                ...safeArray(doc.auditTrail),
              ],
            }
          : doc
      )
    );

    showToast('Document access policy updated.');

    return true;
  }

  function downloadDocument(docId) {
    const doc = documents.find(
      item => item.id === docId
    );

    if (!doc) {
      return fail('Document not found.');
    }

    if (!(doc.file instanceof Blob)) {
      return fail(
        'No actual file is attached to this sample document.'
      );
    }

    const url = URL.createObjectURL(doc.file);

    const link = document.createElement('a');

    link.href = url;

    link.download =
      doc.fileName ||
      doc.title ||
      'document';

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );

    recordDocumentView(docId);

    showToast(
      `Downloaded ${link.download}.`
    );

    return true;
  }

  // ==========================================================
  // LEGACY NETWORK & SETTINGS COMPATIBILITY
  // ==========================================================

  function updateNetworkDevice(
    deviceId,
    updatedFields
  ) {
    if (
      !networkDevices.some(
        device => device.id === deviceId
      )
    ) {
      return fail('Network device record not found.');
    }

    setNetworkDevices(previous =>
      previous.map(device =>
        device.id === deviceId
          ? {
              ...device,
              ...updatedFields,
            }
          : device
      )
    );

    showToast('Local device record updated.');

    return true;
  }

  function rebootNetworkDevice(deviceId) {
    if (
      !networkDevices.some(
        device => device.id === deviceId
      )
    ) {
      return fail('Network device record not found.');
    }

    setNetworkDevices(previous =>
      previous.map(device =>
        device.id === deviceId
          ? {
              ...device,

              status: 'online',

              uptime: '1 min',
            }
          : device
      )
    );

    showToast(
      'Network reboot simulated locally.'
    );

    return true;
  }

  function toggleIntegration(integrationId) {
    setIntegrations(previous =>
      previous.map(item =>
        item.id === integrationId
          ? {
              ...item,

              status:
                item.status === 'connected'
                  ? 'disconnected'
                  : 'connected',
            }
          : item
      )
    );

    showToast(
      'Local integration configuration updated.'
    );

    return true;
  }

  // ==========================================================
  // DYNAMIC KPI COMPUTATIONS
  // ==========================================================

  const openTickets = tickets.filter(
    ticket =>
      !['resolved', 'closed'].includes(
        normalize(ticket.status)
      )
  );

  const resolvedTickets = tickets.filter(
    ticket =>
      ['resolved', 'closed'].includes(
        normalize(ticket.status)
      )
  );

  const availableAssets = assets.filter(
    asset =>
      asset.status === 'in stock' &&
      !asset.assignedTo
  );

  const assignedAssets = assets.filter(
    asset =>
      asset.assignedTo &&
      ['assigned', 'overdue return'].includes(
        asset.status
      )
  );

  const overdueAssets = assets.filter(
    asset =>
      asset.status === 'overdue return'
  );

  const securityAlerts = events.filter(
    event =>
      event.category === 'Alerts' &&
      !event.acknowledged
  );

  const activeUsers = users.filter(
    user => user.status === 'active'
  );

  const suspendedUsers = users.filter(
    user => user.status === 'suspended'
  );

  const deactivatedUsers = users.filter(
    user => user.status === 'deactivated'
  );

  const provisioningUsers = users.filter(
    user => user.status === 'provisioning'
  );

  const totalLicenseSeats = software.reduce(
    (sum, item) =>
      sum + nonNegativeNumber(item.totalSeats),
    0
  );

  const usedLicenseSeats = software.reduce(
    (sum, item) =>
      sum + nonNegativeNumber(item.seatsUsed),
    0
  );

  const accessRequestsPending =
    pendingRequests.filter(
      request => request.status === 'pending'
    );

  const grantedAccessCount = Object.values(
    accessMatrix
  ).reduce(
    (count, permissions) =>
      count +
      Object.values(permissions || {}).filter(
        status => status === 'granted'
      ).length,
    0
  );

  const openTicketCount = openTickets.length;

  const unacknowledgedAlertCount =
    securityAlerts.length;

  const unreadNotificationCount =
    notifications.filter(
      notification =>
        notification.unread &&
        canReadNotification(notification)
    ).length;

  const dashboardKPIs = {
    // User Accounts

    totalUsers: users.length,

    totalUserAccounts: users.length,

    activeUsers: activeUsers.length,

    suspendedUsers: suspendedUsers.length,

    deactivatedUsers: deactivatedUsers.length,

    provisioningUsers: provisioningUsers.length,

    // Asset Management

    totalAssets: assets.length,

    totalDevices: assets.length,

    assignedAssets: assignedAssets.length,

    availableAssets: availableAssets.length,

    overdueAssets: overdueAssets.length,

    retiredAssets: assets.filter(
      asset => asset.status === 'retired'
    ).length,

    maintenanceAssets: assets.filter(
      asset =>
        [
          'maintenance',
          'in maintenance',
          'repair',
        ].includes(asset.status)
    ).length,

    totalAssetValue: assets.reduce(
      (sum, asset) =>
        sum + nonNegativeNumber(asset.cost),
      0
    ),

    // Helpdesk

    totalTickets: tickets.length,

    openTickets: openTicketCount,

    inProgressTickets: tickets.filter(
      ticket => ticket.status === 'in progress'
    ).length,

    pendingTickets: tickets.filter(
      ticket =>
        ['pending', 'on hold'].includes(
          ticket.status
        )
    ).length,

    resolvedTickets: resolvedTickets.length,

    criticalTickets: openTickets.filter(
      ticket =>
        normalize(ticket.priority) === 'critical'
    ).length,

    breachedSLATickets: openTickets.filter(
      ticket =>
        normalize(ticket.status) === 'breached sla' ||
        (
          Number(ticket.slaHours) > 0 &&
          Number(ticket.slaElapsedHours) >=
            Number(ticket.slaHours)
        )
    ).length,

    resolutionRate: tickets.length
      ? Math.round(
          resolvedTickets.length /
          tickets.length *
          100
        )
      : 0,

    // Software

    totalSoftware: software.length,

    totalLicenses: software.length,

    totalLicenseSeats,

    usedLicenseSeats,

    availableLicenseSeats:
      totalLicenseSeats - usedLicenseSeats,

    expiredLicenses: software.filter(
      item =>
        item.status === 'expired'
    ).length,

    expiringLicenses: software.filter(
      item =>
        item.daysToRenewal >= 0 &&
        item.daysToRenewal <= 30
    ).length,

    licenseUtilization: totalLicenseSeats
      ? Math.round(
          usedLicenseSeats /
          totalLicenseSeats *
          100
        )
      : 0,

    annualSoftwareCost: software.reduce(
      (sum, item) =>
        sum + nonNegativeNumber(item.annualCost),
      0
    ),

    // Access Management

    grantedAccess: grantedAccessCount,

    pendingAccessRequests:
      accessRequestsPending.length,

    approvedAccessRequests:
      pendingRequests.filter(
        request => request.status === 'approved'
      ).length,

    rejectedAccessRequests:
      pendingRequests.filter(
        request => request.status === 'rejected'
      ).length,

    // Security

    totalSecurityEvents: events.length,

    securityAlerts:
      unacknowledgedAlertCount,

    activeSessions: activeSessions.length,

    successfulLogins: events.filter(
      event =>
        event.category === 'Logins' &&
        normalize(event.result) === 'success'
    ).length,

    failedLogins: events.filter(
      event =>
        event.category === 'Failed' ||
        normalize(event.result).includes('failed login')
    ).length,

    unreadNotifications:
      unreadNotificationCount,
  };

  // ==========================================================
  // PERMISSION-GUARDED ACTIONS
  // ==========================================================

  function guardedProvisionUser(userData) {
    if (!hasPermission('User Profiles', 'write')) {
      return fail(
        'User creation permission is required.'
      );
    }

    if (
      userData?.adminRoleId &&
      !hasPermission('Role Administration', 'update')
    ) {
      return fail(
        'Role assignment permission is required.'
      );
    }

    return provisionUser(userData);
  }

  function guardedUpdateUser(
    userId,
    updatedFields = {}
  ) {
    const changesRole =
      Object.prototype.hasOwnProperty.call(
        updatedFields,
        'adminRoleId'
      );

    const roleOnly =
      changesRole &&
      Object.keys(updatedFields).length === 1;

    if (
      changesRole &&
      !hasPermission('Role Administration', 'update')
    ) {
      return fail(
        'Role assignment permission is required.'
      );
    }

    if (
      !roleOnly &&
      !hasPermission('User Profiles', 'update')
    ) {
      return fail(
        'User update permission is required.'
      );
    }

    const target = getUsers().find(
      user => user.id === userId
    );

    if (
      target &&
      (
        target.id === currentUser?.id ||
        normalize(target.email) === normalize(currentUser?.email)
      ) &&
      (
        changesRole ||
        (
          updatedFields.status &&
          updatedFields.status !== 'active'
        )
      )
    ) {
      return fail(
        'You cannot disable or change the role of your active administrator account.'
      );
    }

    return updateUser(
      userId,
      updatedFields
    );
  }

  function guardedSetUserStatus(
    userId,
    status
  ) {
    if (!hasPermission('User Profiles', 'update')) {
      return fail('Account update permission is required.');
    }

    const user = getUsers().find(
      item => item.id === userId
    );

    if (
      user &&
      (
        user.id === currentUser?.id ||
        normalize(user.email) === normalize(currentUser?.email)
      ) &&
      status !== 'active'
    ) {
      return fail(
        'You cannot disable your active administrator account.'
      );
    }

    return setUserStatus(userId, status);
  }

  function guardedSetAssetStatus(assetId, status) {
    return authorizeAction(
      setAssetStatus,

      'Assets',

      status === 'retired'
        ? 'delete'
        : 'update',

      'Updating asset status'
    )(assetId, status);
  }

  function guardedApplyRolePreset(
    userId,
    presetName
  ) {
    return authorizeAction(
      applyRolePreset,

      'Security',

      presetName === 'RevokeAll'
        ? 'delete'
        : 'update',

      'Updating application access'
    )(userId, presetName);
  }

  // ==========================================================
  // CONTEXT PROVIDER
  // ==========================================================

  return (
    <StoreContext.Provider
      value={{

        // Navigation

        activePage,
        navigate,

        activeSubDashboard,
        setActiveSubDashboard,

        openSubDashboard,
        closeSubDashboard,

        activeSubTab,
        setActiveSubTab,

        searchQuery,
        setSearchQuery,

        // Main Data

        users,
        assets,
        custodyHistory,

        tickets,
        software,
        events,

        accessMatrix,
        pendingRequests,

        // Dynamic KPIs

        dashboardKPIs,

        openTicketCount,

        unacknowledgedAlertCount,

        unreadNotificationCount,

        // Role Profiles

        roleProfiles,
        activeRoleProfile,

        hasPermission,

        createRoleProfile,
        updateRoleProfiles,

        // User Accounts

        provisionUser:
          guardedProvisionUser,

        updateUser:
          guardedUpdateUser,

        setUserStatus:
          guardedSetUserStatus,

        deleteUser:
          authorizeAction(
            deleteUser,
            'User Profiles',
            'delete',
            'Deleting accounts'
          ),

        bulkCreateUsers:
          authorizeAction(
            bulkCreateUsers,
            'User Profiles',
            'write',
            'Bulk user provisioning'
          ),

        automateOffboarding:
          userId =>
            guardedSetUserStatus(
              userId,
              'deactivated'
            ),

        // Asset Management

        addAsset:
          authorizeAction(
            addAsset,
            'Assets',
            'write',
            'Registering assets'
          ),

        updateAsset:
          authorizeAction(
            updateAsset,
            'Assets',
            'update',
            'Updating assets'
          ),

        setAssetStatus:
          guardedSetAssetStatus,

        // Asset Allocation

        assignAsset:
          authorizeAction(
            assignAsset,
            'Assets',
            'update',
            'Allocating assets'
          ),

        returnAsset:
          authorizeAction(
            returnAsset,
            'Assets',
            'update',
            'Returning assets'
          ),

        transferAsset:
          authorizeAction(
            transferAsset,
            'Assets',
            'update',
            'Transferring assets'
          ),

        // Helpdesk

        createTicket:
          authorizeAction(
            createTicket,
            'Helpdesk',
            'write',
            'Creating tickets'
          ),

        updateTicket:
          authorizeAction(
            updateTicket,
            'Helpdesk',
            'update',
            'Updating tickets'
          ),

        addTicketNote:
          authorizeAction(
            addTicketNote,
            'Helpdesk',
            'update',
            'Adding ticket notes'
          ),

        resolveTicket:
          authorizeAction(
            resolveTicket,
            'Helpdesk',
            'update',
            'Resolving tickets'
          ),

        reopenTicket:
          authorizeAction(
            reopenTicket,
            'Helpdesk',
            'update',
            'Reopening tickets'
          ),

        escalateTicket:
          authorizeAction(
            escalateTicket,
            'Helpdesk',
            'update',
            'Escalating tickets'
          ),

        ticketFeedbacks,

        submitTicketFeedback:
          authorizeAction(
            submitTicketFeedback,
            'Helpdesk',
            'update',
            'Submitting feedback'
          ),

        selectedTicketId,
        setSelectedTicketId,

        // Software Management

        addSoftwareLicence:
          authorizeAction(
            addSoftwareLicence,
            'Software',
            'write',
            'Adding licenses'
          ),

        updateSoftwareLicence:
          authorizeAction(
            updateSoftwareLicence,
            'Software',
            'update',
            'Updating licenses'
          ),

        recordSoftwareInstallation:
          authorizeAction(
            recordSoftwareInstallation,
            'Software',
            'update',
            'Recording installations'
          ),

        adjustSoftwareSeats:
          authorizeAction(
            adjustSoftwareSeats,
            'Software',
            'update',
            'Adjusting license seats'
          ),

        allocateSoftwareSeat:
          authorizeAction(
            allocateSoftwareSeat,
            'Software',
            'update',
            'Allocating software licenses'
          ),

        releaseSoftwareSeat:
          authorizeAction(
            releaseSoftwareSeat,
            'Software',
            'update',
            'Releasing software licenses'
          ),

        markLicenceRenewed:
          authorizeAction(
            markLicenceRenewed,
            'Software',
            'update',
            'Renewing software licenses'
          ),

        reclaimUnusedSeats:
          authorizeAction(
            reclaimUnusedSeats,
            'Software',
            'update',
            'Reconciling software seats'
          ),

        // Access Management

        toggleAppAccess:
          authorizeAction(
            toggleAppAccess,
            'Security',
            'update',
            'Updating application access'
          ),

        applyRolePreset:
          guardedApplyRolePreset,

        createAccessRequest:
          authorizeAction(
            createAccessRequest,
            'Security',
            'write',
            'Creating access requests'
          ),

        approveAccessRequest:
          authorizeAction(
            approveAccessRequest,
            'Security',
            'update',
            'Approving access requests'
          ),

        rejectAccessRequest:
          authorizeAction(
            rejectAccessRequest,
            'Security',
            'update',
            'Rejecting access requests'
          ),

        // Security & Activity

        acknowledgeAlert:
          authorizeAction(
            acknowledgeAlert,
            'Security',
            'update',
            'Acknowledging security alerts'
          ),

        mfaPolicies,

        updateMfaPolicy:
          authorizeAction(
            updateMfaPolicy,
            'Security',
            'update',
            'Updating security policies'
          ),

        activeSessions,

        terminateSession:
          authorizeAction(
            terminateSession,
            'Security',
            'delete',
            'Terminating sessions'
          ),

        // Device Maintenance

        maintenanceSchedules,

        scheduleMaintenanceTask:
          authorizeAction(
            scheduleMaintenanceTask,
            'Assets',
            'write',
            'Scheduling maintenance'
          ),

        completeMaintenanceTask:
          authorizeAction(
            completeMaintenanceTask,
            'Assets',
            'update',
            'Completing maintenance'
          ),

        lostStolenList,

        flagDeviceLost:
          authorizeAction(
            flagDeviceLost,
            'Assets',
            'update',
            'Flagging lost devices'
          ),

        remoteWipeDevice:
          authorizeAction(
            remoteWipeDevice,
            'Security',
            'delete',
            'Simulating device wipe'
          ),

        qrModalAsset,
        setQrModalAsset,

        // Reports

        scheduledReports,

        toggleScheduledReport:
          authorizeAction(
            toggleScheduledReport,
            'Reports',
            'update',
            'Updating report schedules'
          ),

        triggerScheduledReportRun:
          authorizeAction(
            triggerScheduledReportRun,
            'Reports',
            'write',
            'Running report simulations'
          ),

        // Documents Compatibility

        documents,

        addDocument:
          authorizeAction(
            addDocument,
            'Documents',
            'write',
            'Registering documents'
          ),

        updateDocumentCategory:
          authorizeAction(
            updateDocumentCategory,
            'Documents',
            'update',
            'Updating documents'
          ),

        recordDocumentView:
          authorizeAction(
            recordDocumentView,
            'Documents',
            'read',
            'Viewing documents'
          ),

        updateDocumentVersion:
          authorizeAction(
            updateDocumentVersion,
            'Documents',
            'update',
            'Updating document revisions'
          ),

        deleteDocument:
          authorizeAction(
            deleteDocument,
            'Documents',
            'delete',
            'Archiving documents'
          ),

        updateDocumentRbac:
          authorizeAction(
            updateDocumentRbac,
            'Documents',
            'update',
            'Updating document access'
          ),

        downloadDocument:
          authorizeAction(
            downloadDocument,
            'Documents',
            'read',
            'Downloading documents'
          ),

        // Legacy Network Compatibility

        networkDevices,
        networkMetrics,

        updateNetworkDevice:
          authorizeAction(
            updateNetworkDevice,
            'Network',
            'update',
            'Updating network records'
          ),

        rebootNetworkDevice:
          authorizeAction(
            rebootNetworkDevice,
            'Network',
            'update',
            'Simulating network reboot'
          ),

        // Legacy Settings Compatibility

        businessUnits,
        locations,
        integrations,

        notificationRules,
        backupPolicies,

        toggleIntegration:
          authorizeAction(
            toggleIntegration,
            'System Settings',
            'update',
            'Updating integrations'
          ),

        // Drawers & Modals

        activeDrawer,
        setActiveDrawer,

        drawerPayload,
        setDrawerPayload,

        confirmDialog,
        setConfirmDialog,

        // Toast

        toast,
        showToast,
        triggerUndo,

        // Brand Logo

        appLogo,

        uploadLogo:
          authorizeAction(
            uploadLogo,
            'System Settings',
            'update',
            'Uploading company logo'
          ),

        resetLogo:
          authorizeAction(
            resetLogo,
            'System Settings',
            'update',
            'Resetting company logo'
          ),

        // Authentication

        isAuthenticated,
        authProvider,

        currentUser,

        updateProfilePicture:
          authorizeAction(
            updateProfilePicture,
            'User Profiles',
            'update',
            'Updating profile picture'
          ),

        removeProfilePicture:
          authorizeAction(
            removeProfilePicture,
            'User Profiles',
            'update',
            'Removing profile picture'
          ),

        signIn,
        signInWithGoogle,
        signOut,

        // Notifications

        notifications,

        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,

      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// ============================================================
// STORE HOOK
// ============================================================

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error(
      'useStore must be used within a StoreProvider'
    );
  }

  return context;
}
