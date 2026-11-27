import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';

import {
  readStorage,
  writeStorage
} from '../utils/storage.js';

import {
  captureDeviceLocation
} from '../utils/geolocation.js';

import { useTeamLead } from './TeamLeadContext.jsx';
import { currentTeamLead } from '../data/mockData.js';

// ============================================================
// ATTENDANCE CONTEXT
// ============================================================

const AttendanceContext = createContext();

const ROSTER_STORAGE_KEY =
  'technomold_teamlead_attendance_roster_punches';

const ATTENDANCE_EVENT =
  'technomold:teamlead:attendance-punch';

const LATE_ARRIVAL_HOUR = 9;
const LATE_ARRIVAL_MINUTE = 40;

// ============================================================
// DATE AND TIME HELPERS
// ============================================================

const formatDuration = totalSeconds => {
  const numericValue = Number(totalSeconds);

  const secs = Number.isFinite(numericValue)
    ? Math.max(0, Math.floor(numericValue))
    : 0;

  const hrs = String(
    Math.floor(secs / 3600)
  ).padStart(2, '0');

  const mins = String(
    Math.floor((secs % 3600) / 60)
  ).padStart(2, '0');

  const remSecs = String(
    secs % 60
  ).padStart(2, '0');

  return `${hrs}:${mins}:${remSecs}`;
};

const normalizeTimestamp = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const timestamp =
    typeof value === 'number'
      ? value
      : new Date(value).getTime();

  return Number.isFinite(timestamp) && timestamp > 0
    ? timestamp
    : null;
};

const formatClockTime = timestamp => {
  const normalized = normalizeTimestamp(timestamp);

  if (!normalized) {
    return 'Not Recorded';
  }

  return new Date(normalized).toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  );
};

const getLocalDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

const getPreviousDateKey = () => {
  const date = new Date();

  date.setDate(date.getDate() - 1);

  return getLocalDateKey(date.getTime());
};

const getElapsedMilliseconds = (start, end) => {
  if (!start || !end) {
    return 0;
  }

  return Math.max(0, end - start);
};

const toSeconds = milliseconds => {
  const value = Number(milliseconds);

  return Number.isFinite(value)
    ? Math.max(0, Math.floor(value / 1000))
    : 0;
};

// ============================================================
// EMPTY ATTENDANCE RECORD
// ============================================================

const emptyAttendance = () => ({
  status: 'Not Checked In',
  hasCheckedOutToday: false,

  checkInTime: null,
  checkOutTime: null,
  breakStartTime: null,

  accumulatedBreakSeconds: 0,
  accumulatedBreakMilliseconds: 0,

  checkInLocation: null,
  checkOutLocation: null,

  updatedAt: null
});

// ============================================================
// STORAGE KEYS
// ============================================================

const attendanceStorageKey = (
  employeeId,
  dateKey
) =>
  `technomold_teamlead_attendance_${employeeId}_${dateKey}`;

const attendanceHistoryStorageKey = employeeId =>
  `technomold_teamlead_personal_attendance_${employeeId}`;

const safeWriteStorage = (key, value) => {
  const saved = writeStorage(key, value);

  if (saved === false) {
    throw new Error(
      'Unable to save attendance. Please check browser storage.'
    );
  }
};

// ============================================================
// NORMALIZE SAVED ATTENDANCE
// Supports existing attendance records.
// ============================================================

