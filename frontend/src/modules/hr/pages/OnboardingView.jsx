import React, { useState, useEffect, useCallback } from 'react';
import { KPITile } from '../components/KPITile.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { Icon } from '../components/Icon.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { CANONICAL_CANDIDATES_8 } from '../data/mockDb.js';
import { fetchCandidates } from '../services/documentService.js';

export const OnboardingView = ({ onTriggerToast }) => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Synchronize candidates from backend API and merge with checklist
  const loadCandidatesData = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiCandidates = await fetchCandidates();
      let list = Array.isArray(apiCandidates) && apiCandidates.length > 0 ? apiCandidates : [];

      if (list.length === 0) {
        // Fallback to localStorage or mockDb
        try {
          const stored = localStorage.getItem("hrms_registered_users");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length >= 8) list = parsed;
          }
        } catch (e) {}
      }

      if (list.length === 0) list = CANONICAL_CANDIDATES_8;

      // Merge each candidate with checklist and compute document verification milestones
      const merged = list.map((cand, idx) => {
        const seedMatch = CANONICAL_CANDIDATES_8.find(c => c.id === cand.id) || CANONICAL_CANDIDATES_8[idx] || CANONICAL_CANDIDATES_8[0];
        const docs = cand.onboarding?.documents || cand.documents || seedMatch.documents || [];
        
        const aadhaarDoc = docs.find(d => d.key === 'govt_id');
        const panDoc = docs.find(d => d.key === 'pan_card');
        const eduDoc = docs.find(d => d.key === 'education');
        const expDoc = docs.find(d => d.key === 'experience');
        const bankDoc = docs.find(d => d.key === 'bank_proof');

        const isIdApproved = (aadhaarDoc?.status || '').toLowerCase() === 'approved' && (panDoc?.status || '').toLowerCase() === 'approved';
        const isEduApproved = (eduDoc?.status || '').toLowerCase() === 'approved';
        const isAnyRejected = docs.some(d => (d.status || '').toLowerCase() === 'rejected');
        const isAllApproved = docs.length > 0 && docs.every(d => (d.status || '').toLowerCase() === 'approved');

        const baseChecklist = cand.checklist || seedMatch.checklist || [
          { id: "c1", title: "Identity & PAN Verification", completed: false },
          { id: "c2", title: "Educational Credentials Check", completed: false },
          { id: "c3", title: "Bank Details & PF Nomination", completed: false },
          { id: "c4", title: "Background Verification (BGV)", completed: false },
          { id: "c5", title: "IT Asset & Laptop Allocation", completed: false },
          { id: "c6", title: "Corporate Email & Slack Setup", completed: false }
        ];

        // Synchronize checklist items with document verification results
        const synchronizedChecklist = baseChecklist.map(item => {
          if (item.id === "c1") {
            return { ...item, completed: isIdApproved, error: (aadhaarDoc?.status === 'Rejected' || panDoc?.status === 'Rejected') };
          }
          if (item.id === "c2") {
            return { ...item, completed: isEduApproved, error: eduDoc?.status === 'Rejected' };
          }
          if (item.id === "c3") {
            return { ...item, completed: (bankDoc?.status || '').toLowerCase() === 'approved', error: bankDoc?.status === 'Rejected' };
          }
          return item;
        });

        const completedCount = synchronizedChecklist.filter(c => c.completed).length;
        const progress = Math.round((completedCount / (synchronizedChecklist.length || 1)) * 100);

        return {
          ...seedMatch,
          ...cand,
          documents: docs,
          checklist: synchronizedChecklist,
          progress: progress,
          isAnyRejected,
          isAllApproved,
          rejectedCount: docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length
        };
      });

      setCandidates(merged);
    } catch (err) {
      console.error("OnboardingView load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidatesData();

    // Listen for live document verification events from CandidateVerificationModal or backend
    const handleUpdate = () => {
      loadCandidatesData();
    };

    window.addEventListener("hrms-users-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("hrms-users-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadCandidatesData]);

  // Keep selected candidate fresh
  useEffect(() => {
    if (selectedCandidate) {
      const fresh = candidates.find(c => c.id === selectedCandidate.id);
      if (fresh) setSelectedCandidate(fresh);
    }
  }, [candidates, selectedCandidate?.id]);

  // Toggle checklist item
  const handleToggleChecklistItem = (itemIndex) => {
    if (!selectedCandidate) return;
    const updatedChecklist = [...(selectedCandidate.checklist || [])];
    updatedChecklist[itemIndex] = {
      ...updatedChecklist[itemIndex],
      completed: !updatedChecklist[itemIndex].completed
    };

    const completedCount = updatedChecklist.filter(c => c.completed).length;
    const newProgress = Math.round((completedCount / (updatedChecklist.length || 1)) * 100);

    const updatedCand = {
      ...selectedCandidate,
      checklist: updatedChecklist,
      progress: newProgress
    };

    setSelectedCandidate(updatedCand);
    setCandidates(prev => prev.map(c => c.id === updatedCand.id ? updatedCand : c));
    onTriggerToast?.(`Updated checklist item for ${selectedCandidate.name}`);
  };

  const handleSaveChecklist = () => {
    if (!selectedCandidate) return;
    try {
      localStorage.setItem("hrms_registered_users", JSON.stringify(candidates));
    } catch (e) {}
    onTriggerToast?.(`Onboarding checklist saved for ${selectedCandidate.name} (${selectedCandidate.progress}% completed)`);
    setSelectedCandidate(null);
  };

  const avgProgress = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + (c.progress || 0), 0) / candidates.length)
    : 0;

  return (
    <div className="flex flex-col gap-4 text-left">
      
      {/* 1. KPI SUMMARY TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile metric={String(candidates.length)} label="Active Onboardings" icon="user-check" trend="Nov Batch" />
        <KPITile metric={`${avgProgress}%`} label="Overall Progress" icon="trending-up" trend="Org Average" />
        <KPITile
          metric={String(candidates.filter(c => c.isAllApproved).length) + " / " + candidates.length}
          label="Documents Fully Approved"
          icon="check-circle"
          trend="Verification Passed"
        />
        <KPITile
          metric={String(candidates.filter(c => c.isAnyRejected).length)}
          label="Correction Required"
          icon="alert-triangle"
          trend="Requires Re-upload"
        />
      </div>

      {/* 2. ONBOARDING MATRIX TABLE / CARD */}
      <div className="glass-card !p-5 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <div className="font-display font-bold text-ink text-base md:text-lg flex items-center gap-2">
              <span>New Joiners Onboarding Matrix ({candidates.length} Candidates)</span>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-mono font-semibold">
                Auto-Synced with Verification
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Workflow: Offer Accepted → Documents Submitted → Manual HR Verification → Asset Allocated → Completed
            </div>
          </div>
          <span className="glass-pill px-3 py-1 text-xs font-semibold text-accent border border-accent/30 font-num">
            Hyderabad Legal Entity · NEX-IND
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
            <Icon name="loader" className="w-6 h-6 animate-spin text-accent" />
            <span>Loading synchronized onboarding candidates...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {candidates.map((cand, i) => (
              <div
                key={cand.id || i}
                className={`p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs transition ${
                  cand.isAnyRejected
                    ? 'bg-bad/5 border-bad/40 hover:border-bad'
                    : 'bg-surface2/40 border-line hover:border-accent/40'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <Avatar name={cand.name} className="w-10 h-10 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-ink text-sm truncate">{cand.name}</span>
                      <span className="font-data text-accent font-semibold text-[11px]">({cand.id})</span>
                      
                      {/* Document Verification Sync Status Badge */}
                      {cand.isAnyRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-bad/15 text-bad border border-bad/30">
                          <Icon name="alert-triangle" className="w-3 h-3" />
                          <span>Correction Required ({cand.rejectedCount} doc rejected)</span>
                        </span>
                      ) : cand.isAllApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-good/15 text-good border border-good/30">
                          <Icon name="check-circle" className="w-3 h-3" />
                          <span>All Documents Approved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-warn/15 text-warn border border-warn/30">
                          <Icon name="clock" className="w-3 h-3" />
                          <span>Documents in Review</span>
                        </span>
                      )}
                    </div>

                    <div className="text-muted text-xs mt-0.5">
                      {cand.role} · <span className="text-ink font-medium">{cand.dept}</span> · Joining: <span className="font-num text-ink font-semibold">{cand.joiningDate}</span>
                    </div>

                    <div className="text-accent text-xs mt-1 font-medium flex items-center gap-1.5">
                      <Icon name="check-circle" className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{cand.tasks || "Onboarding pipeline initialized"}</span>
                    </div>
                  </div>
                </div>

                {/* Ultra-lean Progress Bar (h-0.5) */}
                <div className="w-full lg:w-56 shrink-0 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Onboarding Progress</span>
                    <span className="text-ink font-bold font-num">{cand.progress}%</span>
                  </div>
                  <div className="w-full h-0.5 rounded-full bg-surface2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${cand.isAnyRejected ? 'bg-warn' : 'bg-accent'}`}
                      style={{ width: `${cand.progress}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <PrimaryButton
                    onClick={() => setSelectedCandidate(cand)}
                    className="whitespace-nowrap text-xs"
                  >
                    View Details & Milestones
                  </PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. WORKING CHECKLIST & DOCUMENT VERIFICATION DETAILS MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-surface border border-line shadow-2xl p-6 flex flex-col gap-5 text-ink text-xs text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-line gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-ink text-lg">{selectedCandidate.name}</h2>
                  <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
                    {selectedCandidate.id}
                  </span>
                  {selectedCandidate.isAnyRejected && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-bad/15 text-bad border border-bad/30">
                      Action Required: Document Rejected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-1">
                  {selectedCandidate.role} · {selectedCandidate.dept} · Joining Date: <span className="font-num text-ink">{selectedCandidate.joiningDate}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Progress (Ultra-lean Bar) */}
            <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Onboarding Completion</span>
                <span className="font-bold text-accent font-num text-sm">{selectedCandidate.progress}%</span>
              </div>
              <div className="w-full h-0.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${selectedCandidate.progress}%` }}
                />
              </div>
            </div>

            {/* Interactive Checklist Items */}
            <div className="flex flex-col gap-2.5">
              <div className="font-display font-bold text-ink text-sm">
                Candidate Onboarding Milestones
              </div>
              <div className="flex flex-col gap-2">
                {(selectedCandidate.checklist || []).map((item, idx) => (
                  <label
                    key={item.id || idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                      item.completed
                        ? "bg-accent/10 border-accent/30 text-ink"
                        : item.error
                        ? "bg-bad/10 border-bad/30 text-bad"
                        : "bg-surface2/30 border-line text-muted hover:border-line/80 hover:text-ink"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(item.completed)}
                      onChange={() => handleToggleChecklistItem(idx)}
                      className="w-4 h-4 rounded border-line text-accent focus:ring-accent bg-surface2/80 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <span className={`font-medium ${item.completed ? "line-through text-muted" : "text-ink"}`}>
                        {item.title}
                      </span>
                      {item.error && (
                        <span className="block text-[10.5px] text-bad font-semibold mt-0.5">
                          Verification Rejected – Document correction required
                        </span>
                      )}
                    </div>
                    {item.completed ? (
                      <span className="text-accent text-[11px] font-semibold flex items-center gap-1">
                        <Icon name="check" className="w-3.5 h-3.5 text-accent" />
                        Verified
                      </span>
                    ) : item.error ? (
                      <span className="text-bad text-[11px] font-semibold flex items-center gap-1">
                        <Icon name="alert-triangle" className="w-3.5 h-3.5 text-bad" />
                        Rejected
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </div>

            {/* Document Attachments Status (Synchronized with Verification) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-line">
              <div className="font-display font-bold text-ink text-xs flex items-center justify-between">
                <span>Submitted Verification Documents ({selectedCandidate.documents?.length || 0})</span>
                <span className="text-muted text-[11px]">Synced with Document Verification</span>
              </div>
              <div className="flex flex-col gap-2">
                {(selectedCandidate.documents || []).map((doc, dIdx) => {
                  const s = (doc.status || '').toLowerCase();
                  const isApp = s === 'approved' || s === 'verified';
                  const isRej = s === 'rejected';

                  return (
                    <div
                      key={dIdx}
                      className={`p-3 rounded-xl border flex flex-col gap-2 text-xs transition ${
                        isRej
                          ? 'bg-bad/10 border-bad/40'
                          : isApp
                          ? 'bg-good/5 border-good/25'
                          : 'bg-surface2/30 border-line'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-ink flex items-center gap-2">
                            <span>{doc.label}</span>
                            {doc.version && (
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface2 border border-line text-accent font-bold">
                                v{doc.version}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted font-data truncate mt-0.5">{doc.fileName}</div>
                        </div>

                        <div>
                          {isApp ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-good/15 text-good border border-good/30">
                              <Icon name="check" className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          ) : isRej ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-bad/15 text-bad border border-bad/30">
                              <Icon name="x" className="w-3 h-3" />
                              <span>Correction Required</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-warn/15 text-warn border border-warn/30">
                              <Icon name="clock" className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display Rejection Reason if Rejected */}
                      {isRej && doc.rejectReason && (
                        <div className="p-2 rounded-lg bg-bad/20 border border-bad/30 text-[11px] text-bad flex items-start gap-1.5">
                          <Icon name="alert-circle" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-bad" />
                          <div>
                            <span className="font-bold">Rejection Reason:</span>{' '}
                            <span className="text-ink">{doc.rejectReason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
              <SecondaryButton onClick={() => setSelectedCandidate(null)}>
                Close
              </SecondaryButton>
              <PrimaryButton onClick={handleSaveChecklist} icon="check">
                Save & Update Candidate
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingView;