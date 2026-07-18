import type { Tournament } from '@/types';

export function getActiveTournamentId(tournaments: Tournament[]): string {
  return tournaments.find((tournament) => tournament.status === 'active')?.id ?? '';
}

export function markTournamentActive(tournaments: Tournament[], activeTournamentId: string): Tournament[] {
  return tournaments.map((tournament) => {
    if (tournament.id === activeTournamentId) return { ...tournament, status: 'active' };
    if (tournament.status === 'active') return { ...tournament, status: 'completed' };
    return tournament;
  });
}
