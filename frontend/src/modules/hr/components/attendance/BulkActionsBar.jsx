import React from 'react';
import { Icon } from '../Icon.jsx';

export const BulkActionsBar = ({
  selectedCount = 0,
  onClearSelection,
  onMarkPresent,
  onMarkAbsent,
  onSendReminder,
  onExportSelected
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="p-3 rounded-2xl bg-gradient-to-r from-[#061e29] to-[#071a24] border border-accent/40 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-bold text-ink">
          {selectedCount} employee{selectedCount > 1 ? "s" : ""} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-muted hover:text-ink text-[11px] underline ml-1 cursor-pointer"
        >
          Deselect all
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onMarkPresent}
          className="px-3 py-1.5 rounded-xl bg-good/20 text-good border border-good/40 hover:bg-good/30 font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Icon name="check" className="w-3.5 h-3.5 text-good" />
          <span>Mark Present</span>
        </button>

        <button
          type="button"
          onClick={onMarkAbsent}
          className="px-3 py-1.5 rounded-xl bg-bad/20 text-bad border border-bad/40 hover:bg-bad/30 font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Icon name="x" className="w-3.5 h-3.5 text-bad" />
          <span>Mark Absent</span>
        </button>

        <button
          type="button"
          onClick={onSendReminder}
          className="px-3 py-1.5 rounded-xl bg-warn/20 text-warn border border-warn/40 hover:bg-warn/30 font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Icon name="bell" className="w-3.5 h-3.5 text-warn" />
          <span>Send Reminder</span>
        </button>

        <button
          type="button"
          onClick={onExportSelected}
          className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Icon name="download" className="w-3.5 h-3.5 text-accent" />
          <span>Export Selected</span>
        </button>
      </div>
    </div>
  );
};
