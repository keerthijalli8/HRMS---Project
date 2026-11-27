// EMPLOYEE_TIMESHEET_UI_V1

import React, {
  useEffect,
  useState,
  useRef
} from 'react';

import {
  Plus,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

import {
  employeeTimesheetService
} from '../../services/api.js';

import {
  ModalPortal
} from '../../components/common/ModalPortal.jsx';

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const dateKey = value => {

  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

};

const lastWeekStart = () => {

  const date = new Date();

  const offset =
    (date.getDay() + 6) % 7;

  date.setDate(
    date.getDate() - offset - 7
  );

  return dateKey(date);

};

const weekDates = start => {

  const first =
    new Date(`${start}T00:00:00`);

  if (
    Number.isNaN(first.getTime()) ||
    first.getDay() !== 1
  ) {
    return [];
  }

  return Array.from({ length: 7 }, (_, index) => {

    const date = new Date(first);

    date.setDate(
      first.getDate() + index
    );

    return dateKey(date);

  });

};

const emptyEntries = start =>
  weekDates(start).map(date => ({

    date,
    projectId: '',
    taskId: '',
    hours: ''

  }));

const formatDate = value => {

  if (!value) return '-';

  const date = new Date(
    `${String(value).slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

};

const statusStyle = status => {

  if (normalize(status) === 'approved') {
    return 'bg-good/10 text-good border-good/30';
  }

  if (normalize(status) === 'rejected') {
    return 'bg-bad/10 text-bad border-bad/30';
  }

  return 'bg-warn/10 text-warn border-warn/30';

};

const inputClass = `
  h-10 w-full min-w-0 rounded-lg
  border border-line bg-surface2
  px-3 text-xs text-ink outline-none
  focus:border-accent
  disabled:opacity-50
`;

const primaryButton = `
  inline-flex items-center justify-center
  gap-2 rounded-xl bg-accent
  px-4 py-2.5 text-xs font-bold
  text-on-accent hover:brightness-105
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const secondaryButton = `
  rounded-xl border border-line
  bg-surface2 px-4 py-2.5
  text-xs font-semibold text-ink
  hover:border-accent
  disabled:opacity-50
`;

export default function EmployeeTimesheet({
  user
}) {

  const [requests, setRequests] = useState([]);

  const [projects, setProjects] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  const [filter, setFilter] = useState('all');

  const [open, setOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [weekStart, setWeekStart] =
    useState(lastWeekStart);

  const [entries, setEntries] = useState(
    () => emptyEntries(lastWeekStart())
  );

  const [attendance, setAttendance] =
    useState({});

  const [attendanceLoading, setAttendanceLoading] =
    useState(false);

  const [reason, setReason] = useState('');

  const [reviewComment, setReviewComment] =
    useState('');

  const [error, setError] = useState('');

  const [message, setMessage] = useState('');

  const [busy, setBusy] = useState(false);

  const lock = useRef(false);

  const alive = useRef(true);

  const sequence = useRef(0);

  const userRef = useRef(user);

  userRef.current = user;

  const accountId = String(
    user?.employeeId ||
    user?.id ||
    user?.userId ||
    ''
  );

  const reload = async () => {

    const current = ++sequence.current;

    try {

      if (!accountId) {
        setRequests([]);
        setProjects([]);
        setTasks([]);
        setLoading(false);
        return;
      }

      const [history, options] =
        await Promise.all([

          employeeTimesheetService.getMyRequests(
            userRef.current
          ),

          employeeTimesheetService.getOptions(
            userRef.current
          )

        ]);

      if (
        alive.current &&
        current === sequence.current
      ) {

        setRequests(history);
        setProjects(options.projects);
        setTasks(options.tasks);
        setLoadError('');

      }

    } catch (err) {

      if (
        alive.current &&
        current === sequence.current
      ) {

        setLoadError(
          err?.message ||
          'Unable to load timesheet records.'
        );

      }

    } finally {

      if (
        alive.current &&
        current === sequence.current
      ) {

        setLoading(false);

      }

    }

  };

  useEffect(() => {

    alive.current = true;

    setLoading(true);

    reload();

    const handleStorage = event => {

      if (
        event.key === null ||
        event.key === 'technomold_teamlead_approvals' ||
        event.key === 'technomold_teamlead_projects' ||
        event.key === 'technomold_teamlead_tasks'
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

      sequence.current += 1;

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

  useEffect(() => {

    let cancelled = false;

    if (!open || !weekDates(weekStart).length) {

      setAttendance({});
      setAttendanceLoading(false);

      return;

    }

    setAttendance({});
    setAttendanceLoading(true);

    employeeTimesheetService
      .getWeekAttendance(
        weekStart,
        userRef.current
      )

      .then(result => {

        if (!cancelled) {
          setAttendance(result);
        }

      })

      .catch(err => {

        if (!cancelled) {
          setError(err.message);
        }

      })

      .finally(() => {

        if (!cancelled) {
          setAttendanceLoading(false);
        }

      });

    return () => {
      cancelled = true;
    };

  }, [open, weekStart, accountId]);

  const dates = weekDates(weekStart);

  const totalHours = Math.round(

    entries.reduce(
      (sum, item) =>
        sum + (Number(item.hours) || 0),
      0
    ) * 100

  ) / 100;

  const displayed = requests.filter(item =>
    filter === 'all' ||
    normalize(item.status) === filter
  );

  const openNew = () => {

    const start = lastWeekStart();

    setWeekStart(start);

    setEntries(emptyEntries(start));

    setEditingId(null);

    setReason('');

    setReviewComment('');

    setError('');

    setMessage('');

    setOpen(true);

  };

  const openCorrection = request => {

    const start =
      request.weekStart ||
      request.fromDate;

    const days = weekDates(start);

    if (
      !days.length ||
      days[6] !== (
        request.weekEnd ||
        request.toDate
      )
    ) {

      setMessage(
        'This legacy request has an unsupported weekly period.'
      );

      return;

    }

    setWeekStart(start);

    const previous = Array.isArray(
      request.timesheetEntries
    )
      ? request.timesheetEntries
      : [];

    setEntries(days.map(date => {

      const existing = previous.find(item =>
        item.date === date
      );

      return {

        date,

        projectId: existing?.projectId || '',

        taskId: existing?.taskId || '',

        hours: existing?.hours ?? ''

      };

    }));

    setEditingId(request.id);

    setReason(request.reason || '');

    setReviewComment(
      request.decisionReason || ''
    );

    setError('');

    setMessage('');

    setOpen(true);

  };

  const updateEntry = (
    index,
    key,
    value
  ) => {

    setError('');

    setEntries(previous =>
      previous.map((item, position) =>
        index !== position
          ? item
          : {

              ...item,

              [key]: value,

              ...(key === 'projectId'
                ? { taskId: '' }
                : {})

            }
      )
    );

  };

  const closeForm = () => {

    if (lock.current) return;

    setOpen(false);
    setError('');

  };

  const submit = async event => {

    event.preventDefault();

    if (lock.current) return;

    lock.current = true;

    setBusy(true);
    setError('');

    try {

      const result =
        await employeeTimesheetService.submit({

          requestId: editingId,

          weekStart,

          reason,

          entries: entries.filter(item =>
            item.hours !== '' &&
            Number(item.hours) !== 0
          )

        }, userRef.current);

      if (!result?.id) {
        throw new Error(
          'Timesheet submission could not be confirmed.'
        );
      }

      if (!alive.current) return;

      setRequests(previous => [

        result,

        ...previous.filter(item =>
          item.id !== result.id
        )

      ]);

      setOpen(false);

      setFilter('all');

      setMessage(

        editingId

          ? 'Corrected timesheet resubmitted for review.'

          : 'Timesheet submitted for Team Lead review.'

      );

      await reload();

    } catch (err) {

      if (alive.current) {
        setError(
          err?.message ||
          'Unable to submit timesheet.'
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

      <div className="
        flex flex-wrap items-center
        justify-between gap-3
      ">

        <h3 className="
          font-display text-base
          font-semibold text-ink
        ">

          Timesheet Management

        </h3>

        <button
          type="button"
          disabled={
            !accountId ||
            loading ||
            Boolean(loadError)
          }
          onClick={openNew}
          className={primaryButton}
        >

          <Plus size={16}/>

          Create Timesheet

        </button>

      </div>

      {/* TIMESHEET SUMMARY */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        {[

          ['pending', 'Pending', 'text-warn'],

          ['approved', 'Approved', 'text-good'],

          ['rejected', 'Rejected', 'text-bad'],

          ['correction-required', 'Correction Required', 'text-warn']

        ].map(([key, label, color]) => (

          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`
              rounded-xl border
              bg-surface2/35 p-4 text-left
              ${filter === key
                ? 'border-accent'
                : 'border-line/50'}
            `}
          >

            <p className="text-xs text-muted">
              {label}
            </p>

            <p className={`mt-2 text-2xl font-bold ${color}`}>

              {requests.filter(item =>
                normalize(item.status) === key
              ).length}

            </p>

          </button>

        ))}

      </div>

      {loadError && (

        <p role="alert" className="
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

        </p>

      )}

      {message && (

        <p role="status" className="
          rounded-xl bg-surface2
          p-3 text-xs text-ink
        ">

          {message}

        </p>

      )}

      <div className="
        flex items-center justify-between
        gap-3 border-t border-line/50 pt-4
      ">

        <h4 className="text-sm font-semibold text-ink">

          Timesheet History

        </h4>

        <select
          aria-label="Filter timesheets"
          value={filter}
          onChange={event =>
            setFilter(event.target.value)
          }
          className={`${inputClass} !w-auto`}
        >

          <option value="all">All Statuses</option>

          <option value="pending">Pending</option>

          <option value="approved">Approved</option>

          <option value="rejected">Rejected</option>

          <option value="correction-required">
            Correction Required
          </option>

        </select>

      </div>

      {loading ? (

        <p className="py-8 text-center text-xs text-muted">
          Loading timesheets...
        </p>

      ) : displayed.length ? (

        <div className="space-y-3">

          {displayed.map(request => (

            <article
              key={request.id}
              className="
                rounded-xl border border-line/50
                bg-surface2/35 p-4 space-y-3
              "
            >

              <div className="
                flex flex-wrap items-start
                justify-between gap-3
              ">

                <div>

                  <p className="text-sm font-semibold text-ink">

                    {formatDate(
                      request.weekStart ||
                      request.fromDate
                    )}

                    {' - '}

                    {formatDate(
                      request.weekEnd ||
                      request.toDate
                    )}

                  </p>

                  <p className="mt-1 text-xs text-muted">

                    {request.projectName || 'Project not provided'}

                  </p>

                </div>

                <span className={`
                  rounded-lg border px-3 py-1.5
                  text-xs font-semibold capitalize
                  ${statusStyle(request.status)}
                `}>

                  {String(request.status || 'Unknown')
                    .replace(/-/g, ' ')}

                </span>

              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <p className="text-xs text-muted">
                    Submitted Hours
                  </p>

                  <p className="mt-1 font-bold text-accent">

                    {request.submittedHours ??
                      request.totalHours ??
                      'Not provided'}

                    {(request.submittedHours != null ||
                      request.totalHours != null) && 'h'}

                  </p>

                </div>

                <div>

                  <p className="text-xs text-muted">
                    Working Days
                  </p>

                  <p className="mt-1 font-semibold text-ink">

                    {request.totalDays ?? 'Not provided'}

                  </p>

                </div>

              </div>

              <p className="
                whitespace-pre-wrap break-words
                text-xs text-muted
              ">

                {request.reason}

              </p>

              {Array.isArray(request.timesheetEntries) &&
                request.timesheetEntries.length > 0 && (

                  <details className="
                    rounded-lg border border-line/50
                    p-3 text-xs text-ink
                  ">

                    <summary className="cursor-pointer font-semibold">

                      Daily Work Breakdown

                    </summary>

                    <div className="mt-3 space-y-2">

                      {request.timesheetEntries.map((entry, index) => (

                        <div
                          key={entry.id || index}
                          className="
                            flex flex-wrap justify-between
                            gap-2 border-b border-line/40 pb-2
                          "
                        >

                          <span>

                            {formatDate(entry.date)}

                          </span>

                          <span className="text-muted">

                            {entry.taskName || entry.projectName}

                          </span>

                          <strong>

                            {entry.hours}h

                          </strong>

                        </div>

                      ))}

                    </div>

                  </details>

              )}

              {request.decisionReason && (

                <div className="
                  rounded-lg border border-line/50
                  bg-surface/50 p-3
                ">

                  <p className="text-xs font-semibold text-muted">

                    Reviewer Comment

                  </p>

                  <p className="
                    mt-1 whitespace-pre-wrap
                    break-words text-xs text-ink
                  ">

                    {request.decisionReason}

                  </p>

                </div>

              )}

              <div className="
                flex flex-wrap items-center
                justify-between gap-2
                border-t border-line/50 pt-3
              ">

                <span className="break-all text-xs text-muted">

                  {request.id}

                  {request.revision &&
                    ` | Revision ${request.revision}`}

                </span>

                {normalize(request.status) ===
                  'correction-required' && (

                    <button
                      type="button"
                      onClick={() =>
                        openCorrection(request)
                      }
                      className={primaryButton}
                    >

                      Correct & Resubmit

                    </button>

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
          "/>

          <p className="
            mt-3 text-sm font-semibold text-ink
          ">

            {loadError
              ? 'Timesheet history unavailable'
              : requests.length
                ? 'No matching timesheets'
                : 'No timesheets submitted yet'}

          </p>

        </div>

      )}

      {/* TIMESHEET FORM */}

      {open && (

        <ModalPortal
          onClose={closeForm}
          ariaLabelledby="employee-timesheet-title"
        >

          <form
            onSubmit={submit}
            className="
              w-full max-w-5xl max-h-[90vh]
              overflow-y-auto rounded-2xl
              border border-line bg-[#142c37]
              p-5 text-ink shadow-2xl
              space-y-5
            "
          >

            <div className="
              flex items-center justify-between
              gap-3 border-b border-line/50 pb-4
            ">

              <h3
                id="employee-timesheet-title"
                className="text-lg font-bold"
              >

                {editingId
                  ? 'Correct Timesheet'
                  : 'Create Weekly Timesheet'}

              </h3>

              <button
                type="button"
                disabled={busy}
                onClick={closeForm}
                aria-label="Close timesheet"
                className="rounded-lg p-2 text-muted"
              >

                <X size={19}/>

              </button>

            </div>

            {reviewComment && (

              <div className="
                rounded-xl border border-warn/30
                bg-warn/10 p-3 text-xs text-warn
              ">

                <strong>Requested correction: </strong>

                {reviewComment}

              </div>

            )}

            <fieldset
              disabled={busy}
              className="min-w-0 space-y-4"
            >

              <div className="grid gap-4 sm:grid-cols-3">

                <label className="text-xs font-semibold text-muted">

                  Week Start - Monday

                  <input
                    type="date"
                    required
                    max={dateKey(Date.now())}
                    disabled={Boolean(editingId)}
                    value={weekStart}
                    onChange={event => {

                      const start = event.target.value;

                      setWeekStart(start);

                      setEntries(emptyEntries(start));

                      setError('');

                    }}
                    className={`${inputClass} mt-2`}
                    style={{ colorScheme: 'dark' }}
                  />

                </label>

                <div>

                  <p className="text-xs font-semibold text-muted">

                    Week End

                  </p>

                  <p className="mt-3 text-sm font-semibold">

                    {formatDate(dates[6])}

                  </p>

                </div>

                <div>

                  <p className="text-xs font-semibold text-muted">

                    Total Submitted Hours

                  </p>

                  <p className="mt-2 text-xl font-bold text-accent">

                    {totalHours}h

                  </p>

                </div>

              </div>

              {!dates.length && (

                <p className="text-xs text-warn">

                  Select a Monday as the week start date.

                </p>

              )}

              {projects.length === 0 && (

                <p className="text-xs text-warn">

                  No assigned projects are available for this account.

                </p>

              )}

              {attendanceLoading && (

                <p className="text-xs text-muted">

                  Checking saved attendance hours...

                </p>

              )}

              <div className="
                overflow-x-auto rounded-xl
                border border-line/50
              ">

                <table className="
                  w-full min-w-[760px]
                  text-left text-xs
                ">

                  <thead className="bg-surface2 text-muted">

                    <tr>

                      {[
                        'Date',
                        'Attendance Hours',
                        'Project',
                        'Task',
                        'Work Hours'
                      ].map(label => (

                        <th
                          key={label}
                          className="p-3 font-semibold"
                        >

                          {label}

                        </th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {entries.map((entry, index) => {

                      const verified =
                        attendance[entry.date];

                      const dayTasks = tasks.filter(task =>
                        String(task.projectId) ===
                        String(entry.projectId)
                      );

                      return (

                        <tr
                          key={entry.date}
                          className="border-t border-line/40"
                        >

                          <td className="p-3 whitespace-nowrap">

                            {formatDate(entry.date)}

                          </td>

                          <td className="p-3 whitespace-nowrap">

                            {verified == null

                              ? <span className="text-muted">Unavailable</span>

                              : <span className="text-accent">{verified}h</span>}

                          </td>

                          <td className="p-2 min-w-[180px]">

                            <select
                              aria-label={`Project for ${entry.date}`}
                              value={entry.projectId}
                              onChange={event =>
                                updateEntry(
                                  index,
                                  'projectId',
                                  event.target.value
                                )
                              }
                              className={inputClass}
                            >

                              <option value="">

                                Select Project

                              </option>

                              {projects.map(project => (

                                <option
                                  key={project.id}
                                  value={project.id}
                                >

                                  {project.name}

                                </option>

                              ))}

                            </select>

                          </td>

                          <td className="p-2 min-w-[170px]">

                            <select
                              aria-label={`Task for ${entry.date}`}
                              value={entry.taskId}
                              disabled={!entry.projectId}
                              onChange={event =>
                                updateEntry(
                                  index,
                                  'taskId',
                                  event.target.value
                                )
                              }
                              className={inputClass}
                            >

                              <option value="">

                                Select Task (Optional)

                              </option>

                              {dayTasks.map(task => (

                                <option
                                  key={task.id}
                                  value={task.id}
                                >

                                  {task.title}

                                </option>

                              ))}

                            </select>

                          </td>

                          <td className="p-2 w-28">

                            <input
                              aria-label={`Working hours for ${entry.date}`}
                              type="number"
                              min="0"
                              max="24"
                              step="0.01"
                              value={entry.hours}
                              placeholder="0"
                              onChange={event =>
                                updateEntry(
                                  index,
                                  'hours',
                                  event.target.value
                                )
                              }
                              className={inputClass}
                            />

                            {Number(entry.hours) > 0 &&
                              (
                                verified == null ||
                                Number(entry.hours) > verified
                              ) && (

                                <p className="mt-1 text-[10px] text-bad">

                                  Check attendance

                                </p>

                            )}

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

              <label className="
                block text-xs font-semibold text-muted
              ">

                Weekly Work Summary

                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  value={reason}
                  onChange={event =>
                    setReason(event.target.value)
                  }
                  placeholder="Summarize the work completed during this week..."
                  className="
                    mt-2 w-full rounded-xl
                    border border-line bg-surface2
                    p-3 text-xs text-ink
                    outline-none focus:border-accent
                  "
                />

              </label>

            </fieldset>

            {error && (

              <div
                role="alert"
                className="
                  flex items-start gap-2 rounded-xl
                  bg-bad/10 border border-bad/30
                  p-3 text-xs text-bad
                "
              >

                <AlertCircle
                  size={16}
                  className="shrink-0"
                />

                {error}

              </div>

            )}

            <div className="
              flex justify-end gap-3
              border-t border-line/50 pt-4
            ">

              <button
                type="button"
                disabled={busy}
                onClick={closeForm}
                className={secondaryButton}
              >

                Cancel

              </button>

              <button
                type="submit"
                disabled={
                  busy ||
                  attendanceLoading ||
                  !dates.length ||
                  totalHours <= 0 ||
                  !reason.trim() ||
                  !projects.length
                }
                className={primaryButton}
              >

                {busy ? (

                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                ) : (

                  <CheckCircle size={16}/>

                )}

                {busy

                  ? 'Submitting...'

                  : editingId

                    ? 'Resubmit Timesheet'

                    : 'Submit Timesheet'}

              </button>

            </div>

          </form>

        </ModalPortal>

      )}

    </section>

  );

}