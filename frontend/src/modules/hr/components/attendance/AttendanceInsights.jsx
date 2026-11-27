import React, { useState } from 'react';
import { Icon } from '../Icon.jsx';

export const AttendanceInsights = ({ insights = {} }) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    weeklyTrend = [],
    deptBreakdown = [],
    frequentLateComers = [],
    lowAttendanceList = []
  } = insights;

  return (
    <div className="glass-card !p-3.5 border border-line flex flex-col gap-2.5 shadow-sm rounded-2xl">
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-between w-full text-left cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Icon name="trending-up" className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs sm:text-sm text-ink">
              Attendance Insights & Trend Analytics
            </h3>
            <span className="text-[10.5px] text-muted">Monthly statistical overview</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-accent font-semibold">
          <span>{isOpen ? "Hide Insights" : "Show Insights"}</span>
          <Icon name={isOpen ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-accent" />
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="pt-2.5 border-t border-line/60 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Weekly Attendance Trend SVG Chart */}
            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[11px] uppercase tracking-wider text-muted">
                  Weekly Trend (Mon – Fri)
                </span>
                <span className="text-[11px] font-bold text-good font-num">
                  94.4% Avg
                </span>
              </div>

              {/* Responsive SVG Chart */}
              <div className="h-36 w-full flex items-end justify-between gap-2.5 pt-4 px-1">
                {weeklyTrend.map(item => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10.5px] font-bold text-ink font-num">{item.rate}%</span>
                    <div className="w-full max-w-[36px] bg-surface2 rounded-t-md overflow-hidden h-20 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-accent to-[#00f2fe] rounded-t-md transition-all duration-500"
                        style={{ height: `${item.rate}%` }}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold text-muted">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Department-wise Attendance Percentage */}
            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2.5">
              <span className="font-display font-bold text-[11px] uppercase tracking-wider text-muted">
                Department Benchmark
              </span>

              <div className="flex flex-col gap-2.5 pt-1 text-xs">
                {deptBreakdown.map(dept => (
                  <div key={dept.dept} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-semibold text-ink">{dept.dept}</span>
                      <span className="font-bold text-accent font-num">{dept.rate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden border border-line/40">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-[#38ef7d] rounded-full transition-all duration-500"
                        style={{ width: `${dept.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Frequent Late Comers & Low Attendance Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Frequent Late Comers */}
            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-warn font-semibold text-[11.5px]">
                <Icon name="clock" className="w-3.5 h-3.5 text-warn" />
                <span>Frequent Late Comers (&gt; 15m Grace)</span>
              </div>
              <div className="divide-y divide-line/40">
                {frequentLateComers.map(item => (
                  <div key={item.employeeId} className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ink text-[11.5px]">{item.name}</div>
                      <div className="text-[10px] text-muted">{item.dept} · {item.employeeId}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-warn font-num text-[11px]">{item.lateCount} Days Late</div>
                      <div className="text-[10px] text-muted font-num">Avg: {item.avgDelay}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Attendance List */}
            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-bad font-semibold text-[11.5px]">
                <Icon name="alert-triangle" className="w-3.5 h-3.5 text-bad" />
                <span>Low Attendance Notice (&lt; 75%)</span>
              </div>
              <div className="divide-y divide-line/40">
                {lowAttendanceList.map(item => (
                  <div key={item.employeeId} className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ink text-[11.5px]">{item.name}</div>
                      <div className="text-[10px] text-muted">{item.dept} · {item.employeeId}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-bad font-num text-[11px]">{item.rate}% Present</div>
                      <div className="text-[10px] text-muted">{item.absentDays} Absences ({item.status})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};