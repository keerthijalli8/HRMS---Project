
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';

import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Tag } from '../shared/Tag';
import { Avatar } from '../shared/Avatar';
import { EmptyState } from '../shared/EmptyState';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { EmployeeDetailDrawer } from '../shared/EmployeeDetailDrawer';

import {
  IconSearch,
  IconPlus,
  IconUsers,
  IconCheck,
  IconShield,
  IconClock,
  IconX,
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const INPUT_CLASS =
  'w-full px-3 py-2 text-[13px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

const FILTER_CLASS =
  'px-2.5 py-1.5 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const CELL_CLASS =
  'px-3 py-2.5 align-middle text-[12.5px]';

const HEADER_CLASS =
  'px-3 py-2.5 whitespace-nowrap text-left';

const KPI_STYLES = {
  All: {
    color: 'text-ink',
    background: 'bg-surface2/60',
    border: 'border-line',
    active: 'border-accent ring-2 ring-accent/30',
    dot: 'bg-accent',
  },
  active: {
    color: 'text-good',
    background: 'bg-good/10',
    border: 'border-good/30',
    active: 'border-good ring-2 ring-good/30',
    dot: 'bg-good',
  },
  provisioning: {
    color: 'text-info',
    background: 'bg-info/10',
    border: 'border-info/30',
    active: 'border-info ring-2 ring-info/30',
    dot: 'bg-info',
  },
  suspended: {
    color: 'text-warn',
    background: 'bg-warn/10',
    border: 'border-warn/30',
    active: 'border-warn ring-2 ring-warn/30',
    dot: 'bg-warn',
  },
  deactivated: {
    color: 'text-bad',
    background: 'bg-bad/10',
    border: 'border-bad/30',
    active: 'border-bad ring-2 ring-bad/30',
    dot: 'bg-bad',
  },
};

// ============================================================
// UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || '').trim()
  );
}

function actionSucceeded(result) {
  return (
    result !== false &&
    result !== undefined &&
    result !== null
  );
}

function uniqueValues(values) {
  return [...new Set(
    values.filter(value =>
      String(value ?? '').trim()
    )
  )].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find(
    item => item.value === status
  )?.label || status;
}

