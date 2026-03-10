import { getSeriesStateStatus } from "../getSeriesStateStatus";
import { makeGridSeriesState } from "@/test/fixtures/matches";

describe("getSeriesStateStatus", () => {
  it("returns finished for finished states", () => {
    expect(getSeriesStateStatus(makeGridSeriesState({ finished: true }))).toBe("finished");
  });

  it("returns running for started but unfinished states", () => {
    expect(getSeriesStateStatus(makeGridSeriesState({ started: true, finished: false }))).toBe("running");
  });

  it("returns not_started otherwise", () => {
    expect(getSeriesStateStatus(makeGridSeriesState({ started: false, finished: false }))).toBe("not_started");
  });
});
