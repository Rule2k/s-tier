import redis from "@/lib/redis/client";
import { CACHE_KEYS } from "@/lib/redis/keys";
import { TOURNAMENT_IDS } from "@/config/tournaments";
import { fetchTournamentSeriesIndex } from "@/lib/tournaments/fetchTournamentSeriesIndex";
import type { TournamentSummary } from "@/types/match";

export const getTournamentIndex = async (): Promise<TournamentSummary[]> => {
  try {
    const cached = await redis.get(CACHE_KEYS.TOURNAMENTS_INDEX);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("Redis read failed for tournament index:", error);
  }

  const { summaries } = await fetchTournamentSeriesIndex(TOURNAMENT_IDS);
  return summaries;
};
