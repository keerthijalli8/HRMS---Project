
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Tag } from '../shared/Tag';
import { ProgressBar } from '../shared/ProgressBar';
import { EmptyState } from '../shared/EmptyState';
import { Drawer } from '../shared/Drawer';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';

import {
  IconPackage,
  IconPlus,
  IconSearch,
  IconClock,
  IconCheck,
  IconShield,
  IconUsers,
  IconDownload,
  IconAlertTriangle,
  IconX
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const LICENCE_MODELS = [
  'Subscription',
  'Per user',
  'Site',
  'Perpetual',
  'Consumption-Based'
];

const SOFTWARE_CATEGORIES = [
  'Productivity',
  'Development',
  'Design',
  'Security',
  'Infrastructure',
  'Communication',
  'Project Management',
  'Engineering',
  'Documentation',
  'Cloud',
  'Other'
];

const PAGE_SIZES = [5, 10, 20, 50];

const INPUT_CLASS =
  'w-full px-3 py-2 text-[13px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50';

const FILTER_CLASS =
  'px-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const HEADER_CLASS =
  'px-3 py-3 text-[11px] uppercase tracking-wider font-bold text-muted whitespace-nowrap';

const CELL_CLASS =
  'px-3 py-3 text-[12.5px] align-middle';

// ============================================================
// UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatCurrency(value) {
  return `₹${numberValue(value).toLocaleString('en-IN')}`;
}

