import { getSeriesTeamsLabel } from "../getSeriesTeamsLabel";
import { makeGridSeries } from "@/test/fixtures/matches";

describe("getSeriesTeamsLabel", () => {
  it("uses shortened names when available", () => {
    expect(getSeriesTeamsLabel(makeGridSeries())).toBe("TA vs TB");
  });
});
