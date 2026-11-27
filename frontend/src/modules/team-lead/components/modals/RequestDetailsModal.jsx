
import React, {
  useEffect,
  useState,
  useRef,
  useId
} from 'react';

import { Avatar } from '../common/Avatar.jsx';
import { StatusBadge } from '../common/StatusBadge.jsx';

import {
  formatDate,
  formatDateRange
} from '../../utils/helpers.js';

import {
  X,
  Calendar,
  Clock,
  MessageSquare,
  Check,
  XCircle,
  AlertCircle,
  LoaderCircle
} from 'lucide-react';

import { ModalPortal } from '../common/ModalPortal.jsx';

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_COMMENT_LENGTH = 300;

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const hasValue = value =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== '';

const displayValue = value => {

  if (!hasValue(value)) {
    return 'Not provided';
  }

  if (typeof value === 'object') {
    return 'Not available';
  }

  return String(value);

};

// ============================================================
// DATE HELPERS
// ============================================================

const displayDate = value => {

  if (
    !hasValue(value) ||
    Number.isNaN(new Date(value).getTime())
  ) {
    return 'Date unavailable';
  }

  return formatDate(value);

};

const displayDateRange = (fromDate, toDate) => {

  const validFrom =
    hasValue(fromDate) &&
    !Number.isNaN(new Date(fromDate).getTime());

  const validTo =
    hasValue(toDate) &&
    !Number.isNaN(new Date(toDate).getTime());

  if (validFrom && validTo) {

    if (
      String(fromDate).slice(0, 10) ===
      String(toDate).slice(0, 10)
    ) {
      return displayDate(fromDate);
    }

    return formatDateRange(
      fromDate,
      toDate
    );

  }

  if (validFrom) {
    return displayDate(fromDate);
  }

  if (validTo) {
    return displayDate(toDate);
  }

  return 'Date unavailable';

};

const displayTime = value => {

  if (!hasValue(value)) {
    return 'Not provided';
  }

  const text = String(value).trim();

  if (
    /^\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?$/i.test(text)
  ) {
    return text;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );

  }

  return text;

};

// ============================================================
// COMMENT NORMALIZATION
// ============================================================

const getComments = comments => {

  const records = Array.isArray(comments)

    ? comments

    : typeof comments === 'string' &&
      comments.trim()

      ? [comments]

      : [];

  return records.map((comment, index) => {

    if (typeof comment === 'string') {

      return {
        id: `comment-${index}`,
        text: comment,
        author: '',
        createdAt: null
      };

    }

    if (!comment || typeof comment !== 'object') {
      return null;
    }

    const text =
      comment.text ??
      comment.comment ??
      comment.message ??
      comment.content ??
      '';

    return {

      id:
        comment.id ||
        `comment-${index}`,

      text:
        typeof text === 'string'
          ? text
          : '',

      author:
        typeof comment.author === 'string'
          ? comment.author
          : comment.authorName ||
            comment.author?.name ||
            comment.decidedBy?.name ||
            '',

      createdAt:
        comment.createdAt ||
        comment.timestamp ||
        comment.date ||
        null

    };

  }).filter(
    comment =>
      comment &&
      comment.text.trim()
  );

};

// ============================================================
// REVIEW STATUS HELPERS
// ============================================================

const isReviewableRequest = request => {

  if (
    !request ||
    normalize(request.status) !== 'pending'
  ) {
    return false;
  }

  if (request.category === 'Leave Approval') {

    const teamLeadStatus = normalize(

      request.teamLeadApproval ??
      request.managerApprovalStatus ??
      'pending'

    );

    const hrStatus = normalize(

      request.hrApproval ??
      request.hrApprovalStatus ??
      'pending'

    );

    if (teamLeadStatus !== 'pending') {
      return false;
    }

    if (
      hrStatus === 'approved' ||
      hrStatus === 'rejected'
    ) {
      return false;
    }

    if (
      request.reviewStage &&
      request.reviewStage !== 'team-lead-review'
    ) {
      return false;
    }

  }

  return true;

};

