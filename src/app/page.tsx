import {
  getConfig,
  getTournamentById,
  getTournaments,
  getPicks,
  getParticipants,
  getScores,
} from '@/lib/sheets';
import { computeDraftOrder, getOnTheClock } from '@/lib/draft';
import TournamentCard from '@/components/TournamentCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [activeTournamentId, allTournaments] = await Promise.all([
    getConfig('active_tournament_id'),
    getTournaments(),
  ]);

  const activeTournament =
    activeTournamentId ? await getTournamentById(activeTournamentId) : null;

  let onClockName: string | null = null;
  let pickCount = 0;
  let totalPicks = 0;

  if (activeTournament) {
    const [picks, participants] = await Promise.all([
      getPicks(activeTournament.id),
      getParticipants(activeTournament.id),
    ]);
    pickCount = picks.length;
    totalPicks = participants.length * activeTournament.picksPerPerson;

    if (activeTournament.status === 'draft') {
      const order = computeDraftOrder(participants, activeTournament.picksPerPerson);
      const slot = getOnTheClock(order, picks);
      onClockName = slot?.participantName ?? null;
    }
  }

  const otherTournaments = allTournaments.filter(
    (t) => t.id !== activeTournamentId
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⛳ Golf Major Picker</h1>
        <p className="text-gray-500 mt-1">Snake draft picks and live leaderboards for the 4 majors.</p>
      </div>

      {activeTournament ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Tournament</h2>
          <TournamentCard
            tournament={activeTournament}
            pickCount={pickCount}
            totalPicks={totalPicks}
          />

          {activeTournament.status === 'draft' && onClockName && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">On the clock</p>
                <p className="text-lg font-bold text-yellow-900">{onClockName}</p>
              </div>
              <Link
                href={`/draft/${activeTournament.id}`}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
              >
                Go Draft →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-500">
          <p className="text-lg font-medium">No active tournament</p>
          <p className="text-sm mt-1">
            <Link href="/admin" className="text-blue-600 hover:underline">Go to Admin</Link> to set one up.
          </p>
        </div>
      )}

      {otherTournaments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">All Tournaments</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
