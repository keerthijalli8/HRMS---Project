
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card, KpiTile } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Avatar } from '../shared/Avatar';
import { EmptyState } from '../shared/EmptyState';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { LineChart, BarChart, DonutChart } from '../shared/SVGChart';
import { useLockBodyScroll } from '../../utils/scrollLock';

import {
  IconUsers,
  IconKey,
  IconLaptop,
  IconShare,
  IconHeadphones,
  IconPackage,
  IconShield,
  IconChart,
  IconArrowRight,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconPlus
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const TIME_ZONE = 'Asia/Kolkata';
const DAY_MS = 86400000;

const CHART_COLORS = [
  'var(--accent)',
  'var(--accent2)',
  'var(--info)',
  'var(--good)',
  'var(--warn)',
  'var(--bad)',
  'var(--muted)'
];

const PRIORITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const number = value => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const money = value =>
  `₹${number(value).toLocaleString('en-IN')}`;

const percentage = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

function parseDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim();

  text = text.replace(/\bIST\b/gi, 'GMT+0530');

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    text += 'T00:00:00+05:30';
  } else if (/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}$/.test(text)) {
    text += ' 00:00:00 GMT+0530';
  }

  const parsed = Date.parse(text);

  return Number.isFinite(parsed) ? parsed : null;
}

function firstValidDate(...values) {
  for (const value of values) {
    const parsed = parseDate(value);

    if (parsed !== null) return parsed;
  }

  return null;
}

function dateKey(value = Date.now()) {
  const timestamp = parseDate(value);

  if (timestamp === null) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(timestamp));

  const get = type =>
    parts.find(part => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDays(key, days) {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function shortDate(key) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short'
  });
}

