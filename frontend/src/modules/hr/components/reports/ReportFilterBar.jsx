import React from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import { REPORT_CATEGORIES, DEPARTMENTS, EMPLOYMENT_STATUSES } from '../../data/reportsData.js';

export const ReportFilterBar = ({
  filters,
  onChangeFilter,
  onGenerateReport,
  onResetFilters,
  isGenerating = false
}) => {
  return (
    <div className="glass-card !p-4 border border-line flex flex-col gap-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between border-b border-line pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Icon name="filter" className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-ink text-sm">Dynamic Filter Engine</span>
        </div>
        <span className="text-xs text-muted font-data">Parameters auto-filter live visualization</span>
      </div>

      {/* Grid of Dynamic Controls with comfortable widths and automatic wrapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
        {/* 1. Category Dropdown */}
        <div className="min-w-[160px]">
          <label className="block text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
            Category
          </label>
          <Select
            size="sm"
            value={filters.category}
            onChange={(e) => onChangeFilter("category", e.target.value)}
            className="w-full text-xs"
          >
            {REPORT_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </Select>
        </div>

        {/* 2. Date Range Preset */}
        <div className="min-w-[160px]">
          <label className="block text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
            Date Range
          </label>
          <Select
            size="sm"
            value={filters.datePreset}
            onChange={(e) => onChangeFilter("datePreset", e.target.value)}
            className="w-full text-xs"
          >
            <option value="this_month">This Month (Nov 2026)</option>
            <option value="last_month">Last Month (Oct 2026)</option>
            <option value="this_quarter">This Quarter (Q3 FY27)</option>
            <option value="ytd">Year-to-Date (FY27)</option>
            <option value="custom">Custom Date Range</option>
          </Select>
        </div>

        {/* 3. Start Date */}
        <div className="min-w-[140px]">
          <label className="block text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onChangeFilter("startDate", e.target.value)}
            disabled={filters.datePreset !== "custom"}
            className="w-full bg-surface2/60 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent disabled:opacity-50 font-data h-[34px]"
          />
        </div>

        {/* 4. End Date */}
        <div className="min-w-[140px]">
          <label className="block text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChangeFilter("endDate", e.target.value)}
            disabled={filters.datePreset !== "custom"}
            className="w-full bg-surface2/60 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent disabled:opacity-50 font-data h-[34px]"
          />
        </div>

        {/* 5. Department */}
        <div className="min-w-[150px]">
          <label className="block text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
            Department
          </label>
          <Select
            size="sm"
            value={filters.dept}
            onChange={(e) => onChangeFilter("dept", e.target.value)}
            className="w-full text-xs"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>

        {/* 6. Employment Status */}
        <div className="min-w-[140px]">
          <label className="block text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
            Status
          </label>
          <Select
            size="sm"
            value={filters.status}
            onChange={(e) => onChangeFilter("status", e.target.value)}
            className="w-full text-xs"
          >
            <option value="All">All Statuses</option>
            {EMPLOYMENT_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        {/* 7. Action Buttons */}
        <div className="flex flex-col justify-end min-w-[170px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGenerateReport}
              disabled={isGenerating}
              className="flex-1 bg-accent text-on-accent font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.98] transition shadow-sm h-[34px]"
            >
              <Icon name="check" className="w-3.5 h-3.5 text-on-accent" />
              <span>{isGenerating ? "Processing..." : "Generate"}</span>
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset all filters to default"
              className="px-3 py-1.5 rounded-lg bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition text-xs font-semibold h-[34px]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
