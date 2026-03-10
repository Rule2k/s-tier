import type { GridSeries } from "@/lib/grid/types/series";
import type { TournamentSummary } from "@/types/match";

export const buildTournamentSummary = (
  tournamentId: string,
  gridSeriesList: GridSeries[],
): TournamentSummary | null => {
  if (gridSeriesList.length === 0) return null;

  const firstSeries = gridSeriesList[0];
  const scheduledTimes = gridSeriesList.map(
    (series) => new Date(series.startTimeScheduled).getTime(),
  );

  return {
    id: tournamentId,
    name: firstSeries.tournament.name,
    logoUrl: firstSeries.tournament.logoUrl || null,
    startDate: new Date(Math.min(...scheduledTimes)).toISOString(),
    endDate: new Date(Math.max(...scheduledTimes)).toISOString(),
  };
};
