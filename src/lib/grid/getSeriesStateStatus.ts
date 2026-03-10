import type { GridSeriesState } from "./types/seriesState";

export const getSeriesStateStatus = (state: GridSeriesState): "finished" | "running" | "not_started" => {
  if (state.finished) return "finished";
  if (state.started) return "running";
  return "not_started";
};
