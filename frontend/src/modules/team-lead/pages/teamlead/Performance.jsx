import React, { useMemo, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';

import { FeedbackModal } from '../../components/modals/FeedbackModal.jsx';
import { ModalPortal } from '../../components/common/ModalPortal.jsx';
import { teamPerformanceScore } from '../../data/mockData.js';
import { readStorage, writeStorage } from '../../utils/storage.js';
import { canReviewPerformance, userIdOf, getScopedTeamMembers } from '../../utils/dataScope.js';

import {
  Star,
  Calendar,
  Plus,
  X,
  Download,
  FileDown,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  Edit,
  Target,
  MessageSquare,
  Clock,
  CheckCircle,
  Trash2
} from 'lucide-react';


// ============================================================
// STORAGE CONFIGURATION
// ============================================================

const STORAGE_KEYS = {
  FEEDBACK: 'technomold_teamlead_feedback',
  GOALS: 'technomold_teamlead_employee_goals',
  REVIEWS: 'technomold_teamlead_scheduled_reviews'
};

const PERIOD_OPTIONS = [
  { label: 'Monthly', months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: 'Yearly', months: 12 }
];

const TREND_DATES = {
  'Sprint 40': '2026-09-28',
  'Sprint 41': '2026-10-05',
  'Sprint 42': '2026-10-12',
  'Sprint 43': '2026-10-19',
  'Sprint 44': '2026-10-26',
  'Sprint 45': '2026-11-02',
  Current: '2026-11-09'
};

const performanceTrend = teamPerformanceScore.trendData
  .map(point => ({
    ...point,
    date: point.date || TREND_DATES[point.label]
  }))
  .filter(point =>
    point.date &&
    point.score != null &&
    point.score !== '' &&
    Number.isFinite(Number(point.score)) &&
    Number(point.score) >= 0 &&
    Number(point.score) <= 100
  );


// ============================================================
// DATE HELPERS
// ============================================================

const formatDateInput = date => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  const year = value.getFullYear();

  const month = String(
    value.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    value.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getPresetRange = preset => {
  const months =
    PERIOD_OPTIONS.find(
      option => option.label === preset
    )?.months || 3;

  const end = new Date();
  const start = new Date(end);
  const dayOfMonth = start.getDate();

  start.setDate(1);
  start.setMonth(start.getMonth() - months);

  start.setDate(
    Math.min(
      dayOfMonth,
      new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      ).getDate()
    )
  );

  return {
    from: formatDateInput(start),
    to: formatDateInput(end)
  };
};

const getReviewCycleRange = reviewCycle => {
  const match = String(
    reviewCycle || ''
  ).match(/Q([1-4])\s+FY\s+(\d{4})/i);

  if (!match) return null;

  const quarter = Number(match[1]);
  const fiscalYear = Number(match[2]);

  const start = new Date(
    fiscalYear,
    3 + (quarter - 1) * 3,
    1
  );

  const end = new Date(
    fiscalYear,
    3 + quarter * 3,
    0
  );

  return {
    from: formatDateInput(start),
    to: formatDateInput(end)
  };
};

const formatDisplayDate = value => {
  if (!value) return '—';

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? `${value}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatRangeLabel = ({ from, to }) =>
  `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`;

const formatMeetingTime = value => {
  if (!value) return '—';

  const [hours, minutes] =
    String(value).split(':').map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return value;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getTomorrow = () => {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return formatDateInput(date);
};


// ============================================================
// STORAGE HELPERS
// ============================================================

const readList = (key, fallback = []) => {
  const data = readStorage(key, fallback);

  return Array.isArray(data)
    ? data
    : fallback;
};

const readGoals = () => {
  const data = readStorage(
    STORAGE_KEYS.GOALS,
    {}
  );

  return data &&
    typeof data === 'object' &&
    !Array.isArray(data)
      ? data
      : {};
};

const saveData = (key, value) => {
  if (!writeStorage(key, value)) {
    throw new Error(
      'Unable to save data in browser storage.'
    );
  }
};

const sameId = (first, second) =>
  Boolean(String(first ?? '').trim()) &&
  String(first ?? '').trim().toLowerCase() ===
  String(second ?? '').trim().toLowerCase();

const makeId = prefix =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

const getMemberId = member =>
  member?.id ||
  member?.employeeId ||
  member?.userId ||
  '';

const safeArray = value =>
  Array.isArray(value) ? value : [];

const normalizeId = value =>
  String(value ?? '').trim().toLowerCase();


// ============================================================
// CSV EXPORT HELPERS
// ============================================================

const escapeCsvValue = value => {
  let text = String(value ?? '');

  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replaceAll('"', '""')}"`;
};

const exportCSV = (filename, rows) => {
  const csv = '\uFEFF' + rows
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\r\n');

  const blob = new Blob(
    [csv],
    { type: 'text/csv;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
};


// ============================================================
// MAIN PERFORMANCE COMPONENT
// ============================================================

const PerformanceTrendChart = ({ points }) => {
  const gradientId = React.useId();

  const width = 700;
  const height = 230;

  const left = 48;
  const right = 35;
  const top = 30;
  const bottom = 30;

  const ticks = [0, 25, 50, 75, 100];

  const getX = index =>
    points.length <= 1
      ? width / 2
      : left + index *
        (width - left - right) /
        (points.length - 1);

  const getY = value =>
    top + (100 - Number(value)) *
    (height - top - bottom) / 100;

  const coordinates = points.map((point, index) => ({
    x: getX(index),
    y: getY(point.score),
    score: Number(point.score),
    label: formatDisplayDate(point.date)
  }));

  if (!coordinates.length) return null;

  const line = coordinates.map((point, index) =>
    `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`
  ).join(' ');

  const last = coordinates[coordinates.length - 1];

  const area = `${line} L${last.x} ${height - bottom}
    L${coordinates[0].x} ${height - bottom} Z`;

  return (
    <div className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full h-auto select-none"
        role="img"
        aria-label={`Team performance trend. Latest score ${last.score}%`}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--accent)"
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor="var(--accent)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {ticks.map(value => (
          <g key={value}>
            <line
              x1={left}
              x2={width - right}
              y1={getY(value)}
              y2={getY(value)}
              stroke="var(--line)"
              strokeDasharray="4 5"
              strokeWidth="1"
            />

            <text
              x={left - 10}
              y={getY(value)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--muted)"
              fontSize="12"
              style={{
                fontFamily: 'Calibri, Arial, sans-serif'
              }}
            >
              {value}%
            </text>
          </g>
        ))}

        <path
          d={area}
          fill={`url(#${gradientId})`}
        />

        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coordinates.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="var(--accent)"
            >
              <title>
                {point.label}: {point.score}%
              </title>
            </circle>

            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="12"
              style={{
                fontFamily: 'Calibri, Arial, sans-serif'
              }}
            >
              {point.label.split(' ').slice(0, 2).join(' ')}
            </text>
          </g>
        ))}

        <circle
          cx={last.x}
          cy={last.y}
          r="7"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
        />

        <text
          x={last.x}
          y={last.y - 13}
          textAnchor="middle"
          fill="var(--ink)"
          fontSize="14"
          fontWeight="700"
          style={{
            fontFamily: 'Calibri, Arial, sans-serif'
          }}
        >
          {last.score}%
        </text>
      </svg>
    </div>
  );
};

