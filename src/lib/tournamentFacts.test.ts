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

test('uses the 2026 U.S. Open venue facts for common name variants', () => {
  for (const name of ['US Open', 'U.S. Open']) {
    const facts = getTournamentFacts(name);

    assert.equal(facts?.course, 'Shinnecock Hills Golf Club');
    assert.equal(facts?.location, 'Southampton, NY');
    assert.equal(facts?.par, 70);
    assert.equal(facts?.yardage, 7440);
  }
});
