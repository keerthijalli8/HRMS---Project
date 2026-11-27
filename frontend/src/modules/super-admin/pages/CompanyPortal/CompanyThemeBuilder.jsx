import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import {
  COMPANY_WIDGETS,
  DEFAULT_COMPANY_THEME,
  DEFAULT_EMAIL_TEMPLATES,
  getEnabledModules,
  readCompanyTheme,
  saveCompanyTheme,
} from "../../utils/companyPortal";
import { readTenantRecords } from "../../utils/licenseKeys";
import { CompanyFrame, useCompanyAccess } from "./CompanyPortal";
import "./CompanyPortal.css";

const SECTIONS = [
  "Logo",
  "Colours",
  "Fonts",
  "Layout",
  "Menu Style",
  "Dashboard Widgets",
  "Login Page",
  "Company Domain",
  "Email Templates",
];
const FONT_OPTIONS = ["Inter", "Poppins", "Roboto", "Manrope", "Open Sans", "Lato"];
const COLOR_FIELDS = [
  ["primary", "Primary Colour"],
  ["secondary", "Secondary Colour"],
  ["accent", "Accent Colour"],
  ["background", "Background Colour"],
  ["sidebar", "Sidebar Colour"],
  ["header", "Header Colour"],
  ["button", "Button Colour"],
  ["text", "Text Colour"],
];
const EMAIL_FIELDS = Object.keys(DEFAULT_EMAIL_TEMPLATES);

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function templatePreview(text, tenant) {
  return String(text || "")
    .replaceAll("{{employee_name}}", "Jordan Lee")
    .replaceAll("{{company_name}}", tenant.name)
    .replaceAll("{{year}}", String(new Date().getFullYear()))
    .replaceAll("{{date}}", new Date().toLocaleDateString())
    .replaceAll("{{action_link}}", "https://example.test/action");
}

