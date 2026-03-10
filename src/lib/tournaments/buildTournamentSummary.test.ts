import { buildTournamentSummary } from "./buildTournamentSummary";
import { makeGridSeries } from "@/test/fixtures/matches";

describe("buildTournamentSummary", () => {
  it("returns null for an empty series list", () => {
    expect(buildTournamentSummary("1", [])).toBeNull();
  });

  it("builds a summary from the earliest and latest scheduled times", () => {
    const summary = buildTournamentSummary("828791", [
      makeGridSeries({ id: "1", startTimeScheduled: "2025-03-10T18:00:00Z" }),
      makeGridSeries({ id: "2", startTimeScheduled: "2025-03-01T18:00:00Z" }),
      makeGridSeries({ id: "3", startTimeScheduled: "2025-03-15T18:00:00Z" }),
    ]);

    expect(summary).toEqual({
      id: "828791",
      name: "ESL Pro League Season 23",
      logoUrl: "https://img.grid.gg/esl-pro-league.png",
      startDate: "2025-03-01T18:00:00.000Z",
      endDate: "2025-03-15T18:00:00.000Z",
    });
  });
});
