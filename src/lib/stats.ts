import type { FinalizedResult, ParticipantStats, PoolStats, PoolType } from '../types';

export type { FinalizedResult } from '../types';

const ENTRY_FEE = 10;

export interface StatsSummary {
  completedTournamentCount: number;
  participants: ParticipantStats[];
}

function emptyPoolStats(): PoolStats {
  return { wins: 0, averageFinish: null, played: 0 };
}

function poolKey(result: FinalizedResult): string {
  return `${result.tournamentId}:${result.poolType}`;
}

export function aggregateParticipantStats(results: FinalizedResult[]): StatsSummary {
  const byName = new Map<string, ParticipantStats & { finishTotals: Record<PoolType, number> }>();

  for (const result of results) {
    if (!byName.has(result.participantName)) {
      byName.set(result.participantName, {
        name: result.participantName,
        single: emptyPoolStats(),
        snake: emptyPoolStats(),
        grossWinnings: 0,
        netWinnings: 0,
        finishTotals: { single: 0, snake: 0 },
      });
    }

    const participant = byName.get(result.participantName)!;
    const pool = participant[result.poolType];
    pool.played += 1;
    pool.wins += result.rank === 1 ? 1 : 0;
    participant.finishTotals[result.poolType] += result.rank;
  }

  const pools = new Map<string, FinalizedResult[]>();
  for (const result of results) {
    const key = poolKey(result);
    pools.set(key, [...(pools.get(key) ?? []), result]);
  }

  for (const poolResults of Array.from(pools.values())) {
    const winners = poolResults.filter((result) => result.rank === 1);
    const losers = poolResults.filter((result) => result.rank !== 1);
    const winnerShare = winners.length > 0 ? (losers.length * ENTRY_FEE) / winners.length : 0;

    for (const winner of winners) {
      const participant = byName.get(winner.participantName)!;
      participant.grossWinnings += winnerShare;
      participant.netWinnings += winnerShare;
    }
    for (const loser of losers) {
      byName.get(loser.participantName)!.netWinnings -= ENTRY_FEE;
    }
  }

  const participants = Array.from(byName.values()).map(({ finishTotals, ...participant }) => {
    for (const poolType of ['single', 'snake'] as const) {
      const pool = participant[poolType];
      pool.averageFinish = pool.played > 0 ? finishTotals[poolType] / pool.played : null;
    }
    return participant;
  });

  participants.sort((a, b) =>
    b.netWinnings - a.netWinnings
    || b.grossWinnings - a.grossWinnings
    || (b.single.wins + b.snake.wins) - (a.single.wins + a.snake.wins)
    || a.name.localeCompare(b.name)
  );

  return {
    completedTournamentCount: new Set(results.map((result) => result.tournamentId)).size,
    participants,
  };
}
