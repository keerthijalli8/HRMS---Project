import React, {
  useEffect,
  useState,
  useRef
} from 'react';

import {
  Calendar,
  Check,
  Clock,
  MessageSquare,
  X,
  XCircle,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';

import { ModalPortal } from '../common/ModalPortal.jsx';
import { StatusBadge } from '../common/StatusBadge.jsx';

import {
  formatDate,
  formatDateRange
} from '../../utils/helpers.js';

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_COMMENT_LENGTH = 300;

// ============================================================
// APPROVAL STATUS HELPERS
// ============================================================

const normalizeApproval = value => {
  const normalized = String(
    value || 'pending'
  ).trim().toLowerCase();

  if (normalized === 'approved') {
    return 'approved';
  }

  if (normalized === 'rejected') {
    return 'rejected';
  }

  return 'pending';
};

const formatApprovalState = state => {
  const normalized = normalizeApproval(state);

  if (normalized === 'approved') {
    return 'Approved';
  }

  if (normalized === 'rejected') {
    return 'Rejected';
  }

  return 'Pending';
};

const getLeaveStatus = (
  teamLeadApproval,
  hrApproval
) => {
  const teamLead = normalizeApproval(
    teamLeadApproval
  );

  const hr = normalizeApproval(
    hrApproval
  );

  if (
    teamLead === 'rejected' ||
    hr === 'rejected'
  ) {
    return 'rejected';
  }

  if (
    teamLead === 'approved' &&
    hr === 'approved'
  ) {
    return 'approved';
  }

  return 'pending';
};

const getApprovalStage = (
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

  if (
    normalizeApproval(teamLeadApproval) ===
    'approved'
  ) {
    return 'hr-review';
  }

  return 'team-lead-review';
};

const getStatusLabel = stage => {
  switch (stage) {

    case 'approved':
      return 'Approved';

    case 'rejected':
      return 'Rejected';

    case 'hr-review':
      return 'Pending HR Approval';

    default:
      return 'Pending Team Lead Review';
  }
};

const getStatusDescription = stage => {
  switch (stage) {

    case 'approved':
      return 'Both Team Lead and HR have approved this leave request.';

    case 'rejected':
      return 'This leave request has been rejected.';

    case 'hr-review':
      return 'Team Lead approval is complete. Awaiting HR approval.';

    default:
      return 'This request is awaiting Team Lead review.';
  }
};

const getStatusColor = status => {
  switch (
    String(status).toLowerCase()
  ) {

    case 'approved':
      return 'text-emerald-300';

    case 'rejected':
      return 'text-rose-300';

    default:
      return 'text-amber-200';
  }
};

const getBadgeClass = status => {
  switch (
    String(status).toLowerCase()
  ) {

    case 'approved':
      return 'bg-emerald-400/15 text-emerald-300';

    case 'rejected':
      return 'bg-rose-400/15 text-rose-300';

    case 'not required':
    case 'not started':
      return 'bg-white/5 text-slate-400';

    default:
      return 'bg-amber-400/15 text-amber-200';
  }
};

// ============================================================
// DATE VALIDATION
// ============================================================

const normalizeDateKey = value => {
  const text = String(
    value || ''
  ).slice(0, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {
    return '';
  }

  const [year, month, day] =
    text.split('-').map(Number);

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
    return '';
  }

  return text;
};

const hasValidDateRange = (
  fromDate,
  toDate
) => {
  const start =
    normalizeDateKey(fromDate);

  const end =
    normalizeDateKey(toDate);

  return Boolean(
    start &&
    end &&
    start <= end
  );
};

const safeFormatDate = value => {
  if (!value) {
    return 'Not Available';
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Not Available';
  }

  try {
    return formatDate(value);
  } catch {
    return 'Not Available';
  }
};

const safeFormatDateRange = (
  fromDate,
  toDate
) => {
  if (
    !hasValidDateRange(
      fromDate,
      toDate
    )
  ) {
    return 'Invalid date range';
  }

  try {
    return formatDateRange(
      fromDate,
      toDate
    );
  } catch {
    return 'Date range unavailable';
  }
};

const getValidLeaveDays = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const days = Number(value);

  return Number.isFinite(days) && days > 0
    ? days
    : null;
};

