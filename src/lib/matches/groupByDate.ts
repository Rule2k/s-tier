import type { Match } from "@/types/match";
import { startOfDay } from "date-fns";

export const groupMatchesByDate = (matches: Match[]): Map<string, Match[]> => {
  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const key = startOfDay(new Date(match.scheduledAt)).toISOString();
    const group = groups.get(key) ?? [];
    group.push(match);
    groups.set(key, group);
  }
  return groups;
};
