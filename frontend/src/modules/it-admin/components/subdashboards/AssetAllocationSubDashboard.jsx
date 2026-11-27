import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { StatusPill } from '../shared/StatusPill';
import { IconLaptop, IconQrCode, IconShield, IconArrowRight } from '../shared/Icons';

export function AssetAllocationSubDashboard({ onBack }) {
  const {
    assets,
    custodyHistory,
    lostStolenList,
    flagDeviceLost,
    remoteWipeDevice,
    navigate,
    setActiveDrawer,
    hasPermission
  } = useStore();
  const canReadAssets = hasPermission('Assets', 'read');
  const canUpdateAssets = hasPermission('Assets', 'update');
  const canWipeDevices = hasPermission('Security', 'delete');

  const [selectedAssetForQr, setSelectedAssetForQr] = useState(assets[0] || null);
  const [showScanSimulator, setShowScanSimulator] = useState(false);
  const [scannedInput, setScannedInput] = useState('');
  const [scannedResult, setScannedResult] = useState(null);

  // Lost device flag form modal
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagAssetTag, setFlagAssetTag] = useState('');
  const [flagNotes, setFlagNotes] = useState('');

  const handleScan = (e) => {
    e.preventDefault();
    const found = assets.find(a => a.assetTag.toLowerCase() === scannedInput.trim().toLowerCase());
    setScannedResult(found || 'NOT_FOUND');
  };

  const handleFlagSubmit = (e) => {
    e.preventDefault();
    if (!hasPermission('Assets', 'update')) return;
    if (!flagAssetTag) return;
    flagDeviceLost(flagAssetTag, flagNotes);
    setShowFlagModal(false);
    setFlagAssetTag('');
    setFlagNotes('');
  };

  if (!canReadAssets) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Asset Custody Restricted</h2>
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
              Asset Allocation & Custody Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              QR code physical asset tracking, custody transfer lifecycle, and lost/stolen MDM emergency triage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowScanSimulator(true)}
            icon={IconQrCode}
            ariaLabel="Simulate QR scan"
          >
            Scan Asset QR
          </Button>
          {canUpdateAssets && <Button
            variant="primary"
            onClick={() => setActiveDrawer('assign_asset')}
            icon={IconLaptop}
            ariaLabel="Assign asset"
          >
            Assign Device
          </Button>}
        </div>
      </div>

      {/* Grid: QR Code Generator & Lost/Stolen Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* QR Code Identification Card */}
        <Card
          title="Digital Asset Tag & QR Code Generator"
          subText="Generate scannable physical label tags with cryptographic verification"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
            {/* SVG Simulated QR Code */}
            <div className="p-3 bg-white rounded-xl shadow-lg shrink-0 flex flex-col items-center">
              <svg width="130" height="130" viewBox="0 0 100 100" fill="#06141c">
                {/* 3 Corner finder patterns */}
                <rect x="5" y="5" width="28" height="28" fill="#06141c" rx="4" />
                <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                <rect x="13" y="13" width="12" height="12" fill="#06141c" rx="2" />

                <rect x="67" y="5" width="28" height="28" fill="#06141c" rx="4" />
                <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                <rect x="75" y="13" width="12" height="12" fill="#06141c" rx="2" />

                <rect x="5" y="67" width="28" height="28" fill="#06141c" rx="4" />
                <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                <rect x="13" y="75" width="12" height="12" fill="#06141c" rx="2" />

                {/* Data dots pattern */}
                <rect x="38" y="10" width="5" height="5" />
                <rect x="48" y="15" width="6" height="6" />
                <rect x="38" y="25" width="6" height="6" />
                <rect x="50" y="30" width="5" height="5" />
                <rect x="10" y="42" width="6" height="6" />
                <rect x="22" y="45" width="5" height="5" />
                <rect x="38" y="42" width="8" height="8" fill="#0a4d52" />
                <rect x="52" y="42" width="8" height="8" />
                <rect x="70" y="45" width="6" height="6" />
                <rect x="85" y="40" width="6" height="6" />
                <rect x="40" y="65" width="6" height="6" />
                <rect x="55" y="68" width="5" height="5" />
                <rect x="70" y="72" width="8" height="8" />
                <rect x="85" y="80" width="6" height="6" />
                <rect x="42" y="82" width="6" height="6" />
                <rect x="55" y="85" width="6" height="6" />
              </svg>
              <span className="font-mono text-[10px] text-gray-800 font-bold mt-1 tracking-wider">
                {selectedAssetForQr?.assetTag || 'LT-0101'}
              </span>
            </div>

            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <label className="text-[11px] uppercase tracking-wider text-muted font-bold">Select Device</label>
              <select
                value={selectedAssetForQr?.id || ''}
                onChange={(e) => {
                  const a = assets.find(x => x.id === e.target.value);
                  setSelectedAssetForQr(a);
                }}
                className="px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#0a222b]">
                    {a.assetTag} — {a.model} ({a.assignedName || 'In Stock'})
                  </option>
                ))}
              </select>

              {selectedAssetForQr && (
                <div className="flex flex-col gap-1 text-[12px] bg-surface2/60 p-2.5 rounded-[var(--radius)] border border-line mt-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Serial:</span>
                    <span className="font-data text-ink font-semibold">{selectedAssetForQr.serial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Assigned Custodian:</span>
                    <span className="text-accent font-semibold">{selectedAssetForQr.assignedName || 'Inventory Store'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Location:</span>
                    <span className="text-ink">{selectedAssetForQr.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Lost / Stolen Device Emergency Tracking */}
        <Card
          title="Lost & Stolen Asset Tracking & Remote Lock"
          subText="Emergency zero-trust containment: cryptographic lock & remote storage wipe"
          action={canUpdateAssets ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFlagModal(true)}
              ariaLabel="Flag device lost"
            >
              Flag Stolen Device
            </Button>
          ) : null}
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {lostStolenList.map((item, idx) => (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-data font-bold text-bad">{item.assetTag}</span>
                    <Tag>{item.model}</Tag>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status.includes('Wiped')
                        ? 'bg-bad/20 text-bad border border-bad/30'
                        : 'bg-warn/20 text-warn border border-warn/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">{item.notes}</p>
                  <span className="text-[10px] text-muted font-data">Last Seen: {item.lastSeenLocation} · Flagged: {item.flaggedDate}</span>
                </div>

                {!item.status.includes('Wiped') && canWipeDevices && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => remoteWipeDevice(item.assetTag)}
                    ariaLabel="Trigger remote cryptographic wipe"
                    className="border-bad/40 text-bad hover:bg-bad/15 shrink-0"
                  >
                    Wipe Device
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Asset Transfer & Custody History Log */}
      <Card
        title="Asset Custody Transfer History"
        subText="Verifiable chain of custody audit trail between employees and IT store"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('allocate')}
            ariaLabel="Open allocation page"
          >
            <span>Full History</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Button>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Asset Tag</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Model</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Employee Custodian</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Assigned Date</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Return Date</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Condition</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Transfer Notes</th>
              </tr>
            </thead>
            <tbody>
              {custodyHistory.slice(0, 7).map((entry) => (
                <tr key={entry.id} className="border-b border-dashed border-line hover:bg-surface2 transition-colors">
                  <td className="py-2.5 font-data font-semibold text-accent">{entry.assetTag}</td>
                  <td className="py-2.5 text-ink truncate max-w-[140px]">{entry.model}</td>
                  <td className="py-2.5 text-ink font-semibold">{entry.userName}</td>
                  <td className="py-2.5 font-data text-muted text-[12px]">{entry.assignedDate}</td>
                  <td className="py-2.5 font-data text-muted text-[12px]">
                    {entry.returnDate || <span className="text-good font-semibold">Currently Active</span>}
                  </td>
                  <td className="py-2.5">
                    <span className="capitalize text-[12px] text-muted">{entry.conditionAtIssue}</span>
                  </td>
                  <td className="py-2.5 text-muted text-[12px] max-w-[200px] truncate">{entry.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Flag Lost Modal */}
      {canUpdateAssets && showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a222b] border border-line rounded-[var(--radius)] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-display font-bold text-[18px] text-bad">Emergency: Report Lost / Stolen Device</h3>
            <form onSubmit={handleFlagSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Select Asset Tag</label>
                <select
                  required
                  value={flagAssetTag}
                  onChange={(e) => setFlagAssetTag(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                >
                  <option value="">Select device...</option>
                  {assets.filter(a => a.status === 'assigned').map(a => (
                    <option key={a.id} value={a.assetTag} className="bg-[#0a222b]">
                      {a.assetTag} — {a.model} ({a.assignedName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Incident Report Notes</label>
                <textarea
                  rows={3}
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  placeholder="Describe location, police complaint ID if any, or circumstances..."
                  className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowFlagModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" className="bg-bad text-black font-bold">Dispatch Lock</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Simulator Modal */}
      {showScanSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a222b] border border-line rounded-[var(--radius)] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-[18px] text-ink">Asset Barcode / QR Scanner</h3>
              <button onClick={() => setShowScanSimulator(false)} className="text-muted hover:text-ink text-[16px]">✕</button>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-accent/40 bg-surface flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 border-2 border-accent border-dashed rounded-lg animate-pulse flex items-center justify-center text-accent">
                <IconQrCode className="w-8 h-8" />
              </div>
              <p className="text-[12px] text-muted mt-2">Point scanner or type asset tag below</p>
            </div>

            <form onSubmit={handleScan} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. LT-0102"
                value={scannedInput}
                onChange={(e) => setScannedInput(e.target.value)}
                className="flex-1 px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
              />
              <Button variant="primary" type="submit">Lookup</Button>
            </form>

            {scannedResult === 'NOT_FOUND' && (
              <p className="text-[12px] text-bad font-semibold">No asset matching "{scannedInput}" in inventory database.</p>
            )}

            {scannedResult && scannedResult !== 'NOT_FOUND' && (
              <div className="p-3 bg-surface2 rounded-[var(--radius)] border border-line flex flex-col gap-1 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="font-data font-bold text-accent">{scannedResult.assetTag}</span>
                  <StatusPill status={scannedResult.status} />
                </div>
                <span className="text-ink font-semibold">{scannedResult.model}</span>
                <span className="text-[12px] text-muted">Assigned to: {scannedResult.assignedName || 'In Stock'}</span>
                <span className="text-[11px] text-muted">Serial: {scannedResult.serial} · Loc: {scannedResult.location}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
