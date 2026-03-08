import type { Match, Tournament, MapScore, MatchTeam, TournamentSummary } from "@/types/match";
import type { GridSeries } from "@/lib/grid/types/series";
import type { GridSeriesState } from "@/lib/grid/types/seriesState";

export const makeMatchTeam = (overrides: Partial<MatchTeam> = {}): MatchTeam => ({
  name: "Team Alpha",
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

export const makeTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
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

export const makeGridSeries = (overrides: Partial<GridSeries> = {}): GridSeries => ({
  id: "1234",
  startTimeScheduled: "2025-06-15T15:00:00Z",
  format: { nameShortened: "Bo3" },
  tournament: {
    id: "828791",
    name: "ESL Pro League Season 23",
    nameShortened: "EPL S23",
    logoUrl: "https://img.grid.gg/esl-pro-league.png",
  },
  teams: [
    { baseInfo: { id: "1", name: "Team Alpha", nameShortened: "TA", logoUrl: "https://img.grid.gg/team-alpha.png" } },
    { baseInfo: { id: "2", name: "Team Bravo", nameShortened: "TB", logoUrl: "https://img.grid.gg/team-bravo.png" } },
  ],
  ...overrides,
});

export const makeGridSeriesState = (overrides: Partial<GridSeriesState> = {}): GridSeriesState => ({
  id: "1234",
  started: true,
  finished: true,
  teams: [
    { id: "1", name: "Team Alpha", score: 2 },
    { id: "2", name: "Team Bravo", score: 1 },
  ],
  games: [
    {
      sequenceNumber: 1,
      started: true,
      finished: true,
      map: { name: "mirage" },
      teams: [
        { score: 13, side: "terrorists" },
        { score: 8, side: "counter-terrorists" },
      ],
    },
    {
      sequenceNumber: 2,
      started: true,
      finished: true,
      map: { name: "inferno" },
      teams: [
        { score: 9, side: "counter-terrorists" },
        { score: 13, side: "terrorists" },
      ],
    },
    {
      sequenceNumber: 3,
      started: true,
      finished: true,
      map: { name: "nuke" },
      teams: [
        { score: 13, side: "terrorists" },
        { score: 10, side: "counter-terrorists" },
      ],
    },
  ],
  ...overrides,
});
