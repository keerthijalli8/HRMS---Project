import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  CURRENT_COMPANY_KEY,
  COMPANY_WIDGETS,
  getCurrentCompany,
  getEnabledModules,
  readCompanyTheme,
} from "../../utils/companyPortal";
import {
  readLicenseRecords,
  readTenantRecords,
  saveLicenseRecords,
  saveTenantRecords,
  todayISO,
  validateLicenseKey,
} from "../../utils/licenseKeys";
import "./CompanyPortal.css";

function companyVars(theme) {
  return {
    "--company-primary": theme.colors.primary,
    "--company-secondary": theme.colors.secondary,
    "--company-accent": theme.colors.accent,
    "--company-background": theme.colors.background,
    "--company-sidebar": theme.colors.sidebar,
    "--company-header": theme.colors.header,
    "--company-button": theme.colors.button,
    "--company-text": theme.colors.text,
    "--company-font": theme.font.family,
    "--company-font-size": `${theme.font.size}px`,
    "--company-font-weight": theme.font.weight,
    "--company-sidebar-width": `${theme.layout.sidebarWidth}px`,
    "--company-menu-background": theme.menu.background,
    "--company-menu-active": theme.menu.active,
    "--company-menu-text": theme.menu.text,
  };
}

function getStoredTenants() {
  return readTenantRecords();
}

export function useCompanyAccess() {
  const [current, setCurrent] = useState(getCurrentCompany);
  useEffect(() => {
    const refresh = () => setCurrent(getCurrentCompany());
    window.addEventListener("storage", refresh);
    window.addEventListener("hrms:license-updated", refresh);
    window.addEventListener("hrms:tenant-updated", refresh);
    window.addEventListener("hrms:company-session-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hrms:license-updated", refresh);
      window.removeEventListener("hrms:tenant-updated", refresh);
      window.removeEventListener("hrms:company-session-updated", refresh);
    };
  }, []);
  return current;
}

export function CompanyActivation() {
  const [licenseKey, setLicenseKey] = useState("");
  const [message, setMessage] = useState("");
  const [activatedTenant, setActivatedTenant] = useState(null);
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const activate = (event) => {
    event.preventDefault();
    setMessage("");
    setActivatedTenant(null);
    setIsError(false);
    const tenants = getStoredTenants();
    const licenses = readLicenseRecords();
    const result = validateLicenseKey(licenseKey, licenses, tenants);
    if (result.alreadyActivated) {
      try {
        sessionStorage.setItem(CURRENT_COMPANY_KEY, result.tenant.id);
        window.dispatchEvent(new Event("hrms:company-session-updated"));
        setActivatedTenant(result.tenant);
        setMessage(result.message);
        return;
      } catch {
        setIsError(true);
        setMessage("Unable to open the existing company workspace from browser storage.");
        return;
      }
    }
    if (!result.valid) {
      setIsError(true);
      setMessage(result.message);
      return;
    }

    const activatedAt = todayISO();
    const nextLicenses = licenses.map((license) =>
      license.key.toUpperCase() === result.license.key.toUpperCase()
        ? { ...license, status: "Active", activatedAt }
        : license
    );
    const nextTenants = tenants.map((tenant) =>
      tenant.id === result.tenant.id
        ? {
            ...tenant,
            status: "Active",
            activatedAt,
            enabledModules: result.license.modules || tenant.enabledModules || [],
            permissions: Array.isArray(tenant.permissions)
              ? tenant.permissions.filter((module) =>
                  (result.license.modules || tenant.enabledModules || []).includes(module)
                )
              : result.license.modules || tenant.enabledModules || [],
          }
        : tenant
    );

    try {
      saveTenantRecords(nextTenants);
      saveLicenseRecords(nextLicenses);
      sessionStorage.setItem(CURRENT_COMPANY_KEY, result.tenant.id);
      window.dispatchEvent(new Event("hrms:company-session-updated"));
      setActivatedTenant({ ...result.tenant, status: "Active", activatedAt });
      setMessage(`${result.tenant.name} is activated. Its enabled modules and license are now available.`);
    } catch {
      try {
        saveTenantRecords(tenants);
        saveLicenseRecords(licenses);
      } catch {
        setIsError(true);
        setMessage("Activation could not be saved in browser storage. Check available storage and try again.");
        return;
      }
      setIsError(true);
      setMessage("Activation could not be saved in browser storage. Check available storage and try again.");
    }
  };

  return (
    <main className="company-public-page">
      <div className="company-public-card">
        <div className="company-public-mark"><KeyRound size={23} /></div>
        <span className="company-public-eyebrow">HRMS COMPANY ACCESS</span>
        <h1>Activate your company</h1>
        <p>Enter the license key shared by your Super Admin. This frontend demo validates the key against tenant records stored in this browser.</p>
        {!activatedTenant ? (
          <form onSubmit={activate} className="company-activation-form">
            <label htmlFor="company-license-key">License Key</label>
            <input
              id="company-license-key"
              value={licenseKey}
              onChange={(event) => setLicenseKey(event.target.value.toUpperCase())}
              placeholder="TMHR-XXXX-XXXX-XXXX-XXXX"
              pattern="TMHR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}"
              autoComplete="off"
              required
            />
            <button type="submit">Validate &amp; Activate <ArrowRight size={17} /></button>
          </form>
        ) : (
          <div className="company-activation-success">
            <CheckCircle2 size={20} />
            <span>{activatedTenant.name} · {activatedTenant.id}</span>
          </div>
        )}
        {message && <p className={`company-form-message ${isError ? "error" : "success"}`} role="status">{message}</p>}
        {activatedTenant ? (
          <button type="button" className="company-secondary-button" onClick={() => navigate("/super-admin/company")}>
            Open Company Dashboard
          </button>
        ) : (
          <Link className="company-public-back" to="/super-admin/tenants">Super Admin tenant management</Link>
        )}
        <p className="company-demo-note">Demo only: this activation does not change authentication or connect to a backend.</p>
      </div>
    </main>
  );
}

