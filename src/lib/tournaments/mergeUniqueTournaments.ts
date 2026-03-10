import type { Tournament } from "@/types/match";

export const mergeUniqueTournaments = <T extends Tournament>(tournaments: T[]): T[] => {
  const seen = new Set<string>();

  return tournaments.filter((tournament) => {
    if (seen.has(tournament.id)) return false;
    seen.add(tournament.id);
    return true;
  });
};
