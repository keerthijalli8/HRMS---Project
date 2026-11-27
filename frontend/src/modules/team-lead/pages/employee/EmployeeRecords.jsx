import EmployeeTimesheet from './EmployeeTimesheet.jsx';
import AttendanceRegularizationPanel from './AttendanceRegularizationPanel.jsx';
import {
  readEmployeeProfileEdits,
  saveEmployeeProfileEdits
} from '../../utils/employeeData.js';

import {
  Eye as EmployeeDocumentEye,
  Download as EmployeeDocumentDownload
} from 'lucide-react';

import * as EmployeeProfileReact from 'react';
import {
  Pencil as EmployeeEditIcon,
  Camera as EmployeeCameraIcon
} from 'lucide-react';

import React, { useState, useRef } from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { ModalPortal } from '../../components/common/ModalPortal.jsx';
import { formatDate } from '../../utils/helpers.js';
import { teamPerformanceScore } from '../../data/mockData.js';

import {
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Target,
  X,
  XCircle,
  CalendarDays,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';

import {
  filterOwnLeaveRequests,
  getEmployeeId,
  getEmployeeProfile
} from '../../utils/employeeData.js';

// ============================================================
// COMMON CONFIGURATION
// ============================================================

const cardClass = 'glass-card !p-5';

const eyebrowClass =
  'text-xs font-medium uppercase tracking-wider text-muted';

const MAX_LEAVE_REASON_LENGTH = 1000;

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Optional Holiday',
  'Unpaid Leave'
];

const LEAVE_BALANCE_KEYS = {
  'Casual Leave': 'casual',
  'Sick Leave': 'sick',
  'Earned Leave': 'earned',
  'Annual Leave': 'earned',
  'Optional Holiday': 'optional',
  'Unpaid Leave': 'unpaid'
};

const INITIAL_LEAVE_FORM = {
  requestType: 'Casual Leave',
  fromDate: '',
  toDate: '',
  reason: ''
};

// ============================================================
// COMMON HELPERS
// ============================================================

const normalize = value =>
  String(value || '').trim().toLowerCase();

const displayValue = value => {
  if (value == null || value === '') {
    return 'Not available';
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value.label || value.address) {
    return value.label || value.address;
  }

  const parts = [
    value.line1,
    value.line2,
    value.city,
    value.state,
    value.postalCode,
    value.country
  ].filter(Boolean);

  return parts.length
    ? parts.join(', ')
    : 'Not available';
};

