'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tournament, Participant, Pick, DraftSlot } from '@/types';
import { computeDraftOrder, getOnTheClock } from '@/lib/draft';
import GolferPicker from './GolferPicker';

interface Props {
  tournament: Tournament;
  participants: Participant[];
  initialPicks: Pick[];
}

export default function DraftBoard({ tournament, participants, initialPicks }: Props) {
  const [picks, setPicks] = useState<Pick[]>(initialPicks);
  const [myName, setMyName] = useState<string | null>(null);
  const [nameSelected, setNameSelected] = useState(false);

  const draftOrder = computeDraftOrder(participants, tournament.picksPerPerson, tournament.hasSingleDraft);
  const onTheClock: DraftSlot | null = getOnTheClock(draftOrder, picks);
  const pickedIds = new Set(picks.map((p) => p.golferEspnId));

  // Load saved name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`golf-picker-name-${tournament.id}`);
    if (saved && participants.some((p) => p.name === saved)) {
      setMyName(saved);
      setNameSelected(true);
    }
  }, [tournament.id, participants]);

  // Poll for new picks every 10 seconds
  const refreshPicks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/picks`);
      if (res.ok) {
        const data: Pick[] = await res.json();
        setPicks(data);
      }
    } catch {
      // ignore transient errors
    }
  }, [tournament.id]);

  useEffect(() => {
    const interval = setInterval(refreshPicks, 10000);
    return () => clearInterval(interval);
  }, [refreshPicks]);

  function selectName(name: string) {
    setMyName(name);
    setNameSelected(true);
    localStorage.setItem(`golf-picker-name-${tournament.id}`, name);
  }

  function getPickForSlot(slot: DraftSlot): Pick | undefined {
    return picks.find((p) => p.overallPickNumber === slot.overallPickNumber);
  }

  const isDraftDone = !onTheClock;
  const isMyTurn = nameSelected && myName === onTheClock?.participantName;

  return (
    <div className="space-y-6">
      {/* Name selector */}
      {!nameSelected ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-lg font-bold text-blue-800 mb-3">Who are you?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {participants.map((p) => (
              <button
                key={p.name}
                onClick={() => selectName(p.name)}
                className="bg-white border border-blue-300 rounded-lg py-2 px-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-3">
            You can also just watch — <button className="underline" onClick={() => setNameSelected(true)}>skip</button>
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <span className="text-sm text-gray-600">
            Viewing as: <strong>{myName ?? 'Spectator'}</strong>
          </span>
          <button
            onClick={() => { setMyName(null); setNameSelected(false); }}
            className="text-xs text-blue-500 hover:underline"
          >
            Change
          </button>
        </div>
      )}

      {/* Status banner */}
      {isDraftDone ? (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
          <p className="font-bold text-green-800 text-lg">Draft Complete! 🏌️</p>
          <p className="text-sm text-green-700 mt-1">All picks are in. Check the leaderboard for scores.</p>
        </div>
      ) : (
        <div className={`rounded-xl p-4 border ${isMyTurn ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
          <p className="text-sm font-medium text-gray-500">On the clock</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{onTheClock?.participantName}</p>
          <p className="text-sm text-gray-400 mt-1">
            {onTheClock?.roundNumber === 0 ? 'Single Pick' : `Round ${onTheClock?.roundNumber}`}, Pick {onTheClock?.overallPickNumber}
          </p>
        </div>
      )}

      {/* Golfer picker — only shown when it's your turn */}
      {isMyTurn && myName && !isDraftDone && (
        <GolferPicker
          tournamentId={tournament.id}
          espnEventId={tournament.espnEventId}
          tournamentName={tournament.name}
          participantName={myName}
          pickedIds={pickedIds}
          onPickSubmitted={refreshPicks}
        />
      )}

      {/* Draft board grid */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">Draft Board</h3>

        {/* Desktop table — hidden on small screens */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 w-12">RD</th>
                {participants.map((_, i) => (
                  <th key={i} className="py-2 px-3 text-center text-xs font-semibold text-gray-400">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...(tournament.hasSingleDraft ? [0] : []), ...Array.from({ length: tournament.picksPerPerson }, (_, i) => i + 1)].map((round) => {
                const roundSlots = draftOrder.filter((s) => s.roundNumber === round);
                return (
                  <tr
                    key={round}
                    className={`border-b border-gray-100 last:border-0 ${round === 0 ? 'bg-amber-50' : ''}`}
                  >
                    <td className="py-2 px-3 font-medium text-xs text-center">
                      {round === 0
                        ? <span className="text-amber-600 font-semibold">★</span>
                        : <span className="text-gray-400">{round}</span>}
                    </td>
                    {roundSlots.map((slot) => {
                      const pick = getPickForSlot(slot);
                      const isCurrentSlot = onTheClock?.overallPickNumber === slot.overallPickNumber;
                      return (
                        <td
                          key={slot.participantName}
                          className={`py-2 px-3 text-center ${
                            isCurrentSlot
                              ? 'bg-green-100 font-semibold text-green-800'
                              : pick
                              ? 'text-gray-800'
                              : 'text-gray-300'
                          }`}
                        >
                          <div className={`text-xs font-semibold mb-0.5 ${slot.participantName === myName ? 'text-green-700' : 'text-gray-500'}`}>
                            {slot.participantName}
                          </div>
                          {pick ? (
                            <span className="text-xs leading-tight">{pick.golferName}</span>
                          ) : isCurrentSlot ? (
                            <span className="text-xs animate-pulse">ON CLOCK</span>
                          ) : (
                            <span className="text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card view — shown only on small screens */}
        <div className="sm:hidden space-y-3">
          {[...(tournament.hasSingleDraft ? [0] : []), ...Array.from({ length: tournament.picksPerPerson }, (_, i) => i + 1)].map((round) => {
            const roundSlots = draftOrder.filter((s) => s.roundNumber === round);
            return (
              <div key={round} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className={`border-b border-gray-200 px-4 py-2 ${round === 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${round === 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                    {round === 0 ? '★ Single Pick' : `Round ${round}`}
                  </span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {roundSlots.map((slot) => {
                    const pick = getPickForSlot(slot);
                    const isCurrentSlot = onTheClock?.overallPickNumber === slot.overallPickNumber;
                    return (
                      <li
                        key={slot.participantName}
                        className={`flex items-center justify-between px-4 py-2.5 ${
                          isCurrentSlot ? 'bg-green-50' : ''
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            slot.participantName === myName ? 'text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {slot.participantName}
                        </span>
                        <span
                          className={`text-sm ${
                            isCurrentSlot
                              ? 'text-green-700 font-semibold animate-pulse'
                              : pick
                              ? 'text-gray-800'
                              : 'text-gray-300'
                          }`}
                        >
                          {pick
                            ? pick.golferName
                            : isCurrentSlot
                            ? 'ON CLOCK'
                            : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
