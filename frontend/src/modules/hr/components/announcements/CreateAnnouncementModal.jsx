import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import {
  ANNOUNCEMENT_CATEGORIES,
  PRIORITIES,
  AUDIENCE_OPTIONS,
  createAnnouncement,
  updateAnnouncement
} from '../../services/announcementService.js';
import { loadDepartmentsList, loadAllEmployees } from '../../services/teamService.js';

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
  onSaved,
  editAnnouncement = null,
  currentUser = null
}) => {
  const isEdit = Boolean(editAnnouncement);

  // Departments loaded dynamically from teamService
  const availableDepartments = useMemo(() => {
    return loadDepartmentsList();
  }, [isOpen]);

  // All employees for target employee selection
  const allEmployees = useMemo(() => {
    return loadAllEmployees();
  }, [isOpen]);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [targetAudience, setTargetAudience] = useState("All Employees");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [publishType, setPublishType] = useState("now"); // 'now' | 'later'
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("09:00");
  const [expiryDate, setExpiryDate] = useState("");
  const [attachments, setAttachments] = useState([]);

  // UI helpers
  const [empSearch, setEmpSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or initialize state
  useEffect(() => {
    if (editAnnouncement) {
      setTitle(editAnnouncement.title || "");
      setCategory(editAnnouncement.category || "General");
      setDescription(editAnnouncement.description || "");
      setPriority(editAnnouncement.priority || "Medium");
      setTargetAudience(editAnnouncement.targetAudience || "All Employees");
      setSelectedDepartments(editAnnouncement.targetDepartments || []);
      setSelectedEmployeeIds(editAnnouncement.targetEmployeeIds || []);
      setPublishType(editAnnouncement.publishType || "now");
      setPublishDate(editAnnouncement.publishDate || "");
      setPublishTime(editAnnouncement.publishTime || "09:00");
      setExpiryDate(editAnnouncement.expiryDate || "");
      setAttachments(editAnnouncement.attachments || []);
    } else {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const hours = String(today.getHours()).padStart(2, "0");
      const minutes = String(today.getMinutes()).padStart(2, "0");

      setTitle("");
      setCategory("General");
      setDescription("");
      setPriority("Medium");
      setTargetAudience("All Employees");
      setSelectedDepartments([]);
      setSelectedEmployeeIds([]);
      setPublishType("now");
      setPublishDate(todayStr);
      setPublishTime(`${hours}:${minutes}`);
      setExpiryDate("");
      setAttachments([]);
    }
    setErrors({});
  }, [editAnnouncement, isOpen]);

  // Department toggle handler
  const handleToggleDepartment = (deptName) => {
    setSelectedDepartments(prev =>
      prev.includes(deptName)
        ? prev.filter(d => d !== deptName)
        : [...prev, deptName]
    );
  };

  // Employee toggle handler
  const handleToggleEmployee = (empId) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  // Select all employees in filtered list
  const handleSelectAllFilteredEmployees = (filteredEmps) => {
    const ids = filteredEmps.map(e => e.id);
    const allAlreadySelected = ids.every(id => selectedEmployeeIds.includes(id));
    if (allAlreadySelected) {
      setSelectedEmployeeIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // File upload simulation / local file reader
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = files.map(file => {
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      return {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: sizeStr,
        url: "#"
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = "Announcement Title is required";
    if (!description.trim()) errs.description = "Announcement content is required";
    if (targetAudience === "Specific Department" && selectedDepartments.length === 0) {
      errs.departments = "Please select at least one department";
    }
    if (targetAudience === "Selected Employees" && selectedEmployeeIds.length === 0) {
      errs.employees = "Please select at least one target employee";
    }
    if (publishType === "later") {
      if (!publishDate) errs.publishDate = "Publish Date is required for scheduled announcement";
      if (!publishTime) errs.publishTime = "Publish Time is required";
    }
    if (expiryDate && publishDate && expiryDate < publishDate) {
      errs.expiryDate = "Expiry date cannot be earlier than publish date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form submission
  const handleSubmit = (isDraft = false) => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        category,
        description,
        priority,
        targetAudience,
        targetDepartments: selectedDepartments,
        targetEmployeeIds: selectedEmployeeIds,
        publishType,
        publishDate,
        publishTime,
        expiryDate,
        attachments,
        isDraft
      };

      if (isEdit) {
        updateAnnouncement(editAnnouncement.id, payload, currentUser);
      } else {
        createAnnouncement(payload, currentUser);
      }

      setIsSubmitting(false);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      setErrors({ global: e.message || "Failed to save announcement" });
      setIsSubmitting(false);
    }
  };

  // Filtered employees for target selection
  const filteredEmployees = useMemo(() => {
    if (!empSearch.trim()) return allEmployees;
    const q = empSearch.toLowerCase();
    return allEmployees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.dept || e.department || "").toLowerCase().includes(q) ||
      (e.designation || "").toLowerCase().includes(q)
    );
  }, [allEmployees, empSearch]);

  if (!isOpen) return null;

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-3xl max-h-[92vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 rounded-3xl bg-[#0d1622]/95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/25 to-accent2/25 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg shadow-md">
              <Icon name="megaphone" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display font-bold text-ink text-base sm:text-lg">
                {isEdit ? "Edit Announcement" : "Create Announcement & Circular"}
              </h2>
              <p className="text-[12px] text-muted">
                Broadcast corporate circulars, policy notifications, and department announcements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errors.global && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <Icon name="alert-triangle" className="w-4 h-4 text-rose-400" />
            <span>{errors.global}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs flex flex-col gap-5">
          
          {/* Section: Basic Identity & Category */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                Announcement Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Health Checkup Camp 2026 or Diwali Holidays Schedule"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-surface2/60 border ${
                  errors.title ? "border-rose-400" : "border-line"
                } text-ink placeholder:text-muted/60 text-xs focus:border-accent outline-none transition`}
              />
              {errors.title && <span className="text-rose-400 text-[11px] mt-1 block">{errors.title}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  Category <span className="text-rose-400">*</span>
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full"
                >
                  {ANNOUNCEMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  Priority Level
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITIES.map(p => {
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-1 rounded-xl text-center text-[11px] font-semibold border transition cursor-pointer ${
                          isSelected
                            ? p === "Urgent" ? "bg-rose-500 text-white border-rose-600 font-bold"
                            : p === "High" ? "bg-amber-500 text-white border-amber-600 font-bold"
                            : "bg-accent text-on-accent border-accent font-bold"
                            : "bg-surface2/40 border-line text-muted hover:text-ink"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Announcement Content */}
          <div>
            <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
              Description / Announcement Content <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter full announcement details, guidelines, venue info, or action steps for employees..."
              className={`w-full p-3.5 rounded-xl bg-surface2/60 border ${
                errors.description ? "border-rose-400" : "border-line"
              } text-ink placeholder:text-muted/60 text-xs focus:border-accent outline-none leading-relaxed transition`}
            />
            {errors.description && <span className="text-rose-400 text-[11px] mt-1 block">{errors.description}</span>}
          </div>

          {/* Section: Target Audience */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                Target Audience <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AUDIENCE_OPTIONS.map(opt => {
                  const isSelected = targetAudience === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetAudience(opt.id)}
                      className={`p-2.5 rounded-xl text-center text-xs font-semibold border transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? "bg-accent text-on-accent border-accent shadow-sm"
                          : "bg-surface2/60 border-line text-muted hover:text-ink"
                      }`}
                    >
                      <Icon
                        name={opt.id === "Selected Employees" ? "user-check" : opt.id === "Specific Department" ? "briefcase" : "users"}
                        className={`w-3.5 h-3.5 ${isSelected ? "text-on-accent" : "text-muted"}`}
                      />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Specific Department is selected: dynamically load departments */}
            {targetAudience === "Specific Department" && (
              <div className="pt-2 border-t border-line/60 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink">
                    Select Target Departments ({selectedDepartments.length} selected):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDepartments(availableDepartments.map(d => d.name))}
                      className="text-[10.5px] text-accent hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-muted">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDepartments([])}
                      className="text-[10.5px] text-muted hover:text-ink cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableDepartments.map(dept => {
                    const isChecked = selectedDepartments.includes(dept.name);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleToggleDepartment(dept.name)}
                        className={`p-2 rounded-xl border text-xs text-left flex items-center gap-2 transition cursor-pointer ${
                          isChecked
                            ? "bg-accent/15 border-accent text-accent font-bold"
                            : "bg-surface2/50 border-line text-muted hover:text-ink"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border text-[10px] ${
                          isChecked ? "bg-accent text-on-accent border-accent" : "border-line bg-surface2"
                        }`}>
                          {isChecked && "✓"}
                        </span>
                        <span className="truncate">{dept.name}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.departments && <span className="text-rose-400 text-[11px]">{errors.departments}</span>}
              </div>
            )}

            {/* If Selected Employees is chosen */}
            {targetAudience === "Selected Employees" && (
              <div className="pt-2 border-t border-line/60 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-semibold text-ink">
                    Select Target Employees ({selectedEmployeeIds.length} of {allEmployees.length} selected):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllFilteredEmployees(filteredEmployees)}
                    className="text-[11px] text-accent font-semibold hover:underline cursor-pointer"
                  >
                    Toggle Filtered ({filteredEmployees.length})
                  </button>
                </div>

                {/* Filter employee search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Filter employees by name, ID or department..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder:text-muted/60 outline-none focus:border-accent"
                  />
                  <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-surface2/40 border border-line rounded-xl">
                  {filteredEmployees.map(emp => {
                    const isChecked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleToggleEmployee(emp.id)}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                          isChecked ? "bg-accent/15 text-accent font-semibold" : "hover:bg-surface2 text-ink"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] shrink-0 ${
                            isChecked ? "bg-accent text-on-accent border-accent" : "border-line bg-surface2"
                          }`}>
                            {isChecked && "✓"}
                          </span>
                          <span className="truncate">{emp.name}</span>
                          <span className="text-[10px] text-muted font-num">({emp.id})</span>
                        </div>
                        <span className="text-[10px] text-muted shrink-0">{emp.department || emp.dept}</span>
                      </div>
                    );
                  })}
                </div>
                {errors.employees && <span className="text-rose-400 text-[11px]">{errors.employees}</span>}
              </div>
            )}
          </div>

          {/* Section: Publishing Schedule */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider">
                Publishing Schedule
              </label>
              <div className="inline-flex items-center p-0.5 bg-surface2 border border-line rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPublishType("now")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-semibold ${
                    publishType === "now" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setPublishType("later")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-semibold flex items-center gap-1 ${
                    publishType === "later" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  <Icon name="clock" className="w-3 h-3 text-inherit" />
                  <span>Schedule for Later</span>
                </button>
              </div>
            </div>

            {/* Date and Time pickers when Schedule for Later */}
            {publishType === "later" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line/60">
                <div>
                  <label className="block text-[11px] text-muted mb-1">
                    Publish Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface2/60 border border-line text-ink text-xs focus:border-accent outline-none"
                  />
                  {errors.publishDate && <span className="text-rose-400 text-[11px] mt-1 block">{errors.publishDate}</span>}
                </div>

                <div>
                  <label className="block text-[11px] text-muted mb-1">
                    Publish Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface2/60 border border-line text-ink text-xs focus:border-accent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Optional Expiry Date */}
            <div className="pt-2 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] text-muted">
                <strong>Expiry Date (Optional):</strong> Notice automatically archives after this date.
              </div>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="Optional expiry date"
                className="px-3 py-1.5 rounded-xl bg-surface2/60 border border-line text-ink text-xs focus:border-accent outline-none"
              />
            </div>
            {errors.expiryDate && <span className="text-rose-400 text-[11px]">{errors.expiryDate}</span>}
          </div>

          {/* Section: Attachment Upload */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider">
                  Attachments & Circular Documents
                </label>
                <div className="text-[11px] text-muted">Upload PDF, DOC, or Image files (e.g. Circular, Policy Guide)</div>
              </div>

              <label className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-accent font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm">
                <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
                <span>Upload Files</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Attached files list */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface2 border border-line text-ink text-xs shadow-sm"
                  >
                    <Icon name="file-text" className="w-3.5 h-3.5 text-accent" />
                    <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                    <span className="text-[10px] text-muted font-num font-semibold">({file.size})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-muted hover:text-rose-400 p-0.5 rounded cursor-pointer"
                      title="Remove file"
                    >
                      <Icon name="x" className="w-3 h-3 text-inherit" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-between gap-3 bg-surface/80">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
          >
            Save as Draft
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-accent to-accent2 text-on-accent text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
            >
              <Icon name={publishType === "later" ? "clock" : "check"} className="w-4 h-4 text-on-accent" />
              <span>
                {isEdit
                  ? "Update Announcement"
                  : publishType === "later"
                  ? "Schedule Announcement"
                  : "Publish Announcement"}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CreateAnnouncementModal;
