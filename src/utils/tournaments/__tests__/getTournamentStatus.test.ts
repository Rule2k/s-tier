import { getTournamentStatus } from "../getTournamentStatus";
import { makeMatch } from "@/test/fixtures/matches";

describe("getTournamentStatus", () => {
  it("returns live when at least one match is running", () => {
    const matches = [
      makeMatch({ id: "1", status: "running" }),
      makeMatch({ id: "2", status: "finished" }),
    ];

    expect(getTournamentStatus(matches)).toEqual({ type: "live", count: 1 });
  });

  it("returns in_progress when finished and upcoming matches coexist", () => {
    const matches = [
      makeMatch({ id: "1", status: "finished" }),
      makeMatch({ id: "2", status: "not_started" }),
    ];

    expect(getTournamentStatus(matches)).toEqual({ type: "in_progress" });
  });

  it("returns finished with the winner from the latest match", () => {
    const matches = [
      makeMatch({
        id: "1",
        status: "finished",
        scheduledAt: "2025-06-15T15:00:00Z",
        teams: [
          { name: "Team A", shortName: "A", logoUrl: null, score: 2, isWinner: true },
          { name: "Team B", shortName: "B", logoUrl: null, score: 1, isWinner: false },
        ],
      }),
      makeMatch({
        id: "2",
        status: "finished",
        scheduledAt: "2025-06-16T15:00:00Z",
        teams: [
          { name: "Navi", shortName: "NAVI", logoUrl: "https://img.test/navi.png", score: 2, isWinner: true },
          { name: "G2", shortName: "G2", logoUrl: null, score: 0, isWinner: false },
        ],
      }),
    ];

    expect(getTournamentStatus(matches)).toEqual({
      type: "finished",
      winner: { name: "Navi", logoUrl: "https://img.test/navi.png" },
    });
  });
});
