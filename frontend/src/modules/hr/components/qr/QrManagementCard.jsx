import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { StatusPill } from '../StatusPill.jsx';
import {
  getActiveQrToken,
  generateNewQrToken,
  revokeQrToken,
  loadQrTokens,
  loadQrAuditLog,
  loadQrConfig,
  saveQrConfig,
  subscribeQrUpdates
} from '../../services/qrAttendanceStore.js';
import { drawQrToCanvas } from '../../services/qrGenerator.js';
import { QrKioskModal } from './QrKioskModal.jsx';

export const QrManagementCard = ({ onTriggerToast }) => {
  const canvasRef = useRef(null);
  const [config, setConfig] = useState(() => loadQrConfig());
  const [activeToken, setActiveToken] = useState(() => getActiveQrToken());
  const [tokensHistory, setTokensHistory] = useState(() => loadQrTokens());
  const [auditLog, setAuditLog] = useState(() => loadQrAuditLog());
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Form states for config
  const [editInterval, setEditInterval] = useState(config.refreshIntervalSeconds || 30);
  const [editValidity, setEditValidity] = useState(config.tokenValiditySeconds || 60);
  const [editGraceTime, setEditGraceTime] = useState(config.graceTime || "09:30");
  const [editOfficeName, setEditOfficeName] = useState(config.officeName || "");

  const refreshAll = () => {
    const token = getActiveQrToken();
    setActiveToken(token);
    setTokensHistory(loadQrTokens());
    setAuditLog(loadQrAuditLog());
    const c = loadQrConfig();
    setConfig(c);

    if (token && canvasRef.current) {
      drawQrToCanvas(canvasRef.current, token.qrPayloadString, {
        size: 180,
        margin: 2,
        dark: "#0b1329",
        light: "#ffffff"
      });
    }
  };

  useEffect(() => {
    refreshAll();
    const unsub = subscribeQrUpdates(refreshAll);
    const interval = setInterval(refreshAll, 5000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activeToken && canvasRef.current) {
      drawQrToCanvas(canvasRef.current, activeToken.qrPayloadString, {
        size: 180,
        margin: 2,
        dark: "#0b1329",
        light: "#ffffff"
      });
    }
  }, [activeToken]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const updated = {
      ...config,
      refreshIntervalSeconds: Number(editInterval),
      tokenValiditySeconds: Number(editValidity),
      graceTime: editGraceTime,
      officeName: editOfficeName
    };
    saveQrConfig(updated);
    setIsEditingConfig(false);
    onTriggerToast("QR attendance policies updated successfully!");
  };

  const handleForceRotate = () => {
    const fresh = generateNewQrToken("manual_admin_rotate");
    setActiveToken(fresh);
    onTriggerToast("Office attendance QR rotated with new token!");
  };

  const handleRevoke = () => {
    if (!activeToken) return;
    const fresh = revokeQrToken(activeToken.tokenId, "admin_revocation");
    setActiveToken(fresh);
    onTriggerToast("Active QR code revoked!");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Banner & Kiosk Launcher */}
      <div className="glass-card !p-4 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0">
            <Icon name="check-square" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-display font-bold text-ink">
                Office Attendance QR Kiosk Management
              </h2>
              <span className="glass-pill px-2 py-0.5 text-[10.5px] font-bold text-good border border-good/30 bg-good/10">
                Active & Rotating
              </span>
            </div>
            <p className="text-xs text-muted">
              Display dynamic high-security attendance tokens on reception tablets or wall kiosks.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton
            icon="maximize"
            onClick={() => setIsKioskOpen(true)}
          >
            Launch Fullscreen Kiosk
          </PrimaryButton>
          <SecondaryButton
            icon="settings"
            onClick={() => setIsEditingConfig(!isEditingConfig)}
          >
            {isEditingConfig ? "Close Settings" : "Configure Rules"}
          </SecondaryButton>
        </div>
      </div>

      {/* 2. Config Panel (Collapsible) */}
      {isEditingConfig && (
        <form onSubmit={handleSaveConfig} className="glass-card !p-4 border border-accent/40 bg-surface2/30 flex flex-col gap-3 animate-fadeIn text-xs">
          <h3 className="font-bold text-ink text-sm flex items-center gap-2">
            <Icon name="settings" className="w-4 h-4 text-accent" />
            Configure QR Rotation & Attendance Rules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">Rotation Interval</label>
              <select
                value={editInterval}
                onChange={(e) => setEditInterval(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              >
                <option value={15}>Every 15 Seconds</option>
                <option value={30}>Every 30 Seconds (Default)</option>
                <option value={60}>Every 60 Seconds</option>
                <option value={120}>Every 2 Minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">Token Validity</label>
              <select
                value={editValidity}
                onChange={(e) => setEditValidity(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              >
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds (Recommended)</option>
                <option value={120}>2 Minutes</option>
                <option value={300}>5 Minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">Grace Time (Late Arrival Threshold)</label>
              <input
                type="time"
                value={editGraceTime}
                onChange={(e) => setEditGraceTime(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">Kiosk Display Location Name</label>
              <input
                type="text"
                value={editOfficeName}
                onChange={(e) => setEditOfficeName(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
            <SecondaryButton type="button" onClick={() => setIsEditingConfig(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Save Policy
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* 3. Live Token Card & Kiosk Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active QR Code Preview Card */}
        <div className="glass-card !p-4 border border-line flex flex-col items-center justify-between gap-3 text-center">
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-ink text-xs uppercase tracking-wider">Current Live Token</span>
            <span className="font-data text-[11px] font-bold text-accent">Active</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white shadow-md border-2 border-accent/20">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="w-full flex flex-col gap-1 text-[11px] text-muted">
            <div className="flex justify-between">
              <span>Token ID:</span>
              <strong className="text-ink font-data truncate max-w-[140px]">{activeToken?.tokenId}</strong>
            </div>
            <div className="flex justify-between">
              <span>Rotates:</span>
              <strong className="text-accent font-data">Every {config.refreshIntervalSeconds}s</strong>
            </div>
            <div className="flex justify-between">
              <span>Scans This Window:</span>
              <strong className="text-good font-data">{activeToken?.scanCount || 0} employees</strong>
            </div>
          </div>

          <div className="flex gap-2 w-full pt-2 border-t border-line/50">
            <button
              onClick={handleForceRotate}
              className="flex-1 py-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-ink text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <Icon name="rotate-cw" className="w-3.5 h-3.5 text-accent" />
              Rotate Now
            </button>
            <button
              onClick={handleRevoke}
              className="py-1.5 px-3 rounded-lg bg-bad/10 border border-bad/30 hover:bg-bad/20 text-bad text-xs font-medium transition"
              title="Revoke active token immediately"
            >
              Revoke
            </button>
          </div>
        </div>

        {/* Security & Verification Specifications */}
        <div className="glass-card !p-4 border border-line flex flex-col justify-between gap-3 text-xs md:col-span-2">
          <div>
            <h3 className="font-bold text-ink text-sm flex items-center gap-2 border-b border-line/50 pb-2">
              <Icon name="shield" className="w-4 h-4 text-accent" />
              Zero-Trust Attendance Protocol
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="font-semibold text-ink">Short-Lived Dynamic Tokens</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Tokens rotate automatically every {config.refreshIntervalSeconds} seconds with anti-replay cryptographic nonces to prevent token sharing, replay attacks, or static QR reuse.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="font-semibold text-ink">Identity & Session Verification</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Only scans authenticated against verified employee login sessions are accepted. Duplicate scans and sequence anomalies are rejected.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="font-semibold text-ink">Late Arrival Tracking</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Morning check-ins after <strong>{config.graceTime} AM</strong> are automatically flagged as <em>Late Arrival</em> for manager attendance review.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <span className="font-semibold text-ink">Audit Logged Compliance</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Every check-in, check-out, token generation, and revoked request is persisted in an immutable audit ledger ready for SOC-2 compliance.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-surface2/60 border border-line flex items-center justify-between text-muted text-[11px]">
            <span>Active Kiosk: <strong>{config.officeName}</strong></span>
            <span>Target Hours: <strong>{config.fullDayHours}h Full Day / {config.halfDayHours}h Half Day</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Generation History & Audit Log Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Rotation History */}
        <div className="glass-card !p-0 border border-line overflow-hidden shadow-sm">
          <div className="p-3 border-b border-line bg-surface2/40 flex items-center justify-between">
            <span className="font-bold text-ink text-xs">Recent QR Token History</span>
            <span className="text-[11px] text-muted font-data">{tokensHistory.length} tokens generated</span>
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line/60 bg-surface2/20 text-muted font-semibold text-[10.5px]">
                  <th className="py-2 px-3">Token ID</th>
                  <th className="py-2 px-3">Issued</th>
                  <th className="py-2 px-3">Scans</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {tokensHistory.slice(0, 10).map(tok => (
                  <tr key={tok.tokenId} className="hover:bg-surface2/30 transition text-[11px]">
                    <td className="py-2 px-3 font-data text-accent truncate max-w-[150px]">{tok.tokenId}</td>
                    <td className="py-2 px-3 text-muted whitespace-nowrap">
                      {new Date(tok.issuedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="py-2 px-3 font-data">{tok.scanCount || 0}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        tok.status === "Active" ? "bg-good/20 text-good border border-good/40" :
                        tok.status === "Revoked" ? "bg-bad/20 text-bad border border-bad/40" :
                        "bg-surface2 text-muted border border-line"
                      }`}>
                        {tok.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-Time Scan Audit Trail */}
        <div className="glass-card !p-0 border border-line overflow-hidden shadow-sm">
          <div className="p-3 border-b border-line bg-surface2/40 flex items-center justify-between">
            <span className="font-bold text-ink text-xs">Attendance Audit Log</span>
            <span className="text-[11px] text-muted font-data">{auditLog.length} events logged</span>
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line/60 bg-surface2/20 text-muted font-semibold text-[10.5px]">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Employee</th>
                  <th className="py-2 px-3">Event</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {auditLog.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted">No attendance scans recorded yet.</td>
                  </tr>
                ) : (
                  auditLog.slice(0, 10).map(log => (
                    <tr key={log.id} className="hover:bg-surface2/30 transition text-[11px]">
                      <td className="py-2 px-3 text-muted whitespace-nowrap font-data">
                        {new Date(log.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2 px-3 truncate max-w-[130px]">
                        <span className="font-semibold text-ink block truncate">{log.employeeName || log.employeeId || "System"}</span>
                        <span className="text-[10px] text-muted">{log.employeeId}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`font-semibold capitalize ${
                          log.type === "check-in" ? "text-good" :
                          log.type === "check-out" ? "text-accent" :
                          log.type === "scan_rejected" ? "text-bad" : "text-muted"
                        }`}>
                          {log.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted text-[10.5px]">
                        {log.status || log.reason || "--"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Fullscreen Kiosk Portal */}
      <QrKioskModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
};