// ============================================================
// COMMENT HELPERS
// ============================================================

const getCommentText = entry => {
  if (typeof entry === 'string') {
    return entry;
  }

  const text =
    entry?.text ||
    entry?.comment ||
    entry?.message ||
    entry?.reason;

  return typeof text === 'string'
    ? text
    : 'Decision recorded';
};

const getCommentAuthor = entry => {
  if (
    !entry ||
    typeof entry !== 'object'
  ) {
    return '';
  }

  const author =
    entry.author?.name ||
    entry.author ||
    entry.by?.name ||
    entry.by ||
    entry.userName ||
    entry.decidedBy?.name;

  return typeof author === 'string'
    ? author
    : '';
};

// ============================================================
// WORKFLOW TIMELINE ITEM
// ============================================================

const WorkflowItem = ({
  title,
  description,
  status,
  isLast = false
}) => {
  const isCompleted =
    status === 'approved';

  const isRejected =
    status === 'rejected';

  const isWaiting =
    status === 'pending';

  const Icon = isCompleted
    ? Check
    : isRejected
      ? XCircle
      : isWaiting
        ? Clock
        : FileText;

  const iconClass = isCompleted
    ? 'bg-emerald-400/15 text-emerald-300'
    : isRejected
      ? 'bg-rose-400/15 text-rose-300'
      : isWaiting
        ? 'bg-amber-400/15 text-amber-200'
        : 'bg-white/5 text-slate-400';

  return (
    <div className="relative flex gap-3">

      {!isLast && (
        <div className="
          absolute left-[15px] top-8
          bottom-0 w-px bg-white/10
        " />
      )}

      <div
        className={`
          relative z-10 flex h-8 w-8
          shrink-0 items-center
          justify-center rounded-full
          ${iconClass}
        `}
      >
        <Icon
          className="h-4 w-4"
          aria-hidden="true"
        />
      </div>

      <div
        className={`
          min-w-0 flex-1
          ${isLast ? 'pb-0' : 'pb-4'}
        `}
      >

        <div className="
          flex flex-wrap items-center
          justify-between gap-2
        ">

          <span className="
            text-xs font-semibold
            text-slate-100
          ">
            {title}
          </span>

          <span
            className={`
              rounded-full px-2 py-1
              text-[10px] font-medium
              ${getBadgeClass(status)}
            `}
          >
            {status === 'not started'
              ? 'Not Started'
              : status === 'not required'
                ? 'Not Required'
                : formatApprovalState(status)}
          </span>

        </div>

        <p className="
          mt-1 text-[11px]
          leading-relaxed text-slate-400
        ">
          {description}
        </p>

      </div>
    </div>
  );
};

// ============================================================
// LEAVE REQUEST DETAILS MODAL
// ============================================================

