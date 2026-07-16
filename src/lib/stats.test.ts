import assert from 'node:assert/strict';
import test from 'node:test';

import { aggregateParticipantStats, type FinalizedResult } from './stats.ts';

function result(
  tournamentId: string,
  poolType: 'single' | 'snake',
  participantName: string,
  rank: number,
  totalScore: number
): FinalizedResult {
  return {
    tournamentId,
    tournamentName: tournamentId === 'pga' ? 'PGA Championship' : 'U.S. Open',
    year: 2026,
    poolType,
    participantName,
    rank,
    totalScore,
    finalizedAt: '2026-06-22T00:00:00.000Z',
  };
}

test('keeps single and snake wins and average finishes separate', () => {
  const summary = aggregateParticipantStats([
    result('pga', 'single', 'Andy', 1, -5),
    result('pga', 'single', 'Tim', 2, -4),
    result('pga', 'snake', 'Andy', 3, -5),
    result('pga', 'snake', 'Tim', 1, -11),
    result('us-open', 'single', 'Andy', 1, 0),
    result('us-open', 'single', 'Tim', 7, 6),
    result('us-open', 'snake', 'Andy', 8, 26),
    result('us-open', 'snake', 'Tim', 3, 14),
  ]);

  assert.equal(summary.completedTournamentCount, 2);
  assert.deepEqual(summary.participants.map((participant) => ({
    name: participant.name,
    single: participant.single,
    snake: participant.snake,
  })), [
    {
      name: 'Andy',
      single: { wins: 2, averageFinish: 1, played: 2 },
      snake: { wins: 0, averageFinish: 5.5, played: 2 },
    },
    {
      name: 'Tim',
      single: { wins: 0, averageFinish: 4.5, played: 2 },
      snake: { wins: 1, averageFinish: 2, played: 2 },
    },
  ]);
});
test('calculates gross winnings and zero-sum net balances', () => {
  const summary = aggregateParticipantStats([
    result('pga', 'single', 'Andy', 1, -5),
    result('pga', 'single', 'Tim', 2, -4),
    result('pga', 'snake', 'Andy', 3, -5),
    result('pga', 'snake', 'Tim', 1, -11),
  ]);

  assert.deepEqual(summary.participants.map((participant) => ({
    name: participant.name,
    grossWinnings: participant.grossWinnings,
    netWinnings: participant.netWinnings,
  })), [
    { name: 'Andy', grossWinnings: 10, netWinnings: 0 },
    { name: 'Tim', grossWinnings: 10, netWinnings: 0 },
  ]);
  assert.equal(summary.participants.reduce((sum, participant) => sum + participant.netWinnings, 0), 0);
});

test('splits contributions from non-winners across tied winners', () => {
  const summary = aggregateParticipantStats([
    result('us-open', 'single', 'Andy', 1, 0),
    result('us-open', 'single', 'Bill', 1, 0),
    result('us-open', 'single', 'Tim', 3, 2),
  ]);

  assert.deepEqual(summary.participants.map((participant) => ({
    name: participant.name,
    grossWinnings: participant.grossWinnings,
    netWinnings: participant.netWinnings,
  })), [
    { name: 'Andy', grossWinnings: 5, netWinnings: 5 },
    { name: 'Bill', grossWinnings: 5, netWinnings: 5 },
    { name: 'Tim', grossWinnings: 0, netWinnings: -10 },
  ]);
});
