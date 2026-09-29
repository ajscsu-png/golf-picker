import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/espn';

export async function GET(_req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const scores = await getLeaderboard(params.eventId);
  return NextResponse.json(scores);
}
