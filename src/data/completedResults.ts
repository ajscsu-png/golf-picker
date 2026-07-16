import type { FinalizedResult, PoolType } from '@/types';

interface Standing {
  name: string;
  rank: number;
  score: number;
}

function rows(
  tournamentId: string,
  tournamentName: string,
  poolType: PoolType,
  finalizedAt: string,
  standings: Standing[]
): FinalizedResult[] {
  return standings.map(({ name, rank, score }) => ({
    tournamentId,
    tournamentName,
    year: 2026,
    poolType,
    participantName: name,
    rank,
    totalScore: score,
    finalizedAt,
  }));
}

// Only tournaments with a complete, verified Single and Snake result set belong here.
// Live tournaments are intentionally excluded.
export const COMPLETED_RESULTS: FinalizedResult[] = [
  ...rows('95e09fd8-7f6a-46f5-ad25-57fa28381604', 'PGA Championship', 'single', '2026-05-18T00:00:00.000Z', [
    { name: 'Andy', rank: 1, score: -5 },
    { name: 'Bill', rank: 2, score: -4 },
    { name: 'Tim', rank: 2, score: -4 },
    { name: 'Brad', rank: 4, score: -3 },
    { name: 'Andrew', rank: 5, score: -2 },
    { name: 'Kyle', rank: 5, score: -2 },
    { name: 'Wyatt', rank: 7, score: 0 },
    { name: 'Connor', rank: 8, score: 5 },
  ]),
  ...rows('95e09fd8-7f6a-46f5-ad25-57fa28381604', 'PGA Championship', 'snake', '2026-05-18T00:00:00.000Z', [
    { name: 'Tim', rank: 1, score: -11 },
    { name: 'Brad', rank: 2, score: -7 },
    { name: 'Andy', rank: 3, score: -5 },
    { name: 'Connor', rank: 4, score: -2 },
    { name: 'Andrew', rank: 5, score: 1 },
    { name: 'Bill', rank: 6, score: 3 },
    { name: 'Kyle', rank: 7, score: 4 },
    { name: 'Wyatt', rank: 8, score: 16 },
  ]),
  ...rows('aa8ff2c6-ca91-4a68-881f-95b92e5a5ee7', 'U.S. Open', 'single', '2026-06-22T00:00:00.000Z', [
    { name: 'Andy', rank: 1, score: 0 },
    { name: 'Connor', rank: 2, score: 2 },
    { name: 'Bill', rank: 2, score: 2 },
    { name: 'Andrew', rank: 4, score: 3 },
    { name: 'Kyle', rank: 5, score: 4 },
    { name: 'Wyatt', rank: 6, score: 5 },
    { name: 'Tim', rank: 7, score: 6 },
    { name: 'Brad', rank: 8, score: 8 },
  ]),
  ...rows('aa8ff2c6-ca91-4a68-881f-95b92e5a5ee7', 'U.S. Open', 'snake', '2026-06-22T00:00:00.000Z', [
    { name: 'Andrew', rank: 1, score: -1 },
    { name: 'Bill', rank: 2, score: 11 },
    { name: 'Tim', rank: 3, score: 14 },
    { name: 'Kyle', rank: 4, score: 18 },
    { name: 'Brad', rank: 5, score: 22 },
    { name: 'Wyatt', rank: 6, score: 23 },
    { name: 'Connor', rank: 6, score: 23 },
    { name: 'Andy', rank: 8, score: 26 },
  ]),
];
