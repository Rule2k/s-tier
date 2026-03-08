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

// --- Select Relevant Tournaments ---

export const selectRelevantTournaments = (
  tournaments: TournamentSummary[],
  count = 3,
): TournamentSummary[] => {
  if (tournaments.length <= count) return tournaments;

  const sorted = [...tournaments].sort(
    (a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const now = Date.now();

  // Find the current tournament (startDate <= now <= endDate)
  let anchorIndex = sorted.findIndex((t) => {
    const start = new Date(t.startDate).getTime();
    const end = t.endDate ? new Date(t.endDate).getTime() : start;
    return start <= now && now <= end;
  });

  // If none is current, find the closest to now
  if (anchorIndex === -1) {
    let minDistance = Infinity;
    sorted.forEach((t, i) => {
      const start = new Date(t.startDate).getTime();
      const end = t.endDate ? new Date(t.endDate).getTime() : start;
      const distance = Math.min(Math.abs(now - start), Math.abs(now - end));
      if (distance < minDistance) {
        minDistance = distance;
        anchorIndex = i;
      }
    });
  }

  // Build a window of `count` centered on anchorIndex
  const half = Math.floor(count / 2);
  let start = anchorIndex - half;
  let end = start + count;

  if (start < 0) {
    start = 0;
    end = count;
  }
  if (end > sorted.length) {
    end = sorted.length;
    start = end - count;
  }

  return sorted.slice(start, end);
};

// --- Build Tournament Summary from Grid series list ---

export const buildTournamentSummary = (
  tournamentId: string,
  gridSeriesList: GridSeries[],
): TournamentSummary | null => {
  if (gridSeriesList.length === 0) return null;

  const first = gridSeriesList[0];
  const scheduledTimes = gridSeriesList.map(
    (s) => new Date(s.startTimeScheduled).getTime(),
  );
  const startDate = new Date(Math.min(...scheduledTimes)).toISOString();
  const endDate = new Date(Math.max(...scheduledTimes)).toISOString();

  return {
    id: tournamentId,
    name: first.tournament.name,
    logoUrl: first.tournament.logoUrl || null,
    startDate,
    endDate,
  };
};
