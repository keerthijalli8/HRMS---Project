/**
 * Centralized formatting utilities for numbers, currencies, dates and times.
 * Locale: en-IN (Indian numbering system)
 * Timezone: Asia/Kolkata
 */

export const EMPTY = "--";
export const MINUS_SIGN = "\u2212"; // True Unicode minus sign

/**
 * Checks if a value is a valid numeric quantity (not null, undefined, NaN, Infinity, empty string).
 */
function isValidNum(v) {
  if (v === null || v === undefined || v === "") return false;
  const n = Number(v);
  return !Number.isNaN(n) && Number.isFinite(n);
}

/**
 * Parses dates, ISO strings, YYYY-MM-DD or timestamps safely in Asia/Kolkata.
 */
function parseDateSafely(x) {
  if (x === null || x === undefined || x === "") return null;
  if (x instanceof Date) return Number.isNaN(x.getTime()) ? null : x;
  if (typeof x === "number") {
    if (!Number.isFinite(x)) return null;
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof x === "string") {
    const trimmed = x.trim();
    if (!trimmed || trimmed === EMPTY || trimmed === "N/A" || trimmed === "null" || trimmed === "undefined") return null;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}T12:00:00+05:30`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    // YYYY-MM
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}-01T12:00:00+05:30`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    // DD Mon YYYY e.g. "01 Feb 2021" or "11 Nov 2026"
    if (/^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1].slice(0, 3).toLowerCase();
      const year = parts[2];
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const mIdx = months.indexOf(monthStr);
      if (mIdx !== -1) {
        const m = String(mIdx + 1).padStart(2, '0');
        const d = new Date(`${year}-${m}-${day}T12:00:00+05:30`);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }

    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a number with Indian grouping (en-IN).
 * No decimals unless the value is not an integer (then at most 2).
 * Examples: 1248 -> "1,248"; 1234567 -> "12,34,567"; 12.5 -> "12.5"; 12.345 -> "12.35".
 */
export function formatNumber(n) {
  if (!isValidNum(n)) return EMPTY;
  const num = Number(n);
  const isNeg = num < 0;
  const absVal = Math.abs(num);

  const formatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(absVal) ? 0 : 2
  });

  const formatted = formatter.format(absVal);
  return isNeg ? `${MINUS_SIGN}${formatted}` : formatted;
}

/**
 * Formats currency in Indian Rupees: "₹1,45,000".
 * Negative values use the true minus sign: "−₹2,500".
 * By default has 0 decimals; if decimals is passed (e.g. 2), respects it.
 */
export function formatCurrency(n, { decimals } = {}) {
  if (!isValidNum(n)) return EMPTY;
  const num = Number(n);
  const isNeg = num < 0;
  const absVal = Math.abs(num);

  const minDec = decimals !== undefined ? decimals : 0;
  const maxDec = decimals !== undefined ? decimals : (Number.isInteger(absVal) ? 0 : 2);

  const formatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec
  });

  const formatted = formatter.format(absVal);
  return isNeg ? `${MINUS_SIGN}₹${formatted}` : `₹${formatted}`;
}

/**
 * Formats compact INR amounts:
 * Below 1 Lakh (< 1,00,000): formatCurrency (e.g. "₹82,500")
 * 1 Lakh to under 1 Crore (1,00,000 to < 1,00,00,000): "₹12.80 L" (two decimals, trailing zeros kept)
 * 1 Crore and above (>= 1,00,00,000): "₹1.42 Cr" (two decimals, trailing zeros kept)
 */
export function formatCompactINR(n) {
  if (!isValidNum(n)) return EMPTY;
  const num = Number(n);
  const isNeg = num < 0;
  const absVal = Math.abs(num);
  const sign = isNeg ? MINUS_SIGN : "";

  if (absVal < 100000) {
    return formatCurrency(num);
  }
  if (absVal < 10000000) {
    const lakhs = (absVal / 100000).toFixed(2);
    return `${sign}₹${lakhs} L`;
  }
  const crores = (absVal / 10000000).toFixed(2);
  return `${sign}₹${crores} Cr`;
}

/**
 * Formats a percentage: at most one decimal, no trailing ".0" unless keepZero is true.
 * Examples: 94.4 -> "94.4%"; 86 -> "86%".
 */
export function formatPercent(v, { decimals = 1, keepZero = false } = {}) {
  if (typeof v === "string") {
    v = v.trim().replace(/%$/, "");
  }
  if (!isValidNum(v)) return EMPTY;
  const num = Number(v);
  const fixed = num.toFixed(decimals);
  if (!keepZero) {
    const stripped = fixed.replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
    return `${stripped}%`;
  }
  return `${fixed}%`;
}

/**
 * Formats a delta trend e.g. "+4.2%" or "−1.2%" with true minus sign.
 * Zero returns "0%".
 */
