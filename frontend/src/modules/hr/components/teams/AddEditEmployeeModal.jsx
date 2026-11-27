import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Icon from "../Icon";
import {
  loadAllEmployees,
  loadDepartmentsList,
  addEmployee,
  updateEmployee,
  validateHierarchyNoCycles,
} from "../../services/teamService";

export default function AddEditEmployeeModal({
  isOpen,
  onClose,
  onSaved,
  employee = null, // null for add, object for edit
  defaultDepartment = "",
  defaultReportingToId = "",
}) {
  const isEdit = Boolean(employee);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: defaultDepartment || "Engineering",
    designation: "",
    role: "EMPLOYEE",
    reportingToId: defaultReportingToId || "EMP-1001",
    totalExperienceYears: 2,
    previousCompanies: "",
    skills: "",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    status: "Active",
    joiningDate: new Date().toISOString().split("T")[0],
    dob: "1997-06-15",
    gender: "Female",
    location: "Hyderabad",
    notes: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Departments list
  const departments = useMemo(() => {
    return loadDepartmentsList();
  }, []);

  // All employees for manager selection
  const allEmployees = useMemo(() => {
    return loadAllEmployees();
  }, []);

  // Filter possible managers (cannot report to self or create cycles)
  const availableManagers = useMemo(() => {
    return allEmployees.filter((emp) => {
      if (isEdit && emp.id === employee.id) return false;
      if (isEdit && !validateHierarchyNoCycles(employee.id, emp.id, allEmployees)) {
        return false;
      }
      return true;
    });
  }, [allEmployees, isEdit, employee]);

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || employee.name?.split(" ")[0] || "",
        lastName: employee.lastName || employee.name?.split(" ").slice(1).join(" ") || "",
        email: employee.email || "",
        phone: employee.phone || "",
        department: employee.department || employee.dept || defaultDepartment || "Engineering",
        designation: employee.designation || "",
        role: employee.role || "EMPLOYEE",
        reportingToId: employee.reportingToId || defaultReportingToId || "",
        totalExperienceYears: employee.totalExperienceYears ?? 2,
        previousCompanies: Array.isArray(employee.previousCompanies)
          ? employee.previousCompanies.join(", ")
          : employee.previousCompanies || "",
        skills: Array.isArray(employee.skills)
          ? employee.skills.join(", ")
          : employee.skills || "",
        workMode: employee.workMode || "Hybrid",
        employmentType: employee.employmentType || "Full-Time",
        status: employee.status || "Active",
        joiningDate: employee.joiningDate || new Date().toISOString().split("T")[0],
        dob: employee.dob || "1997-06-15",
        gender: employee.gender || "Female",
        location: employee.location || "Hyderabad",
        notes: employee.notes || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        department: defaultDepartment || prev.department,
        reportingToId: defaultReportingToId || prev.reportingToId,
      }));
    }
    setError("");
  }, [employee, defaultDepartment, defaultReportingToId, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and Last name are required.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!formData.designation.trim()) {
      setError("Designation is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsArray = formData.skills
        ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const companiesArray = formData.previousCompanies
        ? formData.previousCompanies.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        skills: skillsArray,
        previousCompanies: companiesArray,
        totalExperienceYears: parseFloat(formData.totalExperienceYears) || 0,
      };

      let res;
      if (isEdit) {
        res = updateEmployee(employee.id, payload);
      } else {
        res = addEmployee(payload);
      }

      if (res && res.ok === false) {
        setError(res.error || "Failed to save employee");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      if (onSaved) onSaved(res?.employee || payload);
      onClose();
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-white/10 bg-[#0d1520]/95 shadow-2xl shadow-emerald-950/40 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <Icon name={isEdit ? "edit" : "user-plus"} className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? `Edit Employee (${employee.id})` : "Add New Employee"}
              </h2>
              <p className="text-xs text-white/50">
                {isEdit
                  ? "Update workforce record and reporting hierarchy"
                  : "Register employee, assign reporting lead and department"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="flex items-center gap-2 border-b border-rose-500/30 bg-rose-500/10 px-6 py-2.5 text-xs font-semibold text-rose-300">
            <Icon name="alert-circle" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section: Basic Identity */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Rahul"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  Last Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Verma"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  Official Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@nexora.in"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Mobile Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Work Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Hyderabad / Remote"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Job & Hierarchy */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-400">
              Department & Reporting Hierarchy
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  Department <span className="text-rose-400">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  Designation <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Role Level</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="EMPLOYEE">Employee (Individual Contributor)</option>
                  <option value="TL">Team Lead (TL)</option>
                  <option value="MAIN_TL">Main Team Lead (Root Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  Reports To (Manager / TL)
                </label>
                <select
                  name="reportingToId"
                  value={formData.reportingToId}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="">None (Top-Level Root)</option>
                  {availableManagers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.id}) &bull; {mgr.designation || mgr.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Work Mode</label>
                <select
                  name="workMode"
                  value={formData.workMode}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Employment Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Experience & Skills */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
              Experience & Skills
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-white/70">
                  Total Experience (Years)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="40"
                  name="totalExperienceYears"
                  value={formData.totalExperienceYears}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-white/40">
                  Set to 0 for Fresher, or enter total prior industry experience.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-white/70">
                  Previous Companies (comma separated)
                </label>
                <input
                  type="text"
                  name="previousCompanies"
                  value={formData.previousCompanies}
                  onChange={handleChange}
                  placeholder="e.g. Infosys, Wipro, TCS (leave empty if Fresher)"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-white/70">
                  Key Skills & Competencies (comma separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, TypeScript, Tailwind, System Design"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50"
          >
            <Icon name="check" className="h-4 w-4" />
            <span>{isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Employee"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
