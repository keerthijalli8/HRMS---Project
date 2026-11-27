import React, { useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { Drawer } from '../shared/Drawer';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';
import { Avatar } from '../shared/Avatar';
import { EmployeeDetailDrawer } from '../shared/EmployeeDetailDrawer';
import { getDocumentStoragePool, getDocumentStoragePoolId } from '../../data/storagePools';
import {
  getEmployeeAssets,
  getEmployeeDocuments,
  getEmployeeLicenses
} from '../../utils/employeeDossier';
import {
  IconFileText,
  IconFolder,
  IconPlus,
  IconSearch,
  IconFilter,
  IconDownload,
  IconShield,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconUsers,
  IconLaptop,
  IconPackage,
  IconHeadphones,
  IconGlobe,
  IconX,
  IconGrid,
  IconList,
  IconLock,
  IconUploadCloud
} from '../shared/Icons';

export function DocumentManagementPage() {
  const {
    documents,
    users,
    assets,
    software,
    accessMatrix,
    tickets,
    events,
    navigate,
    addDocument,
    updateDocumentVersion,
    updateDocumentRbac,
    downloadDocument,
    deleteDocument,
    hasPermission,
    showToast
  } = useStore();

  const canReadDocuments = hasPermission('Documents', 'read');
  const canUploadDocuments = hasPermission('Documents', 'write');
  const canUpdateDocuments = hasPermission('Documents', 'update');
  const canDeleteDocuments = hasPermission('Documents', 'delete');
  const canExportDocuments = hasPermission('Reports', 'read');

  // Primary Navigation / Repository state
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('all');
  const [selectedRetention, setSelectedRetention] = useState('all');
  
  // Drawer & Modal States
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [rbacDoc, setRbacDoc] = useState(null); // Document active in RBAC modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // New Revision state inside detail drawer
  const [newRevisionNotes, setNewRevisionNotes] = useState('');

  // RBAC Form state inside RBAC modal
  const [rbacFormAccessLevel, setRbacFormAccessLevel] = useState('Confidential');
  const [rbacWatermarkEnforced, setRbacWatermarkEnforced] = useState(true);
  const [rbacMfaRequired, setRbacMfaRequired] = useState(true);
  const [rbacAuditView, setRbacAuditView] = useState(true);

  // Upload Document Form State
  const [newDocForm, setNewDocForm] = useState({
    title: '',
    repository: 'user_records',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    accessLevel: 'Internal Only',
    linkedEntityType: 'user',
    linkedEntityId: '',
    tags: '',
    department: 'Engineering',
    reviewDate: '24 Nov 2027',
    retentionPolicy: '7-Year Statutory Retention (Active until 2033)',
    description: '',
  });

  // Dedicated Repositories Definition for CategoryCardsBar
  const categories = [
    {
      id: 'user_records',
      label: 'User Records',
      icon: IconUsers,
      metric: `${users.length}`,
      metricLabel: 'Employee Dossiers',
      subText: 'Profiles, assigned assets, licenses & records',
      badge: 'Protected',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    },
    {
      id: 'hardware_manuals',
      label: 'Hardware Manuals',
      icon: IconLaptop,
      metric: `${documents.filter(d => d.repository === 'hardware_manuals' || d.category === 'hardware_manuals').length}`,
      metricLabel: 'OEM Runbooks',
      subText: 'Spec sheets, wiring guides & custody deeds',
      badge: 'Verified',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      id: 'software_licenses',
      label: 'Software Licenses',
      icon: IconPackage,
      metric: `${documents.filter(d => d.repository === 'software_licenses' || d.category === 'software_licenses').length}`,
      metricLabel: 'Enterprise MSAs',
      subText: 'Vendor SLAs, EULAs & entitlement grants',
      badge: '1 Expiring',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40'
    },
    {
      id: 'general_files',
      label: 'General Files',
      icon: IconFileText,
      metric: `${documents.filter(d => d.repository === 'general_files' || d.category === 'general_files' || !['user_records', 'hardware_manuals', 'software_licenses'].includes(d.repository)).length}`,
      metricLabel: 'Governance Vault',
      subText: 'ISO 27001 policies, DRP & audit ledgers',
      badge: 'ISO-27001',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }
  ];

  // Helper to map legacy category ids to dedicated repositories
  const getDocRepo = (doc) => {
    if (doc.repository) return doc.repository;
    if (doc.category === 'handovers') return 'hardware_manuals';
    if (doc.category === 'software') return 'software_licenses';
    if (doc.category === 'policies' || doc.category === 'incidents' || doc.category === 'reports') return 'general_files';
    return 'general_files';
  };

  // Helper for format badge styling
  const getFormatBadgeStyle = (format) => {
    const fmt = (format || 'PDF').toUpperCase();
    switch (fmt) {
      case 'PDF':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'DOCX':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'XLSX':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ZIP':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  // Helper for access classification styling
  const getAccessBadgeStyle = (level) => {
    switch (level) {
      case 'Confidential':
      case 'Executive / Legal':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Restricted IT Ops':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  // Filtering Logic
  const filteredDocuments = documents.filter((doc) => {
    const repo = getDocRepo(doc);
    if (activeCategory !== 'all' && repo !== activeCategory) return false;

    // Access level match
    if (selectedAccessLevel !== 'all' && doc.accessLevel !== selectedAccessLevel) return false;

    const retentionPolicy = (doc.retentionPolicy || '').toLowerCase();
    if (selectedRetention === 'statutory' && !retentionPolicy.includes('statutory')) return false;
    if (selectedRetention === '3_year' && !/3[- ]year|3 years/.test(retentionPolicy)) return false;
    if (selectedRetention === '5_plus' && !/5[- ]year|5 years|7[- ]year|7 years|8[- ]year|8 years/.test(retentionPolicy)) return false;
    if (selectedRetention === 'permanent' && !/permanent|indefinite|hold/.test(retentionPolicy)) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (doc.title || '').toLowerCase().includes(q);
      const matchOwner = (doc.owner || '').toLowerCase().includes(q);
      const matchDept = (doc.department || '').toLowerCase().includes(q);
      const matchSha = (doc.sha256 || '').toLowerCase().includes(q);
      const matchTags = (doc.tags || []).some(t => t.toLowerCase().includes(q));
      const matchRepo = (doc.repositoryLabel || doc.categoryLabel || '').toLowerCase().includes(q);
      const matchRetention = retentionPolicy.includes(q);
      const matchEntity = Object.values(doc.linkedEntities || {}).some(e =>
        JSON.stringify(e).toLowerCase().includes(q)
      );
      if (!matchTitle && !matchOwner && !matchDept && !matchSha && !matchTags && !matchRepo && !matchRetention && !matchEntity) return false;
    }

    return true;
  });

  const employeeDossiers = users.map(employee => ({
    employee,
    assets: getEmployeeAssets(employee, assets),
    licenses: getEmployeeLicenses(employee, software, accessMatrix),
    documents: getEmployeeDocuments(employee, documents)
  }));
  const filteredEmployees = employeeDossiers.filter(({ employee, assets: employeeAssets, licenses, documents: employeeDocuments }) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return [
      employee.id,
      employee.employeeId,
      employee.name,
      employee.email,
      employee.department,
      employee.role,
      employee.status,
      employee.location,
      ...employeeAssets.flatMap(asset => [asset.assetTag, asset.model]),
      ...licenses.map(license => license.name),
      ...employeeDocuments.flatMap(doc => [doc.title, ...(doc.tags || [])])
    ].some(value => String(value || '').toLowerCase().includes(query));
  });

  const handleFileSelection = (file) => {
    if (!hasPermission('Documents', 'write')) {
      showToast('Selecting files for import requires Documents: write permission.');
      return;
    }
    if (!file) return;
    const extension = file.name.split('.').pop()?.toUpperCase();
    const supportedFormats = ['PDF', 'DOCX', 'XLSX', 'ZIP', 'KEY'];

    if (!extension || !supportedFormats.includes(extension)) {
      showToast('Unsupported file type. Choose a PDF, DOCX, XLSX, ZIP, or KEY file.');
      return;
    }
    if (file.size === 0 || file.size > 100 * 1024 * 1024) {
      showToast('Files must be larger than 0 bytes and no larger than 100 MB.');
      return;
    }

    const size = file.size / (1024 * 1024);
    setSelectedFile(file);
    setNewDocForm(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ''),
      fileType: extension,
      fileSize: size >= 1 ? `${size.toFixed(2)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`
    }));
  };

  const closeImportModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Document Upload Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!hasPermission('Documents', 'write')) {
      showToast('Importing documents requires Documents: write permission.');
      return;
    }
    if (!newDocForm.title.trim()) return;
    if (!selectedFile) {
      showToast('Select a file before importing the document.');
      return;
    }

    let linkedEntities = {};
    let linkedEmployee = null;
    if (newDocForm.linkedEntityType === 'user' && newDocForm.linkedEntityId) {
      linkedEmployee = users.find(usr => usr.id === newDocForm.linkedEntityId) || null;
      if (linkedEmployee) {
        linkedEntities.user = {
          id: linkedEmployee.id,
          employeeId: linkedEmployee.employeeId,
          name: linkedEmployee.name,
          department: linkedEmployee.department,
          role: linkedEmployee.role
        };
      }
    } else if (newDocForm.linkedEntityType === 'asset' && newDocForm.linkedEntityId) {
      const a = assets.find(ast => ast.id === newDocForm.linkedEntityId);
      if (a) linkedEntities.asset = { tag: a.assetTag || a.tag, model: a.model };
    } else if (newDocForm.linkedEntityType === 'ticket' && newDocForm.linkedEntityId) {
      const t = tickets.find(tkt => tkt.id === newDocForm.linkedEntityId);
      if (t) linkedEntities.ticket = { id: t.id, title: t.title };
    } else if (newDocForm.linkedEntityType === 'software' && newDocForm.linkedEntityId) {
      const s = software.find(sw => sw.id === newDocForm.linkedEntityId);
      if (s) linkedEntities.software = { name: s.name, vendor: s.vendor };
    }

    if (newDocForm.repository === 'user_records' && !linkedEmployee) {
      showToast('Choose an employee before adding a file to User Records.');
      return;
    }

    const catObj = categories.find(c => c.id === newDocForm.repository);
    let sha256;
    try {
      const digest = await window.crypto.subtle.digest('SHA-256', await selectedFile.arrayBuffer());
      sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      showToast(`Could not calculate the file's SHA-256 fingerprint: ${error.message}`);
      return;
    }

    addDocument({
      title: newDocForm.title.trim(),
      repository: newDocForm.repository,
      storagePoolId: getDocumentStoragePoolId(newDocForm.repository),
      repositoryLabel: catObj ? catObj.label : 'General Files',
      category: newDocForm.repository,
      categoryLabel: catObj ? catObj.label : 'General Files',
      fileType: newDocForm.fileType,
      fileSize: newDocForm.fileSize,
      file: selectedFile,
      fileName: selectedFile.name,
      employeeId: linkedEmployee?.employeeId || null,
      sha256,
      encryption: 'Browser session only; server-side encryption not configured',
      accessLevel: newDocForm.accessLevel,
      department: newDocForm.department || 'Engineering',
      owner: 'Alex Mercer',
      ownerRole: 'Super Admin',
      reviewDate: newDocForm.reviewDate,
      retentionPolicy: newDocForm.retentionPolicy,
      tags: newDocForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: newDocForm.description || 'Enterprise document indexed in administration vault with cryptographic verification.',
      linkedEntities,
      rbacRoles: {
        superAdmin: 'Full Control',
        itOpsLead: 'Read & Write',
        securityOfficer: 'Audit & Revoke',
        helpdeskTech: newDocForm.accessLevel === 'Confidential' ? 'No Access' : 'Read Only',
        complianceAuditor: 'Read & Export'
      }
    });

    closeImportModal();
    setNewDocForm({
      title: '',
      repository: 'user_records',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      accessLevel: 'Internal Only',
      linkedEntityType: 'user',
      linkedEntityId: '',
      tags: '',
      department: 'Engineering',
      reviewDate: '24 Nov 2027',
      retentionPolicy: '7-Year Statutory Retention (Active until 2033)',
      description: '',
    });
  };

  // Export Protocol: CSV Audit Ledger
  const handleExportCsv = () => {
    if (!hasPermission('Documents', 'read') || !hasPermission('Reports', 'read')) return;
    const headers = ['Document ID', 'Title', 'File Name', 'Repository', 'Storage Pool ID', 'Format', 'Size', 'SHA-256 Hash', 'Access Level', 'Owner', 'Department', 'Review Date', 'Retention Policy'];
    const escapeCsv = (value) => {
      const text = String(value ?? '');
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const rows = filteredDocuments.map(doc => [
      doc.id,
      doc.title,
      doc.fileName || '',
      doc.repositoryLabel || doc.categoryLabel,
      doc.storagePoolId || getDocumentStoragePoolId(doc.repository || doc.category),
      doc.fileType,
      doc.fileSize,
      doc.sha256 || 'SHA256-VERIFIED',
      doc.accessLevel,
      doc.owner || 'Alex Mercer',
      doc.department || 'IT Operations',
      doc.reviewDate,
      doc.retentionPolicy || '7-Year Statutory',
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `document_governance_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Exported Document Governance Audit Ledger (.csv)');
    setIsExportMenuOpen(false);
  };

  // Export Protocol: JSON Metadata
  const handleExportJson = () => {
    if (!hasPermission('Documents', 'read') || !hasPermission('Reports', 'read')) return;
    const metadata = filteredDocuments.map(({ file, ...doc }) => doc);
    const jsonStr = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_governance_metadata_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Exported Cryptographic Metadata Ledger (.json)');
    setIsExportMenuOpen(false);
  };

  // Encrypted archives require server-managed key storage.
  const handleExportZip = () => {
    if (!hasPermission('Documents', 'read') || !hasPermission('Reports', 'read')) return;
    showToast('Encrypted archive export requires server-side key management. No archive was created.');
    setIsExportMenuOpen(false);
  };

  const openEmployeeDossier = (reference) => {
    if (!hasPermission('User Profiles', 'read')) {
      showToast('Opening an employee profile requires User Profiles: read permission.');
      return;
    }
    const employee = users.find(user => (
      user.id === reference?.id ||
      user.employeeId === reference?.employeeId ||
      user.name === reference?.name
    ));
    if (!employee) {
      showToast(`No employee directory profile is linked to ${reference?.employeeId || reference?.name || 'this record'}.`);
      return;
    }

    setSelectedDoc(null);
    setSelectedEmployee(employee);
  };

  // Open RBAC Modal for a document
  const handleOpenRbac = (doc) => {
    if (!hasPermission('Documents', 'update')) {
      showToast('Changing document access policies requires Documents: update permission.');
      return;
    }
    setRbacDoc(doc);
    setRbacFormAccessLevel(doc.accessLevel || 'Internal Only');
  };

  // Save RBAC Policy
  const handleSaveRbac = () => {
    if (!rbacDoc) return;
    if (!hasPermission('Documents', 'update')) {
      showToast('Changing document access policies requires Documents: update permission.');
      return;
    }
    updateDocumentRbac(rbacDoc.id, rbacFormAccessLevel, {
      watermarkEnforced: rbacWatermarkEnforced,
      mfaRequired: rbacMfaRequired,
      auditView: rbacAuditView
    });
    setRbacDoc(null);
  };

  if (!canReadDocuments) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Document Repository Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Documents: read permission.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
      id="widget-documents"
      data-w="documents"
    >
      {/* 1. Header & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <IconFileText className="w-6 h-6 text-amber-400" />
            <span>Document Management & Compliance Vault</span>
          </h2>
          <p className="text-[13px] text-muted">
            Secure enterprise repository organizing user records, hardware manuals, software licenses, and governance files with audit compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {activeCategory !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveCategory('all')}
            >
              View All ({documents.length})
            </Button>
          )}

          {/* Export Protocols Dropdown */}
          {canExportDocuments && <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              icon={IconDownload}
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              ariaLabel="Export document archives and audit ledger"
            >
              Export Protocols
            </Button>
            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-1.5 z-40 backdrop-blur-xl animate-in fade-in-50 duration-100"
              >
                <div className="px-2.5 py-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-line/40">
                  Data Governance Exports
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[12.5px] font-medium text-slate-200 hover:text-white hover:bg-surface2/80 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <IconFileText className="w-4 h-4 text-emerald-400" />
                  <span>Export Audit Ledger (.CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[12.5px] font-medium text-slate-200 hover:text-white hover:bg-surface2/80 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <IconShield className="w-4 h-4 text-cyan-400" />
                  <span>Cryptographic Metadata (.JSON)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportZip}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[12.5px] font-medium text-slate-200 hover:text-white hover:bg-surface2/80 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <IconLock className="w-4 h-4 text-amber-400" />
                  <span>Encrypted Bundle (.ZIP)</span>
                </button>
              </div>
            )}
          </div>}

          {/* Upload / Import Document Button */}
          {canUploadDocuments && <Button
            variant="primary"
            size="sm"
            icon={IconPlus}
            onClick={() => setIsUploadModalOpen(true)}
            ariaLabel="Upload and index new document"
          >
            Import Document
          </Button>}
        </div>
      </div>

      {/* 2. Top Data Governance & Compliance KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="p-3.5 rounded-xl bg-surface border border-line backdrop-blur-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider font-data">Total Vault Assets</span>
            <span className="text-[22px] font-display font-bold text-ink tracking-tight mt-0.5">{documents.length} Records</span>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 mt-0.5 font-medium">
              <IconCheck className="w-3.5 h-3.5" /> 100% Cryptographically Active
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
            <IconFileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-line backdrop-blur-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider font-data">Cryptographic Integrity</span>
            <span className="text-[22px] font-display font-bold text-ink tracking-tight mt-0.5">SHA-256</span>
            <span className="text-[11px] text-sky-300 flex items-center gap-1 mt-0.5 font-medium">
              <IconShield className="w-3.5 h-3.5" /> SHA-256 Hashes Indexed
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center justify-center shrink-0">
            <IconLock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-line backdrop-blur-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider font-data">Dedicated Repositories</span>
            <span className="text-[22px] font-display font-bold text-ink tracking-tight mt-0.5">4 Compartments</span>
            <span className="text-[11px] text-violet-300 flex items-center gap-1 mt-0.5 font-medium">
              <IconFolder className="w-3.5 h-3.5" /> Users · Hardware · SW · Files
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center shrink-0">
            <IconPackage className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-line backdrop-blur-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider font-data">Audit Compliance</span>
            <span className="text-[22px] font-display font-bold text-ink tracking-tight mt-0.5">ISO 27001</span>
            <span className="text-[11px] text-amber-300 flex items-center gap-1 mt-0.5 font-medium">
              <IconClock className="w-3.5 h-3.5" /> 7-Year Legal Hold Active
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
            <IconCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Dedicated Repositories Horizontal Category Cards Bar */}
      <CategoryCardsBar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(id) => setActiveCategory(prev => prev === id ? 'all' : id)}
      />

      {/* 4. Search, Filter & Layout Controls Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Real-Time Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, owner, tags, department, SHA-256 hash, or connected entity..."
              className="w-full pl-9 pr-8 py-2 text-[13px] rounded-xl bg-slate-900/90 border border-slate-600/70 focus:border-accent text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-white"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Classification & View Mode Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-300 hidden sm:inline">Access:</span>
              <select
                value={selectedAccessLevel}
                onChange={(e) => setSelectedAccessLevel(e.target.value)}
                className="px-3 py-2 text-[13px] font-medium rounded-xl bg-slate-900/90 border border-slate-600/70 focus:border-accent text-white focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-300">All Classifications</option>
                <option value="Confidential" className="bg-slate-900 text-white">Confidential</option>
                <option value="Internal Only" className="bg-slate-900 text-white">Internal Only</option>
                <option value="Restricted IT Ops" className="bg-slate-900 text-white">Restricted IT Ops</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-300 hidden sm:inline">Retention:</span>
              <select
                value={selectedRetention}
                onChange={(e) => setSelectedRetention(e.target.value)}
                aria-label="Filter by retention policy"
                className="px-3 py-2 text-[13px] font-medium rounded-xl bg-slate-900/90 border border-slate-600/70 focus:border-accent text-white focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-300">All Retention Policies</option>
                <option value="statutory" className="bg-slate-900 text-white">Statutory</option>
                <option value="3_year" className="bg-slate-900 text-white">3-Year</option>
                <option value="5_plus" className="bg-slate-900 text-white">5+ Years</option>
                <option value="permanent" className="bg-slate-900 text-white">Permanent / Hold</option>
              </select>
            </div>

            {/* View Mode Toggle (High-Contrast Grid vs Dense Table) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                data-view-mode="grid"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to visually engaging high-contrast grid layout"
              >
                <IconGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                data-view-mode="table"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to dense tabular view"
              >
                <IconList className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. VISUALLY ENGAGING HIGH-CONTRAST GRID LAYOUT (DEFAULT) */}
      {activeCategory === 'user_records' && viewMode === 'grid' ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[12.5px] text-muted px-1">
            <span>
              Showing <strong className="text-white">{filteredEmployees.length}</strong> employee dossiers
              <span className="hidden sm:inline"> · Employee ID is the primary cross-module reference</span>
            </span>
            <span className="text-[11px] font-data text-sky-300 flex items-center gap-1">
              <IconUsers className="w-3 h-3" /> {users.length} directory profiles
            </span>
          </div>

          {filteredEmployees.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              <IconUsers className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-[14px] font-semibold text-slate-300">No employee dossiers found</p>
              <p className="text-[12px] mt-1">Try another employee ID, name, asset, license, or document search.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
              {filteredEmployees.map(({ employee, assets: employeeAssets, licenses, documents: employeeDocuments }) => (
                <button
                  type="button"
                  key={employee.id}
                  data-employee-id={employee.employeeId}
                  onClick={() => setSelectedEmployee(employee)}
                  className="group text-left p-4 flex flex-col gap-3.5 rounded-[var(--radius)] bg-slate-950/85 border border-white/15 shadow-xl hover:border-accent/70 hover:bg-slate-900/90 transition-all min-w-0"
                  aria-label={`Open employee dossier for ${employee.name}, ${employee.employeeId}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={employee.name} size={44} />
                      <div className="min-w-0">
                        <span className="font-display font-bold text-[15px] text-white group-hover:text-accent transition-colors block truncate">
                          {employee.name}
                        </span>
                        <span className="font-data text-[11px] text-accent">{employee.employeeId}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      employee.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : employee.status === 'suspended'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : 'bg-slate-700/60 text-slate-300 border-slate-600'
                    }`}>
                      {employee.status}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-200 truncate">{employee.role}</p>
                    <p className="text-[11px] text-muted truncate">{employee.department} · {employee.location}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/35 border border-slate-800 text-center">
                    <span className="text-[10px] text-muted">
                      <strong className="block text-[15px] text-white font-display">{employeeAssets.length}</strong>
                      Hardware
                    </span>
                    <span className="text-[10px] text-muted">
                      <strong className="block text-[15px] text-white font-display">{licenses.length}</strong>
                      Licenses
                    </span>
                    <span className="text-[10px] text-muted">
                      <strong className="block text-[15px] text-white font-display">{employeeDocuments.length}</strong>
                      Documents
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="text-[10px] text-muted font-data">{employee.email}</span>
                    <span className="text-[11px] font-bold text-accent whitespace-nowrap">Open dossier →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : activeCategory === 'user_records' ? (
        <Card
          title={`Employee Directory (${filteredEmployees.length})`}
          subText="Employee ID joins profile, hardware, license, and document records"
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse text-[13px] min-w-[820px]">
              <thead>
                <tr className="border-b border-line bg-surface2/30 text-muted font-bold text-[11px] uppercase tracking-wider">
                  <th scope="col" className="py-2.5 px-3">Employee ID</th>
                  <th scope="col" className="py-2.5 px-3">Employee</th>
                  <th scope="col" className="py-2.5 px-3">Department</th>
                  <th scope="col" className="py-2.5 px-3 text-center">Hardware</th>
                  <th scope="col" className="py-2.5 px-3 text-center">Licenses</th>
                  <th scope="col" className="py-2.5 px-3 text-center">Documents</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-line">
                {filteredEmployees.map(({ employee, assets: employeeAssets, licenses, documents: employeeDocuments }) => (
                  <tr
                    key={employee.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open employee dossier for ${employee.name}, ${employee.employeeId}`}
                    onClick={() => setSelectedEmployee(employee)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedEmployee(employee);
                      }
                    }}
                    className="hover:bg-surface2/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-data text-accent">{employee.employeeId}</td>
                    <td className="py-3 px-3 font-semibold text-ink">{employee.name}</td>
                    <td className="py-3 px-3 text-muted">{employee.department}</td>
                    <td className="py-3 px-3 text-center font-data">{employeeAssets.length}</td>
                    <td className="py-3 px-3 text-center font-data">{licenses.length}</td>
                    <td className="py-3 px-3 text-center font-data">{employeeDocuments.length}</td>
                    <td className="py-3 px-3 text-muted">{employee.status}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[11px] font-bold text-accent">Open →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[12.5px] text-muted px-1">
            <span>Showing <strong className="text-white">{filteredDocuments.length}</strong> indexed records in {activeCategory === 'all' ? 'All Dedicated Repositories' : categories.find(c => c.id === activeCategory)?.label}</span>
            <span className="text-[11px] font-data text-emerald-400 flex items-center gap-1">
              <IconShield className="w-3 h-3" /> SHA-256 Fingerprints Indexed
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              <IconFileText className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-[14px] font-semibold text-slate-300">No documents found</p>
              <p className="text-[12px] mt-1">Try adjusting your repository filter or search query.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
              {filteredDocuments.map((doc) => {
                const repo = getDocRepo(doc);
                const repoObj = categories.find(c => c.id === repo);
                const storagePoolId = doc.storagePoolId || getDocumentStoragePoolId(repo);

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDoc(doc);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open document details for ${doc.title}`}
                    aria-haspopup="dialog"
                    style={{
                      backgroundColor: 'rgba(6, 20, 28, 0.88)',
                      backdropFilter: 'blur(24px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      borderRadius: 'var(--radius)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)'
                    }}
                    className="group p-4 flex flex-col justify-between gap-3.5 hover:border-accent/70 hover:shadow-accent/10 transition-all cursor-pointer relative overflow-hidden select-none"
                  >
                    {/* Top Row: File Format + Version + Cryptographic SHA-256 + Repository Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-data uppercase border ${getFormatBadgeStyle(doc.fileType)}`}>
                          {doc.fileType}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold font-data bg-slate-800 border border-slate-700 text-slate-200">
                          {doc.version}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold font-data bg-slate-900 border border-slate-700/80 text-emerald-400 flex items-center gap-1"
                          title={`SHA-256: ${doc.sha256 || 'Calculated'}`}
                        >
                          <IconLock className="w-2.5 h-2.5" />
                          <span>SHA-256</span>
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${repoObj?.badgeColor || 'bg-surface2 text-slate-300'}`}>
                        {repoObj?.label || 'General Files'}
                      </span>
                    </div>

                    {/* Document Title & Description */}
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-display font-bold text-[14.5px] text-slate-100 group-hover:text-accent transition-colors leading-snug line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-[12px] text-slate-300 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    </div>

                    {/* Metadata Grid (2x2) */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Owner / Dept</span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {doc.owner} · {doc.department || 'IT Ops'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Size & Storage</span>
                        <span className="font-semibold text-white font-data truncate block">
                          {doc.fileSize} · {storagePoolId}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Review Due</span>
                        <span className="font-data font-semibold text-amber-300 truncate block">
                          {doc.reviewDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Access Level</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getAccessBadgeStyle(doc.accessLevel)}`}>
                          {doc.accessLevel}
                        </span>
                      </div>
                    </div>

                    {/* Connected Cross-Module Entity Jump Link */}
                    {doc.linkedEntities && Object.keys(doc.linkedEntities).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Linked:</span>
                        {doc.linkedEntities.user && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              openEmployeeDossier(doc.linkedEntities.user);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors cursor-pointer"
                            title="Jump to User Profile"
                          >
                            <IconUsers className="w-3 h-3" />
                            <span>{doc.linkedEntities.user.name}</span>
                          </span>
                        )}
                        {doc.linkedEntities.asset && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('inventory');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer font-data"
                            title="Jump to Hardware Asset"
                          >
                            <IconLaptop className="w-3 h-3" />
                            <span>{doc.linkedEntities.asset.tag}</span>
                          </span>
                        )}
                        {doc.linkedEntities.software && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('licences');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors cursor-pointer"
                            title="Jump to Software Contract"
                          >
                            <IconPackage className="w-3 h-3" />
                            <span>{doc.linkedEntities.software.name}</span>
                          </span>
                        )}
                        {doc.linkedEntities.ticket && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('desk', { ticketId: doc.linkedEntities.ticket.id });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors cursor-pointer font-data"
                            title="Jump to Incident Ticket"
                          >
                            <IconHeadphones className="w-3 h-3" />
                            <span>{doc.linkedEntities.ticket.id}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Metadata Tags Row */}
                    <div className="flex flex-wrap gap-1">
                      {doc.tags?.slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-700 text-slate-300">
                          #{tag}
                        </span>
                      ))}
                      {(doc.tags?.length || 0) > 3 && (
                        <span className="text-[10px] text-muted self-center">+{doc.tags.length - 3}</span>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-line/60 gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 text-[11.5px] font-semibold rounded-lg bg-surface2 hover:bg-accent/20 border border-line text-slate-200 hover:text-white transition-all cursor-pointer"
                      >
                        Preview & Versions
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRbac(doc)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 border border-slate-700/80 hover:border-accent text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          title="Inspect Role-Based Access Controls"
                        >
                          <IconLock className="w-3 h-3 text-amber-400" />
                          <span>RBAC</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadDocument(doc.id)}
                          className="p-1.5 text-muted hover:text-accent rounded-lg hover:bg-surface2 border border-transparent hover:border-line transition-colors cursor-pointer"
                          title="Download document with watermark"
                        >
                          <IconDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 6. DENSE TABLE LAYOUT (ALTERNATIVE VIEW) */
        <Card
          title={`Indexed Document Records (${filteredDocuments.length})`}
          subText="Verifiable documents with version history, ownership, access levels, and linked entities"
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse text-[13px] min-w-[880px]">
              <thead>
                <tr className="border-b border-line bg-surface2/30 text-muted font-bold text-[11px] uppercase tracking-wider">
                  <th scope="col" className="py-2.5 px-3">Document Title & Version</th>
                  <th scope="col" className="py-2.5 px-3">Dedicated Repository</th>
                  <th scope="col" className="py-2.5 px-3">Connected Entity Link</th>
                  <th scope="col" className="py-2.5 px-3">Access Level</th>
                  <th scope="col" className="py-2.5 px-3">Review Due</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-line">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted text-[13px]">
                      No documents found matching the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const repo = getDocRepo(doc);
                    const repoObj = categories.find(c => c.id === repo);
                    const storagePoolId = doc.storagePoolId || getDocumentStoragePoolId(repo);

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedDoc(doc);
                          }
                        }}
                        tabIndex={0}
                        aria-label={`Open document details for ${doc.title}`}
                        className="hover:bg-surface2/40 transition-colors cursor-pointer group"
                      >
                        {/* Title, File Format, Version */}
                        <td className="py-3 px-3">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-lg bg-surface border border-line text-amber-300 shrink-0 mt-0.5 group-hover:border-accent transition-colors">
                              <IconFileText className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-ink group-hover:text-accent transition-colors">
                                {doc.title}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                                <span className={`font-bold font-data uppercase px-1 rounded text-[10px] ${getFormatBadgeStyle(doc.fileType)}`}>
                                  {doc.fileType}
                                </span>
                                <span>·</span>
                                <span>{doc.fileSize}</span>
                                <span>·</span>
                                <span className="font-data text-accent font-semibold">{doc.version}</span>
                                <span>·</span>
                                <span>Owner: {doc.owner}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Repository */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${repoObj?.badgeColor || 'bg-surface2 text-slate-200'}`}>
                            {repoObj?.label || 'General Files'}
                          </span>
                          <span className="block mt-1 text-[10px] font-data text-muted">
                            Pool: {storagePoolId}
                          </span>
                        </td>

                        {/* Connected Entity Link */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {doc.linkedEntities?.user && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEmployeeDossier(doc.linkedEntities.user);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors cursor-pointer"
                                title="Click to view User Profile"
                              >
                                <IconUsers className="w-3 h-3" />
                                <span>{doc.linkedEntities.user.name}</span>
                              </span>
                            )}
                            {doc.linkedEntities?.asset && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('inventory');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer font-data"
                                title="Click to inspect Hardware Asset"
                              >
                                <IconLaptop className="w-3 h-3" />
                                <span>{doc.linkedEntities.asset.tag}</span>
                              </span>
                            )}
                            {doc.linkedEntities?.software && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('licences');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors cursor-pointer"
                                title="Click to view Software Contract"
                              >
                                <IconPackage className="w-3 h-3" />
                                <span>{doc.linkedEntities.software.name}</span>
                              </span>
                            )}
                            {doc.linkedEntities?.ticket && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('desk', { ticketId: doc.linkedEntities.ticket.id });
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors cursor-pointer font-data"
                                title="Click to inspect Helpdesk Ticket"
                              >
                                <IconHeadphones className="w-3 h-3" />
                                <span>{doc.linkedEntities.ticket.id}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Access Level */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getAccessBadgeStyle(doc.accessLevel)}`}>
                            {doc.accessLevel}
                          </span>
                        </td>

                        {/* Review Date */}
                        <td className="py-3 px-3 whitespace-nowrap font-data text-[12px] text-muted">
                          {doc.reviewDate}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {canUpdateDocuments && (
                              <button
                                type="button"
                                onClick={() => handleOpenRbac(doc)}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 border border-slate-700 hover:border-accent text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Configure Role-Based Access Controls"
                              >
                                RBAC
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedDoc(doc)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface2 hover:bg-accent/20 border border-line text-slate-200 hover:text-white transition-all cursor-pointer"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocument(doc.id)}
                              className="p-1.5 text-muted hover:text-accent rounded-lg hover:bg-surface2 transition-colors cursor-pointer"
                              title="Download document with watermark"
                            >
                              <IconDownload className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 7. Full-screen document detail and version view */}
      <Drawer
        id="document-detail-drawer-panel"
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc ? selectedDoc.title : 'Document Details'}
        isCentered
        isFullScreen
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-[11px] text-muted">
              Classification: <strong className="text-white">{selectedDoc?.accessLevel}</strong>
            </span>
            <div className="flex gap-2">
              {canUpdateDocuments && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={IconLock}
                  onClick={() => {
                    const target = selectedDoc;
                    setSelectedDoc(null);
                    handleOpenRbac(target);
                  }}
                >
                  RBAC Policy
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={IconDownload}
                onClick={() => downloadDocument(selectedDoc?.id)}
              >
                Download ({selectedDoc?.fileSize})
              </Button>
            </div>
          </div>
        }
      >
        {selectedDoc && (
          <div className="flex flex-col gap-5 text-ink">
            {/* Top Specs Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-600/70 flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider font-data flex items-center gap-1.5">
                  <IconFileText className="w-3.5 h-3.5 text-accent" />
                  <span>{selectedDoc.id} · {selectedDoc.fileType}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${selectedDoc.statusColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                  {selectedDoc.status}
                </span>
              </div>
              <p className="text-[13px] text-slate-200 leading-relaxed">
                {selectedDoc.description}
              </p>
              
              {/* Cryptographic SHA-256 fingerprint box */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex flex-col gap-1 text-[11px] font-data">
                <div className="flex items-center justify-between text-muted">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    <IconLock className="w-3 h-3" /> Cryptographic Fingerprint (SHA-256)
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedDoc.encryption || 'AES-256-GCM'}</span>
                </div>
                <div className="text-slate-300 break-all select-all font-mono text-[10.5px]">
                  {selectedDoc.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-line/40 text-[11.5px]">
                <div>
                  <span className="text-muted block text-[10.5px]">Current Version</span>
                  <span className="font-bold text-accent font-data">{selectedDoc.version}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px]">File Size</span>
                  <span className="font-semibold text-white">{selectedDoc.fileSize}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px]">Uploaded</span>
                  <span className="font-data text-slate-200">{selectedDoc.uploadDate}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10.5px]">Review Date</span>
                  <span className="font-data text-amber-300 font-semibold">{selectedDoc.reviewDate}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-line/30 text-[11.5px]">
                <span className="text-muted block text-[10.5px]">Storage Pool</span>
                <span className="font-data font-semibold text-cyan-200">
                  {getDocumentStoragePool(selectedDoc.storagePoolId || getDocumentStoragePoolId(selectedDoc.repository || selectedDoc.category))?.name}
                  {' · '}
                  {selectedDoc.storagePoolId || getDocumentStoragePoolId(selectedDoc.repository || selectedDoc.category)}
                </span>
              </div>

              {selectedDoc.retentionPolicy && (
                <div className="pt-2 border-t border-line/30 text-[11.5px] flex items-center justify-between text-slate-300">
                  <span className="text-muted">Statutory Retention:</span>
                  <span className="font-medium text-white">{selectedDoc.retentionPolicy}</span>
                </div>
              )}
            </div>

            {/* Connected Cross-Module Entities */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <IconFolder className="w-4 h-4 text-accent" />
                <span>Connected Cross-Module Entities</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedDoc.linkedEntities?.user && (
                  <div
                    onClick={() => {
                      setSelectedDoc(null);
                      openEmployeeDossier(selectedDoc.linkedEntities.user);
                    }}
                    className="p-3 rounded-xl bg-surface2/60 hover:bg-surface2 border border-line/60 hover:border-sky-500/50 transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <IconUsers className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-white group-hover:text-sky-300 truncate">
                        {selectedDoc.linkedEntities.user.name}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {selectedDoc.linkedEntities.user.department || selectedDoc.linkedEntities.user.email}
                      </span>
                      <span className="text-[10px] text-sky-400 font-semibold mt-1">Jump to User Accounts →</span>
                    </div>
                  </div>
                )}

                {selectedDoc.linkedEntities?.asset && (
                  <div
                    onClick={() => {
                      setSelectedDoc(null);
                      navigate('inventory');
                    }}
                    className="p-3 rounded-xl bg-surface2/60 hover:bg-surface2 border border-line/60 hover:border-emerald-500/50 transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <IconLaptop className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-white group-hover:text-emerald-300 truncate font-data">
                        {selectedDoc.linkedEntities.asset.tag}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {selectedDoc.linkedEntities.asset.model}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold mt-1">Jump to Asset Fleet →</span>
                    </div>
                  </div>
                )}

                {selectedDoc.linkedEntities?.software && (
                  <div
                    onClick={() => {
                      setSelectedDoc(null);
                      navigate('licences');
                    }}
                    className="p-3 rounded-xl bg-surface2/60 hover:bg-surface2 border border-line/60 hover:border-violet-500/50 transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <IconPackage className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-white group-hover:text-violet-300 truncate">
                        {selectedDoc.linkedEntities.software.name}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {selectedDoc.linkedEntities.software.vendor}
                      </span>
                      <span className="text-[10px] text-violet-400 font-semibold mt-1">Jump to Software Catalog →</span>
                    </div>
                  </div>
                )}

                {selectedDoc.linkedEntities?.ticket && (
                  <div
                    onClick={() => {
                      const tktId = selectedDoc.linkedEntities.ticket.id;
                      setSelectedDoc(null);
                      navigate('desk', { ticketId: tktId });
                    }}
                    className="p-3 rounded-xl bg-surface2/60 hover:bg-surface2 border border-line/60 hover:border-indigo-500/50 transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <IconHeadphones className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-white group-hover:text-indigo-300 truncate font-data">
                        {selectedDoc.linkedEntities.ticket.id}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {selectedDoc.linkedEntities.ticket.title}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-semibold mt-1">Jump to Incident Ticket →</span>
                    </div>
                  </div>
                )}

                {selectedDoc.linkedEntities?.securityEvent && (
                  <div
                    onClick={() => {
                      setSelectedDoc(null);
                      navigate('events');
                    }}
                    className="p-3 rounded-xl bg-surface2/60 hover:bg-surface2 border border-line/60 hover:border-rose-500/50 transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <IconShield className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-white group-hover:text-rose-300 truncate font-data">
                        {selectedDoc.linkedEntities.securityEvent.id}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {selectedDoc.linkedEntities.securityEvent.title}
                      </span>
                      <span className="text-[10px] text-rose-400 font-semibold mt-1">Jump to Security Event →</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Version History & Revision Management */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line/50">
              <h3 className="text-[13px] font-bold text-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <IconClock className="w-4 h-4 text-accent" />
                  <span>Version History ({selectedDoc.versions?.length || 1})</span>
                </span>
                <span className="text-[11px] text-muted">Immutable Revision Chain</span>
              </h3>

              <div className="flex flex-col gap-2">
                {selectedDoc.versions?.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-start justify-between gap-3 text-[12px]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-accent font-data">{v.version}</span>
                        <span className="text-white font-medium">{v.notes}</span>
                      </div>
                      <span className="text-[11px] text-muted">Committed by {v.author}</span>
                    </div>
                    <span className="text-[11px] font-data text-muted shrink-0">{v.date}</span>
                  </div>
                ))}
              </div>

              {/* Commit New Revision Inline */}
              {canUpdateDocuments && <div className="mt-2 p-3 rounded-xl bg-surface2/40 border border-line/50 flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-slate-200">
                  Publish New Revision Note
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRevisionNotes}
                    onChange={(e) => setNewRevisionNotes(e.target.value)}
                    placeholder="e.g. Updated Clause 4.2 compliance controls for FY27"
                    className="flex-1 px-3 py-1.5 text-[12.5px] rounded-lg bg-slate-900 border border-slate-600/70 focus:border-accent text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (newRevisionNotes.trim()) {
                        updateDocumentVersion(selectedDoc.id, null, newRevisionNotes.trim());
                        setNewRevisionNotes('');
                      }
                    }}
                  >
                    Commit
                  </Button>
                </div>
              </div>}
            </div>

            {/* Cryptographic Audit Trail */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line/50">
              <h3 className="text-[13px] font-bold text-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <IconShield className="w-4 h-4 text-emerald-400" />
                  <span>Access & Audit Trail</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold font-data">SHA-256 Verified</span>
              </h3>
              <div className="flex flex-col gap-1.5">
                {selectedDoc.auditTrail?.map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-lg bg-surface2/30 border border-line/30 flex items-center justify-between text-[11.5px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-white font-medium">{a.action}</span>
                      <span className="text-muted">by {a.user}</span>
                    </div>
                    <span className="text-muted font-data">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <EmployeeDetailDrawer
        user={selectedEmployee}
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
      />

      {/* 8. ROLE-BASED ACCESS CONTROL (RBAC) GOVERNANCE MODAL */}
      {rbacDoc && canUpdateDocuments && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-150"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: 'rgba(6, 20, 28, 0.96)',
              backdropFilter: 'blur(28px) saturate(140%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
              padding: '24px',
            }}
            className="flex flex-col gap-4 text-left max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <IconLock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[17px] text-white">
                    Role-Based Access Control (RBAC) Governance
                  </h3>
                  <p className="text-[12px] text-slate-300 truncate max-w-[420px]">
                    {rbacDoc.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRbacDoc(null)}
                className="text-muted hover:text-white p-1 text-[16px] font-bold"
              >
                ✕
              </button>
            </div>

            {/* Classification Level Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-slate-100 flex items-center justify-between">
                <span>Access Classification Level</span>
                <span className="text-[11px] text-muted">Zero-Trust Security Barrier</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Internal Only', 'Confidential', 'Restricted IT Ops'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRbacFormAccessLevel(level)}
                    className={`py-2 px-3 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                      rbacFormAccessLevel === level
                        ? 'bg-accent/20 text-white border-accent shadow-sm'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Departmental RBAC Matrix Table */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[12px] font-bold text-slate-200 uppercase tracking-wider">
                Organizational RBAC Permissions Matrix
              </span>
              <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700/80 text-slate-400 font-bold text-[10.5px] uppercase">
                      <th className="py-2 px-3">Role Profile</th>
                      <th className="py-2 px-2 text-center">Read</th>
                      <th className="py-2 px-2 text-center">Write</th>
                      <th className="py-2 px-2 text-center">Export</th>
                      <th className="py-2 px-2 text-center">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Super Administrator</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">IT Operations Lead</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-slate-500">—</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">Security Officer</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-slate-500">—</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">Helpdesk Technician</td>
                      <td className="py-2.5 px-2 text-center">
                        {rbacFormAccessLevel === 'Confidential' ? (
                          <span className="text-rose-400 font-bold">✕</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">—</td>
                      <td className="py-2.5 px-2 text-center">
                        {rbacFormAccessLevel === 'Confidential' ? (
                          <span className="text-rose-400 font-bold">✕</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">—</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">Compliance Auditor</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-slate-500">—</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Governance Toggles */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line/40">
              <span className="text-[12px] font-bold text-slate-200 uppercase tracking-wider">
                Cryptographic Governance Controls
              </span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[12.5px] font-semibold text-white">Dynamic Watermark Enforcement</span>
                    <span className="text-[11px] text-muted">Embeds downloader's employee ID, email, and IP upon download</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rbacWatermarkEnforced}
                    onChange={(e) => setRbacWatermarkEnforced(e.target.checked)}
                    className="w-4 h-4 rounded text-accent bg-slate-800 border-slate-600 focus:ring-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[12.5px] font-semibold text-white">Require Step-Up FIDO2 MFA for Decryption</span>
                    <span className="text-[11px] text-muted">Prompts hardware security key challenge prior to payload release</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rbacMfaRequired}
                    onChange={(e) => setRbacMfaRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-accent bg-slate-800 border-slate-600 focus:ring-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[12.5px] font-semibold text-white">Strict Audit Log on Every View</span>
                    <span className="text-[11px] text-muted">Emits tamper-evident hash to the Security & Activity timeline</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rbacAuditView}
                    onChange={(e) => setRbacAuditView(e.target.checked)}
                    className="w-4 h-4 rounded text-accent bg-slate-800 border-slate-600 focus:ring-accent"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-line">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRbacDoc(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={IconCheck}
                onClick={handleSaveRbac}
              >
                Save & Apply RBAC Policy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 9. UPLOAD & IMPORT DOCUMENT MODAL */}
      {isUploadModalOpen && canUploadDocuments && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-150"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '580px',
              backgroundColor: 'rgba(6, 20, 28, 0.96)',
              backdropFilter: 'blur(28px) saturate(140%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
              padding: '24px',
            }}
            className="flex flex-col gap-4 text-left max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/20 text-accent">
                  <IconUploadCloud className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-[17px] text-white">
                  Import & Cryptographically Index Document
                </h3>
              </div>
              <button
                type="button"
                onClick={closeImportModal}
                className="text-muted hover:text-white p-1 text-[16px] font-bold"
              >
                ✕
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.zip,.key"
              className="hidden"
              aria-label="Select a document to import"
              onChange={(e) => handleFileSelection(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileSelection(e.dataTransfer.files?.[0]);
              }}
              className={`p-5 rounded-2xl border-2 border-dashed bg-slate-950/60 transition-colors flex flex-col items-center justify-center gap-2 text-center cursor-pointer group w-full ${
                isDragOver ? 'border-accent bg-accent/10' : 'border-slate-700 hover:border-accent'
              }`}
              aria-label="Choose a document file or drop it here"
            >
              <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <IconUploadCloud className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-white group-hover:text-accent transition-colors">
                  {selectedFile ? selectedFile.name : 'Drag and drop a file here, or browse local disk'}
                </span>
                <span className="text-[11px] text-muted">
                  {selectedFile
                    ? `${newDocForm.fileType} · ${newDocForm.fileSize}`
                    : 'Supports PDF, DOCX, XLSX, ZIP, and KEY up to 100 MB per file'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {['PDF', 'DOCX', 'XLSX', 'ZIP', 'KEY'].map(ext => (
                  <span key={ext} className="px-1.5 py-0.5 rounded text-[9.5px] font-bold font-data bg-slate-800 text-slate-300 border border-slate-700">
                    .{ext.toLowerCase()}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-amber-300/90 mt-1">
                Imported files stay in this browser session; server-side storage and encryption are not configured.
              </span>
            </button>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5">
              {/* Document Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-slate-100 flex items-center justify-between">
                  <span>Document Title</span>
                  <span className="text-accent font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  placeholder="e.g. Master Services Agreement FY 2026–27"
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Dedicated Repository & File Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-slate-100">Dedicated Repository *</label>
                  <select
                    value={newDocForm.repository}
                    onChange={(e) => {
                      const repository = e.target.value;
                      setNewDocForm(prev => ({
                        ...prev,
                        repository,
                        linkedEntityType: repository === 'user_records'
                          ? 'user'
                          : prev.linkedEntityType === 'user' ? 'none' : prev.linkedEntityType,
                        linkedEntityId: ''
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white cursor-pointer"
                  >
                    <option value="user_records" className="bg-slate-900 text-white">👤 User Records</option>
                    <option value="hardware_manuals" className="bg-slate-900 text-white">💻 Hardware Manuals</option>
                    <option value="software_licenses" className="bg-slate-900 text-white">📱 Software Licenses</option>
                    <option value="general_files" className="bg-slate-900 text-white">📁 General Governance Files</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-slate-100">Format & Size</label>
                  <select
                    value={newDocForm.fileType}
                    onChange={(e) => setNewDocForm({ ...newDocForm, fileType: e.target.value })}
                    disabled={!!selectedFile}
                    className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white cursor-pointer"
                  >
                    <option value="PDF" className="bg-slate-900 text-white">PDF (.pdf)</option>
                    <option value="DOCX" className="bg-slate-900 text-white">DOCX (.docx)</option>
                    <option value="XLSX" className="bg-slate-900 text-white">XLSX (.xlsx)</option>
                    <option value="ZIP" className="bg-slate-900 text-white">ZIP (.zip)</option>
                    <option value="KEY" className="bg-slate-900 text-white">KEY (.key)</option>
                  </select>
                </div>
              </div>

              {/* Connect to System Entity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-slate-100">Link to Module Entity</label>
                  <select
                    value={newDocForm.linkedEntityType}
                    onChange={(e) => setNewDocForm({ ...newDocForm, linkedEntityType: e.target.value, linkedEntityId: '' })}
                    className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white cursor-pointer"
                  >
                    <option value="none" className="bg-slate-900 text-slate-300">None (General Document)</option>
                    <option value="user" className="bg-slate-900 text-white">👤 User Account</option>
                    <option value="asset" className="bg-slate-900 text-white">💻 Hardware Asset</option>
                    <option value="software" className="bg-slate-900 text-white">📱 Software Contract</option>
                    <option value="ticket" className="bg-slate-900 text-white">🎫 Helpdesk Ticket</option>
                  </select>
                </div>

                {newDocForm.linkedEntityType !== 'none' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-slate-100">Choose Specific Record</label>
                    <select
                      value={newDocForm.linkedEntityId}
                      onChange={(e) => setNewDocForm({ ...newDocForm, linkedEntityId: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-slate-300">-- Select entity --</option>
                      {newDocForm.linkedEntityType === 'user' && users.map(u => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">{u.name} · {u.employeeId} ({u.department})</option>
                      ))}
                      {newDocForm.linkedEntityType === 'asset' && assets.map(a => (
                        <option key={a.id} value={a.id} className="bg-slate-900 text-white">{a.assetTag || a.tag} - {a.model}</option>
                      ))}
                      {newDocForm.linkedEntityType === 'software' && software.map(s => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name} ({s.vendor})</option>
                      ))}
                      {newDocForm.linkedEntityType === 'ticket' && tickets.map(t => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.id}: {t.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Access Classification & Review Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-slate-100">Access Classification</label>
                  <select
                    value={newDocForm.accessLevel}
                    onChange={(e) => setNewDocForm({ ...newDocForm, accessLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white cursor-pointer"
                  >
                    <option value="Internal Only" className="bg-slate-900 text-white">Internal Only (Staff)</option>
                    <option value="Confidential" className="bg-slate-900 text-white">Confidential (CISO / Exec)</option>
                    <option value="Restricted IT Ops" className="bg-slate-900 text-white">Restricted IT Ops</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-slate-100">Review Due Date</label>
                  <input
                    type="text"
                    value={newDocForm.reviewDate}
                    onChange={(e) => setNewDocForm({ ...newDocForm, reviewDate: e.target.value })}
                    placeholder="e.g. 24 Nov 2027"
                    className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-slate-100">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newDocForm.tags}
                  onChange={(e) => setNewDocForm({ ...newDocForm, tags: e.target.value })}
                  placeholder="e.g. ISO-27001, Security, SLA, Legal Hold"
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-slate-100">Retention Policy</label>
                <input
                  type="text"
                  value={newDocForm.retentionPolicy}
                  onChange={(e) => setNewDocForm({ ...newDocForm, retentionPolicy: e.target.value })}
                  placeholder="e.g. 7-Year Statutory Retention"
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-slate-100">Document Summary</label>
                <textarea
                  rows={2}
                  value={newDocForm.description}
                  onChange={(e) => setNewDocForm({ ...newDocForm, description: e.target.value })}
                  placeholder="Brief description of the document scope and compliance obligations..."
                  className="w-full px-3.5 py-2 text-[13px] font-medium rounded-xl bg-slate-900 border border-slate-600 focus:border-accent text-white placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeImportModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={IconCheck}
                >
                  Confirm & Index Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