const formatTimestamp = timestamp => {
  if (!timestamp) return '—';

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const normalizeDateKey = value => {
  const text = String(value || '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return '';
  }

  const date = new Date(`${text}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    return '';
  }

  return text;
};

const formatLeaveDate = value => {
  const dateKey = normalizeDateKey(value);

  if (!dateKey) return '—';

  return new Date(
    `${dateKey}T00:00:00`
  ).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const calculateLeaveDays = (fromDate, toDate) => {
  const start = normalizeDateKey(fromDate);
  const end = normalizeDateKey(toDate);

  if (!start || !end || end < start) {
    return 0;
  }

  return Math.round(
    (
      Date.parse(`${end}T00:00:00Z`) -
      Date.parse(`${start}T00:00:00Z`)
    ) / 86400000
  ) + 1;
};

const ownStatusClass = status => {
  const normalized = normalize(status);

  if (
    normalized.includes('reject') ||
    normalized.includes('overdue')
  ) {
    return 'border-bad/30 bg-bad/10 text-bad';
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('progress')
  ) {
    return 'border-line bg-surface2 text-muted';
  }

  if (
    normalized.includes('approved') ||
    normalized === 'completed'
  ) {
    return 'border-good/30 bg-good/10 text-good';
  }

  return 'border-line bg-surface2 text-muted';
};

const useOwnProfile = () => {
  const {
    currentUser,
    teamMembers = []
  } = useTeamLead();

  return getEmployeeProfile(
    currentUser,
    teamMembers
  );
};

// ============================================================
// COMMON COMPONENTS
// ============================================================

const InfoRows = ({ rows }) => (
  <dl className="grid gap-2 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        key={label}
        className="grid min-h-[84px] grid-cols-[minmax(6rem,0.4fr)_minmax(0,1fr)] items-start gap-2 rounded-xl border border-line/50 bg-surface2/35 p-3"
      >
        <dt className="text-sm font-semibold text-muted">
          {label} :
        </dt>

        <dd className="break-words text-sm font-normal text-ink">
          {displayValue(value)}
        </dd>
      </div>
    ))}
  </dl>
);

const PageHeader = ({
  section,
  title,
  description
}) => (
  <header
    className={`${cardClass} flex min-h-[112px] flex-col justify-center`}
  >
    <p className={eyebrowClass}>
      {section}
    </p>

    <h2 className="mt-1 font-display text-xl font-semibold text-ink">
      {title}
    </h2>

    <p className="mt-1 text-xs text-muted">
      {description}
    </p>
  </header>
);

// ============================================================
// EMPLOYEE PERSONAL INFORMATION
// ============================================================

// ============================================================
// EMPLOYEE_PROFILE_UI_V2
// ============================================================

const cleanProfileValue = value =>
  String(value ?? '')
    .replace(/\s*\(Demo\)\s*$/i, '')
    .trim();

const readPersonalProfile = readEmployeeProfileEdits;

const writePersonalProfile = saveEmployeeProfileEdits;
const PERSONAL_FIELDS = [
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    type: 'date'
  },
  {
    key: 'gender',
    label: 'Gender',
    options: [
      'Male',
      'Female',
      'Other',
      'Prefer not to say',
      'Not specified'
    ]
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group',
    options: [
      'A+', 'A-',
      'B+', 'B-',
      'AB+', 'AB-',
      'O+', 'O-',
      'Unknown'
    ]
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    options: [
      'Single',
      'Married',
      'Divorced',
      'Widowed',
      'Prefer not to say'
    ]
  },
  {
    key: 'nationality',
    label: 'Nationality'
  }
];

const CONTACT_FIELDS = [
  {
    key: 'personalEmail',
    label: 'Personal Email',
    type: 'email'
  },
  {
    key: 'mobileNumber',
    label: 'Mobile Number',
    type: 'tel'
  },
  {
    key: 'alternatePhone',
    label: 'Alternate Mobile Number',
    type: 'tel'
  },
  {
    key: 'currentAddress',
    label: 'Current Address',
    multiline: true
  },
  {
    key: 'permanentAddress',
    label: 'Permanent Address',
    multiline: true
  },
  {
    key: 'emergencyContact',
    label: 'Emergency Contact'
  }
];

const employeeInputClass = `
  w-full min-w-0 rounded-xl
  border border-line bg-surface2
  px-4 py-3 text-sm text-ink
  outline-none transition
  focus:border-accent
`;

const employeeEditButton = `
  inline-flex items-center justify-center
  gap-2 rounded-xl border border-accent/30
  bg-accent/10 px-4 py-2.5
  text-xs font-semibold text-accent
  transition hover:bg-accent/20
`;

const EmployeeDetailGrid = ({ rows }) => (
  <dl className="grid gap-4 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        key={label}
        className="
          min-w-0 rounded-xl
          border border-line/50
          bg-surface2/35 px-5 py-4
        "
      >
        <dt className="
          mb-2 text-xs font-medium text-muted
        ">
          {label}
        </dt>

        <dd className="
          break-words text-sm
          font-medium leading-relaxed text-ink
        ">
          {displayValue(value)}
        </dd>
      </div>
    ))}
  </dl>
);

// ============================================================
// REUSABLE EDITABLE INFORMATION SECTION
// ============================================================

const EditableEmployeeDetails = ({
  title,
  fields,
  values,
  readonlyRows = [],
  onSave,
  buttonLabel = 'Edit'
}) => {

  const [editing, setEditing] =
    EmployeeProfileReact.useState(false);

  const [draft, setDraft] =
    EmployeeProfileReact.useState({});

  const [error, setError] =
    EmployeeProfileReact.useState('');

  const [message, setMessage] =
    EmployeeProfileReact.useState('');

  const startEditing = () => {

    const initialValues = {};

    fields.forEach(field => {
      initialValues[field.key] =
        cleanProfileValue(values[field.key]);
    });

    setDraft(initialValues);
    setError('');
    setMessage('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft({});
    setError('');
    setEditing(false);
  };

  const saveDetails = event => {

    event.preventDefault();

    setError('');

    const updated = {};

    fields.forEach(field => {
      updated[field.key] = String(
        draft[field.key] ?? ''
      ).trim();
    });

    if (
      updated.dateOfBirth &&
      (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          updated.dateOfBirth
        ) ||
        Number.isNaN(
          Date.parse(updated.dateOfBirth)
        ) ||
        new Date(
          updated.dateOfBirth + 'T00:00:00'
        ) > new Date()
      )
    ) {
      setError('Enter a valid date of birth.');
      return;
    }

    if (
      updated.personalEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        updated.personalEmail
      )
    ) {
      setError('Enter a valid personal email.');
      return;
    }

    for (const key of [
      'mobileNumber',
      'alternatePhone'
    ]) {

      const phone = updated[key];

      if (
        phone &&
        (
          !/^[+\d\s()-]+$/.test(phone) ||
          phone.replace(/\D/g, '').length < 7 ||
          phone.replace(/\D/g, '').length > 15
        )
      ) {
        setError('Enter a valid mobile number.');
        return;
      }
    }

    try {

      onSave(updated);

      setEditing(false);

      setMessage(
        'Information updated successfully.'
      );

    } catch {

      setError(
        'Unable to save changes. Please try again.'
      );

    }
  };

  return (
    <section className={cardClass}>

      <div className="
        mb-5 flex flex-wrap items-center
        justify-between gap-3
        border-b border-line/60 pb-4
      ">

        <h2 className="
          font-display text-base
          font-semibold text-ink
        ">
          {title}
        </h2>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className={employeeEditButton}
          >
            <EmployeeEditIcon className="h-4 w-4" />
            {buttonLabel}
          </button>
        )}

      </div>

      {message && !editing && (
        <p
          role="status"
          className="
            mb-4 rounded-xl bg-good/10
            px-4 py-3 text-xs text-good
          "
        >
          {message}
        </p>
      )}

      {!editing ? (

        <EmployeeDetailGrid
          rows={[
            ...readonlyRows,
            ...fields.map(field => [
              field.label,
              field.type === 'date' &&
              values[field.key]
                ? formatDate(values[field.key])
                : cleanProfileValue(
                    values[field.key]
                  )
            ])
          ]}
        />

      ) : (

        <form
          onSubmit={saveDetails}
          className="space-y-5"
        >

          {readonlyRows.length > 0 && (
            <EmployeeDetailGrid
              rows={readonlyRows}
            />
          )}

          <div className="
            grid gap-4 sm:grid-cols-2
          ">

            {fields.map(field => (

              <div
                key={field.key}
                className={
                  field.multiline
                    ? 'sm:col-span-2'
                    : ''
                }
              >

                <label
                  htmlFor={`employee-${field.key}`}
                  className="
                    mb-2 block text-xs
                    font-medium text-muted
                  "
                >
                  {field.label}
                </label>

                {field.options ? (

                  <select
                    id={`employee-${field.key}`}
                    value={
                      draft[field.key] || ''
                    }
                    onChange={event =>
                      setDraft(previous => ({
                        ...previous,
                        [field.key]:
                          event.target.value
                      }))
                    }
                    className={employeeInputClass}
                  >

                    <option value="">
                      Select {field.label}
                    </option>

                    {draft[field.key] &&
                      !field.options.includes(
                        draft[field.key]
                      ) && (
                        <option
                          value={draft[field.key]}
                        >
                          {draft[field.key]}
                        </option>
                    )}

                    {field.options.map(option => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}

                  </select>

                ) : field.multiline ? (

                  <textarea
                    id={`employee-${field.key}`}
                    value={
                      draft[field.key] || ''
                    }
                    rows={3}
                    maxLength={500}
                    onChange={event =>
                      setDraft(previous => ({
                        ...previous,
                        [field.key]:
                          event.target.value
                      }))
                    }
                    className={employeeInputClass}
                  />

                ) : (

                  <input
                    id={`employee-${field.key}`}
                    type={field.type || 'text'}
                    value={
                      draft[field.key] || ''
                    }
                    maxLength={200}
                    max={
                      field.type === 'date'
                        ? new Date()
                            .toISOString()
                            .slice(0, 10)
                        : undefined
                    }
                    onChange={event =>
                      setDraft(previous => ({
                        ...previous,
                        [field.key]:
                          event.target.value
                      }))
                    }
                    className={employeeInputClass}
                  />

                )}

              </div>

            ))}

          </div>

          {error && (
            <p
              role="alert"
              className="
                rounded-xl bg-bad/10
                p-3 text-xs text-bad
              "
            >
              {error}
            </p>
          )}

          <div className="
            flex flex-wrap justify-end gap-3
            border-t border-line/60 pt-4
          ">

            <button
              type="button"
              onClick={cancelEditing}
              className="
                rounded-xl border border-line
                bg-surface2 px-5 py-2.5
                text-xs font-semibold text-ink
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                rounded-xl bg-accent
                px-5 py-2.5 text-xs
                font-bold text-on-accent
                hover:brightness-110
              "
            >
              Save Changes
            </button>

          </div>

        </form>

      )}

    </section>
  );
};

// ============================================================
// PROFILE PICTURE PROCESSING
// ============================================================

const prepareEmployeePhoto = file =>
  new Promise((resolve, reject) => {

    if (
      !file ||
      ![
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.type)
    ) {
      reject(
        new Error('Select a JPG, PNG or WebP image.')
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(
        new Error('Image must be smaller than 5 MB.')
      );
      return;
    }

    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error('Unable to read image.'));

    reader.onload = () => {

      const image = new Image();

      image.onerror = () =>
        reject(new Error('Invalid image file.'));

      image.onload = () => {

        try {

          const size = Math.min(
            image.width,
            image.height
          );

          if (!size) {
            throw new Error('Invalid image.');
          }

          const canvas =
            document.createElement('canvas');

          canvas.width = 512;
          canvas.height = 512;

          const context =
            canvas.getContext('2d');

          if (!context) {
            throw new Error(
              'Image processing unavailable.'
            );
          }

          context.fillStyle = '#ffffff';

          context.fillRect(0, 0, 512, 512);

          context.drawImage(
            image,
            (image.width - size) / 2,
            (image.height - size) / 2,
            size,
            size,
            0,
            0,
            512,
            512
          );

          resolve(
            canvas.toDataURL('image/jpeg', 0.85)
          );

        } catch (error) {
          reject(error);
        }
      };

      image.src = String(reader.result);

    };

    reader.readAsDataURL(file);

  });

// ============================================================
// PERSONAL INFORMATION
// ============================================================

const PersonalProfileWorkspace = ({
  profile
}) => {

  const employeeId = profile.employeeId;

  const [saved, setSaved] =
    EmployeeProfileReact.useState(
      () => readPersonalProfile(profile.profileEditId || employeeId)
    );

  const [photoPreview, setPhotoPreview] =
    EmployeeProfileReact.useState('');

  const [photoError, setPhotoError] =
    EmployeeProfileReact.useState('');

  const [photoMessage, setPhotoMessage] =
    EmployeeProfileReact.useState('');

  const [photoLoading, setPhotoLoading] =
    EmployeeProfileReact.useState(false);

  const photoInput =
    EmployeeProfileReact.useRef(null);

  const values = {
    dateOfBirth:
      profile.dateOfBirth ||
      profile.dob ||
      '2000-01-01',

    gender:
      cleanProfileValue(profile.gender) ||
      'Not specified',

    bloodGroup:
      cleanProfileValue(profile.bloodGroup) ||
      'O+',

    maritalStatus:
      cleanProfileValue(profile.maritalStatus) ||
      'Single',

    nationality:
      cleanProfileValue(profile.nationality) ||
      'Indian',

    ...saved
  };

  const photo =
    Object.prototype.hasOwnProperty.call(saved, 'avatarUrl')
      ? saved.avatarUrl
      : profile.avatarUrl || profile.photoUrl;

  const saveProfile = updates => {

    const result = writePersonalProfile(profile.profileEditId || employeeId, updates);

    setSaved(result);
  };

  const selectPhoto = async event => {

    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file || photoLoading) return;

    setPhotoError('');
    setPhotoMessage('');
    setPhotoPreview('');
    setPhotoLoading(true);

    try {

      const result =
        await prepareEmployeePhoto(file);

      setPhotoPreview(result);

    } catch (error) {

      setPhotoError(error.message);

    } finally {

      setPhotoLoading(false);

    }
  };

  const savePhoto = () => {

    if (!photoPreview) return;

    try {

      saveProfile({
        avatarUrl: photoPreview
      });

      setPhotoPreview('');

      setPhotoMessage(
        'Profile photo updated successfully.'
      );

    } catch {

      setPhotoError(
        'Unable to save profile photo.'
      );

    }
  };

  return (
    <div className="space-y-5">

      {/* PROFILE CARD */}

      <section className={cardClass}>

        <div className="
          flex flex-wrap items-center
          gap-5 sm:gap-7
        ">

          <div className="flex flex-col items-center gap-3">

            {photoPreview || photo ? (

              <img
                src={photoPreview || photo}
                alt="Employee profile"
                className="
                  h-24 w-24 rounded-full
                  border-2 border-accent/40
                  object-cover shadow-md
                  sm:h-28 sm:w-28
                "
              />

            ) : (

              <span className="
                flex h-24 w-24 items-center
                justify-center rounded-full
                border-2 border-accent/40
                bg-surface2 text-3xl font-bold
                text-accent sm:h-28 sm:w-28
              ">

                {String(
                  profile.name ||
                  profile.fullName ||
                  'E'
                ).slice(0, 1).toUpperCase()}

              </span>

            )}

            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={selectPhoto}
            />

            {!photoPreview && (
              <button
                type="button"
                disabled={photoLoading}
                onClick={() =>
                  photoInput.current?.click()
                }
                className="
                  inline-flex items-center gap-2
                  text-xs font-semibold text-accent
                  hover:underline
                  disabled:opacity-50
                "
              >
                <EmployeeCameraIcon className="h-4 w-4" />

                {photoLoading
                  ? 'Processing...'
                  : 'Edit Photo'}

              </button>
            )}

            {photoPreview && (

              <div className="
                flex flex-wrap gap-2
              ">

                <button
                  type="button"
                  onClick={() =>
                    setPhotoPreview('')
                  }
                  className="
                    rounded-lg border border-line
                    px-3 py-2 text-xs text-muted
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={savePhoto}
                  className="
                    rounded-lg bg-accent
                    px-3 py-2 text-xs
                    font-semibold text-on-accent
                  "
                >
                  Save Photo
                </button>

              </div>

            )}

          </div>

          <div className="
            min-w-0 flex-1 space-y-2
          ">

            <h1 className="
              break-words font-display
              text-xl font-semibold text-ink
            ">

              {displayValue(
                profile.name || profile.fullName
              )}

            </h1>

            <p className="
              text-sm font-medium text-accent
            ">
              {displayValue(profile.designation)}
            </p>

            <p className="text-xs text-muted">
              {displayValue(profile.department)}
            </p>

            <span className="
              inline-flex rounded-lg
              border border-line
              bg-surface2 px-3 py-1.5
              text-xs font-medium text-muted
            ">
              {displayValue(employeeId)}
            </span>

          </div>

        </div>

        {photoError && (
          <p
            role="alert"
            className="mt-4 text-xs text-bad"
          >
            {photoError}
          </p>
        )}

        {photoMessage && (
          <p
            role="status"
            className="mt-4 text-xs text-good"
          >
            {photoMessage}
          </p>
        )}

      </section>

      <EditableEmployeeDetails
        title="Personal Details"
        buttonLabel="Edit Profile"
        fields={PERSONAL_FIELDS}
        values={values}
        onSave={saveProfile}
        readonlyRows={[
          [
            'Full Name',
            profile.name || profile.fullName
          ]
        ]}
      />

      <p className="px-1 text-[11px] text-muted">
        Unverified profile fields may contain sample
        information. Please review and update them.
      </p>

    </div>
  );
};

export const EmployeePersonalInformation = () => {

  const profile = useOwnProfile();

  if (!profile.employeeId) {
    return null;
  }

  return (
    <PersonalProfileWorkspace
      key={profile.employeeId}
      profile={profile}
    />
  );
};

// ============================================================
// CONTACT INFORMATION
// ============================================================

const ContactProfileWorkspace = ({
  profile
}) => {

  const [saved, setSaved] =
    EmployeeProfileReact.useState(
      () => readPersonalProfile(profile.profileEditId || profile.employeeId)
    );

  const values = {

    personalEmail:
      cleanProfileValue(
        profile.personalEmail
      ) || '',

    mobileNumber:
      cleanProfileValue(
        profile.mobileNumber || profile.phone
      ) || '0000000000',

    alternatePhone:
      cleanProfileValue(
        profile.alternatePhone
      ) || '0000000000',

    currentAddress:
      cleanProfileValue(
        profile.currentAddress ||
        profile.address ||
        profile.city
      ) || '',

    permanentAddress:
      cleanProfileValue(
        profile.permanentAddress
      ) || '',

    emergencyContact:
      cleanProfileValue(
        profile.emergencyContact
      ) || '',

    ...saved
  };

  const saveContact = updates => {

    const result = writePersonalProfile(profile.profileEditId || profile.employeeId, updates);

    setSaved(result);
  };

  return (
    <div className="space-y-4">

      <EditableEmployeeDetails
        title="Contact Details"
        fields={CONTACT_FIELDS}
        values={values}
        onSave={saveContact}
        readonlyRows={[
          [
            'Work Email',
            profile.workEmail || profile.email
          ]
        ]}
      />

      <p className="px-1 text-[11px] text-muted">
        Unverified contact fields may contain sample
        information.
      </p>

    </div>
  );
};

export const EmployeeContactInformation = () => {

  const profile = useOwnProfile();

  if (!profile.employeeId) {
    return null;
  }

  return (
    <ContactProfileWorkspace
      key={profile.employeeId}
      profile={profile}
    />
  );
};

// ============================================================
// EMPLOYMENT DETAILS
// ============================================================

export const EmployeeEmploymentDetails = () => {

  const profile = useOwnProfile();

  const rows = [
    [
      'Employee ID',
      profile.employeeId
    ],
    [
      'Designation',
      profile.designation || profile.role
    ],
    [
      'Department',
      profile.department || profile.dept
    ],
    [
      'Reporting Manager',
      profile.reportingManager
    ],
    [
      'Work Location',
      profile.workLocation ||
      profile.location ||
      profile.city
    ],
    [
      'Joining Date',
      profile.joiningDate || profile.joined
    ],
    [
      'Employment Type',
      profile.employmentType || profile.type
    ],
    [
      'Grade / Band',
      profile.grade ||
      profile.band ||
      profile.payrollSummary?.grade
    ]
  ];

  return (
    <div className="space-y-5">

      <section className={cardClass}>

        <div className="
          mb-5 flex flex-wrap items-center
          justify-between gap-3
          border-b border-line/60 pb-4
        ">

          <h2 className="
            font-display text-base
            font-semibold text-ink
          ">
            Employment Overview
          </h2>

          {profile.status && (
            <span className={`
              rounded-lg border px-3 py-1.5
              text-xs font-medium
              ${ownStatusClass(profile.status)}
            `}>
              {profile.status}
            </span>
          )}

        </div>

        <EmployeeDetailGrid rows={rows} />

      </section>

    </div>
  );
};

// ============================================================
// EMPLOYEE DOCUMENTS
// ============================================================
// ============================================================
// EMPLOYEE_DOCUMENTS_PERFORMANCE_V3
// ============================================================

const SAMPLE_EMPLOYEE_DOCUMENTS = [
  {
    id: 'sample-aadhaar',
    title: 'Aadhaar Card',
    category: 'Identity',
    description: 'Sample identity document attachment.'
  },
  {
    id: 'sample-pan',
    title: 'PAN Card',
    category: 'Identity',
    description: 'Sample tax identification attachment.'
  },
  {
    id: 'sample-ssc',
    title: '10th Class Certificate',
    category: 'Education',
    description: 'Sample secondary school certificate attachment.'
  },
  {
    id: 'sample-intermediate',
    title: 'Intermediate Certificate',
    category: 'Education',
    description: 'Sample higher secondary certificate attachment.'
  },
  {
    id: 'sample-degree',
    title: 'B.Tech Degree Certificate',
    category: 'Education',
    description: 'Sample undergraduate degree attachment.'
  },
  {
    id: 'sample-marks',
    title: 'B.Tech Marks Memo',
    category: 'Education',
    description: 'Sample academic marks memo attachment.'
  },
  {
    id: 'sample-resume',
    title: 'Resume',
    category: 'Professional',
    description: 'Sample employee resume attachment.'
  },
  {
    id: 'sample-offer',
    title: 'Offer Letter',
    category: 'Employment',
    description: 'Sample employment offer attachment.'
  },
  {
    id: 'sample-appointment',
    title: 'Appointment Letter',
    category: 'Employment',
    description: 'Sample appointment document attachment.'
  }
];

const createSampleDocumentText = (
  document,
  profile
) => [
  'TECHNOMOLD - EMPLOYEE DOCUMENTS',
  '',
  'SAMPLE DOCUMENT - NOT AN OFFICIAL RECORD',
  '',
  `Document: ${document.title}`,
  `Category: ${document.category}`,
  `Employee: ${profile.name || profile.fullName || 'Employee'}`,
  `Employee ID: ${profile.employeeId}`,
  '',
  document.description,
  '',
  'Sample attachment.',
  'It is not a verified certificate or identity document.',
  'Replace it with an authorized document when available.'
].join('\n');

const downloadSampleEmployeeDocument = (
  document,
  profile
) => {

  const content =
    createSampleDocumentText(
      document,
      profile
    );

  const blob = new Blob(
    [content],
    {
      type: 'text/plain;charset=utf-8'
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    window.document.createElement('a');

  link.href = url;

  link.download = `${
    document.title.replace(/[^a-zA-Z0-9 -]/g, '')
  } - Sample.txt`;

  window.document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
};

const safeEmployeeDocumentUrl = value => {

  if (!value || typeof value !== 'string') {
    return '';
  }

  try {

    const url = new URL(
      value,
      window.location.origin
    );

    return [
      'http:',
      'https:',
      'blob:'
    ].includes(url.protocol)
      ? url.href
      : '';

  } catch {
    return '';
  }
};

const EmployeeDocumentsWorkspace = ({
  profile
}) => {

  const [category, setCategory] =
    EmployeeProfileReact.useState('All');

  const [search, setSearch] =
    EmployeeProfileReact.useState('');

  const [preview, setPreview] =
    EmployeeProfileReact.useState(null);

  const source = Array.isArray(profile.documents)
    ? profile.documents
    : Array.isArray(profile.employeeDocuments)
      ? profile.employeeDocuments
      : [];

  const actualDocuments = source
    .filter(item =>
      item &&
      typeof item === 'object'
    )
    .map((item, index) => ({

      id: item.id || `actual-${index}`,

      title:
        item.title ||
        item.name ||
        'Employee Document',

      category:
        item.category ||
        item.type ||
        'Other',

      status:
        item.verificationStatus ||
        'On File',

      date:
        item.date ||
        item.uploadedAt,

      url: safeEmployeeDocumentUrl(
        item.documentUrl ||
        item.downloadUrl ||
        item.url
      ),

      sample: false
    }));

  const offer =
    profile.offerLetter ||
    profile.offerLetterDetails ||
    {};

  const offerUrl = safeEmployeeDocumentUrl(
    offer.documentUrl ||
    profile.offerLetterUrl
  );

  if (
    offerUrl &&
    !actualDocuments.some(item =>
      normalize(item.title) === 'offer letter'
    )
  ) {

    actualDocuments.push({
      id: 'employee-offer-letter',
      title: 'Offer Letter',
      category: 'Employment',
      status: 'On File',
      url: offerUrl,
      date: offer.sentDate || offer.sentAt,
      sample: false
    });

  }

  const documents = [

    ...actualDocuments,

    ...SAMPLE_EMPLOYEE_DOCUMENTS

      .filter(sample =>
        !actualDocuments.some(actual =>
          normalize(actual.title) ===
          normalize(sample.title)
        )
      )

      .map(item => ({
        ...item,
        sample: true,
        status: 'Sample Attachment'
      }))

  ];

  const categories = [
    'All',
    ...new Set(
      documents.map(item => item.category)
    )
  ];

  const filteredDocuments = documents.filter(
    item => {

      const matchesCategory =
        category === 'All' ||
        item.category === category;

      const matchesSearch =
        normalize(
          `${item.title} ${item.category}`
        ).includes(normalize(search));

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );

  return (
    <div className="space-y-5">

      {/* DOCUMENT SUMMARY */}

      <div className="
        grid gap-3 sm:grid-cols-3
      ">

        {[
          ['Total Documents', documents.length],
          [
            'Identity Documents',
            documents.filter(
              item => item.category === 'Identity'
            ).length
          ],
          [
            'Educational Documents',
            documents.filter(
              item => item.category === 'Education'
            ).length
          ]
        ].map(([label, count]) => (

          <article
            key={label}
            className={cardClass}
          >

            <div className="
              flex items-center justify-between
            ">

              <p className="text-xs text-muted">
                {label}
              </p>

              <FileText className="
                h-5 w-5 text-accent
              "/>

            </div>

            <p className="
              mt-3 font-data text-2xl
              font-bold text-ink
            ">
              {count}
            </p>

          </article>

        ))}

      </div>

      {/* FILTERS AND ATTACHMENTS */}

      <section className={cardClass}>

        <div className="
          mb-5 flex flex-wrap items-center
          justify-between gap-3
          border-b border-line/60 pb-4
        ">

          <h2 className="
            font-display text-base
            font-semibold text-ink
          ">
            My Documents
          </h2>

          <input
            type="search"
            placeholder="Search documents..."
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            className="
              w-full rounded-xl
              border border-line bg-surface2
              px-4 py-2.5 text-xs
              text-ink outline-none
              focus:border-accent
              sm:w-60
            "
          />

        </div>

        <div className="
          mb-5 flex flex-wrap gap-2
        ">

          {categories.map(item => (

            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`
                rounded-lg border px-4 py-2
                text-xs font-medium transition
                ${
                  category === item
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line bg-surface2 text-muted hover:text-ink'
                }
              `}
            >
              {item}
            </button>

          ))}

        </div>

        <div className="
          grid gap-4 lg:grid-cols-2
        ">

          {filteredDocuments.map(
            (document, index) => (

              <article
                key={`${document.id}-${index}`}
                className="
                  min-w-0 rounded-xl
                  border border-line/50
                  bg-surface2/35 p-4
                  transition
                  hover:border-accent/30
                "
              >

                <div className="
                  flex items-start gap-3
                ">

                  <div className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-xl border border-accent/20
                    bg-accent/10 text-accent
                  ">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="
                      break-words text-sm
                      font-semibold text-ink
                    ">
                      {document.title}
                    </h3>

                    <p className="
                      mt-1 text-xs text-muted
                    ">
                      {document.category}
                    </p>

                    <span className={`
                      mt-2 inline-flex rounded-md
                      border px-2 py-1 text-[10px]
                      ${
                        document.sample
                          ? 'border-line bg-surface2 text-muted'
                          : ownStatusClass(document.status)
                      }
                    `}>
                      {document.status}
                    </span>

                  </div>

                </div>

                <div className="
                  mt-4 flex flex-wrap
                  justify-end gap-2
                  border-t border-line/50 pt-3
                ">

                  {document.sample ? (

                    <>

                      <button
                        type="button"
                        onClick={() =>
                          setPreview(document)
                        }
                        className="
                          inline-flex items-center
                          gap-2 rounded-lg
                          border border-line
                          px-3 py-2 text-xs
                          font-medium text-ink
                          hover:border-accent/40
                        "
                      >
                        <EmployeeDocumentEye className="h-4 w-4" />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadSampleEmployeeDocument(
                            document,
                            profile
                          )
                        }
                        className="
                          inline-flex items-center
                          gap-2 rounded-lg
                          bg-accent/10 px-3 py-2
                          text-xs font-semibold
                          text-accent
                          hover:bg-accent/20
                        "
                      >
                        <EmployeeDocumentDownload className="h-4 w-4" />
                        Download
                      </button>

                    </>

                  ) : document.url ? (

                    <>

                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          rounded-lg border border-line
                          px-3 py-2 text-xs
                          font-medium text-ink
                        "
                      >
                        View
                      </a>

                      <a
                        href={document.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          rounded-lg bg-accent/10
                          px-3 py-2 text-xs
                          font-semibold text-accent
                        "
                      >
                        Download
                      </a>

                    </>

                  ) : (

                    <span className="
                      text-xs text-muted
                    ">
                      File unavailable
                    </span>

                  )}

                </div>

              </article>

            )
          )}

        </div>

        {!filteredDocuments.length && (

          <div className="
            rounded-xl border border-dashed
            border-line p-10 text-center
            text-sm text-muted
          ">
            No matching documents found.
          </div>

        )}

      </section>

      {/* DOCUMENT PREVIEW */}

      {preview && (

        <ModalPortal>

          <div
            className="
              fixed inset-0 z-[9999]
              flex items-center justify-center
              bg-black/70 p-4 backdrop-blur-sm
            "
          >

            <div
              role="dialog"
              aria-modal="true"
              aria-label={preview.title}
              className="
                w-full max-w-2xl
                max-h-[90vh] overflow-y-auto
                rounded-2xl border border-line
                bg-[#10242e] p-6 shadow-2xl
              "
            >

              <div className="
                mb-5 flex items-center
                justify-between gap-3
              ">

                <h2 className="
                  font-display text-lg
                  font-semibold text-ink
                ">
                  {preview.title}
                </h2>

                <button
                  type="button"
                  aria-label="Close document preview"
                  onClick={() =>
                    setPreview(null)
                  }
                  className="
                    rounded-lg border border-line
                    px-3 py-2 text-xs text-muted
                    hover:text-ink
                  "
                >
                  Close
                </button>

              </div>

              <div className="
                rounded-xl bg-white p-6
                text-[#20333b]
              ">

                <h3 className="
                  text-lg font-bold
                  text-[#143641]
                ">
                  TECHNOMOLD
                </h3>

                <p className="
                  mt-1 text-xs font-bold
                  text-[#9b3333]
                ">
                  SAMPLE DOCUMENT - NOT OFFICIAL
                </p>

                <div className="
                  my-5 border-t border-gray-300
                "/>

                <h4 className="
                  text-base font-semibold
                ">
                  {preview.title}
                </h4>

                <dl className="
                  mt-4 space-y-3 text-sm
                ">

                  <div>
                    <dt className="text-gray-500">
                      Employee Name
                    </dt>

                    <dd className="font-medium">
                      {profile.name || profile.fullName}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-gray-500">
                      Employee ID
                    </dt>

                    <dd className="font-medium">
                      {profile.employeeId}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-gray-500">
                      Category
                    </dt>

                    <dd className="font-medium">
                      {preview.category}
                    </dd>
                  </div>

                </dl>

                <p className="
                  mt-5 text-sm leading-relaxed
                ">
                  {preview.description}
                </p>

                <p className="
                  mt-5 rounded-lg
                  border border-gray-200
                  bg-gray-50 p-3
                  text-xs text-gray-600
                ">
                  Unverified sample document.
                </p>

              </div>

              <div className="
                mt-5 flex justify-end gap-2
              ">

                <button
                  type="button"
                  onClick={() =>
                    downloadSampleEmployeeDocument(
                      preview,
                      profile
                    )
                  }
                  className="
                    inline-flex items-center
                    gap-2 rounded-xl bg-accent
                    px-4 py-2.5 text-xs
                    font-semibold text-on-accent
                  "
                >
                  <EmployeeDocumentDownload className="h-4 w-4" />
                  Download Attachment
                </button>

              </div>

            </div>

          </div>

        </ModalPortal>

      )}

    </div>
  );
};

export const EmployeeDocuments = () => {

  const profile = useOwnProfile();

  if (!profile.employeeId) {
    return null;
  }

  return (
    <EmployeeDocumentsWorkspace
      key={profile.employeeId}
      profile={profile}
    />
  );
};

// ============================================================
// EMPLOYEE ATTENDANCE
// ============================================================
export const EmployeeAttendance = () => {
  const { currentUser } = useTeamLead();
  const attendance = useAttendance();

  const employeeId = getEmployeeId(currentUser);

  const history =
    Array.isArray(attendance?.attendanceHistory)
      ? attendance.attendanceHistory
      : [];

  const checkInDate =
    attendance?.checkInTimestamp
      ? new Date(attendance.checkInTimestamp)
      : null;

  const validCheckInDate =
    checkInDate &&
    !Number.isNaN(checkInDate.getTime());

  const records = history.length
    ? history
    : validCheckInDate
      ? [{
          dateKey:
            `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`,

          checkInTime:
            attendance.checkInTimestamp,

          checkOutTime:
            attendance.checkOutTimestamp,

          checkInLocation:
            attendance.checkInLocation,

          checkOutLocation:
            attendance.checkOutLocation,

          breakStartTime:
            attendance.breakStartTimestamp,

          accumulatedBreakSeconds:
            attendance.accumulatedBreakSeconds,

          accumulatedBreakMilliseconds:
            attendance.accumulatedBreakMilliseconds,

          status:
            attendance.status
        }]
      : [];

  const now = new Date();

  const monthKey =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const todayKey =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthRecords = records.filter(
    record =>
      String(record.dateKey || '').startsWith(monthKey)
  );

  const formatDuration = seconds => {
    const totalMinutes = Math.floor(
      Math.max(0, Number(seconds) || 0) / 60
    );

    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  const getBreakSeconds = record => {
    let seconds = Math.max(
      0,
      record.accumulatedBreakMilliseconds != null
        ? Number(record.accumulatedBreakMilliseconds) / 1000 || 0
        : Number(record.accumulatedBreakSeconds) || 0
    );

    if (
      record.breakStartTime &&
      !record.checkOutTime
    ) {
      const start = new Date(
        record.breakStartTime
      ).getTime();

      if (Number.isFinite(start)) {
        seconds += Math.max(
          0,
          Math.floor((Date.now() - start) / 1000)
        );
      }
    }

    return seconds;
  };

  const getWorkedSeconds = record => {
    if (!record.checkInTime) return null;

    const start = new Date(
      record.checkInTime
    ).getTime();

    const activeStart = attendance?.checkInTimestamp
      ? new Date(attendance.checkInTimestamp).getTime()
      : null;

    const endTime = record.checkOutTime
      ? new Date(record.checkOutTime).getTime()
      : (
          record.dateKey === todayKey ||
          start === activeStart
        )
        ? Date.now()
        : null;

    if (
      !Number.isFinite(start) ||
      endTime == null ||
      !Number.isFinite(endTime) ||
      endTime < start
    ) {
      return null;
    }

    return Math.max(
      0,
      Math.floor((endTime - start) / 1000) -
      getBreakSeconds(record)
    );
  };

  const monthWorkedSeconds =
    monthRecords.reduce(
      (total, record) =>
        total + (getWorkedSeconds(record) || 0),
      0
    );

  const monthBreakSeconds =
    monthRecords.reduce(
      (total, record) =>
        total + getBreakSeconds(record),
      0
    );

  const monthlySummary = [
    [
      'Days recorded this month',
      `${monthRecords.length}`
    ],
    [
      'Working hours this month',
      formatDuration(monthWorkedSeconds)
    ],
    [
      'Break time this month',
      formatDuration(monthBreakSeconds)
    ]
  ];

  const getAttendanceStatus = record => {
    if (record.checkOutTime) {
      return 'Checked Out';
    }

    if (record.breakStartTime) {
      return 'On Break';
    }

    if (record.checkInTime) {
      return 'Checked In';
    }

    return 'Not In';
  };

  return (
    <div className="space-y-5">
      

      <section className="grid gap-3 sm:grid-cols-3">
        {monthlySummary.map(([label, value]) => (
          <article
            key={label}
            className={`${cardClass} kpi-card !h-[140px] !p-5 flex flex-col justify-between`}
          >
            <p className={eyebrowClass}>
              {label}
            </p>

            <p className="mt-3 font-data text-2xl font-bold text-ink">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className={`${cardClass} min-h-[220px]`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Attendance Logs
            </h3>

            <p className="mt-1 text-[11px] text-muted">
              {records.length} personal record
              {records.length === 1 ? '' : 's'}
            </p>
          </div>

          <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
            {attendance?.checkInTimestamp
              ? attendance.status
              : 'Not Checked In'}
          </span>
        </div>

        {records.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  {[
                    'Date',
                    'Check In',
                    'Check Out',
                    'Working Hours',
                    'Break Time',
                    'Status',
                    'Location'
                  ].map(label => (
                    <th
                      key={label}
                      className="px-3 py-2 font-semibold"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={`${employeeId}-${record.dateKey}-${index}`}
                    className="border-b border-line/50 last:border-0"
                  >
                    <td className="px-3 py-3 font-semibold text-ink">
                      {formatDate(record.dateKey)}
                    </td>

                    <td className="px-3 py-3 tabular-nums text-ink">
                      {formatTimestamp(record.checkInTime)}
                    </td>

                    <td className="px-3 py-3 tabular-nums text-ink">
                      {formatTimestamp(record.checkOutTime)}
                    </td>

                    <td className="px-3 py-3 tabular-nums text-ink">
                      {getWorkedSeconds(record) == null
                        ? '—'
                        : formatDuration(getWorkedSeconds(record))}
                    </td>

                    <td className="px-3 py-3 tabular-nums text-ink">
                      {formatDuration(getBreakSeconds(record))}
                    </td>

                    <td className="px-3 py-3">
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${ownStatusClass(getAttendanceStatus(record))}`}>
                        {getAttendanceStatus(record)}
                      </span>
                    </td>

                    <td
                      className="max-w-[200px] truncate px-3 py-3 text-muted"
                      title={
                        record.checkInLocation?.label ||
                        record.checkInLocation?.address ||
                        ''
                      }
                    >
                      {record.checkInLocation?.label ||
                        record.checkInLocation?.address ||
                        'Not recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-8 text-center">
            <Clock className="mx-auto h-6 w-6 text-accent/70" />

            <p className="mt-2 text-sm font-semibold text-ink">
              No attendance logs yet
            </p>

            <p className="mt-1 text-xs text-muted">
              Your personal check-in and check-out records will appear here.
            </p>
          </div>
        )}
      </section>

      {/* EMPLOYEE_REGULARIZATION_INTEGRATION_V1 */}

      <AttendanceRegularizationPanel
        key={employeeId || 'no-account'}
        user={currentUser}
        records={records}
      />

          {/* EMPLOYEE_TIMESHEET_INTEGRATION_V1 */}

      <EmployeeTimesheet
        key={`timesheet-${employeeId || 'no-account'}`}
        user={currentUser}
      />

    </div>
  );
};
// ============================================================
// LEAVE WORKFLOW HELPERS
// ============================================================

