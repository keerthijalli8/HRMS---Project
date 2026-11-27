export const EMPLOYEE_MOCK_PROFILE = {
  employeeId: 'EMP-1004',
  name: 'Mounika S. Rao',
  fullName: 'Mounika S. Rao',
  dateOfBirth: '14 Aug 1996',
  dob: '14 Aug 1996',
  gender: 'Female',
  bloodGroup: 'B+',
  maritalStatus: 'Single',
  nationality: 'Indian',
  workEmail: 'mounika.rao@technomold.corp',
  email: 'mounika.rao@technomold.corp',
  personalEmail: 'mounika.rao96@gmail.com',
  mobileNumber: '+91 98490 72314',
  phone: '+91 98490 72314',
  currentAddress: 'Flat 402, Cyber Pearl Residency, Madhapur, Hyderabad, Telangana 500081',
  permanentAddress: '12-4-88, Banjara Hills, Hyderabad, Telangana 500034',
  emergencyContact: 'Suresh Rao (Father) · +91 98480 41290',
  designation: 'Team Lead — Product Engineering',
  department: 'Engineering & Product Delivery',
  reportingManager: 'Vikramaditya Nair (Engineering Manager)',
  workLocation: 'Bengaluru Central Tech Hub / Hyderabad Hybrid',
  joiningDate: '10 Jan 2022',
  employmentType: 'Full-Time',
  grade: 'L5 - Team Lead',
  leaveBalance: {
    annual: { remaining: 14, total: 24 },
    earned: { remaining: 14, total: 24 },
    casual: { remaining: 7, total: 12 },
    sick: { remaining: 8, total: 10 }
  },
  documents: [
    { id: 'mounika-offer', name: 'Offer Letter', category: 'Employment · Signed', date: '10 Jan 2022', verificationStatus: 'Signed · On file' },
    { id: 'mounika-experience', name: 'Relieving / Experience Certificate', category: 'Employment · Verified', date: '10 Jan 2022', verificationStatus: 'Verified · On file' },
    { id: 'mounika-id', name: 'Employee ID Proof', category: 'Identity · Verified', date: '12 Jan 2022', verificationStatus: 'Verified · On file' },
    { id: 'mounika-pan', name: 'PAN Verification', category: 'Tax · Verified', date: '12 Jan 2022', verificationStatus: 'Verified · On file' },
    { id: 'mounika-aadhaar', name: 'Aadhaar Verification', category: 'Identity · Verified', date: '12 Jan 2022', verificationStatus: 'Verified · On file' }
  ],
  offerLetterSentDate: '10 Jan 2022',
  performanceScore: 94,
  kpiScore: '96% achieved',
  goalsProgress: 92,
  reviewCycle: 'Q3 FY 2026',
  okrs: [
    { id: 'mounika-okr-1', title: 'Deliver Product Engineering roadmap', progress: 92, status: 'On Track' },
    { id: 'mounika-okr-2', title: 'Improve release quality and delivery predictability', progress: 88, status: 'On Track' }
  ]
};

export const EMPLOYEE_ATTENDANCE_MOCK = [
  { dateKey: '2026-11-20', checkInTime: '2026-11-20T09:18:00+05:30', checkOutTime: '2026-11-20T18:32:00+05:30', accumulatedBreakSeconds: 2700, checkInLocation: { label: 'Bengaluru Central Tech Hub' }, status: 'Checked Out' },
  { dateKey: '2026-11-19', checkInTime: '2026-11-19T09:24:00+05:30', checkOutTime: '2026-11-19T18:26:00+05:30', accumulatedBreakSeconds: 2400, checkInLocation: { label: 'Hyderabad Hybrid' }, status: 'Checked Out' },
  { dateKey: '2026-11-18', checkInTime: '2026-11-18T09:16:00+05:30', checkOutTime: '2026-11-18T18:41:00+05:30', accumulatedBreakSeconds: 3000, checkInLocation: { label: 'Bengaluru Central Tech Hub' }, status: 'Checked Out' },
  { dateKey: '2026-11-17', checkInTime: '2026-11-17T09:29:00+05:30', checkOutTime: '2026-11-17T18:22:00+05:30', accumulatedBreakSeconds: 2400, checkInLocation: { label: 'Hyderabad Hybrid' }, status: 'Checked Out' }
];

export const EMPLOYEE_LEAVE_MOCK = {
  id: 'LV-EMP-1004-026', employeeId: 'EMP-1004', requestType: 'Casual Leave',
  fromDate: '2026-12-04', toDate: '2026-12-04', totalDays: 1,
  reason: 'Personal appointment', status: 'Approved'
};

export const EMPLOYEE_FEEDBACK_MOCK = [
  { id: 'FB-EMP-1004-026', employeeId: 'EMP-1004', type: 'Quarterly Review', date: '18 Nov 2026', rating: 'Exceeds Expectations', giver: 'Vikramaditya Nair', content: 'Strong delivery ownership and clear technical leadership across the product engineering roadmap.' }
];

export const EMPLOYEE_PAYROLL_MOCK = {
  period: 'October 2026', gross: 184000, deductions: 27650, net: 156350,
  basic: 92000, hra: 36800, specialAllowance: 55200, epf: 11040, professionalTax: 200, tds: 16410,
  paymentDate: '31 Oct 2026', status: 'Paid'
};
