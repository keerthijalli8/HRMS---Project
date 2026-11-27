import React, {
  useState,
  useMemo,
  useEffect,
  useRef
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { formatDate } from '../../utils/helpers.js';
import { LocationModal } from '../../components/common/LocationModal.jsx';
import { ApprovalCommentModal } from '../../components/modals/ApprovalCommentModal.jsx';
import { readStorage } from '../../utils/storage.js';

import {
  Clock,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Bell,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';

// ============================================================
// ATTENDANCE CONFIGURATION
// ============================================================

const ROSTER_PUNCHES_KEY =
  'technomold_teamlead_attendance_roster_punches';

const ATTENDANCE_SESSIONS_KEY =
  'technomold_teamlead_attendance_sessions';

const ATTENDANCE_EVENT =
  'technomold:teamlead:attendance-punch';

const LATE_ARRIVAL_HOUR = 9;
const LATE_ARRIVAL_MINUTE = 30;

const LATE_TIME_LABEL =
  `${String(LATE_ARRIVAL_HOUR).padStart(2, '0')}:${String(
    LATE_ARRIVAL_MINUTE
  ).padStart(2, '0')} AM`;

const PAGE_SIZE = 8;

// ============================================================
// DATE HELPERS
// ============================================================

const getLocalDate = (value = new Date()) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

const parseLocalDate = value => {
  const [year, month, day] =
    String(value).split('-').map(Number);

  return new Date(year, month - 1, day);
};

const isValidDateKey = value => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  return getLocalDate(parseLocalDate(value)) === value;
};

const getTimestamp = value => {
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

const formatTime = value => {
  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return '—';
  }

  return new Date(timestamp).toLocaleTimeString(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  );
};

const formatDuration = seconds => {
  const numericValue = Number(seconds);

  const totalSeconds =
    Number.isFinite(numericValue)
      ? Math.max(0, Math.floor(numericValue))
      : 0;

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

const formatPunchTime = (timestamp, dateKey) => {
  if (!timestamp) {
    return '—';
  }

  const punchDate = getLocalDate(timestamp);

  if (punchDate !== dateKey) {
    return `${formatTime(timestamp)} (${punchDate})`;
  }

  return formatTime(timestamp);
};

// ============================================================
// EMPLOYEE ID HELPERS
// ============================================================

const getEmployeeIds = member => {
  return [
    member?.employeeId,
    member?.id
  ]
    .filter(value =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    )
    .map(String)
    .filter((value, index, array) =>
      array.indexOf(value) === index
    );
};

const getEmployeeId = member =>
  getEmployeeIds(member)[0] || '';

const matchesEmployee = (member, employeeId) =>
  getEmployeeIds(member).includes(
    String(employeeId ?? '')
  );

// ============================================================
// STORAGE HELPERS
// ============================================================

const normalizeObject = value =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value)
    ? value
    : {};

const readRosterPunches = () =>
  normalizeObject(
    readStorage(ROSTER_PUNCHES_KEY, {})
  );

const readAttendanceSessions = () =>
  normalizeObject(
    readStorage(ATTENDANCE_SESSIONS_KEY, {})
  );

const readAttendanceHistory = employeeId => {
  if (!employeeId) {
    return [];
  }

  const history = readStorage(
    `technomold_teamlead_personal_attendance_${employeeId}`,
    []
  );

  return Array.isArray(history)
    ? history.filter(
        item => item && typeof item === 'object'
      )
    : [];
};

// ============================================================
// ATTENDANCE RECORD NORMALIZATION
// ============================================================

const normalizeAttendanceRecord = record => {
  if (
    !record ||
    typeof record !== 'object' ||
    Array.isArray(record)
  ) {
    return null;
  }

  const checkInTime = getTimestamp(
    record.checkInTime || record.checkIn
  );

  if (!checkInTime) {
    return null;
  }

  const rawCheckOutTime = getTimestamp(
    record.checkOutTime || record.checkOut
  );

  const checkOutTime =
    rawCheckOutTime &&
    rawCheckOutTime >= checkInTime
      ? rawCheckOutTime
      : null;

  const rawBreakStartTime = getTimestamp(
    record.breakStartTime ||
    record.activeBreak?.start
  );

  const breakStartTime =
    rawBreakStartTime &&
    rawBreakStartTime >= checkInTime &&
    !checkOutTime
      ? rawBreakStartTime
      : null;

  const savedBreakMilliseconds = Number(
    record.accumulatedBreakMilliseconds
  );

  const savedBreakSeconds = Number(
    record.accumulatedBreakSeconds ??
    record.breakSeconds ??
    0
  );

  let accumulatedBreakMilliseconds =
    record.accumulatedBreakMilliseconds != null &&
    Number.isFinite(savedBreakMilliseconds)
      ? Math.max(0, savedBreakMilliseconds)
      : Number.isFinite(savedBreakSeconds)
        ? Math.max(0, savedBreakSeconds * 1000)
        : 0;

  if (checkOutTime) {
    accumulatedBreakMilliseconds = Math.min(
      accumulatedBreakMilliseconds,
      checkOutTime - checkInTime
    );
  }

  return {
    ...record,

    checkInTime,
    checkOutTime,
    breakStartTime,

    dateKey: getLocalDate(checkInTime),

    accumulatedBreakMilliseconds,

    accumulatedBreakSeconds: Math.floor(
      accumulatedBreakMilliseconds / 1000
    ),

    status: checkOutTime
      ? 'Checked Out'
      : breakStartTime
        ? 'On Break'
        : 'Checked In',

    updatedAt:
      getTimestamp(record.updatedAt) || 0
  };
};

// ============================================================
// ATTENDANCE RECORD SELECTION
// ============================================================

const chooseLatestRecord = candidates => {
  const validRecords = candidates
    .map(normalizeAttendanceRecord)
    .filter(Boolean);

  if (!validRecords.length) {
    return null;
  }

  return validRecords.reduce((latest, record) => {
    if (record.checkInTime !== latest.checkInTime) {
      return record.checkInTime > latest.checkInTime
        ? record
        : latest;
    }

    // A completed session must not be reopened by
    // an older incomplete storage record.

    if (
      Boolean(record.checkOutTime) !==
      Boolean(latest.checkOutTime)
    ) {
      return record.checkOutTime
        ? record
        : latest;
    }

    return record.updatedAt > latest.updatedAt
      ? record
      : latest;

  });
};

// ============================================================
// BUILD STORAGE SNAPSHOT
// Read stored records separately from the live clock.
// ============================================================

const buildAttendanceSnapshot = (
  members,
  dateKeys,
  contextSessions
) => {
  const rosterPunches = readRosterPunches();

  const storedSessions = readAttendanceSessions();

  const snapshot = new Map();

  members.forEach(member => {
    const ids = getEmployeeIds(member);

    const employeeId = getEmployeeId(member);

    if (!employeeId) {
      return;
    }

    const candidatesByDate = new Map();

    const addCandidate = rawRecord => {
      const record =
        normalizeAttendanceRecord(rawRecord);

      if (!record) {
        return;
      }

      const existing =
        candidatesByDate.get(record.dateKey) || [];

      existing.push(record);

      candidatesByDate.set(
        record.dateKey,
        existing
      );
    };

    // Daily records are checked first.
    // History, sessions and roster remain compatible.

    ids.forEach(id => {
      dateKeys.forEach(dateKey => {
        addCandidate(
          readStorage(
            `technomold_teamlead_attendance_${id}_${dateKey}`,
            null
          )
        );
      });
    });

    ids.forEach(id => {
      readAttendanceHistory(id).forEach(addCandidate);

      addCandidate(contextSessions?.[id]);

      addCandidate(storedSessions[id]);

      addCandidate(rosterPunches[id]);
    });

    const records = new Map();

    candidatesByDate.forEach((candidates, dateKey) => {
      const latest = chooseLatestRecord(candidates);

      if (latest) {
        records.set(dateKey, latest);
      }
    });

    const latestRecord = [...records.values()]
      .filter(record =>
        record.checkInTime <= Date.now()
      )
      .sort((left, right) =>
        right.checkInTime - left.checkInTime
      )[0] || null;

    snapshot.set(employeeId, {
      records,
      latestRecord
    });
  });

  return snapshot;
};

// ============================================================
// ATTENDANCE CALCULATIONS
// ============================================================

const isLateArrival = value => {
  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return false;
  }

  const threshold = new Date(timestamp);

  threshold.setHours(
    LATE_ARRIVAL_HOUR,
    LATE_ARRIVAL_MINUTE,
    0,
    0
  );

  return timestamp > threshold.getTime();
};

