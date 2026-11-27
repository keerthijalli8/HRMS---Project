
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Avatar } from '../shared/Avatar';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { EmptyState } from '../shared/EmptyState';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';

import {
  IconShield,
  IconSearch,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconGlobe,
  IconLaptop,
  IconKey,
  IconUsers,
  IconDownload,
  IconX
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const TIME_ZONE = 'Asia/Kolkata';

const PAGE_SIZES = [5, 10, 20, 50];

const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'warn',
  'low',
  'info'
];

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  warn: 3,
  low: 4,
  info: 5
};

const FILTER_CLASS =
  'px-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const INPUT_CLASS =
  'w-full px-3 py-2 text-[13px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

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

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function matchesQuery(values, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const text = values.map(normalize).join(' ');

  return words.every(word => text.includes(word));
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value)
    .trim()
    .replace(/\bIST\b/gi, 'GMT+0530');

  const parsed = Date.parse(text);

  return Number.isFinite(parsed) ? parsed : null;
}

function getEventTimestamp(event) {
  return (
    parseTimestamp(event.createdAt) ??
    parseTimestamp(event.timestamp) ??
    parseTimestamp(event.time)
  );
}

function getDateKey(value = Date.now()) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const get = type => parts.find(part => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function getPreviousDate(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}

function getEventDateKey(event) {
  const timestamp = getEventTimestamp(event);

  return timestamp === null
    ? ''
    : getDateKey(timestamp);
}

function formatTimestamp(value) {
  const parsed = parseTimestamp(value);

  if (parsed === null) {
    return String(value || 'Not recorded');
  }

  return new Date(parsed).toLocaleString('en-GB', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' IST';
}

function isAlert(event) {
  return normalize(event.category) === 'alerts';
}

function isLogin(event) {
  return ['logins', 'failed'].includes(
    normalize(event.category)
  );
}

function isFailedLogin(event) {
  return (
    normalize(event.category) === 'failed' ||
    normalize(event.result) === 'failed login'
  );
}

function isSuccessfulLogin(event) {
  return (
    normalize(event.category) === 'logins' &&
    normalize(event.result) === 'success'
  );
}

function isAdminAction(event) {
  return normalize(event.category) === 'admin actions';
}

function isMfaEvent(event) {
  return normalize(event.result) === 'mfa challenge';
}

function isOpenAlert(event) {
  return isAlert(event) && !event.acknowledged;
}

function severityLabel(value) {
  const severity = normalize(value);

  if (severity === 'warn') return 'Warning';
  if (severity === 'info') return 'Information';

  return severity
    ? severity.charAt(0).toUpperCase() + severity.slice(1)
    : 'Unspecified';
}

function categoryLabel(value) {
  const labels = {
    Logins: 'Login Activity',
    Failed: 'Failed Attempts',
    'Admin actions': 'Admin Actions',
    Alerts: 'Security Alerts'
  };

  return labels[value] || value || 'Other';
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

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function SeverityBadge({ severity }) {
  const value = normalize(severity);

  const color =
    value === 'critical'
      ? 'bg-bad/15 text-bad border-bad/40'
      : ['high', 'warn', 'medium'].includes(value)
        ? 'bg-warn/15 text-warn border-warn/40'
        : value === 'info'
          ? 'bg-info/15 text-info border-info/40'
          : 'bg-surface2 text-muted border-line';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${color}`}>
      {value === 'critical' && (
        <IconAlertTriangle className="w-3 h-3" />
      )}

      {severityLabel(value)}
    </span>
  );
}

function AlertStatus({ event }) {
  if (!isAlert(event)) {
    return (
      <span className="text-[11px] text-muted">
        Logged
      </span>
    );
  }

  return event.acknowledged ? (
    <span className="inline-flex items-center gap-1 text-good text-[11px] font-semibold">
      <IconCheck className="w-3.5 h-3.5" />
      Acknowledged
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-warn text-[11px] font-semibold">
      <IconClock className="w-3.5 h-3.5" />
      Pending Review
    </span>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const firstRecord = total
    ? (currentPage - 1) * pageSize + 1
    : 0;

  const lastRecord = Math.min(
    currentPage * pageSize,
    total
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">

      <div className="flex flex-wrap items-center gap-3">

        <span className="text-[12px] text-muted">
          Showing {firstRecord}–{lastRecord} of {total} records
        </span>

        <label className="flex items-center gap-2 text-[11px] text-muted">
          Rows per page

          <select
            value={pageSize}
            onChange={event =>
              onPageSizeChange(Number(event.target.value))
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

      <div className="flex items-center gap-2">

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>

        <span className="text-[12px] font-data text-muted">
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>

      </div>

    </div>
  );
}

// ============================================================
// SECURITY & ACTIVITY PAGE
// ============================================================

export function SecurityActivityPage() {
  const {
    events = [],
    activeSessions = [],
    acknowledgeAlert,
    terminateSession,
    hasPermission,
    showToast
  } = useStore();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canReadSecurity = hasPermission('Security', 'read');
  const canUpdateSecurity = hasPermission('Security', 'update');
  const canDeleteSecurity = hasPermission('Security', 'delete');

  const canExportSecurity =
    canReadSecurity && hasPermission('Reports', 'read');

  // ==========================================================
  // STATE
  // ==========================================================

  const [activeCategory, setActiveCategory] = useState('all');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [acknowledgementFilter, setAcknowledgementFilter] =
    useState('All');

  const [dateRange, setDateRange] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sortField, setSortField] = useState('time');
  const [sortAsc, setSortAsc] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [now, setNow] = useState(Date.now);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('All');

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [bulkAcknowledgeTarget, setBulkAcknowledgeTarget] =
    useState(null);

  const [selectedEventIds, setSelectedEventIds] = useState([]);

  const today = getDateKey(now);

  // Update calendar-based filters while the page remains open.

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  // ==========================================================
  // DYNAMIC RECORDS
  // ==========================================================

  const selectedAuditEvent = events.find(
    event => event.id === selectedEventId
  ) || null;

  const selectedSession = activeSessions.find(
    session => session.id === selectedSessionId
  ) || null;

  const activeThreats = useMemo(() => {
    return events
      .filter(isOpenAlert)
      .sort((a, b) => {
        const severityDifference =
          (SEVERITY_ORDER[normalize(a.severity)] ?? 99) -
          (SEVERITY_ORDER[normalize(b.severity)] ?? 99);

        return severityDifference ||
          (getEventTimestamp(b) ?? 0) -
          (getEventTimestamp(a) ?? 0);
      });
  }, [events]);

  const criticalThreatCount = activeThreats.filter(
    event => normalize(event.severity) === 'critical'
  ).length;

  // ==========================================================
  // DYNAMIC KPIs
  // ==========================================================

  const summary = useMemo(() => {
    const todayEvents = events.filter(
      event => getEventDateKey(event) === today
    );

    const totalLogins = events.filter(isLogin).length;

    const successfulLogins =
      events.filter(isSuccessfulLogin).length;

    const failedLogins =
      events.filter(isFailedLogin).length;

    const totalAlerts =
      events.filter(isAlert).length;

    const acknowledgedAlerts = events.filter(
      event => isAlert(event) && event.acknowledged
    ).length;

    const adminActions =
      events.filter(isAdminAction).length;

    const authenticationAttempts =
      successfulLogins + failedLogins;

    return {
      total: events.length,
      totalLogins,
      successfulLogins,
      failedLogins,
      adminActions,
      totalAlerts,
      acknowledgedAlerts,
      openAlerts: activeThreats.length,
      criticalAlerts: criticalThreatCount,
      activeSessions: activeSessions.length,

      todaySuccessful: todayEvents.filter(isSuccessfulLogin).length,
      todayFailed: todayEvents.filter(isFailedLogin).length,
      todayEvents: todayEvents.length,

      blocked: events.filter(
        event => normalize(event.result) === 'blocked / suspicious'
      ).length,

      mfa: events.filter(isMfaEvent).length,

      loginSuccessRate: authenticationAttempts > 0
        ? Math.round(
            (successfulLogins / authenticationAttempts) * 100
          )
        : null
    };
  }, [
    events,
    activeSessions,
    activeThreats,
    criticalThreatCount,
    today
  ]);

  const categories = [
    {
      id: 'all',
      label: 'Total Activity',
      icon: IconShield,
      metric: String(summary.total),
      metricLabel: 'Security Events',
      subText: `${summary.todayEvents} events today`,
      badge: 'All Logs',
      badgeColor: 'sky'
    },
    {
      id: 'activity',
      label: 'Login Activity',
      icon: IconKey,
      metric: String(summary.totalLogins),
      metricLabel: 'Login Records',
      subText: `${summary.successfulLogins} successful logins`,
      badge: `${summary.todaySuccessful} Today`,
      badgeColor: 'emerald'
    },
    {
      id: 'failed',
      label: 'Failed Logins',
      icon: IconAlertTriangle,
      metric: String(summary.failedLogins),
      metricLabel: 'Failed Attempts',
      subText: `${summary.todayFailed} failed today`,
      badge: 'Authentication',
      badgeColor: 'amber'
    },
    {
      id: 'alerts',
      label: 'Security Alerts',
      icon: IconShield,
      metric: String(summary.openAlerts),
      metricLabel: 'Open Alerts',
      subText: `${summary.criticalAlerts} critical alerts`,
      badge: summary.openAlerts ? 'Review' : 'Clear',
      badgeColor: summary.openAlerts ? 'red' : 'emerald'
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: IconClock,
      metric: String(summary.adminActions),
      metricLabel: 'Admin Actions',
      subText: 'Recorded administrative activity',
      badge: 'Activity',
      badgeColor: 'purple'
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: IconLaptop,
      metric: String(summary.activeSessions),
      metricLabel: 'User Sessions',
      subText: 'Recorded session inventory',
      badge: 'Sessions',
      badgeColor: 'sky'
    }
  ];

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const categoryOptions = useMemo(() => {
    return uniqueValues([
      'Logins',
      'Failed',
      'Admin actions',
      'Alerts',
      ...events.map(event => event.category)
    ]);
  }, [events]);

  const severityOptions = useMemo(() => {
    return uniqueValues([
      ...SEVERITIES,
      ...events.map(event => normalize(event.severity))
    ]);
  }, [events]);

  const resultOptions = useMemo(() => {
    return uniqueValues(
      events.map(event => normalize(event.result))
    );
  }, [events]);

  const invalidDateRange =
    dateRange === 'Custom' &&
    (
      !startDate ||
      !endDate ||
      startDate > endDate
    );

  // ==========================================================
  // SEARCH, DATE FILTERING & SORTING
  // ==========================================================

  const filteredEvents = useMemo(() => {
    if (invalidDateRange) return [];

    let rangeStart = '';
    let rangeEnd = '';

    if (dateRange === 'Today') {
      rangeStart = today;
      rangeEnd = today;
    }

    if (dateRange === 'Last 7 Days') {
      rangeStart = getPreviousDate(today, 6);
      rangeEnd = today;
    }

    if (dateRange === 'Last 30 Days') {
      rangeStart = getPreviousDate(today, 29);
      rangeEnd = today;
    }

    if (dateRange === 'Custom') {
      rangeStart = startDate;
      rangeEnd = endDate;
    }

    return events
      .filter(event => {
        if (activeCategory === 'activity' && !isLogin(event)) {
          return false;
        }

        if (activeCategory === 'failed' && !isFailedLogin(event)) {
          return false;
        }

        if (activeCategory === 'audit' && !isAdminAction(event)) {
          return false;
        }

        if (activeCategory === 'alerts' && !isAlert(event)) {
          return false;
        }

        if (activeCategory === 'critical' && (
          !isOpenAlert(event) ||
          normalize(event.severity) !== 'critical'
        )) {
          return false;
        }

        if (activeCategory === 'mfa' && !isMfaEvent(event)) {
          return false;
        }

        if (
          activeCategory === 'blocked' &&
          normalize(event.result) !== 'blocked / suspicious'
        ) {
          return false;
        }

        const matchSearch = matchesQuery([
          event.id,
          event.time,
          event.userName,
          event.userEmail,
          event.userId,
          event.ipAddress,
          event.event,
          event.location,
          event.device,
          event.category,
          event.result,
          event.severity
        ], search);

        const matchCategory =
          categoryFilter === 'All' ||
          event.category === categoryFilter;

        const matchSeverity =
          severityFilter === 'All' ||
          normalize(event.severity) === severityFilter;

        const matchResult =
          resultFilter === 'All' ||
          normalize(event.result) === resultFilter;

        const matchAcknowledgement =
          acknowledgementFilter === 'All' ||
          (
            acknowledgementFilter === 'pending' &&
            isOpenAlert(event)
          ) ||
          (
            acknowledgementFilter === 'acknowledged' &&
            isAlert(event) &&
            event.acknowledged
          );

        let matchDate = true;

        if (dateRange !== 'All') {
          const eventDate = getEventDateKey(event);

          matchDate =
            Boolean(eventDate) &&
            eventDate >= rangeStart &&
            eventDate <= rangeEnd;
        }

        return (
          matchSearch &&
          matchCategory &&
          matchSeverity &&
          matchResult &&
          matchAcknowledgement &&
          matchDate
        );
      })
      .sort((a, b) => {
        let result = 0;

        if (sortField === 'time') {
          const first = getEventTimestamp(a);
          const second = getEventTimestamp(b);

          if (first === null && second !== null) return 1;
          if (second === null && first !== null) return -1;

          result = (first ?? 0) - (second ?? 0);

        } else if (sortField === 'severity') {
          result =
            (SEVERITY_ORDER[normalize(a.severity)] ?? 99) -
            (SEVERITY_ORDER[normalize(b.severity)] ?? 99);

        } else {
          result = String(a[sortField] || '').localeCompare(
            String(b[sortField] || ''),
            undefined,
            { sensitivity: 'base', numeric: true }
          );
        }

        return sortAsc ? result : -result;
      });
  }, [
    events,
    activeCategory,
    search,
    categoryFilter,
    severityFilter,
    resultFilter,
    acknowledgementFilter,
    dateRange,
    startDate,
    endDate,
    invalidDateRange,
    today,
    sortField,
    sortAsc
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
    setSelectedEventIds([]);
  }, [
    activeCategory,
    search,
    categoryFilter,
    severityFilter,
    resultFilter,
    acknowledgementFilter,
    dateRange,
    startDate,
    endDate,
    pageSize
  ]);

  // ==========================================================
  // SESSION FILTERS
  // ==========================================================

  const filteredSessions = useMemo(() => {
    return activeSessions.filter(session => {
      const matchSearch = matchesQuery([
        session.id,
        session.userName,
        session.device,
        session.ip,
        session.location,
        session.startedAt
      ], sessionSearch);

      const matchType =
        sessionTypeFilter === 'All' ||
        (
          sessionTypeFilter === 'vpn' &&
          session.isVpn === true
        ) ||
        (
          sessionTypeFilter === 'direct' &&
          session.isVpn === false
        );

      return matchSearch && matchType;
    });
  }, [
    activeSessions,
    sessionSearch,
    sessionTypeFilter
  ]);

  // ==========================================================
  // FILTER ACTIONS
  // ==========================================================

  const resetFilters = () => {
    setActiveCategory('all');
    setSearch('');
    setCategoryFilter('All');
    setSeverityFilter('All');
    setResultFilter('All');
    setAcknowledgementFilter('All');
    setDateRange('All');
    setStartDate('');
    setEndDate('');
    setSortField('time');
    setSortAsc(false);
    setPage(1);
    setSelectedEventIds([]);
    setSessionSearch('');
    setSessionTypeFilter('All');
  };

  const selectCategory = id => {
    const next = activeCategory === id ? 'all' : id;

    resetFilters();
    setActiveCategory(next);

    if (next === 'alerts') {
      setAcknowledgementFilter('pending');
    }
  };

  const handleSort = field => {
    if (sortField === field) {
      setSortAsc(previous => !previous);
    } else {
      setSortField(field);
      setSortAsc(field !== 'time');
    }

    setPage(1);
  };

  const changeDateRange = value => {
    setDateRange(value);

    if (value === 'Custom') {
      setStartDate(previous => previous || today);
      setEndDate(previous => previous || today);
    }
  };

  // ==========================================================
  // ALERT ACKNOWLEDGEMENT
  // ==========================================================

  const handleAcknowledge = eventId => {
    if (!canUpdateSecurity) return false;

    const event = events.find(
      item => item.id === eventId
    );

    if (!event || !isOpenAlert(event)) {
      return false;
    }

    const result = acknowledgeAlert(eventId);

    if (result === false) {
      return false;
    }

    setSelectedEventIds(previous =>
      previous.filter(id => id !== eventId)
    );

    return true;
  };

  const selectableEvents = paginatedEvents.filter(isOpenAlert);

  const selectedPendingEvents = filteredEvents.filter(
    event =>
      selectedEventIds.includes(event.id) &&
      isOpenAlert(event)
  );

  const allPageSelected =
    selectableEvents.length > 0 &&
    selectableEvents.every(event =>
      selectedEventIds.includes(event.id)
    );

  const toggleEventSelection = eventId => {
    if (!canUpdateSecurity) return;

    setSelectedEventIds(previous =>
      previous.includes(eventId)
        ? previous.filter(id => id !== eventId)
        : [...previous, eventId]
    );
  };

  const togglePageSelection = () => {
    if (!canUpdateSecurity) return;

    const ids = selectableEvents.map(event => event.id);

    setSelectedEventIds(previous =>
      allPageSelected
        ? previous.filter(id => !ids.includes(id))
        : [...new Set([...previous, ...ids])]
    );
  };

  const requestBulkAcknowledge = () => {
    if (!canUpdateSecurity || !selectedPendingEvents.length) {
      return;
    }

    setBulkAcknowledgeTarget({
      ids: selectedPendingEvents.map(event => event.id)
    });
  };

  const confirmBulkAcknowledge = () => {
    if (!canUpdateSecurity || !bulkAcknowledgeTarget) return;

    bulkAcknowledgeTarget.ids.forEach(eventId => {
      const event = events.find(
        item => item.id === eventId
      );

      if (event && isOpenAlert(event)) {
        handleAcknowledge(eventId);
      }
    });

    setBulkAcknowledgeTarget(null);
  };

  // ==========================================================
  // SESSION REVOCATION
  // ==========================================================

  const requestRevokeSession = session => {
    if (!canDeleteSecurity) return;

    setSelectedSessionId(null);
    setRevokeTarget(session.id);
  };

  const confirmRevokeSession = () => {
    if (!canDeleteSecurity || !revokeTarget) return;

    const session = activeSessions.find(
      item => item.id === revokeTarget
    );

    if (!session) {
      showToast('The selected session is no longer active.');
      setRevokeTarget(null);
      return;
    }

    const result = terminateSession(session.id);

    if (result === false) return;

    setSelectedSessionId(null);
    setRevokeTarget(null);
  };

  const sessionToRevoke = activeSessions.find(
    session => session.id === revokeTarget
  );

  // ==========================================================
  // CSV EXPORTS
  // ==========================================================

  const exportAuditDigest = () => {
    if (!canExportSecurity) return;

    if (!filteredEvents.length) {
      showToast('No matching security events to export.');
      return;
    }

    downloadCSV([
      'Event ID',
      'Timestamp',
      'User',
      'Email',
      'Category',
      'Event',
      'IP Address',
      'Location',
      'Device',
      'Result',
      'Severity',
      'Acknowledgement Status'
    ], filteredEvents.map(event => [
      event.id,
      event.time || formatTimestamp(event.createdAt),
      event.userName,
      event.userEmail,
      event.category,
      event.event,
      event.ipAddress,
      event.location,
      event.device,
      event.result,
      event.severity,
      isAlert(event)
        ? event.acknowledged
          ? 'Acknowledged'
          : 'Pending'
        : 'Not applicable'
    ]), `security-audit-${today}.csv`);

    showToast(`Exported ${filteredEvents.length} security events.`);
  };

  const exportSessions = () => {
    if (!canExportSecurity) return;

    if (!filteredSessions.length) {
      showToast('No matching sessions to export.');
      return;
    }

    downloadCSV([
      'Session ID',
      'User',
      'IP Address',
      'Location',
      'Device',
      'Connection Type',
      'Started At'
    ], filteredSessions.map(session => [
      session.id,
      session.userName,
      session.ip,
      session.location,
      session.device,
      session.isVpn === true
        ? 'VPN'
        : session.isVpn === false
          ? 'Direct'
          : 'Unknown',
      session.startedAt
    ]), `active-sessions-${today}.csv`);

    showToast(`Exported ${filteredSessions.length} active sessions.`);
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
        className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
      >
        {label}

        <span className={
          sortField === field
            ? 'text-accent'
            : 'text-muted/50'
        }>
          {sortField === field
            ? sortAsc ? '↑' : '↓'
            : '↕'}
        </span>

      </button>
    </th>
  );

  // ==========================================================
  // RESTRICTED ACCESS
  // ==========================================================

  if (!canReadSecurity) {
    return (
      <Card title="Security & Activity Restricted">

        <div className="flex flex-col items-center gap-3 py-8 text-center">

          <IconShield className="w-8 h-8 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have Security: read permission.
          </p>

        </div>

      </Card>
    );
  }

  const showEvents = activeCategory !== 'sessions';

  const showThreats =
    activeCategory === 'all' ||
    activeCategory === 'alerts' ||
    activeCategory === 'critical';

  const showSessions =
    activeCategory === 'all' ||
    activeCategory === 'sessions';

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div
      id="security-activity-dashboard"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>

          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">

            <IconShield className="w-6 h-6 text-sky-400" />

            Security & Activity

          </h2>

          <p className="text-[13px] text-muted mt-1">
            Review login events, security alerts, administrator activity and user sessions.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {activeCategory !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
            >
              View All Activity
            </Button>
          )}

          {canExportSecurity && (
            <Button
              variant="secondary"
              icon={IconDownload}
              disabled={
                activeCategory === 'sessions'
                  ? !filteredSessions.length
                  : !filteredEvents.length
              }
              onClick={
                activeCategory === 'sessions'
                  ? exportSessions
                  : exportAuditDigest
              }
            >
              {activeCategory === 'sessions'
                ? 'Export Sessions'
                : 'Export Audit CSV'}
            </Button>
          )}

        </div>

      </div>

      {/* SECURITY ALERT SUMMARY */}

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        criticalThreatCount > 0
          ? 'border-bad/40 bg-bad/10'
          : 'border-line bg-surface2/40'
      }`}>

        <div className="flex items-center gap-3">

          {criticalThreatCount > 0 ? (
            <IconAlertTriangle className="w-5 h-5 text-bad shrink-0" />
          ) : (
            <IconShield className="w-5 h-5 text-good shrink-0" />
          )}

          <div>

            <p className="font-bold text-[14px] text-ink">

              {criticalThreatCount > 0
                ? `${criticalThreatCount} critical alert(s) require review`
                : 'No unacknowledged critical alerts in recorded data'}

            </p>

            <p className="text-[12px] text-muted mt-0.5">
              {summary.openAlerts} pending security alerts ·
              {' '}{summary.acknowledgedAlerts} acknowledged
            </p>

          </div>

        </div>

        {summary.openAlerts > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              resetFilters();
              setActiveCategory('alerts');
              setAcknowledgementFilter('pending');
            }}
          >
            Review Alerts
          </Button>
        )}

      </div>

      {/* DYNAMIC KPI CARDS */}

      <CategoryCardsBar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
        columnsClass="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
      />

      {/* ADDITIONAL SECURITY METRICS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

        <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1.5">

          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Recorded Login Success Rate
          </span>

          <span className="font-display font-bold text-[24px] text-good">

            {summary.loginSuccessRate === null
              ? '—'
              : `${summary.loginSuccessRate}%`}

          </span>

          <span className="text-[11px] text-muted">
            {summary.successfulLogins} successful ·
            {' '}{summary.failedLogins} failed
          </span>

        </div>

        <button
          type="button"
          onClick={() => selectCategory('mfa')}
          aria-pressed={activeCategory === 'mfa'}
          className={`p-4 rounded-xl bg-surface2/40 border flex flex-col gap-1.5 text-left hover:bg-surface2 cursor-pointer ${
            activeCategory === 'mfa'
              ? 'border-accent'
              : 'border-line'
          }`}
        >

          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            MFA Challenges
          </span>

          <span className="font-display font-bold text-[24px] text-accent">
            {summary.mfa}
          </span>

          <span className="text-[11px] text-muted">
            Recorded authentication challenges
          </span>

        </button>

        <button
          type="button"
          onClick={() => selectCategory('blocked')}
          aria-pressed={activeCategory === 'blocked'}
          className={`p-4 rounded-xl bg-surface2/40 border flex flex-col gap-1.5 text-left hover:bg-surface2 cursor-pointer ${
            activeCategory === 'blocked'
              ? 'border-warn'
              : 'border-line'
          }`}
        >

          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Blocked / Suspicious Events
          </span>

          <span className="font-display font-bold text-[24px] text-warn">
            {summary.blocked}
          </span>

          <span className="text-[11px] text-muted">
            Recorded suspicious activity
          </span>

        </button>

        <button
          type="button"
          onClick={() => selectCategory('critical')}
          aria-pressed={activeCategory === 'critical'}
          className={`p-4 rounded-xl bg-surface2/40 border flex flex-col gap-1.5 text-left hover:bg-surface2 cursor-pointer ${
            activeCategory === 'critical'
              ? 'border-bad'
              : 'border-line'
          }`}
        >

          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Critical Security Alerts
          </span>

          <span className="font-display font-bold text-[24px] text-bad">
            {summary.criticalAlerts}
          </span>

          <span className="text-[11px] text-muted">
            Unacknowledged critical events
          </span>

        </button>

      </div>

      {/* ACTIVE SECURITY ALERTS */}

      {(showThreats || showSessions) && (
        <div className={`grid grid-cols-1 gap-4 ${
          showThreats && showSessions ? '2xl:grid-cols-2' : ''
        }`}>

          {showThreats && (
            <Card
              title="Security Alerts"
              subText="Highest-priority unacknowledged events across recorded activity."
              action={
                <span className="px-2.5 py-1 rounded-full border border-line bg-surface2 text-[11px] font-semibold text-ink">
                  {activeCategory === 'critical'
                    ? criticalThreatCount
                    : activeThreats.length} pending
                </span>
              }
            >

              <div className="flex flex-col gap-2.5">

                {!activeThreats.filter(alert =>
                  activeCategory !== 'critical' ||
                  normalize(alert.severity) === 'critical'
                ).length ? (
                  <EmptyState
                    icon={IconCheck}
                    message="No matching unacknowledged security alerts."
                  />
                ) : (

                  activeThreats
                    .filter(alert =>
                      activeCategory !== 'critical' ||
                      normalize(alert.severity) === 'critical'
                    )
                    .slice(0, 5)
                    .map(alert => {

                      const critical =
                        normalize(alert.severity) === 'critical';

                      return (
                        <article
                          key={alert.id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-l-4 px-3.5 py-3 ${
                            critical
                              ? 'border-bad/30 border-l-bad bg-bad/5'
                              : 'border-line border-l-warn bg-surface2/30'
                          }`}
                        >

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <SeverityBadge severity={alert.severity} />

                              <span className="text-[11px] text-muted">
                                {alert.time || formatTimestamp(alert.createdAt)}
                              </span>

                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedEventId(alert.id)}
                              className="mt-2 block text-left font-semibold text-[13px] text-ink hover:text-accent cursor-pointer"
                            >
                              {alert.event}
                            </button>

                            <p className="mt-1 text-[11.5px] text-muted">

                              {alert.userName || 'System'} ·
                              {' '}{alert.ipAddress || '—'} ·
                              {' '}{alert.location || '—'}

                            </p>

                          </div>

                          {canUpdateSecurity && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}

                        </article>
                      );
                    })
                )}

              </div>

              {activeThreats.length > 5 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    resetFilters();
                    setActiveCategory('alerts');
                    setAcknowledgementFilter('pending');
                  }}
                >
                  View All Pending Alerts
                </Button>
              )}

            </Card>
          )}

          {/* ACTIVE SESSION MANAGEMENT */}

          {showSessions && (
            <Card
              title={`Active Sessions (${activeSessions.length})`}
              subText="Review recorded user sessions and revoke local session records."
              action={
                canExportSecurity ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={IconDownload}
                    disabled={!filteredSessions.length}
                    onClick={exportSessions}
                  >
                    Export
                  </Button>
                ) : null
              }
            >

              <div className="flex flex-wrap gap-2.5">

                <div className="relative flex-1 min-w-[160px]">

                  <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />

                  <input
                    value={sessionSearch}
                    onChange={event => setSessionSearch(event.target.value)}
                    placeholder="Search user, IP, device..."
                    aria-label="Search active sessions"
                    className={`${FILTER_CLASS} w-full pl-8`}
                  />

                </div>

                <select
                  value={sessionTypeFilter}
                  onChange={event => setSessionTypeFilter(event.target.value)}
                  aria-label="Filter session connection type"
                  className={FILTER_CLASS}
                >

                  <option value="All">All Connections</option>
                  <option value="vpn">VPN</option>
                  <option value="direct">Direct</option>

                </select>

              </div>

              {!filteredSessions.length ? (
                <EmptyState
                  icon={IconLaptop}
                  message="No active sessions match the selected filters."
                />
              ) : (
                <div className="flex flex-col divide-y divide-dashed divide-line max-h-[400px] overflow-y-auto pr-1">

                  {filteredSessions.map(session => (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >

                      <div className="flex items-start gap-2.5 min-w-0">

                        <Avatar
                          name={session.userName || 'User'}
                          size={32}
                        />

                        <div className="flex flex-col gap-1 min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <button
                              type="button"
                              onClick={() => setSelectedSessionId(session.id)}
                              className="font-semibold text-[13px] text-ink hover:text-accent text-left"
                            >
                              {session.userName || 'Unknown User'}
                            </button>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              session.isVpn === true
                                ? 'bg-good/10 border-good/30 text-good'
                                : 'bg-surface2 border-line text-muted'
                            }`}>
                              {session.isVpn === true
                                ? 'VPN'
                                : session.isVpn === false
                                  ? 'Direct'
                                  : 'Unknown'}
                            </span>

                          </div>

                          <span className="text-[12px] text-muted">
                            {session.device || 'Unknown device'}
                          </span>

                          <span className="text-[11px] text-muted font-data">
                            {session.ip || '—'} · {session.location || '—'}
                          </span>

                          <span className="text-[10.5px] text-muted">
                            Started: {session.startedAt || 'Not recorded'}
                          </span>

                        </div>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          View
                        </Button>

                        {canDeleteSecurity && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => requestRevokeSession(session)}
                          >
                            Revoke
                          </Button>
                        )}

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </Card>
          )}

        </div>
      )}

      {/* SECURITY EVENT TABLE */}

      {showEvents && (
        <Card
          id="widget-events"
          data-w="events"
          title="Security & Activity Logs"
          subText={`${filteredEvents.length} of ${events.length} recorded events`}
          action={
            canUpdateSecurity && selectedPendingEvents.length > 0 ? (
              <Button
                variant="primary"
                icon={IconCheck}
                size="sm"
                onClick={requestBulkAcknowledge}
              >
                Acknowledge Selected ({selectedPendingEvents.length})
              </Button>
            ) : null
          }
        >

          {/* SEARCH & FILTER TOOLBAR */}

          <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-line/60">

            <div className="relative w-full sm:w-64">

              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />

              <input
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search user, event, IP, device..."
                aria-label="Search security events"
                className={`${FILTER_CLASS} w-full pl-8 pr-8`}
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear security event search"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )}

            </div>

            <select
              value={categoryFilter}
              onChange={event => setCategoryFilter(event.target.value)}
              aria-label="Filter event category"
              className={FILTER_CLASS}
            >

              <option value="All">All Categories</option>

              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}

            </select>

            <select
              value={severityFilter}
              onChange={event => setSeverityFilter(event.target.value)}
              aria-label="Filter event severity"
              className={FILTER_CLASS}
            >

              <option value="All">All Severities</option>

              {severityOptions.map(severity => (
                <option key={severity} value={severity}>
                  {severityLabel(severity)}
                </option>
              ))}

            </select>

            <select
              value={resultFilter}
              onChange={event => setResultFilter(event.target.value)}
              aria-label="Filter event result"
              className={FILTER_CLASS}
            >

              <option value="All">All Results</option>

              {resultOptions.map(result => (
                <option key={result} value={result}>
                  {result.charAt(0).toUpperCase() + result.slice(1)}
                </option>
              ))}

            </select>

            <select
              value={acknowledgementFilter}
              onChange={event =>
                setAcknowledgementFilter(event.target.value)
              }
              aria-label="Filter acknowledgement status"
              className={FILTER_CLASS}
            >

              <option value="All">All Review Statuses</option>
              <option value="pending">Pending Acknowledgement</option>
              <option value="acknowledged">Acknowledged</option>

            </select>

            <select
              value={dateRange}
              onChange={event => changeDateRange(event.target.value)}
              aria-label="Filter security event date range"
              className={FILTER_CLASS}
            >

              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Custom">Custom Date Range</option>

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

          {/* CUSTOM DATE RANGE */}

          {dateRange === 'Custom' && (
            <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-surface2/30 border border-line">

              <label className="flex flex-col gap-1 text-[12px] text-muted">

                From Date

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={event => setStartDate(event.target.value)}
                  className={INPUT_CLASS}
                />

              </label>

              <label className="flex flex-col gap-1 text-[12px] text-muted">

                To Date

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={event => setEndDate(event.target.value)}
                  className={INPUT_CLASS}
                />

              </label>

              {invalidDateRange && (
                <p role="alert" className="text-[12px] text-bad">
                  Select a valid start and end date.
                </p>
              )}

            </div>
          )}

          {/* TABLE */}

          {!filteredEvents.length ? (
            <EmptyState
              icon={IconShield}
              message={
                invalidDateRange
                  ? 'Select a valid date range to review activity.'
                  : 'No security events match the selected filters.'
              }
              actionLabel="Reset Filters"
              onAction={resetFilters}
            />
          ) : (

            <div className="overflow-x-auto -mx-1">

              <table className="w-full min-w-[1500px] text-left border-collapse">

                <thead>

                  <tr className="border-b border-line">

                    {canUpdateSecurity && (
                      <th scope="col" className={HEADER_CLASS}>

                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          disabled={!selectableEvents.length}
                          aria-label="Select pending alerts on this page"
                          onChange={togglePageSelection}
                          className="accent-teal-400 cursor-pointer"
                        />

                      </th>
                    )}

                    <th scope="col" className={HEADER_CLASS}>
                      No.
                    </th>

                    {sortableHeader('Timestamp', 'time')}
                    {sortableHeader('User Identity', 'userName')}
                    {sortableHeader('Activity / Event', 'event')}
                    {sortableHeader('Category', 'category')}

                    <th scope="col" className={HEADER_CLASS}>
                      IP Address
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Location
                    </th>

                    {sortableHeader('Severity', 'severity')}
                    {sortableHeader('Result', 'result')}

                    <th scope="col" className={HEADER_CLASS}>
                      Review Status
                    </th>

                    <th scope="col" className={HEADER_CLASS}>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-dashed divide-line">

                  {paginatedEvents.map((event, index) => (
                    <tr
                      key={event.id}
                      className={`hover:bg-surface2/40 transition-colors ${
                        selectedEventIds.includes(event.id)
                          ? 'bg-accent/5'
                          : ''
                      }`}
                    >

                      {canUpdateSecurity && (
                        <td className={CELL_CLASS}>

                          {isOpenAlert(event) && (
                            <input
                              type="checkbox"
                              checked={selectedEventIds.includes(event.id)}
                              aria-label={`Select security alert ${event.id}`}
                              onChange={() => toggleEventSelection(event.id)}
                              className="accent-teal-400 cursor-pointer"
                            />
                          )}

                        </td>
                      )}

                      <td className={`${CELL_CLASS} text-muted font-data`}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className={`${CELL_CLASS} text-muted font-data whitespace-nowrap`}>

                        {event.time || formatTimestamp(event.createdAt)}

                      </td>

                      <td className={CELL_CLASS}>

                        <div className="flex items-center gap-2">

                          <Avatar
                            name={event.userName || 'System'}
                            size={28}
                          />

                          <div className="flex flex-col gap-0.5">

                            <span className="font-semibold text-ink whitespace-nowrap">
                              {event.userName || 'System'}
                            </span>

                            {event.userEmail && (
                              <span className="text-[10.5px] text-muted">
                                {event.userEmail}
                              </span>
                            )}

                          </div>

                        </div>

                      </td>

                      <td className={`${CELL_CLASS} min-w-[260px]`}>

                        <button
                          type="button"
                          onClick={() => setSelectedEventId(event.id)}
                          className="flex flex-col gap-1 text-left cursor-pointer"
                        >

                          <span className="font-data text-accent text-[10.5px]">
                            {event.id}
                          </span>

                          <span
                            title={event.event}
                            className="text-[12.5px] text-ink font-medium hover:text-accent max-w-[280px] line-clamp-2"
                          >
                            {event.event}
                          </span>

                        </button>

                      </td>

                      <td className={CELL_CLASS}>

                        <span className="px-2.5 py-1 rounded-lg border border-line bg-surface2 text-[11px] text-muted whitespace-nowrap">
                          {categoryLabel(event.category)}
                        </span>

                      </td>

                      <td className={`${CELL_CLASS} text-ink font-data whitespace-nowrap`}>
                        {event.ipAddress || '—'}
                      </td>

                      <td className={`${CELL_CLASS} text-muted whitespace-nowrap`}>
                        {event.location || '—'}
                      </td>

                      <td className={CELL_CLASS}>
                        <SeverityBadge severity={event.severity} />
                      </td>

                      <td className={`${CELL_CLASS} whitespace-nowrap`}>
                        <StatusPill status={event.result || 'Unknown'} />
                      </td>

                      <td className={`${CELL_CLASS} whitespace-nowrap`}>
                        <AlertStatus event={event} />
                      </td>

                      <td className={CELL_CLASS}>

                        <div className="flex items-center gap-1.5">

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedEventId(event.id)}
                          >
                            View
                          </Button>

                          {canUpdateSecurity && isOpenAlert(event) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAcknowledge(event.id)}
                            >
                              Acknowledge
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
            total={filteredEvents.length}
            onPageChange={setPage}
            onPageSizeChange={value => {
              setPageSize(value);
              setPage(1);
            }}
          />

        </Card>
      )}

      {/* SECURITY EVENT DETAILS */}

      {selectedAuditEvent && (
        <RecordDetailsModal
          isOpen
          onClose={() => setSelectedEventId(null)}
          title={`Security Event · ${selectedAuditEvent.id}`}
          record={selectedAuditEvent}
          fields={[
            {
              label: 'Event ID',
              value: selectedAuditEvent.id
            },
            {
              label: 'Timestamp',
              value: selectedAuditEvent.time ||
                formatTimestamp(selectedAuditEvent.createdAt)
            },
            {
              label: 'User Name',
              value: selectedAuditEvent.userName
            },
            {
              label: 'User ID',
              value: selectedAuditEvent.userId
            },
            {
              label: 'Email',
              value: selectedAuditEvent.userEmail
            },
            {
              label: 'Category',
              value: categoryLabel(selectedAuditEvent.category)
            },
            {
              label: 'Activity',
              value: selectedAuditEvent.event
            },
            {
              label: 'Result',
              value: selectedAuditEvent.result
            },
            {
              label: 'Severity',
              value: severityLabel(selectedAuditEvent.severity)
            },
            {
              label: 'IP Address',
              value: selectedAuditEvent.ipAddress
            },
            {
              label: 'Location',
              value: selectedAuditEvent.location
            },
            {
              label: 'Device',
              value: selectedAuditEvent.device
            },
            {
              label: 'Review Status',
              value: isAlert(selectedAuditEvent)
                ? selectedAuditEvent.acknowledged
                  ? 'Acknowledged'
                  : 'Pending Review'
                : 'Logged'
            }
          ]}
          canExport={canExportSecurity}
          exportFilename={`security-event-${selectedAuditEvent.id}.json`}
          headerActions={
            canUpdateSecurity && isOpenAlert(selectedAuditEvent) ? (
              <Button
                variant="primary"
                icon={IconCheck}
                onClick={() => handleAcknowledge(selectedAuditEvent.id)}
              >
                Acknowledge Alert
              </Button>
            ) : null
          }
        >

          <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">

            <h3 className="font-display font-bold text-[15px] text-ink">
              Security Event Summary
            </h3>

            <div className="flex flex-wrap items-center gap-2">

              <SeverityBadge severity={selectedAuditEvent.severity} />

              <StatusPill status={selectedAuditEvent.result || 'Unknown'} />

              <AlertStatus event={selectedAuditEvent} />

            </div>

            <p className="text-[13px] text-ink leading-relaxed">
              {selectedAuditEvent.event}
            </p>

            {isAlert(selectedAuditEvent) && (
              <p className="text-[12px] text-muted">
                Acknowledgement records that this alert has been reviewed.
                It does not automatically remediate the underlying security issue.
              </p>
            )}

          </div>

        </RecordDetailsModal>
      )}

      {/* ACTIVE SESSION DETAILS */}

      {selectedSession && (
        <RecordDetailsModal
          isOpen
          onClose={() => setSelectedSessionId(null)}
          title={`Session Details · ${selectedSession.userName || selectedSession.id}`}
          record={selectedSession}
          fields={[
            {
              label: 'Session ID',
              value: selectedSession.id
            },
            {
              label: 'User',
              value: selectedSession.userName
            },
            {
              label: 'Device',
              value: selectedSession.device
            },
            {
              label: 'IP Address',
              value: selectedSession.ip
            },
            {
              label: 'Location',
              value: selectedSession.location
            },
            {
              label: 'Session Started',
              value: selectedSession.startedAt
            },
            {
              label: 'Connection Type',
              value: selectedSession.isVpn === true
                ? 'VPN'
                : selectedSession.isVpn === false
                  ? 'Direct'
                  : 'Unknown'
            },
            {
              label: 'Session Status',
              value: 'Active'
            }
          ]}
          canExport={canExportSecurity}
          exportFilename={`security-session-${selectedSession.id}.json`}
          headerActions={
            canDeleteSecurity ? (
              <Button
                variant="danger"
                onClick={() => requestRevokeSession(selectedSession)}
              >
                Revoke Session
              </Button>
            ) : null
          }
        />

      )}

      {/* REVOKE SESSION CONFIRMATION */}

      <ConfirmDialog
        isOpen={Boolean(
          revokeTarget &&
          sessionToRevoke &&
          canDeleteSecurity
        )}
        title="Revoke User Session"
        message={`Revoke the recorded session for ${
          sessionToRevoke?.userName || 'this user'
        } at ${
          sessionToRevoke?.ip || 'the selected IP address'
        }? This removes the session from the local active-session inventory.`}
        confirmLabel="Revoke Session"
        onConfirm={confirmRevokeSession}
        onCancel={() => setRevokeTarget(null)}
      />

      {/* BULK ACKNOWLEDGEMENT CONFIRMATION */}

      <ConfirmDialog
        isOpen={Boolean(
          bulkAcknowledgeTarget &&
          canUpdateSecurity
        )}
        title="Acknowledge Selected Alerts"
        message={`Mark ${
          bulkAcknowledgeTarget?.ids.length || 0
        } selected security alerts as reviewed? Original event records will be retained.`}
        confirmLabel="Confirm Acknowledgement"
        onConfirm={confirmBulkAcknowledge}
        onCancel={() => setBulkAcknowledgeTarget(null)}
      />

      {/* SECURITY INFORMATION */}

      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-line bg-surface2/30">

        <IconShield className="w-4 h-4 text-muted shrink-0 mt-0.5" />

        <p className="text-[11.5px] text-muted leading-relaxed">
          Security activity reflects the application's local event records.
          All date-based filters use Indian Standard Time.
          Production security monitoring and external identity-provider session
          termination require backend integration.
        </p>

      </div>

    </div>
  );
}
