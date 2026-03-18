import { NextRequest, NextResponse } from 'next/server';
import { getTournamentById, getParticipants, getPicks, getCuts, setCuts } from '@/lib/sheets';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cuts = await getCuts(params.id);
  return NextResponse.json(cuts);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { participantName, cuts } = await req.json() as {
    participantName: string;
    cuts: Array<{ golferEspnId: string; golferName: string }>;
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

  // Validate all cut golfers were actually picked by this participant
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
