import React, {
  useState,
  useMemo,
  useEffect,
  useRef
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';

import {
  LeaveRequestDetailsModal
} from '../../components/modals/LeaveRequestDetailsModal.jsx';

import {
  ApprovalCommentModal
} from '../../components/modals/ApprovalCommentModal.jsx';

import {
  formatDate,
  formatDateRange
} from '../../utils/helpers.js';

import {
  Calendar,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle
} from 'lucide-react';

// ============================================================
// CONFIGURATION
// ============================================================

const PAGE_SIZE = 6;

const LEAVE_TYPES = [
  'All',
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Optional Holiday',
  'Unpaid Leave'
];

// ============================================================
// APPROVAL STATUS HELPERS
// ============================================================

const normalizeApproval = value => {
  const status = String(
    value || 'pending'
  ).trim().toLowerCase();

  if (
    status === 'approved' ||
    status === 'rejected'
  ) {
    return status;
  }

  return 'pending';
};

const getLeaveStatus = (
  teamLeadApproval,
  hrApproval
) => {

  // Either rejection makes the request rejected.

  if (
    teamLeadApproval === 'rejected' ||
    hrApproval === 'rejected'
  ) {
    return 'rejected';
  }

  // Both approvals are required.

  if (
    teamLeadApproval === 'approved' &&
    hrApproval === 'approved'
  ) {
    return 'approved';
  }

  // All remaining combinations are pending.

  return 'pending';
};

const getReviewStage = (
  teamLeadApproval,
  hrApproval
) => {
  const status = getLeaveStatus(
    teamLeadApproval,
    hrApproval
  );

  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  if (teamLeadApproval === 'pending') {
    return 'team-lead-review';
  }

  return 'hr-review';
};

const formatApprovalLabel = status => {
  const labels = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending'
  };

  return labels[status] || 'Pending';
};

const getApprovalColor = status => {
  const colors = {
    approved: 'text-good',
    rejected: 'text-bad',
    pending: 'text-warn'
  };

  return colors[status] || 'text-muted';
};

const getReviewStageLabel = stage => {
  const labels = {
    'team-lead-review': 'Pending Team Lead Review',
    'hr-review': 'Pending HR Review',
    approved: 'Fully Approved',
    rejected: 'Rejected'
  };

  return labels[stage] || 'Pending Review';
};

const canReviewLeave = request =>
  Boolean(
    request &&
    request.status === 'pending' &&
    request.reviewStage === 'team-lead-review' &&
    request.teamLeadApproval === 'pending' &&
    request.hrApproval !== 'rejected'
  );

// ============================================================
// EMPLOYEE ID HELPERS
// ============================================================

const getEmployeeIds = employee => {
  return [
    employee?.employeeId,
    employee?.id
  ]
    .filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
    )
    .map(value => String(value));
};

const getEmployeeId = employee =>
  getEmployeeIds(employee)[0] || '';

const matchesEmployee = (
  employee,
  employeeId
) =>
  getEmployeeIds(employee).includes(
    String(employeeId ?? '')
  );

// ============================================================
// DATE HELPERS
// ============================================================

