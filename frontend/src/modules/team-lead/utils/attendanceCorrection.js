// ATTENDANCE_REGULARIZATION_SYNC_V1

const PREFIX = 'technomold_teamlead_';

const ROSTER_KEY =
  `${PREFIX}attendance_roster_punches`;

const SESSION_KEY =
  `${PREFIX}attendance_sessions`;

const ATTENDANCE_EVENT =
  'technomold:teamlead:attendance-punch';

const hasValue = value =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== '';

const isObject = value =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value);

const sameId = (first, second) =>
  hasValue(first) &&
  String(first).trim().toLowerCase() ===
    String(second ?? '').trim().toLowerCase();

const fail = message => {
  throw new Error(message);
};

const readJSON = (key, fallback) => {

  const raw = window.localStorage.getItem(key);

  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fail(
      'Attendance storage contains invalid data. Contact the administrator.'
    );
  }
};

const localDateKey = value => {

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
  localDateKey(`${value}T00:00:00`) === value;

const timestampOf = value => {

  if (!hasValue(value)) {
    return null;
  }

  const number = typeof value === 'number'
    ? value
    : new Date(value).getTime();

  return Number.isFinite(number) && number > 0
    ? number
    : null;
};

const localTimestamp = (
  dateKey,
  hour,
  minute,
  second = 0,
  millisecond = 0
) => {

  const [year, month, day] =
    dateKey.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );

  if (
    localDateKey(date) !== dateKey ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    fail('Invalid local attendance time.');
  }

  return date.getTime();
};

const parseRequestedTime = (
  value,
  dateKey,
  label
) => {

  if (!hasValue(value)) {
    return null;
  }

  if (typeof value === 'number') {

    const timestamp = timestampOf(value);

    if (!timestamp) {
      fail(`Invalid ${label}.`);
    }

    return timestamp;
  }

  const text = String(value).trim();

  const clock = text.match(
    /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\s*(AM|PM)?$/i
  );

  if (clock) {

    let hours = Number(clock[1]);

    const minutes = Number(clock[2]);

    const seconds = Number(clock[3] || 0);

    const meridiem = clock[4]?.toUpperCase();

    if (meridiem) {

      if (hours < 1 || hours > 12) {
        fail(`Invalid ${label}.`);
      }

      hours =
        hours % 12 +
        (meridiem === 'PM' ? 12 : 0);

    } else if (hours > 23) {

      fail(`Invalid ${label}.`);

    }

    return localTimestamp(
      dateKey,
      hours,
      minutes,
      seconds
    );
  }

  const explicitDateTime = text.match(
    /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/
  );

  if (
    !explicitDateTime ||
    !validDate(explicitDateTime[1])
  ) {
    fail(
      `${label} must contain a valid time or complete date and time.`
    );
  }

  if (!explicitDateTime[6]) {

    return localTimestamp(
      explicitDateTime[1],
      Number(explicitDateTime[2]),
      Number(explicitDateTime[3]),
      Number(explicitDateTime[4] || 0),
      Number(
        (explicitDateTime[5] || '').padEnd(3, '0')
      )
    );
  }

  const timestamp = timestampOf(text);

  if (!timestamp) {
    fail(`Invalid ${label}.`);
  }

  return timestamp;
};

const getPunch = (record, primary, legacy) => {

  const first = record?.[primary];

  const second = record?.[legacy];

  if (
    hasValue(first) &&
    hasValue(second) &&
    timestampOf(first) !== timestampOf(second)
  ) {
    fail('Conflicting punch timestamps found.');
  }

  const raw = first ?? second;

  const timestamp = timestampOf(raw);

  if (hasValue(raw) && !timestamp) {
    fail('An existing attendance timestamp is invalid.');
  }

  return timestamp;
};

const getBreakMilliseconds = record => {

  if (hasValue(record.accumulatedBreakMilliseconds)) {

    const value = Number(
      record.accumulatedBreakMilliseconds
    );

    if (!Number.isFinite(value) || value < 0) {
      fail('Invalid recorded break duration.');
    }

    return value;
  }

  const seconds =
    record.accumulatedBreakSeconds ??
    record.breakSeconds;

  if (hasValue(seconds)) {

    const value = Number(seconds);

    if (!Number.isFinite(value) || value < 0) {
      fail('Invalid recorded break duration.');
    }

    return value * 1000;
  }

  if (Array.isArray(record.breaks)) {

    return record.breaks.reduce((total, item) => {

      const start = timestampOf(item?.start);

      const end = timestampOf(item?.end);

      if (!start || !end || end < start) {
        fail('An existing break record is incomplete.');
      }

      return total + end - start;

    }, 0);
  }

  fail(
    'Recorded break duration is unavailable. Attendance cannot be corrected safely.'
  );
};

