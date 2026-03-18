import { NextRequest, NextResponse } from 'next/server';
import { deleteTournament, getTournamentById } from '@/lib/sheets';

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
