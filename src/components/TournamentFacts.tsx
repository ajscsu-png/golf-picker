import type { TournamentFacts } from '@/lib/tournamentFacts';

interface Props {
  facts: TournamentFacts;
}

export default function TournamentFactsCard({ facts }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="font-medium text-gray-700">{facts.course}</span>
      <span className="text-gray-300">·</span>
      <span>📍 {facts.location}</span>
    </div>
  );
}
