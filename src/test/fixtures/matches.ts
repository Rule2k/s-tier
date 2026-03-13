import type { Match, TournamentView, MapScore, MatchTeam, TournamentSummary } from "@/types/match";

export const makeMatchTeam = (overrides: Partial<MatchTeam> = {}): MatchTeam => ({
  name: "Team Alpha",
  shortName: "TA",
  logoUrl: "https://img.grid.gg/team-alpha.png",
  score: 2,
  isWinner: true,
  ...overrides,
});

export const makeMapScore = (overrides: Partial<MapScore> = {}): MapScore => ({
  mapNumber: 1,
  mapName: "mirage",
  status: "finished",
  scores: [13, 8],
  sides: ["terrorists", "counter-terrorists"],
  ...overrides,
});

export const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: "1234",
  status: "finished",
  scheduledAt: "2025-06-15T15:00:00Z",
  format: "Bo3",
  teams: [
    makeMatchTeam(),
    makeMatchTeam({
      name: "Team Bravo",
      shortName: "TB",
      logoUrl: "https://img.grid.gg/team-bravo.png",
      score: 1,
      isWinner: false,
    }),
  ],
  maps: [
    makeMapScore({ mapNumber: 1, mapName: "mirage", scores: [13, 8] }),
    makeMapScore({ mapNumber: 2, mapName: "inferno", scores: [9, 13] }),
    makeMapScore({ mapNumber: 3, mapName: "nuke", scores: [13, 10] }),
  ],
  ...overrides,
});

export const makeTournament = (overrides: Partial<TournamentView> = {}): TournamentView => ({
  id: "828791",
  name: "ESL Pro League Season 23",
  logoUrl: "https://img.grid.gg/esl-pro-league.png",
  matches: [makeMatch()],
  ...overrides,
});

export const makeTournamentSummary = (overrides: Partial<TournamentSummary> = {}): TournamentSummary => ({
  id: "828791",
  name: "ESL Pro League Season 23",
  logoUrl: "https://img.grid.gg/esl-pro-league.png",
  startDate: "2025-06-01T00:00:00Z",
  endDate: "2025-06-30T23:59:59Z",
  ...overrides,
});