const normalizeApproval = value => {
  const status = normalize(value);

  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return 'pending';
};

const getLeaveWorkflow = request => {
  let teamLeadApproval = normalizeApproval(
    request.teamLeadApproval ??
    request.managerApprovalStatus
  );

  let hrApproval = normalizeApproval(
    request.hrApproval ??
    request.hrApprovalStatus
  );

  const hasStages =
    request.teamLeadApproval != null ||
    request.managerApprovalStatus != null ||
    request.hrApproval != null ||
    request.hrApprovalStatus != null;

  if (!hasStages) {
    if (normalize(request.status) === 'approved') {
      teamLeadApproval = 'approved';
      hrApproval = 'approved';
    }

    if (normalize(request.status) === 'rejected') {
      teamLeadApproval = 'rejected';
    }
  }

  if (
    teamLeadApproval === 'rejected' ||
    hrApproval === 'rejected'
  ) {
    return {
      teamLeadApproval,
      hrApproval,
      status: 'rejected',
      stage: 'rejected',
      label: 'Rejected'
    };
  }

  if (
    teamLeadApproval === 'approved' &&
    hrApproval === 'approved'
  ) {
    return {
      teamLeadApproval,
      hrApproval,
      status: 'approved',
      stage: 'approved',
      label: 'Approved'
    };
  }

  if (teamLeadApproval === 'approved') {
    return {
      teamLeadApproval,
      hrApproval,
      status: 'pending',
      stage: 'hr-review',
      label: 'Pending HR Approval'
    };
  }

  return {
    teamLeadApproval,
    hrApproval,
    status: 'pending',
    stage: 'team-lead-review',
    label: 'Pending Team Lead'
  };
};

