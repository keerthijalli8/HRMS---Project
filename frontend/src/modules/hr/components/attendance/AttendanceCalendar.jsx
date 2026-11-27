import React, { useState } from 'react';
import { DayDetailDrawer } from './DayDetailDrawer.jsx';

export const AttendanceCalendar = ({
  monthDays = [],
  monthTitle = "",
  onPrevMonth,
  onNextMonth,
  onToday,
  isNextDisabled = false,
  onRequestRegularization
}) => {
  const [selectedDay, setSelectedDay] = useState(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface2/40 p-3 rounded-2xl border border-line">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg border border-line bg-surface2 text-ink hover:border-accent text-xs font-semibold transition cursor-pointer"
            title="Previous Month"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1.5 rounded-lg border border-line bg-surface2 text-ink hover:border-accent text-xs font-semibold transition cursor-pointer"
            title="Jump to Current Month"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={isNextDisabled}
            className="p-1.5 rounded-lg border border-line bg-surface2 text-ink hover:border-accent text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Next Month"
          >
            Next →
          </button>
        </div>

        <div className="font-display text-base sm:text-lg font-bold text-ink">
          {monthTitle}
        </div>

        <div className="text-[11px] text-muted">
          Click any date to view punch records
        </div>
      </div>

      {/* 7 Column Grid: SUN to SAT */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName) => (
          <div key={dayName} className="text-center text-[10.5px] font-bold text-muted uppercase tracking-wider py-1">
            {dayName}
          </div>
        ))}

        {/* Empty slots before day 1 */}
        {Array.from({ length: monthDays[0]?.dayOfWeek || 0 }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-2xl border border-transparent" />
        ))}

        {/* Month Day Tiles */}
        {monthDays.map((item) => {
          const isPresent = item.status === "Present" || item.type === "present";
          const isWfh = item.status === "WFH" || item.type === "wfh";
          const isHalfDay = item.status === "Half Day" || item.type === "half_day";
          const isMissed = item.status === "Missed Check Out" || item.isMissedCheckOut;
          const isAbsent = item.status === "Absent" || (item.type === "absent" && !item.isToday && !item.isFuture);
          const isHoliday = item.status === "Holiday" || item.type === "holiday" || (typeof item.status === "string" && item.status.startsWith("Holiday"));
          const isLeave = item.status === "Leave" || item.type === "leave";
          const isToday = item.isToday;

          // Color coding as per requirement:
          // Present (green), Absent (red), Half day (orange), WFH (blue), Leave (purple), Holiday (grey), Weekend (muted), Missed Check Out (yellow)
          let tileClass = "bg-surface2/20 border-line/40 text-muted/60 opacity-60";

          if (isToday) {
            tileClass = "border-good ring-2 ring-good/50 bg-good/20 text-good font-bold shadow-md cursor-pointer";
          } else if (isMissed) {
            tileClass = "bg-amber-400/15 border-amber-400/40 text-amber-300 font-semibold hover:border-amber-400 cursor-pointer shadow-sm";
          } else if (isHalfDay) {
            tileClass = "bg-orange-500/15 border-orange-500/40 text-orange-400 font-semibold hover:border-orange-500 cursor-pointer";
          } else if (isPresent) {
            tileClass = "bg-good/15 border-good/30 text-good font-semibold hover:border-good cursor-pointer";
          } else if (isWfh) {
            tileClass = "bg-accent/15 border-accent/30 text-accent ring-1 ring-accent/30 font-semibold hover:border-accent cursor-pointer";
          } else if (isHoliday) {
            tileClass = "bg-surface2/80 border-line text-muted font-semibold hover:border-line/80 cursor-pointer";
          } else if (isLeave) {
            tileClass = "bg-purple-500/15 border-purple-500/30 text-purple-300 font-semibold hover:border-purple-400 cursor-pointer";
          } else if (isAbsent) {
            tileClass = "bg-bad/15 border-bad/30 text-bad font-semibold hover:border-bad cursor-pointer";
          }

          return (
            <button
              type="button"
              key={item.dateKey}
              onClick={() => setSelectedDay(item)}
              className={`h-14 sm:h-20 rounded-2xl p-2 flex flex-col justify-between border text-left transition-all duration-150 hover:scale-[1.02] cursor-pointer ${tileClass}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-num font-bold">{item.day}</span>
                {isPresent && <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0" />}
                {isWfh && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                {isHalfDay && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                {isMissed && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />}
                {isAbsent && <span className="w-1.5 h-1.5 rounded-full bg-bad shrink-0" />}
                {isLeave && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
              </div>

              <div className="text-[10px] sm:text-[11px] font-medium truncate w-full">
                {isToday && !item.hasRecord && <span className="text-good font-bold">Today</span>}
                {isMissed && <span className="text-amber-300 font-bold">Missed Out</span>}
                {isHalfDay && <span className="text-orange-400 font-bold">Half Day</span>}
                {isPresent && <span>{item.checkIn}</span>}
                {isWfh && <span>WFH</span>}
                {isAbsent && <span>Absent</span>}
                {isHoliday && <span className="truncate">{item.holidayName || "Holiday"}</span>}
                {isLeave && <span>Leave</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend below the calendar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted pt-3 border-t border-line/40">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-good/20 border border-good/40 inline-block" />
          <span>Present (Office)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-accent/20 border border-accent/40 ring-1 ring-accent/30 inline-block" />
          <span>WFH (Remote)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-orange-500/20 border border-orange-500/40 inline-block" />
          <span>Half Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-400/20 border border-amber-400/40 inline-block" />
          <span>Missed Check Out</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-bad/20 border border-bad/40 inline-block" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-purple-500/20 border border-purple-500/40 inline-block" />
          <span>Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-surface2 border border-line inline-block" />
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-surface2/30 border border-line/30 inline-block" />
          <span>Weekend</span>
        </div>
      </div>

      {/* Day Drawer */}
      <DayDetailDrawer
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        dayData={selectedDay}
        onRequestRegularization={(dateKey) => {
          setSelectedDay(null);
          onRequestRegularization?.(dateKey);
        }}
      />
    </div>
  );
};
