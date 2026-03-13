import type { Tournament } from "@/types/match";

export const getTournamentEndDate = (tournament: Tournament): string =>
  tournament.matches[tournament.matches.length - 1]?.scheduledAt ?? "";
