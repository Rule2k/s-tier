import { mapGridToMatch } from "./mappers/mapMatch";
import type { GridSeries } from "./types/series";
import type { GridSeriesState } from "./types/seriesState";
import type { Tournament } from "@/types/match";

export const buildTournament = (
  tournamentId: string,
  tournamentName: string,
  tournamentLogoUrl: string | null,
  gridSeriesList: GridSeries[],
  seriesStates: Map<string, GridSeriesState>,
): Tournament => ({
  id: tournamentId,
  name: tournamentName,
  logoUrl: tournamentLogoUrl,
  matches: gridSeriesList
    .map((series) => mapGridToMatch(series, seriesStates.get(series.id)))
    .sort(
      (matchA, matchB) =>
        new Date(matchA.scheduledAt).getTime() -
        new Date(matchB.scheduledAt).getTime(),
    ),
});