const getStageColor = status => {

  const normalizedStatus =
    normalize(status);

  if (normalizedStatus === 'approved') {
    return 'text-good';
  }

  if (normalizedStatus === 'rejected') {
    return 'text-bad';
  }

  return 'text-warn';

};

const formatStageStatus = value => {

  const status =
    normalize(value) || 'pending';

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );

};

// ============================================================
// REUSABLE DETAIL FIELD
// ============================================================

const DetailField = ({
  label,
  value,
  icon: Icon,
  accent = false
}) => (

  <div className="
    min-w-0 p-2.5 rounded-xl
    bg-surface2/60 border border-line/50
  ">

    <span className="
      text-muted block text-[10.5px]
      uppercase font-semibold
    ">

      {label}

    </span>

    <div className={`
      mt-1 flex items-center gap-1.5
      break-words text-xs font-medium
      ${accent ? 'text-accent' : 'text-ink'}
    `}>

      {Icon && (

        <Icon
          size={14}
          className="shrink-0 text-muted"
        />

      )}

      <span className="min-w-0 break-words">

        {displayValue(value)}

      </span>

    </div>

  </div>

);

// ============================================================
// ATTENDANCE REGULARIZATION DETAILS
// ============================================================

const AttendanceCorrectionDetails = ({
  request
}) => {

  const originalCheckIn =
    request.originalCheckIn ??
    request.actualCheckIn ??
    request.originalPunchIn;

  const originalCheckOut =
    request.originalCheckOut ??
    request.actualCheckOut ??
    request.originalPunchOut;

  const requestedCheckIn =
    request.requestedCheckIn ??
    request.correctedCheckIn ??
    request.requestedPunchIn;

  const requestedCheckOut =
    request.requestedCheckOut ??
    request.correctedCheckOut ??
    request.requestedPunchOut;

  const correctionType =
    request.correctionType ||
    request.regularizationType ||
    request.requestType;

  const hasPunchDetails = [

    originalCheckIn,

    originalCheckOut,

    requestedCheckIn,

    requestedCheckOut

  ].some(hasValue);

  return (

    <section className="
      mb-4 rounded-xl
      border border-line
      bg-surface2/30 p-3
    ">

      <h3 className="
        mb-3 flex items-center gap-2
        font-display text-sm
        font-semibold text-ink
      ">

        <Clock
          size={16}
          className="text-accent"
        />

        Attendance Correction Details

      </h3>

      <div className="grid grid-cols-2 gap-2">

        <DetailField

          label="Attendance Date"

          icon={Calendar}

          value={displayDate(

            request.attendanceDate ||
            request.date ||
            request.fromDate

          )}

        />

        <DetailField

          label="Correction Type"

          value={correctionType}

        />

        {hasPunchDetails && (

          <>

            <DetailField

              label="Original Check-In"

              value={displayTime(originalCheckIn)}

              icon={Clock}

            />

            <DetailField

              label="Requested Check-In"

              value={displayTime(requestedCheckIn)}

              icon={Clock}

              accent

            />

            <DetailField

              label="Original Check-Out"

              value={displayTime(originalCheckOut)}

              icon={Clock}

            />

            <DetailField

              label="Requested Check-Out"

              value={displayTime(requestedCheckOut)}

              icon={Clock}

              accent

            />

          </>

        )}

      </div>

      {!hasPunchDetails && (

        <p className="
          mt-3 text-[11px]
          leading-relaxed text-muted
        ">

          Punch correction timings are not
          available in this request record.

        </p>

      )}

    {!hasValue(requestedCheckIn) &&
        !hasValue(requestedCheckOut) &&
        normalize(request.status) === 'pending' && (

          <div className="
            mt-3 flex items-start gap-2
            rounded-lg border border-warn/30
            bg-warn/10 p-3 text-xs text-warn
          ">

            <AlertCircle
              size={16}
              className="shrink-0"
            />

            <span>
              Requested punch timings are missing.
              Obtain the complete correction request
              before approving attendance changes.
            </span>

          </div>

      )}

      {request.attendanceCorrection?.status === 'applied' && (

        <div className="
          mt-4 space-y-3
          border-t border-line/60 pt-4
        ">

          <div className="
            flex items-center gap-2
            text-sm font-semibold text-good
          ">

            <Check size={16} />

            Attendance Correction Applied

          </div>

          <div className="grid grid-cols-2 gap-2">

            <DetailField
              label="Previous Check-In"
              value={displayTime(
                request.attendanceCorrection.before?.checkInTime
              )}
            />

            <DetailField
              label="Corrected Check-In"
              value={displayTime(
                request.attendanceCorrection.after?.checkInTime
              )}
              accent
            />

            <DetailField
              label="Previous Check-Out"
              value={displayTime(
                request.attendanceCorrection.before?.checkOutTime
              )}
            />

            <DetailField
              label="Corrected Check-Out"
              value={displayTime(
                request.attendanceCorrection.after?.checkOutTime
              )}
              accent
            />

            <DetailField
              label="Net Working Hours"
              value={
                Number.isFinite(
                  request.attendanceCorrection.after?.workingSeconds
                )
                  ? `${Math.floor(
                      request.attendanceCorrection.after.workingSeconds / 3600
                    )}h ${Math.floor(
                      request.attendanceCorrection.after.workingSeconds % 3600 / 60
                    )}m`
                  : 'Not available'
              }
            />

            <DetailField
              label="Applied On"
              value={displayDate(
                request.attendanceCorrection.appliedAt
              )}
            />

            <DetailField
              label="Reviewed By"
              value={
                request.attendanceCorrection.reviewedBy?.name
              }
            />

            <DetailField
              label="Correction Reference"
              value={
                request.attendanceCorrection.requestId
              }
            />

          </div>

        </div>

      )}

      {normalize(request.status) === 'approved' &&
        request.attendanceCorrection?.status !== 'applied' && (

          <p className="mt-3 text-xs text-muted">
            Attendance record synchronization
            has not been confirmed for this approval.
          </p>

      )}

    </section>

  );
};
// ============================================================
// TIMESHEET DETAILS
// ============================================================