function fileToDataUrl(file, allowedTypes, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!allowedTypes.includes(file.type)) {
      reject(new Error("Choose a supported image format."));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error("The selected file is too large."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function CompanyThemeBuilder() {
  const current = useCompanyAccess();
  const tenant = current?.tenant;
  const [theme, setTheme] = useState(() =>
    readCompanyTheme(tenant?.id || "unavailable")
  );
  const [hexDrafts, setHexDrafts] = useState(() =>
    Object.fromEntries(COLOR_FIELDS.map(([field]) => [field, theme.colors[field]]))
  );
  const [section, setSection] = useState("Logo");
  const [activeTemplate, setActiveTemplate] = useState(EMAIL_FIELDS[0]);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [domainChecked, setDomainChecked] = useState(false);
  const enabledModules = getEnabledModules(tenant || {});

  if (!current) return <Navigate to="/super-admin/activate" replace />;

  const updateTop = (field, value) => {
    setTheme((previous) => ({ ...previous, [field]: value }));
    setMessage("");
  };
  const updateSection = (sectionName, field, value) => {
    setTheme((previous) => ({
      ...previous,
      [sectionName]: { ...previous[sectionName], [field]: value },
    }));
    setMessage("");
  };
  const handleUpload = async (event, updatePath) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    try {
      const data = await fileToDataUrl(file, imageTypes, 2 * 1024 * 1024);
      updatePath(data);
    } catch (error) {
      setMessageError(true);
      setMessage(error.message);
    } finally {
      event.target.value = "";
    }
  };
  const save = () => {
    try {
      saveCompanyTheme(tenant.id, theme);
      setMessageError(false);
      setMessage("Company theme saved. It will remain isolated to this tenant.");
    } catch {
      setMessageError(true);
      setMessage("Unable to save the theme in browser storage.");
    }
  };
  const reset = () => {
    if (!window.confirm("Reset this company's theme settings to defaults?")) return;
    const defaults = {
      ...DEFAULT_COMPANY_THEME,
      widgets: COMPANY_WIDGETS
        .filter((widget) => enabledModules.includes(widget.module))
        .map((widget) => widget.name),
    };
    try {
      saveCompanyTheme(tenant.id, defaults);
      setTheme(readCompanyTheme(tenant.id));
      setHexDrafts(Object.fromEntries(COLOR_FIELDS.map(([field]) => [field, defaults.colors[field]])));
      setMessageError(false);
      setMessage("Theme settings restored to defaults.");
    } catch {
      setMessageError(true);
      setMessage("Unable to reset the theme in browser storage.");
    }
  };
  const updateColor = (name, value) => {
    if (safeColor(value)) {
      updateSection("colors", name, value);
      setHexDrafts((previous) => ({ ...previous, [name]: value }));
    }
    else {
      setMessageError(true);
      setMessage("Enter a valid six-digit hexadecimal colour.");
    }
  };
  const changeHexDraft = (name, value) => {
    setHexDrafts((previous) => ({ ...previous, [name]: value }));
    const normalized = value.startsWith("#") ? value : `#${value}`;
    if (safeColor(normalized)) updateColor(name, normalized);
  };
  const validateHexDraft = (name) => {
    const value = hexDrafts[name];
    const normalized = value.startsWith("#") ? value : `#${value}`;
    if (safeColor(normalized)) {
      updateColor(name, normalized);
      return;
    }
    setHexDrafts((previous) => ({ ...previous, [name]: theme.colors[name] }));
    setMessageError(true);
    setMessage("Enter a valid six-digit hexadecimal colour.");
  };
  const setWidgetEnabled = (name, enabled) => {
    const widgets = enabled
      ? [...theme.widgets, name]
      : theme.widgets.filter((item) => item !== name);
    updateTop("widgets", widgets);
  };
  const moveWidget = (name, direction) => {
    const index = theme.widgets.indexOf(name);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= theme.widgets.length) return;
    const widgets = [...theme.widgets];
    [widgets[index], widgets[nextIndex]] = [widgets[nextIndex], widgets[index]];
    updateTop("widgets", widgets);
  };
  const checkDomain = () => {
    const subdomain = theme.domain.subdomain.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) {
      setDomainChecked(false);
      setMessageError(true);
      setMessage("Use 1–63 lowercase letters, numbers, or internal hyphens.");
      return;
    }
    const isTaken = readTenantRecords().some((otherTenant) => {
      if (otherTenant.id === tenant.id) return false;
      const otherTheme = readCompanyTheme(otherTenant.id);
      return otherTheme.domain.subdomain.toLowerCase() === subdomain;
    });
    setDomainChecked(!isTaken);
    setMessageError(isTaken);
    setMessage(isTaken ? "That demo subdomain is already requested." : "This demo subdomain is available to request.");
  };
  const saveDomainRequest = () => {
    if (!domainChecked) {
      setMessageError(true);
      setMessage("Check the subdomain before saving the request.");
      return;
    }
    updateSection("domain", "status", "Pending Verification");
    const next = {
      ...theme,
      domain: { ...theme.domain, status: "Pending Verification" },
    };
    try {
      saveCompanyTheme(tenant.id, next);
      setTheme(next);
      setMessageError(false);
      setMessage("Domain request saved as Pending Verification. DNS and backend setup are not included.");
    } catch {
      setMessageError(true);
      setMessage("Unable to save the domain request in browser storage.");
    }
  };
  const updateTemplate = (field, value) => {
    updateSection("emailTemplates", activeTemplate, {
      ...theme.emailTemplates[activeTemplate],
      [field]: value,
    });
  };
  const vars = {
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
  };

  return (
    <CompanyFrame tenant={tenant} theme={theme}>
      <div className="company-builder" style={vars}>
        <div className="company-builder-heading">
          <div>
            <span className="company-section-eyebrow">SETTINGS / COMPANY THEME BUILDER</span>
            <h1>Make this workspace yours</h1>
            <p>Changes are stored only for {tenant.name} ({tenant.id}). Super Admin branding is not affected.</p>
          </div>
          <div className="company-builder-actions">
            <button type="button" className="company-reset-button" onClick={reset}><RotateCcw size={16} /> Reset defaults</button>
            <button type="button" className="company-save-button" onClick={save}><Save size={16} /> Apply Changes</button>
          </div>
        </div>

        <div className="company-builder-tabs" role="tablist" aria-label="Theme settings">
          {SECTIONS.map((item) => (
            <button type="button" role="tab" aria-selected={section === item} className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>{item}</button>
          ))}
        </div>

        {message && <div className={`company-builder-message ${messageError ? "error" : ""}`} role="status">{message}</div>}

        <div className="company-builder-grid">
          <section className="company-builder-panel">
            {section === "Logo" && (
              <div className="company-builder-fields">
                <h2>Company logos</h2>
                <p>Use PNG, JPG, JPEG, or SVG images up to 2 MB. Images are stored in this browser for this tenant.</p>
                {[
                  ["sidebar", "Sidebar and topbar logo"],
                  ["login", "Login page logo"],
                ].map(([field, label]) => (
                  <div className="company-upload-row" key={field}>
                    <label>{label}<input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={(event) => handleUpload(event, (value) => updateSection("logos", field, value))} /></label>
                    <div className="company-upload-preview">{theme.logos[field] ? <img src={theme.logos[field]} alt={`${label} preview`} /> : <span>Default company monogram</span>}</div>
                    <button type="button" onClick={() => updateSection("logos", field, "")}>Restore default</button>
                  </div>
                ))}
                <label className="company-field">Logo width <strong>{theme.logoWidth}px</strong><input type="range" min="72" max="240" value={theme.logoWidth} onChange={(event) => updateTop("logoWidth", Number(event.target.value))} /></label>
                <label className="company-field">Logo position<select value={theme.logoPosition} onChange={(event) => updateTop("logoPosition", event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
              </div>
            )}

            {section === "Colours" && (
              <div className="company-builder-fields">
                <h2>Brand colours</h2>
                <div className="company-color-grid">
                  {COLOR_FIELDS.map(([field, label]) => (
                    <label className="company-color-field" key={field}>
                      <span>{label}</span>
                      <input type="color" value={theme.colors[field]} onChange={(event) => updateColor(field, event.target.value)} />
                      <input type="text" value={hexDrafts[field]} maxLength="7" aria-label={`${label} hex value`} onChange={(event) => changeHexDraft(field, event.target.value)} onBlur={() => validateHexDraft(field)} />
                    </label>
                  ))}
                </div>
                <button type="button" className="company-reset-inline" onClick={() => { updateTop("colors", { ...DEFAULT_COMPANY_THEME.colors }); setHexDrafts(Object.fromEntries(COLOR_FIELDS.map(([field]) => [field, DEFAULT_COMPANY_THEME.colors[field]]))); }}>Reset colours</button>
              </div>
            )}

            {section === "Fonts" && (
              <div className="company-builder-fields">
                <h2>Typography</h2>
                <label className="company-field">Font family<select value={theme.font.family} onChange={(event) => updateSection("font", "family", event.target.value)}>{FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}</select></label>
                <label className="company-field">Font size · {theme.font.size}px<input type="range" min="12" max="18" value={theme.font.size} onChange={(event) => updateSection("font", "size", Number(event.target.value))} /></label>
                <label className="company-field">Font weight<select value={theme.font.weight} onChange={(event) => updateSection("font", "weight", Number(event.target.value))}><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select></label>
                <p className="company-font-sample" style={{ fontFamily: theme.font.family, fontSize: `${theme.font.size}px`, fontWeight: theme.font.weight }}>Aa · The quick brown fox jumps over the HRMS workspace.</p>
              </div>
            )}

            {section === "Layout" && (
              <div className="company-builder-fields">
                <h2>Workspace layout</h2>
                <label className="company-field">Sidebar position<select value={theme.layout.sidebarPosition} onChange={(event) => updateSection("layout", "sidebarPosition", event.target.value)}><option>Left</option><option>Right</option></select></label>
                <label className="company-field">Sidebar width · {theme.layout.sidebarWidth}px<input type="range" min="180" max="300" value={theme.layout.sidebarWidth} onChange={(event) => updateSection("layout", "sidebarWidth", Number(event.target.value))} /></label>
                <label className="company-field">Header layout<select value={theme.layout.headerLayout} onChange={(event) => updateSection("layout", "headerLayout", event.target.value)}><option>Standard</option><option>Compact</option><option>Centered</option></select></label>
                <label className="company-field">Content layout<select value={theme.layout.contentLayout} onChange={(event) => updateSection("layout", "contentLayout", event.target.value)}><option>Fluid</option><option>Centered</option><option>Wide</option></select></label>
                <label className="company-field">Card layout<select value={theme.layout.cardLayout} onChange={(event) => updateSection("layout", "cardLayout", event.target.value)}><option>Grid</option><option>List</option><option>Compact Grid</option></select></label>
                <label className="company-field">Dashboard spacing<select value={theme.layout.spacing} onChange={(event) => updateSection("layout", "spacing", event.target.value)}><option>Compact</option><option>Comfortable</option><option>Spacious</option></select></label>
                <label className="company-field">Display density<select value={theme.layout.density} onChange={(event) => updateSection("layout", "density", event.target.value)}><option>Compact</option><option>Comfortable</option></select></label>
              </div>
            )}

            {section === "Menu Style" && (
              <div className="company-builder-fields">
                <h2>Navigation style</h2>
                <label className="company-field">Menu style<select value={theme.menu.style} onChange={(event) => updateSection("menu", "style", event.target.value)}><option>Vertical Sidebar</option><option>Collapsible Sidebar</option><option>Icon-only Sidebar</option><option>Horizontal Navigation</option></select></label>
                <label className="company-field">Menu icon style<select value={theme.menu.iconStyle} onChange={(event) => updateSection("menu", "iconStyle", event.target.value)}><option>Standard</option><option>Compact</option><option>Hidden</option></select></label>
                {[["background", "Menu background"], ["active", "Active item"], ["text", "Menu text"]].map(([field, label]) => (
                  <label className="company-color-field" key={field}><span>{label}</span><input type="color" value={theme.menu[field]} onChange={(event) => updateSection("menu", field, event.target.value)} /><code>{theme.menu[field]}</code></label>
                ))}
                <p className="company-builder-hint">The selected navigation mode is applied to this company workspace only.</p>
              </div>
            )}

            {section === "Dashboard Widgets" && (
              <div className="company-builder-fields">
                <h2>Dashboard widgets</h2>
                <p>Widgets are limited to modules included in this tenant's license.</p>
                <div className="company-widget-options">
                  {COMPANY_WIDGETS.filter((widget) => enabledModules.includes(widget.module)).map((widget) => {
                    const index = theme.widgets.indexOf(widget.name);
                    return <div key={widget.name}>
                      <label><input type="checkbox" checked={index >= 0} onChange={(event) => setWidgetEnabled(widget.name, event.target.checked)} /><span>{widget.name}</span><small>{widget.module}</small></label>
                      {index >= 0 && <span className="company-widget-order"><button type="button" disabled={index === 0} onClick={() => moveWidget(widget.name, -1)} aria-label={`Move ${widget.name} up`}><ArrowUp size={15} /></button><button type="button" disabled={index === theme.widgets.length - 1} onClick={() => moveWidget(widget.name, 1)} aria-label={`Move ${widget.name} down`}><ArrowDown size={15} /></button></span>}
                    </div>;
                  })}
                  {!COMPANY_WIDGETS.some((widget) => enabledModules.includes(widget.module)) && <p>No widget modules are included in this license.</p>}
                </div>
                <label className="company-field">Widget layout<select value={theme.layout.cardLayout} onChange={(event) => updateSection("layout", "cardLayout", event.target.value)}><option>Grid</option><option>List</option><option>Compact Grid</option></select></label>
              </div>
            )}

            {section === "Login Page" && (
              <div className="company-builder-fields">
                <h2>Login page appearance</h2>
                <label className="company-field">Login logo<input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={(event) => handleUpload(event, (value) => updateSection("logos", "login", value))} /></label>
                <label className="company-field">Login logo width · {theme.loginPage.logoWidth}px<input type="range" min="72" max="240" value={theme.loginPage.logoWidth} onChange={(event) => updateSection("loginPage", "logoWidth", Number(event.target.value))} /></label>
                <label className="company-field">Login logo position<select value={theme.loginPage.logoPosition} onChange={(event) => updateSection("loginPage", "logoPosition", event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                <label className="company-field">Background image<input type="file" accept="image/png,image/jpeg" onChange={(event) => handleUpload(event, (value) => updateSection("loginPage", "background", value))} /></label>
                <label className="company-field">Welcome message<input value={theme.loginPage.welcomeMessage} onChange={(event) => updateSection("loginPage", "welcomeMessage", event.target.value)} /></label>
                <label className="company-field">Heading<input value={theme.loginPage.heading} onChange={(event) => updateSection("loginPage", "heading", event.target.value)} /></label>
                <label className="company-field">Description<textarea rows="3" value={theme.loginPage.description} onChange={(event) => updateSection("loginPage", "description", event.target.value)} /></label>
                <label className="company-field">Login button style<select value={theme.loginPage.buttonStyle} onChange={(event) => updateSection("loginPage", "buttonStyle", event.target.value)}><option>Rounded</option><option>Square</option><option>Pill</option></select></label>
                <label className="company-field">Footer text<input value={theme.loginPage.footerText} onChange={(event) => updateSection("loginPage", "footerText", event.target.value)} /></label>
              </div>
            )}

            {section === "Company Domain" && (
              <div className="company-builder-fields">
                <h2>Company domain</h2>
                <p>Domain requests are local demo records. DNS configuration and backend verification are not included.</p>
                <label className="company-field">Preferred subdomain<input value={theme.domain.subdomain} onChange={(event) => { setDomainChecked(false); updateSection("domain", "subdomain", event.target.value.toLowerCase()); }} placeholder="your-company" /></label>
                <div className="company-domain-preview">https://{theme.domain.subdomain || "your-company"}.hrmsdemo.local</div>
                <div className="company-domain-actions"><button type="button" onClick={checkDomain}><Eye size={15} /> Check availability</button><button type="button" className="company-save-button" onClick={saveDomainRequest} disabled={!domainChecked}><Check size={15} /> Save domain request</button></div>
                <div className="company-domain-status"><span>Status</span><strong>{theme.domain.status}</strong></div>
              </div>
            )}

            {section === "Email Templates" && (
              <div className="company-builder-fields">
                <h2>Email templates</h2>
                <p>Template changes are saved locally. This demo does not send email.</p>
                <label className="company-field">Template<select value={activeTemplate} onChange={(event) => setActiveTemplate(event.target.value)}>{EMAIL_FIELDS.map((name) => <option key={name}>{name}</option>)}</select></label>
                <label className="company-field">Subject<input value={theme.emailTemplates[activeTemplate].subject} onChange={(event) => updateTemplate("subject", event.target.value)} /></label>
                <label className="company-field">Email body<textarea rows="8" value={theme.emailTemplates[activeTemplate].body} onChange={(event) => updateTemplate("body", event.target.value)} /></label>
                <div className="company-template-placeholders">Placeholders: {"{{employee_name}}"}, {"{{company_name}}"}, {"{{date}}"}, {"{{action_link}}"}</div>
                <button type="button" className="company-reset-inline" onClick={() => updateTemplate("subject", DEFAULT_EMAIL_TEMPLATES[activeTemplate].subject)}>Reset subject</button>
                <button type="button" className="company-reset-inline" onClick={() => updateTemplate("body", DEFAULT_EMAIL_TEMPLATES[activeTemplate].body)}>Reset body</button>
                <div className="company-email-preview"><span>Preview · {activeTemplate}</span><strong>{templatePreview(theme.emailTemplates[activeTemplate].subject, tenant)}</strong><pre>{templatePreview(theme.emailTemplates[activeTemplate].body, tenant)}</pre></div>
              </div>
            )}
          </section>

          <aside className={`company-theme-preview ${section === "Login Page" ? "login-preview" : ""}`} style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.font.family }}>
            <div className="company-preview-label"><Eye size={15} /> LIVE PREVIEW · {section}</div>
            {section === "Login Page" ? (
              <div className="company-login-preview" style={{ backgroundImage: theme.loginPage.background ? `linear-gradient(#07182088,#071820aa),url(${theme.loginPage.background})` : undefined }}>
                {theme.logos.login && <img src={theme.logos.login} alt={`${tenant.name} login logo preview`} style={{ width: theme.loginPage.logoWidth, alignSelf: theme.loginPage.logoPosition === "left" ? "flex-start" : theme.loginPage.logoPosition === "right" ? "flex-end" : "center" }} />}
                <span>{theme.loginPage.welcomeMessage}</span><strong>{theme.loginPage.heading}</strong><p>{theme.loginPage.description}</p>
                <button style={{ background: theme.colors.button, borderRadius: theme.loginPage.buttonStyle === "Pill" ? 999 : theme.loginPage.buttonStyle === "Square" ? 4 : 10 }}>Sign in</button>
                <small>{templatePreview(theme.loginPage.footerText, tenant)}</small>
              </div>
            ) : (
              <div className="company-dashboard-preview">
                <header style={{
                  background: theme.colors.header,
                  justifyContent: theme.logoPosition === "right" ? "flex-end" : theme.logoPosition === "center" ? "center" : "flex-start",
                }}>
                  {theme.logos.sidebar ? <img src={theme.logos.sidebar} alt="Company logo preview" style={{ width: theme.logoWidth, objectPosition: theme.logoPosition }} /> : <span className="company-brand-initial">{tenant.name.slice(0, 1).toUpperCase()}</span>}
                  <strong>{tenant.name}</strong>
                </header>
                <div className="company-preview-card" style={{ borderColor: `${theme.colors.primary}66` }}>
                  <span>{tenant.plan} workspace</span><strong style={{ color: theme.colors.primary }}>Company dashboard</strong><small>Tenant-specific branding preview</small>
                </div>
                <div className="company-preview-swatches">{COLOR_FIELDS.slice(0, 4).map(([field, label]) => <span key={field} title={label} style={{ background: theme.colors[field] }} />)}</div>
                <button style={{ background: theme.colors.button, color: theme.colors.background }}>Preview action</button>
              </div>
            )}
            <div className="company-preview-isolation"><Check size={14} /> Scoped to {tenant.id}</div>
          </aside>
        </div>

        <div className="company-builder-bottom">
          <Link to="/super-admin/company">Back to company dashboard</Link>
          <button type="button" className="company-save-button" onClick={save}><Upload size={15} /> Save this configuration</button>
        </div>
      </div>
    </CompanyFrame>
  );
}
