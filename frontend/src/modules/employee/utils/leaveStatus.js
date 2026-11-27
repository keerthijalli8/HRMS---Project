// src/utils/leaveStatus.js
// Pure business rule engine for evaluating Employee Leave final status and escalation authority.

export const ESCALATION_HOURS_THRESHOLD = 48;

function getStoredEmployeeNameFallback() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hrms_employee_profile_overrides');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.name) return parsed.name;
      }
    }
  } catch {
    // Ignore storage access errors
  }
  return 'Aarav Mehta';
}

/**
 * Normalizes an approval decision string to 'Approved' | 'Rejected' | 'Pending'.
 */
export function normalizeDecision(decision) {
  if (!decision) return 'Pending';
  const d = String(decision).trim().toLowerCase();
  if (d === 'approved' || d === 'approve') return 'Approved';
  if (d === 'rejected' || d === 'reject') return 'Rejected';
  return 'Pending';
}

/**
 * Extracts role-specific approval step ('TL' | 'MANAGER' | 'HR') from a leave request.
 */
export function getApprovalByRole(leave, role) {
  if (!leave || !Array.isArray(leave.approvals)) return null;
  return leave.approvals.find(
    (step) => String(step.role).toUpperCase() === String(role).toUpperCase()
  ) || null;
}

/**
 * Computes elapsed hours between leave.appliedOn and referenceDate.
 */
export function getElapsedHoursSinceApplied(appliedOn, referenceDate = new Date()) {
  if (!appliedOn) return 0;
  const appliedTime = new Date(appliedOn).getTime();
  const refTime = (referenceDate instanceof Date ? referenceDate : new Date(referenceDate)).getTime();
  if (isNaN(appliedTime) || isNaN(refTime)) return 0;
  return Math.max(0, (refTime - appliedTime) / (1000 * 60 * 60));
}

/**
 * Evaluates comprehensive leave status and authority metadata:
 * 1. Manager is the FINAL AUTHORITY. TL and HR are recommendations only.
 * 2. Manager Rejected -> Rejected; Manager Approved -> Approved.
 * 3. Manager not decided -> Pending (even if TL and HR already decided).
 * 4. If Manager has not acted within 48 hours -> status = Escalated, and HR's decision becomes final.
 *
 * @param {Object} leave - Leave request object matching mockLeaves shape
 * @param {Date|string} [referenceDate=new Date()] - Current reference time for 48h SLA calculation
 * @returns {Object} Full evaluation details including status, authorityLabel, finalRemark, and flags
 */
export function getFinalStatusDetails(leave, referenceDate = new Date()) {
  if (!leave) {
    return {
      status: 'Pending',
      authorityRole: 'MANAGER',
      authorityLabel: 'Awaiting final decision by Manager',
      finalRemark: 'No request data.',
      decidedByName: null,
      decidedAt: null,
      isEscalated: false,
      hoursElapsed: 0
    };
  }

  // Explicitly cancelled by employee takes precedence
  if (String(leave.status).toLowerCase() === 'cancelled') {
    const mgr = getApprovalByRole(leave, 'MANAGER');
    return {
      status: 'Cancelled',
      authorityRole: 'EMPLOYEE',
      authorityLabel: 'Cancelled by Employee',
      finalRemark: mgr?.remark || leave.cancellationReason || 'Request withdrawn by employee prior to completion.',
      decidedByName: leave.cancelledBy || leave.employeeName || getStoredEmployeeNameFallback(),
      decidedAt: leave.cancelledAt || leave.appliedOn,
      isEscalated: false,
      hoursElapsed: getElapsedHoursSinceApplied(leave.appliedOn, referenceDate)
    };
  }

  const managerStep = getApprovalByRole(leave, 'MANAGER');
  const hrStep = getApprovalByRole(leave, 'HR');

  const managerDecision = normalizeDecision(managerStep?.decision);
  const hrDecision = normalizeDecision(hrStep?.decision);
  const hoursElapsed = getElapsedHoursSinceApplied(leave.appliedOn, referenceDate);

  // Rule: Manager has explicitly decided (Approved or Rejected) -> FINAL AUTHORITY
  if (managerDecision === 'Rejected') {
    return {
      status: 'Rejected',
      authorityRole: 'MANAGER',
      authorityLabel: 'Final decision by Manager',
      finalRemark: managerStep?.remark || 'Rejected by Manager.',
      decidedByName: managerStep?.name || 'Priya Nair',
      decidedAt: managerStep?.decidedAt || null,
      isEscalated: false,
      hoursElapsed
    };
  }

  if (managerDecision === 'Approved') {
    return {
      status: 'Approved',
      authorityRole: 'MANAGER',
      authorityLabel: 'Final decision by Manager',
      finalRemark: managerStep?.remark || 'Approved by Manager.',
      decidedByName: managerStep?.name || 'Priya Nair',
      decidedAt: managerStep?.decidedAt || null,
      isEscalated: false,
      hoursElapsed
    };
  }

  // Manager has NOT decided yet -> check 48-hour SLA escalation rule
  if (hoursElapsed >= ESCALATION_HOURS_THRESHOLD) {
    // HR's decision becomes final after 48h without Manager action
    if (hrDecision === 'Approved') {
      return {
        status: 'Approved',
        authorityRole: 'HR',
        authorityLabel: 'Final decision by HR (Escalated after 48h)',
        finalRemark: hrStep?.remark || 'Approved by HR following 48h Manager escalation.',
        decidedByName: hrStep?.name || 'Ananya Deshmukh',
        decidedAt: hrStep?.decidedAt || null,
        isEscalated: true,
        hoursElapsed
      };
    }

    if (hrDecision === 'Rejected') {
      return {
        status: 'Rejected',
        authorityRole: 'HR',
        authorityLabel: 'Final decision by HR (Escalated after 48h)',
        finalRemark: hrStep?.remark || 'Rejected by HR following 48h Manager escalation.',
        decidedByName: hrStep?.name || 'Ananya Deshmukh',
        decidedAt: hrStep?.decidedAt || null,
        isEscalated: true,
        hoursElapsed
      };
    }

    // Both Manager (past 48h) and HR still undecided -> status = Escalated
    return {
      status: 'Escalated',
      authorityRole: 'HR',
      authorityLabel: 'Escalated (>48h without Manager action) · Final decision now with HR',
      finalRemark: hrStep?.remark || managerStep?.remark || 'Escalated to HR because Manager did not act within 48 hours.',
      decidedByName: hrStep?.name || 'Ananya Deshmukh',
      decidedAt: null,
      isEscalated: true,
      hoursElapsed
    };
  }

  // Manager not decided within 48h -> Pending (even if TL and HR already decided)
  return {
    status: 'Pending',
    authorityRole: 'MANAGER',
    authorityLabel: 'Final decision by Manager (Pending)',
    finalRemark: managerStep?.remark || 'Awaiting final decision by Manager.',
    decidedByName: managerStep?.name || 'Priya Nair',
    decidedAt: null,
    isEscalated: false,
    hoursElapsed
  };
}

/**
 * Returns the canonical final status string for a leave request:
 * 'Approved' | 'Rejected' | 'Pending' | 'Escalated' | 'Cancelled'
 */
export function getFinalStatus(leave, referenceDate = new Date()) {
  return getFinalStatusDetails(leave, referenceDate).status;
}

export default getFinalStatus;

