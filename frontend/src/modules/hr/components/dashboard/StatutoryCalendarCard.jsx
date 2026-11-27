import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import {
  getComputedStatutoryItems,
  markStatutoryFiled,
  subscribeStatutory,
  checkAndGenerateStatutoryNotifications
} from '../../services/statutoryService.js';
import { STATUTORY_DISCLAIMER } from '../../config/statutory.js';
import { MarkStatutoryFiledModal } from './MarkStatutoryFiledModal.jsx';
import { StatutoryAllModal } from './StatutoryAllModal.jsx';

export const StatutoryCalendarCard = ({
  currentUser,
  onTriggerToast,
  className = ""
}) => {
  const [items, setItems] = useState(() => getComputedStatutoryItems());
  const [activeItemForFiling, setActiveItemForFiling] = useState(null);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);

  const isHrOrAdmin = useMemo(() => {
    const role = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    return role.includes("hr") || role.includes("admin") || role.includes("manager") || role.includes("lead");
  }, [currentUser]);

  // Subscribe to live filing updates & generate notification reminders
  useEffect(() => {
    const unsub = subscribeStatutory(() => {
      setItems(getComputedStatutoryItems());
    });

    // Check compliance notifications 3 days before due date
    checkAndGenerateStatutoryNotifications(currentUser);

    return unsub;
  }, [currentUser]);

  // Take top 4-5 items for the dashboard preview card
  const displayItems = useMemo(() => {
    return items.slice(0, 4);
  }, [items]);

  const handleConfirmFiling = ({ itemId, cycleKey, referenceNo }) => {
    const res = markStatutoryFiled({
      itemId,
      cycleKey,
      referenceNo,
      user: currentUser
    });
    if (res.ok) {
      setItems(getComputedStatutoryItems());
      const matched = items.find(i => i.id === itemId);
      onTriggerToast?.(
        `${matched?.name || 'Statutory filing'} successfully recorded as filed${referenceNo ? ` (Ref: ${referenceNo})` : ''}`
      );
    }
  };

  return (
    <div className={`glass-card !p-6 border border-line rounded-[20px] flex flex-col justify-between h-full text-left ${className}`}>
      <div>
        {/* Header: Title & View All */}
        <div className="flex items-center justify-between border-b border-line/40 pb-3">
          <div>
            <h3 className="font-display font-semibold text-ink text-[18px]">
              Statutory Calendar
            </h3>
            <p className="text-[12px] text-muted mt-0.5">
              Official India compliance & filing due dates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
              Nov '26
            </span>
            <button
              type="button"
              onClick={() => setIsAllModalOpen(true)}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer ml-1"
            >
              View all →
            </button>
          </div>
        </div>

        {/* Computed Statutory Items List */}
        <div className="flex flex-col gap-3 mt-4 text-xs">
          {displayItems.map((item) => (
            <div
              key={item.compositeKey || item.id}
              className={`p-3.5 rounded-xl border flex flex-col gap-2 transition ${
                item.isFiled
                  ? "bg-good/5 border-good/25"
                  : "bg-surface2/40 border-line hover:border-accent/40"
              }`}
            >
              {/* Row 1: Due Date, Title, Coverage and Status Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 shrink-0">
                    {item.formattedDueDate}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-ink text-[13px] leading-snug">
                      {item.name}
                    </div>
                    <div className="text-[11.5px] text-muted leading-tight mt-0.5">
                      {item.coverage}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap ${item.badgeClass}`}>
                  {item.status}
                </span>
              </div>

              {/* Row 2: Weekend / Holiday Note if applicable */}
              {item.holidayNote && (
                <div className="text-[11px] text-warn bg-warn/10 border border-warn/25 rounded-md px-2 py-0.5 font-medium">
                  {item.holidayNote}
                </div>
              )}

              {/* Row 3: Authority and Action Links */}
              <div className="flex items-center justify-between text-[11.5px] border-t border-line/30 pt-1.5 mt-0.5">
                <span className="text-muted truncate max-w-[190px] sm:max-w-none" title={item.authority}>
                  {item.authorityShort}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  {isHrOrAdmin && !item.isFiled && (
                    <button
                      type="button"
                      onClick={() => setActiveItemForFiling(item)}
                      className="font-semibold text-accent hover:underline cursor-pointer"
                    >
                      Mark as filed
                    </button>
                  )}

                  <a
                    href={item.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title={`Open official portal: ${item.authority}`}
                  >
                    <span>Open portal</span>
                    <Icon name="arrow-right" className="w-3 h-3 text-accent" />
                  </a>
                </div>
              </div>

              {/* Row 4: Filed reference acknowledgement */}
              {item.isFiled && item.filedRecord && (
                <div className="text-[10.5px] font-mono text-good bg-good/10 rounded px-2 py-0.5 border border-good/20">
                  Filed on {new Date(item.filedRecord.filedAt).toLocaleDateString()}
                  {item.filedRecord.referenceNo ? ` · Ref: ${item.filedRecord.referenceNo}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Compliance Disclaimer Note */}
      <div className="pt-3 mt-4 border-t border-line/40 text-[11px] text-muted/80 italic leading-relaxed">
        {STATUTORY_DISCLAIMER}
      </div>

      {/* Mark Filed Modal */}
      <MarkStatutoryFiledModal
        isOpen={Boolean(activeItemForFiling)}
        onClose={() => setActiveItemForFiling(null)}
        item={activeItemForFiling}
        currentUser={currentUser}
        onConfirm={handleConfirmFiling}
      />

      {/* Full Compliance List Modal */}
      <StatutoryAllModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        items={items}
        isHrOrAdmin={isHrOrAdmin}
        onMarkFiled={(item) => {
          setIsAllModalOpen(false);
          setActiveItemForFiling(item);
        }}
      />
    </div>
  );
};

export default StatutoryCalendarCard;
