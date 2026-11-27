import React, { useState } from 'react';
import { Icon } from './Icon.jsx';
import { formatFileSize, formatTimestamp, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../services/onboardingFlow.js';

export const DocumentUploadPanel = ({
  candidate,
  mode = "initial", // "initial" (docs_pending), "rejected" (docs_rejected), "reverify" (reverify_failed)
  onSubmit,
  onReupload,
  onTriggerToast
}) => {
  const [isFresher, setIsFresher] = useState(() => candidate?.onboarding?.fresher || false);
  const [localFiles, setLocalFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingDocs = candidate?.onboarding?.documents || [];

  // Documents to render based on mode
  const docList = [
    { key: "govt_id", label: "Aadhaar or PAN Card", hint: "Government issued identity proof (.pdf, .jpg, .png up to 2MB)" },
    { key: "education", label: "Education Certificate / Degree", hint: "Highest degree certificate or provisional marksheet" },
    { key: "bank_proof", label: "Bank Proof / Cancelled Cheque", hint: "Cancelled cheque or first page of bank passbook with account & IFSC" },
    { key: "photo", label: "Passport-size Photo", hint: "Recent formal passport photograph with clean background" },
    ...(!isFresher ? [{ key: "experience", label: "Previous Employment Relieving or Experience Letter", hint: "Service certificate or official relieving letter from previous employer" }] : [])
  ];

  // For reverify mode, only show mismatched documents
  const filteredDocList = mode === "reverify"
    ? docList.filter(spec => {
        const doc = existingDocs.find(d => d.key === spec.key);
        return doc && doc.round2?.result === "mismatch";
      })
    : mode === "rejected"
    ? docList // show all, but highlight rejected ones
    : docList;

  const handleFileChange = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (2 MB)
    if (file.size > MAX_FILE_SIZE) {
      setFileErrors(prev => ({
        ...prev,
        [key]: `File exceeds maximum allowed size of 2 MB (${formatFileSize(file.size)})`
      }));
      onTriggerToast && onTriggerToast(`File too large (${formatFileSize(file.size)}). Max allowed is 2 MB.`);
      return;
    }

    // Validate extension
    const ext = "." + (file.name.split('.').pop() || "").toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      setFileErrors(prev => ({
        ...prev,
        [key]: `Unsupported file format. Please upload PDF, JPG, or PNG.`
      }));
      onTriggerToast && onTriggerToast("Unsupported format. Allowed: PDF, JPG, PNG");
      return;
    }

    // Clear error
    setFileErrors(prev => ({ ...prev, [key]: null }));

    const fileMeta = {
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      uploadedAt: new Date().toISOString()
    };

    // If re-uploading directly
    if (mode === "rejected" || mode === "reverify") {
      if (onReupload) {
        onReupload(key, fileMeta);
      }
    } else {
      setLocalFiles(prev => ({
        ...prev,
        [key]: fileMeta
      }));
    }
  };

  // Determine if ready to submit
  const isAllUploaded = docList.every(spec => {
    const local = localFiles[spec.key];
    const existing = existingDocs.find(d => d.key === spec.key);
    return local?.name || existing?.fileName;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllUploaded && mode === "initial") {
      onTriggerToast && onTriggerToast("Please upload all required documents before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(localFiles, isFresher);
    } catch (err) {
      onTriggerToast && onTriggerToast(err.message || "Failed to submit documents");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-xs">
      {/* Header & Fresher Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            {mode === "reverify"
              ? "Re-upload Mismatched Documents"
              : mode === "rejected"
              ? "Re-upload Rejected Documents"
              : "Upload Mandatory Onboarding Documents"}
          </h2>
          <p className="text-[11px] text-muted mt-0.5">
            Accepted formats: PDF, JPG, PNG (Max file size: 2 MB per document)
          </p>
        </div>

        {mode === "initial" && (
          <label className="flex items-center gap-2 cursor-pointer select-none bg-surface2/60 border border-line px-3 py-1.5 rounded-lg text-ink font-medium hover:border-accent transition shrink-0">
            <input
              type="checkbox"
              checked={isFresher}
              onChange={(e) => setIsFresher(e.target.checked)}
              className="w-4 h-4 rounded bg-surface2 border-line text-accent accent-accent focus:ring-accent"
            />
            <span>I am a fresher (no previous employment)</span>
          </label>
        )}
      </div>

      {/* Document Upload Rows */}
      <div className="flex flex-col gap-3">
        {filteredDocList.map((spec) => {
          const existing = existingDocs.find(d => d.key === spec.key);
          const local = localFiles[spec.key];
          const hasFile = local?.name || existing?.fileName;
          const fileName = local?.name || existing?.fileName;
          const fileSize = local?.size || existing?.size;
          const uploadedAt = local?.uploadedAt || existing?.uploadedAt;

          const isRejected = existing?.status === "rejected";
          const isMismatch = existing?.round2?.result === "mismatch";
          const rejectReason = existing?.rejectReason;
          const mismatchReason = existing?.round2?.reason;
          const isVerified = existing?.status === "verified";
          const err = fileErrors[spec.key];

          return (
            <div
              key={spec.key}
              className={`p-3.5 rounded-xl border transition flex flex-col gap-2.5 ${
                isRejected || isMismatch
                  ? 'bg-bad/5 border-bad/40'
                  : hasFile
                  ? 'bg-surface2/50 border-line'
                  : 'bg-surface2/30 border-dashed border-line hover:border-accent/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink text-xs">{spec.label}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-surface2 text-muted border border-line">
                      Required
                    </span>

                    {/* Status Pill */}
                    {isVerified && !isMismatch && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-good/15 text-good border border-good/30 flex items-center gap-1">
                        <Icon name="check" className="w-3 h-3 text-good" />
                        Verified
                      </span>
                    )}

                    {isRejected && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bad/15 text-bad border border-bad/30 flex items-center gap-1">
                        <Icon name="alert-triangle" className="w-3 h-3 text-bad" />
                        Rejected by HR
                      </span>
                    )}

                    {isMismatch && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bad/15 text-bad border border-bad/30 flex items-center gap-1">
                        <Icon name="alert-triangle" className="w-3 h-3 text-bad" />
                        Round 2 Mismatch
                      </span>
                    )}

                    {hasFile && !isVerified && !isRejected && !isMismatch && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                        Uploaded
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 truncate">{spec.hint}</div>
                </div>

                {/* Upload Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-line text-[11px] font-semibold text-ink hover:border-accent hover:text-accent transition">
                    <Icon name="file-text" className="w-3.5 h-3.5 text-muted" />
                    <span>{hasFile ? "Replace File" : "Choose File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(spec.key, e)}
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded File Info */}
              {hasFile && (
                <div className="flex flex-row items-center justify-between gap-2 p-2 rounded-lg bg-surface2/80 border border-line text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <Icon name="file-text" className="w-4 h-4 text-accent shrink-0" />
                    <span className="font-data font-semibold text-ink truncate">{fileName}</span>
                    <span className="text-muted">({formatFileSize(fileSize)})</span>
                  </div>
                  <div className="text-muted text-[10.5px] font-data shrink-0">
                    Uploaded: {formatTimestamp(uploadedAt)}
                  </div>
                </div>
              )}

              {/* Rejection / Mismatch Remarks */}
              {isRejected && rejectReason && (
                <div className="p-2.5 rounded-lg bg-bad/10 border border-bad/30 text-bad text-[11px] flex items-start gap-2">
                  <Icon name="alert-triangle" className="w-4 h-4 text-bad shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">HR Remarks: </span>
                    <span>{rejectReason}</span>
                    <span className="block text-[10.5px] text-bad/80 mt-0.5">Please replace this document with a corrected copy.</span>
                  </div>
                </div>
              )}

              {isMismatch && mismatchReason && (
                <div className="p-2.5 rounded-lg bg-bad/10 border border-bad/30 text-bad text-[11px] flex items-start gap-2">
                  <Icon name="alert-triangle" className="w-4 h-4 text-bad shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">HR Manager Re-verification Remark: </span>
                    <span>{mismatchReason}</span>
                    <span className="block text-[10.5px] text-bad/80 mt-0.5">Please upload a valid matching document.</span>
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {err && (
                <div className="text-bad text-[11px] flex items-center gap-1">
                  <Icon name="alert-triangle" className="w-3.5 h-3.5 text-bad shrink-0" />
                  <span>{err}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button for initial upload */}
      {mode === "initial" && (
        <div className="pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-muted">
            {isAllUploaded
              ? "All required documents selected. Click submit to begin verification."
              : "Upload all required documents to enable submission."}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isAllUploaded || isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[var(--radius)] bg-accent text-on-accent font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="check" className="w-4 h-4 text-on-accent" />
            <span>{isSubmitting ? "Submitting..." : "Submit for Verification"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
