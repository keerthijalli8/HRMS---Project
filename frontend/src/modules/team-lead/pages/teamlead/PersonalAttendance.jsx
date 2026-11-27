import React, {
  useState,
  useEffect,
  useMemo,
  useRef
} from 'react';


import { useAttendance } from '../../context/AttendanceContext.jsx';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { readStorage } from '../../utils/storage.js';
import { Pagination } from '../../components/common/Pagination.jsx';
import { LocationModal } from '../../components/common/LocationModal.jsx';

import {
  Clock,
  CalendarDays,
  LogIn,
  LogOut,
  Coffee,
  Play,
  MapPin,
  Download,
  CheckCircle,
  History,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

// PERSONAL_ATTENDANCE_WORKSPACE_V1

const PAGE_SIZE = 10;

const CONTROL = `
  h-11 w-full min-w-0 rounded-xl
  border border-line bg-surface2
  px-3 text-sm text-ink
  outline-none focus:border-accent
`;

const BUTTON = `
  inline-flex min-h-[44px] items-center
  justify-center gap-2 rounded-xl
  px-4 py-2 text-sm font-semibold
  transition disabled:opacity-50
  disabled:cursor-not-allowed
`;

const getLocalDate = (value = new Date()) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const validDate = value =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
  getLocalDate(`${value}T00:00:00`) === value;

const getTimestamp = value => {
  if (value == null || value === '') {
    return null;
  }

  const result = typeof value === 'number'
    ? value
    : new Date(value).getTime();

  return Number.isFinite(result) && result > 0
    ? result
    : null;
};

const formatDate = value => {
  if (!validDate(value)) return '-';

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (value, dateKey) => {
  const timestamp = getTimestamp(value);

  if (!timestamp) return '-';

  const time = new Date(
    timestamp
  ).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const punchDate = getLocalDate(timestamp);

  return dateKey && punchDate !== dateKey
    ? `${time} (${formatDate(punchDate)})`
    : time;
};

const formatDuration = seconds => {
  if (seconds == null) return '-';

  const value = Math.max(
    0,
    Math.floor(Number(seconds) || 0)
  );

  const hours = Math.floor(value / 3600);

  const minutes = Math.floor(
    (value % 3600) / 60
  );

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

const getCurrentRange = () => {
  const today = getLocalDate();

  return {
    from: `${today.slice(0, 7)}-01`,
    to: today
  };
};

const getEmployeeId = user =>
  String(
    user?.employeeId ||
    user?.id ||
    ''
  );

const getEmployeeName = user =>
  user?.name ||
  user?.fullName ||
  'Employee';

const getStatusClass = status => ({
  Completed: 'text-good bg-good/10 border-good/20',
  Working: 'text-accent bg-accent/10 border-accent/20',
  'On Break': 'text-warn bg-warn/10 border-warn/20',
  Incomplete: 'text-bad bg-bad/10 border-bad/20'
}[status] ||
  'text-muted bg-surface2 border-line');

const SessionBadge = ({ status }) => (
  <span className={`
    inline-flex whitespace-nowrap
    rounded-lg border px-2.5 py-1
    text-xs font-semibold
    ${getStatusClass(status)}
  `}>
    {status}
  </span>
);

const MetricCard = ({
  label,
  value,
  caption,
  color = 'text-ink'
}) => (
  <div className="
    glass-card !p-4 min-w-0
    !flex !flex-col !items-start
    !justify-between !gap-3
  ">

    <span className="text-xs font-medium text-muted">
      {label}
    </span>

    <span className={`
      text-xl sm:text-2xl font-bold
      tabular-nums break-words ${color}
    `}>
      {value}
    </span>

    {caption && (
      <span className="text-xs text-muted">
        {caption}
      </span>
    )}

  </div>
);

// ============================================================
// PERSONAL ATTENDANCE - LIVE SESSION
// ============================================================

export const PersonalAttendance = () => {

  const { currentUser, triggerToast } =
    useTeamLead();

  const attendance = useAttendance() || {};

  const employeeId = getEmployeeId(currentUser);

  const [pendingAction, setPendingAction] =
    useState('');

  const [locationDetails, setLocationDetails] =
    useState(null);

  const [actionError, setActionError] =
    useState('');

  const actionLock = useRef(false);

  const ownerRef = useRef(employeeId);

  ownerRef.current = employeeId;

  const status =
    attendance.status || 'Not Checked In';

  const working = status === 'Checked In';

  const onBreak = status === 'On Break';

  const completed = status === 'Checked Out';

  const busy =
    Boolean(pendingAction) ||
    Boolean(attendance.locationLoading);

  useEffect(() => {
    setLocationDetails(null);
    setActionError('');
  }, [employeeId]);

  const runAction = async (action, handler) => {

    if (
      !employeeId ||
      actionLock.current ||
      busy
    ) {
      return;
    }

    if (typeof handler !== 'function') {
      setActionError(
        'Attendance service is unavailable.'
      );
      return;
    }

    actionLock.current = true;

    setPendingAction(action);
    setActionError('');

    try {

      const result = action === 'break'
        ? await handler()
        : await handler(employeeId);

      if (
        result === true &&
        ownerRef.current === employeeId
      ) {

        triggerToast?.(
          action === 'check-in'
            ? 'Check-in recorded successfully.'
            : action === 'check-out'
              ? 'Check-out recorded successfully.'
              : onBreak
                ? 'Work resumed.'
                : 'Break started.',
          'good'
        );

      } else if (
        result !== true &&
        ownerRef.current === employeeId
      ) {

        setActionError(
          'Attendance action was not completed. Check your status and location permission.'
        );

      }

    } catch (error) {

      if (ownerRef.current === employeeId) {
        setActionError(
          error?.message ||
          'Unable to update attendance.'
        );
      }

    } finally {

      actionLock.current = false;

      setPendingAction('');

    }
  };

  const openLocation = () => {

    setLocationDetails({
      attendanceRecord: {
        checkInTime:
          attendance.checkInTimestamp,

        checkOutTime:
          attendance.checkOutTimestamp,

        checkInLocation:
          attendance.checkInLocation,

        checkOutLocation:
          attendance.checkOutLocation
      },

      userName:
        getEmployeeName(currentUser),

      userRole:
        currentUser?.designation ||
        currentUser?.role
    });

  };

  const hasLocation = Boolean(
    attendance.checkInLocation ||
    attendance.checkOutLocation
  );

  if (!employeeId) {
    return (
      <div className="glass-card !p-6 text-sm text-muted">
        Sign in to access your attendance.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* EMPLOYEE AND SESSION INFORMATION */}

      <section className="
        glass-card !p-4
        !flex !flex-row !flex-wrap
        !items-center !justify-between
        !gap-3
      ">

        <div className="flex items-center gap-3">

          <div className="
            flex h-12 w-12 items-center
            justify-center rounded-xl
            bg-accent/10 text-accent
          ">
            <CalendarDays className="h-6 w-6" />
          </div>

          <div>

            <h2 className="font-semibold text-ink">
              {getEmployeeName(currentUser)}
            </h2>

            <p className="mt-1 text-xs text-muted">
              {employeeId}
              {' | '}
              {currentUser?.designation ||
                currentUser?.role ||
                'Employee'}
            </p>

          </div>

        </div>

        <div className="text-right">

          <p className="
            text-sm font-semibold text-ink
          ">
            {attendance.currentDateFormatted}
          </p>

          <p className="
            mt-1 text-xs text-muted tabular-nums
          ">
            {attendance.currentTimeFormatted}
          </p>

        </div>

      </section>

      {/* LIVE ATTENDANCE KPIS */}

      <div className="
        grid grid-cols-2
        xl:grid-cols-4 gap-3
      ">

        <MetricCard
          label="Check-In"
          value={formatTime(
            attendance.checkInTimestamp,
            getLocalDate()
          )}
          caption="Recorded punch time"
          color="text-accent"
        />

        <MetricCard
          label="Check-Out"
          value={formatTime(
            attendance.checkOutTimestamp,
            getLocalDate()
          )}
          caption="Recorded punch time"
        />

        <MetricCard
          label="Working Hours"
          value={attendance.liveWorkingFormatted || '00:00:00'}
          caption="Excluding break duration"
          color="text-good"
        />

        <MetricCard
          label="Break Duration"
          value={attendance.liveBreakFormatted || '00:00:00'}
          caption="Total session break time"
          color="text-warn"
        />

      </div>

      {/* LIVE ATTENDANCE CONTROLS */}

      <section className="glass-card !p-5 space-y-5">

        <div className="
          flex flex-wrap items-center
          justify-between gap-3
          border-b border-line/50 pb-4
        ">

          <div>

            <h3 className="
              text-sm font-semibold text-ink
            ">
              Current Attendance Status
            </h3>

            <p className="
              mt-1 text-xs text-muted
            ">
              {attendance.attendanceDateKey
                ? `Session date: ${formatDate(
                    attendance.attendanceDateKey
                  )}`
                : 'No active session'}
            </p>

          </div>

          <SessionBadge
            status={
              completed
                ? 'Completed'
                : working
                  ? 'Working'
                  : onBreak
                    ? 'On Break'
                    : 'Not Checked In'
            }
          />

        </div>

        <div className="
          rounded-2xl border border-line/50
          bg-surface2/30 p-6 text-center
        ">

          <Clock className="
            mx-auto h-8 w-8 text-accent
          " />

          <p className="
            mt-3 text-xs text-muted
          ">
            {onBreak
              ? 'Current Break Timer'
              : completed
                ? 'Total Working Time'
                : 'Working Timer'}
          </p>

          <p className={`
            mt-2 text-3xl sm:text-5xl
            font-bold tabular-nums
            ${onBreak
              ? 'text-warn'
              : 'text-accent'}
          `}>

            {onBreak
              ? attendance.currentBreakFormatted ||
                '00:00:00'
              : attendance.liveWorkingFormatted ||
                '00:00:00'}

          </p>

          {onBreak && (
            <p className="mt-2 text-xs text-muted">
              Working time is paused during break.
            </p>
          )}

        </div>

        <div className="
          flex flex-wrap items-center
          justify-center gap-3
        ">

          {status === 'Not Checked In' && (

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction(
                  'check-in',
                  attendance.handleCheckIn
                )
              }
              className={`
                ${BUTTON}
                bg-accent text-on-accent
                hover:brightness-105
              `}
            >

              <LogIn className="h-4 w-4" />

              {busy
                ? 'Recording Attendance...'
                : 'Check In'}

            </button>

          )}

          {(working || onBreak) && (

            <>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(
                    'break',
                    attendance.handleToggleBreak
                  )
                }
                className={`
                  ${BUTTON}
                  ${onBreak
                    ? 'bg-accent text-on-accent'
                    : 'border border-line bg-surface2 text-ink'}
                `}
              >

                {onBreak
                  ? <Play className="h-4 w-4" />
                  : <Coffee className="h-4 w-4" />
                }

                {onBreak
                  ? 'Resume Work'
                  : 'Take Break'}

              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(
                    'check-out',
                    attendance.handleCheckOut
                  )
                }
                className={`
                  ${BUTTON}
                  border border-bad/30
                  bg-bad/10 text-bad
                `}
              >

                <LogOut className="h-4 w-4" />

                {pendingAction === 'check-out'
                  ? 'Checking Out...'
                  : 'Check Out'}

              </button>

            </>

          )}

          {completed && (
            <span className="
              flex items-center gap-2
              text-sm text-good
            ">
              <CheckCircle className="h-5 w-5" />
              Workday Completed
            </span>
          )}

          <button
            type="button"
            disabled={!hasLocation}
            onClick={openLocation}
            className={`
              ${BUTTON}
              border border-line
              bg-surface2 text-ink
            `}
          >

            <MapPin className="h-4 w-4 text-accent" />

            View Location

          </button>

          

        </div>

        {(attendance.locationError || actionError) && (

          <div
            role="alert"
            className="
              flex items-start gap-2
              rounded-xl border border-warn/25
              bg-warn/10 p-3 text-sm text-warn
            "
          >

            <AlertCircle className="
              mt-0.5 h-4 w-4 shrink-0
            " />

            {attendance.locationError || actionError}

          </div>

        )}

      </section>

      <LocationModal
        {...(locationDetails || {})}
        open={Boolean(locationDetails)}
        onClose={() => setLocationDetails(null)}
      />

    </div>
  );
};

