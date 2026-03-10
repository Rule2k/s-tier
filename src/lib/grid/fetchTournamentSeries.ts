import { centralClient } from "./clients/central";
import { allSeriesQuery } from "./queries/allSeries";
import type { GridAllSeriesResponse, GridSeries } from "./types/series";

const CS2_TITLE_ID = "28";
const PAGE_SIZE = 50;

export const fetchTournamentSeries = async (
  tournamentId: string,
): Promise<GridSeries[]> => {
  const allSeries: GridSeries[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const response: GridAllSeriesResponse = await centralClient.request<GridAllSeriesResponse>(
      allSeriesQuery,
      {
        first: PAGE_SIZE,
        after: cursor,
        filter: {
          titleIds: { in: [CS2_TITLE_ID] },
          tournamentIds: { in: [tournamentId] },
        },
      },
    );

    allSeries.push(...response.allSeries.edges.map((edge) => edge.node));
    hasNext = response.allSeries.pageInfo.hasNextPage;
    cursor = response.allSeries.pageInfo.endCursor;
  }

  return allSeries;
};
