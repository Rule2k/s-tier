import { sortTournamentSummariesByStartDate } from "./sortTournamentSummariesByStartDate";
import type { TournamentSummary } from "@/types/match";

export const selectRelevantTournaments = (
  tournaments: TournamentSummary[],
  count = 3,
): TournamentSummary[] => {
  if (tournaments.length <= count) return tournaments;

  const sorted = sortTournamentSummariesByStartDate(tournaments);
  const now = Date.now();

  let anchorIndex = sorted.findIndex((tournament) => {
    const start = new Date(tournament.startDate).getTime();
    const end = tournament.endDate ? new Date(tournament.endDate).getTime() : start;
    return start <= now && now <= end;
  });

  if (anchorIndex === -1) {
    let minDistance = Infinity;

    sorted.forEach((tournament, index) => {
      const start = new Date(tournament.startDate).getTime();
      const end = tournament.endDate ? new Date(tournament.endDate).getTime() : start;
      const distance = Math.min(Math.abs(now - start), Math.abs(now - end));

      if (distance < minDistance) {
        minDistance = distance;
        anchorIndex = index;
      }
    });
  }

  const half = Math.floor(count / 2);
  let start = anchorIndex - half;
  let end = start + count;

  if (start < 0) {
    start = 0;
    end = count;
  }
  if (end > sorted.length) {
    end = sorted.length;
    start = end - count;
  }

  return sorted.slice(start, end);
};
