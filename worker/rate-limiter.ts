import type { TokenBucket } from "./types/rate-limiter";

export const createBucket = (
  maxTokens: number,
  refillPerMinute: number,
): TokenBucket => ({
  tokens: maxTokens,
  maxTokens,
  refillRate: refillPerMinute / 60_000,
  lastRefill: Date.now(),
});

const refill = (bucket: TokenBucket, now = Date.now()): void => {
  const elapsed = now - bucket.lastRefill;
  if (elapsed <= 0) return;

  bucket.tokens = Math.min(
    bucket.maxTokens,
    bucket.tokens + elapsed * bucket.refillRate,
  );
  bucket.lastRefill = now;
};

export const tryConsume = (bucket: TokenBucket): boolean => {
  refill(bucket);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
};

const msUntilToken = (bucket: TokenBucket): number => {
  refill(bucket);

  if (bucket.tokens >= 1) return 0;

  const deficit = 1 - bucket.tokens;
  return Math.ceil(deficit / bucket.refillRate);
};

const MAX_WAIT_MS = 30_000;

export const waitForToken = async (bucket: TokenBucket): Promise<void> => {
  if (tryConsume(bucket)) return;

  const waitMs = Math.min(msUntilToken(bucket), MAX_WAIT_MS);
  await new Promise((resolve) => setTimeout(resolve, waitMs));

  if (!tryConsume(bucket)) {
    throw new Error(
      `[rate-limiter] Failed to acquire token after ${waitMs}ms wait`,
    );
  }
};

export const drainBucket = (bucket: TokenBucket): void => {
  bucket.tokens = 0;
  bucket.lastRefill = Date.now();
};

export const getTokenCount = (bucket: TokenBucket): number => {
  refill(bucket);
  return Math.floor(bucket.tokens);
};

// --- Singleton instances ---

// Central Data: 20 req/min, cap at 18 (10% margin)
export const centralBucket = createBucket(18, 20);

// Live Series State (global): 180 req/min, cap at 162 (10% margin)
export const liveGlobalBucket = createBucket(162, 180);

// Live Series State (per series): 6 req/min, cap at 5 (margin)
const livePerSeriesBuckets = new Map<string, TokenBucket>();

export const getLivePerSeriesBucket = (seriesId: string): TokenBucket => {
  let bucket = livePerSeriesBuckets.get(seriesId);
  if (!bucket) {
    bucket = createBucket(5, 6);
    livePerSeriesBuckets.set(seriesId, bucket);
  }
  return bucket;
};

export const cleanupPerSeriesBuckets = (
  activeSeriesIds: Set<string>,
): number => {
  let removed = 0;
  for (const [id] of livePerSeriesBuckets) {
    if (!activeSeriesIds.has(id)) {
      livePerSeriesBuckets.delete(id);
      removed++;
    }
  }
  return removed;
};

export const getPerSeriesBucketsSize = (): number =>
  livePerSeriesBuckets.size;
