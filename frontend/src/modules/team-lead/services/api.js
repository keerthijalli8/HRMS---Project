import {
  prepareAttendanceCorrection,
  commitAttendanceCorrection
} from '../utils/attendanceCorrection.js';

// ATTENDANCE_REGULARIZATION_SERVICE_V1
import {
  currentTeamLead,
  initialTeamMembers,
  initialApprovals,
  initialTasks,
  teamPerformanceScore,
  authorizedPayrollOverview,
  upcomingBirthdaysAndHolidays,
  recentTeamActivities,
  initialAnnouncements
} from '../data/mockData.js';

import {
  canAccessEmployee,
  canAccessProject,
  getScopedApprovals,
  getScopedEmployeeIds,
  getScopedTasks,
  getScopedTeamMembers,
  isSuperAdminUser,
  getUserRole,
  canManageApprovals,
  canAssignTasks,
  canManageProjects,
  canReviewPerformance,
  userIdOf
} from '../utils/dataScope.js';

import {
  readStorage,
  writeStorage
} from '../utils/storage.js';

// ============================================================
// STORAGE CONFIGURATION
// ============================================================

const STORAGE_KEYS = {
  USER: 'technomold_teamlead_user',
  MEMBERS: 'technomold_teamlead_members',
  MEMBERS_INITIALIZED: 'technomold_teamlead_members_initialized',
  APPROVALS: 'technomold_teamlead_approvals',
  TASKS: 'technomold_teamlead_tasks',
  TASKS_INITIALIZED: 'technomold_teamlead_tasks_initialized',
  TASKS_MIGRATED: 'technomold_teamlead_tasks_migrated_v2',
  PROJECTS: 'technomold_teamlead_projects',
  FEEDBACK: 'technomold_teamlead_feedback',
  GOALS: 'technomold_teamlead_employee_goals',
  REVIEWS: 'technomold_teamlead_scheduled_reviews',
  SETTINGS: 'technomold_teamlead_settings',
  MY_LEAVES: 'technomold_teamlead_my_leave_requests',
  LEAVE_MIGRATION: 'technomold_teamlead_leave_migration_v3',
  NOTIFICATION_READS: 'technomold_teamlead_notification_reads',
  NOTIFICATION_EVENTS: 'technomold_teamlead_notification_events'
};

const APPROVAL_SYNC_EVENT =
  'technomold:teamlead:approval-updated';

const MAX_COMMENT_LENGTH = 300;
const MAX_LEAVE_REASON_LENGTH = 1000;

const safeArray = value =>
  Array.isArray(value) ? value : [];

const getStored = (key, fallback) =>
  readStorage(key, fallback);

const setStored = (key, value) => {
  if (writeStorage(key, value) === false) {
    throw new Error(
      'Unable to save data in browser storage.'
    );
  }

  return value;
};

const getStoredList = (key, fallback = []) => {
  const data = getStored(key, fallback);

  return Array.isArray(data)
    ? data
    : fallback;
};

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const sameId = (first, second) =>
  Boolean(String(first ?? '').trim()) &&
  normalize(first) === normalize(second);

const getMemberId = member =>
  member?.id ||
  member?.employeeId ||
  member?.userId ||
  null;

const getIdentityIds = user =>
  [
    ...new Set(
      [
        user?.id,
        user?.employeeId,
        user?.userId,
        userIdOf(user)
      ]
        .filter(value => value != null)
        .map(normalize)
        .filter(Boolean)
    )
  ];

const matchesEmployeeId = (user, employeeId) =>
  getIdentityIds(user).includes(
    normalize(employeeId)
  );

const generateId = prefix =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

const clampProgress = value =>
  Math.min(
    100,
    Math.max(0, Number(value) || 0)
  );

const requireAuthorizedUser = user => {
  if (
    !userIdOf(user) ||
    getUserRole(user) === 'unauthorized'
  ) {
    throw new Error('Unauthorized user.');
  }
};

const requirePermission = (
  user,
  permission,
  message
) => {
  requireAuthorizedUser(user);

  if (!permission(user)) {
    throw new Error(message);
  }
};

const getAuthorizedMemberIds = (
  user,
  members
) => new Set(
  getScopedTeamMembers(user, members)
    .map(getMemberId)
    .filter(Boolean)
    .map(String)
);

const emitApprovalUpdate = detail => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(
        APPROVAL_SYNC_EVENT,
        { detail }
      )
    );
  }
};

// ============================================================
// DATE HELPERS
// ============================================================

