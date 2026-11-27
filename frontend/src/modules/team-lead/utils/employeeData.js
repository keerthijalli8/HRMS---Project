import * as SyncReact from 'react';
// ============================================================
// EMPLOYEE DATA UTILITIES
// ============================================================


// ============================================================
// ID NORMALIZATION
// ============================================================

const normalizeId = value =>
  String(value ?? '').trim().toLowerCase();


// ============================================================
// GET EMPLOYEE ID
// ============================================================

export const getEmployeeId = user =>
  String(
    user?.employeeId ||
    user?.userId ||
    user?.id ||
    ''
  ).trim();


// ============================================================
// GET ALL EMPLOYEE IDENTIFIERS
// ============================================================

export const getEmployeeIds = user => {

  if (!user || typeof user !== 'object') {
    return [];
  }

  return [
    ...new Set(
      [
        user.employeeId,
        user.userId,
        user.id
      ]
        .map(normalizeId)
        .filter(Boolean)
    )
  ];

};


// ============================================================
// EMPLOYEE IDENTITY MATCHING
// ============================================================

export const matchesEmployeeIdentity = (
  firstEmployee,
  secondEmployee
) => {

  const firstIds =
    getEmployeeIds(firstEmployee);

  const secondIds =
    getEmployeeIds(secondEmployee);

  if (
    !firstIds.length ||
    !secondIds.length
  ) {
    return false;
  }

  return firstIds.some(
    id => secondIds.includes(id)
  );

};


// ============================================================
// GET PERSONAL EMPLOYEE PROFILE
// ============================================================

export const getEmployeeProfile = (
  currentUser,
  teamMembers = []
) => {

  if (
    !currentUser ||
    !getEmployeeId(currentUser)
  ) {
    return {};
  }

  const members = Array.isArray(teamMembers)
    ? teamMembers
    : [];

  const memberProfile = members.find(
    member =>
      matchesEmployeeIdentity(
        currentUser,
        member
      )
  );

  // Only valid session and matching employee
  // records are used. No unrelated mock profile.

  const profile = {
    ...(memberProfile || {}),
    ...currentUser
  };

  const name =
    currentUser.name ||
    currentUser.fullName ||
    memberProfile?.name ||
    memberProfile?.fullName ||
    '';

  const department =
    currentUser.department ||
    currentUser.dept ||
    memberProfile?.department ||
    memberProfile?.dept ||
    '';

  const designation =
    currentUser.designation ||
    memberProfile?.designation ||
    currentUser.role ||
    '';

  const profileEditId = getEmployeeId(currentUser);

  const savedProfile =
    readEmployeeProfileEdits(profileEditId);

  return {
    ...profile,
    profileEditId,

    employeeId:
      currentUser.employeeId ||
      memberProfile?.employeeId ||
      getEmployeeId(currentUser),

    name,

    fullName:
      currentUser.fullName ||
      name,

    department,

    dept: department,

    designation,


    // EMPLOYEE_DEMO_PROFILE_V1
    // Preserve actual employee information.
    // Missing values are clearly labelled demo information.

    gender:
      profile.gender ||
      'Not specified (Demo)',

    maritalStatus:
      profile.maritalStatus ||
      'Single (Demo)',

    dateOfBirth:
      profile.dateOfBirth ||
      profile.dob ||
      '2000-01-01',

    dob:
      profile.dob ||
      profile.dateOfBirth ||
      '2000-01-01',

    bloodGroup:
      profile.bloodGroup ||
      'O+ (Demo)',

    nationality:
      profile.nationality ||
      'Indian (Demo)',

    personalEmail:
      profile.personalEmail ||
      `${getEmployeeId(currentUser).toLowerCase()}@example.com`,

    mobileNumber:
      profile.mobileNumber ||
      profile.phone ||
      '0000000000 (Demo)',

    alternatePhone:
      profile.alternatePhone ||
      '0000000000 (Demo)',

    currentAddress:
      profile.currentAddress ||
      profile.address ||
      'Sample Residential Address, Hyderabad (Demo)',

    permanentAddress:
      profile.permanentAddress ||
      'Sample Permanent Address, India (Demo)',

    emergencyContact:
      profile.emergencyContact ||
      'Sample Contact - 0000000000 (Demo)',

    demoDateOfBirth:
      !profile.dateOfBirth && !profile.dob,

    email:
      currentUser.email ||
      memberProfile?.email ||
      '',

    workEmail:
      currentUser.workEmail ||
      memberProfile?.workEmail ||
      currentUser.email ||
      memberProfile?.email ||
      '',

    phone:
      currentUser.phone ||
      currentUser.mobileNumber ||
      memberProfile?.phone ||
      memberProfile?.mobileNumber ||
      '',

    avatarUrl:
      currentUser.avatarUrl ||
      currentUser.photoUrl ||
      memberProfile?.avatarUrl ||
      memberProfile?.photoUrl ||
      '',

    // Prefer the latest roster leave balances.

    leaveBalance: {
      ...(currentUser.leaveBalance || {}),
      ...(memberProfile?.leaveBalance || {})
    },

    documents:
      currentUser.documents ??
      currentUser.employeeDocuments ??
      memberProfile?.documents ??
      memberProfile?.employeeDocuments ??
      [],

    okrs:
      currentUser.okrs ??
      memberProfile?.okrs ??
      [],

    ...savedProfile,

    ...(
      Object.prototype.hasOwnProperty.call(
        savedProfile, 'dateOfBirth'
      )
        ? {
            dob: savedProfile.dateOfBirth,
            demoDateOfBirth:
              !profile.dateOfBirth &&
              !profile.dob &&
              savedProfile.dateOfBirth === '2000-01-01'
          }
        : {}
    ),

    ...(
      Object.prototype.hasOwnProperty.call(
        savedProfile, 'avatarUrl'
      )
        ? { photoUrl: savedProfile.avatarUrl }
        : {}
    )

  };

};


