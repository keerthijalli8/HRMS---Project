
import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card, KpiTile } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { EmptyState } from '../shared/EmptyState';

import {
  IconHeadphones,
  IconSearch,
  IconUsers,
  IconKey,
  IconLaptop,
  IconShare,
  IconPackage,
  IconShield,
  IconChart,
  IconClock,
  IconPlus,
  IconFileText,
  IconArrowRight,
  IconSettings,
  IconAlertTriangle,
  IconChevronRight
} from '../shared/Icons';

// ============================================================
// HELP CENTER CONFIGURATION
// ============================================================

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg bg-surface2 border border-line text-ink text-[13px] focus:outline-none focus:border-accent';

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const isResolved = ticket =>
  ['resolved', 'closed'].includes(normalize(ticket.status));

// ============================================================
// FREQUENTLY ASKED QUESTIONS
// ============================================================

const FAQS = [
  {
    id: 'faq-01',
    category: 'User Accounts',
    question: 'How do I create a new employee account?',
    answer:
      'Open User Accounts and select Provision User. Enter the employee name, email address, department, location and applicable role. Review the information and submit the form.',
    page: 'accounts',
    permission: 'User Profiles'
  },
  {
    id: 'faq-02',
    category: 'User Accounts',
    question: 'How do I suspend or deactivate an employee account?',
    answer:
      'Open User Accounts, locate the employee and select the appropriate account status action. Review the confirmation before applying the change.',
    page: 'accounts',
    permission: 'User Profiles'
  },
  {
    id: 'faq-03',
    category: 'Access Management',
    question: 'How do I grant application access?',
    answer:
      'Navigate to Access Management and locate the employee in the access matrix. Select the application and grant access using the available authorized action.',
    page: 'access',
    permission: 'Security'
  },
  {
    id: 'faq-04',
    category: 'Access Management',
    question: 'How do I approve or reject access requests?',
    answer:
      'Open Access Management and select the access requests section. Review the employee information, requested application and justification before approving or rejecting the request.',
    page: 'access',
    permission: 'Security'
  },
  {
    id: 'faq-05',
    category: 'Asset Management',
    question: 'How do I register a new IT asset?',
    answer:
      'Open Asset Management and select Add Asset. Enter the device model, asset category, serial number, purchase cost, location and warranty information.',
    page: 'inventory',
    permission: 'Assets'
  },
  {
    id: 'faq-06',
    category: 'Asset Allocation',
    question: 'How do I allocate an asset to an employee?',
    answer:
      'Open Asset Allocation and select an available device and an eligible employee. Record the handover date, device condition and relevant notes before confirming the assignment.',
    page: 'allocate',
    permission: 'Assets'
  },
  {
    id: 'faq-07',
    category: 'Asset Allocation',
    question: 'How do I return an assigned asset?',
    answer:
      'Locate the assigned asset in Asset Allocation and select Return. Record the condition of the returned device and any inspection notes before confirming.',
    page: 'allocate',
    permission: 'Assets'
  },
  {
    id: 'faq-08',
    category: 'Helpdesk',
    question: 'How do I raise an IT support ticket?',
    answer:
      'Click Raise Support Ticket in the Help Center or Create Ticket in Helpdesk. Select the requester, enter the issue description, category and priority, and submit the request.',
    page: 'desk',
    permission: 'Helpdesk'
  },
  {
    id: 'faq-09',
    category: 'Helpdesk',
    question: 'How do I resolve a support ticket?',
    answer:
      'Open the ticket details in Helpdesk. Review the issue, record troubleshooting notes and provide resolution details before selecting Resolve.',
    page: 'desk',
    permission: 'Helpdesk'
  },
  {
    id: 'faq-10',
    category: 'Helpdesk',
    question: 'What does an SLA breach mean?',
    answer:
      'An SLA breach indicates that the ticket has exceeded its configured service-level time target. Review the ticket priority, elapsed time and resolution requirements.',
    page: 'desk',
    permission: 'Helpdesk'
  },
  {
    id: 'faq-11',
    category: 'Software Management',
    question: 'How do I allocate a software licence?',
    answer:
      'Open Software Management, select the required software and verify that the licence is valid and has available seats. Select an eligible employee and confirm the allocation.',
    page: 'licences',
    permission: 'Software'
  },
  {
    id: 'faq-12',
    category: 'Software Management',
    question: 'How do I renew a software licence?',
    answer:
      'Review the renewal queue in Software Management. Select the relevant licence and update its renewal information. Actual purchases must be completed separately with the vendor.',
    page: 'licences',
    permission: 'Software'
  },
  {
    id: 'faq-13',
    category: 'Security',
    question: 'How do I acknowledge a security alert?',
    answer:
      'Open Security & Activity, review the alert information and select Acknowledge. Acknowledgement records the review but does not automatically resolve the underlying incident.',
    page: 'events',
    permission: 'Security'
  },
  {
    id: 'faq-14',
    category: 'IT Reports',
    question: 'How do I export an IT report?',
    answer:
      'Open IT Reports, select the report type and apply the required filters. Use Export CSV or Print View to obtain the matching records.',
    page: 'reports',
    permission: 'Reports'
  },
  {
    id: 'faq-15',
    category: 'Settings',
    question: 'How do I manage system configurations?',
    answer:
      'Open Settings to review business units, office locations, integrations, notification rules and backup policies. Available actions depend on your assigned permissions.',
    page: 'settings',
    permission: 'System Settings'
  },
  {
    id: 'faq-16',
    category: 'General',
    question: 'Why can I not access certain modules?',
    answer:
      'Module access is controlled by your assigned role and permissions. Contact an authorized administrator if additional permissions are required.'
  },
  {
    id: 'faq-17',
    category: 'General',
    question: 'Will my changes remain after refreshing?',
    answer:
      'Supported operational records are saved in browser local storage. Clearing browser data or using a different browser may affect access to locally saved information.'
  }
];

