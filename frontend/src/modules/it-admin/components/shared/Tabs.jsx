import React from 'react';

// Tabs/filters: pill, 1px line border, 12px muted; selected = accent bg + on-accent text.
export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap items-center gap-1.5 p-1 bg-surface2/30 rounded-full border border-line ${className}`}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-pressed={isSelected}
            onClick={() => onChange(tab.id)}
            style={{
              backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
              color: isSelected ? 'var(--on-accent)' : 'var(--muted)',
              borderRadius: '9999px',
            }}
            className={`px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer select-none focus-visible:outline-accent ${
              isSelected ? 'font-semibold' : 'hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  backgroundColor: isSelected ? 'var(--on-accent)' : 'var(--surface2)',
                  color: isSelected ? 'var(--accent)' : 'var(--muted)',
                }}
                className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10.5px] tabular-nums"
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
