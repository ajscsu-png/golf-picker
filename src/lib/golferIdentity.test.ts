import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDraftField,
  createOddsGolferId,
  findScoreForPick,
  normalizeGolferName,
} from './golferIdentity.ts';

test('creates stable temporary golfer ids from odds names', () => {
  assert.equal(createOddsGolferId('Scottie Scheffler'), 'odds:scottiescheffler');
  assert.equal(createOddsGolferId('Ludvig Åberg'), 'odds:ludvigaberg');
});

test('uses odds names as the draft field when ESPN has no field yet', () => {
  const field = buildDraftField([], [
    {
      name: 'Scottie Scheffler',
      americanOdds: 392,
      oddsDisplay: '+392',
      impliedProbability: 0.2,
      bookmakers: [],
    },
  ]);

  assert.deepEqual(field, [
    {
      id: 'odds:scottiescheffler',
      name: 'Scottie Scheffler',
      worldRanking: undefined,
    },
  ]);
});

test('keeps ESPN field ids when ESPN has already published the field', () => {
  const field = buildDraftField(
    [{ id: '123', name: 'Scottie Scheffler', worldRanking: 1 }],
    [{
      name: 'Scottie Scheffler',
      americanOdds: 392,
      oddsDisplay: '+392',
      impliedProbability: 0.2,
      bookmakers: [],
    }]
  );

  assert.deepEqual(field, [{ id: '123', name: 'Scottie Scheffler', worldRanking: 1 }]);
});

test('finds scores by normalized name when a pick used an odds id', () => {
  const scores = [
    {
      tournamentId: 't1',
      golferEspnId: '123',
      golferName: 'Scottie Scheffler',
      position: '1',
      totalScore: -4,
      r1: -4,
      r2: null,
      r3: null,
      r4: null,
      thru: null,
      teeTime: null,
      status: 'active' as const,
    },
  ];

  const pick = {
    id: 'p1',
    tournamentId: 't1',
    overallPickNumber: 1,
    roundNumber: 0,
    pickInRound: 1,
    participantName: 'Andrew',
    golferName: 'Scottie Scheffler',
    golferEspnId: createOddsGolferId('Scottie Scheffler'),
  };

  assert.equal(findScoreForPick(scores, pick)?.golferEspnId, '123');
});

test('normalizes common spelling variants for later matching', () => {
  assert.equal(normalizeGolferName('Ludvig Åberg'), normalizeGolferName('Ludvig Aberg'));
  assert.equal(normalizeGolferName('Matt Fitzpatrick'), normalizeGolferName('Matthew Fitzpatrick'));
});
