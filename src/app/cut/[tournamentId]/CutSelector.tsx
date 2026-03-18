'use client';

import { useState } from 'react';
import type { Participant, Pick, Cut } from '@/types';

interface Props {
  tournamentId: string;
  cutsPerPerson: number;
  participants: Participant[];
  picks: Pick[];
  existingCuts: Cut[];
}

export default function CutSelector({
  tournamentId,
  cutsPerPerson,
  participants,
  picks,
  existingCuts,
}: Props) {
  const [selectedParticipant, setSelectedParticipant] = useState('');
  // Ordered array — position in array = drop number (index 0 = drop 1, etc.)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  function handleParticipantChange(name: string) {
    setSelectedParticipant(name);
    setMessage('');
    const existing = existingCuts
      .filter((c) => c.participantName === name)
      .sort((a, b) => a.dropNumber - b.dropNumber)
      .map((c) => c.golferEspnId);
    setSelectedIds(existing);
  }

  function toggleGolfer(espnId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(espnId)) {
        return prev.filter((id) => id !== espnId);
      }
      if (prev.length >= cutsPerPerson) return prev;
      return [...prev, espnId];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParticipant) { setMessage('Select your name first.'); return; }
    if (selectedIds.length === 0) { setMessage('Select at least 1 golfer to cut.'); return; }

    const myPicks = picks.filter((p) => p.participantName === selectedParticipant);
    const cuts = selectedIds.map((id, idx) => {
      const pick = myPicks.find((p) => p.golferEspnId === id)!;
      return { golferEspnId: id, golferName: pick.golferName, dropNumber: idx + 1 };
    });

    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/cuts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: selectedParticipant, cuts }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Cuts saved!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  const myPicks = picks.filter((p) => p.participantName === selectedParticipant);
  const myCuts = existingCuts
    .filter((c) => c.participantName === selectedParticipant)
    .sort((a, b) => a.dropNumber - b.dropNumber);
  const hasThirdDrop = cutsPerPerson >= 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select participant */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Who are you?</label>
        <select
          value={selectedParticipant}
          onChange={(e) => handleParticipantChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">— select your name —</option>
          {participants.map((p) => {
            const hasCuts = existingCuts.some((c) => c.participantName === p.name);
            return (
              <option key={p.name} value={p.name}>
                {p.name}{hasCuts ? ' ✓' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Step 2: Select golfers to cut */}
      {selectedParticipant && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              Select {cutsPerPerson} golfer{cutsPerPerson > 1 ? 's' : ''} to cut
            </label>
            <span className="text-xs text-gray-400">{selectedIds.length}/{cutsPerPerson} selected</span>
          </div>

          {hasThirdDrop && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              ⚠️ 3 cuts enabled. The order you select matters — your 3rd selection gets the bubble score if they missed the cut.
            </p>
          )}

          {myPicks.length === 0 ? (
            <p className="text-sm text-gray-400">No picks found for {selectedParticipant}.</p>
          ) : (
            <div className="space-y-2">
              {myPicks.map((pick) => {
                const dropIndex = selectedIds.indexOf(pick.golferEspnId);
                const isSelected = dropIndex !== -1;
                const isDisabled = !isSelected && selectedIds.length >= cutsPerPerson;
                const dropNum = isSelected ? dropIndex + 1 : null;
                const isThirdDrop = dropNum === 3;
                return (
                  <button
                    key={pick.golferEspnId}
                    type="button"
                    onClick={() => toggleGolfer(pick.golferEspnId)}
                    disabled={isDisabled}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors text-left
                      ${isThirdDrop
                        ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                        : isSelected
                          ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                          : isDisabled
                            ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <span>{pick.golferName}</span>
                    {isSelected && (
                      <span className="text-xs font-semibold">
                        {isThirdDrop ? 'DROP 3 (bubble)' : `DROP ${dropNum}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Already submitted notice */}
      {selectedParticipant && myCuts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">Previously cut:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {myCuts.map((c) => (
              <li key={c.golferEspnId}>
                {c.golferName}
                {c.dropNumber === 3 && <span className="text-orange-600 ml-1">(bubble drop)</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-yellow-600">Submitting again will replace your previous cuts.</p>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      {selectedParticipant && (
        <button
          type="submit"
          disabled={submitting || selectedIds.length === 0}
          className="w-full bg-red-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : `Cut ${selectedIds.length} Golfer${selectedIds.length !== 1 ? 's' : ''}`}
        </button>
      )}
    </form>
  );
}
