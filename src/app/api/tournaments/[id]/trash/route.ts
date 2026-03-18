import { NextRequest, NextResponse } from 'next/server';
import { getTrashMessages, addTrashMessage, getTournamentById, getParticipants } from '@/lib/sheets';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const messages = await getTrashMessages(params.id);
  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { participantName, message } = await req.json();

  if (!participantName || !message?.trim()) {
    return NextResponse.json({ error: 'participantName and message required' }, { status: 400 });
  }

  if (message.trim().length > 280) {
    return NextResponse.json({ error: 'Message too long (max 280 chars)' }, { status: 400 });
  }

  const [tournament, participants] = await Promise.all([
    getTournamentById(params.id),
    getParticipants(params.id),
  ]);

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (!participants.some((p) => p.name === participantName)) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  const msg = await addTrashMessage(params.id, participantName, message.trim());
  return NextResponse.json(msg, { status: 201 });
}