// ============================================================
// USER GUIDES
// ============================================================

const GUIDES = [
  {
    id: 'accounts',
    title: 'User Account Management',
    description:
      'Learn how to provision, update and manage employee accounts.',
    icon: IconUsers,
    permission: 'User Profiles',
    steps: [
      'Open User Accounts.',
      'Select an existing employee or Provision User.',
      'Enter or update employee information.',
      'Review role and account status.',
      'Save and verify the account record.'
    ]
  },
  {
    id: 'access',
    title: 'Technical Access Management',
    description:
      'Manage employee permissions and application access.',
    icon: IconKey,
    permission: 'Security',
    steps: [
      'Open Access Management.',
      'Locate the required employee.',
      'Review the application access matrix.',
      'Grant or revoke authorized access.',
      'Verify the updated access information.'
    ]
  },
  {
    id: 'inventory',
    title: 'Hardware Asset Management',
    description:
      'Register and maintain hardware inventory.',
    icon: IconLaptop,
    permission: 'Assets',
    steps: [
      'Open Asset Management.',
      'Select Add Asset or an existing record.',
      'Enter model and serial number.',
      'Review purchase and warranty information.',
      'Save and verify the inventory record.'
    ]
  },
  {
    id: 'allocate',
    title: 'Asset Allocation & Returns',
    description:
      'Manage employee equipment and custody history.',
    icon: IconShare,
    permission: 'Assets',
    steps: [
      'Open Asset Allocation.',
      'Select an available device.',
      'Select an eligible employee.',
      'Record the device condition and handover date.',
      'Confirm and review the custody history.'
    ]
  },
  {
    id: 'desk',
    title: 'Helpdesk Operations',
    description:
      'Create, assign, prioritize and resolve support tickets.',
    icon: IconHeadphones,
    permission: 'Helpdesk',
    steps: [
      'Open Helpdesk.',
      'Select Create Ticket.',
      'Enter the requester and issue details.',
      'Assign a technician and review priority.',
      'Record resolution information when completed.'
    ]
  },
  {
    id: 'licences',
    title: 'Software Licence Management',
    description:
      'Manage software seats, allocations and renewals.',
    icon: IconPackage,
    permission: 'Software',
    steps: [
      'Open Software Management.',
      'Select the software licence.',
      'Review available seats and expiry information.',
      'Allocate or release employee seats.',
      'Verify licence utilization.'
    ]
  },
  {
    id: 'events',
    title: 'Security & Activity',
    description:
      'Review security alerts, login events and sessions.',
    icon: IconShield,
    permission: 'Security',
    steps: [
      'Open Security & Activity.',
      'Select the relevant event category.',
      'Review event and session information.',
      'Acknowledge reviewed alerts.',
      'Escalate unresolved incidents through Helpdesk.'
    ]
  },
  {
    id: 'reports',
    title: 'IT Reports & Analytics',
    description:
      'Review and export operational reports.',
    icon: IconChart,
    permission: 'Reports',
    steps: [
      'Open IT Reports.',
      'Select the required report category.',
      'Apply relevant filters.',
      'Review the summary and report data.',
      'Export the report as CSV or use Print View.'
    ]
  },
  {
    id: 'settings',
    title: 'System Configuration',
    description:
      'Review administration settings and operational policies.',
    icon: IconSettings,
    permission: 'System Settings',
    steps: [
      'Open Settings.',
      'Select the required configuration category.',
      'Review available configuration records.',
      'Apply authorized changes where supported.',
      'Export configuration details if required.'
    ]
  }
];

