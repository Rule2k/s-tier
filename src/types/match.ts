export type MatchStatus = "not_started" | "running" | "finished";

// A Grid "Tournament" groups N matches by tournament.name
export interface Tournament {
  id: string;
  name: string;
  logoUrl: string | null;
  matches: Match[];
}

export interface TournamentView extends Tournament {
  allMatches?: Match[];
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
  shortName: string;
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

// --- Tournament status (used by TournamentBlock) ---

export type TournamentStatus =
  | { type: "finished"; winner: { name: string; logoUrl: string | null } | null }
  | { type: "live"; count: number }
  | { type: "in_progress" }
  | { type: "upcoming" };

// --- Timeline row (used by timeline components) ---

export interface TimelineRow {
  tournaments: Tournament[];
}

// --- API response for /api/tournaments ---

export interface TournamentsResponse {
  tournaments: Tournament[];
  hasMore: boolean;
  total: number;
}

// Lightweight summary for index navigation (load previous/next)
export interface TournamentSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  startDate: string;
  endDate: string | null;
}
