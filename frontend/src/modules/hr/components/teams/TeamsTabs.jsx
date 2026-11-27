import React from 'react';
import { Icon } from '../Icon.jsx';

export const TeamsTabs = ({ activeTab, onTabChange, onChangeTab }) => {
  const handleChange = onTabChange || onChangeTab || (() => {});
  return (
    <div
      role="tablist"
      aria-label="Teams module tabs"
      className="inline-flex items-center p-1 bg-surface2/60 border border-line rounded-2xl shadow-sm"
    >
      <button
        role="tab"
        id="teams-tab-employees"
        aria-selected={activeTab === "employees"}
        aria-controls="teams-tabpanel-employees"
        type="button"
        onClick={() => handleChange("employees")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
          activeTab === "employees"
            ? "bg-accent text-on-accent shadow-md"
            : "text-muted hover:text-ink hover:bg-surface2/50"
        }`}
      >
        <Icon
          name="users"
          className={`w-4 h-4 ${activeTab === "employees" ? "text-on-accent" : "text-muted"}`}
        />
        <span>Employee Management</span>
      </button>

      <button
        role="tab"
        id="teams-tab-my-team"
        aria-selected={activeTab === "my-team"}
        aria-controls="teams-tabpanel-my-team"
        type="button"
        onClick={() => handleChange("my-team")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
          activeTab === "my-team"
            ? "bg-accent text-on-accent shadow-md"
            : "text-muted hover:text-ink hover:bg-surface2/50"
        }`}
      >
        <Icon
          name="user-check"
          className={`w-4 h-4 ${activeTab === "my-team" ? "text-on-accent" : "text-muted"}`}
        />
        <span>My Team</span>
      </button>
    </div>
  );
};

export default TeamsTabs;
