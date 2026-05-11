import type { EspnGolfer, GolferScore, Pick } from '../types';

interface OddsBackedGolfer {
  name: string;
}

export function normalizeGolferName(s: string): string {
  return s
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[þÞ]/g, 'th')
    .replace(/\bMatt\b/gi, 'Matthew')
    .replace(/\bChris\b/gi, 'Christopher')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export function createOddsGolferId(name: string): string {
  return `odds:${normalizeGolferName(name)}`;
}

export function buildDraftField(field: EspnGolfer[], odds: OddsBackedGolfer[]): EspnGolfer[] {
  if (field.length > 0) return field;
  return odds.map((o) => ({
    id: createOddsGolferId(o.name),
    name: o.name,
    worldRanking: undefined,
  }));
}

export function scoreMatchesPick(score: GolferScore, pick: Pick): boolean {
  return (
    score.golferEspnId === pick.golferEspnId ||
    normalizeGolferName(score.golferName) === normalizeGolferName(pick.golferName)
  );
}

export function findScoreForPick(scores: GolferScore[], pick: Pick): GolferScore | undefined {
  return scores.find((score) => scoreMatchesPick(score, pick));
}
