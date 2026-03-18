import { notFound } from 'next/navigation';
import { getTournamentById, getParticipants, getPicks, getCuts } from '@/lib/sheets';
import { getCurrentRound } from '@/lib/espn';
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

  const round = await getCurrentRound(tournament.espnEventId);
  const locked = round >= 3;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tournament.name} {tournament.year}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Cut {tournament.cutsPerPerson} golfer{tournament.cutsPerPerson > 1 ? 's' : ''} from your team after Round 2
        </p>
      </div>

      {locked ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
          <p className="text-red-700 font-semibold text-lg">🔒 Cuts are locked</p>
          <p className="text-red-600 text-sm">Round 3 has begun. No more changes allowed.</p>
          {cuts.length > 0 && (
            <div className="mt-4 text-left space-y-1">
              <p className="text-sm font-medium text-gray-700">Submitted cuts:</p>
              {participants.map((p) => {
                const myCuts = cuts.filter((c) => c.participantName === p.name).sort((a, b) => a.dropNumber - b.dropNumber);
                if (myCuts.length === 0) return null;
                return (
                  <div key={p.name} className="text-sm text-gray-600">
                    <span className="font-medium">{p.name}:</span>{' '}
                    {myCuts.map((c) => c.golferName).join(', ')}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <CutSelector
          tournamentId={tournament.id}
          cutsPerPerson={tournament.cutsPerPerson}
          participants={participants}
          picks={picks}
          existingCuts={cuts}
          locked={false}
        />
      )}
    </div>
  );
}
