// src/services/leaveService.js
// Frontend service layer backed by /src/data/mockLeaves.js & localStorage.
// Designed so a real REST/GraphQL API can replace these async methods without changing any UI components.

import { MOCK_LEAVE_BALANCES, MOCK_LEAVE_REQUESTS } from '../data/mockLeaves.js';
import { INITIAL_HOLIDAYS } from '../data/employee.js';
import { LEAVE_POLICY } from '../config/leavePolicy.js';
import { getFinalStatus } from '../utils/leaveStatus.js';

const STORAGE_BALANCES_KEY = 'hrms_emp_leave_balances_v2';
const STORAGE_REQUESTS_KEY = 'hrms_emp_leave_requests_v2';

function load(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage quota errors
  }
}

function resolveBalanceKey(leaveType = '') {
  const lower = String(leaveType).toLowerCase();
  if (lower.includes('casual')) return 'casual';
  if (lower.includes('sick')) return 'sick';
  if (lower.includes('earned')) return 'earned';
  return null;
}

/**
 * Calculates working days between two YYYY-MM-DD dates (inclusive), excluding weekends and known holidays.
 */
export function calculateWorkingDays(startDateStr, endDateStr, holidays = INITIAL_HOLIDAYS) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  const holidayDates = new Set((holidays || []).map((h) => h.date));
  let count = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = Sunday, 6 = Saturday
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return count;
}

