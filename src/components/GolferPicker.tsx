'use client';

import { useState, useEffect } from 'react';
import type { EspnGolfer } from '@/types';
import type { GolferOdds, BookmakerOdds } from '@/app/api/odds/route';

interface Props {
  tournamentId: string;
  espnEventId: string;
  tournamentName: string;
  participantName: string;
  pickedIds: Set<string>;
  onPickSubmitted: () => void;
}

function normalizeName(s: string): string {
  return s
    // Transliterate chars that don't decompose via NFD
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[þÞ]/g, 'th')
    // Expand common nicknames -> full names (match ESPN short names to DK full names)
    .replace(/\bMatt\b/gi, 'Matthew')
    .replace(/\bChris\b/gi, 'Christopher')
    .normalize('NFD')                    // decompose accented chars (Å → A + combining ring)
    .replace(/[\u0300-\u036f]/g, '')     // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z]/g, '');            // strip everything except letters
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
  const [oddsSource, setOddsSource] = useState<string>('avg');
  const [availableBooks, setAvailableBooks] = useState<{ key: string; title: string }[]>([]);

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
      // Collect unique bookmakers from all golfers
      const bookSet = new Map<string, string>();
      for (const o of oddsData) {
        for (const b of o.bookmakers ?? []) {
          bookSet.set(b.key, b.title);
        }
      }
      setAvailableBooks(Array.from(bookSet.entries()).map(([key, title]) => ({ key, title })));
      setOddsMap(map);
      setField(fieldData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [espnEventId, tournamentName]);

  function getOdds(golfer: EspnGolfer): GolferOdds | undefined {
    return oddsMap.get(normalizeName(golfer.name));
  }

  function getDisplayOdds(golfer: EspnGolfer): { display: string; implied: number } | undefined {
    const odds = getOdds(golfer);
    if (!odds) return undefined;
    if (oddsSource === 'avg') return { display: odds.oddsDisplay, implied: odds.impliedProbability };
    const book = odds.bookmakers?.find((b: BookmakerOdds) => b.key === oddsSource);
    if (!book) return undefined;
    const implied = book.americanOdds > 0
      ? 100 / (book.americanOdds + 100)
      : -book.americanOdds / (-book.americanOdds + 100);
    return { display: book.oddsDisplay, implied };
  }

  const available = field
    .filter(
      (g) =>
        !pickedIds.has(g.id) &&
        (search === '' || g.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'odds') {
        const oa = getDisplayOdds(a)?.implied ?? -1;
        const ob = getDisplayOdds(b)?.implied ?? -1;
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
      <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center text-gray-500">
        Loading field...
      </div>
    );
  }

  return (
    <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">
      <h3 className="text-lg font-bold text-green-800 mb-1">
        🟢 {participantName} — You&apos;re on the clock!
      </h3>
      <p className="text-sm text-green-700 mb-4">Select your golfer below.</p>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {confirming && selected ? (
        <div className="bg-white border border-green-300 rounded-lg p-4">
          <p className="font-semibold text-gray-800">Confirm pick: <span className="text-green-700">{selected.name}</span>?</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={submitPick}
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Confirm Pick'}
            </button>
            <button
              onClick={() => { setConfirming(false); setSelected(null); }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {availableBooks.length > 0 && (
            <div className="flex gap-1 mb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setOddsSource('avg')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${oddsSource === 'avg' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                Avg
              </button>
              {availableBooks.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setOddsSource(b.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${oddsSource === b.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  {b.title}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search golfer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="button"
              onClick={() => setSortBy((s) => s === 'odds' ? 'alpha' : 'odds')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            >
              {sortBy === 'odds' ? '📊 Odds' : '🔤 A–Z'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {available.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No golfers found</p>
            ) : (
              available.map((g) => {
                const odds = getOdds(g);
                return (
                  <button
                    key={g.id}
                    onClick={() => { setSelected(g); setConfirming(true); }}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex justify-between items-center text-sm"
                  >
                    <span className="font-medium text-gray-800">{g.name}</span>
                    <span className="text-xs text-gray-400 flex gap-2">
                      {(() => { const d = getDisplayOdds(g); return d ? <span className="text-blue-500 font-medium">{d.display}</span> : null; })()}
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
