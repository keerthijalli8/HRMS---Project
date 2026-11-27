
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';
import { BarChart } from '../shared/SVGChart';
import { StatusPill } from '../shared/StatusPill';
import { EmptyState } from '../shared/EmptyState';

import {
  IconChart,
  IconDownload,
  IconPrinter,
  IconUsers,
  IconLaptop,
  IconClock,
  IconShield,
  IconCheck,
  IconSearch,
  IconX
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const TIME_ZONE = 'Asia/Kolkata';
const DAY_MS = 86400000;
const PAGE_SIZES = [5, 10, 20, 50];

const REPORT_MODULES = {
  user_accounts: 'User Profiles',
  asset_status: 'Assets',
  warranty: 'Assets',
  licences: 'Software',
  resolution: 'Helpdesk'
};

const REPORT_NAMES = {
  user_accounts: 'User Accounts Report',
  asset_status: 'Asset Status Report',
  warranty: 'Warranty Expiry Report',
  licences: 'Software Licence Report',
  resolution: 'Ticket Resolution & SLA Report'
};

const DATE_LABELS = {
  user_accounts: 'Joining Date',
  asset_status: 'Purchase Date',
  warranty: 'Warranty Expiry Date',
  licences: 'Renewal Date',
  resolution: 'Ticket Created Date'
};

const FILTER_CLASS =
  'px-3 py-1.5 text-[12px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const STATUS_COLORS = {
  active: 'var(--good)',
  assigned: 'var(--info)',
  'in stock': 'var(--good)',
  'in repair': 'var(--warn)',
  'overdue return': 'var(--warn)',
  retired: 'var(--bad)',
  suspended: 'var(--warn)',
  deactivated: 'var(--bad)',
  provisioning: 'var(--info)',
  open: 'var(--info)',
  'in progress': 'var(--accent)',
  'on hold': 'var(--warn)',
  resolved: 'var(--good)',
  closed: 'var(--good)',
  'breached SLA': 'var(--bad)'
};

// ============================================================
// UTILITIES
// ============================================================

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const numeric = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const money = value =>
  `₹${numeric(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  })}`;

const percentage = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const unique = values =>
  [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));

const capitalize = value =>
  String(value || '').replace(/\b\w/g, letter =>
    letter.toUpperCase()
  );

function parseDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim();

  // Support existing project dates and ISO dates.
  // Example: 23 Nov 2026, 11:15 IST

  text = text.replace(/\bIST\b/gi, 'GMT+0530');

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    text += 'T00:00:00+05:30';
  } else if (/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}$/.test(text)) {
    text += ' 00:00:00 GMT+0530';
  }

  const parsed = Date.parse(text);

  return Number.isFinite(parsed) ? parsed : null;
}

