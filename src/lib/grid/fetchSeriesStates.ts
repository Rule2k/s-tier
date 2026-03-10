import { liveClient } from "./clients/live";
import { seriesStateQuery } from "./queries/seriesState";
import type { GridSeriesState } from "./types/seriesState";

export const fetchSeriesState = async (
  seriesId: string,
): Promise<GridSeriesState | null> => {
  try {
    const data = await liveClient.request<{ seriesState: GridSeriesState }>(
      seriesStateQuery,
      { id: seriesId },
    );
    return data.seriesState;
  } catch (error) {
    console.error(`[grid] Failed to fetch seriesState for ${seriesId}:`, error);
    return null;
  }
};

export const fetchSeriesStates = async (
  seriesIds: string[],
): Promise<Map<string, GridSeriesState>> => {
  const states = new Map<string, GridSeriesState>();
  const results = await Promise.all(
    seriesIds.map(async (id) => ({
      id,
      state: await fetchSeriesState(id),
    })),
  );

  for (const { id, state } of results) {
    if (state) states.set(id, state);
  }

  return states;
};
