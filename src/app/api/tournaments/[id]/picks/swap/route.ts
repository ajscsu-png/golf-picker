import { NextRequest, NextResponse } from 'next/server';
import { getTournamentById, getPicks, getParticipants, swapPick, isGolferPicked } from '@/lib/sheets';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { participantName, oldGolferEspnId, newGolferEspnId, newGolferName } = await req.json();

  if (!participantName || !oldGolferEspnId || !newGolferEspnId || !newGolferName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const [tournament, participants, picks] = await Promise.all([
    getTournamentById(params.id),
    getParticipants(params.id),
    getPicks(params.id),
  ]);

  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  if (!participants.some((p) => p.name === participantName)) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  const hasPick = picks.some(
    (p) => p.participantName === participantName && p.golferEspnId === oldGolferEspnId
  );
  if (!hasPick) {
    return NextResponse.json({ error: 'Original pick not found for this participant' }, { status: 404 });
  }

  const alreadyPicked = await isGolferPicked(params.id, newGolferEspnId);
  if (alreadyPicked) {
    return NextResponse.json({ error: `${newGolferName} is already picked by someone else` }, { status: 409 });
  }

  await swapPick(params.id, participantName, oldGolferEspnId, newGolferEspnId, newGolferName);
  return NextResponse.json({ ok: true });
}
