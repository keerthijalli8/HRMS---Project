import React, { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { Icon } from '../components/Icon.jsx';
import { WorkModeSettingsModal } from '../components/wfo/WorkModeSettingsModal.jsx';
import { loadWorkModeSettings, subscribeWorkMode } from '../services/wfoWfhStore.js';
import { loadAuditSettings, saveAuditSettings } from '../services/auditService.js';

export const SettingsView = ({ currentUser, onTriggerToast }) => {
  const [isWfoModalOpen, setIsWfoModalOpen] = useState(false);
  const [workSettings, setWorkSettings] = useState(() => loadWorkModeSettings());
  const [auditSettings, setAuditSettings] = useState(() => loadAuditSettings());
  const [hasAuditChanges, setHasAuditChanges] = useState(false);

  useEffect(() => {
    const unsub = subscribeWorkMode(() => setWorkSettings(loadWorkModeSettings()));
    return unsub;
  }, []);

  const handleToggleCategory = (catKey) => {
    setAuditSettings(prev => ({
      ...prev,
      enabledCategories: {
        ...prev.enabledCategories,
        [catKey]: !prev.enabledCategories[catKey]
      }
    }));
    setHasAuditChanges(true);
  };

  const handleToggleNav = () => {
    setAuditSettings(prev => ({
      ...prev,
      trackNavigation: !prev.trackNavigation
    }));
    setHasAuditChanges(true);
  };

  const handleRetentionChange = (days) => {
    setAuditSettings(prev => ({
      ...prev,
      retentionDays: Number(days)
    }));
    setHasAuditChanges(true);
  };

  const handleSaveAuditSettings = () => {
    const res = saveAuditSettings(auditSettings, currentUser);
    if (res.ok) {
      setHasAuditChanges(false);
      onTriggerToast?.("Audit governance policies saved and logged.");
    } else {
      onTriggerToast?.("Failed to save audit settings.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main Enterprise Configuration Card */}
      <div className="glass-card">
        <div className="font-display font-bold text-ink text-[16px]">HR Enterprise Configuration & Policies</div>
        <div className="text-[12px] text-muted -mt-2">Configure master rosters, statutory parameters, and permission levels</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Statutory Card */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
            <div className="font-semibold text-ink text-sm">Statutory PF & ESI Parameters</div>
            <div className="text-xs text-muted">Statutory values labelled "Configurable example, to be validated"</div>
            <div className="flex flex-col gap-1.5 mt-1 text-xs">
              <label className="flex justify-between">
                <span className="text-muted">Employee PF Contribution:</span>
                <span className="font-data font-bold text-ink">12% of Basic</span>
              </label>
              <label className="flex justify-between">
                <span className="text-muted">Employer PF Matching:</span>
                <span className="font-data font-bold text-ink">12% (3.67% PF + 8.33% EPS)</span>
              </label>
              <label className="flex justify-between">
                <span className="text-muted">Professional Tax (Telangana Slab):</span>
                <span className="font-data font-bold text-ink">₹200 / Month</span>
              </label>
            </div>
          </div>

          {/* Attendance & Shift Rules */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
            <div className="font-semibold text-ink text-sm">Attendance & Shift Rules</div>
            <div className="text-xs text-muted">Biometric integration tolerance parameters</div>
            <div className="flex flex-col gap-1.5 mt-1 text-xs">
              <label className="flex justify-between">
                <span className="text-muted">Standard Shift Hours:</span>
                <span className="font-data font-bold text-ink">09:30 AM – 06:30 PM IST</span>
              </label>
              <label className="flex justify-between">
                <span className="text-muted">Grace Time For Late Punch:</span>
                <span className="font-data font-bold text-ink">15 Minutes (09:45 AM)</span>
              </label>
              <label className="flex justify-between">
                <span className="text-muted">Half-Day Deduction:</span>
                <span className="font-data font-bold text-ink">&lt; 4 Hours Working</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-line/60">
          <SecondaryButton onClick={() => onTriggerToast("Settings reset to defaults")}>Cancel</SecondaryButton>
          <PrimaryButton icon="check" onClick={() => onTriggerToast("HR Configuration settings saved successfully")}>Save Changes</PrimaryButton>
        </div>
      </div>

      {/* 2. Work Mode & Geofence Policy Card */}
      <div className="glass-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display font-bold text-ink text-[16px] flex items-center gap-2">
              <Icon name="map-pin" className="w-4 h-4 text-accent" />
              <span>WFO Geofence & WFH Governance Policy</span>
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              Dual-factor on-premise verification (GPS coordinates + Corporate Wi-Fi) and department WFH limits
            </div>
          </div>
          <PrimaryButton icon="settings" onClick={() => setIsWfoModalOpen(true)}>
            Configure Geofence & WFH
          </PrimaryButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
            <span className="text-muted uppercase text-[10.5px] font-semibold">Primary Office</span>
            <span className="font-bold text-ink truncate">{workSettings.primaryOffice.name}</span>
            <span className="text-muted font-mono text-[11px] truncate">{workSettings.primaryOffice.address}</span>
            <span className="font-data font-semibold text-accent text-[11px] mt-1">
              Geofence Radius: {workSettings.primaryOffice.geofenceRadiusMeters} meters
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
            <span className="text-muted uppercase text-[10.5px] font-semibold">Dual-Factor Verification</span>
            <span className="font-bold text-ink">
              {workSettings.wifiVerification.requireDualFactor ? "Mandated (GPS + Wi-Fi)" : "Geofence Only"}
            </span>
            <span className="text-muted text-[11px]">
              SSIDs: {workSettings.wifiVerification.corporateSSIDs.slice(0, 2).join(", ")}
            </span>
            <span className="text-good font-semibold text-[11px] mt-1">
              Wi-Fi Check Active
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
            <span className="text-muted uppercase text-[10.5px] font-semibold">WFH Monthly Quota</span>
            <span className="font-bold text-ink font-data">{workSettings.wfhPolicy.maxWfhDaysPerMonth} Days Max / Month</span>
            <span className="text-muted text-[11px]">Notice: {workSettings.wfhPolicy.advanceNoticeHours} hours</span>
            <span className="text-accent font-semibold text-[11px] mt-1">
              {workSettings.wfhPolicy.globalApprovalRequired ? "Manager Sign-off Mandated" : "Flexible Remote"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. In-App Activity Audit Governance & Privacy Policy Card */}
      <div className="glass-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-bold">
              <Icon name="shield" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-[16px]">
                In-App Activity Logging & Retention Governance
              </div>
              <div className="text-[12px] text-muted">
                DPDPA 2023 & SOC-2 compliance parameters governing employee audit trail persistence
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PrimaryButton
              icon="check"
              disabled={!hasAuditChanges}
              onClick={handleSaveAuditSettings}
            >
              Save Audit Policy
            </PrimaryButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
          {/* Tracked Categories Toggles */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2.5">
            <div className="font-semibold text-ink text-sm flex items-center justify-between">
              <span>Tracked In-App Categories</span>
              <span className="text-[10px] text-muted">Changes are logged</span>
            </div>
            <p className="text-muted text-[11px]">
              Toggle telemetry tracking for in-app modules. Personal external activity is never recorded.
            </p>

            <div className="flex flex-col gap-2 mt-1">
              {/* Navigation Tracking Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-surface border border-line/60 cursor-pointer hover:border-accent">
                <div>
                  <span className="font-semibold text-ink block">Navigation & Route Tracking</span>
                  <span className="text-[10.5px] text-muted">Log page views and time spent per module</span>
                </div>
                <input
                  type="checkbox"
                  checked={auditSettings.trackNavigation}
                  onChange={handleToggleNav}
                  className="accent-accent w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Specific Categories */}
              {[
                { key: "Sessions", title: "Sessions & Authentication", desc: "Login, logout, session timeout, password changes" },
                { key: "Attendance", title: "Attendance & Roster Punches", desc: "Check-in, check-out, breaks, WFH passes" },
                { key: "Data changes", title: "Data Modifications", desc: "Field-level diffs on employee, payroll, tasks" },
                { key: "Approvals", title: "Approvals & Sign-offs", desc: "Leave, bonus, task completion approvals" },
                { key: "Files", title: "Document & File Telemetry", desc: "Uploads, downloads, KYC document access" },
                { key: "Sensitive", title: "Sensitive Data Access", desc: "Confidential salary unlocks and profile audits" }
              ].map(cat => (
                <label key={cat.key} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-line/60 cursor-pointer hover:border-accent">
                  <div>
                    <span className="font-semibold text-ink block">{cat.title}</span>
                    <span className="text-[10.5px] text-muted">{cat.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={auditSettings.enabledCategories[cat.key] !== false}
                    onChange={() => handleToggleCategory(cat.key)}
                    className="accent-accent w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Retention & Compliance Controls */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-3">
            <div className="font-semibold text-ink text-sm">Audit Data Retention Period</div>
            <p className="text-muted text-[11px] leading-relaxed">
              Historical audit records older than this duration are automatically purged to satisfy Indian DPDPA 2023 data minimization mandates.
            </p>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-muted text-xs font-semibold">Automatic Purge Schedule:</label>
              <select
                value={auditSettings.retentionDays}
                onChange={(e) => handleRetentionChange(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-lg p-2 text-ink text-xs focus:border-accent outline-none"
              >
                <option value={30}>30 Days (Short-term review)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days (Quarterly compliance)</option>
                <option value={180}>180 Days (Default enterprise standard)</option>
                <option value={365}>365 Days (Annual statutory audit)</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col gap-1 mt-2">
              <strong className="text-emerald-200">Append-Only Immutability</strong>
              <span>
                All audit log events are permanently append-only and cryptographically timestamped in Asia/Kolkata (IST). Neither employees nor administrators can edit or delete logs from the user interface.
              </span>
            </div>

            <div className="text-[11px] text-muted mt-auto pt-2 border-t border-line/40">
              Last Policy Review: <span className="font-mono text-ink">{auditSettings.lastUpdated ? new Date(auditSettings.lastUpdated).toLocaleDateString() : 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WorkModeSettingsModal
        isOpen={isWfoModalOpen}
        onClose={() => setIsWfoModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
};
