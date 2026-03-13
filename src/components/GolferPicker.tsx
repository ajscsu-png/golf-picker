'use client';

import { useState, useEffect } from 'react';
import type { EspnGolfer } from '@/types';

interface Props {
  tournamentId: string;
  espnEventId: string;
  participantName: string;
  pickedIds: Set<string>;
  onPickSubmitted: () => void;
}

export default function GolferPicker({
  tournamentId,
  espnEventId,
  participantName,
  pickedIds,
  onPickSubmitted,
}: Props) {
  const [field, setField] = useState<EspnGolfer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EspnGolfer | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/espn/field/${espnEventId}`)
      .then((r) => r.json())
      .then((data: EspnGolfer[]) => {
        setField(data.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [espnEventId]);

  const available = field.filter(
    (g) =>
      !pickedIds.has(g.id) &&
      (search === '' || g.name.toLowerCase().includes(search.toLowerCase()))
  );

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
          <input
            type="text"
            placeholder="Search golfer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {available.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No golfers found</p>
            ) : (
              available.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setSelected(g); setConfirming(true); }}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex justify-between items-center text-sm"
                >
                  <span className="font-medium text-gray-800">{g.name}</span>
                  {g.worldRanking && (
                    <span className="text-xs text-gray-400">WR #{g.worldRanking}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
