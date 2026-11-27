import React, {
  useEffect,
  useState,
  useRef
} from 'react';

import {
  Check,
  X,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

import { ModalPortal } from '../common/ModalPortal.jsx';

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_COMMENT_LENGTH = 300;

const ACTION_LABELS = {
  approved: 'Approve',
  rejected: 'Reject'
};

// ============================================================
// APPROVAL COMMENT MODAL
// ============================================================

export const ApprovalCommentModal = ({
  approval,
  action,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false
}) => {

  // ==========================================================
  // STATE
  // ==========================================================

  const [comment, setComment] =
    useState('');

  const [error, setError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const submissionLock = useRef(false);

  const modalVersion = useRef(0);

  const normalizedAction = String(
    action || ''
  ).trim().toLowerCase();

  // ==========================================================
  // RESET MODAL STATE
  // ==========================================================

  useEffect(() => {

    modalVersion.current += 1;

    setComment('');

    setError('');

    if (!submissionLock.current) {
      setSubmitting(false);
    }

  }, [
    isOpen,
    approval?.id,
    normalizedAction
  ]);

  // ==========================================================
  // MODAL VALIDATION
  // ==========================================================

  if (
    !isOpen ||
    !approval ||
    !Object.prototype.hasOwnProperty.call(
      ACTION_LABELS,
      normalizedAction
    )
  ) {
    return null;
  }

  const trimmedComment =
    comment.trim();

  const busy =
    Boolean(isSubmitting) ||
    submitting;

  const label =
    ACTION_LABELS[normalizedAction];

  const isApproval =
    normalizedAction === 'approved';

  const isRejection =
    normalizedAction === 'rejected';

  const isCommentValid =
    trimmedComment.length > 0 &&
    trimmedComment.length <=
      MAX_COMMENT_LENGTH;

  const hasValidRequestId =
    approval.id !== null &&
    approval.id !== undefined &&
    String(approval.id).trim() !== '';

  const canSubmit =
    !busy &&
    isCommentValid &&
    hasValidRequestId &&
    typeof onConfirm === 'function';

  // ==========================================================
  // SAFE MODAL CLOSE
  // ==========================================================

  const handleClose = () => {

    if (
      busy ||
      submissionLock.current
    ) {
      return;
    }

    setComment('');

    setError('');

    onClose?.();
  };

  // ==========================================================
  // CONFIRM APPROVAL / REJECTION
  // ==========================================================

  const handleConfirm = async () => {

    // Prevent repeated submissions.

    if (
      busy ||
      submissionLock.current
    ) {
      return;
    }

    // Validate request ID.

    if (!hasValidRequestId) {

      setError(
        'Request ID is unavailable.'
      );

      return;
    }

    // Validate mandatory decision comment.

    if (!trimmedComment) {

      setError(
        isRejection
          ? 'A rejection reason is required.'
          : 'An approval comment is required.'
      );

      return;
    }

    // Validate comment length.

    if (
      trimmedComment.length >
      MAX_COMMENT_LENGTH
    ) {

      setError(
        `Comments cannot exceed ${MAX_COMMENT_LENGTH} characters.`
      );

      return;
    }

    // Validate approval service.

    if (
      typeof onConfirm !== 'function'
    ) {

      setError(
        'Approval service is unavailable.'
      );

      return;
    }

    const submissionVersion =
      modalVersion.current;

    submissionLock.current = true;

    setError('');

    setSubmitting(true);

    try {

      const result =
        await onConfirm(
          trimmedComment
        );

      // Support existing handlers that return
      // undefined on success, while detecting
      // explicit failure responses.

      if (
        result === false ||
        result?.success === false
      ) {

        throw new Error(
          result?.message ||
          `Unable to ${label.toLowerCase()} this request.`
        );
      }

      // Avoid updating an unrelated modal
      // if the selected request has changed.

      if (
        modalVersion.current ===
        submissionVersion
      ) {

        setComment('');

        setError('');

        onClose?.();
      }

    } catch (submitError) {

      if (
        modalVersion.current ===
        submissionVersion
      ) {

        setError(
          submitError instanceof Error

            ? submitError.message

            : `Unable to ${label.toLowerCase()} this request.`
        );
      }

    } finally {

      submissionLock.current = false;

      setSubmitting(false);
    }
  };

  // ==========================================================
  // MODAL UI
  // ==========================================================

  return (

    <ModalPortal
      onClose={handleClose}
      ariaLabelledby="approval-comment-title"
    >

      <section
        aria-busy={busy}
        className="
          w-full max-w-md
          max-h-[90vh] overflow-y-auto
          space-y-4 rounded-2xl
          border border-[#34515b]
          bg-[#142c37] p-5
          text-white shadow-2xl
        "
      >

        {/* ====================================================
            MODAL HEADER
        ==================================================== */}

        <div className="
          flex items-start justify-between
          gap-3 border-b
          border-white/10 pb-3
        ">

          <div className="
            flex min-w-0
            items-start gap-3
          ">

            <div
              className={`
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl

                ${isApproval
                  ? 'bg-emerald-400/15 text-emerald-300'
                  : 'bg-rose-400/15 text-rose-300'}
              `}
            >

              {isApproval ? (

                <Check className="h-5 w-5" />

              ) : (

                <XCircle className="h-5 w-5" />

              )}

            </div>

            <div className="min-w-0">

              <h2
                id="approval-comment-title"
                className="
                  font-display text-base
                  font-bold break-words
                "
              >

                {label}{' '}

                {approval.requestType ||
                  'request'}?

              </h2>

              <p className="
                mt-1 text-xs
                text-slate-400 break-words
              ">

                {approval.employeeName ||
                  'Employee'}

                {' · '}

                {approval.category ||
                  'Approval'}

              </p>

              {approval.employeeId && (

                <p className="
                  mt-1 text-[11px]
                  font-data text-slate-400
                ">

                  {approval.employeeId}

                </p>

              )}

            </div>

          </div>

          {/* CLOSE BUTTON */}

          <button
            type="button"

            onClick={handleClose}

            disabled={busy}

            className="
              shrink-0 rounded-lg p-2
              text-slate-300 transition
              hover:bg-white/10
              hover:text-white
              disabled:opacity-50
              disabled:cursor-not-allowed
            "

            aria-label="Close approval confirmation"
          >

            <X className="h-4 w-4" />

          </button>

        </div>

        {/* ====================================================
            DECISION INFORMATION
        ==================================================== */}

        <div
          className={`
            flex items-start gap-2
            rounded-xl border
            p-3 text-xs leading-relaxed

            ${isApproval
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
              : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}
          `}
        >

          <AlertCircle className="
            mt-0.5 h-4 w-4 shrink-0
          " />

          <div>

            {isApproval ? (

              <>

                <p className="font-semibold">
                  Confirm Approval
                </p>

                <p className="mt-1">

                  {approval.category ===
                    'Leave Approval'

                    ? 'This confirms your review. Final leave approval may still require HR approval.'

                    : 'Review the request details before confirming your approval.'}

                </p>

              </>

            ) : (

              <>

                <p className="font-semibold">
                  Confirm Rejection
                </p>

                <p className="mt-1">

                  Provide a clear reason
                  for rejecting this request.

                </p>

              </>

            )}

          </div>

        </div>

        {/* ====================================================
            DECISION COMMENT
        ==================================================== */}

        <div>

          <label
            htmlFor="approval-decision-comment"

            className="
              block text-xs
              font-semibold text-slate-300
            "
          >

            {isRejection
              ? 'Rejection Reason'
              : 'Approval Comment'}

            <span className="
              ml-1 text-rose-300
            ">
              *
            </span>

          </label>

          <textarea
            id="approval-decision-comment"

            rows={3}

            maxLength={MAX_COMMENT_LENGTH}

            value={comment}

            disabled={busy}

            onChange={event => {

              setComment(
                event.target.value
              );

              setError('');
            }}

            placeholder={
              isRejection

                ? 'Enter the reason for rejecting this request...'

                : 'Enter your approval comment...'
            }

            className="
              mt-1.5 w-full resize-none
              rounded-xl border
              border-[#34515b]
              bg-[#10242e] p-3
              text-sm text-white
              placeholder:text-slate-500
              focus:border-[#6EE7B7]
              focus:outline-none
              disabled:opacity-60
              disabled:cursor-not-allowed
            "

            aria-required="true"

            aria-invalid={Boolean(error)}

            aria-describedby="approval-comment-help"
          />

          {/* CHARACTER COUNT */}

          <div className="
            mt-1 flex items-center
            justify-between gap-2
          ">

            <span
              id="approval-comment-help"
              className="
                text-[10px] text-slate-400
              "
            >

              Decision comment is required.

            </span>

            <span className={`
              text-[10px]
              font-data tabular-nums

              ${comment.length >=
                MAX_COMMENT_LENGTH

                ? 'text-amber-200'

                : 'text-slate-400'}
            `}>

              {comment.length}/
              {MAX_COMMENT_LENGTH}

            </span>

          </div>

        </div>

        {/* ====================================================
            INVALID REQUEST WARNING
        ==================================================== */}

        {!hasValidRequestId && (

          <div
            role="alert"

            className="
              flex items-start gap-2
              rounded-lg border
              border-rose-400/20
              bg-rose-400/10 p-3
              text-xs text-rose-300
            "
          >

            <AlertCircle className="
              h-4 w-4 shrink-0
            " />

            Request information is incomplete.
            This decision cannot be submitted.

          </div>

        )}

        {/* ====================================================
            ERROR MESSAGE
        ==================================================== */}

        {error && (

          <div
            role="alert"

            className="
              flex items-start gap-2
              rounded-lg border
              border-rose-400/20
              bg-rose-400/10 p-3
              text-xs text-rose-300
            "
          >

            <AlertCircle className="
              h-4 w-4 shrink-0
            " />

            <span className="break-words">

              {error}

            </span>

          </div>

        )}

        {/* ====================================================
            ACTION BUTTONS
        ==================================================== */}

        <div className="
          flex flex-wrap justify-end
          gap-2 border-t
          border-white/10 pt-3
        ">

          {/* CANCEL BUTTON */}

          <button
            type="button"

            onClick={handleClose}

            disabled={busy}

            className="
              rounded-xl border
              border-[#34515b]
              bg-[#10242e]
              px-4 py-2 text-xs
              font-semibold text-slate-200
              hover:bg-white/10
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >

            Cancel

          </button>

          {/* CONFIRM BUTTON */}

          <button
            type="button"

            onClick={handleConfirm}

            disabled={!canSubmit}

            aria-busy={busy}

            className={`
              inline-flex items-center gap-1.5
              rounded-xl px-4 py-2
              text-xs font-bold transition
              disabled:cursor-not-allowed
              disabled:opacity-50

              ${isApproval

                ? 'bg-[#6EE7B7] text-[#07352a] hover:brightness-105'

                : 'bg-rose-400/15 text-rose-200 hover:bg-rose-400/25'}
            `}
          >

            {busy ? (

              <Loader2 className="
                h-3.5 w-3.5 animate-spin
              " />

            ) : isApproval ? (

              <Check className="
                h-3.5 w-3.5
              " />

            ) : (

              <XCircle className="
                h-3.5 w-3.5
              " />

            )}

            {busy

              ? 'Saving...'

              : `Confirm ${label}`}

          </button>

        </div>

      </section>

    </ModalPortal>

  );
};

export default ApprovalCommentModal;