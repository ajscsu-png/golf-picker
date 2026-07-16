import assert from 'node:assert/strict';
import test from 'node:test';

import { getJokePool, STATS_MONEY_ROASTS } from './statsMoneyRoasts.ts';

test('uses money roasts only on the Stats route', () => {
  const normal = ['normal joke'];

  assert.equal(getJokePool('/stats', normal), STATS_MONEY_ROASTS);
  assert.equal(getJokePool('/', normal), normal);
  assert.equal(getJokePool('/leaderboard/tournament', normal), normal);
});
