'use client';

import { useState } from 'react';
import Leaderboard from '@/components/Leaderboard';
import type { ParticipantLeaderboardRow } from '@/types';

type Tab = 'single' | 'snake';

interface Props {
  singleRows: ParticipantLeaderboardRow[];
  snakeRows: ParticipantLeaderboardRow[];
}

export default function LeaderboardToggle({ singleRows, snakeRows }: Props) {
  const [tab, setTab] = useState<Tab>('snake');

  const rows = tab === 'single' ? singleRows : snakeRows;

  const tabs: { key: Tab; label: string; sublabel: string }[] = [
    { key: 'snake', label: 'Snake Draft', sublabel: 'Separate bet' },
    { key: 'single', label: 'Single Golfer', sublabel: 'Separate bet' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.label}</span>
            <span className={`text-xs font-normal ${tab === t.key ? 'text-green-500' : 'text-gray-400'}`}>
              {t.sublabel}
            </span>
          </button>
        ))}
      </div>
      <Leaderboard rows={rows} />
    </div>
  );
}
