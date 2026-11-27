import { useSyncExternalStore } from 'react';
import { DATABASE_SAMPLE_TELEMETRY } from '../data/storagePools';

const REFRESH_INTERVAL_MS = 5000;
const controllerStartedAt = Date.now();
const listeners = new Set();
const connectionOffsets = [0, 1, -1, 2, -2, 1];
const latencyOffsets = [0, 1.1, -0.8, 2, -1.2, 0.4];
const replicationLagSamples = [0.8, 0.6, 0.9, 0.7, 1.0, 0.5];

function createTelemetrySnapshot(now = Date.now()) {
  const elapsedSeconds = Math.floor((now - controllerStartedAt) / 1000);
  const sampleIndex = Math.floor(elapsedSeconds / (REFRESH_INTERVAL_MS / 1000)) % connectionOffsets.length;
  const averageQueryMs = Number(
    (DATABASE_SAMPLE_TELEMETRY.averageQueryMs + latencyOffsets[sampleIndex]).toFixed(1)
  );
  const connectionOffset = connectionOffsets[sampleIndex];

  return {
    ...DATABASE_SAMPLE_TELEMETRY,
    serverUptimeSeconds: DATABASE_SAMPLE_TELEMETRY.serverUptimeSeconds + elapsedSeconds,
    activeConnections: DATABASE_SAMPLE_TELEMETRY.activeConnections + connectionOffset,
    averageQueryMs,
    p95QueryMs: Math.round(averageQueryMs * 2.3),
    activeSessions: DATABASE_SAMPLE_TELEMETRY.activeSessions + Math.trunc(connectionOffset / 2),
    replicationLagSeconds: replicationLagSamples[sampleIndex],
    primaryStatus: 'Connected',
    replicaStatus: 'Connected',
    objectStorageStatus: 'Connected',
    lastUpdatedAt: now
  };
}

let snapshot = createTelemetrySnapshot();
let refreshTimer = null;

function publishTelemetry() {
  snapshot = createTelemetrySnapshot();
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  if (!refreshTimer) {
    refreshTimer = setInterval(publishTelemetry, REFRESH_INTERVAL_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };
}

function getSnapshot() {
  return snapshot;
}

export function refreshDatabaseMockTelemetry() {
  publishTelemetry();
}

export function useDatabaseMockTelemetry() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