function modulePath(moduleName) {
  return `/super-admin/company/modules/${encodeURIComponent(moduleName)}`;
}

export function CompanyFrame({ tenant, theme, selectedModule = "", children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const enabledModules = getEnabledModules(tenant);
  const signOutDemo = () => {
    sessionStorage.removeItem(CURRENT_COMPANY_KEY);
    window.dispatchEvent(new Event("hrms:company-session-updated"));
    navigate("/super-admin/activate");
  };

  return (
    <div
      className={`company-shell density-${theme.layout.density.toLowerCase()} menu-${theme.menu.style.toLowerCase().replaceAll(" ", "-")} icons-${theme.menu.iconStyle.toLowerCase()} sidebar-${theme.layout.sidebarPosition.toLowerCase()} header-${theme.layout.headerLayout.toLowerCase()} content-${theme.layout.contentLayout.toLowerCase()} cards-${theme.layout.cardLayout.toLowerCase().replaceAll(" ", "-")} spacing-${theme.layout.spacing.toLowerCase()} ${collapsed ? "is-collapsed" : ""}`}
      style={companyVars(theme)}
    >
      <aside className="company-sidebar">
        <Link
          to="/super-admin/company"
          className="company-brand"
          title={tenant.name}
          style={{
            justifyContent: theme.logoPosition === "right"
              ? "flex-end"
              : theme.logoPosition === "center"
                ? "center"
                : "flex-start",
          }}
        >
          {theme.logos.sidebar ? (
            <img src={theme.logos.sidebar} alt={`${tenant.name} logo`} style={{ width: theme.logoWidth, objectPosition: theme.logoPosition }} />
          ) : (
            <span className="company-brand-initial">{tenant.name.slice(0, 1).toUpperCase()}</span>
          )}
          {theme.menu.style !== "Icon-only Sidebar" && <strong>{tenant.name}</strong>}
        </Link>
        <nav className="company-nav">
          <Link to="/super-admin/company" className={!selectedModule && !location.pathname.includes("/settings/theme") ? "active" : ""}><LayoutDashboard size={18} /><span>Dashboard</span></Link>
          {enabledModules.filter((module) => module !== "Dashboard").map((module) => (
            <Link key={module} to={modulePath(module)} className={selectedModule === module ? "active" : ""}>
              <Building2 size={17} /><span>{module}</span>
            </Link>
          ))}
          <Link to="/super-admin/company/settings/theme" className={location.pathname.includes("/settings/theme") ? "active" : ""}><Settings2 size={18} /><span>Company Theme Builder</span></Link>
        </nav>
        {theme.menu.style === "Collapsible Sidebar" && (
          <button type="button" className="company-collapse-toggle" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? "Expand menu" : "Collapse menu"}
          </button>
        )}
        <button type="button" className="company-signout" onClick={signOutDemo}><LogOut size={17} /><span>End demo session</span></button>
      </aside>

      <main className="company-main">
        <header className="company-topbar">
          <div>
            <span>COMPANY ADMIN</span>
            <strong>{tenant.name}</strong>
          </div>
          <div className="company-topbar-actions">
            <span className="company-license-chip"><CheckCircle2 size={14} /> License active</span>
            <Link to="/super-admin/company/settings/theme"><Settings2 size={16} /> Theme Builder</Link>
            {theme.logos.sidebar && <img src={theme.logos.sidebar} alt="" />}
          </div>
        </header>
        <section className="company-content">{children}</section>
      </main>
    </div>
  );
}

