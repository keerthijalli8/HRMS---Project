// ============================================================
// ROLE-BASED DATA ACCESS CONTROL
// ============================================================

const normalized = value =>
  String(value ?? '').trim().toLowerCase();

const normalizeId = value =>
  String(value ?? '').trim().toLowerCase();

const sameId = (first, second) =>
  Boolean(normalizeId(first)) &&
  normalizeId(first) === normalizeId(second);

const safeArray = value =>
  Array.isArray(value) ? value : [];

const normalizeRole = value =>
  normalized(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');


// ============================================================
// USER AND EMPLOYEE IDENTIFICATION
// ============================================================

export const userIdOf = user =>
  user?.employeeId ||
  user?.userId ||
  user?.id ||
  null;

const memberIdOf = member =>
  member?.id ||
  member?.employeeId ||
  member?.userId ||
  null;

const identityIds = user =>
  [
    ...new Set(
      [
        user?.id,
        user?.employeeId,
        user?.userId
      ]
        .map(normalizeId)
        .filter(Boolean)
    )
  ];

const matchesIdentity = (user, targetId) =>
  Boolean(normalizeId(targetId)) &&
  identityIds(user).includes(
    normalizeId(targetId)
  );

const samePerson = (first, second) =>
  identityIds(first).some(
    id => identityIds(second).includes(id)
  );


// ============================================================
// ROLE IDENTIFICATION
// ============================================================

export const getUserRole = user => {
  if (!user || !userIdOf(user)) {
    return 'unauthorized';
  }

  const classifyRole = value => {
    const role = normalizeRole(value);

    if (
      ['super admin', 'superadmin'].includes(role)
    ) {
      return 'super-admin';
    }

    if (
      [
        'tl',
        'team lead',
        'teamlead',
        'team lead manager'
      ].includes(role)
    ) {
      return 'team-lead';
    }

    if (
      [
        'manager',
        'department manager',
        'reporting manager',
        'project manager'
      ].includes(role)
    ) {
      return 'manager';
    }

    if (
      [
        'employee',
        'staff',
        'team member',
        'associate'
      ].includes(role)
    ) {
      return 'employee';
    }

    return 'unauthorized';
  };

  const systemRole =
    classifyRole(user.systemRole);

  if (systemRole !== 'unauthorized') {
    return systemRole;
  }

  return classifyRole(user.role);
};

export const isSuperAdminUser = user =>
  getUserRole(user) === 'super-admin';

export const isTeamLeadUser = user =>
  getUserRole(user) === 'team-lead';

export const isManagerUser = user =>
  getUserRole(user) === 'manager';

export const isEmployeeUser = user =>
  getUserRole(user) === 'employee';


// ============================================================
// HR LEAVE REVIEW PERMISSION
// ============================================================

export const isHRUser = user => {
  if (!userIdOf(user)) {
    return false;
  }

  const role = normalizeRole(
    user.systemRole || user.role
  );

  return [
    'hr',
    'hr manager',
    'human resources',
    'human resources manager'
  ].includes(role);
};

export const canReviewHRLeave = user =>
  isSuperAdminUser(user) ||
  isHRUser(user);


// ============================================================
// REPORTING MANAGER NAME MATCHING
// ============================================================

const managerNamesMatch = (
  managerName,
  userName
) => {
  const getParts = value =>
    normalized(value)
      .replace(/\./g, '')
      .split(/\s+/)
      .filter(Boolean);

  const managerParts =
    getParts(managerName);

  const userParts =
    getParts(userName);

  if (
    !managerParts.length ||
    !userParts.length
  ) {
    return false;
  }

  if (
    managerParts.join(' ') ===
    userParts.join(' ')
  ) {
    return true;
  }

  const shorter =
    managerParts.length <= userParts.length
      ? managerParts
      : userParts;

  const longer =
    managerParts.length > userParts.length
      ? managerParts
      : userParts;

  if (
    shorter.length !== 2 ||
    longer.length < 3
  ) {
    return false;
  }

  const middleParts =
    longer.slice(1, -1);

  return (
    shorter[0] === longer[0] &&
    shorter[1] === longer[longer.length - 1] &&
    middleParts.every(
      part => part.length === 1
    )
  );
};


// ============================================================
// DIRECT REPORTING ACCESS
// ============================================================

const isDirectTeamMember = (
  user,
  member
) => {
  if (!user || !member) {
    return false;
  }

  if (
    !userIdOf(user) ||
    !memberIdOf(member)
  ) {
    return false;
  }

  // A user is not their own direct report.

  if (samePerson(user, member)) {
    return false;
  }

  const relation =
    normalized(member.relation);

  if (
    relation &&
    relation !== 'direct'
  ) {
    return false;
  }

  const reportingIds = [
    member.managerId,
    member.teamLeadId,
    member.reportingManagerId
  ].filter(Boolean);

  // Explicit reporting IDs take precedence.

  if (reportingIds.length > 0) {
    return reportingIds.some(
      reportingId =>
        matchesIdentity(
          user,
          reportingId
        )
    );
  }

  // Legacy mock records may contain
  // reporting manager names only.

  return Boolean(
    member.reportingManager &&
    user.name &&
    managerNamesMatch(
      member.reportingManager,
      user.name
    )
  );
};


// ============================================================
// MANAGER ASSIGNED TEAM ACCESS
// ============================================================

const getAssignedTeamLeadIds = user => {
  const assignedIds = [
    ...safeArray(
      user?.assignedTeamLeadIds
    ),

    ...safeArray(
      user?.managedTeamLeadIds
    ),

    ...safeArray(
      user?.teamLeadIds
    )
  ];

  return new Set(
    assignedIds
      .map(normalizeId)
      .filter(Boolean)
  );
};

const getManagerTeamMembers = (
  user,
  members
) => {
  const assignedTeamLeadIds =
    getAssignedTeamLeadIds(user);

  members.forEach(member => {
    if (
      isTeamLeadUser(member) &&
      isDirectTeamMember(user, member)
    ) {
      identityIds(member).forEach(id =>
        assignedTeamLeadIds.add(id)
      );
    }
  });

  return members.filter(member => {
    if (
      !member ||
      samePerson(user, member)
    ) {
      return false;
    }

    if (
      isDirectTeamMember(user, member)
    ) {
      return true;
    }

    if (
      matchesIdentity(
        user,
        member.departmentManagerId
      ) ||
      matchesIdentity(
        user,
        member.managerId
      )
    ) {
      return true;
    }

    const reportingIds = [
      member.teamLeadId,
      member.managerId,
      member.reportingManagerId
    ];

    return reportingIds.some(id =>
      assignedTeamLeadIds.has(
        normalizeId(id)
      )
    );
  });
};


// ============================================================
// SCOPED TEAM MEMBERS
// ============================================================

export const getScopedTeamMembers = (
  user,
  members = []
) => {
  const validMembers =
    safeArray(members).filter(
      member =>
        member &&
        memberIdOf(member)
    );

  const role = getUserRole(user);

  const id = userIdOf(user);

  if (
    !id ||
    role === 'unauthorized'
  ) {
    return [];
  }

  switch (role) {
    case 'super-admin':
      return validMembers;

    case 'team-lead':
      return validMembers.filter(
        member =>
          isDirectTeamMember(
            user,
            member
          )
      );

    case 'manager':
      return getManagerTeamMembers(
        user,
        validMembers
      );

    case 'employee':
      return validMembers.filter(
        member =>
          samePerson(
            user,
            member
          )
      );

    default:
      return [];
  }
};


// ============================================================
// SCOPED EMPLOYEE IDS
// ============================================================

export const getScopedTeamMemberIds = (
  user,
  members = []
) => {
  const scopedMembers =
    getScopedTeamMembers(
      user,
      members
    );

  return new Set(
    scopedMembers
      .flatMap(member => [
        member.id,
        member.employeeId,
        member.userId
      ])
      .filter(
        value =>
          normalizeId(value)
      )
      .map(String)
  );
};

export const getScopedEmployeeIds = (
  user,
  members = []
) => {
  if (
    getUserRole(user) === 'unauthorized'
  ) {
    return new Set();
  }

  const ids =
    getScopedTeamMemberIds(
      user,
      members
    );

  [
    user?.id,
    user?.employeeId,
    user?.userId
  ]
    .filter(
      id => normalizeId(id)
    )
    .forEach(
      id => ids.add(String(id))
    );

  return ids;
};

const containsId = (ids, targetId) => {
  if (!normalizeId(targetId)) {
    return false;
  }

  return Array.from(ids).some(
    id => sameId(id, targetId)
  );
};


// ============================================================
// EMPLOYEE PROFILE ACCESS
// ============================================================

export const canAccessEmployee = (
  user,
  member,
  members = []
) => {
  if (!user || !member) {
    return false;
  }

  const role =
    getUserRole(user);

  if (
    !memberIdOf(member) ||
    role === 'unauthorized'
  ) {
    return false;
  }

  if (role === 'super-admin') {
    return true;
  }

  if (samePerson(user, member)) {
    return true;
  }

  if (role === 'employee') {
    return false;
  }

  const scopedIds =
    getScopedTeamMemberIds(
      user,
      members
    );

  return identityIds(member).some(
    id => containsId(scopedIds, id)
  );
};


// ============================================================
// APPROVAL REQUEST ACCESS
// ============================================================

export const getScopedApprovals = (
  user,
  approvals = [],
  members = []
) => {
  const records =
    safeArray(approvals).filter(Boolean);

  const role = getUserRole(user);

  if (role === 'unauthorized') {
    return [];
  }

  if (role === 'super-admin') {
    return records;
  }

  const getRequestEmployeeId = item =>
    item.employeeId ||
    item.employee?.id ||
    item.employee?.employeeId;

  if (role === 'employee') {
    return records.filter(item =>
      matchesIdentity(
        user,
        getRequestEmployeeId(item)
      )
    );
  }

  const ids =
    getScopedTeamMemberIds(
      user,
      members
    );

  return records.filter(item =>
    containsId(
      ids,
      getRequestEmployeeId(item)
    )
  );
};


// ============================================================
// TASK ACCESS
// ============================================================

export const getScopedTasks = (
  user,
  tasks = [],
  members = []
) => {
  const records =
    safeArray(tasks).filter(Boolean);

  const role =
    getUserRole(user);

  if (role === 'unauthorized') {
    return [];
  }

  if (role === 'super-admin') {
    return records;
  }

  const scopedIds =
    getScopedEmployeeIds(
      user,
      members
    );

  return records.filter(task => {
    const assigneeId =
      task.assigneeId ||
      task.employeeId ||
      task.assignee?.id ||
      task.assignee?.employeeId;

    return containsId(
      scopedIds,
      assigneeId
    );
  });
};


// ============================================================
// PROJECT ACCESS
// ============================================================

export const canAccessProject = (
  user,
  project,
  members = []
) => {
  if (!user || !project) {
    return false;
  }

  const role =
    getUserRole(user);

  const id =
    userIdOf(user);

  if (
    !id ||
    role === 'unauthorized'
  ) {
    return false;
  }

  if (role === 'super-admin') {
    return true;
  }

  const owners = [
    project.ownerId,
    project.teamLeadId,
    project.createdById
  ].filter(Boolean);

  const projectMembers =
    safeArray(project.memberIds);

  if (role === 'employee') {
    return projectMembers.some(
      memberId =>
        matchesIdentity(
          user,
          memberId
        )
    );
  }

  const isOwner = owners.some(
    ownerId =>
      matchesIdentity(
        user,
        ownerId
      )
  );

  if (isOwner) {
    return true;
  }

  const scopedIds =
    getScopedEmployeeIds(
      user,
      members
    );

  const hasScopedMembers =
    projectMembers.some(
      memberId =>
        containsId(
          scopedIds,
          memberId
        )
    );

  if (role === 'manager') {
    const assignedTeamLeadIds =
      getAssignedTeamLeadIds(user);

    const belongsToAssignedTeam =
      owners.some(ownerId =>
        assignedTeamLeadIds.has(
          normalizeId(ownerId)
        ) ||
        containsId(
          scopedIds,
          ownerId
        )
      );

    return (
      belongsToAssignedTeam ||
      hasScopedMembers
    );
  }

  if (role === 'team-lead') {
    return hasScopedMembers;
  }

  return false;
};


// ============================================================
// ACTION PERMISSIONS
// ============================================================

export const canManageTeam = user => {
  const role =
    getUserRole(user);

  return [
    'super-admin',
    'manager',
    'team-lead'
  ].includes(role);
};

export const canManageApprovals = user =>
  canManageTeam(user);

export const canAssignTasks = user =>
  canManageTeam(user);

export const canManageProjects = user =>
  canManageTeam(user);

export const canReviewPerformance = user =>
  canManageTeam(user);


// ============================================================
// INDIVIDUAL APPROVAL PERMISSION
// ============================================================

export const canReviewApproval = (
  user,
  approval,
  members = []
) => {
  if (
    !approval ||
    !canManageApprovals(user)
  ) {
    return false;
  }

  const employeeId =
    approval.employeeId ||
    approval.employee?.id ||
    approval.employee?.employeeId;

  if (
    !employeeId ||
    matchesIdentity(
      user,
      employeeId
    )
  ) {
    return false;
  }

  return getScopedApprovals(
    user,
    [approval],
    members
  ).length > 0;
};