import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const activeModals = [];
let previousBodyOverflow = '';

export const ModalPortal = ({
  isOpen = true,
  onClose,
  children,
  className = '',
  ariaLabel,
  ariaLabelledby,
  closeOnBackdrop = false,
  role = 'dialog',
}) => {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const token = {};
    if (activeModals.length === 0) previousBodyOverflow = document.body.style.overflow;
    activeModals.push(token);
    document.body.style.overflow = 'hidden';

    const handleKeyDown = event => {
      if (event.key === 'Escape' && activeModals[activeModals.length - 1] === token) {
        event.preventDefault();
        onCloseRef.current?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = activeModals.indexOf(token);
      if (index !== -1) activeModals.splice(index, 1);
      document.body.style.overflow = activeModals.length ? 'hidden' : previousBodyOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={`team-lead-module-portal fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-4 ${className}`}
      style={{ background: 'rgba(5, 16, 22, 0.82)', backdropFilter: 'blur(6px)' }}
      onMouseDown={event => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      {children}
    </div>,
    document.body
  );
};
