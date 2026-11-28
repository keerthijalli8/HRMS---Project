export const BRANDING_STORAGE_BUCKET = "company-branding";
export const BRANDING_THEME_ACTION = "Apply Theme Across Company";

export const DEFAULT_BRANDING = {
  tenantId: "",
  companyName: "HRMS India",
  brandName: "HRMS India",
  tagline: "People operations, beautifully organized.",
  logoUrl: "/technomold-logo-transparent.png",
  faviconUrl: "/technomold-favicon-transparent.png",
  loginLogoUrl: "",
  preset: "Monsoon Glass Default",
  mode: "dark",
  fontFamily: "Manrope",
  fontSize: "14px",
  borderRadius: "22px",
  cardStyle: "Glass",
  sidebarStyle: "Glass",
  layoutDensity: "Comfortable",
  colors: {
    primary: "#6ee7d0",
    secondary: "#9b8cff",
    accent: "#6ee7d0",
    sidebarBackground: "#06141c",
    sidebarText: "#ecfbf8",
    topbarBackground: "rgba(6, 20, 28, 0.78)",
    topbarText: "#ecfbf8",
    dashboardBackground: "#06141c",
    cardBackground: "rgba(17, 38, 47, 0.76)",
    button: "#6ee7d0",
    buttonText: "#032a24",
    border: "rgba(196, 230, 231, 0.16)",
    link: "#6ee7d0",
    success: "#5eead4",
    warning: "#fcd34d",
    error: "#fda4af",
  },
};

export const PRESETS = {
  "Monsoon Glass Default": DEFAULT_BRANDING,

  "Corporate Blue": {
    ...DEFAULT_BRANDING,
    colors: {
      ...DEFAULT_BRANDING.colors,
      primary: "#60a5fa",
      secondary: "#93c5fd",
      accent: "#60a5fa",
      button: "#2563eb",
      link: "#60a5fa",
    },
  },

  "Professional Green": {
    ...DEFAULT_BRANDING,
    colors: {
      ...DEFAULT_BRANDING.colors,
      primary: "#4ade80",
      secondary: "#86efac",
      accent: "#4ade80",
      button: "#16a34a",
      link: "#4ade80",
    },
  },

  "Modern Purple": {
    ...DEFAULT_BRANDING,
    colors: {
      ...DEFAULT_BRANDING.colors,
      primary: "#c084fc",
      secondary: "#a78bfa",
      accent: "#c084fc",
      button: "#9333ea",
      link: "#c084fc",
    },
  },

  "Elegant Dark": {
    ...DEFAULT_BRANDING,
    colors: {
      ...DEFAULT_BRANDING.colors,
      primary: "#fbbf24",
      secondary: "#d1d5db",
      accent: "#fbbf24",
      button: "#d97706",
      link: "#fbbf24",
      cardBackground: "rgba(15, 23, 42, 0.88)",
    },
  },
};

export function getTenantId(user = null) {
  return String(
    user?.app_metadata?.tenant_id ||
      user?.app_metadata?.organization_id ||
      user?.user_metadata?.tenant_id ||
      localStorage.getItem("hrms-active-tenant-id") ||
      "demo-tenant"
  );
}

const normalizePermissionRole = (role) =>
  role === "HR"
    ? "HR Manager"
    : role === "Administration"
      ? "Organization Admin"
      : role;

const elevatedBrandingRoles = [
  "Admin",
  "Administrator",
  "Organization Admin",
  "System Administrator",
  "Company Admin",
];

function storedPermission(type, id) {
  if (!id) return null;

  try {
    return JSON.parse(
      localStorage.getItem(`hrms-permissions-${type}-${id}`) || "null"
    );
  } catch {
    return null;
  }
}

function permissionAllows(permission, action) {
  return Boolean(
    permission?.modules?.["Company Branding"] &&
      permission?.actions?.["Company Branding"]?.[action]
  );
}

export function canViewCompanyBranding(profile = {}, person = null) {
  const role =
    person?.role ||
    profile.role ||
    profile.accessRole ||
    profile.designation ||
    "Employee";

  if (elevatedBrandingRoles.includes(role)) return true;

  const roleName = normalizePermissionRole(role);
  const userIds = [profile.id, profile.employeeId].filter(Boolean);

  return (
    userIds.some(
      (id) =>
        permissionAllows(
          storedPermission("user", id),
          "View Company Branding"
        ) ||
        permissionAllows(
          storedPermission("user", id),
          BRANDING_THEME_ACTION
        )
    ) ||
    [role, roleName].some(
      (name) =>
        permissionAllows(
          storedPermission("role", name),
          "View Company Branding"
        ) ||
        permissionAllows(
          storedPermission("role", name),
          BRANDING_THEME_ACTION
        )
    )
  );
}

