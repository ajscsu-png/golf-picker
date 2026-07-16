import assert from 'node:assert/strict';
import test from 'node:test';

import type { Cut, GolferScore, Participant, Pick, Tournament } from '../types';
import { buildFinalizedResults } from './finalizeResults.ts';

const tournament: Tournament = {
  id: 'major', name: 'Major', year: 2026, espnEventId: '1', status: 'active',
  picksPerPerson: 6, cutsPerPerson: 2, isMajor: true, hasSingleDraft: true,
};
const participants: Participant[] = [
  { tournamentId: 'major', name: 'Andy', draftPosition: 1 },
  { tournamentId: 'major', name: 'Tim', draftPosition: 2 },
];

function pick(name: string, golferName: string, roundNumber: number, id = golferName): Pick {
  return {
    id: `${name}-${golferName}`, tournamentId: 'major', overallPickNumber: 1,
    roundNumber, pickInRound: 1, participantName: name, golferName, golferEspnId: id,
  };
}

function score(golferName: string, totalScore: number, id = golferName): GolferScore {
  return {
    tournamentId: 'major', golferEspnId: id, golferName, position: '1', totalScore,
    r1: 70, r2: 70, r3: 70, r4: 70, thru: 18, teeTime: null, status: 'active',
  };
}

const andyGolfers = [
  ['Alpha', -5], ['Bravo', -4], ['Charlie', -3], ['Delta', -2], ['Echo', 8], ['Foxtrot', 9],
] as const;
const timGolfers = [
  ['Golf', -5], ['Hotel', -4], ['India', -3], ['Juliet', -2], ['Kilo', 7], ['Lima', 10],
] as const;

const picks: Pick[] = [
  pick('Andy', 'Single Andy', 0),
  ...andyGolfers.map(([name], index) => pick('Andy', name, index + 1)),
  pick('Tim', 'Single Tim', 0),
  ...timGolfers.map(([name], index) => pick('Tim', name, index + 1)),
];
const scores: GolferScore[] = [
  score('Single Andy', 0), score('Single Tim', 0),
  ...andyGolfers.map(([name, value]) => score(name, value)),
  ...timGolfers.map(([name, value]) => score(name, value)),
];

test('finalizes single and best-four snake results with competition ties', () => {
  const cuts: Cut[] = [
    { tournamentId: 'major', participantName: 'Andy', golferEspnId: 'odds:echo', golferName: 'Echo', dropNumber: 1 },
    { tournamentId: 'major', participantName: 'Andy', golferEspnId: 'odds:foxtrot', golferName: 'Foxtrot', dropNumber: 2 },
  ];
  const results = buildFinalizedResults({
    tournament, participants, picks, scores, cuts, finalizedAt: '2026-06-22T00:00:00.000Z',
  });

  assert.deepEqual(results.map(({ participantName, poolType, totalScore, rank }) => ({
    participantName, poolType, totalScore, rank,
  })), [
    { participantName: 'Andy', poolType: 'single', totalScore: 0, rank: 1 },
    { participantName: 'Tim', poolType: 'single', totalScore: 0, rank: 1 },
    { participantName: 'Andy', poolType: 'snake', totalScore: -14, rank: 1 },
    { participantName: 'Tim', poolType: 'snake', totalScore: -14, rank: 1 },
  ]);
});

test('matches odds-backed picks to ESPN scores by normalized golfer name', () => {
  const oddsPick = pick('Andy', 'Matt Fitzpatrick', 0, 'odds:matthewfitzpatrick');
  const espnScore = score('Matthew Fitzpatrick', -2, '123');
  const results = buildFinalizedResults({
    tournament: { ...tournament, hasSingleDraft: true },
    participants: [participants[0]],
    picks: [oddsPick, ...picks.filter((item) => item.participantName === 'Andy' && item.roundNumber > 0)],
    scores: [espnScore, ...scores.filter((item) => andyGolfers.some(([name]) => name === item.golferName))],
    cuts: [], finalizedAt: '2026-06-22T00:00:00.000Z',
  });

  assert.equal(results.find((result) => result.poolType === 'single')?.totalScore, -2);
});

test('rejects incomplete scores instead of archiving partial results', () => {
  assert.throws(() => buildFinalizedResults({
    tournament, participants: [participants[0]], picks,
    scores: scores.filter((item) => item.golferName !== 'Alpha'), cuts: [],
    finalizedAt: '2026-06-22T00:00:00.000Z',
  }), /missing a final score/i);
});
