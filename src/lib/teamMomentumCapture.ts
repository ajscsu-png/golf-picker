import type {
  Cut,
  GolferScore,
  Participant,
  Pick,
  TeamScoreSnapshot,
} from '@/types';
import { findScoreForPick } from '@/lib/golferIdentity';
import {
  buildTeamScoreSnapshots,
  computeDisplayedTeamTotal,
  parseTeeTimeMinutes,
} from '@/lib/teamMomentum';

interface CaptureInput {
  tournamentId: string;
  participants: Participant[];
  picks: Pick[];
  scores: GolferScore[];
  cuts: Cut[];
  existing: TeamScoreSnapshot[];
  now: Date;
}

export function captureTeamMomentum(input: CaptureInput): TeamScoreSnapshot[] {
  return input.participants.flatMap((participant) => {
    const participantPicks = input.picks.filter(
      (pick) => pick.participantName === participant.name && pick.roundNumber > 0
    );
    const droppedIds = new Set(
      input.cuts
        .filter((cut) => cut.participantName === participant.name)
        .map((cut) => cut.golferEspnId)
    );
    const golfers = participantPicks.map((pick) => ({
      score: findScoreForPick(input.scores, pick),
      dropped: droppedIds.has(pick.golferEspnId),
    }));
    const currentTotal = computeDisplayedTeamTotal(
      golfers.map(({ score, dropped }) => ({ totalScore: score?.totalScore ?? null, dropped }))
    );
    if (currentTotal === null) return [];

    const teeTimes = golfers
      .filter(({ dropped }) => !dropped)
      .map(({ score }) => score?.teeTime ?? null)
      .filter((teeTime): teeTime is string => parseTeeTimeMinutes(teeTime) !== null)
      .sort((a, b) => (parseTeeTimeMinutes(a) as number) - (parseTeeTimeMinutes(b) as number));

    return buildTeamScoreSnapshots({
      tournamentId: input.tournamentId,
      participantName: participant.name,
      now: input.now,
      currentTotal,
      earliestTeeTime: teeTimes[0] ?? null,
      latestTeeTime: teeTimes.at(-1) ?? null,
      existing: input.existing,
    });
  });
}

export async function persistTeamMomentumSafely(
  snapshots: TeamScoreSnapshot[],
  writer: (snapshots: TeamScoreSnapshot[]) => Promise<void>
): Promise<{ captured: number; warning?: string }> {
  if (snapshots.length === 0) return { captured: 0 };
  try {
    await writer(snapshots);
    return { captured: snapshots.length };
  } catch {
    return { captured: 0, warning: 'Team momentum history was not saved' };
  }
}
