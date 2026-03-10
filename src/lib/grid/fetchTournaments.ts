import { centralClient } from "./clients/central";
import { liveClient } from "./clients/live";
import { allSeriesQuery } from "./queries/allSeries";
import { seriesStateQuery } from "./queries/seriesState";
import { mapGridToMatch } from "./mappers/mapMatch";

import type { GridSeries, GridAllSeriesResponse } from "./types/series";
import type { GridSeriesState } from "./types/seriesState";
import type { Tournament, TournamentSummary } from "@/types/match";

const CS2_TITLE_ID = "28";
const PAGE_SIZE = 50;

// --- Central Data API ---

export const fetchTournamentSeries = async (
  tournamentId: string,
): Promise<GridSeries[]> => {
  const allSeries: GridSeries[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const response: GridAllSeriesResponse =
      await centralClient.request<GridAllSeriesResponse>(allSeriesQuery, {
        first: PAGE_SIZE,
        after: cursor,
        filter: {
          titleIds: { in: [CS2_TITLE_ID] },
          tournamentIds: { in: [tournamentId] },
        },
      });

    for (const edge of response.allSeries.edges) {
      allSeries.push(edge.node);
    }

    hasNext = response.allSeries.pageInfo.hasNextPage;
    cursor = response.allSeries.pageInfo.endCursor;
  }

  return allSeries;
};

// --- Live Data Feed API ---

export const fetchSeriesState = async (
  seriesId: string,
): Promise<GridSeriesState | null> => {
  try {
    const data = await liveClient.request<{
      seriesState: GridSeriesState;
    }>(seriesStateQuery, { id: seriesId });
    return data.seriesState;
  } catch (error) {
    console.error(
      `[grid] Failed to fetch seriesState for ${seriesId}:`,
      error,
    );
    return null;
  }
};

export const fetchSeriesStates = async (
  seriesIds: string[],
): Promise<Map<string, GridSeriesState>> => {
  const states = new Map<string, GridSeriesState>();
  const results = await Promise.all(
    seriesIds.map(async (id) => {
      const state = await fetchSeriesState(id);
      return { id, state };
    }),
  );

  for (const { id, state } of results) {
    if (state) states.set(id, state);
  }

  return states;
};

// --- Build Tournament ---

export const buildTournament = (
  tournamentId: string,
  tournamentName: string,
  tournamentLogoUrl: string | null,
  gridSeriesList: GridSeries[],
  seriesStates: Map<string, GridSeriesState>,
): Tournament => {
  const matches = gridSeriesList
    .map((gs) => mapGridToMatch(gs, seriesStates.get(gs.id)))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  return {
    id: tournamentId,
    name: tournamentName,
    logoUrl: tournamentLogoUrl,
    matches,
  };
};
