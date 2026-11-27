// src/data/employee.js
// Complete sample data for HRMS Employee Dashboard matching Aarav Mehta / Priya Nair hierarchy.

export const INITIAL_EMPLOYEE = {
  id: 'EMP-1187',
  name: 'Lokesh Kumar',
  preferredName: 'Lokesh',
  role: 'EMPLOYEE',
  designation: 'Frontend Developer',
  department: 'Engineering',
  location: 'Hyderabad',
  workLocation: 'HITEC City Campus, Tower B, Level 4',
  employmentType: 'Full-time Permanent',
  probationStatus: 'Confirmed',
  joiningDate: '2023-01-03',
  workEmail: 'aarav.mehta@company.in',
  personalEmail: 'aarav.mehta.dev@gmail.com',
  mobile: '+91 98765 11223',
  gender: 'Male',
  bloodGroup: 'O+',
  maritalStatus: 'Single',
  currentAddress: 'Flat 402, Cyber Heights, HITEC City, Hyderabad',
  permanentAddress: 'Flat 402, Cyber Heights, HITEC City, Hyderabad',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500081',
  shift: 'General (9:30 AM – 6:30 PM)',
  reportingManager: {
    name: 'Priya Nair',
    designation: 'Engineering Manager',
    email: 'priya.nair@company.in',
    avatar: null
  },
  emergencyContacts: [
    {
      name: 'Sunita Mehta',
      relation: 'Mother',
      phone: '+91 98765 44321',
      address: 'Hyderabad'
    },
    {
      name: 'Rajesh Mehta',
      relation: 'Father',
      phone: '+91 98765 44322',
      address: 'Hyderabad'
    }
  ],
  activity: [
    { id: 'act-1', action: 'Signed in from Chrome on macOS', time: '6 Nov 2026, 09:28 AM', ip: '10.240.12.84' },
    { id: 'act-2', action: 'Applied for Casual Leave (12 Nov 2026)', time: '5 Nov 2026, 04:15 PM', ip: '10.240.12.84' },
    { id: 'act-3', action: 'Uploaded Degree Certificate', time: '2 Nov 2026, 11:30 AM', ip: '10.240.12.84' },
    { id: 'act-4', action: 'Updated Emergency Contact phone', time: '28 Oct 2026, 02:40 PM', ip: '10.240.12.84' }
  ]
};

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Diwali Holiday Schedule & Office Timings',
    date: '4 Nov 2026',
    category: 'HR announcement',
    isImportant: true,
    requiresAck: true,
    content: 'Office will remain closed on 9 Nov 2026 for Diwali. Optional holidays are available on 10 Nov and 11 Nov upon prior submission on the Holiday portal.',
    isRead: false,
    acknowledged: false
  },
  {
    id: 'ann-2',
    title: 'Annual Tech Hackathon 2026 Registrations Open',
    date: '2 Nov 2026',
    category: 'Engineering',
    isImportant: false,
    requiresAck: false,
    content: 'Form teams of up to 4 to build AI-augmented developer tooling. Submissions close on 18 Nov.',
    isRead: false,
    acknowledged: false
  },
  {
    id: 'ann-3',
    title: 'Health & Wellness Benefit Window Closes Nov 15',
    date: '29 Oct 2026',
    category: 'Benefits',
    isImportant: true,
    requiresAck: false,
    content: 'Submit your gym, mental wellness, or sports membership receipts before 15 Nov for Q3 reimbursement processing.',
    isRead: true,
    acknowledged: false
  }
];

