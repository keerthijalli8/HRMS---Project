import React, {
  useEffect,
  useState
} from 'react';

import {
  Outlet,
  Navigate,
  useLocation
} from 'react-router-dom';

import { Sidebar } from '../sidebar/Sidebar.jsx';
import { Header } from '../header/Header.jsx';
import { Toast } from '../common/Toast.jsx';
import { HelpModal } from '../modals/HelpModal.jsx';
import { TemplatesModal } from '../modals/TemplatesModal.jsx';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';

import {
  getUserRole,
  userIdOf
} from '../../utils/dataScope.js';

// ============================================================
// TEAM LEAD WORKSPACE CONFIGURATION
// TEAM_LEAD_ONLY_LAYOUT_V1
// ============================================================

const ROLE_STORAGE_KEY =
  'technomold_teamlead_role';

const TEAM_LEAD_HOME =
  '/team-lead/dashboard';

const ACTIVE_PORTAL_ROLE =
  'team-lead';

const AUTHORIZED_ACCOUNT_ROLES = [
  'team-lead',
  'manager',
  'super-admin'
];

// ============================================================
// ACCOUNT HELPERS
// ============================================================

const normalizeId = value =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const getRoleStorageKey = userId =>
  `${ROLE_STORAGE_KEY}:${encodeURIComponent(
    normalizeId(userId)
  )}`;

const hasManagementAccess = user => {

  const role = getUserRole(user);

  return AUTHORIZED_ACCOUNT_ROLES.includes(role);

};

const saveTeamLeadPortal = userId => {

  if (!userId) return;

  try {

    window.sessionStorage.setItem(
      getRoleStorageKey(userId),
      ACTIVE_PORTAL_ROLE
    );

    window.sessionStorage.setItem(
      ROLE_STORAGE_KEY,
      ACTIVE_PORTAL_ROLE
    );

  } catch (error) {

    console.error(
      'Unable to update portal preference:',
      error
    );

  }

};

const isRemovedEmployeePath = pathname => {

  const path = String(pathname || '')
    .replace(/\/+$/, '')
    .toLowerCase();

  return (
    path === '/team-lead/employee' ||
    path.startsWith('/team-lead/employee/')
  );

};

// ============================================================
// ACCESS DENIED
// ============================================================

const AccessDenied = () => (

  <div className="
    team-lead-module
    min-h-screen flex
    items-center justify-center
    p-6 text-ink antialiased
  ">

    <div className="
      glass-card w-full max-w-md
      !p-8 text-center space-y-4
    ">

      <h2 className="
        font-display text-2xl
        font-semibold text-bad
      ">

        Access Denied

      </h2>

      <p className="
        text-sm leading-relaxed
        text-muted
      ">

        Your account does not have permission
        to access the Team Lead workspace.

      </p>

      <p className="text-xs text-muted">

        Please contact your system administrator.

      </p>

    </div>

  </div>

);

// ============================================================
// LOADING WORKSPACE
// ============================================================

const WorkspaceLoading = () => (

  <div className="
    team-lead-module min-h-screen
    flex items-center justify-center
    text-ink antialiased
  ">

    <div className="
      flex flex-col
      items-center gap-4
    ">

      <div
        className="
          h-10 w-10 animate-spin
          rounded-full border-2
          border-line border-t-accent
        "
        aria-hidden="true"
      />

      <p className="
        text-sm font-normal text-muted
      ">

        Loading your workspace...

      </p>

    </div>

  </div>

);

// ============================================================
// INVALID ACCOUNT
// ============================================================

const InvalidAccount = () => (

  <div className="
    team-lead-module min-h-screen
    flex items-center justify-center
    p-6 text-ink antialiased
  ">

    <div className="
      glass-card w-full max-w-md
      !p-8 text-center space-y-3
    ">

      <h2 className="
        font-display text-xl
        font-semibold text-bad
      ">

        Account Information Unavailable

      </h2>

      <p className="text-sm text-muted">

        Your account identity could not be verified.
        Please sign in again or contact
        your administrator.

      </p>

    </div>

  </div>

);

// ============================================================
// TEAM LEAD ACCOUNT WORKSPACE
// ============================================================

