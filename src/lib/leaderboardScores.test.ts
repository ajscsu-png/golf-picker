import assert from 'node:assert/strict';
import test from 'node:test';

import { computeRawTotalScore, computeProjectedCutTotalScore } from './leaderboardScores.ts';

test('keeps the current raw score separate from the projected cut score', () => {
  const scores = [-2, -1, 0, -1, 2, 5];

  assert.equal(computeRawTotalScore(scores), 3);
  assert.equal(computeProjectedCutTotalScore(scores, 2), -4);
});
