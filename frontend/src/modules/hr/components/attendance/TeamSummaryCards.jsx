import React from 'react';
import { KPITile } from '../KPITile.jsx';

export const TeamSummaryCards = ({
  summary = {},
  selectedStatusFilter = "All",
  onSelectStatusFilter
}) => {
  const {
    totalEmployees = 0,
    present = 0,
    absent = 0,
    onLeave = 0,
    wfh = 0,
    late = 0,
    earlyOut = 0,
    notCheckedIn = 0
  } = summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      <KPITile
        metric={String(totalEmployees)}
        label="Total Employees"
        icon="users"
        trend="Team Roster"
        hideSuffix={true}
        className={selectedStatusFilter === "All" ? "ring-2 ring-accent" : ""}
        onClick={() => onSelectStatusFilter?.("All")}
      />

      <KPITile
        metric={String(present)}
        label="Present"
        icon="check-circle"
        trend="In Office"
        hideSuffix={true}
        className={selectedStatusFilter === "Present" ? "ring-2 ring-good" : ""}
        onClick={() => onSelectStatusFilter?.("Present")}
      />

      <KPITile
        metric={String(absent)}
        label="Absent"
        icon="x-circle"
        trend="Unplanned"
        isWarn={absent > 0}
        hideSuffix={true}
        className={selectedStatusFilter === "Absent" ? "ring-2 ring-bad" : ""}
        onClick={() => onSelectStatusFilter?.("Absent")}
      />

      <KPITile
        metric={String(onLeave)}
        label="On Leave"
        icon="calendar"
        trend="Approved"
        hideSuffix={true}
        className={selectedStatusFilter === "Leave" ? "ring-2 ring-purple-400" : ""}
        onClick={() => onSelectStatusFilter?.("Leave")}
      />

      <KPITile
        metric={String(wfh)}
        label="WFH"
        icon="home"
        trend="Remote"
        hideSuffix={true}
        className={selectedStatusFilter === "WFH" ? "ring-2 ring-accent" : ""}
        onClick={() => onSelectStatusFilter?.("WFH")}
      />

      <KPITile
        metric={String(late)}
        label="Late Arrivals"
        icon="clock"
        trend="> 15m Grace"
        isWarn={late > 0}
        hideSuffix={true}
        className={selectedStatusFilter === "Late" ? "ring-2 ring-warn" : ""}
        onClick={() => onSelectStatusFilter?.("Late")}
      />

      <KPITile
        metric={String(earlyOut)}
        label="Early Out"
        icon="log-out"
        trend="< 9h Shift"
        isWarn={earlyOut > 0}
        hideSuffix={true}
        className={selectedStatusFilter === "Early Out" ? "ring-2 ring-amber-400" : ""}
        onClick={() => onSelectStatusFilter?.("Early Out")}
      />

      <KPITile
        metric={String(notCheckedIn)}
        label="Not Checked In"
        icon="alert-circle"
        trend="No Punch"
        isWarn={notCheckedIn > 0}
        hideSuffix={true}
        className={selectedStatusFilter === "Not Checked In" ? "ring-2 ring-warn" : ""}
        onClick={() => onSelectStatusFilter?.("Not Checked In")}
      />
    </div>
  );
};
