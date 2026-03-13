import { NextRequest, NextResponse } from 'next/server';
import {
  getTournamentById,
  getParticipants,
  getPicks,
  appendPick,
  isGolferPicked,
  updateTournamentStatus,
} from '@/lib/sheets';
import {
  computeDraftOrder,
  validatePickTurn,
  isDraftComplete,
} from '@/lib/draft';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const picks = await getPicks(params.id);
  return NextResponse.json(picks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { participantName, golferName, golferEspnId } = body as {
    participantName: string;
    golferName: string;
    golferEspnId: string;
  };

  if (!participantName || !golferName || !golferEspnId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Verify tournament exists and is in draft status
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }
  if (tournament.status !== 'draft') {
    return NextResponse.json({ error: 'Tournament is not in draft phase' }, { status: 409 });
  }

  // 2. Load participants and existing picks
  const [participants, picks] = await Promise.all([
    getParticipants(params.id),
    getPicks(params.id),
  ]);

  if (participants.length === 0) {
    return NextResponse.json({ error: 'No participants configured' }, { status: 409 });
  }

  // 3. Validate turn order
  const draftOrder = computeDraftOrder(participants, tournament.picksPerPerson);
  const turnCheck = validatePickTurn(draftOrder, picks, participantName);
  if (!turnCheck.valid) {
    return NextResponse.json({ error: turnCheck.error }, { status: 409 });
  }

  // 4. Check golfer not already picked
  const alreadyPicked = await isGolferPicked(params.id, golferEspnId);
  if (alreadyPicked) {
    return NextResponse.json({ error: 'Golfer already picked' }, { status: 409 });
  }

  // 5. Compute position metadata from draft order
  const slot = draftOrder[picks.length];

  // 6. Save the pick
  const pick = await appendPick({
    tournamentId: params.id,
    overallPickNumber: slot.overallPickNumber,
    roundNumber: slot.roundNumber,
    pickInRound: slot.pickInRound,
    participantName,
    golferName,
    golferEspnId,
  });

  // 7. If draft is now complete, move tournament to active
  const updatedPicks = [...picks, pick];
  if (isDraftComplete(participants, updatedPicks, tournament.picksPerPerson)) {
    await updateTournamentStatus(params.id, 'active');
  }

  return NextResponse.json(pick, { status: 201 });
}
