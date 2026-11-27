import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import {
  HOLIDAY_TYPES,
  HOLIDAY_CATEGORIES,
  APPLICABLE_LOCATIONS,
  addHoliday,
  updateHoliday
} from '../../services/holidayStore.js';
import { DEPARTMENTS } from '../../services/employeeStore.js';

export const AddHolidayModal = ({
  isOpen,
  onClose,
  onSuccess,
  editHoliday = null
}) => {
  const isEdit = Boolean(editHoliday);

  const getInitialState = () => {
    if (editHoliday) {
      return {
        ...editHoliday,
        departments: Array.isArray(editHoliday.departments) ? [...editHoliday.departments] : ["All Departments"]
      };
    }
    return {
      name: "",
      date: new Date().toISOString().split("T")[0],
      type: "Festival",
      category: "Gazetted Holiday",
      location: "All India",
      departments: ["All Departments"],
      description: "",
      isOptional: false,
      repeatAnnually: false,
      status: "Active"
    };
  };

  const [formData, setFormData] = useState(getInitialState);
  const [errors, setErrors] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
      setErrors({});
    }
  }, [isOpen, editHoliday]);

  if (!isOpen) return null;

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

  const handleToggleDepartment = (dept) => {
    setFormData(prev => {
      let current = [...(prev.departments || [])];
      if (dept === "All Departments") {
        return { ...prev, departments: ["All Departments"] };
      }
      current = current.filter(d => d !== "All Departments");
      if (current.includes(dept)) {
        current = current.filter(d => d !== dept);
        if (current.length === 0) current = ["All Departments"];
      } else {
        current.push(dept);
      }
      return { ...prev, departments: current };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = "Holiday Name is required";
    }
    if (!formData.date) {
      errs.date = "Holiday Date is required";
    }
    if (!formData.type) {
      errs.type = "Holiday Type is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      const res = updateHoliday(editHoliday.id, formData);
      if (res.ok) {
        onSuccess?.(res.holiday, "updated");
        onClose();
      } else {
        setErrors({ form: res.error });
      }
    } else {
      const res = addHoliday(formData);
      if (res.ok) {
        onSuccess?.(res.holiday, "added");
        onClose();
      } else {
        setErrors({ form: res.error });
      }
    }
  };

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-2xl max-h-[92vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-on-accent flex items-center justify-center font-bold text-lg shadow-md">
              <Icon name="calendar" className="w-5 h-5 text-on-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-ink text-base sm:text-lg">
                  {isEdit ? "Edit Holiday Record" : "Add New Official Holiday"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/20">
                  {formData.type || "Holiday"}
                </span>
              </div>
              <p className="text-[12px] text-muted">
                Configure corporate, national, festival, or state gazetted holidays for enterprise leave policy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errors.form && (
          <div className="px-5 py-2.5 bg-bad/15 border-b border-bad/30 text-bad text-xs font-semibold">
            {errors.form}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs flex flex-col gap-4">
          
          {/* Row 1: Holiday Name & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                Holiday Name <span className="text-bad">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ugadi / Telugu New Year"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent font-medium ${
                  errors.name ? 'border-bad' : 'border-line'
                }`}
              />
              {errors.name && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.name}</span>}
            </div>

            <div>
              <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                Holiday Date <span className="text-bad">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className={`w-full bg-surface2/70 border rounded px-3 py-2 text-ink outline-none focus:border-accent font-data font-bold ${
                  errors.date ? 'border-bad' : 'border-line'
                }`}
              />
              {errors.date && <span className="text-[10.5px] text-bad mt-0.5 block">{errors.date}</span>}
            </div>
          </div>

          {/* Row 2: Holiday Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                Holiday Type <span className="text-bad">*</span>
              </label>
              <Select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full"
              >
                {HOLIDAY_TYPES.map(t => (
                  <option key={t} value={t}>{t} Holiday</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                Holiday Category
              </label>
              <Select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full"
              >
                {HOLIDAY_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Row 3: Applicable Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                Applicable Location / State
              </label>
              <Select
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full"
              >
                {APPLICABLE_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
                Holiday Status
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleChange("status", "Active")}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    formData.status === "Active"
                      ? "bg-good/20 border-good text-good shadow-sm"
                      : "bg-surface2/60 border-line text-muted hover:text-ink"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("status", "Inactive")}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    formData.status === "Inactive"
                      ? "bg-bad/20 border-bad text-bad shadow-sm"
                      : "bg-surface2/60 border-line text-muted hover:text-ink"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: Applicable Departments */}
          <div>
            <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1.5">
              Applicable Departments
            </label>
            <div className="p-3 rounded-xl border border-line bg-surface2/30 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleToggleDepartment("All Departments")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  formData.departments?.includes("All Departments")
                    ? "bg-accent text-on-accent border-accent shadow-sm"
                    : "bg-surface2 border-line text-muted hover:text-ink"
                }`}
              >
                All Departments
              </button>
              {DEPARTMENTS.map(dept => {
                const isSelected = formData.departments?.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => handleToggleDepartment(dept)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      isSelected && !formData.departments?.includes("All Departments")
                        ? "bg-accent text-on-accent border-accent shadow-sm"
                        : "bg-surface2 border-line text-muted hover:text-ink"
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Toggles (Optional & Repeat Annually) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-line bg-surface2/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block text-xs">Optional / Restricted Holiday</span>
                <span className="text-[11px] text-muted">Employees may choose from optional quota</span>
              </div>
              <input
                type="checkbox"
                id="isOptionalCheck"
                checked={formData.isOptional}
                onChange={(e) => handleChange("isOptional", e.target.checked)}
                className="w-4 h-4 text-accent border-line rounded focus:ring-accent cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-line/60 pt-2 sm:pt-0 sm:pl-3">
              <div>
                <span className="font-semibold text-ink block text-xs">Repeat Annually</span>
                <span className="text-[11px] text-muted">Fixed date recurrence (e.g. 26 Jan, 15 Aug)</span>
              </div>
              <input
                type="checkbox"
                id="repeatAnnuallyCheck"
                checked={formData.repeatAnnually}
                onChange={(e) => handleChange("repeatAnnually", e.target.checked)}
                className="w-4 h-4 text-accent border-line rounded focus:ring-accent cursor-pointer"
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="block text-muted text-[10.5px] font-semibold uppercase mb-1">
              Description & Cultural Context
            </label>
            <textarea
              rows={3}
              placeholder="Provide context, historical significance, or special company guidelines for this holiday..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent text-xs leading-relaxed resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line flex items-center justify-between gap-3 bg-surface/90">
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
              className="px-4 py-1.5 rounded-[var(--radius)] bg-accent text-on-accent text-xs font-semibold hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md"
            >
              <Icon name="check" className="w-3.5 h-3.5 text-on-accent stroke-[3]" />
              <span>{isEdit ? "Update Holiday" : "Save Holiday"}</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full !p-5 border border-line shadow-2xl animate-in zoom-in-95">
              <div className="font-display font-bold text-ink text-base">Reset entered holiday data?</div>
              <p className="text-xs text-muted mt-1.5">
                All entered field values will be cleared and restored to default values.
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
