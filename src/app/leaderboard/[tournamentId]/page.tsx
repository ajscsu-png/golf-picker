import { notFound } from 'next/navigation';
import {
  getTournamentById,
  getParticipants,
  getPicks,
  getScores,
  getCuts,
  getTrashMessages,
} from '@/lib/sheets';
import type { ParticipantLeaderboardRow, GolferScore, Cut } from '@/types';
import Leaderboard from '@/components/Leaderboard';
import LeaderboardToggle from '@/components/LeaderboardToggle';
import RefreshScoresButton from '@/components/RefreshScoresButton';
import TrashTalk from '@/components/TrashTalk';
import TournamentFactsCard from '@/components/TournamentFacts';
import { getTournamentFacts } from '@/lib/tournamentFacts';
import Link from 'next/link';

export const revalidate = 60;

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
  const scoreMap = new Map(scores.map((s) => [s.golferEspnId, s]));

  // Bubble score = worst final totalScore among golfers who made the cut (status active)
  const madeTheCut = scores.filter((s) => s.status === 'active' && s.totalScore !== null);
  const bubbleScore = madeTheCut.length > 0
    ? Math.max(...madeTheCut.map((s) => s.totalScore as number))
    : null;

  const rows = participants.map((participant) => {
    const myPicks = picks
      .filter((p) => p.participantName === participant.name)
      .filter((p) => roundNumbers === undefined || roundNumbers.includes(p.roundNumber));
    const myCuts = cuts.filter((c) => c.participantName === participant.name);
    const myCutMap = new Map(myCuts.map((c) => [c.golferEspnId, c]));

    const golfers = myPicks.map((pick) => {
      const score = scoreMap.get(pick.golferEspnId);
      const cut = myCutMap.get(pick.golferEspnId);
      const dropped = !!cut;
      const isThirdDrop = cut?.dropNumber === 3;
      const missedCut = score && score.status !== 'active';

      // 3rd drop on a missed-cut golfer → apply bubble score penalty instead of excluding
      // Bubble applies when: golfer missed the cut AND wasn't dropped AND cuts are enabled
      // This covers both "too many missed cuts" and the explicit 3rd-drop mechanic
      const isUndroppedMissedCut = cutsPerPerson > 0 && !dropped && !!missedCut;
      const applyBubble = (isThirdDrop || isUndroppedMissedCut) && bubbleScore !== null;

      let effectiveScore = score ? { ...score, picked: true, dropped, bubbleApplied: false } : {
        tournamentId: pick.tournamentId,
        golferEspnId: pick.golferEspnId,
        golferName: pick.golferName,
        position: '',
        totalScore: null,
        r1: null, r2: null, r3: null, r4: null,
        status: 'active' as const,
        picked: true,
        dropped,
        bubbleApplied: false,
      };

      if (applyBubble) {
        effectiveScore = { ...effectiveScore, totalScore: bubbleScore, dropped: false, bubbleApplied: true };
      }

      return effectiveScore;
    });

    const scoredGolfers = golfers.filter((g) => g.totalScore !== null && !g.dropped);
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
  const [tournament, participants, picks, scores, cuts, trashMessages] = await Promise.all([
    getTournamentById(params.tournamentId),
    getParticipants(params.tournamentId),
    getPicks(params.tournamentId),
    getScores(params.tournamentId),
    getCuts(params.tournamentId),
    getTrashMessages(params.tournamentId),
  ]);

  if (!tournament) notFound();

  const rows = buildLeaderboard(participants, picks, scores, cuts, tournament.cutsPerPerson);
  const singleRows = tournament.hasSingleDraft
    ? buildLeaderboard(participants, picks, scores, cuts, tournament.cutsPerPerson, [0])
    : [];
  const snakeRows = tournament.hasSingleDraft
    ? buildLeaderboard(participants, picks, scores, cuts, tournament.cutsPerPerson, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    : [];
  const facts = getTournamentFacts(tournament.name);

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
          {tournament.status === 'active' && <RefreshScoresButton />}
        </div>
      </div>

      {facts && <TournamentFactsCard facts={facts} />}

      {participants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No participants yet.</p>
        </div>
      ) : scores.length === 0 ? (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            No scores yet — scores update automatically every 15 minutes once the tournament begins.
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
