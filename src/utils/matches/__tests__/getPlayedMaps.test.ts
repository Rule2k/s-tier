import { getPlayedMaps } from "../getPlayedMaps";
import { makeMapScore } from "@/test/fixtures/matches";

describe("getPlayedMaps", () => {
  it("keeps only running and finished maps", () => {
    const maps = [
      makeMapScore({ mapNumber: 1, status: "finished" }),
      makeMapScore({ mapNumber: 2, status: "running" }),
      makeMapScore({ mapNumber: 3, status: "not_started" }),
    ];

    expect(getPlayedMaps(maps)).toEqual(maps.slice(0, 2));
  });
});
