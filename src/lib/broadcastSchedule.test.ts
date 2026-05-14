import assert from 'node:assert/strict';
import test from 'node:test';

import { getBroadcastInfo } from './broadcastSchedule.ts';

test('shows ESPN+ stream as live before TV coverage starts', () => {
  const info = getBroadcastInfo('PGA Championship', 2026, new Date('2026-05-14T14:00:00Z'));

  assert.ok(info);
  assert.deepEqual(info.current.map((window) => window.outlets), [['ESPN+']]);
  assert.equal(info.next?.outlets.join(', '), 'ESPN');
  assert.equal(info.nextLabel, '11:00 AM CT');
});

test('shows simultaneous streaming and TV windows during round one', () => {
  const info = getBroadcastInfo('PGA Championship', 2026, new Date('2026-05-14T17:30:00Z'));

  assert.ok(info);
  assert.deepEqual(info.current.map((window) => window.outlets), [
    ['ESPN+'],
    ['ESPN'],
  ]);
});

test('shows ESPN2 during the round one late TV handoff', () => {
  const info = getBroadcastInfo('PGA Championship', 2026, new Date('2026-05-14T23:30:00Z'));

  assert.ok(info);
  assert.deepEqual(info.current.map((window) => window.outlets), [['ESPN2']]);
});

test('shows the next available window before daily coverage begins', () => {
  const info = getBroadcastInfo('PGA Championship', 2026, new Date('2026-05-14T10:30:00Z'));

  assert.ok(info);
  assert.deepEqual(info.current, []);
  assert.equal(info.next?.outlets.join(', '), 'ESPN+');
  assert.equal(info.nextLabel, '5:45 AM CT');
});

test('returns null when no schedule is configured for the tournament', () => {
  assert.equal(getBroadcastInfo('Weekly Member Guest', 2026, new Date('2026-05-14T14:00:00Z')), null);
});
