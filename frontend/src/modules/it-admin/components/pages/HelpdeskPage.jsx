
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Avatar } from '../shared/Avatar';
import { Tag } from '../shared/Tag';
import { SegmentedBar } from '../shared/SegmentedBar';
import { ProgressBar } from '../shared/ProgressBar';
import { EmptyState } from '../shared/EmptyState';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';

import {
  IconHeadphones,
  IconPlus,
  IconSearch,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconShield,
  IconUsers,
  IconDownload,
  IconX,
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const PRIORITIES = [
  {
    value: 'critical',
    label: 'Critical (P1)',
    color: 'var(--bad)',
  },
  {
    value: 'high',
    label: 'High (P2)',
    color: 'var(--warn)',
  },
  {
    value: 'medium',
    label: 'Medium (P3)',
    color: 'var(--info)',
  },
  {
    value: 'low',
    label: 'Low (P4)',
    color: 'var(--muted)',
  },
];

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'on hold', label: 'On Hold' },
  { value: 'breached SLA', label: 'SLA Breached' },
  { value: 'resolved', label: 'Resolved' },
];

const DEFAULT_CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Access',
];

const DEFAULT_TECHNICIANS = [
  'Rahul Sharma',
  'Kavita Rao',
  'Deepak Nair',
];

const PAGE_SIZES = [5, 10, 20, 50];

const FILTER_CLASS =
  'px-3 py-2 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent';

const SELECT_CLASS =
  'w-full px-2 py-1.5 text-[11.5px] rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

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

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) =>
      String(a).localeCompare(String(b))
    );
}

function isResolved(ticket) {
  return normalize(ticket?.status) === 'resolved';
}

function isAssigned(ticket) {
  return Boolean(
    ticket?.assignedTo &&
    normalize(ticket.assignedTo) !== 'unassigned'
  );
}

function matchesQuery(values, query) {
  const words = normalize(query)
    .split(/\s+/)
    .filter(Boolean);

  const text = values
    .map(normalize)
    .join(' ');

  return words.every(word => text.includes(word));
}

function parseTicketDate(value) {
  if (!value) return null;

  const text = String(value)
    .trim()
    .replace(/\bIST$/i, 'GMT+0530');

  const timestamp = Date.parse(text);

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}

function formatDuration(hours) {
  const totalMinutes = Math.max(
    0,
    Math.floor(Number(hours || 0) * 60)
  );

  const days = Math.floor(totalMinutes / 1440);
  const remainingHours = Math.floor(
    (totalMinutes % 1440) / 60
  );

  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${minutes}m`;
  }

  return `${remainingHours}h ${minutes}m`;
}

function getSLA(ticket, now = Date.now()) {
  const target = Number(ticket.slaHours);

  const recordedElapsed =
    Number(ticket.slaElapsedHours);

  let elapsed =
    Number.isFinite(recordedElapsed) &&
    recordedElapsed >= 0
      ? recordedElapsed
      : null;

  // Resolved ticket clocks no longer increase.
  if (!isResolved(ticket)) {
    const createdAt = parseTicketDate(
      ticket.createdAt
    );

    if (createdAt !== null && createdAt <= now) {
      const actualElapsed =
        (now - createdAt) / 3600000;

      elapsed = Math.max(
        elapsed ?? 0,
        actualElapsed
      );
    }
  }

  if (
    !Number.isFinite(target) ||
    target <= 0 ||
    elapsed === null
  ) {
    return {
      valid: false,
      elapsed,
      target: null,
      remaining: null,
      percent: 0,
      breached:
        !isResolved(ticket) &&
        normalize(ticket.status) === 'breached sla',
    };
  }

  const remaining = target - elapsed;

  const breached =
    !isResolved(ticket) &&
    (
      remaining <= 0 ||
      normalize(ticket.status) === 'breached sla'
    );

  return {
    valid: true,
    elapsed,
    target,
    remaining,
    percent: Math.max(
      0,
      (elapsed / target) * 100
    ),
    breached,
  };
}

function getEffectiveStatus(ticket, now) {
  const status = normalize(ticket.status);

  if (status === 'resolved') {
    return 'resolved';
  }

  if (getSLA(ticket, now).breached) {
    return 'breached SLA';
  }

  return status || 'open';
}

function getTicketAge(ticket, now) {
  if (isResolved(ticket)) {
    return 'Resolved';
  }

  const createdAt = parseTicketDate(
    ticket.createdAt
  );

  if (createdAt === null) {
    return ticket.age || '—';
  }

  return `${formatDuration(
    Math.max(0, now - createdAt) / 3600000
  )} ago`;
}

function safeCSV(value) {
  let text = String(value ?? '');

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(headers, rows, filename) {
  const content = [headers, ...rows]
    .map(row => row.map(safeCSV).join(','))
    .join('\r\n');

  const blob = new Blob(
    ['\uFEFF', content],
    { type: 'text/csv;charset=utf-8' }
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

// ============================================================
// SLA INDICATOR
// ============================================================

function SLAIndicator({ ticket, now }) {
  const sla = getSLA(ticket, now);

  if (isResolved(ticket)) {
    return (
      <span className="inline-flex items-center gap-1 text-good text-[11.5px] font-semibold">
        <IconCheck className="w-3.5 h-3.5" />
        Resolved
      </span>
    );
  }

  if (!sla.valid) {
    return (
      <span className="text-[11.5px] text-muted">
        {sla.breached
          ? 'SLA Breached'
          : 'SLA not configured'}
      </span>
    );
  }

  const color = sla.breached
    ? 'text-bad'
    : sla.percent >= 75
      ? 'text-warn'
      : 'text-good';

  return (
    <div className="flex flex-col gap-1.5 min-w-[125px]">

      <div className={`flex items-center gap-1 font-data font-semibold text-[11.5px] ${color}`}>

        {sla.breached ? (
          <IconAlertTriangle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <IconClock className="w-3.5 h-3.5 shrink-0" />
        )}

        {sla.breached
          ? sla.remaining <= 0
            ? `${formatDuration(
                Math.abs(sla.remaining)
              )} overdue`
            : 'SLA Breached'
          : `${formatDuration(
              sla.remaining
            )} left`}

      </div>

      <ProgressBar
        value={Math.min(
          sla.elapsed,
          sla.target
        )}
        max={sla.target}
        warnThreshold={75}
        dangerThreshold={100}
      />

      <span className="text-[10.5px] text-muted font-data">
        {formatDuration(sla.elapsed)}
        {' / '}
        {sla.target}h target
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

  const startPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - 4)
  );

  const endPage = Math.min(
    totalPages,
    startPage + 4
  );

  const pages = Array.from(
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
          {' '}tickets
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
          className="!text-[11px] !px-2 !py-1.5"
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
            className={`min-w-[32px] h-8 rounded-lg border text-[12px] font-semibold cursor-pointer ${
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
          className="!text-[11px] !px-2 !py-1.5"
        >
          Next
        </Button>

      </div>

    </div>
  );
}

