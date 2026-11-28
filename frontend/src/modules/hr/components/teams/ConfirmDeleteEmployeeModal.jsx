
import React from 'react';
import { Icon } from '../Icon.jsx';

export const ConfirmDeleteEmployeeModal = ({
  isOpen,
  employee,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-employee-title"
        className="glass-card max-w-md w-full !p-6 border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-bad/15 border border-bad/30 flex items-center justify-center text-bad shrink-0">
            <Icon name="alert-triangle" className="w-5 h-5 text-bad" />
          </div>
          <div>
            <h3 id="delete-employee-title" className="font-display font-bold text-lg text-ink">
              Delete Employee Record
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Permanently remove this employee profile from active enterprise rosters.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface2/60 border border-line/70 mb-5 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted">Employee:</span>
            <span className="font-semibold text-ink">{employee.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Employee ID:</span>
            <span className="font-num font-bold text-accent">{employee.id || employee.employeeId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Department:</span>
            <span className="text-ink">{employee.dept || employee.department}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Designation:</span>
            <span className="text-ink">{employee.designation || employee.role}</span>
          </div>
        </div>

        <p className="text-[11.5px] text-muted mb-5 leading-relaxed">
          This action will immediately delete the employee's records and re-route their direct reports to the department lead. This event will be recorded in the in-app audit log for compliance.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-xl bg-surface2/80 hover:bg-surface2 text-xs font-semibold text-muted hover:text-ink transition cursor-pointer border border-line"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-bad hover:brightness-110 text-xs font-bold text-white transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="trash-2" className="w-3.5 h-3.5 text-white" />
            <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
