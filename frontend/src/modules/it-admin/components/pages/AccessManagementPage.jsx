
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import { StatusPill } from '../shared/StatusPill';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Drawer } from '../shared/Drawer';
import { EmptyState } from '../shared/EmptyState';

import { RolePermissionsDashboard } from './RolePermissionsDashboard';

import {
  SYSTEM_APPS,
  ROLE_PRESETS,
  IT_ADMIN_ROLE_PERMISSIONS,
} from '../../data/accessMatrix';

import { ROLE_MODULES } from '../../data/roleProfiles';

import {
  IconSearch,
  IconCheck,
  IconKey,
  IconShield,
  IconClock,
  IconUsers,
  IconDownload,
  IconX,
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const PAGE_SIZES = [5, 10, 20, 50];

const ACTIONS = [
  'read',
  'write',
  'update',
  'delete',
];

const USERS_WITH_ACCESS = 'users_with_access';

const INPUT_CLASS =
  'px-3 py-2 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

const HEADER_CLASS =
  'px-3 py-3 text-[11px] uppercase tracking-wider font-bold text-muted whitespace-nowrap';

const CELL_CLASS =
  'px-3 py-3 text-[12.5px] align-middle';

const ACCESS_STYLES = {
  granted: {
    label: 'Granted',
    symbol: '✓',
    className: 'bg-good/15 text-good border-good/40',
  },
  requested: {
    label: 'Requested',
    symbol: '?',
    className: 'bg-warn/15 text-warn border-warn/40',
  },
  none: {
    label: 'No Access',
    symbol: '—',
    className: 'bg-surface2/40 text-muted border-line',
  },
};

const MFA_SETTINGS = [
  {
    key: 'enforceWebAuthn',
    label: 'Enforce WebAuthn',
    description:
      'Require passkey or hardware-key authentication.',
  },
  {
    key: 'requireFido2ForAdmin',
    label: 'Require FIDO2 for Administrators',
    description:
      'Record hardware-key requirements for privileged accounts.',
  },
  {
    key: 'blockLegacyAuth',
    label: 'Block Legacy Authentication',
    description:
      'Configure restrictions on legacy authentication protocols.',
  },
];

// ============================================================
// UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getAccessStatus(matrix, userId, app) {
  const status = normalize(
    matrix?.[userId]?.[app]
  );

  return Object.prototype.hasOwnProperty.call(
    ACCESS_STYLES,
    status
  )
    ? status
    : 'none';
}

// ============================================================
// USERS WITH ACCESS - KPI FIX
//
// A user is counted only once when at least one
// registered application has granted access.
// ============================================================

function getGrantedApplications(
  matrix,
  userId,
  applications = SYSTEM_APPS
) {
  if (
    userId === null ||
    userId === undefined ||
    userId === ''
  ) {
    return [];
  }

  return applications.filter(
    app =>
      getAccessStatus(
        matrix,
        userId,
        app
      ) === 'granted'
  );
}

function hasGrantedApplication(
  matrix,
  userId,
  applications = SYSTEM_APPS
) {
  return getGrantedApplications(
    matrix,
    userId,
    applications
  ).length > 0;
}

function getUniqueUsers(users) {
  const uniqueUsers = new Map();

  users.forEach(user => {
    if (
      !user ||
      user.id === null ||
      user.id === undefined ||
      user.id === ''
    ) {
      return;
    }

    const key = String(user.id);

    if (!uniqueUsers.has(key)) {
      uniqueUsers.set(key, user);
    }
  });

  return Array.from(uniqueUsers.values());
}

function isEligibleUser(user) {
  return [
    'active',
    'provisioning',
  ].includes(normalize(user?.status));
}

function isPendingRequest(request) {
  return [
    'pending',
    'requested',
  ].includes(normalize(request?.status));
}

