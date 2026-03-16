import { beforeEach, describe, expect, it, vi } from "vitest";

const seriesStateMock = vi.hoisted(() => ({
  fetchSeriesState: vi.fn(),
}));

const redisWriterMock = vi.hoisted(() => ({
  writeSeriesState: vi.fn(),
  writeSeriesMeta: vi.fn(),
  writeHeartbeat: vi.fn(),
}));

const schedulerMock = vi.hoisted(() => ({
  getEligibleSeries: vi.fn(),
  getRegistry: vi.fn(),
}));

const rateLimiterMock = vi.hoisted(() => ({
  tryConsume: vi.fn(),
  liveGlobalBucket: { limit: 180, windowMs: 60_000, count: 0, windowStart: 0 },
  getLivePerSeriesBucket: vi.fn(),
  cleanupPerSeriesBuckets: vi.fn(),
  getRemaining: vi.fn(),
}));

vi.mock("./grid/series-state", () => seriesStateMock);
vi.mock("./redis-writer", () => redisWriterMock);
vi.mock("./scheduler", () => schedulerMock);
vi.mock("./rate-limiter", () => rateLimiterMock);
vi.mock("./logger", () => ({ logError: vi.fn() }));

import { runRefreshCycle } from "./series-refresh";

describe("series-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    redisWriterMock.writeHeartbeat.mockResolvedValue(undefined);
    schedulerMock.getRegistry.mockReturnValue(new Map());
    schedulerMock.getEligibleSeries.mockReturnValue([
      {
        tier: "P0",
        staleness: 60_000,
        entry: {
          seriesId: "series-1",
          tournamentId: "t1",
          gridSeries: {
            id: "series-1",
            startTimeScheduled: "2026-03-16T10:00:00Z",
            format: { nameShortened: "Bo3" },
            tournament: {
              id: "t1",
              name: "Tournament 1",
              nameShortened: "T1",
              logoUrl: "",
            },
            teams: [],
          },
          state: null,
          lastFetchedAt: 0,
          failCount: 0,
        },
      },
    ]);
    rateLimiterMock.tryConsume.mockReturnValue(true);
    rateLimiterMock.getLivePerSeriesBucket.mockReturnValue({
      limit: 6,
      windowMs: 60_000,
      count: 0,
      windowStart: 0,
    });
    rateLimiterMock.getRemaining.mockReturnValue(180);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes a heartbeat before waiting on rate-limit backoff", async () => {
    seriesStateMock.fetchSeriesState.mockRejectedValue(new Error("429 too many requests"));

    const refreshPromise = runRefreshCycle();
    await vi.runAllTimersAsync();
    await refreshPromise;

    expect(redisWriterMock.writeHeartbeat).toHaveBeenCalled();
  });
});