// ============================================================
// HISTORY DATA - CURRENT EMPLOYEE ONLY
// ============================================================

const normalizeRecord = record => {

  if (!record || typeof record !== 'object') {
    return null;
  }

  const checkInTime = getTimestamp(
    record.checkInTime
  );

  if (!checkInTime) return null;

  const rawCheckOut = getTimestamp(
    record.checkOutTime
  );

  const checkOutTime =
    rawCheckOut && rawCheckOut >= checkInTime
      ? rawCheckOut
      : null;

  const savedBreak = Number(
    record.accumulatedBreakMilliseconds ??
      (Number(record.accumulatedBreakSeconds || 0) * 1000)
  );

  const breakMilliseconds =
    Number.isFinite(savedBreak)
      ? Math.max(0, savedBreak)
      : 0;

  return {
    ...record,

    dateKey: getLocalDate(checkInTime),

    checkInTime,
    checkOutTime,

    accumulatedBreakMilliseconds:
      breakMilliseconds
  };
};

const readOwnRecords = (
  employeeId,
  range
) => {

  if (!employeeId) return [];

  const records = new Map();

  const history = readStorage(
    `technomold_teamlead_personal_attendance_${employeeId}`,
    []
  );

  const addRecord = record => {

    const normalized = normalizeRecord(record);

    if (
      !normalized ||
      normalized.dateKey < range.from ||
      normalized.dateKey > range.to
    ) {
      return;
    }

    records.set(
      normalized.dateKey,
      normalized
    );
  };

  if (Array.isArray(history)) {
    history.forEach(addRecord);
  }

  // Read authoritative daily records as well.
  // This recovers days missing from saved history.

  const date = new Date(
    `${range.from}T00:00:00`
  );

  for (let index = 0; index < 366; index++) {

    const dateKey = getLocalDate(date);

    if (dateKey > range.to) break;

    const daily = readStorage(
      `technomold_teamlead_attendance_${employeeId}_${dateKey}`,
      null
    );

    const normalized = normalizeRecord(daily);

    if (
      normalized &&
      normalized.dateKey === dateKey
    ) {
      addRecord(normalized);
    }

    date.setDate(date.getDate() + 1);
  }

  return [...records.values()];
};

