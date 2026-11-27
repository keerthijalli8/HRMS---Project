// src/components/Calendar.jsx
// Monsoon Glass calendar: Month navigation, 7 cols grid, leave status highlights,
// interactive month leaves list, and click-to-view Reason & Who Approved modal.

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  X,
  ArrowRight,
  ShieldCheck,
  Ban,
  Sparkles
} from 'lucide-react';
import { formatDate, formatTime12 } from '../utils/format.js';
import { StatusBadge } from './StatusBadge.jsx';
import { Tag } from './Tag.jsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AVAILABLE_YEARS = [2025, 2026, 2027];

/**
 * Normalizes any leave entry (from mockLeaves.js or employee.js) into a consistent schema.
 */
function normalizeLeave(l) {
  if (!l) return null;
  const id = l.id || 'LR-REQ';
  const type = l.leaveType || l.type || 'Leave';
  const fromDate = l.fromDate || l.date || '';
  const toDate = l.toDate || l.fromDate || l.date || '';
  const days = l.days || 1;
  const reason = l.reason || 'No specific reason provided.';
  const rawStatus = l.status || 'Approved';

  // Extract approvers
  let approvers = [];
  if (Array.isArray(l.approvals) && l.approvals.length > 0) {
    approvers = l.approvals.map((step) => {
      let roleTitle = step.role || 'Approver';
      if (step.role === 'TL') roleTitle = 'Team Lead (TL)';
      else if (step.role === 'MANAGER') roleTitle = 'Reporting Manager (Final Authority)';
      else if (step.role === 'HR') roleTitle = 'Human Resources (HR)';

      return {
        role: step.role,
        roleTitle,
        name: step.name || 'Unassigned',
        decision: step.decision || 'Pending',
        remark: step.remark || (step.decision === 'Pending' ? 'Awaiting review' : 'No comments added.'),
        decidedAt: step.decidedAt || null
      };
    });
  } else if (l.approver) {
    approvers = [
      {
        role: 'MANAGER',
        roleTitle: 'Reporting Manager',
        name: l.approver,
        decision: rawStatus,
        remark: l.approverComment || 'Approved as requested.',
        decidedAt: l.appliedOn || null
      }
    ];
  }

  return {
    ...l,
    id,
    type,
    fromDate,
    toDate,
    days,
    reason,
    status: rawStatus,
    approvers
  };
}

