import React, {
  useState,
  useMemo,
  useEffect
} from 'react';

import {
  Navigate,
  useNavigate,
  useOutletContext
} from 'react-router-dom';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { KPICard } from '../../components/cards/KPICard.jsx';
import { SparkLineChart } from '../../components/charts/SparkLineChart.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { ApprovalCommentModal } from '../../components/modals/ApprovalCommentModal.jsx';

import {
  formatDate,
  formatDateRange
} from '../../utils/helpers.js';

import { readStorage } from '../../utils/storage.js';

import {
  canManageApprovals,
  userIdOf
} from '../../utils/dataScope.js';

import {
  upcomingBirthdaysAndHolidays
} from '../../data/mockData.js';

import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  CheckCircle,
  Clock,
  CheckSquare,
  TrendingUp,
  Gift,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FolderKanban
} from 'lucide-react';

// ============================================================
// CONFIGURATION
// ============================================================

const ROSTER_PUNCHES_KEY =
  'technomold_teamlead_attendance_roster_punches';

const GOALS_KEY =
  'technomold_teamlead_employee_goals';

const KPI_PAGE_SIZE = 4;

const LATE_THRESHOLD = 9 * 60 + 30;

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const getMemberId = member =>
  String(member?.id || member?.employeeId || '');

// ============================================================
// DASHBOARD TYPOGRAPHY AND STYLES
// ============================================================

const DISPLAY_FONT =
  "'Syne', 'Inter', sans-serif";

const BODY_FONT =
  "'Inter', 'Segoe UI', Arial, sans-serif";

const DATA_FONT =
  "'Space Mono', 'Consolas', monospace";

const PANEL_CLASS = `
  glass-card !p-5
  flex min-w-0 min-h-[300px]
  flex-col !rounded-2xl
  font-body
`;

const PRIMARY_BUTTON = `
  inline-flex items-center justify-center
  gap-2 rounded-lg bg-accent
  px-4 py-2.5 text-[13px]
  font-body font-medium text-on-accent
  transition hover:brightness-105
  disabled:opacity-50
`;

const SECONDARY_BUTTON = `
  inline-flex items-center justify-center
  gap-2 rounded-lg
  border border-white/10
  bg-white/[0.04]
  px-4 py-2.5 text-[13px]
  font-body font-medium text-ink
  transition
  hover:border-[#6ee7d04d]
  hover:bg-white/[0.07]
`;

const SMALL_ACTION = `
  inline-flex items-center justify-center
  gap-1.5 rounded-lg px-3 py-2
  text-[12px] font-body font-medium
  transition disabled:opacity-50
`;

const SECTION_HEADING = `
  section-heading
  font-display text-section-title
  font-semibold text-ink
`;

const METRIC_NUMBER = `
  font-data text-[32px]
  font-bold leading-tight
  tracking-tight tabular-nums
`;

// ============================================================
// DATE HELPERS
// ============================================================

const getLocalDate = (value = new Date()) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
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

const getGreeting = date => {
  const hours = date.getHours();

  if (hours < 12) return 'Good morning';

  if (hours < 17) return 'Good afternoon';

  return 'Good evening';
};

const getPreviousDates = (now, days = 7) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date(now);

    date.setDate(
      date.getDate() - (days - 1 - index)
    );

    return getLocalDate(date);
  });

const getDayLabel = value =>
  new Date(`${value}T00:00:00`)
    .toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });

const getMonthLabel = date =>
  date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

// ============================================================
// ATTENDANCE STORAGE HELPERS
// ============================================================

const readRosterPunches = () => {
  const records = readStorage(
    ROSTER_PUNCHES_KEY,
    {}
  );

  return records &&
    typeof records === 'object' &&
    !Array.isArray(records)
      ? records
      : {};
};

const readEmployeeHistory = employeeId => {
  const records = readStorage(
    `technomold_teamlead_personal_attendance_${employeeId}`,
    []
  );

  return Array.isArray(records)
    ? records
    : [];
};

const getAttendanceRecord = (
  employeeId,
  dateKey,
  rosterPunches,
  attendanceSessions
) => {
  const employeeHistory =
    readEmployeeHistory(employeeId);

  const historyRecord =
    employeeHistory.find(
      record => record.dateKey === dateKey
    );

  const dailyRecord = readStorage(
    `technomold_teamlead_attendance_${employeeId}_${dateKey}`,
    null
  );

  const candidates = [
    dailyRecord,
    historyRecord,
    attendanceSessions?.[employeeId],
    rosterPunches?.[employeeId]
  ].filter(record => {
    if (!record) return false;

    const checkIn =
      record.checkInTime ||
      record.checkIn;

    return Boolean(checkIn) &&
      getLocalDate(checkIn) === dateKey;
  });

  return candidates.find(record =>
    record.checkOutTime ||
    record.checkOut
  ) || candidates[0] || null;
};

// ============================================================
// APPROVED LEAVE CHECK
// ============================================================

const hasApprovedLeave = (
  employeeId,
  dateKey,
  approvals
) => approvals.some(approval => {
  if (
    approval.category !== 'Leave Approval' ||
    String(approval.employeeId) !== employeeId
  ) {
    return false;
  }

  const teamLeadStatus = normalize(
    approval.teamLeadApproval ??
    approval.managerApprovalStatus
  );

  const hrStatus = normalize(
    approval.hrApproval ??
    approval.hrApprovalStatus
  );

  return (
    teamLeadStatus === 'approved' &&
    hrStatus === 'approved' &&
    Boolean(approval.fromDate) &&
    Boolean(approval.toDate) &&
    dateKey >= String(approval.fromDate).slice(0, 10) &&
    dateKey <= String(approval.toDate).slice(0, 10)
  );
});

// ============================================================
// ATTENDANCE STATUS CALCULATION
// ============================================================

