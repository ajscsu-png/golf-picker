import type { EspnGolfer, EspnEvent, GolferScore } from '@/types';

const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary';
const EVENTS_URL = 'https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events';

function parseScore(raw: string | undefined | null): number | null {
  if (!raw || raw === '--' || raw === '') return null;
  if (raw === 'E') return 0;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function parseStatus(competitor: Record<string, unknown>): GolferScore['status'] {
  const status = competitor.status as Record<string, unknown> | undefined;
  const type = status?.type as Record<string, unknown> | undefined;
  const name = (type?.name as string ?? '').toLowerCase();
  if (name.includes('cut')) return 'cut';
  if (name.includes('wd') || name.includes('withdrawn')) return 'wd';
  if (name.includes('dq') || name.includes('disqualif')) return 'dq';
  return 'active';
}

export async function getEvents(): Promise<EspnEvent[]> {
  const year = new Date().getFullYear();
  const res = await fetch(`${EVENTS_URL}?limit=50&dates=${year}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json() as Record<string, unknown>;
  const items = (data.items as Array<Record<string, unknown>>) ?? [];

  // Core API returns $ref links — fetch each event to get name/date
  const refs = items.map((item) => item.$ref as string).filter(Boolean);

  const fetchRef = async (ref: string): Promise<EspnEvent | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(ref, { next: { revalidate: 3600 }, signal: controller.signal });
      clearTimeout(timer);
      if (!r.ok) return null;
      const e = await r.json() as Record<string, unknown>;
      return {
        id: String(e.id ?? ''),
        name: String(e.name ?? e.shortName ?? ''),
        date: String(e.date ?? ''),
      };
    } catch {
      return null;
    }
  };

  // Fetch in batches of 10 to avoid overwhelming ESPN's API
  const results: EspnEvent[] = [];
  for (let i = 0; i < refs.length; i += 10) {
    const batch = await Promise.all(refs.slice(i, i + 10).map(fetchRef));
    results.push(...batch.filter((e): e is EspnEvent => e !== null && e.id !== ''));
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getField(eventId: string): Promise<EspnGolfer[]> {
  const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json() as Record<string, unknown>;
  const competitors = extractCompetitors(data);
  return competitors.map((c) => {
    const athlete = c.athlete as Record<string, unknown> | undefined;
    const ranking = athlete?.ranking as Record<string, unknown> | undefined;
    return {
      id: String(c.id ?? ''),
      name: String(athlete?.displayName ?? ''),
      worldRanking: ranking?.current != null ? Number(ranking.current) : undefined,
    };
  });
}

export async function getLeaderboard(
  eventId: string,
  options: { noCache?: boolean } = {}
): Promise<GolferScore[]> {
  const fetchOptions: RequestInit = options.noCache
    ? { cache: 'no-store' }
    : { next: { revalidate: 60 } };

  const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`, fetchOptions);
  if (!res.ok) return [];
  const data = await res.json() as Record<string, unknown>;
  const competitors = extractCompetitors(data);
  const tournamentId = eventId; // caller will replace with real tournament id

  return competitors.map((c) => {
    const athlete = c.athlete as Record<string, unknown> | undefined;
    const linescores = (c.linescores as Array<Record<string, unknown>>) ?? [];
    const statistics = (c.statistics as Array<Record<string, unknown>>) ?? [];

    const totalStat = statistics.find(
      (s) => (s.name as string)?.toLowerCase() === 'score' ||
              (s.abbreviation as string)?.toLowerCase() === 'tot'
    );

    const rounds = linescores.slice(0, 4).map((ls) =>
      parseScore(String(ls.value ?? ls.displayValue ?? ''))
    );
    while (rounds.length < 4) rounds.push(null);

    const status = c.status as { type?: { shortDetail?: string } } | undefined;
    const position = c.position as { displayName?: string } | undefined;
    const positionStr = String(status?.type?.shortDetail ?? position?.displayName ?? '');

    return {
      tournamentId,
      golferEspnId: String(c.id ?? ''),
      golferName: String(athlete?.displayName ?? ''),
      position: positionStr,
      totalScore: parseScore(
        String(totalStat?.displayValue ?? totalStat?.value ?? '')
      ),
      r1: rounds[0],
      r2: rounds[1],
      r3: rounds[2],
      r4: rounds[3],
      status: parseStatus(c),
    } satisfies GolferScore;
  });
}

function extractCompetitors(data: Record<string, unknown>): Array<Record<string, unknown>> {
  // Golf summary: data.header.competitions[0].competitors
  const header = data.header as Record<string, unknown> | undefined;
  if (header) {
    const comps = (header.competitions as Array<Record<string, unknown>>)?.[0]?.competitors as Array<Record<string, unknown>> | undefined;
    if (comps && comps.length > 0) return comps;
  }
  // Fallback: data.events[0].competitions[0].competitors (other sports)
  const events = (data.events as Array<Record<string, unknown>>) ?? [];
  if (events.length > 0) {
    const competition = (events[0].competitions as Array<Record<string, unknown>>)?.[0];
    const comps = competition?.competitors as Array<Record<string, unknown>> | undefined;
    if (comps && comps.length > 0) return comps;
  }
  // Last resort: top-level competitors
  return (data.competitors as Array<Record<string, unknown>>) ?? [];
}
