import type { TeamScoreSnapshot } from '@/types';

const CENTRAL_TIME_ZONE = 'America/Chicago';

interface TimeBucket {
  localDate: string;
  hourKey: string;
  hour: number;
  minute: number;
}

interface BuildSnapshotInput {
  tournamentId: string;
  participantName: string;
  now: Date;
  currentTotal: number | null;
  earliestTeeTime: string | null;
  latestTeeTime: string | null;
  existing: TeamScoreSnapshot[];
}

export function computeDisplayedTeamTotal(
  golfers: Array<{ totalScore: number | null; dropped: boolean }>
): number | null {
  const scores = golfers
    .filter((golfer) => !golfer.dropped && golfer.totalScore !== null)
    .map((golfer) => golfer.totalScore as number);
  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) : null;
}

export function getCentralTimeBucket(date: Date): TimeBucket {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const localDate = `${get('year')}-${get('month')}-${get('day')}`;
  const hour = Number(get('hour'));
  const minute = Number(get('minute'));
  return {
    localDate,
    hourKey: `${localDate}T${String(hour).padStart(2, '0')}:00`,
    hour,
    minute,
  };
}

export function parseTeeTimeMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

function makeSnapshot(
  input: BuildSnapshotInput,
  localDate: string,
  hourKey: string,
  teamTotal: number,
  snapshotType: TeamScoreSnapshot['snapshotType']
): TeamScoreSnapshot {
  return {
    tournamentId: input.tournamentId,
    participantName: input.participantName,
    localDate,
    hourKey,
    capturedAt: input.now.toISOString(),
    teamTotal,
    snapshotType,
  };
}

export function dedupeTeamScoreSnapshots(rows: TeamScoreSnapshot[]): TeamScoreSnapshot[] {
  const merged = new Map<string, TeamScoreSnapshot>();
  for (const row of rows) {
    const key = [row.tournamentId, row.participantName, row.localDate, row.hourKey].join('\u0000');
    const current = merged.get(key);
    if (!current || current.capturedAt <= row.capturedAt) merged.set(key, row);
  }
  return Array.from(merged.values());
}

export function buildTeamScoreSnapshots(input: BuildSnapshotInput): TeamScoreSnapshot[] {
  if (input.currentTotal === null) return [];

  const bucket = getCentralTimeBucket(input.now);
  const earliestMinutes = parseTeeTimeMinutes(input.earliestTeeTime);
  const latestMinutes = parseTeeTimeMinutes(input.latestTeeTime);
  const nowMinutes = bucket.hour * 60 + bucket.minute;
  if (earliestMinutes !== null && nowMinutes < earliestMinutes) return [];

  const existing = dedupeTeamScoreSnapshots(input.existing);
  const today = existing
    .filter((row) => row.participantName === input.participantName && row.localDate === bucket.localDate)
    .sort((a, b) => a.hourKey.localeCompare(b.hourKey));
  const previous = existing
    .filter((row) => row.participantName === input.participantName && row.localDate < bucket.localDate)
    .sort((a, b) => a.localDate.localeCompare(b.localDate) || a.hourKey.localeCompare(b.hourKey));

  if (today.length === 0) {
    const priorClose = previous.at(-1)?.teamTotal;
    if (priorClose === undefined || earliestMinutes === null) {
      return [makeSnapshot(input, bucket.localDate, bucket.hourKey, input.currentTotal, 'baseline')];
    }

    const baselineHour = Math.floor(earliestMinutes / 60);
    const baselineKey = `${bucket.localDate}T${String(baselineHour).padStart(2, '0')}:00`;
    const rows = [makeSnapshot(input, bucket.localDate, baselineKey, priorClose, 'baseline')];
    if (baselineKey !== bucket.hourKey) {
      rows.push(makeSnapshot(input, bucket.localDate, bucket.hourKey, input.currentTotal, 'hourly'));
    }
    return rows;
  }

  const last = today.at(-1)!;
  const afterPlayingWindow = latestMinutes !== null && nowMinutes > latestMinutes + 6 * 60;
  if (afterPlayingWindow && last.teamTotal === input.currentTotal) return [];
  return [makeSnapshot(
    input,
    bucket.localDate,
    bucket.hourKey,
    input.currentTotal,
    afterPlayingWindow ? 'final' : 'hourly'
  )];
}

export function getCurrentDaySnapshots(rows: TeamScoreSnapshot[], now: Date): TeamScoreSnapshot[] {
  const { localDate } = getCentralTimeBucket(now);
  return dedupeTeamScoreSnapshots(rows)
    .filter((row) => row.localDate === localDate)
    .sort((a, b) => a.hourKey.localeCompare(b.hourKey));
}

export function getMomentumYScale(
  scores: number[],
  yTop: number,
  yBottom: number
): (score: number) => number {
  const min = Math.min(...scores) - 2;
  const max = Math.max(...scores) + 2;
  const span = Math.max(1, max - min);
  return (score: number) => yTop + ((score - min) / span) * (yBottom - yTop);
}

export interface MomentumChartPoint {
  hourKey: string;
  label: string;
  score: number;
  x: number;
  y: number;
  snapshotType: TeamScoreSnapshot['snapshotType'];
}

export function momentumHourLabel(hourKey: string): string {
  const hour = Number(hourKey.slice(-5, -3));
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function getMomentumChartPoints(
  snapshots: TeamScoreSnapshot[],
  width: number,
  height: number
): MomentumChartPoint[] {
  if (snapshots.length === 0) return [];
  const xLeft = 42;
  const xRight = width - 22;
  const y = getMomentumYScale(snapshots.map((row) => row.teamTotal), 26, height - 38);
  const xStep = snapshots.length > 1 ? (xRight - xLeft) / (snapshots.length - 1) : 0;
  return snapshots.map((row, index) => ({
    hourKey: row.hourKey,
    label: momentumHourLabel(row.hourKey),
    score: row.teamTotal,
    x: snapshots.length === 1 ? (xLeft + xRight) / 2 : xLeft + xStep * index,
    y: y(row.teamTotal),
    snapshotType: row.snapshotType,
  }));
}
