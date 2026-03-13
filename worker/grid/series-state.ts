import { liveClient } from "./client";
import { seriesStateQuery } from "./queries";

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
  paused: boolean;
  teams: GridGameTeam[];
}

interface GridDraftAction {
  id: string;
  type: string;
}

interface GridSeriesState {
  id: string;
  format: { nameShortened: string };
  started: boolean;
  finished: boolean;
  forfeited: boolean;
  valid: boolean;
  teams: GridSeriesStateTeam[];
  games: GridGame[];
  draftActions: GridDraftAction[];
  updatedAt: string;
  startedAt: string | null;
  duration: string;
}

interface GridSeriesStateResponse {
  seriesState: GridSeriesState | null;
}

// --- Public types ---

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
    format: s.format.nameShortened,
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
    draftActions: s.draftActions.map((d) => ({
      id: d.id,
      type: d.type,
    })),
    updatedAt: s.updatedAt,
    startedAt: s.startedAt,
    duration: s.duration,
  };
};
