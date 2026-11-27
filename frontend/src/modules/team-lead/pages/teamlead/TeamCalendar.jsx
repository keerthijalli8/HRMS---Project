import React, { useEffect, useState } from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { useAttendance } from '../../context/AttendanceContext.jsx';

import {
  upcomingBirthdaysAndHolidays
} from '../../data/mockData.js';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Clock,
  Gift,
  CalendarCheck,
  CheckSquare,
  FolderKanban,
  Target,
  UserCheck
} from 'lucide-react';

// ============================================================
// CALENDAR HELPERS
// ============================================================

const safeArray = value =>
  Array.isArray(value) ? value : [];

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const dateKeyOf = date => {

  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime())
  ) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;

};

const validDateKey = value => {

  if (typeof value === 'number') {

    return dateKeyOf(new Date(value));

  }

  const key = String(value ?? '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return null;
  }

  const date = new Date(`${key}T00:00:00`);

  return Number.isFinite(date.getTime()) &&
    dateKeyOf(date) === key
      ? key
      : null;

};

const displayDate = value => {

  const key = validDateKey(value);

  return key
    ? new Date(`${key}T00:00:00`).toLocaleDateString(
        'en-IN',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }
      )
    : 'Date unavailable';

};

const shortDate = value => {

  const key = validDateKey(value);

  return key
    ? new Date(`${key}T00:00:00`).toLocaleDateString(
        'en-IN',
        {
          day: 'numeric',
          month: 'short'
        }
      )
    : '—';

};

const identityIds = person => [

  person?.employeeId,
  person?.userId,
  person?.id

].filter(Boolean).map(normalize);

const primaryId = person =>
  normalize(
    person?.employeeId ||
    person?.userId ||
    person?.id
  );

const personName = person =>
  person?.name ||
  person?.fullName ||
  person?.employeeName ||
  'Employee';

const referenceIds = value => {

  if (Array.isArray(value)) {

    return value.flatMap(referenceIds);

  }

  if (value && typeof value === 'object') {

    return identityIds(value);

  }

  return value
    ? [normalize(value)]
    : [];

};

const matchPeople = (references, people) => {

  const ids = new Set(
    referenceIds(references)
  );

  return people.filter(person =>
    identityIds(person).some(id =>
      ids.has(id)
    )
  );

};

const recordOwnerIds = record => [

  ...referenceIds(record?.employeeId),
  ...referenceIds(record?.userId),
  ...referenceIds(record?.assigneeId),
  ...referenceIds(record?.assignedToId),
  ...referenceIds(record?.assignedTo),
  ...referenceIds(record?.assignee),
  ...referenceIds(record?.employee)

];

const statusValue = value =>
  normalize(
    typeof value === 'object'
      ? value?.status || value?.decision
      : value
  );

const isApprovedLeave = request => {

  if (
    normalize(request?.status) !== 'approved'
  ) {
    return false;
  }

  const stageStatuses = [

    request.teamLeadStatus,
    request.hrStatus,

    request.teamLeadApprovalStatus,
    request.hrApprovalStatus,

    request.teamLeadApproval,
    request.hrApproval,

    request.approvals?.teamLead,
    request.approvals?.hr

  ]
    .map(statusValue)
    .filter(Boolean);

  return stageStatuses.every(
    status => status === 'approved'
  );

};

const isCancelled = record =>

  [
    'cancelled',
    'canceled',
    'deleted',
    'archived',
    'rejected'
  ].includes(normalize(record?.status));

// ============================================================
// PERSONAL LEAVE RECORDS
// ============================================================

const readPersonalLeaveRecords = () => {

  try {

    const raw = window.localStorage.getItem(
      'technomold_teamlead_my_leave_requests'
    );

    return safeArray(
      raw ? JSON.parse(raw) : []
    );

  } catch {

    return [];

  }

};

// ============================================================
// EVENT CONFIGURATION
// ============================================================

