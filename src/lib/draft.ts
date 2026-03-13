import type { Participant, Pick, DraftSlot } from '@/types';

/**
 * Generate the full ordered snake-draft slot list.
 * Odd rounds (1, 3, 5...): picks 1 → N
 * Even rounds (2, 4, 6...): picks N → 1
 */
export function computeDraftOrder(
  participants: Participant[],
  picksPerPerson: number
): DraftSlot[] {
  const sorted = [...participants].sort((a, b) => a.draftPosition - b.draftPosition);
  const slots: DraftSlot[] = [];
  let overall = 1;

  for (let round = 1; round <= picksPerPerson; round++) {
    const roundParticipants = round % 2 === 1 ? sorted : [...sorted].reverse();
    roundParticipants.forEach((p, idx) => {
      slots.push({
        overallPickNumber: overall++,
        roundNumber: round,
        pickInRound: idx + 1,
        participantName: p.name,
      });
    });
  }

  return slots;
}

/** Returns the next slot to be picked, or null if the draft is complete. */
export function getOnTheClock(
  draftOrder: DraftSlot[],
  picks: Pick[]
): DraftSlot | null {
  return draftOrder[picks.length] ?? null;
}

export function isDraftComplete(
  participants: Participant[],
  picks: Pick[],
  picksPerPerson: number
): boolean {
  return picks.length >= participants.length * picksPerPerson;
}

/** Server-side validation that the submitting participant is actually on the clock. */
export function validatePickTurn(
  draftOrder: DraftSlot[],
  picks: Pick[],
  claimedParticipantName: string
): { valid: boolean; error?: string } {
  const slot = draftOrder[picks.length];
  if (!slot) {
    return { valid: false, error: 'Draft is already complete.' };
  }
  if (slot.participantName !== claimedParticipantName) {
    return {
      valid: false,
      error: `It is ${slot.participantName}'s turn, not ${claimedParticipantName}'s.`,
    };
  }
  return { valid: true };
}
