import React, { useMemo, useState, useEffect } from 'react';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';

import {
  BarChart3,
  Users,
  Clock,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  ClipboardList,
  BriefcaseBusiness
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================

const safeArray = value =>
  Array.isArray(value) ? value : [];

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const sameId = (left, right) =>
  Boolean(
    normalize(left) &&
    normalize(left) === normalize(right)
  );

const getEmployeeId = member =>
  String(
    member?.employeeId ??
    member?.id ??
    member?.userId ??
    ''
  );

const getMemberName = member =>
  member?.name ||
  member?.employeeName ||
  'Employee';

const belongsToEmployee = (id, member) =>
  [
    member.employeeId,
    member.id,
    member.userId
  ].some(value => sameId(value, id));

const numericValue = value => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number(
    String(value).replace(/[h%,]/g, '').trim()
  );

  return Number.isFinite(number) &&
    number >= 0
    ? number
    : null;
};

const displayValue = value =>
  value === null ||
  value === undefined ||
  value === ''
    ? 'N/A'
    : value;

const localDateKey = date => {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const validDateKey = value => {
  const key = String(value ?? '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return null;
  }

  const date = new Date(`${key}T00:00:00`);

  return Number.isFinite(date.getTime()) &&
    localDateKey(date) === key
    ? key
    : null;
};

const getToday = () => localDateKey(new Date());

// HRMS_REPORTS_UI_V4

const currentMonthStart = () => {
  const now = new Date();

  return localDateKey(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
};

// ACTUAL_TEAM_REPORTS_V1

const ATTENDANCE_PREFIX =
  'technomold_teamlead_';

const ATTENDANCE_EVENT =
  'technomold:teamlead:attendance-punch';

const APPROVAL_EVENT =
  'technomold:teamlead:approval-updated';

const LATE_HOUR = 9;
const LATE_MINUTE = 30;

const getDepartment = member =>
  member.department ||
  member.dept ||
  member.departmentName ||
  'Not assigned';

const getRangeLength = (from, to) => {

  if (!validDateKey(from) || !validDateKey(to)) {
    return 0;
  }

  return Math.floor(
    (
      Date.parse(`${to}T00:00:00Z`) -
      Date.parse(`${from}T00:00:00Z`)
    ) / 86400000
  ) + 1;
};

const getAttendanceDates = (from, to) => {

  const count = getRangeLength(from, to);

  if (
    count < 1 ||
    count > 366 ||
    to > getToday()
  ) {
    return [];
  }

  const cursor = new Date(`${from}T12:00:00`);

  const dates = [];

  while (localDateKey(cursor) <= to) {

    dates.push(localDateKey(cursor));

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const isWeekday = dateKey => {

  const day = new Date(
    `${dateKey}T12:00:00`
  ).getDay();

  return day !== 0 && day !== 6;
};

const reportReadStorage = (key, fallback) => {

  try {

    const raw = window.localStorage.getItem(key);

    return {
      value: raw === null
        ? fallback
        : JSON.parse(raw),
      invalid: false
    };

  } catch {

    return {
      value: fallback,
      invalid: true
    };
  }

};

const reportObject = value =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value);

const reportTimestamp = value => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) && time > 0
    ? time
    : null;
};

const reportRecordDate = record => {

  if (!reportObject(record)) {
    return null;
  }

  const start = reportTimestamp(
    record.checkInTime ??
    record.checkIn
  );

  return validDateKey(record.dateKey) ||
    (
      start
        ? localDateKey(new Date(start))
        : null
    );
};

const reportEmployeeIds = member =>
  [...new Set([
    member.employeeId,
    member.id,
    member.userId
  ].filter(value =>
    value != null &&
    String(value).trim()
  ).map(String))];

const hasRecordedPunch = record =>

  reportObject(record) &&

  [
    record.checkInTime,
    record.checkIn,
    record.checkOutTime,
    record.checkOut
  ].some(value =>
    value != null && value !== ''
  );

const readReportAttendanceSources = () => {

  const roster = reportReadStorage(
    `${ATTENDANCE_PREFIX}attendance_roster_punches`,
    {}
  );

  const sessions = reportReadStorage(
    `${ATTENDANCE_PREFIX}attendance_sessions`,
    {}
  );

  return {

    roster:
      reportObject(roster.value)
        ? roster.value
        : {},

    sessions:
      reportObject(sessions.value)
        ? sessions.value
        : {},

    invalid:
      roster.invalid ||
      sessions.invalid ||
      !reportObject(roster.value) ||
      !reportObject(sessions.value)
  };

};

const getMemberAttendanceSources = member => {

  const ids = reportEmployeeIds(member);

  const histories = ids.map(id => {

    const result = reportReadStorage(
      `${ATTENDANCE_PREFIX}personal_attendance_${id}`,
      []
    );

    return {

      id,

      records:
        safeArray(result.value),

      invalid:
        result.invalid ||
        !Array.isArray(result.value)
    };

  });

  return {
    ids,
    histories
  };
};

const punchSignature = record =>
  JSON.stringify([

    reportTimestamp(
      record.checkInTime ??
      record.checkIn
    ),

    reportTimestamp(
      record.checkOutTime ??
      record.checkOut
    ),

    record.accumulatedBreakMilliseconds ??
      (
        record.accumulatedBreakSeconds != null
          ? Number(record.accumulatedBreakSeconds) * 1000
          : record.breakSeconds != null
            ? Number(record.breakSeconds) * 1000
            : null
      )

  ]);

const chooseReportRecord = candidates => {

  const records = candidates.filter(
    hasRecordedPunch
  );

  if (!records.length) {
    return {
      record: null,
      invalid: false
    };
  }

  if (
    new Set(
      records.map(punchSignature)
    ).size > 1
  ) {
    return {
      record: null,
      invalid: true
    };
  }

  return {
    record: records[0],
    invalid: false
  };
};

const findReportAttendance = (
  dateKey,
  memberSources,
  sharedSources
) => {

  const {
    ids,
    histories
  } = memberSources;

  if (!ids.length) {
    return {
      record: null,
      invalid: true
    };
  }

  // Daily records are authoritative.

  const dailyRecords = ids.map(id =>
    reportReadStorage(
      `${ATTENDANCE_PREFIX}attendance_${id}_${dateKey}`,
      null
    )
  );

  if (
    dailyRecords.some(item =>
      item.invalid ||
      (
        item.value !== null &&
        !reportObject(item.value)
      )
    )
  ) {
    return {
      record: null,
      invalid: true
    };
  }

  const daily = chooseReportRecord(
    dailyRecords.map(item => item.value)
  );

  if (daily.record || daily.invalid) {
    return daily;
  }

  // Fall back to saved personal attendance history.

  if (histories.some(item => item.invalid)) {
    return {
      record: null,
      invalid: true
    };
  }

  const historyRecords = histories.flatMap(
    item => item.records.filter(record =>
      reportRecordDate(record) === dateKey
    )
  );

  const history =
    chooseReportRecord(historyRecords);

  if (history.record || history.invalid) {
    return history;
  }

  // Legacy records are used only for the matching date.

  if (sharedSources.invalid) {
    return {
      record: null,
      invalid: true
    };
  }

  const legacyRecords = ids.flatMap(id => [

    sharedSources.roster[id],

    sharedSources.sessions[id]

  ]).filter(record =>
    reportRecordDate(record) === dateKey
  );

  return chooseReportRecord(
    legacyRecords
  );

};

const readReportBreakSeconds = record => {

  let seconds = null;

  const milliseconds =
    record.accumulatedBreakMilliseconds;

  const rawSeconds =
    record.accumulatedBreakSeconds ??
    record.breakSeconds;

  if (
    milliseconds != null &&
    String(milliseconds).trim() !== ''
  ) {

    seconds = Number(milliseconds) / 1000;

  } else if (
    rawSeconds != null &&
    String(rawSeconds).trim() !== ''
  ) {

    seconds = Number(rawSeconds);

  } else if (Array.isArray(record.breaks)) {

    seconds = 0;

    for (const item of record.breaks) {

      const start =
        reportTimestamp(item?.start);

      const end =
        reportTimestamp(item?.end);

      if (!start || !end || end < start) {
        return null;
      }

      seconds += (end - start) / 1000;

    }

  }

  return seconds !== null &&
    Number.isFinite(seconds) &&
    seconds >= 0
      ? seconds
      : null;
};

const getApprovedLeaveDates = (
  member,
  approvals,
  dates
) => {

  const requests = safeArray(approvals)
    .filter(request => {

      if (
        request.category !== 'Leave Approval' ||
        !belongsToEmployee(
          request.employeeId,
          member
        ) ||
        normalize(request.status) !== 'approved'
      ) {
        return false;
      }

      const teamLeadStatus =
        request.teamLeadApproval ??
        request.managerApprovalStatus;

      const hrStatus =
        request.hrApproval ??
        request.hrApprovalStatus;

      if (
        teamLeadStatus != null ||
        hrStatus != null
      ) {

        return (
          normalize(teamLeadStatus) === 'approved' &&
          normalize(hrStatus) === 'approved'
        );

      }

      return true;

    });

  return new Set(

    dates.filter(date =>
      requests.some(request => {

        const start =
          validDateKey(request.fromDate);

        const end =
          validDateKey(request.toDate);

        return Boolean(
          start &&
          end &&
          start <= date &&
          date <= end
        );

      })
    )

  );

};

const buildActualAttendance = (
  member,
  dates,
  approvals,
  sharedSources
) => {

  const memberSources =
    getMemberAttendanceSources(member);

  const leaveDates =
    getApprovedLeaveDates(
      member,
      approvals,
      dates
    );

  let presentDays = 0;
  let completedDays = 0;
  let lateDays = 0;
  let leaveDays = 0;
  let noRecordDays = 0;
  let incompleteDays = 0;
  let invalidDays = 0;
  let unknownHourDays = 0;
  let regularizedDays = 0;

  let workingSeconds = 0;
  let breakSeconds = 0;
  let verifiedDays = 0;

  for (const dateKey of dates) {

    const result = findReportAttendance(
      dateKey,
      memberSources,
      sharedSources
    );

    if (result.invalid) {

      invalidDays += 1;

      continue;

    }

    const record = result.record;

    if (!record) {

      if (isWeekday(dateKey)) {

        if (leaveDates.has(dateKey)) {

          leaveDays += 1;

        } else {

          noRecordDays += 1;

        }

      }

      continue;
    }

    const start = reportTimestamp(
      record.checkInTime ??
      record.checkIn
    );

    const end = reportTimestamp(
      record.checkOutTime ??
      record.checkOut
    );

    const rawOut =
      record.checkOutTime ??
      record.checkOut;

    if (
      !start ||
      start > Date.now() ||
      localDateKey(new Date(start)) !== dateKey ||
      (
        rawOut != null &&
        rawOut !== '' &&
        !end
      )
    ) {

      invalidDays += 1;

      continue;

    }

    presentDays += 1;

    const checkInDate = new Date(start);

    const checkInMinutes =
      checkInDate.getHours() * 60 +
      checkInDate.getMinutes();

    if (
      checkInMinutes >
      LATE_HOUR * 60 + LATE_MINUTE
    ) {

      lateDays += 1;

    }

    const hasCorrection =

      safeArray(record.correctionHistory)
        .some(item =>
          item?.status === 'applied'
        ) ||

      safeArray(approvals)
        .some(request =>

          request.category ===
            'Attendance Regularization' &&

          belongsToEmployee(
            request.employeeId,
            member
          ) &&

          normalize(request.status) ===
            'approved' &&

          request.attendanceCorrection?.status ===
            'applied' &&

          request.attendanceCorrection?.dateKey ===
            dateKey

        );

    if (hasCorrection) {
      regularizedDays += 1;
    }

    if (!end) {

      incompleteDays += 1;

      continue;

    }

    if (
      end <= start ||
      end > Date.now() ||
      end - start > 86400000 ||
      record.breakStartTime ||
      record.activeBreak
    ) {

      invalidDays += 1;

      continue;

    }

    completedDays += 1;

    const recordedBreak =
      readReportBreakSeconds(record);

    const elapsed =
      (end - start) / 1000;

    if (
      recordedBreak === null ||
      recordedBreak > elapsed
    ) {

      unknownHourDays += 1;

      continue;

    }

    verifiedDays += 1;

    workingSeconds += elapsed - recordedBreak;

    breakSeconds += recordedBreak;

  }

  const workingHoursValue =
    verifiedDays
      ? Math.round(workingSeconds / 36) / 100
      : null;

  const breakHoursValue =
    verifiedDays
      ? Math.round(breakSeconds / 36) / 100
      : null;

  return {

    employeeId: getEmployeeId(member),

    employeeName: getMemberName(member),

    department: getDepartment(member),

    presentDays,
    completedDays,
    lateDays,
    leaveDays,
    noRecordDays,
    incompleteDays,
    invalidDays,
    unknownHourDays,
    regularizedDays,
    verifiedDays,

    totalHours:
      workingHoursValue === null
        ? 'N/A'
        : `${workingHoursValue.toFixed(2)} h`,

    breakHours:
      breakHoursValue === null
        ? 'N/A'
        : `${breakHoursValue.toFixed(2)} h`,

    workingHoursValue,

    breakHoursValue,

    dataSource: 'Saved browser attendance records'

  };

};

// ============================================================
// APPROVED TIMESHEET REPORT
// ============================================================

const buildApprovedTimesheetReport = (
  member,
  approvals,
  from,
  to
) => {

  const records = safeArray(approvals)
    .filter(request => {

      if (
        request.category !== 'Timesheet Approval' ||
        normalize(request.status) !== 'approved' ||
        !belongsToEmployee(
          request.employeeId,
          member
        )
      ) {
        return false;
      }

      const start = validDateKey(
        request.weekStart ||
        request.fromDate
      );

      const end = validDateKey(
        request.weekEnd ||
        request.toDate
      );

      if (!start || !end || start > end) {
        return false;
      }

      return (
        (!from || end >= from) &&
        (!to || start <= to)
      );

    });

  const uniqueRecords = Array.from(
    new Map(
      records.map(item => [
        String(item.id),
        item
      ])
    ).values()
  );

  let approvedHours = 0;

  let unavailableBreakdowns = 0;

  let countedEntries = 0;

  const workingDates = new Set();

  const projects = new Set();

  for (const request of uniqueRecords) {

    const start = validDateKey(
      request.weekStart ||
      request.fromDate
    );

    const end = validDateKey(
      request.weekEnd ||
      request.toDate
    );

    const entries = safeArray(
      request.timesheetEntries ??
      request.entries
    );

    const validEntries = entries.filter(
      entry => {

        const date = validDateKey(
          entry?.date ||
          entry?.workDate
        );

        const hours = numericValue(
          entry?.hours ??
          entry?.totalHours ??
          entry?.workingHours
        );

        return Boolean(
          date &&
          start <= date &&
          date <= end &&
          hours !== null &&
          hours > 0 &&
          hours <= 24
        );
      }
    );

    const declaredHours = numericValue(
      request.submittedHours ??
      request.totalHours
    );

    const entryHours = validEntries.reduce(
      (total, entry) =>
        total + numericValue(
          entry.hours ??
          entry.totalHours ??
          entry.workingHours
        ),
      0
    );

    if (
      !entries.length ||
      validEntries.length !== entries.length ||
      (
        declaredHours !== null &&
        Math.abs(declaredHours - entryHours) > 0.01
      )
    ) {

      unavailableBreakdowns += 1;

      continue;

    }

    for (const entry of validEntries) {

      const date = validDateKey(
        entry.date ||
        entry.workDate
      );

      if (
        (from && date < from) ||
        (to && date > to)
      ) {
        continue;
      }

      const hours = numericValue(
        entry.hours ??
        entry.totalHours ??
        entry.workingHours
      );

      approvedHours += hours;

      countedEntries += 1;

      workingDates.add(date);

      const project =
        entry.projectId ||
        entry.projectName;

      if (project) {
        projects.add(String(project));
      }

    }

  }

  const hoursValue =
    countedEntries > 0
      ? Math.round(approvedHours * 100) / 100
      : uniqueRecords.length
        ? null
        : 0;

  return {

    employeeId: getEmployeeId(member),

    employeeName: getMemberName(member),

    department: getDepartment(member),

    approvedTimesheets:
      uniqueRecords.length,

    approvedHours:
      hoursValue === null
        ? 'N/A'
        : `${hoursValue.toFixed(2)} h`,

    approvedHoursValue:
      hoursValue,

    workingDays:
      workingDates.size,

    projectCount:
      projects.size,

    unavailableBreakdowns,

    periodFrom:
      from || 'All dates',

    periodTo:
      to || 'All dates',

    dataSource:
      'Approved timesheet daily entries'

  };

};
const isCompleted = task =>
  ['completed', 'done'].includes(
    normalize(task.status)
  );

const isOverdue = task => {
  const due = validDateKey(task.dueDate);

  return Boolean(
    due &&
    due < getToday() &&
    !isCompleted(task) &&
    normalize(task.status) !== 'cancelled'
  );
};

const getAssigneeId = task => {
  const assignee = task.assignedTo;

  if (
    assignee &&
    typeof assignee === 'object'
  ) {
    return (
      assignee.employeeId ??
      assignee.id ??
      assignee.userId ??
      ''
    );
  }

  return (
    task.assigneeId ??
    task.assignedToId ??
    task.employeeId ??
    assignee ??
    ''
  );
};

const taskMatchesMember = (task, member) =>
  belongsToEmployee(
    getAssigneeId(task),
    member
  );

const sumKnown = values => {
  const known = values.filter(
    value => Number.isFinite(value)
  );

  return known.length
    ? known.reduce((sum, value) => sum + value, 0)
    : null;
};

const averageKnown = values => {
  const known = values.filter(
    value => Number.isFinite(value)
  );

  return known.length
    ? Math.round(
        known.reduce((sum, value) => sum + value, 0) /
        known.length * 10
      ) / 10
    : null;
};

const percentage = (value, total) =>
  total > 0
    ? Math.round((value / total) * 100)
    : null;

// ============================================================
// REPORT CONFIGURATION
// ============================================================

const REPORT_TYPES = [
  {
    id: 'attendance',
    title: 'Attendance Reports',
    icon: Clock,
    description:
      'Saved employee attendance and working hours.'
  },
  {
    id: 'timesheet',
    title: 'Timesheet Reports',
    icon: ClipboardList,
    description:
      'Approved timesheets and submitted work hours.'
  },
  {
    id: 'leave',
    title: 'Leave Reports',
    icon: CalendarDays,
    description:
      'Employee leave requests and approval status.'
  },
  {
    id: 'tasks',
    title: 'Task Completion',
    icon: ClipboardList,
    description:
      'Task completion, pending work and overdue tasks.'
  },
  {
    id: 'workload',
    title: 'Workload Reports',
    icon: BriefcaseBusiness,
    description:
      'Employee-wise workload and task distribution.'
  }
];


const COLUMNS = {
  attendance: [
    ['employeeId', 'Employee ID'],
    ['employeeName', 'Employee'],
    ['department', 'Department'],
    ['presentDays', 'Present Days'],
    ['completedDays', 'Completed Days'],
    ['lateDays', 'Late Days'],
    ['leaveDays', 'On Leave'],
    ['noRecordDays', 'No Record'],
    ['incompleteDays', 'Incomplete'],
    ['regularizedDays', 'Regularized'],
    ['totalHours', 'Working Hours'],
    ['breakHours', 'Break Hours'],
    ['unknownHourDays', 'Hours Unavailable'],
    ['invalidDays', 'Record Issues']
  ],

  timesheet: [
    ['employeeId', 'Employee ID'],
    ['employeeName', 'Employee'],
    ['department', 'Department'],
    ['approvedTimesheets', 'Approved Timesheets'],
    ['workingDays', 'Working Days'],
    ['projectCount', 'Projects'],
    ['approvedHours', 'Approved Hours'],
    ['unavailableBreakdowns', 'Missing Breakdown']
  ],
leave: [
    ['employeeId', 'Employee ID'],
    ['employeeName', 'Employee'],
    ['totalRequests', 'Total Requests'],
    ['approved', 'Approved'],
    ['pending', 'Pending'],
    ['rejected', 'Rejected'],
    ['approvedDays', 'Approved Days']
  ],

  tasks: [
    ['employeeId', 'Employee ID'],
    ['employeeName', 'Employee'],
    ['assigned', 'Assigned Tasks'],
    ['completed', 'Completed'],
    ['pending', 'Open Tasks'],
    ['overdue', 'Overdue'],
    ['completionRate', 'Completion Rate']
  ],

  workload: [
    ['employeeId', 'Employee ID'],
    ['employeeName', 'Employee'],
    ['department', 'Department'],
    ['assigned', 'Assigned Tasks'],
    ['active', 'Active Tasks'],
    ['highPriority', 'High Priority'],
    ['overdue', 'Overdue'],
    ['workloadStatus', 'Workload']
  ]
};

// ============================================================
// CSV EXPORT
// ============================================================

const escapeCsv = value => {
  let text = String(
    displayValue(value)
  );

  // Protect CSV cells from spreadsheet formula injection.

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = (
  rows,
  columns,
  reportType
) => {
  if (!rows.length) return;

  const headers = columns
    .map(([, title]) =>
      escapeCsv(title)
    )
    .join(',');

  const body = rows.map(row =>
    columns
      .map(([key]) =>
        escapeCsv(row[key])
      )
      .join(',')
  );

  const csv = [
    headers,
    ...body
  ].join('\r\n');

  const blob = new Blob(
    ['\uFEFF', csv],
    {
      type: 'text/csv;charset=utf-8;'
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    `team-${reportType}-report-${getToday()}.csv`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
};

// ============================================================
// KPI CARD
// ============================================================

const ReportCard = ({
  title,
  value,
  icon: Icon,
  color = 'text-accent',
  description
}) => (
  <div className="
    rounded-2xl bg-surface
    border border-line p-5
  ">

    <div className="
      flex items-center justify-between gap-3
    ">

      <div className="
        w-11 h-11 rounded-xl
        bg-surface2 border border-line
        flex items-center justify-center
      ">

        <Icon className={`w-5 h-5 ${color}`} />

      </div>

      

    </div>

    <p className="
      mt-4 text-sm text-muted
    ">
      {title}
    </p>

    <p className="
      mt-1 text-2xl font-bold text-ink
    ">
      {displayValue(value)}
    </p>

    {description && (
      <p className="
        mt-2 text-xs text-muted
      ">
        {description}
      </p>
    )}

  </div>
);

// ============================================================
// REPORT PAGE
// ============================================================

export const TeamReports = () => {

  const {
    teamMembers,
    approvals,
    tasks,
    isLoading,
    loadError
  } = useTeamLead();

  const [reportType, setReportType] =
    useState('attendance');

  const [employee, setEmployee] =
    useState('all');

  const [search, setSearch] =
    useState('');

  const [fromDate, setFromDate] =
    useState('');

  const [toDate, setToDate] =
    useState('');

  const [attendanceFromDate, setAttendanceFromDate] =
    useState(currentMonthStart);

  const [attendanceToDate, setAttendanceToDate] =
    useState(getToday);

  const [page, setPage] = useState(1);

  const [department, setDepartment] =
    useState('all');

  const [attendanceRevision, setAttendanceRevision] =
    useState(0);

  useEffect(() => {

    const refresh = () =>
      setAttendanceRevision(value => value + 1);

    const handleStorage = event => {

      const key = String(event.key || '');

      if (
        event.key === null ||
        key.startsWith(
          'technomold_teamlead_attendance_'
        ) ||
        key.startsWith(
          'technomold_teamlead_personal_attendance_'
        ) ||
        key === 'technomold_teamlead_approvals'
      ) {
        refresh();
      }

    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    window.addEventListener(
      'focus',
      refresh
    );

    window.addEventListener(
      ATTENDANCE_EVENT,
      refresh
    );

    window.addEventListener(
      APPROVAL_EVENT,
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
        ATTENDANCE_EVENT,
        refresh
      );

      window.removeEventListener(
        APPROVAL_EVENT,
        refresh
      );

    };

  }, []);

  const PAGE_SIZE = 10;

  const members = useMemo(
    () => safeArray(teamMembers),
    [teamMembers]
  );

  const isAttendanceReport =
    reportType === 'attendance';

  const activeFromDate = isAttendanceReport
    ? attendanceFromDate
    : fromDate;

  const activeToDate = isAttendanceReport
    ? attendanceToDate
    : toDate;

  const invalidDateRange = Boolean(
    activeFromDate &&
    activeToDate &&
    activeFromDate > activeToDate
  );

  const attendanceRangeLength = getRangeLength(
    attendanceFromDate,
    attendanceToDate
  );

  const invalidAttendanceRange =
    !validDateKey(attendanceFromDate) ||
    !validDateKey(attendanceToDate) ||
    attendanceRangeLength < 1 ||
    attendanceRangeLength > 366 ||
    attendanceToDate > getToday();

  const attendanceDays = useMemo(
    () => getAttendanceDates(
      attendanceFromDate,
      attendanceToDate
    ),
    [attendanceFromDate, attendanceToDate]
  );

  const reportHasError =
    invalidDateRange ||
    (isAttendanceReport && invalidAttendanceRange);

  // ==========================================================
  // EMPLOYEE FILTER
  // ==========================================================

  const filteredMembers = useMemo(() => {

    const term = normalize(search);

    return members.filter(member => {

      const matchesEmployee =
        employee === 'all' ||
        belongsToEmployee(employee, member);

      const haystack = normalize(
        [
          getEmployeeId(member),
          getMemberName(member),
          member.department,
          member.dept,
          member.departmentName,
          member.designation,
          member.role
        ].filter(Boolean).join(' ')
      );

      return (
        matchesEmployee &&
        (department === 'all' || getDepartment(member) === department) &&
        (!term || haystack.includes(term))
      );
    });

  }, [members, employee, search, department]);

  // ==========================================================
  // DATE FILTER
  // ==========================================================

  const matchesDate = (start, end) => {

    if (!fromDate && !toDate) {
      return true;
    }

    const first = validDateKey(start);

    const last =
      validDateKey(end) || first;

    if (!first || !last) {
      return false;
    }

    if (fromDate && last < fromDate) {
      return false;
    }

    if (toDate && first > toDate) {
      return false;
    }

    return true;
  };

  // ==========================================================
  // ATTENDANCE REPORT
  // Saved attendance summaries from browser records.
  // ==========================================================

  const attendanceRows = useMemo(() => {

    if (invalidAttendanceRange) {
      return [];
    }

    const sharedSources =
      readReportAttendanceSources();

    return filteredMembers.map(member => ({

      ...buildActualAttendance(
        member,
        attendanceDays,
        approvals,
        sharedSources
      ),

      periodFrom: attendanceFromDate,

      periodTo: attendanceToDate

    }));

  }, [
    filteredMembers,
    attendanceDays,
    approvals,
    attendanceRevision,
    invalidAttendanceRange,
    attendanceFromDate,
    attendanceToDate
  ]);

  const timesheetRows = useMemo(() => {

    if (fromDate && toDate && fromDate > toDate) {
      return [];
    }

    return filteredMembers.map(member =>
      buildApprovedTimesheetReport(
        member,
        approvals,
        fromDate,
        toDate
      )
    );

  }, [
    filteredMembers,
    approvals,
    fromDate,
    toDate
  ]);
// ==========================================================
  // LEAVE REPORT
  // ==========================================================

  const leaveRows = filteredMembers.map(member => {

    const records = safeArray(approvals)
      .filter(request =>
        request.category === 'Leave Approval' &&

        belongsToEmployee(
          request.employeeId,
          member
        ) &&

        matchesDate(
          request.fromDate,
          request.toDate
        )
      );

    const approved = records.filter(
      request =>
        normalize(request.status) === 'approved'
    );

    const pending = records.filter(
      request =>
        normalize(request.status) === 'pending'
    );

    const rejected = records.filter(
      request =>
        normalize(request.status) === 'rejected'
    );

    const dayValues = approved.map(request =>
      numericValue(request.totalDays)
    );

    const approvedDays =
      dayValues.some(value => value === null)
        ? null
        : dayValues.reduce(
            (sum, value) => sum + value,
            0
          );

    return {
      employeeId: getEmployeeId(member),
      employeeName: getMemberName(member),

      totalRequests: records.length,

      approved: approved.length,

      pending: pending.length,

      rejected: rejected.length,

      approvedDays
    };
  });

  // ==========================================================
  // TASK COMPLETION REPORT
  // ==========================================================

  const taskRows = filteredMembers.map(member => {

    const records = safeArray(tasks)
      .filter(task =>

        taskMatchesMember(task, member) &&

        normalize(task.status) !== 'cancelled' &&

        matchesDate(
          task.startDate || task.dueDate,
          task.dueDate || task.startDate
        )
      );

    const completed =
      records.filter(isCompleted).length;

    const assigned = records.length;

    const pending =
      assigned - completed;

    const overdue =
      records.filter(isOverdue).length;

    const rate =
      percentage(completed, assigned);

    return {
      employeeId: getEmployeeId(member),

      employeeName: getMemberName(member),

      assigned,

      completed,

      pending,

      overdue,

      completionRate:
        rate === null
          ? 'N/A'
          : `${rate}%`,

      completionRateValue: rate
    };
  });

  // ==========================================================
  // WORKLOAD REPORT
  // Workload is measured by open task count, not actual capacity.
  // ==========================================================

  const workloadRows = filteredMembers.map(member => {

    const records = safeArray(tasks)
      .filter(task =>

        taskMatchesMember(task, member) &&

        normalize(task.status) !== 'cancelled' &&

        matchesDate(
          task.startDate || task.dueDate,
          task.dueDate || task.startDate
        )
      );

    const activeTasks = records.filter(
      task => !isCompleted(task)
    );

    const active = activeTasks.length;

    const highPriority = activeTasks.filter(
      task =>
        ['high', 'critical', 'urgent'].includes(
          normalize(task.priority)
        )
    ).length;

    const overdue =
      activeTasks.filter(isOverdue).length;

    let workloadStatus = 'No Open Tasks';

    if (active >= 6) {
      workloadStatus = 'High';
    } else if (active >= 3) {
      workloadStatus = 'Moderate';
    } else if (active > 0) {
      workloadStatus = 'Low';
    }

    return {
      employeeId: getEmployeeId(member),

      employeeName: getMemberName(member),

      department: getDepartment(member),

      assigned: records.length,

      active,

      highPriority,

      overdue,

      workloadStatus
    };
  });

  // ==========================================================
  // ACTIVE REPORT DATA
  // ==========================================================

  const rowsByType = {
    attendance: attendanceRows,
    timesheet: timesheetRows,
    leave: leaveRows,
    tasks: taskRows,
    workload: workloadRows
  };

  const rows = reportHasError
    ? []
    : rowsByType[reportType];

  const columns =
    COLUMNS[reportType];

  const departmentRows = useMemo(() => {

    if (
      reportType !== 'attendance' &&
      reportType !== 'timesheet'
    ) {
      return [];
    }

    const grouped = new Map();

    rows.forEach(row => {

      const name =
        row.department || 'Not assigned';

      const current = grouped.get(name) || {

        department: name,

        employees: 0,

        count: 0,

        hours: [],

        issues: 0

      };

      current.employees += 1;

      current.count += reportType === 'attendance'
        ? Number(row.presentDays) || 0
        : Number(row.approvedTimesheets) || 0;

      current.hours.push(

        reportType === 'attendance'
          ? row.workingHoursValue
          : row.approvedHoursValue

      );

      current.issues += reportType === 'attendance'

        ? (row.invalidDays || 0) +
          (row.unknownHourDays || 0)

        : row.unavailableBreakdowns || 0;

      grouped.set(name, current);

    });

    return [...grouped.values()].map(item => ({

      ...item,

      totalHours: sumKnown(item.hours)

    })).sort((first, second) =>
      first.department.localeCompare(
        second.department
      )
    );

  }, [rows, reportType]);

  const activeReport =
    REPORT_TYPES.find(
      item => item.id === reportType
    );

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ==========================================================
  // REPORT SUMMARY
  // ==========================================================

  const sum = key =>
    rows.reduce(
      (total, row) =>
        total + (Number(row[key]) || 0),
      0
    );

  

  const workingHours = sumKnown(
    rows.map(row => row.workingHoursValue)
  );

  const taskCompletion =
    percentage(
      sum('completed'),
      sum('assigned')
    );

  const summaryByType = {

    attendance: [
      {
        title: 'Total Employees',
        value: rows.length,
        icon: Users
      },
      {
        title: 'Recorded Present Days',
        value: sum('presentDays'),
        icon: CheckCircle,
        color: 'text-good'
      },
      {
        title: 'Late Arrivals',
        value: sum('lateDays'),
        icon: AlertCircle,
        color: 'text-warn'
      },
      {
        title: 'Recorded Working Hours',
        value:
          workingHours === null
            ? 'N/A'
            : `${workingHours.toFixed(2)} h`,
        icon: Clock,
        description: 'Completed sessions with known breaks'
      }
    ],

    timesheet: [
      {
        title: 'Approved Timesheets',
        value: sum('approvedTimesheets'),
        icon: CheckCircle,
        color: 'text-good'
      },
      {
        title: 'Approved Work Hours',
        value:
          sumKnown(
            rows.map(row => row.approvedHoursValue)
          ) === null
            ? 'N/A'
            : `${sumKnown(
                rows.map(row => row.approvedHoursValue)
              ).toFixed(2)} h`,
        icon: Clock
      },
      {
        title: 'Reported Working Days',
        value: sum('workingDays'),
        icon: CalendarDays
      },
      {
        title: 'Missing Daily Breakdown',
        value: sum('unavailableBreakdowns'),
        icon: AlertCircle,
        color: 'text-warn'
      }
    ],
leave: [

      {
        title: 'Total Leave Requests',
        value: sum('totalRequests'),
        icon: CalendarDays
      },

      {
        title: 'Approved',
        value: sum('approved'),
        icon: CheckCircle,
        color: 'text-good'
      },

      {
        title: 'Pending',
        value: sum('pending'),
        icon: Clock,
        color: 'text-warn'
      },

      {
        title: 'Rejected',
        value: sum('rejected'),
        icon: AlertCircle,
        color: 'text-bad'
      }

    ],

    tasks: [

      {
        title: 'Assigned Tasks',
        value: sum('assigned'),
        icon: ClipboardList
      },

      {
        title: 'Completed Tasks',
        value: sum('completed'),
        icon: CheckCircle,
        color: 'text-good'
      },

      {
        title: 'Completion Rate',
        value:
          taskCompletion === null
            ? 'N/A'
            : `${taskCompletion}%`,
        icon: BarChart3
      },

      {
        title: 'Overdue Tasks',
        value: sum('overdue'),
        icon: AlertCircle,
        color: 'text-bad'
      }

    ],

    workload: [

      {
        title: 'Team Members',
        value: rows.length,
        icon: Users
      },

      {
        title: 'Open Tasks',
        value: sum('active'),
        icon: BriefcaseBusiness
      },

      {
        title: 'High Priority Tasks',
        value: sum('highPriority'),
        icon: AlertCircle,
        color: 'text-warn'
      },

      {
        title: 'High Task Load',
        value: rows.filter(
          row => row.workloadStatus === 'High'
        ).length,
        icon: BarChart3,
        color: 'text-bad'
      }

    ]

  };

  const summary =
    summaryByType[reportType];

  const changeReport = type => {
    setReportType(type);
    setPage(1);
  };

  const resetFilters = () => {
    setEmployee('all');
    setDepartment('all');
    setSearch('');
    setFromDate('');
    setToDate('');
    setAttendanceFromDate(currentMonthStart());
    setAttendanceToDate(getToday());
    setPage(1);
  };

  // ==========================================================
  // LOADING / ERROR
  // ==========================================================

  if (isLoading) {
    return (
      <div className="
        rounded-2xl bg-surface
        border border-line
        p-10 text-center text-muted
      ">
        Loading team reports...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="
        rounded-2xl bg-surface
        border border-bad/30
        p-6 text-bad
      ">
        Unable to load team reports.
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-4">

      {/* REPORT TABS */}

      <div className="
        grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3
      ">

        {REPORT_TYPES.map(item => {

          const Icon = item.icon;

          const selected =
            reportType === item.id;

          return (

            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                changeReport(item.id)
              }
              className={`
                rounded-2xl p-4
                text-left border transition
                ${
                  selected

                    ? 'bg-accent/10 border-accent/50 text-accent'

                    : 'bg-surface border-line text-muted hover:border-accent/30'
                }
              `}
            >

              <Icon className="w-5 h-5 mb-3"/>

              <p className="
                text-sm font-semibold
              ">
                {item.title}
              </p>

            </button>

          );

        })}

      </div>

      {/* KPI CARDS */}

      <div className="
        grid grid-cols-1 sm:grid-cols-2
        xl:grid-cols-4 gap-4
      ">

        {summary.map(item => (

          <ReportCard
            key={item.title}
            {...item}
          />

        ))}

      </div>

      {/* REPORT FILTERS */}

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <h2 className="text-base font-semibold text-ink">
            Report Filters
          </h2>

          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface2 px-4 text-xs font-semibold text-muted hover:text-accent"
            >
              Reset Filters
            </button>

            <button
              type="button"
              disabled={!rows.length || reportHasError}
              onClick={() =>
                downloadCsv(
                  rows,
                  (isAttendanceReport || reportType === 'timesheet')
                    ? [
                        ...columns,
                        ['periodFrom', 'From Date'],
                        ['periodTo', 'To Date'],
                        ['dataSource', 'Data Source']
                      ]
                    : columns,
                  reportType
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-on-accent transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4"/>
              Export CSV
            </button>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Search Employee
            </span>

            <div className="relative">

              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>

              <input
                type="search"
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Name or employee ID"
                className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface2 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
              />

            </div>

          </label>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Team Member
            </span>

            <select
              value={employee}
              onChange={event => {
                setEmployee(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            >

              <option value="all">
                All Team Members
              </option>

              {members.map(member => (
                <option
                  key={getEmployeeId(member)}
                  value={getEmployeeId(member)}
                >
                  {getMemberName(member)}
                </option>
              ))}

            </select>

          </label>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              Department
            </span>

            <select
              value={department}
              onChange={event => {
                setDepartment(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            >

              <option value="all">
                All Departments
              </option>

              {[...new Set(
                members.map(getDepartment)
              )].sort().map(item => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              ))}

            </select>

          </label>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              From Date
            </span>

            <input
              type="date"
              value={activeFromDate}
              max={
                isAttendanceReport
                  ? activeToDate || getToday()
                  : activeToDate || undefined
              }
              onChange={event => {
                if (isAttendanceReport) {
                  setAttendanceFromDate(event.target.value);
                } else {
                  setFromDate(event.target.value);
                }

                setPage(1);
              }}
              style={{ colorScheme: 'dark' }}
              className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            />

          </label>

          <label className="min-w-0 space-y-2">

            <span className="block text-xs font-semibold text-muted">
              To Date
            </span>

            <input
              type="date"
              value={activeToDate}
              min={activeFromDate || undefined}
              max={
                isAttendanceReport
                  ? getToday()
                  : undefined
              }
              onChange={event => {
                if (isAttendanceReport) {
                  setAttendanceToDate(event.target.value);
                } else {
                  setToDate(event.target.value);
                }

                setPage(1);
              }}
              style={{ colorScheme: 'dark' }}
              className="h-11 w-full min-w-0 rounded-xl border border-line bg-surface2 px-3 text-sm text-ink outline-none focus:border-accent"
            />

          </label>

        </div>

        {invalidDateRange && (
          <p role="alert" className="mt-3 text-xs text-bad">
            From Date cannot be after To Date.
          </p>
        )}

        {isAttendanceReport &&
          invalidAttendanceRange &&
          !invalidDateRange && (
            <p role="alert" className="mt-3 text-xs text-bad">
              Select a valid date range of up to 366 days,
              ending on or before today.
            </p>
        )}

      </section>

      {reportType === 'leave' &&
        (fromDate || toDate) &&
        !reportHasError && (
          <p className="px-1 text-xs text-muted">
            Overlapping leave requests are included.
            Approved days show the full request duration.
          </p>
      )}
{departmentRows.length > 0 && (

        <section className="
          rounded-2xl border border-line
          bg-surface overflow-hidden
        ">

          <div className="p-5 border-b border-line">

            <h2 className="
              text-base font-semibold text-ink
            ">

              Department-wise Summary

            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="
              w-full whitespace-nowrap
              text-left text-xs
            ">

              <thead className="bg-surface2 text-muted">

                <tr>

                  {[
                    'Department',
                    'Employees',
                    isAttendanceReport
                      ? 'Present Days'
                      : 'Approved Timesheets',
                    'Known Hours',
                    'Record Issues'
                  ].map(label => (

                    <th
                      key={label}
                      className="px-4 py-3 font-semibold"
                    >
                      {label}
                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {departmentRows.map(item => (

                  <tr
                    key={item.department}
                    className="border-t border-line/50"
                  >

                    <td className="
                      px-4 py-3 font-semibold text-ink
                    ">

                      {item.department}

                    </td>

                    <td className="px-4 py-3 text-muted">

                      {item.employees}

                    </td>

                    <td className="px-4 py-3 text-muted">

                      {item.count}

                    </td>

                    <td className="
                      px-4 py-3 font-semibold text-accent
                    ">

                      {item.totalHours === null
                        ? 'N/A'
                        : `${item.totalHours.toFixed(2)} h`}

                    </td>

                    <td className="px-4 py-3 text-muted">

                      {item.issues}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

      )}

      {/* REPORT TABLE */}

      <section className="
        rounded-2xl bg-surface
        border border-line overflow-hidden
      ">

        <div className="
          p-5 border-b border-line
          flex flex-wrap items-center
          justify-between gap-3
        ">

          <div>

            <h2 className="
              text-lg font-semibold text-ink
            ">
              {activeReport.title}
            </h2>

            <p className="
              mt-1 text-xs text-muted
            ">
              {isAttendanceReport
                ? 'Saved attendance records - completed sessions only contribute to working hours'
                : activeReport.description}
            </p>

          </div>

          <span className="
            px-3 py-1.5 rounded-xl
            bg-surface2 border border-line
            text-xs text-muted
          ">
            {rows.length} employees
          </span>

        </div>

        {rows.length === 0 ? (

          <div className="
            py-14 px-5 text-center
          ">

            <BarChart3 className="
              w-10 h-10 mx-auto
              text-muted opacity-50
            "/>

            <p className="
              mt-3 font-semibold
              text-sm text-ink
            ">
              No matching report data
            </p>

            <p className="
              mt-2 text-xs text-muted
            ">
              Change the filters to view
              available employee records.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="
              w-full text-left text-sm
              whitespace-nowrap
            ">

              <thead className="bg-surface2">

                <tr>

                  {columns.map(([key, title]) => (

                    <th
                      key={key}
                      className="
                        px-4 py-3
                        text-xs font-semibold
                        text-muted
                        border-b border-line
                      "
                    >

                      {title}

                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {paginatedRows.map((row, index) => (

                  <tr
                    key={`${row.employeeId}-${index}`}
                    className="
                      border-b border-line
                      hover:bg-surface2 transition
                    "
                  >

                    {columns.map(([key]) => {

                      const value =
                        displayValue(row[key]);

                      if (key === 'workloadStatus') {

                        const color =
                          value === 'High'

                            ? 'bg-bad/10 text-bad'

                            : value === 'Moderate'

                              ? 'bg-warn/10 text-warn'

                              : 'bg-good/10 text-good';

                        return (

                          <td
                            key={key}
                            className="px-4 py-4"
                          >

                            <span className={`
                              px-2.5 py-1 rounded-lg
                              text-xs font-semibold
                              ${color}
                            `}>

                              {value}

                            </span>

                          </td>

                        );

                      }

                      return (

                        <td
                          key={key}
                          className={`
                            px-4 py-4
                            ${
                              key === 'employeeName'

                                ? 'font-semibold text-ink'

                                : key === 'overdue' &&
                                  Number(row[key]) > 0

                                  ? 'text-bad font-semibold'

                                  : 'text-muted'
                            }
                          `}
                        >

                          {value}

                        </td>

                      );

                    })}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* PAGINATION */}

        <div className="
          flex flex-wrap items-center
          justify-between gap-3
          px-5 py-4
        ">

          <p className="
            text-xs text-muted
          ">

            Showing{' '}

            {rows.length
              ? (currentPage - 1) * PAGE_SIZE + 1
              : 0}

            {' - '}

            {Math.min(
              currentPage * PAGE_SIZE,
              rows.length
            )}

            {' of '}

            {rows.length}

          </p>

          <div className="
            flex items-center gap-2
          ">

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setPage(currentPage - 1)
              }
              className="
                px-3 py-2 rounded-lg
                bg-surface2 border border-line
                text-xs text-ink
                disabled:opacity-40
              "
            >
              Previous
            </button>

            <span className="
              text-xs text-muted px-2
            ">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage(currentPage + 1)
              }
              className="
                px-3 py-2 rounded-lg
                bg-surface2 border border-line
                text-xs text-ink
                disabled:opacity-40
              "
            >
              Next
            </button>

          </div>

        </div>

      </section>

    </div>
  );
};

export default TeamReports;