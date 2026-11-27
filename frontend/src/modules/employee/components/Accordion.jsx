// src/components/Accordion.jsx
// Accessible accordion component for FAQs and collapsible policy notes.

import React, { useState } from 'react';

export function AccordionItem({ title, children, isOpen, onToggle, id }) {
  const contentId = `acc-content-${id}`;
  const headerId = `acc-header-${id}`;

  return (
    <div className="border-b border-line/50 last:border-b-0 py-1">
      <h3>
        <button
          id={headerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className="w-full py-3.5 px-1 flex items-center justify-between text-left font-body font-semibold text-[14px] text-ink hover:text-accent transition-colors gap-3"
        >
          <span>{title}</span>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-muted border border-line shrink-0 text-xs transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-accent border-accent' : ''
            }`}
          >
            ↓
          </span>
        </button>
      </h3>
      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={headerId}
          className="pb-3 px-1 text-[13px] text-muted leading-relaxed"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function Accordion({ items = [], className = '' }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className={`divide-y divide-line/40 ${className}`}>
      {items.map((item, idx) => (
        <AccordionItem
          key={item.id || idx}
          id={item.id || idx}
          title={item.title || item.q}
          isOpen={openIndex === idx}
          onToggle={() => setOpenIndex(openIndex === idx ? -1 : idx)}
        >
          {item.content || item.a}
        </AccordionItem>
      ))}
    </div>
  );
}

export default Accordion;

