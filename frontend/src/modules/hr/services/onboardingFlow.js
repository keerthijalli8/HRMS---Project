/**
 * Document Verification & Candidate Onboarding Flow Service
 * Key: "hrms_registered_users"
 * Event: "hrms-users-updated"
 * Manages 2-round verification, offer letter generation, joining verification, and dashboard activation.
 */

import { CANONICAL_CANDIDATES_8 } from '../data/mockDb.js';

const STORAGE_KEY = "hrms_registered_users";

export const getSeedCandidates = () => {
  return CANONICAL_CANDIDATES_8.map(c => ({
    name: c.name,
    email: c.email,
    employeeId: c.id,
    companyId: "NEX-IND",
    role: c.role,
    dept: c.dept,
    accessStatus: c.accessStatus,
    joiningDate: c.joiningDate,
    onboarding: {
      fresher: false,
      documents: c.documents.map(d => ({
        key: d.key,
        label: d.label,
        required: true,
        fileName: d.fileName,
        size: d.size,
        type: "application/pdf",
        uploadedAt: d.uploadedAt,
        status: d.status,
        rejectReason: d.rejectReason || "",
        snapshot: { fileName: d.fileName, size: d.size, uploadedAt: d.uploadedAt },
        round2: { result: d.status === "rejected" ? "mismatch" : "match", reason: d.rejectReason || "" },
        reuploaded: false
      })),
      offer: {
        designation: c.role,
        department: c.dept,
        joiningDate: c.joiningDate,
        location: "Hyderabad",
        probationMonths: 6,
        issuedAt: "2026-11-06T10:00:00.000Z"
      },
      history: [
        { at: "2026-11-04T10:00:00.000Z", by: "Meera Reddy", role: "HR Manager", action: "Documents Received", detail: "Initial documents uploaded" }
      ]
    }
  }));
};

// Document specification definitions
export const DOCUMENT_SPECS = [
  { key: "govt_id", label: "Aadhaar or PAN Card", required: true },
  { key: "education", label: "Education Certificate / Degree", required: true },
  { key: "bank_proof", label: "Bank Proof / Cancelled Cheque", required: true },
  { key: "photo", label: "Passport-size Photo", required: true },
  { key: "experience", label: "Previous Employment Relieving or Experience Letter", required: true }
];

// Maximum file size: 2 MB
export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [".pdf", ".jpg", ".jpeg", ".png"];

// Generates initial blank documents structure for a candidate
export const createInitialDocuments = (isFresher = false) => {
  return DOCUMENT_SPECS.map(spec => ({
    key: spec.key,
    label: spec.label,
    required: spec.key === "experience" ? !isFresher : spec.required,
    fileName: null,
    size: null,
    type: null,
    uploadedAt: null,
    status: "pending", // "pending" | "verified" | "rejected"
    rejectReason: "",
    snapshot: null, // { fileName, size, uploadedAt }
    round2: { result: "unchecked", reason: "" }, // "unchecked" | "match" | "mismatch"
    reuploaded: false
  }));
};

// Safe localStorage loader for registered users with canonical 8 candidates seed
export const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getSeedCandidates();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 8) return parsed;
    // Re-seed if incomplete
    const seed = getSeedCandidates();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch (err) {
    console.error("onboardingFlow: Failed to load registered users:", err);
    return getSeedCandidates();
  }
};

// Safe localStorage saver and event dispatcher
const saveRegisteredUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent("hrms-users-updated"));
  } catch (err) {
    console.error("onboardingFlow: Failed to save registered users:", err);
    throw new Error("Failed to save changes to local storage");
  }
};

