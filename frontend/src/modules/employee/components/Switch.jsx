// src/components/Switch.jsx
// Accessible toggle switch component adhering to WAI-ARIA role="switch".

import React from 'react';

export function Switch({ checked, onChange, label, disabled = false, id, className = '' }) {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none ${
          checked ? 'bg-accent' : 'bg-surface2 border border-line'
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full bg-on-accent transition-transform duration-200 shadow-sm ${
            checked ? 'translate-x-5' : 'translate-x-0 bg-muted'
          }`}
        />
      </button>
      {label && (
        <label
          htmlFor={switchId}
          onClick={() => !disabled && onChange(!checked)}
          className="text-[13px] text-ink select-none cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Switch;

