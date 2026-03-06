import redis from "../src/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL } from "../src/lib/redis/keys";
import { fetchSeriesFromPandaScore } from "../src/lib/pandascore/fetchSeries";

const REFRESH_INTERVAL = 60_000; // 60 seconds

const refreshSeries = async () => {
  try {
    const series = await fetchSeriesFromPandaScore();
    await redis.set(CACHE_KEYS.SERIES, JSON.stringify(series), "EX", CACHE_TTL);
    console.log(`[worker] Cached ${series.length} series`);
  } catch (error) {
    console.error("[worker] Refresh failed:", error);
    await redis.expire(CACHE_KEYS.SERIES, CACHE_TTL).catch(() => {});
  }
};

// Run immediately on startup, then every minute
refreshSeries();
setInterval(refreshSeries, REFRESH_INTERVAL);
console.log(`[worker] Started — refreshing every ${REFRESH_INTERVAL / 1000}s`);
