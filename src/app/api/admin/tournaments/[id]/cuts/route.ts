import { NextRequest, NextResponse } from 'next/server';
import { getCuts, getParticipants, getPicks, getTournamentById, setCuts } from '@/lib/sheets';
import { getCuttablePicksForParticipant } from '@/lib/cutPool';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_token')?.value === process.env.ADMIN_TOKEN;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) return unauthorized();

  const [tournament, participants, picks, cuts] = await Promise.all([
    getTournamentById(params.id),
    getParticipants(params.id),
    getPicks(params.id),
    getCuts(params.id),
  ]);

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  return NextResponse.json({ tournament, participants, picks, cuts });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) return unauthorized();

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

  const myPicks = getCuttablePicksForParticipant(picks, participantName);
  const myGolferIds = new Set(myPicks.map((p) => p.golferEspnId));
  const seenGolferIds = new Set<string>();

  for (const cut of cuts) {
    if (!myGolferIds.has(cut.golferEspnId)) {
      return NextResponse.json({ error: `${cut.golferName} was not picked by ${participantName}` }, { status: 400 });
    }
    if (seenGolferIds.has(cut.golferEspnId)) {
      return NextResponse.json({ error: `${cut.golferName} was selected more than once` }, { status: 400 });
    }
    seenGolferIds.add(cut.golferEspnId);
  }

  const normalizedCuts = cuts.map((cut, idx) => {
    const pick = myPicks.find((p) => p.golferEspnId === cut.golferEspnId);
    return {
      golferEspnId: cut.golferEspnId,
      golferName: pick?.golferName ?? cut.golferName,
      dropNumber: idx + 1,
    };
  });

  await setCuts(params.id, participantName, normalizedCuts);
  return NextResponse.json({ ok: true, cuts: normalizedCuts });
}
