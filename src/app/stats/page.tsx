import { getTournaments, getParticipants, getPicks, getScores, getCuts } from '@/lib/sheets';
import type { GolferScore, Cut } from '@/types';
import Link from 'next/link';

export const revalidate = 300;

interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  year: number;
  participantName: string;
  totalScore: number | null;
  rank: number;
}

function computeScore(
  participantName: string,
  picks: Awaited<ReturnType<typeof getPicks>>,
  scores: GolferScore[],
  cuts: Cut[]
): number | null {
  const scoreMap = new Map(scores.map((s) => [s.golferEspnId, s]));
  const cutIds = new Set(cuts.filter((c) => c.participantName === participantName).map((c) => c.golferEspnId));
  const myPicks = picks.filter((p) => p.participantName === participantName);
  const scored = myPicks
    .filter((p) => !cutIds.has(p.golferEspnId))
    .map((p) => scoreMap.get(p.golferEspnId)?.totalScore ?? null)
    .filter((s): s is number => s !== null);
  return scored.length > 0 ? scored.reduce((a, b) => a + b, 0) : null;
}

export default async function StatsPage() {
  const allTournaments = await getTournaments();
  const majors = allTournaments.filter((t) => t.isMajor && t.status === 'completed');

  if (majors.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">All-Time Major Stats</h1>
        <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400">
          <p className="text-lg font-medium">No completed majors yet.</p>
          <p className="text-sm mt-1">Stats will appear here once a major tournament is completed.</p>
        </div>
      </div>
    );
  }

  // Fetch all data in parallel
  const tournamentData = await Promise.all(
    majors.map(async (t) => {
      const [participants, picks, scores, cuts] = await Promise.all([
        getParticipants(t.id),
        getPicks(t.id),
        getScores(t.id),
        getCuts(t.id),
      ]);
      return { tournament: t, participants, picks, scores, cuts };
    })
  );

  // Build results per tournament
  const allResults: TournamentResult[] = [];
  for (const { tournament, participants, picks, scores, cuts } of tournamentData) {
    const rows = participants.map((p) => ({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      year: tournament.year,
      participantName: p.name,
      totalScore: computeScore(p.name, picks, scores, cuts),
    }));
    rows.sort((a, b) => {
      if (a.totalScore === null && b.totalScore === null) return 0;
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      return a.totalScore - b.totalScore;
    });
    let rank = 1;
    rows.forEach((r, i) => {
      if (i > 0 && r.totalScore !== rows[i - 1].totalScore) rank = i + 1;
      allResults.push({ ...r, rank });
    });
  }

  // Collect all unique participants
  const allNames = Array.from(new Set(allResults.map((r) => r.participantName))).sort();

  // Compute per-person stats
  const stats = allNames.map((name) => {
    const results = allResults.filter((r) => r.participantName === name && r.totalScore !== null);
    const wins = results.filter((r) => r.rank === 1).length;
    const podiums = results.filter((r) => r.rank <= 3).length;
    const played = allResults.filter((r) => r.participantName === name).length;
    const scores = results.map((r) => r.totalScore as number);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const best = scores.length > 0 ? Math.min(...scores) : null;
    const worst = scores.length > 0 ? Math.max(...scores) : null;
    return { name, wins, podiums, played, avg, best, worst };
  });

  stats.sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || (a.avg ?? 999) - (b.avg ?? 999));

  function scoreDisplay(s: number | null) {
    if (s === null) return '—';
    if (s === 0) return 'E';
    return s > 0 ? `+${s}` : String(s);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All-Time Major Stats</h1>
        <p className="text-gray-500 text-sm mt-0.5">{majors.length} major{majors.length !== 1 ? 's' : ''} completed</p>
      </div>

      {/* All-time standings */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All-Time Standings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left py-2 px-5">Player</th>
                <th className="text-center py-2 px-3">🏆 Wins</th>
                <th className="text-center py-2 px-3">🥉 Podiums</th>
                <th className="text-center py-2 px-3">Played</th>
                <th className="text-center py-2 px-3">Avg Score</th>
                <th className="text-center py-2 px-3">Best</th>
                <th className="text-center py-2 px-3">Worst</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.name} className="border-t border-gray-50">
                  <td className="py-3 px-5 font-medium text-gray-800 flex items-center gap-2">
                    {i === 0 && s.wins > 0 && <span>👑</span>}
                    {s.name}
                  </td>
                  <td className="text-center py-3 px-3 font-bold text-green-700">{s.wins}</td>
                  <td className="text-center py-3 px-3 text-gray-600">{s.podiums}</td>
                  <td className="text-center py-3 px-3 text-gray-500">{s.played}</td>
                  <td className="text-center py-3 px-3 text-gray-600">{s.avg !== null ? scoreDisplay(Math.round(s.avg)) : '—'}</td>
                  <td className="text-center py-3 px-3 text-red-600 font-medium">{scoreDisplay(s.best)}</td>
                  <td className="text-center py-3 px-3 text-gray-400">{scoreDisplay(s.worst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-tournament results */}
      <section className="space-y-4">
        <h2 className="font-semibold text-gray-800">Tournament Results</h2>
        {tournamentData.map(({ tournament }) => {
          const tResults = allResults
            .filter((r) => r.tournamentId === tournament.id)
            .sort((a, b) => a.rank - b.rank);
          const winner = tResults.find((r) => r.rank === 1);
          return (
            <div key={tournament.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{tournament.name} {tournament.year}</h3>
                  {winner && <p className="text-sm text-green-700 mt-0.5">🏆 Won by {winner.participantName}</p>}
                </div>
                <Link href={`/leaderboard/${tournament.id}`} className="text-xs text-blue-600 hover:underline">
                  Full results →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {tResults.map((r) => (
                  <div key={r.participantName} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 w-5 text-right font-medium">{r.rank}</span>
                      <span className={r.rank === 1 ? 'font-bold text-gray-900' : 'text-gray-700'}>{r.participantName}</span>
                    </div>
                    <span className={`font-medium ${r.totalScore !== null && r.totalScore < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {scoreDisplay(r.totalScore)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
