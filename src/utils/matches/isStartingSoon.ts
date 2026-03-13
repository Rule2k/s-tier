import type { Match } from "@/types/match";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const isStartingSoon = (match: Match): boolean => {
  if (match.status !== "not_started" || !match.scheduledAt) return false;
  return new Date(match.scheduledAt).getTime() - Date.now() <= ONE_HOUR_MS;
};