// ============================================================
// FILTER PERSONAL LEAVE REQUESTS
// ============================================================

export const filterOwnLeaveRequests = (
  requests = [],
  currentUser
) => {

  const employeeIds =
    getEmployeeIds(currentUser);

  if (
    !employeeIds.length ||
    !Array.isArray(requests)
  ) {
    return [];
  }

  return requests.filter(request => {

    if (
      !request ||
      typeof request !== 'object'
    ) {
      return false;
    }

    const requestEmployeeId =
      normalizeId(request.employeeId);

    if (!requestEmployeeId) {
      return false;
    }

    return employeeIds.includes(
      requestEmployeeId
    );

  });

};

// PROFILE_SYNC_FINAL_V3

const syncProfileKey = id =>
  `technomold_employee_profile_v2:${encodeURIComponent(
    String(id || '').trim().toLowerCase()
  )}`;

const syncFields = [
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'maritalStatus',
  'nationality',
  'personalEmail',
  'mobileNumber',
  'alternatePhone',
  'currentAddress',
  'permanentAddress',
  'emergencyContact',
  'avatarUrl'
];

export const readEmployeeProfileEdits = id => {
  if (!id) return {};

  try {
    const data = JSON.parse(
      localStorage.getItem(syncProfileKey(id)) || '{}'
    );

    if (!data || typeof data !== 'object') {
      return {};
    }

    return Object.fromEntries(
      syncFields
        .filter(key => typeof data[key] === 'string')
        .map(key => [key, data[key]])
    );

  } catch {
    return {};
  }
};

export const saveEmployeeProfileEdits = (id, updates) => {
  if (!id) {
    throw new Error('Employee identity unavailable.');
  }

  const next = readEmployeeProfileEdits(id);

  syncFields.forEach(key => {
    if (typeof updates[key] === 'string') {
      next[key] = updates[key];
    } else if (
      key === 'avatarUrl' &&
      updates[key] === null
    ) {
      next[key] = '';
    }
  });

  localStorage.setItem(
    syncProfileKey(id),
    JSON.stringify(next)
  );

  window.dispatchEvent(
    new CustomEvent('technomold:profile-sync', {
      detail: syncProfileKey(id)
    })
  );

  return next;
};

export const useSyncedEmployeeAvatar = user => {
  const id = getEmployeeId(user);

  const [, refresh] = SyncReact.useState(0);

  SyncReact.useEffect(() => {
    if (!id) return undefined;

    const update = event => {
      if (
        event.type === 'storage' &&
        event.key !== null &&
        event.key !== syncProfileKey(id)
      ) return;

      if (
        event.type === 'technomold:profile-sync' &&
        event.detail !== syncProfileKey(id)
      ) return;

      refresh(value => value + 1);
    };

    window.addEventListener(
      'technomold:profile-sync', update
    );

    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener(
        'technomold:profile-sync', update
      );

      window.removeEventListener('storage', update);
    };
  }, [id]);

  const saved = readEmployeeProfileEdits(id);

  if (
    Object.prototype.hasOwnProperty.call(saved, 'avatarUrl')
  ) {
    return saved.avatarUrl || null;
  }

  return user?.avatarUrl || user?.photoUrl || null;
};
