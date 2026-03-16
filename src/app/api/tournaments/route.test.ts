import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  zcard: vi.fn(),
  zrevrangebyscore: vi.fn(),
  zrangebyscore: vi.fn(),
  pipeline: vi.fn(),
}));

vi.mock("@/lib/redis/client", () => ({
  default: redisMock,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), init),
  },
}));

import { GET } from "./route";

type PipelineResult = [Error | null, unknown];

interface PipelineMock {
  get: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
}

const createPipeline = (
  results: PipelineResult[],
): PipelineMock => {
  const pipeline = {} as PipelineMock;
  pipeline.get = vi.fn().mockReturnValue(pipeline);
  pipeline.exec = vi.fn().mockResolvedValue(results);
  return pipeline;
};

describe("/api/tournaments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps team and map scores by team id instead of array position", async () => {
    const pipeline = createPipeline([
      [null, JSON.stringify({
        id: "series-1",
        tournamentId: "t1",
        startTimeScheduled: "2026-03-16T10:00:00Z",
        format: "Bo3",
        type: "ESPORTS",
        streams: [],
        teams: [
          { id: "team-a", name: "Alpha", logoUrl: "alpha.png" },
          { id: "team-b", name: "Beta", logoUrl: "beta.png" },
        ],
      })],
      [null, JSON.stringify({
        seriesId: "series-1",
        format: "Bo3",
        started: true,
        finished: false,
        teams: [
          { id: "team-b", name: "Beta", score: 1, won: false },
          { id: "team-a", name: "Alpha", score: 2, won: true },
        ],
        games: [
          {
            id: "game-1",
            sequenceNumber: 1,
            mapName: "Nuke",
            started: true,
            finished: true,
            teams: [
              { id: "team-b", name: "Beta", side: "CT", score: 11, won: false },
              { id: "team-a", name: "Alpha", side: "T", score: 13, won: true },
            ],
          },
        ],
      })],
    ]);

    redisMock.get.mockResolvedValueOnce(JSON.stringify({
      id: "t1",
      name: "Tournament 1",
      nameShortened: "T1",
      logoUrl: null,
      startDate: "2026-03-16T09:00:00Z",
      endDate: "2026-03-17T09:00:00Z",
      prizePool: null,
      venueType: "LAN",
      teams: [],
    }));
    redisMock.zrangebyscore.mockResolvedValueOnce(["series-1"]);
    redisMock.pipeline.mockReturnValue(pipeline);

    const response = await GET(new Request("http://localhost/api/tournaments?id=t1"));
    const body = await response.json();
    const match = body.tournaments[0].matches[0];

    expect(match.teams[0]).toMatchObject({
      name: "Alpha",
      score: 2,
      isWinner: true,
    });
    expect(match.teams[1]).toMatchObject({
      name: "Beta",
      score: 1,
      isWinner: false,
    });
    expect(match.maps[0]).toMatchObject({
      scores: [13, 11],
      sides: ["T", "CT"],
    });
  });

  it("marks a past scheduled match without state as finished", async () => {
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));

    const pipeline = createPipeline([
      [null, JSON.stringify({
        id: "series-2",
        tournamentId: "t1",
        startTimeScheduled: "2026-03-16T10:00:00Z",
        format: "Bo3",
        type: "ESPORTS",
        streams: [],
        teams: [
          { id: "team-a", name: "Alpha", logoUrl: null },
          { id: "team-b", name: "Beta", logoUrl: null },
        ],
      })],
      [null, null],
    ]);

    redisMock.get.mockResolvedValueOnce(JSON.stringify({
      id: "t1",
      name: "Tournament 1",
      nameShortened: "T1",
      logoUrl: null,
      startDate: "2026-03-16T09:00:00Z",
      endDate: "2026-03-17T09:00:00Z",
      prizePool: null,
      venueType: "LAN",
      teams: [],
    }));
    redisMock.zrangebyscore.mockResolvedValueOnce(["series-2"]);
    redisMock.pipeline.mockReturnValue(pipeline);

    const response = await GET(new Request("http://localhost/api/tournaments?id=t1"));
    const body = await response.json();

    expect(body.tournaments[0].matches[0].status).toBe("finished");
    vi.useRealTimers();
  });
});