const buildHistoryRow = (
  record,
  attendance
) => {

  const sameSession =
    record.checkInTime ===
      getTimestamp(attendance.checkInTimestamp) &&
    record.dateKey ===
      attendance.attendanceDateKey;

  const activeSession = Boolean(
    sameSession &&
    (
      attendance.status === 'Checked In' ||
      attendance.status === 'On Break'
    )
  );

  const checkOutTime = sameSession
    ? getTimestamp(attendance.checkOutTimestamp) ||
      record.checkOutTime
    : record.checkOutTime;

  let breakSeconds = Math.floor(
    record.accumulatedBreakMilliseconds / 1000
  );

  let workingSeconds = null;

  let status = 'Incomplete';

  if (
    checkOutTime &&
    checkOutTime >= record.checkInTime
  ) {

    const elapsed = Math.floor(
      (checkOutTime - record.checkInTime) / 1000
    );

    if (sameSession) {
      breakSeconds = Number(
        attendance.liveBreakSeconds ?? breakSeconds
      );
    }

    breakSeconds = Math.max(
      0,
      Math.min(elapsed, breakSeconds)
    );

    workingSeconds = Math.max(
      0,
      elapsed - breakSeconds
    );

    status = 'Completed';

  } else if (activeSession) {

    workingSeconds =
      attendance.liveWorkingSeconds ?? null;

    breakSeconds =
      attendance.liveBreakSeconds ?? breakSeconds;

    status = attendance.status === 'On Break'
      ? 'On Break'
      : 'Working';

  }

  return {
    ...record,

    checkOutTime,
    workingSeconds,
    breakSeconds,
    status,

    checkInLocation: sameSession
      ? attendance.checkInLocation ||
        record.checkInLocation
      : record.checkInLocation,

    checkOutLocation: sameSession
      ? attendance.checkOutLocation ||
        record.checkOutLocation
      : record.checkOutLocation
  };
};

