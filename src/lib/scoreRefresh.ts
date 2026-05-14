interface ScoreRefreshResult {
  tournamentId?: string;
  golferCount?: number;
}

interface ScoreRefreshResponse {
  updated?: ScoreRefreshResult[];
}

export function getUpdatedGolferCount(data: ScoreRefreshResponse, tournamentId?: string): number {
  const results = data.updated;
  if (!results || results.length === 0) return 0;

  const result = tournamentId
    ? results.find((item) => item.tournamentId === tournamentId)
    : results[0];

  return result?.golferCount ?? 0;
}