const AccountWorkspace = ({
  currentUser,
  accountId,
  onSignOut
}) => {

  const location = useLocation();

  const authorized =
    hasManagementAccess(currentUser);

  const activeRole = authorized
    ? ACTIVE_PORTAL_ROLE
    : null;

  const allowedRoles = authorized
    ? [ACTIVE_PORTAL_ROLE]
    : [];

  // ==========================================================
  // GLOBAL MODALS
  // ==========================================================

  const [isHelpOpen, setIsHelpOpen] =
    useState(false);

  const [isTemplatesOpen, setIsTemplatesOpen] =
    useState(false);

  // ==========================================================
  // KEEP TEAM LEAD PORTAL ACTIVE
  // ==========================================================

  useEffect(() => {

    if (!authorized || !accountId) {
      return;
    }

    saveTeamLeadPortal(accountId);

  }, [accountId, authorized]);

  // ==========================================================
  // VALIDATE ACCESS
  // ==========================================================

  if (!authorized) {

    return <AccessDenied />;

  }

  // ==========================================================
  // REDIRECT REMOVED EMPLOYEE PORTAL
  // ==========================================================

  if (isRemovedEmployeePath(location.pathname)) {

    return (

      <Navigate
        to={TEAM_LEAD_HOME}
        replace
      />

    );

  }

  // ==========================================================
  // MAIN WORKSPACE
  // ==========================================================

  return (

    <div className="
      team-lead-module
      min-h-screen
      w-full
      text-ink
      font-sans
      antialiased
    ">

      <div className="
        flex
        min-h-screen
        w-full
        flex-col
        md:flex-row
      ">

        {/* ==================================================
            TEAM LEAD SIDEBAR
        ================================================== */}

        <Sidebar
          activeRole={activeRole}
          allowedRoles={allowedRoles}
          onOpenHelpModal={() =>
            setIsHelpOpen(true)
          }
          onOpenTemplatesModal={() =>
            setIsTemplatesOpen(true)
          }
        />

        {/* ==================================================
            MAIN WORKSPACE
        ================================================== */}

        <div className="
          relative
          flex
          min-w-0
          flex-1
          flex-col
        ">

          <div className="
            mx-auto
            flex
            w-full
            max-w-[1920px]
            min-w-0
            flex-1
            flex-col
            px-4
            sm:px-5
            lg:px-6
            xl:px-7
          ">

            {/* ==============================================
                HEADER
            ============================================== */}

            <div className="
              relative
              z-30
              w-full
              min-w-0
              pt-3
              pb-3
            ">

              <Header
                activeRole={activeRole}
                onSignOut={onSignOut}
                onOpenHelpModal={() =>
                  setIsHelpOpen(true)
                }
              />

            </div>

            {/* ==============================================
                HEADER SEPARATOR
            ============================================== */}

            <div className="
              mb-5
              h-px
              w-full
              shrink-0
              bg-line/40
            " />

            {/* ==============================================
                CURRENT PAGE
            ============================================== */}

            <main className="
              min-w-0
              w-full
              flex-1
              pb-8
              animate-fade-in
            ">

              <Outlet
                context={{
                  activeRole,
                  allowedRoles,
                  currentUser
                }}
              />

            </main>

          </div>

        </div>

      </div>

      {/* ==================================================
          GLOBAL TOAST
      ================================================== */}

      <Toast />

      {/* ==================================================
          HELP AND SUPPORT
      ================================================== */}

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() =>
          setIsHelpOpen(false)
        }
      />

      {/* ==================================================
          TEMPLATES MODAL
      ================================================== */}

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() =>
          setIsTemplatesOpen(false)
        }
      />

    </div>

  );

};

// ============================================================
// MAIN LAYOUT ENTRY POINT
// ============================================================

export const MainLayout = ({
  onSignOut
} = {}) => {

  const context = useTeamLead();

  const currentUser =
    context.currentUser;

  const accountId =
    userIdOf(currentUser);

  // ==========================================================
  // EXISTING AUTHENTICATION HANDLER
  // ==========================================================

  const signOutHandler =
    typeof onSignOut === 'function'

      ? onSignOut

      : typeof context.signOut === 'function'

        ? () => context.signOut()

        : typeof context.logout === 'function'

          ? () => context.logout()

          : undefined;

  // ==========================================================
  // USER LOADING STATE
  // ==========================================================

  if (!currentUser) {

    return <WorkspaceLoading />;

  }

  // ==========================================================
  // VALIDATE USER IDENTITY
  // ==========================================================

  if (!accountId) {

    return <InvalidAccount />;

  }

  // ==========================================================
  // VALIDATE MANAGEMENT ACCESS
  // ==========================================================

  if (!hasManagementAccess(currentUser)) {

    return <AccessDenied />;

  }

  // ==========================================================
  // ACCOUNT-SPECIFIC TEAM LEAD WORKSPACE
  // ==========================================================

  return (

    <AccountWorkspace

      key={`${
        normalizeId(accountId)
      }:${
        getUserRole(currentUser)
      }`}

      currentUser={currentUser}

      accountId={accountId}

      onSignOut={signOutHandler}

    />

  );

};

export default MainLayout;