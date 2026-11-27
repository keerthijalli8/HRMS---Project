// src/components/leave/LeaveTabs.jsx
// Filter tab controls: All | Pending | Approved | Rejected.

import React from 'react';

const TAB_ITEMS = ['All', 'Pending', 'Approved', 'Rejected'];

export function LeaveTabs({ activeTab = 'All', onChange, counts = {} }) {
  return (
    <div
      role="tablist"
      aria-label="Filter leave requests by status"
      className="inline-flex items-center gap-1.5 p-1 rounded-full bg-surface2/60 border border-line flex-wrap"
    >
      {TAB_ITEMS.map((tab) => {
        const isSelected = activeTab === tab;
        const count = counts[tab.toLowerCase()];

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-pressed={isSelected}
            onClick={() => onChange(tab)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all select-none ${
              isSelected
                ? 'bg-accent text-on-accent font-semibold shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            <span>{tab}</span>
            {typeof count === 'number' && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-on-accent/20 text-on-accent font-bold' : 'bg-line/50 text-muted'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default LeaveTabs;

