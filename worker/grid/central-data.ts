import { centralClient } from "./client";
import { discoverSeriesQuery, allSeriesQuery } from "./queries";
import { config } from "../config";
import { waitForToken, centralBucket } from "../rate-limiter";
import type { FetchedTournament, FetchedSeries } from "../types/grid";

// --- Grid response types (Central Data specific) ---

interface DiscoverSeriesNode {
  id: string;
  startTimeScheduled: string;
  tournament: {
    id: string;
    name: string;
    nameShortened: string;
    logoUrl: string | null;
    prizePool: { amount: number } | null;
    venueType: string | null;
  };
  teams: { baseInfo: { id: string; name: string } }[];
}

interface DiscoverSeriesEdge {
  node: DiscoverSeriesNode;
  cursor: string;
}

interface DiscoverSeriesResponse {
  allSeries: {
    edges: DiscoverSeriesEdge[];
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

// --- Discover tournaments via team series (paginated) ---

export const discoverTournaments = async (
  teamIds: readonly string[],
): Promise<FetchedTournament[]> => {
  // Accumulate series grouped by tournament
  const tournamentMap = new Map<
    string,
    { meta: DiscoverSeriesNode["tournament"]; dates: string[]; teams: Map<string, string> }
  >();

  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    await waitForToken(centralBucket);

    const variables = {
      first: config.pagination.pageSize,
      after,
      teamIds: [...teamIds],
    };
    const data: DiscoverSeriesResponse = await centralClient.request(
      discoverSeriesQuery,
      variables,
    );

    for (const edge of data.allSeries.edges) {
      const { tournament, startTimeScheduled, teams } = edge.node;

      let entry = tournamentMap.get(tournament.id);
      if (!entry) {
        entry = { meta: tournament, dates: [], teams: new Map() };
        tournamentMap.set(tournament.id, entry);
      }

      if (startTimeScheduled) entry.dates.push(startTimeScheduled);

      for (const t of teams) {
        entry.teams.set(t.baseInfo.id, t.baseInfo.name);
      }
    }

    hasNextPage = data.allSeries.pageInfo.hasNextPage;
    after = data.allSeries.pageInfo.endCursor;
  }

  // Convert map to FetchedTournament[]
  const tournaments: FetchedTournament[] = [];

  for (const [id, { meta, dates, teams }] of tournamentMap) {
    const sorted = dates.sort();
    tournaments.push({
      id,
      name: meta.name,
      nameShortened: meta.nameShortened,
      logoUrl: meta.logoUrl,
      startDate: sorted[0] ?? null,
      endDate: sorted[sorted.length - 1] ?? null,
      prizePool: meta.prizePool?.amount ?? null,
      venueType: meta.venueType,
      teams: [...teams.entries()].map(([tid, name]) => ({ id: tid, name })),
    });
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
