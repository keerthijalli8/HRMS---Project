import React, { useState, useMemo } from 'react';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { EmployeeDetailsModal } from '../../components/modals/EmployeeDetailsModal.jsx';
import { formatDate } from '../../utils/helpers.js';

import {
  Users,
  Search,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Calendar,
  Eye,
  ChevronDown,
  RotateCcw
} from 'lucide-react';


// ============================================================
// HELPERS
// ============================================================

const PAGE_SIZE = 12;

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const displayValue = value =>
  value === undefined ||
  value === null ||
  value === ''
    ? '—'
    : value;

const getMemberId = member =>
  String(
    member.id ??
    member.employeeId ??
    member.userId ??
    ''
  );

const getMemberName = member =>
  member.name ||
  member.fullName ||
  member.employeeName ||
  'Employee';

const getDepartment = member =>
  member.dept ||
  member.department ||
  member.departmentName ||
  'Not Specified';

const getReportingType = member =>
  member.relation
    ? `${member.relation} Report`
    : '—';

const getSkills = member =>
  Array.isArray(member.skills)
    ? member.skills
    : [];

const getScore = member => {
  const value = member.performanceScore;

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const getJoinedTime = member => {
  const time = Date.parse(member.joined || '');

  return Number.isFinite(time)
    ? time
    : -Infinity;
};

const getLeaveBalance = member => {
  const balances = member.leaveBalance || {};

  return [
    'casual',
    'sick',
    'earned',
    'optional'
  ].reduce((total, type) => {
    const value = Number(
      balances[type]?.remaining ?? 0
    );

    return total + (
      Number.isFinite(value) ? value : 0
    );
  }, 0);
};


// ============================================================
// SHARED UI STYLES
// ============================================================

const CONTROL_CLASS = `
  h-11 w-full min-w-0 rounded-xl
  border border-line bg-surface2
  text-sm text-ink outline-none
  transition focus:border-accent
  focus:ring-1 focus:ring-accent/20
`;

const LABEL_CLASS = `
  block text-xs font-semibold
  text-muted
`;


// ============================================================
// FILTER SELECT
// ============================================================

const FilterSelect = ({
  label,
  value,
  onChange,
  children
}) => (
  <label className="block min-w-0 space-y-2">

    <span className={LABEL_CLASS}>
      {label}
    </span>

    <div className="relative">

      <select
        value={value}
        onChange={onChange}
        className={`
          ${CONTROL_CLASS}
          appearance-none pl-3 pr-9
        `}
      >
        {children}
      </select>

      <ChevronDown
        className="
          pointer-events-none absolute
          right-3 top-1/2 h-4 w-4
          -translate-y-1/2 text-muted
        "
      />

    </div>

  </label>
);


// ============================================================
// EMPLOYEE DETAIL ROW
// ============================================================

const DetailRow = ({
  label,
  value,
  icon: FieldIcon
}) => (
  <div className="
    grid min-w-0
    grid-cols-[minmax(90px,0.85fr)_minmax(0,1.15fr)]
    items-start gap-3
    border-b border-line/30 py-2
    last:border-b-0
  ">

    <span className="
      text-xs font-medium
      leading-relaxed text-muted
    ">
      {label}
    </span>

    <div className="
      flex min-w-0 items-start
      gap-1.5 text-xs text-ink
      leading-relaxed
    ">

      {FieldIcon && (
        <FieldIcon
          className="
            mt-0.5 h-3.5 w-3.5
            shrink-0 text-accent
          "
        />
      )}

      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
        {displayValue(value)}
      </span>

    </div>

  </div>
);


// ============================================================
// EMPLOYEE CARD
// ============================================================

const EmployeeCard = ({
  member,
  onViewProfile
}) => {

  const employeeName = getMemberName(member);
  const employeeId = getMemberId(member);
  const score = getScore(member);
  const totalLeaveBalance = getLeaveBalance(member);

  const cardDetails = [
    {
      label: 'Role',
      value: member.designation
    },
    {
      label: 'Department',
      value: getDepartment(member)
    },
    {
      label: 'Reporting Type',
      value: getReportingType(member)
    },
    {
      label: 'Email',
      value: member.email,
      icon: Mail
    },
    {
      label: 'Phone',
      value: member.phone,
      icon: Phone
    },
    {
      label: 'Joined Date',
      value: member.joined
        ? formatDate(member.joined)
        : '—',
      icon: Calendar
    },
    {
      label: 'Manager',
      value: member.reportingManager
    },
    {
      label: 'Skills',
      value: getSkills(member).join(', ')
    }
  ];

  return (

    <article className="
      glass-card group
      !flex !flex-col !items-stretch
      !justify-start !gap-4 !p-4
      h-full min-w-0 rounded-2xl
      transition hover:border-accent/40
    ">

      {/* EMPLOYEE IDENTITY */}

      <div className="
        flex min-w-0 items-start
        justify-between gap-3
      ">

        <div className="
          flex min-w-0 flex-1
          items-center gap-3
        ">

          <Avatar
            name={employeeName}
            size="md"
          />

          <div className="min-w-0 flex-1">

            <h3
              className="
                break-words text-sm
                font-semibold text-ink
                group-hover:text-accent
                transition
              "
            >
              {employeeName}
            </h3>

            <p className="
              mt-1 break-words
              text-xs text-muted
              font-data
            ">
              {displayValue(employeeId)}
            </p>

          </div>

        </div>

        <div className="shrink-0">

          {member.statusToday ? (
            <StatusBadge
              status={member.statusToday}
            />
          ) : (
            <span className="text-xs text-muted">
              Not Specified
            </span>
          )}

        </div>

      </div>


      {/* EMPLOYEE INFORMATION */}

      <div className="
        flex-1 min-w-0
        rounded-xl border border-line/50
        bg-surface2/30 px-3 py-1
      ">

        {cardDetails.map(detail => (

          <DetailRow
            key={detail.label}
            {...detail}
          />

        ))}

      </div>


      {/* EMPLOYEE METRICS */}

      <div className="
        grid grid-cols-3 gap-2
        rounded-xl border border-line/50
        bg-surface2/40 p-3
      ">

        <div className="
          min-w-0 text-center
        ">

          <p className="
            text-[11px] font-medium
            text-muted
          ">
            Performance
          </p>

          <p className="
            mt-1.5 text-lg font-bold
            text-accent tabular-nums
          ">
            {score === null ? '—' : score}
          </p>

          <p className="text-[10px] text-muted">
            Score / 100
          </p>

        </div>


        <div className="
          min-w-0 border-l border-line/50
          text-center
        ">

          <p className="
            text-[11px] font-medium
            text-muted
          ">
            Leave Balance
          </p>

          <p className="
            mt-1.5 text-lg font-bold
            text-ink tabular-nums
          ">
            {totalLeaveBalance}
          </p>

          <p className="text-[10px] text-muted">
            Days
          </p>

        </div>


        <div className="
          min-w-0 border-l border-line/50
          text-center
        ">

          <p className="
            text-[11px] font-medium
            text-muted
          ">
            Active Tasks
          </p>

          <p className="
            mt-1.5 text-lg font-bold
            text-ink tabular-nums
          ">
            {displayValue(
              member.assignedTasksCount
            )}
          </p>

          <p className="text-[10px] text-muted">
            Tasks
          </p>

        </div>

      </div>


      {/* PROFILE ACTION */}

      <div className="
        mt-auto border-t
        border-line/50 pt-3
      ">

        <button
          type="button"
          onClick={() =>
            onViewProfile(member)
          }
          className="
            flex h-10 w-full items-center
            justify-center gap-2
            rounded-xl border border-accent/30
            bg-accent/10 text-sm
            font-semibold text-accent
            transition hover:bg-accent/20
            focus-visible:outline
            focus-visible:outline-accent
          "
        >

          <Eye className="h-4 w-4" />

          View Profile

        </button>

      </div>

    </article>

  );
};


// ============================================================
// EMPLOYEE TABLE
// ============================================================

const EmployeeTable = ({
  members,
  onViewProfile
}) => {

  const headers = [
    'Employee',
    'Designation & Department',
    'Reporting Type',
    'Status Today',
    'Contact',
    'Joined Date',
    'Score',
    'Profile'
  ];

  return (

    <section className="
      glass-card !p-0
      overflow-hidden rounded-2xl
    ">

      <div className="overflow-x-auto">

        <table className="
          w-full min-w-[960px]
          border-collapse text-left
          text-sm text-ink
        ">

          <thead className="bg-surface2">

            <tr className="
              border-b border-line
              text-xs font-semibold
              text-muted
            ">

              {headers.map((header, index) => (

                <th
                  key={header}
                  scope="col"
                  className={`
                    whitespace-nowrap
                    px-4 py-3.5
                    ${index === 6
                      ? 'text-center'
                      : index === 7
                        ? 'text-right'
                        : 'text-left'}
                  `}
                >
                  {header}
                </th>

              ))}

            </tr>

          </thead>


          <tbody className="divide-y divide-line/40">

            {members.map(member => {

              const employeeName =
                getMemberName(member);

              const employeeId =
                getMemberId(member);

              return (

                <tr
                  key={employeeId}
                  className="
                    transition
                    hover:bg-surface2/40
                  "
                >

                  {/* EMPLOYEE */}

                  <td className="px-4 py-4">

                    <div className="
                      flex items-center gap-3
                    ">

                      <Avatar
                        name={employeeName}
                        size="sm"
                      />

                      <div className="min-w-0">

                        <span className="
                          block whitespace-nowrap
                          text-sm font-semibold
                          text-ink
                        ">
                          {employeeName}
                        </span>

                        <span className="
                          mt-1 block text-xs
                          text-muted font-data
                        ">
                          {displayValue(employeeId)}
                        </span>

                      </div>

                    </div>

                  </td>


                  {/* DESIGNATION */}

                  <td className="px-4 py-4">

                    <span className="
                      block font-medium text-ink
                    ">
                      {displayValue(
                        member.designation
                      )}
                    </span>

                    <span className="
                      mt-1 block text-xs text-muted
                    ">
                      {getDepartment(member)}
                    </span>

                  </td>


                  {/* REPORTING TYPE */}

                  <td className="px-4 py-4">

                    <span className="
                      inline-flex whitespace-nowrap
                      rounded-lg border
                      border-accent/20
                      bg-accent/10 px-2.5 py-1
                      text-xs font-medium
                      text-accent
                    ">
                      {getReportingType(member)}
                    </span>

                  </td>


                  {/* STATUS */}

                  <td className="px-4 py-4">

                    {member.statusToday ? (

                      <StatusBadge
                        status={member.statusToday}
                      />

                    ) : (

                      <span className="
                        text-xs text-muted
                      ">
                        Not Specified
                      </span>

                    )}

                  </td>


                  {/* CONTACT */}

                  <td className="px-4 py-4">

                    <div
                      className="
                        max-w-[190px] truncate
                        text-xs text-ink
                      "
                      title={member.email || ''}
                    >
                      {displayValue(member.email)}
                    </div>

                    <div className="
                      mt-1 whitespace-nowrap
                      text-xs text-muted
                    ">
                      {displayValue(member.phone)}
                    </div>

                  </td>


                  {/* JOINING DATE */}

                  <td className="
                    whitespace-nowrap
                    px-4 py-4 text-xs text-muted
                  ">
                    {member.joined
                      ? formatDate(member.joined)
                      : '—'}
                  </td>


                  {/* PERFORMANCE */}

                  <td className="
                    px-4 py-4 text-center
                    font-bold text-accent
                    tabular-nums
                  ">
                    {getScore(member) ?? '—'}
                  </td>


                  {/* PROFILE */}

                  <td className="px-4 py-4 text-right">

                    <button
                      type="button"
                      onClick={() =>
                        onViewProfile(member)
                      }
                      className="
                        inline-flex h-9 items-center
                        justify-center gap-1.5
                        whitespace-nowrap
                        rounded-lg border
                        border-line bg-surface2
                        px-3 text-xs font-semibold
                        text-ink transition
                        hover:border-accent
                        hover:text-accent
                      "
                    >

                      <Eye className="
                        h-3.5 w-3.5 text-accent
                      " />

                      View Profile

                    </button>

                  </td>

                </tr>

              );
            })}

          </tbody>

        </table>

      </div>

    </section>

  );
};


// ============================================================
// MAIN MY TEAM COMPONENT
// ============================================================

export const MyTeam = () => {

  const {
    teamMembers,
    currentUser,
    globalSearchTerm
  } = useTeamLead();


  const members = useMemo(
    () => Array.isArray(teamMembers)
      ? teamMembers.filter(Boolean)
      : [],
    [teamMembers]
  );


  const [viewMode, setViewMode] =
    useState('grid');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [departmentFilter, setDepartmentFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('name-asc');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedMemberId, setSelectedMemberId] =
    useState(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);


  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const departments = useMemo(() => {

    return [...new Set(
      members.map(getDepartment)
    )].sort((first, second) =>
      first.localeCompare(second)
    );

  }, [members]);


  const statuses = useMemo(() => {

    return [...new Set(
      members
        .map(member => member.statusToday)
        .filter(Boolean)
        .map(String)
    )].sort((first, second) =>
      first.localeCompare(second)
    );

  }, [members]);


  const effectiveSearch = normalize(
    searchTerm || globalSearchTerm || ''
  );


  // ==========================================================
  // SEARCH, FILTER AND SORT
  // ==========================================================

  const filteredMembers = useMemo(() => {

    const result = members.filter(member => {

      const searchableText = normalize([
        getMemberName(member),
        getMemberId(member),
        member.designation,
        getDepartment(member),
        member.email,
        member.phone,
        ...getSkills(member)
      ].filter(Boolean).join(' '));

      const matchesSearch =
        !effectiveSearch ||
        searchableText.includes(effectiveSearch);

      const matchesDepartment =
        departmentFilter === 'all' ||
        getDepartment(member) === departmentFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        String(member.statusToday || '') === statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );

    });


    result.sort((first, second) => {

      const firstName = getMemberName(first);
      const secondName = getMemberName(second);

      if (sortBy === 'name-asc') {
        return firstName.localeCompare(secondName);
      }

      if (sortBy === 'name-desc') {
        return secondName.localeCompare(firstName);
      }

      if (sortBy === 'score-desc') {

        const firstScore = getScore(first);
        const secondScore = getScore(second);

        if (
          firstScore === null &&
          secondScore === null
        ) {
          return firstName.localeCompare(secondName);
        }

        if (firstScore === null) return 1;
        if (secondScore === null) return -1;

        return (
          secondScore - firstScore ||
          firstName.localeCompare(secondName)
        );

      }

      if (sortBy === 'joined-desc') {

        const firstDate = getJoinedTime(first);
        const secondDate = getJoinedTime(second);

        if (firstDate === secondDate) {
          return firstName.localeCompare(secondName);
        }

        return secondDate > firstDate ? 1 : -1;

      }

      return 0;

    });

    return result;

  }, [
    members,
    effectiveSearch,
    departmentFilter,
    statusFilter,
    sortBy
  ]);


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredMembers.length / PAGE_SIZE
    )
  );

  const activePage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedMembers = useMemo(() => {

    const start =
      (activePage - 1) * PAGE_SIZE;

    return filteredMembers.slice(
      start,
      start + PAGE_SIZE
    );

  }, [
    filteredMembers,
    activePage
  ]);


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {

    setSearchTerm('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setSortBy('name-asc');
    setCurrentPage(1);

  };


  // ==========================================================
  // EMPLOYEE PROFILE
  // ==========================================================

  const selectedMember = members.find(
    member =>
      getMemberId(member) === selectedMemberId
  ) || null;


  const openProfile = member => {

    setSelectedMemberId(
      getMemberId(member)
    );

    setIsModalOpen(true);

  };


  const closeProfile = () => {

    setIsModalOpen(false);
    setSelectedMemberId(null);

  };


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="space-y-4">

      {/* DIRECT REPORTING TEAM */}

      <section className="
        glass-card !p-4
        !flex !flex-row !flex-wrap
        !items-center !justify-between
        !gap-3
      ">

        <div className="
          flex min-w-0 flex-1
          items-center gap-3
        ">

          <div className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl border
            border-accent/20
            bg-accent/10
          ">

            <Users className="
              h-5 w-5 text-accent
            " />

          </div>

          <div className="min-w-0">

            <h2 className="
              text-sm font-semibold
              text-ink
            ">
              Direct Reporting Team
            </h2>

            <p className="
              mt-1 text-xs text-muted
              break-words
            ">
              Reporting to{' '}
              {currentUser?.name ||
                'the signed-in Team Lead'}
            </p>

          </div>

        </div>


        <div className="
          flex shrink-0 items-center
          gap-3 rounded-xl
          border border-line
          bg-surface2/50 px-4 py-2
        ">

          <div className="
            text-2xl font-bold
            text-accent tabular-nums
          ">
            {members.length}
          </div>

          <div className="
            text-xs font-medium
            leading-relaxed text-muted
          ">
            Engineers &amp; Specialists
          </div>

        </div>

      </section>


      {/* SEARCH AND FILTER TOOLBAR */}

      <section className="
        glass-card !p-4
        !flex !flex-col
        !items-stretch !gap-3
      ">

        <div className="
          grid grid-cols-1
          items-end gap-3
          sm:grid-cols-2
          xl:grid-cols-3
          2xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto]
        ">

          {/* SEARCH */}

          <label className="
            min-w-0 space-y-2
            sm:col-span-2
            xl:col-span-1
          ">

            <span className={LABEL_CLASS}>
              Search Employees
            </span>

            <div className="relative">

              <Search className="
                pointer-events-none absolute
                left-3 top-1/2 h-4 w-4
                -translate-y-1/2
                text-muted
              " />

              <input
                type="search"
                value={searchTerm}
                placeholder="Name, ID, role or skill"
                onChange={event => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className={`
                  ${CONTROL_CLASS}
                  pl-9 pr-3
                  placeholder:text-muted
                `}
              />

            </div>

          </label>


          {/* DEPARTMENT FILTER */}

          <FilterSelect
            label="Department"
            value={departmentFilter}
            onChange={event => {
              setDepartmentFilter(event.target.value);
              setCurrentPage(1);
            }}
          >

            <option value="all">
              All Departments
            </option>

            {departments.map(department => (

              <option
                key={department}
                value={department}
              >
                {department}
              </option>

            ))}

          </FilterSelect>


          {/* STATUS FILTER */}

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
          >

            <option value="all">
              All Statuses
            </option>

            {statuses.map(status => (

              <option
                key={status}
                value={status}
              >
                {status}
              </option>

            ))}

          </FilterSelect>


          {/* SORT */}

          <FilterSelect
            label="Sort By"
            value={sortBy}
            onChange={event => {
              setSortBy(event.target.value);
              setCurrentPage(1);
            }}
          >

            <option value="name-asc">
              Name (A-Z)
            </option>

            <option value="name-desc">
              Name (Z-A)
            </option>

            <option value="score-desc">
              Highest Performance
            </option>

            <option value="joined-desc">
              Newest Joining Date
            </option>

          </FilterSelect>


          {/* VIEW MODE AND RESET */}

          <div className="
            flex min-w-0 items-end
            gap-2 sm:justify-end
            xl:col-span-2
            2xl:col-span-1
          ">

            <div className="space-y-2">

              <span className={LABEL_CLASS}>
                View
              </span>

              <div className="
                inline-flex h-11
                items-center gap-1
                rounded-xl border
                border-line bg-surface2
                p-1
              ">

                <button
                  type="button"
                  title="Grid View"
                  aria-label="Grid View"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={`
                    flex h-8 w-9 items-center
                    justify-center rounded-lg
                    transition
                    ${viewMode === 'grid'
                      ? 'bg-accent text-on-accent'
                      : 'text-muted hover:text-ink'}
                  `}
                >

                  <LayoutGrid className="
                    h-4 w-4
                  " />

                </button>


                <button
                  type="button"
                  title="List View"
                  aria-label="List View"
                  aria-pressed={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  className={`
                    flex h-8 w-9 items-center
                    justify-center rounded-lg
                    transition
                    ${viewMode === 'table'
                      ? 'bg-accent text-on-accent'
                      : 'text-muted hover:text-ink'}
                  `}
                >

                  <List className="
                    h-4 w-4
                  " />

                </button>

              </div>

            </div>


            <button
              type="button"
              title="Reset Filters"
              aria-label="Reset Filters"
              onClick={resetFilters}
              className="
                inline-flex h-11 w-11
                shrink-0 items-center
                justify-center rounded-xl
                border border-line
                bg-surface2 text-muted
                transition hover:border-accent
                hover:text-accent
              "
            >

              <RotateCcw className="h-4 w-4" />

            </button>

          </div>

        </div>

      </section>


      {/* RESULTS SUMMARY */}

      <div className="
        flex flex-wrap items-center
        justify-between gap-2 px-1
      ">

        <h2 className="
          text-sm font-semibold
          text-ink
        ">
          Team Members
        </h2>

        <span className="
          text-xs text-muted
          tabular-nums
        ">
          Showing {filteredMembers.length} of{' '}
          {members.length} employees
        </span>

      </div>


      {/* EMPTY STATE */}

      {!filteredMembers.length && (

        <section className="
          glass-card !p-10
          !flex !flex-col
          !items-center !gap-3
          text-center
        ">

          <div className="
            flex h-14 w-14
            items-center justify-center
            rounded-2xl border
            border-line bg-surface2
          ">

            <Users className="
              h-6 w-6 text-muted
            " />

          </div>

          <h3 className="
            text-sm font-semibold
            text-ink
          ">
            {members.length
              ? 'No matching employees'
              : 'No team members assigned'}
          </h3>

          <p className="
            text-xs text-muted
          ">
            {members.length
              ? 'Try a different search or filter.'
              : 'Assigned team members will appear here.'}
          </p>

          {!!members.length && (

            <button
              type="button"
              onClick={resetFilters}
              className="
                mt-1 rounded-xl
                border border-accent/30
                bg-accent/10 px-4 py-2
                text-xs font-semibold
                text-accent hover:bg-accent/20
              "
            >
              Reset Filters
            </button>

          )}

        </section>

      )}


      {/* GRID VIEW */}

      {viewMode === 'grid' &&
        filteredMembers.length > 0 && (

          <div className="
            grid auto-rows-fr
            grid-cols-1 items-stretch
            gap-4 md:grid-cols-2
            2xl:grid-cols-3
          ">

            {paginatedMembers.map(member => (

              <EmployeeCard
                key={getMemberId(member)}
                member={member}
                onViewProfile={openProfile}
              />

            ))}

          </div>

      )}


      {/* TABLE VIEW */}

      {viewMode === 'table' &&
        filteredMembers.length > 0 && (

          <EmployeeTable
            members={paginatedMembers}
            onViewProfile={openProfile}
          />

      )}


      {/* PAGINATION */}

      <div className="glass-card !p-3">

        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          totalItems={filteredMembers.length}
          pageSize={PAGE_SIZE}
          onPageChange={page => {
            setCurrentPage(
              Math.min(
                totalPages,
                Math.max(1, Number(page) || 1)
              )
            );
          }}
        />

      </div>


      {/* EMPLOYEE PROFILE MODAL */}

      {isModalOpen && selectedMember && (

        <EmployeeDetailsModal
          isOpen={true}
          employee={selectedMember}
          onClose={closeProfile}
          readOnly
        />

      )}

    </div>

  );
};