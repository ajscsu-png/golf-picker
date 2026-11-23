import type { Tournament } from '../types/index.ts';

const STATUSES = ['draft', 'active', 'completed'] as const;

/** Whitelist + validate the fields PATCH /api/tournaments/[id] may change. Returns null if invalid. */
export function pickTournamentFields(body: unknown): Partial<Omit<Tournament, 'id'>> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const out: Partial<Omit<Tournament, 'id'>> = {};

  if (b.name !== undefined) {
    if (typeof b.name !== 'string' || !b.name.trim()) return null;
    out.name = b.name.trim();
  }
  if (b.espnEventId !== undefined) {
    if (typeof b.espnEventId !== 'string' && typeof b.espnEventId !== 'number') return null;
    out.espnEventId = String(b.espnEventId);
  }
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status as (typeof STATUSES)[number])) return null;
    out.status = b.status as Tournament['status'];
  }
  for (const key of ['year', 'picksPerPerson', 'cutsPerPerson'] as const) {
    if (b[key] !== undefined) {
      const n = typeof b[key] === 'string' ? Number(b[key]) : b[key];
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) return null;
      out[key] = n;
    }
  }
  for (const key of ['isMajor', 'hasSingleDraft'] as const) {
    if (b[key] !== undefined) {
      if (b[key] !== true && b[key] !== false && b[key] !== 'true' && b[key] !== 'false') return null;
      out[key] = b[key] === true || b[key] === 'true';
    }
  }
  return out;
}
