export type MatchStatus = "not_started" | "running" | "finished" | "canceled" | "postponed";

export interface Match {
  id: string;
  status: MatchStatus;
  scheduledAt: string;
  format: string;
  tournament: {
    id: string;
    name: string;
    tier: string;
    slug: string;
    region: string | null;
  };
  teams: {
    name: string;
    acronym: string | null;
    imageUrl: string | null;
    score: number | null;
    isWinner: boolean;
  }[];
}
