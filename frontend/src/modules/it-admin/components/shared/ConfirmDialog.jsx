import React, { useEffect } from 'react';
import { Button } from './Button';
import { IconAlertTriangle } from './Icons';
import { useLockBodyScroll } from '../../utils/scrollLock';

/**
 * Confirm dialog (same drawer style, left-aligned content) for destructive actions:
 * deactivate account, revoke access, retire asset.
 */
export function ConfirmDialog({ isOpen, onCancel, onConfirm, title, message, confirmLabel = 'Confirm' }) {
  // Lock body and html scroll while confirm dialog is open
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0a222b',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--card-shadow)',
          padding: 'var(--pad)',
        }}
        className="flex flex-col gap-4 text-left animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-2.5 text-bad">
          <IconAlertTriangle className="w-5 h-5 shrink-0" />
          <h3 id="confirm-title" className="font-display font-bold text-[17px] text-ink">
            {title}
          </h3>
        </div>

        <p id="confirm-desc" className="text-[13px] text-muted leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