function todayISO() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = type => parts.find(part => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function timestamp() {
  return new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' IST';
}

function parseDate(value) {
  if (!value) return null;

  const text = String(value).trim();

  let year;
  let month;
  let day;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]) - 1;
    day = Number(iso[3]);
  } else {
    const named = /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/.exec(text);

    if (!named) return null;

    const months = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];

    day = Number(named[1]);
    month = months.indexOf(named[2].slice(0, 3).toLowerCase());
    year = Number(named[3]);
  }

  if (month < 0 || month > 11 || year < 1900 || year > 9999) {
    return null;
  }

  const date = new Date(Date.UTC(year, month, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function dateToISO(value) {
  const date = parseDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

function dateLabel(value) {
  const date = parseDate(value);

  return date
    ? date.toLocaleDateString('en-GB', {
        timeZone: 'UTC',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Not set';
}

function getExpiry(licence) {
  return licence.expiryDate || licence.renewalDate || '';
}

function getModel(licence) {
  return licence.subscriptionModel ||
    licence.licenceType ||
    'Subscription';
}

function getAnnualCost(licence) {
  return numberValue(licence.annualCost ?? licence.costPerYear);
}

function getDaysRemaining(licence, today = todayISO()) {
  const expiry = parseDate(getExpiry(licence));
  const currentDate = parseDate(today);

  if (!expiry || !currentDate) return null;

  return Math.round(
    (expiry.getTime() - currentDate.getTime()) / 86400000
  );
}

function getRenewalStatus(licence, today) {
  const days = getDaysRemaining(licence, today);
  const storedStatus = normalize(
    licence.renewalStatus || licence.status
  );

  if (days === null) {
    return normalize(getModel(licence)) === 'perpetual'
      ? 'active'
      : 'date not set';
  }

  if (days < 0) return 'expired';
  if (storedStatus === 'pending renewal') return 'pending renewal';
  if (days <= 60) return 'expiring soon';
  if (storedStatus === 'renewed') return 'renewed';

  return 'active';
}

function getAllocations(licence) {
  return Array.isArray(licence?.allocations)
    ? licence.allocations
    : [];
}

function getActiveAllocations(licence) {
  return getAllocations(licence).filter(
    allocation =>
      !allocation.releasedAt &&
      normalize(allocation.status) !== 'released'
  );
}

function getRenewalHistory(licence) {
  return Array.isArray(licence?.renewalHistory)
    ? licence.renewalHistory
    : [];
}

function getAvailableSeats(licence) {
  return Math.max(
    0,
    numberValue(licence.totalSeats) -
    numberValue(licence.seatsUsed)
  );
}

function getUntrackedSeats(licence) {
  return Math.max(
    0,
    numberValue(licence.seatsUsed) -
    getActiveAllocations(licence).length
  );
}

function maskKey(value) {
  const key = String(value || '');

  if (!key) return 'Not recorded';
  if (key.length <= 4) return '••••';

  return `•••• ${key.slice(-4)}`;
}

function canAllocateLicence(licence, today) {
  if (!licence) return false;

  const status = getRenewalStatus(licence, today);

  return (
    !['expired', 'date not set'].includes(status) &&
    getAvailableSeats(licence) > 0
  );
}

function matchesQuery(values, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const text = values.map(normalize).join(' ');

  return words.every(word => text.includes(word));
}

function safeCSV(value) {
  let text = String(value ?? '');

  if (/^\s*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(headers, rows, filename) {
  const csv = [headers, ...rows]
    .map(row => row.map(safeCSV).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getNewRenewalDate(licence, today) {
  const expiry = parseDate(getExpiry(licence));
  const current = parseDate(today);

  const base = expiry && expiry > current
    ? expiry
    : current;

  const year = base.getUTCFullYear() + 1;
  const month = base.getUTCMonth();

  const maxDay = new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate();

  const day = Math.min(base.getUTCDate(), maxDay);

  return new Date(
    Date.UTC(year, month, day)
  ).toISOString().slice(0, 10);
}

function getLicenceDraft(licence) {
  return {
    name: licence.name || '',
    vendor: licence.vendor || '',
    version: licence.version || 'Cloud',
    licenseKey: licence.licenseKey || '',
    subscriptionModel: getModel(licence),
    category: licence.category || 'Productivity',
    totalSeats: String(licence.totalSeats ?? 0),
    seatsUsed: String(licence.seatsUsed ?? 0),
    annualCost: String(getAnnualCost(licence)),
    expiryDate: dateToISO(getExpiry(licence))
  };
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
      {label}
      {children}
    </label>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-surface2/40 border border-line min-w-0">
      <span className="block text-[11px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="block mt-1 text-[13px] font-semibold text-ink break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

function FormError({ message }) {
  if (!message) return null;

  return (
    <div role="alert" className="p-3 rounded-lg bg-bad/10 border border-bad/30 text-bad text-[12px]">
      {message}
    </div>
  );
}

function SeatUsage({ licence }) {
  const used = numberValue(licence.seatsUsed);
  const capacity = numberValue(licence.totalSeats);
  const percent = capacity > 0
    ? Math.round((used / capacity) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-1.5 min-w-[130px]">
      <div className="flex items-center justify-between gap-2 text-[11px] font-data">
        <span className="text-ink">
          {used} / {capacity}
        </span>
        <span className={percent >= 90 ? 'text-warn font-bold' : 'text-muted'}>
          {percent}%
        </span>
      </div>

      <ProgressBar
        value={used}
        max={capacity || 1}
        warnThreshold={85}
        dangerThreshold={100}
      />

      <span className="text-[10.5px] text-muted">
        {getAvailableSeats(licence)} free seats
      </span>
    </div>
  );
}

function RenewalStatus({ licence, today }) {
  const days = getDaysRemaining(licence, today);
  const status = getRenewalStatus(licence, today);

  return (
    <div className="flex flex-col items-start gap-1">
      <StatusPill status={status} />

      {days !== null && (
        <span className={`text-[10.5px] font-data ${
          days < 0
            ? 'text-bad'
            : days <= 60
              ? 'text-warn'
              : 'text-muted'
        }`}>
          {days < 0
            ? `${Math.abs(days)} days overdue`
            : days === 0
              ? 'Expires today'
              : `${days} days remaining`}
        </span>
      )}
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[12px] text-muted">
          Showing {total ? (current - 1) * pageSize + 1 : 0}
          –{Math.min(current * pageSize, total)} of {total}
        </span>

        <label className="flex items-center gap-2 text-[11px] text-muted">
          Rows per page
          <select
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            className={FILTER_CLASS}
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          Previous
        </Button>

        <span className="text-[12px] text-muted font-data">
          {current} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// SOFTWARE MANAGEMENT PAGE
// ============================================================

export function SoftwareManagementPage() {
  const {
    software = [],
    users = [],
    currentUser,
    updateSoftwareLicence,
    setActiveDrawer,
    setDrawerPayload,
    hasPermission,
    showToast
  } = useStore();

  // ROLE PERMISSIONS

  const canReadSoftware = hasPermission('Software', 'read');
  const canWriteSoftware = hasPermission('Software', 'write');
  const canUpdateSoftware = hasPermission('Software', 'update');
  const canReadUsers = hasPermission('User Profiles', 'read');

  const canAllocate = canUpdateSoftware && canReadUsers;

  const canExport =
    canReadSoftware &&
    hasPermission('Reports', 'read');

  // PAGE STATE

  const [today, setToday] = useState(todayISO);
  const [activeCategory, setActiveCategory] = useState('all');

  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [seatFilter, setSeatFilter] = useState('All');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedLicenceId, setSelectedLicenceId] = useState(null);
  const [editingLicenceId, setEditingLicenceId] = useState(null);
  const [licenceEditor, setLicenceEditor] = useState(null);
  const [editError, setEditError] = useState('');

  const [allocationLicenceId, setAllocationLicenceId] = useState(null);
  const [allocationUserId, setAllocationUserId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [allocationError, setAllocationError] = useState('');

  const [releaseTarget, setReleaseTarget] = useState(null);

  const [renewalLicenceId, setRenewalLicenceId] = useState(null);
  const [renewalDate, setRenewalDate] = useState('');
  const [renewalNotes, setRenewalNotes] = useState('');
  const [renewalError, setRenewalError] = useState('');

  const [allocationSearch, setAllocationSearch] = useState('');
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('All');
  const [allocationPage, setAllocationPage] = useState(1);
  const [allocationPageSize, setAllocationPageSize] = useState(10);

  // UPDATE DATE FOR EXPIRY TRACKING

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday(todayISO());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  // CURRENT RECORDS

  const selectedLicence = software.find(
    item => item.id === selectedLicenceId
  ) || null;

  const editingLicence = software.find(
    item => item.id === editingLicenceId
  ) || null;

  const allocationLicence = software.find(
    item => item.id === allocationLicenceId
  ) || null;

  const renewalLicence = software.find(
    item => item.id === renewalLicenceId
  ) || null;

  const activeEmployees = useMemo(() => {
    return users
      .filter(user => normalize(user.status) === 'active')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [users]);

  // ==========================================================
  // DYNAMIC SUMMARY METRICS
  // ==========================================================

  const summary = useMemo(() => {
    return software.reduce((result, licence) => {
      const days = getDaysRemaining(licence, today);

      result.total += 1;
      result.used += numberValue(licence.seatsUsed);
      result.capacity += numberValue(licence.totalSeats);
      result.available += getAvailableSeats(licence);
      result.annualCost += getAnnualCost(licence);
      result.tracked += getActiveAllocations(licence).length;
      result.untracked += getUntrackedSeats(licence);

      if (days !== null && days < 0) {
        result.expired += 1;
      }

      if (days !== null && days >= 0 && days <= 60) {
        result.expiring += 1;
      }

      if (days !== null && days >= 0 && days <= 30) {
        result.urgent += 1;
      }

      if (
        days === null &&
        normalize(getModel(licence)) !== 'perpetual'
      ) {
        result.missingDate += 1;
      }

      return result;
    }, {
      total: 0,
      used: 0,
      capacity: 0,
      available: 0,
      annualCost: 0,
      tracked: 0,
      untracked: 0,
      expired: 0,
      expiring: 0,
      urgent: 0,
      missingDate: 0
    });
  }, [software, today]);

  const utilization = summary.capacity > 0
    ? Math.round((summary.used / summary.capacity) * 100)
    : 0;

  const upcomingRenewals = useMemo(() => {
    return software
      .filter(licence => {
        const days = getDaysRemaining(licence, today);
        return days !== null && days <= 60;
      })
      .sort((a, b) =>
        getDaysRemaining(a, today) -
        getDaysRemaining(b, today)
      );
  }, [software, today]);

  const categories = [
    {
      id: 'catalog',
      label: 'Software Licences',
      icon: IconPackage,
      metric: String(summary.total),
      metricLabel: 'Software Titles',
      subText: 'Registered software licences',
      badge: 'Catalog',
      badgeColor: 'sky'
    },
    {
      id: 'tracking',
      label: 'Allocated Seats',
      icon: IconUsers,
      metric: String(summary.used),
      metricLabel: `of ${summary.capacity} Seats`,
      subText: `${utilization}% seat utilization`,
      badge: `${summary.tracked} Identified`,
      badgeColor: 'emerald'
    },
    {
      id: 'available',
      label: 'Available Seats',
      icon: IconCheck,
      metric: String(summary.available),
      metricLabel: 'Unused Capacity',
      subText: 'Across registered licences',
      badge: 'Free Seats',
      badgeColor: 'emerald'
    },
    {
      id: 'renewals',
      label: 'Upcoming Renewals',
      icon: IconClock,
      metric: String(summary.expiring),
      metricLabel: 'Next 60 Days',
      subText: `${summary.urgent} due within 30 days`,
      badge: summary.urgent ? 'Attention' : 'Normal',
      badgeColor: summary.urgent ? 'amber' : 'sky'
    },
    {
      id: 'expired',
      label: 'Expired Licences',
      icon: IconAlertTriangle,
      metric: String(summary.expired),
      metricLabel: 'Renewal Required',
      subText: 'Expired software contracts',
      badge: summary.expired ? 'Overdue' : 'Clear',
      badgeColor: summary.expired ? 'red' : 'emerald'
    }
  ];

  // ==========================================================
  // SEARCH & FILTERS
  // ==========================================================

  const modelOptions = uniqueValues([
    ...LICENCE_MODELS,
    ...software.map(getModel)
  ]);

  const categoryOptions = uniqueValues([
    ...SOFTWARE_CATEGORIES,
    ...software.map(item => item.category)
  ]);

  const filteredSoftware = useMemo(() => {
    return software.filter(licence => {
      const status = getRenewalStatus(licence, today);
      const days = getDaysRemaining(licence, today);
      const free = getAvailableSeats(licence);

      if (
        activeCategory === 'tracking' &&
        numberValue(licence.seatsUsed) === 0
      ) return false;

      if (activeCategory === 'available' && free === 0) {
        return false;
      }

      if (
        activeCategory === 'renewals' &&
        (days === null || days < 0 || days > 60)
      ) return false;

      if (activeCategory === 'expired' && status !== 'expired') {
        return false;
      }

      const matchSearch = matchesQuery([
        licence.id,
        licence.name,
        licence.vendor,
        licence.version,
        licence.category,
        getModel(licence),
        status,
        ...getActiveAllocations(licence).map(item => item.userName)
      ], search);

      const matchModel =
        modelFilter === 'All' ||
        getModel(licence) === modelFilter;

      const matchCategory =
        categoryFilter === 'All' ||
        licence.category === categoryFilter;

      const matchStatus =
        statusFilter === 'All' ||
        status === statusFilter;

      const matchSeats =
        seatFilter === 'All' ||
        (seatFilter === 'available' && free > 0) ||
        (seatFilter === 'full' && free === 0);

      return (
        matchSearch &&
        matchModel &&
        matchCategory &&
        matchStatus &&
        matchSeats
      );
    });
  }, [
    software,
    today,
    activeCategory,
    search,
    modelFilter,
    categoryFilter,
    statusFilter,
    seatFilter
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSoftware.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedSoftware = filteredSoftware.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    modelFilter,
    categoryFilter,
    statusFilter,
    seatFilter,
    activeCategory,
    pageSize
  ]);

  const resetFilters = () => {
    setActiveCategory('all');
    setSearch('');
    setModelFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setSeatFilter('All');
    setPage(1);
  };

  const selectCategory = id => {
    const next = activeCategory === id ? 'all' : id;
    resetFilters();
    setActiveCategory(next);
  };

  // ==========================================================
  // LICENCE CREATION AND EDITING
  // ==========================================================

  const openAddLicence = () => {
    if (!canWriteSoftware) return;

    setDrawerPayload?.(null);
    setActiveDrawer('add_licence');
  };

  const openEditor = licence => {
    if (!canUpdateSoftware) return;

    setSelectedLicenceId(null);
    setEditingLicenceId(licence.id);
    setLicenceEditor(getLicenceDraft(licence));
    setEditError('');
  };

  const closeEditor = () => {
    setEditingLicenceId(null);
    setLicenceEditor(null);
    setEditError('');
  };

  const updateEditorField = (field, value) => {
    setLicenceEditor(previous => ({
      ...previous,
      [field]: value
    }));

    setEditError('');
  };

  const saveLicence = () => {
    if (
      !canUpdateSoftware ||
      !editingLicence ||
      !licenceEditor
    ) return;

    const name = licenceEditor.name.trim();
    const vendor = licenceEditor.vendor.trim();

    const totalSeats = Number(licenceEditor.totalSeats);
    const seatsUsed = Number(licenceEditor.seatsUsed);
    const annualCost = Number(licenceEditor.annualCost);

    if (!name || !vendor) {
      setEditError('Software name and vendor are required.');
      return;
    }

    if (
      !licenceEditor.totalSeats.trim() ||
      !Number.isInteger(totalSeats) ||
      totalSeats < 1
    ) {
      setEditError('Total seat capacity must be a positive whole number.');
      return;
    }

    if (
      !licenceEditor.seatsUsed.trim() ||
      !Number.isInteger(seatsUsed) ||
      seatsUsed < 0 ||
      seatsUsed > totalSeats
    ) {
      setEditError('Allocated seats must be between zero and total capacity.');
      return;
    }

    const trackedSeats =
      getActiveAllocations(editingLicence).length;

    if (seatsUsed < trackedSeats) {
      setEditError(
        `There are ${trackedSeats} active employee allocations. Release those allocations before reducing the occupied seat count.`
      );
      return;
    }

    if (
      !String(licenceEditor.annualCost).trim() ||
      !Number.isFinite(annualCost) ||
      annualCost < 0
    ) {
      setEditError('Enter a valid non-negative annual cost.');
      return;
    }

    if (
      normalize(licenceEditor.subscriptionModel) !== 'perpetual' &&
      !parseDate(licenceEditor.expiryDate)
    ) {
      setEditError('Select a valid expiry or renewal date.');
      return;
    }

    if (
      licenceEditor.expiryDate &&
      !parseDate(licenceEditor.expiryDate)
    ) {
      setEditError('Expiry date is invalid.');
      return;
    }

    const duplicate = software.some(item =>
      item.id !== editingLicence.id &&
      normalize(item.name) === normalize(name) &&
      normalize(item.vendor) === normalize(vendor) &&
      normalize(item.version || 'Cloud') ===
        normalize(licenceEditor.version || 'Cloud')
    );

    if (duplicate) {
      setEditError('A licence with the same name, vendor and version already exists.');
      return;
    }

    const expiry = licenceEditor.expiryDate
      ? dateLabel(licenceEditor.expiryDate)
      : '';

    const updates = {
      ...licenceEditor,
      name,
      vendor,
      version: licenceEditor.version.trim() || 'Cloud',
      licenseKey: licenceEditor.licenseKey.trim(),
      licenceType: licenceEditor.subscriptionModel,
      totalSeats,
      seatsUsed,
      annualCost,
      costPerYear: annualCost,
      costFormatted: `₹${(annualCost / 100000).toFixed(2)} L`,
      expiryDate: expiry,
      renewalDate: expiry
    };

    const nextRecord = {
      ...editingLicence,
      ...updates,
      status: 'active',
      renewalStatus: 'active'
    };

    const status = getRenewalStatus(nextRecord, today);

    const result = updateSoftwareLicence(editingLicence.id, {
      ...updates,
      status,
      renewalStatus: status,
      daysToRenewal: getDaysRemaining(nextRecord, today)
    });

    if (result === false) {
      setEditError('Unable to save licence details.');
      return;
    }

    closeEditor();
  };

  // ==========================================================
  // EMPLOYEE LICENCE ALLOCATION
  // ==========================================================

  const openAllocation = licence => {
    if (!canAllocate) {
      showToast('Licence allocation requires Software: update and User Profiles: read permission.');
      return;
    }

    if (!canAllocateLicence(licence, today)) {
      showToast('This licence is expired, has no renewal date, or has no free seats.');
      return;
    }

    setSelectedLicenceId(null);
    setAllocationLicenceId(licence.id);
    setAllocationUserId('');
    setAllocationNotes('');
    setAllocationError('');
  };

  const closeAllocation = () => {
    setAllocationLicenceId(null);
    setAllocationUserId('');
    setAllocationNotes('');
    setAllocationError('');
  };

  const eligibleEmployees = activeEmployees.filter(user =>
    !getActiveAllocations(allocationLicence).some(
      allocation => allocation.userId === user.id
    )
  );

  const allocateLicence = () => {
    if (!canAllocate || !allocationLicence) return;

    const employee = users.find(
      user => user.id === allocationUserId
    );

    if (!employee || normalize(employee.status) !== 'active') {
      setAllocationError('Select a valid active employee.');
      return;
    }

    if (!canAllocateLicence(allocationLicence, today)) {
      setAllocationError('This licence is no longer eligible for allocation.');
      return;
    }

    const existingAllocations = getAllocations(allocationLicence);

    const duplicate = getActiveAllocations(allocationLicence)
      .some(allocation => allocation.userId === employee.id);

    if (duplicate) {
      setAllocationError('This employee already has an active allocation for this software.');
      return;
    }

    const seatsUsed = numberValue(allocationLicence.seatsUsed);
    const totalSeats = numberValue(allocationLicence.totalSeats);

    if (seatsUsed >= totalSeats) {
      setAllocationError('No available licence seats remain.');
      return;
    }

    const allocation = {
      id: createId('allocation'),
      userId: employee.id,
      employeeId: employee.employeeId || '',
      userName: employee.name,
      department: employee.department || '',
      allocatedAt: timestamp(),
      allocatedBy: currentUser?.name || 'IT Administrator',
      releasedAt: null,
      status: 'active',
      notes: allocationNotes.trim()
    };

    const result = updateSoftwareLicence(allocationLicence.id, {
      seatsUsed: seatsUsed + 1,
      allocations: [
        allocation,
        ...existingAllocations
      ]
    });

    if (result === false) {
      setAllocationError('Unable to allocate this licence.');
      return;
    }

    showToast(
      `Allocated ${allocationLicence.name} to ${employee.name}.`
    );

    closeAllocation();
  };

  // ==========================================================
  // RELEASE / RECLAIM LICENCE
  // ==========================================================

  const requestRelease = (licence, allocation) => {
    if (!canUpdateSoftware) return;

    setReleaseTarget({
      licenceId: licence.id,
      allocationId: allocation.id,
      softwareName: licence.name,
      employeeName: allocation.userName
    });
  };

  const releaseLicence = () => {
    if (!canUpdateSoftware || !releaseTarget) return;

    const licence = software.find(
      item => item.id === releaseTarget.licenceId
    );

    if (!licence) {
      setReleaseTarget(null);
      return;
    }

    const allocation = getActiveAllocations(licence).find(
      item => item.id === releaseTarget.allocationId
    );

    if (!allocation) {
      showToast('This allocation has already been released.');
      setReleaseTarget(null);
      return;
    }

    const used = numberValue(licence.seatsUsed);

    if (used < getActiveAllocations(licence).length) {
      showToast('Seat records are inconsistent. Correct the occupied seat count first.');
      setReleaseTarget(null);
      return;
    }

    const nextAllocations = getAllocations(licence).map(item =>
      item.id === allocation.id
        ? {
            ...item,
            status: 'released',
            releasedAt: timestamp(),
            releasedBy: currentUser?.name || 'IT Administrator'
          }
        : item
    );

    const result = updateSoftwareLicence(licence.id, {
      seatsUsed: Math.max(0, used - 1),
      allocations: nextAllocations
    });

    if (result === false) return;

    showToast(
      `Reclaimed one ${licence.name} seat from ${allocation.userName}.`
    );

    setReleaseTarget(null);
  };

  // ==========================================================
  // LICENCE RENEWAL
  // ==========================================================

  const openRenewal = licence => {
    if (!canUpdateSoftware) return;

    setSelectedLicenceId(null);
    setRenewalLicenceId(licence.id);
    setRenewalDate(getNewRenewalDate(licence, today));
    setRenewalNotes('');
    setRenewalError('');
  };

  const closeRenewal = () => {
    setRenewalLicenceId(null);
    setRenewalDate('');
    setRenewalNotes('');
    setRenewalError('');
  };

  const confirmRenewal = () => {
    if (!canUpdateSoftware || !renewalLicence) return;

    const selectedDate = parseDate(renewalDate);
    const currentDate = parseDate(today);
    const previousExpiry = parseDate(getExpiry(renewalLicence));

    if (!selectedDate || selectedDate <= currentDate) {
      setRenewalError('Select a renewal date later than today.');
      return;
    }

    if (previousExpiry && selectedDate <= previousExpiry) {
      setRenewalError('The new expiry date must be later than the current expiry date.');
      return;
    }

    const newExpiry = dateLabel(renewalDate);

    const renewalEntry = {
      id: createId('renewal'),
      previousExpiry: getExpiry(renewalLicence) || '',
      newExpiry,
      renewedAt: timestamp(),
      renewedBy: currentUser?.name || 'IT Administrator',
      annualCost: getAnnualCost(renewalLicence),
      notes: renewalNotes.trim()
    };

    const result = updateSoftwareLicence(renewalLicence.id, {
      expiryDate: newExpiry,
      renewalDate: newExpiry,
      status: 'renewed',
      renewalStatus: 'renewed',
      daysToRenewal: Math.round(
        (selectedDate.getTime() - currentDate.getTime()) / 86400000
      ),
      renewalHistory: [
        renewalEntry,
        ...getRenewalHistory(renewalLicence)
      ]
    });

    if (result === false) {
      setRenewalError('Unable to update renewal details.');
      return;
    }

    showToast(
      `${renewalLicence.name} renewal recorded until ${newExpiry}.`
    );

    closeRenewal();
  };

  // ==========================================================
  // ALLOCATION HISTORY
  // ==========================================================

  const allAllocations = useMemo(() => {
    return software.flatMap(licence =>
      getAllocations(licence).map(allocation => ({
        ...allocation,
        licenceId: licence.id,
        softwareName: licence.name,
        vendor: licence.vendor
      }))
    );
  }, [software]);

  const filteredAllocations = useMemo(() => {
    return allAllocations.filter(allocation => {
      const released =
        Boolean(allocation.releasedAt) ||
        normalize(allocation.status) === 'released';

      const matchStatus =
        allocationStatusFilter === 'All' ||
        (allocationStatusFilter === 'active' && !released) ||
        (allocationStatusFilter === 'released' && released);

      return matchStatus && matchesQuery([
        allocation.softwareName,
        allocation.userName,
        allocation.employeeId,
        allocation.department,
        allocation.allocatedAt,
        allocation.notes
      ], allocationSearch);
    });
  }, [
    allAllocations,
    allocationSearch,
    allocationStatusFilter
  ]);

  const allocationTotalPages = Math.max(
    1,
    Math.ceil(filteredAllocations.length / allocationPageSize)
  );

  const currentAllocationPage = Math.min(
    allocationPage,
    allocationTotalPages
  );

  const paginatedAllocations = filteredAllocations.slice(
    (currentAllocationPage - 1) * allocationPageSize,
    currentAllocationPage * allocationPageSize
  );

  useEffect(() => {
    setAllocationPage(1);
  }, [
    allocationSearch,
    allocationStatusFilter,
    allocationPageSize
  ]);

  // ==========================================================
  // EXPORT ACTIONS
  // ==========================================================

  const exportLicences = () => {
    if (!canExport) return;

    downloadCSV([
      'Licence ID',
      'Software',
      'Vendor',
      'Version',
      'Category',
      'Licence Model',
      'Total Seats',
      'Allocated Seats',
      'Available Seats',
      'Identified Allocations',
      'Annual Cost INR',
      'Expiry Date',
      'Days Remaining',
      'Renewal Status'
    ], filteredSoftware.map(licence => [
      licence.id,
      licence.name,
      licence.vendor,
      licence.version,
      licence.category,
      getModel(licence),
      licence.totalSeats,
      licence.seatsUsed,
      getAvailableSeats(licence),
      getActiveAllocations(licence).length,
      getAnnualCost(licence),
      getExpiry(licence),
      getDaysRemaining(licence, today),
      getRenewalStatus(licence, today)
    ]), `software-licences-${today}.csv`);

    showToast(`Exported ${filteredSoftware.length} licence records.`);
  };

  const exportAllocations = () => {
    if (!canExport) return;

    downloadCSV([
      'Allocation ID',
      'Software',
      'Employee ID',
      'Employee',
      'Department',
      'Allocated At',
      'Allocated By',
      'Released At',
      'Released By',
      'Status',
      'Notes'
    ], filteredAllocations.map(item => [
      item.id,
      item.softwareName,
      item.employeeId,
      item.userName,
      item.department,
      item.allocatedAt,
      item.allocatedBy,
      item.releasedAt,
      item.releasedBy,
      item.releasedAt || normalize(item.status) === 'released'
        ? 'Released'
        : 'Active',
      item.notes
    ]), `software-allocations-${today}.csv`);

    showToast(`Exported ${filteredAllocations.length} allocation records.`);
  };

  // ==========================================================
  // RESTRICTED ACCESS
  // ==========================================================

  if (!canReadSoftware) {
    return (
      <Card title="Software Management Restricted">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <IconShield className="w-8 h-8 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have Software: read permission.
          </p>
        </div>
      </Card>
    );
  }

  const showAllocations =
    activeCategory === 'all' ||
    activeCategory === 'tracking';

  const showRenewals =
    activeCategory === 'all' ||
    activeCategory === 'renewals' ||
    activeCategory === 'expired';

  const displayedRenewals = upcomingRenewals.filter(licence => {
    const days = getDaysRemaining(licence, today);

    if (activeCategory === 'expired') return days < 0;
    if (activeCategory === 'renewals') return days >= 0;

    return true;
  });

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div
      id="software-management-dashboard"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <IconPackage className="w-6 h-6 text-sky-400" />
            Software Management
          </h2>

          <p className="text-[13px] text-muted mt-1">
            Track software licences, employee allocations, seat capacity and contract renewals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeCategory !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
            >
              View All
            </Button>
          )}

          {canExport && (
            <Button
              variant="secondary"
              icon={IconDownload}
              disabled={!filteredSoftware.length}
              onClick={exportLicences}
            >
              Export CSV
            </Button>
          )}

          {canWriteSoftware && (
            <Button
              variant="primary"
              icon={IconPlus}
              onClick={openAddLicence}
              ariaLabel="Add software licence"
            >
              Add Licence
            </Button>
          )}
        </div>
      </div>

      {/* DYNAMIC KPI CARDS */}

      <CategoryCardsBar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
      />

      {/* SOFTWARE COST AND UTILIZATION */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Annual Licence Spend
          </span>

          <span className="font-display font-bold text-[23px] text-accent tabular-nums">
            ₹{(summary.annualCost / 100000).toFixed(2)} L
          </span>

          <span className="text-[11px] text-muted">
            {formatCurrency(summary.annualCost)} per year
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Overall Seat Utilization
          </span>

          <span className="font-display font-bold text-[23px] text-ink">
            {utilization}%
          </span>

          <ProgressBar
            value={summary.used}
            max={summary.capacity || 1}
          />

          <span className="text-[11px] text-muted">
            {summary.used} of {summary.capacity} seats occupied
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Employee Allocations
          </span>

          <span className="font-display font-bold text-[23px] text-good">
            {summary.tracked}
          </span>

          <span className="text-[11px] text-muted">
            {summary.untracked} occupied seats without individual records
          </span>
        </div>

      </div>

      {summary.missingDate > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warn/10 border border-warn/30">
          <IconAlertTriangle className="w-5 h-5 text-warn shrink-0" />

          <p className="text-[12px] text-warn">
            {summary.missingDate} licence(s) have no valid renewal date.
            Update their expiry information before allocating additional seats.
          </p>
        </div>
      )}

      {/* SOFTWARE LICENCE CATALOG */}

      <Card
        id="widget-licences"
        data-w="licences"
        title="Software Licence Inventory"
        subText={`${filteredSoftware.length} of ${software.length} licences`}
      >

        {/* SEARCH AND FILTER TOOLBAR */}

        <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-line/60">

          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />

            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search software, vendor, employee..."
              aria-label="Search software licences"
              className={`${FILTER_CLASS} w-full pl-8 pr-8`}
            />

            {search && (
              <button
                type="button"
                aria-label="Clear software search"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={modelFilter}
            onChange={event => setModelFilter(event.target.value)}
            aria-label="Filter licence model"
            className={FILTER_CLASS}
          >
            <option value="All">All Licence Models</option>

            {modelOptions.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
            aria-label="Filter software category"
            className={FILTER_CLASS}
          >
            <option value="All">All Categories</option>

            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            aria-label="Filter renewal status"
            className={FILTER_CLASS}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring soon">Expiring Soon</option>
            <option value="pending renewal">Pending Renewal</option>
            <option value="renewed">Renewed</option>
            <option value="expired">Expired</option>
            <option value="date not set">Date Not Set</option>
          </select>

          <select
            value={seatFilter}
            onChange={event => setSeatFilter(event.target.value)}
            aria-label="Filter seat availability"
            className={FILTER_CLASS}
          >
            <option value="All">All Seat Availability</option>
            <option value="available">Free Seats</option>
            <option value="full">Fully Allocated</option>
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

        {/* LICENCE TABLE */}

        {!filteredSoftware.length ? (
          <EmptyState
            icon={IconPackage}
            message="No software licences match the selected filters."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="overflow-x-auto -mx-1">

            <table className="w-full min-w-[1500px] text-left border-collapse">

              <thead>
                <tr className="border-b border-line">
                  {[
                    'No.',
                    'Software',
                    'Vendor',
                    'Licence Key',
                    'Licence Model',
                    'Seat Utilization',
                    'Expiry Date',
                    'Annual Cost',
                    'Renewal Status',
                    'Actions'
                  ].map(label => (
                    <th key={label} scope="col" className={HEADER_CLASS}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-dashed divide-line">

                {paginatedSoftware.map((licence, index) => (
                  <tr
                    key={licence.id}
                    className="hover:bg-surface2/40 transition-colors"
                  >

                    <td className={`${CELL_CLASS} text-muted font-data`}>
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td className={CELL_CLASS}>
                      <button
                        type="button"
                        onClick={() => setSelectedLicenceId(licence.id)}
                        className="flex flex-col gap-1 text-left cursor-pointer"
                      >
                        <span className="font-bold text-ink hover:text-accent">
                          {licence.name}
                        </span>

                        <span className="text-[11px] text-muted font-data">
                          {licence.version || 'Cloud'} · {licence.category}
                        </span>
                      </button>
                    </td>

                    <td className={`${CELL_CLASS} text-muted`}>
                      {licence.vendor}
                    </td>

                    <td className={`${CELL_CLASS} text-muted font-data whitespace-nowrap`}>
                      {maskKey(licence.licenseKey)}
                    </td>

                    <td className={CELL_CLASS}>
                      <Tag>{getModel(licence)}</Tag>
                    </td>

                    <td className={CELL_CLASS}>
                      <SeatUsage licence={licence} />
                    </td>

                    <td className={`${CELL_CLASS} text-muted font-data whitespace-nowrap`}>
                      {dateLabel(getExpiry(licence))}
                    </td>

                    <td className={`${CELL_CLASS} text-ink font-data whitespace-nowrap`}>
                      {formatCurrency(getAnnualCost(licence))}
                    </td>

                    <td className={CELL_CLASS}>
                      <RenewalStatus licence={licence} today={today} />
                    </td>

                    <td className={CELL_CLASS}>
                      <div className="flex flex-wrap items-center gap-1.5">

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedLicenceId(licence.id)}
                        >
                          View
                        </Button>

                        {canUpdateSoftware && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditor(licence)}
                          >
                            Edit
                          </Button>
                        )}

                        {canAllocate && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!canAllocateLicence(licence, today)}
                            onClick={() => openAllocation(licence)}
                          >
                            Allocate
                          </Button>
                        )}

                        {canUpdateSoftware && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openRenewal(licence)}
                          >
                            Renew
                          </Button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredSoftware.length}
          onPageChange={setPage}
          onPageSizeChange={value => {
            setPageSize(value);
            setPage(1);
          }}
        />

      </Card>

      {/* EMPLOYEE LICENCE ALLOCATION HISTORY */}

      {showAllocations && (
        <Card
          title="Employee Licence Allocations"
          subText="Track individual software assignments and reclaim released seats."
          action={
            canExport ? (
              <Button
                variant="secondary"
                size="sm"
                icon={IconDownload}
                disabled={!filteredAllocations.length}
                onClick={exportAllocations}
              >
                Export CSV
              </Button>
            ) : null
          }
        >

          {summary.untracked > 0 && (
            <div className="p-3 rounded-xl bg-surface2/40 border border-line text-[12px] text-muted">
              {summary.untracked} occupied seats are recorded only as aggregate usage.
              Employee-wise history is available for allocations recorded individually.
              Aggregate usage can be corrected through Edit Licence.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">

            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />

              <input
                value={allocationSearch}
                onChange={event => setAllocationSearch(event.target.value)}
                placeholder="Search employee or software..."
                aria-label="Search licence allocations"
                className={`${FILTER_CLASS} w-full pl-8`}
              />
            </div>

            <select
              value={allocationStatusFilter}
              onChange={event => setAllocationStatusFilter(event.target.value)}
              className={FILTER_CLASS}
              aria-label="Filter allocation status"
            >
              <option value="All">All Allocations</option>
              <option value="active">Active</option>
              <option value="released">Released</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAllocationSearch('');
                setAllocationStatusFilter('All');
              }}
            >
              Reset
            </Button>

          </div>

          {!filteredAllocations.length ? (
            <EmptyState
              icon={IconUsers}
              message="No individual employee allocation records found."
            />
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1080px] text-left border-collapse">

                <thead>
                  <tr className="border-b border-line">
                    {[
                      'Software',
                      'Employee ID',
                      'Employee',
                      'Department',
                      'Allocated Date',
                      'Released Date',
                      'Status',
                      'Action'
                    ].map(label => (
                      <th key={label} scope="col" className={HEADER_CLASS}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-dashed divide-line">

                  {paginatedAllocations.map(item => {
                    const released =
                      Boolean(item.releasedAt) ||
                      normalize(item.status) === 'released';

                    const licence = software.find(
                      record => record.id === item.licenceId
                    );

                    return (
                      <tr
                        key={`${item.licenceId}-${item.id}`}
                        className="hover:bg-surface2/40"
                      >
                        <td className={`${CELL_CLASS} font-semibold text-ink`}>
                          {item.softwareName}
                        </td>

                        <td className={`${CELL_CLASS} font-data text-accent`}>
                          {item.employeeId || '—'}
                        </td>

                        <td className={`${CELL_CLASS} text-ink`}>
                          {item.userName}
                        </td>

                        <td className={`${CELL_CLASS} text-muted`}>
                          {item.department || '—'}
                        </td>

                        <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>
                          {item.allocatedAt}
                        </td>

                        <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>
                          {item.releasedAt || '—'}
                        </td>

                        <td className={CELL_CLASS}>
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                            released
                              ? 'bg-surface2 border-line text-muted'
                              : 'bg-good/10 border-good/30 text-good'
                          }`}>
                            {released ? 'Released' : 'Active'}
                          </span>
                        </td>

                        <td className={CELL_CLASS}>
                          {!released && canUpdateSoftware && licence ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => requestRelease(licence, item)}
                            >
                              Reclaim Seat
                            </Button>
                          ) : (
                            <span className="text-muted text-[11px]">
                              {released ? 'Completed' : 'Read only'}
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

          <Pagination
            page={currentAllocationPage}
            pageSize={allocationPageSize}
            total={filteredAllocations.length}
            onPageChange={setAllocationPage}
            onPageSizeChange={value => {
              setAllocationPageSize(value);
              setAllocationPage(1);
            }}
          />

        </Card>
      )}

      {/* RENEWAL MANAGEMENT */}

      {showRenewals && (
        <Card
          title={`Licence Renewal Queue (${displayedRenewals.length})`}
          subText="Review expired contracts and software renewals due within 60 days."
        >

          {!displayedRenewals.length ? (
            <EmptyState
              icon={IconCheck}
              message="No matching software renewals require attention."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">

              {displayedRenewals.map(licence => {
                const days = getDaysRemaining(licence, today);
                const expired = days < 0;

                return (
                  <div
                    key={licence.id}
                    className={`p-4 rounded-xl border bg-surface2/40 flex flex-col gap-3 ${
                      expired ? 'border-bad/40' : 'border-warn/30'
                    }`}
                  >

                    <RenewalStatus licence={licence} today={today} />

                    <div>
                      <h3 className="font-bold text-[15px] text-ink">
                        {licence.name}
                      </h3>

                      <p className="text-[12px] text-muted mt-1">
                        {licence.vendor}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">

                      <DetailField
                        label="Expiry Date"
                        value={dateLabel(getExpiry(licence))}
                      />

                      <DetailField
                        label="Annual Cost"
                        value={formatCurrency(getAnnualCost(licence))}
                      />

                    </div>

                    <SeatUsage licence={licence} />

                    {canUpdateSoftware && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openRenewal(licence)}
                        className="w-full"
                      >
                        Record Renewal
                      </Button>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </Card>
      )}

      {/* LICENCE DETAILS MODAL */}

      {selectedLicence && (
        <RecordDetailsModal
          isOpen
          onClose={() => setSelectedLicenceId(null)}
          title={`Licence Details · ${selectedLicence.name}`}
          record={selectedLicence}
          fields={[
            { label: 'Licence ID', value: selectedLicence.id },
            { label: 'Software Name', value: selectedLicence.name },
            { label: 'Vendor', value: selectedLicence.vendor },
            { label: 'Version', value: selectedLicence.version || 'Cloud' },
            { label: 'Licence Key', value: maskKey(selectedLicence.licenseKey) },
            { label: 'Licence Model', value: getModel(selectedLicence) },
            { label: 'Category', value: selectedLicence.category },
            { label: 'Total Seats', value: selectedLicence.totalSeats },
            { label: 'Allocated Seats', value: selectedLicence.seatsUsed },
            { label: 'Available Seats', value: getAvailableSeats(selectedLicence) },
            { label: 'Tracked Employee Allocations', value: getActiveAllocations(selectedLicence).length },
            { label: 'Unidentified Occupied Seats', value: getUntrackedSeats(selectedLicence) },
            { label: 'Annual Cost', value: formatCurrency(getAnnualCost(selectedLicence)) },
            { label: 'Expiry Date', value: dateLabel(getExpiry(selectedLicence)) },
            { label: 'Days Remaining', value: getDaysRemaining(selectedLicence, today) },
            { label: 'Renewal Status', value: getRenewalStatus(selectedLicence, today) }
          ]}
          canExport={canExport}
          exportData={{
            ...selectedLicence,
            licenseKey: maskKey(selectedLicence.licenseKey),
            daysToRenewal: getDaysRemaining(selectedLicence, today),
            renewalStatus: getRenewalStatus(selectedLicence, today)
          }}
          exportFilename={`software-licence-${selectedLicence.id}.json`}
          headerActions={
            <div className="flex flex-wrap gap-2">
              {canUpdateSoftware && (
                <Button
                  variant="secondary"
                  onClick={() => openEditor(selectedLicence)}
                >
                  Edit Licence
                </Button>
              )}

              {canAllocate && (
                <Button
                  variant="primary"
                  disabled={!canAllocateLicence(selectedLicence, today)}
                  onClick={() => openAllocation(selectedLicence)}
                >
                  Allocate Seat
                </Button>
              )}

              {canUpdateSoftware && (
                <Button
                  variant="secondary"
                  onClick={() => openRenewal(selectedLicence)}
                >
                  Renew Licence
                </Button>
              )}
            </div>
          }
        >

          {/* ALLOCATED EMPLOYEES */}

          <section className="p-4 rounded-xl bg-surface2/30 border border-line">

            <h3 className="font-bold text-[15px] text-ink mb-3">
              Employee Allocation History
            </h3>

            {!getAllocations(selectedLicence).length ? (
              <p className="text-[12px] text-muted">
                No individual employee allocations have been recorded.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-dashed divide-line">

                {getAllocations(selectedLicence).map(allocation => {
                  const released =
                    Boolean(allocation.releasedAt) ||
                    normalize(allocation.status) === 'released';

                  return (
                    <div
                      key={allocation.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex flex-col gap-1">

                        <span className="font-semibold text-[13px] text-ink">
                          {allocation.userName} · {allocation.employeeId}
                        </span>

                        <span className="text-[11px] text-muted">
                          Allocated: {allocation.allocatedAt}
                        </span>

                        {allocation.releasedAt && (
                          <span className="text-[11px] text-muted">
                            Released: {allocation.releasedAt}
                          </span>
                        )}

                        {allocation.notes && (
                          <span className="text-[12px] text-muted">
                            {allocation.notes}
                          </span>
                        )}

                      </div>

                      {released ? (
                        <Tag>Released</Tag>
                      ) : canUpdateSoftware ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            requestRelease(selectedLicence, allocation);
                            setSelectedLicenceId(null);
                          }}
                        >
                          Reclaim Seat
                        </Button>
                      ) : (
                        <StatusPill status="active" />
                      )}

                    </div>
                  );
                })}

              </div>
            )}

          </section>

          {/* RENEWAL HISTORY */}

          <section className="p-4 rounded-xl bg-surface2/30 border border-line">

            <h3 className="font-bold text-[15px] text-ink mb-3">
              Renewal History
            </h3>

            {!getRenewalHistory(selectedLicence).length ? (
              <p className="text-[12px] text-muted">
                No renewal transactions have been recorded.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-dashed divide-line">

                {getRenewalHistory(selectedLicence).map(entry => (
                  <div key={entry.id} className="py-3 flex flex-col gap-1">

                    <span className="text-[13px] font-semibold text-good">
                      Renewed until {entry.newExpiry}
                    </span>

                    <span className="text-[12px] text-muted">
                      Previous expiry: {entry.previousExpiry || '—'}
                    </span>

                    <span className="text-[11px] text-muted">
                      Recorded by {entry.renewedBy} · {entry.renewedAt}
                    </span>

                    {entry.notes && (
                      <p className="text-[12px] text-ink">
                        {entry.notes}
                      </p>
                    )}

                  </div>
                ))}

              </div>
            )}

          </section>

          {/* PRESERVED INSTALLATION HISTORY */}

          <section className="p-4 rounded-xl bg-surface2/30 border border-line">

            <h3 className="font-bold text-[15px] text-ink mb-3">
              Previous Installation Records
            </h3>

            {selectedLicence.installationHistory?.length ? (
              <div className="flex flex-col divide-y divide-dashed divide-line">

                {selectedLicence.installationHistory.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="py-3 text-[12px] text-ink"
                  >
                    <span className="font-semibold">
                      {entry.userName || 'Organization deployment'}
                    </span>

                    <span className="block text-muted">
                      {entry.method || 'Recorded installation'} · {entry.status || 'Recorded'}
                    </span>

                    <span className="block text-muted">
                      {entry.installedAt}
                    </span>
                  </div>
                ))}

              </div>
            ) : (
              <p className="text-[12px] text-muted">
                No installation history recorded.
              </p>
            )}

          </section>

        </RecordDetailsModal>
      )}

      {/* EDIT LICENCE DRAWER */}

      {canUpdateSoftware && editingLicence && licenceEditor && (
        <Drawer
          isOpen
          isCentered
          width="min(640px, 94vw)"
          maxWidth="min(640px, 94vw)"
          className="!h-auto max-h-[90vh]"
          title={`Edit Licence · ${editingLicence.name}`}
          onClose={closeEditor}
          footer={
            <div className="flex flex-col gap-3">

              <FormError message={editError} />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeEditor}>
                  Cancel
                </Button>

                <Button variant="primary" onClick={saveLicence}>
                  Save Changes
                </Button>
              </div>

            </div>
          }
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field label="Software Name *">
              <input
                value={licenceEditor.name}
                onChange={event => updateEditorField('name', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Vendor *">
              <input
                value={licenceEditor.vendor}
                onChange={event => updateEditorField('vendor', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Version">
              <input
                value={licenceEditor.version}
                onChange={event => updateEditorField('version', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Licence Key">
              <input
                type="password"
                autoComplete="new-password"
                value={licenceEditor.licenseKey}
                onChange={event => updateEditorField('licenseKey', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Licence Model">
              <select
                value={licenceEditor.subscriptionModel}
                onChange={event => updateEditorField('subscriptionModel', event.target.value)}
                className={INPUT_CLASS}
              >
                {modelOptions.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </Field>

            <Field label="Category">
              <select
                value={licenceEditor.category}
                onChange={event => updateEditorField('category', event.target.value)}
                className={INPUT_CLASS}
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </Field>

            <Field label="Total Seat Capacity *">
              <input
                type="number"
                min="1"
                step="1"
                value={licenceEditor.totalSeats}
                onChange={event => updateEditorField('totalSeats', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Occupied Seats *">
              <input
                type="number"
                min={getActiveAllocations(editingLicence).length}
                max={licenceEditor.totalSeats}
                step="1"
                value={licenceEditor.seatsUsed}
                onChange={event => updateEditorField('seatsUsed', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Annual Cost (INR) *">
              <input
                type="number"
                min="0"
                step="0.01"
                value={licenceEditor.annualCost}
                onChange={event => updateEditorField('annualCost', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Expiry / Renewal Date">
              <input
                type="date"
                value={licenceEditor.expiryDate}
                onChange={event => updateEditorField('expiryDate', event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

          </div>

          <div className="mt-3 p-3 rounded-lg bg-surface2/40 border border-line text-[12px] text-muted">
            Employee allocations remain unchanged when editing licence metadata.
            Occupied seats cannot be reduced below the number of active employee allocations.
          </div>

        </Drawer>
      )}

      {/* ALLOCATE LICENCE DRAWER */}

      {canAllocate && allocationLicence && (
        <Drawer
          isOpen
          isCentered
          width="min(520px, 94vw)"
          maxWidth="min(520px, 94vw)"
          className="!h-auto max-h-[90vh]"
          title={`Allocate Licence · ${allocationLicence.name}`}
          onClose={closeAllocation}
          footer={
            <div className="flex flex-col gap-3">

              <FormError message={allocationError} />

              <div className="flex justify-end gap-2">

                <Button
                  variant="secondary"
                  onClick={closeAllocation}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  icon={IconCheck}
                  disabled={
                    !allocationUserId ||
                    !canAllocateLicence(allocationLicence, today)
                  }
                  onClick={allocateLicence}
                >
                  Confirm Allocation
                </Button>

              </div>

            </div>
          }
        >

          <div className="flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-2.5">

              <DetailField
                label="Total Seats"
                value={allocationLicence.totalSeats}
              />

              <DetailField
                label="Available Seats"
                value={getAvailableSeats(allocationLicence)}
              />

              <DetailField
                label="Software"
                value={allocationLicence.name}
              />

              <DetailField
                label="Expiry Date"
                value={dateLabel(getExpiry(allocationLicence))}
              />

            </div>

            <SeatUsage licence={allocationLicence} />

            <Field label="Select Active Employee *">
              <select
                value={allocationUserId}
                onChange={event => {
                  setAllocationUserId(event.target.value);
                  setAllocationError('');
                }}
                className={INPUT_CLASS}
              >
                <option value="">-- Choose employee --</option>

                {eligibleEmployees.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.employeeId || user.id} · {user.department}
                  </option>
                ))}
              </select>
            </Field>

            {!eligibleEmployees.length && (
              <p className="text-[12px] text-warn">
                No eligible employees remain for this licence.
              </p>
            )}

            <Field label="Allocation Notes">
              <textarea
                rows={3}
                maxLength={500}
                value={allocationNotes}
                onChange={event => setAllocationNotes(event.target.value)}
                placeholder="Enter software allocation purpose..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </Field>

            <div className="p-3 rounded-lg bg-good/10 border border-good/30 text-[12px] text-good">
              Confirming this allocation reserves one available seat and records the selected employee in the local allocation history.
              It does not install software or grant external application access.
            </div>

          </div>

        </Drawer>
      )}

      {/* RENEW LICENCE DRAWER */}

      {canUpdateSoftware && renewalLicence && (
        <Drawer
          isOpen
          isCentered
          width="min(520px, 94vw)"
          maxWidth="min(520px, 94vw)"
          className="!h-auto max-h-[90vh]"
          title={`Renew Licence · ${renewalLicence.name}`}
          onClose={closeRenewal}
          footer={
            <div className="flex flex-col gap-3">

              <FormError message={renewalError} />

              <div className="flex justify-end gap-2">

                <Button variant="secondary" onClick={closeRenewal}>
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  icon={IconCheck}
                  onClick={confirmRenewal}
                  disabled={!renewalDate}
                >
                  Record Renewal
                </Button>

              </div>

            </div>
          }
        >

          <div className="flex flex-col gap-4">

            <RenewalStatus licence={renewalLicence} today={today} />

            <div className="grid grid-cols-2 gap-3">

              <DetailField
                label="Current Expiry"
                value={dateLabel(getExpiry(renewalLicence))}
              />

              <DetailField
                label="Annual Cost"
                value={formatCurrency(getAnnualCost(renewalLicence))}
              />

            </div>

            <Field label="New Expiry Date *">
              <input
                type="date"
                value={renewalDate}
                min={today}
                onChange={event => {
                  setRenewalDate(event.target.value);
                  setRenewalError('');
                }}
                className={INPUT_CLASS}
              />
            </Field>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRenewalDate(getNewRenewalDate(renewalLicence, today))}
            >
              Extend by One Year
            </Button>

            <Field label="Renewal Remarks">
              <textarea
                rows={3}
                maxLength={500}
                value={renewalNotes}
                onChange={event => setRenewalNotes(event.target.value)}
                placeholder="Enter renewal reference or approval remarks..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </Field>

            <div className="p-3 rounded-xl bg-surface2/40 border border-line text-[12px] text-muted">
              This records the renewed expiry date and preserves the previous date in renewal history.
              Vendor purchases and billing are not processed through this frontend.
            </div>

          </div>

        </Drawer>
      )}

      {/* RECLAIM CONFIRMATION */}

      <ConfirmDialog
        isOpen={Boolean(releaseTarget && canUpdateSoftware)}
        title="Reclaim Software Licence"
        message={`Release the ${releaseTarget?.softwareName || 'software'} seat allocated to ${releaseTarget?.employeeName || 'this employee'}? This will make one seat available and retain the allocation history.`}
        confirmLabel="Reclaim Seat"
        onConfirm={releaseLicence}
        onCancel={() => setReleaseTarget(null)}
      />

    </div>
  );
}
