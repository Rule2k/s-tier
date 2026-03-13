import { getUniqueTeams } from "../getUniqueTeams";
import { makeMatch, makeTournament } from "@/test/fixtures/matches";

describe("getUniqueTeams", () => {
  it("returns unique teams sorted by name", () => {
    const tournaments = [
      makeTournament({
        matches: [
          makeMatch(),
          makeMatch({
            id: "2",
            teams: [
              {
                name: "MOUZ",
                shortName: "MOUZ",
                logoUrl: "https://img.test/mouz.png",
                score: 1,
                isWinner: false,
              },
              {
                name: "Navi",
                shortName: "NAVI",
                logoUrl: "https://img.test/navi.png",
                score: 2,
                isWinner: true,
              },
            ],
          }),
        ],
      }),
    ];

    expect(getUniqueTeams(tournaments)).toEqual([
      { name: "MOUZ", imageUrl: "https://img.test/mouz.png" },
      { name: "Navi", imageUrl: "https://img.test/navi.png" },
      { name: "Team Alpha", imageUrl: "https://img.grid.gg/team-alpha.png" },
      { name: "Team Bravo", imageUrl: "https://img.grid.gg/team-bravo.png" },
    ]);
  });
});
