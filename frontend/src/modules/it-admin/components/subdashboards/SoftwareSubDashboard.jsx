import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { ProgressBar } from '../shared/ProgressBar';
import { IconCheck, IconLaptop, IconArrowRight } from '../shared/Icons';

export function SoftwareSubDashboard({ onBack }) {
  const {
    software,
    markLicenceRenewed,
    reclaimUnusedSeats,
    adjustSoftwareSeats,
    navigate,
    setActiveDrawer,
    hasPermission
  } = useStore();
  const canReadSoftware = hasPermission('Software', 'read');
  const canWriteSoftware = hasPermission('Software', 'write');
  const canUpdateSoftware = hasPermission('Software', 'update');

  const [activeTab, setActiveTab] = useState('all');

  // Expiring licences (<60 days)
  const expiringLicences = software.filter(s => s.daysToRenewal <= 60 && s.status !== 'renewed');

  // Unused licence simulation (>30 days inactive)
  const unusedLicences = [
    { id: 'sft-figma', softwareId: software.find(s => s.name.includes('Figma'))?.id || software[0]?.id, name: 'Figma Enterprise', idleUsers: 4, monthlyCostSavings: '₹14,400 / mo', reason: 'No editor login > 45 days' },
    { id: 'sft-jetbrains', softwareId: software.find(s => s.name.includes('JetBrains'))?.id || software[1]?.id, name: 'JetBrains All Products Pack', idleUsers: 3, monthlyCostSavings: '₹22,500 / mo', reason: 'IDE uninstalled or dormant' },
    { id: 'sft-slack', softwareId: software.find(s => s.name.includes('Slack'))?.id || software[2]?.id, name: 'Slack Business+', idleUsers: 5, monthlyCostSavings: '₹6,250 / mo', reason: 'Contractor accounts deactivated' }
  ];

  // Total annual software expenditure
  const totalSpend = software.reduce((sum, s) => sum + s.costPerYear, 0);

  if (!canReadSoftware) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Software Operations Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Software: read permission.</p>
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
              Software Licences & Usage Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Licence renewal countdowns, seat capacity tracking, and automated idle seat reclamation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canWriteSoftware && <Button
            variant="secondary"
            onClick={() => setActiveDrawer('add_licence')}
            ariaLabel="Add software licence"
          >
            + Add Licence
          </Button>}
          {canReadSoftware && <Button
            variant="primary"
            onClick={() => navigate('licences')}
            ariaLabel="Open software catalog"
          >
            Full Catalog
          </Button>}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Managed Licences</span>
          <span className="font-display font-bold text-[24px] text-ink">{software.length}</span>
          <span className="text-[11px] text-accent">Active SaaS & Enterprise</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Total Annual Run-Rate</span>
          <span className="font-display font-bold text-[24px] text-ink">₹{(totalSpend / 100000).toFixed(2)} L</span>
          <span className="text-[11px] text-muted">FY 2026--27 budget</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Renewal Alerts</span>
          <span className="font-display font-bold text-[24px] text-warn">{expiringLicences.length}</span>
          <span className="text-[11px] text-muted">Expiring in &lt; 60 days</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Reclaimable Seats</span>
          <span className="font-display font-bold text-[24px] text-good">12</span>
          <span className="text-[11px] text-good">₹43,150 / mo savings</span>
        </div>
      </div>

      {/* Expiry Notifications Banner & Inactive Seat Reclamation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Licence Expiration Notifications */}
        <Card
          title="Licence Expiry & Renewal Alerts"
          subText="Impending contract renewal sunsets requiring procurement authorization"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {expiringLicences.map((s) => (
              <div key={s.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">{s.name}</span>
                    <Tag>{s.category}</Tag>
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <span>Renewal: <strong className="text-warn font-data">{s.renewalDate}</strong></span>
                    <span>•</span>
                    <span className="text-warn font-semibold">{s.daysToRenewal} days remaining</span>
                  </div>
                  <span className="text-[11px] text-muted font-data">Cost: {s.costFormatted} / year</span>
                </div>

                {canUpdateSoftware && <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => markLicenceRenewed(s.id)}
                  ariaLabel="Mark licence renewed"
                  className="shrink-0 text-accent hover:border-accent"
                >
                  Renew FY 27-28
                </Button>}
              </div>
            ))}
            {expiringLicences.length === 0 && (
              <p className="py-4 text-[13px] text-good text-center font-semibold">
                ✓ All enterprise software licences are fully renewed for the fiscal year.
              </p>
            )}
          </div>
        </Card>

        {/* Unused Licence Detection & Cost Reclamation */}
        <Card
          title="Idle Licence Detection & Seat Reclamation"
          subText="Automated zero-usage detection for accounts with no login activity > 30 days"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {unusedLicences.map((item) => (
              <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{item.name}</span>
                    <span className="text-[11px] font-bold text-bad bg-bad/15 px-2 py-0.5 rounded-full border border-bad/30">
                      {item.idleUsers} Inactive Seats
                    </span>
                  </div>
                  <span className="text-[11px] text-muted">{item.reason}</span>
                  <span className="text-[11px] text-good font-data font-semibold">
                    Potential Savings: {item.monthlyCostSavings}
                  </span>
                </div>

                {canUpdateSoftware && <Button
                  variant="primary"
                  size="sm"
                  onClick={() => reclaimUnusedSeats(item.softwareId, item.idleUsers)}
                  ariaLabel="Reclaim unused seats"
                  className="shrink-0"
                >
                  Reclaim {item.idleUsers} Seats
                </Button>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Usage Tracking vs Capacity Grid */}
      <Card
        title="Software Capacity & Seat Utilization"
        subText="Real-time allocated vs total provisioned seats across all vendors"
        action={
          <div className="flex items-center gap-1.5">
            {['all', 'Productivity', 'Engineering', 'Security'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-full border transition-colors ${
                  activeTab === cat
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface2 text-muted border-line hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Software Title</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Vendor</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Licence Type</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Seat Utilization</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Annual Cost</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold text-right">Quick Allocation</th>
              </tr>
            </thead>
            <tbody>
              {software
                .filter(s => activeTab === 'all' || s.category === activeTab)
                .slice(0, 8)
                .map((s) => {
                  const percent = Math.round((s.seatsUsed / s.totalSeats) * 100);
                  const isHigh = percent >= 90;

                  return (
                    <tr key={s.id} className="border-b border-dashed border-line hover:bg-surface2 transition-colors">
                      <td className="py-2.5">
                        <span className="font-semibold text-ink">{s.name}</span>
                      </td>
                      <td className="py-2.5 text-muted">{s.vendor}</td>
                      <td className="py-2.5">
                        <Tag>{s.licenceType}</Tag>
                      </td>
                      <td className="py-2.5">
                        <div className="w-40">
                          <ProgressBar
                            value={s.seatsUsed}
                            max={s.totalSeats}
                            status={isHigh ? 'bad' : percent > 75 ? 'warn' : 'accent'}
                          />
                          <span className="text-[10px] text-muted font-data mt-0.5 block">
                            {s.seatsUsed} / {s.totalSeats} seats ({percent}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 font-data text-ink font-semibold">{s.costFormatted}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdateSoftware && <button
                            onClick={() => adjustSoftwareSeats(s.id, 1)}
                            disabled={s.seatsUsed >= s.totalSeats}
                            className="w-6 h-6 rounded bg-surface2 border border-line text-ink hover:border-accent disabled:opacity-40 text-[12px] font-bold"
                            title="Assign seat"
                          >
                            +
                          </button>}
                          {canUpdateSoftware && <button
                            onClick={() => adjustSoftwareSeats(s.id, -1)}
                            disabled={s.seatsUsed <= 0}
                            className="w-6 h-6 rounded bg-surface2 border border-line text-ink hover:border-accent disabled:opacity-40 text-[12px] font-bold"
                            title="Unassign seat"
                          >
                            -
                          </button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
