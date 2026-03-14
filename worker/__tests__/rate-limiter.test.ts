import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createRateLimit,
  tryConsume,
  waitForToken,
  drainBucket,
  getRemaining,
  cleanupPerSeriesBuckets,
  getLivePerSeriesBucket,
  getPerSeriesBucketsSize,
} from "../rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createRateLimit", () => {
    it("initializes with zero count", () => {
      const rl = createRateLimit(10);
      expect(rl.count).toBe(0);
      expect(rl.limit).toBe(10);
    });
  });

  describe("tryConsume", () => {
    it("consumes a request when under limit", () => {
      const rl = createRateLimit(5);
      expect(tryConsume(rl)).toBe(true);
      expect(getRemaining(rl)).toBe(4);
    });

    it("fails when limit is reached", () => {
      const rl = createRateLimit(2);
      expect(tryConsume(rl)).toBe(true);
      expect(tryConsume(rl)).toBe(true);
      expect(tryConsume(rl)).toBe(false);
    });

    it("resets after window elapses", () => {
      const rl = createRateLimit(2);
      tryConsume(rl);
      tryConsume(rl);
      expect(tryConsume(rl)).toBe(false);

      // Advance past the 1-minute window
      vi.advanceTimersByTime(60_000);
      expect(tryConsume(rl)).toBe(true);
      expect(getRemaining(rl)).toBe(1);
    });
  });

  describe("waitForToken", () => {
    it("resolves immediately when under limit", async () => {
      const rl = createRateLimit(5);
      await waitForToken(rl);
      expect(getRemaining(rl)).toBe(4);
    });

    it("waits for next window when limit is reached", async () => {
      const rl = createRateLimit(1);
      tryConsume(rl); // use the one allowed request

      const promise = waitForToken(rl);

      // Advance past the window
      vi.advanceTimersByTime(60_000);
      await promise;

      expect(rl.count).toBe(1); // consumed in the new window
    });
  });

  describe("drainBucket", () => {
    it("sets count to limit so no more requests are allowed", () => {
      const rl = createRateLimit(10);
      drainBucket(rl);
      expect(getRemaining(rl)).toBe(0);
      expect(tryConsume(rl)).toBe(false);
    });
  });

  describe("window behavior", () => {
    it("allows full limit per window", () => {
      const rl = createRateLimit(20);
      let consumed = 0;
      while (tryConsume(rl)) consumed++;
      expect(consumed).toBe(20);
    });

    it("resets fully after window", () => {
      const rl = createRateLimit(20);
      while (tryConsume(rl)); // drain

      vi.advanceTimersByTime(60_000);
      expect(getRemaining(rl)).toBe(20);
    });
  });

  describe("per-series buckets", () => {
    it("creates a bucket on first access", () => {
      const rl = getLivePerSeriesBucket("series-new-test");
      expect(rl.limit).toBe(6);
      expect(getPerSeriesBucketsSize()).toBeGreaterThanOrEqual(1);
    });

    it("returns the same bucket on subsequent access", () => {
      const a = getLivePerSeriesBucket("series-stable-test");
      const b = getLivePerSeriesBucket("series-stable-test");
      expect(a).toBe(b);
    });

    it("cleans up inactive buckets", () => {
      const sizeBefore = getPerSeriesBucketsSize();
      getLivePerSeriesBucket("series-cleanup-active");
      getLivePerSeriesBucket("series-cleanup-inactive");
      expect(getPerSeriesBucketsSize()).toBe(sizeBefore + 2);

      const active = new Set(["series-cleanup-active", "series-new-test", "series-stable-test"]);
      const removed = cleanupPerSeriesBuckets(active);

      expect(removed).toBe(1);
      expect(getLivePerSeriesBucket("series-cleanup-active").limit).toBe(6);
    });
  });
});
