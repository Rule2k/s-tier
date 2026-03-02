export interface GridSeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  teams: {
    id: string;
    name: string;
    score: number;
  }[];
}

export interface GridBatchSeriesStateResponse {
  [key: string]: GridSeriesState | null;
}
