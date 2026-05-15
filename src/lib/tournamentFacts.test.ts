import assert from 'node:assert/strict';
import test from 'node:test';

import { getTournamentFacts } from './tournamentFacts.ts';

test('uses the 2026 PGA Championship venue facts', () => {
  const facts = getTournamentFacts('PGA Championship');

  assert.equal(facts?.course, 'Aronimink Golf Club');
  assert.equal(facts?.location, 'Newtown Square, PA');
  assert.equal(facts?.par, 70);
  assert.equal(facts?.yardage, 7394);
});
