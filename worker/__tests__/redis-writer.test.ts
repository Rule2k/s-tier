import { beforeEach, describe, expect, it, vi } from "vitest";
import { REDIS_KEYS } from "../../src/shared/redis-keys";

const redisMock = vi.hoisted(() => ({
  pipeline: vi.fn(),
  zrangebyscore: vi.fn(),
  set: vi.fn(),
}));

vi.mock("../../src/lib/redis/client", () => ({
  default: redisMock,
}));

vi.mock("../logger", () => ({
  logError: vi.fn(),
}));

import {
  deleteTournaments,
  writeTournaments,
  writeTournamentSeries,
} from "../redis-writer";

type PipelineResult = [Error | null, unknown];

interface PipelineMock {
  del: ReturnType<typeof vi.fn>;
  zadd: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
}

const createPipeline = (
  results: PipelineResult[] = [[null, "OK"]],
): PipelineMock => {
  const pipeline = {} as PipelineMock;
  pipeline.del = vi.fn().mockReturnValue(pipeline);
  pipeline.zadd = vi.fn().mockReturnValue(pipeline);
  pipeline.set = vi.fn().mockReturnValue(pipeline);
  pipeline.exec = vi.fn().mockResolvedValue(results);
  return pipeline;
};

describe("redis-writer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.zrangebyscore.mockResolvedValue([]);
    redisMock.set.mockResolvedValue("OK");
  });

  it("writes tournaments ordered by startDate score", async () => {
    const pipeline = createPipeline();
    redisMock.pipeline.mockReturnValue(pipeline);

    await writeTournaments([
      {
        id: "t1",
        name: "Tournament 1",
        nameShortened: "T1",
        logoUrl: null,
        startDate: "2026-03-10T12:00:00Z",
        endDate: "2026-03-11T12:00:00Z",
        prizePool: null,
        venueType: "LAN",
        teams: [],
      },
    ]);

    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.tournaments);
    expect(pipeline.zadd).toHaveBeenCalledWith(
      REDIS_KEYS.tournaments,
      new Date("2026-03-10T12:00:00Z").getTime(),
      "t1",
    );
  });

  it("cleans stale series artifacts even when the replacement list is empty", async () => {
    const pipeline = createPipeline();
    redisMock.pipeline.mockReturnValue(pipeline);
    redisMock.zrangebyscore.mockResolvedValue(["series-old"]);

    await writeTournamentSeries("t1", []);

    expect(redisMock.zrangebyscore).toHaveBeenCalledWith(
      REDIS_KEYS.tournamentSeries("t1"),
      "-inf",
      "+inf",
    );
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.tournamentSeries("t1"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.series("series-old"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.seriesState("series-old"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.metaSeriesLastRefresh("series-old"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.metaSeriesStatus("series-old"));
    expect(pipeline.zadd).not.toHaveBeenCalled();
  });

  it("deletes stale tournaments and their series artifacts", async () => {
    const pipeline = createPipeline();
    redisMock.pipeline.mockReturnValue(pipeline);
    redisMock.zrangebyscore
      .mockResolvedValueOnce(["series-1", "series-2"])
      .mockResolvedValueOnce(["series-3"]);

    await deleteTournaments(["t1", "t2"]);

    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.tournament("t1"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.tournamentSeries("t1"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.series("series-1"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.seriesState("series-2"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.tournament("t2"));
    expect(pipeline.del).toHaveBeenCalledWith(REDIS_KEYS.series("series-3"));
  });
});
