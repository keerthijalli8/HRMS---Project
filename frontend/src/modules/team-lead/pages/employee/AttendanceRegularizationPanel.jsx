// EMPLOYEE_REGULARIZATION_UI_V1

import React, {
  useState,
  useEffect,
  useRef
} from 'react';

import {
  Plus,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

import {
  ModalPortal
} from '../../components/common/ModalPortal.jsx';

import {
  attendanceRegularizationService
} from '../../services/api.js';

const TYPES = [
  'Missed Check-in',
  'Missed Check-out',
  'Incorrect Punch Time'
];

const INITIAL_FORM = {
  attendanceDate: '',
  requestType: 'Missed Check-out',
  requestedCheckIn: '',
  requestedCheckOut: '',
  reason: ''
};

const STATUS_OPTIONS = [
  ['all', 'All Statuses'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected']
];

const INPUT_CLASS = `
  mt-2 h-11 w-full min-w-0
  rounded-xl border border-line
  bg-surface2 px-3 text-sm text-ink
  outline-none focus:border-accent
  disabled:opacity-60
`;

const ACTION_CLASS = `
  inline-flex items-center justify-center
  gap-2 rounded-xl bg-accent
  px-4 py-2.5 text-xs font-semibold
  text-on-accent hover:brightness-105
  transition disabled:cursor-not-allowed
  disabled:opacity-50
`;

const SECONDARY_CLASS = `
  inline-flex items-center justify-center
  rounded-xl border border-line
  bg-surface2 px-4 py-2.5
  text-xs font-semibold text-ink
  hover:border-accent disabled:opacity-50
`;

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const todayKey = () => {

  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const formatPunch = value => {

  if (value == null || value === '') {
    return 'Not recorded';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatDay = value => {

  if (!value) return 'Not available';

  const date = new Date(
    `${String(value).slice(0, 10)}T00:00:00`
  );

  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
};

const statusClass = status => {

  if (normalize(status) === 'approved') {
    return 'border-good/30 bg-good/10 text-good';
  }

  if (normalize(status) === 'rejected') {
    return 'border-bad/30 bg-bad/10 text-bad';
  }

  return 'border-warn/30 bg-warn/10 text-warn';
};

const Status = ({ status }) => (

  <span className={`
    inline-flex rounded-lg border
    px-3 py-1.5 text-xs font-semibold
    capitalize whitespace-nowrap
    ${statusClass(status)}
  `}>

    {status || 'Unknown'}

  </span>

);

const FieldValue = ({ label, value }) => (

  <div className="min-w-0">

    <p className="text-xs text-muted">
      {label}
    </p>

    <p className="
      mt-1 break-words text-sm
      font-medium text-ink
    ">
      {value}
    </p>

  </div>

);

export default function AttendanceRegularizationPanel({
  user,
  records = []
}) {

  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  const [filter, setFilter] = useState('all');

  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    ...INITIAL_FORM
  });

  const [error, setError] = useState('');

  const [message, setMessage] = useState('');

  const [busy, setBusy] = useState(false);

  const lock = useRef(false);

  const alive = useRef(true);

  const refreshSequence = useRef(0);

  const userRef = useRef(user);

  userRef.current = user;

  const accountId = String(
    user?.employeeId ||
    user?.id ||
    user?.userId ||
    ''
  );

  const reload = async () => {

    const sequence =
      ++refreshSequence.current;

    try {

      if (!accountId) {

        if (alive.current) {
          setRequests([]);
          setLoading(false);
        }

        return;

      }

      const result =
        await attendanceRegularizationService
          .getMyRequests(userRef.current);

      if (
        alive.current &&
        sequence === refreshSequence.current
      ) {

        setRequests(
          Array.isArray(result)
            ? result
            : []
        );

        setLoadError('');

      }

    } catch (err) {

      if (
        alive.current &&
        sequence === refreshSequence.current
      ) {

        setLoadError(
          err?.message ||
          'Unable to load regularization requests.'
        );

      }

    } finally {

      if (
        alive.current &&
        sequence === refreshSequence.current
      ) {

        setLoading(false);

      }

    }
  };

  useEffect(() => {

    alive.current = true;

    setLoading(true);

    setRequests([]);

    reload();

    const handleStorage = event => {

      if (
        event.key === null ||
        event.key === 'technomold_teamlead_approvals'
      ) {
        reload();
      }
    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    window.addEventListener(
      'focus',
      reload
    );

    window.addEventListener(
      'technomold:teamlead:approval-updated',
      reload
    );

    return () => {

      alive.current = false;

      refreshSequence.current += 1;

      window.removeEventListener(
        'storage',
        handleStorage
      );

      window.removeEventListener(
        'focus',
        reload
      );

      window.removeEventListener(
        'technomold:teamlead:approval-updated',
        reload
      );

    };

  }, [accountId]);

  const selectedRecord = records.find(record =>
    record?.dateKey === form.attendanceDate
  );

  const needsCheckIn =
    form.requestType !== 'Missed Check-out';

  const needsCheckOut =
    form.requestType !== 'Missed Check-in';

  const filtered = requests.filter(request => {

    const matchesStatus =
      filter === 'all' ||
      normalize(request.status) === filter;

    const matchesSearch = normalize([

      request.id,
      request.requestType,
      request.attendanceDate,
      request.reason

    ].filter(Boolean).join(' '))

      .includes(normalize(search));

    return matchesStatus && matchesSearch;
  });

  const PAGE_SIZE = 6;

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const displayed = filtered.slice(

    (currentPage - 1) * PAGE_SIZE,

    currentPage * PAGE_SIZE
  );

  const updateForm = (key, value) => {

    setError('');

    setForm(previous => ({

      ...previous,

      [key]: value,

      ...(
        ['attendanceDate', 'requestType'].includes(key)
          ? {
              requestedCheckIn: '',
              requestedCheckOut: ''
            }
          : {}
      )

    }));
  };

  const openForm = () => {

    setForm({
      ...INITIAL_FORM
    });

    setError('');
    setMessage('');
    setOpen(true);
  };

  const closeForm = () => {

    if (lock.current) return;

    setOpen(false);
    setError('');
  };

  const submit = async event => {

    event.preventDefault();

    if (lock.current || !accountId) return;

    lock.current = true;

    setBusy(true);

    setError('');

    try {

      const result =
        await attendanceRegularizationService
          .submitRequest(
            {
              ...form,

              requestedCheckIn:
                needsCheckIn
                  ? form.requestedCheckIn
                  : '',

              requestedCheckOut:
                needsCheckOut
                  ? form.requestedCheckOut
                  : ''
            },

            userRef.current
          );

      if (!result?.id) {

        throw new Error(
          'Request submission could not be confirmed.'
        );

      }

      if (!alive.current) return;

      setRequests(previous => [

        result,

        ...previous.filter(
          item => item.id !== result.id
        )

      ]);

      setForm({
        ...INITIAL_FORM
      });

      setOpen(false);

      setFilter('all');

      setSearch('');

      setPage(1);

      setMessage(
        'Regularization request submitted successfully. Pending authorized review.'
      );

      await reload();

    } catch (err) {

      if (alive.current) {

        setError(
          err?.message ||
          'Unable to submit attendance correction.'
        );

      }

    } finally {

      lock.current = false;

      if (alive.current) {

        setBusy(false);

      }

    }
  };

  return (

    <section className="glass-card !p-5 space-y-5">

      {/* SECTION HEADER */}

      <div className="
        flex flex-wrap items-center
        justify-between gap-3
      ">

        <h3 className="
          font-display text-base
          font-semibold text-ink
        ">
          Attendance Regularization
        </h3>

        <button
          type="button"
          disabled={!accountId || loading || busy}
          onClick={openForm}
          className={ACTION_CLASS}
        >

          <Plus size={17} />

          Apply for Regularization

        </button>

      </div>

      {/* REQUEST SUMMARY */}

      <div className="grid grid-cols-3 gap-3">

        {[
          ['pending', 'Pending', 'text-warn'],
          ['approved', 'Approved', 'text-good'],
          ['rejected', 'Rejected', 'text-bad']
        ].map(([key, label, color]) => (

          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => {
              setFilter(key);
              setPage(1);
            }}
            className={`
              rounded-xl border
              bg-surface2/35 p-4
              text-left transition
              ${filter === key
                ? 'border-accent'
                : 'border-line/50'}
            `}
          >

            <p className="text-xs text-muted">
              {label}
            </p>

            <p className={`
              mt-2 font-data text-2xl
              font-bold ${color}
            `}>

              {requests.filter(item =>
                normalize(item.status) === key
              ).length}

            </p>

          </button>

        ))}

      </div>

      {message && (

        <div role="status" className="
          flex items-start gap-2
          rounded-xl border border-good/25
          bg-good/10 p-3 text-xs text-good
        ">

          <CheckCircle
            size={16}
            className="shrink-0"
          />

          {message}

        </div>

      )}

      {loadError && (

        <div role="alert" className="
          rounded-xl bg-bad/10
          p-3 text-xs text-bad
        ">

          {loadError}

          <button
            type="button"
            onClick={reload}
            className="ml-2 underline"
          >
            Retry
          </button>

        </div>

      )}

      {/* REQUEST HISTORY TOOLBAR */}

      <div className="
        flex flex-wrap items-center
        justify-between gap-3
        border-t border-line/50 pt-4
      ">

        <h4 className="
          text-sm font-semibold text-ink
        ">

          Request History

        </h4>

        <div className="
          flex w-full flex-wrap gap-2
          sm:w-auto
        ">

          <input
            type="search"
            aria-label="Search regularization requests"
            placeholder="Search requests..."
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="
              h-10 min-w-0 flex-1
              rounded-xl border border-line
              bg-surface2 px-3 text-xs text-ink
              outline-none focus:border-accent
              sm:w-52
            "
          />

          <select
            aria-label="Regularization status"
            value={filter}
            onChange={event => {
              setFilter(event.target.value);
              setPage(1);
            }}
            className="
              h-10 rounded-xl
              border border-line bg-surface2
              px-3 text-xs text-ink
            "
          >

            {STATUS_OPTIONS.map(([key, label]) => (

              <option key={key} value={key}>
                {label}
              </option>

            ))}

          </select>

        </div>

      </div>

      {/* REQUEST HISTORY */}

      {loading ? (

        <div className="
          flex items-center justify-center
          gap-2 py-8 text-sm text-muted
        ">

          <Loader2
            size={17}
            className="animate-spin"
          />

          Loading requests...

        </div>

      ) : displayed.length ? (

        <div className="space-y-3">

          {displayed.map(request => (

            <article
              key={request.id}
              className="
                rounded-xl border border-line/50
                bg-surface2/35 p-4
                space-y-4
              "
            >

              <div className="
                flex flex-wrap items-start
                justify-between gap-3
              ">

                <div>

                  <p className="
                    text-sm font-semibold text-ink
                  ">

                    {request.requestType}

                  </p>

                  <p className="
                    mt-1 text-xs text-muted
                  ">

                    {formatDay(
                      request.attendanceDate ||
                      request.fromDate
                    )}

                  </p>

                </div>

                <Status status={request.status} />

              </div>

              <div className="
                grid grid-cols-2 gap-4
                lg:grid-cols-4
              ">

                <FieldValue
                  label="Original Check-In"
                  value={formatPunch(
                    request.originalCheckIn ??
                    request.actualCheckIn ??
                    request.originalPunchIn
                  )}
                />

                <FieldValue
                  label="Requested Check-In"
                  value={
                    (
                      request.requestedCheckIn ??
                      request.correctedCheckIn ??
                      request.requestedPunchIn
                    ) != null
                      ? formatPunch(
                          request.requestedCheckIn ??
                          request.correctedCheckIn ??
                          request.requestedPunchIn
                        )
                      : 'Not requested'
                  }
                />

                <FieldValue
                  label="Original Check-Out"
                  value={formatPunch(
                    request.originalCheckOut ??
                    request.actualCheckOut ??
                    request.originalPunchOut
                  )}
                />

                <FieldValue
                  label="Requested Check-Out"
                  value={
                    (
                      request.requestedCheckOut ??
                      request.correctedCheckOut ??
                      request.requestedPunchOut
                    ) != null
                      ? formatPunch(
                          request.requestedCheckOut ??
                          request.correctedCheckOut ??
                          request.requestedPunchOut
                        )
                      : 'Not requested'
                  }
                />

              </div>

              <div className="
                border-t border-line/50 pt-3
              ">

                <p className="text-xs text-muted">
                  Reason
                </p>

                <p className="
                  mt-1 whitespace-pre-wrap
                  break-words text-sm text-ink
                ">

                  {request.reason || 'Not provided'}

                </p>

              </div>

              {request.decisionReason && (

                <div className="
                  rounded-lg bg-surface/50
                  p-3 text-xs
                ">

                  <p className="font-semibold text-muted">
                    Review Comment
                  </p>

                  <p className="
                    mt-1 whitespace-pre-wrap
                    break-words text-ink
                  ">

                    {request.decisionReason}

                  </p>

                </div>

              )}

              {request.attendanceCorrection?.status ===
                'applied' && (

                  <p className="
                    flex items-center gap-2
                    text-xs font-semibold text-good
                  ">

                    <CheckCircle size={15} />

                    Attendance correction applied

                  </p>

              )}

              {normalize(request.status) === 'approved' &&
                request.attendanceCorrection?.status !==
                  'applied' && (

                  <p className="text-xs text-muted">

                    Attendance synchronization not confirmed.

                  </p>

              )}

              <div className="
                flex flex-wrap justify-between gap-2
                text-[11px] text-muted
              ">

                <span className="break-all">
                  {request.id}
                </span>

                <span>

                  Submitted: {formatPunch(
                    request.submittedAt ||
                    request.requestDate
                  )}

                </span>

                {request.decidedAt && (

                  <span>

                    Reviewed: {formatPunch(
                      request.decidedAt
                    )}

                  </span>

                )}

              </div>

            </article>

          ))}

        </div>

      ) : (

        <div className="
          rounded-xl border border-dashed
          border-line p-8 text-center
        ">

          <Clock className="
            mx-auto h-7 w-7 text-accent/70
          " />

          <p className="
            mt-3 text-sm font-semibold text-ink
          ">

            {loadError

              ? 'Request history unavailable'

              : requests.length

                ? 'No matching requests'

                : 'No regularization requests yet'}

          </p>

        </div>

      )}

      {totalPages > 1 && (

        <div className="
          flex items-center justify-between gap-3
        ">

          <span className="text-xs text-muted">

            Page {currentPage} of {totalPages}

          </span>

          <div className="flex gap-2">

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setPage(currentPage - 1)
              }
              className={SECONDARY_CLASS}
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage(currentPage + 1)
              }
              className={SECONDARY_CLASS}
            >
              Next
            </button>

          </div>

        </div>

      )}

      {/* APPLY REGULARIZATION MODAL */}

      {open && (

        <ModalPortal
          onClose={closeForm}
          ariaLabelledby="attendance-correction-title"
        >

          <form
            onSubmit={submit}
            aria-busy={busy}
            className="
              w-full max-w-xl max-h-[90vh]
              overflow-y-auto rounded-2xl
              border border-line bg-[#142c37]
              p-5 text-ink shadow-2xl
              space-y-5
            "
          >

            <div className="
              flex items-center justify-between
              gap-3 border-b border-line/60 pb-4
            ">

              <h3
                id="attendance-correction-title"
                className="
                  font-display text-lg font-bold
                "
              >

                Apply for Regularization

              </h3>

              <button
                type="button"
                disabled={busy}
                onClick={closeForm}
                aria-label="Close regularization form"
                className="
                  rounded-lg p-2 text-muted
                  hover:bg-surface2
                "
              >

                <X size={19} />

              </button>

            </div>

            <fieldset
              disabled={busy}
              className="min-w-0 space-y-4"
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <label className="
                  text-xs font-semibold text-muted
                ">

                  Attendance Date

                  <input
                    type="date"
                    required
                    value={form.attendanceDate}
                    max={todayKey()}
                    onChange={event =>
                      updateForm(
                        'attendanceDate',
                        event.target.value
                      )
                    }
                    style={{ colorScheme: 'dark' }}
                    className={INPUT_CLASS}
                  />

                </label>

                <label className="
                  text-xs font-semibold text-muted
                ">

                  Correction Type

                  <select
                    value={form.requestType}
                    onChange={event =>
                      updateForm(
                        'requestType',
                        event.target.value
                      )
                    }
                    className={INPUT_CLASS}
                  >

                    {TYPES.map(type => (

                      <option key={type} value={type}>
                        {type}
                      </option>

                    ))}

                  </select>

                </label>

              </div>

              {form.attendanceDate && (

                <div className="
                  rounded-xl border border-line/50
                  bg-surface2/40 p-4
                ">

                  <h4 className="
                    mb-3 text-sm font-semibold
                  ">

                    Original Attendance

                  </h4>

                  {selectedRecord ? (

                    <div className="
                      grid gap-3 sm:grid-cols-2
                    ">

                      <FieldValue
                        label="Original Check-In"
                        value={formatPunch(
                          selectedRecord.checkInTime
                        )}
                      />

                      <FieldValue
                        label="Original Check-Out"
                        value={formatPunch(
                          selectedRecord.checkOutTime
                        )}
                      />

                    </div>

                  ) : (

                    <p className="
                      text-xs leading-relaxed text-muted
                    ">

                      No personal attendance log is
                      displayed for this date.
                      Saved attendance records will be
                      validated before submission.

                    </p>

                  )}

                </div>

              )}

              <div className="grid gap-4 sm:grid-cols-2">

                {needsCheckIn && (

                  <label className="
                    text-xs font-semibold text-muted
                  ">

                    Requested Check-In

                    <input
                      type="datetime-local"
                      required={
                        form.requestType === 'Missed Check-in'
                      }
                      value={form.requestedCheckIn}
                      onChange={event =>
                        updateForm(
                          'requestedCheckIn',
                          event.target.value
                        )
                      }
                      style={{ colorScheme: 'dark' }}
                      className={INPUT_CLASS}
                    />

                  </label>

                )}

                {needsCheckOut && (

                  <label className="
                    text-xs font-semibold text-muted
                  ">

                    Requested Check-Out

                    <input
                      type="datetime-local"
                      required={
                        form.requestType === 'Missed Check-out'
                      }
                      value={form.requestedCheckOut}
                      onChange={event =>
                        updateForm(
                          'requestedCheckOut',
                          event.target.value
                        )
                      }
                      style={{ colorScheme: 'dark' }}
                      className={INPUT_CLASS}
                    />

                  </label>

                )}

              </div>

              {form.requestType ===
                'Incorrect Punch Time' && (

                  <p className="
                    text-xs text-muted
                  ">

                    Enter the punch that requires correction.
                    Leave an unchanged punch empty.

                  </p>

              )}

              <label className="
                block text-xs font-semibold text-muted
              ">

                Reason for Correction

                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={form.reason}
                  placeholder="Explain why the attendance correction is required..."
                  onChange={event =>
                    updateForm(
                      'reason',
                      event.target.value
                    )
                  }
                  className="
                    mt-2 w-full resize-y rounded-xl
                    border border-line bg-surface2
                    p-3 text-sm text-ink
                    outline-none focus:border-accent
                  "
                />

                <span className="
                  mt-1 block text-right
                  text-[11px] text-muted
                ">

                  {form.reason.length}/1000

                </span>

              </label>

            </fieldset>

            <p className="
              text-xs leading-relaxed text-muted
            ">

              Attendance records will change only
              after authorized approval.
              Enter times using your local device time.

            </p>

            {error && (

              <div role="alert" className="
                flex items-start gap-2 rounded-xl
                border border-bad/30 bg-bad/10
                p-3 text-xs text-bad
              ">

                <AlertCircle
                  size={17}
                  className="shrink-0"
                />

                <span>{error}</span>

              </div>

            )}

            <div className="
              flex justify-end gap-3
              border-t border-line/60 pt-4
            ">

              <button
                type="button"
                disabled={busy}
                onClick={closeForm}
                className={SECONDARY_CLASS}
              >

                Cancel

              </button>

              <button
                type="submit"
                disabled={
                  busy ||
                  !form.attendanceDate ||
                  !form.reason.trim() ||
                  (
                    !form.requestedCheckIn &&
                    !form.requestedCheckOut
                  )
                }
                className={ACTION_CLASS}
              >

                {busy ? (

                  <>

                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Submitting...

                  </>

                ) : (

                  <>

                    <CheckCircle size={16} />

                    Submit Request

                  </>

                )}

              </button>

            </div>

          </form>

        </ModalPortal>

      )}

    </section>

  );
}