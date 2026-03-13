import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, upsertScores } from '@/lib/sheets';
import { getLeaderboard } from '@/lib/espn';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tournaments = await getTournaments();
  const active = tournaments.filter((t) => t.status === 'active');

  if (active.length === 0) {
    return NextResponse.json({ message: 'No active tournaments' });
  }

  const results = await Promise.all(
    active.map(async (tournament) => {
      const scores = await getLeaderboard(tournament.espnEventId, { noCache: true });
      // Replace the placeholder tournamentId with the real one
      const withId = scores.map((s) => ({ ...s, tournamentId: tournament.id }));
      await upsertScores(withId);
      return { tournamentId: tournament.id, golferCount: scores.length };
    })
  );

  return NextResponse.json({ updated: results });
}
