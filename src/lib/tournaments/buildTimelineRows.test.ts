import { buildTimelineRows } from "./buildTimelineRows";
import type { Tournament } from "./groupByTournament";

const makeTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: "1",
  name: "Tournament",
  tier: "s",
  slug: "tournament",
  region: null,
  beginAt: "2025-06-10T10:00:00Z",
  endAt: "2025-06-15T20:00:00Z",
  matches: [],
  ...overrides,
});

describe("buildTimelineRows", () => {
  it("puts non-overlapping tournaments in separate rows", () => {
    const tournaments = [
      makeTournament({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-05T00:00:00Z" }),
      makeTournament({ id: "2", beginAt: "2025-06-10T00:00:00Z", endAt: "2025-06-15T00:00:00Z" }),
    ];

    const rows = buildTimelineRows(tournaments);
    expect(rows).toHaveLength(2);
    expect(rows[0].tournaments).toHaveLength(1);
    expect(rows[1].tournaments).toHaveLength(1);
  });

  it("puts overlapping tournaments in the same row", () => {
    const tournaments = [
      makeTournament({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-10T00:00:00Z" }),
      makeTournament({ id: "2", beginAt: "2025-06-08T00:00:00Z", endAt: "2025-06-15T00:00:00Z" }),
    ];

    const rows = buildTimelineRows(tournaments);
    expect(rows).toHaveLength(1);
    expect(rows[0].tournaments).toHaveLength(2);
  });

  it("handles 3+ overlapping tournaments in a single row", () => {
    const tournaments = [
      makeTournament({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-20T00:00:00Z" }),
      makeTournament({ id: "2", beginAt: "2025-06-05T00:00:00Z", endAt: "2025-06-12T00:00:00Z" }),
      makeTournament({ id: "3", beginAt: "2025-06-10T00:00:00Z", endAt: "2025-06-18T00:00:00Z" }),
    ];

    const rows = buildTimelineRows(tournaments);
    expect(rows).toHaveLength(1);
    expect(rows[0].tournaments).toHaveLength(3);
  });

  it("creates a new row when a tournament starts after the row ends", () => {
    const tournaments = [
      makeTournament({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-05T00:00:00Z" }),
      makeTournament({ id: "2", beginAt: "2025-06-03T00:00:00Z", endAt: "2025-06-08T00:00:00Z" }),
      makeTournament({ id: "3", beginAt: "2025-06-20T00:00:00Z", endAt: "2025-06-25T00:00:00Z" }),
    ];

    const rows = buildTimelineRows(tournaments);
    expect(rows).toHaveLength(2);
    expect(rows[0].tournaments).toHaveLength(2);
    expect(rows[1].tournaments).toHaveLength(1);
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
