/**
 * Attendance Module Configuration
 * Centralized business rules and thresholds
 */
export const ATTENDANCE_CONFIG = {
  WORK_HOURS: 9, // Standard shift hours target (9h = 540 min)
  GRACE_MINUTES: 15, // Grace period after shift start before late arrival is flagged
  HALF_DAY_HOURS: 4.5, // Less than 4.5 hours is counted as Half Day
  TIMEZONE: "Asia/Kolkata", // Standard India timezone
  BREAK_ALLOWANCE_MINUTES: 60, // Standard break allowance (1 hour)
  MAX_BREAK_MINUTES: 60, // Configurable daily break allowance before alert
  ONE_SESSION_PER_DAY: true
};

export const WORK_HOURS = ATTENDANCE_CONFIG.WORK_HOURS;
export const GRACE_MINUTES = ATTENDANCE_CONFIG.GRACE_MINUTES;
export const HALF_DAY_HOURS = ATTENDANCE_CONFIG.HALF_DAY_HOURS;
export const TIMEZONE = ATTENDANCE_CONFIG.TIMEZONE;
export const BREAK_ALLOWANCE_MINUTES = ATTENDANCE_CONFIG.BREAK_ALLOWANCE_MINUTES;
export const MAX_BREAK_MINUTES = ATTENDANCE_CONFIG.MAX_BREAK_MINUTES;
