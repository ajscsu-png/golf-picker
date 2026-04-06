import { NextRequest, NextResponse } from 'next/server';
import { getPlayerPhones, setPlayerPhones } from '@/lib/sheets';

export async function GET() {
  const phones = await getPlayerPhones();
  const players = Array.from(phones.entries()).map(([name, phone]) => ({ name, phone }));
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { players } = body as { players: Array<{ name: string; phone: string }> };

  if (!Array.isArray(players)) {
    return NextResponse.json({ error: 'players array required' }, { status: 400 });
  }

  // Basic E.164 validation
  for (const p of players) {
    if (p.phone && !/^\+[1-9]\d{7,14}$/.test(p.phone)) {
      return NextResponse.json(
        { error: `Invalid phone for ${p.name}: use E.164 format e.g. +15551234567` },
        { status: 400 }
      );
    }
  }

  await setPlayerPhones(players.filter((p) => p.phone));
  return NextResponse.json({ ok: true });
}
