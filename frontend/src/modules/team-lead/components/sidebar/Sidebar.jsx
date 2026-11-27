import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  Clock,
  Calendar,
  BarChart3,
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  CheckCircle,
  HelpCircle,
  FileClock,
  CalendarDays,
  Settings as SettingsIcon
} from 'lucide-react';

// ============================================================
// TEAM LEAD NAVIGATION
// ============================================================

const teamLeadNavItems = [
  {
    path: '/team-lead/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    path: '/team-lead/team',
    label: 'My Team',
    icon: Users
  },
  {
    path: '/team-lead/attendance',
    label: 'Attendance',
    icon: Clock,
    children: [
      {
        path: '/team-lead/my-attendance',
        label: 'My Attendance'
      },
      {
        path: '/team-lead/team-attendance',
        label: 'Team Attendance'
      }
    ]
  },
  {
    path: '/team-lead/leave',
    label: 'Leave Approvals',
    icon: Calendar
  },
  {
    path: '/team-lead/tasks',
    label: 'Task Management',
    icon: CheckSquare
  },
  {
    path: '/team-lead/timesheet-approval',
    label: 'Timesheet Approval',
    icon: FileClock
  },
  {
    path: '/team-lead/performance',
    label: 'Team Performance',
    icon: BarChart3
  },
  {
    path: '/team-lead/team-calendar',
    label: 'Calendar',
    icon: CalendarDays,
    children: [
      {
        path: '/team-lead/my-calendar',
        label: 'My Calendar'
      },
      {
        path: '/team-lead/team-calendar',
        label: 'Team Calendar'
      }
    ]
  },
  {
    path: '/team-lead/team-reports',
    label: 'Team Reports',
    icon: BarChart3
  },
  {
    path: '/team-lead/projects',
    label: 'Projects',
    icon: FolderKanban
  },
  {
    path: '/team-lead/approvals',
    label: 'Approvals',
    icon: CheckCircle
  },
  {
    path: '/team-lead/settings',
    label: 'Settings',
    icon: SettingsIcon
  }
];

// ============================================================
// REFERENCE TYPOGRAPHY
// ============================================================

const BODY_FONT =
  "var(--hrms-font, 'Calibri', 'Segoe UI', Arial, sans-serif)";

const DATA_FONT =
  "var(--hrms-data, 'Calibri', 'Segoe UI', Arial, sans-serif)";

const menuTextStyle = {
  fontFamily: BODY_FONT,
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '22px',
  letterSpacing: '0'
};

const portalLabelStyle = {
  fontFamily: DATA_FONT,
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: '18px',
  letterSpacing: '0.7px'
};

const sectionLabelStyle = {
  fontFamily: BODY_FONT,
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '18px',
  letterSpacing: '0.05em'
};

// ============================================================
// NAVIGATION ITEM STYLES
// ============================================================

const menuItemClass = `
  relative
  flex
  w-full
  min-h-[44px]
  items-center
  gap-3
  rounded-xl
  border
  px-3
  py-2.5
  text-left
  font-body
  text-navigation
  font-normal
  transition-all
  duration-200
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-[#6ee7d080]
`;

// ============================================================
// ATTENDANCE SUBMENU
// ============================================================

