import type { EspnGolfer, EspnEvent, GolferScore } from '@/types';

const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary';
const SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';
const EVENTS_URL = 'https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events';

const TZ_OFFSETS: Record<string, number> = {
  PDT: -7, PST: -8, EDT: -4, EST: -5, CDT: -5, CST: -6, MDT: -6, MST: -7,
};

function parseTeeTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d{1,2}):(\d{2}):\d{2}\s+([A-Z]{2,4})/);
  if (!match) return null;
  const srcHours = parseInt(match[1], 10);
  const minutes = match[2];
  const srcOffset = TZ_OFFSETS[match[3]];
  if (srcOffset === undefined) return null;
  const cdtHours = ((srcHours - srcOffset + (-5) + 24) % 24);
  const ampm = cdtHours >= 12 ? 'PM' : 'AM';
  const display = cdtHours % 12 || 12;
  return `${display}:${minutes} ${ampm}`;
}

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

export async function getCurrentRound(espnEventId: string): Promise<number> {
  try {
    const res = await fetch(`${SCOREBOARD_BASE}?event=${espnEventId}`, { cache: 'no-store' });
    if (!res.ok) return 1;
    const data = await res.json() as Record<string, unknown>;
    const events = (data.events as Array<Record<string, unknown>>) ?? [];
    const event = events.find((e) => String(e.id) === String(espnEventId)) ?? events[0];
    const competition = (event?.competitions as Array<Record<string, unknown>>)?.[0];
    const period = (competition?.status as Record<string, unknown>)?.period;
    return typeof period === 'number' ? period : 1;
  } catch {
    return 1;
  }
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
  // Helper to extract golfers from a scoreboard event object
  function golfersFromScoreboardEvent(event: Record<string, unknown>): EspnGolfer[] {
    const competitors = ((event.competitions as Array<Record<string, unknown>>)?.[0]?.competitors ?? []) as Array<Record<string, unknown>>;
    return competitors
      .map((c) => {
        const athlete = c.athlete as Record<string, unknown> | undefined;
        return {
          id: String(c.id ?? ''),
          name: String(athlete?.displayName ?? athlete?.fullName ?? ''),
          worldRanking: undefined,
        };
      })
      .filter((g) => g.id && g.name);
  }

  // 1. Try summary endpoint (works once tournament is live)
  const summaryRes = await fetch(`${SUMMARY_BASE}?event=${eventId}`, {
    next: { revalidate: 3600 },
  });
  if (summaryRes.ok) {
    const data = await summaryRes.json() as Record<string, unknown>;
    const competitors = extractCompetitors(data);
    if (competitors.length > 0) {
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
  }

  // 2. Try scoreboard with event ID — only use if the event actually matches
  const scoreboardRes = await fetch(`${SCOREBOARD_BASE}?event=${eventId}`, {
    next: { revalidate: 3600 },
  });
  if (scoreboardRes.ok) {
    const sbData = await scoreboardRes.json() as Record<string, unknown>;
    const events = (sbData.events as Array<Record<string, unknown>>) ?? [];
    const event = events.find((e) => String(e.id) === String(eventId));
    if (event) return golfersFromScoreboardEvent(event);
  }

  // 3. Pre-tournament fallback: look up the event start date from the core API,
  //    then fetch the scoreboard by date (which correctly returns that week's event)
  try {
    const coreRes = await fetch(
      `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${eventId}`,
      { next: { revalidate: 3600 } }
    );
    if (coreRes.ok) {
      const coreData = await coreRes.json() as Record<string, unknown>;
      const dateStr = String(coreData.date ?? '').slice(0, 10).replace(/-/g, '');
      if (dateStr.length === 8) {
        const dateRes = await fetch(`${SCOREBOARD_BASE}?dates=${dateStr}`, {
          next: { revalidate: 3600 },
        });
        if (dateRes.ok) {
          const dateData = await dateRes.json() as Record<string, unknown>;
          const events = (dateData.events as Array<Record<string, unknown>>) ?? [];
          const event = events.find((e) => String(e.id) === String(eventId)) ?? events[0];
          if (event) return golfersFromScoreboardEvent(event);
        }
      }
    }
  } catch {
    // ignore — return empty below
  }

  return [];
}

export async function getLeaderboard(
  eventId: string,
  options: { noCache?: boolean } = {}
): Promise<GolferScore[]> {
  const fetchOptions: RequestInit = options.noCache
    ? { cache: 'no-store' }
    : { next: { revalidate: 60 } };

  // Try summary endpoint first (has full per-round data)
  const summaryRes = await fetch(`${SUMMARY_BASE}?event=${eventId}`, fetchOptions);
  if (summaryRes.ok) {
    const data = await summaryRes.json() as Record<string, unknown>;
    const competitors = extractCompetitors(data);
    if (competitors.length > 0) {
      return competitors.map((c) => parseSummaryCompetitor(c, eventId));
    }
  }

  // Fallback: scoreboard endpoint (summary can be unavailable during live rounds)
  const scoreboardRes = await fetch(`${SCOREBOARD_BASE}?event=${eventId}`, fetchOptions);
  if (!scoreboardRes.ok) return [];
  const sbData = await scoreboardRes.json() as Record<string, unknown>;
  const events = (sbData.events as Array<Record<string, unknown>>) ?? [];
  const event = events.find((e) => String(e.id) === String(eventId)) ?? events[0];
  if (!event) return [];
  const competition = (event.competitions as Array<Record<string, unknown>>)?.[0];
  const currentRound = typeof (competition?.status as Record<string, unknown>)?.period === 'number'
    ? (competition.status as Record<string, unknown>).period as number
    : 1;
  const sbCompetitors = (competition?.competitors ?? []) as Array<Record<string, unknown>>;
  const parsed = sbCompetitors.map((c) => parseScoreboardCompetitor(c, eventId, currentRound));

  // Compute tied positions: group by totalScore, assign "T{minOrder}" when tied
  const scoreGroups = new Map<string, number[]>();
  sbCompetitors.forEach((c, i) => {
    const key = String(c.score ?? '');
    if (!scoreGroups.has(key)) scoreGroups.set(key, []);
    scoreGroups.get(key)!.push(i);
  });
  scoreGroups.forEach((indices) => {
    const minOrder = Math.min(...indices.map((i) => (sbCompetitors[i].order as number) ?? 999));
    const prefix = indices.length > 1 ? `T${minOrder}` : String(minOrder);
    indices.forEach((i) => { parsed[i].position = prefix; });
  });

  return parsed;
}

function parseSummaryCompetitor(c: Record<string, unknown>, tournamentId: string): GolferScore {
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
    totalScore: parseScore(String(totalStat?.displayValue ?? totalStat?.value ?? '')),
    r1: rounds[0],
    r2: rounds[1],
    r3: rounds[2],
    r4: rounds[3],
    thru: null,
    teeTime: null,
    status: parseStatus(c),
  };
}

