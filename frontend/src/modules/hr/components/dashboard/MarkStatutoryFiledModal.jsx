import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon.jsx';

export const MarkStatutoryFiledModal = ({
  isOpen,
  onClose,
  item,
  currentUser,
  onConfirm
}) => {
  const [referenceNo, setReferenceNo] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setReferenceNo("");
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm?.({
      itemId: item.id,
      cycleKey: item.cycleKey,
      referenceNo
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mark Statutory Compliance as Filed"
        className="w-full max-w-md bg-[#071720] border border-line rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-good/15 text-good flex items-center justify-center font-bold shrink-0">
              <Icon name="check" className="w-4 h-4 text-good" />
            </div>
            <div>
              <h3 className="font-display font-bold text-ink text-base">
                Mark as Filed
              </h3>
              <p className="text-xs text-muted">
                Record government statutory compliance filing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-muted hover:text-ink px-2 py-1 rounded hover:bg-surface2 transition"
          >
            Cancel
          </button>
        </div>

        {/* Item Summary */}
        <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink text-sm">{item.name}</span>
            <span className="font-mono text-accent font-semibold">{item.formattedDueDate}</span>
          </div>
          <div className="text-muted">
            Authority: <span className="text-ink font-medium">{item.authority}</span>
          </div>
          <div className="text-muted">
            Coverage Period: <span className="text-ink font-semibold">{item.coverage}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-xs">
            <label htmlFor="ref-input" className="font-semibold text-ink">
              Reference / Acknowledgement Number <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              id="ref-input"
              ref={inputRef}
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. Challan ITNS-281 BSR / ECR TRRN / Ack No."
              className="h-10 px-3.5 rounded-xl bg-surface2/80 border border-line focus:border-accent text-xs text-ink placeholder:text-muted/60 focus:outline-none transition"
            />
            <span className="text-[11px] text-muted">
              Entering the receipt number writes to the audit trail and preserves proof of timely remittance.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-surface2 border border-line text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-good text-black font-bold text-xs hover:brightness-105 active:scale-95 transition cursor-pointer shadow-md"
            >
              Confirm Filed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkStatutoryFiledModal;
