
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
import { SegmentedBar } from '../shared/SegmentedBar';
import { EmptyState } from '../shared/EmptyState';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Drawer } from '../shared/Drawer';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';

import {
  IconSearch,
  IconPlus,
  IconLaptop,
  IconQrCode,
  IconShield,
  IconDownload,
  IconPackage,
  IconClock,
  IconX,
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const ASSET_TYPES = [
  'Laptops',
  'Desktops',
  'Monitors',
  'Phones',
  'Peripherals',
];

const DEFAULT_LOCATIONS = [
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Gurugram',
  'Chennai',
  'Mumbai',
  'Remote',
];

const ASSET_STATUSES = [
  {
    value: 'in stock',
    label: 'In Stock',
    color: 'var(--good)',
    textColor: 'text-good',
  },
  {
    value: 'assigned',
    label: 'Assigned',
    color: 'var(--info)',
    textColor: 'text-info',
  },
  {
    value: 'in repair',
    label: 'In Repair',
    color: 'var(--warn)',
    textColor: 'text-warn',
  },
  {
    value: 'overdue return',
    label: 'Overdue Return',
    color: 'var(--warn)',
    textColor: 'text-warn',
  },
  {
    value: 'retired',
    label: 'Retired',
    color: 'var(--bad)',
    textColor: 'text-bad',
  },
];

const CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
];

const WARRANTY_OPTIONS = [
  { value: 'active', label: 'Active Warranty' },
  { value: 'expiring', label: 'Expiring Within 30 Days' },
  { value: 'expired', label: 'Expired Warranty' },
  { value: 'none', label: 'No Recorded Warranty' },
];

const WARRANTY_STYLES = {
  active: {
    label: 'Active',
    className: 'bg-good/10 text-good border-good/30',
  },
  expiring: {
    label: 'Expiring Soon',
    className: 'bg-warn/10 text-warn border-warn/30',
  },
  expired: {
    label: 'Expired',
    className: 'bg-bad/10 text-bad border-bad/30',
  },
  none: {
    label: 'No Warranty',
    className: 'bg-surface2 text-muted border-line',
  },
};

const TAG_PREFIXES = {
  Laptops: 'LT',
  Desktops: 'DT',
  Monitors: 'MN',
  Phones: 'PH',
  Peripherals: 'PR',
  Servers: 'SV',
};

const PAGE_SIZES = [5, 10, 20, 50];

const INPUT_CLASS =
  'w-full px-3 py-2 text-[13px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

const FILTER_CLASS =
  'px-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const CELL_CLASS =
  'px-3 py-3 text-[12.5px] align-middle';

const HEADER_CLASS =
  'px-3 py-3 text-[11px] uppercase tracking-wider font-bold text-muted whitespace-nowrap';

// ============================================================
// UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
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

function getAssetType(asset) {
  return asset?.type ||
    asset?.category ||
    'Other';
}

function getAssetName(asset) {
  return asset?.model ||
    asset?.name ||
    'Unnamed Asset';
}

function getAssetSerial(asset) {
  return asset?.serial ||
    asset?.serialNumber ||
    '';
}

function getAssetTag(asset) {
  return asset?.assetTag ||
    asset?.tag ||
    '';
}

