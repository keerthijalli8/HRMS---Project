import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { formatDate } from '../../utils/format.js';

export const DeleteHolidayConfirmModal = ({
  holiday,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !holiday) return null;

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-sm w-full !p-5 border border-line shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2.5 text-bad">
          <Icon name="alert-triangle" className="w-5 h-5 text-bad" />
          <div className="font-display font-bold text-ink text-base">
            Delete Holiday Record?
          </div>
        </div>

        <p className="text-xs text-muted mt-2 leading-relaxed">
          Are you sure you want to delete <strong className="text-ink">{holiday.name}</strong> scheduled on <strong className="text-accent font-num">{formatDate(holiday.date)}</strong>?
        </p>

        <p className="text-[11px] text-muted mt-1">
          This holiday will be removed from future leave deduction exemptions and corporate calendars.
        </p>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(holiday.id)}
            className="px-4 py-1.5 rounded-[var(--radius)] bg-bad text-white text-xs font-semibold hover:brightness-110 active:scale-[0.98] transition flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="trash-2" className="w-3.5 h-3.5 text-white" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
