import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { formatDate } from '../../utils/format.js';

export const HolidayDetailModal = ({
  holiday,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isHrOrAdmin
}) => {
  if (!isOpen || !holiday) return null;

  const typeColorClasses = {
    National: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    Festival: "bg-purple-500/15 border-purple-500/40 text-purple-400",
    Regional: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
    Optional: "bg-yellow-500/15 border-yellow-500/40 text-yellow-400",
    Company: "bg-blue-500/15 border-blue-500/40 text-blue-400"
  }[holiday.type] || "bg-accent/15 border-accent/40 text-accent";

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card !p-0 max-w-lg w-full border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface/90 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent text-on-accent flex items-center justify-center font-bold text-xl shadow-md">
              <Icon name="calendar" className="w-6 h-6 text-on-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-ink text-base sm:text-lg">
                  {holiday.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${typeColorClasses}`}>
                  {holiday.type}
                </span>
              </div>
              <div className="text-xs text-muted font-num mt-0.5">
                {holiday.dayOfWeek}, {formatDate(holiday.date)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-surface2 border border-line text-muted hover:text-ink transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5 text-xs flex flex-col gap-4">
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface2/40 border border-line">
            <div>
              <span className="text-muted block text-[10.5px] uppercase font-semibold">Category</span>
              <span className="font-semibold text-ink text-xs mt-0.5 block">{holiday.category}</span>
            </div>
            <div>
              <span className="text-muted block text-[10.5px] uppercase font-semibold">Applicable State / Location</span>
              <span className="font-semibold text-accent text-xs mt-0.5 block font-data">{holiday.location}</span>
            </div>
            <div>
              <span className="text-muted block text-[10.5px] uppercase font-semibold">Optional Holiday</span>
              <span className={`font-semibold text-xs mt-0.5 block ${holiday.isOptional ? 'text-warn' : 'text-good'}`}>
                {holiday.isOptional ? "Yes (Optional Quota)" : "No (Mandatory Company Off)"}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[10.5px] uppercase font-semibold">Annual Recurrence</span>
              <span className="font-semibold text-ink text-xs mt-0.5 block">
                {holiday.repeatAnnually ? "Repeats Annually (Fixed Date)" : "Configurable Festival Date"}
              </span>
            </div>
          </div>

          {/* Departments */}
          <div>
            <span className="text-muted block text-[10.5px] uppercase font-semibold mb-1">
              Applicable Departments
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(holiday.departments || ["All Departments"]).map((dept, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-lg bg-surface2 border border-line text-ink font-medium text-[11px]">
                  {dept}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-muted block text-[10.5px] uppercase font-semibold mb-1">
              Description & Observance Guidelines
            </span>
            <p className="p-3 rounded-xl bg-surface2/30 border border-line text-muted leading-relaxed text-xs">
              {holiday.description || "Official holiday observed across designated enterprise facilities and client engagements."}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-surface/90">
          <div className="text-[11px] text-muted font-data">
            ID: {holiday.id}
          </div>

          <div className="flex items-center gap-2">
            {isHrOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(holiday);
                  }}
                  className="px-3 py-1.5 rounded-[var(--radius)] bg-surface2 border border-bad/40 text-bad hover:bg-bad/10 text-xs font-semibold transition flex items-center gap-1"
                >
                  <Icon name="trash-2" className="w-3.5 h-3.5 text-bad" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(holiday);
                  }}
                  className="px-3 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-ink hover:border-accent text-xs font-semibold transition flex items-center gap-1"
                >
                  <Icon name="edit" className="w-3.5 h-3.5 text-accent" />
                  <span>Edit</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
