import type { Pick } from '@/types';

export function isSnakeDraftPick(pick: Pick): boolean {
  return pick.roundNumber > 0;
}

export function getCuttablePicksForParticipant(picks: Pick[], participantName: string): Pick[] {
  return picks.filter((pick) => pick.participantName === participantName && isSnakeDraftPick(pick));
}
