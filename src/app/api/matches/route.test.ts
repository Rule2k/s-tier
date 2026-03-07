import { NextRequest } from "next/server";
import { GET } from "./route";
import redis from "@/lib/redis/client";
import {
  fetchSeriesFromPandaScore,
  fetchSeriesIndex,
  fetchSerieWithMatches,
  selectRelevantSeries,
} from "@/lib/pandascore/fetchSeries";
import { makeSerie, makePandaScoreSerie } from "@/test/fixtures/matches";

vi.mock("@/lib/redis/client", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("@/lib/pandascore/fetchSeries");

const makeRequest = (params?: Record<string, string>) => {
  const url = new URL("http://localhost/api/matches");
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
};

describe("GET /api/matches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("default (no params)", () => {
    it("returns series from individual caches via index", async () => {
      const pandaSeries = [makePandaScoreSerie({ id: 1 })];
      const serie = makeSerie({ id: "1" });

      vi.mocked(redis.get)
        .mockResolvedValueOnce(JSON.stringify(pandaSeries)) // series:index
        .mockResolvedValueOnce(JSON.stringify(serie));       // series:1
      vi.mocked(selectRelevantSeries).mockReturnValue(pandaSeries);

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(data).toEqual([serie]);
      expect(fetchSeriesFromPandaScore).not.toHaveBeenCalled();
    });

    it("fetches and caches serie on individual cache miss", async () => {
      const pandaSeries = [makePandaScoreSerie({ id: 1 })];
      const serie = makeSerie({ id: "1" });

      vi.mocked(redis.get)
        .mockResolvedValueOnce(JSON.stringify(pandaSeries)) // series:index
        .mockResolvedValueOnce(null);                        // series:1 miss
      vi.mocked(selectRelevantSeries).mockReturnValue(pandaSeries);
      vi.mocked(fetchSerieWithMatches).mockResolvedValue(serie);
      vi.mocked(redis.set).mockResolvedValue("OK");

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(data).toEqual([serie]);
      expect(fetchSerieWithMatches).toHaveBeenCalledWith(pandaSeries[0]);
    });

    it("falls back to PandaScore when Redis is down", async () => {
      const pandaSeries = [makePandaScoreSerie({ id: 1 })];
      const serie = makeSerie({ id: "1" });

      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));
      vi.mocked(fetchSeriesIndex).mockResolvedValue(pandaSeries);
      vi.mocked(selectRelevantSeries).mockReturnValue(pandaSeries);
      vi.mocked(fetchSerieWithMatches).mockResolvedValue(serie);
      vi.mocked(redis.set).mockRejectedValue(new Error("Redis down"));

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(data).toEqual([serie]);
      expect(fetchSeriesIndex).toHaveBeenCalled();
    });

    it("returns 500 when both Redis and PandaScore fail", async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));
      vi.mocked(fetchSeriesIndex).mockRejectedValue(new Error("API down"));
      vi.mocked(fetchSeriesFromPandaScore).mockRejectedValue(new Error("API down"));

      const response = await GET(makeRequest());

      expect(response.status).toBe(500);
    });
  });

  describe("with ?serieId=", () => {
    it("returns cached serie", async () => {
      const serie = makeSerie({ id: "42" });
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(serie));

      const response = await GET(makeRequest({ serieId: "42" }));
      const data = await response.json();

      expect(data).toEqual(serie);
    });

    it("fetches and caches on cache miss", async () => {
      const pandaSerie = makePandaScoreSerie({ id: 42 });
      const serie = makeSerie({ id: "42" });

      vi.mocked(redis.get)
        .mockResolvedValueOnce(null)                          // series:42 miss
        .mockResolvedValueOnce(JSON.stringify([pandaSerie])); // series:index
      vi.mocked(fetchSerieWithMatches).mockResolvedValue(serie);
      vi.mocked(redis.set).mockResolvedValue("OK");

      const response = await GET(makeRequest({ serieId: "42" }));
      const data = await response.json();

      expect(data).toEqual(serie);
      expect(fetchSerieWithMatches).toHaveBeenCalledWith(pandaSerie);
    });

    it("returns 404 when serie not found in index", async () => {
      vi.mocked(redis.get)
        .mockResolvedValueOnce(null)             // series:99 miss
        .mockResolvedValueOnce(JSON.stringify([])); // empty index

      const response = await GET(makeRequest({ serieId: "99" }));

      expect(response.status).toBe(404);
    });

    it("returns 500 when both Redis and PandaScore fail", async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));
      vi.mocked(fetchSeriesIndex).mockRejectedValue(new Error("API down"));

      const response = await GET(makeRequest({ serieId: "42" }));

      expect(response.status).toBe(500);
    });
  });
});
