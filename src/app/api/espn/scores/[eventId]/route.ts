import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/espn';

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const scores = await getLeaderboard(params.eventId);
  return NextResponse.json(scores);
}
