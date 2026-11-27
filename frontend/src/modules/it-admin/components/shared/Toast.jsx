import React from 'react';
import { useStore } from '../../context/StoreContext';

/**
 * Toast: ink background, bg-colour text, full pill, bottom-centre, with an Undo link.
 */
export function Toast() {
  const { toast, triggerUndo } = useStore();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
      style={{
        backgroundColor: 'var(--ink)',
        color: 'var(--bg)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <span className="text-[13px] font-medium leading-none">
        {toast.message}
      </span>
      {toast.undoAction && (
        <button
          type="button"
          onClick={triggerUndo}
          className="ml-1 text-[13px] font-bold underline underline-offset-2 hover:opacity-80 focus-visible:outline-bg"
          aria-label="Undo action"
        >
          Undo
        </button>
      )}
    </div>
  );
}
