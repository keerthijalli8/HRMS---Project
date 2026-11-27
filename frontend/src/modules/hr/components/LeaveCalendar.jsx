import React, { useState, useEffect } from 'react';
import { loadHolidays } from '../services/holidayStore.js';

// Calendar Component with exact specs integrated with Holiday Store
export const LeaveCalendar = ({ selectedDate, onSelectDate }) => {
  const [holidays, setHolidays] = useState(() => loadHolidays());

  useEffect(() => {
    const handleSync = () => setHolidays(loadHolidays());
    window.addEventListener("hrms_holidays_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("hrms_holidays_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const daysInMonth = 30; // November
  const startDayOffset = 6; // starts on Sunday
  const approvedDays = [4, 12, 18, 25];
  const pendingDays = [9, 21];
  const today = 5;

  // Build a map of November 2026 holidays from the holiday store
  const novHolidaysMap = React.useMemo(() => {
    const map = new Map();
    holidays.forEach(h => {
      if (h.date && h.date.startsWith("2026-11")) {
        const parts = h.date.split("-");
        const day = parseInt(parts[2], 10);
        if (!isNaN(day)) {
          map.set(day, h);
        }
      }
    });
    return map;
  }, [holidays]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-ink text-sm">November <span className="font-num">2026</span></span>
        <div className="flex gap-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent2"></span> Approved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-ink/80"></span> Pending
          </span>
          <span className="flex items-center gap-1 text-warn">▲ Holiday</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-display text-[11px] text-muted uppercase">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Blank pad for start day */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[58px] rounded-lg bg-surface/30 opacity-40"></div>
        ))}

        {days.map(d => {
          const isToday = d === today;
          const isSelected = selectedDate === d;
          const isApproved = approvedDays.includes(d);
          const isPending = pendingDays.includes(d);
          const holidayInfo = novHolidaysMap.get(d);
          const isHoliday = !!holidayInfo;
          const dayOfWeek = (d + startDayOffset - 1) % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={d}
              onClick={() => onSelectDate(d)}
              className={`min-h-[58px] p-1.5 rounded-lg border flex flex-col justify-between items-start transition text-left relative ${
                isWeekend ? "opacity-55" : ""
              } ${
                isSelected ? "outline outline-2 outline-accent border-accent bg-surface2" : "border-line bg-surface2 hover:bg-surface2/80"
              } ${
                isToday ? "border-accent text-accent font-bold" : "text-ink"
              }`}
              aria-pressed={isSelected}
            >
              <span className={`text-[12px] tabular-nums font-num font-semibold ${isToday ? "text-accent font-bold" : "text-ink"}`}>{d}</span>
              
              <div className="w-full flex items-center justify-end gap-1 mt-auto">
                {isHoliday && (
                  <span
                    className={`text-[10px] leading-none ${holidayInfo.isOptional ? "text-amber-400" : "text-warn"}`}
                    title={`${holidayInfo.name} (${holidayInfo.type})`}
                  >
                    ▲
                  </span>
                )}
                {isApproved && <span className="w-2 h-2 rounded-full bg-accent2" title="Approved Leave"></span>}
                {isPending && <span className="w-2 h-2 rounded-full border border-ink" title="Pending Approval"></span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Information Box */}
      <div className="border border-dashed border-line rounded-[var(--radius)] p-3 bg-surface/40 flex items-center justify-between text-xs text-muted">
        <div>
          <span className="text-ink font-semibold">{selectedDate} Nov 2026: </span>
          {selectedDate === 5 ? "Today — 4 Team members on approved annual leave." :
           novHolidaysMap.has(selectedDate) ? `Official Holiday: ${novHolidaysMap.get(selectedDate).name} (${novHolidaysMap.get(selectedDate).type} · ${novHolidaysMap.get(selectedDate).category}).` :
           approvedDays.includes(selectedDate) ? "Approved: Rohan Sharma (Tech Lead) - Casual Leave." :
           pendingDays.includes(selectedDate) ? "Pending HR Approval: Deepa Nair (DevOps) - Medical Leave (2 Days)." :
           "No scheduled leaves for workforce."}
        </div>
        <button 
          className="text-accent underline text-[11px] hover:text-white" 
          onClick={() => alert(`Opening details for ${selectedDate} Nov 2026`)}
        >
          View Shift Details
        </button>
      </div>
    </div>
  );
};
