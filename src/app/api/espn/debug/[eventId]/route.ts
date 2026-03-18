import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary';
const SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;

  const [summaryRes, scoreboardRes] = await Promise.all([
    fetch(`${SUMMARY_BASE}?event=${eventId}`, { cache: 'no-store' }),
    fetch(`${SCOREBOARD_BASE}?event=${eventId}`, { cache: 'no-store' }),
  ]);

  const summaryBody = summaryRes.ok ? await summaryRes.json() : null;
  const scoreboardBody = scoreboardRes.ok ? await scoreboardRes.json() : null;

  const summaryCompetitors = summaryBody?.header?.competitions?.[0]?.competitors?.length ?? 0;
  const scoreboardCompetitors = scoreboardBody?.events?.[0]?.competitions?.[0]?.competitors?.length ?? 0;

  return NextResponse.json({
    summary: { status: summaryRes.status, competitors: summaryCompetitors },
    scoreboard: { status: scoreboardRes.status, competitors: scoreboardCompetitors },
  });
}