function getDateKey(value = Date.now()) {
  const timestamp = parseDate(value);

  if (timestamp === null) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(new Date(timestamp));

  const get = type =>
    parts.find(part => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function daysUntil(value, today) {
  const expiry = getDateKey(value);

  if (!expiry || !today) return null;

  return Math.round(
    (
      Date.parse(`${expiry}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)
    ) / DAY_MS
  );
}

function getWarrantyStatus(asset, today) {
  const days = daysUntil(asset.warrantyEnd, today);

  if (days === null) return 'Not recorded';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days <= 30) return 'Expiring in 30 days';
  if (days <= 60) return 'Expiring in 31–60 days';
  if (days <= 90) return 'Expiring in 61–90 days';

  return 'Under warranty';
}

function getLicenceStatus(licence, today) {
  const days = daysUntil(
    licence.expiryDate || licence.renewalDate,
    today
  );

  if (days !== null && days < 0) return 'expired';
  if (days !== null && days <= 30) return 'expiring soon';

  return licence.renewalStatus || licence.status || 'active';
}

function isResolved(ticket) {
  return ['resolved', 'closed'].includes(
    normalize(ticket.status)
  );
}

function getRecordedElapsed(ticket) {
  if (
    ticket.slaElapsedHours === null ||
    ticket.slaElapsedHours === undefined ||
    ticket.slaElapsedHours === ''
  ) {
    return null;
  }

  const value = Number(ticket.slaElapsedHours);

  return Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getResolutionHours(ticket) {
  if (!isResolved(ticket)) return null;

  const created = parseDate(ticket.createdAt);
  const resolved = parseDate(ticket.resolvedAt);

  if (
    created !== null &&
    resolved !== null &&
    resolved >= created
  ) {
    return (resolved - created) / 3600000;
  }

  // Existing records may contain recorded SLA elapsed
  // hours but no explicit resolution timestamp.
  return getRecordedElapsed(ticket);
}

function getSlaResult(ticket) {
  const target = Number(ticket.slaHours);

  if (normalize(ticket.status) === 'breached sla') {
    return 'Breached';
  }

  if (!Number.isFinite(target) || target <= 0) {
    return 'Not recorded';
  }

  if (isResolved(ticket)) {
    const elapsed = getResolutionHours(ticket);

    if (elapsed === null) return 'Not recorded';

    return elapsed <= target ? 'Met' : 'Breached';
  }

  const elapsed = getRecordedElapsed(ticket);

  if (elapsed === null) return 'Not recorded';

  return elapsed > target ? 'Breached' : 'In progress';
}

function groupCounts(records, getter) {
  const counts = {};

  records.forEach(record => {
    const key = getter(record) || 'Unspecified';
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
    color: STATUS_COLORS[label] || 'var(--accent)'
  }));
}

function safeCSV(value) {
  let text = String(value ?? '');

  // Prevent spreadsheet formula execution.
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

function getMaskedKey(value) {
  return value
    ? `•••• ${String(value).slice(-4)}`
    : 'Not recorded';
}

function sanitizeRecord(type, record) {
  if (type !== 'licences') return record;

  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) => !/licen[cs]e.?key/i.test(key)
    )
  );
}

// ============================================================
// REPORT TABLE CONFIGURATION
// ============================================================

function getColumns(type, today) {
  switch (type) {
    case 'user_accounts':
      return [
        { label: 'User ID', get: r => r.id },
        { label: 'Employee ID', get: r => r.employeeId },
        { label: 'Name', get: r => r.name },
        { label: 'Email', get: r => r.email },
        { label: 'Department', get: r => r.department },
        { label: 'Designation', get: r => r.role },
        { label: 'Status', get: r => r.status, status: true },
        { label: 'Location', get: r => r.location },
        { label: 'Joining Date', get: r => r.createdDate },
        { label: 'Last Login', get: r => r.lastLogin }
      ];

    case 'asset_status':
      return [
        { label: 'Asset ID', get: r => r.assetId || r.assetTag },
        { label: 'Asset Tag', get: r => r.assetTag },
        { label: 'Device Name', get: r => r.model || r.name },
        { label: 'Category', get: r => r.type || r.category },
        { label: 'Serial Number', get: r => r.serial },
        { label: 'Assigned Employee', get: r => r.assignedName || r.assignedEmployee || 'Unassigned' },
        { label: 'Location', get: r => r.location },
        { label: 'Condition', get: r => r.condition },
        { label: 'Status', get: r => r.status, status: true },
        { label: 'Purchase Date', get: r => r.purchaseDate },
        {
          label: 'Purchase Cost (INR)',
          get: r => numeric(r.cost ?? r.purchaseCost),
          format: money
        }
      ];

    case 'warranty':
      return [
        { label: 'Asset Tag', get: r => r.assetTag },
        { label: 'Device Name', get: r => r.model || r.name },
        { label: 'Category', get: r => r.type || r.category },
        { label: 'Location', get: r => r.location },
        { label: 'Purchase Date', get: r => r.purchaseDate },
        { label: 'Warranty Expiry', get: r => r.warrantyEnd },
        { label: 'Days Remaining', get: r => daysUntil(r.warrantyEnd, today) },
        { label: 'Warranty Status', get: r => getWarrantyStatus(r, today) },
        { label: 'Asset Status', get: r => r.status, status: true }
      ];

    case 'licences':
      return [
        { label: 'Software', get: r => r.name },
        { label: 'Vendor', get: r => r.vendor },
        { label: 'Licence Model', get: r => r.subscriptionModel || r.licenceType },
        { label: 'Total Seats', get: r => numeric(r.totalSeats) },
        { label: 'Used Seats', get: r => numeric(r.seatsUsed) },
        {
          label: 'Available Seats',
          get: r => Math.max(0, numeric(r.totalSeats) - numeric(r.seatsUsed))
        },
        {
          label: 'Utilisation (%)',
          get: r => percentage(numeric(r.seatsUsed), numeric(r.totalSeats)),
          format: value => `${value}%`
        },
        {
          label: 'Annual Cost (INR)',
          get: r => numeric(r.annualCost ?? r.costPerYear),
          format: money
        },
        { label: 'Renewal Date', get: r => r.expiryDate || r.renewalDate },
        {
          label: 'Days to Renewal',
          get: r => daysUntil(r.expiryDate || r.renewalDate, today)
        },
        { label: 'Status', get: r => getLicenceStatus(r, today), status: true }
      ];

    case 'resolution':
      return [
        { label: 'Ticket ID', get: r => r.id },
        { label: 'Subject', get: r => r.title },
        { label: 'Category', get: r => r.category },
        { label: 'Requester', get: r => r.requesterName },
        { label: 'Technician', get: r => r.assignedTo || 'Unassigned' },
        { label: 'Priority', get: r => r.priority, status: true },
        { label: 'Status', get: r => r.status, status: true },
        { label: 'Created Date', get: r => r.createdAt },
        { label: 'Resolved Date', get: r => r.resolvedAt },
        {
          label: 'SLA Target (h)',
          get: r => r.slaHours
        },
        {
          label: 'Recorded Elapsed (h)',
          get: r => getRecordedElapsed(r),
          format: value => `${Number(value).toFixed(1)}h`
        },
        {
          label: 'Resolution Time (h)',
          get: r => {
            const hours = getResolutionHours(r);
            return hours === null ? null : Number(hours.toFixed(2));
          },
          format: value => `${Number(value).toFixed(1)}h`
        },
        { label: 'SLA Result', get: getSlaResult }
      ];

    default:
      return [];
  }
}

function getReportDate(type, record) {
  switch (type) {
    case 'user_accounts':
      return record.createdDate || record.createdAt;

    case 'asset_status':
      return record.purchaseDate;

    case 'warranty':
      return record.warrantyEnd;

    case 'licences':
      return record.expiryDate || record.renewalDate;

    case 'resolution':
      return record.createdAt;

    default:
      return '';
  }
}

function getReportStatus(type, record, today) {
  if (type === 'warranty') {
    return getWarrantyStatus(record, today);
  }

  if (type === 'licences') {
    return getLicenceStatus(record, today);
  }

  return record.status || 'Unknown';
}

// ============================================================
// SUMMARY CALCULATIONS
// ============================================================

function calculateSummary(type, records, today) {
  const total = records.length;

  if (type === 'user_accounts') {
    return [
      { label: 'Total Users', value: total },
      {
        label: 'Active Accounts',
        value: records.filter(r => r.status === 'active').length,
        color: 'text-good'
      },
      {
        label: 'Provisioning',
        value: records.filter(r => r.status === 'provisioning').length,
        color: 'text-info'
      },
      {
        label: 'Suspended',
        value: records.filter(r => r.status === 'suspended').length,
        color: 'text-warn'
      },
      {
        label: 'Deactivated',
        value: records.filter(r => r.status === 'deactivated').length,
        color: 'text-bad'
      }
    ];
  }

  if (type === 'asset_status') {
    return [
      { label: 'Total Assets', value: total },
      {
        label: 'Assigned',
        value: records.filter(r => r.status === 'assigned').length,
        color: 'text-info'
      },
      {
        label: 'Available Stock',
        value: records.filter(r => r.status === 'in stock').length,
        color: 'text-good'
      },
      {
        label: 'In Repair',
        value: records.filter(r => r.status === 'in repair').length,
        color: 'text-warn'
      },
      {
        label: 'Overdue Returns',
        value: records.filter(r => r.status === 'overdue return').length,
        color: 'text-bad'
      },
      {
        label: 'Retired',
        value: records.filter(r => r.status === 'retired').length
      },
      {
        label: 'Total Purchase Value',
        value: money(records.reduce(
          (sum, r) => sum + numeric(r.cost ?? r.purchaseCost), 0
        )),
        color: 'text-accent'
      }
    ];
  }

  if (type === 'warranty') {
    const expiryDays = records.map(
      r => daysUntil(r.warrantyEnd, today)
    );

    return [
      { label: 'Total Assets', value: total },
      {
        label: 'Expired',
        value: expiryDays.filter(d => d !== null && d < 0).length,
        color: 'text-bad'
      },
      {
        label: 'Due in 0–30 Days',
        value: expiryDays.filter(d => d !== null && d >= 0 && d <= 30).length,
        color: 'text-warn'
      },
      {
        label: 'Due in 31–60 Days',
        value: expiryDays.filter(d => d !== null && d > 30 && d <= 60).length
      },
      {
        label: 'Due in 61–90 Days',
        value: expiryDays.filter(d => d !== null && d > 60 && d <= 90).length
      },
      {
        label: 'Coverage Beyond 90 Days',
        value: expiryDays.filter(d => d !== null && d > 90).length,
        color: 'text-good'
      },
      {
        label: 'Warranty Not Recorded',
        value: expiryDays.filter(d => d === null).length
      }
    ];
  }

  if (type === 'licences') {
    const totalSeats = records.reduce(
      (sum, r) => sum + numeric(r.totalSeats), 0
    );

    const usedSeats = records.reduce(
      (sum, r) => sum + numeric(r.seatsUsed), 0
    );

    const annualCost = records.reduce(
      (sum, r) => sum + numeric(r.annualCost ?? r.costPerYear), 0
    );

    return [
      { label: 'Software Licences', value: total },
      { label: 'Total Seats', value: totalSeats },
      { label: 'Used Seats', value: usedSeats, color: 'text-info' },
      {
        label: 'Available Seats',
        value: Math.max(0, totalSeats - usedSeats),
        color: 'text-good'
      },
      {
        label: 'Seat Utilisation',
        value: totalSeats > 0 ? `${percentage(usedSeats, totalSeats)}%` : '—'
      },
      {
        label: 'Expiring Soon',
        value: records.filter(r => {
          const days = daysUntil(r.expiryDate || r.renewalDate, today);
          return days !== null && days >= 0 && days <= 30;
        }).length,
        color: 'text-warn'
      },
      {
        label: 'Expired Licences',
        value: records.filter(r =>
          getLicenceStatus(r, today) === 'expired'
        ).length,
        color: 'text-bad'
      },
      {
        label: 'Annual Software Cost',
        value: money(annualCost),
        color: 'text-accent'
      }
    ];
  }

  const resolved = records.filter(isResolved);

  const met = resolved.filter(
    r => getSlaResult(r) === 'Met'
  ).length;

  const missed = resolved.filter(
    r => getSlaResult(r) === 'Breached'
  ).length;

  const measured = met + missed;

  const resolutionTimes = resolved
    .map(getResolutionHours)
    .filter(hours => hours !== null);

  const averageHours = resolutionTimes.length
    ? resolutionTimes.reduce((sum, hours) => sum + hours, 0) /
      resolutionTimes.length
    : null;

  return [
    { label: 'Total Tickets', value: total },
    {
      label: 'Unresolved Tickets',
      value: total - resolved.length,
      color: 'text-info'
    },
    {
      label: 'Resolved / Closed',
      value: resolved.length,
      color: 'text-good'
    },
    {
      label: 'Resolution Rate',
      value: total ? `${percentage(resolved.length, total)}%` : '—',
      color: 'text-good'
    },
    {
      label: 'SLA Breaches',
      value: records.filter(r => getSlaResult(r) === 'Breached').length,
      color: 'text-bad'
    },
    {
      label: 'Resolved Within SLA',
      value: measured ? `${percentage(met, measured)}%` : '—',
      color: 'text-accent'
    },
    {
      label: 'Average Resolution Time',
      value: averageHours === null ? '—' : `${averageHours.toFixed(1)}h`
    },
    {
      label: 'Resolved With SLA Data',
      value: `${measured} / ${resolved.length}`
    }
  ];
}

// ============================================================
// CHART DATA
// ============================================================

function getChartData(type, records, today) {
  if (type === 'user_accounts') {
    return groupCounts(records, r => r.department);
  }

  if (type === 'asset_status') {
    return groupCounts(records, r => r.status).map(item => ({
      ...item,
      label: capitalize(item.label)
    }));
  }

  if (type === 'warranty') {
    const days = records.map(
      r => daysUntil(r.warrantyEnd, today)
    );

    return [
      {
        label: 'Expired',
        value: days.filter(d => d !== null && d < 0).length,
        color: 'var(--bad)'
      },
      {
        label: '0–30d',
        value: days.filter(d => d !== null && d >= 0 && d <= 30).length,
        color: 'var(--warn)'
      },
      {
        label: '31–60d',
        value: days.filter(d => d !== null && d > 30 && d <= 60).length,
        color: 'var(--info)'
      },
      {
        label: '61–90d',
        value: days.filter(d => d !== null && d > 60 && d <= 90).length,
        color: 'var(--accent)'
      },
      {
        label: '90+d',
        value: days.filter(d => d !== null && d > 90).length,
        color: 'var(--good)'
      },
      {
        label: 'Unknown',
        value: days.filter(d => d === null).length,
        color: 'var(--muted)'
      }
    ];
  }

  if (type === 'licences') {
    return records.map(record => {
      const value = percentage(
        numeric(record.seatsUsed),
        numeric(record.totalSeats)
      );

      return {
        label: String(record.name || 'Software'),
        value,
        color:
          value >= 100
            ? 'var(--bad)'
            : value >= 85
              ? 'var(--warn)'
              : 'var(--accent)'
      };
    });
  }

  const slaResults = records.map(getSlaResult);

  return [
    {
      label: 'SLA Met',
      value: slaResults.filter(r => r === 'Met').length,
      color: 'var(--good)'
    },
    {
      label: 'Breached',
      value: slaResults.filter(r => r === 'Breached').length,
      color: 'var(--bad)'
    },
    {
      label: 'Pending',
      value: slaResults.filter(r => r === 'In progress').length,
      color: 'var(--info)'
    },
    {
      label: 'Unknown',
      value: slaResults.filter(r => r === 'Not recorded').length,
      color: 'var(--muted)'
    }
  ];
}

// ============================================================
// REPORT RECORD DETAILS
// ============================================================

function getRecordFields(type, record, today) {
  if (!record) return [];

  const field = (label, value, key, extra = {}) => ({
    label,
    value,
    ...(key ? { key, editable: true } : {}),
    ...extra
  });

  const options = values =>
    values.map(value => ({
      value,
      label: capitalize(value)
    }));

  if (type === 'user_accounts') {
    return [
      field('User ID', record.id),
      field('Employee ID', record.employeeId),
      field('Full Name', record.name, 'name'),
      field('Email', record.email, 'email'),
      field('Department', record.department, 'department'),
      field('Designation', record.role, 'role'),
      field('Location', record.location, 'location'),
      field('Joining Date', record.createdDate),
      field('Last Login', record.lastLogin),
      field('Account Status', record.status, 'status', {
        type: 'select',
        options: options([
          'active', 'provisioning', 'suspended', 'deactivated'
        ])
      })
    ];
  }

  if (type === 'asset_status' || type === 'warranty') {
    return [
      field('Asset ID', record.assetId || record.assetTag),
      field('Asset Tag', record.assetTag),
      field('Device Name', record.model, 'model'),
      field('Category', record.type || record.category),
      field('Serial Number', record.serial),
      field('Purchase Date', record.purchaseDate),
      field('Purchase Cost', money(record.cost ?? record.purchaseCost)),
      field('Assigned Employee', record.assignedName || record.assignedEmployee || 'Unassigned'),
      field('Location', record.location, 'location'),
      field('Condition', record.condition, 'condition', {
        type: 'select',
        options: options(['good', 'fair', 'poor', 'damaged'])
      }),
      field('Lifecycle Status', record.status),
      field('Warranty Expiry', record.warrantyEnd, 'warrantyEnd'),
      field('Warranty Status', getWarrantyStatus(record, today)),
      field('Days to Warranty Expiry', daysUntil(record.warrantyEnd, today))
    ];
  }

  if (type === 'licences') {
    return [
      field('Software ID', record.id),
      field('Software Name', record.name, 'name'),
      field('Vendor', record.vendor, 'vendor'),
      field('Licence Key', getMaskedKey(record.licenseKey)),
      field('Licence Model', record.subscriptionModel || record.licenceType),
      field('Seats Used', record.seatsUsed, 'seatsUsed', { type: 'number' }),
      field('Total Seats', record.totalSeats, 'totalSeats', { type: 'number' }),
      field('Available Seats', Math.max(
        0, numeric(record.totalSeats) - numeric(record.seatsUsed)
      )),
      field('Annual Cost (INR)', record.annualCost ?? record.costPerYear, 'annualCost', {
        type: 'number'
      }),
      field('Renewal Date', record.expiryDate || record.renewalDate, 'renewalDate'),
      field('Renewal Status', getLicenceStatus(record, today)),
      field('Days to Renewal', daysUntil(record.expiryDate || record.renewalDate, today))
    ];
  }

  return [
    field('Ticket ID', record.id),
    field('Subject', record.title, 'title'),
    field('Requester', record.requesterName),
    field('Requester Email', record.requesterEmail),
    field('Category', record.category),
    field('Priority', record.priority, 'priority', {
      type: 'select',
      options: options(['critical', 'high', 'medium', 'low'])
    }),
    field('Assigned Technician', record.assignedTo, 'assignedTo'),
    field('Status', record.status, 'status', {
      type: 'select',
      options: options([
        'open', 'in progress', 'on hold',
        'breached SLA', 'resolved', 'closed'
      ])
    }),
    field('Description', record.description),
    field('Created Date', record.createdAt),
    field('Resolved Date', record.resolvedAt),
    field('SLA Target Hours', record.slaHours),
    field('Recorded SLA Elapsed Hours', getRecordedElapsed(record)),
    field('Resolution Hours', getResolutionHours(record)),
    field('SLA Result', getSlaResult(record)),
    field('Resolution Note', record.resolutionNote, 'resolutionNote')
  ];
}

// ============================================================
// SHARED REPORT COMPONENTS
// ============================================================

function SummaryCards({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map(item => (
        <div
          key={item.label}
          className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            {item.label}
          </span>

          <span className={`font-display font-bold text-[22px] tabular-nums break-words ${item.color || 'text-ink'}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportCell({ column, record }) {
  const value = column.get(record);

  if (value === null || value === undefined || value === '') {
    return <span className="text-muted">—</span>;
  }

  if (column.status) {
    return <StatusPill status={value} />;
  }

  if (column.label === 'SLA Result') {
    const color =
      value === 'Met'
        ? 'text-good bg-good/10 border-good/30'
        : value === 'Breached'
          ? 'text-bad bg-bad/10 border-bad/30'
          : 'text-muted bg-surface2 border-line';

    return (
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${color}`}>
        {value}
      </span>
    );
  }

  if (column.label === 'Warranty Status') {
    const color =
      value === 'Expired'
        ? 'text-bad'
        : value.startsWith('Expiring') || value === 'Expires today'
          ? 'text-warn'
          : value === 'Under warranty'
            ? 'text-good'
            : 'text-muted';

    return <span className={`font-semibold ${color}`}>{value}</span>;
  }

  return (
    <span className="text-ink">
      {column.format ? column.format(value) : String(value)}
    </span>
  );
}

// ============================================================
// MAIN IT REPORTS PAGE
// ============================================================

export function ITReportsPage() {
  const {
    assets = [],
    software = [],
    tickets = [],
    users = [],
    updateUser,
    updateAsset,
    updateSoftwareLicence,
    updateTicket,
    hasPermission,
    showToast
  } = useStore();

  const canReadReports = hasPermission('Reports', 'read');
  const canReadUsers = hasPermission('User Profiles', 'read');

  const [requestedReportTab, setActiveReportTab] =
    useState('asset_status');

  const [search, setSearch] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [dateRange, setDateRange] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [warrantyWindow, setWarrantyWindow] = useState('All');
  const [slaFilter, setSlaFilter] = useState('All');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sortColumn, setSortColumn] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const [selectedReportRecord, setSelectedReportRecord] =
    useState(null);

  const [today, setToday] = useState(() => getDateKey());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday(getDateKey());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  // ==========================================================
  // DYNAMIC CATEGORY KPIs
  // ==========================================================

  const totalAssetValue = assets.reduce(
    (sum, asset) => sum + numeric(asset.cost ?? asset.purchaseCost), 0
  );

  const upcomingWarranties = assets.filter(asset => {
    const days = daysUntil(asset.warrantyEnd, today);
    return days !== null && days >= 0 && days <= 90;
  }).length;

  const expiredWarranties = assets.filter(asset => {
    const days = daysUntil(asset.warrantyEnd, today);
    return days !== null && days < 0;
  }).length;

  const totalLicenceSeats = software.reduce(
    (sum, record) => sum + numeric(record.totalSeats), 0
  );

  const usedLicenceSeats = software.reduce(
    (sum, record) => sum + numeric(record.seatsUsed), 0
  );

  const resolvedTickets = tickets.filter(isResolved);

  const measuredSlaTickets = resolvedTickets.filter(ticket =>
    ['Met', 'Breached'].includes(getSlaResult(ticket))
  );

  const metSlaTickets = measuredSlaTickets.filter(
    ticket => getSlaResult(ticket) === 'Met'
  );

  const slaCompliance = measuredSlaTickets.length
    ? percentage(metSlaTickets.length, measuredSlaTickets.length)
    : null;

  const REPORT_CATEGORIES = [
    {
      id: 'user_accounts',
      title: 'User Accounts',
      subtext: 'Account lifecycle and department distribution',
      metric: String(users.length),
      metricLabel: 'Directory users',
      status: `${users.filter(u => u.status === 'active').length} Active`,
      statusColor: 'sky',
      icon: IconUsers
    },
    {
      id: 'asset_status',
      title: 'Asset Status',
      subtext: `${assets.filter(a => a.status === 'in stock').length} devices available`,
      metric: String(assets.length),
      metricLabel: 'Hardware units',
      status: money(totalAssetValue),
      statusColor: 'emerald',
      icon: IconLaptop
    },
    {
      id: 'warranty',
      title: 'Warranty Expiry',
      subtext: 'Upcoming warranty renewals',
      metric: String(upcomingWarranties),
      metricLabel: 'Due within 90 days',
      status: `${expiredWarranties} Expired`,
      statusColor: expiredWarranties ? 'red' : 'emerald',
      icon: IconClock
    },
    {
      id: 'licences',
      title: 'Licence Utilisation',
      subtext: 'Seat allocation and annual spending',
      metric: String(software.length),
      metricLabel: 'Software licences',
      status: totalLicenceSeats
        ? `${percentage(usedLicenceSeats, totalLicenceSeats)}% Used`
        : 'No seats',
      statusColor: 'purple',
      icon: IconShield
    },
    {
      id: 'resolution',
      title: 'Ticket Resolution & SLA',
      subtext: `${resolvedTickets.length} resolved or closed`,
      metric: String(tickets.length),
      metricLabel: 'Support tickets',
      status: slaCompliance === null
        ? 'No SLA data'
        : `${slaCompliance}% SLA Met`,
      statusColor: slaCompliance === null
        ? 'sky'
        : slaCompliance >= 90 ? 'emerald' : 'amber',
      icon: IconCheck
    }
  ];

  const visibleReportCategories = REPORT_CATEGORIES.filter(
    category =>
      canReadReports &&
      hasPermission(REPORT_MODULES[category.id], 'read')
  );

  const activeReportTab = visibleReportCategories.some(
    category => category.id === requestedReportTab
  )
    ? requestedReportTab
    : visibleReportCategories[0]?.id;

  const columns = useMemo(
    () => getColumns(activeReportTab, today),
    [activeReportTab, today]
  );

  // ==========================================================
  // REPORT DATA SOURCES
  // ==========================================================

  const sourceRecords = useMemo(() => {
    switch (activeReportTab) {
      case 'user_accounts':
        return users;

      case 'asset_status':
      case 'warranty':
        return assets;

      case 'licences':
        return software;

      case 'resolution':
        return tickets;

      default:
        return [];
    }
  }, [
    activeReportTab,
    users,
    assets,
    software,
    tickets
  ]);

  const getRelatedEmployee = record => {
    if (!canReadUsers) return null;

    if (activeReportTab === 'user_accounts') return record;

    if (activeReportTab === 'resolution') {
      return users.find(user =>
        user.id === record.requesterId
      ) || null;
    }

    if (
      activeReportTab === 'asset_status' ||
      activeReportTab === 'warranty'
    ) {
      const id =
        record.assignedTo ||
        record.assignedEmployeeId ||
        record.assignedToId;

      return users.find(user =>
        user.id === id || user.employeeId === id
      ) || null;
    }

    return null;
  };

  const getLocation = record => {
    if (record.location) return record.location;

    return getRelatedEmployee(record)?.location || '';
  };

  const getDepartment = record =>
    record.department ||
    getRelatedEmployee(record)?.department ||
    '';

  const getCategory = record => {
    if (activeReportTab === 'user_accounts') {
      return record.role;
    }

    if (activeReportTab === 'licences') {
      return record.subscriptionModel || record.licenceType;
    }

    return record.type || record.category;
  };

  const locationOptions = unique(
    sourceRecords.map(getLocation)
  );

  const departmentOptions = unique(
    sourceRecords.map(getDepartment)
  );

  const categoryOptions = unique(
    sourceRecords.map(getCategory)
  );

  const statusOptions = unique(
    sourceRecords.map(record =>
      getReportStatus(activeReportTab, record, today)
    )
  );

  const invalidDateRange =
    dateRange === 'Custom' &&
    (!startDate || !endDate || startDate > endDate);

  // ==========================================================
  // FILTERING AND SORTING
  // ==========================================================

  const filteredRecords = useMemo(() => {
    if (!activeReportTab || invalidDateRange) return [];

    let from = '';
    let to = '';

    switch (dateRange) {
      case 'Today':
        from = today;
        to = today;
        break;

      case 'Last 7 Days':
        from = addDays(today, -6);
        to = today;
        break;

      case 'Last 30 Days':
        from = addDays(today, -29);
        to = today;
        break;

      case 'Next 30 Days':
        from = today;
        to = addDays(today, 30);
        break;

      case 'Next 90 Days':
        from = today;
        to = addDays(today, 90);
        break;

      case 'Custom':
        from = startDate;
        to = endDate;
        break;

      default:
        break;
    }

    const words = normalize(search).split(/\s+/).filter(Boolean);

    const results = sourceRecords.filter(record => {
      const searchableText = [
        ...columns.map(column => column.get(record)),
        getLocation(record),
        getDepartment(record)
      ].map(normalize).join(' ');

      if (!words.every(word => searchableText.includes(word))) {
        return false;
      }

      if (
        selectedLoc !== 'All' &&
        getLocation(record) !== selectedLoc
      ) return false;

      if (
        selectedDept !== 'All' &&
        getDepartment(record) !== selectedDept
      ) return false;

      if (
        categoryFilter !== 'All' &&
        getCategory(record) !== categoryFilter
      ) return false;

      if (
        statusFilter !== 'All' &&
        getReportStatus(activeReportTab, record, today) !== statusFilter
      ) return false;

      if (dateRange !== 'All') {
        const recordDate = getDateKey(
          getReportDate(activeReportTab, record)
        );

        if (!recordDate || recordDate < from || recordDate > to) {
          return false;
        }
      }

      if (
        activeReportTab === 'warranty' &&
        warrantyWindow !== 'All'
      ) {
        const days = daysUntil(record.warrantyEnd, today);

        switch (warrantyWindow) {
          case 'expired':
            return days !== null && days < 0;

          case '30':
            return days !== null && days >= 0 && days <= 30;

          case '60':
            return days !== null && days > 30 && days <= 60;

          case '90':
            return days !== null && days > 60 && days <= 90;

          case 'valid':
            return days !== null && days > 90;

          case 'unknown':
            return days === null;

          default:
            break;
        }
      }

      if (
        activeReportTab === 'resolution' &&
        slaFilter !== 'All' &&
        getSlaResult(record) !== slaFilter
      ) return false;

      return true;
    });

    if (sortColumn !== null && columns[sortColumn]) {
      const column = columns[sortColumn];

      results.sort((a, b) => {
        const first = column.get(a);
        const second = column.get(b);

        if (first === null || first === undefined || first === '') {
          return second === null || second === undefined || second === ''
            ? 0 : 1;
        }

        if (second === null || second === undefined || second === '') {
          return -1;
        }

        let difference;

        if (
          typeof first === 'number' &&
          typeof second === 'number'
        ) {
          difference = first - second;

        } else if (/date|expiry/i.test(column.label)) {
          const firstDate = parseDate(first);
          const secondDate = parseDate(second);

          difference = firstDate !== null && secondDate !== null
            ? firstDate - secondDate
            : String(first).localeCompare(String(second));

        } else {
          difference = String(first).localeCompare(
            String(second),
            undefined,
            { numeric: true, sensitivity: 'base' }
          );
        }

        return sortAsc ? difference : -difference;
      });
    }

    return results;
  }, [
    sourceRecords,
    activeReportTab,
    users,
    canReadUsers,
    columns,
    search,
    selectedLoc,
    selectedDept,
    statusFilter,
    categoryFilter,
    dateRange,
    startDate,
    endDate,
    today,
    warrantyWindow,
    slaFilter,
    invalidDateRange,
    sortColumn,
    sortAsc
  ]);

  const summaryItems = useMemo(
    () => calculateSummary(activeReportTab, filteredRecords, today),
    [activeReportTab, filteredRecords, today]
  );

  const chartData = useMemo(
    () => getChartData(activeReportTab, filteredRecords, today),
    [activeReportTab, filteredRecords, today]
  );

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [
    activeReportTab,
    search,
    selectedLoc,
    selectedDept,
    categoryFilter,
    statusFilter,
    dateRange,
    startDate,
    endDate,
    warrantyWindow,
    slaFilter,
    pageSize
  ]);

  const resetFilters = () => {
    setSearch('');
    setSelectedLoc('All');
    setSelectedDept('All');
    setStatusFilter('All');
    setCategoryFilter('All');
    setDateRange('All');
    setStartDate('');
    setEndDate('');
    setWarrantyWindow('All');
    setSlaFilter('All');
    setSortColumn(null);
    setSortAsc(true);
    setPage(1);
  };

  const changeReport = id => {
    if (!visibleReportCategories.some(category => category.id === id)) {
      return;
    }

    resetFilters();
    setSelectedReportRecord(null);
    setActiveReportTab(id);
  };

  const handleSort = index => {
    if (sortColumn === index) {
      setSortAsc(previous => !previous);
    } else {
      setSortColumn(index);
      setSortAsc(true);
    }

    setPage(1);
  };

  // ==========================================================
  // LIVE REPORT RECORD DETAILS
  // ==========================================================

  const selectedReportSource = selectedReportRecord
    ? REPORT_MODULES[selectedReportRecord.type]
    : null;

  const liveSelectedRecord = useMemo(() => {
    if (!selectedReportRecord) return null;

    const { type, id } = selectedReportRecord;

    let collection = [];

    if (type === 'user_accounts') collection = users;
    else if (type === 'asset_status' || type === 'warranty') collection = assets;
    else if (type === 'licences') collection = software;
    else if (type === 'resolution') collection = tickets;

    return collection.find(record => record.id === id) || null;
  }, [
    selectedReportRecord,
    users,
    assets,
    software,
    tickets
  ]);

  const reportRecordFields = useMemo(
    () => getRecordFields(
      selectedReportRecord?.type,
      liveSelectedRecord,
      today
    ),
    [selectedReportRecord, liveSelectedRecord, today]
  );

  const openRecord = record => {
    if (!canReadReports) return;

    if (!hasPermission(REPORT_MODULES[activeReportTab], 'read')) {
      return;
    }

    setSelectedReportRecord({
      type: activeReportTab,
      id: record.id
    });
  };

  const saveReportRecord = updates => {
    if (
      !liveSelectedRecord ||
      !selectedReportSource ||
      !hasPermission('Reports', 'read') ||
      !hasPermission(selectedReportSource, 'read') ||
      !hasPermission(selectedReportSource, 'update')
    ) return false;

    const type = selectedReportRecord.type;
    const id = liveSelectedRecord.id;
    const fields = { ...updates };

    if (type === 'user_accounts') {
      if (!String(fields.name || '').trim()) {
        showToast('Employee name is required.');
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email || '')) {
        showToast('Enter a valid employee email address.');
        return false;
      }

      const duplicate = users.some(user =>
        user.id !== id &&
        normalize(user.email) === normalize(fields.email)
      );

      if (duplicate) {
        showToast('This email address is already registered.');
        return false;
      }

      return updateUser(id, {
        ...fields,
        name: fields.name.trim(),
        email: fields.email.trim()
      }) !== false;
    }

    if (type === 'asset_status' || type === 'warranty') {
      if (!String(fields.model || '').trim()) {
        showToast('Device name is required.');
        return false;
      }

      if (
        fields.warrantyEnd &&
        parseDate(fields.warrantyEnd) === null
      ) {
        showToast('Enter a valid warranty expiry date.');
        return false;
      }

      if (
        fields.warrantyEnd &&
        parseDate(liveSelectedRecord.purchaseDate) !== null &&
        getDateKey(fields.warrantyEnd) <
          getDateKey(liveSelectedRecord.purchaseDate)
      ) {
        showToast('Warranty expiry cannot be before the purchase date.');
        return false;
      }

      return updateAsset(id, {
        ...fields,
        model: fields.model.trim()
      }) !== false;
    }

    if (type === 'licences') {
      const used = Number(fields.seatsUsed);
      const total = Number(fields.totalSeats);
      const annualCost = Number(fields.annualCost);

      if (!String(fields.name || '').trim()) {
        showToast('Software name is required.');
        return false;
      }

      if (
        fields.seatsUsed === '' ||
        fields.totalSeats === '' ||
        !Number.isInteger(used) ||
        !Number.isInteger(total) ||
        total < 1 ||
        used < 0 ||
        used > total
      ) {
        showToast('Enter valid seat counts. Used seats cannot exceed total seats.');
        return false;
      }

      if (
        fields.annualCost === '' ||
        !Number.isFinite(annualCost) ||
        annualCost < 0
      ) {
        showToast('Enter a valid non-negative annual cost.');
        return false;
      }

      if (
        fields.renewalDate &&
        parseDate(fields.renewalDate) === null
      ) {
        showToast('Enter a valid renewal date.');
        return false;
      }

      return updateSoftwareLicence(id, {
        ...fields,
        name: fields.name.trim(),
        seatsUsed: used,
        totalSeats: total,
        annualCost,
        costPerYear: annualCost,
        renewalDate: fields.renewalDate,
        expiryDate: fields.renewalDate
      }) !== false;
    }

    if (type === 'resolution') {
      if (!String(fields.title || '').trim()) {
        showToast('Ticket subject is required.');
        return false;
      }

      if (
        ['resolved', 'closed'].includes(fields.status) &&
        !isResolved(liveSelectedRecord) &&
        !String(fields.resolutionNote || '').trim()
      ) {
        showToast('Enter a resolution note before resolving the ticket.');
        return false;
      }

      return updateTicket(id, {
        ...fields,
        title: fields.title.trim()
      }) !== false;
    }

    return false;
  };

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const canExport =
    canReadReports &&
    Boolean(activeReportTab) &&
    hasPermission(REPORT_MODULES[activeReportTab], 'read');

  const handleExportCSV = () => {
    if (!canExport) {
      showToast('You do not have permission to export this report.');
      return;
    }

    if (!filteredRecords.length) {
      showToast('No matching report records to export.');
      return;
    }

    const headers = columns.map(column => column.label);

    const rows = filteredRecords.map(record =>
      columns.map(column => column.get(record))
    );

    downloadCSV(
      headers,
      rows,
      `IT_Report_${activeReportTab}_${today}.csv`
    );

    showToast(`Exported ${filteredRecords.length} matching records.`);
  };

  // ==========================================================
  // PRINT VIEW
  // ==========================================================

  const handlePrint = () => {
    if (!canExport || !filteredRecords.length) return;

    const printWindow = window.open(
      '',
      '_blank',
      'width=1200,height=800'
    );

    if (!printWindow) {
      showToast('Allow browser pop-ups to open the print view.');
      return;
    }

    printWindow.opener = null;

    const doc = printWindow.document;

    doc.title = REPORT_NAMES[activeReportTab];

    const style = doc.createElement('style');

    style.textContent = `
      @page { size: landscape; margin: 12mm; }
      body {
        font-family: Arial, sans-serif;
        color: #17212b;
        padding: 20px;
        font-size: 10px;
      }
      h1 { font-size: 23px; margin-bottom: 5px; }
      h2 { font-size: 17px; }
      p { line-height: 1.5; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 6px;
        text-align: left;
        overflow-wrap: anywhere;
      }
      th { background: #e8eef0; font-weight: bold; }
      tr { break-inside: avoid; }
      thead { display: table-header-group; }
      .summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 15px 0;
      }
      .metric {
        border: 1px solid #d1d5db;
        padding: 10px;
      }
      .metric strong {
        display: block;
        font-size: 15px;
        margin-top: 5px;
      }
    `;

    doc.head.appendChild(style);

    const createElement = (tag, text, parent) => {
      const element = doc.createElement(tag);
      element.textContent = text ?? '';
      parent.appendChild(element);
      return element;
    };

    createElement('h1', 'IT Administration', doc.body);

    createElement(
      'h2',
      REPORT_NAMES[activeReportTab],
      doc.body
    );

    createElement(
      'p',
      `Generated: ${new Date().toLocaleString('en-IN', {
        timeZone: TIME_ZONE
      })} IST | Records: ${filteredRecords.length}`,
      doc.body
    );

    createElement(
      'p',
      `Date basis: ${DATE_LABELS[activeReportTab]} | Date range: ${
        dateRange === 'Custom'
          ? `${startDate} to ${endDate}`
          : dateRange
      } | Location: ${selectedLoc} | Department: ${selectedDept} | Status: ${statusFilter} | Category: ${categoryFilter} | Search: ${search || 'None'}${
        activeReportTab === 'warranty'
          ? ` | Warranty window: ${warrantyWindow}`
          : ''
      }${
        activeReportTab === 'resolution'
          ? ` | SLA result: ${slaFilter}`
          : ''
      }`,
      doc.body
    );

    const summary = doc.createElement('div');
    summary.className = 'summary';
    doc.body.appendChild(summary);

    summaryItems.forEach(item => {
      const block = doc.createElement('div');
      block.className = 'metric';

      createElement('span', item.label, block);
      createElement('strong', String(item.value), block);

      summary.appendChild(block);
    });

    const table = doc.createElement('table');
    const thead = doc.createElement('thead');
    const headerRow = doc.createElement('tr');

    columns.forEach(column => {
      createElement('th', column.label, headerRow);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = doc.createElement('tbody');

    filteredRecords.forEach(record => {
      const row = doc.createElement('tr');

      columns.forEach(column => {
        const value = column.get(record);

        const text =
          value === null || value === undefined || value === ''
            ? '—'
            : column.format
              ? column.format(value)
              : String(value);

        createElement('td', text, row);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    doc.body.appendChild(table);

    createElement(
      'p',
      'Source: Local IT Administration application records.',
      doc.body
    );

    if (activeReportTab === 'resolution') {
      createElement(
        'p',
        'SLA metrics use recorded ticket timing. Resolved-within-SLA percentage excludes resolved tickets without measurable SLA data.',
        doc.body
      );
    }

    printWindow.focus();
    printWindow.print();
  };

  // ==========================================================
  // RESTRICTED ACCESS
  // ==========================================================

  if (!canReadReports) {
    return (
      <Card title="IT Reports Restricted">
        <div className="py-8 text-center">
          <IconShield className="w-8 h-8 mx-auto mb-3 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have Reports: read permission.
          </p>
        </div>
      </Card>
    );
  }

  if (!visibleReportCategories.length) {
    return (
      <Card title="No Report Sources Available">
        <p className="py-6 text-center text-[13px] text-muted">
          Your role needs read permission for at least one report source module.
        </p>
      </Card>
    );
  }

  const chartTitles = {
    user_accounts: 'User Accounts by Department',
    asset_status: 'Asset Lifecycle Distribution',
    warranty: 'Warranty Expiry Distribution',
    licences: 'Software Seat Utilisation',
    resolution: 'Ticket SLA Performance'
  };

  // ==========================================================
  // MAIN INTERFACE
  // ==========================================================

  return (
    <div
      id="widget-reports"
      data-w="reports"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <IconChart className="w-6 h-6 text-sky-400" />
            IT Reports & Analytics
          </h2>

          <p className="text-[13px] text-muted mt-1">
            Generate asset, warranty, software licence, employee and ticket-resolution reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <Button
            variant="secondary"
            size="sm"
            icon={IconPrinter}
            disabled={!canExport || !filteredRecords.length}
            onClick={handlePrint}
          >
            Print View
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={IconDownload}
            disabled={!canExport || !filteredRecords.length}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

        </div>
      </div>

      {/* REPORT CATEGORY CARDS */}

      <CategoryCardsBar
        categories={visibleReportCategories}
        activeCategory={activeReportTab}
        onSelectCategory={changeReport}
      />

      {/* REPORT FILTERS */}

      <Card
        title="Report Filters"
        subText={`Configure ${REPORT_NAMES[activeReportTab]} using the available source records.`}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={IconX}
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        }
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

          <label className="flex flex-col gap-1.5 text-[12px] text-muted">

            Search Records

            <div className="relative">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

              <input
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search report records..."
                className={`${FILTER_CLASS} w-full pl-8`}
              />
            </div>

          </label>

          {locationOptions.length > 0 && (
            <label className="flex flex-col gap-1.5 text-[12px] text-muted">
              Location

              <select
                value={selectedLoc}
                onChange={event => setSelectedLoc(event.target.value)}
                className={FILTER_CLASS}
              >
                <option value="All">All Locations</option>

                {locationOptions.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>
          )}

          {departmentOptions.length > 0 && (
            <label className="flex flex-col gap-1.5 text-[12px] text-muted">
              Department

              <select
                value={selectedDept}
                onChange={event => setSelectedDept(event.target.value)}
                className={FILTER_CLASS}
              >
                <option value="All">All Departments</option>

                {departmentOptions.map(department => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-[12px] text-muted">

            Status

            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className={FILTER_CLASS}
            >
              <option value="All">All Statuses</option>

              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {capitalize(status)}
                </option>
              ))}
            </select>

          </label>

          {categoryOptions.length > 0 && (
            <label className="flex flex-col gap-1.5 text-[12px] text-muted">

              {activeReportTab === 'licences'
                ? 'Licence Model'
                : activeReportTab === 'user_accounts'
                  ? 'Designation'
                  : 'Category'}

              <select
                value={categoryFilter}
                onChange={event => setCategoryFilter(event.target.value)}
                className={FILTER_CLASS}
              >
                <option value="All">All</option>

                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

            </label>
          )}

          <label className="flex flex-col gap-1.5 text-[12px] text-muted">

            {DATE_LABELS[activeReportTab]} Range

            <select
              value={dateRange}
              onChange={event => {
                const value = event.target.value;
                setDateRange(value);

                if (value === 'Custom') {
                  setStartDate(previous => previous || today);
                  setEndDate(previous => previous || today);
                }
              }}
              className={FILTER_CLASS}
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>

              {['warranty', 'licences'].includes(activeReportTab) && (
                <>
                  <option value="Next 30 Days">Next 30 Days</option>
                  <option value="Next 90 Days">Next 90 Days</option>
                </>
              )}

              <option value="Custom">Custom Date Range</option>
            </select>

          </label>

          {activeReportTab === 'warranty' && (
            <label className="flex flex-col gap-1.5 text-[12px] text-muted">

              Warranty Window

              <select
                value={warrantyWindow}
                onChange={event => setWarrantyWindow(event.target.value)}
                className={FILTER_CLASS}
              >
                <option value="All">All Warranty Records</option>
                <option value="expired">Already Expired</option>
                <option value="30">Due in 0–30 Days</option>
                <option value="60">Due in 31–60 Days</option>
                <option value="90">Due in 61–90 Days</option>
                <option value="valid">Coverage Beyond 90 Days</option>
                <option value="unknown">Warranty Not Recorded</option>
              </select>

            </label>
          )}

          {activeReportTab === 'resolution' && (
            <label className="flex flex-col gap-1.5 text-[12px] text-muted">

              SLA Result

              <select
                value={slaFilter}
                onChange={event => setSlaFilter(event.target.value)}
                className={FILTER_CLASS}
              >
                <option value="All">All SLA Results</option>
                <option value="Met">SLA Met</option>
                <option value="Breached">SLA Breached</option>
                <option value="In progress">In Progress</option>
                <option value="Not recorded">Not Recorded</option>
              </select>

            </label>
          )}

          {dateRange === 'Custom' && (
            <>
              <label className="flex flex-col gap-1.5 text-[12px] text-muted">
                From Date

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={event => setStartDate(event.target.value)}
                  className={FILTER_CLASS}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[12px] text-muted">
                To Date

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={event => setEndDate(event.target.value)}
                  className={FILTER_CLASS}
                />
              </label>
            </>
          )}

        </div>

        {invalidDateRange && (
          <p role="alert" className="text-[12px] text-bad">
            Select a valid start and end date.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line/60">

          <span className="text-[12px] text-muted">
            Showing {filteredRecords.length} of {sourceRecords.length} records.
          </span>

          <span className="text-[11px] font-data text-muted">
            Date filters use IST · Export includes all matching records
          </span>

        </div>

      </Card>

      {/* FILTERED REPORT SUMMARY */}

      <Card
        title={`${REPORT_NAMES[activeReportTab]} — Summary`}
        subText="Metrics calculated from the currently filtered records"
      >
        <SummaryCards items={summaryItems} />
      </Card>

      {/* DYNAMIC REPORT CHART */}

      <Card
        title={chartTitles[activeReportTab]}
        subText="Visual distribution based on the selected report filters"
      >

        {!filteredRecords.length ? (
          <EmptyState
            icon={IconChart}
            message="No matching data available for this chart."
          />
        ) : activeReportTab === 'licences' ? (

          <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-2">

            {chartData.map((item, index) => (
              <div key={`${item.label}-${index}`}>

                <div className="flex justify-between items-center gap-3 mb-1.5">
                  <span className="text-[12px] font-semibold text-ink">
                    {item.label}
                  </span>

                  <span className="text-[12px] text-muted font-data">
                    {item.value}%
                  </span>
                </div>

                <div
                  className="h-2.5 rounded-full bg-surface2 overflow-hidden"
                  role="progressbar"
                  aria-label={`${item.label} seat utilisation`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, item.value)}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.value))}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>

              </div>
            ))}

          </div>

        ) : (

          <BarChart
            data={chartData}
            height={220}
            ariaLabel={chartTitles[activeReportTab]}
          />

        )}

        {activeReportTab === 'resolution' && (
          <p className="text-[11.5px] text-muted">
            SLA compliance is calculated using resolved or closed tickets
            with measurable SLA data. Existing elapsed-hour records are
            used when a resolution timestamp is unavailable.
          </p>
        )}

      </Card>

      {/* REPORT TABLE */}

      <Card
        title={`${REPORT_NAMES[activeReportTab]} (${filteredRecords.length})`}
        subText="Select a record to view its complete details"
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={IconDownload}
            disabled={!canExport || !filteredRecords.length}
            onClick={handleExportCSV}
          >
            Download Report
          </Button>
        }
      >

        {!filteredRecords.length ? (
          <EmptyState
            icon={IconChart}
            message="No report records match your selected filters."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : (

          <div className="overflow-x-auto -mx-1">

            <table className="w-full text-left border-collapse text-[12px] min-w-[1000px]">

              <thead>

                <tr className="border-b border-line text-muted font-bold uppercase tracking-wider text-[11px]">

                  <th scope="col" className="px-3 py-3">
                    No.
                  </th>

                  {columns.map((column, index) => (
                    <th
                      key={column.label}
                      scope="col"
                      className="px-3 py-3 whitespace-nowrap"
                      aria-sort={
                        sortColumn === index
                          ? sortAsc ? 'ascending' : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(index)}
                        className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
                      >
                        {column.label}

                        <span className={sortColumn === index
                          ? 'text-accent'
                          : 'text-muted/50'
                        }>
                          {sortColumn === index
                            ? sortAsc ? '↑' : '↓'
                            : '↕'}
                        </span>
                      </button>

                    </th>
                  ))}

                  <th scope="col" className="px-3 py-3 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-dashed divide-line">

                {paginatedRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    tabIndex={0}
                    aria-label={`View report record ${record.id}`}
                    onClick={() => openRecord(record)}
                    onKeyDown={event => {
                      if (event.target !== event.currentTarget) return;

                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openRecord(record);
                      }
                    }}
                    className="hover:bg-surface2/50 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-accent"
                  >

                    <td className="px-3 py-3 text-muted font-data">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    {columns.map(column => (
                      <td
                        key={column.label}
                        className="px-3 py-3 whitespace-nowrap"
                      >
                        <ReportCell
                          column={column}
                          record={record}
                        />
                      </td>
                    ))}

                    <td className="px-3 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={event => {
                          event?.stopPropagation();
                          openRecord(record);
                        }}
                      >
                        View
                      </Button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* PAGINATION */}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">

          <div className="flex flex-wrap items-center gap-3">

            <span className="text-[12px] text-muted">
              Showing {
                filteredRecords.length
                  ? (currentPage - 1) * pageSize + 1
                  : 0
              }–{
                Math.min(currentPage * pageSize, filteredRecords.length)
              } of {filteredRecords.length} records
            </span>

            <label className="flex items-center gap-2 text-[11px] text-muted">

              Rows per page

              <select
                value={pageSize}
                onChange={event => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
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

          <div className="flex items-center gap-2">

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>

            <span className="text-[12px] text-muted font-data">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>

          </div>

        </div>

      </Card>

      {/* RECORD DETAILS MODAL */}

      {selectedReportRecord &&
        liveSelectedRecord &&
        selectedReportSource &&
        hasPermission(selectedReportSource, 'read') && (

        <RecordDetailsModal
          isOpen
          onClose={() => setSelectedReportRecord(null)}
          title={`${REPORT_NAMES[selectedReportRecord.type]} · ${
            liveSelectedRecord.assetTag ||
            liveSelectedRecord.name ||
            liveSelectedRecord.id
          }`}
          record={liveSelectedRecord}
          fields={reportRecordFields}
          canEdit={hasPermission(selectedReportSource, 'update')}
          onSave={saveReportRecord}
          canExport={
            canReadReports &&
            hasPermission(selectedReportSource, 'read')
          }
          exportData={sanitizeRecord(
            selectedReportRecord.type,
            liveSelectedRecord
          )}
          exportFilename={`report-${selectedReportRecord.type}-${liveSelectedRecord.id}.json`}
        />

      )}

    </div>
  );
}

