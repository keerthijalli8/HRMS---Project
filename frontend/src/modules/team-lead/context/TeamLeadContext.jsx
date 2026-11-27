import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';
import { useAuth } from '../../../auth/AuthContext.jsx';

import {
  authService,
  teamService,
  approvalService,
  taskService,
  performanceService,
  leaveService,
  projectService,
  payrollService,
  notificationService
} from '../services/api.js';

import {
  recentTeamActivities as seedTeamActivities
} from '../data/mockData.js';

import {
  readStorage,
  writeStorage
} from '../utils/storage.js';

import {
  captureDeviceLocation
} from '../utils/geolocation.js';

import {
  getUserRole,
  userIdOf,
  canManageApprovals,
  canAssignTasks,
  canManageProjects,
  getScopedTeamMembers,
  getScopedApprovals,
  getScopedTasks,
  canAccessProject
} from '../utils/dataScope.js';

// ============================================================
// CONTEXT CONFIGURATION
// ============================================================

const TeamLeadContext = createContext(null);

const ATTENDANCE_KEY =
  'technomold_teamlead_attendance_sessions';

const DENSITY_KEY =
  'technomold_teamlead_density';

const MAX_COMMENT_LENGTH = 300;

const APPROVAL_SYNC_EVENT =
  'technomold:teamlead:approval-updated';

// ============================================================
// COMMON HELPERS
// ============================================================

const sameId = (first, second) => {
  if (
    first == null ||
    second == null ||
    String(first).trim() === '' ||
    String(second).trim() === ''
  ) {
    return false;
  }

  return String(first) === String(second);
};

const normalize = value =>
  String(value || '').trim().toLowerCase();

const safeArray = value =>
  Array.isArray(value) ? value : [];

const getIdentityIds = user => [
  user?.id,
  user?.employeeId,
  userIdOf(user)
]
  .filter(
    value =>
      value != null &&
      String(value).trim() !== ''
  )
  .map(String);

const matchesIdentity = (user, id) =>
  id != null &&
  getIdentityIds(user).includes(String(id));

const requireSuccessfulResult = (
  result,
  message
) => {
  if (
    !result ||
    result.success === false
  ) {
    throw new Error(
      result?.message || message
    );
  }

  return result;
};

const readAttendanceSessions = () => {
  const saved = readStorage(
    ATTENDANCE_KEY,
    {}
  );

  return (
    saved &&
    typeof saved === 'object' &&
    !Array.isArray(saved)
  )
    ? saved
    : {};
};

// ============================================================
// LEAVE APPROVAL HELPERS
// ============================================================

const normalizeApproval = value => {
  const status = normalize(value);

  if (
    status === 'approved' ||
    status === 'rejected'
  ) {
    return status;
  }

  return 'pending';
};

const getLeaveStatus = (
  teamLeadApproval,
  hrApproval
) => {
  if (
    teamLeadApproval === 'rejected' ||
    hrApproval === 'rejected'
  ) {
    return 'rejected';
  }

  if (
    teamLeadApproval === 'approved' &&
    hrApproval === 'approved'
  ) {
    return 'approved';
  }

  return 'pending';
};

const getLeaveReviewStage = (
  teamLeadApproval,
  hrApproval
) => {
  const status = getLeaveStatus(
    teamLeadApproval,
    hrApproval
  );

  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return teamLeadApproval === 'approved'
    ? 'hr-review'
    : 'team-lead-review';
};

const normalizeLeaveApproval = approval => {
  if (
    !approval ||
    approval.category !== 'Leave Approval'
  ) {
    return approval;
  }

  const teamLeadApproval =
    normalizeApproval(
      approval.teamLeadApproval ??
      approval.managerApprovalStatus
    );

  const hrApproval =
    normalizeApproval(
      approval.hrApproval ??
      approval.hrApprovalStatus
    );

  return {
    ...approval,

    teamLeadApproval,

    hrApproval,

    status: getLeaveStatus(
      teamLeadApproval,
      hrApproval
    ),

    reviewStage: getLeaveReviewStage(
      teamLeadApproval,
      hrApproval
    )
  };
};

const normalizePersonalLeave = request => {
  if (!request) {
    return request;
  }

  const hasApprovalStages =
    request.teamLeadApproval != null ||
    request.managerApprovalStatus != null ||
    request.hrApproval != null ||
    request.hrApprovalStatus != null;

  if (!hasApprovalStages) {
    return request;
  }

  const teamLeadApproval =
    normalizeApproval(
      request.teamLeadApproval ??
      request.managerApprovalStatus
    );

  const hrApproval =
    normalizeApproval(
      request.hrApproval ??
      request.hrApprovalStatus
    );

  return {
    ...request,

    teamLeadApproval,
    hrApproval,

    status: getLeaveStatus(
      teamLeadApproval,
      hrApproval
    ),

    reviewStage: getLeaveReviewStage(
      teamLeadApproval,
      hrApproval
    )
  };
};

const isPendingApproval = approval => {
  if (!approval) {
    return false;
  }

  if (
    approval.category === 'Leave Approval'
  ) {
    const normalizedApproval =
      normalizeLeaveApproval(approval);

    return (
      normalizedApproval.status === 'pending' &&
      normalizedApproval.teamLeadApproval === 'pending' &&
      normalizedApproval.hrApproval !== 'rejected'
    );
  }

  return normalize(
    approval.status
  ) === 'pending';
};

// ============================================================
// DATE VALIDATION
// ============================================================

const normalizeDateKey = value => {
  const text = String(
    value || ''
  ).slice(0, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {
    return '';
  }

  const [year, month, day] =
    text.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return '';
  }

  return text;
};

const hasValidLeaveDates = request => {
  const fromDate =
    normalizeDateKey(request?.fromDate);

  const toDate =
    normalizeDateKey(request?.toDate);

  return Boolean(
    fromDate &&
    toDate &&
    fromDate <= toDate
  );
};

// ============================================================
// CONTEXT PROVIDER
// ============================================================

