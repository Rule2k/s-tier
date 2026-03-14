import { centralClient } from "./client";
import { tournamentsQuery, allSeriesQuery } from "./queries";
import { config } from "../config";
import { waitForToken, centralBucket } from "../rate-limiter";
import type { FetchedTournament, FetchedSeries } from "../types/grid";

// --- Grid response types (Central Data specific) ---

interface GridTournamentNode {
  id: string;
  name: string;
  nameShortened: string;
  logoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  prizePool: { amount: number } | null;
  venueType: string | null;
  teams: { id: string; name: string }[];
}

interface GridTournamentEdge {
  node: GridTournamentNode;
  cursor: string;
}

interface GridTournamentsResponse {
  tournaments: {
    edges: GridTournamentEdge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

export interface GridSeriesNode {
  id: string;
  startTimeScheduled: string;
  format: { name: string; nameShortened: string };
  type: string;
  teams: { baseInfo: { id: string; name: string } }[];
  streams: { url: string }[];
}

interface GridSeriesEdge {
  node: GridSeriesNode;
  cursor: string;
}

interface GridAllSeriesResponse {
  allSeries: {
    edges: GridSeriesEdge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

// --- Fetch tournaments (paginated) ---

export const fetchTournaments = async (): Promise<FetchedTournament[]> => {
  const tournaments: FetchedTournament[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    await waitForToken(centralBucket);

    const variables = {
      first: config.pagination.pageSize,
      after,
    };
    const data: GridTournamentsResponse = await centralClient.request(
      tournamentsQuery,
      variables,
    );

    for (const edge of data.tournaments.edges) {
      const n = edge.node;
      tournaments.push({
        id: n.id,
        name: n.name,
        nameShortened: n.nameShortened,
        logoUrl: n.logoUrl,
        startDate: n.startDate,
        endDate: n.endDate,
        prizePool: n.prizePool?.amount ?? null,
        venueType: n.venueType,
        teamCount: n.teams.length,
      });
    }

    hasNextPage = data.tournaments.pageInfo.hasNextPage;
    after = data.tournaments.pageInfo.endCursor;
  }

  return tournaments;
};

// --- Fetch all series for a tournament (paginated) ---

export const fetchTournamentSeries = async (
  tournamentId: string,
): Promise<FetchedSeries[]> => {
  const series: FetchedSeries[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    await waitForToken(centralBucket);

    const variables = {
      first: config.pagination.pageSize,
      after,
      tournamentId,
    };
    const data: GridAllSeriesResponse = await centralClient.request(
      allSeriesQuery,
      variables,
    );

    for (const edge of data.allSeries.edges) {
      const n = edge.node;
      series.push({
        id: n.id,
        tournamentId,
        startTimeScheduled: n.startTimeScheduled,
        format: n.format.nameShortened,
        type: n.type,
        teams: n.teams.map((t: GridSeriesEdge["node"]["teams"][number]) => ({ id: t.baseInfo.id, name: t.baseInfo.name })),
        streams: n.streams.map((s: { url: string }) => s.url),
      });
    }

    hasNextPage = data.allSeries.pageInfo.hasNextPage;
    after = data.allSeries.pageInfo.endCursor;
  }

  return series;
};
