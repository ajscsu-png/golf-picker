import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { pickTournamentFields } from '@/lib/tournamentFields';
import { deleteTournament, getTournamentById, updateTournament } from '@/lib/sheets';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const params = await props.params;
  const { id } = params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }
  const body = await req.json();
  const fields = pickTournamentFields(body);
  if (!fields) {
    return NextResponse.json({ error: 'Invalid tournament fields' }, { status: 400 });
  }
  await updateTournament(id, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const params = await props.params;
  const { id } = params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }
  await deleteTournament(id);
  return NextResponse.json({ ok: true });
}
