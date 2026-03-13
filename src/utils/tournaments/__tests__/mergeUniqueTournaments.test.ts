import { mergeUniqueTournaments } from "../mergeUniqueTournaments";
import { makeTournament } from "@/test/fixtures/matches";

describe("mergeUniqueTournaments", () => {
  it("keeps the first occurrence of each tournament id", () => {
    const first = makeTournament({ id: "1" });
    const duplicate = makeTournament({ id: "1", name: "Duplicate" });
    const second = makeTournament({ id: "2" });

    expect(mergeUniqueTournaments([first, duplicate, second])).toEqual([first, second]);
  });
});
