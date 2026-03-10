import { filterTournamentsByTeam } from "../filterTournamentsByTeam";
import { makeMatch, makeTournament } from "@/test/fixtures/matches";

describe("filterTournamentsByTeam", () => {
  it("keeps only tournaments and matches containing the selected team", () => {
    const targetMatch = makeMatch({
      id: "1",
      teams: [
        { name: "Navi", shortName: "NAVI", logoUrl: null, score: 2, isWinner: true },
        { name: "G2", shortName: "G2", logoUrl: null, score: 1, isWinner: false },
      ],
    });
    const otherMatch = makeMatch({
      id: "2",
      teams: [
        { name: "Vitality", shortName: "VIT", logoUrl: null, score: 2, isWinner: true },
        { name: "Spirit", shortName: "SPI", logoUrl: null, score: 0, isWinner: false },
      ],
    });
    const tournaments = [
      makeTournament({ id: "1", matches: [targetMatch, otherMatch] }),
      makeTournament({ id: "2", matches: [otherMatch] }),
    ];

    expect(filterTournamentsByTeam(tournaments, "Navi")).toEqual([
      {
        ...tournaments[0],
        allMatches: tournaments[0].matches,
        matches: [targetMatch],
      },
    ]);
  });
});
