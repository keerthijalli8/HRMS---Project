import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { Select } from '../Select.jsx';
import { formatCurrency } from '../../utils/format.js';
import { loadAllEmployees } from '../../services/teamService.js';
import { 
  LOP_REASONS, 
  LOP_TYPES, 
  calculateEmployeeDailyRate, 
  calculateLopDays, 
  createLopRecord 
} from '../../services/lopService.js';

export const MarkLopForm = ({ currentUser, onTriggerToast, onSuccess, onCancel }) => {
  const allEmployees = useMemo(() => loadAllEmployees(), []);

  // Form State
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Today in YYYY-MM-DD (Asia/Kolkata)
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }, []);

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [lopType, setLopType] = useState("Full Day");
  const [excludeHolidaysPolicy, setExcludeHolidaysPolicy] = useState(true);
  const [manualDaysOverride, setManualDaysOverride] = useState("");
  const [reason, setReason] = useState(LOP_REASONS[0]);
  const [remarks, setRemarks] = useState("");
  const [payrollMonth, setPayrollMonth] = useState("November 2026");
  const [directApprove, setDirectApprove] = useState(false);

  // Mock Attachment State
  const [attachment, setAttachment] = useState(null);
  const [attachmentSize, setAttachmentSize] = useState(null);

  // Errors state
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is HR Manager or Admin
  const userRole = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
  const canDirectApprove = userRole.includes("manager") || userRole.includes("admin") || userRole.includes("lead");

  // Filtered employees for dropdown
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return allEmployees.slice(0, 8);
    const q = employeeSearch.toLowerCase().trim();
    return allEmployees.filter(e => {
      const name = (e.name || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase();
      const id = (e.id || e.employeeId || "").toLowerCase();
      const dept = (e.department || e.dept || "").toLowerCase();
      return name.includes(q) || id.includes(q) || dept.includes(q);
    }).slice(0, 8);
  }, [allEmployees, employeeSearch]);

  // Daily rate for selected employee
  const dailyRate = useMemo(() => {
    if (!selectedEmployee) return 0;
    return calculateEmployeeDailyRate(selectedEmployee);
  }, [selectedEmployee]);

  // Auto-calculated LOP days
  const calculatedDays = useMemo(() => {
    return calculateLopDays(fromDate, toDate, lopType, excludeHolidaysPolicy);
  }, [fromDate, toDate, lopType, excludeHolidaysPolicy]);

  // Effective LOP days (manual override or auto-calculated)
  const effectiveDays = useMemo(() => {
    if (manualDaysOverride !== "" && !isNaN(Number(manualDaysOverride))) {
      return Number(manualDaysOverride);
    }
    return calculatedDays;
  }, [manualDaysOverride, calculatedDays]);

  // Total deduction preview
  const totalDeduction = useMemo(() => {
    return Math.round(effectiveDays * dailyRate);
  }, [effectiveDays, dailyRate]);

  // Handle Mock File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file.name);
      const sizeKb = Math.round(file.size / 1024);
      setAttachmentSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
    }
  };

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmployee) {
      setError("Please search and select an employee.");
      return;
    }

    if (!fromDate || !toDate) {
      setError("Please enter valid From Date and To Date.");
      return;
    }

    if (fromDate > toDate) {
      setError("From Date cannot be later than To Date.");
      return;
    }

    if (effectiveDays <= 0) {
      setError("Calculated LOP Days must be greater than zero. If the selected dates fall on weekends/holidays, adjust the dates or policy.");
      return;
    }

    if (!remarks.trim()) {
      setError("Please provide a note or remarks describing the reason for this manual LOP.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      employeeId: selectedEmployee.id || selectedEmployee.employeeId,
      employeeName: selectedEmployee.name || `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim(),
      department: selectedEmployee.department || selectedEmployee.dept,
      designation: selectedEmployee.designation || selectedEmployee.role,
      fromDate,
      toDate,
      lopType,
      lopDays: effectiveDays,
      excludeHolidaysPolicy,
      dailyRate,
      totalDeduction,
      reason,
      remarks,
      payrollMonth,
      attachment,
      attachmentSize,
      directApprove: canDirectApprove && directApprove
    };

    const res = createLopRecord(payload, currentUser);
    setIsSubmitting(false);

    if (res.ok) {
      onTriggerToast?.(
        res.record.status === "Approved" 
          ? `LOP Created and Approved for ${payload.employeeName}` 
          : `LOP Marked for ${payload.employeeName} (Pending Approval)`
      );
      onSuccess?.(res.record);
    } else {
      setError(res.error || "Failed to create LOP record.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto glass-card !p-6 border border-line flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-line/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <Icon name="alert-triangle" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Mark Loss of Pay (LOP)</h2>
            <p className="text-xs text-muted font-data">
              Record manual unpaid leave for an employee. Not automatically triggered from attendance.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface2/60 border border-line/60 text-muted">
            Creator: <strong className="text-ink">{currentUser?.name || "HR Admin"}</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-bad/15 border border-bad/40 text-bad text-xs flex items-center gap-2.5">
          <Icon name="alert-triangle" className="w-4 h-4 text-bad shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step 1: Employee Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-ink flex items-center justify-between">
            <span>1. Select Employee <span className="text-bad">*</span></span>
            {selectedEmployee && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployee(null);
                  setEmployeeSearch("");
                }}
                className="text-[11px] text-accent hover:underline cursor-pointer"
              >
                Change Employee
              </button>
            )}
          </label>

          {!selectedEmployee ? (
            <div className="relative">
              <div className="relative flex items-center">
                <Icon name="search" className="w-4 h-4 text-muted absolute left-3.5" />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setIsEmployeeDropdownOpen(true);
                  }}
                  onFocus={() => setIsEmployeeDropdownOpen(true)}
                  placeholder="Search by Employee Name, ID (e.g. EMP-1044), or Department..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface/60 border border-line/80 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
                />
              </div>

              {isEmployeeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-surface2 border border-line shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-line/40">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted">No employees found.</div>
                  ) : (
                    filteredEmployees.map(emp => {
                      const empId = emp.id || emp.employeeId;
                      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                      const rate = calculateEmployeeDailyRate(emp);

                      return (
                        <button
                          key={empId}
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsEmployeeDropdownOpen(false);
                            setEmployeeSearch("");
                          }}
                          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-surface/60 transition cursor-pointer text-xs"
                        >
                          <div>
                            <div className="font-bold text-ink">{empName}</div>
                            <div className="text-[11px] text-muted font-data">
                              <span className="font-mono text-accent">{empId}</span> · {emp.department || emp.dept} · {emp.designation || emp.role}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-semibold text-accent font-num">
                              {formatCurrency(rate)} / day
                            </span>
                            <div className="text-[10px] text-muted">Est. Daily Rate</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-surface2/40 border border-accent/40 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-ink text-sm flex items-center gap-2">
                  <span>{selectedEmployee.name}</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded bg-accent/20 text-accent font-data font-mono">
                    {selectedEmployee.id || selectedEmployee.employeeId}
                  </span>
                </div>
                <div className="text-[11.5px] text-muted font-data mt-0.5">
                  {selectedEmployee.department || selectedEmployee.dept} · {selectedEmployee.designation || selectedEmployee.role}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted block">Daily Salary Rate (Basic / 30):</span>
                <span className="text-sm font-num font-extrabold text-good">
                  {formatCurrency(dailyRate)} / day
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Date Range, LOP Type & Holiday Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              From Date <span className="text-bad">*</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setManualDaysOverride("");
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-line/80 text-xs font-semibold text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              To Date <span className="text-bad">*</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setManualDaysOverride("");
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-line/80 text-xs font-semibold text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* LOP Type & Holiday Policy Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              LOP Type <span className="text-bad">*</span>
            </label>
            <Select
              value={lopType}
              onChange={(e) => {
                setLopType(e.target.value);
                setManualDaysOverride("");
              }}
              className="w-full"
            >
              {LOP_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          {/* Exclude Holidays Policy Toggle */}
          <div className="flex flex-col justify-end pt-1">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-surface2/30 border border-line/60 hover:border-line transition">
              <input
                type="checkbox"
                checked={excludeHolidaysPolicy}
                onChange={(e) => {
                  setExcludeHolidaysPolicy(e.target.checked);
                  setManualDaysOverride("");
                }}
                className="w-4 h-4 rounded text-accent bg-surface border-line focus:ring-0 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-ink">Exclude Weekly Offs & Holidays</span>
                <span className="block text-[10px] text-muted font-data">Standard Indian HR Fair Calculation Policy</span>
              </div>
            </label>
          </div>
        </div>

        {/* Live LOP Days & Deduction Calculation Callout */}
        <div className="p-4 rounded-xl bg-surface2/40 border border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bad/15 border border-bad/30 text-bad flex items-center justify-center shrink-0">
              <Icon name="dollar-sign" className="w-5 h-5 text-bad" />
            </div>
            <div>
              <div className="text-xs text-muted">Calculated Working LOP Days:</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-num font-extrabold text-ink">{effectiveDays} Days</span>
                {manualDaysOverride !== "" && (
                  <button
                    type="button"
                    onClick={() => setManualDaysOverride("")}
                    className="text-[10.5px] text-accent hover:underline cursor-pointer"
                  >
                    (Reset to Auto: {calculatedDays}d)
                  </button>
                )}
              </div>
              <div className="text-[11px] text-muted font-data">
                Rate: {formatCurrency(dailyRate)} / day · Policy: {excludeHolidaysPolicy ? "Excludes Holidays" : "All Calendar Days"}
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-line/60 sm:pl-6 w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
            <span className="text-xs text-muted">Estimated Payroll Deduction:</span>
            <div className="text-2xl font-num font-extrabold text-bad">
              {formatCurrency(totalDeduction)}
            </div>
          </div>
        </div>

        {/* Step 3: Reason, Remarks, Payroll Month */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              Reason for LOP <span className="text-bad">*</span>
            </label>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full"
            >
              {LOP_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              Payroll Month <span className="text-bad">*</span>
            </label>
            <Select
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="w-full"
            >
              <option value="November 2026">November 2026 (Active Pay Cycle)</option>
              <option value="December 2026">December 2026</option>
              <option value="October 2026">October 2026 (Prior Adjustment)</option>
              <option value="January 2027">January 2027</option>
            </Select>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="text-xs font-bold text-ink block mb-1.5">
            HR Remarks / Justification <span className="text-bad">*</span>
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Document detailed context, absence records, employee communication, or managerial notes..."
            className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-line/80 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Document Upload (Optional Mock Attachment) */}
        <div>
          <label className="text-xs font-bold text-ink block mb-1.5">
            Attach Document / Proof (Optional)
          </label>
          <div className="p-3 rounded-xl bg-surface/40 border border-dashed border-line flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Icon name="file-text" className="w-5 h-5 text-muted" />
              {attachment ? (
                <div>
                  <span className="font-semibold text-ink">{attachment}</span>
                  <span className="text-[10.5px] text-muted ml-2 font-data">({attachmentSize})</span>
                </div>
              ) : (
                <span className="text-muted">Upload supporting absence report, email trail, or audit memo (PDF, PNG)</span>
              )}
            </div>

            {attachment ? (
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  setAttachmentSize(null);
                }}
                className="text-bad hover:underline text-xs font-semibold cursor-pointer"
              >
                Remove
              </button>
            ) : (
              <label className="cursor-pointer">
                <span className="px-3 py-1.5 rounded-lg bg-surface2/60 border border-line text-xs font-semibold text-ink hover:bg-surface hover:text-accent transition">
                  Browse File
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </label>
            )}
          </div>
        </div>

        {/* Manager/Admin Direct Approval Option */}
        {canDirectApprove && (
          <div className="p-3 rounded-xl bg-good/10 border border-good/30 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="directApproveCheck"
              checked={directApprove}
              onChange={(e) => setDirectApprove(e.target.checked)}
              className="w-4 h-4 rounded text-good bg-surface border-line focus:ring-0 cursor-pointer"
            />
            <label htmlFor="directApproveCheck" className="text-xs cursor-pointer select-none">
              <strong className="text-good font-semibold">Directly Approve Record</strong>
              <span className="text-muted block text-[11px]">
                As an HR Manager / Admin, you can directly approve this LOP for immediate inclusion in Payroll.
              </span>
            </label>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
          {onCancel && (
            <SecondaryButton type="button" onClick={onCancel}>
              Cancel
            </SecondaryButton>
          )}

          <PrimaryButton 
            type="submit" 
            disabled={isSubmitting}
            icon={directApprove ? "check" : "alert-triangle"}
          >
            {isSubmitting 
              ? "Saving..." 
              : (directApprove ? "Create & Approve LOP" : "Submit LOP Record")}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};