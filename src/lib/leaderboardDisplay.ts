import type { GolferScore } from '../types';

export function golferTeeTimeLabel(golfer: Pick<GolferScore, 'teeTime' | 'thru'>): string | null {
  if (golfer.thru !== null) return null;
  return golfer.teeTime;
}
