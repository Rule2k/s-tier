import { liveClient } from "./client";
import { seriesStateQuery } from "./queries";
import type { FetchedSeriesState } from "../types/grid";

// --- Grid response types (Series State specific) ---

interface GridSeriesStateTeam {
  id: string;
  name: string;
  score: number;
  won: boolean;
}

interface GridGameTeam {
  id: string;
  name: string;
  side: string;
  score: number;
  won: boolean;
}

interface GridGame {
  id: string;
  sequenceNumber: number;
  map: { name: string };
  started: boolean;
  finished: boolean;
  teams: GridGameTeam[];
}

interface GridSeriesState {
  id: string;
  format: string;
  started: boolean;
  finished: boolean;
  teams: GridSeriesStateTeam[];
  games: GridGame[];
}

interface GridSeriesStateResponse {
  seriesState: GridSeriesState | null;
}

// --- Fetch series state ---

export const fetchSeriesState = async (
  seriesId: string,
): Promise<FetchedSeriesState | null> => {
  const data = await liveClient.request<GridSeriesStateResponse>(
    seriesStateQuery,
    { id: seriesId },
  );

  const s = data.seriesState;
  if (!s) return null;

  return {
    seriesId: s.id,
    format: s.format,
    started: s.started,
    finished: s.finished,
    teams: s.teams.map((t) => ({
      id: t.id,
      name: t.name,
      score: t.score,
      won: t.won,
    })),
    games: s.games.map((g) => ({
      id: g.id,
      sequenceNumber: g.sequenceNumber,
      mapName: g.map.name,
      started: g.started,
      finished: g.finished,
      teams: g.teams.map((t) => ({
        id: t.id,
        name: t.name,
        side: t.side,
        score: t.score,
        won: t.won,
      })),
    })),
  };
};
