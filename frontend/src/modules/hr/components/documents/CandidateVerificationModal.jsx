import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import {
  verifyCandidateDocument,
  reuploadCandidateDocument,
  getCandidateDocViewUrl,
  getCandidateDocDownloadUrl
} from '../../services/documentService.js';

export const CandidateVerificationModal = ({
  candidate,
  isOpen,
  onClose,
  currentUser,
  onStatusUpdated,
  onViewDocument,
  onTriggerToast
}) => {
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reuploadingDoc, setReuploadingDoc] = useState(null);

  if (!isOpen || !candidate) return null;

  const role = (currentUser?.systemRole || currentUser?.role || '').toLowerCase();
  const isHR = role.includes('hr') || role.includes('admin') || role.includes('lead') || role.includes('manager');

  const documents = candidate.onboarding?.documents || [];
  const requiredDocs = documents.filter(d => d.required);
  const approvedCount = requiredDocs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = requiredDocs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
  const pendingCount = requiredDocs.filter(d => {
    const s = (d.status || '').toLowerCase();
    return s !== 'approved' && s !== 'rejected';
  }).length;

  // Helper to sync candidate update with localStorage & dispatch event for OnboardingView
  const broadcastCandidateUpdate = (updatedCand) => {
    try {
      const stored = localStorage.getItem("hrms_registered_users");
      let list = stored ? JSON.parse(stored) : [];
      if (Array.isArray(list)) {
        const idx = list.findIndex(u => (u.id === updatedCand.id || u.employeeId === updatedCand.id));
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            ...updatedCand,
            documents: (updatedCand.onboarding?.documents || []).map(d => ({
              key: d.key,
              label: d.label,
              status: (d.status || '').toLowerCase() === 'approved' ? 'verified' : (d.status || '').toLowerCase(),
              fileName: d.fileName,
              size: d.size,
              rejectReason: d.rejectReason || ''
            }))
          };
          localStorage.setItem("hrms_registered_users", JSON.stringify(list));
        }
      }
      window.dispatchEvent(new CustomEvent("hrms-users-updated"));
    } catch (e) {
      console.warn("Could not sync localStorage hrms_registered_users:", e);
    }
  };

  const handleApprove = async (doc) => {
    if (!isHR) {
      onTriggerToast && onTriggerToast('Only HR or Admin users have permission to verify documents.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await verifyCandidateDocument({
        candidateId: candidate.id,
        docKey: doc.key,
        action: 'approve',
        reason: '',
        currentUser
      });
      onTriggerToast && onTriggerToast(res.message || `"${doc.label}" approved successfully!`);
      broadcastCandidateUpdate(res.candidate);
      if (onStatusUpdated) {
        onStatusUpdated(res.candidate);
      }
    } catch (err) {
      onTriggerToast && onTriggerToast(err.response?.data?.message || err.message || 'Failed to approve document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRejectDialog = (doc) => {
    if (!isHR) {
      onTriggerToast && onTriggerToast('Only HR or Admin users have permission to verify documents.');
      return;
    }
    setRejectingDoc(doc);
    setRejectionReason(doc.rejectReason || '');
    setRejectionError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingDoc) return;
    
    // Strict validation: Rejection reason is mandatory and cannot be whitespace-only
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectionError('Rejection reason is mandatory. Please provide a clear explanation for the candidate.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await verifyCandidateDocument({
        candidateId: candidate.id,
        docKey: rejectingDoc.key,
        action: 'reject',
        reason: rejectionReason.trim(),
        currentUser
      });
      onTriggerToast && onTriggerToast(res.message || `"${rejectingDoc.label}" was marked as rejected.`);
      setRejectingDoc(null);
      setRejectionReason('');
      setRejectionError('');
      broadcastCandidateUpdate(res.candidate);
      if (onStatusUpdated) {
        onStatusUpdated(res.candidate);
      }
    } catch (err) {
      onTriggerToast && onTriggerToast(err.response?.data?.message || err.message || 'Failed to reject document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateReupload = async (doc) => {
    try {
      setIsSubmitting(true);
      const nextVer = (doc.version || 1) + 1;
      const cleanLabel = doc.label.replace(/\s+/g, '_');
      const newFileName = `${candidate.name.split(' ')[0]}_${cleanLabel}_v${nextVer}.pdf`;

      const res = await reuploadCandidateDocument({
        candidateId: candidate.id,
        docKey: doc.key,
        fileName: newFileName
      });
      onTriggerToast && onTriggerToast(res.message || `Corrected version uploaded for "${doc.label}". Ready for HR re-verification!`);
      setReuploadingDoc(null);
      broadcastCandidateUpdate(res.candidate);
      if (onStatusUpdated) {
        onStatusUpdated(res.candidate);
      }
    } catch (err) {
      onTriggerToast && onTriggerToast(err.response?.data?.message || err.message || 'Failed to re-upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCandidateStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'docs_approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-good/15 text-good border border-good/30">
          <Icon name="check-circle" className="w-3.5 h-3.5" />
          <span>docs_approved (All Verified)</span>
        </span>
      );
    }
    if (s === 'docs_rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-bad/15 text-bad border border-bad/30 animate-pulse">
          <Icon name="alert-triangle" className="w-3.5 h-3.5" />
          <span>docs_rejected (Correction Required)</span>
        </span>
      );
    }
    if (s === 'offer_accepted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
          <Icon name="clock" className="w-3.5 h-3.5" />
          <span>offer_accepted (Awaiting Review)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warn/15 text-warn border border-warn/30">
        <Icon name="clock" className="w-3.5 h-3.5" />
        <span>docs_review (In Review)</span>
      </span>
    );
  };

  const renderDocStatusBadge = (doc) => {
    const s = (doc.status || 'Pending').toLowerCase();
    if (s === 'approved') {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-good/15 text-good border border-good/30">
            <Icon name="check" className="w-3 h-3" />
            <span>Approved</span>
          </span>
          <span className="text-[10px] text-muted font-data truncate max-w-[150px]">
            {doc.verifiedBy ? `by ${doc.verifiedBy}` : 'Repository synced'}
          </span>
        </div>
      );
    }
    if (s === 'rejected') {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-bad/15 text-bad border border-bad/30">
            <Icon name="x" className="w-3 h-3" />
            <span>Rejected</span>
          </span>
          <span className="text-[10px] text-bad font-semibold">Correction Required</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warn/15 text-warn border border-warn/30">
        <Icon name="clock" className="w-3 h-3" />
        <span>Pending Review</span>
      </span>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-6xl max-h-[94vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-left overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-surface/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0">
              <Icon name="user-check" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display font-bold text-ink text-base sm:text-lg">
                  Candidate Document Verification: {candidate.name}
                </h3>
                {renderCandidateStatusBadge(candidate.accessStatus)}
              </div>
              <div className="text-xs text-muted mt-0.5 flex items-center gap-3 flex-wrap">
                <span>Candidate ID: <strong className="text-accent font-data">{candidate.id || candidate.employeeId}</strong></span>
                <span>Role: <strong className="text-ink">{candidate.role || candidate.designation}</strong></span>
                <span>Dept: <strong className="text-ink">{candidate.dept || candidate.department}</strong></span>
                <span>Joining: <strong className="text-ink font-data">{candidate.joinedDate || candidate.joiningDate}</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink transition hover:border-line/80 shrink-0"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Summary Tracker Banner */}
        <div className="px-5 py-3 border-b border-line bg-surface2/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-muted font-medium">Verification Summary:</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold text-good bg-good/10 px-2.5 py-0.5 rounded-lg border border-good/20">
                <Icon name="check-circle" className="w-3.5 h-3.5" />
                <span>{approvedCount} Approved</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-warn bg-warn/10 px-2.5 py-0.5 rounded-lg border border-warn/20">
                <Icon name="clock" className="w-3.5 h-3.5" />
                <span>{pendingCount} Pending</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-bad bg-bad/10 px-2.5 py-0.5 rounded-lg border border-bad/20">
                <Icon name="alert-circle" className="w-3.5 h-3.5" />
                <span>{rejectedCount} Rejected</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <Icon name="history" className="w-3.5 h-3.5" />
              <span>{showHistory ? 'Hide Verification Audit Trail' : 'View Verification Audit Trail'}</span>
            </button>
          </div>
        </div>

        {/* Verification History Section (Toggleable) */}
        {showHistory && (
          <div className="p-4 border-b border-line bg-surface/80 max-h-48 overflow-y-auto shrink-0 animate-in fade-in">
            <h4 className="font-semibold text-xs text-ink mb-2 flex items-center gap-1.5">
              <Icon name="clock" className="w-3.5 h-3.5 text-accent" />
              <span>Immutable Verification Audit Trail</span>
            </h4>
            {candidate.onboarding?.history?.length > 0 ? (
              <div className="divide-y divide-line/40 text-[11px]">
                {candidate.onboarding.history.map((h, idx) => (
                  <div key={idx} className="py-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-ink">{h.action}</span>
                      {h.detail && <span className="text-muted ml-1.5">— {h.detail}</span>}
                    </div>
                    <div className="text-right whitespace-nowrap text-muted font-data text-[10.5px] shrink-0">
                      <span>{h.by} ({h.role}) • {new Date(h.at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-xs">No verification history recorded yet.</p>
            )}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          
          {/* Scroll Hint Alert for users on smaller screens */}
          <div className="text-[11px] text-muted flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5">
              <Icon name="shield" className="w-3.5 h-3.5 text-accent" />
              <span>Every document requires manual HR inspection. Scroll horizontally if needed to access all actions.</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-accent font-semibold">
              <Icon name="arrow-right" className="w-3 h-3" />
              <span>Scroll horizontally to view actions</span>
            </span>
          </div>

          {/* Documents Table Container with HORIZONTAL & VERTICAL SCROLLING */}
          <div className="glass-card !p-0 border border-line rounded-xl overflow-hidden flex flex-col shadow-inner">
            <div 
              className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-line scrollbar-track-surface2"
              style={{ WebkitOverflowScrolling: 'touch', minHeight: '260px' }}
            >
              <table className="w-full min-w-[940px] text-left text-xs divide-y divide-line">
                <thead className="bg-surface2/80 border-b border-line text-muted uppercase text-[10.5px] font-semibold sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="py-3 px-4 w-[220px] min-w-[200px]">Document & Type</th>
                    <th className="py-3 px-4 w-[260px] min-w-[220px]">File Details & Version</th>
                    <th className="py-3 px-4 w-[120px] min-w-[110px] whitespace-nowrap">Uploaded Date</th>
                    <th className="py-3 px-4 w-[140px] min-w-[130px] whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 w-[280px] min-w-[270px] whitespace-nowrap text-right pr-6">
                      Manual Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-line bg-surface/30">
                  {documents.map((doc) => {
                    const docStatus = (doc.status || 'Pending').toLowerCase();
                    const isApproved = docStatus === 'approved';
                    const isRejected = docStatus === 'rejected';
                    const docVersion = doc.version || 1;

                    return (
                      <tr key={doc.key} className="hover:bg-surface2/40 transition">
                        
                        {/* 1. Document Label */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center text-accent shrink-0 mt-0.5">
                              <Icon name="file-text" className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-ink flex items-center gap-1.5 flex-wrap">
                                <span>{doc.label}</span>
                                {doc.required && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-accent2/20 text-accent2 border border-accent2/40">
                                    Mandatory
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted mt-0.5">
                                {doc.category || 'Official Proof'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Filename, Version & Details */}
                        <td className="py-3.5 px-4 align-top">
                          <div>
                            <div className="font-data text-ink text-[11.5px] flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface2 border border-line text-accent font-bold">
                                PDF
                              </span>
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-accent/15 border border-accent/30 text-accent font-bold">
                                v{docVersion}
                              </span>
                              <span className="truncate max-w-[200px]" title={doc.fileName}>
                                {doc.fileName || 'Pending upload'}
                              </span>
                            </div>
                            <div className="text-[10.5px] text-muted font-data mt-0.5">
                              Size: {doc.formattedSize || '450 KB'}
                            </div>

                            {/* Prominent Rejection Reason alert when rejected */}
                            {isRejected && doc.rejectReason && (
                              <div className="mt-2 p-2.5 rounded-lg bg-bad/15 border border-bad/30 text-[11px] text-bad flex items-start gap-2 animate-in fade-in">
                                <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5 text-bad" />
                                <div className="min-w-0">
                                  <span className="font-bold uppercase tracking-wider text-[10px] block text-bad">
                                    Rejection Reason:
                                  </span>
                                  <span className="text-ink font-medium">{doc.rejectReason}</span>
                                  {doc.verifiedBy && (
                                    <span className="text-[10px] text-muted block mt-0.5">
                                      Flagged by {doc.verifiedBy}
                                    </span>
                                  )}
                                  
                                  {/* Quick Correction Re-upload Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleSimulateReupload(doc)}
                                    disabled={isSubmitting}
                                    className="mt-2 px-2.5 py-1 rounded bg-bad/20 hover:bg-bad text-white text-[10.5px] font-semibold transition flex items-center gap-1"
                                    title="Upload corrected version for this rejected document"
                                  >
                                    <Icon name="upload" className="w-3 h-3" />
                                    <span>Simulate Candidate Correction Upload (v{docVersion + 1})</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Version history note */}
                            {doc.versionHistory?.length > 0 && (
                              <div className="mt-1 text-[10px] text-muted font-data">
                                Previous versions: {doc.versionHistory.length} archived
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Uploaded Date */}
                        <td className="py-3.5 px-4 font-data text-muted whitespace-nowrap align-top">
                          {doc.formattedDate || '13 Nov 2026'}
                        </td>

                        {/* 4. Verification Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          {renderDocStatusBadge(doc)}
                        </td>

                        {/* 5. MANUAL ACTIONS (ALL BUTTONS SIDE-BY-SIDE & HORIZONTALLY SCROLLABLE) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap align-top pr-6">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => {
                                onViewDocument && onViewDocument({
                                  id: `cand-${candidate.id}-${doc.key}`,
                                  name: `${candidate.name} - ${doc.label}`,
                                  fileName: doc.fileName,
                                  fileType: 'PDF',
                                  category: doc.category || 'Onboarding Document',
                                  uploaderName: candidate.name,
                                  uploaderId: candidate.id,
                                  formattedSize: doc.formattedSize || '450 KB',
                                  formattedDate: doc.formattedDate || '13 Nov 2026',
                                  viewUrl: getCandidateDocViewUrl(candidate.id, doc.key),
                                  downloadUrl: getCandidateDocDownloadUrl(candidate.id, doc.key)
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-line text-accent hover:border-accent hover:bg-surface2/80 font-semibold text-[11px] transition flex items-center gap-1 shadow-sm"
                              title="View Document Preview"
                            >
                              <Icon name="eye" className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {/* Download Button */}
                            <a
                              href={getCandidateDocDownloadUrl(candidate.id, doc.key)}
                              download={doc.fileName || `${candidate.name}_${doc.label}.pdf`}
                              className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-line text-ink hover:text-accent hover:border-accent font-semibold text-[11px] transition flex items-center gap-1 shadow-sm"
                              title="Download Original File"
                            >
                              <Icon name="download" className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>

                            {/* SEPARATE APPROVE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleApprove(doc)}
                              disabled={isSubmitting || isApproved}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition flex items-center gap-1.5 shadow-md ${
                                isApproved
                                  ? 'bg-good/20 text-good border border-good/40 cursor-default opacity-80'
                                  : 'bg-good text-white hover:brightness-110 active:scale-[0.98]'
                              }`}
                              title={isApproved ? "Document is Approved" : "Approve this document"}
                            >
                              <Icon name="check" className="w-3.5 h-3.5" />
                              <span>{isApproved ? 'Approved' : 'Approve'}</span>
                            </button>

                            {/* SEPARATE REJECT BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleOpenRejectDialog(doc)}
                              disabled={isSubmitting}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition flex items-center gap-1.5 shadow-md ${
                                isRejected
                                  ? 'bg-bad/20 text-bad border border-bad/40 cursor-default opacity-80'
                                  : 'bg-bad text-white hover:brightness-110 active:scale-[0.98]'
                              }`}
                              title="Reject this document and provide mandatory reason"
                            >
                              <Icon name="x" className="w-3.5 h-3.5" />
                              <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Guidance Box */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line text-xs text-muted flex items-start gap-2.5">
            <Icon name="info" className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ink">Candidate Document Verification Rules:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                <li>Both <strong>Approve</strong> and <strong>Reject</strong> buttons are always accessible side-by-side with full horizontal scroll support.</li>
                <li>Clicking <strong>Approve</strong> marks the document as approved and archives it into the <strong>Document Repository</strong>.</li>
                <li>Clicking <strong>Reject</strong> opens the mandatory reason dialog. Rejected documents also appear in the Document Repository with their rejection details and update the candidate to <strong>docs_rejected</strong> in Onboarding.</li>
                <li>Candidates who submit corrections increment document versions while preserving rejection audit history.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-surface/90 shrink-0">
          <div className="text-[11px] text-muted">
            SOC-2 & ISO 27001 Audit Trail: All decisions are timestamped and digitally attributed.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition active:scale-[0.98]"
          >
            Close Window
          </button>
        </div>

      </div>

      {/* ================= REJECT DOCUMENT - MANDATORY REASON POPUP ================= */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card !p-5 max-w-lg w-full border border-bad/50 shadow-2xl relative animate-in fade-in zoom-in-95 text-left">
            
            {/* Rejection Header */}
            <div className="flex items-center gap-3 text-bad mb-3">
              <div className="w-10 h-10 rounded-xl bg-bad/15 border border-bad/30 flex items-center justify-center shrink-0">
                <Icon name="alert-triangle" className="w-5 h-5 text-bad" />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink text-base">Reject Document</h3>
                <p className="text-xs text-muted">Mandatory audit verification & candidate notification</p>
              </div>
            </div>

            {/* Candidate & Document Details */}
            <div className="p-3 rounded-xl bg-surface2/60 border border-line mb-3 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted">Candidate Name:</span>
                <span className="font-bold text-ink">{candidate.name} ({candidate.id || candidate.employeeId})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Document Name:</span>
                <span className="font-bold text-accent">{rejectingDoc.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">File Name:</span>
                <span className="font-mono text-muted text-[11px] truncate max-w-[240px]">{rejectingDoc.fileName}</span>
              </div>
            </div>

            {/* Mandatory Reason Input */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-ink mb-1">
                Rejection Reason <span className="text-bad font-bold">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError('');
                }}
                placeholder="Enter the reason for rejecting this document..."
                className={`w-full p-3 rounded-xl bg-surface2 border text-xs text-ink placeholder:text-muted focus:outline-none transition ${
                  rejectionError ? 'border-bad ring-1 ring-bad/50' : 'border-line focus:border-bad'
                }`}
                autoFocus
              />
              
              {/* Validation Error Message */}
              {rejectionError && (
                <div className="mt-1.5 text-xs text-bad flex items-center gap-1 font-semibold animate-in fade-in">
                  <Icon name="alert-circle" className="w-3.5 h-3.5 shrink-0" />
                  <span>{rejectionError}</span>
                </div>
              )}
            </div>

            {/* Rejection Reviewer Info Notice */}
            <div className="text-[11px] text-muted mb-4 bg-surface2/30 p-2.5 rounded-lg border border-line/60">
              Reviewer: <strong className="text-ink">{currentUser?.name || 'HR Manager'}</strong> ({currentUser?.systemRole || 'HR'}) • Timestamp will be recorded in audit log.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setRejectingDoc(null);
                  setRejectionReason('');
                  setRejectionError('');
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold text-muted hover:text-ink transition"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-bad hover:bg-bad/90 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <Icon name="x" className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>,
    document.body
  );
};
