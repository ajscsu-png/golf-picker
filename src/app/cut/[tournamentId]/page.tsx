import { notFound } from 'next/navigation';
import { getTournamentById, getParticipants, getPicks, getCuts } from '@/lib/sheets';
import CutSelector from './CutSelector';

export const revalidate = 0;

interface Props {
  params: { tournamentId: string };
}

export default async function CutPage({ params }: Props) {
  const [tournament, participants, picks, cuts] = await Promise.all([
    getTournamentById(params.tournamentId),
    getParticipants(params.tournamentId),
    getPicks(params.tournamentId),
    getCuts(params.tournamentId),
  ]);

  if (!tournament) notFound();

  if (tournament.cutsPerPerson === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Cuts are not enabled for this tournament.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tournament.name} {tournament.year}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Cut {tournament.cutsPerPerson} golfer{tournament.cutsPerPerson > 1 ? 's' : ''} from your team after Round 2
        </p>
      </div>

      <CutSelector
        tournamentId={tournament.id}
        cutsPerPerson={tournament.cutsPerPerson}
        participants={participants}
        picks={picks}
        existingCuts={cuts}
      />
    </div>
  );
}
