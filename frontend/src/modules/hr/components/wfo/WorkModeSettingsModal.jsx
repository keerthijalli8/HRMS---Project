import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import { loadWorkModeSettings, saveWorkModeSettings } from '../../services/wfoWfhStore.js';
import { getCurrentLocation } from '../../services/geoLocation.js';

export const WorkModeSettingsModal = ({ isOpen, onClose, onTriggerToast }) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState(() => loadWorkModeSettings());
  const [activeTab, setActiveTab] = useState("office"); // "office" | "wifi" | "wfh" | "departments"
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const handleSave = () => {
    const success = saveWorkModeSettings(settings);
    if (success) {
      onTriggerToast?.("Work mode & geofence settings saved successfully!");
      onClose();
    } else {
      onTriggerToast?.("Failed to save settings");
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsDetectingGps(true);
    const res = await getCurrentLocation();
    setIsDetectingGps(false);
    if (res.ok) {
      setSettings(prev => ({
        ...prev,
        primaryOffice: {
          ...prev.primaryOffice,
          latitude: parseFloat(res.lat.toFixed(6)),
          longitude: parseFloat(res.lon.toFixed(6)),
          address: res.label ? `${prev.primaryOffice.name}, ${res.label}` : prev.primaryOffice.address
        }
      }));
      onTriggerToast?.(`Coordinates detected: ${res.lat.toFixed(4)}, ${res.lon.toFixed(4)}`);
    } else {
      onTriggerToast?.("Unable to detect current coordinates. Check browser permission.");
    }
  };

  const setOfficePreset = (name, address, lat, lon, radius) => {
    setSettings(prev => ({
      ...prev,
      primaryOffice: {
        ...prev.primaryOffice,
        name,
        address,
        latitude: lat,
        longitude: lon,
        geofenceRadiusMeters: radius
      }
    }));
    onTriggerToast?.(`Loaded ${name} preset`);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="settings" className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-base">Work Mode & Geofence Configuration</div>
              <div className="text-xs text-muted">Admin / HR Master Settings for WFO verification and WFH governance</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
          >
            <Icon name="x" className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-line flex gap-2 overflow-x-auto text-xs">
          {[
            { id: "office", label: "Office & Geofence", icon: "map-pin" },
            { id: "wifi", label: "Wi-Fi & Dual Factor", icon: "shield" },
            { id: "wfh", label: "WFH Rules", icon: "home" },
            { id: "departments", label: "Department Policies", icon: "users" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Icon name={tab.icon} className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-accent' : 'text-muted'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4 text-xs">
          {/* TAB 1: Office & Geofence */}
          {activeTab === "office" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-ink text-sm">Primary Campus Geofence</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOfficePreset(
                      "Nexora Cyber Gateway HQ",
                      "Block A, Cyber Gateway, Phase 2, HITEC City, Hyderabad 500081",
                      17.4483,
                      78.3742,
                      200
                    )}
                    className="px-2 py-1 rounded bg-surface2 border border-line text-[11px] text-muted hover:text-ink hover:border-accent"
                  >
                    Hyderabad HQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfficePreset(
                      "Nexora Manyata Tech Park",
                      "Manyata Embassy Business Park, Outer Ring Rd, Bengaluru 560045",
                      13.0458,
                      77.6208,
                      250
                    )}
                    className="px-2 py-1 rounded bg-surface2 border border-line text-[11px] text-muted hover:text-ink hover:border-accent"
                  >
                    Bengaluru Campus
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Office Name</label>
                <input
                  type="text"
                  value={settings.primaryOffice.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    primaryOffice: { ...settings.primaryOffice, name: e.target.value }
                  })}
                  className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Street Address</label>
                <input
                  type="text"
                  value={settings.primaryOffice.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    primaryOffice: { ...settings.primaryOffice, address: e.target.value }
                  })}
                  className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-ink">Latitude (°N)</label>
                    <button
                      type="button"
                      disabled={isDetectingGps}
                      onClick={handleUseCurrentLocation}
                      className="text-accent underline text-[11px] font-semibold hover:text-white"
                    >
                      {isDetectingGps ? "Detecting..." : "Detect My GPS"}
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.primaryOffice.latitude}
                    onChange={(e) => setSettings({
                      ...settings,
                      primaryOffice: { ...settings.primaryOffice, latitude: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink font-mono focus:border-accent outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.primaryOffice.longitude}
                    onChange={(e) => setSettings({
                      ...settings,
                      primaryOffice: { ...settings.primaryOffice, longitude: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink font-mono focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-ink">Geofence Radius (Meters)</label>
                  <span className="font-bold font-data text-accent text-xs">{settings.primaryOffice.geofenceRadiusMeters} meters</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={settings.primaryOffice.geofenceRadiusMeters}
                  onChange={(e) => setSettings({
                    ...settings,
                    primaryOffice: { ...settings.primaryOffice, geofenceRadiusMeters: parseInt(e.target.value, 10) }
                  })}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>50m (Strict Entrance)</span>
                  <span>200m (Standard Tech Park)</span>
                  <span>1000m (Large SEZ Campus)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Wi-Fi & Dual Factor */}
          {activeTab === "wifi" && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-surface2/60 border border-line/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink text-sm">Dual-Factor WFO Requirement</div>
                  <div className="text-muted text-[11px]">
                    Do not mark WFO as verified using GPS alone; require corporate Wi-Fi/LAN connection.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.wifiVerification.requireDualFactor}
                    onChange={(e) => setSettings({
                      ...settings,
                      wifiVerification: {
                        ...settings.wifiVerification,
                        requireDualFactor: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">
                  Authorized Corporate SSIDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={settings.wifiVerification.corporateSSIDs.join(", ")}
                  onChange={(e) => setSettings({
                    ...settings,
                    wifiVerification: {
                      ...settings.wifiVerification,
                      corporateSSIDs: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink font-mono text-xs focus:border-accent outline-none"
                />
                <span className="text-muted text-[10.5px] mt-1 block">
                  Example: Nexora-Secure-Office, Nexora-Corp-5G, T-Hub-Campus
                </span>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">
                  Allowed Corporate Subnets / IP Ranges (CIDR)
                </label>
                <input
                  type="text"
                  value={settings.wifiVerification.corporateSubnets.join(", ")}
                  onChange={(e) => setSettings({
                    ...settings,
                    wifiVerification: {
                      ...settings.wifiVerification,
                      corporateSubnets: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink font-mono text-xs focus:border-accent outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: WFH Rules */}
          {activeTab === "wfh" && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-surface2/60 border border-line/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink text-sm">Manager / HR Approval Required</div>
                  <div className="text-muted text-[11px]">
                    Employees must submit a WFH request ticket and obtain approval before checking in remotely.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.wfhPolicy.globalApprovalRequired}
                    onChange={(e) => setSettings({
                      ...settings,
                      wfhPolicy: {
                        ...settings.wfhPolicy,
                        globalApprovalRequired: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Max WFH Days Allowed / Month</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.wfhPolicy.maxWfhDaysPerMonth}
                    onChange={(e) => setSettings({
                      ...settings,
                      wfhPolicy: {
                        ...settings.wfhPolicy,
                        maxWfhDaysPerMonth: parseInt(e.target.value, 10) || 8
                      }
                    })}
                    className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink font-data focus:border-accent outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Advance Notice Required (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="72"
                    value={settings.wfhPolicy.advanceNoticeHours}
                    onChange={(e) => setSettings({
                      ...settings,
                      wfhPolicy: {
                        ...settings.wfhPolicy,
                        advanceNoticeHours: parseInt(e.target.value, 10) || 24
                      }
                    })}
                    className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-ink font-data focus:border-accent outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Department Policies */}
          {activeTab === "departments" && (
            <div className="flex flex-col gap-3">
              <span className="font-bold text-ink text-sm">Department-wise Work Policies</span>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Mode</th>
                      <th className="p-2.5">WFO Days Req.</th>
                      <th className="p-2.5">Approval Needed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {Object.entries(settings.wfhPolicy.departmentRules || {}).map(([dept, rule]) => (
                      <tr key={dept} className="hover:bg-surface2/30">
                        <td className="p-2.5 font-semibold text-ink">{dept}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface2 border border-line">
                            {rule.mode}
                          </span>
                        </td>
                        <td className="p-2.5 font-data">{rule.wfoDaysRequired} days/wk</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                            rule.approvalRequired
                              ? "bg-warn/15 text-warn border-warn/30"
                              : "bg-good/15 text-good border-good/30"
                          }`}>
                            {rule.approvalRequired ? "Ticket Required" : "Pre-Permitted"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-surface2/30">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all settings to company defaults?")) {
                localStorage.removeItem("hrms_work_mode_settings_v1");
                setSettings(loadWorkModeSettings());
                onTriggerToast?.("Settings reset to defaults");
              }
            }}
            className="text-muted hover:text-bad font-semibold text-xs transition"
          >
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton icon="check" onClick={handleSave}>
              Save Policies
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
