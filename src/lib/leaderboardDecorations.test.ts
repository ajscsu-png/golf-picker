import assert from 'node:assert/strict';
import test from 'node:test';

import { participantNameSuffix } from './leaderboardDecorations.ts';
import type { ParticipantLeaderboardRow } from '../types';

function row(name: string, totalScore: number | null): ParticipantLeaderboardRow {
  return {
    participant: {
      tournamentId: 't1',
      name,
      draftPosition: 1,
    },
    golfers: [],
    totalScore,
    rank: 1,
  };
}

test('marks Kyle as the previous champion', () => {
  assert.equal(participantNameSuffix(row('Kyle', -3), [row('Kyle', -3), row('Andy', 4)]), ' 👑');
});

test('keeps Connor display suffix unchanged', () => {
  assert.equal(participantNameSuffix(row('Connor', -3), [row('Connor', -3), row('Andy', 4)]), ' 🍆');
});

test('marks the worst scored participant as last place', () => {
  const rows = [row('Andrew', -2), row('Bill', 0), row('Wyatt', 5)];

  assert.equal(participantNameSuffix(rows[0], rows), '');
  assert.equal(participantNameSuffix(rows[2], rows), ' 💩');
});

test('marks every participant tied for last place', () => {
  const rows = [row('Andrew', -2), row('Bill', 5), row('Wyatt', 5)];

  assert.equal(participantNameSuffix(rows[1], rows), ' 💩');
  assert.equal(participantNameSuffix(rows[2], rows), ' 💩');
});

test('does not mark last place before any scored totals exist', () => {
  const rows = [row('Andrew', null), row('Bill', null)];

  assert.equal(participantNameSuffix(rows[0], rows), '');
  assert.equal(participantNameSuffix(rows[1], rows), '');
});
