import assert from 'node:assert/strict';
import test from 'node:test';

import { getCuttablePicksForParticipant } from './cutPool.ts';
import type { Pick } from '../types';

const picks: Pick[] = [
  {
    id: 'single-connor',
    tournamentId: 't1',
    overallPickNumber: 2,
    roundNumber: 0,
    pickInRound: 2,
    participantName: 'Connor',
    golferName: 'Single Pick Golfer',
    golferEspnId: 'single',
  },
  {
    id: 'snake-connor-1',
    tournamentId: 't1',
    overallPickNumber: 9,
    roundNumber: 1,
    pickInRound: 1,
    participantName: 'Connor',
    golferName: 'Snake Golfer One',
    golferEspnId: 'snake-1',
  },
  {
    id: 'snake-connor-2',
    tournamentId: 't1',
    overallPickNumber: 24,
    roundNumber: 2,
    pickInRound: 8,
    participantName: 'Connor',
    golferName: 'Snake Golfer Two',
    golferEspnId: 'snake-2',
  },
  {
    id: 'snake-andy-1',
    tournamentId: 't1',
    overallPickNumber: 10,
    roundNumber: 1,
    pickInRound: 2,
    participantName: 'Andy',
    golferName: 'Other Player Golfer',
    golferEspnId: 'other',
  },
];

test('cut pool includes only snake draft picks for the participant', () => {
  assert.deepEqual(
    getCuttablePicksForParticipant(picks, 'Connor').map((p) => p.golferName),
    ['Snake Golfer One', 'Snake Golfer Two']
  );
});