const AttendanceNavGroup = ({ item }) => {

  const location = useLocation();

  const currentPath =
    location.pathname.replace(/\/+$/, '');

  const isActive =
    currentPath === item.path ||
    item.children.some(
      child => child.path === currentPath
    );

  const [expanded, setExpanded] =
    React.useState(isActive);

  React.useEffect(() => {

    if (isActive) {
      setExpanded(true);
    }

  }, [currentPath, isActive]);

  const Icon = item.icon;

  return (

    <div className="space-y-1">

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`submenu-${item.path.replace(/\W/g, "-")}`}
        onClick={() =>
          setExpanded(previous => !previous)
        }
        className={`
          ${menuItemClass}
          ${
            isActive
              ? 'backdrop-blur-md'
              : 'hover:bg-white/[0.05]'
          }
        `}
        style={{
          ...menuTextStyle,

          fontWeight:
            isActive ? 500 : 400,

          color:
            isActive
              ? 'var(--ink, #ecfbf8)'
              : 'var(--muted, #9db9bb)',

          backgroundColor:
            isActive
              ? 'rgba(110,231,208,0.10)'
              : 'transparent',

          borderColor:
            isActive
              ? 'rgba(110,231,208,0.17)'
              : 'transparent'
        }}
      >

        <Icon
          size={19}
          strokeWidth={1.7}
          className="shrink-0"
          style={{
            color:
              isActive
                ? 'var(--accent, #6ee7d0)'
                : 'var(--muted, #9db9bb)'
          }}
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1">
          {item.label}
        </span>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`
            shrink-0 transition-transform
            ${expanded ? 'rotate-180' : ''}
          `}
        >

          <path d="m6 9 6 6 6-6" />

        </svg>

      </button>

      {expanded && (

        <div
          id={`submenu-${item.path.replace(/\W/g, "-")}`}
          className="
            ml-6 space-y-1 border-l
            border-white/10 pl-3
          "
        >

          {item.children.map(child => (

            <NavLink
              key={child.path}
              to={child.path}
              end
              className={({ isActive }) => `
                flex min-h-[38px]
                items-center gap-2
                rounded-lg border px-3 py-2
                transition
                ${
                  isActive
                    ? 'border-accent/20 bg-accent/10 text-accent'
                    : 'border-transparent text-muted hover:bg-white/[0.05] hover:text-ink'
                }
              `}
              style={{
                ...menuTextStyle,
                fontSize: '14px'
              }}
            >

              <span
                aria-hidden="true"
                className="
                  h-1.5 w-1.5 shrink-0
                  rounded-full bg-current
                "
              />

              {child.label}

            </NavLink>

          ))}

        </div>

      )}

    </div>

  );

};

// ============================================================
// TEAM LEAD SIDEBAR
// TEAM_LEAD_ONLY_NAVIGATION_V2
// ============================================================