export function CompanyDashboard() {
  const current = useCompanyAccess();
  const { module: requestedModule } = useParams();
  if (!current) return <Navigate to="/super-admin/activate" replace />;
  const { tenant } = current;
  const enabledModules = getEnabledModules(tenant);
  const theme = readCompanyTheme(tenant.id);
  const selectedModule = requestedModule
    ? decodeURIComponent(requestedModule)
    : "";
  const hasAccess = !selectedModule || enabledModules.includes(selectedModule);
  const widgets = COMPANY_WIDGETS.filter(
    (widget) =>
      enabledModules.includes(widget.module) &&
      theme.widgets.includes(widget.name)
  );

  return (
    <CompanyFrame tenant={tenant} theme={theme} selectedModule={selectedModule}>
          {!hasAccess ? (
            <div className="company-restricted">
              <ShieldAlert size={28} />
              <h1>Module not enabled</h1>
              <p>This company does not have access to {selectedModule}. Ask the Super Admin to update the subscription modules.</p>
              <Link to="/super-admin/company">Return to dashboard</Link>
            </div>
          ) : selectedModule ? (
            <div className="company-module-view">
              <span className="company-section-eyebrow">ENABLED HRMS MODULE</span>
              <h1>{selectedModule}</h1>
              <p>{selectedModule} is included in the {tenant.plan} license for this company.</p>
              <div className="company-demo-panel">
                <Building2 size={25} />
                <div><strong>{selectedModule} workspace</strong><span>Frontend demo module access is scoped to {tenant.id}.</span></div>
              </div>
            </div>
          ) : (
            <>
              <div className="company-page-heading">
                <div>
                  <span className="company-section-eyebrow">COMPANY WORKSPACE</span>
                  <h1>Welcome, {tenant.contact || "Company Admin"}</h1>
                  <p>Your {tenant.plan} workspace is active. Only licensed modules are shown.</p>
                </div>
                <Link to="/super-admin/company/settings/theme"><Settings2 size={17} /> Customize workspace</Link>
              </div>
              <div className="company-summary-grid">
                <article><span>Subscription plan</span><strong>{tenant.plan}</strong></article>
                <article><span>Employee count</span><strong>{Number(tenant.users || 0).toLocaleString("en-IN")}</strong></article>
                <article><span>Enabled modules</span><strong>{enabledModules.length}</strong></article>
              </div>
              <div className="company-widget-grid">
                {widgets.map((widget) => (
                  <article key={widget.name} className="company-widget">
                    <span className="company-widget-icon"><Users size={20} /></span>
                    <div><span>{widget.name}</span><strong>{widget.name === "Employee overview" ? Number(tenant.users || 0).toLocaleString("en-IN") : "Workspace ready"}</strong></div>
                    <Link to={modulePath(widget.module)} aria-label={`Open ${widget.module}`}><ArrowRight size={17} /></Link>
                  </article>
                ))}
                {!widgets.length && <div className="company-empty-widget">No dashboard widgets are enabled. Choose widgets in the Theme Builder.</div>}
              </div>
              <div className="company-enabled-list"><strong>Enabled modules</strong><div>{enabledModules.map((module) => <Link key={module} to={modulePath(module)}>{module}<ArrowRight size={14} /></Link>)}</div></div>
            </>
          )}
    </CompanyFrame>
  );
}