const normalizeDateKey = value => {
  const text = String(value || '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return '';
  }

  const date = new Date(`${text}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    return '';
  }

  return text;
};

const calculateLeaveDays = (fromDate, toDate) => {
  const start = normalizeDateKey(fromDate);
  const end = normalizeDateKey(toDate);

  if (!start || !end || end < start) {
    throw new Error(
      'Enter a valid leave date range.'
    );
  }

  return (
    Math.round(
      (
        Date.parse(`${end}T00:00:00Z`) -
        Date.parse(`${start}T00:00:00Z`)
      ) / 86400000
    ) + 1
  );
};

// ============================================================
// LEAVE CONFIGURATION
// ============================================================

const LEAVE_TYPE_MAP = {
  'casual leave': 'casual',
  'sick leave': 'sick',
  'earned leave': 'earned',
  'annual leave': 'earned',
  'optional holiday': 'optional',
  'restricted holiday': 'optional',
  'unpaid leave': 'unpaid',
  'leave without pay': 'unpaid'
};

const getLeaveBalanceKey = requestType =>
  LEAVE_TYPE_MAP[normalize(requestType)] || null;

const normalizeLeaveApproval = value => {
  const status = normalize(value);

  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';

  return 'pending';
};

const formatApprovalStatus = value => {
  const status = normalizeLeaveApproval(value);

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
};

const getLeaveOverallStatus = (
  teamLeadApproval,
  hrApproval
) => {
  const teamLead =
    normalizeLeaveApproval(teamLeadApproval);

  const hr =
    normalizeLeaveApproval(hrApproval);

  if (
    teamLead === 'rejected' ||
    hr === 'rejected'
  ) {
    return 'Rejected';
  }

  if (
    teamLead === 'approved' &&
    hr === 'approved'
  ) {
    return 'Approved';
  }

  return 'Pending';
};

const getLeaveReviewStage = (
  teamLeadApproval,
  hrApproval
) => {
  const status = getLeaveOverallStatus(
    teamLeadApproval,
    hrApproval
  );

  if (status === 'Rejected') return 'rejected';
  if (status === 'Approved') return 'approved';

  return normalizeLeaveApproval(
    teamLeadApproval
  ) === 'approved'
    ? 'hr-review'
    : 'team-lead-review';
};

const replaceManagerLabel = value =>
  typeof value === 'string'
    ? value.replace(/\bManager\b/g, 'Team Lead')
    : value;

// ============================================================
// NORMALIZE APPROVAL RECORDS
// ============================================================

const normalizeApprovalRecord = approval => {
  if (
    !approval ||
    approval.category !== 'Leave Approval'
  ) {
    return approval;
  }

  let teamLeadApproval =
    normalizeLeaveApproval(
      approval.teamLeadApproval ??
      approval.managerApprovalStatus
    );

  let hrApproval =
    normalizeLeaveApproval(
      approval.hrApproval ??
      approval.hrApprovalStatus
    );

  const hasStages =
    approval.teamLeadApproval != null ||
    approval.managerApprovalStatus != null ||
    approval.hrApproval != null ||
    approval.hrApprovalStatus != null;

  // Preserve finalized historical records
  // when explicit approval stages are unavailable.

  if (!hasStages) {
    if (normalize(approval.status) === 'approved') {
      teamLeadApproval = 'approved';
      hrApproval = 'approved';
    }

    if (normalize(approval.status) === 'rejected') {
      teamLeadApproval = 'rejected';
    }
  }

  const overallStatus = getLeaveOverallStatus(
    teamLeadApproval,
    hrApproval
  );

  return {
    ...approval,

    category: 'Leave Approval',

    teamLeadApproval,
    hrApproval,

    managerApprovalStatus:
      formatApprovalStatus(teamLeadApproval),

    hrApprovalStatus:
      formatApprovalStatus(hrApproval),

    overallStatus,

    status: overallStatus.toLowerCase(),

    reviewStage: getLeaveReviewStage(
      teamLeadApproval,
      hrApproval
    ),

    comments: Array.isArray(approval.comments)
      ? approval.comments
      : typeof approval.comments === 'string'
        ? [approval.comments]
        : [],

    activity: safeArray(approval.activity),

    notifications: safeArray(
      approval.notifications
    ),

    approvalTasks: safeArray(
      approval.approvalTasks
    )
  };
};

const normalizeLeaveRequest = request => {
  const normalized = normalizeApprovalRecord({
    ...request,
    category: 'Leave Approval'
  });

  return {
    ...normalized,

    status: normalized.overallStatus,

    approvalTasks: safeArray(
      normalized.approvalTasks
    ).map(task => ({
      ...task,

      approver:
        task.approver === 'Manager'
          ? 'Team Lead'
          : task.approver,

      assignedTo:
        task.approver === 'Manager'
          ? 'Team Lead'
          : task.assignedTo
    })),

    notifications: safeArray(
      normalized.notifications
    ).map(notification => ({
      ...notification,

      recipientRole:
        notification.recipientRole === 'Manager'
          ? 'Team Lead'
          : notification.recipientRole,

      message: replaceManagerLabel(
        notification.message
      )
    })),

    activity: safeArray(
      normalized.activity
    ).map(entry => ({
      ...entry,

      event: replaceManagerLabel(entry.event),

      detail: replaceManagerLabel(entry.detail)
    }))
  };
};

// ============================================================
// SHARED APPROVAL STORAGE
// ============================================================

const getApprovalRecords = () => {
  const stored = getStoredList(
    STORAGE_KEYS.APPROVALS,
    initialApprovals
  );

  let records = stored
    .filter(Boolean)
    .map(normalizeApprovalRecord);

  const migrated = getStored(
    STORAGE_KEYS.LEAVE_MIGRATION,
    false
  );

  // Import existing personal leave applications once.
  // Match by explicit request ID, never by employee name.

  if (!migrated) {
    const personalRequests = getStoredList(
      STORAGE_KEYS.MY_LEAVES
    );

    personalRequests.forEach(request => {
      if (!request?.id || !request.employeeId) {
        return;
      }

      const existingIndex = records.findIndex(
        item =>
          item.category === 'Leave Approval' &&
          sameId(
            item.employeeId,
            request.employeeId
          ) &&
          (
            sameId(item.id, request.id) ||
            sameId(item.leaveRequestId, request.id)
          )
      );

      if (existingIndex >= 0) {
        const existing = records[existingIndex];

        records[existingIndex] =
          normalizeApprovalRecord({
            ...request,
            ...existing,

            legacyLeaveRequestId: request.id
          });

        return;
      }

      const idCollision = records.some(
        item => sameId(item.id, request.id)
      );

      records.push(
        normalizeApprovalRecord({
          ...request,

          id: idCollision
            ? generateId('LV')
            : request.id,

          legacyLeaveRequestId: request.id,

          category: 'Leave Approval',

          balanceTrackingVersion: 0,

          balanceDeductionApplied: false
        })
      );
    });

    setStored(
      STORAGE_KEYS.APPROVALS,
      records
    );

    setStored(
      STORAGE_KEYS.LEAVE_MIGRATION,
      true
    );

    return records;
  }

  if (
    JSON.stringify(stored) !==
    JSON.stringify(records)
  ) {
    setStored(
      STORAGE_KEYS.APPROVALS,
      records
    );
  }

  return records;
};

const saveApprovalRecords = records => {
  setStored(
    STORAGE_KEYS.APPROVALS,
    records.map(normalizeApprovalRecord)
  );

  return records;
};

// ============================================================
// TEAM MEMBER STORAGE
// ============================================================

const getBaseTeamMemberRecords = () => {
  const storedMembers = getStored(
    STORAGE_KEYS.MEMBERS,
    null
  );

  const initialized = getStored(
    STORAGE_KEYS.MEMBERS_INITIALIZED,
    false
  );

  if (
    !Array.isArray(storedMembers) ||
    (!storedMembers.length && !initialized)
  ) {
    const members = initialTeamMembers.map(
      member => ({
        ...member
      })
    );

    setStored(
      STORAGE_KEYS.MEMBERS,
      members
    );

    setStored(
      STORAGE_KEYS.MEMBERS_INITIALIZED,
      true
    );

    return members;
  }

  if (!initialized) {
    setStored(
      STORAGE_KEYS.MEMBERS_INITIALIZED,
      true
    );
  }

  return storedMembers;
};

// ============================================================
// LEAVE BALANCE CALCULATIONS
// ============================================================

const getEffectiveLeaveBalance = (
  employee,
  approvalRecords = getApprovalRecords()
) => {
  const baseBalance =
    employee?.leaveBalance || {};

  const balance = Object.fromEntries(
    Object.entries(baseBalance).map(
      ([key, value]) => [
        key,
        value &&
        typeof value === 'object'
          ? { ...value }
          : value
      ]
    )
  );

  const countedIds = new Set();

  const approvedLeaves = approvalRecords.filter(
    request =>
      request.category === 'Leave Approval' &&
      request.status === 'approved' &&
      request.balanceTrackingVersion === 1 &&
      request.balanceDeductionApplied === true &&
      matchesEmployeeId(
        employee,
        request.employeeId
      )
  );

  approvedLeaves.forEach(request => {
    const id = String(request.id);

    if (countedIds.has(id)) return;

    countedIds.add(id);

    const key =
      request.balanceKey ||
      getLeaveBalanceKey(request.requestType);

    const days = Number(
      request.totalDays
    );

    if (
      !key ||
      !Number.isFinite(days) ||
      days <= 0
    ) {
      return;
    }

    if (key === 'unpaid') {
      balance.unpaid =
        (Number(balance.unpaid) || 0) + days;

      return;
    }

    const actualKey =
      key === 'earned' &&
      !balance.earned &&
      balance.annual
        ? 'annual'
        : key;

    const entry = balance[actualKey];

    if (
      !entry ||
      entry.remaining == null ||
      !Number.isFinite(
        Number(entry.remaining)
      )
    ) {
      return;
    }

    balance[actualKey] = {
      ...entry,
      used: (Number(entry.used) || 0) + days,
      remaining: Math.max(
        0,
        Number(entry.remaining) - days
      )
    };

    if (
      actualKey === 'earned' &&
      balance.annual
    ) {
      balance.annual = {
        ...balance[actualKey]
      };
    }
  });

  return balance;
};

const getTeamMemberRecords = () =>
  getBaseTeamMemberRecords().map(member => ({
    ...member,

    leaveBalance:
      getEffectiveLeaveBalance(member)
  }));

const DEMO_TEAM_LEAD_LEAVE_BALANCE = {
  casual: { used: 0, total: 12, remaining: 12 },
  sick: { used: 0, total: 10, remaining: 10 },
  earned: { used: 0, total: 15, remaining: 15 },
  optional: { used: 0, total: 2, remaining: 2 },
  unpaid: 0
};

const getLeaveEmployee = employeeId => {
  const member = getBaseTeamMemberRecords().find(
    item => matchesEmployeeId(item, employeeId)
  );

  if (member) return member;

  if (matchesEmployeeId(currentTeamLead, employeeId)) {
    return {
      ...currentTeamLead,
      employeeId: userIdOf(currentTeamLead),
      designation: currentTeamLead.designation ||
        currentTeamLead.role,
      leaveBalance: currentTeamLead.leaveBalance ||
        DEMO_TEAM_LEAD_LEAVE_BALANCE
    };
  }

  return null;
};

const getAvailableLeaveBalance = (
  employee,
  balanceKey,
  records
) => {
  if (balanceKey === 'unpaid') {
    return Infinity;
  }

  const balance =
    getEffectiveLeaveBalance(
      employee,
      records
    );

  const entry =
    balance[balanceKey] ||
    (
      balanceKey === 'earned'
        ? balance.annual
        : null
    );

  if (
    entry?.remaining == null ||
    !Number.isFinite(
      Number(entry.remaining)
    )
  ) {
    return null;
  }

  return Number(entry.remaining);
};

const validateAvailableLeave = (
  employee,
  balanceKey,
  totalDays,
  records,
  ignoredId = null,
  reservePending = false
) => {
  if (balanceKey === 'unpaid') return;

  const available =
    getAvailableLeaveBalance(
      employee,
      balanceKey,
      records
    );

  if (available === null) {
    throw new Error(
      'Leave entitlement is unavailable. Please contact HR.'
    );
  }

  const reservedDays = reservePending
    ? records.filter(
        request =>
          request.category === 'Leave Approval' &&
          request.status === 'pending' &&
          !sameId(request.id, ignoredId) &&
          matchesEmployeeId(
            employee,
            request.employeeId
          ) &&
          getLeaveBalanceKey(
            request.requestType
          ) === balanceKey
      ).reduce(
        (sum, request) =>
          sum + Math.max(
            0,
            Number(request.totalDays) || 0
          ),
        0
      )
    : 0;

  if (totalDays > available - reservedDays) {
    throw new Error(
      'Insufficient available leave balance.'
    );
  }
};

const validateLeaveOverlap = (
  employee,
  fromDate,
  toDate,
  records,
  ignoredId = null
) => {
  const overlapping = records.some(request => {
    if (
      request.category !== 'Leave Approval' ||
      request.status === 'rejected' ||
      sameId(request.id, ignoredId) ||
      !matchesEmployeeId(
        employee,
        request.employeeId
      )
    ) {
      return false;
    }

    const start = normalizeDateKey(
      request.fromDate
    );

    const end = normalizeDateKey(
      request.toDate
    );

    return Boolean(
      start &&
      end &&
      fromDate <= end &&
      toDate >= start
    );
  });

  if (overlapping) {
    throw new Error(
      'A pending or approved leave request already overlaps these dates.'
    );
  }
};

// ============================================================
// TASK SEED CONFIGURATION
// ============================================================

const DEFAULT_PROJECT_TASKS =
  Object.fromEntries(
    [
      ...Array.from(
        { length: 10 },
        (_, index) => `TSK-${301 + index}`
      ),
      'TSK-1052-01',
      'TSK-1052-02',
      'TSK-1052-03'
    ].map(id => [id, 'PRJ-1052'])
  );

const SEEDED_PROJECT_TASKS = [
  {
    id: 'TSK-1052-01',
    title: 'TDS slab calculation API',
    description:
      'Implement and validate the tax slab calculation endpoint.',
    assigneeId: 'EMP-2003',
    assigneeName: 'Anil Reddy',
    category: 'Project',
    priority: 'High',
    status: 'Completed',
    progress: 100,
    startDate: '2026-10-16',
    dueDate: '2026-11-10',
    projectId: 'PRJ-1052',
    comments: []
  },
  {
    id: 'TSK-1052-02',
    title: 'Payslip PDF template alignment',
    description:
      'Align generated payslips with the approved finance template.',
    assigneeId: 'EMP-2001',
    assigneeName: 'Ravi Kumar',
    category: 'Project',
    priority: 'High',
    status: 'To Do',
    progress: 0,
    startDate: '2026-11-20',
    dueDate: '2026-12-15',
    projectId: 'PRJ-1052',
    comments: []
  },
  {
    id: 'TSK-1052-03',
    title: 'PF compliance reconciliation',
    description:
      'Reconcile provident fund contribution rules with monthly payroll data.',
    assigneeId: 'EMP-2003',
    assigneeName: 'Anil Reddy',
    category: 'Project',
    priority: 'High',
    status: 'In Progress',
    progress: 20,
    startDate: '2026-11-01',
    dueDate: '2026-12-08',
    projectId: 'PRJ-1052',
    comments: []
  }
];

const RETIRED_PROJECT_TASK_IDS = new Set([
  'TSK-1048-01',
  'TSK-1048-02',
  'TSK-1059-01',
  'TSK-1059-02',
  'TSK-1035-01',
  'TSK-1035-02'
]);

const createInitialTaskRecords = () => {
  const tasks = initialTasks
    .filter(task =>
      !RETIRED_PROJECT_TASK_IDS.has(task.id)
    )
    .map(task => ({
      ...task,

      projectId:
        task.projectId ??
        DEFAULT_PROJECT_TASKS[task.id] ??
        null,

      comments: [
        ...safeArray(task.comments)
      ]
    }));

  const existingIds = new Set(
    tasks.map(task => String(task.id))
  );

  SEEDED_PROJECT_TASKS.forEach(task => {
    if (!existingIds.has(String(task.id))) {
      tasks.push({
        ...task,
        comments: []
      });
    }
  });

  return tasks;
};

const getTaskRecords = () => {
  const storedTasks = getStored(
    STORAGE_KEYS.TASKS,
    null
  );

  const initialized = getStored(
    STORAGE_KEYS.TASKS_INITIALIZED,
    false
  );

  const migrated = getStored(
    STORAGE_KEYS.TASKS_MIGRATED,
    false
  );

  if (
    !Array.isArray(storedTasks) ||
    (!storedTasks.length && !initialized)
  ) {
    const tasks = createInitialTaskRecords();

    setStored(STORAGE_KEYS.TASKS, tasks);
    setStored(STORAGE_KEYS.TASKS_INITIALIZED, true);
    setStored(STORAGE_KEYS.TASKS_MIGRATED, true);

    return tasks;
  }

  if (!migrated) {
    const migratedTasks = storedTasks.map(
      task => {
        if (
          !Object.prototype.hasOwnProperty.call(
            task,
            'projectId'
          ) &&
          DEFAULT_PROJECT_TASKS[task.id]
        ) {
          return {
            ...task,
            projectId:
              DEFAULT_PROJECT_TASKS[task.id]
          };
        }

        return task;
      }
    );

    setStored(
      STORAGE_KEYS.TASKS,
      migratedTasks
    );

    setStored(
      STORAGE_KEYS.TASKS_MIGRATED,
      true
    );

    setStored(
      STORAGE_KEYS.TASKS_INITIALIZED,
      true
    );

    return migratedTasks;
  }

  if (!initialized) {
    setStored(
      STORAGE_KEYS.TASKS_INITIALIZED,
      true
    );
  }

  return storedTasks;
};

// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {
  async getCurrentUser() {
    return getStored(
      STORAGE_KEYS.USER,
      currentTeamLead
    );
  },

  async updateProfile(updates) {
    const current = getStored(
      STORAGE_KEYS.USER,
      currentTeamLead
    );

    const allowedFields = new Set([
      'name',
      'firstName',
      'lastName',
      'phone',
      'email',
      'location',
      'avatarUrl',
      'address',
      'bio',
      'alternatePhone',
      'personalEmail'
    ]);

    const safeUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(
        ([key]) => allowedFields.has(key)
      )
    );

    const updated = {
      ...current,
      ...safeUpdates
    };

    setStored(STORAGE_KEYS.USER, updated);

    return updated;
  },

  async changePassword({
    currentPassword,
    newPassword
  }) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error(
        'Password must be at least 6 characters long.'
      );
    }

    return {
      success: false,
      message:
        'Password change requires authentication backend integration.'
    };
  }
};

// ============================================================
// TEAM SERVICE
// ============================================================

export const teamService = {
  async getTeamMembers(user = currentTeamLead) {
    const members = getTeamMemberRecords();

    return getScopedTeamMembers(
      user,
      members
    );
  },

  async getMemberById(
    id,
    user = currentTeamLead
  ) {
    const members = getTeamMemberRecords();

    const member = members.find(
      item => matchesEmployeeId(item, id)
    );

    return member &&
      canAccessEmployee(user, member, members)
        ? member
        : null;
  }
};

// ============================================================
// COMMON DECISION VALIDATION
// ============================================================

const validateDecision = (
  status,
  reason,
  allowEmptyComment = false
) => {
  const decision = normalize(status);
  const comment = String(reason || '').trim();

  if (
    !['approved', 'rejected'].includes(decision)
  ) {
    throw new Error(
      'Invalid approval decision.'
    );
  }

  if (
    decision === 'rejected' &&
    !comment
  ) {
    throw new Error(
      'Rejection reason is required.'
    );
  }

  if (
    !allowEmptyComment &&
    !comment
  ) {
    throw new Error(
      'A decision comment is required.'
    );
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    throw new Error(
      'Decision comments cannot exceed 300 characters.'
    );
  }

  return {
    decision,
    comment
  };
};

const hasHRPermission = user => {
  if (!userIdOf(user)) return false;

  return (
    isSuperAdminUser(user) ||
    [
      'hr',
      'hr manager',
      'hr_manager',
      'human resources'
    ].includes(
      normalize(
        user.systemRole || user.role
      )
    )
  );
};

// ============================================================
// SHARED LEAVE DECISION ENGINE
// ============================================================

const processLeaveDecision = (
  id,
  approver,
  status,
  reason,
  user,
  options = {}
) => {
  const isHR = approver === 'HR';

  if (isHR) {
    if (!hasHRPermission(user)) {
      throw new Error(
        'HR approval permission is required.'
      );
    }
  } else {
    requirePermission(
      user,
      canManageApprovals,
      'Team Lead approval permission is required.'
    );
  }

  const { decision, comment } =
    validateDecision(
      status,
      reason,
      options.allowEmptyComment === true
    );

  const approvals = getApprovalRecords();

  const target = approvals.find(
    item =>
      item.category === 'Leave Approval' &&
      (
        sameId(item.id, id) ||
        sameId(item.legacyLeaveRequestId, id)
      )
  );

  if (!target) {
    throw new Error(
      'Leave request not found.'
    );
  }

  if (
    matchesEmployeeId(
      user,
      target.employeeId
    )
  ) {
    throw new Error(
      'You cannot approve or reject your own leave request.'
    );
  }

  const members = getTeamMemberRecords();

  if (
    !isHR &&
    !getScopedApprovals(
      user,
      [target],
      members
    ).length
  ) {
    throw new Error(
      'This request is outside your authorized team.'
    );
  }

  if (target.status !== 'pending') {
    throw new Error(
      'This leave request has already been finalized.'
    );
  }

  if (
    isHR &&
    target.teamLeadApproval !== 'approved'
  ) {
    throw new Error(
      'Team Lead approval is required before HR review.'
    );
  }

  const approvalKey = isHR
    ? 'hrApproval'
    : 'teamLeadApproval';

  if (target[approvalKey] !== 'pending') {
    throw new Error(
      'This review has already been completed.'
    );
  }

  const timestamp =
    new Date().toISOString();

  const actor = {
    name: user.name || approver,
    employeeId: userIdOf(user),
    role: user.systemRole || user.role || approver
  };

  const updated = normalizeApprovalRecord({
    ...target,

    [approvalKey]: decision,

    decidedBy: actor,

    decidedAt: timestamp,

    decisionReason: comment,

    comments: [
      ...safeArray(target.comments),

      {
        id: generateId('LC'),
        text: `${approver} ${decision}: ${comment}`,
        author: actor.name,
        authorId: actor.employeeId,
        createdAt: timestamp
      }
    ],

    activity: [
      ...safeArray(target.activity),

      {
        event: `${approver} ${decision}`,
        detail: comment,
        at: timestamp
      }
    ],

    approvalTasks: safeArray(
      target.approvalTasks
    ).map(task => {
      const taskApprover =
        task.approver === 'Manager'
          ? 'Team Lead'
          : task.approver;

      if (taskApprover === approver) {
        return {
          ...task,

          approver: taskApprover,

          status:
            formatApprovalStatus(decision),

          decisionComment: comment,

          decidedAt: timestamp
        };
      }

      if (
        taskApprover === 'HR' &&
        !isHR
      ) {
        return {
          ...task,

          notificationStatus:
            decision === 'approved'
              ? 'Available in HR queue'
              : 'Not Required',

          notifiedAt: null
        };
      }

      return task;
    })
  });

  // Final balance deduction is enabled only
  // for requests created under the new workflow.

  if (
    updated.status === 'approved' &&
    updated.balanceTrackingVersion === 1
  ) {
    const employee = getLeaveEmployee(
      updated.employeeId
    );

    if (!employee) {
      throw new Error(
        'Employee leave balance record is unavailable.'
      );
    }

    const balanceKey =
      getLeaveBalanceKey(
        updated.requestType
      );

    const totalDays = Number(
      updated.totalDays
    );

    if (
      !balanceKey ||
      !Number.isFinite(totalDays) ||
      totalDays <= 0
    ) {
      throw new Error(
        'Invalid leave entitlement or duration.'
      );
    }

    validateLeaveOverlap(
      employee,
      normalizeDateKey(updated.fromDate),
      normalizeDateKey(updated.toDate),
      approvals.filter(
        request => request.status === 'approved'
      ),
      updated.id
    );

    validateAvailableLeave(
      employee,
      balanceKey,
      totalDays,
      approvals,
      updated.id
    );

    updated.balanceKey = balanceKey;

    updated.balanceDeductionApplied = true;

    updated.balanceDeductedAt = timestamp;
  }

  updated.hrReview =
    updated.status === 'rejected'
      ? (
          updated.teamLeadApproval === 'rejected'
            ? 'Not required'
            : 'HR rejected'
        )
      : updated.status === 'approved'
        ? 'HR approved'
        : updated.reviewStage === 'hr-review'
          ? 'Pending HR review'
          : 'Awaiting Team Lead review';

  if (updated.reviewStage === 'hr-review') {
    updated.activity.push({
      event: 'Forwarded to HR',
      detail:
        'Team Lead approved the leave request. Final HR review is pending.',
      at: timestamp
    });
  }

  updated.notifications = [
    ...safeArray(updated.notifications),

    {
      recipientRole: 'Employee',
      recipientId: updated.employeeId,
      recipient: updated.employeeName,
      type: 'Leave Status Update',

      message:
        updated.reviewStage === 'hr-review'
          ? 'Your leave request was approved by the Team Lead and is awaiting HR approval.'
          : `Your leave request has been ${updated.status}.`,

      status: 'Available in portal',

      createdAt: timestamp
    }
  ];

  saveApprovalRecords(
    approvals.map(item =>
      sameId(item.id, target.id)
        ? updated
        : item
    )
  );

  emitApprovalUpdate({
    approvalId: updated.id,
    employeeId: updated.employeeId,
    status: updated.status,
    reviewStage: updated.reviewStage
  });

  return updated;
};

// ============================================================
// APPROVAL SERVICE
// ============================================================

export const approvalService = {
  async getApprovals(
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    return getScopedApprovals(
      user,
      getApprovalRecords(),
      members
    );
  },

  async getApprovalById(
    id,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    const approval = getApprovalRecords().find(
      item => sameId(item.id, id)
    );

    return getScopedApprovals(
      user,
      approval ? [approval] : [],
      members
    )[0] || null;
  },

  async decide(
    id,
    status,
    reason,
    decidedBy,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    return this.decideApproval(
      id,
      status,
      reason,
      decidedBy,
      user,
      members
    );
  },

  async decideApproval(
    id,
    status,
    reason = '',
    decidedBy = null,
    user = currentTeamLead,
    members = getTeamMemberRecords(),
    options = {}
  ) {
    requirePermission(
      user,
      canManageApprovals,
      'You do not have permission to review approvals.'
    );

    const approvals = getApprovalRecords();

    const target = approvals.find(
      item => sameId(item.id, id)
    );

    if (
      !target ||
      !getScopedApprovals(
        user,
        [target],
        getTeamMemberRecords()
      ).length
    ) {
      throw new Error(
        'Approval is outside your authorized team.'
      );
    }

    if (target.category === 'Leave Approval') {
      return processLeaveDecision(
        id,
        'Team Lead',
        status,
        reason,
        user,
        options
      );
    }

        // TIMESHEET_CORRECTION_V1

    const isCorrection =
      normalize(status) === 'correction-required';

    if (
      isCorrection &&
      target.category !== 'Timesheet Approval'
    ) {
      throw new Error(
        'Correction requests are available for timesheets only.'
      );
    }

    const validatedDecision = validateDecision(
      isCorrection ? 'rejected' : status,
      reason,
      isCorrection
        ? false
        : options.allowEmptyComment === true
    );

    const decision = isCorrection
      ? 'correction-required'
      : validatedDecision.decision;

    const comment = validatedDecision.comment;

    if (
      matchesEmployeeId(
        user,
        target.employeeId
      )
    ) {
      throw new Error(
        'You cannot approve your own request.'
      );
    }

    if (normalize(target.status) !== 'pending') {
      throw new Error(
        'This request has already been reviewed.'
      );
    }

    const timestamp =
      new Date().toISOString();

    if (
        target.category === 'Timesheet Approval' &&
        target.timesheetVersion === 1 &&
        decision === 'approved'
      ) {

        const employee = getBaseTeamMemberRecords()
          .find(member =>
            matchesEmployeeId(
              member,
              target.employeeId
            )
          );

        if (!employee) {

          throw new Error(
            'Employee attendance record is unavailable.'
          );

        }

        const verifiedHours =
          validateTimesheetAttendance(
            target,
            employee
          );

        if (
          Math.abs(
            verifiedHours -
            Number(target.submittedHours)
          ) > 0.000001 ||
          !Number.isFinite(Number(target.submittedHours))
        ) {

          throw new Error(
            'Timesheet total does not match verified attendance.'
          );

        }

      }

      const updated = {
        ...target,
        status: decision,

      comments: [
        ...safeArray(target.comments),

        ...(comment
          ? [
              `${decision === "correction-required" ? "Correction Required" : formatApprovalStatus(decision)}: ${comment}`
            ]
          : [])
      ],

      decidedBy: {
        name: user.name || decidedBy?.name,
        employeeId: userIdOf(user),
        role: user.role || user.systemRole
      },

      decidedAt: timestamp,

      decisionReason: comment,

      hrReview:
        decision === 'correction-required'
          ? 'Awaiting employee correction'
          : decision === 'rejected'
            ? 'Not required'
            : 'Pending HR review'
    };

    let correctionPlan = null;

      if (
        target.category === 'Attendance Regularization' &&
        decision === 'approved'
      ) {

        const employee = getScopedTeamMembers(
          user,
          getTeamMemberRecords()
        ).find(member =>
          matchesEmployeeId(
            member,
            target.employeeId
          )
        );

        if (!employee) {
          throw new Error(
            'Employee attendance access is restricted.'
          );
        }

        correctionPlan = prepareAttendanceCorrection(
          target,
          employee,
          updated.decidedBy,
          comment
        );

        const submittedSnapshot =
          target.originalPunchSnapshot;

        if (submittedSnapshot) {

          const original =
            correctionPlan.correction.before;

          if (

            submittedSnapshot.checkInTime !==
              original.checkInTime ||

            submittedSnapshot.checkOutTime !==
              original.checkOutTime ||

            submittedSnapshot.breakMilliseconds !==
              correctionPlan.corrected.accumulatedBreakMilliseconds

          ) {

            throw new Error(
              'Attendance changed after this request was submitted. Reject this request and obtain an updated correction request.'
            );

          }
        }

        updated.attendanceCorrection =
          correctionPlan.correction;
      }

      const saveDecision = () =>
        saveApprovalRecords(
          approvals.map(item =>
            sameId(item.id, id)
              ? updated
              : item
          )
        );

      if (correctionPlan) {

        commitAttendanceCorrection(
          correctionPlan,
          saveDecision
        );

      } else {

        saveDecision();

      }

      emitApprovalUpdate({
        approvalId: id,
        employeeId: target.employeeId,
        status: decision
      });

    return updated;
  }
};

// ============================================================
// LEAVE SERVICE
// ============================================================

// ============================================================
// EMPLOYEE_REGULARIZATION_SERVICE_V1
// ============================================================

const REGULARIZATION_TYPES = [
  'Missed Check-in',
  'Missed Check-out',
  'Incorrect Punch Time'
];

const resolveRegularizationUser = async requestedUser => {

  const authenticated =
    await authService.getCurrentUser();

  requireAuthorizedUser(authenticated);

  if (!isSuperAdminUser(authenticated)) {

    if (
      requestedUser &&
      !matchesEmployeeId(
        authenticated,
        userIdOf(requestedUser)
      )
    ) {
      throw new Error(
        'Attendance requests are restricted to your own account.'
      );
    }

    return authenticated;
  }

  const user = requestedUser || authenticated;

  requireAuthorizedUser(user);

  return user;
};

const resolveRegularizationMember = user => {

  const ids = getIdentityIds(user);

  const members = getBaseTeamMemberRecords()
    .filter(member =>
      ids.some(id =>
        matchesEmployeeId(member, id)
      )
    );

  if (members.length > 1) {
    throw new Error(
      'Employee attendance identity is ambiguous.'
    );
  }

  return members[0] || null;
};

const regularizationLocalDate = (
  value = new Date()
) => {

  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

export const attendanceRegularizationService = {

  async getMyRequests(requestedUser) {

    const user =
      await resolveRegularizationUser(
        requestedUser
      );

    const member =
      resolveRegularizationMember(user);

    return getApprovalRecords()

      .filter(request =>
        request.category === 'Attendance Regularization' &&

        (
          matchesEmployeeId(
            user,
            request.employeeId
          ) ||

          (
            member &&
            matchesEmployeeId(
              member,
              request.employeeId
            )
          )
        )
      )

      .sort((first, second) =>

        (
          Date.parse(
            second.submittedAt ||
            second.requestDate ||
            ''
          ) || 0
        ) -

        (
          Date.parse(
            first.submittedAt ||
            first.requestDate ||
            ''
          ) || 0
        )

      );
  },

  async submitRequest(input, requestedUser) {

    const user =
      await resolveRegularizationUser(
        requestedUser
      );

    const member =
      resolveRegularizationMember(user);

    if (!member) {

      throw new Error(
        'Your account is not registered in the employee approval roster. Contact the administrator.'
      );

    }

    const employeeId = String(
      member.employeeId ||
      member.id ||
      ''
    );

    if (!employeeId) {
      throw new Error(
        'Employee attendance identity is unavailable.'
      );
    }

    const requestType = String(
      input?.requestType || ''
    ).trim();

    const attendanceDate = normalizeDateKey(
      input?.attendanceDate
    );

    const reason = String(
      input?.reason || ''
    ).trim();

    if (!REGULARIZATION_TYPES.includes(requestType)) {
      throw new Error(
        'Select a valid correction type.'
      );
    }

    if (
      !attendanceDate ||
      attendanceDate !== input?.attendanceDate ||
      attendanceDate > regularizationLocalDate()
    ) {
      throw new Error(
        'Select a valid past or current attendance date.'
      );
    }

    if (!reason || reason.length > 1000) {
      throw new Error(
        'Enter a correction reason of up to 1000 characters.'
      );
    }

    const requestedCheckIn =
      typeof input?.requestedCheckIn === 'string'
        ? input.requestedCheckIn.trim()
        : '';

    const requestedCheckOut =
      typeof input?.requestedCheckOut === 'string'
        ? input.requestedCheckOut.trim()
        : '';

    if (
      requestType === 'Missed Check-in' &&
      (!requestedCheckIn || requestedCheckOut)
    ) {
      throw new Error(
        'Provide the missing check-in time only.'
      );
    }

    if (
      requestType === 'Missed Check-out' &&
      (!requestedCheckOut || requestedCheckIn)
    ) {
      throw new Error(
        'Provide the missing check-out time only.'
      );
    }

    if (!requestedCheckIn && !requestedCheckOut) {
      throw new Error(
        'Enter at least one corrected punch time.'
      );
    }

    const approvals = getApprovalRecords();

    const duplicate = approvals.some(request =>

      request.category === 'Attendance Regularization' &&

      matchesEmployeeId(
        member,
        request.employeeId
      ) &&

      normalize(request.status) === 'pending' &&

      normalizeDateKey(
        request.attendanceDate ||
        request.date ||
        request.fromDate
      ) === attendanceDate

    );

    if (duplicate) {
      throw new Error(
        'A pending correction request already exists for this date.'
      );
    }

    const timestamp =
      new Date().toISOString();

    const request = {

      id: generateId('AR'),

      category: 'Attendance Regularization',

      employeeId,

      employeeName:
        member.name ||
        member.fullName ||
        user.name ||
        'Employee',

      department:
        member.department ||
        member.dept ||
        '',

      designation:
        member.designation || '',

      teamLeadId:
        member.teamLeadId || null,

      managerId:
        member.managerId || null,

      requestType,

      correctionType: requestType,

      attendanceDate,

      fromDate: attendanceDate,

      toDate: attendanceDate,

      requestedCheckIn:
        requestedCheckIn || null,

      requestedCheckOut:
        requestedCheckOut || null,

      reason,

      status: 'pending',

      requestDate: timestamp,

      submittedAt: timestamp,

      comments: [],

      activity: [
        {
          event: 'Submitted',
          detail: reason,
          at: timestamp
        }
      ]
    };

    // Validate against existing attendance storage.
    // This prepares a correction without saving punches.

    const plan = prepareAttendanceCorrection(
      request,
      member,
      null,
      ''
    );

    const original =
      plan.correction.before;

    if (
      requestType === 'Missed Check-in' &&
      original.checkInTime
    ) {
      throw new Error(
        'Check-in already exists. Select Incorrect Punch Time instead.'
      );
    }

    if (
      requestType === 'Missed Check-out' &&
      original.checkOutTime
    ) {
      throw new Error(
        'Check-out already exists. Select Incorrect Punch Time instead.'
      );
    }

    request.originalCheckIn =
      original.checkInTime;

    request.originalCheckOut =
      original.checkOutTime;

    // Store validated timestamps, not ambiguous
    // browser-local time strings.

    request.requestedCheckIn =
      requestedCheckIn
        ? plan.correction.after.checkInTime
        : null;

    request.requestedCheckOut =
      requestedCheckOut
        ? plan.correction.after.checkOutTime
        : null;

    request.originalPunchSnapshot = {

      checkInTime:
        original.checkInTime,

      checkOutTime:
        original.checkOutTime,

      breakMilliseconds:
        plan.corrected.accumulatedBreakMilliseconds
    };

    // Only the request is saved.
    // Actual attendance changes require approval.

    saveApprovalRecords([
      request,
      ...approvals
    ]);

    emitApprovalUpdate({

      approvalId: request.id,

      employeeId,

      status: 'pending',

      category:
        'Attendance Regularization'
    });

    return request;
  }
};

// ============================================================
// EMPLOYEE_TIMESHEET_SERVICE_V1
// ============================================================

const timesheetDateKey = value => {

  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

};

const timesheetWeekDates = start => {

  if (normalizeDateKey(start) !== start || !start) {
    throw new Error('Select a valid week start date.');
  }

  const first = new Date(`${start}T00:00:00`);

  if (first.getDay() !== 1) {
    throw new Error('The timesheet week must start on Monday.');
  }

  return Array.from({ length: 7 }, (_, index) => {

    const date = new Date(first);

    date.setDate(first.getDate() + index);

    return timesheetDateKey(date);

  });

};

const resolveTimesheetAccount = async requestedUser => {

  const authenticated =
    await authService.getCurrentUser();

  requireAuthorizedUser(authenticated);

  let user = authenticated;

  if (requestedUser) {

    if (
      !isSuperAdminUser(authenticated) &&
      !matchesEmployeeId(
        authenticated,
        userIdOf(requestedUser)
      )
    ) {
      throw new Error(
        'You can access only your own timesheets.'
      );
    }

    if (isSuperAdminUser(authenticated)) {
      user = requestedUser;
    }

  }

  requireAuthorizedUser(user);

  const members = getBaseTeamMemberRecords();

  const matches = members.filter(member =>
    getIdentityIds(user).some(id =>
      matchesEmployeeId(member, id)
    )
  );

  if (matches.length !== 1) {
    throw new Error(
      'Your employee timesheet identity is unavailable or ambiguous.'
    );
  }

  return {
    user,
    member: matches[0],
    members
  };

};

// Read confirmed completed attendance.
// Never invent missing punches or break durations.

const getTimesheetAttendanceHours = (
  member,
  dateKey
) => {

  const employeeId = String(
    member.employeeId ||
    member.id ||
    ''
  );

  if (!employeeId) return null;

  const daily = readStorage(
    `technomold_teamlead_attendance_${employeeId}_${dateKey}`,
    null
  );

  const history = safeArray(
    readStorage(
      `technomold_teamlead_personal_attendance_${employeeId}`,
      []
    )
  );

  const matchingHistory = history.filter(
    item => item?.dateKey === dateKey
  );

  if (!daily && matchingHistory.length !== 1) {
    return null;
  }

  const record =
    daily || matchingHistory[0];

  if (!record) return null;

  const rawIn =
    record.checkInTime ??
    record.checkIn;

  const rawOut =
    record.checkOutTime ??
    record.checkOut;

  if (
    rawIn == null ||
    rawOut == null ||
    rawIn === '' ||
    rawOut === ''
  ) {
    return null;
  }

  const start = new Date(rawIn).getTime();

  const end = new Date(rawOut).getTime();

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start <= 0 ||
    end <= start ||
    end > Date.now() ||
    end - start > 86400000 ||
    timesheetDateKey(start) !== dateKey ||
    record.breakStartTime ||
    record.activeBreak
  ) {
    return null;
  }

  let breakSeconds = null;

  if (
    record.accumulatedBreakMilliseconds != null &&
    record.accumulatedBreakMilliseconds !== ''
  ) {

    breakSeconds =
      Number(record.accumulatedBreakMilliseconds) / 1000;

  } else {

    const rawBreak =
      record.accumulatedBreakSeconds ??
      record.breakSeconds;

    if (rawBreak != null && rawBreak !== '') {
      breakSeconds = Number(rawBreak);
    }

  }

  if (
    breakSeconds === null ||
    !Number.isFinite(breakSeconds) ||
    breakSeconds < 0 ||
    breakSeconds > (end - start) / 1000
  ) {
    return null;
  }

  const workingSeconds =
    (end - start) / 1000 - breakSeconds;

  return Math.floor(workingSeconds / 36) / 100;

};

const getTimesheetAssignedOptions = async account => {

  const {
    user,
    member,
    members
  } = account;

  const projects = safeArray(
    await projectService.getProjects(
      user,
      members
    )
  );

  const assignedProjects = projects.filter(
    project =>
      safeArray(project.memberIds).some(id =>
        matchesEmployeeId(member, id)
      ) ||
      matchesEmployeeId(member, project.ownerId) ||
      matchesEmployeeId(member, project.teamLeadId)
  );

  const tasks = safeArray(
    await taskService.getTasks(
      user,
      members
    )
  ).filter(task =>
    matchesEmployeeId(
      member,
      task.assigneeId || task.employeeId
    ) &&
    assignedProjects.some(project =>
      sameId(project.id, task.projectId)
    )
  );

  return {
    projects: assignedProjects,
    tasks
  };

};

// Validate submitted hours again at approval time.

const validateTimesheetAttendance = (
  request,
  member
) => {

  const dates = timesheetWeekDates(
    request.weekStart || request.fromDate
  );

  if (
    request.toDate !== dates[6] ||
    dates[6] > timesheetDateKey(Date.now())
  ) {
    throw new Error('Invalid or incomplete timesheet week.');
  }

  const entries = safeArray(
    request.timesheetEntries
  );

  if (!entries.length || entries.length > 7) {
    throw new Error('Enter valid daily timesheet records.');
  }

  const seenDates = new Set();

  let total = 0;

  for (const entry of entries) {

    if (
      !dates.includes(entry.date) ||
      seenDates.has(entry.date)
    ) {
      throw new Error(
        'Duplicate or invalid daily timesheet date.'
      );
    }

    seenDates.add(entry.date);

    const hours = Number(entry.hours);

    if (
      !Number.isFinite(hours) ||
      hours <= 0 ||
      hours > 24 ||
      Math.abs(hours * 100 - Math.round(hours * 100)) > 0.000001
    ) {
      throw new Error(
        'Enter positive working hours with at most two decimal places.'
      );
    }

    const attendanceHours =
      getTimesheetAttendanceHours(
        member,
        entry.date
      );

    if (attendanceHours === null) {
      throw new Error(
        `No confirmed completed attendance for ${entry.date}.`
      );
    }

    if (hours > attendanceHours + 0.000001) {

      throw new Error(
        `Hours entered for ${entry.date} exceed confirmed attendance (${attendanceHours}h).`
      );

    }

    total += hours;

  }

  return Math.round(total * 100) / 100;

};

export const employeeTimesheetService = {

  async getMyRequests(requestedUser) {

    const { member } =
      await resolveTimesheetAccount(requestedUser);

    return getApprovalRecords()

      .filter(request =>
        request.category === 'Timesheet Approval' &&
        matchesEmployeeId(
          member,
          request.employeeId
        )
      )

      .sort((first, second) =>
        (Date.parse(second.submittedAt || second.requestDate) || 0) -
        (Date.parse(first.submittedAt || first.requestDate) || 0)
      );

  },

  async getOptions(requestedUser) {

    const account =
      await resolveTimesheetAccount(requestedUser);

    return getTimesheetAssignedOptions(account);

  },

  async getWeekAttendance(weekStart, requestedUser) {

    const { member } =
      await resolveTimesheetAccount(requestedUser);

    return Object.fromEntries(

      timesheetWeekDates(weekStart).map(date => [

        date,

        getTimesheetAttendanceHours(
          member,
          date
        )

      ])

    );

  },

  async submit(input, requestedUser) {

    const account =
      await resolveTimesheetAccount(requestedUser);

    const {
      member
    } = account;

    const dates = timesheetWeekDates(
      input?.weekStart
    );

    const weekStart = dates[0];
    const weekEnd = dates[6];

    if (weekEnd > timesheetDateKey(Date.now())) {

      throw new Error(
        'Submit a week ending today or earlier.'
      );

    }

    const reason =
      String(input?.reason || '').trim();

    if (!reason || reason.length > 1000) {

      throw new Error(
        'Enter work summary of up to 1000 characters.'
      );

    }

    const {
      projects,
      tasks
    } = await getTimesheetAssignedOptions(account);

    const entries = safeArray(input?.entries)
      .map(entry => {

        const project = projects.find(item =>
          sameId(item.id, entry.projectId)
        );

        if (!project) {
          throw new Error(
            'Select an assigned project for every work entry.'
          );
        }

        const task = entry.taskId
          ? tasks.find(item =>
              sameId(item.id, entry.taskId) &&
              sameId(item.projectId, project.id)
            )
          : null;

        if (entry.taskId && !task) {
          throw new Error(
            'Selected task is not assigned to your account.'
          );
        }

        return {

          id: generateId('TSE'),

          date: entry.date,

          projectId: project.id,

          projectName: project.name,

          taskId: task?.id || null,

          taskName: task?.title || null,

          hours: Number(entry.hours)

        };

      });

    const submittedHours =
      validateTimesheetAttendance({

        weekStart,

        toDate: weekEnd,

        timesheetEntries: entries

      }, member);

    // Read current approvals immediately before saving.

    const approvals = getApprovalRecords();

    const previous = input.requestId

      ? approvals.find(item =>
          sameId(item.id, input.requestId) &&
          item.category === 'Timesheet Approval' &&
          matchesEmployeeId(
            member,
            item.employeeId
          )
        )

      : null;

    if (input.requestId && !previous) {

      throw new Error(
        'Timesheet request not found.'
      );

    }

    if (
      previous &&
      normalize(previous.status) !== 'correction-required'
    ) {

      throw new Error(
        'Only timesheets returned for correction can be resubmitted.'
      );

    }

    if (
      previous &&
      (
        (previous.weekStart || previous.fromDate) !== weekStart ||
        (previous.weekEnd || previous.toDate) !== weekEnd
      )
    ) {

      throw new Error(
        'The original timesheet period cannot be changed.'
      );

    }

    const duplicate = approvals.some(request => {

      if (
        request.category !== 'Timesheet Approval' ||
        !matchesEmployeeId(
          member,
          request.employeeId
        ) ||
        sameId(request.id, previous?.id)
      ) {
        return false;
      }

      const start = normalizeDateKey(
        request.weekStart || request.fromDate
      );

      const end = normalizeDateKey(
        request.weekEnd || request.toDate
      );

      return Boolean(
        start &&
        end &&
        weekStart <= end &&
        weekEnd >= start
      );

    });

    if (duplicate) {

      throw new Error(
        'A timesheet already exists for this period.'
      );

    }

    const timestamp = new Date().toISOString();

    const projectNames = [
      ...new Set(
        entries.map(entry => entry.projectName)
      )
    ];

    const request = {

      ...previous,

      id: previous?.id || generateId('TS'),

      category: 'Timesheet Approval',

      requestType: 'Weekly Timesheet',

      employeeId: String(
        member.employeeId || member.id
      ),

      employeeName:
        member.name || member.fullName || 'Employee',

      department:
        member.department || member.dept || '',

      teamLeadId:
        member.teamLeadId || null,

      managerId:
        member.managerId || null,

      timesheetVersion: 1,

      weekStart,
      weekEnd,

      fromDate: weekStart,
      toDate: weekEnd,

      projectName: projectNames.join(', '),

      totalDays: entries.length,

      totalHours: submittedHours,

      submittedHours,

      timesheetEntries: entries,

      reason,

      status: 'pending',

      hrReview: 'Awaiting Team Lead review',

      requestDate:
        previous?.requestDate || timestamp,

      submittedAt: timestamp,

      decidedBy: null,
      decidedAt: null,
      decisionReason: '',

      revision:
        (Number(previous?.revision) || 0) + 1,

      timesheetRevisionHistory: [

        ...safeArray(previous?.timesheetRevisionHistory),

        ...(previous ? [{

          revision: previous.revision || 1,

          timesheetEntries:
            safeArray(previous.timesheetEntries),

          submittedHours:
            previous.submittedHours ??
            previous.totalHours,

          reason: previous.reason,

          submittedAt: previous.submittedAt,

          decidedAt: previous.decidedAt,

          decidedBy: previous.decidedBy,

          decisionReason: previous.decisionReason,

          status: previous.status

        }] : [])

      ],

      comments: safeArray(previous?.comments),

      activity: [

        ...safeArray(previous?.activity),

        {

          event: previous
            ? 'Resubmitted'
            : 'Submitted',

          detail: reason,

          at: timestamp

        }

      ]

    };

    saveApprovalRecords([

      request,

      ...approvals.filter(item =>
        !sameId(item.id, request.id)
      )

    ]);

    emitApprovalUpdate({

      approvalId: request.id,

      employeeId: request.employeeId,

      category: request.category,

      status: 'pending'

    });

    return request;

  }

};

export const leaveService = {

  async getMyLeaveBalance(user = currentTeamLead) {
    requireAuthorizedUser(user);

    const employee = getLeaveEmployee(
      userIdOf(user)
    );

    return employee
      ? getEffectiveLeaveBalance(employee)
      : null;
  },

  async getMyLeaveRequests(
    user = currentTeamLead
  ) {
    requireAuthorizedUser(user);

    return getApprovalRecords()
      .filter(request =>
        request.category === 'Leave Approval' &&
        matchesEmployeeId(
          user,
          request.employeeId
        )
      )
      .map(normalizeLeaveRequest)
      .sort(
        (first, second) =>
          new Date(
            second.requestDate ||
            second.submittedAt ||
            0
          ) -
          new Date(
            first.requestDate ||
            first.submittedAt ||
            0
          )
      );
  },

  async submitMyLeaveRequest(input, user = null) {
    const authenticatedUser =
      await authService.getCurrentUser();

    const effectiveUser =
      user || authenticatedUser;

    requireAuthorizedUser(effectiveUser);

    if (
      user &&
      !isSuperAdminUser(authenticatedUser) &&
      !matchesEmployeeId(
        authenticatedUser,
        userIdOf(user)
      )
    ) {
      throw new Error(
        'You cannot submit leave for another employee.'
      );
    }

    // Support the current Super Admin demo
    // identity-switching workflow.

    let employee = effectiveUser;

    if (
      !matchesEmployeeId(
        effectiveUser,
        input?.employeeId
      )
    ) {
      if (
        !isSuperAdminUser(authenticatedUser)
      ) {
        throw new Error(
          'Employee identity does not match the active account.'
        );
      }

      const selectedEmployee =
        getLeaveEmployee(input?.employeeId);

      if (!selectedEmployee) {
        throw new Error(
          'Selected employee record is unavailable.'
        );
      }

      employee = selectedEmployee;
    }

    const employeeId = String(
      input.employeeId
    );

    const employeeName =
      employee.name || employee.fullName;

    const requestType = String(
      input?.requestType || ''
    ).trim();

    const balanceKey =
      getLeaveBalanceKey(requestType);

    const fromDate =
      normalizeDateKey(input?.fromDate);

    const toDate =
      normalizeDateKey(input?.toDate);

    const reason = String(
      input?.reason || ''
    ).trim();

    if (
      !employeeId ||
      !employeeName ||
      !balanceKey
    ) {
      throw new Error(
        'Valid employee and leave type details are required.'
      );
    }

    if (
      !reason ||
      reason.length > MAX_LEAVE_REASON_LENGTH
    ) {
      throw new Error(
        'Enter a leave reason of up to 1000 characters.'
      );
    }

    const totalDays = calculateLeaveDays(
      fromDate,
      toDate
    );

    const records = getApprovalRecords();

    const employeeRecord =
      getLeaveEmployee(employeeId);

    if (!employeeRecord) {
      throw new Error(
        'Employee is not available in the leave entitlement roster. Please contact HR.'
      );
    }

    validateLeaveOverlap(
      employeeRecord,
      fromDate,
      toDate,
      records
    );

    validateAvailableLeave(
      employeeRecord,
      balanceKey,
      totalDays,
      records,
      null,
      true
    );

    const timestamp =
      new Date().toISOString();

    const request =
      normalizeApprovalRecord({
        id: generateId('LV'),

        category: 'Leave Approval',

        employeeId,

        employeeName,

        department:
          employeeRecord.department ||
          employeeRecord.dept ||
          employee.department ||
          employee.dept,

        designation:
          employeeRecord.designation ||
          employee.designation,

        teamLeadId:
          employeeRecord.teamLeadId ||
          employee.teamLeadId ||
          null,

        managerId:
          employeeRecord.managerId ||
          employee.managerId ||
          null,

        requestType,
        fromDate,
        toDate,
        totalDays,
        reason,

        requestDate: timestamp,

        submittedAt: timestamp,

        teamLeadApproval: 'pending',

        hrApproval: 'pending',

        balanceTrackingVersion: 1,

        balanceKey,

        balanceDeductionApplied: false,

        comments: [],

        approvalTasks: [
          {
            approver: 'Team Lead',
            assignedTo: 'Team Lead',
            status: 'Pending',
            notificationStatus: 'Available in approval queue',
            notifiedAt: null
          },
          {
            approver: 'HR',
            assignedTo: 'HR Department',
            status: 'Pending',
            notificationStatus: 'Waiting',
            notifiedAt: null
          }
        ],

        notifications: [
          {
            recipientRole: 'Team Lead',
            recipient: 'Team Lead',

            type: 'Leave Approval Required',

            message:
              `${employeeName} submitted a ${requestType} request.`,

            status: 'Available in portal',

            createdAt: timestamp
          }
        ],

        activity: [
          {
            event: 'Submitted',

            detail:
              'Leave request submitted; awaiting Team Lead review.',

            at: timestamp
          }
        ]
      });

    saveApprovalRecords([
      request,
      ...records
    ]);

    emitApprovalUpdate({
      approvalId: request.id,
      employeeId,
      status: 'pending',
      reviewStage: 'team-lead-review'
    });

    return normalizeLeaveRequest(request);
  },

  async decideMyLeaveRequest(
    id,
    approver,
    decision,
    comment = '',
    user = null
  ) {
    if (
      !['Team Lead', 'HR'].includes(approver)
    ) {
      throw new Error(
        'Approver must be Team Lead or HR.'
      );
    }

    const updated = processLeaveDecision(
      id,
      approver,
      decision,
      comment,
      user
    );

    return normalizeLeaveRequest(updated);
  },

  async getPendingHRRequests(user) {
    if (!hasHRPermission(user)) {
      throw new Error(
        'HR approval permission is required.'
      );
    }

    return getApprovalRecords()
      .filter(request =>
        request.category === 'Leave Approval' &&
        request.reviewStage === 'hr-review'
      )
      .map(normalizeLeaveRequest);
  },

  async getLeaveCalendar(
    user = currentTeamLead
  ) {
    return getScopedApprovals(
      user,
      getApprovalRecords(),
      getTeamMemberRecords()
    ).filter(
      item =>
        item.category === 'Leave Approval'
    );
  },

  async getLeaveBalances(
    user = currentTeamLead
  ) {
    return getScopedTeamMembers(
      user,
      getTeamMemberRecords()
    ).map(member => ({
      id: member.id,
      employeeId:
        member.employeeId || member.id,
      name: member.name,
      designation: member.designation,
      leaveBalance: member.leaveBalance
    }));
  }
};

// ============================================================
// LEGACY ATTENDANCE SERVICE
// ============================================================

export const legacyAttendanceService = {
  async getTodayAttendance(
    user = currentTeamLead
  ) {
    return getScopedTeamMembers(
      user,
      getTeamMemberRecords()
    ).map(member => ({
      id: member.id,
      name: member.name,
      designation: member.designation,
      dept: member.dept,

      status: member.statusToday,

      punchIn: member.punchIn,
      punchOut: member.punchOut,

      checkInLocation:
        member.checkInLocation ?? null,

      checkOutLocation:
        member.checkOutLocation ?? null,

      workingHours:
        member.workingHoursToday
    }));
  },

  async sendReminder(
    employeeId,
    employeeName
  ) {
    return {
      success: false,

      message:
        `Reminder delivery is currently unavailable for ${employeeName}.`
    };
  }
};

// ============================================================
// PERFORMANCE SERVICE
// ============================================================

export const performanceService = {
  async getPerformanceData(
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    const ids = getAuthorizedMemberIds(
      user,
      members
    );

    const feedback = getStoredList(
      STORAGE_KEYS.FEEDBACK,
      teamPerformanceScore.recentFeedback || []
    ).filter(item =>
      ids.has(String(item.employeeId))
    );

    const storedGoals =
      getStored(STORAGE_KEYS.GOALS, {}) || {};

    const goals = Object.fromEntries(
      Object.entries(storedGoals).filter(
        ([employeeId]) => ids.has(employeeId)
      )
    );

    const scheduledReviews = getStoredList(
      STORAGE_KEYS.REVIEWS
    ).filter(item =>
      ids.has(String(item.employeeId))
    );

    return {
      ...teamPerformanceScore,
      recentFeedback: feedback,
      goalOverrides: goals,
      scheduledReviews
    };
  },

  async addFeedback(
    {
      employeeId,
      employeeName,
      rating,
      content,
      type
    },
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canReviewPerformance,
      'You do not have permission to add feedback.'
    );

    const ids = getAuthorizedMemberIds(
      user,
      members
    );

    if (!ids.has(String(employeeId))) {
      throw new Error(
        'Employee is outside your authorized team.'
      );
    }

    const cleanContent =
      String(content || '').trim();

    const numericRating = Number(rating);

    if (
      !cleanContent ||
      cleanContent.length > 1000
    ) {
      throw new Error(
        'Feedback remarks are required (maximum 1000 characters).'
      );
    }

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        'Rating must be between 1 and 5.'
      );
    }

    const feedbackList = getStoredList(
      STORAGE_KEYS.FEEDBACK,
      teamPerformanceScore.recentFeedback || []
    );

    const employee = members.find(
      member =>
        matchesEmployeeId(member, employeeId)
    );

    const newEntry = {
      id: generateId('FB'),

      employeeId,

      employeeName:
        employee?.name || employeeName,

      date: new Date().toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      ),

      createdAt: new Date().toISOString(),

      type: type || 'Sprint Commendation',

      giver: user.name || 'Team Lead',

      giverId: userIdOf(user),

      rating: numericRating,

      content: cleanContent
    };

    setStored(
      STORAGE_KEYS.FEEDBACK,
      [newEntry, ...feedbackList]
    );

    return newEntry;
  },

  async updateGoalProgress(
    goalId,
    progress,
    user = currentTeamLead,
    members = getTeamMemberRecords(),
    comment = ''
  ) {
    requirePermission(
      user,
      canReviewPerformance,
      'You do not have permission to update goal progress.'
    );

    const employeeId = String(goalId);

    const ids = getAuthorizedMemberIds(
      user,
      members
    );

    if (!ids.has(employeeId)) {
      throw new Error(
        'Employee is outside your authorized team.'
      );
    }

    const numericProgress = Number(progress);

    if (
      progress === '' ||
      progress == null ||
      !Number.isFinite(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      throw new Error(
        'Goal progress must be between 0 and 100.'
      );
    }

    const storedGoals =
      getStored(STORAGE_KEYS.GOALS, {}) || {};

    const member = members.find(item =>
      matchesEmployeeId(item, employeeId)
    );

    const entry = {
      progress: numericProgress,

      previousProgress:
        storedGoals[employeeId]?.progress ??
        member?.goalsProgress ??
        0,

      comment:
        String(comment || '').trim().slice(0, 500),

      updatedAt:
        new Date().toISOString(),

      updatedBy: user.name,

      updatedById: userIdOf(user)
    };

    setStored(
      STORAGE_KEYS.GOALS,
      {
        ...storedGoals,
        [employeeId]: entry
      }
    );

    return {
      success: true,
      goalId,
      ...entry
    };
  }
};

// ============================================================
// PAYROLL SERVICE
// ============================================================

export const payrollService = {
  async getAuthorizedPayroll(
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    if (isSuperAdminUser(user)) {
      return authorizedPayrollOverview;
    }

    const ids = getAuthorizedMemberIds(
      user,
      members
    );

    if (getUserRole(user) === 'employee') {
      ids.add(String(userIdOf(user)));
    }

    const teamList =
      authorizedPayrollOverview.teamList.filter(
        employee =>
          ids.has(String(getMemberId(employee)))
      );

    const payslipsGenerated =
      teamList.filter(
        employee => employee.payslip === 'Ready'
      ).length;

    return {
      ...authorizedPayrollOverview,

      teamList,

      totalEmployeesInBatch: teamList.length,

      payslipsGenerated,

      payslipsPending:
        teamList.length - payslipsGenerated
    };
  }
};

// ============================================================
// TASK VALIDATION
// ============================================================

const validateTaskAssignment = (
  taskData,
  user,
  members
) => {
  const assigneeId =
    taskData.assigneeId ||
    taskData.employeeId;

  if (!assigneeId) {
    throw new Error(
      'Select a task assignee.'
    );
  }

  if (
    !getScopedTasks(
      user,
      [{ ...taskData, assigneeId }],
      members
    ).length
  ) {
    throw new Error(
      'Task assignee is outside your authorized team.'
    );
  }
};

const validateTaskProject = async (
  taskData,
  user,
  members
) => {
  if (!taskData.projectId) return;

  const project =
    await projectService.getProjectById(
      taskData.projectId,
      user,
      members
    );

  if (!project) {
    throw new Error(
      'Project is outside your authorized team.'
    );
  }

  const assigneeId =
    taskData.assigneeId ||
    taskData.employeeId;

  const isProjectMember =
    safeArray(project.memberIds).some(
      memberId => sameId(memberId, assigneeId)
    );

  const isProjectOwner =
    sameId(project.ownerId, assigneeId) ||
    sameId(project.teamLeadId, assigneeId);

  if (!isProjectMember && !isProjectOwner) {
    throw new Error(
      'Task assignee must belong to the selected project.'
    );
  }

  if (
    taskData.dueDate &&
    project.dueDate &&
    taskData.dueDate > project.dueDate
  ) {
    throw new Error(
      'Task due date cannot exceed the project deadline.'
    );
  }

  if (
    taskData.startDate &&
    project.startDate &&
    taskData.startDate < project.startDate
  ) {
    throw new Error(
      'Task start date cannot be before the project start date.'
    );
  }
};

// ============================================================
// TASK SERVICE
// ============================================================

export const taskService = {
  async getTasks(
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    return getScopedTasks(
      user,
      getTaskRecords(),
      members
    );
  },

  async getTaskById(
    taskId,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    const task = getTaskRecords().find(
      item => sameId(item.id, taskId)
    );

    return getScopedTasks(
      user,
      task ? [task] : [],
      members
    )[0] || null;
  },

  async createTask(
    taskData,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canAssignTasks,
      'You do not have permission to create tasks.'
    );

    const title =
      String(taskData?.title || '').trim();

    if (!title) {
      throw new Error(
        'Task title is required.'
      );
    }

    validateTaskAssignment(
      taskData,
      user,
      members
    );

    if (
      taskData.startDate &&
      taskData.dueDate &&
      taskData.dueDate < taskData.startDate
    ) {
      throw new Error(
        'Due date must be on or after the start date.'
      );
    }

    await validateTaskProject(
      taskData,
      user,
      members
    );

    if (taskData.projectId) {
      const project =
        await projectService.getProjectById(
          taskData.projectId,
          user,
          members
        );

      if (project?.status === 'Completed') {
        throw new Error(
          'New tasks cannot be added to a completed project.'
        );
      }
    }

    const tasks = getTaskRecords();

    const status =
      taskData.status || 'To Do';

    const completed =
      ['completed', 'done'].includes(
        normalize(status)
      );

    const newTask = {
      ...taskData,

      id: generateId('TSK'),

      title,

      createdById: userIdOf(user),

      status,

      progress: completed
        ? 100
        : Math.min(
            99,
            clampProgress(taskData.progress)
          ),

      projectId:
        taskData.projectId || null,

      attachments:
        taskData.attachments || 0,

      comments: [
        ...safeArray(taskData.comments)
      ],

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.TASKS,
      [newTask, ...tasks]
    );

    return newTask;
  },

  async updateTaskStatus(
    taskId,
    newStatus,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    const tasks = getTaskRecords();

    const target = tasks.find(
      task => sameId(task.id, taskId)
    );

    if (
      !target ||
      !getScopedTasks(
        user,
        [target],
        members
      ).length
    ) {
      throw new Error(
        'Task is outside your authorized team.'
      );
    }

    const status =
      String(newStatus || '').trim();

    if (!status) {
      throw new Error(
        'Task status is required.'
      );
    }

    const normalizedStatus =
      normalize(status);

    const progress =
      ['completed', 'done'].includes(
        normalizedStatus
      )
        ? 100
        : normalizedStatus === 'to do'
          ? 0
          : Math.min(
              99,
              clampProgress(target.progress)
            );

    const updatedTask = {
      ...target,
      status,
      progress,
      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.TASKS,

      tasks.map(task =>
        sameId(task.id, taskId)
          ? updatedTask
          : task
      )
    );

    return updatedTask;
  },

  async updateTask(
    taskId,
    updates,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    const tasks = getTaskRecords();

    const target = tasks.find(
      task => sameId(task.id, taskId)
    );

    if (
      !target ||
      !getScopedTasks(
        user,
        [target],
        members
      ).length
    ) {
      throw new Error(
        'Task is outside your authorized team.'
      );
    }

    const safeUpdates =
      Object.fromEntries(
        Object.entries(updates || {}).filter(
          ([key]) =>
            canAssignTasks(user)
              ? ![
                  'id',
                  'createdById',
                  'createdAt'
                ].includes(key)
              : ['status', 'progress'].includes(key)
        )
      );

    const candidate = {
      ...target,
      ...safeUpdates
    };

    validateTaskAssignment(
      candidate,
      user,
      members
    );

    if (
      candidate.startDate &&
      candidate.dueDate &&
      candidate.dueDate < candidate.startDate
    ) {
      throw new Error(
        'Due date must be on or after the start date.'
      );
    }

    if (
      candidate.assigneeId !== target.assigneeId ||
      candidate.projectId !== target.projectId ||
      candidate.startDate !== target.startDate ||
      candidate.dueDate !== target.dueDate
    ) {
      await validateTaskProject(
        candidate,
        user,
        members
      );
    }

    const completed =
      ['completed', 'done'].includes(
        normalize(candidate.status)
      );

    const updatedTask = {
      ...candidate,

      progress: completed
        ? 100
        : normalize(candidate.status) === 'to do'
          ? 0
          : Math.min(
              99,
              clampProgress(candidate.progress)
            ),

      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.TASKS,

      getTaskRecords().map(task =>
        sameId(task.id, taskId)
          ? updatedTask
          : task
      )
    );

    return updatedTask;
  },

  async deleteTask(
    taskId,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canAssignTasks,
      'You do not have permission to delete tasks.'
    );

    const tasks = getTaskRecords();

    const target = tasks.find(
      task => sameId(task.id, taskId)
    );

    if (
      !target ||
      !getScopedTasks(
        user,
        [target],
        members
      ).length
    ) {
      throw new Error(
        'Task is outside your authorized team.'
      );
    }

    setStored(
      STORAGE_KEYS.TASKS,
      tasks.filter(
        task => !sameId(task.id, taskId)
      )
    );

    return {
      success: true,
      taskId
    };
  },

  async addTaskComment(
    taskId,
    commentText,
    author = null,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    const tasks = getTaskRecords();

    const target = tasks.find(
      task => sameId(task.id, taskId)
    );

    if (
      !target ||
      !getScopedTasks(
        user,
        [target],
        members
      ).length
    ) {
      throw new Error(
        'Task is outside your authorized team.'
      );
    }

    const text =
      String(commentText || '').trim();

    if (!text) {
      throw new Error(
        'Enter a task comment.'
      );
    }

    const updatedTask = {
      ...target,

      comments: [
        ...safeArray(target.comments),

        {
          id: generateId('TC'),

          author:
            user.name || author || 'Team Member',

          authorId: userIdOf(user),

          time: 'Just now',

          timestamp:
            new Date().toISOString(),

          text
        }
      ],

      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.TASKS,

      tasks.map(task =>
        sameId(task.id, taskId)
          ? updatedTask
          : task
      )
    );

    return updatedTask;
  }
};

// ============================================================
// ATTENDANCE STORAGE
// ============================================================

const ATTENDANCE_KEY =
  'technomold_teamlead_attendance_sessions';

const persistAttendance = (key, value) =>
  setStored(key, value);

const attendanceRecords = () => {
  const records = readStorage(
    ATTENDANCE_KEY,
    {}
  );

  return records &&
    typeof records === 'object' &&
    !Array.isArray(records)
      ? records
      : {};
};

// ============================================================
// TEAM LEAD SERVICE
// ============================================================

// MANAGER_HIERARCHY_V1

export const teamLeadService = {

  async getTeamLeads(user = currentTeamLead) {

    const role = getUserRole(user);

    if (
      !userIdOf(user) ||
      ![
        'super-admin',
        'manager',
        'team-lead'
      ].includes(role)
    ) {
      return [];
    }

    const members = getTeamMemberRecords();

    const leadId = userIdOf(currentTeamLead);

    const normalize = value =>
      String(value ?? '')
        .trim()
        .toLowerCase();

    const assignedIds = new Set([

      ...safeArray(user.assignedTeamLeadIds),

      ...safeArray(user.managedTeamLeadIds),

      ...safeArray(user.teamLeadIds)

    ].map(normalize).filter(Boolean));

    const canonicalLead = {

      ...currentTeamLead,

      employeeId: leadId,

      designation:
        currentTeamLead.designation ||
        'Team Lead',

      domain:
        currentTeamLead.department ||
        currentTeamLead.dept ||
        '',

      department:
        currentTeamLead.department ||
        currentTeamLead.dept ||
        '',

      systemRole: 'TEAM_LEAD_MANAGER'

    };

    const storedLead = getStored(
      STORAGE_KEYS.USER,
      currentTeamLead
    );

    const lead = sameId(
      userIdOf(storedLead),
      leadId
    )

      ? {
          ...canonicalLead,
          ...storedLead,

          employeeId: leadId,

          managerId:
            canonicalLead.managerId,

          reportingManagerId:
            canonicalLead.reportingManagerId,

          systemRole:
            canonicalLead.systemRole
        }

      : canonicalLead;

    const canViewLead =

      role === 'super-admin' ||

      (
        role === 'team-lead' &&

        sameId(
          userIdOf(user),
          leadId
        )
      ) ||

      (
        role === 'manager' &&

        (
          assignedIds.has(
            normalize(leadId)
          ) ||

          sameId(
            lead.managerId,
            userIdOf(user)
          )
        )
      );

    if (!canViewLead) {
      return [];
    }

    const directMembers =
      getScopedTeamMembers(
        lead,
        members
      );

    const visibleMembers =
      getScopedTeamMembers(
        user,
        members
      );

    const visibleIds = new Set(

      visibleMembers.map(member =>

        normalize(
          member.id ||
          member.employeeId ||
          member.userId
        )

      ).filter(Boolean)

    );

    const seenIds = new Set();

    const team = directMembers

      .filter(member => {

        const memberId = normalize(

          member.id ||
          member.employeeId ||
          member.userId

        );

        if (
          !memberId ||
          seenIds.has(memberId) ||
          !visibleIds.has(memberId)
        ) {
          return false;
        }

        seenIds.add(memberId);

        return true;

      })

      .map(member => ({

        ...member,

        employeeId:
          member.employeeId ||
          member.id,

        domain:
          member.domain ||
          member.department ||
          member.dept ||
          '',

        teamLeadId: leadId,

        teamLeadName: lead.name,

        joinDate:
          member.joinDate ||
          member.joined ||
          null,

        relation:
          role === 'manager'
            ? 'Indirect'
            : 'Direct'

      }));

    return [

      {

        ...lead,

        relation:
          role === 'manager'
            ? 'Direct'
            : 'Self',

        directReportsCount: team.length,

        totalTeamCount: team.length,

        team

      }

    ];

  },


  async getTeamLead(
    employeeId,
    user = currentTeamLead
  ) {

    if (!employeeId) {
      return null;
    }

    const leads =
      await this.getTeamLeads(user);

    return leads.find(
      lead =>
        sameId(
          lead.employeeId,
          employeeId
        )
    ) || null;

  }

};

// ============================================================
// ATTENDANCE SERVICE
// ============================================================

export const attendanceService = {
  async checkIn(payload) {
    const data = attendanceRecords();

    const employeeId =
      payload?.employeeId;

    if (!employeeId) {
      throw new Error(
        'Employee ID is required.'
      );
    }

    const previous =
      data[employeeId];

    if (
      previous?.checkIn &&
      !previous?.checkOut
    ) {
      throw new Error(
        'An open attendance session already exists.'
      );
    }

    data[employeeId] = {
      ...payload,

      checkIn: new Date().toISOString(),

      checkOut: null,

      checkOutLocation: null,

      breaks: [],

      breakSeconds: 0,

      activeBreak: null
    };

    persistAttendance(
      ATTENDANCE_KEY,
      data
    );

    return data[employeeId];
  },

  async checkOut(payload) {
    const data = attendanceRecords();

    const employeeId =
      payload?.employeeId;

    if (!employeeId) {
      throw new Error(
        'Employee ID is required.'
      );
    }

    const entry =
      data[employeeId];

    if (
      !entry?.checkIn ||
      entry.checkOut
    ) {
      throw new Error(
        'No active attendance session found.'
      );
    }

    const checkOut =
      new Date().toISOString();

    const breaks = [
      ...safeArray(entry.breaks)
    ];

    if (entry.activeBreak) {
      breaks.push({
        ...entry.activeBreak,
        end: checkOut
      });
    }

    const breakSeconds = breaks.reduce(
      (total, item) => {
        const duration =
          (
            new Date(item.end) -
            new Date(item.start)
          ) / 1000;

        return total + (
          Number.isFinite(duration)
            ? Math.max(0, duration)
            : 0
        );
      },
      0
    );

    data[employeeId] = {
      ...entry,
      ...payload,
      checkIn: entry.checkIn,
      checkOut,
      breaks,
      breakSeconds,
      activeBreak: null
    };

    persistAttendance(
      ATTENDANCE_KEY,
      data
    );

    return data[employeeId];
  },

  async startBreak(payload) {
    return {
      ...payload,
      start: new Date().toISOString()
    };
  },

  async endBreak(payload) {
    return {
      ...payload,
      end: new Date().toISOString()
    };
  }
};

// ============================================================
// DEFAULT PROJECT COMMENTS
// ============================================================

const PROJECT_1052_COMMENTS = [
  {
    id: 'PRJC-1052-01',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2001',
    authorName: 'Ravi Kumar',
    role: 'Frontend Dashboard Engineer',
    timestamp: '2026-11-18T10:15:00.000Z',
    message:
      'The reconciliation dashboard now shows gross pay, deductions, and net pay in a single review flow.'
  },
  {
    id: 'PRJC-1052-02',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2002',
    authorName: 'Priya Sharma',
    role: 'UI/UX & Design System Lead',
    timestamp: '2026-11-18T12:40:00.000Z',
    message:
      'I have shared the updated payslip and deduction review states with the team for implementation.'
  },
  {
    id: 'PRJC-1052-03',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2003',
    authorName: 'Anil Reddy',
    role: 'QA Automation & Reconciliation Lead',
    timestamp: '2026-11-19T08:30:00.000Z',
    message:
      'The TDS slab boundary cases pass; I am adding PF ceiling and rounding scenarios to the reconciliation suite.'
  },
  {
    id: 'PRJC-1052-04',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2004',
    authorName: 'Sneha Rao',
    role: 'Full-Stack & API Integration Engineer',
    timestamp: '2026-11-19T11:05:00.000Z',
    message:
      'Payroll calculation and payslip endpoints are connected in staging with validation errors surfaced to the review screen.'
  },
  {
    id: 'PRJC-1052-05',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2005',
    authorName: 'Kiran Babu',
    role: 'Payroll Data & Performance Engineer',
    timestamp: '2026-11-20T09:20:00.000Z',
    message:
      'The monthly payroll query plan is optimized; I will share batch timing from the latest representative dataset.'
  },
  {
    id: 'PRJC-1052-06',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2006',
    authorName: 'Divya Teja',
    role: 'Business & Workflow Analyst',
    timestamp: '2026-11-20T13:10:00.000Z',
    message:
      'Finance confirmed the exception-review handoff and approval checkpoints for the next payroll cycle.'
  },
  {
    id: 'PRJC-1052-07',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2007',
    authorName: 'Harsha Vardhan',
    role: 'Payroll Calculation Test Engineer',
    timestamp: '2026-11-21T07:45:00.000Z',
    message:
      'I added unit coverage for slab thresholds, zero-tax cases, and net-pay rounding.'
  },
  {
    id: 'PRJC-1052-08',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2008',
    authorName: 'Meghana R',
    role: 'Cloud Deployment & Reliability Engineer',
    timestamp: '2026-11-21T10:50:00.000Z',
    message:
      'The payroll batch health check and failed-run alert are active in staging.'
  },
  {
    id: 'PRJC-1052-09',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2009',
    authorName: 'Devansh Mehta',
    role: 'Payroll Experience Engineer',
    timestamp: '2026-11-22T09:35:00.000Z',
    message:
      'Payroll status and exception notices are wired to the dashboard; I am checking the narrow-screen layout.'
  },
  {
    id: 'PRJC-1052-10',
    projectId: 'PRJ-1052',
    authorId: 'EMP-2010',
    authorName: 'Ananya Roy',
    role: 'Technical Documentation & Release Specialist',
    timestamp: '2026-11-22T12:15:00.000Z',
    message:
      'The payroll API contract and release checklist are updated with the current staging behavior.'
  }
];

// ============================================================
// DEFAULT PROJECT DATA
// ============================================================

const MOUNIKA_PROJECTS = [
  {
    id: 'PRJ-1052',

    projectCode: 'PRJ-1052',

    name: 'Automated Payroll & Tax Engine',

    department: 'Finance & Operations',

    description:
      'Deliver a reliable payroll workflow for monthly salary calculations, TDS and PF reconciliation, approval review, and downloadable payslips.',

    leadName: 'Mounika S. Rao',

    ownerId: 'TL-1042',

    teamLeadId: 'TL-1042',

    memberIds:
      initialTeamMembers.map(member => member.id),

    memberRoles:
      Object.fromEntries(
        initialTeamMembers.map(member => [
          member.id,
          member.projectRole
        ])
      ),

    comments: PROJECT_1052_COMMENTS,

    startDate: '2026-10-15',

    dueDate: '2027-01-20',

    priority: 'High',

    status: 'In Progress',

    health: 'At Risk',

    progress: 40,

    activeSprint: {
      name: 'Sprint 46',
      status: 'In Progress',
      endsOn: '2026-11-20'
    }
  }
];

// ============================================================
// PROJECT STORAGE
// ============================================================

const projectStoreFor = user => {
  const stored = getStored(
    STORAGE_KEYS.PROJECTS,
    null
  );

  if (Array.isArray(stored)) {
    return stored;
  }

  const projects = MOUNIKA_PROJECTS.map(
    project => ({
      ...project,

      memberIds: [
        ...safeArray(project.memberIds)
      ],

      memberRoles: {
        ...(project.memberRoles || {})
      },

      comments: safeArray(
        project.comments
      ).map(comment => ({ ...comment })),

      activeSprint: project.activeSprint
        ? { ...project.activeSprint }
        : null
    })
  );

  setStored(
    STORAGE_KEYS.PROJECTS,
    projects
  );

  return projects;
};

// ============================================================
// PROJECT VALIDATION
// ============================================================

const validateProjectMembers = (
  memberIds,
  memberRoles,
  user,
  members
) => {
  const allowedIds =
    getAuthorizedMemberIds(user, members);

  if (
    memberIds.some(
      id => !allowedIds.has(String(id))
    )
  ) {
    throw new Error(
      'Project members must belong to your authorized team.'
    );
  }

  const roles = {};

  memberIds.forEach(memberId => {
    const role = String(
      memberRoles?.[memberId] || ''
    ).trim();

    if (!role) {
      throw new Error(
        'Assign a project role to every selected team member.'
      );
    }

    if (role.length > 60) {
      throw new Error(
        'Project roles cannot exceed 60 characters.'
      );
    }

    roles[memberId] = role;
  });

  return roles;
};

const validateProjectFields = (
  data,
  projects,
  ignoredProjectId = null
) => {
  const requiredFields = [
    'name',
    'projectCode',
    'department',
    'description',
    'startDate',
    'dueDate'
  ];

  if (
    requiredFields.some(
      field => !String(
        data?.[field] || ''
      ).trim()
    )
  ) {
    throw new Error(
      'Complete all required project fields.'
    );
  }

  if (
    data.dueDate < data.startDate
  ) {
    throw new Error(
      'Deadline must be on or after the start date.'
    );
  }

  if (
    !['Planning', 'In Progress', 'Completed']
      .includes(data.status || 'Planning')
  ) {
    throw new Error(
      'Invalid project status.'
    );
  }

  if (
    !['High', 'Medium', 'Low']
      .includes(data.priority || 'Medium')
  ) {
    throw new Error(
      'Invalid project priority.'
    );
  }

  const projectCode = String(
    data.projectCode
  ).trim().toUpperCase();

  if (
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(projectCode)
  ) {
    throw new Error(
      'Invalid project code.'
    );
  }

  if (
    projects.some(project =>
      !sameId(
        project.id,
        ignoredProjectId
      ) &&
      normalize(project.projectCode) ===
        normalize(projectCode)
    )
  ) {
    throw new Error(
      'Project code must be unique.'
    );
  }
};

// ============================================================
// PROJECT SERVICE
// ============================================================

export const projectService = {
  async getProjects(
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    return projectStoreFor(user).filter(
      project =>
        canAccessProject(
          user,
          project,
          members
        )
    );
  },

  async getProjectById(
    projectId,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    const project = projectStoreFor(user).find(
      item => sameId(item.id, projectId)
    );

    return project &&
      canAccessProject(
        user,
        project,
        members
      )
        ? project
        : null;
  },

  async createProject(
    data,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canManageProjects,
      'You do not have permission to create projects.'
    );

    const projects =
      projectStoreFor(user);

    validateProjectFields(
      data,
      projects
    );

    const memberIds = [
      ...new Set(
        safeArray(data.memberIds).map(String)
      )
    ];

    const memberRoles =
      validateProjectMembers(
        memberIds,
        data.memberRoles,
        user,
        members
      );

    const status =
      data.status || 'Planning';

    const timestamp =
      new Date().toISOString();

    const created = {
      ...data,

      id: generateId('PRJ'),

      name: data.name.trim(),

      projectCode:
        data.projectCode.trim().toUpperCase(),

      department:
        data.department.trim(),

      description:
        data.description.trim(),

      leadName: user.name,

      ownerId: userIdOf(user),

      teamLeadId: userIdOf(user),

      createdById: userIdOf(user),

      memberIds,

      memberRoles,

      priority: data.priority || 'Medium',

      status,

      progress:
        status === 'Completed'
          ? 100
          : clampProgress(data.progress),

      activeSprint:
        data.activeSprint || null,

      comments: [],

      milestones: safeArray(data.milestones),

      createdAt: timestamp,

      updatedAt: timestamp
    };

    if (
      !canAccessProject(
        user,
        created,
        members
      )
    ) {
      throw new Error(
        'Project is outside your authorized team.'
      );
    }

    setStored(
      STORAGE_KEYS.PROJECTS,
      [created, ...projects]
    );

    return created;
  },

  async updateProject(
    projectId,
    updates,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canManageProjects,
      'You do not have permission to update projects.'
    );

    const projects =
      projectStoreFor(user);

    const target = projects.find(
      project =>
        sameId(project.id, projectId)
    );

    if (
      !target ||
      !canAccessProject(
        user,
        target,
        members
      )
    ) {
      throw new Error(
        'Project is outside your authorized team.'
      );
    }

    const canEditProject =
      isSuperAdminUser(user) ||
      sameId(target.ownerId, userIdOf(user)) ||
      sameId(target.teamLeadId, userIdOf(user)) ||
      (
        getUserRole(user) === 'manager' &&
        getAuthorizedMemberIds(
          user,
          members
        ).has(String(target.teamLeadId))
      );

    if (!canEditProject) {
      throw new Error(
        'Only authorized project owners or managers can update this project.'
      );
    }

    const allowedFields = new Set([
      'name',
      'projectCode',
      'department',
      'description',
      'startDate',
      'dueDate',
      'priority',
      'status',
      'health',
      'progress',
      'memberIds',
      'memberRoles',
      'activeSprint'
    ]);

    const safeUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(
        ([key]) => allowedFields.has(key)
      )
    );

    const candidate = {
      ...target,
      ...safeUpdates
    };

    validateProjectFields(
      candidate,
      projects,
      projectId
    );

    const memberIds = [
      ...new Set(
        safeArray(
          candidate.memberIds
        ).map(String)
      )
    ];

    const assignmentsChanged =
      Object.prototype.hasOwnProperty.call(
        safeUpdates,
        'memberIds'
      ) ||
      Object.prototype.hasOwnProperty.call(
        safeUpdates,
        'memberRoles'
      );

    const memberRoles = assignmentsChanged
      ? validateProjectMembers(
          memberIds,
          candidate.memberRoles,
          user,
          members
        )
      : {
          ...(target.memberRoles || {})
        };

    const projectTasks = getTaskRecords()
      .filter(task =>
        sameId(task.projectId, projectId)
      );

    if (assignmentsChanged) {
      const removedAssignedMember =
        projectTasks.some(task => {
          const assigneeId =
            String(task.assigneeId || '');

          return (
            !memberIds.includes(assigneeId) &&
            !sameId(
              assigneeId,
              target.ownerId
            ) &&
            !sameId(
              assigneeId,
              target.teamLeadId
            )
          );
        });

      if (removedAssignedMember) {
        throw new Error(
          'Reassign existing project tasks before removing a team member.'
        );
      }
    }

    if (
      projectTasks.some(
        task =>
          task.dueDate &&
          task.dueDate > candidate.dueDate
      )
    ) {
      throw new Error(
        'Project deadline cannot be before existing task deadlines.'
      );
    }

    if (
      candidate.status === 'Completed' &&
      projectTasks.some(
        task =>
          !['completed', 'done'].includes(
            normalize(task.status)
          )
      )
    ) {
      throw new Error(
        'Complete all project tasks before closing the project.'
      );
    }

    if (
        candidate.status === 'Completed' &&
        safeArray(candidate.milestones).some(
          milestone => !milestone.done
        )
      ) {
        throw new Error(
          'Complete all project milestones before closing the project.'
        );
      }

      const updatedProject = {
        ...candidate,
        id: target.id,

      projectCode:
        candidate.projectCode.trim().toUpperCase(),

      memberIds,

      memberRoles,

      progress:
        candidate.status === 'Completed'
          ? 100
          : clampProgress(candidate.progress),

      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.PROJECTS,

      projects.map(project =>
        sameId(project.id, projectId)
          ? updatedProject
          : project
      )
    );

    return updatedProject;
  },

  async updateProjectAssignments(
    projectId,
    memberIds,
    memberRoles,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    return this.updateProject(
      projectId,
      {
        memberIds,
        memberRoles
      },
      user,
      members
    );
  },

    async addMilestone(
    projectId,
    title,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canManageProjects,
      'You cannot create project milestones.'
    );

    const projects = projectStoreFor(user);

    const project = projects.find(
      item => sameId(item.id, projectId)
    );

    if (!project || !canAccessProject(user, project, members)) {
      throw new Error('Project access is restricted.');
    }

    const canEdit =
      isSuperAdminUser(user) ||
      matchesEmployeeId(user, project.ownerId) ||
      matchesEmployeeId(user, project.teamLeadId) ||
      (
        getUserRole(user) === 'manager' &&
        getAuthorizedMemberIds(user, members)
          .has(String(project.teamLeadId))
      );

    if (!canEdit) {
      throw new Error(
        'Only authorized project owners or managers can add milestones.'
      );
    }

    if (project.status === 'Completed') {
      throw new Error(
        'Cannot add milestones to a completed project.'
      );
    }

    const cleanTitle = String(title || '').trim();

    if (!cleanTitle || cleanTitle.length > 120) {
      throw new Error(
        'Enter a milestone title of up to 120 characters.'
      );
    }

    const milestones = safeArray(project.milestones);

    if (
      milestones.some(item =>
        normalize(item.title || item.name) ===
        normalize(cleanTitle)
      )
    ) {
      throw new Error('This milestone already exists.');
    }

    const milestone = {
      id: generateId('MS'),
      title: cleanTitle,
      name: cleanTitle,
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    const updatedProject = {
      ...project,
      milestones: [...milestones, milestone],
      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.PROJECTS,
      projects.map(item =>
        sameId(item.id, projectId)
          ? updatedProject
          : item
      )
    );

    return updatedProject;
  },

  async updateMilestone(
    projectId,
    milestoneId,
    done,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requirePermission(
      user,
      canManageProjects,
      'You do not have permission to update milestones.'
    );

    const projects = projectStoreFor(user);

    const project = projects.find(
      item => sameId(item.id, projectId)
    );

    if (
      !project ||
      !canAccessProject(
        user,
        project,
        members
      )
    ) {
      throw new Error(
        'Project is outside your authorized team.'
      );
    }

    const canEditMilestone =
        isSuperAdminUser(user) ||
        matchesEmployeeId(user, project.ownerId) ||
        matchesEmployeeId(user, project.teamLeadId) ||
        (
          getUserRole(user) === 'manager' &&
          getAuthorizedMemberIds(user, members)
            .has(String(project.teamLeadId))
        );

      if (!canEditMilestone) {
        throw new Error(
          'Milestone editing permission is required.'
        );
      }

      if (project.status === 'Completed') {
        throw new Error(
          'Reopen the project before editing milestones.'
        );
      }

      const milestones =
        safeArray(project.milestones);

      if (!milestones.some(
        item => sameId(item.id, milestoneId)
      )
    ) {
      throw new Error(
        'Project milestone not found.'
      );
    }

    const updatedMilestones =
      milestones.map(item =>
        sameId(item.id, milestoneId)
          ? {
              ...item,

              done: Boolean(done),

              completedAt: done
                ? new Date().toISOString()
                : null
            }
          : item
      );

    const updatedProject = {
      ...project,

      milestones: updatedMilestones,

      updatedAt: new Date().toISOString()
    };

    setStored(
      STORAGE_KEYS.PROJECTS,

      projects.map(item =>
        sameId(item.id, projectId)
          ? updatedProject
          : item
      )
    );

    return {
      projectId,
      milestoneId,
      done: Boolean(done),
      project: updatedProject
    };
  },

  async addComment(
    projectId,
    message,
    authorName,
    role,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    requireAuthorizedUser(user);

    const projects = projectStoreFor(user);

    const project = projects.find(
      item => sameId(item.id, projectId)
    );

    if (
      !project ||
      !canAccessProject(
        user,
        project,
        members
      )
    ) {
      throw new Error(
        'Project is outside your authorized team.'
      );
    }

    const cleanMessage =
      String(message || '').trim();

    if (!cleanMessage) {
      throw new Error(
        'Enter a project update before posting.'
      );
    }

    if (cleanMessage.length > 500) {
      throw new Error(
        'Project updates cannot exceed 500 characters.'
      );
    }

    const timestamp =
      new Date().toISOString();

    const comment = {
      id: generateId('PRJC'),

      projectId: String(projectId),

      authorId: String(userIdOf(user)),

      authorName:
        user.name ||
        authorName ||
        'Team Member',

      role:
        user.role ||
        role ||
        user.systemRole ||
        'Team Member',

      timestamp,

      message: cleanMessage
    };

    const updatedProject = {
      ...project,

      comments: [
        ...safeArray(project.comments),
        comment
      ],

      updatedAt: timestamp
    };

    setStored(
      STORAGE_KEYS.PROJECTS,

      projects.map(item =>
        sameId(item.id, projectId)
          ? updatedProject
          : item
      )
    );

    return updatedProject;
  }
};

// ============================================================
// APPROVAL DECISION SERVICE
// ============================================================

export const approvalDecisionService = {
  async decide(
    id,
    status,
    reason,
    decidedBy,
    user = currentTeamLead,
    members = getTeamMemberRecords()
  ) {
    return approvalService.decideApproval(
      id,
      status,
      reason,
      decidedBy,
      user,
      members
    );
  }
};

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

// ACCOUNT_NOTIFICATION_READS_V1

const notificationReadKey = user => {

  requireAuthorizedUser(user);

  const id = String(userIdOf(user) || '')
    .trim()
    .toLowerCase();

  if (!id) {
    throw new Error('A valid account is required.');
  }

  return `${STORAGE_KEYS.NOTIFICATION_READS}:${encodeURIComponent(id)}`;

};

const getNotificationReadIds = user => {

  return new Set(
    getStoredList(
      notificationReadKey(user)
    ).map(String)
  );

};

const saveNotificationReadIds = (user, ids) => {

  setStored(
    notificationReadKey(user),
    [...ids]
  );

};

export const notificationService = {
  async getNotifications(
    user = currentTeamLead,
    members = getTeamMemberRecords(),
    tasks = [],
    approvals = []
  ) {
    requireAuthorizedUser(user);

    const scopedMembers =
      getScopedTeamMembers(
        user,
        members
      );

    const scopedTasks =
      getScopedTasks(
        user,
        tasks,
        members
      );

    const scopedApprovals =
      getScopedApprovals(
        user,
        safeArray(approvals).map(
          normalizeApprovalRecord
        ),
        members
      );

    const teamLeadId = userIdOf(user);

    const names = new Set(
      scopedMembers.map(
        member => member.name
      )
    );

    const scopedIds =
      getScopedEmployeeIds(
        user,
        members
      );

    const announcements =
      initialAnnouncements.filter(item =>
        item.audience === 'company' ||
        isSuperAdminUser(user) ||
        sameId(
          item.teamLeadId,
          teamLeadId
        )
      ).map(item => ({
        ...item,
        read: false
      }));

    const activities =
      recentTeamActivities.filter(item =>
        isSuperAdminUser(user) ||
        item.user === user?.name ||
        names.has(item.user)
      ).map(item => ({
        id: `ACT-NOTIF-${item.id}`,

        type:
          item.type === 'task'
            ? 'task'
            : item.type === 'leave'
              ? 'leave'
              : 'work',

        title:
          item.type === 'task'
            ? 'Task update'
            : item.type === 'leave'
              ? 'Leave update'
              : 'Work update',

        body: item.action,

        priority: 'Normal',

        postedAt: item.postedAt || null,

        author: item.user,

        department:
          scopedMembers.find(
            member =>
              member.name === item.user
          )?.dept || 'Team'
      }));

    const taskNotifications =
      scopedTasks.map(task => ({
        id: `TASK-NOTIF-${task.id}`,

        type: 'task',

        title:
          `Task update: ${task.title}`,

        body:
          `${task.assigneeName || 'Team member'} \u00B7 ${task.status} \u00B7 Due ${task.dueDate || 'Not scheduled'}`,

        priority:
          ['High', 'Critical'].includes(
            task.priority
          )
            ? 'High'
            : 'Normal',

        postedAt:
          task.updatedAt ||
          `${task.startDate ||
            new Date().toISOString().slice(0, 10)}T09:00:00`,

        author:
          task.assigneeName || 'Team member',

        department: 'Team Tasks'
      }));

    const approvalNotifications =
      canManageApprovals(user)
        ? scopedApprovals.filter(item =>
            item.status === 'pending' &&
            !matchesEmployeeId(
              user,
              item.employeeId
            ) &&
            (
              item.category !== 'Leave Approval' ||
              item.reviewStage === 'team-lead-review'
            )
          ).map(item => ({
            id: `APPROVAL-NOTIF-${item.id}`,

            type:
              item.category === 'Leave Approval'
                ? 'leave'
                : 'work',

            title:
              `${item.requestType} request`,

            body:
              `${item.employeeName} submitted a request awaiting review.`,

            priority: 'Normal',

            postedAt:
              item.requestDate ||
              new Date().toISOString(),

            author: item.employeeName,

            employeeId: item.employeeId,

            department:
              item.category || 'Approvals'
          }))
        : [];

    // Employee leave decision notifications are
    // generated from the shared leave record.

    const personalLeaveNotifications =
      getApprovalRecords().filter(
        request =>
          request.category === 'Leave Approval' &&
          request.reviewStage !== 'team-lead-review' &&
          matchesEmployeeId(
            user,
            request.employeeId
          )
      ).map(request => ({
        id:
          `LEAVE-NOTIF-${request.id}-${request.reviewStage}`,

        type: 'leave',

        employeeId:
          user.employeeId ||
          user.id ||
          userIdOf(user),

        recipientId: request.employeeId,

        title:
          request.reviewStage === 'hr-review'
            ? 'Leave awaiting HR approval'
            : `Leave ${request.status}`,

        body:
          request.reviewStage === 'hr-review'
            ? 'Your Team Lead approved the request. HR review is pending.'
            : `Your ${request.requestType} request has been ${request.status}.`,

        postedAt:
          request.decidedAt ||
          request.requestDate,

        priority: 'Normal',

        author:
          request.decidedBy?.name || 'Leave Management',

        department: 'Leave Management'
      }));

    const hrNotifications =
      hasHRPermission(user)
        ? getApprovalRecords().filter(
            request =>
              request.category === 'Leave Approval' &&
              request.reviewStage === 'hr-review' &&
              !matchesEmployeeId(
                user,
                request.employeeId
              )
          ).map(request => ({
            id: `HR-LEAVE-NOTIF-${request.id}`,

            type: 'leave',

            title: 'Pending HR leave approval',

            body:
              `${request.employeeName}'s ${request.requestType} request requires HR review.`,

            employeeId: request.employeeId,

            postedAt:
              request.decidedAt ||
              request.requestDate,

            priority: 'Normal',

            author:
              request.decidedBy?.name || 'Team Lead',

            department: 'HR'
          }))
        : [];

    const events = getStoredList(
      STORAGE_KEYS.NOTIFICATION_EVENTS
    ).filter(item =>
      isSuperAdminUser(user) ||
      (
        item.teamMemberId &&
        scopedIds.has(
          String(item.teamMemberId)
        )
      ) ||
      matchesEmployeeId(
        user,
        item.recipientId
      ) ||
      item.audience === 'company'
    );

    const readIds = getNotificationReadIds(user);

    const notifications = [
      ...announcements,
      ...activities,
      ...taskNotifications,
      ...approvalNotifications,
      ...personalLeaveNotifications,
      ...hrNotifications,
      ...events
    ];

    const uniqueNotifications = Array.from(
      new Map(
        notifications.map(item => [
          String(item.id),
          item
        ])
      ).values()
    );

    return uniqueNotifications
      .map(item => ({
        ...item,

        read:
          readIds.has(String(item.id))
      }))
      .sort(
        (first, second) =>
          new Date(second.postedAt || 0) -
          new Date(first.postedAt || 0)
      );
  },

  async markAsRead(notificationId, user) {

    return this.markAllAsRead(
      [notificationId],
      user
    );

  },

  async markAllAsRead(notificationIds, user) {

    requireAuthorizedUser(user);

    const ids = [
      ...new Set(
        safeArray(notificationIds)
          .filter(id => id !== null && id !== undefined)
          .map(id => String(id).trim())
          .filter(Boolean)
      )
    ];

    if (ids.length === 0) {

      return {
        success: true,
        count: 0,
        notificationIds: []
      };

    }

    const readIds =
      getNotificationReadIds(user);

    let count = 0;

    ids.forEach(id => {

      if (!readIds.has(id)) {
        readIds.add(id);
        count += 1;
      }

    });

    saveNotificationReadIds(
      user,
      readIds
    );

    return {
      success: true,
      count,
      notificationId: ids[0],
      notificationIds: ids
    };

  },


  async addNotification(notification) {
    const events = getStoredList(
      STORAGE_KEYS.NOTIFICATION_EVENTS
    );

    const entry = {
      ...notification,

      id:
        notification.id ||
        generateId('EVT'),

      postedAt:
        notification.postedAt ||
        new Date().toISOString(),

      read: false
    };

    setStored(
      STORAGE_KEYS.NOTIFICATION_EVENTS,
      [entry, ...events]
    );

    return entry;
  }
};