export const Performance = () => {

  const {
    currentUser,
    teamMembers: contextMembers = [],
    globalSearchTerm = '',
    triggerToast
  } = useTeamLead();

  const canEdit =
    canReviewPerformance(currentUser);

  const teamMembers = useMemo(
    () => getScopedTeamMembers(
      currentUser,
      safeArray(contextMembers)
    ),
    [currentUser, contextMembers]
  );

  const userId = userIdOf(currentUser);

  const [activeTab, setActiveTab] =
    useState('scorecards');

  const [isFeedbackOpen, setIsFeedbackOpen] =
    useState(false);

  const [
    selectedMemberForFeedback,
    setSelectedMemberForFeedback
  ] = useState(null);

  const [feedbackModalKey, setFeedbackModalKey] =
    useState(0);

  const [
    isPeriodFilterOpen,
    setIsPeriodFilterOpen
  ] = useState(false);

  const [selectedPreset, setSelectedPreset] =
    useState('3 Months');

  const [draftRange, setDraftRange] =
    useState(() => getPresetRange('3 Months'));

  const [appliedRange, setAppliedRange] =
    useState(() => getPresetRange('3 Months'));

  const [searchTerm, setSearchTerm] =
    useState('');

  const [feedbackEmployee, setFeedbackEmployee] =
    useState('all');

  const [reviewFilter, setReviewFilter] =
    useState('all');

  const [feedbackList, setFeedbackList] =
    useState(() =>
      readList(
        STORAGE_KEYS.FEEDBACK,
        teamPerformanceScore.recentFeedback
      )
    );

  const [goalOverrides, setGoalOverrides] =
    useState(readGoals);

  const [scheduledReviews, setScheduledReviews] =
    useState(() =>
      readList(STORAGE_KEYS.REVIEWS)
    );

  const [goalModalOpen, setGoalModalOpen] =
    useState(false);

  const [goalData, setGoalData] =
    useState({
      employeeId: '',
      progress: 0,
      comment: ''
    });

  const [scheduleModalOpen, setScheduleModalOpen] =
    useState(false);

  const [scheduleData, setScheduleData] =
    useState({
      employeeId: '',
      date: getTomorrow(),
      time: '11:00',
      agenda: ''
    });

  const [deleteReviewId, setDeleteReviewId] =
    useState(null);

  const [historyEmployeeId, setHistoryEmployeeId] =
    useState(null);

  const [reschedulingReviewId, setReschedulingReviewId] =
    useState(null);


  // ==========================================================
  // AUTHORIZED EMPLOYEES
  // ==========================================================

  useEffect(() => {
    const refreshPerformanceData = () => {
      setFeedbackList(
        readList(
          STORAGE_KEYS.FEEDBACK,
          safeArray(teamPerformanceScore.recentFeedback)
        )
      );

      setGoalOverrides(readGoals());

      setScheduledReviews(
        readList(STORAGE_KEYS.REVIEWS)
      );
    };

    const handleStorage = event => {
      if (
        event.key === null ||
        Object.values(STORAGE_KEYS).includes(event.key)
      ) {
        refreshPerformanceData();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshPerformanceData();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', refreshPerformanceData);

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', refreshPerformanceData);

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, []);

  useEffect(() => {
    setHistoryEmployeeId(null);
    setReschedulingReviewId(null);
    setDeleteReviewId(null);
    setGoalModalOpen(false);
    setScheduleModalOpen(false);
    setIsFeedbackOpen(false);
    setSelectedMemberForFeedback(null);
    setFeedbackEmployee('all');
    setReviewFilter('all');
  }, [userId, canEdit]);

  const allowedEmployeeIds = useMemo(
    () => new Set(
      teamMembers.flatMap(member =>
        [
          member.id,
          member.employeeId,
          member.userId
        ].map(normalizeId).filter(Boolean)
      )
    ),
    [teamMembers]
  );

  const findMember = employeeId =>
    teamMembers.find(member =>
      [
        member.id,
        member.employeeId,
        member.userId
      ].some(id => sameId(id, employeeId))
    );

  const effectiveSearch = String(
    searchTerm || globalSearchTerm || ''
  ).trim().toLowerCase();


  // ==========================================================
  // EMPLOYEE GOAL PROGRESS
  // ==========================================================

  const updatedTeamMembers = useMemo(() => {
    return teamMembers.map(member => {

      const employeeId =
        String(getMemberId(member));

      const savedGoal =
        goalOverrides[employeeId];

      return {
        ...member,

        goalsProgress:
          savedGoal?.progress ??
          member.goalsProgress,

        goalUpdatedAt:
          savedGoal?.updatedAt,

        goalComment:
          savedGoal?.comment
      };
    });
  }, [
    teamMembers,
    goalOverrides
  ]);


  // ==========================================================
  // FILTERED PERFORMANCE DATA
  // ==========================================================

  const filteredTrend = useMemo(
    () => sameId(userId, 'TL-1042')
      ? performanceTrend.filter(point =>
      point.date >= appliedRange.from &&
      point.date <= appliedRange.to
      )
      : [],
    [appliedRange, userId]
  );

  const filteredTeamMembers = useMemo(() => {
    return updatedTeamMembers.filter(member => {

      const cycle = getReviewCycleRange(
        member.reviewCycle
      );

      const matchPeriod =
        !cycle ||
        (
          cycle.from <= appliedRange.to &&
          cycle.to >= appliedRange.from
        );

      const matchSearch = [
        member.name,
        getMemberId(member),
        member.designation
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(effectiveSearch)
      );

      return matchPeriod && matchSearch;
    });
  }, [
    updatedTeamMembers,
    appliedRange,
    effectiveSearch
  ]);

  const periodScore = filteredTrend.length
    ? (
        filteredTrend.reduce(
          (sum, point) =>
            sum + Number(point.score),
          0
        ) / filteredTrend.length
      ).toFixed(1)
    : null;

  const velocityAvailable =
    filteredTrend.some(
      point => point.label === 'Current'
    );

  const periodRangeLabel =
    formatRangeLabel(appliedRange);


  // ==========================================================
  // FILTERED FEEDBACK HISTORY
  // ==========================================================

  const visibleFeedback = useMemo(() => {
    return feedbackList.filter(item =>
      allowedEmployeeIds.has(normalizeId(item.employeeId))
    );
  }, [
    feedbackList,
    allowedEmployeeIds
  ]);

  const filteredFeedback = useMemo(() => {
    return visibleFeedback.filter(item => {

      const matchEmployee =
        feedbackEmployee === 'all' ||
        sameId(
          item.employeeId,
          feedbackEmployee
        );

      const feedbackDate = formatDateInput(
        item.createdAt || item.date
      );

      const matchDate =
        Boolean(feedbackDate) &&
        feedbackDate >= appliedRange.from &&
        feedbackDate <= appliedRange.to;

      const matchSearch = [
        item.employeeName,
        item.type,
        item.content,
        item.giver
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(effectiveSearch)
      );

      return (
        matchEmployee &&
        matchDate &&
        matchSearch
      );
    });
  }, [
    visibleFeedback,
    feedbackEmployee,
    appliedRange,
    effectiveSearch
  ]);


  // ==========================================================
  // FILTERED REVIEW SCHEDULES
  // ==========================================================

  const visibleReviews = useMemo(() => {
    return scheduledReviews.filter(review =>
      allowedEmployeeIds.has(normalizeId(review.employeeId))
    );
  }, [
    scheduledReviews,
    allowedEmployeeIds
  ]);

  const filteredReviews = useMemo(() => {
    return visibleReviews.filter(review => {

      const matchStatus =
        reviewFilter === 'all' ||
        review.status === reviewFilter;

      const matchSearch = [
        review.employeeName,
        review.agenda,
        review.status
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(effectiveSearch)
      );

      return matchStatus && matchSearch;

    }).sort((first, second) =>
      `${first.date}T${first.time}`
        .localeCompare(
          `${second.date}T${second.time}`
        )
    );
  }, [
    visibleReviews,
    reviewFilter,
    effectiveSearch
  ]);

  const historyMember =
    findMember(historyEmployeeId) || null;

  const historyFeedback = historyMember
    ? visibleFeedback.filter(item =>
        [
          historyMember.id,
          historyMember.employeeId,
          historyMember.userId
        ].some(id => sameId(id, item.employeeId))
      ).sort((first, second) =>
        new Date(second.createdAt || second.date || 0) -
        new Date(first.createdAt || first.date || 0)
      )
    : [];

  const historyGoalRecord =
    historyMember
      ? goalOverrides[String(getMemberId(historyMember))]
      : null;

  const historyGoals =
    safeArray(historyGoalRecord?.history);

  const historyReviews = historyMember
    ? visibleReviews.filter(item =>
        [
          historyMember.id,
          historyMember.employeeId,
          historyMember.userId
        ].some(id => sameId(id, item.employeeId))
      ).sort((first, second) =>
        `${second.date}T${second.time}`
          .localeCompare(`${first.date}T${first.time}`)
      )
    : [];

  const openPerformanceHistory = member => {
    if (
      !canEdit ||
      !findMember(getMemberId(member))
    ) {
      return;
    }

    setHistoryEmployeeId(getMemberId(member));
  };

  const pendingReviews = visibleReviews.filter(
    review => review.status === 'Scheduled'
  ).length;


  // ==========================================================
  // AVERAGE GOAL PROGRESS
  // ==========================================================

  const validGoalMembers =
    filteredTeamMembers.filter(member =>
      member.goalsProgress != null &&
      Number.isFinite(
        Number(member.goalsProgress)
      )
    );

  const averageGoalProgress =
    validGoalMembers.length
      ? Math.round(
          validGoalMembers.reduce(
            (total, member) =>
              total + Number(member.goalsProgress),
            0
          ) / validGoalMembers.length
        )
      : null;


  // ==========================================================
  // PERIOD FILTER
  // ==========================================================

  const applyCustomRange = () => {
    if (
      !draftRange.from ||
      !draftRange.to ||
      draftRange.from > draftRange.to
    ) {
      triggerToast(
        'Choose a valid date range with From on or before To.',
        'warn'
      );

      return;
    }

    setAppliedRange({ ...draftRange });
    setSelectedPreset(null);
  };

  const selectPreset = preset => {
    const range = getPresetRange(preset);

    setSelectedPreset(preset);
    setDraftRange(range);
    setAppliedRange(range);
  };

  const resetRange = () =>
    selectPreset('3 Months');


  // ==========================================================
  // ADD FEEDBACK
  // ==========================================================

  const openFeedbackModal = member => {

    if (!canEdit) return;

    if (!teamMembers.length) {
      triggerToast(
        'No authorized employees available.',
        'warn'
      );

      return;
    }

    setSelectedMemberForFeedback(
      member || null
    );

    setFeedbackModalKey(
      previous => previous + 1
    );

    setIsFeedbackOpen(true);
  };

  const handleAddFeedback = newFeedback => {

    if (!canEdit) {
      triggerToast(
        'You do not have permission to add feedback.',
        'error'
      );

      return false;
    }

    const employee = findMember(
      newFeedback.employeeId
    );

    if (!employee) {
      triggerToast(
        'Select a valid team member.',
        'warn'
      );

      return false;
    }

    const content = String(
      newFeedback.content || ''
    ).trim();

    const rating = Number(
      newFeedback.rating
    );

    if (!content || content.length > 1000) {
      triggerToast(
        'Feedback remarks are required (maximum 1000 characters).',
        'warn'
      );

      return false;
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      triggerToast(
        'Rating must be between 1 and 5.',
        'warn'
      );

      return false;
    }

    const entry = {
      id: makeId('FB'),

      employeeId:
        getMemberId(employee),

      employeeName:
        employee.name,

      rating,

      type:
        newFeedback.type ||
        'Quarterly Review Note',

      content,

      giver:
        currentUser?.name ||
        'Team Lead',

      giverId: userId,

      date: formatDisplayDate(
        new Date()
      ),

      createdAt:
        new Date().toISOString()
    };

    try {

      const currentFeedback = readList(
        STORAGE_KEYS.FEEDBACK,
        teamPerformanceScore.recentFeedback
      );

      const updated = [
        entry,
        ...currentFeedback
      ];

      saveData(
        STORAGE_KEYS.FEEDBACK,
        updated
      );

      setFeedbackList(updated);

      setActiveTab('feedback');
      setFeedbackEmployee('all');
      setSearchTerm('');

      triggerToast(
        `Performance feedback saved for ${employee.name}`,
        'good'
      );

      return true;

    } catch (error) {

      triggerToast(
        error.message ||
        'Unable to save performance feedback.',
        'error'
      );

      return false;
    }
  };


  // ==========================================================
  // EDIT GOAL PROGRESS
  // ==========================================================

  const openGoalModal = member => {

    if (!canEdit) return;

    setGoalData({
      employeeId:
        getMemberId(member),

      progress:
        member.goalsProgress ?? 0,

      comment:
        member.goalComment || ''
    });

    setGoalModalOpen(true);
  };

  const handleGoalSubmit = event => {

    event.preventDefault();

    if (!canEdit) return;

    const member = findMember(
      goalData.employeeId
    );

    if (!member) {
      triggerToast(
        'Invalid employee selection.',
        'error'
      );

      return;
    }

    const progress = Number(
      goalData.progress
    );

    if (
      goalData.progress === '' ||
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      triggerToast(
        'Goal progress must be between 0 and 100.',
        'warn'
      );

      return;
    }

    try {

      const currentGoals = readGoals();

      const employeeId = String(
        getMemberId(member)
      );

      const existingGoal =
        currentGoals[employeeId];

      const previousProgress =
        existingGoal?.progress ??
        member.goalsProgress ??
        null;

      const cleanComment =
        String(goalData.comment || '').trim();

      if (cleanComment.length > 500) {
        throw new Error(
          'Goal remarks cannot exceed 500 characters.'
        );
      }

      const timestamp =
        new Date().toISOString();

      const historyEntry = {
        id: makeId('GOAL-HIST'),
        employeeId,
        previousProgress,
        progress,
        comment: cleanComment,
        updatedAt: timestamp,
        updatedBy: currentUser?.name,
        updatedById: userId
      };

      const updated = {
        ...currentGoals,

        [employeeId]: {
          ...existingGoal,

          history: [
            historyEntry,
            ...safeArray(existingGoal?.history)
          ],
          progress,

          previousProgress,

          comment:
            String(goalData.comment || '')
              .trim(),

          updatedAt:
            new Date().toISOString(),

          updatedBy:
            currentUser?.name,

          updatedById:
            userId
        }
      };

      saveData(
        STORAGE_KEYS.GOALS,
        updated
      );

      setGoalOverrides(updated);

      setGoalModalOpen(false);

      triggerToast(
        `Goal progress updated to ${progress}% for ${member.name}`,
        'good'
      );

    } catch (error) {

      triggerToast(
        error.message ||
        'Unable to save goal progress.',
        'error'
      );

    }
  };


  // ==========================================================
  // SCHEDULE PERFORMANCE REVIEW
  // ==========================================================

  const openRescheduleModal = review => {
    if (
      !canEdit ||
      !findMember(review.employeeId) ||
      review.status !== 'Scheduled'
    ) {
      return;
    }

    const latest = readList(STORAGE_KEYS.REVIEWS)
      .find(item => sameId(item.id, review.id));

    if (
      !latest ||
      latest.status !== 'Scheduled'
    ) {
      triggerToast(
        'This review is no longer available for rescheduling.',
        'warn'
      );

      return;
    }

    setReschedulingReviewId(latest.id);

    setScheduleData({
      employeeId: latest.employeeId,
      date: latest.date,
      time: latest.time,
      agenda: latest.agenda || ''
    });

    setScheduleModalOpen(true);
  };

  const openScheduleModal = () => {
    setReschedulingReviewId(null);

    if (!canEdit) return;

    if (!teamMembers.length) {
      triggerToast(
        'No authorized employees available.',
        'warn'
      );

      return;
    }

    setScheduleData({
      employeeId:
        getMemberId(teamMembers[0]),

      date: getTomorrow(),

      time: '11:00',

      agenda:
        'Performance review and goal alignment'
    });

    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = event => {

    event.preventDefault();

    if (!canEdit) return;

    const employee = findMember(
      scheduleData.employeeId
    );

    if (!employee) {
      triggerToast(
        'Select a valid employee.',
        'warn'
      );

      return;
    }

    const agenda = String(
      scheduleData.agenda || ''
    ).trim();

    if (
      !scheduleData.date ||
      !scheduleData.time ||
      !agenda ||
      agenda.length > 500
    ) {
      triggerToast(
        'Complete all review fields.',
        'warn'
      );

      return;
    }

    const meetingDate = new Date(
      `${scheduleData.date}T${scheduleData.time}`
    );

    if (
      Number.isNaN(meetingDate.getTime()) ||
      meetingDate.getTime() <= Date.now()
    ) {
      triggerToast(
        'Select a future review date and time.',
        'warn'
      );

      return;
    }

    const currentReviews = readList(
      STORAGE_KEYS.REVIEWS
    );

    const existingReview = reschedulingReviewId
      ? currentReviews.find(item =>
          sameId(item.id, reschedulingReviewId)
        )
      : null;

    if (
      reschedulingReviewId &&
      (
        !existingReview ||
        existingReview.status !== 'Scheduled' ||
        !findMember(existingReview.employeeId) ||
        !sameId(
          existingReview.employeeId,
          scheduleData.employeeId
        )
      )
    ) {
      triggerToast(
        'This review cannot be rescheduled.',
        'error'
      );

      return;
    }

    const duplicate = currentReviews.some(
      review =>
        !sameId(review.id, reschedulingReviewId) &&
        (
          sameId(
            review.employeeId,
            scheduleData.employeeId
          ) ||
          sameId(
            review.scheduledById,
            userId
          )
        ) &&
        review.date === scheduleData.date &&
        review.time === scheduleData.time &&
        review.status === 'Scheduled'
    );

    if (duplicate) {
      triggerToast(
        'This employee or reviewer already has a review at the selected time.',
        'warn'
      );

      return;
    }

    const review = {
      ...(existingReview || {}),

      id: existingReview?.id || makeId('REV'),

      employeeId:
        getMemberId(employee),

      employeeName:
        employee.name,

      designation:
        employee.designation,

      date:
        scheduleData.date,

      time:
        scheduleData.time,

      agenda,

      status: 'Scheduled',

      scheduledBy:
        currentUser?.name,

      scheduledById:
        userId,

      createdAt:
        new Date().toISOString()
    };

    try {

      if (existingReview) {
        review.createdAt =
          existingReview.createdAt;

        review.scheduledBy =
          existingReview.scheduledBy;

        review.scheduledById =
          existingReview.scheduledById;

        review.updatedAt =
          new Date().toISOString();

        review.rescheduledBy =
          currentUser?.name;

        review.rescheduleHistory = [
          {
            id: makeId('RESCHEDULE'),
            previousDate: existingReview.date,
            previousTime: existingReview.time,
            newDate: review.date,
            newTime: review.time,
            updatedAt: review.updatedAt,
            updatedBy: currentUser?.name
          },
          ...safeArray(existingReview.rescheduleHistory)
        ];
      }

      const updated = existingReview
        ? currentReviews.map(item =>
            sameId(item.id, existingReview.id)
              ? review
              : item
          )
        : [review, ...currentReviews];

      saveData(
        STORAGE_KEYS.REVIEWS,
        updated
      );

      setScheduledReviews(updated);

      setScheduleModalOpen(false);
      setReschedulingReviewId(null);
      setActiveTab('reviews');
      setReviewFilter('all');
      setSearchTerm('');

      triggerToast(
        existingReview
          ? `Review rescheduled with ${employee.name}`
          : `Review scheduled with ${employee.name}`,
        'good'
      );

    } catch (error) {

      triggerToast(
        error.message ||
        'Unable to schedule review.',
        'error'
      );

    }
  };


  // ==========================================================
  // REVIEW STATUS MANAGEMENT
  // ==========================================================

  const updateReviewStatus = (
    reviewId,
    status
  ) => {

    if (!canEdit) return;

    if (
      !['Completed', 'Cancelled'].includes(status)
    ) {
      return;
    }

    const review = readList(STORAGE_KEYS.REVIEWS)
      .find(item => sameId(item.id, reviewId));

    if (
      !review ||
      !findMember(review.employeeId)
    ) {
      return;
    }

    if (
      !review ||
      review.status !== 'Scheduled'
    ) {
      return;
    }

    try {

      const currentReviews = readList(
        STORAGE_KEYS.REVIEWS
      );

      const updated = currentReviews.map(
        item => sameId(item.id, reviewId)
          ? {
              ...item,
              status,
              updatedAt:
                new Date().toISOString(),
              updatedBy:
                userId
            }
          : item
      );

      saveData(
        STORAGE_KEYS.REVIEWS,
        updated
      );

      setScheduledReviews(updated);

      triggerToast(
        `Performance review ${status.toLowerCase()}.`,
        status === 'Completed'
          ? 'good'
          : 'warn'
      );

    } catch (error) {

      triggerToast(
        error.message,
        'error'
      );

    }
  };

  const deleteReview = () => {

    if (!canEdit || !deleteReviewId) {
      return;
    }

    const review = readList(STORAGE_KEYS.REVIEWS)
      .find(item => sameId(item.id, deleteReviewId));

    if (
      !review ||
      !findMember(review.employeeId)
    ) {
      setDeleteReviewId(null);
      return;
    }

    if (
      !review ||
      review.status === 'Scheduled'
    ) {
      triggerToast(
        'Cancel the scheduled review before deleting it.',
        'warn'
      );

      setDeleteReviewId(null);
      return;
    }

    try {

      const updated = readList(
        STORAGE_KEYS.REVIEWS
      ).filter(item =>
        !sameId(
          item.id,
          deleteReviewId
        )
      );

      saveData(
        STORAGE_KEYS.REVIEWS,
        updated
      );

      setScheduledReviews(updated);

      setDeleteReviewId(null);

      triggerToast(
        'Review record deleted.',
        'good'
      );

    } catch (error) {

      triggerToast(
        error.message,
        'error'
      );

    }
  };


  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const downloadCsv = () => {

    const rows = [
      [
        'Employee',
        'Employee ID',
        'Designation',
        'Score',
        'Rating',
        'Goals Progress',
        'Review Cycle'
      ],

      ...filteredTeamMembers.map(member => [
        member.name,
        getMemberId(member),
        member.designation,
        member.performanceScore,
        member.rating,
        member.goalsProgress == null
          ? ''
          : `${member.goalsProgress}%`,
        member.reviewCycle
      ])
    ];

    exportCSV(
      `Technomold_Performance_${appliedRange.from}_to_${appliedRange.to}.csv`,
      rows
    );

    triggerToast(
      'Performance CSV download started.',
      'good'
    );
  };


  // ==========================================================
  // FEEDBACK CSV EXPORT
  // ==========================================================

  const downloadFeedbackCsv = () => {

    exportCSV(
      `Performance_Feedback_${appliedRange.from}_${appliedRange.to}.csv`,
      [
        [
          'Employee ID',
          'Employee',
          'Date',
          'Category',
          'Rating',
          'Feedback',
          'Reviewed By'
        ],

        ...filteredFeedback.map(item => [
          item.employeeId,
          item.employeeName,
          item.date,
          item.type,
          item.rating,
          item.content,
          item.giver
        ])
      ]
    );

    triggerToast(
      'Feedback CSV download started.',
      'good'
    );
  };


  // ==========================================================
  // PDF EXPORT
  // ==========================================================

  const downloadPdf = () => {

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const left = 14;
    const right = pageWidth - left;

    const tableColumns = [
      { label: 'EMPLOYEE', x: left + 3 },
      { label: 'ID', x: left + 55 },
      { label: 'DESIGNATION', x: left + 84 },
      { label: 'SCORE', x: left + 174 },
      { label: 'RATING', x: left + 211 },
      { label: 'GOALS', x: left + 244 }
    ];

    pdf.setFillColor(20, 54, 65);

    pdf.roundedRect(
      left, 12, 15, 15, 2.5, 2.5, 'F'
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);

    pdf.text(
      'T',
      left + 7.5,
      22,
      { align: 'center' }
    );

    pdf.setTextColor(20, 54, 65);
    pdf.setFontSize(16);

    pdf.text(
      'TECHNOMOLD',
      left + 20,
      18
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(87, 105, 112);

    pdf.text(
      'PERFORMANCE REPORT',
      left + 20,
      24
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(20, 54, 65);

    pdf.text(
      'REPORTING PERIOD',
      right,
      16,
      { align: 'right' }
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(87, 105, 112);

    pdf.text(
      periodRangeLabel,
      right,
      22,
      { align: 'right' }
    );

    pdf.setDrawColor(190, 207, 212);
    pdf.setLineWidth(0.35);

    pdf.line(
      left, 32, right, 32
    );

    const metricY = 38;

    const metricWidth =
      (right - left - 8) / 3;

    const metrics = [
      [
        'TEAM SCORE (SEED SNAPSHOTS)',
        periodScore
          ? `${periodScore} / 100`
          : 'No data'
      ],
      [
        'AVERAGE GOAL PROGRESS',
        averageGoalProgress == null
          ? 'No data'
          : `${averageGoalProgress}%`
      ],
      [
        'EMPLOYEE SCORECARDS',
        String(filteredTeamMembers.length)
      ]
    ];

    metrics.forEach(
      ([label, value], index) => {

        const x =
          left + index * (metricWidth + 4);

        pdf.setFillColor(240, 246, 247);

        pdf.roundedRect(
          x,
          metricY,
          metricWidth,
          20,
          1.5,
          1.5,
          'F'
        );

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(87, 105, 112);

        pdf.text(
          label,
          x + 4,
          metricY + 7
        );

        pdf.setFontSize(12);
        pdf.setTextColor(20, 54, 65);

        pdf.text(
          value,
          x + 4,
          metricY + 15
        );
      }
    );

    const drawTableHeader = y => {

      pdf.setFillColor(20, 54, 65);

      pdf.roundedRect(
        left,
        y,
        right - left,
        9,
        1.2,
        1.2,
        'F'
      );

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);

      tableColumns.forEach(column =>
        pdf.text(
          column.label,
          column.x,
          y + 6
        )
      );
    };

    let rowY = 66;

    drawTableHeader(rowY);

    rowY += 9;

    if (!filteredTeamMembers.length) {

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(87, 105, 112);

      pdf.text(
        'No employee scorecards are available for this reporting period.',
        left + 3,
        rowY + 10
      );

    } else {

      filteredTeamMembers.forEach(
        (member, index) => {

          const rowHeight = 12;

          if (
            rowY + rowHeight >
            pageHeight - 14
          ) {
            pdf.addPage();

            rowY = 16;

            drawTableHeader(rowY);

            rowY += 9;
          }

          if (index % 2 === 0) {

            pdf.setFillColor(246, 249, 250);

            pdf.rect(
              left,
              rowY,
              right - left,
              rowHeight,
              'F'
            );
          }

          pdf.setDrawColor(222, 230, 233);

          pdf.line(
            left,
            rowY + rowHeight,
            right,
            rowY + rowHeight
          );

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(48, 65, 72);

          pdf.text(
            pdf.splitTextToSize(
              String(member.name || ''),
              48
            ).slice(0, 2),
            tableColumns[0].x,
            rowY + 4.5
          );

          pdf.text(
            String(getMemberId(member) || ''),
            tableColumns[1].x,
            rowY + 7
          );

          pdf.text(
            pdf.splitTextToSize(
              String(member.designation || ''),
              83
            ).slice(0, 2),
            tableColumns[2].x,
            rowY + 4.5
          );

          pdf.text(
            String(member.performanceScore ?? 'N/A'),
            tableColumns[3].x,
            rowY + 7
          );

          pdf.text(
            String(member.rating ?? 'N/A'),
            tableColumns[4].x,
            rowY + 7
          );

          pdf.text(
            member.goalsProgress == null
              ? 'N/A'
              : `${member.goalsProgress}%`,
            tableColumns[5].x,
            rowY + 7
          );

          rowY += rowHeight;
        }
      );
    }

    const pageCount =
      pdf.getNumberOfPages();

    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {

      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(110, 125, 130);

      pdf.text(
        `Generated ${new Date().toLocaleDateString('en-IN')} | Page ${page} of ${pageCount}`,
        right,
        pageHeight - 7,
        { align: 'right' }
      );
    }

    pdf.save(
      `Technomold_Performance_${appliedRange.from}_to_${appliedRange.to}.pdf`
    );

    triggerToast(
      'Performance PDF generated.',
      'good'
    );
  };


  // ==========================================================
  // PERMISSION RESTRICTION
  // ==========================================================

  if (!canEdit) {

    return (
      <div className="glass-card !p-8 text-center space-y-2">

        <h3 className="font-display font-bold text-lg text-ink">
          Access Restricted
        </h3>

        <p className="text-xs text-muted">
          You do not have permission to manage team performance.
        </p>

      </div>
    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="space-y-5">

      {/* PERFORMANCE HEADER */}

      <div className="glass-card !p-5">

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line/60">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h2 className="font-display font-bold text-xl text-ink">
                Team Performance & OKR Dashboard
              </h2>

              <span className="px-2.5 py-0.5 rounded-full bg-good/15 text-good border border-good/30 text-xs font-bold">

                {selectedPreset || 'Custom range'}

              </span>

            </div>

            <p className="text-xs text-muted mt-1">

              Performance snapshots for {periodRangeLabel}

            </p>

          </div>


          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"

              onClick={() =>
                setIsPeriodFilterOpen(open => !open)
              }

              aria-expanded={isPeriodFilterOpen}

              className="flex items-center gap-1.5 rounded-xl border border-accent/50 bg-surface2 px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
            >

              <Filter className="h-4 w-4 text-accent" />

              Time Period

              {isPeriodFilterOpen
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }

            </button>


            <button
              type="button"
              onClick={downloadPdf}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2 text-xs font-semibold text-ink hover:border-accent"
            >

              <Download className="h-4 w-4 text-accent" />

              Download PDF

            </button>


            <button
              type="button"
              onClick={downloadCsv}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2 text-xs font-semibold text-ink hover:border-accent"
            >

              <FileDown className="h-4 w-4 text-accent" />

              Export CSV

            </button>


            <button
              type="button"
              onClick={openScheduleModal}
              className="px-3.5 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-xs font-semibold flex items-center gap-1.5"
            >

              <Calendar className="w-4 h-4 text-accent" />

              Schedule Review

            </button>


            <button
              type="button"

              onClick={() =>
                openFeedbackModal(null)
              }

              className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold hover:brightness-105 flex items-center gap-1.5 shadow-sm"
            >

              <Plus className="w-4 h-4" />

              Add Feedback

            </button>

          </div>

        </div>


        {/* PERIOD FILTER */}

        {isPeriodFilterOpen && (

          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line/60 bg-surface2/30 p-3">

            <div className="flex flex-wrap gap-2">

              {PERIOD_OPTIONS.map(option => (

                <button
                  key={option.label}
                  type="button"

                  onClick={() =>
                    selectPreset(option.label)
                  }

                  aria-pressed={
                    selectedPreset === option.label
                  }

                  className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                    selectedPreset === option.label
                      ? 'border-accent bg-accent text-on-accent'
                      : 'border-line bg-surface2 text-ink hover:border-accent'
                  }`}
                >

                  {option.label}

                </button>

              ))}

            </div>


            <label className="flex min-w-[145px] flex-1 flex-col gap-1 text-[11px] font-semibold text-muted">

              From

              <input
                type="date"
                value={draftRange.from}

                onChange={event =>
                  setDraftRange(previous => ({
                    ...previous,
                    from: event.target.value
                  }))
                }

                className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-xs text-ink focus:border-accent"
              />

            </label>


            <label className="flex min-w-[145px] flex-1 flex-col gap-1 text-[11px] font-semibold text-muted">

              To

              <input
                type="date"
                value={draftRange.to}

                onChange={event =>
                  setDraftRange(previous => ({
                    ...previous,
                    to: event.target.value
                  }))
                }

                className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-xs text-ink focus:border-accent"
              />

            </label>


            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-on-accent"
            >

              Apply

            </button>


            <button
              type="button"
              onClick={resetRange}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2 text-xs font-semibold text-ink"
            >

              <RotateCcw className="h-3.5 w-3.5" />

              Reset

            </button>

          </div>

        )}


        {/* KPI CARDS */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 pt-4">

          {[
            {
              label: 'Overall Team Score',
              value: periodScore
                ? `${periodScore}/100`
                : '—',
              color: 'text-accent',
              caption: 'Seeded sprint snapshots'
            },
            {
              label: 'Sprint Velocity',
              value: velocityAvailable
                ? teamPerformanceScore.sprintVelocity
                : '—',
              color: 'text-good',
              caption: 'Seeded velocity snapshot'
            },
            {
              label: 'Average Goal Progress',
              value: averageGoalProgress == null
                ? '—'
                : `${averageGoalProgress}%`,
              color: 'text-accent',
              caption: 'Filtered employee scorecards'
            },
            {
              label: 'Scheduled Reviews',
              value: pendingReviews,
              color: 'text-warn',
              caption: 'Pending performance reviews'
            }
          ].map(card => (

            <div
              key={card.label}
              className="kpi-card h-[125px] rounded-xl bg-surface2/50 border border-line/40 p-4 text-center flex flex-col justify-between"
            >

              <span className="text-xs text-muted uppercase font-medium tracking-wider">

                {card.label}

              </span>

              <div className={`font-display font-bold text-2xl ${card.color}`}>

                {card.value}

              </div>

              <span className="text-[10px] text-muted">

                {card.caption}

              </span>

            </div>

          ))}

        </div>

      </div>


      {/* PERFORMANCE TREND */}

      <div className="glass-card !p-4">

        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-line/60">

          <div>

            <h3 className="font-display font-semibold text-sm sm:text-base text-ink">

              Team Performance Trend

            </h3>

            <span className="text-[11px] text-muted">

              Demo sprint snapshots · {periodRangeLabel}

            </span>

          </div>

          <span className="text-xs font-bold text-accent">

            {periodScore
              ? `Period average: ${periodScore}%`
              : 'No data'}

          </span>

        </div>


        <div className="mt-3 w-full min-w-0 max-w-4xl mx-auto">

          {filteredTrend.length > 1 ? (

            <PerformanceTrendChart points={filteredTrend} />

          ) : (

            <div className="flex h-[170px] items-center justify-center text-xs text-muted">

              {filteredTrend.length === 1
                ? `Recorded snapshot: ${filteredTrend[0].score}%`
                : 'No sprint snapshots available for this period.'}

            </div>

          )}

        </div>


        

      </div>


      {/* MODULE NAVIGATION */}

      <div className="glass-card !p-3 flex flex-wrap items-center justify-between gap-3">

        <div className="flex flex-wrap items-center gap-2">

          {[
            {
              id: 'scorecards',
              label: 'Employee Scorecards',
              icon: Target
            },
            {
              id: 'feedback',
              label: `Feedback History (${visibleFeedback.length})`,
              icon: MessageSquare
            },
            {
              id: 'reviews',
              label: `Scheduled Reviews (${pendingReviews})`,
              icon: Calendar
            }
          ].map(tab => {

            const Icon = tab.icon;

            return (

              <button
                key={tab.id}
                type="button"

                onClick={() =>
                  setActiveTab(tab.id)
                }

                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface2 text-muted hover:text-ink'
                }`}
              >

                <Icon className="w-4 h-4" />

                {tab.label}

              </button>

            );
          })}

        </div>


        <div className="relative min-w-[200px]">

          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

          <input
            type="search"
            value={searchTerm}
            placeholder="Search employee..."

            onChange={event =>
              setSearchTerm(event.target.value)
            }

            className="w-full bg-surface2 border border-line rounded-xl pl-9 pr-3 py-2 text-xs text-ink"
          />

        </div>

      </div>


      {/* EMPLOYEE SCORECARDS */}

      {activeTab === 'scorecards' && (

        <div className="glass-card !p-4 space-y-3">

          <div className="flex items-center justify-between pb-3 border-b border-line/60">

            <div>

              <h3 className="font-display font-semibold text-base text-ink">

                Employee Performance Scorecards

              </h3>

              <span className="text-[11px] text-muted">

                Employee scores, ratings and goal progress

              </span>

            </div>

            <span className="text-xs text-muted">

              {filteredTeamMembers.length} Team Members

            </span>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-xs text-ink border-collapse">

              <thead>

                <tr className="border-b border-line/60 text-muted uppercase tracking-wider text-[10.5px]">

                  <th className="pb-3 pl-2">
                    Employee
                  </th>

                  <th className="pb-3">
                    Designation
                  </th>

                  <th className="pb-3 text-center">
                    Score
                  </th>

                  <th className="pb-3 text-center">
                    Rating
                  </th>

                  <th className="pb-3">
                    Goals Progress
                  </th>

                  <th className="pb-3 pr-2 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-line/40">

                {filteredTeamMembers.map(member => (

                  <tr
                    key={getMemberId(member)}
                    className="hover:bg-surface2/40 transition"
                  >

                    <td className="py-3 pl-2">

                      <div className="flex items-center gap-2">

                        <Avatar
                          name={member.name}
                          size="sm"
                        />

                        <div>

                          <span className="font-semibold text-ink block">

                            {member.name}

                          </span>

                          <span className="text-[10px] text-muted font-data">

                            {getMemberId(member)}

                          </span>

                        </div>

                      </div>

                    </td>


                    <td className="py-3 text-muted">

                      {member.designation}

                    </td>


                    <td className="py-3 text-center font-bold text-accent font-display text-sm">

                      {member.performanceScore ?? '—'}

                    </td>


                    <td className="py-3 text-center">

                      <span className="inline-flex items-center gap-1 font-semibold text-good">

                        <Star className="w-3 h-3 fill-good" />

                        {member.rating ?? '—'}

                      </span>

                      {(() => {
                        const latest = visibleFeedback
                          .filter(item =>
                            [
                              member.id,
                              member.employeeId,
                              member.userId
                            ].some(id =>
                              sameId(id, item.employeeId)
                            )
                          )
                          .sort((first, second) =>
                            new Date(second.createdAt || second.date || 0) -
                            new Date(first.createdAt || first.date || 0)
                          )[0];

                        return latest ? (
                          <div className="mt-1 text-[10px] text-muted">
                            Latest feedback: {latest.rating}/5
                          </div>
                        ) : null;
                      })()}

                    </td>


                    <td className="py-3">

                      <div className="min-w-[120px] max-w-[160px] space-y-1">

                        <div className="flex items-center justify-between">

                          <span className="font-bold text-ink">

                            {member.goalsProgress == null
                              ? '—'
                              : `${member.goalsProgress}%`}

                          </span>

                          <button
                            type="button"

                            onClick={() =>
                              openGoalModal(member)
                            }

                            title="Edit goal progress"

                            className="p-1 text-accent hover:bg-surface2 rounded"
                          >

                            <Edit className="w-3.5 h-3.5" />

                          </button>

                        </div>


                        <div className="h-2 rounded-full bg-surface2 overflow-hidden">

                          <div
                            className="h-full rounded-full bg-accent transition-all"

                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Number(member.goalsProgress) || 0
                                )
                              )}%`
                            }}
                          />

                        </div>

                        {member.goalUpdatedAt && (

                          <span className="text-[9px] text-muted">

                            Updated {formatDisplayDate(
                              member.goalUpdatedAt
                            )}

                          </span>

                        )}

                      </div>

                    </td>


                    <td className="py-3 pr-2 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          openPerformanceHistory(member)
                        }
                        className="mr-2 px-2.5 py-1.5 rounded-lg bg-surface2 border border-line text-ink hover:border-accent text-xs font-semibold"
                      >
                        View History
                      </button>

                      <button
                        type="button"

                        onClick={() =>
                          openFeedbackModal(member)
                        }

                        className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-line text-accent hover:border-accent font-semibold text-xs"
                      >

                        + Feedback

                      </button>

                    </td>

                  </tr>

                ))}


                {!filteredTeamMembers.length && (

                  <tr>

                    <td
                      colSpan={6}
                      className="py-10 text-center text-muted"
                    >

                      No employee scorecards match
                      the selected period or search.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* FEEDBACK HISTORY */}

      {activeTab === 'feedback' && (

        <div className="glass-card !p-4 space-y-4">

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/60">

            <div>

              <h3 className="font-display font-semibold text-base text-ink">

                Employee Feedback History

              </h3>

              <p className="text-xs text-muted mt-1">

                Saved commendations, ratings and review notes

              </p>

            </div>


            <div className="flex flex-wrap items-center gap-2">

              <select
                value={feedbackEmployee}

                onChange={event =>
                  setFeedbackEmployee(event.target.value)
                }

                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink"
              >

                <option value="all">
                  All Employees
                </option>

                {teamMembers.map(member => (

                  <option
                    key={getMemberId(member)}
                    value={getMemberId(member)}
                  >

                    {member.name}

                  </option>

                ))}

              </select>


              <button
                type="button"
                onClick={downloadFeedbackCsv}
                className="px-3 py-2 rounded-xl bg-surface2 border border-line text-accent text-xs font-semibold flex items-center gap-2"
              >

                <Download className="w-4 h-4" />

                Export Feedback

              </button>

            </div>

          </div>


          {!filteredFeedback.length ? (

            <div className="py-12 text-center text-muted text-xs space-y-2">

              <MessageSquare className="w-8 h-8 mx-auto" />

              <p>
                No feedback records found for this selection.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {filteredFeedback.map(item => (

                <div
                  key={item.id}
                  className="rounded-2xl border border-line/50 bg-surface2/40 p-4"
                >

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <Avatar
                        name={item.employeeName}
                        size="md"
                      />

                      <div>

                        <h4 className="text-sm font-semibold text-ink">

                          {item.employeeName}

                        </h4>

                        <p className="text-[11px] text-muted">

                          {item.employeeId} · {item.date}

                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-1 text-warn">

                      {[1, 2, 3, 4, 5].map(star => (

                        <Star
                          key={star}

                          className={`w-4 h-4 ${
                            star <= Number(item.rating)
                              ? 'fill-current'
                              : 'text-muted'
                          }`}
                        />

                      ))}

                      <span className="text-xs font-bold ml-1">

                        {item.rating}/5

                      </span>

                    </div>

                  </div>


                  <div className="mt-3">

                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-semibold">

                      {item.type}

                    </span>

                    <p className="text-xs text-ink mt-2 leading-relaxed break-words">

                      {item.content}

                    </p>

                    <p className="mt-3 text-[11px] text-muted">

                      Reviewed by: {item.giver}

                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      )}


      {/* SCHEDULED REVIEWS */}

      {activeTab === 'reviews' && (

        <div className="glass-card !p-4 space-y-4">

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/60">

            <div>

              <h3 className="font-display font-semibold text-base text-ink">

                Performance Review Schedule

              </h3>

              <p className="text-xs text-muted mt-1">

                Manage locally saved performance review meetings

              </p>

            </div>


            <select
              value={reviewFilter}
              onChange={event =>
                setReviewFilter(event.target.value)
              }
              className="bg-[#141824] border border-line rounded-xl px-3 py-2 text-xs text-white"
            >

              <option value="all">
                All Reviews
              </option>

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>

            </select>

          </div>


          {!filteredReviews.length ? (

            <div className="py-12 text-center text-muted text-xs space-y-2">

              <Calendar className="w-8 h-8 mx-auto" />

              <p>
                No performance reviews found.
              </p>

              <button
                type="button"
                onClick={openScheduleModal}
                className="mt-2 px-4 py-2 rounded-xl bg-accent text-on-accent font-bold"
              >

                Schedule Review

              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {filteredReviews.map(review => (

                <div
                  key={review.id}
                  className="rounded-2xl border border-line/50 bg-surface2/40 p-4"
                >

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <Avatar
                        name={review.employeeName}
                        size="md"
                      />

                      <div>

                        <h4 className="text-sm font-bold text-ink">

                          {review.employeeName}

                        </h4>

                        <p className="text-[11px] text-muted">

                          {review.employeeId} · {review.designation}

                        </p>

                      </div>

                    </div>


                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      review.status === 'Completed'
                        ? 'bg-good/15 text-good'
                        : review.status === 'Cancelled'
                          ? 'bg-bad/15 text-bad'
                          : 'bg-warn/15 text-warn'
                    }`}>

                      {review.status}

                    </span>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">

                    <div className="flex items-center gap-2 text-xs text-ink">

                      <Calendar className="w-4 h-4 text-accent" />

                      {formatDisplayDate(review.date)}

                    </div>

                    <div className="flex items-center gap-2 text-xs text-ink">

                      <Clock className="w-4 h-4 text-accent" />

                      {formatMeetingTime(review.time)}

                    </div>

                  </div>


                  <div className="mt-3 rounded-xl bg-surface border border-line/40 p-3">

                    <p className="text-[10px] uppercase font-semibold text-muted">

                      Meeting Agenda

                    </p>

                    <p className="text-xs text-ink mt-1 break-words">

                      {review.agenda}

                    </p>

                  </div>


                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">

                    <span className="text-[11px] text-muted">

                      Scheduled by: {review.scheduledBy}

                    </span>


                    <div className="flex items-center gap-2">

                      {review.status === 'Scheduled' ? (

                        <>

                          <button
                            type="button"
                            onClick={() => openRescheduleModal(review)}
                            className="px-3 py-1.5 rounded-lg bg-surface2 border border-line text-accent text-xs font-semibold flex items-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Reschedule
                          </button>

                          <button
                            type="button"

                            onClick={() =>
                              updateReviewStatus(
                                review.id,
                                'Cancelled'
                              )
                            }

                            className="px-3 py-1.5 rounded-lg bg-bad/10 text-bad border border-bad/20 text-xs font-semibold"
                          >

                            Cancel Review

                          </button>


                          <button
                            type="button"

                            onClick={() =>
                              updateReviewStatus(
                                review.id,
                                'Completed'
                              )
                            }

                            className="px-3 py-1.5 rounded-lg bg-good/15 text-good text-xs font-semibold flex items-center gap-1"
                          >

                            <CheckCircle className="w-3.5 h-3.5" />

                            Mark Completed

                          </button>

                        </>

                      ) : (

                        <button
                          type="button"

                          onClick={() =>
                            setDeleteReviewId(review.id)
                          }

                          className="p-2 rounded-lg text-bad hover:bg-bad/10"

                          title="Delete review record"
                        >

                          <Trash2 className="w-4 h-4" />

                        </button>

                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      )}


      {/* INDIVIDUAL PERFORMANCE HISTORY */}

      {historyMember && canEdit && (

        <ModalPortal
          onClose={() => setHistoryEmployeeId(null)}
          ariaLabelledby="performance-history-title"
        >

          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-white shadow-2xl space-y-5">

            <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-4">

              <div className="flex items-center gap-3">

                <Avatar
                  name={historyMember.name}
                  size="md"
                />

                <div>

                  <h3
                    id="performance-history-title"
                    className="font-display text-lg font-bold text-ink"
                  >
                    Employee Performance History
                  </h3>

                  <p className="text-sm text-accent mt-1">
                    {historyMember.name}
                  </p>

                  <p className="text-xs text-muted">
                    {getMemberId(historyMember)}
                    {' - '}
                    {historyMember.designation}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setHistoryEmployeeId(null)
                }
                className="rounded-lg p-2 text-muted hover:bg-white/10"
                aria-label="Close performance history"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            {/* CURRENT SCORECARD */}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

              {[
                {
                  label: 'Current Score',
                  value: historyMember.performanceScore ?? 'N/A'
                },
                {
                  label: 'Scorecard Rating',
                  value: historyMember.rating ?? 'N/A'
                },
                {
                  label: 'Goal Progress',
                  value:
                    (
                      historyGoalRecord?.progress ??
                      historyMember.goalsProgress
                    ) == null
                      ? 'N/A'
                      : `${
                          historyGoalRecord?.progress ??
                          historyMember.goalsProgress
                        }%`
                },
                {
                  label: 'Latest Feedback',
                  value: historyFeedback.length
                    ? `${historyFeedback[0].rating}/5`
                    : 'N/A'
                }
              ].map(metric => (

                <div
                  key={metric.label}
                  className="rounded-xl border border-line/50 bg-surface2/40 p-3"
                >

                  <p className="text-[10px] text-muted uppercase">
                    {metric.label}
                  </p>

                  <p className="font-data text-xl font-bold text-accent mt-2">
                    {metric.value}
                  </p>

                </div>

              ))}

            </div>

            <p className="text-[11px] text-muted">
              Current scorecard values are snapshots.
              History below contains recorded feedback,
              goal changes and review records.
            </p>

            {/* GOAL HISTORY */}

            <section className="glass-card !p-4 space-y-3">

              <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">

                <Target className="w-4 h-4 text-accent" />

                Goal Progress History

              </h4>

              {!historyGoals.length ? (

                <p className="text-xs text-muted">
                  No detailed goal history recorded yet.
                  New goal updates will appear here.
                </p>

              ) : (

                historyGoals.map((entry, index) => (

                  <div
                    key={entry.id || index}
                    className="rounded-xl border border-line/50 bg-surface2/40 p-3"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <span className="text-xs font-semibold text-muted">

                        {entry.previousProgress == null
                          ? 'Not recorded'
                          : `${entry.previousProgress}%`}

                        {' to '}

                        <span className="text-accent">
                          {entry.progress}%
                        </span>

                      </span>

                      <span className="text-[10px] text-muted">
                        {formatDisplayDate(entry.updatedAt)}
                      </span>

                    </div>

                    <div className="mt-2 h-2 rounded-full bg-surface overflow-hidden">

                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              Number(entry.progress) || 0
                            )
                          )}%`
                        }}
                      />

                    </div>

                    <p className="mt-2 text-xs text-ink break-words">
                      {entry.comment || 'No remarks provided.'}
                    </p>

                    <p className="mt-2 text-[10px] text-muted">
                      Updated by: {entry.updatedBy || 'Not recorded'}
                    </p>

                  </div>

                ))

              )}

            </section>

            {/* FEEDBACK HISTORY */}

            <section className="glass-card !p-4 space-y-3">

              <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">

                <MessageSquare className="w-4 h-4 text-accent" />

                Feedback & Ratings

                <span className="ml-auto text-xs text-muted">
                  {historyFeedback.length}
                </span>

              </h4>

              {!historyFeedback.length && (

                <p className="text-xs text-muted">
                  No feedback recorded for this employee.
                </p>

              )}

              {historyFeedback.map((entry, index) => (

                <div
                  key={entry.id || index}
                  className="rounded-xl border border-line/50 bg-surface2/40 p-3"
                >

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <span className="text-xs font-semibold text-accent">
                      {entry.type || 'Performance Feedback'}
                    </span>

                    <span className="text-xs font-semibold text-warn">
                      {entry.rating}/5
                    </span>

                  </div>

                  <p className="mt-2 text-xs text-ink whitespace-pre-wrap break-words">
                    {entry.content}
                  </p>

                  <p className="mt-2 text-[10px] text-muted">
                    {entry.giver || 'Reviewer not recorded'}
                    {' - '}
                    {formatDisplayDate(entry.createdAt || entry.date)}
                  </p>

                </div>

              ))}

            </section>

            {/* REVIEW HISTORY */}

            <section className="glass-card !p-4 space-y-3">

              <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">

                <Calendar className="w-4 h-4 text-accent" />

                Performance Review History

                <span className="ml-auto text-xs text-muted">
                  {historyReviews.length}
                </span>

              </h4>

              {!historyReviews.length && (

                <p className="text-xs text-muted">
                  No performance reviews recorded.
                </p>

              )}

              {historyReviews.map(review => (

                <div
                  key={review.id}
                  className="rounded-xl border border-line/50 bg-surface2/40 p-3"
                >

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <span className="text-xs font-semibold text-ink">

                      {formatDisplayDate(review.date)}

                      {' - '}

                      {formatMeetingTime(review.time)}

                    </span>

                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      review.status === 'Completed'
                        ? 'bg-good/10 text-good'
                        : review.status === 'Cancelled'
                          ? 'bg-bad/10 text-bad'
                          : 'bg-surface text-muted'
                    }`}>

                      {review.status}

                    </span>

                  </div>

                  <p className="mt-2 text-xs text-muted break-words">
                    {review.agenda}
                  </p>

                  <p className="mt-2 text-[10px] text-muted">
                    Scheduled by: {review.scheduledBy || 'Not recorded'}
                  </p>

                  {safeArray(review.rescheduleHistory).map(
                    (entry, index) => (

                      <div
                        key={entry.id || index}
                        className="mt-2 rounded-lg border border-line/40 p-2 text-[10px] text-muted"
                      >

                        Rescheduled from{' '}

                        {formatDisplayDate(entry.previousDate)}

                        {' '}

                        {formatMeetingTime(entry.previousTime)}

                        {' to '}

                        {formatDisplayDate(entry.newDate)}

                        {' '}

                        {formatMeetingTime(entry.newTime)}

                      </div>

                    )
                  )}

                </div>

              ))}

            </section>

            <div className="flex justify-end border-t border-line/50 pt-3">

              <button
                type="button"
                onClick={() =>
                  setHistoryEmployeeId(null)
                }
                className="rounded-xl border border-line bg-surface2 px-4 py-2 text-xs font-semibold text-ink"
              >
                Close
              </button>

            </div>

          </div>

        </ModalPortal>

      )}

      {/* FEEDBACK MODAL */}

      <FeedbackModal
        key={feedbackModalKey}

        isOpen={isFeedbackOpen}

        onClose={() =>
          setIsFeedbackOpen(false)
        }

        onFeedbackSubmit={
          handleAddFeedback
        }

        preselectedEmployee={
          selectedMemberForFeedback
        }
      />


      {/* EDIT GOAL PROGRESS MODAL */}

      {goalModalOpen && (

        <ModalPortal
          onClose={() => setGoalModalOpen(false)}
          ariaLabelledby="edit-goal-title"
        >

          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-white shadow-2xl">

            <div className="flex items-center justify-between pb-3 border-b border-line">

              <h3
                id="edit-goal-title"
                className="font-display font-bold text-lg"
              >

                Update Goal Progress

              </h3>

              <button
                type="button"

                onClick={() =>
                  setGoalModalOpen(false)
                }

                aria-label="Close goal editor"

                className="p-2 rounded-lg hover:bg-white/10"
              >

                <X className="w-4 h-4" />

              </button>

            </div>


            <form
              onSubmit={handleGoalSubmit}
              className="space-y-4 mt-4"
            >

              <div>

                <label className="text-xs text-muted">

                  Employee

                </label>

                <p className="text-sm text-ink font-semibold mt-1">

                  {findMember(goalData.employeeId)?.name}

                </p>

              </div>


              <div>

                <label className="text-xs font-semibold text-ink block mb-2">

                  Goal Progress (%)

                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  required

                  value={goalData.progress}

                  onChange={event =>
                    setGoalData(previous => ({
                      ...previous,
                      progress: event.target.value
                    }))
                  }

                  className="w-full bg-surface2 border border-line rounded-xl p-3 text-sm text-ink"
                />


                <input
                  type="range"
                  min="0"
                  max="100"

                  value={Number(goalData.progress) || 0}

                  onChange={event =>
                    setGoalData(previous => ({
                      ...previous,
                      progress: Number(event.target.value)
                    }))
                  }

                  className="w-full mt-3 accent-[#6EE7B7]"
                />

              </div>


              <div>

                <label className="text-xs font-semibold text-ink block mb-2">

                  Progress Update Comment

                </label>

                <textarea
                  rows={3}

                  value={goalData.comment}

                  maxLength={500}

                  onChange={event =>
                    setGoalData(previous => ({
                      ...previous,
                      comment: event.target.value
                    }))
                  }

                  placeholder="Describe completed goals or progress..."

                  className="w-full bg-surface2 border border-line rounded-xl p-3 text-xs text-ink"
                />

              </div>


              <div className="flex justify-end gap-2 pt-3 border-t border-line">

                <button
                  type="button"

                  onClick={() =>
                    setGoalModalOpen(false)
                  }

                  className="px-4 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold"
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold"
                >

                  Save Progress

                </button>

              </div>

            </form>

          </div>

        </ModalPortal>

      )}


      {/* SCHEDULE REVIEW MODAL */}

      {scheduleModalOpen && (

        <ModalPortal
          onClose={() =>
            setScheduleModalOpen(false)
          }

          ariaLabelledby="schedule-review-title"
        >

          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-white shadow-2xl">

            <div className="mb-4 flex items-start justify-between gap-3">

              <div>

                <h3
                  id="schedule-review-title"
                  className="font-display font-bold text-lg text-white"
                >

                  {reschedulingReviewId
                  ? 'Reschedule Performance Review'
                  : 'Schedule Performance Review'}

                </h3>

                <p className="text-xs text-muted mt-1">

                  Save a performance review or one-on-one meeting.

                </p>

              </div>


              <button
                type="button"

                onClick={() =>
                  setScheduleModalOpen(false)
                }

                className="p-2 rounded-lg hover:bg-white/10"

                aria-label="Close review scheduler"
              >

                <X className="w-4 h-4" />

              </button>

            </div>


            <form
              onSubmit={handleScheduleSubmit}
              className="space-y-4 text-xs"
            >

              <div>

                <label className="font-semibold text-ink block mb-1">

                  Select Employee

                </label>

                <select
                  required
                  disabled={Boolean(reschedulingReviewId)}
                  value={scheduleData.employeeId}

                  onChange={event =>
                    setScheduleData(previous => ({
                      ...previous,
                      employeeId: event.target.value
                    }))
                  }

                  className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink"
                >

                  <option value="">
                    Select Employee
                  </option>

                  {teamMembers.map(member => (

                    <option
                      key={getMemberId(member)}
                      value={getMemberId(member)}
                      className="bg-[#06141c]"
                    >

                      {member.name} ({member.designation})

                    </option>

                  ))}

                </select>

              </div>


              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="font-semibold text-ink block mb-1">

                    Date

                  </label>

                  <input
                    type="date"
                    required
                    min={formatDateInput(new Date())}
                    value={scheduleData.date}

                    onChange={event =>
                      setScheduleData(previous => ({
                        ...previous,
                        date: event.target.value
                      }))
                    }

                    className="w-full bg-surface2 border border-line rounded-xl p-2 text-xs text-ink"
                  />

                </div>


                <div>

                  <label className="font-semibold text-ink block mb-1">

                    Time

                  </label>

                  <input
                    type="time"
                    required

                    value={scheduleData.time}

                    onChange={event =>
                      setScheduleData(previous => ({
                        ...previous,
                        time: event.target.value
                      }))
                    }

                    className="w-full bg-surface2 border border-line rounded-xl p-2 text-xs text-ink"
                  />

                </div>

              </div>


              <div>

                <label className="font-semibold text-ink block mb-1">

                  Agenda / Meeting Topic

                </label>

                <textarea
                  rows={3}
                  required
                  maxLength={500}

                  value={scheduleData.agenda}

                  onChange={event =>
                    setScheduleData(previous => ({
                      ...previous,
                      agenda: event.target.value
                    }))
                  }

                  className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink"
                />

              </div>


              <p className="text-[11px] text-muted">

                Review details are saved in this browser.
                Calendar invitations require calendar or backend integration.

              </p>


              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/60">

                <button
                  type="button"

                  onClick={() =>
                    setScheduleModalOpen(false)
                  }

                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink"
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-on-accent hover:brightness-105"
                >

                  {reschedulingReviewId
                    ? 'Save New Schedule'
                    : 'Confirm Schedule'}

                </button>

              </div>

            </form>

          </div>

        </ModalPortal>

      )}


      {/* DELETE CONFIRMATION MODAL */}

      {deleteReviewId && (

        <ModalPortal
          onClose={() =>
            setDeleteReviewId(null)
          }

          ariaLabelledby="delete-review-title"
        >

          <div className="w-full max-w-sm rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-white shadow-2xl">

            <h3
              id="delete-review-title"
              className="font-display font-bold text-lg"
            >

              Delete Review Record?

            </h3>

            <p className="text-xs text-muted mt-2">

              This will permanently remove the saved
              performance review record.

            </p>


            <div className="flex justify-end gap-2 mt-5">

              <button
                type="button"

                onClick={() =>
                  setDeleteReviewId(null)
                }

                className="px-4 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold"
              >

                Cancel

              </button>


              <button
                type="button"
                onClick={deleteReview}
                className="px-4 py-2 rounded-xl bg-bad/20 text-bad text-xs font-bold"
              >

                Delete

              </button>

            </div>

          </div>

        </ModalPortal>

      )}

    </div>

  );

};

export default Performance;