import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getActiveTournamentId,
  markTournamentActive,
} from './adminTournamentState.ts';
import type { Tournament } from '../types/index.ts';

const tournaments: Tournament[] = [
  {
    id: 'old',
    name: 'PGA Championship',
    year: 2026,
    espnEventId: '1',
    status: 'active',
    picksPerPerson: 6,
    cutsPerPerson: 2,
    isMajor: true,
    hasSingleDraft: true,
  },
  {
    id: 'new',
    name: 'The Open',
    year: 2026,
    espnEventId: '2',
    status: 'draft',
    picksPerPerson: 6,
    cutsPerPerson: 2,
    isMajor: true,
    hasSingleDraft: true,
  },
];

test('hydrates the admin selection from the stored active status', () => {
  assert.equal(getActiveTournamentId(tournaments), 'old');
});

test('updates local admin statuses after setting a new active tournament', () => {
  assert.deepEqual(
    markTournamentActive(tournaments, 'new').map((t) => [t.id, t.status]),
    [
      ['old', 'completed'],
      ['new', 'active'],
    ]
  );
});
