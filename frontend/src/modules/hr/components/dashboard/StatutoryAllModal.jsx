import React, { useEffect, useRef } from 'react';
import { Icon } from '../Icon.jsx';
import { STATUTORY_DISCLAIMER } from '../../config/statutory.js';

export const StatutoryAllModal = ({
  isOpen,
  onClose,
  items = [],
  isHrOrAdmin = false,
  onMarkFiled
}) => {
  const modalRef = useRef(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="All Statutory Compliance Obligations"
        className="w-full max-w-3xl max-h-[85vh] bg-[#071720] border border-line rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden text-left animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface/50 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-ink text-lg tracking-tight">
              Statutory Compliance Calendar
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Official Indian labor laws & tax obligations for Telangana employers
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
          {items.map((item) => (
            <div
              key={item.compositeKey || item.id}
              className={`p-4 rounded-xl border flex flex-col gap-2 transition ${
                item.isFiled
                  ? "bg-good/5 border-good/25"
                  : "bg-surface2/40 border-line hover:border-accent/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20 shrink-0">
                    {item.formattedDueDate}
                  </span>
                  <div>
                    <h3 className="font-bold text-ink text-sm">
                      {item.name}
                    </h3>
                    <div className="text-[11.5px] text-muted">
                      {item.act} · {item.coverage}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${item.badgeClass}`}>
                    {item.status}
                  </span>

                  {isHrOrAdmin && !item.isFiled && !item.isVariable && (
                    <button
                      type="button"
                      onClick={() => onMarkFiled?.(item)}
                      className="text-xs font-semibold text-accent hover:underline px-2.5 py-1 rounded bg-accent/10 border border-accent/25 hover:bg-accent/20 transition cursor-pointer"
                    >
                      Mark as filed
                    </button>
                  )}
                </div>
              </div>

              {/* Holiday Note */}
              {item.holidayNote && (
                <div className="text-[11px] text-warn bg-warn/10 border border-warn/25 rounded-lg px-2.5 py-1 font-medium">
                  {item.holidayNote}
                </div>
              )}

              {/* Authority & Portal Link */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-line/40 pt-2 mt-1">
                <span className="text-muted">
                  Authority: <strong className="text-ink font-semibold">{item.authority}</strong>
                </span>

                <a
                  href={item.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open portal ({item.authorityShort})</span>
                  <Icon name="arrow-right" className="w-3 h-3 text-accent" />
                </a>
              </div>

              {/* Filed reference proof */}
              {item.isFiled && item.filedRecord && (
                <div className="text-[11px] text-good font-mono bg-good/10 rounded px-2 py-0.5 border border-good/20">
                  Filed on {new Date(item.filedRecord.filedAt).toLocaleDateString()} by {item.filedRecord.filedBy}
                  {item.filedRecord.referenceNo ? ` · Ref: ${item.filedRecord.referenceNo}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Disclaimer */}
        <div className="p-4 border-t border-line bg-surface/60 text-center">
          <p className="text-[11px] text-muted/90 italic leading-relaxed">
            {STATUTORY_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatutoryAllModal;
