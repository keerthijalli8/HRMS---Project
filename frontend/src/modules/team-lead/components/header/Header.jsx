import { useSyncedEmployeeAvatar } from '../../utils/employeeData.js';

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { LocationModal } from '../common/LocationModal.jsx';
import { ModalPortal } from '../common/ModalPortal.jsx';
import { getEmployeeId } from '../../utils/employeeData.js';
import { getUserRole } from '../../utils/dataScope.js';
import { DashboardSwitcher } from '../../../../components/DashboardSwitcher.jsx';

import {
  Bell,
  User,
  ChevronDown,
  Play,
  Coffee,
  Search,
  X,
  MapPin,
  Megaphone,
  CheckSquare,
  BriefcaseBusiness,
  CalendarDays,
  Users,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  Settings as SettingsIcon,
  Download,
  Command
} from 'lucide-react';

// ============================================================
// PAGE TITLES
// ============================================================

const PAGE_TITLES = {
  '/team-lead/dashboard': 'Team Lead Dashboard',
  '/team-lead/team': 'My Team',
  '/team-lead/my-attendance': 'My Attendance',
  '/team-lead/team-attendance': 'Team Attendance',
  '/team-lead/leave': 'Leave Approvals',
  '/team-lead/attendance-regularization': 'Attendance Regularization',
  '/team-lead/tasks': 'Task Management',
  '/team-lead/timesheet-approval': 'Timesheet Approval',
  '/team-lead/performance': 'Team Performance',
  '/team-lead/my-calendar': 'My Calendar',
  '/team-lead/team-calendar': 'Team Calendar',
  '/team-lead/team-reports': 'Team Reports',
  '/team-lead/projects': 'Projects',
  '/team-lead/approvals': 'Approvals',
  '/team-lead/my-payslip': 'My Payslips',
  '/team-lead/settings': 'Settings',
  '/team-lead/help': 'Help & Support'
};

const EMPLOYEE_PAGE_TITLES = {
  '/team-lead/employee/personal-information': 'Personal Information',
  '/team-lead/employee/contact-information': 'Contact Information',
  '/team-lead/employee/employment-details': 'Employment Details',
  '/team-lead/employee/attendance': 'Attendance',
  '/team-lead/employee/leave-management': 'Leave Management',
  '/team-lead/employee/salary-payroll': 'Payslip',
  '/team-lead/employee/documents': 'Documents',
  '/team-lead/employee/performance': 'Performance',
  '/team-lead/employee/settings': 'Settings'
};

// ============================================================
// REFERENCE TYPOGRAPHY
// ============================================================

const BODY_FONT = "var(--hrms-font, 'Inter', 'Segoe UI', Arial, sans-serif)";

const DISPLAY_FONT = "var(--hrms-display, 'Syne', 'Inter', sans-serif)";

const DATA_FONT = "var(--hrms-data, 'Space Mono', 'Consolas', monospace)";

// ============================================================
// COMMON UI STYLES
// ============================================================

const ICON_BUTTON = `
  relative flex h-10 w-10 shrink-0
  items-center justify-center rounded-lg
  border border-transparent text-muted
  transition-all duration-200
  hover:bg-white/[0.06] hover:text-ink
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-[#6ee7d080]
`;

const ATTENDANCE_BUTTON = `
  inline-flex min-h-[40px] items-center
  justify-center gap-2 rounded-lg
  px-3.5 py-2 text-[14px]
  font-body font-medium
  whitespace-nowrap transition-all duration-200
  disabled:cursor-not-allowed disabled:opacity-60
`;

const SEARCH_SECTION_TITLE = `
  px-3 py-2 font-body text-[12px]
  font-medium uppercase tracking-wider text-muted
`;

const SEARCH_RESULT_CLASS = `
  flex w-full items-center gap-3
  rounded-xl px-3 py-3 text-left
  font-body hover:bg-white/[0.06] transition
`;

const PANEL_CARD = `
  rounded-xl border border-white/10
  bg-white/[0.03]
`;

const TIMER_CLASS = `
  attendance-timer
  mt-0.5 font-data text-timer
  font-bold tabular-nums
  leading-tight tracking-tight text-ink
`;

const TIMER_STYLE = {
  fontFamily: DATA_FONT,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums'
};

// ============================================================
// ATTENDANCE HELPERS
// ============================================================

const formatAttendanceTime = value => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
};

const getValidWorkingTime = value => {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{1,3}):([0-5]\d):([0-5]\d)$/);

  if (!match) return null;

  return `${match[1].padStart(2, '0')}:${match[2]}:${match[3]}`;
};

const formatCompletedHours = value => {
  const validTime = getValidWorkingTime(value);

  if (!validTime) {
    return 'Hours unavailable';
  }

  const [hours, minutes] = validTime.split(':');

  return `${Number(hours)}h ${minutes}m`;
};

// ============================================================
// ATTENDANCE STATUS COMPONENT
// ============================================================