const normalizeAttendance = saved => {
  if (
    !saved ||
    typeof saved !== 'object' ||
    Array.isArray(saved)
  ) {
    return emptyAttendance();
  }

  const checkInTime =
    normalizeTimestamp(saved.checkInTime);

  if (!checkInTime) {
    return emptyAttendance();
  }

  const rawCheckOutTime =
    normalizeTimestamp(saved.checkOutTime);

  const checkOutTime =
    rawCheckOutTime &&
    rawCheckOutTime >= checkInTime
      ? rawCheckOutTime
      : null;

  const rawBreakStartTime =
    normalizeTimestamp(saved.breakStartTime);

  const breakStartTime =
    rawBreakStartTime &&
    rawBreakStartTime >= checkInTime &&
    !checkOutTime
      ? rawBreakStartTime
      : null;

  const legacyBreakSeconds = Number(
    saved.accumulatedBreakSeconds
  );

  const savedBreakMilliseconds = Number(
    saved.accumulatedBreakMilliseconds
  );

  let accumulatedBreakMilliseconds =
    saved.accumulatedBreakMilliseconds != null &&
    Number.isFinite(savedBreakMilliseconds)
      ? Math.max(0, savedBreakMilliseconds)
      : Number.isFinite(legacyBreakSeconds)
        ? Math.max(0, legacyBreakSeconds * 1000)
        : 0;

  if (checkOutTime) {
    accumulatedBreakMilliseconds = Math.min(
      accumulatedBreakMilliseconds,
      checkOutTime - checkInTime
    );
  }

  const hasCheckedOutToday = Boolean(checkOutTime);

  let status = 'Checked In';

  if (hasCheckedOutToday) {
    status = 'Checked Out';
  } else if (breakStartTime) {
    status = 'On Break';
  }

  return {
    ...emptyAttendance(),
    ...saved,

    status,
    hasCheckedOutToday,

    checkInTime,
    checkOutTime,

    breakStartTime:
      status === 'On Break'
        ? breakStartTime
        : null,

    accumulatedBreakMilliseconds,

    accumulatedBreakSeconds:
      toSeconds(accumulatedBreakMilliseconds),

    updatedAt:
      normalizeTimestamp(saved.updatedAt)
  };
};

const hasOpenSession = record =>
  Boolean(
    record?.checkInTime &&
    !record?.checkOutTime &&
    !record?.hasCheckedOutToday
  );

// ============================================================
// PERSONAL ATTENDANCE HISTORY
// ============================================================

const readPersonalAttendanceHistory = employeeId => {
  if (!employeeId) {
    return [];
  }

  const saved = readStorage(
    attendanceHistoryStorageKey(employeeId),
    []
  );

  if (!Array.isArray(saved)) {
    return [];
  }

  return saved
    .filter(item =>
      item &&
      typeof item === 'object' &&
      typeof item.dateKey === 'string'
    )
    .sort((left, right) =>
      String(right.dateKey).localeCompare(
        String(left.dateKey)
      )
    );
};

const upsertPersonalAttendance = (
  employeeId,
  dateKey,
  record
) => {
  const history =
    readPersonalAttendanceHistory(employeeId);

  const updated = [
    {
      ...record,
      dateKey
    },

    ...history.filter(
      item => item.dateKey !== dateKey
    )
  ].sort((left, right) =>
    String(right.dateKey).localeCompare(
      String(left.dateKey)
    )
  );

  safeWriteStorage(
    attendanceHistoryStorageKey(employeeId),
    updated
  );

  return updated;
};

// ============================================================
// RESTORE DAILY ATTENDANCE
// ============================================================

const readDailyAttendance = (
  dateKey,
  employeeId
) => {
  if (!employeeId || !dateKey) {
    return emptyAttendance();
  }

  const savedForDate = readStorage(
    attendanceStorageKey(employeeId, dateKey),
    null
  );

  if (savedForDate) {
    return normalizeAttendance(savedForDate);
  }

  const historyRecord =
    readPersonalAttendanceHistory(employeeId).find(
      item => item.dateKey === dateKey
    );

  if (historyRecord) {
    return normalizeAttendance(historyRecord);
  }

  // Preserve compatibility with older records.

  const legacySaved =
    String(employeeId) === String(currentTeamLead.id)
      ? readStorage(
          `technomold_teamlead_attendance_${dateKey}`,
          readStorage(
            'technomold_teamlead_attendance_today',
            null
          )
        )
      : null;

  const legacyTimestamp =
    legacySaved?.checkInTime ||
    legacySaved?.checkOutTime;

  const legacyForDate =
    legacyTimestamp &&
    getLocalDateKey(legacyTimestamp) === dateKey
      ? legacySaved
      : null;

  return normalizeAttendance(legacyForDate);
};

// ============================================================
// RESTORE ACTIVE SESSION
// Supports sessions crossing midnight.
// ============================================================

