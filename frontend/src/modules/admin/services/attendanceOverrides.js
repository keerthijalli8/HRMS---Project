const ATTENDANCE_OVERRIDES_KEY = "hrms-attendance-admin-overrides";

export function readAttendanceOverrides() {
  try {
    const savedOverrides = localStorage.getItem(ATTENDANCE_OVERRIDES_KEY);
    if (!savedOverrides) return {};

    const parsedOverrides = JSON.parse(savedOverrides);
    if (!parsedOverrides || Array.isArray(parsedOverrides) || typeof parsedOverrides !== "object") {
      throw new TypeError("Saved attendance overrides must be an object.");
    }

    return parsedOverrides;
  } catch (error) {
    console.error("Unable to load attendance corrections.", error);
    return {};
  }
}

export function saveAttendanceOverrides(overrides) {
  localStorage.setItem(ATTENDANCE_OVERRIDES_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event("hrms-attendance-updated"));
}

export function applyAttendanceOverrides(records, overrides = readAttendanceOverrides()) {
  return records.map((record) => ({
    ...record,
    ...(overrides[`${record.date}:${record.employeeId}`] || {}),
  }));
}