const getAttendanceStatus = (
  member,
  dateKey,
  today,
  rosterPunches,
  attendanceSessions,
  approvals
) => {
  const employeeId = getMemberId(member);

  const record = getAttendanceRecord(
    employeeId,
    dateKey,
    rosterPunches,
    attendanceSessions
  );

  if (!record) {
    if (
      hasApprovedLeave(
        employeeId,
        dateKey,
        approvals
      )
    ) {
      return 'leave';
    }

    return dateKey === today
      ? 'none'
      : 'no-record';
  }

  const checkIn =
    record.checkInTime ||
    record.checkIn;

  const date = new Date(checkIn);

  const workMode = normalize(
    record.workMode ||
    record.attendanceMode
  );

  if (
    workMode === 'remote' ||
    workMode === 'wfh'
  ) {
    return 'remote';
  }

  const minutes =
    date.getHours() * 60 +
    date.getMinutes();

  if (minutes > LATE_THRESHOLD) {
    return 'late';
  }

  if (
    workMode === 'office' ||
    workMode === 'onsite'
  ) {
    return 'office';
  }

  return 'present';
};

const isPresent = status =>
  [
    'office',
    'remote',
    'late',
    'present'
  ].includes(status);

// ============================================================
// APPROVAL HELPERS
// ============================================================

const requiresTeamLeadReview = approval => {
  if (
    normalize(approval.status) !== 'pending'
  ) {
    return false;
  }

  if (approval.category === 'Leave Approval') {
    if (approval.reviewStage) {
      return (
        approval.reviewStage ===
        'team-lead-review'
      );
    }

    const teamLeadStatus = normalize(
      approval.teamLeadApproval ??
      approval.managerApprovalStatus ??
      'pending'
    );

    const hrStatus = normalize(
      approval.hrApproval ??
      approval.hrApprovalStatus ??
      'pending'
    );

    return (
      teamLeadStatus === 'pending' &&
      hrStatus !== 'rejected'
    );
  }

  return true;
};

// ============================================================
// TASK HELPERS
// ============================================================

const isCompletedTask = task =>
  ['completed', 'done'].includes(
    normalize(task.status)
  );

// ============================================================
// CARD HEADER
// ============================================================

const CardHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  children
}) => (
  <div className="
    flex flex-wrap items-start
    justify-between gap-x-3 gap-y-2
    border-b border-white/[0.07] pb-4
  ">
    <div className="min-w-0 flex-1">
      <h3
        className="
          card-heading
          font-body text-card-title
          font-medium leading-snug text-ink
        "
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 500
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p className="
          mt-1.5 font-body text-[12px]
          font-normal leading-relaxed text-muted
        ">
          {subtitle}
        </p>
      )}
    </div>

    {onAction && (
      <button
        type="button"
        onClick={onAction}
        className="
          inline-flex shrink-0 items-center
          gap-1.5 rounded-md py-1
          font-body text-[12px] font-medium
          text-accent transition
          hover:underline
        "
      >
        {actionLabel}

        <ArrowRight
          size={15}
          strokeWidth={1.7}
        />
      </button>
    )}

    {children}
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({
  icon: Icon,
  message
}) => (
  <div className="
    flex flex-1 flex-col
    items-center justify-center
    gap-3 px-3 py-8
    text-center
  ">
    {Icon && (
      <Icon
        size={30}
        strokeWidth={1.5}
        className="text-muted opacity-70"
      />
    )}

    <p className="
      max-w-[250px]
      font-body text-[13px] font-normal
      leading-relaxed text-muted
    ">
      {message}
    </p>
  </div>
);

// ============================================================
// MAIN TEAM LEAD DASHBOARD
// ============================================================

