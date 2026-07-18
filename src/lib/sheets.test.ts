import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getConfigValueRange,
  getParticipantRows,
  getRowsWithSingleActiveTournament,
  getRowsWithTeamScoreSnapshots,
} from './sheets.ts';
import type { TeamScoreSnapshot } from '../types/index.ts';

function teamSnapshot(overrides: Partial<TeamScoreSnapshot> = {}): TeamScoreSnapshot {
  return {
    tournamentId: 'open',
    participantName: 'Wyatt',
    localDate: '2026-07-19',
    hourKey: '2026-07-19T09:00',
    capturedAt: '2026-07-19T14:00:00.000Z',
    teamTotal: -10,
    snapshotType: 'hourly',
    ...overrides,
  };
}

test('config updates target only the matching value cell', () => {
  const rows = [
    ['active_tournament_id', 'old-id'],
    ['last_scores_updated', 'old-time'],
  ];

  assert.equal(getConfigValueRange(rows, 'active_tournament_id'), 'Config!B2');
  assert.equal(getConfigValueRange(rows, 'last_scores_updated'), 'Config!B3');
  assert.equal(getConfigValueRange(rows, 'missing'), null);
});

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

test('replaces a matching participant hour without duplicating it', () => {
  const existing = [[
    'open', 'Wyatt', '2026-07-19', '2026-07-19T09:00',
    '2026-07-19T14:00:00.000Z', '-10', 'hourly',
  ]];
  const rows = getRowsWithTeamScoreSnapshots(existing, [teamSnapshot({
    capturedAt: '2026-07-19T14:45:00.000Z',
    teamTotal: -12,
  })]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0][4], '2026-07-19T14:45:00.000Z');
  assert.equal(rows[0][5], '-12');
});

test('keeps distinct participant and hour snapshots', () => {
  const rows = getRowsWithTeamScoreSnapshots([], [
    teamSnapshot(),
    teamSnapshot({ participantName: 'Andy' }),
    teamSnapshot({ hourKey: '2026-07-19T10:00' }),
  ]);
  assert.equal(rows.length, 3);
});
