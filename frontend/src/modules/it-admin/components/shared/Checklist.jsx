import React from 'react';

// Checklist: native checkbox with accent-color var(--accent); done items muted + line-through (used in onboarding / offboarding checklist).
export function Checklist({ items = [], onToggle, className = '' }) {
  return (
    <ul className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((item, index) => (
        <li
          key={item.id || index}
          className="flex items-start gap-2.5 text-[13px] leading-snug cursor-pointer select-none"
          onClick={() => onToggle && onToggle(item.id || index)}
        >
          <input
            type="checkbox"
            checked={!!item.done}
            onChange={() => onToggle && onToggle(item.id || index)}
            style={{ accentColor: 'var(--accent)' }}
            className="mt-0.5 w-4 h-4 rounded cursor-pointer shrink-0"
            aria-label={item.label}
          />
          <span
            className={`${
              item.done ? 'line-through text-muted opacity-75' : 'text-ink font-normal'
            }`}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