export const Sidebar = ({
  onOpenHelpModal,
  allowedRoles = []
}) => {

  const authorizedRoles =
    Array.isArray(allowedRoles)
      ? allowedRoles
      : [];

  const isAuthorizedRole =
    authorizedRoles.includes('team-lead');

  const navItems =
    isAuthorizedRole
      ? teamLeadNavItems
      : [];

  // ==========================================================
  // SIDEBAR UI
  // ==========================================================

  return (

    <aside
      className="
        w-full
        md:w-[280px]
        md:shrink-0
        flex
        flex-col
        h-auto
        md:h-screen
        md:sticky
        md:top-0
        border-r
        z-40
        select-none
        font-body
      "
      style={{
        fontFamily: BODY_FONT,
        backgroundColor:
          'rgba(6, 20, 28, 0.42)',
        borderColor:
          'rgba(255, 255, 255, 0.08)'
      }}
    >

      {/* COMPANY LOGO */}

      <div className="shrink-0 px-4 pt-4 pb-3">

        <img
          src="/technomold-sidebar-transparent.png"
          alt="Technomold IT Solutions Pvt Ltd"
          className="
            h-auto
            w-full
            object-contain
            rounded-lg
          "
        />

        {/* TEAM LEAD PORTAL LABEL */}

        <div className="mt-2">

          <span
            className="
              font-data
              text-[11px]
              font-bold
              uppercase
              tracking-wider
            "
            style={{
              ...portalLabelStyle,
              color: 'var(--accent, #6ee7d0)'
            }}
          >

            {isAuthorizedRole
              ? 'TEAM LEAD PORTAL'
              : 'ACCESS RESTRICTED'}

          </span>

        </div>

      </div>

      {/* SIDEBAR SEPARATOR */}

      <div
        className="mx-4 shrink-0"
        style={{
          borderTop:
            '1px solid rgba(255,255,255,0.08)'
        }}
      />

      {/* MAIN NAVIGATION */}

      <nav
        aria-label="Team Lead navigation"
        className="
          flex-1
          min-h-0
          max-h-[420px]
          md:max-h-none
          overflow-y-auto
          px-3
          pt-4
          pb-4
          font-body
        "
      >

        

        {/* TEAM LEAD NAVIGATION ITEMS */}

        <div className="space-y-1">

          {navItems.map(item => {

            if (Array.isArray(item.children)) {

              return (

                <AttendanceNavGroup
                  key={item.path}
                  item={item}
                />

              );

            }

            const Icon = item.icon;

            return (

              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) => `
                  ${menuItemClass}

                  ${
                    isActive
                      ? 'backdrop-blur-md'
                      : 'hover:bg-white/[0.05]'}
                `}
                style={({ isActive }) => ({
                  ...menuTextStyle,

                  fontWeight:
                    isActive ? 500 : 400,

                  color:
                    isActive
                      ? 'var(--ink, #ecfbf8)'
                      : 'var(--muted, #9db9bb)',

                  backgroundColor:
                    isActive
                      ? 'rgba(110,231,208,0.10)'
                      : undefined,

                  borderColor:
                    isActive
                      ? 'rgba(110,231,208,0.17)'
                      : 'transparent'
                })}
              >

                {({ isActive }) => (

                  <>

                    <Icon
                      size={19}
                      strokeWidth={1.7}
                      className="shrink-0"
                      style={{
                        color:
                          isActive
                            ? 'var(--accent, #6ee7d0)'
                            : 'var(--muted, #9db9bb)'
                      }}
                      aria-hidden="true"
                    />

                    <span
                      className="
                        min-w-0
                        font-body
                        text-navigation
                        leading-snug
                      "
                      style={{
                        ...menuTextStyle,
                        fontWeight:
                          isActive ? 500 : 400
                      }}
                    >

                      {item.label}

                    </span>

                  </>

                )}

              </NavLink>

            );

          })}

        </div>

        {/* HELP AND SUPPORT */}

        {isAuthorizedRole && (

          <div className="mt-2">

            <div
              className="mx-2 mb-3"
              style={{
                borderTop:
                  '1px solid rgba(255,255,255,0.08)'
              }}
            />

            <div className="px-3 pb-2">

              <span
                className="
                  font-body
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-muted
                "
                style={sectionLabelStyle}
              >

                Support

              </span>

            </div>

            <button
              type="button"
              onClick={onOpenHelpModal}
              className={`
                ${menuItemClass}
                hover:bg-white/[0.05]
              `}
              style={{
                ...menuTextStyle,
                color:
                  'var(--muted, #9db9bb)',
                borderColor:
                  'transparent'
              }}
            >

              <HelpCircle
                size={19}
                strokeWidth={1.7}
                className="shrink-0"
                style={{
                  color:
                    'var(--accent, #6ee7d0)'
                }}
                aria-hidden="true"
              />

              <span
                className="
                  font-body
                  text-navigation
                  font-normal
                "
                style={menuTextStyle}
              >

                Help & Support

              </span>

            </button>

          </div>

        )}

        {/* UNAUTHORIZED ACCESS */}

        {!isAuthorizedRole && (

          <div
            className="
              rounded-xl
              border
              p-4
              font-body
              text-bad
            "
            style={{
              fontFamily: BODY_FONT,
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '22px',

              backgroundColor:
                'rgba(253,164,175,0.10)',

              borderColor:
                'rgba(253,164,175,0.20)'
            }}
          >

            You do not have permission to access
            the Team Lead portal.

          </div>

        )}

      </nav>

    </aside>

  );

};

export default Sidebar;