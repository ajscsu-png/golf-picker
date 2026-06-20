import { NextRequest, NextResponse } from 'next/server';
import { setActiveTournament, setConfig } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 });
  }

  if (key === 'active_tournament_id') {
    const tournament = await setActiveTournament(value);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, tournament });
  }

  await setConfig(key, value);
  return NextResponse.json({ ok: true });
}
