import { google } from 'googleapis';
import type { Tournament, Participant, Pick, GolferScore, Cut } from '@/types';

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!;

function getAuth() {
  const keyJson = Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
    'base64'
  ).toString('utf-8');
  const key = JSON.parse(keyJson);

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: key.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function sheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

// ─── Generic helpers ────────────────────────────────────────────────────────

async function getRows(sheetName: string): Promise<string[][]> {
  try {
    const res = await sheets().spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: sheetName,
    });
    const rows = res.data.values ?? [];
    return rows.slice(1); // skip header row
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Sheet tab doesn't exist yet — return empty rather than crashing
    if (msg.includes('Unable to parse range') || msg.includes('badRequest')) {
      return [];
    }
    throw err;
  }
}

async function appendRow(sheetName: string, values: string[]): Promise<void> {
  await sheets().spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: sheetName,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

async function clearAndWriteRows(
  sheetName: string,
  header: string[],
  rows: string[][]
): Promise<void> {
  const allRows = [header, ...rows];
  await sheets().spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: sheetName,
  });
  if (allRows.length > 0) {
    await sheets().spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: allRows },
    });
  }
}

// ─── Config ─────────────────────────────────────────────────────────────────

export async function getConfig(key: string): Promise<string | null> {
  const rows = await getRows('Config');
  const row = rows.find((r) => r[0] === key);
  return row?.[1] ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const rows = await getRows('Config');
  const updated = rows.map((r) => (r[0] === key ? [key, value] : r));
  if (!updated.some((r) => r[0] === key)) {
    updated.push([key, value]);
  }
  await clearAndWriteRows('Config', ['key', 'value'], updated);
}

// ─── Tournaments ─────────────────────────────────────────────────────────────

const TOURNAMENT_HEADER = ['id', 'name', 'year', 'espn_event_id', 'status', 'picks_per_person', 'cuts_per_person'];

function rowToTournament(r: string[]): Tournament {
  return {
    id: r[0],
    name: r[1],
    year: parseInt(r[2], 10),
    espnEventId: r[3],
    status: r[4] as Tournament['status'],
    picksPerPerson: parseInt(r[5], 10),
    cutsPerPerson: parseInt(r[6] ?? '0', 10) || 0,
  };
}

export async function getTournaments(): Promise<Tournament[]> {
  const rows = await getRows('Tournaments');
  return rows.filter((r) => r.length >= 6).map(rowToTournament);
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const all = await getTournaments();
  return all.find((t) => t.id === id) ?? null;
}

export async function createTournament(
  t: Omit<Tournament, 'id'>
): Promise<Tournament> {
  const id = crypto.randomUUID();
  const row = [id, t.name, String(t.year), t.espnEventId, t.status, String(t.picksPerPerson), String(t.cutsPerPerson ?? 0)];
  await appendRow('Tournaments', row);
  return { id, ...t };
}

// Also update deleteTournament to include Cuts sheet
const DROPS_HEADER = ['tournament_id', 'participant_name', 'golfer_espn_id', 'golfer_name'];

export async function getCuts(tournamentId: string): Promise<Cut[]> {
  const rows = await getRows('Drops');
  return rows
    .filter((r) => r[0] === tournamentId)
    .map((r) => ({
      tournamentId: r[0],
      participantName: r[1],
      golferEspnId: r[2],
      golferName: r[3],
    }));
}

export async function setCuts(tournamentId: string, participantName: string, cuts: Array<{ golferEspnId: string; golferName: string }>): Promise<void> {
  const allRows = await getRows('Drops');
  const otherRows = allRows.filter((r) => !(r[0] === tournamentId && r[1] === participantName));
  const newRows = cuts.map((c) => [tournamentId, participantName, c.golferEspnId, c.golferName]);
  await clearAndWriteRows('Drops', DROPS_HEADER, [...otherRows, ...newRows]);
}

export async function updateTournamentStatus(
  id: string,
  status: Tournament['status']
): Promise<void> {
  const rows = await getRows('Tournaments');
  const updated = rows.map((r) => (r[0] === id ? [...r.slice(0, 4), status, r[5]] : r));
  await clearAndWriteRows('Tournaments', TOURNAMENT_HEADER, updated);
}

export async function deleteTournament(id: string): Promise<void> {
  const [tRows, pRows, pickRows, scoreRows, cutRows] = await Promise.all([
    getRows('Tournaments'),
    getRows('Participants'),
    getRows('Picks'),
    getRows('Scores'),
    getRows('Drops'),
  ]);
  await Promise.all([
    clearAndWriteRows('Tournaments', TOURNAMENT_HEADER, tRows.filter((r) => r[0] !== id)),
    clearAndWriteRows('Participants', PARTICIPANT_HEADER, pRows.filter((r) => r[0] !== id)),
    clearAndWriteRows('Picks', PICKS_HEADER, pickRows.filter((r) => r[1] !== id)),
    clearAndWriteRows('Scores', SCORES_HEADER, scoreRows.filter((r) => r[0] !== id)),
    clearAndWriteRows('Drops', DROPS_HEADER, cutRows.filter((r) => r[0] !== id)),
  ]);
}

// ─── Participants ─────────────────────────────────────────────────────────────

const PARTICIPANT_HEADER = ['tournament_id', 'name', 'draft_position'];

function rowToParticipant(r: string[]): Participant {
  return {
    tournamentId: r[0],
    name: r[1],
    draftPosition: parseInt(r[2], 10),
  };
}

export async function getParticipants(tournamentId: string): Promise<Participant[]> {
  const rows = await getRows('Participants');
  return rows
    .filter((r) => r[0] === tournamentId)
    .map(rowToParticipant)
    .sort((a, b) => a.draftPosition - b.draftPosition);
}