// ============================================================
// CSV EXPORT
// ============================================================

const escapeCSV = value => {

  let text = String(value ?? '');

  if (
    /^\s*[=+\-@]/.test(text) ||
    /^[\t\r\n]/.test(text)
  ) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCSV = (
  filename,
  rows
) => {

  const content = rows.map(
    row => row.map(escapeCSV).join(',')
  ).join('\r\n');

  const blob = new Blob(
    ['\uFEFF', content],
    {
      type: 'text/csv;charset=utf-8;'
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  try {

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

  } finally {

    link.remove();

    window.setTimeout(() =>
      URL.revokeObjectURL(url),
      1000
    );

  }
};

// ============================================================
// MY ATTENDANCE - PERSONAL HISTORY
// ============================================================

const PersonalAttendanceHistory = () => {

  const { currentUser, triggerToast } =
    useTeamLead();

  const attendance = useAttendance() || {};

  const employeeId = getEmployeeId(currentUser);

  const today = getLocalDate();

  const [range, setRange] =
    useState(getCurrentRange);

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [revision, setRevision] =
    useState(0);

  const [locationDetails, setLocationDetails] =
    useState(null);

  const rangeDays =
    (Date.parse(range.to) -
      Date.parse(range.from)) / 86400000 + 1;

  const validRange =
    validDate(range.from) &&
    validDate(range.to) &&
    range.from <= range.to &&
    range.to <= today &&
    rangeDays <= 366;

  useEffect(() => {

    setLocationDetails(null);
    setCurrentPage(1);
    setStatusFilter('all');

  }, [employeeId]);

  useEffect(() => {

    const refresh = () =>
      setRevision(previous => previous + 1);

    const handleStorage = event => {

      if (
        !event.key ||
        event.key.startsWith(
          `technomold_teamlead_attendance_${employeeId}_`
        ) ||
        event.key ===
          `technomold_teamlead_personal_attendance_${employeeId}`
      ) {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);

    window.addEventListener('focus', refresh);

    window.addEventListener(
      'technomold:teamlead:attendance-punch',
      refresh
    );

    return () => {

      window.removeEventListener(
        'storage',
        handleStorage
      );

      window.removeEventListener(
        'focus',
        refresh
      );

      window.removeEventListener(
        'technomold:teamlead:attendance-punch',
        refresh
      );
    };

  }, [employeeId]);

  const savedRecords = useMemo(() => {

    if (!validRange || !employeeId) {
      return [];
    }

    return readOwnRecords(
      employeeId,
      range
    );

  }, [
    employeeId,
    range.from,
    range.to,
    validRange,
    revision,
    attendance.attendanceHistory
  ]);

  // Include the current session if history storage
  // has not been updated yet.

  const records = [...savedRecords];

  const currentCheckIn = getTimestamp(
    attendance.checkInTimestamp
  );

  const currentDate =
    currentCheckIn
      ? getLocalDate(currentCheckIn)
      : '';

  if (
    employeeId &&
    validRange &&
    currentCheckIn &&
    currentDate === attendance.attendanceDateKey &&
    currentDate >= range.from &&
    currentDate <= range.to &&
    !records.some(
      record => record.dateKey === currentDate
    )
  ) {

    const current = normalizeRecord({
      checkInTime: currentCheckIn,

      checkOutTime:
        attendance.checkOutTimestamp,

      accumulatedBreakSeconds:
        attendance.accumulatedBreakSeconds,

      checkInLocation:
        attendance.checkInLocation,

      checkOutLocation:
        attendance.checkOutLocation
    });

    if (current) {
      records.push(current);
    }
  }

  const rows = records
    .map(record =>
      buildHistoryRow(record, attendance)
    )
    .sort((first, second) =>
      second.dateKey.localeCompare(first.dateKey)
    );

  const completedRows = rows.filter(
    row => row.status === 'Completed'
  );

  const totalWorkingSeconds =
    completedRows.reduce(
      (sum, row) =>
        sum + Number(row.workingSeconds || 0),
      0
    );

  const totalBreakSeconds =
    completedRows.reduce(
      (sum, row) =>
        sum + Number(row.breakSeconds || 0),
      0
    );

  const filteredRows = rows.filter(
    row =>
      statusFilter === 'all' ||
      row.status === statusFilter
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE)
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const visibleRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const changeRange = (key, value) => {

    setRange(previous => ({
      ...previous,
      [key]: value
    }));

    setCurrentPage(1);
  };

  const selectMonth = value => {

    if (
      !/^\d{4}-\d{2}$/.test(value) ||
      value > today.slice(0, 7)
    ) {
      return;
    }

    const [year, month] =
      value.split('-').map(Number);

    const lastDay = getLocalDate(
      new Date(year, month, 0)
    );

    setRange({
      from: `${value}-01`,
      to: lastDay > today ? today : lastDay
    });

    setCurrentPage(1);
  };

  const resetFilters = () => {
    setRange(getCurrentRange());
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const exportHistory = () => {

    if (
      !employeeId ||
      !validRange ||
      !filteredRows.length
    ) {
      return;
    }

    try {

      downloadCSV(
        `My_Attendance_${range.from}_to_${range.to}.csv`,
        [
          [
            'Employee ID',
            'Employee Name',
            'Date',
            'Check In',
            'Check Out',
            'Break Duration',
            'Working Hours',
            'Session Status'
          ],

          ...filteredRows.map(row => [
            employeeId,
            getEmployeeName(currentUser),
            row.dateKey,

            formatTime(
              row.checkInTime,
              row.dateKey
            ),

            row.checkOutTime
              ? formatTime(
                  row.checkOutTime,
                  row.dateKey
                )
              : '',

            formatDuration(row.breakSeconds),

            row.workingSeconds == null
              ? ''
              : formatDuration(row.workingSeconds),

            row.status
          ])
        ]
      );

      triggerToast?.(
        'Attendance CSV download started.',
        'good'
      );

    } catch (error) {

      triggerToast?.(
        error?.message ||
        'Unable to export attendance.',
        'error'
      );

    }
  };

  const openLocation = row => {

    setLocationDetails({
      attendanceRecord: {
        checkInTime: row.checkInTime,
        checkOutTime: row.checkOutTime,
        checkInLocation: row.checkInLocation,
        checkOutLocation: row.checkOutLocation
      },

      userName:
        getEmployeeName(currentUser),

      userRole:
        currentUser?.designation ||
        currentUser?.role
    });
  };

  if (!employeeId) {

    return (
      <div className="glass-card !p-6 text-sm text-muted">
        Sign in to access your attendance history.
      </div>
    );

  }

  return (
    <div className="space-y-4">

      {/* EMPLOYEE SUMMARY */}

      <section className="
        glass-card !p-4
        !flex !flex-row !flex-wrap
        !items-center !justify-between
        !gap-3
      ">

        <div>

          <h2 className="
            text-sm font-semibold text-ink
          ">
            {getEmployeeName(currentUser)}
          </h2>

          <p className="mt-1 text-xs text-muted">
            {employeeId}
            {' | '}
            Personal Attendance History
          </p>

        </div>

        

      </section>

      {/* DATE RANGE SUMMARY */}

      <div className="
        grid grid-cols-2
        xl:grid-cols-4 gap-3
      ">

        <MetricCard
          label="Recorded Days"
          value={validRange ? rows.length : '-'}
          caption="Dates with saved check-ins"
          color="text-accent"
        />

        <MetricCard
          label="Completed Days"
          value={validRange ? completedRows.length : '-'}
          caption="Check-in and check-out recorded"
          color="text-good"
        />

        <MetricCard
          label="Total Working Hours"
          value={validRange
            ? formatDuration(totalWorkingSeconds)
            : '-'}
          caption="Completed sessions only"
          color="text-good"
        />

        <MetricCard
          label="Total Break Hours"
          value={validRange
            ? formatDuration(totalBreakSeconds)
            : '-'}
          caption="Completed sessions only"
          color="text-warn"
        />

      </div>

      {/* MONTH AND DATE FILTERS */}

      <section className="glass-card !p-4 space-y-3">

        <div className="
          grid grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-3 items-end
        ">

          <label className="min-w-0 space-y-2">

            <span className="text-xs font-semibold text-muted">
              Month
            </span>

            <input
              type="month"
              max={today.slice(0, 7)}
              value={
                range.from.slice(0, 7) ===
                  range.to.slice(0, 7)
                  ? range.from.slice(0, 7)
                  : ''
              }
              onChange={event =>
                selectMonth(event.target.value)
              }
              className={CONTROL}
            />

          </label>

          <label className="min-w-0 space-y-2">

            <span className="text-xs font-semibold text-muted">
              From Date
            </span>

            <input
              type="date"
              max={today}
              value={range.from}
              onChange={event =>
                changeRange(
                  'from',
                  event.target.value
                )
              }
              className={CONTROL}
            />

          </label>

          <label className="min-w-0 space-y-2">

            <span className="text-xs font-semibold text-muted">
              To Date
            </span>

            <input
              type="date"
              max={today}
              value={range.to}
              onChange={event =>
                changeRange(
                  'to',
                  event.target.value
                )
              }
              className={CONTROL}
            />

          </label>

          <label className="min-w-0 space-y-2">

            <span className="text-xs font-semibold text-muted">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={event => {
                setStatusFilter(
                  event.target.value
                );
                setCurrentPage(1);
              }}
              className={CONTROL}
            >

              <option value="all">
                All Statuses
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Working">
                Working
              </option>

              <option value="On Break">
                On Break
              </option>

              <option value="Incomplete">
                Incomplete
              </option>

            </select>

          </label>

        </div>

        <div className="
          flex flex-wrap items-center
          justify-between gap-3
          border-t border-line/50 pt-3
        ">

          <span className="text-xs text-muted">

            {validRange
              ? `${formatDate(range.from)} - ${formatDate(range.to)}`
              : 'Invalid date range'}

          </span>

          <div className="
            flex flex-wrap items-center gap-2
          ">

            <button
              type="button"
              onClick={resetFilters}
              className={`
                ${BUTTON}
                border border-line
                bg-surface2 text-ink
              `}
            >

              <RotateCcw className="h-4 w-4" />

              Reset

            </button>

            <button
              type="button"
              disabled={
                !validRange ||
                !filteredRows.length
              }
              onClick={exportHistory}
              className={`
                ${BUTTON}
                bg-accent text-on-accent
              `}
            >

              <Download className="h-4 w-4" />

              Download CSV

            </button>

          </div>

        </div>

        {!validRange && (

          <p
            role="alert"
            className="text-sm text-warn"
          >
            Select a valid date range of up to 366 days.
            Future dates are not allowed.
          </p>

        )}

      </section>

      {/* ATTENDANCE HISTORY TABLE */}

      <section className="glass-card !p-4 space-y-4">

        <div className="
          flex flex-wrap items-center
          justify-between gap-3
        ">

          <h3 className="
            text-sm font-semibold text-ink
          ">
            Attendance Records
          </h3>

          <span className="text-xs text-muted">
            {filteredRows.length} records
          </span>

        </div>

        <div className="overflow-x-auto">

          <table className="
            w-full min-w-[850px]
            border-collapse text-sm text-ink
          ">

            <thead>

              <tr className="
                border-b border-line/60
                bg-surface2/50
                text-xs text-muted
              ">

                {[
                  'Date',
                  'Check-In',
                  'Check-Out',
                  'Break Duration',
                  'Working Hours',
                  'Status',
                  'Location'
                ].map((label, index) => (

                  <th
                    key={label}
                    scope="col"
                    className={`
                      whitespace-nowrap
                      px-3 py-3 font-semibold
                      ${index === 0
                        ? 'text-left'
                        : 'text-center'}
                    `}
                  >
                    {label}
                  </th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y divide-line/40">

              {!visibleRows.length && (

                <tr>

                  <td
                    colSpan={7}
                    className="
                      px-4 py-12
                      text-center text-muted
                    "
                  >

                    {validRange
                      ? 'No saved attendance records match your filters.'
                      : 'Choose a valid date range.'}

                  </td>

                </tr>

              )}

              {visibleRows.map(row => (

                <tr
                  key={row.dateKey}
                  className="
                    hover:bg-surface2/30
                    transition
                  "
                >

                  <td className="
                    whitespace-nowrap
                    px-3 py-4 font-semibold
                  ">
                    {formatDate(row.dateKey)}
                  </td>

                  <td className="
                    px-3 py-4 text-center
                    whitespace-nowrap text-good
                  ">
                    {formatTime(
                      row.checkInTime,
                      row.dateKey
                    )}
                  </td>

                  <td className="
                    px-3 py-4 text-center
                    whitespace-nowrap
                  ">
                    {formatTime(
                      row.checkOutTime,
                      row.dateKey
                    )}
                  </td>

                  <td className="
                    px-3 py-4 text-center
                    whitespace-nowrap
                  ">
                    {formatDuration(
                      row.breakSeconds
                    )}
                  </td>

                  <td className="
                    px-3 py-4 text-center
                    font-semibold whitespace-nowrap
                    text-accent tabular-nums
                  ">
                    {formatDuration(
                      row.workingSeconds
                    )}
                  </td>

                  <td className="
                    px-3 py-4 text-center
                  ">
                    <SessionBadge
                      status={row.status}
                    />
                  </td>

                  <td className="
                    px-3 py-4 text-center
                  ">

                    {row.checkInLocation ||
                    row.checkOutLocation ? (

                      <button
                        type="button"
                        onClick={() =>
                          openLocation(row)
                        }
                        className="
                          inline-flex items-center
                          gap-1.5 rounded-lg
                          border border-line
                          bg-surface2 px-2.5 py-2
                          text-xs text-accent
                          hover:border-accent
                        "
                      >

                        <MapPin className="h-4 w-4" />

                        View

                      </button>

                    ) : (

                      <span className="text-muted">
                        -
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredRows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />

        <p className="text-xs text-muted">
          Only saved personal attendance records are shown.
          Missing punches are not automatically classified
          as absences. Totals exclude unfinished sessions.
        </p>

      </section>

      <LocationModal
        {...(locationDetails || {})}
        open={Boolean(locationDetails)}
        onClose={() => setLocationDetails(null)}
      />

    </div>
  );
};

// COMBINED_MY_ATTENDANCE_V2

export const MyAttendance = () => (
  <div className="space-y-5">

    <PersonalAttendance />

    <PersonalAttendanceHistory />

  </div>
);