const EVENT_TYPES = {

  leave: {
    label: 'Approved Leave',
    color: 'text-warn',
    background: 'bg-warn/10',
    border: 'border-warn/30',
    icon: Users
  },

  holiday: {
    label: 'Holiday',
    color: 'text-good',
    background: 'bg-good/10',
    border: 'border-good/30',
    icon: CalendarCheck
  },

  task: {
    label: 'Task Deadline',
    color: 'text-accent',
    background: 'bg-accent/10',
    border: 'border-accent/30',
    icon: CheckSquare
  },

  project: {
    label: 'Project Milestone',
    color: 'text-[#a5b4fc]',
    background: 'bg-[#a5b4fc]/10',
    border: 'border-[#a5b4fc]/30',
    icon: FolderKanban
  },

  review: {
    label: 'Performance Review',
    color: 'text-[#f0abfc]',
    background: 'bg-[#f0abfc]/10',
    border: 'border-[#f0abfc]/30',
    icon: Target
  },

  shift: {
    label: 'Work Schedule',
    color: 'text-info',
    background: 'bg-info/10',
    border: 'border-info/30',
    icon: Clock
  },

  attendance: {
    label: 'Attendance',
    color: 'text-good',
    background: 'bg-good/10',
    border: 'border-good/30',
    icon: UserCheck
  },

  event: {
    label: 'Birthday / Event',
    color: 'text-[#f9a8d4]',
    background: 'bg-[#f9a8d4]/10',
    border: 'border-[#f9a8d4]/30',
    icon: Gift
  }

};

const FILTERS = [

  { value: 'all', label: 'All Events' },
  { value: 'leave', label: 'Leaves' },
  { value: 'holiday', label: 'Holidays' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'review', label: 'Reviews' },
  { value: 'shift', label: 'Schedules' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'event', label: 'Events' }

];

const WEEKDAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun'
];

// ============================================================
// EVENT BUILDER
// ============================================================

