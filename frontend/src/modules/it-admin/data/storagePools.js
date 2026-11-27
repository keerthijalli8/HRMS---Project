import { INITIAL_DOCUMENTS } from './documents';

export const DOCUMENT_REPOSITORY_STORAGE_POOL_IDS = {
  user_records: 'pool-people',
  hardware_manuals: 'pool-hardware',
  software_licenses: 'pool-licenses',
  general_files: 'pool-governance'
};

export const DOCUMENT_STORAGE_POOLS = [
  {
    id: 'pool-people',
    name: 'People Records Pool',
    repository: 'user_records',
    repositoryLabel: 'User Records',
    storageEngine: 'PostgreSQL metadata · encrypted object storage',
    region: 'ap-south-1',
    usedGb: 286.4,
    capacityGb: 500,
    replicas: 2,
    replicationLagSeconds: 0.4,
    status: 'Connected'
  },
  {
    id: 'pool-hardware',
    name: 'Hardware Manuals Pool',
    repository: 'hardware_manuals',
    repositoryLabel: 'Hardware Manuals',
    storageEngine: 'PostgreSQL metadata · encrypted object storage',
    region: 'ap-south-1',
    usedGb: 318.7,
    capacityGb: 750,
    replicas: 2,
    replicationLagSeconds: 0.7,
    status: 'Connected'
  },
  {
    id: 'pool-licenses',
    name: 'Software License Pool',
    repository: 'software_licenses',
    repositoryLabel: 'Software Licenses',
    storageEngine: 'PostgreSQL metadata · encrypted object storage',
    region: 'ap-south-1',
    usedGb: 104.2,
    capacityGb: 400,
    replicas: 2,
    replicationLagSeconds: 0.5,
    status: 'Connected'
  },
  {
    id: 'pool-governance',
    name: 'Governance Archive Pool',
    repository: 'general_files',
    repositoryLabel: 'General Files',
    storageEngine: 'PostgreSQL metadata · encrypted object storage',
    region: 'ap-south-1',
    usedGb: 604.9,
    capacityGb: 1000,
    replicas: 2,
    replicationLagSeconds: 0.8,
    status: 'Connected'
  }
];

export const DATABASE_SAMPLE_TELEMETRY = {
  serverUptimeSeconds: 1844280,
  activeConnections: 42,
  maxConnections: 100,
  averageQueryMs: 18.4,
  p95QueryMs: 42,
  activeSessions: 18,
  healthyReplicas: 2,
  totalReplicas: 2,
  replicationLagSeconds: 0.8,
  primaryStatus: 'Connected',
  replicaStatus: 'Connected',
  objectStorageStatus: 'Connected'
};

function getDocumentSizeGb(doc) {
  const uploadedFileSize = Number(doc.file?.size);
  if (Number.isFinite(uploadedFileSize) && uploadedFileSize >= 0) {
    return uploadedFileSize / (1024 ** 3);
  }

  const match = String(doc.fileSize || '').match(/([\d,.]+)\s*(B|KB|MB|GB|TB)\b/i);
  if (!match) return 0;

  const size = Number(match[1].replace(/,/g, ''));
  const unitFactors = {
    B: 1 / (1024 ** 3),
    KB: 1 / (1024 ** 2),
    MB: 1 / 1024,
    GB: 1,
    TB: 1024
  };
  return size * unitFactors[match[2].toUpperCase()];
}

export function getDocumentStoragePoolId(repository) {
  const repositoryAliases = {
    handovers: 'hardware_manuals',
    software: 'software_licenses',
    policies: 'general_files',
    incidents: 'general_files',
    reports: 'general_files'
  };
  const normalizedRepository = repositoryAliases[repository] || repository;
  return DOCUMENT_REPOSITORY_STORAGE_POOL_IDS[normalizedRepository] || DOCUMENT_REPOSITORY_STORAGE_POOL_IDS.general_files;
}

export function getDocumentStoragePool(poolId) {
  return DOCUMENT_STORAGE_POOLS.find(pool => pool.id === poolId) || null;
}

const initialDocumentUsageGb = INITIAL_DOCUMENTS.reduce((usageByPool, doc) => {
  const poolId = doc.storagePoolId || getDocumentStoragePoolId(doc.repository || doc.category);
  usageByPool[poolId] = (usageByPool[poolId] || 0) + getDocumentSizeGb(doc);
  return usageByPool;
}, {});

const baseStorageUsageGb = Object.fromEntries(
  DOCUMENT_STORAGE_POOLS.map(pool => [
    pool.id,
    Math.max(0, pool.usedGb - (initialDocumentUsageGb[pool.id] || 0))
  ])
);

export function getDatabaseStatusSnapshot(documents, telemetry = DATABASE_SAMPLE_TELEMETRY) {
  const storagePools = DOCUMENT_STORAGE_POOLS.map(pool => {
    const poolDocuments = documents.filter(doc => (
      (doc.storagePoolId || getDocumentStoragePoolId(doc.repository || doc.category)) === pool.id
    ));
    const documentUsageGb = poolDocuments.reduce((total, doc) => total + getDocumentSizeGb(doc), 0);

    return {
      ...pool,
      documentCount: poolDocuments.length,
      documentPayloadMb: documentUsageGb * 1024,
      usedGb: baseStorageUsageGb[pool.id] + documentUsageGb
    };
  });
  const totalUsedGb = storagePools.reduce((total, pool) => total + pool.usedGb, 0);
  const totalCapacityGb = storagePools.reduce((total, pool) => total + pool.capacityGb, 0);

  return {
    ...telemetry,
    storagePools,
    totalUsedGb,
    totalCapacityGb,
    utilizationPercent: (totalUsedGb / totalCapacityGb) * 100
  };
}
