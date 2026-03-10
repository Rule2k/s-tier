import redis from "@/lib/redis/client";
import { CACHE_KEYS } from "@/lib/redis/keys";
import { TOURNAMENT_IDS } from "@/config/tournaments";
import { buildTournamentSummary } from "@/lib/tournaments/buildTournamentSummary";
import {
  fetchTournamentSeries,
} from "@/lib/grid/fetchTournaments";
import type { TournamentSummary } from "@/types/match";

export const getTournamentIndex = async (): Promise<TournamentSummary[]> => {
  try {
    const cached = await redis.get(CACHE_KEYS.TOURNAMENTS_INDEX);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("Redis read failed for tournament index:", error);
  }

  // Fallback: fetch from Grid Central directly
  const summaries: TournamentSummary[] = [];
  for (const id of TOURNAMENT_IDS) {
    const gridSeries = await fetchTournamentSeries(id);
    const summary = buildTournamentSummary(id, gridSeries);
    if (summary) summaries.push(summary);
  }
  return summaries;
};
