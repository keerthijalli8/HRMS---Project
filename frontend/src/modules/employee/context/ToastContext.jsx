// src/context/ToastContext.jsx
// Toast notification system with Undo capability matching Monsoon Glass Section 8 & 9.

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const { onUndo = null, undoLabel = 'Undo', duration = 6000 } = options;

    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({
      id: Date.now(),
      message,
      onUndo,
      undoLabel
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const handleUndo = useCallback(() => {
    if (toast && toast.onUndo) {
      toast.onUndo();
    }
    hideToast();
  }, [toast, hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-ink text-bg font-body font-medium text-[13px] shadow-2xl transition-all animate-bounce-in max-w-[90vw]"
          style={{
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--accent)'
          }}
        >
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={handleUndo}
              className="text-on-accent bg-accent px-2.5 py-0.5 rounded-full font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-transform"
            >
              {toast.undoLabel}
            </button>
          )}
          <button
            onClick={hideToast}
            aria-label="Dismiss toast"
            className="text-bg/60 hover:text-bg text-base leading-none ml-1"
          >
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastContext;

