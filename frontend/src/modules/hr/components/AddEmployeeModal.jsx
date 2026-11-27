import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { formatCurrency } from '../utils/format.js';
import {
  DEPARTMENTS,
  WORK_LOCATIONS,
  WORK_SHIFTS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_STATUSES,
  INDIAN_BANKS,
  generateNextEmployeeId,
  calculateSalaryBreakdown,
  saveEmployee,
  loadEmployees
} from '../services/employeeStore.js';

// Section tabs definition
const TABS = [
  { id: "personal", label: "Personal Information", icon: "user" },
  { id: "employment", label: "Employment", icon: "briefcase" },
  { id: "address", label: "Address", icon: "map-pin" },
  { id: "emergency", label: "Emergency Contact", icon: "phone" },
  { id: "salary", label: "Bank & Salary", icon: "credit-card" },
  { id: "documents", label: "Documents", icon: "file-text" }
];

// Document Types
const DOCUMENT_TYPES = [
  "Profile Photo",
  "Resume",
  "Aadhaar Document",
  "PAN Card",
  "Educational Certificates",
  "Experience Certificate",
  "Offer Letter",
  "Appointment Letter",
  "Other Documents"
];

export const AddEmployeeModal = ({
  isOpen,
  onClose,
  onSaveSuccess,
  editEmployee = null,
  currentUser = null
}) => {
  const isEdit = Boolean(editEmployee);

  // Active section tab
  const [activeTab, setActiveTab] = useState("personal");

  // Form State
  const [formData, setFormData] = useState(() => getInitialState());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("Resume");

  // Available managers from existing directory for reporting line dropdown
  const managerOptions = useMemo(() => {
    const list = loadEmployees();
    return list.map(e => ({ id: e.id, name: e.name, role: e.role, dept: e.dept }));
  }, []);

  function getInitialState() {
    if (editEmployee) {
      return {
        ...editEmployee,
        currentAddress: { ...(editEmployee.currentAddress || {}) },
        permanentAddress: { ...(editEmployee.permanentAddress || {}) },
        emergencyContact: { ...(editEmployee.emergencyContact || {}) },
        bank: { ...(editEmployee.bank || {}) },
        salary: { ...(editEmployee.salary || {}) },
        documents: Array.isArray(editEmployee.documents) ? [...editEmployee.documents] : []
      };
    }

    const todayDateStr = new Date().toISOString().split("T")[0];

    return {
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "Male",
      dob: "1996-05-20",
      bloodGroup: "O+",
      maritalStatus: "Single",
      personalEmail: "",
      mobile: "",
      altMobile: "",
      aadhaar: "",
      photoUrl: null,

      // Employment
      id: generateNextEmployeeId(),
      joined: todayDateStr,
      type: "Full-Time",
      dept: "Engineering",
      role: "",
      jobRole: "",
      mgr: "Aarav Sharma",
      teamLead: "Aarav Sharma",
      location: "Hyderabad",
      shift: "General / Day Shift (09:00 - 18:00)",
      status: "Active",
      email: "",
      probation: "3 Months",
      confirmationDate: "",

      // Address
      currentAddress: {
        flat: "",
        street: "",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        pincode: ""
      },
      permanentAddress: {
        flat: "",
        street: "",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        pincode: ""
      },
      sameAddress: true,

      // Emergency Contact
      emergencyContact: {
        name: "",
        relationship: "Parent",
        mobile: "",
        altPhone: ""
      },

      // Bank & Salary
      bank: {
        holderName: "",
        bankName: "HDFC Bank",
        accountNumber: "",
        ifsc: "",
        branch: ""
      },
      salary: {
        basic: 50000,
        hra: 25000,
        da: 10000,
        conveyance: 4000,
        medical: 5000,
        special: 16000,
        pf: 6000,
        esi: 0,
        pt: 200,
        tds: 8000
      },

      // Documents
      documents: []
    };
  }

  // Reset form to initial state when modal opens or editEmployee changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
      setErrors({});
      setActiveTab("personal");
    }
  }, [isOpen, editEmployee]);

  // Auto-generate Work Email based on First Name & Last Name if empty
  const handleNameBlur = () => {
    if (!formData.email && formData.firstName && formData.lastName) {
      const cleanFirst = formData.firstName.trim().toLowerCase();
      const cleanLast = formData.lastName.trim().toLowerCase();
      setFormData(prev => ({
        ...prev,
        email: `${cleanFirst}.${cleanLast}@nexora.in`,
        bank: {
          ...prev.bank,
          holderName: prev.bank.holderName || `${prev.firstName.trim()} ${prev.lastName.trim()}`
        }
      }));
    }
  };

  // Live computed salary breakdown
  const computedSalary = useMemo(() => {
    return calculateSalaryBreakdown(formData.salary || {});
  }, [formData.salary]);

  // Handle generic field change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Handle nested object changes (address, emergency, bank, salary)
  const handleNestedChange = (parentKey, childKey, value) => {
    setFormData(prev => {
      const parentObj = { ...(prev[parentKey] || {}) };
      parentObj[childKey] = value;

      const nextState = { ...prev, [parentKey]: parentObj };

      // If updating current address and sameAddress is checked, mirror to permanent address
      if (parentKey === "currentAddress" && prev.sameAddress) {
        nextState.permanentAddress = { ...parentObj };
      }

      return nextState;
    });

    if (errors[childKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[childKey];
        return next;
      });
    }
  };

  // Toggle same address checkbox
  const handleToggleSameAddress = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAddress: checked,
      permanentAddress: checked ? { ...prev.currentAddress } : prev.permanentAddress
    }));
  };

  // Handle Photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Document upload
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newDocs = files.map(file => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      return {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: selectedDocType,
        name: file.name,
        size: sizeStr,
        uploadedAt: new Date().toISOString().split("T")[0]
      };
    });

    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...newDocs]
    }));
    e.target.value = "";
  };

  // Remove uploaded document
  const handleRemoveDocument = (docId) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== docId)
    }));
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e?.preventDefault();
    setIsSubmitting(true);

    const res = saveEmployee(formData, isEdit, editEmployee?.id);
    setIsSubmitting(false);

    if (res.ok) {
      if (onSaveSuccess) onSaveSuccess(res.employee);
      onClose();
    } else {
      setErrors(res.errors || {});
      // Jump to the tab containing the first error
      const errKeys = Object.keys(res.errors || {});
      if (errKeys.some(k => ["firstName", "lastName", "gender", "dob", "mobile", "altMobile", "personalEmail"].includes(k))) {
        setActiveTab("personal");
      } else if (errKeys.some(k => ["id", "joined", "dept", "role", "email"].includes(k))) {
        setActiveTab("employment");
      } else if (errKeys.some(k => ["currentPincode", "permanentPincode"].includes(k))) {
        setActiveTab("address");
      } else if (errKeys.some(k => ["ifsc"].includes(k))) {
        setActiveTab("salary");
      }
    }
  };

  // Count errors per tab for notification badges
  const tabErrorCounts = useMemo(() => {
    const counts = {};
    const keys = Object.keys(errors);

    counts.personal = keys.filter(k => ["firstName", "lastName", "gender", "dob", "mobile", "altMobile", "personalEmail"].includes(k)).length;
    counts.employment = keys.filter(k => ["id", "joined", "dept", "role", "email"].includes(k)).length;
    counts.address = keys.filter(k => ["currentPincode", "permanentPincode"].includes(k)).length;
    counts.salary = keys.filter(k => ["ifsc"].includes(k)).length;
    return counts;
  }, [errors]);

  if (!isOpen) return null;

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-5xl max-h-[92vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-on-accent flex items-center justify-center font-bold text-lg shadow-md">
              <Icon name={isEdit ? "edit" : "user-plus"} className="w-5 h-5 text-on-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-ink text-base sm:text-lg">
                  {isEdit ? <>Edit Employee Profile: <span className="font-num">{formData.id}</span></> : "Add New Employee"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/20">
                  {isEdit ? "Update Mode" : "New Onboarding"}
                </span>
              </div>
              <p className="text-[12px] text-muted">
                Enterprise workforce registry with statutory compliance, salary structure, and verified credentials
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition"
            title="Close form"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="px-5 py-2.5 bg-bad/15 border-b border-bad/30 text-bad text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="alert-triangle" className="w-4 h-4 text-bad shrink-0" />
              <span className="font-medium">
                Please correct the {Object.keys(errors).length} highlighted validation error(s) before saving.
              </span>
            </div>
          </div>
        )}

        {/* ================= SECTION NAVIGATION TABS ================= */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 border-b border-line overflow-x-auto bg-surface2/30">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const errorCount = tabErrorCounts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition relative ${
                  isActive
                    ? "border-accent text-accent bg-accent/5"
                    : "border-transparent text-muted hover:text-ink hover:bg-surface2/40"
                }`}
              >
                <Icon name={tab.icon} className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-muted'}`} />
                <span>{tab.label}</span>
                {errorCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-bad text-white text-[10px] flex items-center justify-center font-bold">
                    {errorCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================= FORM BODY (SCROLLABLE) ================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
          
          {/* ================= 1. PERSONAL INFORMATION ================= */}
          {activeTab === "personal" && (
            <div className="flex flex-col gap-5">
              {/* Profile Photo Row */}
              <div className="p-4 rounded-xl border border-line bg-surface2/40 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Profile Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-line shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-accent/20 border border-line flex items-center justify-center text-accent text-xl font-bold font-display">
                      {formData.firstName?.[0] || "E"}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="font-semibold text-ink text-sm">Employee Photo / Avatar</div>
                  <div className="text-[11px] text-muted">Upload a clear passport-style photograph (PNG, JPG or WebP up to 2MB)</div>
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-ink font-semibold transition flex items-center gap-1.5">
                      <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: null }))}
                        className="px-2.5 py-1.5 rounded-lg border border-line text-muted hover:text-bad transition text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Names Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    First Name <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pooja"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    onBlur={handleNameBlur}
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent ${
                      errors.firstName ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.firstName && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.firstName}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.middleName}
                    onChange={(e) => handleChange("middleName", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Last Name <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patel"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    onBlur={handleNameBlur}
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent ${
                      errors.lastName ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.lastName && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.lastName}</span>}
                </div>
              </div>

              {/* Demographics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Gender <span className="text-bad">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Date of Birth <span className="text-bad">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent font-data ${
                      errors.dob ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.dob && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.dob}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleChange("bloodGroup", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Marital Status
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => handleChange("maritalStatus", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              {/* Contact Information Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Mobile Number <span className="text-bad">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted font-data text-xs">+91</span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={formData.mobile}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                      className={`w-full bg-surface2/70 border rounded pl-11 pr-3 py-2 text-ink outline-none focus:border-accent font-data ${
                        errors.mobile ? 'border-bad' : 'border-line'
                      }`}
                    />
                  </div>
                  {errors.mobile && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.mobile}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Alternate Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted font-data text-xs">+91</span>
                    <input
                      type="tel"
                      placeholder="Optional"
                      value={formData.altMobile}
                      onChange={(e) => handleChange("altMobile", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded pl-11 pr-3 py-2 text-ink outline-none focus:border-accent font-data"
                    />
                  </div>
                  {errors.altMobile && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.altMobile}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    placeholder="employee@personal.com"
                    value={formData.personalEmail}
                    onChange={(e) => handleChange("personalEmail", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  />
                  {errors.personalEmail && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.personalEmail}</span>}
                </div>
              </div>

              {/* Aadhaar Number (Optional & Masked Access) */}
              <div className="p-3 rounded-xl border border-line bg-surface2/30">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-muted text-[10.5px] font-semibold uppercase flex items-center gap-1.5">
                    <Icon name="shield" className="w-3.5 h-3.5 text-accent" />
                    <span>Aadhaar Number (UIDAI - Restricted Statutory Record)</span>
                  </label>
                  <span className="text-[10.5px] text-muted font-data">Optional / Masked</span>
                </div>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-1234"
                  value={formData.aadhaar}
                  onChange={(e) => handleChange("aadhaar", e.target.value)}
                  className="w-full max-w-sm bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                />
              </div>
            </div>
          )}

          {/* ================= 2. EMPLOYMENT INFORMATION ================= */}
          {activeTab === "employment" && (
            <div className="flex flex-col gap-4">
              {/* Row 1: Employee ID & Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-muted text-[10.5px] font-semibold uppercase">
                      Employee ID <span className="text-bad">*</span>
                    </label>
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => handleChange("id", generateNextEmployeeId())}
                        className="text-[10.5px] text-accent hover:underline font-semibold"
                      >
                        Auto-generate
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => handleChange("id", e.target.value.toUpperCase())}
                    placeholder="e.g. EMP-1249"
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-accent font-data font-bold outline-none focus:border-accent ${
                      errors.id ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.id && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.id}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Date of Joining <span className="text-bad">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.joined}
                    onChange={(e) => handleChange("joined", e.target.value)}
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent font-data ${
                      errors.joined ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.joined && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.joined}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  >
                    {EMPLOYMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Department, Designation, Job Role */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Department <span className="text-bad">*</span>
                  </label>
                  <select
                    value={formData.dept}
                    onChange={(e) => handleChange("dept", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-medium"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Designation <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent ${
                      errors.role ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.role && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.role}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Functional Job Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fullstack React & Node Specialist"
                    value={formData.jobRole}
                    onChange={(e) => handleChange("jobRole", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Row 3: Reporting Manager & Team Lead */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={formData.mgr}
                    onChange={(e) => handleChange("mgr", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  >
                    <option value="Executive Board">Executive Board</option>
                    {managerOptions.map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role} - {m.dept})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Team Lead
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={formData.teamLead}
                    onChange={(e) => handleChange("teamLead", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Row 4: Work Location, Shift, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Work Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  >
                    {WORK_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Work Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => handleChange("shift", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data"
                  >
                    {WORK_SHIFTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Employment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-semibold"
                  >
                    {EMPLOYMENT_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Work Email, Probation, Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="firstname.lastname@nexora.in"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent font-data ${
                      errors.email ? 'border-bad' : 'border-line'
                    }`}
                  />
                  {errors.email && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.email}</span>}
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Probation Period
                  </label>
                  <select
                    value={formData.probation}
                    onChange={(e) => handleChange("probation", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                  >
                    <option value="None">None (Direct Confirmed)</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                    Confirmation Date
                  </label>
                  <input
                    type="date"
                    value={formData.confirmationDate}
                    onChange={(e) => handleChange("confirmationDate", e.target.value)}
                    className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. ADDRESS INFORMATION ================= */}
          {activeTab === "address" && (
            <div className="flex flex-col gap-5">
              {/* Current Address */}
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Icon name="map-pin" className="w-4 h-4 text-accent" />
                  <span className="font-display font-bold text-ink text-sm">Current / Residential Address</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      House / Flat / Building No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 301, Lakeview Enclave"
                      value={formData.currentAddress?.flat || ""}
                      onChange={(e) => handleNestedChange("currentAddress", "flat", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Street / Area / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hitec City Road, Madhapur"
                      value={formData.currentAddress?.street || ""}
                      onChange={(e) => handleNestedChange("currentAddress", "street", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">City</label>
                    <input
                      type="text"
                      value={formData.currentAddress?.city || ""}
                      onChange={(e) => handleNestedChange("currentAddress", "city", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">State</label>
                    <input
                      type="text"
                      value={formData.currentAddress?.state || ""}
                      onChange={(e) => handleNestedChange("currentAddress", "state", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.currentAddress?.country || "India"}
                      onChange={(e) => handleNestedChange("currentAddress", "country", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">PIN Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 500081"
                      value={formData.currentAddress?.pincode || ""}
                      onChange={(e) => handleNestedChange("currentAddress", "pincode", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data"
                    />
                    {errors.currentPincode && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.currentPincode}</span>}
                  </div>
                </div>
              </div>

              {/* Checkbox: Same Address */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="sameAddressCheck"
                  checked={formData.sameAddress}
                  onChange={(e) => handleToggleSameAddress(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sameAddressCheck" className="text-xs font-semibold text-ink cursor-pointer select-none">
                  Permanent address is the same as current address
                </label>
              </div>

              {/* Permanent Address */}
              {!formData.sameAddress && (
                <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-line pb-2">
                    <Icon name="map-pin" className="w-4 h-4 text-accent" />
                    <span className="font-display font-bold text-ink text-sm">Permanent / Domicile Address</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                        House / Flat / Building No.
                      </label>
                      <input
                        type="text"
                        value={formData.permanentAddress?.flat || ""}
                        onChange={(e) => handleNestedChange("permanentAddress", "flat", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                        Street / Area / Landmark
                      </label>
                      <input
                        type="text"
                        value={formData.permanentAddress?.street || ""}
                        onChange={(e) => handleNestedChange("permanentAddress", "street", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">City</label>
                      <input
                        type="text"
                        value={formData.permanentAddress?.city || ""}
                        onChange={(e) => handleNestedChange("permanentAddress", "city", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">State</label>
                      <input
                        type="text"
                        value={formData.permanentAddress?.state || ""}
                        onChange={(e) => handleNestedChange("permanentAddress", "state", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.permanentAddress?.country || "India"}
                        onChange={(e) => handleNestedChange("permanentAddress", "country", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">PIN Code</label>
                      <input
                        type="text"
                        value={formData.permanentAddress?.pincode || ""}
                        onChange={(e) => handleNestedChange("permanentAddress", "pincode", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data"
                      />
                      {errors.permanentPincode && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.permanentPincode}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 4. EMERGENCY CONTACT ================= */}
          {activeTab === "emergency" && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Icon name="phone" className="w-4 h-4 text-accent" />
                  <span className="font-display font-bold text-ink text-sm">Primary Emergency Contact Person</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Contact Person Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={formData.emergencyContact?.name || ""}
                      onChange={(e) => handleNestedChange("emergencyContact", "name", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Relationship
                    </label>
                    <select
                      value={formData.emergencyContact?.relationship || "Parent"}
                      onChange={(e) => handleNestedChange("emergencyContact", "relationship", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    >
                      <option value="Parent">Parent (Father / Mother)</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling (Brother / Sister)</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Guardian">Guardian / Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Primary Contact Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-muted font-data text-xs">+91</span>
                      <input
                        type="tel"
                        placeholder="98765 00000"
                        value={formData.emergencyContact?.mobile || ""}
                        onChange={(e) => handleNestedChange("emergencyContact", "mobile", e.target.value)}
                        className="w-full bg-surface2/70 border border-line rounded pl-11 pr-3 py-2 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Alternate / Landline Contact
                    </label>
                    <input
                      type="tel"
                      placeholder="Optional"
                      value={formData.emergencyContact?.altPhone || ""}
                      onChange={(e) => handleNestedChange("emergencyContact", "altPhone", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. BANK & SALARY INFORMATION ================= */}
          {activeTab === "salary" && (
            <div className="flex flex-col gap-5">
              {/* Permission Banner */}
              <div className="p-3 rounded-xl border border-accent/30 bg-accent/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon name="shield" className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-ink font-semibold">HR & Payroll Authorized View</span>
                  <span className="text-muted hidden sm:inline">— Direct bank disbursement and statutory deductions management</span>
                </div>
                <span className="text-[11px] font-data text-accent font-bold">100% Encrypted</span>
              </div>

              {/* Bank Account Details */}
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Icon name="credit-card" className="w-4 h-4 text-accent" />
                  <span className="font-display font-bold text-ink text-sm">Disbursement Bank Account</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="As per bank passbook"
                      value={formData.bank?.holderName || ""}
                      onChange={(e) => handleNestedChange("bank", "holderName", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Bank Name
                    </label>
                    <select
                      value={formData.bank?.bankName || "HDFC Bank"}
                      onChange={(e) => handleNestedChange("bank", "bankName", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    >
                      {INDIAN_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50100234891234"
                      value={formData.bank?.accountNumber || ""}
                      onChange={(e) => handleNestedChange("bank", "accountNumber", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0000542"
                      value={formData.bank?.ifsc || ""}
                      onChange={(e) => handleNestedChange("bank", "ifsc", e.target.value.toUpperCase())}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data uppercase"
                    />
                    {errors.ifsc && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.ifsc}</span>}
                  </div>

                  <div>
                    <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                      Branch Name / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Madhapur, Hyderabad"
                      value={formData.bank?.branch || ""}
                      onChange={(e) => handleNestedChange("bank", "branch", e.target.value)}
                      className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Salary Breakdown Structure */}
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="dollar-sign" className="w-4 h-4 text-accent" />
                    <span className="font-display font-bold text-ink text-sm">Monthly Compensation & Allowances (₹)</span>
                  </div>
                  <span className="text-[11px] text-muted font-data">Statutory India CTC Structure</span>
                </div>

                {/* Earnings Grid */}
                <div>
                  <div className="text-[11px] font-bold text-ink uppercase tracking-wider mb-2">1. Monthly Earnings (Gross Components)</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Basic Salary</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.basic || 0}
                        onChange={(e) => handleNestedChange("salary", "basic", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">House Rent Allowance (HRA)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.hra || 0}
                        onChange={(e) => handleNestedChange("salary", "hra", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Dearness Allowance (DA)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.da || 0}
                        onChange={(e) => handleNestedChange("salary", "da", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Conveyance Allowance</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.conveyance || 0}
                        onChange={(e) => handleNestedChange("salary", "conveyance", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Medical Allowance</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.medical || 0}
                        onChange={(e) => handleNestedChange("salary", "medical", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Special Allowance</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.special || 0}
                        onChange={(e) => handleNestedChange("salary", "special", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Grid */}
                <div className="pt-2 border-t border-line/60">
                  <div className="text-[11px] font-bold text-ink uppercase tracking-wider mb-2">2. Statutory Deductions</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Provident Fund (PF 12%)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.pf || 0}
                        onChange={(e) => handleNestedChange("salary", "pf", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">ESI (0.75%)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.esi || 0}
                        onChange={(e) => handleNestedChange("salary", "esi", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">Professional Tax (PT)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.pt || 0}
                        onChange={(e) => handleNestedChange("salary", "pt", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>

                    <div>
                      <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">TDS / Income Tax</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary?.tds || 0}
                        onChange={(e) => handleNestedChange("salary", "tds", Number(e.target.value))}
                        className="w-full bg-surface2/70 border border-line rounded px-3 py-1.5 text-ink outline-none focus:border-accent font-data"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Real-time Summary Cards */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-line">
                  <div className="p-3 rounded-lg bg-surface border border-line text-center">
                    <span className="text-[10.5px] font-semibold text-muted uppercase">Gross Earnings</span>
                    <div className="font-num font-extrabold text-base text-ink mt-0.5">
                      {formatCurrency(computedSalary.gross)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-line text-center">
                    <span className="text-[10.5px] font-semibold text-bad uppercase">Total Deductions</span>
                    <div className="font-num font-extrabold text-base text-bad mt-0.5">
                      {formatCurrency(-computedSalary.deductions)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-good/10 border border-good/40 text-center">
                    <span className="text-[10.5px] font-semibold text-good uppercase">Net Take-Home Salary</span>
                    <div className="font-num font-extrabold text-lg text-good mt-0.5">
                      {formatCurrency(computedSalary.net)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. DOCUMENTS ================= */}
          {activeTab === "documents" && (
            <div className="flex flex-col gap-5">
              {/* Upload Dropzone Bar */}
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                    <Icon name="upload" className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Upload Credentials & Contracts</div>
                    <div className="text-[11px] text-muted">Aadhaar, PAN, Resume, Degrees and Offer Letters (PDF or Images)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="bg-surface2/70 border border-line rounded px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
                  >
                    {DOCUMENT_TYPES.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>

                  <label className="cursor-pointer px-3 py-1.5 rounded-[var(--radius)] bg-accent text-on-accent text-xs font-semibold hover:brightness-105 transition flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                    <Icon name="plus" className="w-3.5 h-3.5 text-on-accent" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="rounded-xl border border-line overflow-hidden">
                <div className="p-3 bg-surface2/60 border-b border-line flex items-center justify-between text-xs font-semibold text-muted uppercase tracking-wider">
                  <span>Uploaded Documents ({formData.documents?.length || 0})</span>
                  <span>Document Type</span>
                </div>

                {(!formData.documents || formData.documents.length === 0) ? (
                  <div className="p-8 text-center text-muted flex flex-col items-center gap-2">
                    <Icon name="file-text" className="w-8 h-8 text-muted/50" />
                    <p className="text-xs">No documents uploaded yet. Select a document type and click Choose File above.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line font-data">
                    {formData.documents.map(doc => (
                      <div key={doc.id} className="p-3 flex items-center justify-between gap-3 hover:bg-surface2/40 transition">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="file-text" className="w-4 h-4 text-accent shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink text-xs truncate font-sans">{doc.name}</div>
                            <div className="text-[10.5px] text-muted">
                              {doc.size} • Uploaded on {doc.uploadedAt}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-surface border border-line text-[11px] font-sans text-ink">
                            {doc.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1.5 rounded text-muted hover:text-bad hover:bg-bad/10 transition"
                            title="Remove document"
                          >
                            <Icon name="trash-2" className="w-3.5 h-3.5 text-bad" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-between gap-3 bg-surface/90">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 rounded-[var(--radius)] border border-line bg-surface2 text-muted hover:text-ink text-xs font-semibold hover:border-accent transition"
          >
            Reset Form
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[var(--radius)] border border-line bg-surface2 text-ink hover:border-accent text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-[var(--radius)] bg-accent text-on-accent text-xs font-semibold hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Icon name="check" className="w-3.5 h-3.5 text-on-accent stroke-[3]" />
              <span>{isSubmitting ? "Saving..." : isEdit ? "Update Employee" : "Save Employee"}</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full !p-5 border border-line shadow-2xl animate-in zoom-in-95">
              <div className="font-display font-bold text-ink text-base">Reset entered form data?</div>
              <p className="text-xs text-muted mt-1.5">
                All entered field values across all sections will be cleared and restored to default values.
              </p>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded bg-surface2 border border-line text-xs font-semibold text-ink"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(getInitialState());
                    setErrors({});
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-1.5 rounded bg-bad text-white text-xs font-semibold hover:brightness-110"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