const getBalanceEntry = (
  leaveBalance,
  requestType
) => {
  const key = LEAVE_BALANCE_KEYS[requestType];

  if (!key || key === 'unpaid') {
    return null;
  }

  return leaveBalance?.[key] ||
    (
      key === 'earned'
        ? leaveBalance?.annual
        : null
    ) ||
    null;
};

const getNumericBalance = value => {
  if (
    value == null ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : null;
};

// ============================================================
// LEAVE BALANCE CARD
// ============================================================

const LeaveBalanceCard = ({
  label,
  balance
}) => {
  const remaining =
    getNumericBalance(balance?.remaining);

  const total =
    getNumericBalance(balance?.total);

  const progress =
    remaining !== null &&
    total !== null &&
    total > 0
      ? Math.max(
          0,
          Math.min(100, remaining / total * 100)
        )
      : 0;

  return (
    <article
      className={`${cardClass} kpi-card !min-h-[140px] !p-5 flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={eyebrowClass}>
          {label}
        </p>

        <CalendarDays className="h-4 w-4 text-accent" />
      </div>

      <p className="mt-3 font-data text-2xl font-bold text-ink">
        {remaining !== null
          ? `${remaining} days`
          : '—'}
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-[10px] text-muted">
        {total !== null
          ? `of ${total} days entitlement`
          : 'Entitlement unavailable'}
      </p>
    </article>
  );
};

// ============================================================
// APPROVAL STAGE ITEM
// ============================================================

const ApprovalStage = ({
  label,
  status
}) => {
  const approved = status === 'approved';
  const rejected = status === 'rejected';

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line/50 bg-surface2/35 p-3">
      {approved ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-good" />
      ) : rejected ? (
        <XCircle className="h-4 w-4 shrink-0 text-bad" />
      ) : (
        <Clock className="h-4 w-4 shrink-0 text-muted" />
      )}

      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">
          {label}
        </p>

        <p
          className={`mt-1 text-[10px] capitalize ${
            approved
              ? 'text-good'
              : rejected
                ? 'text-bad'
                : 'text-muted'
          }`}
        >
          {status === 'not-required'
            ? 'Not Required'
            : status === 'waiting'
              ? 'Awaiting Team Lead'
              : status}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// EMPLOYEE LEAVE REQUEST CARD
// ============================================================

const EmployeeLeaveRequestCard = ({
  request
}) => {
  const workflow = getLeaveWorkflow(request);

  const hrStatus =
    workflow.teamLeadApproval === 'rejected'
      ? 'not-required'
      : workflow.teamLeadApproval === 'pending' &&
        workflow.hrApproval === 'pending'
        ? 'waiting'
        : workflow.hrApproval;

  const duration = Number(request.totalDays);

  return (
    <article className="space-y-3 rounded-xl border border-line/50 bg-surface2/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {request.requestType || 'Leave Request'}
          </p>

          <p className="mt-1 text-[10px] font-data text-muted">
            {request.id}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />

            <span>
              {formatLeaveDate(request.fromDate)}
              {' – '}
              {formatLeaveDate(request.toDate)}
            </span>

            <span>·</span>

            <span className="font-data">
              {Number.isFinite(duration) && duration > 0
                ? duration
                : '—'} days
            </span>
          </div>
        </div>

        <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${ownStatusClass(workflow.status)}`}>
          {workflow.label}
        </span>
      </div>

      <div className="rounded-lg border border-line/40 bg-surface/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Leave reason
        </p>

        <p className="mt-1 break-words text-xs leading-relaxed text-ink">
          {request.reason || 'Not provided'}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ApprovalStage
          label="Team Lead Review"
          status={workflow.teamLeadApproval}
        />

        <ApprovalStage
          label="HR Review"
          status={hrStatus}
        />
      </div>

      {workflow.status === 'rejected' && (
        <div className="rounded-lg border border-bad/25 bg-bad/10 p-3">
          <div className="flex items-center gap-2 text-bad">
            <XCircle className="h-4 w-4" />

            <p className="text-xs font-semibold">
              {workflow.teamLeadApproval === 'rejected'
                ? 'Rejected by Team Lead'
                : 'Rejected by HR'}
            </p>
          </div>

          <p className="mt-2 break-words text-xs leading-relaxed text-bad">
            {request.decisionReason ||
              request.rejectionReason ||
              'No rejection comment recorded.'}
          </p>
        </div>
      )}

      {workflow.stage === 'hr-review' && (
        <p className="rounded-lg border border-accent/20 bg-accent/10 p-2.5 text-xs text-muted">
          Your Team Lead has approved this request.
          Final HR approval is pending.
        </p>
      )}

      {workflow.status === 'approved' && (
        <p className="rounded-lg border border-good/20 bg-good/10 p-2.5 text-xs text-good">
          Your leave request has received final approval.

          {request.balanceDeductionApplied === true &&
          normalize(request.requestType) !== 'unpaid leave'
            ? ' Leave balance has been adjusted.'
            : ''}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2 border-t border-line/50 pt-2 text-[10px] text-muted">
        <span>
          Submitted: {
            formatTimestamp(
              request.submittedAt ||
              request.requestDate
            )
          }
        </span>

        {request.decidedAt && (
          <span>
            Last reviewed: {
              formatTimestamp(request.decidedAt)
            }
          </span>
        )}
      </div>
    </article>
  );
};

// ============================================================
// EMPLOYEE LEAVE MANAGEMENT
// ============================================================

export const EmployeeLeave = () => {
  const {
    currentUser,
    teamMembers = [],
    myLeaveRequests = [],
    submitLeaveRequest,
    isLoading,
    loadError
  } = useTeamLead();

  const profile = getEmployeeProfile(
    currentUser,
    teamMembers
  );

  const employeeId = getEmployeeId(currentUser);

  const ownRequests = filterOwnLeaveRequests(
    myLeaveRequests,
    currentUser
  );

  const requests = [...ownRequests].sort(
    (first, second) =>
      new Date(
        second.submittedAt ||
        second.requestDate ||
        0
      ) -
      new Date(
        first.submittedAt ||
        first.requestDate ||
        0
      )
  );

  // ==========================================================
  // STATE
  // ==========================================================

  const [isApplyOpen, setIsApplyOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [form, setForm] =
    useState({
      ...INITIAL_LEAVE_FORM
    });

  const submitLock = useRef(false);

  // ==========================================================
  // LEAVE BALANCES
  // ==========================================================

  const leaveBalance =
    profile.leaveBalance || {};

  const leaveTypes = [
    [
      'Casual Leave',
      leaveBalance.casual
    ],
    [
      'Sick Leave',
      leaveBalance.sick
    ],
    [
      'Earned Leave',
      leaveBalance.earned ||
      leaveBalance.annual
    ],
    [
      'Optional Holiday',
      leaveBalance.optional
    ]
  ];

  const selectedBalance = getBalanceEntry(
    leaveBalance,
    form.requestType
  );

  const availableDays =
    getNumericBalance(selectedBalance?.remaining);

  const isUnpaidLeave =
    form.requestType === 'Unpaid Leave';

  const totalDays = calculateLeaveDays(
    form.fromDate,
    form.toDate
  );

  const selectedBalanceKey =
    LEAVE_BALANCE_KEYS[form.requestType];

  const reservedDays = requests.filter(
    request =>
      getLeaveWorkflow(request).status === 'pending' &&
      LEAVE_BALANCE_KEYS[request.requestType] ===
        selectedBalanceKey
  ).reduce(
    (sum, request) =>
      sum + Math.max(
        0,
        Number(request.totalDays) || 0
      ),
    0
  );

  const usableDays =
    availableDays === null
      ? null
      : Math.max(
          0,
          availableDays - reservedDays
        );

  // ==========================================================
  // REQUEST COUNTS
  // ==========================================================

  const pendingCount = requests.filter(
    request =>
      getLeaveWorkflow(request).status === 'pending'
  ).length;

  const pendingHRCount = requests.filter(
    request =>
      getLeaveWorkflow(request).stage === 'hr-review'
  ).length;

  const approvedCount = requests.filter(
    request =>
      getLeaveWorkflow(request).status === 'approved'
  ).length;

  const rejectedCount = requests.filter(
    request =>
      getLeaveWorkflow(request).status === 'rejected'
  ).length;

  const filterOptions = [
    {
      value: 'all',
      label: 'All Requests',
      count: requests.length
    },
    {
      value: 'pending',
      label: 'Pending',
      count: pendingCount
    },
    {
      value: 'hr-review',
      label: 'Pending HR',
      count: pendingHRCount
    },
    {
      value: 'approved',
      label: 'Approved',
      count: approvedCount
    },
    {
      value: 'rejected',
      label: 'Rejected',
      count: rejectedCount
    }
  ];

  // ==========================================================
  // FILTER REQUESTS
  // ==========================================================

  const filteredRequests = requests.filter(request => {
    const workflow = getLeaveWorkflow(request);
    const query = normalize(searchTerm);

    const searchableText = [
      request.id,
      request.requestType,
      request.reason,
      request.fromDate,
      request.toDate,
      workflow.label
    ].filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !query ||
      searchableText.includes(query);

    const matchesStatus =
      statusFilter === 'all' ||
      workflow.status === statusFilter ||
      workflow.stage === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==========================================================
  // FORM HANDLERS
  // ==========================================================

  const updateForm = (field, value) => {
    setForm(previous => {
      const next = {
        ...previous,
        [field]: value
      };

      if (
        field === 'fromDate' &&
        next.toDate &&
        next.toDate < value
      ) {
        next.toDate = '';
      }

      return next;
    });

    setFormError('');
  };

  const openApplyModal = () => {
    if (
      !employeeId ||
      isLoading ||
      loadError
    ) {
      return;
    }

    setForm({
      ...INITIAL_LEAVE_FORM
    });

    setFormError('');
    setIsApplyOpen(true);
  };

  const closeApplyModal = () => {
    if (
      isSubmitting ||
      submitLock.current
    ) {
      return;
    }

    setIsApplyOpen(false);
    setFormError('');
  };

  // ==========================================================
  // LEAVE OVERLAP VALIDATION
  // ==========================================================

  const hasOverlappingLeave = () => {
    const fromDate =
      normalizeDateKey(form.fromDate);

    const toDate =
      normalizeDateKey(form.toDate);

    if (!fromDate || !toDate) {
      return false;
    }

    return requests.some(request => {
      const workflow = getLeaveWorkflow(request);

      if (workflow.status === 'rejected') {
        return false;
      }

      const existingStart =
        normalizeDateKey(request.fromDate);

      const existingEnd =
        normalizeDateKey(request.toDate);

      return Boolean(
        existingStart &&
        existingEnd &&
        fromDate <= existingEnd &&
        toDate >= existingStart
      );
    });
  };

  const overlappingLeave =
    totalDays > 0 && hasOverlappingLeave();

  // ==========================================================
  // FORM VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (!employeeId) {
      return 'Employee profile is unavailable.';
    }

    if (!LEAVE_TYPES.includes(form.requestType)) {
      return 'Select a valid leave type.';
    }

    if (
      !normalizeDateKey(form.fromDate) ||
      !normalizeDateKey(form.toDate) ||
      totalDays <= 0
    ) {
      return 'Enter a valid leave date range.';
    }

    if (!form.reason.trim()) {
      return 'Enter a reason for your leave request.';
    }

    if (
      form.reason.trim().length >
      MAX_LEAVE_REASON_LENGTH
    ) {
      return 'Leave reason cannot exceed 1000 characters.';
    }

    if (overlappingLeave) {
      return 'A pending or approved leave request already overlaps the selected dates.';
    }

    if (
      !isUnpaidLeave &&
      usableDays !== null &&
      totalDays > usableDays
    ) {
      return 'Insufficient available leave balance.';
    }

    return '';
  };

  // ==========================================================
  // SUBMIT LEAVE REQUEST
  // ==========================================================

  const handleSubmit = async event => {
    event.preventDefault();

    if (
      submitLock.current ||
      isSubmitting
    ) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (
      typeof submitLeaveRequest !== 'function'
    ) {
      setFormError(
        'Leave request service is unavailable.'
      );

      return;
    }

    submitLock.current = true;

    setIsSubmitting(true);
    setFormError('');

    try {
      const result = await submitLeaveRequest({
        requestType: form.requestType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        totalDays,
        reason: form.reason.trim()
      });

      if (
        !result ||
        result.success === false
      ) {
        throw new Error(
          result?.message ||
          'Unable to submit leave request.'
        );
      }

      setForm({
        ...INITIAL_LEAVE_FORM
      });

      setIsApplyOpen(false);
      setStatusFilter('all');
      setSearchTerm('');

    } catch (error) {
      console.error(
        'Unable to submit personal leave request:',
        error
      );

      setFormError(
        error?.message ||
        'Unable to submit leave request.'
      );

    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // MAIN LEAVE MANAGEMENT UI
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* PAGE HEADER */}

      <header className={`${cardClass} flex min-h-[112px] flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className={eyebrowClass}>
            Leave Management
          </p>

          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            Your leave balance & requests
          </h2>

          <p className="mt-1 text-xs text-muted">
            Apply for leave, view available balances,
            and track Team Lead and HR approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={openApplyModal}
          disabled={
            !employeeId ||
            isLoading ||
            Boolean(loadError)
          }
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-on-accent transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Apply for Leave
        </button>
      </header>

      {/* LOADING AND ERROR STATES */}

      {isLoading && (
        <div className={`${cardClass} flex items-center gap-2 text-xs text-muted`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your leave records...
        </div>
      )}

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-bad/30 bg-bad/10 p-4 text-xs text-bad">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {/* LEAVE BALANCE CARDS */}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {leaveTypes.map(([label, balance]) => (
          <LeaveBalanceCard
            key={label}
            label={label}
            balance={balance}
          />
        ))}
      </section>

      {/* APPROVAL PROCESS */}

      <section className={`${cardClass} space-y-3`}>
        <div>
          <h3 className="font-display text-base font-semibold text-ink">
            Leave Approval Process
          </h3>

          <p className="mt-1 text-xs text-muted">
            Every leave application follows the Team Lead and HR review workflow.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              number: '01',
              title: 'Submit Request',
              description: 'Employee submits leave details.'
            },
            {
              number: '02',
              title: 'Team Lead Review',
              description: 'Team Lead approves or rejects.'
            },
            {
              number: '03',
              title: 'HR Final Review',
              description: 'HR completes the approval process.'
            }
          ].map(step => (
            <div
              key={step.number}
              className="flex items-start gap-3 rounded-xl border border-line/50 bg-surface2/35 p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 font-data text-xs font-bold text-accent">
                {step.number}
              </div>

              <div>
                <p className="text-xs font-semibold text-ink">
                  {step.title}
                </p>

                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LEAVE REQUESTS */}

      <section className={`${cardClass} min-h-[220px]`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Your Leave Requests
            </h3>

            <p className="mt-1 text-xs text-muted">
              Track your submitted applications and approval status.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

            <input
              type="search"
              value={searchTerm}
              onChange={event =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search leave requests..."
              aria-label="Search leave requests"
              className="w-full rounded-xl border border-line bg-surface2 py-2.5 pl-9 pr-3 text-xs text-ink outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* STATUS FILTERS */}

        <div className="mt-4 flex flex-wrap gap-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setStatusFilter(option.value)
              }
              aria-pressed={
                statusFilter === option.value
              }
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                statusFilter === option.value
                  ? 'border-accent/30 bg-accent/15 text-accent'
                  : 'border-line/50 bg-surface2/30 text-muted hover:bg-surface2'
              }`}
            >
              {option.label}

              <span className="font-data text-[10px]">
                {option.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {!isLoading && filteredRequests.length ? (
            filteredRequests.map(request => (
              <EmployeeLeaveRequestCard
                key={request.id}
                request={request}
              />
            ))
          ) : !isLoading ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-accent/70" />

              <p className="mt-3 text-sm font-semibold text-ink">
                {requests.length
                  ? 'No matching leave requests'
                  : 'No leave requests yet'}
              </p>

              <p className="mt-1 text-xs text-muted">
                {requests.length
                  ? 'Try a different search or status filter.'
                  : 'Your submitted leave applications will appear here.'}
              </p>

              {requests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                  className="mt-3 rounded-lg border border-line bg-surface2 px-3 py-2 text-xs text-accent"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-[10px] text-muted">
          Showing {filteredRequests.length} of {requests.length} requests
        </p>
      </section>

      {/* ======================================================
          APPLY LEAVE MODAL
      ====================================================== */}

      {isApplyOpen && (
        <ModalPortal
          onClose={closeApplyModal}
          ariaLabelledby="employee-leave-title"
        >
          <form
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-[#142c37] p-5 text-ink shadow-2xl"
          >

            {/* MODAL HEADER */}

            <div className="mb-4 flex items-start justify-between gap-3 border-b border-line/60 pb-3">
              <div>
                <h3
                  id="employee-leave-title"
                  className="font-display text-lg font-bold"
                >
                  Apply for Leave
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Complete the details for your leave application.
                </p>
              </div>

              <button
                type="button"
                onClick={closeApplyModal}
                disabled={isSubmitting}
                aria-label="Close leave form"
                className="rounded-lg p-1.5 text-muted hover:bg-surface2 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">

              {/* EMPLOYEE DETAILS */}

              <div className="rounded-xl border border-line/50 bg-surface2/35 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  Applying as
                </p>

                <p className="mt-1 text-sm font-semibold text-ink">
                  {profile.name ||
                    profile.fullName ||
                    'Employee'}
                </p>

                <p className="mt-1 font-data text-xs text-muted">
                  {employeeId}
                </p>
              </div>

              {/* LEAVE TYPE */}

              <label className="block text-xs font-semibold">
                Leave type <span className="text-bad">*</span>

                <select
                  value={form.requestType}
                  disabled={isSubmitting}
                  onChange={event =>
                    updateForm(
                      'requestType',
                      event.target.value
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-line bg-[#10242e] p-3 text-xs text-ink outline-none focus:border-accent"
                >
                  {LEAVE_TYPES.map(type => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              {/* AVAILABLE LEAVE BALANCE */}

              <div className="rounded-xl border border-accent/20 bg-accent/10 p-3">
                {isUnpaidLeave ? (
                  <p className="text-xs leading-relaxed text-muted">
                    Unpaid leave does not use paid leave entitlement.
                    Payroll adjustments require the applicable company policy.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-muted">
                        Remaining
                      </p>

                      <p className="mt-1 font-data text-sm font-bold text-accent">
                        {availableDays === null
                          ? '—'
                          : availableDays}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-muted">
                        Pending
                      </p>

                      <p className="mt-1 font-data text-sm font-bold text-ink">
                        {reservedDays}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-muted">
                        Available
                      </p>

                      <p className="mt-1 font-data text-sm font-bold text-good">
                        {usableDays === null
                          ? '—'
                          : usableDays}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* LEAVE DATE RANGE */}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold">
                  From Date <span className="text-bad">*</span>

                  <input
                    required
                    type="date"
                    value={form.fromDate}
                    disabled={isSubmitting}
                    onChange={event =>
                      updateForm(
                        'fromDate',
                        event.target.value
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-line bg-[#10242e] p-3 text-xs text-ink outline-none focus:border-accent"
                  />
                </label>

                <label className="text-xs font-semibold">
                  To Date <span className="text-bad">*</span>

                  <input
                    required
                    type="date"
                    min={form.fromDate || undefined}
                    value={form.toDate}
                    disabled={isSubmitting}
                    onChange={event =>
                      updateForm(
                        'toDate',
                        event.target.value
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-line bg-[#10242e] p-3 text-xs text-ink outline-none focus:border-accent"
                  />
                </label>
              </div>

              {/* CALCULATED TOTAL DAYS */}

              <div className="flex items-center justify-between rounded-xl border border-line/50 bg-surface2/35 p-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-accent" />

                  <div>
                    <p className="text-xs font-semibold text-ink">
                      Total Leave Duration
                    </p>

                    <p className="mt-1 text-[10px] text-muted">
                      Calendar days, including weekends
                    </p>
                  </div>
                </div>

                <span className="font-data text-lg font-bold text-accent">
                  {totalDays} {totalDays === 1 ? 'day' : 'days'}
                </span>
              </div>

              {/* INSUFFICIENT BALANCE VALIDATION */}

              {!isUnpaidLeave &&
              usableDays !== null &&
              totalDays > usableDays && (
                <div className="flex items-center gap-2 rounded-lg border border-bad/25 bg-bad/10 p-3 text-xs text-bad">
                  <AlertCircle className="h-4 w-4 shrink-0" />

                  Insufficient available leave balance.
                </div>
              )}

              {/* OVERLAP VALIDATION */}

              {overlappingLeave && (
                <div className="flex items-start gap-2 rounded-lg border border-bad/25 bg-bad/10 p-3 text-xs text-bad">
                  <AlertCircle className="h-4 w-4 shrink-0" />

                  An existing pending or approved request overlaps the selected dates.
                </div>
              )}

              {/* LEAVE REASON */}

              <div>
                <label
                  htmlFor="employee-leave-reason"
                  className="block text-xs font-semibold"
                >
                  Reason <span className="text-bad">*</span>
                </label>

                <textarea
                  id="employee-leave-reason"
                  required
                  rows={4}
                  maxLength={MAX_LEAVE_REASON_LENGTH}
                  value={form.reason}
                  disabled={isSubmitting}
                  onChange={event =>
                    updateForm(
                      'reason',
                      event.target.value
                    )
                  }
                  placeholder="Enter the reason for your leave request..."
                  className="mt-1.5 w-full resize-y rounded-xl border border-line bg-[#10242e] p-3 text-xs text-ink outline-none focus:border-accent"
                />

                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>Leave reason is required.</span>

                  <span className="font-data">
                    {form.reason.length}/{MAX_LEAVE_REASON_LENGTH}
                  </span>
                </div>
              </div>

              {/* APPROVAL INFORMATION */}

              <div className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />

                <p className="text-xs leading-relaxed text-muted">
                  Your application will be submitted for Team Lead review.
                  Final approval requires HR review.
                </p>
              </div>

              {/* FORM ERROR */}

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-bad/25 bg-bad/10 p-3 text-xs text-bad"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />

                  <span className="break-words">
                    {formError}
                  </span>
                </div>
              )}

              {/* ACTION BUTTONS */}

              <div className="flex justify-end gap-2 border-t border-line/60 pt-4">
                <button
                  type="button"
                  onClick={closeApplyModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-line bg-surface2 px-4 py-2.5 text-xs font-semibold text-ink hover:brightness-110 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    totalDays <= 0 ||
                    !form.reason.trim() ||
                    (
                      !isUnpaidLeave &&
                      usableDays !== null &&
                      totalDays > usableDays
                    ) ||
                    overlappingLeave
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-on-accent transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </ModalPortal>
      )}

    </div>
  );
};

// ============================================================
// EMPLOYEE PERFORMANCE
// ============================================================

export const EmployeePerformance = () => {
  const {
    currentUser,
    teamMembers = []
  } = useTeamLead();

  const profile = getEmployeeProfile(
    currentUser,
    teamMembers
  );

  const employeeId =
    getEmployeeId(currentUser);

  const ownFeedback = employeeId
    ? (
        teamPerformanceScore.recentFeedback ||
        []
      ).filter(item =>
        normalize(item.employeeId) ===
        normalize(employeeId)
      )
    : [];

  const samplePerformanceEnabled =
    Boolean(employeeId);

  const sampleFeedback = [
    {
      id: 'sample-personal-feedback-1',
      type: 'Positive Feedback',
      date: '2026-11-20',
      rating: 4.5,
      giver: 'Reporting Manager',
      content:
        'Consistently demonstrates good ownership, communication and timely task completion.'
    },
    {
      id: 'sample-personal-feedback-2',
      type: 'Performance Review',
      date: '2026-11-15',
      rating: 4,
      giver: 'Reporting Manager',
      content:
        'Continue improving technical skills and maintaining consistent delivery quality.'
    }
  ];

  const displayedFeedback = ownFeedback.length
    ? ownFeedback
    : samplePerformanceEnabled
      ? sampleFeedback
      : [];

  const actualOkrs = Array.isArray(profile.okrs)
    ? profile.okrs
    : [];

  const sampleOkrs = [
    {
      id: 'sample-goal-1',
      title: 'Project Delivery',
      progress: 95,
      status: 'In Progress'
    },
    {
      id: 'sample-goal-2',
      title: 'Team Collaboration',
      progress: 90,
      status: 'In Progress'
    },
    {
      id: 'sample-goal-3',
      title: 'Technical Skill Development',
      progress: 70,
      status: 'In Progress'
    }
  ];

  const personalOkrs = actualOkrs.length
    ? actualOkrs
    : samplePerformanceEnabled
      ? sampleOkrs
      : [];

  const hasScore =
    profile.performanceScore != null &&
    String(profile.performanceScore).trim() !== '' &&
    Number.isFinite(
      Number(profile.performanceScore)
    );

  const hasSamplePerformance =
    samplePerformanceEnabled && (
      !hasScore ||
      profile.kpiScore == null ||
      profile.goalsProgress == null ||
      !profile.reviewCycle ||
      !actualOkrs.length ||
      !ownFeedback.length
    );

  const scoreCards = [
    [
      'Performance Score',
      hasScore
        ? `${profile.performanceScore} / 100`
        : samplePerformanceEnabled
          ? '92 / 100'
          : 'N/A'
    ],
    [
      'KPI Achievement',
      profile.kpiScore ??
        (samplePerformanceEnabled ? '94%' : 'N/A')
    ],
    [
      'Goals Progress',
      profile.goalsProgress == null
        ? samplePerformanceEnabled
          ? '85%'
          : 'N/A'
        : `${profile.goalsProgress}%`
    ],
    [
      'Review Cycle',
      profile.reviewCycle ||
        (samplePerformanceEnabled
          ? 'Q4 2026'
          : 'N/A')
    ]
  ];

  return (
    <div className="space-y-5">
      

      {hasSamplePerformance && (
        <p className="px-1 text-[11px] text-muted">
          Unavailable performance fields display sample values.
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map(([label, value]) => (
          <article
            key={label}
            className={`${cardClass} kpi-card !h-[140px] !p-5 flex flex-col justify-between`}
          >
            <p className={eyebrowClass}>
              {label}
            </p>

            <p className="mt-3 font-data text-2xl font-bold text-ink">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">

        {/* EMPLOYEE OKRS */}

        <article className={`${cardClass} min-h-[220px]`}>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />

            <h3 className="font-display text-base font-semibold text-ink">
              Your OKRs
            </h3>
          </div>

          {personalOkrs.length ? (
            <div className="mt-3 space-y-2">
              {personalOkrs.map((okr, index) => (
                <div
                  key={
                    okr.id ||
                    `${okr.title}-${index}`
                  }
                  className="rounded-xl border border-line/50 bg-surface2/35 p-3"
                >
                  <p className="text-xs font-semibold text-ink">
                    {okr.title}
                  </p>

                  <p className="mt-1 text-[10px] text-muted">
                    {okr.progress ?? 0}% · {okr.status || 'In Progress'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted">
              No personal OKR records are available.
            </p>
          )}
        </article>

        {/* EMPLOYEE FEEDBACK */}

        <article className={`${cardClass} min-h-[220px]`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />

            <h3 className="font-display text-base font-semibold text-ink">
              Your Feedback
            </h3>
          </div>

          {displayedFeedback.length ? (
            <div className="mt-3 space-y-2">
              {displayedFeedback.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-line/50 bg-surface2/35 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink">
                      {item.type}
                    </p>

                    <span className="text-[10px] text-muted">
                      {item.date}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-muted">
                    Rating {item.rating} · {item.giver}
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-ink">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted">
              No personal feedback is on file.
            </p>
          )}
        </article>
      </section>
    </div>
  );
};