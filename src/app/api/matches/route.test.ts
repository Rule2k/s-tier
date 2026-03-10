import { NextRequest } from "next/server";
import { GET } from "./route";
import redis from "@/lib/redis/client";
import { makeTournament, makeTournamentSummary } from "@/test/fixtures/matches";

vi.mock("@/lib/redis/client", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("@/lib/grid/fetchTournaments", () => ({
  fetchTournamentSeries: vi.fn(),
  fetchSeriesStates: vi.fn(),
  buildTournament: vi.fn(),
}));
vi.mock("@/lib/tournaments/selectRelevantTournaments", () => ({
  selectRelevantTournaments: vi.fn(),
}));

vi.mock("@/config/tournaments", () => ({
  TOURNAMENT_IDS: ["828791"],
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

      vi.mocked(redis.get)
        .mockResolvedValueOnce(JSON.stringify(index))          // tournaments:index
        .mockResolvedValueOnce(JSON.stringify(tournament));    // tournament:828791
      vi.mocked(selectRelevantTournaments).mockReturnValue(index);

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(data).toEqual([tournament]);
    });

    it("returns 500 when Redis is down and no fallback", async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis down"));

      const response = await GET(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch tournaments" });
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
  });
});
