export const LICENSE_STORAGE_KEY = "hrms.superadmin.licenses.v1";
export const TENANT_STORAGE_KEY = "hrms.superadmin.tenants.v1";
export const LICENSE_STATUSES = [
  "Pending Activation",
  "Active",
  "Expired",
  "Suspended",
  "Revoked",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function todayISO() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addMonthsISO(value, months) {
  const date = new Date(`${value}T00:00:00`);
  date.setMonth(date.getMonth() + Number(months || 0));
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function readLicenseRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(LICENSE_STORAGE_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function saveLicenseRecords(records) {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("hrms:license-updated"));
}

export function readTenantRecords(fallback = []) {
  try {
    const records = JSON.parse(localStorage.getItem(TENANT_STORAGE_KEY) || "null");
    return Array.isArray(records) ? records : fallback;
  } catch {
    return fallback;
  }
}

export function saveTenantRecords(records) {
  localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("hrms:tenant-updated"));
}

export function createLicenseKey(records = []) {
  const existingKeys = new Set(
    records.map((record) => String(record.key || "").toUpperCase())
  );
  const bytes = new Uint8Array(16);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      bytes.forEach((_, index) => {
        bytes[index] = Math.floor(Math.random() * 256);
      });
    }

    const token = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
    const key = `TMHR-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}-${token.slice(12, 16)}`;
    if (!existingKeys.has(key)) return key;
  }

  throw new Error("Unable to generate a unique license key.");
}

export function getLicenseStatus(license, now = todayISO()) {
  if (!license) return "Not Issued";
  if (license.status === "Revoked" || license.status === "Suspended") {
    return license.status;
  }
  if (license.expiresAt && license.expiresAt < now) return "Expired";
  return license.status || "Pending Activation";
}

export function validateLicenseKey(value, licenses = readLicenseRecords(), tenants = readTenantRecords()) {
  const key = String(value || "").trim().toUpperCase();
  const license = licenses.find(
    (record) => String(record.key || "").toUpperCase() === key
  );

  if (!license) {
    return { valid: false, message: "License key not found. Check the key and try again." };
  }

  const tenant = tenants.find((record) => record.id === license.tenantId);
  if (!tenant || !license.tenantId) {
    return { valid: false, message: "This license is not associated with a valid tenant." };
  }
  if (tenant.status === "Rejected") {
    return { valid: false, message: "This tenant registration was rejected." };
  }
  if (tenant.status === "Suspended") {
    return { valid: false, message: "This tenant has been suspended by the platform administrator." };
  }
  if (license.status === "Revoked") {
    return { valid: false, message: "This license has been revoked. Contact your platform administrator." };
  }
  if (license.status === "Suspended") {
    return { valid: false, message: "This license is suspended. Contact your platform administrator." };
  }
  if (license.expiresAt && license.expiresAt < todayISO()) {
    return { valid: false, message: "This license has expired. Contact your platform administrator." };
  }
  if (license.startsAt && license.startsAt > todayISO()) {
    return { valid: false, message: "This license is not active yet." };
  }
  if (license.activatedAt) {
    return {
      valid: false,
      alreadyActivated: true,
      license,
      tenant,
      message: "This license has already been activated. Continue to the existing company workspace.",
    };
  }
  if (!["Pending Activation", "Active"].includes(license.status)) {
    return { valid: false, message: "This license is not available for activation." };
  }

  return { valid: true, license, tenant };
}

export function isCompanyLicenseActive(tenantId, licenses = readLicenseRecords()) {
  const license = licenses.find((record) => record.tenantId === tenantId);
  return Boolean(
    license &&
      license.status === "Active" &&
      license.activatedAt &&
      (!license.expiresAt || license.expiresAt >= todayISO())
  );
}