const calculateAttendanceTime = (
  record,
  now,
  isActiveSession
) => {
  if (!record) {
    return {
      breakSeconds: 0,
      workingSeconds: 0
    };
  }

  const checkIn = record.checkInTime;

  const checkOut = record.checkOutTime;

  const activeBreak = record.breakStartTime;

  let breakMilliseconds =
    record.accumulatedBreakMilliseconds || 0;

  // Historical incomplete records must not be
  // treated as completed working hours.

  if (!checkOut && !isActiveSession) {
    return {
      breakSeconds: Math.floor(
        breakMilliseconds / 1000
      ),
      workingSeconds: null
    };
  }

  const endTime = checkOut || now;

  const elapsedMilliseconds = Math.max(
    0,
    endTime - checkIn
  );

  if (
    activeBreak &&
    !checkOut &&
    isActiveSession
  ) {
    breakMilliseconds += Math.max(
      0,
      endTime - activeBreak
    );
  }

  breakMilliseconds = Math.min(
    breakMilliseconds,
    elapsedMilliseconds
  );

  const workingMilliseconds = Math.max(
    0,
    elapsedMilliseconds - breakMilliseconds
  );

  return {
    breakSeconds: Math.floor(
      breakMilliseconds / 1000
    ),

    workingSeconds: Math.floor(
      workingMilliseconds / 1000
    )
  };
};

// ============================================================
// APPROVED LEAVE VALIDATION
// ============================================================

const findApprovedLeave = (
  member,
  dateKey,
  approvals
) => {
  return approvals.find(item => {
    if (
      item.category !== 'Leave Approval' ||
      !matchesEmployee(member, item.employeeId)
    ) {
      return false;
    }

    const teamLeadApproval = String(
      item.teamLeadApproval ??
      item.managerApprovalStatus ??
      ''
    ).toLowerCase();

    const hrApproval = String(
      item.hrApproval ??
      item.hrApprovalStatus ??
      ''
    ).toLowerCase();

    const fromDate = String(
      item.fromDate || ''
    ).slice(0, 10);

    const toDate = String(
      item.toDate || ''
    ).slice(0, 10);

    return (
      teamLeadApproval === 'approved' &&
      hrApproval === 'approved' &&
      isValidDateKey(fromDate) &&
      isValidDateKey(toDate) &&
      dateKey >= fromDate &&
      dateKey <= toDate
    );
  });
};

// ============================================================
// BUILD ATTENDANCE ROW
// ============================================================

const buildAttendanceRow = (
  member,
  dateKey,
  snapshot,
  approvals,
  now
) => {
  const employeeId = getEmployeeId(member);

  const employeeSnapshot =
    snapshot.get(employeeId);

  const record =
    employeeSnapshot?.records.get(dateKey) || null;

  const today = getLocalDate(now);

  const approvedLeave = findApprovedLeave(
    member,
    dateKey,
    approvals
  );

  if (!record || record.checkInTime > now) {
    return {
      ...member,

      employeeId,
      dateKey,

      checkInTime: null,
      checkOutTime: null,

      checkInLocation: null,
      checkOutLocation: null,

      breakSeconds: 0,
      workingSeconds: 0,

      hasRecord: Boolean(approvedLeave),

      isLate: false,

      sessionStatus: approvedLeave
        ? 'On Leave'
        : 'Not Checked In',

      attendanceStatus: approvedLeave
        ? 'leave'
        : dateKey === today
          ? 'none'
          : 'no-record'
    };
  }

  const latestRecord =
    employeeSnapshot?.latestRecord;

  const isActiveSession = Boolean(
    !record.checkOutTime &&
    latestRecord &&
    latestRecord.checkInTime === record.checkInTime &&
    !latestRecord.checkOutTime
  );

  const isOvernight =
    getLocalDate(record.checkInTime) !== today;

  const {
    breakSeconds,
    workingSeconds
  } = calculateAttendanceTime(
    record,
    now,
    isActiveSession
  );

  const workMode = String(
    record.workMode ||
    record.attendanceMode ||
    ''
  ).trim().toLowerCase();

  const isRemote = [
    'remote',
    'wfh',
    'work from home'
  ].includes(workMode);

  const late = isLateArrival(
    record.checkInTime
  );

  let attendanceStatus = 'present';

  if (isRemote) {
    attendanceStatus = 'remote';
  } else if (late) {
    attendanceStatus = 'late';
  } else if (
    workMode === 'office' ||
    workMode === 'onsite'
  ) {
    attendanceStatus = 'office';
  }

  let sessionStatus = 'Incomplete Session';

  if (record.checkOutTime) {
    sessionStatus = 'Checked Out';
  } else if (isActiveSession) {
    sessionStatus = record.breakStartTime
      ? 'On Break'
      : 'Working';
  }

  return {
    ...member,

    employeeId,
    dateKey,

    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,

    checkInLocation:
      record.checkInLocation || null,

    checkOutLocation:
      record.checkOutLocation || null,

    breakSeconds,
    workingSeconds,

    attendanceStatus,
    sessionStatus,

    isActiveSession,
    isOvernight,
    isLate: late,

    hasRecord: true
  };
};

// ============================================================
// ATTENDANCE SUMMARY
// ============================================================

const getAttendanceSummary = rows => {
  const count = status =>
    rows.filter(
      row => row.attendanceStatus === status
    ).length;

  const office = count('office');

  const remote = count('remote');

  const late = rows.filter(
    row => row.attendanceStatus === 'late'
  ).length;

  const present =
    count('present') +
    office +
    remote +
    late;

  return {
    total: rows.length,

    office,
    remote,
    late,
    present,

    leave: count('leave'),

    notPunched: count('none'),

    noRecord: count('no-record'),

    working: rows.filter(
      row => row.sessionStatus === 'Working'
    ).length,

    onBreak: rows.filter(
      row => row.sessionStatus === 'On Break'
    ).length,

    checkedOut: rows.filter(
      row => row.sessionStatus === 'Checked Out'
    ).length,

    recorded: rows.filter(
      row => row.hasRecord
    ).length
  };
};

