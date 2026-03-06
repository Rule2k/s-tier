import type { PandaScoreMatch, PandaScoreTeam, PandaScoreTournament, PandaScoreSerie, PandaScoreLeague } from "@/lib/pandascore/types/match";
import type { Match, Stage, Serie } from "@/types/match";

const defaultTeam: PandaScoreTeam = {
  id: 1,
  name: "Team Alpha",
  acronym: "TA",
  image_url: "https://img.pandascore.co/team-alpha.png",
  dark_mode_image_url: null,
  location: "US",
  slug: "team-alpha",
};

const defaultTournament: PandaScoreTournament = {
  id: 100,
  name: "BLAST Premier Spring Finals 2025",
  slug: "blast-premier-spring-finals-2025",
  tier: "s",
  region: "EU",
  league_id: 10,
  serie_id: 50,
};

export const makePandaScoreMatch = (
  overrides: Partial<PandaScoreMatch> = {},
): PandaScoreMatch => ({
  id: 1234,
  status: "finished",
  scheduled_at: "2025-06-15T15:00:00Z",
  begin_at: "2025-06-15T15:05:00Z",
  end_at: "2025-06-15T17:30:00Z",
  match_type: "best_of",
  number_of_games: 3,
  winner_id: 1,
  opponents: [
    { type: "Team", opponent: { ...defaultTeam } },
    { type: "Team", opponent: { ...defaultTeam, id: 2, name: "Team Bravo", acronym: "TB", slug: "team-bravo", image_url: "https://img.pandascore.co/team-bravo.png" } },
  ],
  results: [
    { team_id: 1, score: 2 },
    { team_id: 2, score: 1 },
  ],
  tournament: { ...defaultTournament },
  league_id: 10,
  serie_id: 50,
  streams_list: [],
  ...overrides,
});

export const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: "1234",
  status: "finished",
  scheduledAt: "2025-06-15T15:00:00Z",
  format: "Bo3",
  tournament: {
    id: "100",
    name: "BLAST Premier Spring Finals 2025",
    tier: "s",
    slug: "blast-premier-spring-finals-2025",
    region: "EU",
  },
  teams: [
    { name: "Team Alpha", acronym: "TA", imageUrl: "https://img.pandascore.co/team-alpha.png", score: 2, isWinner: true },
    { name: "Team Bravo", acronym: "TB", imageUrl: "https://img.pandascore.co/team-bravo.png", score: 1, isWinner: false },
  ],
  ...overrides,
});

const defaultLeague: PandaScoreLeague = {
  id: 10,
  name: "BLAST Premier",
  slug: "blast-premier",
  image_url: "https://img.pandascore.co/blast-premier.png",
};

export const makePandaScoreSerie = (
  overrides: Partial<PandaScoreSerie> = {},
): PandaScoreSerie => ({
  id: 50,
  name: "Spring",
  full_name: "Spring 2025",
  season: "Spring",
  year: 2025,
  begin_at: "2025-06-01T00:00:00Z",
  end_at: "2025-06-30T23:59:59Z",
  league_id: 10,
  slug: "blast-premier-spring-2025",
  league: { ...defaultLeague },
  tournaments: [{ ...defaultTournament }],
  ...overrides,
});

export const makeStage = (overrides: Partial<Stage> = {}): Stage => ({
  id: "100",
  name: "Group Stage",
  matches: [makeMatch()],
  ...overrides,
});

export const makeSerie = (overrides: Partial<Serie> = {}): Serie => ({
  id: "50",
  name: "BLAST Premier Spring 2025",
  leagueImageUrl: "https://img.pandascore.co/blast-premier.png",
  tier: "s",
  region: "EU",
  beginAt: "2025-06-01T00:00:00Z",
  endAt: "2025-06-30T23:59:59Z",
  stages: [makeStage()],
  ...overrides,
});
