export interface BroadcastWindow {
  label: string;
  outlets: string[];
  startsAt: string;
  endsAt: string;
}

export interface BroadcastInfo {
  current: BroadcastWindow[];
  next: BroadcastWindow | null;
  nextLabel: string | null;
  sourceName: string;
  sourceUrl: string;
}

const DISPLAY_TIME_ZONE = 'America/Chicago';

const SCHEDULES: Record<string, BroadcastWindow[]> = {
  'pga championship:2026': [
    {
      label: 'Round 1 live stream',
      outlets: ['ESPN+'],
      startsAt: '2026-05-14T06:45:00-04:00',
      endsAt: '2026-05-14T19:00:00-04:00',
    },
    {
      label: 'Round 1 TV coverage',
      outlets: ['ESPN'],
      startsAt: '2026-05-14T12:00:00-04:00',
      endsAt: '2026-05-14T19:00:00-04:00',
    },
    {
      label: 'Round 1 late TV coverage',
      outlets: ['ESPN2'],
      startsAt: '2026-05-14T19:00:00-04:00',
      endsAt: '2026-05-14T20:00:00-04:00',
    },
    {
      label: 'Round 2 live stream',
      outlets: ['ESPN+'],
      startsAt: '2026-05-15T06:45:00-04:00',
      endsAt: '2026-05-15T19:00:00-04:00',
    },
    {
      label: 'Round 2 TV coverage',
      outlets: ['ESPN'],
      startsAt: '2026-05-15T12:00:00-04:00',
      endsAt: '2026-05-15T20:00:00-04:00',
    },
    {
      label: 'Round 3 early TV coverage',
      outlets: ['ESPN'],
      startsAt: '2026-05-16T10:00:00-04:00',
      endsAt: '2026-05-16T13:00:00-04:00',
    },
    {
      label: 'Round 3 featured groups and holes',
      outlets: ['ESPN+'],
      startsAt: '2026-05-16T08:00:00-04:00',
      endsAt: '2026-05-16T19:00:00-04:00',
    },
    {
      label: 'Round 3 prime TV coverage',
      outlets: ['CBS', 'Paramount+'],
      startsAt: '2026-05-16T13:00:00-04:00',
      endsAt: '2026-05-16T19:00:00-04:00',
    },
    {
      label: 'Final round early TV coverage',
      outlets: ['ESPN'],
      startsAt: '2026-05-17T10:00:00-04:00',
      endsAt: '2026-05-17T13:00:00-04:00',
    },
    {
      label: 'Final round featured groups and holes',
      outlets: ['ESPN+'],
      startsAt: '2026-05-17T08:00:00-04:00',
      endsAt: '2026-05-17T19:00:00-04:00',
    },
    {
      label: 'Final round prime TV coverage',
      outlets: ['CBS', 'Paramount+'],
      startsAt: '2026-05-17T13:00:00-04:00',
      endsAt: '2026-05-17T19:00:00-04:00',
    },
  ],
};

function scheduleKey(name: string, year: number): string {
  const tournament = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  return `${tournament}:${year}`;
}

function formatCentralTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DISPLAY_TIME_ZONE,
    timeZoneName: 'short',
  }).format(date).replace(/\bC[DS]T\b/, 'CT');
}

function uniqueByOutlets(windows: BroadcastWindow[]): BroadcastWindow[] {
  const seen = new Set<string>();
  return windows.filter((window) => {
    const key = window.outlets.join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getBroadcastInfo(name: string, year: number, now = new Date()): BroadcastInfo | null {
  const windows = SCHEDULES[scheduleKey(name, year)];
  if (!windows) return null;

  const sortedWindows = [...windows].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const nowMs = now.getTime();

  const current = uniqueByOutlets(sortedWindows.filter((window) => {
    const starts = new Date(window.startsAt).getTime();
    const ends = new Date(window.endsAt).getTime();
    return starts <= nowMs && nowMs < ends;
  }));
  const next = sortedWindows.find((window) => new Date(window.startsAt).getTime() > nowMs) ?? null;

  return {
    current,
    next,
    nextLabel: next ? formatCentralTime(new Date(next.startsAt)) : null,
    sourceName: 'CBS Sports',
    sourceUrl: 'https://www.cbssports.com/golf/news/pga-championship-2026-tv-schedule-coverage-streaming/',
  };
}
