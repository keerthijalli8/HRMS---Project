import { useEffect } from 'react';

let lockCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';

/**
 * Increment scroll lock counter and apply overflow: hidden to root elements.
 */
export function lockScroll() {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-scroll-locked', 'true');
  }
  lockCount++;
}

/**
 * Decrement scroll lock counter and restore overflow when all locks are released.
 */
export function unlockScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.body.style.overflow = originalBodyOverflow || '';
    document.body.removeAttribute('data-scroll-locked');
  }
}

/**
 * Force unlock and reset counter.
 */
export function forceUnlockScroll() {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  document.documentElement.style.overflow = originalHtmlOverflow || '';
  document.body.style.overflow = originalBodyOverflow || '';
  document.body.removeAttribute('data-scroll-locked');
}

/**
 * Hook to lock body scroll while a component or modal is mounted/open.
 */
export function useLockBodyScroll(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [isOpen]);
}

/**
 * Universal scroll lock observer:
 * Automatically monitors the DOM for any dialog, alertdialog, or side drawer overlay.
 * Whenever any overlay is present in the document, it ensures document.body and
 * document.documentElement have overflow: hidden applied.
 */
export function useUniversalScrollLock() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const queryOverlays = () => {
      const overlays = document.querySelectorAll(
        '[role="dialog"], [role="alertdialog"], [aria-modal="true"], #side-drawer-panel, [data-modal="true"]'
      );
      return Array.from(overlays).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    let isObservedLocked = false;

    const evaluateOverlays = () => {
      const activeOverlays = queryOverlays();
      const hasActiveModal = activeOverlays.length > 0;

      if (hasActiveModal && !isObservedLocked) {
        lockScroll();
        isObservedLocked = true;
      } else if (!hasActiveModal && isObservedLocked) {
        unlockScroll();
        isObservedLocked = false;
      }
    };

    // Initial check in case a modal is already rendered
    evaluateOverlays();

    const observer = new MutationObserver(() => {
      evaluateOverlays();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    return () => {
      observer.disconnect();
      if (isObservedLocked) {
        unlockScroll();
        isObservedLocked = false;
      }
    };
  }, []);
}
