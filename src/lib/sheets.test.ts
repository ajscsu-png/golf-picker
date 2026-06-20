import assert from 'node:assert/strict';
import test from 'node:test';

import { getParticipantRows, getRowsWithSingleActiveTournament } from './sheets.ts';

test('activating one tournament demotes any other active tournament', () => {
  const rows = [
    ['pga', 'PGA Championship', '2026', '401580346', 'active', '6', '2', '1', '1'],
    ['us-open', 'U.S. Open', '2026', '401580347', 'completed', '6', '2', '1', '1'],
    ['open', 'The Open Championship', '2026', '401580348', 'draft', '6', '2', '1', '1'],
  ];

  assert.deepEqual(
    getRowsWithSingleActiveTournament(rows, 'us-open').map((row) => [row[0], row[4]]),
    [
      ['pga', 'completed'],
      ['us-open', 'active'],
      ['open', 'draft'],
    ]
  );
});

test('participant rows do not persist phone numbers', () => {
  assert.deepEqual(
    getParticipantRows('us-open', [
      { name: 'Andy', draftPosition: 1 },
      { name: 'Connor', draftPosition: 2 },
    ]),
    [
      ['us-open', 'Andy', '1'],
      ['us-open', 'Connor', '2'],
    ]
  );
});
