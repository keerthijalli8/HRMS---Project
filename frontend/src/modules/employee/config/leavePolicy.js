// src/config/leavePolicy.js
// Configurable leave policies, to be validated by HR.

export const LEAVE_POLICY = {
  types: [
    {
      id: 'casual',
      name: 'Casual Leave',
      code: 'CL',
      totalAnnual: 12,
      minNoticeDays: 1,
      attachmentRequiredAboveDays: null,
      color: 'var(--accent)',
      description: 'Short planned absences or urgent personal matters.'
    },
    {
      id: 'sick',
      name: 'Sick Leave',
      code: 'SL',
      totalAnnual: 10,
      minNoticeDays: 0,
      attachmentRequiredAboveDays: 2, // Medical certificate required if > 2 days
      color: 'var(--info)',
      description: 'Absence due to illness or medical appointment.'
    },
    {
      id: 'earned',
      name: 'Earned Leave',
      code: 'EL',
      totalAnnual: 18,
      minNoticeDays: 3,
      attachmentRequiredAboveDays: null,
      color: 'var(--accent2)',
      description: 'Accrued annual vacation leave.'
    },
    {
      id: 'compoff',
      name: 'Comp-off',
      code: 'CO',
      totalAnnual: 2,
      minNoticeDays: 1,
      attachmentRequiredAboveDays: null,
      color: 'var(--good)',
      description: 'Compensatory off for working on weekend or holiday.'
    },
    {
      id: 'unpaid',
      name: 'Unpaid Leave (LOP)',
      code: 'LOP',
      totalAnnual: null, // Unlimited / No cap
      minNoticeDays: 1,
      attachmentRequiredAboveDays: null,
      color: 'var(--warn)',
      description: 'Loss of pay leave when other balances are exhausted.'
    }
  ],
  workingDaysOnly: true, // Excludes Saturdays, Sundays, and public holidays
  accrualFrequency: 'Monthly on 1st',
  disclaimer: 'Configurable example, to be validated by HR'
};

export default LEAVE_POLICY;

