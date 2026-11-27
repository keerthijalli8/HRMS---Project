import React, { useState, useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { logEvent } from '../services/auditService.js';
import {
  calculateSalaryBreakup,
  buildOfferPDF,
  downloadOfferLetter,
  offerFileName,
  fmtNum,
  fmtDate,
} from '../utils/offerletter.js';

const INITIAL_JOBS = [
  { id: "JOB-101", title: "Senior React Developer", dept: "Engineering", type: "Full-Time", location: "Hyderabad / Remote", openings: 3, status: "Active" },
  { id: "JOB-102", title: "UI/UX Designer", dept: "Product & Design", type: "Full-Time", location: "Bengaluru", openings: 2, status: "Active" },
  { id: "JOB-103", title: "HR Operations Associate", dept: "HR & Operations", type: "Full-Time", location: "Hyderabad", openings: 1, status: "Active" }
];

const INITIAL_CANDIDATES = [
  { id: "CAND-01", name: "Rahul Deshmukh", role: "Senior React Developer", email: "rahul@example.com", stage: "Interview", rating: "4.8/5", expectedCtc: "" },
  { id: "CAND-02", name: "Neha Kulkarni", role: "UI/UX Designer", email: "neha@example.com", stage: "Hired", rating: "4.9/5", expectedCtc: "" },
  { id: "CAND-03", name: "Vikram Malhotra", role: "HR Operations Associate", email: "vikram@example.com", stage: "Applied", rating: "4.2/5", expectedCtc: "" }
];

const INITIAL_OFFERS = [
  { id: "OFF-2026-001", candidateName: "Kiran Kumar", email: "kiran.kumar@example.com", position: "React Developer", department: "Engineering", salary: "1200000", joiningDate: "2026-12-01", status: "Sent" },
  { id: "OFF-2026-002", candidateName: "Divya Sree", email: "divya.sree@example.com", position: "UI/UX Designer", department: "Product & Design", salary: "950000", joiningDate: "2026-12-10", status: "Accepted" }
];

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Offer Generated", "Offer Sent", "Offer Accepted", "Offer Declined", "Offer Expired", "Hired"];
const ADD_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];
const OFFER_STATUSES = ["Generated", "Sent", "Accepted", "Declined", "Expired"];
const DEPARTMENTS = ["Engineering", "Product & Design", "HR & Operations", "Sales & Marketing"];

const STAGE_FOR_OFFER = {
  Generated: "Offer Generated",
  Sent: "Offer Sent",
  Accepted: "Offer Accepted",
  Declined: "Offer Declined",
  Expired: "Offer Expired"
};

const inputCls = "w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent";

// Local date as YYYY-MM-DD (avoids the UTC off-by-one near midnight in IST)
const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Collision-free sequential ids: JOB-104, CAND-004, OFF-2026-003
const nextId = (prefix, list) => {
  const max = Math.max(0, ...list.map(x => parseInt(String(x.id).split('-').pop(), 10) || 0));
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
};

const normalizeOffer = (o) => ({
  address: "", band: "Band 5", level: "Level 5", workLocation: "Hyderabad", reportingTime: "12:00 pm",
  reportingManager: "", acceptBy: "", signatoryName: "", signatoryTitle: "", candidateId: "",
  generatedOn: todayISO(), sentOn: "",
  ...o,
  status: o.status === "Draft" ? "Generated" : o.status
});