// ============================================================
// HELPDESK PAGE
// ============================================================

export function HelpdeskPage() {
  const {
    tickets = [],
    users = [],
    updateTicket,

    setActiveDrawer,
    setDrawerPayload,
    setSelectedTicketId,

    hasPermission,
    showToast,
  } = useStore();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canReadHelpdesk =
    hasPermission('Helpdesk', 'read');

  const canCreateTickets =
    hasPermission('Helpdesk', 'write');

  const canUpdateTickets =
    hasPermission('Helpdesk', 'update');

  const canExport =
    canReadHelpdesk &&
    hasPermission('Reports', 'read');

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  // ==========================================================
  // STATE
  // ==========================================================

  const [activeCategory, setActiveCategory] =
    useState('all');

  const [viewMode, setViewMode] =
    useState('list');

  const [search, setSearch] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('All');

  const [priorityFilter, setPriorityFilter] =
    useState('All');

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [technicianFilter, setTechnicianFilter] =
    useState('All');

  const [sortField, setSortField] =
    useState('createdAt');

  const [sortAsc, setSortAsc] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [now, setNow] =
    useState(Date.now);

  // ==========================================================
  // LIVE SLA CLOCK
  // ==========================================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  // ==========================================================
  // DYNAMIC FILTER OPTIONS
  // ==========================================================

  const categoryOptions = useMemo(() => {
    return uniqueValues([
      ...DEFAULT_CATEGORIES,
      ...tickets.map(ticket => ticket.category),
    ]);
  }, [tickets]);

  const technicianOptions = useMemo(() => {
    return [
      'Unassigned',

      ...uniqueValues([
        ...DEFAULT_TECHNICIANS,

        ...tickets
          .map(ticket => ticket.assignedTo)
          .filter(name =>
            name &&
            normalize(name) !== 'unassigned'
          ),
      ]),
    ];
  }, [tickets]);

  // ==========================================================
  // DYNAMIC KPIs
  // ==========================================================

  const summary = useMemo(() => {
    const result = {
      total: tickets.length,
      open: 0,
      inProgress: 0,
      onHold: 0,
      resolved: 0,
      breached: 0,
      assigned: 0,
      unassigned: 0,
      critical: 0,
      active: 0,
      approachingSLA: 0,
    };

    tickets.forEach(ticket => {
      const status = getEffectiveStatus(
        ticket,
        now
      );

      if (status === 'open') {
        result.open += 1;
      }

      if (status === 'in progress') {
        result.inProgress += 1;
      }

      if (status === 'on hold') {
        result.onHold += 1;
      }

      if (status === 'breached SLA') {
        result.breached += 1;
      }

      if (isResolved(ticket)) {
        result.resolved += 1;
        return;
      }

      result.active += 1;

      if (isAssigned(ticket)) {
        result.assigned += 1;
      } else {
        result.unassigned += 1;
      }

      if (normalize(ticket.priority) === 'critical') {
        result.critical += 1;
      }

      const sla = getSLA(ticket, now);

      if (
        sla.valid &&
        !sla.breached &&
        sla.percent >= 75
      ) {
        result.approachingSLA += 1;
      }
    });

    return result;
  }, [tickets, now]);

  const priorityBreakdown = useMemo(() => {
    return PRIORITIES.map(priority => ({
      key: priority.value,

      label: priority.label,

      count: tickets.filter(ticket =>
        !isResolved(ticket) &&
        normalize(ticket.priority) === priority.value
      ).length,

      color: priority.color,
    }));
  }, [tickets]);

  const categories = [
    {
      id: 'all',
      label: 'Total Tickets',
      icon: IconHeadphones,
      metric: String(summary.total),
      metricLabel: 'Support Requests',
      subText: `${summary.active} unresolved tickets`,
      badge: 'All Tickets',
      badgeColor: 'sky',
    },
    {
      id: 'open',
      label: 'Open Tickets',
      icon: IconHeadphones,
      metric: String(summary.open),
      metricLabel: 'Open Incidents',
      subText: 'Awaiting further action',
      badge: 'Open',
      badgeColor: 'sky',
    },
    {
      id: 'assigned',
      label: 'Assigned Tickets',
      icon: IconUsers,
      metric: String(summary.assigned),
      metricLabel: 'Assigned Active Tickets',
      subText: `${summary.unassigned} unassigned`,
      badge: 'Assigned',
      badgeColor: 'emerald',
    },
    {
      id: 'progress',
      label: 'In Progress',
      icon: IconClock,
      metric: String(summary.inProgress),
      metricLabel: 'Under Resolution',
      subText: 'Active technician work',
      badge: 'In Progress',
      badgeColor: 'sky',
    },
    {
      id: 'hold',
      label: 'On Hold',
      icon: IconClock,
      metric: String(summary.onHold),
      metricLabel: 'Pending Action',
      subText: 'Awaiting further information',
      badge: 'On Hold',
      badgeColor: 'amber',
    },
    {
      id: 'escalations',
      label: 'SLA Breached',
      icon: IconAlertTriangle,
      metric: String(summary.breached),
      metricLabel: 'Overdue Tickets',
      subText: 'Resolution target exceeded',
      badge: summary.breached
        ? 'Attention Required'
        : 'No Breaches',
      badgeColor: summary.breached
        ? 'red'
        : 'emerald',
    },
    {
      id: 'resolved',
      label: 'Resolved Tickets',
      icon: IconCheck,
      metric: String(summary.resolved),
      metricLabel: 'Completed Requests',
      subText: 'Support resolution recorded',
      badge: 'Resolved',
      badgeColor: 'emerald',
    },
  ];

  // ==========================================================
  // FILTERING AND SORTING
  // ==========================================================

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        const status = getEffectiveStatus(
          ticket,
          now
        );

        if (
          activeCategory === 'open' &&
          status !== 'open'
        ) {
          return false;
        }

        if (
          activeCategory === 'assigned' &&
          (
            !isAssigned(ticket) ||
            isResolved(ticket)
          )
        ) {
          return false;
        }

        if (
          activeCategory === 'progress' &&
          status !== 'in progress'
        ) {
          return false;
        }

        if (
          activeCategory === 'hold' &&
          status !== 'on hold'
        ) {
          return false;
        }

        if (
          activeCategory === 'escalations' &&
          status !== 'breached SLA'
        ) {
          return false;
        }

        if (
          activeCategory === 'resolved' &&
          status !== 'resolved'
        ) {
          return false;
        }

        if (
          activeCategory === 'critical' &&
          (
            isResolved(ticket) ||
            normalize(ticket.priority) !== 'critical'
          )
        ) {
          return false;
        }

        if (
          activeCategory === 'unassigned' &&
          (
            isResolved(ticket) ||
            isAssigned(ticket)
          )
        ) {
          return false;
        }

        const requester = canReadUsers
          ? users.find(
              user =>
                user.id === ticket.requesterId
            )
          : null;

        const matchSearch = matchesQuery(
          [
            ticket.id,
            ticket.title,
            ticket.description,
            ticket.requesterName,
            ticket.requesterEmail,
            requester?.employeeId,
            requester?.email,
            ticket.assignedTo,
            ticket.category,
            ticket.priority,
            ticket.status,
            status,
          ],
          search
        );

        const matchCategory =
          categoryFilter === 'All' ||
          ticket.category === categoryFilter;

        const matchPriority =
          priorityFilter === 'All' ||
          normalize(ticket.priority) === priorityFilter;

        const matchStatus =
          statusFilter === 'All' ||
          status === statusFilter;

        const matchTechnician =
          technicianFilter === 'All' ||
          (
            technicianFilter === 'Unassigned'
              ? !isAssigned(ticket)
              : ticket.assignedTo === technicianFilter
          );

        return (
          matchSearch &&
          matchCategory &&
          matchPriority &&
          matchStatus &&
          matchTechnician
        );
      })
      .sort((a, b) => {
        let result;

        if (sortField === 'createdAt') {
          result =
            (parseTicketDate(a.createdAt) || 0) -
            (parseTicketDate(b.createdAt) || 0);

        } else if (sortField === 'priority') {
          const order = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
          };

          result =
            (order[normalize(a.priority)] ?? 99) -
            (order[normalize(b.priority)] ?? 99);

        } else if (sortField === 'sla') {
          const slaA = getSLA(a, now);
          const slaB = getSLA(b, now);

          const remainingA =
            isResolved(a) || !slaA.valid
              ? Number.POSITIVE_INFINITY
              : slaA.remaining;

          const remainingB =
            isResolved(b) || !slaB.valid
              ? Number.POSITIVE_INFINITY
              : slaB.remaining;

          result = remainingA === remainingB
            ? 0
            : remainingA < remainingB
              ? -1
              : 1;

        } else if (sortField === 'status') {
          result = getEffectiveStatus(a, now)
            .localeCompare(
              getEffectiveStatus(b, now)
            );

        } else {
          result = String(a[sortField] || '')
            .localeCompare(
              String(b[sortField] || ''),
              undefined,
              {
                numeric: true,
                sensitivity: 'base',
              }
            );
        }

        return sortAsc ? result : -result;
      });
  }, [
    tickets,
    users,
    now,
    canReadUsers,
    activeCategory,
    search,
    categoryFilter,
    priorityFilter,
    statusFilter,
    technicianFilter,
    sortField,
    sortAsc,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [
    activeCategory,
    search,
    categoryFilter,
    priorityFilter,
    statusFilter,
    technicianFilter,
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
    setActiveCategory('all');
    setSearch('');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setTechnicianFilter('All');
    setSortField('createdAt');
    setSortAsc(false);
    setPage(1);
  };

  const selectCategory = category => {
    const next =
      activeCategory === category
        ? 'all'
        : category;

    resetFilters();
    setActiveCategory(next);
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
  // TICKET ACTIONS
  // ==========================================================

  const openDetail = ticketId => {
    if (!canReadHelpdesk) return;

    const ticket = tickets.find(
      item => item.id === ticketId
    );

    if (!ticket) {
      showToast('Ticket record not found.');
      return;
    }

    setSelectedTicketId?.(ticketId);
    setDrawerPayload({ ticketId });
    setActiveDrawer('ticket_detail');
  };

  const openCreateTicket = () => {
    if (!canCreateTickets) return;

    setDrawerPayload(null);
    setActiveDrawer('new_ticket');
  };

  const changeTechnician = (
    ticketId,
    technician
  ) => {
    if (!canUpdateTickets) return;

    const ticket = tickets.find(
      item => item.id === ticketId
    );

    if (!ticket || isResolved(ticket)) {
      return;
    }

    if (!technicianOptions.includes(technician)) {
      showToast('Select a valid technician.');
      return;
    }

    if (ticket.assignedTo === technician) {
      return;
    }

    updateTicket(ticketId, {
      assignedTo: technician,
    });
  };

  const changePriority = (
    ticketId,
    priority
  ) => {
    if (!canUpdateTickets) return;

    const ticket = tickets.find(
      item => item.id === ticketId
    );

    if (!ticket || isResolved(ticket)) {
      return;
    }

    if (!PRIORITIES.some(
      item => item.value === priority
    )) {
      return;
    }

    if (ticket.priority === priority) {
      return;
    }

    // Preserve the SLA target configured for this ticket.
    updateTicket(ticketId, {
      priority,
    });
  };

  const changeTicketStatus = (
    ticketId,
    nextStatus
  ) => {
    if (!canUpdateTickets) return;

    const ticket = tickets.find(
      item => item.id === ticketId
    );

    if (!ticket || isResolved(ticket)) {
      return;
    }

    if (![
      'open',
      'in progress',
      'on hold',
    ].includes(nextStatus)) {
      return;
    }

    if (
      nextStatus === 'in progress' &&
      !isAssigned(ticket)
    ) {
      showToast(
        'Assign a technician before moving the ticket to In Progress.'
      );
      return;
    }

    if (ticket.status === nextStatus) {
      return;
    }

    const sla = getSLA(ticket, now);

    updateTicket(ticketId, {
      status: nextStatus,

      ...(sla.elapsed !== null
        ? { slaElapsedHours: sla.elapsed }
        : {}),
    });
  };

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const exportTickets = () => {
    if (!canExport) return;

    const headers = [
      'Ticket ID',
      'Subject',
      'Category',
      'Priority',
      'Requester',
      'Assigned Technician',
      'Workflow Status',
      'Effective SLA Status',
      'Created At',
      'Updated At',
      'SLA Target Hours',
      'SLA Elapsed Hours',
      'Resolution Note',
    ];

    const rows = filteredTickets.map(ticket => {
      const sla = getSLA(ticket, now);

      return [
        ticket.id,
        ticket.title,
        ticket.category,
        ticket.priority,
        ticket.requesterName,
        ticket.assignedTo || 'Unassigned',
        ticket.status,
        getEffectiveStatus(ticket, now),
        ticket.createdAt,
        ticket.updatedAt,
        sla.target ?? '',
        sla.elapsed === null
          ? ''
          : sla.elapsed.toFixed(2),
        ticket.resolutionNote || '',
      ];
    });

    downloadCSV(
      headers,
      rows,
      `helpdesk-tickets-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );

    showToast(
      `Exported ${rows.length} helpdesk tickets.`
    );
  };

  // ==========================================================
  // SHARED TICKET CONTROLS
  // ==========================================================

  const renderTechnician = ticket => {
    if (!canUpdateTickets || isResolved(ticket)) {
      return (
        <span className="text-[12px] text-ink">
          {ticket.assignedTo || 'Unassigned'}
        </span>
      );
    }

    return (
      <select
        value={ticket.assignedTo || 'Unassigned'}
        aria-label={`Assign technician for ${ticket.id}`}
        onClick={event =>
          event.stopPropagation()
        }
        onChange={event =>
          changeTechnician(
            ticket.id,
            event.target.value
          )
        }
        className={SELECT_CLASS}
      >
        {technicianOptions.map(name => (
          <option
            key={name}
            value={name}
          >
            {name}
          </option>
        ))}
      </select>
    );
  };

  const renderPriority = ticket => {
    if (!canUpdateTickets || isResolved(ticket)) {
      return (
        <StatusPill
          status={ticket.priority}
        />
      );
    }

    return (
      <select
        value={ticket.priority || 'medium'}
        aria-label={`Priority for ${ticket.id}`}
        onClick={event =>
          event.stopPropagation()
        }
        onChange={event =>
          changePriority(
            ticket.id,
            event.target.value
          )
        }
        className={SELECT_CLASS}
      >
        {PRIORITIES.map(priority => (
          <option
            key={priority.value}
            value={priority.value}
          >
            {priority.label}
          </option>
        ))}
      </select>
    );
  };

  const renderStatusControl = ticket => {
    const status = getEffectiveStatus(
      ticket,
      now
    );

    return (
      <div className="flex flex-col items-start gap-1.5">

        <StatusPill status={status} />

        {canUpdateTickets && !isResolved(ticket) && (
          <select
            aria-label={`Workflow status for ${ticket.id}`}
            value={ticket.status}
            onClick={event =>
              event.stopPropagation()
            }
            onChange={event =>
              changeTicketStatus(
                ticket.id,
                event.target.value
              )
            }
            className={SELECT_CLASS}
          >

            <option value="open">
              Open
            </option>

            <option value="in progress">
              In Progress
            </option>

            <option value="on hold">
              On Hold
            </option>

            {normalize(ticket.status) === 'breached sla' && (
              <option
                value={ticket.status}
                disabled
              >
                Breached SLA
              </option>
            )}

          </select>
        )}

      </div>
    );
  };

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
            ? sortAsc
              ? '↑'
              : '↓'
            : '↕'}
        </span>

      </button>
    </th>
  );

  // ==========================================================
  // KANBAN BOARD GROUPS
  // ==========================================================

  const boardColumns = useMemo(() => {
    const columns = STATUSES.map(status => ({
      ...status,

      tickets: filteredTickets.filter(ticket =>
        getEffectiveStatus(ticket, now) === status.value
      ),
    }));

    const knownStatuses = STATUSES.map(
      status => status.value
    );

    const otherTickets = filteredTickets.filter(
      ticket =>
        !knownStatuses.includes(
          getEffectiveStatus(ticket, now)
        )
    );

    if (otherTickets.length) {
      columns.push({
        value: 'other',
        label: 'Other',
        tickets: otherTickets,
      });
    }

    return columns;
  }, [filteredTickets, now]);

  // ==========================================================
  // RESTRICTED ACCESS
  // ==========================================================

  if (!canReadHelpdesk) {
    return (
      <Card title="Helpdesk Restricted">

        <div className="flex flex-col items-center gap-3 py-8 text-center">

          <IconShield className="w-8 h-8 text-muted" />

          <p className="text-[13px] text-muted">
            Your active role does not have Helpdesk: read permission.
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
      id="helpdesk-dashboard"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>

          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">

            <IconHeadphones className="w-6 h-6 text-sky-400" />

            Helpdesk

          </h2>

          <p className="text-[13px] text-muted mt-1">
            Create, assign, prioritize and resolve IT support tickets.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {activeCategory !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
            >
              View All Tickets
            </Button>
          )}

          {canExport && (
            <Button
              variant="secondary"
              icon={IconDownload}
              disabled={!filteredTickets.length}
              onClick={exportTickets}
            >
              Export CSV
            </Button>
          )}

          {canCreateTickets && (
            <Button
              variant="primary"
              icon={IconPlus}
              onClick={openCreateTicket}
              ariaLabel="Create support ticket"
            >
              Create Ticket
            </Button>
          )}

        </div>

      </div>

      {/* DYNAMIC KPI CARDS */}

      <CategoryCardsBar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
        columnsClass="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
      />

      {/* ADDITIONAL SLA AND ASSIGNMENT METRICS */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <button
          type="button"
          onClick={() =>
            selectCategory('unassigned')
          }
          aria-pressed={
            activeCategory === 'unassigned'
          }
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-surface2/40 hover:bg-surface2 text-left cursor-pointer ${
            activeCategory === 'unassigned'
              ? 'border-accent ring-1 ring-accent/30'
              : 'border-line'
          }`}
        >

          <div>

            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
              Unassigned Tickets
            </span>

            <div className="font-display font-bold text-[24px] text-accent">
              {summary.unassigned}
            </div>

          </div>

          <IconUsers className="w-6 h-6 text-accent" />

        </button>

        <button
          type="button"
          onClick={() =>
            selectCategory('critical')
          }
          aria-pressed={
            activeCategory === 'critical'
          }
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-surface2/40 hover:bg-surface2 text-left cursor-pointer ${
            activeCategory === 'critical'
              ? 'border-bad ring-1 ring-bad/30'
              : 'border-line'
          }`}
        >

          <div>

            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
              Active Critical Tickets
            </span>

            <div className="font-display font-bold text-[24px] text-bad">
              {summary.critical}
            </div>

          </div>

          <IconAlertTriangle className="w-6 h-6 text-bad" />

        </button>

        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-line bg-surface2/40">

          <div>

            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
              Approaching SLA Deadline
            </span>

            <div className="font-display font-bold text-[24px] text-warn">
              {summary.approachingSLA}
            </div>

            <p className="text-[10.5px] text-muted">
              At least 75% of SLA time consumed
            </p>

          </div>

          <IconClock className="w-6 h-6 text-warn" />

        </div>

      </div>

      {/* MAIN HELPDESK CARD */}

      <Card
        id="widget-desk"
        data-w="desk"
        title="IT Support Tickets"
        subText={`${filteredTickets.length} of ${tickets.length} tickets`}
        action={
          <div className="inline-flex items-center gap-0.5 rounded-full bg-surface2 border border-line p-0.5">

            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              onClick={() =>
                setViewMode('list')
              }
              className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-accent text-on-accent'
                  : 'text-muted hover:text-ink'
              }`}
            >
              List View
            </button>

            <button
              type="button"
              aria-pressed={viewMode === 'board'}
              onClick={() =>
                setViewMode('board')
              }
              className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-accent text-on-accent'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Kanban Board
            </button>

          </div>
        }
      >

        {/* PRIORITY BREAKDOWN */}

        <div className="p-3.5 rounded-xl bg-surface2/30 border border-line flex flex-col gap-2">

          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
            Active Ticket Priority Distribution
          </span>

          <SegmentedBar
            items={priorityBreakdown}
            total={summary.active}
          />

        </div>

        {/* SEARCH AND FILTERS */}

        <div className="flex flex-wrap items-center gap-2.5 py-2 border-b border-line/60">

          <div className="relative w-full sm:w-64">

            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />

            <input
              type="text"
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              aria-label="Search support tickets"
              placeholder="Search ticket ID, subject, employee..."
              className={`${FILTER_CLASS} w-full pl-8 pr-8`}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear ticket search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

          <select
            value={categoryFilter}
            onChange={event =>
              setCategoryFilter(
                event.target.value
              )
            }
            aria-label="Filter ticket category"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Categories
            </option>

            {categoryOptions.map(category => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}

          </select>

          <select
            value={priorityFilter}
            onChange={event =>
              setPriorityFilter(
                event.target.value
              )
            }
            aria-label="Filter ticket priority"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Priorities
            </option>

            {PRIORITIES.map(priority => (
              <option
                key={priority.value}
                value={priority.value}
              >
                {priority.label}
              </option>
            ))}

          </select>

          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(
                event.target.value
              )
            }
            aria-label="Filter ticket status"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Statuses
            </option>

            {STATUSES.map(status => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}

          </select>

          <select
            value={technicianFilter}
            onChange={event =>
              setTechnicianFilter(
                event.target.value
              )
            }
            aria-label="Filter assigned technician"
            className={FILTER_CLASS}
          >

            <option value="All">
              All Technicians
            </option>

            {technicianOptions.map(name => (
              <option
                key={name}
                value={name}
              >
                {name}
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

        {/* EMPTY STATE */}

        {!filteredTickets.length ? (
          <EmptyState
            icon={IconHeadphones}
            message="No support tickets match the selected search or filters."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : viewMode === 'list' ? (

          /* =================================================
             LIST VIEW
          ================================================== */

          <div className="overflow-x-auto -mx-1">

            <table className="w-full min-w-[1450px] text-left border-collapse">

              <thead>

                <tr className="border-b border-line">

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    No.
                  </th>

                  {sortableHeader(
                    'Ticket ID & Subject',
                    'id'
                  )}

                  {sortableHeader(
                    'Category',
                    'category'
                  )}

                  {sortableHeader(
                    'Priority',
                    'priority'
                  )}

                  {sortableHeader(
                    'Requester',
                    'requesterName'
                  )}

                  {sortableHeader(
                    'Assigned Technician',
                    'assignedTo'
                  )}

                  {sortableHeader(
                    'Status',
                    'status'
                  )}

                  {sortableHeader(
                    'Created At',
                    'createdAt'
                  )}

                  {sortableHeader(
                    'SLA Timer',
                    'sla'
                  )}

                  <th
                    scope="col"
                    className={HEADER_CLASS}
                  >
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-dashed divide-line">

                {paginatedTickets.map((ticket, index) => {
                  const requester = canReadUsers
                    ? users.find(user =>
                        user.id === ticket.requesterId
                      )
                    : null;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-surface2/40 transition-colors group"
                    >

                      <td className={`${CELL_CLASS} text-muted font-data`}>

                        {
                          (currentPage - 1) *
                            pageSize +
                          index + 1
                        }

                      </td>

                      <td className={CELL_CLASS}>

                        <button
                          type="button"
                          onClick={() =>
                            openDetail(ticket.id)
                          }
                          className="flex flex-col gap-1 text-left cursor-pointer"
                        >

                          <span className="font-bold text-accent font-data text-[12px]">
                            {ticket.id}
                          </span>

                          <span
                            title={ticket.title}
                            className="font-semibold text-ink hover:text-accent transition-colors max-w-[230px] truncate"
                          >
                            {ticket.title}
                          </span>

                          <span className="text-[10.5px] text-muted">
                            {getTicketAge(ticket, now)}
                          </span>

                        </button>

                      </td>

                      <td className={CELL_CLASS}>

                        <Tag>
                          {ticket.category || 'Other'}
                        </Tag>

                      </td>

                      <td className={`${CELL_CLASS} min-w-[120px]`}>

                        {renderPriority(ticket)}

                      </td>

                      <td className={CELL_CLASS}>

                        <div className="flex items-center gap-2">

                          <Avatar
                            name={
                              ticket.requesterName ||
                              'Employee'
                            }
                            size={28}
                          />

                          <div className="flex flex-col gap-0.5">

                            <span className="font-semibold text-ink whitespace-nowrap">
                              {ticket.requesterName || '—'}
                            </span>

                            {requester?.employeeId && (
                              <span className="text-[10.5px] text-muted font-data">
                                {requester.employeeId}
                              </span>
                            )}

                            {canReadUsers &&
                              (
                                ticket.requesterEmail ||
                                requester?.email
                              ) && (
                                <span className="text-[10.5px] text-muted">
                                  {ticket.requesterEmail || requester.email}
                                </span>
                              )}

                          </div>

                        </div>

                      </td>

                      <td className={`${CELL_CLASS} min-w-[150px]`}>

                        {renderTechnician(ticket)}

                      </td>

                      <td className={`${CELL_CLASS} min-w-[130px]`}>

                        {renderStatusControl(ticket)}

                      </td>

                      <td className={`${CELL_CLASS} text-muted text-[11.5px] whitespace-nowrap`}>

                        {ticket.createdAt || '—'}

                      </td>

                      <td className={CELL_CLASS}>

                        <SLAIndicator
                          ticket={ticket}
                          now={now}
                        />

                      </td>

                      <td className={CELL_CLASS}>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            openDetail(ticket.id)
                          }
                          className="!text-[11px] whitespace-nowrap"
                        >
                          {!isResolved(ticket) && canUpdateTickets
                            ? 'Manage Ticket'
                            : 'View Details'}
                        </Button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        ) : (

          /* =================================================
             KANBAN BOARD VIEW
          ================================================== */

          <div className="overflow-x-auto pb-3">

            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns:
                  `repeat(${boardColumns.length}, minmax(255px, 1fr))`,

                minWidth:
                  `${boardColumns.length * 265}px`,
              }}
            >

              {boardColumns.map(column => (
                <section
                  key={column.value}
                  className="flex flex-col gap-3 p-3 rounded-xl border border-line bg-surface2/20 min-h-[300px]"
                >

                  {/* COLUMN HEADER */}

                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-line">

                    <h3 className="text-[13px] font-bold text-ink">
                      {column.label}
                    </h3>

                    <span className="px-2 py-0.5 rounded-full bg-surface2 border border-line text-[11px] font-bold text-accent">
                      {column.tickets.length}
                    </span>

                  </div>

                  {!column.tickets.length ? (
                    <div className="py-8 text-center text-[12px] text-muted">
                      No tickets
                    </div>
                  ) : (
                    column.tickets.map(ticket => (
                      <article
                        key={ticket.id}
                        className="flex flex-col gap-3 p-3 rounded-xl border border-line bg-surface2/50 hover:border-accent/40 transition-colors"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            openDetail(ticket.id)
                          }
                          className="flex flex-col gap-1.5 text-left cursor-pointer"
                        >

                          <div className="flex items-center justify-between gap-2 w-full">

                            <span className="text-[11.5px] font-data font-bold text-accent">
                              {ticket.id}
                            </span>

                            <StatusPill
                              status={ticket.priority}
                            />

                          </div>

                          <h4 className="font-semibold text-[13px] text-ink hover:text-accent leading-snug">
                            {ticket.title}
                          </h4>

                        </button>

                        <div className="flex items-center justify-between gap-2">

                          <Tag>
                            {ticket.category || 'Other'}
                          </Tag>

                          <span className="text-[10px] text-muted">
                            {getTicketAge(ticket, now)}
                          </span>

                        </div>

                        <div className="flex items-center gap-2">

                          <Avatar
                            name={
                              ticket.requesterName ||
                              'Employee'
                            }
                            size={24}
                          />

                          <span className="text-[11.5px] text-muted">
                            {ticket.requesterName || '—'}
                          </span>

                        </div>

                        <div className="flex flex-col gap-1.5">

                          <span className="text-[10.5px] uppercase font-semibold text-muted">
                            Assigned Technician
                          </span>

                          {renderTechnician(ticket)}

                        </div>

                        {!isResolved(ticket) && (
                          <div className="flex flex-col gap-1.5">

                            <span className="text-[10.5px] uppercase font-semibold text-muted">
                              Priority
                            </span>

                            {renderPriority(ticket)}

                          </div>
                        )}

                        {renderStatusControl(ticket)}

                        <div className="pt-2 border-t border-line/60">

                          <SLAIndicator
                            ticket={ticket}
                            now={now}
                          />

                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            openDetail(ticket.id)
                          }
                          className="w-full !text-[11.5px]"
                        >
                          {!isResolved(ticket) && canUpdateTickets
                            ? 'Manage Ticket'
                            : 'View Details'}
                        </Button>

                      </article>
                    ))
                  )}

                </section>
              ))}

            </div>

          </div>
        )}

        {/* LIST VIEW PAGINATION */}

        {viewMode === 'list' && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredTickets.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}

        {viewMode === 'board' && (
          <div className="pt-2 border-t border-line/60 text-[12px] text-muted">
            Showing all {filteredTickets.length} matching tickets across workflow columns.
          </div>
        )}

      </Card>

    </div>
  );
}