const AttendanceStatus = ({
  status,
  workingTime,
  breakTime,
  checkInTimestamp,
  checkOutTimestamp
}) => {
  const checkInTime = formatAttendanceTime(checkInTimestamp);
  const checkOutTime = formatAttendanceTime(checkOutTimestamp);

  const validWorkingTime = getValidWorkingTime(workingTime);
  const validBreakTime = getValidWorkingTime(breakTime);

  // BEFORE CHECK-IN

  if (status === 'Not Checked In') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="
          flex h-9 w-9 shrink-0 items-center
          justify-center rounded-lg bg-white/[0.04]
        ">
          <Clock
            size={19}
            strokeWidth={1.7}
            className="text-muted"
          />
        </div>

        <div className="flex flex-col leading-snug">
          <span className="font-body text-[14px] font-medium text-ink">
            Not Checked In
          </span>

          <span className="mt-0.5 font-body text-[12px] font-normal text-muted">
            Ready to start
          </span>
        </div>
      </div>
    );
  }

  // CURRENTLY WORKING

  if (status === 'Checked In') {
    return (
      <div
        className="flex shrink-0 items-center gap-3"
        title={
          checkInTime
            ? `Checked in at ${checkInTime}`
            : 'Active attendance session'
        }
      >
        <span className="
          h-2.5 w-2.5 shrink-0 rounded-full
          bg-good motion-safe:animate-pulse
        " />

        <div className="flex flex-col leading-snug">
          <span className="font-body text-[12px] font-medium text-good">
            Working Now
          </span>

          <span className={TIMER_CLASS} style={TIMER_STYLE}>
            {validWorkingTime || 'Time unavailable'}
          </span>

          {checkInTime && (
            <span className="font-body text-[11px] font-normal text-muted">
              Since{' '}
              <span className="font-data">{checkInTime}</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // CURRENTLY ON BREAK

  if (status === 'On Break') {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <Coffee
          size={22}
          strokeWidth={1.7}
          className="text-warn"
        />

        <div className="flex flex-col leading-snug">
          <span className="font-body text-[12px] font-medium text-warn">
            On Break
          </span>

          <span className={TIMER_CLASS} style={TIMER_STYLE}>
            {validBreakTime || 'Time unavailable'}
          </span>

          <span className="font-body text-[11px] font-normal text-muted">
            {validWorkingTime ? (
              <>
                Worked{' '}
                <span className="font-data">{validWorkingTime}</span>
              </>
            ) : 'Break in progress'}
          </span>
        </div>
      </div>
    );
  }

  // AFTER CHECKOUT

  if (status === 'Checked Out') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center rounded-xl
          "
          style={{
            backgroundColor: 'rgba(94,234,212,0.10)'
          }}
        >
          <CheckCircle
            size={22}
            strokeWidth={1.7}
            className="text-good"
          />
        </div>

        <div className="flex flex-col leading-snug">
          <span className="font-body text-[12px] font-medium text-good">
            Workday Completed
          </span>

          <span
            className="
              mt-0.5 font-data text-[18px]
              font-bold tabular-nums text-ink
            "
            style={TIMER_STYLE}
          >
            {formatCompletedHours(workingTime)}
          </span>

          <span className="font-body text-[11px] font-normal text-muted">
            {checkOutTime ? (
              <>
                Checked out at{' '}
                <span className="font-data">{checkOutTime}</span>
              </>
            ) : 'Total working hours'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-muted">
      <Clock size={18} />

      <span className="font-body text-[13px]">
        Attendance unavailable
      </span>
    </div>
  );
};

// ============================================================
// LOADING SPINNER
// ============================================================

const LoadingSpinner = () => (
  <span
    aria-hidden="true"
    className="
      h-4 w-4 shrink-0 animate-spin
      rounded-full border-2 border-current
      border-t-transparent
    "
  />
);

// ============================================================
// HEADER COMPONENT
// ============================================================

// ============================================================
// PROFESSIONAL_PROFILE_MENU_V1
// ============================================================

const loadProfileComponent = name =>
  React.lazy(() =>
    import('../../pages/employee/EmployeeRecords.jsx')
      .then(module => ({
        default: module[name]
      }))
  );

const PROFILE_SECTIONS = [

  {
    id: 'personal',
    label: 'Personal Information',
    Component: loadProfileComponent(
      'EmployeePersonalInformation'
    )
  },

  {
    id: 'contact',
    label: 'Contact Information',
    Component: loadProfileComponent(
      'EmployeeContactInformation'
    )
  },

  {
    id: 'employment',
    label: 'Employment Details',
    Component: loadProfileComponent(
      'EmployeeEmploymentDetails'
    )
  },

  {
    id: 'documents',
    label: 'My Documents',
    Component: loadProfileComponent(
      'EmployeeDocuments'
    )
  }

];

const PROFILE_MENU_ITEM = `
  flex min-h-[48px] w-full items-center
  gap-3 rounded-xl px-4 py-3
  text-left text-sm font-medium
  text-muted transition
  hover:bg-white/[0.06] hover:text-ink
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-accent/40
`;

const ProfileMenuItem = ({
  icon: Icon,
  label,
  onClick
}) => (

  <button
    type="button"
    onClick={onClick}
    className={PROFILE_MENU_ITEM}
  >

    <Icon
      size={20}
      strokeWidth={1.7}
      className="shrink-0"
    />

    <span className="min-w-0 flex-1">
      {label}
    </span>

    <ChevronRight
      size={15}
      strokeWidth={1.5}
      className="shrink-0 opacity-50"
    />

  </button>

);

class ProfileSectionBoundary extends React.Component {

  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {

    if (this.state.failed) {

      return (
        <div
          role="alert"
          className="
            rounded-xl border border-bad/30
            bg-bad/10 p-5 text-sm text-bad
          "
        >

          Unable to load this profile section.

          <button
            type="button"
            onClick={() =>
              this.setState({ failed: false })
            }
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>

        </div>
      );

    }

    return this.props.children;

  }

}

const MyProfileWorkspace = ({
  user,
  onBack
}) => {

  const [section, setSection] =
    useState('personal');

  const selected = PROFILE_SECTIONS.find(
    item => item.id === section
  ) || PROFILE_SECTIONS[0];

  const SectionComponent =
    selected.Component;

  const employeeId =
    getEmployeeId(user);

  return (

    <div className="min-w-0 space-y-5">

      <div className="
        border-b border-white/10
        pb-4 pr-10
      ">

        <button
          type="button"
          onClick={onBack}
          className="
            mb-3 inline-flex items-center
            gap-2 text-xs font-medium
            text-accent hover:underline
          "
        >

          <ChevronDown
            size={16}
            className="rotate-90"
          />

          Back to Profile Menu

        </button>

        <h2 className="
          font-display text-xl
          font-bold text-ink
        ">

          My Profile

        </h2>

        <p className="mt-1 text-sm text-muted">

          Manage your personal and employment information.

        </p>

      </div>

      <div
        aria-label="Profile sections"
        className="
          flex flex-wrap gap-2
          border-b border-white/10 pb-3
        "
      >

        {PROFILE_SECTIONS.map(item => (

          <button
            key={item.id}
            type="button"
            aria-pressed={section === item.id}
            onClick={() => setSection(item.id)}
            className={`
              rounded-xl border px-4 py-2.5
              text-xs font-semibold transition

              ${
                section === item.id

                  ? 'border-accent/30 bg-accent/10 text-accent'

                  : 'border-white/10 bg-white/[0.03] text-muted hover:text-ink'
              }
            `}
          >

            {item.label}

          </button>

        ))}

      </div>

      <div className="min-w-0">

        {employeeId ? (

          <ProfileSectionBoundary
            key={`${employeeId}-${section}`}
          >

            <React.Suspense
              fallback={

                <div className="
                  flex items-center justify-center
                  gap-3 rounded-xl border
                  border-white/10 p-10
                  text-sm text-muted
                ">

                  <LoadingSpinner />

                  Loading profile information...

                </div>

              }
            >

              <SectionComponent />

            </React.Suspense>

          </ProfileSectionBoundary>

        ) : (

          <p className="
            rounded-xl border border-white/10
            p-6 text-sm text-muted
          ">

            Employee profile information is unavailable.

          </p>

        )}

      </div>

    </div>

  );

};

export const Header = ({
  onSignOut,
  activeRole = 'team-lead'
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const teamLeadContext = useTeamLead() || {};
  const attendance = useAttendance() || {};

  const currentUser = teamLeadContext.currentUser;

  const synchronizedAvatar =
    useSyncedEmployeeAvatar(currentUser);
  const teamMembers = teamLeadContext.teamMembers || [];
  const tasks = teamLeadContext.tasks || [];
  const approvals = teamLeadContext.approvals || [];
    // NOTIFICATION_UI_V2

  const [notificationSearch, setNotificationSearch] =
    useState('');

  const [notificationReadFilter, setNotificationReadFilter] =
    useState('all');

  const [notificationBulkBusy, setNotificationBulkBusy] =
    useState(false);

  const notificationBulkLock = useRef(false);

    // LIVE_NOTIFICATION_PREFERENCES_V1

  const notificationPreferenceKey =
    getInAppPreferenceKey(currentUser);

  const [, refreshNotificationPreferences] =
    useState(0);

  const inAppPreferences =
    readInAppPreferences(currentUser);

  useEffect(() => {

    if (!notificationPreferenceKey) {
      return;
    }

    const handlePreferenceChange = event => {

      const changedKey =
        event.type === 'storage'
          ? event.key
          : event.detail?.key;

      if (
        changedKey === null ||
        changedKey === notificationPreferenceKey
      ) {

        refreshNotificationPreferences(
          previous => previous + 1
        );

      }

    };

    window.addEventListener(
      'storage',
      handlePreferenceChange
    );

    window.addEventListener(
      'technomold:user-settings-updated',
      handlePreferenceChange
    );

    return () => {

      window.removeEventListener(
        'storage',
        handlePreferenceChange
      );

      window.removeEventListener(
        'technomold:user-settings-updated',
        handlePreferenceChange
      );

    };

  }, [notificationPreferenceKey]);

  const notifications =
    (teamLeadContext.notifications || [])
      .filter(item =>
        isInAppNotificationEnabled(
          item,
          inAppPreferences
        )
      );

  const markNotificationRead =
    teamLeadContext.markNotificationRead || (() => {});

  const triggerToast =
    teamLeadContext.triggerToast || (() => {});

  const isEmployee = activeRole === 'employee';
  const isTeamLead = activeRole === 'team-lead';

  const accountRole = getUserRole(currentUser);

  const managementPortalLabel =
    accountRole === 'manager'
      ? 'Manager'
      : accountRole === 'super-admin'
        ? 'Super Admin'
        : 'Team Lead';

  const portalLabel = isEmployee
    ? 'Employee'
    : managementPortalLabel;

  const settingsPath = isEmployee
    ? '/team-lead/employee/settings'
    : '/team-lead/settings';

  const attendanceEmployeeId =
    currentUser?.employeeId || currentUser?.id;

  const canUseAttendance =
    Boolean(attendanceEmployeeId) &&
    (isEmployee || isTeamLead);

  const employeeId = getEmployeeId(currentUser);

  const status = attendance.status || 'Not Checked In';

  const isCheckedIn = status === 'Checked In';
  const isOnBreak = status === 'On Break';
  const isCheckedOut = status === 'Checked Out';
  const isNotCheckedIn = status === 'Not Checked In';

  const liveWorkingFormatted = attendance.liveWorkingFormatted;
  const currentBreakFormatted = attendance.currentBreakFormatted;

  const locationLoading = Boolean(attendance.locationLoading);
  const locationError = attendance.locationError || '';

  const hasAttendanceLocation = Boolean(
    attendance.checkInLocation ||
    attendance.checkOutLocation
  );

  // ==========================================================
  // STATE
  // ==========================================================

  const [signOutBusy, setSignOutBusy] =
    useState(false);

  const signOutLock = useRef(false);

  const signOutAvailable =
    typeof onSignOut === 'function';

  const handleSignOut = async () => {

    if (
      !signOutAvailable ||
      signOutLock.current
    ) {
      return;
    }

    signOutLock.current = true;

    setSignOutBusy(true);

    try {

      const result = await onSignOut();

      if (
        result === false ||
        result?.success === false
      ) {

        throw new Error(
          result?.message ||
          'Unable to sign out.'
        );

      }

      closePopup();

    } catch (error) {

      triggerToast(
        error?.message ||
        'Unable to sign out.',
        'error'
      );

    } finally {

      signOutLock.current = false;

      setSignOutBusy(false);

    }

  };

  const [activePopup, setActivePopup] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [pendingAttendanceAction, setPendingAttendanceAction] = useState(null);

  const searchContainerRef = useRef(null);
  const searchRef = useRef(null);
  const popupRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const previousLocationError = useRef('');
  const attendanceActionLock = useRef(false);

  const attendanceBusy =
    locationLoading || Boolean(pendingAttendanceAction);

  // ==========================================================
  // ATTENDANCE ACTION HANDLERS
  // ==========================================================

  const runAttendanceAction = async (
    action,
    actionName,
    requiresId = false
  ) => {
    if (
      !canUseAttendance ||
      attendanceActionLock.current ||
      locationLoading
    ) {
      return;
    }

    if (typeof action !== 'function') {
      triggerToast(
        'Attendance service is unavailable.',
        'error'
      );
      return;
    }

    attendanceActionLock.current = true;
    setPendingAttendanceAction(actionName);

    try {
      if (requiresId) {
        await action(attendanceEmployeeId);
      } else {
        await action();
      }
    } catch (error) {
      triggerToast(
        error?.message || 'Unable to update attendance.',
        'error'
      );
    } finally {
      attendanceActionLock.current = false;
      setPendingAttendanceAction(null);
    }
  };

  const contextCheckIn = () =>
    runAttendanceAction(
      attendance.handleCheckIn,
      'check-in',
      true
    );

  const contextCheckOut = () =>
    runAttendanceAction(
      attendance.handleCheckOut,
      'check-out',
      true
    );

  const contextToggleBreak = () =>
    runAttendanceAction(
      attendance.handleToggleBreak,
      'break'
    );

  // ==========================================================
  // LOCATION ERRORS
  // ==========================================================

  useEffect(() => {
    if (!locationError) {
      previousLocationError.current = '';
      return;
    }

    if (previousLocationError.current === locationError) {
      return;
    }

    previousLocationError.current = locationError;

    triggerToast(locationError, 'error');
  }, [locationError, triggerToast]);

  // ==========================================================
  // POPUP HANDLING
  // ==========================================================

  useEffect(() => {
    if (!activePopup) return undefined;

    const handlePointerDown = event => {
      if (
        popupRef.current?.contains(event.target) ||
        profileButtonRef.current?.contains(event.target) ||
        notificationButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setActivePopup(null);
      setSelectedAnnouncement(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activePopup]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    searchRef.current?.focus();

    const handleOutsideClick = event => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isSearchOpen]);

    useEffect(() => {

    const handleShortcut = event => {

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k' &&
        !activePopup
      ) {

        event.preventDefault();

        setIsSearchOpen(true);

        searchRef.current?.focus();

      }

      if (
        event.key === 'Escape' &&
        !activePopup
      ) {

        setIsSearchOpen(false);

      }

    };

    window.addEventListener(
      'keydown',
      handleShortcut
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleShortcut
      );

  }, [activePopup]);

  // RESET POPUPS WHEN SWITCHING PORTALS

  useEffect(() => {
    setActivePopup(null);
    setSelectedAnnouncement(null);
    setNotificationFilter('all');
    setHeaderSearchQuery('');
    setIsSearchOpen(false);
    setLocationDetails(null);
  }, [activeRole]);

  // ==========================================================
  // PAGE INFORMATION
  // ==========================================================

  const managementPageTitles = {
    ...PAGE_TITLES,

    '/team-lead/dashboard':
      `${managementPortalLabel} Dashboard`
  };

  const currentTitle = isEmployee
    ? EMPLOYEE_PAGE_TITLES[location.pathname] ||
      'Personal Information'
    : managementPageTitles[location.pathname] ||
      `${managementPortalLabel} Dashboard`;

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const roleNotifications = isEmployee
    ? notifications.filter(item => {
        if (item.type === 'announcement') {
          return (
            !item.audience ||
            item.audience === 'company'
          );
        }

        return (
          item.type === 'leave' &&
          String(item.employeeId || '') === String(employeeId)
        );
      })
    : notifications;

  const unreadNotificationCount =
    roleNotifications.filter(item => !item.read).length;

    const notificationQuery =
    notificationSearch.trim().toLowerCase();

  const notificationTotal =
    roleNotifications.length;

  const notificationReadCount =
    notificationTotal - unreadNotificationCount;

  const visibleNotifications = roleNotifications

    .filter(item => {

      const type = String(item.type || '').toLowerCase();

      const categoryMatches =

        notificationFilter === 'all' ||

        notificationFilter === type ||

        (
          notificationFilter === 'work' &&
          ['work', 'leave'].includes(type)
        );

      const readMatches =

        notificationReadFilter === 'all' ||

        (
          notificationReadFilter === 'unread' &&
          !item.read
        ) ||

        (
          notificationReadFilter === 'read' &&
          item.read
        );

      const searchable = [

        item.title,
        item.body,
        item.author,
        item.department,
        item.type

      ].filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (

        categoryMatches &&
        readMatches &&
        (
          !notificationQuery ||
          searchable.includes(notificationQuery)
        )

      );

    })

    .sort((first, second) => {

      const firstTime =
        Date.parse(first.postedAt || '') || 0;

      const secondTime =
        Date.parse(second.postedAt || '') || 0;

      return secondTime - firstTime;

    });

  const notificationFilters = [

    ['all', 'All Categories'],

    ['announcement', 'Announcements'],

    ...(roleNotifications.some(item =>
      item.type === 'task'
    ) ? [['task', 'Tasks']] : []),

    ...(roleNotifications.some(item =>
      item.type === 'leave'
    ) ? [['leave', 'Leave']] : []),

    ...(roleNotifications.some(item =>
      item.type === 'attendance'
    ) ? [['attendance', 'Attendance']] : []),

    ...(roleNotifications.some(item =>
      item.type === 'project'
    ) ? [['project', 'Projects']] : []),

    ...(roleNotifications.some(item =>
      item.type === 'performance'
    ) ? [['performance', 'Performance']] : []),

    ...(roleNotifications.some(item =>
      item.type === 'work'
    ) ? [['work', 'Work Updates']] : [])

  ];

  const handleMarkAllNotificationsRead = async () => {

    if (notificationBulkLock.current) {
      return;
    }

    const ids = roleNotifications

      .filter(item => !item.read && item.id != null)

      .map(item => item.id);

    if (!ids.length) {
      return;
    }

    notificationBulkLock.current = true;

    setNotificationBulkBusy(true);

    try {

      const action =
        teamLeadContext.markAllNotificationsRead;

      if (typeof action !== 'function') {
        throw new Error(
          'Bulk notification service is unavailable.'
        );
      }

      const result = await action(ids);

      if (!result || result.success !== true) {

        throw new Error(
          result?.message ||
          'Unable to mark notifications as read.'
        );

      }

      setSelectedAnnouncement(current =>
        current && ids.includes(current.id)
          ? { ...current, read: true }
          : current
      );

      triggerToast(
        'All portal notifications marked as read.',
        'success'
      );

    } catch (error) {

      triggerToast(
        error?.message ||
        'Unable to update notifications.',
        'error'
      );

    } finally {

      notificationBulkLock.current = false;

      setNotificationBulkBusy(false);

    }

  };

  // NOTIFICATION_COMPACT_V1

  const formatNotificationDate = value => {

    if (!value) {
      return 'Date unavailable';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

  };

  const notificationIcon = type =>
    type === 'announcement'
      ? Megaphone
      : type === 'task'
        ? CheckSquare
        : type === 'leave'
          ? CalendarDays
          : BriefcaseBusiness;

  const handleMarkNotificationRead = async notificationId => {
    try {
      const result = await markNotificationRead(
        notificationId
      );

      if (
        result === false ||
        result?.success === false
      ) {

        throw new Error(
          result?.message ||
          'Unable to mark notification as read.'
        );

      }

      setSelectedAnnouncement(current =>
        current?.id === notificationId
          ? { ...current, read: true }
          : current
      );
    } catch (error) {
      triggerToast(
        error?.message || 'Unable to update notification.',
        'error'
      );
    }
  };

  // ==========================================================
  // PROFILE DETAILS
  // ==========================================================

  const displayName =
    currentUser?.name ||
    currentUser?.fullName ||
    'User';

  const displayEmail =
    currentUser?.email ||
    'Email unavailable';

  const displayDesignation =
    currentUser?.designation ||
    currentUser?.role ||
    portalLabel;

  const initialLetter = displayName

    .trim()

    .split(/\s+/)

    .slice(0, 2)

    .map(word =>
      word.charAt(0).toUpperCase()
    )

    .join('') || 'U';


  // ==========================================================
  // GLOBAL SEARCH
  // ==========================================================

  const normalizedQuery = headerSearchQuery.trim().toLowerCase();

  const matchesQuery = value =>
    String(value ?? '').toLowerCase().includes(normalizedQuery);

  const matchedPages = normalizedQuery
    ? Object.entries(
        isEmployee
          ? EMPLOYEE_PAGE_TITLES
          : managementPageTitles
      )
        .filter(([path, title]) => path !== '/team-lead/attendance-regularization' && matchesQuery(title))
        .map(([path, title]) => ({ path, title }))
    : [];

  const matchedMembers =
    isTeamLead && normalizedQuery
      ? teamMembers.filter(member =>
          matchesQuery(member.name) ||
          matchesQuery(member.designation)
        )
      : [];

  const matchedTasks =
    isTeamLead && normalizedQuery
      ? tasks.filter(task => matchesQuery(task.title))
      : [];

  const matchedApprovals =
    isTeamLead && normalizedQuery
      ? approvals.filter(approval =>
          matchesQuery(approval.employeeName) ||
          matchesQuery(approval.requestType)
        )
      : [];

  const hasSearchResults =
    matchedPages.length > 0 ||
    matchedMembers.length > 0 ||
    matchedTasks.length > 0 ||
    matchedApprovals.length > 0;

  const handleSearchNavigate = path => {
    setIsSearchOpen(false);
    setHeaderSearchQuery('');
    navigate(path);
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedAnnouncement(null);
  };

  // ==========================================================
  // ATTENDANCE LOCATION
  // ==========================================================

  const openAttendanceLocation = () => {
    if (!canUseAttendance) return;

    setLocationDetails({
      attendanceRecord: {
        checkInTime: attendance.checkInTimestamp,
        checkOutTime: attendance.checkOutTimestamp,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation
      },
      userName: currentUser?.name,
      userRole: currentUser?.role
    });
  };

  // ==========================================================
  // MAIN HEADER UI
  // ==========================================================

  return (
    <>
      <LocationModal
        {...(locationDetails || {})}
        open={!!locationDetails}
        onClose={() => setLocationDetails(null)}
      />

      <header
        className="
          relative z-30 flex min-h-[68px]
          flex-wrap items-center justify-between
          gap-x-5 gap-y-3 px-1 py-2 sm:px-2
          font-body
        "
        style={{ fontFamily: BODY_FONT }}
      >
        {/* PAGE TITLE AND BREADCRUMB */}

        <div className="min-w-[220px] max-w-full flex-1">
          <div className="
            mb-1.5 flex items-center gap-1.5
            font-body text-[12px] font-normal text-muted
          ">
            <span>HRMS</span>

            <ChevronRight size={13} strokeWidth={1.5} />

            <span>
              {portalLabel}
            </span>
          </div>

          {/* REFERENCE STYLE SYNE HEADING */}

          <h1
            className="
              font-display text-page-title
              font-bold leading-tight tracking-tight
              break-words text-ink
            "
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              letterSpacing: '-0.035em'
            }}
          >
            {currentTitle}
          </h1>
        </div>

        {/* RIGHT HEADER ACTIONS */}

        <div className="
          flex min-w-0 flex-wrap
          items-center justify-end gap-2 sm:gap-3
        ">
          {/* PERSONAL ATTENDANCE - BOTH PORTALS */}

          {canUseAttendance && (
            <div className="
              flex flex-wrap items-center
              gap-2.5 rounded-xl py-1.5
            ">
              <AttendanceStatus
                status={status}
                workingTime={liveWorkingFormatted}
                breakTime={currentBreakFormatted}
                checkInTimestamp={attendance.checkInTimestamp}
                checkOutTimestamp={attendance.checkOutTimestamp}
              />

              {/* CHECK IN */}

              {isNotCheckedIn && (
                <button
                  type="button"
                  disabled={attendanceBusy}
                  onClick={contextCheckIn}
                  aria-busy={attendanceBusy}
                  className={`
                    ${ATTENDANCE_BUTTON}
                    bg-accent text-on-accent
                    hover:brightness-105
                  `}
                >
                  {attendanceBusy
                    ? <LoadingSpinner />
                    : <LogIn size={18} strokeWidth={1.8} />
                  }

                  {locationLoading
                    ? 'Getting Location'
                    : pendingAttendanceAction === 'check-in'
                      ? 'Checking In'
                      : 'Check In'}
                </button>
              )}

              {/* BREAK AND RESUME */}

              {(isCheckedIn || isOnBreak) && (
                <button
                  type="button"
                  disabled={attendanceBusy}
                  onClick={contextToggleBreak}
                  aria-busy={pendingAttendanceAction === 'break'}
                  className={`
                    ${ATTENDANCE_BUTTON}
                    ${isOnBreak
                      ? 'bg-accent text-on-accent'
                      : 'bg-white/[0.06] text-ink'}
                  `}
                >
                  {pendingAttendanceAction === 'break' ? (
                    <LoadingSpinner />
                  ) : isOnBreak ? (
                    <Play size={16} strokeWidth={1.7} />
                  ) : (
                    <Coffee size={17} strokeWidth={1.7} />
                  )}

                  {isOnBreak ? 'Resume Work' : 'Take Break'}
                </button>
              )}

              {/* CHECK OUT */}

              {(isCheckedIn || isOnBreak) && (
                <button
                  type="button"
                  disabled={attendanceBusy}
                  onClick={contextCheckOut}
                  aria-busy={pendingAttendanceAction === 'check-out'}
                  className={`
                    ${ATTENDANCE_BUTTON}
                    text-bad hover:brightness-110
                  `}
                  style={{
                    backgroundColor: 'rgba(253,164,175,0.12)'
                  }}
                >
                  {pendingAttendanceAction === 'check-out'
                    ? <LoadingSpinner />
                    : <LogOut size={17} strokeWidth={1.7} />
                  }

                  {pendingAttendanceAction === 'check-out'
                    ? locationLoading
                      ? 'Getting Location'
                      : 'Checking Out'
                    : 'Check Out'}
                </button>
              )}

              {/* PERSONAL ATTENDANCE HISTORY */}

              {isCheckedOut && isEmployee && (
                <button
                  type="button"
                  onClick={() =>
                    navigate('/team-lead/employee/attendance')
                  }
                  className={`
                    ${ATTENDANCE_BUTTON}
                    bg-white/[0.04] text-muted
                    hover:text-accent
                  `}
                >
                  <CalendarDays size={17} strokeWidth={1.7} />
                  View Attendance
                </button>
              )}

              {/* LOCATION */}

              <button
                type="button"
                onClick={openAttendanceLocation}
                title={
                  hasAttendanceLocation
                    ? 'View recorded attendance locations'
                    : 'No attendance location recorded yet'
                }
                aria-label="View attendance locations"
                className={ICON_BUTTON}
              >
                <MapPin
                  size={20}
                  strokeWidth={1.7}
                  className={
                    hasAttendanceLocation
                      ? 'text-accent'
                      : 'text-muted'
                  }
                />

                {hasAttendanceLocation && (
                  <span className="
                    absolute right-1 top-1
                    h-2 w-2 rounded-full bg-good
                  " />
                )}
              </button>
            </div>
          )}

          {canUseAttendance && (
            <div className="hidden xl:block h-8 w-px bg-white/10" />
          )}

          {/* ==================================================
              GLOBAL SEARCH
          ================================================== */}

          <div
            ref={searchContainerRef}
            className="relative flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setIsSearchOpen(open => !open)}
              aria-label="Search"
              aria-expanded={isSearchOpen}
              title="Search"
              className={ICON_BUTTON}
            >
              <Search size={21} strokeWidth={1.7} />
            </button>

            {isSearchOpen && (
              <div className="relative flex items-center">
                <input
                  ref={searchRef}
                  value={headerSearchQuery}
                  onChange={event =>
                    setHeaderSearchQuery(event.target.value)
                  }
                  onKeyDown={event => {
                    if (event.key === 'Escape') {
                      setIsSearchOpen(false);
                    } else if (
                      event.key === 'Enter' &&
                      matchedPages.length > 0
                    ) {
                      handleSearchNavigate(matchedPages[0].path);
                    }
                  }}
                  placeholder={
                    isEmployee
                      ? 'Search sections...'
                      : 'Search pages, team, tasks...'
                  }
                  className="
                    h-10 w-40 sm:w-64
                    rounded-xl border border-white/10
                    bg-white/[0.04] pl-3 pr-9
                    font-body text-[14px] font-normal text-ink
                    outline-none placeholder:text-muted
                    focus:border-teal-300/40
                  "
                />

                {headerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHeaderSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 text-muted hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                )}

                {normalizedQuery && (
                  <div className="
                    absolute right-0 top-[48px] z-50
                    w-72 sm:w-96 max-w-[85vw]
                    max-h-[420px] overflow-y-auto
                    rounded-xl border border-white/10
                    bg-[#091c26]/95 p-3
                    shadow-2xl backdrop-blur-xl font-body
                  ">
                    {!hasSearchResults ? (
                      <div className="py-8 text-center text-[14px] text-muted">
                        No results found for "{headerSearchQuery}"
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* MATCHED PAGES */}

                        {matchedPages.length > 0 && (
                          <div>
                            <div className={SEARCH_SECTION_TITLE}>
                              Pages
                            </div>

                            {matchedPages.map(page => (
                              <button
                                key={page.path}
                                type="button"
                                onClick={() =>
                                  handleSearchNavigate(page.path)
                                }
                                className={`
                                  ${SEARCH_RESULT_CLASS}
                                  justify-between text-[14px]
                                  font-medium text-ink
                                `}
                              >
                                <span>{page.title}</span>
                                <ArrowRight size={16} className="text-accent" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* MATCHED MEMBERS */}

                        {matchedMembers.length > 0 && (
                          <div>
                            <div className={SEARCH_SECTION_TITLE}>
                              Team Members
                            </div>

                            {matchedMembers.slice(0, 4).map(member => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() =>
                                  handleSearchNavigate('/team-lead/team')
                                }
                                className={SEARCH_RESULT_CLASS}
                              >
                                <Users size={18} className="shrink-0 text-accent" />

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[14px] font-medium text-ink">
                                    {member.name}
                                  </div>

                                  <div className="mt-0.5 truncate text-[12px] text-muted">
                                    {member.designation}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* MATCHED TASKS */}

                        {matchedTasks.length > 0 && (
                          <div>
                            <div className={SEARCH_SECTION_TITLE}>
                              Tasks
                            </div>

                            {matchedTasks.slice(0, 3).map(task => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() =>
                                  handleSearchNavigate('/team-lead/tasks')
                                }
                                className={SEARCH_RESULT_CLASS}
                              >
                                <CheckSquare
                                  size={18}
                                  className="shrink-0 text-accent2"
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[14px] font-medium text-ink">
                                    {task.title}
                                  </div>

                                  <div className="mt-0.5 truncate text-[12px] text-muted">
                                    {task.status}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* MATCHED APPROVALS */}

                        {matchedApprovals.length > 0 && (
                          <div>
                            <div className={SEARCH_SECTION_TITLE}>
                              Approvals
                            </div>

                            {matchedApprovals.slice(0, 3).map(approval => (
                              <button
                                key={approval.id}
                                type="button"
                                onClick={() =>
                                  handleSearchNavigate('/team-lead/approvals')
                                }
                                className={`
                                  ${SEARCH_RESULT_CLASS}
                                  justify-between
                                `}
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-[14px] font-medium text-ink">
                                    {approval.employeeName}
                                  </div>

                                  <div className="mt-0.5 truncate text-[12px] text-muted">
                                    {approval.requestType}
                                  </div>
                                </div>

                                <span className="text-[12px] font-medium capitalize text-warn">
                                  {approval.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DashboardSwitcher />

          {/* ==================================================
              NOTIFICATION ICON
          ================================================== */}

          <button
            ref={notificationButtonRef}
            type="button"
            onClick={() => {
              setSelectedAnnouncement(null);
              setNotificationFilter('all');
              setNotificationSearch('');
              setNotificationReadFilter('all');

              setActivePopup(current =>
                current === 'notif' ? null : 'notif'
              );
            }}
            aria-label="Notifications"
            aria-expanded={activePopup === 'notif'}
            title="Notifications"
            className={ICON_BUTTON}
          >
            <Bell size={21} strokeWidth={1.7} />

            {unreadNotificationCount > 0 && (
              <span className="
                absolute right-0 top-0
                flex h-[19px] min-w-[19px]
                items-center justify-center
                rounded-full bg-accent px-1
                font-data text-[10px]
                font-bold text-on-accent
                ring-2 ring-[#10242e]
              ">
                {unreadNotificationCount > 99
                  ? '99+'
                  : unreadNotificationCount}
              </span>
            )}
          </button>

          

          <div className="hidden sm:block h-7 w-px bg-white/10 mx-1" />

          {/* PROFILE AVATAR */}

          <button
            ref={profileButtonRef}
            type="button"
            onClick={() =>
              setActivePopup(current =>
                current === 'profile' ? null : 'profile'
              )
            }
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              overflow-hidden rounded-full
              font-display text-[17px] font-bold text-accent
              transition-all hover:brightness-110
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#6ee7d080]
            "
            style={{
              backgroundColor: 'rgba(110,231,208,0.12)',
              border: '1px solid rgba(110,231,208,0.20)',
              fontFamily: DISPLAY_FONT
            }}
            aria-label="Open profile panel"
            aria-haspopup="dialog"
            aria-expanded={activePopup === 'profile'}
            title={displayName}
          >
            {synchronizedAvatar ? (
              <img
                src={synchronizedAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initialLetter}</span>
            )}
          </button>
        </div>
      </header>

      {/* ======================================================
          NOTIFICATION AND PROFILE MODALS
      ====================================================== */}

      {activePopup && (
        <ModalPortal
          onClose={closePopup}
          ariaLabel={
            activePopup === 'profile'
              ? 'Profile Menu'
              : activePopup === 'my-profile'
                ? 'My Profile'
                : activePopup === 'shortcuts'
                  ? 'Keyboard Shortcuts'
                  : selectedAnnouncement?.title || 'Notifications'
          }
          closeOnBackdrop
          className={
            activePopup === 'profile'
              ? '!items-start !justify-end !p-4 sm:!pt-20'
              : ''
          }
        >
          <div
            ref={popupRef}
            style={{ fontFamily: BODY_FONT }}
            className={
              activePopup === 'profile'

                ? `
                  relative w-[min(22rem,100%)]
                  max-h-[85vh] overflow-y-auto
                  rounded-2xl border border-white/10
                  bg-[#0c232d] p-4
                  font-body text-ink shadow-2xl
                `

                : activePopup === 'my-profile'

                  ? `
                    relative my-auto w-full max-w-4xl
                    max-h-[92vh] overflow-y-auto
                    rounded-2xl border border-[#34515b]
                    bg-[#142c37] p-5 sm:p-6
                    font-body text-ink shadow-2xl
                  `

                  : `
                    relative my-auto max-h-[94vh]
                    w-full max-w-lg overflow-y-auto
                    rounded-2xl border border-[#34515b]
                    bg-[#142c37] p-4 sm:p-5
                    font-body text-ink shadow-2xl
                  `
            }

          >
            {/* CLOSE BUTTON */}

            <button
              type="button"
              onClick={closePopup}
              aria-label={
                activePopup === 'profile'
                  ? 'Close profile panel'
                  : 'Close popup'
              }
              className="
                absolute right-4 top-4
                rounded-lg p-2 text-muted
                transition hover:bg-white/[0.06]
                hover:text-ink
              "
            >
              <X size={21} strokeWidth={1.7} />
            </button>

            {/* ==================================================
                NOTIFICATIONS PANEL
            ================================================== */}

            {activePopup === 'notif' && (
              <div
                role="region"
                aria-label="Notifications"
                className="space-y-3"
              >
                {selectedAnnouncement ? (
                  <div className="space-y-4 pt-2">

                    {/* BACK TO NOTIFICATIONS */}

                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(null)}
                      className="
                        inline-flex items-center gap-2
                        rounded-lg bg-white/5
                        px-3 py-2 font-body text-[13px]
                        font-medium text-muted
                        transition hover:bg-white/10
                      "
                    >
                      <ChevronDown
                        size={16}
                        className="rotate-90"
                      />
                      Back to notifications
                    </button>

                    {/* ANNOUNCEMENT DETAILS */}

                    <div className={`${PANEL_CARD} p-5`}>
                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className="
                            inline-flex items-center gap-1.5
                            rounded-lg px-2.5 py-1.5
                            text-[12px] font-medium text-accent
                          "
                          style={{
                            backgroundColor: 'rgba(110,231,208,0.10)'
                          }}
                        >
                          <Megaphone size={14} />
                          Announcement
                        </span>

                        <span className={`
                          rounded-lg px-2.5 py-1.5
                          text-[12px] font-medium
                          ${selectedAnnouncement.priority === 'High'
                            ? 'bg-rose-400/10 text-bad'
                            : 'bg-white/5 text-muted'}
                        `}>
                          {selectedAnnouncement.priority || 'Normal'} priority
                        </span>
                      </div>

                      <h3 className="
                        mt-4 font-display text-[21px]
                        font-bold leading-snug text-ink
                      ">
                        {selectedAnnouncement.title}
                      </h3>

                      <p className="
                        mt-3 whitespace-pre-wrap
                        font-body text-[14px] font-normal
                        leading-relaxed text-muted
                      ">
                        {selectedAnnouncement.body}
                      </p>

                      <div className="
                        mt-4 border-t border-white/10
                        pt-3 text-[12px] text-muted
                      ">
                        Posted by{' '}

                        <span className="font-medium text-ink">
                          {selectedAnnouncement.author}
                        </span>

                        {' · '}
                        {selectedAnnouncement.department}
                        {' · '}

                        <span className="font-data text-[11px]">
                          {formatNotificationDate(selectedAnnouncement.postedAt)}
                        </span>
                      </div>
                    </div>

                    {/* GUIDELINES */}

                    {selectedAnnouncement.guidelines?.length > 0 && (
                      <div className={`${PANEL_CARD} p-4`}>
                        <h4 className="font-body text-[15px] font-medium text-ink">
                          Guidelines
                        </h4>

                        <ul className="
                          mt-3 list-disc space-y-2
                          pl-5 font-body text-[14px] text-muted
                        ">
                          {selectedAnnouncement.guidelines.map(
                            (item, index) => (
                              <li key={`${index}-${item}`}>
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* ATTACHMENTS */}

                    {selectedAnnouncement.attachments?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-body text-[15px] font-medium text-ink">
                          Attachments
                        </h4>

                        {selectedAnnouncement.attachments.map(
                          (attachment, index) => (
                            <a
                              key={`${index}-${attachment.name}`}
                              href={attachment.url}
                              onClick={event => {
                                if (
                                  !attachment.url ||
                                  attachment.url === '#'
                                ) {
                                  event.preventDefault();
                                }
                              }}
                              className="
                                block rounded-xl
                                border border-white/10
                                bg-white/[0.03]
                                px-4 py-3 font-body text-[14px]
                                text-accent hover:bg-white/[0.06]
                              "
                            >
                              {attachment.name}
                            </a>
                          )
                        )}
                      </div>
                    )}

                    {/* READ STATUS */}

                    {!selectedAnnouncement.read ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkNotificationRead(
                            selectedAnnouncement.id
                          )
                        }
                        className="
                          w-full rounded-xl bg-accent
                          py-3 font-body text-[14px] font-medium
                          text-on-accent transition
                          hover:brightness-105
                        "
                      >
                        Mark as Read
                      </button>
                    ) : (
                      <p className="text-center text-[13px] font-medium text-good">
                        Read
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* NOTIFICATION HEADER */}

                    <div className="
                      flex items-center gap-3
                      border-b border-white/10
                      pb-3 pr-8
                    ">
                      <div
                        className="
                          flex h-11 w-11 shrink-0
                          items-center justify-center
                          rounded-xl text-accent
                        "
                        style={{
                          backgroundColor: 'rgba(110,231,208,0.12)'
                        }}
                      >
                        <Bell size={22} strokeWidth={1.7} />
                      </div>

                      <div>
                        <h3
                          className="
                            font-display text-[23px]
                            font-bold text-ink
                          "
                          style={{ fontFamily: DISPLAY_FONT }}
                        >
                          Notifications
                        </h3>

                        <p className="mt-1 font-body text-[13px] text-muted">
                          {isEmployee
                            ? 'Announcements and your personal updates'
                            : 'Announcements, tasks and work updates'}
                        </p>
                      </div>
                    </div>

                                        {/* NOTIFICATION SUMMARY */}

                    <div className="grid grid-cols-3 gap-2">

                      {[
                        ['Total', notificationTotal],
                        ['Unread', unreadNotificationCount],
                        ['Read', notificationReadCount]
                      ].map(([label, count]) => (

                        <div
                          key={label}
                          className={`${PANEL_CARD} px-3 py-2`}
                        >
                          <p className="text-[12px] text-muted">
                            {label}
                          </p>

                          <p className="mt-0.5 font-data text-[20px] font-bold text-accent">
                            {count}
                          </p>
                        </div>

                      ))}

                    </div>

                    {/* NOTIFICATION SEARCH */}

                    <div className="
                      flex items-center gap-3 rounded-xl
                      border border-white/10
                      bg-white/[0.03] px-3 py-2
                    ">

                      <input
                        type="search"
                        value={notificationSearch}
                        onChange={event =>
                          setNotificationSearch(event.target.value)
                        }
                        placeholder="Search notifications..."
                        aria-label="Search notifications"
                        className="
                          min-w-0 w-full bg-transparent
                          font-body text-[14px] text-ink
                          outline-none placeholder:text-muted
                        "
                      />

                      {notificationSearch && (

                        <button
                          type="button"
                          aria-label="Clear notification search"
                          onClick={() => setNotificationSearch('')}
                          className="text-muted hover:text-ink"
                        >
                          <X size={16} />
                        </button>

                      )}

                    </div>

                    {/* READ STATUS FILTERS */}

                    <div className="flex flex-wrap items-center gap-2">

                      {[
                        ['all', 'All'],
                        ['unread', 'Unread'],
                        ['read', 'Read']
                      ].map(([key, label]) => (

                        <button
                          key={key}
                          type="button"
                          aria-pressed={notificationReadFilter === key}
                          onClick={() =>
                            setNotificationReadFilter(key)
                          }
                          className={`
                            rounded-lg px-3 py-1.5 text-[13px] font-medium transition
                            ${notificationReadFilter === key
                              ? 'bg-accent text-on-accent'
                              : 'bg-white/5 text-muted hover:bg-white/10'}
                          `}
                        >
                          {label}

                          {key === 'unread'
                            ? ` (${unreadNotificationCount})`
                            : ''}

                        </button>

                      ))}

                    </div>

                    {/* BULK READ ACTION */}

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <span className="text-[12px] text-muted">
                        Showing {visibleNotifications.length} of {notificationTotal}
                      </span>

                      <button
                        type="button"
                        disabled={
                          notificationBulkBusy ||
                          unreadNotificationCount === 0
                        }
                        onClick={handleMarkAllNotificationsRead}
                        className="
                          rounded-lg bg-white/5 px-3 py-2
                          text-[12px] font-medium text-accent
                          transition hover:bg-white/10
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                      >
                        {notificationBulkBusy
                          ? 'Updating...'
                          : 'Mark All as Read'}
                      </button>

                    </div>

                    {/* NOTIFICATION FILTERS */}

                    <div className="flex flex-wrap gap-2">
                      {notificationFilters.map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNotificationFilter(key)}
                          aria-pressed={notificationFilter === key}
                          className={`
                            rounded-lg px-3 py-1.5
                            font-body text-[13px]
                            font-medium transition-all
                            ${notificationFilter === key
                              ? 'bg-accent text-on-accent'
                              : 'bg-white/5 text-muted hover:bg-white/10'}
                          `}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* NOTIFICATION LIST */}

                    <div className="
                      max-h-[50vh] min-h-[140px] space-y-2
                      overflow-y-auto pr-1
                    ">
                      {visibleNotifications.length === 0 && (
                        <p className="
                          rounded-xl bg-white/[0.03]
                          p-6 text-center font-body
                          text-[14px] text-muted
                        ">
                          {inAppPreferences.inAppEnabled === false
                            ? 'In-app notifications are disabled. Enable them in Notification Preferences.'
                            : 'No notifications match your current filters.'}
                        </p>
                      )}

                      {visibleNotifications.map(item => {
                        const Icon = notificationIcon(item.type);

                        return (
                          <div
                            key={item.id}
                            className={`
                              ${PANEL_CARD}
                              flex items-start gap-3 p-3 transition
                              hover:bg-white/[0.05]
                            `}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (item.type === 'announcement') {
                                  setSelectedAnnouncement(item);
                                } else {
                                  handleMarkNotificationRead(item.id);
                                }
                              }}
                              className="
                                flex min-w-0 flex-1
                                items-start gap-3 text-left
                              "
                            >
                              <span className={`
                                mt-0.5 flex h-10 w-10
                                shrink-0 items-center
                                justify-center rounded-xl
                                bg-white/[0.04]
                                ${item.type === 'announcement'
                                  ? 'text-accent'
                                  : item.type === 'task'
                                    ? 'text-info'
                                    : 'text-muted'}
                              `}>
                                <Icon size={19} strokeWidth={1.7} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">

                                  <span className="
                                    font-body text-[14px] font-medium
                                    leading-snug text-ink
                                  ">
                                    {item.title}
                                  </span>

                                  {item.type === 'announcement' && (
                                    <span className="
                                      rounded-md bg-white/5
                                      px-1.5 py-0.5
                                      text-[11px] font-medium text-accent
                                    ">
                                      Announcement
                                    </span>
                                  )}
                                </span>

                                <span className="
                                  mt-1 block line-clamp-2
                                  font-body text-[13px] font-normal
                                  leading-relaxed text-muted
                                ">
                                  {item.body}
                                </span>

                                <span className="mt-1.5 block text-[12px] text-muted">
                                  {item.author || item.department}
                                  {' · '}

                                  <span className="font-data text-[11px]">
                                    {formatNotificationDate(item.postedAt)}
                                  </span>
                                </span>
                              </span>

                              {!item.read && (
                                <span
                                  className="
                                    mt-1.5 h-2 w-2 shrink-0
                                    rounded-full bg-accent
                                  "
                                  title="Unread"
                                />
                              )}
                            </button>

                            {!item.read ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkNotificationRead(item.id)
                                }
                                className="
                                  shrink-0 rounded-lg
                                  px-2 py-1.5 text-[12px]
                                  font-medium text-accent
                                  transition hover:bg-white/5
                                "
                                aria-label={`Mark ${item.title} as read`}
                              >
                                Mark read
                              </button>
                            ) : (
                              <span className="
                                shrink-0 pt-1.5
                                text-[12px] text-good
                              ">
                                Read
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                                        <button
                      type="button"
                      onClick={() => {

                        closePopup();

                        navigate(settingsPath);

                      }}
                      className="
                        flex w-full items-center
                        justify-center gap-2
                        rounded-xl border border-white/10
                        bg-white/[0.04] py-3
                        text-[13px] font-medium text-accent
                        transition hover:bg-white/[0.08]
                      "
                    >

                      <SettingsIcon size={17} />

                      Notification Preferences

                    </button>

                    {/* REVIEW APPROVALS */}

                    {isTeamLead && (
                      <button
                        type="button"
                        onClick={() => {
                          closePopup();
                          navigate('/team-lead/approvals');
                        }}
                        className="
                          flex w-full items-center justify-center
                          gap-2 rounded-xl bg-accent
                          py-3 font-body text-[14px]
                          font-medium text-on-accent
                          transition hover:brightness-105
                        "
                      >
                        Review Approvals
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ==================================================
                PROFILE DRAWER
            ================================================== */}

            {activePopup === 'profile' && (

              <div className="space-y-4">

                {/* LOGGED-IN USER */}

                <div className="
                  flex items-center gap-3
                  rounded-full border border-white/10
                  bg-white/[0.02] p-3 pr-10
                ">

                  <div className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    overflow-hidden rounded-full
                    bg-[#568f32] text-lg
                    font-bold text-white
                  ">

                    {synchronizedAvatar ? (

                      <img
                        src={synchronizedAvatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <span>
                        {initialLetter}
                      </span>

                    )}

                  </div>

                  <div className="min-w-0">

                    <h2 className="
                      break-words text-base
                      font-bold text-ink
                    ">

                      {displayName}

                    </h2>

                    <p className="
                      mt-0.5 break-words
                      text-sm text-muted
                    ">

                      {displayDesignation}

                    </p>

                  </div>

                </div>

                {/* PROFILE MENU */}

                <div className="space-y-1">

                  <ProfileMenuItem
                    icon={User}
                    label="My profile"
                    onClick={() =>
                      setActivePopup('my-profile')
                    }
                  />

                  {/* PROFILE_PAYSLIP_LINK_V1 */}

                  <ProfileMenuItem
                    icon={BriefcaseBusiness}
                    label="My Payslips"
                    onClick={() => {

                      closePopup();

                      navigate('/team-lead/my-payslip');

                    }}
                  />

                  <ProfileMenuItem
                    icon={SettingsIcon}
                    label="Settings"
                    onClick={() => {

                      closePopup();

                      navigate('/team-lead/settings');

                    }}
                  />

                  <ProfileMenuItem
                    icon={Bell}
                    label="Notifications"
                    onClick={() => {

                      setSelectedAnnouncement(null);

                      setNotificationFilter('all');

                      setNotificationSearch('');

                      setNotificationReadFilter('all');

                      setActivePopup('notif');

                    }}
                  />

                  {isTeamLead && (

                    <ProfileMenuItem
                      icon={Download}
                      label="Export reports"
                      onClick={() => {

                        closePopup();

                        navigate('/team-lead/team-reports');

                      }}
                    />

                  )}

                  <ProfileMenuItem
                    icon={Command}
                    label="Keyboard shortcuts"
                    onClick={() =>
                      setActivePopup('shortcuts')
                    }
                  />

                </div>

                {/* SIGN OUT */}

                <div className="
                  border-t border-dashed
                  border-white/10 pt-4
                ">

                  {!signOutAvailable && (

                    <p className="
                      mb-2 text-center
                      text-[11px] text-muted
                    ">

                      Sign out is currently unavailable.

                    </p>

                  )}

                  <button
                    type="button"
                    disabled={
                      !signOutAvailable ||
                      signOutBusy
                    }
                    onClick={handleSignOut}
                    className="
                      flex min-h-[46px] w-full
                      items-center justify-center
                      gap-3 rounded-full
                      border border-white/10
                      px-4 py-3 text-sm
                      font-semibold text-bad
                      transition
                      hover:border-bad/30
                      hover:bg-bad/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >

                    {signOutBusy

                      ? <LoadingSpinner />

                      : <LogOut
                          size={19}
                          strokeWidth={1.7}
                        />

                    }

                    {signOutBusy
                      ? 'Signing out...'
                      : 'Sign out'}

                  </button>

                </div>

              </div>

            )}

            {/* MY PROFILE */}

            {activePopup === 'my-profile' && (

              <MyProfileWorkspace
                key={employeeId || 'profile'}
                user={currentUser}
                onBack={() =>
                  setActivePopup('profile')
                }
              />

            )}

            {/* KEYBOARD SHORTCUTS */}

            {activePopup === 'shortcuts' && (

              <div className="space-y-5">

                <div className="
                  border-b border-white/10
                  pb-4 pr-10
                ">

                  <h2 className="
                    font-display text-xl
                    font-bold text-ink
                  ">

                    Keyboard Shortcuts

                  </h2>

                  <p className="mt-1 text-xs text-muted">

                    Available dashboard shortcuts.

                  </p>

                </div>

                <div className="
                  rounded-xl border border-white/10
                  bg-white/[0.03] p-4
                  space-y-4
                ">

                  <div className="
                    flex items-center
                    justify-between gap-3
                  ">

                    <span className="text-sm text-ink">

                      Open global search

                    </span>

                    <kbd className="
                      rounded-lg border border-white/10
                      bg-surface2 px-3 py-2
                      text-xs font-semibold text-muted
                    ">

                      Ctrl / Cmd + K

                    </kbd>

                  </div>

                  <div className="
                    flex items-center
                    justify-between gap-3
                  ">

                    <span className="text-sm text-ink">

                      Close global search

                    </span>

                    <kbd className="
                      rounded-lg border border-white/10
                      bg-surface2 px-3 py-2
                      text-xs font-semibold text-muted
                    ">

                      Esc

                    </kbd>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActivePopup('profile')
                  }
                  className="
                    w-full rounded-xl
                    border border-white/10
                    px-4 py-3 text-sm
                    font-semibold text-accent
                    hover:bg-white/[0.05]
                  "
                >

                  Back to Profile Menu

                </button>

              </div>

            )}
          </div>
        </ModalPortal>
      )}
    </>
  );
};

// IN_APP_NOTIFICATION_FILTER_V1

const getInAppPreferenceKey = user => {

  const id = String(
    user?.employeeId ||
    user?.userId ||
    user?.id ||
    ''
  ).trim().toLowerCase();

  return id
    ? `technomold_user_settings_v1:${encodeURIComponent(id)}`
    : null;

};

const readInAppPreferences = user => {

  const key = getInAppPreferenceKey(user);

  if (!key) return {};

  try {

    const value = window.localStorage.getItem(key);

    const data = value
      ? JSON.parse(value)
      : {};

    return data?.notifications &&
      typeof data.notifications === 'object' &&
      !Array.isArray(data.notifications)
        ? data.notifications
        : {};

  } catch {

    return {};

  }

};

const isInAppNotificationEnabled = (item, preferences) => {

  if (preferences.inAppEnabled === false) {
    return false;
  }

  const type = String(item?.type || '')
    .trim()
    .toLowerCase();

  const categoryKeys = {
    announcement: 'inAppAnnouncements',
    leave: 'inAppLeave',
    task: 'inAppTasks',
    attendance: 'inAppAttendance',
    project: 'inAppProjects',
    performance: 'inAppPerformance',
    work: 'inAppWork'
  };

  const preferenceKey = categoryKeys[type];

  return !preferenceKey ||
    preferences[preferenceKey] !== false;

};

export default Header;