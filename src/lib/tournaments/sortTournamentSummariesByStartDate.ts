import type { TournamentSummary } from "@/types/match";

export const sortTournamentSummariesByStartDate = (
  tournaments: TournamentSummary[],
): TournamentSummary[] =>
  [...tournaments].sort(
    (summaryA, summaryB) =>
      new Date(summaryA.startDate).getTime() - new Date(summaryB.startDate).getTime(),
  );