export const TeamLeadProvider = ({
  children
}) => {
  const {
    user: authUser,
    logout: sharedLogout,
    updateProfile: updateSharedProfile
  } = useAuth();

  const [currentUser, setCurrentUser] =
    useState(null);

  const [
    personalLeaveBalance,
    setPersonalLeaveBalance
  ] = useState(null);

  const [teamMembers, setTeamMembers] =
    useState([]);

  const [approvals, setApprovals] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [
    myLeaveRequests,
    setMyLeaveRequests
  ] = useState([]);

  const [projects, setProjects] =
    useState([]);

  const [payrollData, setPayrollData] =
    useState(null);

  const [notifications, setNotifications] =
    useState([]);

  const [
    recentActivities,
    setRecentActivities
  ] = useState([]);

  const [toast, setToast] =
    useState(null);

  const [
    globalSearchTerm,
    setGlobalSearchTerm
  ] = useState('');

  const [activeModal, setActiveModal] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  const [density, setDensity] =
    useState(() => {
      const saved = readStorage(
        DENSITY_KEY,
        'comfortable'
      );

      return saved === 'compact'
        ? 'compact'
        : 'comfortable';
    });

  const [
    attendanceSessions,
    setAttendanceSessions
  ] = useState(readAttendanceSessions);

  const activeUser = currentUser;

  const effectiveUser =
    activeUser && personalLeaveBalance !== null
      ? {
          ...activeUser,
          leaveBalance: personalLeaveBalance
        }
      : activeUser;

  const userRole =
    getUserRole(effectiveUser);

  // ==========================================================
  // OPERATION REFERENCES
  // ==========================================================

  const currentIdentityRef = useRef('');

  const approvalLocks = useRef(new Set());

  const leaveSubmissionLock = useRef(false);

  const attendanceActionLock = useRef(false);

  const refreshSequence = useRef(0);

  const mountedRef = useRef(true);

  const effectiveIdentity = effectiveUser
    ? `${userRole}:${userIdOf(effectiveUser)}`
    : '';

  currentIdentityRef.current =
    effectiveIdentity;

  const isCurrentIdentity = identity =>
    mountedRef.current &&
    currentIdentityRef.current === identity;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ==========================================================
  // TOAST MANAGEMENT
  // ==========================================================

  const triggerToast = (
    message,
    type = 'info',
    undo = null
  ) => {
    setToast({
      id: Date.now(),
      message,
      type,
      undo
    });
  };

  const clearToast = () =>
    setToast(null);

  // ==========================================================
  // PERMISSION HELPERS
  // ==========================================================

  const requireUser = () => {
    if (
      isLoading ||
      loadError ||
      !effectiveUser ||
      !userIdOf(effectiveUser) ||
      userRole === 'unauthorized'
    ) {
      throw new Error(
        'An authorized user account is required.'
      );
    }

    return effectiveUser;
  };

  const requirePermission = (
    permission,
    message
  ) => {
    const user = requireUser();

    if (!permission(user)) {
      triggerToast(
        message,
        'error'
      );

      throw new Error(message);
    }

    return user;
  };

  // ==========================================================
  // CLEAR SCOPED APPLICATION DATA
  // ==========================================================

  const clearScopedData = () => {
    setPersonalLeaveBalance(null);
    setTeamMembers([]);
    setApprovals([]);
    setTasks([]);
    setProjects([]);
    setMyLeaveRequests([]);
    setNotifications([]);
    setRecentActivities([]);
    setPayrollData(null);
  };

  // ==========================================================
  // DEMO USER MANAGEMENT
  // ==========================================================

  // ==========================================================
  // LOAD APPLICATION DATA (SHARED AUTHENTICATED USER)
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);

      setLoadError('');

      clearScopedData();

      if (!authUser) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const storedProfile =
          await authService.getCurrentUser();

        const authenticatedUser = {
          ...storedProfile,
          ...authUser,
          id: authUser.id || storedProfile?.id,
          employeeId:
            authUser.employeeId ||
            authUser.employee_id ||
            storedProfile?.id,
          name: authUser.name || storedProfile?.name,
          email: authUser.email || storedProfile?.email,
          dept: authUser.department || storedProfile?.dept,
          department: authUser.department || storedProfile?.dept,
          role:
            authUser.designation ||
            storedProfile?.role ||
            'Team Lead Manager',
          systemRole: authUser.roles?.includes('TEAM_LEAD')
            ? 'TEAM_LEAD'
            : authUser.role || storedProfile?.systemRole || 'TEAM_LEAD'
        };

        const user = authenticatedUser;

        if (cancelled) {
          return;
        }

        setCurrentUser(authenticatedUser);

        if (
          getUserRole(user) === 'unauthorized'
        ) {
          clearScopedData();

          return;
        }

        const members =
          await teamService.getTeamMembers(
            user
          );

        const scopedMembers =
          getScopedTeamMembers(
            user,
            safeArray(members)
          );

        const personalBalance =
          await leaveService.getMyLeaveBalance(user);

        if (cancelled) return;

        setPersonalLeaveBalance(personalBalance);

        const [
          apprs,
          tsks,
          myLeaves,
          scopedProjects,
          scopedPayroll
        ] = await Promise.all([

          approvalService.getApprovals(
            user,
            scopedMembers
          ),

          taskService.getTasks(
            user,
            scopedMembers
          ),

          leaveService.getMyLeaveRequests(
            user
          ),

          projectService.getProjects(
            user,
            scopedMembers
          ),

          getUserRole(user) === 'employee'

            ? Promise.resolve(null)

            : payrollService.getAuthorizedPayroll(
                user,
                scopedMembers
              )
        ]);

        const visibleApprovals =
          getScopedApprovals(
            user,
            safeArray(apprs),
            scopedMembers
          ).map(normalizeLeaveApproval);

        const visibleTasks =
          getScopedTasks(
            user,
            safeArray(tsks),
            scopedMembers
          );

        const visibleProjects =
          safeArray(scopedProjects).filter(
            project =>
              canAccessProject(
                user,
                project,
                scopedMembers
              )
          );

        const scopedNotifications =
          await notificationService.getNotifications(
            user,
            scopedMembers,
            visibleTasks,
            visibleApprovals
          );

        if (cancelled) {
          return;
        }

        setTeamMembers(
          scopedMembers
        );

        setApprovals(
          visibleApprovals
        );

        setTasks(
          visibleTasks
        );

        setMyLeaveRequests(
          safeArray(myLeaves)
            .map(normalizePersonalLeave)
        );

        setProjects(
          visibleProjects
        );

        // Preserve authorized payroll filtering.

        if (
          scopedPayroll &&
          getUserRole(user) !== 'super-admin'
        ) {

          const allowedIds = new Set(
            scopedMembers.flatMap(
              getIdentityIds
            )
          );

          const teamList = safeArray(
            scopedPayroll.teamList
          ).filter(employee =>
            getIdentityIds(employee).some(
              id => allowedIds.has(id)
            )
          );

          const payslipsGenerated =
            teamList.filter(
              employee =>
                employee.payslip === 'Ready'
            ).length;

          setPayrollData({
            teamList,

            totalEmployeesInBatch:
              teamList.length,

            payslipsGenerated,

            payslipsPending:
              teamList.length -
              payslipsGenerated
          });

        } else {
          setPayrollData(
            scopedPayroll
          );
        }

        setNotifications(
          safeArray(scopedNotifications)
        );

        const visibleNames = new Set(
          scopedMembers.map(
            member => member.name
          )
        );

        setRecentActivities(
          safeArray(seedTeamActivities).filter(
            item =>
              item.user === user?.name ||
              visibleNames.has(item.user)
          )
        );

      } catch (error) {

        if (cancelled) {
          return;
        }

        clearScopedData();

        console.error(
          'Failed to load initial team lead data:',
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard data.'
        );

        triggerToast(
          'Unable to load dashboard data.',
          'error'
        );

      } finally {

        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };

  }, [authUser?.id, authUser?.employeeId]);

  // ==========================================================
  // REFRESH LEAVE AND APPROVAL DATA
  // ==========================================================

  const refreshApprovalData = async (
    options = {}
  ) => {
    const user = options.user ||
      requireUser();

    const identity = options.identity ||
      effectiveIdentity;

    const sequence =
      ++refreshSequence.current;

    const refreshedPersonalBalance =
      await leaveService.getMyLeaveBalance(user);

    const members =
      await teamService.getTeamMembers(user);

    const scopedMembers =
      getScopedTeamMembers(
        user,
        safeArray(members)
      );

    const [
      approvalRecords,
      personalLeaveRecords
    ] = await Promise.all([

      approvalService.getApprovals(
        user,
        scopedMembers
      ),

      leaveService.getMyLeaveRequests(
        user
      )
    ]);

    const visibleApprovals =
      getScopedApprovals(
        user,
        safeArray(approvalRecords),
        scopedMembers
      ).map(normalizeLeaveApproval);

    const visiblePersonalLeaves =
      safeArray(personalLeaveRecords)
        .map(normalizePersonalLeave);

    if (
      !isCurrentIdentity(identity) ||
      sequence !== refreshSequence.current
    ) {
      return null;
    }

    setPersonalLeaveBalance(refreshedPersonalBalance);

    setTeamMembers(
      scopedMembers
    );

    setApprovals(
      visibleApprovals
    );

    setMyLeaveRequests(
      visiblePersonalLeaves
    );

    return {
      teamMembers: scopedMembers,
      approvals: visibleApprovals,
      myLeaveRequests: visiblePersonalLeaves
    };
  };

  // ==========================================================
  // NOTIFICATION REFRESH
  // ==========================================================

  const refreshNotifications = async (
    user,
    identity,
    members,
    approvalRecords
  ) => {
    const updatedNotifications =
      await notificationService.getNotifications(
        user,
        members,
        tasks,
        approvalRecords
      );

    if (
      isCurrentIdentity(identity)
    ) {
      setNotifications(
        safeArray(updatedNotifications)
      );
    }

    return updatedNotifications;
  };

  // ==========================================================
  // CROSS-TAB LEAVE SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {
    if (
      !effectiveUser ||
      isLoading ||
      loadError ||
      userRole === 'unauthorized'
    ) {
      return;
    }

    let cancelled = false;

    const syncApprovalData = async () => {
      if (
        cancelled ||
        approvalLocks.current.size > 0 ||
        leaveSubmissionLock.current
      ) {
        return;
      }

      const identity =
        effectiveIdentity;

      try {
        const result =
          await refreshApprovalData({
            user: effectiveUser,
            identity
          });

        if (
          !cancelled &&
          result &&
          isCurrentIdentity(identity)
        ) {
          await refreshNotifications(
            effectiveUser,
            identity,
            result.teamMembers,
            result.approvals
          );
        }

      } catch (error) {

        console.error(
          'Approval synchronization failed:',
          error
        );
      }
    };

    const handleStorageChange = event => {
      const key = String(
        event.key || ''
      ).toLowerCase();

      if (
        event.key === null ||

        (
          key.startsWith(
            'technomold_teamlead_'
          ) &&

          (
            key.includes('approval') ||
            key.includes('leave') ||
            key.includes('team_member') ||
            key.includes('teammember') ||
            key === 'technomold_teamlead_members' ||
            key.includes('notification')
          )
        )
      ) {
        syncApprovalData();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        syncApprovalData();
      }
    };

    window.addEventListener(
      'storage',
      handleStorageChange
    );

    window.addEventListener(
      'focus',
      syncApprovalData
    );

    window.addEventListener(
      APPROVAL_SYNC_EVENT,
      syncApprovalData
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        'storage',
        handleStorageChange
      );

      window.removeEventListener(
        'focus',
        syncApprovalData
      );

      window.removeEventListener(
        APPROVAL_SYNC_EVENT,
        syncApprovalData
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };

  }, [
    effectiveIdentity,
    isLoading,
    loadError,
    tasks
  ]);

  // ==========================================================
  // LEGACY ATTENDANCE STORAGE
  // Existing attendance consumers are preserved.
  // ==========================================================

  const persistAttendanceSession = (
    key,
    entry
  ) => {
    const latest =
      readAttendanceSessions();

    const next = {
      ...latest,
      [key]: entry
    };

    const saved = writeStorage(
      ATTENDANCE_KEY,
      next
    );

    if (saved === false) {
      throw new Error(
        'Unable to save attendance.'
      );
    }

    setAttendanceSessions(next);

    window.dispatchEvent(
      new CustomEvent(
        'technomold:teamlead:attendance-punch',
        {
          detail: {
            employeeId: key,
            record: entry
          }
        }
      )
    );

    return entry;
  };

  useEffect(() => {
    const syncAttendance = () => {
      setAttendanceSessions(
        readAttendanceSessions()
      );
    };

    const handleStorage = event => {
      if (
        event.key === ATTENDANCE_KEY ||
        event.key === null
      ) {
        syncAttendance();
      }
    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    window.addEventListener(
      'focus',
      syncAttendance
    );

    window.addEventListener(
      'technomold:teamlead:attendance-punch',
      syncAttendance
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );

      window.removeEventListener(
        'focus',
        syncAttendance
      );

      window.removeEventListener(
        'technomold:teamlead:attendance-punch',
        syncAttendance
      );
    };

  }, []);

  // ==========================================================
  // ATTENDANCE HELPERS
  // ==========================================================

  const attendanceKey = () => {
    const user = requireUser();

    return String(
      user.employeeId ||
      user.id ||
      userIdOf(user)
    );
  };

  const formatLocation = location => {
    const rawLatitude =
      location?.lat ??
      location?.latitude;

    const rawLongitude =
      location?.lng ??
      location?.longitude;

    const latitude =
      Number(rawLatitude);

    const longitude =
      Number(rawLongitude);

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
        'Unable to verify attendance location.'
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

  const calculateBreakSeconds = breaks =>
    safeArray(breaks).reduce(
      (total, item) => {
        const start = new Date(
          item?.start
        ).getTime();

        const end = new Date(
          item?.end
        ).getTime();

        if (
          !Number.isFinite(start) ||
          !Number.isFinite(end)
        ) {
          return total;
        }

        return total + Math.max(
          0,
          (end - start) / 1000
        );
      },
      0
    );

  // ==========================================================
  // LEGACY CHECK-IN
  // ==========================================================

  const checkIn = async () => {
    if (
      attendanceActionLock.current
    ) {
      return false;
    }

    const identity =
      effectiveIdentity;

    attendanceActionLock.current = true;

    try {
      const key = attendanceKey();

      const existing =
        readAttendanceSessions()[key];

      if (
        existing?.checkIn &&
        !existing?.checkOut
      ) {
        triggerToast(
          'An open attendance session already exists.',
          'warn'
        );

        return false;
      }

      const location =
        await captureDeviceLocation();

      if (
        !isCurrentIdentity(identity)
      ) {
        return false;
      }

      const latest =
        readAttendanceSessions()[key];

      if (
        latest?.checkIn &&
        !latest?.checkOut
      ) {
        return false;
      }

      const entry = {
        checkIn:
          new Date().toISOString(),

        checkOut: null,

        checkInLocation:
          formatLocation(location),

        checkOutLocation: null,

        breaks: [],

        breakSeconds: 0,

        activeBreak: null,

        updatedAt: Date.now()
      };

      persistAttendanceSession(
        key,
        entry
      );

      triggerToast(
        'Check-in recorded',
        'good'
      );

      return true;

    } catch (error) {

      if (
        isCurrentIdentity(identity)
      ) {
        triggerToast(
          error?.message ||
          'Unable to complete check-in.',
          'error'
        );
      }

      return false;

    } finally {

      attendanceActionLock.current = false;
    }
  };

  // ==========================================================
  // LEGACY CHECK-OUT
  // ==========================================================

  const checkOut = async () => {
    if (
      attendanceActionLock.current
    ) {
      return false;
    }

    const identity =
      effectiveIdentity;

    attendanceActionLock.current = true;

    try {
      const key =
        attendanceKey();

      const entry =
        readAttendanceSessions()[key];

      if (
        !entry?.checkIn ||
        entry.checkOut
      ) {
        return false;
      }

      const location =
        await captureDeviceLocation();

      if (
        !isCurrentIdentity(identity)
      ) {
        return false;
      }

      const latest =
        readAttendanceSessions()[key];

      if (
        !latest?.checkIn ||
        latest.checkOut ||
        latest.checkIn !== entry.checkIn
      ) {
        return false;
      }

      const checkOutTime =
        new Date().toISOString();

      const breaks = [
        ...safeArray(latest.breaks)
      ];

      if (latest.activeBreak) {
        breaks.push({
          ...latest.activeBreak,
          end: checkOutTime
        });
      }

      const breakSeconds =
        calculateBreakSeconds(breaks);

      persistAttendanceSession(
        key,
        {
          ...latest,

          checkOut: checkOutTime,

          checkOutLocation:
            formatLocation(location),

          breaks,

          activeBreak: null,

          breakSeconds,

          updatedAt: Date.now()
        }
      );

      triggerToast(
        'Check-out recorded',
        'good'
      );

      return true;

    } catch (error) {

      if (
        isCurrentIdentity(identity)
      ) {
        triggerToast(
          error?.message ||
          'Unable to complete check-out.',
          'error'
        );
      }

      return false;

    } finally {

      attendanceActionLock.current = false;
    }
  };

  // ==========================================================
  // LEGACY BREAK MANAGEMENT
  // ==========================================================

  const startBreak = type => {
    if (
      attendanceActionLock.current
    ) {
      return false;
    }

    try {
      const key = attendanceKey();

      const entry =
        readAttendanceSessions()[key];

      if (
        !entry?.checkIn ||
        entry.checkOut ||
        entry.activeBreak
      ) {
        return false;
      }

      persistAttendanceSession(
        key,
        {
          ...entry,

          activeBreak: {
            type: type || 'Break',

            start:
              new Date().toISOString()
          },

          updatedAt: Date.now()
        }
      );

      return true;

    } catch (error) {

      triggerToast(
        error?.message ||
        'Unable to start break.',
        'error'
      );

      return false;
    }
  };

  const endBreak = () => {
    if (
      attendanceActionLock.current
    ) {
      return false;
    }

    try {
      const key =
        attendanceKey();

      const entry =
        readAttendanceSessions()[key];

      if (
        !entry?.activeBreak ||
        entry.checkOut
      ) {
        return false;
      }

      const breaks = [
        ...safeArray(entry.breaks),

        {
          ...entry.activeBreak,

          end:
            new Date().toISOString()
        }
      ];

      persistAttendanceSession(
        key,
        {
          ...entry,

          breaks,

          breakSeconds:
            calculateBreakSeconds(breaks),

          activeBreak: null,

          updatedAt: Date.now()
        }
      );

      return true;

    } catch (error) {

      triggerToast(
        error?.message ||
        'Unable to resume work.',
        'error'
      );

      return false;
    }
  };

  // ==========================================================
  // DISPLAY DENSITY
  // ==========================================================

  useEffect(() => {
    const moduleRoot =
      document.querySelector(
        '.team-lead-module'
      );

    if (moduleRoot) {
      if (density === 'compact') {
        moduleRoot.setAttribute(
          'data-teamlead-density',
          'compact'
        );
      } else {
        moduleRoot.removeAttribute(
          'data-teamlead-density'
        );
      }
    }

    writeStorage(
      DENSITY_KEY,
      density
    );

  }, [
    density,
    isLoading
  ]);

  // ==========================================================
  // APPROVAL MANAGEMENT
  // ==========================================================

  const handleDecideApproval = async (
    id,
    status,
    comment = '',
    options = {}
  ) => {
    const user = requirePermission(
      canManageApprovals,
      'You do not have permission to review approvals.'
    );

    const identity =
      effectiveIdentity;

    const decision =
      normalize(status);

    if (
      !['approved', 'rejected', 'correction-required'].includes(
        decision
      )
    ) {
      throw new Error(
        'Invalid approval decision.'
      );
    }

    if (
      id == null ||
      String(id).trim() === ''
    ) {
      throw new Error(
        'Approval request ID is required.'
      );
    }

    const lockKey = String(id);

    if (
      approvalLocks.current.has(lockKey)
    ) {
      throw new Error(
        'This approval is already being processed.'
      );
    }

    const decisionComment =
      String(comment || '').trim();

    const allowEmptyComment =
      options?.allowEmptyComment === true;

    if (
      ['rejected', 'correction-required'].includes(decision) && !decisionComment
    ) {
      throw new Error(
        'Rejection reason is required.'
      );
    }

    if (
      !allowEmptyComment &&
      !decisionComment
    ) {
      throw new Error(
        'A decision comment is required.'
      );
    }

    if (
      decisionComment.length >
      MAX_COMMENT_LENGTH
    ) {
      throw new Error(
        `Decision comments cannot exceed ${MAX_COMMENT_LENGTH} characters.`
      );
    }

    approvalLocks.current.add(lockKey);

    try {
      // Read the latest approval from storage/API
      // instead of relying only on stale React state.

      const latestApprovals =
        await approvalService.getApprovals(
          user,
          teamMembers
        );

      if (
        !isCurrentIdentity(identity)
      ) {
        throw new Error(
          'Your active user account has changed.'
        );
      }

      const scopedApprovals =
        getScopedApprovals(
          user,
          safeArray(latestApprovals),
          teamMembers
        ).map(normalizeLeaveApproval);

      const previous =
        scopedApprovals.find(
          approval =>
            sameId(approval.id, id)
        );

      if (!previous) {
        throw new Error(
          'Approval request not found or access is restricted.'
        );
      }

      if (
        matchesIdentity(
          user,
          previous.employeeId
        )
      ) {
        throw new Error(
          'You cannot approve or reject your own request.'
        );
      }

      if (
        !isPendingApproval(previous)
      ) {
        throw new Error(
          'This request has already been reviewed.'
        );
      }

      if (
        previous.category === 'Leave Approval' &&
        decision === 'approved'
      ) {
        const totalDays = Number(
          previous.totalDays
        );

        if (
          !hasValidLeaveDates(previous) ||
          !Number.isFinite(totalDays) ||
          totalDays <= 0
        ) {
          throw new Error(
            'The leave request contains invalid dates or leave days.'
          );
        }
      }

      const actor = {
        name: user.name,

        employeeId: userIdOf(user),

        role:
          user.role ||
          'Team Lead'
      };

      const result =
        await approvalService.decideApproval(
          id,
          decision,
          decisionComment,
          actor,
          user,
          teamMembers,
          { allowEmptyComment }
        );

      const updated =
        normalizeLeaveApproval(
          requireSuccessfulResult(
            result,
            'Unable to update this approval.'
          )
        );

      if (
        !sameId(updated.id, id)
      ) {
        throw new Error(
          'Approval service returned an invalid request.'
        );
      }

      if (
        !isCurrentIdentity(identity)
      ) {
        return updated;
      }

      // Cancel any earlier refresh result.

      refreshSequence.current += 1;

      setApprovals(previousApprovals =>
        previousApprovals.map(approval =>
          sameId(approval.id, id)
            ? updated
            : approval
        )
      );

      setNotifications(previousNotifications =>
        previousNotifications.filter(
          item =>
            !sameId(
              item.id,
              `APPROVAL-NOTIF-${id}`
            )
        )
      );

      const awaitingHR =
        updated.category === 'Leave Approval' &&
        updated.reviewStage === 'hr-review';

      const employeeName =
        updated.employeeName ||
        'Employee';

      const requestType =
        updated.requestType ||
        'request';

      const activityMessage =
        awaitingHR

          ? `approved ${employeeName}'s leave request and moved it to HR review`

          : `${decision} ${employeeName}'s ${requestType} request`;

      setRecentActivities(
        previousActivities => [

          {
            id: `ACT-DECISION-${Date.now()}`,

            user: actor.name,

            action: activityMessage,

            time: 'Just now',

            type: 'approval'
          },

          ...previousActivities

        ].slice(0, 20)
      );

      // Refresh employee records and leave balances.
      // The service remains responsible for deductions.

      let syncFailed = false;

      try {

        const refreshed =
          await refreshApprovalData({
            user,
            identity
          });

        if (refreshed) {
          await refreshNotifications(
            user,
            identity,
            refreshed.teamMembers,
            refreshed.approvals
          );
        }

      } catch (syncError) {

        syncFailed = true;

        console.error(
          'Approval saved but synchronization failed:',
          syncError
        );
      }

      if (
        isCurrentIdentity(identity)
      ) {
        triggerToast(
          syncFailed

            ? 'Decision saved, but some dashboard data could not be refreshed.'

            : awaitingHR

              ? 'Team Lead approved. Pending HR approval.'

              : `${employeeName}: ${requestType} ${decision}`,

          syncFailed

            ? 'warn'

            : decision === 'approved'

              ? 'good'

              : 'warn'
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          APPROVAL_SYNC_EVENT,
          {
            detail: {
              approvalId: id,
              status: updated.status,
              reviewStage:
                updated.reviewStage
            }
          }
        )
      );

      return updated;

    } catch (error) {

      if (
        isCurrentIdentity(identity)
      ) {
        triggerToast(
          error?.message ||
          'Unable to process this approval.',
          'error'
        );
      }

      throw error;

    } finally {

      approvalLocks.current.delete(
        lockKey
      );
    }
  };

  // ==========================================================
  // TASK CREATION
  // ==========================================================

  const handleCreateTask = async taskData => {
    const user = requirePermission(
      canAssignTasks,
      'You do not have permission to assign tasks.'
    );

    const identity =
      effectiveIdentity;

    if (
      !String(taskData?.title || '').trim()
    ) {
      throw new Error(
        'Task title is required.'
      );
    }

    const assigneeId =
      taskData.assigneeId ||
      taskData.employeeId;

    if (!assigneeId) {
      throw new Error(
        'Select an employee for the task.'
      );
    }

    const permittedTasks =
      getScopedTasks(
        user,
        [{
          ...taskData,
          assigneeId
        }],
        teamMembers
      );

    if (!permittedTasks.length) {
      throw new Error(
        'You cannot assign tasks outside your authorized team.'
      );
    }

    if (
      taskData.startDate &&
      taskData.dueDate &&
      taskData.dueDate < taskData.startDate
    ) {
      throw new Error(
        'Due date must be on or after the start date.'
      );
    }

    const newTask =
      requireSuccessfulResult(
        await taskService.createTask(
          taskData,
          user,
          teamMembers
        ),
        'Unable to create task.'
      );

    if (
      isCurrentIdentity(identity)
    ) {
      setTasks(previous => [
        newTask,
        ...previous
      ]);

      triggerToast(
        `Task "${newTask.title}" created successfully`,
        'good'
      );
    }

    return newTask;
  };

  // ==========================================================
  // LEAVE REQUEST SUBMISSION
  // ==========================================================

  const handleSubmitLeaveRequest =
    async leaveData => {

      const user = requireUser();

      const identity =
        effectiveIdentity;

      if (
        leaveSubmissionLock.current
      ) {
        throw new Error(
          'A leave request is already being submitted.'
        );
      }

      if (
        !leaveData ||
        typeof leaveData !== 'object'
      ) {
        throw new Error(
          'Leave request details are required.'
        );
      }

      leaveSubmissionLock.current = true;

      try {

        const request =
          requireSuccessfulResult(
            await leaveService.submitMyLeaveRequest({
              ...leaveData,

              employeeName: user.name,

              employeeId: userIdOf(user),

              status: 'pending',

              teamLeadApproval: 'pending',

              hrApproval: 'pending',

              managerApprovalStatus: 'pending',

              hrApprovalStatus: 'pending',

              reviewStage: 'team-lead-review'
            }, user),
            'Unable to submit leave request.'
          );

        const normalizedRequest =
          normalizePersonalLeave(request);

        if (
          !isCurrentIdentity(identity)
        ) {
          return normalizedRequest;
        }

        refreshSequence.current += 1;

        setMyLeaveRequests(previous => [

          normalizedRequest,

          ...previous.filter(item =>
            !sameId(
              item.id,
              normalizedRequest.id
            )
          )
        ]);

        let syncFailed = false;

        try {

          const refreshed =
            await refreshApprovalData({
              user,
              identity
            });

          if (refreshed) {
            await refreshNotifications(
              user,
              identity,
              refreshed.teamMembers,
              refreshed.approvals
            );
          }

        } catch (error) {

          syncFailed = true;

          console.error(
            'Leave saved but synchronization failed:',
            error
          );
        }

        if (
          isCurrentIdentity(identity)
        ) {
          triggerToast(
            syncFailed

              ? 'Leave request saved, but dashboard synchronization failed.'

              : 'Leave request submitted. Pending Team Lead review.',

            syncFailed
              ? 'warn'
              : 'good'
          );
        }

        window.dispatchEvent(
          new CustomEvent(
            APPROVAL_SYNC_EVENT,
            {
              detail: {
                leaveRequestId:
                  normalizedRequest.id,

                status:
                  normalizedRequest.status
              }
            }
          )
        );

        return normalizedRequest;

      } catch (error) {

        if (
          isCurrentIdentity(identity)
        ) {
          triggerToast(
            error?.message ||
            'Unable to submit leave request.',
            'error'
          );
        }

        throw error;

      } finally {

        leaveSubmissionLock.current = false;
      }
    };

  // ==========================================================
  // PROJECT CREATION
  // ==========================================================

  const handleCreateProject =
    async projectData => {

      const user = requirePermission(
        canManageProjects,
        'You do not have permission to create projects.'
      );

      const identity =
        effectiveIdentity;

      const allowedMemberIds =
        new Set(
          teamMembers.flatMap(
            getIdentityIds
          )
        );

      const requestedMemberIds =
        safeArray(
          projectData?.memberIds
        ).map(String);

      if (
        getUserRole(user) !== 'super-admin' &&

        requestedMemberIds.some(
          id =>
            !allowedMemberIds.has(id)
        )
      ) {
        throw new Error(
          'Project members must belong to your authorized team.'
        );
      }

      const created =
        requireSuccessfulResult(
          await projectService.createProject(
            {
              ...projectData,
              leadName: user.name
            },
            user,
            teamMembers
          ),
          'Unable to create project.'
        );

      if (
        isCurrentIdentity(identity)
      ) {
        setProjects(previous => [
          created,
          ...previous
        ]);
      }

      return created;
    };

  // ==========================================================
  // PROJECT COMMENTS
  // ==========================================================

  const runProjectMutation = async (
    projectId,
    operation,
    successMessage
  ) => {
    const user = effectiveUser;

    if (!user || !canManageProjects(user)) {
      throw new Error(
        'Project editing permission is required.'
      );
    }

    const result = await operation(user);

    if (!result || result.success === false) {
      throw new Error(
        result?.message || 'Unable to update project.'
      );
    }

    const updated = result.project || result;

    if (!sameId(updated.id, projectId)) {
      throw new Error(
        'Invalid project update response.'
      );
    }

    setProjects(previous =>
      previous.map(item =>
        sameId(item.id, projectId)
          ? updated
          : item
      )
    );

    triggerToast(successMessage, 'good');

    return updated;
  };

  const handleUpdateProject = (
    projectId,
    updates
  ) =>
    runProjectMutation(
      projectId,
      user => projectService.updateProject(
        projectId,
        updates,
        user,
        teamMembers
      ),
      'Project updated successfully.'
    );

  const handleAddMilestone = (
    projectId,
    title
  ) =>
    runProjectMutation(
      projectId,
      user => projectService.addMilestone(
        projectId,
        title,
        user,
        teamMembers
      ),
      'Milestone added.'
    );

  const handleUpdateMilestone = (
    projectId,
    milestoneId,
    done
  ) =>
    runProjectMutation(
      projectId,
      user => projectService.updateMilestone(
        projectId,
        milestoneId,
        done,
        user,
        teamMembers
      ),
      'Milestone updated.'
    );

  const handleUpdateTaskRecord = async (taskId, updates) => {
    const user = effectiveUser;

    if (!user || !userIdOf(user)) {
      throw new Error('An authorized user is required.');
    }

    const identity =
      typeof effectiveIdentity !== 'undefined'
        ? effectiveIdentity
        : null;

    const updated = await taskService.updateTask(
      taskId,
      updates,
      user,
      teamMembers
    );

    if (!updated?.id || !sameId(updated.id, taskId)) {
      throw new Error('Task update could not be confirmed.');
    }

    if (
      identity !== null &&
      typeof isCurrentIdentity === 'function' &&
      !isCurrentIdentity(identity)
    ) {
      return updated;
    }

    setTasks(previous =>
      previous.map(task =>
        sameId(task.id, taskId)
          ? updated
          : task
      )
    );

    return updated;
  };

  const handleAddProjectComment =
    async (
      projectId,
      message
    ) => {

      const user = requireUser();

      const identity =
        effectiveIdentity;

      const project = projects.find(
        item =>
          sameId(
            item.id,
            projectId
          )
      );

      if (
        !project ||
        !canAccessProject(
          user,
          project,
          teamMembers
        )
      ) {
        throw new Error(
          'You cannot access this project.'
        );
      }

      const cleanMessage =
        String(message || '').trim();

      if (!cleanMessage) {
        throw new Error(
          'Enter a project comment.'
        );
      }

      const updated =
        requireSuccessfulResult(
          await projectService.addComment(
            projectId,
            cleanMessage,
            user.name,
            user.role,
            user,
            teamMembers
          ),
          'Unable to add project comment.'
        );

      if (
        isCurrentIdentity(identity)
      ) {
        setProjects(previous =>
          previous.map(item =>
            sameId(
              item.id,
              updated.id
            )
              ? updated
              : item
          )
        );
      }

      return updated;
    };

  // ==========================================================
  // NOTIFICATION MANAGEMENT
  // ==========================================================

  const handleMarkNotificationRead =
    async notificationId => {

      requireUser();

      const identity =
        effectiveIdentity;

      const exists =
        notifications.some(item =>
          sameId(
            item.id,
            notificationId
          )
        );

      if (!exists) {
        return false;
      }

      const result =
        await notificationService.markAsRead(notificationId, requireUser());

      if (
        result === false ||
        result?.success === false
      ) {
        throw new Error(
          result?.message ||
          'Unable to update notification.'
        );
      }

      if (
        isCurrentIdentity(identity)
      ) {
        setNotifications(previous =>
          previous.map(item =>
            sameId(
              item.id,
              notificationId
            )

              ? {
                  ...item,
                  read: true
                }

              : item
          )
        );
      }

      return true;
    };

  // ==========================================================
  // PERSONAL LEAVE DECISIONS
  // ==========================================================

  // BULK_NOTIFICATION_READ_V1

  const handleMarkAllNotificationsRead = async (notificationIds) => {

    const user = requireUser();

    const identity = effectiveIdentity;

    const allowedIds = new Set(

      safeArray(notifications)
        .filter(item => item?.id != null && !item.read)
        .map(item => String(item.id))

    );

    const ids = [

      ...new Set(

        safeArray(notificationIds)
          .map(String)
          .filter(id => allowedIds.has(id))

      )

    ];

    if (!ids.length) {
      return {
        success: true,
        count: 0
      };
    }

    const result =
      await notificationService.markAllAsRead(
        ids,
        user
      );

    if (!result || result.success !== true) {
      throw new Error(
        result?.message ||
        'Unable to update notifications.'
      );
    }

    if (!isCurrentIdentity(identity)) {
      return {
        success: false,
        message: 'Account changed during the operation.'
      };
    }

    const updatedIds = new Set(ids);

    setNotifications(previous =>
      previous.map(item =>
        updatedIds.has(String(item.id))
          ? { ...item, read: true }
          : item
      )
    );

    return result;

  };

  const handleDecideLeaveRequest =
    async (
      id,
      approver,
      decision,
      comment = ''
    ) => {

      requireUser();

      // Employees cannot approve their own leave.

      throw new Error(
        'Personal leave requests must be reviewed by an authorized approver through the approval workflow.'
      );
    };

  // ==========================================================
  // TASK STATUS UPDATE
  // ==========================================================

  const handleUpdateTaskStatus =
    async (
      taskId,
      newStatus
    ) => {

      const user = requireUser();

      const identity =
        effectiveIdentity;

      const target = tasks.find(
        task =>
          sameId(task.id, taskId)
      );

      if (
        !target ||
        !getScopedTasks(
          user,
          [target],
          teamMembers
        ).length
      ) {
        throw new Error(
          'You cannot update this task.'
        );
      }

      const updated =
        requireSuccessfulResult(
          await taskService.updateTaskStatus(
            taskId,
            newStatus,
            user,
            teamMembers
          ),
          'Unable to update task.'
        );

      if (
        !isCurrentIdentity(identity)
      ) {
        return updated;
      }

      setTasks(previous =>
        previous.map(task =>
          sameId(task.id, taskId)
            ? updated
            : task
        )
      );

      // A notification failure must not report
      // an already saved task update as failed.

      let notificationFailed = false;

      try {

        const event =
          await notificationService.addNotification({

            type: 'task',

            title: 'Task status changed',

            body:
              `${updated.title} is now ${newStatus}.`,

            author:
              user.name || 'Team Lead',

            department: 'Team Tasks',

            priority: 'Normal',

            teamMemberId:
              updated.assigneeId
          });

        if (
          event &&
          event.success !== false &&
          isCurrentIdentity(identity)
        ) {
          setNotifications(previous => [
            event,
            ...previous
          ]);
        } else if (
          !event ||
          event.success === false
        ) {
          notificationFailed = true;
        }

      } catch (error) {

        notificationFailed = true;

        console.error(
          'Task saved but notification failed:',
          error
        );
      }

      if (
        isCurrentIdentity(identity)
      ) {
        triggerToast(
          notificationFailed

            ? 'Task updated, but notification creation failed.'

            : `Task status updated to "${newStatus}"`,

          notificationFailed
            ? 'warn'
            : 'info'
        );
      }

      return updated;
    };

  // ==========================================================
  // TASK DELETION
  // ==========================================================

  const handleDeleteTask =
    async taskId => {

      const user = requirePermission(
        canAssignTasks,
        'You do not have permission to delete tasks.'
      );

      const identity =
        effectiveIdentity;

      const taskToDelete =
        tasks.find(task =>
          sameId(task.id, taskId)
        );

      if (
        !taskToDelete ||
        !getScopedTasks(
          user,
          [taskToDelete],
          teamMembers
        ).length
      ) {
        throw new Error(
          'You cannot delete this task.'
        );
      }

      const result =
        await taskService.deleteTask(
          taskId,
          user,
          teamMembers
        );

      if (
        result === false ||
        result?.success === false
      ) {
        throw new Error(
          result?.message ||
          'Unable to delete task.'
        );
      }

      if (
        !isCurrentIdentity(identity)
      ) {
        return true;
      }

      setTasks(previous =>
        previous.filter(
          task =>
            !sameId(task.id, taskId)
        )
      );

      let undoStarted = false;

      triggerToast(
        'Task deleted',
        'warn',

        async () => {

          if (undoStarted) {
            return;
          }

          if (
            !isCurrentIdentity(identity)
          ) {
            return;
          }

          undoStarted = true;

          try {
            const restored =
              requireSuccessfulResult(
                await taskService.createTask(
                  taskToDelete,
                  user,
                  teamMembers
                ),
                'Unable to restore task.'
              );

            if (
              isCurrentIdentity(identity)
            ) {
              setTasks(previous => [
                restored,
                ...previous
              ]);

              triggerToast(
                'Task restored as a new task.',
                'good'
              );
            }

          } catch (error) {

            if (
              isCurrentIdentity(identity)
            ) {
              triggerToast(
                error?.message ||
                'Unable to restore task.',
                'error'
              );
            }
          }
        }
      );

      return true;
    };

  // ==========================================================
  // TASK COMMENTS
  // ==========================================================

  const handleAddTaskComment =
    async (
      taskId,
      text
    ) => {

      const user = requireUser();

      const identity =
        effectiveIdentity;

      const target = tasks.find(
        task =>
          sameId(task.id, taskId)
      );

      if (
        !target ||
        !getScopedTasks(
          user,
          [target],
          teamMembers
        ).length
      ) {
        throw new Error(
          'You cannot access this task.'
        );
      }

      const comment =
        String(text || '').trim();

      if (!comment) {
        throw new Error(
          'Enter a task comment.'
        );
      }

      const updated =
        requireSuccessfulResult(
          await taskService.addTaskComment(
            taskId,
            comment,
            user.name,
            user,
            teamMembers
          ),
          'Unable to add task comment.'
        );

      if (
        isCurrentIdentity(identity)
      ) {
        setTasks(previous =>
          previous.map(task =>
            sameId(task.id, taskId)
              ? updated
              : task
          )
        );

        triggerToast(
          'Comment added',
          'info'
        );
      }

      return updated;
    };

  // ==========================================================
  // PROFILE MANAGEMENT
  // ==========================================================

  const handleUpdateProfile =
    async updates => {

      requireUser();

      const identity =
        effectiveIdentity;

      const allowedFields = [
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
      ];

      const safeUpdates =
        Object.fromEntries(
          Object.entries(
            updates || {}
          ).filter(
            ([key]) =>
              allowedFields.includes(key)
          )
        );

      const updated =
        requireSuccessfulResult(
          await authService.updateProfile(
            safeUpdates
          ),
          'Unable to update profile.'
        );

      if (updateSharedProfile) {
        await updateSharedProfile(safeUpdates);
      }

      if (
        isCurrentIdentity(identity)
      ) {
        setCurrentUser(prev => ({
          ...(prev || {}),
          ...updated
        }));

        triggerToast(
          'Your profile has been updated',
          'good'
        );
      }

      return updated;
    };

  // ==========================================================
  // DASHBOARD COUNTS
  // ==========================================================

  const pendingApprovalsCount =
    canManageApprovals(effectiveUser)

      ? approvals.filter(
          isPendingApproval
        ).length

      : 0;

  const pendingHRApprovalsCount =
    canManageApprovals(effectiveUser)

      ? approvals.filter(
          approval =>
            approval.category === 'Leave Approval' &&
            approval.reviewStage === 'hr-review'
        ).length

      : 0;

  // ==========================================================
  // CONTEXT VALUE
  // Existing exported properties are preserved.
  // ==========================================================

  const value = {

    currentUser:
      effectiveUser,

    authenticatedUser:
      currentUser,

    userRole,

    isLoading,

    loadError,

    signOut: sharedLogout,

    logout: sharedLogout,

    // Attendance

    attendanceSessions,

    checkIn,
    checkOut,
    startBreak,
    endBreak,

    // Application data

    teamMembers,

    approvals,

    tasks,

    myLeaveRequests,

    projects,

    payrollData,

    notifications,

    recentActivities,

    // UI state

    toast,

    density,

    globalSearchTerm,

    pendingApprovalsCount,

    pendingHRApprovalsCount,

    activeModal,

    // UI actions

    setDensity,

    setGlobalSearchTerm,

    setActiveModal,

    triggerToast,

    clearToast,

    // Approval actions

    decideApproval:
      handleDecideApproval,

    refreshApprovalData,

    // Task actions

    createTask:
      handleCreateTask,

    updateTaskStatus:
      handleUpdateTaskStatus,

    deleteTask:
      handleDeleteTask,

    addTaskComment:
      handleAddTaskComment,

    // Project actions

    createProject:
      handleCreateProject,

    addProjectComment: handleAddProjectComment,
    updateTask: handleUpdateTaskRecord,
    updateProject: handleUpdateProject,
    addMilestone: handleAddMilestone,
    updateMilestone: handleUpdateMilestone,

    // Notification actions

    markAllNotificationsRead:
      handleMarkAllNotificationsRead,

    markNotificationRead:
      handleMarkNotificationRead,

    // Leave actions

    submitLeaveRequest:
      handleSubmitLeaveRequest,

    decideLeaveRequest:
      handleDecideLeaveRequest,

    // Profile actions

    updateProfile:
      handleUpdateProfile
  };

  return (
    <TeamLeadContext.Provider
      value={value}
    >
      {children}
    </TeamLeadContext.Provider>
  );
};

// ============================================================
// CUSTOM CONTEXT HOOK
// ============================================================

export const useTeamLead = () => {
  const context =
    useContext(TeamLeadContext);

  if (!context) {
    throw new Error(
      'useTeamLead must be used within a TeamLeadProvider'
    );
  }

  return context;
};