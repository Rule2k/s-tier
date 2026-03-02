import { NextResponse } from "next/server";
import { centralClient } from "@/lib/grid/clients/central";
import { liveClient } from "@/lib/grid/clients/live";
import allSeriesQuery from "@/lib/grid/queries/allSeries.graphql";
import { buildBatchSeriesStateQuery } from "@/lib/grid/queries/buildBatchSeriesStateQuery";
import type { GridAllSeriesResponse } from "@/lib/grid/types/series";
import type { GridBatchSeriesStateResponse } from "@/lib/grid/types/seriesState";
import { mapSeries } from "@/lib/grid/mappers/mapSeries";

const CS2_TITLE_ID = "28";

export async function GET() {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(0, 0, 0, 0);

    const data = await centralClient.request<GridAllSeriesResponse>(
      allSeriesQuery,
      {
        first: 50,
        filter: {
          titleId: CS2_TITLE_ID,
          startTimeScheduled: {
            gte: yesterday.toISOString(),
            lte: tomorrow.toISOString(),
          },
        },
      }
    );

    const seriesList = data.allSeries.edges.map((edge) => edge.node);

    // Only fetch live data for series that may be live or completed (start time in the past)
    const needsLiveData = seriesList.filter(
      (s) => new Date(s.startTimeScheduled) <= now
    );

    let statesMap: GridBatchSeriesStateResponse = {};

    if (needsLiveData.length > 0) {
      const batchQuery = buildBatchSeriesStateQuery(
        needsLiveData.map((s) => s.id)
      );
      statesMap = await liveClient.request<GridBatchSeriesStateResponse>(
        batchQuery
      );
    }

    // Map series with their live state (null for upcoming)
    const matches = seriesList.map((series) => {
      const stateKey = needsLiveData.findIndex((s) => s.id === series.id);
      const state = stateKey >= 0 ? statesMap[`s${stateKey}`] : null;
      return mapSeries(series, state);
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
