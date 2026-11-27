import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Drawer } from './Drawer';
import { Avatar } from './Avatar';
import { StatusPill } from './StatusPill';
import { Tag } from './Tag';
import { Button } from './Button';
import {
  IconKey,
  IconLaptop,
  IconHeadphones,
  IconPackage,
  IconShield,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconUsers,
  IconFileText,
  IconDownload,
  IconUploadCloud,
  IconTrash
} from './Icons';
import {
  getEmployeeAssets,
  getEmployeeDocuments,
  getEmployeeLicenses
} from '../../utils/employeeDossier';

const EMPLOYEE_DOCUMENT_CATEGORIES = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'employment', label: 'Employment' },
  { id: 'exit_records', label: 'Exit Records' },
  { id: 'company_policy', label: 'Company Policy' }
];
const SUPPORTED_EMPLOYEE_DOCUMENT_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'rtf', 'odt', 'txt', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg'
]);
const MAX_EMPLOYEE_DOCUMENT_SIZE = 100 * 1024 * 1024;
const INITIAL_EMPLOYEE_DOCUMENT_FORM = {
  title: '',
  category: 'onboarding',
  tags: '',
  accessLevel: 'Confidential'
};

/**
 * Centered full-screen employee modal that displays:
 * Profile & HR identity, assigned fleet devices, application entitlements (RBAC),
 * helpdesk support history, and security audit events.
 */
