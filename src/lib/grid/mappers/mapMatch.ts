import type { GridSeries } from "../types/series";
import type { GridSeriesState } from "../types/seriesState";
import type { Match, MatchStatus, MapScore } from "@/types/match";

const deriveStatus = (state?: GridSeriesState): MatchStatus => {
  if (!state) return "not_started";
  if (state.finished) return "finished";
  if (state.started) return "running";
  return "not_started";
};

const mapMaps = (state?: GridSeriesState): MapScore[] => {
  if (!state?.games) return [];

  return state.games.map((game) => {
    let status: MatchStatus = "not_started";
    if (game.finished) status = "finished";
    else if (game.started) status = "running";

    return {
      mapNumber: game.sequenceNumber,
      mapName: game.map?.name ?? "unknown",
      status,
      scores: [game.teams[0]?.score ?? 0, game.teams[1]?.score ?? 0],
      sides: [game.teams[0]?.side ?? "", game.teams[1]?.side ?? ""],
    };
  });
};

export const mapGridToMatch = (
  gridSeries: GridSeries,
  seriesState?: GridSeriesState,
): Match => {
  const status = deriveStatus(seriesState);
  const teams = gridSeries.teams.map((team, i) => {
    const stateTeam = seriesState?.teams[i];
    const score = stateTeam?.score ?? null;
    const isWinner =
      status === "finished" && score !== null
        ? score === Math.max(...(seriesState?.teams.map((t) => t.score) ?? []))
        : false;

    return {
      name: team.baseInfo.name,
      logoUrl: team.baseInfo.logoUrl || null,
      score,
      isWinner,
    };
  });

  return {
    id: gridSeries.id,
    status,
    scheduledAt: gridSeries.startTimeScheduled,
    format: gridSeries.format.nameShortened,
    teams,
    maps: mapMaps(seriesState),
  };
};
