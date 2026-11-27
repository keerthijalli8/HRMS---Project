import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';

export const AnnouncementDetailModal = ({
  isOpen,
  onClose,
  announcement,
  onEdit,
  onDelete,
  onPublishNow,
  onReschedule,
  canManage = false
}) => {
  if (!isOpen || !announcement) return null;

  const {
    id,
    title,
    category = "General",
    description = "",
    priority = "Medium",
    targetAudience = "All Employees",
    targetDepartments = [],
    targetEmployeeIds = [],
    status = "Published",
    publishDate,
    publishTime,
    expiryDate,
    attachments = [],
    authorName = "HR Desk",
    authorRole = "Operations"
  } = announcement;

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(publishDate || "");
  const [rescheduleTime, setRescheduleTime] = useState(publishTime || "09:00");

  const handleConfirmReschedule = () => {
    if (!rescheduleDate) return;
    onReschedule?.(announcement, rescheduleDate, rescheduleTime);
    setRescheduleOpen(false);
    onClose();
  };

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-2xl max-h-[90vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 rounded-3xl bg-[#0d1622]/95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/25 to-accent2/25 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg shadow-md">
              <Icon name="megaphone" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-accent/15 text-accent border-accent/30">
                  {category}
                </span>
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border bg-surface2 text-muted border-line">
                  {priority} Priority
                </span>
                {canManage && (
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border bg-surface2 text-ink border-line">
                    {status}
                  </span>
                )}
                <span className="text-[11px] font-mono text-muted">{id}</span>
              </div>
              <h2 className="font-display font-bold text-ink text-base sm:text-lg leading-tight mt-1">
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink transition cursor-pointer"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs flex flex-col gap-4">
          
          {/* Metadata Row: Published Time, Author, Target Audience */}
          <div className="p-3.5 rounded-2xl bg-surface2/40 border border-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10.5px] text-muted uppercase font-semibold block">Broadcast Timing</span>
              <div className="font-num font-bold text-ink mt-0.5 flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5 text-accent" />
                <span>{publishDate || "Immediate"} {publishTime ? `· ${publishTime} IST` : ""}</span>
                {expiryDate && <span className="text-muted font-normal"> (Expires {expiryDate})</span>}
              </div>
            </div>

            <div>
              <span className="text-[10.5px] text-muted uppercase font-semibold block">Author & Desk</span>
              <div className="font-semibold text-ink mt-0.5">
                {authorName} <span className="text-muted font-normal">({authorRole})</span>
              </div>
            </div>

            <div>
              <span className="text-[10.5px] text-muted uppercase font-semibold block">Audience Target</span>
              <div className="font-semibold text-accent mt-0.5">
                {targetAudience}
                {targetDepartments.length > 0 && ` (${targetDepartments.join(", ")})`}
                {targetEmployeeIds.length > 0 && ` (${targetEmployeeIds.length} employees)`}
              </div>
            </div>
          </div>

          {/* Description Content */}
          <div className="p-4 rounded-2xl bg-surface2/30 border border-line">
            <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Announcement Content</h4>
            <div className="text-ink text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-2">
              <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider">Attached Circular Documents</h4>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface2 border border-line text-ink hover:border-accent transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="file-text" className="w-4 h-4 text-accent" />
                      <span className="font-semibold">{file.name}</span>
                      <span className="text-[10px] text-muted font-num font-bold">({file.size})</span>
                    </div>
                    <Icon name="download" className="w-3.5 h-3.5 text-accent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Reschedule Prompt */}
          {rescheduleOpen && (
            <div className="p-3.5 rounded-2xl bg-surface2/60 border border-accent/40 flex flex-col gap-2">
              <span className="font-semibold text-ink text-xs">Reschedule Announcement Publication:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-ink text-xs outline-none"
                />
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-ink text-xs outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(false)}
                  className="px-3 py-1 rounded-xl bg-surface2 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="px-3.5 py-1 rounded-xl bg-accent text-on-accent font-bold text-xs hover:opacity-95 cursor-pointer"
                >
                  Save Reschedule
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-between gap-3 bg-surface/80">
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                {(status === "Draft" || status === "Scheduled") && (
                  <button
                    type="button"
                    onClick={() => { onPublishNow?.(id); onClose(); }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition cursor-pointer"
                  >
                    <Icon name="check" className="w-3.5 h-3.5 text-white" />
                    <span>Publish Now</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setRescheduleOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:text-accent transition cursor-pointer flex items-center gap-1"
                >
                  <Icon name="clock" className="w-3.5 h-3.5 text-accent" />
                  <span>Reschedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onClose(); onEdit?.(announcement); }}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:text-accent transition cursor-pointer flex items-center gap-1"
                >
                  <Icon name="edit" className="w-3.5 h-3.5 text-accent" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onDelete?.(id); onClose(); }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Icon name="trash-2" className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:bg-surface2/80 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AnnouncementDetailModal;
