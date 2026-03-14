import type { RateLimit } from "./types/rate-limiter";

const WINDOW_MS = 60_000; // 1 minute

export const createRateLimit = (limit: number): RateLimit => ({
  limit,
  windowMs: WINDOW_MS,
  count: 0,
  windowStart: Date.now(),
});

/** Reset the window if it has elapsed. */
const maybeResetWindow = (rl: RateLimit, now = Date.now()): void => {
  if (now - rl.windowStart >= rl.windowMs) {
    rl.count = 0;
    rl.windowStart = now;
  }
};

/** Try to consume 1 request. Returns true if allowed. */
export const tryConsume = (rl: RateLimit): boolean => {
  maybeResetWindow(rl);
  if (rl.count < rl.limit) {
    rl.count++;
    return true;
  }
  return false;
};

/** Wait until a request slot is available, then consume it. */
export const waitForToken = async (rl: RateLimit): Promise<void> => {
  maybeResetWindow(rl);
  if (rl.count < rl.limit) {
    rl.count++;
    return;
  }

  // Wait until the current window resets
  const waitMs = rl.windowMs - (Date.now() - rl.windowStart);
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  maybeResetWindow(rl);
  rl.count++;
};

/** How many requests remain in the current window. */
export const getRemaining = (rl: RateLimit): number => {
  maybeResetWindow(rl);
  return Math.max(0, rl.limit - rl.count);
};

/** Force the limit to be reached (e.g. after an API 429). */
export const drainBucket = (rl: RateLimit): void => {
  rl.count = rl.limit;
};

// Keep old name for logger compatibility
export const getTokenCount = getRemaining;

// --- Singleton instances ---

/** Central Data API: 20 req/min */
export const centralBucket = createRateLimit(20);

/** Live Series State API (global): 180 req/min */
export const liveGlobalBucket = createRateLimit(180);

/** Live Series State API (per series): 6 req/min */
const livePerSeriesBuckets = new Map<string, RateLimit>();

export const getLivePerSeriesBucket = (seriesId: string): RateLimit => {
  let rl = livePerSeriesBuckets.get(seriesId);
  if (!rl) {
    rl = createRateLimit(6);
    livePerSeriesBuckets.set(seriesId, rl);
  }
  return rl;
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