const buildCalendarEvents = ({
  context,
  attendance,
  people,
  personal
}) => {

  const events = [];

  const addEvent = ({
    id,
    type,
    title,
    description,
    startDate,
    endDate,
    members = []
  }) => {

    const start = validDateKey(startDate);

    const end = validDateKey(
      endDate ?? startDate
    );

    if (!start || !end || end < start) {
      return;
    }

    events.push({

      id: `${type}-${id}-${start}`,

      type,

      title: title || EVENT_TYPES[type].label,

      description:
        description || EVENT_TYPES[type].label,

      startDate: start,

      endDate: end,

      employeeIds: [
        ...new Set(
          members.map(primaryId).filter(Boolean)
        )
      ]

    });

  };

  // ==========================================================
  // APPROVED LEAVES
  // ==========================================================

  const leaveRecords = [

    ...safeArray(context.approvals),

    ...(
      personal
        ? [

            ...safeArray(context.myLeaveRequests),

            ...safeArray(context.personalLeaveRequests),

            ...readPersonalLeaveRecords()

          ]
        : []
    )

  ];

  leaveRecords.forEach((request, index) => {

    const category = normalize(
      request.category
    );

    const type = normalize(
      request.requestType ||
      request.leaveType
    );

    const isLeave =
      category === 'leave approval' ||
      category === 'leave' ||
      Boolean(request.leaveType) ||
      type.includes('leave');

    if (
      !isLeave ||
      !isApprovedLeave(request)
    ) {
      return;
    }

    const matched = matchPeople(
      recordOwnerIds(request),
      people
    );

    if (matched.length !== 1) {
      return;
    }

    const member = matched[0];

    addEvent({

      id: request.id || index,

      type: 'leave',

      title: personal
        ? request.requestType ||
          request.leaveType ||
          'Approved Leave'
        : personName(member),

      description:
        request.requestType ||
        request.leaveType ||
        'Approved Leave',

      startDate:
        request.fromDate ||
        request.startDate,

      endDate:
        request.toDate ||
        request.endDate ||
        request.fromDate ||
        request.startDate,

      members: matched

    });

  });

  // ==========================================================
  // COMPANY HOLIDAYS
  // ==========================================================

  safeArray(
    upcomingBirthdaysAndHolidays?.holidays
  ).forEach((holiday, index) => {

    addEvent({

      id: holiday.id || index,

      type: 'holiday',

      title:
        holiday.name ||
        holiday.title ||
        'Company Holiday',

      description:
        holiday.type ||
        'Company Holiday',

      startDate: holiday.date

    });

  });

  // ==========================================================
  // BIRTHDAYS
  // ==========================================================

  safeArray(
    upcomingBirthdaysAndHolidays?.birthdays
  ).forEach((birthday, index) => {

    const birthdayId =
      birthday.employeeId ||
      birthday.userId;

    const birthdayName = normalize(
      birthday.name ||
      birthday.employeeName
    );

    const matched = birthdayId

      ? matchPeople(birthdayId, people)

      : people.filter(person =>
          birthdayName &&
          normalize(personName(person)) ===
            birthdayName
        );

    if (matched.length !== 1) {
      return;
    }

    addEvent({

      id: birthday.id || index,

      type: 'event',

      title: personal
        ? 'My Birthday'
        : `${personName(matched[0])} - Birthday`,

      description: 'Birthday',

      startDate: birthday.date,

      members: matched

    });

  });

  // ==========================================================
  // TASK DEADLINES
  // ==========================================================

  const taskRecords = [

    ...safeArray(context.tasks),

    ...(
      personal
        ? safeArray(context.myTasks)
        : []
    )

  ];

  taskRecords.forEach((task, index) => {

    if (!task || isCancelled(task)) {
      return;
    }

    const matched = matchPeople(
      recordOwnerIds(task),
      people
    );

    if (!matched.length) {
      return;
    }

    addEvent({

      id: task.id || task.taskId || index,

      type: 'task',

      title:
        task.title ||
        task.name ||
        'Task Deadline',

      description: [

        matched.map(personName).join(', '),

        task.status

      ].filter(Boolean).join(' · '),

      startDate:
        task.dueDate ||
        task.deadline ||
        task.targetDate,

      members: matched

    });

  });

  // ==========================================================
  // PROJECTS AND MILESTONES
  // ==========================================================

  const projectRecords = [

    ...safeArray(context.projects),

    ...(
      personal
        ? safeArray(context.myProjects)
        : []
    )

  ];

  projectRecords.forEach((project, index) => {

    if (!project || isCancelled(project)) {
      return;
    }

    const projectReferences = [

      project.memberIds,
      project.members,
      project.teamMemberIds,
      project.assignedEmployees,
      project.ownerId,
      project.teamLeadId,
      project.managerId,
      project.assignedTo

    ];

    const matched = matchPeople(
      projectReferences,
      people
    );

    if (!matched.length) {
      return;
    }

    const projectName =
      project.name ||
      project.title ||
      'Project';

    addEvent({

      id: project.id || project.projectId || index,

      type: 'project',

      title: `${projectName} - Deadline`,

      description: [

        matched.map(personName).join(', '),

        project.status

      ].filter(Boolean).join(' · '),

      startDate:
        project.dueDate ||
        project.endDate ||
        project.deadline ||
        project.targetDate,

      members: matched

    });

    safeArray(project.milestones).forEach(
      (milestone, milestoneIndex) => {

        if (
          !milestone ||
          isCancelled(milestone)
        ) {
          return;
        }

        const milestoneReferences = [
          ...recordOwnerIds(milestone),
          ...referenceIds(milestone.memberIds)
        ];

        const milestoneMembers =
          milestoneReferences.length

            ? matchPeople(
                milestoneReferences,
                matched
              )

            : matched;

        if (!milestoneMembers.length) {
          return;
        }

        addEvent({

          id: `${
            project.id ||
            project.projectId ||
            index
          }-${milestone.id || milestoneIndex}`,

          type: 'project',

          title:
            milestone.title ||
            milestone.name ||
            'Project Milestone',

          description: projectName,

          startDate:
            milestone.dueDate ||
            milestone.targetDate ||
            milestone.endDate ||
            milestone.date,

          members: milestoneMembers

        });

      }
    );

  });

  // ==========================================================
  // SCHEDULED PERFORMANCE REVIEWS
  // ==========================================================

  const reviewRecords = [

    ...safeArray(context.scheduledReviews),

    ...safeArray(context.performanceReviews)

  ];

  reviewRecords.forEach((review, index) => {

    if (!review || isCancelled(review)) {
      return;
    }

    const matched = matchPeople(
      recordOwnerIds(review),
      people
    );

    if (!matched.length) {
      return;
    }

    addEvent({

      id: review.id || index,

      type: 'review',

      title: personal
        ? review.title || 'My Performance Review'
        : `${personName(matched[0])} - Review`,

      description:
        review.title ||
        review.reviewType ||
        'Performance Review',

      startDate:
        review.scheduledDate ||
        review.reviewDate ||
        review.scheduledAt,

      members: matched

    });

  });

  // ==========================================================
  // WORK SCHEDULES
  // ==========================================================

  const shiftRecords = [

    ...safeArray(context.shiftSchedules),

    ...safeArray(context.workSchedules)

  ];

  shiftRecords.forEach((shift, index) => {

    if (!shift || isCancelled(shift)) {
      return;
    }

    const matched = matchPeople(
      recordOwnerIds(shift),
      people
    );

    if (!matched.length) {
      return;
    }

    addEvent({

      id: shift.id || index,

      type: 'shift',

      title:
        shift.shiftName ||
        shift.name ||
        shift.title ||
        'Work Schedule',

      description: [

        matched.map(personName).join(', '),

        [
          shift.startTime,
          shift.endTime
        ].filter(Boolean).join(' - ')

      ].filter(Boolean).join(' · '),

      startDate:
        shift.date ||
        shift.startDate,

      endDate:
        shift.endDate ||
        shift.date ||
        shift.startDate,

      members: matched

    });

  });

  // ==========================================================
  // PERSONAL ATTENDANCE
  // ==========================================================

  if (personal && people.length === 1) {

    const attendanceRecords = [
      ...safeArray(attendance.attendanceHistory)
    ];

    if (attendance.checkInTimestamp) {

      attendanceRecords.push({

        dateKey:
          attendance.attendanceDateKey,

        checkInTime:
          attendance.checkInTimestamp,

        checkOutTime:
          attendance.checkOutTimestamp

      });

    }

    attendanceRecords.forEach(record => {

      const checkIn =
        record.checkInTime ??
        record.checkIn;

      const checkOut =
        record.checkOutTime ??
        record.checkOut;

      if (!checkIn) {
        return;
      }

      const start = new Date(checkIn);

      if (!Number.isFinite(start.getTime())) {
        return;
      }

      const end = checkOut
        ? new Date(checkOut)
        : null;

      const validEnd =
        end &&
        Number.isFinite(end.getTime()) &&
        end.getTime() >= start.getTime();

      const formatTime = date =>
        date.toLocaleTimeString('en-IN', {

          hour: '2-digit',
          minute: '2-digit',
          hour12: true

        });

      const day =
        validDateKey(record.dateKey) ||
        dateKeyOf(start);

      addEvent({

        id: `${primaryId(people[0])}-${day}`,

        type: 'attendance',

        title: validEnd
          ? 'Attendance Completed'
          : 'Check-in Recorded',

        description: validEnd
          ? `${formatTime(start)} - ${formatTime(end)}`
          : `Check-in: ${formatTime(start)}`,

        startDate: day,

        members: people

      });

    });

  }

  // ==========================================================
  // REMOVE DUPLICATES AND SORT
  // ==========================================================

  const unique = new Map();

  events.forEach(event => {

    unique.set(event.id, event);

  });

  return [...unique.values()].sort(
    (first, second) =>

      first.startDate.localeCompare(
        second.startDate
      ) ||

      first.title.localeCompare(
        second.title
      )
  );

};

