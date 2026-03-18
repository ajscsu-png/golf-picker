import { NextRequest, NextResponse } from 'next/server';
import { getTournamentById, getParticipants, getPicks, getCuts, setCuts } from '@/lib/sheets';
import { getCurrentRound } from '@/lib/espn';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const [cuts, tournament] = await Promise.all([
    getCuts(params.id),
    getTournamentById(params.id),
  ]);
  const round = tournament ? await getCurrentRound(tournament.espnEventId) : 1;
  return NextResponse.json({ cuts, round, locked: round >= 3 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { participantName, cuts } = await req.json() as {
    participantName: string;
    cuts: Array<{ golferEspnId: string; golferName: string; dropNumber: number }>;
  };

  if (!participantName || !Array.isArray(cuts)) {
    return NextResponse.json({ error: 'participantName and cuts array required' }, { status: 400 });
  }

  const [tournament, participants, picks] = await Promise.all([
    getTournamentById(params.id),
    getParticipants(params.id),
    getPicks(params.id),
  ]);

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Check if Round 3 has started
  const round = await getCurrentRound(tournament.espnEventId);
  if (round >= 3) {
    return NextResponse.json({ error: 'Cuts are locked — Round 3 has begun.' }, { status: 403 });
  }

  const participant = participants.find((p) => p.name === participantName);
  if (!participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  if (cuts.length > tournament.cutsPerPerson) {
    return NextResponse.json(
      { error: `Can only cut up to ${tournament.cutsPerPerson} golfer(s)` },
      { status: 400 }
    );
  }

  const myPicks = picks.filter((p) => p.participantName === participantName);
  const myGolferIds = new Set(myPicks.map((p) => p.golferEspnId));
  for (const cut of cuts) {
    if (!myGolferIds.has(cut.golferEspnId)) {
      return NextResponse.json({ error: `${cut.golferName} was not picked by ${participantName}` }, { status: 400 });
    }
  }

  await setCuts(params.id, participantName, cuts);
  return NextResponse.json({ ok: true });
}
