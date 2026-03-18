import type { TournamentFacts } from '@/lib/tournamentFacts';

interface Props {
  facts: TournamentFacts;
}

export default function TournamentFactsCard({ facts }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{facts.course}</h2>
          <p className="text-sm text-gray-500 mt-0.5">📍 {facts.location}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          facts.access === 'Private'
            ? 'bg-gray-100 text-gray-600'
            : facts.access === 'Resort'
            ? 'bg-blue-100 text-blue-600'
            : 'bg-green-100 text-green-600'
        }`}>
          {facts.access}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Par</p>
          <p className="text-lg font-bold text-gray-800">{facts.par}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Yardage</p>
          <p className="text-lg font-bold text-gray-800">{facts.yardage.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Founded</p>
          <p className="text-lg font-bold text-gray-800">{facts.founded}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Designer</p>
          <p className="text-sm font-semibold text-gray-800 leading-tight">{facts.designer}</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm text-green-800 italic">
        💡 {facts.funFact}
      </div>
    </div>
  );
}
