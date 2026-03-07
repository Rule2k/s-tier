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

export interface Stage {
  id: string;
  name: string;
  matches: Match[];
}

export interface Serie {
  id: string;
  name: string;
  leagueImageUrl: string | null;
  tier: string;
  region: string | null;
  beginAt: string;
  endAt: string;
  stages: Stage[];
}

export interface SerieSummary {
  id: string;
  name: string;
  leagueImageUrl: string | null;
  tier: string;
  region: string | null;
  beginAt: string;
  endAt: string;
}