export function Calendar({
  year: propYear = 2026,
  month: propMonth = 10, // 0-indexed: 10 = November
  events = [],
  holidays = [],
  leaveEntries = [],
  selectedDate,
  onSelectDate,
  onLeaveClick,
  className = '',
  title = '',
  showMonthNavigation = true
}) {
  const [currentYear, setCurrentYear] = useState(propYear);
  const [currentMonth, setCurrentMonth] = useState(propMonth);
  const [internalSelected, setInternalSelected] = useState(selectedDate || '2026-11-06');
  const [inspectedLeave, setInspectedLeave] = useState(null);

  useEffect(() => {
    if (propYear !== undefined) setCurrentYear(propYear);
  }, [propYear]);

  useEffect(() => {
    if (propMonth !== undefined) setCurrentMonth(propMonth);
  }, [propMonth]);

  const activeSelected = selectedDate || internalSelected;

  const handleDayClick = (dateStr) => {
    setInternalSelected(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleQuickMonth = (mIndex) => {
    setCurrentMonth(mIndex);
  };

  const handleResetToCurrent = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
    setInternalSelected('2026-11-06');
  };

  const handleOpenLeaveModal = (leaveItem) => {
    const normalized = normalizeLeave(leaveItem);
    setInspectedLeave(normalized);
    if (onLeaveClick) onLeaveClick(normalized);
  };

  // Month days computation
  const firstDay = new Date(currentYear, currentMonth, 1);
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Weekday offset: Monday as first column (0 = Mon, ..., 6 = Sun)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset === -1) startOffset = 6; // Sunday moved to end

  const days = [];
  // Leading blanks
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      dateStr,
      isWeekend: new Date(currentYear, currentMonth, d).getDay() === 0 || new Date(currentYear, currentMonth, d).getDay() === 6
    });
  }

  // Current Month date range strings
  const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

  // Normalized list of leaves in current month
  const monthLeaves = useMemo(() => {
    return (leaveEntries || [])
      .map(normalizeLeave)
      .filter((l) => {
        if (!l) return false;
        const start = l.fromDate || l.date;
        const end = l.toDate || l.fromDate || l.date;
        if (!start) return false;
        return start <= monthEndStr && (end || start) >= monthStartStr;
      })
      .sort((a, b) => (a.fromDate > b.fromDate ? 1 : -1));
  }, [leaveEntries, monthStartStr, monthEndStr]);

  // Selected date info details
  const selectedHoliday = holidays.find((h) => h.date === activeSelected);

  // Month festivals and holidays
  const monthHolidays = useMemo(() => {
    return (holidays || []).filter((h) => {
      if (!h.date) return false;
      const parts = h.date.split('-');
      if (parts.length < 2) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return y === currentYear && m === currentMonth + 1;
    });
  }, [holidays, currentYear, currentMonth]);

  const selectedLeaves = useMemo(() => {
    return (leaveEntries || [])
      .map(normalizeLeave)
      .filter((l) => {
        if (!l) return false;
        if (l.date === activeSelected) return true;
        if (l.fromDate && l.toDate) {
          return activeSelected >= l.fromDate && activeSelected <= l.toDate;
        }
        return false;
      });
  }, [leaveEntries, activeSelected]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Month Navigation & Quick Month Selection Header */}
      {showMonthNavigation && (
        <div className="p-3 sm:p-4 rounded-tpl bg-surface2/40 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:border-accent/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[16px] sm:text-[18px] text-ink min-w-[150px]">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                  {monthLeaves.length} {monthLeaves.length === 1 ? 'leave' : 'leaves'}
                </span>

                {monthHolidays.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warn/15 text-warn border border-warn/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{monthHolidays.length} {monthHolidays.length === 1 ? 'festival' : 'festivals'}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:border-accent/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Year Selector */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                aria-label="Select year"
                className="bg-surface2 text-ink border border-line rounded-lg px-2.5 py-1 text-[12px] font-medium focus:outline-none focus:border-accent cursor-pointer"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y} className="bg-bg text-ink">
                    {y}
                  </option>
                ))}
              </select>

              {/* Month Dropdown */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                aria-label="Select month"
                className="bg-surface2 text-ink border border-line rounded-lg px-2.5 py-1 text-[12px] font-medium focus:outline-none focus:border-accent cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-bg text-ink">
                    {m}
                  </option>
                ))}
              </select>

              {(currentMonth !== 10 || currentYear !== 2026) && (
                <button
                  type="button"
                  onClick={handleResetToCurrent}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-accent hover:bg-accent/10 border border-accent/30 transition-colors"
                >
                  Today (Nov 2026)
                </button>
              )}
            </div>
          </div>

          {/* Quick Month Pills for 1-click Month Switching */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {MONTH_NAMES.map((name, idx) => {
              const isCurrent = idx === currentMonth;
              const shortName = name.slice(0, 3);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleQuickMonth(idx)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                    isCurrent
                      ? 'bg-accent text-on-accent font-bold shadow-sm'
                      : 'bg-surface2/60 text-muted hover:text-ink hover:bg-surface2 border border-line/60'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend strip */}
      <div className="flex items-center justify-between text-[11px] text-muted flex-wrap gap-2 px-1">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Approved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Rejected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> Escalated
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-warn" /> Holiday
          </span>
        </div>
        <span className="text-muted/70">Click date or leave to inspect reason & approvals</span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-muted uppercase tracking-wider py-1">
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
        <div>Sun</div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((item, idx) => {
          if (!item) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[68px] rounded-[10px] bg-transparent pointer-events-none"
              />
            );
          }

          const { dayNumber, dateStr, isWeekend } = item;
          const isToday = dateStr === '2026-11-06';
          const isSelected = dateStr === activeSelected;
          const holiday = holidays.find((h) => h.date === dateStr);

          // Leaves for this day
          const leaves = (leaveEntries || [])
            .map(normalizeLeave)
            .filter((l) => {
              if (!l) return false;
              if (l.date === dateStr) return true;
              if (l.fromDate && l.toDate) {
                return dateStr >= l.fromDate && dateStr <= l.toDate;
              }
              return false;
            });

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr)}
              aria-label={`${formatDate(dateStr)}${holiday ? `, Holiday: ${holiday.name}` : ''}${
                leaves.length ? `, ${leaves.length} leave(s)` : ''
              }`}
              aria-pressed={isSelected}
              className={`min-h-[68px] p-2 rounded-[12px] text-left relative flex flex-col justify-between transition-all duration-150 border bg-surface2/80 hover:bg-surface2 ${
                isWeekend ? 'opacity-60' : 'opacity-100'
              } ${
                isToday
                  ? 'border-accent text-accent font-bold shadow-[0_0_12px_rgba(110,231,208,0.2)]'
                  : 'border-line/70 text-ink'
              } ${
                isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg z-10' : ''
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[13px] font-medium leading-none tabular-nums ${
                    isToday ? 'text-accent font-bold' : ''
                  }`}
                >
                  {dayNumber}
                </span>

                {/* Holiday triangle indicator */}
                {holiday && (
                  <span
                    title={`Holiday / Festival: ${holiday.festivalName || holiday.name}`}
                    className="w-0 h-0 border-t-[7px] border-t-warn border-l-[7px] border-l-transparent absolute top-1.5 right-1.5"
                    aria-label={`Holiday: ${holiday.festivalName || holiday.name}`}
                  />
                )}
              </div>

              {/* Holiday Festival Name Badge */}
              {holiday && (
                <div
                  title={`Festival: ${holiday.festivalName || holiday.name} (${holiday.type} Holiday)`}
                  className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold truncate leading-tight border flex items-center gap-1 ${
                    holiday.type === 'Optional'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : holiday.type === 'Company'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  <span className="text-[10px] shrink-0">🎉</span>
                  <span className="truncate">{holiday.festivalName || holiday.name}</span>
                </div>
              )}

              {/* Leave pills/dots */}
              <div className="flex flex-col gap-0.5 mt-auto pt-1 w-full">
                {leaves.map((l, i) => {
                  const statusLower = (l.status || '').toLowerCase();
                  let pillBg = 'bg-accent2 text-white';
                  if (statusLower === 'approved') pillBg = 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300';
                  else if (statusLower === 'pending') pillBg = 'bg-amber-500/25 border-amber-400/50 text-amber-300';
                  else if (statusLower === 'rejected') pillBg = 'bg-rose-500/25 border-rose-400/50 text-rose-300';
                  else if (statusLower === 'escalated') pillBg = 'bg-orange-500/25 border-orange-400/50 text-orange-300';

                  return (
                    <span
                      key={i}
                      title={`${l.type} (${l.status}) · Reason: ${l.reason} · Click to inspect`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLeaveModal(l);
                      }}
                      className={`text-[9px] px-1 py-0.2 rounded border font-semibold truncate leading-tight transition-transform hover:scale-105 cursor-pointer ${pillBg}`}
                    >
                      {l.type.replace(' Leave', '')}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Info Box */}
      <div className="p-3.5 rounded-tpl border border-dashed border-line bg-surface/50 flex items-center justify-between flex-wrap gap-2 text-[12px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink">
            {formatDate(activeSelected, { includeWeekday: true })}:
          </span>{' '}
          {selectedHoliday ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warn/15 border border-warn/40 text-warn font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Festival: {selectedHoliday.festivalName || selectedHoliday.name}</span>
              </span>
              {selectedHoliday.festival && selectedHoliday.festival !== (selectedHoliday.festivalName || selectedHoliday.name) && (
                <span className="text-accent text-[11px] font-medium">({selectedHoliday.festival})</span>
              )}
              <span className="text-muted text-[11px]">· {selectedHoliday.type} Holiday</span>
              {selectedHoliday.category && (
                <span className="text-muted/80 text-[11px]">· {selectedHoliday.category}</span>
              )}
              {selectedHoliday.description && (
                <span className="text-ink/80 text-[11px] hidden md:inline">· {selectedHoliday.description}</span>
              )}
            </div>
          ) : selectedLeaves.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedLeaves.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleOpenLeaveModal(l)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 transition-colors cursor-pointer font-medium text-[11px]"
                >
                  <span>
                    {l.type} ({l.status})
                  </span>
                  <span className="underline font-semibold">View Reason & Approvers →</span>
                </button>
              ))}
            </div>
          ) : (
            <span className="text-muted">Standard working day (9:30 AM – 6:30 PM IST)</span>
          )}
        </div>
        <div className="text-[11px] text-muted">
          Click any date or leave chip to view details
        </div>
      </div>

      {/* Festivals & Holidays in this Month List */}
      {monthHolidays.length > 0 && (
        <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warn" />
              <h3 className="font-display font-bold text-ink text-[14px]">
                Festivals & Holidays in {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warn/20 text-warn border border-warn/30">
                {monthHolidays.length} {monthHolidays.length === 1 ? 'festival' : 'festivals'}
              </span>
            </div>

            <span className="text-[11px] text-muted">
              Click any festival to highlight on calendar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {monthHolidays.map((h) => {
              const isSelected = activeSelected === h.date;
              return (
                <div
                  key={h.id}
                  onClick={() => handleDayClick(h.date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDayClick(h.date);
                    }
                  }}
                  className={`p-3.5 rounded-tpl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-accent bg-accent/15 ring-1 ring-accent'
                      : 'border-line bg-surface2/50 hover:border-accent/60 hover:bg-surface2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">🎉</span>
                      <div className="min-w-0">
                        <div className="font-bold text-ink text-[14px] truncate">
                          {h.festivalName || h.name}
                        </div>
                        <div className="text-[11px] text-muted font-mono">
                          {formatDate(h.date, { includeWeekday: true })}
                        </div>
                      </div>
                    </div>
                    <Tag
                      color={
                        h.type === 'Public'
                          ? 'accent'
                          : h.type === 'Company'
                          ? 'accent2'
                          : 'warn'
                      }
                    >
                      {h.type}
                    </Tag>
                  </div>

                  {h.festival && (
                    <div className="text-[11px] text-accent font-semibold truncate">
                      {h.festival}
                    </div>
                  )}

                  {h.description && (
                    <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                      {h.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Leaves in this Particular Month List */}
      <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-ink text-[14px]">
              Leaves in {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface2 text-muted border border-line">
              {monthLeaves.length}
            </span>
          </div>

          <span className="text-[11px] text-muted">
            Click any leave card to view full reason and who approved
          </span>
        </div>

        {monthLeaves.length === 0 ? (
          <div className="p-5 rounded-tpl bg-surface/40 border border-line/50 text-center space-y-1">
            <p className="text-muted text-[13px]">
              No leaves recorded for <strong className="text-ink">{MONTH_NAMES[currentMonth]} {currentYear}</strong>.
            </p>
            <p className="text-[11px] text-muted/80">
              Use the month navigation buttons above to view leaves in other months (e.g. November, October, September, August).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monthLeaves.map((l) => {
              const approverNames = l.approvers.map((a) => a.name).filter(Boolean);
              return (
                <div
                  key={l.id}
                  onClick={() => handleOpenLeaveModal(l)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenLeaveModal(l);
                    }
                  }}
                  className="p-3.5 rounded-tpl bg-surface2/50 border border-line hover:border-accent/60 hover:bg-surface2 transition-all cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-[13px] group-hover:text-accent transition-colors">
                          {l.type}
                        </span>
                        <span className="text-[11px] font-mono text-muted/80">{l.id}</span>
                      </div>
                      <div className="text-[11px] text-muted font-mono mt-0.5">
                        {formatDate(l.fromDate)}
                        {l.toDate && l.toDate !== l.fromDate ? ` – ${formatDate(l.toDate)}` : ''}{' '}
                        · <strong className="text-accent">{l.days} {l.days === 1 ? 'day' : 'days'}</strong>
                      </div>
                    </div>

                    <StatusBadge status={l.status} showIcon={true} />
                  </div>

                  {/* Reason snippet */}
                  <div className="text-[12px] text-ink/90 flex items-start gap-1.5 bg-surface/40 p-2 rounded-lg border border-line/40">
                    <FileText className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">
                      <strong>Reason:</strong> {l.reason}
                    </span>
                  </div>

                  {/* Who Approved snippet */}
                  <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/30 flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>
                        Approvers:{' '}
                        <strong className="text-ink">
                          {approverNames.length > 0 ? approverNames.join(', ') : 'Pending assignees'}
                        </strong>
                      </span>
                    </span>

                    <span className="text-accent text-[11px] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Leave Details Modal (Displays Reason & Who Approved) */}
      {inspectedLeave && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setInspectedLeave(null)}
        >
          <div
            className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-tpl border border-line bg-surface shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-line/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-muted">{inspectedLeave.id}</span>
                  <StatusBadge status={inspectedLeave.status} showIcon={true} />
                </div>
                <h2 className="font-display font-bold text-[18px] text-ink mt-0.5">
                  {inspectedLeave.type}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setInspectedLeave(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:border-accent/60 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dates & Duration Banner */}
            <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line flex items-center justify-between text-[13px]">
              <div>
                <span className="text-muted block text-[11px]">Duration</span>
                <span className="font-mono font-semibold text-ink">
                  {formatDate(inspectedLeave.fromDate)}
                  {inspectedLeave.toDate && inspectedLeave.toDate !== inspectedLeave.fromDate
                    ? ` – ${formatDate(inspectedLeave.toDate)}`
                    : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted block text-[11px]">Working Days</span>
                <span className="font-mono font-bold text-accent text-[14px]">
                  {inspectedLeave.days} {inspectedLeave.days === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            {/* 📝 Employee Reason */}
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" /> Employee Reason
              </span>
              <div className="p-3.5 rounded-tpl bg-surface2/30 border border-line text-[13px] text-ink leading-relaxed font-normal">
                {inspectedLeave.reason}
              </div>
            </div>

            {/* 👥 Who Approved / Approval Decisions */}
            <div className="space-y-2.5">
              <span className="text-[11px] uppercase tracking-wider text-muted font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Who Approved / Approval Decisions
              </span>

              {inspectedLeave.approvers && inspectedLeave.approvers.length > 0 ? (
                <div className="space-y-2">
                  {inspectedLeave.approvers.map((step, idx) => {
                    const normDecision = (step.decision || '').toLowerCase();
                    const isApproved = normDecision === 'approved';
                    const isRejected = normDecision === 'rejected';
                    const isEscalated = normDecision === 'escalated';

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-tpl bg-surface2/40 border border-line space-y-1.5 text-[12px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] text-muted font-medium block">
                              {step.roleTitle || step.role}
                            </span>
                            <span className="font-semibold text-ink text-[13px]">{step.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/40">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-400/40">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            )}
                            {isEscalated && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-300 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-400/40">
                                <AlertTriangle className="w-3 h-3" /> Escalated
                              </span>
                            )}
                            {!isApproved && !isRejected && !isEscalated && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-300 bg-yellow-500/15 px-2 py-0.5 rounded-full border border-yellow-400/40">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Remark */}
                        <p className="text-[12px] text-muted leading-snug pl-1 border-l-2 border-line">
                          {step.remark}
                        </p>

                        {step.decidedAt && (
                          <div className="text-[10px] text-muted/70 font-mono">
                            Decided: {formatDate(step.decidedAt)} · {formatTime12(step.decidedAt, { showSeconds: false })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-tpl bg-surface2/30 border border-line text-[12px] text-muted">
                  No approval records assigned yet.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-line/40 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedLeave(null)}
                className="px-4 py-1.5 rounded-tpl bg-surface2 hover:bg-surface2/80 text-ink text-[12px] font-medium border border-line transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
