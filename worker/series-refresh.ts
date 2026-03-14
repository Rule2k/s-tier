import { fetchSeriesState } from "./grid/series-state";
import { writeSeriesState, writeSeriesMeta, writeHeartbeat } from "./redis-writer";
import {
  getEligibleSeries,
  getRegistry,
} from "./scheduler";
import {
  tryConsume,
  liveGlobalBucket,
  getLivePerSeriesBucket,
  cleanupPerSeriesBuckets,
  getRemaining,
} from "./rate-limiter";
import { logFastCycle, logError } from "./logger";
import { config } from "./config";

// --- State ---

let cycleNumber = 0;

// --- Series refresh cycle ---

const runRefreshCycle = async (): Promise<void> => {
  cycleNumber++;
  const start = Date.now();

  const fetched: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const eligible: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  let errors = 0;
  let rateLimited = false;
  let budgetExhausted = false;

  try {
    const series = getEligibleSeries();

    for (const { tier } of series) {
      eligible[tier]++;
    }

    const totalEligible = Object.values(eligible).reduce((a, b) => a + b, 0);
    const registrySize = getRegistry().size;
    console.log(`[refresh] Cycle #${cycleNumber} — ${totalEligible} eligible out of ${registrySize} registered (P0: ${eligible.P0}, P1: ${eligible.P1}, P2: ${eligible.P2}, P3: ${eligible.P3}) — budget: ${getRemaining(liveGlobalBucket)}/180`);

    for (const { entry, tier } of series) {
      // Non-blocking: process only what the rate limit allows right now
      if (!tryConsume(liveGlobalBucket) || !tryConsume(getLivePerSeriesBucket(entry.seriesId))) {
        budgetExhausted = true;
        break;
      }

      try {
        const state = await fetchSeriesState(entry.seriesId);

        if (state) {
          entry.state = {
            id: state.seriesId,
            started: state.started,
            finished: state.finished,
            teams: state.teams,
            games: state.games.map((g) => ({
              sequenceNumber: g.sequenceNumber,
              started: g.started,
              finished: g.finished,
              map: { name: g.mapName },
              teams: g.teams.map((t) => ({ score: t.score, side: t.side })),
            })),
          };
          entry.lastFetchedAt = Date.now();
          entry.failCount = 0;
          fetched[tier]++;

          await writeSeriesState(entry.seriesId, state);

          const status = state.finished
            ? "past"
            : state.started
              ? "live"
              : "upcoming";
          await writeSeriesMeta(entry.seriesId, status);
        } else {
          entry.lastFetchedAt = Date.now();
          const scheduled = new Date(entry.gridSeries.startTimeScheduled).getTime();
          if (scheduled < Date.now()) {
            entry.noStateConfirmed = true;
          }
        }
      } catch (error) {
        entry.failCount++;
        entry.lastFetchedAt = Date.now();
        errors++;

        if (isRateLimitError(error)) {
          const headers = (error as any)?.response?.headers;
          const resetSeconds = parseInt(headers?.get?.("x-ratelimit-reset") ?? "60", 10);
          console.log(`[refresh] API rate limited — waiting ${resetSeconds}s`);
          rateLimited = true;
          await new Promise((resolve) => setTimeout(resolve, resetSeconds * 1000));
          break;
        }

        // Log first non-rate-limit error per cycle
        if (errors <= 3) {
          const msg = error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200);
          console.log(`[refresh] Error on series ${entry.seriesId}: ${msg}`);
        }
      }
    }

    // Cleanup per-series buckets for finished series
    const activeIds = new Set<string>();
    for (const entry of getRegistry().values()) {
      if (!entry.state?.finished) activeIds.add(entry.seriesId);
    }
    cleanupPerSeriesBuckets(activeIds);

    await writeHeartbeat();

    const totalFetched = Object.values(fetched).reduce((a, b) => a + b, 0);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const stopReason = rateLimited ? "rate-limited" : budgetExhausted ? "budget-exhausted" : "done";
    console.log(`[refresh] Cycle #${cycleNumber} finished in ${duration}s — fetched: ${totalFetched}, errors: ${errors}, stop: ${stopReason} — budget: ${getRemaining(liveGlobalBucket)}/180`);
  } catch (error) {
    logError(`Series refresh cycle #${cycleNumber} failed`, error);
  }
};

// --- Helpers ---

const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("429")
      || msg.includes("too many requests")
      || msg.includes("rate limit")
      || msg.includes("enhance_your_calm");
  }
  return false;
};

// --- Public ---

const scheduleNext = () => {
  setTimeout(async () => {
    await runRefreshCycle().catch((err) => logError("Series refresh loop unhandled error", err));
    scheduleNext();
  }, config.seriesRefresh.intervalMs);
};

export const startSeriesRefreshLoop = async (): Promise<void> => {
  console.log("[refresh] Starting series refresh loop");
  await runRefreshCycle();
  console.log("[refresh] First cycle complete, scheduling next");
  scheduleNext();
};
