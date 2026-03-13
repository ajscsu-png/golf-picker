export type TournamentStatus = 'draft' | 'active' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  year: number;
  espnEventId: string;
  status: TournamentStatus;
  picksPerPerson: number; // 5 or 6
}

export interface Participant {
  tournamentId: string;
  name: string;
  draftPosition: number; // 1-based
}

export interface Pick {
  id: string;
  tournamentId: string;
  overallPickNumber: number;
  roundNumber: number;
  pickInRound: number;
  participantName: string;
  golferName: string;
  golferEspnId: string;
}

export interface GolferScore {
  tournamentId: string;
  golferEspnId: string;
  golferName: string;
  position: string;
  totalScore: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  status: 'active' | 'cut' | 'wd' | 'dq';
}

export interface DraftSlot {
  overallPickNumber: number;
  roundNumber: number;
  pickInRound: number;
  participantName: string;
}

export interface EspnGolfer {
  id: string;
  name: string;
  worldRanking?: number;
}

export interface EspnEvent {
  id: string;
  name: string;
  date: string;
}

export interface ParticipantLeaderboardRow {
  participant: Participant;
  golfers: Array<GolferScore & { picked: boolean }>;
  totalScore: number | null;
  rank: number;
}
