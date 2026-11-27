export const PAY_PERIOD = 'November 2026';
export const PAYSLIP_EMPLOYEE_ID = 'TL-1042';
export const AMOUNT_IN_WORDS = 'Rupees One Lakh Sixteen Thousand Three Hundred Fifty Only';
export const EARNINGS = [
  { label: 'BASIC SALARY', amount: 66250 },
  { label: 'HOUSE RENT ALLOWANCE', amount: 23187.5 },
  { label: 'CSA (25% OF GROSS)', amount: 33125 },
  { label: 'BONUS', amount: 0 },
  { label: 'OTHER ALLOWANCE', amount: 9937.5 }
];
export const DEDUCTIONS = [
  { label: 'EMPLOYEE EPF', amount: 7950 },
  { label: 'PROFESSIONAL TAX', amount: 200 },
  { label: 'TDS', amount: 8000 },
  { label: 'LEAVE DEDUCTION (LOP)', amount: 0 }
];

export const grossEarnings = EARNINGS.reduce((total, item) => total + item.amount, 0);
export const totalDeductions = DEDUCTIONS.reduce((total, item) => total + item.amount, 0);
export const netPay = grossEarnings - totalDeductions;
