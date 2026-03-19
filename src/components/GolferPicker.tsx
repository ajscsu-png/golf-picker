'use client';

import { useState, useEffect } from 'react';
import type { EspnGolfer } from '@/types';
import type { GolferOdds } from '@/app/api/odds/route';

interface Props {
  tournamentId: string;
  espnEventId: string;
  tournamentName: string;
  participantName: string;
  pickedIds: Set<string>;
  onPickSubmitted: () => void;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, '').trim();
}

export default function GolferPicker({
  tournamentId,
  espnEventId,
  tournamentName,
  participantName,
  pickedIds,
  onPickSubmitted,
}: Props) {
  const [field, setField] = useState<EspnGolfer[]>([]);
  const [oddsMap, setOddsMap] = useState<Map<string, GolferOdds>>(new Map());
  const [sortBy, setSortBy] = useState<'odds' | 'alpha'>('odds');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EspnGolfer | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/espn/field/${espnEventId}`).then((r) => r.json()) as Promise<EspnGolfer[]>,
      fetch(`/api/odds?tournament=${encodeURIComponent(tournamentName)}`).then((r) => r.json()).catch(() => []) as Promise<GolferOdds[]>,
    ]).then(([fieldData, oddsData]) => {
      const map = new Map<string, GolferOdds>();
      for (const o of oddsData) {
        map.set(normalizeName(o.name), o);
      }
      setOddsMap(map);
      setField(fieldData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [espnEventId, tournamentName]);

  function getOdds(golfer: EspnGolfer): GolferOdds | undefined {
    return oddsMap.get(normalizeName(golfer.name));
  }

  const available = field
    .filter(
      (g) =>
        !pickedIds.has(g.id) &&
        (search === '' || g.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'odds') {
        const oa = getOdds(a)?.impliedProbability ?? -1;
        const ob = getOdds(b)?.impliedProbability ?? -1;
        if (oa !== ob) return ob - oa;
      }
      return a.name.localeCompare(b.name);
    });

  async function submitPick() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName,
          golferName: selected.name,
          golferEspnId: selected.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to submit pick');
        setConfirming(false);
      } else {
        setSelected(null);
        setSearch('');
        setConfirming(false);
        onPickSubmitted();
      }
    } catch {
      setError('Network error. Please try again.');
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-green-900/40 border border-green-800/60 rounded-xl text-center text-green-400">
        Loading field...
      </div>
    );
  }

  return (
    <div className="mt-6 bg-green-900/60 border border-green-600/60 rounded-xl p-5">
      <h3 className="text-lg font-bold text-green-100 mb-1">
        🟢 {participantName} — You&apos;re on the clock!
      </h3>
      <p className="text-sm text-green-400 mb-4">Select your golfer below.</p>

      {error && (
        <div className="mb-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {confirming && selected ? (
        <div className="bg-green-950/60 border border-green-700 rounded-lg p-4">
          <p className="font-semibold text-green-100">Confirm pick: <span className="text-green-300">{selected.name}</span>?</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={submitPick}
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-500 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Confirm Pick'}
            </button>
            <button
              onClick={() => { setConfirming(false); setSelected(null); }}
              className="flex-1 bg-green-900 text-green-300 py-2 rounded-lg font-medium hover:bg-green-800 border border-green-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search golfer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-green-700 bg-green-950/60 text-green-100 placeholder:text-green-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => setSortBy((s) => s === 'odds' ? 'alpha' : 'odds')}
              className="border border-green-700 bg-green-900/40 rounded-lg px-3 py-2 text-xs text-green-300 hover:bg-green-800/60 whitespace-nowrap transition-colors"
            >
              {sortBy === 'odds' ? '📊 Odds' : '🔤 A–Z'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-green-800/60 bg-green-950/60 divide-y divide-green-900/60">
            {available.length === 0 ? (
              <p className="text-center text-green-600 py-6 text-sm">No golfers found</p>
            ) : (
              available.map((g) => {
                const odds = getOdds(g);
                return (
                  <button
                    key={g.id}
                    onClick={() => { setSelected(g); setConfirming(true); }}
                    className="w-full text-left px-4 py-3 hover:bg-green-800/40 transition-colors flex justify-between items-center text-sm"
                  >
                    <span className="font-medium text-green-100">{g.name}</span>
                    <span className="text-xs text-green-600 flex gap-2">
                      {odds && <span className="text-amber-400 font-medium">{odds.oddsDisplay}</span>}
                      {g.worldRanking && <span>WR #{g.worldRanking}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