function daysUntil(value, today) {
  const key = dateKey(value);

  if (!key) return null;

  return Math.round(
    (
      Date.parse(`${key}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)
    ) / DAY_MS
  );
}

function isResolved(ticket) {
  return ['resolved', 'closed'].includes(
    normalize(ticket.status)
  );
}

function isPendingTicket(ticket) {
  return !isResolved(ticket);
}

function isBreached(ticket) {
  if (normalize(ticket.status) === 'breached sla') {
    return true;
  }

  const elapsed = Number(ticket.slaElapsedHours);
  const target = Number(ticket.slaHours);

  return (
    ticket.slaElapsedHours !== null &&
    ticket.slaElapsedHours !== undefined &&
    ticket.slaElapsedHours !== '' &&
    Number.isFinite(elapsed) &&
    Number.isFinite(target) &&
    target > 0 &&
    elapsed > target
  );
}

function ticketCreatedAt(ticket) {
  return firstValidDate(
    ticket.createdAtISO,
    ticket.createdAt,
    ticket.createdDate
  );
}

function ticketResolvedAt(ticket) {
  if (!isResolved(ticket)) return null;

  const explicitDate = firstValidDate(
    ticket.resolvedAtISO,
    ticket.resolvedAt,
    ticket.resolvedDate,
    ticket.closedAt
  );

  if (explicitDate !== null) return explicitDate;

  const created = ticketCreatedAt(ticket);
  const elapsed = Number(ticket.slaElapsedHours);

  if (
    created !== null &&
    ticket.slaElapsedHours !== null &&
    ticket.slaElapsedHours !== undefined &&
    ticket.slaElapsedHours !== '' &&
    Number.isFinite(elapsed) &&
    elapsed >= 0
  ) {
    return created + elapsed * 3600000;
  }

  return null;
}

function eventTimestamp(event) {
  return firstValidDate(
    event.createdAt,
    event.timestamp,
    event.time
  );
}

function requestTimestamp(request) {
  return firstValidDate(
    request.requestedDate,
    request.createdAt,
    request.time
  );
}

function isOpenAlert(event) {
  return normalize(event.category) === 'alerts' &&
    !event.acknowledged;
}

function groupCounts(records, getter) {
  const groups = new Map();

  records.forEach(record => {
    const label = getter(record) || 'Unspecified';

    groups.set(label, (groups.get(label) || 0) + 1);
  });

  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
}

// ============================================================
// REUSABLE DASHBOARD COMPONENTS
// ============================================================

function SectionHeading({ title, description }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-display font-bold text-[17px] text-ink">
        {title}
      </h3>

      {description && (
        <span className="text-[12px] text-muted">
          {description}
        </span>
      )}
    </div>
  );
}

function ViewAllButton({ onClick, children = 'View All' }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      {children}
      <IconArrowRight className="w-3.5 h-3.5" />
    </Button>
  );
}

function PreviewMetric({ label, value, color }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-4 flex flex-col gap-2">
      <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">
        {label}
      </span>

      <span className={`font-display font-bold text-[24px] break-words ${color || 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface2/40 hover:border-accent hover:bg-surface2 transition-all text-left group"
    >
      <div className="w-9 h-9 shrink-0 rounded-lg border border-line bg-surface flex items-center justify-center text-accent">
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-[13px] font-semibold text-ink group-hover:text-accent">
          {label}
        </span>
        <span className="text-[11px] text-muted">
          {description}
        </span>
      </div>

      <IconArrowRight className="w-4 h-4 text-muted shrink-0 group-hover:text-accent" />
    </button>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export function DashboardPage() {
  const {
    users = [],
    assets = [],
    tickets = [],
    software = [],
    events = [],
    custodyHistory = [],
    pendingRequests = [],
    accessMatrix = {},
    activeSessions = [],
    scheduledReports = [],
    approveAccessRequest,
    rejectAccessRequest,
    markLicenceRenewed,
    acknowledgeAlert,
    navigate,
    setActiveDrawer,
    setDrawerPayload,
    activeSubDashboard,
    closeSubDashboard,
    hasPermission
  } = useStore();

  const canRead = module => hasPermission(module, 'read');
  const canWrite = module => hasPermission(module, 'write');
  const canUpdate = module => hasPermission(module, 'update');

  const canReadUsers = canRead('User Profiles');
  const canReadAssets = canRead('Assets');
  const canReadTickets = canRead('Helpdesk');
  const canReadSoftware = canRead('Software');
  const canReadSecurity = canRead('Security');
  const canReadReports = canRead('Reports');

  const [activeCategoryModal, setActiveCategoryModal] =
    useState(null);

  const [trendPeriod, setTrendPeriod] = useState(7);
  const [today, setToday] = useState(() => dateKey());

  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday(dateKey());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  // ==========================================================
  // USER ACCOUNT METRICS
  // ==========================================================

  const activeUsers = users.filter(
    user => normalize(user.status) === 'active'
  ).length;

  const provisioningUsers = users.filter(
    user => normalize(user.status) === 'provisioning'
  ).length;

  const suspendedUsers = users.filter(
    user => normalize(user.status) === 'suspended'
  ).length;

  const deactivatedUsers = users.filter(
    user => normalize(user.status) === 'deactivated'
  ).length;

  // ==========================================================
  // ASSET METRICS
  // ==========================================================

  const assignedAssets = assets.filter(
    asset => normalize(asset.status) === 'assigned'
  ).length;

  const availableAssets = assets.filter(
    asset => normalize(asset.status) === 'in stock'
  ).length;

  const overdueAssets = assets.filter(
    asset => normalize(asset.status) === 'overdue return'
  ).length;

  const maintenanceAssets = assets.filter(
    asset => ['in repair', 'maintenance'].includes(
      normalize(asset.status)
    )
  ).length;

  const retiredAssets = assets.filter(
    asset => normalize(asset.status) === 'retired'
  ).length;

  const totalAssetValue = assets.reduce(
    (sum, asset) =>
      sum + number(asset.cost ?? asset.purchaseCost),
    0
  );

  const upcomingWarranties = assets.filter(asset => {
    const days = daysUntil(asset.warrantyEnd, today);

    return (
      normalize(asset.status) !== 'retired' &&
      days !== null &&
      days >= 0 &&
      days <= 30
    );
  });

  // ==========================================================
  // HELPDESK METRICS
  // ==========================================================

  const unresolvedTickets = tickets.filter(isPendingTicket);

  const resolvedTickets = tickets.filter(isResolved);

  const breachedTickets = unresolvedTickets.filter(isBreached);

  const criticalTickets = unresolvedTickets.filter(
    ticket => normalize(ticket.priority) === 'critical'
  );

  const inProgressTickets = tickets.filter(
    ticket => normalize(ticket.status) === 'in progress'
  ).length;

  const unassignedTickets = unresolvedTickets.filter(
    ticket => !ticket.assignedTo ||
      normalize(ticket.assignedTo) === 'unassigned'
  ).length;

  const ticketResolutionRate = tickets.length
    ? `${percentage(resolvedTickets.length, tickets.length)}%`
    : '—';

  // ==========================================================
  // ACCESS MANAGEMENT METRICS
  // ==========================================================

  const pendingAccessRequests = pendingRequests
    .filter(request => normalize(request.status) === 'pending')
    .sort((a, b) =>
      (requestTimestamp(b) ?? 0) -
      (requestTimestamp(a) ?? 0)
    );

  const approvedAccessRequests = pendingRequests.filter(
    request => normalize(request.status) === 'approved'
  ).length;

  const rejectedAccessRequests = pendingRequests.filter(
    request => normalize(request.status) === 'rejected'
  ).length;

  const grantedApplicationAccess = Object.values(accessMatrix)
    .reduce((total, permissions) => (
      total + Object.values(permissions || {}).filter(
        status => normalize(status) === 'granted'
      ).length
    ), 0);

  // ==========================================================
  // SOFTWARE METRICS
  // ==========================================================

  const totalLicenceSeats = software.reduce(
    (total, licence) => total + number(licence.totalSeats),
    0
  );

  const usedLicenceSeats = software.reduce(
    (total, licence) => total + number(licence.seatsUsed),
    0
  );

  const availableLicenceSeats = software.reduce(
    (total, licence) => total + Math.max(
      0,
      number(licence.totalSeats) - number(licence.seatsUsed)
    ),
    0
  );

  const annualSoftwareCost = software.reduce(
    (total, licence) =>
      total + number(licence.annualCost ?? licence.costPerYear),
    0
  );

  const renewalRecords = software
    .map(licence => ({
      ...licence,
      remainingDays: daysUntil(
        licence.expiryDate || licence.renewalDate,
        today
      )
    }))
    .filter(licence =>
      licence.remainingDays !== null &&
      licence.remainingDays <= 30
    )
    .sort((a, b) => a.remainingDays - b.remainingDays);

  const expiredLicences = renewalRecords.filter(
    licence => licence.remainingDays < 0
  );

  const expiringLicences = renewalRecords.filter(
    licence => licence.remainingDays >= 0
  );

  const licenceUtilisation = totalLicenceSeats
    ? `${percentage(usedLicenceSeats, totalLicenceSeats)}%`
    : '—';

  // ==========================================================
  // SECURITY METRICS
  // ==========================================================

  const activeAlerts = events.filter(isOpenAlert);

  const criticalAlerts = activeAlerts.filter(
    event => normalize(event.severity) === 'critical'
  );

  const failedLogins = events.filter(event =>
    normalize(event.result) === 'failed login' ||
    normalize(event.category) === 'failed'
  );

  const successfulLogins = events.filter(event =>
    normalize(event.category) === 'logins' &&
    normalize(event.result) === 'success'
  );

  const mfaChallenges = events.filter(
    event => normalize(event.result) === 'mfa challenge'
  );

  const blockedEvents = events.filter(
    event => normalize(event.result) === 'blocked / suspicious'
  );

  const adminActivities = events.filter(
    event => normalize(event.category) === 'admin actions'
  );

  const reviewedAlerts = events.filter(
    event =>
      normalize(event.category) === 'alerts' &&
      event.acknowledged
  ).length;

  // ==========================================================
  // RECENT RECORDS
  // ==========================================================

  const recentActivities = useMemo(() => (
    [...events]
      .sort((a, b) =>
        (eventTimestamp(b) ?? 0) -
        (eventTimestamp(a) ?? 0)
      )
      .slice(0, 5)
  ), [events]);

  const recentAllocations = useMemo(() => (
    [...custodyHistory]
      .sort((a, b) => (
        (
          firstValidDate(b.returnDate, b.assignedDate) ?? 0
        ) -
        (
          firstValidDate(a.returnDate, a.assignedDate) ?? 0
        )
      ))
      .slice(0, 5)
  ), [custodyHistory]);

  const priorityTickets = useMemo(() => (
    tickets
      .filter(isPendingTicket)
      .sort((a, b) => {
        const priority =
          (PRIORITY_ORDER[normalize(a.priority)] ?? 99) -
          (PRIORITY_ORDER[normalize(b.priority)] ?? 99);

        return priority ||
          (ticketCreatedAt(b) ?? 0) -
          (ticketCreatedAt(a) ?? 0);
      })
      .slice(0, 5)
  ), [tickets]);

  const priorityAlerts = useMemo(() => (
    events
      .filter(isOpenAlert)
      .sort((a, b) => {
        const priority =
          (PRIORITY_ORDER[normalize(a.severity)] ?? 99) -
          (PRIORITY_ORDER[normalize(b.severity)] ?? 99);

        return priority ||
          (eventTimestamp(b) ?? 0) -
          (eventTimestamp(a) ?? 0);
      })
      .slice(0, 5)
  ), [events]);

  // ==========================================================
  // DYNAMIC ANALYTICS
  // ==========================================================

  const assetDistributionData = useMemo(
    () => groupCounts(
      assets,
      asset => asset.type || asset.category
    ),
    [assets]
  );

  const userActivityData = useMemo(
    () => groupCounts(
      users.filter(user => normalize(user.status) === 'active'),
      user => user.department
    ),
    [users]
  );

  const securityEventsData = [
    {
      label: 'Login OK',
      value: successfulLogins.length,
      color: 'var(--good)'
    },
    {
      label: 'Failed',
      value: failedLogins.length,
      color: 'var(--bad)'
    },
    {
      label: 'MFA',
      value: mfaChallenges.length,
      color: 'var(--accent)'
    },
    {
      label: 'Blocked',
      value: blockedEvents.length,
      color: 'var(--warn)'
    }
  ];

  const trendData = useMemo(() => {
    const days = Array.from(
      { length: trendPeriod },
      (_, index) => {
        const key = addDays(
          today,
          index - trendPeriod + 1
        );

        return {
          date: key,
          label: shortDate(key),
          opened: 0,
          resolved: 0
        };
      }
    );

    const dailyRecords = new Map(
      days.map(day => [day.date, day])
    );

    tickets.forEach(ticket => {
      const created = ticketCreatedAt(ticket);
      const resolved = ticketResolvedAt(ticket);

      const createdKey = created === null
        ? ''
        : dateKey(created);

      const resolvedKey = resolved === null
        ? ''
        : dateKey(resolved);

      if (dailyRecords.has(createdKey)) {
        dailyRecords.get(createdKey).opened += 1;
      }

      if (dailyRecords.has(resolvedKey)) {
        dailyRecords.get(resolvedKey).resolved += 1;
      }
    });

    return days;
  }, [tickets, today, trendPeriod]);

  const hasTrendData = trendData.some(
    day => day.opened > 0 || day.resolved > 0
  );

  // ==========================================================
  // AVAILABLE REPORT SOURCES
  // ==========================================================

  const availableReportCount =
    Number(canReadUsers) +
    (canReadAssets ? 2 : 0) +
    Number(canReadSoftware) +
    Number(canReadTickets);

  // ==========================================================
  // SUB-DASHBOARD MODULE PREVIEWS
  // ==========================================================

  const modules = [
    {
      id: 'accounts',
      page: 'accounts',
      permission: 'User Profiles',
      title: 'User Accounts',
      icon: IconUsers,
      badge: `${users.length} Total`,
      badgeColor: 'var(--good)',
      metric: `${activeUsers} Active Accounts`,
      summary: 'Manage employee accounts, provisioning and account lifecycle.',
      highlight: `${provisioningUsers} Provisioning`,
      metrics: [
        { label: 'Total Accounts', value: users.length },
        { label: 'Active Accounts', value: activeUsers, color: 'text-good' },
        { label: 'Provisioning', value: provisioningUsers, color: 'text-info' },
        { label: 'Suspended', value: suspendedUsers, color: 'text-warn' },
        { label: 'Deactivated', value: deactivatedUsers, color: 'text-bad' }
      ]
    },
    {
      id: 'access',
      page: 'access',
      permission: 'Security',
      title: 'Access Management',
      icon: IconKey,
      badge: `${pendingAccessRequests.length} Pending`,
      badgeColor: 'var(--warn)',
      metric: `${grantedApplicationAccess} Application Grants`,
      summary: 'Manage technical application access, role permissions and approval requests.',
      highlight: `${approvedAccessRequests} Approved`,
      metrics: [
        { label: 'Application Grants', value: grantedApplicationAccess },
        { label: 'Pending Requests', value: pendingAccessRequests.length, color: 'text-warn' },
        { label: 'Approved Requests', value: approvedAccessRequests, color: 'text-good' },
        { label: 'Rejected Requests', value: rejectedAccessRequests, color: 'text-bad' }
      ]
    },
    {
      id: 'devices',
      page: 'inventory',
      permission: 'Assets',
      title: 'Asset Management',
      icon: IconLaptop,
      badge: `${assets.length} Assets`,
      badgeColor: 'var(--good)',
      metric: `${availableAssets} Available`,
      summary: 'Maintain hardware inventory, condition, warranty and lifecycle status.',
      highlight: `${upcomingWarranties.length} Warranties Due`,
      metrics: [
        { label: 'Total Assets', value: assets.length },
        { label: 'Available Stock', value: availableAssets, color: 'text-good' },
        { label: 'Assigned', value: assignedAssets, color: 'text-info' },
        { label: 'In Repair', value: maintenanceAssets, color: 'text-warn' },
        { label: 'Retired', value: retiredAssets },
        { label: 'Purchase Value', value: money(totalAssetValue) }
      ]
    },
    {
      id: 'allocation',
      page: 'allocate',
      permission: 'Assets',
      title: 'Asset Allocation',
      icon: IconShare,
      badge: `${overdueAssets} Overdue`,
      badgeColor: overdueAssets ? 'var(--bad)' : 'var(--good)',
      metric: `${assignedAssets + overdueAssets} In Custody`,
      summary: 'Assign, return and transfer assets with custody and condition records.',
      highlight: `${custodyHistory.length} Custody Records`,
      metrics: [
        { label: 'Available Assets', value: availableAssets },
        { label: 'Assets In Custody', value: assignedAssets + overdueAssets },
        { label: 'Overdue Returns', value: overdueAssets, color: 'text-bad' },
        { label: 'Custody Records', value: custodyHistory.length },
        {
          label: 'Recorded Returns',
          value: custodyHistory.filter(record => record.returnDate).length,
          color: 'text-good'
        }
      ]
    },
    {
      id: 'helpdesk',
      page: 'desk',
      permission: 'Helpdesk',
      title: 'Helpdesk',
      icon: IconHeadphones,
      badge: `${unresolvedTickets.length} Open`,
      badgeColor: 'var(--info)',
      metric: `${resolvedTickets.length} Resolved`,
      summary: 'Create, assign, prioritize and resolve employee support tickets.',
      highlight: `${breachedTickets.length} SLA Breaches`,
      metrics: [
        { label: 'Total Tickets', value: tickets.length },
        { label: 'Unresolved', value: unresolvedTickets.length },
        { label: 'In Progress', value: inProgressTickets },
        { label: 'Unassigned', value: unassignedTickets, color: 'text-warn' },
        { label: 'Resolved / Closed', value: resolvedTickets.length, color: 'text-good' },
        { label: 'Open SLA Breaches', value: breachedTickets.length, color: 'text-bad' },
        { label: 'Resolution Rate', value: ticketResolutionRate }
      ]
    },
    {
      id: 'software',
      page: 'licences',
      permission: 'Software',
      title: 'Software Management',
      icon: IconPackage,
      badge: `${renewalRecords.length} Renewals Due`,
      badgeColor: renewalRecords.length ? 'var(--warn)' : 'var(--good)',
      metric: `${software.length} Licences`,
      summary: 'Track licence capacity, employee allocation and software renewals.',
      highlight: `${availableLicenceSeats} Unused Seats`,
      metrics: [
        { label: 'Software Licences', value: software.length },
        { label: 'Total Seats', value: totalLicenceSeats },
        { label: 'Used Seats', value: usedLicenceSeats },
        { label: 'Unused Seats', value: availableLicenceSeats, color: 'text-good' },
        { label: 'Utilisation', value: licenceUtilisation },
        { label: 'Expiring Within 30 Days', value: expiringLicences.length, color: 'text-warn' },
        { label: 'Expired Licences', value: expiredLicences.length, color: 'text-bad' },
        { label: 'Annual Cost', value: money(annualSoftwareCost) }
      ]
    },
    {
      id: 'security',
      page: 'events',
      permission: 'Security',
      title: 'Security & Activity',
      icon: IconShield,
      badge: `${activeAlerts.length} Alerts`,
      badgeColor: activeAlerts.length ? 'var(--bad)' : 'var(--good)',
      metric: `${activeSessions.length} Active Sessions`,
      summary: 'Review login activity, security alerts, sessions and administrative audit events.',
      highlight: `${criticalAlerts.length} Critical Alerts`,
      metrics: [
        { label: 'Total Events', value: events.length },
        { label: 'Successful Logins', value: successfulLogins.length, color: 'text-good' },
        { label: 'Failed Logins', value: failedLogins.length, color: 'text-bad' },
        { label: 'Pending Alerts', value: activeAlerts.length, color: 'text-warn' },
        { label: 'Acknowledged Alerts', value: reviewedAlerts },
        { label: 'Active Sessions', value: activeSessions.length },
        { label: 'Admin Activities', value: adminActivities.length }
      ]
    },
    {
      id: 'reports',
      page: 'reports',
      permission: 'Reports',
      title: 'IT Reports',
      icon: IconChart,
      badge: 'CSV & Print',
      badgeColor: 'var(--accent)',
      metric: `${availableReportCount} Available Reports`,
      summary: 'Generate reports from the current inventory, licences and ticket records.',
      highlight: 'Filtered Reports & Exports',
      metrics: [
        { label: 'Available Report Types', value: availableReportCount },
        {
          label: 'Enabled Local Report Schedules',
          value: scheduledReports.filter(report => report.active).length
        },
        ...(canReadAssets ? [
          { label: 'Asset Records', value: assets.length }
        ] : []),
        ...(canReadSoftware ? [
          { label: 'Licence Records', value: software.length }
        ] : []),
        ...(canReadTickets ? [
          { label: 'Ticket Records', value: tickets.length }
        ] : []),
        ...(canReadUsers ? [
          { label: 'Employee Records', value: users.length }
        ] : [])
      ]
    }
  ];

  const visibleModules = modules.filter(
    module => canRead(module.permission) &&
      (
        module.id !== 'reports' ||
        availableReportCount > 0
      )
  );

  const legacyModuleId = activeSubDashboard === 'permissions'
    ? 'access'
    : activeSubDashboard;

  const selectedModuleId = activeCategoryModal ||
    (
      legacyModuleId && legacyModuleId !== 'overview'
        ? legacyModuleId
        : null
    );

  const activeModule = visibleModules.find(
    module => module.id === selectedModuleId
  );

  const openModulePreview = id => {
    if (visibleModules.some(module => module.id === id)) {
      setActiveCategoryModal(id);
    }
  };

  const closeModulePreview = () => {
    setActiveCategoryModal(null);

    if (
      activeSubDashboard &&
      activeSubDashboard !== 'overview'
    ) {
      closeSubDashboard?.();
    }
  };

  useLockBodyScroll(Boolean(activeModule));

  useEffect(() => {
    if (!activeModule) return;

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setActiveCategoryModal(null);
        closeSubDashboard?.();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () =>
      window.removeEventListener('keydown', handleEscape);
  }, [Boolean(activeModule), closeSubDashboard]);

  const openFullModule = module => {
    if (!module || !canRead(module.permission)) return;

    closeModulePreview();
    navigate(module.page);
  };

  // ==========================================================
  // QUICK ACTIONS
  // ==========================================================

  const openDrawer = drawerId => {
    closeModulePreview();
    setDrawerPayload?.(null);
    setActiveDrawer(drawerId);
  };

  const quickActions = [
    {
      id: 'new_user',
      icon: IconUsers,
      label: 'Provision User',
      description: 'Create an employee account',
      allowed: canWrite('User Profiles')
    },
    {
      id: 'register_device',
      icon: IconLaptop,
      label: 'Register Asset',
      description: 'Add hardware to inventory',
      allowed: canWrite('Assets')
    },
    {
      id: 'assign_asset',
      icon: IconShare,
      label: 'Assign Asset',
      description: 'Allocate equipment to an employee',
      allowed:
        canReadAssets &&
        canReadUsers &&
        canUpdate('Assets')
    },
    {
      id: 'new_ticket',
      icon: IconHeadphones,
      label: 'Create Ticket',
      description: 'Register an IT support request',
      allowed:
        canWrite('Helpdesk') &&
        canReadUsers
    },
    {
      id: 'add_licence',
      icon: IconPackage,
      label: 'Add Licence',
      description: 'Register a software subscription',
      allowed: canWrite('Software')
    },
    {
      id: 'audit_report',
      icon: IconChart,
      label: 'Generate Audit Report',
      description: 'Export recorded security activity',
      allowed: canReadReports && canReadSecurity
    }
  ].filter(action => action.allowed);

  // ==========================================================
  // APPROVAL AND RENEWAL CONFIRMATIONS
  // ==========================================================

  const confirmAction = () => {
    if (!confirmation) return;

    const { type, id } = confirmation;

    let result = false;

    if (type === 'approve' && canUpdate('Security')) {
      result = approveAccessRequest(id);
    }

    if (type === 'reject' && canUpdate('Security')) {
      result = rejectAccessRequest(id);
    }

    if (type === 'renew' && canUpdate('Software')) {
      result = markLicenceRenewed(id);
    }

    if (type === 'acknowledge' && canUpdate('Security')) {
      result = acknowledgeAlert(id);
    }

    if (result !== false) {
      setConfirmation(null);
    }
  };

  // ==========================================================
  // OVERVIEW KPI CONFIGURATION
  // ==========================================================

  const overviewKPIs = [
    {
      id: 'users',
      permission: 'User Profiles',
      label: 'Total User Accounts',
      value: users.length,
      delta: `${activeUsers} Active · ${provisioningUsers} Provisioning`,
      deltaType: 'good',
      target: 'accounts'
    },
    {
      id: 'assets',
      permission: 'Assets',
      label: 'Total IT Assets',
      value: assets.length,
      delta: `${assignedAssets} Assigned · ${availableAssets} Available`,
      deltaType: 'neutral',
      target: 'devices'
    },
    {
      id: 'tickets',
      permission: 'Helpdesk',
      label: 'Open Support Tickets',
      value: unresolvedTickets.length,
      delta: `${breachedTickets.length} Recorded SLA Breaches`,
      deltaType: breachedTickets.length ? 'bad' : 'good',
      target: 'helpdesk'
    },
    {
      id: 'alerts',
      permission: 'Security',
      label: 'Security Alerts',
      value: activeAlerts.length,
      delta: `${criticalAlerts.length} Critical · Pending Review`,
      deltaType: activeAlerts.length ? 'bad' : 'good',
      target: 'security'
    },
    {
      id: 'available',
      permission: 'Assets',
      label: 'Available / Assigned Assets',
      value: `${availableAssets} / ${assignedAssets}`,
      delta: `${overdueAssets} Overdue Returns`,
      deltaType: overdueAssets ? 'warn' : 'good',
      target: 'allocation'
    },
    {
      id: 'requests',
      permission: 'Security',
      label: 'Pending Access Requests',
      value: pendingAccessRequests.length,
      delta: `${approvedAccessRequests} Approved Requests`,
      deltaType: pendingAccessRequests.length ? 'warn' : 'good',
      target: 'access'
    },
    {
      id: 'licences',
      permission: 'Software',
      label: 'Software Licences',
      value: software.length,
      delta: `${usedLicenceSeats} / ${totalLicenceSeats} Seats Used`,
      deltaType: 'neutral',
      target: 'software'
    },
    {
      id: 'renewals',
      permission: 'Software',
      label: 'Licence Renewals Due',
      value: renewalRecords.length,
      delta: `${expiredLicences.length} Expired · ${expiringLicences.length} Upcoming`,
      deltaType: renewalRecords.length ? 'warn' : 'good',
      target: 'software'
    },
    {
      id: 'resolved',
      permission: 'Helpdesk',
      label: 'Resolved Support Tickets',
      value: resolvedTickets.length,
      delta: `${ticketResolutionRate} Resolution Rate`,
      deltaType: 'good',
      target: 'helpdesk'
    },
    {
      id: 'sessions',
      permission: 'Security',
      label: 'Active Sessions',
      value: activeSessions.length,
      delta: `${failedLogins.length} Recorded Failed Logins`,
      deltaType: failedLogins.length ? 'warn' : 'neutral',
      target: 'security'
    },
    {
      id: 'warranties',
      permission: 'Assets',
      label: 'Upcoming Warranty Expiry',
      value: upcomingWarranties.length,
      delta: 'Due within the next 30 days',
      deltaType: upcomingWarranties.length ? 'warn' : 'good',
      target: 'devices'
    },
    {
      id: 'activity',
      permission: 'Security',
      label: 'Administrative Activities',
      value: adminActivities.length,
      delta: `${events.length} Total Recorded Events`,
      deltaType: 'neutral',
      target: 'security'
    }
  ].filter(item => canRead(item.permission));

  // ==========================================================
  // DASHBOARD INTERFACE
  // ==========================================================

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">

      {/* SECTION 1: IT OPERATIONS OVERVIEW */}

      <section
        aria-label="IT operations overview"
        className="flex flex-col gap-3"
      >
        <SectionHeading
          title="IT Operations Overview"
          description="Current application records"
        />

        {overviewKPIs.length ? (
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {overviewKPIs.map(item => (
              <KpiTile
                key={item.id}
                label={item.label}
                value={item.value}
                delta={item.delta}
                deltaType={item.deltaType}
                compact
                wrapDetails
                onClick={() => openModulePreview(item.target)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={IconShield}
              message="Your role does not have access to the operational data sources."
            />
          </Card>
        )}
      </section>

      {/* SECTION 2: ITEMS REQUIRING ATTENTION */}

      {(
        (canReadSecurity && activeAlerts.length > 0) ||
        (canReadAssets && overdueAssets > 0) ||
        (canReadTickets && breachedTickets.length > 0) ||
        (canReadSoftware && expiredLicences.length > 0)
      ) && (
        <Card
          title="Requires Attention"
          subText="Operational items pending review or follow-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

            {canReadSecurity && activeAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('events')}
                className="p-3 rounded-xl border border-bad/30 bg-bad/10 text-left flex items-center gap-3 hover:bg-bad/20 transition-colors"
              >
                <IconShield className="w-5 h-5 text-bad shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[16px] text-bad">
                    {activeAlerts.length} Security Alerts
                  </span>
                  <span className="text-[11px] text-muted">
                    {criticalAlerts.length} critical
                  </span>
                </div>
              </button>
            )}

            {canReadAssets && overdueAssets > 0 && (
              <button
                type="button"
                onClick={() => navigate('allocate')}
                className="p-3 rounded-xl border border-warn/30 bg-warn/10 text-left flex items-center gap-3 hover:bg-warn/20 transition-colors"
              >
                <IconLaptop className="w-5 h-5 text-warn shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[16px] text-warn">
                    {overdueAssets} Overdue Assets
                  </span>
                  <span className="text-[11px] text-muted">
                    Equipment return pending
                  </span>
                </div>
              </button>
            )}

            {canReadTickets && breachedTickets.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('desk')}
                className="p-3 rounded-xl border border-bad/30 bg-bad/10 text-left flex items-center gap-3 hover:bg-bad/20 transition-colors"
              >
                <IconHeadphones className="w-5 h-5 text-bad shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[16px] text-bad">
                    {breachedTickets.length} SLA Breaches
                  </span>
                  <span className="text-[11px] text-muted">
                    Recorded unresolved breaches
                  </span>
                </div>
              </button>
            )}

            {canReadSoftware && expiredLicences.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('licences')}
                className="p-3 rounded-xl border border-warn/30 bg-warn/10 text-left flex items-center gap-3 hover:bg-warn/20 transition-colors"
              >
                <IconPackage className="w-5 h-5 text-warn shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[16px] text-warn">
                    {expiredLicences.length} Expired Licences
                  </span>
                  <span className="text-[11px] text-muted">
                    Renewal review required
                  </span>
                </div>
              </button>
            )}

          </div>
        </Card>
      )}

      {/* SECTION 3: ANALYTICS */}

      {(canReadAssets || canReadTickets ||
        canReadUsers || canReadSecurity) && (
        <section className="flex flex-col gap-3">

          <SectionHeading
            title="IT Analytics & Workload Metrics"
            description="Calculated from stored records"
          />

          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 lg:grid-cols-2 gap-3">

            {canReadAssets && (
              <Card
                title="Asset Distribution"
                subText="Hardware inventory by asset category"
                className="dashboard-analytics-card"
                action={
                  <ViewAllButton
                    onClick={() => navigate('inventory')}
                  />
                }
              >
                {assetDistributionData.length ? (
                  <DonutChart
                    data={assetDistributionData}
                    size={150}
                    ariaLabel="Hardware asset category distribution"
                  />
                ) : (
                  <EmptyState
                    icon={IconLaptop}
                    message="No asset records available."
                  />
                )}
              </Card>
            )}

            {canReadTickets && (
              <Card
                title="Helpdesk Ticket Trends"
                subText={`Tickets created and resolved over the last ${trendPeriod} calendar days`}
                className="dashboard-analytics-card"
                action={
                  <select
                    value={trendPeriod}
                    onChange={event =>
                      setTrendPeriod(Number(event.target.value))
                    }
                    aria-label="Ticket trend period"
                    className="px-2.5 py-1.5 text-[12px] rounded-lg border border-line bg-surface2 text-ink focus:outline-none focus:border-accent"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                  </select>
                }
              >
                {hasTrendData ? (
                  <LineChart
                    data={trendData}
                    xKey="label"
                    yKey1="opened"
                    yKey2="resolved"
                    y1Label="Created Tickets"
                    y2Label="Resolved Tickets"
                    height={180}
                  />
                ) : (
                  <EmptyState
                    icon={IconChart}
                    message="No recorded ticket creation or resolution dates in this period."
                  />
                )}

                <p className="text-[10.5px] text-muted">
                  Resolution dates are estimated from recorded elapsed hours
                  when an explicit resolution timestamp is unavailable.
                  Undated records are excluded.
                </p>

                <div className="flex justify-end">
                  <ViewAllButton onClick={() => navigate('desk')}>
                    Open Helpdesk
                  </ViewAllButton>
                </div>
              </Card>
            )}

            {canReadSecurity && (
              <Card
                title="Security Events Breakdown"
                subText="Recorded authentication results"
                className="dashboard-analytics-card"
                action={
                  <ViewAllButton
                    onClick={() => navigate('events')}
                  />
                }
              >
                {events.length ? (
                  <BarChart
                    data={securityEventsData}
                    height={180}
                    ariaLabel="Login and security event results"
                  />
                ) : (
                  <EmptyState
                    icon={IconShield}
                    message="No security activity recorded."
                  />
                )}
              </Card>
            )}

            {canReadUsers && (
              <Card
                title="Active Users by Department"
                subText="Active employee accounts across departments"
                className="dashboard-analytics-card"
                action={
                  <ViewAllButton
                    onClick={() => navigate('accounts')}
                  />
                }
              >
                {userActivityData.length ? (
                  <div className="overflow-x-auto">
                    <div style={{
                      minWidth: Math.max(
                        340,
                        userActivityData.length * 90
                      )
                    }}>
                      <BarChart
                        data={userActivityData}
                        height={180}
                        ariaLabel="Active user accounts by department"
                      />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={IconUsers}
                    message="No active employee accounts available."
                  />
                )}
              </Card>
            )}

          </div>
        </section>
      )}

      {/* SECTION 4: QUICK ACTIONS */}

      {quickActions.length > 0 && (
        <Card
          title="Quick Actions"
          subText="Frequently used IT administration operations"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {quickActions.map(action => (
              <QuickAction
                key={action.id}
                icon={action.icon}
                label={action.label}
                description={action.description}
                onClick={() => openDrawer(action.id)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* SECTION 5: OPERATIONS AND RECENT ACTIVITY */}

      <section className="flex flex-col gap-3">

        <SectionHeading title="Operations & Recent Activity" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* RECENT ADMINISTRATIVE AND SECURITY ACTIVITY */}

          {canReadSecurity && (
            <Card
              title="Recent Activities"
              subText="Latest recorded IT and security events"
              action={
                <ViewAllButton
                  onClick={() => navigate('events')}
                />
              }
            >
              {recentActivities.length ? (
                <div className="flex flex-col divide-y divide-dashed divide-line">

                  {recentActivities.map(event => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => navigate('events')}
                      className="flex items-center justify-between gap-3 py-3 px-1 text-left hover:bg-surface2/40 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={event.userName || 'System'}
                          size={30}
                        />

                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[13px] font-semibold text-ink line-clamp-2">
                            {event.event}
                          </span>

                          <span className="text-[11px] text-muted truncate">
                            {event.userName || 'System'} ·
                            {' '}{event.category || 'Activity'}
                          </span>

                          <span className="text-[10.5px] text-muted font-data">
                            {event.time || event.createdAt || '—'}
                          </span>
                        </div>
                      </div>

                      <StatusPill status={event.result || 'Unknown'} />
                    </button>
                  ))}

                </div>
              ) : (
                <EmptyState
                  icon={IconClock}
                  message="No recent activities recorded."
                />
              )}
            </Card>
          )}

          {/* RECENT ASSET ALLOCATIONS AND RETURNS */}

          {canReadAssets && (
            <Card
              title="Latest Asset Allocations"
              subText="Recent equipment handovers and returns"
              action={
                <ViewAllButton
                  onClick={() => navigate('allocate')}
                />
              }
            >
              {recentAllocations.length ? (
                <div className="flex flex-col divide-y divide-dashed divide-line">

                  {recentAllocations.map(record => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => navigate('allocate')}
                      className="flex items-center justify-between gap-3 py-3 px-1 text-left hover:bg-surface2/40 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">

                        <div className="w-9 h-9 shrink-0 rounded-lg border border-line bg-surface2 flex items-center justify-center text-accent">
                          <IconLaptop className="w-4 h-4" />
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">

                          <span className="text-[13px] font-bold text-accent font-data">
                            {record.assetTag}
                          </span>

                          <span className="text-[12px] text-ink truncate">
                            {record.model}
                          </span>

                          <span className="text-[11px] text-muted truncate">
                            {record.returnDate
                              ? 'Returned by'
                              : 'Assigned to'}: {record.userName || '—'}
                          </span>

                          <span className="text-[10.5px] text-muted">
                            {record.returnDate || record.assignedDate || '—'}
                          </span>

                        </div>
                      </div>

                      <span className={`shrink-0 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold ${
                        record.returnDate
                          ? 'border-good/30 bg-good/10 text-good'
                          : 'border-info/30 bg-info/10 text-info'
                      }`}>
                        {record.returnDate ? 'Returned' : 'In Custody'}
                      </span>
                    </button>
                  ))}

                </div>
              ) : (
                <EmptyState
                  icon={IconShare}
                  message="No custody history recorded."
                />
              )}
            </Card>
          )}

          {/* PENDING ACCESS REQUESTS */}

          {canReadSecurity && (
            <Card
              title={`Pending Access Requests (${pendingAccessRequests.length})`}
              subText="Technical access requests awaiting approval"
              action={
                <ViewAllButton
                  onClick={() => navigate('access')}
                />
              }
            >
              {pendingAccessRequests.length ? (
                <div className="flex flex-col divide-y divide-dashed divide-line">

                  {pendingAccessRequests.slice(0, 5).map(request => (
                    <div
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={request.userName || 'Employee'}
                          size={30}
                        />

                        <div className="flex flex-col gap-1 min-w-0">

                          <span className="text-[13px] font-semibold text-ink">
                            {request.userName}
                          </span>

                          <span className="text-[12px] text-muted">
                            Requested:
                            {' '}
                            <strong className="text-accent">
                              {request.app}
                            </strong>
                          </span>

                          <span className="text-[10.5px] text-muted">
                            {request.requestedDate || request.time || '—'}
                          </span>

                        </div>
                      </div>

                      {canUpdate('Security') ? (
                        <div className="flex items-center gap-1.5">

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setConfirmation({
                              type: 'approve',
                              id: request.id,
                              title: 'Approve Access Request',
                              message: `Grant ${request.app} access to ${request.userName} in the local access matrix?`,
                              label: 'Approve Access'
                            })}
                          >
                            Approve
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmation({
                              type: 'reject',
                              id: request.id,
                              title: 'Reject Access Request',
                              message: `Reject ${request.userName}'s pending request for ${request.app}?`,
                              label: 'Reject Request'
                            })}
                          >
                            Reject
                          </Button>

                        </div>
                      ) : (
                        <StatusPill status="pending" />
                      )}
                    </div>
                  ))}

                </div>
              ) : (
                <EmptyState
                  icon={IconCheck}
                  message="No pending access requests."
                />
              )}
            </Card>
          )}

          {/* SOFTWARE RENEWAL QUEUE */}

          {canReadSoftware && (
            <Card
              title={`Software Licence Renewals (${renewalRecords.length})`}
              subText="Expired licences and renewals due within 30 days"
              action={
                <ViewAllButton
                  onClick={() => navigate('licences')}
                />
              }
            >
              {renewalRecords.length ? (
                <div className="flex flex-col divide-y divide-dashed divide-line">

                  {renewalRecords.slice(0, 5).map(licence => (
                    <div
                      key={licence.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => navigate('licences')}
                        className="flex items-center gap-2.5 min-w-0 text-left hover:text-accent"
                      >

                        <div className="w-9 h-9 shrink-0 rounded-lg bg-surface2 border border-line flex items-center justify-center text-accent">
                          <IconPackage className="w-4 h-4" />
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">

                          <span className="font-semibold text-[13px] text-ink">
                            {licence.name}
                          </span>

                          <span className="text-[11px] text-muted">
                            {licence.expiryDate || licence.renewalDate}
                            {' · '}
                            {licence.seatsUsed}/{licence.totalSeats} Seats
                          </span>

                          <span className={`text-[11px] font-semibold ${
                            licence.remainingDays < 0
                              ? 'text-bad'
                              : 'text-warn'
                          }`}>
                            {licence.remainingDays < 0
                              ? `Expired ${Math.abs(licence.remainingDays)} days ago`
                              : licence.remainingDays === 0
                                ? 'Expires today'
                                : `Expires in ${licence.remainingDays} days`}
                          </span>

                        </div>

                      </button>

                      {canUpdate('Software') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmation({
                            type: 'renew',
                            id: licence.id,
                            title: 'Renew Software Licence',
                            message: `Record a one-year renewal for ${licence.name}? This updates the local licence record and does not purchase a subscription.`,
                            label: 'Confirm Renewal'
                          })}
                        >
                          Renew
                        </Button>
                      )}

                    </div>
                  ))}

                </div>
              ) : (
                <EmptyState
                  icon={IconCheck}
                  message="No expired licences or renewals due within 30 days."
                />
              )}
            </Card>
          )}

          {/* PRIORITY SUPPORT TICKETS */}

          {canReadTickets && (
            <Card
              title="Priority Support Tickets"
              subText={`${criticalTickets.length} unresolved critical tickets`}
              action={
                <ViewAllButton
                  onClick={() => navigate('desk')}
                />
              }
            >
              {priorityTickets.length ? (
                <div className="flex flex-col divide-y divide-dashed divide-line">

                  {priorityTickets.map(ticket => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() =>
                        navigate('desk', { ticketId: ticket.id })
                      }
                      className="flex items-center justify-between gap-3 text-left py-3 hover:bg-surface2/40 rounded-lg"
                    >
                      <div className="flex flex-col min-w-0 gap-1">

                        <span className="text-[11px] text-accent font-data font-semibold">
                          {ticket.id}
                        </span>

                        <span className="text-[13px] font-semibold text-ink line-clamp-2">
                          {ticket.title}
                        </span>

                        <span className="text-[11px] text-muted">
                          Technician: {ticket.assignedTo || 'Unassigned'}
                        </span>

                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusPill status={ticket.priority} />
                        <StatusPill status={ticket.status} />
                      </div>
                    </button>
                  ))}

                </div>
              ) : (
                <EmptyState
                  icon={IconCheck}
                  message="No unresolved support tickets."
                />
              )}
            </Card>
          )}

          {/* SECURITY ALERT QUEUE */}

          {canReadSecurity && (
            <Card
              title={`Security Alerts (${activeAlerts.length})`}
              subText="Unacknowledged security events"
              action={
                <ViewAllButton
                  onClick={() => navigate('events')}
                />
              }
            >
              {priorityAlerts.length ? (
                <div className="flex flex-col gap-2.5">

                  {priorityAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                        normalize(alert.severity) === 'critical'
                          ? 'border-bad/30 bg-bad/5'
                          : 'border-line bg-surface2/30'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">

                        <IconAlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            normalize(alert.severity) === 'critical'
                              ? 'text-bad'
                              : 'text-warn'
                          }`}
                        />

                        <div className="flex flex-col gap-1 min-w-0">

                          <button
                            type="button"
                            onClick={() => navigate('events')}
                            className="text-[12.5px] text-left font-semibold text-ink hover:text-accent"
                          >
                            {alert.event}
                          </button>

                          <span className="text-[11px] text-muted">
                            {alert.userName || 'System'} ·
                            {' '}{alert.severity || 'Unspecified'}
                          </span>

                          <span className="text-[10.5px] text-muted">
                            {alert.time || alert.createdAt || '—'}
                          </span>

                        </div>
                      </div>

                      {canUpdate('Security') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmation({
                            type: 'acknowledge',
                            id: alert.id,
                            title: 'Acknowledge Security Alert',
                            message: `Mark "${alert.event}" as reviewed? This does not resolve the underlying security issue.`,
                            label: 'Acknowledge'
                          })}
                        >
                          Acknowledge
                        </Button>
                      )}

                    </div>
                  ))}

                </div>
              ) : (
                <EmptyState
                  icon={IconCheck}
                  message="No unacknowledged alerts in recorded security activity."
                />
              )}
            </Card>
          )}

        </div>
      </section>

      {/* SECTION 6: SECURITY SUMMARY */}

      {canReadSecurity && (
        <section className="flex flex-col gap-3">

          <SectionHeading
            title="Security & Authentication Overview"
            description="Recorded security activity"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

            <KpiTile
              label="Successful Logins"
              value={successfulLogins.length}
              delta="Recorded successful authentication"
              deltaType="good"
              onClick={() => navigate('events')}
            />

            <KpiTile
              label="Failed Login Attempts"
              value={failedLogins.length}
              delta={`${blockedEvents.length} Blocked / Suspicious Events`}
              deltaType={failedLogins.length ? 'bad' : 'neutral'}
              onClick={() => navigate('events')}
            />

            <KpiTile
              label="MFA Challenges"
              value={mfaChallenges.length}
              delta="Recorded authentication challenges"
              deltaType="neutral"
              onClick={() => navigate('events')}
            />

            <KpiTile
              label="Acknowledged Security Alerts"
              value={reviewedAlerts}
              delta={`${activeAlerts.length} Pending Review`}
              deltaType={activeAlerts.length ? 'warn' : 'good'}
              onClick={() => navigate('events')}
            />

          </div>
        </section>
      )}

      {/* SECTION 7: MODULE OPERATIONS HUB */}

      {visibleModules.length > 0 && (
        <section className="flex flex-col gap-3 pt-2">

          <SectionHeading
            title="IT Administration Modules"
            description="Quick access to operational workspaces"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap)]">

            {visibleModules.map(module => {
              const Icon = module.icon;

              return (
                <button
                  type="button"
                  key={module.id}
                  data-sub-card={module.id}
                  onClick={() => openModulePreview(module.id)}
                  className="p-4 rounded-[var(--radius)] bg-surface border border-line hover:border-accent hover:bg-surface2 transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-[var(--card-shadow)] backdrop-blur-[18px] text-left"
                >

                  <div className="flex flex-col gap-3">

                    <div className="flex items-center justify-between gap-2">

                      <div className="w-9 h-9 shrink-0 rounded-lg bg-surface2 border border-line flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-on-accent transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>

                      <span
                        style={{ color: module.badgeColor }}
                        className="text-[10.5px] font-semibold px-2 py-1 rounded-full border border-line bg-surface2"
                      >
                        {module.badge}
                      </span>

                    </div>

                    <div className="flex flex-col gap-1.5">

                      <h4 className="font-display font-bold text-[15px] text-ink group-hover:text-accent transition-colors">
                        {module.title}
                      </h4>

                      <span className="text-[13px] font-data font-bold text-ink">
                        {module.metric}
                      </span>

                      <span className="text-[11.5px] text-muted">
                        {module.summary}
                      </span>

                    </div>

                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed border-line">

                    <span className="text-[10.5px] text-muted">
                      {module.highlight}
                    </span>

                    <span className="text-accent font-semibold text-[11px] flex items-center gap-1 shrink-0">
                      Open Panel
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </span>

                  </div>

                </button>
              );
            })}

          </div>
        </section>
      )}

      {/* MODULE PREVIEW MODAL */}

      {activeModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="module-preview-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
        >

          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={closeModulePreview}
            aria-hidden="true"
          />

          <div
            id="slide-over-subdashboard-panel"
            className="relative z-10 w-full max-w-[1000px] max-h-[88vh] bg-surface border border-line rounded-[var(--radius)] backdrop-blur-[18px] shadow-card flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >

            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-line shrink-0">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 shrink-0 rounded-xl bg-surface2 border border-line flex items-center justify-center text-accent">
                  {React.createElement(activeModule.icon, {
                    className: 'w-5 h-5'
                  })}
                </div>

                <div>
                  <h3
                    id="module-preview-title"
                    className="font-display font-bold text-[18px] text-ink"
                  >
                    {activeModule.title}
                  </h3>

                  <p className="text-[12px] text-muted">
                    {activeModule.summary}
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-2">

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={closeModulePreview}
                >
                  Close
                </Button>

                <button
                  type="button"
                  onClick={closeModulePreview}
                  aria-label="Close module preview"
                  className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface2"
                >
                  ✕
                </button>

              </div>

            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">

              <SectionHeading
                title="Module Overview"
                description="Current stored records"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeModule.metrics.map(metric => (
                  <PreviewMetric
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    color={metric.color}
                  />
                ))}
              </div>

              {activeModule.id === 'devices' &&
                assetDistributionData.length > 0 && (
                  <Card title="Inventory Distribution">
                    <DonutChart
                      data={assetDistributionData}
                      size={150}
                    />
                  </Card>
              )}

              {activeModule.id === 'accounts' &&
                userActivityData.length > 0 && (
                  <Card title="Active Users by Department">
                    <div className="overflow-x-auto">
                      <div style={{
                        minWidth: Math.max(
                          340,
                          userActivityData.length * 90
                        )
                      }}>
                        <BarChart
                          data={userActivityData}
                          height={200}
                        />
                      </div>
                    </div>
                  </Card>
              )}

              {activeModule.id === 'helpdesk' &&
                hasTrendData && (
                  <Card title="Support Ticket Trends">
                    <LineChart
                      data={trendData}
                      height={200}
                      xKey="label"
                      yKey1="opened"
                      yKey2="resolved"
                      y1Label="Created"
                      y2Label="Resolved"
                    />
                  </Card>
              )}

              {activeModule.id === 'security' &&
                events.length > 0 && (
                  <Card title="Security Event Breakdown">
                    <BarChart
                      data={securityEventsData}
                      height={200}
                    />
                  </Card>
              )}

              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-ink">
                  Manage {activeModule.title}
                </span>

                <span className="text-[12px] text-muted">
                  Open the full workspace to manage records, apply
                  filters and perform authorized operations.
                </span>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-line shrink-0">

              <Button
                variant="secondary"
                onClick={closeModulePreview}
              >
                Back to Dashboard
              </Button>

              <Button
                variant="primary"
                onClick={() => openFullModule(activeModule)}
              >
                Open Full Page
                <IconArrowRight className="w-4 h-4" />
              </Button>

            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}

      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        title={confirmation?.title || 'Confirm Action'}
        message={confirmation?.message || ''}
        confirmLabel={confirmation?.label || 'Confirm'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmation(null)}
      />

      {/* DATA SOURCE INFORMATION */}

      <div className="flex items-start gap-2 p-3 rounded-xl border border-line bg-surface2/30">

        <IconShield className="w-4 h-4 text-muted shrink-0 mt-0.5" />

        <p className="text-[11px] text-muted">
          Dashboard metrics are calculated from local application records.
          Date-based reports use Indian Standard Time. External identity
          provisioning, device monitoring and vendor transactions require
          backend integration.
        </p>

      </div>

    </div>
  );
}
