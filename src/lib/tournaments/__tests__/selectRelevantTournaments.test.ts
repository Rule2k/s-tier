import { selectRelevantTournaments } from "../selectRelevantTournaments";
import { makeTournamentSummary } from "@/test/fixtures/matches";

describe("selectRelevantTournaments", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("centers around the current tournament when possible", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-10T12:00:00Z"));

    const tournaments = [
      makeTournamentSummary({ id: "1", startDate: "2025-03-01T00:00:00Z", endDate: "2025-03-03T00:00:00Z" }),
      makeTournamentSummary({ id: "2", startDate: "2025-03-08T00:00:00Z", endDate: "2025-03-12T00:00:00Z" }),
      makeTournamentSummary({ id: "3", startDate: "2025-03-14T00:00:00Z", endDate: "2025-03-16T00:00:00Z" }),
      makeTournamentSummary({ id: "4", startDate: "2025-03-20T00:00:00Z", endDate: "2025-03-22T00:00:00Z" }),
    ];

    expect(selectRelevantTournaments(tournaments, 3).map((tournament) => tournament.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("falls back to the closest tournament when none is current", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-18T12:00:00Z"));

    const tournaments = [
      makeTournamentSummary({ id: "1", startDate: "2025-03-01T00:00:00Z", endDate: "2025-03-03T00:00:00Z" }),
      makeTournamentSummary({ id: "2", startDate: "2025-03-08T00:00:00Z", endDate: "2025-03-10T00:00:00Z" }),
      makeTournamentSummary({ id: "3", startDate: "2025-03-20T00:00:00Z", endDate: "2025-03-22T00:00:00Z" }),
      makeTournamentSummary({ id: "4", startDate: "2025-03-24T00:00:00Z", endDate: "2025-03-26T00:00:00Z" }),
    ];

    expect(selectRelevantTournaments(tournaments, 3).map((tournament) => tournament.id)).toEqual([
      "2",
      "3",
      "4",
    ]);
  });
});
