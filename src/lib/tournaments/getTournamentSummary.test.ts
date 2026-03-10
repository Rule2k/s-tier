import { getTournamentSummary } from "./getTournamentSummary";
import { makeMatch } from "@/test/fixtures/matches";

describe("getTournamentSummary", () => {
  it("returns match count and formatted date range", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-03-01T10:00:00Z" }),
      makeMatch({ id: "2", scheduledAt: "2025-03-15T20:00:00Z" }),
    ];

    expect(getTournamentSummary(matches)).toEqual({
      matchCount: 2,
      dateRange: "March 1 - March 15",
    });
  });
});
