import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { StatusPill } from '../shared/StatusPill';
import { IconShield, IconCheck, IconArrowRight } from '../shared/Icons';

export function SecuritySessionsSubDashboard({ onBack }) {
  const {
    events,
    activeSessions,
    terminateSession,
    acknowledgeAlert,
    navigate,
    hasPermission
  } = useStore();
  const canReadSecurity = hasPermission('Security', 'read');
  const canUpdateSecurity = hasPermission('Security', 'update');
  const canDeleteSecurity = hasPermission('Security', 'delete');

  const [filterType, setFilterType] = useState('all');

  // Security anomaly alerts (unacknowledged and critical)
  const securityAlerts = events.filter(e => e.category === 'Alerts');
  const loginEvents = events.filter(e => e.category === 'Logins');

  if (!canReadSecurity) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Security Operations Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Security: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in-50 duration-200">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[var(--radius)] bg-surface border border-line">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1 text-[12px] rounded-full bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition-colors"
            >
              ← Back to Overview
            </button>
          )}
          <div>
            <h2 className="font-display font-bold text-[18px] text-ink leading-tight">
              Security Operations & Live Sessions Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Live IP geo-tracking, active session termination, suspicious login triage, and forensic audit trail
            </p>
          </div>
        </div>

        {canReadSecurity && <Button
          variant="primary"
          onClick={() => navigate('events')}
          icon={IconShield}
          ariaLabel="Open forensic security log"
        >
          Forensic Event Log
        </Button>}
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Live Active Sessions</span>
          <span className="font-display font-bold text-[24px] text-accent">{activeSessions.length}</span>
          <span className="text-[11px] text-muted">Zero-trust verified</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Unresolved Threats</span>
          <span className="font-display font-bold text-[24px] text-bad">
            {securityAlerts.filter(a => !a.acknowledged).length}
          </span>
          <span className="text-[11px] text-bad">Requires triage</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">MFA Challenge Rate</span>
          <span className="font-display font-bold text-[24px] text-good">99.4%</span>
          <span className="text-[11px] text-muted">FIDO2 / Hardware keys</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">VPN Traffic Ratio</span>
          <span className="font-display font-bold text-[24px] text-accent2">60%</span>
          <span className="text-[11px] text-muted">WireGuard mesh active</span>
        </div>
      </div>

      {/* Grid: Active Live Sessions & Suspicious Login Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Live Sessions Management */}
        <Card
          title="Active Live Sessions & Session Termination"
          subText="Real-time employee sessions with instant single-click zero-trust revocation"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {activeSessions.map((session) => (
              <div key={session.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{session.userName}</span>
                    {session.isVpn ? (
                      <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded border border-accent/30">
                        VPN Protected
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-muted bg-surface2 px-1.5 py-0.5 rounded border border-line">
                        Direct IP
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <span className="font-data font-semibold text-ink">{session.ip}</span>
                    <span>•</span>
                    <span>{session.location}</span>
                  </div>
                  <span className="text-[11px] text-muted font-data truncate max-w-xs">{session.device}</span>
                  <span className="text-[10px] text-muted/70 font-data">Started: {session.startedAt}</span>
                </div>

                {canDeleteSecurity && <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => terminateSession(session.id)}
                  ariaLabel="Terminate session"
                  className="border-bad/40 text-bad hover:bg-bad/15 shrink-0"
                >
                  Kill Session
                </Button>}
              </div>
            ))}
          </div>
        </Card>

        {/* Suspicious Login Alerts & Quarantine */}
        <Card
          title="Suspicious Login Alerts & Anomaly Quarantine"
          subText="Brute force detection, impossible travel, and unauthorized subnet probes"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {securityAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">{alert.userName}</span>
                    <span className="text-[11px] text-muted font-data">{alert.ip}</span>
                  </div>
                  <p className="text-[12px] text-bad font-semibold">{alert.event}</p>
                  <span className="text-[10px] text-muted font-data">{alert.time} · {alert.location}</span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusPill status={alert.result} />
                  {!alert.acknowledged && canUpdateSecurity && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                      icon={IconCheck}
                      ariaLabel="Acknowledge alert"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* IP Tracking & Forensic Audit Trails */}
      <Card
        title="IP Tracking & Enterprise Access Audit Trail"
        subText="Verifiable login telemetry across corporate offices, remote branches, and cloud infrastructure"
        action={
          <div className="flex items-center gap-1.5">
            {['all', 'success', 'failed login', 'blocked / suspicious'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterType(st)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-full border transition-colors ${
                  filterType === st
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface2 text-muted border-line hover:text-ink'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Timestamp</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">User Identity</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Source IP</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Location & ISP</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Event Description</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {loginEvents
                .filter(e => filterType === 'all' || e.result === filterType)
                .slice(0, 7)
                .map((ev) => (
                  <tr key={ev.id} className="border-b border-dashed border-line hover:bg-surface2 transition-colors">
                    <td className="py-2.5 font-data text-muted text-[12px] whitespace-nowrap">{ev.time}</td>
                    <td className="py-2.5 text-ink font-semibold">{ev.userName}</td>
                    <td className="py-2.5 font-data text-accent font-semibold">{ev.ip}</td>
                    <td className="py-2.5 text-muted">{ev.location}</td>
                    <td className="py-2.5 text-ink truncate max-w-[220px]">{ev.event}</td>
                    <td className="py-2.5 text-right">
                      <StatusPill status={ev.result} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
