// src/utils/attendanceEngine.test.js
// 14 test cases verifying evaluateDay against HRMS attendance rules.

import assert from 'node:assert';
import { evaluateDay } from './attendanceEngine.js';
import { ATTENDANCE_RULES } from '../config/attendanceRules.js';

console.log('🧪 Running Attendance Engine Unit Tests...\n');

let passedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Standard full day on time
test('Case 1: Standard Full Day (09:30 to 18:30 with 60m break -> Present, 8h net)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:30',
    checkOut: '18:30',
    breaks: [{ start: '13:00', end: '14:00' }]
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'present');
  assert.strictEqual(result.netMinutes, 480);
  assert.strictEqual(result.statusColor, 'good');
  assert.strictEqual(result.flags.includes('LATE'), false);
});

// 2. Late check in
test('Case 2: Late check-in after grace period (09:50 -> LATE flag, warn color)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:50',
    checkOut: '18:50',
    breaks: [{ start: '13:00', end: '14:00' }]
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'present');
  assert.strictEqual(result.isLate, true);
  assert.strictEqual(result.statusColor, 'warn');
  assert.ok(result.flags.includes('LATE'));
});

// 3. Early departure
test('Case 3: Early departure before 18:15 and net < 8h (checkOut 17:30 -> EARLY_DEPARTURE)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:30',
    checkOut: '17:30',
    breaks: [{ start: '13:00', end: '13:30' }] // 30m break, gross 8h -> net 7.5h
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.isEarly, true);
  assert.ok(result.flags.includes('EARLY_DEPARTURE'));
  assert.strictEqual(result.status, 'half_day');
});

// 4. Half day threshold (4h 30m to 8h)
test('Case 4: Half day between 4.5h and 8h net (net 5h -> Half day, warn)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:30',
    checkOut: '15:00',
    breaks: [{ start: '13:00', end: '13:30' }] // 30m break, gross 5.5h -> net 5h
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'half_day');
  assert.strictEqual(result.statusColor, 'warn');
  assert.strictEqual(result.netMinutes, 300);
});

// 5. Absent when net < 4h 30m
test('Case 5: Absent when net hours < 4h 30m (gross 3h -> Absent, bad)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:30',
    checkOut: '12:30',
    breaks: []
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'absent');
  assert.strictEqual(result.statusColor, 'bad');
  assert.ok(result.flags.includes('SHORT_HOURS'));
});

// 6. No punch on weekday
test('Case 6: No punch on weekday (Absent, bad)', () => {
  const result = evaluateDay({
    date: '2026-11-06', // Friday
    checkIn: null,
    checkOut: null
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'absent');
  assert.strictEqual(result.statusColor, 'bad');
  assert.ok(result.flags.includes('NO_PUNCH'));
});

// 7. Weekend off with no punch
test('Case 7: Saturday/Sunday with no punch (Weekly Off, muted)', () => {
  const result = evaluateDay({
    date: '2026-11-07', // Saturday
    checkIn: null,
    checkOut: null
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'weekly_off');
  assert.strictEqual(result.statusColor, 'muted');
  assert.ok(result.flags.includes('WEEKLY_OFF'));
});

// 8. Weekend punch (Extra day)
test('Case 8: Weekend punch on Sunday (EXTRA_DAY flag)', () => {
  const result = evaluateDay({
    date: '2026-11-08', // Sunday
    checkIn: '10:00',
    checkOut: '18:00',
    breaks: [{ start: '13:00', end: '14:00' }]
  }, ATTENDANCE_RULES);

  assert.ok(result.flags.includes('EXTRA_DAY'));
  assert.strictEqual(result.netMinutes, 420);
});

// 9. Holiday
test('Case 9: Company or Public Holiday (Holiday, muted)', () => {
  const result = evaluateDay({
    date: '2026-11-09',
    type: 'holiday'
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'holiday');
  assert.strictEqual(result.statusColor, 'muted');
});

// 10. Approved Leave
test('Case 10: Approved Casual Leave (Leave, accent2)', () => {
  const result = evaluateDay({
    date: '2026-11-12',
    type: 'leave',
    leaveType: 'Casual Leave'
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'leave');
  assert.strictEqual(result.statusColor, 'accent2');
});

// 11. Missed Check-out
test('Case 11: Missed check-out past shift without regularisation (Missed check-out, bad)', () => {
  const result = evaluateDay({
    date: '2026-11-04',
    checkIn: '09:30',
    checkOut: null,
    inProgress: false
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.status, 'missed_checkout');
  assert.strictEqual(result.statusColor, 'bad');
  assert.ok(result.flags.includes('REGULARISATION_REQUIRED'));
});

// 12. Break exceeded (>75m)
test('Case 12: Total break exceeds 75 min (BREAK_EXCEEDED flag)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:00',
    checkOut: '18:30',
    breaks: [
      { start: '13:00', end: '14:00' }, // 60 min
      { start: '16:00', end: '16:30' }  // 30 min -> total 90 min
    ]
  }, ATTENDANCE_RULES);

  assert.ok(result.flags.includes('BREAK_EXCEEDED'));
  assert.strictEqual(result.breakMinutes, 90);
});

// 13. Overtime (>9h net)
test('Case 13: Overtime when net > 9 hours (OVERTIME flag)', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:00',
    checkOut: '19:30',
    breaks: [{ start: '13:00', end: '13:30' }] // 30m break, gross 10.5h -> net 10h
  }, ATTENDANCE_RULES);

  assert.ok(result.flags.includes('OVERTIME'));
  assert.strictEqual(result.netMinutes, 600);
});

