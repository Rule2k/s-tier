import { getMapWinnerIndex } from "./getMapWinnerIndex";
import { makeMapScore } from "@/test/fixtures/matches";

describe("getMapWinnerIndex", () => {
  it("returns null for maps that are not finished", () => {
    expect(getMapWinnerIndex(makeMapScore({ status: "running" }))).toBeNull();
  });

  it("returns the winning team index for a finished map", () => {
    expect(getMapWinnerIndex(makeMapScore({ scores: [13, 9] }))).toBe(0);
    expect(getMapWinnerIndex(makeMapScore({ scores: [10, 13] }))).toBe(1);
  });
});
