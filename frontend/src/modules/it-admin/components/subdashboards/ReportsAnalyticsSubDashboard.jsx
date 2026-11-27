import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { ProgressBar } from '../shared/ProgressBar';
import { SegmentedBar } from '../shared/SegmentedBar';
import { IconCheck, IconArrowRight } from '../shared/Icons';

export function ReportsAnalyticsSubDashboard({ onBack }) {
  const {
    users,
    assets,
    tickets,
    software,
    scheduledReports,
    toggleScheduledReport,
    triggerScheduledReportRun,
    navigate,
    showToast,
    hasPermission
  } = useStore();
  const canReadReports = hasPermission('Reports', 'read');
  const canWriteReports = hasPermission('Reports', 'write');
  const canUpdateReports = hasPermission('Reports', 'update');
  const canReadAssets = hasPermission('Assets', 'read');
  const canReadHelpdesk = hasPermission('Helpdesk', 'read');
  const canReadUsers = hasPermission('User Profiles', 'read');

  const [exportFormat, setExportFormat] = useState('csv');

  // Multi-metric statistics
  const totalAssetCost = assets.reduce((sum, a) => sum + a.cost, 0);
  const totalSoftwareCost = software.reduce((sum, s) => sum + s.costPerYear, 0);

  // Asset breakdown for segmented bar
  const assignedCount = assets.filter(a => a.status === 'assigned').length;
  const inStockCount = assets.filter(a => a.status === 'in stock').length;
  const repairCount = assets.filter(a => a.status === 'in repair').length;
  const retiredCount = assets.filter(a => a.status === 'retired').length;

  const assetSegments = [
    { label: 'Assigned', count: assignedCount, color: 'var(--info)' },
    { label: 'In Stock', count: inStockCount, color: 'var(--good)' },
    { label: 'In Repair', count: repairCount, color: 'var(--warn)' },
    { label: 'Retired', count: retiredCount, color: 'var(--bad)' },
  ];

  // Ticket priority breakdown
  const criticalCount = tickets.filter(t => t.priority === 'critical').length;
  const highCount = tickets.filter(t => t.priority === 'high').length;
  const mediumCount = tickets.filter(t => t.priority === 'medium').length;
  const lowCount = tickets.filter(t => t.priority === 'low').length;

  const ticketSegments = [
    { label: 'Critical', count: criticalCount, color: 'var(--bad)' },
    { label: 'High', count: highCount, color: 'var(--warn)' },
    { label: 'Medium', count: mediumCount, color: 'var(--info)' },
    { label: 'Low', count: lowCount, color: 'var(--muted)' },
  ];

  // Real CSV export generator
  const handleExportCSV = (datasetName) => {
    const requiredModule = {
      assets: 'Assets',
      tickets: 'Helpdesk',
      users: 'User Profiles',
    }[datasetName];
    if (!canReadReports || !requiredModule || !hasPermission(requiredModule, 'read')) {
      showToast('Exporting this dataset requires Reports: read and source-module read permission.');
      return;
    }

    let csvContent = '';
    let filename = '';

    if (datasetName === 'assets') {
      csvContent = 'AssetTag,Model,Type,Serial,PurchaseDate,WarrantyEnd,Status,Location,Cost,AssignedTo\n';
      assets.forEach(a => {
        csvContent += `"${a.assetTag}","${a.model}","${a.type}","${a.serial}","${a.purchaseDate}","${a.warrantyEnd}","${a.status}","${a.location}",${a.cost},"${a.assignedName || 'Unassigned'}"\n`;
      });
      filename = 'it_assets_inventory_export.csv';
    } else if (datasetName === 'tickets') {
      csvContent = 'TicketID,Requester,Title,Category,Priority,Status,Age,CreatedAt\n';
      tickets.forEach(t => {
        csvContent += `"${t.id}","${t.requesterName}","${t.title.replace(/"/g, '""')}","${t.category}","${t.priority}","${t.status}","${t.age}","${t.createdAt}"\n`;
      });
      filename = 'it_support_tickets_export.csv';
    } else {
      csvContent = 'ID,Name,Department,Role,Email,Status,Location,DeviceCount\n';
      users.forEach(u => {
        csvContent += `"${u.id}","${u.name}","${u.department}","${u.role}","${u.email}","${u.status}","${u.location}",${u.deviceCount}\n`;
      });
      filename = 'it_user_accounts_export.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully`);
  };

  const handlePrintPdf = () => {
    if (!canReadReports) return;
    window.print();
  };

  if (!canReadReports) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Analytics Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Reports: read permission.</p>
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
              IT Reports & Cross-Module Analytics Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Scheduled automated reporting pipelines, multi-format export engine, and operational business intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handlePrintPdf}
            ariaLabel="Print PDF"
          >
            Print / PDF View
          </Button>
          {canReadAssets && <Button
            variant="primary"
            onClick={() => handleExportCSV('assets')}
            ariaLabel="Export to Excel"
          >
            Export XLSX (CSV)
          </Button>}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {canReadAssets && <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Total Capital Asset Base</span>
          <span className="font-display font-bold text-[24px] text-ink">₹{(totalAssetCost / 10000000).toFixed(2)} Cr</span>
          <span className="text-[11px] text-accent">{assets.length} monitored hardware assets</span>
        </div>}
        {hasPermission('Software', 'read') && <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Annual Software Spend</span>
          <span className="font-display font-bold text-[24px] text-ink">₹{(totalSoftwareCost / 100000).toFixed(2)} L</span>
          <span className="text-[11px] text-muted">FY 2026--27 Run-Rate</span>
        </div>}
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Scheduled Pipelines</span>
          <span className="font-display font-bold text-[24px] text-good">
            {scheduledReports.filter(r => r.active).length} Active
          </span>
          <span className="text-[11px] text-muted">Automated cron deliveries</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Mean Resolution Time</span>
          <span className="font-display font-bold text-[24px] text-accent2">3.2 Hours</span>
          <span className="text-[11px] text-good">-18% vs last quarter</span>
        </div>
      </div>

      {/* Grid: Scheduled Reports & On-Demand Data Exporter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scheduled Automated Reports */}
        <Card
          title="Scheduled Automated Report Pipelines"
          subText="Automated cron deliveries dispatched directly to stakeholder inboxes"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {scheduledReports.map((report) => (
              <div key={report.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">{report.name}</span>
                    <Tag>{report.format}</Tag>
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <span>Cadence: <strong className="text-ink font-semibold">{report.cadence}</strong></span>
                    <span>•</span>
                    <span className="truncate">To: {report.recipient}</span>
                  </div>
                  <span className="text-[10px] text-muted font-data">Last Dispatched: {report.lastRun}</span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold ${report.active ? 'text-good' : 'text-muted'}`}>
                      {report.active ? 'Active' : 'Paused'}
                    </span>
                    {canUpdateReports && <input
                      type="checkbox"
                      checked={report.active}
                      onChange={() => toggleScheduledReport(report.id)}
                      style={{ accentColor: 'var(--accent)' }}
                      className="w-4 h-4 cursor-pointer"
                    />}
                  </div>
                  {canWriteReports && <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => triggerScheduledReportRun(report.id)}
                    ariaLabel="Dispatch report now"
                  >
                    Run Now
                  </Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* On-Demand Data Export Center */}
        <Card
          title="On-Demand Data Export Center"
          subText="Direct export of sanitized datasets for auditor compliance and executive presentations"
        >
          <div className="flex flex-col gap-3 text-[13px]">
            {canReadAssets && <div className="p-3 bg-surface2 rounded-[var(--radius)] border border-line flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-ink block">Hardware Inventory & Depreciation</span>
                <span className="text-[11px] text-muted">Complete serials, warranty dates, custodian assignments, and asset valuations</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportCSV('assets')}
                ariaLabel="Export hardware inventory"
              >
                CSV
              </Button>
            </div>}

            {canReadHelpdesk && <div className="p-3 bg-surface2 rounded-[var(--radius)] border border-line flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-ink block">Helpdesk Incident & Resolution Audit</span>
                <span className="text-[11px] text-muted">SLA turnaround metrics, priority breakdowns, category MTTR, and CSAT scores</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportCSV('tickets')}
                ariaLabel="Export tickets report"
              >
                CSV
              </Button>
            </div>}

            {canReadUsers && <div className="p-3 bg-surface2 rounded-[var(--radius)] border border-line flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-ink block">Employee Accounts & Identity Governance</span>
                <span className="text-[11px] text-muted">Provisioning status, department allocation, and assigned device counts</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportCSV('users')}
                ariaLabel="Export user accounts"
              >
                CSV
              </Button>
            </div>}
          </div>
        </Card>
      </div>

      {/* Advanced Multi-Metric Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hardware Status Distribution */}
        {canReadAssets && <Card
          title="Hardware Asset Allocation Status"
          subText="Current distribution across active, reserve in stock, maintenance, and retired inventory"
        >
          <div className="flex flex-col gap-3">
            <SegmentedBar segments={assetSegments} height={16} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[12px]">
              {assetSegments.map((s, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-muted text-[11px]">{s.label}</span>
                  <span className="font-data font-bold text-ink text-[14px]">{s.count} units</span>
                  <span className="text-[10px] text-muted">
                    {Math.round((s.count / assets.length) * 100)}% of fleet
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>}

        {/* Ticket Incident Severity Distribution */}
        {canReadHelpdesk && <Card
          title="Support Ticket Priority Distribution"
          subText="Breakdown of support demand volume categorized by operational severity"
        >
          <div className="flex flex-col gap-3">
            <SegmentedBar segments={ticketSegments} height={16} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[12px]">
              {ticketSegments.map((s, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-muted text-[11px]">{s.label}</span>
                  <span className="font-data font-bold text-ink text-[14px]">{s.count} tickets</span>
                  <span className="text-[10px] text-muted">
                    {Math.round((s.count / tickets.length) * 100)}% volume
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>}
      </div>
    </div>
  );
}
