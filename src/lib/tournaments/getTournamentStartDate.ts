import type { Tournament } from "@/types/match";

export const getTournamentStartDate = (tournament: Tournament): string =>
  tournament.matches[0]?.scheduledAt ?? "";
