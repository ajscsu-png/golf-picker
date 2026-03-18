'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshScoresButton() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    setLoading(true);
    try {
      await fetch('/api/cron/update-scores');
      setLastUpdated(new Date().toLocaleTimeString());
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-gray-400">Updated {lastUpdated}</span>
      )}
      <button
        onClick={refresh}
        disabled={loading}
        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Refreshing...' : '↻ Refresh Scores'}
      </button>
    </div>
  );
}
