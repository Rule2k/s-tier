import type { Tournament } from "@/types/match";

export const CACHE_KEYS = {
  TOURNAMENTS_INDEX: "tournaments:index",
  tournamentById: (id: string) => `tournament:${id}`,
  seriesState: (seriesId: string) => `series:state:${seriesId}`,
} as const;

export const CACHE_TTL = {
  INDEX: 600, // 10 min
  TOURNAMENT_RUNNING: 120, // 2 min (at least one live match)
  TOURNAMENT_UPCOMING: 300, // 5 min (has upcoming matches)
  TOURNAMENT_PAST: 604_800, // 7 days (all matches finished)
  SERIES_STATE_LIVE: 120, // 2 min
  SERIES_STATE_UPCOMING_SOON: 900, // 15 min (upcoming < 24h)
  SERIES_STATE_UPCOMING_FAR: 3_600, // 1 hour (upcoming > 24h)
  SERIES_STATE_FINISHED: 604_800, // 7 days
} as const;

export const getTournamentTtl = (tournament: Tournament): number => {
  const hasRunning = tournament.matches.some((m) => m.status === "running");
  if (hasRunning) return CACHE_TTL.TOURNAMENT_RUNNING;

  const allFinished = tournament.matches.every((m) => m.status === "finished");
  if (allFinished) return CACHE_TTL.TOURNAMENT_PAST;

  return CACHE_TTL.TOURNAMENT_UPCOMING;
};