function compareValues(a, b, field) {
  if (field === 'employeeId') {
    return String(a.employeeId || '').localeCompare(
      String(b.employeeId || ''),
      undefined,
      {
        numeric: true,
        sensitivity: 'base',
      }
    );
  }

  if (field === 'deviceCount') {
    return (
      Number(a.deviceCount || 0) -
      Number(b.deviceCount || 0)
    );
  }

  return String(a[field] || '').localeCompare(
    String(b[field] || ''),
    undefined,
    {
      numeric: true,
      sensitivity: 'base',
    }
  );
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function AccountKPI({
  status,
  label,
  value,
  icon: Icon,
  selected,
  onClick,
}) {
  const styles = KPI_STYLES[status];

  return (
    <button
      type="button"
      id={`status-filter-badge-${status.toLowerCase()}`}
      aria-pressed={selected}
      aria-label={`${label}: ${value}. Filter employee accounts`}
      onClick={onClick}
      title={`Filter ${label.toLowerCase()} accounts`}
      className={`min-w-0 flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer hover:brightness-110 ${
        styles.background
      } ${
        selected ? styles.active : styles.border
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
          {label}
        </span>

        <Icon className={`w-4 h-4 shrink-0 ${styles.color}`} />
      </div>

      <div className={`text-[26px] font-display font-bold tabular-nums ${styles.color}`}>
        {value}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />

        {selected
          ? 'Filter selected'
          : 'Click to view'}
      </div>
    </button>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
  options,
  required = false,
  disabled = false,
  readOnly = false,
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase font-semibold text-muted">
        {label}

        {required && (
          <span className="text-accent ml-1">*</span>
        )}
      </span>

      {options ? (
        <select
          value={value ?? ''}
          onChange={event =>
            onChange?.(event.target.value)
          }
          disabled={disabled}
          required={required}
          className={INPUT_CLASS}
        >
          {options.map(option => {
            const item =
              typeof option === 'string'
                ? {
                    value: option,
                    label: option,
                  }
                : option;

            return (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={event =>
            onChange?.(event.target.value)
          }
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={`${INPUT_CLASS} ${
            readOnly ? 'opacity-70 cursor-default' : ''
          }`}
        />
      )}
    </label>
  );
}

// ============================================================
// USER ACCOUNTS PAGE
// ============================================================

export function UserAccountsPage() {
  const {
    users = [],
    roleProfiles = [],
    currentUser,

    setUserStatus,
    updateUser,
    deleteUser,

    setActiveDrawer,
    setDrawerPayload,

    hasPermission,
    showToast,
  } = useStore();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canCreateUsers =
    hasPermission('User Profiles', 'write');

  const canUpdateUsers =
    hasPermission('User Profiles', 'update');

  const canDeleteUsers =
    hasPermission('User Profiles', 'delete');

  const canManageRoles =
    hasPermission('Role Administration', 'update');

  // ==========================================================
  // PAGE STATE
  // ==========================================================

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [deptFilter, setDeptFilter] =
    useState('All');

  const [locFilter, setLocFilter] =
    useState('All');

  const [roleFilter, setRoleFilter] =
    useState('All');

  const [sortField, setSortField] =
    useState('employeeId');

  const [sortAsc, setSortAsc] =
    useState(true);

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [bulkAction, setBulkAction] =
    useState('');

  const [bulkResult, setBulkResult] =
    useState('');

  const [editingUser, setEditingUser] =
    useState(null);

  const [editError, setEditError] =
    useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(null);

  const [confirmation, setConfirmation] =
    useState(null);

  const selectAllRef = useRef(null);

  // ==========================================================
  // CURRENT ADMINISTRATOR PROTECTION
  // ==========================================================

  const isCurrentAdministrator = user => {
    if (!user || !currentUser) return false;

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
  // DYNAMIC KPI COUNTS
  // ==========================================================

  const summary = useMemo(() => {
    return {
      All: users.length,

      active: users.filter(
        user => normalize(user.status) === 'active'
      ).length,

      provisioning: users.filter(
        user => normalize(user.status) === 'provisioning'
      ).length,

      suspended: users.filter(
        user => normalize(user.status) === 'suspended'
      ).length,

      deactivated: users.filter(
        user => normalize(user.status) === 'deactivated'
      ).length,
    };
  }, [users]);

  const kpiItems = [
    {
      status: 'All',
      label: 'Total Users',
      icon: IconUsers,
    },
    {
      status: 'active',
      label: 'Active Accounts',
      icon: IconCheck,
    },
    {
      status: 'provisioning',
      label: 'Provisioning',
      icon: IconClock,
    },
    {
      status: 'suspended',
      label: 'Suspended',
      icon: IconShield,
    },
    {
      status: 'deactivated',
      label: 'Deactivated',
      icon: IconX,
    },
  ];

  // ==========================================================
  // DYNAMIC FILTER OPTIONS
  // ==========================================================

  const departments = useMemo(
    () => uniqueValues(
      users.map(user => user.department)
    ),
    [users]
  );

  const locations = useMemo(
    () => uniqueValues(
      users.map(user => user.location)
    ),
    [users]
  );

  const editDepartments = uniqueValues([
    ...departments,
    'Engineering',
    'Finance',
    'HR',
    'Sales',
    'Operations',
    'IT',
    'Administration',
  ]);

  const editLocations = uniqueValues([
    ...locations,
    'Bengaluru',
    'Mumbai',
    'Pune',
    'Hyderabad',
    'Gurugram',
    'Chennai',
    'Remote',
  ]);

  const roleNameMap = useMemo(
    () => Object.fromEntries(
      roleProfiles.map(profile => [
        profile.id,
        profile.name,
      ])
    ),
    [roleProfiles]
  );

  // ==========================================================
  // SEARCH, FILTERING & SORTING
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const query = normalize(search);

    const searchWords = query
      .split(/\s+/)
      .filter(Boolean);

    return users
      .filter(user => {
        const roleId =
          user.adminRoleId || 'ROLE-006';

        const searchableText = [
          user.id,
          user.employeeId,
          user.name,
          user.email,
          user.department,
          user.role,
          user.location,
          user.contactNumber,
          user.status,
          user.createdDate,
          user.joiningDate,
          roleNameMap[roleId],
        ]
          .map(normalize)
          .join(' ');

        const matchesSearch =
          searchWords.every(word =>
            searchableText.includes(word)
          );

        const matchesStatus =
          statusFilter === 'All' ||
          normalize(user.status) === statusFilter;

        const matchesDepartment =
          deptFilter === 'All' ||
          user.department === deptFilter;

        const matchesLocation =
          locFilter === 'All' ||
          user.location === locFilter;

        const matchesRole =
          roleFilter === 'All' ||
          roleId === roleFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDepartment &&
          matchesLocation &&
          matchesRole
        );
      })
      .sort((a, b) => {
        const result = compareValues(
          a,
          b,
          sortField
        );

        return sortAsc ? result : -result;
      });
  }, [
    users,
    roleNameMap,
    search,
    statusFilter,
    deptFilter,
    locFilter,
    roleFilter,
    sortField,
    sortAsc,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (currentPage - 1) * pageSize;

  const paginatedUsers =
    filteredUsers.slice(
      startIndex,
      startIndex + pageSize
    );

  const firstVisible =
    filteredUsers.length
      ? startIndex + 1
      : 0;

  const lastVisible = Math.min(
    startIndex + pageSize,
    filteredUsers.length
  );

  const pageNumbers = useMemo(() => {
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

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }, [currentPage, totalPages]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setBulkAction('');
    setBulkResult('');
  }, [
    search,
    statusFilter,
    deptFilter,
    locFilter,
    roleFilter,
  ]);

  useEffect(() => {
    setPage(previous =>
      Math.min(previous, totalPages)
    );
  }, [totalPages]);

  // ==========================================================
  // FILTER ACTIONS
  // ==========================================================

  const handleStatusBadgeClick = status => {
    setStatusFilter(previous =>
      previous === status
        ? 'All'
        : status
    );
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDeptFilter('All');
    setLocFilter('All');
    setRoleFilter('All');
    setSortField('employeeId');
    setSortAsc(true);
    setPage(1);
    setSelectedIds([]);
    setBulkAction('');
    setBulkResult('');
  };

  const filtersApplied =
    Boolean(search.trim()) ||
    statusFilter !== 'All' ||
    deptFilter !== 'All' ||
    locFilter !== 'All' ||
    roleFilter !== 'All';

  const handleSort = field => {
    if (sortField === field) {
      setSortAsc(previous => !previous);
    } else {
      setSortField(field);
      setSortAsc(true);
    }

    setPage(1);
  };

  // ==========================================================
  // ROW SELECTION
  // ==========================================================

  const selectedUsers = users.filter(
    user =>
      selectedIds.includes(user.id) &&
      !isCurrentAdministrator(user)
  );

  const selectablePageUsers =
    paginatedUsers.filter(
      user => !isCurrentAdministrator(user)
    );

  const allPageSelected =
    selectablePageUsers.length > 0 &&
    selectablePageUsers.every(user =>
      selectedIds.includes(user.id)
    );

  const somePageSelected =
    selectablePageUsers.some(user =>
      selectedIds.includes(user.id)
    );

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    const validIds = new Set(
      users.map(user => user.id)
    );

    setSelectedIds(previous => {
      const next = previous.filter(
        id => validIds.has(id)
      );

      return next.length === previous.length
        ? previous
        : next;
    });
  }, [users]);

  const toggleUserSelection = user => {
    if (
      !canUpdateUsers ||
      isCurrentAdministrator(user)
    ) {
      return;
    }

    setSelectedIds(previous =>
      previous.includes(user.id)
        ? previous.filter(id => id !== user.id)
        : [...previous, user.id]
    );

    setBulkResult('');
  };

  const toggleSelectAll = () => {
    if (!canUpdateUsers) return;

    const visibleIds = selectablePageUsers.map(
      user => user.id
    );

    setSelectedIds(previous => {
      if (allPageSelected) {
        return previous.filter(
          id => !visibleIds.includes(id)
        );
      }

      return [
        ...new Set([
          ...previous,
          ...visibleIds,
        ]),
      ];
    });

    setBulkResult('');
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkAction('');
    setBulkResult('');
  };

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const openProvisionDrawer = () => {
    if (!canCreateUsers) return;

    setDrawerPayload(null);
    setActiveDrawer('new_user');
  };

  // ==========================================================
  // EMPLOYEE PROFILE
  // ==========================================================

  const selectedEmployee = users.find(
    user => user.id === selectedEmployeeId
  );

  const openEmployeeProfile = user => {
    if (!canReadUsers) return;

    setSelectedEmployeeId(user.id);
  };

  const closeEmployeeProfile = () => {
    setSelectedEmployeeId(null);
  };

  // ==========================================================
  // EDIT USER
  // ==========================================================

  const openEditUser = user => {
    if (!canUpdateUsers || !user) return;

    closeEmployeeProfile();

    setEditError('');

    setEditingUser({
      ...user,

      adminRoleId:
        user.adminRoleId || 'ROLE-006',

      contactNumber:
        user.contactNumber || '',

      createdDate:
        user.joiningDate ||
        user.createdDate ||
        '',
    });
  };

  const closeEditUser = () => {
    setEditingUser(null);
    setEditError('');
  };

  useEffect(() => {
    if (!editingUser || confirmation) {
      return;
    }

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setEditingUser(null);
        setEditError('');
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleEscape
      );
  }, [editingUser, confirmation]);

  const updateEditField = (field, value) => {
    setEditingUser(previous => ({
      ...previous,
      [field]: value,
    }));

    setEditError('');
  };

  const saveEditedUser = event => {
    event.preventDefault();

    if (!canUpdateUsers || !editingUser) {
      return;
    }

    const original = users.find(
      user => user.id === editingUser.id
    );

    if (!original) {
      setEditError('Employee account no longer exists.');
      return;
    }

    const name = String(
      editingUser.name || ''
    ).trim();

    const email = normalize(
      editingUser.email
    );

    const designation = String(
      editingUser.role || ''
    ).trim();

    const phone = String(
      editingUser.contactNumber || ''
    ).trim();

    if (!name) {
      setEditError('Full name is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setEditError('Enter a valid work email address.');
      return;
    }

    if (
      users.some(user =>
        user.id !== editingUser.id &&
        normalize(user.email) === email
      )
    ) {
      setEditError(
        'Another employee already uses this email address.'
      );
      return;
    }

    if (!designation) {
      setEditError('Designation is required.');
      return;
    }

    if (
      phone &&
      !/^[+\d][\d\s()-]{6,19}$/.test(phone)
    ) {
      setEditError('Enter a valid contact number.');
      return;
    }

    const joiningDate = String(
      editingUser.createdDate || ''
    ).trim();

    if (
      joiningDate &&
      Number.isNaN(Date.parse(joiningDate))
    ) {
      setEditError('Enter a valid joining date.');
      return;
    }

    const updates = {
      name,
      email,

      department: editingUser.department,

      role: designation,

      location: editingUser.location,

      contactNumber: phone,

      createdDate: joiningDate,
      joiningDate,
    };

    if (
      canManageRoles &&
      !isCurrentAdministrator(original) &&
      editingUser.adminRoleId !== original.adminRoleId
    ) {
      if (
        !roleProfiles.some(
          role => role.id === editingUser.adminRoleId
        )
      ) {
        setEditError('Select a valid assigned access role.');
        return;
      }

      updates.adminRoleId =
        editingUser.adminRoleId;
    }

    const result = updateUser(
      original.id,
      updates
    );

    if (!actionSucceeded(result)) {
      setEditError(
        'Unable to save changes. Review the employee details.'
      );

      return;
    }

    closeEditUser();
  };

  // ==========================================================
  // ASSIGNED ROLE MANAGEMENT
  // ==========================================================

  const handleRoleChange = (user, roleId) => {
    if (
      !canManageRoles ||
      isCurrentAdministrator(user)
    ) {
      return;
    }

    if (
      !roleProfiles.some(
        profile => profile.id === roleId
      )
    ) {
      showToast('Select a valid access role.');
      return;
    }

    if (user.adminRoleId === roleId) {
      return;
    }

    updateUser(user.id, {
      adminRoleId: roleId,
    });
  };

  // ==========================================================
  // ACCOUNT STATUS MANAGEMENT
  // ==========================================================

  const requestStatusChange = (
    user,
    newStatus
  ) => {
    if (!canUpdateUsers || !user) return;

    if (isCurrentAdministrator(user)) {
      showToast(
        'You cannot change your active administrator account status.'
      );

      return;
    }

    if (user.status === newStatus) {
      return;
    }

    closeEmployeeProfile();

    const actionLabels = {
      active: 'Reactivate',
      suspended: 'Suspend',
      deactivated: 'Deactivate',
    };

    const actionLabel =
      actionLabels[newStatus] || 'Update';

    let message =
      `Change ${user.name}'s account status to ${getStatusLabel(newStatus)}?`;

    if (
      ['suspended', 'deactivated'].includes(
        newStatus
      )
    ) {
      message +=
        ' Recorded application access will be revoked, local session records removed, and assigned assets marked for return.';
    }

    if (newStatus === 'active') {
      message +=
        ' Previously revoked application access must be granted again through Access Management.';
    }

    setConfirmation({
      title: `${actionLabel} Account`,

      message,

      confirmLabel: `${actionLabel} Account`,

      onConfirm: () =>
        setUserStatus(
          user.id,
          newStatus
        ),
    });
  };

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const requestDeleteUser = user => {
    if (!canDeleteUsers || !user) return;

    if (isCurrentAdministrator(user)) {
      showToast(
        'You cannot delete your active administrator account.'
      );

      return;
    }

    closeEmployeeProfile();

    if (Number(user.deviceCount || 0) > 0) {
      showToast(
        'Return all assigned assets before deleting this employee account.'
      );

      return;
    }

    setConfirmation({
      title: `Delete User: ${user.name}`,

      message:
        `Remove ${user.name}'s account and recorded application access? Historical operational records may remain.`,

      confirmLabel: 'Delete User',

      onConfirm: () => deleteUser(user.id),
    });
  };

  // ==========================================================
  // BULK ACCOUNT STATUS ACTIONS
  // ==========================================================

  const requestBulkAction = () => {
    if (!canUpdateUsers) return;

    if (!selectedUsers.length) {
      showToast('Select at least one employee account.');
      return;
    }

    if (
      ![
        'active',
        'suspended',
        'deactivated',
      ].includes(bulkAction)
    ) {
      showToast('Select a bulk action.');
      return;
    }

    const targetStatus = bulkAction;

    const eligibleUsers = selectedUsers.filter(
      user =>
        user.status !== targetStatus &&
        !isCurrentAdministrator(user)
    );

    if (!eligibleUsers.length) {
      showToast(
        'Selected accounts already have this status.'
      );

      return;
    }

    const actionLabels = {
      active: 'Reactivate',
      suspended: 'Suspend',
      deactivated: 'Deactivate',
    };

    const label = actionLabels[targetStatus];

    const description =
      targetStatus === 'active'
        ? 'Application permissions must be restored separately.'
        : 'Recorded application access will be revoked and assigned assets marked for return.';

    setConfirmation({
      title: `${label} ${eligibleUsers.length} Account(s)`,

      message:
        `${label} the selected employee accounts? ${description}`,

      confirmLabel: `${label} Accounts`,

      onConfirm: () => {
        let completed = 0;
        const failedIds = [];

        eligibleUsers.forEach(user => {
          const result = setUserStatus(
            user.id,
            targetStatus
          );

          if (actionSucceeded(result)) {
            completed += 1;
          } else {
            failedIds.push(user.id);
          }
        });

        const skipped =
          selectedUsers.length -
          eligibleUsers.length;

        setSelectedIds(failedIds);

        setBulkAction('');

        setBulkResult(
          `${completed} account(s) updated. ` +
          `${failedIds.length} failed. ` +
          `${skipped} unchanged.`
        );

        return failedIds.length === 0;
      },
    });
  };

  // ==========================================================
  // CONFIRMATION HANDLER
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
        'Account action failed:',
        error
      );

      showToast(
        'Unable to complete the requested account action.'
      );
    }
  };

  // ==========================================================
  // SORTABLE TABLE HEADER
  // ==========================================================

  const sortableHeader = (label, field) => (
    <th
      scope="col"
      className={HEADER_CLASS}
      aria-sort={
        sortField === field
          ? sortAsc
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer"
      >
        {label}

        <span
          className={
            sortField === field
              ? 'text-accent'
              : 'text-muted/50'
          }
        >
          {sortField === field
            ? sortAsc
              ? '↑'
              : '↓'
            : '↕'}
        </span>
      </button>
    </th>
  );

  // ==========================================================
  // RESTRICTED ACCESS
  // ==========================================================

  if (!canReadUsers) {
    return (
      <Card title="User Accounts Restricted">
        <div className="py-8 flex flex-col items-center text-center gap-3">
          <IconShield className="w-8 h-8 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have permission
            to view employee accounts.
          </p>
        </div>
      </Card>
    );
  }

  // ==========================================================
  // MAIN PAGE RENDER
  // ==========================================================

  return (
    <div
      id="user-management-dashboard"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div className="min-w-0">
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">

            <IconUsers className="w-6 h-6 text-sky-400 shrink-0" />

            User Accounts

          </h2>

          <p className="text-[12.5px] text-muted mt-1">
            Provision, manage and monitor employee platform accounts.
          </p>
        </div>

        {canCreateUsers && (
          <Button
            variant="primary"
            icon={IconPlus}
            onClick={openProvisionDrawer}
            ariaLabel="Provision new user"
          >
            Provision User
          </Button>
        )}

      </div>

      {/* =====================================================
          DYNAMIC CLICKABLE KPIs
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

        {kpiItems.map(item => (
          <AccountKPI
            key={item.status}
            status={item.status}
            label={item.label}
            icon={item.icon}
            value={summary[item.status]}
            selected={statusFilter === item.status}
            onClick={() =>
              handleStatusBadgeClick(item.status)
            }
          />
        ))}

      </div>

      {/* =====================================================
          EMPLOYEE DIRECTORY
      ====================================================== */}

      <Card
        id="widget-accounts"
        data-w="accounts"
        title="Employee Directory & Account Lifecycle"
        subText={`${filteredUsers.length} of ${users.length} employee accounts`}
      >

        {/* SEARCH AND FILTER TOOLBAR */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex flex-wrap items-center gap-2">

            <div className="relative w-full sm:w-64">

              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />

              <input
                type="text"
                value={search}
                onChange={event =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, email, ID..."
                aria-label="Search employee accounts"
                className="w-full pl-8 pr-8 py-2 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  title="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted hover:text-ink cursor-pointer"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )}

            </div>

            {/* DEPARTMENT FILTER */}

            <select
              value={deptFilter}
              onChange={event =>
                setDeptFilter(event.target.value)
              }
              aria-label="Filter by department"
              className={FILTER_CLASS}
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

            {/* LOCATION FILTER */}

            <select
              value={locFilter}
              onChange={event =>
                setLocFilter(event.target.value)
              }
              aria-label="Filter by location"
              className={FILTER_CLASS}
            >
              <option value="All">
                All Locations
              </option>

              {locations.map(location => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}
            </select>

            {/* ROLE FILTER */}

            <select
              value={roleFilter}
              onChange={event =>
                setRoleFilter(event.target.value)
              }
              aria-label="Filter by access role"
              className={FILTER_CLASS}
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

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={event =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter by account status"
              className={FILTER_CLASS}
            >
              <option value="All">
                All Statuses
              </option>

              {STATUS_OPTIONS.map(status => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>

          </div>

          {filtersApplied && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
              icon={IconX}
            >
              Reset Filters
            </Button>
          )}

        </div>

        {/* ===================================================
            BULK ACTIONS TOOLBAR
        ==================================================== */}

        {canUpdateUsers && selectedUsers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-accent/5 border border-accent/30">

            <div className="flex items-center gap-2">

              <IconCheck className="w-4 h-4 text-accent" />

              <span className="text-[13px] font-semibold text-accent">
                {selectedUsers.length} selected
              </span>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <select
                value={bulkAction}
                onChange={event =>
                  setBulkAction(event.target.value)
                }
                aria-label="Select bulk account action"
                className={FILTER_CLASS}
              >
                <option value="">
                  Select Bulk Action
                </option>

                <option value="active">
                  Activate Accounts
                </option>

                <option value="suspended">
                  Suspend Accounts
                </option>

                <option value="deactivated">
                  Deactivate Accounts
                </option>
              </select>

              <Button
                variant="primary"
                size="sm"
                disabled={!bulkAction}
                onClick={requestBulkAction}
              >
                Apply
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>

            </div>

          </div>
        )}

        {bulkResult && (
          <div
            role="status"
            className="flex justify-between gap-3 p-3 rounded-lg border border-line bg-surface2/40 text-[12px] text-ink"
          >
            <span>{bulkResult}</span>

            <button
              type="button"
              onClick={() => setBulkResult('')}
              aria-label="Dismiss bulk action result"
              className="text-muted hover:text-ink cursor-pointer"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================================================
            EMPLOYEE TABLE
        ==================================================== */}

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={IconUsers}
            message="No employee accounts match the selected search or filters."
            actionLabel={
              filtersApplied
                ? 'Reset Filters'
                : canCreateUsers
                  ? 'Provision User'
                  : undefined
            }
            onAction={
              filtersApplied
                ? resetFilters
                : canCreateUsers
                  ? openProvisionDrawer
                  : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-1 mt-1">

            <table className="user-accounts-table w-full text-left border-collapse min-w-[1760px]">

              <thead>
                <tr className="border-b border-line text-muted font-bold text-[11px] uppercase tracking-wider">

                  {canUpdateUsers && (
                    <th
                      scope="col"
                      className={`${HEADER_CLASS} w-10`}
                    >
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        disabled={!selectablePageUsers.length}
                        aria-label="Select all eligible users on this page"
                        style={{
                          accentColor: 'var(--accent)',
                        }}
                        className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </th>
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    No.
                  </th>

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    User ID
                  </th>

                  {sortableHeader(
                    'Employee ID',
                    'employeeId'
                  )}

                  {sortableHeader(
                    'Name',
                    'name'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Email
                  </th>

                  {sortableHeader(
                    'Department',
                    'department'
                  )}

                  {sortableHeader(
                    'Designation',
                    'role'
                  )}

                  {sortableHeader(
                    'Location',
                    'location'
                  )}

                  {sortableHeader(
                    'Account Status',
                    'status'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Assigned Role
                  </th>

                  {sortableHeader(
                    'Devices',
                    'deviceCount'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {paginatedUsers.map((user, index) => {
                  const ownAccount =
                    isCurrentAdministrator(user);

                  const isSelected =
                    selectedIds.includes(user.id);

                  const roleId =
                    user.adminRoleId || 'ROLE-006';

                  const currentRoleExists =
                    roleProfiles.some(
                      profile => profile.id === roleId
                    );

                  return (
                    <tr
                      key={user.id}
                      onClick={() =>
                        openEmployeeProfile(user)
                      }
                      className={`h-[58px] border-b border-dashed border-line transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-accent/5'
                          : 'hover:bg-surface2/60'
                      }`}
                    >

                      {/* ROW SELECTION */}

                      {canUpdateUsers && (
                        <td
                          className={CELL_CLASS}
                          onClick={event =>
                            event.stopPropagation()
                          }
                        >
                          <input
                            type="checkbox"
                            checked={
                              isSelected &&
                              !ownAccount
                            }
                            disabled={ownAccount}
                            onChange={() =>
                              toggleUserSelection(user)
                            }
                            aria-label={`Select ${user.name}`}
                            title={
                              ownAccount
                                ? 'Current administrator account is protected'
                                : `Select ${user.name}`
                            }
                            style={{
                              accentColor: 'var(--accent)',
                            }}
                            className="w-4 h-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>
                      )}

                      <td className={`${CELL_CLASS} text-muted font-data`}>
                        {startIndex + index + 1}
                      </td>

                      <td className={`${CELL_CLASS} text-muted font-data`}>
                        <span
                          title={user.id}
                          className="block max-w-[115px] truncate"
                        >
                          {user.id}
                        </span>
                      </td>

                      <td className={`${CELL_CLASS} text-muted font-data whitespace-nowrap`}>
                        {user.employeeId || '—'}
                      </td>

                      {/* EMPLOYEE NAME */}

                      <td className={CELL_CLASS}>

                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            openEmployeeProfile(user);
                          }}
                          className="flex items-center gap-2.5 text-left cursor-pointer"
                        >

                          <Avatar
                            name={user.name}
                            src={user.avatarUrl}
                            size={30}
                          />

                          <div className="flex flex-col min-w-0">

                            <span className="font-semibold text-ink group-hover:text-accent transition-colors whitespace-nowrap">
                              {user.name}
                            </span>

                            {ownAccount && (
                              <span className="text-[10px] text-accent">
                                Current Administrator
                              </span>
                            )}

                          </div>

                        </button>

                      </td>

                      <td className={`${CELL_CLASS} text-muted font-data`}>
                        <span
                          className="block max-w-[220px] truncate"
                          title={user.email}
                        >
                          {user.email}
                        </span>
                      </td>

                      <td className={`${CELL_CLASS} text-ink whitespace-nowrap`}>
                        {user.department}
                      </td>

                      <td className={CELL_CLASS}>
                        <Tag>{user.role}</Tag>
                      </td>

                      <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>
                        {user.location || '—'}
                      </td>

                      <td className={CELL_CLASS}>
                        <StatusPill status={user.status} />
                      </td>

                      {/* ASSIGNED ROLE */}

                      <td
                        className={CELL_CLASS}
                        onClick={event =>
                          event.stopPropagation()
                        }
                      >
                        <select
                          value={roleId}
                          aria-label={`Assigned role for ${user.name}`}
                          disabled={
                            !canManageRoles ||
                            ownAccount
                          }
                          onChange={event =>
                            handleRoleChange(
                              user,
                              event.target.value
                            )
                          }
                          title={
                            ownAccount
                              ? 'Current administrator role is protected'
                              : !canManageRoles
                                ? 'Role update permission required'
                                : 'Change assigned role'
                          }
                          className="w-full min-w-[145px] max-w-[190px] px-2 py-1.5 rounded-lg bg-surface2 border border-line text-ink text-[12px] focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                          {!currentRoleExists && (
                            <option value={roleId}>
                              {roleNameMap[roleId] || 'Unassigned Role'}
                            </option>
                          )}

                          {roleProfiles.map(profile => (
                            <option
                              key={profile.id}
                              value={profile.id}
                            >
                              {profile.name}
                            </option>
                          ))}

                        </select>
                      </td>

                      {/* DYNAMIC DEVICE COUNT */}

                      <td className={`${CELL_CLASS} font-data text-accent font-semibold text-center`}>
                        {Number(user.deviceCount || 0)}
                      </td>

                      {/* ACCOUNT ACTIONS */}

                      <td
                        className={CELL_CLASS}
                        onClick={event =>
                          event.stopPropagation()
                        }
                      >

                        <div className="flex items-center gap-1.5 whitespace-nowrap">

                          <Button
                            variant="secondary"
                            size="sm"
                            className="!px-2 !py-1 !text-[11px]"
                            onClick={() =>
                              openEmployeeProfile(user)
                            }
                          >
                            View
                          </Button>

                          {canUpdateUsers && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="!px-2 !py-1 !text-[11px]"
                              onClick={() =>
                                openEditUser(user)
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {canUpdateUsers &&
                            !ownAccount &&
                            (
                              user.status === 'active' ||
                              user.status === 'provisioning'
                            ) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="!px-2 !py-1 !text-[11px] !text-warn"
                                onClick={() =>
                                  requestStatusChange(
                                    user,
                                    'suspended'
                                  )
                                }
                              >
                                Suspend
                              </Button>
                            )}

                          {canUpdateUsers &&
                            !ownAccount &&
                            (
                              user.status === 'suspended' ||
                              user.status === 'deactivated' ||
                              user.status === 'provisioning'
                            ) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="!px-2 !py-1 !text-[11px] !text-good"
                                onClick={() =>
                                  requestStatusChange(
                                    user,
                                    'active'
                                  )
                                }
                              >
                                {user.status === 'provisioning'
                                  ? 'Activate'
                                  : 'Reactivate'}
                              </Button>
                            )}

                          {canUpdateUsers &&
                            !ownAccount &&
                            user.status !== 'deactivated' && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="!px-2 !py-1 !text-[11px]"
                                onClick={() =>
                                  requestStatusChange(
                                    user,
                                    'deactivated'
                                  )
                                }
                              >
                                Deactivate
                              </Button>
                            )}

                          {canDeleteUsers &&
                            !ownAccount && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="!px-2 !py-1 !text-[11px]"
                                onClick={() =>
                                  requestDeleteUser(user)
                                }
                              >
                                Delete
                              </Button>
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

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">

          <div className="flex flex-wrap items-center gap-3">

            <span
              aria-live="polite"
              className="text-[12px] text-muted"
            >
              Showing{' '}
              <strong className="text-ink">
                {firstVisible}–{lastVisible}
              </strong>
              {' '}of{' '}
              <strong className="text-ink">
                {filteredUsers.length}
              </strong>
              {' '}accounts
            </span>

            <label className="flex items-center gap-2 text-[11.5px] text-muted">

              Rows per page

              <select
                value={pageSize}
                onChange={event => {
                  setPageSize(
                    Number(event.target.value)
                  );

                  setPage(1);
                }}
                className={FILTER_CLASS}
              >

                {PAGE_SIZE_OPTIONS.map(size => (
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
              className="!px-2.5 !py-1.5 !text-[12px]"
              disabled={currentPage === 1}
              onClick={() => setPage(1)}
            >
              First
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="!px-2.5 !py-1.5 !text-[12px]"
              disabled={currentPage === 1}
              onClick={() =>
                setPage(currentPage - 1)
              }
            >
              Previous
            </Button>

            {pageNumbers.map(number => (
              <button
                key={number}
                type="button"
                aria-label={`Page ${number}`}
                aria-current={
                  currentPage === number
                    ? 'page'
                    : undefined
                }
                onClick={() => setPage(number)}
                className={`min-w-[30px] h-[30px] rounded-lg border text-[12px] font-semibold transition-colors cursor-pointer ${
                  currentPage === number
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface2 border-line text-muted hover:text-ink hover:border-accent'
                }`}
              >
                {number}
              </button>
            ))}

            <Button
              variant="secondary"
              size="sm"
              className="!px-2.5 !py-1.5 !text-[12px]"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage(currentPage + 1)
              }
            >
              Next
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="!px-2.5 !py-1.5 !text-[12px]"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage(totalPages)
              }
            >
              Last
            </Button>

          </div>

        </div>

      </Card>

      {/* =====================================================
          EMPLOYEE EDIT MODAL
      ====================================================== */}

      {editingUser && canUpdateUsers && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={event => {
            if (
              event.target === event.currentTarget
            ) {
              closeEditUser();
            }
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: '#0a222b',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--card-shadow)',
              padding: 'var(--pad)',
            }}
            className="flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto"
          >

            <div className="flex justify-between items-center gap-3 border-b border-line pb-3">

              <div className="flex items-center gap-3">

                <Avatar
                  name={editingUser.name}
                  src={editingUser.avatarUrl}
                  size={40}
                />

                <div className="min-w-0">

                  <h3
                    id="edit-user-title"
                    className="font-display font-bold text-[16px] text-ink"
                  >
                    Update Employee Account
                  </h3>

                  <p className="text-[12px] text-muted">
                    {editingUser.name}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={closeEditUser}
                aria-label="Close edit modal"
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 cursor-pointer"
              >
                <IconX className="w-4 h-4" />
              </button>

            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={saveEditedUser}
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <EditField
                  label="User ID"
                  value={editingUser.id}
                  readOnly
                />

                <EditField
                  label="Employee ID"
                  value={editingUser.employeeId}
                  readOnly
                />

              </div>

              <EditField
                label="Full Name"
                required
                value={editingUser.name}
                onChange={value =>
                  updateEditField('name', value)
                }
              />

              <EditField
                label="Work Email"
                type="email"
                required
                value={editingUser.email}
                onChange={value =>
                  updateEditField('email', value)
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <EditField
                  label="Department"
                  value={editingUser.department}
                  options={editDepartments}
                  onChange={value =>
                    updateEditField('department', value)
                  }
                />

                <EditField
                  label="Location"
                  value={editingUser.location}
                  options={editLocations}
                  onChange={value =>
                    updateEditField('location', value)
                  }
                />

              </div>

              <EditField
                label="Designation"
                required
                value={editingUser.role}
                onChange={value =>
                  updateEditField('role', value)
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <EditField
                  label="Contact Number"
                  type="tel"
                  value={editingUser.contactNumber}
                  onChange={value =>
                    updateEditField(
                      'contactNumber',
                      value
                    )
                  }
                />

                <EditField
                  label="Assigned Access Role"
                  value={editingUser.adminRoleId}
                  disabled={
                    !canManageRoles ||
                    isCurrentAdministrator(editingUser)
                  }
                  options={[
                    ...(
                      roleProfiles.some(
                        role =>
                          role.id === editingUser.adminRoleId
                      )
                        ? []
                        : [{
                            value: editingUser.adminRoleId,
                            label: 'Unassigned Role',
                          }]
                    ),

                    ...roleProfiles.map(role => ({
                      value: role.id,
                      label: role.name,
                    })),
                  ]}
                  onChange={value =>
                    updateEditField(
                      'adminRoleId',
                      value
                    )
                  }
                />

                <EditField
                  label="Joining Date"
                  value={editingUser.createdDate}
                  onChange={value =>
                    updateEditField(
                      'createdDate',
                      value
                    )
                  }
                />

                <div className="flex flex-col gap-1.5">

                  <span className="text-[11px] uppercase font-semibold text-muted">
                    Account Status
                  </span>

                  <div className="px-3 py-2 rounded-lg bg-surface2 border border-line">

                    <StatusPill
                      status={editingUser.status}
                    />

                  </div>

                </div>

              </div>

              <p className="text-[11px] text-muted">
                Account suspension, deactivation and
                reactivation are managed through the
                account lifecycle actions.
              </p>

              {editError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-bad/10 border border-bad/30 text-bad text-[12px]"
                >
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-line">

                <Button
                  variant="secondary"
                  onClick={closeEditUser}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                >
                  Save Changes
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          ACCOUNT CONFIRMATION DIALOG
      ====================================================== */}

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

      {/* =====================================================
          EMPLOYEE DETAILS DRAWER
      ====================================================== */}

      <EmployeeDetailDrawer
        employee={selectedEmployee || null}
        isOpen={Boolean(selectedEmployee)}
        onClose={closeEmployeeProfile}
        onEdit={
          canUpdateUsers
            ? () => openEditUser(selectedEmployee)
            : undefined
        }
        onDeactivate={
          canUpdateUsers &&
          selectedEmployee &&
          !isCurrentAdministrator(selectedEmployee)
            ? () =>
                requestStatusChange(
                  selectedEmployee,
                  'deactivated'
                )
            : undefined
        }
        onDelete={
          canDeleteUsers &&
          selectedEmployee &&
          !isCurrentAdministrator(selectedEmployee)
            ? () =>
                requestDeleteUser(selectedEmployee)
            : undefined
        }
      />

    </div>
  );
}
