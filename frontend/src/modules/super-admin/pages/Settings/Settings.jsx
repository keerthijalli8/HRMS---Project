
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  UserRound,
  ShieldCheck,
  LockKeyhole,
  Save,
  Plus,
  Trash2,
  MoreVertical,
  Eye,
  Pencil,
  Power,
  X
} from "lucide-react";
import GeneralSettings from "./GeneralSettings/GeneralSettings";
import Profile from "./Profile/Profile";
import "./Settings.css";
import { notifySaveSuccess } from "../../utils/saveNavigation";

const ACTIONS = ["View", "Create", "Edit", "Delete", "Export", "Approve"];

const SYSTEM_MODULES = [
  ["Dashboard", "dashboard"], ["Tenant Management", "tenant-management"],
  ["Organization Details", "organization-details"], ["Subscription Details", "subscription-details"],
  ["Plan Management", "plan-management"], ["Billing", "billing"],
  ["Module Management", "module-management"], ["Platform Users", "platform-users"],
  ["Usage Analytics", "usage-analytics"], ["Monitoring", "monitoring"],
  ["Security & Audit Logs", "security-audit-logs"], ["Support", "support"], ["Settings", "settings"]
].map(([name, key]) => ({ id: key, name, key, description: `${name} platform access`, category: "System", icon: "", route: "", enabled: true, protected: true }));

const moduleRegistry = (modules) => (Array.isArray(modules) && modules.length ? modules : SYSTEM_MODULES);

const makePermissions = (role, modules = SYSTEM_MODULES) => {
  const result = {};

  moduleRegistry(modules).forEach((module) => {
    result[module.key] = {};

    ACTIONS.forEach((action) => {
      if (role === "Super Admin") {
        result[module.key][action] = true;
      } else if (role === "Admin") {
        result[module.key][action] = action !== "Delete";
      } else if (role === "Viewer") {
        result[module.key][action] = action === "View";
      } else if (role === "Support Agent") {
        result[module.key][action] =
          action === "View" ||
          (module.name === "Support" && ["Create", "Edit"].includes(action));
      } else {
        result[module.key][action] = action === "View";
      }
    });
  });

  return result;
};

const DEFAULT_ROLES = [
  "Super Admin",
  "Admin",
  "HR Manager",
  "Finance Manager",
  "Support Agent",
  "Viewer"
].map((name) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  locked: name === "Super Admin",
  permissions: makePermissions(name, SYSTEM_MODULES)
}));

function normalizeRoles(savedRoles, modules) {
  const source = Array.isArray(savedRoles) && savedRoles.length ? savedRoles : DEFAULT_ROLES;
  return source.map((role) => {
    const permissions = makePermissions(role.name, modules);
    moduleRegistry(modules).forEach((module) => {
      const previous = role.permissions?.[module.key] || role.permissions?.[module.name];
      if (previous) permissions[module.key] = { ...permissions[module.key], ...previous };
      if (role.locked) permissions[module.key] = Object.fromEntries(ACTIONS.map((action) => [action, true]));
    });
    return { ...role, permissions };
  });
}

