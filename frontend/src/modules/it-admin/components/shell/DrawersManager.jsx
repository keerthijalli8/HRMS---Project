
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

import { Drawer } from '../shared/Drawer';
import { EmployeeDetailDrawer } from '../shared/EmployeeDetailDrawer';
import { Button } from '../shared/Button';
import { ProgressBar } from '../shared/ProgressBar';
import { StatusPill } from '../shared/StatusPill';
import { Avatar } from '../shared/Avatar';
import { ConfirmDialog } from '../shared/ConfirmDialog';

import {
  IconUsers,
  IconLaptop,
  IconHeadphones,
  IconPackage,
  IconCheck,
  IconShield,
  IconDownload,
} from '../shared/Icons';

// ============================================================
// COMMON CONFIGURATION
// ============================================================

const INPUT_CLASS =
  'w-full px-3 py-2 text-[13px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

const LABEL_CLASS =
  'flex flex-col gap-1.5 text-[12px] font-medium text-muted';

const LOCATIONS = [
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Gurugram',
  'Chennai',
];

const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'HR',
  'Sales',
  'Operations',
  'IT',
  'Administration',
];

const ASSET_TYPES = [
  'Laptops',
  'Desktops',
  'Monitors',
  'Phones',
  'Peripherals',
];

const TECHNICIANS = [
  'Rahul Sharma',
  'Kavita Rao',
  'Deepak Nair',
  'Unassigned',
];

const SOFTWARE_CATEGORIES = [
  'Productivity',
  'Development',
  'Design',
  'Security',
  'Infrastructure',
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical (4h SLA)' },
  { value: 'high', label: 'High (8h SLA)' },
  { value: 'medium', label: 'Medium (24h SLA)' },
  { value: 'low', label: 'Low (24h SLA)' },
];

const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'on hold', label: 'On Hold' },
  { value: 'pending', label: 'Pending' },
  { value: 'breached SLA', label: 'Breached SLA' },
];

const CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
];