// ============================================================
// STATUS HELPERS
// ============================================================

const getStatusLabel = status => {
  const labels = {
    office: 'In Office',
    remote: 'Remote (WFH)',
    late: 'Late Arrival',
    present: 'Present',
    leave: 'On Leave',
    none: 'Not Punched',
    'no-record': 'No Record'
  };

  return labels[status] || status;
};

const matchesStatus = (member, status) => {
  if (status === 'all') {
    return true;
  }

  if (status === 'present') {
    return [
      'office',
      'remote',
      'late',
      'present'
    ].includes(member.attendanceStatus);
  }

  if (status === 'working') {
    return member.sessionStatus === 'Working';
  }

  if (status === 'on-break') {
    return member.sessionStatus === 'On Break';
  }

  if (status === 'checked-out') {
    return member.sessionStatus === 'Checked Out';
  }

  if (status === 'incomplete') {
    return member.sessionStatus === 'Incomplete Session';
  }

  return member.attendanceStatus === status;
};

const getSessionColor = status => {
  const colors = {
    Working: 'text-good',
    'On Break': 'text-warn',
    'Checked Out': 'text-info',
    'Incomplete Session': 'text-bad'
  };

  return colors[status] || 'text-muted';
};

// ============================================================
// CSV EXPORT HELPERS
// ============================================================

