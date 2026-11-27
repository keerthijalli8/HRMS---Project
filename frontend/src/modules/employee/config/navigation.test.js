// src/config/navigation.test.js
// Unit tests for dashboard module search filtering and relevance ranking.

import assert from 'node:assert';
import { ALL_MODULES, filterDashboardModules } from './navigation.js';

console.log('🧪 Running Dashboard Module Search Tests...\n');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

test('Empty query returns [] so clicking search bar never dumps all 13 modules', () => {
  assert.strictEqual(ALL_MODULES.length, 13);
  assert.deepStrictEqual(filterDashboardModules(''), []);
  assert.deepStrictEqual(filterDashboardModules('   '), []);
});

test('Direct label prefix query ranks Attendance first for "att"', () => {
  const res = filterDashboardModules('att');
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].to, '/attendance');
  assert.strictEqual(res[0].label, 'Attendance');
});

test('Searching "doc" or "files" matches Documents', () => {
  const docRes = filterDashboardModules('doc');
  assert.strictEqual(docRes.length, 1);
  assert.strictEqual(docRes[0].to, '/documents');

  const filesRes = filterDashboardModules('files');
  assert.strictEqual(filesRes.length, 1);
  assert.strictEqual(filesRes[0].to, '/documents');
});

test('Keyword alias "gps" -> Attendance, "leave balance" -> Leave, "offer letter" -> Documents', () => {
  const gpsRes = filterDashboardModules('gps');
  assert.strictEqual(gpsRes[0].to, '/attendance');

  const leaveRes = filterDashboardModules('leave balance');
  assert.strictEqual(leaveRes.length, 1);
  assert.strictEqual(leaveRes[0].to, '/leave');

  const docRes = filterDashboardModules('offer letter');
  assert.strictEqual(docRes.length, 1);
  assert.strictEqual(docRes[0].to, '/documents');
});

test('Searching "payroll" matches Payroll in Finance', () => {
  const payRes = filterDashboardModules('payroll');
  assert.ok(payRes.some((m) => m.to === '/finance/payroll'));
});

test('Case-insensitive matching and unknown query returns empty array', () => {
  const profRes = filterDashboardModules('PROFILE');
  assert.strictEqual(profRes.length, 1);
  assert.strictEqual(profRes[0].to, '/profile');

  const noneRes = filterDashboardModules('zzzz-nonexistent-module');
  assert.strictEqual(noneRes.length, 0);
});

console.log('\n🎉 All 5 dashboard module search tests passed successfully!\n');
