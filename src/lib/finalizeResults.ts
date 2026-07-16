import type { Cut, FinalizedResult, GolferScore, Participant, Pick, PoolType, Tournament } from '../types';
import { findScoreForPick, normalizeGolferName } from './golferIdentity.ts';

interface FinalizeInput {
  tournament: Tournament;
  participants: Participant[];
  picks: Pick[];
  scores: GolferScore[];
  cuts: Cut[];
  finalizedAt: string;
}

interface UnrankedResult extends Omit<FinalizedResult, 'rank'> {}

function cutMatchesPick(cut: Cut, pick: Pick): boolean {
  return cut.golferEspnId === pick.golferEspnId
    || normalizeGolferName(cut.golferName) === normalizeGolferName(pick.golferName);
}

function scoreForPick(scores: GolferScore[], pick: Pick): number {
  const score = findScoreForPick(scores, pick);
  if (score?.totalScore === null || score?.totalScore === undefined) {
    throw new Error(`${pick.participantName}'s pick ${pick.golferName} is missing a final score`);
  }
  return score.totalScore;
}

function resultFor(
  tournament: Tournament,
  participantName: string,
  poolType: PoolType,
  totalScore: number,
  finalizedAt: string
): UnrankedResult {
  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    year: tournament.year,
    poolType,
    participantName,
    totalScore,
    finalizedAt,
  };
}

function applyCompetitionRanks(results: UnrankedResult[]): FinalizedResult[] {
  const ranked: FinalizedResult[] = [];
  for (const poolType of ['single', 'snake'] as const) {
    const poolResults = results
      .filter((result) => result.poolType === poolType)
      .sort((a, b) => a.totalScore - b.totalScore || a.participantName.localeCompare(b.participantName));
    let previousScore: number | undefined;
    let previousRank = 0;
    poolResults.forEach((result, index) => {
      const rank = previousScore === result.totalScore ? previousRank : index + 1;
      ranked.push({ ...result, rank });
      previousScore = result.totalScore;
      previousRank = rank;
    });
  }
  return ranked;
}

export function buildFinalizedResults({
  tournament, participants, picks, scores, cuts, finalizedAt,
}: FinalizeInput): FinalizedResult[] {
  const results: UnrankedResult[] = [];
  const expectedSnakeScores = tournament.picksPerPerson - tournament.cutsPerPerson;

  for (const participant of participants) {
    const participantPicks = picks.filter((pick) => pick.participantName === participant.name);

    if (tournament.hasSingleDraft) {
      const singlePicks = participantPicks.filter((pick) => pick.roundNumber === 0);
      if (singlePicks.length !== 1) {
        throw new Error(`${participant.name} needs exactly one Single pick before results can be finalized`);
      }
      results.push(resultFor(
        tournament,
        participant.name,
        'single',
        scoreForPick(scores, singlePicks[0]),
        finalizedAt
      ));
    }

    const snakePicks = participantPicks.filter((pick) => pick.roundNumber > 0);
    if (snakePicks.length !== tournament.picksPerPerson) {
      throw new Error(`${participant.name} needs ${tournament.picksPerPerson} Snake picks before results can be finalized`);
    }
    const participantCuts = cuts.filter((cut) => cut.participantName === participant.name);
    const eligiblePicks = snakePicks.filter((pick) => !participantCuts.some((cut) => cutMatchesPick(cut, pick)));
    if (eligiblePicks.length < expectedSnakeScores) {
      throw new Error(`${participant.name} has too many Snake drops to finalize results`);
    }
    const countingScores = eligiblePicks
      .map((pick) => scoreForPick(scores, pick))
      .sort((a, b) => a - b)
      .slice(0, expectedSnakeScores);
    if (countingScores.length !== expectedSnakeScores) {
      throw new Error(`${participant.name} has incomplete Snake scores`);
    }
    results.push(resultFor(
      tournament,
      participant.name,
      'snake',
      countingScores.reduce((sum, score) => sum + score, 0),
      finalizedAt
    ));
  }

  return applyCompetitionRanks(results);
}
