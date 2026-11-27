
import React, { useState, useMemo } from 'react';

import { useStore } from '../../context/StoreContext';

import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Avatar } from '../shared/Avatar';
import { Tag } from '../shared/Tag';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { EmptyState } from '../shared/EmptyState';
import { Drawer } from '../shared/Drawer';

import {
  IconShare,
  IconLaptop,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconShield,
  IconUsers,
  IconSearch,
  IconDownload,
  IconX,
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair - Minor Wear' },
  { value: 'poor', label: 'Poor - Requires Inspection' },
  { value: 'damaged', label: 'Damaged - Requires Repair' },
];

const PAGE_SIZES = [5, 10, 20, 50];

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

const FILTER_CLASS =
  'px-3 py-1.5 text-[12px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const LABEL_CLASS =
  'text-[12px] font-semibold text-muted';

const HEADER_CLASS =
  'px-3 py-3 text-[11px] uppercase tracking-wider font-bold text-muted whitespace-nowrap';

const CELL_CLASS =
  'px-3 py-3 text-[12.5px] align-middle';

// ============================================================
// UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getAssetTag(asset) {
  return asset?.assetTag ||
    asset?.tag ||
    asset?.assetId ||
    '';
}

function getAssetName(asset) {
  return asset?.model ||
    asset?.name ||
    'Unnamed Asset';
}

function getAssetType(asset) {
  return asset?.type ||
    asset?.category ||
    'Other';
}

function todayInput() {
  const parts = new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  ).formatToParts(new Date());

  const getPart = type =>
    parts.find(part => part.type === type)?.value;

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

function formatHandoverDate(value) {
  if (!value) return '';

  const [year, month, day] =
    value.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return '';
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function uniqueValues(values) {
  return [...new Set(
    values.filter(Boolean)
  )].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function getAssignedUser(asset, users) {
  if (!asset) return null;

  const identifiers = [
    asset.assignedTo,
    asset.assignedToId,
    asset.assignedEmployeeId,
    asset.employeeId,
  ].filter(Boolean);

  const names = [
    asset.assignedName,
    asset.assignedEmployee,
  ].filter(Boolean);

  return users.find(user =>
    identifiers.includes(user.id) ||
    identifiers.includes(user.employeeId) ||
    names.includes(user.name)
  ) || null;
}

function isAssignedAsset(asset) {
  return [
    'assigned',
    'overdue return',
  ].includes(normalize(asset?.status));
}

function isEligibleEmployee(user) {
  return normalize(user?.status) === 'active';
}

function hasOpenCustody(asset, history) {
  if (!asset) return false;

  return history.some(record =>
    (
      record.assetId === asset.id ||
      (
        getAssetTag(asset) &&
        record.assetTag === getAssetTag(asset)
      )
    ) &&
    !record.returnDate
  );
}

function isAvailableAsset(asset, history) {
  if (!asset) return false;

  return (
    normalize(asset.status) === 'in stock' &&

    !asset.assignedTo &&
    !asset.assignedToId &&
    !asset.assignedEmployeeId &&
    !asset.assignedName &&
    !asset.assignedEmployee &&

    !['damaged', 'poor'].includes(
      normalize(asset.condition)
    ) &&

    !hasOpenCustody(asset, history)
  );
}

function matchesQuery(values, query) {
  const words = normalize(query)
    .split(/\s+/)
    .filter(Boolean);

  const text = values
    .map(normalize)
    .join(' ');

  return words.every(word =>
    text.includes(word)
  );
}

function safeCSV(value) {
  let text = String(value ?? '');

  // Prevent spreadsheet formula injection.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(headers, rows, filename) {
  const content = [
    headers,
    ...rows,
  ]
    .map(row =>
      row.map(safeCSV).join(',')
    )
    .join('\r\n');

  const blob = new Blob(
    ['\uFEFF', content],
    {
      type: 'text/csv;charset=utf-8',
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
// REUSABLE COMPONENTS
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

  const startPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - 4)
  );

  const endPage = Math.min(
    totalPages,
    startPage + 4
  );

  const numbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
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
            className={FILTER_CLASS}
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>
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
          className="!text-[11px] !px-2 !py-1.5"
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
            className={`min-w-[30px] h-8 rounded-lg border text-[12px] font-semibold cursor-pointer ${
              number === currentPage
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
          className="!text-[11px] !px-2 !py-1.5"
        >
          Next
        </Button>

      </div>

    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface2/40 border border-line min-w-0">

      <span className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>

      <div className="text-[13px] font-semibold text-ink break-words">
        {value ?? '—'}
      </div>

    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}) {
  return (
    <div className="relative w-full sm:w-60">

      <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />

      <input
        type="text"
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${FILTER_CLASS} w-full pl-8 pr-8`}
      />

      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
        >
          <IconX className="w-3.5 h-3.5" />
        </button>
      )}

    </div>
  );
}

function ConditionSelect({
  value,
  onChange,
  disabled = false,
  id,
}) {
  const options = CONDITIONS.some(
    item => item.value === value
  )
    ? CONDITIONS
    : [
        ...CONDITIONS,
        {
          value,
          label: value,
        },
      ];

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      required
      onChange={event =>
        onChange(event.target.value)
      }
      className={INPUT_CLASS}
    >

      {options.map(condition => (
        <option
          key={condition.value}
          value={condition.value}
        >
          {condition.label}
        </option>
      ))}

    </select>
  );
}

// ============================================================
// ASSET ALLOCATION PAGE
// ============================================================

