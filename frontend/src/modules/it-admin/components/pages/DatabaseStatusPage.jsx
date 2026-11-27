import React from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  ShieldCheck,
  Users,
  Zap
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { ProgressBar } from '../shared/ProgressBar';
import {
  refreshDatabaseMockTelemetry,
  useDatabaseMockTelemetry
} from '../../hooks/useDatabaseMockTelemetry';
import {
  getDatabaseStatusSnapshot
} from '../../data/storagePools';

function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function MetricCard({ icon: Icon, label, value, detail, accent = 'text-accent' }) {
  return (
    <Card className="min-h-[142px] justify-between">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</span>
        <span className={`p-2 rounded-xl bg-surface2 border border-line ${accent}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <strong className="font-display font-bold text-[25px] leading-tight text-ink tabular-nums">{value}</strong>
      <span className="text-[11px] text-muted">{detail}</span>
    </Card>
  );
}

export function DatabaseStatusPage() {
  const { documents, showToast, hasPermission } = useStore();
  const canReadSettings = hasPermission('System Settings', 'read');
  const mockTelemetry = useDatabaseMockTelemetry();
  const snapshot = getDatabaseStatusSnapshot(documents, mockTelemetry);
  const telemetry = snapshot;
  const pools = snapshot.storagePools;
  const connections = [
    { name: 'Primary Database', role: 'Read / write cluster', status: telemetry.primaryStatus, latency: `${telemetry.averageQueryMs} ms` },
    { name: 'Read Replica', role: 'Reporting and failover', status: telemetry.replicaStatus, latency: `${telemetry.p95QueryMs} ms` },
    { name: 'Document Object Storage', role: 'Binary file payloads', status: telemetry.objectStorageStatus, latency: '31 ms' }
  ];

  const refreshSnapshot = () => {
    refreshDatabaseMockTelemetry();
    showToast('Synchronized demo telemetry refreshed.');
  };

  if (!canReadSettings) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Database Status Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have System Settings: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0" id="database-status-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-cyan-300" />
            <span>Database Status</span>
          </h2>
          <p className="text-[13px] text-muted">
            Service health, query responsiveness, replication, sessions, and document storage pools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-200 border border-emerald-500/35">
            Active demo feed
          </span>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshSnapshot}>
            Refresh snapshot
          </Button>
        </div>
      </div>

      <div
        role="status"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[12px]"
      >
        <span className="font-semibold text-emerald-200">Simulated telemetry refreshes automatically every 5 seconds.</span>
        <span className="text-emerald-100/80">No live backend connector configured · Updated {new Date(telemetry.lastUpdatedAt).toLocaleTimeString()}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
        <MetricCard
          icon={Server}
          label="Server uptime"
          value={formatUptime(telemetry.serverUptimeSeconds)}
          detail="Primary cluster · demo feed"
          accent="text-emerald-300"
        />
        <MetricCard
          icon={Activity}
          label="Connections"
          value={`${telemetry.activeConnections} / ${telemetry.maxConnections}`}
          detail={`Pool utilization · ${Math.round((telemetry.activeConnections / telemetry.maxConnections) * 100)}%`}
          accent="text-sky-300"
        />
        <MetricCard
          icon={Zap}
          label="Query response"
          value={`${telemetry.averageQueryMs} ms`}
          detail={`Average · p95 ${telemetry.p95QueryMs} ms`}
          accent="text-amber-300"
        />
        <MetricCard
          icon={HardDrive}
          label="Storage used"
          value={`${snapshot.utilizationPercent.toFixed(2)}%`}
          detail={`${snapshot.totalUsedGb.toFixed(3)} GB of ${snapshot.totalCapacityGb.toLocaleString()} GB`}
          accent="text-violet-300"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Replication"
          value={`${telemetry.healthyReplicas} / ${telemetry.totalReplicas} healthy`}
          detail={`${telemetry.replicationLagSeconds}s maximum lag`}
          accent="text-emerald-300"
        />
        <MetricCard
          icon={Users}
          label="Active sessions"
          value={telemetry.activeSessions}
          detail="Across application services · sample"
          accent="text-cyan-300"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] gap-4">
        <Card
          title="Storage pool utilization"
          subText="Document repository metadata resolves to its assigned storage pool."
        >
          <div className="flex flex-col gap-4">
            {pools.map(pool => (
              <div key={pool.id} className="p-3.5 rounded-xl bg-slate-950/45 border border-line/70">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[13px] text-ink">{pool.name}</strong>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-200 border border-cyan-500/25">
                        {pool.documentCount} documents
                      </span>
                    </div>
                    <span className="text-[11px] text-muted font-data">
                      {pool.repositoryLabel} · {pool.id} · {pool.region}
                    </span>
                  </div>
                  <span className="text-[11px] font-data text-ink">
                    {pool.usedGb.toFixed(3)} / {pool.capacityGb.toLocaleString()} GB
                  </span>
                </div>
                <ProgressBar value={pool.usedGb} max={pool.capacityGb} showPercentage warnThreshold={80} />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-muted">
                  <span>{pool.storageEngine} · vault payload {pool.documentPayloadMb.toFixed(1)} MB</span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    {pool.replicas} replicas · {pool.replicationLagSeconds}s lag
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Service connections"
          subText="Current connection state and sample response latency by service."
        >
          <div className="flex flex-col gap-2">
            {connections.map(connection => (
              <div key={connection.name} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/45 border border-line/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] shrink-0" />
                  <div className="min-w-0">
                    <strong className="block text-[12px] text-ink truncate">{connection.name}</strong>
                    <span className="block text-[10.5px] text-muted">{connection.role}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[11px] font-bold text-emerald-300">{connection.status}</span>
                  <span className="block text-[10px] font-data text-muted">{connection.latency}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 p-3 rounded-xl bg-surface2/35 border border-line/70">
            <div className="flex items-center gap-2 text-[12px] font-bold text-ink">
              <Activity className="w-4 h-4 text-accent" />
              Query response velocity
            </div>
            <div className="mt-3 flex items-end gap-1.5 h-16" role="img" aria-label="Sample query response time trend">
              {[36, 48, 42, 63, 53, 78, 60, 92, 70, 84, 66, 75].map((height, index) => (
                <span
                  key={index}
                  className={`flex-1 rounded-t-sm ${index === 7 ? 'bg-accent' : 'bg-sky-400/45'}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>Last 60 minutes · sample</span>
              <span>{telemetry.averageQueryMs} ms average</span>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Document metadata → storage architecture"
        subText="Each document stores a stable storagePoolId alongside its repository and governance metadata."
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 p-3 rounded-xl bg-slate-950/45 border border-line/70">
          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/25">
            <span className="block text-[10px] uppercase tracking-wider text-sky-200/75 font-bold">Document metadata</span>
            <span className="block mt-1 text-[12px] text-ink font-data">repository · storagePoolId · SHA-256</span>
          </div>
          <span className="text-center text-accent font-bold">→</span>
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/25">
            <span className="block text-[10px] uppercase tracking-wider text-violet-200/75 font-bold">Storage pool</span>
            <span className="block mt-1 text-[12px] text-ink">Capacity · region · connection state</span>
          </div>
          <span className="text-center text-accent font-bold">→</span>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
            <span className="block text-[10px] uppercase tracking-wider text-emerald-200/75 font-bold">Database / replicas</span>
            <span className="block mt-1 text-[12px] text-ink">Metadata index · object payload · replication</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
