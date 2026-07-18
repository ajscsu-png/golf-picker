import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTeamScoreSnapshots,
  computeDisplayedTeamTotal,
  getCentralTimeBucket,
  getCurrentDaySnapshots,
  getMomentumYScale,
} from './teamMomentum.ts';
import type { TeamScoreSnapshot } from '../types/index.ts';

function snapshot(overrides: Partial<TeamScoreSnapshot> = {}): TeamScoreSnapshot {
  return {
    tournamentId: 'open',
    participantName: 'Wyatt',
    localDate: '2026-07-18',
    hourKey: '2026-07-18T16:00',
    capturedAt: '2026-07-18T21:00:00.000Z',
    teamTotal: -10,
    snapshotType: 'hourly',
    ...overrides,
  };
}

test('calculates the displayed total from scored non-dropped golfers', () => {
  assert.equal(computeDisplayedTeamTotal([
    { totalScore: -4, dropped: false },
    { totalScore: 2, dropped: false },
    { totalScore: 8, dropped: true },
    { totalScore: null, dropped: false },
  ]), -2);
});

test('returns null before any non-dropped golfer has a score', () => {
  assert.equal(computeDisplayedTeamTotal([
    { totalScore: null, dropped: false },
    { totalScore: -2, dropped: true },
  ]), null);
});

test('creates clock-hour keys in America Chicago time', () => {
  assert.deepEqual(getCentralTimeBucket(new Date('2026-07-19T14:05:00.000Z')), {
    localDate: '2026-07-19',
    hourKey: '2026-07-19T09:00',
    hour: 9,
    minute: 5,
  });
});

test('starts Sunday from Saturday closing total', () => {
  const result = buildTeamScoreSnapshots({
    tournamentId: 'open',
    participantName: 'Wyatt',
    now: new Date('2026-07-19T14:05:00.000Z'),
    currentTotal: -9,
    earliestTeeTime: '8:00 AM',
    latestTeeTime: '12:00 PM',
    existing: [snapshot()],
  });

  assert.deepEqual(result.map((row) => [row.hourKey, row.teamTotal, row.snapshotType]), [
    ['2026-07-19T08:00', -10, 'baseline'],
    ['2026-07-19T09:00', -9, 'hourly'],
  ]);
});

test('does not invent earlier history when no prior day was captured', () => {
  const result = buildTeamScoreSnapshots({
    tournamentId: 'open',
    participantName: 'Wyatt',
    now: new Date('2026-07-18T19:05:00.000Z'),
    currentTotal: -7,
    earliestTeeTime: '8:00 AM',
    latestTeeTime: '12:00 PM',
    existing: [],
  });

  assert.deepEqual(result.map((row) => [row.hourKey, row.teamTotal, row.snapshotType]), [
    ['2026-07-18T14:00', -7, 'baseline'],
  ]);
});

test('waits until the participant first tee time', () => {
  assert.deepEqual(buildTeamScoreSnapshots({
    tournamentId: 'open',
    participantName: 'Wyatt',
    now: new Date('2026-07-19T12:05:00.000Z'),
    currentTotal: -10,
    earliestTeeTime: '8:00 AM',
    latestTeeTime: '12:00 PM',
    existing: [snapshot()],
  }), []);
});

test('shows only the current Central-time day sorted by hour', () => {
  const rows = [
    snapshot({ localDate: '2026-07-19', hourKey: '2026-07-19T10:00', teamTotal: -12 }),
    snapshot(),
    snapshot({ localDate: '2026-07-19', hourKey: '2026-07-19T09:00', teamTotal: -10 }),
  ];
  assert.deepEqual(
    getCurrentDaySnapshots(rows, new Date('2026-07-19T16:00:00.000Z')).map((row) => row.hourKey),
    ['2026-07-19T09:00', '2026-07-19T10:00']
  );
});

test('maps better golf scores higher on the y axis', () => {
  const scale = getMomentumYScale([-10, -14, -18], 36, 174);
  assert.ok(scale(-18) < scale(-10));
  assert.ok(scale(-10) < scale(-6));
});
