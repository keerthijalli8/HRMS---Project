import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../Icon.jsx';
import { applyLeave, getSpecificLeaveTypeBalance } from '../../services/leaveService.js';
import { CANONICAL_EMPLOYEES_12, getTodayIST } from '../../data/mockDb.js';

export const ApplyLeaveModal = ({
  isOpen,
  onClose,
  currentUser,
  onTriggerToast
}) => {
  const today = getTodayIST();
  const empId = currentUser?.employeeId || currentUser?.id || "EMP-1234";
  const userDept = (currentUser?.dept || currentUser?.department || "").trim();

  // Filter colleagues from the SAME department, excluding the applicant themselves
  const departmentColleagues = useMemo(() => {
    const cleanName = (currentUser?.name || "").trim().toLowerCase();
    const cleanId = empId.trim().toLowerCase();

    const sameDept = CANONICAL_EMPLOYEES_12.filter(e => {
      const isSelf =
        (e.id || "").toLowerCase() === cleanId ||
        (e.name || "").trim().toLowerCase() === cleanName;
      if (isSelf) return false;

      if (!userDept) return true;
      return (e.dept || "").trim().toLowerCase() === userDept.toLowerCase();
    });

    if (sameDept.length > 0) return sameDept;
    return CANONICAL_EMPLOYEES_12.filter(
      e =>
        (e.id || "").toLowerCase() !== cleanId &&
        (e.name || "").trim().toLowerCase() !== cleanName
    );
  }, [empId, currentUser?.name, userDept]);

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (departmentColleagues.length > 0) {
      const stillValid = departmentColleagues.some(c => c.name === handoverTo);
      if (!stillValid) {
        setHandoverTo(departmentColleagues[0].name);
      }
    } else {
      setHandoverTo("");
    }
  }, [departmentColleagues, handoverTo]);

  const currentBalance = useMemo(() => {
    return getSpecificLeaveTypeBalance(empId, leaveType);
  }, [empId, leaveType]);

  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    if (isHalfDay) return 0.5;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(diffDays, 1);
    } catch {
      return 1;
    }
  }, [startDate, endDate, isHalfDay]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!startDate) {
      setError("Please select a valid start date.");
      return;
    }
    if (!isHalfDay && endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }
    if (leaveType !== "Optional Holiday" && calculatedDays > currentBalance) {
      setError(`Insufficient ${leaveType} balance (${currentBalance} days available).`);
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please describe the reason for your leave (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = applyLeave({
        employeeId: empId,
        employeeName: currentUser?.name || "Employee",
        department: userDept || "Human Resources",
        leaveType,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        daysCount: calculatedDays,
        reason: reason.trim(),
        handoverTo: handoverTo || "Department Lead",
        priority
      }, currentUser);

      setIsSubmitting(false);
      if (res.ok) {
        setReason("");
        setError(null);
        if (onTriggerToast) onTriggerToast(res.message);
        onClose();
      } else {
        setError(res.error || "Failed to submit leave request.");
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-leave-title"
        className="glass-card max-w-lg w-full !p-6 border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-line/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Icon name="calendar" className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 id="apply-leave-title" className="font-display font-bold text-base text-ink">
                Apply for Leave
              </h3>
              <p className="text-[11px] text-muted">
                Enterprise Leave Request & Department Handover
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-bad/15 border border-bad/30 text-bad text-xs flex items-center gap-2">
            <Icon name="alert-triangle" className="w-4 h-4 shrink-0 text-bad" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* Leave Type & Balance Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-muted font-medium mb-1">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full h-[38px] bg-surface2 border border-line rounded-xl px-3 text-ink outline-none focus:border-accent text-xs"
              >
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Sick Leave">Sick / Medical Leave (SL)</option>
                <option value="Earned Leave">Earned Leave (EL)</option>
                <option value="Optional Holiday">Optional Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Available Balance</label>
              <div className="h-[38px] flex items-center justify-between px-3 rounded-xl bg-surface2/60 border border-line">
                <span className="text-muted text-[11px]">{leaveType}:</span>
                <span className="font-num font-bold text-accent text-sm">
                  {currentBalance} Days
                </span>
              </div>
            </div>
          </div>

          {/* Half Day Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface2/40 border border-line/60">
            <div>
              <span className="font-medium text-ink block">Half Day Leave</span>
              <span className="text-[10px] text-muted">Request 0.5 day for morning or post-lunch shift</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => {
                  setIsHalfDay(e.target.checked);
                  if (e.target.checked) setEndDate(startDate);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-muted font-medium mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (isHalfDay || endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full h-[38px] bg-surface2 border border-line rounded-xl px-3 text-ink outline-none focus:border-accent text-xs"
              />
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                disabled={isHalfDay}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-[38px] bg-surface2 border border-line rounded-xl px-3 text-ink outline-none focus:border-accent text-xs disabled:opacity-40"
              />
            </div>
          </div>

          {/* Calculated Total Days */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent font-medium">
            <span>Total Leave Duration:</span>
            <span className="font-num font-bold">
              {calculatedDays} {calculatedDays === 1 ? 'Working Day' : 'Working Days'}
            </span>
          </div>

          {/* Aligned Handover Colleague & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="min-w-0">
              <label
                className="block text-muted font-medium mb-1 truncate"
                title={userDept ? `Handover Colleague (${userDept})` : "Handover Colleague"}
              >
                Handover Colleague{userDept ? ` (${userDept === "Human Resources" ? "HR" : userDept})` : ""}
              </label>
              <select
                value={handoverTo}
                onChange={(e) => setHandoverTo(e.target.value)}
                className="w-full h-[38px] bg-surface2 border border-line rounded-xl pl-3 pr-7 text-ink outline-none focus:border-accent text-xs truncate"
              >
                {departmentColleagues.map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name} — {e.role || e.dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-muted font-medium mb-1 truncate">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-[38px] bg-surface2 border border-line rounded-xl pl-3 pr-7 text-ink outline-none focus:border-accent text-xs"
              >
                <option value="Normal">Normal</option>
                <option value="High">Urgent / High</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-muted font-medium mb-1">
              Reason for Leave <span className="text-bad">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details for your team lead and HR review..."
              className="w-full bg-surface2 border border-line rounded-xl p-3 text-ink outline-none focus:border-accent text-xs resize-none"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold hover:brightness-105 transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="check" className="w-3.5 h-3.5 text-on-accent" />
              <span>{isSubmitting ? "Submitting..." : "Submit Leave Application"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;