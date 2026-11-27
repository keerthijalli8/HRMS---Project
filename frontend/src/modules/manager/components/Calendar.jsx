import React, { useState } from 'react';
import Avatar from './Avatar';
import { getHolidayDetails } from '../data/holidays';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Video,
  Briefcase,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

// Helper to cleanly parse leave strings like "Rahul Verma (QA Lead · Casual Leave)"
function parseLeaveDetail(str) {
  if (!str) return { name: '', role: '', type: '' };
  const match = str.match(/^([^(]+)(?:\(([^)]+)\))?/);
  if (!match) return { name: str, role: '', type: '' };
  const name = match[1].trim();
  const inside = match[2]?.trim() || '';
  const parts = inside.split('·').map((s) => s.trim());
  return {
    name,
    role: parts[0] || '',
    type: parts[1] || (parts[0]?.toLowerCase().includes('leave') ? parts[0] : ''),
  };
}

// Helper to parse shift strings like "General Shift (09:30 - 18:30)"
function parseShiftString(str) {
  if (!str) return { title: 'General Shift', time: '' };
  const match = str.match(/^([^(]+)(?:\(([^)]+)\))?/);
  if (!match) return { title: str, time: '' };
  return {
    title: match[1].trim(),
    time: match[2]?.trim() || '',
  };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar({
  days = [],
  selectedDay = 6, // today is 6 Nov
  onSelectDay,
  className = '',
}) {
  const [activeDay, setActiveDay] = useState(selectedDay);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'events' | 'leaves' | 'schedules'

  const handleDayClick = (dayNumber) => {
    setActiveDay(dayNumber);
    if (onSelectDay) onSelectDay(dayNumber);
  };

  // Find details for active day
  const activeDayData = days.find((d) => d.day === activeDay);

  // In Nov 2026, Nov 1 is Sunday.
  // In Monday-first calendar (Mon, Tue, Wed, Thu, Fri, Sat, Sun):
  // Sunday is column 7. So there are 6 empty cells before day 1!
  const emptyPaddingDays = 6;

  // Total counts for legend pills
  const totalEventsCount = days.reduce((acc, d) => acc + (d.events?.length || 0), 0);
  const totalLeavesCount = days.reduce(
    (acc, d) => acc + (d.approvedLeave?.length || 0) + (d.pendingLeave?.length || 0),
    0
  );
  const totalSchedulesCount = days.filter((d) => (d.schedules?.length || 0) > 0).length;

  return (
    <div className={`w-full flex flex-col gap-3.5 ${className}`}>
      {/* 1. Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-line/40">
        <div className="flex items-center gap-2">
          <CalendarIcon size={15} className="text-accent" />
          <span className="font-display font-bold text-ink text-[13.5px]">
            November 2026 · Master Calendar
          </span>
        </div>

        {/* Category Filter Controls */}
        <div className="flex items-center bg-surface2/80 rounded-xl p-0.5 border border-line text-[11px] font-semibold flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-accent text-on-accent font-bold shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('events')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'events'
                ? 'bg-info text-on-accent font-bold shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-info" />
            <span>Events ({totalEventsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('leaves')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'leaves'
                ? 'bg-accent2 text-on-accent font-bold shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
            <span>Leaves ({totalLeavesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('schedules')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'schedules'
                ? 'bg-good text-on-accent font-bold shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-good" />
            <span>Schedules ({totalSchedulesCount})</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Legend */}
      <div className="flex items-center gap-3.5 text-[11px] text-muted flex-wrap px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-info inline-block" />
          <span>Department Event</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--accent2)' }} />
          <span>Approved Leave</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block border"
            style={{ borderColor: 'var(--warn)', backgroundColor: 'transparent' }}
          />
          <span>Pending Leave</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-good inline-block" />
          <span>Shift / On-Call</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] inline-block"
            style={{ borderBottomColor: 'var(--warn)' }}
          />
          <span>Holiday</span>
        </span>
      </div>

      {/* 3. Weekday Columns */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11.5px] font-mono font-bold uppercase tracking-wider text-muted py-0.5">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-0.5">
            {wd}
          </div>
        ))}
      </div>

      {/* 4. Days Grid */}
      <div className="grid grid-cols-7 gap-1 select-none">
        {/* Leading empty cells for Nov 2026 */}
        {Array.from({ length: emptyPaddingDays }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="min-h-[66px] rounded-xl bg-transparent border border-transparent opacity-10"
          />
        ))}

        {days.map((dayItem) => {
          const isSelected = activeDay === dayItem.day;
          const isToday = dayItem.isToday;
          const hasHoliday = !!dayItem.holiday;
          const isWeekend = dayItem.isWeekend;

          const eventsList = dayItem.events || [];
          const approvedList = dayItem.approvedLeave || [];
          const pendingList = dayItem.pendingLeave || [];
          const schedulesList = dayItem.schedules || [];

          // Dim cell if filtering by a specific category that this day doesn't have
          const hasMatchingCategory =
            filterMode === 'all' ||
            (filterMode === 'events' && eventsList.length > 0) ||
            (filterMode === 'leaves' && (approvedList.length > 0 || pendingList.length > 0 || hasHoliday)) ||
            (filterMode === 'schedules' && schedulesList.length > 0);

          return (
            <button
              key={dayItem.day}
              type="button"
              onClick={() => handleDayClick(dayItem.day)}
              className={`min-h-[66px] p-1.5 rounded-xl text-left relative flex flex-col justify-between transition-all duration-150 group focus-visible:outline-none cursor-pointer ${
                isWeekend ? 'opacity-50' : 'opacity-100'
              } ${!hasMatchingCategory ? '!opacity-25' : ''} ${
                isSelected
                  ? 'ring-2 ring-accent border-accent/80 bg-surface2 shadow-md'
                  : 'bg-surface2/60 hover:bg-surface2 hover:border-line border border-line/60'
              }`}
              style={{
                borderColor: isToday ? 'var(--accent)' : undefined,
              }}
              aria-label={`November ${dayItem.day}, 2026`}
            >
              {/* Day Number and Holiday indicator */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[12.5px] font-mono tabular-nums leading-none font-bold ${
                    isToday ? 'text-accent' : isSelected ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {dayItem.day}
                </span>

                {hasHoliday && (
                  <span
                    className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] shrink-0"
                    style={{ borderBottomColor: 'var(--warn)' }}
                    title={`${dayItem.holiday}: ${getHolidayDetails(dayItem.holiday)?.reason || ''}`}
                  />
                )}
              </div>

              {/* Holiday Name Label if present */}
              {hasHoliday && (
                <div className="mt-1 truncate w-full">
                  <span
                    className="text-[8.5px] font-bold text-warn font-mono truncate block bg-warn/15 px-1 py-0.5 rounded border border-warn/30 leading-tight"
                    title={`${dayItem.holiday} — ${getHolidayDetails(dayItem.holiday)?.reason || ''}`}
                  >
                    ★ {dayItem.holiday}
                  </span>
                </div>
              )}

              {/* Status Indicator Dots */}
              <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
                {/* Department Event Dot (Cyan) */}
                {eventsList.length > 0 && (
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0 bg-info"
                    title={`Event: ${eventsList[0].title}`}
                  />
                )}

                {/* Approved Leave Dots (Violet filled) */}
                {approvedList.slice(0, 2).map((_, pIdx) => (
                  <span
                    key={`app-${pIdx}`}
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--accent2)' }}
                    title="Approved Leave"
                  />
                ))}

                {/* Pending Leave Dots (Amber hollow) */}
                {pendingList.slice(0, 2).map((_, pIdx) => (
                  <span
                    key={`pen-${pIdx}`}
                    className="w-[7px] h-[7px] rounded-full shrink-0 border"
                    style={{
                      borderColor: 'var(--warn)',
                      backgroundColor: 'transparent',
                    }}
                    title="Pending Leave"
                  />
                ))}

                {/* Schedule indicator (Mint dot) */}
                {schedulesList.length > 0 && (
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0 bg-good/80"
                    title={`Shift Rota: ${schedulesList[0].shift}`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. Selected Day Comprehensive Details Panel */}
      {activeDayData && (
        <div className="p-4 rounded-xl border border-dashed border-line bg-surface/90 flex flex-col gap-3.5 mt-1 animate-in fade-in">
          {/* Day Title Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-line/40">
            <span className="text-[13.5px] font-bold text-ink flex items-center gap-2">
              <span>{activeDayData.day} November 2026 ({activeDayData.weekday})</span>
              {activeDayData.isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-accent text-on-accent">
                  Today
                </span>
              )}
            </span>

            {activeDayData.holiday && (
              <span className="text-[11.5px] text-warn font-semibold flex items-center gap-1 bg-warn/10 px-2.5 py-0.5 rounded-full border border-warn/30">
                ★ Holiday: {activeDayData.holiday}
              </span>
            )}
          </div>

          {/* Holiday Reason Spotlight Card */}
          {activeDayData.holiday && (() => {
            const h = getHolidayDetails(activeDayData.holiday);
            return (
              <div className="p-3.5 rounded-xl bg-warn/10 border border-warn/40 flex flex-col gap-2 text-[12px] animate-in fade-in">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-warn shrink-0" />
                    <span className="font-bold text-[13.5px] text-ink">
                      ★ {h.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warn text-black uppercase tracking-wider">
                      {h.status}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-warn/90 font-semibold">
                    {h.type}
                  </span>
                </div>

                <div className="pt-2 border-t border-warn/20 flex flex-col gap-1.5">
                  <p className="text-ink text-[12.5px] leading-relaxed">
                    <strong className="text-warn font-bold">Reason for Holiday: </strong>
                    {h.reason}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono mt-0.5">
                    <MapPin size={11} className="text-warn" />
                    <span>Coverage: {h.coverage}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-[12px] items-stretch">
            {/* Section A: Department Events */}
            <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col justify-between gap-3 h-full">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-line/40">
                  <span className="font-semibold text-info flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider font-mono">
                    <Sparkles size={13} className="text-info shrink-0" />
                    <span>Department Events</span>
                  </span>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-info/15 text-info font-bold shrink-0">
                    {(activeDayData.events || []).length}
                  </span>
                </div>

                {(!activeDayData.events || activeDayData.events.length === 0) ? (
                  <div className="p-4 rounded-xl bg-surface/30 border border-line/30 text-center my-auto">
                    <p className="text-muted/70 italic text-[11.5px]">No department events scheduled.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeDayData.events.map((evt, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface/70 border border-line/70 flex flex-col gap-2 text-[12px]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-ink text-[12.5px] leading-snug">
                            {evt.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-semibold border border-info/30 shrink-0">
                            {evt.type}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-2 border-t border-line/40 text-[11px]">
                          <div className="flex items-center gap-1.5 text-ink font-mono font-medium">
                            <Clock size={12} className="text-info shrink-0" />
                            <span className="whitespace-nowrap">{evt.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted">
                            <MapPin size={12} className="text-muted shrink-0" />
                            <span className="leading-tight">{evt.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Leave Calendar */}
            <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col justify-between gap-3 h-full">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-line/40">
                  <span className="font-semibold text-accent2 flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider font-mono">
                    <Users size={13} className="text-accent2 shrink-0" />
                    <span>Team Leaves</span>
                  </span>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-accent2/15 text-accent2 font-bold shrink-0">
                    {((activeDayData.approvedLeave || []).length) + ((activeDayData.pendingLeave || []).length)}
                  </span>
                </div>

                {((activeDayData.approvedLeave || []).length === 0 && (activeDayData.pendingLeave || []).length === 0) ? (
                  <div className="p-4 rounded-xl bg-surface/30 border border-line/30 text-center my-auto">
                    <p className="text-muted/70 italic text-[11.5px]">Full team available (no leaves).</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(activeDayData.approvedLeave || []).map((item, i) => {
                      const { name, role, type } = parseLeaveDetail(item);
                      return (
                        <div
                          key={`app-${i}`}
                          className="p-2.5 rounded-xl bg-surface/70 border border-line/70 flex items-start justify-between gap-2.5 text-[12px] hover:border-accent2/40 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <Avatar name={name} size={28} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-ink font-bold text-[12.5px] leading-tight truncate">
                                {name}
                              </span>
                              <span className="text-muted text-[11px] leading-tight truncate">
                                {role}{type ? ` · ${type}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-accent2/20 text-accent2 border border-accent2/30 shrink-0">
                            Approved
                          </span>
                        </div>
                      );
                    })}

                    {(activeDayData.pendingLeave || []).map((item, i) => {
                      const { name, role, type } = parseLeaveDetail(item);
                      return (
                        <div
                          key={`pen-${i}`}
                          className="p-2.5 rounded-xl bg-surface/70 border border-warn/40 flex items-start justify-between gap-2.5 text-[12px] hover:border-warn/60 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <Avatar name={name} size={28} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-ink font-bold text-[12.5px] leading-tight truncate">
                                {name}
                              </span>
                              <span className="text-muted text-[11px] leading-tight truncate">
                                {role}{type ? ` · ${type}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-warn/20 text-warn border border-warn/30 shrink-0">
                            Pending
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section C: Schedules & Shifts */}
            <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col justify-between gap-3 h-full">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-line/40">
                  <span className="font-semibold text-good flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider font-mono">
                    <Briefcase size={13} className="text-good shrink-0" />
                    <span>Shift Rota & Schedules</span>
                  </span>
                  {activeDayData.schedules?.[0]?.coverage && (
                    <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-surface text-muted border border-line shrink-0">
                      {activeDayData.schedules[0].coverage}
                    </span>
                  )}
                </div>

                {(!activeDayData.schedules || activeDayData.schedules.length === 0) ? (
                  <div className="p-4 rounded-xl bg-surface/30 border border-line/30 text-center my-auto">
                    <p className="text-muted/70 italic text-[11.5px]">Regular General Shift (09:30–18:30).</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeDayData.schedules.map((sch, i) => {
                      const { title: shiftTitle, time: shiftTime } = parseShiftString(sch.shift);
                      return (
                        <div key={i} className="p-3 rounded-xl bg-surface/70 border border-line/70 flex flex-col gap-2 text-[12px]">
                          {/* Shift Name & Timing */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-ink text-[12.5px]">{shiftTitle}</span>
                            {shiftTime && (
                              <span className="text-[11px] font-mono text-muted bg-surface2/60 px-2 py-0.5 rounded border border-line/40 whitespace-nowrap">
                                {shiftTime}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/40 text-[11.5px]">
                            {sch.onCall && (
                              <div className="flex items-center gap-1.5 text-good font-medium">
                                <ShieldCheck size={13} className="text-good shrink-0" />
                                <span className="truncate">On-Call: {sch.onCall}</span>
                              </div>
                            )}

                            {sch.standup && (
                              <div className="flex items-center gap-1.5 text-muted">
                                <Clock size={12} className="text-muted shrink-0" />
                                <span className="whitespace-nowrap">{sch.standup}</span>
                              </div>
                            )}
                          </div>

                          {sch.checkIns && sch.checkIns.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-2 border-t border-line/40">
                              <span className="text-[10px] uppercase font-mono text-muted font-bold tracking-wider">
                                1:1 Check-ins:
                              </span>
                              <div className="flex flex-col gap-1">
                                {sch.checkIns.map((ci, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="flex items-center gap-2 p-1.5 px-2 rounded-lg bg-surface2/40 border border-line/40 text-[11px]"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    <span className="text-ink font-medium truncate">{ci}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
