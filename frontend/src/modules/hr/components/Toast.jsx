import React from 'react';

export const Toast = ({ toast, onUndo }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-bg px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-2">
      <span>{toast.message}</span>
      <button 
        onClick={onUndo} 
        className="underline text-on-accent bg-accent/40 px-2 py-0.5 rounded-full hover:bg-accent hover:text-on-accent transition font-bold"
      >
        Undo
      </button>
    </div>
  );
};
