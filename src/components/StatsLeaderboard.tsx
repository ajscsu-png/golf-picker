import type { ParticipantStats, PoolStats } from '@/types';

interface Props {
  participants: ParticipantStats[];
  completedTournamentCount: number;
}

function money(value: number, showPositive = false): string {
  if (value > 0 && showPositive) return `+$${value}`;
  if (value < 0) return `−$${Math.abs(value)}`;
  return `$${value}`;
}

function average(pool: PoolStats): string {
  return pool.averageFinish === null ? '—' : pool.averageFinish.toFixed(1);
}

function poolSummary(pool: PoolStats): string {
  return `${pool.wins} ${pool.wins === 1 ? 'win' : 'wins'} · ${average(pool)} avg`;
}

function bestPoolLeader(participants: ParticipantStats[], pool: 'single' | 'snake'): ParticipantStats | undefined {
  return [...participants].sort((a, b) =>
    b[pool].wins - a[pool].wins
    || (a[pool].averageFinish ?? Infinity) - (b[pool].averageFinish ?? Infinity)
    || a.name.localeCompare(b.name)
  )[0];
}

export default function StatsLeaderboard({ participants, completedTournamentCount }: Props) {
  if (participants.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
        No completed tournament stats yet.
      </div>
    );
  }

  const moneyLeader = participants[0];
  const singleLeader = bestPoolLeader(participants, 'single')!;
  const snakeLeader = bestPoolLeader(participants, 'snake')!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Completed Tournament Stats</h1>
        <p className="mt-1 text-sm text-gray-500">
          {completedTournamentCount} fully tracked tournaments · live tournaments excluded
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-700 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Money Leader</p>
          <p className="mt-2 text-2xl font-bold">{moneyLeader.name}</p>
          <p className="mt-1 text-sm text-emerald-100">{money(moneyLeader.netWinnings, true)} net</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Single Golfer</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{singleLeader.name}</p>
          <p className="mt-1 text-sm text-gray-500">{poolSummary(singleLeader.single)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Snake Draft</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{snakeLeader.name}</p>
          <p className="mt-1 text-sm text-gray-500">{poolSummary(snakeLeader.snake)}</p>
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Leaderboard</h2>
          <p className="mt-0.5 text-xs text-gray-500">Sorted by net winnings</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center">Single</th>
                <th className="px-4 py-3 text-center">Snake</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-5 py-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {participants.map((participant, index) => (
                <tr key={participant.name}>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    <span className="mr-3 inline-block w-5 text-right text-gray-400">{index + 1}</span>
                    {participant.name}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-700">{poolSummary(participant.single)}</td>
                  <td className="px-4 py-4 text-center text-gray-700">{poolSummary(participant.snake)}</td>
                  <td className="px-4 py-4 text-right font-medium text-gray-700">{money(participant.grossWinnings)}</td>
                  <td className={`px-5 py-4 text-right font-bold ${participant.netWinnings > 0 ? 'text-emerald-700' : participant.netWinnings < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {money(participant.netWinnings, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 md:hidden">
        {participants.map((participant, index) => (
          <article key={participant.name} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400">#{index + 1}</p>
                <h2 className="text-lg font-bold text-gray-900">{participant.name}</h2>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${participant.netWinnings > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {money(participant.netWinnings, true)}
                </p>
                <p className="text-xs text-gray-500">net · {money(participant.grossWinnings)} gross</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Single</p>
                <p className="mt-1 font-medium text-gray-700">{poolSummary(participant.single)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Snake</p>
                <p className="mt-1 font-medium text-gray-700">{poolSummary(participant.snake)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="text-center text-xs text-gray-400">
        Each pool winner receives $10 from every non-winner. Tied winners split the pot.
      </p>
    </div>
  );
}
