import { notFound } from 'next/navigation';
import {
  getTournamentById,
  getParticipants,
  getPicks,
  getScores,
} from '@/lib/sheets';
import type { ParticipantLeaderboardRow, GolferScore } from '@/types';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';

export const revalidate = 60;

interface Props {
  params: { tournamentId: string };
}

function buildLeaderboard(
  participants: Awaited<ReturnType<typeof getParticipants>>,
  picks: Awaited<ReturnType<typeof getPicks>>,
  scores: GolferScore[]
): ParticipantLeaderboardRow[] {
  const scoreMap = new Map(scores.map((s) => [s.golferEspnId, s]));

  const rows = participants.map((participant) => {
    const myPicks = picks.filter((p) => p.participantName === participant.name);
    const golfers = myPicks.map((pick) => {
      const score = scoreMap.get(pick.golferEspnId);
      return score
        ? { ...score, picked: true }
        : {
            tournamentId: pick.tournamentId,
            golferEspnId: pick.golferEspnId,
            golferName: pick.golferName,
            position: '',
            totalScore: null,
            r1: null,
            r2: null,
            r3: null,
            r4: null,
            status: 'active' as const,
            picked: true,
          };
    });

    const scoredGolfers = golfers.filter((g) => g.totalScore !== null);
    const totalScore =
      scoredGolfers.length > 0
        ? scoredGolfers.reduce((sum, g) => sum + (g.totalScore ?? 0), 0)
        : null;

    return { participant, golfers, totalScore, rank: 0 };
  });

  // Sort by totalScore (ascending; null treated as worst)
  rows.sort((a, b) => {
    if (a.totalScore === null && b.totalScore === null) return 0;
    if (a.totalScore === null) return 1;
    if (b.totalScore === null) return -1;
    return a.totalScore - b.totalScore;
  });

  // Assign ranks (ties get the same rank)
  let rank = 1;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && rows[i].totalScore !== rows[i - 1].totalScore) {
      rank = i + 1;
    }
    rows[i].rank = rank;
  }

  return rows;
}

export default async function LeaderboardPage({ params }: Props) {
  const [tournament, participants, picks, scores] = await Promise.all([
    getTournamentById(params.tournamentId),
    getParticipants(params.tournamentId),
    getPicks(params.tournamentId),
    getScores(params.tournamentId),
  ]);

  if (!tournament) notFound();

  const rows = buildLeaderboard(participants, picks, scores);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tournament.name} {tournament.year}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Leaderboard — lower is better</p>
        </div>
        {tournament.status === 'draft' && (
          <Link
            href={`/draft/${tournament.id}`}
            className="text-sm text-green-600 hover:underline"
          >
            ← Back to Draft
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No participants yet.</p>
        </div>
      ) : scores.length === 0 ? (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            No scores yet — scores update automatically every 15 minutes once the tournament begins.
          </div>
          <Leaderboard rows={rows} />
        </div>
      ) : (
        <Leaderboard rows={rows} />
      )}
    </div>
  );
}
