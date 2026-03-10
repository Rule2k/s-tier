import { buildTimelineRows } from "../buildTimelineRows";
import { makeTournament, makeMatch } from "@/test/fixtures/matches";
import type { Tournament } from "@/types/match";

const makeTimelineTournament = (id: string, startDate: string, endDate: string): Tournament =>
  makeTournament({
    id,
    matches: [
      makeMatch({ scheduledAt: startDate }),
      makeMatch({ id: `${id}-last`, scheduledAt: endDate }),
    ],
  });

describe("buildTimelineRows", () => {
  it("puts non-overlapping tournaments in separate rows", () => {
    const tournaments = [
      makeTimelineTournament("1", "2025-06-01T00:00:00Z", "2025-06-05T00:00:00Z"),
      makeTimelineTournament("2", "2025-06-10T00:00:00Z", "2025-06-15T00:00:00Z"),
    ];

    const rows = buildTimelineRows(tournaments);
    expect(rows).toHaveLength(2);
    expect(rows[0].tournaments).toHaveLength(1);
    expect(rows[1].tournaments).toHaveLength(1);
  });

  it("puts overlapping tournaments in the same row", () => {
    const tournaments = [
      makeTimelineTournament("1", "2025-06-01T00:00:00Z", "2025-06-10T00:00:00Z"),
      makeTimelineTournament("2", "2025-06-08T00:00:00Z", "2025-06-15T00:00:00Z"),
    ];

    const rows = buildTimelineRows(tournaments);
    expect(rows).toHaveLength(1);
    expect(rows[0].tournaments).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(buildTimelineRows([])).toEqual([]);
  });

  it("puts a single tournament in its own row", () => {
    const rows = buildTimelineRows([makeTournament()]);
    expect(rows).toHaveLength(1);
    expect(rows[0].tournaments).toHaveLength(1);
  });
});
