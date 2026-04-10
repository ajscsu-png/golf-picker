'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  lastUpdated?: string | null;
  autoRefresh?: boolean;
}

export default function RefreshScoresButton({ lastUpdated, autoRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  async function refresh() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cron/update-scores');
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setStatus({ ok: false, msg: 'Update failed' });
        return;
      }
      if (data.message) {
        setStatus({ ok: false, msg: String(data.message) });
        return;
      }
      const results = data.updated as Array<{ golferCount: number }> | undefined;
      const count = results?.[0]?.golferCount ?? 0;
      setStatus({ ok: count > 0, msg: count > 0 ? `Updated ${count} golfers` : 'No scores found' });
      if (count > 0) router.refresh();
    } catch {
      setStatus({ ok: false, msg: 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/cron/update-scores');
        if (!res.ok) return;
        const data = await res.json() as Record<string, unknown>;
        const results = data.updated as Array<{ golferCount: number }> | undefined;
        if ((results?.[0]?.golferCount ?? 0) > 0) router.refresh();
      } catch {
        // silent failure
      }
    }, 90_000);
    return () => clearInterval(id);
  }, [autoRefresh, router]);

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-gray-400">Updated {lastUpdated}</span>
      )}
      {status && (
        <span className={`text-xs ${status.ok ? 'text-gray-400' : 'text-red-500'}`}>
          {status.msg}
        </span>
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