export const INITIAL_HOLIDAYS = [
  {
    id: 'hol-1',
    date: '2026-11-09',
    day: 'Monday',
    name: 'Diwali',
    festivalName: 'Diwali',
    festival: 'Diwali / Deepavali (Festival of Lights)',
    category: 'Major Festival',
    description: 'Victory of light over darkness and good over evil, celebrated with lamps, sweets, and fireworks.',
    type: 'Company',
    daysRemaining: 3
  },
  {
    id: 'hol-2',
    date: '2026-11-10',
    day: 'Tuesday',
    name: 'Govardhan Puja (Optional)',
    festivalName: 'Govardhan Puja',
    festival: 'Govardhan Puja & Annakut Utsav',
    category: 'Cultural Festival',
    description: 'Commemorates Lord Krishna lifting the Govardhan Hill to protect villagers and nature.',
    type: 'Optional',
    daysRemaining: 4
  },
  {
    id: 'hol-3',
    date: '2026-11-11',
    day: 'Wednesday',
    name: 'Bhai Dooj (Optional)',
    festivalName: 'Bhai Dooj',
    festival: 'Bhai Dooj / Yama Dwitiya',
    category: 'Family Festival',
    description: 'Sacred festival celebrating the bond of protection and affection between siblings.',
    type: 'Optional',
    daysRemaining: 5
  },
  {
    id: 'hol-9',
    date: '2026-11-24',
    day: 'Tuesday',
    name: 'Guru Nanak Jayanti (Optional)',
    festivalName: 'Guru Nanak Jayanti',
    festival: 'Guru Nanak Gurpurab (Prakash Utsav)',
    category: 'Spiritual Festival',
    description: 'Birth anniversary celebration of Guru Nanak Dev Ji, marked with hymns, prayers, and langar.',
    type: 'Optional',
    daysRemaining: 18
  },
  {
    id: 'hol-4',
    date: '2026-12-25',
    day: 'Friday',
    name: 'Christmas Day',
    festivalName: 'Christmas',
    festival: 'Christmas (Nativity Celebration)',
    category: 'Global Festival',
    description: 'Worldwide celebration of peace and generosity commemorating the birth of Jesus Christ.',
    type: 'Public',
    daysRemaining: 49
  },
  {
    id: 'hol-5',
    date: '2027-01-01',
    day: 'Friday',
    name: 'New Year Day (Optional)',
    festivalName: 'New Year Day',
    festival: 'New Year 2027 Celebration',
    category: 'Global Holiday',
    description: 'Welcoming the new calendar year with fresh resolutions and celebrations.',
    type: 'Optional',
    daysRemaining: 56
  },
  {
    id: 'hol-6',
    date: '2027-01-14',
    day: 'Thursday',
    name: 'Makar Sankranti / Pongal',
    festivalName: 'Makar Sankranti / Pongal',
    festival: 'Makar Sankranti & Pongal (Harvest Festival)',
    category: 'Harvest Festival',
    description: 'Harvest thanksgiving to the Sun God celebrated across India with regional customs and kite-flying.',
    type: 'Company',
    daysRemaining: 69
  },
  {
    id: 'hol-7',
    date: '2027-01-26',
    day: 'Tuesday',
    name: 'Republic Day',
    festivalName: 'Republic Day',
    festival: 'Republic Day of India',
    category: 'National Festival',
    description: 'Commemorating the enactment of the Constitution of India in 1950.',
    type: 'Public',
    daysRemaining: 81
  },
  {
    id: 'hol-10',
    date: '2027-02-15',
    day: 'Monday',
    name: 'Maha Shivratri (Optional)',
    festivalName: 'Maha Shivratri',
    festival: 'Maha Shivratri (Great Night of Shiva)',
    category: 'Spiritual Festival',
    description: 'Solemn festival observing devotion, meditation, and overcoming darkness and ignorance.',
    type: 'Optional',
    daysRemaining: 101
  },
  {
    id: 'hol-8',
    date: '2027-03-24',
    day: 'Wednesday',
    name: 'Holi',
    festivalName: 'Holi',
    festival: 'Holi (Festival of Colors & Spring)',
    category: 'Spring Festival',
    description: 'Joyful festival welcoming the arrival of spring and victory of good with vibrant colored powders.',
    type: 'Public',
    daysRemaining: 138
  },
  {
    id: 'hol-11',
    date: '2026-10-20',
    day: 'Tuesday',
    name: 'Dussehra / Vijayadashami',
    festivalName: 'Dussehra',
    festival: 'Vijayadashami / Dussehra',
    category: 'Major Festival',
    description: 'Celebrating the victory of righteousness over unrighteousness with effigies and cultural plays.',
    type: 'Public',
    daysRemaining: -17
  },
  {
    id: 'hol-12',
    date: '2026-10-02',
    day: 'Friday',
    name: 'Mahatma Gandhi Jayanti',
    festivalName: 'Gandhi Jayanti',
    festival: 'Mahatma Gandhi Jayanti (Non-Violence Day)',
    category: 'National Festival',
    description: 'Tribute to Mahatma Gandhi and the philosophy of non-violence and peace.',
    type: 'Public',
    daysRemaining: -35
  }
];

export const INITIAL_OPTIONAL_PICKS = ['hol-2']; // 1 of 2 picked so far

export const INITIAL_LEAVE_BALANCES = {
  casual: { total: 12, used: 4, pending: 1, available: 7 },
  sick: { total: 10, used: 2, pending: 0, available: 8 },
  earned: { total: 18, used: 6, pending: 0, available: 12 },
  compoff: { total: 2, used: 0, pending: 0, available: 2 },
  unpaid: { total: 0, used: 0, pending: 0, available: 0 }
};

export const INITIAL_LEAVE_REQUESTS = [
  {
    id: 'LR-2026-089',
    type: 'Casual Leave',
    fromDate: '2026-11-12',
    toDate: '2026-11-12',
    days: 1,
    isHalfDay: false,
    appliedOn: '2026-11-05',
    status: 'Pending',
    reason: 'Family function in hometown. Reaching on Wednesday evening.',
    contact: '+91 98765 11223',
    approver: 'Priya Nair',
    approverComment: 'Review pending',
    timeline: [
      { step: 'Applied', date: '5 Nov 2026, 04:15 PM', status: 'done' },
      { step: 'Manager review', date: 'In progress', status: 'active' },
      { step: 'Decision', date: 'Pending', status: 'waiting' }
    ]
  },
  {
    id: 'LR-2026-074',
    type: 'Earned Leave',
    fromDate: '2026-10-14',
    toDate: '2026-10-16',
    days: 3,
    isHalfDay: false,
    appliedOn: '2026-10-05',
    status: 'Approved',
    reason: 'Personal vacation trip to Goa.',
    contact: '+91 98765 11223',
    approver: 'Priya Nair',
    approverComment: 'Approved. Enjoy the break!',
    timeline: [
      { step: 'Applied', date: '5 Oct 2026, 10:20 AM', status: 'done' },
      { step: 'Manager review', date: '5 Oct 2026, 02:30 PM', status: 'done' },
      { step: 'Approved', date: '5 Oct 2026, 02:30 PM', status: 'done' }
    ]
  },
  {
    id: 'LR-2026-061',
    type: 'Sick Leave',
    fromDate: '2026-09-22',
    toDate: '2026-09-23',
    days: 2,
    isHalfDay: false,
    appliedOn: '2026-09-22',
    status: 'Approved',
    reason: 'Viral fever and doctor-advised rest.',
    contact: '+91 98765 11223',
    approver: 'Priya Nair',
    approverComment: 'Take care and recover well.',
    timeline: [
      { step: 'Applied', date: '22 Sep 2026, 08:45 AM', status: 'done' },
      { step: 'Approved', date: '22 Sep 2026, 10:00 AM', status: 'done' }
    ]
  }
];

