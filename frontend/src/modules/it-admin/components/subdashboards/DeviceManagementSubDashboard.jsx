import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { StatusPill } from '../shared/StatusPill';
import { ProgressBar } from '../shared/ProgressBar';
import { IconLaptop, IconCheck, IconShield, IconClock } from '../shared/Icons';

export function DeviceManagementSubDashboard({ onBack }) {
  const {
    assets,
    maintenanceSchedules,
    scheduleMaintenanceTask,
    completeMaintenanceTask,
    navigate,
    hasPermission
  } = useStore();
  const canReadAssets = hasPermission('Assets', 'read');
  const canScheduleMaintenance = hasPermission('Assets', 'write');
  const canUpdateAssets = hasPermission('Assets', 'update');

  const [filterType, setFilterType] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('Fleet (All Laptops)');
  const [newType, setNewType] = useState('OS Patch');
  const [newDate, setNewDate] = useState('28 Nov 2026, 03:00 IST');

  // Filtered assets
  const filteredAssets = assets.filter(a => {
    if (filterType === 'all') return true;
    return a.type.toLowerCase().includes(filterType.toLowerCase());
  });

  // Device health mock enrichment
  const getDeviceHealth = (asset) => {
    const isMac = asset.model.toLowerCase().includes('macbook');
    const hash = asset.assetTag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const battery = 80 + (hash % 20); // 80% - 99%
    const storageUsed = 45 + (hash % 45); // 45% - 90%
    const encrypted = hash % 7 !== 0; // Most encrypted
    return {
      battery,
      storageUsed,
      encrypted,
      encryptionType: isMac ? 'FileVault 2' : 'BitLocker XTS-256',
      osVersion: isMac ? 'macOS 15.1.1' : 'Windows 11 Pro 24H2',
      status: storageUsed > 85 ? 'Storage Low' : battery < 82 ? 'Service Battery' : 'Healthy'
    };
  };

  // Warranty alerts (e.g. expiring in 2026 or 2027)
  const warrantyExpiringSoon = assets.filter(a => a.warrantyEnd.includes('2026') || a.warrantyEnd.includes('2027'));

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!hasPermission('Assets', 'write')) return;
    if (!newTitle.trim()) return;
    scheduleMaintenanceTask({
      title: newTitle,
      target: newTarget,
      type: newType,
      scheduledDate: newDate
    });
    setNewTitle('');
    setShowScheduleModal(false);
  };

  if (!canReadAssets) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Device Management Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Assets: read permission.</p>
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
              Device Management & Health Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Live hardware telemetry, automated patch maintenance schedules, and warranty expiration pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canScheduleMaintenance && <Button
            variant="secondary"
            onClick={() => setShowScheduleModal(true)}
            icon={IconClock}
            ariaLabel="Schedule maintenance"
          >
            Schedule Patch
          </Button>}
          <Button
            variant="primary"
            onClick={() => navigate('inventory')}
            icon={IconLaptop}
            ariaLabel="Open asset inventory"
          >
            Inventory Grid
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Monitored Fleet</span>
          <span className="font-display font-bold text-[24px] text-ink">{assets.length}</span>
          <span className="text-[11px] text-good">100% MDM enrolled</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Disk Encryption</span>
          <span className="font-display font-bold text-[24px] text-accent">96.8%</span>
          <span className="text-[11px] text-muted">BitLocker & FileVault</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Active Maintenance</span>
          <span className="font-display font-bold text-[24px] text-accent2">{maintenanceSchedules.filter(m => m.status === 'scheduled').length}</span>
          <span className="text-[11px] text-muted">Jobs queued this week</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Warranty Pipeline</span>
          <span className="font-display font-bold text-[24px] text-warn">{warrantyExpiringSoon.length}</span>
          <span className="text-[11px] text-muted">Eligible for refresh</span>
        </div>
      </div>

      {/* Maintenance Schedule & Warranty Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maintenance Schedules */}
        <Card
          title="Maintenance & Patch Schedules"
          subText="Automated OS patching, firmware upgrades and hardware servicing"
          action={canScheduleMaintenance ? (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-[12px] text-accent hover:underline font-semibold"
            >
              + New Schedule
            </button>
          ) : null}
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {maintenanceSchedules.map((task) => (
              <div key={task.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">{task.title}</span>
                    <Tag>{task.type}</Tag>
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <span>Target: {task.target}</span>
                    <span>•</span>
                    <span className="font-data">{task.scheduledDate}</span>
                  </div>
                  <div className="w-48 mt-1">
                    <ProgressBar
                      value={task.compliancePercent}
                      max={100}
                      label={`Fleet compliance: ${task.compliancePercent}%`}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    task.status === 'completed'
                      ? 'bg-[var(--good)]/15 text-good border border-good/30'
                      : 'bg-surface2 text-accent border border-line'
                  }`}>
                    {task.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>
                  {task.status !== 'completed' && canUpdateAssets && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => completeMaintenanceTask(task.id)}
                      icon={IconCheck}
                      ariaLabel="Mark completed"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Warranty Expiration Alerts */}
        <Card
          title="Warranty Expiration Alerts"
          subText="Hardware nearing OEM warranty sunset requiring AMC or refresh"
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Asset Tag</th>
                  <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Model</th>
                  <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Assigned To</th>
                  <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold text-right">Warranty End</th>
                </tr>
              </thead>
              <tbody>
                {warrantyExpiringSoon.slice(0, 5).map((a) => (
                  <tr key={a.id} className="border-b border-dashed border-line hover:bg-surface2 transition-colors">
                    <td className="py-2.5 font-data font-semibold text-accent">{a.assetTag}</td>
                    <td className="py-2.5 text-ink truncate max-w-[140px]">{a.model}</td>
                    <td className="py-2.5 text-muted truncate max-w-[120px]">{a.assignedName || 'Unassigned'}</td>
                    <td className="py-2.5 text-right font-data text-warn">{a.warrantyEnd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Device Health Monitoring Fleet Table */}
      <Card
        title="Fleet Telemetry & Device Health Monitoring"
        subText="Live battery health, storage headroom, disk encryption, and OS versions across fleet"
        action={
          <div className="flex items-center gap-1.5">
            {['all', 'laptop', 'desktop', 'phone'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-full border transition-colors ${
                  filterType === type
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface2 text-muted border-line hover:text-ink'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Device / Tag</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Assigned User</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">OS Version</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Storage</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Battery</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Encryption</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold text-right">Health Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.slice(0, 8).map((asset) => {
                const health = getDeviceHealth(asset);
                return (
                  <tr key={asset.id} className="border-b border-dashed border-line hover:bg-surface2 transition-colors">
                    <td className="py-2.5">
                      <div className="flex flex-col">
                        <span className="font-data font-semibold text-accent">{asset.assetTag}</span>
                        <span className="text-[11px] text-muted truncate max-w-[160px]">{asset.model}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink">
                      {asset.assignedName || <span className="text-muted italic">In Stock</span>}
                    </td>
                    <td className="py-2.5 font-data text-muted text-[12px]">{health.osVersion}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <ProgressBar value={health.storageUsed} max={100} />
                        </div>
                        <span className="text-[11px] font-data text-muted">{health.storageUsed}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`font-data text-[12px] ${health.battery < 82 ? 'text-warn font-semibold' : 'text-good'}`}>
                        {health.battery}%
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${health.encrypted ? 'bg-good' : 'bg-bad'}`} />
                        <span className="text-[11px] text-muted">{health.encryptionType}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                        health.status === 'Healthy'
                          ? 'bg-[var(--good)]/15 text-good border border-good/30'
                          : 'bg-[var(--warn)]/15 text-warn border border-warn/30'
                      }`}>
                        {health.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Schedule Modal / Inline Drawer */}
      {canScheduleMaintenance && showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a222b] border border-line rounded-[var(--radius)] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-display font-bold text-[18px] text-ink">Schedule Maintenance Task</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Critical Zero-Day Vulnerability Hotfix"
                  className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink placeholder:text-muted/50 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Target Fleet</label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="OS Patch">OS Patch</option>
                    <option value="Firmware">Firmware</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Configuration">Configuration</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Schedule</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
