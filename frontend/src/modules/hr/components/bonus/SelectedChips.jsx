import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';

/**
 * Collapsible Selected Employee Chips Bar with removal and quick clear.
 */
export const SelectedChips = ({
  selectedEmployees = [],
  onRemove,
  onClearAll,
  maxVisible = 6
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedEmployees || selectedEmployees.length === 0) {
    return null;
  }

  const visibleList = isExpanded ? selectedEmployees : selectedEmployees.slice(0, maxVisible);
  const remainingCount = selectedEmployees.length - maxVisible;

  return (
    <div className="p-3 rounded-2xl bg-surface2/50 border border-line flex flex-col gap-2.5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-ink">
            Selected Recipients ({selectedEmployees.length})
          </span>
          <span className="text-[11px] text-muted">
            Click &times; to deselect individual employees
          </span>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-bad hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Icon name="x-circle" className="w-3.5 h-3.5" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {visibleList.map(emp => {
          const initials = emp.name
            ? emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : "EM";

          return (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-accent/30 text-ink text-xs shadow-sm hover:border-accent transition group"
            >
              <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-[9px] font-bold flex items-center justify-center">
                {initials}
              </span>
              <span className="font-semibold">{emp.name}</span>
              <span className="text-[10px] text-muted font-num">({emp.id})</span>
              <button
                type="button"
                onClick={() => onRemove(emp.id)}
                title={`Remove ${emp.name}`}
                aria-label={`Remove ${emp.name}`}
                className="w-3.5 h-3.5 rounded-full hover:bg-rose-500/20 text-muted hover:text-bad flex items-center justify-center transition cursor-pointer ml-0.5"
              >
                &times;
              </button>
            </span>
          );
        })}

        {remainingCount > 0 && !isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-2.5 py-1 rounded-xl bg-accent/15 border border-accent/40 text-accent font-bold text-xs hover:bg-accent/25 transition cursor-pointer"
          >
            +{remainingCount} more &darr;
          </button>
        )}

        {isExpanded && selectedEmployees.length > maxVisible && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="px-2.5 py-1 rounded-xl bg-surface2 border border-line text-muted font-bold text-xs hover:text-ink transition cursor-pointer"
          >
            Show less &uarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectedChips;
