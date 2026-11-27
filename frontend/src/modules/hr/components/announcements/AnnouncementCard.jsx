import React from 'react';
import { Icon } from '../Icon.jsx';

export const AnnouncementCard = ({
  announcement,
  onView,
  onEdit,
  onDelete,
  onPublishNow,
  onReschedule,
  canManage = false
}) => {
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

  // Category Badge Styles
  const getCategoryBadge = () => {
    switch (category) {
      case "Holiday":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "Important":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Policy Update":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "HR Update":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "Emergency":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse";
      default:
        return "bg-surface2 text-ink border-line";
    }
  };

  // Priority Pill Styles
  const getPriorityBadge = () => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "High":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Medium":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "Low":
      default:
        return "bg-surface2/60 text-muted border-line";
    }
  };

  // Status Badge Styles
  const getStatusBadge = () => {
    switch (status) {
      case "Published":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Scheduled":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "Draft":
        return "bg-surface2 text-muted border-line";
      case "Expired":
        return "bg-rose-500/10 text-muted border-line";
      default:
        return "bg-surface2 text-muted border-line";
    }
  };

  // Audience Label Formatter
  const getAudienceLabel = () => {
    if (targetAudience === "All Employees") return "All Employees";
    if (targetAudience === "All Departments") return "All Departments";
    if (targetAudience === "Specific Department") {
      if (targetDepartments.length === 0) return "Specific Departments";
      return targetDepartments.length > 2
        ? `${targetDepartments.slice(0, 2).join(", ")} +${targetDepartments.length - 2}`
        : targetDepartments.join(", ");
    }
    if (targetAudience === "Selected Employees") {
      return `${targetEmployeeIds.length} Selected ${targetEmployeeIds.length === 1 ? 'Employee' : 'Employees'}`;
    }
    return targetAudience;
  };

  return (
    <div
      onClick={() => onView?.(announcement)}
      className="glass-card !p-4 sm:!p-5 border border-line rounded-2xl hover:border-accent/40 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group relative select-none"
    >
      {/* Top Meta Strip: Category, Priority, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadge()}`}>
            {category}
          </span>
          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge()}`}>
            {priority} Priority
          </span>
          {canManage && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge()}`}>
              {status}
            </span>
          )}
        </div>

        {/* Date / Author info */}
        <div className="text-[11px] text-muted font-num flex items-center gap-1">
          <Icon name="clock" className="w-3 h-3 text-muted" />
          <span>{publishDate || "Today"} {publishTime ? `· ${publishTime}` : ""}</span>
        </div>
      </div>

      {/* Main Announcement Header & Content Preview */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display font-bold text-ink text-base sm:text-lg group-hover:text-accent transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-muted text-xs leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer Info: Target Audience, Attachments, Author & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs">
        {/* Left: Audience + Attachments */}
        <div className="flex flex-wrap items-center gap-2 text-muted">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface2/60 border border-line text-[11px]" title={`Audience: ${getAudienceLabel()}`}>
            <Icon name="users" className="w-3 h-3 text-accent" />
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{getAudienceLabel()}</span>
          </div>

          {attachments.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface2/60 border border-line text-[11px] text-accent font-semibold" title={`${attachments.length} attachment(s)`}>
              <Icon name="paperclip" className="w-3 h-3 text-accent" />
              <span>{attachments.length} {attachments.length === 1 ? 'file' : 'files'}</span>
            </div>
          )}

          {authorName && (
            <span className="text-[11px] text-muted hidden md:inline">
              By <strong className="text-ink font-semibold">{authorName}</strong> ({authorRole})
            </span>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView?.(announcement)}
            className="px-2.5 py-1 rounded-xl bg-surface2/60 border border-line text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent transition flex items-center gap-1 shadow-sm"
          >
            <span>View</span>
            <Icon name="arrow-right" className="w-3 h-3 text-inherit" />
          </button>

          {canManage && (
            <>
              {status === "Scheduled" && (
                <button
                  type="button"
                  onClick={() => onPublishNow?.(id)}
                  title="Publish this announcement immediately"
                  className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition"
                >
                  Publish Now
                </button>
              )}

              {status === "Draft" && (
                <button
                  type="button"
                  onClick={() => onPublishNow?.(id)}
                  title="Publish draft now"
                  className="px-2 py-1 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:opacity-95 transition"
                >
                  Publish
                </button>
              )}

              {status === "Scheduled" && (
                <button
                  type="button"
                  onClick={() => onReschedule?.(announcement)}
                  title="Reschedule announcement publish time"
                  className="p-1.5 rounded-xl hover:bg-surface2 text-muted hover:text-accent transition"
                >
                  <Icon name="clock" className="w-3.5 h-3.5 text-inherit" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onEdit?.(announcement)}
                title="Edit announcement"
                className="p-1.5 rounded-xl hover:bg-surface2 text-muted hover:text-accent transition"
              >
                <Icon name="edit" className="w-3.5 h-3.5 text-inherit" />
              </button>

              <button
                type="button"
                onClick={() => onDelete?.(id)}
                title="Delete announcement"
                className="p-1.5 rounded-xl hover:bg-rose-500/20 text-muted hover:text-rose-400 transition"
              >
                <Icon name="trash-2" className="w-3.5 h-3.5 text-inherit" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;
