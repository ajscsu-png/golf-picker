import type { Cut, Pick } from '@/types';

export function isSnakeDraftPick(pick: Pick): boolean {
  return pick.roundNumber > 0;
}

export function getCuttablePicksForParticipant(picks: Pick[], participantName: string): Pick[] {
  return picks.filter((pick) => pick.participantName === participantName && isSnakeDraftPick(pick));
}

export function getCuttableCutsForParticipant(cuts: Cut[], picks: Pick[], participantName: string): Cut[] {
  const cuttableGolferIds = new Set(
    getCuttablePicksForParticipant(picks, participantName).map((pick) => pick.golferEspnId)
  );

  return cuts
    .filter((cut) => cut.participantName === participantName && cuttableGolferIds.has(cut.golferEspnId))
    .sort((a, b) => a.dropNumber - b.dropNumber);
}