function uniqueValues(values) {
  return [
    ...new Set(values.filter(Boolean))
  ].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function downloadJSON(data, filename) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    {
      type: 'application/json;charset=utf-8',
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

function safeFilename(value) {
  return String(value || 'record')
    .replace(/[^a-zA-Z0-9_-]/g, '-');
}

// ============================================================
// KPI COMPONENT
// ============================================================

function AccessKPI({
  label,
  value,
  description,
  icon: Icon,
  color = 'text-accent',
  selected = false,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-col gap-2 min-w-0 p-3.5 rounded-xl border text-left bg-surface2/40 hover:bg-surface2 transition-all cursor-pointer ${
        selected
          ? 'border-accent ring-2 ring-accent/25'
          : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
          {label}
        </span>

        <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      </div>

      <span className={`font-display font-bold text-[26px] tabular-nums ${color}`}>
        {value}
      </span>

      <span className="text-[11px] text-muted">
        {description}
      </span>
    </button>
  );
}

// ============================================================
// ACCESS STATUS BUTTON
// ============================================================

function AccessButton({
  status,
  disabled,
  onClick,
  title,
  compact = false,
}) {
  const config =
    ACCESS_STYLES[status] ||
    ACCESS_STYLES.none;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={title}
      aria-pressed={status === 'granted'}
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg border font-semibold transition-all hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-60 ${
        compact
          ? 'w-9 h-9 text-[15px]'
          : 'px-3 py-1.5 min-w-[105px] text-[12px]'
      } ${config.className}`}
    >
      {compact
        ? config.symbol
        : config.label}
    </button>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>

      <span className="text-[13px] font-medium text-ink break-words">
        {value || '—'}
      </span>
    </div>
  );
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const first = total
    ? (currentPage - 1) * pageSize + 1
    : 0;

  const last = Math.min(
    currentPage * pageSize,
    total
  );

  const start = Math.max(
    1,
    Math.min(
      currentPage - 2,
      totalPages - 4
    )
  );

  const end = Math.min(
    totalPages,
    start + 4
  );

  const numbers = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12px] text-muted">
          Showing{' '}
          <strong className="text-ink">
            {first}–{last}
          </strong>
          {' '}of{' '}
          <strong className="text-ink">
            {total}
          </strong>
        </span>

        <label className="flex items-center gap-2 text-[11px] text-muted">
          Rows per page

          <select
            value={pageSize}
            onChange={event =>
              onPageSizeChange(
                Number(event.target.value)
              )
            }
            className={INPUT_CLASS}
          >
            {PAGE_SIZES.map(size => (
              <option
                key={size}
                value={size}
              >
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
        >
          Previous
        </Button>

        {numbers.map(number => (
          <button
            key={number}
            type="button"
            aria-current={
              currentPage === number
                ? 'page'
                : undefined
            }
            onClick={() =>
              onPageChange(number)
            }
            className={`min-w-[32px] h-8 px-2 rounded-lg border text-[12px] font-semibold cursor-pointer ${
              currentPage === number
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface2 text-muted border-line hover:border-accent'
            }`}
          >
            {number}
          </button>
        ))}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() =>
            onPageChange(currentPage + 1)
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ACCESS MANAGEMENT PAGE
// ============================================================

export function AccessManagementPage() {
  const {
    users = [],
    roleProfiles = [],
    accessMatrix = {},
    pendingRequests = [],

    currentUser,

    activeSubTab,
    setActiveSubTab,

    toggleAppAccess,
    applyRolePreset,

    updateUser,

    approveAccessRequest,
    rejectAccessRequest,

    mfaPolicies = {},
    updateMfaPolicy,

    hasPermission,
    showToast,
  } = useStore();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canReadSecurity =
    hasPermission('Security', 'read');

  const canUpdateSecurity =
    hasPermission('Security', 'update');

  const canRevokeSecurity =
    hasPermission('Security', 'delete');

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canReadRoles =
    hasPermission('Role Administration', 'read');

  const canManageRoles =
    canReadRoles &&
    hasPermission('Role Administration', 'update');

  const canExport =
    hasPermission('Reports', 'read');

  const canViewMatrix =
    canReadSecurity && canReadUsers;

  const canViewRequests =
    canReadSecurity && canReadUsers;

  // ==========================================================
  // PAGE STATES
  // ==========================================================

  const [activeTab, setActiveTab] = useState(
    () => canViewMatrix
      ? 'matrix'
      : canReadRoles
        ? 'roles'
        : canReadSecurity
          ? 'mfa'
          : 'matrix'
  );

  const [searchUser, setSearchUser] =
    useState('');

  const [departmentFilter, setDepartmentFilter] =
    useState('All');

  const [roleFilter, setRoleFilter] =
    useState('All');

  const [accountStatusFilter, setAccountStatusFilter] =
    useState('All');

  const [applicationFilter, setApplicationFilter] =
    useState('All');

  const [accessFilter, setAccessFilter] =
    useState('All');

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [requestSearch, setRequestSearch] =
    useState('');

  const [requestStatusFilter, setRequestStatusFilter] =
    useState('pending');

  const [requestPage, setRequestPage] =
    useState(1);

  const [requestPageSize, setRequestPageSize] =
    useState(10);

  const [selectedAccessUserId, setSelectedAccessUserId] =
    useState(null);

  const [selectedRequestId, setSelectedRequestId] =
    useState(null);

  const [confirmation, setConfirmation] =
    useState(null);

  // ==========================================================
  // UNIQUE EMPLOYEE ACCOUNTS
  // ==========================================================

  const uniqueUsers = useMemo(
    () => getUniqueUsers(users),
    [users]
  );

  // ==========================================================
  // TAB NAVIGATION
  // ==========================================================

  const tabs = [
    {
      id: 'matrix',
      label: 'Application Access',
      icon: IconKey,
      visible: canViewMatrix,
    },
    {
      id: 'requests',
      label: 'Access Requests',
      icon: IconClock,
      visible: canViewRequests,
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
      icon: IconUsers,
      visible: canReadRoles,
    },
    {
      id: 'mfa',
      label: 'Authentication Policies',
      icon: IconShield,
      visible: canReadSecurity,
    },
  ];

  const visibleTabs = tabs.filter(
    tab => tab.visible
  );

  const currentTab = visibleTabs.some(
    tab => tab.id === activeTab
  )
    ? activeTab
    : visibleTabs[0]?.id;

  useEffect(() => {
    const tabAliases = {
      all: 'matrix',
      access: 'matrix',
      applications: 'matrix',
      matrix: 'matrix',
      users_with_access: 'matrix',
      roles: 'roles',
      permissions: 'roles',
      rbac: 'roles',
      requests: 'requests',
      mfa: 'mfa',
      authentication: 'mfa',
    };

    const target = tabAliases[activeSubTab];

    if (
      target === 'matrix' &&
      canViewMatrix
    ) {
      setActiveTab('matrix');
    }

    if (
      target === 'requests' &&
      canViewRequests
    ) {
      setActiveTab('requests');
    }

    if (
      target === 'roles' &&
      canReadRoles
    ) {
      setActiveTab('roles');
    }

    if (
      target === 'mfa' &&
      canReadSecurity
    ) {
      setActiveTab('mfa');
    }
  }, [
    activeSubTab,
    canViewMatrix,
    canViewRequests,
    canReadRoles,
    canReadSecurity,
  ]);

  const changeTab = tabId => {
    if (
      !visibleTabs.some(
        tab => tab.id === tabId
      )
    ) {
      return;
    }

    setActiveTab(tabId);

    if (
      typeof setActiveSubTab === 'function'
    ) {
      setActiveSubTab(tabId);
    }

    setSelectedAccessUserId(null);
    setSelectedRequestId(null);
  };

  // ==========================================================
  // CURRENT ADMINISTRATOR PROTECTION
  // ==========================================================

  const isCurrentAdministrator = user => {
    if (!user || !currentUser) {
      return false;
    }

    return (
      user.id === currentUser.id ||
      Boolean(
        user.email &&
        currentUser.email &&
        normalize(user.email) ===
          normalize(currentUser.email)
      )
    );
  };

  // ==========================================================
  // DYNAMIC ACCESS KPIs
  //
  // Granted Access = total application grants.
  // Users With Access = unique users with at least one grant.
  // ==========================================================

  const summary = useMemo(() => {
    let granted = 0;
    let requested = 0;
    let noAccess = 0;

    const usersWithAccessIds = new Set();

    uniqueUsers.forEach(user => {
      SYSTEM_APPS.forEach(app => {
        const status = getAccessStatus(
          accessMatrix,
          user.id,
          app
        );

        if (status === 'granted') {
          granted += 1;

          usersWithAccessIds.add(
            String(user.id)
          );
        } else if (status === 'requested') {
          requested += 1;
        } else {
          noAccess += 1;
        }
      });
    });

    return {
      applications: SYSTEM_APPS.length,

      granted,
      requested,
      noAccess,

      usersWithAccess:
        usersWithAccessIds.size,

      usersWithAccessIds,

      pending: pendingRequests.filter(
        isPendingRequest
      ).length,

      approved: pendingRequests.filter(
        request =>
          normalize(request.status) ===
          'approved'
      ).length,

      rejected: pendingRequests.filter(
        request =>
          normalize(request.status) ===
          'rejected'
      ).length,
    };
  }, [
    uniqueUsers,
    accessMatrix,
    pendingRequests,
  ]);

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const departments = useMemo(
    () => uniqueValues(
      users.map(user => user.department)
    ),
    [users]
  );

  const accountStatuses = useMemo(
    () => uniqueValues(
      users.map(user =>
        normalize(user.status)
      )
    ),
    [users]
  );

  const roleNameMap = useMemo(
    () => Object.fromEntries(
      roleProfiles.map(role => [
        role.id,
        role.name,
      ])
    ),
    [roleProfiles]
  );

  const displayedApps = useMemo(
    () =>
      applicationFilter === 'All'
        ? SYSTEM_APPS
        : SYSTEM_APPS.filter(
            app => app === applicationFilter
          ),
    [applicationFilter]
  );

  // ==========================================================
  // APPLICATION MATRIX FILTERING
  //
  // USERS WITH ACCESS:
  // Uses a separate user-level filter.
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const words = normalize(searchUser)
      .split(/\s+/)
      .filter(Boolean);

    return uniqueUsers
      .filter(user => {
        const roleId =
          user.adminRoleId || 'ROLE-006';

        const searchable = [
          user.id,
          user.employeeId,
          user.name,
          user.email,
          user.role,
          user.department,
          user.location,
          user.status,

          canReadRoles
            ? roleNameMap[roleId]
            : '',
        ]
          .map(normalize)
          .join(' ');

        const matchesSearch =
          words.every(word =>
            searchable.includes(word)
          );

        const matchesDepartment =
          departmentFilter === 'All' ||
          user.department === departmentFilter;

        const matchesRole =
          !canReadRoles ||
          roleFilter === 'All' ||
          roleId === roleFilter;

        const matchesAccountStatus =
          accountStatusFilter === 'All' ||
          normalize(user.status) === accountStatusFilter;

        let matchesAccess = true;

        if (accessFilter === USERS_WITH_ACCESS) {
          matchesAccess =
            summary.usersWithAccessIds.has(
              String(user.id)
            ) &&
            hasGrantedApplication(
              accessMatrix,
              user.id,
              displayedApps
            );
        } else if (accessFilter !== 'All') {
          matchesAccess =
            displayedApps.some(app =>
              getAccessStatus(
                accessMatrix,
                user.id,
                app
              ) === accessFilter
            );
        }

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesRole &&
          matchesAccountStatus &&
          matchesAccess
        );
      })
      .sort((a, b) =>
        String(a.employeeId || a.id)
          .localeCompare(
            String(b.employeeId || b.id),
            undefined,
            { numeric: true }
          )
      );
  }, [
    uniqueUsers,
    searchUser,
    departmentFilter,
    roleFilter,
    accountStatusFilter,
    accessFilter,
    displayedApps,
    accessMatrix,
    roleNameMap,
    canReadRoles,
    summary.usersWithAccessIds,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length / pageSize
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedUsers =
    filteredUsers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

  useEffect(() => {
    setPage(1);
  }, [
    searchUser,
    departmentFilter,
    roleFilter,
    accountStatusFilter,
    applicationFilter,
    accessFilter,
    pageSize,
  ]);

  const resetFilters = () => {
    setSearchUser('');
    setDepartmentFilter('All');
    setRoleFilter('All');
    setAccountStatusFilter('All');
    setApplicationFilter('All');
    setAccessFilter('All');
    setPage(1);
  };

  const filterByKPI = status => {
    if (!canViewMatrix) return;

    changeTab('matrix');
    resetFilters();
    setAccessFilter(status);
    setPage(1);
  };

  const handleUsersWithAccessKPI = () => {
    filterByKPI(USERS_WITH_ACCESS);
  };

  const isUsersWithAccessView =
    currentTab === 'matrix' &&
    accessFilter === USERS_WITH_ACCESS;

  // ==========================================================
  // REQUEST FILTERING
  // ==========================================================

  const filteredRequests = useMemo(() => {
    const query = normalize(requestSearch);

    return pendingRequests.filter(request => {
      const user = users.find(
        item => item.id === request.userId
      );

      const matchesSearch = [
        request.id,
        request.userName,
        user?.name,
        user?.employeeId,
        user?.email,
        request.app,
        request.justification,
      ].some(value =>
        normalize(value).includes(query)
      );

      const matchesStatus =
        requestStatusFilter === 'All' ||
        (
          requestStatusFilter === 'pending'
            ? isPendingRequest(request)
            : normalize(request.status) ===
                requestStatusFilter
        );

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    pendingRequests,
    requestSearch,
    requestStatusFilter,
    users,
  ]);

  const totalRequestPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length /
      requestPageSize
    )
  );

  const currentRequestPage = Math.min(
    requestPage,
    totalRequestPages
  );

  const paginatedRequests =
    filteredRequests.slice(
      (currentRequestPage - 1) *
        requestPageSize,

      currentRequestPage *
        requestPageSize
    );

  useEffect(() => {
    setRequestPage(1);
  }, [
    requestSearch,
    requestStatusFilter,
    requestPageSize,
  ]);

  const selectedRequest =
    pendingRequests.find(
      request =>
        request.id === selectedRequestId
    );

  // ==========================================================
  // EMPLOYEE ACCESS PROFILE
  // ==========================================================

  const selectedAccessUser =
    users.find(
      user => user.id === selectedAccessUserId
    );

  const selectedAccessRoleId =
    selectedAccessUser?.adminRoleId ||
    'ROLE-006';

  const selectedAccessRole =
    roleProfiles.find(
      role => role.id === selectedAccessRoleId
    );

  const openAccessProfile = userId => {
    if (!canViewMatrix) return;

    setSelectedAccessUserId(userId);
  };

  // ==========================================================
  // ACCESS REQUEST ACTIONS
  // ==========================================================

  const handleRequestDecision = (
    request,
    decision
  ) => {
    if (
      !canViewRequests ||
      !canUpdateSecurity ||
      !isPendingRequest(request)
    ) {
      return;
    }

    const user = users.find(
      item => item.id === request.userId
    );

    if (
      decision === 'approve' &&
      !isEligibleUser(user)
    ) {
      showToast(
        'Only active or provisioning accounts can receive application access.'
      );

      return;
    }

    if (
      decision === 'approve' &&
      !SYSTEM_APPS.includes(request.app)
    ) {
      showToast(
        'The requested application is not registered.'
      );

      return;
    }

    if (isCurrentAdministrator(user)) {
      showToast(
        'Your own access requests require another authorized administrator.'
      );

      return;
    }

    const approved =
      decision === 'approve';

    setConfirmation({
      title: approved
        ? 'Approve Access Request'
        : 'Reject Access Request',

      message: approved
        ? `Approve ${request.app} access for ${user?.name || request.userName}?`
        : `Reject the ${request.app} access request from ${user?.name || request.userName}?`,

      confirmLabel: approved
        ? 'Approve Access'
        : 'Reject Request',

      onConfirm: () => {
        if (approved) {
          approveAccessRequest(request.id);
        } else {
          rejectAccessRequest(request.id);
        }

        setSelectedRequestId(null);
      },
    });
  };

  // ==========================================================
  // GRANT AND REVOKE ACCESS
  // ==========================================================

  const canChangeApplication = (user, app) => {
    if (
      !canViewMatrix ||
      !user ||
      isCurrentAdministrator(user)
    ) {
      return false;
    }

    const status = getAccessStatus(
      accessMatrix,
      user.id,
      app
    );

    if (status === 'granted') {
      return (
        canUpdateSecurity &&
        canRevokeSecurity
      );
    }

    return (
      canUpdateSecurity &&
      isEligibleUser(user)
    );
  };

  const handleApplicationAccess = (
    user,
    app
  ) => {
    if (
      !SYSTEM_APPS.includes(app) ||
      !canChangeApplication(user, app)
    ) {
      return;
    }

    const status = getAccessStatus(
      accessMatrix,
      user.id,
      app
    );

    const pendingRequest =
      pendingRequests.find(request =>
        request.userId === user.id &&
        request.app === app &&
        isPendingRequest(request)
      );

    if (
      pendingRequest &&
      status !== 'granted'
    ) {
      handleRequestDecision(
        pendingRequest,
        'approve'
      );

      return;
    }

    const isRevoking =
      status === 'granted';

    setConfirmation({
      title: isRevoking
        ? 'Revoke Application Access'
        : 'Grant Application Access',

      message: isRevoking
        ? `Remove ${app} access from ${user.name}'s recorded application permissions?`
        : `Grant ${user.name} access to ${app}?`,

      confirmLabel: isRevoking
        ? 'Revoke Access'
        : 'Grant Access',

      onConfirm: () =>
        toggleAppAccess(user.id, app),
    });
  };

  // ==========================================================
  // ROLE PRESET MANAGEMENT
  // ==========================================================

  const canApplyPreset = (
    user,
    presetName
  ) => {
    if (
      !user ||
      isCurrentAdministrator(user) ||
      !ROLE_PRESETS[presetName]
    ) {
      return false;
    }

    if (presetName === 'RevokeAll') {
      return canRevokeSecurity;
    }

    if (
      !canUpdateSecurity ||
      !isEligibleUser(user)
    ) {
      return false;
    }

    const preset = ROLE_PRESETS[presetName];

    const removesAccess =
      SYSTEM_APPS.some(app =>
        getAccessStatus(
          accessMatrix,
          user.id,
          app
        ) === 'granted' &&
        preset[app] !== 'granted'
      );

    return (
      !removesAccess ||
      canRevokeSecurity
    );
  };

  const handleRolePreset = (
    user,
    presetName
  ) => {
    if (
      !canApplyPreset(user, presetName)
    ) {
      showToast(
        'You do not have permission to apply this access preset.'
      );

      return;
    }

    const revokeAll =
      presetName === 'RevokeAll';

    setConfirmation({
      title: revokeAll
        ? 'Revoke All Application Access'
        : 'Apply Application Access Preset',

      message: revokeAll
        ? `Remove all recorded application access for ${user.name}? Their account and historical records will remain.`
        : `Apply the "${presetName}" preset to ${user.name}? This replaces their recorded application access configuration.`,

      confirmLabel: revokeAll
        ? 'Revoke All Access'
        : 'Apply Preset',

      onConfirm: () =>
        applyRolePreset(
          user.id,
          presetName
        ),
    });
  };

  // ==========================================================
  // RBAC ROLE ASSIGNMENT
  // ==========================================================

  const handleRoleAssignment = (
    user,
    roleId
  ) => {
    if (
      !canManageRoles ||
      !user ||
      isCurrentAdministrator(user)
    ) {
      return;
    }

    const targetRole =
      roleProfiles.find(
        role => role.id === roleId
      );

    if (!targetRole) {
      showToast(
        'Select a valid role profile.'
      );

      return;
    }

    if (user.adminRoleId === roleId) {
      return;
    }

    setConfirmation({
      title: 'Change Assigned Role',

      message:
        `Assign the "${targetRole.name}" administrative role to ${user.name}? This changes their recorded module permissions.`,

      confirmLabel: 'Assign Role',

      onConfirm: () =>
        updateUser(user.id, {
          adminRoleId: roleId,
        }),
    });
  };

  // ==========================================================
  // ACCESS RECORD EXPORT
  // ==========================================================

  const exportSelectedAccessRecord = () => {
    if (
      !selectedAccessUser ||
      !canExport ||
      !canViewMatrix
    ) {
      return;
    }

    const user = selectedAccessUser;

    const record = {
      exportedAt: new Date().toISOString(),

      employee: {
        userId: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        department: user.department,
        designation: user.role,
        location: user.location,
        contactNumber: user.contactNumber,

        joiningDate:
          user.joiningDate ||
          user.createdDate,

        status: user.status,
      },

      assignedRole: canReadRoles
        ? {
            id: selectedAccessRoleId,
            name: selectedAccessRole?.name,
            tier: selectedAccessRole?.tier,
            permissions:
              selectedAccessRole?.permissions,
          }
        : undefined,

      applications: SYSTEM_APPS.map(app => ({
        application: app,

        status: getAccessStatus(
          accessMatrix,
          user.id,
          app
        ),
      })),

      requests: pendingRequests.filter(
        request =>
          request.userId === user.id
      ),
    };

    downloadJSON(
      record,

      `access-record-${safeFilename(
        user.employeeId || user.id
      )}.json`
    );

    showToast(
      `Access record exported for ${user.name}`
    );
  };

  const exportAccessMatrix = () => {
    if (
      !canExport ||
      !canViewMatrix
    ) {
      return;
    }

    const records = filteredUsers.map(user => ({
      userId: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,

      assignedRole: canReadRoles
        ? roleNameMap[user.adminRoleId]
        : undefined,

      applications: Object.fromEntries(
        displayedApps.map(app => [
          app,

          getAccessStatus(
            accessMatrix,
            user.id,
            app
          ),
        ])
      ),
    }));

    downloadJSON(
      {
        exportedAt: new Date().toISOString(),

        totalRecords: records.length,

        records,
      },

      `application-access-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
    );

    showToast(
      `Exported ${records.length} employee access records.`
    );
  };

  const exportRequestHistory = () => {
    if (
      !canExport ||
      !canViewRequests
    ) {
      return;
    }

    downloadJSON(
      {
        exportedAt: new Date().toISOString(),

        totalRecords: filteredRequests.length,

        requests: filteredRequests,
      },

      `access-requests-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
    );

    showToast(
      `Exported ${filteredRequests.length} access requests.`
    );
  };

  // ==========================================================
  // AUTHENTICATION POLICIES
  // ==========================================================

  const canUpdateMFA =
    canUpdateSecurity &&
    typeof updateMfaPolicy === 'function';

  const handleMfaPolicyChange = (
    key,
    value
  ) => {
    if (!canUpdateMFA) return;

    const validKeys = [
      'enforceWebAuthn',
      'requireFido2ForAdmin',
      'blockLegacyAuth',
      'sessionTimeoutHours',
    ];

    if (!validKeys.includes(key)) {
      return;
    }

    updateMfaPolicy(key, value);
  };

  const exportAuthenticationPolicies = () => {
    if (
      !canExport ||
      !canReadSecurity
    ) {
      return;
    }

    downloadJSON(
      {
        exportedAt: new Date().toISOString(),

        source:
          'Local IT Administration Configuration',

        policies: mfaPolicies,
      },

      'authentication-policies.json'
    );

    showToast(
      'Authentication configuration exported.'
    );
  };

  // ==========================================================
  // CONFIRMATION
  // ==========================================================

  const confirmAction = () => {
    const action = confirmation?.onConfirm;

    setConfirmation(null);

    if (typeof action !== 'function') {
      return;
    }

    try {
      action();
    } catch (error) {
      console.error(
        'Access management action failed:',
        error
      );

      showToast(
        'Unable to complete the requested access action.'
      );
    }
  };

  // ==========================================================
  // RESTRICTED PAGE
  // ==========================================================

  if (!visibleTabs.length) {
    return (
      <Card title="Access Management Restricted">
        <div className="flex flex-col items-center text-center gap-3 py-8">
          <IconShield className="w-9 h-9 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have permission
            to view access management.
          </p>
        </div>
      </Card>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div
      id="access-management-dashboard"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="min-w-0">
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <IconKey className="w-6 h-6 text-sky-400 shrink-0" />

            Access Management
          </h2>

          <p className="text-[13px] text-muted mt-1">
            Manage technical access to applications and systems.
          </p>
        </div>

        {canExport &&
          canViewMatrix &&
          currentTab === 'matrix' && (
            <Button
              variant="secondary"
              icon={IconDownload}
              disabled={!filteredUsers.length}
              onClick={exportAccessMatrix}
            >
              Export Access Matrix
            </Button>
          )}

        {canExport &&
          canViewRequests &&
          currentTab === 'requests' && (
            <Button
              variant="secondary"
              icon={IconDownload}
              disabled={!filteredRequests.length}
              onClick={exportRequestHistory}
            >
              Export Requests
            </Button>
          )}

      </div>

      {/* =====================================================
          DYNAMIC KPI CARDS
      ====================================================== */}

      {canViewMatrix && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

          <AccessKPI
            label="Applications"
            value={summary.applications}
            description="Registered systems"
            icon={IconKey}
            selected={
              currentTab === 'matrix' &&
              accessFilter === 'All'
            }
            onClick={() =>
              filterByKPI('All')
            }
          />

          <AccessKPI
            label="Granted Access"
            value={summary.granted}
            description="Recorded application grants"
            icon={IconCheck}
            color="text-good"
            selected={
              currentTab === 'matrix' &&
              accessFilter === 'granted'
            }
            onClick={() =>
              filterByKPI('granted')
            }
          />

          {/* FIXED USERS WITH ACCESS KPI */}

          <AccessKPI
            label="Users With Access"
            value={summary.usersWithAccess}
            description="Unique employees with granted access"
            icon={IconUsers}
            color="text-sky-400"
            selected={
              currentTab === 'matrix' &&
              accessFilter === USERS_WITH_ACCESS
            }
            onClick={handleUsersWithAccessKPI}
          />

          <AccessKPI
            label="Pending Requests"
            value={summary.pending}
            description="Awaiting administrator review"
            icon={IconClock}
            color="text-warn"
            selected={
              currentTab === 'requests' &&
              requestStatusFilter === 'pending'
            }
            onClick={() => {
              changeTab('requests');

              setRequestStatusFilter('pending');
              setRequestSearch('');
              setRequestPage(1);
            }}
          />

          <AccessKPI
            label="No Access"
            value={summary.noAccess}
            description="Unassigned application permissions"
            icon={IconShield}
            color="text-bad"
            selected={
              currentTab === 'matrix' &&
              accessFilter === 'none'
            }
            onClick={() =>
              filterByKPI('none')
            }
          />

        </div>
      )}

      {/* MODULE SUB NAVIGATION */}

      <div
        role="tablist"
        aria-label="Access Management sections"
        className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-line scrollbar-none"
      >
        {visibleTabs.map(tab => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={currentTab === tab.id}
              onClick={() =>
                changeTab(tab.id)
              }
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                currentTab === tab.id
                  ? 'bg-accent/15 text-accent border-accent/50'
                  : 'bg-surface2/30 text-muted border-line hover:text-ink hover:border-accent/30'
              }`}
            >
              <Icon className="w-4 h-4" />

              {tab.label}

              {tab.id === 'requests' &&
                summary.pending > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-warn/15 text-warn text-[10px] font-bold">
                    {summary.pending}
                  </span>
                )}
            </button>
          );
        })}
      </div>

      {/* =====================================================
          APPLICATION ACCESS MATRIX
      ====================================================== */}

      {currentTab === 'matrix' &&
        canViewMatrix && (

          <Card
            id="widget-access"
            data-w="access"
            title={
              isUsersWithAccessView
                ? 'Users With Access'
                : 'Application Access Matrix'
            }
            subText={`${filteredUsers.length} employee accounts · ${displayedApps.length} applications`}
          >

            {/* SEARCH AND FILTERS */}

            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-line/60">

              <div className="relative w-full sm:w-60">

                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />

                <input
                  type="text"
                  value={searchUser}
                  onChange={event =>
                    setSearchUser(event.target.value)
                  }
                  placeholder="Search employee, ID, email..."
                  aria-label="Search employee access"
                  className={`${INPUT_CLASS} w-full pl-8 pr-8`}
                />

                {searchUser && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearchUser('')
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}

              </div>

              {/* DEPARTMENT FILTER */}

              <select
                value={departmentFilter}
                onChange={event =>
                  setDepartmentFilter(event.target.value)
                }
                aria-label="Filter department"
                className={INPUT_CLASS}
              >
                <option value="All">
                  All Departments
                </option>

                {departments.map(department => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                ))}
              </select>

              {/* ROLE FILTER */}

              {canReadRoles && (
                <select
                  value={roleFilter}
                  onChange={event =>
                    setRoleFilter(event.target.value)
                  }
                  aria-label="Filter assigned role"
                  className={INPUT_CLASS}
                >
                  <option value="All">
                    All Roles
                  </option>

                  {roleProfiles.map(role => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>
              )}

              {/* APPLICATION FILTER */}

              <select
                value={applicationFilter}
                onChange={event =>
                  setApplicationFilter(event.target.value)
                }
                aria-label="Filter application"
                className={INPUT_CLASS}
              >
                <option value="All">
                  All Applications
                </option>

                {SYSTEM_APPS.map(app => (
                  <option
                    key={app}
                    value={app}
                  >
                    {app}
                  </option>
                ))}
              </select>

              {/* ACCESS STATUS FILTER */}

              <select
                value={accessFilter}
                onChange={event =>
                  setAccessFilter(event.target.value)
                }
                aria-label="Filter application access status"
                className={INPUT_CLASS}
              >
                <option value="All">
                  All Access Statuses
                </option>

                <option value="granted">
                  Granted
                </option>

                <option value={USERS_WITH_ACCESS}>
                  Users With Access
                </option>

                <option value="requested">
                  Requested
                </option>

                <option value="none">
                  No Access
                </option>
              </select>

              {/* ACCOUNT STATUS FILTER */}

              <select
                value={accountStatusFilter}
                onChange={event =>
                  setAccountStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter account status"
                className={`${INPUT_CLASS} capitalize`}
              >
                <option value="All">
                  All Account Statuses
                </option>

                {accountStatuses.map(status => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      status.charAt(0).toUpperCase() +
                      status.slice(1)
                    }
                  </option>
                ))}
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={resetFilters}
                icon={IconX}
              >
                Reset
              </Button>

            </div>

            {/* ACTIVE USERS WITH ACCESS FILTER */}

            {isUsersWithAccessView && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2">

                <div className="flex items-center gap-2">
                  <IconUsers className="w-4 h-4 text-accent shrink-0" />

                  <span className="text-[12px] text-ink">
                    Showing{' '}
                    <strong className="text-accent font-data">
                      {filteredUsers.length}
                    </strong>
                    {' '}of{' '}
                    <strong className="text-accent font-data">
                      {summary.usersWithAccess}
                    </strong>
                    {' '}users with granted application access.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent/10"
                >
                  <IconX className="w-3.5 h-3.5" />

                  Clear Filter
                </button>

              </div>
            )}

            {/* ACCESS LEGEND */}

            <div className="flex flex-wrap items-center justify-between gap-2">

              <span className="text-[12px] text-muted">
                Select an application permission to grant or revoke access.
              </span>

              <div className="flex flex-wrap items-center gap-3 text-[11px]">

                <span className="flex items-center gap-1.5 text-good">
                  <span className="w-2 h-2 rounded-full bg-good" />

                  Granted
                </span>

                <span className="flex items-center gap-1.5 text-warn">
                  <span className="w-2 h-2 rounded-full bg-warn" />

                  Requested
                </span>

                <span className="flex items-center gap-1.5 text-muted">
                  <span className="w-2 h-2 rounded-full bg-line" />

                  No Access
                </span>

              </div>

            </div>

            {/* APPLICATION ACCESS TABLE */}

            {filteredUsers.length === 0 ? (

              <EmptyState
                icon={IconUsers}
                message={
                  isUsersWithAccessView
                    ? 'No users with granted application access match your filters.'
                    : 'No employee access records match your filters.'
                }
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />

            ) : (

              <div className="overflow-x-auto -mx-1">

                <table className="w-full min-w-[1150px] text-left border-collapse">

                  <thead>
                    <tr className="border-b border-line">

                      <th className={HEADER_CLASS}>
                        Employee / Designation
                      </th>

                      <th className={HEADER_CLASS}>
                        Employee ID
                      </th>

                      <th className={HEADER_CLASS}>
                        Account Status
                      </th>

                      {canReadRoles && (
                        <th className={HEADER_CLASS}>
                          Assigned Role
                        </th>
                      )}

                      {isUsersWithAccessView && (
                        <th className={`${HEADER_CLASS} text-center`}>
                          Granted Apps
                        </th>
                      )}

                      {displayedApps.map(app => (
                        <th
                          key={app}
                          className={`${HEADER_CLASS} text-center`}
                        >
                          {app}
                        </th>
                      ))}

                      <th className={HEADER_CLASS}>
                        Access Preset
                      </th>

                      <th className={HEADER_CLASS}>
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {paginatedUsers.map(user => {
                      const ownAccount =
                        isCurrentAdministrator(user);

                      const availablePresets =
                        Object.keys(ROLE_PRESETS)
                          .filter(preset =>
                            canApplyPreset(
                              user,
                              preset
                            )
                          );

                      const grantedApps =
                        getGrantedApplications(
                          accessMatrix,
                          user.id
                        );

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-dashed border-line hover:bg-surface2/40 transition-colors"
                        >

                          <td className={CELL_CLASS}>
                            <button
                              type="button"
                              onClick={() =>
                                openAccessProfile(user.id)
                              }
                              className="flex items-center gap-2.5 text-left cursor-pointer group"
                            >

                              <Avatar
                                name={user.name}
                                src={user.avatarUrl}
                                size={32}
                              />

                              <div className="flex flex-col min-w-[135px]">

                                <span className="font-semibold text-ink group-hover:text-accent whitespace-nowrap">
                                  {user.name}
                                </span>

                                <span
                                  title={user.role}
                                  className="text-[11px] text-muted max-w-[180px] truncate"
                                >
                                  {user.role}
                                </span>

                                {ownAccount && (
                                  <span className="text-[10px] text-accent">
                                    Current administrator
                                  </span>
                                )}

                              </div>

                            </button>
                          </td>

                          <td className={`${CELL_CLASS} text-accent font-data whitespace-nowrap`}>
                            {user.employeeId || '—'}
                          </td>

                          <td className={CELL_CLASS}>
                            <StatusPill status={user.status} />
                          </td>

                          {canReadRoles && (
                            <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>
                              {
                                roleNameMap[
                                  user.adminRoleId ||
                                  'ROLE-006'
                                ] || 'Unassigned'
                              }
                            </td>
                          )}

                          {isUsersWithAccessView && (
                            <td className={`${CELL_CLASS} text-center`}>
                              <span
                                title={grantedApps.join(', ')}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-good/25 bg-good/10 px-2.5 py-1.5 text-[12px] font-semibold text-good whitespace-nowrap"
                              >
                                <IconCheck className="w-3.5 h-3.5" />

                                {grantedApps.length}/{SYSTEM_APPS.length}
                              </span>
                            </td>
                          )}

                          {displayedApps.map(app => {
                            const status =
                              getAccessStatus(
                                accessMatrix,
                                user.id,
                                app
                              );

                            const canChange =
                              canChangeApplication(
                                user,
                                app
                              );

                            const actionLabel =
                              status === 'granted'
                                ? 'Revoke'
                                : 'Grant';

                            return (
                              <td
                                key={app}
                                className={`${CELL_CLASS} text-center`}
                              >
                                <AccessButton
                                  compact
                                  status={status}
                                  disabled={!canChange}
                                  title={`${actionLabel} ${app} access for ${user.name}. Current status: ${ACCESS_STYLES[status].label}`}
                                  onClick={() =>
                                    handleApplicationAccess(
                                      user,
                                      app
                                    )
                                  }
                                />
                              </td>
                            );
                          })}

                          <td className={CELL_CLASS}>
                            <select
                              value=""
                              disabled={!availablePresets.length}
                              aria-label={`Apply preset for ${user.name}`}
                              onChange={event => {
                                if (event.target.value) {
                                  handleRolePreset(
                                    user,
                                    event.target.value
                                  );
                                }
                              }}
                              className={`${INPUT_CLASS} min-w-[130px]`}
                            >
                              <option value="">
                                Apply Preset
                              </option>

                              {availablePresets.map(preset => (
                                <option
                                  key={preset}
                                  value={preset}
                                >
                                  {preset === 'RevokeAll'
                                    ? 'Revoke All'
                                    : preset}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className={CELL_CLASS}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                openAccessProfile(user.id)
                              }
                              ariaLabel={`View access profile for ${user.name}`}
                            >
                              View
                            </Button>
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            )}

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filteredUsers.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />

          </Card>
        )}

      {/* =====================================================
          ACCESS REQUESTS
      ====================================================== */}

      {currentTab === 'requests' &&
        canViewRequests && (
          <>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {[
                {
                  id: 'All',
                  label: 'Total Requests',
                  count: pendingRequests.length,
                  icon: IconKey,
                  color: 'text-accent',
                },
                {
                  id: 'pending',
                  label: 'Pending',
                  count: summary.pending,
                  icon: IconClock,
                  color: 'text-warn',
                },
                {
                  id: 'approved',
                  label: 'Approved',
                  count: summary.approved,
                  icon: IconCheck,
                  color: 'text-good',
                },
                {
                  id: 'rejected',
                  label: 'Rejected',
                  count: summary.rejected,
                  icon: IconX,
                  color: 'text-bad',
                },
              ].map(item => (
                <AccessKPI
                  key={item.id}
                  label={item.label}
                  value={item.count}
                  description="Click to filter requests"
                  icon={item.icon}
                  color={item.color}
                  selected={
                    requestStatusFilter === item.id
                  }
                  onClick={() => {
                    setRequestStatusFilter(item.id);
                    setRequestPage(1);
                  }}
                />
              ))}

            </div>

            <Card
              title="Application Access Requests"
              subText="Review employee requests and maintain approval history."
            >

              <div className="flex flex-wrap items-center gap-2">

                <div className="relative w-full sm:w-64">

                  <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />

                  <input
                    type="text"
                    value={requestSearch}
                    onChange={event =>
                      setRequestSearch(event.target.value)
                    }
                    placeholder="Search employee or application..."
                    aria-label="Search access requests"
                    className={`${INPUT_CLASS} w-full pl-8`}
                  />

                </div>

                <select
                  value={requestStatusFilter}
                  onChange={event =>
                    setRequestStatusFilter(event.target.value)
                  }
                  aria-label="Filter request status"
                  className={INPUT_CLASS}
                >
                  <option value="All">
                    All Requests
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={IconX}
                  onClick={() => {
                    setRequestSearch('');
                    setRequestStatusFilter('All');
                    setRequestPage(1);
                  }}
                >
                  Reset
                </Button>

              </div>

              {!filteredRequests.length ? (

                <EmptyState
                  icon={IconClock}
                  message="No access requests match the selected filters."
                  actionLabel="View All Requests"
                  onAction={() => {
                    setRequestStatusFilter('All');
                    setRequestSearch('');
                  }}
                />

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1000px] text-left border-collapse">

                    <thead>
                      <tr className="border-b border-line">

                        {[
                          'Request ID',
                          'Employee',
                          'Application',
                          'Requested Date',
                          'Justification',
                          'Status',
                          'Actions',
                        ].map(label => (
                          <th
                            key={label}
                            className={HEADER_CLASS}
                          >
                            {label}
                          </th>
                        ))}

                      </tr>
                    </thead>

                    <tbody>

                      {paginatedRequests.map(request => {
                        const user = users.find(
                          item =>
                            item.id === request.userId
                        );

                        const pending =
                          isPendingRequest(request);

                        const ownRequest =
                          isCurrentAdministrator(user);

                        const displayName =
                          user?.name ||
                          request.userName ||
                          'Employee';

                        return (
                          <tr
                            key={request.id}
                            className="border-b border-dashed border-line hover:bg-surface2/40 transition-colors"
                          >

                            <td className={`${CELL_CLASS} font-data text-accent whitespace-nowrap`}>
                              {request.id}
                            </td>

                            <td className={CELL_CLASS}>
                              <div className="flex items-center gap-2.5">

                                <Avatar
                                  name={displayName}
                                  size={30}
                                />

                                <div className="flex flex-col">

                                  <span className="text-ink font-semibold whitespace-nowrap">
                                    {displayName}
                                  </span>

                                  <span className="text-[11px] text-muted">
                                    {
                                      user?.employeeId ||
                                      request.userRole ||
                                      'Employee'
                                    }
                                  </span>

                                </div>

                              </div>
                            </td>

                            <td className={`${CELL_CLASS} text-ink font-semibold whitespace-nowrap`}>
                              {request.app}
                            </td>

                            <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>
                              {
                                request.requestedDate ||
                                request.time ||
                                '—'
                              }
                            </td>

                            <td className={CELL_CLASS}>
                              <span
                                title={request.justification}
                                className="block max-w-[220px] truncate text-muted"
                              >
                                {request.justification || '—'}
                              </span>
                            </td>

                            <td className={CELL_CLASS}>
                              <StatusPill
                                status={
                                  pending
                                    ? 'pending'
                                    : request.status
                                }
                              />
                            </td>

                            <td className={CELL_CLASS}>
                              <div className="flex items-center gap-1.5 whitespace-nowrap">

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedRequestId(
                                      request.id
                                    )
                                  }
                                >
                                  View
                                </Button>

                                {pending &&
                                  canUpdateSecurity &&
                                  !ownRequest && (
                                    <>

                                      <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={
                                          !isEligibleUser(user) ||
                                          !SYSTEM_APPS.includes(
                                            request.app
                                          )
                                        }
                                        onClick={() =>
                                          handleRequestDecision(
                                            request,
                                            'approve'
                                          )
                                        }
                                      >
                                        Approve
                                      </Button>

                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                          handleRequestDecision(
                                            request,
                                            'reject'
                                          )
                                        }
                                      >
                                        Reject
                                      </Button>

                                    </>
                                  )}

                              </div>
                            </td>

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>

              )}

              <Pagination
                page={currentRequestPage}
                pageSize={requestPageSize}
                total={filteredRequests.length}
                onPageChange={setRequestPage}
                onPageSizeChange={setRequestPageSize}
              />

            </Card>

          </>
        )}

      {/* =====================================================
          ROLES & PERMISSIONS
      ====================================================== */}

      {currentTab === 'roles' &&
        canReadRoles && (
          <>

            <RolePermissionsDashboard />

            <Card
              title="IT Administrator Permission Reference"
              subText="Reference policies for administrative responsibilities and operational boundaries."
            >

              <div className="overflow-x-auto">

                <table className="w-full min-w-[650px] text-left border-collapse">

                  <thead>
                    <tr className="border-b border-line">

                      {[
                        'Action',
                        'Operational Scope',
                        'Category',
                        'Reference Permission',
                      ].map(label => (
                        <th
                          key={label}
                          className={HEADER_CLASS}
                        >
                          {label}
                        </th>
                      ))}

                    </tr>
                  </thead>

                  <tbody>
                    {IT_ADMIN_ROLE_PERMISSIONS.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="border-b border-dashed border-line hover:bg-surface2/40 transition-colors"
                      >

                        <td className={`${CELL_CLASS} text-ink font-semibold`}>
                          {item.action}
                        </td>

                        <td className={`${CELL_CLASS} text-muted`}>
                          {item.description}
                        </td>

                        <td className={`${CELL_CLASS} text-muted`}>
                          {item.category}
                        </td>

                        <td className={CELL_CLASS}>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                            item.permission === 'Allow'
                              ? 'bg-good/10 text-good border-good/30'
                              : 'bg-bad/10 text-bad border-bad/30'
                          }`}>
                            {item.permission === 'Allow'
                              ? <IconCheck className="w-3.5 h-3.5" />
                              : <IconShield className="w-3.5 h-3.5" />}

                            {item.permission}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>

              <p className="text-[11px] text-muted">
                This reference table is informational.
                Actual frontend role permissions are managed
                through the role profiles above.
              </p>

            </Card>

          </>
        )}

      {/* =====================================================
          AUTHENTICATION POLICIES
      ====================================================== */}

      {currentTab === 'mfa' &&
        canReadSecurity && (

          <Card
            title="Authentication Policies"
            subText="Manage recorded multi-factor authentication and session configuration."
            action={
              canExport ? (
                <Button
                  variant="secondary"
                  icon={IconDownload}
                  size="sm"
                  onClick={exportAuthenticationPolicies}
                >
                  Export Configuration
                </Button>
              ) : null
            }
          >

            {/* MFA KPI CARDS */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

              <div className="p-3 rounded-xl border border-line bg-surface2/40">

                <span className="text-[11px] text-muted uppercase font-semibold">
                  Configured Policies
                </span>

                <div className="font-display font-bold text-[25px] text-accent mt-1">
                  {MFA_SETTINGS.filter(
                    setting =>
                      typeof mfaPolicies[setting.key] ===
                      'boolean'
                  ).length}
                </div>

              </div>

              <div className="p-3 rounded-xl border border-line bg-surface2/40">

                <span className="text-[11px] text-muted uppercase font-semibold">
                  Enabled Policies
                </span>

                <div className="font-display font-bold text-[25px] text-good mt-1">
                  {MFA_SETTINGS.filter(
                    setting =>
                      mfaPolicies[setting.key] === true
                  ).length}
                </div>

              </div>

              <div className="p-3 rounded-xl border border-line bg-surface2/40">

                <span className="text-[11px] text-muted uppercase font-semibold">
                  Disabled Policies
                </span>

                <div className="font-display font-bold text-[25px] text-warn mt-1">
                  {MFA_SETTINGS.filter(
                    setting =>
                      mfaPolicies[setting.key] === false
                  ).length}
                </div>

              </div>

              <div className="p-3 rounded-xl border border-line bg-surface2/40">

                <span className="text-[11px] text-muted uppercase font-semibold">
                  Session Timeout
                </span>

                <div className="font-display font-bold text-[25px] text-ink mt-1">
                  {
                    mfaPolicies.sessionTimeoutHours
                      ? `${mfaPolicies.sessionTimeoutHours}h`
                      : '—'
                  }
                </div>

              </div>

            </div>

            {/* MFA SETTINGS */}

            <div className="flex flex-col gap-3">

              {MFA_SETTINGS.map(setting => {
                const enabled =
                  mfaPolicies[setting.key] === true;

                return (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-line bg-surface2/30"
                  >

                    <div className="flex items-start gap-3">

                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        <IconShield className="w-4 h-4" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-ink text-[13px]">
                          {setting.label}
                        </h3>

                        <p className="text-[12px] text-muted mt-1">
                          {setting.description}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-2 shrink-0">

                      <span className={`text-[11px] font-semibold ${
                        enabled
                          ? 'text-good'
                          : 'text-muted'
                      }`}>
                        {enabled
                          ? 'Enabled'
                          : 'Disabled'}
                      </span>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={setting.label}
                        disabled={!canUpdateMFA}
                        onClick={() =>
                          handleMfaPolicyChange(
                            setting.key,
                            !enabled
                          )
                        }
                        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          enabled
                            ? 'bg-accent'
                            : 'bg-surface2 border border-line'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          enabled
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`} />
                      </button>

                    </div>

                  </div>
                );
              })}

              {/* SESSION TIMEOUT */}

              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-line bg-surface2/30">

                <div className="flex items-center gap-3">

                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <IconClock className="w-4 h-4" />
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold text-ink">
                      Session Timeout
                    </h3>

                    <p className="text-[12px] text-muted mt-1">
                      Configure the recorded maximum session duration.
                    </p>
                  </div>

                </div>

                <select
                  value={
                    mfaPolicies.sessionTimeoutHours ?? ''
                  }
                  disabled={!canUpdateMFA}
                  aria-label="Session timeout duration"
                  onChange={event =>
                    handleMfaPolicyChange(
                      'sessionTimeoutHours',
                      Number(event.target.value)
                    )
                  }
                  className={`${INPUT_CLASS} min-w-[140px]`}
                >
                  <option value="" disabled>
                    Select duration
                  </option>

                  {uniqueValues([
                    1,
                    2,
                    4,
                    8,
                    12,
                    24,
                    mfaPolicies.sessionTimeoutHours,
                  ])
                    .sort((a, b) =>
                      Number(a) - Number(b)
                    )
                    .map(hours => (
                      <option
                        key={hours}
                        value={hours}
                      >
                        {hours}{' '}
                        {Number(hours) === 1
                          ? 'Hour'
                          : 'Hours'}
                      </option>
                    ))}
                </select>

              </div>

            </div>

            <div className="p-3 rounded-lg border border-line bg-surface2/30 text-[12px] text-muted">
              These settings update the local policy configuration.
              Actual MFA enforcement, identity-provider synchronization
              and session expiration require a backend integration.
            </div>

          </Card>
        )}

      {/* =====================================================
          EMPLOYEE ACCESS PROFILE DRAWER
      ====================================================== */}

      {selectedAccessUser &&
        canViewMatrix && (

          <Drawer
            isOpen={true}
            isCentered
            width="min(900px, 94vw)"
            maxWidth="min(900px, 94vw)"
            className="!h-auto max-h-[90vh]"
            id="employee-access-profile-modal"
            closeButtonLabel="Close employee access profile"
            title={`Access Profile: ${selectedAccessUser.name}`}
            onClose={() =>
              setSelectedAccessUserId(null)
            }
            headerActions={
              canExport ? (
                <Button
                  variant="primary"
                  icon={IconDownload}
                  onClick={exportSelectedAccessRecord}
                >
                  Export Access Record
                </Button>
              ) : null
            }
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">

                <span className="text-[11px] text-muted">
                  Changes update the frontend access matrix.
                </span>

                <Button
                  variant="secondary"
                  onClick={() =>
                    setSelectedAccessUserId(null)
                  }
                >
                  Close Profile
                </Button>

              </div>
            }
          >

            <div className="flex flex-col gap-4">

              {/* EMPLOYEE IDENTITY */}

              <section className="rounded-xl border border-line bg-surface2/30 p-4">

                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-line/60">

                  <Avatar
                    name={selectedAccessUser.name}
                    src={selectedAccessUser.avatarUrl}
                    size={48}
                  />

                  <div className="flex-1 min-w-0">

                    <h3 className="font-display font-bold text-[16px] text-ink">
                      {selectedAccessUser.name}
                    </h3>

                    <p className="text-[12px] text-muted">
                      {selectedAccessUser.role}
                    </p>

                  </div>

                  <StatusPill
                    status={selectedAccessUser.status}
                  />

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  <InfoField
                    label="Employee ID"
                    value={selectedAccessUser.employeeId}
                  />

                  <InfoField
                    label="User ID"
                    value={selectedAccessUser.id}
                  />

                  <InfoField
                    label="Email"
                    value={selectedAccessUser.email}
                  />

                  <InfoField
                    label="Department"
                    value={selectedAccessUser.department}
                  />

                  <InfoField
                    label="Designation"
                    value={selectedAccessUser.role}
                  />

                  <InfoField
                    label="Location"
                    value={selectedAccessUser.location}
                  />

                  <InfoField
                    label="Contact Number"
                    value={selectedAccessUser.contactNumber}
                  />

                  <InfoField
                    label="Joining Date"
                    value={
                      selectedAccessUser.joiningDate ||
                      selectedAccessUser.createdDate
                    }
                  />

                  {canReadRoles && (
                    <InfoField
                      label="Assigned Role"
                      value={
                        selectedAccessRole?.name ||
                        'Unassigned'
                      }
                    />
                  )}

                </div>

                {canManageRoles &&
                  !isCurrentAdministrator(
                    selectedAccessUser
                  ) && (

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-line/60">

                      <span className="text-[12px] font-semibold text-muted">
                        Change Administrative Role
                      </span>

                      <select
                        value={selectedAccessRoleId}
                        onChange={event =>
                          handleRoleAssignment(
                            selectedAccessUser,
                            event.target.value
                          )
                        }
                        className={`${INPUT_CLASS} min-w-[180px]`}
                        aria-label="Change assigned administrative role"
                      >

                        {!selectedAccessRole && (
                          <option value={selectedAccessRoleId}>
                            Unassigned Role
                          </option>
                        )}

                        {roleProfiles.map(role => (
                          <option
                            key={role.id}
                            value={role.id}
                          >
                            {role.name}
                          </option>
                        ))}

                      </select>

                    </div>
                  )}

              </section>

              {/* INDIVIDUAL APPLICATION PERMISSIONS */}

              <section className="rounded-xl border border-line bg-surface2/30 p-4">

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

                  <div>

                    <h3 className="font-display font-bold text-[15px] text-ink">
                      Application Access
                    </h3>

                    <p className="text-[12px] text-muted mt-1">
                      {
                        getGrantedApplications(
                          accessMatrix,
                          selectedAccessUser.id
                        ).length
                      }
                      {' '}of {SYSTEM_APPS.length}
                      {' '}applications granted
                    </p>

                  </div>

                  {canApplyPreset(
                    selectedAccessUser,
                    'RevokeAll'
                  ) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handleRolePreset(
                          selectedAccessUser,
                          'RevokeAll'
                        )
                      }
                    >
                      Revoke All Access
                    </Button>
                  )}

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {SYSTEM_APPS.map(app => {
                    const status =
                      getAccessStatus(
                        accessMatrix,
                        selectedAccessUser.id,
                        app
                      );

                    return (
                      <div
                        key={app}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-line bg-surface/40"
                      >

                        <div className="flex items-center gap-2">

                          <IconKey className="w-4 h-4 text-muted" />

                          <span className="text-[13px] font-medium text-ink">
                            {app}
                          </span>

                        </div>

                        <AccessButton
                          status={status}
                          disabled={
                            !canChangeApplication(
                              selectedAccessUser,
                              app
                            )
                          }
                          title={`${app}: ${ACCESS_STYLES[status].label}`}
                          onClick={() =>
                            handleApplicationAccess(
                              selectedAccessUser,
                              app
                            )
                          }
                        />

                      </div>
                    );
                  })}

                </div>

              </section>

              {/* INHERITED MODULE PERMISSIONS */}

              {canReadRoles &&
                selectedAccessRole && (

                  <section className="rounded-xl border border-line bg-surface2/30 p-4">

                    <h3 className="font-display font-bold text-[15px] text-ink mb-3">
                      Inherited Module Permissions
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                      {ROLE_MODULES.map(module => {
                        const permissions =
                          ACTIONS.filter(action =>
                            selectedAccessRole
                              .permissions?.[module]?.[action]
                          );

                        return (
                          <div
                            key={module}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-line bg-surface/40"
                          >

                            <span className="text-[12px] font-semibold text-ink">
                              {module}
                            </span>

                            <span className={`text-[11px] text-right ${
                              permissions.length
                                ? 'text-good'
                                : 'text-muted'
                            }`}>
                              {permissions.length
                                ? permissions.join(' · ')
                                : 'No Access'}
                            </span>

                          </div>
                        );
                      })}

                    </div>

                  </section>
                )}

              {/* EMPLOYEE REQUEST HISTORY */}

              <section className="rounded-xl border border-line bg-surface2/30 p-4">

                <h3 className="font-display font-bold text-[15px] text-ink mb-3">
                  Access Request History
                </h3>

                {pendingRequests.filter(
                  request =>
                    request.userId === selectedAccessUser.id
                ).length === 0 ? (

                  <p className="text-[12px] text-muted">
                    No access request records available.
                  </p>

                ) : (

                  <div className="flex flex-col gap-2">

                    {pendingRequests
                      .filter(
                        request =>
                          request.userId === selectedAccessUser.id
                      )
                      .map(request => (
                        <div
                          key={request.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-line bg-surface/40"
                        >

                          <div className="flex flex-col gap-1">

                            <span className="text-[13px] font-semibold text-ink">
                              {request.app}
                            </span>

                            <span className="text-[11px] text-muted">
                              {
                                request.requestedDate ||
                                request.time ||
                                '—'
                              }
                            </span>

                          </div>

                          <StatusPill
                            status={request.status}
                          />

                        </div>
                      ))}

                  </div>

                )}

              </section>

            </div>

          </Drawer>
        )}

      {/* =====================================================
          REQUEST DETAILS DRAWER
      ====================================================== */}

      {selectedRequest &&
        canViewRequests && (

          <Drawer
            isOpen={true}
            title={`Access Request: ${selectedRequest.id}`}
            onClose={() =>
              setSelectedRequestId(null)
            }
            footer={
              <div className="flex flex-wrap items-center justify-end gap-2">

                <Button
                  variant="secondary"
                  onClick={() =>
                    setSelectedRequestId(null)
                  }
                >
                  Close
                </Button>

                {isPendingRequest(selectedRequest) &&
                  canUpdateSecurity &&
                  !isCurrentAdministrator(
                    users.find(
                      user =>
                        user.id === selectedRequest.userId
                    )
                  ) && (
                    <>

                      <Button
                        variant="danger"
                        onClick={() =>
                          handleRequestDecision(
                            selectedRequest,
                            'reject'
                          )
                        }
                      >
                        Reject
                      </Button>

                      <Button
                        variant="primary"
                        disabled={
                          !isEligibleUser(
                            users.find(
                              user =>
                                user.id === selectedRequest.userId
                            )
                          ) ||
                          !SYSTEM_APPS.includes(
                            selectedRequest.app
                          )
                        }
                        onClick={() =>
                          handleRequestDecision(
                            selectedRequest,
                            'approve'
                          )
                        }
                      >
                        Approve Access
                      </Button>

                    </>
                  )}

              </div>
            }
          >

            <div className="flex flex-col gap-4">

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-line bg-surface2/40">

                <Avatar
                  name={selectedRequest.userName}
                  size={42}
                />

                <div className="flex-1">

                  <h3 className="text-[15px] font-semibold text-ink">
                    {selectedRequest.userName}
                  </h3>

                  <p className="text-[12px] text-muted">
                    {selectedRequest.userRole}
                  </p>

                </div>

                <StatusPill
                  status={selectedRequest.status}
                />

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <InfoField
                  label="Request ID"
                  value={selectedRequest.id}
                />

                <InfoField
                  label="Application"
                  value={selectedRequest.app}
                />

                <InfoField
                  label="Requested Date"
                  value={
                    selectedRequest.requestedDate ||
                    selectedRequest.time
                  }
                />

                <InfoField
                  label="Employee ID"
                  value={
                    users.find(
                      user =>
                        user.id === selectedRequest.userId
                    )?.employeeId
                  }
                />

              </div>

              <section className="p-3 rounded-xl border border-line bg-surface2/30">

                <h3 className="text-[11px] text-muted uppercase font-semibold mb-2">
                  Business Justification
                </h3>

                <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">
                  {
                    selectedRequest.justification ||
                    'No justification recorded.'
                  }
                </p>

              </section>

              {!isPendingRequest(selectedRequest) && (

                <section className="p-3 rounded-xl border border-line bg-surface2/30">

                  <h3 className="font-semibold text-ink text-[13px] mb-3">
                    Request Decision
                  </h3>

                  <div className="grid grid-cols-2 gap-3">

                    <InfoField
                      label="Reviewed By"
                      value={
                        selectedRequest.reviewedBy ||
                        selectedRequest.approvedBy ||
                        selectedRequest.rejectedBy
                      }
                    />

                    <InfoField
                      label="Reviewed Date"
                      value={
                        selectedRequest.reviewedDate ||
                        selectedRequest.approvedDate ||
                        selectedRequest.rejectedDate
                      }
                    />

                  </div>

                </section>

              )}

            </div>

          </Drawer>
        )}

      {/* CONFIRMATION DIALOG */}

      {confirmation && (
        <ConfirmDialog
          isOpen={true}
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          onConfirm={confirmAction}
          onCancel={() =>
            setConfirmation(null)
          }
        />
      )}

    </div>
  );
}
