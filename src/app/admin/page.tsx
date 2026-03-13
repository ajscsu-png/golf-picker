'use client';

import { useState, useEffect } from 'react';
import type { Tournament, EspnEvent } from '@/types';

interface ParticipantEntry {
  name: string;
  draftPosition: number;
}

export default function AdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [espnEvents, setEspnEvents] = useState<EspnEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Create tournament form
  const [tName, setTName] = useState('');
  const [tYear, setTYear] = useState(String(new Date().getFullYear()));
  const [tEspnId, setTEspnId] = useState('');
  const [tEspnName, setTEspnName] = useState('');
  const [tPicks, setTPicks] = useState('6');
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tMessage, setTMessage] = useState('');

  // Participants form
  const [selectedTournament, setSelectedTournament] = useState('');
  const [participants, setParticipants] = useState<ParticipantEntry[]>(
    Array.from({ length: 8 }, (_, i) => ({ name: '', draftPosition: i + 1 }))
  );
  const [pSubmitting, setPSubmitting] = useState(false);
  const [pMessage, setPMessage] = useState('');

  // Active tournament form
  const [activeTournamentId, setActiveTournamentId] = useState('');
  const [activeSubmitting, setActiveSubmitting] = useState(false);
  const [activeMessage, setActiveMessage] = useState('');

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.json())
      .then(setTournaments)
      .catch(() => {});
  }, []);

  async function loadEspnEvents() {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/espn/events');
      const data: EspnEvent[] = await res.json();
      setEspnEvents(data);
    } catch {
      setEspnEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!tName || !tYear || !tEspnId) {
      setTMessage('Please fill in all fields and select an ESPN event.');
      return;
    }
    setTSubmitting(true);
    setTMessage('');
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tName,
          year: tYear,
          espnEventId: tEspnId,
          picksPerPerson: tPicks,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTMessage(`✅ Created: ${data.name} (${data.year})`);
        setTournaments((prev) => [...prev, data]);
        setTName(''); setTEspnId(''); setTEspnName('');
      } else {
        setTMessage(`Error: ${data.error}`);
      }
    } catch {
      setTMessage('Network error.');
    } finally {
      setTSubmitting(false);
    }
  }

  async function saveParticipants(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTournament) {
      setPMessage('Select a tournament first.');
      return;
    }
    const valid = participants.filter((p) => p.name.trim() !== '');
    if (valid.length < 2) {
      setPMessage('Enter at least 2 participants.');
      return;
    }
    setPSubmitting(true);
    setPMessage('');
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: valid.map((p) => ({
            name: p.name.trim(),
            draftPosition: p.draftPosition,
          })),
        }),
      });
      if (res.ok) {
        setPMessage('✅ Participants saved!');
      } else {
        const data = await res.json();
        setPMessage(`Error: ${data.error}`);
      }
    } catch {
      setPMessage('Network error.');
    } finally {
      setPSubmitting(false);
    }
  }

  async function setActiveTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTournamentId) {
      setActiveMessage('Select a tournament.');
      return;
    }
    setActiveSubmitting(true);
    setActiveMessage('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'active_tournament_id', value: activeTournamentId }),
      });
      if (res.ok) {
        const t = tournaments.find((x) => x.id === activeTournamentId);
        setActiveMessage(`✅ Active tournament set to: ${t?.name ?? activeTournamentId}`);
      } else {
        setActiveMessage('Error saving.');
      }
    } catch {
      setActiveMessage('Network error.');
    } finally {
      setActiveSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Admin</h1>

      {/* Section A: Create Tournament */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Create Tournament</h2>
        <form onSubmit={createTournament} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
              <input
                type="text"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                placeholder="e.g. The Masters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={tYear}
                onChange={(e) => setTYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Picks Per Person</label>
            <select
              value={tPicks}
              onChange={(e) => setTPicks(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">ESPN Event</label>
              <button
                type="button"
                onClick={loadEspnEvents}
                disabled={loadingEvents}
                className="text-xs text-blue-600 hover:underline"
              >
                {loadingEvents ? 'Loading...' : 'Load ESPN Events'}
              </button>
            </div>
            {tEspnId && (
              <p className="text-sm text-green-700 mb-2">Selected: <strong>{tEspnName}</strong> (ID: {tEspnId})</p>
            )}
            {espnEvents.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {espnEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => { setTEspnId(ev.id); setTEspnName(ev.name); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${tEspnId === ev.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <span>{ev.name}</span>
                    {ev.date && <span className="text-gray-400 ml-2 text-xs">{new Date(ev.date).toLocaleDateString()}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tMessage && <p className="text-sm text-green-700">{tMessage}</p>}

          <button
            type="submit"
            disabled={tSubmitting}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {tSubmitting ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </section>

      {/* Section B: Participants */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Set Participants & Draft Order</h2>
        <form onSubmit={saveParticipants} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">— select —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Participants (draft order = pick position)</p>
            {participants.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-6 text-right">{idx + 1}.</span>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => {
                    const next = [...participants];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setParticipants(next);
                  }}
                  placeholder={`Player ${idx + 1}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400">Leave blank to skip that slot. Order shown = draft pick order (snake).</p>
          </div>

          {pMessage && <p className="text-sm text-green-700">{pMessage}</p>}

          <button
            type="submit"
            disabled={pSubmitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {pSubmitting ? 'Saving...' : 'Save Participants'}
          </button>
        </form>
      </section>

      {/* Section C: Active Tournament */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Set Active Tournament</h2>
        <p className="text-sm text-gray-500">This is the tournament shown on the home page.</p>
        <form onSubmit={setActiveTournament} className="space-y-4">
          <select
            value={activeTournamentId}
            onChange={(e) => setActiveTournamentId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">— select —</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} {t.year} [{t.status}]</option>
            ))}
          </select>

          {activeMessage && <p className="text-sm text-green-700">{activeMessage}</p>}

          <button
            type="submit"
            disabled={activeSubmitting}
            className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-60 transition-colors"
          >
            {activeSubmitting ? 'Saving...' : 'Set Active'}
          </button>
        </form>
      </section>
    </div>
  );
}