function parseScoreboardCompetitor(c: Record<string, unknown>, tournamentId: string, currentRound: number = 1): GolferScore {
  const athlete = c.athlete as Record<string, unknown> | undefined;
  // Scoreboard linescores: one entry per round, period=round number, displayValue=to-par score
  const linescores = (c.linescores as Array<Record<string, unknown>>) ?? [];
  const roundMap = new Map<number, number | null>();
  for (const ls of linescores) {
    const period = typeof ls.period === 'number' ? ls.period : null;
    if (period && period >= 1 && period <= 4) {
      roundMap.set(period, parseScore(String(ls.displayValue ?? '')));
    }
  }

  // Count holes completed in the current round via nested linescores
  const currentRoundLs = linescores.find((ls) => typeof ls.period === 'number' && ls.period === currentRound);
  const holesPlayed = (currentRoundLs?.linescores as Array<unknown> | undefined)?.length ?? 0;

  // Extract tee time from current round's linescore statistics (datetime-looking stat entry)
  const roundStats = ((currentRoundLs?.statistics as Record<string, unknown>)
    ?.categories as Array<Record<string, unknown>>)?.[0]
    ?.stats as Array<Record<string, unknown>> | undefined;
  const teeStat = roundStats?.find((s) => /\d{1,2}:\d{2}:\d{2}/.test(String(s.displayValue ?? '')));
  const teeTime = parseTeeTime(teeStat ? String(teeStat.displayValue) : null);

  return {
    tournamentId,
    golferEspnId: String(c.id ?? ''),
    golferName: String(athlete?.displayName ?? athlete?.fullName ?? ''),
    position: String(c.order ?? ''), // ties computed after all competitors are parsed
    totalScore: parseScore(String(c.score ?? '')),
    r1: roundMap.get(1) ?? null,
    r2: roundMap.get(2) ?? null,
    r3: roundMap.get(3) ?? null,
    r4: roundMap.get(4) ?? null,
    thru: holesPlayed > 0 ? holesPlayed : null,
    teeTime,
    status: parseStatus(c),
  };
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
