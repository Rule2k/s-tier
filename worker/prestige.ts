import { config } from "./config";
import type { FetchedTournament } from "./types/grid";

/** Returns true if a tournament qualifies as "prestigious" (worth tracking). */
export const isPrestigious = (tournament: FetchedTournament): boolean =>
  (tournament.prizePool !== null && tournament.prizePool >= config.prestige.minPrizePool) ||
  (config.prestige.includeLan && tournament.venueType === "LAN");