// ============================================================
// DASHBOARD SERVICE
// ============================================================

export const dashboardService = {
  async getDashboardSummary(
    user = currentTeamLead
  ) {
    requireAuthorizedUser(user);

    const members = getTeamMemberRecords();

    const approvals = getApprovalRecords();

    const tasks = getTaskRecords();

    const scopedMembers =
      getScopedTeamMembers(
        user,
        members
      );

    const scopedApprovals =
      getScopedApprovals(
        user,
        approvals,
        members
      );

    const scopedTasks =
      getScopedTasks(
        user,
        tasks,
        members
      );

    const presentCount =
      scopedMembers.filter(member =>
        [
          'office',
          'remote',
          'late'
        ].includes(member.statusToday)
      ).length;

    const absentCount =
      scopedMembers.filter(
        member =>
          member.statusToday === 'none'
      ).length;

    const onLeaveCount =
      scopedMembers.filter(
        member =>
          member.statusToday === 'leave'
      ).length;

    const pendingApprovalsCount =
      canManageApprovals(user)
        ? scopedApprovals.filter(
            approval =>
              approval.status === 'pending' &&
              !matchesEmployeeId(
                user,
                approval.employeeId
              ) &&
              (
                approval.category !== 'Leave Approval' ||
                approval.reviewStage === 'team-lead-review'
              )
          ).length
        : 0;

    const pendingHRApprovalsCount =
      canManageApprovals(user)
        ? scopedApprovals.filter(
            approval =>
              approval.category === 'Leave Approval' &&
              approval.reviewStage === 'hr-review'
          ).length
        : 0;

    const completedTasksCount =
      scopedTasks.filter(task =>
        ['completed', 'done'].includes(
          normalize(task.status)
        )
      ).length;

    const activeTasksCount =
      scopedTasks.length -
      completedTasksCount;

    const projects =
      await projectService.getProjects(
        user,
        scopedMembers
      );

    const validScores =
      scopedMembers.filter(member =>
        member.performanceScore != null &&
        Number.isFinite(
          Number(member.performanceScore)
        )
      );

    const performanceScore =
      validScores.length
        ? validScores.reduce(
            (total, member) =>
              total +
              Number(member.performanceScore),
            0
          ) / validScores.length
        : 0;

    return {
      totalMembers: scopedMembers.length,

      presentToday: presentCount,

      absentToday: absentCount,

      onLeaveToday: onLeaveCount,

      pendingApprovals: pendingApprovalsCount,

      pendingHRApprovals: pendingHRApprovalsCount,

      activeTasks: activeTasksCount,

      completedTasks: completedTasksCount,

      totalProjects: projects.length,

      activeProjects:
        projects.filter(
          project =>
            project.status !== 'Completed'
        ).length,

      completedProjects:
        projects.filter(
          project =>
            project.status === 'Completed'
        ).length,

      performanceScore,

      upcoming: {
        ...upcomingBirthdaysAndHolidays,

        birthdays:
          safeArray(
            upcomingBirthdaysAndHolidays.birthdays
          ).filter(birthday =>
            scopedMembers.some(
              member =>
                member.name === birthday.name
            )
          )
      },

      recentActivities:
        recentTeamActivities.filter(
          activity =>
            activity.user === user?.name ||
            scopedMembers.some(
              member =>
                member.name === activity.user
            )
        )
    };
  }
};
