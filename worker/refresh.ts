import redis from "../src/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL } from "../src/lib/redis/keys";
import { fetchMatchesFromPandaScore } from "../src/lib/pandascore/fetchMatches";

const REFRESH_INTERVAL = 60_000; // 60 seconds

const refreshMatches = async () => {
  try {
    const matches = await fetchMatchesFromPandaScore();
    await redis.set(CACHE_KEYS.MATCHES, JSON.stringify(matches), "EX", CACHE_TTL);
    console.log(`[worker] Cached ${matches.length} matches`);
  } catch (error) {
    console.error("[worker] Refresh failed:", error);
    // Even if fetching fails, we can try to extend the existing cache TTL to avoid immediate expiration
    await redis.expire(CACHE_KEYS.MATCHES, CACHE_TTL).catch(() => {});
  }
};

// Run immediately on startup, then every minute
refreshMatches();
setInterval(refreshMatches, REFRESH_INTERVAL);
console.log(`[worker] Started — refreshing every ${REFRESH_INTERVAL / 1000}s`);