// 14. Auto break deduction if 0 breaks recorded
test('Case 14: Auto-deduct 60m mandatory break if 0 breaks recorded for full day', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:30',
    checkOut: '18:30',
    breaks: [] // No breaks logged
  }, ATTENDANCE_RULES);

  assert.strictEqual(result.breakMinutes, 60);
  assert.strictEqual(result.netMinutes, 480);
  assert.ok(result.flags.includes('AUTO_BREAK_DEDUCTED'));
});

// 15. Active break live duration calculation while in progress
test('Case 15: Live break duration tracking for active ongoing break', () => {
  const result = evaluateDay({
    date: '2026-11-06',
    checkIn: '09:30',
    checkOut: null,
    inProgress: true,
    breaks: [
      { start: '11:00', end: '11:15', duration: 15 },
      { start: '13:00', end: null } // active lunch break started at 13:00
    ]
  }, ATTENDANCE_RULES, { nowMinutes: 13 * 60 + 25 }); // current time 13:25

  assert.strictEqual(result.breakMinutes, 40); // 15 + 25 active
  assert.strictEqual(result.recordedBreakMinutes, 40);
  assert.strictEqual(result.grossMinutes, 235); // 09:30 to 13:25 = 3h 55m
  assert.strictEqual(result.netMinutes, 195); // 235 - 40
});

// 16. Second-level precision timestamps and break durations
test('Case 16: Second-level precision across checkIn/checkOut/breaks', () => {
  const result = evaluateDay({
    date: '2026-11-05',
    checkIn: '09:25:02',
    checkOut: '18:32:45',
    breaks: [{ start: '13:01:12', end: '14:01:28' }] // 3616s (1h 00m 16s)
  }, ATTENDANCE_RULES);

  // Gross: 18:32:45 - 09:25:02 = 9h 07m 43s = 32863s
  // Break: 3616s
  // Net: 32863 - 3616 = 29247s (8h 07m 27s)
  assert.strictEqual(result.grossSeconds, 32863);
  assert.strictEqual(result.breakSeconds, 3616);
  assert.strictEqual(result.netSeconds, 29247);
  assert.strictEqual(result.status, 'present');
});

// 17. Net working time MUST pause completely during an active break (even if durationSeconds: 0 is stored)
test('Case 17: Net working seconds stay frozen across ticks during an active break', () => {
  const entry = {
    date: '2026-11-06',
    checkIn: '09:28:14',
    checkOut: null,
    inProgress: true,
    breaks: [
      { id: 'brk-1', type: 'Tea', start: '11:15:08', end: '11:30:22', duration: 15, durationSeconds: 914 },
      { id: 'brk-2', type: 'Lunch', start: '13:05:00', end: null, duration: 0, durationSeconds: 0 }
    ]
  };

  const t0 = evaluateDay(entry, ATTENDANCE_RULES, { nowMinutes: 13 * 60 + 5, nowSeconds: 13 * 3600 + 5 * 60 });
  const tPlus15 = evaluateDay(entry, ATTENDANCE_RULES, { nowMinutes: 13 * 60 + 5, nowSeconds: 13 * 3600 + 5 * 60 + 15 });
  const tPlus120 = evaluateDay(entry, ATTENDANCE_RULES, { nowMinutes: 13 * 60 + 7, nowSeconds: 13 * 3600 + 7 * 60 });

  assert.strictEqual(t0.isOnBreak, true);
  assert.strictEqual(t0.label, 'On Break (Paused)');
  assert.strictEqual(t0.netSeconds, tPlus15.netSeconds, 'Net working seconds must freeze during break (+15s)');
  assert.strictEqual(t0.netSeconds, tPlus120.netSeconds, 'Net working seconds must freeze during break (+120s)');
  assert.strictEqual(tPlus15.breakSeconds - t0.breakSeconds, 15, 'Break duration must tick +15s');
  assert.strictEqual(tPlus120.breakSeconds - t0.breakSeconds, 120, 'Break duration must tick +120s');
});

console.log(`\n🎉 All ${passedCount} attendance engine unit tests passed successfully!\n`);

