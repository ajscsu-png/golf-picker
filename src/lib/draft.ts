import type { Participant, Pick, DraftSlot } from '@/types';

/**
 * Generate the full ordered draft slot list.
 *
 * Round 0 — single golfer draft: each person picks one golfer in draftPosition
 * order (1 → N). The last picker in round 0 earns the first pick in the snake.
 *
 * Rounds 1+ — snake draft with reversed starting order so the round-0 last
 * picker goes first:
 *   Odd rounds (1, 3, 5...): N → 1
 *   Even rounds (2, 4, 6...): 1 → N
 */
export function computeDraftOrder(
  participants: Participant[],
  picksPerPerson: number,
  hasSingleDraft = false
): DraftSlot[] {
  const sorted = [...participants].sort((a, b) => a.draftPosition - b.draftPosition);
  const slots: DraftSlot[] = [];
  let overall = 1;

  if (hasSingleDraft) {
    // Round 0: single golfer draft in draftPosition order (1 → N)
    sorted.forEach((p, idx) => {
      slots.push({
        overallPickNumber: overall++,
        roundNumber: 0,
        pickInRound: idx + 1,
        participantName: p.name,
      });
    });
  }

  // Snake draft: if hasSingleDraft, reversed so the last round-0 picker goes first
  const snakeSorted = hasSingleDraft ? [...sorted].reverse() : sorted;

  for (let round = 1; round <= picksPerPerson; round++) {
    const roundParticipants = round % 2 === 1 ? snakeSorted : [...snakeSorted].reverse();
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
  picksPerPerson: number,
  hasSingleDraft = false
): boolean {
  const totalRounds = picksPerPerson + (hasSingleDraft ? 1 : 0);
  return picks.length >= participants.length * totalRounds;
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
