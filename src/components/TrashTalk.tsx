'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Participant } from '@/types';
import type { TrashMessage } from '@/lib/sheets';

interface Props {
  tournamentId: string;
  participants: Participant[];
  initialMessages: TrashMessage[];
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function TrashTalk({ tournamentId, participants, initialMessages }: Props) {
  const [messages, setMessages] = useState<TrashMessage[]>(initialMessages);
  const [selectedName, setSelectedName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/trash`);
      if (res.ok) {
        const data: TrashMessage[] = await res.json();
        setMessages(data);
      }
    } catch {
      // ignore transient errors
    }
  }, [tournamentId]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedName || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: selectedName, message: text.trim() }),
      });
      if (res.ok) {
        const newMsg: TrashMessage = await res.json();
        setMessages((prev) => [newMsg, ...prev]);
        setText('');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = 280 - text.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-lg">🗣️</span>
        <h2 className="text-base font-semibold text-gray-900">Trash Talk</h2>
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-gray-100 space-y-3">
        <div className="flex gap-2">
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="flex-shrink-0 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Who are you?</option>
            {participants.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              placeholder="Talk your trash here..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
            />
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                remaining <= 20 ? 'text-red-500 font-semibold' : 'text-gray-400'
              }`}
            >
              {remaining}
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting || !selectedName || !text.trim()}
            className="flex-shrink-0 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '...' : 'Send'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </form>

      {/* Messages list */}
      <div className="divide-y divide-gray-50">
        {messages.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            No trash talk yet — don't be shy.
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="px-5 py-3 flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                {msg.participantName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{msg.participantName}</span>
                  <span className="text-xs text-gray-400">{relativeTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
