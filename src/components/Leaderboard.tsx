'use client';

import { useState } from 'react';
import type { ParticipantLeaderboardRow, GolferScore } from '@/types';

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

function getGrade(g: GolferScore & { picked: boolean; dropped: boolean }): string | null {
  if (g.dropped) return null;
  if (g.status === 'cut' || g.status === 'wd' || g.status === 'dq') return 'F';
  if (g.totalScore === null) return null;
  const pos = parseInt(g.position?.replace(/[^0-9]/g, '') ?? '', 10);
  if (isNaN(pos)) return null;
  if (pos <= 5) return 'A';
  if (pos <= 15) return 'B';
  if (pos <= 30) return 'C';
  return 'D';
}

function gradeBadge(grade: string | null) {
  if (!grade) return null;
  const styles: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-gray-100 text-gray-600',
    F: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${styles[grade] ?? 'bg-gray-100 text-gray-500'}`}>
      {grade}
    </span>
  );
}

function statusBadge(status: string, dropped: boolean, bubbleApplied: boolean) {
  if (dropped) return <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">DROPPED</span>;
  if (bubbleApplied) return <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded" title="Missed cut — assigned bubble score">BUBBLE</span>;
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
          <div key={row.participant.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-green-400 transition-colors shadow-sm">
            <button
              onClick={() => toggle(row.participant.name)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-2xl font-bold text-gray-300 w-8 flex-shrink-0 text-center">
                {row.rank}
              </span>
              <span className="flex-1 font-semibold text-gray-900">
                {row.participant.name}{row.participant.name === 'Kyle' ? ' 🤡' : ''}
              </span>
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
                    {[...row.golfers].sort((a, b) => {
                      if (a.totalScore === null && b.totalScore === null) return 0;
                      if (a.totalScore === null) return 1;
                      if (b.totalScore === null) return -1;
                      return a.totalScore - b.totalScore;
                    }).map((g) => {
                      const activeRound = g.r4 !== null ? 4 : g.r3 !== null ? 3 : g.r2 !== null ? 2 : g.r1 !== null ? 1 : 0;
                      const thruCell = (round: number) => {
                        if (activeRound !== round || g.status !== 'active' || g.thru === null) return null;
                        if (g.thru === 18) return <div className="text-xs text-gray-400 leading-tight">F</div>;
                        if (g.thru > 0) return <div className="text-xs text-gray-400 leading-tight">thru {g.thru}</div>;
                        return null;
                      };
                      return (
                        <tr key={g.golferEspnId} className={`border-t border-gray-50 ${g.dropped ? 'opacity-40' : ''}`}>
                          <td className="py-2 px-5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={g.status !== 'active' || g.dropped ? 'text-gray-400 line-through' : 'text-gray-800'}>
                                {g.golferName}
                              </span>
                              {g.teeTime && (
                                <span className="text-xs text-gray-400">{g.teeTime}</span>
                              )}
                              {statusBadge(g.status, g.dropped, g.bubbleApplied)}
                              {g.totalScore !== null && gradeBadge(getGrade(g))}
                            </div>
                          </td>
                          <td className="text-center py-2 px-2 text-gray-600">{g.position || '—'}</td>
                          <td className={`text-center py-2 px-2 ${scoreColor(g.totalScore)}`}>
                            {scoreDisplay(g.totalScore)}
                          </td>
                          <td className={`text-center py-2 px-2 ${scoreColor(g.r1)}`}>{scoreDisplay(g.r1)}{thruCell(1)}</td>
                          <td className={`text-center py-2 px-2 ${scoreColor(g.r2)}`}>{scoreDisplay(g.r2)}{thruCell(2)}</td>
                          <td className={`text-center py-2 px-2 ${scoreColor(g.r3)}`}>{scoreDisplay(g.r3)}{thruCell(3)}</td>
                          <td className={`text-center py-2 px-2 ${scoreColor(g.r4)}`}>{scoreDisplay(g.r4)}{thruCell(4)}</td>
                        </tr>
                      );
                    })}
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
