import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, createTournament } from '@/lib/sheets';

export async function GET() {
  const tournaments = await getTournaments();
  return NextResponse.json(tournaments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, year, espnEventId, picksPerPerson } = body;

  if (!name || !year || !espnEventId || !picksPerPerson) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const tournament = await createTournament({
    name,
    year: parseInt(year, 10),
    espnEventId,
    status: 'draft',
    picksPerPerson: parseInt(picksPerPerson, 10),
  });

  return NextResponse.json(tournament, { status: 201 });
}
