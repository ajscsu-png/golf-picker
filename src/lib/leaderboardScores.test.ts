import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeRawTotalScore,
  computeProjectedCutTotalScore,
  computeTournamentCutLine,
} from './leaderboardScores.ts';

test('keeps the current raw score separate from the projected cut score', () => {
  const scores = [-2, -1, 0, -1, 2, 5];

  assert.equal(computeRawTotalScore(scores), 3);
  assert.equal(computeProjectedCutTotalScore(scores, 2), -4);
});

test('uses the Masters top-50 cut rule', () => {
  const scores = Array.from({ length: 80 }, (_, index) => ({
    totalScore: index < 50 ? -2 : 1,
    status: 'active' as const,
    r3: null,
  }));

  assert.deepEqual(computeTournamentCutLine('Masters Tournament', scores), {
    score: -2,
    official: false,
  });
});

test('uses the top-70 cut rule for The Open and includes ties', () => {
  const scores = [
    ...Array.from({ length: 69 }, () => ({ totalScore: 1, status: 'active' as const, r3: null })),
    ...Array.from({ length: 10 }, () => ({ totalScore: 2, status: 'active' as const, r3: null })),
    { totalScore: 3, status: 'active' as const, r3: null },
  ];

  assert.deepEqual(computeTournamentCutLine('The Open', scores), {
    score: 2,
    official: false,
  });
});

test('marks the cut line official once round three has started', () => {
  const scores = Array.from({ length: 75 }, (_, index) => ({
    totalScore: index < 69 ? 1 : 2,
    status: 'active' as const,
    r3: index === 0 ? 0 : null,
  }));

  assert.deepEqual(computeTournamentCutLine('The Open', scores), {
    score: 2,
    official: true,
  });
});

test('uses officially cut golfers when ESPN supplies cut statuses', () => {
  const scores = [
    { totalScore: -1, status: 'active' as const, r3: -2 },
    { totalScore: 3, status: 'cut' as const, r3: null },
    { totalScore: 4, status: 'cut' as const, r3: null },
  ];

  assert.deepEqual(computeTournamentCutLine('The Open', scores), {
    score: 3,
    official: true,
  });
});
