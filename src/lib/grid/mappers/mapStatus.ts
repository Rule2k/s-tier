import type { MatchStatus } from "@/types/match";
import type { GridSeriesState } from "../types/seriesState";

export const mapStatus = (state: GridSeriesState | null): MatchStatus => {
  if (!state || !state.started) return "upcoming";
  if (!state.finished) return "live";
  return "completed";
}