export const LeaveRequestDetailsModal = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  initialAction = null,
  isSubmitting: parentSubmitting = false,
  readOnly = false
}) => {

  const [comment, setComment] =
    useState('');

  const [error, setError] =
    useState('');

  const [
    localSubmitting,
    setLocalSubmitting
  ] = useState(false);

  const decisionLock = useRef(false);

  const modalVersion = useRef(0);

  const isSubmitting =
    Boolean(parentSubmitting) ||
    localSubmitting;

  // ==========================================================
  // RESET MODAL STATE
  // ==========================================================

  useEffect(() => {

    modalVersion.current += 1;

    setComment('');

    setError('');

    if (!decisionLock.current) {
      setLocalSubmitting(false);
    }

  }, [
    isOpen,
    request?.id,
    initialAction
  ]);

  // ==========================================================
  // EMPTY MODAL GUARD
  // ==========================================================

  if (!isOpen || !request) {
    return null;
  }

  // ==========================================================
  // APPROVAL CALCULATIONS
  // ==========================================================

  const teamLeadStatus =
    normalizeApproval(
      request.teamLeadApproval ??
      request.managerApprovalStatus
    );

  const hrStatus =
    normalizeApproval(
      request.hrApproval ??
      request.hrApprovalStatus
    );

  const overallStatus =
    getLeaveStatus(
      teamLeadStatus,
      hrStatus
    );

  const approvalStage =
    getApprovalStage(
      teamLeadStatus,
      hrStatus
    );

  const statusLabel =
    getStatusLabel(approvalStage);

  const statusDescription =
    getStatusDescription(
      approvalStage
    );

  const teamLeadApproval =
    formatApprovalState(
      teamLeadStatus
    );

  const hrApproval =
    teamLeadStatus === 'rejected' &&
    hrStatus === 'pending'

      ? 'Not Required'

      : formatApprovalState(
          hrStatus
        );

  const canReview =
    !readOnly &&
    approvalStage === 'team-lead-review' &&
    teamLeadStatus === 'pending';

  const canApprove =
    canReview &&
    typeof onApprove === 'function';

  const canReject =
    canReview &&
    typeof onReject === 'function';

  const showDecisionInput =
    canApprove || canReject;

  const leaveDays =
    getValidLeaveDays(
      request.totalDays
    );

  const validLeaveDates =
    hasValidDateRange(
      request.fromDate,
      request.toDate
    );

  const validLeaveData =
    validLeaveDates &&
    leaveDays !== null;

  const isReasonValid =
    comment.trim().length > 0 &&
    comment.trim().length <=
      MAX_COMMENT_LENGTH;

  const normalizedInitialAction =
    String(
      initialAction || ''
    ).trim().toLowerCase();

  const hasInitialAction = [
    'approved',
    'rejected'
  ].includes(
    normalizedInitialAction
  );

  const comments =
    Array.isArray(request.comments)
      ? request.comments
      : typeof request.comments === 'string' &&
          request.comments.trim()
        ? [request.comments]
        : [];

  const hrTimelineStatus =
    teamLeadStatus === 'rejected' &&
    hrStatus === 'pending'

      ? 'not required'

      : teamLeadStatus === 'pending' &&
        hrStatus === 'pending'

        ? 'not started'

        : hrStatus;

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleClose = () => {

    if (
      isSubmitting ||
      decisionLock.current
    ) {
      return;
    }

    setComment('');

    setError('');

    onClose?.();
  };

  // ==========================================================
  // APPROVE / REJECT HANDLER
  // ==========================================================

  const handleDecision = async decision => {

    if (
      isSubmitting ||
      decisionLock.current
    ) {
      return;
    }

    const normalizedDecision =
      String(
        decision || ''
      ).trim().toLowerCase();

    if (
      !['approved', 'rejected'].includes(
        normalizedDecision
      )
    ) {
      setError(
        'Invalid approval decision.'
      );

      return;
    }

    if (
      hasInitialAction &&
      normalizedDecision !==
        normalizedInitialAction
    ) {
      setError(
        'Invalid action for this review.'
      );

      return;
    }

    if (!canReview) {
      setError(
        'This leave request is not available for Team Lead review.'
      );

      return;
    }

    if (
      request.id === null ||
      request.id === undefined ||
      String(request.id).trim() === ''
    ) {
      setError(
        'Leave request ID is unavailable.'
      );

      return;
    }

    if (
      normalizedDecision === 'approved' &&
      !validLeaveData
    ) {
      setError(
        'Please verify the leave dates and total leave days before approving.'
      );

      return;
    }

    const cleanComment =
      comment.trim();

    if (!cleanComment) {

      setError(
        normalizedDecision === 'rejected'
          ? 'Rejection reason is required.'
          : 'Approval comment is required.'
      );

      return;
    }

    if (
      cleanComment.length >
      MAX_COMMENT_LENGTH
    ) {
      setError(
        `Decision comments cannot exceed ${MAX_COMMENT_LENGTH} characters.`
      );

      return;
    }

    const decisionHandler =
      normalizedDecision === 'approved'
        ? onApprove
        : onReject;

    if (
      typeof decisionHandler !== 'function'
    ) {
      setError(
        'Approval action is unavailable.'
      );

      return;
    }

    const submissionVersion =
      modalVersion.current;

    decisionLock.current = true;

    setLocalSubmitting(true);

    setError('');

    try {

      const result = await decisionHandler(
        request.id,
        cleanComment
      );

      if (
        result === false ||
        result?.success === false
      ) {
        throw new Error(
          result?.message ||
          'Unable to process this leave request.'
        );
      }

      if (
        modalVersion.current ===
        submissionVersion
      ) {

        setComment('');

        setError('');

        onClose?.();
      }

    } catch (decisionError) {

      if (
        modalVersion.current ===
        submissionVersion
      ) {

        setError(
          decisionError instanceof Error
            ? decisionError.message
            : 'Unable to process this leave request.'
        );
      }

    } finally {

      decisionLock.current = false;

      setLocalSubmitting(false);
    }
  };

  // ==========================================================
  // BUTTON VALIDATION
  // ==========================================================

  const approveDisabled =
    isSubmitting ||
    !isReasonValid ||
    !validLeaveData ||
    !canApprove;

  const rejectDisabled =
    isSubmitting ||
    !isReasonValid ||
    !canReject;

  // ==========================================================
  // MODAL UI
  // ==========================================================

  return (

    <ModalPortal
      onClose={handleClose}
      ariaLabelledby="leave-request-details-title"
    >

      <section
        aria-busy={isSubmitting}
        className="
          relative max-h-[90vh]
          w-full max-w-xl space-y-4
          overflow-y-auto rounded-2xl
          border border-[#34515b]
          bg-[#142c37] p-5
          text-white shadow-2xl
        "
      >

        {/* CLOSE BUTTON */}

        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="
            absolute right-4 top-4
            rounded-full p-2
            text-slate-300 transition
            hover:bg-white/10
            hover:text-white
            disabled:opacity-50
          "
          aria-label="Close leave request details"
        >
          <X className="h-4 w-4" />
        </button>

        {/* EMPLOYEE DETAILS */}

        <div className="
          border-b border-white/10
          pb-3 pr-10
        ">

          <div className="
            flex flex-wrap items-center gap-2
          ">

            <h2
              id="leave-request-details-title"
              className="
                font-display text-lg
                font-bold break-words
              "
            >
              {request.employeeName ||
                'Employee'}
            </h2>

            <StatusBadge
              status={overallStatus}
            />

          </div>

          <p className="
            mt-1 text-xs text-slate-400
          ">

            {request.employeeId || 'ID unavailable'}

            {' · '}

            {request.requestType || 'Leave'}

            {' · Submitted '}

            {safeFormatDate(
              request.requestDate
            )}

          </p>

        </div>

        {/* LEAVE PERIOD AND FINAL STATUS */}

        <div className="
          grid gap-3 text-xs
          sm:grid-cols-2
        ">

          <div className="
            rounded-xl border border-white/10
            bg-[#10242e] p-3
          ">

            <span className="
              flex items-center gap-1.5
              text-slate-400
            ">

              <Calendar className="h-3.5 w-3.5" />

              Leave Period

            </span>

            <p className="
              mt-1 font-semibold
              text-slate-100
            ">

              {safeFormatDateRange(
                request.fromDate,
                request.toDate
              )}

            </p>

            <p className="
              mt-1 text-slate-400
            ">

              {leaveDays === null
                ? 'Leave days unavailable'
                : `${leaveDays} ${
                    leaveDays === 1
                      ? 'day'
                      : 'days'
                  }`}

            </p>

          </div>

          <div className="
            rounded-xl border border-white/10
            bg-[#10242e] p-3
          ">

            <span className="text-slate-400">
              Overall Status
            </span>

            <p
              className={`
                mt-1 font-semibold
                ${getStatusColor(
                  overallStatus
                )}
              `}
            >
              {statusLabel}
            </p>

            <p className="
              mt-1 leading-relaxed
              text-slate-400
            ">
              {statusDescription}
            </p>

          </div>

        </div>

        {/* APPROVAL STATUS */}

        <div className="
          grid gap-2 sm:grid-cols-2
        ">

          {[
            [
              'Team Lead Approval',
              teamLeadApproval
            ],
            [
              'HR Approval',
              hrApproval
            ]
          ].map(([label, status]) => (

            <div
              key={label}
              className="
                flex items-center
                justify-between gap-2
                rounded-xl border
                border-white/10
                bg-[#10242e] p-3
                text-xs
              "
            >

              <span className="text-slate-300">
                {label}
              </span>

              <span
                className={`
                  rounded-full px-2 py-1
                  font-semibold whitespace-nowrap
                  ${getBadgeClass(status)}
                `}
              >
                {status}
              </span>

            </div>

          ))}

        </div>

        {/* APPROVAL WORKFLOW TIMELINE */}

        <div className="
          rounded-xl border border-white/10
          bg-[#10242e] p-4
        ">

          <h3 className="
            mb-4 flex items-center gap-2
            text-xs font-semibold
            uppercase tracking-wide
            text-slate-400
          ">

            <CheckCircle className="h-4 w-4" />

            Approval Workflow

          </h3>

          <WorkflowItem
            title="Leave Request Submitted"
            status="approved"
            description={
              request.requestDate
                ? `Submitted on ${safeFormatDate(
                    request.requestDate
                  )}`
                : 'Leave request received.'
            }
          />

          <WorkflowItem
            title="Team Lead Review"
            status={teamLeadStatus}
            description={
              teamLeadStatus === 'approved'
                ? 'Team Lead approval completed.'
                : teamLeadStatus === 'rejected'
                  ? 'Request rejected by the Team Lead.'
                  : 'Awaiting Team Lead decision.'
            }
          />

          <WorkflowItem
            title="HR Review"
            status={hrTimelineStatus}
            description={
              hrTimelineStatus === 'approved'
                ? 'HR approval completed.'
                : hrTimelineStatus === 'rejected'
                  ? 'Request rejected by HR.'
                  : hrTimelineStatus === 'not required'
                    ? 'HR review is not required after Team Lead rejection.'
                    : hrTimelineStatus === 'not started'
                      ? 'HR review begins after Team Lead approval.'
                      : 'Awaiting final HR decision.'
            }
          />

          <WorkflowItem
            title="Final Decision"
            status={overallStatus}
            description={
              statusDescription
            }
            isLast
          />

        </div>

        {/* TEAM LEAD PENDING MESSAGE */}

        {approvalStage === 'team-lead-review' && (

          <div className="
            flex items-start gap-2
            rounded-xl border
            border-amber-400/20
            bg-amber-400/10
            p-3 text-xs text-amber-200
          ">

            <Clock className="
              mt-0.5 h-4 w-4 shrink-0
            " />

            <div>

              <p className="font-semibold">
                Awaiting Team Lead Review
              </p>

              <p className="
                mt-1 leading-relaxed
              ">
                {showDecisionInput
                  ? 'Review the request and provide your approval or rejection comment.'
                  : 'This request is waiting for an authorized Team Lead decision.'}
              </p>

            </div>

          </div>

        )}

        {/* HR PENDING MESSAGE */}

        {approvalStage === 'hr-review' && (

          <div className="
            flex items-start gap-2
            rounded-xl border
            border-amber-400/20
            bg-amber-400/10
            p-3 text-xs text-amber-200
          ">

            <Clock className="
              mt-0.5 h-4 w-4 shrink-0
            " />

            <div>

              <p className="font-semibold">
                Pending HR Approval
              </p>

              <p className="
                mt-1 leading-relaxed
              ">
                The Team Lead has approved
                this request. Final approval
                is pending with HR.
              </p>

            </div>

          </div>

        )}

        {/* APPROVED MESSAGE */}

        {approvalStage === 'approved' && (

          <div className="
            flex items-start gap-2
            rounded-xl border
            border-emerald-400/20
            bg-emerald-400/10
            p-3 text-xs text-emerald-300
          ">

            <Check className="
              mt-0.5 h-4 w-4 shrink-0
            " />

            <div>

              <p className="font-semibold">
                Leave Approved
              </p>

              <p className="mt-1">
                Both approval stages
                have been completed.
              </p>

            </div>

          </div>

        )}

        {/* REJECTED MESSAGE */}

        {approvalStage === 'rejected' && (

          <div className="
            flex items-start gap-2
            rounded-xl border
            border-rose-400/20
            bg-rose-400/10
            p-3 text-xs text-rose-300
          ">

            <XCircle className="
              mt-0.5 h-4 w-4 shrink-0
            " />

            <div>

              <p className="font-semibold">
                Leave Rejected
              </p>

              <p className="mt-1">

                {teamLeadStatus === 'rejected'
                  ? 'Rejected by the Team Lead.'
                  : 'Rejected by HR.'}

              </p>

            </div>

          </div>

        )}

        {/* INVALID LEAVE DATA WARNING */}

        {!validLeaveData && (

          <div className="
            flex items-start gap-2
            rounded-xl border
            border-amber-400/20
            bg-amber-400/10
            p-3 text-xs text-amber-200
          ">

            <AlertCircle className="
              mt-0.5 h-4 w-4 shrink-0
            " />

            <div>

              <p className="font-semibold">
                Leave Information Requires Review
              </p>

              <p className="mt-1">

                The leave dates or total
                leave days are missing or invalid.

                {canApprove &&
                  ' Approval is disabled until the request is corrected.'}

              </p>

            </div>

          </div>

        )}

        {/* EMPLOYEE LEAVE REASON */}

        <div>

          <h3 className="
            text-xs font-semibold uppercase
            tracking-wide text-slate-400
          ">
            Leave Reason
          </h3>

          <p className="
            mt-1 rounded-xl border
            border-white/10
            bg-[#10242e] p-3
            text-sm leading-relaxed
            text-slate-200
            break-words whitespace-pre-wrap
          ">
            {request.reason ||
              'No reason provided.'}
          </p>

        </div>

        {/* REJECTION REASON */}

        {overallStatus === 'rejected' &&
        request.decisionReason && (

          <div>

            <h3 className="
              text-xs font-semibold uppercase
              tracking-wide text-rose-300
            ">
              Decision Reason
            </h3>

            <p className="
              mt-1 rounded-xl border
              border-rose-400/20
              bg-rose-400/10 p-3
              text-sm leading-relaxed
              text-rose-200 break-words
            ">
              {request.decisionReason}
            </p>

          </div>

        )}

        {/* DECISION HISTORY */}

        {comments.length > 0 && (

          <div>

            <h3 className="
              flex items-center gap-1.5
              text-xs font-semibold uppercase
              tracking-wide text-slate-400
            ">

              <MessageSquare className="h-3.5 w-3.5" />

              Decision Comments

            </h3>

            <ul className="mt-2 space-y-2">

              {comments.map((entry, index) => {

                const author =
                  getCommentAuthor(entry);

                const commentDate =
                  entry?.createdAt ||
                  entry?.timestamp ||
                  entry?.date;

                return (

                  <li
                    key={`${request.id}-comment-${index}`}
                    className="
                      rounded-lg border
                      border-white/10
                      bg-[#10242e]
                      px-3 py-2.5
                      text-xs text-slate-200
                      break-words
                    "
                  >

                    {author && (

                      <div className="
                        mb-1 font-medium
                        text-emerald-300
                      ">
                        {author}
                      </div>

                    )}

                    <p className="
                      leading-relaxed
                      whitespace-pre-wrap
                    ">
                      {getCommentText(entry)}
                    </p>

                    {commentDate && (

                      <p className="
                        mt-1.5 text-[10px]
                        text-slate-400 font-data
                      ">
                        {safeFormatDate(
                          commentDate
                        )}
                      </p>

                    )}

                  </li>

                );
              })}

            </ul>

          </div>

        )}

        {/* DECISION DETAILS */}

        {request.decidedAt && (

          <div className="
            rounded-xl border border-white/10
            bg-[#10242e] p-3 text-xs
          ">

            <span className="text-slate-400">
              Last Reviewed
            </span>

            <p className="
              mt-1 font-medium text-slate-200
            ">
              {safeFormatDate(
                request.decidedAt
              )}
            </p>

            {request.decidedBy?.name && (

              <p className="
                mt-1 text-slate-400
              ">
                Reviewed by:{' '}
                {request.decidedBy.name}
              </p>

            )}

          </div>

        )}

        {/* APPROVAL COMMENT INPUT */}

        {showDecisionInput && (

          <div>

            <label
              htmlFor="leave-decision-reason"
              className="
                text-xs font-semibold
                text-slate-300
              "
            >

              {normalizedInitialAction === 'rejected'
                ? 'Rejection Reason'
                : 'Team Lead Decision Comment'}

              <span className="
                ml-1 text-rose-300
              ">
                *
              </span>

            </label>

            <textarea
              id="leave-decision-reason"
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              value={comment}
              disabled={isSubmitting}
              onChange={event => {

                setComment(
                  event.target.value
                );

                setError('');
              }}
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby="leave-comment-help"
              className="
                mt-1 w-full rounded-xl
                border border-[#34515b]
                bg-[#10242e] p-3
                text-sm text-white
                placeholder:text-slate-500
                focus:outline-none
                focus:border-[#6EE7B7]
                disabled:opacity-60
              "
              placeholder={
                normalizedInitialAction === 'rejected'
                  ? 'Enter the reason for rejecting this request.'
                  : 'Explain the approval or rejection decision.'
              }
            />

            <div className="
              mt-1 flex items-center
              justify-between gap-2
            ">

              <span
                id="leave-comment-help"
                className="
                  text-[10px] text-slate-400
                "
              >
                Decision comment is required.
              </span>

              <span className={`
                text-[10px]

                ${comment.length >= MAX_COMMENT_LENGTH
                  ? 'text-amber-200'
                  : 'text-slate-400'}
              `}>

                {comment.length}/
                {MAX_COMMENT_LENGTH}

              </span>

            </div>

          </div>

        )}

        {/* ERROR MESSAGE */}

        {error && (

          <p
            role="alert"
            className="
              rounded-lg border
              border-rose-400/20
              bg-rose-400/10
              p-2.5 text-xs text-rose-300
            "
          >
            {error}
          </p>

        )}

        {/* ACTION BUTTONS */}

        <div className="
          flex flex-wrap justify-end gap-2
          border-t border-white/10 pt-3
        ">

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="
              rounded-xl border
              border-[#34515b]
              bg-[#10242e]
              px-4 py-2 text-xs
              font-semibold text-slate-200
              hover:bg-white/10
              disabled:opacity-50
            "
          >
            Close
          </button>

          {/* INITIAL ACTION MODE */}

          {showDecisionInput &&
          hasInitialAction && (

            <button
              type="button"
              onClick={() =>
                handleDecision(
                  normalizedInitialAction
                )
              }
              disabled={
                normalizedInitialAction === 'approved'
                  ? approveDisabled
                  : rejectDisabled
              }
              className={`
                inline-flex items-center
                gap-1.5 rounded-xl
                px-4 py-2 text-xs
                font-bold disabled:opacity-50
                disabled:cursor-not-allowed

                ${normalizedInitialAction === 'approved'
                  ? 'bg-[#6EE7B7] text-[#07352a]'
                  : 'bg-rose-400/15 text-rose-200'}
              `}
            >

              {normalizedInitialAction === 'approved'
                ? <Check className="h-3.5 w-3.5" />
                : <XCircle className="h-3.5 w-3.5" />}

              {isSubmitting
                ? 'Processing...'
                : normalizedInitialAction === 'approved'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}

            </button>

          )}

          {/* NORMAL REVIEW MODE */}

          {showDecisionInput &&
          !hasInitialAction && (

            <>

              {canReject && (

                <button
                  type="button"
                  onClick={() =>
                    handleDecision('rejected')
                  }
                  disabled={rejectDisabled}
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-xl
                    bg-rose-400/15
                    px-4 py-2 text-xs
                    font-bold text-rose-200
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >

                  <XCircle className="h-3.5 w-3.5" />

                  {isSubmitting
                    ? 'Processing...'
                    : 'Reject'}

                </button>

              )}

              {canApprove && (

                <button
                  type="button"
                  onClick={() =>
                    handleDecision('approved')
                  }
                  disabled={approveDisabled}
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-xl
                    bg-[#6EE7B7]
                    px-4 py-2 text-xs
                    font-bold text-[#07352a]
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >

                  <Check className="h-3.5 w-3.5" />

                  {isSubmitting
                    ? 'Processing...'
                    : 'Approve'}

                </button>

              )}

            </>

          )}

        </div>

      </section>

    </ModalPortal>

  );
};

export default LeaveRequestDetailsModal;