const TeamLeadDashboard = () => {
  const navigate = useNavigate();

  const {
    currentUser,
    teamMembers = [],
    approvals = [],
    tasks = [],
    projects = [],
    attendanceSessions = {},
    recentActivities = [],
    isLoading,
    loadError,
    decideApproval,
    triggerToast
  } = useTeamLead();

  const [directDecision, setDirectDecision] =
    useState(null);

  const [currentKpiSlide, setCurrentKpiSlide] =
    useState(0);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [now, setNow] =
    useState(() => new Date());

  const [rosterPunches, setRosterPunches] =
    useState(readRosterPunches);

  const [goalOverrides, setGoalOverrides] =
    useState(() => readStorage(GOALS_KEY, {}) || {});

  const today = getLocalDate(now);

  const monthLabel = getMonthLabel(now);

  const canReview =
    canManageApprovals(currentUser);

  const firstName =
    currentUser?.firstName ||
    currentUser?.name?.split(' ')[0] ||
    'Team Lead';

  // ==========================================================
  // LIVE DATE UPDATE
  // ==========================================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ==========================================================
  // STORAGE SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {
    const syncData = () => {
      setRosterPunches(readRosterPunches());

      setGoalOverrides(
        readStorage(GOALS_KEY, {}) || {}
      );

      setNow(new Date());
    };

    const syncPunch = event => {
      const employeeId =
        event.detail?.employeeId;

      const record =
        event.detail?.record;

      const saved = readRosterPunches();

      setRosterPunches(
        employeeId && record
          ? {
              ...saved,
              [String(employeeId)]: record
            }
          : saved
      );

      setNow(new Date());
    };

    const handleStorage = event => {
      if (
        !event.key ||
        event.key.startsWith(
          'technomold_teamlead_attendance'
        ) ||
        event.key.startsWith(
          'technomold_teamlead_personal_attendance'
        ) ||
        event.key === GOALS_KEY
      ) {
        syncData();
      }
    };

    window.addEventListener(
      'technomold:teamlead:attendance-punch',
      syncPunch
    );

    window.addEventListener(
      'storage',
      handleStorage
    );

    window.addEventListener(
      'focus',
      syncData
    );

    return () => {
      window.removeEventListener(
        'technomold:teamlead:attendance-punch',
        syncPunch
      );

      window.removeEventListener(
        'storage',
        handleStorage
      );

      window.removeEventListener(
        'focus',
        syncData
      );
    };
  }, []);

  // ==========================================================
  // TEAM ATTENDANCE DATA
  // ==========================================================

  const attendanceMembers = useMemo(() => {
    return teamMembers.map(member => ({
      ...member,

      attendanceStatus:
        getAttendanceStatus(
          member,
          today,
          today,
          rosterPunches,
          attendanceSessions,
          approvals
        )
    }));
  }, [
    teamMembers,
    today,
    rosterPunches,
    attendanceSessions,
    approvals,
    now
  ]);

  // ==========================================================
  // ATTENDANCE KPI CALCULATIONS
  // ==========================================================

  const totalMembers =
    attendanceMembers.length;

  const countStatus = status =>
    attendanceMembers.filter(
      member =>
        member.attendanceStatus === status
    ).length;

  const inOfficeCount =
    countStatus('office');

  const remoteCount =
    countStatus('remote');

  const lateCount =
    countStatus('late');

  const onLeaveCount =
    countStatus('leave');

  const absentCount =
    countStatus('none');

  const unspecifiedPresentCount =
    countStatus('present');

  const presentToday =
    attendanceMembers.filter(member =>
      isPresent(member.attendanceStatus)
    ).length;

  const attendancePercentage =
    totalMembers > 0
      ? (
          presentToday /
          totalMembers * 100
        ).toFixed(1)
      : '—';

  const getPercentage = count =>
    totalMembers > 0
      ? count / totalMembers * 100
      : 0;

  // ==========================================================
  // TEAM RELATIONSHIPS
  // ==========================================================

  const directCount =
    teamMembers.filter(member =>
      normalize(member.relation) === 'direct'
    ).length;

  const indirectCount =
    teamMembers.filter(member =>
      normalize(member.relation) === 'indirect'
    ).length;

  const relationshipSubtitle =
    directCount || indirectCount
      ? `${directCount} Direct · ${indirectCount} Indirect`
      : 'Authorized team members';

  // ==========================================================
  // PENDING APPROVALS
  // ==========================================================

  const pendingApprovals = useMemo(() => {
    if (!canReview) return [];

    return approvals.filter(approval =>
      requiresTeamLeadReview(approval) &&

      String(approval.employeeId || '') !==
        String(userIdOf(currentUser) || '')
    );
  }, [
    approvals,
    canReview,
    currentUser
  ]);

  const pendingApprovalsCount =
    pendingApprovals.length;

  const pendingHRCount =
    approvals.filter(approval =>
      approval.category === 'Leave Approval' &&
      approval.reviewStage === 'hr-review'
    ).length;

  // ==========================================================
  // TASK METRICS
  // ==========================================================

  const completedTasks =
    tasks.filter(isCompletedTask).length;

  const activeTasks =
    tasks.length - completedTasks;

  const overdueTasks =
    tasks.filter(task =>
      !isCompletedTask(task) &&
      task.dueDate &&
      String(task.dueDate).slice(0, 10) < today
    ).length;

  // ==========================================================
  // PROJECT METRICS
  // ==========================================================

  const totalProjects =
    projects.length;

  const activeProjects =
    projects.filter(project =>
      normalize(project.status) !== 'completed'
    ).length;

  // ==========================================================
  // PERFORMANCE METRICS
  // ==========================================================

  const teamScore = useMemo(() => {
    const validScores = teamMembers
      .map(member => member.performanceScore)
      .filter(score =>
        score !== null &&
        score !== undefined &&
        score !== '' &&
        Number.isFinite(Number(score)) &&
        Number(score) >= 0 &&
        Number(score) <= 100
      )
      .map(Number);

    if (!validScores.length) {
      return null;
    }

    return (
      validScores.reduce(
        (total, score) => total + score,
        0
      ) / validScores.length
    ).toFixed(1);
  }, [teamMembers]);

  const averageGoalProgress = useMemo(() => {
    const validGoals = teamMembers
      .map(member => {
        const employeeId = getMemberId(member);

        return (
          goalOverrides?.[employeeId]?.progress ??
          member.goalsProgress
        );
      })
      .filter(progress =>
        progress !== null &&
        progress !== undefined &&
        progress !== '' &&
        Number.isFinite(Number(progress)) &&
        Number(progress) >= 0 &&
        Number(progress) <= 100
      )
      .map(Number);

    if (!validGoals.length) {
      return null;
    }

    return Math.round(
      validGoals.reduce(
        (total, progress) => total + progress,
        0
      ) / validGoals.length
    );
  }, [
    teamMembers,
    goalOverrides
  ]);

  // ==========================================================
  // WEEKLY ATTENDANCE TREND
  // ==========================================================

  const weeklyAttendance = useMemo(() => {
    if (!teamMembers.length) {
      return [];
    }

    return getPreviousDates(now, 7)
      .map(dateKey => {
        const statuses =
          teamMembers.map(member =>
            getAttendanceStatus(
              member,
              dateKey,
              today,
              rosterPunches,
              attendanceSessions,
              approvals
            )
          );

        const present =
          statuses.filter(isPresent).length;

        const leave =
          statuses.filter(
            status => status === 'leave'
          ).length;

        if (!present && !leave) {
          return null;
        }

        return {
          date: dateKey,
          label: getDayLabel(dateKey),

          percentage: Number(
            (
              present /
              teamMembers.length * 100
            ).toFixed(1)
          )
        };
      })
      .filter(Boolean);
  }, [
    teamMembers,
    rosterPunches,
    attendanceSessions,
    approvals,
    today,
    now
  ]);

  // ==========================================================
  // BIRTHDAYS AND HOLIDAYS
  // ==========================================================

  const upcomingBirthdays = useMemo(() => {
    const birthdays =
      upcomingBirthdaysAndHolidays.birthdays || [];

    return birthdays
      .filter(birthday =>
        teamMembers.some(member =>
          normalize(member.name) ===
          normalize(birthday.name)
        )
      )
      .slice(0, 2);
  }, [teamMembers]);

  const upcomingHolidays = useMemo(() => {
    const holidays =
      upcomingBirthdaysAndHolidays.holidays || [];

    return holidays
      .filter(holiday => {
        const date = String(
          holiday.date || ''
        );

        if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
          return false;
        }

        return date.slice(0, 10) >= today;
      })
      .sort((first, second) =>
        String(first.date).localeCompare(
          String(second.date)
        )
      )
      .slice(0, 1);
  }, [today]);

  // ==========================================================
  // RECENT ACTIVITIES
  // ==========================================================

  const visibleActivities = useMemo(() => {
    const visibleNames = new Set(
      teamMembers.map(member =>
        normalize(member.name)
      )
    );

    return recentActivities
      .filter(activity =>
        normalize(activity.user) ===
          normalize(currentUser?.name) ||

        visibleNames.has(
          normalize(activity.user)
        )
      )
      .slice(0, 3);
  }, [
    recentActivities,
    teamMembers,
    currentUser
  ]);

  // ==========================================================
  // KPI CARDS
  // ==========================================================

  const kpiCards = [
    {
      title: 'Team Members',
      value: totalMembers,
      subtitle: relationshipSubtitle,
      icon: Users,
      color: 'accent',

      onClick: () =>
        navigate('/team-lead/team')
    },

    {
      title: 'Present Today',
      value: presentToday,

      subtitle:
        totalMembers > 0
          ? `${attendancePercentage}% recorded present`
          : 'No team members',

      icon: UserCheck,
      color: 'good',

      onClick: () =>
        navigate('/team-lead/team-attendance')
    },

    {
      title: 'Late Arrival',
      value: lateCount,
      subtitle: 'Punch after 09:30 AM',
      icon: Clock,
      color: 'warn',

      onClick: () =>
        navigate('/team-lead/team-attendance')
    },

    {
      title: 'Not Punched',
      value: absentCount,
      subtitle: 'No recorded check-in',
      icon: UserX,
      color: 'bad',

      onClick: () =>
        navigate('/team-lead/team-attendance')
    },

    {
      title: 'On Leave',
      value: onLeaveCount,
      subtitle: 'Approved leave requests',
      icon: Calendar,
      color: 'accent2',

      onClick: () =>
        navigate('/team-lead/leave')
    },

    {
      title: 'Pending Approvals',
      value: pendingApprovalsCount,

      subtitle:
        `${pendingHRCount} awaiting HR review`,

      icon: AlertCircle,
      color: 'warn',

      onClick: () =>
        navigate('/team-lead/approvals')
    },

    {
      title: 'Active Tasks',
      value: activeTasks,

      subtitle:
        `${completedTasks} completed · ${overdueTasks} overdue`,

      icon: CheckSquare,
      color: 'info',

      onClick: () =>
        navigate('/team-lead/tasks')
    },

    {
      title: 'Team Score',
      value: teamScore ?? '—',

      subtitle:
        averageGoalProgress == null
          ? 'No recorded goal progress'
          : `Average goals: ${averageGoalProgress}%`,

      icon: TrendingUp,
      color: 'good',

      onClick: () =>
        navigate('/team-lead/performance')
    }
  ];

  const totalKpiSlides =
    Math.ceil(
      kpiCards.length / KPI_PAGE_SIZE
    );

  const visibleKpiCards =
    kpiCards.slice(
      currentKpiSlide * KPI_PAGE_SIZE,

      currentKpiSlide * KPI_PAGE_SIZE +
        KPI_PAGE_SIZE
    );

  const previousSlide = () => {
    setCurrentKpiSlide(slide =>
      (
        slide - 1 + totalKpiSlides
      ) % totalKpiSlides
    );
  };

  const nextSlide = () => {
    setCurrentKpiSlide(slide =>
      (slide + 1) % totalKpiSlides
    );
  };

  // ==========================================================
  // ATTENDANCE BREAKDOWN
  // ==========================================================

  const attendanceBreakdown = [
    {
      label: 'In Office',
      value: inOfficeCount,
      color: 'bg-good'
    },

    {
      label: 'Remote WFH',
      value: remoteCount,
      color: 'bg-info'
    },

    {
      label: 'Late Arrival',
      value: lateCount,
      color: 'bg-warn'
    },

    {
      label: 'Present (Mode unspecified)',
      value: unspecifiedPresentCount,
      color: 'bg-accent'
    },

    {
      label: 'On Leave',
      value: onLeaveCount,
      color: 'bg-accent2'
    },

    {
      label: 'Not Punched',
      value: absentCount,
      color: 'bg-bad'
    }
  ];

  // ==========================================================
  // APPROVAL DECISIONS
  // ==========================================================

  const handleApprovalDecision = async comment => {
    if (
      !directDecision ||
      !canReview ||
      isSubmitting
    ) {
      return;
    }

    const approval = pendingApprovals.find(
      item =>
        String(item.id) ===
        String(directDecision.approval.id)
    );

    if (!approval) {
      triggerToast(
        'This request has already been reviewed.',
        'warn'
      );

      setDirectDecision(null);

      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await decideApproval(
        approval.id,
        directDecision.action,
        comment
      );

      if (!updated) {
        throw new Error(
          'Unable to update approval request.'
        );
      }

      setDirectDecision(null);

      return updated;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isLoading) {
    return (
      <div className="glass-card !p-12 text-center">
        <div className="
          mx-auto mb-4 h-10 w-10
          animate-spin rounded-full
          border-2 border-line border-t-accent
        " />

        <p className="font-body text-[14px] text-muted">
          Loading dashboard...
        </p>
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (loadError) {
    return (
      <div className="glass-card !p-8 text-center space-y-4">
        <AlertCircle className="mx-auto h-9 w-9 text-bad" />

        <h3 className="font-body text-[18px] font-medium text-ink">
          Unable to load dashboard
        </h3>

        <p className="font-body text-[14px] text-muted">
          {loadError}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className={PRIMARY_BUTTON}
        >
          Retry
        </button>
      </div>
    );
  }

  // ==========================================================
  // DASHBOARD UI
  // ==========================================================

  return (
    <div
      className="space-y-6 font-body"
      style={{ fontFamily: BODY_FONT }}
    >

      {/* ====================================================
          GREETING AND PROJECT OVERVIEW
      ==================================================== */}

      <section className="
        glass-card !p-5 sm:!p-6
        relative overflow-hidden !rounded-2xl
      ">
        <div
          className="
            pointer-events-none absolute
            -right-20 -top-20 h-72 w-72
            rounded-full blur-3xl
          "
          style={{
            backgroundColor: 'rgba(110,231,208,0.05)'
          }}
        />

        <div className="
          relative z-10 grid items-center
          grid-cols-1 gap-6
          xl:grid-cols-[minmax(0,1fr)_280px]
        ">

          {/* WELCOME SECTION */}

          <div className="min-w-0 space-y-4">

            {/* LOCATION AND DATE */}

            <div className="
              flex flex-wrap items-center
              gap-x-3 gap-y-2
              font-body text-[12px] text-muted
            ">
              <span className="
                inline-flex items-center gap-1.5
              ">
                <MapPin
                  size={16}
                  strokeWidth={1.7}
                  className="text-accent"
                />

                {currentUser?.location ||
                  currentUser?.workLocation ||
                  'Team Lead Portal'}
              </span>

              <span className="text-muted opacity-60">
                ·
              </span>

              <span className="
                dashboard-date
                inline-flex items-center gap-1.5
                font-data text-[12px]
                font-bold tracking-wide
              ">
                <CalendarDays
                  size={15}
                  strokeWidth={1.7}
                  className="text-muted"
                />

                {formatDate(today)}
              </span>
            </div>

            {/* REFERENCE STYLE WELCOME HEADING */}

            <h2
              className="
                welcome-heading
                font-display text-welcome
                font-extrabold
                leading-tight tracking-tight
                text-ink break-words
              "
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 800,
                letterSpacing: '-0.035em'
              }}
            >
              <span className="block">
                {getGreeting(now)},
              </span>

              <span className="block">
                {firstName}!
              </span>
            </h2>

            {/* WELCOME DESCRIPTION */}

            <p className="
              max-w-2xl font-body text-[14px]
              font-normal leading-relaxed
              text-muted
            ">
              Here is your team's latest attendance,
              approvals, projects and task overview.
            </p>

            {/* QUICK ACTIONS */}

            <div className="
              flex flex-wrap items-center
              gap-2.5 pt-1
            ">

              {/* DASHBOARD_MODULE_INTEGRATION_V1 */}

              {[
                {
                  title: 'Attendance Regularization',
                  path: '/team-lead/attendance-regularization',
                  icon: Clock,
                  reviewOnly: true
                },
                {
                  title: 'Timesheet Approval',
                  path: '/team-lead/timesheet-approval',
                  icon: CheckSquare,
                  reviewOnly: true
                },
                {
                  title: 'Team Calendar',
                  path: '/team-lead/team-calendar',
                  icon: CalendarDays,
                  reviewOnly: false
                },
                {
                  title: 'Team Reports',
                  path: '/team-lead/team-reports',
                  icon: Users,
                  reviewOnly: false
                }
              ]
                .filter(item =>
                  !item.reviewOnly || canReview
                )
                .map(item => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() =>
                        navigate(item.path)
                      }
                      className={SECONDARY_BUTTON}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.7}
                        className="text-accent"
                      />

                      {item.title}
                    </button>
                  );
                })}

              {canReview && (
                <button
                  type="button"
                  onClick={() =>
                    navigate('/team-lead/approvals')
                  }
                  className={PRIMARY_BUTTON}
                >
                  <CheckCircle
                    size={17}
                    strokeWidth={1.7}
                  />

                  Review Approvals ({pendingApprovalsCount})
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate('/team-lead/team-attendance')
                }
                className={SECONDARY_BUTTON}
              >
                <Clock
                  size={17}
                  strokeWidth={1.7}
                  className="text-accent"
                />

                Team Attendance
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/team-lead/tasks')
                }
                className={SECONDARY_BUTTON}
              >
                <CheckSquare
                  size={17}
                  strokeWidth={1.7}
                  className="text-accent2"
                />

                Active Tasks ({activeTasks})
              </button>
            </div>
          </div>

          {/* PROJECT OVERVIEW */}

          <button
            type="button"
            onClick={() =>
              navigate('/team-lead/projects')
            }
            className="
              w-full min-w-0 text-left
              rounded-xl border border-white/10
              bg-white/[0.03] p-4
              transition
              hover:border-[#6ee7d04d]
              hover:bg-white/[0.05]
            "
          >
            <div className="flex items-center gap-2">
              <FolderKanban
                size={19}
                strokeWidth={1.7}
                className="text-accent"
              />

              <span className="
                flex-1 font-body text-[14px]
                font-medium text-ink
              ">
                Project Overview
              </span>

              <ArrowRight
                size={17}
                className="text-accent"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">

              <div className="min-w-0">
                <p
                  className={`
                    ${METRIC_NUMBER}
                    text-accent
                  `}
                  style={{ fontFamily: DATA_FONT }}
                >
                  {totalProjects}
                </p>

                <p className="
                  mt-2 font-body text-[12px]
                  font-normal text-muted
                ">
                  Total Projects
                </p>
              </div>

              <div className="
                min-w-0 border-l
                border-white/10 pl-4
              ">
                <p
                  className={`
                    ${METRIC_NUMBER}
                    text-good
                  `}
                  style={{ fontFamily: DATA_FONT }}
                >
                  {activeProjects}
                </p>

                <p className="
                  mt-2 font-body text-[12px]
                  font-normal text-muted
                ">
                  Active Projects
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ====================================================
          KPI OVERVIEW
      ==================================================== */}

      <section
        aria-label="Dashboard KPI carousel"
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-3">

          <div>
            <h2
              className={SECTION_HEADING}
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 600
              }}
            >
              Team Overview
            </h2>

            <p className="
              mt-1 font-body text-[12px]
              font-normal text-muted
            ">
              Key workforce and operational metrics
            </p>
          </div>

          {/* KPI CAROUSEL CONTROLS */}

          <div className="flex shrink-0 items-center gap-2">

            <button
              type="button"
              onClick={previousSlide}
              aria-label="Previous KPI slide"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg border border-white/10
                text-muted transition
                hover:border-[#6ee7d04d]
                hover:text-accent
              "
            >
              <ChevronLeft size={17} />
            </button>

            <span className="
              font-data text-[12px]
              text-muted tabular-nums
            ">
              {currentKpiSlide + 1} / {totalKpiSlides}
            </span>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next KPI slide"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg border border-white/10
                text-muted transition
                hover:border-[#6ee7d04d]
                hover:text-accent
              "
            >
              <ChevronRight size={17} />
            </button>

          </div>
        </div>

        {/* KPI CARDS */}

        <div className="
          grid grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4 items-stretch
        ">
          {visibleKpiCards.map(card => (
            <KPICard
              key={card.title}
              {...card}
            />
          ))}
        </div>

        {/* CAROUSEL INDICATORS */}

        <div
          role="group"
          aria-label="KPI slide selection"
          className="flex items-center justify-center gap-2 pt-1"
        >
          {Array.from({
            length: totalKpiSlides
          }).map((_, slide) => (
            <button
              key={slide}
              type="button"
              onClick={() =>
                setCurrentKpiSlide(slide)
              }
              aria-label={`Show KPI slide ${slide + 1}`}
              aria-current={
                currentKpiSlide === slide
                  ? 'true'
                  : undefined
              }
              className="p-1"
            >
              <span
                className={`
                  block h-1.5 rounded-full
                  transition-all

                  ${currentKpiSlide === slide
                    ? 'w-6 bg-accent'
                    : 'w-1.5 bg-white/20'}
                `}
              />
            </button>
          ))}
        </div>
      </section>

      {/* ====================================================
          WORKSPACE OVERVIEW
      ==================================================== */}

      <section className="space-y-4">

        <div>
          <h2
            className={SECTION_HEADING}
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 600
            }}
          >
            Workspace Overview
          </h2>

          <p className="
            mt-1 font-body text-[12px]
            font-normal text-muted
          ">
            Monitor attendance, requests and team updates
          </p>
        </div>

        <div className="
          grid grid-cols-1
          lg:grid-cols-2
          2xl:grid-cols-3
          gap-5 items-stretch
        ">

          {/* ==================================================
              1. TEAM ATTENDANCE
          ================================================== */}

          <section className={PANEL_CLASS}>
            <CardHeader
              title="Today's Team Attendance"
              subtitle={formatDate(today)}
              actionLabel="Details"
              onAction={() =>
                navigate('/team-lead/team-attendance')
              }
            />

            <div className="mt-5 flex-1 space-y-4">

              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className={`
                    ${METRIC_NUMBER}
                    text-good
                  `}>
                    {attendancePercentage === '—'
                      ? '—'
                      : `${attendancePercentage}%`}
                  </div>

                  <p className="
                    mt-2 font-body text-[12px]
                    text-muted
                  ">
                    Recorded attendance
                  </p>
                </div>

                <span className="
                  font-data text-[12px]
                  font-bold text-muted tabular-nums
                ">
                  {presentToday}/{totalMembers} Present
                </span>
              </div>

              {/* ATTENDANCE PROGRESS BAR */}

              <div className="
                flex h-3.5 overflow-hidden
                rounded-full bg-surface2
                border border-white/[0.07]
              ">
                {attendanceBreakdown.map(item => (
                  <div
                    key={item.label}
                    style={{
                      width:
                        `${getPercentage(item.value)}%`
                    }}
                    className={`
                      ${item.color}
                      transition-all duration-300
                    `}
                    title={`${item.label}: ${item.value}`}
                  />
                ))}
              </div>

              {/* ATTENDANCE LEGEND */}

              <div className="
                grid grid-cols-1 sm:grid-cols-2
                gap-x-4 gap-y-3
              ">
                {attendanceBreakdown.map(item => (
                  <div
                    key={item.label}
                    className="
                      flex min-w-0 items-center gap-2
                      font-body text-[12px] text-muted
                    "
                  >
                    <span className={`
                      h-2 w-2 shrink-0
                      rounded-full ${item.color}
                    `} />

                    <span
                      title={item.label}
                      className="min-w-0 flex-1"
                    >
                      {item.label}
                    </span>

                    <span className="
                      shrink-0 font-data font-bold
                      text-ink tabular-nums
                    ">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {!totalMembers && (
                <p className="font-body text-[13px] text-muted">
                  No authorized team members available.
                </p>
              )}

              {totalMembers > 0 &&
                presentToday === 0 &&
                onLeaveCount === 0 && (
                <p className="
                  border-t border-white/[0.07] pt-3
                  font-body text-[12px] text-muted
                ">
                  No check-ins recorded today.
                </p>
              )}
            </div>
          </section>

          {/* ==================================================
              2. PENDING APPROVALS
          ================================================== */}

          <section className={PANEL_CLASS}>
            <CardHeader
              title="Pending Approvals"
              subtitle={
                `${pendingApprovalsCount} requests awaiting action`
              }
              actionLabel="View All"
              onAction={() =>
                navigate('/team-lead/approvals')
              }
            />

            <div className="mt-2 flex flex-1 flex-col">

              {pendingApprovals.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  message="No pending Team Lead approvals."
                />
              ) : (
                <div className="divide-y divide-white/[0.07]">

                  {pendingApprovals.slice(0, 3).map(approval => (
                    <div
                      key={approval.id}
                      className="space-y-3 py-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={approval.employeeName}
                          size="sm"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="
                            truncate font-body
                            text-[14px] font-medium text-ink
                          ">
                            {approval.employeeName}
                          </p>

                          <p className="
                            mt-1 font-body text-[12px]
                            leading-relaxed text-muted
                          ">
                            {approval.requestType}
                            {' · '}

                            {approval.fromDate &&
                              approval.toDate

                                ? formatDateRange(
                                    approval.fromDate,
                                    approval.toDate
                                  )

                                : approval.fromDate

                                  ? formatDate(approval.fromDate)

                                  : 'Date unavailable'}
                          </p>
                        </div>
                      </div>

                      {/* APPROVAL ACTIONS */}

                      <div className="
                        flex flex-wrap items-center
                        gap-2 pl-10
                      ">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() =>
                            setDirectDecision({
                              approval,
                              action: 'approved'
                            })
                          }
                          className={`
                            ${SMALL_ACTION}
                            text-accent
                            hover:brightness-110
                          `}
                          style={{
                            backgroundColor:
                              'rgba(110,231,208,0.15)'
                          }}
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() =>
                            setDirectDecision({
                              approval,
                              action: 'rejected'
                            })
                          }
                          className={`
                            ${SMALL_ACTION}
                            border text-bad
                            hover:bg-white/[0.04]
                          `}
                          style={{
                            borderColor:
                              'rgba(253,164,175,0.20)'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingHRCount > 0 && (
                <div
                  className="
                    mt-3 rounded-lg border p-3
                    font-body text-[12px] text-warn
                  "
                  style={{
                    backgroundColor:
                      'rgba(252,211,77,0.10)',

                    borderColor:
                      'rgba(252,211,77,0.15)'
                  }}
                >
                  {pendingHRCount}

                  {' '}leave request

                  {pendingHRCount === 1 ? '' : 's'}

                  {' '}awaiting HR review.
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              3. WEEKLY ATTENDANCE TREND
          ================================================== */}

          <section className={PANEL_CLASS}>
            <CardHeader
              title="Weekly Attendance Trend"
              subtitle="Recorded attendance over the last 7 days"
              actionLabel="Details"
              onAction={() =>
                navigate('/team-lead/team-attendance')
              }
            />

            <div className="
              mt-4 flex flex-1 flex-col
              justify-center min-w-0
            ">

              {weeklyAttendance.length > 1 ? (
                <SparkLineChart
                  data={weeklyAttendance.map(
                    point => point.percentage
                  )}
                  labels={weeklyAttendance.map(
                    point => point.label
                  )}
                  height={190}
                  minVal={0}
                  maxVal={100}
                  title="Recorded Attendance"
                  unit="%"
                />
              ) : weeklyAttendance.length === 1 ? (
                <div className="
                  flex min-h-[180px]
                  flex-col items-center justify-center
                  gap-3 text-center
                ">
                  <span className={`
                    ${METRIC_NUMBER}
                    text-accent
                  `}>
                    {weeklyAttendance[0].percentage}%
                  </span>

                  <span className="font-data text-[14px] text-ink">
                    {weeklyAttendance[0].label}
                  </span>

                  <p className="font-body text-[12px] text-muted">
                    Only one recorded attendance day available.
                  </p>
                </div>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  message="No attendance history available."
                />
              )}
            </div>

            <div className="
              mt-3 border-t border-white/[0.07]
              pt-3 font-body text-[12px] text-muted
            ">
              Days without saved records are excluded.
            </div>
          </section>

          {/* ==================================================
              4. TEAM MEMBERS
          ================================================== */}

          <section className={PANEL_CLASS}>
            <CardHeader
              title="Team Members"
              subtitle={
                `Showing up to 3 of ${totalMembers} members`
              }
              actionLabel="Full Roster"
              onAction={() =>
                navigate('/team-lead/team')
              }
            />

            <div className="mt-2 flex flex-1 flex-col">

              {!attendanceMembers.length && (
                <EmptyState
                  icon={Users}
                  message="No team members available."
                />
              )}

              <div className="divide-y divide-white/[0.07]">

                {attendanceMembers.slice(0, 3).map(member => (
                  <button
                    type="button"
                    key={getMemberId(member)}
                    onClick={() =>
                      navigate('/team-lead/team')
                    }
                    className="
                      flex w-full flex-wrap
                      items-center justify-between
                      gap-2 py-4 text-left
                      transition hover:bg-white/[0.03]
                    "
                  >
                    <div className="
                      flex min-w-0 flex-1
                      items-center gap-3
                    ">
                      <Avatar
                        name={member.name}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="
                          block truncate
                          font-body text-[14px]
                          font-medium text-ink
                        ">
                          {member.name}
                        </span>

                        <span className="
                          mt-1 block truncate
                          font-body text-[12px]
                          text-muted
                        ">
                          {member.designation}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {member.attendanceStatus === 'present' ? (
                        <span className="
                          rounded-md bg-good/10
                          px-2.5 py-1.5
                          font-body text-[11px]
                          font-medium text-good
                        ">
                          Present
                        </span>
                      ) : (
                        <StatusBadge
                          status={member.attendanceStatus}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ==================================================
              5. BIRTHDAYS AND HOLIDAYS
          ================================================== */}

          <section className={PANEL_CLASS}>

            <CardHeader
              title="Leave Calendar"
              subtitle="Current and upcoming approved leaves"
              actionLabel="View Calendar"
              onAction={() =>
                navigate('/team-lead/team-calendar')
              }
            />

            <div className="mt-3 flex flex-1 flex-col">

              {(() => {

                const todayDate = new Date();

                const todayKey = [
                  todayDate.getFullYear(),
                  String(
                    todayDate.getMonth() + 1
                  ).padStart(2, '0'),
                  String(
                    todayDate.getDate()
                  ).padStart(2, '0')
                ].join('-');

                const authorizedIds = new Set(
                  (Array.isArray(teamMembers)
                    ? teamMembers
                    : []
                  ).flatMap(member =>
                    [
                      member.id,
                      member.employeeId,
                      member.userId
                    ]
                      .filter(Boolean)
                      .map(normalize)
                  )
                );

                const upcomingLeaves = (
                  Array.isArray(approvals)
                    ? approvals
                    : []
                )
                  .filter(request => {

                    const start = String(
                      request.fromDate || ''
                    ).slice(0, 10);

                    const end = String(
                      request.toDate ||
                      request.fromDate ||
                      ''
                    ).slice(0, 10);

                    return (
                      request.category === 'Leave Approval' &&
                      normalize(request.status) === 'approved' &&
                      authorizedIds.has(
                        normalize(request.employeeId)
                      ) &&
                      /^\d{4}-\d{2}-\d{2}$/.test(start) &&
                      /^\d{4}-\d{2}-\d{2}$/.test(end) &&
                      end >= start &&
                      end >= todayKey
                    );

                  })
                  .sort((left, right) =>
                    String(left.fromDate).localeCompare(
                      String(right.fromDate)
                    )
                  );

                if (!upcomingLeaves.length) {
                  return (
                    <EmptyState
                      icon={CalendarDays}
                      message="No current or upcoming approved leaves."
                    />
                  );
                }

                return (
                  <>
                    <div className="
                      divide-y divide-white/[0.07]
                    ">

                      {upcomingLeaves
                        .slice(0, 4)
                        .map(request => (

                        <div
                          key={request.id}
                          className="
                            flex flex-wrap
                            items-center
                            justify-between
                            gap-3 py-4
                          "
                        >

                          <div className="
                            flex min-w-0
                            items-center gap-3
                          ">

                            <div className="
                              flex h-10 w-10
                              shrink-0 items-center
                              justify-center
                              rounded-xl bg-accent/10
                            ">
                              <Calendar
                                size={19}
                                className="text-accent"
                              />
                            </div>

                            <div className="min-w-0">

                              <p className="
                                font-body text-[14px]
                                font-medium text-ink
                              ">
                                {request.employeeName ||
                                  'Team Member'}
                              </p>

                              <p className="
                                mt-1 font-body
                                text-[12px] text-muted
                              ">
                                {request.requestType ||
                                  'Approved Leave'}
                              </p>

                              <p className="
                                mt-1 font-data
                                text-[11px] text-muted
                              ">
                                {formatDate(request.fromDate)}

                                {' - '}

                                {formatDate(
                                  request.toDate ||
                                  request.fromDate
                                )}
                              </p>

                            </div>

                          </div>

                          <span className="
                            px-2.5 py-1 rounded-lg
                            bg-good/10 text-good
                            text-[11px] font-medium
                          ">
                            Approved
                          </span>

                        </div>

                      ))}

                    </div>

                    {upcomingLeaves.length > 4 && (

                      <button
                        type="button"
                        onClick={() =>
                          navigate('/team-lead/team-calendar')
                        }
                        className="
                          mt-3 text-left
                          text-xs font-semibold
                          text-accent hover:underline
                        "
                      >
                        View all {upcomingLeaves.length} leave requests
                      </button>

                    )}

                  </>
                );

              })()}

            </div>

          </section>

          <section className={PANEL_CLASS}>
            <CardHeader
              title="Birthdays & Holidays"
              subtitle="Team celebrations and upcoming events"
            >
              <span className="
                shrink-0 font-data text-[11px]
                font-normal text-muted
              ">
                {monthLabel}
              </span>
            </CardHeader>

            <div className="mt-2 flex flex-1 flex-col">

              {upcomingBirthdays.length === 0 &&
                upcomingHolidays.length === 0 && (
                <EmptyState
                  icon={CalendarDays}
                  message="No configured birthdays or upcoming holidays available."
                />
              )}

              <div className="divide-y divide-white/[0.07]">

                {upcomingBirthdays.map((birthday, index) => (
                  <div
                    key={`${birthday.name}-${index}`}
                    className="
                      flex items-center justify-between
                      gap-3 py-4
                    "
                  >
                    <div className="
                      flex min-w-0 flex-1
                      items-center gap-3
                    ">
                      <div
                        className="
                          flex h-10 w-10 shrink-0
                          items-center justify-center
                          rounded-xl
                        "
                        style={{
                          backgroundColor:
                            'rgba(155,140,255,0.10)'
                        }}
                      >
                        <Gift
                          size={20}
                          strokeWidth={1.7}
                          className="text-accent2"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="
                          truncate font-body text-[14px]
                          font-medium text-ink
                        ">
                          {birthday.name}
                        </p>

                        <p className="
                          mt-1 truncate font-body
                          text-[12px] text-muted
                        ">
                          {birthday.designation || 'Birthday'}
                        </p>
                      </div>
                    </div>

                    <span className="
                      shrink-0 font-data text-[12px]
                      font-bold text-accent2
                    ">
                      {birthday.date}
                    </span>
                  </div>
                ))}

                {upcomingHolidays.map((holiday, index) => (
                  <div
                    key={`${holiday.name}-${index}`}
                    className="
                      flex items-center justify-between
                      gap-3 py-4
                    "
                  >
                    <div className="
                      flex min-w-0 flex-1
                      items-center gap-3
                    ">
                      <div className="
                        flex h-10 w-10 shrink-0
                        items-center justify-center
                        rounded-xl bg-warn/10
                      ">
                        <CalendarDays
                          size={20}
                          strokeWidth={1.7}
                          className="text-warn"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="
                          truncate font-body text-[14px]
                          font-medium text-ink
                        ">
                          {holiday.name}
                        </p>

                        <p className="
                          mt-1 truncate font-body
                          text-[12px] text-muted
                        ">
                          {holiday.type || 'Holiday'}
                        </p>
                      </div>
                    </div>

                    <span className="
                      shrink-0 font-data text-[12px]
                      font-bold text-warn
                    ">
                      {formatDate(holiday.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================================================
              6. RECENT TEAM ACTIVITIES
          ================================================== */}

          <section className={PANEL_CLASS}>
            <CardHeader
              title="Recent Team Activities"
              subtitle="Latest available team updates"
            >
              <Clock
                size={18}
                strokeWidth={1.7}
                className="text-muted"
              />
            </CardHeader>

            <div className="mt-2 flex flex-1 flex-col">

              {!visibleActivities.length && (
                <EmptyState
                  icon={Clock}
                  message="No recent team activities."
                />
              )}

              <div className="divide-y divide-white/[0.07]">

                {visibleActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-4"
                  >
                    <span className="
                      mt-2 h-2 w-2 shrink-0
                      rounded-full bg-accent
                    " />

                    <div className="min-w-0 flex-1">

                      <div className="
                        flex flex-wrap items-center
                        justify-between gap-2
                      ">
                        <span className="
                          min-w-0 font-body text-[14px]
                          font-medium text-ink
                        ">
                          {activity.user}
                        </span>

                        <span className="
                          shrink-0 font-data
                          text-[11px] text-muted
                        ">
                          {activity.time || 'Recent'}
                        </span>
                      </div>

                      <p
                        className="
                          mt-1.5 break-words
                          font-body text-[13px]
                          leading-relaxed text-muted
                        "
                        title={activity.action}
                      >
                        {activity.action}
                      </p>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* ====================================================
          APPROVAL COMMENT MODAL
      ==================================================== */}

      <ApprovalCommentModal
        isOpen={Boolean(directDecision)}
        approval={directDecision?.approval}
        action={directDecision?.action}
        isSubmitting={isSubmitting}

        onClose={() => {
          if (!isSubmitting) {
            setDirectDecision(null);
          }
        }}

        onConfirm={handleApprovalDecision}
      />
    </div>
  );
};

// ============================================================
// ROLE-BASED DASHBOARD
// ============================================================

export const Dashboard = () => {
  const outletContext =
    useOutletContext() || {};

  const activeRole =
    outletContext.activeRole;

  if (activeRole === 'employee') {
    return (
      <Navigate
        to="/team-lead/employee/personal-information"
        replace
      />
    );
  }

  if (
    ![
      'team-lead',
      'manager',
      'super-admin'
    ].includes(activeRole)
  ) {
    return (
      <div className="glass-card !p-8 text-center space-y-3">
        <AlertCircle
          size={32}
          className="mx-auto text-bad"
        />

        <h3 className="font-body text-[18px] font-medium text-ink">
          Access Restricted
        </h3>

        <p className="font-body text-[14px] text-muted">
          You do not have permission to access this dashboard.
        </p>
      </div>
    );
  }

  return <TeamLeadDashboard />;
};

export default Dashboard;