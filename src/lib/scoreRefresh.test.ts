import assert from 'node:assert/strict';
import test from 'node:test';

import { getUpdatedGolferCount } from './scoreRefresh.ts';

test('uses the current tournament count when score refresh updates multiple tournaments', () => {
  const data = {
    updated: [
      { tournamentId: 'masters', golferCount: 0 },
      { tournamentId: 'pga', golferCount: 156 },
    ],
  };

  assert.equal(getUpdatedGolferCount(data, 'pga'), 156);
});

test('falls back to the first tournament count when no tournament id is provided', () => {
  const data = {
    updated: [
      { tournamentId: 'masters', golferCount: 156 },
      { tournamentId: 'pga', golferCount: 156 },
    ],
  };

  assert.equal(getUpdatedGolferCount(data), 156);
});