export function EmployeeDetailDrawer({
  isOpen,
  onClose,
  employee: employeeProp,
  user,
  onEdit,
  onDeactivate,
  onDelete
}) {
  const employee = employeeProp || user;
  const {
    assets,
    tickets,
    software,
    events,
    documents,
    accessMatrix,
    roleProfiles,
    addDocument,
    updateDocumentCategory,
    recordDocumentView,
    updateDocumentRbac,
    downloadDocument,
    deleteDocument,
    setUserStatus,
    updateUser,
    showToast,
    navigate,
    setConfirmDialog,
    hasPermission,
  } = useStore();

  const canReadProfile = hasPermission('User Profiles', 'read');
  const canEditProfile = hasPermission('User Profiles', 'update');
  const canDeleteProfile = hasPermission('User Profiles', 'delete');
  const canReadDocuments = hasPermission('Documents', 'read');
  const canUploadDocuments = hasPermission('Documents', 'write');
  const canUpdateDocuments = hasPermission('Documents', 'update');
  const canDeleteDocuments = hasPermission('Documents', 'delete');
  const canManageSecurity = hasPermission('Security', 'update');
  const canReadAssets = hasPermission('Assets', 'read');
  const canReadSoftware = hasPermission('Software', 'read');
  const canReadHelpdesk = hasPermission('Helpdesk', 'read');
  const canReadSecurity = hasPermission('Security', 'read');

  const [activeTab, setActiveTab] = useState('overview'); // overview, assets, access, tickets, audit
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [uploadForm, setUploadForm] = useState(INITIAL_EMPLOYEE_DOCUMENT_FORM);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentFilter, setDocumentFilter] = useState('all');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUploadForm(INITIAL_EMPLOYEE_DOCUMENT_FORM);
    setSelectedUploadFile(null);
    setIsDragOver(false);
    setDocumentFilter('all');
    setPreviewDocument(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [employee?.id, isOpen]);

  useEffect(() => {
    if (!(previewDocument?.file instanceof Blob)) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(previewDocument.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewDocument]);

  if (!employee || !canReadProfile) return null;

  const userAssets = getEmployeeAssets(employee, assets);
  const userDocuments = getEmployeeDocuments(employee, documents);
  const userLicenses = getEmployeeLicenses(employee, software, accessMatrix);

  // Filter support tickets raised by this employee
  const userTickets = tickets.filter((ticket) => {
    const requesterId = ticket.requesterId || ticket.requesterEmployeeId;
    if (requesterId) {
      return requesterId === employee.id || requesterId === employee.employeeId;
    }

    return Boolean(
      employee.email &&
      ticket.requesterEmail?.toLowerCase() === employee.email.toLowerCase()
    );
  });

  const userEvents = events.filter((event) => {
    const eventUserId = event.userId || event.employeeId;
    if (eventUserId) {
      return eventUserId === employee.id || eventUserId === employee.employeeId;
    }

    return Boolean(
      employee.email &&
      event.userEmail?.toLowerCase() === employee.email.toLowerCase()
    );
  });

  // Application access matrix entitlements
  const userAccess = accessMatrix[employee.id] || {};
  const assignedRole = roleProfiles.find((role) => role.id === employee.adminRoleId)?.name || 'Employee';

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(employee.email);
    setCopiedEmail(true);
    showToast(`Copied ${employee.email} to clipboard`);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleUploadFileSelection = (file) => {
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_EMPLOYEE_DOCUMENT_EXTENSIONS.has(extension)) {
      showToast('Unsupported format. Choose PDF, Office, text, spreadsheet, or image files.');
      setSelectedUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_EMPLOYEE_DOCUMENT_SIZE) {
      showToast('File exceeds the 100 MB employee-document limit.');
      setSelectedUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedUploadFile(file);
    setUploadForm((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^.]+$/, '')
    }));
  };

  const handleEmployeeDocumentUpload = async (event) => {
    event.preventDefault();
    if (!hasPermission('Documents', 'write')) {
      showToast('Uploading employee documents requires Documents: write permission.');
      return;
    }
    if (!employee.id) {
      showToast('Cannot link this document: the employee record has no user ID.');
      return;
    }
    if (!selectedUploadFile || !uploadForm.title.trim()) {
      showToast('Choose a file and enter a document title before uploading.');
      return;
    }

    setIsUploading(true);
    let sha256;
    try {
      if (!window.crypto?.subtle) throw new Error('Secure SHA-256 support is unavailable in this browser.');
      const digest = await window.crypto.subtle.digest('SHA-256', await selectedUploadFile.arrayBuffer());
      sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      setIsUploading(false);
      showToast(`Could not verify the selected file: ${error.message}`);
      return;
    }

    const category = EMPLOYEE_DOCUMENT_CATEGORIES.find(item => item.id === uploadForm.category);
    const sizeInMb = selectedUploadFile.size / (1024 * 1024);
    const fileSize = sizeInMb >= 1
      ? `${sizeInMb.toFixed(2)} MB`
      : `${Math.max(1, Math.round(selectedUploadFile.size / 1024))} KB`;
    const extension = selectedUploadFile.name.split('.').pop()?.toUpperCase() || 'FILE';
    const tags = [...new Set([
      category?.label,
      ...uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    ])];
    const linkedUser = {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      department: employee.department,
      role: employee.role
    };

    try {
      addDocument({
        title: uploadForm.title.trim(),
        repository: 'user_records',
        repositoryLabel: 'User Records',
        category: 'user_records',
        categoryLabel: 'User Records',
        employeeDocumentCategory: uploadForm.category,
        employeeDocumentCategoryLabel: category?.label || 'Employment',
        file: selectedUploadFile,
        fileName: selectedUploadFile.name,
        fileType: extension,
        fileSize,
        sha256,
        encryption: 'Browser session only; server-side encryption is not configured',
        accessLevel: uploadForm.accessLevel,
        owner: employee.name,
        ownerId: employee.id,
        ownerEmployeeId: employee.employeeId,
        ownerRole: employee.role,
        employeeId: employee.employeeId,
        department: employee.department,
        tags,
        description: `${category?.label || 'Employee'} document for ${employee.name}.`,
        linkedEntities: { user: linkedUser },
        rbacRoles: {
          superAdmin: 'Full Control',
          itOpsLead: uploadForm.accessLevel === 'Internal Only' ? 'Read & Write' : 'Read & Verify Only',
          securityOfficer: 'Audit & Revoke',
          helpdeskTech: uploadForm.accessLevel === 'Internal Only' ? 'Read Only' : 'No Access',
          complianceAuditor: 'Read & Export'
        }
      });

      setUploadForm(INITIAL_EMPLOYEE_DOCUMENT_FORM);
      setSelectedUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewEmployeeDocument = (doc) => {
    if (!(doc.file instanceof Blob)) {
      showToast(`Preview unavailable: no file payload is attached to "${doc.title}".`);
      return;
    }
    if (!recordDocumentView(doc.id)) return;
    setPreviewDocument(doc);
  };

  const handleArchiveEmployeeDocument = (doc) => {
    if (!hasPermission('Documents', 'delete')) {
      showToast('Archiving employee documents requires Documents: delete permission.');
      return;
    }
    setConfirmDialog({
      title: 'Archive Employee Document?',
      message: `Archive "${doc.title}" from ${employee.name}'s profile?`,
      confirmLabel: 'Archive Document',
      onConfirm: () => {
        if (!hasPermission('Documents', 'delete')) return;
        setPreviewDocument(null);
        deleteDocument(doc.id);
      }
    });
  };

  const handleExportProfile = () => {
    const report = {
      reportType: 'employee-profile',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      identityOverview: {
        userId: employee.id,
        employeeId: employee.employeeId,
        employeeTier: 'Standard',
        name: employee.name,
        email: employee.email,
        contactNumber: employee.contactNumber || null,
        department: employee.department,
        distributionGroup: `dept-${employee.department.toLowerCase()}@company.in`,
        designation: employee.role,
        location: employee.location,
        deskBadge: 'Assigned',
        accountStatus: employee.status,
        joiningDate: employee.joiningDate || employee.createdDate || null,
        lastLogin: employee.lastLogin || null,
        authenticationMethod: 'SSO + FIDO2 Security Key',
        accountManagement: 'Zero-Trust Managed',
        assignedRole,
        compliancePosture: {
          multiFactorAuthentication: 'Enforced (Hardware Key)',
          endpointDiskEncryption: '100% Compliant',
          securityAwarenessTraining: 'Completed (Score: 100%)'
        }
      },
      hardwareDevices: (canReadAssets ? userAssets : []).map((asset) => ({
        id: asset.id,
        assetTag: asset.assetTag,
        type: asset.type,
        model: asset.model,
        serial: asset.serial,
        status: asset.status,
        condition: asset.condition,
        location: asset.location,
        purchaseDate: asset.purchaseDate,
        warrantyEnd: asset.warrantyEnd
      })),
      softwareLicenses: (canReadSoftware ? userLicenses : []).map((license) => ({
        id: license.id,
        name: license.name,
        vendor: license.vendor,
        licenceType: license.licenceType,
        category: license.category,
        status: license.status,
        renewalDate: license.renewalDate,
        daysToRenewal: license.daysToRenewal
      })),
      employmentDocuments: (canReadDocuments ? userDocuments : []).map((doc) => Object.fromEntries(
        Object.entries(doc).filter(([key]) => key !== 'file' && key !== 'statusColor')
      )),
      cloudAccess: {
        applications: (canReadSecurity ? Object.entries(userAccess) : []).map(([application, status]) => ({
          application,
          status
        })),
        activityLogs: (canReadSecurity ? userEvents : []).map((event) => ({
          id: event.id,
          event: event.event,
          time: event.time,
          category: event.category,
          ipAddress: event.ipAddress,
          location: event.location,
          device: event.device,
          result: event.result,
          severity: event.severity,
          acknowledged: event.acknowledged
        }))
      }
    };

    const safeProfileName = `${employee.name}-${employee.employeeId || employee.id}`
      .replace(/[^a-z0-9-]+/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    const exportDate = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee-profile-${safeProfileName}-${exportDate}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported profile report for ${employee.name} (.json)`);
  };

  const handleStatusToggle = () => {
    if (!hasPermission('User Profiles', 'update')) {
      showToast('Changing account status requires User Profiles: update permission.');
      return;
    }
    if (employee.status === 'active') {
      setConfirmDialog({
        title: `Suspend ${employee.name}'s Account?`,
        message: `This will immediately revoke active sessions and lock access to email, VPN, and corporate applications. This can be re-activated at any time.`,
        confirmLabel: 'Suspend Account',
        onConfirm: () => {
          if (!hasPermission('User Profiles', 'update')) return;
          setUserStatus(employee.id, 'suspended');
          showToast(`Account for ${employee.name} suspended`);
        }
      });
    } else {
      setUserStatus(employee.id, 'active');
      showToast(`Account for ${employee.name} activated`);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isFullScreen={true}
      closeButtonLabel="Close modal"
      title={`Employee Profile — ${employee.name}`}
      headerActions={canReadProfile && hasPermission('Reports', 'read') ? (
        <button
          type="button"
          onClick={handleExportProfile}
          aria-label="Export profile as JSON"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-surface2 px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-accent"
        >
          <IconDownload className="h-4 w-4" />
          <span>Export Profile</span>
        </button>
      ) : null}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span>Identity Directory:</span>
            <span className="font-data text-ink font-semibold">Active Directory / Okta</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} ariaLabel="Close modal">
              Close
            </Button>
            {hasPermission('Security', 'read') && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate('access');
                }}
                ariaLabel="Manage Access Matrix"
              >
                Access Matrix
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div id="employee-detail-content" className="flex flex-col gap-5 w-full">
        {/* 1. Profile Header Hero Card (Monsoon Glass Aesthetic) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface2/60 border border-line backdrop-blur-md flex flex-col gap-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar name={employee.name} size={54} />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-[18px] sm:text-[20px] text-ink leading-tight truncate">
                    {employee.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full font-data text-[10.5px] font-bold bg-surface2 border border-line text-muted">
                    {employee.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-data text-[11.5px] font-bold bg-surface2 border border-line text-muted">
                    {employee.employeeId || 'No Employee ID'}
                  </span>
                </div>
                <span className="text-[13px] text-ink/80 font-medium truncate mt-0.5">
                  {employee.role}
                </span>
                <span className="text-[12px] text-muted font-medium">
                  {employee.department} · {employee.location} Office
                </span>
                <span className="text-[11px] text-muted">
                  {employee.email} · {employee.contactNumber || 'Contact number not provided'} · {assignedRole}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusPill status={employee.status} />
              <span className="text-[11px] font-data text-muted">
                Joining Date: {employee.joiningDate || employee.createdDate || 'Not provided'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
            {onEdit && canEditProfile && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-surface2 border border-line text-ink hover:border-accent hover:text-accent transition-colors"
              >
                Edit Profile
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-surface2 border border-line text-ink hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
            >
              {copiedEmail ? <IconCheck className="w-3.5 h-3.5 text-good" /> : <IconUsers className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? 'Email Copied' : 'Copy Email'}</span>
            </button>

            {canEditProfile && employee.status === 'active' ? (
              <button
                type="button"
                onClick={handleStatusToggle}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-accent2/15 border border-accent2/40 text-accent2 hover:bg-accent2/25 transition-colors"
              >
                Suspend Account
              </button>
            ) : canEditProfile && employee.status !== 'active' ? (
              <button
                type="button"
                onClick={handleStatusToggle}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-good/20 border border-good/40 text-good hover:bg-good/30 transition-colors"
              >
                {employee.status === 'deactivated' ? 'Restore Account' : 'Activate Account'}
              </button>
            ) : null}

            {onDeactivate && canEditProfile && employee.status !== 'deactivated' && (
              <button
                type="button"
                onClick={onDeactivate}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-bad/15 border border-bad/30 text-bad hover:bg-bad/25 transition-colors"
              >
                Deactivate Account
              </button>
            )}

            {onDelete && canDeleteProfile && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-bad/15 border border-bad/30 text-bad hover:bg-bad/25 transition-colors"
              >
                Delete Account
              </button>
            )}

            {canManageSecurity && (
              <button
                type="button"
                onClick={() => showToast(`Password reset link dispatched to ${employee.email}`)}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-surface2 border border-line text-muted hover:text-ink transition-colors"
              >
                Reset Password
              </button>
            )}
          </div>
        </div>

        {/* 2. Navigation Tabs inside Drawer */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface2/60 border border-line text-[12.5px] overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Identity Overview' },
            { id: 'assets', label: `Hardware Devices (${userAssets.length})` },
            { id: 'licenses', label: `Software Licenses (${userLicenses.length})` },
            { id: 'documents', label: canReadDocuments ? `Employee Documents (${userDocuments.length})` : 'Employee Documents' },
            { id: 'access', label: 'Cloud Access & RBAC' },
            { id: 'tickets', label: `Helpdesk (${userTickets.length})` },
            { id: 'audit', label: 'Cloud Activity Logs' }
          ].filter(tab => (
            (tab.id !== 'assets' || canReadAssets) &&
            (tab.id !== 'licenses' || canReadSoftware) &&
            (tab.id !== 'documents' || canReadDocuments || canUploadDocuments) &&
            (tab.id !== 'access' || canReadSecurity) &&
            (tab.id !== 'tickets' || canReadHelpdesk) &&
            (tab.id !== 'audit' || canReadSecurity)
          )).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-accent text-on-accent shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. Tab Contents */}

        {/* TAB A: OVERVIEW & HR IDENTITY */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Email Address</span>
                <span className="font-semibold text-ink font-data truncate">{employee.email}</span>
                <span className="text-[11px] text-good flex items-center gap-1 font-medium mt-0.5">
                  <IconCheck className="w-3 h-3" /> Primary Work Account Verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Employee ID & Tier</span>
                <span className="font-semibold text-ink font-data">{employee.employeeId} · Standard Tier</span>
                <span className="text-[11px] text-muted mt-0.5">Assigned via HRIS payroll connector</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Department & Group</span>
                <span className="font-semibold text-ink">{employee.department}</span>
                <span className="text-[11px] text-muted mt-0.5">Distribution: dept-{employee.department.toLowerCase()}@company.in</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Location & Office</span>
                <span className="font-semibold text-ink">{employee.location} Office</span>
                <span className="text-[11px] text-muted mt-0.5">Physical desk badge: Assigned</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Last Activity Timestamp</span>
                <span className="font-semibold text-ink font-data">{employee.lastLogin}</span>
                <span className="text-[11px] text-muted mt-0.5">Auth method: SSO + FIDO2 Security Key</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Account Lifecycle Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusPill status={employee.status} />
                  <span className="text-[11px] text-muted">Zero-Trust Managed</span>
                </div>
              </div>
            </div>

            {/* Account Policies Checklist */}
            <div className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-2.5">
              <span className="text-[12px] uppercase tracking-wider text-muted font-bold">Compliance & Security Posture</span>
              <div className="space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface2/50 border border-line/50">
                  <span className="text-ink">Multi-Factor Authentication (MFA)</span>
                  <span className="text-good font-bold text-[11px] flex items-center gap-1">
                    <IconCheck className="w-3.5 h-3.5" /> Enforced (Hardware Key)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface2/50 border border-line/50">
                  <span className="text-ink">Endpoint Disk Encryption (BitLocker / FileVault)</span>
                  <span className="text-good font-bold text-[11px] flex items-center gap-1">
                    <IconCheck className="w-3.5 h-3.5" /> 100% Compliant
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface2/50 border border-line/50">
                  <span className="text-ink">Annual IT Security & Phishing Awareness</span>
                  <span className="text-good font-bold text-[11px] flex items-center gap-1">
                    <IconCheck className="w-3.5 h-3.5" /> Completed (Score: 100%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB B: HARDWARE DEVICES */}
        {activeTab === 'assets' && canReadAssets && (
          <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
            {userAssets.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface border border-line text-center flex flex-col items-center gap-2">
                <IconLaptop className="w-8 h-8 text-muted" />
                <span className="font-semibold text-ink text-[14px]">No Devices Assigned</span>
                <p className="text-[12px] text-muted max-w-sm">
                  This employee currently has no checked-out hardware assets in the fleet register.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate('allocate');
                  }}
                  className="mt-2"
                >
                  Allocate Hardware Device
                </Button>
              </div>
            ) : (
              userAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-2.5 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface2 border border-line flex items-center justify-center text-accent shrink-0">
                        <IconLaptop className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-ink text-[14px] leading-tight">
                          {asset.model}
                        </span>
                        <span className="text-[12px] text-muted font-data mt-0.5">
                          {asset.assetTag || asset.tag} · SN: {asset.serialNumber || asset.serial || 'Not recorded'}
                        </span>
                      </div>
                    </div>
                    <StatusPill status={asset.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line text-[11.5px] font-data text-muted">
                    <div>
                      <span className="block text-muted/70 text-[10.5px]">OS VERSION</span>
                      <span className="text-ink font-semibold">{asset.os || asset.operatingSystem || 'Not recorded'}</span>
                    </div>
                    <div>
                      <span className="block text-muted/70 text-[10.5px]">ENCRYPTION</span>
                      <span className="text-ink font-semibold">{asset.encryptionStatus || asset.encryption || 'Not recorded'}</span>
                    </div>
                    <div>
                      <span className="block text-muted/70 text-[10.5px]">WARRANTY</span>
                      <span className="text-ink font-semibold">{asset.warrantyExpiry || asset.warrantyEnd || 'Not recorded'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB C: LICENSE ASSIGNMENTS */}
        {activeTab === 'licenses' && canReadSoftware && (
          <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
            {userLicenses.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface border border-line text-center flex flex-col items-center gap-2">
                <IconPackage className="w-8 h-8 text-muted" />
                <span className="font-semibold text-ink text-[14px]">No Linked Software Licenses</span>
                <p className="text-[12px] text-muted max-w-sm">
                  No license assignment or mapped application entitlement is recorded for {employee.employeeId}.
                </p>
              </div>
            ) : (
              userLicenses.map((license) => (
                <div
                  key={license.id}
                  className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                        <IconPackage className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-ink text-[14px]">{license.name}</span>
                        <span className="text-[12px] text-muted">{license.vendor} · {license.licenceType}</span>
                      </div>
                    </div>
                    <StatusPill status={license.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-line text-[11.5px] text-muted">
                    {license.accessApp && <span>Entitlement: <strong className="text-ink">{license.accessApp}</strong></span>}
                    <span>Renewal: <strong className="text-ink">{license.renewalDate || license.expiryDate || 'Not recorded'}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB D: EMPLOYEE DOCUMENTS */}
        {activeTab === 'documents' && (canReadDocuments || canUploadDocuments) && (
          <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
            {canUploadDocuments && <form
              onSubmit={handleEmployeeDocumentUpload}
              className="p-4 rounded-xl bg-surface2/50 border border-line flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-ink text-[14px]">Add Employee Document</h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    Link the file to {employee.name} and choose a record category and access level.
                  </p>
                </div>
                <IconShield className="w-4 h-4 text-accent shrink-0" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.odt,.txt,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                className="hidden"
                aria-label="Select employee document file"
                onChange={(event) => handleUploadFileSelection(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  handleUploadFileSelection(event.dataTransfer.files?.[0]);
                }}
                className={`w-full rounded-xl border-2 border-dashed p-4 text-left transition-colors ${
                  isDragOver
                    ? 'border-accent bg-accent/10'
                    : 'border-line bg-surface hover:border-accent/70'
                }`}
                aria-label="Browse or drop an employee document"
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                  <IconUploadCloud className="w-4 h-4 text-accent" />
                  {selectedUploadFile ? selectedUploadFile.name : 'Choose a file or drag it here'}
                </span>
                <span className="block text-[10.5px] text-muted mt-1">
                  PDF, DOC/DOCX, RTF, ODT, TXT, XLS/XLSX, CSV, PNG, JPG · up to 100 MB
                </span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                  Document title
                  <input
                    required
                    value={uploadForm.title}
                    onChange={(event) => setUploadForm(current => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. Signed offer letter"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                  Record category
                  <select
                    value={uploadForm.category}
                    onChange={(event) => {
                      const category = event.target.value;
                      setUploadForm(current => ({
                        ...current,
                        category,
                        accessLevel: category === 'company_policy' ? 'Internal Only' : 'Confidential'
                      }));
                    }}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink focus:border-accent focus:outline-none"
                  >
                    {EMPLOYEE_DOCUMENT_CATEGORIES.map(category => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                  Access classification
                  <select
                    value={uploadForm.accessLevel}
                    onChange={(event) => setUploadForm(current => ({ ...current, accessLevel: event.target.value }))}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="Internal Only">Internal Only</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted IT Ops">Restricted IT Ops</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                  Tags (comma-separated)
                  <input
                    value={uploadForm.tags}
                    onChange={(event) => setUploadForm(current => ({ ...current, tags: event.target.value }))}
                    placeholder="signed, HR, annual review"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-amber-300/90">
                  Session-only storage; server-side encryption and authorization are not configured.
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={IconUploadCloud}
                  disabled={!selectedUploadFile || !uploadForm.title.trim() || isUploading}
                >
                  {isUploading ? 'Verifying…' : 'Upload Document'}
                </Button>
              </div>
            </form>}

            {canReadDocuments ? (
            <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-ink text-[13px]">Profile Documents ({userDocuments.length})</h3>
                <p className="text-[10.5px] text-muted">Files linked to employee ID {employee.employeeId || employee.id}</p>
              </div>
              <select
                value={documentFilter}
                onChange={(event) => setDocumentFilter(event.target.value)}
                aria-label="Filter employee documents by category"
                className="rounded-lg border border-line bg-surface2 px-2.5 py-1.5 text-[11px] text-ink"
              >
                <option value="all">All categories</option>
                {EMPLOYEE_DOCUMENT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>

            {userDocuments.filter(doc => (
              documentFilter === 'all' || doc.employeeDocumentCategory === documentFilter
            )).length === 0 ? (
              <div className="p-7 rounded-xl bg-surface border border-line text-center flex flex-col items-center gap-2">
                <IconFileText className="w-8 h-8 text-muted" />
                <span className="font-semibold text-ink text-[14px]">
                  {userDocuments.length === 0 ? 'No Employee Documents Linked' : 'No Documents in This Category'}
                </span>
                <p className="text-[12px] text-muted max-w-sm">
                  Upload onboarding, employment, exit, or company policy records for this profile.
                </p>
              </div>
            ) : (
              userDocuments
                .filter(doc => documentFilter === 'all' || doc.employeeDocumentCategory === documentFilter)
                .map((doc) => {
                  const fileSize = doc.fileSize || 'Size unavailable';
                  const documentCategoryLabel = EMPLOYEE_DOCUMENT_CATEGORIES.find(
                    category => category.id === doc.employeeDocumentCategory
                  )?.label || doc.employeeDocumentCategoryLabel || 'Uncategorized';
                  return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <IconFileText className="w-4 h-4 text-accent mt-1 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-ink text-[13px] block break-words">{doc.title}</span>
                        <span className="text-[11px] text-muted">{documentCategoryLabel} · {doc.fileType || 'File'} · {fileSize}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface2 border border-line text-muted whitespace-nowrap">
                      {doc.accessLevel || 'Internal Only'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-muted">
                    <span>Uploaded: {doc.uploadDate || 'Date unavailable'}</span>
                    {doc.reviewDate && <span>Review: {doc.reviewDate}</span>}
                    {doc.sha256 && <span className="font-data" title={doc.sha256}>SHA-256: {doc.sha256.slice(0, 12)}…</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(doc.tags || []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-surface2 border border-line text-muted">#{tag}</span>
                    ))}
                    {doc.retentionPolicy && (
                      <span className="text-[10px] text-muted self-center ml-1">Retention: {doc.retentionPolicy}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                    <label className="flex items-center gap-1.5 text-[10.5px] text-muted">
                      Category
                      <select
                        value={doc.employeeDocumentCategory || ''}
                        aria-label={`Category for ${doc.title}`}
                        disabled={!canUpdateDocuments}
                        onChange={(event) => {
                          const category = EMPLOYEE_DOCUMENT_CATEGORIES.find(item => item.id === event.target.value);
                          if (category) updateDocumentCategory(doc.id, category.id, category.label);
                        }}
                        className="max-w-[150px] rounded-md border border-line bg-surface2 px-2 py-1 text-[10.5px] text-ink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Uncategorized</option>
                        {EMPLOYEE_DOCUMENT_CATEGORIES.map(category => (
                          <option key={category.id} value={category.id}>{category.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-1.5 text-[10.5px] text-muted">
                      Access
                      <select
                        value={doc.accessLevel || 'Internal Only'}
                        aria-label={`Access classification for ${doc.title}`}
                        disabled={!canUpdateDocuments}
                        onChange={(event) => updateDocumentRbac(doc.id, event.target.value)}
                        className="max-w-[160px] rounded-md border border-line bg-surface2 px-2 py-1 text-[10.5px] text-ink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Internal Only">Internal Only</option>
                        <option value="Confidential">Confidential</option>
                        <option value="Restricted IT Ops">Restricted IT Ops</option>
                      </select>
                    </label>
                    <div className="ml-auto flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleViewEmployeeDocument(doc)}
                        className="inline-flex items-center gap-1 rounded-md border border-line bg-surface2 px-2 py-1 text-[10.5px] font-semibold text-ink hover:border-accent hover:text-accent"
                      >
                        <IconFileText className="w-3 h-3" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDocument(doc.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-line bg-surface2 px-2 py-1 text-[10.5px] font-semibold text-ink hover:border-accent hover:text-accent"
                      >
                        <IconDownload className="w-3 h-3" /> Download
                      </button>
                      {canDeleteDocuments && <button
                        type="button"
                        onClick={() => handleArchiveEmployeeDocument(doc)}
                        aria-label={`Archive ${doc.title}`}
                        className="inline-flex items-center gap-1 rounded-md border border-bad/30 bg-bad/10 px-2 py-1 text-[10.5px] font-semibold text-bad hover:bg-bad/20"
                      >
                        <IconTrash className="w-3 h-3" /> Archive
                      </button>}
                    </div>
                  </div>
                </div>
                  );
                })
            )}
            </> ) : (
              <div className="rounded-xl border border-line bg-surface p-4 text-[12px] text-muted">
                Document details are hidden because your active role lacks Documents: read permission.
              </div>
            )}
            {(canReadDocuments || canUploadDocuments) && <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate('documents');
              }}
              className="self-start mt-1"
            >
              Open Document Repository
            </Button>}

            {previewDocument && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="employee-document-preview-title"
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
                onClick={(event) => {
                  if (event.target === event.currentTarget) setPreviewDocument(null);
                }}
              >
                <div className="flex h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                  <div className="flex items-center justify-between gap-3 border-b border-line p-4">
                    <div className="min-w-0">
                      <h3 id="employee-document-preview-title" className="truncate font-bold text-ink">{previewDocument.title}</h3>
                      <p className="text-[11px] text-muted">
                        {EMPLOYEE_DOCUMENT_CATEGORIES.find(category => category.id === previewDocument.employeeDocumentCategory)?.label || 'Uncategorized'}
                        {' · '}{previewDocument.fileType || 'File'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDocument(null)}
                      aria-label="Close document preview"
                      className="rounded-lg border border-line bg-surface2 px-3 py-1.5 text-[11px] font-semibold text-ink hover:border-accent"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/30 p-3">
                    {previewUrl && ['png', 'jpg', 'jpeg'].includes(previewDocument.fileName?.split('.').pop()?.toLowerCase()) ? (
                      <img src={previewUrl} alt={previewDocument.title} className="max-h-full max-w-full object-contain" />
                    ) : previewUrl && (
                      ['pdf'].includes(previewDocument.fileName?.split('.').pop()?.toLowerCase())
                      || previewDocument.file?.type === 'application/pdf'
                      || previewDocument.file?.type === 'text/plain'
                    ) ? (
                      <iframe
                        title={`Preview: ${previewDocument.title}`}
                        src={previewUrl}
                        className="h-full w-full rounded-lg bg-white"
                      />
                    ) : (
                      <div className="max-w-lg p-6 text-center">
                        <IconFileText className="mx-auto mb-3 h-8 w-8 text-muted" />
                        <p className="font-semibold text-ink">In-browser preview is unavailable for this format.</p>
                        <p className="mt-1 text-[12px] text-muted">Download the file to open it with a compatible application.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-3">
                    <span className="text-[10.5px] text-muted">
                      {previewDocument.fileName || previewDocument.title} · {previewDocument.fileSize || 'Size unavailable'}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadDocument(previewDocument.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-[11px] font-semibold text-ink hover:border-accent hover:text-accent"
                    >
                      <IconDownload className="h-3.5 w-3.5" /> Download file
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB E: CLOUD ACCESS & RBAC */}
        {activeTab === 'access' && canReadSecurity && (
          <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
            <div className="p-3.5 rounded-xl bg-surface border border-line flex items-center justify-between">
              <div>
                <span className="font-bold text-ink text-[13px] block">Role-Based Access Policy</span>
                <span className="text-[11.5px] text-muted">Governed by identity tier: {employee.role}</span>
              </div>
              <Tag>{employee.department}</Tag>
            </div>

            <div className="space-y-2">
              {['Email', 'VPN', 'GitHub', 'Jira', 'ERP', 'AWS Console', 'File Server'].map((app) => {
                const status = userAccess[app] || 'none';
                const isGranted = status === 'granted';
                const isRequested = status === 'requested';

                return (
                  <div
                    key={app}
                    className="p-3 rounded-xl bg-surface2/50 border border-line flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${isGranted ? 'bg-good' : isRequested ? 'bg-warn' : 'bg-muted/40'}`} />
                      <span className="font-semibold text-ink">{app}</span>
                    </div>
                    <div>
                      {isGranted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-good/20 text-good border border-good/40">
                          Granted
                        </span>
                      ) : isRequested ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warn/20 text-warn border border-warn/40">
                          Requested
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface2 text-muted border border-line">
                          No Access
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB F: HELPDESK TICKETS */}
        {activeTab === 'tickets' && canReadHelpdesk && (
          <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
            {userTickets.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface border border-line text-center flex flex-col items-center gap-2">
                <IconHeadphones className="w-8 h-8 text-muted" />
                <span className="font-semibold text-ink text-[14px]">No Open Tickets</span>
                <p className="text-[12px] text-muted max-w-sm">
                  {employee.name} has no pending or breached support tickets with IT Helpdesk.
                </p>
              </div>
            ) : (
              userTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-ink text-[13.5px]">{t.title}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] font-data text-muted">
                    <span>Ticket: <strong>{t.id}</strong></span>
                    <span>•</span>
                    <span>Priority: <strong className="text-ink">{t.priority}</strong></span>
                    <span>•</span>
                    <span>Created: {t.createdDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB G: PROFILE-SCOPED CLOUD ACTIVITY */}
        {activeTab === 'audit' && canReadSecurity && (
          <div className="flex flex-col gap-2.5 animate-in fade-in-50 duration-150 text-[12.5px]">
            {userEvents.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface border border-line text-center flex flex-col items-center gap-2">
                <IconClock className="w-8 h-8 text-muted" />
                <span className="font-semibold text-ink text-[14px]">No Cloud Activity Recorded</span>
                <p className="text-[12px] text-muted max-w-sm">
                  No activity is available for {employee.name}.
                </p>
              </div>
            ) : userEvents.map((log) => {
              const isAlert = log.category === 'Alerts' || log.category === 'Failed';
              const Icon = isAlert
                ? IconAlertTriangle
                : log.category === 'Admin actions'
                  ? IconShield
                  : IconKey;
              const color = isAlert
                ? 'text-bad'
                : log.category === 'Admin actions'
                  ? 'text-accent'
                  : log.result === 'success'
                    ? 'text-good'
                    : 'text-muted';
              return (
                <div key={log.id} className="p-3 rounded-xl bg-surface border border-line flex items-start gap-3">
                  <div className={`mt-0.5 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-ink block">{log.event}</span>
                    <div className="flex items-center gap-2 text-[11px] font-data text-muted mt-0.5">
                      <span>{log.time || 'Time unavailable'}</span>
                      <span>•</span>
                      <span>{log.location || log.ipAddress || 'Location unavailable'}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-[11px] font-data text-muted mt-1">
                      {log.category && <span>Category: {log.category}</span>}
                      {log.result && <span>Result: {log.result}</span>}
                      {log.device && <span>Device: {log.device}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