export async function setParticipants(
  tournamentId: string,
  participants: Array<{ name: string; draftPosition: number }>
): Promise<void> {
  const allRows = await getRows('Participants');
  const otherRows = allRows.filter((r) => r[0] !== tournamentId);
  const newRows = participants.map((p) => [
    tournamentId,
    p.name,
    String(p.draftPosition),
  ]);
  await clearAndWriteRows('Participants', PARTICIPANT_HEADER, [...otherRows, ...newRows]);
}

// ─── Picks ───────────────────────────────────────────────────────────────────

const PICKS_HEADER = [
  'id',
  'tournament_id',
  'overall_pick_number',
  'round_number',
  'pick_in_round',
  'participant_name',
  'golfer_name',
  'golfer_espn_id',
];

function rowToPick(r: string[]): Pick {
  return {
    id: r[0],
    tournamentId: r[1],
    overallPickNumber: parseInt(r[2], 10),
    roundNumber: parseInt(r[3], 10),
    pickInRound: parseInt(r[4], 10),
    participantName: r[5],
    golferName: r[6],
    golferEspnId: r[7],
  };
}

export async function getPicks(tournamentId: string): Promise<Pick[]> {
  const rows = await getRows('Picks');
  return rows
    .filter((r) => r[1] === tournamentId)
    .map(rowToPick)
    .sort((a, b) => a.overallPickNumber - b.overallPickNumber);
}

export async function appendPick(pick: Omit<Pick, 'id'>): Promise<Pick> {
  const id = crypto.randomUUID();
  const row = [
    id,
    pick.tournamentId,
    String(pick.overallPickNumber),
    String(pick.roundNumber),
    String(pick.pickInRound),
    pick.participantName,
    pick.golferName,
    pick.golferEspnId,
  ];
  await appendRow('Picks', row);
  return { id, ...pick };
}

export async function swapPick(
  tournamentId: string,
  participantName: string,
  oldGolferEspnId: string,
  newGolferEspnId: string,
  newGolferName: string
): Promise<void> {
  const allRows = await getRows('Picks');
  const updated = allRows.map((r) => {
    if (r[1] === tournamentId && r[5] === participantName && r[7] === oldGolferEspnId) {
      return [r[0], r[1], r[2], r[3], r[4], r[5], newGolferName, newGolferEspnId];
    }
    return r;
  });
  await clearAndWriteRows('Picks', PICKS_HEADER, updated);
}

export async function isGolferPicked(
  tournamentId: string,
  golferEspnId: string
): Promise<boolean> {
  const rows = await getRows('Picks');
  return rows.some((r) => r[1] === tournamentId && r[7] === golferEspnId);
}

// ─── Scores ──────────────────────────────────────────────────────────────────

const SCORES_HEADER = [
  'tournament_id',
  'golfer_espn_id',
  'golfer_name',
  'position',
  'total_score',
  'r1',
  'r2',
  'r3',
  'r4',
  'status',
];

function rowToScore(r: string[]): GolferScore {
  return {
    tournamentId: r[0],
    golferEspnId: r[1],
    golferName: r[2],
    position: r[3] ?? '',
    totalScore: r[4] !== '' && r[4] !== undefined ? parseInt(r[4], 10) : null,
    r1: r[5] !== '' && r[5] !== undefined ? parseInt(r[5], 10) : null,
    r2: r[6] !== '' && r[6] !== undefined ? parseInt(r[6], 10) : null,
    r3: r[7] !== '' && r[7] !== undefined ? parseInt(r[7], 10) : null,
    r4: r[8] !== '' && r[8] !== undefined ? parseInt(r[8], 10) : null,
    status: (r[9] ?? 'active') as GolferScore['status'],
  };
}

function scoreToRow(s: GolferScore): string[] {
  return [
    s.tournamentId,
    s.golferEspnId,
    s.golferName,
    s.position,
    s.totalScore !== null ? String(s.totalScore) : '',
    s.r1 !== null ? String(s.r1) : '',
    s.r2 !== null ? String(s.r2) : '',
    s.r3 !== null ? String(s.r3) : '',
    s.r4 !== null ? String(s.r4) : '',
    s.status,
  ];
}

export async function getScores(tournamentId: string): Promise<GolferScore[]> {
  const rows = await getRows('Scores');
  return rows.filter((r) => r[0] === tournamentId).map(rowToScore);
}

export async function upsertScores(incoming: GolferScore[]): Promise<void> {
  if (incoming.length === 0) return;
  const tournamentId = incoming[0].tournamentId;
  const allRows = await getRows('Scores');
  const otherRows = allRows.filter((r) => r[0] !== tournamentId);
  const newRows = incoming.map(scoreToRow);
  await clearAndWriteRows('Scores', SCORES_HEADER, [...otherRows, ...newRows]);
}

// ─── Trash Talk ──────────────────────────────────────────────────────────────

const TRASH_HEADER = ['id', 'tournament_id', 'participant_name', 'message', 'created_at'];

export interface TrashMessage {
  id: string;
  tournamentId: string;
  participantName: string;
  message: string;
  createdAt: string;
}

export async function getTrashMessages(tournamentId: string): Promise<TrashMessage[]> {
  const rows = await getRows('Trash');
  return rows
    .filter((r) => r[1] === tournamentId)
    .map((r) => ({
      id: r[0],
      tournamentId: r[1],
      participantName: r[2],
      message: r[3],
      createdAt: r[4],
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addTrashMessage(
  tournamentId: string,
  participantName: string,
  message: string
): Promise<TrashMessage> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await appendRow('Trash', [id, tournamentId, participantName, message, createdAt]);
  return { id, tournamentId, participantName, message, createdAt };
}
