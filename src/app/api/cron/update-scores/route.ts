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
import { isAdminRequest, isCronAuthorized } from '@/lib/auth';
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

// Vercel cron sends GET with `Authorization: Bearer $CRON_SECRET`; fails closed if unset.
// An authenticated admin session (leaderboard refresh button) is also accepted.
function authorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return (
    isCronAuthorized(authHeader) ||
    isAdminRequest(req.cookies.get('admin_token')?.value, authHeader)
  );
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await runUpdate());
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await runUpdate());
}
