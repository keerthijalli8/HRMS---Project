import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card, KpiTile } from '../shared/Card';
import { Button } from '../shared/Button';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';
import {
  IconGlobe,
  IconShield,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconSearch,
  IconShare,
  IconKey,
  IconLaptop
} from '../shared/Icons';

export function NetworkManagementPage() {
  const {
    networkDevices,
    networkMetrics,
    activeSubTab,
    setActiveSubTab,
    rebootNetworkDevice,
    updateNetworkDevice,
    hasPermission,
    showToast
  } = useStore();
  const canReadNetwork = hasPermission('Network', 'read');
  const canUpdateNetwork = hasPermission('Network', 'update');

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Map subTab to device type filter
  const currentTab = activeSubTab || 'devices';

  const NETWORK_CATEGORIES = [
    {
      id: 'devices',
      title: 'All Equipment',
      subtext: 'Core routing, switching & edge nodes',
      metric: `${networkDevices?.length || 8}`,
      metricLabel: 'online nodes',
      status: '8/8 Healthy',
      statusColor: 'emerald',
      icon: IconGlobe
    },
    {
      id: 'switches',
      title: 'Core & Edge Switches',
      subtext: 'Cisco Catalyst & Aruba 96-port stack',
      metric: `${(networkDevices || []).filter(d => d.type === 'switch').length || 3}`,
      metricLabel: 'switches (96 ports)',
      status: '10 GbE Fiber',
      statusColor: 'sky',
      icon: IconShare
    },
    {
      id: 'routers',
      title: 'Edge Routers & NGFW',
      subtext: 'FortiGate 200F & Juniper SRX firewalls',
      metric: `${(networkDevices || []).filter(d => d.type === 'router').length || 2}`,
      metricLabel: 'firewall clusters',
      status: 'Active HA Pair',
      statusColor: 'purple',
      icon: IconShield
    },
    {
      id: 'vpn',
      title: 'VPN Gateways',
      subtext: 'WireGuard & IPsec hybrid tunnels',
      metric: `${networkMetrics.activeVpnTunnels || 142}`,
      metricLabel: 'connected tunnels',
      status: 'Zero Drops',
      statusColor: 'emerald',
      icon: IconKey
    },
    {
      id: 'monitoring',
      title: 'Live Telemetry',
      subtext: 'Prometheus & SNMP polling metrics',
      metric: `${networkMetrics.averageLatencyMs || 2.4}ms`,
      metricLabel: 'avg campus latency',
      status: '99.98% Uptime',
      statusColor: 'emerald',
      icon: IconClock
    }
  ];

  const filteredDevices = (networkDevices || []).filter(dev => {
    // Type match
    if (currentTab === 'switches' && dev.type !== 'switch') return false;
    if (currentTab === 'routers' && dev.type !== 'router') return false;
    if (currentTab === 'vpn' && dev.type !== 'vpn') return false;
    
    // Search match
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      dev.name.toLowerCase().includes(q) ||
      dev.model.toLowerCase().includes(q) ||
      dev.ipAddress.toLowerCase().includes(q) ||
      dev.location.toLowerCase().includes(q)
    );
  });

  if (!canReadNetwork) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Network Management Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Network: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <IconGlobe className="w-6 h-6 text-sky-400" />
            <span>Network Infrastructure & Gateways</span>
          </h2>
          <p className="text-[13px] text-muted">
            Enterprise switches, edge firewalls, hybrid cloud VPN tunnels, and campus Wi-Fi telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canUpdateNetwork && <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Network ping sweeps completed: 0 packet drops detected.')}
          >
            Run Ping Sweep
          </Button>}
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Exported network topology diagram (Cisco/Juniper/Fortinet).')}
          >
            Export Topology
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile
          label="Total Fleet"
          value={networkMetrics.totalDevices}
          delta="100% Monitored"
          deltaType="good"
        />
        <KpiTile
          label="Online Nodes"
          value={networkMetrics.onlineDevices}
          delta="8 Active"
          deltaType="good"
        />
        <KpiTile
          label="Throughput"
          value={networkMetrics.totalBandwidthThroughput}
          delta="Peak 32G"
          deltaType="good"
        />
        <KpiTile
          label="Avg Latency"
          value={`${networkMetrics.averageLatencyMs}ms`}
          delta="Sub-5ms SLA"
          deltaType="good"
        />
        <KpiTile
          label="VPN Tunnels"
          value={networkMetrics.activeVpnTunnels}
          delta="142 WireGuard"
          deltaType="good"
        />
        <KpiTile
          label="Network SLA"
          value={networkMetrics.uptimeSla}
          delta="365d Continuous"
          deltaType="good"
        />
      </div>

      {/* 2. Horizontal Category Cards Bar */}
      <CategoryCardsBar
        categories={NETWORK_CATEGORIES}
        activeCategory={currentTab}
        onSelectCategory={(id) => setActiveSubTab(id)}
      />

      {/* Optional: Live Telemetry Dedicated Metrics Widget when 'monitoring' is active */}
      {currentTab === 'monitoring' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold text-muted uppercase tracking-wider">WAN Primary Uplink (Tata Comm)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-display font-bold text-sky-400">9.42 Gbps</span>
              <span className="text-[12px] text-good font-semibold">↑ 4.1% load</span>
            </div>
            <p className="text-[11.5px] text-muted">99.999% SLA · Fiber ring active · 0 packet discards</p>
          </Card>
          <Card className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold text-muted uppercase tracking-wider">WAN Secondary Uplink (Airtel)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-display font-bold text-emerald-400">2.98 Gbps</span>
              <span className="text-[12px] text-good font-semibold">Standby Sync</span>
            </div>
            <p className="text-[11.5px] text-muted">Auto-failover BGP peering alive · 1.8ms response</p>
          </Card>
          <Card className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold text-muted uppercase tracking-wider">Wi-Fi 6 Enterprise APs</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-display font-bold text-purple-400">38 APs</span>
              <span className="text-[12px] text-good font-semibold">418 Clients</span>
            </div>
            <p className="text-[11.5px] text-muted">802.1X EAP-TLS · Roaming handoff sub-12ms</p>
          </Card>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[13px] text-muted">
          Showing <span className="font-bold text-ink">{filteredDevices.length}</span> network equipment nodes
          {currentTab !== 'devices' && currentTab !== 'monitoring' && ` filtered by ${NETWORK_CATEGORIES.find(c => c.id === currentTab)?.title}`}
        </div>
        <div className="relative w-full sm:w-[260px]">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Filter network nodes by name, IP, VLAN..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-surface2/60 border border-line text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* 3. Network Devices Data Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line/60 bg-surface2/30 text-muted font-bold text-[11.5px] uppercase tracking-wider">
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Hardware Model</th>
                <th className="py-3 px-4">IP & VLAN Subnet</th>
                <th className="py-3 px-4">Physical Location</th>
                <th className="py-3 px-4">Throughput</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredDevices.map(dev => {
                const isOnline = dev.status === 'online';
                return (
                  <tr
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    className="hover:bg-surface2/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-ink group-hover:text-sky-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-good animate-pulse' : 'bg-warn'}`} />
                        <span>{dev.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink font-medium">
                      {dev.model}
                    </td>
                    <td className="py-3 px-4 font-data text-muted text-[12.5px]">
                      <div>{dev.ipAddress}</div>
                      <span className="text-[10.5px] text-muted/70">{dev.vlan}</span>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {dev.location}
                    </td>
                    <td className="py-3 px-4 font-data text-ink">
                      {dev.bandwidthThroughput}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          isOnline
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {dev.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDevice(dev);
                        }}
                        className="px-2.5 py-1 text-[11.5px] font-bold rounded-lg bg-surface2 hover:bg-sky-500 hover:text-white transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. 50% WIDTH SIDE DRAWER ON ROW CLICK */}
      {selectedDevice && (
        <RecordDetailsModal
          isOpen={true}
          onClose={() => setSelectedDevice(null)}
          title={`Network Node Telemetry · ${selectedDevice.name}`}
          record={selectedDevice}
          fields={[
            { label: 'Device Name', key: 'name', value: selectedDevice.name, editable: true },
            { label: 'Device ID', value: selectedDevice.id },
            { label: 'Device Type', value: selectedDevice.type },
            { label: 'Hardware Model', key: 'model', value: selectedDevice.model, editable: true },
            { label: 'IP Address', key: 'ipAddress', value: selectedDevice.ipAddress, editable: true },
            { label: 'Physical MAC', value: selectedDevice.macAddress },
            { label: 'VLAN / Subnet', key: 'vlan', value: selectedDevice.vlan, editable: true },
            { label: 'Physical Location', key: 'location', value: selectedDevice.location, editable: true },
            { label: 'Status', value: selectedDevice.status },
            { label: 'Live Throughput', value: selectedDevice.bandwidthThroughput },
            { label: 'CPU Load', value: selectedDevice.cpuUsage || '21%' },
            { label: 'Memory Usage', value: selectedDevice.memoryUsage || '36%' },
            { label: 'Uptime', value: selectedDevice.uptime },
            { label: 'Ports Active', value: selectedDevice.portsActive || 24 },
            { label: 'Total Ports', value: selectedDevice.portsTotal || 24 },
            { label: 'Firmware Version', key: 'firmware', value: selectedDevice.firmware, editable: true },
            { label: 'Last Configuration Backup', value: selectedDevice.lastBackup }
          ]}
          canEdit={canUpdateNetwork}
          onSave={(updates) => {
            if (!hasPermission('Network', 'update')) return false;
            const updated = updateNetworkDevice(selectedDevice.id, updates);
            if (!updated) return false;
            setSelectedDevice((current) => ({ ...current, ...updates }));
          }}
          canExport={canReadNetwork && hasPermission('Reports', 'read')}
          exportFilename={`network-device-${selectedDevice.id}.json`}
          headerActions={canUpdateNetwork ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => rebootNetworkDevice(selectedDevice.id)}
            >
              Reboot Device
            </Button>
          ) : null}
        >
          <div className="p-4 rounded-xl bg-surface2/30 border border-line">
            <h3 className="font-bold text-[13px] text-ink mb-2">Interface & Port Diagnostics</h3>
            <p className="text-[12px] text-muted">
              The record includes live status, throughput, hardware identifiers, port capacity, firmware, and the latest configuration backup.
            </p>
          </div>
        </RecordDetailsModal>
      )}
    </div>
  );
}