const getRecordDate = record => {

  if (!isObject(record)) {
    return '';
  }

  const checkIn = getPunch(
    record,
    'checkInTime',
    'checkIn'
  );

  return checkIn
    ? localDateKey(checkIn)
    : String(record.dateKey || '');
};

const dailyKey = (id, date) =>
  `${PREFIX}attendance_${id}_${date}`;

const historyKey = id =>
  `${PREFIX}personal_attendance_${id}`;

export const prepareAttendanceCorrection = (
  request,
  employee,
  actor,
  comment
) => {

  if (
    request?.category !== 'Attendance Regularization' ||
    String(request.status).toLowerCase() !== 'pending'
  ) {
    fail('This attendance request cannot be corrected.');
  }

  if (!hasValue(request.id)) {
    fail('Attendance correction request ID is missing.');
  }

  const employeeId = String(
    employee?.employeeId ||
    employee?.id ||
    ''
  ).trim();

  if (!employeeId) {
    fail('Employee attendance identity is unavailable.');
  }

  const ids = [...new Set([
    employeeId,
    employee?.id,
    employee?.employeeId,
    request.employeeId
  ].filter(hasValue).map(String))];

  if (
    ![employee?.id, employee?.employeeId]
      .some(id => sameId(id, request.employeeId))
  ) {
    fail('Attendance correction employee mismatch.');
  }

  const dateKey = String(
    request.attendanceDate ||
    request.date ||
    request.fromDate ||
    ''
  ).slice(0, 10);

  if (
    !validDate(dateKey) ||
    dateKey > localDateKey(Date.now())
  ) {
    fail('A valid past or current attendance date is required.');
  }

  if (
    request.fromDate &&
    request.toDate &&
    String(request.fromDate).slice(0, 10) !==
      String(request.toDate).slice(0, 10)
  ) {
    fail('Submit a separate correction for each attendance date.');
  }

  const requestedIn = parseRequestedTime(
    request.requestedCheckIn ??
    request.correctedCheckIn ??
    request.requestedPunchIn,
    dateKey,
    'requested check-in'
  );

  const requestedOut = parseRequestedTime(
    request.requestedCheckOut ??
    request.correctedCheckOut ??
    request.requestedPunchOut,
    dateKey,
    'requested check-out'
  );

  if (!requestedIn && !requestedOut) {
    fail(
      'Requested punch timings are missing. Obtain a complete employee correction request before approval.'
    );
  }

  const type = String(
    request.correctionType ||
    request.regularizationType ||
    request.requestType ||
    ''
  ).toLowerCase();

  if (
    /missed.*(?:check[\s-]?in|punch[\s-]?in)/.test(type) &&
    !requestedIn
  ) {
    fail('Requested check-in time is required.');
  }

  if (
    /missed.*(?:check[\s-]?out|punch[\s-]?out)/.test(type) &&
    !requestedOut
  ) {
    fail('Requested check-out time is required.');
  }

  const roster = readJSON(ROSTER_KEY, {});

  const sessions = readJSON(SESSION_KEY, {});

  if (!isObject(roster) || !isObject(sessions)) {
    fail('Attendance storage format is invalid.');
  }

  const candidates = [];

  const histories = new Map();

  const dailyRecords = new Map();

  for (const id of ids) {

    const daily = readJSON(
      dailyKey(id, dateKey),
      null
    );

    if (daily !== null && !isObject(daily)) {
      fail('A daily attendance record is invalid.');
    }

    dailyRecords.set(id, daily);

    if (
      daily &&
      (
        getPunch(daily, 'checkInTime', 'checkIn') ||
        getPunch(daily, 'checkOutTime', 'checkOut')
      )
    ) {
      candidates.push({
        record: daily,
        priority: 4
      });
    }

    const history = readJSON(
      historyKey(id),
      []
    );

    if (!Array.isArray(history)) {
      fail('Employee attendance history is invalid.');
    }

    histories.set(id, history);

    const matching = history.filter(record =>
      isObject(record) &&
      record.dateKey === dateKey
    );

    if (matching.length > 1) {
      fail('Duplicate attendance records require review.');
    }

    if (matching.length === 1) {
      candidates.push({
        record: matching[0],
        priority: 3
      });
    }

    if (getRecordDate(roster[id]) === dateKey) {
      candidates.push({
        record: roster[id],
        priority: 1
      });
    }

    if (getRecordDate(sessions[id]) === dateKey) {
      candidates.push({
        record: sessions[id],
        priority: 2
      });
    }
  }

  if (!candidates.length) {
    fail(
      'No saved attendance record exists for this date. Verify the original attendance and break duration before approving.'
    );
  }

  candidates.sort(
    (first, second) =>
      second.priority - first.priority
  );

  const original = candidates[0].record;

  const originalIn = getPunch(
    original,
    'checkInTime',
    'checkIn'
  );

  const originalOut = getPunch(
    original,
    'checkOutTime',
    'checkOut'
  );

  if (
    originalIn &&
    localDateKey(originalIn) !== dateKey
  ) {
    fail('Original attendance date does not match the request.');
  }

  for (const candidate of candidates) {

    const otherIn = getPunch(
      candidate.record,
      'checkInTime',
      'checkIn'
    );

    const otherOut = getPunch(
      candidate.record,
      'checkOutTime',
      'checkOut'
    );

    if (
      (originalIn && otherIn && originalIn !== otherIn) ||
      (originalOut && otherOut && originalOut !== otherOut) ||
      (!originalIn && otherIn) ||
      (!originalOut && otherOut)
    ) {
      fail(
        'Conflicting attendance records found. Review the existing punches before approval.'
      );
    }
  }

  if (
    original.breakStartTime ||
    original.activeBreak ||
    original.status === 'On Break'
  ) {
    fail('Resolve the active break before correcting attendance.');
  }

  if (
    dateKey === localDateKey(Date.now()) &&
    originalIn &&
    !originalOut
  ) {
    fail('Complete the active work session before correcting today’s attendance.');
  }

  const checkInTime = requestedIn ?? originalIn;

  const checkOutTime = requestedOut ?? originalOut;

  if (!checkInTime || !checkOutTime) {
    fail('Both valid check-in and check-out times are required.');
  }

  if (localDateKey(checkInTime) !== dateKey) {
    fail('Corrected check-in must match the attendance date.');
  }

  if (checkOutTime <= checkInTime) {
    fail(
      'Check-out must be after check-in. For overnight sessions, provide the full checkout date and time.'
    );
  }

  if (checkInTime > Date.now() || checkOutTime > Date.now()) {
    fail('Attendance punches cannot be in the future.');
  }

  const elapsed = checkOutTime - checkInTime;

  if (elapsed > 86400000) {
    fail('A session longer than 24 hours requires manual review.');
  }

  const breakMilliseconds =
    getBreakMilliseconds(original);

  if (breakMilliseconds > elapsed) {
    fail('Recorded breaks exceed the corrected session duration.');
  }

  for (const item of Array.isArray(original.breaks)
    ? original.breaks
    : []) {

    const start = timestampOf(item?.start);

    const end = timestampOf(item?.end);

    if (
      !start ||
      !end ||
      end < start ||
      start < checkInTime ||
      end > checkOutTime
    ) {
      fail('Corrected punches conflict with recorded break timings.');
    }
  }

  const requestedOriginalIn =
    request.originalCheckIn ??
    request.actualCheckIn ??
    request.originalPunchIn;

  const requestedOriginalOut =
    request.originalCheckOut ??
    request.actualCheckOut ??
    request.originalPunchOut;

  if (
    hasValue(requestedOriginalIn) &&
    parseRequestedTime(
      requestedOriginalIn,
      dateKey,
      'original check-in'
    ) !== originalIn
  ) {
    fail('The original check-in has changed since submission.');
  }

  if (
    hasValue(requestedOriginalOut) &&
    parseRequestedTime(
      requestedOriginalOut,
      dateKey,
      'original check-out'
    ) !== originalOut
  ) {
    fail('The original check-out has changed since submission.');
  }

  if (
    originalIn === checkInTime &&
    originalOut === checkOutTime
  ) {
    fail('The requested correction does not change the recorded punches.');
  }

  const updatedAt = Date.now();

  const correction = {

    requestId: String(request.id),

    employeeId,

    dateKey,

    before: {
      checkInTime: originalIn,
      checkOutTime: originalOut,

      checkInLocation:
        original.checkInLocation || null,

      checkOutLocation:
        original.checkOutLocation || null
    },

    after: {
      checkInTime,
      checkOutTime,

      breakSeconds: Math.floor(
        breakMilliseconds / 1000
      ),

      workingSeconds: Math.floor(
        (elapsed - breakMilliseconds) / 1000
      )
    },

    reviewedBy: {
      name: actor?.name || 'Reviewer',
      employeeId: actor?.employeeId || null,
      role: actor?.role || null
    },

    comment,

    appliedAt:
      new Date(updatedAt).toISOString(),

    status: 'applied'
  };

  const previousCorrections =
    Array.isArray(original.correctionHistory)
      ? original.correctionHistory
      : [];

  if (
    previousCorrections.some(item =>
      sameId(item.requestId, request.id)
    )
  ) {
    fail('This attendance correction has already been applied.');
  }

  const corrected = {

    ...original,

    dateKey,

    checkInTime,

    checkOutTime,

    checkIn: checkInTime,

    checkOut: checkOutTime,

    status: 'Checked Out',

    hasCheckedOutToday: true,

    breakStartTime: null,

    activeBreak: null,

    accumulatedBreakMilliseconds:
      breakMilliseconds,

    accumulatedBreakSeconds:
      correction.after.breakSeconds,

    breakSeconds:
      correction.after.breakSeconds,

    workingSeconds:
      correction.after.workingSeconds,

    checkInLocation:
      originalIn === checkInTime
        ? original.checkInLocation || null
        : null,

    checkOutLocation:
      originalOut === checkOutTime
        ? original.checkOutLocation || null
        : null,

    updatedAt,

    correctionHistory: [
      ...previousCorrections,
      correction
    ]
  };

  const writes = new Map();

  // Canonical attendance storage.
  // Existing employee aliases are synchronized as needed.

  for (const id of ids) {

    const history = histories.get(id) || [];

    const containsDate = history.some(
      item => item?.dateKey === dateKey
    );

    if (
      id === employeeId ||
      dailyRecords.get(id) ||
      containsDate
    ) {

      writes.set(
        dailyKey(id, dateKey),
        corrected
      );

      writes.set(
        historyKey(id),
        [
          corrected,
          ...history.filter(
            item => item?.dateKey !== dateKey
          )
        ].sort(
          (first, second) =>
            String(second?.dateKey || '')
              .localeCompare(
                String(first?.dateKey || '')
              )
        )
      );
    }
  }

  let rosterChanged = false;

  let sessionsChanged = false;

  const updatedRoster = { ...roster };

  const updatedSessions = { ...sessions };

  // Never replace another day's active or completed
  // roster/session record with a historical correction.

  for (const id of ids) {

    if (getRecordDate(roster[id]) === dateKey) {

      updatedRoster[id] = {
        ...roster[id],
        ...corrected
      };

      rosterChanged = true;
    }

    if (getRecordDate(sessions[id]) === dateKey) {

      updatedSessions[id] = {
        ...sessions[id],
        ...corrected,

        checkIn:
          new Date(checkInTime).toISOString(),

        checkOut:
          new Date(checkOutTime).toISOString()
      };

      sessionsChanged = true;
    }
  }

  if (rosterChanged) {
    writes.set(ROSTER_KEY, updatedRoster);
  }

  if (sessionsChanged) {
    writes.set(SESSION_KEY, updatedSessions);
  }

  return {
    employeeId,
    correction,
    corrected,
    writes
  };
};

