'use client';

import { useState } from 'react';
import type { ParticipantLeaderboardRow } from '@/types';

function scoreDisplay(score: number | null): string {
  if (score === null) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score < 0) return 'text-red-600 font-semibold';
  if (score === 0) return 'text-gray-700';
  return 'text-gray-700';
}

function statusBadge(status: string) {
  if (status === 'cut') return <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">CUT</span>;
  if (status === 'wd') return <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">WD</span>;
  if (status === 'dq') return <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">DQ</span>;
  return null;
}

interface Props {
  rows: ParticipantLeaderboardRow[];
}

export default function Leaderboard({ rows }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const isExpanded = expanded.has(row.participant.name);
        return (
          <div key={row.participant.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggle(row.participant.name)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-2xl font-bold text-gray-300 w-8 flex-shrink-0 text-center">
                {row.rank}
              </span>
              <span className="flex-1 font-semibold text-gray-900">{row.participant.name}</span>
              <span className={`text-xl font-bold ${scoreColor(row.totalScore)}`}>
                {scoreDisplay(row.totalScore)}
              </span>
              <span className="text-gray-400 ml-2 text-xs">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left py-2 px-5">Golfer</th>
                      <th className="text-center py-2 px-2">Pos</th>
                      <th className="text-center py-2 px-2">Tot</th>
                      <th className="text-center py-2 px-2">R1</th>
                      <th className="text-center py-2 px-2">R2</th>
                      <th className="text-center py-2 px-2">R3</th>
                      <th className="text-center py-2 px-2">R4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.golfers.map((g) => (
                      <tr key={g.golferEspnId} className="border-t border-gray-50">
                        <td className="py-2 px-5">
                          <div className="flex items-center gap-2">
                            <span className={g.status !== 'active' ? 'text-gray-400' : 'text-gray-800'}>
                              {g.golferName}
                            </span>
                            {statusBadge(g.status)}
                          </div>
                        </td>
                        <td className="text-center py-2 px-2 text-gray-600">{g.position || '—'}</td>
                        <td className={`text-center py-2 px-2 ${scoreColor(g.totalScore)}`}>
                          {scoreDisplay(g.totalScore)}
                        </td>
                        <td className="text-center py-2 px-2 text-gray-500">{g.r1 ?? '—'}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{g.r2 ?? '—'}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{g.r3 ?? '—'}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{g.r4 ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
