
import React, {
  useState,
  useRef,
  useEffect,
} from 'react';

import { createPortal } from 'react-dom';

import { useStore } from '../../context/StoreContext';

import {
  IconCamera,
  IconLogOut,
  IconChevronDown,
  IconShield,
  IconKey,
  IconTrash,
  IconGoogle,
  IconX,
} from '../shared/Icons';

// ============================================================
// PROFILE CONFIGURATION
// ============================================================

const HISTORY_EVENT =
  'it-admin:open-attendance-history';

const INPUT_CLASS =
  'w-full min-w-0 rounded-lg border border-line bg-surface2/60 px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors';

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface2/50 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent/40 hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed';

const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed';

// ============================================================
// PROFILE ICONS
// ============================================================

function ProfileIcon({
  name,
  className = 'w-4 h-4',
}) {
  const paths = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20H4v-8L16 0l8 8Z" transform="translate(1 2) scale(.82)" />
        <path d="m14 5 5 5" />
      </>
    ),

    contact: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2.5" />
        <path d="M5.5 16a3.5 3.5 0 0 1 7 0M15 9h3M15 13h3" />
      </>
    ),

    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M10 13v2h4v-2" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M7 14h2M12 14h2M7 17h2" />
      </>
    ),

    leave: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18m5 6 3 3 5-5" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        <circle cx="12" cy="12" r="7" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),

    phone: (
      <path d="M6 3h4l2 5-3 2a14 14 0 0 0 5 5l2-3 5 2v4a3 3 0 0 1-3 3C10 20 4 14 3 6a3 3 0 0 1 3-3Z" />
    ),

    location: (
      <>
        <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    chevron: (
      <path d="m9 6 6 6-6 6" />
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name] || paths.user}
    </svg>
  );
}

// ============================================================
// PROFILE UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return '—';
  }

  return String(value);
}

function getUserKey(user) {
  return String(
    user?.employeeId ||
    user?.id ||
    user?.email ||
    user?.name ||
    ''
  );
}

function getProfileStorageKey(userKey) {
  return `it_admin_profile_preferences_${encodeURIComponent(userKey)}`;
}

function getDefaultPreferences() {
  return {
    preferredName: '',
    phone: '',
    alternateEmail: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    showNameInHeader: false,
  };
}

function readProfilePreferences(userKey) {
  const defaults = getDefaultPreferences();

  if (!userKey) return defaults;

  try {
    const saved = window.localStorage.getItem(
      getProfileStorageKey(userKey)
    );

    if (!saved) return defaults;

    const parsed = JSON.parse(saved);

    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }

    return {
      ...defaults,
      ...Object.fromEntries(
        Object.keys(defaults).map(key => [
          key,
          typeof parsed[key] === typeof defaults[key]
            ? parsed[key]
            : defaults[key],
        ])
      ),
    };
  } catch {
    return defaults;
  }
}

// ============================================================
// PROFILE AVATAR
//
// No initials or LX marker.
// Displays uploaded image or professional user icon.
// ============================================================

function ProfileAvatar({
  src,
  name,
  size = 36,
  className = '',
}) {
  const [imageError, setImageError] =
    useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const showImage =
    Boolean(src) && !imageError;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-accent/25 bg-accent/10 flex items-center justify-center text-accent ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-label={
        showImage
          ? `${name} profile picture`
          : 'Default profile avatar'
      }
    >

      {showImage ? (

        <img
          src={src}
          alt={`${name} profile`}
          onError={() =>
            setImageError(true)
          }
          className="h-full w-full object-cover"
        />

      ) : (

        <ProfileIcon
          name="user"
          className={
            size >= 60
              ? 'w-8 h-8'
              : size >= 45
                ? 'w-6 h-6'
                : 'w-5 h-5'
          }
        />

      )}

    </div>
  );
}

// ============================================================
// PROFILE MENU ITEM
// ============================================================

function ProfileMenuItem({
  icon,
  label,
  description,
  onClick,
  danger = false,
  chevron = true,
}) {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
        danger
          ? 'text-rose-300 hover:bg-rose-500/10'
          : 'text-ink hover:bg-surface2/80'
      }`}
    >

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          danger
            ? 'bg-rose-400/10 text-rose-300'
            : 'bg-surface2 text-accent group-hover:bg-accent/10'
        }`}
      >

        <Icon className="w-4 h-4" />

      </span>

      <span className="min-w-0 flex-1">

        <span className="block text-[12.5px] font-semibold">
          {label}
        </span>

        {description && (

          <span className="mt-0.5 block text-[10.5px] text-muted truncate">
            {description}
          </span>

        )}

      </span>

      {chevron && (

        <ProfileIcon
          name="chevron"
          className="w-3.5 h-3.5 shrink-0 text-muted group-hover:translate-x-0.5 transition-transform"
        />

      )}

    </button>
  );
}

// ============================================================
// PROFILE INFORMATION FIELD
// ============================================================

function InformationField({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line/60 bg-surface2/30 p-3">

      <span className="block text-[11px] font-medium text-muted">
        {label}
      </span>

      <span className="mt-1.5 block break-words text-[13px] font-semibold text-ink">
        {displayValue(value)}
      </span>

    </div>
  );
}

function SectionHeading({
  title,
  description,
}) {
  return (
    <div className="mb-4">

      <h3 className="font-display text-[17px] font-bold text-ink">
        {title}
      </h3>

      {description && (

        <p className="mt-1 text-xs leading-relaxed text-muted">
          {description}
        </p>

      )}

    </div>
  );
}

function ProfileNotice({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent/5 p-3">

      <ProfileIcon
        name="info"
        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
      />

      <div className="text-xs leading-relaxed text-muted">
        {children}
      </div>

    </div>
  );
}

// ============================================================
// PROFILE DETAILS POPUP
// ============================================================

