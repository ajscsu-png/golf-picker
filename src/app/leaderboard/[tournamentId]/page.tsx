import { notFound } from 'next/navigation';
import {
  getTournamentById,
  getParticipants,
  getPicks,
  getScores,
  getCuts,
  getTrashMessages,
  getConfig,
} from '@/lib/sheets';
import type { ParticipantLeaderboardRow, GolferScore, Cut } from '@/types';
import Leaderboard from '@/components/Leaderboard';
import LeaderboardToggle from '@/components/LeaderboardToggle';
import RefreshScoresButton from '@/components/RefreshScoresButton';
import TrashTalk from '@/components/TrashTalk';
import TournamentFactsCard from '@/components/TournamentFacts';
import BroadcastInfoCard from '@/components/BroadcastInfo';
import { getTournamentFacts } from '@/lib/tournamentFacts';
import { getBroadcastInfo } from '@/lib/broadcastSchedule';
import { findScoreForPick } from '@/lib/golferIdentity';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: { tournamentId: string };
}

function buildLeaderboard(
  participants: Awaited<ReturnType<typeof getParticipants>>,
  picks: Awaited<ReturnType<typeof getPicks>>,
  scores: GolferScore[],
  cuts: Cut[],
  cutsPerPerson: number,
  roundNumbers?: number[]
): ParticipantLeaderboardRow[] {
  const rows = participants.map((participant) => {
    const myPicks = picks
      .filter((p) => p.participantName === participant.name)
      .filter((p) => roundNumbers === undefined || roundNumbers.includes(p.roundNumber));
    const myCuts = cuts.filter((c) => c.participantName === participant.name);
    const myCutMap = new Map(myCuts.map((c) => [c.golferEspnId, c]));

    const golfers = myPicks.map((pick) => {
      const score = findScoreForPick(scores, pick);
      const dropped = !!myCutMap.get(pick.golferEspnId);
      return score
        ? { ...score, picked: true, dropped, bubbleApplied: false }
        : {
            tournamentId: pick.tournamentId,
            golferEspnId: pick.golferEspnId,
            golferName: pick.golferName,
            position: '',
            totalScore: null,
            r1: null, r2: null, r3: null, r4: null,
            thru: null,
            teeTime: null,
            status: 'active' as const,
            picked: true,
            dropped,
            bubbleApplied: false,
          };
    });

    // Sort non-dropped scored golfers best-first, then take the best N.
    // Only exclude (cutsPerPerson - droppedCount) additional golfers beyond
    // those already explicitly dropped, so submitted cuts don't double-count.
    const droppedCount = golfers.filter((g) => g.dropped).length;
    const additionalToExclude = Math.max(0, cutsPerPerson - droppedCount);

    const scoredGolfers = golfers
      .filter((g) => g.totalScore !== null && !g.dropped)
      .sort((a, b) => (a.totalScore as number) - (b.totalScore as number));

    const countingCount = additionalToExclude > 0 && scoredGolfers.length > additionalToExclude
      ? scoredGolfers.length - additionalToExclude
      : scoredGolfers.length;

    const totalScore = countingCount > 0
      ? scoredGolfers.slice(0, countingCount).reduce((sum, g) => sum + (g.totalScore as number), 0)
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
  const [tournament, participants, picks, scores, cuts, trashMessages, lastUpdatedRaw] = await Promise.all([
    getTournamentById(params.tournamentId),
    getParticipants(params.tournamentId),
    getPicks(params.tournamentId),
    getScores(params.tournamentId),
    getCuts(params.tournamentId),
    getTrashMessages(params.tournamentId),
    getConfig('last_scores_updated'),
  ]);

  const lastUpdated = (() => {
    if (!lastUpdatedRaw) return null;
    const mins = Math.floor((Date.now() - new Date(lastUpdatedRaw).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    return `${mins} min ago`;
  })();

  if (!tournament) notFound();

  const rows = buildLeaderboard(participants, picks, scores, cuts, tournament.cutsPerPerson);
  const singleRows = tournament.hasSingleDraft
    ? buildLeaderboard(participants, picks, scores, cuts, tournament.cutsPerPerson, [0])
    : [];
  const snakeRows = tournament.hasSingleDraft
    ? buildLeaderboard(participants, picks, scores, cuts, tournament.cutsPerPerson, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    : [];
  const facts = getTournamentFacts(tournament.name);
  const broadcastInfo = getBroadcastInfo(tournament.name, tournament.year);

  // Projected cut line: use best score among officially cut golfers if available,
  // otherwise project using the 50th active golfer (Masters cuts top 50 + ties)
  const cutLine = (() => {
    if (scores.length === 0) return null;
    const cutGolfers = scores.filter((s) => s.status === 'cut' && s.totalScore !== null);
    if (cutGolfers.length > 0) {
      return Math.min(...cutGolfers.map((s) => s.totalScore as number));
    }
    const active = scores
      .filter((s) => s.status === 'active' && s.totalScore !== null)
      .sort((a, b) => (a.totalScore as number) - (b.totalScore as number));
    return active.length >= 50 ? active[49].totalScore : null;
  })();

  function cutLineDisplay(score: number): string {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : String(score);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tournament.name} {tournament.year}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Leaderboard — lower is better</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {tournament.status === 'draft' && (
            <Link href={`/draft/${tournament.id}`} className="text-sm text-green-600 hover:underline">
              ← Back to Draft
            </Link>
          )}
          {tournament.cutsPerPerson > 0 && tournament.status === 'active' && (
            <Link href={`/cut/${tournament.id}`} className="text-sm text-red-600 hover:underline font-medium">
              ✂ Make Cuts →
            </Link>
          )}
          {tournament.status === 'active' && (
            <RefreshScoresButton tournamentId={tournament.id} lastUpdated={lastUpdated} autoRefresh />
          )}
        </div>
      </div>

      {facts && <TournamentFactsCard facts={facts} />}

      {broadcastInfo && <BroadcastInfoCard info={broadcastInfo} />}

      {cutLine !== null && tournament.status === 'active' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
          <span>✂</span>
          <span>
            {scores.some((s) => s.status === 'cut') ? 'Cut line' : 'Projected cut'}:
            {' '}<span className="font-semibold text-gray-800">{cutLineDisplay(cutLine)}</span>
          </span>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No participants yet.</p>
        </div>
      ) : scores.length === 0 ? (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            No scores yet — use Refresh Scores once the tournament begins.
          </div>
          {tournament.hasSingleDraft ? (
            <LeaderboardToggle singleRows={singleRows} snakeRows={snakeRows} />
          ) : (
            <Leaderboard rows={rows} />
          )}
        </div>
      ) : tournament.hasSingleDraft ? (
        <LeaderboardToggle singleRows={singleRows} snakeRows={snakeRows} />
      ) : (
        <Leaderboard rows={rows} />
      )}

      {(tournament.status === 'active' || tournament.status === 'completed') && (
        <TrashTalk
          tournamentId={tournament.id}
          participants={participants}
          initialMessages={trashMessages}
        />
      )}
    </div>
  );
}
