export type MatchStatus = "not_started" | "running" | "finished";

// A Grid "Tournament" groups N matches by tournament.name
export interface Tournament {
  id: string;
  name: string;
  logoUrl: string | null;
  matches: Match[];
}

// A Grid "Series" = one match (Bo1/Bo3/Bo5)
export interface Match {
  id: string;
  status: MatchStatus;
  scheduledAt: string;
  format: string;
  teams: MatchTeam[];
  maps: MapScore[];
}

export interface MatchTeam {
  name: string;
  logoUrl: string | null;
  score: number | null;
  isWinner: boolean;
}

export interface MapScore {
  mapNumber: number;
  mapName: string;
  status: MatchStatus;
  scores: [number, number];
  sides: [string, string];
}

// Lightweight summary for index navigation (load previous/next)
export interface TournamentSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  startDate: string;
  endDate: string | null;
}
