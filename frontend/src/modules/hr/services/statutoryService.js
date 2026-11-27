/**
 * Official India Statutory Compliance Service (statutoryService.js)
 * Computes live recurring compliance due dates for a Hyderabad, Telangana employer,
 * handles filing workflows, audit logging, and automated notification reminders.
 */

import {
  STATUTORY_CONFIG,
  STATUTORY_STORAGE_KEY,
  STATUTORY_EVENT_NAME
} from '../config/statutory.js';
import { TELANGANA_HOLIDAYS_2026, getTodayIST } from '../data/mockDb.js';
import { logEvent } from './auditService.js';
import { addNotification, loadAllNotifications } from './notificationStore.js';

// Month names in English
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Loads all filed statutory records from localStorage
 */
export function loadFiledStatutoryRecords() {
  try {
    const raw = localStorage.getItem(STATUTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[statutoryService] Error reading filed records:", e);
  }
  return {};
}

/**
 * Saves filed statutory records to localStorage and notifies listeners
 */
export function saveFiledStatutoryRecords(records) {
  try {
    localStorage.setItem(STATUTORY_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(STATUTORY_EVENT_NAME, { detail: records }));
  } catch (e) {
    console.error("[statutoryService] Error saving filed records:", e);
  }
}

/**
 * Subscribes to statutory filing changes
 */
export function subscribeStatutory(callback) {
  const handler = () => callback(loadFiledStatutoryRecords());
  window.addEventListener(STATUTORY_EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(STATUTORY_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Checks if a given date falls on Saturday, Sunday, or a declared Telangana holiday.
 * Returns an explanatory note if applicable (the legal date itself is not altered).
 */
export function getWeekendOrHolidayNote(dateObj) {
  const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const year = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  const dateKey = `${year}-${m}-${d}`;

  // Check official Telangana Gazetted holiday
  const holiday = TELANGANA_HOLIDAYS_2026.find(h => h.date === dateKey && !h.isOptional);
  if (holiday) {
    return `Falls on ${holiday.name}, pay by the previous working day`;
  }

  if (day === 0) {
    return "Falls on Sunday, pay by the previous working day";
  }

  if (day === 6) {
    return "Falls on Saturday, pay by the previous working day";
  }

  return null;
}

/**
 * Computes all statutory compliance items with real recurring dates relative to today in Asia/Kolkata.
 */
export function getComputedStatutoryItems(referenceDate = new Date()) {
  const filedMap = loadFiledStatutoryRecords();

  // Get current date components in Asia/Kolkata
  let nowIST = referenceDate;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(referenceDate).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    nowIST = new Date(
      parseInt(parts.year, 10),
      parseInt(parts.month, 10) - 1,
      parseInt(parts.day, 10),
      parseInt(parts.hour || "12", 10),
      parseInt(parts.minute || "0", 10)
    );
  } catch (e) {
    // Fallback to local
  }

  const currentYear = nowIST.getFullYear();
  const currentMonthIdx = nowIST.getMonth(); // 0-indexed (e.g. 10 for November)
  const currentDay = nowIST.getDate();

  const startOfToday = new Date(currentYear, currentMonthIdx, currentDay, 0, 0, 0);

  const results = [];

  for (const config of STATUTORY_CONFIG) {
    // ----------------- CASE 1: Monthly Recurring Items -----------------
    if (config.frequency === "monthly") {
      let dueYear = currentYear;
      let dueMonthIdx = currentMonthIdx;

      // If the day in the current month has already passed, the NEXT cycle is next month
      if (currentDay > config.dayOfMonth) {
        dueMonthIdx += 1;
        if (dueMonthIdx > 11) {
          dueMonthIdx = 0;
          dueYear += 1;
        }
      }

      const dueDate = new Date(dueYear, dueMonthIdx, config.dayOfMonth, 18, 0, 0);
      const cycleKey = `${dueYear}-${String(dueMonthIdx + 1).padStart(2, '0')}`;
      const compositeKey = `${config.id}_${cycleKey}`;

      // Coverage is the previous month's payroll
      let covMonthIdx = dueMonthIdx - 1;
      let covYear = dueYear;
      if (covMonthIdx < 0) {
        covMonthIdx = 11;
        covYear -= 1;
      }
      const coverageLabel = `${MONTH_NAMES[covMonthIdx]} ${covYear} payroll`;

      const filedRecord = filedMap[compositeKey] || null;
      const isFiled = Boolean(filedRecord);

      // Compute days remaining
      const dueStart = new Date(dueYear, dueMonthIdx, config.dayOfMonth, 0, 0, 0);
      const diffTime = dueStart.getTime() - startOfToday.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Status badge label and theme
      let status = "Upcoming";
      let badgeClass = "bg-accent/15 text-accent border border-accent/30";

      if (isFiled) {
        status = "Filed";
        badgeClass = "bg-good/15 text-good border border-good/30";
      } else if (diffDays < 0) {
        status = `Overdue ${Math.abs(diffDays)}d`;
        badgeClass = "bg-bad/15 text-bad border border-bad/30 font-bold";
      } else if (diffDays === 0) {
        status = "Due today";
        badgeClass = "bg-warn/20 text-warn border border-warn/40 font-bold animate-pulse";
      } else if (diffDays <= 7) {
        status = `Due in ${diffDays}d`;
        badgeClass = "bg-warn/15 text-warn border border-warn/30 font-semibold";
      }

      const holidayNote = getWeekendOrHolidayNote(dueDate);

      results.push({
        ...config,
        cycleKey,
        compositeKey,
        dueDate,
        formattedDueDate: `${config.dayOfMonth} ${MONTH_NAMES[dueMonthIdx]}`,
        fullDueDateStr: `${config.dayOfMonth} ${FULL_MONTH_NAMES[dueMonthIdx]} ${dueYear}`,
        coverage: coverageLabel,
        isFiled,
        filedRecord,
        diffDays,
        status,
        badgeClass,
        holidayNote,
        isVariable: false
      });
    }

    // ----------------- CASE 2: Quarterly TDS Form 24Q -----------------
    else if (config.frequency === "quarterly" && Array.isArray(config.quarters)) {
      // Find the next upcoming quarter deadline
      let nextQ = null;
      let qDueDate = null;
      let qYear = currentYear;

      for (const q of config.quarters) {
        const candidateDueMonthIdx = q.dueMonth - 1;
        let testYear = currentYear;
        // If quarter due month is Jan or May, check if it refers to next calendar year
        if (candidateDueMonthIdx < currentMonthIdx || (candidateDueMonthIdx === currentMonthIdx && currentDay > q.dueDay)) {
          testYear = currentYear + 1;
        }

        const candidateDate = new Date(testYear, candidateDueMonthIdx, q.dueDay, 18, 0, 0);
        if (!qDueDate || candidateDate.getTime() < qDueDate.getTime()) {
          qDueDate = candidateDate;
          nextQ = q;
          qYear = testYear;
        }
      }

      if (nextQ && qDueDate) {
        const cycleKey = `${qYear}-${nextQ.quarter}`;
        const compositeKey = `${config.id}_${cycleKey}`;
        const filedRecord = filedMap[compositeKey] || null;
        const isFiled = Boolean(filedRecord);

        const dueStart = new Date(qDueDate.getFullYear(), qDueDate.getMonth(), nextQ.dueDay, 0, 0, 0);
        const diffTime = dueStart.getTime() - startOfToday.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let status = "Upcoming";
        let badgeClass = "bg-accent/15 text-accent border border-accent/30";
        if (isFiled) {
          status = "Filed";
          badgeClass = "bg-good/15 text-good border border-good/30";
        } else if (diffDays < 0) {
          status = `Overdue ${Math.abs(diffDays)}d`;
          badgeClass = "bg-bad/15 text-bad border border-bad/30 font-bold";
        } else if (diffDays === 0) {
          status = "Due today";
          badgeClass = "bg-warn/20 text-warn border border-warn/40 font-bold";
        } else if (diffDays <= 7) {
          status = `Due in ${diffDays}d`;
          badgeClass = "bg-warn/15 text-warn border border-warn/30 font-semibold";
        }

        const holidayNote = getWeekendOrHolidayNote(qDueDate);

        results.push({
          ...config,
          cycleKey,
          compositeKey,
          dueDate: qDueDate,
          formattedDueDate: nextQ.label,
          fullDueDateStr: `${nextQ.dueDay} ${MONTH_NAMES[qDueDate.getMonth()]} ${qYear}`,
          coverage: `${nextQ.quarter} (${nextQ.period}) TDS`,
          isFiled,
          filedRecord,
          diffDays,
          status,
          badgeClass,
          holidayNote,
          isVariable: false
        });
      }
    }

    // ----------------- CASE 3: Annual Form 16 -----------------
    else if (config.frequency === "annual") {
      let aYear = currentYear;
      const targetMonthIdx = (config.dueMonth || 6) - 1; // June = 5 (0-indexed)
      if (currentMonthIdx > targetMonthIdx || (currentMonthIdx === targetMonthIdx && currentDay > config.dueDay)) {
        aYear = currentYear + 1;
      }

      const aDueDate = new Date(aYear, targetMonthIdx, config.dueDay, 18, 0, 0);
      const cycleKey = `FY-${aYear}`;
      const compositeKey = `${config.id}_${cycleKey}`;
      const filedRecord = filedMap[compositeKey] || null;
      const isFiled = Boolean(filedRecord);

      const dueStart = new Date(aYear, targetMonthIdx, config.dueDay, 0, 0, 0);
      const diffTime = dueStart.getTime() - startOfToday.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let status = "Upcoming";
      let badgeClass = "bg-accent/15 text-accent border border-accent/30";
      if (isFiled) {
        status = "Filed";
        badgeClass = "bg-good/15 text-good border border-good/30";
      } else if (diffDays <= 7) {
        status = `Due in ${diffDays}d`;
        badgeClass = "bg-warn/15 text-warn border border-warn/30 font-semibold";
      }

      const holidayNote = getWeekendOrHolidayNote(aDueDate);

      results.push({
        ...config,
        cycleKey,
        compositeKey,
        dueDate: aDueDate,
        formattedDueDate: `${config.dueDay} ${MONTH_NAMES[targetMonthIdx]}`,
        fullDueDateStr: `${config.dueDay} ${MONTH_NAMES[targetMonthIdx]} ${aYear}`,
        coverage: `FY ${aYear - 1}-${String(aYear).slice(-2)} Annual`,
        isFiled,
        filedRecord,
        diffDays,
        status,
        badgeClass,
        holidayNote,
        isVariable: false
      });
    }

    // ----------------- CASE 4: Annual Variable (Telangana LWF) -----------------
    else if (config.frequency === "annual_variable") {
      results.push({
        ...config,
        cycleKey: `LWF-${currentYear}`,
        compositeKey: `${config.id}_LWF-${currentYear}`,
        dueDate: new Date(currentYear, 11, 31, 23, 59, 59),
        formattedDueDate: "Annual",
        fullDueDateStr: "Telangana Labour Dept portal verified date",
        coverage: `Year ${currentYear} LWF`,
        isFiled: false,
        filedRecord: null,
        diffDays: 999,
        status: "Notice",
        badgeClass: "bg-surface2 text-muted border border-line",
        holidayNote: null,
        isVariable: true
      });
    }
  }

  // Sorting:
  // 1. Unfiled items sorted by nearest due date ascending
  // 2. Filed items placed at the bottom
  // 3. Variable items placed after definite dates
  results.sort((a, b) => {
    if (a.isFiled !== b.isFiled) {
      return a.isFiled ? 1 : -1;
    }
    if (a.isVariable !== b.isVariable) {
      return a.isVariable ? 1 : -1;
    }
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return results;
}

/**
 * Marks a compliance item as filed for the active cycle
 */
export function markStatutoryFiled({ itemId, cycleKey, referenceNo = "", user }) {
  const all = loadFiledStatutoryRecords();
  const compositeKey = `${itemId}_${cycleKey}`;

  const record = {
    itemId,
    cycleKey,
    referenceNo: (referenceNo || "").trim(),
    filedAt: Date.now(),
    filedBy: user?.name || "HR Administrator",
    filedByEmpId: user?.employeeId || "HR-ADMIN"
  };

  all[compositeKey] = record;
  saveFiledStatutoryRecords(all);

  // Audit log entry
  try {
    const matchedConfig = STATUTORY_CONFIG.find(c => c.id === itemId);
    const itemName = matchedConfig?.name || itemId;
    logEvent({
      action: "statutory_filed",
      category: "Compliance",
      module: "Statutory Calendar",
      description: `Marked statutory compliance '${itemName}' as filed for cycle ${cycleKey}${referenceNo ? ` (Ref: ${referenceNo})` : ''}`,
      metadata: {
        itemId,
        cycleKey,
        referenceNo,
        authority: matchedConfig?.authority
      },
      user
    });
  } catch (err) {
    console.error("[statutoryService] Error logging audit event:", err);
  }

  return { ok: true, record };
}

/**
 * Automatically triggers in-app compliance notifications 3 days before due date and on due date
 */
export function checkAndGenerateStatutoryNotifications(user) {
  try {
    const items = getComputedStatutoryItems();
    const existing = loadAllNotifications();

    items.forEach((item) => {
      if (item.isFiled || item.isVariable) return;

      // Check if due in 3 days or due today
      if (item.diffDays <= 3 && item.diffDays >= 0) {
        const notifId = `NOTIF-STAT-${item.compositeKey}-${item.diffDays}d`;
        const alreadyExists = existing.some(n => n.id === notifId || (n.statutoryKey === item.compositeKey && n.diffDays === item.diffDays));

        if (!alreadyExists) {
          const title = item.diffDays === 0
            ? `Statutory Due Today: ${item.name}`
            : `Statutory Due in ${item.diffDays}d: ${item.name}`;

          addNotification({
            id: notifId,
            title,
            desc: `Due on ${item.formattedDueDate} for ${item.coverage}. Authority: ${item.authorityShort}. Click to verify.`,
            icon: "shield",
            type: "compliance",
            targetRole: "all",
            statutoryKey: item.compositeKey,
            diffDays: item.diffDays
          });
        }
      }
    });
  } catch (err) {
    console.error("[statutoryService] Error checking statutory notifications:", err);
  }
}
