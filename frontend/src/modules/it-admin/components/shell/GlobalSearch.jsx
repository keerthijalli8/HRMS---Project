
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import {
  IconSearch,
  IconX,
  IconDashboard,
  IconUsers,
  IconLaptop,
  IconPackage,
  IconHeadphones,
  IconArrowRight,
  IconKey,
  IconShield,
  IconClock,
  IconFilter,
  IconShare,
  IconChart,
  IconFileText,
  IconSettings,
} from '../shared/Icons';

import {
  IT_ADMIN_ROLE_PERMISSIONS,
} from '../../data/accessMatrix';

// ============================================================
// FINAL IT ADMINISTRATION MODULES
// ============================================================

const QUICK_CATEGORIES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: IconDashboard,
    color: 'text-sky-400',
    desc: 'IT administration overview',
    permission: null,
  },
  {
    id: 'accounts',
    label: 'User Accounts',
    icon: IconUsers,
    color: 'text-sky-400',
    desc: 'Employee accounts and profiles',
    permission: 'User Profiles',
  },
  {
    id: 'access',
    label: 'Access Management',
    icon: IconKey,
    color: 'text-amber-400',
    desc: 'Application and system access',
    permission: 'Security',
  },
  {
    id: 'inventory',
    label: 'Asset Management',
    icon: IconLaptop,
    color: 'text-emerald-400',
    desc: 'IT devices and inventory',
    permission: 'Assets',
  },
  {
    id: 'allocate',
    label: 'Asset Allocation',
    icon: IconShare,
    color: 'text-cyan-400',
    desc: 'Device assignment and returns',
    permission: 'Assets',
  },
  {
    id: 'desk',
    label: 'Helpdesk',
    icon: IconHeadphones,
    color: 'text-indigo-400',
    desc: 'Support tickets and resolution',
    permission: 'Helpdesk',
  },
  {
    id: 'licences',
    label: 'Software Management',
    icon: IconPackage,
    color: 'text-violet-400',
    desc: 'Software licenses and renewals',
    permission: 'Software',
  },
  {
    id: 'events',
    label: 'Security & Activity',
    icon: IconShield,
    color: 'text-rose-400',
    desc: 'Security alerts and login activity',
    permission: 'Security',
  },
  {
    id: 'reports',
    label: 'IT Reports',
    icon: IconChart,
    color: 'text-teal-400',
    desc: 'IT operational reports',
    permission: 'Reports',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: IconFileText,
    color: 'text-cyan-400',
    desc: 'FAQs, user guides and troubleshooting',
    keywords:
      'help center support contact assistance frequently asked questions FAQ documentation user manual troubleshooting report issue my support tickets',
    permission: null,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: IconSettings,
    color: 'text-slate-300',
    desc: 'System configuration and policies',
    keywords:
      'system settings business units locations sites enterprise integrations notification rules backup disaster recovery configuration RPO RTO',
    permission: 'System Settings',
  },
];

// ============================================================
// SEARCH UTILITIES
// ============================================================

const MAX_RESULTS_PER_CATEGORY = 3;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function joinFields(...values) {
  return values
    .filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
    )
    .join(' · ');
}

function matchesQuery(query, ...fields) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return false;

  const searchableText = fields
    .map(normalize)
    .join(' ');

  return normalizedQuery
    .split(/\s+/)
    .every(word =>
      searchableText.includes(word)
    );
}

function findMatches(
  records,
  query,
  getFields,
  canRead
) {
  if (!canRead || !query) return [];

  return safeArray(records)
    .filter(record =>
      matchesQuery(
        query,
        ...getFields(record)
      )
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY);
}

// ============================================================
// GLOBAL SEARCH COMPONENT
// ============================================================

