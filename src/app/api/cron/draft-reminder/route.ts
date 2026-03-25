import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, getParticipants, getPicks, getConfig, setConfig } from '@/lib/sheets';
import { computeDraftOrder, getOnTheClock } from '@/lib/draft';
import { sendSms } from '@/lib/twilio';

const REMINDER_MINUTES = 15;
const CONFIG_PICK_KEY = 'draft_clock_pick_number';
const CONFIG_SINCE_KEY = 'draft_clock_since';
const CONFIG_NOTIFIED_KEY = 'draft_clock_notified';

async function runReminder() {
  const tournaments = await getTournaments();
  const drafting = tournaments.filter((t) => t.status === 'draft');

  if (drafting.length === 0) {
    return { message: 'No tournaments in draft status' };
  }

  const results = [];

  for (const tournament of drafting) {
    const [participants, picks] = await Promise.all([
      getParticipants(tournament.id),
      getPicks(tournament.id),
    ]);

    const draftOrder = computeDraftOrder(participants, tournament.picksPerPerson, tournament.hasSingleDraft);
    const onTheClock = getOnTheClock(draftOrder, picks);

    if (!onTheClock) {
      results.push({ tournamentId: tournament.id, message: 'Draft complete' });
      continue;
    }

    const currentPickNumber = String(onTheClock.overallPickNumber);
    const [lastPickNumber, lastSince, lastNotified] = await Promise.all([
      getConfig(CONFIG_PICK_KEY),
      getConfig(CONFIG_SINCE_KEY),
      getConfig(CONFIG_NOTIFIED_KEY),
    ]);

    const now = Date.now();

    // Pick changed — reset the clock
    if (lastPickNumber !== currentPickNumber) {
      await Promise.all([
        setConfig(CONFIG_PICK_KEY, currentPickNumber),
        setConfig(CONFIG_SINCE_KEY, String(now)),
        setConfig(CONFIG_NOTIFIED_KEY, 'false'),
      ]);
      results.push({ tournamentId: tournament.id, message: `Clock reset for pick ${currentPickNumber} (${onTheClock.participantName})` });
      continue;
    }

    // Already notified for this pick
    if (lastNotified === 'true') {
      results.push({ tournamentId: tournament.id, message: `Already notified for pick ${currentPickNumber}` });
      continue;
    }

    // Check if 15 minutes have elapsed
    const since = parseInt(lastSince ?? '0', 10);
    const elapsedMinutes = (now - since) / 1000 / 60;

    if (elapsedMinutes < REMINDER_MINUTES) {
      results.push({ tournamentId: tournament.id, message: `${Math.round(elapsedMinutes)}m elapsed, waiting` });
      continue;
    }

    // Find the participant's phone number
    const participant = participants.find((p) => p.name === onTheClock.participantName);
    if (!participant?.phone) {
      results.push({ tournamentId: tournament.id, message: `No phone for ${onTheClock.participantName}` });
      continue;
    }

    const roundLabel = onTheClock.roundNumber === 0 ? 'Single Pick' : `Round ${onTheClock.roundNumber}`;
    const message = `⛳ Hey ${onTheClock.participantName}, you're on the clock for the ${tournament.name} draft! ${roundLabel}, Pick ${onTheClock.overallPickNumber}. Make your pick: https://golf-picker.vercel.app/draft/${tournament.id}`;

    await sendSms(participant.phone, message);
    await setConfig(CONFIG_NOTIFIED_KEY, 'true');

    results.push({ tournamentId: tournament.id, message: `SMS sent to ${onTheClock.participantName}` });
  }

  return { results };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await runReminder());
}