// ============================================================
// UTILITIES
// ============================================================

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function todayISO(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const getPart = type =>
    parts.find(part => part.type === type)?.value;

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

function dateLabel(value) {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00+05:30`);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function nextYearISO() {
  const date = new Date();

  date.setFullYear(date.getFullYear() + 1);

  return todayISO(date);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || '').trim()
  );
}

function actionSucceeded(result) {
  return (
    result !== false &&
    result !== undefined &&
    result !== null
  );
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], {
    type: mimeType,
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

function escapeCSV(value) {
  let text = String(value ?? '');

  // Prevent spreadsheet formula injection.

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

// ============================================================
// INITIAL FORM VALUES
// ============================================================

function initialUserForm() {
  return {
    name: '',
    email: '',
    department: 'Engineering',
    role: '',
    location: 'Bengaluru',
    contactNumber: '',
    adminRoleId: 'ROLE-006',
    createdDate: todayISO(),
  };
}

function initialOnboardingChecks() {
  return [
    {
      id: 'chk-1',
      label: 'Create Google Workspace / Microsoft 365 identity',
      done: false,
    },
    {
      id: 'chk-2',
      label: 'Add to department distribution lists and Slack channels',
      done: false,
    },
    {
      id: 'chk-3',
      label: 'Provision corporate laptop and enroll in MDM',
      done: false,
    },
    {
      id: 'chk-4',
      label: 'Configure hardware security key and MFA',
      done: false,
    },
  ];
}

function initialAssignForm() {
  return {
    assetId: '',
    userId: '',
    condition: 'good',
    notes: '',
    handoverDate: todayISO(),
  };
}

function initialTicketForm() {
  return {
    title: '',
    category: 'Hardware',
    requesterId: '',
    priority: 'medium',
    description: '',
    assignedTo: 'Unassigned',
  };
}

function initialLicenceForm() {
  return {
    name: '',
    vendor: '',
    licenceType: 'Subscription',
    version: '',
    licenseKey: '',
    seatsUsed: 0,
    totalSeats: 10,
    costPerYear: '',
    renewalDate: nextYearISO(),
    renewalStatus: 'active',
    category: 'Productivity',
  };
}

function initialRegisterForm() {
  return {
    assetTag: '',
    type: 'Laptops',
    model: '',
    serial: '',
    cost: '',
    location: 'Bengaluru',
    purchaseDate: todayISO(),
    warrantyEnd: '',
    assignedTo: '',
  };
}

// ============================================================
// REUSABLE FORM COMPONENTS
// ============================================================

function Field({
  label,
  value,
  onChange,
  type = 'text',
  options,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  step,
  rows = 3,
  className = '',
}) {
  const inputProps = {
    value: value ?? '',
    onChange: event => onChange(event.target.value),
    required,
    disabled,
    className: INPUT_CLASS,
  };

  return (
    <label className={`${LABEL_CLASS} ${className}`}>
      <span>
        {label}

        {required && (
          <span className="text-accent ml-1">*</span>
        )}
      </span>

      {options ? (
        <select {...inputProps}>
          {options.map((option, index) => {
            const item =
              typeof option === 'string'
                ? { value: option, label: option }
                : option;

            return (
              <option
                key={`${item.value}-${index}`}
                value={item.value}
              >
                {item.label}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          {...inputProps}
          rows={rows}
          placeholder={placeholder}
        />
      ) : (
        <input
          {...inputProps}
          type={type}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          autoComplete={
            type === 'password'
              ? 'new-password'
              : undefined
          }
        />
      )}
    </label>
  );
}

function FormError({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="p-2.5 rounded-lg bg-bad/10 border border-bad/30 text-bad text-[12px]"
    >
      {message}
    </div>
  );
}

function FormFooter({
  onCancel,
  onSubmit,
  label = 'Save',
  disabled = false,
  variant = 'primary',
  icon,
}) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      <Button
        variant="secondary"
        onClick={onCancel}
      >
        Cancel
      </Button>

      <Button
        variant={variant}
        icon={icon}
        disabled={disabled}
        onClick={onSubmit}
      >
        {label}
      </Button>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 rounded-xl bg-surface2/60 border border-line text-left transition-colors focus-visible:outline-accent cursor-pointer ${
        danger
          ? 'hover:border-rose-400/70'
          : 'hover:border-accent'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          danger
            ? 'bg-rose-400/15 text-rose-200'
            : 'bg-accent/15 text-accent'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="min-w-0">
        <div className="font-semibold text-ink text-[14px]">
          {title}
        </div>

        <div className="text-[12px] text-muted">
          {description}
        </div>
      </div>
    </button>
  );
}

// ============================================================
// MAIN DRAWERS MANAGER
// ============================================================

export function DrawersManager() {
  const {
    activeDrawer,
    setActiveDrawer,

    drawerPayload,
    setDrawerPayload,

    selectedTicketId,

    currentUser,
    roleProfiles = [],

    users = [],
    assets = [],
    tickets = [],
    events = [],

    hasPermission,

    provisionUser,

    addAsset,
    assignAsset,

    createTicket,
    updateTicket,
    addTicketNote,
    resolveTicket,
    reopenTicket,

    addSoftwareLicence,

    applyRolePreset,

    showToast,

    confirmDialog,
    setConfirmDialog,
  } = useStore();

  // ==========================================================
  // FORM STATES
  // ==========================================================

  const [newUser, setNewUser] =
    useState(initialUserForm);

  const [onboardingChecks, setOnboardingChecks] =
    useState(initialOnboardingChecks);

  const [assignForm, setAssignForm] =
    useState(initialAssignForm);

  const [ticketForm, setTicketForm] =
    useState(initialTicketForm);

  const [licenceForm, setLicenceForm] =
    useState(initialLicenceForm);

  const [registerDeviceForm, setRegisterDeviceForm] =
    useState(initialRegisterForm);

  const [formError, setFormError] =
    useState('');

  const [ticketNoteText, setTicketNoteText] =
    useState('');

  const [resolutionNoteText, setResolutionNoteText] =
    useState('');

  const [revokeUserId, setRevokeUserId] =
    useState('');

  const [auditReportScope, setAuditReportScope] =
    useState('all');

  const [clock, setClock] =
    useState(Date.now);

  // ==========================================================
  // PERMISSION VALIDATION
  // ==========================================================

  const canRegisterDevice =
    hasPermission('Assets', 'write');

  const canReadAssets =
    hasPermission('Assets', 'read');

  const canReadUsers =
    hasPermission('User Profiles', 'read');

  const canProvisionUser =
    hasPermission('User Profiles', 'write');

  const canManageRoles =
    hasPermission('Role Administration', 'update');

  const canAssignAssets =
    hasPermission('Assets', 'update') &&
    canReadAssets &&
    canReadUsers;

  const canRevokeAccess =
    hasPermission('Security', 'delete') &&
    canReadUsers;

  const canGenerateAuditReport =
    hasPermission('Security', 'read') &&
    hasPermission('Reports', 'read');

  const canReadTickets =
    hasPermission('Helpdesk', 'read');

  const canCreateTickets =
    hasPermission('Helpdesk', 'write') &&
    canReadUsers;

  const canUpdateTickets =
    hasPermission('Helpdesk', 'update');

  const canExportTickets =
    canReadTickets &&
    hasPermission('Reports', 'read');

  const canCreateLicences =
    hasPermission('Software', 'write');

  // ==========================================================
  // DYNAMIC DATA
  // ==========================================================

  const activeEmployees = users.filter(
    user => normalize(user.status) === 'active'
  );

  const eligibleEmployees = users.filter(
    user =>
      ['active', 'provisioning'].includes(
        normalize(user.status)
      )
  );

  const availableAssets = assets.filter(
    asset =>
      normalize(asset.status) === 'in stock' &&
      !asset.assignedTo &&
      !asset.assignedEmployeeId
  );

  const activeTicket = tickets.find(
    ticket =>
      ticket.id === (
        drawerPayload?.ticketId ||
        selectedTicketId
      )
  );

  const ticketClosed = [
    'resolved',
    'closed',
  ].includes(normalize(activeTicket?.status));

  const selectedEmployeeId =
    drawerPayload?.userId ||
    drawerPayload?.user?.id;

  const selectedEmployee = users.find(
    user => user.id === selectedEmployeeId
  );

  const revocableEmployees = activeEmployees.filter(
    user =>
      user.id !== currentUser?.id &&
      normalize(user.email) !== normalize(currentUser?.email)
  );

  const selectedRevokeUser = revocableEmployees.find(
    user => user.id === revokeUserId
  );

  const auditReportEvents = events.filter(event =>
    auditReportScope === 'all' ||
    (
      auditReportScope === 'security' &&
      ['Alerts', 'Logins'].includes(event.category)
    ) ||
    event.category === auditReportScope
  );

  // ==========================================================
  // RESET FORM STATE WHEN DRAWER CHANGES
  // ==========================================================

  useEffect(() => {
    setFormError('');

    if (activeDrawer === 'new_user') {
      setNewUser(initialUserForm());
      setOnboardingChecks(initialOnboardingChecks());
    }

    if (activeDrawer === 'assign_asset') {
      setAssignForm({
        ...initialAssignForm(),
        assetId: drawerPayload?.assetId || '',
        userId: drawerPayload?.userId || '',
      });
    }

    if (activeDrawer === 'new_ticket') {
      setTicketForm(initialTicketForm());
    }

    if (activeDrawer === 'add_licence') {
      setLicenceForm(initialLicenceForm());
    }

    if (activeDrawer === 'register_device') {
      setRegisterDeviceForm(initialRegisterForm());
    }

    if (activeDrawer === 'revoke_access') {
      setRevokeUserId('');
    }

    if (activeDrawer === 'audit_report') {
      setAuditReportScope('all');
    }
  }, [activeDrawer]);

  useEffect(() => {
    setTicketNoteText('');
    setResolutionNoteText('');
  }, [activeDrawer, activeTicket?.id]);

  // Update displayed SLA elapsed time every minute.

  useEffect(() => {
    if (activeDrawer !== 'ticket_detail') {
      return;
    }

    setClock(Date.now());

    const timer = window.setInterval(
      () => setClock(Date.now()),
      60000
    );

    return () => window.clearInterval(timer);
  }, [activeDrawer, activeTicket?.id]);

  // ==========================================================
  // COMMON DRAWER ACTIONS
  // ==========================================================

  const close = () => {
    if (confirmDialog) return;

    setFormError('');
    setActiveDrawer(null);
    setDrawerPayload(null);
  };

  const openDrawer = drawer => {
    setFormError('');
    setDrawerPayload(null);
    setActiveDrawer(drawer);
  };

  const fail = message => {
    setFormError(message);
    return false;
  };

  const handleSubmit = handler => event => {
    event.preventDefault();
    handler();
  };

  // ==========================================================
  // USER ACCOUNT CREATION
  // ==========================================================

  const submitNewUser = () => {
    setFormError('');

    if (!canProvisionUser) {
      return fail('User provisioning permission is required.');
    }

    const name = newUser.name.trim();
    const email = normalize(newUser.email);

    if (!name) {
      return fail('Enter the employee full name.');
    }

    if (!isValidEmail(email)) {
      return fail('Enter a valid work email address.');
    }

    if (
      users.some(
        user => normalize(user.email) === email
      )
    ) {
      return fail('An employee with this email already exists.');
    }

    if (
      newUser.contactNumber.trim() &&
      !/^[+\d][\d\s()-]{6,19}$/.test(
        newUser.contactNumber.trim()
      )
    ) {
      return fail('Enter a valid contact number.');
    }

    if (!newUser.createdDate) {
      return fail('Select the joining date.');
    }

    if (
      canManageRoles &&
      !roleProfiles.some(
        profile => profile.id === newUser.adminRoleId
      )
    ) {
      return fail('Select a valid access role.');
    }

    const result = provisionUser({
      name,
      email,

      department: newUser.department,

      role:
        newUser.role.trim() ||
        'Associate Specialist',

      location: newUser.location,

      contactNumber:
        newUser.contactNumber.trim(),

      createdDate:
        dateLabel(newUser.createdDate),

      onboardingChecks,

      ...(canManageRoles
        ? { adminRoleId: newUser.adminRoleId }
        : {}),
    });

    if (!actionSucceeded(result)) {
      return fail(
        'Unable to create the user account. Review the details.'
      );
    }

    setNewUser(initialUserForm());
    setOnboardingChecks(initialOnboardingChecks());

    close();

    return true;
  };

  // ==========================================================
  // REGISTER DEVICE
  // ==========================================================

  const registerDevice = () => {
    setFormError('');

    if (!canRegisterDevice) {
      return fail('Asset registration permission is required.');
    }

    const assetTag =
      registerDeviceForm.assetTag.trim();

    const model =
      registerDeviceForm.model.trim();

    const serial =
      registerDeviceForm.serial.trim();

    const cost =
      Number(registerDeviceForm.cost);

    if (!model || !serial) {
      return fail(
        'Device name and serial number are required.'
      );
    }

    if (!registerDeviceForm.purchaseDate) {
      return fail('Select the purchase date.');
    }

    if (registerDeviceForm.purchaseDate > todayISO()) {
      return fail('Purchase date cannot be in the future.');
    }

    if (
      registerDeviceForm.warrantyEnd &&
      registerDeviceForm.warrantyEnd <
        registerDeviceForm.purchaseDate
    ) {
      return fail(
        'Warranty expiry cannot precede the purchase date.'
      );
    }

    if (
      registerDeviceForm.cost === '' ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      return fail('Enter a valid purchase cost.');
    }

    if (
      assets.some(asset =>
        normalize(
          asset.serial || asset.serialNumber
        ) === normalize(serial)
      )
    ) {
      return fail(
        'This serial number is already registered.'
      );
    }

    if (
      assetTag &&
      assets.some(asset =>
        normalize(asset.assetTag) === normalize(assetTag)
      )
    ) {
      return fail('This asset tag is already in use.');
    }

    const targetUser =
      registerDeviceForm.assignedTo;

    if (targetUser) {
      if (!canAssignAssets) {
        return fail('Asset assignment permission is required.');
      }

      if (
        !activeEmployees.some(
          user => user.id === targetUser
        )
      ) {
        return fail('Select a valid active employee.');
      }
    }

    const assetId = addAsset({
      assetTag: assetTag || undefined,

      type: registerDeviceForm.type,
      model,
      serial,

      cost,

      location: registerDeviceForm.location,

      purchaseDate:
        dateLabel(registerDeviceForm.purchaseDate),

      warrantyEnd:
        dateLabel(registerDeviceForm.warrantyEnd),

      assignedTo: null,

      status: 'in stock',
      condition: 'good',
    });

    if (!actionSucceeded(assetId)) {
      return fail('Unable to register the selected device.');
    }

    if (targetUser) {
      const assigned = assignAsset(
        assetId,
        targetUser,
        'good',
        'Assigned during device registration',
        dateLabel(todayISO())
      );

      if (!actionSucceeded(assigned)) {
        setRegisterDeviceForm(initialRegisterForm());

        close();

        showToast(
          'Device registered successfully. Assignment failed; allocate it from Asset Allocation.'
        );

        return true;
      }
    }

    setRegisterDeviceForm(initialRegisterForm());

    close();

    return true;
  };

  // ==========================================================
  // ASSIGN ASSET
  // ==========================================================

  const submitAssetAssignment = () => {
    setFormError('');

    if (!canAssignAssets) {
      return fail('Asset assignment permission is required.');
    }

    if (!assignForm.assetId) {
      return fail('Select an available asset.');
    }

    if (!assignForm.userId) {
      return fail('Select an employee.');
    }

    if (
      !availableAssets.some(
        asset => asset.id === assignForm.assetId
      )
    ) {
      return fail('This asset is no longer available.');
    }

    if (
      !eligibleEmployees.some(
        user => user.id === assignForm.userId
      )
    ) {
      return fail('Select an eligible employee.');
    }

    if (!assignForm.handoverDate) {
      return fail('Select the handover date.');
    }

    if (assignForm.handoverDate > todayISO()) {
      return fail('Handover date cannot be in the future.');
    }

    if (
      assignForm.condition === 'damaged' &&
      !assignForm.notes.trim()
    ) {
      return fail(
        'Enter the condition remarks for the damaged asset.'
      );
    }

    const result = assignAsset(
      assignForm.assetId,
      assignForm.userId,
      assignForm.condition,
      assignForm.notes.trim(),
      dateLabel(assignForm.handoverDate)
    );

    if (!actionSucceeded(result)) {
      return fail(
        'Assignment failed. Check asset availability and employee status.'
      );
    }

    setAssignForm(initialAssignForm());

    close();

    return true;
  };

  // ==========================================================
  // CREATE SUPPORT TICKET
  // ==========================================================

  const submitTicket = () => {
    setFormError('');

    if (!canCreateTickets) {
      return fail('Ticket creation permission is required.');
    }

    const title = ticketForm.title.trim();

    if (!title) {
      return fail('Enter the issue summary.');
    }

    const requester = users.find(
      user => user.id === ticketForm.requesterId
    );

    if (!requester) {
      return fail('Select the ticket requester.');
    }

    if (!ticketForm.description.trim()) {
      return fail('Enter the issue description.');
    }

    const result = createTicket({
      ...ticketForm,

      title,

      requesterId: requester.id,
      requesterName: requester.name,

      description:
        ticketForm.description.trim(),
    });

    if (!actionSucceeded(result)) {
      return fail('Unable to create the support ticket.');
    }

    setTicketForm(initialTicketForm());

    close();

    return true;
  };

  // ==========================================================
  // ADD SOFTWARE LICENSE
  // ==========================================================

  const submitLicence = () => {
    setFormError('');

    if (!canCreateLicences) {
      return fail('Software creation permission is required.');
    }

    const name = licenceForm.name.trim();
    const vendor = licenceForm.vendor.trim();

    const seatsUsed = Number(licenceForm.seatsUsed);
    const totalSeats = Number(licenceForm.totalSeats);
    const annualCost = Number(licenceForm.costPerYear);

    if (!name) {
      return fail('Enter the software title.');
    }

    if (!vendor) {
      return fail('Enter the software vendor.');
    }

    if (
      licenceForm.totalSeats === '' ||
      !Number.isInteger(totalSeats) ||
      totalSeats < 1
    ) {
      return fail('Total seats must be a positive whole number.');
    }

    if (
      licenceForm.seatsUsed === '' ||
      !Number.isInteger(seatsUsed) ||
      seatsUsed < 0 ||
      seatsUsed > totalSeats
    ) {
      return fail(
        'Allocated seats must be between zero and total seat capacity.'
      );
    }

    if (
      licenceForm.costPerYear === '' ||
      !Number.isFinite(annualCost) ||
      annualCost < 0
    ) {
      return fail('Enter a valid non-negative annual cost.');
    }

    if (!licenceForm.renewalDate) {
      return fail('Select the license expiry date.');
    }

    const result = addSoftwareLicence({
      ...licenceForm,

      name,
      vendor,

      seatsUsed,
      totalSeats,

      annualCost,
      costPerYear: annualCost,

      renewalDate:
        dateLabel(licenceForm.renewalDate),

      expiryDate:
        dateLabel(licenceForm.renewalDate),
    });

    if (!actionSucceeded(result)) {
      return fail(
        'Unable to save this license. Check for duplicate software records.'
      );
    }

    setLicenceForm(initialLicenceForm());

    close();

    return true;
  };

  // ==========================================================
  // REVOKE ACCESS
  // ==========================================================

  const requestAccessRevocation = () => {
    setFormError('');

    if (!canRevokeAccess) {
      return fail('Access revocation permission is required.');
    }

    if (!selectedRevokeUser) {
      return fail('Select an employee.');
    }

    const target = selectedRevokeUser;

    setConfirmDialog({
      title: 'Revoke all application access?',

      message:
        `This removes the recorded application and system access permissions for ${target.name}.`,

      confirmLabel: 'Revoke Access',

      onConfirm: () => {
        const result = applyRolePreset(
          target.id,
          'RevokeAll'
        );

        if (!actionSucceeded(result)) {
          setFormError(
            'Unable to revoke the selected employee access.'
          );

          return false;
        }

        setRevokeUserId('');
        setActiveDrawer(null);
        setDrawerPayload(null);

        return true;
      },
    });

    return true;
  };

  // ==========================================================
  // GENERATE AUDIT REPORT
  // ==========================================================

  const generateAuditReport = () => {
    if (!canGenerateAuditReport) {
      return fail('Audit report permission is required.');
    }

    if (!auditReportEvents.length) {
      return fail('No matching audit events are available.');
    }

    const header = [
      'Timestamp',
      'User',
      'Category',
      'Event',
      'Result',
      'Severity',
      'IP Address',
      'Location',
      'Device',
    ];

    const rows = auditReportEvents.map(event => [
      event.time,

      event.userName ||
      event.userEmail ||
      'System',

      event.category,
      event.event,
      event.result,
      event.severity,
      event.ipAddress,
      event.location,
      event.device,
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(escapeCSV).join(','))
      .join('\r\n');

    downloadFile(
      '\uFEFF' + csv,
      `audit-report-${todayISO()}.csv`,
      'text/csv;charset=utf-8'
    );

    showToast(
      `Generated audit report with ${auditReportEvents.length} records.`
    );

    close();

    return true;
  };

  // ==========================================================
  // TICKET EXPORT
  // ==========================================================

  const exportActiveTicket = () => {
    if (!activeTicket || !canExportTickets) {
      showToast('Ticket export permission is required.');
      return;
    }

    const content = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        ticket: activeTicket,
      },
      null,
      2
    );

    downloadFile(
      content,
      `helpdesk-${activeTicket.id}.json`,
      'application/json;charset=utf-8'
    );

    showToast(
      `Exported ticket ${activeTicket.id}.`
    );
  };

  // ==========================================================
  // TICKET NOTES
  // ==========================================================

  const submitTicketNote = () => {
    if (!activeTicket || !canUpdateTickets) {
      return;
    }

    const text = ticketNoteText.trim();

    if (!text) {
      showToast('Enter an internal note.');
      return;
    }

    const result = addTicketNote(
      activeTicket.id,
      text,
      currentUser?.name || 'IT Administrator'
    );

    if (actionSucceeded(result)) {
      setTicketNoteText('');
    }
  };

  // ==========================================================
  // TICKET RESOLUTION & REOPEN
  // ==========================================================

  const handleResolveTicket = () => {
    if (!activeTicket || !canUpdateTickets) {
      return;
    }

    const resolution =
      resolutionNoteText.trim();

    if (!resolution) {
      showToast('Enter the ticket resolution details.');
      return;
    }

    const result = resolveTicket(
      activeTicket.id,
      resolution
    );

    if (actionSucceeded(result)) {
      setResolutionNoteText('');
    }
  };

  const handleReopenTicket = () => {
    if (!activeTicket || !canUpdateTickets) {
      return;
    }

    const result = reopenTicket(
      activeTicket.id
    );

    if (actionSucceeded(result)) {
      setResolutionNoteText('');
    }
  };

  // ==========================================================
  // SLA CALCULATION
  // ==========================================================

  const slaTarget = Math.max(
    1,
    Number(activeTicket?.slaHours) || 24
  );

  const createdTime = Date.parse(
    activeTicket?.createdAtISO || ''
  );

  const resolvedTime = Date.parse(
    activeTicket?.resolvedAtISO || ''
  );

  let slaElapsed = Math.max(
    0,
    Number(activeTicket?.slaElapsedHours) || 0
  );

  if (
    Number.isFinite(createdTime) &&
    (
      !ticketClosed ||
      Number.isFinite(resolvedTime)
    )
  ) {
    const endTime =
      ticketClosed
        ? resolvedTime
        : clock;

    slaElapsed = Math.max(
      0,
      (endTime - createdTime) / 3600000
    );
  }

  const slaPercent =
    Math.round((slaElapsed / slaTarget) * 100);

  // ==========================================================
  // DROPDOWN OPTIONS
  // ==========================================================

  const activeEmployeeOptions = [
    {
      value: '',
      label: 'Keep in inventory',
    },

    ...activeEmployees.map(user => ({
      value: user.id,

      label:
        `${user.name} · ${user.employeeId || user.department}`,
    })),
  ];

  const assignmentEmployeeOptions = [
    {
      value: '',
      label: '-- Select employee --',
    },

    ...eligibleEmployees.map(user => ({
      value: user.id,

      label:
        `${user.name} · ${user.department} (${user.employeeId})`,
    })),
  ];

  const availableAssetOptions = [
    {
      value: '',
      label: '-- Select available asset --',
    },

    ...availableAssets.map(asset => ({
      value: asset.id,

      label:
        `${asset.assetTag} · ${asset.model} (${asset.location})`,
    })),
  ];

  const requesterOptions = [
    {
      value: '',
      label: '-- Select requester --',
    },

    ...users.map(user => ({
      value: user.id,

      label:
        `${user.name} (${user.department})`,
    })),
  ];

  const technicianOptions = [
    ...new Set([
      ...TECHNICIANS,

      ...tickets
        .map(ticket => ticket.assignedTo)
        .filter(Boolean),
    ]),
  ];

  // ==========================================================
  // RENDER DRAWERS
  // ==========================================================

  return (
    <>

      {/* =====================================================
          QUICK ACTIONS DRAWER
      ====================================================== */}

      <Drawer
        isOpen={activeDrawer === 'quick_actions'}
        onClose={close}
        title="Quick Actions"
      >
        <div className="flex flex-col gap-3">

          <p className="text-[13px] text-muted">
            Frequently performed IT administration tasks.
          </p>

          {canProvisionUser && (
            <QuickAction
              icon={IconUsers}
              title="New User"
              description="Create an employee account"
              onClick={() => openDrawer('new_user')}
            />
          )}

          {canRegisterDevice && (
            <QuickAction
              icon={IconLaptop}
              title="Register Device"
              description="Add a hardware asset to inventory"
              onClick={() => openDrawer('register_device')}
            />
          )}

          {canAssignAssets && (
            <QuickAction
              icon={IconLaptop}
              title="Assign Asset"
              description="Allocate an available device to an employee"
              onClick={() => openDrawer('assign_asset')}
            />
          )}

          {canCreateTickets && (
            <QuickAction
              icon={IconHeadphones}
              title="New Ticket"
              description="Create an IT support incident or request"
              onClick={() => openDrawer('new_ticket')}
            />
          )}

          {canCreateLicences && (
            <QuickAction
              icon={IconPackage}
              title="Add Software License"
              description="Register software and license capacity"
              onClick={() => openDrawer('add_licence')}
            />
          )}

          {canRevokeAccess && (
            <QuickAction
              icon={IconShield}
              title="Revoke Access"
              description="Remove employee application access"
              danger
              onClick={() => openDrawer('revoke_access')}
            />
          )}

          {canGenerateAuditReport && (
            <QuickAction
              icon={IconDownload}
              title="Generate Audit Report"
              description="Export security and administrative events"
              onClick={() => openDrawer('audit_report')}
            />
          )}

          {![
            canProvisionUser,
            canRegisterDevice,
            canAssignAssets,
            canCreateTickets,
            canCreateLicences,
            canRevokeAccess,
            canGenerateAuditReport,
          ].some(Boolean) && (
            <p className="text-[13px] text-muted text-center py-6">
              No quick actions are available for your role.
            </p>
          )}

        </div>
      </Drawer>

      {/* =====================================================
          REGISTER DEVICE DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'register_device' &&
          canRegisterDevice
        }
        onClose={close}
        title="Register Device"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={registerDevice}
            label="Register Device"
          />
        }
      >

        <p className="text-[13px] text-muted">
          Register a hardware asset and optionally assign it
          to an active employee.
        </p>

        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={handleSubmit(registerDevice)}
        >

          <Field
            label="Device Category"
            value={registerDeviceForm.type}
            options={ASSET_TYPES}
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                type: value,
              }))
            }
          />

          <Field
            label="Asset Tag"
            value={registerDeviceForm.assetTag}
            placeholder="Automatically generated if blank"
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                assetTag: value,
              }))
            }
          />

          <Field
            label="Device Name / Model"
            required
            className="sm:col-span-2"
            value={registerDeviceForm.model}
            placeholder="e.g. MacBook Pro 16"
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                model: value,
              }))
            }
          />

          <Field
            label="Serial Number"
            required
            value={registerDeviceForm.serial}
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                serial: value,
              }))
            }
          />

          <Field
            label="Purchase Cost (INR)"
            type="number"
            min={0}
            required
            value={registerDeviceForm.cost}
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                cost: value,
              }))
            }
          />

          <Field
            label="Location"
            options={LOCATIONS}
            value={registerDeviceForm.location}
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                location: value,
              }))
            }
          />

          <Field
            label="Purchase Date"
            type="date"
            required
            max={todayISO()}
            value={registerDeviceForm.purchaseDate}
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                purchaseDate: value,
              }))
            }
          />

          <Field
            label="Warranty Expiry"
            type="date"
            min={registerDeviceForm.purchaseDate}
            value={registerDeviceForm.warrantyEnd}
            onChange={value =>
              setRegisterDeviceForm(previous => ({
                ...previous,
                warrantyEnd: value,
              }))
            }
          />

          {canAssignAssets && (
            <Field
              label="Assign to Employee (Optional)"
              className="sm:col-span-2"
              value={registerDeviceForm.assignedTo}
              options={activeEmployeeOptions}
              onChange={value =>
                setRegisterDeviceForm(previous => ({
                  ...previous,
                  assignedTo: value,
                }))
              }
            />
          )}

        </form>

        <FormError message={formError} />

      </Drawer>

      {/* =====================================================
          PROVISION USER DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'new_user' &&
          canProvisionUser
        }
        onClose={close}
        title="Provision User Account"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={submitNewUser}
            label="Provision Account"
          />
        }
      >

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(submitNewUser)}
        >

          <Field
            label="Full Name"
            required
            value={newUser.name}
            placeholder="e.g. Aditi Rao"
            onChange={value =>
              setNewUser(previous => ({
                ...previous,
                name: value,
              }))
            }
          />

          <Field
            label="Work Email"
            type="email"
            required
            value={newUser.email}
            placeholder="employee@company.in"
            onChange={value =>
              setNewUser(previous => ({
                ...previous,
                email: value,
              }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field
              label="Department"
              options={DEPARTMENTS}
              value={newUser.department}
              onChange={value =>
                setNewUser(previous => ({
                  ...previous,
                  department: value,
                }))
              }
            />

            <Field
              label="Location"
              options={LOCATIONS}
              value={newUser.location}
              onChange={value =>
                setNewUser(previous => ({
                  ...previous,
                  location: value,
                }))
              }
            />

          </div>

          <Field
            label="Role Title"
            value={newUser.role}
            placeholder="e.g. Systems Engineer"
            onChange={value =>
              setNewUser(previous => ({
                ...previous,
                role: value,
              }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field
              label="Contact Number"
              type="tel"
              value={newUser.contactNumber}
              onChange={value =>
                setNewUser(previous => ({
                  ...previous,
                  contactNumber: value,
                }))
              }
            />

            {canManageRoles ? (
              <Field
                label="Assigned Access Role"
                value={newUser.adminRoleId}
                options={roleProfiles.map(profile => ({
                  value: profile.id,
                  label: profile.name,
                }))}
                onChange={value =>
                  setNewUser(previous => ({
                    ...previous,
                    adminRoleId: value,
                  }))
                }
              />
            ) : (
              <div className={LABEL_CLASS}>
                <span>Assigned Access Role</span>

                <span className={INPUT_CLASS}>
                  Standard role
                </span>
              </div>
            )}

          </div>

          <Field
            label="Joining Date"
            type="date"
            required
            value={newUser.createdDate}
            onChange={value =>
              setNewUser(previous => ({
                ...previous,
                createdDate: value,
              }))
            }
          />

          {/* ONBOARDING CHECKLIST */}

          <div className="flex flex-col gap-3 pt-3 border-t border-line/60">

            <div className="flex items-center justify-between">

              <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
                Onboarding Checklist
              </span>

              <span className="text-[11px] font-semibold text-accent">
                {
                  onboardingChecks.filter(
                    item => item.done
                  ).length
                } / {onboardingChecks.length}
              </span>

            </div>

            <ProgressBar
              value={
                onboardingChecks.filter(
                  item => item.done
                ).length
              }
              max={onboardingChecks.length}
            />

            {onboardingChecks.map(item => (
              <label
                key={item.id}
                className="flex items-start gap-2.5 text-[13px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  style={{
                    accentColor: 'var(--accent)',
                  }}
                  className="mt-0.5 w-4 h-4 rounded shrink-0"
                  onChange={() =>
                    setOnboardingChecks(previous =>
                      previous.map(check =>
                        check.id === item.id
                          ? {
                              ...check,
                              done: !check.done,
                            }
                          : check
                      )
                    )
                  }
                />

                <span
                  className={
                    item.done
                      ? 'text-muted line-through'
                      : 'text-ink'
                  }
                >
                  {item.label}
                </span>
              </label>
            ))}

            <p className="text-[11px] text-muted">
              Checklist selections record the intended
              onboarding steps. External provisioning
              requires connected services.
            </p>

          </div>

          <FormError message={formError} />

        </form>

      </Drawer>

      {/* =====================================================
          ASSIGN ASSET DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'assign_asset' &&
          canAssignAssets
        }
        onClose={close}
        title="Assign Hardware Asset"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={submitAssetAssignment}
            label="Confirm Assignment"
            disabled={
              !assignForm.assetId ||
              !assignForm.userId
            }
          />
        }
      >

        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-xl border border-line bg-surface2/40 p-3">
            <span className="text-[11px] text-muted">
              Available Assets
            </span>

            <div className="text-xl font-bold text-accent">
              {availableAssets.length}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface2/40 p-3">
            <span className="text-[11px] text-muted">
              Eligible Employees
            </span>

            <div className="text-xl font-bold text-ink">
              {eligibleEmployees.length}
            </div>
          </div>

        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(submitAssetAssignment)}
        >

          <Field
            label="Select Available Asset"
            required
            options={availableAssetOptions}
            value={assignForm.assetId}
            onChange={value =>
              setAssignForm(previous => ({
                ...previous,
                assetId: value,
              }))
            }
          />

          <Field
            label="Assign to Employee"
            required
            options={assignmentEmployeeOptions}
            value={assignForm.userId}
            onChange={value =>
              setAssignForm(previous => ({
                ...previous,
                userId: value,
              }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field
              label="Handover Date"
              required
              type="date"
              max={todayISO()}
              value={assignForm.handoverDate}
              onChange={value =>
                setAssignForm(previous => ({
                  ...previous,
                  handoverDate: value,
                }))
              }
            />

            <Field
              label="Condition at Issue"
              options={CONDITIONS}
              value={assignForm.condition}
              onChange={value =>
                setAssignForm(previous => ({
                  ...previous,
                  condition: value,
                }))
              }
            />

          </div>

          <button
            type="button"
            onClick={() =>
              setAssignForm(previous => ({
                ...previous,
                handoverDate: todayISO(),
              }))
            }
            className="self-start px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-surface2 border border-line text-accent hover:border-accent cursor-pointer"
          >
            Use Today's Date
          </button>

          <Field
            label="Handover Notes / Accessories"
            type="textarea"
            rows={4}
            value={assignForm.notes}
            required={assignForm.condition === 'damaged'}
            placeholder="Accessories, device condition and handover remarks"
            onChange={value =>
              setAssignForm(previous => ({
                ...previous,
                notes: value,
              }))
            }
          />

          <FormError message={formError} />

        </form>

      </Drawer>

      {/* =====================================================
          NEW SUPPORT TICKET DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'new_ticket' &&
          canCreateTickets
        }
        onClose={close}
        title="Create Support Ticket"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={submitTicket}
            label="Submit Ticket"
          />
        }
      >

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(submitTicket)}
        >

          <Field
            label="Issue Summary"
            required
            value={ticketForm.title}
            placeholder="e.g. Laptop display not working"
            onChange={value =>
              setTicketForm(previous => ({
                ...previous,
                title: value,
              }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field
              label="Category"
              options={[
                'Hardware',
                'Software',
                'Network',
                'Access',
                'Other',
              ]}
              value={ticketForm.category}
              onChange={value =>
                setTicketForm(previous => ({
                  ...previous,
                  category: value,
                }))
              }
            />

            <Field
              label="Priority"
              options={PRIORITIES}
              value={ticketForm.priority}
              onChange={value =>
                setTicketForm(previous => ({
                  ...previous,
                  priority: value,
                }))
              }
            />

          </div>

          <Field
            label="Requester"
            required
            options={requesterOptions}
            value={ticketForm.requesterId}
            onChange={value =>
              setTicketForm(previous => ({
                ...previous,
                requesterId: value,
              }))
            }
          />

          <Field
            label="Assignee"
            options={technicianOptions}
            value={ticketForm.assignedTo}
            onChange={value =>
              setTicketForm(previous => ({
                ...previous,
                assignedTo: value,
              }))
            }
          />

          <Field
            label="Detailed Description"
            required
            type="textarea"
            rows={5}
            value={ticketForm.description}
            placeholder="Describe the issue and troubleshooting already attempted."
            onChange={value =>
              setTicketForm(previous => ({
                ...previous,
                description: value,
              }))
            }
          />

          <FormError message={formError} />

        </form>

      </Drawer>

      {/* =====================================================
          ADD SOFTWARE LICENSE DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'add_licence' &&
          canCreateLicences
        }
        onClose={close}
        title="Add Software License"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={submitLicence}
            label="Save License"
          />
        }
      >

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(submitLicence)}
        >

          <Field
            label="Software Title"
            required
            value={licenceForm.name}
            placeholder="e.g. Microsoft 365"
            onChange={value =>
              setLicenceForm(previous => ({
                ...previous,
                name: value,
              }))
            }
          />

          <Field
            label="Vendor Name"
            required
            value={licenceForm.vendor}
            placeholder="e.g. Microsoft"
            onChange={value =>
              setLicenceForm(previous => ({
                ...previous,
                vendor: value,
              }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field
              label="Version"
              value={licenceForm.version}
              placeholder="e.g. Cloud"
              onChange={value =>
                setLicenceForm(previous => ({
                  ...previous,
                  version: value,
                }))
              }
            />

            <Field
              label="License Key"
              type="password"
              value={licenceForm.licenseKey}
              placeholder="Sample license key"
              onChange={value =>
                setLicenceForm(previous => ({
                  ...previous,
                  licenseKey: value,
                }))
              }
            />

          </div>

          <p className="text-[11px] text-muted">
            License records are stored locally in this browser.
            Do not enter confidential production license keys.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Field
              label="License Model"
              options={[
                'Per user',
                'Site',
                'Subscription',
              ]}
              value={licenceForm.licenceType}
              onChange={value =>
                setLicenceForm(previous => ({
                  ...previous,
                  licenceType: value,
                }))
              }
            />

            <Field
              label="Category"
              options={SOFTWARE_CATEGORIES}
              value={licenceForm.category}
              onChange={value =>
                setLicenceForm(previous => ({
                  ...previous,
                  category: value,
                }))
              }
            />

          </div>

          <div className="grid grid-cols-2 gap-3">

            <Field
              label="Seats Allocated"
              type="number"
              min={0}
              step={1}
              required
              max={Number(licenceForm.totalSeats)}
              value={licenceForm.seatsUsed}
              onChange={value =>
                setLicenceForm(previous => ({
                  ...previous,
                  seatsUsed: value,
                }))
              }
            />

            <Field
              label="Total Seat Capacity"
              type="number"
              min={1}
              step={1}
              required
              value={licenceForm.totalSeats}
              onChange={value =>
                setLicenceForm(previous => ({
                  ...previous,
                  totalSeats: value,
                }))
              }
            />

          </div>

          <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">

            <div className="flex justify-between items-center text-[12px]">

              <span className="text-muted">
                License Utilization
              </span>

              <span className="text-accent font-semibold">
                {licenceForm.seatsUsed || 0} / {licenceForm.totalSeats || 0}
              </span>

            </div>

            <ProgressBar
              value={Number(licenceForm.seatsUsed) || 0}
              max={
                Math.max(
                  1,
                  Number(licenceForm.totalSeats) || 1
                )
              }
              showPercentage
            />

            <span className="text-[11px] text-muted">
              Available seats: {
                Math.max(
                  0,
                  (Number(licenceForm.totalSeats) || 0) -
                  (Number(licenceForm.seatsUsed) || 0)
                )
              }
            </span>

          </div>

          <Field
            label="Annual Cost (INR)"
            type="number"
            min={0}
            step="0.01"
            required
            value={licenceForm.costPerYear}
            onChange={value =>
              setLicenceForm(previous => ({
                ...previous,
                costPerYear: value,
              }))
            }
          />

          <span className="text-[11px] text-muted">
            Estimated annual cost: ₹{
              (
                (Number(licenceForm.costPerYear) || 0) /
                100000
              ).toFixed(2)
            } L
          </span>

          <Field
            label="Expiry / Renewal Date"
            type="date"
            required
            value={licenceForm.renewalDate}
            onChange={value =>
              setLicenceForm(previous => ({
                ...previous,
                renewalDate: value,
              }))
            }
          />

          <Field
            label="Renewal Status"
            options={[
              { value: 'active', label: 'Active' },

              {
                value: 'expiring soon',
                label: 'Expiring Soon',
              },

              {
                value: 'pending renewal',
                label: 'Pending Renewal',
              },

              {
                value: 'expired',
                label: 'Expired',
              },
            ]}
            value={licenceForm.renewalStatus}
            onChange={value =>
              setLicenceForm(previous => ({
                ...previous,
                renewalStatus: value,
              }))
            }
          />

          <FormError message={formError} />

        </form>

      </Drawer>

      {/* =====================================================
          REVOKE USER ACCESS DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'revoke_access' &&
          canRevokeAccess
        }
        onClose={close}
        title="Revoke User Access"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={requestAccessRevocation}
            label="Continue to Confirmation"
            variant="danger"
            disabled={!revokeUserId}
          />
        }
      >

        <p className="text-[13px] text-muted">
          Select an employee to revoke their recorded
          application and system access.
        </p>

        <Field
          label="Employee Account"
          required
          value={revokeUserId}
          options={[
            {
              value: '',
              label: 'Select an employee',
            },

            ...revocableEmployees.map(user => ({
              value: user.id,

              label:
                `${user.name} · ${user.department}`,
            })),
          ]}
          onChange={setRevokeUserId}
        />

        {selectedRevokeUser && (
          <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center gap-3">

            <Avatar
              name={selectedRevokeUser.name}
              size={36}
            />

            <div className="min-w-0">

              <div className="text-[13px] font-semibold text-ink">
                {selectedRevokeUser.name}
              </div>

              <div className="text-[11px] text-muted truncate">
                {selectedRevokeUser.email}
              </div>

              <div className="text-[11px] text-muted">
                {selectedRevokeUser.department}
              </div>

            </div>

          </div>
        )}

        <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-[12px] text-rose-100">
          This action updates the local access matrix.
          Actual access revocation and session termination
          require identity-provider integration.
        </div>

        <FormError message={formError} />

      </Drawer>

      {/* =====================================================
          AUDIT REPORT DRAWER
      ====================================================== */}

      <Drawer
        isOpen={
          activeDrawer === 'audit_report' &&
          canGenerateAuditReport
        }
        onClose={close}
        title="Generate Audit Report"
        footer={
          <FormFooter
            onCancel={close}
            onSubmit={generateAuditReport}
            label="Generate CSV"
            icon={IconDownload}
            disabled={!auditReportEvents.length}
          />
        }
      >

        <p className="text-[13px] text-muted">
          Export selected IT administration activity
          and security events for review.
        </p>

        <Field
          label="Report Scope"
          value={auditReportScope}
          options={[
            {
              value: 'all',
              label: 'All Audit Events',
            },

            {
              value: 'Admin actions',
              label: 'Administrative Actions',
            },

            {
              value: 'security',
              label: 'Security Alerts and Login Events',
            },

            {
              value: 'Alerts',
              label: 'Security Alerts Only',
            },

            {
              value: 'Logins',
              label: 'Login Events Only',
            },
          ]}
          onChange={setAuditReportScope}
        />

        <div className="rounded-xl border border-line bg-surface2/40 p-4">

          <div className="text-2xl font-bold font-data text-ink">
            {auditReportEvents.length}
          </div>

          <p className="text-[12px] text-muted">
            Matching audit events will be included in the CSV.
          </p>

        </div>

        <p className="text-[11px] text-muted">
          Export includes event timestamps, users,
          categories, descriptions, results, severity,
          IP addresses, locations and devices.
        </p>

        <FormError message={formError} />

      </Drawer>

      {/* =====================================================
          FULL-SCREEN TICKET DETAIL DRAWER
      ====================================================== */}

      {activeTicket && canReadTickets && (
        <Drawer
          isOpen={activeDrawer === 'ticket_detail'}
          isFullScreen={true}
          onClose={close}
          title={`Ticket ${activeTicket.id}: ${activeTicket.title}`}
          headerActions={
            canExportTickets ? (
              <Button
                variant="primary"
                icon={IconDownload}
                onClick={exportActiveTicket}
              >
                Export Ticket
              </Button>
            ) : null
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">

              <Button
                variant="secondary"
                onClick={close}
              >
                Close
              </Button>

              {ticketClosed ? (
                <div className="flex items-center gap-3">

                  <span className="text-[12px] text-good font-semibold flex items-center gap-1">

                    <IconCheck className="w-4 h-4" />

                    {activeTicket.status === 'closed'
                      ? 'Closed'
                      : 'Resolved'}

                  </span>

                  {canUpdateTickets && (
                    <Button
                      variant="secondary"
                      onClick={handleReopenTicket}
                    >
                      Reopen Ticket
                    </Button>
                  )}

                </div>
              ) : (
                canUpdateTickets && (
                  <Button
                    variant="primary"
                    disabled={!resolutionNoteText.trim()}
                    onClick={handleResolveTicket}
                  >
                    Resolve Ticket
                  </Button>
                )
              )}

            </div>
          }
        >

          <div className="flex flex-col gap-4 text-[13px]">

            {/* TICKET HEADER */}

            <div className="flex flex-col gap-2">

              <div className="flex flex-wrap items-center gap-2">

                <StatusPill status={activeTicket.status} />

                <StatusPill
                  status={activeTicket.priority}
                  label={`Priority: ${activeTicket.priority}`}
                />

                <span className="ml-auto text-[11px] text-muted font-data">
                  {activeTicket.id}
                </span>

              </div>

              <h3 className="font-display font-bold text-[17px] text-ink">
                {activeTicket.title}
              </h3>

            </div>

            {/* DYNAMIC SLA */}

            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">

              <div className="flex flex-wrap justify-between items-center text-[12px]">

                <span className="text-muted">
                  SLA Window: {slaTarget}h
                </span>

                <span className="font-semibold text-ink">
                  {slaElapsed.toFixed(1)}h elapsed
                </span>

              </div>

              <ProgressBar
                value={slaElapsed}
                max={slaTarget}
                warnThreshold={75}
                dangerThreshold={100}
              />

              <div className="flex items-center justify-between text-[11px]">

                <span className="text-muted">
                  SLA Utilization: {slaPercent}%
                </span>

                <span
                  className={`font-semibold ${
                    slaPercent >= 100
                      ? 'text-bad'
                      : slaPercent >= 75
                        ? 'text-warn'
                        : 'text-good'
                  }`}
                >
                  {slaPercent >= 100
                    ? 'SLA Breached'
                    : slaPercent >= 75
                      ? 'Approaching SLA Limit'
                      : 'Within SLA'}
                </span>

              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="flex flex-col gap-1.5">

              <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
                Description
              </span>

              <p className="text-[13px] text-ink bg-surface/50 p-3 rounded-lg border border-line/40 leading-relaxed whitespace-pre-wrap">
                {activeTicket.description ||
                  'No description recorded.'}
              </p>

            </div>

            {/* REQUESTER & TICKET DETAILS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface2/30 border border-line">

              <div className="flex flex-col gap-2">

                <span className="text-[11px] uppercase text-muted font-medium">
                  Requester
                </span>

                <div className="flex items-center gap-2">

                  <Avatar
                    name={activeTicket.requesterName}
                    size={28}
                  />

                  <span className="text-ink font-medium text-[13px]">
                    {activeTicket.requesterName}
                  </span>

                </div>

              </div>

              <Field
                label="Assigned Technician"
                value={
                  activeTicket.assignedTo ||
                  'Unassigned'
                }
                options={technicianOptions}
                disabled={
                  !canUpdateTickets ||
                  ticketClosed
                }
                onChange={value =>
                  updateTicket(
                    activeTicket.id,
                    { assignedTo: value }
                  )
                }
              />

              <Field
                label="Priority"
                value={activeTicket.priority}
                options={PRIORITIES}
                disabled={
                  !canUpdateTickets ||
                  ticketClosed
                }
                onChange={value =>
                  updateTicket(
                    activeTicket.id,
                    { priority: value }
                  )
                }
              />

              {ticketClosed ? (
                <div className={LABEL_CLASS}>

                  <span>Ticket Status</span>

                  <div className="pt-2">

                    <StatusPill
                      status={activeTicket.status}
                    />

                  </div>

                </div>
              ) : (
                <Field
                  label="Ticket Status"
                  value={activeTicket.status}
                  options={
                    TICKET_STATUSES.some(
                      item =>
                        item.value === activeTicket.status
                    )
                      ? TICKET_STATUSES
                      : [
                          ...TICKET_STATUSES,
                          {
                            value: activeTicket.status,
                            label: activeTicket.status,
                          },
                        ]
                  }
                  disabled={!canUpdateTickets}
                  onChange={value =>
                    updateTicket(
                      activeTicket.id,
                      { status: value }
                    )
                  }
                />
              )}

              <div className="flex flex-col gap-1">

                <span className="text-[11px] text-muted">
                  Created At
                </span>

                <span className="text-[12px] text-ink">
                  {activeTicket.createdAt || 'Not recorded'}
                </span>

              </div>

              <div className="flex flex-col gap-1">

                <span className="text-[11px] text-muted">
                  Last Updated
                </span>

                <span className="text-[12px] text-ink">
                  {activeTicket.updatedAt || 'Not recorded'}
                </span>

              </div>

            </div>

            {/* EXISTING RESOLUTION NOTES */}

            {activeTicket.resolutionNote && (
              <div className="p-3 rounded-xl bg-good/10 border border-good/30 flex flex-col gap-1.5">

                <span className="text-[11px] uppercase tracking-wider text-good font-bold">
                  Resolution Note
                </span>

                <p className="text-[12px] text-ink leading-relaxed whitespace-pre-wrap">
                  {activeTicket.resolutionNote}
                </p>

                {activeTicket.resolvedBy && (
                  <span className="text-[11px] text-muted">
                    Resolved by: {activeTicket.resolvedBy}
                  </span>
                )}

              </div>
            )}

            {/* INTERNAL NOTES */}

            <div className="flex flex-col gap-2 pt-3 border-t border-line">

              <span className="text-[11px] uppercase tracking-wider text-muted font-bold">

                Internal Technician Notes ({
                  activeTicket.notes?.length || 0
                })

              </span>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">

                {!(activeTicket.notes || []).length && (
                  <div className="p-3 text-[12px] text-muted text-center rounded-lg border border-line/40">
                    No internal notes added yet.
                  </div>
                )}

                {(activeTicket.notes || []).map((note, index) => (
                  <div
                    key={note.id || index}
                    className="p-2.5 rounded-lg bg-surface2/40 border border-line/40 flex flex-col gap-1"
                  >

                    <div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted">

                      <span className="font-semibold text-accent">
                        {note.author}
                      </span>

                      <span>
                        {note.time}
                      </span>

                    </div>

                    <p className="text-[12px] text-ink whitespace-pre-wrap">
                      {note.text}
                    </p>

                  </div>
                ))}

              </div>

              {canUpdateTickets && (
                <div className="flex items-start gap-2 mt-1">

                  <input
                    type="text"
                    value={ticketNoteText}
                    placeholder="Add internal technician note..."
                    onChange={event =>
                      setTicketNoteText(event.target.value)
                    }
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitTicketNote();
                      }
                    }}
                    className={`${INPUT_CLASS} flex-1 min-w-0`}
                  />

                  <Button
                    variant="secondary"
                    disabled={!ticketNoteText.trim()}
                    onClick={submitTicketNote}
                  >
                    Post
                  </Button>

                </div>
              )}

            </div>

            {/* NEW RESOLUTION NOTE */}

            {!ticketClosed && canUpdateTickets && (
              <div className="pt-3 border-t border-line">

                <Field
                  label="Resolution Details"
                  required
                  type="textarea"
                  rows={4}
                  value={resolutionNoteText}
                  placeholder="Describe the root cause and corrective action taken."
                  onChange={setResolutionNoteText}
                />

              </div>
            )}

          </div>

        </Drawer>
      )}

      {/* MISSING TICKET FALLBACK */}

      <Drawer
        isOpen={
          activeDrawer === 'ticket_detail' &&
          canReadTickets &&
          !activeTicket
        }
        onClose={close}
        title="Ticket Details"
        footer={
          <Button
            variant="secondary"
            onClick={close}
          >
            Close
          </Button>
        }
      >
        <p className="text-[13px] text-muted">
          The selected ticket could not be found.
          Please select an existing ticket from Helpdesk.
        </p>
      </Drawer>

      {/* =====================================================
          EMPLOYEE DETAILS DRAWER
      ====================================================== */}

      {selectedEmployee && (
        <EmployeeDetailDrawer
          isOpen={
            activeDrawer === 'user_details' &&
            canReadUsers
          }
          onClose={close}
          employee={selectedEmployee}
        />
      )}

      <Drawer
        isOpen={
          activeDrawer === 'user_details' &&
          canReadUsers &&
          !selectedEmployee
        }
        onClose={close}
        title="Employee Details"
      >
        <p className="text-[13px] text-muted">
          The selected employee account could not be found.
        </p>
      </Drawer>

      {/* =====================================================
          GLOBAL CONFIRMATION DIALOG
      ====================================================== */}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={
            confirmDialog.confirmLabel ||
            confirmDialog.actionLabel ||
            'Confirm'
          }
          onConfirm={() => {
            const action = confirmDialog.onConfirm;

            setConfirmDialog(null);

            if (typeof action === 'function') {
              try {
                action();
              } catch (error) {
                console.error(
                  'Confirmation action failed:',
                  error
                );

                showToast(
                  'Unable to complete the requested action.'
                );
              }
            }
          }}
          onCancel={() => {
            const action = confirmDialog.onCancel;

            setConfirmDialog(null);

            if (typeof action === 'function') {
              action();
            }
          }}
        />
      )}

    </>
  );
}
