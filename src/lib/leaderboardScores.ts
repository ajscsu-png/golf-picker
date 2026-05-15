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
