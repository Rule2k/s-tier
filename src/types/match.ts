import type { Team } from "./team";
import type { Tournament } from "./tournament";

export type MatchStatus = "upcoming" | "live" | "completed";

export interface Match {
  id: string;
  status: MatchStatus;
  startTimeScheduled: string;
  format: string;
  tournament: Tournament;
  teams: {
    info: Team;
    score: number | null;
  }[];
}
