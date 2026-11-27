import React from 'react';
import { Icon } from '../Icon.jsx';

export const BonusStepper = ({ currentStep = 1, onStepClick }) => {
  const steps = [
    { number: 1, title: "Select Employees", subtitle: "Roster & Eligibility" },
    { number: 2, title: "Bonus Details", subtitle: "Amount & Pay Cycle" },
    { number: 3, title: "Review & Confirm", subtitle: "TDS & Authorization" }
  ];

  return (
    <div className="w-full bg-surface2/40 border border-line rounded-2xl p-3 sm:p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {steps.map((s, idx) => {
          const isCurrent = currentStep === s.number;
          const isDone = currentStep > s.number;
          const isUpcoming = currentStep < s.number;

          return (
            <React.Fragment key={s.number}>
              <div
                onClick={() => {
                  if (isDone && onStepClick) {
                    onStepClick(s.number);
                  }
                }}
                className={`flex items-center gap-3 flex-1 select-none ${
                  isDone ? "cursor-pointer group" : ""
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs transition-all shrink-0 ${
                    isDone
                      ? "bg-good/20 text-good border border-good/50 group-hover:scale-105"
                      : isCurrent
                      ? "bg-accent text-on-accent shadow-lg shadow-accent/20 ring-2 ring-accent/30 font-extrabold"
                      : "bg-surface2 text-muted border border-line"
                  }`}
                >
                  {isDone ? (
                    <Icon name="check" className="w-4 h-4 text-good stroke-[3]" />
                  ) : (
                    <span>{s.number}</span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-bold leading-tight truncate ${
                      isCurrent
                        ? "text-accent"
                        : isDone
                        ? "text-ink group-hover:text-accent transition-colors"
                        : "text-muted"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="text-[11px] text-muted truncate">
                    {s.subtitle}
                  </span>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`hidden sm:block h-[2px] w-12 shrink-0 transition-colors ${
                    currentStep > idx + 1 ? "bg-good/50" : "bg-line/60"
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BonusStepper;