const stageBadge = (stage) => {
  if (stage === "Hired" || stage === "Offer Accepted") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (stage === "Offer Declined" || stage === "Offer Expired") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  if (stage.startsWith("Offer")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-sky-500/15 text-sky-300 border-sky-500/30";
};

const offerBadge = (status) => {
  if (status === "Accepted") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (status === "Declined" || status === "Expired") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  if (status === "Generated") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-sky-500/15 text-sky-300 border-sky-500/30";
};

const blankOfferForm = () => {
  let sig = { name: "", title: "HR Manager" };
  try {
    const saved = JSON.parse(localStorage.getItem('nexora_offer_signatory') || 'null');
    if (saved) sig = saved;
  } catch {}
  return {
    candidateId: "", candidateName: "", email: "", address: "",
    position: "", department: "Engineering", band: "Band 5", level: "Level 5",
    salary: "", joiningDate: "", acceptBy: "", reportingManager: "",
    workLocation: "Hyderabad", reportingTime: "12:00 pm",
    signatoryName: sig.name, signatoryTitle: sig.title
  };
};

export function Recruitment({ currentUser, onTriggerToast }) {
  const [activeTab, setActiveTab] = useState("jobs");

  const [jobs, setJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_jobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(j => ({ ...j, status: "Active" })) : INITIAL_JOBS;
      }
      return INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_candidates');
      return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
    } catch { return INITIAL_CANDIDATES; }
  });

  const [offers, setOffers] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_offer_letters');
      return (saved ? JSON.parse(saved) : INITIAL_OFFERS).map(normalizeOffer);
    } catch { return INITIAL_OFFERS.map(normalizeOffer); }
  });

  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [preview, setPreview] = useState(null); // { offer, url }

  const [jobForm, setJobForm] = useState({ title: "", dept: "Engineering", type: "Full-Time", location: "Hyderabad", openings: 1 });
  const [candidateForm, setCandidateForm] = useState({ name: "", role: "", email: "", stage: "Applied", rating: "4.5/5", expectedCtc: "" });
  const [offerForm, setOfferForm] = useState(blankOfferForm);

  useEffect(() => { localStorage.setItem('nexora_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('nexora_candidates', JSON.stringify(candidates)); }, [candidates]);
  useEffect(() => { localStorage.setItem('nexora_offer_letters', JSON.stringify(offers)); }, [offers]);

  const setOF = (key) => (e) => setOfferForm(f => ({ ...f, [key]: e.target.value }));
  const audit = (payload) => { try { logEvent({ category: "HR", module: "Recruitment", user: currentUser, ...payload }); } catch (e) {} };

  // ---------- Jobs ----------
  const handleCreateJob = (e) => {
    e.preventDefault();
    const newJob = { id: nextId("JOB", jobs), ...jobForm, status: "Active" };
    setJobs([newJob, ...jobs]);
    setIsJobModalOpen(false);
    setJobForm({ title: "", dept: "Engineering", type: "Full-Time", location: "Hyderabad", openings: 1 });
    onTriggerToast?.("New job opening posted successfully.");
  };

  const handleCloseJob = (job) => {
    if (!window.confirm(`Close and permanently remove "${job.title}" (${job.id})?`)) return;
    setJobs(prev => prev.filter(j => j.id !== job.id));
    onTriggerToast?.(`Job opening "${job.title}" (${job.id}) closed & removed.`);
    audit({
      action: "close_job_opening",
      description: `Closed and removed job opening: ${job.title} (${job.id})`,
      target: { type: "JobOpening", id: job.id, name: job.title }
    });
  };

  // ---------- Candidates ----------
  const handleCreateCandidate = (e) => {
    e.preventDefault();
    const newCand = { id: nextId("CAND", candidates), ...candidateForm };
    setCandidates([newCand, ...candidates]);
    setIsCandidateModalOpen(false);
    setCandidateForm({ name: "", role: "", email: "", stage: "Applied", rating: "4.5/5", expectedCtc: "" });
    onTriggerToast?.("Candidate added successfully.");
  };

  const handleStageChange = (cand, stage) => {
    setCandidates(prev => prev.map(c => c.id === cand.id ? { ...c, stage } : c));
    onTriggerToast?.(`${cand.name} moved to "${stage}".`);
  };

  const latestOfferFor = (candId) => offers.find(o => o.candidateId === candId);

  // ---------- Offers ----------
  const openOfferForm = (cand = null) => {
    const base = blankOfferForm();
    if (cand) {
      const job = jobs.find(j => j.title === cand.role);
      setOfferForm({
        ...base,
        candidateId: cand.id,
        candidateName: cand.name,
        email: cand.email || "",
        position: cand.role || "",
        department: job?.dept || base.department,
        workLocation: (job?.location || "Hyderabad").split("/")[0].trim(),
        salary: cand.expectedCtc || ""
      });
    } else {
      setOfferForm(base);
    }
    setIsOfferModalOpen(true);
  };

  const handleCreateOffer = (e) => {
    e.preventDefault();
    const b = calculateSalaryBreakup(offerForm.salary);
    if (!b.annual) { onTriggerToast?.("Enter a valid CTC, e.g. 6.5 LPA or 6,50,000."); return; }
    if (b.warning) { onTriggerToast?.(b.warning); return; }
    if (offerForm.acceptBy > offerForm.joiningDate) { onTriggerToast?.("Accept-by date must be on or before the joining date."); return; }

    if (offerForm.candidateId) {
      const existing = offers.find(o => o.candidateId === offerForm.candidateId && ["Generated", "Sent", "Accepted"].includes(o.status));
      if (existing && !window.confirm(`${existing.candidateName} already has offer ${existing.id} (${existing.status}). Create another?`)) return;
    }

    const newOffer = {
      ...offerForm,
      id: nextId("OFF-2026", offers),
      status: "Generated",
      generatedOn: todayISO(),
      sentOn: ""
    };

    setOffers([newOffer, ...offers]);
    if (newOffer.candidateId) {
      setCandidates(prev => prev.map(c => c.id === newOffer.candidateId ? { ...c, stage: STAGE_FOR_OFFER.Generated } : c));
    }
    try {
      localStorage.setItem('nexora_offer_signatory', JSON.stringify({ name: newOffer.signatoryName, title: newOffer.signatoryTitle }));
    } catch {}
    setIsOfferModalOpen(false);
    setOfferForm(blankOfferForm());
    setActiveTab("offers");

    try {
      downloadOfferLetter(newOffer);
      onTriggerToast?.(`Offer ${newOffer.id} generated for ${newOffer.candidateName}. PDF downloaded.`);
    } catch (err) {
      console.error(err);
      onTriggerToast?.("Offer saved, but the PDF could not be generated. Use the PDF button in the table to retry.");
    }

    audit({
      action: "create_offer_letter",
      description: `Generated offer letter for ${newOffer.candidateName} (${newOffer.position})`,
      target: { type: "OfferLetter", id: newOffer.id, name: newOffer.candidateName }
    });
  };

  const handleUpdateOfferStatus = (offer, newStatus) => {
    setOffers(prev => prev.map(o => o.id === offer.id
      ? { ...o, status: newStatus, sentOn: newStatus === "Sent" ? todayISO() : o.sentOn }
      : o));
    if (offer.candidateId) {
      setCandidates(prev => prev.map(c => c.id === offer.candidateId ? { ...c, stage: STAGE_FOR_OFFER[newStatus] } : c));
    }
    onTriggerToast?.(`Offer ${offer.id} marked ${newStatus}.`);
    audit({
      action: "update_offer_status",
      description: `Offer ${offer.id} for ${offer.candidateName}: ${offer.status} -> ${newStatus}`,
      target: { type: "OfferLetter", id: offer.id, name: offer.candidateName }
    });
  };

  const handleDownloadOffer = (offer) => {
    try { downloadOfferLetter(offer); }
    catch (err) { console.error(err); onTriggerToast?.("Could not generate the PDF."); }
  };

  const openPreview = (offer) => {
    try {
      const url = URL.createObjectURL(buildOfferPDF(offer).output('blob'));
      setPreview({ offer, url });
    } catch (err) {
      console.error(err);
      onTriggerToast?.("Could not generate the preview.");
    }
  };

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const formBreakup = calculateSalaryBreakup(offerForm.salary);
  const today = todayISO();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Recruitment & Hiring 💼</h1>
          <p className="text-xs text-muted mt-0.5">Manage open job positions, applicant pipelines, and official offer letters.</p>
        </div>

        {activeTab === "jobs" && (
          <button type="button" onClick={() => setIsJobModalOpen(true)} className="bg-accent text-on-accent px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg cursor-pointer flex items-center gap-1.5 hover:brightness-105 transition">
            <Icon name="briefcase" className="w-4 h-4" /><span>+ Post Job Opening</span>
          </button>
        )}
        {activeTab === "candidates" && (
          <button type="button" onClick={() => setIsCandidateModalOpen(true)} className="bg-accent text-on-accent px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg cursor-pointer flex items-center gap-1.5 hover:brightness-105 transition">
            <Icon name="users" className="w-4 h-4" /><span>+ Add Candidate</span>
          </button>
        )}
        {activeTab === "offers" && (
          <button type="button" onClick={() => openOfferForm()} className="bg-accent text-on-accent px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg cursor-pointer flex items-center gap-1.5 hover:brightness-105 transition">
            <Icon name="file-text" className="w-4 h-4" /><span>+ Create Offer Letter</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface2/70 p-1 rounded-xl border border-line w-fit">
        <button type="button" onClick={() => setActiveTab("jobs")} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "jobs" ? "bg-accent text-on-accent shadow" : "text-muted hover:text-ink"}`}>Job Openings ({jobs.length})</button>
        <button type="button" onClick={() => setActiveTab("candidates")} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "candidates" ? "bg-accent text-on-accent shadow" : "text-muted hover:text-ink"}`}>Candidates Pipeline ({candidates.length})</button>
        <button type="button" onClick={() => setActiveTab("offers")} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "offers" ? "bg-accent text-on-accent shadow" : "text-muted hover:text-ink"}`}>Offer Letters 📄 ({offers.length})</button>
      </div>

      {/* TAB 1: JOBS */}
      {activeTab === "jobs" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobs.length === 0 ? (
            <div className="col-span-full glass-card p-10 border border-line/80 rounded-2xl text-center text-xs text-muted">
              No open job positions available. Click "+ Post Job Opening" to add one.
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="glass-card p-5 border border-line/80 rounded-2xl flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-accent">{job.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Active</span>
                      <button type="button" onClick={() => handleCloseJob(job)} title="Close & Remove Job Opening" className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white transition cursor-pointer">Close</button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-ink mt-2">{job.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{job.dept} • {job.type}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-line/50 text-xs text-muted">
                  <span>📍 {job.location}</span>
                  <span className="font-semibold text-ink">{job.openings} Openings</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CANDIDATES */}
      {activeTab === "candidates" && (
        <div className="glass-card border border-line/80 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-4">Candidate ID & Name</th>
                <th className="p-4">Applied Role</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Rating</th>
                <th className="p-4 text-right">Offer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {candidates.map(c => {
                const offer = latestOfferFor(c.id);
                return (
                  <tr key={c.id} className="hover:bg-surface2/30">
                    <td className="p-4"><span className="font-semibold text-ink block">{c.name}</span><span className="text-[11px] text-muted">{c.id} • {c.email}</span></td>
                    <td className="p-4 text-ink">{c.role}</td>
                    <td className="p-4">
                      <select
                        value={STAGES.includes(c.stage) ? c.stage : "Applied"}
                        onChange={(e) => handleStageChange(c, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-transparent cursor-pointer focus:outline-none ${stageBadge(c.stage)}`}
                      >
                        {STAGES.map(s => <option key={s} value={s} className="bg-[#0e1626] text-ink">{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4 font-num font-semibold text-accent">{c.rating}</td>
                    <td className="p-4 text-right space-x-2">
                      {offer && (
                        <button type="button" onClick={() => openPreview(offer)} className="px-3 py-1 rounded-lg bg-surface2 border border-line text-accent hover:border-accent font-semibold cursor-pointer">View Offer</button>
                      )}
                      {c.stage === "Offer" && (
                        <button type="button" onClick={() => openOfferForm(c)} className="px-3 py-1 rounded-lg bg-accent text-on-accent font-semibold cursor-pointer hover:brightness-105">Generate Offer Letter</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: OFFER LETTERS */}
      {activeTab === "offers" && (
        <div className="glass-card border border-line/80 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-4">Offer ID & Candidate</th>
                <th className="p-4">Position & Dept</th>
                <th className="p-4">Annual CTC</th>
                <th className="p-4">Joining / Accept By</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {offers.map(offer => {
                const annual = calculateSalaryBreakup(offer.salary).annual;
                const pastDue = ["Generated", "Sent"].includes(offer.status) && offer.acceptBy && offer.acceptBy < today;
                return (
                  <tr key={offer.id} className="hover:bg-surface2/30">
                    <td className="p-4"><span className="font-semibold text-ink block">{offer.candidateName}</span><span className="text-[11px] text-muted">{offer.id} • {offer.email}</span></td>
                    <td className="p-4"><span className="text-ink block">{offer.position}</span><span className="text-[11px] text-muted">{offer.department}</span></td>
                    <td className="p-4 font-num font-semibold text-accent">₹{fmtNum(annual)} p.a.</td>
                    <td className="p-4 text-ink">
                      <span className="block">{fmtDate(offer.joiningDate)}</span>
                      <span className="text-[11px] text-muted">{offer.acceptBy ? `by ${fmtDate(offer.acceptBy)}` : "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${offerBadge(offer.status)}`}>{offer.status}</span>
                      {pastDue && <span className="ml-2 text-[10px] font-semibold text-rose-400">Past due</span>}
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button type="button" onClick={() => openPreview(offer)} className="px-3 py-1 rounded-lg bg-surface2 border border-line text-accent hover:border-accent font-semibold cursor-pointer">Preview</button>
                      <button type="button" onClick={() => handleDownloadOffer(offer)} className="px-3 py-1 rounded-lg bg-surface2 border border-line text-accent hover:border-accent font-semibold cursor-pointer">PDF</button>
                      <select
                        value={offer.status}
                        onChange={(e) => handleUpdateOfferStatus(offer, e.target.value)}
                        className="bg-surface2 border border-line rounded-lg px-2 py-1 text-xs text-ink focus:outline-none cursor-pointer"
                      >
                        {OFFER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: POST JOB */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card bg-[#0e1626] border border-line rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans">
            <div className="bg-surface2/80 border-b border-line p-4 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-ink font-display">Post New Job Opening</h3>
              <button type="button" onClick={() => setIsJobModalOpen(false)} className="text-muted hover:text-ink text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleCreateJob} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted mb-1">Job Title *</label>
                <input type="text" required placeholder="e.g. Senior Frontend Developer" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Department *</label>
                  <select value={jobForm.dept} onChange={(e) => setJobForm({ ...jobForm, dept: e.target.value })} className={inputCls}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Job Type *</label>
                  <select value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })} className={inputCls}>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Location *</label>
                  <input type="text" required placeholder="e.g. Hyderabad / Remote" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Openings *</label>
                  <input type="number" min="1" required value={jobForm.openings} onChange={(e) => setJobForm({ ...jobForm, openings: parseInt(e.target.value) || 1 })} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsJobModalOpen(false)} className="bg-surface2 text-ink px-4 py-2 rounded-xl font-semibold border border-line cursor-pointer">Cancel</button>
                <button type="submit" className="bg-accent text-on-accent px-4 py-2 rounded-xl font-semibold cursor-pointer">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CANDIDATE */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card bg-[#0e1626] border border-line rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans">
            <div className="bg-surface2/80 border-b border-line p-4 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-ink font-display">Add Candidate to Pipeline</h3>
              <button type="button" onClick={() => setIsCandidateModalOpen(false)} className="text-muted hover:text-ink text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleCreateCandidate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted mb-1">Candidate Name *</label>
                <input type="text" required placeholder="e.g. Ananya Reddy" value={candidateForm.name} onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-muted mb-1">Email *</label>
                <input type="email" required placeholder="ananya@example.com" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Applied Role *</label>
                  <input type="text" required placeholder="UI/UX Designer" value={candidateForm.role} onChange={(e) => setCandidateForm({ ...candidateForm, role: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Stage *</label>
                  <select value={candidateForm.stage} onChange={(e) => setCandidateForm({ ...candidateForm, stage: e.target.value })} className={inputCls}>
                    {ADD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-muted mb-1">Expected CTC (optional)</label>
                <input type="text" placeholder="e.g. 8 LPA" value={candidateForm.expectedCtc} onChange={(e) => setCandidateForm({ ...candidateForm, expectedCtc: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsCandidateModalOpen(false)} className="bg-surface2 text-ink px-4 py-2 rounded-xl font-semibold border border-line cursor-pointer">Cancel</button>
                <button type="submit" className="bg-accent text-on-accent px-4 py-2 rounded-xl font-semibold cursor-pointer">Add Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE OFFER LETTER */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card bg-[#0e1626] border border-line rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans flex flex-col max-h-[92vh]">
            <div className="bg-surface2/80 border-b border-line p-4 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-ink font-display">Generate Offer Letter{offerForm.candidateId ? ` — ${offerForm.candidateId}` : ""}</h3>
              <button type="button" onClick={() => setIsOfferModalOpen(false)} className="text-muted hover:text-ink text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleCreateOffer} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <p className="text-[11px] text-muted">Confirm CTC, designation and joining date with the hiring manager and HR before generating. CTC is hard to change after the offer goes out.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Candidate Full Name *</label>
                  <input type="text" required value={offerForm.candidateName} onChange={setOF("candidateName")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Candidate Email *</label>
                  <input type="email" required value={offerForm.email} onChange={setOF("email")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-muted mb-1">Candidate Address (optional)</label>
                <input type="text" value={offerForm.address} onChange={setOF("address")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Role / Designation *</label>
                  <input type="text" required value={offerForm.position} onChange={setOF("position")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Department</label>
                  <select value={offerForm.department} onChange={setOF("department")} className={inputCls}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Annual CTC (INR / LPA) *</label>
                  <input type="text" required placeholder="e.g. 6.5 LPA" value={offerForm.salary} onChange={setOF("salary")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Band</label>
                  <input type="text" value={offerForm.band} onChange={setOF("band")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Level</label>
                  <input type="text" value={offerForm.level} onChange={setOF("level")} className={inputCls} />
                </div>
              </div>

              {formBreakup.annual > 0 && (
                <div className="border border-line rounded-xl overflow-hidden">
                  <div className="bg-surface2/60 px-3 py-1.5 text-[10px] font-semibold text-muted uppercase flex justify-between">
                    <span>Salary breakup preview</span><span>Annual CTC ₹{fmtNum(formBreakup.annual)}</span>
                  </div>
                  <table className="w-full text-[11px]">
                    <tbody className="divide-y divide-line/40">
                      {formBreakup.rows.map((r, i) => (
                        <tr key={i} className={r.total ? "font-bold text-accent" : r.bold ? "font-semibold text-ink" : "text-muted"}>
                          <td className="px-3 py-1">{r.label}</td>
                          <td className="px-3 py-1 text-right">{fmtNum(r.m)}/mo</td>
                          <td className="px-3 py-1 text-right">{fmtNum(r.a)}/yr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {formBreakup.warning && <p className="px-3 py-2 text-[11px] text-rose-400 border-t border-line">{formBreakup.warning}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Joining Date *</label>
                  <input type="date" required min={today} value={offerForm.joiningDate} onChange={setOF("joiningDate")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Accept Offer By * (usually 3-7 days)</label>
                  <input type="date" required min={today} max={offerForm.joiningDate || undefined} value={offerForm.acceptBy} onChange={setOF("acceptBy")} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Reporting Manager</label>
                  <input type="text" value={offerForm.reportingManager} onChange={setOF("reportingManager")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Work Location</label>
                  <input type="text" value={offerForm.workLocation} onChange={setOF("workLocation")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Reporting Time</label>
                  <input type="text" value={offerForm.reportingTime} onChange={setOF("reportingTime")} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Signatory Name *</label>
                  <input type="text" required value={offerForm.signatoryName} onChange={setOF("signatoryName")} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Signatory Title</label>
                  <input type="text" value={offerForm.signatoryTitle} onChange={setOF("signatoryTitle")} className={inputCls} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="bg-surface2 text-ink px-4 py-2 rounded-xl font-semibold border border-line cursor-pointer">Cancel</button>
                <button type="submit" className="bg-accent text-on-accent px-4 py-2 rounded-xl font-semibold cursor-pointer">Generate & Download PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PDF PREVIEW (same PDF that gets downloaded) */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#0e1626] border border-line rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[92vh]">
            <div className="bg-surface2/90 border-b border-line p-4 flex justify-between items-center gap-3">
              <h3 className="font-semibold text-sm text-ink font-display flex items-center gap-2 min-w-0">
                <Icon name="file-text" className="w-4 h-4 text-accent shrink-0" />
                <span className="truncate">{preview.offer.id} — {preview.offer.candidateName} ({preview.offer.position})</span>
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <a href={preview.url} download={offerFileName(preview.offer)} className="bg-accent text-on-accent px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow">Download PDF</a>
                <button type="button" onClick={closePreview} className="text-muted hover:text-ink text-xl font-bold px-2 cursor-pointer">×</button>
              </div>
            </div>
            <iframe title="Offer letter preview" src={preview.url} className="flex-1 w-full bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Recruitment;
