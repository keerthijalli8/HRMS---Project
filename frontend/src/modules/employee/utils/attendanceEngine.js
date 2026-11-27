// src/utils/attendanceEngine.js
// Pure attendance calculation engine implementing all Monsoon Glass HRMS attendance rules.

import { ATTENDANCE_RULES } from '../config/attendanceRules.js';

/**
 * Parses time string "HH:MM" or "HH:MM:SS" or Date to minutes from midnight
 */
export function timeToMinutes(timeStrOrDate) {
  if (!timeStrOrDate) return null;
  if (typeof timeStrOrDate === 'string' && timeStrOrDate.includes(':') && !timeStrOrDate.includes('T')) {
    const parts = timeStrOrDate.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  const d = typeof timeStrOrDate === 'string' ? new Date(timeStrOrDate) : timeStrOrDate;
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Parses time string "HH:MM" or "HH:MM:SS" or Date to seconds from midnight
 */
export function timeToSeconds(timeStrOrDate) {
  if (!timeStrOrDate) return null;
  if (typeof timeStrOrDate === 'string' && timeStrOrDate.includes(':') && !timeStrOrDate.includes('T')) {
    const parts = timeStrOrDate.split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  const d = typeof timeStrOrDate === 'string' ? new Date(timeStrOrDate) : timeStrOrDate;
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/**
 * Evaluates a single day's attendance entry according to company policy.
 * 
 * @param {Object} entry - The day entry
 * @param {string} entry.date - "YYYY-MM-DD"
 * @param {string|Date|null} entry.checkIn - check-in timestamp or "HH:MM"
 * @param {string|Date|null} entry.checkOut - check-out timestamp or "HH:MM"
 * @param {Array<{start: string, end: string, duration?: number}>} [entry.breaks] - Recorded breaks
 * @param {string} [entry.type] - 'work' | 'leave' | 'holiday' | 'weekly_off'
 * @param {string} [entry.workMode] - 'Office' | 'Work from home' | 'Remote'
 * @param {boolean} [entry.isRegularised] - whether missed check-out or dispute is regularised
 * @param {boolean} [entry.inProgress] - actively working right now (today)
 * 
 * @param {Object} [rules=ATTENDANCE_RULES] - Configurable attendance rules
 * @param {Object} [ctx={}] - Context like { nowMinutes, currentMonthLateCount }
 * 
 * @returns {Object} Evaluated day metrics, status, flags, and color token
 */
export function evaluateDay(entry, rules = ATTENDANCE_RULES, ctx = {}) {
  const flags = [];

  // 1. Leave or Holiday or Weekly Off without punches
  if (entry.type === 'holiday') {
    return {
      status: 'holiday',
      label: 'Holiday',
      statusColor: 'muted',
      netMinutes: 0,
      grossMinutes: 0,
      breakMinutes: 0,
      recordedBreakMinutes: 0,
      netSeconds: 0,
      grossSeconds: 0,
      breakSeconds: 0,
      recordedBreakSeconds: 0,
      flags: ['HOLIDAY']
    };
  }

  if (entry.type === 'leave') {
    return {
      status: 'leave',
      label: entry.leaveType || 'Leave',
      statusColor: 'accent2',
      netMinutes: 0,
      grossMinutes: 0,
      breakMinutes: 0,
      recordedBreakMinutes: 0,
      netSeconds: 0,
      grossSeconds: 0,
      breakSeconds: 0,
      recordedBreakSeconds: 0,
      flags: ['ON_LEAVE']
    };
  }

  const checkInMin = timeToMinutes(entry.checkIn);
  const checkOutMin = timeToMinutes(entry.checkOut);
  const checkInSec = timeToSeconds(entry.checkIn);
  const checkOutSec = timeToSeconds(entry.checkOut);
  const shiftLateThreshold = timeToMinutes(rules.lateThresholdTime || '09:45');
  const earlyDepartureThreshold = timeToMinutes(rules.earlyDepartureThresholdTime || '18:15');

  // Check if date is weekly off (weekend)
  const entryDate = entry.date ? new Date(entry.date) : new Date();
  const dayOfWeek = entryDate.getDay();
  const isWeekend = rules.weeklyOffDays.includes(dayOfWeek);

  // If no check-in
  if (checkInMin === null) {
    if (isWeekend) {
      return {
        status: 'weekly_off',
        label: 'Weekly Off',
        statusColor: 'muted',
        netMinutes: 0,
        grossMinutes: 0,
        breakMinutes: 0,
        recordedBreakMinutes: 0,
        netSeconds: 0,
        grossSeconds: 0,
        breakSeconds: 0,
        recordedBreakSeconds: 0,
        flags: ['WEEKLY_OFF']
      };
    }
    return {
      status: 'absent',
      label: 'Absent',
      statusColor: 'bad',
      netMinutes: 0,
      grossMinutes: 0,
      breakMinutes: 0,
      recordedBreakMinutes: 0,
      netSeconds: 0,
      grossSeconds: 0,
      breakSeconds: 0,
      recordedBreakSeconds: 0,
      flags: ['NO_PUNCH', 'ABSENT']
    };
  }

  // Check-in exists:
  if (isWeekend) {
    flags.push('EXTRA_DAY');
  }

  // Late check-in flag (after 9:45 AM)
  const isLate = checkInMin > shiftLateThreshold;
  if (isLate) {
    flags.push('LATE');
    if ((ctx.currentMonthLateCount || 0) >= rules.monthlyFreeLateMarks) {
      flags.push('LATE_MARKS_EXCEEDED');
    }
  }

  // Calculate Break Duration (minutes & seconds)
  let totalBreakMin = 0;
  let activeBreakMin = 0;
  let totalBreakSec = 0;
  let activeBreakSec = 0;

  if (Array.isArray(entry.breaks) && entry.breaks.length > 0) {
    const now = new Date();
    const currentMin = ctx.nowMinutes ?? (now.getHours() * 60 + now.getMinutes());
    const currentSec = ctx.nowSeconds ?? (ctx.nowMinutes !== undefined ? ctx.nowMinutes * 60 : (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()));

    entry.breaks.forEach(b => {
      // MUST check open active break FIRST before duration/durationSeconds (since startBreak initializes durationSeconds: 0)
      if (!b.end && entry.inProgress && b.start) {
        const sMin = timeToMinutes(b.start);
        const sSec = timeToSeconds(b.start);
        if (sMin !== null && currentMin >= sMin) {
          activeBreakMin += (currentMin - sMin);
        }
        if (sSec !== null && currentSec >= sSec) {
          activeBreakSec += (currentSec - sSec);
        }
      } else if (typeof b.durationSeconds === 'number' && b.end) {
        totalBreakSec += b.durationSeconds;
        totalBreakMin += b.duration !== undefined ? b.duration : Math.floor(b.durationSeconds / 60);
      } else if (b.start && b.end) {
        const sMin = timeToMinutes(b.start);
        const eMin = timeToMinutes(b.end);
        const sSec = timeToSeconds(b.start);
        const eSec = timeToSeconds(b.end);
        if (eSec >= sSec) {
          totalBreakSec += (eSec - sSec);
        }
        if (b.duration) {
          totalBreakMin += b.duration;
        } else if (eMin >= sMin) {
          totalBreakMin += (eMin - sMin);
        }
      } else if (b.duration && b.end) {
        totalBreakMin += b.duration;
        totalBreakSec += b.duration * 60;
      }
    });
  } else {
    // If no breaks recorded and checked out with duration > 4.5 hours, mandatory 60 min deduction
    // Only apply if day is finished or past shift
    totalBreakMin = 0;
    totalBreakSec = 0;
  }

  // Check in progress (active today)
  if (entry.inProgress && checkOutMin === null) {
    const now = new Date();
    const currentMin = ctx.nowMinutes ?? (now.getHours() * 60 + now.getMinutes());
    const currentSec = ctx.nowSeconds ?? (ctx.nowMinutes !== undefined ? ctx.nowMinutes * 60 : (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()));

    const isOnBreak = Array.isArray(entry.breaks) && entry.breaks.some(b => b.start && !b.end);
    if (isOnBreak) {
      flags.push('ON_BREAK');
    }

    const elapsedGross = Math.max(0, currentMin - checkInMin);
    const totalRecordedBreak = totalBreakMin + activeBreakMin;
    const elapsedGrossSec = Math.max(0, currentSec - checkInSec);
    const totalRecordedBreakSec = totalBreakSec + activeBreakSec;

    // While actively on-shift, track actual break seconds (so Net Working pauses cleanly when on break without 5h jumps)
    const liveNetSec = Math.max(0, elapsedGrossSec - totalRecordedBreakSec);
    const liveNet = Math.floor(liveNetSec / 60);

    return {
      status: isOnBreak ? 'on_break' : 'in_progress',
      label: isOnBreak ? 'On Break (Paused)' : (isLate ? 'In Office (Late)' : 'In Office'),
      statusColor: isOnBreak ? 'warn' : (isLate ? 'warn' : 'good'),
      netMinutes: liveNet,
      grossMinutes: elapsedGross,
      breakMinutes: totalRecordedBreak,
      recordedBreakMinutes: totalRecordedBreak,
      netSeconds: liveNetSec,
      grossSeconds: elapsedGrossSec,
      breakSeconds: totalRecordedBreakSec,
      recordedBreakSeconds: totalRecordedBreakSec,
      flags,
      isLate,
      isOnBreak
    };
  }

  // Missed check-out (past midnight or closed without checkout)
  if (checkOutMin === null) {
    if (!entry.isRegularised) {
      flags.push('MISSED_CHECKOUT', 'REGULARISATION_REQUIRED');
      return {
        status: 'missed_checkout',
        label: 'Missed check-out',
        statusColor: 'bad',
        netMinutes: 0,
        grossMinutes: 0,
        breakMinutes: 0,
        recordedBreakMinutes: 0,
        netSeconds: 0,
        grossSeconds: 0,
        breakSeconds: 0,
        recordedBreakSeconds: 0,
        flags
      };
    }
  }

  // Day has check-in and check-out (or regularised)
  const effectiveCheckOut = checkOutMin ?? (checkInMin + 9 * 60); // fallback if regularised
  const grossMinutes = Math.max(0, effectiveCheckOut - checkInMin);

  const effectiveCheckOutSec = checkOutSec ?? (checkInSec + 9 * 3600);
  const grossSeconds = Math.max(0, effectiveCheckOutSec - checkInSec);

  // Mandatory break deduction rule:
  // If no breaks recorded, auto-deduct 60 min if gross >= 4.5 hours
  let finalBreakMinutes = totalBreakMin;
  let finalBreakSeconds = totalBreakSec;
  if (totalBreakMin === 0 && grossMinutes >= (rules.shift.halfDayThresholdHours * 60)) {
    finalBreakMinutes = rules.breakRules.mandatoryDeductionMinutes;
    finalBreakSeconds = rules.breakRules.mandatoryDeductionMinutes * 60;
    flags.push('AUTO_BREAK_DEDUCTED');
  }

  if (finalBreakMinutes > rules.breakRules.maxAllowedBreakMinutes) {
    flags.push('BREAK_EXCEEDED');
  }

  const netMinutes = Math.max(0, grossMinutes - finalBreakMinutes);
  const netSeconds = Math.max(0, grossSeconds - finalBreakSeconds);
  const fullDayMinutes = rules.shift.workHoursTarget * 60; // 480 mins (8h)
  const halfDayMinutes = rules.shift.halfDayThresholdHours * 60; // 270 mins (4.5h)

  // Early departure check: check-out before 6:15 PM and net < 8h
  const isEarly = effectiveCheckOut < earlyDepartureThreshold && netMinutes < fullDayMinutes;
  if (isEarly) {
    flags.push('EARLY_DEPARTURE');
  }

  // Overtime check: net > 9h (540 mins)
  if (netMinutes > 540) {
    flags.push('OVERTIME');
  }

  // Status determination
  let status = 'present';
  let label = 'Present';
  let statusColor = 'good';

  if (netMinutes >= fullDayMinutes) {
    status = 'present';
    label = 'Present';
    statusColor = isLate || isEarly ? 'warn' : 'good';
  } else if (netMinutes >= halfDayMinutes) {
    status = 'half_day';
    label = 'Half day';
    statusColor = 'warn';
    flags.push('SHORT_HOURS');
  } else {
    status = 'absent';
    label = 'Absent';
    statusColor = 'bad';
    flags.push('SHORT_HOURS', 'ABSENT');
  }

  return {
    status,
    label,
    statusColor,
    netMinutes,
    grossMinutes,
    breakMinutes: finalBreakMinutes,
    recordedBreakMinutes: totalBreakMin,
    netSeconds,
    grossSeconds,
    breakSeconds: finalBreakSeconds,
    recordedBreakSeconds: totalBreakSec,
    flags,
    isLate,
    isEarly
  };
}

export default evaluateDay;

