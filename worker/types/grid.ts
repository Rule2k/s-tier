// --- Grid API types (used by scheduler registry) ---

export interface GridSeries {
  id: string;
  startTimeScheduled: string;
  format: { nameShortened: string };
  tournament: { id: string; name: string; nameShortened: string; logoUrl: string };
  teams: { baseInfo: { id: string; name: string; nameShortened?: string; logoUrl: string } }[];
}

export interface GridSeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  teams: { id: string; name: string; score: number }[];
  games: { sequenceNumber: number; started: boolean; finished: boolean; map: { name: string }; teams: { score: number; side: string }[] }[];
}

// --- Fetched types (returned by grid/ fetchers) ---

export interface FetchedTournament {
  id: string;
  name: string;
  nameShortened: string;
  logoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  prizePool: number | null;
  venueType: string | null;
  teams: { id: string; name: string }[];
}

export interface FetchedSeries {
  id: string;
  tournamentId: string;
  startTimeScheduled: string;
  format: string;
  type: string;
  teams: { id: string; name: string }[];
  streams: string[];
}

export interface FetchedSeriesState {
  seriesId: string;
  format: string;
  started: boolean;
  finished: boolean;
  teams: { id: string; name: string; score: number; won: boolean }[];
  games: {
    id: string;
    sequenceNumber: number;
    mapName: string;
    started: boolean;
    finished: boolean;
    teams: { id: string; name: string; side: string; score: number; won: boolean }[];
  }[];
  draftActions: { id: string; type: string }[];
  updatedAt: string;
  startedAt: string | null;
  duration: string;
}
