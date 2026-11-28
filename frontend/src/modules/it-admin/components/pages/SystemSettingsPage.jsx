
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card, KpiTile } from '../shared/Card';
import { Button } from '../shared/Button';
import { EmptyState } from '../shared/EmptyState';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { CategoryCardsBar } from '../shared/CategoryCardsBar';
import { ThemeToggleButton } from '../../../../components/ThemeToggleButton.jsx';
import { useTheme } from '../../../../context/ThemeContext.jsx';

import {
  IconSettings,
  IconShield,
  IconCheck,
  IconUsers,
  IconShare,
  IconGlobe,
  IconHeadphones,
  IconLaptop,
  IconKey,
  IconGoogle,
  IconSearch,
  IconDownload,
  IconAlertTriangle
} from '../shared/Icons';

// ============================================================
// CONFIGURATION
// ============================================================

const SETTINGS_TABS = [
  'business_units',
  'locations',
  'integrations',
  'notifications',
  'backup'
];

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg bg-surface2 border border-line text-ink text-[13px] focus:outline-none focus:border-accent';

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const formatLabel = value =>
  String(value || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, letter => letter.toUpperCase());

const isEnabled = record =>
  ['active', 'enabled', 'connected', 'operational'].includes(
    normalize(record.status)
  );

const displayValue = value => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) return 'Not recorded';

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
};

function matchesSearch(record, search) {
  const query = normalize(search);

  if (!query) return true;

  return Object.values(record).some(value =>
    normalize(
      Array.isArray(value) ? value.join(' ') : value
    ).includes(query)
  );
}

function downloadJSON(data, filename) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(value) {
  return String(value || 'configuration')
    .replace(/[^a-z0-9-]+/gi, '-')
    .toLowerCase();
}

function sanitizeConfiguration(record) {
  return Object.fromEntries(
    Object.entries(record || {}).filter(([key]) =>
      !/password|secret|token|credential|api.?key|private.?key/i.test(key)
    )
  );
}

