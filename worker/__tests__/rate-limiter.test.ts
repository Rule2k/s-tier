import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createBucket,
  tryConsume,
  waitForToken,
  drainBucket,
  getTokenCount,
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

  describe("createBucket", () => {
    it("initializes with max tokens", () => {
      const bucket = createBucket(10, 60);
      expect(bucket.tokens).toBe(10);
      expect(bucket.maxTokens).toBe(10);
      expect(bucket.refillRate).toBe(60 / 60_000); // 1 per second
    });
  });

  describe("tryConsume", () => {
    it("consumes a token when available", () => {
      const bucket = createBucket(5, 60);
      expect(tryConsume(bucket)).toBe(true);
      expect(getTokenCount(bucket)).toBe(4);
    });

    it("fails when bucket is empty", () => {
      const bucket = createBucket(2, 60);
      expect(tryConsume(bucket)).toBe(true);
      expect(tryConsume(bucket)).toBe(true);
      expect(tryConsume(bucket)).toBe(false);
    });

    it("can drain all tokens one by one", () => {
      const bucket = createBucket(3, 60);
      expect(tryConsume(bucket)).toBe(true);
      expect(tryConsume(bucket)).toBe(true);
      expect(tryConsume(bucket)).toBe(true);
      expect(tryConsume(bucket)).toBe(false);
    });
  });

  describe("refill", () => {
    it("refills tokens over time", () => {
      const bucket = createBucket(10, 60); // 1 token/sec
      // Drain all
      for (let i = 0; i < 10; i++) tryConsume(bucket);
      expect(getTokenCount(bucket)).toBe(0);

      // Advance 3 seconds → should have 3 tokens
      vi.advanceTimersByTime(3000);
      expect(getTokenCount(bucket)).toBe(3);
    });

    it("does not exceed maxTokens", () => {
      const bucket = createBucket(5, 60);
      // Already full, advance time
      vi.advanceTimersByTime(60_000);
      expect(getTokenCount(bucket)).toBe(5);
    });

    it("refills fractionally", () => {
      const bucket = createBucket(10, 60); // 1/sec
      for (let i = 0; i < 10; i++) tryConsume(bucket);

      vi.advanceTimersByTime(500); // 0.5 tokens — floor → 0
      expect(getTokenCount(bucket)).toBe(0);

      vi.advanceTimersByTime(500); // 1.0 tokens total
      expect(getTokenCount(bucket)).toBe(1);
    });
  });

  describe("waitForToken", () => {
    it("resolves immediately when tokens are available", async () => {
      const bucket = createBucket(5, 60);
      await waitForToken(bucket);
      expect(getTokenCount(bucket)).toBe(4);
    });

    it("waits for refill when bucket is empty", async () => {
      const bucket = createBucket(1, 60); // 1/sec
      tryConsume(bucket); // drain it

      const promise = waitForToken(bucket);

      // Advance past the refill time (1 second for 1 token at 60/min)
      vi.advanceTimersByTime(1100);
      await promise;

      // Token was consumed by waitForToken
      expect(getTokenCount(bucket)).toBe(0);
    });
  });

  describe("drainBucket", () => {
    it("empties all tokens", () => {
      const bucket = createBucket(10, 60);
      drainBucket(bucket);
      expect(getTokenCount(bucket)).toBe(0);
      expect(tryConsume(bucket)).toBe(false);
    });
  });

  describe("burst behavior", () => {
    it("allows burst up to maxTokens", () => {
      const bucket = createBucket(18, 20); // central bucket config
      let consumed = 0;
      while (tryConsume(bucket)) consumed++;
      expect(consumed).toBe(18);
    });

    it("recovers after burst", () => {
      const bucket = createBucket(18, 20); // 20/min = 1 per 3s
      while (tryConsume(bucket)); // drain

      vi.advanceTimersByTime(3000); // ~1 token
      expect(getTokenCount(bucket)).toBe(1);

      vi.advanceTimersByTime(57_000); // 60s total → 20 tokens but capped at 18
      expect(getTokenCount(bucket)).toBe(18);
    });
  });

  describe("per-series buckets", () => {
    it("creates a bucket on first access", () => {
      const bucket = getLivePerSeriesBucket("series-new-test");
      expect(bucket.maxTokens).toBe(5);
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

      // Keep only the active one + all previously created ones
      const active = new Set(["series-cleanup-active", "series-new-test", "series-stable-test"]);
      const removed = cleanupPerSeriesBuckets(active);

      expect(removed).toBe(1); // only series-cleanup-inactive removed
      expect(getLivePerSeriesBucket("series-cleanup-active").maxTokens).toBe(5);
    });
  });
});
