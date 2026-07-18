import assert from 'node:assert/strict';
import test from 'node:test';

import { captureTeamMomentum, persistTeamMomentumSafely } from './teamMomentumCapture.ts';
import type { GolferScore, Participant, Pick } from '../types/index.ts';

const participants: Participant[] = [
  { tournamentId: 'open', name: 'Andy', draftPosition: 1 },
  { tournamentId: 'open', name: 'Wyatt', draftPosition: 2 },
];

const picks: Pick[] = [
  { id: '1', tournamentId: 'open', overallPickNumber: 1, roundNumber: 1, pickInRound: 1, participantName: 'Andy', golferName: 'A', golferEspnId: 'a' },
  { id: '2', tournamentId: 'open', overallPickNumber: 2, roundNumber: 1, pickInRound: 2, participantName: 'Wyatt', golferName: 'W', golferEspnId: 'w' },
  { id: '3', tournamentId: 'open', overallPickNumber: 0, roundNumber: 0, pickInRound: 1, participantName: 'Wyatt', golferName: 'Single', golferEspnId: 'single' },
];

function score(id: string, totalScore: number, teeTime: string): GolferScore {
  return {
    tournamentId: 'open',
    golferEspnId: id,
    golferName: id.toUpperCase(),
    position: 'T1',
    totalScore,
    r1: totalScore,
    r2: null,
    r3: null,
    r4: null,
    thru: 1,
    teeTime,
    status: 'active',
  };
}

test('captures snake team totals for every participant', () => {
  const snapshots = captureTeamMomentum({
    tournamentId: 'open',
    participants,
    picks,
    scores: [score('a', -2, '8:00 AM'), score('w', -4, '8:10 AM'), score('single', -20, '7:00 AM')],
    cuts: [],
    existing: [],
    now: new Date('2026-07-18T14:05:00.000Z'),
  });

  assert.deepEqual(snapshots.map((row) => [row.participantName, row.teamTotal]), [
    ['Andy', -2],
    ['Wyatt', -4],
  ]);
});

test('excludes submitted drops from the displayed team total', () => {
  const snapshots = captureTeamMomentum({
    tournamentId: 'open',
    participants: [participants[1]],
    picks: [picks[1], { ...picks[1], id: '4', golferEspnId: 'bad', golferName: 'Bad' }],
    scores: [score('w', -4, '8:10 AM'), score('bad', 8, '8:20 AM')],
    cuts: [{ tournamentId: 'open', participantName: 'Wyatt', golferEspnId: 'bad', golferName: 'Bad', dropNumber: 1 }],
    existing: [],
    now: new Date('2026-07-18T14:05:00.000Z'),
  });

  assert.equal(snapshots[0].teamTotal, -4);
});

test('skips participants without a current displayed total', () => {
  const snapshots = captureTeamMomentum({
    tournamentId: 'open',
    participants: [participants[1]],
    picks: [picks[1]],
    scores: [],
    cuts: [],
    existing: [],
    now: new Date('2026-07-18T14:05:00.000Z'),
  });
  assert.deepEqual(snapshots, []);
});

test('reports history write failures without failing score refresh', async () => {
  const result = await persistTeamMomentumSafely(
    [{
      tournamentId: 'open', participantName: 'Wyatt', localDate: '2026-07-18',
      hourKey: '2026-07-18T09:00', capturedAt: '2026-07-18T14:00:00.000Z',
      teamTotal: -4, snapshotType: 'hourly',
    }],
    async () => { throw new Error('Sheets unavailable'); }
  );

  assert.deepEqual(result, { captured: 0, warning: 'Team momentum history was not saved' });
});
