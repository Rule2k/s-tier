import { formatDateRange } from "@/utils/matches/formatDateRange";
import type { Match } from "@/types/match";

export type TournamentSummary = {
  matchCount: number;
  dateRange: string | null;
};

export const getTournamentSummary = (matches: Match[]): TournamentSummary => {
  const scheduledMatches = matches
    .filter((match) => Boolean(match.scheduledAt))
    .sort(
      (matchA, matchB) => new Date(matchA.scheduledAt).getTime() - new Date(matchB.scheduledAt).getTime(),
    );

  const firstMatch = scheduledMatches[0]?.scheduledAt;
  const lastMatch = scheduledMatches[scheduledMatches.length - 1]?.scheduledAt;

  return {
    matchCount: matches.length,
    dateRange: firstMatch && lastMatch ? formatDateRange(firstMatch, lastMatch) : null,
  };
};