// ============================================================
// SAVE ATTENDANCE AND APPROVAL TOGETHER
// Browser storage uses best-effort rollback on write failure.
// ============================================================

export const commitAttendanceCorrection = (
  plan,
  saveApproval
) => {

  const snapshots = new Map();

  for (const key of plan.writes.keys()) {

    snapshots.set(
      key,
      window.localStorage.getItem(key)
    );
  }

  const writtenKeys = [];

  let result;

  try {

    for (const [key, record] of plan.writes) {

      window.localStorage.setItem(
        key,
        JSON.stringify(record)
      );

      writtenKeys.push(key);
    }

    result = saveApproval();

  } catch (error) {

    let rollbackFailed = false;

    for (const key of writtenKeys.reverse()) {

      try {

        const previous = snapshots.get(key);

        if (previous === null) {

          window.localStorage.removeItem(key);

        } else {

          window.localStorage.setItem(
            key,
            previous
          );
        }

      } catch {

        rollbackFailed = true;

      }
    }

    if (rollbackFailed) {

      fail(
        'Attendance correction failed and storage recovery was incomplete. Reload and contact the administrator before retrying.'
      );
    }

    throw error;
  }

  window.dispatchEvent(
    new CustomEvent(ATTENDANCE_EVENT, {
      detail: {
        employeeId: plan.employeeId,
        record: plan.corrected,
        correction: plan.correction
      }
    })
  );

  return result;
};