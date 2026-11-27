// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success' || toast.type === 'good'
                ? 'bg-good/15 border-good/40 text-good'
                : toast.type === 'error' || toast.type === 'bad'
                ? 'bg-bad/15 border-bad/40 text-bad'
                : toast.type === 'warn'
                ? 'bg-warn/15 border-warn/40 text-warn'
                : 'bg-surface2/90 border-line text-ink'
            }`}
          >
            {(toast.type === 'success' || toast.type === 'good') && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
            {(toast.type === 'error' || toast.type === 'bad') && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-accent" />}
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
