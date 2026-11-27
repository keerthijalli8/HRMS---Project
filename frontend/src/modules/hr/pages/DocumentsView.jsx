import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { KPITile } from '../components/KPITile.jsx';
import { Icon } from '../components/Icon.jsx';
import { getQueue } from '../services/onboardingFlow.js';
import {
  fetchDocuments,
  deleteDocument,
  getDocumentDownloadUrl,
  fetchCandidates
} from '../services/documentService.js';
import { UploadDocumentModal } from '../components/documents/UploadDocumentModal.jsx';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal.jsx';
import { CandidateVerificationModal } from '../components/documents/CandidateVerificationModal.jsx';

export const DocumentsView = ({ currentUser, onTriggerToast }) => {
  // Determine user & role
  const user = currentUser || (() => {
    try {
      const saved = localStorage.getItem("hrms_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  const role = (user?.systemRole || user?.role || "").toLowerCase();
  const isHR = role.includes("hr") || role.includes("admin") || role.includes("lead") || role.includes("manager");

  // HR tabs: "repository" (Real persistent backend approved & rejected docs) & "queue" (Candidate Onboarding Queue)
  const [activeTab, setActiveTab] = useState("repository");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Persistent Backend Documents
  const [backendDocs, setBackendDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Candidates Verification Queue Data
  const [candidatesList, setCandidatesList] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Load persistent backend documents (displays approved and rejected documents in repository)
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const docs = await fetchDocuments({
        currentUser: user,
        category: categoryFilter,
        search: searchQuery
      });
      setBackendDocs(docs);
    } catch (err) {
      console.error("Failed to load backend documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [user, categoryFilter, searchQuery]);

  // Load candidate list from backend API
  const loadCandidates = useCallback(async () => {
    try {
      setIsLoadingCandidates(true);
      const cands = await fetchCandidates();
      if (Array.isArray(cands) && cands.length > 0) {
        setCandidatesList(cands);
      } else {
        const fallback = getQueue(user);
        setCandidatesList(fallback.candidates || []);
      }
    } catch (err) {
      console.warn("Falling back to local queue:", err);
      const fallback = getQueue(user);
      setCandidatesList(fallback.candidates || []);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocuments();
    loadCandidates();
  }, [loadDocuments, loadCandidates]);

  // Keep selected candidate updated if candidatesList updates
  useEffect(() => {
    if (selectedCandidate) {
      const fresh = candidatesList.find(c => c.id === selectedCandidate.id || c.employeeId === selectedCandidate.employeeId);
      if (fresh) setSelectedCandidate(fresh);
    }
  }, [candidatesList, selectedCandidate?.id]);

  // Handle Document Delete
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      setIsDeleting(true);
      await deleteDocument({
        documentId: deletingDoc.id,
        currentUser: user
      });
      onTriggerToast && onTriggerToast(`"${deletingDoc.name}" was permanently deleted.`);
      setDeletingDoc(null);
      await loadDocuments();
    } catch (err) {
      onTriggerToast && onTriggerToast(err.response?.data?.message || err.message || "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for file type pill styling
  const renderFormatBadge = (fileType) => {
    const type = (fileType || 'PDF').toUpperCase();
    let badgeColor = "bg-accent/15 text-accent border-accent/30";
    if (type === "PDF") badgeColor = "bg-bad/15 text-bad border-bad/30";
    if (type === "DOC" || type === "DOCX") badgeColor = "bg-accent/20 text-accent border-accent/40";
    if (type === "PNG" || type === "JPG" || type === "JPEG") badgeColor = "bg-good/15 text-good border-good/30";

    return (
      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
        {type}
      </span>
    );
  };

  const renderCandidateStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'docs_approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-good/15 text-good border border-good/30">
          <Icon name="check-circle" className="w-3 h-3" />
          <span>docs_approved</span>
        </span>
      );
    }
    if (s === 'docs_rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-bad/15 text-bad border border-bad/30">
          <Icon name="alert-triangle" className="w-3 h-3" />
          <span>docs_rejected</span>
        </span>
      );
    }
    if (s === 'offer_accepted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-accent/15 text-accent border border-accent/30">
          <Icon name="clock" className="w-3 h-3" />
          <span>offer_accepted</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-warn/15 text-warn border border-warn/30">
        <Icon name="clock" className="w-3 h-3" />
        <span>docs_review</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 text-xs text-left">
      
      {/* Top Header & Tab Pill Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
        <div className="flex items-center gap-2">
          {isHR ? (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface2/60 border border-line">
              <button
                type="button"
                onClick={() => setActiveTab("repository")}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition flex items-center gap-2 ${
                  activeTab === "repository"
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Icon name="folder" className="w-3.5 h-3.5" />
                <span>Document Repository</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-surface2 text-ink border border-line">
                  {backendDocs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition flex items-center gap-2 ${
                  activeTab === "queue"
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Icon name="users" className="w-3.5 h-3.5" />
                <span>Verification Queue</span>
                {candidatesList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-accent text-on-accent">
                    {candidatesList.length}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div>
              <h2 className="font-display font-bold text-ink text-lg">My Documents & Credentials</h2>
              <p className="text-xs text-muted">Upload and manage your persistent employee documents</p>
            </div>
          )}
        </div>

        {/* Action Button: Upload Document */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent font-semibold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition active:scale-[0.98]"
          >
            <Icon name="upload" className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: DOCUMENT REPOSITORY (APPROVED & REJECTED DOCUMENTS) ================= */}
      {(!isHR || activeTab === "repository") && (
        <div className="flex flex-col gap-4">
          
          {/* Summary KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPITile
              metric={String(backendDocs.length)}
              label={isHR ? "Total Repository Documents" : "My Stored Documents"}
              icon="file-text"
            />
            <KPITile
              metric={String(backendDocs.filter(d => (d.status || d.approvalStatus || '').includes("Approved") || (d.status || '').includes("Verified") || (d.status || '').includes("Active")).length)}
              label="Approved & Verified"
              icon="check-circle"
            />
            <KPITile
              metric={String(backendDocs.filter(d => (d.status || d.approvalStatus || '').includes("Rejected")).length)}
              label="Rejected / Action Required"
              icon="alert-triangle"
            />
            <KPITile
              metric={
                backendDocs.length > 0
                  ? `${(backendDocs.reduce((acc, d) => acc + (d.size || 0), 0) / 1024).toFixed(1)} KB`
                  : "0 KB"
              }
              label="Backend Storage Used"
              icon="hard-drive"
            />
          </div>

          {/* Filters Bar: Search, Category & Status */}
          <div className="glass-card !p-3.5 border border-line rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by candidate name, ID, document type, or file..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface2 border border-line text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                />
                <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-muted text-[11px] whitespace-nowrap">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-surface2 border border-line text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="All">All Categories</option>
                  <option value="Identity Proof">Identity Proof</option>
                  <option value="Educational Degree / Certificate">Educational Degree</option>
                  <option value="Employment / Relieving Letter">Employment Letter</option>
                  <option value="Bank Proof / Cancelled Cheque">Bank Proof</option>
                  <option value="Salary Slip / Form 16">Salary / Form 16</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted text-[11px] whitespace-nowrap">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-surface2 border border-line text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved Only</option>
                  <option value="Rejected">Rejected Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="glass-card !p-0 overflow-hidden border border-line rounded-[20px]">
            <div className="p-4 border-b border-line flex items-center justify-between bg-surface/40">
              <div>
                <h3 className="font-display font-bold text-ink text-sm sm:text-base">
                  {isHR ? "Enterprise Employee & Candidate Document Repository" : "My Personal Documents"}
                </h3>
                <p className="text-[11px] text-muted">
                  Displays all verification outcomes, approval timestamps, rejection reasons, and persistent storage references
                </p>
              </div>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
                {backendDocs.filter(d => {
                  if (statusFilter === 'All') return true;
                  const s = (d.status || d.approvalStatus || '').toLowerCase();
                  if (statusFilter === 'Approved') return s.includes('approved') || s.includes('active') || s.includes('verified');
                  if (statusFilter === 'Rejected') return s.includes('rejected');
                  if (statusFilter === 'Pending') return s.includes('pending');
                  return true;
                }).length} files
              </span>
            </div>

            {isLoadingDocs ? (
              <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
                <Icon name="loader" className="w-6 h-6 animate-spin text-accent" />
                <span>Loading documents from repository...</span>
              </div>
            ) : backendDocs.length === 0 ? (
              <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface2 border border-line text-muted flex items-center justify-center">
                  <Icon name="file-text" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-ink text-sm">No Documents Found</div>
                  <div className="text-xs text-muted mt-1 max-w-sm">
                    {searchQuery || categoryFilter !== 'All'
                      ? "No documents matched your current search or category filter."
                      : "Verified or rejected candidate documents automatically appear here when reviewed in the Verification Queue."}
                  </div>
                </div>
                {isHR && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("queue")}
                    className="mt-1 px-4 py-1.5 rounded-lg bg-accent text-on-accent font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Icon name="users" className="w-3.5 h-3.5" />
                    <span>Go to Verification Queue</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[940px]">
                  <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Document & Type</th>
                      {isHR && <th className="py-3 px-4">Candidate / Employee</th>}
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Format & Size</th>
                      <th className="py-3 px-4">Verification Date</th>
                      {isHR && <th className="py-3 px-4">Reviewed By</th>}
                      <th className="py-3 px-4">Verification Status</th>
                      <th className="py-3 px-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-line">
                    {backendDocs
                      .filter(d => {
                        if (statusFilter === 'All') return true;
                        const s = (d.status || d.approvalStatus || '').toLowerCase();
                        if (statusFilter === 'Approved') return s.includes('approved') || s.includes('active') || s.includes('verified');
                        if (statusFilter === 'Rejected') return s.includes('rejected');
                        if (statusFilter === 'Pending') return s.includes('pending');
                        return true;
                      })
                      .map((doc) => {
                        const isRejected = (doc.status || doc.approvalStatus || '').toLowerCase().includes('rejected');
                        const isApproved = (doc.status || doc.approvalStatus || '').toLowerCase().includes('approved') || (doc.status || '').toLowerCase().includes('active') || (doc.status || '').toLowerCase().includes('verified');

                        return (
                          <tr key={doc.id} className="hover:bg-surface2/40 transition">
                            
                            {/* Document Name & Filename */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-surface2 border border-line flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
                                  <Icon name="file-text" className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-ink">{doc.name}</span>
                                    {doc.version && (
                                      <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface2 border border-line text-accent font-bold">
                                        v{doc.version}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted font-data truncate max-w-[200px]" title={doc.fileName}>
                                    {doc.fileName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Candidate / Employee Name & ID */}
                            {isHR && (
                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <div className="font-semibold text-ink">
                                  {doc.candidateName || doc.uploaderName || 'Staff Member'}
                                </div>
                                <div className="text-[10.5px] font-data text-accent font-semibold">
                                  {doc.candidateId || doc.employeeId || doc.uploaderId}
                                </div>
                              </td>
                            )}

                            {/* Category */}
                            <td className="py-3.5 px-4 text-muted whitespace-nowrap align-top">
                              {doc.category || doc.documentType || 'General'}
                            </td>

                            {/* Format & Size */}
                            <td className="py-3.5 px-4 whitespace-nowrap align-top">
                              <div className="flex items-center gap-1.5 font-data text-muted">
                                {renderFormatBadge(doc.fileType)}
                                <span>{doc.formattedSize}</span>
                              </div>
                            </td>

                            {/* Verification Date */}
                            <td className="py-3.5 px-4 font-data text-ink whitespace-nowrap align-top">
                              {doc.formattedReviewedDate || doc.formattedApprovalDate || doc.formattedDate || 'Recent'}
                            </td>

                            {/* Reviewed By */}
                            {isHR && (
                              <td className="py-3.5 px-4 whitespace-nowrap text-muted text-xs align-top">
                                <span className="font-medium text-ink">
                                  {doc.reviewedBy || doc.approvedBy || doc.uploaderName || 'HR Verified'}
                                </span>
                              </td>
                            )}

                            {/* Verification Status with Rejection Reason Callout */}
                            <td className="py-3.5 px-4 whitespace-nowrap align-top">
                              {isRejected ? (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-bad/15 text-bad border border-bad/30">
                                    <Icon name="x" className="w-3 h-3" />
                                    <span>Rejected</span>
                                  </span>
                                  {doc.rejectReason && (
                                    <span
                                      className="text-[10px] text-bad font-medium bg-bad/10 px-2 py-0.5 rounded border border-bad/20 truncate max-w-[210px]"
                                      title={doc.rejectReason}
                                    >
                                      Reason: {doc.rejectReason}
                                    </span>
                                  )}
                                </div>
                              ) : isApproved ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-good/15 text-good border border-good/30">
                                  <Icon name="check" className="w-3 h-3" />
                                  <span>Approved</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-warn/15 text-warn border border-warn/30">
                                  <Icon name="clock" className="w-3 h-3" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap align-top pr-6">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View Button */}
                                <button
                                  type="button"
                                  onClick={() => setViewingDoc(doc)}
                                  className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-accent hover:border-accent font-semibold text-[11px] transition flex items-center gap-1 shadow-sm"
                                  title="View Document"
                                >
                                  <Icon name="eye" className="w-3 h-3" />
                                  <span>View</span>
                                </button>

                                {/* Download Button */}
                                <a
                                  href={getDocumentDownloadUrl(doc.id)}
                                  download={doc.fileName}
                                  className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-ink hover:text-accent hover:border-accent font-semibold text-[11px] transition flex items-center gap-1 shadow-sm"
                                  title="Download File"
                                >
                                  <Icon name="download" className="w-3 h-3" />
                                  <span>Download</span>
                                </a>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => setDeletingDoc(doc)}
                                  className="p-1 rounded-lg bg-surface2 border border-line text-muted hover:text-bad hover:border-bad/40 transition"
                                  title="Delete Document"
                                >
                                  <Icon name="trash-2" className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: CANDIDATE VERIFICATION QUEUE (HR ONLY) ================= */}
      {isHR && activeTab === "queue" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card !p-4 border border-line rounded-[20px]">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Candidate Onboarding & Document Verification Queue</h3>
                <p className="text-xs text-muted">Aadhaar, PAN, degree certificate, cancelled cheque and relieving letter verification across candidates</p>
              </div>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
                {candidatesList.length} Candidates
              </span>
            </div>

            {isLoadingCandidates ? (
              <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
                <Icon name="loader" className="w-6 h-6 animate-spin text-accent" />
                <span>Loading candidates verification queue...</span>
              </div>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Candidate ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Role / Department</th>
                      <th className="py-3 px-4">Joining Date</th>
                      <th className="py-3 px-4">Verification Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-line">
                    {candidatesList.map((cand) => (
                      <tr key={cand.id} className="hover:bg-surface2/40 transition">
                        <td className="py-3.5 px-4 font-data font-semibold text-accent">{cand.employeeId || cand.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-ink">{cand.name}</div>
                          <div className="text-[11px] text-muted">{cand.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                          <span className="font-medium text-ink">{cand.role || cand.designation}</span>
                          <span className="text-[11px] block text-muted">{cand.dept || cand.department}</span>
                        </td>
                        <td className="py-3.5 px-4 font-data text-muted whitespace-nowrap">
                          {cand.joinedDate || cand.joiningDate}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderCandidateStatusBadge(cand.accessStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className="px-3 py-1.5 rounded-lg bg-accent text-on-accent hover:brightness-110 text-[11px] font-semibold transition shadow-md flex items-center gap-1.5 ml-auto active:scale-[0.98]"
                          >
                            <Icon name="file-text" className="w-3.5 h-3.5" />
                            <span>Review Documents</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={user}
        onUploadSuccess={() => {
          loadDocuments();
        }}
        onTriggerToast={onTriggerToast}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingDoc}
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />

      {/* Delete Confirmation Modal */}
      {deletingDoc && createPortal(
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card !p-5 max-w-md w-full border border-line shadow-2xl relative animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center gap-3 text-bad mb-3">
              <div className="w-10 h-10 rounded-xl bg-bad/15 border border-bad/30 flex items-center justify-center">
                <Icon name="alert-triangle" className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink text-base">Delete Document?</h3>
                <p className="text-xs text-muted">This will permanently remove the file from storage</p>
              </div>
            </div>

            <p className="text-xs text-ink/80 mt-2 bg-surface2/50 p-3 rounded-lg border border-line">
              Are you sure you want to permanently delete <strong>{deletingDoc.name}</strong> ({deletingDoc.fileName})? This action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-surface2 border border-line text-xs font-semibold text-muted hover:text-ink transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-bad text-white font-semibold text-xs hover:brightness-110 transition flex items-center gap-1.5 shadow-lg"
              >
                {isDeleting ? (
                  <>
                    <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Complete Candidate Manual Verification Modal */}
      <CandidateVerificationModal
        isOpen={!!selectedCandidate}
        candidate={selectedCandidate}
        currentUser={user}
        onClose={() => setSelectedCandidate(null)}
        onStatusUpdated={(updatedCandidate) => {
          setSelectedCandidate(updatedCandidate);
          loadCandidates();
          loadDocuments();
        }}
        onViewDocument={(doc) => setViewingDoc(doc)}
        onTriggerToast={onTriggerToast}
      />

    </div>
  );
};
