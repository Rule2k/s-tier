import type { Match } from "@/types/match";
import { startOfDay } from "date-fns";

export const groupMatchesByDate = (matches: Match[]): Map<string, Match[]> => {
  const matchesByDate = new Map<string, Match[]>();
  for (const match of matches) {
    const dateKey = startOfDay(new Date(match.scheduledAt)).toISOString();
    const matchesForDate = matchesByDate.get(dateKey) ?? [];
    matchesForDate.push(match);
    matchesByDate.set(dateKey, matchesForDate);
  }
  return matchesByDate;
};
