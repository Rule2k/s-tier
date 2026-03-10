import { buildTournamentSummary } from "./buildTournamentSummary";
import { fetchTournamentSeries } from "@/lib/grid/fetchTournaments";
import type { GridSeries } from "@/lib/grid/types/series";
import type { TournamentSummary } from "@/types/match";

export type TournamentSeriesIndex = {
  summaries: TournamentSummary[];
  seriesByTournamentId: Map<string, GridSeries[]>;
};

export const fetchTournamentSeriesIndex = async (
  tournamentIds: string[],
): Promise<TournamentSeriesIndex> => {
  const results = await Promise.all(
    tournamentIds.map(async (id) => ({
      id,
      series: await fetchTournamentSeries(id),
    })),
  );

  const summaries: TournamentSummary[] = [];
  const seriesByTournamentId = new Map<string, GridSeries[]>();

  for (const { id, series } of results) {
    seriesByTournamentId.set(id, series);

    const summary = buildTournamentSummary(id, series);
    if (summary) summaries.push(summary);
  }

  return { summaries, seriesByTournamentId };
};
