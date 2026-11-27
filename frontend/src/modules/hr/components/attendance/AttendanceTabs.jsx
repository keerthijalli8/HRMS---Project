import React from 'react';
import { Icon } from '../Icon.jsx';

export const AttendanceTabs = ({
  activeTab,
  onTabChange,
  canAccessTeam,
  pendingApprovalsCount = 0
}) => {
  if (!canAccessTeam) return null;

  const tabs = [
    { id: "my", label: "My Attendance", icon: "user" },
    {
      id: "team",
      label: "Team Attendance",
      icon: "users",
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null
    }
  ];

  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight") {
      const next = (index + 1) % tabs.length;
      onTabChange(tabs[next].id);
    } else if (e.key === "ArrowLeft") {
      const prev = (index - 1 + tabs.length) % tabs.length;
      onTabChange(tabs[prev].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Attendance views"
      className="inline-flex items-center p-1 rounded-2xl bg-surface2/80 border border-line backdrop-blur-md shadow-inner gap-1 relative"
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`attendance-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`attendance-tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer select-none ${
              isActive
                ? "bg-accent text-on-accent shadow-md shadow-accent/25 font-bold"
                : "text-muted hover:text-ink hover:bg-surface2/50"
            }`}
          >
            <Icon
              name={tab.icon}
              className={`w-3.5 h-3.5 ${isActive ? "text-on-accent" : "text-muted"}`}
            />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? "bg-black/30 text-white"
                    : "bg-warn text-bg font-bold animate-pulse"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