const escapeCSV = value => {
  let text = String(value ?? '');

  // Prevent spreadsheet formula injection.

  if (
    /^[\s]*[=+\-@]/.test(text) ||
    /^[\t\r\n]/.test(text)
  ) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCSV = (filename, rows) => {
  const content = rows
    .map(row => row.map(escapeCSV).join(','))
    .join('\r\n');

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

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};

const CSV_HEADERS = [
  'Date',
  'Employee ID',
  'Employee Name',
  'Designation',
  'Check In',
  'Check Out',
  'Break Duration',
  'Working Hours',
  'Status',
  'Session Status'
];

const getExportRows = rows =>
  rows.map(member => [
    member.dateKey,
    member.employeeId,
    member.name,
    member.designation,

    member.checkInTime
      ? formatPunchTime(
          member.checkInTime,
          member.dateKey
        )
      : '',

    member.checkOutTime
      ? formatPunchTime(
          member.checkOutTime,
          member.dateKey
        )
      : '',

    member.checkInTime
      ? formatDuration(member.breakSeconds)
      : '',

    member.checkInTime &&
    member.workingSeconds !== null
      ? formatDuration(member.workingSeconds)
      : '',

    getStatusLabel(member.attendanceStatus),

    member.sessionStatus
  ]);

// ============================================================
// LOCATION BUTTON
// ============================================================

const PunchLocation = ({
  location,
  onClick
}) => {
  if (!location) {
    return null;
  }

  const rawLatitude =
    location.latitude ?? location.lat;

  const rawLongitude =
    location.longitude ?? location.lng;

  const latitude = Number(rawLatitude);

  const longitude = Number(rawLongitude);

  const validCoordinates =
    rawLatitude != null &&
    rawLongitude != null &&
    String(rawLatitude).trim() !== '' &&
    String(rawLongitude).trim() !== '' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const label =
    location.address ||
    location.label ||
    (
      validCoordinates
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : typeof location === 'string'
          ? location
          : 'Location captured'
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        mt-1 inline-flex max-w-full items-center
        justify-center gap-1 text-[10px]
        leading-tight text-teal-300 hover:text-white
      "
      title={`View location: ${label}`}
      aria-label={`View location: ${label}`}
    >
      <MapPin className="h-3 w-3 shrink-0" />

      <span className="max-w-[120px] truncate">
        {label}
      </span>
    </button>
  );
};

// ============================================================
// MAIN ATTENDANCE COMPONENT
// ============================================================

export const Attendance = () => {
  const {
    teamMembers = [],
    approvals = [],
    attendanceSessions = {},
    decideApproval,
    globalSearchTerm = '',
    triggerToast
  } = useTeamLead();

  const attendanceMembers = useMemo(
    () =>
      Array.isArray(teamMembers)
        ? teamMembers.filter(
            member => Boolean(getEmployeeId(member))
          )
        : [],
    [teamMembers]
  );

  const scopedApprovals = useMemo(
    () =>
      Array.isArray(approvals)
        ? approvals.filter(
            item =>
              item &&
              attendanceMembers.some(member =>
                matchesEmployee(
                  member,
                  item.employeeId
                )
              )
          )
        : [],
    [approvals, attendanceMembers]
  );

  const [now, setNow] = useState(Date.now());

  const [activeTab, setActiveTab] =
    useState('daily');

  const [selectedDate, setSelectedDate] =
    useState(() => getLocalDate());

  const [calendarDate, setCalendarDate] =
    useState(() => {
      const date = new Date();

      return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );
    });

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [locationDetails, setLocationDetails] =
    useState(null);

  const [directDecision, setDirectDecision] =
    useState(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [regularizationFilter, setRegularizationFilter] =
    useState('all');

  const [storageRevision, setStorageRevision] =
    useState(0);

  const decisionLock = useRef(false);

  const previousToday = useRef(
    getLocalDate()
  );

  const today = getLocalDate(now);

  const effectiveSearch = String(
    searchTerm || globalSearchTerm || ''
  ).trim().toLowerCase();

  // ==========================================================
  // LIVE CLOCK
  // ==========================================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // ==========================================================
  // ATTENDANCE STORAGE SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {
    const syncPunch = () => {
      setStorageRevision(previous => previous + 1);

      setNow(Date.now());
    };

    const syncStorage = event => {
      if (
        !event.key ||
        event.key.startsWith(
          'technomold_teamlead_attendance'
        ) ||
        event.key.startsWith(
          'technomold_teamlead_personal_attendance'
        )
      ) {
        syncPunch();
      }
    };

    const syncVisibility = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        syncPunch();
      }
    };

    // Fallback polling also captures same-tab
    // break/resume changes that do not emit a punch event.

    const storageTimer = window.setInterval(
      syncPunch,
      5000
    );

    window.addEventListener(
      ATTENDANCE_EVENT,
      syncPunch
    );

    window.addEventListener(
      'storage',
      syncStorage
    );

    window.addEventListener(
      'focus',
      syncPunch
    );

    document.addEventListener(
      'visibilitychange',
      syncVisibility
    );

    return () => {
      window.clearInterval(storageTimer);

      window.removeEventListener(
        ATTENDANCE_EVENT,
        syncPunch
      );

      window.removeEventListener(
        'storage',
        syncStorage
      );

      window.removeEventListener(
        'focus',
        syncPunch
      );

      document.removeEventListener(
        'visibilitychange',
        syncVisibility
      );
    };
  }, []);

  // ==========================================================
  // AUTOMATIC DATE ROLLOVER
  // ==========================================================

  useEffect(() => {
    if (previousToday.current !== today) {
      const oldToday = previousToday.current;

      previousToday.current = today;

      // Only follow the new day if the user was
      // already viewing the previous current day.

      if (selectedDate === oldToday) {
        setSelectedDate(today);

        const date = parseLocalDate(today);

        setCalendarDate(
          new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          )
        );

        setCurrentPage(1);
      }

      setStorageRevision(previous => previous + 1);
    }
  }, [today, selectedDate]);

  // ==========================================================
  // SELECTED DATE MANAGEMENT
  // ==========================================================

  const handleDateChange = value => {
    if (
      !isValidDateKey(value) ||
      value > today
    ) {
      return;
    }

    setSelectedDate(value);

    const date = parseLocalDate(value);

    setCalendarDate(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );

    setCurrentPage(1);
  };

  const handleToday = () =>
    handleDateChange(today);

  // ==========================================================
  // MONTHLY CALENDAR CONFIGURATION
  // ==========================================================

  const calendarYear =
    calendarDate.getFullYear();

  const calendarMonth =
    calendarDate.getMonth();

  const monthTitle =
    calendarDate.toLocaleDateString(
      'en-GB',
      {
        month: 'long',
        year: 'numeric'
      }
    );

  const firstDayOffset =
    (
      new Date(
        calendarYear,
        calendarMonth,
        1
      ).getDay() + 6
    ) % 7;

  const daysInMonth = new Date(
    calendarYear,
    calendarMonth + 1,
    0
  ).getDate();

  const isCurrentMonth =
    getLocalDate(calendarDate).slice(0, 7) ===
    today.slice(0, 7);

  const handleMonthChange = direction => {
    const nextMonth = new Date(
      calendarYear,
      calendarMonth + direction,
      1
    );

    const nextMonthKey =
      getLocalDate(nextMonth);

    if (
      nextMonthKey.slice(0, 7) >
      today.slice(0, 7)
    ) {
      return;
    }

    setCalendarDate(nextMonth);

    setSelectedDate(
      nextMonthKey.slice(0, 7) === today.slice(0, 7)
        ? today
        : nextMonthKey
    );

    setCurrentPage(1);
  };

  // ==========================================================
  // MONTH DATE KEYS
  // ==========================================================

  const monthDateKeys = useMemo(() => {
    return Array.from(
      { length: daysInMonth },
      (_, index) =>
        getLocalDate(
          new Date(
            calendarYear,
            calendarMonth,
            index + 1
          )
        )
    ).filter(dateKey => dateKey <= today);

  }, [
    calendarYear,
    calendarMonth,
    daysInMonth,
    today
  ]);

  // ==========================================================
  // ATTENDANCE STORAGE SNAPSHOT
  // ==========================================================

  const attendanceSnapshot = useMemo(() => {
    const yesterday = parseLocalDate(today);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const dates = [
      ...new Set([
        ...monthDateKeys,
        selectedDate,
        today,
        getLocalDate(yesterday)
      ])
    ];

    return buildAttendanceSnapshot(
      attendanceMembers,
      dates,
      attendanceSessions
    );

  }, [
    attendanceMembers,
    attendanceSessions,
    monthDateKeys,
    selectedDate,
    today,
    storageRevision
  ]);

  // ==========================================================
  // DAILY ATTENDANCE DATA
  // ==========================================================

  const attendanceRows = useMemo(() =>
    attendanceMembers.map(member =>
      buildAttendanceRow(
        member,
        selectedDate,
        attendanceSnapshot,
        scopedApprovals,
        now
      )
    ),
    [
      attendanceMembers,
      selectedDate,
      attendanceSnapshot,
      scopedApprovals,
      now
    ]
  );

  const summary = useMemo(
    () => getAttendanceSummary(attendanceRows),
    [attendanceRows]
  );

  // ==========================================================
  // FILTERS AND PAGINATION
  // ==========================================================

  const filteredMembers = useMemo(() =>
    attendanceRows.filter(member => {
      const matchSearch = [
        member.name,
        member.employeeId,
        member.designation
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(effectiveSearch)
      );

      return (
        matchSearch &&
        matchesStatus(member, statusFilter)
      );
    }),
    [
      attendanceRows,
      effectiveSearch,
      statusFilter
    ]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredMembers.length / PAGE_SIZE
    )
  );

  const safePage = Math.max(
    1,
    Math.min(currentPage, totalPages)
  );

  const paginatedMembers = useMemo(() => {
    const start =
      (safePage - 1) * PAGE_SIZE;

    return filteredMembers.slice(
      start,
      start + PAGE_SIZE
    );
  }, [
    filteredMembers,
    safePage
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    effectiveSearch,
    statusFilter,
    selectedDate
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ==========================================================
  // REGULARIZATION REQUESTS
  // ==========================================================

  const regularizationRequests = useMemo(() =>
    scopedApprovals.filter(
      item =>
        item.category === 'Attendance Regularization'
    ),
    [scopedApprovals]
  );

  const pendingRegularizations =
    regularizationRequests.filter(
      item => item.status === 'pending'
    ).length;

  const filteredRegularizations =
    regularizationRequests.filter(item =>
      regularizationFilter === 'all' ||
      item.status === regularizationFilter
    );

  const openRegularizationDecision = (
    request,
    action
  ) => {
    if (
      decisionLock.current ||
      request.status !== 'pending'
    ) {
      return;
    }

    setDirectDecision({
      approval: request,
      action
    });
  };

  const handleRegularizationDecision =
    async comment => {

      if (decisionLock.current) {
        throw new Error(
          'A decision is already being submitted.'
        );
      }

      if (!directDecision) {
        throw new Error(
          'No request selected.'
        );
      }

      const latestRequest =
        regularizationRequests.find(
          item =>
            item.id === directDecision.approval.id
        );

      if (
        !latestRequest ||
        latestRequest.status !== 'pending'
      ) {
        throw new Error(
          'This request is no longer pending.'
        );
      }

      if (
        !['approved', 'rejected'].includes(
          directDecision.action
        )
      ) {
        throw new Error(
          'Invalid approval action.'
        );
      }

      if (
        typeof decideApproval !== 'function'
      ) {
        throw new Error(
          'Approval service is unavailable.'
        );
      }

      decisionLock.current = true;

      setIsSubmitting(true);

      try {
        const updated = await decideApproval(
          latestRequest.id,
          directDecision.action,
          comment
        );

        if (
          !updated ||
          updated.success === false
        ) {
          throw new Error(
            updated?.message ||
            'Unable to update regularization request.'
          );
        }

        setDirectDecision(null);

        setStorageRevision(
          previous => previous + 1
        );

        return updated;

      } finally {
        decisionLock.current = false;

        setIsSubmitting(false);
      }
    };

  // ==========================================================
  // LOCATION DETAILS
  // ==========================================================

  const openLocationDetails = member => {
    setLocationDetails({
      attendanceRecord: {
        checkInTime:
          member.checkInTime,

        checkOutTime:
          member.checkOutTime,

        checkInLocation:
          member.checkInLocation,

        checkOutLocation:
          member.checkOutLocation
      },

      userName: member.name,

      userRole: member.designation
    });
  };

  // ==========================================================
  // REMINDER
  // ==========================================================

  const handleSendReminder = member => {
    triggerToast?.(
      `Reminder delivery for ${member.name} requires backend integration.`,
      'info'
    );
  };

  // ==========================================================
  // MONTHLY ATTENDANCE DATA
  // Refresh summary once per minute rather than every second.
  // ==========================================================

  const monthlyClock = Math.floor(
    now / 60000
  ) * 60000;

  const monthlyAttendance = useMemo(() => {
    const records = {};

    const calculationTime = Math.max(
      monthlyClock,
      Date.now()
    );

    monthDateKeys.forEach(dateKey => {
      records[dateKey] =
        attendanceMembers.map(member =>
          buildAttendanceRow(
            member,
            dateKey,
            attendanceSnapshot,
            scopedApprovals,
            calculationTime
          )
        );
    });

    return records;

  }, [
    monthDateKeys,
    attendanceMembers,
    attendanceSnapshot,
    scopedApprovals,
    monthlyClock
  ]);

  const monthlySummaries = useMemo(() => {
    const summaries = {};

    Object.entries(monthlyAttendance).forEach(
      ([dateKey, rows]) => {
        summaries[dateKey] =
          getAttendanceSummary(rows);
      }
    );

    return summaries;
  }, [monthlyAttendance]);

  // ==========================================================
  // DAILY CSV EXPORT
  // ==========================================================

  const handleDailyExport = () => {
    const rows = filteredMembers.filter(
      member => member.hasRecord
    );

    if (!rows.length) {
      triggerToast?.(
        'No attendance records available for the selected date and filters.',
        'warn'
      );

      return;
    }

    try {
      downloadCSV(
        `attendance-${selectedDate}.csv`,
        [
          CSV_HEADERS,
          ...getExportRows(rows)
        ]
      );

      triggerToast?.(
        'Daily attendance CSV download started.',
        'good'
      );

    } catch (error) {
      triggerToast?.(
        error?.message ||
        'Unable to export attendance records.',
        'bad'
      );
    }
  };

  // ==========================================================
  // MONTHLY CSV EXPORT
  // ==========================================================

  const handleMonthlyExport = () => {
    const exportTime = Date.now();

    const rows = monthDateKeys
      .flatMap(dateKey =>
        attendanceMembers.map(member =>
          buildAttendanceRow(
            member,
            dateKey,
            attendanceSnapshot,
            scopedApprovals,
            exportTime
          )
        )
      )
      .filter(member => member.hasRecord);

    if (!rows.length) {
      triggerToast?.(
        'No attendance records available for this month.',
        'warn'
      );

      return;
    }

    const month = String(
      calendarMonth + 1
    ).padStart(2, '0');

    try {
      downloadCSV(
        `monthly-attendance-${calendarYear}-${month}.csv`,
        [
          CSV_HEADERS,
          ...getExportRows(rows)
        ]
      );

      triggerToast?.(
        `${monthTitle} attendance CSV download started.`,
        'good'
      );

    } catch (error) {
      triggerToast?.(
        error?.message ||
        'Unable to export monthly attendance.',
        'bad'
      );
    }
  };

  // ==========================================================
  // KPI CARDS
  // ==========================================================

  const kpiCards = [
    {
      key: 'all',
      label: 'Total Team',
      value: summary.total,
      color: 'text-ink',
      border: 'border-accent',
      caption: 'Authorized team members'
    },
    {
      key: 'present',
      label: 'Present',
      value: summary.present,
      color: 'text-good',
      border: 'border-good',
      caption: 'Recorded check-ins'
    },
    {
      key: 'remote',
      label: 'Remote (WFH)',
      value: summary.remote,
      color: 'text-info',
      border: 'border-info',
      caption: 'Recorded remote work'
    },
    {
      key: 'late',
      label: 'Late Arrivals',
      value: summary.late,
      color: 'text-warn',
      border: 'border-warn',
      caption: `Non-remote punch after ${LATE_TIME_LABEL}`
    },
    {
      key: 'leave',
      label: 'On Leave',
      value: summary.leave,
      color: 'text-accent2',
      border: 'border-accent2',
      caption: 'Approved leave requests'
    },
    {
      key: selectedDate === today
        ? 'none'
        : 'no-record',

      label: selectedDate === today
        ? 'Not Punched'
        : 'No Record',

      value: selectedDate === today
        ? summary.notPunched
        : summary.noRecord,

      color: 'text-bad',

      border: 'border-bad',

      caption: 'No recorded check-in'
    }
  ];

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* LOCATION MODAL */}

      <LocationModal
        {...(locationDetails || {})}
        open={Boolean(locationDetails)}
        onClose={() =>
          setLocationDetails(null)
        }
      />

      {/* ====================================================
          KPI CARDS
      ==================================================== */}

      <div className="
        grid grid-cols-2 sm:grid-cols-3
        lg:grid-cols-6 gap-3
      ">
        {kpiCards.map(card => (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              setActiveTab('daily');
              setStatusFilter(card.key);
              setCurrentPage(1);
            }}
            aria-pressed={
              statusFilter === card.key
            }
            className={`
              glass-card kpi-card
              !h-[125px] !p-4
              flex flex-col justify-between
              text-left cursor-pointer transition

              ${statusFilter === card.key
                ? card.border
                : ''}
            `}
          >
            <span className={`
              text-xs font-medium uppercase
              tracking-wider ${card.color}
            `}>
              {card.label}
            </span>

            <div className={`
              text-2xl font-data font-bold
              tabular-nums ${card.color}
            `}>
              {card.value}
            </div>

            <span className="text-xs text-muted">
              {card.caption}
            </span>
          </button>
        ))}
      </div>

      {/* ====================================================
          NAVIGATION AND DATE FILTER
      ==================================================== */}

      <div className="
        glass-card !p-3 flex flex-wrap
        items-center justify-between gap-3
      ">

        <div className="
          flex flex-wrap items-center gap-1.5
        ">
          {[
            {
              id: 'daily',
              label: 'Daily Attendance Log',
              icon: Clock
            },
            {
              id: 'calendar',
              label: 'Monthly Calendar',
              icon: Calendar
            },
            {
              id: 'regularization',
              label: `Regularization Requests (${pendingRegularizations})`,
              icon: AlertCircle
            }
          ].map(tab => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={
                  activeTab === tab.id
                }
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`
                  px-3.5 py-1.5 rounded-xl
                  text-xs font-semibold
                  flex items-center gap-2 transition

                  ${activeTab === tab.id
                    ? 'bg-accent text-on-accent font-bold shadow-sm'
                    : 'bg-surface2 text-muted hover:text-ink'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />

                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="
          flex flex-wrap items-center gap-2 text-xs
        ">
          <button
            type="button"
            onClick={handleToday}
            className="
              px-3 py-1.5 rounded-xl bg-surface2
              border border-line text-accent
              font-semibold hover:border-accent
            "
          >
            Today
          </button>

          <span className="text-muted font-medium">
            Date:
          </span>

          <input
            type="date"
            aria-label="Attendance date"
            value={selectedDate}
            max={today}
            onChange={event =>
              handleDateChange(event.target.value)
            }
            className="
              bg-surface2 border border-line
              rounded-xl px-2.5 py-1.5
              text-xs text-ink focus:border-accent
            "
          />
        </div>
      </div>

      {/* ====================================================
          DAILY ATTENDANCE
      ==================================================== */}

      {activeTab === 'daily' && (
        <div className="glass-card !p-4 space-y-3">

          {/* DAILY ATTENDANCE HEADER */}

          <div className="
            flex flex-wrap items-center justify-between
            gap-3 pb-3 border-b border-line/60
          ">
            <div>
              <h3 className="
                font-display font-semibold
                text-sm sm:text-base text-ink
              ">
                Daily Attendance Roster —{' '}
                {formatDate(selectedDate)}
              </h3>

              <span className="text-xs text-muted">
                Showing {filteredMembers.length}{' '}
                of {attendanceMembers.length} team members
              </span>
            </div>

            <div className="
              flex flex-wrap items-center gap-2
            ">
              <div className="relative min-w-[200px]">
                <Search className="
                  w-3.5 h-3.5 absolute left-3
                  top-1/2 -translate-y-1/2 text-muted
                " />

                <input
                  type="search"
                  aria-label="Search attendance"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={event =>
                    setSearchTerm(event.target.value)
                  }
                  className="
                    w-full bg-surface2 border border-line
                    rounded-xl pl-8 pr-3 py-2
                    text-xs text-ink
                    placeholder:text-muted
                    focus:border-accent
                  "
                />
              </div>

              {/* STATUS FILTER */}

              <select
                aria-label="Attendance status"
                value={statusFilter}
                onChange={event =>
                  setStatusFilter(event.target.value)
                }
                className="
                  bg-surface2 border border-line
                  rounded-xl px-3 py-2
                  text-xs text-ink focus:border-accent
                "
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="present">
                  Present
                </option>

                <option value="office">
                  In Office
                </option>

                <option value="remote">
                  Remote (WFH)
                </option>

                <option value="late">
                  Late Arrival
                </option>

                <option value="leave">
                  On Leave
                </option>

                <option value="working">
                  Working
                </option>

                <option value="on-break">
                  On Break
                </option>

                <option value="checked-out">
                  Checked Out
                </option>

                <option value="incomplete">
                  Incomplete Session
                </option>

                <option value="none">
                  Not Punched
                </option>

                <option value="no-record">
                  No Record
                </option>
              </select>

              <button
                type="button"
                onClick={handleDailyExport}
                className="
                  flex items-center gap-1.5 px-3 py-2
                  rounded-xl bg-accent text-on-accent
                  text-xs font-semibold hover:brightness-105
                "
              >
                <Download className="w-3.5 h-3.5" />

                Export CSV
              </button>
            </div>
          </div>

          {/* LIVE SESSION SUMMARY */}

          <div className="
            flex flex-wrap items-center gap-4
            rounded-xl bg-surface2/40
            border border-line/40 px-3 py-2
            text-xs
          ">
            <span className="
              flex items-center gap-1.5 text-good
            ">
              <span className="
                w-2 h-2 rounded-full bg-good
              " />

              {summary.working} Working
            </span>

            <span className="
              flex items-center gap-1.5 text-warn
            ">
              <span className="
                w-2 h-2 rounded-full bg-warn
              " />

              {summary.onBreak} On Break
            </span>

            <span className="
              flex items-center gap-1.5 text-info
            ">
              <span className="
                w-2 h-2 rounded-full bg-info
              " />

              {summary.checkedOut} Checked Out
            </span>
          </div>

          {/* NO RECORDS MESSAGE */}

          {summary.recorded === 0 && (
            <div className="
              flex items-center gap-2 rounded-xl
              bg-surface2 border border-line
              p-3 text-xs text-muted
            ">
              <AlertCircle className="
                w-4 h-4 shrink-0
              " />

              No attendance records have been saved
              for this date.
            </div>
          )}

          {/* ATTENDANCE TABLE */}

          <div className="overflow-x-auto">

            <table className="
              w-full min-w-[1200px]
              text-xs text-ink border-collapse
            ">
              <thead>
                <tr className="
                  border-b border-line/60 text-muted
                  uppercase tracking-wider text-[10.5px]
                ">
                  <th className="px-4 py-4 text-left">
                    Employee
                  </th>

                  <th className="px-4 py-4 text-left">
                    Designation
                  </th>

                  <th className="
                    px-4 py-4 text-center whitespace-nowrap
                  ">
                    Check-In
                  </th>

                  <th className="
                    px-4 py-4 text-center whitespace-nowrap
                  ">
                    Check-Out
                  </th>

                  <th className="
                    px-4 py-4 text-center whitespace-nowrap
                  ">
                    Break Duration
                  </th>

                  <th className="
                    px-4 py-4 text-center whitespace-nowrap
                  ">
                    Working Hours
                  </th>

                  <th className="px-4 py-4 text-center">
                    Status
                  </th>

                  <th className="px-4 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line/40">

                {paginatedMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-muted"
                    >
                      No employees found matching
                      your filters.
                    </td>
                  </tr>
                )}

                {paginatedMembers.map(member => (
                  <tr
                    key={member.employeeId}
                    className="
                      h-[76px] align-middle
                      hover:bg-surface2/40 transition
                    "
                  >

                    {/* EMPLOYEE */}

                    <td className="px-4 py-4">
                      <div className="
                        flex items-center gap-2.5
                      ">
                        <Avatar
                          name={member.name}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <span className="
                            font-semibold text-ink
                            block whitespace-nowrap
                          ">
                            {member.name}
                          </span>

                          <span className="
                            text-[10px] text-muted font-data
                          ">
                            {member.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* DESIGNATION */}

                    <td className="px-4 py-4 text-muted">
                      {member.designation || '—'}
                    </td>

                    {/* CHECK IN */}

                    <td className="
                      px-4 py-4 text-center
                      font-data tabular-nums
                    ">
                      <div className="
                        flex flex-col items-center
                      ">
                        <span className="whitespace-nowrap">
                          {formatTime(
                            member.checkInTime
                          )}
                        </span>

                        <PunchLocation
                          location={
                            member.checkInLocation
                          }
                          onClick={() =>
                            openLocationDetails(member)
                          }
                        />
                      </div>
                    </td>

                    {/* CHECK OUT */}

                    <td className="
                      px-4 py-4 text-center
                      font-data tabular-nums
                    ">
                      <div className="
                        flex flex-col items-center
                      ">
                        <span className="whitespace-nowrap">
                          {formatTime(
                            member.checkOutTime
                          )}
                        </span>

                        {member.checkOutTime &&
                          getLocalDate(
                            member.checkOutTime
                          ) !== member.dateKey && (
                            <span className="
                              text-[10px] text-muted mt-1
                            ">
                              {getLocalDate(
                                member.checkOutTime
                              )}
                            </span>
                          )}

                        <PunchLocation
                          location={
                            member.checkOutLocation
                          }
                          onClick={() =>
                            openLocationDetails(member)
                          }
                        />
                      </div>
                    </td>

                    {/* BREAK DURATION */}

                    <td className="
                      px-4 py-4 text-center
                      font-data whitespace-nowrap
                    ">
                      {member.checkInTime
                        ? formatDuration(
                            member.breakSeconds
                          )
                        : '—'}

                      {member.sessionStatus === 'On Break' && (
                        <span className="
                          block mt-1 text-[10px] text-warn
                        ">
                          Active Break
                        </span>
                      )}
                    </td>

                    {/* WORKING HOURS */}

                    <td className="
                      px-4 py-4 text-center font-data
                      font-semibold whitespace-nowrap
                    ">
                      {member.checkInTime &&
                      member.workingSeconds !== null
                        ? formatDuration(
                            member.workingSeconds
                          )
                        : '—'}

                      {member.checkInTime && (
                        <span className={`
                          block mt-1 text-[10px]
                          ${getSessionColor(
                            member.sessionStatus
                          )}
                        `}>
                          {member.sessionStatus}
                        </span>
                      )}

                      {member.isActiveSession &&
                      member.isOvernight && (
                        <span className="
                          block mt-1 text-[10px] text-muted
                        ">
                          Overnight / Open Session
                        </span>
                      )}
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4 text-center">
                      <StatusBadge
                        status={
                          member.attendanceStatus
                        }
                        customLabel={getStatusLabel(
                          member.attendanceStatus
                        )}
                      />
                    </td>

                    {/* ACTIONS */}

                    <td className="px-4 py-4 text-right">

                      {member.attendanceStatus === 'none' &&
                      selectedDate === today ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleSendReminder(member)
                          }
                          className="
                            whitespace-nowrap px-2.5 py-1
                            rounded-lg bg-bad/20 text-bad
                            hover:bg-bad/30 border
                            border-bad/30 font-semibold
                            text-[11px] transition
                            inline-flex items-center gap-1
                          "
                        >
                          <Bell className="w-3 h-3" />

                          Remind
                        </button>
                      ) : member.checkInTime ? (
                        <button
                          type="button"
                          onClick={() =>
                            openLocationDetails(member)
                          }
                          className="
                            whitespace-nowrap text-[11px]
                            font-semibold text-accent
                            hover:underline
                          "
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-muted">
                          —
                        </span>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredMembers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ====================================================
          MONTHLY CALENDAR
      ==================================================== */}

      {activeTab === 'calendar' && (
        <div className="
          grid grid-cols-1 lg:grid-cols-3 gap-4
        ">

          <div className="
            lg:col-span-2 glass-card !p-4
          ">

            {/* CALENDAR HEADER */}

            <div className="
              flex flex-wrap items-center justify-between
              gap-3 pb-3 border-b border-line/60
            ">
              <div>
                <h3 className="
                  font-display font-semibold
                  text-base text-ink
                ">
                  {monthTitle}
                </h3>

                <span className="text-xs text-muted">
                  Team Attendance Calendar
                </span>
              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    handleMonthChange(-1)
                  }
                  aria-label="Previous month"
                  className="
                    p-2 rounded-lg bg-surface2
                    border border-line hover:border-accent
                  "
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToday}
                  className="
                    px-3 py-2 rounded-lg bg-surface2
                    border border-line text-xs
                    text-accent font-semibold
                  "
                >
                  Today
                </button>

                <button
                  type="button"
                  disabled={isCurrentMonth}
                  onClick={() =>
                    handleMonthChange(1)
                  }
                  aria-label="Next month"
                  className="
                    p-2 rounded-lg bg-surface2
                    border border-line hover:border-accent
                    disabled:opacity-30
                    disabled:cursor-not-allowed
                  "
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* WEEK DAYS */}

            <div className="
              grid grid-cols-7 gap-1.5 text-center
              text-[11px] font-bold text-muted
              uppercase tracking-wider my-3
            ">
              {[
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sun'
              ].map((day, index) => (
                <div
                  key={day}
                  className={
                    index >= 5
                      ? 'text-warn'
                      : ''
                  }
                >
                  {day}
                </div>
              ))}
            </div>

            {/* MONTH DAYS */}

            <div className="grid grid-cols-7 gap-1.5">

              {Array.from({
                length: firstDayOffset
              }).map((_, index) => (
                <div
                  key={`blank-${index}`}
                  className="min-h-[68px]"
                />
              ))}

              {Array.from({
                length: daysInMonth
              }).map((_, index) => {
                const day = index + 1;

                const dateKey = getLocalDate(
                  new Date(
                    calendarYear,
                    calendarMonth,
                    day
                  )
                );

                const isSelected =
                  selectedDate === dateKey;

                const isToday =
                  dateKey === today;

                const isFuture =
                  dateKey > today;

                const dayOfWeek =
                  (firstDayOffset + index) % 7;

                const isWeekend =
                  dayOfWeek >= 5;

                const daySummary =
                  monthlySummaries[dateKey] ||
                  getAttendanceSummary([]);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    disabled={isFuture}
                    onClick={() =>
                      handleDateChange(dateKey)
                    }
                    aria-label={`Attendance for ${dateKey}`}
                    aria-pressed={isSelected}
                    className={`
                      min-h-[78px] p-2 rounded-xl
                      border text-left flex flex-col
                      justify-between transition
                      disabled:opacity-30

                      ${isSelected
                        ? 'bg-surface2 border-accent shadow-md'
                        : isToday
                          ? 'bg-surface2/80 border-accent/60'
                          : isWeekend
                            ? 'bg-surface2/25 border-line/30'
                            : 'bg-surface2/50 border-line/50 hover:border-accent/40'}
                    `}
                  >
                    <div className="
                      flex items-center justify-between
                    ">
                      <span className={`
                        text-xs font-bold

                        ${isToday
                          ? 'text-accent'
                          : 'text-ink'}
                      `}>
                        {day}
                      </span>

                      {isToday && (
                        <span className="
                          text-[8px] text-accent
                        ">
                          Today
                        </span>
                      )}
                    </div>

                    {isFuture ? (
                      <span className="
                        text-[9px] text-muted
                      ">
                        Upcoming
                      </span>
                    ) : daySummary.recorded > 0 ? (
                      <div className="
                        space-y-1 text-[9px]
                      ">
                        {daySummary.present > 0 && (
                          <div className="text-good">
                            {daySummary.present} Present
                          </div>
                        )}

                        {daySummary.remote > 0 && (
                          <div className="text-info">
                            {daySummary.remote} Remote
                          </div>
                        )}

                        {daySummary.late > 0 && (
                          <div className="text-warn">
                            {daySummary.late} Late
                          </div>
                        )}

                        {daySummary.leave > 0 && (
                          <div className="text-accent2">
                            {daySummary.leave} Leave
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="
                        text-[9px] text-muted
                      ">
                        {isWeekend
                          ? 'Weekend · No record'
                          : 'No record'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CALENDAR LEGEND */}

            <div className="
              flex flex-wrap items-center gap-4
              text-xs text-muted pt-3
              border-t border-line/60 mt-3
            ">
              <span className="
                flex items-center gap-1.5
              ">
                <span className="
                  w-2.5 h-2.5 rounded-full bg-good
                " />

                Present
              </span>

              <span className="
                flex items-center gap-1.5
              ">
                <span className="
                  w-2.5 h-2.5 rounded-full bg-info
                " />

                Remote
              </span>

              <span className="
                flex items-center gap-1.5
              ">
                <span className="
                  w-2.5 h-2.5 rounded-full bg-warn
                " />

                Late
              </span>

              <span className="
                flex items-center gap-1.5
              ">
                <span className="
                  w-2.5 h-2.5 rounded-full bg-accent2
                " />

                On Leave
              </span>
            </div>
          </div>

          {/* SELECTED DAY SUMMARY */}

          <div className="
            glass-card !p-4
            flex flex-col justify-between
          ">
            <div>

              <div className="
                pb-3 border-b border-line/60
              ">
                <h3 className="
                  font-display font-semibold
                  text-base text-ink
                ">
                  {parseLocalDate(
                    selectedDate
                  ).toLocaleDateString(
                    'en-GB',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }
                  )}
                </h3>

                <span className="text-xs text-muted">
                  Selected Date Summary
                </span>
              </div>

              <div className="space-y-3 mt-3 text-xs">

                <div className="
                  p-3 rounded-xl bg-surface2/60
                  border border-line/50 space-y-2
                ">
                  <div className="
                    text-muted uppercase
                    text-[10.5px] font-semibold
                  ">
                    Attendance Summary
                  </div>

                  <div className="
                    text-base font-data font-bold text-good
                  ">
                    {summary.present} / {summary.total} Present
                  </div>

                  <div className="
                    text-muted text-[11px]
                  ">
                    {summary.remote} Remote ·{' '}
                    {summary.late} Late ·{' '}
                    {summary.leave} On Leave
                  </div>

                  <div className="
                    text-muted text-[11px]
                  ">
                    {summary.working} Working ·{' '}
                    {summary.onBreak} On Break ·{' '}
                    {summary.checkedOut} Checked Out
                  </div>

                  {summary.recorded === 0 && (
                    <div className="text-warn">
                      No saved records for this date.
                    </div>
                  )}
                </div>

                {/* EMPLOYEE STATUS LOG */}

                <div className="space-y-1.5">
                  <span className="
                    text-muted font-bold text-[10.5px]
                    uppercase tracking-wider block
                  ">
                    Team Status Log
                  </span>

                  <div className="
                    max-h-[320px] overflow-y-auto space-y-2
                  ">
                    {attendanceRows.length === 0 && (
                      <p className="text-muted py-3">
                        No team members available.
                      </p>
                    )}

                    {attendanceRows.map(member => (
                      <div
                        key={member.employeeId}
                        className="
                          p-2 rounded-lg bg-surface2/40
                          border border-line/30
                          flex flex-wrap items-center
                          justify-between gap-2
                        "
                      >
                        <div>
                          <span className="
                            text-ink font-medium
                          ">
                            {member.name}
                          </span>

                          {member.checkInTime && (
                            <span className={`
                              block mt-1 text-[10px]

                              ${getSessionColor(
                                member.sessionStatus
                              )}
                            `}>
                              {member.sessionStatus}
                            </span>
                          )}
                        </div>

                        <StatusBadge
                          status={
                            member.attendanceStatus
                          }
                          customLabel={getStatusLabel(
                            member.attendanceStatus
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CALENDAR ACTIONS */}

            <div className="space-y-2 mt-4">

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');

                  setActiveTab('daily');
                }}
                className="
                  w-full py-2 rounded-xl bg-surface2
                  border border-line hover:border-accent
                  text-xs font-semibold text-ink transition
                "
              >
                View Daily Attendance
              </button>

              <button
                type="button"
                onClick={handleMonthlyExport}
                className="
                  w-full py-2 rounded-xl bg-accent
                  text-on-accent text-xs font-semibold
                  flex items-center justify-center gap-2
                  hover:brightness-105
                "
              >
                <Download className="w-3.5 h-3.5" />

                Export Monthly Timesheet (CSV)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          ATTENDANCE REGULARIZATION
      ==================================================== */}

      {activeTab === 'regularization' && (
        <div className="glass-card !p-4 space-y-3">

          <div className="
            flex flex-wrap items-center justify-between
            gap-3 pb-3 border-b border-line/60
          ">
            <div>
              <h3 className="
                font-display font-semibold
                text-sm sm:text-base text-ink
              ">
                Attendance Regularization Queue
              </h3>

              <span className="text-xs text-muted">
                Review employee punch correction
                requests before payroll processing.
              </span>
            </div>

            <select
              aria-label="Regularization status"
              value={regularizationFilter}
              onChange={event =>
                setRegularizationFilter(
                  event.target.value
                )
              }
              className="
                bg-surface2 border border-line
                rounded-xl px-3 py-2
                text-xs text-ink
              "
            >
              <option value="all">
                All Requests
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </div>

          {filteredRegularizations.length === 0 ? (
            <div className="
              p-10 text-center text-muted
              text-xs space-y-2
            ">
              <CheckCircle className="
                w-8 h-8 mx-auto text-muted
              " />

              <p>
                No regularization requests found.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">

              {filteredRegularizations.map(request => (
                <div
                  key={request.id}
                  className="
                    p-3.5 rounded-2xl bg-surface2/50
                    border border-line/50
                    flex flex-col sm:flex-row
                    items-start sm:items-center
                    justify-between gap-3
                  "
                >

                  <div className="
                    flex items-start gap-3 min-w-0
                  ">
                    <Avatar
                      name={request.employeeName}
                      size="md"
                    />

                    <div>
                      <div className="
                        flex flex-wrap items-center gap-2
                      ">
                        <span className="
                          font-semibold text-ink text-sm
                        ">
                          {request.employeeName}
                        </span>

                        <span className="
                          text-[10px] text-muted font-data
                        ">
                          {request.employeeId}
                        </span>

                        <StatusBadge
                          status={request.status}
                        />
                      </div>

                      <div className="
                        text-xs font-medium text-accent mt-1
                      ">
                        {request.requestType}

                        {' · Date: '}

                        {formatDate(
                          request.fromDate
                        )}
                      </div>

                      <p className="
                        text-xs text-muted mt-1 leading-snug
                      ">
                        "{request.reason}"
                      </p>

                      {Array.isArray(request.comments) &&
                      request.comments.length > 0 && (
                        <div className="
                          mt-2 text-[11px]
                          text-muted space-y-1
                        ">
                          {request.comments.map(
                            (comment, index) => (
                              <p
                                key={`${request.id}-${index}`}
                              >
                                {typeof comment === 'string'
                                  ? comment
                                  : comment?.text ||
                                    comment?.comment ||
                                    'Decision recorded'}
                              </p>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="
                      flex items-center gap-2 shrink-0
                      self-end sm:self-center
                    ">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          openRegularizationDecision(
                            request,
                            'rejected'
                          )
                        }
                        className="
                          px-3 py-1.5 rounded-xl
                          bg-bad/15 border border-bad/30
                          text-bad hover:bg-bad/25
                          text-xs font-bold
                          disabled:opacity-50
                        "
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          openRegularizationDecision(
                            request,
                            'approved'
                          )
                        }
                        className="
                          px-3 py-1.5 rounded-xl
                          bg-accent text-on-accent
                          hover:brightness-105
                          text-xs font-bold shadow-sm
                          disabled:opacity-50
                        "
                      >
                        Approve Regularization
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPROVAL MODAL */}

      <ApprovalCommentModal
        isOpen={Boolean(directDecision)}
        approval={directDecision?.approval}
        action={directDecision?.action}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!decisionLock.current) {
            setDirectDecision(null);
          }
        }}
        onConfirm={
          handleRegularizationDecision
        }
      />

    </div>
  );
};

export default Attendance;