import type { ParticipantLeaderboardRow } from '../types';

const PREVIOUS_CHAMPION = 'Kyle';
const STATIC_SUFFIXES: Record<string, string> = {
  Connor: '🍆',
};

export function participantNameSuffix(
  row: ParticipantLeaderboardRow,
  rows: ParticipantLeaderboardRow[]
): string {
  const suffixes: string[] = [];

  if (row.participant.name === PREVIOUS_CHAMPION) {
    suffixes.push('👑');
  }

  const staticSuffix = STATIC_SUFFIXES[row.participant.name];
  if (staticSuffix) {
    suffixes.push(staticSuffix);
  }

  if (isLastScoredPlace(row, rows)) {
    suffixes.push('💩');
  }

  return suffixes.length > 0 ? ` ${suffixes.join(' ')}` : '';
}

function isLastScoredPlace(
  row: ParticipantLeaderboardRow,
  rows: ParticipantLeaderboardRow[]
): boolean {
  if (row.totalScore === null) return false;

  const scoredTotals = rows
    .map((candidate) => candidate.totalScore)
    .filter((score): score is number => score !== null);

  if (scoredTotals.length === 0) return false;

  return row.totalScore === Math.max(...scoredTotals);
}