function readSaved(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function RolesPermissions() {
  const [modules, setModules] = useState(() => moduleRegistry(readSaved("superAdminModules", SYSTEM_MODULES)));
  const [roles, setRoles] = useState(() => normalizeRoles(readSaved("superAdminRoles", DEFAULT_ROLES), moduleRegistry(readSaved("superAdminModules", SYSTEM_MODULES))));
  const [selectedId, setSelectedId] = useState("super-admin");
  const [newRole, setNewRole] = useState("");
  const [message, setMessage] = useState("");
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [viewingModule, setViewingModule] = useState(null);
  const [moduleMenu, setModuleMenu] = useState(null);
  const [moduleForm, setModuleForm] = useState({ name: "", key: "", description: "", category: "Custom", icon: "", route: "", enabled: true });

  useEffect(() => {
    try { localStorage.setItem("superAdminModules", JSON.stringify(modules)); }
    catch { setMessage("Unable to save module registry."); }
  }, [modules]);

  useEffect(() => {
    try { localStorage.setItem("superAdminRoles", JSON.stringify(roles)); }
    catch { setMessage("Unable to save permissions."); }
  }, [roles]);

  const selected = roles.find((role) => role.id === selectedId) || roles[0];
  const updatePermission = (moduleKey, action, checked) => {
    if (!selected || selected.locked) return;
    setRoles((previous) => previous.map((role) => role.id === selected.id ? { ...role, permissions: { ...role.permissions, [moduleKey]: { ...role.permissions[moduleKey], [action]: checked } } } : role));
    setMessage("");
  };

  const addRole = (event) => {
    event.preventDefault();
    const name = newRole.trim();
    if (!name) return;
    if (roles.some((role) => role.name.toLowerCase() === name.toLowerCase())) return setMessage("This role already exists.");
    const id = `custom-${Date.now()}`;
    setRoles((previous) => [...previous, { id, name, locked: false, permissions: makePermissions("Custom", modules) }]);
    setSelectedId(id); setNewRole(""); setMessage("");
  };

  const deleteRole = () => {
    if (!selected || selected.locked || !window.confirm(`Delete ${selected.name}?`)) return;
    setRoles((previous) => previous.filter((role) => role.id !== selected.id));
    setSelectedId("super-admin"); setMessage("");
  };

  const saveRoles = () => {
    try {
      localStorage.setItem("superAdminRoles", JSON.stringify(roles));
      setMessage("Roles and permissions saved successfully.");
      notifySaveSuccess("Roles and permissions saved successfully.");
    } catch { setMessage("Unable to save permissions."); }
  };

  const openModuleForm = (module = null) => {
    setEditingModule(module);
    setModuleForm(module ? { ...module } : { name: "", key: "", description: "", category: "Custom", icon: "", route: "", enabled: true });
    setModuleFormOpen(true); setModuleMenu(null); setMessage("");
  };

  const saveModule = (event) => {
    event.preventDefault();
    const name = moduleForm.name.trim();
    const key = moduleForm.key.trim().toLowerCase().replace(/\s+/g, "-");
    if (name.length < 2 || key.length < 2) return setMessage("Module name and a unique module key are required.");
    if (!/^[a-z0-9][a-z0-9-_]*$/.test(key)) return setMessage("Module key may contain only letters, numbers, hyphens and underscores.");
    if (modules.some((module) => module.id !== editingModule?.id && (module.name.toLowerCase() === name.toLowerCase() || module.key === key))) return setMessage("A module with this name or key already exists.");
    const record = { ...moduleForm, name, key, description: moduleForm.description.trim(), id: editingModule?.id || `custom-module-${Date.now()}`, protected: false };
    const nextModules = editingModule ? modules.map((module) => module.id === editingModule.id ? record : module) : [...modules, record];
    setModules(nextModules);
    if (!editingModule) {
      setRoles((previous) => previous.map((role) => ({ ...role, permissions: { ...role.permissions, [key]: makePermissions(role.name, [record])[key] } })));
    } else if (editingModule.key !== key) {
      setRoles((previous) => previous.map((role) => {
        const permissions = { ...role.permissions, [key]: role.permissions?.[editingModule.key] || makePermissions(role.name, [record])[key] };
        delete permissions[editingModule.key];
        if (role.locked) permissions[key] = Object.fromEntries(ACTIONS.map((action) => [action, true]));
        return { ...role, permissions };
      }));
    }
    setModuleFormOpen(false); setEditingModule(null); setMessage("");
    notifySaveSuccess(editingModule ? "Module updated successfully." : "Module created successfully.");
  };

  const toggleModule = (module) => {
    setModules((previous) => previous.map((item) => item.id === module.id ? { ...item, enabled: item.enabled === false } : item));
    setModuleMenu(null); notifySaveSuccess(`Module ${module.enabled === false ? "enabled" : "disabled"} successfully.`);
  };

  const deleteModule = (module) => {
    if (module.protected || !window.confirm(`Delete ${module.name}?`)) return;
    setModules((previous) => previous.filter((item) => item.id !== module.id));
    setRoles((previous) => previous.map((role) => { const permissions = { ...role.permissions }; delete permissions[module.key]; return { ...role, permissions }; }));
    setModuleMenu(null); notifySaveSuccess("Module deleted successfully.");
  };

  return (
    <section className="st-panel">
      <div className="st-panel-header"><div><h2>Roles & Permissions</h2><p>Configure role-based access to platform modules.</p></div><div className="st-header-actions"><button className="st-secondary" type="button" onClick={() => openModuleForm()}><Plus size={16} /> Add Module</button><button className="st-primary" type="button" onClick={saveRoles}><Save size={16} /> Save Permissions</button></div></div>
      <form className="st-add-role" onSubmit={addRole}><input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="Enter role name" required /><button className="st-secondary" type="submit"><Plus size={16} /> Add Role</button></form>
      <div className="st-role-layout"><div className="st-role-list">{roles.map((role) => <button key={role.id} type="button" className={`st-role-item ${selected?.id === role.id ? "selected" : ""}`} onClick={() => setSelectedId(role.id)}><strong>{role.name}</strong><small>{role.locked ? "Protected Role" : "Configurable Role"}</small></button>)}</div>
        {selected && <div className="st-role-content"><div className="st-panel-header"><div><h3>{selected.name}</h3><p>Module permissions</p></div>{!selected.locked && <button type="button" className="st-danger" onClick={deleteRole}><Trash2 size={15} /> Delete Role</button>}</div>{selected.locked && <p className="st-note">Super Admin has full access. Permissions cannot be changed.</p>}
          <div className="st-table-wrap"><table className="st-table"><thead><tr><th>Module</th>{ACTIONS.map((action) => <th key={action}>{action}</th>)}</tr></thead><tbody>{modules.map((module) => <tr key={module.id}><td><div className="st-module-name"><div><strong>{module.name}</strong>{module.enabled === false && <small className="st-disabled-label">Disabled</small>}</div>{!module.protected && <div className="st-module-actions"><button type="button" className="st-icon-button" aria-label={`Actions for ${module.name}`} onClick={() => setModuleMenu(moduleMenu === module.id ? null : module.id)}><MoreVertical size={17} /></button>{moduleMenu === module.id && <div className="st-module-menu"><button type="button" onClick={() => { setViewingModule(module); setModuleMenu(null); }}><Eye size={14} /> View Details</button><button type="button" onClick={() => openModuleForm(module)}><Pencil size={14} /> Edit Module</button><button type="button" onClick={() => toggleModule(module)}><Power size={14} /> {module.enabled === false ? "Enable" : "Disable"}</button><button type="button" className="is-danger" onClick={() => deleteModule(module)}><Trash2 size={14} /> Delete Module</button></div>}</div>}</div></td>{ACTIONS.map((action) => <td key={action}><input type="checkbox" disabled={selected.locked || module.enabled === false} checked={Boolean(selected.permissions?.[module.key]?.[action])} onChange={(event) => updatePermission(module.key, action, event.target.checked)} /></td>)}</tr>)}</tbody></table></div>
        </div>}
      </div>
      {message && <p className="st-feedback" role="status">{message}</p>}
      {moduleFormOpen && <div className="st-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModuleFormOpen(false)}><form className="st-modal" onSubmit={saveModule} onMouseDown={(event) => event.stopPropagation()}><div className="st-modal-header"><div><h3>{editingModule ? "Edit Module" : "Add Module"}</h3><p>Register a module in the central permission registry.</p></div><button type="button" className="st-modal-close" onClick={() => setModuleFormOpen(false)}><X size={18} /></button></div><div className="st-module-form-grid"><label>Module Name *<input required value={moduleForm.name} onChange={(event) => setModuleForm({ ...moduleForm, name: event.target.value })} /></label><label>Module Key / Unique ID *<input required value={moduleForm.key} onChange={(event) => setModuleForm({ ...moduleForm, key: event.target.value })} /></label><label className="st-form-full">Module Description<input value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} /></label><label>Module Category<select value={moduleForm.category} onChange={(event) => setModuleForm({ ...moduleForm, category: event.target.value })}><option>Custom</option><option>Operations</option><option>Finance</option><option>People</option><option>Reporting</option></select></label><label>Module Icon (optional)<input value={moduleForm.icon} onChange={(event) => setModuleForm({ ...moduleForm, icon: event.target.value })} /></label><label className="st-form-full">Module Route / Page Path (optional)<input value={moduleForm.route} onChange={(event) => setModuleForm({ ...moduleForm, route: event.target.value })} placeholder="/custom-module" /></label></div>{message && <p className="st-feedback">{message}</p>}<div className="st-modal-footer"><button type="button" className="st-secondary" onClick={() => setModuleFormOpen(false)}>Cancel</button><button type="submit" className="st-primary">Save Module</button></div></form></div>}
      {viewingModule && <div className="st-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setViewingModule(null)}><div className="st-modal st-module-details"><div className="st-modal-header"><div><h3>{viewingModule.name}</h3><p>{viewingModule.key}</p></div><button type="button" className="st-modal-close" onClick={() => setViewingModule(null)}><X size={18} /></button></div><dl><dt>Description</dt><dd>{viewingModule.description || "No description provided."}</dd><dt>Category</dt><dd>{viewingModule.category}</dd><dt>Route</dt><dd>{viewingModule.route || "Not configured"}</dd><dt>Status</dt><dd>{viewingModule.enabled === false ? "Disabled" : "Enabled"}</dd></dl></div></div>}
    </section>
  );
}

const DEFAULT_SECURITY = {
  passwordLength: 12,
  sessionTimeout: 30,
  maxAttempts: 5,
  mfa: false,
  loginAlerts: true,
  auditLogging: true
};

function SecurityPreferences() {
  const [security, setSecurity] = useState(() => ({
    ...DEFAULT_SECURITY,
    ...readSaved("superAdminSecurityPreferences", {})
  }));
  const [message, setMessage] = useState("");

  const update = (key, value) => {
    setSecurity((previous) => ({ ...previous, [key]: value }));
    setMessage("");
  };

  const saveSecurity = (event) => {
    event.preventDefault();

    try {
      localStorage.setItem(
        "superAdminSecurityPreferences",
        JSON.stringify(security)
      );
      setMessage("Security preferences saved successfully.");
      notifySaveSuccess("Security preferences saved successfully.");
    } catch {
      setMessage("Unable to save security preferences.");
    }
  };

  return (
    <form className="st-panel" onSubmit={saveSecurity}>
      <div className="st-panel-header">
        <div>
          <h2>Security Preferences</h2>
          <p>Manage platform security configuration.</p>
        </div>
      </div>

      <div className="st-field-grid">
        <label>
          Minimum Password Length
          <select
            value={security.passwordLength}
            onChange={(event) =>
              update("passwordLength", Number(event.target.value))
            }
          >
            <option value={8}>8 Characters</option>
            <option value={10}>10 Characters</option>
            <option value={12}>12 Characters</option>
            <option value={16}>16 Characters</option>
          </select>
        </label>

        <label>
          Session Timeout
          <select
            value={security.sessionTimeout}
            onChange={(event) =>
              update("sessionTimeout", Number(event.target.value))
            }
          >
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
            <option value={60}>60 Minutes</option>
            <option value={120}>120 Minutes</option>
          </select>
        </label>

        <label>
          Maximum Failed Login Attempts
          <select
            value={security.maxAttempts}
            onChange={(event) =>
              update("maxAttempts", Number(event.target.value))
            }
          >
            <option value={3}>3 Attempts</option>
            <option value={5}>5 Attempts</option>
            <option value={10}>10 Attempts</option>
          </select>
        </label>
      </div>

      {[
        ["mfa", "Multi-Factor Authentication"],
        ["loginAlerts", "Login Alerts"],
        ["auditLogging", "Audit Logging"]
      ].map(([key, title]) => (
        <label className="st-toggle-row" key={key}>
          <span>
            <strong>{title}</strong>
            <small>Enable or disable {title.toLowerCase()} preference.</small>
          </span>

          <input
            type="checkbox"
            checked={security[key]}
            onChange={(event) =>
              update(key, event.target.checked)
            }
          />
        </label>
      ))}

      <div className="st-form-footer">
        {message && <span className="st-feedback" role="status">{message}</span>}

        <button className="st-primary" type="submit">
          <Save size={16} />
          Save Preferences
        </button>
      </div>
    </form>
  );
}

const TABS = [
  { id: "general", label: "General Settings", icon: SettingsIcon },
  { id: "profile", label: "Profile Settings", icon: UserRound },
  { id: "roles", label: "Roles & Permissions", icon: ShieldCheck },
  { id: "security", label: "Security Preferences", icon: LockKeyhole }
];

export default function Settings() {
  const [searchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") || "general";

  const [activeTab, setActiveTab] = useState(
    TABS.some((tab) => tab.id === initialTab)
      ? initialTab
      : "general"
  );

  useEffect(() => {
    const requestedTab = searchParams.get("tab") || "general";
    if (TABS.some((tab) => tab.id === requestedTab)) setActiveTab(requestedTab);
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);

    const url =
      tab === "general"
        ? "/super-admin/settings"
        : `/super-admin/settings?tab=${tab}`;

    window.history.replaceState(null, "", url);
  };

  return (
    <div className="st-page">
      <div className="st-heading">
        <h1>Settings</h1>
        <p>
          Manage platform configuration, profile settings,
          roles, permissions and security.
        </p>
      </div>

      <div className="st-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`st-tab sa-pill-kpi ${activeTab === id ? "active" : ""}`}
            onClick={() => changeTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "profile" && <Profile />}
      {activeTab === "roles" && <RolesPermissions />}
      {activeTab === "security" && <SecurityPreferences />}
    </div>
  );
}
