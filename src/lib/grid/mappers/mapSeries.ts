import type { Match } from "@/types/match";
import type { GridSeries } from "../types/series";
import type { GridSeriesState } from "../types/seriesState";
import { mapStatus } from "./mapStatus";

export const mapSeries = (
  series: GridSeries,
  state: GridSeriesState | null
): Match => {
  const status = mapStatus(state);

  return {
    id: series.id,
    status,
    startTimeScheduled: series.startTimeScheduled,
    format: series.format.nameShortened,
    tournament: {
      id: series.tournament.id,
      name: series.tournament.name,
      nameShortened: series.tournament.nameShortened,
      logoUrl: series.tournament.logoUrl,
    },
    teams: series.teams.map((team) => {
      const liveTeam = state?.teams.find((t) => t.id === team.baseInfo.id);
      return {
        info: {
          id: team.baseInfo.id,
          name: team.baseInfo.name,
          nameShortened: team.baseInfo.nameShortened,
          logoUrl: team.baseInfo.logoUrl,
        },
        score: liveTeam?.score ?? null,
      };
    }),
  };
}
