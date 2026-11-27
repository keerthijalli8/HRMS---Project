import React from 'react';
import { Icon } from '../Icon.jsx';
import { Avatar } from '../Avatar.jsx';
import { SecondaryButton } from '../Buttons.jsx';

export const AttendanceDetailsModal = ({ isOpen, onClose, record, selectedDate }) => {
  if (!isOpen || !record) return null;

  const empId = record.id || record.employeeId;
  const isAbsent = record.attStatus === "Absent" || record.category === "Absent" || !record.firstLogin;
  const isWorking = record.attStatus === "Currently Working";
  const isLate = record.attStatus === "Late";
  const isCheckedOut = record.attStatus === "Checked Out";

  const workMode = record.category || record.workMode || "WFO";
  const formattedDate = (() => {
    try {
      const d = new Date(selectedDate + "T12:00:00+05:30");
      return d.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return selectedDate;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line bg-surface2/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={record.name} employeeId={empId} size="lg" photoUrl={record.avatarUrl} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-ink text-base truncate">
                  {record.name}
                </h3>
                <span className="font-mono text-[11px] font-semibold text-muted bg-surface2 px-2 py-0.5 rounded border border-line">
                  {empId}
                </span>
              </div>
              <div className="text-muted text-[11.5px] truncate">
                {record.role || "Employee"} · <span className="text-ink font-medium">{record.dept || "General"}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition shrink-0"
            aria-label="Close"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Status & Work Mode Banner */}
          <div className="p-3 rounded-xl bg-surface2/50 border border-line flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4 text-accent" />
              <span className="font-semibold text-ink">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                workMode === "WFH"
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "bg-surface text-ink border-line"
              }`}>
                {workMode === "WFH" ? "Work From Home (WFH)" : "Work From Office (WFO)"}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${record.attColor || 'bg-surface2 text-muted border-line'}`}>
                {record.attStatus || "Present"}
              </span>
            </div>
          </div>

          {/* 4 Attendance Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[10.5px] text-muted uppercase font-semibold tracking-wider">
                Check-in Time
              </span>
              <span className="text-base font-num font-extrabold text-good">
                {record.loginTimeFormatted || (isAbsent ? "Not Checked In" : "--")}
              </span>
              <span className="text-[10px] text-muted">
                {isLate ? "After 09:30 AM" : isAbsent ? "No punch recorded" : "On schedule"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[10.5px] text-muted uppercase font-semibold tracking-wider">
                Check-out Time
              </span>
              <span className="text-base font-num font-extrabold text-ink">
                {isWorking ? "Active Session" : record.logoutTimeFormatted || "--"}
              </span>
              <span className="text-[10px] text-muted">
                {isWorking ? "Currently Working" : isCheckedOut ? "Shift Concluded" : "--"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[10.5px] text-muted uppercase font-semibold tracking-wider">
                Gross Hours
              </span>
              <span className="text-base font-num font-extrabold text-accent">
                {record.hoursWorkedFormatted || "--"}
              </span>
              <span className="text-[10px] text-muted">
                Total duration
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
              <span className="text-[10.5px] text-muted uppercase font-semibold tracking-wider">
                Net Work Hours
              </span>
              <span className="text-base font-num font-extrabold text-accent">
                {record.netHoursFormatted || record.hoursWorkedFormatted || "--"}
              </span>
              <span className="text-[10px] text-muted">
                Less breaks
              </span>
            </div>
          </div>

          {/* Shift & Verification Breakdown */}
          <div className="glass-card !p-3.5 border border-line space-y-2.5">
            <div className="font-display font-bold text-ink text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-line">
              <Icon name="shield" className="w-3.5 h-3.5 text-accent" />
              <span>Shift & Verification Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-line/40">
                <span className="text-muted">Standard Shift:</span>
                <strong className="text-ink font-medium">09:00 AM – 06:00 PM (General)</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line/40">
                <span className="text-muted">Verification Status:</span>
                <span className="font-semibold text-good">
                  {record.verificationStatus || (workMode === "WFH" ? "Remote (Approved)" : "Verified (Office Geofence & Wi-Fi)")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line/40">
                <span className="text-muted">Attendance Source:</span>
                <span className="text-ink font-medium">{record.source || "Web Portal"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line/40">
                <span className="text-muted">Approval Status:</span>
                <span className="text-good font-semibold">{record.approvalStatus || "Approved"}</span>
              </div>
            </div>
          </div>

          {/* Location & Geofence Coordinates */}
          <div className="glass-card !p-3.5 border border-line space-y-2">
            <div className="font-display font-bold text-ink text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-line">
              <Icon name="map-pin" className="w-3.5 h-3.5 text-accent" />
              <span>Location & Punch Coordinates</span>
            </div>
            <div className="text-xs space-y-1.5 text-muted">
              <div className="flex justify-between items-center">
                <span>Check-in Location:</span>
                <strong className="text-ink">{record.inLoc?.label || (workMode === "WFH" ? "Authorized Remote Location" : "Corporate Office, Hyderabad")}</strong>
              </div>
              {record.inLoc?.lat != null && (
                <div className="font-mono text-[11px] bg-surface2/60 p-2 rounded-lg border border-line flex items-center justify-between">
                  <span>GPS Lat: <strong>{record.inLoc.lat.toFixed(5)}</strong>, Lon: <strong>{record.inLoc.lon.toFixed(5)}</strong></span>
                  <span className="text-muted">Accuracy: ±{record.inLoc.accuracy || 15}m</span>
                </div>
              )}
              {record.outLoc && (
                <div className="flex justify-between items-center pt-1 border-t border-line/40">
                  <span>Check-out Location:</span>
                  <strong className="text-ink">{record.outLoc.label || record.inLoc?.label || "--"}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Break Details */}
          {Array.isArray(record.breaks) && record.breaks.length > 0 && (
            <div className="glass-card !p-3.5 border border-line space-y-2">
              <div className="font-display font-bold text-ink text-xs uppercase tracking-wider flex items-center justify-between pb-1.5 border-b border-line">
                <div className="flex items-center gap-1.5">
                  <Icon name="coffee" className="w-3.5 h-3.5 text-accent" />
                  <span>Break Sessions ({record.breaks.length})</span>
                </div>
                <span className="text-muted text-[11px]">Total: {record.totalBreakFormatted || "45m"}</span>
              </div>
              <div className="space-y-1.5">
                {record.breaks.map((b, idx) => {
                  const sTime = b.start ? new Date(b.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--";
                  const eTime = b.end ? new Date(b.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "Active Break";
                  return (
                    <div key={idx} className="p-2 rounded-lg bg-surface2/40 border border-line/60 flex items-center justify-between text-xs">
                      <span className="text-ink font-medium">Break #{idx + 1}</span>
                      <span className="font-mono text-muted">{sTime} – {eTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-surface2/20 flex items-center justify-end">
          <SecondaryButton onClick={onClose}>
            Close Details
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
