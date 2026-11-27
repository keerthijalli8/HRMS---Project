import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { createWfhRequest } from '../../services/wfoWfhStore.js';

export const WfhRequestModal = ({ isOpen, onClose, currentUser, onTriggerToast }) => {
  if (!isOpen) return null;

  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const initialForm = {
    fromDate: todayIso,
    toDate: todayIso,
    workMode: "Full Day WFH",
    reason: "",
    documentName: ""
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const empId = currentUser?.employeeId || currentUser?.id || "EMP-1088";
  const empName = currentUser?.name || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || "Employee";
  const dept = currentUser?.dept || currentUser?.department || "General";

  const validate = () => {
    const errs = {};
    if (!formData.fromDate) errs.fromDate = "From date is required";
    if (!formData.toDate) errs.toDate = "To date is required";
    if (formData.fromDate && formData.toDate && formData.fromDate > formData.toDate) {
      errs.toDate = "To date cannot be earlier than from date";
    }
    if (!formData.reason || formData.reason.trim().length < 5) {
      errs.reason = "Please state a clear reason (minimum 5 characters)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const res = createWfhRequest({
      employee: currentUser,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      workMode: formData.workMode,
      reason: formData.reason.trim(),
      documentName: formData.documentName.trim() || null
    });
    setIsSubmitting(false);

    if (res.ok) {
      if (res.autoApproved) {
        onTriggerToast?.(`WFH request ${res.request.id} auto-approved under department policy!`);
      } else {
        onTriggerToast?.(`WFH request ${res.request.id} submitted for Manager approval.`);
      }
      onClose();
    } else {
      onTriggerToast?.(res.error || "Failed to submit WFH request");
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all entered form fields?")) {
      setFormData(initialForm);
      setErrors({});
    }
  };

  // Mock file selection simulation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, documentName: file.name }));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="home" className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-base">Request Work From Home (WFH)</div>
              <div className="text-xs text-muted">Submit official WFH pass for Team Lead / HR authorization</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
          >
            <Icon name="x" className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Employee Info Header Pill */}
          <div className="p-3 rounded-xl bg-surface2/60 border border-line/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-ink text-[13px]">{empName}</div>
              <div className="text-[11px] text-muted">{empId} · {dept}</div>
            </div>
            <div className="text-right">
              <span className="text-[10.5px] uppercase tracking-wider text-muted font-semibold block">Request Date</span>
              <span className="font-data font-semibold text-accent text-[12px]">{todayIso}</span>
            </div>
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink block mb-1">From Date <span className="text-bad">*</span></label>
              <input
                type="date"
                value={formData.fromDate}
                min={todayIso}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
              />
              {errors.fromDate && <p className="text-bad text-[11px] mt-0.5">{errors.fromDate}</p>}
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">To Date <span className="text-bad">*</span></label>
              <input
                type="date"
                value={formData.toDate}
                min={formData.fromDate || todayIso}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
              />
              {errors.toDate && <p className="text-bad text-[11px] mt-0.5">{errors.toDate}</p>}
            </div>
          </div>

          {/* Work Mode Option */}
          <div>
            <label className="font-semibold text-ink block mb-1">Work Mode <span className="text-bad">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {["Full Day WFH", "Half Day WFH", "Extended Remote"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData({ ...formData, workMode: mode })}
                  className={`py-2 px-2.5 rounded-lg border text-center transition font-semibold text-[11.5px] ${
                    formData.workMode === mode
                      ? "bg-accent text-on-accent border-accent shadow-sm"
                      : "bg-surface2 border-line text-muted hover:text-ink"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="font-semibold text-ink block mb-1">Reason for Remote Work <span className="text-bad">*</span></label>
            <textarea
              rows={3}
              placeholder="e.g. Broadband maintenance, doctor visit, personal commitment, focused project deliverables..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full bg-surface2 border border-line rounded-lg p-2.5 text-ink focus:border-accent outline-none resize-none"
            />
            {errors.reason && <p className="text-bad text-[11px] mt-0.5">{errors.reason}</p>}
          </div>

          {/* Supporting Document (Optional) */}
          <div>
            <label className="font-semibold text-ink block mb-1">Supporting Document <span className="text-muted font-normal">(Optional)</span></label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-2 rounded-lg bg-surface2 border border-line hover:border-accent transition text-ink flex items-center gap-1.5 font-semibold shrink-0">
                <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
                <span>Upload File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </label>
              <input
                type="text"
                placeholder="Or enter filename (e.g. Medical_Slip.pdf)"
                value={formData.documentName}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                className="flex-1 bg-surface2 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none text-xs"
              />
            </div>
            {formData.documentName && (
              <p className="text-accent text-[11px] mt-1 flex items-center gap-1">
                <Icon name="check" className="w-3 h-3 text-accent" />
                <span>Attached: {formData.documentName}</span>
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-muted hover:text-bad transition font-semibold text-[11.5px]"
            >
              Reset Form
            </button>
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton icon="check" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit WFH Request"}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
