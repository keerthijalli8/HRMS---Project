// src/components/Tabs.jsx
// Accessible pill tabs supporting keyboard navigation and Monsoon Glass styling.

import React, { useRef } from 'react';

export function Tabs({ tabs = [], activeTab, onChange, className = '', ariaLabel = 'Navigation Tabs' }) {
  const tabListRef = useRef(null);

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      const next = (index + 1) % tabs.length;
      onChange(tabs[next].id);
      tabListRef.current?.children[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prev = (index - 1 + tabs.length) % tabs.length;
      onChange(tabs[prev].id);
      tabListRef.current?.children[prev]?.focus();
    }
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 p-1 rounded-full bg-surface2/60 border border-line flex-wrap ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-150 select-none ${
              isSelected
                ? 'bg-accent text-on-accent font-semibold shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-on-accent text-accent' : 'bg-line text-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;