function ProfileDetailsModal({
  currentUser,
  employee,
  profileName,
  profileRole,
  profileEmail,
  profileAvatar,
  authProvider,
  preferences,
  initialTab,
  initialEdit,
  canUpdateProfile,
  canReadSettings,
  canReadAccess,
  onSavePreferences,
  onUploadPicture,
  onRemovePicture,
  onOpenAttendance,
  onOpenSystemSettings,
  onOpenAccessManagement,
  onClose,
}) {
  const [activeTab, setActiveTab] =
    useState(initialTab || 'overview');

  const [isEditing, setIsEditing] =
    useState(
      Boolean(
        initialEdit &&
        canUpdateProfile
      )
    );

  const [formError, setFormError] =
    useState('');

  const closeButtonRef = useRef(null);

  const modalRef = useRef(null);

  // ==========================================================
  // EXISTING PROFILE DATA
  // ==========================================================

  const profileData = {
    employeeId:
      employee?.employeeId ||
      currentUser?.employeeId ||
      currentUser?.id,

    name: profileName,

    email: profileEmail,

    role: profileRole,

    department:
      employee?.department ||
      currentUser?.department,

    designation:
      employee?.designation ||
      currentUser?.designation ||
      employee?.jobTitle ||
      currentUser?.jobTitle,

    location:
      employee?.location ||
      currentUser?.location,

    joiningDate:
      employee?.joiningDate ||
      employee?.joining_date ||
      currentUser?.joiningDate,

    employmentType:
      employee?.employmentType ||
      currentUser?.employmentType,

    manager:
      employee?.managerName ||
      currentUser?.managerName ||
      employee?.manager,

    status:
      employee?.status ||
      currentUser?.status,

    phone:
      preferences.phone ||
      employee?.contactNumber ||
      employee?.phone ||
      currentUser?.contactNumber ||
      currentUser?.phone ||
      '',

    alternateEmail:
      preferences.alternateEmail ||
      employee?.alternateEmail ||
      currentUser?.alternateEmail ||
      '',

    address:
      preferences.address ||
      employee?.address ||
      currentUser?.address ||
      '',

    preferredName:
      preferences.preferredName ||
      '',

    emergencyContactName:
      preferences.emergencyContactName ||
      '',

    emergencyContactPhone:
      preferences.emergencyContactPhone ||
      '',
  };

  const createDraft = () => ({
    ...preferences,

    preferredName:
      profileData.preferredName,

    phone:
      profileData.phone,

    alternateEmail:
      profileData.alternateEmail,

    address:
      typeof profileData.address === 'string'
        ? profileData.address
        : '',

    emergencyContactName:
      profileData.emergencyContactName,

    emergencyContactPhone:
      profileData.emergencyContactPhone,
  });

  const [draft, setDraft] =
    useState(createDraft);

  // ==========================================================
  // MODAL KEYBOARD ACCESSIBILITY
  // ==========================================================

  useEffect(() => {
    const previousFocus =
      document.activeElement;

    closeButtonRef.current?.focus();

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(
        modalRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
        ) || []
      ).filter(
        element =>
          element.getClientRects().length > 0
      );

      if (!focusable.length) return;

      const first = focusable[0];

      const last =
        focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  // ==========================================================
  // PROFILE NAVIGATION
  // ==========================================================

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'user',
    },
    {
      id: 'personal',
      label: 'Personal Information',
      icon: 'contact',
    },
    {
      id: 'contact',
      label: 'Contact Information',
      icon: 'phone',
    },
    {
      id: 'employment',
      label: 'Employment Details',
      icon: 'briefcase',
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: 'settings',
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'lock',
    },
  ];

  const changeTab = tab => {
    if (
      isEditing &&
      !window.confirm(
        'Discard your unsaved profile changes?'
      )
    ) {
      return;
    }

    setActiveTab(tab);
    setIsEditing(false);
    setFormError('');
    setDraft(createDraft());
  };

  // ==========================================================
  // EDIT PROFILE
  // ==========================================================

  const startEditing = () => {
    if (!canUpdateProfile) return;

    setDraft(createDraft());
    setFormError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(createDraft());
    setFormError('');
    setIsEditing(false);
  };

  const updateDraft = (field, value) => {
    setDraft(previous => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
  };

  const saveProfile = event => {
    event.preventDefault();

    if (!canUpdateProfile) return;

    const updated = {
      ...draft,

      preferredName:
        draft.preferredName.trim(),

      phone:
        draft.phone.trim(),

      alternateEmail:
        draft.alternateEmail.trim(),

      address:
        draft.address.trim(),

      emergencyContactName:
        draft.emergencyContactName.trim(),

      emergencyContactPhone:
        draft.emergencyContactPhone.trim(),
    };

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      updated.alternateEmail &&
      !emailPattern.test(
        updated.alternateEmail
      )
    ) {
      setFormError(
        'Enter a valid alternate email address.'
      );

      return;
    }

    const validPhone = value => {
      if (!value) return true;

      const digits =
        value.replace(/\D/g, '');

      return (
        /^[+\d\s().-]+$/.test(value) &&
        digits.length >= 7 &&
        digits.length <= 15
      );
    };

    if (!validPhone(updated.phone)) {
      setFormError(
        'Enter a valid contact phone number.'
      );

      return;
    }

    if (
      !validPhone(
        updated.emergencyContactPhone
      )
    ) {
      setFormError(
        'Enter a valid emergency contact phone number.'
      );

      return;
    }

    const saved =
      onSavePreferences(updated);

    if (saved) {
      setIsEditing(false);
      setFormError('');
    }
  };

  // ==========================================================
  // EDIT PROFILE FORM
  // ==========================================================

  const renderEditForm = () => (
    <form
      onSubmit={saveProfile}
      className="flex flex-col gap-4"
    >

      <SectionHeading
        title="Edit Profile"
        description="Update personal and contact details stored for this browser profile."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Full Name
          </span>

          <input
            type="text"
            value={profileName}
            readOnly
            className={`${INPUT_CLASS} opacity-70 cursor-default`}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Preferred Name
          </span>

          <input
            type="text"
            value={draft.preferredName}
            maxLength={60}
            onChange={event =>
              updateDraft(
                'preferredName',
                event.target.value
              )
            }
            placeholder="Enter preferred name"
            className={INPUT_CLASS}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Work Email
          </span>

          <input
            type="email"
            value={profileEmail}
            readOnly
            className={`${INPUT_CLASS} opacity-70 cursor-default`}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Employee ID
          </span>

          <input
            type="text"
            value={
              displayValue(
                profileData.employeeId
              )
            }
            readOnly
            className={`${INPUT_CLASS} opacity-70 cursor-default`}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Contact Number
          </span>

          <input
            type="tel"
            value={draft.phone}
            maxLength={25}
            onChange={event =>
              updateDraft(
                'phone',
                event.target.value
              )
            }
            placeholder="Enter phone number"
            className={INPUT_CLASS}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Alternate Email
          </span>

          <input
            type="email"
            value={draft.alternateEmail}
            maxLength={120}
            onChange={event =>
              updateDraft(
                'alternateEmail',
                event.target.value
              )
            }
            placeholder="Enter alternate email"
            className={INPUT_CLASS}
          />

        </label>

        <label className="grid gap-1.5 sm:col-span-2">

          <span className="text-xs font-semibold text-muted">
            Address
          </span>

          <textarea
            rows={3}
            value={draft.address}
            maxLength={300}
            onChange={event =>
              updateDraft(
                'address',
                event.target.value
              )
            }
            placeholder="Enter contact address"
            className={`${INPUT_CLASS} resize-y`}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Emergency Contact Name
          </span>

          <input
            type="text"
            value={
              draft.emergencyContactName
            }
            maxLength={80}
            onChange={event =>
              updateDraft(
                'emergencyContactName',
                event.target.value
              )
            }
            placeholder="Enter contact name"
            className={INPUT_CLASS}
          />

        </label>

        <label className="grid gap-1.5">

          <span className="text-xs font-semibold text-muted">
            Emergency Contact Number
          </span>

          <input
            type="tel"
            value={
              draft.emergencyContactPhone
            }
            maxLength={25}
            onChange={event =>
              updateDraft(
                'emergencyContactPhone',
                event.target.value
              )
            }
            placeholder="Enter contact number"
            className={INPUT_CLASS}
          />

        </label>

      </div>

      <ProfileNotice>
        Personal profile preferences are saved locally
        in this browser. Full name, work email,
        employee ID and employment permissions remain
        controlled by the existing account record.
        Avoid storing confidential information on
        shared devices.
      </ProfileNotice>

      {formError && (

        <div
          role="alert"
          className="rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-300"
        >

          {formError}

        </div>

      )}

      <div className="flex justify-end gap-2 border-t border-line pt-4">

        <button
          type="button"
          onClick={cancelEditing}
          className={SECONDARY_BUTTON}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={PRIMARY_BUTTON}
        >

          <ProfileIcon
            name="check"
            className="w-4 h-4"
          />

          Save Changes

        </button>

      </div>

    </form>
  );

  // ==========================================================
  // PROFILE OVERVIEW
  // ==========================================================

  const renderOverview = () => (
    <div className="space-y-4">

      <SectionHeading
        title="Profile Overview"
        description="Your account information and employee workspace."
      />

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface2/30 p-4 sm:flex-row sm:items-center">

        <div className="relative shrink-0">

          <ProfileAvatar
            name={profileName}
            src={profileAvatar}
            size={76}
          />

          {canUpdateProfile && (

            <button
              type="button"
              onClick={onUploadPicture}
              title="Change profile picture"
              aria-label="Change profile picture"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-accent text-on-accent shadow-lg transition-transform hover:scale-105"
            >

              <IconCamera className="w-3.5 h-3.5" />

            </button>

          )}

        </div>

        <div className="min-w-0 flex-1">

          <h3 className="break-words font-display text-xl font-bold text-ink">

            {profileName}

          </h3>

          <p className="mt-1 text-[13px] text-muted">

            {profileRole}

          </p>

          <p className="mt-1 break-all text-xs text-muted">

            {profileEmail}

          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">

              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

              Active Session

            </span>

            {authProvider === 'google' && (

              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] text-muted">

                <IconGoogle className="w-3 h-3" />

                Local SSO

              </span>

            )}

          </div>

        </div>

        {canUpdateProfile && (

          <button
            type="button"
            onClick={startEditing}
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon
              name="edit"
              className="w-4 h-4"
            />

            Edit Profile

          </button>

        )}

      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <InformationField
          label="Employee ID"
          value={profileData.employeeId}
        />

        <InformationField
          label="Department"
          value={profileData.department}
        />

        <InformationField
          label="Account Role"
          value={profileRole}
        />

        <InformationField
          label="Office Location"
          value={profileData.location}
        />

      </div>

      <div className="rounded-xl border border-line bg-surface2/20 p-4">

        <h4 className="mb-3 text-sm font-bold text-ink">
          Quick Profile Actions
        </h4>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

          <button
            type="button"
            onClick={onOpenAttendance}
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon name="calendar" />

            Attendance History

          </button>

          <button
            type="button"
            onClick={onOpenAttendance}
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon name="leave" />

            Leave Management

          </button>

          {canReadAccess && (

            <button
              type="button"
              onClick={onOpenAccessManagement}
              className={SECONDARY_BUTTON}
            >

              <IconKey className="w-4 h-4" />

              Access Management

            </button>

          )}

          <button
            type="button"
            onClick={() =>
              changeTab('settings')
            }
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon name="settings" />

            Account Settings

          </button>

        </div>

      </div>

    </div>
  );

  // ==========================================================
  // PERSONAL INFORMATION
  // ==========================================================

  const renderPersonal = () => (
    <div className="space-y-4">

      <div className="flex flex-wrap items-start justify-between gap-2">

        <SectionHeading
          title="Personal Information"
          description="View your personal profile information."
        />

        {canUpdateProfile && (

          <button
            type="button"
            onClick={startEditing}
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon
              name="edit"
              className="w-4 h-4"
            />

            Edit Profile

          </button>

        )}

      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <InformationField
          label="Full Name"
          value={profileName}
        />

        <InformationField
          label="Preferred Name"
          value={
            profileData.preferredName ||
            profileName
          }
        />

        <InformationField
          label="Employee ID"
          value={profileData.employeeId}
        />

        <InformationField
          label="Work Email"
          value={profileEmail}
        />

        <InformationField
          label="Account Role"
          value={profileRole}
        />

        <InformationField
          label="Office Location"
          value={profileData.location}
        />

      </div>

    </div>
  );

  // ==========================================================
  // CONTACT INFORMATION
  // ==========================================================

  const renderContact = () => (
    <div className="space-y-4">

      <div className="flex flex-wrap items-start justify-between gap-2">

        <SectionHeading
          title="Contact Information"
          description="Manage your personal contact details."
        />

        {canUpdateProfile && (

          <button
            type="button"
            onClick={startEditing}
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon
              name="edit"
              className="w-4 h-4"
            />

            Edit Contact

          </button>

        )}

      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <InformationField
          label="Work Email"
          value={profileEmail}
        />

        <InformationField
          label="Contact Number"
          value={profileData.phone}
        />

        <InformationField
          label="Alternate Email"
          value={profileData.alternateEmail}
        />

        <InformationField
          label="Office Location"
          value={profileData.location}
        />

        <div className="sm:col-span-2">

          <InformationField
            label="Contact Address"
            value={profileData.address}
          />

        </div>

      </div>

      <div className="rounded-xl border border-line bg-surface2/20 p-4">

        <h4 className="mb-3 text-sm font-bold text-ink">
          Emergency Contact
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <InformationField
            label="Contact Name"
            value={
              profileData.emergencyContactName
            }
          />

          <InformationField
            label="Contact Number"
            value={
              profileData.emergencyContactPhone
            }
          />

        </div>

      </div>

    </div>
  );

  // ==========================================================
  // EMPLOYMENT DETAILS
  // ==========================================================

  const renderEmployment = () => (
    <div className="space-y-4">

      <SectionHeading
        title="Employment Details"
        description="Organization and employment information associated with your account."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <InformationField
          label="Organization"
          value="Technomold IT Solutions Pvt Ltd"
        />

        <InformationField
          label="Employee ID"
          value={profileData.employeeId}
        />

        <InformationField
          label="Department"
          value={profileData.department}
        />

        <InformationField
          label="Designation"
          value={
            profileData.designation ||
            profileRole
          }
        />

        <InformationField
          label="Assigned Role"
          value={profileRole}
        />

        <InformationField
          label="Employment Type"
          value={
            profileData.employmentType
          }
        />

        <InformationField
          label="Joining Date"
          value={
            profileData.joiningDate
          }
        />

        <InformationField
          label="Reporting Manager"
          value={profileData.manager}
        />

        <InformationField
          label="Office Location"
          value={profileData.location}
        />

        <InformationField
          label="Account Status"
          value={profileData.status}
        />

      </div>

      <ProfileNotice>
        Employment information is read from the
        available employee and account records.
        Missing values are not automatically generated.
      </ProfileNotice>

    </div>
  );

  // ==========================================================
  // ACCOUNT SETTINGS
  // ==========================================================

  const renderSettings = () => (
    <div className="space-y-4">

      <SectionHeading
        title="Account Settings"
        description="Manage your profile picture, appearance and account preferences."
      />

      {/* PROFILE PICTURE */}

      <section className="rounded-xl border border-line bg-surface2/30 p-4">

        <h4 className="mb-3 text-sm font-bold text-ink">
          Profile Picture
        </h4>

        <div className="flex flex-wrap items-center gap-4">

          <ProfileAvatar
            name={profileName}
            src={profileAvatar}
            size={64}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-2">

            <p className="text-xs text-muted">
              Upload a personal profile photo.
            </p>

            <div className="flex flex-wrap gap-2">

              {canUpdateProfile && (

                <button
                  type="button"
                  onClick={onUploadPicture}
                  className={SECONDARY_BUTTON}
                >

                  <IconCamera className="w-4 h-4" />

                  {profileAvatar
                    ? 'Change Picture'
                    : 'Upload Picture'}

                </button>

              )}

              {canUpdateProfile &&
                profileAvatar && (

                <button
                  type="button"
                  onClick={onRemovePicture}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-400/20"
                >

                  <IconTrash className="w-4 h-4" />

                  Remove Picture

                </button>

              )}

            </div>

          </div>

        </div>

      </section>

      {/* HEADER APPEARANCE */}

      <section className="rounded-xl border border-line bg-surface2/30 p-4">

        <h4 className="mb-3 text-sm font-bold text-ink">
          Header Appearance
        </h4>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-line/60 bg-surface/40 p-3">

          <div className="min-w-0">

            <span className="block text-[13px] font-semibold text-ink">
              Show profile name in header
            </span>

            <span className="mt-1 block text-xs text-muted">
              Keep this off for the compact avatar-only layout.
            </span>

          </div>

          <input
            type="checkbox"
            checked={
              preferences.showNameInHeader
            }
            disabled={!canUpdateProfile}
            onChange={event =>
              onSavePreferences({
                ...preferences,

                showNameInHeader:
                  event.target.checked,
              })
            }
            className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed"
          />

        </label>

      </section>

      {/* ADMINISTRATION SETTINGS */}

      <section className="rounded-xl border border-line bg-surface2/30 p-4">

        <h4 className="mb-2 text-sm font-bold text-ink">
          System Settings
        </h4>

        <p className="mb-3 text-xs leading-relaxed text-muted">
          Access business units, locations,
          integrations, notification rules and
          backup configurations.
        </p>

        {canReadSettings ? (

          <button
            type="button"
            onClick={onOpenSystemSettings}
            className={SECONDARY_BUTTON}
          >

            <ProfileIcon name="settings" />

            Open System Settings

            <ProfileIcon
              name="chevron"
              className="w-3.5 h-3.5"
            />

          </button>

        ) : (

          <p className="text-xs text-muted">
            System Settings access requires an
            appropriate administrator permission.
          </p>

        )}

      </section>

    </div>
  );

  // ==========================================================
  // SECURITY SETTINGS
  // ==========================================================

  const renderSecurity = () => (
    <div className="space-y-4">

      <SectionHeading
        title="Account Security"
        description="Review your authentication and account security information."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <InformationField
          label="Session Status"
          value="Active"
        />

        <InformationField
          label="Authentication"
          value={
            authProvider === 'google'
              ? 'Local Google SSO simulation'
              : 'Local application session'
          }
        />

        <InformationField
          label="Account Email"
          value={profileEmail}
        />

        <InformationField
          label="Assigned Role"
          value={profileRole}
        />

      </div>

      <section className="rounded-xl border border-line bg-surface2/30 p-4">

        <div className="flex items-start gap-3">

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">

            <ProfileIcon
              name="lock"
              className="w-5 h-5"
            />

          </span>

          <div>

            <h4 className="text-sm font-bold text-ink">
              Change Password
            </h4>

            <p className="mt-1 text-xs leading-relaxed text-muted">
              Password changes are managed through
              your organization's authentication provider.
              The current frontend-only application does
              not have a password-management service.
            </p>

          </div>

        </div>

      </section>

      {canReadAccess && (

        <section className="rounded-xl border border-line bg-surface2/30 p-4">

          <h4 className="mb-2 text-sm font-bold text-ink">
            Roles & Permissions
          </h4>

          <p className="mb-3 text-xs text-muted">
            Review technical access and role-based
            permissions in Access Management.
          </p>

          <button
            type="button"
            onClick={onOpenAccessManagement}
            className={SECONDARY_BUTTON}
          >

            <IconShield className="w-4 h-4" />

            View Access Management

          </button>

        </section>

      )}

      <ProfileNotice>
        Never enter or save your password,
        authentication codes or recovery keys
        in local profile settings.
      </ProfileNotice>

    </div>
  );

  // ==========================================================
  // ACTIVE PROFILE CONTENT
  // ==========================================================

  const renderContent = () => {
    if (
      isEditing &&
      canUpdateProfile
    ) {
      return renderEditForm();
    }

    switch (activeTab) {
      case 'personal':
        return renderPersonal();

      case 'contact':
        return renderContact();

      case 'employment':
        return renderEmployment();

      case 'settings':
        return renderSettings();

      case 'security':
        return renderSecurity();

      case 'overview':
      default:
        return renderOverview();
    }
  };

  // ==========================================================
  // PROFILE MODAL RENDER
  // ==========================================================

  return createPortal(
    <div
      data-profile-modal
      className="mod-it fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >

        {/* MODAL HEADER */}

        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">

              <ProfileIcon
                name="user"
                className="w-5 h-5"
              />

            </div>

            <div className="min-w-0">

              <h2
                id="profile-modal-title"
                className="font-display text-lg font-bold text-ink"
              >
                My Profile
              </h2>

              <p className="truncate text-xs text-muted">
                Personal account and preferences
              </p>

            </div>

          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink focus-visible:outline focus-visible:outline-accent"
          >

            <IconX className="w-5 h-5" />

          </button>

        </header>

        {/* PROFILE MODAL BODY */}

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">

          {/* PROFILE MODAL NAVIGATION */}

          <nav
            aria-label="Profile sections"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface2/20 p-3 md:w-[220px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r"
          >

            {tabs.map(tab => (

              <button
                key={tab.id}
                type="button"
                aria-current={
                  activeTab === tab.id
                    ? 'page'
                    : undefined
                }
                onClick={() =>
                  changeTab(tab.id)
                }
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border border-accent/25 bg-accent/10 text-accent'
                    : 'border border-transparent text-muted hover:bg-surface2 hover:text-ink'
                }`}
              >

                <ProfileIcon
                  name={tab.icon}
                  className="h-4 w-4 shrink-0"
                />

                <span className="whitespace-nowrap">
                  {tab.label}
                </span>

              </button>

            ))}

          </nav>

          {/* PROFILE MODAL CONTENT */}

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">

            {renderContent()}

          </main>

        </div>

        {/* MODAL FOOTER */}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">

          <span className="flex items-center gap-1.5 text-[11px] text-muted">

            <IconShield className="w-3.5 h-3.5 text-accent" />

            IT Administration Profile

          </span>

          <button
            type="button"
            onClick={onClose}
            className={SECONDARY_BUTTON}
          >

            Close

          </button>

        </footer>

      </section>

    </div>,
    document.body
  );
}

// ============================================================
// MAIN PROFILE DROPDOWN
// ============================================================

function ProfileDropdownContent({
  currentUser,
  isAuthenticated,
  authProvider,
  users,
  updateProfilePicture,
  removeProfilePicture,
  signInWithGoogle,
  signOut,
  navigate,
  showToast,
  hasPermission,
}) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [activeModal, setActiveModal] =
    useState(null);

  const dropdownRef = useRef(null);

  const triggerRef = useRef(null);

  const fileInputRef = useRef(null);

  // ==========================================================
  // PROFILE IDENTITY AND PERMISSIONS
  // ==========================================================

  const hasActiveSession =
    Boolean(
      isAuthenticated &&
      currentUser
    );

  const userKey =
    getUserKey(currentUser);

  const [preferences, setPreferences] =
    useState(() =>
      readProfilePreferences(userKey)
    );

  const canUpdateProfile =
    hasActiveSession &&
    hasPermission(
      'User Profiles',
      'update'
    );

  const canReadUsers =
    hasActiveSession &&
    hasPermission(
      'User Profiles',
      'read'
    );

  const canReadAccess =
    hasActiveSession &&
    hasPermission(
      'Security',
      'read'
    );

  const canReadSettings =
    hasActiveSession &&
    hasPermission(
      'System Settings',
      'read'
    );

  const profileName =
    currentUser?.name ||
    'IT Administrator';

  const profileRole =
    currentUser?.role ||
    'Administrator';

  const profileEmail =
    currentUser?.email ||
    '';

  const profileAvatar =
    currentUser?.avatarUrl ||
    null;

  const profileLocation =
    currentUser?.location ||
    'Local Session';

  const displayName =
    preferences.preferredName ||
    profileName;

  // ==========================================================
  // LINKED EMPLOYEE RECORD
  // ==========================================================

  const employee =
    canReadUsers && currentUser
      ? (Array.isArray(users) ? users : []).find(
          user =>
            (
              currentUser.id &&
              user.id === currentUser.id
            ) ||
            (
              currentUser.employeeId &&
              user.employeeId ===
                currentUser.employeeId
            ) ||
            (
              currentUser.email &&
              normalize(user.email) ===
                normalize(currentUser.email)
            )
        )
      : null;

  // ==========================================================
  // CLOSE DROPDOWN - OUTSIDE CLICK / ESCAPE
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setIsOpen(false);

        triggerRef.current?.focus();
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen]);

  // ==========================================================
  // LOCAL PROFILE PREFERENCES
  // ==========================================================

  const savePreferences = nextPreferences => {
    if (
      !canUpdateProfile ||
      !userKey
    ) {
      return false;
    }

    try {
      const nextValue = {
        ...getDefaultPreferences(),
        ...nextPreferences,
      };

      window.localStorage.setItem(
        getProfileStorageKey(userKey),
        JSON.stringify(nextValue)
      );

      setPreferences(nextValue);

      showToast?.(
        'Profile preferences saved successfully.'
      );

      return true;
    } catch {
      showToast?.(
        'Could not save profile preferences. Browser storage may be unavailable.'
      );

      return false;
    }
  };

  // ==========================================================
  // PROFILE PICTURE MANAGEMENT
  // ==========================================================

  const handleFileChange = event => {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (
      !file ||
      !canUpdateProfile
    ) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast?.(
        'Please select a valid image file.'
      );

      return;
    }

    updateProfilePicture(file);
  };

  const handleUploadPicture = () => {
    if (!canUpdateProfile) return;

    fileInputRef.current?.click();
  };

  const handleRemovePicture = () => {
    if (
      !canUpdateProfile ||
      !profileAvatar
    ) {
      return;
    }

    const confirmed = window.confirm(
      'Remove your current profile picture?'
    );

    if (!confirmed) return;

    removeProfilePicture();
  };

  // ==========================================================
  // PROFILE POPUP NAVIGATION
  // ==========================================================

  const openProfileModal = (
    tab = 'overview',
    edit = false
  ) => {
    if (!hasActiveSession) return;

    setIsOpen(false);

    setActiveModal({
      tab,
      edit,
    });
  };

  const closeProfileModal = () => {
    setActiveModal(null);
  };

  // ==========================================================
  // ATTENDANCE & LEAVE HISTORY
  //
  // Uses the single AttendanceTracker in Header.jsx.
  // No duplicate AttendanceTracker in the dropdown.
  // ==========================================================

  const handleAttendanceHistory = () => {
    if (!hasActiveSession) return;

    setIsOpen(false);

    setActiveModal(null);

    window.dispatchEvent(
      new CustomEvent(
        HISTORY_EVENT,
        {
          detail: {
            userKey,
          },
        }
      )
    );
  };

  // ==========================================================
  // ACCESS MANAGEMENT
  // ==========================================================

  const handleAccessManagement = () => {
    if (!canReadAccess) return;

    navigate('access');

    setIsOpen(false);

    setActiveModal(null);
  };

  // ==========================================================
  // SYSTEM SETTINGS
  // ==========================================================

  const handleSystemSettings = () => {
    if (!canReadSettings) return;

    navigate('settings');

    setIsOpen(false);

    setActiveModal(null);
  };

  // ==========================================================
  // AUTHENTICATION ACTIONS
  // ==========================================================

  const handleSignOut = () => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out? Signing out does not automatically check you out of attendance.'
    );

    if (!confirmed) return;

    setIsOpen(false);

    setActiveModal(null);

    signOut();
  };

  const handleSignIn = () => {
    signInWithGoogle();

    setIsOpen(false);
  };

  // ==========================================================
  // MENU ICON COMPONENTS
  // ==========================================================

  const UserIcon = props => (
    <ProfileIcon name="user" {...props} />
  );

  const EditIcon = props => (
    <ProfileIcon name="edit" {...props} />
  );

  const ContactIcon = props => (
    <ProfileIcon name="contact" {...props} />
  );

  const EmploymentIcon = props => (
    <ProfileIcon name="briefcase" {...props} />
  );

  const CalendarIcon = props => (
    <ProfileIcon name="calendar" {...props} />
  );

  const LeaveIcon = props => (
    <ProfileIcon name="leave" {...props} />
  );

  const SettingsIcon = props => (
    <ProfileIcon name="settings" {...props} />
  );

  const PasswordIcon = props => (
    <ProfileIcon name="lock" {...props} />
  );

  // ==========================================================
  // PROFILE COMPONENT RENDER
  // ==========================================================

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block shrink-0 text-left"
    >

      {/* HIDDEN PROFILE PICTURE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={!canUpdateProfile}
        aria-label="Upload profile picture"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* =====================================================
          COMPACT PROFILE TRIGGER

          No LX / initials.
          Avatar or professional user icon.
      ====================================================== */}

      <button
        ref={triggerRef}
        type="button"
        id="profile-menu-button"
        data-testid="profile-menu-button"
        onClick={() =>
          setIsOpen(previous => !previous)
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={
          isOpen
            ? 'profile-dropdown-menu'
            : undefined
        }
        aria-label={
          hasActiveSession
            ? `Profile menu for ${profileName}`
            : 'Sign in to IT Administration'
        }
        title={
          hasActiveSession
            ? `${profileName} · ${profileRole}`
            : 'Sign In'
        }
        className={`group flex shrink-0 items-center gap-1.5 rounded-lg border px-1 py-0.5 transition-all cursor-pointer focus-visible:outline-accent ${
          isOpen
            ? 'border-accent/50 bg-accent/10'
            : 'border-line/60 bg-surface2/40 hover:border-accent/40 hover:bg-surface2'
        }`}
      >

        <div className="relative shrink-0">

          <ProfileAvatar
            name={profileName}
            src={
              hasActiveSession
                ? profileAvatar
                : null
            }
            size={30}
          />

          {/* AUTHENTICATION STATUS DOT */}

          <span
            data-testid="auth-status-dot"
            title={
              hasActiveSession
                ? 'Active Session'
                : 'Signed Out'
            }
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-surface ${
              hasActiveSession
                ? 'bg-good'
                : 'bg-muted'
            }`}
          />

        </div>

        {/* OPTIONAL HEADER NAME */}

        {hasActiveSession &&
          preferences.showNameInHeader && (

          <div className="hidden min-w-0 max-w-[110px] flex-col text-left sm:flex">

            <span className="truncate text-[11.5px] font-semibold text-ink">

              {displayName}

            </span>

            <span className="truncate text-[10px] text-muted">

              {profileRole}

            </span>

          </div>

        )}

        {!hasActiveSession && (

          <span className="hidden text-xs font-semibold text-ink sm:inline">

            Sign In

          </span>

        )}

        <IconChevronDown
          className={`h-3 w-3 shrink-0 text-muted transition-transform duration-200 ${
            isOpen
              ? 'rotate-180 text-accent'
              : ''
          }`}
        />

      </button>

      {/* =====================================================
          PROFILE DROPDOWN PANEL
      ====================================================== */}

      {isOpen && (

        <div
          id="profile-dropdown-menu"
          data-testid="profile-dropdown-menu"
          role="dialog"
          aria-labelledby="profile-menu-button"
          style={{
            backgroundColor:
              'rgba(6, 20, 28, 0.96)',

            backdropFilter:
              'blur(24px) saturate(140%)',

            WebkitBackdropFilter:
              'blur(24px) saturate(140%)',

            border:
              '1px solid rgba(255, 255, 255, 0.16)',

            boxShadow:
              '0 20px 60px rgba(0, 0, 0, 0.75)',
          }}
          className="absolute right-0 top-full z-50 mt-2 flex max-h-[calc(100vh-90px)] w-[300px] max-w-[calc(100vw-24px)] flex-col gap-2.5 overflow-y-auto rounded-2xl p-3.5 text-left shadow-2xl animate-in zoom-in-95 duration-150 sm:w-[320px]"
        >

          {hasActiveSession ? (

            <>

              {/* PROFILE SUMMARY */}

              <div className="flex items-center gap-3 border-b border-line/60 pb-3">

                <div className="group relative shrink-0">

                  <ProfileAvatar
                    name={profileName}
                    src={profileAvatar}
                    size={48}
                  />

                  {canUpdateProfile && (

                    <button
                      type="button"
                      onClick={handleUploadPicture}
                      aria-label="Change profile picture"
                      title="Change profile picture"
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-accent text-on-accent shadow-md"
                    >

                      <IconCamera className="w-3 h-3" />

                    </button>

                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <h3 className="truncate font-display text-[14px] font-bold text-ink">

                    {displayName}

                  </h3>

                  <p className="mt-0.5 truncate text-[11px] font-medium text-muted">

                    {profileRole}

                  </p>

                  <p
                    title={profileEmail}
                    className="mt-0.5 truncate text-[10.5px] text-muted"
                  >

                    {profileEmail}

                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">

                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">

                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      Active Session

                    </span>

                    {authProvider === 'google' && (

                      <span className="inline-flex items-center gap-1 rounded border border-line bg-surface2 px-1.5 py-0.5 text-[9px] text-muted">

                        <IconGoogle className="h-2.5 w-2.5" />

                        Local SSO

                      </span>

                    )}

                  </div>

                </div>

              </div>

              {/* =============================================
                  PROFILE INFORMATION MENU
              ============================================== */}

              <div>

                <span className="mb-1 block px-2 text-[10px] font-bold uppercase tracking-wider text-muted">

                  My Account

                </span>

                <ProfileMenuItem
                  icon={UserIcon}
                  label="My Profile"
                  onClick={() =>
                    openProfileModal('overview')
                  }
                />

                {canUpdateProfile && (

                  <ProfileMenuItem
                    icon={EditIcon}
                    label="Edit Profile"
                    onClick={() =>
                      openProfileModal(
                        'personal',
                        true
                      )
                    }
                  />

                )}

                <ProfileMenuItem
                  icon={ContactIcon}
                  label="Personal Information"
                  onClick={() =>
                    openProfileModal('personal')
                  }
                />

                <ProfileMenuItem
                  icon={ContactIcon}
                  label="Contact Information"
                  onClick={() =>
                    openProfileModal('contact')
                  }
                />

                <ProfileMenuItem
                  icon={EmploymentIcon}
                  label="Employment Details"
                  onClick={() =>
                    openProfileModal('employment')
                  }
                />

                {canUpdateProfile && (

                  <ProfileMenuItem
                    icon={IconCamera}
                    label={
                      profileAvatar
                        ? 'Change Profile Picture'
                        : 'Upload Profile Picture'
                    }
                    onClick={() =>
                      openProfileModal('settings')
                    }
                  />

                )}

              </div>

              {/* =============================================
                  ATTENDANCE & LEAVE

                  Opens existing common attendance popup.
              ============================================== */}

              <div className="border-t border-line/50 pt-2">

                <span className="mb-1 block px-2 text-[10px] font-bold uppercase tracking-wider text-muted">

                  Attendance

                </span>

                <ProfileMenuItem
                  icon={CalendarIcon}
                  label="Attendance History"
                  onClick={handleAttendanceHistory}
                />

                <ProfileMenuItem
                  icon={LeaveIcon}
                  label="Leave Management"
                  onClick={handleAttendanceHistory}
                />

              </div>

              {/* =============================================
                  SETTINGS & SECURITY
              ============================================== */}

              <div className="border-t border-line/50 pt-2">

                <span className="mb-1 block px-2 text-[10px] font-bold uppercase tracking-wider text-muted">

                  Settings & Security

                </span>

                <ProfileMenuItem
                  icon={SettingsIcon}
                  label="Account Settings"
                  onClick={() =>
                    openProfileModal('settings')
                  }
                />

                <ProfileMenuItem
                  icon={PasswordIcon}
                  label="Change Password"
                  onClick={() =>
                    openProfileModal('security')
                  }
                />

                {canReadAccess && (

                  <ProfileMenuItem
                    icon={IconKey}
                    label="Access Management"
                    onClick={handleAccessManagement}
                  />

                )}

              </div>

              {/* ACTIVE SESSION LOCATION */}

              <div className="flex items-center justify-between gap-2 rounded-lg border border-line/50 bg-surface2/30 px-3 py-2">

                <span className="flex items-center gap-1.5 text-[10.5px] text-muted">

                  <ProfileIcon
                    name="location"
                    className="w-3.5 h-3.5"
                  />

                  Office Location

                </span>

                <span
                  title={profileLocation}
                  className="max-w-[135px] truncate text-[11px] font-semibold text-ink"
                >

                  {profileLocation}

                </span>

              </div>

              {/* =============================================
                  SIGN OUT
              ============================================== */}

              <div className="border-t border-line/60 pt-2">

                <button
                  type="button"
                  data-testid="sign-out-button"
                  onClick={handleSignOut}
                  className="group flex w-full items-center justify-between gap-2 rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2.5 text-[12px] font-semibold text-rose-300 transition-colors hover:border-rose-400/40 hover:bg-rose-400/15"
                >

                  <span className="flex items-center gap-2">

                    <IconLogOut className="w-4 h-4" />

                    Sign Out

                  </span>

                  <ProfileIcon
                    name="chevron"
                    className="w-3.5 h-3.5"
                  />

                </button>

              </div>

            </>

          ) : (

            /* ===============================================
               SIGNED OUT STATE
            ================================================ */

            <>

              <div className="flex items-center gap-3 border-b border-line/60 pb-3">

                <ProfileAvatar
                  name="Guest User"
                  src={null}
                  size={48}
                />

                <div>

                  <h3 className="font-display text-[14px] font-bold text-ink">

                    Signed Out

                  </h3>

                  <p className="mt-0.5 text-xs text-muted">

                    Guest Mode

                  </p>

                </div>

              </div>

              <div className="rounded-xl border border-line bg-surface2/30 p-3">

                <h4 className="text-[13px] font-semibold text-ink">

                  Technomold IT Administration

                </h4>

                <p className="mt-2 text-xs leading-relaxed text-muted">

                  Sign in to access user accounts,
                  technical access management,
                  IT assets, helpdesk, software
                  licences and security activity.

                </p>

              </div>

              <button
                type="button"
                data-testid="sign-in-button"
                data-testid-google="google-signin-button"
                onClick={handleSignIn}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[12.5px] font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
              >

                <IconGoogle className="w-4 h-4" />

                Sign in with Google

              </button>

              <p className="text-center text-[10px] text-muted">

                Frontend SSO · Simulated authentication

              </p>

            </>

          )}

        </div>

      )}

      {/* =====================================================
          PROFILE DETAILS MODAL

          Opens above the current dashboard.
          Does not replace dashboard navigation.
      ====================================================== */}

      {activeModal && hasActiveSession && (

        <ProfileDetailsModal
          currentUser={currentUser}
          employee={employee}
          profileName={profileName}
          profileRole={profileRole}
          profileEmail={profileEmail}
          profileAvatar={profileAvatar}
          authProvider={authProvider}
          preferences={preferences}
          initialTab={activeModal.tab}
          initialEdit={activeModal.edit}
          canUpdateProfile={canUpdateProfile}
          canReadSettings={canReadSettings}
          canReadAccess={canReadAccess}
          onSavePreferences={savePreferences}
          onUploadPicture={handleUploadPicture}
          onRemovePicture={handleRemovePicture}
          onOpenAttendance={handleAttendanceHistory}
          onOpenSystemSettings={handleSystemSettings}
          onOpenAccessManagement={handleAccessManagement}
          onClose={closeProfileModal}
        />

      )}

    </div>
  );
}

// ============================================================
// PUBLIC PROFILE COMPONENT
// ============================================================

export function ProfileDropdown() {
  const {
    isAuthenticated,
    authProvider,
    currentUser,
    users = [],
    updateProfilePicture,
    removeProfilePicture,
    signInWithGoogle,
    signOut,
    navigate,
    showToast,
    hasPermission,
  } = useStore();

  const identity =
    isAuthenticated && currentUser
      ? getUserKey(currentUser)
      : 'guest';

  return (
    <ProfileDropdownContent
      key={identity}
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      authProvider={authProvider}
      users={users}
      updateProfilePicture={updateProfilePicture}
      removeProfilePicture={removeProfilePicture}
      signInWithGoogle={signInWithGoogle}
      signOut={signOut}
      navigate={navigate}
      showToast={showToast}
      hasPermission={hasPermission}
    />
  );
}

export default ProfileDropdown;