export function canManageCompanyBranding(profile = {}, person = null) {
  const role =
    person?.role ||
    profile.role ||
    profile.accessRole ||
    profile.designation ||
    "Employee";

  if (elevatedBrandingRoles.includes(role)) return true;

  const roleName = normalizePermissionRole(role);
  const userIds = [profile.id, profile.employeeId].filter(Boolean);

  return (
    userIds.some((id) =>
      permissionAllows(
        storedPermission("user", id),
        BRANDING_THEME_ACTION
      )
    ) ||
    [role, roleName].some((name) =>
      permissionAllows(
        storedPermission("role", name),
        BRANDING_THEME_ACTION
      )
    )
  );
}

function cacheKey(tenantId) {
  return `hrms-company-branding-${tenantId}`;
}

function mergeBranding(row, tenantId) {
  const source = row?.settings || row || {};

  return {
    ...DEFAULT_BRANDING,
    ...source,
    tenantId,
    colors: {
      ...DEFAULT_BRANDING.colors,
      ...(source.colors || {}),
    },
  };
}

export async function loadCompanyBranding(tenantId) {
  try {
    const cached = JSON.parse(
      localStorage.getItem(cacheKey(tenantId)) || "{}"
    );

    return mergeBranding(cached, tenantId);
  } catch {
    return mergeBranding({}, tenantId);
  }
}

export async function saveCompanyBranding(branding, tenantId) {
  const saved = mergeBranding(
    {
      ...branding,
      tenantId,
    },
    tenantId
  );

  localStorage.setItem(cacheKey(tenantId), JSON.stringify(saved));
  return saved;
}

export async function cacheCompanyBranding(branding, tenantId) {
  const cached = mergeBranding(branding, tenantId);

  localStorage.setItem(cacheKey(tenantId), JSON.stringify(cached));
  return cached;
}

/*
 * Without Supabase Storage, uploaded image files are converted to data URLs.
 * The returned URL can be used by the current frontend and saved with branding.
 * Large files may use significant browser storage if saved in localStorage.
 */
export async function uploadCompanyBrandingAsset(file, tenantId, kind) {
  if (!file) {
    throw new Error("Please select a file to upload.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read the selected file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

export function applyCompanyBranding(branding, themeMode) {
  const root = document.querySelector(".mod-admin");
  if (!root) return;

  const activeTheme =
    themeMode ||
    document.documentElement.getAttribute("data-theme") ||
    "dark";
  const c = branding.colors;

  root.dataset.tpl = "glass";
  root.dataset.themeMode = activeTheme === "light" ? "light" : branding.mode;

  const colorProps = [
    "--accent",
    "--accent2",
    "--good",
    "--warn",
    "--bad",
    "--ink",
    "--line",
    "--brand-primary",
    "--sidebar-bg",
    "--sidebar-text",
    "--topbar-bg",
    "--dashboard-bg",
    "--card-bg",
    "--button-bg",
    "--button-text",
    "--link",
  ];

  if (activeTheme === "light") {
    // Let light-mode CSS tokens control backgrounds and crisp black text
    colorProps.forEach((prop) => root.style.removeProperty(prop));
    root.style.setProperty("--radius", branding.borderRadius);
    root.style.setProperty("--font-body", branding.fontFamily);
    root.style.fontSize = branding.fontSize;
    return;
  }

  Object.entries({
    "--accent": c.accent,
    "--accent2": c.secondary,
    "--good": c.success,
    "--warn": c.warning,
    "--bad": c.error,
    "--ink": c.topbarText,
    "--line": c.border,
    "--brand-primary": c.primary,
    "--sidebar-bg": c.sidebarBackground,
    "--sidebar-text": c.sidebarText,
    "--topbar-bg": c.topbarBackground,
    "--dashboard-bg": c.dashboardBackground,
    "--card-bg": c.cardBackground,
    "--button-bg": c.button,
    "--button-text": c.buttonText,
    "--link": c.link,
    "--radius": branding.borderRadius,
    "--font-body": branding.fontFamily,
  }).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.style.fontSize = branding.fontSize;
}