'use client';

import { useState, useEffect } from 'react';
import type { Tournament, EspnEvent, Participant, Pick, Cut } from '@/types';
import { getCuttableCutsForParticipant, getCuttablePicksForParticipant } from '@/lib/cutPool';
import { getActiveTournamentId, markTournamentActive } from '@/lib/adminTournamentState';

interface ParticipantEntry {
  name: string;
  draftPosition: number;
}

const PLAYER_NAMES = ['Andy', 'Connor', 'Kyle', 'Tim', 'Brad', 'Bill', 'Wyatt', 'Andrew'];

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
  const [tCuts, setTCuts] = useState('0');
  const [tIsMajor, setTIsMajor] = useState(false);
  const [tHasSingleDraft, setTHasSingleDraft] = useState(false);
  const [tPlayerCount, setTPlayerCount] = useState('8');
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tMessage, setTMessage] = useState('');

  // Edit tournament form
  const [editTournamentId, setEditTournamentId] = useState('');
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editEspnId, setEditEspnId] = useState('');
  const [editEspnName, setEditEspnName] = useState('');
  const [editPicks, setEditPicks] = useState('');
  const [editCuts, setEditCuts] = useState('0');
  const [editIsMajor, setEditIsMajor] = useState(false);
  const [editHasSingleDraft, setEditHasSingleDraft] = useState(false);
  const [editStatus, setEditStatus] = useState<'draft' | 'active' | 'completed'>('draft');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  // Participants form
  const [selectedTournament, setSelectedTournament] = useState('');
  const [participants, setParticipants] = useState<ParticipantEntry[]>(
    PLAYER_NAMES.map((name, i) => ({ name, draftPosition: i + 1 }))
  );
  const [pSubmitting, setPSubmitting] = useState(false);
  const [pMessage, setPMessage] = useState('');

  // Active tournament form
  const [activeTournamentId, setActiveTournamentId] = useState('');
  const [activeSubmitting, setActiveSubmitting] = useState(false);
  const [activeMessage, setActiveMessage] = useState('');

  // Delete tournament
  const [deleteTournamentId, setDeleteTournamentId] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Swap pick
  const [swapTournamentId, setSwapTournamentId] = useState('');
  const [swapParticipant, setSwapParticipant] = useState('');
  const [swapParticipants, setSwapParticipants] = useState<Array<{ name: string }>>([]);
  const [swapPicks, setSwapPicks] = useState<Array<{ golferName: string; golferEspnId: string }>>([]);
  const [swapOldId, setSwapOldId] = useState('');
  const [swapNewId, setSwapNewId] = useState('');
  const [swapNewName, setSwapNewName] = useState('');
  const [swapField, setSwapField] = useState<Array<{ id: string; name: string }>>([]);
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [swapMessage, setSwapMessage] = useState('');

  // Correct cuts
  const [cutTournamentId, setCutTournamentId] = useState('');
  const [cutParticipants, setCutParticipants] = useState<Participant[]>([]);
  const [cutPicks, setCutPicks] = useState<Pick[]>([]);
  const [cutExistingCuts, setCutExistingCuts] = useState<Cut[]>([]);
  const [cutParticipant, setCutParticipant] = useState('');
  const [cutSelectedIds, setCutSelectedIds] = useState<string[]>([]);
  const [cutLoading, setCutLoading] = useState(false);
  const [cutSubmitting, setCutSubmitting] = useState(false);
  const [cutMessage, setCutMessage] = useState('');

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.json())
      .then((loaded: Tournament[]) => {
        setTournaments(loaded);
        setActiveTournamentId(getActiveTournamentId(loaded));
      })
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
          cutsPerPerson: tCuts,
          isMajor: tIsMajor,
          hasSingleDraft: tHasSingleDraft,
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

  function loadEditTournament(id: string) {
    setEditTournamentId(id);
    setEditMessage('');
    if (!id) return;
    const t = tournaments.find((x) => x.id === id);
    if (!t) return;
    setEditName(t.name);
    setEditYear(String(t.year));
    setEditEspnId(t.espnEventId);
    setEditEspnName('');
    setEditPicks(String(t.picksPerPerson));
    setEditCuts(String(t.cutsPerPerson));
    setEditIsMajor(t.isMajor);
    setEditHasSingleDraft(t.hasSingleDraft);
    setEditStatus(t.status);
  }

  async function saveEditTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!editTournamentId) return;
    setEditSubmitting(true);
    setEditMessage('');
    try {
      const res = await fetch(`/api/tournaments/${editTournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          year: parseInt(editYear, 10),
          espnEventId: editEspnId,
          picksPerPerson: parseInt(editPicks, 10),
          cutsPerPerson: parseInt(editCuts, 10),
          isMajor: editIsMajor,
          hasSingleDraft: editHasSingleDraft,
          status: editStatus,
        }),
      });
      if (res.ok) {
        setEditMessage('✅ Tournament updated!');
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === editTournamentId
              ? {
                  ...t,
                  name: editName,
                  year: parseInt(editYear, 10),
                  espnEventId: editEspnId,
                  picksPerPerson: parseInt(editPicks, 10),
                  cutsPerPerson: parseInt(editCuts, 10),
                  isMajor: editIsMajor,
                  hasSingleDraft: editHasSingleDraft,
                  status: editStatus,
                }
              : t
          )
        );
      } else {
        const data = await res.json();
        setEditMessage(`Error: ${data.error}`);
      }
    } catch {
      setEditMessage('Network error.');
    } finally {
      setEditSubmitting(false);
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

  async function deleteTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTournamentId) {
      setDeleteMessage('Select a tournament.');
      return;
    }
    const t = tournaments.find((x) => x.id === deleteTournamentId);
    if (!confirm(`Delete "${t?.name ?? deleteTournamentId}" and all its picks/participants? This cannot be undone.`)) return;
    setDeleteSubmitting(true);
    setDeleteMessage('');
    try {
      const res = await fetch(`/api/tournaments/${deleteTournamentId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteMessage(`✅ Deleted.`);
        setTournaments((prev) => prev.filter((x) => x.id !== deleteTournamentId));
        setDeleteTournamentId('');
      } else {
        const data = await res.json();
        setDeleteMessage(`Error: ${data.error}`);
      }
    } catch {
      setDeleteMessage('Network error.');
    } finally {
      setDeleteSubmitting(false);
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
        const updatedTournaments = markTournamentActive(tournaments, activeTournamentId);
        setTournaments(updatedTournaments);
        if (editTournamentId) {
          const edited = updatedTournaments.find((x) => x.id === editTournamentId);
          if (edited) setEditStatus(edited.status);
        }
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

  async function loadSwapData(tournamentId: string) {
    setSwapTournamentId(tournamentId);
    setSwapParticipant('');
    setSwapPicks([]);
    setSwapOldId('');
    setSwapNewId('');
    setSwapNewName('');
    setSwapMessage('');
    if (!tournamentId) return;
    const t = tournaments.find((x) => x.id === tournamentId);
    const [pRes, fRes] = await Promise.all([
      fetch(`/api/tournaments/${tournamentId}/participants`).then((r) => r.json()),
      t ? fetch(`/api/espn/field/${t.espnEventId}`).then((r) => r.json()) : Promise.resolve([]),
    ]);
    setSwapParticipants(pRes);
    setSwapField(fRes);
  }

  async function loadParticipantPicks(participantName: string) {
    setSwapParticipant(participantName);
    setSwapOldId('');
    setSwapNewId('');
    setSwapNewName('');
    if (!participantName || !swapTournamentId) return;
    const picks = await fetch(`/api/tournaments/${swapTournamentId}/picks`).then((r) => r.json());
    setSwapPicks(picks.filter((p: { participantName: string }) => p.participantName === participantName));
  }

  async function submitSwap(e: React.FormEvent) {
    e.preventDefault();
    if (!swapTournamentId || !swapParticipant || !swapOldId || !swapNewId) {
      setSwapMessage('Fill in all fields.');
      return;
    }
    setSwapSubmitting(true);
    setSwapMessage('');
    try {
      const res = await fetch(`/api/tournaments/${swapTournamentId}/picks/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: swapParticipant,
          oldGolferEspnId: swapOldId,
          newGolferEspnId: swapNewId,
          newGolferName: swapNewName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSwapMessage(`✅ Swapped successfully!`);
        setSwapOldId('');
        setSwapNewId('');
        setSwapNewName('');
      } else {
        setSwapMessage(`Error: ${data.error}`);
      }
    } catch {
      setSwapMessage('Network error.');
    } finally {
      setSwapSubmitting(false);
    }
  }

  async function loadCutData(tournamentId: string) {
    setCutTournamentId(tournamentId);
    setCutParticipants([]);
    setCutPicks([]);
    setCutExistingCuts([]);
    setCutParticipant('');
    setCutSelectedIds([]);
    setCutMessage('');
    if (!tournamentId) return;

    setCutLoading(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/cuts`);
      const data = await res.json();
      if (res.ok) {
        setCutParticipants(data.participants);
        setCutPicks(data.picks);
        setCutExistingCuts(data.cuts);
      } else {
        setCutMessage(`Error: ${data.error}`);
      }
    } catch {
      setCutMessage('Network error.');
    } finally {
      setCutLoading(false);
    }
  }

  function loadCutParticipant(participantName: string) {
    setCutParticipant(participantName);
    setCutMessage('');
    const existing = getCuttableCutsForParticipant(cutExistingCuts, cutPicks, participantName)
      .map((c) => c.golferEspnId);
    setCutSelectedIds(existing);
  }

  function toggleCutGolfer(golferEspnId: string) {
    const tournament = tournaments.find((t) => t.id === cutTournamentId);
    const maxCuts = tournament?.cutsPerPerson ?? 0;
    setCutSelectedIds((prev) => {
      if (prev.includes(golferEspnId)) {
        return prev.filter((id) => id !== golferEspnId);
      }
      if (maxCuts > 0 && prev.length >= maxCuts) return prev;
      return [...prev, golferEspnId];
    });
  }

  async function submitCutCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!cutTournamentId || !cutParticipant) {
      setCutMessage('Select a tournament and participant.');
      return;
    }

    const myPicks = getCuttablePicksForParticipant(cutPicks, cutParticipant);
    const cuts = cutSelectedIds.map((id, idx) => {
      const pick = myPicks.find((p) => p.golferEspnId === id);
      return { golferEspnId: id, golferName: pick?.golferName ?? id, dropNumber: idx + 1 };
    });

    setCutSubmitting(true);
    setCutMessage('');
    try {
      const res = await fetch(`/api/admin/tournaments/${cutTournamentId}/cuts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: cutParticipant, cuts }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedCuts = data.cuts.map((c: Omit<Cut, 'tournamentId' | 'participantName'>) => ({
          ...c,
          tournamentId: cutTournamentId,
          participantName: cutParticipant,
        }));
        setCutExistingCuts((prev) => [
          ...prev.filter((c) => !(c.tournamentId === cutTournamentId && c.participantName === cutParticipant)),
          ...updatedCuts,
        ]);
        setCutSelectedIds(updatedCuts.map((c: Cut) => c.golferEspnId));
        setCutMessage('✅ Player cuts corrected.');
      } else {
        setCutMessage(`Error: ${data.error}`);
      }
    } catch {
      setCutMessage('Network error.');
    } finally {
      setCutSubmitting(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  }

  const selectedCutTournament = tournaments.find((t) => t.id === cutTournamentId);
  const maxCutSelections = selectedCutTournament?.cutsPerPerson ?? 0;
  const cutParticipantPicks = getCuttablePicksForParticipant(cutPicks, cutParticipant);
  const correctedCutNames = cutSelectedIds
    .map((id) => cutParticipantPicks.find((p) => p.golferEspnId === id)?.golferName)
    .filter(Boolean);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">
          Log out
        </button>
      </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMajor"
              checked={tIsMajor}
              onChange={(e) => setTIsMajor(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <label htmlFor="isMajor" className="text-sm font-medium text-gray-700">
              Major Tournament <span className="text-gray-400 font-normal">(counts toward all-time stats)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasSingleDraft"
              checked={tHasSingleDraft}
              onChange={(e) => setTHasSingleDraft(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <label htmlFor="hasSingleDraft" className="text-sm font-medium text-gray-700">
              Single Golfer Draft <span className="text-gray-400 font-normal">(one pick each before the snake; last pick goes first)</span>
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Picks Per Person</label>
              <input
                type="number"
                min="1"
                max="20"
                value={tPicks}
                onChange={(e) => setTPicks(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuts Per Person</label>
              <select
                value={tCuts}
                onChange={(e) => setTCuts(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="0">None</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Players</label>
              <input
                type="number"
                min="2"
                max="20"
                value={tPlayerCount}
                onChange={(e) => {
                  const n = Math.max(2, Math.min(20, parseInt(e.target.value) || 2));
                  setTPlayerCount(String(n));
                  setParticipants(Array.from({ length: n }, (_, i) => ({ name: PLAYER_NAMES[i] ?? '', draftPosition: i + 1 })));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
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

      {/* Section: Edit Tournament */}
      <section className="bg-white rounded-xl border border-blue-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-blue-800">Edit Tournament</h2>
        <form onSubmit={saveEditTournament} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament</label>
            <select
              value={editTournamentId}
              onChange={(e) => loadEditTournament(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">— select —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.year} [{t.status}]</option>
              ))}
            </select>
          </div>

          {editTournamentId && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ESPN Event ID</label>
                <input
                  type="text"
                  value={editEspnId}
                  onChange={(e) => setEditEspnId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex items-center justify-between mt-1">
                  {editEspnName && <p className="text-xs text-blue-700">Selected: <strong>{editEspnName}</strong></p>}
                  <button
                    type="button"
                    onClick={loadEspnEvents}
                    disabled={loadingEvents}
                    className="text-xs text-blue-600 hover:underline ml-auto"
                  >
                    {loadingEvents ? 'Loading...' : 'Browse ESPN Events'}
                  </button>
                </div>
                {espnEvents.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 mt-1">
                    {espnEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => { setEditEspnId(ev.id); setEditEspnName(ev.name); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${editEspnId === ev.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      >
                        <span>{ev.name}</span>
                        {ev.date && <span className="text-gray-400 ml-2 text-xs">{new Date(ev.date).toLocaleDateString()}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Picks Per Person</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editPicks}
                    onChange={(e) => setEditPicks(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuts Per Person</label>
                  <select
                    value={editCuts}
                    onChange={(e) => setEditCuts(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="0">None</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'draft' | 'active' | 'completed')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsMajor"
                    checked={editIsMajor}
                    onChange={(e) => setEditIsMajor(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="editIsMajor" className="text-sm font-medium text-gray-700">Major Tournament</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editHasSingleDraft"
                    checked={editHasSingleDraft}
                    onChange={(e) => setEditHasSingleDraft(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="editHasSingleDraft" className="text-sm font-medium text-gray-700">Single Golfer Draft</label>
                </div>
              </div>

              {editMessage && (
                <p className={`text-sm ${editMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
                  {editMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={editSubmitting}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Participants (draft order = pick position)</p>
              <button
                type="button"
                onClick={() => {
                  const names = participants.map((p) => p.name).filter((n) => n.trim() !== '');
                  for (let i = names.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [names[i], names[j]] = [names[j], names[i]];
                  }
                  setParticipants(participants.map((p, i) => ({ ...p, name: names[i] ?? '' })));
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                🎲 Randomize Order
              </button>
            </div>
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

      {/* Section: Correct Cuts */}
      <section className="bg-white rounded-xl border border-red-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-red-700">Correct Player Cuts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Admin override for fixing a player who did not submit every cut. This replaces that player&apos;s saved cut list.
          </p>
        </div>
        <form onSubmit={submitCutCorrection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament</label>
            <select
              value={cutTournamentId}
              onChange={(e) => loadCutData(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">— select —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.year} [{t.status}]</option>
              ))}
            </select>
          </div>

          {cutLoading && <p className="text-sm text-gray-500">Loading cuts...</p>}

          {cutTournamentId && !cutLoading && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participant</label>
              <select
                value={cutParticipant}
                onChange={(e) => loadCutParticipant(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">— select —</option>
                {cutParticipants.map((p) => {
                  const count = getCuttableCutsForParticipant(cutExistingCuts, cutPicks, p.name).length;
                  const suffix = maxCutSelections > 0 ? ` (${count}/${maxCutSelections})` : '';
                  return <option key={p.name} value={p.name}>{p.name}{suffix}</option>;
                })}
              </select>
            </div>
          )}

          {cutParticipant && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">Select cuts for {cutParticipant}</p>
                <span className="text-xs text-gray-400">{cutSelectedIds.length}/{maxCutSelections} selected</span>
              </div>

              {cutParticipantPicks.length === 0 ? (
                <p className="text-sm text-gray-400">No picks found for {cutParticipant}.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {cutParticipantPicks.map((pick) => {
                    const dropIndex = cutSelectedIds.indexOf(pick.golferEspnId);
                    const isSelected = dropIndex !== -1;
                    const isDisabled = !isSelected && maxCutSelections > 0 && cutSelectedIds.length >= maxCutSelections;
                    return (
                      <button
                        key={pick.golferEspnId}
                        type="button"
                        onClick={() => toggleCutGolfer(pick.golferEspnId)}
                        disabled={isDisabled}
                        className={`min-h-12 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                            : isDisabled
                              ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block">{pick.golferName}</span>
                        {isSelected && <span className="text-xs">DROP {dropIndex + 1}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {correctedCutNames.length > 0 && (
                <p className="text-xs text-gray-500">
                  Saving will set {cutParticipant}&apos;s cuts to: {correctedCutNames.join(', ')}.
                </p>
              )}
            </div>
          )}

          {cutMessage && (
            <p className={`text-sm ${cutMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
              {cutMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={cutSubmitting || !cutParticipant || cutParticipantPicks.length === 0}
            className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {cutSubmitting ? 'Saving...' : 'Save Cut Correction'}
          </button>
        </form>
      </section>

      {/* Section D: Delete Tournament */}
      <section className="bg-white rounded-xl border border-red-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-red-700">Delete Tournament</h2>
        <p className="text-sm text-gray-500">Permanently removes the tournament, all picks, participants, and scores.</p>
        <form onSubmit={deleteTournament} className="space-y-4">
          <select
            value={deleteTournamentId}
            onChange={(e) => setDeleteTournamentId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">— select —</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} {t.year} [{t.status}]</option>
            ))}
          </select>

          {deleteMessage && <p className="text-sm text-red-700">{deleteMessage}</p>}

          <button
            type="submit"
            disabled={deleteSubmitting}
            className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleteSubmitting ? 'Deleting...' : 'Delete Tournament'}
          </button>
        </form>
      </section>

      {/* Section E: Swap Pick */}
      <section className="bg-white rounded-xl border border-orange-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-orange-700">Swap a Pick</h2>
        <p className="text-sm text-gray-500">Use this when a golfer withdraws and you need to replace their pick.</p>
        <form onSubmit={submitSwap} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament</label>
            <select
              value={swapTournamentId}
              onChange={(e) => loadSwapData(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">— select —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.year} [{t.status}]</option>
              ))}
            </select>
          </div>

          {swapTournamentId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participant</label>
              <select
                value={swapParticipant}
                onChange={(e) => loadParticipantPicks(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">— select —</option>
                {swapParticipants.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {swapParticipant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Golfer to Replace</label>
              <select
                value={swapOldId}
                onChange={(e) => setSwapOldId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">— select —</option>
                {swapPicks.map((p) => (
                  <option key={p.golferEspnId} value={p.golferEspnId}>{p.golferName}</option>
                ))}
              </select>
            </div>
          )}

          {swapOldId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Golfer</label>
              <select
                value={swapNewId}
                onChange={(e) => {
                  const golfer = swapField.find((g) => g.id === e.target.value);
                  setSwapNewId(e.target.value);
                  setSwapNewName(golfer?.name ?? '');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">— select —</option>
                {swapField
                  .filter((g) => !swapPicks.some((p) => p.golferEspnId === g.id))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
              </select>
            </div>
          )}

          {swapMessage && (
            <p className={`text-sm ${swapMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
              {swapMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={swapSubmitting || !swapOldId || !swapNewId}
            className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {swapSubmitting ? 'Swapping...' : 'Swap Pick'}
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