const restoreActiveAttendance = employeeId => {
  const today = getLocalDateKey();

  if (!employeeId) {
    return {
      dateKey: today,
      record: emptyAttendance()
    };
  }

  const todayRecord = readDailyAttendance(
    today,
    employeeId
  );

  if (todayRecord.checkInTime) {
    return {
      dateKey: today,
      record: todayRecord
    };
  }

  // Check yesterday's attendance directly.

  const yesterday = getPreviousDateKey();

  const yesterdayRecord = readDailyAttendance(
    yesterday,
    employeeId
  );

  if (hasOpenSession(yesterdayRecord)) {
    return {
      dateKey: yesterday,
      record: yesterdayRecord
    };
  }

  // Recover older unfinished sessions from history.

  const history =
    readPersonalAttendanceHistory(employeeId);

  for (const item of history) {
    if (item.dateKey >= today) {
      continue;
    }

    const latestRecord = readDailyAttendance(
      item.dateKey,
      employeeId
    );

    if (hasOpenSession(latestRecord)) {
      return {
        dateKey: item.dateKey,
        record: latestRecord
      };
    }
  }

  return {
    dateKey: today,
    record: todayRecord
  };
};

// ============================================================
// LOCATION NORMALIZATION
// ============================================================

const normalizeLocation = location => {
  if (!location || typeof location !== 'object') {
    throw new Error(
      'Attendance location is unavailable.'
    );
  }

  const rawLatitude =
    location.lat ?? location.latitude;

  const rawLongitude =
    location.lng ?? location.longitude;

  const latitude = Number(rawLatitude);

  const longitude = Number(rawLongitude);

  if (
    rawLatitude == null ||
    rawLongitude == null ||
    String(rawLatitude).trim() === '' ||
    String(rawLongitude).trim() === '' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      'Unable to verify attendance coordinates.'
    );
  }

  return {
    ...location,

    lat: latitude,
    lng: longitude,

    latitude,
    longitude,

    label:
      location.address ||
      location.label ||
      `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
  };
};

// ============================================================
// TEAM ROSTER ATTENDANCE
// ============================================================

const saveRosterPunch = (
  employeeId,
  action,
  timestamp,
  location,
  attendanceRecord
) => {
  if (!employeeId) {
    return;
  }

  const stored = readStorage(
    ROSTER_STORAGE_KEY,
    {}
  );

  const records =
    stored &&
    typeof stored === 'object' &&
    !Array.isArray(stored)
      ? stored
      : {};

  const id = String(employeeId);

  const previousRecord =
    action === 'checkIn'
      ? {}
      : records[id] || {};

  const updatedRecord = {
    ...previousRecord,

    [action]: timestamp,

    [`${action}Location`]: location,

    dateKey: getLocalDateKey(
      attendanceRecord.checkInTime
    ),

    checkIn: attendanceRecord.checkInTime,

    checkInLocation:
      attendanceRecord.checkInLocation || null,

    checkOut:
      attendanceRecord.checkOutTime || null,

    checkOutLocation:
      attendanceRecord.checkOutLocation || null,

    status: attendanceRecord.status,

    accumulatedBreakSeconds:
      attendanceRecord.accumulatedBreakSeconds,

    updatedAt: Date.now()
  };

  const updatedRecords = {
    ...records,
    [id]: updatedRecord
  };

  safeWriteStorage(
    ROSTER_STORAGE_KEY,
    updatedRecords
  );

  window.dispatchEvent(
    new CustomEvent(ATTENDANCE_EVENT, {
      detail: {
        employeeId: id,
        record: updatedRecord
      }
    })
  );
};

// ============================================================
// ATTENDANCE PROVIDER
// ============================================================

export const AttendanceProvider = ({ children }) => {

  const { currentUser } = useTeamLead();

  const employeeId = String(
    currentUser?.employeeId ||
    currentUser?.id ||
    ''
  );

  const [initialAttendance] = useState(
    () => restoreActiveAttendance(employeeId)
  );

  const [dateKey, setDateKey] = useState(
    initialAttendance.dateKey
  );

  const [attendance, setAttendance] = useState(
    initialAttendance.record
  );

  const [
    attendanceOwnerId,
    setAttendanceOwnerId
  ] = useState(employeeId);

  const [
    attendanceHistory,
    setAttendanceHistory
  ] = useState(
    () => readPersonalAttendanceHistory(employeeId)
  );

  const [now, setNow] = useState(Date.now());

  const [
    locationLoading,
    setLocationLoading
  ] = useState(false);

  const [
    locationError,
    setLocationError
  ] = useState('');

  const actionInProgress = useRef(false);

  const activeDateKey = useRef(dateKey);

  const activeEmployeeId = useRef(employeeId);

  const attendanceRef = useRef(attendance);

  activeEmployeeId.current = employeeId;

  // ==========================================================
  // APPLY ATTENDANCE STATE
  // ==========================================================

  const applyAttendanceState = (
    targetEmployeeId,
    recordDateKey,
    record
  ) => {
    if (
      activeEmployeeId.current !== targetEmployeeId
    ) {
      return;
    }

    const normalizedRecord =
      normalizeAttendance(record);

    activeDateKey.current = recordDateKey;

    attendanceRef.current = normalizedRecord;

    setDateKey(recordDateKey);

    setAttendance(normalizedRecord);

    setAttendanceOwnerId(targetEmployeeId);

    setNow(Date.now());
  };

  // ==========================================================
  // RESTORE ATTENDANCE WHEN EMPLOYEE CHANGES
  // ==========================================================

  useEffect(() => {

    const restored =
      restoreActiveAttendance(employeeId);

    applyAttendanceState(
      employeeId,
      restored.dateKey,
      restored.record
    );

    setAttendanceHistory(
      readPersonalAttendanceHistory(employeeId)
    );

    setLocationError('');

    setNow(Date.now());

  }, [employeeId]);

  // ==========================================================
  // LIVE CLOCK AND DATE CHANGE
  // ==========================================================

  useEffect(() => {

    const updateClock = () => {
      const timestamp = Date.now();

      setNow(timestamp);

      const nextDateKey =
        getLocalDateKey(timestamp);

      if (
        activeDateKey.current === nextDateKey
      ) {
        return;
      }

      if (actionInProgress.current) {
        return;
      }

      // Preserve overnight sessions.

      if (hasOpenSession(attendanceRef.current)) {
        return;
      }

      const restored =
        restoreActiveAttendance(employeeId);

      applyAttendanceState(
        employeeId,
        restored.dateKey,
        restored.record
      );

      setAttendanceHistory(
        readPersonalAttendanceHistory(employeeId)
      );
    };

    const timer = window.setInterval(
      updateClock,
      1000
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        updateClock();
      }
    };

    window.addEventListener(
      'focus',
      updateClock
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(timer);

      window.removeEventListener(
        'focus',
        updateClock
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };

  }, [employeeId]);

  // ==========================================================
  // CROSS-TAB ATTENDANCE SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {

    if (!employeeId) {
      return;
    }

    const syncAttendance = () => {
      if (actionInProgress.current) {
        return;
      }

      const restored =
        restoreActiveAttendance(employeeId);

      applyAttendanceState(
        employeeId,
        restored.dateKey,
        restored.record
      );

      setAttendanceHistory(
        readPersonalAttendanceHistory(employeeId)
      );
    };

    const handleStorageChange = event => {
      const changedKey = event.key;

      const dailyPrefix =
        `technomold_teamlead_attendance_${employeeId}_`;

      const historyKey =
        attendanceHistoryStorageKey(employeeId);

      if (
        changedKey === null ||
        changedKey === historyKey ||
        changedKey === ROSTER_STORAGE_KEY ||
        changedKey.startsWith(dailyPrefix)
      ) {
        syncAttendance();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        syncAttendance();
      }
    };

    window.addEventListener(
      'storage',
      handleStorageChange
    );

    window.addEventListener(
      'focus',
      syncAttendance
    );

    const handleAttendanceCorrection = event => {

      if (
        event.detail?.correction &&
        String(
          event.detail.employeeId || ''
        ).trim().toLowerCase() ===
        String(employeeId).trim().toLowerCase()
      ) {
        syncAttendance();
      }
    };

    window.addEventListener(
      'technomold:teamlead:attendance-punch',
      handleAttendanceCorrection
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange
      );

      window.removeEventListener(
        'focus',
        syncAttendance
      );

      window.removeEventListener(
        'technomold:teamlead:attendance-punch',
        handleAttendanceCorrection
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };

  }, [employeeId]);

  // ==========================================================
  // CURRENT EMPLOYEE ATTENDANCE
  // ==========================================================

  const currentAttendance =
    attendanceOwnerId === employeeId
      ? attendance
      : emptyAttendance();

  const currentAttendanceHistory =
    attendanceOwnerId === employeeId
      ? attendanceHistory
      : [];

  // ==========================================================
  // ATTENDANCE ACTION VALIDATION
  // ==========================================================

  const canPerformAction = targetId =>
    Boolean(
      employeeId &&
      targetId === employeeId &&
      activeEmployeeId.current === targetId &&
      attendanceOwnerId === employeeId &&
      !locationLoading &&
      !actionInProgress.current
    );

  // ==========================================================
  // LOCATION CAPTURE
  // ==========================================================

  const getPunchLocation = async targetId => {

    setLocationLoading(true);

    setLocationError('');

    try {
      const location =
        await captureDeviceLocation();

      return normalizeLocation(location);

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : 'Device location permission is required to record attendance.';

      if (
        activeEmployeeId.current === targetId
      ) {
        setLocationError(message);
      }

      return null;

    } finally {

      setLocationLoading(false);
    }
  };

  // ==========================================================
  // SAVE ATTENDANCE
  // ==========================================================

  const persistAttendance = (
    targetEmployeeId,
    recordDateKey,
    record
  ) => {

    const normalizedRecord =
      normalizeAttendance({
        ...record,
        updatedAt: Date.now()
      });

    safeWriteStorage(
      attendanceStorageKey(
        targetEmployeeId,
        recordDateKey
      ),
      normalizedRecord
    );

    applyAttendanceState(
      targetEmployeeId,
      recordDateKey,
      normalizedRecord
    );

    try {
      const updatedHistory =
        upsertPersonalAttendance(
          targetEmployeeId,
          recordDateKey,
          normalizedRecord
        );

      if (
        activeEmployeeId.current === targetEmployeeId
      ) {
        setAttendanceHistory(updatedHistory);
      }

    } catch (error) {

      if (
        activeEmployeeId.current === targetEmployeeId
      ) {
        setLocationError(
          'Attendance recorded, but attendance history could not be updated.'
        );
      }
    }

    return normalizedRecord;
  };

  // ==========================================================
  // FINISH ATTENDANCE ACTION
  // ==========================================================

  const finishAction = targetId => {
    actionInProgress.current = false;

    const currentId = activeEmployeeId.current;

    if (currentId !== targetId) {
      const restored =
        restoreActiveAttendance(currentId);

      applyAttendanceState(
        currentId,
        restored.dateKey,
        restored.record
      );

      setAttendanceHistory(
        readPersonalAttendanceHistory(currentId)
      );
    }
  };

  // ==========================================================
  // CHECK-IN
  // ==========================================================

  const handleCheckIn = async (
    targetEmployeeId = employeeId
  ) => {

    const targetId = String(
      targetEmployeeId || ''
    );

    if (!canPerformAction(targetId)) {
      return false;
    }

    const restored =
      restoreActiveAttendance(targetId);

    if (hasOpenSession(restored.record)) {

      applyAttendanceState(
        targetId,
        restored.dateKey,
        restored.record
      );

      setLocationError(
        'An active attendance session already exists.'
      );

      return false;
    }

    const currentDateKey =
      getLocalDateKey();

    const saved = readDailyAttendance(
      currentDateKey,
      targetId
    );

    if (
      saved.checkInTime ||
      saved.checkOutTime ||
      saved.hasCheckedOutToday
    ) {
      applyAttendanceState(
        targetId,
        currentDateKey,
        saved
      );

      setLocationError(
        'Attendance has already been recorded for today.'
      );

      return false;
    }

    actionInProgress.current = true;

    try {

      const location =
        await getPunchLocation(targetId);

      if (!location) {
        return false;
      }

      if (
        activeEmployeeId.current !== targetId
      ) {
        return false;
      }

      // Verify the latest stored session again after
      // waiting for device location permission.

      const latest =
        restoreActiveAttendance(targetId);

      if (hasOpenSession(latest.record)) {

        applyAttendanceState(
          targetId,
          latest.dateKey,
          latest.record
        );

        setLocationError(
          'Check-in has already been recorded.'
        );

        return false;
      }

      const checkInTime = Date.now();

      const recordDateKey =
        getLocalDateKey(checkInTime);

      const latestSaved = readDailyAttendance(
        recordDateKey,
        targetId
      );

      if (
        latestSaved.checkInTime ||
        latestSaved.checkOutTime ||
        latestSaved.hasCheckedOutToday
      ) {

        applyAttendanceState(
          targetId,
          recordDateKey,
          latestSaved
        );

        setLocationError(
          'Attendance has already been recorded for today.'
        );

        return false;
      }

      const nextAttendance = {
        ...emptyAttendance(),

        status: 'Checked In',

        checkInTime,

        checkInLocation: location
      };

      const recorded = persistAttendance(
        targetId,
        recordDateKey,
        nextAttendance
      );

      try {

        saveRosterPunch(
          targetId,
          'checkIn',
          checkInTime,
          location,
          recorded
        );

      } catch (error) {

        setLocationError(
          'Check-in recorded, but team attendance synchronization failed.'
        );
      }

      return true;

    } catch (error) {

      if (
        activeEmployeeId.current === targetId
      ) {
        setLocationError(
          error?.message ||
          'Unable to complete check-in.'
        );
      }

      return false;

    } finally {

      finishAction(targetId);
    }
  };

  // ==========================================================
  // START BREAK / RESUME WORK
  // ==========================================================

  const handleToggleBreak = () => {

    if (!canPerformAction(employeeId)) {
      return false;
    }

    const restored =
      restoreActiveAttendance(employeeId);

    const currentRecord = restored.record;

    if (!hasOpenSession(currentRecord)) {

      applyAttendanceState(
        employeeId,
        restored.dateKey,
        currentRecord
      );

      setLocationError(
        'Please check in before starting a break.'
      );

      return false;
    }

    // A stale tab must not accidentally reverse a break
    // action performed in another browser tab.

    if (
      attendanceRef.current.status !==
      currentRecord.status
    ) {

      applyAttendanceState(
        employeeId,
        restored.dateKey,
        currentRecord
      );

      setLocationError(
        'Attendance was updated in another tab. Please try again.'
      );

      return false;
    }

    actionInProgress.current = true;

    setLocationError('');

    try {

      const timestamp = Math.max(
        Date.now(),
        currentRecord.checkInTime,
        currentRecord.breakStartTime || 0
      );

      const recordDateKey =
        restored.dateKey;

      // START BREAK

      if (
        currentRecord.status === 'Checked In'
      ) {

        const nextAttendance = {
          ...currentRecord,

          status: 'On Break',

          breakStartTime: timestamp
        };

        persistAttendance(
          employeeId,
          recordDateKey,
          nextAttendance
        );

        return true;
      }

      // RESUME WORK

      if (
        currentRecord.status === 'On Break'
      ) {

        const extraBreakMilliseconds =
          getElapsedMilliseconds(
            currentRecord.breakStartTime,
            timestamp
          );

        const totalBreakMilliseconds =
          currentRecord.accumulatedBreakMilliseconds +
          extraBreakMilliseconds;

        const nextAttendance = {
          ...currentRecord,

          status: 'Checked In',

          breakStartTime: null,

          accumulatedBreakMilliseconds:
            totalBreakMilliseconds,

          accumulatedBreakSeconds:
            toSeconds(totalBreakMilliseconds)
        };

        persistAttendance(
          employeeId,
          recordDateKey,
          nextAttendance
        );

        return true;
      }

      return false;

    } catch (error) {

      setLocationError(
        error?.message ||
        'Unable to update break status.'
      );

      return false;

    } finally {

      finishAction(employeeId);
    }
  };

  // ==========================================================
  // CHECK-OUT
  // ==========================================================

  const handleCheckOut = async (
    targetEmployeeId = employeeId
  ) => {

    const targetId = String(
      targetEmployeeId || ''
    );

    if (!canPerformAction(targetId)) {
      return false;
    }

    const restored =
      restoreActiveAttendance(targetId);

    if (!hasOpenSession(restored.record)) {

      applyAttendanceState(
        targetId,
        restored.dateKey,
        restored.record
      );

      setLocationError(
        'No active attendance session is available.'
      );

      return false;
    }

    const expectedCheckInTime =
      restored.record.checkInTime;

    actionInProgress.current = true;

    try {

      const location =
        await getPunchLocation(targetId);

      if (!location) {
        return false;
      }

      if (
        activeEmployeeId.current !== targetId
      ) {
        return false;
      }

      // Read fresh attendance after location capture.
      // Prevent overwriting changes made in another tab.

      const latest =
        restoreActiveAttendance(targetId);

      const currentRecord = latest.record;

      if (
        !hasOpenSession(currentRecord) ||
        currentRecord.checkInTime !==
          expectedCheckInTime
      ) {

        applyAttendanceState(
          targetId,
          latest.dateKey,
          currentRecord
        );

        setLocationError(
          'Attendance has already been updated.'
        );

        return false;
      }

      const checkOutTime = Math.max(
        Date.now(),
        currentRecord.checkInTime,
        currentRecord.breakStartTime || 0
      );

      let finalBreakMilliseconds =
        currentRecord.accumulatedBreakMilliseconds;

      // Include unfinished break duration at checkout.

      if (
        currentRecord.status === 'On Break' &&
        currentRecord.breakStartTime
      ) {

        finalBreakMilliseconds +=
          getElapsedMilliseconds(
            currentRecord.breakStartTime,
            checkOutTime
          );
      }

      finalBreakMilliseconds = Math.min(
        finalBreakMilliseconds,

        getElapsedMilliseconds(
          currentRecord.checkInTime,
          checkOutTime
        )
      );

      const nextAttendance = {
        ...currentRecord,

        status: 'Checked Out',

        hasCheckedOutToday: true,

        checkOutTime,

        breakStartTime: null,

        accumulatedBreakMilliseconds:
          finalBreakMilliseconds,

        accumulatedBreakSeconds:
          toSeconds(finalBreakMilliseconds),

        checkOutLocation: location
      };

      // Overnight checkout is saved against
      // the original check-in date.

      const recordDateKey =
        getLocalDateKey(
          currentRecord.checkInTime
        );

      const recorded = persistAttendance(
        targetId,
        recordDateKey,
        nextAttendance
      );

      try {

        saveRosterPunch(
          targetId,
          'checkOut',
          checkOutTime,
          location,
          recorded
        );

      } catch (error) {

        setLocationError(
          'Check-out recorded, but team attendance synchronization failed.'
        );
      }

      return true;

    } catch (error) {

      if (
        activeEmployeeId.current === targetId
      ) {
        setLocationError(
          error?.message ||
          'Unable to complete check-out.'
        );
      }

      return false;

    } finally {

      finishAction(targetId);
    }
  };

  // ==========================================================
  // LIVE BREAK CALCULATION
  // Millisecond accuracy prevents timer fluctuations.
  // ==========================================================

  const currentSessionBreakMilliseconds =
    currentAttendance.status === 'On Break' &&
    currentAttendance.breakStartTime

      ? getElapsedMilliseconds(
          currentAttendance.breakStartTime,
          now
        )

      : 0;

  const currentBreakMilliseconds = Math.max(
    0,

    currentAttendance.accumulatedBreakMilliseconds +
      currentSessionBreakMilliseconds
  );

  const currentSessionBreakSeconds =
    toSeconds(currentSessionBreakMilliseconds);

  const currentBreakSeconds =
    toSeconds(currentBreakMilliseconds);

  // ==========================================================
  // TOTAL ELAPSED TIME
  // ==========================================================

  const endPoint =
    currentAttendance.checkOutTime || now;

  const totalElapsedMilliseconds =
    currentAttendance.checkInTime

      ? getElapsedMilliseconds(
          currentAttendance.checkInTime,
          endPoint
        )

      : 0;

  const totalElapsedSeconds =
    toSeconds(totalElapsedMilliseconds);

  // ==========================================================
  // NET WORKING HOURS
  // Freeze working time while the employee is on break.
  // ==========================================================

  const workingEndPoint =
    currentAttendance.status === 'On Break' &&
    currentAttendance.breakStartTime

      ? currentAttendance.breakStartTime

      : endPoint;

  const netWorkingMilliseconds =
    currentAttendance.checkInTime

      ? Math.max(
          0,

          getElapsedMilliseconds(
            currentAttendance.checkInTime,
            workingEndPoint
          ) -

          currentAttendance.accumulatedBreakMilliseconds
        )

      : 0;

  const liveWorkingSeconds =
    toSeconds(netWorkingMilliseconds);

  // ==========================================================
  // FORMATTED WORKING HOURS
  // ==========================================================

  const liveWorkingFormatted =
    formatDuration(liveWorkingSeconds);

  const liveBreakFormatted =
    formatDuration(currentBreakSeconds);

  const currentBreakFormatted =
    formatDuration(currentSessionBreakSeconds);

  const totalElapsedFormatted =
    formatDuration(totalElapsedSeconds);

  const currentDateFormatted =
    new Date(now).toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );

  const currentTimeFormatted =
    new Date(now).toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }
    );

  // ==========================================================
  // ATTENDANCE STATUS DISPLAY
  // ==========================================================

  const attendanceStatusLabel = {

    'Not Checked In': 'Not Checked In',

    'Checked In': 'Working Now',

    'On Break': 'On Break',

    'Checked Out': 'Workday Completed'

  }[currentAttendance.status] ||
    'Attendance Unavailable';

  // ==========================================================
  // LATE ARRIVAL CHECK
  // Existing 09:40 AM threshold preserved.
  // ==========================================================

  const isLateArrival = () => {

    if (!currentAttendance.checkInTime) {
      return false;
    }

    const checkInDate = new Date(
      currentAttendance.checkInTime
    );

    const lateThreshold = new Date(
      currentAttendance.checkInTime
    );

    lateThreshold.setHours(
      LATE_ARRIVAL_HOUR,
      LATE_ARRIVAL_MINUTE,
      0,
      0
    );

    return checkInDate > lateThreshold;
  };

  // ==========================================================
  // CONTEXT PROVIDER
  // Existing context properties preserved.
  // ==========================================================

  return (
    <AttendanceContext.Provider
      value={{

        // Attendance status

        status:
          currentAttendance.status,

        attendanceStatusLabel,

        hasCheckedOutToday: Boolean(
          currentAttendance.hasCheckedOutToday &&
          dateKey === getLocalDateKey(now)
        ),

        isWorking:
          currentAttendance.status === 'Checked In',

        isOnBreak:
          currentAttendance.status === 'On Break',

        isDayCompleted:
          currentAttendance.status === 'Checked Out',

        // Attendance timestamps

        checkInTimestamp:
          currentAttendance.checkInTime,

        checkOutTimestamp:
          currentAttendance.checkOutTime,

        breakStartTimestamp:
          currentAttendance.breakStartTime,

        // Formatted attendance times

        checkInFormatted: formatClockTime(
          currentAttendance.checkInTime
        ),

        checkOutFormatted: formatClockTime(
          currentAttendance.checkOutTime
        ),

        // Attendance history

        attendanceHistory:
          currentAttendanceHistory,

        attendanceDateKey:
          dateKey,

        // Live working time

        liveWorkingSeconds,

        liveWorkingFormatted,

        // Break time

        liveBreakSeconds:
          currentBreakSeconds,

        liveBreakFormatted,

        currentSessionBreakSeconds,

        currentBreakFormatted,

        accumulatedBreakSeconds:
          currentAttendance.accumulatedBreakSeconds,

        // Total elapsed time

        totalElapsedSeconds,

        totalElapsedFormatted,

        // Current date and time

        currentDateFormatted,

        currentTimeFormatted,

        // Late arrival

        isLate:
          isLateArrival(),

        // Location information

        checkInLocation:
          currentAttendance.checkInLocation || null,

        checkOutLocation:
          currentAttendance.checkOutLocation || null,

        locationLoading,

        locationError,

        // Attendance actions

        handleCheckIn,

        handleToggleBreak,

        handleCheckOut
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

// ============================================================
// CUSTOM ATTENDANCE HOOK
// ============================================================

export const useAttendance = () =>
  useContext(AttendanceContext);