export function formatDelta(v, { suffix = "%" } = {}) {
  if (typeof v === "string") {
    v = v.trim().replace(/^\+/, "").replace(/^[−-]/, "-").replace(new RegExp(`\\s*${suffix}$`), "");
  }
  if (!isValidNum(v)) return EMPTY;
  const num = Number(v);
  if (num === 0) return `0${suffix}`;

  const absVal = Math.abs(num);
  const formattedVal = Number.isInteger(absVal)
    ? String(absVal)
    : absVal.toFixed(1).replace(/\.0+$/, "");

  if (num > 0) {
    return `+${formattedVal}${suffix}`;
  }
  return `${MINUS_SIGN}${formattedVal}${suffix}`;
}

/**
 * Returns Tailwind color class for delta indicators:
 * Positive: "text-good" (or "text-bad" if invert)
 * Negative: "text-bad" (or "text-good" if invert)
 * Zero/Empty: "text-muted"
 */
export function deltaClass(v, { invert = false } = {}) {
  if (typeof v === "string") {
    v = v.trim().replace(/^\+/, "").replace(/^[−-]/, "-").replace(/%$/, "");
  }
  if (!isValidNum(v)) return "text-muted";
  const num = Number(v);
  if (num === 0) return "text-muted";
  if (num > 0) return invert ? "text-bad" : "text-good";
  return invert ? "text-good" : "text-bad";
}

/**
 * Formats integer score: "91".
 */
export function formatScore(n) {
  if (!isValidNum(n)) return EMPTY;
  return String(Math.round(Number(n)));
}

/**
 * Formats rating: "4.2 / 5".
 */
export function formatRating(n) {
  if (!isValidNum(n)) return EMPTY;
  const num = Number(n);
  return `${num.toFixed(1)} / 5`;
}

/**
 * Formats time strictly to 12-hour: "09:35 AM" (two-digit hour, space, uppercase AM/PM).
 * Handles ISO strings, 24-hr time strings like "09:30" or "18:00", Date objects, and timestamps.
 */
export function formatTime(isoOrDate) {
  if (isoOrDate === null || isoOrDate === undefined || isoOrDate === "") return EMPTY;

  // Handle "HH:mm" or "HH:mm:ss" 24h strings
  if (typeof isoOrDate === "string") {
    const trimmed = isoOrDate.trim();
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
    }
  }

  const d = parseDateSafely(isoOrDate);
  if (!d) return EMPTY;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    const dayPeriod = (parts.dayPeriod || "AM").toUpperCase();
    return `${parts.hour}:${parts.minute} ${dayPeriod}`;
  } catch (e) {
    return EMPTY;
  }
}

/**
 * Formats date: "11 Nov 2026" in Asia/Kolkata.
 */
export function formatDate(x) {
  const d = parseDateSafely(x);
  if (!d) return EMPTY;

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    return `${parts.day} ${parts.month} ${parts.year}`;
  } catch (e) {
    return EMPTY;
  }
}

/**
 * Formats date long: "Wednesday, 11 Nov 2026" in Asia/Kolkata.
 */
export function formatDateLong(x) {
  const d = parseDateSafely(x);
  if (!d) return EMPTY;

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
  } catch (e) {
    return EMPTY;
  }
}

/**
 * Formats date short: "11 Nov" in Asia/Kolkata.
 */
export function formatDateShort(x) {
  const d = parseDateSafely(x);
  if (!d) return EMPTY;

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short"
    }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    return `${parts.day} ${parts.month}`;
  } catch (e) {
    return EMPTY;
  }
}

/**
 * Formats month and year: "November 2026" in Asia/Kolkata.
 */
export function formatMonthYear(x) {
  const d = parseDateSafely(x);
  if (!d) return EMPTY;

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      month: "long",
      year: "numeric"
    }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    return `${parts.month} ${parts.year}`;
  } catch (e) {
    return EMPTY;
  }
}

/**
 * Formats date and time: "11 Nov 2026, 09:35 AM" in Asia/Kolkata.
 */
export function formatDateTime(x) {
  const d = parseDateSafely(x);
  if (!d) return EMPTY;

  const datePart = formatDate(d);
  const timePart = formatTime(d);
  if (datePart === EMPTY || timePart === EMPTY) return EMPTY;
  return `${datePart}, ${timePart}`;
}

/**
 * Formats duration in milliseconds into "7h 32m", "45m", "0m".
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined) return EMPTY;
  if (!isValidNum(ms)) return EMPTY;
  const num = Number(ms);
  if (num < 0) return EMPTY;
  if (num === 0) return "0m";

  const totalMinutes = Math.floor(num / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Formats milliseconds into ticking "HH:MM:SS" zero-padded clock format.
 */
export function formatClock(ms) {
  if (ms === null || ms === undefined || !isValidNum(ms)) return "00:00:00";
  const num = Number(ms);
  if (num < 0) return "00:00:00";

  const totalSeconds = Math.floor(num / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":");
}

/**
 * Formats count with singular or plural noun: "1 break", "3 breaks".
 */
export function formatCount(n, singular, plural) {
  if (!isValidNum(n)) return EMPTY;
  const num = Number(n);
  const word = num === 1 ? singular : (plural || `${singular}s`);
  return `${formatNumber(num)} ${word}`;
}

/**
 * Backward compatibility aliases for attendanceLog / shiftService
 */
export const formatDisplayDate = formatDateLong;
export const formatHoursWorked = formatDuration;
export const formatTimerHHMMSS = formatClock;