export function AssetAllocationPage() {
  const {
    assets = [],
    users = [],
    custodyHistory = [],

    assignAsset,
    returnAsset,

    navigate,
    hasPermission,
    showToast,
  } = useStore();

  // ==========================================================
  // ROLE PERMISSIONS
  // ==========================================================

  const canReadAssets =
    hasPermission('Assets', 'read');

  const canUpdateAssets =
    hasPermission('Assets', 'update');

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canAssignAssets =
    canUpdateAssets && canReadUsers;

  const canExport =
    canReadAssets &&
    hasPermission('Reports', 'read');

  // ==========================================================
  // PAGE STATE
  // ==========================================================

  const [activeCategory, setActiveCategory] =
    useState('all');

  const [selectedAssetId, setSelectedAssetId] =
    useState('');

  const [selectedUserId, setSelectedUserId] =
    useState('');

  const [issueCondition, setIssueCondition] =
    useState('good');

  const [issueNotes, setIssueNotes] =
    useState('');

  const [handoverDate, setHandoverDate] =
    useState(todayInput);

  const [assignmentError, setAssignmentError] =
    useState('');

  const [assetSearch, setAssetSearch] =
    useState('');

  const [assetCategoryFilter, setAssetCategoryFilter] =
    useState('All');

  const [custodySearch, setCustodySearch] =
    useState('');

  const [custodyStatusFilter, setCustodyStatusFilter] =
    useState('All');

  const [custodyLocationFilter, setCustodyLocationFilter] =
    useState('All');

  const [custodyPage, setCustodyPage] =
    useState(1);

  const [custodyPageSize, setCustodyPageSize] =
    useState(5);

  const [historySearch, setHistorySearch] =
    useState('');

  const [historyStatusFilter, setHistoryStatusFilter] =
    useState('All');

  const [historyConditionFilter, setHistoryConditionFilter] =
    useState('All');

  const [historyPage, setHistoryPage] =
    useState(1);

  const [historyPageSize, setHistoryPageSize] =
    useState(10);

  const [returningAssetId, setReturningAssetId] =
    useState(null);

  const [returnCondition, setReturnCondition] =
    useState('good');

  const [returnNotes, setReturnNotes] =
    useState('');

  const [returnError, setReturnError] =
    useState('');

  const [selectedCustodyId, setSelectedCustodyId] =
    useState(null);

  // ==========================================================
  // SHARED INVENTORY DATA
  // ==========================================================

  const availableAssets = useMemo(() => {
    return assets.filter(asset =>
      isAvailableAsset(
        asset,
        custodyHistory
      )
    );
  }, [assets, custodyHistory]);

  const assignedAssets = useMemo(() => {
    return assets.filter(isAssignedAsset);
  }, [assets]);

  const overdueAssets = useMemo(() => {
    return assignedAssets.filter(asset =>
      normalize(asset.status) === 'overdue return'
    );
  }, [assignedAssets]);

  const eligibleEmployees = useMemo(() => {
    return users
      .filter(isEligibleEmployee)
      .sort((a, b) =>
        String(a.name || '').localeCompare(
          String(b.name || '')
        )
      );
  }, [users]);

  const returnedRecords = useMemo(() => {
    return custodyHistory.filter(record =>
      Boolean(record.returnDate)
    );
  }, [custodyHistory]);

  const activeCustodyRecords = useMemo(() => {
    return custodyHistory.filter(record =>
      !record.returnDate
    );
  }, [custodyHistory]);

  const inspectionRequiredAssets = useMemo(() => {
    return assets.filter(asset =>
      normalize(asset.status) === 'in stock' &&
      ['poor', 'damaged'].includes(
        normalize(asset.condition)
      )
    );
  }, [assets]);

  const selectedAsset = assets.find(
    asset => asset.id === selectedAssetId
  ) || null;

  const selectedEmployee = users.find(
    user => user.id === selectedUserId
  ) || null;

  const returningAsset = assets.find(
    asset => asset.id === returningAssetId
  ) || null;

  const returningEmployee = canReadUsers
    ? getAssignedUser(returningAsset, users)
    : null;

  const selectedCustodyRecord =
    custodyHistory.find(record =>
      record.id === selectedCustodyId
    ) || null;

  // ==========================================================
  // DYNAMIC CATEGORY CARDS
  // ==========================================================

  const categories = [
    {
      id: 'assign',
      label: 'Available Assets',
      icon: IconShare,
      metric: String(availableAssets.length),
      metricLabel: 'Ready for Assignment',
      subText: 'Available inventory with no active custody',
      badge: 'In Stock',
      badgeColor: 'emerald',
    },
    {
      id: 'returns',
      label: 'Assigned Assets',
      icon: IconLaptop,
      metric: String(assignedAssets.length),
      metricLabel: 'In Employee Custody',
      subText: 'Track current asset holders',
      badge: `${overdueAssets.length} Overdue`,
      badgeColor: overdueAssets.length
        ? 'amber'
        : 'emerald',
    },
    {
      id: 'overdue',
      label: 'Overdue Returns',
      icon: IconAlertTriangle,
      metric: String(overdueAssets.length),
      metricLabel: 'Return Pending',
      subText: 'Assets marked for overdue recovery',
      badge: overdueAssets.length
        ? 'Attention Required'
        : 'No Overdue Assets',
      badgeColor: overdueAssets.length
        ? 'red'
        : 'emerald',
    },
    {
      id: 'history',
      label: 'Custody History',
      icon: IconClock,
      metric: String(custodyHistory.length),
      metricLabel: 'Recorded Transactions',
      subText: `${returnedRecords.length} completed returns`,
      badge: `${activeCustodyRecords.length} Open Records`,
      badgeColor: 'sky',
    },
  ];

  const showAssign =
    activeCategory === 'all' ||
    activeCategory === 'assign';

  const showReturns =
    activeCategory === 'all' ||
    activeCategory === 'returns' ||
    activeCategory === 'overdue';

  const showHistory =
    activeCategory === 'all' ||
    activeCategory === 'history';

  const selectCategory = category => {
    const nextCategory =
      activeCategory === category
        ? 'all'
        : category;

    setActiveCategory(nextCategory);

    setCustodySearch('');
    setCustodyLocationFilter('All');

    setCustodyStatusFilter(
      nextCategory === 'overdue'
        ? 'overdue return'
        : 'All'
    );

    setCustodyPage(1);
  };

  // ==========================================================
  // AVAILABLE ASSET SEARCH
  // ==========================================================

  const assetCategoryOptions = useMemo(() => {
    return uniqueValues(
      availableAssets.map(getAssetType)
    );
  }, [availableAssets]);

  const filteredAvailableAssets = useMemo(() => {
    return availableAssets.filter(asset => {
      const categoryMatches =
        assetCategoryFilter === 'All' ||
        getAssetType(asset) === assetCategoryFilter;

      const searchMatches = matchesQuery(
        [
          asset.id,
          asset.assetId,
          getAssetTag(asset),
          getAssetName(asset),
          getAssetType(asset),
          asset.serial,
          asset.serialNumber,
          asset.location,
        ],
        assetSearch
      );

      return categoryMatches && searchMatches;
    });
  }, [
    availableAssets,
    assetCategoryFilter,
    assetSearch,
  ]);

  // ==========================================================
  // ASSIGN ASSET HANDLERS
  // ==========================================================

  const handleAssetSelection = assetId => {
    setSelectedAssetId(assetId);

    const asset = availableAssets.find(
      item => item.id === assetId
    );

    setIssueCondition(
      asset?.condition || 'good'
    );

    setAssignmentError('');
  };

  const resetAssignmentForm = () => {
    setSelectedAssetId('');
    setSelectedUserId('');
    setIssueCondition('good');
    setIssueNotes('');
    setHandoverDate(todayInput());
    setAssetSearch('');
    setAssetCategoryFilter('All');
    setAssignmentError('');
  };

  const handleAssignAsset = event => {
    event.preventDefault();

    if (!canAssignAssets) {
      setAssignmentError(
        'Assignment requires Assets: update and User Profiles: read permission.'
      );
      return;
    }

    if (!selectedAssetId) {
      setAssignmentError(
        'Select an available asset.'
      );
      return;
    }

    if (!selectedUserId) {
      setAssignmentError(
        'Select the receiving employee.'
      );
      return;
    }

    const asset = assets.find(
      item => item.id === selectedAssetId
    );

    const employee = users.find(
      item => item.id === selectedUserId
    );

    if (
      !isAvailableAsset(
        asset,
        custodyHistory
      )
    ) {
      setAssignmentError(
        'This asset is no longer available for assignment.'
      );
      return;
    }

    if (!isEligibleEmployee(employee)) {
      setAssignmentError(
        'Only active employee accounts can receive assets.'
      );
      return;
    }

    const formattedDate =
      formatHandoverDate(handoverDate);

    if (!formattedDate) {
      setAssignmentError(
        'Select a valid handover date.'
      );
      return;
    }

    if (handoverDate > todayInput()) {
      setAssignmentError(
        'Handover date cannot be in the future.'
      );
      return;
    }

    if (
      !CONDITIONS.some(
        item => item.value === issueCondition
      )
    ) {
      setAssignmentError(
        'Select a valid issue condition.'
      );
      return;
    }

    if (
      ['poor', 'damaged'].includes(
        issueCondition
      )
    ) {
      setAssignmentError(
        'Poor or damaged equipment must be inspected and repaired before assignment.'
      );
      return;
    }

    try {
      const result = assignAsset(
        asset.id,
        employee.id,
        issueCondition,
        issueNotes.trim(),
        formattedDate
      );

      if (result === false) {
        setAssignmentError(
          'Unable to assign this asset.'
        );
        return;
      }

      resetAssignmentForm();

    } catch (error) {
      console.error(
        'Asset assignment failed:',
        error
      );

      setAssignmentError(
        'Unable to complete asset assignment.'
      );
    }
  };

  // ==========================================================
  // ACTIVE CUSTODY FILTERS
  // ==========================================================

  const custodyLocations = useMemo(() => {
    return uniqueValues(
      assignedAssets.map(asset => asset.location)
    );
  }, [assignedAssets]);

  const filteredCustodyAssets = useMemo(() => {
    return assignedAssets.filter(asset => {
      const employee = canReadUsers
        ? getAssignedUser(asset, users)
        : null;

      const searchMatches = matchesQuery(
        [
          asset.assetId,
          getAssetTag(asset),
          getAssetName(asset),
          getAssetType(asset),
          asset.assignedName,
          asset.assignedEmployee,
          employee?.name,
          employee?.employeeId,
          asset.location,
          asset.status,
          asset.condition,
        ],
        custodySearch
      );

      const statusMatches =
        custodyStatusFilter === 'All' ||
        normalize(asset.status) ===
          custodyStatusFilter;

      const locationMatches =
        custodyLocationFilter === 'All' ||
        asset.location === custodyLocationFilter;

      return (
        searchMatches &&
        statusMatches &&
        locationMatches
      );
    });
  }, [
    assignedAssets,
    users,
    canReadUsers,
    custodySearch,
    custodyStatusFilter,
    custodyLocationFilter,
  ]);

  const custodyTotalPages = Math.max(
    1,
    Math.ceil(
      filteredCustodyAssets.length /
      custodyPageSize
    )
  );

  const currentCustodyPage = Math.min(
    custodyPage,
    custodyTotalPages
  );

  const paginatedCustodyAssets =
    filteredCustodyAssets.slice(
      (currentCustodyPage - 1) *
        custodyPageSize,

      currentCustodyPage *
        custodyPageSize
    );

  const resetCustodyFilters = () => {
    setCustodySearch('');

    setCustodyStatusFilter(
      activeCategory === 'overdue'
        ? 'overdue return'
        : 'All'
    );

    setCustodyLocationFilter('All');
    setCustodyPage(1);
  };

  // ==========================================================
  // RETURN ASSET HANDLERS
  // ==========================================================

  const openReturnModal = asset => {
    if (
      !canUpdateAssets ||
      !isAssignedAsset(asset)
    ) {
      return;
    }

    setReturningAssetId(asset.id);

    setReturnCondition(
      asset.condition || 'good'
    );

    setReturnNotes('');
    setReturnError('');
  };

  const closeReturnModal = () => {
    setReturningAssetId(null);
    setReturnCondition('good');
    setReturnNotes('');
    setReturnError('');
  };

  const handleReturnAsset = () => {
    if (!canUpdateAssets) return;

    const targetAsset = assets.find(
      asset => asset.id === returningAssetId
    );

    if (
      !targetAsset ||
      !isAssignedAsset(targetAsset)
    ) {
      setReturnError(
        'This asset is no longer in employee custody.'
      );
      return;
    }

    if (
      !CONDITIONS.some(
        item => item.value === returnCondition
      )
    ) {
      setReturnError(
        'Select a valid return condition.'
      );
      return;
    }

    const requiresInspection = [
      'poor',
      'damaged',
    ].includes(returnCondition);

    if (
      requiresInspection &&
      !returnNotes.trim()
    ) {
      setReturnError(
        'Inspection notes are required for poor or damaged equipment.'
      );
      return;
    }

    try {
      const result = returnAsset(
        targetAsset.id,
        returnCondition,
        returnNotes.trim()
      );

      if (result === false) {
        setReturnError(
          'Unable to complete this asset return.'
        );
        return;
      }

      closeReturnModal();

    } catch (error) {
      console.error(
        'Asset return failed:',
        error
      );

      setReturnError(
        'Unable to process the asset return.'
      );
    }
  };

  // ==========================================================
  // CUSTODY HISTORY FILTERS
  // ==========================================================

  const filteredHistory = useMemo(() => {
    return custodyHistory.filter(record => {
      const employee = canReadUsers
        ? users.find(
            user => user.id === record.userId
          )
        : null;

      const searchMatches = matchesQuery(
        [
          record.id,
          record.assetTag,
          record.model,
          record.userName,
          employee?.name,
          employee?.employeeId,
          record.assignedDate,
          record.returnDate,
          record.conditionAtIssue,
          record.conditionAtReturn,
          record.notes,
        ],
        historySearch
      );

      const statusMatches =
        historyStatusFilter === 'All' ||
        (
          historyStatusFilter === 'active'
            ? !record.returnDate
            : Boolean(record.returnDate)
        );

      const conditionMatches =
        historyConditionFilter === 'All' ||
        normalize(record.conditionAtIssue) ===
          historyConditionFilter ||
        normalize(record.conditionAtReturn) ===
          historyConditionFilter;

      return (
        searchMatches &&
        statusMatches &&
        conditionMatches
      );
    });
  }, [
    custodyHistory,
    users,
    canReadUsers,
    historySearch,
    historyStatusFilter,
    historyConditionFilter,
  ]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(
      filteredHistory.length /
      historyPageSize
    )
  );

  const currentHistoryPage = Math.min(
    historyPage,
    historyTotalPages
  );

  const paginatedHistory =
    filteredHistory.slice(
      (currentHistoryPage - 1) *
        historyPageSize,

      currentHistoryPage *
        historyPageSize
    );

  const resetHistoryFilters = () => {
    setHistorySearch('');
    setHistoryStatusFilter('All');
    setHistoryConditionFilter('All');
    setHistoryPage(1);
  };

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const exportCustodyHistory = () => {
    if (!canExport) return;

    const headers = [
      'Record ID',
      'Asset Tag',
      'Device',
      'Employee',
      'Assigned Date',
      'Return Date',
      'Condition at Issue',
      'Condition at Return',
      'Custody Status',
      'Notes',
    ];

    const rows = filteredHistory.map(record => [
      record.id,
      record.assetTag,
      record.model,
      record.userName,
      record.assignedDate,
      record.returnDate || '',
      record.conditionAtIssue,
      record.conditionAtReturn || '',
      record.returnDate
        ? 'Returned'
        : 'Active Custody',
      record.notes,
    ]);

    downloadCSV(
      headers,
      rows,
      `asset-custody-history-${todayInput()}.csv`
    );

    showToast(
      `Exported ${rows.length} custody records.`
    );
  };

  const exportActiveAllocations = () => {
    if (!canExport) return;

    const headers = [
      'Asset ID',
      'Asset Tag',
      'Device',
      'Category',
      'Employee',
      'Location',
      'Assigned Date',
      'Condition',
      'Status',
    ];

    const rows = filteredCustodyAssets.map(asset => {
      const employee = canReadUsers
        ? getAssignedUser(asset, users)
        : null;

      return [
        asset.assetId || asset.id,
        getAssetTag(asset),
        getAssetName(asset),
        getAssetType(asset),
        employee?.name ||
          asset.assignedName ||
          asset.assignedEmployee ||
          '',
        asset.location,
        asset.assignedDate,
        asset.condition,
        asset.status,
      ];
    });

    downloadCSV(
      headers,
      rows,
      `active-asset-allocations-${todayInput()}.csv`
    );

    showToast(
      `Exported ${rows.length} allocation records.`
    );
  };

  // ==========================================================
  // RESTRICTED PAGE
  // ==========================================================

  if (!canReadAssets) {
    return (
      <Card title="Asset Allocation Restricted">

        <div className="flex flex-col items-center gap-3 py-8 text-center">

          <IconShield className="w-8 h-8 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have Assets: read permission.
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
      id="widget-allocate"
      data-w="allocate"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>

          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">

            <IconShare className="w-6 h-6 text-sky-400" />

            Asset Allocation

          </h2>

          <p className="text-[13px] text-muted mt-1">
            Assign and return assets, track employee custody, and maintain device condition records.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {activeCategory !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                selectCategory(activeCategory)
              }
            >
              View All
            </Button>
          )}

          <Button
            variant="secondary"
            icon={IconLaptop}
            onClick={() =>
              navigate('inventory')
            }
          >
            Asset Inventory
          </Button>

        </div>

      </div>

      {/* =====================================================
          DYNAMIC ALLOCATION KPIs
      ====================================================== */}

      <CategoryCardsBar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
      />

      {/* EQUIPMENT INSPECTION NOTICE */}

      {inspectionRequiredAssets.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-warn/30 bg-surface2/40">

          <div className="flex items-start gap-2.5">

            <IconAlertTriangle className="w-5 h-5 text-warn shrink-0" />

            <div>

              <h3 className="text-[13px] font-semibold text-ink">

                {inspectionRequiredAssets.length}
                {' '}asset(s) require inspection

              </h3>

              <p className="text-[12px] text-muted mt-0.5">
                Poor or damaged equipment is excluded from available allocations until its condition is updated.
              </p>

            </div>

          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate('inventory')
            }
          >
            Review Inventory
          </Button>

        </div>
      )}

      {/* =====================================================
          ASSIGNMENT AND RETURNS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap)] w-full">

        {/* ===================================================
            ASSIGN HARDWARE ASSET
        ==================================================== */}

        {showAssign && (
          <Card
            title="Assign Hardware Asset"
            subText="Allocate available equipment to an active employee."
            className={
              showReturns
                ? 'col-span-1'
                : 'col-span-full'
            }
          >

            {!canAssignAssets ? (
              <div className="p-3 rounded-lg border border-line bg-surface2/40">

                <p className="text-[13px] text-muted">
                  Assignment requires Assets: update and User Profiles: read permission.
                </p>

              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={handleAssignAsset}
              >

                {/* ASSET SEARCH */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                  <SearchField
                    value={assetSearch}
                    onChange={value => {
                      setAssetSearch(value);
                      setSelectedAssetId('');
                    }}
                    placeholder="Find available asset..."
                    ariaLabel="Search available equipment"
                  />

                  <select
                    value={assetCategoryFilter}
                    onChange={event => {
                      setAssetCategoryFilter(
                        event.target.value
                      );

                      setSelectedAssetId('');
                    }}
                    aria-label="Filter available asset category"
                    className={FILTER_CLASS}
                  >

                    <option value="All">
                      All Categories
                    </option>

                    {assetCategoryOptions.map(category => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}

                  </select>

                </div>

                {/* AVAILABLE DEVICE */}

                <div className="flex flex-col gap-1.5">

                  <label
                    htmlFor="assign-device-select"
                    className={`${LABEL_CLASS} flex items-center justify-between gap-2`}
                  >

                    <span className="flex items-center gap-1.5">

                      <IconLaptop className="w-4 h-4 text-accent" />

                      Select Available Device *

                    </span>

                    <span className="text-[11px] text-good font-semibold">

                      {filteredAvailableAssets.length}
                      {' '}Available

                    </span>

                  </label>

                  <select
                    id="assign-device-select"
                    value={selectedAssetId}
                    required
                    disabled={
                      !filteredAvailableAssets.length
                    }
                    onChange={event =>
                      handleAssetSelection(
                        event.target.value
                      )
                    }
                    className={INPUT_CLASS}
                  >

                    <option value="">
                      -- Choose available device --
                    </option>

                    {filteredAvailableAssets.map(asset => (
                      <option
                        key={asset.id}
                        value={asset.id}
                      >

                        {getAssetTag(asset)}
                        {' · '}
                        {getAssetName(asset)}
                        {' ('}
                        {asset.location || 'Office'}
                        {')'}

                      </option>
                    ))}

                  </select>

                  {!filteredAvailableAssets.length && (
                    <p className="text-[11px] text-muted">
                      No available devices match the selected filters.
                    </p>
                  )}

                </div>

                {/* SELECTED ASSET PREVIEW */}

                {selectedAsset && (
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-accent/30 bg-surface2/40">

                    <DetailField
                      label="Asset ID"
                      value={
                        selectedAsset.assetId ||
                        selectedAsset.id
                      }
                    />

                    <DetailField
                      label="Category"
                      value={getAssetType(selectedAsset)}
                    />

                    <DetailField
                      label="Serial Number"
                      value={
                        selectedAsset.serial ||
                        selectedAsset.serialNumber ||
                        '—'
                      }
                    />

                    <DetailField
                      label="Current Condition"
                      value={
                        <Tag>
                          {selectedAsset.condition || 'Unknown'}
                        </Tag>
                      }
                    />

                  </div>
                )}

                {/* EMPLOYEE SELECTION */}

                <div className="flex flex-col gap-1.5">

                  <label
                    htmlFor="assign-employee-select"
                    className={`${LABEL_CLASS} flex items-center gap-1.5`}
                  >

                    <IconUsers className="w-4 h-4 text-sky-400" />

                    Assign to Employee *

                  </label>

                  <select
                    id="assign-employee-select"
                    value={selectedUserId}
                    required
                    onChange={event => {
                      setSelectedUserId(
                        event.target.value
                      );

                      setAssignmentError('');
                    }}
                    className={INPUT_CLASS}
                  >

                    <option value="">
                      -- Choose active employee --
                    </option>

                    {eligibleEmployees.map(user => (
                      <option
                        key={user.id}
                        value={user.id}
                      >

                        {user.name}
                        {' · '}
                        {user.department}
                        {' ('}
                        {user.employeeId || user.id}
                        {')'}

                      </option>
                    ))}

                  </select>

                </div>

                {/* EMPLOYEE PREVIEW */}

                {selectedEmployee && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface2/40 border border-line">

                    <Avatar
                      name={selectedEmployee.name}
                      src={selectedEmployee.avatarUrl}
                      size={36}
                    />

                    <div className="flex flex-col flex-1 min-w-0">

                      <span className="text-[13px] font-semibold text-ink truncate">
                        {selectedEmployee.name}
                      </span>

                      <span className="text-[11px] text-muted">
                        {selectedEmployee.employeeId}
                        {' · '}
                        {selectedEmployee.department}
                      </span>

                    </div>

                    <StatusPill
                      status={selectedEmployee.status}
                    />

                  </div>
                )}

                {/* HANDOVER DATE AND CONDITION */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div className="flex flex-col gap-1.5">

                    <label
                      htmlFor="handover-date-input"
                      className={`${LABEL_CLASS} flex items-center gap-1.5`}
                    >

                      <IconClock className="w-4 h-4 text-accent" />

                      Handover Date *

                    </label>

                    <input
                      id="handover-date-input"
                      data-testid="handover-date-input"
                      type="date"
                      required
                      max={todayInput()}
                      value={handoverDate}
                      onChange={event => {
                        setHandoverDate(
                          event.target.value
                        );

                        setAssignmentError('');
                      }}
                      className={INPUT_CLASS}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setHandoverDate(todayInput())
                      }
                      className="self-end text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                    >
                      Set Today
                    </button>

                  </div>

                  <div className="flex flex-col gap-1.5">

                    <label
                      htmlFor="issue-condition-select"
                      className={`${LABEL_CLASS} flex items-center gap-1.5`}
                    >

                      <IconCheck className="w-4 h-4 text-good" />

                      Condition at Issue *

                    </label>

                    <ConditionSelect
                      id="issue-condition-select"
                      value={issueCondition}
                      onChange={value => {
                        setIssueCondition(value);
                        setAssignmentError('');
                      }}
                    />

                  </div>

                </div>

                {/* ISSUE NOTES */}

                <div className="flex flex-col gap-1.5">

                  <label
                    htmlFor="issue-notes-textarea"
                    className={`${LABEL_CLASS} flex items-center justify-between`}
                  >

                    <span>
                      Handover Notes / Accessories
                    </span>

                    <span className="font-normal text-[10.5px]">
                      Optional
                    </span>

                  </label>

                  <textarea
                    id="issue-notes-textarea"
                    rows={3}
                    maxLength={500}
                    value={issueNotes}
                    onChange={event =>
                      setIssueNotes(event.target.value)
                    }
                    placeholder="e.g. Issued with original charger, laptop bag and mouse."
                    className={`${INPUT_CLASS} resize-none`}
                  />

                  <span className="text-right text-[10.5px] text-muted">
                    {issueNotes.length}/500
                  </span>

                </div>

                {/* VALIDATION ERROR */}

                {assignmentError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg border border-bad/30 bg-bad/10 text-bad text-[12px]"
                  >
                    {assignmentError}
                  </div>
                )}

                {/* FORM ACTIONS */}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetAssignmentForm}
                  >
                    Reset
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    icon={IconShare}
                    disabled={
                      !availableAssets.length ||
                      !eligibleEmployees.length ||
                      !selectedAssetId ||
                      !selectedUserId
                    }
                    ariaLabel="Assign and record asset handover"
                    className="flex-1"
                  >
                    Assign & Handover Asset
                  </Button>

                </div>

              </form>
            )}

          </Card>
        )}

        {/* ===================================================
            ACTIVE EQUIPMENT CUSTODY AND RETURNS
        ==================================================== */}

        {showReturns && (
          <Card
            title={
              activeCategory === 'overdue'
                ? `Overdue Returns (${overdueAssets.length})`
                : `Assigned Assets & Returns (${assignedAssets.length})`
            }
            subText="Manage current asset holders and process return inspections."
            className={
              showAssign
                ? 'col-span-1'
                : 'col-span-full'
            }
            action={
              canExport ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={IconDownload}
                  disabled={!filteredCustodyAssets.length}
                  onClick={exportActiveAllocations}
                  className="!text-[11px]"
                >
                  Export
                </Button>
              ) : null
            }
          >

            {/* SEARCH AND FILTERS */}

            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-line/60">

              <SearchField
                value={custodySearch}
                onChange={value => {
                  setCustodySearch(value);
                  setCustodyPage(1);
                }}
                placeholder="Search asset or employee..."
                ariaLabel="Search assigned assets"
              />

              <select
                value={custodyStatusFilter}
                disabled={activeCategory === 'overdue'}
                onChange={event => {
                  setCustodyStatusFilter(
                    event.target.value
                  );

                  setCustodyPage(1);
                }}
                aria-label="Filter custody status"
                className={FILTER_CLASS}
              >

                <option value="All">
                  All Statuses
                </option>

                <option value="assigned">
                  Assigned
                </option>

                <option value="overdue return">
                  Overdue Return
                </option>

              </select>

              <select
                value={custodyLocationFilter}
                onChange={event => {
                  setCustodyLocationFilter(
                    event.target.value
                  );

                  setCustodyPage(1);
                }}
                aria-label="Filter assigned asset location"
                className={FILTER_CLASS}
              >

                <option value="All">
                  All Locations
                </option>

                {custodyLocations.map(location => (
                  <option
                    key={location}
                    value={location}
                  >
                    {location}
                  </option>
                ))}

              </select>

              <Button
                variant="secondary"
                size="sm"
                icon={IconX}
                onClick={resetCustodyFilters}
                className="!text-[11px]"
              >
                Reset
              </Button>

            </div>

            {/* ASSIGNED ASSET LIST */}

            {!filteredCustodyAssets.length ? (
              <EmptyState
                icon={IconLaptop}
                message="No assigned assets match the selected filters."
                actionLabel="Reset Filters"
                onAction={resetCustodyFilters}
              />
            ) : (
              <div className="flex flex-col divide-y divide-dashed divide-line">

                {paginatedCustodyAssets.map(asset => {
                  const employee = canReadUsers
                    ? getAssignedUser(asset, users)
                    : null;

                  const holder =
                    employee?.name ||
                    asset.assignedName ||
                    asset.assignedEmployee ||
                    'Holder not recorded';

                  const overdue =
                    normalize(asset.status) ===
                    'overdue return';

                  return (
                    <div
                      key={asset.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-surface2/30 transition-colors rounded-lg px-1"
                    >

                      <div className="flex items-start gap-2.5 flex-1 min-w-0">

                        <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center text-accent shrink-0">

                          <IconLaptop className="w-4 h-4" />

                        </div>

                        <div className="flex flex-col gap-1 min-w-0">

                          <div className="flex flex-wrap items-center gap-1.5">

                            <span className="font-data text-[12px] font-bold text-accent">

                              {getAssetTag(asset)}

                            </span>

                            {overdue && (
                              <span className="px-2 py-0.5 rounded-full bg-warn/15 border border-warn/30 text-warn text-[10px] font-semibold">

                                Overdue Return

                              </span>
                            )}

                          </div>

                          <span
                            title={getAssetName(asset)}
                            className="text-[13px] font-semibold text-ink truncate"
                          >

                            {getAssetName(asset)}

                          </span>

                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted">

                            <span>
                              Holder:
                            </span>

                            <span className="font-medium text-ink">
                              {holder}
                            </span>

                            {employee?.employeeId && (
                              <span>
                                ({employee.employeeId})
                              </span>
                            )}

                          </div>

                          <span className="text-[11px] text-muted">

                            {asset.location || '—'}

                            {' · Issued: '}

                            {asset.assignedDate || 'Not recorded'}

                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">

                            <Tag>
                              {asset.condition || 'Unknown'}
                            </Tag>

                            <StatusPill
                              status={asset.status}
                            />

                          </div>

                        </div>

                      </div>

                      {canUpdateAssets && (
                        <Button
                          variant="secondary"
                          size="sm"
                          ariaLabel={`Return ${getAssetTag(asset)}`}
                          onClick={() =>
                            openReturnModal(asset)
                          }
                          className="!text-[11px] shrink-0"
                        >
                          Return
                        </Button>
                      )}

                    </div>
                  );
                })}

              </div>
            )}

            <Pagination
              page={currentCustodyPage}
              pageSize={custodyPageSize}
              total={filteredCustodyAssets.length}
              onPageChange={setCustodyPage}
              onPageSizeChange={value => {
                setCustodyPageSize(value);
                setCustodyPage(1);
              }}
            />

          </Card>
        )}

      </div>

      {/* =====================================================
          ASSET CUSTODY HISTORY
      ====================================================== */}

      {showHistory && (
        <Card
          title="Asset Custody History"
          subText="Track recorded equipment handovers, returns, employee ownership and device condition."
          action={
            canExport ? (
              <Button
                variant="secondary"
                icon={IconDownload}
                disabled={!filteredHistory.length}
                onClick={exportCustodyHistory}
              >
                Export CSV
              </Button>
            ) : null
          }
        >

          {/* HISTORY SUMMARY */}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

            <button
              type="button"
              aria-pressed={historyStatusFilter === 'All'}
              onClick={() => {
                setHistoryStatusFilter('All');
                setHistoryPage(1);
              }}
              className={`flex flex-col gap-1.5 p-3.5 rounded-xl border text-left bg-surface2/40 hover:bg-surface2 cursor-pointer ${
                historyStatusFilter === 'All'
                  ? 'border-accent'
                  : 'border-line'
              }`}
            >

              <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                Total Records
              </span>

              <span className="font-display font-bold text-[24px] text-accent tabular-nums">
                {custodyHistory.length}
              </span>

            </button>

            <button
              type="button"
              aria-pressed={historyStatusFilter === 'active'}
              onClick={() => {
                setHistoryStatusFilter('active');
                setHistoryPage(1);
              }}
              className={`flex flex-col gap-1.5 p-3.5 rounded-xl border text-left bg-surface2/40 hover:bg-surface2 cursor-pointer ${
                historyStatusFilter === 'active'
                  ? 'border-warn'
                  : 'border-line'
              }`}
            >

              <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                Active Custody Records
              </span>

              <span className="font-display font-bold text-[24px] text-warn tabular-nums">
                {activeCustodyRecords.length}
              </span>

            </button>

            <button
              type="button"
              aria-pressed={historyStatusFilter === 'returned'}
              onClick={() => {
                setHistoryStatusFilter('returned');
                setHistoryPage(1);
              }}
              className={`flex flex-col gap-1.5 p-3.5 rounded-xl border text-left bg-surface2/40 hover:bg-surface2 cursor-pointer ${
                historyStatusFilter === 'returned'
                  ? 'border-good'
                  : 'border-line'
              }`}
            >

              <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                Completed Returns
              </span>

              <span className="font-display font-bold text-[24px] text-good tabular-nums">
                {returnedRecords.length}
              </span>

            </button>

          </div>

          {/* HISTORY FILTERS */}

          <div className="flex flex-wrap items-center gap-2.5 pt-2">

            <SearchField
              value={historySearch}
              onChange={value => {
                setHistorySearch(value);
                setHistoryPage(1);
              }}
              placeholder="Search asset, employee, record..."
              ariaLabel="Search custody history"
            />

            <select
              value={historyStatusFilter}
              onChange={event => {
                setHistoryStatusFilter(
                  event.target.value
                );

                setHistoryPage(1);
              }}
              aria-label="Filter custody history status"
              className={FILTER_CLASS}
            >

              <option value="All">
                All Records
              </option>

              <option value="active">
                Active Custody
              </option>

              <option value="returned">
                Returned
              </option>

            </select>

            <select
              value={historyConditionFilter}
              onChange={event => {
                setHistoryConditionFilter(
                  event.target.value
                );

                setHistoryPage(1);
              }}
              aria-label="Filter custody history condition"
              className={FILTER_CLASS}
            >

              <option value="All">
                All Conditions
              </option>

              {CONDITIONS.map(condition => (
                <option
                  key={condition.value}
                  value={condition.value}
                >
                  {condition.label}
                </option>
              ))}

            </select>

            <Button
              variant="secondary"
              size="sm"
              icon={IconX}
              onClick={resetHistoryFilters}
            >
              Reset Filters
            </Button>

          </div>

          {/* HISTORY TABLE */}

          {!filteredHistory.length ? (
            <EmptyState
              icon={IconClock}
              message="No custody history records match the selected filters."
              actionLabel="Reset Filters"
              onAction={resetHistoryFilters}
            />
          ) : (
            <div className="overflow-x-auto -mx-1">

              <table className="w-full min-w-[1250px] text-left border-collapse">

                <thead>

                  <tr className="border-b border-line">

                    <th scope="col" className={HEADER_CLASS}>
                      No.
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Asset
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Employee
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Issued Date
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Return Date
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Issue Condition
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Return Condition
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Custody Status
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Notes
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedHistory.map((record, index) => {
                    const returned =
                      Boolean(record.returnDate);

                    const employee = canReadUsers
                      ? users.find(
                          user =>
                            user.id === record.userId
                        )
                      : null;

                    return (
                      <tr
                        key={record.id}
                        className="border-b border-dashed border-line hover:bg-surface2/40 transition-colors"
                      >

                        <td className={`${CELL_CLASS} text-muted font-data`}>

                          {
                            (currentHistoryPage - 1) *
                              historyPageSize +
                            index + 1
                          }

                        </td>

                        <td className={CELL_CLASS}>

                          <div className="flex flex-col gap-1">

                            <span className="font-data font-bold text-accent whitespace-nowrap">
                              {record.assetTag || '—'}
                            </span>

                            <span
                              title={record.model}
                              className="text-[11px] text-muted truncate max-w-[180px]"
                            >
                              {record.model || '—'}
                            </span>

                          </div>

                        </td>

                        <td className={CELL_CLASS}>

                          <div className="flex items-center gap-2">

                            <Avatar
                              name={
                                record.userName ||
                                'Employee'
                              }
                              size={28}
                            />

                            <div className="flex flex-col">

                              <span className="font-semibold text-ink whitespace-nowrap">
                                {record.userName || '—'}
                              </span>

                              {employee?.employeeId && (
                                <span className="text-[11px] text-muted font-data">
                                  {employee.employeeId}
                                </span>
                              )}

                            </div>

                          </div>

                        </td>

                        <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>

                          {record.assignedDate || '—'}

                        </td>

                        <td className={`${CELL_CLASS} whitespace-nowrap`}>

                          <span className={
                            returned
                              ? 'text-good'
                              : 'text-muted'
                          }>
                            {record.returnDate || 'Pending'}
                          </span>

                        </td>

                        <td className={CELL_CLASS}>

                          <Tag>
                            {record.conditionAtIssue || 'Unknown'}
                          </Tag>

                        </td>

                        <td className={CELL_CLASS}>

                          {record.conditionAtReturn ? (
                            <Tag>
                              {record.conditionAtReturn}
                            </Tag>
                          ) : (
                            <span className="text-muted">
                              —
                            </span>
                          )}

                        </td>

                        <td className={CELL_CLASS}>

                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${
                            returned
                              ? 'bg-good/10 text-good border-good/30'
                              : 'bg-warn/10 text-warn border-warn/30'
                          }`}>

                            {returned ? (
                              <IconCheck className="w-3 h-3" />
                            ) : (
                              <IconClock className="w-3 h-3" />
                            )}

                            {returned
                              ? 'Returned'
                              : 'Active Custody'}

                          </span>

                        </td>

                        <td className={CELL_CLASS}>

                          <span
                            title={record.notes}
                            className="block max-w-[200px] truncate text-muted"
                          >
                            {record.notes || '—'}
                          </span>

                        </td>

                        <td className={CELL_CLASS}>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setSelectedCustodyId(
                                record.id
                              )
                            }
                            className="!text-[11px]"
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
            page={currentHistoryPage}
            pageSize={historyPageSize}
            total={filteredHistory.length}
            onPageChange={setHistoryPage}
            onPageSizeChange={value => {
              setHistoryPageSize(value);
              setHistoryPage(1);
            }}
          />

        </Card>
      )}

      {/* =====================================================
          RETURN ASSET MODAL
      ====================================================== */}

      {returningAsset && canUpdateAssets && (
        <Drawer
          isOpen={true}
          isCentered={true}
          width="min(540px, 94vw)"
          maxWidth="min(540px, 94vw)"
          className="!h-auto max-h-[90vh]"
          title={`Return Asset: ${getAssetTag(returningAsset)}`}
          onClose={closeReturnModal}
          footer={
            <div className="flex flex-col gap-3">

              {returnError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg border border-bad/30 bg-bad/10 text-bad text-[12px]"
                >
                  {returnError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">

                <Button
                  variant="secondary"
                  onClick={closeReturnModal}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  icon={IconCheck}
                  onClick={handleReturnAsset}
                >
                  Confirm Return
                </Button>

              </div>

            </div>
          }
        >

          <div className="flex flex-col gap-4">

            {/* RETURNING ASSET DETAILS */}

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface2/40 border border-line">

              <div className="w-11 h-11 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">

                <IconLaptop className="w-5 h-5" />

              </div>

              <div className="flex-1 min-w-0">

                <h3 className="font-semibold text-[14px] text-ink">
                  {getAssetName(returningAsset)}
                </h3>

                <p className="text-[11px] text-muted">
                  {getAssetTag(returningAsset)}
                  {' · '}
                  {getAssetType(returningAsset)}
                </p>

              </div>

              <StatusPill
                status={returningAsset.status}
              />

            </div>

            <div className="grid grid-cols-2 gap-2.5">

              <DetailField
                label="Assigned Employee"
                value={
                  returningEmployee?.name ||
                  returningAsset.assignedName ||
                  returningAsset.assignedEmployee ||
                  'Not recorded'
                }
              />

              <DetailField
                label="Assigned Date"
                value={
                  returningAsset.assignedDate ||
                  'Not recorded'
                }
              />

              <DetailField
                label="Current Condition"
                value={
                  <Tag>
                    {returningAsset.condition || 'Unknown'}
                  </Tag>
                }
              />

              <DetailField
                label="Return Date"
                value={formatHandoverDate(todayInput())}
              />

            </div>

            {!hasOpenCustody(
              returningAsset,
              custodyHistory
            ) && (
              <div className="p-3 rounded-lg border border-warn/30 bg-warn/10 text-[12px] text-warn">

                This asset has an assignment status but no open custody history record. Review its historical records after completing the return.

              </div>
            )}

            {/* RETURN CONDITION */}

            <div className="flex flex-col gap-1.5">

              <label
                htmlFor="return-condition-select"
                className={LABEL_CLASS}
              >
                Condition at Return *
              </label>

              <ConditionSelect
                id="return-condition-select"
                value={returnCondition}
                onChange={value => {
                  setReturnCondition(value);
                  setReturnError('');
                }}
              />

            </div>

            {/* RETURN INSPECTION NOTES */}

            <div className="flex flex-col gap-1.5">

              <label
                htmlFor="return-inspection-notes"
                className={`${LABEL_CLASS} flex items-center justify-between`}
              >

                Return Inspection Notes

                <span className="text-[10.5px] font-normal">

                  {['poor', 'damaged'].includes(
                    returnCondition
                  )
                    ? 'Required'
                    : 'Optional'}

                </span>

              </label>

              <textarea
                id="return-inspection-notes"
                rows={4}
                maxLength={500}
                value={returnNotes}
                onChange={event => {
                  setReturnNotes(event.target.value);
                  setReturnError('');
                }}
                placeholder="e.g. Charger returned, minor scratches on chassis, display inspected."
                className={`${INPUT_CLASS} resize-none`}
              />

              <span className="text-[10.5px] text-muted text-right">
                {returnNotes.length}/500
              </span>

            </div>

            {/* RETURN OUTCOME INFORMATION */}

            {['poor', 'damaged'].includes(returnCondition) ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warn/10 border border-warn/30">

                <IconAlertTriangle className="w-4 h-4 text-warn shrink-0 mt-0.5" />

                <p className="text-[12px] text-warn leading-relaxed">

                  This asset will be returned with its recorded poor or damaged condition. It will be excluded from this page's available allocation list. Review and move it to repair through Asset Management.

                </p>

              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-good/10 border border-good/30">

                <IconCheck className="w-4 h-4 text-good shrink-0 mt-0.5" />

                <p className="text-[12px] text-good leading-relaxed">

                  Confirming the return clears the current employee assignment and records the return condition in the associated custody history.

                </p>

              </div>
            )}

          </div>

        </Drawer>
      )}

      {/* =====================================================
          CUSTODY RECORD DETAILS
      ====================================================== */}

      {selectedCustodyRecord && (
        <RecordDetailsModal
          isOpen={true}
          title={`Custody Record · ${selectedCustodyRecord.assetTag}`}
          onClose={() =>
            setSelectedCustodyId(null)
          }
          record={selectedCustodyRecord}
          fields={[
            {
              label: 'Record ID',
              value: selectedCustodyRecord.id,
            },
            {
              label: 'Asset Tag',
              value: selectedCustodyRecord.assetTag,
            },
            {
              label: 'Device Name',
              value: selectedCustodyRecord.model,
            },
            {
              label: 'Employee',
              value: selectedCustodyRecord.userName,
            },
            {
              label: 'Employee ID',
              value: canReadUsers
                ? users.find(
                    user =>
                      user.id === selectedCustodyRecord.userId
                  )?.employeeId || '—'
                : 'Restricted',
            },
            {
              label: 'Assigned Date',
              value: selectedCustodyRecord.assignedDate,
            },
            {
              label: 'Return Date',
              value:
                selectedCustodyRecord.returnDate ||
                'Return Pending',
            },
            {
              label: 'Condition at Issue',
              value: selectedCustodyRecord.conditionAtIssue,
            },
            {
              label: 'Condition at Return',
              value:
                selectedCustodyRecord.conditionAtReturn ||
                '—',
            },
            {
              label: 'Custody Status',
              value: selectedCustodyRecord.returnDate
                ? 'Returned'
                : 'Active Custody',
            },
            {
              label: 'Inspection / Handover Notes',
              value:
                selectedCustodyRecord.notes ||
                'No remarks recorded',
            },
          ]}
          canExport={canExport}
          exportFilename={`custody-${safeFilename(
            selectedCustodyRecord.id
          )}.json`}
        />
      )}

    </div>
  );
}