const getLocalDateKey = (
  value = new Date()
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

const normalizeDateKey = value => {
  const text = String(value || '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return '';
  }

  const [year, month, day] =
    text.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return getLocalDateKey(date) === text
    ? text
    : '';
};

const hasValidDateRange = request => {
  const from = normalizeDateKey(
    request?.fromDate
  );

  const to = normalizeDateKey(
    request?.toDate
  );

  return Boolean(
    from && to && from <= to
  );
};

const safeFormatDate = value => {
  const dateKey = normalizeDateKey(value);

  return dateKey
    ? formatDate(dateKey)
    : 'Not Available';
};

const safeFormatDateRange = (
  fromDate,
  toDate
) => {
  if (
    !hasValidDateRange({
      fromDate,
      toDate
    })
  ) {
    return 'Invalid date range';
  }

  return formatDateRange(
    normalizeDateKey(fromDate),
    normalizeDateKey(toDate)
  );
};

const getFinancialYear = () => {
  const now = new Date();

  const year = now.getFullYear();

  const startYear =
    now.getMonth() >= 3
      ? year
      : year - 1;

  return `${startYear}–${String(
    startYear + 1
  ).slice(-2)}`;
};

// ============================================================
// LEAVE DAYS VALIDATION
// Preserve company-provided leave-day calculations.
// ============================================================

const getLeaveDays = request => {
  const rawDays = request?.totalDays;

  if (
    rawDays === null ||
    rawDays === undefined ||
    rawDays === ''
  ) {
    return null;
  }

  const days = Number(rawDays);

  return Number.isFinite(days) && days > 0
    ? days
    : null;
};

const formatLeaveDays = days => {
  if (days === null) {
    return 'Days unavailable';
  }

  return `${days} ${days === 1 ? 'day' : 'days'}`;
};

// ============================================================
// OVERLAPPING LEAVE REQUESTS
// ============================================================

const datesOverlap = (
  firstRequest,
  secondRequest
) => {
  if (
    !hasValidDateRange(firstRequest) ||
    !hasValidDateRange(secondRequest)
  ) {
    return false;
  }

  const firstStart = normalizeDateKey(
    firstRequest.fromDate
  );

  const firstEnd = normalizeDateKey(
    firstRequest.toDate
  );

  const secondStart = normalizeDateKey(
    secondRequest.fromDate
  );

  const secondEnd = normalizeDateKey(
    secondRequest.toDate
  );

  return (
    firstStart <= secondEnd &&
    secondStart <= firstEnd
  );
};

const getOverlappingLeaves = (
  request,
  allRequests
) => {
  if (request.status === 'rejected') {
    return [];
  }

  return allRequests.filter(item => {
    if (
      String(item.id) === String(request.id) ||
      item.status === 'rejected'
    ) {
      return false;
    }

    return datesOverlap(request, item);
  });
};

// ============================================================
// LEAVE BALANCE HELPERS
// ============================================================

const getBalanceValue = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const BalanceCell = ({ balance }) => {
  const remaining = getBalanceValue(
    balance?.remaining
  );

  const total = getBalanceValue(
    balance?.total
  );

  if (
    remaining === null ||
    total === null
  ) {
    return (
      <span className="text-xs text-muted">
        —
      </span>
    );
  }

  return (
    <div className="space-y-1">

      <div className="font-data tabular-nums">

        <span
          className={`font-semibold ${
            remaining <= 0
              ? 'text-bad'
              : 'text-ink'
          }`}
        >
          {remaining}
        </span>

        <span className="text-[10px] text-muted">
          {' / '}
          {total}
        </span>

      </div>

      {total > 0 && (
        <div className="
          mx-auto h-1.5 max-w-[78px]
          overflow-hidden rounded-full
          bg-white/10
        ">
          <div
            className={`h-full rounded-full ${
              remaining <= 0
                ? 'bg-bad'
                : remaining / total <= 0.25
                  ? 'bg-warn'
                  : 'bg-good'
            }`}
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  (remaining / total) * 100
                )
              )}%`
            }}
          />
        </div>
      )}

    </div>
  );
};

// ============================================================
// APPROVAL STAGE BADGE
// ============================================================

const ApprovalStage = ({ request }) => (
  <div className="
    mt-2 flex flex-wrap gap-1.5 text-[10px]
  ">

    <span className="
      rounded-full bg-surface
      px-2 py-1 text-muted
    ">
      Team Lead:{' '}

      <strong
        className={getApprovalColor(
          request.teamLeadApproval
        )}
      >
        {formatApprovalLabel(
          request.teamLeadApproval
        )}
      </strong>
    </span>

    <span className="
      rounded-full bg-surface
      px-2 py-1 text-muted
    ">
      HR:{' '}

      <strong
        className={getApprovalColor(
          request.hrApproval
        )}
      >
        {formatApprovalLabel(
          request.hrApproval
        )}
      </strong>
    </span>

  </div>
);

// ============================================================
// MAIN LEAVE MANAGEMENT COMPONENT
// ============================================================

export const LeaveManagement = () => {

  const {
    currentUser,
    teamMembers = [],
    approvals = [],
    decideApproval,
    globalSearchTerm = '',
    triggerToast
  } = useTeamLead();

  const [activeTab, setActiveTab] =
    useState('requests');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState('All');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedRequestId, setSelectedRequestId] =
    useState(null);

  const [directDecision, setDirectDecision] =
    useState(null);

  const [isDetailsOpen, setIsDetailsOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  

  const [calendarDate, setCalendarDate] =
    useState(() => {
      const date = new Date();

      return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );
    });

  const [
    selectedCalendarDate,
    setSelectedCalendarDate
  ] = useState(
    () => getLocalDateKey()
  );

  const [calendarFilter, setCalendarFilter] =
    useState('approved');

  const decisionLock = useRef(false);

  const today = getLocalDateKey();

  const effectiveSearch = String(
    searchTerm || globalSearchTerm || ''
  ).trim().toLowerCase();

  // ==========================================================
  // AUTHORIZED TEAM MEMBERS
  // ==========================================================

  const authorizedMembers = useMemo(
    () =>
      Array.isArray(teamMembers)
        ? teamMembers.filter(
            member =>
              member &&
              getEmployeeId(member)
          )
        : [],
    [teamMembers]
  );

  // ==========================================================
  // LEAVE REQUESTS
  // ==========================================================

  const leaveRequests = useMemo(() => {

    if (!Array.isArray(approvals)) {
      return [];
    }

    return approvals
      .filter(item =>
        item &&
        item.category === 'Leave Approval' &&
        authorizedMembers.some(member =>
          matchesEmployee(
            member,
            item.employeeId
          )
        )
      )
      .map(item => {

        const teamLeadApproval =
          normalizeApproval(
            item.teamLeadApproval ??
            item.managerApprovalStatus
          );

        const hrApproval =
          normalizeApproval(
            item.hrApproval ??
            item.hrApprovalStatus
          );

        const status = getLeaveStatus(
          teamLeadApproval,
          hrApproval
        );

        return {
          ...item,

          teamLeadApproval,

          hrApproval,

          status,

          reviewStage: getReviewStage(
            teamLeadApproval,
            hrApproval
          ),

          totalDays: getLeaveDays(item),

          employeeName:
            item.employeeName || 'Employee',

          employeeId: String(
            item.employeeId ?? ''
          ),

          requestType:
            item.requestType || 'Leave',

          reason:
            item.reason || 'No reason provided'
        };
      })
      .sort((left, right) => {

        const leftDate = Date.parse(
          left.requestDate || ''
        ) || 0;

        const rightDate = Date.parse(
          right.requestDate || ''
        ) || 0;

        return rightDate - leftDate;
      });

  }, [
    approvals,
    authorizedMembers
  ]);

  // ==========================================================
  // LEAVE SUMMARY
  // ==========================================================

  const summary = useMemo(() => ({
    total: leaveRequests.length,

    teamLeadPending: leaveRequests.filter(
      item =>
        item.reviewStage === 'team-lead-review'
    ).length,

    hrPending: leaveRequests.filter(
      item =>
        item.reviewStage === 'hr-review'
    ).length,

    approved: leaveRequests.filter(
      item => item.status === 'approved'
    ).length,

    rejected: leaveRequests.filter(
      item => item.status === 'rejected'
    ).length

  }), [leaveRequests]);

  // ==========================================================
  // SEARCH AND FILTERS
  // ==========================================================

  const filteredLeaves = useMemo(() => {

    return leaveRequests.filter(item => {

      const matchSearch = [
        item.employeeName,
        item.employeeId,
        item.reason,
        item.requestType
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(effectiveSearch)
      );

      const matchStatus =
        statusFilter === 'all' ||

        (
          statusFilter === 'team-lead-review' &&
          item.reviewStage === 'team-lead-review'
        ) ||

        (
          statusFilter === 'hr-review' &&
          item.reviewStage === 'hr-review'
        ) ||

        item.status === statusFilter;

      const matchType =
        leaveTypeFilter === 'All' ||

        String(item.requestType)
          .toLowerCase()
          .includes(
            leaveTypeFilter.toLowerCase()
          );

      return (
        matchSearch &&
        matchStatus &&
        matchType
      );
    });

  }, [
    leaveRequests,
    effectiveSearch,
    statusFilter,
    leaveTypeFilter
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLeaves.length / PAGE_SIZE
    )
  );

  const safePage = Math.max(
    1,
    Math.min(
      currentPage,
      totalPages
    )
  );

  const paginatedLeaves = useMemo(() => {

    const start =
      (safePage - 1) * PAGE_SIZE;

    return filteredLeaves.slice(
      start,
      start + PAGE_SIZE
    );

  }, [
    filteredLeaves,
    safePage
  ]);

  useEffect(() => {

    setCurrentPage(1);

  }, [
    statusFilter,
    leaveTypeFilter,
    effectiveSearch
  ]);

  useEffect(() => {

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

  }, [
    currentPage,
    totalPages
  ]);

  // ==========================================================
  // OVERLAPPING LEAVE WARNINGS
  // ==========================================================

  const overlappingRequests = useMemo(() => {

    const result = new Map();

    leaveRequests.forEach(request => {

      result.set(
        request.id,
        getOverlappingLeaves(
          request,
          leaveRequests
        )
      );
    });

    return result;

  }, [leaveRequests]);

  // ==========================================================
  // LEAVE DETAILS
  // Always display the latest request status.
  // ==========================================================

  const selectedRequest =
    leaveRequests.find(
      request =>
        String(request.id) ===
        String(selectedRequestId)
    ) || null;

  const closeDetails = () => {

    if (decisionLock.current) {
      return;
    }

    setIsDetailsOpen(false);

    setSelectedRequestId(null);
  };

  const openDetails = request => {

    setSelectedRequestId(request.id);

    setIsDetailsOpen(true);
  };

  // ==========================================================
  // LEAVE APPROVAL VALIDATION
  // ==========================================================

  const canDecideRequest = request =>
    canReviewLeave(request) &&
    !matchesEmployee(
      currentUser,
      request?.employeeId
    );

  const openDirectDecision = (
    request,
    action
  ) => {

    if (
      decisionLock.current ||
      !canDecideRequest(request)
    ) {
      return;
    }

    setDirectDecision({
      approval: request,
      action
    });
  };

  // ==========================================================
  // APPROVE / REJECT LEAVE
  // ==========================================================

  const handleLeaveDecision = async (
    id,
    action,
    comment
  ) => {

    if (decisionLock.current) {
      throw new Error(
        'A leave decision is already being submitted.'
      );
    }

    if (
      !['approved', 'rejected'].includes(action)
    ) {
      throw new Error(
        'Invalid leave decision.'
      );
    }

    const request = leaveRequests.find(
      item => String(item.id) === String(id)
    );

    if (!request) {
      throw new Error(
        'Leave request is unavailable or access is restricted.'
      );
    }

    if (!canDecideRequest(request)) {
      throw new Error(
        'This leave request is no longer available for Team Lead review.'
      );
    }

    if (
      action === 'approved' &&
      (
        !hasValidDateRange(request) ||
        request.totalDays === null
      )
    ) {
      throw new Error(
        'The leave request contains invalid dates or leave days.'
      );
    }

    const cleanComment = String(
      comment || ''
    ).trim();

    if (
      action === 'rejected' &&
      !cleanComment
    ) {
      throw new Error(
        'Please enter a reason for rejecting this request.'
      );
    }

    if (typeof decideApproval !== 'function') {
      throw new Error(
        'Leave approval service is unavailable.'
      );
    }

    decisionLock.current = true;

    setIsSubmitting(true);

    try {

      const updated = await decideApproval(
        request.id,
        action,
        cleanComment
      );

      if (
        !updated ||
        updated.success === false
      ) {
        throw new Error(
          updated?.message ||
          'Unable to update this leave request.'
        );
      }

      setDirectDecision(null);

      setIsDetailsOpen(false);

      setSelectedRequestId(null);

      return updated;

    } finally {

      decisionLock.current = false;

      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // EMPLOYEE LEAVE BALANCES
  // Use recorded balances without double deduction.
  // ==========================================================

  const filteredBalanceMembers = useMemo(() => {

    return authorizedMembers.filter(member =>

      [
        member.name,
        member.id,
        member.employeeId,
        member.designation,
        member.department,
        member.dept
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(effectiveSearch)
      )

    );

  }, [
    authorizedMembers,
    effectiveSearch
  ]);

  // ==========================================================
  // LEAVE CALENDAR
  // ==========================================================

  const calendarYear =
    calendarDate.getFullYear();

  const calendarMonth =
    calendarDate.getMonth();

  const monthTitle =
    calendarDate.toLocaleDateString(
      'en-GB',
      {
        month: 'long',
        year: 'numeric'
      }
    );

  const firstDayOffset =
    (
      new Date(
        calendarYear,
        calendarMonth,
        1
      ).getDay() + 6
    ) % 7;

  const daysInMonth = new Date(
    calendarYear,
    calendarMonth + 1,
    0
  ).getDate();

  const handleMonthChange = direction => {

    const nextMonth = new Date(
      calendarYear,
      calendarMonth + direction,
      1
    );

    setCalendarDate(nextMonth);

    setSelectedCalendarDate(
      getLocalDateKey(nextMonth)
    );
  };

  const handleCalendarToday = () => {

    const date = new Date();

    setCalendarDate(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );

    setSelectedCalendarDate(
      getLocalDateKey(date)
    );
  };

  // ==========================================================
  // CALENDAR LEAVE DATA
  // ==========================================================

  const calendarLeaves = useMemo(() => {

    const records = {};

    const eligibleRequests =
      leaveRequests.filter(request => {

        if (
          request.status === 'rejected' ||
          !hasValidDateRange(request)
        ) {
          return false;
        }

        const matchesSearch = [
          request.employeeName,
          request.employeeId,
          request.requestType,
          request.reason
        ].some(value =>
          String(value || '')
            .toLowerCase()
            .includes(effectiveSearch)
        );

        if (!matchesSearch) {
          return false;
        }

        if (calendarFilter === 'approved') {
          return request.status === 'approved';
        }

        if (calendarFilter === 'pending') {
          return request.status === 'pending';
        }

        return true;
      });

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      const dateKey = getLocalDateKey(
        new Date(
          calendarYear,
          calendarMonth,
          day
        )
      );

      records[dateKey] =
        eligibleRequests.filter(request => {

          const fromDate = normalizeDateKey(
            request.fromDate
          );

          const toDate = normalizeDateKey(
            request.toDate
          );

          return (
            dateKey >= fromDate &&
            dateKey <= toDate
          );
        });
    }

    return records;

  }, [
    leaveRequests,
    calendarYear,
    calendarMonth,
    daysInMonth,
    calendarFilter,
    effectiveSearch
  ]);

  const selectedDayLeaves =
    calendarLeaves[selectedCalendarDate] || [];

  const selectedDayEmployeeCount =
    new Set(
      selectedDayLeaves.map(
        request => request.employeeId
      )
    ).size;

  // ==========================================================
  // KPI CARDS
  // ==========================================================

  const kpiCards = [
    {
      key: 'all',
      label: 'All Leave Requests',
      value: summary.total,
      color: 'text-ink',
      border: 'border-accent',
      caption: 'Total team requests'
    },
    {
      key: 'team-lead-review',
      label: 'Team Lead Review',
      value: summary.teamLeadPending,
      color: 'text-warn',
      border: 'border-warn',
      caption: 'Awaiting your review'
    },
    {
      key: 'hr-review',
      label: 'HR Review',
      value: summary.hrPending,
      color: 'text-info',
      border: 'border-info',
      caption: 'Awaiting HR approval'
    },
    {
      key: 'approved',
      label: 'Approved Leaves',
      value: summary.approved,
      color: 'text-good',
      border: 'border-good',
      caption: 'Fully approved'
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: summary.rejected,
      color: 'text-bad',
      border: 'border-bad',
      caption: 'Rejected requests'
    }
  ];

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* ====================================================
          KPI CARDS
      ==================================================== */}

      <div className="
        grid grid-cols-2 sm:grid-cols-3
        xl:grid-cols-5 gap-3
      ">

        {kpiCards.map(card => (

          <button
            key={card.key}
            type="button"

            aria-pressed={
              statusFilter === card.key
            }

            onClick={() => {
              setActiveTab('requests');

              setStatusFilter(card.key);

              setCurrentPage(1);
            }}

            className={`
              glass-card kpi-card
              !min-h-[132px] !p-4
              flex flex-col justify-between
              text-left cursor-pointer transition

              ${statusFilter === card.key
                ? card.border
                : ''}
            `}
          >

            <span className={`
              text-xs font-medium uppercase
              tracking-wider ${card.color}
            `}>
              {card.label}
            </span>

            <div className={`
              font-data text-2xl font-bold
              tabular-nums ${card.color}
            `}>
              {card.value}
            </div>

            <span className="text-xs text-muted">
              {card.caption}
            </span>

          </button>

        ))}

      </div>

      {/* LEAVE_APPROVALS_UI_V3 */}

      <div className="
        flex min-w-0 flex-col gap-3
        md:flex-row md:items-center
        md:justify-between
        border-b border-line/50 pb-2
      ">

        <div className="
          flex min-w-0 flex-1 flex-nowrap
          items-center gap-2 overflow-x-auto
        ">

          {[
            {
              id: 'requests',
              label: `Team Requests (${leaveRequests.length})`,
              icon: FileText
            },
            {
              id: 'balances',
              label: 'Employee Balances',
              icon: Clock
            },
            {
              id: 'calendar',
              label: 'Team Leave Calendar',
              icon: Calendar
            }
          ].map(tab => {

            const Icon = tab.icon;

            const selected =
              activeTab === tab.id;

            return (

              <button
                key={tab.id}
                type="button"
                aria-pressed={selected}

                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}

                className={`
                  inline-flex h-11 shrink-0
                  items-center justify-center gap-2
                  whitespace-nowrap px-3
                  border-b-2
                  text-[13px] font-semibold
                  transition-colors
                  ${selected
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-ink'}
                `}
              >

                <Icon className="
                  h-4 w-4 shrink-0
                " />

                {tab.label}

              </button>

            );
          })}

        </div>

        {/* SHARED EMPLOYEE SEARCH */}

        <div className="
          relative w-full shrink-0
          md:w-[210px] xl:w-[250px]
        ">

          <Search className="
            absolute left-3 top-1/2
            h-4 w-4 -translate-y-1/2
            text-muted pointer-events-none
          " />

          <input
            type="search"

            aria-label="Search employee"

            placeholder="Search employee..."

            value={searchTerm}

            onChange={event => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}

            className="
              h-10 w-full min-w-0
              rounded-xl border border-line
              bg-surface2 pl-9 pr-3
              text-[13px] text-ink
              placeholder:text-muted
              outline-none
              focus:border-accent
            "
          />

        </div>

      </div>

{/* ====================================================
          TEAM LEAVE REQUESTS
      ==================================================== */}

      {activeTab === 'requests' && (

        <div className="glass-card !p-4 space-y-3">

          {/* REQUEST FILTERS */}

          <div className="
            flex flex-wrap items-center
            justify-between gap-3
            pb-3 border-b border-line/50
          ">

            <div>
              <h3 className="
                font-display font-semibold
                text-base text-ink
              ">
                Team Leave Requests
              </h3>

              <span className="text-xs text-muted">
                Showing {filteredLeaves.length}{' '}
                of {leaveRequests.length} requests
              </span>
            </div>

            <select
              aria-label="Leave status"

              value={statusFilter}

              onChange={event =>
                setStatusFilter(event.target.value)
              }

              className="
                bg-surface2 border border-line
                rounded-xl px-3 py-2
                text-xs text-ink
                focus:border-accent
              "
            >

              <option value="all">
                All Statuses
              </option>

              <option value="pending">
                All Pending
              </option>

              <option value="team-lead-review">
                Pending Team Lead Review
              </option>

              <option value="hr-review">
                Pending HR Review
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>

            </select>

          </div>

          {/* LEAVE TYPES */}

          <div className="
            flex items-center gap-1.5
            overflow-x-auto pb-1
          ">

            <span className="
              text-xs text-muted font-semibold
              mr-1 flex shrink-0 items-center gap-1
            ">

              <Filter className="w-3.5 h-3.5" />

              Leave Type:

            </span>

            {LEAVE_TYPES.map(type => (

              <button
                key={type}
                type="button"

                aria-pressed={
                  leaveTypeFilter === type
                }

                onClick={() => {
                  setLeaveTypeFilter(type);

                  setCurrentPage(1);
                }}

                className={`
                  px-2.5 py-1 rounded-full
                  text-xs font-medium
                  whitespace-nowrap transition

                  ${leaveTypeFilter === type
                    ? 'bg-accent text-on-accent font-bold shadow-sm'
                    : 'bg-surface2 text-muted hover:text-ink'}
                `}
              >

                {type}

              </button>

            ))}

          </div>

          {/* EMPTY STATE */}

          {paginatedLeaves.length === 0 ? (

            <div className="
              p-12 text-center
              text-muted text-xs space-y-2
            ">

              <AlertCircle className="
                w-8 h-8 mx-auto text-muted
              " />

              <p>
                No leave requests found matching
                your filter selection.
              </p>

              <button
                type="button"

                onClick={() => {
                  setStatusFilter('all');

                  setLeaveTypeFilter('All');

                  setSearchTerm('');

                  setCurrentPage(1);
                }}

                className="
                  mt-2 text-accent
                  font-medium hover:underline
                "
              >
                Reset local filters
              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {paginatedLeaves.map(item => {

                const overlaps =
                  overlappingRequests.get(item.id) || [];

                const sameEmployeeOverlaps =
                  overlaps.filter(request =>
                    request.employeeId ===
                    item.employeeId
                  );

                const otherEmployeeOverlaps =
                  overlaps.filter(request =>
                    request.employeeId !==
                    item.employeeId
                  );

                const overlappingEmployees =
                  new Set(
                    otherEmployeeOverlaps.map(
                      request => request.employeeId
                    )
                  ).size;

                return (

                  <div
                    key={item.id}

                    className="
                      p-3.5 rounded-2xl
                      bg-surface2/50 border border-line/50
                      hover:border-accent/40 transition
                      flex flex-col xl:flex-row
                      items-start xl:items-center
                      justify-between gap-4
                    "
                  >

                    {/* REQUEST INFORMATION */}

                    <div className="
                      flex items-start gap-3 min-w-0
                    ">

                      <Avatar
                        name={item.employeeName}
                        size="md"
                      />

                      <div className="min-w-0">

                        <div className="
                          flex items-center
                          gap-2 flex-wrap
                        ">

                          <span className="
                            font-semibold text-ink text-sm
                          ">
                            {item.employeeName}
                          </span>

                          <span className="
                            text-[10px] text-muted font-data
                            px-1.5 py-0.5 rounded
                            bg-surface border border-line
                          ">
                            {item.employeeId}
                          </span>

                          <span className="
                            text-xs font-semibold text-accent
                          ">
                            {item.requestType}
                          </span>

                          <StatusBadge
                            status={item.status}
                          />

                        </div>

                        {/* LEAVE DATES */}

                        <div className="
                          text-xs text-ink font-medium
                          mt-2 flex flex-wrap
                          items-center gap-2
                        ">

                          <span className="
                            flex items-center gap-1
                          ">

                            <Calendar className="
                              w-3.5 h-3.5 text-muted
                            " />

                            {safeFormatDateRange(
                              item.fromDate,
                              item.toDate
                            )}

                          </span>

                          <span className="
                            font-data font-semibold
                            tabular-nums
                          ">
                            ({formatLeaveDays(
                              item.totalDays
                            )})
                          </span>

                          <span className="
                            text-muted text-[11px]
                          ">
                            · Requested:{' '}

                            {safeFormatDate(
                              item.requestDate
                            )}
                          </span>

                        </div>

                        {/* LEAVE REASON */}

                        <p className="
                          text-xs text-muted
                          mt-1 leading-snug break-words
                        ">
                          "{item.reason}"
                        </p>

                        {/* APPROVAL STAGES */}

                        <ApprovalStage
                          request={item}
                        />

                        {/* CURRENT WORKFLOW STATUS */}

                        <div className={`
                          mt-2 flex items-center
                          gap-1.5 text-[11px]
                          font-medium

                          ${item.reviewStage === 'hr-review'
                            ? 'text-info'
                            : item.status === 'approved'
                              ? 'text-good'
                              : item.status === 'rejected'
                                ? 'text-bad'
                                : 'text-warn'}
                        `}>

                          {item.status === 'approved' ? (

                            <CheckCircle className="
                              w-3.5 h-3.5
                            " />

                          ) : (

                            <Clock className="
                              w-3.5 h-3.5
                            " />

                          )}

                          {getReviewStageLabel(
                            item.reviewStage
                          )}

                        </div>

                        {/* SAME EMPLOYEE OVERLAP */}

                        {sameEmployeeOverlaps.length > 0 && (

                          <div className="
                            mt-2 flex items-start gap-1.5
                            text-[11px] text-warn
                          ">

                            <AlertCircle className="
                              w-3.5 h-3.5 shrink-0
                            " />

                            This employee has another
                            overlapping leave request.

                          </div>

                        )}

                        {/* TEAM OVERLAP */}

                        {overlappingEmployees > 0 && (

                          <div className="
                            mt-1.5 flex items-start gap-1.5
                            text-[11px] text-warn
                          ">

                            <Users className="
                              w-3.5 h-3.5 shrink-0
                            " />

                            {overlappingEmployees}{' '}

                            {overlappingEmployees === 1
                              ? 'other employee has'
                              : 'other employees have'}{' '}

                            overlapping pending or
                            approved leave.

                          </div>

                        )}

                      </div>
                    </div>

                    {/* REQUEST ACTIONS */}

                    <div className="
                      flex flex-wrap items-center justify-end
                      gap-2 shrink-0
                      self-end xl:self-center
                    ">

                      <button
                        type="button"

                        disabled={isSubmitting}

                        onClick={() =>
                          openDetails(item)
                        }

                        className="
                          inline-flex h-9 min-w-[85px] justify-center
                          px-3 rounded-xl
                          bg-surface2 border border-line
                          text-ink hover:border-accent
                          text-xs font-semibold
                          flex items-center gap-1.5
                          transition disabled:opacity-50
                        "
                      >

                        <Eye className="
                          w-3.5 h-3.5 text-accent
                        " />

                        Details

                      </button>

                      {canDecideRequest(item) && (

                        <>

                          <button
                            type="button"

                            disabled={isSubmitting}

                            onClick={() =>
                              openDirectDecision(
                                item,
                                'rejected'
                              )
                            }

                            className="
                              inline-flex h-9 min-w-[85px]
                              items-center justify-center
                              px-3 rounded-xl
                              bg-bad/15 border border-bad/30
                              text-bad hover:bg-bad/25
                              text-xs font-bold
                              disabled:opacity-50
                            "
                          >
                            Reject
                          </button>

                          <button
                            type="button"

                            disabled={isSubmitting}

                            onClick={() =>
                              openDirectDecision(
                                item,
                                'approved'
                              )
                            }

                            className="
                              inline-flex h-9 min-w-[85px]
                              items-center justify-center
                              px-3 rounded-xl
                              bg-accent text-on-accent
                              hover:brightness-105
                              text-xs font-bold shadow-sm
                              disabled:opacity-50
                            "
                          >
                            Approve
                          </button>

                        </>

                      )}

                      {item.reviewStage === 'hr-review' && (

                        <span className="
                          px-3 py-1.5 rounded-lg
                          text-xs font-medium text-info
                        ">
                          Awaiting HR
                        </span>

                      )}

                    </div>

                  </div>

                );
              })}

            </div>

          )}

          {/* PAGINATION */}

          <Pagination
            currentPage={safePage}

            totalPages={totalPages}

            totalItems={filteredLeaves.length}

            pageSize={PAGE_SIZE}

            onPageChange={setCurrentPage}
          />

        </div>

      )}

      {/* ====================================================
          EMPLOYEE LEAVE BALANCES
      ==================================================== */}

      {activeTab === 'balances' && (

        <div className="glass-card !p-4 space-y-3">

          <div className="
            flex flex-wrap items-center
            justify-between gap-3
            pb-3 border-b border-line/60
          ">

            <div>

              <h3 className="
                font-display font-semibold
                text-sm sm:text-base text-ink
              ">
                Team Leave Balances Roster
              </h3>

              

            </div>

            <span className="
              rounded-lg bg-surface2
              border border-line
              px-3 py-2 text-xs
              font-data text-accent
            ">
              FY {getFinancialYear()}
            </span>

          </div>

          

          <div className="overflow-x-auto">

            <table className="
              w-full min-w-[900px]
              text-left text-xs
              text-ink border-collapse
            ">

              <thead>

                <tr className="
                  border-b border-line/60
                  text-muted uppercase
                  tracking-wider text-[10.5px]
                ">

                  <th className="px-3 py-3">
                    Employee
                  </th>

                  <th className="px-3 py-3">
                    Designation
                  </th>

                  <th className="px-3 py-3 text-center">
                    Casual Leave (CL)
                  </th>

                  <th className="px-3 py-3 text-center">
                    Sick Leave (SL)
                  </th>

                  <th className="px-3 py-3 text-center">
                    Earned Leave (EL)
                  </th>

                  <th className="px-3 py-3 text-center">
                    Optional (RH)
                  </th>

                  <th className="px-3 py-3 text-center">
                    Unpaid Taken
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-line/40">

                {filteredBalanceMembers.length === 0 && (

                  <tr>

                    <td
                      colSpan={7}

                      className="
                        p-10 text-center text-muted
                      "
                    >
                      No employees found.
                    </td>

                  </tr>

                )}

                {filteredBalanceMembers.map(member => {

                  const balance =
                    member.leaveBalance || {};

                  const unpaid = getBalanceValue(
                    balance.unpaid
                  );

                  return (

                    <tr
                      key={getEmployeeId(member)}

                      className="
                        hover:bg-surface2/40 transition
                      "
                    >

                      <td className="px-3 py-4">

                        <div className="
                          flex items-center gap-2.5
                        ">

                          <Avatar
                            name={member.name}
                            size="sm"
                          />

                          <div>

                            <span className="
                              font-semibold
                              text-ink block
                              whitespace-nowrap
                            ">
                              {member.name}
                            </span>

                            <span className="
                              text-[10px] text-muted
                              font-data
                            ">
                              {getEmployeeId(member)}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td className="
                        px-3 py-4 text-muted
                      ">
                        {member.designation || '—'}
                      </td>

                      <td className="px-3 py-4 text-center">
                        <BalanceCell
                          balance={balance.casual}
                        />
                      </td>

                      <td className="px-3 py-4 text-center">
                        <BalanceCell
                          balance={balance.sick}
                        />
                      </td>

                      <td className="px-3 py-4 text-center">
                        <BalanceCell
                          balance={balance.earned}
                        />
                      </td>

                      <td className="px-3 py-4 text-center">
                        <BalanceCell
                          balance={balance.optional}
                        />
                      </td>

                      <td className="
                        px-3 py-4 text-center
                        text-muted font-data
                      ">

                        {unpaid === null
                          ? '—'
                          : `${unpaid} days`}

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

          <div className="
            pt-3 border-t border-line/50
            text-xs text-muted
          ">
            Showing {filteredBalanceMembers.length}{' '}
            of {authorizedMembers.length} employees
          </div>

        </div>

      )}

      {/* ====================================================
          TEAM LEAVE CALENDAR
      ==================================================== */}

      {activeTab === 'calendar' && (

        <div className="
          grid grid-cols-1 lg:grid-cols-3 gap-4 items-start
        ">

          {/* CALENDAR */}

          <div className="
            lg:col-span-2 glass-card !p-4 min-w-0 space-y-4
          ">

            <div className="
              flex flex-wrap items-center
              justify-between gap-3
              pb-3 border-b border-line/60
            ">

              <div>

                <h3 className="
                  font-display font-semibold
                  text-base text-ink
                ">
                  {monthTitle}
                </h3>

                <span className="text-xs text-muted">
                  Team Leave Calendar
                </span>

              </div>

              <div className="
                flex flex-wrap items-center gap-2
              ">

                <button
                  type="button"

                  aria-label="Previous month"

                  onClick={() =>
                    handleMonthChange(-1)
                  }

                  className="
                    p-2 rounded-lg bg-surface2
                    border border-line
                    hover:border-accent
                  "
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"

                  onClick={handleCalendarToday}

                  className="
                    px-3 py-2 rounded-lg
                    bg-surface2 border border-line
                    text-xs text-accent font-semibold
                  "
                >
                  Today
                </button>

                <button
                  type="button"

                  aria-label="Next month"

                  onClick={() =>
                    handleMonthChange(1)
                  }

                  className="
                    p-2 rounded-lg bg-surface2
                    border border-line
                    hover:border-accent
                  "
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* CALENDAR FILTER */}

            <div className="
              flex flex-wrap items-center
              justify-between gap-2
            ">

              <span className="text-xs text-muted">
                Display leave requests
              </span>

              <select
                aria-label="Calendar leave status"

                value={calendarFilter}

                onChange={event =>
                  setCalendarFilter(event.target.value)
                }

                className="
                  bg-surface2 border border-line
                  rounded-xl px-3 py-2
                  text-xs text-ink
                "
              >

                <option value="approved">
                  Approved Leaves
                </option>

                <option value="pending">
                  Pending Leaves
                </option>

                <option value="all">
                  Approved & Pending
                </option>

              </select>

            </div>

            {/* WEEK DAYS */}

            <div className="
              grid grid-cols-7 gap-1.5
              text-center text-[11px]
              font-medium uppercase
              tracking-wider text-muted
            ">

              {[
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sun'
              ].map((day, index) => (

                <div
                  key={day}

                  className={
                    index >= 5
                      ? 'text-warn'
                      : ''
                  }
                >
                  {day}
                </div>

              ))}

            </div>

            {/* CALENDAR DATES */}

            <div className="
              grid grid-cols-7 gap-1.5
            ">

              {Array.from({
                length: firstDayOffset
              }).map((_, index) => (

                <div
                  key={`blank-${index}`}
                  className="min-h-[72px]"
                />

              ))}

              {Array.from({
                length: daysInMonth
              }).map((_, index) => {

                const day = index + 1;

                const dateKey = getLocalDateKey(
                  new Date(
                    calendarYear,
                    calendarMonth,
                    day
                  )
                );

                const dayLeaves =
                  calendarLeaves[dateKey] || [];

                const approvedCount =
                  dayLeaves.filter(
                    request =>
                      request.status === 'approved'
                  ).length;

                const pendingCount =
                  dayLeaves.filter(
                    request =>
                      request.status === 'pending'
                  ).length;

                const isSelected =
                  selectedCalendarDate === dateKey;

                const isToday =
                  dateKey === today;

                const isWeekend =
                  (
                    firstDayOffset + index
                  ) % 7 >= 5;

                return (

                  <button
                    key={dateKey}
                    type="button"

                    aria-label={`Leave calendar for ${dateKey}`}

                    aria-pressed={isSelected}

                    onClick={() =>
                      setSelectedCalendarDate(dateKey)
                    }

                    className={`
                      min-h-[82px] min-w-0 p-2
                      rounded-xl border text-left
                      flex flex-col justify-between
                      gap-1 transition

                      ${isSelected
                        ? 'bg-surface2 border-accent shadow-sm'
                        : isToday
                          ? 'bg-surface2/70 border-accent/40'
                          : isWeekend
                            ? 'bg-surface2/40 border-line/30'
                            : 'bg-surface2/50 border-line/50 hover:border-accent/40'}
                    `}
                  >

                    <span className={`
                      text-xs font-data font-semibold

                      ${isToday
                        ? 'text-accent'
                        : 'text-ink'}
                    `}>
                      {day}
                    </span>

                    <div className="
                      space-y-1 text-[9px]
                    ">

                      {approvedCount > 0 && (

                        <div className="text-good">

                          {approvedCount} Approved

                        </div>

                      )}

                      {pendingCount > 0 && (

                        <div className="text-warn">

                          {pendingCount} Pending

                        </div>

                      )}

                      {dayLeaves.length === 0 && (

                        <span className="text-muted">

                          {isWeekend
                            ? 'Weekend'
                            : '—'}

                        </span>

                      )}

                    </div>

                  </button>

                );
              })}

            </div>

            {/* CALENDAR LEGEND */}

            <div className="
              flex flex-wrap items-center
              gap-4 pt-3 mt-2
              border-t border-line/60
              text-xs text-muted
            ">

              <span className="
                flex items-center gap-1.5
              ">

                <span className="
                  w-2.5 h-2.5 rounded-full bg-good
                " />

                Approved

              </span>

              <span className="
                flex items-center gap-1.5
              ">

                <span className="
                  w-2.5 h-2.5 rounded-full bg-warn
                " />

                Pending

              </span>

            </div>

          </div>

          {/* SELECTED DATE LEAVE DETAILS */}

          <div className="glass-card !p-4 min-w-0 space-y-4">

            <div className="
              pb-3 border-b border-line/60
            ">

              <h3 className="
                font-display font-semibold
                text-base text-ink
              ">
                {safeFormatDate(
                  selectedCalendarDate
                )}
              </h3>

              <span className="text-xs text-muted">
                Selected Date Leave Summary
              </span>

            </div>

            <div className="
              p-3 rounded-xl bg-surface2/50
              border border-line/50 space-y-2
            ">

              <div className="
                flex items-center justify-between
                gap-2
              ">

                <span className="text-xs text-muted">
                  Employees with leave requests
                </span>

                <Users className="
                  w-4 h-4 text-accent
                " />

              </div>

              <div className="
                font-data text-2xl
                font-bold text-ink
              ">
                {selectedDayEmployeeCount}
              </div>

              <div className="text-xs text-muted">

                {selectedDayLeaves.filter(
                  request =>
                    request.status === 'approved'
                ).length}{' '}

                Approved ·{' '}

                {selectedDayLeaves.filter(
                  request =>
                    request.status === 'pending'
                ).length}{' '}

                Pending

              </div>

            </div>

            {/* SELECTED DATE REQUESTS */}

            <div className="
              max-h-[400px] overflow-y-auto
              space-y-2
            ">

              {selectedDayLeaves.length === 0 ? (

                <div className="
                  py-8 text-center
                  text-xs text-muted space-y-2
                ">

                  <Calendar className="
                    w-7 h-7 mx-auto
                  " />

                  <p>
                    No matching leave requests
                    for this date.
                  </p>

                </div>

              ) : (

                selectedDayLeaves.map(request => (

                  <button
                    key={request.id}
                    type="button"

                    onClick={() =>
                      openDetails(request)
                    }

                    className="
                      w-full rounded-xl
                      bg-surface2/40
                      border border-line/50
                      hover:border-accent/40
                      p-3 text-left
                      flex items-center gap-2.5
                    "
                  >

                    <Avatar
                      name={request.employeeName}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">

                      <span className="
                        block truncate
                        text-xs font-medium text-ink
                      ">
                        {request.employeeName}
                      </span>

                      <span className="
                        block text-[11px]
                        text-muted mt-1
                      ">
                        {request.requestType}
                      </span>

                      <span className="
                        block text-[10px]
                        text-muted mt-1
                      ">
                        {getReviewStageLabel(
                          request.reviewStage
                        )}
                      </span>

                    </div>

                    <StatusBadge
                      status={request.status}
                    />

                  </button>

                ))

              )}

            </div>

            <button
              type="button"

              onClick={() => {

                setActiveTab('requests');

                setStatusFilter('all');

                setLeaveTypeFilter('All');

                setSearchTerm('');
              }}

              className="
                w-full py-2 mt-auto
                rounded-xl bg-surface2
                border border-line
                hover:border-accent
                text-xs font-semibold text-ink
              "
            >
              View All Leave Requests
            </button>

          </div>

        </div>

      )}

      {/* ====================================================
          LEAVE REQUEST DETAILS MODAL
      ==================================================== */}

      <LeaveRequestDetailsModal

        isOpen={
          isDetailsOpen &&
          Boolean(selectedRequest)
        }

        request={selectedRequest}

        isSubmitting={isSubmitting}

        onClose={closeDetails}

        onApprove={(id, comment) =>
          handleLeaveDecision(
            id,
            'approved',
            comment
          )
        }

        onReject={(id, comment) =>
          handleLeaveDecision(
            id,
            'rejected',
            comment
          )
        }

      />

      {/* ====================================================
          APPROVAL COMMENT MODAL
      ==================================================== */}

      <ApprovalCommentModal

        isOpen={Boolean(directDecision)}

        approval={
          directDecision?.approval
        }

        action={
          directDecision?.action
        }

        isSubmitting={isSubmitting}

        onClose={() => {

          if (!decisionLock.current) {
            setDirectDecision(null);
          }

        }}

        onConfirm={comment => {

          if (!directDecision) {
            throw new Error(
              'No leave request selected.'
            );
          }

          return handleLeaveDecision(
            directDecision.approval.id,
            directDecision.action,
            comment
          );

        }}

      />

    </div>
  );
};

export default LeaveManagement;