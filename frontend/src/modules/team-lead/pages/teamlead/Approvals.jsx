
import React, {
  useState,
  useMemo,
  useEffect,
  useRef
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';

import {
  canManageApprovals,
  userIdOf
} from '../../utils/dataScope.js';

import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';

import {
  RequestDetailsModal
} from '../../components/modals/RequestDetailsModal.jsx';

import {
  formatDate,
  formatDateRange
} from '../../utils/helpers.js';

import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Clock,
  Briefcase,
  Home,
  FileCheck,
  AlertCircle,
  LoaderCircle
} from 'lucide-react';

// ============================================================
// APPROVAL CONFIGURATION
// ============================================================

const PAGE_SIZE = 6;

const CATEGORIES = [
  'All',
  'Leave Approval',
  'Attendance Regularization',
  'Work From Home Requests',
  'Task Approval',
  'Timesheet Approval'
];

const CATEGORY_ICONS = {
  'Leave Approval': Calendar,
  'Attendance Regularization': Clock,
  'Work From Home Requests': Home,
  'Task Approval': CheckCircle,
  'Timesheet Approval': Briefcase
};

const safeArray = value =>
  Array.isArray(value) ? value : [];

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const sameId = (first, second) =>
  Boolean(normalize(first)) &&
  normalize(first) === normalize(second);

const getStatus = item =>
  normalize(item?.status);

const getComments = item =>
  Array.isArray(item?.comments)
    ? item.comments
    : typeof item?.comments === 'string' &&
      item.comments.trim()
      ? [item.comments]
      : [];

const MODULE_CONFIG = {

  'Attendance Regularization': {

    title: 'Attendance Regularization',

    description:
      'Review and manage attendance correction requests submitted by your team members.',

    icon: Clock,

    totalLabel: 'Total Requests',

    pendingLabel: 'Pending Requests',

    approvedLabel: 'Approved Requests',

    rejectedLabel: 'Rejected Requests',

    searchPlaceholder:
      'Search employee, attendance date or correction reason...',

    emptyMessage:
      'No attendance regularization requests match your filters.'

  },

  'Timesheet Approval': {

    title: 'Timesheet Approval',

    description:
      'Review submitted timesheet approval requests from your authorized team.',

    icon: Briefcase,

    totalLabel: 'Total Timesheets',

    pendingLabel: 'Pending Timesheets',

    approvedLabel: 'Approved Timesheets',

    rejectedLabel: 'Rejected Timesheets',

    searchPlaceholder:
      'Search employee, timesheet or request details...',

    emptyMessage:
      'No submitted timesheet requests match your filters.'

  }

};

// ============================================================
// COMMON APPROVAL WORKSPACE
// ============================================================