const TimesheetRequestDetails = ({
  request
}) => {

  const submittedHours =
    request.totalHours ??
    request.submittedHours ??
    request.workingHours;

  const overtimeHours =
    request.overtimeHours ??
    request.extraHours;

  const entries = Array.isArray(
    request.timesheetEntries
  )

    ? request.timesheetEntries

    : Array.isArray(request.entries)

      ? request.entries

      : [];

  const formatHours = value => {

    if (!hasValue(value)) {
      return 'Not provided';
    }

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return `${value} hours`;
    }

    if (
      typeof value === 'string' &&
      /^\d+(\.\d+)?$/.test(value.trim())
    ) {
      return `${value} hours`;
    }

    return displayValue(value);

  };

  return (

    <section className="
      mb-4 rounded-xl
      border border-line
      bg-surface2/30 p-3
    ">

      <h3 className="
        mb-3 flex items-center gap-2
        font-display text-sm
        font-semibold text-ink
      ">

        <Clock
          size={16}
          className="text-accent"
        />

        Timesheet Details

      </h3>

      <div className="grid grid-cols-2 gap-2">

        <DetailField

          label="Timesheet Period"

          icon={Calendar}

          value={displayDateRange(

            request.weekStart ||
            request.fromDate,

            request.weekEnd ||
            request.toDate

          )}

        />

        <DetailField

          label="Submitted Hours"

          value={formatHours(submittedHours)}

          accent

        />

        <DetailField

          label="Overtime"

          value={formatHours(overtimeHours)}

        />

        <DetailField

          label="Project"

          value={

            request.projectName ||
            request.projectCode ||
            request.projectId

          }

        />

      </div>

      {entries.filter(Boolean).length > 0 ? (

        <div className="
          mt-3 overflow-x-auto
          rounded-lg border border-line
        ">

          <table className="
            w-full min-w-[340px]
            text-left text-[11px]
          ">

            <thead className="
              bg-surface2 text-muted
            ">

              <tr>

                <th className="p-2.5">
                  Date
                </th>

                <th className="p-2.5">
                  Project / Task
                </th>

                <th className="p-2.5 text-right">
                  Hours
                </th>

              </tr>

            </thead>

            <tbody>

              {entries.filter(Boolean).map((entry, index) => (

                <tr
                  key={`${entry.id || 'entry'}-${index}`}
                  className="border-t border-line/50"
                >

                  <td className="p-2.5 text-muted">

                    {displayDate(
                      entry.date ||
                      entry.workDate
                    )}

                  </td>

                  <td className="p-2.5 text-ink">

                    {displayValue(

                      entry.taskName ||
                      entry.taskTitle ||
                      entry.projectName ||
                      entry.description

                    )}

                  </td>

                  <td className="
                    p-2.5 text-right
                    font-data text-accent
                  ">

                    {formatHours(

                      entry.hours ??
                      entry.totalHours ??
                      entry.workingHours

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      ) : (

        <p className="
          mt-3 text-[11px]
          leading-relaxed text-muted
        ">

          Daily or project-wise hour breakdown
          is not available in this request.

        </p>

      )}

    </section>

  );

};

// ============================================================
// REQUEST DETAILS MODAL
// ============================================================

export const RequestDetailsModal = ({

  request,

  isOpen,

  onClose,

  onApprove,

  onReject,
  onRequestCorrection,

  initialAction = null,

  isSubmitting = false,

  requireComment = true,

  readOnly = false

}) => {

  const [commentText, setCommentText] =
    useState('');

  const [validationError, setValidationError] =
    useState('');

  const [internalSubmitting, setInternalSubmitting] =
    useState(false);

  const submissionLock =
    useRef(false);

  const mountedRef =
    useRef(true);

  const requestIdRef =
    useRef(request?.id);

  requestIdRef.current =
    request?.id;

  const titleId = useId();

  const commentId = useId();

  const errorId = useId();

  // ==========================================================
  // COMPONENT LIFECYCLE
  // ==========================================================

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

    };

  }, []);

  useEffect(() => {

    setCommentText('');

    setValidationError('');

  }, [
    isOpen,
    request?.id,
    initialAction
  ]);

  if (!isOpen || !request) {
    return null;
  }

  // ==========================================================
  // DECISION CONFIGURATION
  // ==========================================================

  const status =
    normalize(request.status);

  const action =
    normalize(initialAction);

  const requestedAction =

    ['approved', 'rejected'].includes(action)

      ? action

      : null;

  const busy =
    isSubmitting ||
    internalSubmitting;

  const reviewable =

    !readOnly &&
    isReviewableRequest(request);

  const canApprove =

    reviewable &&
    typeof onApprove === 'function' &&
    requestedAction !== 'rejected';

  const canReject =

    reviewable &&
    typeof onReject === 'function' &&
    requestedAction !== 'approved';

  const canRequestCorrection =
    reviewable &&
    request.category === 'Timesheet Approval' &&
    typeof onRequestCorrection === 'function' &&
    !requestedAction;

  const canDecide =
    canApprove ||
    canReject ||
    canRequestCorrection;

  const decisionReason =
    commentText.trim();

  const commentRequired =
    requireComment ||
    requestedAction === 'rejected';

  const isValidApprovalComment =

    decisionReason.length <= MAX_COMMENT_LENGTH &&

    (
      !requireComment ||
      decisionReason.length > 0
    );

  const isValidRejectionComment =

    decisionReason.length > 0 &&

    decisionReason.length <= MAX_COMMENT_LENGTH;

  const comments =
    getComments(request.comments);

  // ==========================================================
  // SAFE CLOSE
  // ==========================================================

  const handleClose = () => {

    if (
      busy ||
      submissionLock.current
    ) {
      return;
    }

    onClose?.();

  };

  // ==========================================================
  // DECISION SUBMISSION
  // ==========================================================

  const handleDecision = async nextAction => {

    if (
      submissionLock.current ||
      busy
    ) {
      return;
    }

    if (
      nextAction === 'approved' &&
      !canApprove
    ) {
      return;
    }

    if (
      nextAction === 'rejected' &&
      !canReject
    ) {
      return;
    }

    if (
      nextAction === 'correction-required' &&
      !canRequestCorrection
    ) {
      return;
    }

    if (
      !['approved', 'rejected', 'correction-required'].includes(
        nextAction
      )
    ) {
      return;
    }

    if (
      decisionReason.length >
      MAX_COMMENT_LENGTH
    ) {

      setValidationError(
        'Comments cannot exceed 300 characters.'
      );

      return;

    }

    if (

      !decisionReason &&

      (
        requireComment ||
        nextAction === 'rejected' ||
        nextAction === 'correction-required'
      )

    ) {

      setValidationError(

        nextAction === 'correction-required'
          ? 'A correction reason is required.'
          : nextAction === 'rejected'
            ? 'A rejection reason is required.'
            : 'An approval comment is required.'

      );

      return;

    }

    const activeRequestId =
      request.id;

    const callback =

      nextAction === 'approved'
        ? onApprove
        : nextAction === 'correction-required'
          ? onRequestCorrection
          : onReject;

    submissionLock.current = true;

    setInternalSubmitting(true);

    setValidationError('');

    let completed = false;

    try {

      const result = await callback(

        activeRequestId,

        decisionReason

      );

      if (
        result === false ||
        result?.success === false
      ) {

        throw new Error(

          result?.message ||
          'Unable to process this request.'

        );

      }

      completed = true;

    } catch (error) {

      if (

        mountedRef.current &&

        requestIdRef.current === activeRequestId

      ) {

        setValidationError(

          error?.message ||
          'Unable to process this request.'

        );

      }

    } finally {

      submissionLock.current = false;

      if (mountedRef.current) {

        setInternalSubmitting(false);

      }

    }

    if (

      completed &&

      mountedRef.current &&

      requestIdRef.current === activeRequestId

    ) {

      setCommentText('');

      setValidationError('');

      onClose?.();

    }

  };

  // ==========================================================
  // REQUEST METADATA
  // ==========================================================

  const teamLeadStatus =

    request.teamLeadApproval ??

    request.managerApprovalStatus ??

    'pending';

  const hrStatus =

    request.hrApproval ??

    request.hrApprovalStatus ??

    'pending';

  const totalDays = Number(
    request.totalDays
  );

  const validTotalDays =

    hasValue(request.totalDays) &&

    Number.isFinite(totalDays) &&

    totalDays >= 0;

  const reviewerName =

    typeof request.decidedBy === 'string'

      ? request.decidedBy

      : request.decidedBy?.name;

  // ==========================================================
  // MODAL UI
  // ==========================================================

  return (

    <ModalPortal

      onClose={handleClose}

      ariaLabelledby={titleId}

    >

      <div className="
        relative max-h-[90vh]
        w-full max-w-lg overflow-y-auto
        rounded-2xl border
        !border-[#34515b]
        !bg-[#142c37]
        p-5 text-white shadow-2xl
      ">

        {/* CLOSE BUTTON */}

        <button

          type="button"

          onClick={handleClose}

          disabled={busy}

          aria-label="Close modal"

          className="
            absolute top-4 right-4
            p-1.5 rounded-full
            text-muted hover:text-ink
            hover:bg-surface2 transition
            disabled:cursor-not-allowed
            disabled:opacity-40
          "

        >

          <X className="w-4 h-4"/>

        </button>

        {/* EMPLOYEE HEADER */}

        <div className="
          flex flex-wrap items-center
          gap-3 pb-3 pr-6
          border-b border-line/60
        ">

          <Avatar

            name={

              request.employeeName ||
              'Employee'

            }

            size="md"

          />

          <div className="min-w-0 flex-1">

            <div

              id={titleId}

              className="
                font-display font-bold
                text-base text-white
                break-words
              "

            >

              {request.employeeName ||
                'Employee'}

            </div>

            <div className="
              mt-1 text-xs text-muted
              break-words
            ">

              ID: {displayValue(request.employeeId)}

              {' \u00B7 '}

              Requested on{' '}

              {displayDate(

                request.requestDate ||
                request.submittedAt

              )}

            </div>

          </div>

          <StatusBadge

            status={status || 'unknown'}

          />

        </div>

        {/* REQUEST INFORMATION */}

        <div className="
          grid grid-cols-2 gap-3
          my-4 text-xs
        ">

          <DetailField

            label="Category"

            value={request.category}

          />

          <DetailField

            label="Request Type"

            value={request.requestType}

            accent

          />

          <DetailField

            label="Duration / Date"

            icon={Calendar}

            value={displayDateRange(

              request.fromDate ||
              request.attendanceDate,

              request.toDate

            )}

          />

          <DetailField

            label="Total Days"

            value={

              validTotalDays

                ? `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`

                : 'Not provided'

            }

          />

          {hasValue(request.department) && (

            <DetailField

              label="Department"

              value={request.department}

            />

          )}

          {hasValue(request.id) && (

            <DetailField

              label="Request ID"

              value={request.id}

            />

          )}

        </div>

        {/* ATTENDANCE DETAILS */}

        {request.category ===
          'Attendance Regularization' && (

          <AttendanceCorrectionDetails

            request={request}

          />

        )}

        {/* TIMESHEET DETAILS */}

        {request.category ===
          'Timesheet Approval' && (

          <TimesheetRequestDetails

            request={request}

          />

        )}

        {/* LEAVE APPROVAL WORKFLOW */}

        {request.category ===
          'Leave Approval' && (

          <section className="
            mb-4 rounded-xl
            border border-line
            bg-surface2/30 p-3
          ">

            <h3 className="
              mb-3 text-xs font-semibold
              uppercase tracking-wider
              text-muted
            ">

              Approval Workflow

            </h3>

            <div className="
              grid grid-cols-2 gap-2
            ">

              <div className="
                rounded-lg bg-surface2/60
                border border-line/50 p-3
              ">

                <p className="
                  text-[11px] text-muted
                ">

                  Team Lead Review

                </p>

                <p className={`
                  mt-1 text-xs font-semibold
                  ${getStageColor(teamLeadStatus)}
                `}>

                  {formatStageStatus(teamLeadStatus)}

                </p>

              </div>

              <div className="
                rounded-lg bg-surface2/60
                border border-line/50 p-3
              ">

                <p className="
                  text-[11px] text-muted
                ">

                  HR Review

                </p>

                <p className={`
                  mt-1 text-xs font-semibold
                  ${getStageColor(hrStatus)}
                `}>

                  {formatStageStatus(hrStatus)}

                </p>

              </div>

            </div>

            {request.reviewStage ===
              'hr-review' && (

              <p className="
                mt-2 text-[11px] text-warn
              ">

                Team Lead review is completed.
                Final HR approval is pending.

              </p>

            )}

          </section>

        )}

        {/* REQUEST REASON */}

        <div className="mb-4">

          <span className="
            text-xs font-semibold
            text-muted uppercase
            tracking-wider block mb-1
          ">

            Reason / Justification

          </span>

          <div className="
            p-3 rounded-xl
            bg-surface2/40 border border-line
            text-xs text-ink leading-relaxed
            whitespace-pre-wrap break-words
          ">

            {request.reason ||
              'No reason provided.'}

          </div>

        </div>

        {/* COMMENTS AND APPROVER HISTORY */}

        {comments.length > 0 && (

          <div className="mb-4">

            <h3 className="
              text-xs font-semibold
              text-muted uppercase
              tracking-wider mb-2
              flex items-center gap-1.5
            ">

              <MessageSquare className="
                w-3.5 h-3.5 text-accent
              "/>

              Comments & Approver Log

            </h3>

            <div className="space-y-2">

              {comments.map((comment, index) => (

                <div

                  key={`${comment.id}-${index}`}

                  className="
                    text-xs p-3 rounded-lg
                    bg-surface2/60
                    border border-line/40
                  "

                >

                  {(comment.author ||
                    comment.createdAt) && (

                    <div className="
                      mb-1.5 flex flex-wrap
                      items-center justify-between
                      gap-2 text-[11px]
                    ">

                      <span className="
                        font-medium text-accent
                      ">

                        {comment.author ||
                          'Reviewer'}

                      </span>

                      {comment.createdAt && (

                        <span className="text-muted">

                          {displayDate(comment.createdAt)}

                        </span>

                      )}

                    </div>

                  )}

                  <p className="
                    whitespace-pre-wrap
                    break-words text-muted
                    leading-relaxed
                  ">

                    {comment.text}

                  </p>

                </div>

              ))}

            </div>

          </div>

        )}

        {/* FINAL DECISION INFORMATION */}

        {(reviewerName ||
          request.decidedAt ||
          request.decisionReason) && (

          <div className="
            mb-4 rounded-xl
            bg-surface2/30
            border border-line p-3
          ">

            <h3 className="
              mb-2 text-xs
              font-semibold text-ink
            ">

              Latest Review Details

            </h3>

            {reviewerName && (

              <p className="text-xs text-muted">

                Reviewed by:{' '}

                <span className="text-ink">

                  {reviewerName}

                </span>

              </p>

            )}

            {request.decidedAt && (

              <p className="
                mt-1 text-xs text-muted
              ">

                Reviewed on:{' '}

                {displayDate(request.decidedAt)}

              </p>

            )}

            {request.decisionReason && (

              <p className="
                mt-2 text-xs text-muted
                whitespace-pre-wrap break-words
              ">

                Decision comment:{' '}

                {displayValue(request.decisionReason)}

              </p>

            )}

          </div>

        )}

        {/* READ-ONLY MESSAGE */}

        {!canDecide && (

          <div className="
            mb-4 flex items-start gap-2
            rounded-xl border border-line
            bg-surface2/30 p-3
            text-xs text-muted
          ">

            <AlertCircle
              size={16}
              className="shrink-0 text-accent"
            />

            <span>

              {status === 'pending'

                ? 'This request is available for viewing only. No decision is permitted at the current review stage.'

                : 'This request has already been reviewed.'}

            </span>

          </div>

        )}

        {/* DECISION COMMENTS */}

        {canDecide && (

          <div className="mb-4">

            <label

              htmlFor={commentId}

              className="
                text-xs font-semibold
                text-muted uppercase
                tracking-wider block mb-1
              "

            >

              {requestedAction === 'approved'

                ? 'Approval Comment'

                : requestedAction === 'rejected'

                  ? 'Rejection Reason'

                  : 'Decision Comment'}

              {commentRequired
                ? ' (Required)'
                : ''}

            </label>

            <textarea

              id={commentId}

              rows={3}

              placeholder="Enter a comment for this decision."

              value={commentText}

              maxLength={MAX_COMMENT_LENGTH}

              required={commentRequired}

              aria-required={commentRequired}

              aria-invalid={Boolean(validationError)}

              aria-describedby={

                validationError
                  ? errorId
                  : undefined

              }

              disabled={busy}

              onChange={event => {

                setCommentText(event.target.value);

                setValidationError('');

              }}

              className="
                w-full bg-surface2
                border border-line
                rounded-xl p-2.5
                text-xs text-ink
                placeholder:text-muted
                focus:border-accent
                outline-none
                resize-y
                disabled:opacity-60
              "

            />

            <div className="
              mt-1 flex items-start
              justify-between gap-3
            ">

              <p className="
                text-[11px] text-muted
              ">

                {requireComment

                  ? 'A non-empty comment is required.'

                  : 'Comments are optional for approval. A rejection reason is required.'}

              </p>

              <span className="
                shrink-0 text-[11px]
                font-data text-muted
              ">

                {commentText.length}/300

              </span>

            </div>

          </div>

        )}

        {/* VALIDATION ERROR */}

        {validationError && (

          <div

            id={errorId}

            role="alert"

            className="
              mb-3 rounded-xl
              border border-bad/30
              bg-bad/10 p-3
              text-xs text-bad
              flex items-start gap-2
            "

          >

            <AlertCircle

              size={16}

              className="shrink-0"

            />

            <span>

              {validationError}

            </span>

          </div>

        )}

        {/* ACTION BUTTONS */}

        <div className="
          flex flex-wrap items-center
          justify-end gap-2 pt-3
          border-t border-line/60
        ">

          <button

            type="button"

            onClick={handleClose}

            disabled={busy}

            className="
              px-4 py-2 rounded-xl
              text-xs font-semibold
              bg-surface2 border border-line
              text-ink hover:border-accent
              transition
              disabled:cursor-not-allowed
              disabled:opacity-50
            "

          >

            Close

          </button>

          {canReject && (

            <button

              type="button"

              onClick={() =>
                handleDecision('rejected')
              }

              disabled={

                busy ||
                !isValidRejectionComment

              }

              className="
                px-4 py-2 rounded-xl
                text-xs font-bold
                bg-bad text-[#2a0303]
                hover:brightness-105
                transition flex items-center
                gap-1.5
                disabled:cursor-not-allowed
                disabled:opacity-50
              "

            >

              {busy ? (

                <LoaderCircle className="
                  w-3.5 h-3.5 animate-spin
                "/>

              ) : (

                <XCircle className="
                  w-3.5 h-3.5
                "/>

              )}

              {busy

                ? 'Saving...'

                : requestedAction === 'rejected'

                  ? 'Confirm Rejection'

                  : 'Reject'}

            </button>

          )}

          {/* TIMESHEET_CORRECTION_UI_V1 */}

          {canRequestCorrection && (

            <button
              type="button"
              onClick={() =>
                handleDecision('correction-required')
              }
              disabled={
                busy ||
                !decisionReason ||
                decisionReason.length > MAX_COMMENT_LENGTH
              }
              className="
                px-4 py-2.5 rounded-xl
                border border-warn/40
                bg-warn/10 text-warn
                hover:bg-warn/20
                text-sm font-semibold
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {busy
                ? 'Saving...'
                : 'Request Correction'}
            </button>

          )}

          {canApprove && (

            <button

              type="button"

              onClick={() =>
                handleDecision('approved')
              }

              disabled={

                busy ||
                !isValidApprovalComment

              }

              className="
                px-4 py-2 rounded-xl
                text-xs font-bold
                bg-accent text-on-accent
                hover:brightness-105
                transition flex items-center
                gap-1.5
                disabled:cursor-not-allowed
                disabled:opacity-50
              "

            >

              {busy ? (

                <LoaderCircle className="
                  w-3.5 h-3.5 animate-spin
                "/>

              ) : (

                <Check className="
                  w-3.5 h-3.5
                "/>

              )}

              {busy

                ? 'Saving...'

                : requestedAction === 'approved'

                  ? 'Confirm Approval'

                  : 'Approve'}

            </button>

          )}

        </div>

      </div>

    </ModalPortal>

  );

};

export default RequestDetailsModal;
