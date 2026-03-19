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
        <div className="bg-green-900/60 border border-green-700 rounded-xl p-5">
          <h3 className="text-lg font-bold text-green-100 mb-3">Who are you?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {participants.map((p) => (
              <button
                key={p.name}
                onClick={() => selectName(p.name)}
                className="bg-green-800/60 border border-green-600 rounded-lg py-2 px-3 text-sm font-medium text-green-200 hover:bg-green-700/60 hover:text-white transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-green-500 mt-3">
            You can also just watch — <button className="underline text-green-400 hover:text-green-200" onClick={() => setNameSelected(true)}>skip</button>
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-900/40 rounded-xl px-4 py-3 border border-green-800/60">
          <span className="text-sm text-green-400">
            Viewing as: <strong className="text-green-200">{myName ?? 'Spectator'}</strong>
          </span>
          <button
            onClick={() => { setMyName(null); setNameSelected(false); }}
            className="text-xs text-green-400 hover:text-green-200 transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* Status banner */}
      {isDraftDone ? (
        <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 text-center">
          <p className="font-bold text-green-100 text-lg">Draft Complete! 🏌️</p>
          <p className="text-sm text-green-400 mt-1">All picks are in. Check the leaderboard for scores.</p>
        </div>
      ) : (
        <div className={`rounded-xl p-4 border ${isMyTurn ? 'bg-yellow-500/20 border-yellow-400/40' : 'bg-green-900/40 border-green-800/60'}`}>
          <p className="text-sm font-medium text-green-400">On the clock</p>
          <p className={`text-2xl font-bold mt-1 ${isMyTurn ? 'text-yellow-100' : 'text-white'}`}>{onTheClock?.participantName}</p>
          <p className="text-sm text-green-500 mt-1">
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
        <h3 className="text-base font-semibold text-green-300 mb-3">Draft Board</h3>

        {/* Desktop table — hidden on small screens */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-green-800/60">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-green-950/60 border-b border-green-800/60">
                <th className="py-2 px-3 text-left text-xs font-semibold text-green-500 w-12">RD</th>
                {participants.map((p) => (
                  <th
                    key={p.name}
                    className={`py-2 px-3 text-center text-xs font-semibold ${p.name === myName ? 'text-green-300' : 'text-green-500'}`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...(tournament.hasSingleDraft ? [0] : []), ...Array.from({ length: tournament.picksPerPerson }, (_, i) => i + 1)].map((round) => {
                const roundSlots = draftOrder.filter((s) => s.roundNumber === round);
                const slotByParticipant = new Map(
                  roundSlots.map((s) => [s.participantName, s])
                );
                return (
                  <tr
                    key={round}
                    className={`border-b border-green-900/60 last:border-0 ${round === 0 ? 'bg-amber-500/10' : ''}`}
                  >
                    <td className="py-2 px-3 font-medium text-xs text-center">
                      {round === 0
                        ? <span className="text-amber-400 font-semibold">★</span>
                        : <span className="text-green-600">{round}</span>}
                    </td>
                    {participants.map((p) => {
                      const slot = slotByParticipant.get(p.name);
                      if (!slot) return <td key={p.name} />;
                      const pick = getPickForSlot(slot);
                      const isCurrentSlot =
                        onTheClock?.overallPickNumber === slot.overallPickNumber;
                      return (
                        <td
                          key={p.name}
                          className={`py-2 px-3 text-center ${
                            isCurrentSlot
                              ? 'bg-green-500/20 font-semibold text-green-300'
                              : pick
                              ? 'text-green-100'
                              : 'text-green-800'
                          }`}
                        >
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
            const slotByParticipant = new Map(
              roundSlots.map((s) => [s.participantName, s])
            );
            return (
              <div key={round} className="rounded-xl border border-green-800/60 bg-green-900/40 overflow-hidden">
                <div className={`border-b border-green-800/60 px-4 py-2 ${round === 0 ? 'bg-amber-500/10' : 'bg-green-950/60'}`}>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${round === 0 ? 'text-amber-400' : 'text-green-500'}`}>
                    {round === 0 ? '★ Single Pick' : `Round ${round}`}
                  </span>
                </div>
                <ul className="divide-y divide-green-900/60">
                  {participants.map((p) => {
                    const slot = slotByParticipant.get(p.name);
                    if (!slot) return null;
                    const pick = getPickForSlot(slot);
                    const isCurrentSlot =
                      onTheClock?.overallPickNumber === slot.overallPickNumber;
                    return (
                      <li
                        key={p.name}
                        className={`flex items-center justify-between px-4 py-2.5 ${
                          isCurrentSlot ? 'bg-green-500/10' : ''
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            p.name === myName ? 'text-green-300' : 'text-green-200'
                          }`}
                        >
                          {p.name}
                        </span>
                        <span
                          className={`text-sm ${
                            isCurrentSlot
                              ? 'text-green-300 font-semibold animate-pulse'
                              : pick
                              ? 'text-green-100'
                              : 'text-green-700'
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
