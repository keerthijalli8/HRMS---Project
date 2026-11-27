import {
  useSyncedEmployeeAvatar,
  saveEmployeeProfileEdits,
  getEmployeeId as getSyncEmployeeId
} from '../../utils/employeeData.js';


import React, {
  useState,
  useRef,
  useEffect
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';

import {
  getUserRole,
  userIdOf
} from '../../utils/dataScope.js';

import {
  User,
  Briefcase,
  Bell,
  Palette,
  Save,
  CheckCircle,
  Camera,
  Trash2,
  RotateCcw,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Info
} from 'lucide-react';


// ============================================================
// CONFIGURATION
// ============================================================

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const SETTINGS_STORAGE_PREFIX =
  'technomold_user_settings_v1';

// IN_APP_NOTIFICATION_PREFERENCES_V1

const DEFAULT_NOTIFICATIONS = {
  inAppEnabled: true,
  inAppAnnouncements: true,
  inAppLeave: true,
  inAppTasks: true,
  inAppAttendance: true,
  inAppProjects: true,
  inAppPerformance: true,
  inAppWork: true,
  emailOnLeave: true,
  emailOnRegularization: true,
  slackTaskUpdates: true,
  weeklyDigest: true,
  urgentSmsAlerts: false
};

const NOTIFICATION_OPTIONS = [
  {
    key: 'inAppEnabled',
    label: 'Enable In-App Notifications',
    desc: 'Show notifications in the portal and notification bell.'
  },
  {
    key: 'inAppAnnouncements',
    label: 'Company Announcements',
    desc: 'Company news and department announcements.'
  },
  {
    key: 'inAppLeave',
    label: 'Leave & Approval Alerts',
    desc: 'Leave applications and leave approval decisions.'
  },
  {
    key: 'inAppTasks',
    label: 'Task Notifications',
    desc: 'Task assignments and task status updates.'
  },
  {
    key: 'inAppAttendance',
    label: 'Attendance Alerts',
    desc: 'Attendance and regularization notifications.'
  },
  {
    key: 'inAppProjects',
    label: 'Project Notifications',
    desc: 'Project status, deadlines and milestone updates.'
  },
  {
    key: 'inAppPerformance',
    label: 'Performance Notifications',
    desc: 'Performance reviews, feedback and goal updates.'
  },
  {
    key: 'inAppWork',
    label: 'Work Updates',
    desc: 'General work-related notifications.'
  },
  {
    key: 'emailOnLeave',
    label: 'Email Alerts on Leave Applications',
    desc: 'Preference for email alerts when employees request leave.'
  },
  {
    key: 'emailOnRegularization',
    label: 'Attendance Regularization Notifications',
    desc: 'Preference for attendance regularization alerts.'
  },
  {
    key: 'slackTaskUpdates',
    label: 'Slack & Teams Sprint Milestone Alerts',
    desc: 'Preference for task transitions, milestones and blocker alerts.'
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly Team Health Digest',
    desc: 'Preference for weekly attendance and team performance summaries.'
  },
  {
    key: 'urgentSmsAlerts',
    label: 'Critical SMS Alerts',
    desc: 'Preference for emergency escalation alerts.'
  }
];

const MENU_ITEMS = [
  {
    id: 'profile',
    label: 'My Profile & Personal',
    icon: User
  },
  {
    id: 'professional',
    label: 'Professional Information',
    icon: Briefcase
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  },
  {
    id: 'appearance',
    label: 'Appearance & Density',
    icon: Palette
  }
];

const INPUT_CLASS =
  'w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent disabled:opacity-50';

const READ_ONLY_CLASS =
  'w-full bg-surface2/40 border border-line/40 rounded-xl p-2.5 text-xs text-muted cursor-not-allowed';

const BUTTON_CLASS =
  'rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';


// ============================================================
// HELPERS
// ============================================================

const cleanText = value =>
  String(value ?? '').trim();

const normalizeId = value =>
  cleanText(value).toLowerCase();

const getSettingsKey = userId =>
  `${SETTINGS_STORAGE_PREFIX}:${encodeURIComponent(
    normalizeId(userId)
  )}`;

const readUserSettings = userId => {

  if (!userId) return {};

  try {

    const value = window.localStorage.getItem(
      getSettingsKey(userId)
    );

    const data = value
      ? JSON.parse(value)
      : {};

    return data &&
      typeof data === 'object' &&
      !Array.isArray(data)
        ? data
        : {};

  } catch {

    return {};
  }
};

const writeUserSettings = (userId, updates) => {

  if (!userId) {
    throw new Error(
      'User identity is unavailable.'
    );
  }

  const updated = {
    ...readUserSettings(userId),
    ...updates,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(
    getSettingsKey(userId),
    JSON.stringify(updated)
  );

  window.dispatchEvent(
    new CustomEvent(
      'technomold:user-settings-updated',
      {
        detail: {
          key: getSettingsKey(userId)
        }
      }
    )
  );

  return updated;
};

const getNotificationSettings = userId => {

  const stored =
    readUserSettings(userId).notifications;

  return Object.fromEntries(

    Object.entries(DEFAULT_NOTIFICATIONS)
      .map(([key, defaultValue]) => [

        key,

        typeof stored?.[key] === 'boolean'
          ? stored[key]
          : defaultValue

      ])
  );
};

const getProfileForm = (user, userId) => {

  const localSettings =
    readUserSettings(userId);

  const nameParts = cleanText(
    user?.name
  ).split(/\s+/).filter(Boolean);

  return {
    firstName:
      user?.firstName ??
      nameParts[0] ??
      '',

    lastName:
      user?.lastName ??
      nameParts.slice(1).join(' '),

    phone:
      user?.phone ?? '',

    email:
      user?.email ?? '',

    location:
      user?.location ?? '',

    emergencyContact:
      localSettings.emergencyContact ??
      user?.emergencyContact ??
      '',

    bio:
      user?.bio ?? ''
  };
};

const getRoleLabel = user => {

  const role = getUserRole(user);

  const labels = {
    'super-admin': 'Super Admin',
    manager: 'Manager',
    'team-lead': 'Team Lead',
    teamlead: 'Team Lead',
    employee: 'Employee'
  };

  return labels[role] ||
    user?.role ||
    'Role unavailable';
};

const displayValue = value => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not available';
  }

  return String(value);
};

