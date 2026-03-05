import { GET } from "./route";
import redis from "@/lib/redis/client";
import { fetchMatchesFromPandaScore } from "@/lib/pandascore/fetchMatches";
import { makeMatch } from "@/test/fixtures/matches";

vi.mock("@/lib/redis/client", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("@/lib/pandascore/fetchMatches");

describe("GET /api/matches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns cached data from Redis without calling PandaScore", async () => {
    const cached = [makeMatch()];
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cached));

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(cached);
    expect(fetchMatchesFromPandaScore).not.toHaveBeenCalled();
  });

  it("falls back to PandaScore when Redis cache is empty", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const matches = [makeMatch()];
    vi.mocked(fetchMatchesFromPandaScore).mockResolvedValue(matches);
    vi.mocked(redis.set).mockResolvedValue("OK");

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(matches);
    expect(fetchMatchesFromPandaScore).toHaveBeenCalledOnce();
  });

  it("falls back to PandaScore when Redis throws", async () => {
    vi.mocked(redis.get).mockRejectedValue(new Error("Connection refused"));
    const matches = [makeMatch()];
    vi.mocked(fetchMatchesFromPandaScore).mockResolvedValue(matches);
    vi.mocked(redis.set).mockResolvedValue("OK");

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(matches);
  });

  it("returns 500 when both Redis and PandaScore fail", async () => {
    vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));
    vi.mocked(fetchMatchesFromPandaScore).mockRejectedValue(new Error("API down"));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Failed to fetch matches" });
  });
});
