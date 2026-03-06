export interface PandaScoreMatch {
  id: number;
  status: "not_started" | "running" | "finished" | "canceled" | "postponed";
  scheduled_at: string | null;
  begin_at: string | null;
  end_at: string | null;
  match_type: string;
  number_of_games: number;
  winner_id: number | null;
  opponents: {
    type: string;
    opponent: PandaScoreTeam;
  }[];
  results: {
    team_id: number;
    score: number;
  }[];
  tournament: PandaScoreTournament;
  league_id: number;
  serie_id: number;
  streams_list: {
    main: boolean;
    language: string;
    raw_url: string;
  }[];
}

export interface PandaScoreTeam {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
  dark_mode_image_url: string | null;
  location: string | null;
  slug: string;
}

export interface PandaScoreTournament {
  id: number;
  name: string;
  slug: string;
  tier: "s" | "a" | "b" | "c" | "d" | "unranked";
  region: string | null;
  league_id: number;
  serie_id: number;
}

export interface PandaScoreLeague {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface PandaScoreSerie {
  id: number;
  name: string;
  full_name: string;
  season: string | null;
  year: number | null;
  begin_at: string | null;
  end_at: string | null;
  league_id: number;
  slug: string;
  league: PandaScoreLeague;
  tournaments: PandaScoreTournament[];
}
