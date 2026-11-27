// src/utils/leaveStatus.test.js
// Unit tests verifying Manager Final Authority, TL/HR recommendations, and 48h SLA Escalation rules.

import assert from 'node:assert';
import { getFinalStatus, getFinalStatusDetails } from './leaveStatus.js';
import { MOCK_LEAVE_REQUESTS } from '../data/mockLeaves.js';

console.log('🧪 Running Leave Business Rule Tests (getFinalStatus)...\n');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const refNow = new Date('2026-11-10T12:00:00Z');

test('Rule 1: Manager Approved -> Approved', () => {
  const status = getFinalStatus({
    id: 'T-1',
    status: 'Pending',
    appliedOn: '2026-11-10T08:00:00Z',
    approvals: [
      { role: 'TL', name: 'Vikram', decision: 'Approved', remark: 'Ok' },
      { role: 'MANAGER', name: 'Priya', decision: 'Approved', remark: 'Granted' },
      { role: 'HR', name: 'Ananya', decision: 'Pending', remark: 'Pending' }
    ]
  }, refNow);
  assert.strictEqual(status, 'Approved');
});

test('Rule 2: Manager Rejected -> Rejected (even when TL & HR approved)', () => {
  const details = getFinalStatusDetails({
    id: 'T-2',
    status: 'Pending',
    appliedOn: '2026-11-10T08:00:00Z',
    approvals: [
      { role: 'TL', name: 'Vikram', decision: 'Approved', remark: 'Recommended' },
      { role: 'MANAGER', name: 'Priya', decision: 'Rejected', remark: 'Critical sprint freeze' },
      { role: 'HR', name: 'Ananya', decision: 'Approved', remark: 'Balance ok' }
    ]
  }, refNow);
  assert.strictEqual(details.status, 'Rejected');
  assert.strictEqual(details.authorityRole, 'MANAGER');
  assert.strictEqual(details.finalRemark, 'Critical sprint freeze');
});

test('Rule 3: Manager not decided (<48h) -> Pending (even if TL AND HR decided)', () => {
  const status = getFinalStatus({
    id: 'T-3',
    status: 'Pending',
    appliedOn: '2026-11-09T20:00:00Z', // 16h before refNow (< 48h)
    approvals: [
      { role: 'TL', name: 'Vikram', decision: 'Approved', remark: 'Ok' },
      { role: 'MANAGER', name: 'Priya', decision: 'Pending', remark: 'Under review' },
      { role: 'HR', name: 'Ananya', decision: 'Approved', remark: 'Quota ok' }
    ]
  }, refNow);
  assert.strictEqual(status, 'Pending');
});

test('Rule 4: Manager not acted >= 48h & HR undecided -> Escalated', () => {
  const details = getFinalStatusDetails({
    id: 'T-4',
    status: 'Pending',
    appliedOn: '2026-11-08T10:00:00Z', // 50h before refNow (>= 48h)
    approvals: [
      { role: 'TL', name: 'Vikram', decision: 'Approved', remark: 'Ok' },
      { role: 'MANAGER', name: 'Priya', decision: 'Pending', remark: 'No action' },
      { role: 'HR', name: 'Ananya', decision: 'Pending', remark: 'Escalated to HR' }
    ]
  }, refNow);
  assert.strictEqual(details.status, 'Escalated');
  assert.strictEqual(details.isEscalated, true);
  assert.strictEqual(details.authorityRole, 'HR');
});

test('Rule 5: Manager not acted >= 48h & HR Approved -> HR decision final (Approved)', () => {
  const details = getFinalStatusDetails({
    id: 'T-5',
    status: 'Pending',
    appliedOn: '2026-11-06T10:00:00Z', // 98h before refNow
    approvals: [
      { role: 'TL', name: 'Vikram', decision: 'Approved', remark: 'Ok' },
      { role: 'MANAGER', name: 'Priya', decision: 'Pending', remark: 'Away' },
      { role: 'HR', name: 'Ananya', decision: 'Approved', remark: 'HR escalation approval' }
    ]
  }, refNow);
  assert.strictEqual(details.status, 'Approved');
  assert.strictEqual(details.isEscalated, true);
  assert.strictEqual(details.authorityRole, 'HR');
});

test('Rule 6: Manager Approved overriding TL Rejection -> Approved (Manager Final Authority)', () => {
  const status = getFinalStatus({
    id: 'T-6',
    status: 'Pending',
    appliedOn: '2026-11-10T08:00:00Z',
    approvals: [
      { role: 'TL', name: 'Vikram', decision: 'Rejected', remark: 'Sprint busy' },
      { role: 'MANAGER', name: 'Priya', decision: 'Approved', remark: 'Medical priority' },
      { role: 'HR', name: 'Ananya', decision: 'Pending', remark: 'Ok' }
    ]
  }, refNow);
  assert.strictEqual(status, 'Approved');
});

test('Rule 7: Cancelled status preserved', () => {
  const status = getFinalStatus({
    id: 'T-7',
    status: 'Cancelled',
    appliedOn: '2026-11-10T08:00:00Z',
    approvals: []
  }, refNow);
  assert.strictEqual(status, 'Cancelled');
});

test('Rule 8: MOCK_LEAVE_REQUESTS has >= 8 items covering all 5 final statuses', () => {
  assert.ok(MOCK_LEAVE_REQUESTS.length >= 8);
  const statuses = new Set(MOCK_LEAVE_REQUESTS.map((r) => getFinalStatus(r)));
  ['Approved', 'Pending', 'Rejected', 'Escalated', 'Cancelled'].forEach((s) => {
    assert.ok(statuses.has(s), `Expected mock dataset to produce status: ${s}`);
  });
});

console.log(`\n🎉 All ${passed} leave status rule tests passed successfully!\n`);

