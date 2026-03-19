import type { Tournament } from '@/types';
import Link from 'next/link';

const STATUS_LABELS: Record<Tournament['status'], string> = {
  draft: 'Draft in Progress',
  active: 'Tournament Active',
  completed: 'Completed',
};

const STATUS_COLORS: Record<Tournament['status'], string> = {
  draft: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  active: 'bg-green-500/20 text-green-300 border border-green-500/30',
  completed: 'bg-white/10 text-gray-400 border border-white/10',
};

interface Props {
  tournament: Tournament;
  pickCount?: number;
  totalPicks?: number;
}

export default function TournamentCard({ tournament, pickCount, totalPicks }: Props) {
  return (
    <div className="bg-green-900/40 rounded-xl border border-green-800/60 p-6 hover:border-green-600/60 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{tournament.name}</h2>
          <p className="text-green-400 text-sm mt-1">{tournament.year}</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[tournament.status]}`}
        >
          {STATUS_LABELS[tournament.status]}
        </span>
      </div>

      {tournament.status === 'draft' && pickCount !== undefined && totalPicks !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-green-400 mb-1">
            <span>Draft progress</span>
            <span>{pickCount} / {totalPicks} picks</span>
          </div>
          <div className="w-full bg-green-950 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all"
              style={{ width: `${totalPicks > 0 ? (pickCount / totalPicks) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-5">
        {tournament.status === 'draft' && (
          <Link
            href={`/draft/${tournament.id}`}
            className="flex-1 text-center bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-400 transition-colors"
          >
            Go to Draft
          </Link>
        )}
        <Link
          href={`/leaderboard/${tournament.id}`}
          className="flex-1 text-center bg-white/10 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
