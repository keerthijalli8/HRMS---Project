import React from 'react';
import { Icon } from '../Icon.jsx';

export const MeetingCard = ({
  meeting,
  currentUser,
  onView,
  onEdit,
  onReschedule,
  onCancel,
  onRespond,
  canManage = false
}) => {
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

  const userEmpId = currentUser?.employeeId || currentUser?.id || "";
  const isOrganizer = organizerId === userEmpId || canManage;

  // Participant current user RSVP response
  const myParticipantRecord = participants.find(p => p.employeeId === userEmpId);
  const myResponse = myParticipantRecord?.response || "pending";

  // Participant response metrics
  const acceptedCount = participants.filter(p => p.response === "accepted").length;
  const maybeCount = participants.filter(p => p.response === "maybe").length;
  const declinedCount = participants.filter(p => p.response === "declined").length;
  const pendingCount = participants.filter(p => !p.response || p.response === "pending").length;

  const getStatusBadge = () => {
    switch (status) {
      case "Today":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse";
      case "Upcoming":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "Completed":
        return "bg-surface2 text-muted border-line";
      case "Cancelled":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-surface2 text-muted border-line";
    }
  };

  const handleJoinCall = (e) => {
    e.stopPropagation();
    if (meetingLink) {
      window.open(meetingLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={() => onView?.(meeting)}
      className="glass-card !p-4 sm:!p-5 border border-line rounded-2xl hover:border-accent/40 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group relative select-none"
    >
      {/* Top Meta Strip: Status, Type, Date/Time */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge()}`}>
            {status === "Today" ? "● Today's Meeting" : status}
          </span>

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface2 border border-line text-ink flex items-center gap-1">
            <Icon name={meetingType === "Online" ? "video" : "map-pin"} className="w-3 h-3 text-accent" />
            <span>{meetingType}</span>
          </span>

          {departments.length > 0 && (
            <span className="text-[10.5px] text-muted px-2 py-0.5 rounded-full bg-surface2/40 border border-line">
              {departments.join(", ")}
            </span>
          )}
        </div>

        {/* Date & Time pill */}
        <div className="flex items-center gap-1 text-[11px] font-num font-bold text-accent px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20">
          <Icon name="calendar" className="w-3 h-3 text-accent" />
          <span>{meetingDate}</span>
          <span className="text-muted font-normal">·</span>
          <span>{startTime} - {endTime}</span>
        </div>
      </div>

      {/* Main Content: Title, Description, Location/Link */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display font-bold text-ink text-base sm:text-lg group-hover:text-accent transition-colors leading-snug">
          {title}
        </h3>

        {description && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Cancellation Notice if cancelled */}
        {status === "Cancelled" && cancellationReason && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-1.5 mt-1">
            <Icon name="alert-triangle" className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span><strong>Cancellation note:</strong> {cancellationReason}</span>
          </div>
        )}

        {/* Location or Meeting Link preview */}
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted">
          {meetingType === "Online" ? (
            <div className="flex items-center gap-1.5 text-accent font-mono text-[11px]">
              <Icon name="video" className="w-3.5 h-3.5 text-accent" />
              <span className="truncate max-w-[240px]">{meetingLink || "Online meeting link configured"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-ink">
              <Icon name="map-pin" className="w-3.5 h-3.5 text-accent" />
              <span>{location || "Conference Room"}</span>
            </div>
          )}

          {attachments.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Icon name="paperclip" className="w-3 h-3 text-muted" />
              <span>{attachments.length} agenda document</span>
            </span>
          )}
        </div>
      </div>

      {/* Attendance & Participant Response Row */}
      <div className="p-2.5 rounded-xl bg-surface2/40 border border-line flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Organizer + Participant Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold text-[10px] flex items-center justify-center">
              {organizerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="text-[11px]">
              <span className="text-muted">Host: </span>
              <strong className="text-ink font-semibold">{organizerName}</strong>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-line/60" aria-hidden="true" />

          {/* Response summary pills */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 font-num font-semibold border border-emerald-500/25" title="Accepted">
              {acceptedCount} accepted
            </span>
            {maybeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 font-num font-semibold border border-amber-500/25" title="Maybe">
                {maybeCount} maybe
              </span>
            )}
            {declinedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-300 font-num font-semibold border border-rose-500/25" title="Declined">
                {declinedCount} declined
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-surface2 text-muted font-num" title="Awaiting response">
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Employee RSVP Controls (if invited or relevant) */}
        {status !== "Cancelled" && status !== "Completed" && (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10.5px] text-muted">RSVP:</span>
            <button
              type="button"
              onClick={() => onRespond?.(id, "accepted")}
              title="Accept Invitation"
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                myResponse === "accepted"
                  ? "bg-emerald-500 text-white shadow-sm font-bold"
                  : "bg-surface2 border border-line text-muted hover:text-emerald-400 hover:border-emerald-500/30"
              }`}
            >
              <Icon name="check" className="w-3 h-3 text-inherit" />
              <span>Accept</span>
            </button>

            <button
              type="button"
              onClick={() => onRespond?.(id, "maybe")}
              title="Maybe / Tentative"
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                myResponse === "maybe"
                  ? "bg-amber-500 text-white shadow-sm font-bold"
                  : "bg-surface2 border border-line text-muted hover:text-amber-300 hover:border-amber-500/30"
              }`}
            >
              Maybe
            </button>

            <button
              type="button"
              onClick={() => onRespond?.(id, "declined")}
              title="Decline Invitation"
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                myResponse === "declined"
                  ? "bg-rose-500 text-white shadow-sm font-bold"
                  : "bg-surface2 border border-line text-muted hover:text-rose-400 hover:border-rose-500/30"
              }`}
            >
              <Icon name="x" className="w-3 h-3 text-inherit" />
              <span>Decline</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls: Join Call + Organizer Management Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/60 text-xs">
        <div>
          {meetingType === "Online" && meetingLink && status !== "Cancelled" && (
            <button
              type="button"
              onClick={handleJoinCall}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition cursor-pointer"
            >
              <Icon name="video" className="w-3.5 h-3.5 text-white" />
              <span>Join Google Meet</span>
              <Icon name="external-link" className="w-3 h-3 text-white/80" />
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView?.(meeting)}
            className="px-2.5 py-1 rounded-xl bg-surface2/60 border border-line text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent transition flex items-center gap-1 shadow-sm"
          >
            <span>Details</span>
            <Icon name="arrow-right" className="w-3 h-3 text-inherit" />
          </button>

          {isOrganizer && status !== "Cancelled" && (
            <>
              <button
                type="button"
                onClick={() => onReschedule?.(meeting)}
                title="Reschedule meeting date or time"
                className="px-2 py-1 rounded-xl bg-surface2/60 border border-line text-xs font-semibold text-ink hover:text-accent transition flex items-center gap-1"
              >
                <Icon name="clock" className="w-3 h-3 text-accent" />
                <span>Reschedule</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit?.(meeting)}
                title="Edit meeting"
                className="p-1.5 rounded-xl hover:bg-surface2 text-muted hover:text-accent transition"
              >
                <Icon name="edit" className="w-3.5 h-3.5 text-inherit" />
              </button>

              <button
                type="button"
                onClick={() => onCancel?.(meeting)}
                title="Cancel meeting"
                className="p-1.5 rounded-xl hover:bg-rose-500/20 text-muted hover:text-rose-400 transition"
              >
                <Icon name="x" className="w-3.5 h-3.5 text-inherit" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;