const ApprovalWorkspace = ({
  fixedCategory = null
}) => {

  const {
    currentUser,
    approvals,
    decideApproval,
    globalSearchTerm,
    triggerToast,
    setGlobalSearchTerm
  } = useTeamLead();

  const config =
    MODULE_CONFIG[fixedCategory] || null;

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('pending');

  const [categoryFilter, setCategoryFilter] =
    useState('All');

  const [requestTypeFilter, setRequestTypeFilter] =
    useState('');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedRequestId, setSelectedRequestId] =
    useState(null);

  const [isDetailsOpen, setIsDetailsOpen] =
    useState(false);

  const [processingIds, setProcessingIds] =
    useState([]);

  const processingRef = useRef(new Set());

  const mountedRef = useRef(true);

  useEffect(() => {

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };

  }, []);

  const currentUserIds = [

    currentUser?.id,

    currentUser?.employeeId,

    currentUser?.userId,

    userIdOf(currentUser)

  ].map(normalize).filter(Boolean);

  const hasApprovalPermission =
    canManageApprovals(currentUser);

  // ==========================================================
  // MODULE DATA SCOPE
  // ==========================================================

  const moduleApprovals = useMemo(() => {

    const records =
      safeArray(approvals)
        .filter(Boolean)
        .sort((first, second) => {

          const firstTime = Date.parse(
            first.requestDate ||
            first.submittedAt ||
            ''
          ) || 0;

          const secondTime = Date.parse(
            second.requestDate ||
            second.submittedAt ||
            ''
          ) || 0;

          return secondTime - firstTime;
        });

    return fixedCategory

      ? records.filter(
          item => item.category === fixedCategory
        )

      : records;

  }, [approvals, fixedCategory]);

  // ==========================================================
  // REVIEW PERMISSIONS
  // ==========================================================

  const canReviewRequest = item => {

    if (!item || !hasApprovalPermission) {
      return false;
    }

    if (
      !normalize(item.employeeId) ||
      currentUserIds.includes(
        normalize(item.employeeId)
      )
    ) {
      return false;
    }

    if (getStatus(item) !== 'pending') {
      return false;
    }

    if (item.category === 'Leave Approval') {

      const teamLeadStatus = normalize(
        item.teamLeadApproval ??
        item.managerApprovalStatus ??
        'pending'
      );

      const hrStatus = normalize(
        item.hrApproval ??
        item.hrApprovalStatus ??
        'pending'
      );

      if (
        teamLeadStatus !== 'pending' ||
        hrStatus === 'rejected' ||
        hrStatus === 'approved'
      ) {
        return false;
      }

      if (
        item.reviewStage &&
        item.reviewStage !== 'team-lead-review'
      ) {
        return false;
      }

    }

    return true;

  };

  // ==========================================================
  // KPI CALCULATIONS
  // ==========================================================

  const summary = useMemo(() => ({

    total: moduleApprovals.length,

    pending: moduleApprovals.filter(
      item => getStatus(item) === 'pending'
    ).length,

    approved: moduleApprovals.filter(
      item => getStatus(item) === 'approved'
    ).length,

    rejected: moduleApprovals.filter(
      item => getStatus(item) === 'rejected'
    ).length

  }), [moduleApprovals]);

  const cards = [

    {
      key: 'all',
      label: config?.totalLabel || 'All Requests',
      value: summary.total,
      color: 'text-ink',
      activeBorder: 'border-accent',
      icon: FileCheck
    },

    {
      key: 'pending',
      label: config?.pendingLabel || 'Pending Approvals',
      value: summary.pending,
      color: 'text-warn',
      activeBorder: 'border-warn',
      icon: Clock
    },

    {
      key: 'approved',
      label: config?.approvedLabel || 'Approved',
      value: summary.approved,
      color: 'text-good',
      activeBorder: 'border-good',
      icon: CheckCircle
    },

    {
      key: 'rejected',
      label: config?.rejectedLabel || 'Rejected',
      value: summary.rejected,
      color: 'text-bad',
      activeBorder: 'border-bad',
      icon: XCircle
    }

  ];

  // ==========================================================
  // SEARCH AND FILTERS
  // ==========================================================

  const effectiveSearch = normalize(
    searchTerm || globalSearchTerm
  );

  const requestTypeOptions = useMemo(() => {

    return [...new Set(
      moduleApprovals
        .filter(item =>
          fixedCategory ||
          categoryFilter === 'All' ||
          item.category === categoryFilter
        )
        .map(item => item.requestType)
        .filter(Boolean)
    )].sort((a, b) => String(a).localeCompare(String(b)));

  }, [moduleApprovals, categoryFilter, fixedCategory]);

  const invalidDateRange = Boolean(
    fromDate &&
    toDate &&
    fromDate > toDate
  );

  const filteredApprovals = useMemo(() => {

    if (invalidDateRange) {
      return [];
    }


    return moduleApprovals.filter(item => {

      const searchableText = [

        item.id,

        item.employeeName,

        item.employeeId,

        item.requestType,

        item.reason,

        item.category,

        item.department,

        item.fromDate,

        item.toDate,

        item.requestDate,

        item.attendanceDate,

        item.timesheetDate,

        item.projectName

      ].map(normalize).join(' ');

      const matchSearch =
        searchableText.includes(effectiveSearch);

      const matchStatus =
        statusFilter === 'all' ||
        getStatus(item) === statusFilter;

      const matchCategory =
        fixedCategory ||
        categoryFilter === 'All' ||
        item.category === categoryFilter;

      const matchRequestType =
        !requestTypeFilter ||
        item.requestType === requestTypeFilter;

      const requestDate =
        String(item.requestDate || '').slice(0, 10);

      const validRequestDate =
        /^\d{4}-\d{2}-\d{2}$/.test(requestDate);

      const matchDate =
        (!fromDate && !toDate) ||
        (
          validRequestDate &&
          (!fromDate || requestDate >= fromDate) &&
          (!toDate || requestDate <= toDate)
        );

      return (
        matchSearch &&
        matchStatus &&
        Boolean(matchCategory) &&
        matchRequestType &&
        matchDate
      );

    });

  }, [
    moduleApprovals,
    effectiveSearch,
    statusFilter,
    categoryFilter,
    fixedCategory,
    requestTypeFilter,
    fromDate,
    toDate,
    invalidDateRange
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredApprovals.length / PAGE_SIZE
    )
  );

  const activePage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedData = useMemo(() => {

    const start =
      (activePage - 1) * PAGE_SIZE;

    return filteredApprovals.slice(
      start,
      start + PAGE_SIZE
    );

  }, [filteredApprovals, activePage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    effectiveSearch,
    categoryFilter,
    statusFilter,
    requestTypeFilter,
    fromDate,
    toDate
  ]);

  useEffect(() => {

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

  }, [currentPage, totalPages]);

  // ==========================================================
  // REQUEST DETAILS
  // Always use the latest context record.
  // ==========================================================

  const selectedRequest = moduleApprovals.find(
    item => sameId(item.id, selectedRequestId)
  ) || null;

  useEffect(() => {

    if (
      isDetailsOpen &&
      !selectedRequest
    ) {
      setIsDetailsOpen(false);
      setSelectedRequestId(null);
    }

  }, [selectedRequest, isDetailsOpen]);

  const openRequestDetails = item => {

    setSelectedRequestId(item.id);

    setIsDetailsOpen(true);

  };

  const closeRequestDetails = () => {

    if (
      selectedRequestId &&
      processingRef.current.has(
        String(selectedRequestId)
      )
    ) {
      return;
    }

    setIsDetailsOpen(false);

    setSelectedRequestId(null);

  };

  // ==========================================================
  // APPROVAL DECISION
  // ==========================================================

  const handleDecision = async (
    id,
    decision,
    comment = ''
  ) => {

    const request = moduleApprovals.find(
      item => sameId(item.id, id)
    );

    if (!request || !canReviewRequest(request)) {
      throw new Error(
        'This request cannot be reviewed by the current account.'
      );
    }

    const normalizedDecision =
      normalize(decision);

    if (
      !['approved', 'rejected', 'correction-required'].includes(
        normalizedDecision
      )
    ) {
      throw new Error(
        'Invalid approval decision.'
      );
    }

    const cleanComment =
      String(comment || '').trim();

    if (!cleanComment) {

      throw new Error(

        normalizedDecision === 'rejected'

          ? 'A rejection reason is required.'

          : 'An approval comment is required.'

      );

    }

    if (cleanComment.length > 300) {
      throw new Error(
        'Comments cannot exceed 300 characters.'
      );
    }

    const lockKey = String(id);

    if (
      processingRef.current.has(lockKey)
    ) {
      throw new Error(
        'This request is already being processed.'
      );
    }

    processingRef.current.add(lockKey);

    setProcessingIds(previous => [

      ...previous,

      lockKey

    ]);

    try {

      const result = await decideApproval(

        id,

        normalizedDecision,

        cleanComment,

        {
          allowEmptyComment: false
        }

      );

      if (
        !result ||
        result.success === false
      ) {

        throw new Error(

          result?.message ||
          'Unable to process this request.'

        );

      }

      if (mountedRef.current) {

        setIsDetailsOpen(false);

        setSelectedRequestId(null);

      }

      return result;

    } catch (error) {

      if (mountedRef.current) {

        triggerToast(

          error?.message ||
          'Unable to process approval.',

          'error'

        );

      }

      throw error;

    } finally {

      processingRef.current.delete(lockKey);

      if (mountedRef.current) {

        setProcessingIds(previous =>
          previous.filter(
            itemId => itemId !== lockKey
          )
        );

      }

    }

  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {

    setSearchTerm('');

    setStatusFilter('all');

    setCategoryFilter('All');
    setRequestTypeFilter('');
    setFromDate('');
    setToDate('');

    setCurrentPage(1);

    setGlobalSearchTerm?.('');

  };

  

  // ==========================================================
  // MODULE UI
  // ==========================================================

  return (

    <div className="space-y-4">

      {/* KPI CARDS */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {cards.map(card => {

          const Icon = card.icon;

          const active =
            statusFilter === card.key;

          return (

            <button
              key={card.key}
              type="button"
              aria-pressed={active}
              onClick={() => {

                setStatusFilter(card.key);

                setCurrentPage(1);

              }}
              className={`
                glass-card kpi-card
                !h-[140px] !p-5
                flex flex-col justify-between
                text-left cursor-pointer transition
                ${active ? card.activeBorder : ''}
              `}
            >

              <div className="flex items-start justify-between gap-2">

                <span className={`
                  text-xs font-medium
                  uppercase tracking-wider
                  ${card.key === 'all'
                    ? 'text-muted'
                    : card.color}
                `}>

                  {card.label}

                </span>

                <Icon
                  size={18}
                  className={`${card.color} shrink-0`}
                />

              </div>

              <div className={`
                text-2xl font-display
                font-bold mt-1
                ${card.color}
              `}>

                {card.value}

              </div>

            </button>

          );

        })}

      </div>

      {/* FILTER TOOLBAR */}

      <section className="glass-card !p-4 !flex !flex-col !items-stretch !gap-4">

        <div className="flex items-center justify-between gap-3">

          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">

            <Filter className="h-4 w-4 text-accent"/>

            Request Filters

          </h2>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center rounded-xl border border-line bg-surface2 px-3 text-xs font-semibold text-muted hover:text-accent"
          >
            Reset Filters
          </button>

        </div>

        <div className={
          fixedCategory
            ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
            : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]'
        }>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Search Requests
            </span>

            <div className="relative">

              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>

              <input
                type="search"
                value={searchTerm}
                aria-label="Search approval requests"
                placeholder="Search employee, ID or request type"
                onChange={event => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface2 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
              />

            </div>

          </label>

          {!fixedCategory && (

            <label className="min-w-0 space-y-2">

              <span className="block text-xs font-semibold text-muted">
                Category
              </span>

              <select
                value={categoryFilter}
                onChange={event => {
                  setCategoryFilter(event.target.value);
                  setRequestTypeFilter('');
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
              >

                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category === 'All'
                      ? 'All Categories'
                      : category}
                  </option>
                ))}

              </select>

            </label>

          )}

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            >

              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>

              {(!fixedCategory ||
                fixedCategory === 'Timesheet Approval') && (
                <option value="correction-required">
                  Correction Required
                </option>
              )}

            </select>

          </label>

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Request Type
            </span>

            <select
              value={requestTypeFilter}
              onChange={event => {
                setRequestTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            >

              <option value="">All Request Types</option>

              {requestTypeOptions.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}

            </select>

          </label>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Request From Date
            </span>

            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={event => {
                setFromDate(event.target.value);
                setCurrentPage(1);
              }}
              style={{ colorScheme: 'dark' }}
              className="h-11 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            />

          </label>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Request To Date
            </span>

            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={event => {
                setToDate(event.target.value);
                setCurrentPage(1);
              }}
              style={{ colorScheme: 'dark' }}
              className="h-11 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            />

          </label>

        </div>

        {invalidDateRange && (
          <p role="alert" className="text-xs text-bad">
            From Date cannot be after To Date.
          </p>
        )}

      </section>
{/* REQUEST LIST */}

      <div className="glass-card !p-4 space-y-3">

        <div className="
          flex flex-wrap items-center
          justify-between gap-2
          pb-3 border-b border-line/60
        ">

          <h3 className="
            font-display font-semibold
            text-sm sm:text-base text-ink
          ">

            {statusFilter === 'all'

              ? 'All Request Log'

              : statusFilter === 'pending'

                ? 'Pending Approval Queue'

                : `${statusFilter.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Requests`}

          </h3>

          <span className="text-xs text-muted">

            Found{' '}

            <strong className="text-ink">

              {filteredApprovals.length}

            </strong>

            {' '}matching requests

          </span>

        </div>

        {/* EMPTY STATE */}

        {paginatedData.length === 0 ? (

          <div className="
            p-12 text-center
            text-muted text-xs space-y-3
          ">

            <AlertCircle className="
              w-8 h-8 mx-auto
              text-muted/60
            "/>

            <p>

              {config?.emptyMessage ||
                'No requests found matching your filter criteria.'}

            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="
                text-accent underline
                font-semibold
              "
            >

              Reset all filters

            </button>

          </div>

        ) : (

          <div className="space-y-3">

            {paginatedData.map(item => {

              const CategoryIcon =
                CATEGORY_ICONS[item.category] ||
                FileCheck;

              const isProcessing =
                processingIds.includes(
                  String(item.id)
                );

              const canReview =
                canReviewRequest(item);

              const comments =
                getComments(item);

              const teamLeadStatus =
                item.teamLeadApproval ??
                item.managerApprovalStatus ??
                'Pending';

              const hrStatus =
                item.hrApproval ??
                item.hrApprovalStatus ??
                'Pending';

              const isOwnRequest =
                currentUserIds.includes(
                  normalize(item.employeeId)
                );

              const getStageColor = status =>

                normalize(status) === 'approved'

                  ? 'text-good'

                  : normalize(status) === 'rejected'

                    ? 'text-bad'

                    : 'text-warn';

              return (

                <div
                  key={item.id}
                  className="
                    p-3.5 rounded-2xl
                    bg-surface2/50
                    border border-line/50
                    hover:border-accent/40
                    transition grid grid-cols-1
                    lg:grid-cols-[minmax(0,1fr)_auto]
                    lg:items-start gap-4
                  "
                >

                  {/* EMPLOYEE AND REQUEST DETAILS */}

                  <div className="
                    flex items-start gap-3
                    min-w-0 flex-1
                  ">

                    <Avatar
                      name={
                        item.employeeName ||
                        'Employee'
                      }
                      size="md"
                    />

                    <div className="min-w-0 flex-1">

                      <div className="
                        flex items-center
                        gap-2 flex-wrap
                      ">

                        <span className="
                          font-semibold text-ink text-sm
                        ">

                          {item.employeeName ||
                            'Employee'}

                        </span>

                        <span className="
                          text-[10px] text-muted
                          font-data px-1.5 py-0.5
                          rounded bg-surface
                          border border-line
                        ">

                          {item.employeeId || 'N/A'}

                        </span>

                        <span className="
                          inline-flex items-center
                          gap-1 text-[11px]
                          text-accent font-medium
                        ">

                          <CategoryIcon className="
                            w-3 h-3 text-accent
                          "/>

                          {item.category}

                        </span>

                        <StatusBadge
                          status={getStatus(item)}
                        />

                      </div>

                      <div className="
                        text-xs font-semibold
                        text-ink mt-1
                      ">

                        {item.requestType ||
                          item.category}

                        {Number(item.totalDays) > 0 && (

                          <span className="
                            text-muted
                            font-normal ml-1
                          ">

                            ({item.totalDays}{' '}

                            {Number(item.totalDays) === 1
                              ? 'day'
                              : 'days'}

                            {item.fromDate &&
                              item.toDate && (

                                <>

                                  {' \u00B7 '}

                                  {formatDateRange(
                                    item.fromDate,
                                    item.toDate
                                  )}

                                </>

                              )}

                            )

                          </span>

                        )}

                      </div>

                      {/* REQUEST REASON */}

                      <p className="
                        text-xs text-muted
                        mt-1 leading-snug
                        line-clamp-2 max-w-3xl
                        break-words
                      ">

                        {item.reason ||
                          'No request description provided.'}

                      </p>

                      {/* ATTENDANCE REQUEST DATE */}

                      {item.category ===
                        'Attendance Regularization' &&
                        (item.attendanceDate ||
                          item.fromDate) && (

                          <div className="
                            mt-2 inline-flex items-center
                            gap-1.5 rounded-lg
                            bg-surface px-2 py-1
                            text-[11px] text-muted
                          ">

                            <Calendar size={13}/>

                            Attendance date:{' '}

                            {formatDate(
                              item.attendanceDate ||
                              item.fromDate
                            )}

                          </div>

                        )}

                      {/* TIMESHEET PERIOD */}

                      {item.category ===
                        'Timesheet Approval' &&
                        item.fromDate &&
                        item.toDate && (

                          <div className="
                            mt-2 inline-flex items-center
                            gap-1.5 rounded-lg
                            bg-surface px-2 py-1
                            text-[11px] text-muted
                          ">

                            <Calendar size={13}/>

                            {formatDateRange(
                              item.fromDate,
                              item.toDate
                            )}

                          </div>

                        )}

                      {/* LEAVE APPROVAL STAGES */}

                      {item.category === 'Leave Approval' && (

                        <div className="
                          mt-2 flex flex-wrap
                          gap-1.5 text-[10px]
                        ">

                          <span className="
                            rounded-full bg-surface
                            px-2 py-1 text-muted
                          ">

                            Team Lead:{' '}

                            <strong className={
                              getStageColor(
                                teamLeadStatus
                              )
                            }>

                              {teamLeadStatus}

                            </strong>

                          </span>

                          <span className="
                            rounded-full bg-surface
                            px-2 py-1 text-muted
                          ">

                            HR:{' '}

                            <strong className={
                              getStageColor(hrStatus)
                            }>

                              {hrStatus}

                            </strong>

                          </span>

                        </div>

                      )}

                      {/* REQUEST META */}

                      <div className="
                        text-[11px] text-muted/80
                        mt-1.5 flex flex-wrap
                        items-center gap-2
                      ">

                        <span>

                          Requested on{' '}

                          {item.requestDate

                            ? formatDate(
                                item.requestDate
                              )

                            : 'Date unavailable'}

                        </span>

                        {comments.length > 0 && (

                          <span className="
                            text-accent font-medium
                          ">

                            {'\u00B7 '}

                            {comments.length}{' '}

                            {comments.length === 1
                              ? 'comment'
                              : 'comments'}

                          </span>

                        )}

                      </div>

                      {isOwnRequest && (

                        <p className="
                          mt-2 text-[11px] text-warn
                        ">

                          Personal request - self-approval
                          is not permitted.

                        </p>

                      )}

                      {item.decidedBy?.name && (

                        <p className="
                          mt-1 text-[11px] text-muted
                        ">

                          Reviewed by{' '}

                          {item.decidedBy.name}

                        </p>

                      )}

                    </div>

                  </div>

                  {/* REQUEST ACTIONS */}

                  <div className="
                    flex flex-wrap items-center
                    justify-start lg:justify-end
                    gap-2 self-center
                  ">

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        openRequestDetails(item)
                      }
                      className="
                        min-h-9 px-3 py-2 rounded-xl
                        bg-surface2 border border-line
                        text-ink hover:border-accent
                        text-xs font-semibold
                        flex items-center gap-1.5
                        transition disabled:opacity-60
                      "
                    >

                      <Eye className="
                        w-3.5 h-3.5 text-accent
                      "/>

                      View Details

                    </button>

                    {canReview && (

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          openRequestDetails(item)
                        }
                        className="
                          min-h-9 px-3 py-2 rounded-xl
                          bg-accent text-on-accent
                          hover:brightness-105
                          text-xs font-bold
                          flex items-center gap-1.5
                          transition shadow-sm
                          disabled:cursor-wait
                          disabled:opacity-60
                        "
                      >

                        {isProcessing ? (

                          <LoaderCircle className="
                            w-3.5 h-3.5 animate-spin
                          "/>

                        ) : (

                          <CheckCircle className="
                            w-3.5 h-3.5
                          "/>

                        )}

                        {isProcessing
                          ? 'Saving...'
                          : 'Review Request'}

                      </button>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

        {/* PAGINATION */}

        <Pagination

          currentPage={activePage}

          totalPages={totalPages}

          totalItems={filteredApprovals.length}

          pageSize={PAGE_SIZE}

          onPageChange={page => {

            const nextPage =
              Number(page) || 1;

            setCurrentPage(

              Math.min(
                totalPages,
                Math.max(1, nextPage)
              )

            );

          }}

        />

      </div>

      {/* REQUEST DETAILS MODAL */}

      {isDetailsOpen && selectedRequest && (

        <RequestDetailsModal

          key={String(selectedRequest.id)}

          isOpen={true}

          request={selectedRequest}

          onClose={closeRequestDetails}

          onApprove={(id, comment) =>
            handleDecision(
              id,
              'approved',
              comment
            )
          }

          onReject={(id, comment) =>
            handleDecision(
              id,
              'rejected',
              comment
            )
          }

          onRequestCorrection={
            selectedRequest.category === 'Timesheet Approval'
              ? (id, comment) =>
                  handleDecision(
                    id,
                    'correction-required',
                    comment
                  )
              : undefined
          }

          requireComment={true}

          readOnly={
            !canReviewRequest(selectedRequest)
          }

        />

      )}

    </div>

  );

};

// ============================================================
// ACCOUNT AND MODULE ISOLATION
// ============================================================

export const Approvals = ({
  fixedCategory = null
}) => {

  const { currentUser } = useTeamLead();

  const accountKey =
    userIdOf(currentUser) || 'unknown';

  return (

    <ApprovalWorkspace

      key={`${accountKey}:${fixedCategory || 'all'}`}

      fixedCategory={fixedCategory}

    />

  );

};

// ============================================================
// DEDICATED MODULE EXPORTS
// ============================================================

export const AttendanceRegularization = () => (

  <Approvals
    fixedCategory="Attendance Regularization"
  />

);

export const TimesheetApproval = () => (

  <Approvals
    fixedCategory="Timesheet Approval"
  />

);

export default Approvals;
