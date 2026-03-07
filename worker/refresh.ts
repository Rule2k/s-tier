import redis from "../src/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL, getSerieTtl } from "../src/lib/redis/keys";
import {
  fetchSeriesIndex,
  fetchSerieWithMatches,
  selectRelevantSeries,
} from "../src/lib/pandascore/fetchSeries";

const REFRESH_INTERVAL = 60_000; // 60 seconds

const refreshSeries = async () => {
  try {
    const pandaSeries = await fetchSeriesIndex();
    await redis.set(CACHE_KEYS.SERIES_INDEX, JSON.stringify(pandaSeries), "EX", CACHE_TTL.INDEX);
    console.log(`[worker] Cached index (${pandaSeries.length} series)`);

    const relevant = selectRelevantSeries(pandaSeries, 5);
    const results = await Promise.all(
      relevant.map(async (pandaSerie) => {
        const serie = await fetchSerieWithMatches(pandaSerie);
        if (!serie) return null;

        const ttl = getSerieTtl(serie);
        await redis.set(CACHE_KEYS.serieById(serie.id), JSON.stringify(serie), "EX", ttl);
        return serie;
      }),
    );

    const cached = results.filter(Boolean);
    console.log(`[worker] Cached ${cached.length} series individually`);
  } catch (error) {
    console.error("[worker] Refresh failed:", error);
  }
};

// Run immediately on startup, then every minute
refreshSeries();
setInterval(refreshSeries, REFRESH_INTERVAL);
console.log(`[worker] Started — refreshing every ${REFRESH_INTERVAL / 1000}s`);
