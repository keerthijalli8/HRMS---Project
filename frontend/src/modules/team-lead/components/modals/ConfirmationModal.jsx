import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal.jsx';

export const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "accent",
  onConfirm,
  onCancel,
  disabled = false,
  children
}) => {
  if (!isOpen) return null;

  const variantButtonClass = {
    accent: 'bg-accent text-on-accent hover:brightness-105',
    good: 'bg-good text-on-accent hover:brightness-105',
    bad: 'bg-bad text-[#2a0303] hover:brightness-105'
  };

  return (
    <ModalPortal onClose={onCancel} ariaLabel={title}>
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface2 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          {confirmVariant === 'bad' ? (
            <div className="p-2 rounded-xl bg-bad/15 text-bad">
              <AlertCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-accent/15 text-accent">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
          <h3 className="font-display font-bold text-lg text-white">{title}</h3>
        </div>

        <p className="text-sm text-muted leading-relaxed mb-4">{message}</p>

        {children}

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-line/60">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink hover:border-accent transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${variantButtonClass[confirmVariant] || variantButtonClass.accent} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