const displayDate = value => {

  if (!value) {
    return 'Not available';
  }

  const text = String(value);

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? `${text}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );
};

const formatPhone = value =>
  cleanText(value);

const validPhone = value => {

  const text = cleanText(value);

  if (!text) return true;

  if (!/^\+?[\d\s()-]+$/.test(text)) {
    return false;
  }

  const digits = text.replace(/\D/g, '');

  return digits.length >= 7 &&
    digits.length <= 15;
};

const sameForm = (first, second) =>
  Object.keys(first).every(
    key => first[key] === second[key]
  );


// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const SectionHeading = ({
  title,
  description
}) => (

  <div className="pb-3 border-b border-line/60">

    <h3 className="font-display font-semibold text-base text-ink">
      {title}
    </h3>

    <p className="text-muted text-[11px] mt-1">
      {description}
    </p>

  </div>

);

const ErrorMessage = ({ message }) =>

  message ? (

    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/10 p-3 text-xs text-bad"
    >

      <AlertCircle className="w-4 h-4 shrink-0" />

      <span>{message}</span>

    </div>

  ) : null;

const InfoMessage = ({ children }) => (

  <div className="flex items-start gap-2 rounded-xl border border-line bg-surface2/40 p-3 text-xs text-muted">

    <Info className="w-4 h-4 text-accent shrink-0" />

    <div className="leading-relaxed">
      {children}
    </div>

  </div>

);

const InformationCard = ({
  label,
  value,
  accent = false
}) => (

  <div className="p-3 rounded-xl bg-surface2/60 border border-line/40">

    <span className="text-muted block text-[10.5px]">
      {label}
    </span>

    <span className={`block mt-1 font-bold text-sm break-words ${
      accent ? 'text-accent' : 'text-ink'
    }`}>

      {displayValue(value)}

    </span>

  </div>

);


// ============================================================
// ACCOUNT SETTINGS COMPONENT
// ============================================================

const AccountSettings = ({
  currentUser,
  accountId,
  updateProfile,
  density,
  setDensity,
  triggerToast
}) => {

  const [activeSection, setActiveSection] =
    useState('profile');

  const [profileForm, setProfileForm] =
    useState(() =>
      getProfileForm(currentUser, accountId)
    );

  const [savedProfile, setSavedProfile] =
    useState(() =>
      getProfileForm(currentUser, accountId)
    );

  const synchronizedSettingsAvatar =
    useSyncedEmployeeAvatar(currentUser);

  const [profileImage, setProfileImage] =
    useState(synchronizedSettingsAvatar);

  const [savedImage, setSavedImage] =
    useState(synchronizedSettingsAvatar);

  const [notifications, setNotifications] =
    useState(() =>
      getNotificationSettings(accountId)
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [isReadingImage, setIsReadingImage] =
    useState(false);

  const [profileError, setProfileError] =
    useState('');

  const [imageError, setImageError] =
    useState('');

  const [notificationError, setNotificationError] =
    useState('');

  const [lastSavedAt, setLastSavedAt] =
    useState(() =>
      readUserSettings(accountId).profileSavedAt ||
      null
    );

  const fileInputRef = useRef(null);
  const savingRef = useRef(false);
  const readerRef = useRef(null);
  const mountedRef = useRef(true);

  const isBusy =
    isSaving || isReadingImage;

  const hasUnsavedChanges =
    !sameForm(profileForm, savedProfile) ||
    profileImage !== savedImage;

  const displayName = [

    profileForm.firstName,
    profileForm.lastName

  ].map(cleanText)
    .filter(Boolean)
    .join(' ') ||
    currentUser?.name ||
    'My Profile';

  const roleLabel =
    getRoleLabel(currentUser);


// ============================================================
// COMPONENT LIFECYCLE
// ============================================================

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

      if (
        readerRef.current &&
        readerRef.current.readyState === 1
      ) {
        readerRef.current.abort();
      }

    };

  }, []);

  useEffect(() => {

    const handleStorage = event => {

      if (
        event.key === null ||
        event.key === getSettingsKey(accountId)
      ) {

        setNotifications(
          getNotificationSettings(accountId)
        );

      }

    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {

      window.removeEventListener(
        'storage',
        handleStorage
      );

    };

  }, [accountId]);

  useEffect(() => {

    if (!hasUnsavedChanges && !isBusy) {

      const next = getProfileForm(
        currentUser,
        accountId
      );

      setProfileForm(next);
      setSavedProfile(next);

      setProfileImage(synchronizedSettingsAvatar);

      setSavedImage(synchronizedSettingsAvatar);

    }

  }, [currentUser, accountId, synchronizedSettingsAvatar]);

  useEffect(() => {

    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = event => {

      event.preventDefault();
      event.returnValue = '';

    };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () => {

      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );

    };

  }, [hasUnsavedChanges]);


// ============================================================
// PROFILE FIELD HANDLING
// ============================================================

  const updateField = (field, value) => {

    if (savingRef.current) return;

    setProfileForm(previous => ({
      ...previous,
      [field]: value
    }));

    setProfileError('');

  };

  const resetProfile = () => {

    if (isBusy) return;

    setProfileForm({
      ...savedProfile
    });

    setProfileImage(savedImage);
    setProfileError('');
    setImageError('');

    triggerToast?.(
      'Unsaved profile changes discarded.',
      'info'
    );

  };


// ============================================================
// PROFILE IMAGE UPLOAD
// ============================================================

  const handleImageUpload = event => {

    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file || isBusy) return;

    setImageError('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {

      setImageError(
        'Select a JPG, PNG or WebP image.'
      );

      return;

    }

    if (file.size > MAX_IMAGE_SIZE) {

      setImageError(
        'Profile image must be 2 MB or smaller.'
      );

      return;

    }

    setIsReadingImage(true);

    const reader = new FileReader();

    readerRef.current = reader;

    reader.onload = () => {

      if (!mountedRef.current) return;

      const result = reader.result;

      if (
        typeof result !== 'string' ||
        !result.startsWith('data:image/')
      ) {

        setImageError(
          'Unable to read the selected image.'
        );

        setIsReadingImage(false);

        return;

      }

      const image = new Image();

      image.onload = () => {

        if (!mountedRef.current) return;

        try {

          const maxDimension = 512;

          const scale = Math.min(
            1,
            maxDimension /
              Math.max(
                image.width,
                image.height
              )
          );

          const canvas =
            document.createElement('canvas');

          canvas.width = Math.max(
            1,
            Math.round(image.width * scale)
          );

          canvas.height = Math.max(
            1,
            Math.round(image.height * scale)
          );

          const context =
            canvas.getContext('2d');

          if (!context) {

            throw new Error(
              'Image processing is unavailable.'
            );

          }

          context.fillStyle = '#ffffff';

          context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const optimizedImage =
            canvas.toDataURL(
              'image/jpeg',
              0.85
            );

          setProfileImage(optimizedImage);

          setActiveSection('profile');

          triggerToast?.(
            'Photo selected. Save Changes to apply it.',
            'info'
          );

        } catch (error) {

          setImageError(
            error.message ||
            'Unable to process profile image.'
          );

        } finally {

          setIsReadingImage(false);

        }

      };

      image.onerror = () => {

        if (!mountedRef.current) return;

        setImageError(
          'The selected file is not a valid image.'
        );

        setIsReadingImage(false);

      };

      image.src = result;

    };

    reader.onerror = () => {

      if (!mountedRef.current) return;

      setImageError(
        'Unable to read profile image.'
      );

      setIsReadingImage(false);

    };

    reader.onabort = () => {

      if (mountedRef.current) {

        setIsReadingImage(false);

      }

    };

    reader.readAsDataURL(file);

  };

  const handleRemoveImage = () => {

    if (isBusy) return;

    setProfileImage(null);
    setImageError('');
    setActiveSection('profile');

    triggerToast?.(
      'Photo removed from preview. Save Changes to apply.',
      'info'
    );

  };


// ============================================================
// PROFILE VALIDATION
// ============================================================

  const validateProfile = () => {

    const firstName = cleanText(
      profileForm.firstName
    );

    const lastName = cleanText(
      profileForm.lastName
    );

    if (!firstName) {

      return 'First name is required.';

    }

    if (
      firstName.length > 60 ||
      lastName.length > 60
    ) {

      return 'Names cannot exceed 60 characters.';

    }

    if (!validPhone(profileForm.phone)) {

      return 'Enter a valid mobile number with 7 to 15 digits.';

    }

    if (
      cleanText(profileForm.location).length > 150
    ) {

      return 'Work location cannot exceed 150 characters.';

    }

    if (
      cleanText(
        profileForm.emergencyContact
      ).length > 120
    ) {

      return 'Emergency contact cannot exceed 120 characters.';

    }

    if (
      cleanText(profileForm.bio).length > 500
    ) {

      return 'Professional bio cannot exceed 500 characters.';

    }

    return '';

  };


// ============================================================
// SAVE PROFILE
// ============================================================

  const handleProfileSubmit = async event => {

    event.preventDefault();

    if (
      savingRef.current ||
      isReadingImage ||
      !hasUnsavedChanges
    ) {
      return;
    }

    setProfileError('');

    const validationError =
      validateProfile();

    if (validationError) {

      setProfileError(validationError);

      return;

    }

    savingRef.current = true;

    setIsSaving(true);

    let profileUpdated = false;

    try {

      const nextForm = {

        firstName:
          cleanText(profileForm.firstName),

        lastName:
          cleanText(profileForm.lastName),

        phone:
          formatPhone(profileForm.phone),

        email:
          savedProfile.email,

        location:
          cleanText(profileForm.location),

        emergencyContact:
          cleanText(
            profileForm.emergencyContact
          ),

        bio:
          cleanText(profileForm.bio)

      };

      const payload = {

        firstName: nextForm.firstName,

        lastName: nextForm.lastName,

        name: [
          nextForm.firstName,
          nextForm.lastName
        ].filter(Boolean).join(' '),

        phone: nextForm.phone,

        location: nextForm.location,

        bio: nextForm.bio,

        avatarUrl: profileImage

      };

      const profileChanged =
        profileImage !== savedImage ||
        [
          'firstName',
          'lastName',
          'phone',
          'location',
          'bio'
        ].some(
          key =>
            nextForm[key] !== savedProfile[key]
        );

      if (profileChanged) {

        if (
          typeof updateProfile !== 'function'
        ) {

          throw new Error(
            'Profile update service is unavailable.'
          );

        }

        const result = await updateProfile(payload);

        if (
          result &&
          result.success !== false &&
          profileImage !== savedImage
        ) {
          saveEmployeeProfileEdits(
            getSyncEmployeeId(currentUser),
            { avatarUrl: profileImage }
          );
        }

        if (
          !result ||
          result.success === false
        ) {

          throw new Error(
            result?.message ||
            'Profile update could not be confirmed.'
          );

        }

        profileUpdated = true;

      }

      const timestamp =
        new Date().toISOString();

      writeUserSettings(
        accountId,
        {
          emergencyContact:
            nextForm.emergencyContact,

          profileSavedAt:
            timestamp
        }
      );

      if (!mountedRef.current) return;

      setProfileForm(nextForm);
      setSavedProfile(nextForm);
      setSavedImage(profileImage);
      setLastSavedAt(timestamp);

      triggerToast?.(
        'Profile information saved successfully.',
        'good'
      );

    } catch (error) {

      if (!mountedRef.current) return;

      const message = profileUpdated

        ? 'Profile was updated, but local settings could not be saved. Please try again.'

        : error?.message ||
          'Unable to save profile information.';

      setProfileError(message);

      triggerToast?.(
        message,
        'error'
      );

    } finally {

      savingRef.current = false;

      if (mountedRef.current) {

        setIsSaving(false);

      }

    }

  };


// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

  const toggleNotification = key => {

    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_NOTIFICATIONS,
        key
      )
    ) {
      return;
    }

    setNotificationError('');

    try {

      const current =
        getNotificationSettings(accountId);

      const next = {
        ...current,
        [key]: !current[key]
      };

      writeUserSettings(
        accountId,
        {
          notifications: next
        }
      );

      setNotifications(next);

      triggerToast?.(
        'Notification preference saved.',
        'good'
      );

    } catch (error) {

      setNotificationError(
        error.message ||
        'Unable to save notification preferences.'
      );

    }

  };

  const resetNotifications = () => {

    try {

      const next = {
        ...DEFAULT_NOTIFICATIONS
      };

      writeUserSettings(
        accountId,
        {
          notifications: next
        }
      );

      setNotifications(next);

      setNotificationError('');

      triggerToast?.(
        'Default notification preferences restored.',
        'good'
      );

    } catch (error) {

      setNotificationError(
        error.message ||
        'Unable to reset notification preferences.'
      );

    }

  };


// ============================================================
// PROFESSIONAL INFORMATION
// ============================================================

  const professionalFields = [

    {
      label: 'Employee ID',
      value: accountId
    },

    {
      label: 'Designation',
      value:
        currentUser?.designation ||
        currentUser?.jobTitle ||
        currentUser?.role
    },

    {
      label: 'Department',
      value: currentUser?.department
    },

    {
      label: 'Reporting Manager',
      value:
        currentUser?.reportingManager ||
        currentUser?.managerName ||
        currentUser?.managerId,
      accent: true
    },

    {
      label: 'Direct Reports',
      value: currentUser?.directReports
    },

    {
      label: 'Total Team Members',
      value: currentUser?.totalTeam
    },

    {
      label: 'Date of Joining',
      value: displayDate(
        currentUser?.joiningDate ||
        currentUser?.dateOfJoining ||
        currentUser?.joined
      )
    },

    {
      label: 'Employment Type',
      value:
        currentUser?.employmentType ||
        currentUser?.employeeType
    },

    {
      label: 'Work Shift',
      value:
        typeof currentUser?.shift === 'string'
          ? currentUser.shift
          : currentUser?.shift?.name ||
            currentUser?.workShift?.name ||
            (
              typeof currentUser?.workShift === 'string'
                ? currentUser.workShift
                : null
            )
    },

    {
      label: 'Work Location',
      value: savedProfile.location
    },

    {
      label: 'System Access Role',
      value: roleLabel,
      accent: true
    },

    {
      label: 'Official Email',
      value: savedProfile.email
    }

  ];


// ============================================================
// MAIN UI
// ============================================================

  return (

    <div className="space-y-5">

      {/* PROFILE HEADER */}

      <div className="glass-card !p-5">

        <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="relative group shrink-0">

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-accent/40 bg-surface2 flex items-center justify-center text-white shadow-md">

                {profileImage ? (

                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />

                ) : (

                  <Avatar
                    name={displayName}
                    size="xl"
                  />

                )}

              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                title="Change profile photo"
                aria-label="Change profile photo"
                className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition flex items-center justify-center text-white disabled:cursor-not-allowed"
              >

                {isReadingImage ? (

                  <Loader2 className="w-5 h-5 animate-spin" />

                ) : (

                  <Camera className="w-5 h-5" />

                )}

              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isBusy}
              />

            </div>

            <div className="space-y-1 min-w-0">

              <h2 className="font-display font-semibold text-lg sm:text-xl text-ink break-words">

                {displayName}

              </h2>

              <div className="text-xs text-muted">

                {currentUser?.designation ||
                  currentUser?.role ||
                  roleLabel}

                {' \u00B7 ID: '}

                {accountId}

              </div>

              <div className="text-[11px] text-accent font-medium">

                {profileForm.location ||
                  'Work location not provided'}

              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-[11px] font-semibold text-ink hover:border-accent transition flex items-center gap-1 disabled:opacity-50"
                >

                  <Camera className="w-3 h-3 text-accent" />

                  {isReadingImage
                    ? 'Processing...'
                    : 'Upload Photo'}

                </button>

                {profileImage && (

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1 rounded-lg bg-bad/10 border border-bad/30 text-[11px] font-semibold text-bad hover:bg-bad/20 transition flex items-center gap-1 disabled:opacity-50"
                  >

                    <Trash2 className="w-3 h-3" />

                    Remove

                  </button>

                )}

              </div>

              <p className="text-[10px] text-muted">
                JPG, PNG or WebP. Maximum 2 MB.
              </p>

            </div>

          </div>

          <div className="text-left sm:text-right shrink-0">

            <span className="text-[10.5px] uppercase font-bold text-muted block">

              System Access Role

            </span>

            <span className="px-2.5 py-1 rounded-full bg-accent/20 text-accent font-bold text-xs border border-accent/30 inline-flex items-center gap-1.5 mt-1">

              <ShieldCheck className="w-3.5 h-3.5" />

              {roleLabel}

            </span>

            <p className={`mt-2 text-[11px] ${
              hasUnsavedChanges
                ? 'text-warn'
                : 'text-good'
            }`}>

              {hasUnsavedChanges
                ? 'Unsaved profile changes'
                : 'No unsaved profile changes'}

            </p>

          </div>

        </div>

        <div className="w-full">

          <ErrorMessage message={imageError} />

        </div>

      </div>


      {/* SETTINGS MENU AND CONTENT */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <aside className="glass-card !p-3 space-y-1 md:col-span-1 h-fit">

          <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block px-2 py-1">

            Settings Menu

          </span>

          {MENU_ITEMS.map(tab => {

            const Icon = tab.icon;

            const isActive =
              activeSection === tab.id;

            return (

              <button
                key={tab.id}
                type="button"
                disabled={isSaving}
                aria-pressed={isActive}
                onClick={() =>
                  setActiveSection(tab.id)
                }
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition disabled:opacity-50 ${
                  isActive
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:bg-surface2 hover:text-ink'
                }`}
              >

                <Icon className={`w-4 h-4 ${
                  isActive
                    ? 'text-on-accent'
                    : 'text-muted'
                }`} />

                <span>{tab.label}</span>

                {tab.id === 'profile' &&
                  hasUnsavedChanges && (

                  <span
                    title="Unsaved changes"
                    className="ml-auto w-2 h-2 rounded-full bg-warn"
                  />

                )}

              </button>

            );

          })}

        </aside>


        {/* SETTINGS CONTENT */}

        <section className="glass-card !p-5 md:col-span-3">

          <div className="w-full space-y-5">


            {/* PERSONAL PROFILE */}

            {activeSection === 'profile' && (

              <form
                onSubmit={handleProfileSubmit}
                className="space-y-5 text-xs"
              >

                <SectionHeading
                  title="Personal Information"
                  description="Manage your personal details, contact information and professional bio."
                />

                {hasUnsavedChanges && (

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-warn/10 border border-warn/30 text-warn">

                    <AlertCircle className="w-4 h-4 shrink-0" />

                    You have unsaved profile changes.

                  </div>

                )}

                <fieldset
                  disabled={isSaving}
                  className="min-w-0 space-y-4"
                >

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

                    <label className="block">

                      <span className="font-semibold text-ink block mb-1">

                        First Name *

                      </span>

                      <input
                        required
                        type="text"
                        maxLength={60}
                        value={profileForm.firstName}
                        onChange={event =>
                          updateField(
                            'firstName',
                            event.target.value
                          )
                        }
                        className={INPUT_CLASS}
                      />

                    </label>

                    <label className="block">

                      <span className="font-semibold text-ink block mb-1">

                        Last Name

                      </span>

                      <input
                        type="text"
                        maxLength={60}
                        value={profileForm.lastName}
                        onChange={event =>
                          updateField(
                            'lastName',
                            event.target.value
                          )
                        }
                        className={INPUT_CLASS}
                      />

                    </label>

                    <label className="block">

                      <span className="font-semibold text-ink block mb-1">

                        Official Email Address

                      </span>

                      <input
                        type="email"
                        readOnly
                        value={profileForm.email}
                        className={READ_ONLY_CLASS}
                      />

                      <span className="text-[10px] text-muted">

                        Managed by HR / IT administration.

                      </span>

                    </label>

                    <label className="block">

                      <span className="font-semibold text-ink block mb-1">

                        Mobile Phone

                      </span>

                      <input
                        type="tel"
                        maxLength={25}
                        value={profileForm.phone}
                        onChange={event =>
                          updateField(
                            'phone',
                            event.target.value
                          )
                        }
                        placeholder="Enter mobile number"
                        className={INPUT_CLASS}
                      />

                    </label>

                    <label className="block">

                      <span className="font-semibold text-ink block mb-1">

                        Emergency Contact

                      </span>

                      <input
                        type="text"
                        maxLength={120}
                        value={
                          profileForm.emergencyContact
                        }
                        onChange={event =>
                          updateField(
                            'emergencyContact',
                            event.target.value
                          )
                        }
                        placeholder="Contact name, relation and phone"
                        className={INPUT_CLASS}
                      />

                    </label>

                    <label className="block">

                      <span className="font-semibold text-ink block mb-1">

                        Work Location Base

                      </span>

                      <input
                        type="text"
                        maxLength={150}
                        value={profileForm.location}
                        onChange={event =>
                          updateField(
                            'location',
                            event.target.value
                          )
                        }
                        placeholder="Enter work location"
                        className={INPUT_CLASS}
                      />

                    </label>

                  </div>

                  <label className="block">

                    <span className="font-semibold text-ink block mb-1">

                      Professional Bio & Focus

                    </span>

                    <textarea
                      rows={4}
                      maxLength={500}
                      value={profileForm.bio}
                      onChange={event =>
                        updateField(
                          'bio',
                          event.target.value
                        )
                      }
                      placeholder="Describe your professional responsibilities..."
                      className={INPUT_CLASS}
                    />

                    <span className="block text-right text-[10px] text-muted mt-1">

                      {String(
                        profileForm.bio || ''
                      ).length}/500

                    </span>

                  </label>

                </fieldset>

                <ErrorMessage
                  message={profileError}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">

                  <div className="text-[10px] text-muted">

                    {lastSavedAt && (

                      <span className="flex items-center gap-1.5">

                        <CheckCircle className="w-3.5 h-3.5 text-good" />

                        Last saved:{' '}

                        {new Date(
                          lastSavedAt
                        ).toLocaleString('en-IN')}

                      </span>

                    )}

                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    <button
                      type="button"
                      disabled={
                        isBusy ||
                        !hasUnsavedChanges
                      }
                      onClick={resetProfile}
                      className={`${BUTTON_CLASS} flex items-center gap-1.5 bg-surface2 border border-line text-ink hover:border-accent`}
                    >

                      <RotateCcw className="w-3.5 h-3.5" />

                      Reset Changes

                    </button>

                    <button
                      type="submit"
                      disabled={
                        isBusy ||
                        !hasUnsavedChanges
                      }
                      className={`${BUTTON_CLASS} flex items-center gap-1.5 bg-accent text-on-accent font-bold hover:brightness-105 shadow-sm`}
                    >

                      {isSaving ? (

                        <Loader2 className="w-3.5 h-3.5 animate-spin" />

                      ) : (

                        <Save className="w-3.5 h-3.5" />

                      )}

                      {isSaving
                        ? 'Saving...'
                        : 'Save Changes'}

                    </button>

                  </div>

                </div>

              </form>

            )}


            {/* PROFESSIONAL INFORMATION */}

            {activeSection === 'professional' && (

              <div className="space-y-5 text-xs">

                <SectionHeading
                  title="Professional Profile & Hierarchy"
                  description="Organizational information associated with your current account."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {professionalFields.map(field => (

                    <InformationCard
                      key={field.label}
                      label={field.label}
                      value={field.value}
                      accent={field.accent}
                    />

                  ))}

                </div>

                <InfoMessage>

                  Designation, department, reporting
                  hierarchy and system access role are
                  read-only. Contact HR or your system
                  administrator for corrections.

                </InfoMessage>

              </div>

            )}


            {/* NOTIFICATION SETTINGS */}

            {activeSection === 'notifications' && (

              <div className="space-y-5 text-xs">

                <SectionHeading
                  title="Notification Preferences"
                  description="Manage your in-app notifications and external delivery preferences."
                />

                <InfoMessage>

                  In-app preferences take effect immediately and are saved for this account. Disabled categories are hidden, not deleted. Email, SMS, Slack and Teams delivery require backend integration.

                </InfoMessage>

                <div className="space-y-3">

                  {NOTIFICATION_OPTIONS.map(item => (

                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-surface2/50 border border-line/40 flex items-center justify-between gap-3"
                    >

                      <div>

                        <span className="font-semibold text-ink block">

                          {item.label}

                        </span>

                        <span className="text-[11px] text-muted">

                          {item.desc}

                        </span>

                      </div>

                      <div className="flex items-center gap-2">

                        <span className={`text-[10px] font-semibold ${
                          notifications[item.key]
                            ? 'text-good'
                            : 'text-muted'
                        }`}>

                          {notifications[item.key]
                            ? 'On'
                            : 'Off'}

                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            notifications[item.key]
                          }
                          aria-label={item.label}
                          disabled={
                            item.key.startsWith('inApp') &&
                            item.key !== 'inAppEnabled' &&
                            !notifications.inAppEnabled
                          }
                          onClick={() =>
                            toggleNotification(item.key)
                          }
                          className={`w-11 h-6 rounded-full transition relative shrink-0 ${
                            notifications[item.key]
                              ? 'bg-accent'
                              : 'bg-surface2 border border-line'
                          }`}
                        >

                          <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all ${
                            notifications[item.key]
                              ? 'left-6'
                              : 'left-1'
                          }`} />

                        </button>

                      </div>

                    </div>

                  ))}

                </div>

                <ErrorMessage
                  message={notificationError}
                />

                <div className="flex justify-end pt-3 border-t border-line/60">

                  <button
                    type="button"
                    onClick={resetNotifications}
                    className={`${BUTTON_CLASS} flex items-center gap-1.5 border border-line bg-surface2 text-ink hover:border-accent`}
                  >

                    <RotateCcw className="w-3.5 h-3.5" />

                    Restore Defaults

                  </button>

                </div>

              </div>

            )}


            {/* APPEARANCE AND DENSITY */}

            {activeSection === 'appearance' && (

              <div className="space-y-5 text-xs">

                <SectionHeading
                  title="Appearance & Display Settings"
                  description="Monsoon Glass UI design tokens and workspace layout density."
                />

                <div>

                  <span className="font-semibold text-ink block mb-2">

                    Workspace Density

                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">

                    {[
                      {
                        id: 'comfortable',
                        label: 'Comfortable',
                        description:
                          'Generous padding and spacious workspace layout.'
                      },
                      {
                        id: 'compact',
                        label: 'Compact',
                        description:
                          'Tighter padding and high-density data tables.'
                      }
                    ].map(option => (

                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={
                          density === option.id
                        }
                        onClick={() =>
                          setDensity(option.id)
                        }
                        className={`p-3 rounded-xl border text-left transition ${
                          density === option.id
                            ? 'bg-accent/20 border-accent text-ink'
                            : 'bg-surface2 border-line text-muted hover:text-ink'
                        }`}
                      >

                        <div className="flex items-center justify-between gap-2">

                          <span className="font-bold text-sm">

                            {option.label}

                          </span>

                          {density === option.id && (

                            <CheckCircle className="w-4 h-4 text-accent" />

                          )}

                        </div>

                        <span className="block mt-1 text-[10.5px] text-muted">

                          {option.description}

                        </span>

                      </button>

                    ))}

                  </div>

                </div>

                <div className="p-4 rounded-xl bg-surface2/60 border border-line/50 text-muted space-y-2 text-[11px]">

                  <div className="text-ink font-semibold">

                    Technomold Monsoon Glass

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <div>

                      <span className="block text-muted">

                        Theme

                      </span>

                      <span className="text-ink font-semibold">

                        Monsoon Glass Dark

                      </span>

                    </div>

                    <div>

                      <span className="block text-muted">

                        Display Typography

                      </span>

                      <span className="text-ink font-semibold">

                        Syne

                      </span>

                    </div>

                    <div>

                      <span className="block text-muted">

                        Body Typography

                      </span>

                      <span className="text-ink font-semibold">

                        Inter

                      </span>

                    </div>

                    <div>

                      <span className="block text-muted">

                        Numeric Typography

                      </span>

                      <span className="text-ink font-semibold">

                        Space Mono

                      </span>

                    </div>

                  </div>

                </div>

                <InfoMessage>

                  Workspace density uses the existing
                  dashboard context. Your current theme,
                  colors and typography remain unchanged.

                </InfoMessage>

              </div>

            )}

          </div>

        </section>

      </div>

    </div>

  );

};


// ============================================================
// SETTINGS ENTRY POINT
// ============================================================

export const Settings = () => {

  const {

    currentUser,

    updateProfile,

    density,

    setDensity,

    triggerToast

  } = useTeamLead();

  const accountId =
    userIdOf(currentUser);

  if (!currentUser || !accountId) {

    return (

      <div className="glass-card !p-8 text-center space-y-3">

        <ShieldCheck className="w-8 h-8 text-accent mx-auto" />

        <h3 className="font-display font-semibold text-base text-ink">

          Account Information Unavailable

        </h3>

        <p className="text-xs text-muted">

          Sign in with an authorized account
          to manage your profile settings.

        </p>

      </div>

    );

  }

  return (

    <AccountSettings

      key={normalizeId(accountId)}

      currentUser={currentUser}

      accountId={accountId}

      updateProfile={updateProfile}

      density={density}

      setDensity={setDensity}

      triggerToast={triggerToast}

    />

  );

};

export default Settings;
