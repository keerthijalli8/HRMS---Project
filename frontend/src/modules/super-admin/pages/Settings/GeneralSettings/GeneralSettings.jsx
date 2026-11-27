
import React, { useMemo, useState } from "react";
import "./GeneralSettings.css";
import { notifySaveSuccess } from "../../../utils/saveNavigation";

const DEFAULT_SETTINGS = {
  platformName: "HRMS Super Admin",
  supportEmail: "support@example.com",
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  maintenanceMode: false,
  emailNotifications: true
};

const FALLBACK_TIMEZONES = [
  "UTC", "Africa/Cairo", "Africa/Johannesburg", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/New_York",
  "America/Sao_Paulo", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta",
  "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Melbourne",
  "Australia/Sydney", "Europe/Amsterdam", "Europe/Berlin", "Europe/London",
  "Europe/Paris", "Europe/Rome", "Pacific/Auckland", "Pacific/Honolulu"
];

const getTimezoneIds = () => {
  const supported = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : FALLBACK_TIMEZONES;
  return ["UTC", ...supported.filter((zone) => zone !== "UTC")];
};

const timezoneName = (zone) => zone.replace(/_/g, " ").replace(/\//g, " / ");

const timezoneOffset = (zone) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset"
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;
    return offset?.replace("GMT", "UTC") || "UTC";
  } catch {
    return "UTC";
  }
};

const timezoneLabel = (zone) => `${timezoneName(zone)} (${timezoneOffset(zone)})`;

export default function GeneralSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("superAdminSettings");
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [message, setMessage] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState(() => timezoneLabel(settings.timezone));
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const timezoneOptions = useMemo(() => getTimezoneIds(), []);
  const filteredTimezones = useMemo(() => {
    const query = timezoneSearch.trim().toLowerCase();
    return timezoneOptions
      .filter((zone) => !query || `${zone} ${timezoneName(zone)}`.toLowerCase().includes(query))
      .slice(0, 80);
  }, [timezoneOptions, timezoneSearch]);

  const updateField = (field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value
    }));
    setMessage("");
  };

  const handleSave = (event) => {
    event.preventDefault();

    try {
      localStorage.setItem(
        "superAdminSettings",
        JSON.stringify(settings)
      );
      window.dispatchEvent(new Event("superAdminSettingsUpdated"));

      setMessage("General settings saved successfully.");
      notifySaveSuccess("General settings saved successfully.");
    } catch {
      setMessage("Unable to save settings.");
    }
  };

  return (
    <div className="gs-page">
      <div className="gs-heading">
        <h2>General Settings</h2>
        <p>Configure your HRMS platform preferences.</p>
      </div>

      <form className="gs-panel" onSubmit={handleSave}>
        <div className="gs-field-grid">
          <label className="gs-field">
            <span>Platform Name</span>
            <input
              type="text"
              value={settings.platformName}
              onChange={(event) =>
                updateField("platformName", event.target.value)
              }
              required
            />
          </label>

          <label className="gs-field">
            <span>Support Email</span>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(event) =>
                updateField("supportEmail", event.target.value)
              }
              required
            />
          </label>

          <label className="gs-field gs-timezone-field">
            <span>Timezone</span>
            <div className="gs-timezone-picker">
              <input
                value={timezoneSearch}
                role="combobox"
                aria-expanded={timezoneOpen}
                aria-label="Search timezone by country or city"
                onFocus={() => setTimezoneOpen(true)}
                onChange={(event) => { setTimezoneSearch(event.target.value); setTimezoneOpen(true); }}
                onBlur={() => window.setTimeout(() => setTimezoneOpen(false), 150)}
              />
              {timezoneOpen && <div className="gs-timezone-options" role="listbox">
                {filteredTimezones.map((zone) => <button
                  type="button"
                  role="option"
                  aria-selected={settings.timezone === zone}
                  key={zone}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { updateField("timezone", zone); setTimezoneSearch(timezoneLabel(zone)); setTimezoneOpen(false); }}
                >{timezoneLabel(zone)}</button>)}
                {!filteredTimezones.length && <span className="gs-timezone-empty">No matching IANA timezone.</span>}
              </div>}
            </div>
            <small className="gs-field-hint">IANA timezone: {settings.timezone}. Daylight-saving rules are applied automatically.</small>
          </label>

          <label className="gs-field">
            <span>Date Format</span>
            <select
              value={settings.dateFormat}
              onChange={(event) =>
                updateField("dateFormat", event.target.value)
              }
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </label>
        </div>

        <div className="gs-toggle">
          <div>
            <strong>Maintenance Mode</strong>
            <p>Enable the maintenance mode preference.</p>
          </div>

          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(event) =>
              updateField("maintenanceMode", event.target.checked)
            }
          />
        </div>

        <div className="gs-toggle">
          <div>
            <strong>Email Notifications</strong>
            <p>Enable platform email notification preference.</p>
          </div>

          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(event) =>
              updateField("emailNotifications", event.target.checked)
            }
          />
        </div>

        <div className="gs-footer">
          {message && <span>{message}</span>}

          <button className="gs-save" type="submit">
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