function getAssetCost(asset) {
  const value = Number(
    asset?.cost ??
    asset?.purchaseCost ??
    0
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDateInput(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseAssetDate(value) {
  if (!value) return null;

  const text = String(value).trim();

  const isoMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const monthNames = [
    'jan', 'feb', 'mar', 'apr',
    'may', 'jun', 'jul', 'aug',
    'sep', 'oct', 'nov', 'dec',
  ];

  const displayMatch =
    /^(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})$/i
      .exec(text);

  if (displayMatch) {
    const day = Number(displayMatch[1]);

    const month = monthNames.indexOf(
      displayMatch[2]
        .slice(0, 3)
        .toLowerCase()
    );

    const year = Number(displayMatch[3]);

    if (month < 0) return null;

    const date = new Date(
      year,
      month,
      day
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  return null;
}

function toDateInput(value) {
  const date = parseAssetDate(value);

  return date
    ? formatDateInput(date)
    : '';
}

function toDisplayDate(value) {
  const date = parseAssetDate(value);

  return date
    ? date.toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    : '';
}

function getDateOnlyNumber(date) {
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function getWarrantyDays(asset) {
  const expiry = parseAssetDate(
    asset?.warrantyEnd
  );

  if (!expiry) return null;

  return Math.round(
    (
      getDateOnlyNumber(expiry) -
      getDateOnlyNumber(new Date())
    ) / 86400000
  );
}

function getWarrantyStatus(asset) {
  const days = getWarrantyDays(asset);

  if (days === null) return 'none';

  if (days < 0) return 'expired';

  if (days <= 30) return 'expiring';

  return 'active';
}

function getWarrantyDescription(asset) {
  const days = getWarrantyDays(asset);

  if (days === null) {
    return 'No warranty expiry recorded';
  }

  if (days < 0) {
    return `${Math.abs(days)} day(s) overdue`;
  }

  if (days === 0) {
    return 'Expires today';
  }

  return `${days} day(s) remaining`;
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

function hasAssetCustody(asset, history = []) {
  if (!asset) return false;

  const tag = getAssetTag(asset);

  return (
    ['assigned', 'overdue return'].includes(
      normalize(asset.status)
    ) ||
    Boolean(
      asset.assignedTo ||
      asset.assignedToId ||
      asset.assignedEmployeeId ||
      asset.assignedName ||
      asset.assignedEmployee
    ) ||
    history.some(record =>
      (
        record.assetId === asset.id ||
        (
          tag &&
          record.assetTag === tag
        )
      ) &&
      !record.returnDate
    )
  );
}

function generateAssetTag(type, assets) {
  const prefix =
    TAG_PREFIXES[type] || 'AST';

  const existing = new Set(
    assets.map(asset =>
      normalize(getAssetTag(asset))
    )
  );

  let sequence = 101;

  let tag = `${prefix}-${String(sequence).padStart(4, '0')}`;

  while (existing.has(normalize(tag))) {
    sequence += 1;

    tag = `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  return tag;
}

function createNewAssetDraft(type = 'Laptops') {
  return {
    assetTag: '',
    type,
    model: '',
    serial: '',
    cost: '',
    location: 'Bengaluru',
    purchaseDate: formatDateInput(new Date()),
    warrantyEnd: '',
    condition: 'good',
    status: 'in stock',
    assignedTo: '',
  };
}

function createEditDraft(asset) {
  return {
    assetTag: getAssetTag(asset),
    model: getAssetName(asset),
    type: getAssetType(asset),
    serial: getAssetSerial(asset),
    purchaseDate: toDateInput(asset.purchaseDate),
    warrantyEnd: toDateInput(asset.warrantyEnd),
    cost: String(getAssetCost(asset)),
    location: asset.location || '',
    condition: asset.condition || 'good',
    status: asset.status || 'in stock',
    assignedTo: '',
  };
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
  return String(value || 'asset')
    .replace(/[^a-zA-Z0-9_-]/g, '-');
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function WarrantyBadge({ asset }) {
  const status = getWarrantyStatus(asset);

  const config = WARRANTY_STYLES[status];

  return (
    <span
      title={getWarrantyDescription(asset)}
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  color = 'text-accent',
  selected = false,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-col gap-2 min-w-0 p-3 rounded-xl border text-left bg-surface2/40 hover:bg-surface2 transition-all cursor-pointer ${
        selected
          ? 'border-accent ring-2 ring-accent/25'
          : 'border-line'
      }`}
    >
      <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
        {label}
      </span>

      <span className={`font-display font-bold text-[24px] tabular-nums ${color}`}>
        {value}
      </span>

      <span className="text-[11px] text-muted">
        {description}
      </span>
    </button>
  );
}

function FormField({
  label,
  value,
  onChange,
  options,
  type = 'text',
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  min,
  max,
  step,
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">

      <span className="text-[11px] uppercase font-semibold text-muted">
        {label}

        {required && (
          <span className="text-accent ml-1">
            *
          </span>
        )}
      </span>

      {options ? (
        <select
          value={value ?? ''}
          required={required}
          disabled={disabled}
          onChange={event =>
            onChange?.(event.target.value)
          }
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
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          onChange={event =>
            onChange?.(event.target.value)
          }
          className={`${INPUT_CLASS} ${
            readOnly
              ? 'opacity-70 cursor-default'
              : ''
          }`}
        />
      )}

    </label>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1 min-w-0">

      <span className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </span>

      <div className="font-semibold text-[13px] text-ink break-words">
        {value ?? '—'}
      </div>

    </div>
  );
}

function AssetPagination({
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

  const start = total
    ? (currentPage - 1) * pageSize + 1
    : 0;

  const end = Math.min(
    currentPage * pageSize,
    total
  );

  const firstPage = Math.max(
    1,
    Math.min(
      currentPage - 2,
      totalPages - 4
    )
  );

  const lastPage = Math.min(
    totalPages,
    firstPage + 4
  );

  const pages = Array.from(
    {
      length: lastPage - firstPage + 1,
    },
    (_, index) => firstPage + index
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">

      <div className="flex flex-wrap items-center gap-3">

        <span className="text-[12px] text-muted">

          Showing{' '}

          <strong className="text-ink">
            {start}–{end}
          </strong>

          {' '}of{' '}

          <strong className="text-ink">
            {total}
          </strong>

          {' '}assets

        </span>

        <label className="flex items-center gap-2 text-[11.5px] text-muted">

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
          onClick={() => onPageChange(1)}
          className="!text-[12px] !px-2.5 !py-1.5"
        >
          First
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
          className="!text-[12px] !px-2.5 !py-1.5"
        >
          Previous
        </Button>

        {pages.map(number => (
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
          className="!text-[12px] !px-2.5 !py-1.5"
        >
          Next
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() =>
            onPageChange(totalPages)
          }
          className="!text-[12px] !px-2.5 !py-1.5"
        >
          Last
        </Button>

      </div>

    </div>
  );
}

// ============================================================
// ASSET MANAGEMENT PAGE
// ============================================================

export function AssetManagementPage() {
  const {
    assets = [],
    users = [],
    custodyHistory = [],

    setAssetStatus,
    updateAsset,
    addAsset,
    assignAsset,

    navigate,

    hasPermission,
    showToast,
  } = useStore();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canReadAssets =
    hasPermission('Assets', 'read');

  const canCreateAssets =
    hasPermission('Assets', 'write');

  const canUpdateAssets =
    hasPermission('Assets', 'update');

  const canDeleteAssets =
    hasPermission('Assets', 'delete');

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canAssignAssets =
    canUpdateAssets &&
    canReadUsers;

  const canExport =
    canReadAssets &&
    hasPermission('Reports', 'read');

  // ==========================================================
  // PAGE STATE
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState('All');

  const [search, setSearch] =
    useState('');

  const [locationFilter, setLocationFilter] =
    useState('All');

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [conditionFilter, setConditionFilter] =
    useState('All');

  const [warrantyFilter, setWarrantyFilter] =
    useState('All');

  const [sortField, setSortField] =
    useState('assetId');

  const [sortAsc, setSortAsc] =
    useState(true);

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [formMode, setFormMode] =
    useState(null);

  const [editingAssetId, setEditingAssetId] =
    useState(null);

  const [assetDraft, setAssetDraft] =
    useState(createNewAssetDraft);

  const [formError, setFormError] =
    useState('');

  const [selectedAssetId, setSelectedAssetId] =
    useState(null);

  const [confirmation, setConfirmation] =
    useState(null);

  const pendingAssignmentRef =
    useRef(null);

  const savingRef =
    useRef(false);

  const selectedAsset =
    assets.find(
      asset => asset.id === selectedAssetId
    ) || null;

  const editingAsset =
    assets.find(
      asset => asset.id === editingAssetId
    ) || null;

  const selectedAssignee =
    getAssignedUser(selectedAsset, users);

  // ==========================================================
  // DYNAMIC CATEGORY OPTIONS
  // ==========================================================

  const categoryOptions = useMemo(() => {
    return [
      ...new Set([
        ...ASSET_TYPES,
        ...assets.map(getAssetType),
      ]),
    ];
  }, [assets]);

  const locationOptions = useMemo(() => {
    return uniqueValues([
      ...DEFAULT_LOCATIONS,
      ...assets.map(asset => asset.location),
    ]);
  }, [assets]);

  const filterLocations = useMemo(() => {
    return uniqueValues(
      assets.map(asset => asset.location)
    );
  }, [assets]);

  const conditionOptions = useMemo(() => {
    return [
      ...new Set([
        ...CONDITIONS.map(item => item.value),
        ...assets.map(asset => asset.condition)
          .filter(Boolean),
      ]),
    ].map(value => ({
      value,
      label:
        value.charAt(0).toUpperCase() +
        value.slice(1),
    }));
  }, [assets]);

  const activeEmployees = useMemo(() => {
    return users
      .filter(user =>
        normalize(user.status) === 'active'
      )
      .sort((a, b) =>
        String(a.name || '').localeCompare(
          String(b.name || '')
        )
      );
  }, [users]);

  // ==========================================================
  // DYNAMIC KPIs
  // ==========================================================

  const summary = useMemo(() => {
    const result = {
      total: assets.length,
      assigned: 0,
      'in stock': 0,
      'in repair': 0,
      'overdue return': 0,
      retired: 0,
      totalCost: 0,
      warrantyActive: 0,
      warrantyExpiring: 0,
      warrantyExpired: 0,
      warrantyNone: 0,
    };

    assets.forEach(asset => {
      const status = normalize(asset.status);

      if (ASSET_STATUSES.some(
        item => item.value === status
      )) {
        result[status] += 1;
      }

      result.totalCost += getAssetCost(asset);

      const warranty = getWarrantyStatus(asset);

      if (warranty === 'active') {
        result.warrantyActive += 1;
      } else if (warranty === 'expiring') {
        result.warrantyExpiring += 1;
      } else if (warranty === 'expired') {
        result.warrantyExpired += 1;
      } else {
        result.warrantyNone += 1;
      }
    });

    return result;
  }, [assets]);

  const statusCounts = useMemo(() => {
    const counts = ASSET_STATUSES.map(item => ({
      key: item.value,
      label: item.label,

      count: assets.filter(asset =>
        normalize(asset.status) === item.value
      ).length,

      color: item.color,
    }));

    const otherCount =
      assets.length -
      counts.reduce(
        (total, item) => total + item.count,
        0
      );

    if (otherCount > 0) {
      counts.push({
        key: 'other',
        label: 'Other',
        count: otherCount,
        color: 'var(--line)',
      });
    }

    return counts;
  }, [assets]);

  const categories = useMemo(() => {
    return [
      {
        id: 'All',
        label: 'Total Inventory',
        icon: IconQrCode,
        metric: String(assets.length),
        metricLabel: 'Assets',
        subText:
          `${summary['in stock']} available for allocation`,
        badge: 'All Assets',
        badgeColor: 'sky',
      },

      ...categoryOptions.map(type => {
        const categoryAssets = assets.filter(
          asset => getAssetType(asset) === type
        );

        const assigned = categoryAssets.filter(
          asset =>
            normalize(asset.status) === 'assigned'
        ).length;

        const available = categoryAssets.filter(
          asset =>
            normalize(asset.status) === 'in stock'
        ).length;

        return {
          id: type,
          label: type,

          icon: [
            'Laptops',
            'Desktops',
            'Monitors',
          ].includes(type)
            ? IconLaptop
            : IconPackage,

          metric: String(categoryAssets.length),

          metricLabel: 'Units',

          subText: `${available} available`,

          badge: `${assigned} Assigned`,

          badgeColor: 'emerald',
        };
      }),
    ];
  }, [
    assets,
    categoryOptions,
    summary,
  ]);

  // ==========================================================
  // FILTERING AND SORTING
  // ==========================================================

  const filteredAssets = useMemo(() => {
    const words = normalize(search)
      .split(/\s+/)
      .filter(Boolean);

    return assets
      .filter(asset => {
        const assignedUser =
          canReadUsers
            ? getAssignedUser(asset, users)
            : null;

        const searchText = [
          asset.id,
          asset.assetId,
          getAssetTag(asset),
          getAssetName(asset),
          getAssetType(asset),
          getAssetSerial(asset),
          asset.assignedName,
          asset.assignedEmployee,
          assignedUser?.employeeId,
          assignedUser?.name,
          asset.location,
          asset.condition,
          asset.status,
          asset.purchaseDate,
          asset.warrantyEnd,
        ]
          .map(normalize)
          .join(' ');

        const matchSearch =
          words.every(word =>
            searchText.includes(word)
          );

        const matchType =
          activeTab === 'All' ||
          getAssetType(asset) === activeTab;

        const matchLocation =
          locationFilter === 'All' ||
          asset.location === locationFilter;

        const matchStatus =
          statusFilter === 'All' ||
          normalize(asset.status) === statusFilter;

        const matchCondition =
          conditionFilter === 'All' ||
          normalize(asset.condition) === conditionFilter;

        const matchWarranty =
          warrantyFilter === 'All' ||
          getWarrantyStatus(asset) === warrantyFilter;

        return (
          matchSearch &&
          matchType &&
          matchLocation &&
          matchStatus &&
          matchCondition &&
          matchWarranty
        );
      })
      .sort((a, b) => {
        let result = 0;

        if (sortField === 'cost') {
          result =
            getAssetCost(a) -
            getAssetCost(b);
        } else if (
          ['purchaseDate', 'warrantyEnd']
            .includes(sortField)
        ) {
          const dateA =
            parseAssetDate(a[sortField]);

          const dateB =
            parseAssetDate(b[sortField]);

          result =
            (dateA?.getTime() || 0) -
            (dateB?.getTime() || 0);
        } else {
          let valueA;
          let valueB;

          switch (sortField) {
            case 'model':
              valueA = getAssetName(a);
              valueB = getAssetName(b);
              break;

            case 'type':
              valueA = getAssetType(a);
              valueB = getAssetType(b);
              break;

            case 'assetId':
              valueA =
                a.assetId ||
                getAssetTag(a);

              valueB =
                b.assetId ||
                getAssetTag(b);
              break;

            default:
              valueA = a[sortField];
              valueB = b[sortField];
          }

          result = String(valueA || '')
            .localeCompare(
              String(valueB || ''),
              undefined,
              {
                numeric: true,
                sensitivity: 'base',
              }
            );
        }

        return sortAsc
          ? result
          : -result;
      });
  }, [
    assets,
    users,
    canReadUsers,
    search,
    activeTab,
    locationFilter,
    statusFilter,
    conditionFilter,
    warrantyFilter,
    sortField,
    sortAsc,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAssets.length / pageSize
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    activeTab,
    locationFilter,
    statusFilter,
    conditionFilter,
    warrantyFilter,
    pageSize,
  ]);

  useEffect(() => {
    setPage(previous =>
      Math.min(previous, totalPages)
    );
  }, [totalPages]);

  // ==========================================================
  // FILTER ACTIONS
  // ==========================================================

  const resetFilters = () => {
    setSearch('');
    setActiveTab('All');
    setLocationFilter('All');
    setStatusFilter('All');
    setConditionFilter('All');
    setWarrantyFilter('All');
    setSortField('assetId');
    setSortAsc(true);
    setPage(1);
  };

  const filterByStatus = status => {
    const next =
      statusFilter === status
        ? 'All'
        : status;

    resetFilters();
    setStatusFilter(next);
  };

  const filterByWarranty = status => {
    const next =
      warrantyFilter === status
        ? 'All'
        : status;

    resetFilters();
    setWarrantyFilter(next);
  };

  const handleCategorySelect = category => {
    setActiveTab(previous =>
      previous === category
        ? 'All'
        : category
    );

    setPage(1);
  };

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
  // ADD AND EDIT ASSET FORMS
  // ==========================================================

  const openAddAsset = () => {
    if (!canCreateAssets) return;

    savingRef.current = false;

    setAssetDraft(
      createNewAssetDraft(
        activeTab === 'All'
          ? 'Laptops'
          : activeTab
      )
    );

    setEditingAssetId(null);
    setFormError('');
    setFormMode('add');
  };

  const openEditAsset = asset => {
    if (!canUpdateAssets || !asset) return;

    savingRef.current = false;

    setEditingAssetId(asset.id);

    setAssetDraft(
      createEditDraft(asset)
    );

    setFormError('');
    setFormMode('edit');
  };

  const closeAssetForm = () => {
    savingRef.current = false;

    setFormMode(null);
    setEditingAssetId(null);
    setFormError('');
  };

  const updateDraft = (field, value) => {
    setAssetDraft(previous => ({
      ...previous,
      [field]: value,

      ...(
        field === 'status' &&
        value !== 'in stock'
          ? { assignedTo: '' }
          : {}
      ),

      ...(
        field === 'assignedTo' &&
        value
          ? { status: 'in stock' }
          : {}
      ),
    }));

    setFormError('');
  };

  const validateAssetDraft = () => {
    const name = String(
      assetDraft.model || ''
    ).trim();

    const serial = String(
      assetDraft.serial || ''
    ).trim();

    const costText = String(
      assetDraft.cost ?? ''
    ).trim();

    const cost = Number(costText);

    const purchaseDate =
      parseAssetDate(
        assetDraft.purchaseDate
      );

    const warrantyDate =
      parseAssetDate(
        assetDraft.warrantyEnd
      );

    if (!name) {
      return 'Device name is required.';
    }

    if (!assetDraft.type) {
      return 'Select an asset category.';
    }

    if (!serial) {
      return 'Serial number is required.';
    }

    if (
      assets.some(asset =>
        asset.id !== editingAssetId &&
        normalize(getAssetSerial(asset)) ===
          normalize(serial)
      )
    ) {
      return 'This serial number is already registered.';
    }

    if (
      assetDraft.assetTag.trim() &&
      assets.some(asset =>
        asset.id !== editingAssetId &&
        normalize(getAssetTag(asset)) ===
          normalize(assetDraft.assetTag)
      )
    ) {
      return 'This asset tag is already in use.';
    }

    if (
      !costText ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      return 'Enter a valid non-negative purchase cost.';
    }

    if (!purchaseDate) {
      return 'Select a valid purchase date.';
    }

    if (
      getDateOnlyNumber(purchaseDate) >
      getDateOnlyNumber(new Date())
    ) {
      return 'Purchase date cannot be in the future.';
    }

    if (
      assetDraft.warrantyEnd &&
      !warrantyDate
    ) {
      return 'Select a valid warranty expiry date.';
    }

    if (
      warrantyDate &&
      warrantyDate < purchaseDate
    ) {
      return 'Warranty expiry cannot be before purchase date.';
    }

    if (!assetDraft.location) {
      return 'Select an asset location.';
    }

    if (formMode === 'add') {
      if (
        ![
          'in stock',
          'in repair',
          'retired',
        ].includes(assetDraft.status)
      ) {
        return 'Select a valid initial asset status.';
      }

      if (
        assetDraft.status === 'retired' &&
        !canDeleteAssets
      ) {
        return 'Registering a retired asset requires Assets: delete permission.';
      }

      if (assetDraft.assignedTo) {
        if (!canAssignAssets) {
          return 'You do not have permission to assign assets.';
        }

        if (
          !activeEmployees.some(
            user =>
              user.id === assetDraft.assignedTo
          )
        ) {
          return 'Select an active employee.';
        }

        if (assetDraft.status !== 'in stock') {
          return 'Only available assets can be assigned.';
        }
      }
    }

    return '';
  };

  const saveAsset = () => {
    if (savingRef.current) return;

    if (
      formMode === 'add' &&
      !canCreateAssets
    ) {
      return;
    }

    if (
      formMode === 'edit' &&
      !canUpdateAssets
    ) {
      return;
    }

    const error = validateAssetDraft();

    if (error) {
      setFormError(error);
      return;
    }

    const payload = {
      model: assetDraft.model.trim(),

      type: assetDraft.type,

      serial: assetDraft.serial.trim(),

      cost: Number(assetDraft.cost),

      location: assetDraft.location,

      purchaseDate:
        toDisplayDate(
          assetDraft.purchaseDate
        ),

      warrantyEnd:
        toDisplayDate(
          assetDraft.warrantyEnd
        ) || 'No warranty',

      condition: assetDraft.condition,
    };

    savingRef.current = true;

    try {
      if (formMode === 'edit') {
        if (!editingAsset) {
          setFormError(
            'This asset no longer exists.'
          );

          return;
        }

        const result = updateAsset(
          editingAsset.id,
          payload
        );

        if (result === false) {
          setFormError(
            'Unable to update the asset.'
          );

          return;
        }
      } else if (formMode === 'add') {
        const assetTag =
          assetDraft.assetTag.trim() ||
          generateAssetTag(
            assetDraft.type,
            assets
          );

        const result = addAsset({
          ...payload,

          assetTag,

          status: assetDraft.status,

          assignedTo: null,

          assignedName: null,
        });

        if (
          result === false ||
          result == null
        ) {
          setFormError(
            'Unable to register the asset.'
          );

          return;
        }

        const assetId =
          typeof result === 'string'
            ? result
            : result?.id;

        if (
          assetDraft.assignedTo &&
          canAssignAssets
        ) {
          pendingAssignmentRef.current = {
            assetId,
            assetTag,
            userId: assetDraft.assignedTo,
            condition: assetDraft.condition,
          };
        }

        resetFilters();
      }

      closeAssetForm();
    } catch (error) {
      console.error(
        'Asset save failed:',
        error
      );

      setFormError(
        'Unable to save this asset. Please review the entered details.'
      );
    } finally {
      savingRef.current = false;
    }
  };

  // ==========================================================
  // ASSIGN NEW ASSET AFTER INVENTORY STATE IS UPDATED
  // ==========================================================

  useEffect(() => {
    const pending =
      pendingAssignmentRef.current;

    if (!pending) return;

    const registeredAsset = assets.find(
      asset =>
        (
          pending.assetId &&
          asset.id === pending.assetId
        ) ||
        getAssetTag(asset) === pending.assetTag
    );

    if (!registeredAsset) return;

    pendingAssignmentRef.current = null;

    const employee = users.find(
      user => user.id === pending.userId
    );

    if (
      !canAssignAssets ||
      normalize(employee?.status) !== 'active' ||
      normalize(registeredAsset.status) !== 'in stock'
    ) {
      showToast(
        'Asset registered. Complete the employee assignment through Asset Allocation.'
      );

      return;
    }

    assignAsset(
      registeredAsset.id,
      pending.userId,
      pending.condition,
      'Assigned during asset registration'
    );
  }, [
    assets,
    users,
    canAssignAssets,
    assignAsset,
    showToast,
  ]);

  // ==========================================================
  // ASSET LIFECYCLE MANAGEMENT
  // ==========================================================

  const requestStatusChange = (
    asset,
    nextStatus
  ) => {
    if (!asset) return;

    const currentStatus =
      normalize(asset.status);

    const custodyActive =
      hasAssetCustody(
        asset,
        custodyHistory
      );

    if (
      currentStatus === nextStatus
    ) {
      return;
    }

    if (
      nextStatus === 'retired'
        ? !canDeleteAssets
        : !canUpdateAssets
    ) {
      return;
    }

    if (custodyActive) {
      showToast(
        'Return this asset through Asset Allocation before changing its inventory status.'
      );

      return;
    }

    const validTransition =
      (
        currentStatus === 'in stock' &&
        nextStatus === 'in repair'
      ) ||
      (
        currentStatus === 'in repair' &&
        nextStatus === 'in stock'
      ) ||
      (
        currentStatus === 'retired' &&
        nextStatus === 'in stock'
      ) ||
      (
        currentStatus !== 'retired' &&
        nextStatus === 'retired'
      );

    if (!validTransition) {
      showToast(
        'This asset status transition is not available.'
      );

      return;
    }

    const labels = {
      'in repair': 'Send Asset for Repair',
      'in stock':
        currentStatus === 'retired'
          ? 'Restore Asset'
          : 'Complete Repair',
      retired: 'Retire Asset',
    };

    const label = labels[nextStatus];

    const messages = {
      'in repair':
        `Move ${getAssetTag(asset)} to In Repair? It will not be available for allocation.`,

      'in stock':
        `Confirm that ${getAssetTag(asset)} has been inspected and is ready to return to available inventory?`,

      retired:
        `Retire ${getAssetTag(asset)} (${getAssetName(asset)})? The historical asset record will be retained.`,
    };

    setConfirmation({
      title: label,

      message: messages[nextStatus],

      confirmLabel: label,

      assetId: asset.id,

      previousStatus: currentStatus,

      nextStatus,
    });
  };

  const confirmStatusChange = () => {
    if (!confirmation) return;

    const target = assets.find(
      asset =>
        asset.id === confirmation.assetId
    );

    if (!target) {
      setConfirmation(null);
      showToast('Asset no longer exists.');
      return;
    }

    const allowed =
      confirmation.nextStatus === 'retired'
        ? hasPermission('Assets', 'delete')
        : hasPermission('Assets', 'update');

    if (!allowed) {
      setConfirmation(null);
      return;
    }

    if (
      normalize(target.status) !==
      confirmation.previousStatus
    ) {
      setConfirmation(null);

      showToast(
        'The asset status has changed. Review the latest record.'
      );

      return;
    }

    if (
      hasAssetCustody(
        target,
        custodyHistory
      )
    ) {
      setConfirmation(null);

      showToast(
        'Return the assigned asset before changing its status.'
      );

      return;
    }

    setAssetStatus(
      target.id,
      confirmation.nextStatus
    );

    setConfirmation(null);
  };

  // ==========================================================
  // ASSET DETAIL AND ALLOCATION
  // ==========================================================

  const openAssetDetails = asset => {
    if (!canReadAssets) return;

    setSelectedAssetId(asset.id);
  };

  const closeAssetDetails = () => {
    setSelectedAssetId(null);
  };

  const openAssetAllocation = () => {
    if (!canAssignAssets) return;

    closeAssetDetails();
    navigate('allocate');
  };

  const selectedCustodyHistory =
    selectedAsset
      ? custodyHistory.filter(record =>
          record.assetId === selectedAsset.id ||
          (
            getAssetTag(selectedAsset) &&
            record.assetTag ===
              getAssetTag(selectedAsset)
          )
        )
      : [];

  // ==========================================================
  // JSON EXPORT
  // ==========================================================

  const exportAssetDetails = () => {
    if (!selectedAsset || !canExport) {
      return;
    }

    const record = {
      exportedAt: new Date().toISOString(),

      asset: selectedAsset,

      warranty: {
        status: getWarrantyStatus(selectedAsset),
        remainingDays: getWarrantyDays(selectedAsset),
      },

      employee:
        canReadUsers && selectedAssignee
          ? {
              id: selectedAssignee.id,
              employeeId: selectedAssignee.employeeId,
              name: selectedAssignee.name,
              department: selectedAssignee.department,
              designation: selectedAssignee.role,
              email: selectedAssignee.email,
              status: selectedAssignee.status,
              location: selectedAssignee.location,
            }
          : undefined,

      custodyHistory: selectedCustodyHistory,
    };

    downloadJSON(
      record,
      `asset-${safeFilename(
        selectedAsset.assetId ||
        getAssetTag(selectedAsset)
      )}.json`
    );

    showToast(
      `Exported ${getAssetTag(selectedAsset)} asset record.`
    );
  };

  const exportInventory = () => {
    if (!canExport) return;

    const records = filteredAssets.map(asset => ({
      ...asset,

      warrantyStatus:
        getWarrantyStatus(asset),

      warrantyDaysRemaining:
        getWarrantyDays(asset),
    }));

    downloadJSON(
      {
        exportedAt: new Date().toISOString(),

        totalAssets: records.length,

        totalPurchaseCost: records.reduce(
          (total, asset) =>
            total + getAssetCost(asset),
          0
        ),

        assets: records,
      },
      `asset-inventory-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
    );

    showToast(
      `Exported ${records.length} inventory records.`
    );
  };

  // ==========================================================
  // SORTABLE TABLE HEADERS
  // ==========================================================

  const sortableHeader = (
    label,
    field
  ) => (
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
        onClick={() =>
          handleSort(field)
        }
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

  if (!canReadAssets) {
    return (
      <Card title="Asset Management Restricted">

        <div className="py-8 flex flex-col items-center gap-3 text-center">

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
      id="asset-management-dashboard"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div className="min-w-0">

          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">

            <IconLaptop className="w-6 h-6 text-sky-400 shrink-0" />

            Asset Management

          </h2>

          <p className="text-[13px] text-muted mt-1">
            Maintain laptop, monitor, phone and peripheral inventory.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {canExport && (
            <Button
              variant="secondary"
              icon={IconDownload}
              disabled={!filteredAssets.length}
              onClick={exportInventory}
            >
              Export Inventory
            </Button>
          )}

          {canCreateAssets && (
            <Button
              variant="primary"
              icon={IconPlus}
              onClick={openAddAsset}
              ariaLabel="Register hardware asset"
            >
              Add Asset
            </Button>
          )}

        </div>

      </div>

      {/* =====================================================
          ASSET CATEGORY KPIs
      ====================================================== */}

      <CategoryCardsBar
        categories={categories}
        activeCategory={activeTab}
        onSelectCategory={handleCategorySelect}
        columnsClass="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
      />

      {/* =====================================================
          ASSET STATUS KPIs
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

        <MetricCard
          label="Total Assets"
          value={summary.total}
          description="Registered inventory"
          selected={statusFilter === 'All'}
          onClick={resetFilters}
        />

        {ASSET_STATUSES.map(item => (
          <MetricCard
            key={item.value}
            label={item.label}
            value={summary[item.value]}
            description="Click to view assets"
            color={item.textColor}
            selected={
              statusFilter === item.value
            }
            onClick={() =>
              filterByStatus(item.value)
            }
          />
        ))}

      </div>

      {/* =====================================================
          WARRANTY SUMMARY
      ====================================================== */}

      <Card
        title="Warranty & Inventory Value"
        subText="Track equipment warranty coverage and recorded acquisition costs."
      >

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

          <div className="p-3 rounded-xl border border-line bg-surface2/40 flex flex-col gap-2">

            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
              Total Purchase Value
            </span>

            <span className="font-display font-bold text-[22px] text-accent tabular-nums break-words">
              {formatCurrency(summary.totalCost)}
            </span>

            <span className="text-[11px] text-muted">
              All registered assets
            </span>

          </div>

          <MetricCard
            label="Active Warranty"
            value={summary.warrantyActive}
            description="More than 30 days remaining"
            color="text-good"
            selected={
              warrantyFilter === 'active'
            }
            onClick={() =>
              filterByWarranty('active')
            }
          />

          <MetricCard
            label="Expiring Soon"
            value={summary.warrantyExpiring}
            description="Within the next 30 days"
            color="text-warn"
            selected={
              warrantyFilter === 'expiring'
            }
            onClick={() =>
              filterByWarranty('expiring')
            }
          />

          <MetricCard
            label="Expired Warranty"
            value={summary.warrantyExpired}
            description="Warranty period ended"
            color="text-bad"
            selected={
              warrantyFilter === 'expired'
            }
            onClick={() =>
              filterByWarranty('expired')
            }
          />

          <MetricCard
            label="No Warranty"
            value={summary.warrantyNone}
            description="No valid expiry recorded"
            color="text-muted"
            selected={
              warrantyFilter === 'none'
            }
            onClick={() =>
              filterByWarranty('none')
            }
          />

        </div>

      </Card>

      {/* =====================================================
          MAIN INVENTORY TABLE
      ====================================================== */}

      <Card
        id="widget-inventory"
        data-w="inventory"
        title="Hardware Asset Inventory"
        subText={`${filteredAssets.length} of ${assets.length} registered assets`}
      >

        {/* STATUS DISTRIBUTION */}

        <div className="p-3.5 rounded-xl bg-surface2/30 border border-line flex flex-col gap-2">

          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Inventory Status Breakdown
          </span>

          <SegmentedBar
            items={statusCounts}
            total={assets.length}
          />

        </div>

        {/* FILTER TOOLBAR */}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">

          <div className="relative w-full sm:w-64">

            <IconSearch className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

            <input
              type="text"
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Search asset ID, serial, employee..."
              aria-label="Search hardware inventory"
              className="w-full pl-9 pr-8 py-2 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear asset search"
                onClick={() =>
                  setSearch('')
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

          {/* CATEGORY FILTER */}

          <select
            value={activeTab}
            onChange={event =>
              setActiveTab(event.target.value)
            }
            aria-label="Filter by asset category"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Categories
            </option>

            {categoryOptions.map(type => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}

          </select>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by asset status"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Statuses
            </option>

            {ASSET_STATUSES.map(item => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}

          </select>

          {/* LOCATION FILTER */}

          <select
            value={locationFilter}
            onChange={event =>
              setLocationFilter(event.target.value)
            }
            aria-label="Filter by asset location"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Locations
            </option>

            {filterLocations.map(location => (
              <option
                key={location}
                value={location}
              >
                {location}
              </option>
            ))}

          </select>

          {/* CONDITION FILTER */}

          <select
            value={conditionFilter}
            onChange={event =>
              setConditionFilter(event.target.value)
            }
            aria-label="Filter by asset condition"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Conditions
            </option>

            {conditionOptions.map(item => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}

          </select>

          {/* WARRANTY FILTER */}

          <select
            value={warrantyFilter}
            onChange={event =>
              setWarrantyFilter(event.target.value)
            }
            aria-label="Filter by warranty status"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Warranties
            </option>

            {WARRANTY_OPTIONS.map(item => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}

          </select>

          <Button
            variant="secondary"
            size="sm"
            icon={IconX}
            onClick={resetFilters}
          >
            Reset Filters
          </Button>

        </div>

        {/* ===================================================
            INVENTORY DATA TABLE
        ==================================================== */}

        {!filteredAssets.length ? (
          <EmptyState
            icon={IconLaptop}
            message="No hardware assets match the selected search or filters."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="overflow-x-auto -mx-1 mt-2">

            <table className="w-full min-w-[1800px] text-left border-collapse">

              <thead>

                <tr className="border-b border-line">

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    No.
                  </th>

                  {sortableHeader(
                    'Asset ID',
                    'assetId'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Asset Tag
                  </th>

                  {sortableHeader(
                    'Device Name',
                    'model'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Assigned Employee
                  </th>

                  {sortableHeader(
                    'Category',
                    'type'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Serial Number
                  </th>

                  {sortableHeader(
                    'Purchase Date',
                    'purchaseDate'
                  )}

                  {sortableHeader(
                    'Location',
                    'location'
                  )}

                  {sortableHeader(
                    'Condition',
                    'condition'
                  )}

                  {sortableHeader(
                    'Status',
                    'status'
                  )}

                  {sortableHeader(
                    'Warranty',
                    'warrantyEnd'
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

                {paginatedAssets.map((asset, index) => {
                  const assignee = canReadUsers
                    ? getAssignedUser(asset, users)
                    : null;

                  const status =
                    normalize(asset.status);

                  const custodyActive =
                    hasAssetCustody(
                      asset,
                      custodyHistory
                    );

                  return (
                    <tr
                      key={asset.id}
                      onClick={() =>
                        openAssetDetails(asset)
                      }
                      className="border-b border-dashed border-line hover:bg-surface2/40 transition-colors cursor-pointer group"
                    >

                      <td className={`${CELL_CLASS} text-muted font-data`}>

                        {
                          (currentPage - 1) *
                            pageSize +
                          index + 1
                        }

                      </td>

                      <td className={`${CELL_CLASS} font-data font-bold text-accent whitespace-nowrap`}>

                        {asset.assetId || asset.id}

                      </td>

                      <td className={`${CELL_CLASS} font-data text-muted whitespace-nowrap`}>

                        {getAssetTag(asset) || '—'}

                      </td>

                      <td className={CELL_CLASS}>

                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            openAssetDetails(asset);
                          }}
                          className="flex items-center gap-2.5 text-left group cursor-pointer"
                        >

                          <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center shrink-0">

                            <IconLaptop className="w-4 h-4 text-accent" />

                          </div>

                          <span
                            title={getAssetName(asset)}
                            className="font-semibold text-ink group-hover:text-accent max-w-[230px] truncate"
                          >
                            {getAssetName(asset)}
                          </span>

                        </button>

                      </td>

                      <td className={CELL_CLASS}>

                        <div className="flex flex-col gap-0.5">

                          <span className="text-ink whitespace-nowrap">
                            {
                              assignee?.name ||
                              asset.assignedName ||
                              asset.assignedEmployee ||
                              'Unassigned'
                            }
                          </span>

                          {assignee?.employeeId && (
                            <span className="text-[11px] font-data text-muted">
                              {assignee.employeeId}
                            </span>
                          )}

                        </div>

                      </td>

                      <td className={CELL_CLASS}>

                        <Tag>
                          {getAssetType(asset)}
                        </Tag>

                      </td>

                      <td className={`${CELL_CLASS} text-muted font-data whitespace-nowrap`}>

                        {getAssetSerial(asset) || '—'}

                      </td>

                      <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>

                        {asset.purchaseDate || '—'}

                      </td>

                      <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>

                        {asset.location || '—'}

                      </td>

                      <td className={CELL_CLASS}>

                        <Tag>
                          {asset.condition || 'Unknown'}
                        </Tag>

                      </td>

                      <td className={CELL_CLASS}>

                        <StatusPill
                          status={asset.status}
                        />

                      </td>

                      <td className={CELL_CLASS}>

                        <div className="flex flex-col items-start gap-1">

                          <WarrantyBadge asset={asset} />

                          <span className="text-[10.5px] text-muted whitespace-nowrap">

                            {
                              toDisplayDate(
                                asset.warrantyEnd
                              ) || '—'
                            }

                          </span>

                        </div>

                      </td>

                      {/* ASSET ACTIONS */}

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
                            className="!text-[11px] !px-2 !py-1"
                            onClick={() =>
                              openAssetDetails(asset)
                            }
                          >
                            View
                          </Button>

                          {canUpdateAssets && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="!text-[11px] !px-2 !py-1"
                              onClick={() =>
                                openEditAsset(asset)
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {canUpdateAssets &&
                            !custodyActive &&
                            status === 'in stock' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="!text-[11px] !px-2 !py-1 !text-warn"
                                onClick={() =>
                                  requestStatusChange(
                                    asset,
                                    'in repair'
                                  )
                                }
                              >
                                Repair
                              </Button>
                            )}

                          {canUpdateAssets &&
                            !custodyActive &&
                            status === 'in repair' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="!text-[11px] !px-2 !py-1 !text-good"
                                onClick={() =>
                                  requestStatusChange(
                                    asset,
                                    'in stock'
                                  )
                                }
                              >
                                Repaired
                              </Button>
                            )}

                          {canDeleteAssets &&
                            !custodyActive &&
                            status !== 'retired' && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="!text-[11px] !px-2 !py-1"
                                onClick={() =>
                                  requestStatusChange(
                                    asset,
                                    'retired'
                                  )
                                }
                              >
                                Retire
                              </Button>
                            )}

                          {canUpdateAssets &&
                            !custodyActive &&
                            status === 'retired' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="!text-[11px] !px-2 !py-1 !text-good"
                                onClick={() =>
                                  requestStatusChange(
                                    asset,
                                    'in stock'
                                  )
                                }
                              >
                                Restore
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

        {/* PAGINATION */}

        <AssetPagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredAssets.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

      </Card>

      {/* =====================================================
          ADD / EDIT ASSET DRAWER
      ====================================================== */}

      {formMode &&
        (
          formMode === 'add'
            ? canCreateAssets
            : canUpdateAssets
        ) && (
          <Drawer
            isOpen={true}
            isCentered={true}
            width="min(650px, 94vw)"
            maxWidth="min(650px, 94vw)"
            className="!h-auto max-h-[90vh]"
            title={
              formMode === 'add'
                ? 'Register Hardware Asset'
                : `Edit Asset: ${editingAsset?.assetId || assetDraft.assetTag}`
            }
            onClose={closeAssetForm}
            footer={
              <div className="flex flex-col gap-3">

                {formError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg border border-bad/30 bg-bad/10 text-bad text-[12px]"
                  >
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-2">

                  <Button
                    variant="secondary"
                    onClick={closeAssetForm}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    onClick={saveAsset}
                  >
                    {formMode === 'add'
                      ? 'Register Asset'
                      : 'Save Changes'}
                  </Button>

                </div>

              </div>
            }
          >

            <form
              className="flex flex-col gap-4"
              onSubmit={event => {
                event.preventDefault();
                saveAsset();
              }}
            >

              {formMode === 'edit' && (
                <FormField
                  label="Asset ID"
                  value={
                    editingAsset?.assetId ||
                    editingAsset?.id
                  }
                  readOnly
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <FormField
                  label="Category"
                  value={assetDraft.type}
                  options={categoryOptions}
                  required
                  onChange={value =>
                    updateDraft('type', value)
                  }
                />

                <FormField
                  label="Asset Tag"
                  value={assetDraft.assetTag}
                  readOnly={formMode === 'edit'}
                  placeholder="Auto-generated if blank"
                  onChange={value =>
                    updateDraft('assetTag', value)
                  }
                />

              </div>

              <FormField
                label="Device Name / Model"
                value={assetDraft.model}
                placeholder="e.g. Dell Latitude 7440"
                required
                onChange={value =>
                  updateDraft('model', value)
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <FormField
                  label="Serial Number"
                  value={assetDraft.serial}
                  placeholder="e.g. SN-DEL-10394"
                  required
                  onChange={value =>
                    updateDraft('serial', value)
                  }
                />

                <FormField
                  label="Purchase Cost (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={assetDraft.cost}
                  required
                  onChange={value =>
                    updateDraft('cost', value)
                  }
                />

                <FormField
                  label="Purchase Date"
                  type="date"
                  max={formatDateInput(new Date())}
                  value={assetDraft.purchaseDate}
                  required
                  onChange={value =>
                    updateDraft('purchaseDate', value)
                  }
                />

                <FormField
                  label="Warranty Expiry"
                  type="date"
                  min={assetDraft.purchaseDate}
                  value={assetDraft.warrantyEnd}
                  onChange={value =>
                    updateDraft('warrantyEnd', value)
                  }
                />

                <FormField
                  label="Location"
                  value={assetDraft.location}
                  options={[
                    {
                      value: '',
                      label: 'Select location',
                    },
                    ...locationOptions,
                  ]}
                  required
                  onChange={value =>
                    updateDraft('location', value)
                  }
                />

                <FormField
                  label="Condition"
                  value={assetDraft.condition}
                  options={conditionOptions}
                  required
                  onChange={value =>
                    updateDraft('condition', value)
                  }
                />

              </div>

              <p className="text-[11px] text-muted">
                Leave warranty expiry blank only if the asset has no warranty.
              </p>

              {formMode === 'add' ? (
                <>

                  <FormField
                    label="Initial Asset Status"
                    value={assetDraft.status}
                    options={[
                      {
                        value: 'in stock',
                        label: 'In Stock',
                      },
                      {
                        value: 'in repair',
                        label: 'In Repair',
                      },
                      ...(
                        canDeleteAssets
                          ? [{
                              value: 'retired',
                              label: 'Retired',
                            }]
                          : []
                      ),
                    ]}
                    onChange={value =>
                      updateDraft('status', value)
                    }
                  />

                  {canAssignAssets && (
                    <FormField
                      label="Assign to Employee (Optional)"
                      value={assetDraft.assignedTo}
                      disabled={
                        assetDraft.status !== 'in stock'
                      }
                      options={[
                        {
                          value: '',
                          label: 'Keep in Inventory',
                        },
                        ...activeEmployees.map(user => ({
                          value: user.id,

                          label:
                            `${user.name} · ${user.employeeId || user.department || ''}`,
                        })),
                      ]}
                      onChange={value =>
                        updateDraft('assignedTo', value)
                      }
                    />
                  )}

                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <DetailField
                    label="Current Status"
                    value={
                      <StatusPill
                        status={editingAsset?.status}
                      />
                    }
                  />

                  <DetailField
                    label="Assigned Employee"
                    value={
                      editingAsset?.assignedName ||
                      editingAsset?.assignedEmployee ||
                      'Unassigned'
                    }
                  />

                  <p className="sm:col-span-2 text-[11.5px] text-muted">

                    Employee assignment and return operations
                    are managed through Asset Allocation.
                    Lifecycle status changes are available
                    in the inventory action column.

                  </p>

                </div>
              )}

              <div className="p-3 rounded-lg bg-surface2/40 border border-line">

                <span className="text-[11px] text-muted uppercase font-semibold">
                  Recorded Purchase Cost
                </span>

                <div className="text-[18px] font-display font-bold text-accent mt-1">

                  {
                    formatCurrency(
                      Number(assetDraft.cost) || 0
                    )
                  }

                </div>

              </div>

            </form>

          </Drawer>
        )}

      {/* =====================================================
          ASSET DETAILS DRAWER
      ====================================================== */}

      {selectedAsset && !formMode && (
        <Drawer
          isOpen={true}
          isCentered={true}
          isFullScreen={true}
          id="asset-telemetry-modal"
          title={`Asset Details: ${selectedAsset.assetId || getAssetTag(selectedAsset)}`}
          closeButtonLabel="Close asset details"
          onClose={closeAssetDetails}
          headerActions={
            <>

              {canUpdateAssets && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    openEditAsset(selectedAsset)
                  }
                >
                  Edit Details
                </Button>
              )}

              {canExport && (
                <Button
                  variant="secondary"
                  icon={IconDownload}
                  onClick={exportAssetDetails}
                >
                  Export JSON
                </Button>
              )}

            </>
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">

              <span className="text-[12px] text-muted font-data">

                Asset ID:{' '}

                {
                  selectedAsset.assetId ||
                  selectedAsset.id
                }

              </span>

              <div className="flex flex-wrap items-center gap-2">

                {canAssignAssets &&
                  selectedAsset.status !== 'retired' && (
                    <Button
                      variant="primary"
                      onClick={openAssetAllocation}
                    >
                      Manage Allocation
                    </Button>
                  )}

                <Button
                  variant="secondary"
                  onClick={closeAssetDetails}
                >
                  Close
                </Button>

              </div>

            </div>
          }
        >

          <div className="flex flex-col gap-5">

            {/* ASSET HEADER */}

            <section className="p-4 rounded-xl bg-surface2/60 border border-line">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">

                    <IconLaptop className="w-6 h-6 text-accent" />

                  </div>

                  <div>

                    <h3 className="font-display font-bold text-[19px] text-ink">

                      {getAssetName(selectedAsset)}

                    </h3>

                    <p className="text-[12px] text-muted mt-1">

                      {getAssetTag(selectedAsset)}

                      {' · '}

                      {getAssetType(selectedAsset)}

                    </p>

                  </div>

                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <StatusPill
                    status={selectedAsset.status}
                  />

                  <WarrantyBadge
                    asset={selectedAsset}
                  />

                </div>

              </div>

            </section>

            {/* ASSET INFORMATION */}

            <section className="flex flex-col gap-3">

              <h3 className="font-display font-bold text-[15px] text-ink">
                Asset Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

                <DetailField
                  label="Asset ID"
                  value={
                    selectedAsset.assetId ||
                    selectedAsset.id
                  }
                />

                <DetailField
                  label="Asset Tag"
                  value={getAssetTag(selectedAsset)}
                />

                <DetailField
                  label="Device Name"
                  value={getAssetName(selectedAsset)}
                />

                <DetailField
                  label="Category"
                  value={getAssetType(selectedAsset)}
                />

                <DetailField
                  label="Serial Number"
                  value={getAssetSerial(selectedAsset)}
                />

                <DetailField
                  label="Purchase Date"
                  value={selectedAsset.purchaseDate}
                />

                <DetailField
                  label="Purchase Cost"
                  value={
                    formatCurrency(
                      getAssetCost(selectedAsset)
                    )
                  }
                />

                <DetailField
                  label="Location"
                  value={selectedAsset.location}
                />

                <DetailField
                  label="Condition"
                  value={
                    <Tag>
                      {selectedAsset.condition || 'Unknown'}
                    </Tag>
                  }
                />

                <DetailField
                  label="Lifecycle Status"
                  value={
                    <StatusPill
                      status={selectedAsset.status}
                    />
                  }
                />

                <DetailField
                  label="Assigned Date"
                  value={
                    selectedAsset.assignedDate ||
                    '—'
                  }
                />

                <DetailField
                  label="Current Custody"
                  value={
                    hasAssetCustody(
                      selectedAsset,
                      custodyHistory
                    )
                      ? 'Assigned / Return Pending'
                      : 'No Active Custody'
                  }
                />

              </div>

            </section>

            {/* WARRANTY INFORMATION */}

            <section className="p-4 rounded-xl bg-surface2/30 border border-line flex flex-col gap-3">

              <h3 className="font-display font-bold text-[15px] text-ink flex items-center gap-2">

                <IconClock className="w-4 h-4 text-accent" />

                Warranty Information

              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <DetailField
                  label="Warranty Expiry"
                  value={
                    toDisplayDate(
                      selectedAsset.warrantyEnd
                    ) || '—'
                  }
                />

                <DetailField
                  label="Warranty Status"
                  value={
                    <WarrantyBadge
                      asset={selectedAsset}
                    />
                  }
                />

                <DetailField
                  label="Remaining Coverage"
                  value={
                    getWarrantyDescription(
                      selectedAsset
                    )
                  }
                />

              </div>

            </section>

            {/* ASSIGNED EMPLOYEE INFORMATION */}

            <section className="flex flex-col gap-3">

              <h3 className="font-display font-bold text-[15px] text-ink">
                Assigned Employee Information
              </h3>

              {selectedAssignee && canReadUsers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

                  <DetailField
                    label="Employee ID"
                    value={selectedAssignee.employeeId}
                  />

                  <DetailField
                    label="Employee Name"
                    value={selectedAssignee.name}
                  />

                  <DetailField
                    label="Department"
                    value={selectedAssignee.department}
                  />

                  <DetailField
                    label="Designation"
                    value={selectedAssignee.role}
                  />

                  <DetailField
                    label="Email"
                    value={selectedAssignee.email}
                  />

                  <DetailField
                    label="Employee Location"
                    value={selectedAssignee.location}
                  />

                  <DetailField
                    label="Account Status"
                    value={
                      <StatusPill
                        status={selectedAssignee.status}
                      />
                    }
                  />

                  <DetailField
                    label="Joining Date"
                    value={
                      selectedAssignee.joiningDate ||
                      selectedAssignee.createdDate
                    }
                  />

                  <DetailField
                    label="Last Login"
                    value={selectedAssignee.lastLogin}
                  />

                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface2/40 border border-line text-[13px] text-muted">

                  {
                    selectedAsset.assignedName ||
                    selectedAsset.assignedEmployee ||
                    'This asset has no recorded employee assignment.'
                  }

                  {!canReadUsers && (
                    <p className="mt-1 text-[11px]">

                      Additional employee details require
                      User Profiles: read permission.

                    </p>
                  )}

                </div>
              )}

            </section>

            {/* CUSTODY HISTORY */}

            <section className="flex flex-col gap-3">

              <h3 className="font-display font-bold text-[15px] text-ink">

                Asset Custody History

                {' '}

                <span className="text-[12px] text-muted">
                  ({selectedCustodyHistory.length})
                </span>

              </h3>

              {!selectedCustodyHistory.length ? (
                <EmptyState
                  icon={IconPackage}
                  message="No custody history records for this asset."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line">

                  <table className="w-full min-w-[800px] text-left border-collapse">

                    <thead className="bg-surface2/40">

                      <tr className="border-b border-line">

                        <th className={HEADER_CLASS}>
                          Employee
                        </th>

                        <th className={HEADER_CLASS}>
                          Assigned Date
                        </th>

                        <th className={HEADER_CLASS}>
                          Return Date
                        </th>

                        <th className={HEADER_CLASS}>
                          Condition at Issue
                        </th>

                        <th className={HEADER_CLASS}>
                          Condition at Return
                        </th>

                        <th className={HEADER_CLASS}>
                          Custody Status
                        </th>

                        <th className={HEADER_CLASS}>
                          Notes
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedCustodyHistory.map(
                        (record, index) => (
                          <tr
                            key={record.id || index}
                            className="border-b border-dashed border-line"
                          >

                            <td className={`${CELL_CLASS} text-ink font-semibold`}>

                              {record.userName || '—'}

                            </td>

                            <td className={`${CELL_CLASS} text-muted`}>

                              {record.assignedDate || '—'}

                            </td>

                            <td className={`${CELL_CLASS} text-muted`}>

                              {
                                record.returnDate ||
                                'Return Pending'
                              }

                            </td>

                            <td className={CELL_CLASS}>

                              {record.conditionAtIssue || '—'}

                            </td>

                            <td className={CELL_CLASS}>

                              {record.conditionAtReturn || '—'}

                            </td>

                            <td className={CELL_CLASS}>

                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                                record.returnDate
                                  ? 'bg-good/10 text-good border-good/30'
                                  : 'bg-warn/10 text-warn border-warn/30'
                              }`}>

                                {record.returnDate
                                  ? 'Returned'
                                  : 'Active Custody'}

                              </span>

                            </td>

                            <td className={`${CELL_CLASS} text-muted`}>

                              {record.notes || '—'}

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

            {/* ASSET GOVERNANCE */}

            <section className="p-4 rounded-xl bg-surface2/30 border border-line flex flex-col gap-2">

              <h4 className="font-bold text-[13px] text-ink flex items-center gap-2">

                <IconShield className="w-4 h-4 text-good" />

                Asset Governance

              </h4>

              <p className="text-[12px] text-muted">

                Asset updates follow the current
                administrator's permissions. Assigned
                assets must be returned before retirement,
                repair or restoration to available inventory.
                Historical custody records are retained.

              </p>

            </section>

          </div>

        </Drawer>
      )}

      {/* =====================================================
          STATUS CHANGE CONFIRMATION
      ====================================================== */}

      {confirmation && (
        <ConfirmDialog
          isOpen={true}
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          onCancel={() =>
            setConfirmation(null)
          }
          onConfirm={confirmStatusChange}
        />
      )}

    </div>
  );
}
