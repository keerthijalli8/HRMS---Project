import React, {
  useState,
  useEffect,
  useRef
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';

import {
  X,
  Star,
  MessageSquare,
  Loader2
} from 'lucide-react';

import { ModalPortal } from '../common/ModalPortal.jsx';

import {
  canReviewPerformance
} from '../../utils/dataScope.js';


// ============================================================
// FEEDBACK CONFIGURATION
// ============================================================

const MAX_FEEDBACK_LENGTH = 1000;

const FEEDBACK_CATEGORIES = [
  'Sprint Commendation',
  'Quarterly Review Note',
  'Coaching & Guidance',
  '1-on-1 Discussion',
  'Excellence Recognition'
];

const getEmployeeId = employee =>
  String(employee?.id || employee?.employeeId || '');


// ============================================================
// FEEDBACK MODAL
// ============================================================

export const FeedbackModal = ({
  isOpen,
  onClose,
  onFeedbackSubmit,
  preselectedEmployee = null
}) => {

  const {
    currentUser,
    teamMembers = []
  } = useTeamLead();

  const canEdit =
    canReviewPerformance(currentUser);

  const [employeeId, setEmployeeId] =
    useState('');

  const [rating, setRating] =
    useState(5);

  const [type, setType] =
    useState('Sprint Commendation');

  const [content, setContent] =
    useState('');

  const [error, setError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const submittingRef = useRef(false);

  const preselectedId =
    getEmployeeId(preselectedEmployee);


  // ==========================================================
  // RESET FORM WHEN MODAL OPENS
  // ==========================================================

  useEffect(() => {

    if (!isOpen) return;

    setEmployeeId(preselectedId);
    setRating(5);
    setType('Sprint Commendation');
    setContent('');
    setError('');
    setIsSubmitting(false);

    submittingRef.current = false;

  }, [isOpen, preselectedId]);


  // ==========================================================
  // VALIDATE SELECTED EMPLOYEE
  // ==========================================================

  useEffect(() => {

    if (!isOpen) return;

    setEmployeeId(previous => {

      const isValid = teamMembers.some(
        member =>
          getEmployeeId(member) === previous
      );

      if (isValid) {
        return previous;
      }

      const validPreselectedMember =
        teamMembers.find(
          member =>
            getEmployeeId(member) === preselectedId
        );

      if (validPreselectedMember) {
        return getEmployeeId(
          validPreselectedMember
        );
      }

      return getEmployeeId(teamMembers[0]);

    });

  }, [
    isOpen,
    preselectedId,
    teamMembers
  ]);


  if (!isOpen) return null;


  // ==========================================================
  // FORM VALIDATION
  // ==========================================================

  const selectedEmployee = teamMembers.find(
    member =>
      getEmployeeId(member) === employeeId
  );

  const cleanContent = content.trim();

  const isFormValid =
    canEdit &&
    Boolean(selectedEmployee) &&
    cleanContent.length > 0 &&
    cleanContent.length <= MAX_FEEDBACK_LENGTH &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5 &&
    FEEDBACK_CATEGORIES.includes(type);


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleClose = () => {

    if (submittingRef.current) {
      return;
    }

    setError('');

    onClose?.();
  };


  // ==========================================================
  // SUBMIT FEEDBACK
  // ==========================================================

  const handleSubmit = async event => {

    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    setError('');

    if (!canEdit) {

      setError(
        'You do not have permission to submit performance feedback.'
      );

      return;
    }

    if (!selectedEmployee) {

      setError(
        'Please select an authorized team member.'
      );

      return;
    }

    if (!FEEDBACK_CATEGORIES.includes(type)) {

      setError(
        'Please select a valid feedback category.'
      );

      return;
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {

      setError(
        'Performance rating must be between 1 and 5.'
      );

      return;
    }

    if (!cleanContent) {

      setError(
        'Please provide feedback remarks.'
      );

      return;
    }

    if (
      cleanContent.length > MAX_FEEDBACK_LENGTH
    ) {

      setError(
        `Feedback cannot exceed ${MAX_FEEDBACK_LENGTH} characters.`
      );

      return;
    }

    if (typeof onFeedbackSubmit !== 'function') {

      setError(
        'Feedback submission is currently unavailable.'
      );

      return;
    }

    submittingRef.current = true;

    setIsSubmitting(true);

    try {

      const result = await onFeedbackSubmit({

        employeeId:
          getEmployeeId(selectedEmployee),

        employeeName:
          selectedEmployee.name,

        rating,

        type,

        content: cleanContent

      });

      // Performance.jsx returns true only
      // after successfully saving feedback.

      if (!result) {

        setError(
          'Unable to save feedback. Please review the details and try again.'
        );

        return;
      }

      setContent('');
      setError('');
      setRating(5);
      setType('Sprint Commendation');

      onClose?.();

    } catch (submissionError) {

      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to submit feedback. Please try again.'
      );

    } finally {

      submittingRef.current = false;

      setIsSubmitting(false);

    }
  };


  // ==========================================================
  // MODAL UI
  // ==========================================================

  return (

    <ModalPortal
      onClose={handleClose}
      ariaLabelledby="feedback-modal-title"
    >

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">

        {/* CLOSE BUTTON */}

        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface2 transition disabled:opacity-50"
          aria-label="Close feedback modal"
        >

          <X className="w-4 h-4" />

        </button>


        {/* MODAL HEADER */}

        <div className="flex items-center gap-2 pb-3 pr-8 border-b border-line/60">

          <div className="w-8 h-8 shrink-0 rounded-lg bg-accent/20 text-accent flex items-center justify-center">

            <MessageSquare className="w-4 h-4" />

          </div>

          <div>

            <h3
              id="feedback-modal-title"
              className="font-display font-bold text-lg text-white"
            >

              Add Performance Feedback

            </h3>

            <span className="text-xs text-muted">

              Record commendations, 1-on-1 coaching
              observations, or review notes.

            </span>

          </div>

        </div>


        {/* PERMISSION WARNING */}

        {!canEdit && (

          <div
            role="alert"
            className="mt-4 rounded-xl border border-bad/30 bg-bad/10 p-3 text-xs text-bad"
          >

            You do not have permission to submit
            performance feedback.

          </div>

        )}


        {/* FEEDBACK FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-3.5 mt-4 text-xs"
        >

          <fieldset
            disabled={isSubmitting || !canEdit}
            className="min-w-0 space-y-3.5 disabled:opacity-70"
          >

            {/* EMPLOYEE SELECTION */}

            <div>

              <label
                htmlFor="feedback-employee"
                className="font-semibold text-ink block mb-1"
              >

                Select Team Member

                <span className="text-bad ml-1">
                  *
                </span>

              </label>

              <select
                id="feedback-employee"
                required

                value={employeeId}

                onChange={event => {
                  setEmployeeId(event.target.value);
                  setError('');
                }}

                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              >

                <option value="">

                  Select Employee

                </option>

                {teamMembers
                  .filter(member =>
                    Boolean(getEmployeeId(member))
                  )
                  .map(member => (

                    <option
                      key={getEmployeeId(member)}
                      value={getEmployeeId(member)}
                      className="bg-[#06141c]"
                    >

                      {member.name} — {member.designation}

                    </option>

                  ))}

              </select>

              {teamMembers.length === 0 && (

                <p className="mt-1 text-[11px] text-warn">

                  No authorized team members available.

                </p>

              )}

            </div>


            {/* SELECTED EMPLOYEE DETAILS */}

            {selectedEmployee && (

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2/40 border border-line/50 p-3">

                <div>

                  <p className="font-semibold text-ink">

                    {selectedEmployee.name}

                  </p>

                  <p className="mt-0.5 text-[10px] text-muted">

                    {selectedEmployee.designation}

                  </p>

                </div>

                <span className="font-data text-[11px] text-accent">

                  {getEmployeeId(selectedEmployee)}

                </span>

              </div>

            )}


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* FEEDBACK CATEGORY */}

              <div>

                <label
                  htmlFor="feedback-category"
                  className="font-semibold text-ink block mb-1"
                >

                  Feedback Category

                  <span className="text-bad ml-1">
                    *
                  </span>

                </label>

                <select
                  id="feedback-category"
                  required

                  value={type}

                  onChange={event => {
                    setType(event.target.value);
                    setError('');
                  }}

                  className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
                >

                  {FEEDBACK_CATEGORIES.map(category => (

                    <option
                      key={category}
                      value={category}
                      className="bg-[#06141c]"
                    >

                      {category}

                    </option>

                  ))}

                </select>

              </div>


              {/* PERFORMANCE RATING */}

              <div>

                <label className="font-semibold text-ink block mb-1">

                  Performance Rating

                  <span className="text-bad ml-1">
                    *
                  </span>

                </label>

                <div
                  role="group"
                  aria-label="Performance rating"
                  className="flex items-center gap-1.5 pt-1"
                >

                  {[1, 2, 3, 4, 5].map(star => (

                    <button
                      key={star}
                      type="button"

                      onClick={() => {
                        setRating(star);
                        setError('');
                      }}

                      aria-label={`${star} star rating`}
                      aria-pressed={rating === star}

                      className="p-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >

                      <Star
                        className={`w-5 h-5 transition ${
                          star <= rating
                            ? 'fill-accent text-accent'
                            : 'text-muted'
                        }`}
                      />

                    </button>

                  ))}

                  <span className="ml-1 font-bold text-ink">

                    {rating}/5

                  </span>

                </div>

              </div>

            </div>


            {/* FEEDBACK REMARKS */}

            <div>

              <label
                htmlFor="feedback-remarks"
                className="font-semibold text-ink block mb-1"
              >

                Feedback Remarks

                <span className="text-bad ml-1">
                  *
                </span>

              </label>

              <textarea
                id="feedback-remarks"
                rows={4}
                required

                maxLength={MAX_FEEDBACK_LENGTH}

                placeholder="Detail specific milestones achieved, architectural improvements, or areas for skill development..."

                value={content}

                onChange={event => {
                  setContent(event.target.value);
                  setError('');
                }}

                aria-describedby="feedback-character-count"

                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink placeholder:text-muted focus:border-accent outline-none resize-y"
              />

              <div className="flex items-center justify-between gap-2 mt-1">

                <span className="text-[10px] text-muted">

                  Provide clear and constructive feedback.

                </span>

                <span
                  id="feedback-character-count"

                  className={`text-[10px] font-medium ${
                    content.length >= MAX_FEEDBACK_LENGTH
                      ? 'text-warn'
                      : 'text-muted'
                  }`}
                >

                  {content.length}/{MAX_FEEDBACK_LENGTH}

                </span>

              </div>

            </div>

          </fieldset>


          {/* VALIDATION ERROR */}

          {error && (

            <div
              role="alert"
              className="rounded-xl border border-bad/30 bg-bad/10 p-3 text-xs text-bad"
            >

              {error}

            </div>

          )}


          {/* FOOTER ACTIONS */}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/60">

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}

              className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink hover:border-accent transition disabled:opacity-50"
            >

              Cancel

            </button>


            <button
              type="submit"

              disabled={
                isSubmitting || !isFormValid
              }

              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-accent text-on-accent hover:brightness-105 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >

              {isSubmitting && (

                <Loader2 className="w-3.5 h-3.5 animate-spin" />

              )}

              {isSubmitting
                ? 'Saving Feedback...'
                : 'Submit Feedback'}

            </button>

          </div>

        </form>

      </div>

    </ModalPortal>

  );

};

export default FeedbackModal;