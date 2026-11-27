import React, { useMemo, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Tag } from '../shared/Tag';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';

function getWarrantyStatus(warrantyEnd) {
  if (!warrantyEnd) return 'unknown';
  const dateParts = String(warrantyEnd).match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  const endDate = dateParts
    ? new Date(`${dateParts[2]} ${dateParts[1]}, ${dateParts[3]} 23:59:59`)
    : new Date(warrantyEnd);
  if (Number.isNaN(endDate.getTime())) return 'unknown';
  if (!dateParts) endDate.setHours(23, 59, 59, 999);
  return endDate >= new Date() ? 'compliant' : 'expired';
}

function maskLicenseKey(licenseKey) {
  return licenseKey ? `•••• ${licenseKey.slice(-4)}` : 'Not recorded';
}

export function HardwareSoftwareManagementPage() {
  const {
    assets,
    users,
    software,
    updateAsset,
    assignAsset,
    updateSoftwareLicence,
    recordSoftwareInstallation,
    setActiveDrawer,
    hasPermission,
    showToast,
  } = useStore();
  const canReadAssets = hasPermission('Assets', 'read');
  const canUpdateAssets = hasPermission('Assets', 'update');
  const canReadSoftware = hasPermission('Software', 'read');
  const canWriteSoftware = hasPermission('Software', 'write');
  const canUpdateSoftware = hasPermission('Software', 'update');
  const [activeView, setActiveView] = useState('overview');
  const viewTabRefs = useRef({});
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedSoftwareId, setSelectedSoftwareId] = useState('');
  const [selectedHardwareRecord, setSelectedHardwareRecord] = useState(null);
  const [selectedSoftwareRecord, setSelectedSoftwareRecord] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [hardwareSearch, setHardwareSearch] = useState('');
  const [softwareSearch, setSoftwareSearch] = useState('');
  const [assetEditor, setAssetEditor] = useState(null);
  const [softwareEditor, setSoftwareEditor] = useState(null);

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || assets[0];
  const selectedSoftware = software.find((item) => item.id === selectedSoftwareId) || software[0];
  const selectedHardwareEmployee = selectedHardwareRecord
    ? users.find((user) => user.id === (
      selectedHardwareRecord.assignedEmployeeId
      || selectedHardwareRecord.assignedToId
      || selectedHardwareRecord.assignedTo
    )) || users.find((user) => user.name === selectedHardwareRecord.assignedName)
    : null;
  const activeUsers = users.filter((user) => String(user.status).toLowerCase() === 'active');
  const visibleAssets = useMemo(() => assets.filter((asset) => (
    [asset.assetTag, asset.model, asset.type, asset.serial, asset.location, asset.assignedName]
      .some((value) => String(value || '').toLowerCase().includes(hardwareSearch.toLowerCase()))
  )), [assets, hardwareSearch]);
  const visibleSoftware = useMemo(() => software.filter((item) => (
    [item.name, item.vendor, item.version, item.subscriptionModel, item.licenceType]
      .some((value) => String(value || '').toLowerCase().includes(softwareSearch.toLowerCase()))
  )), [software, softwareSearch]);
  const linkedInstallations = selectedSoftware?.installationHistory?.filter((entry) => (
    entry.assetId === selectedAsset?.id || entry.assetTag === selectedAsset?.assetTag
  )) || [];
  const expiringLicences = software.filter((item) => (
    item.renewalStatus === 'expired' || item.status === 'expired' || item.daysToRenewal <= 60
  )).length;
  const warrantyIssues = assets.filter((asset) => getWarrantyStatus(asset.warrantyEnd) !== 'compliant').length;
  const categoryCount = new Set(assets.map((asset) => asset.type)).size;
  const availableViews = [
    { id: 'overview', label: 'Overview' },
    ...(canReadAssets ? [{ id: 'hardware', label: 'Hardware Telemetry' }] : []),
    ...(canReadSoftware ? [{ id: 'software', label: 'Software Governance' }] : []),
    ...(canReadAssets && canReadSoftware ? [{ id: 'operations', label: 'Synchronized Operations' }] : [])
  ];
  const currentView = availableViews.some((view) => view.id === activeView)
    ? activeView
    : 'overview';

  const selectView = (viewId) => {
    if (availableViews.some((view) => view.id === viewId)) setActiveView(viewId);
  };

  const handleViewTabKeyDown = (event) => {
    if (availableViews.length < 2) return;
    const currentIndex = availableViews.findIndex((view) => view.id === currentView);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % availableViews.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + availableViews.length) % availableViews.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = availableViews.length - 1;
    else return;

    event.preventDefault();
    const nextView = availableViews[nextIndex];
    selectView(nextView.id);
    viewTabRefs.current[nextView.id]?.focus();
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 min-h-[calc(100vh-8rem)] animate-in fade-in-50 duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight">
            {currentView === 'hardware' ? 'Hardware Telemetry'
              : currentView === 'software' ? 'Software Governance'
                : currentView === 'operations' ? 'Synchronized Device & Software Operations'
                  : 'Software and Hardware Management'}
          </h2>
          <p className="text-[14px] text-muted">
            {currentView === 'hardware'
              ? 'Review device inventory, assignments, specifications, and warranty coverage.'
              : currentView === 'software'
                ? 'Review software licenses, masked keys, renewals, subscriptions, and annual costs.'
                : currentView === 'operations'
                  ? 'Manage device allocation and software deployment as a dedicated workflow.'
                  : 'Choose a domain to open its dedicated, full-page management workspace.'}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Hardware and software management views"
        aria-orientation="horizontal"
        className="inline-flex w-full sm:w-auto p-1.5 gap-1.5 rounded-2xl bg-surface border border-line shadow-card overflow-x-auto"
      >
        {availableViews.map((view) => (
          <button
            key={view.id}
            ref={(element) => { viewTabRefs.current[view.id] = element; }}
            type="button"
            role="tab"
            id={`hardware-software-tab-${view.id}`}
            aria-selected={currentView === view.id}
            aria-controls="hardware-software-panel"
            tabIndex={currentView === view.id ? 0 : -1}
            onClick={() => selectView(view.id)}
            onKeyDown={handleViewTabKeyDown}
            className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-3 rounded-xl font-semibold transition-colors ${
              currentView === view.id
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <section
        role="tabpanel"
        id="hardware-software-panel"
        aria-labelledby={`hardware-software-tab-${currentView}`}
        tabIndex={0}
        className="flex flex-col gap-5 flex-1"
      >
      {currentView === 'overview' && <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {canReadAssets && <Card title="Hardware Assets" subText={`${categoryCount} device categories`}>
          <div className="font-display font-bold text-2xl text-ink">{assets.length}</div>
        </Card>}
        {canReadSoftware && <Card title="Software Tools" subText="Tracked subscriptions and licenses">
          <div className="font-display font-bold text-2xl text-ink">{software.length}</div>
        </Card>}
        {canReadAssets && <Card title="Warranty Issues" subText="Expired or unavailable coverage">
          <div className="font-display font-bold text-2xl text-warn">{warrantyIssues}</div>
        </Card>}
        {canReadSoftware && <Card title="License Attention" subText="Expired or due within 60 days">
          <div className="font-display font-bold text-2xl text-warn">{expiringLicences}</div>
        </Card>}
      </div>}

      {currentView === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          {canReadAssets && <Card title="Hardware Telemetry" subText="Dedicated device inventory and warranty workspace">
            <div className="flex flex-col justify-between gap-5 min-h-[190px]">
              <p className="text-[13px] text-muted">
                Review {assets.length} tracked devices across {categoryCount} categories, inspect assignment details, and update hardware records.
              </p>
              <Button variant="primary" className="w-full" onClick={() => selectView('hardware')}>
                Open Hardware Telemetry
              </Button>
            </div>
          </Card>}
          {canReadSoftware && <Card title="Software Governance" subText="Dedicated license, renewal, and subscription workspace">
            <div className="flex flex-col justify-between gap-5 min-h-[190px]">
              <p className="text-[13px] text-muted">
                Review {software.length} tracked titles, with {expiringLicences} licenses requiring renewal attention.
              </p>
              <Button variant="primary" className="w-full" onClick={() => selectView('software')}>
                Open Software Governance
              </Button>
            </div>
          </Card>}
          {canReadAssets && canReadSoftware && <Card title="Synchronized Operations" subText="Cross-domain device allocation and managed software deployment">
            <div className="flex flex-col justify-between gap-5 min-h-[190px]">
              <p className="text-[13px] text-muted">
                Pair a hardware asset with a software license to manage allocation, installations, and linked records.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => selectView('operations')}>
                Open Synchronized Operations
              </Button>
            </div>
          </Card>}
        </div>
      )}

      {currentView === 'hardware' && canReadAssets && (
        <Card title="Hardware Telemetry" subText="Desktop, laptop, and peripheral inventory with live assignment and warranty states">
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={hardwareSearch}
              onChange={(event) => setHardwareSearch(event.target.value)}
              placeholder="Search device, serial, employee, location..."
              aria-label="Search hardware"
              className="min-w-[220px] flex-1 px-3 py-2 text-[13px] rounded-lg bg-surface2 border border-line text-ink"
            />
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <table className="w-full min-w-[790px] text-left">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <th scope="col" className="py-2">Device</th>
                  <th scope="col" className="py-2">Specifications / Serial</th>
                  <th scope="col" className="py-2">Location</th>
                  <th scope="col" className="py-2">Allocation</th>
                  <th scope="col" className="py-2">Warranty</th>
                  <th scope="col" className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleAssets.map((asset) => {
                  const warrantyStatus = getWarrantyStatus(asset.warrantyEnd);
                  const active = selectedAsset?.id === asset.id;
                  return (
                    <tr
                      key={asset.id}
                      tabIndex={0}
                      aria-label={`View hardware telemetry for ${asset.assetTag || asset.assetId}`}
                      onClick={() => {
                        setSelectedAssetId(asset.id);
                        setSelectedHardwareRecord(asset);
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedAssetId(asset.id);
                          setSelectedHardwareRecord(asset);
                        }
                      }}
                      className={`border-b border-line/60 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${active ? 'bg-surface2' : 'hover:bg-surface2/50'}`}
                    >
                      <td className="py-2.5 pr-2">
                        <span className="block font-semibold text-ink">{asset.model || asset.name}</span>
                        <span className="text-[11px] text-muted font-data">{asset.assetTag || asset.assetId} · {asset.type || asset.category}</span>
                      </td>
                      <td className="py-2.5 pr-2 text-[12px] text-muted">
                        <span className="block">{asset.specifications || asset.model || asset.name}</span>
                        <span className="font-data">{asset.serial || 'Serial not recorded'}</span>
                      </td>
                      <td className="py-2.5 pr-2 text-[12px] text-ink">{asset.location || 'Not set'}</td>
                      <td className="py-2.5 pr-2">
                        <StatusPill status={asset.status} label={asset.assignedName ? `Assigned: ${asset.assignedName}` : asset.status} />
                      </td>
                      <td className="py-2.5 pr-2">
                        <StatusPill status={warrantyStatus === 'compliant' ? 'active' : warrantyStatus === 'expired' ? 'expired' : 'pending'} label={warrantyStatus === 'compliant' ? `Covered to ${asset.warrantyEnd}` : warrantyStatus === 'expired' ? `Expired ${asset.warrantyEnd}` : 'Not recorded'} />
                      </td>
                      <td className="py-2.5">
                        {canUpdateAssets && <Button variant="secondary" size="sm" onClick={(event) => { event.stopPropagation(); setAssetEditor({ ...asset }); }}>Update</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentView === 'software' && canReadSoftware && (
        <Card title="Software Governance" subText="Masked license keys, expiry, subscription model, renewal status, and annual cost">
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={softwareSearch}
              onChange={(event) => setSoftwareSearch(event.target.value)}
              placeholder="Search software, vendor, version..."
              aria-label="Search software"
              className="min-w-[220px] flex-1 px-3 py-2 text-[13px] rounded-lg bg-surface2 border border-line text-ink"
            />
            {canWriteSoftware && <Button variant="primary" onClick={() => setActiveDrawer('add_licence')}>Add Software</Button>}
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <th scope="col" className="py-2">Software / Version</th>
                  <th scope="col" className="py-2">License Key</th>
                  <th scope="col" className="py-2">Subscription</th>
                  <th scope="col" className="py-2">Expiry / Renewal</th>
                  <th scope="col" className="py-2">Annual Cost</th>
                  <th scope="col" className="py-2">Status</th>
                  <th scope="col" className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleSoftware.map((item) => {
                  const active = selectedSoftware?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      aria-label={`View software governance for ${item.name}`}
                      onClick={() => {
                        setSelectedSoftwareId(item.id);
                        setSelectedSoftwareRecord(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedSoftwareId(item.id);
                          setSelectedSoftwareRecord(item);
                        }
                      }}
                      className={`border-b border-line/60 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${active ? 'bg-surface2' : 'hover:bg-surface2/50'}`}
                    >
                      <td className="py-2.5 pr-2">
                        <span className="block font-semibold text-ink">{item.name}</span>
                        <span className="text-[11px] text-muted">{item.vendor} · v{item.version || 'Cloud'}</span>
                      </td>
                      <td className="py-2.5 pr-2 text-[12px] font-data text-muted">{maskLicenseKey(item.licenseKey)}</td>
                      <td className="py-2.5 pr-2"><Tag>{item.subscriptionModel || item.licenceType}</Tag></td>
                      <td className="py-2.5 pr-2 text-[12px] text-muted">{item.expiryDate || item.renewalDate || 'Not set'}</td>
                      <td className="py-2.5 pr-2 text-[12px] font-data text-ink">₹{(item.annualCost ?? item.costPerYear).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 pr-2"><StatusPill status={item.renewalStatus || item.status} /></td>
                      <td className="py-2.5">{canUpdateSoftware && <Button variant="secondary" size="sm" onClick={(event) => { event.stopPropagation(); setSoftwareEditor({ ...item }); }}>Update</Button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentView === 'operations' && canReadAssets && canReadSoftware && <Card title="Synchronized Device & Software Operations" subText="Queue a managed install for the selected pair, or allocate the selected asset through custody tracking">
        {selectedAsset && selectedSoftware ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div className="p-4 rounded-xl bg-surface2/50 border border-line">
              <span className="text-[11px] uppercase tracking-wider text-muted">Selected Hardware</span>
              <h3 className="font-bold text-ink mt-1">{selectedAsset.model || selectedAsset.name}</h3>
              <p className="text-[12px] text-muted">{selectedAsset.assetTag} · {selectedAsset.serial} · {selectedAsset.location}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusPill status={selectedAsset.status} />
                <StatusPill
                  status={getWarrantyStatus(selectedAsset.warrantyEnd) === 'compliant' ? 'active' : getWarrantyStatus(selectedAsset.warrantyEnd) === 'expired' ? 'expired' : 'pending'}
                  label={`Warranty ${getWarrantyStatus(selectedAsset.warrantyEnd)}${selectedAsset.warrantyEnd ? ` · ${selectedAsset.warrantyEnd}` : ''}`}
                />
              </div>
            </div>
            <div className="hidden lg:block text-accent text-2xl" aria-hidden="true">↔</div>
            <div className="p-4 rounded-xl bg-surface2/50 border border-line">
              <span className="text-[11px] uppercase tracking-wider text-muted">Selected Software</span>
              <h3 className="font-bold text-ink mt-1">{selectedSoftware.name} · v{selectedSoftware.version || 'Cloud'}</h3>
              <p className="text-[12px] text-muted">{maskLicenseKey(selectedSoftware.licenseKey)} · {selectedSoftware.subscriptionModel || selectedSoftware.licenceType} · {selectedSoftware.expiryDate || selectedSoftware.renewalDate || 'Expiry not set'}</p>
              <p className="text-[12px] font-data text-accent mt-1">₹{(selectedSoftware.annualCost ?? selectedSoftware.costPerYear).toLocaleString('en-IN')} / year</p>
            </div>
            <div className="lg:col-span-3 flex flex-wrap items-end gap-3 border-t border-line pt-4">
              {selectedAsset.status === 'in stock' ? (
                <label className="flex flex-col gap-1 text-[12px] text-muted">
                  Allocate device to active employee
                  <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="min-w-[230px] px-3 py-2 rounded-lg bg-surface2 border border-line text-ink">
                    <option value="">Select employee</option>
                    {activeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.department}</option>)}
                  </select>
                </label>
              ) : (
                <p className="text-[12px] text-muted">Allocation is managed through the custody-aware Asset Allocation workflow for this device.</p>
              )}
              {canUpdateAssets && selectedAsset.status === 'in stock' && (
                <Button variant="secondary" disabled={!selectedUserId} onClick={() => {
                  assignAsset(selectedAsset.id, selectedUserId, selectedAsset.condition || 'good');
                  setSelectedUserId('');
                }}>Allocate Asset</Button>
              )}
              {canUpdateSoftware && <Button variant="primary" disabled={!['in stock', 'assigned'].includes(selectedAsset.status)} onClick={() => {
                const assignedUser = users.find((user) => user.id === selectedAsset.assignedTo);
                recordSoftwareInstallation(selectedSoftware.id, {
                  assetId: selectedAsset.id,
                  assetTag: selectedAsset.assetTag || selectedAsset.assetId,
                  serial: selectedAsset.serial,
                  location: selectedAsset.location,
                  userId: selectedAsset.assignedTo || null,
                  userName: assignedUser?.name || selectedAsset.assignedName || 'Unassigned device',
                  method: 'Managed device deployment',
                  status: 'Queued',
                });
              }}>Queue Install</Button>}
              {canUpdateAssets && <Button variant="secondary" onClick={() => setAssetEditor({ ...selectedAsset })}>Update Hardware</Button>}
              {canUpdateSoftware && <Button variant="secondary" onClick={() => setSoftwareEditor({ ...selectedSoftware })}>Update Software</Button>}
              <div className="ml-auto text-[12px] text-muted">
                Linked install records: <strong className="text-ink">{linkedInstallations.length}</strong>
                {linkedInstallations.slice(0, 2).map((entry) => (
                  <span key={entry.id} className="block text-[11px]">{entry.status || 'Recorded'} · {entry.installedAt}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted">Add at least one hardware asset and software licence to use synchronized operations.</p>
        )}
      </Card>}
      </section>

      {selectedHardwareRecord && (
        <RecordDetailsModal
          isOpen={true}
          onClose={() => setSelectedHardwareRecord(null)}
          title={`Hardware Telemetry · ${selectedHardwareRecord.assetId || selectedHardwareRecord.assetTag}`}
          record={selectedHardwareRecord}
          fields={[
            { label: 'Asset ID', value: selectedHardwareRecord.assetId || selectedHardwareRecord.assetTag },
            { label: 'Asset Tag', value: selectedHardwareRecord.assetTag },
            { label: 'Device Name', key: 'model', value: selectedHardwareRecord.model || selectedHardwareRecord.name, editable: true },
            { label: 'Category', key: 'type', value: selectedHardwareRecord.type || selectedHardwareRecord.category, editable: true },
            { label: 'Serial Number', key: 'serial', value: selectedHardwareRecord.serial, editable: true },
            { label: 'Location', key: 'location', value: selectedHardwareRecord.location, editable: true },
            { label: 'Purchase Date', key: 'purchaseDate', value: selectedHardwareRecord.purchaseDate, editable: true },
            { label: 'Purchase Cost (INR)', key: 'cost', value: selectedHardwareRecord.cost ?? selectedHardwareRecord.purchaseCost, type: 'number', editable: true },
            { label: 'Warranty Expiry', key: 'warrantyEnd', value: selectedHardwareRecord.warrantyEnd, editable: true },
            { label: 'Condition', key: 'condition', value: selectedHardwareRecord.condition, editable: true, type: 'select', options: [
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' }
            ] },
            { label: 'Lifecycle Status', value: selectedHardwareRecord.status },
            { label: 'Assigned Employee', value: selectedHardwareRecord.assignedEmployee || selectedHardwareRecord.assignedName || 'Unassigned' },
            ...(hasPermission('User Profiles', 'read') && selectedHardwareEmployee ? [
              { label: 'Employee ID', value: selectedHardwareEmployee.employeeId },
              { label: 'Department', value: selectedHardwareEmployee.department },
              { label: 'Role', value: selectedHardwareEmployee.role },
              { label: 'Email', value: selectedHardwareEmployee.email }
            ] : [])
          ]}
          canEdit={canUpdateAssets}
          onSave={(updates) => {
            if (!hasPermission('Assets', 'update')) return false;
            updateAsset(selectedHardwareRecord.id, updates);
            setSelectedHardwareRecord((current) => ({ ...current, ...updates }));
          }}
          canExport={canReadAssets && hasPermission('Reports', 'read')}
          exportData={{
            asset: selectedHardwareRecord,
            employee: hasPermission('User Profiles', 'read') ? selectedHardwareEmployee : selectedHardwareRecord.assignedName || null
          }}
          exportFilename={`hardware-telemetry-${selectedHardwareRecord.assetId || selectedHardwareRecord.assetTag}.json`}
        />
      )}

      {selectedSoftwareRecord && (
        <RecordDetailsModal
          isOpen={true}
          onClose={() => setSelectedSoftwareRecord(null)}
          title={`Software Governance · ${selectedSoftwareRecord.name}`}
          record={selectedSoftwareRecord}
          fields={[
            { label: 'Software Title', key: 'name', value: selectedSoftwareRecord.name, editable: true },
            { label: 'Vendor', key: 'vendor', value: selectedSoftwareRecord.vendor, editable: true },
            { label: 'Version', key: 'version', value: selectedSoftwareRecord.version, editable: true },
            { label: 'License Key', value: maskLicenseKey(selectedSoftwareRecord.licenseKey) },
            { label: 'Subscription Model', key: 'subscriptionModel', value: selectedSoftwareRecord.subscriptionModel || selectedSoftwareRecord.licenceType, editable: true },
            { label: 'Total Seats', key: 'totalSeats', value: selectedSoftwareRecord.totalSeats, type: 'number', editable: true },
            { label: 'Seats in Use', key: 'seatsUsed', value: selectedSoftwareRecord.seatsUsed, type: 'number', editable: true },
            { label: 'Expiry / Renewal Date', key: 'expiryDate', value: selectedSoftwareRecord.expiryDate || selectedSoftwareRecord.renewalDate, editable: true },
            { label: 'Annual Cost (INR)', key: 'annualCost', value: selectedSoftwareRecord.annualCost ?? selectedSoftwareRecord.costPerYear, type: 'number', editable: true },
            { label: 'Renewal Status', key: 'renewalStatus', value: selectedSoftwareRecord.renewalStatus || selectedSoftwareRecord.status, editable: true, type: 'select', options: [
              { value: 'active', label: 'Active' },
              { value: 'expiring soon', label: 'Expiring Soon' },
              { value: 'pending renewal', label: 'Pending Renewal' },
              { value: 'renewed', label: 'Renewed' },
              { value: 'expired', label: 'Expired' }
            ] },
            { label: 'Installation History', value: selectedSoftwareRecord.installationHistory || [] }
          ]}
          canEdit={canUpdateSoftware}
          onSave={(updates) => {
            if (!hasPermission('Software', 'update')) return false;
            updateSoftwareLicence(selectedSoftwareRecord.id, updates);
            setSelectedSoftwareRecord((current) => ({ ...current, ...updates }));
          }}
          canExport={canReadSoftware && hasPermission('Reports', 'read')}
          exportData={{
            ...selectedSoftwareRecord,
            licenseKey: maskLicenseKey(selectedSoftwareRecord.licenseKey)
          }}
          exportFilename={`software-governance-${selectedSoftwareRecord.id}.json`}
        />
      )}

      {canUpdateAssets && assetEditor && (
        <div role="dialog" aria-modal="true" aria-labelledby="hardware-editor-title" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius)] border border-line bg-[#0a222b] p-5 shadow-2xl">
            <h3 id="hardware-editor-title" className="font-display font-bold text-lg text-ink mb-4">Update Hardware: {assetEditor.assetTag}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Device Name / Specifications', 'model'],
                ['Serial Number', 'serial'],
                ['Location', 'location'],
                ['Warranty End Date', 'warrantyEnd'],
              ].map(([label, field]) => (
                <label key={field} className="flex flex-col gap-1 text-[12px] text-muted">{label}
                  <input value={assetEditor[field] || ''} onChange={(event) => setAssetEditor({ ...assetEditor, [field]: event.target.value })} className="px-3 py-2 rounded-lg bg-surface2 border border-line text-ink" />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-[12px] text-muted">Device Category
                <select value={assetEditor.type || assetEditor.category || 'Laptops'} onChange={(event) => setAssetEditor({ ...assetEditor, type: event.target.value })} className="px-3 py-2 rounded-lg bg-surface2 border border-line text-ink">
                  {['Laptops', 'Desktops', 'Monitors', 'Phones', 'Peripherals'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[12px] text-muted">Condition
                <select value={assetEditor.condition || 'good'} onChange={(event) => setAssetEditor({ ...assetEditor, condition: event.target.value })} className="px-3 py-2 rounded-lg bg-surface2 border border-line text-ink">
                  {['good', 'fair', 'poor'].map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5 border-t border-line pt-3">
              <Button variant="secondary" onClick={() => setAssetEditor(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                if (!hasPermission('Assets', 'update')) return;
                updateAsset(assetEditor.id, {
                  model: assetEditor.model,
                  type: assetEditor.type,
                  serial: assetEditor.serial,
                  location: assetEditor.location,
                  warrantyEnd: assetEditor.warrantyEnd,
                  condition: assetEditor.condition,
                });
                setAssetEditor(null);
              }}>Save Hardware</Button>
            </div>
          </div>
        </div>
      )}

      {canUpdateSoftware && softwareEditor && (
        <div role="dialog" aria-modal="true" aria-labelledby="software-editor-title" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius)] border border-line bg-[#0a222b] p-5 shadow-2xl">
            <h3 id="software-editor-title" className="font-display font-bold text-lg text-ink mb-4">Update Software: {softwareEditor.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Software Name', 'name'],
                ['Vendor', 'vendor'],
                ['Version', 'version'],
                ['License Key', 'licenseKey'],
                ['Expiry / Renewal Date', 'expiryDate'],
                ['Annual Cost (INR)', 'annualCost'],
              ].map(([label, field]) => (
                <label key={field} className="flex flex-col gap-1 text-[12px] text-muted">{label}
                  <input type={field === 'licenseKey' ? 'password' : field === 'annualCost' ? 'number' : 'text'} min={field === 'annualCost' ? '0' : undefined} value={softwareEditor[field] ?? (field === 'expiryDate' ? softwareEditor.renewalDate : '')} onChange={(event) => setSoftwareEditor({ ...softwareEditor, [field]: event.target.value })} className="px-3 py-2 rounded-lg bg-surface2 border border-line text-ink" />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-[12px] text-muted">Subscription Model
                <select value={softwareEditor.subscriptionModel || softwareEditor.licenceType} onChange={(event) => setSoftwareEditor({ ...softwareEditor, subscriptionModel: event.target.value })} className="px-3 py-2 rounded-lg bg-surface2 border border-line text-ink">
                  {['Subscription', 'Per user', 'Site', 'Perpetual', 'Consumption-Based'].map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[12px] text-muted">Renewal Status
                <select value={softwareEditor.renewalStatus || softwareEditor.status} onChange={(event) => setSoftwareEditor({ ...softwareEditor, renewalStatus: event.target.value })} className="px-3 py-2 rounded-lg bg-surface2 border border-line text-ink">
                  {['active', 'expiring soon', 'pending renewal', 'renewed', 'expired'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5 border-t border-line pt-3">
              <Button variant="secondary" onClick={() => setSoftwareEditor(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                if (!hasPermission('Software', 'update')) return;
                const annualCost = Number(softwareEditor.annualCost ?? softwareEditor.costPerYear);
                if (!softwareEditor.name?.trim() || !Number.isFinite(annualCost) || annualCost < 0) {
                  showToast('Enter a software name and a valid non-negative annual cost');
                  return;
                }
                updateSoftwareLicence(softwareEditor.id, {
                  ...softwareEditor,
                  name: softwareEditor.name.trim(),
                  annualCost,
                  expiryDate: softwareEditor.expiryDate || softwareEditor.renewalDate || '',
                  renewalDate: softwareEditor.expiryDate || softwareEditor.renewalDate || '',
                });
                setSoftwareEditor(null);
              }}>Save Software</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
