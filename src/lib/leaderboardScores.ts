export function computeRawTotalScore(scores: number[]): number | null {
  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) : null;
}

export function computeProjectedCutTotalScore(scores: number[], cutsToProject: number): number | null {
  if (scores.length === 0) return null;

  const sortedBestFirst = [...scores].sort((a, b) => a - b);
  const countingCount = cutsToProject > 0 && sortedBestFirst.length > cutsToProject
    ? sortedBestFirst.length - cutsToProject
    : sortedBestFirst.length;

  return sortedBestFirst.slice(0, countingCount).reduce((sum, score) => sum + score, 0);
}

interface CutLineScore {
  totalScore: number | null;
  status: 'active' | 'cut' | 'wd' | 'dq';
  r1?: number | null;
  r2?: number | null;
  r3: number | null;
}

export function computeTournamentCutLine(
  tournamentName: string,
  scores: CutLineScore[]
): { score: number; official: boolean } | null {
  const officiallyCut = scores
    .filter((score) => score.status === 'cut' && score.totalScore !== null)
    .map((score) => score.totalScore as number);

  if (officiallyCut.length > 0) {
    return { score: Math.min(...officiallyCut), official: true };
  }

  const official = scores.some((score) => score.r3 !== null);
  const qualifyingPosition = tournamentName.toLowerCase().includes('masters') ? 50 : 70;
  const eligibleScores = scores
    .filter((score) => score.status !== 'wd' && score.status !== 'dq')
    .map((score) => {
      if (official && score.r1 != null && score.r2 != null) return score.r1 + score.r2;
      return score.totalScore;
    })
    .filter((score): score is number => score !== null)
    .sort((a, b) => a - b);

  if (eligibleScores.length < qualifyingPosition) return null;
  return { score: eligibleScores[qualifyingPosition - 1], official };
}
