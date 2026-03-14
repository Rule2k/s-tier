import { fetchSeriesState } from "./grid/series-state";
import { writeSeriesState, writeSeriesMeta, writeHeartbeat } from "./redis-writer";
import {
  getEligibleSeries,
  getRegistry,
  classifyTier,
} from "./scheduler";
import {
  waitForToken,
  liveGlobalBucket,
  getLivePerSeriesBucket,
  drainBucket,
  cleanupPerSeriesBuckets,
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

  try {
    const series = getEligibleSeries();

    for (const { tier } of series) {
      eligible[tier]++;
    }

    for (const { entry, tier } of series) {
      await waitForToken(liveGlobalBucket);
      await waitForToken(getLivePerSeriesBucket(entry.seriesId));

      try {
        const state = await fetchSeriesState(entry.seriesId);

        if (state) {
          // Update scheduler registry
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

          // Write to Redis
          await writeSeriesState(entry.seriesId, state);

          // Determine status label for meta
          const status = state.finished
            ? "past"
            : state.started
              ? "live"
              : "upcoming";
          await writeSeriesMeta(entry.seriesId, status);
        } else {
          entry.lastFetchedAt = Date.now();
          // API returned null — if the series is in the past, it won't ever have state
          const scheduled = new Date(entry.gridSeries.startTimeScheduled).getTime();
          if (scheduled < Date.now()) {
            entry.noStateConfirmed = true;
          }
        }
      } catch (error) {
        entry.failCount++;
        entry.lastFetchedAt = Date.now();

        if (isRateLimitError(error)) {
          const headers = (error as any)?.response?.headers;
          const resetSeconds = parseInt(headers?.get?.("x-ratelimit-reset") ?? "60", 10);
          const totalFetched = Object.values(fetched).reduce((a, b) => a + b, 0);
          console.log(`[refresh] Rate limited after ${totalFetched} fetches — waiting ${resetSeconds}s`);

          await new Promise((resolve) => setTimeout(resolve, resetSeconds * 1000));
          break;
        }
      }
    }

    // Cleanup per-series buckets for finished series
    const activeIds = new Set<string>();
    for (const entry of getRegistry().values()) {
      if (!entry.state?.finished) activeIds.add(entry.seriesId);
    }
    cleanupPerSeriesBuckets(activeIds);

    // Heartbeat
    await writeHeartbeat();

    // Log (only if there was something to do)
    const totalEligible = Object.values(eligible).reduce((a, b) => a + b, 0);
    if (totalEligible > 0) {
      logFastCycle({
        cycleNumber,
        durationMs: Date.now() - start,
        fetched: fetched as { P0: number; P1: number; P2: number; P3: number },
        eligible: eligible as { P0: number; P1: number; P2: number; P3: number },
      });
    }
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
  // Initial run
  await runRefreshCycle();

  // Then repeat — setTimeout ensures next cycle waits for previous to finish
  scheduleNext();
};
