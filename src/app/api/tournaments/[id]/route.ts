import { NextRequest, NextResponse } from 'next/server';
import { deleteTournament, getTournamentById, updateTournament } from '@/lib/sheets';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }
  const body = await req.json();
  await updateTournament(id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }
  await deleteTournament(id);
  return NextResponse.json({ ok: true });
}
