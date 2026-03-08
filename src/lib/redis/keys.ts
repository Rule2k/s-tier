import type { Tournament } from "@/types/match";

export const CACHE_KEYS = {
  TOURNAMENT_INDEX: "tournaments:index",
  tournamentById: (id: string) => `tournament:${id}`,
  matchState: (seriesId: string) => `match:state:${seriesId}`,
} as const;

export const CACHE_TTL = {
  INDEX: 300, // 5 min
  TOURNAMENT_RUNNING: 60, // 1 min (at least one live match)
  TOURNAMENT_UPCOMING: 120, // 2 min (has upcoming matches, needs frequent refresh)
  TOURNAMENT_PAST: 604_800, // 7 days (all matches finished)
  MATCH_RUNNING: 60, // 1 min
  MATCH_FINISHED: 604_800, // 7 days
} as const;

export const getTournamentTtl = (tournament: Tournament): number => {
  const hasRunning = tournament.matches.some((m) => m.status === "running");
  if (hasRunning) return CACHE_TTL.TOURNAMENT_RUNNING;

  const allFinished = tournament.matches.every((m) => m.status === "finished");
  if (allFinished) return CACHE_TTL.TOURNAMENT_PAST;

  // Has upcoming matches — refresh often so we catch status changes
  return CACHE_TTL.TOURNAMENT_UPCOMING;
};
