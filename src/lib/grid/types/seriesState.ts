export interface GridGameTeam {
  score: number;
  side: string;
}

export interface GridGame {
  sequenceNumber: number;
  started: boolean;
  finished: boolean;
  map: { name: string };
  teams: GridGameTeam[];
}

export interface GridSeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  teams: {
    id: string;
    name: string;
    score: number;
  }[];
  games: GridGame[];
}

export interface GridBatchSeriesStateResponse {
  [key: string]: GridSeriesState | null;
}
