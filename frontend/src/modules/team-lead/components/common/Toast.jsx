import React, { useEffect } from 'react';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toast, clearToast } = useTeamLead();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const iconMap = {
    good: <CheckCircle2 className="w-4 h-4 text-good shrink-0" />,
    warn: <AlertCircle className="w-4 h-4 text-warn shrink-0" />,
    bad: <AlertCircle className="w-4 h-4 text-bad shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-bad shrink-0" />,
    info: <Info className="w-4 h-4 text-accent shrink-0" />
  };

  return (
    <aside
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0a222b] text-ink border border-line shadow-2xl backdrop-blur-xl animate-fade-in max-w-[92vw] sm:max-w-md"
      role="status"
      aria-live="polite"
    >
      {iconMap[toast.type] || iconMap.info}
      <span className="min-w-0 flex-1 whitespace-normal break-words text-xs font-medium leading-snug sm:text-sm">{toast.message}</span>
      {toast.undo && (
        <button
          onClick={() => {
            toast.undo();
            clearToast();
          }}
          className="ml-auto text-xs font-bold text-accent hover:underline shrink-0 px-2 py-0.5 rounded focus:outline-none"
        >
          Undo
        </button>
      )}
      <button
        onClick={clearToast}
        className="p-1 rounded-full text-muted hover:text-ink hover:bg-surface2 transition shrink-0 ml-1"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
