const AUDIT_LOG_KEY = "hrms-admin-audit-log";

export function readAuditLog() {
  try {
    const savedLog = localStorage.getItem(AUDIT_LOG_KEY);
    if (!savedLog) return [];

    const parsedLog = JSON.parse(savedLog);
    if (!Array.isArray(parsedLog)) {
      throw new TypeError("Saved audit history must be an array.");
    }

    return parsedLog;
  } catch (error) {
    console.error("Unable to load administrative audit history.", error);
    return [];
  }
}

export function recordAuditEvent(event) {
  const auditLog = readAuditLog();
  const nextEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  localStorage.setItem(
    AUDIT_LOG_KEY,
    JSON.stringify([nextEvent, ...auditLog].slice(0, 500))
  );
  window.dispatchEvent(new Event("hrms-audit-log-updated"));
  return nextEvent;
}
