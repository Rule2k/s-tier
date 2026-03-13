import { findAdjacentTournamentSummary } from "../findAdjacentTournamentSummary";
import { makeTournamentSummary } from "@/test/fixtures/matches";

describe("findAdjacentTournamentSummary", () => {
  const sortedIndex = [
    makeTournamentSummary({ id: "1", startDate: "2025-03-01T00:00:00Z" }),
    makeTournamentSummary({ id: "2", startDate: "2025-03-10T00:00:00Z" }),
    makeTournamentSummary({ id: "3", startDate: "2025-03-20T00:00:00Z" }),
  ];

  it("finds the closest unloaded previous summary", () => {
    expect(
      findAdjacentTournamentSummary({
        direction: "previous",
        loadedIds: new Set(["2"]),
        sortedIndex,
        boundaryStartDate: "2025-03-10T00:00:00Z",
      }),
    ).toEqual(sortedIndex[0]);
  });

  it("finds the closest unloaded next summary", () => {
    expect(
      findAdjacentTournamentSummary({
        direction: "next",
        loadedIds: new Set(["2"]),
        sortedIndex,
        boundaryStartDate: "2025-03-10T00:00:00Z",
      }),
    ).toEqual(sortedIndex[2]);
  });
});
