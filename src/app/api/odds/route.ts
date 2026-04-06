import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

export interface BookmakerOdds {
  key: string;
  title: string;
  americanOdds: number;
  oddsDisplay: string;
}

export interface GolferOdds {
  name: string;
  americanOdds: number;
  oddsDisplay: string;
  impliedProbability: number; // higher = bigger favorite
  bookmakers: BookmakerOdds[];
}

function americanToImplied(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return -odds / (-odds + 100);
}

function formatAmerican(odds: number): string {
  return odds > 0 ? `+${odds}` : String(odds);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const wordsA = new Set(na.split(' '));
  const wordsB = nb.split(' ');
  const overlap = wordsB.filter((w) => wordsA.has(w)).length;
  return overlap / Math.max(wordsA.size, wordsB.length);
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ODDS_API_KEY not configured' }, { status: 500 });
  }

  const tournamentName = req.nextUrl.searchParams.get('tournament') ?? '';

  // Step 1: get all sports, filter golf
  const sportsRes = await fetch(
    `${ODDS_API_BASE}/sports?apiKey=${apiKey}&all=true`,
    { next: { revalidate: 3600 } }
  );
  if (!sportsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 502 });
  }
  const sports = await sportsRes.json() as Array<{ key: string; group: string; title: string; active: boolean }>;
  const golfSports = sports.filter((s) => s.group.toLowerCase().includes('golf'));

  if (golfSports.length === 0) {
    return NextResponse.json([]);
  }

  // Step 2: pick best matching sport by tournament name, or use first active one
  let chosenSport = golfSports[0];
  if (tournamentName) {
    let best = 0;
    for (const s of golfSports) {
      const score = nameSimilarity(tournamentName, s.title);
      if (score > best) { best = score; chosenSport = s; }
    }
  }

  // Step 3: fetch outrights odds for chosen sport
  const oddsRes = await fetch(
    `${ODDS_API_BASE}/sports/${chosenSport.key}/odds?apiKey=${apiKey}&regions=us&markets=outrights&bookmakers=draftkings,fanduel,betmgm&oddsFormat=american`,
    { next: { revalidate: 1800 } }
  );
  if (!oddsRes.ok) {
    return NextResponse.json([]);
  }
  const events = await oddsRes.json() as Array<{
    bookmakers: Array<{
      key: string;
      title: string;
      markets: Array<{
        key: string;
        outcomes: Array<{ name: string; price: number }>;
      }>;
    }>;
  }>;

  // Aggregate odds: track implied probabilities for averaging, and per-bookmaker raw odds
  const golferImplied = new Map<string, number[]>();
  const golferBooks = new Map<string, Map<string, BookmakerOdds>>();

  for (const event of events) {
    for (const bookmaker of event.bookmakers) {
      for (const market of bookmaker.markets) {
        if (market.key !== 'outrights') continue;
        for (const outcome of market.outcomes) {
          const implied = americanToImplied(outcome.price);

          // Average implied probability across bookmakers
          const probs = golferImplied.get(outcome.name) ?? [];
          probs.push(implied);
          golferImplied.set(outcome.name, probs);

          // Store per-bookmaker odds (last seen wins if same book appears multiple times)
          if (!golferBooks.has(outcome.name)) golferBooks.set(outcome.name, new Map());
          golferBooks.get(outcome.name)!.set(bookmaker.key, {
            key: bookmaker.key,
            title: bookmaker.title,
            americanOdds: outcome.price,
            oddsDisplay: formatAmerican(outcome.price),
          });
        }
      }
    }
  }

  const results: GolferOdds[] = Array.from(golferImplied.entries()).map(([name, probs]) => {
    const avgProb = probs.reduce((s, p) => s + p, 0) / probs.length;
    const americanOdds = avgProb >= 0.5
      ? Math.round(-avgProb / (1 - avgProb) * 100)
      : Math.round((1 - avgProb) / avgProb * 100);
    const bookmakers = Array.from(golferBooks.get(name)?.values() ?? []);
    return {
      name,
      americanOdds,
      oddsDisplay: formatAmerican(americanOdds),
      impliedProbability: avgProb,
      bookmakers,
    };
  });

  results.sort((a, b) => b.impliedProbability - a.impliedProbability);
  return NextResponse.json(results);
}
