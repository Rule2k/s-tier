import { describe, it, expect, beforeEach } from "vitest";
import {
  classifyTier,
  upsertSeries,
  getEligibleSeries,
  getTierCounts,
  getSeriesForTournament,
  clearRegistry,
  getRegistry,
  removeSeriesNotIn,
  TIER_INTERVALS,
} from "../scheduler";
import type { SeriesEntry } from "../types/scheduler";

// Inline Grid types — will be replaced by worker/grid/ types in Phase 1
type GridSeries = SeriesEntry["gridSeries"];
type GridSeriesState = NonNullable<SeriesEntry["state"]>;

const makeGridSeries = (
  id: string,
  startTimeScheduled: string,
  tournamentId = "t1",
): GridSeries => ({
  id,
  startTimeScheduled,
  format: { nameShortened: "Bo3" },
  tournament: {
    id: tournamentId,
    name: "Test Tournament",
    nameShortened: "TT",
    logoUrl: "https://example.com/logo.png",
  },
  teams: [],
});

const makeState = (
  overrides: Partial<GridSeriesState> = {},
): GridSeriesState => ({
  id: "1",
  started: false,
  finished: false,
  teams: [],
  games: [],
  ...overrides,
});

describe("scheduler", () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe("classifyTier", () => {
    const now = new Date("2026-03-12T12:00:00Z").getTime();

    it("returns SKIP for finished series", () => {
      const state = makeState({ finished: true, started: true });
      expect(classifyTier(state, "2026-03-12T11:00:00Z", now)).toBe("SKIP");
    });

    it("returns P0 for started & not finished (live)", () => {
      const state = makeState({ started: true, finished: false });
      expect(classifyTier(state, "2026-03-12T11:00:00Z", now)).toBe("P0");
    });

    it("returns P3 for scheduled in the past with no state (backfill)", () => {
      expect(classifyTier(null, "2026-03-12T11:00:00Z", now)).toBe("P3");
    });

    it("returns P1 for upcoming within 30 min", () => {
      // 15 min from now
      expect(classifyTier(null, "2026-03-12T12:15:00Z", now)).toBe("P1");
    });

    it("returns P2 for upcoming within 24h", () => {
      // 5 hours from now
      expect(classifyTier(null, "2026-03-12T17:00:00Z", now)).toBe("P2");
    });

    it("returns P3 for upcoming > 24h", () => {
      // 3 days from now
      expect(classifyTier(null, "2026-03-15T12:00:00Z", now)).toBe("P3");
    });

    it("returns P1 for exactly 30 min boundary", () => {
      expect(classifyTier(null, "2026-03-12T12:30:00Z", now)).toBe("P1");
    });
  });

  describe("registry", () => {
    it("inserts a new entry", () => {
      const gs = makeGridSeries("s1", "2026-03-12T12:00:00Z");
      const entry = upsertSeries("t1", gs);
      expect(entry.seriesId).toBe("s1");
      expect(entry.state).toBeNull();
      expect(entry.lastFetchedAt).toBe(0);
      expect(getRegistry().size).toBe(1);
    });

    it("updates existing entry metadata without resetting state", () => {
      const gs = makeGridSeries("s1", "2026-03-12T12:00:00Z");
      const entry = upsertSeries("t1", gs);
      entry.state = makeState({ id: "s1", started: true });
      entry.lastFetchedAt = 1000;

      // Upsert again with updated metadata
      const gs2 = makeGridSeries("s1", "2026-03-12T13:00:00Z");
      const updated = upsertSeries("t1", gs2);

      expect(updated.state?.started).toBe(true);
      expect(updated.lastFetchedAt).toBe(1000);
      expect(updated.gridSeries.startTimeScheduled).toBe("2026-03-12T13:00:00Z");
    });

    it("removes series not in active set", () => {
      upsertSeries("t1", makeGridSeries("s1", "2026-03-12T12:00:00Z"));
      upsertSeries("t1", makeGridSeries("s2", "2026-03-12T12:00:00Z"));
      upsertSeries("t1", makeGridSeries("s3", "2026-03-12T12:00:00Z"));

      const removed = removeSeriesNotIn(new Set(["s1", "s3"]));
      expect(removed).toBe(1);
      expect(getRegistry().size).toBe(2);
    });

    it("gets series by tournament", () => {
      upsertSeries("t1", makeGridSeries("s1", "2026-03-12T12:00:00Z", "t1"));
      upsertSeries("t2", makeGridSeries("s2", "2026-03-12T12:00:00Z", "t2"));
      upsertSeries("t1", makeGridSeries("s3", "2026-03-12T12:00:00Z", "t1"));

      const t1Series = getSeriesForTournament("t1");
      expect(t1Series).toHaveLength(2);
      expect(t1Series.map((e) => e.seriesId).sort()).toEqual(["s1", "s3"]);
    });
  });

  describe("getEligibleSeries", () => {
    const now = new Date("2026-03-12T12:00:00Z").getTime();

    it("returns never-fetched past series as P3 backfill", () => {
      const gs = makeGridSeries("s1", "2026-03-12T11:50:00Z"); // 10min ago = P3 backfill
      upsertSeries("t1", gs);

      const eligible = getEligibleSeries(now);
      expect(eligible).toHaveLength(1);
      expect(eligible[0].tier).toBe("P3");
    });

    it("does not return recently-fetched series", () => {
      const gs = makeGridSeries("s1", "2026-03-12T17:00:00Z"); // P2 = 10min interval
      const entry = upsertSeries("t1", gs);
      entry.lastFetchedAt = now - 5 * 60_000; // 5min ago, less than P2 interval

      const eligible = getEligibleSeries(now);
      expect(eligible).toHaveLength(0);
    });

    it("returns stale series that exceeded interval", () => {
      const gs = makeGridSeries("s1", "2026-03-12T17:00:00Z"); // P2
      const entry = upsertSeries("t1", gs);
      entry.lastFetchedAt = now - 11 * 60_000; // 11min ago, exceeds P2 10min interval

      const eligible = getEligibleSeries(now);
      expect(eligible).toHaveLength(1);
    });

    it("skips finished series", () => {
      const gs = makeGridSeries("s1", "2026-03-12T10:00:00Z");
      const entry = upsertSeries("t1", gs);
      entry.state = makeState({ id: "s1", started: true, finished: true });

      const eligible = getEligibleSeries(now);
      expect(eligible).toHaveLength(0);
    });

    it("sorts P0 before P1 before P2 before P3", () => {
      // P0 — live
      const e0 = upsertSeries("t1", makeGridSeries("live", "2026-03-12T11:50:00Z"));
      e0.state = makeState({ id: "live", started: true });

      // P1 — 20 min from now
      upsertSeries("t1", makeGridSeries("soon", "2026-03-12T12:20:00Z"));

      // P2 — 5 hours
      upsertSeries("t1", makeGridSeries("today", "2026-03-12T17:00:00Z"));

      // P3 — 3 days
      upsertSeries("t1", makeGridSeries("future", "2026-03-15T12:00:00Z"));

      const eligible = getEligibleSeries(now);
      expect(eligible.map((e) => e.tier)).toEqual(["P0", "P1", "P2", "P3"]);
    });

    it("within same tier, most stale first", () => {
      const e1 = upsertSeries("t1", makeGridSeries("s1", "2026-03-12T17:00:00Z")); // P2
      const e2 = upsertSeries("t1", makeGridSeries("s2", "2026-03-12T18:00:00Z")); // P2
      e1.lastFetchedAt = now - 15 * 60_000; // 15min ago
      e2.lastFetchedAt = now - 20 * 60_000; // 20min ago — more stale

      const eligible = getEligibleSeries(now);
      expect(eligible[0].entry.seriesId).toBe("s2"); // more stale first
    });

    it("demotes to P3 after 10 consecutive failures", () => {
      const gs = makeGridSeries("s1", "2026-03-12T11:50:00Z"); // normally P0
      const entry = upsertSeries("t1", gs);
      entry.state = makeState({ id: "s1", started: true });
      entry.failCount = 10;
      entry.lastFetchedAt = now - TIER_INTERVALS.P3 - 1; // stale enough for P3

      const eligible = getEligibleSeries(now);
      expect(eligible).toHaveLength(1);
      expect(eligible[0].tier).toBe("P3");
    });

    it("applies exponential backoff on failures", () => {
      const gs = makeGridSeries("s1", "2026-03-12T11:50:00Z"); // P0
      const entry = upsertSeries("t1", gs);
      entry.state = makeState({ id: "s1", started: true });
      entry.failCount = 3; // 2^3 * 15s = 120s backoff
      entry.lastFetchedAt = now - 60_000; // 60s ago — less than 120s backoff

      const eligible = getEligibleSeries(now);
      expect(eligible).toHaveLength(0); // not eligible yet

      // 121s ago → should be eligible
      entry.lastFetchedAt = now - 121_000;
      const eligible2 = getEligibleSeries(now);
      expect(eligible2).toHaveLength(1);
    });
  });

  describe("getTierCounts", () => {
    it("counts series by tier", () => {
      const now = new Date("2026-03-12T12:00:00Z").getTime();

      // P0 — live
      const e = upsertSeries("t1", makeGridSeries("live", "2026-03-12T11:50:00Z"));
      e.state = makeState({ id: "live", started: true });

      // SKIP — finished
      const f = upsertSeries("t1", makeGridSeries("done", "2026-03-12T10:00:00Z"));
      f.state = makeState({ id: "done", started: true, finished: true });

      // P3 — future
      upsertSeries("t1", makeGridSeries("far", "2026-03-15T12:00:00Z"));

      const counts = getTierCounts(now);
      expect(counts.P0).toBe(1);
      expect(counts.SKIP).toBe(1);
      expect(counts.P3).toBe(1);
      expect(counts.P1).toBe(0);
      expect(counts.P2).toBe(0);
    });
  });
});
