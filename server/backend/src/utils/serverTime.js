// backend/src/utils/serverTime.js
import config from '../config/index.js';

/**
 * Returns current server time formatted as ISO, Date (YYYY-MM-DD), and Time (HH:mm:ss)
 * ALWAYS uses server time, never trusts client browser time.
 */
export function getServerTime() {
  const now = new Date();

  const dateStr = now.toLocaleDateString('en-CA', { timeZone: config.serverTimezone });
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: config.serverTimezone, hour12: false });
  const hoursMinutes = timeStr.slice(0, 5);

  return {
    iso: now.toISOString(),
    date: dateStr,
    time: timeStr,
    hoursMinutes,
    timestamp: now.getTime()
  };
}

