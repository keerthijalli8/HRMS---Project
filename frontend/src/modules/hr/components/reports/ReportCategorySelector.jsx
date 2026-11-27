import React from 'react';
import { Icon } from '../Icon.jsx';
import { REPORT_CATEGORIES } from '../../data/reportsData.js';

export const ReportCategorySelector = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          Select Report Category
        </span>
        <span className="text-[11px] text-muted">
          8 Centralized Analytic Domains
        </span>
      </div>

      {/* Grid of Selectable Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {REPORT_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`p-3 rounded-xl border text-left transition flex flex-col gap-2 relative overflow-hidden group ${
                isActive
                  ? 'bg-accent/15 border-accent shadow-md text-ink'
                  : 'bg-surface2/50 border-line text-muted hover:border-accent/50 hover:text-ink hover:bg-surface2/80'
              }`}
            >
              {/* Active accent indicator bar */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
              )}

              <div className="flex items-center justify-between">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                    isActive
                      ? 'bg-accent text-on-accent'
                      : 'bg-surface2 text-accent group-hover:scale-105'
                  }`}
                >
                  <Icon name={cat.icon} className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>

              <div>
                <div className={`font-display font-bold text-xs truncate ${isActive ? 'text-accent' : 'text-ink'}`}>
                  {cat.label}
                </div>
                <div className="text-[10px] text-muted line-clamp-1 mt-0.5">
                  {cat.id === "payroll" ? "Financials" : cat.id === "attendance" ? "Biometrics" : "Metrics"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