// Syncs candidate update to current active session if currently logged in
const syncCurrentSessionIfMatch = (candidate) => {
  try {
    const saved = localStorage.getItem("hrms_user");
    if (saved) {
      const current = JSON.parse(saved);
      const isMatch =
        (candidate.employeeId && current.employeeId && candidate.employeeId.toUpperCase() === current.employeeId.toUpperCase()) ||
        (candidate.email && current.email && candidate.email.toLowerCase() === current.email.toLowerCase());
      if (isMatch) {
        const updated = {
          ...current,
          accessStatus: candidate.accessStatus,
          onboarding: candidate.onboarding,
          role: candidate.role || current.role,
          dept: candidate.dept || current.dept,
          joiningDate: candidate.joiningDate || current.joiningDate
        };
        localStorage.setItem("hrms_user", JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.warn("onboardingFlow: Could not sync current session:", e);
  }
};

// Helper to find a candidate by employeeId or email
const findCandidate = (users, candidateId) => {
  const cleanId = String(candidateId || "").trim().toLowerCase();
  return users.find(u =>
    (u.employeeId && u.employeeId.toLowerCase() === cleanId) ||
    (u.email && u.email.toLowerCase() === cleanId)
  );
};

// Format bytes into readable string (e.g. 240 KB)
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format date into IST display
export const formatTimestamp = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
};

// Integrity check: compares current doc metadata with Round 1 snapshot
export const checkDocumentIntegrity = (doc) => {
  if (!doc) return { isClean: true, status: "clean", label: "Unchanged since approval" };
  if (!doc.snapshot) {
    // If no snapshot yet, consider clean
    return { isClean: true, status: "clean", label: "Unchanged since approval" };
  }
  const snap = doc.snapshot;
  const isMatch =
    doc.fileName === snap.fileName &&
    doc.size === snap.size &&
    doc.uploadedAt === snap.uploadedAt;

  if (isMatch) {
    return { isClean: true, status: "clean", label: "Unchanged since approval" };
  }
  return { isClean: false, status: "changed", label: "Changed after approval" };
};

// Returns verification queue for HR/HR Manager with role and company scoping
export const getQueue = (user) => {
  const users = getRegisteredUsers();

  // Filter candidates whose onboarding is not yet active
  const candidates = users.filter(u => {
    const status = (u.accessStatus || "docs_pending").toLowerCase();
    return status !== "active";
  });

  const counts = {
    all: candidates.length,
    round1: candidates.filter(c => c.accessStatus === "docs_review" || c.accessStatus === "docs_rejected").length,
    offer: candidates.filter(c => c.accessStatus === "docs_approved" || c.accessStatus === "offer_issued").length,
    joining: candidates.filter(c => c.accessStatus === "offer_accepted").length,
    round2: candidates.filter(c => c.accessStatus === "reverify_pending" || c.accessStatus === "reverify_failed").length,
    rejected: candidates.filter(c => c.accessStatus === "docs_rejected" || c.accessStatus === "reverify_failed").length
  };

  return { candidates, counts };
};

// Helper to create an audit history entry
const createHistoryEntry = (byUser, action, detail) => ({
  at: new Date().toISOString(),
  by: byUser?.name || "System",
  role: byUser?.systemRole || byUser?.role || "Candidate",
  action,
  detail: detail || ""
});

// Candidate submits documents for Round 1 verification
export const submitDocuments = (candidateUser, uploadedFilesMap, isFresher = false) => {
  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateUser?.employeeId || candidateUser?.email);
  if (!candidate) throw new Error("Candidate account not found");

  const currentStatus = candidate.accessStatus || "docs_pending";
  if (currentStatus !== "docs_pending" && currentStatus !== "docs_rejected") {
    throw new Error(`Cannot submit documents at stage: ${currentStatus}`);
  }

  // Ensure onboarding structure exists
  if (!candidate.onboarding) {
    candidate.onboarding = {
      fresher: !!isFresher,
      documents: createInitialDocuments(isFresher),
      offer: null,
      joinedAt: null,
      history: []
    };
  }

  candidate.onboarding.fresher = !!isFresher;
  const now = new Date().toISOString();

  // Update documents
  const docs = candidate.onboarding.documents || createInitialDocuments(isFresher);
  for (const doc of docs) {
    if (doc.key === "experience") {
      doc.required = !isFresher;
    }
    const uploaded = uploadedFilesMap[doc.key];
    if (uploaded) {
      doc.fileName = uploaded.name;
      doc.size = uploaded.size;
      doc.type = uploaded.type || "application/octet-stream";
      doc.uploadedAt = uploaded.uploadedAt || now;
      doc.status = "pending";
      doc.rejectReason = "";
      doc.reuploaded = false;
    }
  }

  // Validate that all required documents are uploaded
  for (const doc of docs) {
    if (doc.required && !doc.fileName) {
      throw new Error(`Please upload required document: ${doc.label}`);
    }
  }

  candidate.onboarding.documents = docs;
  candidate.accessStatus = "docs_review";
  candidate.onboarding.history.push(
    createHistoryEntry(
      candidateUser,
      "Documents Submitted",
      isFresher ? "Submitted 4 required documents (Fresher track)" : "Submitted 5 required documents"
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR reviews a single document during Round 1 (verify or reject)
export const round1Review = (reviewerUser, candidateId, documentKey, result, reason = "") => {
  if (reviewerUser?.systemRole !== "HR" && reviewerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: Only HR or HR Manager can review documents");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "docs_review") {
    throw new Error(`Cannot perform Round 1 review at stage: ${candidate.accessStatus}`);
  }

  const doc = (candidate.onboarding?.documents || []).find(d => d.key === documentKey);
  if (!doc) throw new Error(`Document ${documentKey} not found`);

  if (result === "rejected" && !reason.trim()) {
    throw new Error("A rejection reason is required");
  }

  doc.status = result; // "verified" | "rejected"
  doc.rejectReason = result === "rejected" ? reason.trim() : "";

  candidate.onboarding.history.push(
    createHistoryEntry(
      reviewerUser,
      `Round 1: Document ${result === "verified" ? "Verified" : "Rejected"}`,
      `${doc.label}${result === "rejected" ? ` - Reason: ${reason.trim()}` : ""}`
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR approves all verified documents (Round 1 passed, saves snapshots)
export const round1Approve = (reviewerUser, candidateId) => {
  if (reviewerUser?.systemRole !== "HR" && reviewerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: Only HR or HR Manager can approve documents");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "docs_review") {
    throw new Error(`Cannot approve Round 1 at stage: ${candidate.accessStatus}`);
  }

  const docs = candidate.onboarding?.documents || [];
  const requiredDocs = docs.filter(d => d.required);

  const unverified = requiredDocs.filter(d => d.status !== "verified");
  if (unverified.length > 0) {
    throw new Error(`Cannot approve: ${unverified.length} required document(s) are not verified yet`);
  }

  // Create snapshot for each document
  for (const doc of docs) {
    if (doc.fileName) {
      doc.snapshot = {
        fileName: doc.fileName,
        size: doc.size,
        uploadedAt: doc.uploadedAt
      };
      doc.round2 = { result: "unchecked", reason: "" };
      doc.reuploaded = false;
    }
  }

  candidate.accessStatus = "docs_approved";
  candidate.onboarding.history.push(
    createHistoryEntry(
      reviewerUser,
      "Round 1 Approved",
      "All required documents verified. Ready for offer letter generation."
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR sends documents back to candidate if any were rejected
export const round1Reject = (reviewerUser, candidateId, generalReason = "") => {
  if (reviewerUser?.systemRole !== "HR" && reviewerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: Only HR or HR Manager can reject documents");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "docs_review") {
    throw new Error(`Cannot reject at stage: ${candidate.accessStatus}`);
  }

  const docs = candidate.onboarding?.documents || [];
  const hasRejectedDoc = docs.some(d => d.status === "rejected");
  if (!hasRejectedDoc) {
    throw new Error("Please mark at least one document as rejected before sending back");
  }

  candidate.accessStatus = "docs_rejected";
  candidate.onboarding.history.push(
    createHistoryEntry(
      reviewerUser,
      "Sent Back to Candidate",
      generalReason ? `Re-upload requested: ${generalReason}` : "Re-upload requested for rejected documents"
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR generates and issues the official offer letter
export const generateOffer = (issuerUser, candidateId, offerForm) => {
  if (issuerUser?.systemRole !== "HR" && issuerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: Only HR can generate offer letters");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "docs_approved") {
    throw new Error(`Offer letter can only be generated at docs_approved stage (Current: ${candidate.accessStatus})`);
  }

  // Count existing offers to generate sequential number
  let existingOffersCount = 0;
  users.forEach(u => {
    if (u.onboarding?.offer?.number) existingOffersCount++;
  });

  const companyCode = candidate.companyId || "NEX-IND";
  const year = new Date().getFullYear();
  const seq = String(existingOffersCount + 1).padStart(4, "0");
  const offerNumber = `OFR-${companyCode}-${year}-${seq}`;

  const now = new Date().toISOString();
  candidate.onboarding.offer = {
    number: offerNumber,
    designation: offerForm.designation || candidate.role || "Software Engineer",
    department: offerForm.department || candidate.dept || "Engineering",
    joiningDate: offerForm.joiningDate, // YYYY-MM-DD
    location: offerForm.location || "Hyderabad, Telangana",
    probationMonths: Number(offerForm.probationMonths || 6),
    issuedBy: issuerUser.name || "HR Department",
    issuedAt: now,
    acceptedAt: null
  };

  candidate.accessStatus = "offer_issued";
  candidate.onboarding.history.push(
    createHistoryEntry(
      issuerUser,
      "Offer Letter Issued",
      `Offer ${offerNumber} issued for ${candidate.onboarding.offer.designation} (${candidate.onboarding.offer.department}). Joining: ${offerForm.joiningDate}`
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// Candidate accepts the issued offer letter
export const acceptOffer = (candidateUser, candidateId) => {
  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "offer_issued") {
    throw new Error(`Cannot accept offer at stage: ${candidate.accessStatus}`);
  }

  if (!candidate.onboarding?.offer) {
    throw new Error("No active offer letter found");
  }

  const now = new Date().toISOString();
  candidate.onboarding.offer.acceptedAt = now;
  candidate.accessStatus = "offer_accepted";
  candidate.onboarding.history.push(
    createHistoryEntry(
      candidateUser,
      "Offer Accepted",
      `Candidate formally accepted offer ${candidate.onboarding.offer.number}`
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR marks the candidate as joined (only on or after joiningDate)
export const markJoined = (hrUser, candidateId) => {
  if (hrUser?.systemRole !== "HR" && hrUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: Only HR or HR Manager can mark candidates as joined");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "offer_accepted") {
    throw new Error(`Cannot mark joined at stage: ${candidate.accessStatus}`);
  }

  const offer = candidate.onboarding?.offer;
  if (!offer || !offer.joiningDate) {
    throw new Error("Offer joining date is missing");
  }

  // Check today's date vs joiningDate (in Asia/Kolkata timezone)
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (todayStr < offer.joiningDate) {
    throw new Error(`Cannot mark as joined before the scheduled joining date (${offer.joiningDate}). Today is ${todayStr}.`);
  }

  const now = new Date().toISOString();
  candidate.onboarding.joinedAt = now;
  candidate.accessStatus = "reverify_pending";

  // Initialize round2 state for each document
  const docs = candidate.onboarding.documents || [];
  docs.forEach(doc => {
    doc.round2 = { result: "unchecked", reason: "" };
  });

  candidate.onboarding.history.push(
    createHistoryEntry(
      hrUser,
      "Candidate Joined",
      `Marked as joined on ${todayStr}. Moved to Round 2 re-verification.`
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR Manager checks a document during Round 2 (match or mismatch)
export const round2Check = (reviewerUser, candidateId, documentKey, result, reason = "") => {
  if (reviewerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: ONLY the HR Manager can perform Round 2 re-verification");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "reverify_pending") {
    throw new Error(`Cannot perform Round 2 check at stage: ${candidate.accessStatus}`);
  }

  const doc = (candidate.onboarding?.documents || []).find(d => d.key === documentKey);
  if (!doc) throw new Error(`Document ${documentKey} not found`);

  if (result === "mismatch" && !reason.trim()) {
    throw new Error("A reason is required when marking a mismatch");
  }

  doc.round2 = {
    result, // "match" | "mismatch"
    reason: result === "mismatch" ? reason.trim() : ""
  };

  candidate.onboarding.history.push(
    createHistoryEntry(
      reviewerUser,
      `Round 2: Document ${result === "match" ? "Matched" : "Mismatch"}`,
      `${doc.label}${result === "mismatch" ? ` - Reason: ${reason.trim()}` : ""}`
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR Manager grants active dashboard access
export const round2Grant = (reviewerUser, candidateId, confirmations) => {
  if (reviewerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: ONLY the HR Manager can grant dashboard access");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "reverify_pending") {
    throw new Error(`Cannot grant access at stage: ${candidate.accessStatus}`);
  }

  const docs = (candidate.onboarding?.documents || []).filter(d => d.required);

  // 1. Every required document must have round2.result === "match"
  const unmatched = docs.filter(d => d.round2?.result !== "match");
  if (unmatched.length > 0) {
    throw new Error(`Cannot grant access: ${unmatched.length} document(s) have not been confirmed as 'match'`);
  }

  // 2. Integrity check: all documents must be clean OR reuploaded and manually matched
  for (const doc of docs) {
    const integrity = checkDocumentIntegrity(doc);
    if (!integrity.isClean && !doc.reuploaded) {
      throw new Error(`Integrity warning on ${doc.label}: document was modified after Round 1 without re-upload track`);
    }
  }

  // 3. Confirmations check
  if (!confirmations?.identityMatch) {
    throw new Error("You must confirm that Name and ID details match the registered details");
  }
  if (!confirmations?.originalMatch) {
    throw new Error("You must confirm that documents match those verified before the offer");
  }

  // Round 2 passed! Grant active status
  candidate.accessStatus = "active";

  // Copy joiningDate, designation (to role), and department (to dept) from offer to candidate
  const offer = candidate.onboarding?.offer;
  if (offer) {
    if (offer.joiningDate) candidate.joiningDate = offer.joiningDate;
    if (offer.designation) candidate.role = offer.designation;
    if (offer.department) candidate.dept = offer.department;
  }

  candidate.onboarding.history.push(
    createHistoryEntry(
      reviewerUser,
      "Dashboard Access Granted",
      "Round 2 re-verification passed. Candidate onboarding completed. Full dashboard unlocked."
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// HR Manager fails Round 2 and sends back for re-upload
export const round2Fail = (reviewerUser, candidateId, generalReason = "") => {
  if (reviewerUser?.systemRole !== "HR Manager") {
    throw new Error("Unauthorized: ONLY the HR Manager can fail Round 2");
  }

  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  if (candidate.accessStatus !== "reverify_pending") {
    throw new Error(`Cannot fail Round 2 at stage: ${candidate.accessStatus}`);
  }

  const docs = candidate.onboarding?.documents || [];
  const hasMismatch = docs.some(d => d.round2?.result === "mismatch");
  if (!hasMismatch) {
    throw new Error("Please mark at least one document as 'Mismatch' before sending back");
  }

  candidate.accessStatus = "reverify_failed";
  candidate.onboarding.history.push(
    createHistoryEntry(
      reviewerUser,
      "Round 2 Failed (Re-upload Required)",
      generalReason ? `Mismatches found: ${generalReason}` : "Document mismatches found. Re-upload requested."
    )
  );

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};

// Candidate re-uploads a rejected or mismatched document
export const reuploadDocument = (candidateUser, candidateId, documentKey, fileMeta) => {
  const users = getRegisteredUsers();
  const candidate = findCandidate(users, candidateId);
  if (!candidate) throw new Error("Candidate not found");

  const currentStatus = candidate.accessStatus;
  if (currentStatus !== "docs_rejected" && currentStatus !== "reverify_failed") {
    throw new Error(`Re-upload is not permitted at stage: ${currentStatus}`);
  }

  const doc = (candidate.onboarding?.documents || []).find(d => d.key === documentKey);
  if (!doc) throw new Error(`Document ${documentKey} not found`);

  // Verify document was indeed rejected or mismatched
  const isRejected = doc.status === "rejected";
  const isMismatch = doc.round2?.result === "mismatch";
  if (!isRejected && !isMismatch) {
    throw new Error("Only rejected or mismatched documents can be re-uploaded");
  }

  const now = new Date().toISOString();
  doc.fileName = fileMeta.name;
  doc.size = fileMeta.size;
  doc.type = fileMeta.type || "application/octet-stream";
  doc.uploadedAt = now;
  doc.status = "pending";
  doc.rejectReason = "";
  doc.round2 = { result: "unchecked", reason: "" };
  doc.reuploaded = true;
  doc.snapshot = {
    fileName: fileMeta.name,
    size: fileMeta.size,
    uploadedAt: now
  };

  candidate.onboarding.history.push(
    createHistoryEntry(
      candidateUser,
      "Document Re-uploaded",
      `Re-uploaded ${doc.label}: ${fileMeta.name} (${formatFileSize(fileMeta.size)})`
    )
  );

  // Check if all rejected / mismatched documents have been replaced
  const docs = candidate.onboarding.documents;
  if (currentStatus === "docs_rejected") {
    const remainingRejected = docs.filter(d => d.required && d.status === "rejected");
    if (remainingRejected.length === 0) {
      candidate.accessStatus = "docs_review";
      candidate.onboarding.history.push(
        createHistoryEntry(candidateUser, "Resubmitted for Round 1", "All rejected documents replaced and resubmitted")
      );
    }
  } else if (currentStatus === "reverify_failed") {
    const remainingMismatch = docs.filter(d => d.required && d.round2?.result === "mismatch");
    if (remainingMismatch.length === 0) {
      candidate.accessStatus = "reverify_pending";
      candidate.onboarding.history.push(
        createHistoryEntry(candidateUser, "Resubmitted for Round 2", "All mismatched documents replaced and resubmitted")
      );
    }
  }

  saveRegisteredUsers(users);
  syncCurrentSessionIfMatch(candidate);
  return candidate;
};