function getIntegrationIcon(type) {
  switch (type) {
    case 'google':
      return <IconGoogle className="w-5 h-5" />;

    case 'key':
      return <IconKey className="w-5 h-5 text-accent" />;

    case 'laptop':
      return <IconLaptop className="w-5 h-5 text-sky-400" />;

    case 'share':
      return <IconShare className="w-5 h-5 text-accent2" />;

    case 'shield':
      return <IconShield className="w-5 h-5 text-good" />;

    case 'headphones':
      return <IconHeadphones className="w-5 h-5 text-warn" />;

    default:
      return <IconGlobe className="w-5 h-5 text-muted" />;
  }
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function ConfigurationStatus({ status, label }) {
  const enabled = isEnabled({ status });

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${
      enabled
        ? 'bg-good/15 text-good border-good/30'
        : 'bg-surface2 text-muted border-line'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        enabled ? 'bg-good' : 'bg-muted'
      }`} />

      {label || formatLabel(status || 'Unknown')}
    </span>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="p-3 rounded-xl border border-line bg-surface2/30 flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>

      <span className="text-[13px] font-semibold text-ink break-words">
        {displayValue(value)}
      </span>
    </div>
  );
}

function RecordMetric({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted">
        {label}
      </span>

      <span className="font-data font-bold text-[13px] text-ink">
        {displayValue(value)}
      </span>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================

export function SystemSettingsPage() {
  const { theme } = useTheme();
  const {
    businessUnits = [],
    locations = [],
    integrations = [],
    notificationRules = [],
    backupPolicies = {},
    toggleIntegration,
    activeSubTab,
    setActiveSubTab,
    hasPermission,
    showToast
  } = useStore();

  const canReadSettings =
    hasPermission('System Settings', 'read');

  const canUpdateSettings =
    hasPermission('System Settings', 'update');

  const canExportSettings =
    canReadSettings &&
    hasPermission('Reports', 'read');

  const [localTab, setLocalTab] =
    useState('business_units');

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [pendingIntegration, setPendingIntegration] =
    useState(null);

  const currentTab =
    SETTINGS_TABS.includes(activeSubTab)
      ? activeSubTab
      : localTab;

  const changeTab = id => {
    if (!SETTINGS_TABS.includes(id)) return;

    setLocalTab(id);
    setActiveSubTab?.(id);
    setSearch('');
    setStatusFilter('All');
    setSelectedItem(null);
  };

  // ==========================================================
  // DYNAMIC METRICS
  // ==========================================================

  const activeBusinessUnits = businessUnits.filter(
    unit => normalize(unit.status) === 'active'
  ).length;

  const operationalLocations = locations.filter(
    location => normalize(location.status) === 'operational'
  ).length;

  const enabledIntegrations = integrations.filter(
    integration => normalize(integration.status) === 'connected'
  ).length;

  const enabledRules = notificationRules.filter(
    rule => normalize(rule.status) === 'enabled'
  ).length;

  const criticalNotificationRules = notificationRules.filter(
    rule =>
      normalize(rule.status) === 'enabled' &&
      normalize(rule.severity) === 'critical'
  ).length;

  const configuredBackup = Boolean(
    backupPolicies.strategy
  );

  // ==========================================================
  // CATEGORY CARDS
  // ==========================================================

  const settingsCategories = [
    {
      id: 'business_units',
      title: 'Business Units',
      subtext: 'Departments and operating divisions',
      metric: String(businessUnits.length),
      metricLabel: 'Business units',
      status: `${activeBusinessUnits} Active`,
      statusColor: 'sky',
      icon: IconUsers
    },
    {
      id: 'locations',
      title: 'Locations & Sites',
      subtext: 'Configured office and operational sites',
      metric: String(locations.length),
      metricLabel: 'Locations',
      status: `${operationalLocations} Operational`,
      statusColor: 'emerald',
      icon: IconGlobe
    },
    {
      id: 'integrations',
      title: 'Integrations',
      subtext: 'External service configuration',
      metric: `${enabledIntegrations}/${integrations.length}`,
      metricLabel: 'Enabled locally',
      status: 'Local Config',
      statusColor: 'purple',
      icon: IconShare
    },
    {
      id: 'notifications',
      title: 'Notification Rules',
      subtext: 'Event triggers and notification channels',
      metric: String(notificationRules.length),
      metricLabel: 'Rules',
      status: `${enabledRules} Enabled`,
      statusColor: 'amber',
      icon: IconHeadphones
    },
    {
      id: 'backup',
      title: 'Backup & Recovery',
      subtext: 'Configured backup and recovery objectives',
      metric: configuredBackup ? 'Configured' : 'Not Set',
      metricLabel: '',
      status: 'Policy',
      statusColor: 'sky',
      icon: IconShield
    }
  ];

  // ==========================================================
  // FILTERED CONFIGURATION RECORDS
  // ==========================================================

  const sourceRecords =
    currentTab === 'business_units'
      ? businessUnits
      : currentTab === 'locations'
        ? locations
        : currentTab === 'integrations'
          ? integrations
          : currentTab === 'notifications'
            ? notificationRules
            : [];

  const availableStatuses = [
    ...new Set(
      sourceRecords
        .map(record => record.status)
        .filter(Boolean)
    )
  ];

  const filteredRecords = sourceRecords.filter(record => {
    const matchSearch = matchesSearch(record, search);

    const matchStatus =
      statusFilter === 'All' ||
      normalize(record.status) === normalize(statusFilter);

    return matchSearch && matchStatus;
  });

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
  };

  // ==========================================================
  // CONFIGURATION DETAILS
  // ==========================================================

  const openDetails = (type, record) => {
    if (!canReadSettings) return;

    setSelectedItem({
      type,
      id: record.id
    });
  };

  const selectedCollection =
    selectedItem?.type === 'bu'
      ? businessUnits
      : selectedItem?.type === 'loc'
        ? locations
        : selectedItem?.type === 'integration'
          ? integrations
          : selectedItem?.type === 'notification'
            ? notificationRules
            : [];

  const selectedRecord = selectedItem
    ? selectedCollection.find(
        record => record.id === selectedItem.id
      )
    : null;

  const selectedRecordData = selectedRecord
    ? sanitizeConfiguration(selectedRecord)
    : null;

  const detailTitle = !selectedRecord
    ? 'Configuration Details'
    : selectedItem.type === 'bu'
      ? `Business Unit · ${selectedRecord.name}`
      : selectedItem.type === 'loc'
        ? `Location · ${selectedRecord.name}`
        : selectedItem.type === 'integration'
          ? `Integration · ${selectedRecord.name}`
          : `Notification Rule · ${selectedRecord.event}`;

  const detailFields = selectedRecordData
    ? Object.entries(selectedRecordData)
        .filter(([key]) =>
          selectedItem.type !== 'integration' ||
          !['health', 'lastSync', 'managedUsers'].includes(key)
        )
        .map(([key, value]) => ({
          label:
            selectedItem.type === 'integration' &&
            key === 'status'
              ? 'Local Configuration Status'
              : formatLabel(key),

          value:
            selectedItem.type === 'integration' &&
            key === 'status'
              ? normalize(value) === 'connected'
                ? 'Enabled locally'
                : 'Disabled locally'
              : displayValue(value)
        }))
    : [];

  // ==========================================================
  // INTEGRATION CONFIGURATION
  // ==========================================================

  const requestIntegrationToggle = integration => {
    if (!canUpdateSettings) return;

    setPendingIntegration({
      id: integration.id,
      name: integration.name,
      enabled: normalize(integration.status) === 'connected'
    });
  };

  const confirmIntegrationToggle = () => {
    if (!pendingIntegration || !canUpdateSettings) {
      return;
    }

    const currentIntegration = integrations.find(
      integration => integration.id === pendingIntegration.id
    );

    if (!currentIntegration) {
      showToast('This integration record is no longer available.');
      setPendingIntegration(null);
      return;
    }

    const currentlyEnabled =
      normalize(currentIntegration.status) === 'connected';

    if (currentlyEnabled !== pendingIntegration.enabled) {
      showToast('The configuration has changed. Please review it again.');
      setPendingIntegration(null);
      return;
    }

    if (typeof toggleIntegration !== 'function') {
      showToast('Integration configuration is unavailable.');
      return;
    }

    const result = toggleIntegration(
      pendingIntegration.id
    );

    if (result === false) return;

    setPendingIntegration(null);
  };

  // ==========================================================
  // CONFIGURATION EXPORT
  // ==========================================================

  const exportConfiguration = (allSections = false) => {
    if (!canExportSettings) {
      showToast(
        'Export requires System Settings and Reports read permissions.'
      );
      return;
    }

    let configuration;

    if (allSections) {
      configuration = {
        businessUnits: businessUnits.map(
          sanitizeConfiguration
        ),

        locations: locations.map(
          sanitizeConfiguration
        ),

        integrations: integrations.map(
          sanitizeConfiguration
        ),

        notificationRules: notificationRules.map(
          sanitizeConfiguration
        ),

        backupPolicies: sanitizeConfiguration(
          backupPolicies
        )
      };
    } else if (currentTab === 'backup') {
      configuration = sanitizeConfiguration(
        backupPolicies
      );
    } else {
      configuration = filteredRecords.map(
        sanitizeConfiguration
      );
    }

    const payload = {
      application: 'Technomold IT Administration',
      exportedAt: new Date().toISOString(),
      section: allSections ? 'all_settings' : currentTab,
      source: 'Local application configuration',
      productionVerified: false,
      configuration
    };

    const date = new Date().toISOString().slice(0, 10);

    downloadJSON(
      payload,
      `IT_Settings_${allSections ? 'all' : currentTab}_${date}.json`
    );

    showToast('Configuration JSON export generated.');
  };

  // ==========================================================
  // RESTRICTED ACCESS
  // ==========================================================

  if (!canReadSettings) {
    return (
      <Card title="Settings Restricted">
        <div className="flex flex-col items-center gap-3 py-8">
          <IconShield className="w-8 h-8 text-muted" />

          <p className="text-[13px] text-muted text-center">
            Your active role does not have System Settings:
            read permission.
          </p>
        </div>
      </Card>
    );
  }

  // ==========================================================
  // MAIN INTERFACE
  // ==========================================================

  return (
    <div
      id="widget-settings"
      data-w="settings"
      className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150"
    >

      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>
          <h2 className="font-display font-bold text-[22px] text-ink tracking-tight flex items-center gap-2.5">
            <IconSettings className="w-6 h-6 text-sky-400" />
            Settings
          </h2>

          <p className="text-[13px] text-muted mt-1">
            Manage IT administration configuration, business units,
            office locations, integrations and operational policies.
          </p>
        </div>

        {canExportSettings && (
          <div className="flex flex-wrap items-center gap-2">

            <Button
              variant="secondary"
              size="sm"
              icon={IconDownload}
              onClick={() => exportConfiguration(false)}
            >
              Export Section
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={IconDownload}
              onClick={() => exportConfiguration(true)}
            >
              Export Configuration
            </Button>

          </div>
        )}

      </div>

      {/* APPEARANCE & THEME */}

      <Card
        title={`Appearance & Theme (${theme === 'light' ? 'Light' : 'Dark'})`}
        subText="Switch between Dark and Light modes across all HRMS dashboards."
        action={<ThemeToggleButton />}
      />

      {/* CATEGORY CARDS */}

      <CategoryCardsBar
        categories={settingsCategories}
        activeCategory={currentTab}
        onSelectCategory={changeTab}
      />

      {/* SEARCH & FILTERS */}

      {currentTab !== 'backup' && (
        <Card
          title={
            settingsCategories.find(
              category => category.id === currentTab
            )?.title || 'Configuration Records'
          }
          subText={`${filteredRecords.length} of ${sourceRecords.length} records`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          }
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="relative">

              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

              <input
                type="search"
                value={search}
                onChange={event =>
                  setSearch(event.target.value)
                }
                placeholder="Search configuration records..."
                aria-label="Search configuration records"
                className={`${INPUT_CLASS} pl-9`}
              />

            </div>

            <select
              value={statusFilter}
              onChange={event =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter configuration status"
              className={INPUT_CLASS}
            >

              <option value="All">
                All Statuses
              </option>

              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}

            </select>

          </div>

        </Card>
      )}

      {/* BUSINESS UNITS */}

      {currentTab === 'business_units' && (
        <>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <KpiTile
              label="Total Business Units"
              value={businessUnits.length}
              delta="Configured operating units"
              deltaType="neutral"
            />

            <KpiTile
              label="Active Business Units"
              value={activeBusinessUnits}
              delta="Active configuration records"
              deltaType="good"
            />

          </div>

          {filteredRecords.length ? (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {filteredRecords.map(unit => (
                <div
                  key={unit.id}
                  className="p-4 rounded-xl bg-surface border border-line hover:border-accent transition-all flex flex-col gap-4"
                >

                  <div className="flex items-center justify-between gap-2">

                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-data font-bold">
                      {unit.code || '—'}
                    </span>

                    <ConfigurationStatus status={unit.status} />

                  </div>

                  <div>

                    <h3 className="font-bold text-[15px] text-ink">
                      {unit.name}
                    </h3>

                    <p className="text-[12px] text-muted mt-1">
                      Department Lead: {displayValue(unit.head)}
                    </p>

                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-line/60 pt-3">

                    <RecordMetric
                      label="Members"
                      value={unit.membersCount}
                    />

                    <RecordMetric
                      label="Devices"
                      value={unit.activeDevices}
                    />

                    <RecordMetric
                      label="Licences"
                      value={unit.allocatedLicenses}
                    />

                  </div>

                  <div className="flex justify-between items-center gap-2 border-t border-line/60 pt-3">

                    <span className="text-[11px] text-muted">
                      Configured figures
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openDetails('bu', unit)}
                    >
                      View Details
                    </Button>

                  </div>

                </div>
              ))}

            </div>

          ) : (

            <Card>
              <EmptyState
                icon={IconUsers}
                message="No business units match the selected filters."
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />
            </Card>

          )}

        </>
      )}

      {/* LOCATIONS & SITES */}

      {currentTab === 'locations' && (
        <>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <KpiTile
              label="Total Locations"
              value={locations.length}
              delta="Registered office locations"
              deltaType="neutral"
            />

            <KpiTile
              label="Operational Locations"
              value={operationalLocations}
              delta="Configured operational status"
              deltaType="good"
            />

          </div>

          {filteredRecords.length ? (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {filteredRecords.map(location => (
                <div
                  key={location.id}
                  className="p-4 rounded-xl bg-surface border border-line hover:border-accent transition-all flex flex-col gap-4"
                >

                  <div className="flex items-center justify-between gap-2">

                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-data font-bold">
                      {location.code || '—'}
                    </span>

                    <ConfigurationStatus status={location.status} />

                  </div>

                  <div>

                    <h3 className="font-bold text-[15px] text-ink">
                      {location.name}
                    </h3>

                    <p className="text-[12px] text-muted mt-1 leading-relaxed">
                      {displayValue(location.address)}
                    </p>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <DetailField
                      label="Timezone"
                      value={location.timezone}
                    />

                    <DetailField
                      label="Primary Contact"
                      value={location.primaryContact}
                    />

                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-line/60 pt-3">

                    <RecordMetric
                      label="Personnel"
                      value={location.totalPersonnel}
                    />

                    <RecordMetric
                      label="Hardware Units"
                      value={location.activeFleetUnits}
                    />

                    <RecordMetric
                      label="Network Subnet"
                      value={location.networkSubnet}
                    />

                  </div>

                  <div className="flex justify-between items-center gap-2 border-t border-line/60 pt-3">

                    <span className="text-[11px] text-muted">
                      Configured site information
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openDetails('loc', location)}
                    >
                      View Details
                    </Button>

                  </div>

                </div>
              ))}

            </div>

          ) : (

            <Card>
              <EmptyState
                icon={IconGlobe}
                message="No locations match the selected filters."
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />
            </Card>

          )}

        </>
      )}

      {/* ENTERPRISE INTEGRATIONS */}

      {currentTab === 'integrations' && (
        <>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <KpiTile
              label="Total Integrations"
              value={integrations.length}
              delta="Configured service connectors"
              deltaType="neutral"
            />

            <KpiTile
              label="Enabled Locally"
              value={enabledIntegrations}
              delta="Local configuration status"
              deltaType="good"
            />

            <KpiTile
              label="Disabled Locally"
              value={integrations.length - enabledIntegrations}
              delta="Remaining connectors"
              deltaType="neutral"
            />

          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface2/40 border border-line">

            <IconAlertTriangle className="w-5 h-5 text-warn shrink-0" />

            <p className="text-[12px] text-muted leading-relaxed">
              Integration switches manage local configuration only.
              Enabling a service does not establish an actual API,
              OAuth, SSO or external provider connection.
            </p>

          </div>

          {filteredRecords.length ? (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {filteredRecords.map(integration => {
                const enabled =
                  normalize(integration.status) === 'connected';

                return (
                  <div
                    key={integration.id}
                    className="p-4 rounded-xl bg-surface border border-line flex flex-col justify-between gap-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-10 h-10 rounded-xl bg-surface2 border border-line flex items-center justify-center shrink-0">
                          {getIntegrationIcon(integration.icon)}
                        </div>

                        <div className="min-w-0">

                          <h3 className="font-bold text-[14px] text-ink">
                            {integration.name}
                          </h3>

                          <span className="text-[11px] text-muted">
                            {integration.category}
                          </span>

                        </div>

                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-label={`Enable local configuration for ${integration.name}`}
                        aria-checked={enabled}
                        disabled={!canUpdateSettings}
                        onClick={() =>
                          requestIntegrationToggle(integration)
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                          enabled
                            ? 'bg-accent'
                            : 'bg-slate-700'
                        } ${
                          !canUpdateSettings
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >

                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          enabled
                            ? 'translate-x-4'
                            : 'translate-x-0'
                        }`} />

                      </button>

                    </div>

                    <p className="text-[12px] text-muted leading-relaxed">
                      {integration.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                      <DetailField
                        label="Configured Sync Interval"
                        value={integration.syncInterval}
                      />

                      <DetailField
                        label="External Connection"
                        value="Not verified"
                      />

                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-line/60 pt-3">

                      <ConfigurationStatus
                        status={integration.status}
                        label={
                          enabled
                            ? 'Enabled locally'
                            : 'Disabled locally'
                        }
                      />

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          openDetails('integration', integration)
                        }
                      >
                        View Details
                      </Button>

                    </div>

                  </div>
                );
              })}

            </div>

          ) : (

            <Card>
              <EmptyState
                icon={IconShare}
                message="No integrations match the selected filters."
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />
            </Card>

          )}

        </>
      )}

      {/* NOTIFICATION RULES */}

      {currentTab === 'notifications' && (
        <>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

            <KpiTile
              label="Total Notification Rules"
              value={notificationRules.length}
              delta="Configured event triggers"
              deltaType="neutral"
            />

            <KpiTile
              label="Enabled Rules"
              value={enabledRules}
              delta="Configured as enabled"
              deltaType="good"
            />

            <KpiTile
              label="Other Rules"
              value={notificationRules.length - enabledRules}
              delta="Not currently enabled"
              deltaType="neutral"
            />

            <KpiTile
              label="Critical Rules"
              value={criticalNotificationRules}
              delta="Enabled critical-priority rules"
              deltaType="warn"
            />

          </div>

          <Card
            title="Notification Configuration"
            subText="Configured event triggers, delivery channels and severity levels"
          >

            {filteredRecords.length ? (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[750px] text-left border-collapse text-[13px]">

                  <thead>

                    <tr className="border-b border-line text-muted font-bold text-[11px] uppercase tracking-wider">

                      <th scope="col" className="py-3 px-3">
                        Event Trigger
                      </th>

                      <th scope="col" className="py-3 px-3">
                        Dispatch Channels
                      </th>

                      <th scope="col" className="py-3 px-3">
                        Severity
                      </th>

                      <th scope="col" className="py-3 px-3">
                        Status
                      </th>

                      <th scope="col" className="py-3 px-3 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-dashed divide-line">

                    {filteredRecords.map(rule => (
                      <tr
                        key={rule.id}
                        className="hover:bg-surface2/40 transition-colors"
                      >

                        <td className="py-3 px-3 font-semibold text-ink">
                          {rule.event}
                        </td>

                        <td className="py-3 px-3">

                          <div className="flex flex-wrap gap-1.5">

                            {Array.isArray(rule.channels) &&
                              rule.channels.length ? (

                              rule.channels.map((channel, index) => (
                                <span
                                  key={`${channel}-${index}`}
                                  className="px-2 py-1 rounded-lg bg-surface2 border border-line text-[11px] text-muted"
                                >
                                  {channel}
                                </span>
                              ))

                            ) : (

                              <span className="text-muted text-[12px]">
                                No channels configured
                              </span>

                            )}

                          </div>

                        </td>

                        <td className="py-3 px-3">

                          <span className={`font-bold uppercase text-[11px] ${
                            normalize(rule.severity) === 'critical'
                              ? 'text-bad'
                              : normalize(rule.severity) === 'high'
                                ? 'text-warn'
                                : 'text-sky-400'
                          }`}>
                            {rule.severity || 'Unspecified'}
                          </span>

                        </td>

                        <td className="py-3 px-3">

                          <ConfigurationStatus
                            status={rule.status}
                          />

                        </td>

                        <td className="py-3 px-3 text-right">

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openDetails('notification', rule)
                            }
                          >
                            View Details
                          </Button>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <EmptyState
                icon={IconHeadphones}
                message="No notification rules match the selected filters."
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />

            )}

            <div className="p-3 rounded-lg border border-line bg-surface2/30">

              <p className="text-[11.5px] text-muted">
                Notification channels are configuration records.
                External email, SMS, Slack and webhook delivery
                require backend integration.
              </p>

            </div>

          </Card>

        </>
      )}

      {/* BACKUP & DISASTER RECOVERY */}

      {currentTab === 'backup' && (
        <div className="flex flex-col gap-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <KpiTile
              label="Recovery Point Objective"
              value={
                backupPolicies.rpo
                  ? String(backupPolicies.rpo).split(' (')[0]
                  : 'Not set'
              }
              delta="Configured RPO target"
              deltaType="neutral"
            />

            <KpiTile
              label="Recovery Time Objective"
              value={
                backupPolicies.rto
                  ? String(backupPolicies.rto).split(' (')[0]
                  : 'Not set'
              }
              delta="Configured RTO target"
              deltaType="neutral"
            />

            <KpiTile
              label="Backup Verification"
              value="Not verified"
              delta="No production provider connected"
              deltaType="warn"
            />

          </div>

          <Card
            title="Disaster Recovery & Backup Policy"
            subText="Review configured backup strategy, encryption and recovery objectives"
            action={canExportSettings ? (
              <Button
                variant="secondary"
                size="sm"
                icon={IconDownload}
                onClick={() => exportConfiguration(false)}
              >
                Export Policy
              </Button>
            ) : null}
          >

            <div className="p-4 rounded-xl bg-surface2/40 border border-line">

              <div className="flex items-center gap-2 mb-2">

                <IconShield className="w-5 h-5 text-accent" />

                <h3 className="font-bold text-[15px] text-ink">
                  Configured Backup Strategy
                </h3>

              </div>

              <p className="text-[13px] text-muted leading-relaxed">
                {displayValue(backupPolicies.strategy)}
              </p>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <DetailField
                label="Recovery Point Objective (RPO)"
                value={backupPolicies.rpo}
              />

              <DetailField
                label="Recovery Time Objective (RTO)"
                value={backupPolicies.rto}
              />

              <DetailField
                label="Encryption Policy"
                value={backupPolicies.encryption}
              />

              <DetailField
                label="Retention Period"
                value={backupPolicies.retentionPeriod}
              />

            </div>

          </Card>

          <Card
            title="Recorded Backup Information"
            subText="Reference values stored in the application configuration"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <DetailField
                label="Sample Backup Verification Date"
                value={backupPolicies.lastVerifiedBackup}
              />

              <DetailField
                label="Sample Backup Health Record"
                value={backupPolicies.backupHealth}
              />

            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-warn/5 border border-warn/30">

              <IconAlertTriangle className="w-5 h-5 text-warn shrink-0" />

              <div>

                <h4 className="font-semibold text-[13px] text-ink">
                  Production Verification Required
                </h4>

                <p className="text-[12px] text-muted mt-1 leading-relaxed">
                  Stored backup information is not proof that a backup
                  has completed successfully. Actual backup execution,
                  restoration and integrity testing require a connected
                  backup service.
                </p>

              </div>

            </div>

          </Card>

          <Card
            title="Configuration Export"
            subText="Download the current settings configuration for reference"
          >

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <h3 className="font-semibold text-[14px] text-ink">
                  Local Configuration Snapshot
                </h3>

                <p className="text-[12px] text-muted mt-1">
                  Includes business units, locations, integrations,
                  notification rules and backup policy configuration.
                  This is not a full application or database backup.
                </p>

              </div>

              {canExportSettings && (

                <Button
                  variant="primary"
                  icon={IconDownload}
                  onClick={() => exportConfiguration(true)}
                >
                  Download Configuration
                </Button>

              )}

            </div>

          </Card>

        </div>
      )}

      {/* CONFIGURATION RECORD DETAILS */}

      {selectedItem &&
        selectedRecord &&
        selectedRecordData && (

        <RecordDetailsModal
          isOpen
          onClose={() => setSelectedItem(null)}
          title={detailTitle}
          record={selectedRecordData}
          fields={detailFields}
          canEdit={false}
          canExport={canExportSettings}
          exportData={{
            source: 'Local configuration',
            productionVerified: false,
            ...selectedRecordData
          }}
          exportFilename={`system-setting-${selectedItem.type}-${safeFilename(
            selectedRecord.id ||
            selectedRecord.code ||
            selectedRecord.name ||
            selectedRecord.event
          )}.json`}
        />

      )}

      {/* INTEGRATION CONFIRMATION */}

      <ConfirmDialog
        isOpen={Boolean(pendingIntegration && canUpdateSettings)}
        title={
          pendingIntegration?.enabled
            ? 'Disable Integration'
            : 'Enable Integration'
        }
        message={
          pendingIntegration
            ? `${
                pendingIntegration.enabled
                  ? 'Disable'
                  : 'Enable'
              } ${pendingIntegration.name} in the local configuration? This does not establish or terminate a real external service connection.`
            : ''
        }
        confirmLabel={
          pendingIntegration?.enabled
            ? 'Disable'
            : 'Enable'
        }
        onCancel={() => setPendingIntegration(null)}
        onConfirm={confirmIntegrationToggle}
      />

      {/* SETTINGS INFORMATION */}

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface2/30 p-3.5">

        <IconShield className="w-4 h-4 shrink-0 text-muted mt-0.5" />

        <p className="text-[11.5px] text-muted leading-relaxed">
          Settings are controlled by role permissions. Integration
          configuration changes use the shared application store.
          Business unit, location, notification and backup records
          are available for review and authorized export.
        </p>

      </div>

    </div>
  );
}

export default SystemSettingsPage;
