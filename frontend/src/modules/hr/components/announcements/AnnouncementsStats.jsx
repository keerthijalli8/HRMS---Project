import React from 'react';
import { Icon } from '../Icon.jsx';
import { formatNumber } from '../../utils/format.js';

export const AnnouncementsStats = ({
  stats,
  activeFilter,
  onFilterClick,
  activeTab = "announcements"
}) => {
  const {
    totalAnnouncements = 0,
    publishedCount = 0,
    scheduledCount = 0,
    draftCount = 0,
    todayMeetingsCount = 0,
    upcomingMeetingsCount = 0,
    pendingMyResponseCount = 0
  } = stats || {};

  const announcementTiles = [
    {
      id: "all_announcements",
      label: "Total Announcements",
      value: totalAnnouncements,
      icon: "megaphone",
      color: "text-accent",
      subtext: "All circulars & notices",
      filterKey: "all"
    },
    {
      id: "published_announcements",
      label: "Active Published",
      value: publishedCount,
      icon: "check-circle",
      color: "text-emerald-400",
      subtext: "Currently live",
      filterKey: "published"
    },
    {
      id: "scheduled_announcements",
      label: "Scheduled",
      value: scheduledCount,
      icon: "clock",
      color: "text-blue-400",
      subtext: "Future publish date",
      filterKey: "scheduled"
    },
    {
      id: "draft_announcements",
      label: "Drafts",
      value: draftCount,
      icon: "file-text",
      color: "text-amber-400",
      subtext: "Unpublished notices",
      filterKey: "draft"
    }
  ];

  const meetingTiles = [
    {
      id: "today_meetings",
      label: "Today's Meetings",
      value: todayMeetingsCount,
      icon: "calendar",
      color: "text-emerald-400",
      subtext: "Happening today",
      filterKey: "today"
    },
    {
      id: "upcoming_meetings",
      label: "Upcoming Meetings",
      value: upcomingMeetingsCount,
      icon: "video",
      color: "text-teal-400",
      subtext: "Scheduled upcoming",
      filterKey: "upcoming"
    },
    {
      id: "pending_rsvps",
      label: "Pending Invites",
      value: pendingMyResponseCount,
      icon: "alert-triangle",
      color: pendingMyResponseCount > 0 ? "text-amber-400" : "text-muted",
      subtext: "Action required",
      filterKey: "pending_rsvp"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 4 Announcement Tiles */}
      {announcementTiles.map((tile) => {
        const isSelected = activeTab === "announcements" && activeFilter === tile.filterKey;
        return (
          <div
            key={tile.id}
            onClick={() => onFilterClick?.("announcements", tile.filterKey)}
            className={`glass-card !p-3.5 border rounded-2xl flex flex-col justify-between gap-2 hover:border-accent/40 transition cursor-pointer select-none ${
              isSelected ? "border-accent bg-accent/10 shadow-md" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{tile.label}</span>
              <Icon name={tile.icon} className={`w-3.5 h-3.5 ${tile.color}`} />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`font-num font-extrabold text-xl sm:text-2xl ${tile.color}`}>
                {formatNumber(tile.value)}
              </span>
              <span className="text-[10px] text-muted truncate">{tile.subtext}</span>
            </div>
          </div>
        );
      })}

      {/* 2 Key Meeting Tiles */}
      {meetingTiles.slice(0, 2).map((tile) => {
        const isSelected = activeTab === "meetings" && activeFilter === tile.filterKey;
        return (
          <div
            key={tile.id}
            onClick={() => onFilterClick?.("meetings", tile.filterKey)}
            className={`glass-card !p-3.5 border rounded-2xl flex flex-col justify-between gap-2 hover:border-accent/40 transition cursor-pointer select-none ${
              isSelected ? "border-accent bg-accent/10 shadow-md" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{tile.label}</span>
              <Icon name={tile.icon} className={`w-3.5 h-3.5 ${tile.color}`} />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`font-num font-extrabold text-xl sm:text-2xl ${tile.color}`}>
                {formatNumber(tile.value)}
              </span>
              <span className="text-[10px] text-muted truncate">{tile.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementsStats;
