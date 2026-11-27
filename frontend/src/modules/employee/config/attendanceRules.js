// src/config/attendanceRules.js
// Single source of truth for attendance evaluation rules.
// Configurable examples, to be validated by HR.

export const ATTENDANCE_RULES = {
  shift: {
    name: 'General Shift',
    code: 'GEN',
    startTime: '09:30', // 9:30 AM
    endTime: '18:30',   // 6:30 PM
    expectedDurationHours: 9.0, // Total window
    workHoursTarget: 8.0, // 8 hours net
    halfDayThresholdHours: 4.5, // 4h 30m
  },
  gracePeriodMinutes: 15, // Check-in after 09:45 is marked Late
  lateThresholdTime: '09:45',
  earlyDepartureThresholdTime: '18:15', // Check-out before 6:15 PM if net < 8h is Early
  monthlyFreeLateMarks: 3, // 3 free late marks per month; warn on 4th+
  breakRules: {
    mandatoryDeductionMinutes: 60, // Auto-deducted if 0 breaks recorded
    maxAllowedBreakMinutes: 75, // > 75 min = "Break exceeded"
    standardBreakAllowanceMinutes: 60,
  },
  regularisation: {
    maxDaysWindow: 3, // Allowed within 3 days
    maxRequestsPerMonth: 3,
    requiresManagerApproval: true,
  },
  maxCheckInsPerDay: 1, // Policy: only 1 check-in permitted per day; accidental checkout cannot check in again same day
  weeklyOffDays: [0, 6], // 0 = Sunday, 6 = Saturday
  workModes: ['Office', 'Work from home', 'Remote'],
  geofence: {
    enabled: true,
    campusName: 'HITEC City Campus, Tower B',
    address: 'HITEC City, Madhapur, Hyderabad, Telangana 500081',
    latitude: 17.4435,
    longitude: 78.3772,
    radiusMeters: 300, // 300 meters geofence radius
    requireGeofenceForOffice: true
  },
  disclaimer: 'Configurable example, to be validated by HR'
};

export default ATTENDANCE_RULES;

