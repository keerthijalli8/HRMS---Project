import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';

export const MeetingDetailModal = ({
  isOpen,
  onClose,
  meeting,
  currentUser,
  onRespond,
  onEdit,
  onReschedule,
  onCancel,
  canManage = false
}) => {
  if (!isOpen || !meeting) return null;

  const {
    id,
    title,
    description = "",
    agenda = "",
    meetingType = "Online",
    organizerName = "Organizer",
    organizerId = "",
    organizerRole = "Meeting Host",
    departments = [],
    participants = [],
    meetingDate,
    startTime,
    endTime,
    location,
    meetingLink,
    attachments = [],
    status = "Upcoming",
    cancellationReason = ""
  } = meeting;

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'participants'
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const userEmpId = currentUser?.employeeId || currentUser?.id || "";
  const isOrganizer = organizerId === userEmpId || canManage;

  const myParticipant = participants.find(p => p.employeeId === userEmpId);
  const myResponse = myParticipant?.response || "pending";

  const accepted = participants.filter(p => p.response === "accepted");
  const maybe = participants.filter(p => p.response === "maybe");
  const declined = participants.filter(p => p.response === "declined");
  const pending = participants.filter(p => !p.response || p.response === "pending");

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return;
    onCancel?.(meeting, cancelReason);
    setCancelPromptOpen(false);
    onClose();
  };

  const handleJoinCall = () => {
    if (meetingLink) {
      window.open(meetingLink, "_blank", "noopener,noreferrer");
    }
  };

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-2xl max-h-[90vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 rounded-3xl bg-[#0d1622]/95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md ${
              status === "Today" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse" :
              status === "Cancelled" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
              "bg-teal-500/20 text-teal-400 border border-teal-500/30"
            }`}>
              <Icon name={meetingType === "Online" ? "video" : "calendar"} className="w-5 h-5 text-inherit" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  status === "Today" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                  status === "Cancelled" ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
                  status === "Completed" ? "bg-surface2 text-muted border-line" :
                  "bg-teal-500/15 text-teal-300 border-teal-500/30"
                }`}>
                  {status}
                </span>
                <span className="text-[11px] font-mono text-muted">{id}</span>
              </div>
              <h2 className="font-display font-bold text-ink text-base sm:text-lg leading-tight mt-0.5">
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-line/60 bg-surface2/30">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "overview" ? "border-accent text-accent font-bold" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Overview & Agenda
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("participants")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "participants" ? "border-accent text-accent font-bold" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>Participants & RSVP</span>
            <span className="px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-num font-bold text-[10px]">
              {participants.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs flex flex-col gap-4">
          
          {/* TAB 1: OVERVIEW & AGENDA */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4">
              {/* Timing & Venue banner */}
              <div className="p-3.5 rounded-2xl bg-surface2/40 border border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-muted font-semibold block">Date & Time</span>
                  <div className="font-num font-bold text-ink text-sm mt-0.5 flex items-center gap-1.5">
                    <Icon name="calendar" className="w-4 h-4 text-accent" />
                    <span>{meetingDate}</span>
                    <span className="text-muted">·</span>
                    <span className="text-accent">{startTime} - {endTime} IST</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-muted font-semibold block">
                    {meetingType === "Online" ? "Meeting Platform" : "Physical Location"}
                  </span>
                  <div className="font-semibold text-ink text-xs mt-0.5 flex items-center gap-1.5">
                    <Icon name={meetingType === "Online" ? "video" : "map-pin"} className="w-4 h-4 text-accent" />
                    <span className="truncate">{meetingType === "Online" ? "Google Meet Video Conference" : location}</span>
                  </div>
                </div>
              </div>

              {/* Online Join Action Button */}
              {meetingType === "Online" && meetingLink && status !== "Cancelled" && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-transparent border border-teal-500/30 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <div className="font-semibold text-ink text-xs">Video Call Link Ready</div>
                    <div className="text-[11px] text-muted font-mono truncate">{meetingLink}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleJoinCall}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition cursor-pointer shrink-0"
                  >
                    <Icon name="video" className="w-4 h-4 text-white" />
                    <span>Join Meeting</span>
                    <Icon name="external-link" className="w-3 h-3 text-white/80" />
                  </button>
                </div>
              )}

              {/* Cancellation Banner */}
              {status === "Cancelled" && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <Icon name="alert-triangle" className="w-4 h-4 text-rose-400" />
                    <span>This meeting was cancelled</span>
                  </div>
                  {cancellationReason && (
                    <div className="text-xs text-rose-200 mt-1 pl-5">
                      <strong>Reason:</strong> {cancellationReason}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {description && (
                <div>
                  <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Purpose & Description</h4>
                  <p className="text-ink text-xs leading-relaxed whitespace-pre-wrap bg-surface2/30 p-3 rounded-xl border border-line">
                    {description}
                  </p>
                </div>
              )}

              {/* Agenda */}
              {agenda && (
                <div>
                  <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Structured Agenda</h4>
                  <pre className="text-ink text-xs leading-relaxed font-sans whitespace-pre-wrap bg-surface2/30 p-3 rounded-xl border border-line">
                    {agenda}
                  </pre>
                </div>
              )}

              {/* Host & Departments */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface2/40 border border-line">
                <div className="flex items-center gap-2">
                  <span className="text-muted">Host / Organizer:</span>
                  <strong className="text-ink font-semibold">{organizerName}</strong>
                  <span className="text-muted">({organizerRole})</span>
                </div>
                {departments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted">Target Dept:</span>
                    <span className="font-semibold text-accent">{departments.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">Meeting Attachments</h4>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-surface2 border border-line">
                        <Icon name="file-text" className="w-4 h-4 text-accent" />
                        <span className="font-semibold text-ink">{file.name}</span>
                        <span className="text-[10px] text-muted font-num">({file.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PARTICIPANTS & RSVP */}
          {activeTab === "participants" && (
            <div className="flex flex-col gap-4">
              {/* Response Summary Bar */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-[10.5px] uppercase font-semibold text-emerald-300 block">Accepted</span>
                  <span className="font-num font-bold text-lg text-emerald-400">{accepted.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <span className="text-[10.5px] uppercase font-semibold text-amber-300 block">Maybe</span>
                  <span className="font-num font-bold text-lg text-amber-300">{maybe.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                  <span className="text-[10.5px] uppercase font-semibold text-rose-300 block">Declined</span>
                  <span className="font-num font-bold text-lg text-rose-400">{declined.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface2 border border-line">
                  <span className="text-[10.5px] uppercase font-semibold text-muted block">Pending</span>
                  <span className="font-num font-bold text-lg text-muted">{pending.length}</span>
                </div>
              </div>

              {/* Participant list */}
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                {participants.map(p => {
                  const resp = p.response || "pending";
                  return (
                    <div
                      key={p.employeeId}
                      className="p-2.5 rounded-xl bg-surface2/40 border border-line flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(p.name || "E").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-ink truncate">{p.name}</div>
                          <div className="text-[11px] text-muted truncate">{p.designation} · {p.employeeId}</div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border capitalize shrink-0 ${
                        resp === "accepted" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                        resp === "maybe" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                        resp === "declined" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" :
                        "bg-surface2 text-muted border-line"
                      }`}>
                        {resp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancellation Prompt Modal Section */}
          {cancelPromptOpen && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex flex-col gap-2 mt-2">
              <span className="font-semibold text-rose-300 text-xs">Reason for cancelling this meeting:</span>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Conflict with client release, or milestone accomplished early"
                className="w-full px-3 py-1.5 rounded-xl bg-[#0d1622] border border-rose-500/40 text-xs text-white outline-none"
              />
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setCancelPromptOpen(false)}
                  className="px-3 py-1 rounded-xl bg-surface2 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-3 py-1 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition cursor-pointer"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer: RSVP actions for employee + Organizer options */}
        <div className="p-4 sm:p-5 border-t border-line flex flex-wrap items-center justify-between gap-3 bg-surface/80">
          {/* Left: RSVP Response Buttons */}
          {status !== "Cancelled" && status !== "Completed" ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted">Your Response:</span>
              <button
                type="button"
                onClick={() => onRespond?.(id, "accepted")}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  myResponse === "accepted"
                    ? "bg-emerald-500 text-white shadow-sm font-bold"
                    : "bg-surface2 border border-line text-muted hover:text-emerald-400"
                }`}
              >
                <Icon name="check" className="w-3.5 h-3.5 text-inherit" />
                <span>Accept</span>
              </button>

              <button
                type="button"
                onClick={() => onRespond?.(id, "maybe")}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  myResponse === "maybe"
                    ? "bg-amber-500 text-white shadow-sm font-bold"
                    : "bg-surface2 border border-line text-muted hover:text-amber-300"
                }`}
              >
                Maybe
              </button>

              <button
                type="button"
                onClick={() => onRespond?.(id, "declined")}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  myResponse === "declined"
                    ? "bg-rose-500 text-white shadow-sm font-bold"
                    : "bg-surface2 border border-line text-muted hover:text-rose-400"
                }`}
              >
                <Icon name="x" className="w-3.5 h-3.5 text-inherit" />
                <span>Decline</span>
              </button>
            </div>
          ) : <div />}

          {/* Right: Organizer Management Actions */}
          <div className="flex items-center gap-2">
            {isOrganizer && status !== "Cancelled" && (
              <>
                <button
                  type="button"
                  onClick={() => { onClose(); onReschedule?.(meeting); }}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:text-accent transition cursor-pointer flex items-center gap-1"
                >
                  <Icon name="clock" className="w-3.5 h-3.5 text-accent" />
                  <span>Reschedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onClose(); onEdit?.(meeting); }}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:text-accent transition cursor-pointer flex items-center gap-1"
                >
                  <Icon name="edit" className="w-3.5 h-3.5 text-accent" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCancelPromptOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel Meeting
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:bg-surface2/80 transition cursor-pointer"
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

export default MeetingDetailModal;
