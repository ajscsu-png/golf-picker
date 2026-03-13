import type { Tournament } from '@/types';
import Link from 'next/link';

const STATUS_LABELS: Record<Tournament['status'], string> = {
  draft: 'Draft in Progress',
  active: 'Tournament Active',
  completed: 'Completed',
};

const STATUS_COLORS: Record<Tournament['status'], string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
};

interface Props {
  tournament: Tournament;
  pickCount?: number;
  totalPicks?: number;
}

export default function TournamentCard({ tournament, pickCount, totalPicks }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{tournament.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{tournament.year}</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[tournament.status]}`}
        >
          {STATUS_LABELS[tournament.status]}
        </span>
      </div>

      {tournament.status === 'draft' && pickCount !== undefined && totalPicks !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Draft progress</span>
            <span>{pickCount} / {totalPicks} picks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${totalPicks > 0 ? (pickCount / totalPicks) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-5">
        {tournament.status === 'draft' && (
          <Link
            href={`/draft/${tournament.id}`}
            className="flex-1 text-center bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Go to Draft
          </Link>
        )}
        <Link
          href={`/leaderboard/${tournament.id}`}
          className="flex-1 text-center bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
