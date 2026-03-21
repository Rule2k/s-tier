import { beforeEach, describe, expect, it, vi } from "vitest";

const centralDataMock = vi.hoisted(() => ({
  discoverTournaments: vi.fn(),
  fetchTournamentSeries: vi.fn(),
}));

const redisWriterMock = vi.hoisted(() => ({
  writeTournaments: vi.fn(),
  writeTournamentSeries: vi.fn(),
  writeDiscoveryTimestamp: vi.fn(),
  deleteTournaments: vi.fn(),
}));

const schedulerMock = vi.hoisted(() => ({
  upsertSeries: vi.fn(),
  getRegistry: vi.fn(),
  getSeriesForTournament: vi.fn(),
  removeSeriesNotIn: vi.fn(),
}));

const rateLimiterMock = vi.hoisted(() => ({
  cleanupPerSeriesBuckets: vi.fn(),
  drainBucket: vi.fn(),
  centralBucket: { limit: 20, windowMs: 60_000, count: 0, windowStart: 0 },
}));

const redisMock = vi.hoisted(() => ({
  zrangebyscore: vi.fn(),
  zrevrangebyscore: vi.fn(),
  get: vi.fn(),
  pipeline: vi.fn(),
}));

vi.mock("../grid/central-data", () => centralDataMock);
vi.mock("../redis-writer", () => redisWriterMock);
vi.mock("../scheduler", () => schedulerMock);
vi.mock("../rate-limiter", () => rateLimiterMock);
vi.mock("../../src/lib/redis/client", () => ({ default: redisMock }));
vi.mock("../logger", () => ({ logError: vi.fn() }));

import { runDiscoveryCycle } from "../discovery";

describe("discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    schedulerMock.getRegistry.mockReturnValue(new Map());
    schedulerMock.getSeriesForTournament.mockReturnValue([]);
    schedulerMock.removeSeriesNotIn.mockReturnValue(1);
    redisMock.zrangebyscore.mockResolvedValue(["t1", "t-stale"]);
    redisWriterMock.writeTournaments.mockResolvedValue(undefined);
    redisWriterMock.writeTournamentSeries.mockResolvedValue(undefined);
    redisWriterMock.writeDiscoveryTimestamp.mockResolvedValue(undefined);
    redisWriterMock.deleteTournaments.mockResolvedValue(undefined);
  });

  it("re-fetches tracked tournaments and prunes stale tournaments from Redis", async () => {
    centralDataMock.discoverTournaments.mockResolvedValue([
      {
        id: "t1",
        name: "Tournament 1",
        nameShortened: "T1",
        logoUrl: null,
        startDate: "2026-03-16T10:00:00Z",
        endDate: "2026-03-17T10:00:00Z",
        prizePool: null,
        venueType: "LAN",
        teams: [],
      },
    ]);

    centralDataMock.fetchTournamentSeries.mockResolvedValue([
      {
        id: "series-new",
        tournamentId: "t1",
        startTimeScheduled: "2026-03-16T12:00:00Z",
        format: "Bo3",
        type: "ESPORTS",
        streams: [],
        teams: [
          { id: "team-a", name: "Alpha", logoUrl: null },
          { id: "team-b", name: "Beta", logoUrl: null },
        ],
      },
    ]);

    await runDiscoveryCycle();

    expect(centralDataMock.fetchTournamentSeries).toHaveBeenCalledWith("t1");
    expect(redisWriterMock.writeTournamentSeries).toHaveBeenCalledWith(
      "t1",
      expect.arrayContaining([
        expect.objectContaining({ id: "series-new" }),
      ]),
    );
    expect(redisWriterMock.deleteTournaments).toHaveBeenCalledWith(["t-stale"]);

    const retainedSeriesIds = schedulerMock.removeSeriesNotIn.mock.calls[0]?.[0];
    expect(retainedSeriesIds).toBeInstanceOf(Set);
    expect(Array.from(retainedSeriesIds)).toEqual(["series-new"]);
  });
});
