import React from 'react';
import { Icon } from '../Icon.jsx';
import { formatNumber } from '../../utils/format.js';

export const DepartmentTabs = ({
  activeTab,
  onTabChange,
  pendingRequestsCount = 0
}) => {
  const tabs = [
    { id: "daily", label: "Daily", icon: "clock" },
    { id: "monthly", label: "Monthly Matrix", icon: "grid" },
    {
      id: "requests",
      label: "Requests",
      icon: "file-text",
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null
    },
    { id: "insights", label: "Insights", icon: "sparkles" }
  ];

  return (
    <div className="flex items-center justify-between bg-surface2/30 p-1.5 rounded-2xl border border-line shadow-sm">
      <div
        role="tablist"
        aria-label="Department Attendance Subtabs"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`dept-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`dept-tabpanel-${tab.id}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2/50"
              }`}
            >
              <Icon
                name={tab.icon}
                className={`w-3.5 h-3.5 ${isActive ? "text-on-accent" : "text-muted"}`}
              />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? "bg-white/20 text-on-accent"
                      : "bg-accent text-on-accent"
                  }`}
                >
                  {formatNumber(tab.badge)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
