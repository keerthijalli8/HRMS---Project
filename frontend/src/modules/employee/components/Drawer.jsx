// src/components/Drawer.jsx
// Fixed right drawer (400px, background #0a222b, 1px line border, focus trap, Esc closes).

import React, { useEffect, useRef } from 'react';

export function Drawer({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-[400px]', className = '' }) {
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element
      setTimeout(() => {
        const focusable = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'Tab') {
          // Focus trap
          const focusables = drawerRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusables || focusables.length === 0) return;

          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#0a222b' }}
        className={`w-full ${maxWidth} h-full flex flex-col border-l border-line shadow-2xl animate-in slide-in-from-right duration-200 text-ink ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display font-bold text-[17px] text-ink leading-snug">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-line bg-surface/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Drawer;