export const INITIAL_TASKS = [
  {
    id: 'TSK-101',
    title: 'Implement WCAG 2.1 AA audit fixes for glass modals',
    description: 'Ensure focus trap, ARIA attributes, and keyboard Escape listener are working correctly across all studio drawers and dialogs.',
    assignedBy: { name: 'Priya Nair', role: 'Engineering Manager' },
    priority: 'High',
    status: 'In progress', // To do, In progress, In review, Done
    progress: 75,
    dueDate: '2026-11-07', // Due tomorrow (warn)
    dueNote: 'Due tomorrow',
    checklist: [
      { text: 'Add focus trap to Drawer.jsx', done: true },
      { text: 'Verify aria-current on active rail item', done: true },
      { text: 'Check contrast ratio on bad status pill', done: true },
      { text: 'Document accessibility checklist in report', done: false }
    ],
    timeLogs: [
      { id: 'tl-1', hours: 3.5, date: '5 Nov 2026', note: 'Created modal trap harness' },
      { id: 'tl-2', hours: 2.5, date: '6 Nov 2026', note: 'Tested Esc handlers' }
    ],
    comments: [
      { id: 'c-1', user: 'Priya Nair', time: '5 Nov 2026, 05:00 PM', text: 'Please ensure screen readers pronounce live updates correctly.' },
      { id: 'c-2', user: 'Aarav Mehta', time: '6 Nov 2026, 10:15 AM', text: 'Added aria-live="polite" restricted to minute boundaries.' }
    ]
  },
  {
    id: 'TSK-102',
    title: 'Refactor Employee Attendance engine and edge case tests',
    description: 'Implement pure evaluateDay pure function covering 10+ cases including mandatory break deductions and late grace rules.',
    assignedBy: { name: 'Priya Nair', role: 'Engineering Manager' },
    priority: 'High',
    status: 'In review',
    progress: 100,
    dueDate: '2026-11-06',
    dueNote: 'Due today',
    checklist: [
      { text: 'Write evaluateDay pure algorithm', done: true },
      { text: 'Verify 15-min grace period logic', done: true },
      { text: 'Create automated test runner', done: true }
    ],
    timeLogs: [
      { id: 'tl-3', hours: 5.0, date: '4 Nov 2026', note: 'Engine core logic' }
    ],
    comments: []
  },
  {
    id: 'TSK-103',
    title: 'P95 API latency optimization support with backend team',
    description: 'Collaborate with Karthik to verify payload compression and caching headers on large payroll roster responses.',
    assignedBy: { name: 'Priya Nair', role: 'Engineering Manager' },
    priority: 'Medium',
    status: 'In progress',
    progress: 40,
    dueDate: '2026-11-10',
    dueNote: 'Due in 4 days',
    checklist: [
      { text: 'Profile client-side JSON parse time', done: true },
      { text: 'Implement table virtualization on documents', done: false }
    ],
    timeLogs: [],
    comments: []
  },
  {
    id: 'TSK-104',
    title: 'Monsoon Glass token migration audit for Mobile viewports',
    description: 'Ensure column stacking and card padding scale down to 12px smoothly without horizontal overflow at 400px width.',
    assignedBy: { name: 'Priya Nair', role: 'Engineering Manager' },
    priority: 'Urgent',
    status: 'In progress',
    progress: 60,
    dueDate: '2026-11-08',
    dueNote: 'Due in 2 days',
    checklist: [
      { text: 'Test 400px viewport wrapping', done: true },
      { text: 'Check table card horizontal scroll containment', done: false }
    ],
    timeLogs: [],
    comments: []
  },
  {
    id: 'TSK-105',
    title: 'Q3 Self-Review submission and competency scorecard',
    description: 'Submit detailed assessment of key deliverables, challenge areas, and training plans for FY26-27 Q3.',
    assignedBy: { name: 'HR Department', role: 'Talent Team' },
    priority: 'High',
    status: 'To do',
    progress: 15,
    dueDate: '2026-11-20',
    dueNote: 'Due 20 Nov 2026',
    checklist: [
      { text: 'Draft delivery and quality notes', done: true },
      { text: 'Rate 6 core competencies', done: false },
      { text: 'Submit to Priya for review', done: false }
    ],
    timeLogs: [],
    comments: []
  },
  {
    id: 'TSK-106',
    title: 'Update emergency contacts and Permanent address proof',
    description: 'HR compliance refresh requires renewed residency verification document before end of quarter.',
    assignedBy: { name: 'HR Operations', role: 'HR Desk' },
    priority: 'Low',
    status: 'Done',
    progress: 100,
    dueDate: '2026-11-03',
    dueNote: 'Completed',
    checklist: [
      { text: 'Scan electricity bill', done: true },
      { text: 'Upload to Documents portal', done: true }
    ],
    timeLogs: [],
    comments: []
  }
];

export const INITIAL_ATTENDANCE_TODAY = {
  date: '2026-11-06',
  checkIn: null,
  checkOut: null,
  workMode: 'Office',
  workModeNote: '',
  inProgress: false,
  checkInLocation: null,
  checkOutLocation: null,
  breaks: []
};

