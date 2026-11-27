// src/data/mockLeaves.js
// Mock dataset for Employee Leave Dashboard matching business rules and approval workflow shape.

const hoursAgoIso = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

const daysFromTodayStr = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400 * 1000);
  return d.toISOString().split('T')[0];
};

export const MOCK_LEAVE_BALANCES = {
  casual: {
    leaveType: 'Casual Leave',
    code: 'CL',
    total: 12,
    used: 4,
    pending: 1,
    available: 7
  },
  sick: {
    leaveType: 'Sick Leave',
    code: 'SL',
    total: 10,
    used: 2,
    pending: 0,
    available: 8
  },
  earned: {
    leaveType: 'Earned Leave',
    code: 'EL',
    total: 18,
    used: 6,
    pending: 2,
    available: 10
  }
};

export const MOCK_LEAVE_REQUESTS = [
  // 1. Pending (<48h) where TL AND HR already recommended Approved, Manager undecided -> STILL Pending!
  {
    id: 'LR-2026-109',
    leaveType: 'Casual Leave',
    fromDate: daysFromTodayStr(4),
    toDate: daysFromTodayStr(4),
    days: 1,
    reason: 'Attending close family ceremony in hometown; traveling back same evening.',
    status: 'Pending',
    appliedOn: hoursAgoIso(18),
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Approved',
        remark: 'Recommended: Frontend sprint tickets are on schedule and covered by Farhan.',
        decidedAt: hoursAgoIso(12)
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Pending',
        remark: 'Awaiting Manager final decision (within 48h review window).',
        decidedAt: null
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Approved',
        remark: 'Recommended: Sufficient Casual Leave balance verified (7 days remaining).',
        decidedAt: hoursAgoIso(8)
      }
    ]
  },

  // 2. Escalated (>48h without Manager action, HR undecided -> Escalated!)
  {
    id: 'LR-2026-108',
    leaveType: 'Casual Leave',
    fromDate: daysFromTodayStr(7),
    toDate: daysFromTodayStr(8),
    days: 2,
    reason: 'Personal house shifting and utility verification appointments at Kondapur.',
    status: 'Escalated',
    appliedOn: hoursAgoIso(62),
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Approved',
        remark: 'Recommended: Handover checklist shared with team; no release conflict.',
        decidedAt: hoursAgoIso(52)
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Pending',
        remark: 'Manager did not act within the 48-hour SLA window; escalated automatically.',
        decidedAt: null
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Pending',
        remark: 'Escalated to HR final authority queue after 48h manager inactivity.',
        decidedAt: null
      }
    ]
  },

  // 3. Pending (<48h, freshly applied — awaiting all 3 steps)
  {
    id: 'LR-2026-107',
    leaveType: 'Earned Leave',
    fromDate: daysFromTodayStr(11),
    toDate: daysFromTodayStr(12),
    days: 2,
    reason: 'Planned outstation family getaway to Coorg over the extended weekend.',
    status: 'Pending',
    appliedOn: hoursAgoIso(6),
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Pending',
        remark: 'Queued for Team Lead workload check.',
        decidedAt: null
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Pending',
        remark: 'Awaiting Manager final decision.',
        decidedAt: null
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Pending',
        remark: 'Pending balance check and upstream review.',
        decidedAt: null
      }
    ]
  },

  // 4. Rejected by Manager (TL approved, HR approved -> Final status is Rejected!)
  {
    id: 'LR-2026-106',
    leaveType: 'Earned Leave',
    fromDate: '2026-11-02',
    toDate: '2026-11-04',
    days: 3,
    reason: 'Extended personal break after festival weekend travel.',
    status: 'Rejected',
    appliedOn: '2026-10-28T09:15:00+05:30',
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Approved',
        remark: 'Recommended: PR queue is manageable with existing backup.',
        decidedAt: '2026-10-28T13:40:00+05:30'
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Rejected',
        remark: 'Declined due to mandatory WCAG 2.1 AA production freeze and client demo scheduled on 3 Nov.',
        decidedAt: '2026-10-29T10:15:00+05:30'
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Approved',
        remark: 'Quota availability confirmed (HR recommendation only).',
        decidedAt: '2026-10-28T16:05:00+05:30'
      }
    ]
  },

  // 5. Escalated & Resolved by HR (>48h without Manager action -> HR decision became final Approved)
  {
    id: 'LR-2026-105',
    leaveType: 'Sick Leave',
    fromDate: '2026-10-21',
    toDate: '2026-10-22',
    days: 2,
    reason: 'Acute migraine and high fever requiring complete bed rest per physician advice.',
    status: 'Approved',
    appliedOn: '2026-10-18T08:30:00+05:30',
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Approved',
        remark: 'Recommended immediately; daily standup coverage arranged.',
        decidedAt: '2026-10-18T09:45:00+05:30'
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Pending',
        remark: 'Manager unavailable on offsite summit beyond 48-hour SLA window.',
        decidedAt: null
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Approved',
        remark: 'Approved by HR under 48-hour escalation authority; medical leave granted.',
        decidedAt: '2026-10-20T11:20:00+05:30'
      }
    ]
  },

  // 6. Standard Approved (TL, Manager, HR all approved)
  {
    id: 'LR-2026-104',
    leaveType: 'Earned Leave',
    fromDate: '2026-10-14',
    toDate: '2026-10-16',
    days: 3,
    reason: 'Planned annual family vacation trip to Goa.',
    status: 'Approved',
    appliedOn: '2026-10-05T10:20:00+05:30',
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Approved',
        remark: 'Recommended: All Q3 deliverables closed cleanly ahead of trip.',
        decidedAt: '2026-10-05T12:10:00+05:30'
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Approved',
        remark: 'Approved. Have a refreshing holiday and disconnect completely!',
        decidedAt: '2026-10-05T15:30:00+05:30'
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Approved',
        remark: 'Leave balance updated in payroll cycle.',
        decidedAt: '2026-10-05T17:00:00+05:30'
      }
    ]
  },

  // 7. Approved by Manager overriding TL rejection (Manager is Final Authority!)
  {
    id: 'LR-2026-103',
    leaveType: 'Sick Leave',
    fromDate: '2026-09-22',
    toDate: '2026-09-23',
    days: 2,
    reason: 'Seasonal viral fever and doctor-advised recovery rest.',
    status: 'Approved',
    appliedOn: '2026-09-22T08:45:00+05:30',
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Rejected',
        remark: 'Not recommended initially due to UAT bug-bash overlap.',
        decidedAt: '2026-09-22T09:15:00+05:30'
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Approved',
        remark: 'Overriding TL caution: employee health takes priority. Approved for full recovery.',
        decidedAt: '2026-09-22T10:05:00+05:30'
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Approved',
        remark: 'Medical leave logged with zero attendance penalty.',
        decidedAt: '2026-09-22T11:30:00+05:30'
      }
    ]
  },

  // 8. Rejected by Manager & TL
  {
    id: 'LR-2026-102',
    leaveType: 'Casual Leave',
    fromDate: '2026-09-10',
    toDate: '2026-09-11',
    days: 2,
    reason: 'Attending friend engagement out of town during mid-week.',
    status: 'Rejected',
    appliedOn: '2026-09-08T14:10:00+05:30',
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Rejected',
        remark: 'Two senior UI engineers already on leave on 10–11 Sep.',
        decidedAt: '2026-09-08T16:00:00+05:30'
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Rejected',
        remark: 'Team bandwidth drops below 50% safety floor during critical release week. Please plan alternate dates.',
        decidedAt: '2026-09-08T18:20:00+05:30'
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Pending',
        remark: 'Closed automatically upon Manager rejection.',
        decidedAt: '2026-09-09T09:30:00+05:30'
      }
    ]
  },

  // 9. Cancelled by Employee
  {
    id: 'LR-2026-101',
    leaveType: 'Casual Leave',
    fromDate: '2026-08-21',
    toDate: '2026-08-21',
    days: 1,
    reason: 'Personal DMV / RTO license renewal appointment (postponed by authority).',
    status: 'Cancelled',
    appliedOn: '2026-08-19T11:05:00+05:30',
    approvals: [
      {
        role: 'TL',
        name: 'Vikram Rao',
        decision: 'Pending',
        remark: 'Employee withdrew request before TL action.',
        decidedAt: null
      },
      {
        role: 'MANAGER',
        name: 'Priya Nair',
        decision: 'Pending',
        remark: 'Withdrawn by employee; no action needed.',
        decidedAt: null
      },
      {
        role: 'HR',
        name: 'Ananya Deshmukh',
        decision: 'Pending',
        remark: '1 day Casual Leave quota restored.',
        decidedAt: null
      }
    ]
  }
];

