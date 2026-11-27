import React, { useEffect, useRef } from 'react';
import { IconX } from './Icons';
import { useLockBodyScroll } from '../../utils/scrollLock';

/**
 * Overlay panel for forms and details, with edge-aligned drawer and centered modal layouts.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerActions,
  isHalfWidth = false,
  isCentered = false,
  isFullScreen = false,
  width,
  maxWidth,
  className = '',
  id = 'side-drawer-panel',
  closeButtonLabel = 'Close drawer'
}) {
  const drawerRef = useRef(null);

  // Apply overflow: hidden to the root HTML and body element to prevent scrolling across the entire page
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const drawerWidth = isFullScreen
    ? 'min(96vw, 1600px)'
    : isHalfWidth ? '50vw' : (width || '100%');
  const drawerMaxWidth = isFullScreen
    ? '96vw'
    : isHalfWidth ? '50vw' : (maxWidth || 'min(540px, 94vw)');
  const overlayAlignment = isFullScreen || isCentered
    ? `items-center justify-center${isFullScreen ? ' p-2 sm:p-4' : ''}`
    : 'justify-end';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className={`fixed inset-0 z-50 flex ${overlayAlignment} bg-black/60 backdrop-blur-sm transition-opacity`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id={id}
        ref={drawerRef}
        data-half-width={isHalfWidth ? 'true' : undefined}
        style={{
          width: drawerWidth,
          maxWidth: drawerMaxWidth,
          height: isFullScreen ? 'min(96vh, 1000px)' : '100%',
          maxHeight: isFullScreen ? '96vh' : undefined,
          backgroundColor: 'rgba(6, 20, 28, 0.90)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: isFullScreen || isCentered ? '1px solid var(--line)' : undefined,
          borderLeft: isFullScreen || isCentered ? undefined : '1px solid var(--line)',
          borderRadius: isFullScreen || isCentered ? '16px' : undefined,
          boxShadow: isFullScreen || isCentered
            ? '0 20px 60px rgba(0, 0, 0, 0.65)'
            : '-12px 0 40px rgba(0, 0, 0, 0.65)',
        }}
        className={`h-full flex flex-col justify-between overflow-hidden shadow-2xl ${
          isFullScreen || isCentered
            ? 'w-full animate-in zoom-in-95 duration-200'
            : 'animate-in slide-in-from-right duration-200'
        } ${
          isHalfWidth && !isFullScreen
            ? 'w-full md:w-[50vw] md:max-w-[50vw]'
            : !isFullScreen ? 'w-full max-w-[min(540px,94vw)]' : ''
        } ${className}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-line shrink-0">
          <h2 id="drawer-title" className="min-w-0 flex-1 font-display font-bold text-[17px] text-ink truncate">
            {title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeButtonLabel}
              className="p-1 rounded-full text-muted hover:text-ink hover:bg-surface2 transition-colors focus-visible:outline-accent"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-ink">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="p-4 border-t border-line bg-surface/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
