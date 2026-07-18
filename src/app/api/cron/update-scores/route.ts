import { NextRequest, NextResponse } from 'next/server';
import {
  getCuts,
  getParticipants,
  getPicks,
  getTeamScoreHistory,
  getTournaments,
  upsertScores,
  upsertTeamScoreSnapshots,
} from '@/lib/sheets';
import { getLeaderboard } from '@/lib/espn';
import { captureTeamMomentum, persistTeamMomentumSafely } from '@/lib/teamMomentumCapture';

async function runUpdate() {
  const tournaments = await getTournaments();
  const active = tournaments.filter((t) => t.status === 'active');

  if (active.length === 0) {
    return { message: 'No active tournaments' };
  }

  const results = await Promise.all(
    active.map(async (tournament) => {
      const scores = await getLeaderboard(tournament.espnEventId, { noCache: true });
      const withId = scores.map((s) => ({ ...s, tournamentId: tournament.id }));
      await upsertScores(withId);
      const [participants, picks, cuts, existing] = await Promise.all([
        getParticipants(tournament.id),
        getPicks(tournament.id),
        getCuts(tournament.id),
        getTeamScoreHistory(tournament.id),
      ]);
      const snapshots = captureTeamMomentum({
        tournamentId: tournament.id,
        participants,
        picks,
        scores: withId,
        cuts,
        existing,
        now: new Date(),
      });
      const momentum = await persistTeamMomentumSafely(snapshots, upsertTeamScoreSnapshots);
      return { tournamentId: tournament.id, golferCount: scores.length, ...momentum };
    })
  );

  return { updated: results };
}

// Called by Vercel cron
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await runUpdate());
}

// Called by manual refresh button on leaderboard
export async function GET() {
  return NextResponse.json(await runUpdate());
}
