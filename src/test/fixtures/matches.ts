import type { PandaScoreMatch, PandaScoreTeam, PandaScoreTournament } from "@/lib/pandascore/types/match";
import type { Match } from "@/types/match";

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
