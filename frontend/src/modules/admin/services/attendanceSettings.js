const ATTENDANCE_SETTINGS_KEY = "hrms-attendance-settings";

export const DEFAULT_ATTENDANCE_SETTINGS = {
  start: "09:30",
  end: "18:30",
  lateAfter: "09:45",
  timezone: "Asia/Kolkata",
  workingDays: "Monday - Friday",
};

const isValidClockTime = (value) => /^\d{2}:\d{2}$/.test(value || "") &&
  Number(value.slice(0, 2)) < 24 &&
  Number(value.slice(3, 5)) < 60;

const isValidTimeZone = (timezone) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

export function readAttendanceSettings() {
  try {
    const saved = localStorage.getItem(ATTENDANCE_SETTINGS_KEY);
    if (!saved) return { ...DEFAULT_ATTENDANCE_SETTINGS };
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_ATTENDANCE_SETTINGS, ...parsed };
  } catch (error) {
    console.error("Unable to load attendance settings.", error);
    return { ...DEFAULT_ATTENDANCE_SETTINGS };
  }
}

export function saveAttendanceSettings(settings) {
  const next = { ...DEFAULT_ATTENDANCE_SETTINGS, ...settings };
  if (
    !isValidClockTime(next.start) ||
    !isValidClockTime(next.end) ||
    !isValidClockTime(next.lateAfter) ||
    next.start >= next.end ||
    next.lateAfter < next.start ||
    next.lateAfter > next.end ||
    !isValidTimeZone(next.timezone)
  ) {
    throw new TypeError("Enter valid office times, a threshold within working hours, and a valid timezone.");
  }

  localStorage.setItem(ATTENDANCE_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("hrms-attendance-settings-updated"));
  return next;
}

export function getClockMinutes(value, timezone = readAttendanceSettings().timezone) {
  if (typeof value === "string") {
    const clockMatch = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(value.trim());
    if (clockMatch) {
      let hour = Number(clockMatch[1]);
      const minute = Number(clockMatch[2]);
      if (clockMatch[3]) {
        hour = (hour % 12) + (clockMatch[3].toUpperCase() === "PM" ? 12 : 0);
      }
      if (hour < 24 && minute < 60) return hour * 60 + minute;
      return null;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return hour * 60 + minute;
}

export function getDateKeyInTimezone(value = new Date(), timezone = readAttendanceSettings().timezone) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("A valid date is required.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export function isLateArrival(checkIn, settings = readAttendanceSettings()) {
  const checkInMinutes = getClockMinutes(checkIn, settings.timezone);
  const thresholdMinutes = getClockMinutes(settings.lateAfter, settings.timezone);
  return checkInMinutes !== null && thresholdMinutes !== null && checkInMinutes > thresholdMinutes;
}

export function getLateArrivalMinutes(checkIn, settings = readAttendanceSettings()) {
  const checkInMinutes = getClockMinutes(checkIn, settings.timezone);
  const thresholdMinutes = getClockMinutes(settings.lateAfter, settings.timezone);
  if (checkInMinutes === null || thresholdMinutes === null) return null;
  return Math.max(0, checkInMinutes - thresholdMinutes);
}

export function isEarlyCheckOut(checkOut, settings = readAttendanceSettings()) {
  const checkOutMinutes = getClockMinutes(checkOut, settings.timezone);
  const officeEndMinutes = getClockMinutes(settings.end, settings.timezone);
  return checkOutMinutes !== null && officeEndMinutes !== null && checkOutMinutes < officeEndMinutes;
}

export function formatAttendanceTime(value, timezone = readAttendanceSettings().timezone) {
  if (!value) return "--";
  if (typeof value === "string" && /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(value.trim())) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatOfficeTime(value) {
  const minutes = getClockMinutes(value);
  if (minutes === null) return value;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
