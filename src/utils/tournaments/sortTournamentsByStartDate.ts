import { getTournamentStartDate } from "./getTournamentStartDate";
import type { Tournament } from "@/types/match";

export const sortTournamentsByStartDate = <T extends Tournament>(tournaments: T[]): T[] =>
  [...tournaments].sort(
    (tournamentA, tournamentB) =>
      new Date(getTournamentStartDate(tournamentA)).getTime() -
      new Date(getTournamentStartDate(tournamentB)).getTime(),
  );