// ============================================================
// TROUBLESHOOTING GUIDES
// ============================================================

const TROUBLESHOOTING = [
  {
    title: 'Unable to access a module',
    icon: IconKey,
    description:
      'Verify that your assigned role includes the required module permissions. Contact an administrator if additional access is needed.'
  },
  {
    title: 'Unable to allocate an asset',
    icon: IconLaptop,
    description:
      'Check that the device is available, has no existing assignment and is suitable for allocation. Verify the selected employee account.'
  },
  {
    title: 'Software allocation failed',
    icon: IconPackage,
    description:
      'Check licence validity, available seats and existing employee allocations before retrying.'
  },
  {
    title: 'Records are not appearing',
    icon: IconSearch,
    description:
      'Reset the search and filters. Verify the selected category and browser profile.'
  },
  {
    title: 'Unable to export a report',
    icon: IconFileText,
    description:
      'Verify Reports permissions, ensure matching records exist and check the browser download settings.'
  },
  {
    title: 'Unexpected application error',
    icon: IconAlertTriangle,
    description:
      'Refresh the page. If the issue continues, create a support ticket containing the affected module, error message and steps to reproduce.'
  }
];

// ============================================================
// MAIN HELP & SUPPORT PAGE
// ============================================================

export function HelpSupportPage() {
  const {
    tickets = [],
    users = [],
    currentUser,
    isAuthenticated,
    navigate,
    setActiveDrawer,
    setDrawerPayload,
    hasPermission
  } = useStore();

  const canReadTickets =
    hasPermission('Helpdesk', 'read');

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canCreateTicket =
    hasPermission('Helpdesk', 'write') &&
    canReadUsers;

  const [activeTab, setActiveTab] =
    useState('overview');

  const [search, setSearch] =
    useState('');

  const [faqCategory, setFaqCategory] =
    useState('All');

  const [expandedFaq, setExpandedFaq] =
    useState(null);

  const [expandedGuide, setExpandedGuide] =
    useState(null);

  const [ticketSearch, setTicketSearch] =
    useState('');

  const [ticketStatus, setTicketStatus] =
    useState('All');

  // ==========================================================
  // PERMISSION-BASED CONTENT
  // ==========================================================

  const visibleFAQs = FAQS.filter(faq =>
    !faq.permission ||
    hasPermission(faq.permission, 'read')
  );

  const visibleGuides = GUIDES.filter(guide =>
    hasPermission(guide.permission, 'read')
  );

  const categories = [
    'All',
    ...new Set(
      visibleFAQs.map(faq => faq.category)
    )
  ];

  const filteredFAQs = visibleFAQs.filter(faq => {
    const matchesCategory =
      faqCategory === 'All' ||
      faq.category === faqCategory;

    const matchesSearch = normalize(
      `${faq.category} ${faq.question} ${faq.answer}`
    ).includes(normalize(search));

    return matchesCategory && matchesSearch;
  });

  const filteredGuides = visibleGuides.filter(guide =>
    normalize(
      `${guide.title} ${guide.description} ${guide.steps.join(' ')}`
    ).includes(normalize(search))
  );

  const filteredTroubleshooting =
    TROUBLESHOOTING.filter(item =>
      normalize(
        `${item.title} ${item.description}`
      ).includes(normalize(search))
    );

  // ==========================================================
  // PERSONAL SUPPORT TICKETS
  // ==========================================================

  const employee =
    canReadUsers && currentUser
      ? users.find(user =>
          user.id === currentUser.id ||
          (
            currentUser.email &&
            normalize(user.email) ===
              normalize(currentUser.email)
          )
        )
      : null;

  const myTickets = useMemo(() => {
    if (
      !isAuthenticated ||
      !canReadTickets ||
      !currentUser
    ) {
      return [];
    }

    const employeeId =
      employee?.id || currentUser.id;

    const email = normalize(
      employee?.email || currentUser.email
    );

    return tickets.filter(ticket =>
      (
        employeeId &&
        ticket.requesterId === employeeId
      ) ||
      (
        email &&
        ticket.requesterEmail &&
        normalize(ticket.requesterEmail) === email
      )
    );
  }, [
    tickets,
    currentUser,
    employee,
    isAuthenticated,
    canReadTickets
  ]);

  const openTickets = myTickets.filter(
    ticket => !isResolved(ticket)
  ).length;

  const resolvedTickets = myTickets.filter(
    isResolved
  ).length;

  const inProgressTickets = myTickets.filter(
    ticket =>
      normalize(ticket.status) === 'in progress'
  ).length;

  const filteredTickets = myTickets.filter(ticket => {
    const matchesSearch = normalize(
      `${ticket.id} ${ticket.title} ${ticket.category} ${ticket.assignedTo}`
    ).includes(normalize(ticketSearch));

    const matchesStatus =
      ticketStatus === 'All' ||
      normalize(ticket.status) ===
        normalize(ticketStatus);

    return matchesSearch && matchesStatus;
  });

  const availableStatuses = [
    ...new Set(
      myTickets.map(ticket => ticket.status)
        .filter(Boolean)
    )
  ];

  // ==========================================================
  // HELP CENTER NAVIGATION
  // ==========================================================

  const tabs = [
    {
      id: 'overview',
      label: 'Overview'
    },
    {
      id: 'faq',
      label: 'FAQs'
    },
    {
      id: 'guides',
      label: 'User Guides'
    },
    {
      id: 'troubleshooting',
      label: 'Troubleshooting'
    },
    ...(canReadTickets
      ? [{
          id: 'tickets',
          label: 'My Support Tickets'
        }]
      : [])
  ];

  const currentTab = tabs.some(
    tab => tab.id === activeTab
  ) ? activeTab : 'overview';

  const changeTab = tab => {
    setActiveTab(tab);
    setSearch('');
    setFaqCategory('All');
    setExpandedFaq(null);
    setExpandedGuide(null);
  };

  const openSupportTicket = () => {
    if (
      !isAuthenticated ||
      !canCreateTicket
    ) {
      return;
    }

    setDrawerPayload(null);
    setActiveDrawer('new_ticket');
  };

  const openModule = (page, permission) => {
    if (
      permission &&
      !hasPermission(permission, 'read')
    ) {
      return;
    }

    navigate(page);
  };

  const openTicketDetails = ticketId => {
    if (!canReadTickets) return;

    navigate('desk', {
      ticketId
    });
  };

  // ==========================================================
  // ACCESS VALIDATION
  // ==========================================================

  if (!isAuthenticated) {
    return (
      <Card title="Help & Support">
        <EmptyState
          icon={IconShield}
          message="Sign in to access the IT Administration Help Center."
        />
      </Card>
    );
  }

  // ==========================================================
  // MAIN PAGE RENDER
  // ==========================================================

  return (
    <div
      id="widget-help-support"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>

          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">

            <IconHeadphones className="w-6 h-6 text-sky-400" />

            Help & Support

          </h2>

          <p className="text-[13px] text-muted mt-1">
            Access help resources, operational guides
            and technical support.
          </p>

        </div>

        {canCreateTicket && (
          <Button
            variant="primary"
            icon={IconPlus}
            onClick={openSupportTicket}
          >
            Raise Support Ticket
          </Button>
        )}

      </div>

      {/* NAVIGATION TABS */}

      <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-surface border border-line">

        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={currentTab === tab.id}
            onClick={() => changeTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              currentTab === tab.id
                ? 'bg-accent text-on-accent'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            {tab.label}
          </button>
        ))}

      </div>

      {/* HELP CENTER OVERVIEW */}

      {currentTab === 'overview' && (
        <>

          <Card>

            <div className="flex flex-col gap-4 py-4 sm:px-3">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center shrink-0">

                  <IconHeadphones className="w-6 h-6" />

                </div>

                <div>

                  <h3 className="font-display font-bold text-[24px] text-ink">
                    How can we help you?
                  </h3>

                  <p className="text-[13px] text-muted mt-1">
                    Search help articles, user guides
                    and troubleshooting solutions.
                  </p>

                </div>

              </div>

              <div className="relative max-w-[750px]">

                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

                <input
                  type="search"
                  value={search}
                  onChange={event =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search help topics..."
                  aria-label="Search help topics"
                  className={`${INPUT_CLASS} pl-10 py-3`}
                />

              </div>

            </div>

          </Card>

          {/* OVERVIEW QUICK LINKS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

            {[
              {
                title: 'FAQs',
                description:
                  'Answers to frequently asked questions.',
                icon: IconFileText,
                action: 'faq'
              },
              {
                title: 'User Guides',
                description:
                  'Step-by-step module instructions.',
                icon: IconUsers,
                action: 'guides'
              },
              {
                title: 'Troubleshooting',
                description:
                  'Solutions to common technical issues.',
                icon: IconSettings,
                action: 'troubleshooting'
              },
              ...(canReadTickets ? [{
                title: 'My Support Tickets',
                description:
                  'Track your submitted IT requests.',
                icon: IconClock,
                action: 'tickets'
              }] : [])
            ].map(item => {
              const Icon = item.icon;

              return (
                <Card key={item.action}>

                  <button
                    type="button"
                    onClick={() =>
                      changeTab(item.action)
                    }
                    className="w-full flex flex-col items-start gap-3 text-left group"
                  >

                    <div className="w-10 h-10 rounded-xl bg-surface2 border border-line text-accent flex items-center justify-center">

                      <Icon className="w-5 h-5" />

                    </div>

                    <h3 className="font-bold text-[14px] text-ink group-hover:text-accent">

                      {item.title}

                    </h3>

                    <p className="text-[12px] text-muted">

                      {item.description}

                    </p>

                    <span className="text-[12px] font-semibold text-accent flex items-center gap-1">

                      Explore

                      <IconArrowRight className="w-3.5 h-3.5" />

                    </span>

                  </button>

                </Card>
              );
            })}

          </div>

        </>
      )}

      {/* FREQUENTLY ASKED QUESTIONS */}

      {(
        currentTab === 'overview' ||
        currentTab === 'faq'
      ) && (

        <Card
          title={`Frequently Asked Questions (${filteredFAQs.length})`}
          subText="Find answers to common IT administration questions"
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <input
              type="search"
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Search FAQs..."
              aria-label="Search FAQs"
              className={INPUT_CLASS}
            />

            <select
              value={faqCategory}
              onChange={event =>
                setFaqCategory(event.target.value)
              }
              aria-label="FAQ category"
              className={INPUT_CLASS}
            >

              {categories.map(category => (
                <option
                  key={category}
                  value={category}
                >
                  {category === 'All'
                    ? 'All Categories'
                    : category}
                </option>
              ))}

            </select>

          </div>

          {filteredFAQs.length > 0 ? (

            <div className="flex flex-col divide-y divide-line/60">

              {filteredFAQs.map(faq => {
                const expanded =
                  expandedFaq === faq.id;

                return (
                  <div
                    key={faq.id}
                    className="py-2"
                  >

                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedFaq(
                          expanded
                            ? null
                            : faq.id
                        )
                      }
                      className="w-full flex items-center justify-between gap-3 py-3 text-left"
                    >

                      <div className="flex flex-col gap-1">

                        <span className="text-[11px] font-semibold text-accent">

                          {faq.category}

                        </span>

                        <span className="text-[13px] font-semibold text-ink">

                          {faq.question}

                        </span>

                      </div>

                      <IconChevronRight
                        className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                          expanded
                            ? 'rotate-90'
                            : ''
                        }`}
                      />

                    </button>

                    {expanded && (

                      <div className="p-3 rounded-lg border border-line bg-surface2/40 flex flex-col gap-3">

                        <p className="text-[13px] text-muted leading-relaxed">

                          {faq.answer}

                        </p>

                        {faq.page && (
                          <div>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                openModule(
                                  faq.page,
                                  faq.permission
                                )
                              }
                            >
                              Open Module
                              <IconArrowRight className="w-3.5 h-3.5" />
                            </Button>

                          </div>
                        )}

                      </div>

                    )}

                  </div>
                );
              })}

            </div>

          ) : (

            <EmptyState
              icon={IconSearch}
              message="No questions match your search."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setFaqCategory('All');
              }}
            />

          )}

        </Card>

      )}

      {/* MODULE USER GUIDES */}

      {(
        currentTab === 'guides' ||
        (
          currentTab === 'overview' &&
          Boolean(normalize(search))
        )
      ) && (

        <Card
          title="IT Administration User Guides"
          subText="Step-by-step instructions for available modules"
        >

          <input
            type="search"
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search user guides..."
            aria-label="Search user guides"
            className={INPUT_CLASS}
          />

          {filteredGuides.length > 0 ? (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {filteredGuides.map(guide => {
                const Icon = guide.icon;

                const expanded =
                  expandedGuide === guide.id;

                return (
                  <div
                    key={guide.id}
                    className="rounded-xl border border-line bg-surface2/30 p-4 flex flex-col gap-3"
                  >

                    <div className="flex items-start gap-3">

                      <div className="w-10 h-10 rounded-lg bg-surface border border-line text-accent flex items-center justify-center shrink-0">

                        <Icon className="w-5 h-5" />

                      </div>

                      <div>

                        <h3 className="text-[14px] font-bold text-ink">

                          {guide.title}

                        </h3>

                        <p className="text-[12px] text-muted mt-1">

                          {guide.description}

                        </p>

                      </div>

                    </div>

                    {expanded && (

                      <ol className="flex flex-col gap-3 border-t border-line pt-3">

                        {guide.steps.map((step, index) => (

                          <li
                            key={`${guide.id}-${index}`}
                            className="flex items-start gap-2.5 text-[12px] text-ink"
                          >

                            <span className="w-6 h-6 shrink-0 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold">

                              {index + 1}

                            </span>

                            <span className="pt-1">

                              {step}

                            </span>

                          </li>

                        ))}

                      </ol>

                    )}

                    <div className="flex flex-wrap justify-end gap-2">

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setExpandedGuide(
                            expanded
                              ? null
                              : guide.id
                          )
                        }
                      >

                        {expanded
                          ? 'Hide Guide'
                          : 'Read Guide'}

                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          openModule(
                            guide.id,
                            guide.permission
                          )
                        }
                      >

                        Open Module

                        <IconArrowRight className="w-3.5 h-3.5" />

                      </Button>

                    </div>

                  </div>
                );
              })}

            </div>

          ) : (

            <EmptyState
              icon={IconFileText}
              message="No matching user guides available."
              actionLabel="Clear Search"
              onAction={() => setSearch('')}
            />

          )}

        </Card>

      )}

      {/* TROUBLESHOOTING CENTER */}

      {(
        currentTab === 'troubleshooting' ||
        (
          currentTab === 'overview' &&
          Boolean(normalize(search))
        )
      ) && (

        <Card
          title="Troubleshooting Center"
          subText="Recommended solutions for common technical issues"
        >

          <input
            type="search"
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search troubleshooting topics..."
            aria-label="Search troubleshooting topics"
            className={INPUT_CLASS}
          />

          {filteredTroubleshooting.length > 0 ? (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {filteredTroubleshooting.map(item => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-line bg-surface2/30 p-4 flex items-start gap-3"
                  >

                    <div className="w-10 h-10 rounded-lg bg-surface border border-line text-accent flex items-center justify-center shrink-0">

                      <Icon className="w-5 h-5" />

                    </div>

                    <div className="flex flex-col gap-2">

                      <h3 className="text-[14px] font-bold text-ink">

                        {item.title}

                      </h3>

                      <p className="text-[12px] text-muted leading-relaxed">

                        {item.description}

                      </p>

                    </div>

                  </div>
                );
              })}

            </div>

          ) : (

            <EmptyState
              icon={IconSearch}
              message="No matching troubleshooting topics."
            />

          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface2/30 p-4">

            <div>

              <h3 className="font-bold text-[14px] text-ink">

                Still facing an issue?

              </h3>

              <p className="text-[12px] text-muted mt-1">

                Submit a support request with
                relevant issue details.

              </p>

            </div>

            {canCreateTicket && (

              <Button
                variant="primary"
                icon={IconPlus}
                onClick={openSupportTicket}
              >

                Create Support Ticket

              </Button>

            )}

          </div>

        </Card>

      )}

      {/* MY SUPPORT TICKETS */}

      {(
        currentTab === 'tickets' &&
        canReadTickets
      ) && (

        <>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <KpiTile
              label="My Total Tickets"
              value={myTickets.length}
              delta="Submitted requests"
              deltaType="neutral"
            />

            <KpiTile
              label="Open Tickets"
              value={openTickets}
              delta="Pending resolution"
              deltaType="warn"
            />

            <KpiTile
              label="In Progress"
              value={inProgressTickets}
              delta="Under review"
              deltaType="neutral"
            />

            <KpiTile
              label="Resolved Tickets"
              value={resolvedTickets}
              delta="Completed requests"
              deltaType="good"
            />

          </div>

          <Card
            title={`My Support Tickets (${filteredTickets.length})`}
            subText="Support requests associated with your signed-in account"
            action={canCreateTicket ? (

              <Button
                variant="secondary"
                icon={IconPlus}
                onClick={openSupportTicket}
              >

                New Ticket

              </Button>

            ) : null}
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <input
                type="search"
                value={ticketSearch}
                onChange={event =>
                  setTicketSearch(event.target.value)
                }
                placeholder="Search ticket ID or subject..."
                aria-label="Search support tickets"
                className={INPUT_CLASS}
              />

              <select
                value={ticketStatus}
                onChange={event =>
                  setTicketStatus(event.target.value)
                }
                aria-label="Ticket status"
                className={INPUT_CLASS}
              >

                <option value="All">
                  All Statuses
                </option>

                {availableStatuses.map(status => (

                  <option
                    key={status}
                    value={status}
                  >

                    {status}

                  </option>

                ))}

              </select>

            </div>

            {filteredTickets.length > 0 ? (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px] text-left border-collapse text-[12px]">

                  <thead>

                    <tr className="border-b border-line text-muted font-bold uppercase tracking-wider text-[11px]">

                      <th className="px-3 py-3">
                        Ticket ID
                      </th>

                      <th className="px-3 py-3">
                        Subject
                      </th>

                      <th className="px-3 py-3">
                        Category
                      </th>

                      <th className="px-3 py-3">
                        Priority
                      </th>

                      <th className="px-3 py-3">
                        Technician
                      </th>

                      <th className="px-3 py-3">
                        Status
                      </th>

                      <th className="px-3 py-3 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-dashed divide-line">

                    {filteredTickets.map(ticket => (

                      <tr
                        key={ticket.id}
                        className="hover:bg-surface2/40 transition-colors"
                      >

                        <td className="px-3 py-3 font-data font-bold text-accent">

                          {ticket.id}

                        </td>

                        <td className="px-3 py-3 font-semibold text-ink">

                          {ticket.title}

                        </td>

                        <td className="px-3 py-3 text-muted">

                          {ticket.category || '—'}

                        </td>

                        <td className="px-3 py-3">

                          <StatusPill
                            status={ticket.priority}
                          />

                        </td>

                        <td className="px-3 py-3 text-ink">

                          {ticket.assignedTo ||
                            'Unassigned'}

                        </td>

                        <td className="px-3 py-3">

                          <StatusPill
                            status={ticket.status}
                          />

                        </td>

                        <td className="px-3 py-3 text-right">

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openTicketDetails(ticket.id)
                            }
                          >

                            View Details

                          </Button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <EmptyState
                icon={IconHeadphones}
                message={
                  myTickets.length
                    ? 'No support tickets match your filters.'
                    : 'No support tickets are associated with your account.'
                }
                actionLabel={
                  myTickets.length
                    ? 'Reset Filters'
                    : canCreateTicket
                      ? 'Raise Support Ticket'
                      : undefined
                }
                onAction={
                  myTickets.length
                    ? () => {
                        setTicketSearch('');
                        setTicketStatus('All');
                      }
                    : canCreateTicket
                      ? openSupportTicket
                      : undefined
                }
              />

            )}

          </Card>

        </>

      )}

      {/* CONTACT SUPPORT */}

      <Card
        title="Contact IT Support"
        subText="Get assistance from the appropriate IT support team"
      >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          <div className="rounded-xl border border-line bg-surface2/30 p-4 flex flex-col gap-3">

            <div className="w-11 h-11 rounded-xl border border-accent/30 bg-accent/10 flex items-center justify-center">

              <IconHeadphones className="w-6 h-6 text-accent" />

            </div>

            <h3 className="text-[15px] font-bold text-ink">

              IT Support Desk

            </h3>

            <p className="text-[12px] text-muted leading-relaxed">

              Get assistance with hardware problems,
              software issues, employee accounts,
              application access and other technical
              requirements.

            </p>

            {canCreateTicket ? (

              <Button
                variant="primary"
                icon={IconPlus}
                onClick={openSupportTicket}
                className="self-start"
              >

                Raise Ticket

              </Button>

            ) : canReadTickets ? (

              <Button
                variant="secondary"
                onClick={() =>
                  openModule('desk', 'Helpdesk')
                }
                className="self-start"
              >

                Open Helpdesk

              </Button>

            ) : (

              <p className="text-[12px] text-muted">

                Contact an authorized administrator
                to request IT assistance.

              </p>

            )}

          </div>

          <div className="rounded-xl border border-line bg-surface2/30 p-4 flex flex-col gap-3">

            <div className="w-11 h-11 rounded-xl border border-warn/30 bg-warn/10 flex items-center justify-center">

              <IconShield className="w-6 h-6 text-warn" />

            </div>

            <h3 className="text-[15px] font-bold text-ink">

              Security & Urgent Issues

            </h3>

            <p className="text-[12px] text-muted leading-relaxed">

              Report suspicious activity, unauthorized
              access, lost devices and critical service
              interruptions through the approved
              security reporting process.

            </p>

            {hasPermission('Security', 'read') ? (

              <Button
                variant="secondary"
                icon={IconShield}
                onClick={() =>
                  openModule('events', 'Security')
                }
                className="self-start"
              >

                Security & Activity

              </Button>

            ) : canCreateTicket ? (

              <Button
                variant="secondary"
                onClick={openSupportTicket}
                className="self-start"
              >

                Report Issue

              </Button>

            ) : (

              <p className="text-[12px] text-muted">

                Contact your authorized security
                administrator for assistance.

              </p>

            )}

          </div>

        </div>

      </Card>

      {/* SECURITY INFORMATION */}

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-line bg-surface2/30">

        <IconShield className="w-4 h-4 text-muted shrink-0 mt-0.5" />

        <p className="text-[11.5px] text-muted leading-relaxed">

          Never include passwords, authentication codes,
          recovery keys or confidential credentials in
          support requests. Support tickets use the
          existing local Helpdesk workflow.

        </p>

      </div>

    </div>
  );
}

export default HelpSupportPage;