export function GlobalSearch() {
  const {
    users = [],
    assets = [],
    software = [],
    tickets = [],
    events = [],
    custodyHistory = [],
    pendingRequests = [],
    isAuthenticated,
    navigate,
    setActiveDrawer,
    setDrawerPayload,
    hasPermission,
  } = useStore();

  const [query, setQuery] = useState('');

  const [isOpen, setIsOpen] =
    useState(false);

  const searchRef = useRef(null);

  const inputRef = useRef(null);

  // ==========================================================
  // ROLE BASED PERMISSIONS
  // ==========================================================

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canReadAssets =
    hasPermission('Assets', 'read');

  const canReadSoftware =
    hasPermission('Software', 'read');

  const canReadTickets =
    hasPermission('Helpdesk', 'read');

  const canReadSecurity =
    hasPermission('Security', 'read');

  const canReadRoles =
    hasPermission(
      'Role Administration',
      'read'
    );

  const canReadSettings =
    hasPermission(
      'System Settings',
      'read'
    );

  const visibleQuickCategories =
    QUICK_CATEGORIES.filter(category => {
      if (!isAuthenticated) {
        return category.id === 'dashboard';
      }

      if (!category.permission) {
        return true;
      }

      return hasPermission(
        category.permission,
        'read'
      );
    });

  // ==========================================================
  // DYNAMIC SEARCH SUGGESTIONS
  // ==========================================================

  const suggestionCandidates = [
    {
      query: safeArray(assets)[0]?.model,
      allowed: canReadAssets,
    },
    {
      query: safeArray(users)[0]?.name,
      allowed: canReadUsers,
    },
    {
      query: safeArray(software)[0]?.name,
      allowed: canReadSoftware,
    },
    {
      query: safeArray(tickets)[0]?.id,
      allowed: canReadTickets,
    },
    {
      query: 'Critical',
      allowed: canReadSecurity,
    },
    {
      query: safeArray(
        pendingRequests
      )[0]?.app,
      allowed: canReadSecurity,
    },
    {
      query: 'FAQs',
      allowed: isAuthenticated,
    },
    {
      query: 'Settings',
      allowed: canReadSettings,
    },
  ];

  const visibleSuggestedQueries = [
    ...new Set(
      suggestionCandidates
        .filter(
          item =>
            item.allowed &&
            item.query
        )
        .map(item =>
          String(item.query)
        )
    ),
  ];

  // ==========================================================
  // CLOSE SEARCH WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // ==========================================================
  // KEYBOARD SHORTCUTS
  //
  // Keyboard functionality retained.
  // Visible Ctrl K label removed.
  // ==========================================================

  useEffect(() => {
    const handleGlobalKeyDown = event => {
      const activeElement =
        document.activeElement;

      const isTyping =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'SELECT' ||
        activeElement?.isContentEditable;

      const searchShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k';

      if (searchShortcut) {
        event.preventDefault();

        event.stopPropagation();

        inputRef.current?.focus();

        setIsOpen(true);

        return;
      }

      if (
        event.key === '/' &&
        !isTyping &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();

        event.stopPropagation();

        inputRef.current?.focus();

        setIsOpen(true);
      }
    };

    window.addEventListener(
      'keydown',
      handleGlobalKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleGlobalKeyDown
      );
    };
  }, []);

  const cleanQuery = normalize(query);

  // ==========================================================
  // REGISTERED USER ACCOUNT SEARCH
  // ==========================================================

  const matchedUsers = findMatches(
    users,
    cleanQuery,
    user => [
      user.id,
      user.employeeId,
      user.name,
      user.email,
      user.department,
      user.role,
      user.location,
      user.status,
      user.contactNumber,
    ],
    canReadUsers
  );

  // ==========================================================
  // ASSET MANAGEMENT SEARCH
  // ==========================================================

  const matchedAssets = findMatches(
    assets,
    cleanQuery,
    asset => [
      asset.id,
      asset.assetId,
      asset.assetTag,
      asset.tag,
      asset.model,
      asset.name,
      asset.type,
      asset.category,
      asset.serial,
      asset.serialNumber,
      asset.assignedTo,
      asset.assignedName,
      asset.assignedEmployee,
      asset.location,
      asset.condition,
      asset.status,
      asset.warrantyEnd,
    ],
    canReadAssets
  );

  // ==========================================================
  // ASSET ALLOCATION SEARCH
  // ==========================================================

  const matchedAllocations = findMatches(
    custodyHistory,
    cleanQuery,
    allocation => [
      allocation.id,
      allocation.assetTag,
      allocation.model,
      allocation.userId,
      allocation.userName,
      allocation.assignedDate,
      allocation.returnDate,
      allocation.conditionAtIssue,
      allocation.conditionAtReturn,
      allocation.notes,

      allocation.returnDate
        ? 'Returned'
        : 'Assigned',
    ],
    canReadAssets
  );

  // ==========================================================
  // HELPDESK TICKET SEARCH
  // ==========================================================

  const matchedTickets = findMatches(
    tickets,
    cleanQuery,
    ticket => [
      ticket.id,
      ticket.title,
      ticket.description,
      ticket.requesterName,
      ticket.requester,
      ticket.category,
      ticket.priority,
      ticket.status,
      ticket.assignee,
      ticket.assignedTo,
    ],
    canReadTickets
  );

  // ==========================================================
  // SOFTWARE LICENSE SEARCH
  // ==========================================================

  const matchedSoftware = findMatches(
    software,
    cleanQuery,
    item => [
      item.id,
      item.name,
      item.vendor,
      item.category,
      item.licenceType,
      item.licenseType,
      item.status,
      item.renewalDate,
      item.accessApp,
    ],
    canReadSoftware
  );

  // ==========================================================
  // ACCESS REQUEST SEARCH
  // ==========================================================

  const matchedAccessRequests = findMatches(
    pendingRequests,
    cleanQuery,
    request => [
      request.id,
      request.userId,
      request.userName,
      request.userRole,
      request.app,
      request.justification,
      request.requestedDate,
      request.status,
    ],
    canReadSecurity
  );

  // ==========================================================
  // ROLE AND PERMISSIONS SEARCH
  // ==========================================================

  const matchedPermissions = findMatches(
    IT_ADMIN_ROLE_PERMISSIONS,
    cleanQuery,
    permission => [
      permission.id,
      permission.action,
      permission.description,
      permission.category,
      permission.permission,
    ],
    canReadSecurity && canReadRoles
  );

  // ==========================================================
  // SECURITY AND ACTIVITY SEARCH
  // ==========================================================

  const matchedEvents = findMatches(
    events,
    cleanQuery,
    event => [
      event.id,
      event.userId,
      event.userName,
      event.userEmail,
      event.event,
      event.category,
      event.ipAddress,
      event.location,
      event.device,
      event.result,
      event.severity,
      event.time,

      event.acknowledged
        ? 'Acknowledged'
        : 'Unacknowledged',
    ],
    canReadSecurity
  );

  // ==========================================================
  // MODULE NAME SEARCH - ALL 11 MODULES
  // ==========================================================

  const matchedModules =
    visibleQuickCategories
      .filter(category =>
        matchesQuery(
          cleanQuery,
          category.label,
          category.desc,
          category.keywords
        )
      )
      .sort((first, second) => {
        const firstExact =
          normalize(first.label) ===
          cleanQuery;

        const secondExact =
          normalize(second.label) ===
          cleanQuery;

        return (
          Number(secondExact) -
          Number(firstExact)
        );
      })
      .slice(
        0,
        MAX_RESULTS_PER_CATEGORY
      );

  // ==========================================================
  // SEARCH RESULT NAVIGATION
  // ==========================================================

  const closeSearch = () => {
    setIsOpen(false);

    inputRef.current?.blur();
  };

  const openModule = pageId => {
    const allowedModule =
      visibleQuickCategories.some(
        category =>
          category.id === pageId
      );

    if (!allowedModule) return;

    const result = navigate(pageId);

    if (result !== false) {
      closeSearch();
    }
  };

  const openUser = user => {
    if (!canReadUsers) return;

    const result = navigate('accounts');

    if (result === false) return;

    setDrawerPayload({
      user,
    });

    setActiveDrawer('user_details');

    closeSearch();
  };

  const openTicket = ticket => {
    if (!canReadTickets) return;

    const result = navigate('desk', {
      ticketId: ticket.id,
    });

    if (result !== false) {
      closeSearch();
    }
  };

  // ==========================================================
  // SEARCH RESULT GROUPS
  // ==========================================================

  const resultGroups = [
    {
      id: 'users',

      label: 'User Accounts',

      icon: IconUsers,

      records: matchedUsers.map(user => ({
        id:
          user.id ||
          user.employeeId,

        title:
          user.name ||
          'Employee Account',

        subtitle: joinFields(
          user.employeeId,
          user.email,
          user.department,
          user.role
        ),

        status: user.status,

        onOpen: () => openUser(user),
      })),
    },

    {
      id: 'assets',

      label: 'Asset Management',

      icon: IconLaptop,

      records: matchedAssets.map(asset => ({
        id:
          asset.id ||
          asset.assetTag,

        title: joinFields(
          asset.assetId ||
            asset.assetTag ||
            asset.tag,

          asset.model ||
            asset.name
        ),

        subtitle: joinFields(
          asset.assignedName
            ? `Assigned: ${asset.assignedName}`
            : 'Inventory',

          asset.location,

          asset.condition
        ),

        status: asset.status,

        onOpen: () =>
          openModule('inventory'),
      })),
    },

    {
      id: 'tickets',

      label: 'Helpdesk Tickets',

      icon: IconHeadphones,

      records: matchedTickets.map(ticket => ({
        id: ticket.id,

        title:
          `${ticket.id}: ${ticket.title}`,

        subtitle: joinFields(
          ticket.requesterName ||
            ticket.requester,

          ticket.priority
            ? `Priority: ${ticket.priority}`
            : '',

          ticket.category
        ),

        status: ticket.status,

        onOpen: () =>
          openTicket(ticket),
      })),
    },

    {
      id: 'software',

      label: 'Software & Licenses',

      icon: IconPackage,

      records: matchedSoftware.map(item => ({
        id: item.id,

        title:
          item.name ||
          'Software License',

        subtitle: joinFields(
          item.vendor,

          item.category,

          item.totalSeats !== undefined
            ? `Seats: ${item.seatsUsed ?? 0}/${item.totalSeats}`
            : ''
        ),

        status:
          item.status ||
          item.licenceType,

        onOpen: () =>
          openModule('licences'),
      })),
    },

    {
      id: 'allocations',

      label: 'Asset Allocation',

      icon: IconShare,

      records: matchedAllocations.map(item => ({
        id: item.id,

        title: joinFields(
          item.assetTag,
          item.model
        ),

        subtitle: joinFields(
          item.userName,

          item.assignedDate,

          item.returnDate
            ? `Returned: ${item.returnDate}`
            : ''
        ),

        status: item.returnDate
          ? 'Returned'
          : 'Assigned',

        onOpen: () =>
          openModule('allocate'),
      })),
    },

    {
      id: 'access_requests',

      label: 'Access Requests',

      icon: IconKey,

      records: matchedAccessRequests.map(
        request => ({
          id: request.id,

          title: joinFields(
            request.userName,
            request.app
          ),

          subtitle: joinFields(
            request.userRole,
            request.justification
          ),

          status: request.status,

          onOpen: () =>
            openModule('access'),
        })
      ),
    },

    {
      id: 'permissions',

      label: 'Role & Access Permissions',

      icon: IconKey,

      records: matchedPermissions.map(
        (permission, index) => ({
          id:
            permission.id ||
            index,

          title:
            permission.action,

          subtitle:
            permission.description,

          status:
            permission.permission,

          onOpen: () =>
            openModule('access'),
        })
      ),
    },

    {
      id: 'security',

      label: 'Security & Activity',

      icon: IconShield,

      records: matchedEvents.map(event => ({
        id: event.id,

        title:
          event.event ||
          'Security Activity',

        subtitle: joinFields(
          event.userName,
          event.category,
          event.time
        ),

        status:
          event.severity ||
          event.result,

        onOpen: () =>
          openModule('events'),
      })),
    },

    {
      id: 'modules',

      label: 'IT Administration Modules',

      icon: IconDashboard,

      records: matchedModules.map(category => ({
        id: category.id,

        title: category.label,

        subtitle: category.desc,

        onOpen: () =>
          openModule(category.id),
      })),
    },
  ].filter(
    group => group.records.length > 0
  );

  const allResults = resultGroups.flatMap(
    group => group.records
  );

  const totalResults =
    allResults.length;

  // ==========================================================
  // FORM SUBMISSION
  // ==========================================================

  const handleSearchSubmit = event => {
    event?.preventDefault();

    event?.stopPropagation();

    if (!cleanQuery) {
      inputRef.current?.focus();

      setIsOpen(true);

      return;
    }

    // Prioritize exact module names.

    const exactModule =
      matchedModules.find(
        category =>
          normalize(category.label) ===
          cleanQuery
      );

    if (exactModule) {
      openModule(exactModule.id);

      return;
    }

    if (allResults.length > 0) {
      allResults[0].onOpen();

      return;
    }

    setIsOpen(true);
  };

  // ==========================================================
  // INPUT KEYBOARD ACTIONS
  // ==========================================================

  const handleInputKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();

      event.stopPropagation();

      if (query) {
        setQuery('');

        setIsOpen(true);
      } else {
        closeSearch();
      }

      return;
    }

    if (event.key === 'Enter') {
      handleSearchSubmit(event);
    }
  };

  // ==========================================================
  // SEARCH CLEAR ACTION
  // ==========================================================

  const clearSearch = event => {
    event?.preventDefault();

    event?.stopPropagation();

    setQuery('');

    setIsOpen(true);

    inputRef.current?.focus();
  };

  // ==========================================================
  // SEARCH STATUS STYLING
  // ==========================================================

  const getStatusClass = status => {
    const value = normalize(status);

    if (
      [
        'active',
        'available',
        'resolved',
        'closed',
        'returned',
        'allow',
        'granted',
        'approved',
        'success',
        'good',
      ].includes(value)
    ) {
      return 'text-good';
    }

    if (
      [
        'critical',
        'high',
        'deny',
        'denied',
        'rejected',
        'expired',
        'suspended',
        'deactivated',
        'failed',
        'breached sla',
      ].includes(value)
    ) {
      return 'text-rose-400';
    }

    if (
      [
        'pending',
        'open',
        'in progress',
        'expiring soon',
        'medium',
      ].includes(value)
    ) {
      return 'text-warn';
    }

    return 'text-accent';
  };

  // ==========================================================
  // COMPACT SEARCH COMPONENT RENDER
  // ==========================================================

  return (
    <div
      ref={searchRef}
      className="relative w-full min-w-0 max-w-[260px]"
    >

      {/* ================================================
          SEARCH INPUT FORM
      ================================================= */}

      <form
        onSubmit={handleSearchSubmit}
        role="search"
        aria-label="Global IT Administration Search"
        className="relative flex items-center w-full min-w-0"
      >

        {/* SEARCH ICON */}

        <button
          type="submit"
          id="global-search-submit-button"
          data-testid="global-search-submit-btn"
          aria-label="Execute search"
          title="Search IT administration"
          onClick={event => {
            if (
              !isOpen &&
              !cleanQuery
            ) {
              event.preventDefault();

              inputRef.current?.focus();

              setIsOpen(true);
            }
          }}
          className="absolute left-1.5 p-1 rounded-md text-muted hover:text-accent hover:bg-surface2 transition-all cursor-pointer z-10 focus-visible:outline-accent"
        >

          <IconSearch className="w-4 h-4 stroke-[2.2]" />

        </button>

        {/* SEARCH FIELD */}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={event => {
            setQuery(event.target.value);

            setIsOpen(true);
          }}
          onFocus={() =>
            setIsOpen(true)
          }
          onClick={() =>
            setIsOpen(true)
          }
          onKeyDown={handleInputKeyDown}
          placeholder="Search users, assets, tickets..."
          aria-label="Search IT administration records"
          aria-expanded={isOpen}
          aria-controls={
            isOpen
              ? 'global-search-dropdown-menu'
              : undefined
          }
          autoComplete="off"
          spellCheck={false}
          className={`w-full min-w-0 h-[34px] pl-8 py-1.5 text-[12px] rounded-lg bg-surface2/60 hover:bg-surface2/80 focus:bg-surface2 border border-line/60 focus:border-accent text-ink placeholder:text-muted/70 focus:outline-none transition-all shadow-inner ${
            query
              ? 'pr-[65px]'
              : 'pr-3'
          }`}
        />

        {/* ==============================================
            SEARCH ACTIONS

            Only visible when a query exists.
            No Ctrl K label or shortcut button.
        =============================================== */}

        {query && (

          <div className="absolute right-1.5 flex items-center gap-1 z-10">

            <button
              type="button"
              aria-label="Clear search query"
              title="Clear search query"
              onClick={clearSearch}
              className="p-1 rounded-md text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
            >

              <IconX className="w-3.5 h-3.5" />

            </button>

            <button
              type="submit"
              aria-label="Submit search"
              title="Search now"
              className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-accent text-on-accent hover:opacity-95 transition-all cursor-pointer select-none shadow-sm"
            >

              Go

            </button>

          </div>

        )}

      </form>

      {/* =====================================================
          SEARCH DROPDOWN - MONSOON GLASS
      ====================================================== */}

      {isOpen && (

        <div
          id="global-search-dropdown-menu"
          data-testid="global-search-dropdown"
          style={{
            backgroundColor:
              'rgba(6, 20, 28, 0.94)',

            backdropFilter:
              'blur(24px) saturate(140%)',

            WebkitBackdropFilter:
              'blur(24px) saturate(140%)',

            border:
              '1px solid rgba(255, 255, 255, 0.16)',

            boxShadow:
              '0 25px 60px rgba(0, 0, 0, 0.85)',
          }}
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl z-50 p-3.5 flex flex-col gap-3 shadow-2xl max-h-[480px] overflow-y-auto animate-in zoom-in-95 duration-150 sm:right-auto sm:w-[340px] lg:w-[390px] max-w-[calc(100vw-2rem)]"
        >

          {/* ==============================================
              QUICK DIRECTORY
          =============================================== */}

          {!cleanQuery ? (

            <div className="flex flex-col gap-3 text-ink">

              {/* DIRECTORY HEADER */}

              <div className="flex items-center justify-between pb-1.5 border-b border-line/40">

                <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">

                  <IconFilter className="w-3.5 h-3.5 text-accent" />

                  Quick Directory & Modules

                </span>

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close global search"
                  title="Close search"
                  className="p-1 rounded-md text-muted hover:text-ink hover:bg-surface2 transition-colors cursor-pointer"
                >

                  <IconX className="w-3.5 h-3.5" />

                </button>

              </div>

              {/* MODULE GRID */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">

                {visibleQuickCategories.map(category => {
                  const CategoryIcon =
                    category.icon;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        openModule(category.id)
                      }
                      title={category.label}
                      className="flex items-start gap-2.5 p-2 rounded-xl bg-surface2/40 hover:bg-surface2/80 border border-line/40 hover:border-accent/50 text-left transition-all group cursor-pointer"
                    >

                      <div
                        className={`p-1.5 rounded-lg bg-surface shrink-0 ${category.color}`}
                      >

                        <CategoryIcon className="w-4 h-4" />

                      </div>

                      <div className="flex flex-col min-w-0">

                        <span className="text-[12px] font-semibold text-ink group-hover:text-accent transition-colors truncate">

                          {category.label}

                        </span>

                        <span className="text-[10.5px] text-muted truncate">

                          {category.desc}

                        </span>

                      </div>

                    </button>
                  );
                })}

              </div>

              {/* ==========================================
                  DYNAMIC SEARCH SUGGESTIONS
              =========================================== */}

              {visibleSuggestedQueries.length > 0 && (

                <div className="pt-2 border-t border-line/40 flex flex-col gap-2">

                  <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">

                    <IconClock className="w-3 h-3 text-accent" />

                    Suggested Searches

                  </span>

                  <div className="flex flex-wrap gap-1.5">

                    {visibleSuggestedQueries.map(
                      suggestion => (

                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setQuery(suggestion);

                            setIsOpen(true);

                            inputRef.current?.focus();
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface hover:bg-surface2 border border-line/50 hover:border-accent text-ink hover:text-accent transition-all cursor-pointer"
                        >

                          {suggestion}

                        </button>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          ) : totalResults === 0 ? (

            /* ============================================
               NO SEARCH RESULTS
            ============================================= */

            <div className="p-6 text-center flex flex-col items-center gap-2">

              <div className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center text-muted">

                <IconSearch className="w-5 h-5 text-muted/60" />

              </div>

              <div className="text-[13px] font-semibold text-ink">

                No matching records found

              </div>

              <p className="text-[11.5px] text-muted max-w-xs leading-relaxed">

                No IT administration records matched
                "{query}". Try searching by employee name,
                employee ID, asset tag, serial number,
                ticket ID, software name, security event,
                help topics or settings.

              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="mt-2 px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
              >

                Clear Search

              </button>

            </div>

          ) : (

            /* ============================================
               MATCHED SEARCH RESULTS
            ============================================= */

            <>

              {/* RESULTS HEADER */}

              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-line/40 text-[11px] text-muted">

                <span
                  aria-live="polite"
                  className="font-bold uppercase tracking-wider text-accent break-words min-w-0"
                >

                  {totalResults}

                  {' '}

                  {totalResults === 1
                    ? 'Result'
                    : 'Results'}

                  {' '}

                  shown

                </span>

                <span className="text-[10px] shrink-0">

                  Enter to open

                </span>

              </div>

              {/* SEARCH GROUPS */}

              {resultGroups.map(
                (group, groupIndex) => {

                  const GroupIcon =
                    group.icon;

                  return (
                    <div
                      key={group.id}
                      className={`flex flex-col gap-1 ${
                        groupIndex > 0
                          ? 'pt-1 border-t border-line/40'
                          : ''
                      }`}
                    >

                      {/* GROUP TITLE */}

                      <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider px-2 flex items-center gap-1.5">

                        <GroupIcon className="w-3 h-3 text-accent" />

                        {group.label}

                      </span>

                      {/* GROUP RESULTS */}

                      {group.records.map(
                        (record, index) => (

                          <button
                            key={`${group.id}-${record.id ?? index}`}
                            type="button"
                            onClick={record.onOpen}
                            title={record.title}
                            className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-surface2 transition-colors text-left group cursor-pointer"
                          >

                            <div className="flex flex-col min-w-0 flex-1">

                              <span className="text-[12.5px] font-semibold text-ink group-hover:text-accent truncate">

                                {record.title}

                              </span>

                              {record.subtitle && (

                                <span
                                  className="text-[11px] text-muted truncate"
                                  title={record.subtitle}
                                >

                                  {record.subtitle}

                                </span>

                              )}

                            </div>

                            {record.status && (

                              <span
                                className={`text-[10.5px] font-bold capitalize shrink-0 max-w-[90px] truncate ${getStatusClass(
                                  record.status
                                )}`}
                                title={String(
                                  record.status
                                )}
                              >

                                {record.status}

                              </span>

                            )}

                            <IconArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />

                          </button>

                        )
                      )}

                    </div>
                  );
                }
              )}

            </>

          )}

        </div>

      )}

    </div>
  );
}
