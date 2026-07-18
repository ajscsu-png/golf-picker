'use client';

import { useId, useMemo, useState } from 'react';
import type { TeamScoreSnapshot } from '@/types';
import { getMomentumChartPoints, getMomentumYScale } from '@/lib/teamMomentum';

interface Props {
  participantName: string;
  snapshots: TeamScoreSnapshot[];
}

function scoreDisplay(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

export default function TeamMomentumChart({ participantName, snapshots }: Props) {
  const width = 360;
  const height = 190;
  const points = useMemo(() => getMomentumChartPoints(snapshots, width, height), [snapshots]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const gradientId = `momentum-${useId().replace(/:/g, '')}`;
  const selected = points.find((point) => point.hourKey === selectedHour) ?? points.at(-1);

  if (points.length === 0) {
    return (
      <section className="mx-4 my-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
        <h3 className="font-semibold text-gray-900">Today&apos;s momentum</h3>
        <p className="mt-1 text-sm text-gray-500">Tracking starts when this team&apos;s first golfer tees off.</p>
      </section>
    );
  }

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length > 1
    ? `${linePath} L ${points.at(-1)!.x} ${height - 34} L ${points[0].x} ${height - 34} Z`
    : '';
  const baseline = points[0];
  const scores = points.map((point) => point.score);
  const best = Math.min(...scores);
  const worst = Math.max(...scores);
  const yScale = getMomentumYScale(scores, 26, height - 38);
  const latest = points.at(-1)!;
  const change = latest.score - baseline.score;

  return (
    <section className="mx-4 my-4 rounded-xl border border-green-100 bg-gradient-to-b from-green-50/70 to-white px-3 py-4 sm:px-4">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="font-semibold text-gray-900">Today&apos;s momentum</h3>
          <p className="text-xs text-gray-500">Team total · hourly · lower scores rise</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-700">{scoreDisplay(latest.score)}</div>
          <div className={`text-xs font-medium ${change < 0 ? 'text-green-700' : change > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
            {change === 0 ? 'Even today' : `${change < 0 ? '' : '+'}${change} today`}
          </div>
        </div>
      </div>

      <svg
        className="mt-2 h-auto w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${participantName}'s team total by hour today`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[best, Math.round((best + worst) / 2), worst].filter((score, index, values) => values.indexOf(score) === index).map((score) => {
          const y = yScale(score);
          return (
            <g key={score}>
              <line x1="42" x2="338" y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x="34" y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{scoreDisplay(score)}</text>
            </g>
          );
        })}

        <line x1="42" x2="338" y1={baseline.y} y2={baseline.y} stroke="#86efac" strokeDasharray="4 4" />
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {points.length > 1 && <path d={linePath} fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {points.map((point, index) => {
          const showLabel = points.length <= 6 || index % 2 === 0 || index === points.length - 1;
          const isSelected = selected?.hourKey === point.hourKey;
          return (
            <g key={point.hourKey}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 6 : 4.5}
                fill={isSelected ? '#166534' : '#ffffff'}
                stroke="#15803d"
                strokeWidth="3"
                role="button"
                tabIndex={0}
                aria-label={`${point.label}: team total ${scoreDisplay(point.score)}`}
                onClick={() => setSelectedHour(point.hourKey)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedHour(point.hourKey);
                  }
                }}
                className="cursor-pointer outline-none focus-visible:stroke-blue-600"
              />
              {showLabel && (
                <text x={point.x} y={height - 14} textAnchor="middle" fontSize="10" fill="#6b7280">{point.label}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between gap-3 border-t border-green-100 px-1 pt-3 text-xs">
        <span className="text-gray-500">Started today at <strong className="text-gray-700">{scoreDisplay(baseline.score)}</strong></span>
        {selected && <span className="font-semibold text-green-800">{selected.label}: {scoreDisplay(selected.score)}</span>}
      </div>
    </section>
  );
}
