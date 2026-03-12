import { NextRequest } from "next/server";
import { GET } from "../route";
import redis from "@/lib/redis/client";
import { makeTournament, makeTournamentSummary } from "@/test/fixtures/matches";

vi.mock("@/lib/redis/client", () => ({
  default: { get: vi.fn(), set: vi.fn(), mget: vi.fn() },
}));

vi.mock("@/lib/tournaments/selectRelevantTournaments", () => ({
  selectRelevantTournaments: vi.fn(),
}));

import {
  selectRelevantTournaments,
} from "@/lib/tournaments/selectRelevantTournaments";

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
    it("returns tournaments from cache via index", async () => {
      const index = [makeTournamentSummary({ id: "828791" })];
      const tournament = makeTournament({ id: "828791" });

      vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(index));
      vi.mocked(redis.mget).mockResolvedValueOnce([JSON.stringify(tournament)]);
      vi.mocked(selectRelevantTournaments).mockReturnValue(index);

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(data).toEqual([tournament]);
    });

    it("returns 503 when Redis index is empty", async () => {
      vi.mocked(redis.get).mockResolvedValueOnce(null);

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({ error: "Data not yet available", retryAfter: 15 });
    });

    it("returns 503 when Redis is down", async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({ error: "Data not yet available", retryAfter: 15 });
    });
  });

  describe("with ?tournamentId=", () => {
    it("returns cached tournament", async () => {
      const tournament = makeTournament({ id: "828791" });
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(tournament));

      const response = await GET(makeRequest({ tournamentId: "828791" }));
      const data = await response.json();

      expect(data).toEqual(tournament);
    });

    it("returns 404 when tournament not in cache", async () => {
      vi.mocked(redis.get).mockResolvedValueOnce(null);

      const response = await GET(makeRequest({ tournamentId: "999" }));
      expect(response.status).toBe(404);
    });

    it("returns 503 when Redis fails", async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));

      const response = await GET(makeRequest({ tournamentId: "828791" }));
      expect(response.status).toBe(503);
    });
  });
});
