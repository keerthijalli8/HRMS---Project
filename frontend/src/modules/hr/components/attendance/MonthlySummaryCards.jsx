import React from 'react';
import { KPITile } from '../KPITile.jsx';

export const MonthlySummaryCards = ({
  summary = {},
  monthName = "November",
  year = 2026,
  onCardClick
}) => {
  const {
    presentDays = 0,
    absentDays = 0,
    lateArrivals = 0,
    earlyCheckOuts = 0,
    wfhDays = 0,
    leavesTaken = 0,
    avgHoursPerDay = "--",
    totalHoursThisMonth = "--"
  } = summary;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-muted">
          Monthly Attendance Performance · {monthName} {year}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <KPITile
          metric={String(presentDays)}
          label="Present Days"
          icon="check-circle"
          trend="In Office"
          hideSuffix={true}
          onClick={() => onCardClick?.("present")}
        />

        <KPITile
          metric={String(absentDays)}
          label="Absent Days"
          icon="x-circle"
          trend="Unplanned"
          isWarn={absentDays > 0}
          hideSuffix={true}
          onClick={() => onCardClick?.("absent")}
        />

        <KPITile
          metric={String(lateArrivals)}
          label="Late Arrivals"
          icon="clock"
          trend="> 15m Grace"
          isWarn={lateArrivals > 0}
          hideSuffix={true}
          onClick={() => onCardClick?.("late")}
        />

        <KPITile
          metric={String(earlyCheckOuts)}
          label="Early Out"
          icon="log-out"
          trend="< 9h Shift"
          isWarn={earlyCheckOuts > 0}
          hideSuffix={true}
          onClick={() => onCardClick?.("early")}
        />

        <KPITile
          metric={String(wfhDays)}
          label="WFH Days"
          icon="home"
          trend="Remote Work"
          hideSuffix={true}
          onClick={() => onCardClick?.("wfh")}
        />

        <KPITile
          metric={String(leavesTaken)}
          label="Leaves Taken"
          icon="calendar"
          trend="Approved"
          hideSuffix={true}
          onClick={() => onCardClick?.("leave")}
        />

        <KPITile
          metric={avgHoursPerDay}
          label="Avg Hours/Day"
          icon="trending-up"
          trend="Target: 9h"
          hideSuffix={true}
        />

        <KPITile
          metric={totalHoursThisMonth}
          label="Total Hours"
          icon="briefcase"
          trend="Productive"
          hideSuffix={true}
        />
      </div>
    </div>
  );
};
