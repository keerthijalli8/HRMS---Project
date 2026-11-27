// src/utils/format.js
// Number, currency, date, and duration formatting helpers matching Monsoon Glass standards.

/**
 * Returns time-based greeting: "Good morning", "Good afternoon", or "Good evening"
 * Morning: 04:00 - 11:59 | Afternoon: 12:00 - 16:59 | Evening: 17:00 - 03:59
 */
export function getGreeting(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = isNaN(d?.getTime?.()) ? new Date().getHours() : d.getHours();

  if (hours >= 4 && hours < 12) {
    return 'Good morning';
  } else if (hours >= 12 && hours < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Formats a number as Indian Rupee (INR) with Indian numbering system (lakhs / crores).
 * e.g., 75420 -> ₹75,420; 1590000 -> ₹15,90,000
 */
export function formatINR(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const { compact = false, showPence = false } = options;

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showPence ? 2 : 0,
    minimumFractionDigits: showPence ? 2 : 0
  });

  return formatter.format(amount);
}

/**
 * Formats a Date object or ISO string to standard Monsoon format: e.g. "6 Nov 2026"
 */
export function formatDate(dateInput, options = {}) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  if (options.includeWeekday) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]}, ${day} ${month} ${year}`;
  }

  return `${day} ${month} ${year}`;
}

/**
 * Formats a Date object, ISO string, or time string to 12-hour (or 24-hour if configured in Settings) IST format with seconds: e.g. "09:30:14 AM"
 */
export function formatTime12(dateOrTimeString, options = {}) {
  const { showSeconds = true } = options;
  if (!dateOrTimeString) return showSeconds ? '--:--:--' : '--:--';

  let use24Hour = false;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hrms_employee_settings');
      if (raw) {
        use24Hour = JSON.parse(raw)?.timeFormat === '24h';
      }
    }
  } catch {
    // ignore storage access issues
  }

  let hh = 0;
  let mm = 0;
  let ss = 0;

  if (typeof dateOrTimeString === 'string' && dateOrTimeString.includes(':') && !dateOrTimeString.includes('T')) {
    const parts = dateOrTimeString.split(':').map(Number);
    hh = parts[0] || 0;
    mm = parts[1] || 0;
    ss = parts[2] || 0;
  } else {
    const d = typeof dateOrTimeString === 'string' ? new Date(dateOrTimeString) : dateOrTimeString;
    if (isNaN(d.getTime())) return showSeconds ? '--:--:--' : '--:--';
    hh = d.getHours();
    mm = d.getMinutes();
    ss = d.getSeconds();
  }

  const mmStr = String(mm).padStart(2, '0');
  const ssStr = String(ss).padStart(2, '0');

  if (use24Hour) {
    const hh24 = String(hh).padStart(2, '0');
    return showSeconds ? `${hh24}:${mmStr}:${ssStr}` : `${hh24}:${mmStr}`;
  }

  const period = hh >= 12 ? 'PM' : 'AM';
  const hour12 = String(hh % 12 || 12).padStart(2, '0');
  return showSeconds ? `${hour12}:${mmStr}:${ssStr} ${period}` : `${hour12}:${mmStr} ${period}`;
}

/**
 * Formats minutes into "8h 24m"
 */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) return '0h 00m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
}

/**
 * Formats total seconds into "8h 24m 15s"
 */
export function formatDurationWithSeconds(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '0h 00m 00s';
  }
  const s = Math.floor(totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

/**
 * Returns initials from name: "Aarav Mehta" -> "AM"
 */
export function getInitials(name) {
  if (!name) return 'EM';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

/**
 * Deterministic color hue generator for user avatars
 */
export function getAvatarColor(name) {
  if (!name) return 'hsl(180, 52%, 40%)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 52%, 40%)`;
}

// Re-export GPS format helper for convenience
export { formatCoordinates } from './geo.js';


