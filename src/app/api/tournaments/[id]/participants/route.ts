import { NextRequest, NextResponse } from 'next/server';
import { getParticipants, setParticipants, getPlayerPhones } from '@/lib/sheets';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const participants = await getParticipants(params.id);
  return NextResponse.json(participants);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { participants } = body as {
    participants: Array<{ name: string; draftPosition: number }>;
  };

  if (!Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json({ error: 'participants array required' }, { status: 400 });
  }

  const positions = participants.map((p) => p.draftPosition);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    return NextResponse.json({ error: 'Draft positions must be unique' }, { status: 400 });
  }

  // Look up phone numbers from the persistent Players directory
  const phoneMap = await getPlayerPhones();

  await setParticipants(
    params.id,
    participants.map((p) => ({ ...p, phone: phoneMap.get(p.name) }))
  );
  return NextResponse.json({ ok: true });
}
