import { buildTimelineColumns } from "./buildTimelineColumns";
import { makeSerie } from "@/test/fixtures/matches";
import type { Serie } from "@/types/match";

const makeTimelineSerie = (overrides: Partial<Serie> = {}): Serie =>
  makeSerie({
    stages: [],
    ...overrides,
  });

describe("buildTimelineColumns", () => {
  it("puts non-overlapping series in separate columns", () => {
    const series = [
      makeTimelineSerie({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-05T00:00:00Z" }),
      makeTimelineSerie({ id: "2", beginAt: "2025-06-10T00:00:00Z", endAt: "2025-06-15T00:00:00Z" }),
    ];

    const columns = buildTimelineColumns(series);
    expect(columns).toHaveLength(2);
    expect(columns[0].series).toHaveLength(1);
    expect(columns[1].series).toHaveLength(1);
  });

  it("puts overlapping series in the same column", () => {
    const series = [
      makeTimelineSerie({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-10T00:00:00Z" }),
      makeTimelineSerie({ id: "2", beginAt: "2025-06-08T00:00:00Z", endAt: "2025-06-15T00:00:00Z" }),
    ];

    const columns = buildTimelineColumns(series);
    expect(columns).toHaveLength(1);
    expect(columns[0].series).toHaveLength(2);
  });

  it("handles 3+ overlapping series in a single column", () => {
    const series = [
      makeTimelineSerie({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-20T00:00:00Z" }),
      makeTimelineSerie({ id: "2", beginAt: "2025-06-05T00:00:00Z", endAt: "2025-06-12T00:00:00Z" }),
      makeTimelineSerie({ id: "3", beginAt: "2025-06-10T00:00:00Z", endAt: "2025-06-18T00:00:00Z" }),
    ];

    const columns = buildTimelineColumns(series);
    expect(columns).toHaveLength(1);
    expect(columns[0].series).toHaveLength(3);
  });

  it("creates a new column when a serie starts after the column ends", () => {
    const series = [
      makeTimelineSerie({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-05T00:00:00Z" }),
      makeTimelineSerie({ id: "2", beginAt: "2025-06-03T00:00:00Z", endAt: "2025-06-08T00:00:00Z" }),
      makeTimelineSerie({ id: "3", beginAt: "2025-06-20T00:00:00Z", endAt: "2025-06-25T00:00:00Z" }),
    ];

    const columns = buildTimelineColumns(series);
    expect(columns).toHaveLength(2);
    expect(columns[0].series).toHaveLength(2);
    expect(columns[1].series).toHaveLength(1);
  });

  it("returns empty array for empty input", () => {
    expect(buildTimelineColumns([])).toEqual([]);
  });

  it("puts a single serie in its own column", () => {
    const columns = buildTimelineColumns([makeTimelineSerie()]);
    expect(columns).toHaveLength(1);
    expect(columns[0].series).toHaveLength(1);
  });
});
