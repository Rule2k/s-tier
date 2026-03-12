import { buildTournament } from "../src/lib/grid/buildTournament";
import { buildTournamentSummary } from "../src/lib/tournaments/buildTournamentSummary";
import { getSeriesForTournament } from "./scheduler";
import type { GridSeriesState } from "../src/lib/grid/types/seriesState";
import type { Tournament, TournamentSummary } from "../src/types/match";

export const rebuildTournament = (
  tournamentId: string,
): Tournament | null => {
  const entries = getSeriesForTournament(tournamentId);
  if (entries.length === 0) return null;

  const first = entries[0];
  const gridSeriesList = entries.map((e) => e.gridSeries);
  const seriesStates = new Map<string, GridSeriesState>();

  for (const entry of entries) {
    if (entry.state) seriesStates.set(entry.seriesId, entry.state);
  }

  return buildTournament(
    tournamentId,
    first.gridSeries.tournament.name,
    first.gridSeries.tournament.logoUrl || null,
    gridSeriesList,
    seriesStates,
  );
};

export const rebuildTournamentSummary = (
  tournamentId: string,
): TournamentSummary | null => {
  const entries = getSeriesForTournament(tournamentId);
  if (entries.length === 0) return null;

  const gridSeriesList = entries.map((e) => e.gridSeries);
  return buildTournamentSummary(tournamentId, gridSeriesList);
};