// ============================================================
// EVENT DETAIL CARD
// ============================================================

const EventCard = ({
  event,
  onClick
}) => {

  const style =
    EVENT_TYPES[event.type];

  const Icon =
    style.icon;

  return (

    <button
      type="button"
      onClick={onClick}
      className={`
        block w-full rounded-xl border p-4
        text-left transition hover:brightness-110
        ${style.background}
        ${style.border}
      `}
    >

      <div className="
        mb-2 flex items-center gap-2
      ">

        <Icon className={`
          h-4 w-4 ${style.color}
        `} />

        <span className={`
          text-[11px] font-semibold
          ${style.color}
        `}>

          {style.label}

        </span>

      </div>

      <p className="
        break-words text-sm
        font-semibold text-ink
      ">

        {event.title}

      </p>

      <p className="
        mt-1 break-words
        text-xs text-muted
      ">

        {event.description}

      </p>

      <p className="
        mt-2 text-xs text-muted
      ">

        {shortDate(event.startDate)}

        {event.startDate !== event.endDate &&
          ` - ${shortDate(event.endDate)}`}

      </p>

    </button>

  );

};

// ============================================================
// SHARED CALENDAR WORKSPACE
// ============================================================

export const TeamCalendar = ({
  personal = false
}) => {

  const context = useTeamLead() || {};

  const attendance = useAttendance() || {};

  const {
    currentUser,
    teamMembers,
    isLoading,
    loadError
  } = context;

  const [month, setMonth] = useState(() => {

    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

  });

  const [selectedDate, setSelectedDate] =
    useState(() => dateKeyOf(new Date()));

  const [category, setCategory] =
    useState('all');

  const [employee, setEmployee] =
    useState('all');

  const [, refreshCalendar] =
    useState(0);

  // ==========================================================
  // REFRESH WHEN SAVED RECORDS CHANGE
  // ==========================================================

  useEffect(() => {

    const refresh = () =>
      refreshCalendar(value => value + 1);

    window.addEventListener(
      'storage',
      refresh
    );

    window.addEventListener(
      'focus',
      refresh
    );

    window.addEventListener(
      'technomold:teamlead:approval-updated',
      refresh
    );

    window.addEventListener(
      'technomold:teamlead:attendance-punch',
      refresh
    );

    return () => {

      window.removeEventListener(
        'storage',
        refresh
      );

      window.removeEventListener(
        'focus',
        refresh
      );

      window.removeEventListener(
        'technomold:teamlead:approval-updated',
        refresh
      );

      window.removeEventListener(
        'technomold:teamlead:attendance-punch',
        refresh
      );

    };

  }, []);

  // ==========================================================
  // PERSONAL AND TEAM DATA SCOPE
  // ==========================================================

  const ownIds =
    identityIds(currentUser);

  const people = personal

    ? (
        currentUser &&
        primaryId(currentUser)
          ? [currentUser]
          : []
      )

    : safeArray(teamMembers).filter(member =>

        primaryId(member) &&

        !identityIds(member).some(id =>
          ownIds.includes(id)
        )

      );

  const memberOptions = [

    ...new Map(
      people.map(person => [
        primaryId(person),
        {
          id: primaryId(person),
          name: personName(person)
        }
      ])
    ).values()

  ];

  const activeEmployee =
    !personal &&
    memberOptions.some(
      member => member.id === employee
    )
      ? employee
      : 'all';

  const allEvents = buildCalendarEvents({

    context,

    attendance,

    people,

    personal

  });

  const scopedEvents = allEvents.filter(
    event =>

      personal ||

      activeEmployee === 'all' ||

      event.type === 'holiday' ||

      event.employeeIds.includes(
        activeEmployee
      )
  );

  const visibleEvents = scopedEvents.filter(
    event =>

      category === 'all' ||
      event.type === category
  );

  const today =
    dateKeyOf(new Date());

  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(year, monthIndex, 1);

  const lastDay =
    new Date(year, monthIndex + 1, 0);

  const monthStart =
    dateKeyOf(firstDay);

  const monthEnd =
    dateKeyOf(lastDay);

  const monthLabel =
    month.toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric'
      }
    );

  const monthlyEvents =
    scopedEvents.filter(event =>

      event.startDate <= monthEnd &&

      event.endDate >= monthStart

    );

  // ==========================================================
  // MONTHLY SUMMARY CARDS
  // ==========================================================

  const summaryTypes = [

    ['leave', personal ? 'My Leaves' : 'Team Leaves'],

    ['holiday', 'Company Holidays'],

    ['task', 'Task Deadlines'],

    ['project', 'Project Events'],

    ['review', 'Scheduled Reviews'],

    ['shift', 'Work Schedules'],

    ...(personal
      ? [['attendance', 'Attendance Days']]
      : []),

    ['event', 'Birthdays & Events']

  ];

  const sourceAvailable = {

    task:
      Array.isArray(context.tasks) ||
      Array.isArray(context.myTasks),

    project:
      Array.isArray(context.projects) ||
      Array.isArray(context.myProjects),

    review:
      Array.isArray(context.scheduledReviews) ||
      Array.isArray(context.performanceReviews),

    shift:
      Array.isArray(context.shiftSchedules) ||
      Array.isArray(context.workSchedules)

  };

  const monthSummary = summaryTypes.map(
    ([type, title]) => ({

      type,

      title,

      count:
        sourceAvailable[type] === false
          ? null
          : monthlyEvents.filter(
              event => event.type === type
            ).length

    })
  );

  const applicableFilters = FILTERS.filter(
    filter =>

      personal ||
      filter.value !== 'attendance'
  );

  const getEventsForDate = date =>
    visibleEvents.filter(event =>

      event.startDate <= date &&

      event.endDate >= date

    );

  const selectedEvents =
    getEventsForDate(selectedDate);

  // ==========================================================
  // UPCOMING EVENTS
  // ==========================================================

  const upcomingEnd = new Date();

  upcomingEnd.setDate(
    upcomingEnd.getDate() + 30
  );

  const upcomingEvents = visibleEvents.filter(
    event =>

      event.endDate >= today &&

      event.startDate <=
        dateKeyOf(upcomingEnd)

  ).slice(0, 6);

  // ==========================================================
  // MONTH GRID
  // ==========================================================

  const leadingDays =
    (firstDay.getDay() + 6) % 7;

  const totalCells = Math.ceil(
    (leadingDays + lastDay.getDate()) / 7
  ) * 7;

  const calendarDays = Array.from(

    { length: totalCells },

    (_, index) => {

      const date = new Date(

        year,

        monthIndex,

        index - leadingDays + 1

      );

      return {

        date,

        key: dateKeyOf(date),

        day: date.getDate(),

        inCurrentMonth:
          date.getMonth() === monthIndex

      };

    }

  );

  // ==========================================================
  // CALENDAR NAVIGATION
  // ==========================================================

  const changeMonth = offset => {

    const next = new Date(

      year,

      monthIndex + offset,

      1

    );

    setMonth(next);

    setSelectedDate(dateKeyOf(next));

  };

  const goToToday = () => {

    const now = new Date();

    setMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    setSelectedDate(dateKeyOf(now));

  };

  const openDate = value => {

    const key = validDateKey(value);

    if (!key) return;

    const date =
      new Date(`${key}T00:00:00`);

    setSelectedDate(key);

    setMonth(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );

  };

  // ==========================================================
  // LOADING AND ERROR
  // ==========================================================

  if (isLoading) {

    return (

      <div className="
        rounded-2xl border border-line
        bg-surface p-10
        text-center text-muted
      ">

        Loading calendar...

      </div>

    );

  }

  if (
    loadError ||
    !primaryId(currentUser)
  ) {

    return (

      <div className="
        rounded-2xl border border-bad/30
        bg-surface p-6 text-bad
      ">

        Unable to load calendar.

      </div>

    );

  }

  // ==========================================================
  // CALENDAR PAGE
  // ==========================================================

  return (

    <div className="space-y-5">

      {/* MONTHLY SUMMARY */}

      <div className="
        grid grid-cols-2 gap-3
        lg:grid-cols-3 xl:grid-cols-4
      ">

        {monthSummary.map(item => {

          const style =
            EVENT_TYPES[item.type];

          const Icon =
            style.icon;

          return (

            <button
              key={item.type}
              type="button"
              aria-pressed={category === item.type}
              onClick={() =>
                setCategory(previous =>
                  previous === item.type
                    ? 'all'
                    : item.type
                )
              }
              className={`
                rounded-2xl border bg-surface
                p-4 text-left transition
                hover:border-accent/40

                ${
                  category === item.type
                    ? 'border-accent/40'
                    : 'border-line'
                }
              `}
            >

              <div className="
                flex items-center
                justify-between gap-2
              ">

                <div className={`
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  ${style.background}
                `}>

                  <Icon className={`
                    h-5 w-5 ${style.color}
                  `} />

                </div>

                <span className="
                  text-[11px] text-muted
                ">

                  {monthLabel}

                </span>

              </div>

              <p className="
                mt-3 text-sm text-muted
              ">

                {item.title}

              </p>

              <p className="
                mt-1 text-2xl
                font-bold text-ink
                tabular-nums
              ">

                {item.count ?? '—'}

              </p>

            </button>

          );

        })}

      </div>

      {/* FILTERS */}

      <section className="
        flex flex-wrap items-center
        justify-between gap-3
        rounded-2xl border border-line
        bg-surface p-3
      ">

        <div className="
          flex flex-wrap items-center gap-2
        ">

          {applicableFilters.map(filter => (

            <button
              key={filter.value}
              type="button"
              aria-pressed={
                category === filter.value
              }
              onClick={() =>
                setCategory(filter.value)
              }
              className={`
                rounded-lg border
                px-3 py-2 text-xs
                font-semibold transition

                ${
                  category === filter.value

                    ? 'border-accent/40 bg-accent/10 text-accent'

                    : 'border-line bg-surface2 text-muted hover:text-ink'
                }
              `}
            >

              {filter.label}

            </button>

          ))}

        </div>

        {!personal && (

          <select
            aria-label="Filter by employee"
            value={activeEmployee}
            onChange={event =>
              setEmployee(event.target.value)
            }
            className="
              min-w-[170px]
              rounded-xl border border-line
              bg-surface2 px-3 py-2.5
              text-sm text-ink outline-none
              focus:border-accent
            "
          >

            <option value="all">

              All Team Members

            </option>

            {memberOptions.map(member => (

              <option
                key={member.id}
                value={member.id}
              >

                {member.name}

              </option>

            ))}

          </select>

        )}

      </section>

      {/* CALENDAR AND DAY SCHEDULE */}

      <div className="
        grid grid-cols-1 gap-5
        xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]
      ">

        {/* MONTH VIEW */}

        <section className="
          min-w-0 overflow-hidden
          rounded-2xl border border-line
          bg-surface
        ">

          <div className="
            flex flex-wrap items-center
            justify-between gap-3
            border-b border-line p-4
          ">

            <div className="
              flex items-center gap-3
            ">

              <CalendarDays className="
                h-5 w-5 text-accent
              " />

              <h2 className="
                text-lg font-semibold text-ink
              ">

                {monthLabel}

              </h2>

            </div>

            <div className="
              flex items-center gap-2
            ">

              <button
                type="button"
                onClick={goToToday}
                className="
                  inline-flex h-9 items-center
                  justify-center gap-2
                  rounded-lg border
                  border-accent/30 bg-accent/10
                  px-3 text-xs font-semibold
                  text-accent hover:bg-accent/20
                "
              >

                <Calendar className="h-4 w-4" />

                Today

              </button>

              <button
                type="button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
                className="
                  flex h-9 w-9 items-center
                  justify-center rounded-lg
                  border border-line
                  bg-surface2 text-ink
                  hover:border-accent
                "
              >

                <ChevronLeft className="h-4 w-4" />

              </button>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
                className="
                  flex h-9 w-9 items-center
                  justify-center rounded-lg
                  border border-line
                  bg-surface2 text-ink
                  hover:border-accent
                "
              >

                <ChevronRight className="h-4 w-4" />

              </button>

            </div>

          </div>

          <div className="overflow-x-auto">

            <div className="min-w-[560px]">

              {/* WEEKDAY LABELS */}

              <div className="
                grid grid-cols-7
                border-b border-line
              ">

                {WEEKDAYS.map(day => (

                  <div
                    key={day}
                    className="
                      py-3 text-center
                      text-xs font-semibold
                      text-muted
                    "
                  >

                    {day}

                  </div>

                ))}

              </div>

              {/* DAYS */}

              <div className="grid grid-cols-7">

                {calendarDays.map(day => {

                  const events =
                    getEventsForDate(day.key);

                  const isSelected =
                    selectedDate === day.key;

                  const isToday =
                    today === day.key;

                  return (

                    <button
                      key={day.key}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={
                        `${displayDate(day.key)}, ${events.length} events`
                      }
                      onClick={() =>
                        openDate(day.key)
                      }
                      className={`
                        flex min-h-[112px]
                        min-w-0 flex-col gap-1
                        border-b border-r border-line
                        p-2 text-left transition
                        hover:bg-surface2

                        ${
                          isSelected
                            ? 'bg-accent/10'
                            : ''
                        }

                        ${
                          !day.inCurrentMonth
                            ? 'opacity-40'
                            : ''
                        }
                      `}
                    >

                      <span className={`
                        flex h-7 w-7
                        items-center justify-center
                        rounded-lg text-xs
                        font-semibold

                        ${
                          isToday
                            ? 'bg-accent text-on-accent'

                            : isSelected
                              ? 'text-accent'
                              : 'text-ink'
                        }
                      `}>

                        {day.day}

                      </span>

                      {events.slice(0, 2).map(event => {

                        const style =
                          EVENT_TYPES[event.type];

                        return (

                          <span
                            key={event.id}
                            title={event.title}
                            className={`
                              block w-full truncate
                              rounded-md px-1.5 py-1
                              text-[10px] font-medium
                              ${style.background}
                              ${style.color}
                            `}
                          >

                            {event.title}

                          </span>

                        );

                      })}

                      {events.length > 2 && (

                        <span className="
                          px-1 text-[10px] text-muted
                        ">

                          +{events.length - 2} more

                        </span>

                      )}

                    </button>

                  );

                })}

              </div>

            </div>

          </div>

          {/* EVENT LEGEND */}

          <div className="
            flex flex-wrap items-center
            gap-x-4 gap-y-2 p-4
          ">

            {Object.entries(EVENT_TYPES)

              .filter(([type]) =>
                personal || type !== 'attendance'
              )

              .map(([type, style]) => (

                <div
                  key={type}
                  className="
                    flex items-center gap-2
                    text-xs text-muted
                  "
                >

                  <span className={`
                    h-2.5 w-2.5 rounded-full border
                    ${style.background}
                    ${style.border}
                  `} />

                  {style.label}

                </div>

              ))}

          </div>

        </section>

        {/* RIGHT PANEL */}

        <div className="
          min-w-0 space-y-5
        ">

          {/* DAY SCHEDULE */}

          <section className="
            rounded-2xl border border-line
            bg-surface p-5
          ">

            <div className="
              flex items-center gap-2
            ">

              <CalendarDays className="
                h-5 w-5 text-accent
              " />

              <h2 className="
                text-base font-semibold text-ink
              ">

                Day Schedule

              </h2>

            </div>

            <p className="
              mt-2 text-sm text-muted
            ">

              {displayDate(selectedDate)}

            </p>

            <div className="
              mb-4 mt-5 flex items-center
              justify-between gap-2
            ">

              <span className="
                text-xs font-medium
                text-muted
              ">

                Scheduled Items

              </span>

              <span className="
                rounded-lg bg-accent/10
                px-2.5 py-1 text-xs
                font-semibold text-accent
              ">

                {selectedEvents.length}

              </span>

            </div>

            {selectedEvents.length === 0 ? (

              <div className="
                rounded-xl border border-line
                bg-surface2 px-3 py-8
                text-center
              ">

                <Calendar className="
                  mx-auto h-8 w-8 text-muted
                " />

                <p className="
                  mt-3 text-sm text-muted
                ">

                  No scheduled events

                </p>

              </div>

            ) : (

              <div className="
                max-h-[420px]
                space-y-3 overflow-y-auto
              ">

                {selectedEvents.map(event => (

                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() =>
                      openDate(selectedDate)
                    }
                  />

                ))}

              </div>

            )}

          </section>

          {/* UPCOMING EVENTS */}

          <section className="
            rounded-2xl border border-line
            bg-surface p-5
          ">

            <div className="
              flex items-center
              justify-between gap-2
            ">

              <div className="
                flex items-center gap-2
              ">

                <Clock className="
                  h-5 w-5 text-accent
                " />

                <h2 className="
                  text-base font-semibold text-ink
                ">

                  Upcoming Events

                </h2>

              </div>

              <span className="
                text-[11px] text-muted
              ">

                Next 30 Days

              </span>

            </div>

            <div className="mt-4 space-y-3">

              {upcomingEvents.length === 0 ? (

                <p className="
                  rounded-xl border border-line
                  bg-surface2 p-5
                  text-center text-xs text-muted
                ">

                  No upcoming events

                </p>

              ) : (

                upcomingEvents.map(event => (

                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() =>
                      openDate(
                        event.startDate < today
                          ? today
                          : event.startDate
                      )
                    }
                  />

                ))

              )}

            </div>

          </section>

        </div>

      </div>

    </div>

  );

};

// ============================================================
// PERSONAL CALENDAR EXPORT
// ============================================================

export const MyCalendar = () => (

  <TeamCalendar personal />

);

export default TeamCalendar;