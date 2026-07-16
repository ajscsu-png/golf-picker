import StatsLeaderboard from '@/components/StatsLeaderboard';
import { COMPLETED_RESULTS } from '@/data/completedResults';
import { aggregateParticipantStats } from '@/lib/stats';

export default function StatsPage() {
  const summary = aggregateParticipantStats(COMPLETED_RESULTS);
  return <StatsLeaderboard {...summary} />;
}
