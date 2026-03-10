import type { GridSeries } from "./types/series";

export const getSeriesTeamsLabel = (series: GridSeries): string =>
  series.teams
    .map((team) => team.baseInfo.nameShortened || team.baseInfo.name)
    .join(" vs ");