export const leaveService = {
  /**
   * Simulates network fetch for both leave balances and leave requests.
   * Pass { simulateError: true } to test the Error/Retry UI flow.
   */
  async getLeaveDashboardData({ simulateError = false, delayMs = 450 } = {}) {
    await new Promise((r) => setTimeout(r, delayMs));
    if (simulateError) {
      throw new Error('Failed to fetch leave records from HRMS API (Simulated 503 Service Unavailable).');
    }
    const balances = load(STORAGE_BALANCES_KEY, MOCK_LEAVE_BALANCES);
    const requests = load(STORAGE_REQUESTS_KEY, MOCK_LEAVE_REQUESTS);
    return { balances, requests };
  },

  async getBalances() {
    await new Promise((r) => setTimeout(r, 250));
    return load(STORAGE_BALANCES_KEY, MOCK_LEAVE_BALANCES);
  },

  async getRequests() {
    await new Promise((r) => setTimeout(r, 300));
    return load(STORAGE_REQUESTS_KEY, MOCK_LEAVE_REQUESTS);
  },

  /**
   * Validates leave form inputs against required fields, date bounds, balance limits, and overlaps.
   */
  async validateRequest(form) {
    const { leaveType, fromDate, toDate, reason = '', isHalfDay = false } = form;
    const errors = [];
    const warnings = [];
    const balances = load(STORAGE_BALANCES_KEY, MOCK_LEAVE_BALANCES);

    if (!leaveType) {
      errors.push('Leave type is required.');
    }
    if (!fromDate || !toDate) {
      errors.push('Both From Date and To Date are required.');
      return { isValid: false, errors, warnings, days: 0 };
    }

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);

    if (end < start) {
      errors.push('To Date cannot be before From Date.');
    }

    const workingDays = isHalfDay ? 0.5 : calculateWorkingDays(fromDate, toDate);
    if (end >= start && workingDays <= 0) {
      errors.push('Selected date range contains only weekends or public holidays (0 working days).');
    }

    // Balance check
    const balKey = resolveBalanceKey(leaveType);
    if (balKey && balances[balKey] && workingDays > balances[balKey].available) {
      errors.push(
        `Requested ${workingDays} day(s) exceeds your available ${leaveType} balance (${balances[balKey].available} days available).`
      );
    }

    // Overlap check against active (non-cancelled, non-rejected) requests
    const existing = load(STORAGE_REQUESTS_KEY, MOCK_LEAVE_REQUESTS);
    const hasOverlap = existing.some((req) => {
      const effectiveStatus = getFinalStatus(req);
      if (effectiveStatus === 'Cancelled' || effectiveStatus === 'Rejected') return false;
      const rStart = new Date(`${req.fromDate}T00:00:00`);
      const rEnd = new Date(`${req.toDate}T00:00:00`);
      return start <= rEnd && end >= rStart;
    });

    if (hasOverlap) {
      errors.push('Selected dates overlap with an existing active or pending leave request.');
    }

    if (reason && reason.trim().length > 0 && reason.trim().length < 5) {
      errors.push('Please provide a clear reason (at least 5 characters).');
    }

    // Policy informational notice
    const policy = LEAVE_POLICY.types.find((t) =>
      t.name.toLowerCase().includes(String(leaveType).toLowerCase())
    );
    if (policy && policy.minNoticeDays > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      if (diffDays < policy.minNoticeDays) {
        warnings.push(`${policy.name} policy recommends ${policy.minNoticeDays} day(s) advance notice.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      days: workingDays
    };
  },

  /**
   * Submits a new leave request with 3-step approval structure (TL, MANAGER [Final], HR).
   * Persists to localStorage and updates pending quota.
   */
  async applyLeave({ leaveType, fromDate, toDate, reason, days: customDays }) {
    await new Promise((r) => setTimeout(r, 350));

    const requests = load(STORAGE_REQUESTS_KEY, MOCK_LEAVE_REQUESTS);
    const balances = load(STORAGE_BALANCES_KEY, MOCK_LEAVE_BALANCES);

    const days = customDays ?? calculateWorkingDays(fromDate, toDate);
    if (days <= 0) {
      throw new Error('Cannot submit leave for 0 working days.');
    }

    const balKey = resolveBalanceKey(leaveType);
    if (balKey && balances[balKey] && days > balances[balKey].available) {
      throw new Error(`Insufficient ${leaveType} balance (${balances[balKey].available} days available).`);
    }

    const nowIso = new Date().toISOString();
    const nextNum = requests.length + 110;
    const newRequest = {
      id: `LR-2026-${nextNum}`,
      leaveType,
      fromDate,
      toDate,
      days,
      reason: String(reason).trim(),
      status: 'Pending',
      appliedOn: nowIso,
      approvals: [
        {
          role: 'TL',
          name: 'Vikram Rao',
          decision: 'Pending',
          remark: 'Awaiting Team Lead recommendation.',
          decidedAt: null
        },
        {
          role: 'MANAGER',
          name: 'Priya Nair',
          decision: 'Pending',
          remark: 'Awaiting Manager final decision (48h SLA active).',
          decidedAt: null
        },
        {
          role: 'HR',
          name: 'Ananya Deshmukh',
          decision: 'Pending',
          remark: 'Awaiting HR policy verification.',
          decidedAt: null
        }
      ]
    };

    const updatedRequests = [newRequest, ...requests];
    save(STORAGE_REQUESTS_KEY, updatedRequests);

    if (balKey && balances[balKey]) {
      const updatedBal = { ...balances[balKey] };
      updatedBal.pending = Number((updatedBal.pending || 0) + days);
      updatedBal.available = Math.max(0, updatedBal.total - updatedBal.used - updatedBal.pending);
      balances[balKey] = updatedBal;
      save(STORAGE_BALANCES_KEY, balances);
    }

    return {
      newRequest,
      requests: updatedRequests,
      balances
    };
  },

  /**
   * Cancels a Pending leave request and restores pending quota.
   */
  async cancelLeave(id) {
    await new Promise((r) => setTimeout(r, 300));
    const requests = load(STORAGE_REQUESTS_KEY, MOCK_LEAVE_REQUESTS);
    const balances = load(STORAGE_BALANCES_KEY, MOCK_LEAVE_BALANCES);

    const target = requests.find((r) => r.id === id);
    if (!target) throw new Error('Leave request not found.');

    const effectiveStatus = getFinalStatus(target);
    if (effectiveStatus !== 'Pending') {
      throw new Error(`Only Pending requests can be cancelled (current status: ${effectiveStatus}).`);
    }

    const nowIso = new Date().toISOString();
    const updatedRequests = requests.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'Cancelled',
        cancelledAt: nowIso,
        approvals: (r.approvals || []).map((a) => ({
          ...a,
          remark:
            a.role === 'MANAGER'
              ? 'Withdrawn and cancelled by employee prior to manager final decision.'
              : a.remark
        }))
      };
    });
    save(STORAGE_REQUESTS_KEY, updatedRequests);

    const balKey = resolveBalanceKey(target.leaveType);
    if (balKey && balances[balKey]) {
      const updatedBal = { ...balances[balKey] };
      updatedBal.pending = Math.max(0, (updatedBal.pending || 0) - target.days);
      updatedBal.available = Math.max(0, updatedBal.total - updatedBal.used - updatedBal.pending);
      balances[balKey] = updatedBal;
      save(STORAGE_BALANCES_KEY, balances);
    }

    return {
      requests: updatedRequests,
      balances
    };
  },

  // Backward-compatible alias
  async cancelRequest(id) {
    return this.cancelLeave(id);
  },

  /**
   * Resets local storage mock data back to defaults (useful for demo/testing).
   */
  async resetMockData() {
    save(STORAGE_BALANCES_KEY, MOCK_LEAVE_BALANCES);
    save(STORAGE_REQUESTS_KEY, MOCK_LEAVE_REQUESTS);
    return {
      balances: MOCK_LEAVE_BALANCES,
      requests: MOCK_LEAVE_REQUESTS
    };
  }
};

export default leaveService;