export const INITIAL_ATTENDANCE_HISTORY = [
  {
    date: '2026-11-05',
    checkIn: '09:25:02',
    checkOut: '18:32:45',
    breaks: [{ type: 'Lunch', start: '13:01:12', end: '14:01:28', duration: 60, durationSeconds: 3616 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4436,
      longitude: 78.3771,
      accuracy: 10,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 28,
      capturedAt: '2026-11-05T09:25:02.000Z'
    },
    checkOutLocation: {
      latitude: 17.4434,
      longitude: 78.3773,
      accuracy: 14,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 35,
      capturedAt: '2026-11-05T18:32:45.000Z'
    }
  },
  {
    date: '2026-11-04',
    checkIn: '09:30:11',
    checkOut: '18:35:20',
    breaks: [{ type: 'Lunch', start: '13:02:05', end: '14:00:45', duration: 59, durationSeconds: 3520 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4439,
      longitude: 78.3775,
      accuracy: 9,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 55,
      capturedAt: '2026-11-04T09:30:11.000Z'
    },
    checkOutLocation: {
      latitude: 17.4435,
      longitude: 78.3772,
      accuracy: 11,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 15,
      capturedAt: '2026-11-04T18:35:20.000Z'
    }
  },
  {
    date: '2026-11-03',
    checkIn: '09:52:40',
    checkOut: '18:55:05',
    breaks: [{ type: 'Lunch', start: '13:15:30', end: '14:15:18', duration: 60, durationSeconds: 3588 }],
    workMode: 'Work from home',
    type: 'work',
    checkInLocation: {
      latitude: 17.4612,
      longitude: 78.3582,
      accuracy: 25,
      address: 'Kondapur Residential Cluster, Hyderabad (WFH)',
      inGeofence: false,
      distanceMeters: 2840,
      capturedAt: '2026-11-03T09:52:40.000Z'
    },
    checkOutLocation: {
      latitude: 17.4611,
      longitude: 78.3583,
      accuracy: 20,
      address: 'Kondapur Residential Cluster, Hyderabad (WFH)',
      inGeofence: false,
      distanceMeters: 2835,
      capturedAt: '2026-11-03T18:55:05.000Z'
    }
  }, // Late mark 1 of 3
  {
    date: '2026-11-02',
    checkIn: '09:20:19',
    checkOut: '18:30:42',
    breaks: [{ type: 'Lunch', start: '13:00:10', end: '14:00:25', duration: 60, durationSeconds: 3615 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4437,
      longitude: 78.3772,
      accuracy: 8,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 22,
      capturedAt: '2026-11-02T09:20:19.000Z'
    },
    checkOutLocation: {
      latitude: 17.4435,
      longitude: 78.3771,
      accuracy: 12,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 18,
      capturedAt: '2026-11-02T18:30:42.000Z'
    }
  },
  { date: '2026-11-01', checkIn: null, checkOut: null, breaks: [], workMode: 'Office', type: 'weekly_off' }, // Sunday
  { date: '2026-10-31', checkIn: null, checkOut: null, breaks: [], workMode: 'Office', type: 'weekly_off' }, // Saturday
  {
    date: '2026-10-30',
    checkIn: '09:24:08',
    checkOut: '18:30:51',
    breaks: [{ type: 'Lunch', start: '13:00:00', end: '14:00:12', duration: 60, durationSeconds: 3612 }],
    workMode: 'Remote',
    type: 'work',
    checkInLocation: {
      latitude: 17.4401,
      longitude: 78.3489,
      accuracy: 16,
      address: 'Gachibowli Client Hub, Hyderabad (Remote)',
      inGeofence: false,
      distanceMeters: 3025,
      capturedAt: '2026-10-30T09:24:08.000Z'
    },
    checkOutLocation: {
      latitude: 17.4404,
      longitude: 78.3493,
      accuracy: 18,
      address: 'Gachibowli Client Hub, Hyderabad (Remote)',
      inGeofence: false,
      distanceMeters: 2980,
      capturedAt: '2026-10-30T18:30:51.000Z'
    }
  },
  {
    date: '2026-10-29',
    checkIn: '09:18:33',
    checkOut: '18:25:19',
    breaks: [{ type: 'Lunch', start: '13:02:14', end: '14:01:40', duration: 59, durationSeconds: 3566 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4437,
      longitude: 78.3773,
      accuracy: 9,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 25,
      capturedAt: '2026-10-29T09:18:33.000Z'
    },
    checkOutLocation: {
      latitude: 17.4434,
      longitude: 78.3771,
      accuracy: 11,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 15,
      capturedAt: '2026-10-29T18:25:19.000Z'
    }
  },
  {
    date: '2026-10-28',
    checkIn: '09:30:04',
    checkOut: '18:30:27',
    breaks: [{ type: 'Lunch', start: '13:00:05', end: '14:00:18', duration: 60, durationSeconds: 3613 }],
    workMode: 'Work from home',
    type: 'work',
    checkInLocation: {
      latitude: 17.4614,
      longitude: 78.3585,
      accuracy: 22,
      address: 'Kondapur Residential Cluster, Hyderabad (WFH)',
      inGeofence: false,
      distanceMeters: 2815,
      capturedAt: '2026-10-28T09:30:04.000Z'
    },
    checkOutLocation: {
      latitude: 17.4612,
      longitude: 78.3583,
      accuracy: 20,
      address: 'Kondapur Residential Cluster, Hyderabad (WFH)',
      inGeofence: false,
      distanceMeters: 2825,
      capturedAt: '2026-10-28T18:30:27.000Z'
    }
  },
  {
    date: '2026-10-27',
    checkIn: '09:25:47',
    checkOut: '18:35:12',
    breaks: [{ type: 'Lunch', start: '13:03:20', end: '14:02:10', duration: 59, durationSeconds: 3530 }],
    workMode: 'Remote',
    type: 'work',
    checkInLocation: {
      latitude: 17.4326,
      longitude: 78.4071,
      accuracy: 19,
      address: 'Jubilee Hills Road No. 36, Hyderabad (Remote)',
      inGeofence: false,
      distanceMeters: 3395,
      capturedAt: '2026-10-27T09:25:47.000Z'
    },
    checkOutLocation: {
      latitude: 17.4329,
      longitude: 78.4068,
      accuracy: 21,
      address: 'Jubilee Hills Road No. 36, Hyderabad (Remote)',
      inGeofence: false,
      distanceMeters: 3355,
      capturedAt: '2026-10-27T18:35:12.000Z'
    }
  },
  {
    date: '2026-10-26',
    checkIn: '09:29:15',
    checkOut: '18:30:09',
    breaks: [{ type: 'Lunch', start: '13:00:45', end: '14:00:50', duration: 60, durationSeconds: 3605 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4436,
      longitude: 78.3774,
      accuracy: 10,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 24,
      capturedAt: '2026-10-26T09:29:15.000Z'
    },
    checkOutLocation: {
      latitude: 17.4435,
      longitude: 78.3770,
      accuracy: 12,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 21,
      capturedAt: '2026-10-26T18:30:09.000Z'
    }
  },
  { date: '2026-10-25', checkIn: null, checkOut: null, breaks: [], workMode: 'Office', type: 'weekly_off' },
  { date: '2026-10-24', checkIn: null, checkOut: null, breaks: [], workMode: 'Office', type: 'weekly_off' },
  {
    date: '2026-10-23',
    checkIn: '09:22:31',
    checkOut: '18:30:44',
    breaks: [{ type: 'Lunch', start: '13:01:10', end: '14:00:55', duration: 60, durationSeconds: 3585 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4438,
      longitude: 78.3771,
      accuracy: 9,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 35,
      capturedAt: '2026-10-23T09:22:31.000Z'
    },
    checkOutLocation: {
      latitude: 17.4436,
      longitude: 78.3772,
      accuracy: 11,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 11,
      capturedAt: '2026-10-23T18:30:44.000Z'
    }
  },
  {
    date: '2026-10-22',
    checkIn: '09:30:52',
    checkOut: '18:40:16',
    breaks: [{ type: 'Lunch', start: '13:04:00', end: '14:03:25', duration: 59, durationSeconds: 3565 }],
    workMode: 'Work from home',
    type: 'work',
    checkInLocation: {
      latitude: 17.4610,
      longitude: 78.3581,
      accuracy: 24,
      address: 'Kondapur Residential Cluster, Hyderabad (WFH)',
      inGeofence: false,
      distanceMeters: 2845,
      capturedAt: '2026-10-22T09:30:52.000Z'
    },
    checkOutLocation: {
      latitude: 17.4612,
      longitude: 78.3584,
      accuracy: 19,
      address: 'Kondapur Residential Cluster, Hyderabad (WFH)',
      inGeofence: false,
      distanceMeters: 2805,
      capturedAt: '2026-10-22T18:40:16.000Z'
    }
  },
  {
    date: '2026-10-21',
    checkIn: '09:28:18',
    checkOut: '18:30:33',
    breaks: [{ type: 'Lunch', start: '13:00:12', end: '14:00:08', duration: 60, durationSeconds: 3596 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4435,
      longitude: 78.3773,
      accuracy: 10,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 11,
      capturedAt: '2026-10-21T09:28:18.000Z'
    },
    checkOutLocation: {
      latitude: 17.4434,
      longitude: 78.3772,
      accuracy: 10,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 11,
      capturedAt: '2026-10-21T18:30:33.000Z'
    }
  },
  {
    date: '2026-10-20',
    checkIn: '09:35:29',
    checkOut: '18:45:07',
    breaks: [{ type: 'Lunch', start: '13:05:15', end: '14:04:40', duration: 59, durationSeconds: 3565 }],
    workMode: 'Remote',
    type: 'work',
    checkInLocation: {
      latitude: 17.4239,
      longitude: 78.4738,
      accuracy: 18,
      address: 'Begumpet Coworking Lounge, Hyderabad (Remote)',
      inGeofence: false,
      distanceMeters: 10490,
      capturedAt: '2026-10-20T09:35:29.000Z'
    },
    checkOutLocation: {
      latitude: 17.4241,
      longitude: 78.4735,
      accuracy: 15,
      address: 'Begumpet Coworking Lounge, Hyderabad (Remote)',
      inGeofence: false,
      distanceMeters: 10455,
      capturedAt: '2026-10-20T18:45:07.000Z'
    }
  },
  {
    date: '2026-10-19',
    checkIn: '09:25:10',
    checkOut: '18:30:22',
    breaks: [{ type: 'Lunch', start: '13:00:00', end: '14:00:00', duration: 60, durationSeconds: 3600 }],
    workMode: 'Office',
    type: 'work',
    checkInLocation: {
      latitude: 17.4437,
      longitude: 78.3771,
      accuracy: 8,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 24,
      capturedAt: '2026-10-19T09:25:10.000Z'
    },
    checkOutLocation: {
      latitude: 17.4436,
      longitude: 78.3773,
      accuracy: 10,
      address: 'HITEC City Campus, Tower B, Hyderabad',
      inGeofence: true,
      distanceMeters: 15,
      capturedAt: '2026-10-19T18:30:22.000Z'
    }
  },
  { date: '2026-10-16', checkIn: null, checkOut: null, breaks: [], type: 'leave', leaveType: 'Earned Leave' },
  { date: '2026-10-15', checkIn: null, checkOut: null, breaks: [], type: 'leave', leaveType: 'Earned Leave' },
  { date: '2026-10-14', checkIn: null, checkOut: null, breaks: [], type: 'leave', leaveType: 'Earned Leave' }
];

export const INITIAL_REGULARISATIONS = [
  {
    id: 'REG-2026-041',
    date: '2026-10-12',
    issueType: 'Biometric Scanner Failure',
    correctedCheckIn: '09:30:00',
    correctedCheckOut: '18:30:00',
    reason: 'Scanner at North turnstile was unresponsive. Reported to Facilities IT ticket IT-4402.',
    status: 'Approved',
    appliedOn: '2026-10-13',
    approver: 'Priya Nair',
    approverComment: 'Verified with security desk logs. Approved.'
  }
];

export const INITIAL_PAYROLL = {
  monthlyGross: 85000,
  monthlyNet: 75420,
  annualCTC: 1020000,
  earnings: [
    { label: 'Basic Salary', amount: 34000, percentage: 40 },
    { label: 'House Rent Allowance (HRA)', amount: 17000, percentage: 20 },
    { label: 'Special Allowance', amount: 28900, percentage: 34 },
    { label: 'Statutory Conveyance / Medical', amount: 5100, percentage: 6 }
  ],
  deductions: [
    { label: 'Provident Fund (PF - Employee)', amount: 4080, note: 'Configurable example, to be validated' },
    { label: 'Professional Tax (PT - Telangana)', amount: 200, note: 'Configurable example, to be validated' },
    { label: 'Income Tax (TDS)', amount: 5300, note: 'Configurable example, to be validated' }
  ],
  bankAccountMasked: '•••• •••• 4892 (HDFC Bank)',
  panMasked: '••••••442K',
  taxDeclarationStatus: 'Submitted',
  ytdEarnings: {
    grossYTD: 595000,
    netYTD: 527940,
    taxDeductedYTD: 37100,
    pfContributedYTD: 28560
  },
  slips: [
    { id: 'PAY-2026-10', month: 'October 2026', period: '01 Oct 2026 – 31 Oct 2026', paidDate: '31 Oct 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-09', month: 'September 2026', period: '01 Sep 2026 – 30 Sep 2026', paidDate: '30 Sep 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-08', month: 'August 2026', period: '01 Aug 2026 – 31 Aug 2026', paidDate: '31 Aug 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-07', month: 'July 2026', period: '01 Jul 2026 – 31 Jul 2026', paidDate: '31 Jul 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-06', month: 'June 2026', period: '01 Jun 2026 – 30 Jun 2026', paidDate: '30 Jun 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-05', month: 'May 2026', period: '01 May 2026 – 31 May 2026', paidDate: '31 May 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-04', month: 'April 2026', period: '01 Apr 2026 – 30 Apr 2026', paidDate: '30 Apr 2026', gross: 85000, net: 75420, status: 'Paid', fy: '2026–27' },
    { id: 'PAY-2026-03', month: 'March 2026', period: '01 Mar 2026 – 31 Mar 2026', paidDate: '31 Mar 2026', gross: 80000, net: 71200, status: 'Paid', fy: '2025–26' },
    { id: 'PAY-2026-02', month: 'February 2026', period: '01 Feb 2026 – 28 Feb 2026', paidDate: '28 Feb 2026', gross: 80000, net: 71200, status: 'Paid', fy: '2025–26' },
    { id: 'PAY-2026-01', month: 'January 2026', period: '01 Jan 2026 – 31 Jan 2026', paidDate: '31 Jan 2026', gross: 80000, net: 71200, status: 'Paid', fy: '2025–26' }
  ],
  reimbursements: [
    { id: 'RMB-101', category: 'Internet & Broadband', amount: 1500, date: '28 Oct 2026', status: 'Approved', paidWith: 'Oct 2026 Payroll' },
    { id: 'RMB-102', category: 'Books & Subscriptions', amount: 2200, date: '15 Oct 2026', status: 'Approved', paidWith: 'Oct 2026 Payroll' }
  ]
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Diwali Holiday Schedule & Office Timings',
    detail: 'Office will be closed on 9 Nov 2026 for Diwali. Optional holidays are available on 10 & 11 Nov.',
    time: '2 hours ago',
    group: 'Today',
    category: 'HR announcement',
    isRead: false,
    requiresAck: true,
    link: '/employee/holidays'
  },
  {
    id: 'notif-2',
    title: 'Payslip for October 2026 is ready',
    detail: 'Net salary of ₹75,420 has been credited to HDFC bank account ending in 4892.',
    time: 'Yesterday',
    group: 'Yesterday',
    category: 'Payroll',
    isRead: false,
    link: '/employee/documents'
  },
  {
    id: 'notif-3',
    title: 'Leave request approved by Priya Nair',
    detail: 'Your Earned Leave request for 14 Oct – 16 Oct (3 days) has been approved.',
    time: '3 days ago',
    group: 'Earlier this week',
    category: 'Approval update',
    isRead: true,
    link: '/employee/leave'
  },
  {
    id: 'notif-4',
    title: 'Regularisation REG-2026-041 Approved',
    detail: 'Biometric punch discrepancy on 12 Oct was reviewed and regularised by Priya Nair.',
    time: '4 days ago',
    group: 'Earlier this week',
    category: 'Approval update',
    isRead: true,
    link: '/employee/attendance'
  },
  {
    id: 'notif-5',
    title: 'Task due tomorrow',
    detail: '"Implement WCAG 2.1 AA audit fixes for glass modals" deadline is 7 Nov 2026.',
    time: '5 days ago',
    group: 'Earlier this week',
    category: 'Reminders',
    isRead: false,
    link: '/employee/tasks'
  },
  {
    id: 'notif-6',
    title: 'Q3 Self-Review assessment due in 14 days',
    detail: 'Complete your performance self-evaluation before 20 Nov 2026.',
    time: '6 days ago',
    group: 'Earlier this week',
    category: 'Reminders',
    isRead: false,
    link: '/employee/performance?tab=reviews'
  },
  {
    id: 'notif-7',
    title: 'Degree Certificate verified by HR',
    detail: 'Your uploaded B.Tech graduation document has been verified by HR Operations.',
    time: '1 week ago',
    group: 'Earlier this week',
    category: 'Documents',
    isRead: true,
    link: '/employee/documents'
  },
  {
    id: 'notif-8',
    title: 'Help ticket HRQ-2026-0142 updated',
    detail: 'HR agent Kavita Sharma replied: "Tax declaration portal window has been extended."',
    time: '1 week ago',
    group: 'Earlier this week',
    category: 'Help & Support',
    isRead: true,
    link: '/employee/support'
  }
];

export const INITIAL_SHIFTS = {
  current: {
    name: 'General Shift',
    code: 'GEN',
    timings: '9:30 AM – 6:30 PM',
    breakWindow: '1:00 PM – 2:00 PM (60 min)',
    gracePeriod: '15 minutes (until 9:45 AM)',
    weeklyOff: 'Saturday & Sunday',
    workLocation: 'HITEC City Campus, Tower B',
    nextShiftChange: 'No upcoming shift schedule change'
  },
  roster: [
    { day: 'Mon', date: '02 Nov', shift: 'General', hours: '9:30 AM – 6:30 PM', status: 'Present' },
    { day: 'Tue', date: '03 Nov', shift: 'General', hours: '9:30 AM – 6:30 PM', status: 'Present (WFH)' },
    { day: 'Wed', date: '04 Nov', shift: 'General', hours: '9:30 AM – 6:30 PM', status: 'Present' },
    { day: 'Thu', date: '05 Nov', shift: 'General', hours: '9:30 AM – 6:30 PM', status: 'Present' },
    { day: 'Fri', date: '06 Nov', shift: 'General', hours: '9:30 AM – 6:30 PM', status: 'Today (In Office)' },
    { day: 'Sat', date: '07 Nov', shift: 'Weekly Off', hours: '--', status: 'Off' },
    { day: 'Sun', date: '08 Nov', shift: 'Weekly Off', hours: '--', status: 'Off' }
  ],
  swapRequests: [
    {
      id: 'SWP-2026-012',
      date: '2026-11-18',
      requestedShift: 'Morning Shift (8:00 AM – 5:00 PM)',
      swapWith: 'Rahul Verma (QA Lead)',
      reason: 'Doctor appointment scheduled for evening.',
      status: 'Pending',
      appliedOn: '2026-11-05'
    }
  ]
};

export const INITIAL_PERFORMANCE = {
  summary: {
    completionRate: 72,
    openGoals: 4,
    feedbackCount: 6,
    nextReviewDate: '20 Nov 2026'
  },
  goals: [
    {
      id: 'G-1',
      title: 'Pass WCAG 2.1 AA audit across design system components',
      type: 'Engineering OKR',
      weight: 30,
      progress: 85,
      dueDate: '2026-11-15',
      status: 'On track',
      keyResults: 'Ensure 100% drawer focus management and AA contrast scores'
    },
    {
      id: 'G-2',
      title: 'Ship Self-Service Leave V2 interactive calendar',
      type: 'Product OKR',
      weight: 30,
      progress: 72,
      dueDate: '2026-11-30',
      status: 'On track',
      keyResults: 'Deliver live balance computation, holiday exclusion, and team overlap tags'
    },
    {
      id: 'G-3',
      title: 'P95 API latency frontend state caching layer',
      type: 'Performance OKR',
      weight: 20,
      progress: 58,
      dueDate: '2026-12-15',
      status: 'At risk',
      keyResults: 'Implement cache-first client store with background sync'
    },
    {
      id: 'G-4',
      title: 'Complete Advanced React Architecture & Accessibility Certification',
      type: 'Learning Goal',
      weight: 20,
      progress: 40,
      dueDate: '2027-01-10',
      status: 'In progress',
      keyResults: 'Complete 3 capstone projects and pass official audit exam'
    }
  ],
  feedback: [
    {
      id: 'fb-1',
      giver: 'Priya Nair',
      giverRole: 'Engineering Manager',
      date: '3 Nov 2026',
      type: 'Appreciation',
      content: 'Aarav showed tremendous ownership resolving biometric regularisation UI edge cases ahead of sprint demo. The team appreciated the thorough testing.'
    },
    {
      id: 'fb-2',
      giver: 'Karthik Reddy',
      giverRole: 'Backend Engineer',
      date: '28 Oct 2026',
      type: 'Coaching',
      content: 'Great collaboration during the API contract refactor. For the upcoming sync, let us align on GraphQL cache fragments even earlier.'
    },
    {
      id: 'fb-3',
      giver: 'Divya Menon',
      giverRole: 'UI Designer',
      date: '19 Oct 2026',
      type: 'Appreciation',
      content: 'Pixel-perfect adherence to Monsoon Glass specifications. The frosted card blurs and typography hierarchy are top notch!'
    }
  ],
  reviewCycle: {
    title: 'Q3 FY2026–27 Performance Cycle',
    currentStep: 'Self review', // 'Self review' -> 'Manager review' -> 'Calibration' -> 'Published'
    dueDate: '20 Nov 2026',
    competencies: [
      { id: 'c1', name: 'Delivery', rating: 4, notes: 'Consistently hit sprint commitments with zero high-severity escape bugs.' },
      { id: 'c2', name: 'Quality', rating: 5, notes: 'Maintained 95%+ unit test coverage on frontend state utilities.' },
      { id: 'c3', name: 'Ownership', rating: 4, notes: 'Proactively picked up design system accessibility remediation.' },
      { id: 'c4', name: 'Collaboration', rating: 4, notes: 'Effective pairing with QA and backend teams.' },
      { id: 'c5', name: 'Communication', rating: 4, notes: 'Clear daily async updates and concise PR documentation.' },
      { id: 'c6', name: 'Continuous Learning', rating: 5, notes: 'Completed TypeScript advanced patterns and WAI-ARIA guidelines.' }
    ],
    achievements: 'Led the UI build for the employee self-service portal in the Monsoon Glass design language.',
    challenges: 'Coordinating complex multi-rule attendance edge cases across legacy database constraints.',
    developmentGoals: 'Deepen knowledge of Web Performance APIs and large-scale design token tooling.'
  },
  history: [
    { cycle: 'Q2 FY26–27', rating: 4.4, goalsAchieved: 88, managerComment: 'Outstanding delivery on the core component library.' },
    { cycle: 'Q1 FY26–27', rating: 4.2, goalsAchieved: 84, managerComment: 'Solid performance and great mentoring of junior interns.' },
    { cycle: 'Q4 FY25–26', rating: 4.5, goalsAchieved: 92, managerComment: 'Exceeded expectations on frontend performance milestones.' },
    { cycle: 'Q3 FY25–26', rating: 4.1, goalsAchieved: 80, managerComment: 'Consistent engineering quality.' },
    { cycle: 'Q2 FY25–26', rating: 4.0, goalsAchieved: 78, managerComment: 'Good ramp-up on internal micro-frontends.' },
    { cycle: 'Q1 FY25–26', rating: 3.9, goalsAchieved: 75, managerComment: 'Successfully completed onboarding objectives.' }
  ],
  milestones: [
    { year: '2026', title: 'Promoted to Frontend Developer II', type: 'Promotion', note: 'Recognized for design system ownership' },
    { year: '2025', title: 'Spot Award for Q4 Zero Bug Sprint', type: 'Award', note: 'Awarded by VP of Engineering' },
    { year: '2023', title: 'Joined Company as Associate Frontend Developer', type: 'Milestone', note: 'Hyderabad Engineering Hub' }
  ]
};

export const INITIAL_DOCUMENTS = [
  { id: 'DOC-1', name: 'Aadhaar Card Copy.pdf', category: 'Identity', uploadedBy: 'Me', uploadDate: '2023-01-05', size: '1.4 MB', status: 'Verified', readOnly: false },
  { id: 'DOC-2', name: 'PAN Card Copy.pdf', category: 'Identity', uploadedBy: 'Me', uploadDate: '2023-01-05', size: '0.8 MB', status: 'Verified', readOnly: false },
  { id: 'DOC-3', name: 'Offer Letter & Employment Agreement.pdf', category: 'Employment', uploadedBy: 'HR', uploadDate: '2022-12-20', size: '2.1 MB', status: 'Verified', readOnly: true },
  { id: 'DOC-4', name: 'Appointment Letter - Aarav Mehta.pdf', category: 'Employment', uploadedBy: 'HR', uploadDate: '2023-01-03', size: '1.2 MB', status: 'Verified', readOnly: true },
  { id: 'DOC-5', name: 'B.Tech Degree Certificate & Transcripts.pdf', category: 'Education', uploadedBy: 'Me', uploadDate: '2026-11-02', size: '3.4 MB', status: 'Verified', readOnly: false },
  { id: 'DOC-6', name: 'Form 16 Part A & B (FY 2025–26).pdf', category: 'Payroll tax', uploadedBy: 'HR', uploadDate: '2026-06-15', size: '1.8 MB', status: 'Verified', readOnly: true },
  { id: 'DOC-7', name: 'Company Code of Conduct & Ethics Policy v3.pdf', category: 'Policies', uploadedBy: 'HR', uploadDate: '2026-04-01', size: '4.2 MB', status: 'Verified', readOnly: true }
];

export const INITIAL_TICKETS = [
  {
    id: 'HRQ-2026-0142',
    category: 'Payroll',
    subject: 'Query regarding Tax Deducted (TDS) under New Tax Regime',
    description: 'My October payslip reflects TDS deduction of ₹5,300. Would like to confirm if my standard deduction under Sec 87A was accounted for.',
    priority: 'Normal',
    status: 'In progress',
    created: '2026-11-02',
    lastUpdate: '2026-11-04',
    assignedTo: 'Kavita Sharma (Payroll Specialist)',
    slaResponse: 'Response within 4h',
    messages: [
      { id: 'm1', sender: 'Aarav Mehta', role: 'Employee', time: '2 Nov 2026, 11:20 AM', text: 'Hi Team, My October payslip reflects TDS deduction of ₹5,300. Could you please share the computation sheet?' },
      { id: 'm2', sender: 'Kavita Sharma', role: 'HR Payroll Specialist', time: '4 Nov 2026, 03:45 PM', text: 'Hello Aarav, We reviewed your declaration. Since tax slab adjustments are annualized across 12 months, the deduction was recalculated with the revised variable slab. Attaching the detailed breakdown sheet.' }
    ]
  },
  {
    id: 'HRQ-2026-0138',
    category: 'Attendance',
    subject: 'Biometric device synchronization discrepancy on 28 Oct',
    description: 'Biometric punch logged at 9:30 AM but showed on portal as 9:48 AM due to local gate network latency.',
    priority: 'Low',
    status: 'Resolved',
    created: '2026-10-29',
    lastUpdate: '2026-10-31',
    assignedTo: 'Facilities IT Desk',
    slaResponse: 'Resolved on time',
    rating: 5,
    messages: [
      { id: 'm3', sender: 'Aarav Mehta', role: 'Employee', time: '29 Oct 2026, 10:00 AM', text: 'Please check log at Gate 2 North.' },
      { id: 'm4', sender: 'Facilities IT Desk', role: 'IT Support', time: '31 Oct 2026, 04:10 PM', text: 'Discrepancy verified and corrected in server punch log. Regularisation credited.' }
    ]
  }
];

export const FAQ_LIST = [
  {
    q: 'How do I regularise a missed punch or biometric discrepancy?',
    a: 'Go to Attendance > History or Today and click "Regularise". Select the date, select the reason (Biometric Scanner Failure, On Duty/Client Visit, WFH without punch), enter corrected times and provide a note of at least 10 characters. Your reporting manager will be notified to review and approve within 3 days.'
  },
  {
    q: 'What is the company leave policy and minimum notice period?',
    a: 'Casual Leave (CL) requires 1 day advance notice. Earned Leave (EL) requires at least 3 days advance notice. Sick Leave (SL) can be applied retroactively upon recovery, but any absence exceeding 2 consecutive days requires a registered medical practitioner certificate.'
  },
  {
    q: 'When are monthly payslips released and where can I download them?',
    a: 'Payslips are generated on the last working day of every calendar month by 6:00 PM IST. You can view and download PDF payslips under Pay & Docs > Payroll > Payslips tab.'
  },
  {
    q: 'How many late marks are allowed before warnings or deductions apply?',
    a: 'Employees are entitled to 3 free late marks per month (check-ins between 9:31 AM and 9:45 AM are covered under the 15-minute grace period; check-ins after 9:45 AM count as late). Starting from the 4th late mark, an informational warning banner is displayed.'
  },
  {
    q: 'What file formats and sizes are allowed for document uploads?',
    a: 'You can upload documents in PDF, JPG, or PNG formats up to 5 MB per file. Uploaded files undergo review by HR Operations within 2 business days.'
  },
  {
    q: 'How do I claim reimbursement for broadband and wellness expenses?',
    a: 'Submit receipts under the reimbursement portal or open a ticket in Help & Support with the category "Payroll & Benefits" and attach your original GST invoices before the 15th of the month.'
  },
  {
    q: 'Can I swap a shift with a team member?',
    a: 'Yes, navigate to Shifts > My Shift and submit a "Request shift swap or change" form specifying the target shift and colleague name. Both your colleague and manager must confirm.'
  },
  {
    q: 'How is overtime calculated?',
    a: 'Net working hours exceeding 9 hours in a single business day are logged as overtime for informational and project recognition purposes.'
  }
];

