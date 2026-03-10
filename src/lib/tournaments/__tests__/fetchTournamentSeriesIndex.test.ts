import { fetchTournamentSeriesIndex } from "../fetchTournamentSeriesIndex";
import { makeGridSeries } from "@/test/fixtures/matches";

vi.mock("@/lib/grid/fetchTournaments", () => ({
  fetchTournamentSeries: vi.fn(),
}));

import { fetchTournamentSeries } from "@/lib/grid/fetchTournaments";

describe("fetchTournamentSeriesIndex", () => {
  it("returns summaries and series grouped by tournament id", async () => {
    vi.mocked(fetchTournamentSeries)
      .mockResolvedValueOnce([
        makeGridSeries({ id: "1", startTimeScheduled: "2025-03-01T18:00:00Z" }),
      ])
      .mockResolvedValueOnce([
        makeGridSeries({ id: "2", startTimeScheduled: "2025-03-10T18:00:00Z" }),
      ]);

    const result = await fetchTournamentSeriesIndex(["t1", "t2"]);

    expect(result.summaries).toHaveLength(2);
    expect(result.seriesByTournamentId.get("t1")).toHaveLength(1);
    expect(result.seriesByTournamentId.get("t2")).toHaveLength(1);
  });
});
