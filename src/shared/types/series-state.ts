/** Detailed series state as stored in Redis (written by worker, read by front). */
export interface SeriesState {
  seriesId: string;
  format: string;
  started: boolean;
  finished: boolean;
  teams: SeriesTeamScore[];
  games: GameScore[];
}

export interface SeriesTeamScore {
  id: string;
  name: string;
  score: number;
  won: boolean;
}

export interface GameScore {
  id: string;
  sequenceNumber: number;
  mapName: string;
  started: boolean;
  finished: boolean;
  teams: GameTeamScore[];
}

export interface GameTeamScore {
  id: string;
  name: string;
  side: string;
  score: number;
  won: boolean;
}
