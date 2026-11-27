import React from 'react';
import { Icon } from '../components/Icon.jsx';
import { SecondaryButton } from '../components/Buttons.jsx';
import { AuditLogViewer } from '../components/audit/AuditLogViewer.jsx';

export const AuditLogsView = ({ currentUser, setCurrentRoute, onTriggerToast }) => {
  const isHrOrAdmin = (() => {
    const r = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    return r.includes("admin") || r.includes("hr");
  })();

  if (!isHrOrAdmin) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Icon name="shield-alert" className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="font-display font-bold text-lg text-ink">
          Access Restricted: Enterprise Audit Logs
        </h2>
        <p className="text-xs text-muted max-w-md">
          Organization-wide audit logs and sensitive security telemetry are restricted to authorized HR Managers and System Administrators.
        </p>
        <SecondaryButton onClick={() => setCurrentRoute("overview")}>
          Back to Dashboard
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Page Header */}
      <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold">
            <Icon name="shield" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-ink text-base sm:text-lg">
                Enterprise Audit Trail & In-App Activity Logs
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-num">
                SOC-2 & DPDPA 2023 Compliant
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Comprehensive tamper-evident record of all sessions, punches, approvals, and data changes inside HR Desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <SecondaryButton onClick={() => setCurrentRoute("settings")}>
            Audit Settings
          </SecondaryButton>
          <SecondaryButton onClick={() => setCurrentRoute("overview")}>
            Dashboard
          </SecondaryButton>
        </div>
      </div>

      {/* Main Global Audit Viewer */}
      <AuditLogViewer
        isGlobal={true}
        currentUser={currentUser}
      />
    </div>
  );
};

export default AuditLogsView;
