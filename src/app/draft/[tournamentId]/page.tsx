import { notFound } from 'next/navigation';
import { getTournamentById, getParticipants, getPicks } from '@/lib/sheets';
import DraftBoard from '@/components/DraftBoard';
import Link from 'next/link';

export const revalidate = 0; // always dynamic for the draft

interface Props {
  params: { tournamentId: string };
}

export default async function DraftPage({ params }: Props) {
  const [tournament, participants, picks] = await Promise.all([
    getTournamentById(params.tournamentId),
    getParticipants(params.tournamentId),
    getPicks(params.tournamentId),
  ]);

  if (!tournament) notFound();

  if (participants.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-500">No participants configured for this tournament.</p>
        <Link href="/admin" className="text-blue-600 hover:underline mt-2 inline-block">
          Go to Admin to add participants →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tournament.name} {tournament.year}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Snake Draft</p>
        </div>
        <Link
          href={`/leaderboard/${tournament.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          View Leaderboard →
        </Link>
      </div>

      <DraftBoard
        tournament={tournament}
        participants={participants}
        initialPicks={picks}
      />
    </div>
  );
}
