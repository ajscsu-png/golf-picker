import type { BroadcastInfo, BroadcastWindow } from '@/lib/broadcastSchedule';

interface Props {
  info: BroadcastInfo;
}

function outletKey(window: BroadcastWindow): string {
  return `${window.label}:${window.outlets.join(',')}`;
}

function OutletPill({ outlets }: { outlets: string[] }) {
  return (
    <span className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2.5 py-1 font-semibold text-green-700">
      {outlets.join(' / ')}
    </span>
  );
}

export default function BroadcastInfoCard({ info }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
      <span className="font-semibold text-gray-800">Watch now</span>
      {info.current.length > 0 ? (
        info.current.map((window) => <OutletPill key={outletKey(window)} outlets={window.outlets} />)
      ) : (
        <span className="text-gray-500">No live window listed right now</span>
      )}
      {info.next && info.nextLabel && (
        <>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>
            Up next:{' '}
            <span className="font-medium text-gray-800">{info.next.outlets.join(' / ')}</span>
            {' '}at {info.nextLabel}
          </span>
        </>
      )}
      <a
        href={info.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-green-700 hover:underline"
      >
        {info.sourceName}
      </a>
    </div>
  );
}
