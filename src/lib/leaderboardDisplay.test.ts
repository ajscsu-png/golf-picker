import assert from 'node:assert/strict';
import test from 'node:test';

import { golferTeeTimeLabel } from './leaderboardDisplay.ts';
import type { GolferScore } from '../types';

function score(overrides: Partial<GolferScore>): GolferScore {
  return {
    tournamentId: 't1',
    golferEspnId: 'g1',
    golferName: 'Xander Schauffele',
    position: 'T2',
    totalScore: -3,
    r1: -3,
    r2: null,
    r3: null,
    r4: null,
    thru: null,
    teeTime: '10:29 AM',
    status: 'active',
    ...overrides,
  };
}

test('shows scheduled tee time before a golfer starts', () => {
  assert.equal(golferTeeTimeLabel(score({ thru: null, teeTime: '10:29 AM' })), '10:29 AM');
});

test('hides scheduled tee time once a golfer is through holes', () => {
  assert.equal(golferTeeTimeLabel(score({ thru: 4, teeTime: '10:29 AM' })), null);
});
